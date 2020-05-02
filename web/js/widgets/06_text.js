function Text(grid, uuid) {
  var el = document.createElement('div')
  el.style.display = 'flex'

  this.span = document.createElement('span')
  this.span.innerHTML = 'Text'
  el.appendChild(this.span)

  Widget.call(this, grid, uuid, el)

  this.w = 3
  this.h = 1

  this.el.style.justifyContent = this.align = 'center'
  this.el.style.alignItems = this.valign = 'center'

  this.fontSize = 12
  this.span.style.fontSize = this.fontSize + 'pt'

  this.color = '#000000'
}

Widget.createSubclass(Text, {
  text: new Prop(
    String,
    function() {
      return this.span.innerHTML
    },
    function(val) {
      this.span.innerHTML = val
    }
  ),
  fontSize: new Prop(Number, undefined, function(val) {
    this.fontSize = val
    this.span.style.fontSize = val + 'pt'
  }),
  color: new Prop(String, undefined, function(val) {
    this.color = val
    this.span.style.color = val
  }).setIsColor(),
  align: new Prop(String, undefined, function(val) {
    this.align = val
    this.el.style.justifyContent = val
  }).setOptions(['start', 'center', 'end']),
  valign: new Prop(String, undefined, function(val) {
    this.valign = val
    this.el.style.alignItems = val
  }).setOptions(['start', 'center', 'end'])
})
