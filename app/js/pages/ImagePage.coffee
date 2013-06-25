Page = require "../Page"

# Displays an image. Options: uid: uid of image
module.exports = class ImagePage extends Page
  create: ->
    @$el.html templates['ImagePage']()

    # Get image url
    @imageManager.getImageUrl(@options.uid, (url) =>
      @$("#message_bar").hide()
      @$("#image").attr("src", url).show()
    , @error)

  activate: ->
    @setTitle "Image"

