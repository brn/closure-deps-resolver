/**
 * @fileoverview
 * @author Toketoshi Aono
 */

'use strict';
var consts = require('./consts');
var path = require('path');

module.exports = {
  resolve : function() {
    return path.resolve.apply(path, arguments).replace(consts.PATH_REG, '/');
  },
  relative : function(from, to) {
    return path.relative(from, to).replace(consts.PATH_REG, '/'); 
  }
};
