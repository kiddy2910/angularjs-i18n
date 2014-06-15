angular.module('duytran.i18n.dictionary', [])
    .provider('$i18nDictionary', function($i18nConstant) {
        var dictionaries = [], lazyRequires = [];

        function getDictionaryByLanguage(language) {
            for( var i=0; i<dictionaries.length; i++) {
                if(dictionaries[i].language === language) {
                    return dictionaries[i];
                }
            }
            return null;
        }

        function getMessageByLanguageAndCode(language, namespaceOfMessageCode) {
            var dictionary = getDictionaryByLanguage(language);
            if(dictionary == null) {
                throw 'No data for language [' + language + ']';
            }
            return dictionary.data[namespaceOfMessageCode];
        }

        /**
         * @ngdoc function
         * @name duytran.i18n.dictionary.$i18nDictionary#extractMessageCode
         * @methodOf duytran.i18n.dictionary.$i18nDictionary
         *
         * @description
         * Get message string by language and message code.
         * To interpolate parameters, enclose by double bracket `{{ name }}`.
         * To refer other message, add the prefix {@link $i18nConstant.REUSE_PARAMETER_TOKEN} `&code`.
         *
         * @param language
         * @param messageCode
         * @returns {string} Message was parsed from code or code if it doesn't exist.
         */
        function extractMessageCode(language, messageCode) {
            var dotToken = '.', message = null,
                namespaces = messageCode.split(dotToken);

            if( namespaces.length > 0) {
                message = getMessageByLanguageAndCode(language, namespaces[0]);
                if(message == null) {
                    return messageCode;
                }
            }

            for( var i=1; i<namespaces.length; i++ ) {
                message = message[namespaces[i]];
                if(message == null) {
                    return messageCode;
                }
            }

            if( angular.isObject(message) ) {
                return messageCode;
            } else {
                return extractReference(language, message);
            }
        }

        /**
         * @ngdoc function
         * @name duytran.i18n.dictionary.$i18nDictionary#extractMessageCode
         * @methodOf duytran.i18n.dictionary.$i18nDictionary
         *
         * @description
         * Get message by referring to other message by {@link $i18nConstant.REUSE_PARAMETER_TOKEN} sign.
         *
         * @param language
         * @param message
         * @returns {string} Message was parsed from code or code if it doesn't exist
         */
        function extractReference(language, message) {
            var referToken = $i18nConstant.REUSE_PARAMETER_TOKEN, spaceToken = ' ';
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
            return parts.join('');
        }

        return {

            /**
             * @ngdoc function
             * @name duytran.i18n.dictionary.$i18nDictionary#add
             * @methodOf duytran.i18n.dictionary.$i18nDictionary
             *
             * @description
             * Add dictionary of specific language.
             * Call this method multiple times to add more content of specific language.
             *
             * @param {string} language Declare supported language
             * @param {string|Object|Array} constantsOrRequires Name of content service, content service object or array of them
             * If {string} it will be injected and get data automatically.
             * If {Object} it was only copy to dictionary of specific language.
             * If {Array} must be a array of type {string} or {Object}
             */
            add: function(language, constantsOrRequires) {
                var lazy;
                for( var i=0; i<lazyRequires.length; i++ ) {
                    if( lazyRequires[i].language === language ) {
                        lazy = lazyRequires[i];
                        break;
                    }
                }

                if(lazy == null) {
                    lazy = {
                        language: language,
                        requires: []
                    };
                    lazyRequires.push(lazy);
                }

                if( angular.isArray(constantsOrRequires) ) {
                    angular.forEach(constantsOrRequires, function(p) {
                        lazy.requires.push(p);
                    });
                } else if( angular.isObject(constantsOrRequires) ) {
                    lazy.requires.push(constantsOrRequires);
                } else {
                    throw 'i18n only accepts a constant service or array of constant services.';
                }
            },

            $get: function($window, $injector, $cacheFactory, $i18nLogUtil) {

                /**
                 * @ngdoc function
                 * @name duytran.i18n.dictionary.$i18nDictionary#initLazyRequires
                 * @methodOf duytran.i18n.dictionary.$i18nDictionary
                 *
                 * @description
                 * Read data of requires were passed into dictionary of specific language
                 */
                (function initLazyRequires() {
                    var lazy, dictionary, require;
                    for( var i=0; i<lazyRequires.length; i++ ) {
                        lazy = lazyRequires[i];

                        dictionary = {
                            language: lazy.language,
                            data: {}
                        };
                        dictionaries.push(dictionary);

                        for( var k=0; k<lazy.requires.length; k++ ) {
                            require = lazy.requires[k];
                            if( angular.isString(require) ) {
                                angular.extend(dictionary.data, injectRequire(require));
                            } else if( angular.isObject(require) ) {
                                angular.extend(dictionary.data, require);
                            } else {
                                $i18nLogUtil.error('Require [' + require + '] must be an Object or name of constant service');
                            }
                        }
                    }

                    lazyRequires.splice(0, lazyRequires.length);
                })();

                function injectRequire(require) {
                    if($injector.has(require)) {
                        return $injector.get(require);
                    }
                    throw 'Require [' + require + "] doesn't exist.";
                }

                function getMessageFromCache(language, messageCode) {
                    var cache = $cacheFactory.get($i18nConstant.MESSAGE_CACHE + ":" + language);
                    return cache == null ? null : cache.get(messageCode);
                }

                function addToCache(language, messageCode, message) {
                    var cache = $cacheFactory.get($i18nConstant.MESSAGE_CACHE + ":" + language);
                    if(cache == null) {
                        cache = $cacheFactory($i18nConstant.MESSAGE_CACHE + ":" + language);
                    }
                    cache.put(messageCode, message);
                }

                return {

                    /**
                     * @ngdoc function
                     * @name duytran.i18n.dictionary.$i18nDictionary#find
                     * @methodOf duytran.i18n.dictionary.$i18nDictionary
                     *
                     * @description
                     * Query the message of code in specific language.
                     *
                     * @param language
                     * @param messageCode
                     * @returns {string} The message of a code or code if it doesn't exist
                     */
                    find: function(language, messageCode) {
                        $i18nLogUtil.debug('Get cache$' + language + '#' + messageCode);
                        var msg = getMessageFromCache(language, messageCode);
                        if(msg == null) {
                            $i18nLogUtil.debug('-- Cannot found cache$' + language + '#' + messageCode);
                            msg = extractMessageCode(language, messageCode);

                            if(msg !== messageCode) {
                                // have matched message, set cache
                                $i18nLogUtil.debug('---- Add to cache$' + language + '#' + messageCode + ' with value#' + msg);
                                addToCache(language, messageCode, msg);
                            }
                        }
                        return msg;
                    },

                    /**
                     * @ngdoc function
                     * @name duytran.i18n.dictionary.$i18nDictionary#getBrowserLanguage
                     * @methodOf duytran.i18n.dictionary.$i18nDictionary
                     *
                     * @description
                     * Utility for get browser language. Result will be truncated from dash(-) sign to end.
                     *
                     * @returns {string} Language of browser
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
            }
        };
    });