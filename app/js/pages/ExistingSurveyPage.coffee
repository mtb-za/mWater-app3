# Continue an existing survey
Page = require "../Page"
SurveyPage = require "./SurveyPage"

class ExistingSurveyPage extends Page
  @canOpen: (ctx) -> ctx.auth.update("responses") 

  events: 
    "click .response" : "openResponse"

  activate: ->
    @setTitle "Select Survey"

    @db.responses.find({ completed:null, user: @login.user }, {sort:[['started','desc']]}).fetch (responses) =>
      @$el.html templates['pages/ExistingSurveyPage'](responses:responses)

      # Fill in survey names
      for resp in responses
        @db.forms.findOne { code:resp.type }, { mode: "local" }, (form) =>
          @$("#name_"+resp._id).text(if form then form.name else "???")

  openResponse: (ev) ->
    responseId = ev.currentTarget.id
    @pager.closePage(SurveyPage, { _id: responseId})

module.exports = ExistingSurveyPage