#include <stdio.h>
#include <esp_log.h>

#include "widget.h"

#define TAG "UiBuilderWidget"

namespace gridui {
namespace builder {

Widget::Widget(const char *type, WidgetState& state, float x, float y, float w, float h) :
    m_state(state), m_type(type), m_x(x), m_y(y), m_w(w), m_h(h), m_style(nullptr)
{
    
}

Widget::~Widget() {

}

rbjson::Object& Widget::extra() {
    return m_state.data();
}

rbjson::Object& Widget::style() {
    auto *res = extra().getObject("css");
    if(res == nullptr) {
        res = new rbjson::Object;
        extra().set("css", res);
    }
    return *res;
}

rbjson::Object *Widget::serializeAndDestroy() {
    extra().set("x", m_x);
    extra().set("y", m_y);
    extra().set("w", m_w);
    extra().set("h", m_h);

    std::unique_ptr<rbjson::Object> root(new rbjson::Object);
    root->set("uuid", m_state.uuid());
    root->set("type", m_type);
    root->set("state", extra().copy());
    return root.release();
}

};

};
