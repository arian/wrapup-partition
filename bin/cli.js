"use strict";

var fs = require('fs')
var forOwn = require('prime/object/forOwn')
var program = require('wrapup/bin/cli')
var wrapup = program.wrapup
var Partition = require('../lib/partition')

program.command('partition')
    .description('convert the modules to a partitioned AMD-lik format')
    .option('-o, --output <path>', 'Output directory')
    .option('--path <path>', 'The base path of the modules, so <path>/bar/foo.js becomes bar/foo as module ID')
    .option('--map <file>', 'A JSON file containing the mapping of the modules')
    .action(function(args){

        if (!args.output){
            console.error('The --output option is required')
            return
        }

        var partition = new Partition()
        partition.set('output', args.output)
        partition.set('path', args.path)

        if (args.map){
            var map = JSON.parse(fs.readFileSync(args.map))
            var path = args.path || process.cwd()
            forOwn(map, function(files){
                files.forEach(function(file){
                    wrapup.require(path + '/' + file)
                })
            })
            partition.set('map', map)
        }

        wrapup.withOutput(partition)
        wrapup.up(function(err, str){
            console.log(err, str)
        })
    })

module.exports = program
