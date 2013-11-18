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
var ModuleRegistry = require('./lib/module_registry');
var Promise = require('node-promise');
var DefaultDepsParser = require('./lib/default-deps-parser');
var DepsJsGenerator = require('./lib/deps-js-generator');
var closurePattern = require('./lib/closure-pattern');
var DepsCache = require('./lib/deps-cache');


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
  this._root = !Array.isArray(options.root)? [pathUtil.resolve(options.root) + '/'] : options.root.map(function(root) {
    return pathUtil.resolve(root);
  });
  this._excludes = options.excludes;
  this._moduleMap = {};
  this._closureDepsPath = options.depsJsPath || temp.mkdirSync('_gcl_deps') + '/deps.js';
  this._moduleRegistry = new ModuleRegistry();
  this._writeDeps = options.writeDepsJs;
  var memo = {};
  this._moduleDependencies = new DependencyResolver(this._moduleMap, memo);
  var pattern;
  if (!options.pattern) {
    pattern = closurePattern.pattern;
  } else {
    pattern = options.pattern;
  }
  pattern.compile();
  this._depsCache = new DepsCache(options.depsCachePath);
  this._closureDepsParser = new DefaultDepsParser(this._moduleRegistry, this._depsCache, pattern);
  this._depsJsGenerator = new (options.depsJsGenerator || DepsJsGenerator)(this._closureDepsPath);
}


Object.defineProperties(ClosureDepsResolver.prototype, {
  depsJsPath : {
    get : function() {
      return this._closureDepsPath;
    },
    configurable : true,
    enumerable : false
  }
});


ClosureDepsResolver.prototype.resolve = function(opt_onlyMains) {
  return Promise.all(this._root.map(function(path) {
    return dirtreeTraversal(path, function(filename, cb) {
      this._process(filename, cb);
    }.bind(this), this._excludes, /\.js/);
  }, this))
    .then(this._resolveDependency.bind(this))
    .then(function() {
      if (this._writeDeps) {
        return this._depsJsGenerator().generate(this._moduleMap);
      }
    }.bind(this)).then(function() {
      if (opt_onlyMains) {
        var ret = {};
        var items = Object.keys(this._moduleMap);
        for (var i = 0, len = items.length; i < len; i++) {
          var key = items[i];
          var item = this._moduleMap[key];
          if (item.getProvidedModules().length === 0) {
            ret[key] = item;
          }
        }
        return ret;
      } else {
        return this._moduleMap;
      }
    }.bind(this));
};


ClosureDepsResolver.prototype.resolveSync = function(opt_onlyMains) {
  this._root.forEach(function() {
    dirtreeTraversal.sync(this._root, function(filename) {
      this._processSync(filename);
    }.bind(this), this._excludes, /\.js/);
  }, this);
  this._resolveDependency();
  if (opt_onlyMains) {
    var ret = {};
    var items = Object.keys(this._moduleMap);
    for (var i = 0, len = items.length; i < len; i++) {
      var key = items[i];
      var item = this._moduleMap[key];
      if (item.getProvidedModules().length === 0) {
        ret[key] = item;
      }
    }
    return ret;
  } else {
    return this._moduleMap;
  }
};


/**
 * @override
 * @param {string} filename
 */
ClosureDepsResolver.prototype._process = function(filename, cb) {
  this._closureDepsParser.parse(filename, function(module) {
    this._moduleMap[filename] = module;
    cb();
  }.bind(this));
};


/**
 * @override
 * @param {string} filename
 */
ClosureDepsResolver.prototype._processSync = function(filename) {
  var content = fs.readFileSync(filename, 'utf-8');
  var trimedContent = trimComment(content);
  var match;
  this._moduleMap[filename] = this._closureDepsParser.parseSync(filename);
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
  this._moduleDependencies.clear();
  this._moduleRegistry.clear();
  this._depsCache.writeCache();
};


ClosureDepsResolver.prototype.remove = function(filename, cb) {
  var module = this._moduleMap[filename];
  module.getProvidedModules().forEach(function(moduleName) {
    this._moduleRegistry.remove(moduleName);
  }.bind(this));
  delete this._moduleMap[filename];
};


module.exports = {
  Resolver : ClosureDepsResolver,
  closurePattern : closurePattern
};