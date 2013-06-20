forms = require 'forms'

model = new Backbone.Model()

questions = []

questions.push new forms.SourceQuestion
  id: 'source'
  ctx: options.ctx
  model: model
  prompt: "Water Source ID"

questions.push new forms.NumberQuestion
  id: 'As_mgperL'
  model: model
  prompt: "Arsenic (mg / L)"
  required: true

questions.push new forms.PhotoQuestion
  id: 'photo'
  model: model
  prompt: "Photo"

questions.push new forms.TextQuestion
  id: 'notes'
  model: model
  prompt: "Notes"
  multiline: true

return new forms.WaterTestEditView
  contents: questions
  model: model

