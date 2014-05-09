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

## Api

**cdr.Resolver.prototype.resolve(appFileOnly: boolean): Promise.&lt;Module&gt;**  
Resolve specified pattern module dependecies by async. If argument appFileOnly passed, resolve only app file.  
If appFileOnly is not passed, return all modules.


**cdr.Resolver.prototype.resolveSync(appFileOnly: boolean): Array.&lt;Module&gt;**  
Synced version of `cdr.Resolver.prototype.resolve`.


**cdr.Resolver.prototype.resolveByName(filename: string): Promise.&lt;Module&gt;**  
Resolved specified filename.


**cdr.Resolver.prototype.resolveByNameSync(filename: string): Promise.&lt;Module&gt;**  
Synced version of `cdr.Resolver.prototype.resolveByName`.


**cdr.closurePattern**  
The esquery pattern for closure library.


**cdr.Pattern**  
The parser pattern builder.


## Classes

### Module

**Module.prototype.getFilename(): string**  
Return the module filename.


**Module.prototype.getDirectRequires(): Array.&lt;string&gt;**  
Return the required module which is specified in the file(excludes indirect dependencies) filepath list.


**Module.prototype.getRequiredModules(): Array.&lt;string&gt;**  
Return the required module which is specified in the file(excludes indirect dependencies) module name list.


**Module.prototype.getProvidedModules(): Array.&lt;string&gt;**  
Return the provided module.


**Module.prototype.getDependentModules(): Array.&lt;Module&gt;**  
Return the all required module which is wrapped Module class.


### Pattern

**Pattern.prototype.addPattern(query: string, callback: function(filename: string, matches: Array, requires: Array, provides: Array), opt_context: *): void**  
Add parser pattern of esquery, if pattern is matched with syntax tree, callback function is called.  
callback function parameters  
**filename** Current parsing file name.  
**matches** The array of the matched syntax tree of esprima.  
**requires** The array of the required module.  
**provided** The array of the provided module.  
for detail. see lib/patterns/closure-pattern.js.

