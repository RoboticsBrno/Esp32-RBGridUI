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
};

};
