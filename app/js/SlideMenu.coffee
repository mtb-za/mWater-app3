# Menu which slides out from the right side
class SlideMenu extends Backbone.View
  className: "slidemenu"

  initialize: ->
    @submenus = []
    @$el.html templates['SlideMenu']()

  toggle: ->
    if @visible then @hide() else @show()

  hide: ->
    @$el.animate({ right: -@width + "px" }).hide({})
    @visible = false

  show: ->
    # Re-render submenus
    for submenu in @submenus
      submenu.render()

    # Set a maximum width
    @width = @$el.parent().width() * 0.66
    if @width > 500
      @width = 500

    # Animate visibility
    @$el.css("width", @width + "px")
    @$el.css("right", -@width + "px")
    @$el.show().animate({ right: "0px" })
    @visible = true
  
  # Menu to be added must be a backbone view. Render will be 
  # called on it before each display
  addSubmenu: (submenu) ->
    @submenus.push(submenu)
    @$("#content").append(submenu.$el)

module.exports = SlideMenu