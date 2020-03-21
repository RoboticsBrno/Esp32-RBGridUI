#include <memory>

#include "rbprotocol.h"
#include "../gridui.h"
#include "widget.h"

namespace gridui {

WidgetState Widget::emptyState(0);

bool WidgetState::set(const char *key, rbjson::Value *value, bool mustarrive) {
    const auto *old = m_data.get(key);
    if(old != nullptr && old->equals(*value)) {
        delete value;
        return false;
    }

    m_data.set(key, value);

    auto *prot = UI.protocol();
    if(prot != nullptr) {
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

    return true;
}

};
