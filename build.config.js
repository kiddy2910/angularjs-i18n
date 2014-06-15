
module.exports = {
    build_dir: 'build',
    compile_dir: 'bin',

    src_files: {
        js: [
            'src/service/*.js',
            'src/directive/*.js',
            'src/filter/*.js'
        ],

        less: []
    },

    external_files: {
        js: [ 'src/i18n-adapter.js' ]
    }
};
