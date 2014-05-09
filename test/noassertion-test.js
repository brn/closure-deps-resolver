/**
 * @fileoverview
 * @author Toketoshi Aono
 */

'use strict';
var Deps = require('../index');
var Resolver = Deps.Resolver;
var amdPattern = Deps.amdPattern;

var closureDepsResolver = new Resolver({
      root : './node_modules/closure-library',
      onMemoryCache : true
    });

var moduleMap = closureDepsResolver.resolveSync(true);
for (var prop in moduleMap) {
  console.log(moduleMap[prop].getRequiredModules());
}
