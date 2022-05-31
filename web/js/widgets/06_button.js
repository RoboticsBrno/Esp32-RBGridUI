function Button(grid, uuid) {
  var el = document.createElement('button')
  el.style.display = 'flex'

  this.span = document.createElement('span')
  el.appendChild(this.span)
  this.span.innerText = 'Button'

  Widget.call(this, grid, uuid, el)

  this.w = 3
  this.h = 1

  this.pressed = false

  this.el.style.justifyContent = this.align = 'center'
  this.el.style.alignItems = this.valign = 'center'

  this.fontSize = 12
  this.span.style.fontSize = this.fontSize + 'pt'

  this.color = '#000000'
  this.background = ''

  if (!('ontouchstart' in document.documentElement)) {
    el.addEventListener(
      'mousedown',
      function () {
        this.sendEvent('press')
        this.pressed = true
      }.bind(this)
    )

    document.addEventListener(
      'mouseup',
      function () {
        if (!this.pressed) return
        this.sendEvent('release')
        this.pressed = false
      }.bind(this)
    )
  } else {
    this.el.addEventListener(
      'touchstart',
      function (ev) {
        if (this.pressed) return
        this.pressed = true
        this.sendEvent('press', { pressed: true })
      }.bind(this)
    )
    this.el.addEventListener(
      'touchend',
      function (ev) {
        if (!this.pressed) return
        this.pressed = false
        this.sendEvent('release', { pressed: false })
      }.bind(this)
    )
  }
}

Widget.createSubclass(Button, {
  text: new Prop(
    String,
    function () {
      return this.span.innerText
    },
    function (val) {
      this.span.innerText = val
    }
  ),
  fontSize: new Prop(Number, undefined, function (val) {
    this.fontSize = val
    this.span.style.fontSize = val + 'pt'
  }),
  color: new Prop(String, undefined, function (val) {
    this.color = val
    this.el.style.color = val
  }).setIsColor(),
  background: new Prop(String, undefined, function (val) {
    this.background = val
    this.el.style.backgroundColor = val
  }).setIsColor(),
  align: new Prop(String, undefined, function (val) {
    this.align = val
    this.el.style.justifyContent = val
  }).setOptions(['flex-start', 'center', 'flex-end']),
  valign: new Prop(String, undefined, function (val) {
    this.valign = val
    this.el.style.alignItems = val
  }).setOptions(['flex-start', 'center', 'flex-end']),
  disabled: new Prop(
    Boolean,
    function () {
      return this.el.disabled
    },
    function (val) {
      this.el.disabled = !!val
    }
  )
})
