function Joystick(grid, uuid) {
  var el = document.createElement('div')

  this.color = '#FF0000'
  this.text = ''
  this.keys = ''

  Widget.call(this, grid, uuid, el)

  this.w = 4
  this.h = 4

  this.radius = 0
  this.valX = 0
  this.valY = 0
  this.buttonClickHandler = null
  this.touchStart = null
  this.pressedKeys = {}
  this.manager = null

  document.addEventListener('keydown', this.onKeyDown.bind(this))
  document.addEventListener('keyup', this.onKeyUp.bind(this))
}

Widget.createSubclass(Joystick, {
  color: new Prop(String).setIsColor(),
  keys: new Prop(String),
  text: new Prop(String)
})

Joystick.prototype.applyState = function (state) {
  Widget.prototype.applyState.call(this, state)

  if (this.manager !== null) this.createNippleJs()
}

Joystick.prototype.updatePosition = function (x, y, scaleX, scaleY) {
  Widget.prototype.updatePosition.call(this, x, y, scaleX, scaleY)

  setTimeout(this.createNippleJs.bind(this), 0)
}

Joystick.prototype.createNippleJs = function () {
  if (this.manager !== null) {
    this.manager.destroy()
  }

  this.radius = Math.min(this.el.clientHeight, this.el.clientWidth) / 2

  this.manager = nipplejs.create({
    zone: this.el,
    mode: 'static',
    color: this.color,
    size: this.radius * 2,
    position: {
      top: '50%',
      left: '50%'
    },
    restOpacity: 0.9,
    fadeTime: 0
  })

  this.joy = this.manager.get(this.manager.ids[0])

  if (this.text !== '') {
    var nipple = this.joy.ui.front
    nipple.innerHTML = this.text
    nipple.style.fontWeight = 'bold'
    nipple.style.fontFamily = 'Arial, Helvetica, sans-serif'
    nipple.style.color = 'white'
    nipple.style.textAlign = 'center'
    nipple.style.verticalAlign = 'middle'
    nipple.style.lineHeight = nipple.style.height
  }

  this.manager.on(
    'start',
    function (event, data) {
      this.touchStart = Date.now()
      this.valX = 0
      this.valY = 0
    }.bind(this)
  )

  this.manager.on(
    'move',
    function (event, data) {
      var dist = (data.distance / this.radius) * 32767
      this.valX = (Math.cos(data.angle.radian) * dist) | 0
      this.valY = (Math.sin(data.angle.radian) * dist) | 0
    }.bind(this)
  )

  this.manager.on(
    'end',
    function (event, data) {
      var diff = Date.now() - this.touchStart
      if (
        diff < 150 &&
        Math.abs(this.valX) < 8000 &&
        Math.abs(this.valY) < 8000
      ) {
        this.sendEvent('click')
      }

      this.valX = 0
      this.valY = 0
    }.bind(this)
  )
}

Joystick.prototype.onKeyDown = function (ev) {
  if (this.keys === '') return
  var idx = this.keys.indexOf(ev.key)
  if (idx === -1) return
  if (idx === 4) {
    this.sendEvent('click')
  }
  this.pressedKeys[idx] = true
  this.updateNippleFront()
}

Joystick.prototype.onKeyUp = function (ev) {
  if (this.keys === '') return
  var idx = this.keys.indexOf(ev.key)
  if (idx === -1) return
  this.pressedKeys[idx] = false
  this.updateNippleFront()
}

Joystick.prototype.updateNippleFront = function () {
  var p = this.pressedKeys
  var left = 0
  var top = 0
  if (p[0] === true) top -= 1
  if (p[2] === true) top += 1
  if (p[1] === true) left -= 1
  if (p[3] === true) left += 1

  this.valX = left * 28000
  this.valY = top * -28000

  var fr = this.joy.ui.front
  fr.style.left = left * this.radius + 'px'
  fr.style.top = top * this.radius + 'px'
}

Joystick.prototype.update = function () {
  this.sendEvent(
    'pos',
    {
      jx: this.valX,
      jy: this.valY
    },
    false
  )
}
