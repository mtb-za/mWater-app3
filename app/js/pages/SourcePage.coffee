Page = require("../Page")

module.exports = class SourcePage extends Page
  activate: ->
    @db.sources.findOne {_id:@args[0]}, (source) =>
      @setTitle "Source #{source.code}"
      @$el.html templates['pages/SourcePage'](source)

