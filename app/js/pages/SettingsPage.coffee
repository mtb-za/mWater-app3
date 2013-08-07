Page = require "../Page"
ECPlates = require '../forms/ECPlates'

class SettingsPage extends Page
  events: 
    "click #reset_db" : "resetDb"
    "click #crash" : "crash"
    "click #request_source_codes": "requestSourceCodes"
    "click #test_ecplates" : "testECPlates"

  activate: ->
    @setTitle "Settings"
    @render()

  render: ->
    @$el.html templates['pages/SettingsPage'](
      offlineSourceCodes: if @sourceCodesManager then @sourceCodesManager.getNumberAvailableCodes() else null
    )
    @$("#crash").toggle(@login? and @login.user == "admin")

    # Show EC plates test if available
    @$("#test_ecplates").hide()
    ECPlates.isAvailable (available) =>
      @$("#test_ecplates").show()
    , @error

  resetDb: ->
    if confirm("Completely discard local data, logout and lose unsubmitted changes?")
      localStorage.clear()
      while @pager.multiplePages()
        @pager.closePage()
      @pager.closePage(require("./LoginPage"))

  crash: ->
    setTimeout ->
      x = null
      x()
    , 100

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

module.exports = SettingsPage