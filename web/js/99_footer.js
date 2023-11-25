window.addEventListener('load', function () {
  // Detect captive portal and show message
  var ua = window.navigator.userAgent;
  if(ua.indexOf("; wv)") !== -1 && ua.indexOf("Chrome/") !== -1 && ua.indexOf("Version/") !== -1 && ua.indexOf("Android") !== -1) {
    document.getElementById("main-ui").style.display = "none";
    document.getElementById("captive-msg").style.display = "block";

    document.getElementById("captive-url").innerText = window.location.origin;
    document.getElementById("captive-link").href = "intent://" + window.location.hostname + "#Intent;scheme=http;end";
    return;
  }

  var man = new Manager('log', 'grid')

  // Detect whether we're running in RBController or just web browser
  if("RbGravitySensor" in window || window.navigator.userAgent.toLowerCase().indexOf("rbcontroller") !== -1) {
    man.start('ws://localhost:9000', false);
  } else {
    man.start('ws://' + window.location.host, true)
  }
})

function closeCaptivePortalNotice() {
  document.getElementById('main-ui').style.display = "block";
  document.getElementById('captive-msg').style.display = 'none'
}
