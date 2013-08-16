AppView = require("./AppView")
SlideMenu = require("./SlideMenu")
Pager = require("./Pager")
PageMenu = require("./PageMenu")
context = require './context'
login = require './login'
ProblemReporter = require './ProblemReporter'

MainPage = require './pages/MainPage'
LoginPage = require './pages/LoginPage'
SourceMapPage = require './pages/SourceMapPage'

AppUpdater = require './AppUpdater'

cordova = require './cordova'

startError = (err) ->
  alert("Failed to start app: " + JSON.stringify(err))

exports.start = (options = {}) ->
  _.defaults(options, { update: true })

  # Create pager
  pager = new Pager()

  # Create slide menu
  slideMenu = new SlideMenu()

  # Create app view
  # Note: This must be done before body is fully loaded to prevent some mobile browser
  # bugs where the absolute positioning fails
  app = new AppView(slideMenu: slideMenu, pager: pager)
  $("body").append(app.$el)

  # Step 2 of setup
  step2 = ->
    # Create context
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
      # If explicit page
      if options.initialPage == "SourceMapPage"
        pager.openPage(SourceMapPage)
      # If logged in, open main page
      else if ctx.login?
        pager.openPage(MainPage)
      else
        pager.openPage(LoginPage)

  # Start cordova (if needed)
  cordova.setup { update: options.update }, (isCordova) =>
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
    
