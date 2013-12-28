angular.module('i18n.adapter', ['i18n', 'en.1', 'en.2', 'vi.1', 'vi.2'])

    .config(function(i18nProvider) {
        i18nProvider.add('en', ['en1', 'en2']);

        i18nProvider.add('vi', ['vi1']);
        i18nProvider.add('vi', ['vi2']);
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