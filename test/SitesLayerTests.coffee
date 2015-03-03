assert = chai.assert

SitesLayer = require '../app/js/map/SitesLayer'

# TODO Rename marker to layer
describe "SitesLayer", ->
  describe "updateFromList", ->
    it 'adds created layers', ->
      layers = 
        '1': L.geoJson()
        '2': L.geoJson()

      layerCreator = 
        createLayer: (site, success, error) ->
          success(site: site, layer: layers[site._id])
      
      sl = new SitesLayer(layerCreator)

      sites = [
        { _id: "1" }
        { _id: "2" }
      ]

      sl.updateFromList(sites)

      assert.equal sl.getLayers().length, 2
      assert.equal sl.getLayers()[0], layers['1']

    it "replaces layers when success called twice", ->
      layers = 
        '1': L.geoJson()
        '1a': L.geoJson()
        '2': L.geoJson()
        '2a': L.geoJson()
      layerCreator = 
        createLayer: (site, success, error) =>
          success(site: site, layer: layers[site._id])
          success(site: site, layer: layers[site._id + 'a'])
      
      sl = new SitesLayer(layerCreator)

      sites = [
        { _id: "1" }
        { _id: "2" }
      ]

      sl.updateFromList(sites)

      assert.equal sl.getLayers().length, 2
      assert.equal sl.getLayers()[0], layers['1a']


    context 'with existing layers', ->
      beforeEach ->
        @layers = 
          '1': L.geoJson()
          '2': L.geoJson()
          '3': L.geoJson()

        @layerCreator = 
          createLayer: (site, success, error) =>
            success(site: site, layer: @layers[site._id])
        
        @sl = new SitesLayer(@layerCreator)

        @sites = [
          { _id: "1" }
          { _id: "2" }
        ]

        @sl.updateFromList(@sites)

      it "removes missing site layers", ->
        sites = [
          { _id: "1" }
        ]
        @sl.updateFromList(sites)

        assert.equal @sl.getLayers().length, 1
        assert.equal @sl.getLayers()[0], @layers['1']

      it "does not recompute existing site layers", ->
        @layerCreator.create = ->
          throw "Fail"
        
        sites = [
          { _id: "1" }
          { _id: "2" }
        ]
        @sl.updateFromList(sites)

      it "adds new site layers", ->
        sites = [
          { _id: "3" }
        ]
        @sl.updateFromList(sites)

        assert.equal @sl.getLayers().length, 1
        assert.equal @sl.getLayers()[0], @layers['3']

      it "resets layers", ->
        @sl.reset()
        assert.equal @sl.getLayers().length, 0

  describe "boundsQuery", ->
    it "adds a geo filter to a mongo query object", ->
      selector = {}
      southWest = new L.LatLng(10, 110)
      northEast = new L.LatLng(20, 120)
      bounds = new L.LatLngBounds(southWest, northEast)

      sl = new SitesLayer();
      sl.boundsQuery(bounds, selector)

      assert.deepEqual selector, {
        geo: { $geoIntersects: { $geometry: 
          type: 'Polygon',
          coordinates: [
            [[110, 10], 
            [110, 20], 
            [120, 20], 
            [120, 10],
            [110, 10]]
          ]
        } } 
      }
