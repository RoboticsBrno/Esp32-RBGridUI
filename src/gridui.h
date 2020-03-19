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
        auto *widget = new builder::Button(m_uuid_counter++, x, y, w, h, text);
        m_widgets.push_back(std::unique_ptr<builder::Widget>(widget));
        return *widget;
    }

    builder::Led& led(float x, float y, float w, float h, const char *color) {
        auto *widget = new builder::Led(m_uuid_counter++, x, y, w, h, color);
        m_widgets.push_back(std::unique_ptr<builder::Led>(widget));
        return *widget;
    }

private:
    std::unique_ptr<rbjson::Object> m_layout;
    uint16_t m_uuid_counter;
    std::vector<std::unique_ptr<builder::Widget> > m_widgets;
    std::unordered_map<std::string, std::function<void()> > m_callbacks;

    std::atomic<rb::Protocol*> m_protocol;
};

extern _GridUi UI;

};
