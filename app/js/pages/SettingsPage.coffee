Page = require "../Page"
Database = require "../Database"

class SettingsPage extends Page
  events: 
    "click #reset_db" : "resetDb"

  activate: ->
    @setTitle "Settings"
    @$el.html templates['pages/SettingsPage']()

  resetDb: ->
    if confirm("Completely discard local data?")
      Database.resetDb(@db)


module.exports = SettingsPage