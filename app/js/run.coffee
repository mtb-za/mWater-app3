AppView = require("./AppView")
SlideMenu = require("./SlideMenu")
Pager = require("./Pager")
PageMenu = require("./PageMenu")

Database = require "./Database"

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

db = Database.createDb()
ctx = { db: db }

# Create pager
pager = new Pager(ctx)

# Create slide menu
slideMenu = new SlideMenu()
slideMenu.addSubmenu(new PageMenu(ctx: ctx))

# Create app view
app = new AppView(slideMenu: slideMenu, pager: pager)
$("body").append(app.$el)


$ -> 
  #pager.openPage(require("./pages/SourceMapPage"))
  pager.openPage(require("./pages/MainPage"))
  # survey = require("./survey/DemoSurvey")(ctx);
  # pager.openPage(require("./pages/SurveyPage"), survey)


