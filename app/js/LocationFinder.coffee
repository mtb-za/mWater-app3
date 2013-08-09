# Improved location finder
class LocationFinder
  constructor: ->
    _.extend @, Backbone.Events
    
  getLocation: ->
    # Both failures are required to trigger error
    locationError = _.after 2, =>
      @trigger 'error'

    highAccuracyFired = false

    lowAccuracy = (pos) =>
      if not highAccuracyFired
        @trigger 'found', pos

    highAccuracy = (pos) =>
      highAccuracyFired = true
      @trigger 'found', pos

    # Get both high and low accuracy, as low is sufficient for initial display
    navigator.geolocation.getCurrentPosition(lowAccuracy, locationError, {
        maximumAge : 3600*24,
        timeout : 30000,
        enableHighAccuracy : false
    })

    navigator.geolocation.getCurrentPosition(highAccuracy, locationError, {
        maximumAge : 3600,
        timeout : 30000,
        enableHighAccuracy : true
    })

  startWatch: ->
    # Allow one watch at most
    if @locationWatchId?
      @stopWatch()

    highAccuracyFired = false
    lowAccuracyFired = false

    lowAccuracy = (pos) =>
      if not highAccuracyFired
        lowAccuracyFired = true
        @trigger 'found', pos

    highAccuracy = (pos) =>
      highAccuracyFired = true
      @trigger 'found', pos

    error = (error) =>
      # No error if fired once
      if not lowAccuracyFired and not highAccuracyFired
        @trigger 'error', error

    # Fire initial low-accuracy one
    navigator.geolocation.getCurrentPosition(lowAccuracy, error, {
        maximumAge : 3600*24,
        timeout : 30000,
        enableHighAccuracy : false
    })

    @locationWatchId = navigator.geolocation.watchPosition(highAccuracy, error, {
        maximumAge : 3000,
        enableHighAccuracy : true
    })  

  stopWatch: ->
    if @locationWatchId?
      navigator.geolocation.clearWatch(@locationWatchId)
      @locationWatchId = undefined


module.exports = LocationFinder  