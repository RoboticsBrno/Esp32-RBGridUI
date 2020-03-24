var GRID_DATA = {
    "cols": 12,
    "rows": 18,
    "enableSplitting": true,
    "widgets": [
        {
            "uuid": 1,
            "type": "Button",
            "x": 0,
            "y": 17,
            "w": 4,
            "h": 1,
            "state": JSON.stringify({
                text: "Hello world!",
                "background-color": "red",
                style: {
                    "border": "3px solid green",
                }
            }),
        },
        {
            "uuid": 2,
            "type": "Joystick",
            "x": 6,
            "y": 12,
            "w": 5,
            "h": 5,
            "state": JSON.stringify({
                color: "green",
                text: "Fire!",
            }),
        },
        {
            "uuid": 3,
            "type": "Arm",
            "x": 0,
            "y": 0,
            "w": 12,
            "h": 9,
            "state": JSON.stringify({
                "height":51,"bones":[{"bmax":3.14159,"amax":3.14159,"bmin":-3.14159,"amin":-3.14159,"len":110,"rmin":-1.65806,"angle":-1.5708,"rmax":0},{"bmax":2.79253,"amax":3.14159,"bmin":0.698132,"amin":-0.349066,"len":130,"rmin":0.523599,"angle":0.0872664,"rmax":2.96706}],"radius":130,"off_x":0,"off_y":20
            })
        },
        {
            "uuid": 4,
            "type": "Led",
            "x": 0,
            "y": 12,
            "w": 1,
            "h": 1,
            "state": JSON.stringify({
                color: "blue",
            }),
        },
        {
            "uuid": 5,
            "type": "Led",
            "x": 1,
            "y": 12,
            "w": 1,
            "h": 1,
            "state": JSON.stringify({
                color: "orange",
                on: false,
            }),
        },
        {
            "uuid": 6,
            "type": "Led",
            "x": 2,
            "y": 12,
            "w": 1,
            "h": 1,
            "state": JSON.stringify({
                color: "orange",
                on: true,
            }),
        },
        {
            "uuid": 7,
            "type": "Checkbox",
            "x": 4,
            "y": 11,
            "w": 1,
            "h": 4,
            "state": JSON.stringify({
                color: "orange",
                checked: true,
                text: "Awesomeness"
            }),
        },
        {
            "uuid": 8,
            "type": "Checkbox",
            "x": 5,
            "y": 11,
            "w": 4,
            "h": 1,
            "state": JSON.stringify({
                color: "green",
                checked: false,
                text: "Awesomeness"
            }),
        },
        {
            "uuid": 7,
            "type": "Checkbox",
            "x": 4,
            "y": 10,
            "w": 1,
            "h": 1,
            "state": JSON.stringify({
                color: "red",
                checked: true,
            }),
        },
    ],
}

function Grid(manager, elementId, data) {
    this.manager = manager;
    this.COLS = data.cols;
    this.ROWS = data.rows;
    this.enableSplitting = data.enableSplitting;

    this.el = document.getElementById(elementId);
    this.widgets = [];

    this.canvas = document.createElement("canvas");
    this.canvas.style.position = "absolute";
    this.canvas.style.zIndex = -1;
    this.el.appendChild(this.canvas);

    window.addEventListener("resize", this.onResize.bind(this));

    for(var i = 0; i < data.widgets.length; ++i) {
        var w = data.widgets[i];
        this.addWidget(w.uuid, w.type, w.x, w.y, w.w, w.h, JSON.parse(w["state"]));
    }

    this.onResize();
}

