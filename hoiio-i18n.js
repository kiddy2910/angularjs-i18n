/**
 * hoiio-i18n v1.1.0 (2013-12-29)
 *
 * Author: kiddy2910 <dangduy2910@gmail.com>
 * https://github.com/kiddy2910/angularjs-i18n.git
 *
 * Copyright (c) 2013 
 */
(function ( window, angular, undefined ) {

angular.module('i18n', ['i18n.localeContainer'])

    .constant('i18nConstants', {
        EVENT_LANGUAGE_CHANGED: 'switchLanguageSuccess'
    })

/**
 * Inject this service to localize application.
 *
 * How to use:
 *  - i18n service is a function, so can call: i18n(code, ...).
 *  - Service [i18n] has available methods: [switchToLanguage], [getCurrentLanguage].
 *  - Provider [i18nProvider] has available methods: [add], [setLanguage].
 *
 * To localize app:
 *  - i18n(messageCode, parameters, observer, observerAttribute)
 *  - var msg = i18n(messageCode, parameters)
 */
    .provider('i18n', function(i18nLocaleContainerProvider) {
        var pendingQueue = [];
        var currentLanguage, browserLanguage;

        return {

            /**
             * Teach i18n service how to translate message.
             * Message services add later will have high priority.
             *
             * @param language
             * @param messageServices array of message services contain dictionary.
             */
            add: function(language, messageServices) {
                i18nLocaleContainerProvider.add(language, messageServices);
            },

            setLanguage: function(language) {
                currentLanguage = language;
            },

            $get: function($rootScope, i18nLocaleContainer, i18nConstants) {

                /**
                 * Replace parameters with values.
                 *
                 * @param messageCode
                 * @param parameters:
                 *          Object if isAnonymous is null or false.
                 *          Array if isAnonymous is true.
                 * @param isAnonymous: indicates parameters is object or array.
                 * @returns message is replaced with parameters.
                 */
                function interpolateMessage(messageCode, parameters, isAnonymous) {
                    var msg = i18nLocaleContainer.find(currentLanguage, messageCode);
                    var startIndex, endIndex, index = 0,
                        length = msg.length, parts = [],
                        tokenStart = '{{', tokenEnd = '}}',
                        tokenStartLength = tokenStart.length,
                        tokenEndLength = tokenEnd.length,
                        paramIndex = 0, paramName = '',
                        paramNameWithToken = '';

                    if(parameters == null || parameters.length < 1) {
                        return msg;
                    }

                    while(index < length) {

                        if ( ((startIndex = msg.indexOf(tokenStart, index)) !== -1) &&
                            ((endIndex = msg.indexOf(tokenEnd, startIndex + tokenStartLength)) !== -1) ) {

                            if(index !== startIndex) {
                                parts.push(msg.substring(index, startIndex));
                            }

                            paramName = msg.substring(startIndex + tokenStartLength, endIndex);
                            paramNameWithToken = tokenStart + paramName + tokenEnd;

                            if(isAnonymous === true) {
                                if(paramIndex >= parameters.length) {
                                    parts.push(paramNameWithToken);
                                } else {
                                    parts.push(parameters[paramIndex] != null ? parameters[paramIndex] : paramNameWithToken);
                                }
                            } else {
                                parts.push(parameters[paramName] != null ? parameters[paramName] : paramNameWithToken);
                            }

                            paramIndex++;
                            index = endIndex + tokenEndLength;
                        } else {
                            if(index !== length) {
                                parts.push(msg.substring(index));
                            }
                            index = length;
                        }
                    }
                    return parts.join('');
                }

                function addToPendingQueue(messageCode, parameters, isAnonymous, observer, observerAttr) {
                    pendingQueue.push({
                        code: messageCode,
                        params: parameters,
                        isAnonymous: isAnonymous,
                        observer: observer,
                        observerAttr: observerAttr,
                        update: function(parsedMsg) {
                            observer[observerAttr] = parsedMsg;
                        }
                    });
                }

                function updatePendingQueue() {
                    for(var i=0; i<pendingQueue.length; i++) {
                        var p = pendingQueue[i];
                        var result = interpolateMessage(p.code, p.params, p.isAnonymous);
                        p.update(result !== '' ? result : p.code);
                    }
                }

                function fixLanguage() {
                    if(currentLanguage == null || currentLanguage.length < 1) {
                        if(browserLanguage == null || browserLanguage.length < 1) {
                            browserLanguage = i18nLocaleContainer.getBrowserLanguage();
                        }
                        currentLanguage = browserLanguage;
                    }
                }

                var i18n = function(messageCode, parameters, observer, observerAttr) {
                    return i18n.translate(messageCode, parameters, false, observer, observerAttr);
                };

                i18n.switchToLanguage = function(language) {
                    currentLanguage = language;
                    fixLanguage();
                    updatePendingQueue();
                    $rootScope.$broadcast(i18nConstants.EVENT_LANGUAGE_CHANGED);
                };

                i18n.getCurrentLanguage = function() {
                    return currentLanguage;
                };

                /**
                 * Deprecated Internal method. Translate message code.
                 *
                 * @param messageCode
                 * @param parameters can be object or array.
                 * @param isAnonymous indicates that parameters are object (pair of name and value) or array.
                 * @param observer object contains property to watch when switch language.
                 * @param observerAttr property is updated when switch language.
                 * @returns {*}
                 */
                i18n.translate = function(messageCode, parameters, isAnonymous, observer, observerAttr) {
                    fixLanguage();

                    if(observer != null) {
                        addToPendingQueue(messageCode, parameters, isAnonymous, observer, observerAttr);
                        updatePendingQueue();
                    } else {
                        var result = interpolateMessage(messageCode, parameters, isAnonymous);
                        return result !== '' ? result : messageCode;
                    }

                    return '';
                };

                return i18n;
            }

        };
    })

/**
 * Format: {{ 'code' | i18n: p1: 'p2': ...: 'pn' }}
 *
 *  code: message code in international message files.
 *      Code must be wrapped in single or double quotes.
 *      Code can include parameters with format: {{name}}.
 *
 *  pn: parameters in code.
 *      If pn in quotes, it's constant.
 *      If pn without quotes, its data got from [scope] variable of directive.
 *
 *  Example:
 *      <input placeholder="{{ 'greetings.hello' | i18n: name: 'LOCALIZE' }}">
 */
    .filter('i18n', function(i18n) {
        return function(input) {
            var args = [];
            if(arguments != null) {
                for(var i=1; i<arguments.length; i++) {
                    args.push(arguments[i]);
                }
            }
            return i18n.translate(input, args, true);
        };
    })

/**
 *  Format:
 *      <i18n code="msgCode" params="{ pn1: pv1, pn2: pv2, ... }" attr="attributeName"></i18n>
 *      <ANY i18n code="msgCode" params="{ pn1: pv1, pn2: pv2, ... }" attr="attributeName"></ANY>
 *
 *  msgCode: message code in international message files.
 *      Code can include parameters with format: {{name}}.
 *
 *  pn: parameter name.
 *  pv: value of parameter.
 *      If pv in quotes, it's constant.
 *      If pv without quotes, its data got from [scope.$parent] variable of directive.
 *
 *  attributeName: (just only) name of attribute you want to insert into element.
 *
 *  Example:
 *      <h2 i18n code="greetings.hello"></h2>
 *      <h2 i18n code="greetings.hello" params="{name: name, app: 'LOCALIZE'}"></h2>
 *      <input i18n code="greetings.hello" params="{name: name, app: 'LOCALIZE'}" attr="placeholder">
 */
    .directive('i18n', function(i18n, i18nConstants) {

        function extractParameter(scope, propValue) {
            var stringToken = '"', charToken = "'", dotToken = '.';
            if(propValue.indexOf(stringToken) === 0 || propValue.indexOf(charToken) === 0) {
                if(propValue.lastIndexOf(stringToken) === propValue.length - 1 ||
                    propValue.lastIndexOf(charToken) === propValue.length - 1) {
                    return propValue.substring(1, propValue.length - 1);
                } else {
                    return propValue.substring(1, propValue.length);
                }
            } else {
                var propPartials = propValue.split(dotToken) || [];
                var trackedObject = null;
                for(var i=0; i<propPartials.length; i++) {
                    if(i === 0) {
                        trackedObject = scope.$parent[propPartials[0]];
                    } else {
                        trackedObject = trackedObject[propPartials[i]];
                    }

                    if(trackedObject == null) {
                        break;
                    }
                }
                return trackedObject != null ? trackedObject : propValue;
            }
        }

        function update(scope, element) {
            var pair, props, propName, propValue, args = {};
            var bracketStartToken = '{', bracketEndToken = '}';

            if(scope.params != null) {
                if(scope.params.indexOf(bracketStartToken) < 0 || scope.params.indexOf(bracketEndToken) < 0) {
                    throw 'Property [params] of i18n directive must be covered in bracket';
                }

                props = scope.params.replace(bracketStartToken, '').replace(bracketEndToken, '').split(',');
                for(var i=0; i<props.length; i++) {
                    pair = props[i].split(':');
                    if(pair.length !== 2) {
                        return;
                    }

                    propName = pair[0].replace(/^\s+|\s+$/g, '');
                    propValue = pair[1].replace(/^\s+|\s+$/g, '');
                    propValue = extractParameter(scope, propValue);
                    args[propName] = propValue;
                }
            }

            var msg = i18n.translate(scope.code, args);
            if(scope.attr != null) {
                element.attr(scope.attr, msg);
            } else {
                element.text(msg);
            }
        }

        return {
            restrict: 'AE',
            scope: {
                code: '@',
                params: '@',
                attr: '@'
            },
            link: function(scope, element) {
                scope.$on(i18nConstants.EVENT_LANGUAGE_CHANGED, function() {
                    update(scope, element);
                });

                update(scope, element);
            }
        };
    });


// Beware This is internal module, shouldn't use in anywhere.
angular.module('i18n.localeContainer', [])

    /**
     * Format:
     *
     *  i18nLocaleContainer = [
     *  {
     *      language: 'en',
     *      requires: [
     *          {name: 'en-1', provider: angular.injector([modules.name]).get(requires.name)},
     *          {name: 'en-2', provider: angular.injector([modules.name]).get(requires.name)}
     *      ]
     *  }, {
     *      language: 'vi',
     *      requires: [
     *          {name: 'vi-1', provider: angular.injector([modules.name]).get(requires.name)},
     *          {name: 'vi-2', provider: angular.injector([modules.name]).get(requires.name)}
     *      ]
     *  }]
     *
     * @type {Array}
     */
    .provider('i18nLocaleContainer', function() {
        var i18nLocaleContainer = [];

        function getLocaleByLanguage(language) {
            for(var i=0; i<i18nLocaleContainer.length; i++) {
                if(i18nLocaleContainer[i].language === language) {
                    return i18nLocaleContainer[i];
                }
            }
            return null;
        }

        function getOrInitLocale(language) {
            var locale = getLocaleByLanguage(language);
            if(locale == null) {
                locale = {
                    language: language,
                    requires: []
                };
                i18nLocaleContainer.push(locale);
            }
            return locale;
        }

        function getRequireByName(locale, requireName) {
            for(var i=0; i<locale.requires.length; i++) {
                if(locale.requires[i].name === requireName) {
                    return locale.requires[i];
                }
            }
            return null;
        }

        function initRequire(requireName) {
            return {
                name: requireName,
                provider: null
            };
        }

        return {

            /**
             * Add requires to message container.
             *
             * @param language
             * @param requires: requires need to add.
             */
            add: function(language, requires) {
                var locale, require;

                locale = getOrInitLocale(language);

                for(var i=0; i<requires.length; i++) {
                    require = getRequireByName(locale, requires[i]);

                    // not exist
                    if(require == null) {
                        require = initRequire(requires[i]);
                        locale.requires.push(require);
                    }
                }
            },

            $get: function($window, $injector) {

                function initMessageProvider(requireName) {
                    if($injector.has(requireName)) {
                        return $injector.get(requireName);
                    }
                    throw 'Require [' + requireName + "] doesn't exist.";
                }

                /**
                 * Get message object in message services. Priority for require last added.
                 *
                 * @param language
                 * @param messageNamespace: name of message object
                 * @returns message object or null.
                 */
                function getMessageObject(language, messageNamespace) {
                    var locale, iterationRequire, message, i;

                    locale = getLocaleByLanguage(language);
                    if(locale == null) {
                        throw 'There is no locale [' + language + ']. Please declare before to use.';
                    }

                    // iterates message services
                    for(i=locale.requires.length - 1; i>=0; i--) {
                        iterationRequire = locale.requires[i];

                        if(iterationRequire.provider == null) {
                            iterationRequire.provider = initMessageProvider(iterationRequire.name);
                        }

                        message = iterationRequire.provider[messageNamespace];
                        if(message != null) {
                            return message;
                        }
                    }
                    return null;
                }

                /**
                 * Get message string by language and message code.
                 * Support to reuse parameter by (&) sign.
                 *
                 * @param language
                 * @param messageCode: message code need to find.
                 * @returns message string or message code if not exist or not string.
                 */
                function extractMessageCode(language, messageCode) {
                    var dotToken = '.', message = null;
                    var namespaces = messageCode.split(dotToken);

                    for(var i=0; i<namespaces.length; i++) {
                        if(i === 0) {
                            // get message object from the first namespace
                            message = getMessageObject(language, namespaces[0]);
                        } else {
                            // refer to children properties of message object
                            message = message[namespaces[i]];
                        }

                        if(message == null) {
                            return messageCode;
                        }
                    }

                    if(message instanceof Object) {
                        return messageCode;
                    } else {
                        return extractReference(language, message);
                    }
                }

                /**
                 * Get message by referring to other message by (&) sign.
                 *
                 * @param language
                 * @param message
                 * @returns message
                 */
                function extractReference(language, message) {
                    var referToken = '&', spaceToken = ' ';
                    var referIndex, spaceIndex, index = 0, length = message.length;
                    var parts = [], part, temp;
                    var counterForBreakingLoop = 0;

                    // split by reference token and space token
                    while(index < length) {
                        if ((referIndex = message.indexOf(referToken, index)) >= 0) {
                            // part without reference
                            if(referIndex !== index) {
                                parts.push(message.substring(index, referIndex));
                            }

                            // part from reference position to space
                            if((spaceIndex = message.indexOf(spaceToken, referIndex)) >= 0) {
                                parts.push(message.substring(referIndex, spaceIndex));
                                index = spaceIndex;
                            } else {
                                // without any space, add remain string
                                parts.push(message.substring(referIndex));
                                index = length;
                            }
                        } else {
                            // string without any reference token
                            if(index !== length) {
                                parts.push(message.substring(index));
                            }
                            index = length;
                        }

                        // for breaking loop if loop is infinite
                        if(counterForBreakingLoop > length) {
                            throw 'Message Code [' + message + '] refers infinitely.';
                        }
                        counterForBreakingLoop++;
                    }

                    // refer to other message object if parts has reference token
                    for(var i=0; i<parts.length; i++) {
                        part = parts[i];

                        // if part start with reference token and not only (&) sign
                        if(part.indexOf(referToken) === 0 && part.length > 1) {
                            part = part.replace(referToken, '');

                            // refer to other message
                            temp = extractMessageCode(language, part);

                            // if refer failed, output message code
                            parts[i] = (temp === part ? referToken + temp : temp);
                        }
                    }
                    // join parts
                    return parts.join('');
                }

                var localeFactory = {

                    /**
                     * Get message string by language and message code.
                     * Support to reuse parameter by (&) sign.
                     *
                     * @param language
                     * @param messageCode: message code need to find.
                     * @returns message string or message code if not exist or not string.
                     */
                    find: function(language, messageCode) {
                        return extractMessageCode(language, messageCode);
                    },

                    /**
                     * Utility for get browser language. Result will be truncated after dash(-) sign.
                     *
                     * @returns string or null.
                     */
                    getBrowserLanguage: function() {
                        var browserLanguage, androidLanguage;
                        if ($window.navigator && $window.navigator.userAgent &&
                            (androidLanguage = $window.navigator.userAgent.match(/android.*\W(\w\w)-(\w\w)\W/i))) {
                            // works for earlier version of Android (2.3.x)
                            browserLanguage = androidLanguage[1];
                        } else {
                            // works for iOS, Android 4.x and other devices
                            browserLanguage = $window.navigator.userLanguage || $window.navigator.language;
                        }

                        // only get characters before dash sign
                        if(browserLanguage != null && browserLanguage.indexOf('-') >= 0) {
                            browserLanguage = browserLanguage.substring(0, browserLanguage.indexOf('-'));
                        }

                        return browserLanguage;
                    }
                };

                return localeFactory;
            }
        };
    });

})( window, window.angular );
