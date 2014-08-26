Page = require "../Page"

# Displays an image. 
# Options: 
# id: uid of image
# cover: true if cover image
# onSetCover: call when set image as cover
# onRemove: call when image is deleted
module.exports = class ImagePage extends Page
  create: ->
    @$el.html require('./ImagePage.hbs')()

    # Get image url
    @imageManager.getImageUrl @options.id, (url) =>
      @$("#message_bar").hide()
      @$("#image").attr("src", url).show()
    , =>
      alert(T("Image not available"))

  activate: ->
    @setTitle T("Image")
    @updateButtonbar()

  updateButtonbar: ->
    items = []
    # If setCover allowed, add to button bar
    if @options.onSetCover
      items.push { text: T("Set As Cover"), click: => @setCover() }

    # If remove allowed, set in button bar
    if @options.onRemove
      items.push { icon: "delete.png", click: => @removePhoto() }

    @setupButtonBar items 

  setCover: ->
    # Set cover
    @options.onSetCover()

    # Only allow once
    @options.onSetCover = null

    @updateButtonbar()

  removePhoto: ->
    if confirm(T("Remove image?"))
      @options.onRemove()
      @pager.closePage()
