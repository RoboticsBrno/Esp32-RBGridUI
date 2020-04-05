#pragma once

#include "../widgets/joystick.h"
#include "widget.h"

namespace gridui {
namespace builder {

class Joystick : public Widget, public BuilderMixin<Joystick, gridui::Joystick> {
    static const char* name() { return "Joystick"; }

    friend class gridui::_GridUi;
    using Widget::Widget;

public:
    Joystick& text(const char* text) {
        extra().set("text", text);
        return *this;
    }

    Joystick& keys(char forward, char left, char backwards, char right, char click = 0) {
        const char keys[6] = { forward, left, backwards, right, click, 0 };
        extra().set("keys", keys);
        return *this;
    }

    Joystick& keys(const char* keys) {
        extra().set("keys", keys);
        return *this;
    }

    Joystick& color(const char* color) {
        extra().set("color", color);
        return *this;
    }

    Joystick& onClick(callback_t cb) {
        addCallback("click", cb);
        return *this;
    }

    Joystick& onPositionChanged(callback_t cb) {
        addCallback("pos", cb);
        return *this;
    }
};

};
};
