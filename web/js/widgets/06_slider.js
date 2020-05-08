function Slider(grid, uuid) {
  this.PADDING_FRAC = 0.03

  this.color = '#008000'
  this.fontSize = 16
  this.min = 0
  this.max = 100
  this.value = 0
  this.showValue = true
  this.precision = 1

  var el = document.createElement('canvas')
  Widget.call(this, grid, uuid, Widget.wrapCanvas(el))

  this.w = 4
  this.h = 1
  this.touched = false
  this.sendValueTimer = null

  this.canvas = ge1doot.canvas(el)
  this.canvas.resize = this.draw.bind(this)

  var pointer = this.canvas.pointer

  pointer.down = function () {
    this.touched = true
    this.movePos(pointer)
  }.bind(this)

  pointer.up = function () {
    this.touched = false
  }.bind(this)

  pointer.move = function () {
    if (this.touched) {
      this.movePos(pointer)
    }
  }.bind(this)
}

Widget.createSubclass(Slider, {
  color: new Prop(String).setIsColor(),
  fontSize: new Prop(Number),
  min: new Prop(Number),
  max: new Prop(Number),
  value: new Prop(Number),
  precision: new Prop(Number),
  showValue: new Prop(Boolean)
})

Slider.prototype.applyState = function (state) {
  Widget.prototype.applyState.call(this, state)
  this.draw()
}

Slider.prototype.updatePosition = function (x, y, scaleX, scaleY) {
  Widget.prototype.updatePosition.call(this, x, y, scaleX, scaleY)

  setTimeout(this.canvas.setSize.bind(this.canvas), 0)
}

Slider.prototype.roundToPrecision = function (x, precision) {
  var y = +x + (precision === undefined ? 0.5 : precision / 2)
  return y - (y % (precision === undefined ? 1 : +precision))
}

Slider.prototype.movePos = function (pointer) {
  var x = pointer.x
  var w = this.canvas.width
  if (this.h > this.w) {
    x = this.canvas.height - pointer.y
    w = this.canvas.height
  }

  var padding = w * this.PADDING_FRAC
  x = Math.min(w - padding, x)
  x = Math.max(0, x - padding)
  w -= padding * 2

  var frac = x / w
  this.value = this.roundToPrecision(
    this.min + (this.max - this.min) * frac,
    this.precision
  )
  this.sendValue()
  this.draw()
}

Slider.prototype.sendValue = function () {
  if (this.sendValueTimer !== null) return

  this.sendValueTimer = setTimeout(
    function () {
      this.sendValueTimer = null
      this.sendEvent('changed', { value: this.value })
    }.bind(this),
    100
  )
}

Slider.prototype.formatValue = function (value, precision) {
  var pStr = '' + precision
  var idx = pStr.indexOf('.')
  var decimals = 0
  if (idx !== -1) {
    decimals = pStr.length - (idx + 1)
  }
  return value.toFixed(decimals)
}

Slider.prototype.draw = function () {
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

  var padding = w * this.PADDING_FRAC

  var guideH = Math.max(2, h * 0.05)
  ctx.fillRect(padding, h / 2 - guideH / 2, w - padding * 2, guideH)

  var frac = (this.value - this.min) / (this.max - this.min)
  guideH *= 2
  ctx.fillRect(padding + (w - padding * 2) * frac - guideH / 2, 0, guideH, h)

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
    var txt = this.formatValue(this.value, this.precision)
    ctx.strokeText(txt, 0, 0)
    ctx.fillText(txt, 0, 0)
  }

  ctx.restore()
}
