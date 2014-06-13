/**
 * Format: {{ 'code' | i18n: p1: 'p2': ...: 'pn' }}
 *
 *  code: message code in international message files.
 *      Code must be wrapped in single or double quotes.
 *      Code can include parameters with format: {{name}}.
 *
 *  pn: parameters in code.
 *      If pn in quotes, it's constant.
 *      If pn without quotes, its data got from [scope] variable of directive.
 *
 *  Example:
 *      <input placeholder="{{ 'greetings.hello' | i18n: name: 'LOCALIZE' }}">
 */
angular.module('duytran.i18n.filter', [])
    .filter('i18n', function(i18n) {
        return function(input) {
            var args = [];
            if(arguments != null) {
                for(var i=1; i<arguments.length; i++) {
                    args.push(arguments[i]);
                }
            }
            return i18n.translate(input, args, true);
        };
    });