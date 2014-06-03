# GeoJSON helper routines

# Converts navigator position to point
exports.posToPoint = (pos) ->
  return {
    type: 'Point'
    coordinates: [pos.coords.longitude, pos.coords.latitude]
  }

# Converts navigator location to point
exports.locToPoint = (loc) ->
  if not loc?
    return null

  geo = {
    type: 'Point'
    coordinates: [loc.longitude, loc.latitude]
  }
  # Do not include altitude due to Mongo bug
  # if loc.altitude?
  #   geo.coordinates.push loc.altitude
  return geo

# Converts geojson geometry to location. Implemented only for point
exports.geoToLoc = (geo) ->
  if not geo?
    return null
  if geo.type == "Point"
    return { latitude: geo.coordinates[1], longitude: geo.coordinates[0], altitude: geo.coordinates[2] }
  else
    throw new Error("Unknown geo type: " + geo.type)

exports.latLngBoundsToGeoJSON = (bounds) ->
  s = bounds.getSouth()
  w = bounds.getWest()
  n = bounds.getNorth()
  e = bounds.getEast()

  if s < -90 then s = -90
  if n > 90 then n = 90

  return {
    type: 'Polygon',
    coordinates: [
      [[w, s], 
      [w, n], 
      [e, n], 
      [e, s],
      [w, s]]
    ]
  }

# TODO: only works with bounds
exports.pointInPolygon = (point, polygon) ->
  # Check that first == last
  if not _.isEqual(_.first(polygon.coordinates[0]), _.last(polygon.coordinates[0]))
    throw new Error("First must equal last")

  # Get bounds
  bounds = new L.LatLngBounds(_.map(polygon.coordinates[0], (coord) -> new L.LatLng(coord[1], coord[0])))
  east = bounds.getEast()
  west = bounds.getWest()

  pointLng = point.coordinates[0]
  pointLat = point.coordinates[1]

  if east - west >= 360
    return pointLat <= bounds.getNorth() and pointLat >= bounds.getSouth()
  else if east - west > 180
    #the bounds support values outside the -180 to 180 range (unlike $geoIntersects)
    newWest = east
    newEast = west + 360
    bounds = new L.LatLngBounds(new L.LatLng(bounds.getSouth(), newWest), new L.LatLng(bounds.getNorth(), newEast))
    if pointLng < 0
      pointLng += 360

  return bounds.contains(new L.LatLng(pointLat, pointLng))

# Get distance
exports.getDistance = (from, to) ->
  x1 = from.coordinates[0]
  y1 = from.coordinates[1]
  x2 = to.coordinates[0]
  y2 = to.coordinates[1]
  
  # Convert to relative position (approximate)
  dy = (y2 - y1) / 57.3 * 6371000
  dx = Math.cos(y1 / 57.3) * (x2 - x1) / 57.3 * 6371000
  
  # Determine direction and angle
  dist = Math.sqrt(dx * dx + dy * dy)

  return dist

exports.getRelativeLocation = (from, to) ->
  x1 = from.coordinates[0]
  y1 = from.coordinates[1]
  x2 = to.coordinates[0]
  y2 = to.coordinates[1]
  
  # Convert to relative position (approximate)
  dy = (y2 - y1) / 57.3 * 6371000
  dx = Math.cos(y1 / 57.3) * (x2 - x1) / 57.3 * 6371000
  
  # Determine direction and angle
  dist = Math.sqrt(dx * dx + dy * dy)
  angle = 90 - (Math.atan2(dy, dx) * 57.3)
  angle += 360 if angle < 0
  angle -= 360 if angle > 360
  
  # Get approximate direction
  compassDir = (Math.floor((angle + 22.5) / 45)) % 8
  compassStrs = [T("N"), T("NE"), T("E"), T("SE"), T("S"), T("SW"), T("W"), T("NW")]
  if dist > 1000
    (dist / 1000).toFixed(1) + "km " + compassStrs[compassDir]
  else
    (dist).toFixed(0) + "m " + compassStrs[compassDir]