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
#include "builder/circle.h"
#include "builder/input.h"
#include "builder/joystick.h"
#include "builder/led.h"
#include "builder/orientation.h"
#include "builder/slider.h"
#include "builder/spinedit.h"
#include "builder/switcher.h"
#include "builder/text.h"
#include "builder/select.h"

#include "gridui_version.h"

namespace rb {
class Protocol;
};

namespace gridui {

class WidgetState;

class _GridUi;

class _GridUi {
    friend class WidgetState;

public:
    _GridUi();
    ~_GridUi();

    void begin(rb::Protocol* protocol, int cols = 12, int rows = 18, bool enableSplitting = true);
    void commit();

    bool handleRbPacket(const std::string& command, rbjson::Object* pkt);

    rb::Protocol* protocol() const { return m_protocol.load(); }

    void changeTab(uint16_t index);

    builder::Arm& arm(float x, float y, float w, float h, uint16_t uuid = 0, uint16_t tab = 0);

    builder::Bar& bar(float x, float y, float w, float h, uint16_t uuid = 0, uint16_t tab = 0);

    builder::Button& button(float x, float y, float w, float h, uint16_t uuid = 0, uint16_t tab = 0);

    builder::Checkbox& checkbox(float x, float y, float w, float h, uint16_t uuid = 0, uint16_t tab = 0);

    builder::Circle& circle(float x, float y, float w, float h, uint16_t uuid = 0, uint16_t tab = 0);

    builder::Input& input(float x, float y, float w, float h, uint16_t uuid = 0, uint16_t tab = 0);

    builder::Joystick& joystick(float x, float y, float w, float h, uint16_t uuid = 0, uint16_t tab = 0);

    builder::Led& led(float x, float y, float w, float h, uint16_t uuid = 0, uint16_t tab = 0);

    builder::Orientation& orientation(float x, float y, float w, float h, uint16_t uuid = 0, uint16_t tab = 0);

    builder::Slider& slider(float x, float y, float w, float h, uint16_t uuid = 0, uint16_t tab = 0);

    builder::SpinEdit& spinedit(float x, float y, float w, float h, uint16_t uuid = 0, uint16_t tab = 0);

    builder::Switcher& switcher(float x, float y, float w, float h, uint16_t uuid = 0, uint16_t tab = 0);

    builder::Text& text(float x, float y, float w, float h, uint16_t uuid = 0, uint16_t tab = 0);

    builder::Select& select(float x, float y, float w, float h, uint16_t uuid = 0, uint16_t tab = 0);

private:
    template <typename T>
    T* newWidget(float x, float y, float w, float h, uint16_t uuid, uint16_t tab) {
        static_assert(std::is_base_of<builder::Widget, T>::value, "T must inherit from builder::Widget.");

        std::lock_guard<std::mutex> l(m_states_mu);

        if (!checkUuidFreeLocked(uuid))
            uuid = generateUuidLocked();

        auto* state = new WidgetState(uuid, x, y, w, h, tab, &T::callbackTrampoline);
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
    std::unique_ptr<rbjson::Object> m_layout;

    mutable std::mutex m_states_mu;
    uint32_t m_state_mustarrive_id;
    std::atomic<bool> m_states_modified;

    mutable std::mutex m_tab_mu;
    std::atomic<bool> m_tab_changed;
    uint16_t m_tab;
};

template <>
inline builder::Switcher* _GridUi::newWidget<builder::Switcher>(float x, float y, float w, float h, uint16_t uuid, uint16_t tab) {
    using T = builder::Switcher;
    static_assert(std::is_base_of<builder::Widget, T>::value, "T must inherit from builder::Widget.");

    std::lock_guard<std::mutex> l(m_states_mu);

    if (!checkUuidFreeLocked(uuid))
        uuid = generateUuidLocked();

    auto* state = new WidgetState(uuid, x, y, w, h, tab, &T::callbackTrampoline);
    m_states.push_back(std::unique_ptr<WidgetState>(state));

    auto* widget = new T(T::name(), *state);
    m_widgets.push_back(std::unique_ptr<T>(widget));

    if (std::is_same<T, builder::Switcher>::value) {
        widget->addCallback("changed", [&](gridui::Switcher& w) {
            changeTab(w.value());
        });
    }
    return widget;
}

inline builder::Arm& _GridUi::arm(float x, float y, float w, float h, uint16_t uuid, uint16_t tab) {
    return *newWidget<builder::Arm>(x, y, w, h, uuid, tab);
}

inline builder::Bar& _GridUi::bar(float x, float y, float w, float h, uint16_t uuid, uint16_t tab) {
    return *newWidget<builder::Bar>(x, y, w, h, uuid, tab);
}

inline builder::Button& _GridUi::button(float x, float y, float w, float h, uint16_t uuid, uint16_t tab) {
    return *newWidget<builder::Button>(x, y, w, h, uuid, tab);
}

inline builder::Checkbox& _GridUi::checkbox(float x, float y, float w, float h, uint16_t uuid, uint16_t tab) {
    return *newWidget<builder::Checkbox>(x, y, w, h, uuid, tab);
}

inline builder::Circle& _GridUi::circle(float x, float y, float w, float h, uint16_t uuid, uint16_t tab) {
    return *newWidget<builder::Circle>(x, y, w, h, uuid, tab);
}

inline builder::Input& _GridUi::input(float x, float y, float w, float h, uint16_t uuid, uint16_t tab) {
    return *newWidget<builder::Input>(x, y, w, h, uuid, tab);
}

inline builder::Joystick& _GridUi::joystick(float x, float y, float w, float h, uint16_t uuid, uint16_t tab) {
    return *newWidget<builder::Joystick>(x, y, w, h, uuid, tab);
}

inline builder::Led& _GridUi::led(float x, float y, float w, float h, uint16_t uuid, uint16_t tab) {
    return *newWidget<builder::Led>(x, y, w, h, uuid, tab);
}

inline builder::Orientation& _GridUi::orientation(float x, float y, float w, float h, uint16_t uuid, uint16_t tab) {
    return *newWidget<builder::Orientation>(x, y, w, h, uuid, tab);
}

inline builder::Slider& _GridUi::slider(float x, float y, float w, float h, uint16_t uuid, uint16_t tab) {
    return *newWidget<builder::Slider>(x, y, w, h, uuid, tab);
}

inline builder::SpinEdit& _GridUi::spinedit(float x, float y, float w, float h, uint16_t uuid, uint16_t tab) {
    return *newWidget<builder::SpinEdit>(x, y, w, h, uuid, tab);
}

inline builder::Switcher& _GridUi::switcher(float x, float y, float w, float h, uint16_t uuid, uint16_t tab) {
    return *newWidget<builder::Switcher>(x, y, w, h, uuid, tab);
}

inline builder::Text& _GridUi::text(float x, float y, float w, float h, uint16_t uuid, uint16_t tab) {
    return *newWidget<builder::Text>(x, y, w, h, uuid, tab);
}

inline builder::Select& _GridUi::select(float x, float y, float w, float h, uint16_t uuid, uint16_t tab) {
    return *newWidget<builder::Select>(x, y, w, h, uuid, tab);
}

extern _GridUi UI;

};
