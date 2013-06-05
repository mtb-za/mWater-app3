AppView = require("./AppView")
SlideMenu = require("./SlideMenu")

# Create page
Page = require("./Page")
class SomePage extends Page
  constructor: (ctx, args) ->
    super(ctx)
    console.log args
    @render()

  render: ->
    for x in [0..500]
      @$el.append("this is a test")
  title: ->
    "some page!"

ctx = {}
Pager = require("./Pager")
pager = new Pager(ctx)

slideMenu = new SlideMenu()
app = new AppView(slideMenu: slideMenu, pager: pager)

pager.openPage(require("./pages/MainPage"))

# survey = require("./survey/DemoSurvey")(ctx);
# pager.openPage(require("./pages/SurveyPage"), survey)

if $("body").length == 0
  alert("fail!!!")
$("body").append(app.$el)
