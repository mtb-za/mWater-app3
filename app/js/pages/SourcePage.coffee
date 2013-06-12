Page = require("../Page")

module.exports = class SourcePage extends Page
  constructor: (ctx, _id) ->
    super(ctx)
    @_id = _id

  events:
    'click #edit_source_button' : 'editSource'

  activate: ->
    @db.sources.findOne {_id: @_id}, (source) =>
      @setTitle "Source #{source.code}"
      @$el.html templates['pages/SourcePage'](source)

  editSource: ->
    @pager.openPage(require("./SourceEditPage"), @_id)