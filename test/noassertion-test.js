/**
 * @fileoverview
 * @author Taketshi Aono
 */

'use strict';
var Resolver = require('../index').Resolver;

var closureDepsResolver = new Resolver({
      root : '../node_modules/closure-library'
    });

closureDepsResolver.resolve(true).then(function(moduleMap) {
  console.log(Object.keys(moduleMap));
});
