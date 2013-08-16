class SourceLayerCreator 
  # Calls success with { source: source, layer: layer }
  createLayer: (source, success, error) ->

  # Creates a legend for the layer. Will be added at bottom right
  createLegend: ->


class EColi extends SourceLayerCreator
  # openSource will be called with _id of source to display
  constructor: (openSource) ->
    @openSource = openSource

  # Level is E.Coli level/100ml
  createLevelLayer: (source, level) ->
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
      Water source #<b><%=source.code%></b><br>
      Name: <b><%=source.name%></b><br>
      <button class="btn btn-primary btn-block">Open</button>
      </div>''', 
      { source: source })

    content = $(html)
    content.find("button").on 'click', =>
      @openSource(source._id)

    layer.bindPopup(content.get(0))
    return layer

  createLayer: (source, success, error) =>
    success(source: source, layer: @createLevelLayer(source, Math.floor(Math.random()*200)-150))

  createLegend: ->
    html = '''
<div class="info legend">
<style>
.info .header {
  font-weight: bold;
}
.info {
  padding: 6px 8px;
  font: 14px/16px Arial, Helvetica, sans-serif;
  background: white;
  background: rgba(255,255,255,0.8);
  box-shadow: 0 0 15px rgba(0,0,0,0.2);
  border-radius: 5px;
}
.legend {
    line-height: 18px;
    color: #555;
}
.legend i {
    width: 18px;
    height: 18px;
    float: left;
    margin-right: 8px;
    opacity: 0.7;
}
</style>
<div class="header">E.Coli /100mL</div>
  <i style="background: #606060"></i> No Data<br>
  <i style="background: #0D0"></i> &lt; 1<br>
  <i style="background: #DD0"></i> 1-99<br>
  <i style="background: #D00"></i> 100+
</div>    
'''

    return $(html).get(0)


exports.EColi = EColi