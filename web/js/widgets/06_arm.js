function clampAng(val) {
  val = val % (Math.PI * 2)
  if (val < -Math.PI) val += Math.PI * 2
  else if (val > Math.PI) val -= Math.PI * 2
  return val
}

function deg(rad) {
  return rad * (180.0 / Math.PI)
}

function Bone(info, color, prev) {
  this.length = info.len
  this.color = color

  this.x = 0
  this.y = 0
  this.angle = info.angle
  if (prev === null) {
    this.relAngle = this.angle
  } else {
    this.relAngle = clampAng(this.angle - prev.angle)
  }

  this.relMin = info.rmin
  this.relMax = info.rmax
  this.absMin = info.amin
  this.absMax = info.amax
  this.baseMin = info.bmin
  this.baseMax = info.bmax
}

Bone.prototype.toInfo = function () {
  return {
    len: this.length,
    angle: this.angle,
    rmin: this.relMin,
    rmax: this.relMax,
    amin: this.absMin,
    amax: this.absMax,
    bmin: this.baseMin,
    bmax: this.baseMax
  }
}

Bone.prototype.updatePos = function (prevBone, unit) {
  this.angle = this.relAngle
  if (prevBone) {
    this.angle = clampAng(prevBone.angle + this.angle)
  }

  this.x = Math.cos(this.angle) * this.length * unit
  this.y = Math.sin(this.angle) * this.length * unit

  if (prevBone) {
    this.x += prevBone.x
    this.y += prevBone.y
  }
}

function Animation(arm) {
  this.arm = arm
  this.keyframes = []
  this.curFrame = -1
  this.lastTick = null
  this.cmdSent = true
}

Animation.prototype.addFrame = function (x, y, durationMs) {
  this.keyframes.push({
    x: x,
    y: y,
    duration: durationMs,
    current: 0
  })
}

Animation.prototype.start = function () {
  this.lastTick = performance.now()
  this.nextFrame()
  requestAnimationFrame(this.update.bind(this))
}

Animation.prototype.nextFrame = function () {
  this.curFrame += 1
  if (this.curFrame >= this.keyframes.length) return false
  var f = this.keyframes[this.curFrame]

  var b = this.arm.bones[this.arm.bones.length - 1]
  f.start_x = b.x / this.arm.unit
  f.start_y = b.y / this.arm.unit

  this.arm.pointer.x = f.x * this.arm.unit + this.arm.origin.x
  this.arm.pointer.y = f.y * this.arm.unit + this.arm.origin.y
  this.arm.run()

  this.cmdSent = false

  this.arm.sendEvent(
    'pos',
    { armX: f.x, armY: f.y },
    true,
    function () {
      this.cmdSent = true
      requestAnimationFrame(this.update.bind(this))
    }.bind(this)
  )

  return true
}

Animation.prototype.update = function () {
  var now = performance.now()
  var diff = now - this.lastTick
  this.lastTick = now

  if (!this.cmdSent) return

  if (this.curFrame >= this.keyframes.length) {
    this.arm.animation = null
    return
  }

  var f = this.keyframes[this.curFrame]
  f.current += diff

  var progress = f.current / f.duration
  if (progress >= 1.0) progress = 1.0

  if (progress >= 1.0 && !this.nextFrame()) {
    this.arm.animation = null
    return
  }

  requestAnimationFrame(this.update.bind(this))
}

