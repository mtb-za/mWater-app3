Page = require '../Page'
forms = require '../forms'

# Allows creating/editing of source notes
# Options are 
# _id: id of source note
# source: code of source

# TODO login required
module.exports = class SourceNotePage extends Page
  activate: ->
    # Find water source
    @db.sources.findOne {code: @options.source}, (source) =>
      @setTitle "Note for Source #{source.code}"

      # Create model 
      @model = new Backbone.Model()
  
      # Create questions
      saveCancelForm = new forms.SaveCancelForm
        contents: [
          new forms.DateQuestion
            id: 'date'
            model: @model
            prompt: 'Date of Visit'
            required: true
          new forms.RadioQuestion
            id: 'status'
            model: @model
            prompt: 'Status of Water Source'
            options: [['ok', 'Functional'], ['repair', 'Needs repair'], ['broken', 'Non-functional'], ['missing', 'No longer exists']]
            required: true
          new forms.TextQuestion
            id: 'notes'
            model: @model
            prompt: 'Notes'
            multiline: true
        ]

      # Load form from source note if exists
      if @options._id
        @db.source_notes.findOne {_id: @options._id}, (sourceNote) =>
          @model.set(sourceNote)
      else
        # Create default entry
        @model.set(source: @options.source, date: new Date().toISOString().substring(0,10))

      @$el.empty().append(saveCancelForm.el)

      @listenTo saveCancelForm, 'save', =>
        @db.source_notes.upsert @model.toJSON(), => @pager.closePage()

      @listenTo saveCancelForm, 'cancel', =>
        @pager.closePage()
 