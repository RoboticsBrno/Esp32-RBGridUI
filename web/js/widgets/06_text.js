function Text(grid, uuid) {
  var el = document.createElement('div')
  el.style.display = 'flex'

  this.span = document.createElement('span')
  el.appendChild(this.span)

  this.text = "Text"
  this.prefix = ""
  this.suffix = ""
  this.updateContent()

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
    String, undefined,
    function (val) {
      this.text = val
      this.updateContent()
    }
  ),
  fontSize: new Prop(Number, undefined, function (val) {
    this.fontSize = val
    this.span.style.fontSize = val + 'pt'
  }),
  color: new Prop(String, undefined, function (val) {
    this.color = val
    this.span.style.color = val
  }).setIsColor(),
  align: new Prop(String, undefined, function (val) {
    this.align = val
    this.el.style.justifyContent = val
  }).setOptions(['start', 'center', 'end']),
  valign: new Prop(String, undefined, function (val) {
    this.valign = val
    this.el.style.alignItems = val
  }).setOptions(['start', 'center', 'end']),
  prefix: new Prop(String, undefined, function(val) {
    this.prefix = val
    this.updateContent()
  }),
  suffix: new Prop(String, undefined, function(val) {
    this.suffix = val
    this.updateContent()
  }),
})

Widget.prototype.updateContent = function() {
  this.span.innerHTML = this.prefix + this.text + this.suffix
}
