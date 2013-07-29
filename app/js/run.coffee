AppView = require("./AppView")
SlideMenu = require("./SlideMenu")
Pager = require("./Pager")
PageMenu = require("./PageMenu")
context = require './context'
login = require './login'
ProblemReporter = require './ProblemReporter'

MainPage = require './pages/MainPage'
LoginPage = require './pages/LoginPage'
AppUpdater = require './AppUpdater'

launcher = require './launcher'
sync = require './sync'

getQueryParameterByName = (name) ->
  match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search)
  return match && decodeURIComponent(match[1].replace(/\+/g, ' '))

exports.start = (options = {}) ->
  # Create pager
  pager = new Pager()

  # Create slide menu
  slideMenu = new SlideMenu()

  # Create app view
  # Note: This must be done before body is fully loaded to prevent some mobile browser
  # bugs where the absolute positioning fails
  app = new AppView(slideMenu: slideMenu, pager: pager)
  $("body").append(app.$el)

  # Finish setup. Cordova loaded if needed
  finishStart = ->
    # Start updater if Cordova
    if cordova?
      launcher.createAppUpdater (appUpdater) =>
        # Start repeating check for updates
        updater = sync.Repeater =>
          appUpdater.update (status) =>
            console.log "Updater status: " + status
        updater.start(10*60*1000)   # 10 min interval
      , ->
        alert("Unable to start updater")

    if options.demo  
      ctx = context.createDemoContext()
    else if login.getLogin()
      ctx = context.createLoginContext(login.getLogin())
    else  
      ctx = context.createAnonymousContext()

    problemReporter = ProblemReporter.register ctx.apiUrl + 'problem_reports', "//VERSION//", ->
      return ctx.login

    # Set pager context
    pager.setContext(ctx)

    # Add slider sub-menus
    slideMenu.addSubmenu(pager.getContextMenu())
    slideMenu.addSubmenu(new PageMenu(ctx: ctx))

    $ -> 
      # If logged in, open main page
      if ctx.login?
        pager.openPage(MainPage)
      else
        pager.openPage(LoginPage)

  # If cordova in query string, parse query string to see where to load it from
  # cordova parameter indicates the base url where cordova is installed. Must end in "/"
  # or be empty
  cordova = getQueryParameterByName("cordova")
  if cordova?
    cordova = cordova || "/"
    console.log "Cordova: " + cordova

    # Load cordova.js script
    $.getScript cordova + "cordova.js", () =>
      # Wait for device ready
      document.addEventListener 'deviceready', () =>
        finishStart()
      , false

  else
    console.log "Not Cordova"
    finishStart()