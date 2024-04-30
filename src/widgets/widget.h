#pragma once

#include <functional>
#include <map>
#include <mutex>
#include <stdint.h>

#include "rbjson.h"

namespace gridui {

class _GridUi;

namespace builder {
class Widget;

template <typename Self, typename Finished>
class BuilderMixin;
};

class WidgetState;

class CallbacksHolder {
    friend class WidgetState;
public:
    typedef void (*cb_trampoline_t)(void*, WidgetState*);
    typedef void (*cb_deleter_t)(void*);

    ~CallbacksHolder() {
        for(const auto& itr : m_callbacks) {
            m_cb_deleter(itr.second);
        }
    }

    void call(WidgetState* state, const std::string& event) {
        auto itr = m_callbacks.find(event);
        if (itr != m_callbacks.end()) {
            (*m_cb_trampoline)(itr->second, state);
        }
    }

    void add(const std::string& event, void *cb) {
        auto itr = m_callbacks.find(event);
        if(itr != m_callbacks.end()) {
            m_cb_deleter(cb);
            itr->second = cb;
        } else {
            m_callbacks[event] = cb;
        }
    }

private:
    CallbacksHolder(cb_trampoline_t trampoline, cb_deleter_t deleter) : m_cb_trampoline(trampoline), m_cb_deleter(deleter) { }

    CallbacksHolder(const WidgetState&) = delete;
    CallbacksHolder& operator=(const WidgetState&) = delete;

    std::map<std::string, void*> m_callbacks;
    const cb_trampoline_t m_cb_trampoline;
    const cb_deleter_t m_cb_deleter;
};

/**
 *  @defgroup widgets_constructed Layout widgets
 *  Classes in this module are used to modify state of the already constructed Layout.
 */

class WidgetState {
    friend class gridui::builder::Widget;
    friend class gridui::_GridUi;

    template <typename Self, typename Finished>
    friend class builder::BuilderMixin;

public:
    WidgetState(uint16_t uuid, float x, float y, float w, float h, uint16_t tab);

    uint16_t uuid() const { return m_uuid; }
    const rbjson::Object& data() const { return m_data; }

    bool set(const std::string& key, rbjson::Value* value);
    bool setInnerObjectProp(const std::string& objectName, const std::string& propertyName,
        rbjson::Value* value);

    void markChanged(const std::string& key);

private:
    // Each mutex is ~100 bytes of heap allocation. Let's keep just one for this.
    static std::mutex m_mutex;

    WidgetState(const WidgetState&) = delete;
    WidgetState& operator=(const WidgetState&) = delete;

    rbjson::Object& data() { return m_data; }

    void update(rbjson::Object* other) {
        m_mutex.lock();
        for (auto itr : other->members()) {
            m_data.set(itr.first, itr.second->copy());
            markGlobalChangedLocked(itr.first);
        }
        m_mutex.unlock();
    }

    void addCallback(CallbacksHolder::cb_trampoline_t trampoline, CallbacksHolder::cb_deleter_t deleter, const std::string& event, void *cb) {
        if (!m_cb_holder) {
            m_cb_holder.reset(new CallbacksHolder(trampoline, deleter));
        }
        m_cb_holder->add(event, cb);
    }

    void call(const std::string& event) {
        if (!m_cb_holder)
            return;
        m_cb_holder->call(this, event);
    }

    void markChangedLocked(const std::string& key);
    void markGlobalChangedLocked(const std::string& key);
    inline bool wasChangedInTickLocked(const std::string& key) const;

    bool popChanges(rbjson::Object& state);
    bool remarkAllChanges();

    rbjson::Object m_data;
    std::unique_ptr<CallbacksHolder> m_cb_holder;

    const uint16_t m_uuid;

    uint16_t m_bloom_global;
    uint16_t m_bloom_tick;
};

class Widget {
public:
    Widget()
        : m_state(&emptyState) {
    }

    Widget(const Widget&& o)
        : m_state(o.m_state) {
    }

    Widget& operator=(const Widget&& o) {
        m_state = o.m_state;
        return *this;
    }

    uint16_t uuid() const {
        return m_state->uuid();
    }

    void setWidgetX(float val) {
        m_state->set("x", new rbjson::Number(val));
    }

    float widgetX() const {
        return data().getDouble("x");
    }

    void setWidgetY(float val) {
        m_state->set("y", new rbjson::Number(val));
    }

    float widgetY() const {
        return data().getDouble("y");
    }

    void setWidgetW(float val) {
        m_state->set("w", new rbjson::Number(val));
    }

    float widgetW() const {
        return data().getDouble("w");
    }

    void setWidgetH(float val) {
        m_state->set("h", new rbjson::Number(val));
    }

    float widgetH() const {
        return data().getDouble("h");
    }

    void setWidgetTab(uint16_t tab) {
        m_state->set("tab", new rbjson::Number(tab));
    }

    uint16_t widgetTab() const {
        return data().getInt("tab");
    }

    void setCss(const std::string& propertyName, const std::string& value) {
        m_state->setInnerObjectProp("css", propertyName, new rbjson::String(value));
    }

    std::string css(const std::string& propertyName) const {
        auto* css = data().getObject("css");
        if (css == nullptr)
            return "";
        return css->getString(propertyName);
    }

protected:
    Widget(WidgetState* state)
        : m_state(state) {
    }

    Widget(const Widget&) = delete;
    Widget& operator=(const Widget&) = delete;

    const rbjson::Object& data() const { return static_cast<const WidgetState*>(m_state)->data(); }

    WidgetState* m_state;

private:
    static WidgetState emptyState;
};

};
