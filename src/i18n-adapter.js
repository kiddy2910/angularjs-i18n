angular.module('duytran.i18n.adapter', ['i18n',
        'en.syntax', 'en.msg',
        'vi.syntax', 'vi.msg'])

    .config(function(i18nProvider) {
        i18nProvider.add('en', ['EN_SYNTAX', 'EN_MSG']);

        // many times for a language
        i18nProvider.add('vi', ['VI_SYNTAX']);
        i18nProvider.add('vi', ['VI_MSG']);
    });

/**
 * Template for message services
 */
angular.module('tpl.en', [])

    .value('EN_TPL', {
        intro: {
            parameter: 'Use token {{ paramName }}',
            refer: 'Use token &'
        }
    });