
var browserify = require('./browserify-task');
var compileForms = require('./compile-forms-task');

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    browserify: {},
    concat: {
      libsjs: {
        // the files to concatenate
        src: ['vendor/jquery-1.9.1.min.js', 
              'vendor/lodash.compat.min.js', 
              'vendor/backbone.js', 
              'vendor/bootstrap/js/bootstrap.min.js', 
              'vendor/handlebars.runtime.js',
              'vendor/swag.js',
              'vendor/fastclick.js',
              'vendor/mobiscroll.custom-2.5.4.min.js',
              'vendor/jquery.scrollintoview.min.js',
              'vendor/overthrow.js',
              'vendor/leaflet/leaflet.js'],
        // the location of the resulting JS file
        dest: 'dist/js/libs.js'
      },
      libscss: {
        src: ['vendor/bootstrap/css/bootstrap.css',
              'vendor/*.css',
              'vendor/leaflet/leaflet.css'],
        dest: 'dist/css/libs.css'
      },
      css: {
          src: ['app/css/*.css'],
          dest: 'dist/css/app.css'
      }
    },
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      dist: {
        src: 'dist/js/libs.js',
        dest: 'dist/js/libs.min.js'
      }
    },
    handlebars: {
      compile: {
      options: {
        namespace: "templates",
        wrapped: true,
        processName: function(filename) {
          var name = filename.substr('app/templates/'.length);    // cwd doesn't work
          name = name.substr(0, name.length-4);
          return name;
        }
      },
      files: {
        "dist/js/templates.js": ["app/templates/**/*.hbs"] }
      }
    },
    copy: {
      apphtml: {
        expand: true,
        cwd: 'app/html/',
        src: '*',
        dest: 'dist/'
      },
      appimages: {
        expand: true,
        cwd: 'app/img/',
        src: '*',
        dest: 'dist/img/',
      },
      libimages: {
        expand: true,
        cwd: 'vendor/bootstrap/img/',
        src: '*',
        dest: 'dist/img/',
      },
      leafletimages: {
        expand: true,
        cwd: 'vendor/leaflet/images/',
        src: '*',
        dest: 'dist/img/leaflet/',
      }
    },
   manifest: {
      generate: {
        options: {
          basePath: 'dist/',
          network: ['*'],
          preferOnline: true,
          verbose: true,
          timestamp: true
        },
        src: [
          '*.html',
          'js/*.js',
          'css/*.css',
          'img/**/*.png'
        ],
        dest: 'dist/manifest.appcache'
      }
    },
    shell: {
     deploy: {
      command: 's3cmd sync --acl-public --guess-mime-type * s3://demo.mwater.co',
      options: {
          stdout: true,
          execOptions: {
              cwd: 'dist'
          }
      }
    },
   },
   watch: {
      scripts: {
        files: ['app/**/*.*'],
        tasks: ['default'],
      },
      forms: {
        files: ['forms/**/*.*'],
        tasks: ['compile-forms']
      }
    }
  });

  grunt.registerTask('browserify', 'Make single file output', browserify);
  grunt.registerTask('compile-forms', 'Make forms into js', compileForms);
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-handlebars');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-manifest');
  grunt.loadNpmTasks('grunt-shell');

  // Default task(s).
  grunt.registerTask('default', ['browserify', 'concat', 'copy', 'handlebars', 'manifest', 'compile-forms']);
  grunt.registerTask('deploy', ['default', 'shell:deploy']);
};