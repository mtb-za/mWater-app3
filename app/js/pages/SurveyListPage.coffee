# Continue an existing survey
Page = require "../Page"
SurveyPage = require "./SurveyPage"
NewSurveyPage = require './NewSurveyPage'
mwaterforms = require 'mwater-forms'

module.exports = class SurveyListPage extends Page
  @canOpen: (ctx) -> ctx.auth.update("responses") 

  events: 
    "click .response" : "openResponse"
    "click #add_survey": "addSurvey"

  create: ->
    @$el.html require('./SurveyListPage.hbs')()
    @setTitle T("Surveys")

  activate: ->
    # Query database for recent, completed surveys
    recent = new Date()
    recent.setDate(recent.getDate() - 30)

    # Get incomplete survey responses
    # TODO eventually remove $exists filter when legacy forms are gone
    @db.responses.find({ type: { $exists: false }, status: { $in: ['draft', 'rejected'] }, user: @login.user }, {sort:[['startedOn','desc']], limit: 100}).fetch (responses) =>
      @$("#incomplete_table").html require('./SurveyListPage_items.hbs')(responses:responses)

      # Fill in survey names
      _.defer => # Defer to allow html to render
        for resp in responses
          @fillFormName(resp)

    # Get final/pending surveys
    # TODO eventually remove $exists filter when legacy forms are gone
    query = { 
      type: { $exists: false }
      status: { $in: ['pending', 'final'] }
      submittedOn: { $gt:recent.toISOString() }
      user: @login.user }
    @db.responses.find(query, {sort:[['submittedOn','desc']], limit: 100}).fetch (responses) =>
      @$("#recent_table").html require('./SurveyListPage_items.hbs')(responses:responses)

      # Fill in survey names
      _.defer => # Defer to allow html to render
        for resp in responses
          @fillFormName(resp)

  # Fill in form names (since not present in response document)
  fillFormName: (resp) =>
    # Check/create cache
    if not @formNameCache 
      @formNameCache = {}

    if @formNameCache[resp.form]
      @$("#name_"+resp._id).text(@formNameCache[resp.form])
      return

    # Get database
    @db.forms.findOne { _id: resp.form }, { mode: "local" }, (form) =>
      if form
        name = mwaterforms.formUtils.localizeString(form.design.name, @localizer.locale)
      else
        name = "???"
      @formNameCache[resp.form] = name
      @$("#name_"+resp._id).text(name)    

  openResponse: (ev) ->
    responseId = ev.currentTarget.id
    @db.responses.findOne { _id: responseId }, (response) =>
      @pager.openPage(SurveyPage, { _id: responseId})

  addSurvey: ->
    @pager.openPage(NewSurveyPage)

