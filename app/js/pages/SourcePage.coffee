Page = require("../Page")
LocationView = require ("../LocationView")

module.exports = class SourcePage extends Page
  constructor: (ctx, _id) ->
    super(ctx)
    @_id = _id

  events:
    'click #edit_source_button' : 'editSource'

  activate: ->
    @db.sources.findOne {_id: @_id}, (source) =>
      @source = source
      @render()

  render: ->
    @setTitle "Source " + @source.code

    @removeSubviews()
    @$el.html templates['pages/SourcePage'](@source)

    # Set source type
    if @source.source_type?
      @db.source_types.findOne {code: @source.source_type}, (sourceType) =>
        if sourceType? then @$("#source_type").text(sourceType.name)

    # Add location view
    locationView = new LocationView(loc: @source.geo)
    @addSubview(locationView)
    @$("#location").append(locationView.el)

  editSource: ->
    @pager.openPage(require("./SourceEditPage"), @_id)