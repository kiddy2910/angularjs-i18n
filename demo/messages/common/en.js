angular.module("common.en", [])
    .value("common-en", {
        greetings: {
            hello: "[Common][en] {{order}} - {{name}}[{{age}}]"
        }
    });