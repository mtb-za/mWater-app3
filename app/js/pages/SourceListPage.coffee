Page = require("../Page")
SourcePage = require("./SourcePage")
LocationFinder = require '../LocationFinder'
GeoJSON = require '../GeoJSON'


# Lists nearby and unlocated sources
# Options: onSelect - function to call with source doc when selected
module.exports = class SourceListPage extends Page
  events: 
    'click tr.tappable' : 'sourceClicked'
    'click #search_cancel' : 'cancelSearch'

  create: ->
    @setTitle T('Nearby Sources')

  activate: ->
    @$el.html require('./SourceListPage.hbs')()
    @nearSources = []
    @unlocatedSources = []

    # Find location
    @locationFinder = new LocationFinder()
    @locationFinder.getLocation(@locationFound, @locationError)
    @$("#location_msg").show()

    @setupButtonBar [
      { icon: "search.png", click: => @search() }
      { icon: "plus.png", click: => @addSource() }
    ]

    # Query database for unlocated sources
    if @login
      @db.sources.find(geo: { $exists: false }, user: @login.user).fetch (sources) =>
        @unlocatedSources = sources
        @renderList()

    @performSearch()

  addSource: ->
    # Wrap onSelect
    onSelect = undefined
    if @options.onSelect
      onSelect = (source) =>
        @pager.closePage()
        @options.onSelect(source)
    @pager.openPage(require("./NewSourcePage"), {onSelect: onSelect})
    
  locationFound: (pos) =>
    @$("#location_msg").hide()
    selector = geo: 
      $near: 
        $geometry: GeoJSON.posToPoint(pos)

    # Query database for near sources
    @db.sources.find(selector, { limit: 100 }).fetch (sources) =>
      @nearSources = sources
      @renderList()

  renderList: ->
    # Append located and unlocated sources
    if not @searchText
      sources = @unlocatedSources.concat(@nearSources)
    else
      sources = @searchSources

    # If there are photos, use the first one as the thumbnail
    sources.forEach (source) ->
      source.thumbnail = if source.photos and source.photos.length then source.photos[0].id else null
    
    @$("#table").html require('./SourceListPage_items.hbs')(sources:sources)

  locationError: (pos) =>
    @$("#location_msg").hide()
    @pager.flash T("Unable to determine location"), "error"

  sourceClicked: (ev) ->
    # Wrap onSelect
    onSelect = undefined
    if @options.onSelect
      onSelect = (source) =>
        @pager.closePage()
        @options.onSelect(source)
    @pager.openPage(SourcePage, { _id: ev.currentTarget.id, onSelect: onSelect})

  search: ->
    # Prompt for search
    @searchText = prompt(T("Enter search text or ID of water source"))
    @performSearch()

  performSearch: ->
    @$("#search_bar").toggle(@searchText and @searchText.length>0)
    @$("#search_text").text(@searchText)
    if @searchText
      # If digits, search for code
      if @searchText.match(/^\d+$/)
        selector = { code: @searchText }
      else
        selector = { $or: [ { name: { $regex : @searchText,  $options: 'i' } }, { desc: { $regex : @searchText,  $options: 'i' } } ] }
        
      @db.sources.find(selector, {limit: 50}).fetch (sources) =>
        @searchSources = sources
        @renderList()
    else
      @renderList()

  cancelSearch: ->
    @searchText = ""
    @performSearch()

