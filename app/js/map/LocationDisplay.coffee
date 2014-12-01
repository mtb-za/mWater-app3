LocationFinder = require("mwater-forms").LocationFinder


# Displays current location as a blue dot
module.exports = class LocationDisplay
  # Setup display
  constructor: (map) ->
    @map = map

    @locationFinder = new LocationFinder()
    @locationFinder.on('found', @locationFound).on('error', @locationError)
    @locationFinder.startWatch()

  stop: ->
    @locationFinder.stopWatch()

  removeMarker: ->
    # Remove marker
    if @meMarker
      @map.removeLayer(@meMarker)
      @meMarker = null

    if @meCircle
      @map.removeLayer(@meCircle)
      @meCircle = null

  locationError: (e) =>
    @removeMarker()

  locationFound: (e) =>
    radius = e.coords.accuracy
    latlng = new L.LatLng(e.coords.latitude, e.coords.longitude)

    # Radius larger than 1km means no location worth displaying
    if radius > 1000
      @removeMarker()
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

