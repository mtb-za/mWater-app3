class SourceLayerCreator 
  # Calls success with { source: source, layer: layer }
  create: (source, success, error) ->


class EColi extends SourceLayerCreator
  # openSource will be called with _id of source to display
  constructor: (openSource) ->
    @openSource = openSource

  # Level is E.Coli level/100ml
  createLayer: (source, level) ->
    if level > 100
      color = "#FF0000"
    else
      color = "#606060"

    layer = L.geoJson source.geo, {
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
    }

    # Create popup
    html = _.template('''
      <div>
      Id: <b><%=source.code%></b><br>
      Name: <b><%=source.name%></b><br>
      <button class="btn btn-block">Open</button>
      </div>''', 
      { source: source })

    content = $(html)
    content.find("button").on 'click', =>
      @openSource(source._id)

    layer.bindPopup(content.get(0))
    return layer

  create: (source, success, error) =>
    success(source: source, layer: @createLayer(source))

exports.EColi = EColi