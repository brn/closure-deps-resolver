/**
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


Pattern.prototype.match = function(filename, ast, requires, provides) {
  if (!this._compiled) {
    this.compile();
  }
  this._matcher(filename, ast, requires, provides);
};


Pattern.prototype._doCompile = function() {
  var pattern;
  var code = 'var matches;';
  for (var i = 0, len = this._pattern.length; i < len; i++) {
    pattern = this._pattern[i];
    code += util.format('matches = esquery.match(ast, this._pattern[%d][0]);'
                        + 'if (matches.length > 0) {'
                        + 'this._pattern[%d][1].call(this._pattern[%d][2], filename, matches, requires, provides);}', i, i, i);
  }
  return Function('esquery, filename, ast, requires, provides', code).bind(this, esquery);
};


module.exports = Pattern;
