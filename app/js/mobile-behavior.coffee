# Setup special mobile behavior. 

exports.setup = ($el) ->
  # Make clicks fast
  $ => FastClick.attach($el.get(0));

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

  # Make radio buttons clickable
  $el.on "click", ".radio-button", ->
    # Find parent radiogroup
    $(this).parents(".radio-group").find(".radio-button").removeClass "checked"
    $(this).addClass "checked"
    $(this).trigger "checked"

  # Prevent links from launching new pages
  $el.on "click", "a", ->
    # Allow tabs
    return true  if $(this).attr("data-toggle") is "tab"
    false      