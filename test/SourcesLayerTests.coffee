assert = chai.assert

SourcesLayer = require '../app/js/map/SourcesLayer'

# TODO Rename marker to layer
describe "SourcesLayer", ->
  describe "updateFromList", ->
    it 'adds created layers', ->
      layers = 
        '1': L.circleMarker()
        '2': L.circleMarker()

      layerCreator = 
        createLayer: (source, success, error) ->
          success(source: source, layer: layers[source._id])
      
      sl = new SourcesLayer(layerCreator)

      sources = [
        { _id: "1" }
        { _id: "2" }
      ]

      sl.updateFromList(sources)

      assert.equal sl.getLayers().length, 2
      assert.equal sl.getLayers()[0], layers['1']

    it "replaces layers when success called twice", ->
      layers = 
        '1': L.circleMarker()
        '1a': L.circleMarker()
        '2': L.circleMarker()
        '2a': L.circleMarker()
      layerCreator = 
        createLayer: (source, success, error) =>
          success(source: source, layer: layers[source._id])
          success(source: source, layer: layers[source._id + 'a'])
      
      sl = new SourcesLayer(layerCreator)

      sources = [
        { _id: "1" }
        { _id: "2" }
      ]

      sl.updateFromList(sources)

      assert.equal sl.getLayers().length, 2
      assert.equal sl.getLayers()[0], layers['1a']


    context 'with existing layers', ->
      beforeEach ->
        @layers = 
          '1': L.circleMarker()
          '2': L.circleMarker()
          '3': L.circleMarker()

        @layerCreator = 
          createLayer: (source, success, error) =>
            success(source: source, layer: @layers[source._id])
        
        @sl = new SourcesLayer(@layerCreator)

        @sources = [
          { _id: "1" }
          { _id: "2" }
        ]

        @sl.updateFromList(@sources)

      it "removes missing source layers", ->
        sources = [
          { _id: "1" }
        ]
        @sl.updateFromList(sources)

        assert.equal @sl.getLayers().length, 1
        assert.equal @sl.getLayers()[0], @layers['1']

      it "does not recompute existing source layers", ->
        @layerCreator.create = ->
          throw "Fail"
        
        sources = [
          { _id: "1" }
          { _id: "2" }
        ]
        @sl.updateFromList(sources)

      it "adds new source layers", ->
        sources = [
          { _id: "3" }
        ]
        @sl.updateFromList(sources)

        assert.equal @sl.getLayers().length, 1
        assert.equal @sl.getLayers()[0], @layers['3']

      it "resets layers", ->
        @sl.reset()
        assert.equal @sl.getLayers().length, 0

  describe "updateFromBounds", ->
    it "queries bounds", ->
      sourcesDb = 
        find: (sel, opt) =>
          @sel = sel
          @opt = opt
          return { fetch: -> }

      sl = new SourcesLayer(null, sourcesDb)

      southWest = new L.LatLng(10, 110)
      northEast = new L.LatLng(20, 120)
      bounds = new L.LatLngBounds(southWest, northEast)

      sl.updateFromList = ->
      sl.updateFromBounds(bounds)

      assert.deepEqual @sel, {
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




