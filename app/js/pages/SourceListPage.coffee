Page = require("../Page")

module.exports = class SourceListPage extends Page
  events: 
    'click tr.tappable' : 'sourceClicked'

  create: ->
    @$el.html templates['pages/SourceListPage']()
    @setTitle 'Nearby Sources'

  activate: ->
    # TODO? @template '#table', 'pages/SourceListPage_item', { rows: sources }
    # Query database TODO $near
    @db.sources.find({}).fetch (sources) ->
      @$("#table").html templates['pages/SourceListPage_item'](sources:sources)

  sourceClicked: (ev) ->
    @pager.openPage(require("./SourcePage"), ev.currentTarget.id)

