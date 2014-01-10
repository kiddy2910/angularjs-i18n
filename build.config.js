
module.exports = {
    build_dir: 'build',
    compile_dir: 'bin',

    src_files: {
        js: [
            'lib/i18n.js',
            'lib/i18n-constants.js',
            'lib/i18n-locale-container.js',
            'lib/i18n-log-util.js'
        ],

        less: []
    },

    external_files: {
        js: [ 'lib/i18n-adapter.js' ]
    }
};
