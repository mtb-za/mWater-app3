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
    # Set title and back button
    @$("#navbar_back").css("visibility", if @pager.multiplePages() then "visible" else "hidden")
    @$("#navbar_title").text(@pager.getTitle())

    # Detach existing button bar and attach new one
    @$("#navbar_buttons").children().detach()
    @$("#navbar_buttons").append(@pager.getButtonBar().el)

  back: ->
    @slideMenu.hide()
    @pager.closePage()
 
module.exports = AppView    
    