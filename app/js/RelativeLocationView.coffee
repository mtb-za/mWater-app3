LocationFinder = require("mwater-forms").LocationFinder
utils = require('mwater-forms').utils

# Shows the relative location of a location with compass if available
# Fires event map when user clicks on Map button
# options showMap is true to show map button
module.exports = class RelativeLocationView extends Backbone.View
  constructor: (options) ->
    super()

    @hasBeenRemoved = false

    @loc = options.loc
    @showMap = options.showMap
    @locationFinder = options.locationFinder || new LocationFinder({storage: @storage})

    # Listen to location events
    @listenTo(@locationFinder, 'found', @locationFound)
    @listenTo(@locationFinder, 'error', @locationError)

    # Start tracking location 
    @locationFinder.startWatch()

    # Start listening to compass
    if navigator.compass
      @compassWatchId = navigator.compass.watchHeading(@compassSuccess, @compassError)

    @$el.html require('./RelativeLocationView.hbs')()

    @render()

  events:
    'click #location_map' : 'mapClicked'

  remove: ->
    @hasBeenRemoved = true
    @locationFinder.stopWatch()
    if @compassWatchId
      navigator.compass.clearWatch(@compassWatchId)
    super()

  compassSuccess: (data) =>
    @compassAngle = data.magneticHeading
    @render()

  compassError: =>
    @compassAngle = null
    @render()

  render: ->
    if @hasBeenRemoved
      return

    # Set location string
    strength = utils.calculateGPSStrength(@currentPos)
    if strength != "none"
      relativeLocation = utils.getRelativeLocation(@currentPos.coords, @loc)
      text = utils.formatRelativeLocation(relativeLocation, T)
    else
      text = ""
    
    @$("#location_relative").text(text)

    if @currentPosError
      @$("#gps_strength").text(T("GPS not available"))
    else
      strength = utils.formatGPSStrength(@currentPos, T)
      @$("#gps_strength").attr("class", strength.class)
      @$("#gps_strength").text strength.text

    absText = T("Lat/lng: ") + "#{this.loc.latitude.toFixed(6)}, #{this.loc.longitude.toFixed(6)}"
    if @loc.accuracy?
      absText += " \u00B1#{this.loc.accuracy.toFixed(0)} m"
    @$("#location_absolute").text(absText)
    

    # Hide map if hidden
    @$("#location_map").toggle(@showMap)

    # Update compass direction
    if @compassAngle? and @currentPos
      relativeLocation = utils.getRelativeLocation(@currentPos.coords, @loc)

      angle = Math.round((relativeLocation.angle - @compassAngle + 360) % 360)
      @$("#pointer").css("transform", "rotate(#{angle}deg)")
      @$("#pointer").css("-webkit-transform", "rotate(#{angle}deg)")
      @$("#pointer").css("-ms-transform", "rotate(#{angle}deg)")
      @$("#pointer").css("-o-transform", "rotate(#{angle}deg)")
      @$("#pointer").css("-moz-transform", "rotate(#{angle}deg)")
      @$("#pointer").show()
    else
      @$("#pointer").hide()
      
  locationFound: (pos) =>
    @currentPos = pos
    @currentPosError = null
    @render()

  locationError: (err) =>
    @currentPosError = err
    @render()

  mapClicked: =>
    @trigger('map', @loc)

