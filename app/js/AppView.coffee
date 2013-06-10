class AppView extends Backbone.View
  className: 'appview'
  constructor: (opts) ->
    super(opts)
    @slideMenu = opts.slideMenu
    @pager = opts.pager

    # Listen to page change events
    @listenTo @pager, 'change', @pageChanged

    @render()

    # Setup special mobile behavior
    # Make clicks fast
    $ => FastClick.attach(@el);

    # Make links and anything with class 'tappable' act on taps
    pressedElem = null
    @$el.on "mousedown touchstart", "a,button,.tappable", ->
      $(this).addClass "pressed"
      pressedElem = this

    @$el.on "mouseup touchleave touchend touchmove touchcancel scroll", ->
      if pressedElem
        $(pressedElem).removeClass "pressed"
        pressedElem = null

    # Make checkboxes clickable
    @$el.on "click", ".checkbox", ->
      $(this).toggleClass "checked"
      $(this).trigger "checked"

    # Make radio buttons clickable
    @$el.on "click", ".radio-button", ->
      # Find parent radiogroup
      $(this).parents(".radio-group").find(".radio-button").removeClass "checked"
      $(this).addClass "checked"
      $(this).trigger "checked"

    # Prevent links from launching new pages
    @$el.on "click", "a", ->
      # Allow tabs
      return true  if $(this).attr("data-toggle") is "tab"
      false      

  events:
    'click #navbar_slidemenu_button': 'toggleSlideMenu'
    'click #navbar_back': 'back'
    'click #navbar_title': 'back'
    'click #appview_content': 'hideSlideMenu'

  render: ->  	
    @$el.html templates['AppView']()
    @$el.append @slideMenu.el
    @$('.appview_content').append @pager.el
    this

  toggleSlideMenu: -> @slideMenu.toggle()
  hideSlideMenu: -> @slideMenu.hide()

  pageChanged: ->
    # Set title
    @$("#navbar_back").css("visibility", if @pager.multiplePages() then "visible" else "hidden")
    @$("#navbar_title").text(@pager.getTitle())

  back: ->
    @slideMenu.hide()
    @pager.closePage()
 
module.exports = AppView    
    