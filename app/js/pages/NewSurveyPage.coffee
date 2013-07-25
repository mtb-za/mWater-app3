Page = require "../Page"
SurveyPage = require "./SurveyPage"

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
    code = @login.user + "-" + createBase32TimeCode(new Date())

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

# Create a base32 time code to write on surbveys
createBase32TimeCode = (date) ->
  # Characters to use (skip 1, I, 0, O)
  chars = "23456789ABCDEFGHJLKMNPQRSTUVWXYZ"

  # Subtract date from July 1, 2013
  base = new Date(2013, 6, 1, 0, 0, 0, 0)

  # Get seconds since
  diff = Math.floor((date.getTime() - base.getTime()) / 1000)

  # Convert to array of base 32 characters
  code = ""

  while diff >= 1
    num = diff % 32
    diff = Math.floor(diff / 32)
    code = chars[num] + code

  return code

