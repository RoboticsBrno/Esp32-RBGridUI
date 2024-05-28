#pragma once

#include <atomic>
#include <memory>
#include <vector>

#include <freertos/FreeRTOS.h>
#include <freertos/timers.h>

#include "esp_timer.h"

#include "rbwebserver.h"

#include "builder/arm.h"
#include "builder/bar.h"
#include "builder/button.h"
#include "builder/camera.h"
#include "builder/checkbox.h"
#include "builder/circle.h"
#include "builder/input.h"
#include "builder/joystick.h"
#include "builder/led.h"
#include "builder/orientation.h"
#include "builder/select.h"
#include "builder/slider.h"
#include "builder/spinedit.h"
#include "builder/switcher.h"
#include "builder/text.h"

#include "gridui_version.h"

namespace rb {
class Protocol;
};

namespace gridui {

class WidgetState;

not_found_response_t webserverNotFoundCallback(const char *request_path);

class _GridUi {
    friend class WidgetState;

public:
    _GridUi();
    ~_GridUi();

    void begin(rb::Protocol* protocol, int cols = 12, int rows = 18, bool enableSplitting = true);

    // Simplified variant of begin() that:
    // * Creates rb::Protocol with both UDP and WebSocket enabled
    // * Calls start() on it
    // * Calls rb_web_start
    // * Calls begin()
    rb::Protocol* begin(const char* owner, const char* deviceName);

    // Simplified variant of begin() that:
    // * Connects to WiFi network
    // * Creates rb::Protocol with both UDP and WebSocket enabled
    // * Calls start() on it
    // * Calls rb_web_start
    // * Calls begin()
    rb::Protocol* beginConnect(const char* owner, const char* deviceName, const char* wifiSSID, const char* wifiPassword = "");

    // Simplified variant of begin() that:
    // * Connects to WiFi network
    // * Creates rb::Protocol with both UDP and WebSocket enabled
    // * Calls start() on it
    // * Calls rb_web_start
    // * If withCaptivePortal == true (default), starts up DNS server so that devices will automatically open the controller on connection.
    // * Calls begin()
    rb::Protocol* beginStartAp(const char* owner, const char* deviceName, const char* wifiSSID, const char* wifiPassword = "", bool withCaptivePortal = true);

    void commit();

    // Deinitializes GridUi. Frees the protocol, if it was created by GridUI and not by the app.
    void end();

    bool handleRbPacket(const std::string& command, rbjson::Object* pkt);

    rb::Protocol* protocol() const { return m_protocol.load(); }

    void changeTab(uint16_t index);

    builder::Arm& arm(float x, float y, float w, float h, uint16_t uuid = 0, uint16_t tab = 0) {
        return *newWidget<builder::Arm>(x, y, w, h, uuid, tab);
    }

    builder::Bar& bar(float x, float y, float w, float h, uint16_t uuid = 0, uint16_t tab = 0) {
        return *newWidget<builder::Bar>(x, y, w, h, uuid, tab);
    }

    builder::Button& button(float x, float y, float w, float h, uint16_t uuid = 0, uint16_t tab = 0) {
        return *newWidget<builder::Button>(x, y, w, h, uuid, tab);
    }

    builder::Camera& camera(float x, float y, float w, float h, uint16_t uuid = 0, uint16_t tab = 0) {
        return *newWidget<builder::Camera>(x, y, w, h, uuid, tab);
    }

    builder::Checkbox& checkbox(float x, float y, float w, float h, uint16_t uuid = 0, uint16_t tab = 0) {
        return *newWidget<builder::Checkbox>(x, y, w, h, uuid, tab);
    }

    builder::Circle& circle(float x, float y, float w, float h, uint16_t uuid = 0, uint16_t tab = 0) {
        return *newWidget<builder::Circle>(x, y, w, h, uuid, tab);
    }

