"use strict";

var prime          = require('prime')
var async          = require('async')
var path           = require('path')
var mkdirp         = require('mkdirp')
var fs             = require('fs')
var forOwn         = require('prime/object/forOwn')
var Output         = require('wrapup/lib/output')
var util           = require('wrapup/lib/util')
var errors         = require('wrapup/lib/errors')
var escodegen      = require('escodegen')
var resolveMapping = require('./resolveMapping')

var includes      = __dirname + '/../includes'
var getDefineAST  = util.getAST('module',  includes)
var getWrapperAST = util.getAST('wrapper', includes)
var getMainAST    = util.getAST('main',    includes)

var Partition = prime({

    inherits: Output,

    up: function(callback){
        var self = this

       if (!this.options.output){
            callback(new errors.RequiredOutputError())
            return this
        }

        var options = this.options
        this._path = (options.path ? options.path : process.cwd()) + '/a'

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

        var self       = this
        var options    = this.options
        var map        = options.map || {}
        var output     = options.output
        var modules    = []
        var tasks      = []
        var first      = 0

        var resolved = resolveMapping(map, this.storage, this._path)

        forOwn(resolved.notFound, function(id, out){
            self.emit("warn", new Error("Module '" + id + "' in mapping not found"))
        })

        forOwn(resolved.doubles, function(id, out){
            self.emit("warn", new Error("Module '" + id + "' appears more than once in the mapping"))
        })

        forOwn(resolved.modules, function(modules, file){
            var ast = util.clone(wrapperAST)
            if (first++ === 0) self.addMainToAST(ast, resolved.modules, mainAST)
            self.addModulesToAST(ast, modules, defineAST)
            tasks.push(function(callback){
                self.writeFile(file, ast, callback)
            })
        })

        async.parallel(tasks, callback)
    },

    addMainToAST: function(ast, map, mainAST){
        var self = this
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
                    key: {type: "Literal", value: module.getModuleID(self._path)},
                    value: {type: "Literal", value: i - 1},
                    kind: "init"
                })
            })
        })
    },

    addModulesToAST: function(wrapper, modules, defineAST){
        var _path = this._path
        modules.forEach(function(module){

            if (!module || !module.full || module.err) return

            var ast = util.clone(module.ast)

            // replace require() calls
            Output.replaceRequire(ast, module, function(dep){
                return dep.getModuleID(_path)
            })

            var newAST = util.clone(defineAST.body[0])
            var args = newAST.expression['arguments']

            // change module ID
            args[0].value = module.getModuleID(_path)

            // add dependencies to the dependency array
            var deps = args[1].elements
            module.dependencies.forEach(function(dep){
                if (dep) deps.push({type: "Literal", value: dep.getModuleID(_path)})
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
        var self      = this
        var output    = this.options.output
        var asASTJSON = this.options.ast

        var filename = path.normalize(output + '/' + file)
        if (asASTJSON){
            var ext = path.extname(filename);
            filename = filename.slice(0, - ext.length) + '.json'
        }

        var code = asASTJSON ?
            JSON.stringify(ast, null, 2) :
            escodegen.generate(ast)

        async.series([
            async.apply(mkdirp, path.dirname(filename)),
            async.apply(fs.writeFile, filename, code)
        ], function(err){
            if (!err) self.emit("output", filename)
            callback(err, filename)
        })
    }

})

module.exports = Partition
