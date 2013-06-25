Question = require('./form-controls').Question
ImagePage = require '../pages/ImagePage'

# TODO rename imagesquestion
module.exports = class PhotosQuestion extends Question
  events:
    "click #camera": "cameraClick"
    "click .thumbnail": "thumbnailClick"

  renderAnswer: (answerEl) ->
    # Render image using image manager
    if not @ctx.imageManager
      answerEl.html '''<div class="text-error">Images not available</div>'''
    else
      images = @model.get(@id)

      # Render images
      answerEl.html templates['forms/PhotosQuestion'](images: images)

      # Set sources
      if images
        for image in images
          @setThumbnailUrl(image.id)
    
  setThumbnailUrl: (id) ->
    success = (url) =>
      @$("#" + id).attr("src", url)
    @ctx.imageManager.getImageThumbnailUrl id, success, @error

  cameraClick: ->
    alert("In Android App, Camera would open")  # TODO

  thumbnailClick: (ev) ->
    @ctx.pager.openPage(ImagePage, { id: ev.currentTarget.id })