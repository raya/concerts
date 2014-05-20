module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-mocha-test');

  grunt.initConfig({
    // Configure a mochaTest task
    mochaTest: {
      test: {
        options: {
          reporter: 'spec',
          require: ['spec/helpers/passport_stub.js', 'spec/helpers/spec_helper.js' ]
        },
        src: ['spec/*.js']
      }
    }
  });

  grunt.registerTask('test', 'mochaTest');

};
