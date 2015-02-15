gulp = require 'gulp'
browserify = require 'browserify'
del = require 'del'
source = require 'vinyl-source-stream'
rework = require 'gulp-rework'
reworkNpm = require 'rework-npm'
concat = require 'gulp-concat'
uglify = require 'gulp-uglify'
makeBuffer = require 'gulp-buffer'
awspublish = require 'gulp-awspublish'
fs = require 'fs'
glob = require 'glob'
gutil = require 'gulp-util'
manifest = require 'gulp-manifest'
rename = require 'gulp-rename'
JsonClient = require('request-json').JsonClient
replace = require 'gulp-replace'
merge = require 'merge-stream'
exec = require('child_process').exec

gulp.task 'default', ['build']

# Setup cordova

# Debug cordova
gulp.task 'debug_cordova', ['copy_cordova_debug'], (cb) ->
  child = exec "cordova -d run", { cwd: "./cordova" }, (error, stdout, stderr) -> cb(error)
  child.stdout.on 'data', (data) -> process.stdout.write(data)
  child.stderr.on 'data', (data) -> process.stderr.write(data)
  return

# Builds the web app
gulp.task 'build', ['browserify', 'appcss', 'libscss', 'libsjs', 'copy', 'seeds'], ->
  return gulp.src(['dist/**'])
    .pipe(manifest({
      hash: true
      timestamp: false
      preferOnline: true
      network: ['*']
      filename: 'manifest.appcache'
      exclude: 'manifest.appcache'
     }))
    .pipe(gulp.dest('dist/'))

gulp.task 'watch', ->
  return gulp.watch ['app/**'], ['default']

# Gets files copied into cordova/ before 'cordova prepare' for release mode
gulp.task 'copy_cordova_release', ['cordova_copy_www', 'cordova_copy_config']

# Gets files copied into cordova/ before 'cordova prepare' for debug mode
# Only difference is that updating is disabled
gulp.task 'copy_cordova_debug', ['cordova_copy_www', 'cordova_copy_config'], ->
  return gulp.src(['app/cordova/debug/**'])
    .pipe(gulp.dest('cordova/www/'))

gulp.task 'cordova_copy_www', ['build'], ->
  return gulp.src([
    "dist/**"])
    .pipe(gulp.dest('cordova/www/'))

gulp.task 'cordova_copy_config', ->
  return gulp.src(["app/cordova/config.xml"])
    .pipe(gulp.dest('cordova/'))

gulp.task 'deploy', ['deploy_app_mwater_co', 'deploy_app_mwater_org']

gulp.task 'deploy_app_mwater_co', -> deployS3('app.mwater.co')
gulp.task 'deploy_app_mwater_org', -> deployS3('app.mwater.org')
gulp.task 'deploy_beta_mwater_co', -> deployS3('beta.mwater.co')
gulp.task 'deploy_demo_mwater_co', -> deployS3('demo.mwater.co')
gulp.task 'deploy_map_mwater_co', -> deployS3('map.mwater.co')
gulp.task 'deploy_map_mwater_org', -> deployS3('map.mwater.org')

deployS3 = (bucket) ->
  # Read credentials
  aws = JSON.parse(fs.readFileSync("/home/clayton/.ssh/aws-credentials.json"))
  aws.bucket = bucket

  publisher = awspublish.create(aws)
  
  # Publish all but manifest
  headers = { 'Cache-Control': 'no-cache, must-revalidate' }
  
  stream1 = gulp.src(['./dist/**', '!./dist/manifest.appcache'])
    .pipe(awspublish.gzip())
    .pipe(publisher.publish(headers))
    .pipe(publisher.cache())
    .pipe(awspublish.reporter())

  # Publish manifest, which requires no-store for some browsers (older iPhone and Galaxy S3 at least)
  manifestHeaders = { 'Cache-Control': 'no-cache, no-store, must-revalidate' }

  stream2 = gulp.src('./dist/manifest.appcache')
    .pipe(awspublish.gzip())
    .pipe(publisher.publish(manifestHeaders))
    .pipe(awspublish.reporter())

  return merge(stream1, stream2)

gulp.task 'prepareTests', ['libsjs'], ->
  files = glob.sync("./test/**/*Tests.coffee")
  bundler = shim(browserify({ entries: files, extensions: [".js", ".coffee"] }))
  bundler.require("./app/js/forms/index.coffee", { expose: "forms"})

  return bundler.bundle()
    .pipe(source('browserified.js'))
    .pipe(gulp.dest('./test'))

gulp.task 'browserify', ['browserify_index', 'browserify_preload']

