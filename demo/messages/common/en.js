angular.module("common.en", [])
    .value("common-en", {
        greetings: {
            hello: "[Common][en] {{order}} - {{name}}[{{age}}]",
            bb: "Greetings from bb",
            bye: "&greetings.hello   &greetings.bb"
        }
    });