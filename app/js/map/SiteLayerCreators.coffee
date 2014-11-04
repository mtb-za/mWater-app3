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

    marker = layer.getLayers()[0]

    if marker?
      marker.on 'click', =>
        popupContent = @getPopupHtmlElement(site)

        # Set image of popup. Defer to prevent pointless loading
        if site.photos
          cover = _.findWhere(site.photos, { cover: true })
          if cover and $(popupContent).find("#image").html() == ""
            thumbnail = "<img class='thumb' src='#{this.ctx.apiUrl}images/" + cover.id + "?h=100' >"
            $(popupContent).find("#image").html(thumbnail)

        popup = L.popup()
        popup.setContent(popupContent)

        # This is a "clean" hack to set the popup offset, if this is not done, the popup is covering the marker
        marker.bindPopup(popup)
        marker.unbindPopup()

        popup.setLatLng(marker.getLatLng())

        if marker._map
          marker._map.openPopup(popup)

      # Override layer remove to be alerted of remove
      superOnRemove = marker.onRemove.bind(marker)
      marker.onRemove = (map) ->
        # Set flag that layer was removed
        marker.removed = true
        superOnRemove(map)

      marker.fitIntoBounds = (bounds) ->
        latLng = marker.getLatLng()
        lng = latLng.lng
        if bounds
          west = bounds.getWest()
          east = bounds.getEast()
          while(lng < west)
            lng += 360
          while(lng > east)
            lng -= 360

        latLng2 = L.latLng(latLng.lat, lng);
        marker.setLatLng(latLng2)


    # Return initial layer
    success(site: site, layer: marker)

