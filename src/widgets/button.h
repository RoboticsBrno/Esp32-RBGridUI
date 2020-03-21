#pragma once

#include "widget.h"

namespace gridui {

namespace builder {
    class Button;
};

class Button : public Widget {
    friend class gridui::builder::Button;
    using Widget::Widget;
public:

    void setColor(const char *color) {
        m_state->set("color", new rbjson::String(color));
    }

    void setBackground(const char *bgcolor) {
        m_state->set("background", new rbjson::String(bgcolor));
    }

    void setText(const char *text) {
        m_state->set("text", new rbjson::String(text));
    }

    std::string getText() const {
        return data().getString("text", "");
    }
};

};
