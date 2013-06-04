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
    title: ->
      "some page!"

  Pager = require("./Pager")
  pager = new Pager()

  slideMenu = new SlideMenu()
  app = new AppView(slideMenu: slideMenu, pager: pager)

  pager.openPage(SomePage, ["test"])
  pager.openPage(SomePage, ["test2"])
  
  $("body").append(app.el)
