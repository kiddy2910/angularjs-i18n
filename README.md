Introduction
==============
An plugin for localizing applications written by AngularJS Framework.

What can it do?
* Use as filter, directive and service.
* Auto generate HTML attributes (such as *placeholder* attribute).
* Switch language on the fly.
* **Support partial message files.** You can import many message files for a language.
* **Allow a message refers to other messages.**
* **Use cache for decreasing message translation time** (v1.2.0 or later).
* **Render message as HTML** (v1.2.0 or later).

Install
===
Via `bower`:

    bower install hoiio-i18n
    
Include `hoiio-i18n.js` and `hoiio-i18n-adapter.js` files in `<script>` tag
    
How to use
===
Assume message service as:

    greetings: {
      hello: "Hello {{name}}, your age is {{age}}",
      hello_with_html_tags: "<b>Hello</b>, this message has HTML tags"
    }
    

#### With `i18n` filter ####
---
Format: 

    {{ 'messageCode' | i18n : mappingParameter : 'literalParameter' : ... : 'pn' }}

Example:

    <input placeholder="{{ 'greetings.hello' | i18n : name : '20' }}">
    
`name` parameter will be mapped with property `name` of `scope`, `'20'` is literal string.


#### With `i18n` directive ####
---
Format:

    <ANY i18n code="messageCode" params="{ name1: value1, name2: 'literalValue', ... }" attr="attributeName"></ANY>

If `attr` attribute presents, element will be added new attribute `attr` and value of new attribute is parsed message.

Example:

    <input i18n code="greetings.hello" params="{name: name, age: '20'}" attr="placeholder">
    
`name` parameter will be mapped with property `name` of `scope`, `'20'` is literal string. **input** html tag will be added `placeholder` attribute with value is parsed message `greetings.hello`.

* Render as HTML tags:

If your message has HTML tags, you can render as HTML with property `raw="true"`, default it's false.

Example:

    <input i18n code="greetings.hello_with_html_tags" params="{name: name, age: '20'}" raw="true">


#### With `i18n` service ####
---
1. Declare supported languages and message services in `config` phase of module.
2. Translate message. That's all.

Declare supported languages: `i18nProvider.add(language, [ messageServices ]);`. **messageServices** will be:

- If {string} it will be injected and get data automatically.
- If {Object} it was only copy to dictionary of specific language.
- If {Array} must be a array of type {string} or {Object}.


Example:
    
    .config(function(i18nProvider, COMMON_VI) {
        // declare two message services for en language
        i18nProvider.add('en', ['common-en', 'm2-en']);

        // declare a message service for vi language
        i18nProvider.add('vi', 'm1-vi');
        // can add more message services for vi language in other place
        i18nProvider.add('vi', COMMON_VI);
    });
    
**Note:** *namespace* of message services **MUST be unique**, otherwise be overridden. **Namespace** of message service is root name.

Example:

    .value("en1", {
        greetings: {
            hello: "Hello, {{name}}. Your order is {{order}}."
        },

        name1: {
            name2: ""
        }
    });

`greetings`, `name1` are *namespaces* of message service.

Basic use:

    var msg = i18n(messageCode, parameters);
    
Example:

    $scope.msg = i18n('greetings.hello', { name: 'Duy Tran', age: 20 });

If want to watch on property when switch language, listen on event `i18n:languageChanged`.

Example:

    $scope.$on('i18n:languageChanged', function() { 
        $scope.msg = i18n('greetings.hello', { name: 'Duy Tran' }); 
    });

Advanced
===

#### Message refers other messages ####
---
To refer other messages, add `&` sign to first character of messages need to refer.

Example:

    greetings: {
      hello: "Hello {{name}}, your age is {{age}}",
      bonjour: "&greetings.hello"
    }

`greetings.bonjour` is referred value to `greetings.hello`, then `greetings.bonjour` is **Hello {{name}}, your age is {{age}}**.

Change Logs
===
### Version 2.0.0 ###
- Improve: Remove `observer` and `observerAttr` when invoke `i18n(code, params, observer, observerAttr)`. Listen on event `i18n:languageChanged` instead. Issue #3
- Improve: Accept case insensitive language when declare the dictionary. Issue #6
- Improve: `i18nProvider.add` method accepts *name of constant service*, *constant service object* or *array of them*. Issue #1
- Refactor: Rename `setDebugMode` method to `enableDebugging`

### Version 1.2.0 ###
- Use cache for decreasing message translation time.
- Support to render message as HTML with raw="true" attribute in directive.

License
===
The MIT License (MIT)

Copyright (c) 2013 Duy Tran

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
