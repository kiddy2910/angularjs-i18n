angular.module('myApp', ['i18n', 'myApp.i18n.en', 'myApp.i18n.vi'])
    .config(function(i18nProvider) {
        i18nProvider.add('en', ['SAMPLE_EN']);
        i18nProvider.add('vi', ['SAMPLE_VI']);
    })

    .controller('MainController', function($scope, i18n) {
        $scope.data = {
            lang: 'vi',
            user: {
                name: 'Duy Tran'
            }
        };

        $scope.switchLanguage = function() {
            i18n.switchToLanguage($scope.data.lang);
            $scope.data.lang = $scope.data.lang === 'en' ? 'vi' : 'en';
        };
    });