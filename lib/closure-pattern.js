/**
 * @fileoverview
 * @author Taketshi Aono
 */

'use strict';

var Pattern = require('./pattern');

var esprima = require('esprima');
var _ = esprima.Syntax;
var pattern = new Pattern();


pattern.addPattern(_.CallExpression, function(filename, node, parent, requires, provides) {
  if (node.callee.type === _.MemberExpression) {
    var maybeGoog = node.callee.object;
    var maybeRequire = node.callee.property;
    if (maybeGoog.type === _.Identifier && maybeGoog.name === 'goog') {
      if (maybeRequire.type === _.Identifier &&
          maybeRequire.name === 'provide') {
        var name = node.arguments[0];
        if (node.arguments.length === 1 && name.type === _.Literal) {
          if (typeof name.value === 'string') {
            provides.push(name.value);
          }
        }
      }
    }
  }
});


pattern.addPattern(_.CallExpression, function(filename, node, parent, requires, provides) {
  if (node.callee.type === _.MemberExpression) {
    var maybeGoog = node.callee.object;
    var maybeRequire = node.callee.property;
    if (maybeGoog.type === _.Identifier && maybeGoog.name === 'goog') {
      if (maybeRequire.type === _.Identifier &&
          maybeRequire.name === 'require') {
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

exports.pattern = pattern;
exports._ = _;
