/**
 * hoiio-i18n v1.3.0 (2014-06-14)
 *
 * Author: kiddy2910 <dangduy2910@gmail.com>
 * https://github.com/kiddy2910/angularjs-i18n.git
 *
 * Copyright (c) 2014 
 */
angular.module('duytran.i18n.constants', []).constant('i18nConstants', {
  EVENT_LANGUAGE_CHANGED: 'switchLanguageSuccess',
  MESSAGE_CACHE: 'i18nMsgRepo',
  REUSE_PARAMETER_TOKEN: '&',
  PARAMETER_TOKEN: {
    START: '{{',
    END: '}}'
  }
});
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
angular.module('duytran.i18n.localeContainer', []).provider('i18nLocaleContainer', function () {
  var i18nLocaleContainer = [];
  function getLocaleByLanguage(language) {
    for (var i = 0; i < i18nLocaleContainer.length; i++) {
      if (i18nLocaleContainer[i].language === language) {
        return i18nLocaleContainer[i];
      }
    }
    return null;
  }
  function getOrInitLocale(language) {
    var locale = getLocaleByLanguage(language);
    if (locale == null) {
      locale = {
        language: language,
        requires: []
      };
      i18nLocaleContainer.push(locale);
    }
    return locale;
  }
  function getRequireByName(locale, requireName) {
    for (var i = 0; i < locale.requires.length; i++) {
      if (locale.requires[i].name === requireName) {
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
    add: function (language, requires) {
      var locale, require;
      locale = getOrInitLocale(language);
      for (var i = 0; i < requires.length; i++) {
        require = getRequireByName(locale, requires[i]);
        // not exist
        if (require == null) {
          require = initRequire(requires[i]);
          locale.requires.push(require);
        }
      }
    },
    $get: [
      '$window',
      '$injector',
      '$cacheFactory',
      'i18nLogUtil',
      'i18nConstants',
      function ($window, $injector, $cacheFactory, i18nLogUtil, i18nConstants) {
        function initMessageProvider(requireName) {
          if ($injector.has(requireName)) {
            return $injector.get(requireName);
          }
          throw 'Require [' + requireName + '] doesn\'t exist.';
        }
        /**
                 * Get message object in message services. Priority for require last added.
                 *
                 * @param language
                 * @param messageNamespace name of message object
                 * @returns message object or null.
                 */
        function getMessageObject(language, messageNamespace) {
          var locale, iterationRequire, message, i;
          locale = getLocaleByLanguage(language);
          if (locale == null) {
            throw 'There is no locale [' + language + ']. Please declare before to use.';
          }
          // iterates message services
          for (i = locale.requires.length - 1; i >= 0; i--) {
            iterationRequire = locale.requires[i];
            if (iterationRequire.provider == null) {
              iterationRequire.provider = initMessageProvider(iterationRequire.name);
            }
            message = iterationRequire.provider[messageNamespace];
            if (message != null) {
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
                 * @param messageCode message code need to find.
                 * @returns message string or message code if not exist or not string.
                 */
        function extractMessageCode(language, messageCode) {
          var dotToken = '.', message = null, namespaces = messageCode.split(dotToken);
          for (var i = 0; i < namespaces.length; i++) {
            if (i === 0) {
              // get message object from the first namespace
              message = getMessageObject(language, namespaces[0]);
            } else {
              // refer to children properties of message object
              message = message[namespaces[i]];
            }
            if (message == null) {
              return messageCode;
            }
          }
          if (message instanceof Object) {
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
          // join parts
          return parts.join('');
        }
        function getMessageFromCache(language, messageCode) {
          var cache = $cacheFactory.get(i18nConstants.MESSAGE_CACHE + language);
          return cache == null ? null : cache.get(messageCode);
        }
        function storeInCache(language, messageCode, message) {
          var cache = $cacheFactory.get(i18nConstants.MESSAGE_CACHE + language);
          if (cache == null) {
            // initialize cache
            cache = $cacheFactory(i18nConstants.MESSAGE_CACHE + language);
          }
          cache.put(messageCode, message);
        }
        var localeFactory = {
            find: function (language, messageCode) {
              i18nLogUtil.debug('Get cache$' + language + '#' + messageCode);
              var msg = getMessageFromCache(language, messageCode);
              if (msg == null) {
                i18nLogUtil.debug('-- Cannot found cache$' + language + '#' + messageCode);
                msg = extractMessageCode(language, messageCode);
                if (msg !== messageCode) {
                  // have matched message, set cache
                  i18nLogUtil.debug('---- Store cache$' + language + '#' + messageCode + ' with value#' + msg);
                  storeInCache(language, messageCode, msg);
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
        return localeFactory;
      }
    ]
  };
});
angular.module('duytran.i18n.logUtil', []).provider('i18nLogUtil', function () {
  var isDebug = false;
  var mode = {
      DEBUG: 'DEBUG',
      ERROR: 'ERROR',
      WARNING: 'WARNING'
    };
  return {
    setDebugMode: function (enableDebugging) {
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
  'duytran.i18n.logUtil'
]).provider('i18n', [
  'i18nLocaleContainerProvider',
  'i18nLogUtilProvider',
  function (i18nLocaleContainerProvider, i18nLogUtilProvider) {
    var pendingQueue = [];
    var currentLanguage, browserLanguage;
    return {
      add: function (language, messageServices) {
        i18nLocaleContainerProvider.add(language, messageServices);
      },
      setLanguage: function (language) {
        currentLanguage = language;
      },
      setDebugMode: function (trueOrFalse) {
        i18nLogUtilProvider.setDebugMode(trueOrFalse);
      },
      $get: [
        '$rootScope',
        '$sce',
        'i18nLocaleContainer',
        'i18nConstants',
        function ($rootScope, $sce, i18nLocaleContainer, i18nConstants) {
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
            var startIndex, endIndex, index = 0, length = msg.length, parts = [], tokenStart = i18nConstants.PARAMETER_TOKEN.START, tokenEnd = i18nConstants.PARAMETER_TOKEN.END, tokenStartLength = tokenStart.length, tokenEndLength = tokenEnd.length, paramIndex = 0, paramName = '', paramNameWithToken = '';
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
                if (isAnonymous === true) {
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
          function addToPendingQueue(messageCode, parameters, isAnonymous, observer, observerAttr) {
            pendingQueue.push({
              code: messageCode,
              params: parameters,
              isAnonymous: isAnonymous,
              observer: observer,
              observerAttr: observerAttr,
              update: function (parsedMsg) {
                observer[observerAttr] = parsedMsg;
              }
            });
          }
          function updatePendingQueue() {
            for (var i = 0; i < pendingQueue.length; i++) {
              var p = pendingQueue[i];
              var result = interpolateMessage(p.code, p.params, p.isAnonymous);
              p.update(result !== '' ? result : p.code);
            }
          }
          function fixLanguage() {
            if (currentLanguage == null || currentLanguage.length < 1) {
              if (browserLanguage == null || browserLanguage.length < 1) {
                browserLanguage = i18nLocaleContainer.getBrowserLanguage();
              }
              currentLanguage = browserLanguage;
            }
          }
          var i18n = function (messageCode, parameters, observer, observerAttr) {
            return i18n.translate(messageCode, parameters, false, observer, observerAttr);
          };
          i18n.switchToLanguage = function (language) {
            currentLanguage = language;
            fixLanguage();
            updatePendingQueue();
            $rootScope.$broadcast(i18nConstants.EVENT_LANGUAGE_CHANGED);
          };
          i18n.getCurrentLanguage = function () {
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
          i18n.translate = function (messageCode, parameters, isAnonymous, observer, observerAttr) {
            fixLanguage();
            if (observer != null) {
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
      ]
    };
  }
]);
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
angular.module('duytran.i18n.directive', []).directive('i18n', [
  '$parse',
  'i18n',
  'i18nConstants',
  function ($parse, i18n, i18nConstants) {
    return {
      restrict: 'A',
      scope: true,
      compile: function (element, attrs) {
        var code = attrs.code, params = attrs.params, attr = attrs.attr, raw = attrs.raw;
        function evaluate(scope) {
          var parameters = null;
          if (params != null) {
            parameters = $parse(params)(scope);
          }
          return i18n.translate(code, parameters);
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
        return function (scope) {
          render(scope);
          scope.$on(i18nConstants.EVENT_LANGUAGE_CHANGED, function () {
            render(scope);
          });
        };
      }
    };
  }
]);
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
      return i18n.translate(input, args, true);
    };
  }
]);