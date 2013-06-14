Page = require("../Page")

class SurveyPage extends Page
  constructor: (ctx, responseId) ->
    super(ctx)
    @responseId = responseId

  create: ->
    @setTitle "Survey"

    # Get response
    @db.responses.findOne {_id: @responseId}, (response) =>
      @response = response

      # Get form
      @db.forms.findOne {_id: response.form}, (form) =>
        # Render form
        viewFunc = new Function("options", form.view)
        view = viewFunc({ ctx: @ctx });
        @formView = view

        @$el.append(view.el);

        # Listen to events
        @listenTo @formView, 'change', @saveResponse
        @listenTo @formView, 'complete', @formCompleted

        @formView.load response.data

  activate: ->
    # TODO Reload data? Or do forms keep their data
    #if @formView

  deactivate: ->
    # Save to be safe
    @saveResponse()

  saveResponse: =>
    # Save to db
    @response.data = @formView.save()
    @db.responses.upsert(@response)

  formCompleted: =>
    # Mark as completed
    @response.data = @formView.save()
    @response.completed = true

    @db.responses.upsert(@response)
    @pager.closePage()

module.exports = SurveyPage