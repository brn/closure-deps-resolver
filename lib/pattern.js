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
var util = require('util');
var esquery = require('esquery');

function Pattern() {
  this._pattern = [];
  this._matcher = null;
  this._compiled = false;
}


Pattern.prototype.addPattern = function(query, callback, opt_context) {
  this._pattern.push([esquery.parse(query), callback.process? callback.process : callback, opt_context]);
  this._compiled = false;
};


Pattern.prototype.compile = function() {
  if (this._compiled) {
    return;
  }
  this._compiled = true;
  this._matcher = this._doCompile();
};


Pattern.prototype.match = function(filename, ast, requires, provides, data) {
  if (!this._compiled) {
    this.compile();
  }
  this._matcher(filename, ast, requires, provides, data);
};


Pattern.prototype._doCompile = function() {
  var pattern;
  var code = 'var matches;';
  for (var i = 0, len = this._pattern.length; i < len; i++) {
    pattern = this._pattern[i];
    code += util.format('matches = esquery.match(ast, this._pattern[%d][0]);'
                        + 'if (matches.length > 0) {'
                        + 'this._pattern[%d][1].call(this._pattern[%d][2], filename, matches, requires, provides, data);}', i, i, i);
  }
  return Function('esquery, filename, ast, requires, provides, data', code).bind(this, esquery);
};


module.exports = Pattern;
