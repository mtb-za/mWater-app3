

class Pager extends Backbone.View
  constructor: ->
    super()

    # Setup special mobile behavior
    # Make links and anything with class 'tappable' act on taps
    @$el.on "mousedown touchstart", "a,button,.tappable", ->
      $(this).addClass "pressed"
      pressedElem = this

    @$el.on "mouseup touchleave touchend touchmove touchcancel scroll", ->
      if pressedElem
        $(pressedElem).removeClass "pressed"
        pressedElem = null

    # Make checkboxes tappable
    @$el.on "tap", ".checkbox", ->
      $(this).  toggleClass "checked"
      $(this).trigger "checked"

    # Make radio buttons tappable
    @$el.on "tap", ".radio-button", ->
      # Find parent radiogroup
      $(this).parents(".radio-group").find(".radio-button").removeClass "checked"
      $(this).addClass "checked"
      $(this).trigger "checked"

    # Prevent links from launching new pages
    @$el.on "click", "a", ->
      # Allow tabs
      return true  if $(this).attr("data-toggle") is "tab"
      false

    @stack=[]

  # Adds a page from a constructor
  openPage: (pageClass, args) ->
    # Create page
    page = new pageClass(args)
    
    # Deactivate current page
    if @stack.length > 0
      _.last(@stack).deactivate()
      _.last(@stack).$el.detach()

    # Activate new page
    @stack.push(page)
    page.start()
    page.activate()
    @$el.append(page.el)

    # Indicate page change
    @trigger 'change'

  closePage: (replaceWith, args) ->
    # Prevent closing last page
    if not replaceWith and @stack.length <= 1
      return

    # Destroy current page
    _.last(@stack).deactivate()
    _.last(@stack).stop()
    @stack.pop()

    # Open replaceWith
    if replaceWith
      @openPage replaceWith, args

    # Indicate page change
    @trigger 'change'

  # Get title of active page
  title: ->
    _.last(@stack).title()

  # Determine if has multiple pages
  multiplePages: ->
    @stack.length > 1

module.exports = Pager