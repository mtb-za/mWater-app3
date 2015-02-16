gulp = require 'gulp'
del = require 'del'
fs = require 'fs'
exec = require('child_process').exec
sync = require 'synchronize'
_ = require 'lodash'
xml2js = require 'xml2js'

# Package name to use for all platforms
packageName = 'co.mwater.clientapp'

# App name
appName = "mWater"

# Hostname of web version
hostname = "app.mwater.co"

plugins = [
  'org.apache.cordova.device'
  'https://git-wip-us.apache.org/repos/asf/cordova-plugin-file.git'
  'https://git-wip-us.apache.org/repos/asf/cordova-plugin-file-transfer.git'
  'org.apache.cordova.device-orientation'
  'org.apache.cordova.network-information'
  'https://github.com/mWater/cordova-plugin-wezka-nativecamera.git'
  'https://github.com/mWater/OpenCVActivityPlugin.git'
  'https://github.com/mWater/cordova-plugin-acra.git'
  # InAppBrowser needed for social login
  'org.apache.cordova.inappbrowser'

  # Allow creating/listening to intents
  'https://github.com/Initsogar/cordova-webintent.git'

  # Bluetooth support
  'https://github.com/tanelih/phonegap-bluetooth-plugin'
]

# Runs a shell script, piping output to stdout. Returns a function that takes a callback
run = (cmd, options) ->
  return (cb) ->
    child = exec cmd, options, (error, stdout, stderr) -> cb(error)
    child.stdout.on 'data', (data) -> process.stdout.write(data)
    child.stderr.on 'data', (data) -> process.stderr.write(data)
    return

# Manipulates an xml file in place
alterXml = (filename, action, cb) ->
  parser = new xml2js.Parser()
  xmlin = fs.readFileSync(filename)
  parser.parseString xmlin, (err, result) ->
    if err 
     return cb(err)
    action(result)
    builder = new xml2js.Builder()
    xmlout = builder.buildObject(result)
    fs.writeFileSync(filename, xmlout)
    cb()

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

# Customize config file
gulp.task 'cordova_customize_config', (cb) ->
  alterXml("cordova/#{packageName}/config.xml", (config) ->
    console.log JSON.stringify(config, null, 2)
    config.widget.name = [appName]
  , cb)

# Gets files copied into cordova/ before 'cordova prepare' for release mode
gulp.task 'cordova_copy_release', gulp.series('cordova_copy_www', 'cordova_copy_config', 'cordova_customize_config')

# Gets files copied into cordova/ before 'cordova prepare' for debug mode
# Only difference is that updating is disabled
gulp.task 'cordova_copy_debug', gulp.series('cordova_copy_www', 'cordova_copy_config', 'cordova_customize_config', ->
  return gulp.src(['app/cordova/debug/**'])
    .pipe(gulp.dest("cordova/#{packageName}/www/"))
  )

gulp.task 'cordova_install_plugins', 
  gulp.series(_.map(plugins, (p) -> run("cordova plugin add #{p}", { cwd: "./cordova/#{packageName}" })))

gulp.task 'cordova_setup_keystore', (cb) ->
  fs.appendFile("cordova/#{packageName}/platforms/android/ant.properties", 
    '''\nkey.store=/home/clayton/.ssh/mwater.keystore\nkey.alias=mwater''', cb)

gulp.task 'cordova_setup_androidmanifest', (cb) ->
  alterXml("cordova/#{packageName}/platforms/android/AndroidManifest.xml", (data) ->
    console.log JSON.stringify(data, null, 2)

    # Add ACRA crash reporting
    data.manifest.application[0]["$"]["android:name"] = "co.mwater.acraplugin.MyApplication"

    # Make camera and bluetooth not required for Google Play
    data.manifest["uses-feature"].push(
      { "$": { "android:name": "android.hardware.camera", "android:required": "false" } })
    data.manifest["uses-feature"].push(
      { "$": { "android:name": "android.hardware.bluetooth", "android:required": "false" } })

    # Add intent-filter to launch native app from the web url
    mainActivity = _.find(data.manifest.application[0].activity, (a) -> a['intent-filter'])
    mainActivity['intent-filter'].push({
      action: [{ "$": {"android:name": "android.intent.action.VIEW"}}]
      category: [
        { "$": {"android:name": "android.intent.category.DEFAULT"}}
        { "$": {"android:name": "android.intent.category.BROWSABLE"}}
      ]
      data: [
        { "$": { "android:host": hostname, "android:scheme": "http"}}
        { "$": { "android:host": hostname, "android:scheme": "https"}}
      ]
      })
  , cb)

gulp.task 'cordova_setup', gulp.series([
  'cordova_clean'
  (cb) -> fs.mkdir('cordova', cb)
  run("cordova create cordova/#{packageName} #{packageName} mWater")
  'cordova_copy_release'
  run("cordova platform add android", { cwd: "./cordova/#{packageName}" })
  'cordova_install_plugins'
  'cordova_setup_androidmanifest'
  ])

# Debug cordova
gulp.task 'cordova_debug', gulp.series('cordova_copy_debug', run("cordova -d run", { cwd: "./cordova/#{packageName}" }))

