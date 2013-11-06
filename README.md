wrapup-partiotion
=================

Transform CommonJS modules to combined AMD (requirejs) files. Pack multiple
related modules together, and make your initial pageload smaller.

```bash
npm install wrapup-partition
```

### example

```bash
wrapup-partition partition --map mapping.json --output build
```

Configuration file
------------------

In the mapping/configuration file you can define which modules end up in which
output file. Here you can group files together.

```json
{
    "main.js": [
        "homepage",
        "sidebar"
    ],
    "dialog.js": [
        "profileDialog",
		"tweetDialog"
    ]
}
```

Modules required by a file specified in this configuration are added to that
file if this module isn't required by some other module.

For example consider this tree:

```
        homepage      tweetDialog
		      \        /     \
		       \      /    parseTweetText
               animation
```

Even though `animation` or `parseTweetText` are not specified in the
configuration, `parseTweetText` is added to `dialog.js`, because it only has
parents that are also in the `dialog.js`. `animation` however is added to the
`main.js` because its parents are in multiple files.

require
-------

You can use the node/commonjs `require()` function as many times you like,
except when you want to split the parts. In that case you should use the
asynchronous `requirejs` function. The main JavaScript file configures
requirejs so you can use the original module names.

**homepage.js**
```js
function openTweetDialog() {
	requirejs(['tweetDialog'], function(dialog){
		dialog.open();
	});
}
```

This automatically loads the `dialog.js` file once.

In all other cases, you can simply use the `require` function, for example to
load the tweetParser

**tweetDialog.js**
```js
var parse = require('./parseTweetText');
exports.open = function() { /* ... */ };
```

Rewriting module names
----------------------

Sometimes module names can get very long, especially when your original file
structure contains multiple levels. That's why `wrapup-partition` can rename
module IDs. This works very good, except when you want to dynamically load
other modules. Thats is where you need to know the renamed ID.

This can be solved by using the standard `wrapup-require` or `wrapup-names`
modules. The first one contains a `requirejs` like function that automatically
maps the module names, and the second contains a look-up object.

```js
function openTweetDialog() {
	// require the wrapup-require module first
	requirejs(['wrapup-require'], fuction(req) {
		// then use it to require the tweetDialog
		req(['tweetDialog'], function(dialog) {
			dialog.open();
		})
	})
}
```

In reality the tweetDialog module looks something like

```js
define('c', ['require', 'exports', 'module', 'd'], function(r, e, m){
	var parse = r('d');
	e.open = function() { /* ... */ };
});
```

instead of:

```js
define('tweetDialog', ['require', 'exports', 'module', 'parseTweetText'], function(r, e, m){
	var parse = r('parseTweetText4');
	e.open = function() { /* ... */ };
});
```

When you require the `wrapup-names` you will get an object like:

```json
{
  'c': 'tweetDialog',
  'd': 'parseTweetText'
}
```
