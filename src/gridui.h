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
#include "builder/joystick.h"
#include "builder/led.h"

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

    builder::Arm& arm(float x, float y, float w, float h) {
        return *newWidget<builder::Arm>(x, y, w, h);
    }

    builder::Bar& bar(float x, float y, float w, float h) {
        return *newWidget<builder::Bar>(x, y, w, h);
    }

    builder::Button& button(float x, float y, float w, float h) {
        return *newWidget<builder::Button>(x, y, w, h);
    }

    builder::Checkbox& checkbox(float x, float y, float w, float h) {
        return *newWidget<builder::Checkbox>(x, y, w, h);
    }

    builder::Joystick& joystick(float x, float y, float w, float h) {
        return *newWidget<builder::Joystick>(x, y, w, h);
    }

    builder::Led& led(float x, float y, float w, float h) {
        return *newWidget<builder::Led>(x, y, w, h);
    }

private:
    template <typename T>
    T* newWidget(float x, float y, float w, float h) {
        static_assert(std::is_base_of<builder::Widget, T>::value, "T must inherit from builder::Widget.");

        const auto uuid = generateUuid();
        auto* state = new WidgetState(uuid, &T::callbackTrampoline);
        m_states.push_back(std::unique_ptr<WidgetState>(state));

        auto* widget = new T(T::name(), *state, x, y, w, h);
        m_widgets.push_back(std::unique_ptr<T>(widget));
        return widget;
    }

    inline WidgetState* stateByUuid(uint16_t uuid) const {
        for (auto& itr : m_states) {
            if (itr->uuid() == uuid) {
                return itr.get();
            }
        }
        return nullptr;
    }

    static void stateChangeTask(TimerHandle_t timer);

    void notifyStateChange() {
        m_states_modified.store(true);
    }

    uint16_t generateUuid() const;
    inline bool checkUuidFree(uint16_t uuid) const;

    std::unique_ptr<rbjson::Object> m_layout;
    std::vector<std::unique_ptr<builder::Widget>> m_widgets;

    std::vector<std::unique_ptr<WidgetState>> m_states;
    std::atomic<rb::Protocol*> m_protocol;

    std::atomic<bool> m_states_modified;
};

extern _GridUi UI;

};
