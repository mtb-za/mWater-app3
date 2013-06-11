# GeoJSON helper routines

exports.LatLngBoundsToGeoJSON = (bounds) ->
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