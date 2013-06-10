Page = require("../Page")

class SourceMapPage extends Page
  activate: ->
    @setTitle "Source Map"

    # Calculate height
    @$el.html templates['pages/SourceMapPage']()

    @map = L.map(this.$("#map")[0]).setView([51.505, -0.09], 13)
    @resizeMap()

    # Recalculate on resize
    $(window).on('resize', @resizeMap)

    mapquestUrl = 'http://{s}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png'
    subDomains = ['otile1','otile2','otile3','otile4']
    mapquestAttrib = 'Data, imagery and map information provided by <a href="http://open.mapquest.co.uk" target="_blank">MapQuest</a>, <a href="http://www.openstreetmap.org/" target="_blank">OpenStreetMap</a> and contributors.'
    mapquest = new L.TileLayer(mapquestUrl, {maxZoom: 18, attribution: mapquestAttrib, subdomains: subDomains});
    mapquest.addTo(@map)

  deactivate: ->
    $(window).off('resize', @resizeMap)

  resizeMap: =>
    # Calculate map height
    mapHeight = $("html").height() - 40
    $("#map").css("height", mapHeight + "px")
    @map.invalidateSize()


module.exports = SourceMapPage