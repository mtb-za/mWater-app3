assert = chai.assert

SourceMarkersLayer = require '../app/js/map/SourceMarkersLayer'

describe "SourceMarkersLayer", ->
  describe "updateMarkersFromList", ->
    it 'adds created markers', ->
      markers = 
        '1': L.circleMarker()
        '2': L.circleMarker()

      markerCreator = 
        create: (source, success, error) ->
          success(source: source, marker: markers[source._id])
      
      sml = new SourceMarkersLayer(markerCreator)

      sources = [
        { _id: "1" }
        { _id: "2" }
      ]

      sml.updateMarkersFromList(sources)

      assert.equal sml.getLayers().length, 2
      assert.equal sml.getLayers()[0], markers['1']

    it "replaces markers when success called twice", ->
      markers = 
        '1': L.circleMarker()
        '1a': L.circleMarker()
        '2': L.circleMarker()
        '2a': L.circleMarker()
      markerCreator = 
        create: (source, success, error) =>
          success(source: source, marker: markers[source._id])
          success(source: source, marker: markers[source._id + 'a'])
      
      sml = new SourceMarkersLayer(markerCreator)

      sources = [
        { _id: "1" }
        { _id: "2" }
      ]

      sml.updateMarkersFromList(sources)

      assert.equal sml.getLayers().length, 2
      assert.equal sml.getLayers()[0], markers['1a']


    context 'with existing markers', ->
      beforeEach ->
        @markers = 
          '1': L.circleMarker()
          '2': L.circleMarker()
          '3': L.circleMarker()

        @markerCreator = 
          create: (source, success, error) =>
            success(source: source, marker: @markers[source._id])
        
        @sml = new SourceMarkersLayer(@markerCreator)

        @sources = [
          { _id: "1" }
          { _id: "2" }
        ]

        @sml.updateMarkersFromList(@sources)

      it "removes missing source markers", ->
        sources = [
          { _id: "1" }
        ]
        @sml.updateMarkersFromList(sources)

        assert.equal @sml.getLayers().length, 1
        assert.equal @sml.getLayers()[0], @markers['1']

      it "does not recompute existing source markers", ->
        @markerCreator.create = ->
          throw "Fail"
        
        sources = [
          { _id: "1" }
          { _id: "2" }
        ]
        @sml.updateMarkersFromList(sources)

      it "adds new source markers", ->
        sources = [
          { _id: "3" }
        ]
        @sml.updateMarkersFromList(sources)

        assert.equal @sml.getLayers().length, 1
        assert.equal @sml.getLayers()[0], @markers['3']

      it "resets markers", ->
        @sml.resetMarkers()
        assert.equal @sml.getLayers().length, 0

  describe "updateMarkersFromBounds", ->
    it "queries bounds", ->
      sourcesDb = 
        find: (sel, opt) =>
          @sel = sel
          @opt = opt
          return { fetch: -> }

      sml = new SourceMarkersLayer(null, sourcesDb)

      southWest = new L.LatLng(10, 110)
      northEast = new L.LatLng(20, 120)
      bounds = new L.LatLngBounds(southWest, northEast)

      sml.updateMarkersFromList = ->
      sml.updateMarkersFromBounds(bounds)

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




