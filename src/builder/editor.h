#pragma once

#include "../widgets/editor.h"
#include "widget.h"

namespace gridui {
namespace builder {

/** @ingroup widgets_builder
*/
class Editor : public Widget, public BuilderMixin<Editor, gridui::Editor> {
    static const char* name() { return "Editor"; }

    friend class gridui::_GridUi;
    using Widget::Widget;

public:
    Editor& text(const std::string& text) {
        extra().set("text", text);
        return *this;
    }

    Editor& color(const std::string& color) {
        extra().set("color", color);
        return *this;
    }

    Editor& type(const std::string& type) {
        extra().set("type", type);
        return *this;
    }

    Editor& disabled(bool disabled) {
        extra().set("disabled", new rbjson::Bool(disabled));
        return *this;
    }

    /** @ingroup event
     */
    Editor& onChanged(callback_t cb) {
        addCallback("changed", cb);
        return *this;
    }
};

};
};
