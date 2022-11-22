#pragma once

#include "widget.h"

namespace gridui {

/** @ingroup widgets_constructed
*/
class Camera : public Widget {
    template <typename Self, typename Finished>
    friend class builder::BuilderMixin;

    using Widget::Widget;

public:

    void setRotation(float rotation) {
        m_state->set("rotation", new rbjson::Number(rotation));
    }

    float rotation() const {
        return data().getDouble("rotation");
    }

    void setClip(bool clip) {
        m_state->set("clip", new rbjson::Bool(clip));
    }

    bool clip() const {
        return data().getBool("clip");
    }

};

};
