#pragma once

#include "widget.h"

namespace gridui {

class Text : public Widget {
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

    void setFontSize(float fontSize) {
        m_state->set("fontSize", new rbjson::Number(fontSize));
    }

    float getFontSize() const {
        return data().getDouble("fontSize");
    }

    void setColor(const std::string& color) {
        m_state->set("color", new rbjson::String(color));
    }

    std::string getColor() const {
        return data().getString("color");
    }

    void setAlign(const std::string& align) {
        m_state->set("align", new rbjson::String(align));
    }

    std::string getAlign() const {
        return data().getString("align");
    }

    void setValign(const std::string& valign) {
        m_state->set("valign", new rbjson::String(valign));
    }

    std::string getValign() const {
        return data().getString("valign");
    }
};

};
