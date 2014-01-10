angular.module('angularApp', ['i18n.adapter', 'i18n'])

    .config(function(i18nProvider) {
        i18nProvider.setLanguage('en');
        i18nProvider.setDebugMode(true);
    })

    .controller('MainController', function($scope, i18n) {
        $scope.currentLanguage = i18n.getCurrentLanguage();
        $scope.bindingValue = '!~~';
        $scope.parsedMsg = i18n('message.unobserved', {literalNumber: 2014, bindingValue: $scope.bindingValue, literalString: '!~~'});
        i18n('message.basic', {literalNumber: 2014, bindingValue: $scope.bindingValue, literalString: '!~~'}, $scope, 'observedMsg');

        $scope.switchLanguage = function() {
            if($scope.currentLanguage === 'en') {
                $scope.currentLanguage = 'vi';
            } else {
                $scope.currentLanguage = 'en';
            }
            i18n.switchToLanguage($scope.currentLanguage);
        };
    });