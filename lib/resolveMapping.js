"use strict";

var forOwn = require('prime/object/forOwn')

// this function finds out to which file some module should be written. For
// example when a requires b, and no other module requires b, then b should be
// written to the same file as a.
module.exports = function(map, storage, _path){

    // object with the modules, keys are the output filenames
    var result = {modules: {}, notFound: {}, doubles: {}}
    var modulesMap = result.modules

    // make sure there is a main.js file. The first item in the object
    var files = Object.keys(map)
    if (!files.length){
        files.push('main.js')
        modulesMap['main.js'] = []
    }
    var first = files[0]

    // track the added modules.
    var added = {}

    // module ids, with output file as key
    var outputByID = {}

    // files in the given mapping
    forOwn(map, function(ids, out){
        var modulesInFile = modulesMap[out] = []
        ids.forEach(function(id, i){
            if (outputByID[id]){
                result.doubles[id] = out
            } else {
                outputByID[id] = out
            }
        })
    })

    storage.each(function(module){

        var id = module.getModuleID(_path)
        var file = outputByID[id]
        added[id] = true

        if (file){
            modulesMap[file].push(module)
            return
        }

        var searched = {}
        var found = []

        var search = function(dependents){
            dependents.forEach(function(dep){
                // prevent recursing into cycles
                if (searched[dep.full]) return
                searched[dep.full] = true

                // see if the dependent is somewhere in the mapping
                var file = outputByID[dep.getModuleID(_path)]
                if (file) found.push(file)

                // or maybe look it up recursively
                else search(dep.dependents)
            })
        }

        search(module.dependents)

        // only if the module is required by the subgraph of one output
        // file with modules, add it to this file too, otherwise the module
        // is shared
        file = found.length == 1 ? found[0] : first
        modulesMap[file].push(module)
        // fill outputByID, so output files for other modules are found earlier
        outputByID[id] = file

    })

    forOwn(outputByID, function(out, id){
        if (!added[id]) result.notFound[id] = out
    })

    return result

}
