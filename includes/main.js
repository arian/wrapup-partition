(function(){

    var map = {files: [], modules: {}}
/*
    var mods          = {},
        required      = {},
        doc           = document,
        head          = doc.getElementsByTagName('head')[0],
        waiting       = [],
        requireString = 'require';

    function syncRequire (name) {
        if (! mods[name] && ! required[name]) {
            throw 'module ' + name + ' has not been loaded';
        }
        return mods[name] || required[name];
    }

    function process () {
        for (var i = 0; i < waiting.length; i++) {
            var ready = 1, mod, args;
            for (var j = 0; j < waiting[i].length - 1; j++) {
                if (typeof waiting[i][j] == 'string') {
                    if (mod = mods[waiting[i][j]]) {
                        waiting[i][j] = mod;
                    }
                    else {
                        ready = 0;
                    }
                }
            }
            if (ready) {
                mod = waiting[i].pop();
                args = waiting[i];
                waiting.splice(i--, 1);
                mod.apply(null, args);
            }
        }
    }

    var require = window.require = function (deps, callback) {
        var url, script, name;
        for (var i = 0; i < deps.length; i++) {
            name = deps[i];
            if (typeof name == 'string') {
                if (name == requireString) {
                    name = syncRequire;
                }
                else if (mods[name]) {
                    name = mods[name];
                }
                else if (! required[name]) {
                    required[name] = {};
                    url = map.files[map.modules[name]]
                    script = doc.createElement('script');
                    script.type = 'text/javascript';
                    script.src = url;
                    head.appendChild(script);
                }
            }
        }
        deps.push(callback);
        waiting.push(deps);
        process();
    };

    var define = require.def = window.define = function (name, deps, callback) {
        var mod = { name: name, exports: required[name] || {} },
            exportsString = 'exports', moduleString = 'module';
        if (! callback) {
            callback = deps;
            deps = [requireString, exportsString, moduleString];
        }
        if (typeof callback != 'function') {
            mods[name] = callback;
            process();
            return;
        }
        for (var i = 0; i < deps.length; i++) {
            deps[i] =
                deps[i] == moduleString ?
                    mod :
                deps[i] == exportsString ?
                    mod.exports :
                deps[i] == requireString ?
                    syncRequire :
                    deps[i];
        }
        require(deps, function () {
            var ret = callback.apply(null, arguments);
            if (ret) {
                mods[name] = ret;
            }
            else {
                mods[name] = mod.exports;
            }
            process();
        });
    };

    define.amd = {};
*/
})();

/*
    var mods = {}

    if (typeof define == 'undefined'){

        window.define = function(id, deps, factory){
            console.log(id)
            modules[id] = factory
        }

        window.require = function(id, callback){
            var module = cache[id]
            if (module){
                callback(module.exports)
            } else {
                load(id, function(){
                    callback(require(id))
                })
            }
        }
    }

    function require(id){
        var module = cache[id]
        if (!module){
            module = cache[id] = {}
            var exports = module.exports = {}
            modules[id].call(exports, require, exports, module)
        }
        return module.exports
    }

    function loadAll(ids, callback){
        var todo = ids.length
        for (var i = 0; i < ids.length; i++){
            if (/exports|module|require/.test(ids[i])) continue
            load(ids[i], function(){
                if (--todo) callback()
            })
        }
    }

    function getFilename(id){
        var file = map.files[map.modules[id]]
        if (!file){
            if (window.console) console.error(id + " does not exist")
        }
        return file
    }

    function load(file, callback){

        // it's done loading
        if (loaded[file]){
            callback()
            return
        }

        // it's still loading
        if (loading[file]){
            loading[file].push(callback)
            return
        }

        // it isn't loaded yet
        var callbacks = loading[file] = [callback]
        var ready = function(){
            loaded[file] = true
            for (var i = 0; i < callbacks.length; i++){
                callbacks[i]()
            }
        }

        var script = document.createElement('script')
        script.type = 'text/javascript'

        if (!script.addEventListener && script.attachEvent){
            script.attachEvent('readystatechange', function(){
                if (/loaded|complete/.test(this.readyState)) ready()
            }, false)
        } else {
            script.addEventListener('load', ready, false)
        }

        script.src = file

        var head = (document.head || document.getElementsByTag('head')[0])
        head.appendChild(script)
    }

    window.bar = load
})()

*/
