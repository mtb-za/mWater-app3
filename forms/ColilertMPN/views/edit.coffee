forms = require 'forms'

model = new Backbone.Model()

questions = []

questions.push new forms.Instructions
  text: "Incubate at 37 C for 24 hours"

questions.push new forms.SourceQuestion
  id: 'source'
  ctx: options.ctx
  model: model
  prompt: "Water Source ID"

questions.push new forms.NumberQuestion
  id: 'dilution'
  model: model
  prompt: "Dilution factor"
  hint: "e.g. 10 means a 1:10 dilution"
  required: true

questions.push new forms.RadioQuestion
  id: 'tc_present'
  model: model
  prompt: "Did the liquid change color to yellow? (total coliform)"
  options: [[true, 'Yes'], [false, 'No']]
  required: true

questions.push new forms.RadioQuestion
  id: 'ecoli_present'
  model: model
  prompt: "Does the liquid glow bluish under UV light? (E. coli)"
  options: [[true, 'Yes'], [false, 'No']]
  required: true

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
  defaults: { dilution: 1 }
