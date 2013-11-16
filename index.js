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
  this._closureDepsParser = new (options.depsParser || DefaultDepsParser)(this._moduleRegistry);
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


ClosureDepsResolver.prototype.resolve = function(onlyMains) {
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
    }).then(function() {
      if (onlyMains) {
        var ret = {};
        for (var prop in this._moduleMap) {
          if (this._moduleMap[prop].getProvidedModules().length === 0) {
            ret[prop] = this._moduleMap[prop];
          }
        }
        return ret;
      } else {
        return this._moduleMap;
      }
    }.bind(this));
};


ClosureDepsResolver.prototype.resolveSync = function(onlyMains) {
  this._root.forEach(function() {
    dirtreeTraversal.sync(this._root, function(filename) {
      this._processSync(filename);
    }.bind(this), this._excludes, /\.js/);
  }, this);
  this._resolveDependency();
  if (onlyMains) {
    var ret = [];
    for (var prop in this._moduleMap) {
      if (this._moduleMap[prop].getProvidedModules().length === 0) {
        ret.push(this._moduleMap[prop]);
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
  fs.readFile(filename, 'utf-8', function(err, content) {
    if (err) throw err;
    var trimedContent = trimComment(content);
    var match;
    var module = this._closureDepsParser.parseProvidedModule({
          filename : filename,
          content : content,
          trimedContent : trimedContent
        });

    this._moduleMap[filename] = module;
    this._closureDepsParser.parseRequiredModule(module);
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
};


ClosureDepsResolver.prototype.remove = function(filename, cb) {
  var module = this._moduleMap[filename];
  module.getProvidedModules().forEach(function(moduleName) {
    this._moduleRegistry.remove(moduleName);
  }.bind(this));
  delete this._moduleMap[filename];
};


ClosureDepsResolver.prototype._createDepsJsContent = function(module) {
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


module.exports = ClosureDepsResolver;
