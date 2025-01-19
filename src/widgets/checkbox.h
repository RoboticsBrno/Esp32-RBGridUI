#pragma once

#include "widget.h"

namespace gridui {

/** @ingroup widgets_constructed
*/
class Checkbox : public Widget {
    template <typename Self, typename Finished>
    friend class builder::BuilderMixin;

    using Widget::Widget;

public:
    void setFontSize(float fontSize) {
        m_state->set("fontSize", new rbjson::Number(fontSize));
    }

    float fontSize() const {
        return m_state->getDouble("fontSize");
    }

    void setChecked(bool checked) {
        m_state->set("checked", new rbjson::Bool(checked));
    }

    bool checked() const {
        return m_state->getBool("checked");
    }

    void setColor(const std::string& color) {
        m_state->set("color", new rbjson::String(color));
    }

    std::string color() const {
        return m_state->getString("color");
    }

    void setText(const std::string& text) {
        m_state->set("text", new rbjson::String(text));
    }

    std::string text() const {
        return m_state->getString("text");
    }
};

};
