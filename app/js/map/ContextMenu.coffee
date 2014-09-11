# NewSitePage = require "../pages/NewSitePage"
# normalizeLng = require('./utils').normalizeLng

# # Menu that displays when a right-click or long-press is detected
# module.exports = class ContextMenu 
#   constructor: (map, ctx, onSelect) ->
#     @map = map

#     # Listen for event
#     @map.on 'contextmenu', (e) =>
#       # Ignore if not logged in
#       if not NewSitePage.canOpen(ctx)
#         return

#       # Get location
#       geo = {
#         type: "Point"
#         coordinates: [normalizeLng(e.latlng.lng), e.latlng.lat]
#       }
#       location = {
#         latitude: e.latlng.lat
#         longitude: normalizeLng(e.latlng.lng)
#       }

#       # Create popup html
#       contents = $('<div><button class="btn btn-default">' + T("Create Site") + '</button></div>')

#       # Create popup
#       popup = L.popup({ closeButton: false })
#         .setLatLng(e.latlng)
#         .setContent(contents.get(0))
#         .openOn(map)

#       contents.find('button').on 'click', ->
#         map.closePopup(popup)
#         ctx.pager.openPage(NewSitePage, { geo: geo, location: location, onSelect: onSelect })
