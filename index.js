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
var DepsParser = require('./lib/deps-parser');
var DepsJsGenerator = require('./lib/deps-js-generator');
var closurePattern = require('./lib/patterns/closure-pattern');
var DepsCache = require('./lib/deps-cache');
var amdPattern = require('./lib/patterns/amd-pattern');
var Pattern = require('./lib/pattern');
var BASE_REG = /goog\/base.js$/;
var pathutil = require('./lib/pathutil');


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


function defaultAppFileResolver(filename, module) {
  return module.getProvidedModules().length === 0 && !BASE_REG.test(filename);
}


/**
 * Resolve dependencies of modules.
 * @constructor
 * @param {{
 *   root : (string|Array),
 *   excludes : RegExp,
 *   depsJsPath : (string|undefined),
 *   writeDepsJs : (boolean|undefined),
 *   pattern : (Pattern|undefined),
 *   depsCachePath : (string|undefined),
 *   depsJsGenerator : (Function|undefined),
 *   appFileResolver: (Function|undefined)
 * }}
 */
function ClosureDepsResolver (options) {
  /**
   * The root location of the modules.
   * @private
   * @type {Array.<string>}
   */
  this._root = !Array.isArray(options.root)? [pathUtil.resolve(options.root) + '/'] : options.root.map(function(root) {
    return pathUtil.resolve(root);
  });

  /**
   * A Regular Expression that is used to exclude files from the directory tree.
   * @private
   * @type {RegExp}
   */
  this._excludes = options.excludes;

  /**
   * Object which reserve filename and Module set.
   * @private
   * @type {Object}
   */
  this._moduleMap = {};

  /**
   * The path for the location of an auto generated dependency file.
   * @private
   * @type {string}
   */
  this._closureDepsPath = options.depsJsPath || temp.mkdirSync('_gcl_deps') + '/deps.js';

  /**
   * The registries which is used to search modules from filename.
   * @private
   * @type {ModuleRegistry}
   */
  this._moduleRegistry = new ModuleRegistry();

  /**
   * The flag which is used to decide generate dependency file.
   * @private
   * @type {boolean}
   */
  this._writeDeps = !!options.writeDepsJs;

  /**
   * Dependency resolver.
   * @private
   * @type {DependencyResolver}
   */
  this._moduleDependencies = new DependencyResolver(this._moduleMap);

  /**
   * @private
   * @type {Function}
   */
  this._appFileResolver = options.appFileResolver || defaultAppFileResolver;

  var pattern;
  if (!options.pattern) {
    pattern = closurePattern;
  } else {
    pattern = options.pattern;
  }
  pattern.compile();

  /**
   * Control the cache file which is written the all modules requirements and provision.
   * If options 'onMemoryCache' is true, the cache file is kept on memory and not written on disk.
   * @private
   * @type {DepsCache}
   */
  this._depsCache = new DepsCache(options.onMemoryCache, options.depsCachePath);

  /**
   * The parser of dependencies.
   * @private
   * @type {DepsParser}
   */
  this._depsParser = new DepsParser(this._moduleRegistry, this._depsCache, pattern);

  /**
   * Dependency file generator.
   * @private
   * @type {DepsJsGenerator}
   */
  this._depsJsGenerator = new (options.depsJsGenerator || DepsJsGenerator)(this._closureDepsPath);

  this._root.forEach(function(path) {
    if (!fs.existsSync(path))
      throw new Error(path + ' is not exists.');
  });
}


Object.defineProperties(ClosureDepsResolver.prototype, {
  /**
   * @return {string}
   */
  depsJsPath : {
    get : function() {
      return this._closureDepsPath;
    },
    configurable : true,
    enumerable : false
  }
});


/**
 * Do resolve dependencies async.
 * @param {boolean=} opt_onlyMains
 * @returns {Promise.Promise}
 */
ClosureDepsResolver.prototype.resolve = function(opt_onlyMains) {
  return this._workTree().then(function() {
    return this._doResolve(opt_onlyMains, false);
  }.bind(this));
};


