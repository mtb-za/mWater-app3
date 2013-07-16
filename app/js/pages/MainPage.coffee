Page = require("../Page")
NewSurveyPage = require("./NewSurveyPage")
NewTestPage = require("./NewTestPage")
NewSourcePage = require("./NewSourcePage")

class MainPage extends Page
  activate: ->
    @setTitle "mWater"
    @$el.html templates['pages/MainPage'](version: @version)
    
    menu = []
    if NewSourcePage.canOpen(@ctx)
      menu.push({ text: "Add Water Source", click: => @addSource() })
    if NewTestPage.canOpen(@ctx)
      menu.push({ text: "Start Water Test", click: => @addTest() })
    if NewSurveyPage.canOpen(@ctx)
      menu.push({ text: "Start Survey", click: => @addSurvey() })
    if menu.length > 0
      @setupButtonBar [{ icon: "plus.png", menu: menu }]

  addSurvey: ->
    @pager.openPage(NewSurveyPage)

  addTest: ->
    @pager.openPage(NewTestPage)

  addSource: ->
    @pager.openPage(NewSourcePage)

module.exports = MainPage