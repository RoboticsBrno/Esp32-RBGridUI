function SpinEdit(grid, uuid) {
  this.color = '#000000'
  this.fontSize = 14
  this.value = 0
  this.step = 1
  this.precision = 1

  var el = document.createElement('canvas')
  Widget.call(this, grid, uuid, Widget.wrapCanvas(el))

  this.w = 4
  this.h = 1

  this.canvas = ge1doot.canvas(el)
  this.canvas.resize = this.draw.bind(this)
  this.canvas.pointer.up = function () {
    const part = this.canvas.width / 4
    if (this.canvas.pointer.x < part) {
      this.value -= this.step
    } else if (this.canvas.pointer.x > part * 3) {
      this.value += this.step
    } else {
      return
    }

    this.sendEvent('changed', { value: this.value })
    this.draw()
  }.bind(this)
}

Widget.createSubclass(SpinEdit, {
  fontSize: new Prop(Number),
  color: new Prop(String).setIsColor(),
  value: new Prop(Number),
  step: new Prop(Number),
  precision: new Prop(Number)
})

SpinEdit.prototype.MIN_LIBRARY_VERSION = 0x040600

SpinEdit.prototype.applyState = function (state) {
  Widget.prototype.applyState.call(this, state)
  this.draw()
}

SpinEdit.prototype.updatePosition = function (x, y, scaleX, scaleY) {
  Widget.prototype.updatePosition.call(this, x, y, scaleX, scaleY)

  setTimeout(this.canvas.setSize.bind(this.canvas), 0)
}

SpinEdit.prototype.formatValue = function (value, precision) {
  var pStr = '' + precision
  var idx = pStr.indexOf('.')
  var decimals = 0
  if (idx !== -1) {
    decimals = pStr.length - (idx + 1)
  }
  return value.toFixed(decimals)
}

SpinEdit.prototype.draw = function () {
  var ctx = this.canvas.ctx
  ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

  const part = this.canvas.width / 4
  const padding = part * 0.2

  ctx.lineWidth = Math.max(2, this.canvas.height * 0.05)
  ctx.fillStyle = this.color
  ctx.strokeStyle = this.color

  // minus
  ctx.strokeRect(padding, this.canvas.height / 2, part - padding * 2, 1)

  // plus
  ctx.save()
  ctx.translate(part * 3, 0)
  const minusW = part - padding * 2
  ctx.strokeRect(padding, this.canvas.height / 2, minusW, 1)
  ctx.strokeRect(part / 2, this.canvas.height / 2 - minusW / 2, 1, minusW)
  ctx.restore()

  // text
  ctx.save()
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = this.fontSize + 'px sans-serif'
  ctx.fillText(
    this.formatValue(this.value, this.precision),
    this.canvas.width / 2,
    this.canvas.height / 2
  )
  ctx.restore()
}
