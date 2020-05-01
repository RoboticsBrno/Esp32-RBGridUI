function Text(grid, uuid) {
  var el = document.createElement('div')
  el.style.display = 'table'

  this.span = document.createElement('span')
  this.span.style.display = 'table-cell'
  this.span.innerHTML = 'Text'
  el.appendChild(this.span)

  Widget.call(this, grid, uuid, el)

  this.w = 3
  this.h = 1

  this.el.style.textAlign = this.align = 'center'
  this.span.style.verticalAlign = this.valign = 'middle'

  this.fontSize = 12
  this.span.style.fontSize = this.fontSize + 'pt'

  this.color = 'black'
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
  }),
  align: new Prop(String, undefined, function(val) {
    this.align = val
    this.el.style.textAlign = val
  }).setOptions(['left', 'center', 'right']),
  valign: new Prop(String, undefined, function(val) {
    this.valign = val
    if (val === 'center') val = 'middle'
    this.span.style.verticalAlign = val
  }).setOptions(['top', 'middle', 'bottom'])
})
