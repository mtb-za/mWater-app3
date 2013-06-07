Page = require("../Page")

module.exports = class SourcePage extends Page
  constructor: (ctx, _id) ->
    super(ctx)
    @_id = _id

  activate: ->
    @db.sources.findOne {_id: @_id}, (source) =>
      @setTitle "Source #{source.code}"
      @$el.html templates['pages/SourcePage'](source)

