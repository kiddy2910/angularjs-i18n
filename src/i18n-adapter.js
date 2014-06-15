angular.module('duytran.i18n.adapter', ['i18n', 'myApp.i18n.en', 'myApp.i18n.vi'])

    .config(function(i18nProvider) {
        i18nProvider.enableDebugging(false);
        i18nProvider.setLanguage('en');

        // Inject service SAMPLE_EN and add to dictionaries
//        i18nProvider.add('en', SAMPLE_EN);

        // many times for a language
        i18nProvider.add('VI', ['SAMPLE_VI']);
        i18nProvider.add('vi', ['SAMPLE_VI_1']);
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