window.addEventListener('load', function () {
  var man = new Manager('log', 'grid')
  man.start('ws://localhost:9000')
})
