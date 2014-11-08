GeoJSON = require '../GeoJSON'
normalizeLng = require('./utils').normalizeLng

# All sites layers should extend SiteLayerCreator and then use a standard
# SitesLayer with the site layer creator passed in
# SitesLayer takes care of basic filtering and gives the individual layer (site)
# creation to site layer
module.exports = class SitesLayer extends L.LayerGroup
  constructor: (siteLayerCreator, sitesDb, filter) ->
    super()
    @maxSitesReturned = 300
    @siteLayerCreator = siteLayerCreator
    @sitesDb = sitesDb
    @filter = filter || {}

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

    # Do first query
    @update()

  onRemove: (map) =>
    super(map)
    map.off 'moveend', @update

  setFilter: (filter) => 
    @filter = filter

  # Builds a selector based on bounds and filter
  # then queries the database
  update: =>
    selector = {}
    # Pad to ensure scrolling shows nearby ones
    bounds = @map.getBounds().pad(0.1)

    # Add bounds to the selector
    @boundsQuery bounds, selector

    # Add filter to the selector
    _.extend(selector, @filter)

    # TODO pass error?
    @getSites selector, @updateFromList

  reset: =>
    @clearLayers()
    @layers = {}    

  updateFromList: (sites, success, error) =>
    # Display "zoom to see more" warning when there is @maxSitesReturned sites
    # To make this 100% clean, we would need to deal with the special case when the result was not truncated
    # and actually contained @maxSitesReturned sites.
    if sites.length == @maxSitesReturned
      if not @zoomToSeeMoreMsgDisplayed
        @zoomToSeeMoreMsgDisplayed = true
        @map.addControl(@zoomToSeeMoreMsg)
    else if @zoomToSeeMoreMsgDisplayed
      @zoomToSeeMoreMsgDisplayed = false
      @map.removeControl(@zoomToSeeMoreMsg)

    for site in sites
      # If layer exists, ignore
      if site._id of @layers
        continue

      # Call creator
      @siteLayerCreator.createLayer site, (result) =>
        # Remove layer if exists
        if result.site._id of @layers
          @removeLayer(@layers[result.site._id])
          delete @layers[result.site._id]

        # Add layer
        @layers[result.site._id] = result.layer
        @addLayer(result.layer)
      , error

    # Remove layers not present
    siteMap = _.object(_.pluck(sites, '_id'), sites)
    toRemove = []
    for id, layer of @layers
      if not (id of siteMap)
        marker = layer.getLayers()[0]
        isPopUpOpen = marker and marker._popup and marker._popup._isOpen
        # A marker should not be removed if it's popup is opened
        if not isPopUpOpen
          toRemove.push(id)

    for id in toRemove
      @removeLayer(@layers[id])
      delete @layers[id]

    if @map?
      for id, layer of @layers
        layer.fitIntoBounds(@map.getBounds())

    success() if success?

  # Query the db
  getSites: (selector, success, error) =>
    queryOptions =
      sort: ["_id"]
      limit: @maxSitesReturned
      cacheFind: false
      interim: false
      fields:
        name: 1
        code: 1
        geo: 1
        type: 1
        created: 1
        photos: 1

    @sitesDb.find(selector, queryOptions).fetch success, error

  # Query the db, effectively caching sites returned
  cacheSites: (success, error) =>
    selector = {}

    # Add bounds to the selector
    @boundsQuery @map.getBounds(), selector

    # Add filter to the selector
    _.extend(selector, @filter)

    queryOptions =
      sort: ["_id"]
      limit: @maxSitesReturned

    @sitesDb.find(selector, queryOptions).fetch success, error

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
<div class="warning legend">
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
<b>''' + T('Zoom in to see more') + '''</b>
</div>
'''
    return $(html).get(0)