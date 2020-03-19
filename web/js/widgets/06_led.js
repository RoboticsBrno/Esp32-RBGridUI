function Led(uuid, x, y, w, h, extra) {
    this.color = "red";
    if("color" in extra) {
        this.color = extra.color;
        delete extra.color;
    }

    var el = document.createElement("canvas");

    Widget.call(this, uuid, el, x, y, w, h, extra);

    this.canvas = ge1doot.canvas(this.el);
    this.canvas.resize = this.draw.bind(this);

    this.on = "on" in extra ? !!extra.on : true;
}

Led.prototype = Object.create(Widget.prototype);
Object.defineProperty(Led.prototype, 'constructor', { 
    value: Led, 
    enumerable: false,
    writable: true });

Led.prototype.updatePosition = function(x, y, scaleX, scaleY) {
    Widget.prototype.updatePosition.call(this, x, y, scaleX, scaleY);

    setTimeout(this.canvas.setSize.bind(this.canvas), 0);
}

Led.prototype.draw = function() {
    var ctx = this.canvas.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    var x = this.canvas.width/2;
    var y = this.canvas.height/2;
    var radius = (Math.min(this.canvas.height, this.canvas.width)/2);

    if(this.on) {
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = radius*0.5;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, radius*0.5, 0, Math.PI*2, false);
        ctx.fill();
    } else {
        ctx.lineWidth = radius*0.1;
        ctx.strokeStyle = this.color;
        ctx.shadowColor = undefined;

        ctx.beginPath();
        ctx.arc(x, y, radius*0.5, 0, Math.PI*2, false);
        ctx.stroke();
    }
}

Led.prototype.onMessage = function(data) {
    this.on = !!data["on"];
    this.draw()
}
