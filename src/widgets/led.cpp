#include "led.h"
#include "rbprotocol.h"
#include "../gridui.h"

namespace gridui {

void Led::setOn(bool on) {
    auto *prot = UI.protocol();
    if(!prot || m_on == on)
        return;

    m_on = on;
    
    auto *params = new rbjson::Object;
    params->set("id", m_uuid);
    params->set("on", new rbjson::Bool(on));
    prot->send_mustarrive("gev", params);
}

};
