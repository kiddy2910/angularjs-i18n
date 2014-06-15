/**
 * @ngdoc directive
 * @name duytran.i18n.directive:i18n
 * @requires $parse
 * @restrict A
 *
 * @description
 * Localize your message via directive
 *
 * @param {string=} code A message code need to be parse. A parameter is enclosing by double bracket `{{ name }}`. Refer an other message by adding the prefix `&`
 * @param {Object=} [params] An data object was replaced in message code
 * @param {string=} [attr] Message was parsed in this (or created if non-exist)
 * @param {string=} [raw] Accept `true | false`, useful in rendering a message which contains HTML tags. Default `false`
 *
 * @example
 * <example>
 *     <tag i18n code="sample.literalString"></tag>
 *     <tag i18n code="sample.withParameters" params="{ name: 'Duy Tran' }"></tag>
 *     <tag i18n code="sample.literalString" attr="placeholder"></tag>
 *     <tag i18n code="sample.literalString" raw="true"></tag>
 * </example>
 */
angular.module('duytran.i18n.directive', [])
    .directive('i18n', function($parse, i18n, $i18nConstant) {
        return {
            restrict: 'A',
            scope: true,
            compile: function(element, attrs) {
                var code = attrs.code,
                    params = attrs.params,
                    attr = attrs.attr,
                    raw = attrs.raw;

                function evaluate(scope) {
                    var parameters = null;
                    if( params != null ) {
                        parameters = $parse(params)(scope);
                    }
                    return i18n.translate(code, parameters);
                }

                function render(scope) {
                    var msg = evaluate(scope, code, params);
                    if(attr != null) {
                        element.attr(attr, msg);
                    } else {
                        if(raw) {
                            element.html(msg);
                        } else {
                            element.text(msg);
                        }
                    }
                }

                return function(scope) {
                    render(scope);

                    scope.$on($i18nConstant.EVENT_LANGUAGE_CHANGED, function() {
                        render(scope);
                    });
                };
            }
        };
    });
