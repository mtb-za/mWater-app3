assert = chai.assert
LocationView = require '../app/js/LocationView'
UIDriver = require './helpers/UIDriver'

class MockLocationFinder
  constructor:  ->
    _.extend @, Backbone.Events

  getLocation: ->
  startWatch: ->
  stopWatch: ->

describe 'LocationView', ->
  context 'With no set location', ->
    beforeEach ->
      @locationFinder = new MockLocationFinder()
      @locationView = new LocationView(loc:null, locationFinder: @locationFinder)
      @ui = new UIDriver(@locationView.el)

    it 'displays Unspecified', ->
      assert.include(@ui.text(), 'Unspecified')

    it 'disables map', ->
      assert.isTrue @ui.getDisabled("Map") 

    it 'allows setting location', ->
      @ui.click('Set')
      setPos = null
      @locationView.on 'locationset', (pos) ->
        setPos = pos

      @locationFinder.trigger 'found', { coords: { latitude: 2, longitude: 3, accuracy: 10}}
      assert.equal setPos.coordinates[1], 2

    it 'Displays error', ->
      @ui.click('Set')
      setPos = null
      @locationView.on 'locationset', (pos) ->
        setPos = pos

      @locationFinder.trigger 'error'
      assert.equal setPos, null
      assert.include(@ui.text(), 'Cannot')


