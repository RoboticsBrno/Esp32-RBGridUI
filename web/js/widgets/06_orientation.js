function Orientation(grid, uuid) {
  this.color = '#FF0000'

  if (
    window['RbGravitySensor'] === undefined &&
    window['IN_RB_GRID_DESIGNER'] !== true
  ) {
    this.enabled = false
    this.canvas = null

    var el = document.createElement('span')
    el.innerText =
      'Orientation sensor requires the Android RBController app, version >= 1.9.'
    Widget.call(this, grid, uuid, el)
  } else {
    this.enabled = window['IN_RB_GRID_DESIGNER'] !== true

    var el = document.createElement('canvas')
    Widget.call(this, grid, uuid, Widget.wrapCanvas(el))
    this.canvas = ge1doot.canvas(el)
    this.canvas.resize = this.draw.bind(this)

    if (this.enabled) {
      RbGravitySensor.start()
    } else {
      this.demoRollDelta = 0.02
      requestAnimationFrame(this.doGridDesignerDemo.bind(this))
    }
  }

  this.w = 1
  this.h = 1

  this.yaw = 0.0
  this.pitch = 0.0
  this.roll = 0.0
}
Widget.createSubclass(Orientation, {
  color: new Prop(String).setIsColor()
})

Orientation.prototype.MIN_LIBRARY_VERSION = 0x040200

Orientation.prototype.applyState = function (state) {
  Widget.prototype.applyState.call(this, state)
  this.draw()
}

Orientation.prototype.updatePosition = function (x, y, scaleX, scaleY) {
  Widget.prototype.updatePosition.call(this, x, y, scaleX, scaleY)

  if (this.canvas !== null) setTimeout(this.canvas.setSize.bind(this.canvas), 0)
}

Orientation.prototype.doGridDesignerDemo = function () {
  if (!this.canvas.elem.isConnected) {
    return
  }
  this.roll += this.demoRollDelta
  if (this.roll > 1 || this.roll < -1) {
    this.demoRollDelta *= -1
  }
  this.draw()
  requestAnimationFrame(this.doGridDesignerDemo.bind(this))
}

Orientation.prototype.draw = function () {
  if (this.canvas === null) return

  var ctx = this.canvas.ctx
  ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

  var radius = Math.min(this.canvas.height, this.canvas.width) / 4
  var centerX = this.canvas.width / 2
  var centerY = this.canvas.height / 2

  var y = centerY + this.yaw * (this.canvas.height / 2)
  var x = centerX - this.roll * (this.canvas.height / 2)

  ctx.save()
  ctx.fillStyle = this.color
  ctx.shadowColor = this.color
  ctx.shadowBlur = radius * 0.5
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.arc(x, y, radius * 0.5, 0, Math.PI * 2, false)
  ctx.fill()
  ctx.restore()

  ctx.strokeColor = '#000'
  ctx.beginPath()
  ctx.arc(centerX, centerY, radius * 0.5, 0, Math.PI * 2, false)
  ctx.stroke()
}

Orientation.prototype.update = function () {
  if (this.enabled === false) {
    return
  }

  this.yaw = RbGravitySensor.getYaw()
  this.pitch = RbGravitySensor.getPitch()
  this.roll = RbGravitySensor.getRoll()

  this.sendEvent(
    'pos',
    {
      oy: this.yaw,
      op: this.pitch,
      or: this.roll
    },
    false
  )
  this.draw()
}
