LocationFinder = require './LocationFinder'
GeoJSON = require './GeoJSON'

# Shows the relative location of a point and allows setting it
class LocationView extends Backbone.View
  constructor: (options) ->
    super()
    @loc = options.loc
    @settingLocation = false
    @locationFinder = options.locationFinder || new LocationFinder()

    # Listen to location events
    @listenTo(@locationFinder, 'found', @locationFound)
    @listenTo(@locationFinder, 'error', @locationError)

    # Start tracking location if set
    if @loc
      @locationFinder.startWatch()

    @render()

  events:
    'click #location_map' : 'mapClicked'
    'click #location_set' : 'setLocation'

  remove: ->
    @locationFinder.stopWatch()
    super()

  render: ->
    @$el.html templates['LocationView']()

    # Set location string
    if @errorFindingLocation
      @$("#location_relative").text("Cannot find location")
    else if not @loc and not @settingLocation 
      @$("#location_relative").text("Unspecified location")
    else if @settingLocation
      @$("#location_relative").text("Setting location...")
    else if not @currentLoc
      @$("#location_relative").text("Waiting for GPS...")
    else
      @$("#location_relative").text(GeoJSON.getRelativeLocation(@currentLoc, @loc))

    # Disable map if location not set
    @$("#location_map").attr("disabled", not @loc);

    # Disable set if setting
    @$("#location_set").attr("disabled", @settingLocation == true);    

  setLocation: ->
    @settingLocation = true
    @errorFindingLocation = false
    @locationFinder.startWatch()
    @render()

  locationFound: (pos) =>
    if @settingLocation
      @settingLocation = false
      @errorFindingLocation = false

      # Set location
      @loc = GeoJSON.posToPoint(pos)
      @trigger('locationset', @loc)

    @currentLoc = GeoJSON.posToPoint(pos)
    @render()

  locationError: =>
    @settingLocation = false
    @errorFindingLocation = true
    @render()


module.exports = LocationView