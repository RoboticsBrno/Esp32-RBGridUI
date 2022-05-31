function Input(grid, uuid) {
  var el = document.createElement('div')
  el.style.padding = '2px'

  this.input = document.createElement('input')
  this.input.type = 'text'
  this.input.style.all = 'revert'
  this.input.style.width = '100%'
  this.input.style.height = '100%'
  this.input.style.borderWidth = '2px'
  this.input.style.boxSizing = 'border-box'
  this.input.style.borderColor = this.color = '#cccccc'
  el.appendChild(this.input)

  Widget.call(this, grid, uuid, el)

  this.w = 4
  this.h = 1

  this.input.addEventListener(
    'change',
    function () {
      this.sendEvent('changed', { text: this.input.value })
    }.bind(this)
  )

  if ('ontouchstart' in document.documentElement) {
    this.input.addEventListener(
      'focus',
      function () {
        if (this.input.parentElement === this.el) {
          this.el.removeChild(this.input)
          this.el.parentElement.appendChild(this.input)
          this.input.style.boxShadow = '5px 5px 5px black'
          this.input.style.fontSize = '150%'
          this.input.style.position = 'absolute'
          this.input.style.top = '15px'
          this.input.style.left = '50%'
          this.input.style.marginLeft = '-45%'
          this.input.style.width = '90%'
          this.input.style.height = '2em'
          this.input.focus()
        }
      }.bind(this)
    )

    this.input.addEventListener(
      'blur',
      function () {
        if (this.input.parentElement !== this.el) {
          this.el.parentElement.removeChild(this.input)
          this.el.appendChild(this.input)
          this.input.style.width = '100%'
          this.input.style.height = '100%'
          this.input.style.boxShadow = null
          this.input.style.position = null
          this.input.style.top = null
          this.input.style.left = null
          this.input.style.marginLeft = null
          this.input.style.fontSize = null
        }
      }.bind(this)
    )
  }
}

Widget.createSubclass(Input, {
  text: new Prop(
    String,
    function () {
      return this.input.value
    },
    function (val) {
      this.input.value = val
    }
  ),
  color: new Prop(String, undefined, function (val) {
    this.color = val
    this.input.style.borderColor = val
  }).setIsColor(),
  type: new Prop(
    String,
    function () {
      return this.input.type
    },
    function (val) {
      this.input.type = val
    }
  ).setOptions(['text', 'number', 'password']),
  disabled: new Prop(
    Boolean,
    function () {
      return this.input.disabled
    },
    function (val) {
      this.input.disabled = !!val
    }
  )
})
