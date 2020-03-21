#pragma once

#include <vector>
#include <memory>
#include <atomic>

#include "builder/button.h"
#include "builder/led.h"

namespace rb {
class Protocol;
};

namespace gridui {

class _GridUi {
public:
    _GridUi();
    ~_GridUi();

    void begin(rb::Protocol *protocol, int cols = 12, int rows = 18, bool enableSplitting = true);
    void commit();

    bool handleRbPacket(const std::string& command, rbjson::Object *pkt);

    rb::Protocol *protocol() const { return m_protocol.load(); }

    builder::Button& button(float x, float y, float w, float h, const char *text) {
        auto *widget = newWidget<builder::Button>(x, y, w, h);
        widget->text(text);
        return *widget;
    }

    builder::Led& led(float x, float y, float w, float h, const char *color) {
        auto *widget = newWidget<builder::Led>(x, y, w, h);
        widget->color(color);
        return *widget;
    }

private:
    template<typename T>
    T* newWidget(float x, float y, float w, float h) {
        static_assert(std::is_base_of<builder::Widget, T>::value, "T must inherit from builder::Widget.");

        const auto uuid = m_uuid_counter++;
        auto *state = new WidgetState(uuid);
        m_states[uuid] = std::unique_ptr<WidgetState>(state);

        auto *widget = new T(T::name(), *state, x, y, w, h);
        m_widgets.push_back(std::unique_ptr<T>(widget));
        return widget;
    }

    std::unique_ptr<rbjson::Object> m_layout;
    uint16_t m_uuid_counter;
    std::vector<std::unique_ptr<builder::Widget> > m_widgets;
    std::unordered_map<std::string, std::function<void()> > m_callbacks;

    std::unordered_map<uint16_t, std::unique_ptr<WidgetState>> m_states;

    std::atomic<rb::Protocol*> m_protocol;
};

extern _GridUi UI;

};
