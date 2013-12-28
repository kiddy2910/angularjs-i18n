angular.module("module1", ["i18n"])
    .controller("ModuleController", function($scope, i18n) {
        $scope.moduleLanguage = "en";
        $scope.order = 2;
        $scope.mp = {
            name: "Module 2",
            age: 50
        };

        i18n("greetings.hello", {order: $scope.order, name: $scope.mp.name, age: $scope.mp.age}, $scope, "msg");

        $scope.swt = function() {
            if($scope.moduleLanguage === "en") {
                $scope.moduleLanguage = "vi";
            } else {
                $scope.moduleLanguage = "en";
            }
            i18n.switchLanguage($scope.moduleLanguage);
        };
    });