Page = require "../Page"

SourceDisplay = require '../map/SourcesLayer' # TODO
LocationDisplay = require '../map/LocationDisplay'
ContextMenu = require '../map/ContextMenu'
baseLayers = require '../map/baseLayers'

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

    # Setup base layers
    osmLayer = baseLayers.createOSMLayer()
    satelliteLayer = baseLayers.createSatelliteLayer()
    
    osmLayer.addTo(@map)
    baseLayers = 
      "OpenStreetMap": osmLayer
      "Satellite": satelliteLayer

    # Create layer control
    L.control.layers(baseLayers).addTo(@map)

    # Setup marker display when map is loaded
    @map.whenReady =>
      @sourceDisplay = new SourceDisplay(@db, @pager).addTo(@map)

    # Setup context menu
    contextMenu = new ContextMenu(@map, @ctx)
    # TODO zoom to last known bounds
    
    # Setup initial zoom
    if @options.initialGeo and @options.initialGeo.type=="Point"
      @map.setView(L.GeoJSON.coordsToLatLng(@options.initialGeo.coordinates), 15)

    # Setup localion display
    @locationDisplay = new LocationDisplay(@map, not @options.initialGeo?)

  activate: ->
    # Update markers
    if @sourceDisplay and @needsRefresh
      @sourceDisplay.updateMarkers()
      needsRefresh = false

  deactivate: ->
    @needsRefresh = true

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


module.exports = SourceMapPage