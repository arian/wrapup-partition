(function(){
    var map = {files: [], modules: {}}
    var modules = map.modules, files = map.files
    var paths = {}
    for (var name in modules){
        paths[name] = files[modules[name]].slice(0, -3)
    }
    window.global = window
    requirejs.config({
        paths: paths
    })
})()
