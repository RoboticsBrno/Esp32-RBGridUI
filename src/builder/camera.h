#pragma once

#include "../widgets/camera.h"
#include "widget.h"

namespace gridui {
namespace builder {

/** @ingroup widgets_builder
*/
class Camera : public Widget, public BuilderMixin<Camera, gridui::Camera> {
    static const char* name() { return "Camera"; }

    friend class gridui::_GridUi;
    using Widget::Widget;

public:
};

};
};
