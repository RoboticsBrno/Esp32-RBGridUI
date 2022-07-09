function Grid(manager, elementId, data) {
  this.manager = manager

  this.el = document.getElementById(elementId)
  this.widgets = []

  this.canvas = document.createElement('canvas')
  this.canvas.style.position = 'absolute'
  this.canvas.style.top = '0px'
  this.el.appendChild(this.canvas)

  this.tabs = []
  this.currentTabIdx = 0
  this.setTabCount(1)
  this.setCurrentTab(0)

  window.addEventListener('resize', this.onResize.bind(this))

  var focusedInput = null
  this.el.addEventListener(
    'touchstart',
    function (ev) {
      if (ev.target.tagName === 'INPUT') {
        ev.target.focus()
        focusedInput = ev.target
      } else if (focusedInput !== null) {
        focusedInput.blur()
        focusedInput = null
      }
    }.bind(this)
  )

  this.isSplit = 0
  this.offsetX = 0
  this.offsetY = 0
  this.scaleX = 1
  this.scaleY = 1

  this.reset(data)
}

Grid.prototype.setCurrentTab = function (idx) {
  this.tabs[this.currentTabIdx].style.display = 'none'
  this.tabs[idx].style.display = 'block'
  this.currentTabIdx = idx
  for (w of this.widgets)
    w.applyState(w.getState())
}

Grid.prototype.moveToTab = function (widget, tab, oldTab) {
  widget.tab = oldTab
  this.removeWidget(widget)
  widget.tab = tab
  this.addWidgetConstructed(widget)
}

Grid.prototype.setTabCount = function (count) {
  if (this.tabs.length === count || count <= 0) {
    return
  }

  if (this.tabs.length < count) {
    for (var i = this.tabs.length; i < count; ++i) {
      var t = document.createElement('div')
      t.style.width = '100%'
      t.style.height = '100%'
      t.style.display = 'none'
      this.el.appendChild(t) 
      this.tabs[i] = t
    }
  } else {
    while (this.tabs.length > count) {
      var t = this.tabs.pop()
      this.el.removeChild(t)
    }
    if (this.currentTabIdx >= this.tabs.length) {
      this.currentTabIdx = this.tabs.length - 1
    }
  }
}

Grid.prototype.reset = function (data) {
  this.COLS = data.cols
  this.ROWS = data.rows
  this.enableSplitting = !!data.enableSplitting
  this.drawGrid = !!data.drawGrid

  this.clear()

  for (var i = 0; i < data.widgets.length; ++i) {
    var w = data.widgets[i]
    this.addWidget(w.uuid, w.type, w['state'])
  }

  this.onResize()
}

Grid.prototype.onResize = function () {
  var w = this.el.clientWidth
  var h = this.el.clientHeight

  this.offsetX = 0
  this.offsetY = 0

  this.isSplit = this.shouldSplitGrid(w, h)
  if (!this.isSplit) {
    if (w > h) {
      this.offsetX = (w - h) / 2
      w = h
    }

    this.scaleX = w / this.COLS
    this.scaleY = h / this.ROWS

    this.canvas.style.width = '' + this.el.clientWidth + 'px'
    this.canvas.style.height = '' + this.el.clientHeight + 'px'
    this.canvas.width = this.el.clientWidth + 2
    this.canvas.height = this.el.clientHeight + 2

    this.drawGridDots(this.COLS, this.ROWS)
  } else {
    this.scaleX = w / (this.COLS * 2)
    this.scaleY = h / Math.round(this.ROWS / 2)

    this.canvas.style.width = '' + this.el.clientWidth + 'px'
    this.canvas.style.height = '' + this.el.clientHeight + 'px'
    this.canvas.width = this.el.clientWidth + 2
    this.canvas.height = this.el.clientHeight + 2

    this.drawGridDots(this.COLS * 2, this.ROWS / 2)
  }

  var len = this.widgets.length
  for (var i = 0; i < len; ++i) {
    this.widgets[i].updatePosition()
  }
}

Grid.prototype.calculatePxPos = function (w) {
  var res = {
    w: w.w * this.scaleX,
    h: w.h * this.scaleY
  }

  if (!this.isSplit) {
    res.x = this.offsetX + w.x * this.scaleX
    res.y = this.offsetY + w.y * this.scaleY
  } else {
    var centerY = Math.round(this.ROWS / 2)
    if (w.y >= centerY) {
      res.x = w.x + this.COLS
      res.y = w.y - centerY
    } else {
      res.x = w.x
      res.y = w.y
    }
    res.x *= this.scaleX
    res.y *= this.scaleY
  }

  return res
}

Grid.prototype.shouldSplitGrid = function (w, h) {
  if (this.enableSplitting !== true || w <= h) return false

  var centerY = this.ROWS / 2

  var len = this.widgets.length
  for (var i = 0; i < len; ++i) {
    var w = this.widgets[i]
    if (w.y < centerY && w.y + w.h > centerY) return false
  }
  return true
}

