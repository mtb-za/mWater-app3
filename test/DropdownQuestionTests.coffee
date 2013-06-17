assert = chai.assert
DropdownQuestion = require('forms').DropdownQuestion
UIDriver = require './helpers/UIDriver'

# class MockLocationFinder
#   constructor:  ->
#     _.extend @, Backbone.Events

#   getLocation: ->
#   startWatch: ->
#   stopWatch: ->

describe 'DropdownQuestion', ->
  context 'With a few options', ->
    beforeEach ->
      @model = new Backbone.Model()
      @question = new DropdownQuestion
        options: [['a', 'Apple'], ['b', 'Banana']]
        model: @model
        id: "q1"

    it 'accepts known value', ->
      @model.set(q1: 'a')
      assert.equal @model.get('q1'), 'a'
      assert.isFalse @question.$("select").is(":disabled")

    it 'is disabled with unknown value', ->
      @model.set(q1: 'x')
      assert.equal @model.get('q1'), 'x'
      assert.isTrue @question.$("select").is(":disabled")

#   context 'With set value', ->
#     beforeEach ->
#       @locationFinder = new MockLocationFinder()
#       @locationView = new LocationView(loc:null, locationFinder: @locationFinder)
#       @ui = new UIDriver(@locationView.el)

#     it 'displays Unspecified', ->
#       assert.include(@ui.text(), 'Unspecified')

#     it 'disables map', ->
#       assert.isTrue @ui.getDisabled("Map") 

#     it 'allows setting location', ->
#       @ui.click('Set')
#       setPos = null
#       @locationView.on 'locationset', (pos) ->
#         setPos = pos

#       @locationFinder.trigger 'found', { coords: { latitude: 2, longitude: 3, accuracy: 10}}
#       assert.equal setPos.coordinates[1], 2

#     it 'Displays error', ->
#       @ui.click('Set')
#       setPos = null
#       @locationView.on 'locationset', (pos) ->
#         setPos = pos

#       @locationFinder.trigger 'error'
#       assert.equal setPos, null
#       assert.include(@ui.text(), 'Cannot')

#   context 'With set location', ->
#     beforeEach ->
#       @locationFinder = new MockLocationFinder()
#       @locationView = new LocationView(loc: { type: "Point", coordinates: [10, 20]}, locationFinder: @locationFinder)
#       @ui = new UIDriver(@locationView.el)

#     it 'displays Waiting', ->
#       assert.include(@ui.text(), 'Waiting')

#     it 'displays relative', ->
#       @locationFinder.trigger 'found', { coords: { latitude: 21, longitude: 10, accuracy: 10}}
#       assert.include(@ui.text(), '111.2km S')

