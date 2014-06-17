# Modal that allows upload of an image to the server

# Based on http://www.matlus.com/html5-file-upload-with-progress/
class ImageUploaderView extends Backbone.View
  events: 
    'change #fileToUpload' : 'fileSelected'
    'click #upload' : 'upload'
    'click #cancel' : 'cancel'

  # Uploaded is called when successfully uploaded
  constructor: (destUrl, uploaded) ->
    super()
    @destUrl = destUrl
    @uploaded = uploaded
    @render()

  render: ->
    @$el.html require('./ImageUploader.hbs')()

    # Destroy when hidden
    @$("#modal").on 'hidden.bs.modal', =>
      # Destroy
      @remove()

  show: ->
    # Add modal to body
    $("body").append(@$el)

    # Display modal
    @$("#modal").modal('show')

  fileSelected: ->
    # Get file information
    file = @$("#fileToUpload").get(0).files[0]
    if file
      if file.type != "image/jpeg"
        alert(T("Image must be a jpeg file"))
        return

      # Allow upload
      @$("#upload").removeAttr('disabled')
  
  upload: ->
    @xhr = new XMLHttpRequest()
    fd = new FormData()
    fd.append "image", document.getElementById("fileToUpload").files[0]

    # Add event listners 
    @xhr.upload.addEventListener "progress", @uploadProgress, false
    @xhr.addEventListener "load", @uploadComplete, false
    @xhr.addEventListener "error", @uploadFailed, false
    @xhr.addEventListener "abort", @uploadCanceled, false

    @xhr.open "POST", @destUrl
    @xhr.send fd

    # Enable/disable buttons
    @$("#upload").attr("disabled", "disabled")
    @$("#close").attr("disabled", "disabled")
    @$("#cancel").removeAttr("disabled")

  cancel: ->
    @xhr.abort()

  uploadProgress: (evt) =>
    if evt.lengthComputable
      percentComplete = Math.round(evt.loaded * 100 / evt.total)
      @$(".progress-bar").width("#{percentComplete}%")
    else
      @$(".progress-bar").width("100%")

  uploadComplete: (evt) =>
    # This event is raised when the server send back a response 
    if evt.target.status == 200
      @$("#modal").modal('hide')
      @uploaded()
    else
      alert T("Upload failed: {0}", evt.target.responseText)
      @$("#modal").modal('hide')

  uploadFailed: (evt) =>
    alert T("Error uploading file")
    @$("#modal").modal('hide')

  uploadCanceled: (evt) =>
    alert T("Upload cancelled")
    @$("#modal").modal('hide')

createId = -> 
  'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, (c) ->
    r = Math.random()*16|0
    v = if c == 'x' then r else (r&0x3|0x8)
    return v.toString(16)
   )

# Acquire an image and call success with new id of image
exports.acquire = (apiUrl, client, success, error) ->
  # Create id
  id = createId()

  # Generate url
  url = apiUrl + "images/" + id + "?client=" + client

  # Create image uploader
  imageUploader = new ImageUploaderView url, ->
    success(id)
  imageUploader.show()
  

