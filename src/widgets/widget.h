#pragma once

#include <stdint.h>

namespace gridui {

namespace builder {
    class Led;
};

class Widget {
public:
    Widget(const Widget&& o) : m_uuid(o.m_uuid) {
    }

    Widget& operator=(const Widget&& o) {
        m_uuid = o.m_uuid;
        return *this;
    }

protected:
    Widget(uint16_t uuid) : m_uuid(uuid) {
    }

    Widget(const Widget&) = delete;
    Widget& operator=(const Widget&) = delete;

    uint16_t m_uuid;
};

};
