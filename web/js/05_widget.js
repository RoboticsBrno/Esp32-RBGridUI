
function Widget(uuid, element, x, y, w, h) {
    this.uuid = uuid;
    this.el = element;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.eventListener = null;

    this.el.style.position = "absolute";
}

Widget.prototype.applyState = function(state) {
    var styles = [ "color", "background", "background-color", "font-size" ];
    for(var i = 0; i < styles.length; ++i) {
        var k = styles[i];
        if(k in state) {
            this.el.style[k] = state[k];
        }
    }

    if("text" in state) {
        this.el.innerText = state["text"];
    }

    if("html" in state) {
        this.el.innerHtml = state["html"];
    }

    if("disabled" in state) {
        this.el.disabled = !!state["disabled"]
    }

    if("style" in state) {
        var s = state.style;
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

Widget.prototype.sendEvent = function(name, extra, mustArrive, callback) {
    if(this.eventListener === null)
        return;
    this.eventListener(this, name, extra ? extra : {}, mustArrive !== false, callback);
}
