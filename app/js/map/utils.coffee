

exports.normalizeLng = (lng) ->
  while lng > 180
    lng -= 360
  while lng < -180
    lng += 360
  return lng