angular.module('myApp.i18n.sample.vi', [])
    .constant('SAMPLE_VI', {
        sample: {
            literalString: 'Xin chào Anonymous!',
            withParameters: 'Xin chào {{name}}',
            referOtherCode: '&sample.withParameters'
        }
    });