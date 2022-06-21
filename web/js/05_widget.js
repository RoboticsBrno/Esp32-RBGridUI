function Prop(type, getFunc, setFunc) {
  this.type = type
  this.get = getFunc
  this.set = setFunc
  this.editable = true
  this.ignoreInBuilder = false
  this.options = null
  this.isColor = false
  this.step = undefined
}

Prop.prototype.disableEdit = function () {
  this.editable = false
  return this
}

Prop.prototype.setIgnoreInBuilder = function () {
  this.ignoreInBuilder = true
  return this
}

Prop.prototype.setOptions = function (opts) {
  this.options = opts
  return this
}

Prop.prototype.setIsColor = function () {
  this.isColor = true
  return this
}

Prop.prototype.setStep = function (step) {
  this.step = step
  return this
}

function Position(x, y, w, h) {
  this.x = x
  this.y = y
  this.w = w
  this.h = h
}

Position.prototype.equals = function (o) {
  return this.x === o.x && this.y === o.y && this.w === o.w && this.h === o.h
}

function Widget(grid, uuid, element) {
  this.x = 0
  this.y = 0
  this.w = 2
  this.h = 2
  this.tab = 0

  this.grid = grid
  this.uuid = uuid
  this.el = element
  this.eventListener = null
  this.extraCss = {}

  this.el.style.position = 'absolute'
  this.el.classList.add('grid-widget')
}

Widget.SUBCLASSES = []

Widget.prototype.MIN_LIBRARY_VERSION = 0x040000

Widget.prototype.PROPERTIES = {
  id: new Prop(String).setIgnoreInBuilder(),
  x: new Prop(Number).setIgnoreInBuilder(),
  y: new Prop(Number).setIgnoreInBuilder(),
  w: new Prop(Number).setIgnoreInBuilder(),
  h: new Prop(Number).setIgnoreInBuilder(),
  tab: new Prop(Number).setIgnoreInBuilder(),
  css: new Prop(
    Object,
    function () {
      return this.extraCss
    },
    function (val) {
      for (var k in this.extraCss) {
        if (!this.extraCss.hasOwnProperty(k)) continue
        this.el.style.removeProperty(k)
      }
      this.extraCss = {}
      for (var k in val) {
        if (!val.hasOwnProperty(k)) continue
        this.el.style.setProperty(k, val[k], 'important')
        this.extraCss[k] = val[k]
      }
    }
  )
}

Widget.createSubclass = function (cls, properties) {
  cls.prototype = Object.create(Widget.prototype)
  Object.defineProperty(cls.prototype, 'constructor', {
    value: cls,
    enumerable: false,
    writable: true
  })

  Widget.SUBCLASSES.push(cls)

  cls.prototype.PROPERTIES = {}
  Object.assign(cls.prototype.PROPERTIES, Widget.prototype.PROPERTIES)
  if (properties) {
    Object.assign(cls.prototype.PROPERTIES, properties)
  }
}

Widget.wrapCanvas = function (canvas) {
  var wrapper = document.createElement('div')
  canvas.style.width = '100%'
  canvas.style.height = '100%'
  wrapper.appendChild(canvas)
  return wrapper
}

Widget.prototype.applyState = function (state) {
  var proto = Object.getPrototypeOf(this)
  var pos = false
  for (var k in state) {
    if (!state.hasOwnProperty(k) || !proto.PROPERTIES.hasOwnProperty(k)) {
      continue
    }

    var prop = proto.PROPERTIES[k]
    if (prop.set === undefined) {
      this[k] = prop.type(state[k])
    } else {
      prop.set.call(this, state[k])
    }

    if (k.length === 1 && 'xywh'.indexOf(k) !== -1) {
      pos = true
    }
  }

  if (pos) {
    this.updatePosition()
  }
}

Widget.prototype.setEventListener = function (listener) {
  this.eventListener = listener
}

Widget.prototype.updatePosition = function () {
  var pos = this.grid.calculatePxPos(this)
  this.el.style.left = '' + pos.x + 'px'
  this.el.style.top = '' + pos.y + 'px'
  this.el.style.width = '' + pos.w + 'px'
  this.el.style.height = '' + pos.h + 'px'
}

Widget.prototype.update = function (diffMs) {}

Widget.prototype.sendEvent = function (name, extra, mustArrive, callback) {
  if (this.eventListener === null) return
  this.eventListener(
    this,
    name,
    extra ? extra : {},
    mustArrive !== false,
    callback
  )
}

Widget.prototype.pos = function () {
  return new Position(this.x, this.y, this.w, this.h)
}

Widget.prototype.getState = function () {
  var res = {}
  var proto = Object.getPrototypeOf(this)
  for (var key in proto.PROPERTIES) {
    if (!proto.PROPERTIES.hasOwnProperty(key)) continue

    var prop = proto.PROPERTIES[key]
    if (prop.get === undefined) {
      res[key] = prop.type(this[key])
    } else {
      res[key] = prop.get.call(this)
    }
  }
  return res
}
