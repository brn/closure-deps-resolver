/**
 * @fileoverview
 * @author Taketshi Aono
 */
"use strict";

var assert = require('assert');
var fs = require('fs');
var util = require('util');
var path = require('path');


/**
 * @constructor
 * @param {Module} module
 */
function DependentModuleCollection(module) {
  /**
   * @private {Array.<Module>}
   */
  this._dependentModuleList = [];

  /**
   * @private {Module}
   */
  this._module = module;
}


/**
 * @param {Module} module
 */
DependentModuleCollection.prototype.add = function(module) {
  this._dependentModuleList.push(module);
};


/**
 * @returns {Array.<Module>}
 */
DependentModuleCollection.prototype.populate = function() {
  var ret = this._dependentModuleList.slice();
  ret.push(this._module);
  return ret;
};


/**
 * Resolve dependencies.
 * @constructor
 * @param {!Object} moduleMap
 * @param {!Object} memo
 */
function DependencyResolver(moduleMap, memo) {
  this._moduleMap = moduleMap;
  this._memo = memo;
}


/**
 * Search all dependent modules.
 * All-branches = M, Depth = N
 * Worst-time O(M^N)
 * Best-time O(M)
 * @param {Module} module
 * @param {Module=} opt_parent
 * @returns {Array.<Module>}
 * @throws {Error}
 */
DependencyResolver.prototype.resolveModuleDependencies = function(module) {
  var filename = module.getFilename();
  if (filename in this._memo) {
    return this._memo[filename];
  }
  //[[children{Array}, parent{string}]]
  var stack = [[module.getDirectRequires(), filename]];
  var currentFilename;
  var entry;
  var dependencies;
  var tmp;
  var childModule;
  var registered = {};
  var visited = {};
  var dependentModuleCollection = new DependentModuleCollection(module);
  var last;

  visited[module.getFilename()] = 1;

  while (stack.length) {

    //[[children{Array}, parent{string}]]
    entry = stack.pop();
    //children{Array}
    dependencies = entry[0];
    //parent{string}
    currentFilename = entry[1];

    while (dependencies.length) {
      //child{string} front of children{Array}
      filename = dependencies.shift();

      if (!(filename in visited)) {
        visited[filename] = 1;
        //Check caches exists.
        if (filename in this._memo) {
          //Get the dependency if caches exists.
          this._setDependenciesFromCache(filename, registered, dependentModuleCollection);
          continue;
        } else {
          //child{Module}
          tmp = this._moduleMap[filename];
          assert.ok(tmp, 'No such file : ' + filename + '.');
          last = currentFilename;
          //[[children{Array}, parent{string}]]
          stack.push([dependencies, currentFilename]);
          //child{string}
          currentFilename = tmp.getFilename();
          //children{Array} of child
          dependencies = tmp.getDirectRequires();
        }
      }
    }

    if (!(currentFilename in registered) && stack.length) {
      registered[currentFilename] = 1;
      childModule = this._moduleMap[currentFilename];
      if (childModule === module) {
        throw new Error('The module ' + currentFilename
                        + ' has cyclic dependency to the module ' + childModule.getFilename());
      }
      dependentModuleCollection.add(childModule);
      //If dependencies is not cached record all dependencies of this module.
      //            M1
      //   M2       M2       M2
      //M3 M3 M3 M3 M3 M3 M3 M3 M3
      //Record both routes from M1 to M2 and from M2 to M3
      if (!(currentFilename in this._memo)) {
        this._recordDependencies(childModule, currentFilename);
      }
    }
  }

  return dependentModuleCollection.populate();
};


/**
 * Set dependencies from caches.
 * @param {string} filename
 * @param {Object} registered
 * @param {DependentModuleCollection} dependentModuleCollection
 */
DependencyResolver.prototype._setDependenciesFromCache = function(filename, registered, dependentModuleCollection) {
  var memo = this._memo[filename];
  var module;
  var moduleName;
  for (var i = 0, len = memo.length; i < len; i++) {
    module = memo[i];
    moduleName = module.getFilename();
    if (!(moduleName in registered)) {
      registered[moduleName] = 1;
      dependentModuleCollection.add(module);
    }
  }

  if (!(filename in registered)) {
    registered[filename] = 1;
    dependentModuleCollection.add(this._moduleMap[filename]);
  }
};


/**
 * Record dependencies of all dependent module of self.
 * @param {Module} module
 * @param {string} name
 */
DependencyResolver.prototype._recordDependencies = function(module, name) {
  this._memo[name] = [];
  var memo = this._memo[name];
  var dependencyNames = module.getDirectRequires();
  var visited = {};
  var tmp;
  var dependency;
  for (var i = 0, len = dependencyNames.length; i < len; i++) {
    dependency = dependencyNames[i];
    assert.ok(dependency in this._moduleMap);
    //In this phase, all modules that target module depends must be already recorded.
    assert.ok(dependency in this._memo, util.format('Module %s\nthe child of %s\nis not recorded.', dependency, name));
    tmp = this._memo[dependency];
    for (var j = 0, depLen = tmp.length; j < depLen; j++) {
      //In the cases which includes same file we eliminate it.
      if (!(tmp[j] in visited)) {
        visited[tmp[j]] = 1;
        memo.push(tmp[j]);
      }
    }
  }
  memo.push(module);
};


module.exports = DependencyResolver;
