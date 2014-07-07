Page = require("../Page")
LocationView = require('mwater-forms').LocationView
forms = require '../forms'
GeoJSON = require '../GeoJSON'

# Displays a source
# Options: setLocation - true to autoset location
# onSelect - call when source is selected via button that appears
module.exports = class SourcePage extends Page
  events:
    'click #edit_source_button' : 'editSource'
    'click #add_test_button' : 'addTest'
    'click #add_note_button' : 'addNote'
    'click .test' : 'openTest'
    'click .note' : 'openNote'
    'click .survey' : 'openSurvey'
    'click #select_source' : 'selectSource'
    'click #status_ok': -> @updateStatus('ok')
    'click #status_repair': -> @updateStatus('repair')
    'click #status_broken': -> @updateStatus('broken')
    'click #status_missing': -> @updateStatus('missing')

  create: ->
    @setLocation = @options.setLocation

  activate: ->
    @query()
    @setTitle T('Source')

  query: ->
    @db.sources.findOne {_id: @options._id}, (source) =>
      if not source
        alert(T("Source not found"))
        @pager.closePage()
        return

      @source = source
      @render()

      # Hide add/edit if not authorized
      @$("#edit_source_button").toggle(@auth.update("sources", source))
      @$("#add_test_button").toggle(@auth.insert("tests"))
      @$("#add_note_button").toggle(@auth.insert("source_notes"))
    , @error

  render: ->
    @setTitle T("Source {0}", @source.code)

    if @auth.remove("sources", @source)
      @setupContextMenu [ { glyph: 'remove', text: T("Delete Source"), click: => @deleteSource() } ]
    else 
      @setupContextMenu [ ]

    menu = []
    if @auth.insert("tests")
      menu.push({ text: T("Start Water Test"), click: => @addTest() })
    if @auth.insert("source_notes")
      menu.push({ text: T("Add Note"), click: => @addNote() })

    @setupButtonBar [ { icon: "plus.png", menu: menu } ]

    # Re-render template
    @removeSubviews()
    @$el.html require('./SourcePage.hbs')(source: @source, select: @options.onSelect?)

    # Set source type
    if @source.type?
      @db.source_types.findOne {code: @source.type}, (sourceType) =>
        if sourceType? then @$("#source_type").text(sourceType.name)
      , @error

    # Add location view
    locationView = new LocationView(
      loc: GeoJSON.geoToLoc(@source.geo)
      readonly: not @auth.update("sources", @source)
      T: T)
    if @setLocation
      locationView.setLocation()
      @setLocation = false

    @listenTo locationView, 'locationset', (loc) ->
      geo = GeoJSON.locToPoint(loc)
      if geo?
        @source.geo = geo
      else  
        delete @source.geo
      @db.sources.upsert @source, => 
        @render()
      , @error

    @listenTo locationView, 'map', (loc) =>
      @pager.openPage(require("./SourceMapPage"), {initialGeo: GeoJSON.locToPoint(loc)})
      
    @addSubview(locationView)
    @$("#location").append(locationView.el)

    # Add tests
    @db.tests.find({"data.source": @source.code}, {sort: [['started','desc']]}).fetch (tests) =>
      @$("#tests").html require('./SourcePage_tests.hbs')(tests:tests)

      # Fill in names
      for test in tests
        @db.forms.findOne { code:test.type }, { mode: "local" }, (form) =>
          @$("#test_name_"+test._id).text(if form then form.name else "???")
        , @error
    , @error

    # Add notes
    @db.source_notes.find({source: @source.code}, {sort: [['date','desc']]}).fetch (notes) => 
      @$("#notes").html require('./SourcePage_notes.hbs')(notes:notes)

      # Determine status
      if notes.length > 0
        status = notes[0].status
        date = notes[0].date
      else
        status = null
        date = null

      @$("#status").html require('./SourcePage_status.hbs')(status:status, date: date, canUpdate: @auth.insert("source_notes"))
    , @error

    # Add surveys
    @db.responses.find({"data.source": @source.code}).fetch (surveys) =>
      @$("#surveys").html require('./SourcePage_surveys.hbs')(surveys:surveys)

      # Fill in names
      for survey in surveys
        @db.forms.findOne { code:survey.type }, { mode: "local" }, (form) =>
          @$("#survey_name_"+survey._id).text(if form then form.name else "???")
        , @error
    , @error

    # Add photos
    photosView = new forms.ImagesQuestion
      id: 'photos'
      model: new Backbone.Model(@source)
      ctx: @ctx
      readonly: not @auth.update("sources", @source)
      
    # Upsert model as this.source may have changed on activate to new copy
    photosView.model.on 'change', =>
      @db.sources.upsert photosView.model.toJSON(), => 
        @query()
      , @error
    @$('#photos').append(photosView.el)

  editSource: ->
    @pager.openPage(require("./SourceEditPage"), { _id: @source._id})

  deleteSource: ->
    if @auth.remove("sources", @source) and confirm(T("Permanently delete source?"))
      @db.sources.remove @source._id, =>
        @pager.closePage()
        @pager.flash T("Source deleted"), "success"
      , @error

  addTest: ->
    @pager.openPage(require("./NewTestPage"), { source: @source.code})

  openTest: (ev) ->
    @pager.openPage(require("./TestPage"), { _id: ev.currentTarget.id})

  openSurvey: (ev) ->
    @pager.openPage(require("./SurveyPage"), { _id: ev.currentTarget.id})

  addNote: ->
    @pager.openPage(require("./SourceNotePage"), { source: @source.code })

  openNote: (ev) ->
    @pager.openPage(require("./SourceNotePage"), { source: @source.code, _id: ev.currentTarget.id})

  selectSource: ->
    if @options.onSelect?
      @pager.closePage()
      @options.onSelect(@source)

  updateStatus: (status) ->
    # Find existing note to update
    @db.source_notes.findOne {source: @source.code, user: @login.user}, {sort: [['date','desc']]}, (sourceNote) =>
      # If same day by me
      if sourceNote and sourceNote.date.substr(0, 10) == new Date().toISOString().substr(0, 10)
        sourceNote.status = status
      else
        sourceNote = {
          source: @source.code
          status: status
          date: new Date().toISOString()
          user: @login.user
        }

      @db.source_notes.upsert sourceNote, =>
        @render()
      , @error
    , @error