function Arm(grid, uuid) {
  var el = document.createElement('canvas')
  Widget.call(this, grid, uuid, Widget.wrapCanvas(el))

  this.w = 12
  this.h = 9

  this.BODY_HEIGHT = 0
  this.BODY_RADIUS = 0
  this.ARM_BASE_HEIGHT = 0
  this.TOUCH_TARGET_SIZE = 4
  this.ARM_TOTAL_LEN = 0

  this.bones = []

  this.BUTTON_TEXTS = ['RETRACT', 'EXTEND', 'GRAB']
  this.buttons = []
  for (var i = 0; i < this.BUTTON_TEXTS.length; ++i) {
    this.buttons.push({
      text: this.BUTTON_TEXTS[i],
      x: 0,
      y: 0,
      w: 0,
      h: 0,
      blink: false
    })
  }

  this.canvas = ge1doot.canvas(el)
  this.canvas.resize = this.resize.bind(this)

  this.unit = 1
  this.origin = { x: 0, y: 0 }
  this.pointer = this.canvas.pointer

  this.touched = false
  this.touchedButton = null
  this.animation = null

  this.pointer.down = function () {
    this.touchedButton = this.getTouchedButton()
    if (this.touchedButton === null && this.animation === null) {
      this.run()
      this.touched = true
    }
  }.bind(this)
  this.pointer.up = function () {
    if (this.touchedButton !== null) {
      if (this.getTouchedButton() === this.touchedButton) {
        this.touchedButton.blink = true
        this.draw()
        setTimeout(
          function (btn) {
            btn.blink = false
            this.draw()
          }.bind(this, this.touchedButton),
          100
        )
        this.handleButton(this.touchedButton.text.toUpperCase())
      }
      this.touchedButton = null
    } else {
      this.touched = false
      requestAnimationFrame(this.run.bind(this))
    }
  }.bind(this)
  this.pointer.move = function () {
    if (this.touched) requestAnimationFrame(this.run.bind(this))
  }.bind(this)

  this.resize()
  this.updateAngles(true)

  this.touched = false
}

Widget.createSubclass(Arm, {
  info: new Prop(
    Object,
    function () {
      var bones = []
      for (var i = 0; i < this.bones.length; ++i)
        bones.push(this.bones[i].toInfo())
      return {
        radius: this.BODY_RADIUS,
        height: this.BODY_HEIGHT,
        off_y: this.ARM_BASE_HEIGHT,
        bones: bones
      }
    },
    function (info) {
      this.BODY_RADIUS = info.radius
      this.BODY_HEIGHT = info.height
      this.ARM_BASE_HEIGHT = info.off_y
      this.ARM_TOTAL_LEN = 0

      this.bones = []
      var colors = ['blue', 'orange', 'green', 'red', 'brown']
      var prev = null
      for (var i = 0; i < info.bones.length; ++i) {
        this.ARM_TOTAL_LEN += info.bones[i].len
        prev = new Bone(info.bones[i], colors[i % colors.length], prev)
        this.bones.push(prev)
      }
    }
  ).disableEdit()
})

Arm.prototype.applyState = function (state) {
  Widget.prototype.applyState.call(this, state)

  this.resize()
  this.updateAngles(true)
}

Arm.prototype.shouldSend = function () {
  return this.bones !== null && this.animation === null
}

Arm.prototype.resize = function () {
  this.unit =
    Math.min(this.canvas.width * 0.6, this.canvas.height * 0.8) /
    this.ARM_TOTAL_LEN

  var w = this.canvas.width / this.buttons.length
  var h = this.canvas.height * 0.15
  var y = this.canvas.height - h
  var x = 0
  for (var i = 0; i < this.buttons.length; ++i) {
    var b = this.buttons[i]
    b.x = x
    b.y = y
    b.w = w
    b.h = h
    x += w
  }

  this.origin.x = this.BODY_RADIUS * this.unit
  this.origin.y =
    y - this.BODY_HEIGHT * 1.3 * this.unit - this.unit * this.ARM_BASE_HEIGHT

  this.draw()
}

Arm.prototype.updatePosition = function (x, y, scaleX, scaleY) {
  Widget.prototype.updatePosition.call(this, x, y, scaleX, scaleY)

  setTimeout(this.canvas.setSize.bind(this.canvas), 0)
}

Arm.prototype.getTouchedButton = function () {
  var x = this.pointer.x
  var y = this.pointer.y
  for (var i = 0; i < this.buttons.length; ++i) {
    var b = this.buttons[i]
    if (x > b.x && x < b.x + b.w && y > b.y && y < b.y + b.h) return b
  }
  return null
}

Arm.prototype.handleButton = function (text) {
  switch (text) {
    case 'RETRACT':
      if (this.animation !== null) break
      this.animation = new Animation(this)
      this.animation.addFrame(145, -35, 600)
      this.animation.addFrame(35, 19, 300)
      this.animation.start()
      break
    case 'EXTEND':
      if (this.animation !== null) break
      this.animation = new Animation(this)
      this.animation.addFrame(145, -35, 500)
      this.animation.addFrame(200, 18, 200)
      this.animation.addFrame(140, 79, 300)
      this.animation.start()
      break
    case 'GRAB':
      this.sendEvent('grab')
      break
  }
}

