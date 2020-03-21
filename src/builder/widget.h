#pragma once

#include <memory>
#include <string>
#include <functional>
#include <type_traits>

#include <stdint.h>

#include "rbjson.h"

#include "../widgets/widget.h"

namespace gridui {

class _GridUi;

namespace builder {


template<typename Self>
class BuilderMixin {
    // The Self is not fully defined yet here, so the check won't compile.
    //static_assert(std::is_base_of<Widget, Self>::value, "Self must inherit from Widget.");
public:

    Self& css(const char *key, const char *value) {
        auto& s = self();
        s.style().set(key, value);
        return s;
    }

private:
    Self& self() { return *static_cast<Self*>(this); }
    const Self& self() const { return *static_cast<Self*>(this); }
};

class Widget {
    friend class gridui::_GridUi;

    template<typename Self>
    friend class BuilderMixin;
public:
    Widget(Widget&& o) noexcept;
    virtual ~Widget();

protected:
    Widget(const char *type, WidgetState& state, float x, float y, float w, float h);

    void addCallback(const char *name, std::function<void()> cb);

    rbjson::Object& extra();
    rbjson::Object& style();

    WidgetState& m_state;

private:
    Widget(const Widget&) = delete;
    Widget& operator=(const Widget&) = delete;

    rbjson::Object *serializeAndDestroy();

    const std::unordered_map<std::string, std::function<void()> >& callbacks() const {
        return m_callbacks;
    }

    const char *m_type;
    float m_x, m_y;
    float m_w, m_h;

    rbjson::Object *m_style;

    std::unordered_map<std::string, std::function<void()> > m_callbacks;
};

};
};
