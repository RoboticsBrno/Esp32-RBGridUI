#pragma once

#include "widget.h"

namespace gridui {

namespace builder {
    class Led;
};

class Led : public Widget {
    friend class gridui::builder::Led;
public:
    Led() : Widget(0), m_on(false) {}

    void setOn(bool on);

    bool isOn() const { return m_on; }

private:
    Led(uint16_t uuid, bool on) : Widget(uuid), m_on(on) {}

    bool m_on;
};

};
