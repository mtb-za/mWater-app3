Page = require "../Page"
SurveyPage = require "./SurveyPage"
forms = require '../forms'
mwaterforms = require 'mwater-forms'
ResponseModel = require '../ResponseModel'

module.exports = class NewSurveyPage extends Page
  @canOpen: (ctx) -> ctx.auth.insert("responses")

  events: 
    "click .survey" : "startSurvey"

  activate: ->
    @setTitle T("Select Survey")

    # Get user groups
    @db.groups.find({ members: @login.user }, { fields: { groupname: 1 } }).fetch (groups) =>
      @groups = _.pluck(groups, "groupname")
      enumerators = [ "all", "user:" + @login.user ].concat(_.map(groups, (g) -> "group:" + g))
  
      filter = { "deployments.enumerators": { $in: enumerators } }
      @db.forms.find(filter).fetch (forms) =>
        @forms = forms
        data = _.map forms, (form) =>
          return  {
            _id: form._id
            name: mwaterforms.formUtils.localizeString(form.design.name, @localizer.locale)
          }
        @$el.html require('./NewSurveyPage.hbs')(forms:data)

  startSurvey: (ev) ->
    surveyId = ev.currentTarget.id

    form = _.findWhere(@forms, { _id: surveyId })
    if not form
      @error(T("Form not found"))
      return

    response = {}
    responseModel = new ResponseModel(response, form, @login.user, @groups) 
    responseModel.draft()

    @db.responses.upsert response, (response) =>
      @pager.closePage(SurveyPage, {_id: response._id})

