Question = require('./form-controls').Question

module.exports = class ImagesQuestion extends Question
  events:
    "click #camera": "cameraClick"
    "click .thumbnail": "thumbnailClick"

  renderAnswer: (answerEl) ->
    # Render image using image manager
    if not @ctx.imageManager
      answerEl.html '''<div class="text-error">Images not available</div>'''
    else
      imageUid = @model.get(@id)

      # If none, show camera
      if not imageUid
        answerEl.html '''
          <img src="img/camera-icon.jpg" id="camera" class="img-rounded" style="max-height: 100px"/>
        '''
      else
        # Render image
        answerEl.html _.template('''
          <img id="<%=imageUid%>" class="img-rounded thumbnail" style="max-height: 100px" onError="this.onerror=null;this.src='img/no-image-icon.jpg';" />
        ''', { imageUid: imageUid })

        # Set source
        success = (url) =>
          @$("#"+imageUid).attr("src", url)
        @ctx.imageManager.getImageThumbnailUrl imageUid, success, @error

  cameraClick: ->
    alert("On Android App, would launch Camera+Photo Viewer")

  thumbnailClick: =>
    @pager.openPage(ImagePage, { uid: ev.currentTarget.id })