queueasync = require 'queue-async'

class SourceLayerCreator 
  # Calls success with { source: source, layer: layer }
  createLayer: (source, success, error) ->

  # Creates a legend for the layer. Will be added at bottom right
  createLegend: ->


class EColiAnalyzer 
  constructor: (db) ->
    @db = db

  # Returns E.Coli level / 100mL or 'nodata' for unknown
  analyzeSource: (source, success, error) ->
    # Get tests
    @getLastTests source, (tests) =>
      # Analyze tests
      minMaxes = _.map(tests, (test) => @analyzeTest(test))

      # Combine
      minMax = @combineMinMax(minMaxes)

      # Return max, or 'high' if large and unknown. If range includes 0, return -1
      if minMax[0] == 0 and minMax[1] == -1
        success('nodata')
      else if minMax[1] == -1
        success('high')
      else
        success(minMax[1])
    , error

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

    # Create queue of analyses to be run 
    @taskQueue = queueasync(8)  # 8 in parallel

  # Level is E.Coli level/100ml. Can also be 'pending' and 'nodata' and 'high'
  getPopupHtmlElement: (source, level) ->
    if level == 'pending'
      levelStr = "Pending..."
    else if level == 'nodata'
      levelStr = "No Data"
    else if level == 'high'
      levelStr = "High"
    else if level >= 100
      levelStr = level
    else if level >= 1
      levelStr = level
    else if level >=0
      levelStr = level
    else 
      throw "Invalid level: " + level

    # Create popup
    html = _.template('''
      <div>
      Water source <b><%=source.code%></b><br>
      Name: <b><%=source.name%></b><br>
      E.Coli / 100mL: <b><%=levelStr%><br>
      <button class="btn btn-primary btn-block">Open</button>
      </div>''', 
      { source: source, levelStr: levelStr })

    content = $(html)
    content.find("button").on 'click', =>
      @openSource(source._id)

    return content.get(0)

  # Level is E.Coli level/100ml. Can also be 'pending' and 'nodata' and 'high'
  getLevelColor: (level) ->
    if level == 'pending'
      color = "#888"
    else if level == 'nodata'
      color = "#888"
    else if level == 'high'
      color = "#D00"
    else if level >= 100
      color = "#D00"
    else if level >= 1
      color = "#DD0"
    else if level >=0
      color = "#0D0"
    else 
      throw "Invalid level: " + level

    return color

  createLayer: (source, success, error) =>
    layer = L.geoJson source.geo, {
      style: (feature) =>
        return { 
          fillColor: @getLevelColor('pending')
          color: "#222"
          opacity: 1.0
          fillOpacity: 1.0
        }
      pointToLayer: (data, latLng) =>
        L.circleMarker latLng, {
          radius: 8
        }
    }

    layer.bindPopup(@getPopupHtmlElement(source, 'pending'))

    # Override layer remove to be alerted of remove
    superOnRemove = layer.onRemove.bind(layer)
    layer.onRemove = (map) ->
      # Set flag that layer was removed
      layer.removed = true
      superOnRemove(map)

    # Return initial layer
    success(source: source, layer: layer)

    # Create async task to be queued
    task = (next) =>
      # If layer removed, skip
      if layer.removed
        return next()

      # Call EColi analyzer to get actual level
      @ecoliAnalyzer.analyzeSource source, (level) =>
        # Rebind popup
        layer.bindPopup(@getPopupHtmlElement(source, level))

        color = @getLevelColor(level)
        layer.setStyle (feature) =>
          return { 
            fillColor: color
            color: "#222"
            opacity: 1.0
            fillOpacity: 1.0
          }
        next()
      , (err) =>
        error(err)
        
        # Tell queue of error
        # TODO keep processing in case of error?
        next(err)

    @taskQueue.defer(task)

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