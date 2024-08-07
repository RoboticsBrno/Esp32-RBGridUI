#pragma once

#include <functional>
#include <memory>
#include <string>
#include <type_traits>

#include <stdint.h>

#include "rbjson.h"

#include "../widgets/widget.h"

/**
 *  @defgroup event Event handlers
 *  This group contains all possible event handlers
 */

/**
 *  @defgroup widgets_builder Builder widgets
 *  Classes in this module are used to construct the layout.
 */

namespace gridui {

class _GridUi;

extern _GridUi UI;

namespace builder {

template <typename Self, typename Constructed>
class BuilderMixin {
    // The Self is not fully defined yet here, so the check won't compile.
    //static_assert(std::is_base_of<Widget, Self>::value, "Self must inherit from Widget.");
    static_assert(std::is_base_of<gridui::Widget, Constructed>::value, "Constructed must inherit from gridui::Widget.");

    friend class gridui::_GridUi;

public:
    typedef std::function<void(Constructed&)> callback_t;

    Self& css(const std::string& key, const std::string& value) {
        auto& s = self();
        s.style().set(key, value);
        return s;
    }

    Constructed finish() {
        return Constructed(&self().m_state);
    }

protected:
    void addCallback(const std::string& name, const callback_t& cb) {
        auto* cbHeap = static_cast<void*>(new callback_t(cb)); // fuj
        self().m_state.addCallback(&callbackTrampoline, &callbackDeleter, name, cbHeap);
    }

private:
    Self& self() { return *static_cast<Self*>(this); }
    const Self& self() const { return *static_cast<Self*>(this); }

    static void callbackTrampoline(void* cb, WidgetState* state) {
        Constructed w(state);
        (*static_cast<callback_t*>(cb))(w);
    }

    static void callbackDeleter(void *cb) {
        auto *cb_typed = static_cast<callback_t*>(cb);
        delete cb_typed;
    }
};

class Widget {
    friend class gridui::_GridUi;

    template <typename Self, typename Finished>
    friend class BuilderMixin;

public:
    Widget(Widget&& o) noexcept;

    const char *widgetTypeName() const { return m_type; }

protected:
    Widget(const char* type, WidgetState& state);

    void serialize(std::ostream& ss);

    rbjson::Object& extra();
    rbjson::Object& style();

    WidgetState& m_state;

private:
    Widget(const Widget&) = delete;
    Widget& operator=(const Widget&) = delete;

    const char* m_type;
};

};
};
