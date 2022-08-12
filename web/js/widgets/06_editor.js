function Editor(grid, uuid) {
  var el = document.createElement('button')
  el.style.padding = '2px'

  this.grid = grid

  this.span = document.createElement('span')
  el.appendChild(this.span)
  this.span.innerText = 'EnterPopUp'


  Widget.call(this, grid, uuid, el)

  this.createPopUpScreen(1)

  this.w = 4
  this.h = 1

  this.popUp = {}

  // Create the pop-up screen
  this.popUp.el = document.createElement('div')
  this.popUp.el.addEventListener(
    'click',
    function () {
      this.grid.exitPopUp()
      this.popUp.pressed = true
    }.bind(this))
  this.popUp.el.style.width = '100%'
  this.popUp.el.style.height = '100%'
  this.popUp.el.style.display = 'none'
  this.popUp.pressed = false
  this.grid.el.appendChild(this.popUp.el)
  
  this.popUp.input = document.createElement('input')
  this.popUp.input.type = 'text'
  this.popUp.input.style.borderWidth = '2px'
  this.popUp.input.style.boxSizing = 'border-box'

  this.popUp.el.appendChild(this.popUp.input)

  this.popUp.button = document.createElement('button')
  this.popUp.el.appendChild(this.popUp.button)
  this.popUp.span = document.createElement('span')
  this.popUp.button.appendChild(this.popUp.span)
  this.popUp.span.innerText = 'ButtonPopUp'

  if (!('ontouchstart' in document.documentElement)) {
    this.popUp.button.addEventListener(
      'click',
      function () {
        this.grid.exitPopUp()
        this.popUp.pressed = true
      }.bind(this)
    )

    // document.addEventListener(
    //   'click',
    //   function () {
    //     // if (!this.popUp.pressed) return
    //     this.popUp.pressed = false
    //     this.grid.exitPopUp()
    //   }.bind(this)
    // )
  } else {
    this.popUp.button.addEventListener(
      'touchstart',
      function (ev) {
        if (this.popUp.pressed) return
        this.popUp.pressed = true
      }.bind(this)
    )
    this.popUp.button.addEventListener(
      'touchend',
      function (ev) {
        if (!this.popUp.pressed) return
        this.popUp.pressed = false
        this.grid.exitPopUp()
      }.bind(this)
    )
  }

  if (!('ontouchstart' in document.documentElement)) {
    this.el.addEventListener(
      'mousedown',
      function () {
        this.pressed = true
      }.bind(this)
    )

    document.addEventListener(
      'mouseup',
      function () {
        if (!this.pressed) return
        this.grid.enterPopUp(this.popUp)
        this.pressed = false
      }.bind(this)
    )
  } else {
    this.el.addEventListener(
      'touchstart',
      function (ev) {
        if (this.pressed) return
        this.pressed = true
      }.bind(this)
    )
    this.el.addEventListener(
      'touchend',
      function (ev) {
        if (!this.pressed) return
        this.pressed = false
        this.grid.enterPopUp(this.popUp)
      }.bind(this)
    )
  }

}

Widget.createSubclass(Editor, {
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

Editor.prototype.createPopUpScreen = function (a) {
  console.log(a)
  
}
