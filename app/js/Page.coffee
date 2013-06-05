class Page extends Backbone.View
  constructor: (ctx) ->
    super()
    @ctx = ctx

  className: "page"
  start: ->
  activate: ->
  deactivate: ->
  stop: ->

  title: ->
    ""


module.exports = Page