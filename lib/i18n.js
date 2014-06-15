angular.module('i18n', ['#i18n.constants', '#i18n.localeContainer', '#i18n.logUtil'])

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
    .provider('i18n', function(i18nLocaleContainerProvider, $i18nLogUtilProvider) {
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

            setDebugMode: function(trueOrFalse) {
                $i18nLogUtilProvider.setDebugMode(trueOrFalse);
            },

            $get: function($rootScope, $sce, i18nLocaleContainer, i18nConstants) {

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
                        tokenStart = i18nConstants.PARAMETER_TOKEN.START,
                        tokenEnd = i18nConstants.PARAMETER_TOKEN.END,
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
                 * @deprecated Internal method. Translate message code.
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
 *      <i18n code="msgCode" params="{ pn1: pv1, pn2: pv2, ... }" attr="attributeName" raw="true"></i18n>
 *      <ANY i18n code="msgCode" params="{ pn1: pv1, pn2: pv2, ... }" attr="attributeName" raw="false"></ANY>
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
 *  raw: true if message will be rendered as html. Otherwise false (default).
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
                if(scope.raw) {
                    element.html(msg);
                } else {
                    element.text(msg);
                }
            }
        }

        return {
            restrict: 'AE',
            scope: {
                code: '@',
                params: '@',
                attr: '@',
                raw: '@'        // true or false
            },
            link: function(scope, element) {
                scope.$on(i18nConstants.EVENT_LANGUAGE_CHANGED, function() {
                    update(scope, element);
                });

                update(scope, element);
            }
        };
    });
