#include <freertos/FreeRTOS.h>
#include <freertos/task.h>

#ifdef LX16A_ARDUINO
#include <Arduino.h>
#else
void setup();
void loop();
extern "C" void app_main() {
    setup();

    while (true) {
        loop();
        vTaskDelay(0);
    }
}
static void sleep(int secs) {
    vTaskDelay(pdMS_TO_TICKS(secs * 1000));
}
#endif

#include "gridui.h"

using namespace rb;
using namespace gridui;

static Led gLedRed;

void setup() {
    // Connect to WiFi and Initialize the UI builder
    UI.beginConnect("FrantaFlinta", "Robocop", "SuperWiFi", "12345678");

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
            const int x = joy.x();
            const int y = joy.x();
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
