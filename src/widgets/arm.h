#pragma once

#include "widget.h"

namespace gridui {

/** @ingroup widgets_constructed
*/
class Arm : public Widget {
    template <typename Self, typename Finished>
    friend class builder::BuilderMixin;

    using Widget::Widget;

public:
    double x() const {
        return m_state->getDouble("armX");
    }

    double y() const {
        return m_state->getDouble("armY");
    }
};

};
