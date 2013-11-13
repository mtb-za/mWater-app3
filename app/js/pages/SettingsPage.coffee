Page = require "../Page"
ECPlates = require '../forms/ECPlates'

class SettingsPage extends Page
  events: 
    "click #reset_db" : "resetDb"
    "click #request_source_codes": "requestSourceCodes"
    "click #test_ecplates" : "testECPlates"
    "click #weinre" : "startWeinre"

  activate: ->
    @setTitle "Settings"
    @render()

  render: ->
    @$el.html templates['pages/SettingsPage'](
      offlineSourceCodes: if @sourceCodesManager then @sourceCodesManager.getNumberAvailableCodes() else null
    )

    # Show EC plates test if available
    @$("#test_ecplates").hide()
    ECPlates.isAvailable (available) =>
      if available
        @$("#test_ecplates").show()
    , @error

    # Setup debugging buttons
    if window.debug
      @$("#weinre_details").html("Debugging with code <b>#{window.debug.code}</b>")
      @$("#weinre").attr("disabled", true)

  resetDb: ->
    if confirm("Completely discard local data, logout and lose unsubmitted changes?")
      window.localStorage.clear()
      while @pager.multiplePages()
        @pager.closePage()
      @pager.closePage(require("./LoginPage"))

  requestSourceCodes: ->
    @sourceCodesManager.replenishCodes @sourceCodesManager.getNumberAvailableCodes() + 5, =>
      @render()
    , ->
      alert("Unable to contact server")

  testECPlates: ->
    # Get camera image
    navigator.camera.getPicture (imgUrl) ->
      ECPlates.processImage imgUrl, (args) =>
        if args.error
          res = "Error: " + args.error
        else
          res = "E.Coli: " + args.ecoli + "\nTC: " + args.tc + "\nAlgorithm: " + args.algorithm
        alert res
      , @error

  startWeinre: ->
    if confirm("Start remote debugger (this will give developers temporary access to the app on your phone)?")
      # Disable to prevent double-click
      @$("#weinre").attr("disabled", true)

      code = (if @login then @login.user else "anon") + Math.floor(Math.random()*1000)
      console.log "weinre code #{code}"
      script = document.createElement("script")
      script.onload = () =>
        window.debug = {
          code: code
          ctx: @ctx
          require: require
        }
        @render()
        alert("Debugger started with code #{code}")
      script.onerror = ->
        error("Failed to load weinre")
        @render()
      script.src = "http://weinre.mwater.co/target/target-script-min.js#" + code
      document.head.appendChild(script)

module.exports = SettingsPage