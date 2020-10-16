#include <Arduino.h>

#include "gridui.h"
#include "rbprotocol.h"
#include "rbwebserver.h"
#include "rbwifi.h"

using namespace rb;
using namespace gridui;

// You can include layout.hpp in many .cpp files,
// but ONE of those must have this define before it.
#define GRIDUI_LAYOUT_DEFINITION
#include "layout.hpp"

static Protocol* gProt = nullptr;

static void onPacketReceived(const std::string& cmd, rbjson::Object* pkt) {
    // Let GridUI handle its packets
    if (UI.handleRbPacket(cmd, pkt))
        return;

    // ...any other non-GridUI packets
}

void setup() {
    // Initialize WiFi
    WiFi::connect("Anthrophobia", "Ku1ata2elvA");

    // Initialize RBProtocol
    gProt = new Protocol("FrantaFlinta", "Robocop", "Compiled at " __DATE__ " " __TIME__, onPacketReceived);
    gProt->start();

    // Start serving the web page
    rb_web_start(80);

    // Initialize the UI builder
    UI.begin(gProt);

    // Build the UI widgets. Positions/props are set in the layout, so most of the time,
    // you should only set the event handlers here.
    auto builder = Layout.begin();

    builder.boxGreen.onChanged([](Checkbox& b) {
        printf("Checkbox changed: %d\n", (int)b.checked());
    });

    builder.Joystick1
        .onPositionChanged([](Joystick& joy) {
            const auto x = joy.x();
            const auto y = joy.x();
            if (x != 0 || y != 0) {
                printf("Joystick value: %d %d\n", x, y);
            }
        })
        .onClick([](Joystick&) {
            printf("Fire!\n");
        });

    builder.Button2
        .onPress([](Button&) {
            printf("Button pressed!\n");
        });

    // Commit the layout. Beyond this point, calling any builder methods on the UI is invalid.
    builder.commit();

    // Manipulating the created widgets:
    Layout.ledBlue.setColor("cyan");

    Layout.boxGreen.setText("Green!");

    Layout.boxBlack.setFontSize(20);
}

void loop() {
    Layout.ledRed.setOn(!Layout.ledRed.on());
    sleep(1);
}
