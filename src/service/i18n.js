/**
 * @ngdoc service
 * @name i18n:i18n
 * @requires $rootScope
 *
 * @description
 * Localize your message via service.
 * Fire event `i18n:languageChanged` every time language was changed.
 *
 * #### How to use: ####
 * `i18n(code, [params])`
 *
 * @param {string=} code A message code need to be parse. A parameter is enclosing by double bracket `{{ name }}`. Refer an other message by adding the prefix `&`
 * @param {Object=} [params] An data object or array was replaced in message code
 *
 * @example
 * ```javascript
 * $scope.msg = i18n('sample.withParameters', { name: 'Duy Tran' });
 * ```
 */
angular.module('i18n', [
    'duytran.i18n.directive',
    'duytran.i18n.filter',
    'duytran.i18n.constant',
    'duytran.i18n.dictionary',
    'duytran.i18n.logUtil'])

    .provider('i18n', function($i18nDictionaryProvider, $i18nLogUtilProvider) {
        var currentLanguage;

        return {

            add: function(language, messageServices) {
                $i18nDictionaryProvider.add(angular.lowercase(language), messageServices);
            },

            setLanguage: function(language) {
                currentLanguage = angular.lowercase(language);
            },

            enableDebugging: function(debug) {
                $i18nLogUtilProvider.enableDebugging(debug);
            },

            $get: function($rootScope, $i18nDictionary, $i18nConstant) {

                /**
                 * Replace parameters with values.
                 *
                 * @param messageCode
                 * @param parameters Object or Array
                 *
                 * @returns message is replaced with parameters.
                 */
                function interpolateMessage(messageCode, parameters) {
                    var msg = $i18nDictionary.find(currentLanguage, messageCode);
                    var startIndex, endIndex, index = 0,
                        length = msg.length, parts = [],
                        tokenStart = $i18nConstant.PARAMETER_TOKEN.START,
                        tokenEnd = $i18nConstant.PARAMETER_TOKEN.END,
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

                            if( angular.isArray(parameters) ) {
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

                function fixLanguage() {
                    if(currentLanguage == null || currentLanguage.length < 1) {
                        currentLanguage = $i18nDictionary.getBrowserLanguage();
                    }
                    currentLanguage = angular.lowercase(currentLanguage);
                }

                var i18n = function(messageCode, parameters) {
                    fixLanguage();
                    var result = interpolateMessage(messageCode, parameters);
                    return result !== '' ? result : messageCode;
                };

                i18n.switchToLanguage = function(language) {
                    currentLanguage = language;
                    fixLanguage();
                    $rootScope.$broadcast($i18nConstant.EVENT_LANGUAGE_CHANGED);
                };

                i18n.getCurrentLanguage = function() {
                    return currentLanguage;
                };

                return i18n;
            }
        };
    });
