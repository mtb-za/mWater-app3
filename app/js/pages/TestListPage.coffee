Page = require("../Page")
TestPage = require("./TestPage")
NewTestPage = require("./NewTestPage")

module.exports = class TestListPage extends Page
  @canOpen: (ctx) -> ctx.login.user

  events: 
    'click tr.tappable' : 'testClicked'

  create: ->
    @$el.html templates['pages/TestListPage']()
    @setTitle 'Recent Tests'

  activate: ->
    @setupButtonBar [
      { icon: "plus.png", click: => @addTest() }
    ]

    # Query database for recent, completed tests
    recent = new Date()
    recent.setDate(recent.getDate() - 30)

    @db.tests.find({completed: { $gt:recent.toISOString() }, user: @login.user }).fetch (tests) =>
      @$("#recent_table").html templates['pages/TestListPage_items'](tests:tests)

      # Fill in test names
      for test in tests
        @db.forms.findOne { code:test.type }, { mode: "local" }, (form) =>
          @$("#name_"+test._id).text(form.name)

    @db.tests.find({ completed: null, user: @login.user }).fetch (tests) =>
      @$("#incomplete_table").html templates['pages/TestListPage_items'](tests:tests)

      # Fill in test names
      for test in tests
        @db.forms.findOne { code:test.type }, { mode: "local" }, (form) =>
          @$("#name_"+test._id).text(form.name if form else "???")

  testClicked: (ev) ->
    @pager.openPage(TestPage, {_id: ev.currentTarget.id})

  addTest: ->
    @pager.openPage(NewTestPage)