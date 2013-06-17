
exports.DateQuestion = require './DateQuestion'
exports.DropdownQuestion = require './DropdownQuestion'
exports.QuestionGroup = require './QuestionGroup'
exports.SaveCancelForm = require './SaveCancelForm'

# Must be created with model (backbone model) and contents (array of views)
exports.FormView = class FormView extends Backbone.View
  initialize: (options) ->
    # Add contents and listen to events
    for content in options.contents
      @$el.append(content.el);
      @listenTo content, 'close', => @trigger('close')
      @listenTo content, 'complete', => @trigger('complete')

    # Add listener to model
    @listenTo @model, 'change', => @trigger('change')

  load: (data) ->
    @model.clear()
    @model.set(data)

  save: ->
    return @model.toJSON()

exports.SurveyView = class SurveyView extends FormView

exports.WaterTestView = class WaterTestView extends FormView

_.extend(exports, require('./form-controls'))


# TODO figure out how to allow two surveys for differing client versions? Or just use minVersion?