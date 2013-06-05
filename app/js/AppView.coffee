class AppView extends Backbone.View
  constructor: (opts) ->
    super(opts)
    @slideMenu = opts.slideMenu
    @pager = opts.pager

    # Listen to page change events
    @listenTo @pager, 'change', @pageChanged

    @render()

    # Make clicks fast
    $ =>
      FastClick.attach(@el);

  events:
    'click #navbar_slidemenu_button': 'toggleSlideMenu'
    'click #navbar_back': 'back'
    'click #navbar_title': 'back'
  render: ->  	
    @$el.html JST['AppView']()
    @$el.append @slideMenu.el
    @$('#content').append @pager.el
    this

  toggleSlideMenu: ->
    @slideMenu.toggle()

  pageChanged: ->
    # Set title
    @$("#navbar_back").css("visibility", if @pager.multiplePages() then "visible" else "hidden")
    @$("#navbar_title").text(@pager.title())

  back: ->
    @pager.closePage()
 
module.exports = AppView    
    