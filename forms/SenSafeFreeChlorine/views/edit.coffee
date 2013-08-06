forms = require 'forms'

model = new Backbone.Model()

questions = []

questions.push new forms.Instructions
  html: '''Dip strip into 50 mL water sample for 20 seconds (at 24 C)<br/>
    Shake dry and read after 20 seconds, comparing to color chart on bottle'''

questions.push new forms.SourceQuestion
  id: 'source'
  ctx: options.ctx
  model: model
  prompt: "Water Source ID"

questions.push new forms.RadioQuestion
  id: 'freeCl_present'
  model: model
  prompt: "Did the color change from white to light blue?"
  options: [[true, 'Yes'], [false, 'No']]
  required: true

questions.push new forms.NumberQuestion
  id: 'freeCl_mgperL'
  model: model
  prompt: "Free chlorine (mg/L)"
  decimal: true
  conditional: ->
    @model.get('freeCl_present') == true

questions.push new forms.ImageQuestion
  id: 'photo'
  model: model
  prompt: "Photo"
  ctx: options.ctx

questions.push new forms.TextQuestion
  id: 'notes'
  model: model
  prompt: "Notes"
  multiline: true

return new forms.WaterTestEditView
  contents: questions
  model: model