Arm.prototype.drawSegment = function (seg, color) {
  this.drawLine(seg.sx, seg.sy, seg.ex, seg.ey, color, 3, 6)
}

Arm.prototype.drawPointer = function (src, dst, color) {
  var ctx = this.canvas.ctx
  ctx.beginPath()
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = 2
  ctx.setLineDash([6, 3])
  ctx.moveTo(src.x, src.y)
  //  ctx.lineTo(dst.x, dst.y);
  ctx.moveTo(dst.x + this.TOUCH_TARGET_SIZE * 2, dst.y)
  ctx.arc(dst.x, dst.y, this.TOUCH_TARGET_SIZE * 2, 0, 2 * Math.PI)
  ctx.stroke()
  ctx.setLineDash([])
}

Arm.prototype.drawCircleDashed = function (x, y, radius, color) {
  var ctx = this.canvas.ctx
  ctx.beginPath()
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.setLineDash([6, 3])
  ctx.moveTo(x, y)
  ctx.arc(x, y, radius, 0, 2 * Math.PI)
  ctx.stroke()
  ctx.setLineDash([])
}

Arm.prototype.drawTouchTarget = function (x, y) {
  var ctx = this.canvas.ctx
  ctx.beginPath()
  ctx.fillStyle = 'red'
  ctx.moveTo(x, y)
  ctx.arc(x, y, this.TOUCH_TARGET_SIZE, 0, 2 * Math.PI)
  ctx.fill()
}

Arm.prototype.drawLine = function (x0, y0, x1, y1, color, width, dotRadius) {
  var ctx = this.canvas.ctx
  ctx.beginPath()
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = width
  ctx.moveTo(x0, y0)
  ctx.lineTo(x1, y1)
  ctx.stroke()
  if (dotRadius !== undefined) {
    ctx.moveTo(x0, y0)
    ctx.arc(x0, y0, dotRadius, 0, 2 * Math.PI)
    ctx.moveTo(x1, y1)
    ctx.arc(x1, y1, dotRadius, 0, 2 * Math.PI)
    ctx.fill()
  }
}

Arm.prototype.updateAngles = function (updateAbsAngles) {
  var prev = null
  for (var i = 0; i < this.bones.length; ++i) {
    if (updateAbsAngles === true) this.bones[i].updatePos(prev, this.unit)
    prev = this.bones[i]
  }
}

Arm.prototype.run = function () {
  var dx = this.pointer.x - this.origin.x
  var dy = this.pointer.y - this.origin.y
  for (var i = 0; i < 10; ++i) {
    var res = this.solve(dx, dy)
    if (res == 0) {
      continue
    } else if (res == -1) {
      //console.log("FAILED");
    }
    break
  }

  this.updateAngles(true)
  this.draw()
}

Arm.prototype.getTargetPos = function () {
  if (this.bones === null || this.bones.length === 0) return null

  var end = this.bones[this.bones.length - 1]
  return {
    x: end.x / this.unit,
    y: end.y / this.unit
  }
}

