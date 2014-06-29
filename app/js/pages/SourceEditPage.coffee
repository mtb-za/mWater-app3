Page = require '../Page'
forms = require '../forms'

# Allows editing of source details
module.exports = class SourceEditPage extends Page
  @canOpen: (ctx) -> ctx.auth.update("sources")

  activate: ->
    @db.sources.findOne {_id: @options._id}, (source) =>
      # Check auth
      if not @auth.update("sources", source)
        return @pager.closePage()

      @setTitle T("Edit Source {0}", source.code)

      # Create model from source
      @model = new Backbone.Model(source)
  
      # Create questions
      sourceTypesQuestion = new forms.DropdownQuestion
        id: 'type'
        model: @model
        prompt: T('Enter Source Type')
        options: []
      @db.source_types.find({}).fetch (sourceTypes) =>
        # Fill source types
        sourceTypesQuestion.setOptions _.map(sourceTypes, (st) => [st.code, st.name])
      , @error

      saveCancelForm = new forms.SaveCancelForm
        contents: [
          sourceTypesQuestion
          new forms.TextQuestion
            id: 'name'
            model: @model
            prompt: T('Enter optional name')
          new forms.TextQuestion
            id: 'desc'
            model: @model
            prompt: T('Enter optional description')
          new forms.CheckQuestion
            id: 'private'
            model: @model
            prompt: T("Privacy")
            text: T('Water source is private')
            hint: T('This should only be used for sources that are not publically accessible')
        ]

      @$el.empty().append(saveCancelForm.el)

      @listenTo saveCancelForm, 'save', =>
        @db.sources.upsert @model.toJSON(), => 
          @pager.closePage()
        , @error 

      @listenTo saveCancelForm, 'cancel', =>
        @pager.closePage()
    , @error
 