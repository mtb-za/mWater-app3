# Continue an existing survey
Page = require "../Page"
SurveyPage = require "./SurveyPage"

class ExistingSurveyPage extends Page
  events: 
    "click .response" : "openResponse"

  activate: ->
    @setTitle "Select Survey"

    @db.responses.find({completed:false}).fetch (responses) =>
      # Make presentable
      list = _.map responses, (r) ->
        return { _id: r._id, started: r.started.substring(0,10) }
      @$el.html templates['pages/ExistingSurveyPage'](responses:list)

      # Fill in survey names
      for resp in responses
        @db.forms.findOne {_id:resp.form}, (form) =>
          @$("#name_"+resp._id).text(form.name)

  openResponse: (ev) ->
    responseId = ev.currentTarget.id
    @pager.closePage(SurveyPage, responseId)

module.exports = ExistingSurveyPage