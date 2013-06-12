Page = require("../Page")
LocationFinder = require '../LocationFinder'

# TODO source search

module.exports = class SourceListPage extends Page
  events: 
    'click tr.tappable' : 'sourceClicked'

  create: ->
    @$el.html templates['pages/SourceListPage']()
    @setTitle 'Nearby Sources'

  activate: ->
    # Find location
    @locationFinder = new LocationFinder()
    @locationFinder.on('found', @locationFound).on('error', @locationError)
    @locationFinder.getLocation()
    @$("#location_msg").show()

  locationFound: (pos) =>
    @$("#location_msg").hide()
    selector = geo: 
        $near: 
          $geometry: 
            type: 'Point'
            coordinates: [pos.coords.longitude, pos.coords.latitude]

    # Query database 
    @db.sources.find(selector).fetch (sources) ->
      @$("#table").html templates['pages/SourceListPage_item'](sources:sources)

  locationError: (pos) =>
    @$("#location_msg").hide()
    alert "Unable to determine location"

  sourceClicked: (ev) ->
    @pager.openPage(require("./SourcePage"), ev.currentTarget.id)

