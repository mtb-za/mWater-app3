Page = require "../Page"

# Displays an image. Options: uid: uid of image
module.exports = class ImagePage extends Page
  create: ->
    @$el.html templates['pages/ImagePage']()

    # Get image url
    @imageManager.getImageUrl(@options.id, (url) =>
      @$("#message_bar").hide()
      @$("#image").attr("src", url).show()
    , @error)

  activate: ->
    @setTitle T("Image")

    # If remove allowed, set in button bar
    if @options.onRemove
      @setupButtonBar [
        { icon: "delete.png", click: => @removePhoto() }
      ]
    else
      @setupButtonBar []

  removePhoto: ->
    if confirm(T("Remove image?"))
      @options.onRemove()
      @pager.closePage()
