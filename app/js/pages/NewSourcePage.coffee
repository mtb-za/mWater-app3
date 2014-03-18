Page = require '../Page'
forms = require '../forms'
SourcePage = require "./SourcePage"

# Allows creating of a source
# Options are geo to initialize the geo of the source
module.exports = class NewSourcePage extends Page
  @canOpen: (ctx) -> ctx.auth.insert("sources")

  activate: ->
    @setTitle "New Source"

    # Create model for the source
    @model = new Backbone.Model(setLocation: not @options.geo?)
  
    # Create questions
    sourceTypesQuestion = new forms.DropdownQuestion
      id: 'type'
      model: @model
      prompt: 'Enter Source Type'
      options: []

    @db.source_types.find({}).fetch (sourceTypes) =>
      # Fill source types
      sourceTypesQuestion.setOptions _.map(sourceTypes, (st) => [st.code, st.name])

    contents = []

    contents.push sourceTypesQuestion

    contents.push new forms.TextQuestion
      id: 'name'
      model: @model
      prompt: 'Enter optional name'

    contents.push new forms.TextQuestion
      id: 'desc'
      model: @model
      prompt: 'Enter optional description'

    contents.push new forms.CheckQuestion
      id: 'private'
      model: @model
      prompt: "Privacy"
      text: 'Water source is private'
      hint: 'This should only be used for sources that are not publically accessible'

    if not @options.geo?
      contents.push new forms.RadioQuestion
        id: 'setLocation'
        model: @model
        prompt: 'Set to current location?'
        options: [[true, 'Yes'], [false, 'No']]

    saveCancelForm = new forms.SaveCancelForm
      contents: contents

    @$el.empty().append(saveCancelForm.el)

    @listenTo saveCancelForm, 'save', =>
      source = _.pick(@model.toJSON(), 'name', 'desc', 'type', 'private')

      success = (code) =>
        source.code = code
        source.user = @login.user
        source.org = @login.org

        # Set geo is present in options
        if @options.geo?
          source.geo = @options.geo

        @db.sources.upsert source, (source) => 
          @pager.closePage(SourcePage, { _id: source._id, setLocation: @model.get('setLocation'), onSelect: @options.onSelect })

      error = =>
        alert("Unable to generate source id. Please ensure that you have a connection or use Settings to obtain more before going out of connection range.")

      @sourceCodesManager.requestCode(success, error)

    @listenTo saveCancelForm, 'cancel', =>
      @pager.closePage()
 