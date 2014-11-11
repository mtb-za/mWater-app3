GeoJSON = require '../GeoJSON'
normalizeLng = require('./utils').normalizeLng
ZoomToSeeMoreControl = require './ZoomToSeeMoreControl'

# SitesLayer takes care of the querying/filtering of sites and use the siteLayerCreator to create the individual markers
module.exports = class SitesLayer extends L.LayerGroup
  constructor: (siteLayerCreator, sitesDb, filter) ->
    super()
    @siteLayerCreator = siteLayerCreator
    @sitesDb = sitesDb
    @filter = filter || {}

    @maxSitesReturned = 1000

    @cachedMarkers = {}
    @cachedMarkersSize = 0

    @zoomToSeeMoreMsg = new ZoomToSeeMoreControl(@maxSitesReturned)

    # Creating the marker clusterer
    # WIP note
    # I've been trying to NOT remove the markers outside visible bounds, so you could see them right away after a zoom out
    # but using removeOutsideVisibleBounds: false crashes

    @clusterer = new L.MarkerClusterGroup({
      disableClusteringAtZoom: 15,
      # custom creation of cluster icon to show a + next to the number when markers could be missing
      iconCreateFunction: (cluster) =>
        childCount = cluster.getChildCount();

        # different look based on the number of markers
        c = ' marker-cluster-'
        if (childCount < 10)
          c += 'small'
        else if (childCount < 100)
          c += 'medium'
        else
          c += 'large'

        text = '' + childCount
        if @zoomToSeeMoreMsg.active
          text += '+'
        return new L.DivIcon({ html: '<div><span>' + text + '</span></div>', className: 'marker-cluster' + c, iconSize: new L.Point(40, 40) })
    })

  onAdd: (map) =>
    super(map)
    @map = map

    @map.addLayer(@clusterer);

    map.on 'moveend', @update

    # Do first query
    @update()

  onRemove: (map) =>
    super(map)
    map.off 'moveend', @update

  setFilter: (filter) => 
    @filter = filter

  reset: =>
    @clusterer.clearLayers()
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
    if @map?
      @zoomToSeeMoreMsg.testTooManySitesWarning(sites.length, @map)

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
        if @map?
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
