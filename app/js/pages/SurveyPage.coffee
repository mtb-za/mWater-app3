Page = require "../Page"
forms = require '../forms'

class SurveyPage extends Page
  @canOpen: (ctx) -> ctx.auth.update("responses")

  create: ->
    @setTitle "Survey"

    # Get response
    @db.responses.findOne {_id: @options._id}, (response) =>
      @response = response

      # Get form
      @db.forms.findOne {code: response.type}, (form) =>
        if not form
          alert "Survey form #{response.type} not found"
          @pager.closePage()
          return

        # Render form
        @formView = forms.instantiateView(form.views.edit, { ctx: @ctx })
        @$el.append(@formView.el)

        # Listen to events
        @listenTo @formView, 'change', @saveResponse
        @listenTo @formView, 'complete', @formCompleted
        @listenTo @formView, 'close', @formClose

        @formView.load response.data

        if @auth.remove("responses", @response)
          @setupContextMenu [
            { glyph: 'remove', text: "Delete Survey", click: => @removeResponse() }
          ] 

  activate: ->
    # Do not reload as form may have launched another page
    # and needs to keep its state

  deactivate: ->
    # Save to be safe
    if @formView
      @saveResponse()

  destroy: ->
    # Let know that saved if closed incompleted
    if @response and not @response.completed
      @pager.flash "Survey saved as draft."

  formClose: ->
    @pager.closePage()

  saveResponse: =>
    # Save to db
    @response.data = @formView.save()
    @db.responses.upsert(@response)

  formCompleted: =>
    # Mark as completed
    @response.data = @formView.save()
    @response.completed = new Date().toISOString()

    @db.responses.upsert(@response)
    @pager.closePage()
    @pager.flash "Survey submitted successfully", "success"

  removeResponse: ->
    if @auth.remove("responses", @response) and confirm("Permanently delete survey?")
      @db.responses.remove @response._id, =>
        @response = null
        @pager.closePage()
        @pager.flash "Survey deleted", "success"

module.exports = SurveyPage