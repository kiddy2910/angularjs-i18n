angular.module("en.1", [])
    .value("en1", {
        greetings: {
            hello: "Hello, {{name}}. Your order is {{order}}."
        }
    });