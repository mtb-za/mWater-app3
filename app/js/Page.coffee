class Page extends Backbone.View
  constructor: (ctx, args...) ->
    super()
    @ctx = ctx
    @args = args

    # Mix in context for convenience
    _.extend(@, ctx) 

    # Store subviews
    @_subviews = []

  className: "page"
  create: ->
  activate: ->
  deactivate: ->
  destroy: ->
    @removeSubviews()

  getTitle: -> @title

  setTitle: (title) ->
    @title = title
    @trigger 'change:title'

  addSubview: (view) ->
    @_subviews.push(view)

  removeSubviews: ->
    for subview in @_subviews
      subview.remove()

module.exports = Page