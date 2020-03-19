#include <stdio.h>
#include <esp_log.h>

#include "widget.h"

#define TAG "UiBuilderWidget"

namespace gridui {
namespace builder {

Widget::Widget(const char *type, uint16_t uuid, float x, float y, float w, float h) :
    m_uuid(uuid), m_type(type), m_x(x), m_y(y), m_w(w), m_h(h), m_style(nullptr)
{
    
}

Widget::~Widget() {

}

rbjson::Object& Widget::extra() {
    if(!m_extra) {
        m_extra.reset(new rbjson::Object);
    }
    return *m_extra.get();
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
    root->set("uuid", m_uuid);
    root->set("type", m_type);
    root->set("x", m_x);
    root->set("y", m_y);
    root->set("w", m_w);
    root->set("h", m_h);
    root->set("extra", m_extra.release());
    return root.release();
}

void Widget::css(const char *key, const char *value) {
    style().set(key, value);
}

void Widget::addCallback(const char *name, std::function<void()> cb) {
    char full_name[64];
    if(snprintf(full_name, sizeof(full_name), "%x%s", m_uuid, name) >= sizeof(full_name)) {
        ESP_LOGE(TAG, "the callback event name '%s' is too long, max 60 chars", name);
    }
    m_callbacks[full_name] = cb;
}

};
};
