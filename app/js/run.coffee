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

  phase3 = ->
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


  # Finish setup. Cordova loaded if needed
  phase2 = ->
    if cordova?
      # Start updater 
      launcher.createAppUpdater (appUpdater) =>
        # Start repeating check for updates
        updater = new sync.Repeater (success, error) =>
          console.log "About to update"
          appUpdater.update (status, message) =>
            console.log "Updater status: #{status} (#{message})"
            success(status)
          , (err) =>
            console.log "Updater failed: " + err
            success(status)

        updater.start(10*60*1000)   # 10 min interval
        updater.perform() # Do right away
      , ->
        alert("Unable to start updater")
      phase3()
    else
      phase3()


  # If cordova in query string, parse query string to see where to load it from
  # cordova parameter indicates the base url where cordova is installed. Must end in "/"
  # or be empty
  cordova = getQueryParameterByName("cordova")
  if cordova?
    cordova = cordova || ""
    console.log "Cordova: " + cordova

    # Load cordova.js script
    script = document.createElement("script")
    script.onload = () =>
      # Wait for device ready
      document.addEventListener 'deviceready', () =>
        phase2()
      , false
    script.onerror = (err) ->
      console.error(err)
      alert("Error loading cordova.js")
    script.src = "cordova.js"
    document.head.appendChild(script)

  else
    console.log "Not Cordova"
    phase2()