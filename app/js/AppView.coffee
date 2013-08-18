class AppView extends Backbone.View
  className: 'appview'
  constructor: (opts) ->
    super(opts)
    @slideMenu = opts.slideMenu
    @pager = opts.pager

    # Listen to page change events
    @listenTo @pager, 'change', @pageChanged

    # Add mobile behavior
    require('./mobile-behavior').setup(@$el)
    
    @render()

    # Add button bar
    @$("#navbar_buttons").append(@pager.getButtonBar().el)

  events:
    'click #navbar_slidemenu_button': 'toggleSlideMenu'
    'click #navbar_back': 'back'
    'click #navbar_title': 'back'
    'click .brand': 'back'
    'click #appview_content': 'hideSlideMenu'

  render: ->  	
    @$el.html templates['AppView']()
    @$el.append @slideMenu.el
    @$('.appview_content').append @pager.el
    this

  toggleSlideMenu: -> @slideMenu.toggle()
  hideSlideMenu: -> @slideMenu.hide()

  pageChanged: ->
    # Set title and back button
    @$("#navbar_back").css("visibility", if @pager.multiplePages() then "visible" else "hidden")
    title = @pager.getTitle()

    # Show brand logo if no title
    @$("#brand_logo").toggle(title == "")
    @$("#navbar_title").text(@pager.getTitle())

  back: ->
    @slideMenu.hide()
    @pager.closePage()
    return false
 
module.exports = AppView    
    