angular.module("m2.en", [])
    .value("m2-en", {
        greetings: {
            hello: "[M2][en] {{order}} - {{name}}[{{age}}]"
        }
    });