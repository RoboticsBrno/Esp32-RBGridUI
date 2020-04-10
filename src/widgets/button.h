#pragma once

#include "widget.h"

namespace gridui {

class Button : public Widget {
    template <typename Self, typename Finished>
    friend class builder::BuilderMixin;

    using Widget::Widget;

public:
    void setText(const char* text) {
        m_state->set("text", new rbjson::String(text));
    }

    std::string getText() const {
        return data().getString("text", "");
    }
};

};
