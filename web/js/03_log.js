function Log(elementId) {
  this.el = document.getElementById(elementId)
  this.open = false
  this.isTouched = false
  this.touchStart = 0
  this.lastClick = 0

  this.el.addEventListener('click', this.onClick.bind(this))

  this.el.addEventListener(
    'touchstart',
    function (ev) {
      this.isTouched = true
      this.touchStart = ev.timeStamp
    }.bind(this)
  )
  this.el.addEventListener(
    'touchend',
    function (ev) {
      this.isTouched = false
      if (ev.timeStamp - this.touchStart < 400) {
        this.onClick(ev)
      }
    }.bind(this)
  )

  this.scrollToBottom()
}

Log.prototype.onClick = function (ev) {
  if (ev.timeStamp - this.lastClick < 500) return
  this.lastClick = ev.timeStamp

  this.open = !this.open
  if (this.open) {
    this.el.classList.replace('log-short', 'log-full')
  } else {
    this.el.classList.replace('log-full', 'log-short')
  }
  this.scrollToBottom()
}

Log.prototype.scrollToBottom = function () {
  this.el.scrollTop = this.el.scrollHeight
}

Log.prototype.clear = function () {
  this.el.textContent = ''
}

Log.prototype.write = function (msg, noNewLine) {
  if (noNewLine !== true && !msg.endsWith('\n')) {
    msg += '\n'
  }
  var content = this.el.textContent
  if (content.length > 8192) {
    content = content.substring(4096)
  }
  this.el.textContent = content + msg
  if (!this.isTouched) {
    this.scrollToBottom()
  }
}
