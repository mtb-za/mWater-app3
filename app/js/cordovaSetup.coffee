# Starts cordova (phonegap) and also optionally
# launches most recently downloaded update.
# Enabled by "cordova=" in query string. Put nothing after = for base launch

AppUpdater = require './AppUpdater'
sync = require './sync'

# Gets a query parameter from the query string of the current page
getQueryParameterByName = (name) ->
  match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search)
  return match && decodeURIComponent(match[1].replace(/\+/g, ' '))

# Where to store updated versions in local disk
cachePath = "Android/data/co.mwater.clientapp/updates"

# Where to pull updates from
updateUrl = "http://app.mwater.co/"

createAppUpdater = (baseUrl, success, error) ->
  window.requestFileSystem LocalFileSystem.PERSISTENT, 0, (fs) ->
    appUpdater = new AppUpdater(fs, new FileTransfer(), baseUrl, updateUrl, cachePath)  
    success(appUpdater)
  , error

# Start an updater which checks for updates every interval
startUpdater = (appUpdater, success, error, relaunch) ->
  # Start repeating check for updates
  updater = new sync.Repeater (success, error) =>
    console.log "About to update"
    appUpdater.update (status, message) =>
      console.log "Updater status: #{status} (#{message})"

      # Listen for relaunch
      if status == 'relaunch'
        if relaunch
          relaunch()

      success(status)
    , (err) =>
      console.log "Updater failed: " + err
      success(status)

  updater.start(10*60*1000)   # 10 min interval
  updater.perform() # Do right away
  success(true)

# Gets the cordova base version. Null if not present
exports.baseVersion = () ->
  return getQueryParameterByName("base_version")

# Sets up cordova, starting updater if requested and waiting for deviceread
exports.setup = (options, success, error) ->
  _.defaults(options, { update: true })

  console.log "Starting cordova..." 

  # Determine base url and whether running in base
  baseUrl = "file:///android_asset/www/"
  isOriginal = window.location.href.match("^file:\/\/\/android_asset\/www\/")
  console.log "isOriginal = #{isOriginal}"

  # Listen for deviceready event
  document.addEventListener 'deviceready', () =>
    # Cordova is now loaded
    console.log "Cordova deviceready"

    # If update not requested, just call success
    if not options.update
      console.log "No cordova update requested"
      return success()

    # Create app updater
    createAppUpdater baseUrl, (appUpdater) =>
      # Function called when relaunch is needed
      relaunch = =>
        if confirm(T("A new version is available. Restart app?"))
          # Reload base url index_cordova.html
          window.location.href = baseUrl + "index_cordova.html"

      # If not original, that means we are running update
      # Do not try to relaunch
      if not isOriginal
        console.log "Running in update at #{window.location.href}"
        return startUpdater(appUpdater, success, error, relaunch)

      # If we are running original install of application from 
      # native client. Get launcher
      # Get launch url (base url of latest update)
      appUpdater.launch (launchUrl) =>
        console.log "Cordova launchUrl=#{launchUrl}" 

        # If same as current baseUrl, proceed to starting updater, since are running latest version
        if launchUrl == baseUrl
          console.log "Running latest version"
          return startUpdater(appUpdater, success, error, relaunch)

        # Redirect, putting base version 
        redir = launchUrl + "index_cordova.html?base_version=" + "//VERSION//"
        console.log "Redirecting to #{redir}"
        $("body").html('<div class="alert alert-info">' + T("Loading mWater...") + '</div>')
        window.location.href = redir
      , error
    , error
