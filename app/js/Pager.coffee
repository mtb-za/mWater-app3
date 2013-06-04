

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

  addPage: (pageClass, args) ->
    # Create page
    page = new pageClass(args)
    
    # Deactivate current page
    # TOOD

    # Activate new page
    @stack.push(page)
    page.start()
    page.activate()
    @$el.append(page.el)






module.exports = Pager