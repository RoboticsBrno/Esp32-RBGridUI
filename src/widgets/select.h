#pragma once

#include "widget.h"

#include <iostream>
#include <iterator>
#include <cstring>
#include <vector>

namespace gridui {

/** @ingroup widgets_constructed
*/
class Select : public Widget {
    template <typename Self, typename Finished>
    friend class builder::BuilderMixin;

    using Widget::Widget;

public:
    void setColor(const std::string& color) {
        m_state->set("color", new rbjson::String(color));
    }

    std::string color() const {
        return data().getString("color");
    }

    void setBackground(const std::string& background) {
        m_state->set("background", new rbjson::String(background));
    }

    std::string background() const {
        return data().getString("background");
    }

    std::size_t length() const {
        return data().getInt("length");
    }

    void setOptions(const std::vector<std::string>& options) {
        std::string out = "";
        for (auto& option : options) {
            out.append(option);
        }
        m_state->set("options", new rbjson::String(out));
    }

    void setOptions(const std::string& options) {
        m_state->set("options", new rbjson::String(options));
    }

    std::vector<std::string> options() const {
        struct tokens : std::ctype<char> {
            tokens()
                : std::ctype<char>(get_table()) {}

            static std::ctype_base::mask const* get_table() {
                typedef std::ctype<char> cctype;
                static const cctype::mask* const_rc = cctype::classic_table();

                static cctype::mask rc[cctype::table_size];
                std::memcpy(rc, const_rc, cctype::table_size * sizeof(cctype::mask));

                rc[','] = std::ctype_base::space;
                return &rc[0];
            }
        };

        std::stringstream ss(data().getString("options"));
        ss.imbue(std::locale(std::locale(), new tokens()));
        std::istream_iterator<std::string> begin(ss);
        std::istream_iterator<std::string> end;
        std::vector<std::string> vstrings(begin, end);
        std::copy(vstrings.begin(), vstrings.end(), std::ostream_iterator<std::string>(std::cout, "\n"));

        return vstrings;
    }

    void setSelectedIndex(int index) {
        m_state->set("selectedIndex", new rbjson::Number(index));
    }

    int selectedIndex() const {
        return data().getInt("selectedIndex");
    }

    void setDisabled(bool disabled) {
        m_state->set("disabled", new rbjson::Bool(disabled));
    }

    bool disabled() const {
        return data().getBool("disabled");
    }
};

};
