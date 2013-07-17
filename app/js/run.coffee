AppView = require("./AppView")
SlideMenu = require("./SlideMenu")
Pager = require("./Pager")
PageMenu = require("./PageMenu")
context = require './context'
login = require './login'
ProblemReporter = require './ProblemReporter'

MainPage = require './pages/MainPage'
LoginPage = require './pages/LoginPage'

exports.start = (options = {}) ->
  if options.demo  
    ctx = context.createDemoContext(ctx)
  else if login.getLogin()
    ctx = context.createLoginContext(login.getLogin())
  else  
    ctx = context.createAnonymousContext()

  problemReporter = ProblemReporter.register ctx.apiUrl + 'problem_reports', "//VERSION//", ->
    return ctx.login

  # Create pager
  pager = new Pager(ctx)

  # Create slide menu
  slideMenu = new SlideMenu()
  slideMenu.addSubmenu(pager.getContextMenu())
  slideMenu.addSubmenu(new PageMenu(ctx: ctx))

  # Create app view
  app = new AppView(slideMenu: slideMenu, pager: pager)
  $("body").append(app.$el)

  $ -> 
    # If logged in, open main page
    if ctx.login?
      pager.openPage(MainPage)
    else
      pager.openPage(LoginPage)
