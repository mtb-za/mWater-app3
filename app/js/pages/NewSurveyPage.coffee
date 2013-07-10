Page = require "../Page"
SurveyPage = require "./SurveyPage"

class NewSurveyPage extends Page
  events: 
    "click .survey" : "startSurvey"

  activate: ->
    @setTitle "Select Survey"

    @db.forms.find({type:"Survey"}).fetch (forms) =>
      @$el.html templates['pages/NewSurveyPage'](forms:forms)

  startSurvey: (ev) ->
    surveyCode = ev.currentTarget.id

    # Create response
    # TODO Add user/org
    response = {
      type: surveyCode
      completed: null
      started: new Date().toISOString()
    }
    @db.responses.upsert response, (response) =>
      @pager.closePage(SurveyPage, {_id: response._id})

module.exports = NewSurveyPage