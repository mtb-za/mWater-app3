Page = require("../Page")

class SourceMapPage extends Page
  create: ->
    @setTitle "Source Map"

    # Calculate height
    @$el.html templates['pages/SourceMapPage']()

    L.Icon.Default.imagePath = "images"
    @map = L.map(this.$("#map")[0])
    @resizeMap()

    # Recalculate on resize
    $(window).on('resize', @resizeMap)

    # Setup map tiles
    mapquestUrl = 'http://{s}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png'
    subDomains = ['otile1','otile2','otile3','otile4']
    mapquestAttrib = 'Data, imagery and map information provided by <a href="http://open.mapquest.co.uk" target="_blank">MapQuest</a>, <a href="http://www.openstreetmap.org/" target="_blank">OpenStreetMap</a> and contributors.'
    mapquest = new L.TileLayer(mapquestUrl, {maxZoom: 18, attribution: mapquestAttrib, subdomains: subDomains});
    mapquest.addTo(@map)

    @map.on('locationfound', @locationFound)
    @map.on('locationerror', @locationError)
    @map.locate(watch:true, enableHighAccuracy: true)

  destroy: ->
    $(window).off('resize', @resizeMap)
    @map.stopLocate()

  resizeMap: =>
    # Calculate map height
    mapHeight = $("html").height() - 40
    $("#map").css("height", mapHeight + "px")
    @map.invalidateSize()

  locationError: (e) =>
    if not @locationZoomed
      @map.fitWorld()
      alert("Unable to determine location")
      @locationZoomed = true

  locationFound: (e) =>
    radius = e.accuracy / 2

    # Set position once
    if not @locationZoomed
      zoom = Math.min(@map.getBoundsZoom(e.bounds), 16)
      @map.setView(e.latlng, zoom)
      @locationZoomed = true

    # Setup marker and circle
    if not @meMarker
      icon =  L.icon(iconUrl: "img/my_location.png", iconSize: [22, 22])
      @meMarker = L.marker(e.latlng, icon:icon).addTo(@map)
      @meCircle = L.circle(e.latlng, radius)
      @meCircle.addTo(@map)
    else
      @meMarker.setLatLng(e.latlng)
      @meCircle.setLatLng(e.latlng).setRadius(radius)


module.exports = SourceMapPage