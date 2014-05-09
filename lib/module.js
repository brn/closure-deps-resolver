/**
 * @fileoverview Provide an abstraction of a file.
 * @author Taketshi Aono
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
 * @param {boolean} updated
 */
function Module(filename, provided, registry, updated) {

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
  var name;

  for (var i = 0, len = this._directRequires.length; i < len; i++) {
    name = this._moduleRegistry.getModuleInfo(this._directRequires[i]);
    var message = util.format('The module %s\nrequired from %s\nis not exists.', this._directRequires[i], this._filename);
    assert.ok(!!name, message);
    filenames.push(name);
  }
  return filenames;
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
