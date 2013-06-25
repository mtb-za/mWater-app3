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

questions.push new forms.NumberQuestion
  id: 'ecoli_count'
  model: model
  prompt: "Number of blue colonies with gas bubbles (E. coli)"
  required: true

questions.push new forms.NumberQuestion
  id: 'tc_count'
  model: model
  prompt: "Number of red colonies with gas bubbles (total coliform)"

questions.push new forms.NumberQuestion
  id: 'gnnc_count'
  model: model
  prompt: "Number of red colonies with no gas bubble (gram negative non-coliforms)"

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
  defaults: { dilution: 1 }
