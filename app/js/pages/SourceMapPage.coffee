Page = require "../Page"
SourcePage = require './SourcePage'
SourcesLayer = require '../map/SourcesLayer'
SourceLayerCreators = require '../map/SourceLayerCreators'
LocationDisplay = require '../map/LocationDisplay'
LocationFinder = require '../LocationFinder'
ContextMenu = require '../map/ContextMenu'
BaseLayers = require '../map/BaseLayers'

# Map of water sources. Options include:
# initialGeo: Geometry to zoom to. Point only supported.
class SourceMapPage extends Page
  create: ->
    @setTitle "Source Map"

    # Calculate height
    @$el.html templates['pages/SourceMapPage']()

    # If initialGeo specified, use it
    if @options.initialGeo and @options.initialGeo.type=="Point"
      @createMap(L.GeoJSON.coordsToLatLng(@options.initialGeo.coordinates), 15)
      return

    # If saved view
    if window.localStorage['SourceMapPage.lastView']
      lastView = JSON.parse(window.localStorage['SourceMapPage.lastView'])
      @createMap(lastView.center, lastView.zoom, lastView.scope)
      return

    # Get current position if quickly available
    currentLatLng = null
    locationFinder = new LocationFinder()
    locationFinder.getLocation (pos) =>
      currentLatLng = new L.LatLng(pos.coords.latitude, pos.coords.longitude)
    , ->
      # Do nothing on error
      currentLatLng = null

    # Wait very short time for location
    setTimeout =>
      # If no location, create map with no location
      if currentLatLng
        @createMap(currentLatLng, 14)
      else
        @createMap()
    , 500

  createMap: (center, zoom, scope) ->
    # Fix leaflet image path
    L.Icon.Default.imagePath = "img/leaflet"

    options = {}
    # See issue https://github.com/mWater/app-v3/issues/103
    if navigator.userAgent.toLowerCase().indexOf('android 4.1.1') != -1 or navigator.userAgent.toLowerCase().indexOf('android 4.0.4') != -1
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
      @sourcesLayer = new SourcesLayer(sourceLayerCreator, @db.sources, scope).addTo(@map)
      # Add legend
      @legend = L.control({position: 'bottomright'});
      @legend.onAdd = (map) ->
        return sourceLayerCreator.createLegend()
      @legend.addTo(@map)

    # Setup context menu
    contextMenu = new ContextMenu(@map, @ctx)
    
    # Setup initial zoom
    if center
      @map.setView(center, zoom)
    else
      @map.fitWorld()

    # Save view
    @map.on 'moveend', @saveView



    # Setup location display
    @locationDisplay = new LocationDisplay(@map)

    # Create a dropdown menu using the Source Scope Options
    menu = @getSourceScopeOptions().map((scope) =>
      text: scope.display
      id: "source-scope-" + scope.type
      click: => @updateSourceScope scope
    )

    @setupButtonBar [
      { icon: "gear.png", menu: menu }
      { icon: "goto-my-location.png", click: => @gotoMyLocation() }
    ]

  # TODO: Replace hardcoded user and org with current user's
  # Options for the dropdown menu
  getSourceScopeOptions: =>
    options = [{ display: "All Sources", type: "all", value: {} }]
    # Only show Organization choice if user has an org
    if @login.org
      options.push { display: "Only My Organization", type: "org", value: { org: @login.org } }
    
    options.push { display: "Only Mine", type: "user", value: { user: @login.user } }
    return options

  #Filter the sources by all, org, or user
  updateSourceScope: (scope) => 
    #Update UI
    @getButtonBar().$(".dropdown-menu .menuitem.active").removeClass("active")
    @getButtonBar().$("#source-scope-" + scope.type).addClass("active")
    #Update Map
    @sourcesLayer.setScope scope.value
    @sourcesLayer.update()
    #Persist the view
    @saveView()
    return

  saveView: => 
    window.localStorage['SourceMapPage.lastView'] = JSON.stringify({
      center: @map.getCenter() 
      zoom: @map.getZoom()
      scope: @sourcesLayer.scope
    })

  gotoMyLocation: ->
    # Goes to current location
    locationFinder = new LocationFinder()
    locationFinder.getLocation (pos) =>
      latLng = new L.LatLng(pos.coords.latitude, pos.coords.longitude)
      zoom = @map.getZoom()
      @map.setView(latLng, if zoom > 15 then zoom else 15)
    , =>
      @pager.flash("Unable to determine location", "warning")

  activate: ->
    #Set active sources scope dropdown item
    selector = "#source-scope-"
    if @sourcesLayer and @sourcesLayer.scope and @sourcesLayer.scope.user
        selector += "user"
    else if @sourcesLayer and @sourcesLayer.scope and @sourcesLayer.scope.org 
      selector += "org"
    else
      selector += "all"

    @getButtonBar().$(selector).addClass "active";
    
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
    mapHeight = $("html").height() - 50
    $("#map").css("height", mapHeight + "px")
    @map.invalidateSize()

setupMapTiles = ->
  mapquestUrl = 'http://{s}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png'
  subDomains = ['otile1','otile2','otile3','otile4']
  mapquestAttrib = 'Data, imagery and map information provided by <a href="http://open.mapquest.co.uk" target="_blank">MapQuest</a>, <a href="http://www.openstreetmap.org/" target="_blank">OpenStreetMap</a> and contributors.'
  return new L.TileLayer(mapquestUrl, {maxZoom: 18, attribution: mapquestAttrib, subdomains: subDomains})


module.exports = SourceMapPage