Arm.prototype.draw = function () {
  var ctx = this.canvas.ctx

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

  ctx.font = '12px monospace'
  ctx.fillStyle = 'black'
  var dx = (this.pointer.x - this.origin.x) / this.unit
  var dy = (this.pointer.y - this.origin.y) / this.unit
  ctx.fillText(dx.toFixed(1), 20, 12)
  ctx.fillText(dy.toFixed(1), 20, 24)

  var tgt = this.getTargetPos()
  if (tgt !== null) {
    ctx.fillText(tgt.x.toFixed(1), 80, 12)
    ctx.fillText(tgt.y.toFixed(1), 80, 24)
  }

  ctx.save()
  ctx.translate(this.origin.x, this.origin.y)
  var w = this.unit * this.BODY_RADIUS * 2
  var h = this.unit * this.BODY_HEIGHT

  ctx.fillStyle = '#C8A165'
  ctx.fillRect(-w / 2, this.ARM_BASE_HEIGHT * this.unit, w, h)

  for (var i = 0; i < this.bones.length; ++i) {
    var s = this.bones[i]

    ctx.save()
    ctx.rotate(s.relAngle)
    this.drawLine(0, 0, s.length * this.unit, 0, s.color, 3, 6)

    ctx.translate(s.length * this.unit, 0)
  }

  for (var i = 0; i < this.bones.length; ++i) {
    ctx.restore()
  }

  /*ctx.font = '18px monospace';
    ctx.fillStyle = "black"
    var y = this.BODY_HEIGHT*this.unit;
    for(var i = 0; i < this.bones.length; ++i) {
        var b = this.bones[i];

        ctx.fillText((b.angle >= 0 ? " " : "") + b.angle.toFixed(2), -100, y);
        ctx.fillText((b.angle >= 0 ? " " : "") + deg(b.angle).toFixed(2), 0, y);
        ctx.fillText((b.relAngle >= 0 ? " " : "") + b.relAngle.toFixed(2), 100, y);
        ctx.fillText((b.relAngle >= 0 ? " " : "") + deg(b.relAngle).toFixed(2), 200, y);

        var relBase = this.bones[i].angle - this.bones[0].angle;
        ctx.fillText((relBase >= 0 ? " " : "") + relBase.toFixed(2), -350, y);
        y += 20;
    }*/

  ctx.restore()

  ctx.strokeStyle = 'blue'
  ctx.lineWidth = 3
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = this.buttons[0].h / 3 + 'px monospace'
  ctx.fillStyle = 'black'
  for (var i = 0; i < this.buttons.length; ++i) {
    var b = this.buttons[i]
    if (b.blink) {
      ctx.fillStyle = 'red'
      ctx.fillRect(b.x, b.y, b.w, b.h)
      ctx.fillStyle = 'black'
    }
    ctx.strokeRect(b.x, b.y, b.w, b.h)
    ctx.fillText(b.text, b.x + b.w / 2, b.y + b.h / 2)
  }

  this.drawPointer(this.origin, this.pointer, 'red')
}

Bone.prototype.rotate = function (prev, rotAng) {
  var newRelAng = clampAng(this.relAngle + rotAng)
  var _min = this.relMin
  var _max = this.relMax
  if (newRelAng < _min) {
    newRelAng = _min
  } else if (newRelAng > _max) {
    newRelAng = _max
  }

  var res = clampAng(newRelAng - this.relAngle)
  this.relAngle = newRelAng
  return res
}

Arm.prototype.fixBodyCollision = function () {
  var base = this.bones[0]
  var endBone = this.bones[this.bones.length - 1]
  base.relAngle = Math.min(Math.max(base.relAngle, base.relMin), base.relMax)
  this.updateAngles(true)

  while (this.isInBody(endBone.x, endBone.y)) {
    var newang = clampAng(base.relAngle - 0.01)
    if (newang > base.relMax || newang < base.relMin) return
    base.relAngle = newang
    this.updateAngles(true)
  }
}

Arm.prototype.isInBody = function (x, y) {
  return (
    Math.abs(x) <= this.BODY_RADIUS * this.unit &&
    y >= this.ARM_BASE_HEIGHT * this.unit
  )
}

