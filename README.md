# Esp32-RBGridUI
A library to build user interfaces for ESP32 programs, controllable via
the RBController apps ([Android](https://play.google.com/store/apps/details?id=com.tassadar.rbcontroller),
[Windows](https://github.com/RoboticsBrno/rbcontroller-electron/releases)).

## Documentation
There is a small documentation site with all the possible widget and event types:
[https://roboticsbrno.github.io/Esp32-RBGridUI/modules.html](https://roboticsbrno.github.io/Esp32-RBGridUI/modules.html).

## Examples of use
### Basic
**Source: [examples/basic/main.cpp](examples/basic/main.cpp)**

This example builds the whole UI in code.

### Layout Builder
**Source: [examples/layout/main.cpp](examples/layout/main.cpp)**

This example makes use of the [RBGridUI layout designer](https://bit.ly/rb_designer) to prepare the UI.
You can take content of [layout.hpp](examples/layout/layout.hpp), paste it into the *Import layout*
window of [layout designer](https://bit.ly/rb_designer) to see how it looks like.

To bring modified layout from designer to code, just copy the whole _Generated C++_ code from the right
pane of the designer into your layout.hpp file.
