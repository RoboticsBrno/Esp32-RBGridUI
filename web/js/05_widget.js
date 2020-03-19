
function Widget(uuid, element, x, y, w, h, extra) {
    this.uuid = uuid;
    this.el = element;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.eventListener = null;

    this.el.style.position = "absolute";

    var styles = [ "color", "background", "background-color", "font-size" ];
    for(var i = 0; i < styles.length; ++i) {
        var k = styles[i];
        if(k in extra) {
            this.el.style[k] = extra[k];
        }
    }

    if("text" in extra) {
        this.el.innerText = extra["text"];
    }

    if("html" in extra) {
        this.el.innerHtml = extra["html"];
    }

    if("disabled" in extra) {
        this.el.disabled = !!extra["disabled"]
    }

    if("style" in extra) {
        var s = extra.style;
        for(var k in s) {
            if(s.hasOwnProperty(k)) {
                this.el.style[k] = s[k];
            }
        }
    }
}

Widget.prototype.setEventListener = function(listener) {
    this.eventListener = listener;
}

Widget.prototype.updatePosition = function(x, y, scaleX, scaleY) {
    this.el.style.left = "" + x + "px";
    this.el.style.top = "" + y + "px";
    this.el.style.width = "" + (this.w*scaleX) + "px";
    this.el.style.height = "" + (this.h*scaleY) + "px";
}

Widget.prototype.update = function(diffMs) {

}

Widget.prototype.onMessage = function(state) {

}

Widget.prototype.sendEvent = function(name, extra, mustArrive, callback) {
    if(this.eventListener === null)
        return;
    this.eventListener(this, name, extra ? extra : {}, mustArrive !== false, callback);
}
