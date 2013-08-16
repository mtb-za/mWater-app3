Page = require "../Page"
forms = require '../forms'

class TestPage extends Page
  create: -> @render()

  render: ->
    @setTitle "Water Test"

    # Get test
    @db.tests.findOne {_id: @options._id}, (test) =>
      if not test
        alert("Test not found")
        return @pager.closePage()

      @test = test

      if @auth.remove("tests", @test)
        @setupContextMenu [ { glyph: 'remove', text: "Delete Test", click: => @deleteTest() } ]
      else 
        @setupContextMenu [ ]

      # Get form
      @db.forms.findOne { type: "WaterTest", code: test.type }, (form) =>
        # Check if not completed and editable
        if not test.completed and @auth.update("tests", test)
          @formView = forms.instantiateView(form.views.edit, { ctx: @ctx })

          # Listen to events
          @listenTo @formView, 'change', @save
          @listenTo @formView, 'complete', @completed
          @listenTo @formView, 'close', @close
        else
          @formView = forms.instantiateView(form.views.detail, { ctx: @ctx })
  
        @$el.html templates['pages/TestPage'](form: form, test: test)
        @$('#contents').append(@formView.el)

        if not @auth.update("tests", test)
          @$("#edit_button").hide()

        @formView.load @test.data

  events:
    "click #edit_button" : "edit"

  destroy: ->
    # Let know that saved if closed incompleted
    if @test and not @test.completed
      @pager.flash "Test saved as draft."

  edit: ->
    # Mark as incomplete
    @test.completed = null
    @db.tests.upsert @test, => @render()

  save: =>
    # Save to db
    @test.data = @formView.save()
    @db.tests.upsert(@test)

  close: =>
    @save()
    @pager.closePage()

  completed: =>
    # Mark as completed
    @test.data = @formView.save()
    @test.completed = new Date().toISOString()
    @db.tests.upsert @test, => @render()

  deleteTest: ->
    if confirm("Permanently delete test?")
      @db.tests.remove @test._id, =>
        @test = null
        @pager.closePage()
        @pager.flash "Test deleted", "success"

module.exports = TestPage