# GeoJSON helper routines

exports.latLngBoundsToGeoJSON = (bounds) ->
  sw = bounds.getSouthWest()
  ne = bounds.getNorthEast()
  return {
    type: 'Polygon',
    coordinates: [
      [[sw.lng, sw.lat], 
      [sw.lng, ne.lat], 
      [ne.lng, ne.lat], 
      [ne.lng, sw.lat]]
    ]
  }

# TODO: only works with bounds
exports.pointInPolygon = (point, polygon) ->
  # Get bounds
  bounds = new L.LatLngBounds(_.map(polygon.coordinates[0], (coord) -> new L.LatLng(coord[1], coord[0])))
  return bounds.contains(new L.LatLng(point.coordinates[1], point.coordinates[0]))