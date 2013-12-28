angular.module("vi.1", [])
    .value("vi1", {
        greetings: {
            hello: "Xin chào, {{name}}. Số thứ tự là {{order}}."
        }
    });