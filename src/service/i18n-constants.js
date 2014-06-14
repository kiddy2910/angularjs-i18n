angular.module('duytran.i18n.constants', [])
    .constant('i18nConstants', {
        EVENT_LANGUAGE_CHANGED: 'i18n:languageChanged',
        MESSAGE_CACHE: 'i18n:dictionary',
        REUSE_PARAMETER_TOKEN: '&',
        PARAMETER_TOKEN: {
            START: '{{',
            END: '}}'
        }
    });