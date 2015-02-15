gulp = require 'gulp'
del = require 'del'
exec = require('child_process').exec
sync = require 'synchronize'

packageName = 'co.mwater.clientapp'

# Setup cordova
# gulp.task 'setup_cordova', (cb) ->
#   sync.fiber ->
#     # Delete cordova directory
#     sync.await(del('cordova', sync.defer()))


#   # Delete existing
#   cmds = [
#   ]


# Create cordova project
gulp.task 'cordova_create', ['cordova_clean'], (cb) -> 
  runCommand("cordova create #{packageName} mWater", cb)

gulp.task 'cordova_setup', ['cordova_create', 'build'], (cb) ->

#gulp.task 'cordova_initial_copy', ['']

gulp.task 'cordova_add_platforms', ['cordova_initial_copy'], (cb) ->
  runCommand("cordova platform add android", { cwd: "./cordova" }, cb)

gulp.task 'cordova_install_plugins', ['cordova_setup']

#cordova create cordova co.mwater.clientapp mWater
# cp app/cordova/config.xml cordova
# cp app/img/icon.png cordova
# cd cordova
# cordova platform add android
# cordova plugin add org.apache.cordova.device
# cordova plugin add https://git-wip-us.apache.org/repos/asf/cordova-plugin-file.git
# cordova plugin add https://git-wip-us.apache.org/repos/asf/cordova-plugin-file-transfer.git
# cordova plugin add org.apache.cordova.device-orientation
# cordova plugin add org.apache.cordova.network-information
# cordova plugin add https://github.com/mWater/cordova-plugin-wezka-nativecamera.git
# cordova plugin add https://github.com/mWater/OpenCVActivityPlugin.git
# cordova plugin add https://github.com/mWater/cordova-plugin-acra.git
# cordova plugin add org.apache.cordova.inappbrowser

# # Webintent plugin
# cordova plugin add https://github.com/Initsogar/cordova-webintent.git

# # Bluetooth plugin
# cordova plugin add https://github.com/tanelih/phonegap-bluetooth-plugin



# Remove cordova folder
gulp.task 'cordova_clean', (cb) -> del('cordova', cb)

# Debug cordova
gulp.task 'cordova_debug', ['cordova_copy_debug'], (cb) ->
  runCommand("cordova -d run", { cwd: "./cordova" }, cb)

# Gets files copied into cordova/ before 'cordova prepare' for release mode
gulp.task 'cordova_copy_release', ['cordova_copy_www', 'cordova_copy_config']

# Gets files copied into cordova/ before 'cordova prepare' for debug mode
# Only difference is that updating is disabled
gulp.task 'cordova_copy_debug', ['cordova_copy_www', 'cordova_copy_config'], ->
  return gulp.src(['app/cordova/debug/**'])
    .pipe(gulp.dest('cordova/www/'))

gulp.task 'cordova_copy_www', ['build'], ->
  return gulp.src([
    "dist/**"])
    .pipe(gulp.dest('cordova/www/'))

gulp.task 'cordova_copy_config', ->
  return gulp.src(["app/cordova/config.xml"])
    .pipe(gulp.dest('cordova/'))


# Runs a shell script, piping output to stdout
runCommand = (cmd, options, cb) ->
  child = exec cmd, options, (error, stdout, stderr) -> cb(error)
  child.stdout.on 'data', (data) -> process.stdout.write(data)
  child.stderr.on 'data', (data) -> process.stderr.write(data)
  return
