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
    formId = ev.currentTarget.id

    # Create response
    response = {
      form: formId
      completed: false
      started: new Date().toISOString()
    }
    @db.responses.upsert response, (response) =>
      @pager.closePage(SurveyPage, response._id)

module.exports = NewSurveyPage