Page = require "../Page"
SurveyPage = require "./SurveyPage"
forms = require '../forms'
mwaterforms = require 'mwater-forms'
ResponseModel = require('mwater-common').ResponseModel

module.exports = class NewSurveyPage extends Page
  @canOpen: (ctx) -> ctx.auth.insert("responses")

  events: 
    "click .survey" : "startSurvey"

  activate: ->
    @setTitle T("Select Survey")

    enumerators = [ "all", "user:" + @login.user ].concat(_.map(@login.groups, (g) -> "group:" + g))

    # Find forms deployed to me that are not deleted
    filter = { 
      deployments: { $elemMatch: { enumerators: { $in: enumerators }, active: true } } 
      state: { $ne: "deleted" } 
    }
    @db.forms.find(filter).fetch (forms) =>
      @forms = forms
      data = _.map forms, (form) =>
        return  {
          _id: form._id
          name: mwaterforms.formUtils.localizeString(form.design.name, @localizer.locale)
        }
      @$el.html require('./NewSurveyPage.hbs')(forms:data)
    , @error

  startSurvey: (ev) ->
    surveyId = ev.currentTarget.id

    form = _.findWhere(@forms, { _id: surveyId })
    if not form
      @error(T("Form not found"))
      return

    response = {}
    responseModel = new ResponseModel(response, form, @login.user, @login.groups) 
    responseModel.draft()

    @db.responses.upsert response, (response) =>
      @pager.closePage(SurveyPage, {_id: response._id, mode: "new survey"})
    , @error


