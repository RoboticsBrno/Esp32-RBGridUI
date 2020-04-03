#pragma once

#include "widget.h"

namespace gridui {

class Arm : public Widget {
    template<typename Self, typename Finished>
    friend class builder::BuilderMixin;

    using Widget::Widget;
public:
    double getX() const {
        return data().getDouble("armX");
    }

    double getY() const {
        return data().getDouble("armY");
    }
};

};
