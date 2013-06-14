Page = require("../Page")

class MainPage extends Page
  # events: 
  #   @"click #survey" : "survey"
  #   "click #source_list" : "sourceList"

  activate: ->
    @setTitle "mWater"
    @$el.html templates['pages/MainPage']()
    
    @setupButtonBar [
      { icon: "plus-32.png", menu: [
        { text: "Add Water Source", click: => @addSource() }
        { text: "Start Water Test", click: => @addTest() }
        { text: "Start Survey", click: => @addSurvey() }
      ]}
    ]

  addSurvey: ->
    @pager.openPage(require("./NewSurveyPage"))

  addTest: ->
    # TODO
    alert("Coming soon")

  addSource: ->
    # TODO
    alert("Coming soon")
  # survey: ->
  #   #
  #   survey = require("../survey/DemoSurvey")(@ctx);
  #   @pager.openPage(require("./SurveyPage"), survey)

  # sourceList: ->
  #   @pager.openPage(require("./SourceListPage"))

module.exports = MainPage