Page = require("../Page")

module.exports = class SourcePage extends Page
  activate: ->
    @$el.html templates['pages/SourcePage']()

