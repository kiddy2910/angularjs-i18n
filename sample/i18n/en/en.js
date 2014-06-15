angular.module('myApp.i18n.en', [ 'myApp.i18n.sample.en'])
    .config(function(i18nProvider, SAMPLE_EN) {
        i18nProvider.add('en', SAMPLE_EN);
    });