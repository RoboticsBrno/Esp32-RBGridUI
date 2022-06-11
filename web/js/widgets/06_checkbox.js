function Checkbox(grid, uuid) {
  this.color = '#000000'
  this.checked = false
  this.text = 'CheckBox'
  this.fontSize = 14

  var el = document.createElement('canvas')
  Widget.call(this, grid, uuid, Widget.wrapCanvas(el))

  this.w = 4
  this.h = 1

  this.canvas = ge1doot.canvas(el)
  this.canvas.resize = this.draw.bind(this)
  this.canvas.pointer.up = function () {
    this.checked = !this.checked
    this.draw()
    this.sendEvent('checked', { checked: this.checked })
  }.bind(this)
}

Widget.createSubclass(Checkbox, {
  fontSize: new Prop(Number),
  checked: new Prop(Boolean),
  color: new Prop(String).setIsColor(),
  text: new Prop(String)
})

Checkbox.prototype.applyState = function (state) {
  Widget.prototype.applyState.call(this, state)
  this.draw()
}

Checkbox.prototype.updatePosition = function (x, y, scaleX, scaleY) {
  Widget.prototype.updatePosition.call(this, x, y, scaleX, scaleY)
  setTimeout(this.canvas.setSize.bind(this.canvas), 0)
}

Checkbox.prototype.draw = function () {
  var ctx = this.canvas.ctx
  ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

  ctx.save()

  var w = this.canvas.width
  var h = this.canvas.height
  if (this.h > this.w) {
    w = this.canvas.height
    h = this.canvas.width
    ctx.rotate(Math.PI / 2)
    ctx.translate(0, -h)
  }

  var side = Math.min(w, h)
  var padding = side * 0.1
  side -= padding * 2

  if (this.text !== '') {
    var textX = side + padding * 3
    ctx.textBaseline = 'middle'
    ctx.font = this.fontSize + 'px sans-serif'
    ctx.fillText(this.text, textX, h / 2, w - textX)
    ctx.translate(padding + side / 2, padding + side / 2)
  } else {
    ctx.translate(w / 2, h / 2)
  }

  ctx.fillStyle = this.color
  ctx.strokeStyle = this.color
  ctx.lineWidth = 2

  ctx.strokeRect(-side / 2, -side / 2, side, side)
  if (this.checked) {
    ctx.fillRect(
      -side / 2 + padding,
      -side / 2 + padding,
      side - padding * 2,
      side - padding * 2
    )
  }

  ctx.restore()
}
