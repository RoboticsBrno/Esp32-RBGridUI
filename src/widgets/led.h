#pragma once

#include "widget.h"

namespace gridui {

namespace builder {
    class Led;
};

class Led : public Widget {
    friend class gridui::builder::Led;
    using Widget::Widget;
public:
    void setOn(bool on) {
        m_state->set("on", new rbjson::Bool(on));
    }

    bool isOn() const { return data().getBool("on", false); }

    void setColor(const char *color) {
        m_state->set("color", new rbjson::String(color));
    }
};

};
