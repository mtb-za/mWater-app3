# Control which displays progress of offline caching on a map
# Create it each time before starting caching and it will add itself to the map and destroy itself
# as appropriate
module.exports = class CacheProgressControl extends Backbone.View
  constructor: (map, offlineLayer, position='topright') ->
    super()

    @map = map
    @offlineLayer = offlineLayer

    # Add self to the map as a control
    @leafletControl = L.control({position: position})
    @leafletControl.onAdd = (map) =>
      # Render self before adding
      @render()
      return @el

    # Listen for events
    @listenTo offlineLayer, 'tilecachingprogressstart', (e) =>
      @totalTiles = e.nbTiles
      @percent = 0
      @update()

    @listenTo offlineLayer, 'tilecachingprogress', (e) =>
      @percent = Math.floor((@totalTiles - e.nbTiles) / @totalTiles * 100)
      @update()

    @listenTo offlineLayer, 'tilecachingprogressdone', (e) =>
      # Remove control
      @map.removeControl(@leafletControl)
      @remove()

    map.addControl(@leafletControl)

  events: 
    "click #cancel": "cancel"

  cancel: ->
    if @offlineLayer.cancel()
      @cancelling = true
  
  update: ->
    if @cancelling
      message = T("Cancelling...")
    else if @percent?
      message = T("Saving {0}% complete", @percent)
    else
      message = T("Calculating...")
    @$("#message").text(message)

  render: ->
    @$el.html '''
    <div class="alert alert-info">
    <span id="message"></span> <button id="cancel" class="btn btn-xs btn-default">Cancel</button>
    </div>
    '''
    @update()
    this