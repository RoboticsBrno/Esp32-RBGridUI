window.addEventListener('load', function () {
  var man = new Manager('log', 'grid')

  // Detect whether we're running in RBController or just web browser
  if("RbGravitySensor" in window || window.navigator.userAgent.toLowerCase().indexOf("rbcontroller") !== -1) {
    man.start('ws://localhost:9000', false);
  } else {
    man.start('ws://' + window.location.host, true)
  }
})
