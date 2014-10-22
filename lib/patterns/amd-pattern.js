/**
 * The MIT License (MIT)
 * 
 * Copyright (c) 2013 Taketoshi Aono(brn)
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
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
