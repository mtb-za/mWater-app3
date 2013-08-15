

class SourceLayerCreator 
  # Calls success with { source: source, layer: layer }
  create: (source, success, error) ->


class EColi extends SourceLayerCreator
  # Level is E.Coli level/100ml
  createMarker: (geo, level) ->
    color = "#FF0000"
    return L.geoJson geo, {
      style: (feature) =>
        return { fillColor: color}
      pointToLayer: (data, latLng) =>
        L.circleMarker latLng
    }

  create: (source, success, error) ->
    success(source: source, layer: createMarker(source.geo))

    # success {
    #   source: source
    #   marker: L.circleMarker source. {

    #   }
    # }

exports.EColi = EColi