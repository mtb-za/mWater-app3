Page = require("../Page")
LocationFinder = require '../LocationFinder'
GeoJSON = require '../GeoJSON'

# TODO source search

module.exports = class SourceListPage extends Page
  events: 
    'click tr.tappable' : 'sourceClicked'

  create: ->
    @setTitle 'Nearby Sources'

  activate: ->
    @$el.html templates['pages/SourceListPage']()
    @nearSources = []
    @unlocatedSources = []

    # Find location
    @locationFinder = new LocationFinder()
    @locationFinder.on('found', @locationFound).on('error', @locationError)
    @locationFinder.getLocation()
    @$("#location_msg").show()

    @setupButtonBar [
      { icon: "plus-32.png", click: => @addSource() }
    ]

    # Query database for unlocated sources # TODO only by user
    @db.sources.find(geo: {$exists:false}).fetch (sources) =>
      @unlocatedSources = sources
      @renderList()

  addSource: ->
    @pager.openPage(require("./NewSourcePage"))
    
  locationFound: (pos) =>
    @$("#location_msg").hide()
    selector = geo: 
        $near: 
          $geometry: GeoJSON.posToPoint(pos)

    # Query database for near sources
    @db.sources.find(selector).fetch (sources) =>
      @nearSources = sources
      @renderList()

  renderList: ->
    # Append located and unlocated sources
    sources = @unlocatedSources.concat(@nearSources)
    @$("#table").html templates['pages/SourceListPage_items'](sources:sources)

  locationError: (pos) =>
    @$("#location_msg").hide()
    @pager.flash "Unable to determine location", "error"

  sourceClicked: (ev) ->
    @pager.openPage(require("./SourcePage"), { _id: ev.currentTarget.id})

