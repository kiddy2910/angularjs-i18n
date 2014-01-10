angular.module('vi.msg', [])

    .value('VI_MSG', {
        message: {
            basic: 'Nội dung chứa 1 số [{{literalNumber}}], 1 giá trị tham chiếu [{{bindingValue}}] và 1 chuỗi [{{literalString}}].',
            unobserved: '&message.basic Nội dung này sẽ không tự động cập nhật khi đổi sang ngôn ngữ khác.',
            refer: 'Sai: sử dụng nội dung của message.basic [&message.basic]. <b>Chắc rằng có ít nhất 1 khoảng trắng sau [&message.basic] (if not end string)</b>.' +
                '<br/>Đúng: [&message.basic ]. <b>Dấu ngoặc vuông cuối cùng cách 1 khoảng trắng</b>.'
        }
    });