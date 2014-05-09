/**
 * @fileoverview
 * @author Toketoshi Aono
 */

'use strict';

var Pattern = require('../pattern');
var path = require('path');
var fs = require('fs');

var esprima = require('esprima');
var _ = esprima.Syntax;
var pattern = new Pattern();


pattern.addPattern('CallExpression[callee.name=/define$|require$/]', new function() {
  this.process = function(filename, matches, requires, provides) {
    provides.push(filename);
    for (var i = 0, len = matches.length; i < len; i++) {
      var match = matches[i];
      var args = match.arguments.slice();

      if (args[0].type === _.Literal && typeof args[0].name === 'string') {
        provides.push(args[0].name);
        args.shift();
      };

      if (args[0].type === _.ArrayExpression) {
        var elements = args[0].elements;
        for (var j = 0, len2 = elements.length; j < len2; j++) {
          var elem = elements[j];
          if (elem.type === _.Literal && typeof elem.value === 'string') {
            var value = elem.value;
            if (fs.existsSync(value)) {
              requires.push(path.resolve(path.dirname(filename), value));
            } else {
              requires.push(value);
            }
          }
        }
      }
    }
  }.bind(this);
});

module.exports = pattern;
