assert = chai.assert
GeoJSON = require "../app/js/GeoJSON"
Localizer = require '../app/js/localization/Localizer'
new Localizer().makeGlobal(require("hbsfy/runtime"))

describe 'GeoJSON', ->
  it 'converts geo to loc', ->
    point = {
      type: "Point",
      coordinates: [-75, 2]
    }

    loc = GeoJSON.geoToLoc(point)
    assert.equal loc.latitude, 2
    assert.equal loc.longitude, -75
    assert not loc.altitude

  it 'converts geo to loc with altitude', ->
    point = {
      type: "Point",
      coordinates: [-75, 2, 40]
    }

    loc = GeoJSON.geoToLoc(point)
    assert.equal loc.latitude, 2
    assert.equal loc.longitude, -75
    assert.equal loc.altitude, 40

  it 'converts null geo to null loc', ->
    loc = GeoJSON.geoToLoc(null)
    assert not loc

  it 'converts loc to point geo', ->
    point = {
      type: "Point",
      coordinates: [-75, 2]
    }

    geo = GeoJSON.locToPoint({ latitude:2, longitude: -75 })
    assert.deepEqual geo, point

  it 'converts loc to point geo with altitude', ->
    point = {
      type: "Point",
      coordinates: [-75, 2, 3]
    }

    geo = GeoJSON.locToPoint({ latitude:2, longitude: -75, altitude: 3 })
    assert.deepEqual geo, point

  it 'converts null loc to point geo', ->
    geo = GeoJSON.locToPoint(null)
    assert not geo

  it 'returns a proper polygon', ->
    southWest = new L.LatLng(10, 20)
    northEast = new L.LatLng(13, 23)
    bounds = new L.LatLngBounds(southWest, northEast)

    json = GeoJSON.latLngBoundsToGeoJSON(bounds)
    assert _.isEqual json, {
      type: "Polygon",
      coordinates: [
        [[20,10],[20,13],[23,13],[23,10],[20,10]]
      ]
    }

  it 'clips lat to reasonable values', ->
    southWest = new L.LatLng(-120, -190)
    northEast = new L.LatLng(120, -170)
    bounds = new L.LatLngBounds(southWest, northEast)

    json = GeoJSON.latLngBoundsToGeoJSON(bounds)
    assert _.isEqual json, {
      type: "Polygon",
      coordinates: [
        [[-190,-90],[-190,90],[-170,90],[-170,-90],[-190, -90]]
      ]
    }

  it 'validates that the point is inside the polygon', ->
    southWest = new L.LatLng(-10, -70)
    northEast = new L.LatLng(10, 70)
    bounds = new L.LatLngBounds(southWest, northEast)
    polygon = GeoJSON.latLngBoundsToGeoJSON(bounds)

    point = {
      type: "Point",
      coordinates: [-65, 0]
    }

    assert GeoJSON.pointInPolygon(point, polygon)

  it 'validates that the point is outside the polygon', ->
    southWest = new L.LatLng(-10, -70)
    northEast = new L.LatLng(10, 70)
    bounds = new L.LatLngBounds(southWest, northEast)
    polygon = GeoJSON.latLngBoundsToGeoJSON(bounds)

    point = {
      type: "Point",
      coordinates: [-75, 0]
    }

    assert not GeoJSON.pointInPolygon(point, polygon)

  it 'pointInPolygon behaves like $geoInsersects with bounds larger than 180 degrees', ->
    southWest = new L.LatLng(-10, -170)
    northEast = new L.LatLng(10, 170)
    bounds = new L.LatLngBounds(southWest, northEast)
    polygon = GeoJSON.latLngBoundsToGeoJSON(bounds)

    point = {
      type: "Point",
      coordinates: [-175, 0]
    }

    assert GeoJSON.pointInPolygon(point, polygon)

  it "gets distance", ->
    from = { type: "Point", coordinates: [10, 20]}
    to = { type: "Point", coordinates: [10, 21]}
    dist = GeoJSON.getDistance(from, to)
    assert.closeTo dist, 111200, 1000

  it 'gets relative location N', ->
    from = { type: "Point", coordinates: [10, 20]}
    to = { type: "Point", coordinates: [10, 21]}
    str = GeoJSON.getRelativeLocation(from, to)
    assert.equal str, '111.2km N'

  it 'gets relative location S', ->
    from = { type: "Point", coordinates: [10, 20]}
    to = { type: "Point", coordinates: [10, 19]}
    str = GeoJSON.getRelativeLocation(from, to)
    assert.equal str, '111.2km S'
