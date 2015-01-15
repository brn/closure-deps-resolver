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
      data.googModuleName = target.value;
      provides.push(target.value);
      data.googModule = true;
    }
  });


function getNames(obj, names) {
  if (obj.object.type === _.MemberExpression) {
    getNames(obj.object, names);
  } else if (obj.object.type === _.Identifier) {
    names.push(obj.object.name);
  }
  if (obj.property.type === _.Identifier) {
    names.push(obj.property.name);
  }
}


pattern.addPattern(
  '*[leadingComments]',
  function(filename, matches, requires, provides, data) {
    if (!data.constructorSettings) {
      data.constructorSettings = {};
    }
    for (var i = 0, len = matches.length; i < len; i++) {
      var match = matches[i];
      var comments = matches[i].leadingComments;
      for (var j = 0, len2 = comments.length; j < len2; j++) {
        if (comments[j].value.indexOf('@constructor') > -1) {
          if (match.type === _.ExpressionStatement &&
              match.expression.type === _.AssignmentExpression) {
            var exp  = match.expression;
            if (exp.right.type === _.FunctionExpression) {
              if (exp.left.type === _.MemberExpression) {
                var item = exp.left;
                var names = [];
                var name = '';
                if (data.googModule &&
                    exp.right.type === _.Identifier &&
                    exp.right.name === 'exports') {
                  if (exp.right.type === _.MemberExpression) {
                    getNames(exp.right, names);
                    name = data.googModuleName + '.' + names.join('.');
                  } else if (exp.right.type === _.Identifier) {
                    name = data.googModuleName + '.' + exp.right.name;
                  }
                } else {
                  getNames(item, names);
                  name = names.join('.');
                }
                data.constructorSettings[name] = {
                  params: exp.right.params.map(function(x) {
                    return x.name;
                  })
                };
              }
            }
          }
        }
      }
    }
  }
);

module.exports = pattern;
