Page = require("../Page")

class SurveyPage extends Page
  constructor: (ctx, survey) ->
    super(ctx)
    @survey = survey
    @$el.append(survey.$el)

  create: ->
    @setTitle "Survey"

module.exports = SurveyPage