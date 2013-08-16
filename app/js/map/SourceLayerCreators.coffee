

class SourceLayerCreator 
  # Calls success with { source: source, layer: layer }
  create: (source, success, error) ->


class EColi extends SourceLayerCreator
  constructor: (openSource) ->
    @openSource = openSource

  # Level is E.Coli level/100ml
  createLayer: (geo, level) ->
    if level > 100
      color = "#FF0000"
    else
      color = "#606060"

    return L.geoJson geo, {
      style: (feature) =>
        return { 
          fillColor: color 
          color: "#333"
          opacity: 1.0
          fillOpacity: 0.7
        }
      pointToLayer: (data, latLng) =>
        L.circleMarker latLng, {
          radius: 7
        }
      onEachFeature: (feature, layer) =>
        layer.bindPopup();
    }

  create: (source, success, error) =>
    success(source: source, layer: @createLayer(source.geo))

exports.EColi = EColi