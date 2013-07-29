# Launches/updates cordova app, redirecting to appropriate index.html
AppUpdater = require './AppUpdater'

getQueryParameterByName = (name) ->
  match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search)
  return match && decodeURIComponent(match[1].replace(/\+/g, ' '))

cachePath = "Android/data/co.mwater.clientapp/updates"
updateUrl = "http://app.mwater.co/"
origUrl = getQueryParameterByName("cordova") || "/"

exports.createAppUpdater = (success, error) ->
  window.requestFileSystem LocalFileSystem.PERSISTENT, 0, (fs) ->
    appUpdater = new AppUpdater(fs, new FileTransfer(), origUrl, updateUrl, cachePath)  
    success(appUpdater)
  , error

exports.launch = () ->
  exports.createAppUpdater (appUpdater) ->
    appUpdater.launch (url) ->
      # Create full url to index.html
      indexUrl = url + "index.html?cordova=" + origUrl
      window.location.href = indexUrl
    , (err) ->
      alert("Failed to launch app: " + err)
  , (err) ->
    alert("Failed to launch app: " + err)
