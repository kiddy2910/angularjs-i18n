angular.module('duytran.i18n.constants', [])
    .constant('i18nConstants', {
        EVENT_LANGUAGE_CHANGED: 'switchLanguageSuccess',
        MESSAGE_CACHE: 'i18nMsgRepo',
        REUSE_PARAMETER_TOKEN: '&',
        PARAMETER_TOKEN: {
            START: '{{',
            END: '}}'
        }
    });