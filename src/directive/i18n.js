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
 * @param {Object=} [params] An object, an array of values or only value
 * @param {string=} [attr] Message was parsed in this (or created if non-exist)
 * @param {string=} [raw] Accept `true | false`, useful in rendering a message which contains HTML tags. Default `false`
 *
 * @example
 * <example>
 *     <tag i18n code="sample.literalString"></tag>
 *     <tag i18n code="sample.withParameters" params="data.user.name"></tag>
 *     <tag i18n code="sample.withParameters" params=" 'Duy Tran' "></tag>
 *     <tag i18n code="sample.manyParameters" params="{ name: 'Duy Tran', country: data.user.country }"></tag>
 *     <tag i18n code="sample.manyParameters" params="[ 'Duy Tran', data.user.country ]"></tag>
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
                    raw = attrs.raw,
                    commaToken = ',',
                    bracketStartToken = '[',
                    parenthesisToken = '{';

                function evaluate(scope) {
                    var parameters = null, trimmedParamString, partialParams;

                    if( params != null ) {
                        trimmedParamString = trim(params);

                        if( trimmedParamString.indexOf(bracketStartToken) === 0 ) {
                            // parameters will be an array
                            parameters = [];
                            partialParams = params.replace(/[\[\]]/gm, '').split(commaToken);
                            for( var i=0; i<partialParams.length; i++ ) {
                                parameters.push($parse(trim(partialParams[i]))(scope));
                            }

                        } else if( trimmedParamString.indexOf(parenthesisToken) === 0 ) {
                            // parameters will be an object
                            parameters = $parse(trimmedParamString)(scope);
                        } else {
                            // parameters will be an array
                            parameters = [ $parse(trimmedParamString)(scope) ];
                        }
                    }
                    return i18n(code, parameters);
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

                function trim(str) {
                    return str.replace(/^\s+|\s+$/gm,'');
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
