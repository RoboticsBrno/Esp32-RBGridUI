#pragma once

#include <stdint.h>

#include "rbjson.h"

namespace gridui {

class _GridUi;

namespace builder {
    class Widget;

    template<typename Self, typename Finished>
    class BuilderMixin;
};

class WidgetState {
    friend class gridui::builder::Widget;
    friend class gridui::_GridUi;

    template<typename Self, typename Finished>
    friend class builder::BuilderMixin;
public:
    WidgetState(uint16_t uuid, std::function<void(void *, WidgetState *)> cb_trampoline) :
        m_uuid(uuid), m_cb_trampoline(cb_trampoline) {}

    uint16_t uuid() const { return m_uuid; }
    const rbjson::Object& data() const { return m_data; }

    bool set(const char *key, rbjson::Value *value, bool mustarrive = true);

private:
    WidgetState(const WidgetState&) = delete;
    WidgetState& operator=(const WidgetState&) = delete;

    rbjson::Object& data() { return m_data; }

    void update(rbjson::Object *other) {
        for(auto itr : other->members()) {
            m_data.set(itr.first.c_str(), itr.second->copy());
        }
    }

    std::unordered_map<std::string, void*>& callbacks() { return m_callbacks; }

    void call(const std::string& event) {
        auto itr = m_callbacks.find(event);
        if(itr != m_callbacks.end()) {
            m_cb_trampoline(itr->second, this);
        }
    }

    rbjson::Object m_data;
    uint16_t m_uuid;
    std::function<void(void *, WidgetState *)> m_cb_trampoline;
    std::unordered_map<std::string, void*> m_callbacks;
};


class Widget {
public:
    Widget() : m_state(&emptyState) {}

    Widget(const Widget&& o) : m_state(o.m_state) {}

    Widget& operator=(const Widget&& o) {
        m_state = o.m_state;
        return *this;
    }

    void css(const char *name, const char *value) {
        auto *style = new rbjson::Object;
        style->set(name, value);
        m_state->set("style", style);
    }

protected:
    Widget(WidgetState *state) : m_state(state) {
    }

    Widget(const Widget&) = delete;
    Widget& operator=(const Widget&) = delete;

    const rbjson::Object& data() const { return static_cast<const WidgetState*>(m_state)->data(); }

    WidgetState *m_state;

private:
    static WidgetState emptyState;
};

};
