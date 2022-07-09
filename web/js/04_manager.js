function Manager(logElementId, gridElementId) {
  this.socket = null

  this.divider = 0

  this.mustArriveIdIn = -1
  this.mustArriveIdOut = 0
  this.mustArriveCommands = {}
  this.MUST_ARRIVE_TIMER_FULL = 100
  this.MUST_ARRIVE_RETRIES = 30

  this.mustArriveTimerId = null
  this.possessed = false

  this.log = new Log(logElementId)
  this.grid = null

  this.loadLayout(gridElementId)
}

Manager.prototype.start = function (address) {
  this.log.write('Connecting to ' + address + '... ', true)

  if (!('WebSocket' in window)) {
    this.log.write('\nWebSockets are not supported on this device!')
    return
  }

  this.socket = new ReconnectingWebSocket(address)
  this.socket.addEventListener(
    'open',
    function (event) {
      if (this.mustArriveTimerId === null) {
        this.mustArriveTimerId = setInterval(
          this.mustArriveTask.bind(this),
          this.MUST_ARRIVE_TIMER_FULL
        )
      }

      this.log.write('connected!')
      this.log.write('Attempting to possess the robot...')
      this.sendMustArrive(
        'possess',
        {},
        true,
        function () {
          this.possessed = true
          if (this.grid) {
            this.sendMustArrive('_gall', {})
          }
        }.bind(this)
      )
    }.bind(this)
  )

  this.socket.addEventListener(
    'error',
    function (event) {
      this.log.write('Connection FAILED!')
      if (this.mustArriveTimerId !== null) {
        clearInterval(this.mustArriveTimerId)
        this.mustArriveTimerId = null
      }
    }.bind(this)
  )

  this.socket.addEventListener('message', this.onMessage.bind(this))

  this.lastUpdate = Date.now()
  requestAnimationFrame(this.update.bind(this))
}

Manager.prototype.update = function () {
  if (++this.divider >= 2) {
    this.divider = 0
  } else {
    requestAnimationFrame(this.update.bind(this))
    return
  }

  var now = Date.now()
  var diff = now - this.lastUpdate
  this.lastUpdate = now

  if (this.socket.readyState === WebSocket.OPEN && this.grid !== null) {
    this.grid.update(diff)
  }

  requestAnimationFrame(this.update.bind(this))
}

Manager.prototype.mustArriveTask = function () {
  for (var id in this.mustArriveCommands) {
    if (!this.mustArriveCommands.hasOwnProperty(id)) continue

    var info = this.mustArriveCommands[id]
    this.socket.send(info.payload)
    if (info.attempts !== null && ++info.attempts >= this.MUST_ARRIVE_RETRIES) {
      delete this.mustArriveCommands[id]
    }
  }
}

Manager.prototype.onMessage = function (event) {
  var data = JSON.parse(event.data)
  if ('f' in data) {
    var cmd = this.mustArriveCommands[data['f']]
    if (cmd !== undefined) {
      delete this.mustArriveCommands[data['f']]
      if (cmd['callback'] !== undefined) {
        cmd['callback']()
      }
    }
    return
  } else if ('e' in data) {
    this.socket.send(JSON.stringify({ c: data['c'], e: data['e'] }))
    var e = data['e']
    if (e <= this.mustArriveIdIn && e !== 0) {
      return
    } else {
      this.mustArriveIdIn = e
    }
  }

  switch (data['c']) {
    case 'pong':
      break
    case 'log':
      this.log.write(data['msg'])
      break
    case '_gst':
      if (this.grid) this.grid.onMessageState(data)
      break
    case '_gtb':
      if (this.grid) this.grid.setCurrentTab(data['tab'])
      break
  }
}

Manager.prototype.send = function (command, data) {
  data['c'] = command
  this.socket.send(JSON.stringify(data))
}

Manager.prototype.sendMustArrive = function (
  command,
  data,
  unlimitedAttempts,
  callback
) {
  var id = ++this.mustArriveIdOut
  data['c'] = command
  data['f'] = id

  var payload = JSON.stringify(data)
  this.mustArriveCommands[id] = {
    payload: payload,
    attempts: unlimitedAttempts !== true ? 0 : null,
    callback: callback
  }
  this.socket.send(payload)
}

Manager.prototype.flashBody = function () {
  var body = document.getElementById('body')
  body.style.backgroundColor = '#ff5454'
  setTimeout(function () {
    body.style.backgroundColor = 'white'
  }, 50)
}

Manager.prototype.loadLayout = function (gridElementId) {
  //this.grid = new Grid(this, gridElementId, GRID_DATA);
  //return;

  var req = new XMLHttpRequest()
  req.open('GET', '/layout.json')
  req.timeout = 15000
  req.onreadystatechange = function () {
    if (req.readyState !== XMLHttpRequest.DONE) return

    if (req.status !== 200) {
      setTimeout(this.loadLayout.bind(this, gridElementId), 500)
      return
    }

    this.grid = new Grid(this, gridElementId, JSON.parse(req.responseText))
    if (this.possessed) {
      this.sendMustArrive('_gall', {})
    }
  }.bind(this)
  req.send()
}
