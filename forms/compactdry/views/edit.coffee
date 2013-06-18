forms = require 'forms'

model = new Backbone.Model()

questions = []

questions.push new forms.TextQuestion
  id: 'q1'
  model: model
  prompt: "Enter a value"
  required: true


return new forms.WaterTestEditView
  contents: questions
  model: model
