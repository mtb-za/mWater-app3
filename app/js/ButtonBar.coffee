# Standard button bar. Each item
# has optional "text", optional "icon" and "click" (action).
# For submenu, add array to "menu". One level nesting only. Submenu items can have "checked" true
# to check the item or "separator" true to put a separator instead
module.exports = class ButtonBar extends Backbone.View
  events: 
    "click .menuitem" : "clickMenuItem"
    
  setup: (items) ->
    # Because right floating reverses natural order
    @items = items.reverse()
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
    @$el.html require('./ButtonBar.hbs')(items: @items)

  clickMenuItem: (e) ->
    id = e.currentTarget.id
    item = @itemMap[id]
    if item.click?
      item.click()
