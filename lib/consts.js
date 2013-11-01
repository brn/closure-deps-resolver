/**
 * @fileoverview
 * @author Taketshi Aono
 */
"use strict";


/**
 * for goog.require
 * @const
 * @type {RegExp}
 */
exports.REQUIRE_REG = /goog\.require\(\s*?["']([\w\.\-\*]+)["']\s*?\)/g;


/**
 * Path separator for windows.
 * @const
 * @type {RegExp}
 */
exports.PATH_REG = /\\/g;

/**
 * goog.provide
 * @const
 * @type {RegExp}
 */
exports.GOOG_PROVIDE = /goog\.provide\(\s*?["']([\w\.\-\*]+)["']\s*?\)/g;


/**
 * comment.
 * @const
 * @type {RegExp}
 */
exports.COMMENT_REG = /(\/)(?:\*[\s\S]*?\*\/|\/.*)|"(?:\\[\s\S]|[^\\\n"])*"|'(?:\\[\s\S]|[^\\\n'])*'|<!\[CDATA\[[\s\S]*?\]\]>|\/(?:\\.|\[(?:\\.|[^\n\]])*\]|[^\n/])+\/\w*/g;
