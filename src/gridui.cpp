#include <esp_log.h>
#include <stdio.h>

#include "gridui.h"
#include "rbwebserver.h"

namespace gridui {

_GridUi UI;

_GridUi::_GridUi()
    : m_protocol(nullptr) {
}

_GridUi::~_GridUi() {
}

void _GridUi::begin(rb::Protocol* protocol, int cols, int rows, bool enableSplitting) {
    m_protocol = protocol;

    m_layout.reset(new rbjson::Object);
    m_layout->set("cols", cols);
    m_layout->set("rows", rows);
    m_layout->set("enableSplitting", new rbjson::Bool(enableSplitting));
}

uint16_t _GridUi::generateUuid() const {
    while (1) {
        const uint32_t rnd = esp_random();
        if (checkUuidFree(rnd & 0xFFFF))
            return rnd & 0xFFFF;
        if (checkUuidFree(rnd >> 16))
            return rnd >> 16;
    }
}

bool _GridUi::checkUuidFree(uint16_t uuid) const {
    return uuid != 0 && stateByUuid(uuid) == nullptr;
}

void _GridUi::commit() {
    if (!m_layout) {
        ESP_LOGE("GridUI", "commit() called with no layout prepared!");
        return;
    }

    std::vector<char> layout_json;
    {
        std::stringstream ss;
        m_layout->serialize(ss);
        m_layout.reset();

        ss.seekp(-1, std::stringstream::cur);

        ss << ",\"widgets\": [";
        for (size_t i = 0; i < m_widgets.size(); ++i) {
            if (i != 0) {
                ss << ",";
            }
            auto& w = m_widgets[i];
            w->serializeAndDestroy(ss);
            w.reset();
        }
        m_widgets.clear();
        m_widgets.shrink_to_fit();
        m_states.shrink_to_fit();

        ss << "]}";

        layout_json.resize(((size_t)ss.tellp()) + 1);
        ss.get(layout_json.data(), layout_json.size());
    }

    rb_web_add_file("layout.json", layout_json.data(), layout_json.size() - 1);
}

bool _GridUi::handleRbPacket(const std::string& cmd, rbjson::Object* pkt) {
    if (cmd == "_gev") {
        auto *state = stateByUuid(pkt->getInt("id"));
        if (state == nullptr)
            return true;

        auto* st = pkt->getObject("st");
        if (st != nullptr) {
            state->update(st);
        }

        state->call(pkt->getString("ev"));
    } else if (cmd == "_gall") {
        for (auto& itr : m_states) {
            if (itr->wasChanged())
                itr->sendAll();
        }
        return false;
    } else {
        return false;
    }
    return true;
}

};
