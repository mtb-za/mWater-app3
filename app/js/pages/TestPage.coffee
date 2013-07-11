Page = require "../Page"
forms = require '../forms'

class TestPage extends Page
  @canOpen: (ctx) -> ctx.auth.update("tests") && ctx.auth.insert("tests") 

  create: -> @render()

  activate: ->
    @setupContextMenu [
      { glyph: 'remove', text: "Delete Test", click: => @deleteTest() }
    ]

  render: ->
    @setTitle "Test" # TODO nicer title

    # Get test
    @db.tests.findOne {_id: @options._id}, (test) =>
      @test = test

      # Get form
      @db.forms.findOne { type: "WaterTest", code: test.type }, (form) =>
        # Check if completed
        if not test.completed
          @formView = forms.instantiateView(form.views.edit, { ctx: @ctx })

          # Listen to events
          @listenTo @formView, 'change', @save
          @listenTo @formView, 'complete', @completed
          @listenTo @formView, 'close', @close
        else
          @formView = forms.instantiateView(form.views.detail, { ctx: @ctx })
  
        # TODO disable if non-editable
        @$el.html templates['pages/TestPage'](completed: test.completed, title: form.name)
        @$('#contents').append(@formView.el)

        @formView.load @test

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
    @test = @formView.save()
    @db.tests.upsert(@test)

  close: =>
    @save()
    @pager.closePage()

  completed: =>
    # Mark as completed
    @test.completed = new Date().toISOString()
    @db.tests.upsert @test, => @render()

  deleteTest: ->
    if confirm("Permanently delete test?")
      @db.tests.remove @test._id, =>
        @test = null
        @pager.closePage()
        @pager.flash "Test deleted", "success"

module.exports = TestPage