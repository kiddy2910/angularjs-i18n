/**
 *  Format:
 *      <i18n code="msgCode" params="{ pn1: pv1, pn2: pv2, ... }" attr="attributeName" raw="true"></i18n>
 *      <ANY i18n code="msgCode" params="{ pn1: pv1, pn2: pv2, ... }" attr="attributeName" raw="false"></ANY>
 *
 *  msgCode: message code in international message files.
 *      Code can include parameters with format: {{name}}.
 *
 *  pn: parameter name.
 *  pv: value of parameter.
 *      If pv in quotes, it's constant.
 *      If pv without quotes, its data got from [scope.$parent] variable of directive.
 *
 *  attributeName: (just only) name of attribute you want to insert into element.
 *
 *  raw: true if message will be rendered as html. Otherwise false (default).
 *
 *  Example:
 *      <h2 i18n code="greetings.hello"></h2>
 *      <h2 i18n code="greetings.hello" params="{name: name, app: 'LOCALIZE'}"></h2>
 *      <input i18n code="greetings.hello" params="{name: name, app: 'LOCALIZE'}" attr="placeholder">
 */
angular.module('duytran.i18n.directive', [])
    .directive('i18n', function($parse, i18n, i18nConstants) {
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

                    scope.$on(i18nConstants.EVENT_LANGUAGE_CHANGED, function() {
                        render(scope);
                    });
                };
            }
        };
    });
