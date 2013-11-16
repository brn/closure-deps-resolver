/**
 * @fileoverview
 * @author Taketshi Aono
 */
'use strict';

var consts = require('./consts');
var Module = require('./module');


/**
 * Parse the google-closure-library-style module.
 * @constructor
 * @param {ModuleRegistry} moduleRegistry
 */
function DefaultDepsParser(moduleRegistry) {
  this._moduleRegistry = moduleRegistry;
}


/**
 * process google-closure-libraray style module.
 * @example
 *   goog.provide('foo.bar.baz')
 * @param {!{
 *   filename : string,
 *   content : string,
 *   trimedContent : string
 * }} resourceInfo
 * @return {Module}
 */
DefaultDepsParser.prototype.parseProvidedModule = function(resourceInfo) {
  var match;
  var provided = [];
  var founded = [];
  while ((match = consts.GOOG_PROVIDE.exec(resourceInfo.trimedContent))) {
    var found = match[1];
    if (this._moduleRegistry.hasModuleInfo(found)) {
      throw new Error(found + ' is already defined in ' + resourceInfo.filename + '\n' + 'First defined in ' + this._moduleRegistry.getModuleInfo(found));
    }
    founded.push(found);
    provided.push(found);
  }
  for (var i = 0, len = founded.length; i < len; i++) {
    this._moduleRegistry.add(founded[i], resourceInfo.filename);
  }
  return new Module(resourceInfo.filename, provided, this._moduleRegistry);
};


/**
 * process google-closure-libraray style module.
 * @example
 *   goog.require('foo.bar.baz')
 * @param {Module} module
 * @param {!{
 *   filename : string,
 *   content : string,
 *   trimedContent : string
 * }} resourceInfo
 */
DefaultDepsParser.prototype.parseRequiredModule = function(module, resourceInfo) {
  var match;
  var trimedContent = resourceInfo.trimedContent;
  while ((match = consts.REQUIRE_REG.exec(trimedContent))) {
    if (match[1]) {
      module.addDirectRequiredModule(match[1]);
    }
  }
};