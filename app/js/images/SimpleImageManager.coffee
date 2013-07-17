
# apiUrl is base url
module.exports = class SimpleImageManager 
  constructor: (apiUrl) ->
    @apiUrl = apiUrl

  init: (success, error) ->
    success()

  # TODO make generic
  getImageThumbnailUrl: (imageId, success, error) ->
    success @apiUrl + "images/" + imageId + "?h=100"

  getImageUrl: (imageId, success, error) ->
    success @apiUrl + "images/" + imageId + "?h=1024"

  upload: (progress, success, error) ->
    success()
