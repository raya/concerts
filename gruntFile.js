module.exports = function( grunt ) {

  grunt.loadNpmTasks('grunt-concurrent');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-env');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-nodemon');
  grunt.loadNpmTasks('grunt-sass');

  grunt.initConfig({
    concurrent: {
      dev: {
        tasks: ['nodemon:dev', 'watch'],
        options: {
          logConcurrentOutput: true
        }
      }
    },
    copy: {
      main: {
        src: 'bower_components/momentjs/min/moment.min.js',
        dest: 'app/public/js/'
      }
    },
    cssmin: {
      combine: {
        files: {
          'app/public/stylesheets/app.min.css': ['bower_components/pure/pure-min.css',
            'bower_components/pure/grids-responsive-min.css',
            'app/views/styles/css_spinner.css',
            'build/app.css' ]
        }
      }
    },
    env : {
      test : {
        NODE_ENV : 'test',
        PORT : 5001
      }
    },
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
    },
    nodemon: {
      dev: {
        script: 'app/app.js',
        env: {
          NODE_ENV : 'development',
          PORT: '5001'
        },
        ignore : [ '*.log', 'logs/concerts.log', '*.md' ]
      }
    },
    sass: {
      dist: {
        options: {
          outputStyle: 'nested'
        },
        files: {
          'build/app.css' : 'app/views/styles/app.scss'
        }
      }
    },
    watch: {
      styles: {
        files: ['app/views/styles/*'],
        tasks: ['sass:dist','cssmin:combine', 'copy:main' ],
        options: {
          spawn: false
        }
      }
    }
  });

  grunt.registerTask('start:dev', ['concurrent:dev']);
  grunt.registerTask('test', ['env:test', 'mochaTest:test']);
  grunt.registerTask('test:client', 'mochaTest:integration');
};
