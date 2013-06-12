Page = require "../Page"
SourcePage = require "../pages/SourcePage"
ItemTracker = require "../ItemTracker"
LocationFinder = require '../LocationFinder'
GeoJSON = require '../GeoJSON'

class SourceMapPage extends Page
  create: ->
    @setTitle "Source Map"

    # Calculate height
    @$el.html templates['pages/SourceMapPage']()

    L.Icon.Default.imagePath = "img/leaflet/"
    @map = L.map(this.$("#map")[0])
    L.control.scale(imperial:false).addTo(@map)
    @resizeMap()

    # Recalculate on resize
    $(window).on('resize', @resizeMap)

    # Setup map tiles
    setupMapTiles().addTo(@map)

    # TODO zoom to last known bounds

    # Setup localtion display
    @locationDisplay = new LocationDisplay(@map)

    # Setup marker display
    @sourceDisplay = new SourceDisplay(@map, @db, @pager)

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

class SourceDisplay
  constructor: (map, db, pager) ->
    @map = map
    @db = db
    @pager = pager
    @itemTracker = new ItemTracker()

    @sourceMarkers = {}
    @map.on('moveend', @updateMarkers)
  
  updateMarkers: =>
    # Get bounds padded
    bounds = @map.getBounds().pad(0.33)

    boundsGeoJSON = GeoJSON.latLngBoundsToGeoJSON(bounds)
    selector = { geo: { $geoIntersects: { $geometry: boundsGeoJSON } } }

    # Query sources with projection TODO
    @db.sources.find(selector, { sort: ["_id"], limit: 100 }).fetch (sources) =>
      console.log "### matched Sources:" + sources.length
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
      marker = new L.Marker(latlng)
      
      marker.on 'click', =>
        @pager.openPage(SourcePage, source._id)
      
      @sourceMarkers[source._id] = marker
      marker.addTo(@map)

  removeSourceMarker: (source) ->
    if _.has(@sourceMarkers, source._id)
      @map.removeLayer(@sourceMarkers[source._id])


class LocationDisplay
  constructor: (map) ->
    @map = map

    @locationFinder = new LocationFinder()
    @locationFinder.on('found', @locationFound).on('error', @locationError)
    @locationFinder.startWatch()

  stop: ->
    @locationFinder.stopWatch()

  locationError: (e) =>
    if not @locationZoomed
      @map.fitWorld()
      @locationZoomed = true
      alert("Unable to determine location")

  locationFound: (e) =>
    radius = e.coords.accuracy
    latlng = new L.LatLng(e.coords.latitude, e.coords.longitude)

    # Set position once
    if not @locationZoomed
      zoom = 16
      @map.setView(latlng, zoom)
      @locationZoomed = true

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