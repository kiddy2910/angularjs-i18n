/**
 * hoiio-i18n v1.2.0 (2014-01-10)
 *
 * Author: kiddy2910 <dangduy2910@gmail.com>
 * https://github.com/kiddy2910/angularjs-i18n.git
 *
 * Copyright (c) 2014 
 */
angular.module('i18n', [
  '#i18n.constants',
  '#i18n.localeContainer',
  '#i18n.logUtil'
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
]).filter('i18n', [
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
]).directive('i18n', [
  'i18n',
  'i18nConstants',
  function (i18n, i18nConstants) {
    function extractParameter(scope, propValue) {
      var stringToken = '"', charToken = '\'', dotToken = '.';
      if (propValue.indexOf(stringToken) === 0 || propValue.indexOf(charToken) === 0) {
        if (propValue.lastIndexOf(stringToken) === propValue.length - 1 || propValue.lastIndexOf(charToken) === propValue.length - 1) {
          return propValue.substring(1, propValue.length - 1);
        } else {
          return propValue.substring(1, propValue.length);
        }
      } else {
        var propPartials = propValue.split(dotToken) || [];
        var trackedObject = null;
        for (var i = 0; i < propPartials.length; i++) {
          if (i === 0) {
            trackedObject = scope.$parent[propPartials[0]];
          } else {
            trackedObject = trackedObject[propPartials[i]];
          }
          if (trackedObject == null) {
            break;
          }
        }
        return trackedObject != null ? trackedObject : propValue;
      }
    }
    function update(scope, element) {
      var pair, props, propName, propValue, args = {};
      var bracketStartToken = '{', bracketEndToken = '}';
      if (scope.params != null) {
        if (scope.params.indexOf(bracketStartToken) < 0 || scope.params.indexOf(bracketEndToken) < 0) {
          throw 'Property [params] of i18n directive must be covered in bracket';
        }
        props = scope.params.replace(bracketStartToken, '').replace(bracketEndToken, '').split(',');
        for (var i = 0; i < props.length; i++) {
          pair = props[i].split(':');
          if (pair.length !== 2) {
            return;
          }
          propName = pair[0].replace(/^\s+|\s+$/g, '');
          propValue = pair[1].replace(/^\s+|\s+$/g, '');
          propValue = extractParameter(scope, propValue);
          args[propName] = propValue;
        }
      }
      var msg = i18n.translate(scope.code, args);
      if (scope.attr != null) {
        element.attr(scope.attr, msg);
      } else {
        if (scope.raw) {
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
        raw: '@'
      },
      link: function (scope, element) {
        scope.$on(i18nConstants.EVENT_LANGUAGE_CHANGED, function () {
          update(scope, element);
        });
        update(scope, element);
      }
    };
  }
]);
angular.module('#i18n.constants', []).constant('i18nConstants', {
  EVENT_LANGUAGE_CHANGED: 'switchLanguageSuccess',
  MESSAGE_CACHE: 'i18nMsgRepo',
  REUSE_PARAMETER_TOKEN: '&',
  PARAMETER_TOKEN: {
    START: '{{',
    END: '}}'
  }
});
angular.module('#i18n.localeContainer', [
  '#i18n.constants',
  '#i18n.logUtil'
]).provider('i18nLocaleContainer', function () {
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
        function getMessageObject(language, messageNamespace) {
          var locale, iterationRequire, message, i;
          locale = getLocaleByLanguage(language);
          if (locale == null) {
            throw 'There is no locale [' + language + ']. Please declare before to use.';
          }
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
        function extractMessageCode(language, messageCode) {
          var dotToken = '.', message = null, namespaces = messageCode.split(dotToken);
          for (var i = 0; i < namespaces.length; i++) {
            if (i === 0) {
              message = getMessageObject(language, namespaces[0]);
            } else {
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
        function extractReference(language, message) {
          var referToken = i18nConstants.REUSE_PARAMETER_TOKEN, spaceToken = ' ';
          var referIndex, spaceIndex, index = 0, length = message.length;
          var parts = [], part, temp;
          var counterForBreakingLoop = 0;
          while (index < length) {
            if ((referIndex = message.indexOf(referToken, index)) >= 0) {
              if (referIndex !== index) {
                parts.push(message.substring(index, referIndex));
              }
              if ((spaceIndex = message.indexOf(spaceToken, referIndex)) >= 0) {
                parts.push(message.substring(referIndex, spaceIndex));
                index = spaceIndex;
              } else {
                parts.push(message.substring(referIndex));
                index = length;
              }
            } else {
              if (index !== length) {
                parts.push(message.substring(index));
              }
              index = length;
            }
            if (counterForBreakingLoop > length) {
              throw 'Message Code [' + message + '] refers infinitely.';
            }
            counterForBreakingLoop++;
          }
          for (var i = 0; i < parts.length; i++) {
            part = parts[i];
            if (part.indexOf(referToken) === 0 && part.length > 1) {
              part = part.replace(referToken, '');
              temp = extractMessageCode(language, part);
              parts[i] = temp === part ? referToken + temp : temp;
            }
          }
          return parts.join('');
        }
        function getMessageFromCache(language, messageCode) {
          var cache = $cacheFactory.get(i18nConstants.MESSAGE_CACHE + language);
          return cache == null ? null : cache.get(messageCode);
        }
        function storeInCache(language, messageCode, message) {
          var cache = $cacheFactory.get(i18nConstants.MESSAGE_CACHE + language);
          if (cache == null) {
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
                  i18nLogUtil.debug('---- Store cache$' + language + '#' + messageCode + ' with value#' + msg);
                  storeInCache(language, messageCode, msg);
                }
              }
              return msg;
            },
            getBrowserLanguage: function () {
              var browserLanguage, androidLanguage;
              if ($window.navigator && $window.navigator.userAgent && (androidLanguage = $window.navigator.userAgent.match(/android.*\W(\w\w)-(\w\w)\W/i))) {
                browserLanguage = androidLanguage[1];
              } else {
                browserLanguage = $window.navigator.userLanguage || $window.navigator.language;
              }
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
angular.module('#i18n.logUtil', []).provider('i18nLogUtil', function () {
  var isDebug = false;
  var mode = {
      DEBUG: 'DEBUG',
      ERROR: 'ERROR',
      WARNING: 'WARNING'
    };
  return {
    setDebugMode: function (trueOrFalse) {
      isDebug = trueOrFalse === true;
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