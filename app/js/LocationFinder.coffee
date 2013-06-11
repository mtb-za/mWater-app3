# Improved location finder
class LocationFinder
  constructor: ->
    _.extend(@, Backbone.Events)

  getLocation: ->
    # Both failures are required to trigger error
    locationError = _.after 2, =>
      @trigger 'locationerror'

    highAccuracyFired = false

    lowAccuracy = (pos) =>
      if not highAccuracyFired
        @trigger 'locationfound', pos

    highAccuracy = (pos) =>
      highAccuracyFired = true
      @trigger 'locationfound', pos

    # Get both high and low accuracy, as low is sufficient for initial display
    navigator.geolocation.getCurrentPosition(lowAccuracy, locationError, {
        maximumAge : 3600*24,
        timeout : 10000,
        enableHighAccuracy : false
    })

    navigator.geolocation.getCurrentPosition(highAccuracy, locationError, {
        maximumAge : 3600,
        timeout : 30000,
        enableHighAccuracy : true
    })

  startWatch: ->
    highAccuracyFired = false
    lowAccuracyFired = false

    lowAccuracy = (pos) =>
      if not highAccuracyFired
        lowAccuracyFired = true
        @trigger 'locationfound', pos

    # Fire initial low-accuracy one
    navigator.geolocation.getCurrentPosition(lowAccuracy, null, {
        maximumAge : 3600*24,
        timeout : 10000,
        enableHighAccuracy : false
    })

    success = (pos) =>
      highAccuracyFired = true
      @trigger 'locationfound', pos      

    error = (error) =>
      # No error if fired once
      if not lowAccuracyFired and not highAccuracyFired
        @trigger 'locationerror', error

    @locationWatchId = navigator.geolocation.watchPosition(success, error, {
        maximumAge : 3000,
        enableHighAccuracy : true
    })  

  stopWatch: ->
    navigator.geolocation.clearWatch(@locationWatchId);


module.exports = LocationFinder  