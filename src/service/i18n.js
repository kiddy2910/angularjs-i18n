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
angular.module('i18n', [
    'duytran.i18n.directive',
    'duytran.i18n.filter',
    'duytran.i18n.constants',
    'duytran.i18n.localeContainer',
    'duytran.i18n.logUtil'])

    .provider('i18n', function(i18nLocaleContainerProvider, i18nLogUtilProvider) {
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
                i18nLogUtilProvider.setDebugMode(trueOrFalse);
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
    });
