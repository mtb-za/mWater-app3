browserify = require 'browserify'
gulp = require 'gulp'
source = require 'vinyl-source-stream'
rework = require 'gulp-rework'
reworkNpm = require 'rework-npm'
concat = require 'gulp-concat'
size = require 'gulp-size'
gzip = require 'gulp-gzip'
uglify = require 'gulp-uglify'
makeBuffer = require 'gulp-buffer'
awspublish = require 'gulp-awspublish'
fs = require 'fs'
clean = require 'gulp-clean'
glob = require 'glob'
gutil = require 'gulp-util'

#gulp.task 'build', ['browserify', 'indexcss', 'libscss', 'libsjs', 'copy']
#gulp.task 'default', ['build']

# gulp.task 'watch', ->
#   return gulp.watch ['src/**/*', 'assets/**/*'], ['build']

# gulp.task 'deploy', ['build'], ->
#   # Read credentials
#   aws = JSON.parse(fs.readFileSync("/home/clayton/.ssh/aws-credentials.json"))
#   aws.bucket = "portal.mwater.co"

#   publisher = awspublish.create(aws)
#   headers = {
#     'Cache-Control': 'no-cache, must-revalidate'
#     'Pragma': 'no-cache'
#     'Expires': '0'
#   }
  
#   return gulp.src('./dist/**/*.*')
#     .pipe(awspublish.gzip())
#     .pipe(publisher.publish(headers))
#     .pipe(publisher.cache())
#     .pipe(publisher.sync())    
#     .pipe(awspublish.reporter())

gulp.task 'prepareTests', ['libsjs'], ->
  files = glob.sync("./test/**/*Tests.coffee")
  bundler = shim(browserify({ entries: files, extensions: [".js", ".coffee"] }))
  bundler.require("./app/js/forms/index.coffee", { expose: "forms"})

  return bundler.bundle()
    .pipe(source('browserified.js'))
    .pipe(gulp.dest('./test'))

# gulp.task 'browserify', ->
#   return shim(browserify('./index.coffee', { extensions: ['.coffee'], basedir: './src/' }))
#     .bundle()
#     .on('error', gutil.log)
#     .pipe(source('index.js'))
#     .pipe(gulp.dest('./dist/js/'))

# gulp.task 'clean', ->
#   return gulp.src('dist/**/*', {read: false})
#     .pipe(clean())

# gulp.task 'indexcss', ->
#   return gulp.src('src/index.css')
#     .pipe(rework(reworkNpm()))
#     .pipe(gulp.dest('./dist/css/'))

# gulp.task 'libscss', ->
#   return gulp.src([
#     "bower_components/bootstrap/dist/css/bootstrap.css",
#     "bower_components/bootstrap/dist/css/bootstrap-theme.css",
#     "bower_components/select2/select2.css",
#     "bower_components/select2-bootstrap3-css/select2-bootstrap.css",
#     "bower_components/leaflet/leaflet.css",
#     "bower_components/bootstrap-daterangepicker/daterangepicker-bs3.css",
#     "bower_components/datatables-plugins/integration/bootstrap/3/dataTables.bootstrap.css"
#     ])
#     .pipe(concat('libs.css'))
#     .pipe(gulp.dest('dist/css/'))

gulp.task 'libsjs', ->
  return gulp.src([
    'bower_components/jquery/dist/jquery.min.js' 
    'bower_components/lodash/dist/lodash.min.js' 
    'bower_components/backbone/backbone.js' 
    'vendor/bootstrap/js/bootstrap.min.js'  # Custom bootstrap with larger fonts
    'bower_components/handlebars/handlebars.runtime.min.js'
    'bower_components/swag/lib/swag.min.js'
    'bower_components/overthrow-dist/overthrow.js'
    'vendor/mobiscroll.custom-2.5.4.min.js'
    'vendor/jquery.scrollintoview.min.js'
    'vendor/leaflet/leaflet-src.js'
    ])
    .pipe(concat('libs.js'))
    .pipe(gulp.dest('dist/js/'))

# gulp.task 'copy', ['copy_fonts', 'copy_select2_images', 'copy_datatable_images', 'copy_leaflet_images', 'copy_assets']

# gulp.task 'copy_assets', ->
#   return gulp.src("assets/**/*")
#     .pipe(gulp.dest('dist/'))

# gulp.task 'copy_fonts', ->
#   return gulp.src("bower_components/bootstrap/dist/fonts/*")
#     .pipe(gulp.dest('dist/fonts/'))

# gulp.task 'copy_select2_images', ->
#   return gulp.src([
#     "bower_components/select2/*.png"
#     "bower_components/select2/*.gif"])
#     .pipe(gulp.dest('dist/css/'))

# gulp.task 'copy_datatable_images', ->
#   return gulp.src("bower_components/datatables/media/images/*")
#     .pipe(gulp.dest('dist/images/'))

# gulp.task 'copy_leaflet_images', ->
#   return gulp.src("bower_components/leaflet/images/*")
#   .pipe(gulp.dest('dist/images/'))

# Shim non-browserify friendly libraries to allow them to be 'require'd
shim = (instance) ->
  shims = {
    jquery: './app/js/jquery-shim'
    lodash: './app/js/lodash-shim'
    underscore: './app/js/lodash-shim'
    backbone: './app/js/backbone-shim' 
  }

  # Add shims
  for name, path of shims
    instance.require(path, {expose: name})

  return instance
