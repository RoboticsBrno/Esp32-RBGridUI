#pragma once

#include "widget.h"

namespace gridui {

class Checkbox : public Widget {
    template <typename Self, typename Finished>
    friend class builder::BuilderMixin;

    using Widget::Widget;

public:
    void setColor(const char* color) {
        m_state->set("color", new rbjson::String(color));
    }

    void setText(const char* text) {
        m_state->set("text", new rbjson::String(text));
    }

    void setChecked(bool checked) {
        m_state->set("checked", new rbjson::Bool(checked));
    }

    bool isChecked() const {
        return data().getBool("checked");
    }

    void setFontSize(int size) {
        m_state->set("fontSize", new rbjson::Number(size));
    }
};

};
