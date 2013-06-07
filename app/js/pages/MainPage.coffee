Page = require("../Page")

class MainPage extends Page
  events: 
    "click #survey" : "survey"
    "click #source_list" : "sourceList"

  activate: ->
    @setTitle "mWater"
    @$el.html templates['pages/MainPage']()

  survey: ->
    survey = require("../survey/DemoSurvey")(@ctx);
    @pager.openPage(require("./SurveyPage"), survey)

  sourceList: ->
    @pager.openPage(require("./SourceListPage"))

module.exports = MainPage