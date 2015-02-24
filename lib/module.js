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

var assert = require('assert');
var fs = require('fs');
var util = require('util');


/**
 * Represent each closure-library module.
 * @constructor
 * @param {string} filename
 * @param {Array.<string>}  provided
 * @param {ModuleRegistry} registry
 * @param {Date} mtime
 * @param {boolean} updated
 */
function Module(filename, provided, registry, mtime, updated) {

  /**
   * @private
   * @type {string}
   */
  this._filename = filename;

  /**
   * @private {Array.<Module>}
   */
  this._dependentModules = [this];

  /**
   * @private
   * @type {Array.<string>}
   */
  this._providedModules = provided;

  /**
   * @private
   * @type {Array.<string>}
   */
  this._directRequires = [];

  /**
   * @private
   * @type {Array.<string>}
   */
  this._requiredModules = [];

  /**
   * @private
   * @type {ModuleRegistry}
   */
  this._moduleRegistry = registry;

  /**
   * @private
   */
  this._outputPath = '';

  /**
   * @private
   * @type {boolean}
   */
  this._updated = updated;

  /**
   * The flag that is used to marking module as async goog.module file.
   * @private
   * @type {boolean}
   */
  this._googModule = false;

  /**
   * Module's mtime.
   * @private {Date}
   */
  this._mtime = mtime;
}


Object.defineProperties(Module.prototype, {
  /**
   * @inheritDoc
   */
  toString : {
    value : function() {
      return this._filename;
    },
    enumerable : false,
    configurable : true,
    writable : true
  },

  /**
   * @override
   * @return {string}
   */
  valueOf : {
    value : function() {
      return this._filename;
    },
    enumerable : false,
    configurable : true,
    writable : true
  },

  /**
   * @return {number}
   */
  length : {
    get : function() {
      return this._dependentModules.length;
    },
    enumerable : false,
    configurable : false
  },

  outputPath: {
    get: function() {
      return this._outputPath;
    },
    set: function(outputPath) {
      this._outputPath = outputPath;
    },
    enumerable : true,
    configurable : true
  },
  updated: {
    get : function() {
      return this._updated;
    },
    enumerable : true
  },

  mtime: {
    get: function() {
      return this._mtime;
    }
  },

  googModule: {
    /**
     * @return {boolean}
     */
    get: function() {
      return this._googModule;
    },

    
    /**
     * Mark this module as async module.
     * @param {boolean} googModule
     */
    set: function(googModule) {
      this._googModule = googModule;
    }
  }
});


/**
 * @return {string}
 */
Module.prototype.getFilename = function() {
  return this._filename;
};


/**
 * Get module list of {@code goog.require}
 * @return {Array.<string>}
 */
Module.prototype.getDirectRequires = function() {
  var filenames = [];
  var moduleInfo;

  for (var i = 0, len = this._directRequires.length; i < len; i++) {
    moduleInfo = this._moduleRegistry.getModuleInfo(this._directRequires[i]);
    var message = util.format('The module %s\nrequired from %s\nis not exists.', this._directRequires[i], this._filename);
    assert.ok(!!moduleInfo, message);
    filenames.push(moduleInfo.filename);
  }
  return filenames;
};


Module.prototype.getAllConstructors = function() {
  var modules = [];
  for (var prop in this._providedModules) {
    modules.push(this._moduleRegistry.getModuleInfo(this._providedModules[prop]));
  }
  return modules;
};


/**
 * @return {Array.<string>} 
 */
Module.prototype.getRequiredModules = function() {
  return this._directRequires;
};


/**
 * @return {Array.<string>} providedModules
 */
Module.prototype.getProvidedModules = function() {
  return this._providedModules;
};


/**
 * dependentModulesの取得
 * @return {Array.<Module>} dependentModules
 */
Module.prototype.getDependentModules = function() {
  return this._dependentModules;
};


/**
 * @param {string} name
 */
Module.prototype.addDirectRequiredModule = function(name) {
  this._directRequires.push(name);
};


/**
 * @param {string} name
 */
Module.prototype.setDirectRequiredModule = function(nameList) {
  this._directRequires = this._directRequires.concat(nameList);
};


/**
 * @param {Array.<Module>} deps
 */
Module.prototype.setDependentModules = function(deps) {
  this._dependentModules = deps;
};


/**
 * Return the newest mtime of the all dependent modules.
 * @returns {Date} 
 */
Module.prototype.getNewestMtime = function() {
  var maxMtime = new Date('1970/01/01 00:00:00');
  for (var i = 0, len = this._dependentModules.length; i < len; i++) {
    var mtime = this._dependentModules[i].mtime;
    maxMtime = maxMtime < mtime? mtime: maxMtime;
  }
  return maxMtime;
};


Module.prototype.genGraph = function(path) {
  var code = [];
  code.push(_.flatten(this.getProvidedModules().map(function(name) {
    return this.getRequiredModules().map(function(req) {
      return '"' + name + '" -> "' + req + '";';
    });
  })).join('\n'));
  
  var graph = 'digraph NodeDepndencies {\n' + code.join('\n') + '\n}';
  
  if (path) {
    fs.writeFileSync(path, graph, 'utf8');
  } else {
    return graph;
  }
};


/**
 * @private
 * @type {Object}
 */
var _moduleMap = {};


/**
 * クラス情報を追加する
 * @param {string} moduleName モジュール名
 * @param {string} className クラス名
 * @param {string} filename ファイル名
 */
Module.addModuleMap = function(moduleName, filename) {
  _moduleMap[moduleName] = filename;
}


Module.removeModule = function(moduleName) {
  delete _moduleMap[moduleName];
};


/**
 * クラス情報の取得
 * @param {string} moduleName
 * @param {string} className
 * @returns {?string}
 */
Module.getModuleInfo = function(moduleName) {
  return _moduleMap[moduleName]? _moduleMap[moduleName] : null;
};


/**
 * クラス情報を持っているかどうか
 * @param {string} name
 * @returns {boolean}
 */
Module.hasModuleInfo = function(name) {
  return name in _moduleMap;
}


/**
 * クラス情報の初期化
 */
Module.initModuleMap = function() {
  _moduleMap = {};
};

module.exports = Module;
