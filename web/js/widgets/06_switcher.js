function Switcher(grid, uuid) {
  this.color = '#000000'
  this.fontSize = 14
  this.value = 0
  this.__switcher = true
  this.grid = grid

  var el = document.createElement('div')
  Widget.call(this, grid, uuid, el)

  var canvas = document.createElement('canvas')
  canvas.style.width = '100%'
  canvas.style.height = '100%'

  this.input = document.createElement('input')
  this.input.type = 'text'
  this.input.style.all = 'revert'
  this.input.style.height = '100%'
  this.input.style.borderWidth = '2px'
  this.input.style.boxSizing = 'border-box'
  this.input.style.borderColor = '#cccccc'
  this.input.style.position = 'absolute'

  el.appendChild(canvas)
  el.appendChild(this.input)

  this.w = 4
  this.h = 1

  this.canvas = ge1doot.canvas(canvas)
  this.canvas.resize = this.draw.bind(this)
  this.canvas.pointer.up = function () {
    var bounds = this.el.getBoundingClientRect()
    const width = bounds.width
    const height = bounds.height
    const part = width >= 3 * height
      ? height
      : this.canvas.width / 4
    const inputWidth = width >= 3 * height
      ? (width - 2 * height)
      : width / 2
    if (this.canvas.pointer.x < part) {
      this.value -= 1
      if (this.value < this.min)
        this.value = this.min
    } else if (this.canvas.pointer.x > part + inputWidth) {
      this.value += 1
      if (this.value > this.max)
        this.value = this.max
    } else {
      return
    }

    this.sendEvent('changed', { value: this.value })
    this.draw()
  }.bind(this)

  this.input.addEventListener(
    'change',
    function () {
      const val = parseInt(this.input.value, 10)
      if (val < this.min)
        val = this.min
      else if (val > min(this.max, this.grid.tabs.length))
        val = min(this.max, this.grid.tabs.length)
      this.value = val
      this.draw()
      this.sendEvent('changed', { value: this.value })
    }.bind(this)
  )
}

Widget.createSubclass(Switcher, {
  fontSize: new Prop(Number),
  color: new Prop(String).setIsColor(),
  value: new Prop(Number),
  min: new Prop(Number),
  max: new Prop(Number)
})

Switcher.prototype.MIN_LIBRARY_VERSION = 0x041000

Switcher.prototype.applyState = function (state) {
  Widget.prototype.applyState.call(this, state)
  this.draw()
}

Switcher.prototype.updatePosition = function (x, y, scaleX, scaleY) {
  Widget.prototype.updatePosition.call(this, x, y, scaleX, scaleY)

  setTimeout(this.canvas.setSize.bind(this.canvas), 0)
}

Switcher.prototype.formatValue = function (value, precision) {
  var pStr = '' + precision
  var idx = pStr.indexOf('.')
  var decimals = 0
  if (idx !== -1) {
    decimals = pStr.length - (idx + 1)
  }
  return value.toFixed(decimals)
}

Switcher.prototype.draw = function () {
  var bounds = this.el.getBoundingClientRect()
  const width = bounds.width
  const height = bounds.height

  var ctx = this.canvas.ctx

  const inputWidth = width >= 3 * height
    ? (width - 2 * height)
    : width / 2

  const part = width >= 3 * height
    ? height
    : this.canvas.width / 4

  let padding = part * 0.2

  this.input.style.width = inputWidth + 'px'
  this.input.style.left = part + 'px'
  this.input.value = this.value.toString()

  ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

  ctx.lineWidth = Math.max(2, this.canvas.height * 0.05)
  ctx.fillStyle = this.color
  ctx.strokeStyle = this.color

  // left
  ctx.save()
  ctx.translate(padding, this.canvas.height / 2)
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(part - padding * 2, this.canvas.height / 4)
  ctx.moveTo(0, 0)
  ctx.lineTo(part - padding * 2, - this.canvas.height / 4)
  ctx.stroke()
  ctx.restore()

  // right
  ctx.save()
  ctx.translate(this.canvas.width - padding, this.canvas.height / 2)
  ctx.beginPath()
  ctx.moveTo(padding * 2 - part, this.canvas.height / 4)
  ctx.lineTo(0, 0)
  ctx.moveTo(padding * 2 - part, - this.canvas.height / 4)
  ctx.lineTo(0, 0)
  ctx.stroke()
  ctx.restore()
}
