GeoJSON = require '../GeoJSON'

module.exports = class SourceMarkersLayer extends L.LayerGroup
  constructor: (sourceMarkerCreator, sourcesDb) ->
    super()
    @sourceMarkerCreator = sourceMarkerCreator
    @sourcesDb = sourcesDb

    # Markers, by _id
    @markers = {}

  resetMarkers: =>
    @clearLayers()
    @markers = {}    

  updateMarkersFromList: (sources, success, error) =>
    for source in sources
      # If marker exists, ignore
      if source._id of @markers
        continue

      # Call creator
      @sourceMarkerCreator.create source, (result) =>
        # Remove marker if exists
        if result.source._id of @markers
          @removeLayer(@markers[result.source._id])
          delete @markers[result.source._id]

        # Add marker
        @markers[result.source._id] = result.marker
        @addLayer(result.marker)
      , error

    # Remove markers not present
    sourceMap = _.object(_.pluck(sources, '_id'), sources)
    toRemove = []
    for id, marker of @markers
      if not (id of sourceMap)
        toRemove.push(id)

    for id in toRemove
      @removeLayer(@markers[id])
      delete @markers[id]

    success() if success?

  updateMarkersFromBounds: (bounds, success, error) =>
    # Success on empty/invalid bounds
    if not bounds.isValid()
      success() if success?
      return
    if bounds.getWest() == bounds.getEast() or bounds.getNorth() == bounds.getSouth()
      success() if success?
      return

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
      fields: { name: 1, code: 1, geo: 1, type: 1 }

    @sourcesDb.find(selector, queryOptions).fetch (sources) =>
      @updateMarkersFromList(sources, success, error)
