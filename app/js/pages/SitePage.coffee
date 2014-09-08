Page = require("../Page")
RelativeLocationView = require '../RelativeLocationView'
forms = require 'mwater-forms'
GeoJSON = require '../GeoJSON'
ImagePage = require './ImagePage'

# Displays a site
# onSelect - call when site is selected via button that appears
module.exports = class SitePage extends Page
  events:
    'click #edit_site_button' : 'editSite'
    'click #add_test_button' : 'addTest'
    'click #add_note_button' : 'addNote'
    'click #add_test' : 'addTest'
    'click #add_note' : 'addNote'
    'click .test' : 'openTest'
    'click .note' : 'openNote'
    'click .survey' : 'openSurvey'
    'click #select_site' : 'selectSite'
    'click #status_ok': -> @updateStatus('ok')
    'click #status_maint': -> @updateStatus('maint')
    'click #status_broken': -> @updateStatus('broken')
    'click #status_missing': -> @updateStatus('missing')
    'click #cover_photo': 'openCoverPhoto'

  activate: ->
    @query()
    @setTitle T('Site')

  query: ->
    @db.sites.findOne {_id: @options._id}, (site) =>
      if not site
        alert(T("Site not found"))
        @pager.closePage()
        return

      @site = site
      @render()

    , @error

  deactivate: ->
    # Remove subviews to speed up application
    @removeSubviews()
    
  render: ->
    @setTitle T("Site {0}", @site.code)

    # Add delete site
    if @auth.remove("sites", @site)
      menu = [
        { text: T("Delete Site"), id: "delete_site", click: => @deleteSite() }
      ]

      @setupButtonBar [ { icon: "buttonbar-gear.png", menu: menu } ]
    else
      @setupButtonBar [ ]

    # Set site type
    siteTypeName =  _.map(@site.type, T).join(" - ")

    # Get attributes
    attrs = []
    if @site.attrs
      for attr, answer of @site.attrs
        if answer
          if answer.value and _.isArray(answer.value)
            attrs.push { key: T(attr), value: _.map(answer.value, T).join(", ") }
          else if answer.value
            attrs.push { key: T(attr), value: T(answer.value) }
          else if answer.alternate == "dontknow"
            attrs.push { key: T(attr), value: T("Don't Know") }

    # Re-render template
    @removeSubviews()
    data = {
      site: @site
      siteTypeName: siteTypeName
      attrs: attrs
      select: @options.onSelect?
      isWaterPoint: @site.type[0] == "Water point"
      coverPhoto: _.findWhere(@site.photos, { cover: true })
    }

    @$el.html require('./SitePage.hbs')(data)

    # Hide add/edit if not authorized
    @$("#edit_site_button").toggle(@auth.update("sites", @site))
    @$("#add_test_button").toggle(@auth.insert("tests"))
    @$("#add_note_button").toggle(@auth.insert("source_notes"))

    # Add cover photo
    if data.coverPhoto
      @imageManager.getImageThumbnailUrl data.coverPhoto.id, (imageUrl) =>
        @coverPhoto = data.coverPhoto
        @$("#cover_photo_container").html('<img id="cover_photo" src="' + imageUrl + '" class="img-thumbnail" style="width: 160px;">')

    # Set visibility of add buttons
    if @site.type[0] != "Water point" or not @auth.insert("source_notes") or not @auth.insert("tests") 
      @$("#bottom_navbar").hide()
    
    # Add location view
    if @site.location
      locationView = new RelativeLocationView(loc: @site.location, showMap: true)

      @listenTo locationView, 'map', (loc) =>
        @pager.openPage(require("./SiteMapPage"), {initialGeo: GeoJSON.locToPoint(loc)})
        
      @addSubview(locationView)
      @$("#location").append(locationView.el)
    else
      @$("#location").html(T("No Location Set"))

    # Add tests
    if @site.type[0] == "Water point"
      @db.tests.find({"data.source": @site.code}, {sort: [['started','desc']]}).fetch (tests) =>
        @$("#tests").html require('./SitePage_tests.hbs')(tests:tests)

        # Fill in names
        for test in tests
          @db.forms.findOne { code:test.type }, { mode: "local" }, (form) =>
            @$("#test_name_"+test._id).text(if form then form.name else "???")
          , @error
      , @error

      # Add notes
      @db.source_notes.find({source: @site.code}, {sort: [['date','desc']]}).fetch (notes) => 
        @$("#notes").html require('./SitePage_notes.hbs')(notes:notes)

        # Determine status
        if notes.length > 0
          status = notes[0].status
          date = notes[0].date
        else
          status = null
          date = null

        @$("#status").html require('./SitePage_status.hbs')(status:status, date: date, canUpdate: @auth.insert("source_notes"))
      , @error

      # # Add surveys
      # @db.responses.find({"data.source": @site.code}).fetch (surveys) =>
      #   @$("#surveys").html require('./SitePage_surveys.hbs')(surveys:surveys)

      #   # Fill in names
      #   for survey in surveys
      #     @db.forms.findOne { code:survey.type }, { mode: "local" }, (form) =>
      #       @$("#survey_name_"+survey._id).text(if form then form.name else "???")
      #     , @error
      # , @error

    # Add photos
    formsCtx  = {
      displayImage: (options) =>
        @pager.openPage(ImagePage, { id: options.id, onRemove: options.remove, onSetCover: options.setCover })
      imageManager: @ctx.imageManager
      imageAcquirer: @ctx.imageAcquirer
    }

    photosView = new forms.ImagesQuestion
      id: 'photos'
      model: new Backbone.Model(@site)
      ctx: formsCtx
      T: T
      readonly: not @auth.update("sites", @site)
      
    photosView.model.on 'change', =>
      # Get photos
      photos = photosView.model.get("photos").value

      # Set cover photo if not set
      if photos.length > 0 and not _.findWhere(photos, { cover: true })
        photos[0].cover = true

      @site.photos = photos

      @db.sites.upsert @site, => 
        @query()
      , @error
    @$('#photos').append(photosView.el)

  openCoverPhoto: ->
    @pager.openPage(ImagePage, { id: options.id, onRemove: options.remove, onSetCover: options.setCover })

  editSite: ->
    @pager.openPage(require("./SiteEditPage"), { _id: @site._id})

  deleteSite: ->
    if @auth.remove("sites", @site) and confirm(T("Permanently delete site?"))
      @db.sites.remove @site._id, =>
        @pager.closePage()
        @pager.flash T("Site deleted"), "success"
      , @error

  addTest: ->
    @pager.openPage(require("./NewTestPage"), { source: @site.code})

  openTest: (ev) ->
    @pager.openPage(require("./TestPage"), { _id: ev.currentTarget.id})

  openSurvey: (ev) ->
    @pager.openPage(require("./SurveyPage"), { _id: ev.currentTarget.id})

  addNote: ->
    @pager.openPage(require("./SourceNotePage"), { source: @site.code })

  openNote: (ev) ->
    @pager.openPage(require("./SourceNotePage"), { source: @site.code, _id: ev.currentTarget.id})

  selectSite: ->
    if @options.onSelect?
      @pager.closePage()
      @options.onSelect(@site)

  updateStatus: (status) ->
    # Find existing note to update
    @db.source_notes.findOne {source: @site.code, user: @login.user}, {sort: [['date','desc']]}, (sourceNote) =>
      # If same day by me
      if sourceNote and sourceNote.date.substr(0, 10) == new Date().toISOString().substr(0, 10)
        sourceNote.status = status
      else
        sourceNote = {
          source: @site.code
          status: status
          date: new Date().toISOString()
          user: @login.user
        }

      @db.source_notes.upsert sourceNote, =>
        @render()
      , @error
    , @error

