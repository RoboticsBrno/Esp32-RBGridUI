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

class WidgetPos {
    union {
        uint32_t _encoded;
        struct {
            uint8_t _x;
            uint8_t _y;
            uint8_t _w;
            uint8_t _h;
        };
    };

public:
    WidgetPos(uint32_t encoded) {
        _encoded = encoded;
    }
    WidgetPos(float x, float y, float w, float h) {
        _x = x*10.f;
        _y = y*10.f;
        _w = w*10.f;
        _h = h*10.f;
    }
    uint32_t encoded() const { return _encoded; };
    float x() const { return float(_x)/10.f; }
    float y() const { return float(_y)/10.f; }
    float w() const { return float(_w)/10.f; }
    float h() const { return float(_h)/10.f; }
    WidgetPos& setX(float x) { _x = x*10.f; return *this; }
    WidgetPos& setY(float y) { _y = y*10.f; return *this; }
    WidgetPos& setW(float w) { _w = w*10.f; return *this; }
    WidgetPos& setH(float h) { _h = h*10.f; return *this; }
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

    std::string getString(const std::string& key, std::string def = "") const;
    int64_t getInt(const std::string& key, int64_t def = 0) const;
    double getDouble(const std::string& key, double def = 0.0) const;
    bool getBool(const std::string& key, bool def = false) const;

    bool set(const std::string& key, rbjson::Value* value);
    bool setInnerObjectProp(const std::string& objectName, const std::string& propertyName,
        rbjson::Value* value);

    void markChanged(const std::string& key);

    bool hasRegisteredCallbacks() const {
        return bool(m_cb_holder);
    }

    WidgetPos pos() const {
        return WidgetPos(getInt("p"));
    }

    void setPos(const WidgetPos& p) {
        set("p", new rbjson::Number(p.encoded()));
    }

    // Use dataLocked only with sharedStateLock or uniqueStateLock locked.
    // shared is for reads, unique for writes.
    std::unique_lock<std::mutex> uniqueStateLock() {
        return std::unique_lock<std::mutex>(m_mutex);
    }
    const rbjson::Object& dataLocked() const { return m_data; }

private:
    // Each mutex is ~100 bytes of heap allocation. Let's keep just one for this.
    static std::mutex m_mutex;

    WidgetState(const WidgetState&) = delete;
    WidgetState& operator=(const WidgetState&) = delete;

    rbjson::Object& data() { return m_data; }

    void update(rbjson::Object* other) {
        m_mutex.lock();
        for (auto itr : other->members()) {
            const std::string name_str(itr.name, itr.name_len);
            m_data.set(name_str, itr.value->copy());
            markGlobalChangedLocked(name_str);
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
    inline bool wasChangedInTickLocked(const char *key, size_t key_len) const;

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

    Widget(const Widget& o)
        : m_state(o.m_state) {
    }

    Widget& operator=(const Widget&& o) {
        m_state = o.m_state;
        return *this;
    }

    bool hasRegisteredCallbacks() const {
        return m_state->hasRegisteredCallbacks();
    }

    uint16_t uuid() const {
        return m_state->uuid();
    }

    void setWidgetX(float val) {
        m_state->setPos(m_state->pos().setX(val));
    }

    float widgetX() const {
        return m_state->pos().x();
    }

    void setWidgetY(float val) {
        m_state->setPos(m_state->pos().setY(val));
    }

    float widgetY() const {
        return m_state->pos().y();
    }

    void setWidgetW(float val) {
        m_state->setPos(m_state->pos().setW(val));
    }

    float widgetW() const {
        return m_state->pos().w();
    }

    void setWidgetH(float val) {
        m_state->setPos(m_state->pos().setH(val));
    }

    float widgetH() const {
        return m_state->pos().h();
    }

    void setWidgetTab(uint16_t tab) {
        m_state->set("tab", new rbjson::Number(tab));
    }

    uint16_t widgetTab() const {
        return m_state->getInt("tab");
    }

    void setCss(const std::string& propertyName, const std::string& value) {
        m_state->setInnerObjectProp("css", propertyName, new rbjson::String(value));
    }

    std::string css(const std::string& propertyName) const {
        auto lock = m_state->uniqueStateLock();
        auto* css = m_state->dataLocked().getObject("css");
        if (css == nullptr)
            return "";
        return css->getString(propertyName);
    }

protected:
    Widget(WidgetState* state)
        : m_state(state) {
    }

    Widget& operator=(const Widget&) = delete;

    WidgetState* m_state;

private:
    static WidgetState emptyState;
};

};
