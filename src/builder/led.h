#pragma once

#include "widget.h"
#include "../widgets/led.h"

namespace gridui {
namespace builder {

class Led : public Widget, public BuilderMixin<Led, gridui::Led> {
    static const char *name() { return "Led"; }

    friend class gridui::_GridUi;
    using Widget::Widget;
public:
    Led& color(const char *color) {
        extra().set("color", color);
        return *this;
    }

    Led& on(bool on) {
        extra().set("on", on);
        return *this;
    }
};

};
};
