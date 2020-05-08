function Button(grid, uuid) {
  var el = document.createElement('button')
  el.innerText = 'Button'

  Widget.call(this, grid, uuid, el)

  this.w = 3
  this.h = 1

  this.pressed = false

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
        this.sendEvent('press')
      }.bind(this)
    )
    this.el.addEventListener(
      'touchend',
      function (ev) {
        if (!this.pressed) return
        this.pressed = false
        this.sendEvent('release')
      }.bind(this)
    )
  }
}

Widget.createSubclass(Button, {
  text: new Prop(
    String,
    function () {
      return this.el.innerText
    },
    function (val) {
      this.el.innerText = val
    }
  )
})
