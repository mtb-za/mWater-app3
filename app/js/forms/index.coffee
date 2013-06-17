
exports.DateQuestion = require './DateQuestion'

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
