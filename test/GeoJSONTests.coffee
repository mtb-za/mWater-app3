assert = chai.assert
GeoJSON = require "../app/js/GeoJSON"

describe 'GeoJSON', ->
  it 'returns a proper polygon', ->
    southWest = new L.LatLng(10, 20)
    northEast = new L.LatLng(13, 23)
    bounds = new L.LatLngBounds(southWest, northEast)

    json = GeoJSON.LatLngBoundsToGeoJSON(bounds)
    assert.deepEqual json, {
      type: "Polygon",
      coordinates: [
        [[10,20],[13,20],[13,23],[10,23]]
      ]
    }
