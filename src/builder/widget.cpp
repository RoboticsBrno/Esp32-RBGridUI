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
    auto *res = extra().getObject("style");
    if(res == nullptr) {
        res = new rbjson::Object;
        extra().set("style", res);
    }
    return *res;
}

rbjson::Object *Widget::serializeAndDestroy() {
    std::unique_ptr<rbjson::Object> root(new rbjson::Object);
    root->set("uuid", m_state.uuid());
    root->set("type", m_type);
    root->set("x", m_x);
    root->set("y", m_y);
    root->set("w", m_w);
    root->set("h", m_h);
    root->set("state", extra().str());
    return root.release();
}

};

};
