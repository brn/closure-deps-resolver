/**
 * @fileoverview
 * @author Taketshi Aono
 */

'use strict';

/**
 * @constructor
 */
function ModuleRegistry() {
  this._modules = {};
}


/**
 * add class info.
 * @param {string} moduleName
 * @param {string} className
 * @param {string} filename
 */
ModuleRegistry.prototype.add = function(moduleName, filename) {
  this._modules[moduleName] = filename;
};


ModuleRegistry.prototype.remove = function(moduleName) {
  delete this._modules[moduleName];
};


/**
 * get class info.
 * @param {string} moduleName
 * @param {string} className
 * @returns {?string}
 */
ModuleRegistry.prototype.getModuleInfo = function(moduleName) {
  return this._modules[moduleName] || null;
};


/**
 * return true if registry has the specified class info.
 * @param {string} name
 * @returns {boolean}
 */
ModuleRegistry.prototype.hasModuleInfo = function(name) {
  return name in this._modules;
};


ModuleRegistry.prototype.clear = function() {
  this._modules = {};
};


module.exports = ModuleRegistry;