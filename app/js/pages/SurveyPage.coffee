Page = require "../Page"
forms = require '../forms'

class SurveyPage extends Page
  @canOpen: (ctx) -> ctx.auth.update("responses")

  create: -> @render()

  render: ->
    @setTitle "Survey"

    # Get response
    @db.responses.findOne {_id: @options._id}, (response) =>
      if not response
        alert("Test not found")
        return @pager.closePage()

      @response = response

      if @auth.remove("responses", @response)
        @setupContextMenu [ { glyph: 'remove', text: "Delete Survey", click: => @deleteSurvey() } ]
      else 
        @setupContextMenu [ ]

      # Get form
      @db.forms.findOne { type: "Survey", code: response.type}, (form) =>
        if not form
          alert "Survey form #{response.type} not found"
          @pager.closePage()
          return

        # Render survey page
        @$el.html templates['pages/SurveyPage'](form: form, response: response)

        # Check if not completed and editable
        if not response.completed and @auth.update("responses", response)
          @formView = forms.instantiateView(form.views.edit, { ctx: @ctx })

          # Listen to events
          @listenTo @formView, 'change', @save
          @listenTo @formView, 'complete', @completed
          @listenTo @formView, 'close', @close
          @listenTo @formView, 'discard', @removeResponse
        else
          @formView = forms.instantiateView(form.views.detail, { ctx: @ctx })

        # Add form view
        @$("#contents").append(@formView.el)

        if not @auth.update("responses", response)
          @$("#edit_button").hide()

        @formView.load @response.data

        if @auth.remove("responses", @response)
          @setupContextMenu [
            { glyph: 'remove', text: "Delete Survey", click: => @removeResponse() }
          ] 

  events:
    "click #edit_button" : "edit"

  activate: ->
    # Do not reload as form may have launched another page
    # and needs to keep its state

  destroy: ->
    # Let know that saved if closed incompleted
    if @response and not @response.completed
      @pager.flash "Survey saved as draft."

  edit: ->
    # Mark as incomplete
    @response.completed = null
    @db.responses.upsert @response, => @render()

  save: =>
    # Save to db
    @response.data = @formView.save()
    @db.responses.upsert(@response)

  close: ->
    @save()
    @pager.closePage()

  completed: =>
    # Mark as completed
    @response.data = @formView.save()
    @response.completed = new Date().toISOString()

    @db.responses.upsert(@response)
    @pager.closePage()
    @pager.flash "Survey completed successfully", "success"

  removeResponse: ->
    if @auth.remove("responses", @response) and confirm("Permanently delete survey?")
      @db.responses.remove @response._id, =>
        @response = null
        @pager.closePage()
        @pager.flash "Survey deleted", "warning"

module.exports = SurveyPage