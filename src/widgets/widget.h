#pragma once

#include <stdint.h>

#include "rbjson.h"

namespace gridui {

namespace builder {
    class Widget;
};

class WidgetState {
    friend class gridui::builder::Widget;
public:
    WidgetState(uint16_t uuid) : m_uuid(uuid) {}

    uint16_t uuid() const { return m_uuid; }
    const rbjson::Object& data() const { return m_data; }

    bool set(const char *key, rbjson::Value *value, bool mustarrive = true);

private:
    WidgetState(const WidgetState&) = delete;
    WidgetState& operator=(const WidgetState&) = delete;

    rbjson::Object& data() { return m_data; }

    rbjson::Object m_data;
    uint16_t m_uuid;
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
