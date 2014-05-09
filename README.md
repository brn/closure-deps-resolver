#closure-deps-resolver

## What's this
The dependency resolver for closure library style javascript modules.

## Install
`npm install closure-deps-resolver`

## Usage
```javascript
var cdr = require('closure-deps-resolver');
var Resolver = cdr.Resolver;
var resolver = new Resolver({
  root: './js/src', //{(string|Array)} The root paths of modules.
  execludes: /-test\.js/, //{(RegExp|undefined)} The regular expression of the exclusion.
  depsJsPath: './deps.js', //{(string|undefined)} closure-compiler deps.js file path.
  writeDepsJs: true, //{(boolean|undefined)} Whether generate deps.js or not.
  pattern: cdr.closurePattern, //{(Pattern|undefined)} The module parse pattern. default => closurePattern
  depsCachePath: 'deps-cache', //{(string|undefined)} The dependency cache file path. default => module_deps_cache_{version}
  depsJsGenerator: function(depsPath) {}, //{(function(new:*, string):?|undefined)} deps.js file generator. This must be a constructor function.
  depsFileResolver: function(filename) {return /-main\.js/.test(filename);} //{(function(string):boolean|undefined)} The function which decide app file.
});

resolver.resolve(true).then(function(modules) {
  for (var prop in modules) {
    doSomething(modules[prop]);
  }
})
```
