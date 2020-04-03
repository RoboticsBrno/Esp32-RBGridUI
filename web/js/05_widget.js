function Prop(types, getFunc, setFunc) {
  if (!Array.isArray(types)) {
    this.types = [types]
  } else {
    this.types = types
  }

  this.get = getFunc
  this.set = setFunc
}

function Position(x, y, w, h) {
  this.x = x
  this.y = y
  this.w = w
  this.h = h
}

Position.prototype.equals = function(o) {
  return this.x === o.x && this.y === o.y && this.w === o.w && this.h === o.h
}

function Widget(grid, uuid, element) {
  this.x = 0
  this.y = 0
  this.w = 2
  this.h = 2

  this.grid = grid
  this.uuid = uuid
  this.el = element
  this.eventListener = null

  this.el.style.position = 'absolute'
  this.el.classList.add('grid-widget')
}

Widget.SUBCLASSES = []

Widget.prototype.PROPERTIES = {
  x: new Prop(Number),
  y: new Prop(Number),
  w: new Prop(Number),
  h: new Prop(Number),
  backgroundColor: new Prop(
    String,
    function() {
      return this.el.style.backgroundColor
    },
    function(val) {
      this.el.style.backgroundColor = val
    }
  ),
  color: new Prop(
    String,
    function() {
      return this.el.style.color
    },
    function(val) {
      this.el.style.color = val
    }
  ),
  fontSize: new Prop(
    [String, Number],
    function() {
      return this.el.style.fontSize
    },
    function(val) {
      if (typeof val === 'string') {
        this.el.style.fontSize = val
      } else {
        this.el.style.fontSize = val + 'px'
      }
    }
  ),
  html: new Prop(
    String,
    function() {
      return this.el.innerHtml
    },
    function(val) {
      this.el.innerHtml = val
    }
  ),
  style: new Prop(
    [String, Object],
    function() {
      return this.el.style.cssText
    },
    function(val) {
      if (typeof val === 'string') {
        this.el.style.cssText = val
      } else {
        for (var k in val) {
          if (val.hasOwnProperty(k)) {
            this.el.style[k] = val[k]
          }
        }
      }
    }
  ),
  text: new Prop(
    String,
    function() {
      return this.innerText
    },
    function(val) {
      this.el.innerText = val
    }
  )
}

Widget.createSubclass = function(cls, properties) {
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

Widget.wrapCanvas = function(canvas) {
  var wrapper = document.createElement('div')
  canvas.style.width = '100%'
  canvas.style.height = '100%'
  wrapper.appendChild(canvas)
  return wrapper
}

Widget.prototype.applyState = function(state) {
  var proto = Object.getPrototypeOf(this)
  var pos = false
  for (var k in state) {
    if (!state.hasOwnProperty(k) || !proto.PROPERTIES.hasOwnProperty(k)) {
      continue
    }

    var prop = proto.PROPERTIES[k]
    if (prop.set === undefined) {
      if (prop.types.length === 1) {
        this[k] = prop.types[0](state[k])
      } else {
        this[k] = state[k]
      }
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

Widget.prototype.setEventListener = function(listener) {
  this.eventListener = listener
}

Widget.prototype.updatePosition = function() {
  var pos = this.grid.calculatePxPos(this)
  this.el.style.left = '' + pos.x + 'px'
  this.el.style.top = '' + pos.y + 'px'
  this.el.style.width = '' + pos.w + 'px'
  this.el.style.height = '' + pos.h + 'px'
}

Widget.prototype.update = function(diffMs) {}

Widget.prototype.sendEvent = function(name, extra, mustArrive, callback) {
  if (this.eventListener === null) return
  this.eventListener(
    this,
    name,
    extra ? extra : {},
    mustArrive !== false,
    callback
  )
}

Widget.prototype.pos = function() {
  return new Position(this.x, this.y, this.w, this.h)
}
