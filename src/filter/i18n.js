/**
 * @ngdoc filter
 * @name duytran.i18n.filter:i18n
 *
 * @description
 * Localize your message via filter
 *
 * ### Use in HTML format ###
 * **{{ 'code' | i18n [: param1 : 'param2' : ...] }}**
 *
 * @param {string=} code A message code need to be parse. A parameter is enclosing by double bracket `{{ name }}`. Refer an other message by adding the prefix `&`
 * @param {*=} [params] An data object was replaced in message code by order
 *
 * @example
 * <example>
 *     <tag>{{ 'sample.withParameters' | i18n : data.user.name }}</tag>
 * </example>
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