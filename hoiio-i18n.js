/**
 * hoiio-i18n v2.0.0 (2014-06-15)
 *
 * Author: kiddy2910 <dangduy2910@gmail.com>
 * https://github.com/kiddy2910/angularjs-i18n.git
 *
 * Copyright (c) 2014 
 */
angular.module('duytran.i18n.constant', []).constant('$i18nConstant', {
  EVENT_LANGUAGE_CHANGED: 'i18n:languageChanged',
  MESSAGE_CACHE: 'i18n:dictionary',
  REUSE_PARAMETER_TOKEN: '&',
  PARAMETER_TOKEN: {
    START: '{{',
    END: '}}'
  }
});
angular.module('duytran.i18n.dictionary', []).provider('$i18nDictionary', [
  '$i18nConstant',
  function ($i18nConstant) {
    var dictionaries = [], lazyRequires = [];
    function getDictionaryByLanguage(language) {
      for (var i = 0; i < dictionaries.length; i++) {
        if (dictionaries[i].language === language) {
          return dictionaries[i];
        }
      }
      return null;
    }
    function getMessageByLanguageAndCode(language, namespaceOfMessageCode) {
      var dictionary = getDictionaryByLanguage(language);
      if (dictionary == null) {
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
      var dotToken = '.', message = null, namespaces = messageCode.split(dotToken);
      if (namespaces.length > 0) {
        message = getMessageByLanguageAndCode(language, namespaces[0]);
        if (message == null) {
          return messageCode;
        }
      }
      for (var i = 1; i < namespaces.length; i++) {
        message = message[namespaces[i]];
        if (message == null) {
          return messageCode;
        }
      }
      if (angular.isObject(message)) {
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
      while (index < length) {
        if ((referIndex = message.indexOf(referToken, index)) >= 0) {
          // part without reference
          if (referIndex !== index) {
            parts.push(message.substring(index, referIndex));
          }
          // part from reference position to space
          if ((spaceIndex = message.indexOf(spaceToken, referIndex)) >= 0) {
            parts.push(message.substring(referIndex, spaceIndex));
            index = spaceIndex;
          } else {
            // without any space, add remain string
            parts.push(message.substring(referIndex));
            index = length;
          }
        } else {
          // string without any reference token
          if (index !== length) {
            parts.push(message.substring(index));
          }
          index = length;
        }
        // for breaking loop if loop is infinite
        if (counterForBreakingLoop > length) {
          throw 'Message Code [' + message + '] refers infinitely.';
        }
        counterForBreakingLoop++;
      }
      // refer to other message object if parts has reference token
      for (var i = 0; i < parts.length; i++) {
        part = parts[i];
        // if part start with reference token and not only (&) sign
        if (part.indexOf(referToken) === 0 && part.length > 1) {
          part = part.replace(referToken, '');
          // refer to other message
          temp = extractMessageCode(language, part);
          // if refer failed, output message code
          parts[i] = temp === part ? referToken + temp : temp;
        }
      }
      return parts.join('');
    }
    return {
      add: function (language, constantsOrRequires) {
        var lazy;
        for (var i = 0; i < lazyRequires.length; i++) {
          if (lazyRequires[i].language === language) {
            lazy = lazyRequires[i];
            break;
          }
        }
        if (lazy == null) {
          lazy = {
            language: language,
            requires: []
          };
          lazyRequires.push(lazy);
        }
        if (angular.isArray(constantsOrRequires)) {
          angular.forEach(constantsOrRequires, function (p) {
            lazy.requires.push(p);
          });
        } else if (angular.isObject(constantsOrRequires)) {
          lazy.requires.push(constantsOrRequires);
        } else {
          throw 'i18n only accepts a constant service or array of constant services.';
        }
      },
      $get: [
        '$window',
        '$injector',
        '$cacheFactory',
        '$i18nLogUtil',
        function ($window, $injector, $cacheFactory, $i18nLogUtil) {
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
            for (var i = 0; i < lazyRequires.length; i++) {
              lazy = lazyRequires[i];
              dictionary = {
                language: lazy.language,
                data: {}
              };
              dictionaries.push(dictionary);
              for (var k = 0; k < lazy.requires.length; k++) {
                require = lazy.requires[k];
                if (angular.isString(require)) {
                  angular.extend(dictionary.data, injectRequire(require));
                } else if (angular.isObject(require)) {
                  angular.extend(dictionary.data, require);
                } else {
                  $i18nLogUtil.error('Require [' + require + '] must be an Object or name of constant service');
                }
              }
            }
            lazyRequires.splice(0, lazyRequires.length);
          }());
          function injectRequire(require) {
            if ($injector.has(require)) {
              return $injector.get(require);
            }
            throw 'Require [' + require + '] doesn\'t exist.';
          }
          function getMessageFromCache(language, messageCode) {
            var cache = $cacheFactory.get($i18nConstant.MESSAGE_CACHE + ':' + language);
            return cache == null ? null : cache.get(messageCode);
          }
          function addToCache(language, messageCode, message) {
            var cache = $cacheFactory.get($i18nConstant.MESSAGE_CACHE + ':' + language);
            if (cache == null) {
              cache = $cacheFactory($i18nConstant.MESSAGE_CACHE + ':' + language);
            }
            cache.put(messageCode, message);
          }
          return {
            find: function (language, messageCode) {
              $i18nLogUtil.debug('Get cache$' + language + '#' + messageCode);
              var msg = getMessageFromCache(language, messageCode);
              if (msg == null) {
                $i18nLogUtil.debug('-- Cannot found cache$' + language + '#' + messageCode);
                msg = extractMessageCode(language, messageCode);
                if (msg !== messageCode) {
                  // have matched message, set cache
                  $i18nLogUtil.debug('---- Add to cache$' + language + '#' + messageCode + ' with value#' + msg);
                  addToCache(language, messageCode, msg);
                }
              }
              return msg;
            },
            getBrowserLanguage: function () {
              var browserLanguage, androidLanguage;
              if ($window.navigator && $window.navigator.userAgent && (androidLanguage = $window.navigator.userAgent.match(/android.*\W(\w\w)-(\w\w)\W/i))) {
                // works for earlier version of Android (2.3.x)
                browserLanguage = androidLanguage[1];
              } else {
                // works for iOS, Android 4.x and other devices
                browserLanguage = $window.navigator.userLanguage || $window.navigator.language;
              }
              // only get characters before dash sign
              if (browserLanguage != null && browserLanguage.indexOf('-') >= 0) {
                browserLanguage = browserLanguage.substring(0, browserLanguage.indexOf('-'));
              }
              return browserLanguage;
            }
          };
        }
      ]
    };
  }
]);
angular.module('duytran.i18n.logUtil', []).provider('$i18nLogUtil', function () {
  var isDebug = false;
  var mode = {
      DEBUG: 'DEBUG',
      ERROR: 'ERROR',
      WARNING: 'WARNING'
    };
  return {
    enableDebugging: function (enableDebugging) {
      isDebug = enableDebugging === true;
    },
    $get: [
      '$log',
      function ($log) {
        function log(debugMode, msg) {
          if (!isDebug) {
            return;
          }
          switch (debugMode) {
          case mode.DEBUG:
            $log.debug(msg);
            break;
          case mode.ERROR:
            $log.error(msg);
            break;
          case mode.WARNING:
            $log.warn(msg);
            break;
          }
        }
        return {
          debug: function (msg) {
            log(mode.DEBUG, msg);
          },
          error: function (msg) {
            log(mode.ERROR, msg);
          },
          warning: function (msg) {
            log(mode.WARNING, msg);
          }
        };
      }
    ]
  };
});
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
  'duytran.i18n.logUtil'
]).provider('i18n', [
  '$i18nDictionaryProvider',
  '$i18nLogUtilProvider',
  function ($i18nDictionaryProvider, $i18nLogUtilProvider) {
    var currentLanguage;
    return {
      add: function (language, messageServices) {
        $i18nDictionaryProvider.add(angular.lowercase(language), messageServices);
      },
      setLanguage: function (language) {
        currentLanguage = angular.lowercase(language);
      },
      enableDebugging: function (debug) {
        $i18nLogUtilProvider.enableDebugging(debug);
      },
      $get: [
        '$rootScope',
        '$i18nDictionary',
        '$i18nConstant',
        function ($rootScope, $i18nDictionary, $i18nConstant) {
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
            var startIndex, endIndex, index = 0, length = msg.length, parts = [], tokenStart = $i18nConstant.PARAMETER_TOKEN.START, tokenEnd = $i18nConstant.PARAMETER_TOKEN.END, tokenStartLength = tokenStart.length, tokenEndLength = tokenEnd.length, paramIndex = 0, paramName = '', paramNameWithToken = '';
            if (parameters == null || parameters.length < 1) {
              return msg;
            }
            while (index < length) {
              if ((startIndex = msg.indexOf(tokenStart, index)) !== -1 && (endIndex = msg.indexOf(tokenEnd, startIndex + tokenStartLength)) !== -1) {
                if (index !== startIndex) {
                  parts.push(msg.substring(index, startIndex));
                }
                paramName = msg.substring(startIndex + tokenStartLength, endIndex);
                paramNameWithToken = tokenStart + paramName + tokenEnd;
                if (angular.isArray(parameters)) {
                  if (paramIndex >= parameters.length) {
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
                if (index !== length) {
                  parts.push(msg.substring(index));
                }
                index = length;
              }
            }
            return parts.join('');
          }
          function fixLanguage() {
            if (currentLanguage == null || currentLanguage.length < 1) {
              currentLanguage = $i18nDictionary.getBrowserLanguage();
            }
            currentLanguage = angular.lowercase(currentLanguage);
          }
          var i18n = function (messageCode, parameters) {
            fixLanguage();
            var result = interpolateMessage(messageCode, parameters);
            return result !== '' ? result : messageCode;
          };
          i18n.switchToLanguage = function (language) {
            currentLanguage = language;
            fixLanguage();
            $rootScope.$broadcast($i18nConstant.EVENT_LANGUAGE_CHANGED);
          };
          i18n.getCurrentLanguage = function () {
            return currentLanguage;
          };
          return i18n;
        }
      ]
    };
  }
]);
/**
 * @ngdoc directive
 * @name duytran.i18n.directive:i18n
 * @requires $parse
 * @restrict A
 *
 * @description
 * Localize your message via directive
 *
 * @param {string=} code A message code need to be parse. A parameter is enclosing by double bracket `{{ name }}`. Refer an other message by adding the prefix `&`
 * @param {Object=} [params] An object, an array of values or only value
 * @param {string=} [attr] Message was parsed in this (or created if non-exist)
 * @param {string=} [raw] Accept `true | false`, useful in rendering a message which contains HTML tags. Default `false`
 *
 * @example
 * <example>
 *     <tag i18n code="sample.literalString"></tag>
 *     <tag i18n code="sample.withParameters" params="data.user.name"></tag>
 *     <tag i18n code="sample.withParameters" params=" 'Duy Tran' "></tag>
 *     <tag i18n code="sample.manyParameters" params="{ name: 'Duy Tran', country: data.user.country }"></tag>
 *     <tag i18n code="sample.manyParameters" params="[ 'Duy Tran', data.user.country ]"></tag>
 *     <tag i18n code="sample.literalString" attr="placeholder"></tag>
 *     <tag i18n code="sample.literalString" raw="true"></tag>
 * </example>
 */
angular.module('duytran.i18n.directive', []).directive('i18n', [
  '$parse',
  'i18n',
  '$i18nConstant',
  function ($parse, i18n, $i18nConstant) {
    return {
      restrict: 'A',
      scope: true,
      compile: function (element, attrs) {
        var code = attrs.code, params = attrs.params, attr = attrs.attr, raw = attrs.raw, commaToken = ',', bracketStartToken = '[', parenthesisToken = '{';
        function evaluate(scope) {
          var parameters = null, trimmedParamString, partialParams;
          if (params != null) {
            trimmedParamString = trim(params);
            if (trimmedParamString.indexOf(bracketStartToken) === 0) {
              // parameters will be an array
              parameters = [];
              partialParams = params.replace(/[\[\]]/gm, '').split(commaToken);
              for (var i = 0; i < partialParams.length; i++) {
                parameters.push($parse(trim(partialParams[i]))(scope));
              }
            } else if (trimmedParamString.indexOf(parenthesisToken) === 0) {
              // parameters will be an object
              parameters = $parse(trimmedParamString)(scope);
            } else {
              // parameters will be an array
              parameters = [$parse(trimmedParamString)(scope)];
            }
          }
          return i18n(code, parameters);
        }
        function render(scope) {
          var msg = evaluate(scope, code, params);
          if (attr != null) {
            element.attr(attr, msg);
          } else {
            if (raw) {
              element.html(msg);
            } else {
              element.text(msg);
            }
          }
        }
        function trim(str) {
          return str.replace(/^\s+|\s+$/gm, '');
        }
        return function (scope) {
          render(scope);
          scope.$on($i18nConstant.EVENT_LANGUAGE_CHANGED, function () {
            render(scope);
          });
        };
      }
    };
  }
]);
/**
 * @ngdoc filter
 * @name duytran.i18n.filter:i18n
 *
 * @description
 * Localize your message via filter
 *
 * ### Use in HTML format ###
 * **{{ 'code' | i18n [: param1 : 'param2' : ...] }}**
 *
 * @param {string=} code A message code need to be parse. A parameter is enclosing by double bracket `{{ name }}`. Refer an other message by adding the prefix `&`
 * @param {*=} [params] An data object was replaced in message code by order
 *
 * @example
 * <example>
 *     <tag>{{ 'sample.withParameters' | i18n : data.user.name }}</tag>
 * </example>
 */
angular.module('duytran.i18n.filter', []).filter('i18n', [
  'i18n',
  function (i18n) {
    return function (input) {
      var args = [];
      if (arguments != null) {
        for (var i = 1; i < arguments.length; i++) {
          args.push(arguments[i]);
        }
      }
      return i18n(input, args);
    };
  }
]);