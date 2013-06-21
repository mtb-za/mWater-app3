Page = require("../Page")
LocationFinder = require '../LocationFinder'
GeoJSON = require '../GeoJSON'

# TODO source search

# Lists nearby and unlocated sources
# Options: onSelect - function to call with source doc when selected
module.exports = class SourceListPage extends Page
  events: 
    'click tr.tappable' : 'sourceClicked'
    'click #search_cancel' : 'cancelSearch'

  create: ->
    @setTitle 'Nearby Sources'

  activate: ->
    @$el.html templates['pages/SourceListPage']()
    @nearSources = []
    @unlocatedSources = []

    # Find location
    @locationFinder = new LocationFinder()
    @locationFinder.on('found', @locationFound).on('error', @locationError)
    @locationFinder.getLocation()
    @$("#location_msg").show()

    @setupButtonBar [
      { icon: "search.png", click: => @search() }
      { icon: "plus.png", click: => @addSource() }
    ]

    # Query database for unlocated sources # TODO only by user
    @db.sources.find(geo: {$exists:false}).fetch (sources) =>
      @unlocatedSources = sources
      @renderList()

    @performSearch()

  addSource: ->
    @pager.openPage(require("./NewSourcePage"))
    
  locationFound: (pos) =>
    @$("#location_msg").hide()
    selector = geo: 
        $near: 
          $geometry: GeoJSON.posToPoint(pos)

    # Query database for near sources
    @db.sources.find(selector).fetch (sources) =>
      @nearSources = sources
      @renderList()

  renderList: ->
    # Append located and unlocated sources
    if not @searchText
      sources = @unlocatedSources.concat(@nearSources)
    else
      sources = @searchSources

    @$("#table").html templates['pages/SourceListPage_items'](sources:sources)

  locationError: (pos) =>
    @$("#location_msg").hide()
    @pager.flash "Unable to determine location", "error"

  sourceClicked: (ev) ->
    # Wrap onSelect
    onSelect = undefined
    if @options.onSelect
      onSelect = (source) =>
        @pager.closePage()
        @options.onSelect(source)
    @pager.openPage(require("./SourcePage"), { _id: ev.currentTarget.id, onSelect: onSelect})

  search: ->
    # Prompt for search
    @searchText = prompt("Enter search text or ID of water source")
    @performSearch()

  performSearch: ->
    @$("#search_bar").toggle(@searchText and @searchText.length>0)
    @$("#search_text").text(@searchText)
    if @searchText
      # If digits, search for code
      if @searchText.match(/^\d+$/)
        selector = { code: @searchText }
      else
        selector = { name: new RegExp(@searchText,"i")}
        
      @db.sources.find(selector, {limit: 50}).fetch (sources) =>
        @searchSources = sources
        @renderList()
    else
      @renderList()

  cancelSearch: ->
    @searchText = ""
    @performSearch()

