angular.module("angularApp", ["i18n.adapter", "module1", "i18n"])
    .config(function(i18nProvider) {
        // set place to find message
        i18nProvider.setPreferredMessages("en", [ "m2-en" ]);
    })

    .controller("MainController", function($scope, i18n) {
        $scope.lang = "en";
        $scope.order = 1;
        $scope.person = {
            name: "Kiddy",
            age: 20
        };

        i18n("greetings.bye", {order: $scope.order, name: $scope.person.name, age: $scope.person.age}, $scope, "msg");

        $scope.swt = function() {
            if($scope.lang === "en") {
                $scope.lang = "vi";
            } else {
                $scope.lang = "en";
            }
            i18n.switchLanguage($scope.lang);
        };

        $scope.des = function() {
            $scope.$destroy();
        };

        $scope.$on("$destroy", function() {
            // should clear module when you go out of module
            i18n.clearModule();
        });
    });