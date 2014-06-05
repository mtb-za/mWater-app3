AppView = require("./AppView")
SlideMenu = require("./SlideMenu")
Pager = require("./Pager")
PageMenu = require("./PageMenu")
context = require './context'
login = require './login'
ProblemReporter = require './ProblemReporter'
ezlocalize = require 'ez-localize'

MainPage = require './pages/MainPage'
LoginPage = require './pages/LoginPage'
SourceMapPage = require './pages/SourceMapPage'

AppUpdater = require './AppUpdater'

cordovaSetup = require './cordovaSetup'

handlebars = require("hbsfy/runtime")

startError = (err) ->
  alert("Failed to start app: " + JSON.stringify(err))

exports.start = (options = {}) ->
  _.defaults(options, { update: true })

  # Setup handlebars helpers
  Swag.registerHelpers(handlebars)
  
  # Setup localizer
  localizationData = require './localizations.json'
  localizer = new ezlocalize.Localizer(localizationData, "en")
  localizer.makeGlobal(handlebars)
  localizer.restoreCurrentLocale()

  # Create pager
  pager = new Pager()

  # Create slide menu
  slideMenu = new SlideMenu()

  # Create app view
  # Note: This must be done before body is fully loaded to prevent some mobile browser
  # bugs where the absolute positioning fails
  app = new AppView(slideMenu: slideMenu, pager: pager)
  $("body").append(app.$el)

  # Check if a new cache is available on page load.
  window.addEventListener "load", ((e) ->
    if not window.applicationCache?
      return

    window.applicationCache.addEventListener "updateready", ((e) ->
      if window.applicationCache.status is window.applicationCache.UPDATEREADY
        
        # Browser downloaded a new app cache.
        # Swap it in and reload the page to get the new hotness.
        window.applicationCache.swapCache()
        window.location.reload() if confirm("A new version is available. Load it now?")
      else
    
    # Manifest didn't changed. Nothing new to server.
    ), false
  ), false

  # Step 2 of setup
  step2 = ->
    withCtx = (ctx) ->
      problemReporter = ProblemReporter.register ctx.apiUrl + 'problem_reports', "//VERSION//", ->
        return ctx.login
        
      ProblemReporter.default = problemReporter

      # Set pager context
      pager.setContext(ctx)

      # Add slider sub-menus
      slideMenu.addSubmenu(pager.getContextMenu())
      slideMenu.addSubmenu(new PageMenu(ctx: ctx))

      $ -> 
        # If explicit page
        if options.initialPage == "SourceMapPage"
          pager.openPage(SourceMapPage)
        # If logged in, open main page
        else if ctx.login?
          pager.openPage(MainPage)
        else
          pager.openPage(LoginPage)

    # Create context
    if options.demo  
      context.createDemoContext(withCtx)
    else if login.getLogin()
      context.createLoginContext(login.getLogin(), withCtx)
    else  
      context.createAnonymousContext(withCtx)


  # Start cordova (if needed)
  cordovaSetup.setup { update: options.update }, (isCordova) =>
    # If cordova, get filesystems for context
    if isCordova
      # Get file systems
      console.log "Getting file systems..."
      window.requestFileSystem LocalFileSystem.PERSISTENT, 0, (persFs) ->
        window.requestFileSystem LocalFileSystem.TEMPORARY, 0, (tempFs) ->
          console.log "Got file systems"
          context.setupFileSystems(tempFs, persFs)
          step2()
        , startError
      , startError
    else
      step2()

  , startError
    
