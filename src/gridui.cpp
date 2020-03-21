#include <stdio.h>
#include <esp_log.h>

#include "gridui.h"
#include "rbwebserver.h"

namespace gridui {

_GridUi UI;

_GridUi::_GridUi() : m_uuid_counter(1), m_protocol(nullptr) {

}

_GridUi::~_GridUi() {
}

void _GridUi::begin(rb::Protocol *protocol, int cols, int rows, bool enableSplitting) {
    m_protocol = protocol;

    m_layout.reset(new rbjson::Object);
    m_layout->set("cols", cols);
    m_layout->set("rows", rows);
    m_layout->set("enableSplitting", new rbjson::Bool(enableSplitting));
}

void _GridUi::commit() {
    if(!m_layout) {
        ESP_LOGE("GridUI", "commit() called with no layout prepared!");
        return;
    }

    auto *widgets = new rbjson::Array;
    m_layout->set("widgets", widgets);

    for(auto& w : m_widgets) {
        m_callbacks.insert(w->callbacks().begin(), w->callbacks().end());
        widgets->push_back(w->serializeAndDestroy());
        delete w.release();
    }
    m_widgets.clear();
    m_widgets.shrink_to_fit();

    const auto layout_json = m_layout->str();
    m_layout.reset(nullptr);

    rb_web_add_file("layout.json", layout_json.c_str(), layout_json.size());
}

bool _GridUi::handleRbPacket(const std::string& cmd, rbjson::Object *pkt) {
    if(cmd == "_gev") {
        auto src = pkt->getString("src");
        const auto cb = m_callbacks.find(src);
        if(cb != m_callbacks.end()) {
            cb->second();
        }
    } else if(cmd == "_gui") {

    } else {
        return false;
    }
    return true;
}

};
