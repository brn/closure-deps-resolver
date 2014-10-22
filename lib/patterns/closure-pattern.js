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
  function(filename, matches, requires, provides, data) {
    if (data.googModule) {
      throw new Error("goog.provide is not able to use with goog.module.");
    }
    for (var i = 0, len = matches.length; i < len; i++) {
      var target = matches[i].arguments[0];
      if (target.type === _.Literal && typeof target.value === 'string') {
        provides.push(target.value);
      }
    }
  });


pattern.addPattern(
  'CallExpression[callee.object.name="goog"][callee.property.name="module"]',
  function(filename, matches, requires, provides, data) {
    if (matches.length > 1) {
      throw new Error('goog.module only allowed once per file.');
    }
    var target = matches[0].arguments[0];
    if (target.type === _.Literal && typeof target.value === 'string') {
      provides.push(target.value);
      data.googModule = true;
    }
  });

module.exports = pattern;
