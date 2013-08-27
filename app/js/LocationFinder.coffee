# Improved location finder
class LocationFinder
  constructor: ->
    _.extend @, Backbone.Events

  cacheLocation = (pos) ->
    window.localStorage['LocationFinder.lastPosition'] = JSON.stringify(pos)

  getCachedLocation = () ->
    if window.localStorage['LocationFinder.lastPosition']
      pos = JSON.parse(window.localStorage['LocationFinder.lastPosition'])

      # Check that valid position (unreproducible bug)
      if not pos.coords
        return

      # Accuracy is down since cached
      pos.coords.accuracy = 10000 # 10 km
      return pos
    
  getLocation: (success, error) ->
    # If no geolocation, send error immediately
    if not navigator.geolocation
      error("No geolocation available")
      return

    # Both failures are required to trigger error
    triggerLocationError = _.after 2, =>
      error()

    locationError = (err) =>
      console.error "Location error: #{err}"
      triggerLocationError()

    lowAccuracyFired = false
    highAccuracyFired = false

    lowAccuracy = (pos) =>
      if not highAccuracyFired
        lowAccuracyFired = true
        cacheLocation(pos)
        success(pos)

    highAccuracy = (pos) =>
      highAccuracyFired = true
      cacheLocation(pos)
      success(pos)

    # Get both high and low accuracy, as low is sufficient for initial display
    navigator.geolocation.getCurrentPosition(lowAccuracy, locationError, {
        maximumAge : 3600*24,
        timeout : 30000,
        enableHighAccuracy : false
    })

    navigator.geolocation.getCurrentPosition(highAccuracy, locationError, {
        maximumAge : 3600,
        timeout : 60000,
        enableHighAccuracy : true
    })

    # Fire stored one within short time
    setTimeout =>
      cachedLocation = getCachedLocation()
      if cachedLocation and not lowAccuracyFired and not highAccuracyFired
        success(cachedLocation)
    , 250

  startWatch: ->
    # If no geolocation, send error immediately
    if not navigator.geolocation
      error("No geolocation available")
      return

    # Allow one watch at most
    if @locationWatchId?
      @stopWatch()

    highAccuracyFired = false
    lowAccuracyFired = false
    cachedFired = false

    lowAccuracy = (pos) =>
      if not highAccuracyFired
        lowAccuracyFired = true
        cacheLocation(pos)
        @trigger 'found', pos

    lowAccuracyError = (err) =>
      # No error if low or high fired once
      if not lowAccuracyFired and not highAccuracyFired
        @trigger 'error', err

    highAccuracy = (pos) =>
      console.log "High accuracy location: " + JSON.stringify(pos)
      highAccuracyFired = true
      cacheLocation(pos)
      @trigger 'found', pos

    highAccuracyError = (err) =>
      console.error "High accuracy location error: #{err}"
      @trigger 'error'

    # Fire initial low-accuracy one
    navigator.geolocation.getCurrentPosition(lowAccuracy, lowAccuracyError, {
        maximumAge : 3600,
        timeout : 30000,
        enableHighAccuracy : false
    })

    @locationWatchId = navigator.geolocation.watchPosition(highAccuracy, highAccuracyError, {
        enableHighAccuracy : true
    })  

    # Fire stored one within short time
    setTimeout =>
      cachedLocation = getCachedLocation()
      if cachedLocation and not lowAccuracyFired and not highAccuracyFired
        cachedFired = true
        @trigger 'found', cachedLocation
    , 500

  stopWatch: ->
    console.log "Stopping watch"
    if @locationWatchId?
      navigator.geolocation.clearWatch(@locationWatchId)
      @locationWatchId = undefined

module.exports = LocationFinder  