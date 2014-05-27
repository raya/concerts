module.exports = function( grunt ) {
  grunt.loadNpmTasks('grunt-mocha-test');

  grunt.initConfig({
    mochaTest : {
      test : {
        options : {
          reporter : 'spec',
          require : ['spec/helpers/passport_stub.js', 'spec/helpers/spec_helper.js' ]
        },
        src : ['spec/*.js']
      },
      integration : {
         options : {
          reporter : 'spec',
          require : ['spec/helpers/passport_stub.js', 'spec/helpers/spec_helper.js' ],
          timeout : 10000
        },
        src : ['spec/integration/*.js']
      }
    }
  });

  grunt.registerTask('test', 'mochaTest:test');
  grunt.registerTask('test:client', 'mochaTest:integration');

};
