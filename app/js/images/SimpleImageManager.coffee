
# apiUrl is base url
module.exports = class SimpleImageManager 
  constructor: (apiUrl) ->
    @apiUrl = apiUrl

  init: (success, error) ->
    success()

  getImageThumbnailUrl: (imageId, success, error) ->
    success @apiUrl + "images/" + imageId + "/thumbnail"

  getImageUrl = (imageId, success, error) ->
    success @apiUrl + "images/" + imageId