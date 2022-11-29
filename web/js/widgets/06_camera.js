function Camera(grid, uuid) {
  var el = document.createElement('canvas')
  Widget.call(this, grid, uuid, Widget.wrapCanvas(el))

  this.w = 4
  this.h = 4
  this.rotation = 90
  this.clip = false
  this.frame = null
  this.badStatus = false

  this.canvas = ge1doot.canvas(el)
  this.canvas.resize = this.draw.bind(this)

  if(window['IN_RB_GRID_DESIGNER'] !== true) {
    this.scheduleFrameDownload();
  }
}

Widget.createSubclass(Camera, {
  rotation: new Prop(Number),
  clip: new Prop(Boolean)
})

Camera.prototype.MIN_LIBRARY_VERSION = 0x041000

Camera.prototype.updatePosition = function (x, y, scaleX, scaleY) {
  Widget.prototype.updatePosition.call(this, x, y, scaleX, scaleY)

  setTimeout(this.canvas.setSize.bind(this.canvas), 0)
}

Camera.prototype.applyState = function (state) {
  Widget.prototype.applyState.call(this, state)
  this.draw()
}

Camera.prototype.scheduleFrameDownload = function() {
  requestAnimationFrame(this.downloadFrame.bind(this))
}

Camera.prototype.downloadFrame = function() {
  this.badStatus = false

  var req = new XMLHttpRequest();
  req.responseType = 'blob';
  req.timeout = 1000

  req.addEventListener("load", function() {
    if(req.status !== 200) {
      this.badStatus = true
      this.draw()
      setTimeout(this.scheduleFrameDownload.bind(this), 10000)
      return;
    }

    createImageBitmap(req.response)
      .then(function(bitmap) {
        if(this.frame !== null) {
          this.frame.close()
        }
        this.frame = bitmap
        this.draw()
      }.bind(this))
  }.bind(this));

  req.addEventListener("loadend", function() {
    if(!this.badStatus) {
      this.scheduleFrameDownload()
    }
  }.bind(this))
  
  req.open("GET", "/extra/camera.jpg");
  req.send();
}

Camera.prototype.draw = function() {
  var ctx = this.canvas.ctx
  var cw = this.canvas.width
  var ch = this.canvas.height

  var fw, fh
  if(this.frame !== null) {
    fw = this.frame.width
    fh = this.frame.height
  } else {
    fw = 4
    fh = 3
  }

  ctx.clearRect(0, 0, cw, ch)
  ctx.save();
  ctx.translate(cw/2,ch/2);

  // swap dimensions on rotation
  if(this.rotation%180 >= 45 && this.rotation%180 < 135) {
    var t = cw
    cw = ch
    ch = t
  }

  var ratioCanvas = cw / ch
  var rationFrame = fw / fh

  var scaledW, scaledH
  if(!this.clip) {
    if(rationFrame > ratioCanvas) {
      scaledW = cw
      scaledH = cw / rationFrame
    } else {
      scaledH = ch
      scaledW = ch * rationFrame
    }
  } else {
    if(rationFrame > ratioCanvas) {
      scaledH = ch
      scaledW = ch * rationFrame
    } else {
      scaledW = cw
      scaledH = cw / rationFrame
    }
  }

  if(this.frame !== null) {
    ctx.rotate(this.rotation*Math.PI/180);
    ctx.drawImage(this.frame, -scaledW/2, -scaledH/2, scaledW, scaledH)
  } else {
    ctx.font = "16px serif";
    ctx.textAlign = "center"
    if(this.badStatus) {
      ctx.fillText("No camera present.", 0, 0, Math.min(cw, ch))
    } else {
      ctx.fillText("No frame yet.", 0, 0, Math.min(cw, ch))
    }

    ctx.rotate(this.rotation*Math.PI/180);
    ctx.strokeStyle = "black";
    ctx.strokeRect(-scaledW/2, -scaledH/2, scaledW, scaledH)
  }
  
  ctx.restore()
}
