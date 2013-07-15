Page = require "../Page"
Database = require "../Database"

class SettingsPage extends Page
  events: 
    "click #reset_db" : "resetDb"
    "click #crash" : "crash"

  activate: ->
    @setTitle "Settings"
    @$el.html templates['pages/SettingsPage']()
    @$("#crash").toggle(@login? and @login.user == "admin")

  resetDb: ->
    if confirm("Completely discard local data?")
      Database.resetDb(@db)

  crash: ->
    setTimeout ->
      x = null
      x()
    , 100

  # TODO source code downloading

module.exports = SettingsPage