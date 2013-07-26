Page = require "../Page"
SourcePage = require "./SourcePage"
ItemTracker = require "../ItemTracker"
LocationFinder = require '../LocationFinder'
GeoJSON = require '../GeoJSON'

# Map of water sources. Options include:
# initialGeo: Geometry to zoom to. Point only supported.
class SourceMapPage extends Page
  create: ->
    @setTitle "Source Map"

    # Calculate height
    @$el.html templates['pages/SourceMapPage']()

    L.Icon.Default.imagePath = "img/leaflet"
    @map = L.map(this.$("#map")[0])
    L.control.scale(imperial:false).addTo(@map)
    @resizeMap()

    # Recalculate on resize
    $(window).on('resize', @resizeMap)

    # Setup map tiles
    setupMapTiles().addTo(@map)

    # Setup marker display when map is loaded
    @map.whenReady =>
      @sourceDisplay = new SourceDisplay(@map, @db, @pager)

      # Update on map movement
      @map.on 'moveend', =>
        @sourceDisplay.updateMarkers()

    # TODO zoom to last known bounds
    
    # Setup initial zoom
    if @options.initialGeo and @options.initialGeo.type=="Point"
      @map.setView(L.GeoJSON.coordsToLatLng(@options.initialGeo.coordinates), 15)

    # Setup localtion display
    @locationDisplay = new LocationDisplay(@map, not @options.initialGeo?)

  activate: ->
    # Update markers
    if @sourceDisplay
      @sourceDisplay.updateMarkers()

  destroy: ->
    $(window).off('resize', @resizeMap)
    @locationDisplay.stop()

  resizeMap: =>
    # Calculate map height
    mapHeight = $("html").height() - 40
    $("#map").css("height", mapHeight + "px")
    @map.invalidateSize()


setupMapTiles = ->
  mapquestUrl = 'http://{s}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png'
  subDomains = ['otile1','otile2','otile3','otile4']
  mapquestAttrib = 'Data, imagery and map information provided by <a href="http://open.mapquest.co.uk" target="_blank">MapQuest</a>, <a href="http://www.openstreetmap.org/" target="_blank">OpenStreetMap</a> and contributors.'
  return new L.TileLayer(mapquestUrl, {maxZoom: 18, attribution: mapquestAttrib, subdomains: subDomains})

# Displays water sources on map. Call updateMarkers to refresh
class SourceDisplay
  constructor: (map, db, pager) ->
    @map = map
    @db = db
    @pager = pager
    @itemTracker = new ItemTracker()

    @sourceMarkers = {}

    @icon = new L.icon
      iconUrl: 'img/DropMarker.png'
      iconRetinaUrl: 'img/DropMarker@2x.png'
      iconSize: [27, 41],
      iconAnchor: [13, 41]
      popupAnchor: [-3, -41]
  
  updateMarkers: =>
    # Get bounds padded
    bounds = @map.getBounds()
    if not bounds.isValid()
      return
    if bounds.getWest() == bounds.getEast()
      return
    if bounds.getNorth() == bounds.getSouth()
      return

    bounds = bounds.pad(0.33)
    boundsGeoJSON = GeoJSON.latLngBoundsToGeoJSON(bounds)

    # Spherical Polygons must fit within a hemisphere.
    # Any geometry specified with GeoJSON to $geoIntersects or $geoWithin queries, must fit within a single hemisphere.
    # MongoDB interprets geometries larger than half of the sphere as queries for the smaller of the complementary geometries.
    # So... don't bother intersection if large
    if (boundsGeoJSON.coordinates[0][2][0] - boundsGeoJSON.coordinates[0][0][0]) >= 180
      selector = {}
    else if (boundsGeoJSON.coordinates[0][2][1] - boundsGeoJSON.coordinates[0][0][1]) >= 180
      selector = {}
    else
      selector = { geo: { $geoIntersects: { $geometry: boundsGeoJSON } } }

    # Query sources with projection. Use remote mode so no caching occurs
    @db.sources.find(selector, { sort: ["_id"], limit: 100, mode: "remote", fields: { geo: 1 } }).fetch (sources) =>
      # Find out which to add/remove
      [adds, removes] = @itemTracker.update(sources)

      # Remove old markers
      for remove in removes
        @removeSourceMarker(remove)
      for add in adds
        @addSourceMarker(add)

  addSourceMarker: (source) ->
    if source.geo?
      latlng = new L.LatLng(source.geo.coordinates[1], source.geo.coordinates[0])
      marker = new L.Marker(latlng, {icon:@icon})
      
      marker.on 'click', =>
        @pager.openPage(SourcePage, {_id: source._id})
      
      @sourceMarkers[source._id] = marker
      marker.addTo(@map)

  removeSourceMarker: (source) ->
    if _.has(@sourceMarkers, source._id)
      @map.removeLayer(@sourceMarkers[source._id])


class LocationDisplay
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

module.exports = SourceMapPage