gulp.task 'browserify_index', ->
  return shim(browserify([], { extensions: ['.js', '.coffee'] }))
    .require('./app/js/run.coffee', {expose: 'run'})
    .require('./app/js/forms/index.coffee', {expose: 'forms'})
    .transform(require('./versionXform'))
    .bundle()
    .on('error', gutil.log)
    .on('error', -> throw "Failed")
    .pipe(source('app.js'))
    .pipe(gulp.dest('./dist/js/'))

gulp.task 'browserify_preload', ->
  return browserify(['./app/js/preload.coffee'], { extensions: ['.js', '.coffee'] })
    .bundle()
    .on('error', gutil.log)
    .on('error', -> throw "Failed")
    .pipe(source('preload.js'))
    .pipe(gulp.dest('./dist/js/'))

gulp.task 'clean', (cb) ->
  del(['dist/**', '!dist/js/.gitkeep'], cb)

gulp.task 'libscss', ->
  return gulp.src([
    'vendor/bootstrap/css/bootstrap.min.css'
    'vendor/mobiscroll.custom-2.5.4.min.css'  # To remove when old forms DateQuestion is gone
    'vendor/esri/esri-leaflet-geocoder.css'
    "bower_components/css-social-buttons/css/zocial.css"
    'vendor/leaflet/leaflet.css'    
    ])
    .pipe(concat('libs.css'))
    .pipe(gulp.dest('dist/css/'))

gulp.task 'libsjs', ->
  return gulp.src([
    'bower_components/jquery/dist/jquery.js' 
    'bower_components/lodash/dist/lodash.js' 
    'bower_components/backbone/backbone.js' 
    'vendor/bootstrap/js/bootstrap.js'  # Custom bootstrap with larger fonts
    'bower_components/handlebars/handlebars.runtime.js'
    'bower_components/swag/lib/swag.js'
    'bower_components/overthrow-dist/overthrow.js'
    'vendor/mobiscroll.custom-2.5.4.min.js' # To remove when old forms DateQuestion is gone
    'vendor/jquery.scrollintoview.min.js'
    'vendor/leaflet/leaflet-src.js'
    'vendor/esri/esri-leaflet-core.js'
    'vendor/esri/esri-leaflet-geocoder.js'
    ])
    .pipe(concat('libs.js'))
    .pipe(uglify())
    .pipe(gulp.dest('dist/js/'))

gulp.task 'appcss', ->
  return gulp.src('app/css/index.css')
    .pipe(rework(reworkNpm()))
    .pipe(rename("app.css"))
    .pipe(gulp.dest('./dist/css/'))

gulp.task 'copy', ['copy_html', 'copy_app_images', 'copy_bootstrap_fonts', 'copy_leaflet_images', 'copy_social_fonts', 'copy_esri_images']

gulp.task 'copy_html', ->
  return gulp.src("app/html/*")
    .pipe(replace("timestamp", new Date().getTime() + ""))
    .pipe(gulp.dest('dist/'))

gulp.task 'copy_app_images', ->
  return gulp.src("app/img/*")
    .pipe(gulp.dest('dist/img/'))

gulp.task 'copy_bootstrap_fonts', ->
  return gulp.src("vendor/bootstrap/fonts/*")
    .pipe(gulp.dest('dist/fonts/'))

gulp.task 'copy_leaflet_images', ->
  return gulp.src("vendor/leaflet/images/*")
  .pipe(gulp.dest('dist/img/leaflet/'))

gulp.task 'copy_social_fonts', ->
  return gulp.src([
    "bower_components/css-social-buttons/css/zocial-regular*.*"])
    .pipe(gulp.dest('dist/css/'))

gulp.task 'copy_esri_images', ->
  return gulp.src("vendor/esri/img/*")
  .pipe(gulp.dest('dist/css/img/'))

gulp.task 'seeds', (cb) ->
  # Query database for rows
  seeds = {}

  jsonClient = new JsonClient("https://api.mwater.co/v3/")

  # Only get tests
  jsonClient.get 'forms?selector={"type": "WaterTest"}', (err, res, body) ->
    if res.statusCode != 200
      return cb(new Error("Server error"))

    seeds.forms = body
    
    fs.writeFileSync('dist/js/seeds.js', 'seeds=' + JSON.stringify(seeds) + ';')
    cb()
  return

# Shim non-browserify friendly libraries to allow them to be 'require'd
shim = (instance) ->
  shims = {
    jquery: './app/js/jquery-shim'
    lodash: './app/js/lodash-shim'
    underscore: './app/js/underscore-shim'
    backbone: './app/js/backbone-shim' 
  }

  # Add shims
  for name, path of shims
    instance.require(path, {expose: name})

  return instance
