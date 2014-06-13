angular.module('myApp.i18n.sample.en', [])
    .constant('SAMPLE_EN', {
        sample: {
            literalString: 'Hello Anonymous!',
            withParameters: 'Hello {{name}}',
            referOtherCode: '&sample.withParameters'
        }
    });