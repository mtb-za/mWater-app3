Page = require("../Page")

module.exports = class SourceListPage extends Page
  events: 
    'click tr.tappable' : 'sourceClicked'

  create: ->
    @$el.html templates['pages/SourceListPage']()
    @setTitle 'Nearby Sources'

  activate: ->
    # Find location
    # Query database 
    @db.sources.find({}).fetch (sources) ->
      @$("#table").html templates['pages/SourceListPage_item'](sources:sources)

  sourceClicked: (ev) ->
    @pager.openPage(require("./SourcePage"), ev.currentTarget.id)

