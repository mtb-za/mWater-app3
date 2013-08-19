Page = require "../Page"
SourcePage = require './SourcePage'
SourcesLayer = require '../map/SourcesLayer'
SourceLayerCreators = require '../map/SourceLayerCreators'
LocationDisplay = require '../map/LocationDisplay'
ContextMenu = require '../map/ContextMenu'
BaseLayers = require '../map/BaseLayers'

# Map of water sources. Options include:
# initialGeo: Geometry to zoom to. Point only supported.
class SourceMapPage extends Page
  create: ->
    @setTitle "Source Map"

    # Calculate height
    @$el.html templates['pages/SourceMapPage']()

    L.Icon.Default.imagePath = "img/leaflet"

    options = {}
    # See issue https://github.com/mWater/app-v3/issues/103
    if navigator.userAgent.toLowerCase().indexOf('android 4.1.1') != -1
      options.touchZoom = false
      options.fadeAnimation = false

    @map = L.map(this.$("#map")[0], options)
    L.control.scale(imperial:false).addTo(@map)
    @resizeMap()

    # Recalculate on resize
    $(window).on('resize', @resizeMap)

    # Setup base layers
    osmLayer = BaseLayers.createOSMLayer()
    # satelliteLayer = BaseLayers.createSatelliteLayer() # TODO re-add
    
    osmLayer.addTo(@map)
    # baseLayers = 
    #   "OpenStreetMap": osmLayer
    #   "Satellite": satelliteLayer

    # # Create layer control 
    # L.control.layers(baseLayers).addTo(@map)

    # # Create geocoder TODO READD
    # osmGeocoder = new L.Control.OSMGeocoder()
    # @map.addControl(osmGeocoder)

    # Setup marker display when map is loaded
    @map.whenReady =>
      ecoliAnalyzer = new SourceLayerCreators.EColiAnalyzer(@db)

      sourceLayerCreator = new SourceLayerCreators.EColi ecoliAnalyzer, (_id) =>
        @pager.openPage(SourcePage, {_id: _id})
      @sourcesLayer = new SourcesLayer(sourceLayerCreator, @db.sources).addTo(@map)

      # Add legend
      @legend = L.control({position: 'bottomright'});
      @legend.onAdd = (map) ->
        return sourceLayerCreator.createLegend()
      @legend.addTo(@map)

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
    if @sourcesLayer and @needsRefresh
      @sourcesLayer.reset()
      @sourcesLayer.update()
      needsRefresh = false

  deactivate: ->
    @needsRefresh = true

  destroy: ->
    $(window).off('resize', @resizeMap)
    if @locationDisplay
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