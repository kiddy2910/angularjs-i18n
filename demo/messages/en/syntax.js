angular.module('en.syntax', [])

    .value('EN_SYNTAX', {
        syntax: {
            directive: {
                element: '<i18n code="message.basic" params="{literalNumber: 2014, bindingValue: bindingValue, literalString: \'!~~\'}"></i18n>',
                attr: '<ANY i18n code="message.basic" params="{literalNumber: 2014, bindingValue: bindingValue, literalString: \'!~~\'}"></ANY>',
                custom: '<input i18n code="message.basic" params="{literalNumber: 2014, bindingValue: bindingValue, literalString: \'!~~\'}" attr="placeholder">'
            },

            filter: "{{'message.basic' | i18n  : 2014 : bindingValue : '!~~'}}",

            refer: 'i18n code="message.refer" params="{literalNumber: 2014, bindingValue: bindingValue, literalString: \'!~~\'}" raw="true"',

            service: {
                normal: '$scope.parsedMsg = i18n("message.unobserved", {literalNumber: 2014, bindingValue: $scope.bindingValue, literalString: "!~~"})',
                observe: 'i18n("message.basic", {literalNumber: 2014, bindingValue: $scope.bindingValue, literalString: "!~~"}, $scope, "observedMsg");'
            }
        }
    });