Grid.prototype.drawGridDots = function (cols, rows) {
  if (!this.drawGrid) return

  var ctx = this.canvas.getContext('2d')

  ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
  ctx.fillStyle = '#777'

  for (var x = 0; x <= cols; ++x) {
    for (var y = 0; y <= rows; ++y) {
      ctx.beginPath()
      ctx.arc(
        this.offsetX + x * this.scaleX + 1,
        this.offsetY + y * this.scaleY + 1,
        1,
        0,
        Math.PI * 2,
        false
      )
      ctx.fill()
    }
  }
}

Grid.prototype.addWidget = function (uuid, typeName, extra) {
  try {
    var w = new window[typeName](this, uuid)
  } catch (e) {
    console.log(typeName, e)
    return
  }
  w.applyState(extra)
  this.addWidgetConstructed(w)
}

Grid.prototype.addWidgetConstructed = function (widget) {
  widget.updatePosition()
  widget.setEventListener(this.onWidgetEvent.bind(this))

  
  if (this.tabs.length <= widget.tab) 
    this.setTabCount(widget.tab + 1)
  this.tabs[widget.tab].appendChild(widget.el)
  this.widgets.push(widget)
}

Grid.prototype.removeWidget = function (widget) {
  var idx = this.widgets.indexOf(widget)
  if (idx === -1) return false

  this.tabs[widget.tab].removeChild(widget.el)
  this.widgets.splice(idx, 1)
  return true
}

Grid.prototype.clear = function () {
  var len = this.widgets.length
  for (var i = 0; i < len; ++i) {
    var w = this.widgets[i]
    this.tabs[w.tab].removeChild(w.el)
  }
  this.widgets = []
  this.setTabCount(1)
}

Grid.prototype.onWidgetEvent = function (w, name, extra, mustArrive, callback) {
  //console.log("Event from " + w.uuid + ": " + name + " " + JSON.stringify(extra));

  if (this.manager === null) return

  var data = {
    id: w.uuid,
    ev: name
  }

  if (extra !== undefined && extra !== null) {
    data['st'] = extra
  }

  if (mustArrive !== false) {
    this.manager.sendMustArrive('_gev', data, false, callback)
  } else {
    this.manager.send('_gev', data)
  }
}

Grid.prototype.update = function (diffMs) {
  var len = this.widgets.length
  for (var i = 0; i < len; ++i) {
    var w = this.widgets[i]
    w.update(diffMs)
  }
}

Grid.prototype.onMessageState = function (data) {
  var len = this.widgets.length
  for (var i = 0; i < len; ++i) {
    var w = this.widgets[i]
    var state = data[w.uuid.toString()]
    if (state !== undefined) {
      w.applyState(state)
    }
  }
}

Grid.prototype.getWidgetByUuid = function (uuid) {
  var len = this.widgets.length
  for (var i = 0; i < len; ++i) {
    var w = this.widgets[i]
    if (w.uuid === uuid) {
      return w
    }
  }
  return null
}

Grid.prototype.getWidgetAtPos = function (x, y) {
  var len = this.widgets.length
  for (var i = len - 1; i >= 0; --i) {
    var w = this.widgets[i]
    var r = w.el.getBoundingClientRect()
    if (r.left <= x && r.right >= x && r.top <= y && r.bottom >= y) {
      return w
    }
  }
  return null
}

Grid.prototype.roundToPrecision = function (x, precision) {
  var y = +x + (precision === undefined ? 0.5 : precision / 2)
  return y - (y % (precision === undefined ? 1 : +precision))
}

Grid.prototype.pxPosToCoordinates = function (x, y) {
  var rect = this.el.getBoundingClientRect()
  x -= rect.left
  y -= rect.top

  x = this.roundToPrecision(x / this.scaleX, 0.5)
  y = this.roundToPrecision(y / this.scaleY, 0.5)
  return {
    x: x,
    y: y
  }
}

Grid.prototype.tryMoveWidget = function (w, x, y) {
  var coords = this.pxPosToCoordinates(x, y)
  x = coords.x
  y = coords.y
  if (x == w.x && y == w.y) return false

  w.x = Math.min(this.COLS - 1, Math.max(-w.w + 1, x))
  w.y = Math.min(this.ROWS - 1, Math.max(-w.h + 1, y))
  w.updatePosition()
  return true
}

Grid.prototype.tryScaleWidget = function (widget, r, b) {
  var coords = this.pxPosToCoordinates(r, b)

  var w = coords.x - widget.x
  var h = coords.y - widget.y

  if (w == widget.w && h == widget.h) return false

  widget.w = Math.min(this.COLS, Math.max(0.5, w))
  widget.h = Math.min(this.ROWS, Math.max(0.5, h))
  widget.updatePosition()
  return true
}
