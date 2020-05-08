function Led(grid, uuid) {
  this.color = '#FF0000'
  this.on = false

  var el = document.createElement('canvas')

  Widget.call(this, grid, uuid, Widget.wrapCanvas(el))

  this.w = 1
  this.h = 1

  this.canvas = ge1doot.canvas(el)
  this.canvas.resize = this.draw.bind(this)
}

Widget.createSubclass(Led, {
  color: new Prop(String).setIsColor(),
  on: new Prop(Boolean)
})

Led.prototype.applyState = function (state) {
  Widget.prototype.applyState.call(this, state)
  this.draw()
}

Led.prototype.updatePosition = function (x, y, scaleX, scaleY) {
  Widget.prototype.updatePosition.call(this, x, y, scaleX, scaleY)

  setTimeout(this.canvas.setSize.bind(this.canvas), 0)
}

Led.prototype.draw = function () {
  var ctx = this.canvas.ctx
  ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

  var x = this.canvas.width / 2
  var y = this.canvas.height / 2
  var radius = Math.min(this.canvas.height, this.canvas.width) / 2

  ctx.save()
  if (this.on) {
    ctx.fillStyle = this.color
    ctx.shadowColor = this.color
    ctx.shadowBlur = radius * 0.5
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(x, y, radius * 0.5, 0, Math.PI * 2, false)
    ctx.fill()
  } else {
    ctx.lineWidth = radius * 0.1
    ctx.strokeStyle = this.color

    ctx.beginPath()
    ctx.arc(x, y, radius * 0.5, 0, Math.PI * 2, false)
    ctx.stroke()
  }
  ctx.restore()
}
