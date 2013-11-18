/**
 * @fileoverview
 * @author Taketshi Aono
 */

'use strict';
var Pattern = require('./lib/pattern');
var Resolver = require('./index').Resolver;
var closurePattern = require('./index').closurePattern;
var pattern = closurePattern.pattern;
var _ = closurePattern._;


pattern.addPattern(_.CallExpression, function(filename, node, parent, requires, provides) {
  if (node.callee.type === _.MemberExpression) {
    var maybeCamp = node.callee;
    if (maybeCamp.object.type === _.Identifier &&
        maybeCamp.object.name === 'camp') {
      if (maybeCamp.property.type === _.Identifier &&
          maybeCamp.property.name === 'module') {
        if (node.arguments.length === 3) {
          var moduleName;
          var module = node.arguments[0];
          if (module.type === _.Literal && typeof module.value === 'string') {
            moduleName = module.value;
          }
          var providesModule = node.arguments[1];
          if (providesModule.type === _.ArrayExpression) {
            var elements = providesModule.elements;
            var element;
            for (var i = 0, len = elements.length; i < len; i++) {
              element = elements[i];
              if (element.type === _.Literal && typeof element.value === 'string') {
                provides.push(moduleName + '.' + element.value);
              }
            }
          }
        }
      }
    }
  }
});


pattern.addPattern(_.CallExpression, function(filename, node, parent, requires, provides) {
  if (node.callee.type === _.MemberExpression) {
    var maybeCamp = node.callee.object;
    var maybeUsing = node.callee.property;
    if (maybeCamp.type === _.Identifier && maybeCamp.name === 'camp') {
      if (maybeUsing.type === _.Identifier &&
          maybeUsing.name === 'using') {
        var name = node.arguments[0];
        if (node.arguments.length === 1 && name.type === _.Literal) {
          if (typeof name.value === 'string') {
            requires.push(name.value);
          }
        }
      }
    }
  }
});

var closureDepsResolver = new Resolver({
      root : ['/Users/aono_taketoshi/Documents/workspace/trunk_for_merge/WebContent/js/src/modules'],
      excludes : /knockout-latest|\/src\/modules\/test\/|\/src\/modules\/appconfigs\//,
      pattern : pattern
    });
closureDepsResolver.resolve(true).then(function(moduleMap) {
  console.log(Object.keys(moduleMap));
});
