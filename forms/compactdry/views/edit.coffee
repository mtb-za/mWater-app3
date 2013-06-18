forms = require 'forms'

model = new Backbone.Model()

questions = []

questions.push new forms.SourceQuestion
  id: 'source'
  model: model
  prompt: "Water Source ID"

questions.push new forms.NumberQuestion
  id: 'dilution'
  model: model
  prompt: "Dilution of sample"
  required: true

questions.push new forms.NumberQuestion
  id: 'ecoli'
  model: model
  prompt: "Number of E.Coli (blue) colonies?"
  required: true

questions.push new forms.NumberQuestion
  id: 'tc'
  model: model
  prompt: "Number of Total Coliform (red) colonies?"

questions.push new forms.PhotosQuestion
  id: 'photos'
  model: model
  prompt: "Photos"

questions.push new forms.TextQuestion
  id: 'notes'
  model: model
  prompt: "Notes"
  multiline: true

return new forms.WaterTestEditView
  contents: questions
  model: model
  defaults: { dilution: 1 }
