class SourceLayerCreator 
  # Calls success with { source: source, layer: layer }
  createLayer: (source, success, error) ->

  # Creates a legend for the layer. Will be added at bottom right
  createLegend: ->


class EColiAnalyzer 
  constructor: (db) ->
    @db = db

  # Returns E.Coli level / 100mL or -1 for unknown
  analyzeSource: (source, success, error) ->
    setTimeout =>
      x = Math.random() * 4
      if x < 1
        success -1
      else if x < 2 
        success 0
      else if x < 3
        success 10
      else
        success 100
    , 1000

  # Gets the last clump of tests within a 24 hours window ending with the last test
  getLastTests: (source, success, error) ->
    queryOptions = 
      sort: [['completed','desc']]
      limit: 5
      mode: "remote"

    @db.tests.find({ "data.source" : source.code, completed: { $exists: true }}, queryOptions).fetch (tests) =>
      if tests.length == 0
        return success([])

      # Keep within 24 hours of latest
      recent = new Date(tests[0].completed)
      recent.setDate(recent.getDate() - 1)
      success(_.filter(tests, (test) -> test.completed >= recent.toISOString()) )

  # Returns [min, max]/100mL for test. max of -1 means unlimited
  analyzeTest: (test) ->
    if test.type == "Aquagenx100PA"
      if test.data.ecoli_present
        return [test.data.dilution, -1]
      else
        return [0, test.data.dilution - 1]

    else if test.type == "ColilertMPN"
      if test.data.ecoli_present
        return [test.data.dilution * 10, -1]
      else
        return [0, test.data.dilution * 10 - 1]

    else if test.type == "CompactDryEC"
      if test.data.ecoli_tntc
        return [test.data.dilution * 100 * 100, -1]
      return [test.data.ecoli_count * test.data.dilution * 100, (test.data.ecoli_count + 1) * test.data.dilution * 100 - 1]

    else if test.type == "PetrifilmEcoliColiform"
      return [test.data.ecoli_count * test.data.dilution * 100, (test.data.ecoli_count + 1) * test.data.dilution * 100 - 1]

    else
      return [0, -1]

  # Combines mins and maxs to get true range
  combineMinMax: (minMaxes) ->
    min = 0
    max = -1
    for minMax in minMaxes
      if minMax[0] > min
        min = minMax[0]
      if minMax[1] != -1
        if minMax[1] < max || max == -1
          max = minMax[1]

      if max != -1 and min > max
        max = min

    return [min, max]

class EColi extends SourceLayerCreator
  # openSource will be called with _id of source to display
  constructor: (ecoliAnalyzer, openSource) ->
    @openSource = openSource
    @ecoliAnalyzer = ecoliAnalyzer

  # Level is E.Coli level/100ml
  createLevelLayer: (source, level) ->
    if level >= 100
      color = "#D00"
    else if level >= 1
      color = "#DD0"
    else if level >=0
      color = "#0D0"
    else
      color = "#888"

    layer = L.geoJson source.geo, {
      style: (feature) =>
        return { 
          fillColor: color 
          color: "#222"
          opacity: 1.0
          fillOpacity: 1.0
        }
      pointToLayer: (data, latLng) =>
        L.circleMarker latLng, {
          radius: 6
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
    # Create initial marker in no-data
    success(source: source, layer: @createLevelLayer(source, -1))

    # Call EColi analyzer to get actual level
    @ecoliAnalyzer.analyzeSource source, (level) =>
      success(source: source, layer: @createLevelLayer(source, level))

    , error


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
    opacity: 0.8;
}
</style>
<div class="header">E.Coli /100mL</div>
  <i style="background: #888"></i> No Data<br>
  <i style="background: #0D0"></i> &lt; 1<br>
  <i style="background: #DD0"></i> 1-99<br>
  <i style="background: #D00"></i> 100+
</div>    
'''

    return $(html).get(0)


exports.EColi = EColi
exports.EColiAnalyzer = EColiAnalyzer