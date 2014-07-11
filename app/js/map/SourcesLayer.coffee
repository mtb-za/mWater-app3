GeoJSON = require '../GeoJSON'
normalizeLng = require('./utils').normalizeLng

module.exports = class SourcesLayer extends L.LayerGroup

  constructor: (sourceLayerCreator, sourcesDb, scope) ->
    super()
    @maxSourcesReturned = 200
    @sourceLayerCreator = sourceLayerCreator
    @sourcesDb = sourcesDb
    @scope = scope || {}
    # Layers, by _id
    @layers = {}

  onAdd: (map) =>
    super(map)
    @map = map
    map.on 'moveend', @update
    @zoomToSeeMoreMsgDisplayed = false
    @zoomToSeeMoreMsg = L.control({position: 'topleft'});
    @zoomToSeeMoreMsg.onAdd = (map) =>
      return @createZoomInToSeeMore()

  onRemove: (map) =>
    super(map)
    map.off 'moveend', @update

  setScope: (scope) => 
    @scope = scope
  # Builds a selector based on bounds and scope (all, org, user)
  # then queries the database
  update: =>
    selector = {}
    # Pad to ensure scrolling shows nearby ones
    bounds = @map.getBounds().pad(0.1)
    # add bounds to the selector
    @boundsQuery bounds, selector
    # add scope to the selector
    @scopeQuery @scope, selector
    # TODO pass error?
    @getSources selector, @updateFromList

  reset: =>
    @clearLayers()
    @layers = {}    

  updateFromList: (sources, success, error) =>
    # Display "zoom to see more" warning when there is 200 sources
    # To make this 100% clean, we would need to deal with the special case when the result was not truncated
    # and actually contained 200 sources.
    if sources.length == @maxSourcesReturned
      if not @zoomToSeeMoreMsgDisplayed
        @zoomToSeeMoreMsgDisplayed = true
        @map.addControl(@zoomToSeeMoreMsg)
    else if @zoomToSeeMoreMsgDisplayed
      @zoomToSeeMoreMsgDisplayed = false
      @map.removeControl(@zoomToSeeMoreMsg)

    for source in sources
      # If layer exists, ignore
      if source._id of @layers
        continue

      # Call creator
      @sourceLayerCreator.createLayer source, (result) =>
        # Remove layer if exists
        if result.source._id of @layers
          @removeLayer(@layers[result.source._id])
          delete @layers[result.source._id]

        # Add layer
        @layers[result.source._id] = result.layer
        @addLayer(result.layer)
      , error

    # Remove layers not present
    sourceMap = _.object(_.pluck(sources, '_id'), sources)
    toRemove = []
    for id, layer of @layers
      if not (id of sourceMap)
        toRemove.push(id)

    for id in toRemove
      @removeLayer(@layers[id])
      delete @layers[id]

    if @map?
      for id, layer of @layers
        layer.fitIntoBounds(@map.getBounds())

    success() if success?

  # Query the db
  getSources: (selector, success, error) =>
    _this = this
    queryOptions =
      sort: ["_id"]
      limit: @maxSourcesReturned
      mode: "remote"
      fields:
        name: 1
        code: 1
        geo: 1
        type: 1
        org: 1
        user: 1
        photos: 1

    @sourcesDb.find(selector, queryOptions).fetch success, error

  # Update the selector to filter by scope
  scopeQuery: (scope, selector) =>
    return unless scope
    if scope.user
      selector.user = scope.user
    else selector.org = scope.org  if scope.org
    return
  
  # Update the selector to filter by bounds
  boundsQuery: (bounds, selector) =>
    return  unless bounds.isValid()
    return  if bounds.getWest() is bounds.getEast() or bounds.getNorth() is bounds.getSouth()

    east = bounds.getEast()
    west = bounds.getWest()

    if east - west >= 360
      # No geo query
      return

    # for querying more than 180 degrees the $geoIntersects result needs to be inversed
    # (Needs to be evaluated before normalizing)
    inverse = false
    if east - west >= 180
      #inverse = true
      # No geo query until $not $geoIntersects has been fixed
      return

    east = normalizeLng(east)
    west = normalizeLng(west)

    southWest = L.latLng(bounds.getSouth(), west)
    northEast = L.latLng(bounds.getNorth(), east)
    normalizedBounds = L.latLngBounds( southWest, northEast )
    boundsGeoJSON = GeoJSON.latLngBoundsToGeoJSON(normalizedBounds)

    if inverse
      selector.geo = $not: $geoIntersects:
        $geometry: boundsGeoJSON
    else
      selector.geo = $geoIntersects:
        $geometry: boundsGeoJSON
    return

  createZoomInToSeeMore: ->
    html = '''
<style>
.warning {
  padding: 6px 8px;
  font: 14px/16px Arial, Helvetica, sans-serif;
  background: yellow;
  background: rgba(255,255,0,0.8);
  box-shadow: 0 0 15px rgba(0,0,0,0.2);
  border-radius: 5px;
}
.legend {
    line-height: 18px;
    color: #555;
}
</style>
<div class="warning legend">
<b>''' + T('Zoom in to see more') + '''</b>
</div>
'''
    return $(html).get(0)