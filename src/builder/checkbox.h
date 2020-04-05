#pragma once

#include "../widgets/checkbox.h"
#include "widget.h"

namespace gridui {
namespace builder {

class Checkbox : public Widget, public BuilderMixin<Checkbox, gridui::Checkbox> {
    static const char* name() { return "Checkbox"; }

    friend class gridui::_GridUi;
    using Widget::Widget;

public:
    Checkbox& text(const char* text) {
        extra().set("text", text);
        return *this;
    }

    Checkbox& color(const char* color) {
        extra().set("color", color);
        return *this;
    }

    Checkbox& fontSize(int size) {
        extra().set("fontSize", size);
        return *this;
    }

    Checkbox& checked(bool checked) {
        extra().set("checked", new rbjson::Bool(checked));
        return *this;
    }

    Checkbox& onChanged(callback_t cb) {
        addCallback("checked", cb);
        return *this;
    }
};

};
};
