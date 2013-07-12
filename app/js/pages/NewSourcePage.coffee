Page = require '../Page'
forms = require '../forms'
SourcePage = require "./SourcePage"

# Allows creating of a source
module.exports = class NewSourcePage extends Page
  @canOpen: (ctx) -> ctx.auth.insert("sources")

  activate: ->
    @setTitle "New Source"

    # Create model from source
    @model = new Backbone.Model(setLocation: true)
  
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
        new forms.CheckQuestion
          id: 'private'
          model: @model
          prompt: "Privacy"
          text: 'Water source is private'
          hint: 'This should only be used for sources that are not publically accessible'
        new forms.RadioQuestion
          id: 'setLocation'
          model: @model
          prompt: 'Set to current location?'
          options: [[true, 'Yes'], [false, 'No']]
      ]

    @$el.empty().append(saveCancelForm.el)

    @listenTo saveCancelForm, 'save', =>
      source = _.pick(@model.toJSON(), 'name', 'desc', 'type', 'private')
      source.code = ""+Math.floor(Math.random()*1000000)  # TODO real codes

      source.user = @login.user
      source.org = @login.org

      @db.sources.upsert source, (source) => 
        @pager.closePage(SourcePage, { _id: source._id, setLocation: @model.get('setLocation')})

    @listenTo saveCancelForm, 'cancel', =>
      @pager.closePage()
 