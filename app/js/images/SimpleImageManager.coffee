
# apiUrl is base url
module.exports = class SimpleImageManager 
  constructor: (apiUrl) ->
    @apiUrl = apiUrl

  init: (success, error) ->
    success()

  getImageThumbnailUrl: (imageId, success, error) ->
    success @apiUrl + "images/" + imageId + "?h=100"

  getImageUrl: (imageId, success, error) ->
    success @apiUrl + "images/" + imageId