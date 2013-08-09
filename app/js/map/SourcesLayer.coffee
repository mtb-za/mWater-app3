ItemTracker = require "../ItemTracker"
GeoJSON = require '../GeoJSON'
SourcePage = require "../pages/SourcePage"

# Displays water sources on map. Call updateMarkers to refresh. Creates popups
# with source details. 
module.exports = class SourcesLayer extends L.LayerGroup
  constructor: (db, pager) ->
    super()
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
  
  onAdd: (map) ->
    super(map)
    @map = map
    @map.on 'moveend', @updateMarkers

  onRemove: (map) ->
    super(map)
    @map.off 'moveend', @updateMarkers

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
    queryOptions = 
      sort: ["_id"]
      limit: 100
      mode: "remote"
      fields: { name: 1, code: 1, geo: 1 }

    @db.sources.find(selector, queryOptions).fetch (sources) =>
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
      
      # Create popup
      html = _.template('''
        <div>
        Id: <b><%=source.code%></b><br>
        Name: <b><%=source.name%></b><br>
        <button class="btn btn-block">Open</button>
        </div>''', 
        { source: source })

      content = $(html)
      content.find("button").on 'click', =>
        @pager.openPage(SourcePage, {_id: source._id})

      marker.bindPopup(content.get(0))
      
      @sourceMarkers[source._id] = marker
      @addLayer(marker)

  removeSourceMarker: (source) ->
    if _.has(@sourceMarkers, source._id)
      @removeLayer(@sourceMarkers[source._id])

