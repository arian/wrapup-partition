"use strict";

var forOwn = require('prime/object/forOwn')

// this function finds out to which file some module should be written. For
// example when a requires b, and no other module requires b, then b should be
// written to the same file as a.
module.exports = function(map, storage, _path){

    // object with the modules, keys are the output filenames
    var result = {modules: {}, notFound: {}}

    var moduleBelongsTo = {}
    var modulesByID = {}

    // initialize modulesByID and moduleBelongsTo objects
    storage.each(function(module){
        moduleBelongsTo[module.full] = {}
        modulesByID[module.getModuleID(_path)] = module
    })

    var first = 0, firstFile = 'main.js'
    // for each file
    forOwn(map, function(mds, file){

        // set first file
        if (first++ === 0) firstFile = file

        // traverse dependencies, and assign this file to the module
        var search = function(dependencies){
            dependencies.forEach(function(dep){
                var belong = moduleBelongsTo[dep.full]
                var count = belong[file] = (belong[file] || 0) + 1
                // stop at 3, otherwise it might be a cyclic dependency
                if (count <= 3) search(dep.dependencies)
            })
        }

        // top level modules
        var dependencies = []

        ;(Array.isArray(mds) && mds || []).forEach(function(id){
            var module = modulesByID[id]
            if (!module) result.notFound[file] = id
            else dependencies.push(module)
        })

        search(dependencies)

        // array that will hold the modules by filename eventually
        result.modules[file] = []
    })

    if (!result.modules[firstFile]) result.modules[firstFile] = []

    forOwn(moduleBelongsTo, function(files, full){
        // determine which file claims the module the most. If it's a dangling
        // file, it's automatically added to the 'main.js'
        var file = 'main.js', count = 0
        for (var f in files) if (f == firstFile || files[f] > count){
            file = f
            count = files[f]
            // even though a module really belongs to another file, but is
            // required by the main file, it should be in the main file.
            // This solves immediate loading of a second file in the browser
            if (f == firstFile) break
        }
        result.modules[file].push(storage.get(full))
    })

    return result

}
