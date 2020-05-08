#include <Arduino.h>

#include "gridui.h"
#include "rbprotocol.h"
#include "rbwebserver.h"
#include "rbwifi.h"

using namespace rb;
using namespace gridui;

static Protocol* gProt = nullptr;
static Led gLedRed;

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

    // Build the UI widgets
    gLedRed = UI.led(1, 1, 1, 1)
                  .color("red")
                  .on(true)
                  .finish();

    // The return values from finish() represent the constructed Widget in the UI.
    // They can be freely copied by value.
    auto boxBlack = UI.checkbox(4.5, 2.5, 4, 1)
                        .color("black")
                        .checked(true)
                        .text("ChkBox")
                        .finish();

    auto ledBlue = UI.led(3, 1, 1, 1)
                       .color("blue")
                       .finish();

    auto boxGreen = UI.checkbox(9.5, 2, 1.5, 3.5)
                        .color("green")
                        .fontSize(17.5)
                        .text("TestBox")
                        .onChanged([](Checkbox& b) {
                            printf("Checkbox changed: %d\n", (int)b.checked());
                        })
                        .finish();

    UI.joystick(5.5, 11.5, 5.5, 5)
        .color("red")
        .keys("wasd ")
        .text("Fire!")
        .onPositionChanged([](Joystick& joy) {
            const auto x = joy.x();
            const auto y = joy.x();
            if (x != 0 || y != 0) {
                printf("Joystick value: %d %d\n", x, y);
            }
        })
        .onClick([](Joystick&) {
            printf("Fire!\n");
        })
        .finish();

    UI.button(0, 11.5, 4.5, 1.5)
        .text("BUTTON")
        .css("border", "3px solid black")
        .css("text-transform", "uppercase")
        .onPress([](Button&) {
            printf("Button pressed!\n");
        })
        .finish();

    // Commit the layout. Beyond this point, calling any builder methods on the UI is invalid.
    UI.commit();

    // Manipulating the created widgets:
    ledBlue.setColor("cyan");

    boxGreen.setText("Green!");

    boxBlack.setFontSize(20);
}

void loop() {
    gLedRed.setOn(!gLedRed.on());
    sleep(1);
}
