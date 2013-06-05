Page = require("../Page")

class MainPage extends Page
  constructor: (ctx) ->
    super(ctx)
    @render()

  events: 
    "click #survey" : "survey"

  render: ->
    @$el.html JST['pages/MainPage']()

  title: ->
    "mWater"

  survey: ->
    survey = require("../survey/DemoSurvey")(@ctx);
    @ctx.pager.openPage(require("./SurveyPage"), survey)


module.exports = MainPage