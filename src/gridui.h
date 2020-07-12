#pragma once

#include <atomic>
#include <memory>
#include <vector>

#include <freertos/FreeRTOS.h>
#include <freertos/timers.h>

#include "builder/arm.h"
#include "builder/bar.h"
#include "builder/button.h"
#include "builder/checkbox.h"
#include "builder/input.h"
#include "builder/joystick.h"
#include "builder/led.h"
#include "builder/orientation.h"
#include "builder/slider.h"
#include "builder/text.h"

#include "gridui_version.h"

namespace rb {
class Protocol;
};

namespace gridui {

class WidgetState;

class _GridUi {
    friend class WidgetState;

public:
    _GridUi();
    ~_GridUi();

    void begin(rb::Protocol* protocol, int cols = 12, int rows = 18, bool enableSplitting = true);
    void commit();

    bool handleRbPacket(const std::string& command, rbjson::Object* pkt);

    rb::Protocol* protocol() const { return m_protocol.load(); }

    builder::Arm& arm(float x, float y, float w, float h, uint16_t uuid = 0) {
        return *newWidget<builder::Arm>(x, y, w, h, uuid);
    }

    builder::Bar& bar(float x, float y, float w, float h, uint16_t uuid = 0) {
        return *newWidget<builder::Bar>(x, y, w, h, uuid);
    }

    builder::Button& button(float x, float y, float w, float h, uint16_t uuid = 0) {
        return *newWidget<builder::Button>(x, y, w, h, uuid);
    }

    builder::Checkbox& checkbox(float x, float y, float w, float h, uint16_t uuid = 0) {
        return *newWidget<builder::Checkbox>(x, y, w, h, uuid);
    }

    builder::Input& input(float x, float y, float w, float h, uint16_t uuid = 0) {
        return *newWidget<builder::Input>(x, y, w, h, uuid);
    }

    builder::Joystick& joystick(float x, float y, float w, float h, uint16_t uuid = 0) {
        return *newWidget<builder::Joystick>(x, y, w, h, uuid);
    }

    builder::Led& led(float x, float y, float w, float h, uint16_t uuid = 0) {
        return *newWidget<builder::Led>(x, y, w, h, uuid);
    }

    builder::Orientation& orientation(float x, float y, float w, float h, uint16_t uuid = 0) {
        return *newWidget<builder::Orientation>(x, y, w, h, uuid);
    }

    builder::Slider& slider(float x, float y, float w, float h, uint16_t uuid = 0) {
        return *newWidget<builder::Slider>(x, y, w, h, uuid);
    }

    builder::Text& text(float x, float y, float w, float h, uint16_t uuid = 0) {
        return *newWidget<builder::Text>(x, y, w, h, uuid);
    }

private:
    template <typename T>
    T* newWidget(float x, float y, float w, float h, uint16_t uuid) {
        static_assert(std::is_base_of<builder::Widget, T>::value, "T must inherit from builder::Widget.");

        std::lock_guard<std::mutex> l(m_states_mu);

        if (!checkUuidFreeLocked(uuid))
            uuid = generateUuidLocked();

        auto* state = new WidgetState(uuid, x, y, w, h, &T::callbackTrampoline);
        m_states.push_back(std::unique_ptr<WidgetState>(state));

        auto* widget = new T(T::name(), *state);
        m_widgets.push_back(std::unique_ptr<T>(widget));
        return widget;
    }

    inline WidgetState* stateByUuidLocked(uint16_t uuid) const {
        for (auto& itr : m_states) {
            if (itr->uuid() == uuid) {
                return itr.get();
            }
        }
        return nullptr;
    }

    static void stateChangeTask(void* self);

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
    std::unique_ptr<rbjson::Object> m_layout;

    mutable std::mutex m_states_mu;
    uint32_t m_state_mustarrive_id;
    std::atomic<bool> m_states_modified;
};

extern _GridUi UI;

};
