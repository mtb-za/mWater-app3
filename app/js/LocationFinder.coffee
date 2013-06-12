# Improved location finder
class LocationFinder
  constructor: (success, error) ->
    @success = success
    @error = error

  getLocation: ->
    # Both failures are required to trigger error
    locationError = _.after 2, =>
      if @error? then @error()

    highAccuracyFired = false

    lowAccuracy = (pos) =>
      if not highAccuracyFired
        @success(pos)

    highAccuracy = (pos) =>
      highAccuracyFired = true
      @success(pos)

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
    # Allow one watch at most
    if @locationWatchId?
      return

    highAccuracyFired = false
    lowAccuracyFired = false

    lowAccuracy = (pos) =>
      if not highAccuracyFired
        lowAccuracyFired = true
        @success(pos)

    # Fire initial low-accuracy one
    navigator.geolocation.getCurrentPosition(lowAccuracy, null, {
        maximumAge : 3600*24,
        timeout : 10000,
        enableHighAccuracy : false
    })

    success = (pos) =>
      highAccuracyFired = true
      @success(pos)

    error = (error) =>
      # No error if fired once
      if not lowAccuracyFired and not highAccuracyFired
        if @error? then @error(error)

    @locationWatchId = navigator.geolocation.watchPosition(success, error, {
        maximumAge : 3000,
        enableHighAccuracy : true
    })  

  stopWatch: ->
    if @locationWatchId?
      navigator.geolocation.clearWatch(@locationWatchId);
      @locationWatchId = undefined


module.exports = LocationFinder  