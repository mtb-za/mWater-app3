# Module that handles calling EC Compact Dry Plate automatic counting

exports.isAvailable = (success, error) ->
  if window.OpenCVActivity?
    window.OpenCVActivity.processList (list) =>
      if _.contains(list, "ec-plate")
        success(true)
      else
        success(false)
  else
    success(false)


exports.processImage = (imgUrl, success, error) ->
  # Strip file:// prefix
  console.log "Processing image url: #{imgUrl}"
  if imgUrl.match /^file:\/\//
    fullPath = imgUrl.substring(7)
  else
    return error("Invalid image url: #{imgUrl}")

  console.log "Got image fullPath: #{fullPath}"
  OpenCVActivity.process "ec-plate", [fullPath], "EC Compact Dry Plate Counter", (args) ->
    success(args)
  , @error
