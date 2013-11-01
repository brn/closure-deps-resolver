/**
 * @fileoverview
 * @author Taketshi Aono
 */

'use strict';

var fs = require('fs');
var util = require('util');
var path = require('path');
var consts = require('./lib/consts');
var Module = require('./lib/module');
var assert = require('assert');
var DependencyResolver = require('./lib/dependency-resolver');
var temp = require('temp');
var pathUtil = require('./lib/pathutil');
var dirtreeTraversal = require('dirtree-traversal');


/**
 * @const
 * @type {RegExp}
 */
var UPPER = /[A-Z]/g;

/**
 * @const {string}
 */
var SPECIFIED_MODULE_IS_NOT_EXISTS = "The specified module {0} is not exists.";


/**
 * Remove comments.
 * @param {string} str
 * @returns {string}
 */
function trimComment(str) {
  return str.replace(consts.COMMENT_REG, function($0, $1) {
    return $1 ? '' : $0;
  });
}


/**
 * @constructor
 */
function ClosureDepsResolver (options) {
  this._root = pathUtil.resolve(options.root) + '/';
  this._excludes = options.excludes;
  this._moduleMap = {};
  this._closureDepsPath = temp.mkdirSync('_gcl_deps') + '/deps.js';
  var memo = {};
  this._moduleDependencies = new DependencyResolver(this._moduleMap, memo);
}


ClosureDepsResolver.prototype.resolve = function() {
  return dirtreeTraversal(this._root, function(filename, cb) {
    this._process(filename, cb);
  }.bind(this), this._excludes, /\.js/)
    .then(this._resolveDependency.bind(this))
    .then(function() {
      return this._moduleMap;
    }.bind(this));
};


/**
 * @override
 * @param {string} filename
 */
ClosureDepsResolver.prototype._process = function(filename, cb) {
  fs.readFile(filename, 'utf-8', function(err, content) {
    if (err) throw err;
    var trimedContent = trimComment(content);
    var match;
    var module = this._processClosureModule({
          filename : filename,
          content : content,
          trimedContent : trimedContent
        });

    if (module) {
      while ((match = consts.REQUIRE_REG.exec(trimedContent))) {
        if (match[1]) {
          module.addDirectRequiredModule(match[1]);
        }
      }
    }
    cb();
  }.bind(this));
};


/**
 * @override
 * @param {Object} memo
 */
ClosureDepsResolver.prototype._resolveDependency = function() {
  var memo = {};
  var module;
  var str = [];
  for (var prop in this._moduleMap) {
    var dep;
    module = this._moduleMap[prop];
    if (!(prop in memo)) {
      dep = memo[prop] = this._moduleDependencies.resolveModuleDependencies(module);
    } else {
      dep = memo[prop];
    }
    module.setDependentModules(dep);
  }
};


ClosureDepsResolver.prototype.remove = function(filename, cb) {
  var module = this._moduleMap[filename];
  module.getProvidedModules().forEach(function(moduleName) {
    Module.removeModule(moduleName);
  });
  delete this._moduleMap[filename];
};


ClosureDepsResolver.prototype.createDepsJsContent = function(module) {
  var deps = {};
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
  var code = '';
  for (var prop in deps) {
    code += 'goog.addDependency("' + pathUtil.relative(this._root, prop) + '", [' + deps[prop][0] + '], [' + deps[prop][1] + ']);\n';
  }
  return code;
};


/**
 * process google-closure-libraray style module.
 * @example
 *   goog.provide('foo.bar.baz')
 *   goog.require('foo.bar.Class');
 * @param {!Object} resourceInfo
 * @return {Module}
 */
ClosureDepsResolver.prototype._processClosureModule = function (resourceInfo) {
  var match;
  var provided = [];
  var founded = [];
  while ((match = consts.GOOG_PROVIDE.exec(resourceInfo.trimedContent))) {
    var found = match[1];
    if (Module.hasModuleInfo(found)) {
      throw new Error(found + ' is already defined in ' + resourceInfo.filename + '\n' + 'First defined in ' + Module.getModuleInfo(found));
    }
    founded.push(found);
    provided.push(found);
  }
  for (var i = 0, len = founded.length; i < len; i++) {
    Module.addModuleMap(founded[i], resourceInfo.filename);
  }
  return this._moduleMap[resourceInfo.filename] = new Module(resourceInfo.filename, provided);
};


module.exports = ClosureDepsResolver;
