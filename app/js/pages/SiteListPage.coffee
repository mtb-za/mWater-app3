async = require 'async'
Page = require("../Page")
SitePage = require("./SitePage")
LocationFinder = require("mwater-forms").LocationFinder
GeoJSON = require '../GeoJSON'
siteTypes = require('mwater-common').siteTypes

# Lists nearby and unlocated sites
# Options: 
# onSelect - function to call with site doc when selected
# filterSiteTypes: list of site types to include. null for all
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

    # Wrap onSelect to close page
    if @options.onSelect
      @onSelect = (site) =>
        @pager.closePage()
        @options.onSelect(site)

    # Create cache of thumbnail urls by image id
    @thumbnailUrls = {}

    # Create queue of thumbnails
    @thumbnailQueue = async.queue(@processThumbnail, 1)

    # Create filter of site types
    @siteTypesFilter = {}
    if @options.filterSiteTypes
      @siteTypesFilter.type = { $in: @options.filterSiteTypes }

  activate: ->
    @$el.html require('./SiteListPage.hbs')()
    @nearSites = []
    @unlocatedSites = []

    # Update groups
    if @updateGroupsList
      @updateGroupsList()

    # Find location
    @locationFinder = new LocationFinder(this)
    @locationFinder.getLocation(@locationFound, @locationError)
    @$("#location_msg").show()

    @configureButtonBars()
    @performSearch()

  # Configure gear menu 
  configureButtonBars: ->
    # Get options for site menu
    options = @getSiteScopeOptions()

    # If current option is invalid, set to first one
    if not (@scope in _.pluck(options, "type"))
      @scope = options[0].type

    # Create a dropdown menu using the Site Scope Options
    menu = _.map options, (scope) =>
      text: scope.display
      id: "site_scope_" + scope.type
      click: => @updateSiteScope(scope.type)
      checked: @scope == scope.type

    # Add Site Types options to dropdown menu if the page is not already filtered by site types (using options)
    if not @options.filterSiteTypes
      # initialize @siteType
      if not @siteType
        @siteType = null
      menu.push { separator: true }

      # Add all types option
      menu.push {
        text: T("All Types")
        id: "all"
        click: => @updateSiteType(null)
        checked: @siteType == null
      }

      # Add all primary site types
      Array::push.apply menu, _.map siteTypes, (siteType) =>
        text: T(siteType.name)
        id: siteType.name
        click: => @updateSiteType(siteType)
        checked: @siteType == siteType

    @setupButtonBar [
      { icon: "buttonbar-gear.png", menu: menu }
      { icon: "buttonbar-search.png", click: => @search() }
      { text: T("Map"), click: => @pager.closePage(require("./SiteMapPage"), {onSelect: @options.onSelect, filterSiteTypes: @options.filterSiteTypes})} 
    ]

  # Options for the dropdown menu
  getSiteScopeOptions: =>
    options = [{ display: T("All Sites"), type: "all", value: {} }]
    # Only show groups choice if user has groups
    if @login?
      if @login.groups.length > 0
        options.push { 
          display: T("Only My Groups")
          type: "groups"
          value: { "created.for": { $in: @login.groups } }
        }

      if @login.user?
        options.push { display: T("Only Mine"), type: "user", value: { "created.by": @login.user } }
    return options

  # Filter the sites by type
  updateSiteType: (siteType) =>
    @siteType = siteType
    if siteType != null
      @siteTypesFilter.type = { $in: [siteType.name] }
    else
      @siteTypesFilter = {}

    # Update search
    @performSearch()

    # Update UI
    @configureButtonBars()

  # Filter the sites by all, groups, or user
  updateSiteScope: (scope) => 
    @scope = scope

    # Update search
    @performSearch()

    # Update UI
    @configureButtonBars()

  # Calculate filter to use for sites
  calculateSiteFilter: ->
    option = _.findWhere(@getSiteScopeOptions(), { type: @scope })
    if option
      return _.extend(option.value, @siteTypesFilter) 
    else
      return @siteTypesFilter

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
      @pager.openPage(require("./NewSitePage"), { onSelect: @onSelect, filterSiteTypes: @options.filterSiteTypes })
    
  locationFound: (pos) =>
    if @destroyed
      return

    @$("#location_msg").hide()

    # Save position
    @pos = pos
    @performSearch()

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
    @pager.openPage(SitePage, { _id: ev.currentTarget.id, onSelect: @onSelect})

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

      # Filter by site filters
      selector = _.extend(selector, @calculateSiteFilter())
        
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
      # Redo search if position is available
      if @pos
        selector = geo: 
          $near: 
            $geometry: GeoJSON.posToPoint(@pos)

        # Query database for near sites matching site filters
        selector = _.extend(selector, @calculateSiteFilter())

        @db.sites.find(selector, { limit: 100 }).fetch (sites) =>
          @nearSites = sites
          @renderList()
        , @error

      # Query database for unlocated sites
      if @login
        # Filter by my unlocated sites and siteTypes 
        selector = _.extend({ geo: { $exists: false }, "created.by": @login.user }, @siteTypesFilter)
        @db.sites.find(selector).fetch (sites) =>
          @unlocatedSites = sites
          @renderList()
        , @error

  cancelSearch: ->
    @searchText = ""
    @performSearch()

