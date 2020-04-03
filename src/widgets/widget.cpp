#include <memory>

#include "rbprotocol.h"
#include "../gridui.h"
#include "widget.h"

namespace gridui {

WidgetState Widget::emptyState(0, [](void *cb, WidgetState *state) {});

bool WidgetState::set(const char *key, rbjson::Value *value, bool mustarrive) {
    const auto *old = m_data.get(key);
    if(old != nullptr && old->equals(*value)) {
        delete value;
        return false;
    }

    m_data.set(key, value);
    sendValue(key, value, mustarrive);
    return true;
}

bool WidgetState::setInnerObjectProp(const char *objectName, const char *propertyName, rbjson::Value *value, bool mustarrive) {
    auto *obj = m_data.get(objectName);
    if(obj == nullptr) {
        obj = new rbjson::Object;
        m_data.set(objectName, obj);
    } else {
        const auto *old = obj.get(propertyName);
        if(old != nullptr && old->equals(*value)) {
            delete value;
            return false;
        }
    }

    obj->set(propertyName, value);
    sendValue(objectName, obj, mustarrive);
    return true;
}

void WidgetState::sendValue(const char *key, const rbjson::Value *value, bool mustarrive) {
    auto *prot = UI.protocol();
    if(value == nullptr || prot == nullptr)
        return;

    std::unique_ptr<rbjson::Object> pkt(new rbjson::Object);
    pkt->set("id", m_uuid);
    pkt->set("key", key);
    pkt->set("val", value->str());

    if(mustarrive) {
        prot->send_mustarrive("_gui", pkt.release());
    } else {
        prot->send("_gui", pkt.get());
    }
}

};
