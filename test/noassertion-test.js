/**
 * @fileoverview
 * @author Toketoshi Aono
 */

'use strict';
var Deps = require('../index');
var Resolver = Deps.Resolver;
var amdPattern = Deps.amdPattern;
var dir = __dirname;
var closureDepsResolver = new Resolver({
      root : dir + '/closure-library',
      onMemoryCache : true
    });

var moduleMap = closureDepsResolver.resolveSync();
for (var prop in moduleMap) {
  console.log(moduleMap[prop].getNewestMtime());
}
