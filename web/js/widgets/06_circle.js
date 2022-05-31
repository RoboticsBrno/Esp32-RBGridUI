function Circle(grid, uuid) {
  this.color = '#008000'
  this.fontSize = 16
  this.min = 0
  this.max = 360
  this.valueStart = 0
  this.value = 200
  this.showValue = true
  this.lineWidth = 10

  var el = document.createElement('canvas')
  Widget.call(this, grid, uuid, Widget.wrapCanvas(el))

  this.w = 3
  this.h = 3

  this.canvas = ge1doot.canvas(el)
  this.canvas.resize = this.draw.bind(this)
}

Widget.createSubclass(Circle, {
  color: new Prop(String).setIsColor(),
  fontSize: new Prop(Number),
  min: new Prop(Number),
  max: new Prop(Number),
  lineWidth: new Prop(Number),
  valueStart: new Prop(Number),
  value: new Prop(Number),
  showValue: new Prop(Boolean)
})

Circle.prototype.MIN_LIBRARY_VERSION = 0x040700

Circle.prototype.applyState = function (state) {
  Widget.prototype.applyState.call(this, state)
  this.draw()
}

Circle.prototype.updatePosition = function (x, y, scaleX, scaleY) {
  Widget.prototype.updatePosition.call(this, x, y, scaleX, scaleY)
  setTimeout(this.canvas.setSize.bind(this.canvas), 0)
}

Circle.prototype.draw = function () {
  var ctx = this.canvas.ctx
  ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

  ctx.save()

  var padding = 4 + this.lineWidth / 2
  var w = this.canvas.width
  var h = this.canvas.height
  var arcRadius = Math.max(1, Math.min(w, h) / 2 - padding)

  if (!w || !h) {
    return
  }

  var valueStartClipped = Math.max(this.valueStart, this.min)
  var angleStart =
    ((valueStartClipped - this.min) / (this.max - this.min)) * Math.PI * 2
  var angleEnd = ((this.value - this.min) / (this.max - this.min)) * Math.PI * 2
  // Let's start on top
  angleStart -= Math.PI / 2
  angleEnd -= Math.PI / 2

  ctx.lineWidth = this.lineWidth

  ctx.beginPath()
  ctx.globalAlpha = 0.1
  ctx.strokeStyle = this.color
  ctx.arc(w / 2, h / 2, arcRadius, 0, Math.PI * 2)
  ctx.stroke()

  ctx.globalAlpha = 1
  ctx.beginPath()
  ctx.strokeStyle = this.color
  ctx.arc(w / 2, h / 2, arcRadius, angleStart, angleEnd)
  ctx.stroke()

  if (this.showValue) {
    ctx.translate(w / 2, h / 2)
    ctx.lineWidth = 3
    ctx.strokeStyle = 'white'
    ctx.fillStyle = 'black'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = this.fontSize + 'px sans-serif'
    ctx.strokeText('' + this.value, 0, 0)
    ctx.fillText('' + this.value, 0, 0)
  }

  ctx.restore()
}
