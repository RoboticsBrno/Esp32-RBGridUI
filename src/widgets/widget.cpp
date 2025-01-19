#include <memory>

#include "../gridui.h"
#include "rbprotocol.h"
#include "widget.h"

namespace gridui {

std::mutex WidgetState::m_mutex;

WidgetState Widget::emptyState(0, 0, 0, 0, 0, 0);

WidgetState::WidgetState(uint16_t uuid, float x, float y, float w, float h, uint16_t tab)
    : m_uuid(uuid)
    , m_bloom_global(0)
    , m_bloom_tick(0) {

    char buf[9];
    snprintf(buf, sizeof(buf), "%lx", WidgetPos(x, y, w, h).encoded());
    m_data.set("p", new rbjson::String(buf));

    if(tab != 0) {
        m_data.set("tab", tab);
    }
}

std::string WidgetState::getString(const std::string& key, std::string def) const {
    std::unique_lock<std::mutex> lock(m_mutex);
    return m_data.getString(key, def);
}

int64_t WidgetState::getInt(const std::string& key, int64_t def) const {
    std::unique_lock<std::mutex> lock(m_mutex);
    return m_data.getInt(key, def);
}

double WidgetState::getDouble(const std::string& key, double def) const {
    std::unique_lock<std::mutex> lock(m_mutex);
    return m_data.getDouble(key, def);
}

bool WidgetState::getBool(const std::string& key, bool def) const {
    std::unique_lock<std::mutex> lock(m_mutex);
    return m_data.getBool(key, def);
}

bool WidgetState::set(const std::string& key, rbjson::Value* value) {
    if (m_uuid == 0)
        return false;

    std::unique_lock<std::mutex> lock(m_mutex);

    const auto* old = m_data.get(key);
    if (old != nullptr && old->equals(*value)) {
        delete value;
        return false;
    }

    m_data.set(key, value);
    markChangedLocked(key);
    return true;
}

bool WidgetState::setInnerObjectProp(const std::string& objectName, const std::string& propertyName, rbjson::Value* value) {
    if (m_uuid == 0)
        return false;

    std::unique_lock<std::mutex> lock(m_mutex);

    auto* obj = m_data.getObject(objectName);
    if (obj == nullptr) {
        obj = new rbjson::Object;
        m_data.set(objectName, obj);
    } else {
        const auto* old = obj->get(propertyName);
        if (old != nullptr && old->equals(*value)) {
            delete value;
            return false;
        }
    }

    obj->set(propertyName, value);
    markChangedLocked(objectName);
    return true;
}

bool WidgetState::popChanges(rbjson::Object& state) {
    std::unique_lock<std::mutex> lock(m_mutex);
    if (m_bloom_tick == 0)
        return false;

    const auto& m = m_data.members();
    for (auto itr = m.begin(); itr != m.end(); ++itr) {
        if (wasChangedInTickLocked(itr->name, itr->name_len)) {
            state.set(std::string(itr->name, itr->name_len), itr->value->copy());
        }
    }
    m_bloom_tick = 0;
    return true;
}

static inline uint32_t murmur3_32(const uint8_t* key, size_t len, uint32_t seed) {
    uint32_t h = seed;
    if (len > 3) {
        const uint32_t* key_x4 = (const uint32_t*)key;
        size_t i = len >> 2;
        do {
            uint32_t k = *key_x4++;
            k *= 0xcc9e2d51;
            k = (k << 15) | (k >> 17);
            k *= 0x1b873593;
            h ^= k;
            h = (h << 13) | (h >> 19);
            h = (h * 5) + 0xe6546b64;
        } while (--i);
        key = (const uint8_t*)key_x4;
    }
    if (len & 3) {
        size_t i = len & 3;
        uint32_t k = 0;
        key = &key[i - 1];
        do {
            k <<= 8;
            k |= *key--;
        } while (--i);
        k *= 0xcc9e2d51;
        k = (k << 15) | (k >> 17);
        k *= 0x1b873593;
        h ^= k;
    }
    h ^= len;
    h ^= h >> 16;
    h *= 0x85ebca6b;
    h ^= h >> 13;
    h *= 0xc2b2ae35;
    h ^= h >> 16;
    return h;
}

static constexpr int hash_count = 3;

void WidgetState::markChanged(const std::string& key) {
    if (m_uuid == 0)
        return;

    std::unique_lock<std::mutex> lock(m_mutex);
    markChangedLocked(key);
}

void WidgetState::markChangedLocked(const std::string& key) {
    for (int i = 0; i < hash_count; ++i) {
        const auto bit = murmur3_32((uint8_t*)key.c_str(), key.size(), i) % 16;
        m_bloom_global |= (1 << bit);
        m_bloom_tick |= (1 << bit);
    }

    UI.notifyStateChange();
}

void WidgetState::markGlobalChangedLocked(const std::string& key) {
    for (int i = 0; i < hash_count; ++i) {
        const auto bit = murmur3_32((uint8_t*)key.c_str(), key.size(), i) % 16;
        m_bloom_global |= (1 << bit);
    }
}

bool WidgetState::wasChangedInTickLocked(const char *key, size_t key_len) const {
    for (int i = 0; i < hash_count; ++i) {
        const auto bit = murmur3_32((uint8_t*)key, key_len, i) % 16;
        if ((m_bloom_tick & (1 << bit)) == 0)
            return false;
    }
    return true;
}

bool WidgetState::remarkAllChanges() {
    std::unique_lock<std::mutex> lock(m_mutex);
    if (m_bloom_global == 0)
        return false;
    m_bloom_tick = m_bloom_global;
    return true;
}
};
