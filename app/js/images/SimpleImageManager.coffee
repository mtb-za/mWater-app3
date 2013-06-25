
# apiUrl is base url
module.exports = class SimpleImageManager 
  constructor: (apiUrl) ->
    @apiUrl = apiUrl

  init: (success, error) ->
    success()

  getImageThumbnailUrl: (imageUid, success, error) ->
    success @apiUrl + "images/" + imageUid + "/thumbnail"

  getImageUrl = (imageUid, success, error) ->
    success @apiUrl + "images/" + imageUid