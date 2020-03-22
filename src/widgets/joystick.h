#pragma once

#include "widget.h"

namespace gridui {

class Joystick : public Widget {
    template<typename Self, typename Finished>
    friend class builder::BuilderMixin;

    using Widget::Widget;
public:

    void setColor(const char *color) {
        m_state->set("color", new rbjson::String(color));
    }

    void setText(const char *text) {
        m_state->set("text", new rbjson::String(text));
    }

    std::string getText() const {
        return data().getString("text", "");
    }

    int32_t getX() const {
        return data().getInt("x");
    }

    int32_t getY() const {
        return data().getInt("y");
    }
};

};
