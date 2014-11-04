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
    # Use L.geoJson to create the marker
    layer = L.geoJson site.geo, {
      style: (feature) =>
        return { 
          color: "#222"
          opacity: 1.0
          fillOpacity: 1.0
        }
    }
    # We are going to its marker, but not the actual L.geoJson layer
    marker = layer.getLayers()[0]

    if marker?
      marker.on 'click', =>
        if marker._map
          marker._map.openPopup(createPopup(site, marker, this.ctx.apiUrl))

      marker.fitIntoBounds = fitIntoBounds

      # Override layer remove to be alerted of remove (not sure if it's still used...
      #superOnRemove = marker.onRemove.bind(marker)
      #marker.onRemove = (map) ->
      #  # Set flag that layer was removed
      #  marker.removed = true
      #  superOnRemove(map)

    # Return initial layer
    success(site: site, layer: marker)


# Sets the lng value in the -360 to 360 range
fitIntoBounds = (bounds) ->
  latLng = this.getLatLng()
  lng = latLng.lng
  if bounds
    west = bounds.getWest()
    east = bounds.getEast()
    while(lng < west)
      lng += 360
    while(lng > east)
      lng -= 360

  latLng2 = L.latLng(latLng.lat, lng);
  this.setLatLng(latLng2)

# Create popup with content
createPopup = (site, marker, apiUrl) ->
  # Create popup with content
  popup = L.popup()
  popupContent = @getPopupHtmlElement(site)
  popup.setContent(popupContent)

  # Set image of popup
  if site.photos
    cover = _.findWhere(site.photos, { cover: true })
    if cover and $(popupContent).find("#image").html() == ""
      thumbnail = "<img class='thumb' src='#{apiUrl}images/" + cover.id + "?h=100' >"
      $(popupContent).find("#image").html(thumbnail)

  # This is a "clean" hack to set the popup pixel offset. If this is not done, the popup is covering the marker.
  marker.bindPopup(popup)
  marker.unbindPopup()

  popup.setLatLng(marker.getLatLng())

  return popup