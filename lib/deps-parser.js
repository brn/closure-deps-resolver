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

var consts = require('./consts');
var Module = require('./module');
var esprima = require('esprima');
var pathUtil = require('./pathutil');
var fs = require('fs');


/**
 * Parse the google-closure-library-style module.
 * @constructor
 * @param {ModuleRegistry} moduleRegistry
 * @param {DepsCache} depsCache
 * @param {Pattern} pattern
 */
function DefaultDepsParser(moduleRegistry, depsCache, pattern) {
  this._moduleRegistry = moduleRegistry;
  this._depsCache = depsCache;
  this._pattern = pattern;
}


/**
 * process google-closure-libraray style module.
 * @example
 *   goog.provide('foo.bar.baz')
 * @param {!{
 *   filename : string,
 *   content : string
 * }} resourceInfo
 * @return {Module}
 */
DefaultDepsParser.prototype.parse = function(filename, cb) {
  var module = this._checkCache(filename);
  if (module) return cb(module);
  fs.readFile(filename, 'utf-8', function(err, content) {
    if (err) throw err;
    cb(this._process(filename, content));
  }.bind(this));
};


/**
 * process google-closure-libraray style module.
 * @example
 *   goog.provide('foo.bar.baz')
 * @param {!{
 *   filename : string,
 *   content : string
 * }} resourceInfo
 * @return {Module}
 */
DefaultDepsParser.prototype.parseSync = function(filename) {
  var module = this._checkCache(filename);
  if (module) return module;
  return this._process(filename, fs.readFileSync(filename, 'utf-8'));
};


/**
 * @param {string} filename
 * @returns {Module}
 */
DefaultDepsParser.prototype._checkCache = function(filename) {
  var info = this._depsCache.get(filename);
  var mtime = fs.statSync(filename).mtime;

  if (info && this._depsCache.mtime > mtime) {
    this._registerModules(filename, info.provides);
    var module = new Module(filename, info.provides, this._moduleRegistry, mtime, false);
    module.setDirectRequiredModule(info.requires);
    return module;
  }
};


/**
 * @private
 * @param {string} filename
 * @param {string} content
 */
DefaultDepsParser.prototype._process = function(filename, content) {
  var provides = [];
  var requires = [];
  var data = {};

  try {
    var ast = esprima.parse(content, {attachComment: true});
  } catch (x) {
    throw new SyntaxError(filename + '\n' + x.stack);
  }
  this._pattern.match(filename, ast, requires, provides, data);
  this._registerModules(filename, provides, data);
  var module = new Module(filename, provides, this._moduleRegistry, fs.statSync(filename).mtime, true);
  module.googModule = !!data.googModule;
  module.setDirectRequiredModule(requires);
  this._depsCache.addCache(pathUtil.relative(process.cwd(), filename), requires, provides);
  return module;
};


/**
 * @private
 * @param {string} filename
 * @param {Array.<Module>} modules
 * @throws {Error}
 */
DefaultDepsParser.prototype._registerModules = function(filename, modules, data) {
  for (var i = 0, len = modules.length; i < len; i++) {
    if (this._moduleRegistry.hasModuleInfo(modules[i])) {
      throw new Error(modules[i] + ' is already defined in '
                      + filename + '\n'
                      + 'First defined in '
                      + this._moduleRegistry.getModuleInfo(modules[i]));
    }
    this._moduleRegistry.add(modules[i], filename);
  }
};


module.exports = DefaultDepsParser;
