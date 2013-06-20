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
    'click .test' : 'openTest'
    'click #select_source' : 'selectSource'

  create: ->
    @setLocation = @options.setLocation

  activate: ->
    @db.sources.findOne {_id: @options._id}, (source) =>
      @source = source
      @render()

  render: ->
    @setTitle "Source " + @source.code

    @setupContextMenu [
      { glyph: 'remove', text: "Delete Source", click: => @deleteSource() }
    ]

    @setupButtonBar [
      { icon: "plus-32.png", menu: [
        { text: "Start Water Test", click: => @addTest() }
        { text: "Add Note", click: => @addNote() }
      ]}
    ]

    # Re-render template
    @removeSubviews()
    @$el.html templates['pages/SourcePage'](source: @source, select: @options.onSelect?)

    # Set source type
    if @source.type?
      @db.source_types.findOne {code: @source.type}, (sourceType) =>
        if sourceType? then @$("#source_type").text(sourceType.name)

    # Add location view
    locationView = new LocationView(loc: @source.geo)
    if @setLocation
      locationView.setLocation()
      @setLocation = false

    @listenTo locationView, 'locationset', (loc) ->
      @source.geo = loc
      @db.sources.upsert @source, => @render()

    @listenTo locationView, 'map', (loc) ->
      @pager.openPage(require("./SourceMapPage"), {initialGeo: loc})
      
    @addSubview(locationView)
    @$("#location").append(locationView.el)

    # Add tests
    @db.tests.find({source: @source.code}).fetch (tests) ->
      @$("#tests").html templates['pages/SourcePage_tests'](tests:tests)

    # Add photos # TODO wire model to actual db
    photosView = new forms.PhotosQuestion
      id: 'photos'
      model: new Backbone.Model(@source)
      prompt: 'Photos'
    photosView.model.on 'change', =>
      @db.sources.upsert @source.toJSON(), => @render()

  editSource: ->
    @pager.openPage(require("./SourceEditPage"), { _id: @_id})

  deleteSource: ->
    if confirm("Permanently delete source?")
      @db.sources.remove @source._id, =>
        @pager.closePage()

  addTest: ->
    @pager.openPage(require("./NewTestPage"), { source: @source.code})

  openTest: (ev) ->
    @pager.openPage(require("./TestPage"), { _id: ev.currentTarget.id})

  addNote: ->
    alert("TODO")

  selectSource: ->
    if @options.onSelect?
      @pager.closePage()
      @options.onSelect(@source)