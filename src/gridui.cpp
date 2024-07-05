#include <esp_log.h>
#include <esp_timer.h>
#include <stdio.h>
#include <fstream>

#include "gridui.h"
#include "rbdns.h"
#include "rbprotocol.h"
#include "rbwebserver.h"
#include "rbwifi.h"

namespace gridui {

_GridUi UI;

static void defaultOnPacketReceived(const std::string& cmd, rbjson::Object* pkt) {
    // Let GridUI handle its packets
    if (UI.handleRbPacket(cmd, pkt))
        return;
    // ignore the rest
}

#ifdef RBGRIDUI_USING_ESP_IDF

extern const uint8_t index_html_start[] asm("_binary_index_html_gz_start");
extern const uint8_t index_html_end[]   asm("_binary_index_html_gz_end");

extern const uint8_t combined_js_start[] asm("_binary_combined_js_gz_start");
extern const uint8_t combined_js_end[]   asm("_binary_combined_js_gz_end");

not_found_response_t webserverNotFoundCallback(const char *request_path) {
    not_found_response_t resp = {};
    if(strcmp(request_path, "/") == 0 || strcmp(request_path, "/index.html") == 0) {
        resp.data = (uint8_t*)index_html_start;
        resp.size = index_html_end - index_html_start;
        resp.is_gzipped = 1;
    } else if(strcmp(request_path, "/combined.js") == 0) {
        resp.data = (uint8_t*)combined_js_start;
        resp.size = combined_js_end - combined_js_start;
        resp.is_gzipped = 1;
    }
    return resp;
}
#else
not_found_response_t webserverNotFoundCallback(const char *request_path) {
    not_found_response_t resp = {};
    return resp;
}
#endif

_GridUi::_GridUi()
    : m_protocol(nullptr)
    , m_protocol_ours(false)
    , m_update_timer(nullptr)
    , m_web_server_task(nullptr)
    , m_state_mustarrive_id(UINT32_MAX)
    , m_states_modified(false) {
}

_GridUi::~_GridUi() {
}

void _GridUi::begin(rb::Protocol* protocol, int cols, int rows, bool enableSplitting) {
    std::lock_guard<std::mutex> l(m_states_mu);
    if (m_protocol != nullptr) {
        ESP_LOGE("GridUI", "begin() called more than once!");
        return;
    }

    m_protocol = protocol;
    m_protocol_ours = false;

    m_layout.reset(new rbjson::Object);
    m_layout->set("cols", cols);
    m_layout->set("rows", rows);
    m_layout->set("enableSplitting", new rbjson::Bool(enableSplitting));
}

rb::Protocol* _GridUi::begin(const char* owner, const char* deviceName) {
    // Start serving the web page
    m_web_server_task = rb_web_start(80);
    if(m_web_server_task == NULL) {
        ESP_LOGE("GridUI", "failed to call rb_web_start");
        return nullptr;
    }

#ifdef RBGRIDUI_USING_ESP_IDF
    rb_web_set_not_found_callback(webserverNotFoundCallback);
#endif

    auto protocol = new rb::Protocol(owner, deviceName, "Compiled at " __DATE__ " " __TIME__, defaultOnPacketReceived);
    protocol->start();

    begin(protocol);
    m_protocol_ours = true;
    return protocol;
}

rb::Protocol* _GridUi::beginConnect(const char* owner, const char* deviceName, const char* wifiSSID, const char* wifiPassword) {
    rb::WiFi::connect(wifiSSID, wifiPassword);
    return begin(owner, deviceName);
}

rb::Protocol* _GridUi::beginStartAp(const char* owner, const char* deviceName, const char* wifiSSID, const char* wifiPassword, bool withCaptivePortal) {
    rb::WiFi::startAp(wifiSSID, wifiPassword);
    if (withCaptivePortal) {
        rb::DnsServer::get().start();
    }
    return begin(owner, deviceName);
}

uint16_t _GridUi::generateUuidLocked() const {
    while (1) {
        const uint32_t rnd = esp_random();
        if (checkUuidFreeLocked(rnd & 0xFFFF))
            return rnd & 0xFFFF;
        if (checkUuidFreeLocked(rnd >> 16))
            return rnd >> 16;
    }
}

void _GridUi::end() {
    auto *protocol = m_protocol.load();
    if(!protocol) {
        ESP_LOGE("GridUI", "end() called when not initialized!");
        return;
    }

    if(m_protocol_ours) {
        protocol->stop();
        delete protocol;
    }
    m_protocol = nullptr;

    if(m_update_timer) {
        esp_timer_stop(m_update_timer);
        esp_timer_delete(m_update_timer);
        m_update_timer = nullptr;
    }

    if(m_web_server_task) {
        rb_web_stop(m_web_server_task);
        m_web_server_task = nullptr;
    }

    {
        std::lock_guard<std::mutex> guard(m_states_mu);
        m_states.clear();
        m_states.shrink_to_fit();
        m_widgets.clear();
        m_widgets.shrink_to_fit();
    }

    m_layout.reset();
    m_state_mustarrive_id = 0;
    m_states_modified = false;
    m_tab_changed = false;
    m_tab = 0;
}

void _GridUi::commit() {
    std::lock_guard<std::mutex> l(m_states_mu);
    if (!m_layout) {
        ESP_LOGE("GridUI", "commit() called with no layout prepared!");
        return;
    }

    {

        char buf[256];

        snprintf(buf, sizeof(buf), "%s/layout.json", rb_web_get_files_root());

        std::ofstream stream;
        stream.rdbuf()->pubsetbuf(buf, sizeof(buf));
        stream.open(buf, std::ofstream::trunc);

        if(stream.fail()) {
            ESP_LOGE("GridUI", "failed to open %s", buf);
            return;
        }

        m_states.shrink_to_fit();

        m_layout->serialize(stream);
        m_layout.reset();

        stream.seekp(-1, std::ofstream::cur);

        stream << ",\"widgets\": [";
        for (size_t i = 0; i < m_widgets.size(); ++i) {
            if (i != 0) {
                stream << ",";
            }

            auto& w = m_widgets[i];
            w->serialize(stream);
            if(strcmp(w->m_type, "Arm") == 0) {
                w->extra().remove("info");
            }
            w.reset();
        }
        m_widgets.clear();
        m_widgets.shrink_to_fit();

        stream << "]}";

        if(stream.fail()) {
            ESP_LOGE("GridUI", "failed to serialize layout");
            return;
        }

        stream.close();
        if(stream.fail()) {
            ESP_LOGE("GridUI", "failed to write layout");
            return;
        }
    }

    esp_timer_create_args_t args = {
        .callback = stateChangeTask,
        .arg = this,
        .dispatch_method = ESP_TIMER_TASK,
        .name = "gridui_state",
#ifdef ESP_IDF_VERSION
        .skip_unhandled_events = false,
#endif
    };

    esp_timer_create(&args, &m_update_timer);
    esp_timer_start_periodic(m_update_timer, 50 * 1000);
}

bool _GridUi::handleRbPacket(const std::string& cmd, rbjson::Object* pkt) {
    if (cmd == "_gev") {
        m_states_mu.lock();
        auto* state = stateByUuidLocked(pkt->getInt("id"));
        if (state == nullptr) {
            m_states_mu.unlock();
            return true;
        }

        auto* st = pkt->getObject("st");
        if (st != nullptr) {
            state->update(st);
        }
        m_states_mu.unlock();

        state->call(pkt->getString("ev"));
    } else if (cmd == "_gall") {
        bool changed = false;
        std::lock_guard<std::mutex> l(m_states_mu);
        for (auto& itr : m_states) {
            if (itr->remarkAllChanges())
                changed = true;
        }
        if (changed) {
            m_states_modified = true;
        }
        m_tab_changed = true;
    } else {
        return false;
    }
    return true;
}

void _GridUi::changeTab(uint16_t index) {
    std::lock_guard<std::mutex> k(m_tab_mu);
    m_tab_changed = true;
    m_tab = index;
}

void _GridUi::stateChangeTask(void* selfVoid) {
    auto* self = (_GridUi*)selfVoid;

    auto* prot = self->protocol();
    if (prot == nullptr || !prot->is_possessed())
        return;

    if (!prot->is_mustarrive_complete(self->m_state_mustarrive_id))
        return;

    if (self->m_states_modified.exchange(false)) {
        std::unique_ptr<rbjson::Object> pkt(new rbjson::Object);
        {
            std::lock_guard<std::mutex> guard(self->m_states_mu);
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
        self->m_state_mustarrive_id = prot->send_mustarrive("_gst", pkt.release());
    }

    if (self->m_tab_changed.exchange(false)) {
        std::lock_guard<std::mutex> lock(self->m_tab_mu);
        std::unique_ptr<rbjson::Object> pkt(new rbjson::Object);

        pkt->set("tab", self->m_tab);

        self->m_state_mustarrive_id = prot->send_mustarrive("_gtb", pkt.release());
    }
}
};
