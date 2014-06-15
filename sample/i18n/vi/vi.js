angular.module('myApp.i18n.vi', [ 'myApp.i18n.sample.vi' ])
    .config(function(i18nProvider) {
        i18nProvider.add('VI', ['SAMPLE_VI']);
    });