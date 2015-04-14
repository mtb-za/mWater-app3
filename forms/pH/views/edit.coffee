forms = require 'forms'

model = new Backbone.Model()

questions = []

questions.push new forms.SourceQuestion
  id: 'source'
  ctx: options.ctx
  model: model
  prompt: "Water Source ID"

questions.push new forms.NumberQuestion
  id: 'pHValue'
  model: model
  prompt: "pH Value"
  required: true
  decimal: true

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
