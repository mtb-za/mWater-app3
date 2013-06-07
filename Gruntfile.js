var browserify = require('./browserify-task');

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    browserify: {},
    concat: {
      libsjs: {
        // the files to concatenate
        src: ['vendor/jquery-1.9.1.min.js', 
              'vendor/underscore-min.js', 
              'vendor/backbone.js', 
              'vendor/bootstrap/js/bootstrap.min.js', 
              'vendor/handlebars.runtime.js',
              'vendor/fastclick.js',
              'vendor/mobiscroll.custom-2.5.4.min.js',
              'vendor/jquery.scrollintoview.min.js',
              'vendor/overthrow.js'],
        // the location of the resulting JS file
        dest: 'dist/js/libs.js'
      },
      libscss: {
        src: ['vendor/bootstrap/css/bootstrap.css',
              'vendor/*.css'],
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
      }
    },
   manifest: {
      generate: {
        options: {
          basePath: 'dist/',
          network: ['http://*', 'https://*'],
          preferOnline: true,
          verbose: true,
          timestamp: true
        },
        src: [
          '*.html',
            'js/*.js',
            'css/*.css',
            'img/*'
        ],
        dest: 'dist/manifest.appcache'
      }
    },
   watch: {
      scripts: {
        files: ['app/**/*.*'],
        tasks: ['default'],
      }
    }
  });

  grunt.registerTask('browserify', 'Make single file output', browserify);
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-handlebars');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-manifest');

  // Default task(s).
  grunt.registerTask('default', ['browserify', 'concat', 'copy', 'handlebars', 'manifest']);
};