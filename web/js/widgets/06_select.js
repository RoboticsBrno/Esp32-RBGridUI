function Select(grid, uuid) {
  var el = document.createElement('select')
  el.style.display = 'flex'

  Widget.call(this, grid, uuid, el)

  this.w = 3
  this.h = 1

  this.el.selectedIndex = this.selectedIndex = 0
  this.options = "None"
  this.el.add(new Option("None", "0"))

  this.color = '#000000'
  this.background = ''

  this.el.addEventListener(
    'change',
    function () {
      this.sendEvent('changed', { value: this.selectedIndex })
    }.bind(this)
  )
}

Widget.createSubclass(Select, {
  color: new Prop(String, undefined, function (val) {
    this.color = val
    this.el.style.color = val
  }).setIsColor(),
  background: new Prop(String, undefined, function (val) {
    this.background = val
    this.el.style.backgroundColor = val
  }).setIsColor(),
  disabled: new Prop(
    Boolean,
    function () {
      return this.el.disabled
    },
    function (val) {
      this.el.disabled = !!val
    }
  ),
  options: new Prop(
    String,
    function () {
      const opts = Array(this.el.length)

      for (let i = 0; i < this.el.length; i++) {
        opts[this.el[i].value] = this.el[i].text
      }

      return opts.join(',')
    },

    function (val) {
      if (!val) val = "None"
      while (this.el.length > 0) {
        this.el.remove(0)
      }

      const newOpts = val.split(",")
      for (let index = 0; index < newOpts.length; index++) {
        this.el.add(new Option(newOpts[index], index))
      }

      this.options = val
    }
  ),
  selectedIndex: new Prop(
    Number,
    function () {
      return this.el.selectedIndex
    },
    function (val) {
      this.el.selectedIndex = val
    }
  ),
})

Select.prototype.MIN_LIBRARY_VERSION = 0x040800
