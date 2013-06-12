assert = chai.assert
GeoJSON = require "../app/js/GeoJSON"

describe 'GeoJSON', ->
  it 'returns a proper polygon', ->
    southWest = new L.LatLng(10, 20)
    northEast = new L.LatLng(13, 23)
    bounds = new L.LatLngBounds(southWest, northEast)

    json = GeoJSON.latLngBoundsToGeoJSON(bounds)
    assert _.isEqual json, {
      type: "Polygon",
      coordinates: [
        [[20,10],[20,13],[23,13],[23,10]]
      ]
    }

