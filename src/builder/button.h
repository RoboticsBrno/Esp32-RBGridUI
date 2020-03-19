#pragma once

#include "widget.h"

namespace gridui {
namespace builder {

class Button : public Widget {
    friend class gridui::_GridUi;
public:
    Button& color(const char *color) {
        extra().set("color", color);
        return *this;
    }

    Button& background(const char *color) {
        extra().set("background", color);
        return *this;
    }

    Button& css(const char *name, const char *value) {
        Widget::css(name, value);
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

    void finish() { /* nop */ }

private:
    Button(uint16_t uuid, float x, float y, float w, float h, const char *text) :
        Widget("Button", uuid, x, y, w, h) {

        extra().set("text", text);
    }
};

};
};
