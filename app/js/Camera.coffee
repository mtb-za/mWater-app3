exports.takePicture = (success, error) ->
  unless navigator.camera
    error()
    return
  
  # Start get picture
  console.log "About to take picture"
  navigator.camera.getPicture success, error,
    quality: 80
    destinationType: Camera.DestinationType.FILE_URI


exports.hasCamera = ->
  return navigator.camera?