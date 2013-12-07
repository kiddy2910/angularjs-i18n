/**
 * angularjs-i18n v1.0.0 (2013-12-07)
 *
 * Author: kiddy2910 <dangduy2910@gmail.com>
 * https://github.com/kiddy2910/angularjs-i18n.git
 *
 * Copyright (c) 2013 
 */
(function ( window, angular, undefined ) {

angular.module("i18n", ["i18n.localeContainer"])

/**
 * Inject this service to localize application.
 *
 * How to use:
 *  - i18n service is a function, so can call: i18n(code, ...).
 *  - Service [i18n] has available methods: [switchLanguage], [getLanguage], [translate], [clearModule].
 *  - Provider [i18nProvider] has available methods: [add], [setModule], [setLanguage], [setModule].
 *
 * To localize app:
 *  - i18n(messageCode, parameters, isAnonymous, observer, observerAttribute)
 *  - var msg = i18n(messageCode, parameters, isAnonymous)
 */
    .provider("i18n", function(i18nLocaleContainerProvider) {
        var pendingQueue = [];
        var currentLanguage, browserLanguage;

        function getI18nMessage(messageCode) {
            var dotToken = ".";
            var namespaces = messageCode.split(dotToken);
            var messageObject = null;

            for(var i=0; i<namespaces.length; i++) {
                if(i === 0) {
                    messageObject = i18nLocaleContainerProvider.find(currentLanguage, namespaces[0], null);
                } else {
                    messageObject = messageObject[namespaces[i]];
                }

                if(messageObject == null) {
                    return messageCode;
                }
            }

            if(messageObject instanceof Object) {
                return messageCode;
            } else {
                return messageObject;
            }
        }

        function interpolateMessage(messageCode, parameters, isAnonymous) {
            var msg = getI18nMessage(messageCode);
            var startIndex, endIndex, index = 0,
                length = msg.length, parts = [],
                tokenStart = "{{", tokenEnd = "}}",
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
                p.update(result !== "" ? result : p.code);
            }
        }

        return {

            add: function(language, module, valueServicesInModule) {
                i18nLocaleContainerProvider.add(language, module, valueServicesInModule);
            },

            setModule: function(language, module) {
                i18nLocaleContainerProvider.setModule(language, module);
            },

            setLanguage: function(language) {
                currentLanguage = language;
            },

            $get: function($rootScope, i18nLocaleContainer) {

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

                i18n.switchLanguage = function(language) {
                    currentLanguage = language;
                    fixLanguage();
                    updatePendingQueue();
                    $rootScope.$broadcast('switchLanguageSuccess');
                };

                i18n.getLanguage = function() {
                    return currentLanguage;
                };

                i18n.translate = function(messageCode, parameters, isAnonymous, observer, observerAttr) {
                    fixLanguage();

                    if(observer != null) {
                        addToPendingQueue(messageCode, parameters, isAnonymous, observer, observerAttr);
                        updatePendingQueue();
                    } else {
                        var result = interpolateMessage(messageCode, parameters, isAnonymous);
                        return result !== "" ? result : messageCode;
                    }

                    return "";
                };

                i18n.clearModule = function() {
                    i18nLocaleContainer.clearModule();
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
    .directive("i18n", function(i18n) {
        function extractParameter(scope, propValue) {
            var stringToken = '"', charToken = "'", dotToken = ".";
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
            var bracketStartToken = "{", bracketEndToken = "}";

            if(scope.params != null) {
                if(scope.params.indexOf(bracketStartToken) < 0 || scope.params.indexOf(bracketEndToken) < 0) {
                    throw "Property [params] of i18n directive must be covered in bracket";
                }

                props = scope.params.replace(bracketStartToken, "").replace(bracketEndToken, "").split(",");
                for(var i=0; i<props.length; i++) {
                    pair = props[i].split(":");
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
            restrict: "AE",
            scope: {
                code: "@",
                params: "@",
                attr: "@"
            },
            link: function(scope, element) {
                scope.$on('switchLanguageSuccess', function() {
                    update(scope, element);
                });

                update(scope, element);
            }
        };
    });


/**
 * Internal module, shouldn't use anywhere.
 */
angular.module("i18n.localeContainer", [])

/**
 * This is internal service, shouldn't use anywhere.
 */
    .provider("i18nLocaleContainer", function() {
        /**
         * Format:
         *  i18nLocaleContainer = [{
         *      language: "en",
         *      modules: [{
         *          name: "i18n.en.1",
         *          requires: [{
         *              name: "en-1",
         *              provider: angular.injector([modules.name]).get(requires.name)
         *          }, {
         *              name: "en-2",
         *              provider: angular.injector([modules.name]).get(requires.name)
         *          }]
         *      }, {
         *          name: "i18n.en.2",
         *          requires: [{
         *              name: "en-1",
         *              provider: angular.injector([modules.name]).get(requires.name)
         *          }, {
         *              name: "en-2",
         *              provider: angular.injector([modules.name]).get(requires.name)
         *          }]
         *      }]
         *  }]
         *
         * @type {Array}
         */
        var i18nLocaleContainer = [];
        var fixedLanguage, fixedModuleName;

        function getLocaleByLanguage(language) {
            for(var i=0; i<i18nLocaleContainer.length; i++) {
                if(i18nLocaleContainer[i].language === language) {
                    return i18nLocaleContainer[i];
                }
            }
            return null;
        }

        function getModuleByName(locale, moduleName) {
            for(var i=0; i<locale.modules.length; i++) {
                if(locale.modules[i].name === moduleName) {
                    return locale.modules[i];
                }
            }
            return null;
        }

        function getOrInitLocale(language) {
            var locale = getLocaleByLanguage(language);
            if(locale == null) {
                locale = {
                    language: language,
                    modules: []
                };
                i18nLocaleContainer.push(locale);
            }
            return locale;
        }

        function initModule(moduleName) {
            return {
                name: moduleName,
                requires: []
            };
        }

        function initRequire(moduleName, requireName) {
            return {
                name: requireName,
                provider: initProvider(moduleName, requireName)
            };
        }

        function initProvider(module, require) {
            return angular.injector([module]).get(require);
        }

        return {

            /**
             * Add requires to message container.
             *
             * @param language
             * @param moduleName: module contains message services.
             * @param requires: requires need to add.
             */
            add: function(language, moduleName, requires) {
                var locale, module, require;

                locale = getOrInitLocale(language);
                module = getModuleByName(locale, moduleName);
                if(module != null) {
                    throw "Module [" + moduleName + "] already exists, please edit its requires instead.";
                }

                // init module
                module = initModule(moduleName);
                locale.modules.push(module);

                // init requires
                for(var i=0; i<requires.length; i++) {
                    require = initRequire(moduleName, requires[i]);
                    module.requires.push(require);
                }
            },

            /**
             * Set place to find message object.
             *
             * @param language
             * @param moduleName
             */
            setModule: function(language, moduleName) {
                fixedLanguage = language;
                fixedModuleName = moduleName;
            },

            /**
             * Get message object in message services. Priority for require last added.
             *
             * @param language
             * @param messageCode: name of message object.
             * @param moduleName: module contains message services.
             * @returns message object or null.
             */
            find: function(language, messageCode) {
                var locale, module, iterationModule, iterationRequire, message, i, k;

                locale = getLocaleByLanguage(language);
                if(locale == null) {
                    throw "There is no locale [" + language + "]. Please declare before to use.";
                }

                if(fixedLanguage === language && fixedModuleName != null) {
                    // if module is passed, only find in this module
                    module = getModuleByName(locale, fixedModuleName);
                    if(module == null) {
                        throw "Module [" + fixedModuleName + "] doesn't exist.";
                    }

                    // iterate requires
                    for(k=module.requires.length - 1; k>=0; k--) {
                        iterationRequire = module.requires[k];

                        message = iterationRequire.provider[messageCode];
                        if(message != null) {
                            return message;
                        }
                    }
                } else {
                    // iterate modules
                    for(i=locale.modules.length - 1; i>=0; i--) {
                        iterationModule = locale.modules[i];

                        // iterate requires
                        for(k=iterationModule.requires.length - 1; k>=0; k--) {
                            iterationRequire = iterationModule.requires[k];

                            message = iterationRequire.provider[messageCode];
                            if(message != null) {
                                return message;
                            }
                        }
                    }
                }

                return null;
            },

            $get: function($window) {
                return {
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
                        if(browserLanguage != null && browserLanguage.indexOf("-") >= 0) {
                            browserLanguage = browserLanguage.substring(0, browserLanguage.indexOf("-"));
                        }

                        return browserLanguage;
                    },

                    /**
                     * Clear place to find message object.
                     */
                    clearModule: function() {
                        fixedLanguage = null;
                        fixedModuleName = null;
                    }
                };
            }
        };
    });

})( window, window.angular );
