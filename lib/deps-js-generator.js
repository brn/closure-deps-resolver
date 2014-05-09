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


DepsJsGenerator.prototype.generate = function(modules, sync) {
  var deps = {};
  var registeredModuleSet = {};
  var code = '';
  var basedir = path.dirname(this._name);

  Object.keys(modules).forEach(function(moduleName) {
    var module = modules[moduleName];
    var filename = module.getFilename();
    if (filename in registeredModuleSet) return;
    registeredModuleSet[filename] = true;
    deps[filename] = ['', ''];
    if (module.getDirectRequires().length) {
      deps[filename][0] = '"' + module.getRequiredModules.join('","') + '"';
    }
    if (module.getProvidedModules().length) {
      deps[filename][0] = '"' + module.getProvidedModules().join('","') + '"';
    }
  }.bind(this));

  for (var prop in deps) {
    code += 'goog.addDependency("' + pathUtil.relative(basedir, prop) + '", [' + deps[prop][0] + '], [' + deps[prop][1] + ']);\n';
  }

  if (!sync) {
    var defer = Promise.defer();
    fs.writeFile(this._name, code, 'utf-8', function(err) {
      if (err) return defer.reject(err);
      defer.resolve();
    });
    return defer.promise;
  } else {
    fs.writeFileSync(this._name, code, 'utf-8');
  }
};


module.exports = DepsJsGenerator;
