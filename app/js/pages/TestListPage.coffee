Page = require("../Page")

module.exports = class TestListPage extends Page
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
    # TODO filter to recent by user
    @db.tests.find({completed: {$ne: null}}).fetch (tests) ->
      @$("#recent_table").html templates['pages/TestListPage_items'](tests:tests)

    @db.tests.find({completed: null}).fetch (tests) ->
      @$("#incomplete_table").html templates['pages/TestListPage_items'](tests:tests)

  testClicked: (ev) ->
    @pager.openPage(require("./TestPage"), {_id: ev.currentTarget.id})

  addTest: ->
    @pager.openPage(require("./NewTestPage"))
