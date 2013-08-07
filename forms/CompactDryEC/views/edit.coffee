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
  ctx: options.ctx

class AutoCounter extends Backbone.View
  events:
    'click #auto_count' : 'autoCount'

  initialize: ->
    forms.ECPlates.isAvailable (avail) =>
      if avail
        # Re-render based on model changes
        @model.on("change", @render, @)
        @render()
    , @options.ctx.error

  render: ->
    @$el.html('<button id="auto_count" class="btn btn-info">Perform Automatic Count</button><div id="hint" class="muted"></div>')

    # Disable based on photo
    if not @model.get('photo')
      @$('button').attr("disabled", true)
      @$('#hint').text("To enable automatic counting, first take a photo of the plate by tapping the camera icon.")

  autoCount: ->
    @options.ctx.imageManager.getImageUrl @model.get('photo').id, (imgUrl) =>
      forms.ECPlates.processImage imgUrl, (args) =>
        if args.error
          alert("Automatic count failed: " + args.error)
        else
          if confirm("E.Coli: #{args.ecoli}  TC: #{args.tc}. Save counts?")
            @model.set {
              ecoli_count: args.ecoli
              ecoli_tntc: false
              tc_count: args.tc
              tc_tntc: false
            }
      , @options.ctx.error
    , @options.ctx.error

questions.push new AutoCounter({ model: model, ctx: options.ctx })

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

