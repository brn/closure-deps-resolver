/**
 * @fileoverview
 * @author Taketshi Aono
 */

'use strict';
var util = require('util');

function Pattern() {
  this._pattern = [];
  this._matcher = null;
  this._compiled = false;
}


Pattern.prototype.addPattern = function(type, callback, opt_context) {
  this._pattern.push([type, callback.process? callback.process : callback, opt_context]);
  this._compiled = false;
};


Pattern.prototype.compile = function() {
  if (this._compiled) {
    return;
  }
  this._compiled = true;
  this._matcher = this._doCompile();
};


Pattern.prototype.match = function(filename, node, parent, requires, provides) {
  if (!this._compiled) {
    this.compile();
  }
  this._matcher(filename, node, parent, requires, provides);
};


Pattern.prototype._doCompile = function() {
  var pattern;
  var code = '';
  for (var i = 0, len = this._pattern.length; i < len; i++) {
    pattern = this._pattern[i];
    code += util.format('if (node.type === "' + pattern[0] + '") {'
                        + 'this._pattern[%d][1].call(this._pattern[%d][2], filename, node, parent, requires, provides);}', i, i);
  }
  return Function('filename, node, parent, requires, provides', code).bind(this);
};


module.exports = Pattern;