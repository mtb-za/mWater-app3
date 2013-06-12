assert = chai.assert
LocationView = require '../app/js/LocationView'
UIDriver = require './helpers/UIDriver'

class MockLocationFinder
  constructor: (success, error) ->
    @success = success
    @error = error

  getLocation: ->
  startWatch: ->
  stopWatch: ->

describe 'LocationView', ->
  context 'With no set location', ->
    beforeEach ->
      @locationFinder = new MockLocationFinder()
      @locationView = new LocationView(loc:null, locationFinderClass: @locationFinder)
      @ui = new UIDriver(@locationView.el)

    it 'displays Unspecified', ->
      assert.include(@ui.text(), 'Unspecified')

    it 'disables map', ->
      assert.isTrue @ui.getDisabled("Map") 

    it 'allows setting location'

