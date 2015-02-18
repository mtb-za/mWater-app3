gulp = require 'gulp'
del = require 'del'
fs = require 'fs'
rename = require 'gulp-rename'
replace = require 'gulp-replace'
exec = require('child_process').exec
sync = require 'synchronize'
_ = require 'lodash'
xml2js = require 'xml2js'
packageJson = require('./package.json')

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
# TODO still requires an <enter> to exit after piping stdin to child
run = (cmd, options) ->
  return (cb) ->
    child = exec cmd, options, (error, stdout, stderr) -> 
      process.stdin.unpipe()
      cb(error)
    process.stdin.pipe(child.stdin)
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
gulp.task 'cordova_clean', (cb) -> del("cordova/#{configName}", cb)

gulp.task 'cordova_copy_www', gulp.series('build', ->
  return gulp.src([
    "dist/**"])
    .pipe(gulp.dest("cordova/#{configName}/www/"))
  )

gulp.task 'cordova_copy_config', ->
  return gulp.src(["app/cordova/config.xml"])
    .pipe(gulp.dest("cordova/#{configName}/"))

# Customize config file
gulp.task 'cordova_customize_config', (cb) ->
  alterXml("cordova/#{configName}/config.xml", (data) ->
    # Set app name
    data.widget.name = [config.title]

    # Sets the version in the config.xml file to match current version
    data.widget["$"].version = packageJson.version
  , cb)

# Customize www directory with config-specific files
gulp.task 'cordova_customize_www', ->
  gulp.src(["configs/#{configName}/www/**"])
    .pipe(gulp.dest("cordova/#{configName}/www/"))

# Customize logo and splash screen
gulp.task 'cordova_customize_images', ->
  gulp.src(["configs/#{configName}/icon.png", "configs/#{configName}/splash.png"])
    .pipe(gulp.dest("cordova/#{configName}/"))

gulp.task 'cordova_customize', gulp.series("cordova_customize_www", "cordova_customize_config", "cordova_customize_images")

# Gets files copied into cordova/ before 'cordova prepare' for release mode
gulp.task 'cordova_copy_release', gulp.series('cordova_copy_www', 'cordova_copy_config', 'cordova_customize')

# Gets files copied into cordova/ before 'cordova prepare' for debug mode
# Only difference is that updating is disabled
gulp.task 'cordova_copy_debug', gulp.series('cordova_copy_www', 'cordova_copy_config', 'cordova_customize', ->
  return gulp.src(['app/cordova/debug/**'])
    .pipe(gulp.dest("cordova/#{configName}/www/"))
  )

gulp.task 'cordova_install_plugins', 
  gulp.series(_.map(plugins, (p) -> run("cordova plugin add #{p}", { cwd: "./cordova/#{configName}" })))

# Let ant know where to find keystore
gulp.task 'cordova_setup_keystore', (cb) ->
  fs.appendFile("cordova/#{configName}/platforms/android/ant.properties", 
    '''\nkey.store=/home/clayton/.ssh/mwater.keystore\nkey.alias=mwater''', cb)

# Add special options to AndroidManifest.xml
gulp.task 'cordova_setup_androidmanifest', (cb) ->
  alterXml("cordova/#{configName}/platforms/android/AndroidManifest.xml", (data) ->
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

# Patch https://issues.apache.org/jira/browse/CB-7868 until fixed
gulp.task 'cordova_patch_cb_7868', (cb) ->
  filename = "cordova/#{configName}/platforms/android/platform_www/cordova.js"
  js = fs.readFileSync(filename, 'utf-8')
  js = js.replace(/function clobber(.|[\r\n])+?utils.defineGetter/, 
    '''function clobber(obj, key, value) {
     exports.replaceHookForTesting(obj, key);
     var needsProperty = false;
     try {
         obj[key] = value;
     } catch (e) {
         needsProperty = true;
     }
     // Getters can only be overridden by getters.
     if (needsProperty || obj[key] !== value) {
         utils.defineGetter''')
  fs.writeFileSync(filename, js)
  cb()

gulp.task 'cordova_setup', gulp.series([
  'cordova_clean'
  (cb) -> 
    if not fs.existsSync("cordova")
      fs.mkdirSync('cordova')
    cb()
  run("cordova create cordova/#{configName} #{config.package} mWater")
  'cordova_copy_release'
  run("cordova platform add android", { cwd: "./cordova/#{configName}" })
  'cordova_install_plugins'
  'cordova_setup_androidmanifest'
  'cordova_setup_keystore'
  'cordova_patch_cb_7868'
  ])

# Debug cordova
gulp.task 'cordova_debug', gulp.series([
  'cordova_copy_debug', 
  run("cordova -d run", { cwd: "./cordova/#{configName}" })
  ])

# Builds the actual release file. Do not call directly
gulp.task 'cordova_build_release', gulp.series([
  run('cordova build android --release', { cwd: "./cordova/#{configName}" }),
  -> 
    gulp.src("cordova/#{configName}/platforms/android/ant-build/CordovaApp-release.apk")
      .pipe(rename("#{configName}-#{packageJson.version}.apk"))
      .pipe(gulp.dest("cordova/releases/"))
  ])

# Perform a deploy and release of the cordova version
gulp.task 'cordova_release', gulp.series([
  'cordova_setup'
  'deploy'
  'cordova_copy_release'
  'cordova_build_release'
  ])
