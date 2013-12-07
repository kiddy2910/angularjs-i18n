angular.module("i18n.adapter", ["i18n"])
    .config(function(i18nProvider) {
        i18nProvider.add("en", "common.en", ["common-en"]);
//        i18nProvider.add("en", "m1.en", ["m1-en"]);
        i18nProvider.add("en", "m2.en", ["m2-en"]);

        i18nProvider.add("vi", "common.vi", ["common-vi"]);
        i18nProvider.add("vi", "m1.vi", ["m1-vi"]);
    });

/**
 * Template for message services
 */
angular.module("template.en", [])
    .value("template-en", {
        greetings: {
            hello: "[Common][en] {{order}} - {{name}}[{{age}}]"
        }
    });