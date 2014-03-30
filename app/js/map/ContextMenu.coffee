NewSourcePage = require "../pages/NewSourcePage"
normalizeLng = require('./utils').normalizeLng

# Menu that displays when a right-click or long-press is detected
module.exports = class ContextMenu 
  constructor: (map, ctx) ->
    @map = map

    # Listen for event
    @map.on 'contextmenu', (e) =>
      # Ignore if not logged in
      if not NewSourcePage.canOpen(ctx)
        return

      # Get location
      geo = {
        type: "Point"
        coordinates: [normalizeLng(e.latlng.lng), e.latlng.lat]
      }

      # Create popup html
      contents = $('<div><button class="btn btn-default">' + T("Create Water Source") + '</button></div>')

      # Create popup
      popup = L.popup({ closeButton: false })
        .setLatLng(e.latlng)
        .setContent(contents.get(0))
        .openOn(map)

      contents.find('button').on 'click', ->
        map.closePopup(popup)
        ctx.pager.openPage(NewSourcePage, { geo: geo })
