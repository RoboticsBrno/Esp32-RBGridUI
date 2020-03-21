#pragma once

#include "widget.h"
#include "../widgets/led.h"

namespace gridui {
namespace builder {

class Led : public Widget, public BuilderMixin<Led> {
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

    gridui::Led finish() {
        return gridui::Led(&m_state);
    }

private:
    static const char *name() { return "Led"; }
};

};
};