Arm.prototype.solve = function (targetX, targetY) {
  if (this.bones === null || this.bones.length === 0) return

  var prev = null
  for (var i = 0; i < this.bones.length; ++i) {
    this.bones[i].updatePos(prev, this.unit)
    prev = this.bones[i]
  }

  // Limit under-robot positions
  if (targetX < this.unit * this.BODY_RADIUS) {
    if (targetY > this.unit * this.ARM_BASE_HEIGHT)
      targetY = this.unit * this.ARM_BASE_HEIGHT
  } else {
    if (targetY > this.unit * (this.ARM_BASE_HEIGHT + this.BODY_HEIGHT))
      targetY = this.unit * (this.ARM_BASE_HEIGHT + this.BODY_HEIGHT)
  }

  if (targetX < 5 * this.unit) {
    targetY = 0
    targetX = 0
  }

  var endX = prev.x
  var endY = prev.y

  var modifiedBones = false
  for (var i = this.bones.length - 1; i >= 0; --i) {
    var b = this.bones[i]

    var bx = 0
    var by = 0
    if (i > 0) {
      bx = this.bones[i - 1].x
      by = this.bones[i - 1].y
    }

    // Get the vector from the current bone to the end effector position.
    var curToEndX = endX - bx
    var curToEndY = endY - by
    var curToEndMag = Math.sqrt(curToEndX * curToEndX + curToEndY * curToEndY)

    // Get the vector from the current bone to the target position.
    var curToTargetX = targetX - bx
    var curToTargetY = targetY - by
    var curToTargetMag = Math.sqrt(
      curToTargetX * curToTargetX + curToTargetY * curToTargetY
    )

    // Get rotation to place the end effector on the line from the current
    // joint position to the target postion.
    var cosRotAng
    var sinRotAng
    var endTargetMag = curToEndMag * curToTargetMag

    if (endTargetMag <= 0.0001) {
      cosRotAng = 1
      sinRotAng = 0
    } else {
      cosRotAng =
        (curToEndX * curToTargetX + curToEndY * curToTargetY) / endTargetMag
      sinRotAng =
        (curToEndX * curToTargetY - curToEndY * curToTargetX) / endTargetMag
    }

    // Clamp the cosine into range when computing the angle (might be out of range
    // due to floating point error).
    var rotAng = Math.acos(Math.max(-1, Math.min(1, cosRotAng)))
    if (sinRotAng < 0.0) rotAng = -rotAng

    // Rotate the current bone in local space (this value is output to the user)
    // b.angle = overflow(b.angle + rotAng, Math.PI*2);
    rotAng = this.rotateArm(this.bones, i, rotAng)
    cosRotAng = Math.cos(rotAng)
    sinRotAng = Math.sin(rotAng)

    // Rotate the end effector position.
    endX = bx + cosRotAng * curToEndX - sinRotAng * curToEndY
    endY = by + sinRotAng * curToEndX + cosRotAng * curToEndY

    // Check for termination
    var endToTargetX = targetX - endX
    var endToTargetY = targetY - endY
    if (endToTargetX * endToTargetX + endToTargetY * endToTargetY <= 10) {
      this.fixBodyCollision()
      // We found a valid solution.
      return 1
    }

    // Track if the arc length that we moved the end effector was
    // a nontrivial distance.
    if (!modifiedBones && Math.abs(rotAng) * curToEndMag > 0.000001)
      modifiedBones = true
  }

  this.fixBodyCollision()

  if (modifiedBones) return 0
  return -1
}

Arm.prototype.rotateArm = function (bones, idx, rotAng) {
  var me = bones[idx]

  var base = bones[0]

  var newRelAng = clampAng(me.relAngle + rotAng)
  var _min = me.relMin
  var _max = me.relMax
  if (newRelAng < _min) {
    newRelAng = _min
  } else if (newRelAng > _max) {
    newRelAng = _max
  }

  var x = 0
  var y = 0
  var prevAng = 0
  for (var i = 0; i < bones.length; ++i) {
    var b = bones[i]
    var angle = b.relAngle
    if (idx == i) {
      angle = newRelAng
    }
    angle = clampAng(prevAng + angle)

    // arm helper-sticks collision with the bottom of the servo stand
    if (i == idx) {
      if (angle < b.absMin) {
        angle = b.absMin
        newRelAng = clampAng(angle - prevAng)
      } else if (angle > b.absMax) {
        angle = b.absMax
        newRelAng = clampAng(angle - prevAng)
      }
    }

    var nx = x + Math.cos(angle) * b.length * this.unit
    var ny = y + Math.sin(angle) * b.length * this.unit

    if (i > 0) {
      var diff = angle - base.angle
      if (diff < b.baseMin) {
        base.angle = clampAng(angle - b.baseMin)
      } else if (diff > b.baseMax) {
        base.angle = clampAng(angle - b.baseMax)
      }
    }

    x = nx
    y = ny
    prevAng = angle
  }

  var res = clampAng(newRelAng - me.relAngle)
  me.relAngle = newRelAng
  return res
}

Arm.prototype.update = function (diffMs) {
  if (!this.shouldSend()) return
  var pos = this.getTargetPos()
  if (pos !== null)
    this.sendEvent(
      'pos',
      {
        armX: pos.x,
        armY: pos.y
      },
      false
    )
}
