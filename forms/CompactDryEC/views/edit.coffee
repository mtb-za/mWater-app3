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
  prompt: "Number of blue colonies (E. coli)"
  required: true
  conditional: ->
    @model.get('ecoli_tntc') != true

questions.push new forms.CheckQuestion
  id: 'ecoli_tntc'
  model: model
  prompt: ""
  text: "Blue colonies too numerous to count"

questions.push new forms.NumberQuestion
  id: 'tc_count'
  model: model
  prompt: "Number of red colonies (total coliform)"
  conditional: ->
    @model.get('tc_tntc') != true

questions.push new forms.CheckQuestion
  id: 'tc_tntc'
  model: model
  prompt: ""
  text: "Red colonies too numerous to count"

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
  save: ->
    data = model.toJSON()

    # Omit count if tntc
    if data.ecoli_tntc
      delete data.ecoli_count
    if data.tc_tntc
      delete data.tc_count
    return data

