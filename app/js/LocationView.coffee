LocationFinder = require './LocationFinder'
GeoJSON = require './GeoJSON'

# Shows the relative location of a point and allows setting it
class LocationView extends Backbone.View
  constructor: (options) ->
    super()
    @loc = options.loc
    @setLocation = options.setLocation
    @locationFinder = options.locationFinder

    # Listen to location events
    @locationFinder.on('found', @locationFound)
    @locationFinder.on('error', @locationError)

    @locationFinder.startWatch()
    # Start tracking location if set or setting
    if @loc or @setLocation
      @locationFinder.startWatch()

    @render()

  events:
    'click #location_map' : 'mapClicked'
    'click #location_set' : 'setClicked'

  remove: ->
    super()
    @locationFinder.stopWatch()

  render: ->
    @$el.html templates['LocationView']()

    # Set location string
    if @errorFindingLocation
      @$("#location_relative").text("Cannot find location")
    else if not @loc and not @setLocation 
      @$("#location_relative").text("Unspecified location")
    else if @setLocation
      @$("#location_relative").text("Setting location...")
    else
      # TODO

    # Disable map if location not set
    @$("#location_map").attr("disabled", not @loc);

  setClicked: ->
    @setLocation = true
    @errorFindingLocation = false
    @locationFinder.startWatch()
    @render()

  locationFound: (pos) =>
    if @setLocation
      # Set location
      @loc = GeoJSON.posToPoint(pos)
      @trigger('locationset', @loc)
      @render()

  locationError: =>
    @setLocation = false
    @errorFindingLocation = true
    @render()


module.exports = LocationView