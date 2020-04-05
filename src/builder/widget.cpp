#include <esp_log.h>
#include <stdio.h>

#include "widget.h"

#define TAG "UiBuilderWidget"

namespace gridui {
namespace builder {

Widget::Widget(const char* type, WidgetState& state, float x, float y, float w, float h)
    : m_state(state)
    , m_type(type)
    , m_x(x)
    , m_y(y)
    , m_w(w)
    , m_h(h)
    , m_style(nullptr) {
}

Widget::~Widget() {
}

rbjson::Object& Widget::extra() {
    return m_state.data();
}

rbjson::Object& Widget::style() {
    auto* res = extra().getObject("css");
    if (res == nullptr) {
        res = new rbjson::Object;
        extra().set("css", res);
    }
    return *res;
}

void Widget::serializeAndDestroy(std::stringstream& ss) {
    ss << "{";
    {
        ss << "\"uuid\":" << m_state.uuid() << ",";
        ss << "\"type\":\"" << m_type << "\",";
        ss << "\"state\":";

        auto& ex = extra();
        ex.set("x", m_x);
        ex.set("y", m_y);
        ex.set("w", m_w);
        ex.set("h", m_h);
        ex.serialize(ss);
    }
    ss << "}";
}

};

};
