Page = require("../Page")
DiarrCasePage = require("./DiarrCasePage")

module.exports = class DiarrListPage extends Page
  @canOpen: (ctx) -> ctx.login?

  events: 
    'click tr.tappable' : 'diarrCaseClicked'

  create: ->
    @$el.html templates['pages/DiarrCaseListPage']()
    @setTitle 'Recent Cases'

  activate: ->
    @setupButtonBar [
      { icon: "plus.png", click: => @addDiarrCase() }
    ]

    # Query database for recent, completed tests
    recent = new Date()
    recent.setDate(recent.getDate() - 30)

    @db.diarr_cases.find().fetch (diarrCases) =>
      @$("#recent_table").html templates['pages/DiarrCaseListPage_items'](diarrCases:diarrCases)

  diarrCaseClicked: (ev) ->
    @pager.openPage(DiarrCasePage, {_id: ev.currentTarget.id})

  addDiarrCase: ->
    @pager.openPage(DiarrCasePage)