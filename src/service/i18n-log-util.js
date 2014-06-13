angular.module('duytran.i18n.logUtil', [])
    .provider('i18nLogUtil', function() {
        var isDebug = false;
        var mode = {
            DEBUG: 'DEBUG',
            ERROR: 'ERROR',
            WARNING: 'WARNING'
        };

        return {
            setDebugMode: function(enableDebugging) {
                isDebug = enableDebugging === true;
            },

            $get: function($log) {

                function log(debugMode, msg) {
                    if(!isDebug) {
                        return;
                    }

                    switch(debugMode) {
                        case mode.DEBUG:
                            $log.debug(msg);
                            break;

                        case mode.ERROR:
                            $log.error(msg);
                            break;

                        case mode.WARNING:
                            $log.warn(msg);
                            break;
                    }
                }

                return {
                    debug: function(msg) {
                        log(mode.DEBUG, msg);
                    },

                    error: function(msg) {
                        log(mode.ERROR, msg);
                    },

                    warning: function(msg) {
                        log(mode.WARNING, msg);
                    }
                };
            }
        };
    });