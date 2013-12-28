angular.module('i18n.adapter', ['i18n', 'common.en', 'm2.en', 'common.vi', 'm1.vi'])

    .config(function(i18nProvider) {
        i18nProvider.add('en', ['common-en']);
        i18nProvider.add('en', ['m2-en']);

        i18nProvider.add('vi', ['m1-vi']);
        i18nProvider.add('vi', ['common-vi']);
    });

/**
 * Template for message services
 */
angular.module('template.en', [])
    .value('template-en', {
        greetings: {
            hello: '[Common][en] {{order}} - {{name}}[{{age}}]'
        }
    });