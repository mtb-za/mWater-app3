
exports.DateQuestion = require './DateQuestion'
exports.DropdownQuestion = require './DropdownQuestion'
exports.QuestionGroup = require './QuestionGroup'
exports.SaveCancelForm = require './SaveCancelForm'

exports.SurveyView = class SurveyView extends Backbone.View
  initialize: (options) ->
    # Add views and listen to events
    for view in options.views
      @$el.append(view.el);
      @listenTo view, 'close', =>
        @trigger('close')
      @listenTo view, 'complete', =>
        @trigger('complete')

    # Add listener to model
    @listenTo @model, 'change', =>
      @trigger('change')

  load: (data) ->
    @model.clear(silent:true)
    @model.set(data)

  save: ->
    return @model.toJSON()

_.extend(exports, require('./form-controls'))


# TODO figure out how to allow two surveys for differing client versions? Or just use minVersion?