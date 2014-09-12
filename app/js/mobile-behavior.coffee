# Setup special mobile behavior. 
exports.setup = ($el) ->
  # Make links and anything with class 'tappable' act on taps
  pressedElem = null
  $el.on "mousedown touchstart", "a,button,.tappable", ->
    $(this).addClass "pressed"
    pressedElem = this

  $el.on "mouseup touchleave touchend touchmove touchcancel scroll", ->
    if pressedElem
      $(pressedElem).removeClass "pressed"
      pressedElem = null

  # Make checkboxes clickable
  $el.on "click", ".checkbox", ->
    $(this).toggleClass "checked"
    $(this).trigger "checked"

  # Make radio buttons clickable if not readonly (to make readonly, add to class readonly to radiogroup)
  $el.on "click", ".radio-button", ->
    if not $(this).parents(".radio-group").hasClass("readonly")
      # Find parent radiogroup
      $(this).parents(".radio-group").find(".radio-button").removeClass "checked"
      $(this).addClass "checked"
      $(this).trigger "checked"

  # Prevent links from launching new pages
  $el.on "click", "a", ->
    # Allow tabs
    return true if $(this).attr("data-toggle") is "tab"

    # Allow dropdowns
    return true if $(this).attr("data-toggle") is "dropdown"

    # Allow if not hrefed
    return true if not $(this).attr('href')
    false      