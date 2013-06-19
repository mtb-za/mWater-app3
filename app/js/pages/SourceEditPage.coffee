Page = require '../Page'
forms = require '../forms'

# Allows editing of source details
# TODO login required
module.exports = class SourceEditPage extends Page
  activate: ->
    @db.sources.findOne {_id: @options._id}, (source) =>
      @setTitle "Edit Source #{source.code}"

      # Create model from source
      @model = new Backbone.Model(source)
  
      # Create questions
      sourceTypesQuestion = new forms.DropdownQuestion
        id: 'type'
        model: @model
        prompt: 'Enter Source Type'
        options: []
      @db.source_types.find({}).fetch (sourceTypes) =>
        # Fill source types
        sourceTypesQuestion.setOptions _.map(sourceTypes, (st) => [st.code, st.name])

      saveCancelForm = new forms.SaveCancelForm
        contents: [
          sourceTypesQuestion
          new forms.TextQuestion
            id: 'name'
            model: @model
            prompt: 'Enter optional name'
          new forms.TextQuestion
            id: 'desc'
            model: @model
            prompt: 'Enter optional description'
        ]

      @$el.empty().append(saveCancelForm.el)

      @listenTo saveCancelForm, 'save', =>
        @db.sources.upsert @model.toJSON(), => @pager.closePage()

      @listenTo saveCancelForm, 'cancel', =>
        @pager.closePage()
 