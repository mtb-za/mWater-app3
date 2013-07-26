Question = require('./form-controls').Question
LocationMapPage = require '../pages/LocationMapPage'

module.exports = class MapQuestion extends Question
  render: ->
    # On first call
    if not @mapInitialized
      @$el.html templates['forms/MapQuestion'](prompt: @options.prompt, geo: @model.get @id)
      @$el.toggle(this.shouldBeVisible());
      @visible = this.shouldBeVisible();
    
      # Render map
      # Disable controls
      mapOpts = 
        dragging: false
        touchZoom: false
        scrollWheelZoom: false
        doubleClickZoom: false
        boxZoom: false
        keyboard: false
        zoomControl: false

      _.defer =>
        @map = L.map(this.$("#map")[0], mapOpts)
        @map.on 'click', =>
          @editGeo()

        L.Icon.Default.imagePath = "img/leaflet"
        # Setup map tiles
        setupMapTiles().addTo(@map)
        @displayGeo()

      @mapInitialized = true
    else if @map
      @displayGeo()

    return this

  events:
    'change': "displayGeo"
    'click #map_placeholder': "editGeo"

  editGeo: ->
    @ctx.pager.openPage(LocationMapPage, {
      geo: @model.get @id
      geoCallback: (geo) =>
        @ctx.pager.closePage()
        @model.set @id, geo
    })

  displayGeo: ->
    if not @map
      return
    geo = @model.get @id

    if geo
      @$("#map_placeholder").hide()
      @$("#map").show()
    else
      @$("#map_placeholder").show()
      @$("#map").hide()

    # Remove existing geo layer
    if @geoLayer
      @map.removeLayer(@geoLayer)

    if geo
      @geoLayer = L.geoJson(geo, {
        style: (feature) ->
          {color: '#f10'}
        pointToLayer: (featureData,  latlng) ->
          L.circle(latlng, featureData.properties.accuracy)
      })
      @geoLayer.addTo(@map)
      viewBounds = @geoLayer.getBounds().pad(5)
      @map.fitBounds(viewBounds)

    # val = parseFloat(@$("input").val())
    # if val == NaN
    #   val = null
    # @model.set @id, val 

setupMapTiles = ->
  mapquestUrl = 'http://{s}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png'
  subDomains = ['otile1','otile2','otile3','otile4']
  mapquestAttrib = 'Data, imagery and map information provided by <a href="http://open.mapquest.co.uk" target="_blank">MapQuest</a>, <a href="http://www.openstreetmap.org/" target="_blank">OpenStreetMap</a> and contributors.'
  return new L.TileLayer(mapquestUrl, {maxZoom: 18, attribution: mapquestAttrib, subdomains: subDomains})
