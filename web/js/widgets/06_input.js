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
    function() {
      this.sendEvent('changed', { text: this.input.value })
    }.bind(this)
  )
}

Widget.createSubclass(Input, {
  text: new Prop(
    String,
    function() {
      return this.input.value
    },
    function(val) {
      this.input.value = val
    }
  ),
  color: new Prop(String, undefined, function(val) {
    this.color = val
    this.input.style.borderColor = val
  }).setIsColor()
})
