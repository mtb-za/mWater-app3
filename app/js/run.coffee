AppView = require("./AppView")
SlideMenu = require("./SlideMenu")

$ ->
  # Create page
  Page = require("./Page")
  class SomePage extends Page
    constructor: (args) ->
      super()
      console.log args
      @render()

    render: ->
      @$el.html("this is a test")

  Pager = require("./Pager")
  pager = new Pager()
  pager.addPage(SomePage, ["test"])

  slideMenu = new SlideMenu()
  app = new AppView(slideMenu: slideMenu, pager: pager)
  
  $("body").append(app.render().el)
