angular.module("common.vi", [])
    .value("common-vi", {
        greetings: {
            hello: "[Common][vi] {{order}} - {{name}}[{{age}}]"
        }
    });