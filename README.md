Introduction
==============
An plugin for localizing applications written by AngularJS Framework.

What can it do?
* Use as filter, directive and service.
* Auto generate HTML attributes (such as *placeholder* attribute).
* Switch language on the fly.
* **Support partial message files.** You can import many message files for a language.
* **Allow a message refers to other messages.**

Install
===
Via `bower`:

    bower install hoiio-i18n
    
Include `angularjs-i18n.js` and `angularjs-i18n-adapter.js` files in `<script>` tag
    
How to use
===
Assume message service as:

    greetings: {
      hello: "Hello {{name}}, your age is {{age}}"
    }
    

#### With `i18n` filter ####
---
Format: `{{ 'messageCode' | i18n : mappingParameter : 'literalParameter' : ... : 'pn' }}`

Example:

    <input placeholder="{{ 'greetings.hello' | i18n : name : '20' }}">
    
`name` parameter will be mapped with property `name` of `scope`, `'20'` is literal string.


#### With `i18n` directive ####
---
Format: 

* Directive as Element:
  `<i18n code="messageCode" params="{ name1: value1, name2: 'literalValue', ... }" attr="attributeName"></i18n>`
  
* Directive as Attribute:
  `<ANY i18n code="messageCode" params="{ name1: value1, name2: 'literalValue', ... }" attr="attributeName"></ANY>`

If `attr` attribute present, element will be added new attribute `attr` and value of `attr` is parsed message.

Example:

    <input i18n code="greetings.hello" params="{name: name, age: '20'}" attr="placeholder">
    
`name` parameter will be mapped with property `name` of `scope`, `'20'` is literal string.

#### With `i18n` service ####
---
1. Inject `i18n.adapter` module.
2. Modify `config` phase in `i18n.adapter` to declare languages supported and message services for language.
3. Invoke `translate` method or itself `i18n` to localize message.

Basic use:

    var msg = i18n(messageCode, parameters);
    or
    var msg = i18n.translate(messageCode, parameters);
    
Example:

    $scope.msg = i18n("greetings.hello", { name: "Kiddy", age: 20 });

If want to watch on property when switch language, use:

    i18n(messageCode, parameters, observer, observerAttribute);
    or
    i18n.translate(messageCode, parameters, observer, observerAttribute);
    
so `observerAttribute` property of `observer` will be updated every time switch language.

Example:

    i18n("greetings.hello", { name: "Kiddy", age: 20 }, $scope, "msg");

`msg` property of `$scope` is auto-updated every switch language.

Advanced
===
* Call `setModule(language, module)` method of `i18nProvider` provider to **set fixed place to find message object**.
* Remember to call `clearModule()` method of `i18n` service to **clear fixed place to find message object**.

Tips: listen on `$destroy` event of `$scope` to call `clearModule()`

#### `angularjs-i18n-adapter.js` ####
---
* After inject `i18n.adapter`, it registers a `config` phase to add message services.
* You should inject all messages services in here.
* **Message services is added lastest will have highest priority when find message object.** If you called `setModule(language, module)`, then **always find message on only module**. Remember to `clearModule()` when out of module or controller in module.
* Register message services, inject `i18nProvider` provider and

Use:

    i18nProvider.add(language, module, [ messageServices ]);
    
    
`module` of `language` must be unique, it must not exist in `language` before add.

Example:

    // en
    i18nProvider.add("en", "common.en", ["common-en"]);
    i18nProvider.add("en", "m2.en", ["m2-en"]);
    // vi
    i18nProvider.add("vi", "common.vi", ["common-vi"]);
    i18nProvider.add("vi", "m1.vi", ["m1-vi"]);
    
we declare two languages `en` and `vi`. `en` has two modules `common.en` and `m2.en`. `vi` has two modules `common.vi` and `m1.vi`. Module `common.en` has a message service `common-en`, modules `m2.en`, `common.vi` and `m1.vi` are similar to `common.en`.

#### Message refers other messages ####
---
To refer other messages, add `&` sign to first character of messages need to refer.

Example:

    greetings: {
      hello: "Hello {{name}}, your age is {{age}}",
      bonjour: "&greetings.hello"
    }

`greetings.bonjour` is referred value to `greetings.hello`, then `greetings.bonjour` is **Hello {{name}}, your age is {{age}}**.

License
===
The MIT License (MIT)

Copyright (c) 2013 Béo Bụ Bẫm

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
