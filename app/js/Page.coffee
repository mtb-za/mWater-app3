class Page extends Backbone.View
  constructor: (ctx, args...) ->
    super()
    @ctx = ctx
    @args = args

    # Mix in context for convenience
    _.extend(@, ctx) 

  className: "page"
  create: ->
  activate: ->
  deactivate: ->
  destroy: ->

  getTitle: -> @title

  setTitle: (title) ->
    @title = title
    @trigger 'change:title'


module.exports = Page