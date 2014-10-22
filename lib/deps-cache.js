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
var fs = require('fs');
var path = require('path');
var pkginfo = require('pkginfo')(module);
var pathUtil = require('./pathutil');
var version = module.exports.version;
var DEFAULT_CACHE_DIR = process.cwd() + '/.module_deps_cache_' + module.exports.version;
var uuid = require('node-uuid');

var OLD = new Date('1900-01-01 00:00:00');


/**
 * @constructor
 * @param {string=} opt_filename
 */
function DepsCache(opt_onMemory, opt_filename) {
  /**
   * @private {string}
   */
  this._filename = opt_filename || DEFAULT_CACHE_DIR;
  var cache = this._readCache();

  /**
   * @private {Object}
   */
  this._cache = cache.cache;

  /**
   * @private {Object}
   */
  this._hexCache = {};

  /**
   * @private {Date}
   */
  this._mtime = cache.mtime;

  /**
   * @private
   * @type {boolean}
   */
  this._onMemory = !!opt_onMemory;

  this._cache.version = version;
  this._uuid = uuid();
}


Object.defineProperties(DepsCache.prototype, {
  mtime : {
    get : function() {
      return this._mtime;
    },
    configurable : true,
    enumerable : true
  }
});


/**
 * @private
 * @returns {{
 *   cache : Object,
 *   mtime : Date
 * }}
 */
DepsCache.prototype._readCache = function() {
  try {
    var cache = JSON.parse(fs.readFileSync(this._filename, 'utf-8'));
    if (cache.version !== version) {
      return {cache : {}, mtime : OLD};
    }
    return {
      cache : cache,
      mtime : fs.statSync(this._filename).mtime
    };
  } catch (x) {
    return {
      cache : {},
      mtime : OLD
    };
  }
};


/**
 * @param {string} name
 * @returns {Module}
 */
DepsCache.prototype.get = function(name) {
  name = pathUtil.resolve(name);
  var ret = this._cache[name];
  if (ret) {
    ret.uuid = this._uuid;
  }
  return ret || null;
};


/**
 * @param {string} filename
 * @param {Array} requires
 * @param {Array} provides
 */
DepsCache.prototype.addCache = function(filename, requires, provides) {
  this._cache[pathUtil.resolve(filename)] = {requires : requires, provides : provides, uuid : this._uuid};
};


DepsCache.prototype.removeCache = function(filename) {
  delete this._cache[pathUtil.resolve(filename)];
};


DepsCache.prototype.writeCache = function() {
  var items = Object.keys(this._cache);
  for (var i = 0, len = items.length; i < len; i++) {
    var key = items[i];
    if (key !== 'version' && this._cache[key].uuid !== this._uuid) {
      delete this._cache[key];
    }
  }
  if (this._onMemory) return;
  fs.writeFileSync(this._filename, JSON.stringify(this._cache), 'utf-8');
};


module.exports = DepsCache;
