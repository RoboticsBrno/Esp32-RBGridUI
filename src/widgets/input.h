#pragma once

#include "widget.h"

namespace gridui {

class Input : public Widget {
    template <typename Self, typename Finished>
    friend class builder::BuilderMixin;

    using Widget::Widget;

public:
    void setText(const std::string& text) {
        m_state->set("text", new rbjson::String(text));
    }

    std::string getText() const {
        return data().getString("text");
    }

    void setColor(const std::string& color) {
        m_state->set("color", new rbjson::String(color));
    }

    std::string getColor() const {
        return data().getString("color");
    }
};

};
