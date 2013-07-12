Page = require "../Page"
SurveyPage = require "./SurveyPage"

class NewSurveyPage extends Page
  @canOpen: (ctx) -> ctx.auth.insert("responses")

  events: 
    "click .survey" : "startSurvey"

  activate: ->
    @setTitle "Select Survey"

    @db.forms.find({type:"Survey"}).fetch (forms) =>
      @$el.html templates['pages/NewSurveyPage'](forms:forms)

  startSurvey: (ev) ->
    surveyCode = ev.currentTarget.id

    # Create response
    response = {
      type: surveyCode
      completed: null
      started: new Date().toISOString()
      user: @login.user
      org: @login.org
    }
    @db.responses.upsert response, (response) =>
      @pager.closePage(SurveyPage, {_id: response._id})

module.exports = NewSurveyPage