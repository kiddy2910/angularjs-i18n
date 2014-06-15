angular.module('duytran.i18n.constant', [])
    .constant('$i18nConstant', {
        EVENT_LANGUAGE_CHANGED: 'i18n:languageChanged',
        MESSAGE_CACHE: 'i18n:dictionary',
        REUSE_PARAMETER_TOKEN: '&',
        PARAMETER_TOKEN: {
            START: '{{',
            END: '}}'
        }
    });