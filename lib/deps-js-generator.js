/**
 * The MIT License (MIT)
 * 
 * Copyright (c) 2013 Taketoshi Aono(brn)
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 * @fileoverview
 * @author Toketoshi Aono
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
      deps[filename][1] = '"' + module.getRequiredModules().join('","') + '"';
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
