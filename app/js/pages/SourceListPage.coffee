Page = require("../Page")

module.exports = class SourceListPage extends Page
  events: 
    'click tr.tappable' : 'sourceClicked'

  create: ->
    @$el.html templates['pages/SourceListPage']()
    @setTitle 'Nearby Sources'

  activate: ->
    rows = ({ name: 'test'} for x in [1..10])
    @$("#table").html templates['pages/SourceListPage_item'](rows:rows)

  sourceClicked: (ev) ->
    console.log ev
    @ctx.pager.openPage(require("./SourcePage"))
