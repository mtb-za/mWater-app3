forms = require 'forms'

model = new Backbone.Model()

questions = []

questions.push new forms.SourceQuestion
  id: 'source'
  ctx: options.ctx
  model: model
  prompt: "Water Source ID"

questions.push new forms.NumberQuestion
  id: 'no3_mgperL'
  model: model
  prompt: "Nitrate (NO3) Nitrogen (mg / L)"
  required: true
  decimal: true

questions.push new forms.NumberQuestion
  id: 'no2_mgperL'
  model: model
  prompt: "Nitrite (NO2) Nitrogen (mg / L)"
  required: true
  decimal: true

questions.push new forms.ImageQuestion
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

