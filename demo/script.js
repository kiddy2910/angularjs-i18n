angular.module("angularApp", ["i18n.adapter", "i18n"])

    .config(function(i18nProvider) {
        i18nProvider.setLanguage('vi');
    })

    .controller("MainController", function($scope, i18n) {
        $scope.lang = i18n.getCurrentLanguage();
        $scope.order = 1;
        $scope.person = {
            name: "Kiddy",
            age: 20
        };

        i18n("greetings1.bye", {order: $scope.order, name: $scope.person.name, age: $scope.person.age}, $scope, "msg");

        $scope.switch = function() {
            if($scope.lang === "en") {
                $scope.lang = "vi";
            } else {
                $scope.lang = "en";
            }
            i18n.switchToLanguage($scope.lang);
        };
    });