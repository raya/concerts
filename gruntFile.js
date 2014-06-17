module.exports = function( grunt ) {

  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    clean: ['build/*', 'public/js/app.min.js', 'public/stylesheets/app.min.css'],
    concurrent: {
      dev: {
        tasks: ['nodemon:dev', 'watch'],
        options: {
          logConcurrentOutput: true
        }
      }
    },
    copy: {
      css: {
        files :
          [
            { src : 'build/app.min.css',
              dest : 'public/stylesheets/app.min.css'}
          ]
      }
    },
    cssmin: {
      combine: {
        files: {
          'build/app.min.css': ['bower_components/pure/pure-min.css',
            'bower_components/pure/grids-responsive-min.css',
            'views/styles/css_spinner.css',
            'build/app_sass.css' ]
        }
      }
    },
    env : {
      test : {
        NODE_ENV : 'test',
        PORT : 5001
      },
      dev : {
        NODE_ENV : 'development',
        PORT : 5000
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
        script: 'app.js',
        ignore : [ '*.log', 'logs/concerts.log', '*.md', 'node_modules/**' ]
      }
    },
    sass: {
      dist: {
        options: {
          outputStyle: 'nested'
        },
        files: {
          'build/app_sass.css' : 'views/styles/app.scss'
        }
      }
    },
    shell: {
      compileTemplates: {
        command: './node_modules/templatizer/bin/cli -d views/client_templates -o build/templates.js'
      }
    },
    uglify: {
      prod: {
        options : {
          compress:true,
          mangle: true
        },
        files: {
          'public/js/app.min.js': [
            'bower_components/momentjs/min/moment.min.js',
            'build/templates.js',
            'public/js/app.js' ]
        }
      },
      dev: {
        options : {
          compress : false,
          mangle : false
        },
        files : {
          'public/js/app.min.js' : [
            'bower_components/momentjs/min/moment.min.js',
            'build/templates.js',
            'public/js/app.js' ]
        }
      }
    },
    watch: {
      code: {
        files: ['views/styles/*', 'public/js/app.js'],
        tasks: 'build',
        options: {
          spawn: false
        }
      }
    }
  });

  grunt.registerTask('build', [ 'clean', 'sass:dist', 'cssmin:combine', 'copy:css',
    'shell:compileTemplates', 'uglify:dev' ]);
  grunt.registerTask('build:prod', [ 'build', 'uglify:prod']);
  grunt.registerTask('start', ['env:dev', 'concurrent:dev']);
  grunt.registerTask('test', ['env:test', 'mochaTest:test']);
  grunt.registerTask('test:client', 'mochaTest:integration');
};
