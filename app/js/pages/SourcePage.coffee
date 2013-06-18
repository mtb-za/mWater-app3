Page = require("../Page")
LocationView = require ("../LocationView")

module.exports = class SourcePage extends Page
  constructor: (ctx, _id, options={}) ->
    super(ctx)
    @_id = _id
    if options.setLocation
      @setLocation = true

  events:
    'click #edit_source_button' : 'editSource'
    'click #add_test_button' : 'addTest'
    'click .test' : 'openTest'

  activate: ->
    @db.sources.findOne {_id: @_id}, (source) =>
      @source = source
      @render()

  render: ->
    @setTitle "Source " + @source.code

    @removeSubviews()
    @$el.html templates['pages/SourcePage'](@source)

    # Set source type
    if @source.type?
      @db.source_types.findOne {code: @source.type}, (sourceType) =>
        if sourceType? then @$("#source_type").text(sourceType.name)

    # Add location view
    locationView = new LocationView(loc: @source.geo)
    if @setLocation
      locationView.setLocation()
      
    @addSubview(locationView)
    @$("#location").append(locationView.el)

    # Add tests
    @db.tests.find({source: @source.code}).fetch (tests) ->
      @$("#tests").html templates['pages/SourcePage_tests'](tests:tests)

  editSource: ->
    @pager.openPage(require("./SourceEditPage"), @_id)

  addTest: ->
    @pager.openPage(require("./NewTestPage"), @source.code)

  openTest: (ev) ->
    @pager.openPage(require("./TestPage"), ev.currentTarget.id)
