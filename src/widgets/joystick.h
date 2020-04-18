#pragma once

#include "widget.h"

namespace gridui {

class Joystick : public Widget {
    template <typename Self, typename Finished>
    friend class builder::BuilderMixin;

    using Widget::Widget;

public:
    void setColor(const std::string& color) {
        m_state->set("color", new rbjson::String(color));
    }

    std::string getColor() const {
        return data().getString("color");
    }

    void setKeys(const std::string& keys) {
        m_state->set("keys", new rbjson::String(keys));
    }

    std::string getKeys() const {
        return data().getString("keys");
    }

    void setText(const std::string& text) {
        m_state->set("text", new rbjson::String(text));
    }

    std::string getText() const {
        return data().getString("text");
    }

    int32_t getX() const {
        return data().getInt("jx");
    }

    int32_t getY() const {
        return data().getInt("jy");
    }
};

};
