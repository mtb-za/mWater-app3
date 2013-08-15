Page = require "../Page"
SurveyPage = require "./SurveyPage"
forms = require '../forms'

module.exports = class NewSurveyPage extends Page
  @canOpen: (ctx) -> ctx.auth.insert("responses")

  events: 
    "click .survey" : "startSurvey"

  activate: ->
    @setTitle "Select Survey"

    @db.forms.find({type:"Survey"}).fetch (forms) =>
      @forms = forms
      @$el.html templates['pages/NewSurveyPage'](forms:forms)

  startSurvey: (ev) ->
    surveyCode = ev.currentTarget.id

    form = _.findWhere(@forms, { code: surveyCode })
    if not form
      @error("Form not found")
      return

    # Create code. Not unique, but unique per user if logged in once.
    code = @login.user + "-" + forms.createBase32TimeCode(new Date())

    # Create response
    response = {
      type: form.code
      type_rev: form._rev
      code: code
      started: new Date().toISOString()
      completed: null
      user: @login.user
      org: @login.org
    }
    @db.responses.upsert response, (response) =>
      @pager.closePage(SurveyPage, {_id: response._id})

