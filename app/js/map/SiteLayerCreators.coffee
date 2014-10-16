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
    html = _.template('''
      <div><div id="image"></div>
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

    popupContent = @getPopupHtmlElement(site)
    layer.bindPopup(popupContent)

    layer.on 'click', =>
      # Set image of popup. Defer to prevent pointless loading
      if site.photos
        cover = _.findWhere(site.photos, { cover: true })
        if cover and $(popupContent).find("#image").html() == ""
          thumbnail = "<img class='thumb' src='#{this.ctx.apiUrl}images/" + cover.id + "?h=100' >"
          $(popupContent).find("#image").html(thumbnail)

    # Override layer remove to be alerted of remove
    superOnRemove = layer.onRemove.bind(layer)
    layer.onRemove = (map) ->
      # Set flag that layer was removed
      layer.removed = true
      superOnRemove(map)

    layer.marker = layer.getLayers()[0]

    layer.fitIntoBounds = (bounds) ->
      if layer.marker?
        latLng = layer.marker.getLatLng()
        lng = latLng.lng
        if bounds
          west = bounds.getWest()
          east = bounds.getEast()
          while(lng < west)
            lng += 360
          while(lng > east)
            lng -= 360

        latLng2 = L.latLng(latLng.lat, lng);
        layer.marker.setLatLng(latLng2)
      #else
      #  console.log("no marker?")

    layer.getLatLng = () ->
      layer._latlng = layer.marker._latlng
      return layer.marker.getLatLng()

    layer.setLatLng = (latLng) ->
      return layer.marker.setLatLng(latLng)

    # Return initial layer
    success(site: site, layer: layer)

