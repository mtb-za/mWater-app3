LocationFinder = require '../LocationFinder'


# Displays current location as a blue dot
module.exports = class LocationDisplay
  # Setup display, optionally zooming to current location
  constructor: (map, zoomTo) ->
    @map = map
    @zoomTo = zoomTo

    @locationFinder = new LocationFinder()
    @locationFinder.on('found', @locationFound).on('error', @locationError)
    @locationFinder.startWatch()

  stop: ->
    @locationFinder.stopWatch()

  locationError: (e) =>
    if @zoomTo
      @map.fitWorld()
      @zoomTo = false
      alert("Unable to determine location")

  locationFound: (e) =>
    radius = e.coords.accuracy
    latlng = new L.LatLng(e.coords.latitude, e.coords.longitude)

    # Set position once
    if @zoomTo
      zoom = 15
      @map.setView(latlng, zoom)
      @zoomTo = false

    # Radius larger than 1km means no location worth displaying
    if radius > 1000
      return

    # Setup marker and circle
    if not @meMarker
      icon =  L.icon(iconUrl: "img/my_location.png", iconSize: [22, 22])
      @meMarker = L.marker(latlng, icon:icon).addTo(@map)
      @meCircle = L.circle(latlng, radius)
      @meCircle.addTo(@map)
    else
      @meMarker.setLatLng(latlng)
      @meCircle.setLatLng(latlng).setRadius(radius)

