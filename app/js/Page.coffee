class Page extends Backbone.View
  constructor: (ctx, args...) ->
    super()
    @ctx = ctx
    @args = args

    # Mix in context for convenience
    _.extend(@, ctx) 

    # Store subviews
    @_subviews = []

    # Setup default button bar
    @buttonBar = new ButtonBar()

  className: "page"
  create: ->
  activate: ->
  deactivate: ->
  destroy: ->
  remove: ->
    @removeSubviews()
    super()

  getTitle: -> @title

  setTitle: (title) ->
    @title = title
    @trigger 'change:title'

  addSubview: (view) ->
    @_subviews.push(view)

  removeSubviews: ->
    for subview in @_subviews
      subview.remove()

  getButtonBar: ->
    return @buttonBar

  setupButtonBar: (items) ->
    # Setup button bar
    @buttonBar.setup(items)

# Standard button bar
class ButtonBar extends Backbone.View
  events: 
    "click .menuitem" : "clickMenuItem"
  setup: (items) ->
    @items = items
    @itemMap = {}

    # Add id to all items if not present
    id = 1
    for item in items
      if not item.id?
        item.id = id
        id=id+1
      @itemMap[item.id] = item

      # Add to submenu
      if item.menu
        for subitem in item.menu
          if not subitem.id?
            subitem.id = id.toString()
            id=id+1
          @itemMap[subitem.id] = subitem

    @render()

  render: ->
    @$el.html templates['ButtonBar'](items: @items)

  clickMenuItem: (e) ->
    id = e.currentTarget.id
    item = @itemMap[id]
    if item.click?
      item.click()


module.exports = Page