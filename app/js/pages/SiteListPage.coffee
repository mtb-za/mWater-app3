async = require 'async'
Page = require("../Page")
SitePage = require("./SitePage")
LocationFinder = require '../LocationFinder'
GeoJSON = require '../GeoJSON'

# Lists nearby and unlocated sites
# Options: onSelect - function to call with site doc when selected
module.exports = class SiteListPage extends Page
  events: 
    'click tr.tappable' : 'siteClicked'
    'click #search_cancel' : 'cancelSearch'
    "click #new_site": 'addSite'
    "click #new_survey": ->
      # defer to Allow menu to close first
      _.defer => @pager.openPage(require("./NewSurveyPage"))
    "click #new_test": -> 
      # defer to Allow menu to close first
      _.defer => @pager.openPage(require("./NewTestPage"))

  create: ->
    @setTitle T('Nearby Sites')

    # Create cache of thumbnail urls by image id
    @thumbnailUrls = {}

    # Create queue of thumbnails
    @thumbnailQueue = async.queue(@processThumbnail, 1)

  activate: ->
    @$el.html require('./SiteListPage.hbs')()
    @nearSites = []
    @unlocatedSites = []

    # Find location
    @locationFinder = new LocationFinder()
    @locationFinder.getLocation(@locationFound, @locationError)
    @$("#location_msg").show()

    @setupButtonBar [
      { icon: "buttonbar-search.png", click: => @search() }
      { text: T("Map"), click: => @pager.closePage(require("./SiteMapPage"))}  
    ]

    # Query database for unlocated sites
    if @login
      @db.sites.find(geo: { $exists: false }, user: @login.user).fetch (sites) =>
        @unlocatedSites = sites
        @renderList()
      , @error

    @performSearch()

  deactivate: ->
    # Kill all items in thumbnail queuu
    @thumbnailQueue.kill()

  processThumbnail: (imageId, callback) =>
    # Process a single thumbnail to be looked up. Thumbnails are in list as placeholders and their 
    # url is looked up in a queue

    # Check if cached
    if @thumbnailUrls[imageId]
      @$("#" + imageId).attr("src", @thumbnailUrls[imageId])
      callback()
    else
      @imageManager.getImageThumbnailUrl imageId, (imageUrl) =>
        # Cache url
        @thumbnailUrls[imageId] = imageUrl
        @$("#" + imageId).attr("src", imageUrl)

        # Don't overload the client with lookups
        setTimeout callback, 20
      , =>
        # Display this image on error
        @$("#" + imageId).attr("src", "img/no-image-icon.jpg")

        # Don't overload the client with lookups
        setTimeout callback, 20

  addSite: ->
    # defer to Allow menu to close first
    _.defer =>
      # Wrap onSelect
      onSelect = undefined
      if @options.onSelect
        onSelect = (site) =>
          @pager.closePage()
          @options.onSelect(site)
      @pager.openPage(require("./NewSitePage"), {onSelect: onSelect})
    
  locationFound: (pos) =>
    if @destroyed
      return

    @$("#location_msg").hide()

    # Save position
    @pos = pos
    selector = geo: 
      $near: 
        $geometry: GeoJSON.posToPoint(pos)

    # Query database for near sites
    @db.sites.find(selector, { limit: 100 }).fetch (sites) =>
      @nearSites = sites
      @renderList()
    , @error

  renderList: ->
    # Append located and unlocated sites
    if @searchText and @searchSites?
      sites = @searchSites
    else
      sites = @unlocatedSites.concat(@nearSites)

    # Clone list as we will modify site list items and don't want to confuse minimongo
    sites = _.cloneDeep(sites)

    sites.forEach (site) ->
      # If there is a cover photo, use it as the thumbnail
      if site.photos
        coverPhoto = _.findWhere(site.photos, { cover: true })
        if coverPhoto
          site.thumbnail = coverPhoto.id

      # Set type name
      site.typeName = _.map(site.type, T).join(": ")
    
    # Kill all items in thumbnail queue (since we are re-rendering)
    @thumbnailQueue.kill()

    @$("#table").html require('./SiteListPage_items.hbs')(sites:sites)

    # Look up cached image thumbnails
    for site in sites
      if site.thumbnail
        # If cached
        if @thumbnailUrls[site.thumbnail]
          @$("#" + site.thumbnail).attr("src", @thumbnailUrls[site.thumbnail])
        else
          @thumbnailQueue.push(site.thumbnail)

  locationError: (pos) =>
    if @destroyed
      return
    @$("#location_msg").hide()
    @pager.flash T("Unable to determine location"), "danger"

  siteClicked: (ev) ->
    # Wrap onSelect
    onSelect = undefined
    if @options.onSelect
      onSelect = (site) =>
        @pager.closePage()
        @options.onSelect(site)
    @pager.openPage(SitePage, { _id: ev.currentTarget.id, onSelect: onSelect})

  search: ->
    # Prompt for search
    @searchText = prompt(T("Enter search text or ID of site"))
    @performSearch()

  performSearch: ->
    if @searchText and @searchText.length>0
      @$("#search_bar").show()
    else
      @$("#search_bar").hide()
      
    @$("#search_text").text(@searchText)
    if @searchText
      # If digits, search for code
      if @searchText.match(/^\d+$/)
        selector = { code: @searchText }
      else
        selector = { $or: [ { name: { $regex : @searchText,  $options: 'i' } }, { desc: { $regex : @searchText,  $options: 'i' } } ] }
        
      @db.sites.find(selector, {limit: 100}).fetch (sites) =>
        siteScorer = (s) =>
          # Calculate score
          score = 0

          # Unlocated goes first
          if not s.geo?
            score += 1000000

          # Relative distance removes one point per km
          if s.geo? and @pos
            dist = GeoJSON.getDistance(s.geo, GeoJSON.posToPoint(@pos))
            score -= dist/1000

          # Name match is a 100000 bump
          if name
            if s.name.match(new RegExp(@searchText, "i"))
              score += 100000

          # Since sorts by score ascending
          return -score

        sites = _.sortBy sites, siteScorer
        @searchSites = sites
        @renderList()
      , @error
    else
      @renderList()

  cancelSearch: ->
    @searchText = ""
    @performSearch()

