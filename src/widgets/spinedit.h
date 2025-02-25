#pragma once

#include "widget.h"

namespace gridui {

/** @ingroup widgets_constructed
*/
class SpinEdit : public Widget {
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

    void setColor(const std::string& color) {
        m_state->set("color", new rbjson::String(color));
    }

    std::string color() const {
        return m_state->getString("color");
    }

    void setValue(float value) {
        m_state->set("value", new rbjson::Number(value));
    }

    float value() const {
        return m_state->getDouble("value");
    }

    void setStep(float step) {
        m_state->set("step", new rbjson::Number(step));
    }

    float step() const {
        return m_state->getDouble("step");
    }

    void setPrecision(float precision) {
        m_state->set("precision", new rbjson::Number(precision));
    }

    float precision() const {
        return m_state->getDouble("precision");
    }
};

};
