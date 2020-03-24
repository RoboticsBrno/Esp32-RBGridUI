#pragma once

#include <stdio.h>

#include "widget.h"
#include "../widgets/arm.h"

namespace gridui {
namespace builder {

class Arm : public Widget, public BuilderMixin<Arm, gridui::Arm> {
    static const char *name() { return "Arm"; }

    friend class gridui::_GridUi;
    using Widget::Widget;
public:
    Arm& info(std::unique_ptr<rbjson::Object> armInfo) {
        for(auto itr : armInfo->members()) {
            extra().set(itr.first.c_str(), itr.second->copy());
        }
        return *this;
    }

    Arm& onPositionChanged(callback_t cb) {
        addCallback("pos", cb);
        return *this;
    }

    Arm& onGrab(callback_t cb) {
        addCallback("grab", cb);
        return *this;
    }
};

};
};
