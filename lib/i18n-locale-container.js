angular.module('#i18n.localeContainer', ['#i18n.constants', '#i18n.logUtil'])

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

            $get: function($window, $injector, $cacheFactory, i18nLogUtil, i18nConstants) {

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
                 * Support to reuse parameter by {@link REUSE_PARAMETER_TOKEN} sign.
                 *
                 * @param language
                 * @param messageCode: message code need to find.
                 * @returns message string or message code if not exist or not string.
                 */
                function extractMessageCode(language, messageCode) {
                    var dotToken = '.', message = null,
                        namespaces = messageCode.split(dotToken);

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
                 * Get message by referring to other message by {@link REUSE_PARAMETER_TOKEN} sign.
                 *
                 * @param language
                 * @param message
                 * @returns message
                 */
                function extractReference(language, message) {
                    var referToken = i18nConstants.REUSE_PARAMETER_TOKEN, spaceToken = ' ';
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

                function getMessageFromCache(language, messageCode) {
                    var cache = $cacheFactory.get(i18nConstants.MESSAGE_CACHE + language);
                    return cache == null ? null : cache.get(messageCode);
                }

                function storeInCache(language, messageCode, message) {
                    var cache = $cacheFactory.get(i18nConstants.MESSAGE_CACHE + language);
                    if(cache == null) {
                        // initialize cache
                        cache = $cacheFactory(i18nConstants.MESSAGE_CACHE + language);
                    }
                    cache.put(messageCode, message);
                }

                var localeFactory = {

                    /**
                     * Get message string by language and message code.
                     * Support to reuse parameter by {@link REUSE_PARAMETER_TOKEN} sign.
                     *
                     * @param language
                     * @param messageCode: message code need to find.
                     * @returns message string or message code if not exist or not string.
                     */
                    find: function(language, messageCode) {
                        i18nLogUtil.debug('Get cache$' + language + '#' + messageCode);
                        var msg = getMessageFromCache(language, messageCode);
                        if(msg == null) {
                            i18nLogUtil.debug('-- Cannot found cache$' + language + '#' + messageCode);
                            msg = extractMessageCode(language, messageCode);

                            if(msg !== messageCode) {
                                // have matched message, set cache
                                i18nLogUtil.debug('---- Store cache$' + language + '#' + messageCode + ' with value#' + msg);
                                storeInCache(language, messageCode, msg);
                            }
                        }

                        return msg;
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