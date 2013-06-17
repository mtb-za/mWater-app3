Page = require '../Page'
forms = require '../forms'

# Allows editing of source details
# TODO login required
module.exports = class SourceEditPage extends Page
  constructor: (ctx, _id) ->
    super(ctx)
    @_id = _id

  events: 
    'click #save_button': 'save'
    'click #cancel_button': 'cancel'

  activate: ->
    @db.sources.findOne {_id: @_id}, (source) =>
      @source = source

      @setTitle "Edit Source #{source.code}"
      @$el.html templates['pages/SourceEditPage'](source:source)

      # Create model from source
      @model = new Backbone.Model(_.pick(source, 'source_type', 'name', 'desc'))
  
      # Create question group
      sourceTypesQuestion = new forms.DropdownQuestion
        id: 'source_type'
        model: @model
        prompt: 'Enter Source Type'
        options: []
      @db.source_types.find({}).fetch (sourceTypes) =>
        # Fill source types
        sourceTypesQuestion.setOptions _.map(sourceTypes, (st) => [st.code, st.name])

      @questionGroup = new forms.QuestionGroup
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

      @$("#questions").append(@questionGroup.el)

  save: ->
    if @questionGroup.validate()
      _.extend(@source, @model.toJSON())
      @db.sources.upsert @source, => @pager.closePage()

  cancel: -> @pager.closePage()
 