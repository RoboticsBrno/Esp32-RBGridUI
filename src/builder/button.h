#pragma once

#include "widget.h"
#include "../widgets/button.h"

namespace gridui {
namespace builder {

class Button : public Widget, public BuilderMixin<Button> {
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

    Button& onPress(std::function<void()> cb) {
        addCallback("press", cb);
        return *this;
    }

    Button& onRelease(std::function<void()> cb) {
        addCallback("release", cb);
        return *this;
    }

    gridui::Button finish() {
        return gridui::Button(&m_state);
    }

private:
    static const char *name() { return "Button"; }
};

};
};
