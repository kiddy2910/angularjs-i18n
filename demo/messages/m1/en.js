angular.module("m1.en", [])
    .value("m1-en", {
        greetings: {
            hello: "[M1][en] {{order}} - {{name}}[{{age}}]"
        }
    });