class AppView extends Backbone.View
  constructor: (opts) ->
    super(opts)
    @slideMenu = opts.slideMenu
    @pager = opts.pager
  events:
    'click #navbar_slidemenu_button': 'toggleSlideMenu'
  render: ->  	
    @$el.html JST['AppView']()
    @$el.append @slideMenu.el
    @$('#content').append @pager.el
    this
  toggleSlideMenu: ->
    @slideMenu.toggle()
  	
 
module.exports = AppView
  	
    
    