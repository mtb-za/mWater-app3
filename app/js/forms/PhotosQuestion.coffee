Question = require('./form-controls').Question

module.exports = Question.extend
  events:
    "click #camera": "cameraClick"

  renderAnswer: (answerEl) ->
    answerEl.html '''
      <img src="img/camera-icon.jpg" id="camera" class="img-rounded" style="max-height: 100px"/>
    '''

  cameraClick: ->
    alert("On Android App, would launch Camera+Photo Viewer")
