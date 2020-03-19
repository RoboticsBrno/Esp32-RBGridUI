function Button(uuid, x, y, w, h, extra) {
    var el = document.createElement("button");
    Widget.call(this, uuid, el, x, y, w, h, extra);

    this.pressed = false;

    if(!('ontouchstart' in document.documentElement)) {
        el.addEventListener("mousedown", function() {
            this.sendEvent("press");
            this.pressed = true;
        }.bind(this));

        document.addEventListener("mouseup", function() {
            if(!this.pressed)
                return;
            this.sendEvent("release");
            this.pressed = false;
        }.bind(this));
    } else {
        this.el.addEventListener("touchstart", function(ev) {
            if(this.pressed)
                return;
            this.pressed = true;
            this.sendEvent("press");
        }.bind(this));
        this.el.addEventListener("touchend", function(ev) {
            if(!this.pressed)
                return;
            this.pressed = false;
            this.sendEvent("release");
        }.bind(this));
    }
}

Button.prototype = Object.create(Widget.prototype);
Object.defineProperty(Button.prototype, 'constructor', { 
    value: Button, 
    enumerable: false,
    writable: true });
