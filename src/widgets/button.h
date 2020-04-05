#pragma once

#include "widget.h"

namespace gridui {

class Button : public Widget {
    template <typename Self, typename Finished>
    friend class builder::BuilderMixin;

    using Widget::Widget;

public:
    void setColor(const char* color) {
        m_state->set("color", new rbjson::String(color));
    }

    void setBackground(const char* bgcolor) {
        m_state->set("background", new rbjson::String(bgcolor));
    }

    void setText(const char* text) {
        m_state->set("text", new rbjson::String(text));
    }

    std::string getText() const {
        return data().getString("text", "");
    }
};

};
