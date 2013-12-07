angular.module("m2.vi", [])
    .value("m2-vi", {
        greetings: {
            hello: "[M2][vi] {{order}} - {{name}}[{{age}}]"
        }
    });