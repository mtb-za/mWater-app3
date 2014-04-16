offlineMap = require 'offline-leaflet-map'

exports.createOSMLayer = (onReady) ->
  #mapquestUrl = 'http://{s}.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.png'
  #subDomains = ['otile1','otile2','otile3','otile4']
  mapquestUrl = 'http://{s}.tile.osm.org/{z}/{x}/{y}.png'
  mapquestAttrib = 'Data, imagery and map information provided by <a href="http://open.mapquest.co.uk" target="_blank">MapQuest</a>, <a href="http://www.openstreetmap.org/" target="_blank">OpenStreetMap</a> and contributors.'
  return new offlineMap.OfflineLayer(mapquestUrl, {maxZoom: 18, attribution: mapquestAttrib, onReady:onReady})

exports.createSatelliteLayer = (onReady) ->
  mapquestUrl = 'http://{s}.mqcdn.com/tiles/1.0.0/sat/{z}/{x}/{y}.png'
  subDomains = ['otile1','otile2','otile3','otile4']
  mapquestAttrib = 'Data, imagery and map information provided by <a href="http://open.mapquest.co.uk" target="_blank">MapQuest</a>, Portions Courtesy NASA/JPL-Caltech and U.S. Depart. of Agriculture, Farm Service Agency'
  return new offlineMap.OfflineLayer(mapquestUrl, {maxZoom: 18, attribution: mapquestAttrib, subdomains: subDomains, onReady:onReady, storeName:"satelliteOfflineStore"})