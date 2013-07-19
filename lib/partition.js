"use strict";

var prime       = require('prime')
var async       = require('async')
var path        = require('path')
var mkdirp      = require('mkdirp')
var fs          = require('fs')
var forOwn      = require('prime/object/forOwn')
var mapObject   = require('prime/object/map')
var Output      = require('wrapup/lib/output')
var util        = require('wrapup/lib/util')
var ModulesByID = require('wrapup/lib/output/mixin/modulesByID')
var errors      = require('wrapup/lib/errors')
var escodegen   = require('escodegen')

var includes = __dirname + '/../includes'
var getDefineAST  = util.getAST('module',  includes)
var getWrapperAST = util.getAST('wrapper', includes)
var getMainAST    = util.getAST('main',    includes)

var Partition = prime({

    inherits: Output,

    modulesByID: ModulesByID.prototype.modulesByID,

    modulesByFileID: function(){
        var _modules = this.modulesByID()
        var modules = {}
        forOwn(_modules, function(module){
            modules[module.fileID] = module
        })
        return modules
    },

    up: function(callback){
        var self = this

       if (!this.options.output){
            callback(new errors.RequiredOutputError())
            return this
        }

        async.parallel([
            getDefineAST,
            getWrapperAST,
            getMainAST
        ], function(err, results){
            if (err) callback(err)
            else self.output(callback, results[0], results[1], results[2])
        })
    },

    output: function(callback, defineAST, wrapperAST, mainAST){

        var self    = this
        var options = this.options
        var map     = util.clone(options.map || {})
        var output  = options.output
        var modules = this.modulesByFileID()
        var storage = this.storage

        // make sure there is a main.js file. The first item in the object
        var outputs = Object.keys(map)
        if (!outputs.length){
            outputs.push('main.js')
            map['main.js'] = []
        }

        var firstInMap
        for (var x in map){
            firstInMap = map[x]
            break
        }

        // track the added modules.
        var added = {}

        // files in the given mapping
        forOwn(map, function(files, out){
            files.forEach(function(file, i){
                var module = modules[file]
                if (module){
                    added[module.full] = true
                    map[out][i] = module
                } else {
                    self.emit("warn", new Error("File in mapping not found"))
                }
            })
        })

        // add other files in the main file
        storage.each(function(module, full){
            if (!added[full]) firstInMap.push(module)
        })

        var tasks = []

        forOwn(map, function(modules, file){
            var ast = util.clone(wrapperAST)
            if (modules == firstInMap) self.addMainToAST(ast, map, mainAST)
            self.addModulesToAST(ast, modules, defineAST)
            tasks.push(function(callback){
                self.writeFile(file, ast, callback)
            })
        })

        async.parallel(tasks, callback)
    },

    addMainToAST: function(ast, map, mainAST){
        var main = util.clone(mainAST.body[0])
        ast.body.push(main)
        var mapping = main.expression.callee.body.body[0].declarations[0].init.properties
        var files = mapping[0].value.elements
        var modules = mapping[1].value.properties
        forOwn(map, function(mods, file){
            var i = files.push({type: "Literal", value: file})
            mods.forEach(function(module){
                modules.push({
                    type: "Property",
                    key: {type: "Literal", value: module.fileID},
                    value: {type: "Literal", value: i - 1}
                })
            })
        })
    },

    addModulesToAST: function(wrapper, modules, defineAST){
        modules.forEach(function(module){

            if (!module || !module.full || module.err) return

            var ast = util.clone(module.ast)

            // replace require() calls
            Output.replaceRequire(ast, module, 'fileID')

            var newAST = util.clone(defineAST.body[0])
            var args = newAST.expression['arguments']

            // change module ID
            args[0].value = module.fileID

            // add dependencies to the dependency array
            var deps = args[1].elements
            module.deps.forEach(function(dep){
                if (dep) deps.push({type: "Literal", value: dep.fileID})
            })

            // body of the define function
            var body = args[2].body.body
            // put the module JS in the define factory function
            for (var i = 0; i < ast.body.length; i++){
                body.push(ast.body[i])
            }

            // and add the define() function to the wrapper
            wrapper.body.push(newAST)
        })
    },

    writeFile: function(file, ast, callback){
        var output = this.options.output
        var self = this
        var code = escodegen.generate(ast)
        var filename = path.normalize(output + '/' + file)

        async.series([
            async.apply(mkdirp, path.dirname(filename)),
            async.apply(fs.writeFile, filename, code)
        ], function(err){
            if (!err) self.emit("output", filename)
            callback(err)
        })
    }

})

module.exports = Partition
