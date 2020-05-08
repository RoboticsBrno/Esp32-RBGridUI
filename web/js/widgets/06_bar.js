function Bar(grid, uuid) {
  this.color = '#008000'
  this.fontSize = 16
  this.min = 0
  this.max = 100
  this.value = 0
  this.showValue = false

  var el = document.createElement('canvas')
  Widget.call(this, grid, uuid, Widget.wrapCanvas(el))

  this.w = 1
  this.h = 3

  this.canvas = ge1doot.canvas(el)
  this.canvas.resize = this.draw.bind(this)
}

Widget.createSubclass(Bar, {
  color: new Prop(String).setIsColor(),
  fontSize: new Prop(Number),
  min: new Prop(Number),
  max: new Prop(Number),
  value: new Prop(Number),
  showValue: new Prop(Boolean)
})

Bar.prototype.applyState = function (state) {
  Widget.prototype.applyState.call(this, state)
  this.draw()
}

Bar.prototype.updatePosition = function (x, y, scaleX, scaleY) {
  Widget.prototype.updatePosition.call(this, x, y, scaleX, scaleY)

  setTimeout(this.canvas.setSize.bind(this.canvas), 0)
}

Bar.prototype.draw = function () {
  var ctx = this.canvas.ctx
  ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

  ctx.save()

  var w = this.canvas.width
  var h = this.canvas.height
  if (this.h > this.w) {
    w = this.canvas.height
    h = this.canvas.width
    ctx.rotate(-Math.PI / 2)
    ctx.translate(-w, 0)
  }

  ctx.fillStyle = this.color
  ctx.strokeStyle = this.color
  ctx.lineWidth = 2

  var padding = 4
  ctx.strokeRect(padding, padding, w - padding * 2, h - padding * 2)

  var frac = (this.value - this.min) / (this.max - this.min)
  ctx.fillRect(
    padding * 2,
    padding * 2,
    (w - padding * 4) * frac,
    h - padding * 4
  )

  if (this.showValue) {
    ctx.translate(w / 2, h / 2)
    if (this.h > this.w) {
      ctx.rotate(Math.PI / 2)
    }
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
