#include <esp_log.h>
#include <esp_timer.h>
#include <stdio.h>

#include "gridui.h"
#include "rbprotocol.h"
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

    esp_timer_create_args_t args = {
        .callback = stateChangeTask,
        .arg = this,
        .dispatch_method = ESP_TIMER_TASK,
        .name = "gridui_state",
    };
    esp_timer_handle_t timer;
    esp_timer_create(&args, &timer);
    esp_timer_start_periodic(timer, 100 * 1000);
}

bool _GridUi::handleRbPacket(const std::string& cmd, rbjson::Object* pkt) {
    if (cmd == "_gev") {
        auto* state = stateByUuid(pkt->getInt("id"));
        if (state == nullptr)
            return true;

        auto* st = pkt->getObject("st");
        if (st != nullptr) {
            state->update(st);
        }

        state->call(pkt->getString("ev"));
    } else if (cmd == "_gall") {
        bool changed = false;
        for (auto& itr : m_states) {
            if (itr->remarkAllChanges())
                changed = true;
        }
        if (changed) {
            notifyStateChange();
        }
        return false;
    } else {
        return false;
    }
    return true;
}

void _GridUi::stateChangeTask(void* selfVoid) {
    auto* self = (_GridUi*)selfVoid;

    bool expected = true;
    if (!self->m_states_modified.compare_exchange_strong(expected, false))
        return;

    auto* prot = self->protocol();
    if (prot == nullptr)
        return;

    std::unique_ptr<rbjson::Object> pkt(new rbjson::Object);
    {
        char buf[6];
        std::unique_ptr<rbjson::Object> state(new rbjson::Object);
        const size_t size = self->m_states.size();
        for (size_t i = 0; i < size; ++i) {
            auto& s = self->m_states[i];
            if (s->popChanges(*state.get())) {
                snprintf(buf, sizeof(buf), "%d", (int)s->uuid());
                pkt->set(buf, state.release());
                state.reset(new rbjson::Object);
            }
        }
    }

    prot->send_mustarrive("_gst", pkt.release());
}
};
