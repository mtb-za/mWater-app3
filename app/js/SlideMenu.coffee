# Menu which slides out from the right side
class SlideMenu extends Backbone.View
  initialize: ->
    @submenus = []
    @$el.html require('./SlideMenu.hbs')()

    # Android 4.0.4 doesn't work with overthrow properly
    if navigator.userAgent.toLowerCase().indexOf('android 4.0.4') != -1
      @el.className = "slidemenu"
    else
      @el.className = "slidemenu overthrow"
  events: ->
    "click": "hide"

  toggle: ->
    if @visible then @hide() else @show()

  hide: ->
    if @visible
      @$el.hide()
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
    @$el.css("right", "0px")
    @$el.show()
    @visible = true
  
  # Menu to be added must be a backbone view. Render will be 
  # called on it before each display
  addSubmenu: (submenu) ->
    @submenus.push(submenu)
    @$("#content").append(submenu.$el)

  # Remove submenu
  removeSubmenu: (submenu) ->
    @submenus = _.without(@submenus, submenu)
    submenu.remove()

module.exports = SlideMenu