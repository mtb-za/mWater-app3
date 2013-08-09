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
startUpdater = (appUpdater, success, error) ->
  # Start repeating check for updates
  updater = new sync.Repeater (success, error) =>
    console.log "About to update"
    appUpdater.update (status, message) =>
      console.log "Updater status: #{status} (#{message})"
      success(status)
    , (err) =>
      console.log "Updater failed: " + err
      success(status)

  updater.start(60*60*1000)   # one hour interval
  updater.perform() # Do right away
  success(true)

# Sets up cordova, loading cordova.js and updating as appropriate
# Calls success with true for cordova, false for not
exports.setup = (options, success, error) ->
  _.defaults(options, { update: true })

  # Determine base URL location for cordova (where to find cordova.js)
  # Base url is set by cordova query parameter
  baseUrl = options.baseUrl || getQueryParameterByName("cordova")

  # Determine if running original install (baseUrl = "")
  isOriginal = baseUrl == ""

  # If not cordova (baseUrl null or undefined), call success
  if not baseUrl?
    console.log "Not cordova"
    return success(false)

  # Determine full base URL location if blank
  if baseUrl == ""
    match = /^(.*?)[^/]*$/.exec(window.location.href)
    baseUrl = match[1]

  console.log "cordova=#{baseUrl}" 

  # Load cordova.js script
  script = document.createElement("script")
  script.onload = () =>
    console.log "cordova.js loaded"

    # Listen for deviceready event
    document.addEventListener 'deviceready', () =>
      # Cordova is now loaded
      console.log "Cordova deviceready"

      # If update not requested, just call success
      if not options.update
        console.log "No cordova update requested"
        return success(true)

      # Create app updater
      createAppUpdater baseUrl, (appUpdater) =>
        # If not original, that means we are running update
        # Do not try to relaunch
        if not isOriginal
          console.log "Running in update at #{baseUrl}"
          return startUpdater(appUpdater, success, error)

        # If we are running original install of application from 
        # native client. Get launcher
        # Get launch url (base url of latest update)
        appUpdater.launch (launchUrl) =>
          console.log "Cordova launchUrl=#{launchUrl}" 

          # If same as current baseUrl, proceed to starting updater, since are running latest version
          if launchUrl == baseUrl
            console.log "Running latest version"
            return startUpdater(appUpdater, success, error)

          # Redirect, putting current full base Url in cordova
          redir = launchUrl + "index_cordova.html?cordova=" + baseUrl
          console.log "Redirecting to #{redir}"
          window.location.href = redir
        , error
      , error

  script.onerror = ->
    error("Failed to load cordova.js")
  script.src = baseUrl + "cordova.js"
  document.head.appendChild(script)
