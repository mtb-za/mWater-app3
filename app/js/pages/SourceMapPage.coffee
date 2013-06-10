Page = require("../Page")

class SourceMapPage extends Page
  activate: ->
    @setTitle "Source Map"
    @$el.html templates['pages/SourceMapPage']()

    # Element must be rendered before map can be created
    _.defer =>
        map = L.map(this.$("#map")[0]).setView([51.505, -0.09], 13)

        mapquestUrl = 'http://{s}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png'
        subDomains = ['otile1','otile2','otile3','otile4']
        mapquestAttrib = '''Data, imagery and map information provided by <a href="http://open.mapquest.co.uk" target="_blank">MapQuest</a>,
              <a href="http://www.openstreetmap.org/" target="_blank">OpenStreetMap</a> and contributors.'''
        mapquest = new L.TileLayer(mapquestUrl, {maxZoom: 18, attribution: mapquestAttrib, subdomains: subDomains});
        mapquest.addTo(map)
        # L.tileLayer('http://{s}.tile.cloudmade.com/BC9A493B41014CAABB98F0471D759707/997/256/{z}/{x}/{y}.png', {
        #     maxZoom: 18,
        #     attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery Â© <a href="http://cloudmade.com">CloudMade</a>'
        # }).addTo(map)

    # #L.Icon.Default.imagePath = 'http://127.0.0.1:8080/images/'
    # @map = L.map(@$('#map')[0]).setView([51.505, -0.09], 13)

    # # add an OpenStreetMap tile layer
    # L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', 
    #   attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    # ).addTo(@map)

    # add a marker in the given location, attach some popup content to it and open the popup
    #L.marker([51.5, -0.09]).addTo(@map)
    #  .bindPopup('A pretty CSS3 popup. <br> Easily customizable.')
    #  .openPopup()
  
    # mapquestUrl = 'http://{s}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png'
    # subDomains = ['otile1','otile2','otile3','otile4']
    # mapquestAttrib = '''Data, imagery and map information provided by <a href="http://open.mapquest.co.uk" target="_blank">MapQuest</a>,
    #       <a href="http://www.openstreetmap.org/" target="_blank">OpenStreetMap</a> and contributors.'''
    # mapquest = new L.TileLayer(mapquestUrl, {maxZoom: 18, attribution: mapquestAttrib, subdomains: subDomains});
    # mapquest.addTo(map)

    # osmUrl='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
    # osmAttrib='Map data © OpenStreetMap contributors'
    # osm = new L.TileLayer(osmUrl, {minZoom: 8, maxZoom: 12, attribution: osmAttrib})
    # osm.addTo(map)
    # L.tileLayer('http://{s}.tile.cloudmade.com/API-key/997/256/{z}/{x}/{y}.png', {
    #   attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>',
    #   maxZoom: 18
    # }).addTo(map)


module.exports = SourceMapPage