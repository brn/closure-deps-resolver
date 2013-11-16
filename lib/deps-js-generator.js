/**
 * @fileoverview
 * @author Taketshi Aono
 */

'use strict';

var pathUtil = require('./pathutil');
var Promise = require('node-promise');
var fs = require('fs');


/**
 * @constructor
 * @param {string} name
 */
function DepsJsGenerator(name) {
  this._name = name;
}


DepsJsGenerator.prototype.generate = function(modules) {
  var deps = {};
  var code = '';

  Object.keys(modules).forEach(function(moduleName) {
    var module = modules[moduleName];
    module.getDependentModules().forEach(function(m) {
      var filename = m.getFilename();
      deps[filename] = ['', ''];
      if (m._nameMap.requires.length) {
        deps[filename][0] = '"' + m._nameMap.requires.join('","') + '"';
      }
      if (m._providedModules.length) {
        deps[filename][0] = '"' + m._providedModules.join('","') + '"';
      }
    });
    for (var prop in deps) {
      code += 'goog.addDependency("' + pathUtil.relative(this._root, prop) + '", [' + deps[prop][0] + '], [' + deps[prop][1] + ']);\n';
    }
  });

  var defer = Promise.defer();
  fs.writeFile(this._name, code, 'utf-8', function(err) {
    if (err) return defer.reject(err);
    defer.resolve();
  });
  return defer.promise;
};