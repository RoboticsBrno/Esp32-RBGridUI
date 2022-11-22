function Camera(grid, uuid) {
  var el = document.createElement('img')

  Widget.call(this, grid, uuid, el)

  this.w = 4
  this.h = 4
  this.lastUrl = null

  if(window['IN_RB_GRID_DESIGNER'] !== true) {
    this.scheduleFrameDownload();
  }
}

Widget.createSubclass(Camera, {

})

Camera.prototype.scheduleFrameDownload = function() {
  requestAnimationFrame(this.downloadFrame.bind(this))
}

Camera.prototype.downloadFrame = function() {
    var req = new XMLHttpRequest();
    req.responseType = 'blob';
    req.timeout = 1000

    req.addEventListener("load", function() {
      var newUrl = URL.createObjectURL(resp.response);
      this.el.src = newUrl;
      if(this.lastUrl !== null) {
        URL.revokeObjectURL(this.lastUrl)
      }
      this.lastUrl = newUrl;
    }.bind(this));

    req.addEventListener("loadend", this.scheduleFrameDownload.bind(this))
    req.addEventListener("timeout", this.scheduleFrameDownload.bind(this))
    
    req.open("GET", "/extra/camera.jpg");
    req.send();
}
