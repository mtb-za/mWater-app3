
# A Leaflet Control displaying a warning message when the number of sites displayed is lower than the number of
# existing sites
module.exports = class ZoomToSeeMoreControl extends L.Control
  constructor: (maxSitesReturned) ->
    super({position: 'topleft'})
    @maxSitesReturned = maxSitesReturned
    @active = false

  onAdd: (map) ->
    return @createZoomInToSeeMore()


  # Display "zoom to see more" warning when there is @maxSitesReturned sites
  testTooManySitesWarning: (nbOfSites, map) ->
    if nbOfSites >= @maxSitesReturned
      if not @active
        @active = true
        map.addControl(this)
    else if @active
      @active = false
      map.removeControl(this)

  createZoomInToSeeMore: ->
    html = '''
<div class="warning legend">
<style>
.warning {
  padding: 6px 8px;
  font: 14px/16px Arial, Helvetica, sans-serif;
  background: yellow;
  background: rgba(255,255,0,0.8);
  box-shadow: 0 0 15px rgba(0,0,0,0.2);
  border-radius: 5px;
}
.legend {
    line-height: 18px;
    color: #555;
}
</style>
<b>''' + T('Zoom in to see more') + '''</b>
</div>
'''
    return $(html).get(0)
