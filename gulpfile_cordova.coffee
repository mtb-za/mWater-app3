gulp = require 'gulp'
del = require 'del'
fs = require 'fs'
exec = require('child_process').exec
sync = require 'synchronize'
_ = require 'lodash'
xml2js = require 'xml2js'

# Get arguments
argv = require('minimist')(process.argv.slice(1))

# Load configuration
configName = argv.config or "default"
config = require "./configs/#{configName}/config.json"

plugins = [
  'org.apache.cordova.device'
  'org.apache.cordova.file'
  'org.apache.cordova.file-transfer'
  'org.apache.cordova.device-orientation'
  'org.apache.cordova.network-information'

  # Replacement for camera plugin
  'https://github.com/mWater/cordova-plugin-wezka-nativecamera.git'

  # Open CV activity
  'https://github.com/mWater/OpenCVActivityPlugin.git'

  # Android crash reporting
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

    # Make into string and write to disk
    builder = new xml2js.Builder()
    xmlout = builder.buildObject(result)
    fs.writeFileSync(filename, xmlout)
    cb()

# Remove cordova folder
gulp.task 'cordova_clean', (cb) -> del('cordova', cb)

gulp.task 'cordova_copy_www', gulp.series('build', ->
  return gulp.src([
    "dist/**"])
    .pipe(gulp.dest("cordova/#{config.package}/www/"))
  )

gulp.task 'cordova_copy_config', ->
  return gulp.src(["app/cordova/config.xml"])
    .pipe(gulp.dest("cordova/#{config.package}/"))

# Customize config file
gulp.task 'cordova_customize_config', (cb) ->
  alterXml("cordova/#{config.package}/config.xml", (data) ->
    console.log JSON.stringify(data, null, 2)

    # Set app name
    data.widget.name = [config.title]

    # Sets the version in the config.xml file to match current version
    packageJson = require('./package.json')
    data.widget["$"].version = packageJson.version
  , cb)

# Customize www directory with config-specific files
gulp.task 'cordova_customize_www', ->
  gulp.src(["configs/#{configName}/www/**"])
    .pipe(gulp.dest("cordova/#{config.package}/www/"))

# Customize logo and splash screen
gulp.task 'cordova_customize_images', ->
  gulp.src(['configs/#{configName}/icon.png', 'configs/#{configName}/splash.png'])
    .pipe(gulp.dest("cordova/#{config.package}/"))

gulp.task 'cordova_customize', gulp.series("cordova_customize_www", "cordova_customize_config", "cordova_customize_images")

# Gets files copied into cordova/ before 'cordova prepare' for release mode
gulp.task 'cordova_copy_release', gulp.series('cordova_copy_www', 'cordova_copy_config', 'cordova_customize')

# Gets files copied into cordova/ before 'cordova prepare' for debug mode
# Only difference is that updating is disabled
gulp.task 'cordova_copy_debug', gulp.series('cordova_copy_www', 'cordova_copy_config', 'cordova_customize', ->
  return gulp.src(['app/cordova/debug/**'])
    .pipe(gulp.dest("cordova/#{config.package}/www/"))
  )

gulp.task 'cordova_install_plugins', 
  gulp.series(_.map(plugins, (p) -> run("cordova plugin add #{p}", { cwd: "./cordova/#{config.package}" })))

# Let ant know where to find keystore
gulp.task 'cordova_setup_keystore', (cb) ->
  fs.appendFile("cordova/#{config.package}/platforms/android/ant.properties", 
    '''\nkey.store=/home/clayton/.ssh/mwater.keystore\nkey.alias=mwater''', cb)

# Add special options to AndroidManifest.xml
gulp.task 'cordova_setup_androidmanifest', (cb) ->
  alterXml("cordova/#{config.package}/platforms/android/AndroidManifest.xml", (data) ->
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
        { "$": { "android:host": config.hostname, "android:scheme": "http"}}
        { "$": { "android:host": config.hostname, "android:scheme": "https"}}
      ]
      })
  , cb)

gulp.task 'cordova_setup', gulp.series([
  'cordova_clean'
  (cb) -> fs.mkdir('cordova', cb)
  run("cordova create cordova/#{config.package} #{config.package} mWater")
  'cordova_copy_release'
  run("cordova platform add android", { cwd: "./cordova/#{config.package}" })
  'cordova_install_plugins'
  'cordova_setup_androidmanifest'
  ])

# Debug cordova
gulp.task 'cordova_debug', gulp.series([
  'cordova_copy_debug', 
  run("cordova -d run", { cwd: "./cordova/#{config.package}" })
  ])