/**
 * Do resolve dependencies sync.
 * @param {boolean=} opt_onlyMains
 * @returns {Object}
 */
ClosureDepsResolver.prototype.resolveSync = function(opt_onlyMains) {
  this._workTreeSync();
  return this._doResolve(opt_onlyMains, true);
};


/**
 * Resolve module by name.
 * @param {string} name
 * @returns {Promise.Promise}
 */
ClosureDepsResolver.prototype.resolveByName = function(name) {
  return this.resolve(false).then(function(modules) {
    name = pathutil.resolve(name);
    return modules[name];
  });
};


ClosureDepsResolver.prototype.resolveByNameSync = function(name) {
  var modules = this.resolveSync();
  name = pathutil.resolve(name);
  return modules[name];
};


/**
 * Walk dir tree for search files.
 * @private
 * @returns {Promise.Promise}
 */
ClosureDepsResolver.prototype._workTree = function() {
  return Promise.all(this._root.map(function(path) {
    return dirtreeTraversal(path, function(filename, cb) {
      this._process(filename, cb);
    }.bind(this), this._excludes, /\.js$/);
  }, this));
};


/**
 * Walk dir tree sync for search files.
 * @private
 * @returns {Promise.Promise}
 */
ClosureDepsResolver.prototype._workTreeSync = function() {
  this._root.forEach(function(root) {
    dirtreeTraversal.sync(root, function(filename) {
      this._processSync(filename);
    }.bind(this), this._excludes, /\.js$/);
  }, this);
};


/**
 * Resolve each dependencies and return results.
 * @param {boolean=} opt_onlyMains
 * @param {boolean=} opt_sync
 * @returns {(Promise.Promise|undefined)}
 */
ClosureDepsResolver.prototype._doResolve = function(opt_onlyMains, opt_sync) {
  this._resolveDependency();
  var promise;
  if (this._writeDeps) {
    promise = this._depsJsGenerator.generate(this._moduleMap, opt_sync);
  } else if (!opt_sync) {
    var d = Promise.defer();
    promise = d;
    d.resolve();
  }
  var resolve = function() {
        var ret;
        if (opt_onlyMains) {
          ret = {};
          var items = Object.keys(this._moduleMap);
          for (var i = 0, len = items.length; i < len; i++) {
            var key = items[i];
            var item = this._moduleMap[key];
            if (this._appFileResolver(item.getFilename(), item)) {
              ret[key] = item;
            }
          }
        } else {
          ret = this._moduleMap;
        }
        this._moduleDependencies.clear();
        this._moduleRegistry.clear();
        return ret;
      }.bind(this);

  if (promise) {
    return promise.then(resolve);
  } else {
    return resolve();
  }
};


/**
 * Parse module.
 * @private
 * @param {string} filename
 */
ClosureDepsResolver.prototype._process = function(filename, cb) {
  this._depsParser.parse(filename, function(module) {
    this._moduleMap[filename] = module;
    cb();
  }.bind(this));
};


/**
 * Parse module sync.
 * @override
 * @param {string} filename
 */
ClosureDepsResolver.prototype._processSync = function(filename) {
  var content = fs.readFileSync(filename, 'utf-8');
  var trimedContent = trimComment(content);
  var match;
  this._moduleMap[filename] = this._depsParser.parseSync(filename);
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
  this._depsCache.writeCache();
};


/**
 * Remove the specified module and all dependencies.
 * @param {string} filename
 * @param {Function} cb
 */
ClosureDepsResolver.prototype.remove = function(filename, cb) {
  var module = this._moduleMap[filename];
  module.getProvidedModules().forEach(function(moduleName) {
    this._moduleRegistry.remove(moduleName);
  }.bind(this));
  delete this._moduleMap[filename];
};


module.exports = {
  Resolver : ClosureDepsResolver,
  closurePattern : closurePattern,
  amdPattern : amdPattern,
  Pattern: Pattern
};