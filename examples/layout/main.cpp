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
#include "rbprotocol.h"
#include "rbwebserver.h"
#include "rbwifi.h"

using namespace rb;
using namespace gridui;

// You can include layout.hpp in many .cpp files,
// but ONE of those must have this define before it.
#define GRIDUI_LAYOUT_DEFINITION
#include "layout.hpp"

void setup() {
    // Connect to WiFi and Initialize the UI builder
    UI.beginConnect("FrantaFlinta", "Robocop", "SuperWiFi", "12345678");

    // Build the UI widgets. Positions/props are set in the layout, so most of the time,
    // you should only set the event handlers here.
    auto builder = Layout.begin();

    builder.boxGreen.onChanged([](Checkbox& b) {
        printf("Checkbox changed: %d\n", (int)b.checked());
    });

    builder.Joystick1
        .onPositionChanged([](Joystick& joy) {
            const int x = joy.x();
            const int y = joy.x();
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
