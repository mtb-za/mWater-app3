Page = require("../Page")
TestPage = require("./TestPage")
NewTestPage = require("./NewTestPage")

module.exports = class TestListPage extends Page
  @canOpen: (ctx) -> ctx.login?

  events: 
    'click tr.tappable' : 'testClicked'

  create: ->
    @$el.html require('./TestListPage.hbs')()
    @setTitle T('Recent Tests')

  activate: ->
    @setupButtonBar [
      { icon: "plus.png", click: => @addTest() }
    ]

    # Query database for recent, completed tests
    recent = new Date()
    recent.setDate(recent.getDate() - 30)

    @db.tests.find({completed: { $gt:recent.toISOString() }, user: @login.user }, {sort:[['started','desc']]}).fetch (tests) =>
      @$("#recent_table").html require('./TestListPage_items.hbs')(tests:tests)

      # Fill in test names
      _.defer => # Defer to allow html to render
        for test in tests
          @db.forms.findOne { code:test.type }, { mode: "local" }, (form) =>
            @$("#name_"+test._id).text(if form then form.name else "???")

    @db.tests.find({ completed: null, user: @login.user }, {sort:[['started','desc']]}).fetch (tests) =>
      @$("#incomplete_table").html require('./TestListPage_items.hbs')(tests:tests)

      # Fill in test names
      _.defer => # Defer to allow html to render
        for test in tests
          @db.forms.findOne { code:test.type }, { mode: "local" }, (form) =>
            @$("#name_"+test._id).text(if form then form.name else "???")

  testClicked: (ev) ->
    @pager.openPage(TestPage, {_id: ev.currentTarget.id})

  addTest: ->
    @pager.openPage(NewTestPage)