forms = require 'forms'

model = new Backbone.Model()

questions = []

questions.push new forms.RadioQuestion
  id: 'ecoli'
  model: model
  prompt: "Does the tube glow blue under UV light?"
  options: [[true, 'Yes'], [false, 'No']]
  required: true

questions.push new forms.RadioQuestion
  id: 'tc'
  model: model
  prompt: "Are the tube contents yellowish?"
  options: [[true, 'Yes'], [false, 'No']]
  required: true

questions.push new forms.NumberQuestion
  id: 'dilution'
  model: model
  prompt: "Dilution of sample"
  required: true

questions.push new forms.TextQuestion
  id: 'notes'
  model: model
  prompt: "Notes"
  multiline: true

return new forms.WaterTestEditView
  contents: questions
  model: model
  defaults: { dilution: 1 }
