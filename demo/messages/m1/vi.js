angular.module("m1.vi", [])
    .value("m1-vi", {
        greetings: {
            hello: "[M1][vi] {{order}} - {{name}}[{{age}}]"
        }
    });