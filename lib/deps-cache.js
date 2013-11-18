/**
 * @fileoverview
 * @author Taketshi Aono
 */

'use strict';
var fs = require('fs');
var path = require('path');
var pkginfo = require('pkginfo')(module);
var pathUtil = require('./pathutil');
var version = module.exports.version;
var DEFAULT_CACHE_DIR = process.cwd() + '/.module_deps_cache_' + module.exports.version;
var uuid = require('node-uuid');


/**
 * @constructor
 * @param {string=} opt_filename
 */
function DepsCache(opt_filename) {
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
      return {cache : {}, mtime : new Date()};
    }
    return {
      cache : cache,
      mtime : fs.statSync(this._filename).mtime
    };
  } catch (x) {
    return {
      cache : {},
      mtime : new Date()
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


DepsCache.prototype.writeCache = function() {
  var items = Object.keys(this._cache);
  for (var i = 0, len = items.length; i < len; i++) {
    var key = items[i];
    if (key !== 'version' && this._cache[key].uuid !== this._uuid) {
      delete this._cache[key];
    }
  }
  fs.writeFileSync(this._filename, JSON.stringify(this._cache), 'utf-8');
};


module.exports = DepsCache;