Grid.prototype.onResize = function() {
    var w = this.el.clientWidth;
    var h = this.el.clientHeight;

    this.offsetX = 0;
    this.offsetY = 0;

    if(!this.shouldSplitGrid(w, h)) {
        if(w > h) {
            this.offsetX = (w - h) / 2;
            w = h;
        }

        this.scaleX = w / this.COLS;
        this.scaleY = h / this.ROWS;

        this.canvas.style.width = "" + this.el.clientWidth + "px";
        this.canvas.style.height = "" + this.el.clientHeight + "px";
        this.canvas.width = this.el.clientWidth + 2;
        this.canvas.height = this.el.clientHeight + 2;

        this.drawGrid(this.COLS, this.ROWS);

        var len = this.widgets.length;
        for(var i = 0; i < len; ++i) {
            var w = this.widgets[i];
            w.updatePosition(this.offsetX + w.x*this.scaleX, this.offsetY + w.y*this.scaleY, this.scaleX, this.scaleY);
        }
    } else {
        this.scaleX = w / (this.COLS*2);
        this.scaleY = h / Math.round(this.ROWS/2);

        this.canvas.style.width = "" + this.el.clientWidth + "px";
        this.canvas.style.height = "" + this.el.clientHeight + "px";
        this.canvas.width = this.el.clientWidth + 2;
        this.canvas.height = this.el.clientHeight + 2;

        this.drawGrid(this.COLS*2, this.ROWS/2);

        var centerY = Math.round(this.ROWS/2);

        var len = this.widgets.length;
        for(var i = 0; i < len; ++i) {
            var w = this.widgets[i];

            var x = w.x;
            var y = w.y;
            if(w.y >= centerY) {
                x += this.COLS;
                y = w.y - centerY;
            }
            w.updatePosition(x*this.scaleX, y*this.scaleY, this.scaleX, this.scaleY);
        }
    }
}

Grid.prototype.shouldSplitGrid = function(w, h) {
    if(this.enableSplitting !== true || w <= h)
        return false;

    var centerY = this.ROWS/2;

    var len = this.widgets.length;
    for(var i = 0; i < len; ++i) {
        var w = this.widgets[i];
        if(w.y < centerY && w.y+w.h > centerY)
            return false; 
    }
    return true;
}

Grid.prototype.drawGrid = function(cols, rows) {
    var ctx = this.canvas.getContext("2d");

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.fillStyle = "#DDD";

    for(var x = 0; x <= cols; ++x) {
        for(var y = 0; y <= rows; ++y) {
            ctx.beginPath();
            ctx.arc(this.offsetX + x*this.scaleX + 1, this.offsetY + y*this.scaleY + 1, 1, 0, Math.PI*2, false);
            ctx.fill();
        }
    }
}

Grid.prototype.addWidget = function(uuid, typeName, x, y, w, h, extra) {
    var w = new window[typeName](uuid, x, y, w, h);
    w.applyState(extra);
    w.updatePosition(this.offsetX, this.offsetY, this.scaleX, this.scaleY);
    w.setEventListener(this.onWidgetEvent.bind(this));

    this.el.appendChild(w.el);
    this.widgets.push(w);
}

Grid.prototype.clear = function() {
    var len = this.widgets.length;
    for(var i = 0; i < len; ++i) {
        var w = this.widgets[i];
        this.el.removeChild(w.el);
    }
    this.widgets = [];
}

Grid.prototype.onWidgetEvent = function(w, name, extra, mustArrive, callback) {
    //console.log("Event from " + w.uuid + ": " + name + " " + JSON.stringify(extra));

    var data = {
        "id": w.uuid,
        "ev": name,
    }

    if(extra !== undefined && extra !== null) {
        data["st"] = extra;
    }

    if(mustArrive !== false) {
        this.manager.sendMustArrive("_gev", data, false, callback)
    } else {
        this.manager.send("_gev", data);
    }
}

Grid.prototype.update = function(diffMs) {
    var len = this.widgets.length;
    for(var i = 0; i < len; ++i) {
        var w = this.widgets[i];
        w.update(diffMs);
    }
}

Grid.prototype.onMessage = function(data) {
    var len = this.widgets.length;
    for(var i = 0; i < len; ++i) {
        var w = this.widgets[i];
        if(w.uuid != data["id"])
            continue;

        var state = {};
        state[data.key] = JSON.parse(data.val);
        w.applyState(state);
        break;
    }
}
