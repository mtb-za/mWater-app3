class SiteLayerCreator 
  # Calls success with { site: site, layer: layer }
  createLayer: (site, success, error) ->

  # Creates a legend for the layer. Will be added at bottom right
  createLegend: ->

# Site layer which just displays an icon for sites
exports.SimpleSitesLayerCreator = class SimpleSitesLayerCreator extends SiteLayerCreator
  # openSite will be called with _id of site to display
  constructor: (ctx, openSite) ->
    @ctx = ctx
    @openSite = openSite

  # Gets html for popup
  getPopupHtmlElement: (site) ->
    # Create popup
    thumbnail = "" 
    if site.photos
      cover = _.findWhere(site.photos, { cover: true })
      if cover
        thumbnail = "<img class='thumb' src='#{this.ctx.apiUrl}images/" + cover.id + "?h=100' >"

    html = _.template('''
      <div>
        ''' + thumbnail + '''
        <div class='data'>
          ''' + T("Type") + ''': <b><%=site.type.join(' - ')%></b><br>
          ''' + T("Code") + ''': <b><%=site.code%></b><br>
          ''' + T("Name") + ''': <b><%=site.name || T("---")%></b><br>
          <%=site.desc%><br>
        </div>
        <button class="btn btn-primary btn-block">''' + T("Open") + '''</button>
      </div>''', 
      { site: site })

    content = $(html)
    content.find("button").on 'click', =>
      @openSite(site._id)

    return content.get(0)

  createLayer: (site, success, error) =>
    layer = L.geoJson site.geo, {
      style: (feature) =>
        return { 
          color: "#222"
          opacity: 1.0
          fillOpacity: 1.0
        }
    }

    layer.bindPopup(@getPopupHtmlElement(site))

    # Override layer remove to be alerted of remove
    superOnRemove = layer.onRemove.bind(layer)
    layer.onRemove = (map) ->
      # Set flag that layer was removed
      layer.removed = true
      superOnRemove(map)

    # the GeoJson layer is a layerGroup, containing one layer for each GeoJson data
    # this function will modify the lng of the layers of the GeoJson layerGroup to fit them inside the bounds
    # Note: right now, each GeoJson has only one layer
    layer.fitLngIntoBounds = (bounds) ->
      if bounds
        west = bounds.getWest()
        east = bounds.getEast()

        layer.eachLayer((subLayer) =>
          latLng = subLayer.getLatLng()
          lng = latLng.lng
          #if lng is outside the bounds lng
          if lng < west or lng > east
            #try to fit lng between west and east
            while(lng < west)
              lng += 360
            while(lng > east)
              lng -= 360

            # create a new LatLng and set the updated lng
            latLng2 = L.latLng(latLng.lat, lng);
            subLayer.setLatLng(latLng2)
        )

    # Return initial layer
    success(site: site, layer: layer)

