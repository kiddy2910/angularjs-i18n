angular.module('myApp', ['i18n', 'myApp.i18n.en', 'myApp.i18n.vi'])
    .config(function(i18nProvider) {
        i18nProvider.enableDebugging(true);
    })
    .controller('MainController', function($scope, i18n) {
        $scope.data = {
            lang: 'vi',
            message: i18n('sample.literalString'),
            user: {
                name: 'Duy Tran',
                country: 'Vietnam'
            },
            counter: 1
        };

        $scope.$on('i18n:languageChanged', function() {
            $scope.data.message = i18n('sample.literalString');
        });

        $scope.switchLanguage = function() {
            i18n.switchToLanguage($scope.data.lang);
            $scope.data.lang = $scope.data.lang === 'en' ? 'vi' : 'en';
        };

        $scope.count = function() {
            $scope.data.counter++;
        };
    });