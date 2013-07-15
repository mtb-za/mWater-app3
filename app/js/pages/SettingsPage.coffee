Page = require "../Page"

class SettingsPage extends Page
  events: 
    "click #reset_db" : "resetDb"
    "click #crash" : "crash"
    "click #request_source_codes": "requestSourceCodes"


  activate: ->
    @setTitle "Settings"
    @render()

  render: ->
    @$el.html templates['pages/SettingsPage'](
      offlineSourceCodes: @sourceCodesManager.getNumberAvailableCodes()
    )
    @$("#crash").toggle(@login? and @login.user == "admin")

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

module.exports = SettingsPage