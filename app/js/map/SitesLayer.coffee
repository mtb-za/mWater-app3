GeoJSON = require '../GeoJSON'
normalizeLng = require('./utils').normalizeLng

# All sites layers should extend SiteLayerCreator and then use a standard
# SitesLayer with the site layer creator passed in
# SitesLayer takes care of basic filtering and gives the individual layer (site)
# creation to site layer
module.exports = class SitesLayer extends L.LayerGroup
  constructor: (siteLayerCreator, sitesDb, filter) ->
    super()
    @maxSitesReturned = 1000
    @siteLayerCreator = siteLayerCreator
    @sitesDb = sitesDb
    @filter = filter || {}

    # Layers, by _id
    @cachedMarkers = {}
    @cachedMarkersSize = 0

  onAdd: (map) =>
    super(map)
    @map = map
    # trying not to remove the markers outside visible bounds, so you see them right away after a zoom out
    # removeOutsideVisibleBounds: false, it crashes
    @clusterer = new L.MarkerClusterGroup({disableClusteringAtZoom: 15});
    @map.addLayer(@clusterer);

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

  reset: =>
    @clearLayers()
    @cachedMarkers = {}
    @cachedMarkersSize = 0

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

  # Goes through the sites returned by the DB query and update the displayed markers
  updateFromList: (sites, success, error) =>
    # no point in doing any of this if there is no map
    if not @map?
      return

    @displayTooManySitesWarning(sites.length)

    markersToAdd = @createMarkers(sites, error)

    # add the markers to the @clusterer
    # faster to clearLayers and add all in one call after that (removeLayers is slow and unreliable)
    @clusterer.clearLayers()
    @clusterer.addLayers(markersToAdd)

    @deleteUnusedCachedMarkers(sites)

    success() if success?

  # Use the SiteLayerCreator to create the markers
  # Use the cached markers when available
  createMarkers: (sites, error) =>
    markersToAdd = []
    for site in sites
      result = @cachedMarkers[site._id]
      marker = null
      # If marker exists
      if result?
        marker = result.layer
      else
        # Call creator
        @siteLayerCreator.createLayer site, (result) =>
          # can only handle the sites with a location/marker
          if result.layer
            @cachedMarkers[result.site._id] = result
            @cachedMarkersSize++
            marker = result.layer
        , error

      if marker
        marker.fitIntoBounds(@map.getBounds())
        markersToAdd.push marker
    return markersToAdd

  # delete the unused layers if exceeding the limit
  deleteUnusedCachedMarkers: (sites) =>
    siteMap = _.object(_.pluck(sites, '_id'), sites)
    for id, result of @cachedMarkers
      if @cachedMarkersSize <= @maxSitesReturned
        break
      if not (id of siteMap)
        delete @cachedMarkers[id]
        @cachedMarkersSize--

  # Display "zoom to see more" warning when there is @maxSitesReturned sites
  # To make this 100% clean, we would need to deal with the special case when the result was not truncated
  # and actually contained @maxSitesReturned sites.
  displayTooManySitesWarning: (nbOfSites) =>
    if nbOfSites >= @maxSitesReturned
      if not @zoomToSeeMoreMsgDisplayed
        @zoomToSeeMoreMsgDisplayed = true
        @map.addControl(@zoomToSeeMoreMsg)
    else if @zoomToSeeMoreMsgDisplayed
      @zoomToSeeMoreMsgDisplayed = false
      @map.removeControl(@zoomToSeeMoreMsg)


  # Query the db
  getSites: (selector, success, error) =>
    queryOptions =
      sort: ["_id"]
      limit: @maxSitesReturned
      mode: "remote"
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