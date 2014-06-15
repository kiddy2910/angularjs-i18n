angular.module('myApp.i18n.sample.en', [])
    .constant('SAMPLE_EN', {
        sample: {
            literalString: 'Hello Anonymous!',
            withParameters: 'Hello {{name}}',
            manyParameters: 'Hello {{name}}, are you from {{country}}?',
            referOtherCode: '&sample.withParameters'
        }
    });