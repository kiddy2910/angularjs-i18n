angular.module('en.msg', [])

    .value('EN_MSG', {
        message: {
            basic: 'The message contains a literal number [{{literalNumber}}], a binding value [{{bindingValue}}] and a literal string [{{literalString}}].',
            unobserved: '&message.basic It won\'t auto-update value when switch other language.',
            refer: 'Wrong: Refer to message.basic [&message.basic]. <b>Make sure to have at least a space after referred message code (if not end string)</b>.' +
                '<br/>Correct: [&message.basic ]. <b>The last square bracket delimits a space</b>.'
        }
    });