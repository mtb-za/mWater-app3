Page = require '../Page'
forms = require '../forms'

# Allows creating/editing of source notes
# Options are 
# _id: id of source note
# source: code of source

module.exports = class SourceNotePage extends Page
  activate: ->
    # Find water source
    @db.sources.findOne {code: @options.source}, (source) =>
      @setTitle T("Status for Source {0}", source.code)

      # Find source note
      if @options._id
        @db.source_notes.findOne {_id: @options._id}, (sourceNote) =>
          @sourceNote = sourceNote
          @render()
      else
        # New source note, just render
        if not @auth.insert("source_notes")
          return @pager.closePage()
        @render()

  render: ->
      # Create model 
      @model = new Backbone.Model()
  
      # Create questions
      readonly = @sourceNote? and not @auth.update("source_notes", @sourceNote)

      questions = [
        new forms.DateQuestion
          id: 'date'
          model: @model
          prompt: T('Date of Visit')
          required: true
          readonly: readonly
        new forms.RadioQuestion
          id: 'status'
          model: @model
          prompt: T('Status of Water Source')
          options: [['ok', T('Functional')], ['maint', T('Needs maintenance')], ['broken', T('Non-functional')], ['missing', T('No longer exists')]]
          required: true
          readonly: readonly
        new forms.TextQuestion
          id: 'notes'
          model: @model
          prompt: T('Notes')
          multiline: true
          readonly: readonly
      ]

      # Create form
      if readonly
        form = new forms.QuestionGroup
          contents: questions
      else
        form = new forms.SaveCancelForm
          contents: questions
  
        @listenTo form, 'save', =>
          @db.source_notes.upsert @model.toJSON(), => 
            @pager.closePage()
          , @error

        @listenTo form, 'cancel', =>
          @pager.closePage()

      # Load form from source note if exists
      if @sourceNote
        @model.set(@sourceNote)
      else
        # Create default entry
        @model.set(source: @options.source, date: new Date().toISOString().substring(0,10))

      @$el.empty().append(form.el) 