Page = require("../Page")
LocationView = require ("../LocationView")
forms = require '../forms'


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
    'click #select_source' : 'selectSource'

  create: ->
    @setLocation = @options.setLocation

  activate: ->
    @db.sources.findOne {_id: @options._id}, (source) =>
      @source = source
      @render()

      # Hide add/edit if not authorized
      @$("#edit_source_button").toggle(@auth.update("sources", source))
      @$("#add_test_button").toggle(@auth.insert("tests"))
      @$("#add_note_button").toggle(@auth.insert("source_notes"))

  render: ->
    @setTitle "Source " + @source.code

    if @auth.remove("sources", @source)
      @setupContextMenu [ { glyph: 'remove', text: "Delete Source", click: => @deleteSource() } ]
    else 
      @setupContextMenu [ ]

    menu = []
    if @auth.insert("tests")
      menu.push({ text: "Start Water Test", click: => @addTest() })
    if @auth.insert("source_notes")
      menu.push({ text: "Add Note", click: => @addNote() })

    @setupButtonBar [ { icon: "plus.png", menu: menu } ]

    # Re-render template
    @removeSubviews()
    @$el.html templates['pages/SourcePage'](source: @source, select: @options.onSelect?)

    # Set source type
    if @source.type?
      @db.source_types.findOne {code: @source.type}, (sourceType) =>
        if sourceType? then @$("#source_type").text(sourceType.name)

    # Add location view
    locationView = new LocationView(loc: @source.geo, readonly: not @auth.update("sources", @source))
    if @setLocation
      locationView.setLocation()
      @setLocation = false

    @listenTo locationView, 'locationset', (loc) ->
      @source.geo = loc
      @db.sources.upsert @source, => @render()

    @listenTo locationView, 'map', (loc) =>
      @pager.openPage(require("./SourceMapPage"), {initialGeo: loc})
      
    @addSubview(locationView)
    @$("#location").append(locationView.el)

    # Add tests
    @db.tests.find({source: @source.code}).fetch (tests) =>
      @$("#tests").html templates['pages/SourcePage_tests'](tests:tests)

      # Fill in names
      for test in tests
        @db.forms.findOne { code:test.type }, { mode: "local" }, (form) =>
          @$("#test_name_"+test._id).text(if form then form.name else "???")

    # Add notes
    @db.source_notes.find({source: @source.code}).fetch (notes) => 
      @$("#notes").html templates['pages/SourcePage_notes'](notes:notes)

    # Add photos
    photosView = new forms.ImagesQuestion
      id: 'photos'
      model: new Backbone.Model(@source)
      ctx: @ctx
      readonly: not @auth.update("sources", @source)
      
    photosView.model.on 'change', =>
      @db.sources.upsert @source.toJSON(), => @render()
    @$('#photos').append(photosView.el)

  editSource: ->
    @pager.openPage(require("./SourceEditPage"), { _id: @source._id})

  deleteSource: ->
    if @auth.remove("sources", @source) and confirm("Permanently delete source?")
      @db.sources.remove @source._id, =>
        @pager.closePage()
        @pager.flash "Source deleted", "success"

  addTest: ->
    @pager.openPage(require("./NewTestPage"), { source: @source.code})

  openTest: (ev) ->
    @pager.openPage(require("./TestPage"), { _id: ev.currentTarget.id})

  addNote: ->
    @pager.openPage(require("./SourceNotePage"), { source: @source.code })

  openNote: (ev) ->
    @pager.openPage(require("./SourceNotePage"), { source: @source.code, _id: ev.currentTarget.id})

  selectSource: ->
    if @options.onSelect?
      @pager.closePage()
      @options.onSelect(@source)