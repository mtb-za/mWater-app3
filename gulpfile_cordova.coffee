gulp = require 'gulp'
del = require 'del'
fs = require 'fs'
exec = require('child_process').exec
sync = require 'synchronize'
_ = require 'lodash'

packageName = 'co.mwater.clientapp'

plugins = [
  'org.apache.cordova.device'
  'https://git-wip-us.apache.org/repos/asf/cordova-plugin-file.git'
  'https://git-wip-us.apache.org/repos/asf/cordova-plugin-file-transfer.git'
  'org.apache.cordova.device-orientation'
  'org.apache.cordova.network-information'
  'https://github.com/mWater/cordova-plugin-wezka-nativecamera.git'
  'https://github.com/mWater/OpenCVActivityPlugin.git'
  'https://github.com/mWater/cordova-plugin-acra.git'
  'org.apache.cordova.inappbrowser'
  'https://github.com/Initsogar/cordova-webintent.git'
  'https://github.com/tanelih/phonegap-bluetooth-plugin'
]

# Runs a shell script, piping output to stdout. Returns a function that takes a callback
run = (cmd, options) ->
  return (cb) ->
    child = exec cmd, options, (error, stdout, stderr) -> cb(error)
    child.stdout.on 'data', (data) -> process.stdout.write(data)
    child.stderr.on 'data', (data) -> process.stderr.write(data)
    return

# Remove cordova folder
gulp.task 'cordova_clean', (cb) -> del('cordova', cb)

gulp.task 'cordova_copy_www', gulp.series('build', ->
  return gulp.src([
    "dist/**"])
    .pipe(gulp.dest("cordova/#{packageName}/www/"))
  )

gulp.task 'cordova_copy_config', ->
  return gulp.src(["app/cordova/config.xml"])
    .pipe(gulp.dest("cordova/#{packageName}/"))

# Gets files copied into cordova/ before 'cordova prepare' for release mode
gulp.task 'cordova_copy_release', gulp.parallel('cordova_copy_www', 'cordova_copy_config')

# Gets files copied into cordova/ before 'cordova prepare' for debug mode
# Only difference is that updating is disabled
gulp.task 'cordova_copy_debug', gulp.series('cordova_copy_www', 'cordova_copy_config', ->
  return gulp.src(['app/cordova/debug/**'])
    .pipe(gulp.dest("cordova/#{packageName}/www/"))
  )

gulp.task 'cordova_install_plugins', 
  gulp.series(_.map(plugins, (p) -> run("cordova plugin add #{p}", { cwd: "./cordova/#{packageName}" })))

gulp.task 'cordova_setup', gulp.series([
  'cordova_clean'
  (cb) -> fs.mkdir('cordova', cb)
  run("cordova create cordova/#{packageName} #{packageName} mWater")
  'cordova_copy_release'
  run("cordova platform add android", { cwd: "./cordova/#{packageName}" })
  'cordova_install_plugins'
  ])

# Debug cordova
gulp.task 'cordova_debug', gulp.series('cordova_copy_debug', run("cordova -d run", { cwd: "./cordova/#{packageName}" }))

