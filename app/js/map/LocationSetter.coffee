
# Creates a pin with a popup that allows setting of a location. 
module.exports = class LocationSetter
  # Callback with { latitude: ... , longitude: ... }
  constructor: (map, callback) ->
    html = '''<div><button class="btn btn-primary btn-lg">''' + T("Set Location Here") + '''</button></div>'''
    content = $(html)
    content.find("button").on 'click', =>
      if callback?
        callback({latitude: map.getCenter().lat, longitude: map.getCenter().lng})

    icon =  L.icon(iconUrl: "img/redMarker.png", shadowUrl: "img/leaflet/marker-shadow.png", iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41])

    marker = L.marker(map.getCenter(), icon: icon, clickable: false).addTo(map)
    markerPopUp = L.popup(closeButton: false, closeOnClick: false, offset: new L.Point(200, 0)).setContent(content.get(0))
    markerPopUp.offset = new L.Point(200, 0)
    marker.bindPopup(markerPopUp).openPopup()

    map.on 'move', () =>
      marker.setLatLng(map.getCenter())
