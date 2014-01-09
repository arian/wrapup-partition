(function(){
    var map = {files: [], modules: {}}
    var modules = map.modules, files = map.files
    var paths = {}, defines = {}
    for (var name in modules){
        paths[true ? modules[name][1] : name] = files[modules[name][0]].slice(0, -3)
        defines[name] = true ? modules[name][1] : name
    }
    window.global = window
    requirejs.config({
        paths: paths
    })
    define('wrapup-names', defines)
    define('wrapup-paths', paths)
    define('wrapup-require', function(){
        return function(ids, success, error){
            for (var i = 0; i < ids.length; i++) {
                if (defines.hasOwnProperty(ids[i])) {
                    ids[i] = defines[ids[i]]
                }
            }
            requirejs(ids, success, error)
        }
    })
})()
