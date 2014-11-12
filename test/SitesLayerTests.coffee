assert = chai.assert

SitesLayer = require '../app/js/map/SitesLayer'

# TODO Rename marker to layer
describe "SitesLayer", ->
  describe "updateFromList", ->
    it 'adds created layers', ->
      layers = 
        '1': L.circleMarker()
        '2': L.circleMarker()

      layerCreator = 
        createLayer: (site, success, error) ->
          success(site: site, layer: layers[site._id])
      
      sl = new SitesLayer(layerCreator)

      sites = [
        { _id: "1" }
        { _id: "2" }
      ]

      sl.updateFromList(sites)

      assert.equal sl.clusterer.getLayers().length, 2
      #assert.equal sl.getLayers()[0], layers['1']

    it "replaces layers when success called twice", ->
      layers = 
        '1': L.circleMarker()
        '1a': L.circleMarker()
        '2': L.circleMarker()
        '2a': L.circleMarker()
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

      assert.equal sl.clusterer.getLayers().length, 2
      #assert.equal sl.getLayers()[0], layers['1a']


    context 'with existing layers', ->
      beforeEach ->
        @layers = 
          '1': L.circleMarker()
          '2': L.circleMarker()
          '3': L.circleMarker()

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

        assert.equal @sl.clusterer.getLayers().length, 1
        #assert.equal @sl.getLayers()[0], @layers['1']

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

        assert.equal @sl.clusterer.getLayers().length, 1
        #assert.equal @sl.getLayers()[0], @layers['3']

      it "resets layers", ->
        @sl.reset()
        assert.equal @sl.clusterer.getLayers().length, 0

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

  describe "update", ->
    it "queries bounds and scope", ->
      @sel = null
      sitesDb = 
        find: (sel, opt) =>
          @sel = sel
          @opt = opt
          return { fetch: -> }

      sl = new SitesLayer(null, sitesDb, {user: "test"})

      southWest = new L.LatLng(10, 110)
      northEast = new L.LatLng(20, 120)
      bounds = new L.LatLngBounds(southWest, northEast)
      sl.map = {}
      sl.map.getBounds = -> 
        bounds

      sl.update()

      assert.property(@sel, "user")
      assert.equal(@sel.user, sl.filter.user)
      assert.property(@sel, "geo")
      




