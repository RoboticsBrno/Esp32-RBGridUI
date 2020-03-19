#pragma once

#include "widget.h"
#include "../widgets/led.h"

namespace gridui {
namespace builder {

class Led : public Widget {
    friend class gridui::_GridUi;
public:
    Led& color(const char *color) {
        extra().set("color", color);
        return *this;
    }

    Led& on(bool on) {
        extra().set("on", on);
        return *this;
    }

    Led& css(const char *name, const char *value) {
        Widget::css(name, value);
        return *this;
    }

    gridui::Led finish() { 
        return gridui::Led(m_uuid, extra().getBool("on", false));
    }

private:
    Led(uint16_t uuid, float x, float y, float w, float h, const char *color) :
        Widget("Led", uuid, x, y, w, h) {
        this->color(color);
    }
};

};
};
