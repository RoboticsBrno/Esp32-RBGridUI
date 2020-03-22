#pragma once

#include "widget.h"
#include "../widgets/button.h"

namespace gridui {
namespace builder {

class Button : public Widget, public BuilderMixin<Button, gridui::Button> {
    friend class gridui::_GridUi;
    using Widget::Widget;
public:

    Button& text(const char *text) {
        extra().set("text", text);
        return *this;
    }

    Button& color(const char *color) {
        extra().set("color", color);
        return *this;
    }

    Button& background(const char *color) {
        extra().set("background", color);
        return *this;
    }

    Button& onPress(callback_t cb) {
        addCallback("press", cb);
        return *this;
    }

    Button& onRelease(callback_t cb) {
        addCallback("release", cb);
        return *this;
    }

private:
    static const char *name() { return "Button"; }
};

};
};
