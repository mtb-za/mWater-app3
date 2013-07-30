# Launches/updates cordova app, redirecting to appropriate index.html
AppUpdater = require './AppUpdater'

getQueryParameterByName = (name) ->
  match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search)
  return match && decodeURIComponent(match[1].replace(/\+/g, ' '))

cachePath = "Android/data/co.mwater.clientapp/updates"
updateUrl = "http://app.mwater.co/"


# Determine orig URL location
match = /^(.*?)[^/]+?$/.exec(window.location.href)
origUrl = match[1]
origUrl = getQueryParameterByName("cordova") || origUrl

error = (err) ->
  alert("Internal error: " + err)

exports.createAppUpdater = (success, error) ->
  window.requestFileSystem LocalFileSystem.PERSISTENT, 0, (fs) ->
    appUpdater = new AppUpdater(fs, new FileTransfer(), origUrl, updateUrl, cachePath)  
    success(appUpdater)
  , error

exports.launch = () ->
  console.log("Launcher called")

  # Load cordova.js script
  script = document.createElement("script")
  script.onload = () =>

    # Wait for device ready
    document.addEventListener 'deviceready', () =>

      # Get file system
      window.requestFileSystem LocalFileSystem.PERSISTENT, 0, (fs) ->
        appUpdater = new AppUpdater(fs, new FileTransfer(), origUrl, updateUrl, cachePath)

        # Get launch URL
        appUpdater.launch (launchUrl) ->

          # If same as origUrl, load index_cordova.html
          if launchUrl == origUrl
            window.location.href = launchUrl + "index_cordova.html?cordova="
          else
            window.location.href = launchUrl + "index.html?cordova=" + origUrl
        , error
      , error
    , false

  script.onerror = error
  script.src = "cordova.js"
  document.head.appendChild(script)
