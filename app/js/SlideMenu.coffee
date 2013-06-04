# Menu which slides out from the right side
class SlideMenu extends Backbone.View
  className: "slidemenu"
  render: ->
    @$el.html JST['SlideMenu']()
    this
  toggle: ->
    if @visible
      @hide()
    else
      @show()
  hide: ->
    @$el.animate({ right: -@width + "px" }).hide({})
    @visible = false
  show: ->
    # Set a maximum width
    @width = @$el.parent().width() * 0.66
    if @width > 500
      @width = 500

    # Animate visibility
    @$el.css("width", @width + "px")
    @$el.css("right", -@width + "px")
    @$el.show().animate({ right: "0px" })
    @visible = true;
 
module.exports = SlideMenu