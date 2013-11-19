/**
 * @fileoverview
 * @author Taketshi Aono
 */

'use strict';

var Pattern = require('../pattern');

var esprima = require('esprima');
var _ = esprima.Syntax;
var pattern = new Pattern();


pattern.addPattern(
  'CallExpression[callee.object.name="goog"][callee.property.name="require"]',
  function(filename, matches, requires, provides) {
    for (var i = 0, len = matches.length; i < len; i++) {
      var target = matches[i].arguments[0];
      if (target.type === _.Literal && typeof target.value === 'string') {
        requires.push(target.value);
      }
    }
  });


pattern.addPattern(
  'CallExpression[callee.object.name="goog"][callee.property.name="provide"]',
  function(filename, matches, requires, provides) {
    for (var i = 0, len = matches.length; i < len; i++) {
      var target = matches[i].arguments[0];
      if (target.type === _.Literal && typeof target.value === 'string') {
        provides.push(target.value);
      }
    }
  });

module.exports = pattern;
