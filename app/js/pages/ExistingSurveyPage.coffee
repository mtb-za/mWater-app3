# Continue an existing survey
Page = require "../Page"
SurveyPage = require "./SurveyPage"

class ExistingSurveyPage extends Page
  @canOpen: (ctx) -> ctx.auth.update("responses") 

  events: 
    "click .response" : "openResponse"

  activate: ->
    @setTitle "Select Survey"

    @db.responses.find({completed:null}).fetch (responses) =>
      # Make presentable
      list = _.map responses, (r) ->
        return { _id: r._id, started: r.started.substring(0,10) }
      @$el.html templates['pages/ExistingSurveyPage'](responses:list)

      # Fill in survey names
      for resp in responses
        @db.forms.findOne { code:resp.type }, (form) =>
          @$("#name_"+resp._id).text(form.name)

  openResponse: (ev) ->
    responseId = ev.currentTarget.id
    @pager.closePage(SurveyPage, { _id: responseId})

module.exports = ExistingSurveyPage