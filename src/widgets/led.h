#pragma once

#include "widget.h"

namespace gridui {

class Led : public Widget {
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

    void setOn(bool on) {
        m_state->set("on", new rbjson::Bool(on));
    }

    bool isOn() const {
        return data().getBool("on");
    }
};

};
