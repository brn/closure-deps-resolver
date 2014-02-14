/**
 * @fileoverview
 * @author Taketshi Aono
 */

'use strict';

var pathUtil = require('./pathutil');
var path = require('path');
var Promise = require('node-promise');
var fs = require('fs');


/**
 * @constructor
 * @param {string} name
 */
function DepsJsGenerator(name) {
  this._name = pathUtil.resolve(name);
}


DepsJsGenerator.prototype.generate = function(modules) {
  var deps = {};
  var code = '';

  Object.keys(modules).forEach(function(moduleName) {
    var module = modules[moduleName];
    var basedir = path.dirname(this._name);
    module.getDependentModules().forEach(function(m) {
      var filename = m.getFilename();
      deps[filename] = ['', ''];
      if (m.getDirectRequires().length) {
        deps[filename][0] = '"' + m.getDirectRequires().join('","') + '"';
      }
      if (m.getProvidedModules().length) {
        deps[filename][0] = '"' + m.getProvidedModules().join('","') + '"';
      }
    });

    for (var prop in deps) {
      code += 'goog.addDependency("' + pathUtil.relative(basedir, prop) + '", [' + deps[prop][0] + '], [' + deps[prop][1] + ']);\n';
    }
  }.bind(this));

  var defer = Promise.defer();
  fs.writeFile(this._name, code, 'utf-8', function(err) {
    if (err) return defer.reject(err);
    defer.resolve();
  });
  return defer.promise;
};


module.exports = DepsJsGenerator;