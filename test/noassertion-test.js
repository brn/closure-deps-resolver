/**
 * @fileoverview
 * @author Taketshi Aono
 */

'use strict';
var Deps = require('../index');
var Resolver = Deps.Resolver;
var amdPattern = Deps.amdPattern;

var closureDepsResolver = new Resolver({
      root : '../node_modules/closure-library',
      onMemoryCache : true
    });

var amdDepsResolver = new Resolver({
      root : ['/Users/aono_taketoshi/Documents/workspace/adsys_ads_mng_trunk/WebContent/js'],
      pattern : amdPattern,
      onMemoryCache : true
    });

var moduleMap = closureDepsResolver.resolveSync(true);
console.log(Object.keys(moduleMap));

/*amdDepsResolver.resolve().then(function(modules) {
  console.log(modules);
});*/
