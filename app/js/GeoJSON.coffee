# GeoJSON helper routines

exports.LatLngBoundsToGeoJSON = (bounds) ->
  return {
    type: 'Polygon',
    coordinates: [
      [[bounds.getSouth(), bounds.getWest()], 
      [bounds.getNorth(), bounds.getWest()], 
      [bounds.getNorth(), bounds.getEast()], 
      [bounds.getSouth(), bounds.getEast()]]
    ]
  }