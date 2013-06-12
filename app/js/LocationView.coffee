LocationFinder = require './LocationFinder'

# Shows the relative location of a point and allows setting it
class LocationView extends Backbone.View
  constructor: (options) ->
    super()
    @loc = options.loc
    @setLocation = options.setLocation

    # Allow overriding of location finder class
    @locationFinder = new (options.locationFinderClass || LocationFinder)(@locationSuccess, @locationError)

    # Start tracking location if set or setting
    if @loc or @setLocation
      @locationFinder.startWatch()

    @render()

  render: ->
    @$el.html templates['LocationView']()
    if not @loc and not @setLocation
      @$("#location_relative").text("Unspecified location")
    else if @setLocation
      @$("#location_relative").text("Setting location...")
    else

module.exports = LocationView