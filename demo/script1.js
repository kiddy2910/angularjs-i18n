angular.module("module1", ["i18n"])
    .controller("ModuleController", function($scope, i18n) {
        $scope.lang = "en";
        $scope.order = 2;
        $scope.person = {
            name: "Module 2",
            age: 50
        };

        i18n("greetings.hello", {order: $scope.order, name: $scope.person.name, age: $scope.person.age}, $scope, "msg");

        $scope.switch = function() {
            if($scope.lang === "en") {
                $scope.lang = "vi";
            } else {
                $scope.lang = "en";
            }
            i18n.switchLanguage($scope.lang);
        };
    });