    builder::Input& input(float x, float y, float w, float h, uint16_t uuid = 0, uint16_t tab = 0) {
        return *newWidget<builder::Input>(x, y, w, h, uuid, tab);
    }

    builder::Joystick& joystick(float x, float y, float w, float h, uint16_t uuid = 0, uint16_t tab = 0) {
        return *newWidget<builder::Joystick>(x, y, w, h, uuid, tab);
    }

    builder::Led& led(float x, float y, float w, float h, uint16_t uuid = 0, uint16_t tab = 0) {
        return *newWidget<builder::Led>(x, y, w, h, uuid, tab);
    }

    builder::Orientation& orientation(float x, float y, float w, float h, uint16_t uuid = 0, uint16_t tab = 0) {
        return *newWidget<builder::Orientation>(x, y, w, h, uuid, tab);
    }

    builder::Slider& slider(float x, float y, float w, float h, uint16_t uuid = 0, uint16_t tab = 0) {
        return *newWidget<builder::Slider>(x, y, w, h, uuid, tab);
    }

    builder::SpinEdit& spinedit(float x, float y, float w, float h, uint16_t uuid = 0, uint16_t tab = 0) {
        return *newWidget<builder::SpinEdit>(x, y, w, h, uuid, tab);
    }

    builder::Switcher& switcher(float x, float y, float w, float h, uint16_t uuid = 0, uint16_t tab = 0) {
        auto* switcher = newWidget<builder::Switcher>(x, y, w, h, uuid, tab);
        switcher->addCallback("changed", [&](gridui::Switcher& w) {
            changeTab(w.value());
        });
        return *switcher;
    }

    builder::Text& text(float x, float y, float w, float h, uint16_t uuid = 0, uint16_t tab = 0) {
        return *newWidget<builder::Text>(x, y, w, h, uuid, tab);
    }

    builder::Select& select(float x, float y, float w, float h, uint16_t uuid = 0, uint16_t tab = 0) {
        return *newWidget<builder::Select>(x, y, w, h, uuid, tab);
    }

    template <typename T>
    T* newWidget(float x, float y, float w, float h, uint16_t uuid, uint16_t tab) {
        static_assert(std::is_base_of<builder::Widget, T>::value, "T must inherit from builder::Widget.");

        std::lock_guard<std::mutex> l(m_states_mu);

        if (!checkUuidFreeLocked(uuid))
            uuid = generateUuidLocked();

        auto* state = new WidgetState(uuid, x, y, w, h, tab);
        m_states.emplace_back(std::unique_ptr<WidgetState>(state));

        auto* widget = new T(T::name(), *state);
        m_widgets.push_back(std::unique_ptr<T>(widget));
        return widget;
    }

private:
    inline WidgetState* stateByUuidLocked(uint16_t uuid) const {
        for (auto& itr : m_states) {
            if (itr->uuid() == uuid) {
                return itr.get();
            }
        }
        return nullptr;
    }

    static void stateChangeTask(void* self);
    static void tabChangeTask(void* self);

    void notifyStateChange() {
        m_states_modified = true;
    }

    uint16_t generateUuidLocked() const;
    inline bool checkUuidFreeLocked(uint16_t uuid) const {
        return uuid != 0 && stateByUuidLocked(uuid) == nullptr;
    }

    std::vector<std::unique_ptr<builder::Widget>> m_widgets;
    std::vector<std::unique_ptr<WidgetState>> m_states;

    std::atomic<rb::Protocol*> m_protocol;
    bool m_protocol_ours;

    std::unique_ptr<rbjson::Object> m_layout;
    esp_timer_handle_t m_update_timer;
    TaskHandle_t m_web_server_task;

    mutable std::mutex m_states_mu;
    uint32_t m_state_mustarrive_id;
    std::atomic<bool> m_states_modified;

    mutable std::mutex m_tab_mu;
    std::atomic<bool> m_tab_changed;
    uint16_t m_tab;
};

extern _GridUi UI;

};
