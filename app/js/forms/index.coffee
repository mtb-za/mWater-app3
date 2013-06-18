
exports.DateQuestion = require './DateQuestion'
exports.DropdownQuestion = require './DropdownQuestion'
exports.QuestionGroup = require './QuestionGroup'
exports.SaveCancelForm = require './SaveCancelForm'
exports.SourceQuestion = require './SourceQuestion'
exports.PhotosQuestion = require './PhotosQuestion'

# Must be created with model (backbone model) and contents (array of views)
exports.FormView = class FormView extends Backbone.View
  initialize: (options) ->
    @contents = options.contents
    
    # Add contents and listen to events
    for content in options.contents
      @$el.append(content.el);
      @listenTo content, 'close', => @trigger('close')
      @listenTo content, 'complete', => @trigger('complete')

    # Add listener to model
    @listenTo @model, 'change', => @trigger('change')

  load: (data) ->
    @model.clear()  #TODO clear or not clear? clearing removes defaults, but allows true reuse.

    # Apply defaults 
    @model.set(_.defaults(_.cloneDeep(data), @options.defaults || {}))

  save: ->
    return @model.toJSON()


# Simple form that displays a template based on loaded data
exports.templateView = (template) -> 
  return {
    el: $('<div></div>')
    load: (data) ->
      $(@el).html template(data)
  }

  # class TemplateView extends Backbone.View
  # constructor: (template) ->
  #   @template = template

  # load: (data) ->
  #   @$el.html @template(data)


exports.SurveyView = class SurveyView extends FormView

exports.WaterTestEditView = class WaterTestEditView extends FormView
  initialize: (options) ->
    super(options)

    # Add buttons at bottom
    # TODO move to template and sep file
    @$el.append $('''
      <div>
          <button id="close_button" type="button" class="btn margined">Save for Later</button>
          &nbsp;
          <button id="complete_button" type="button" class="btn btn-primary margined"><i class="icon-ok icon-white"></i> Complete</button>
      </div>
    ''')

  events: 
    "click #close_button" : "close"
    "click #complete_button" : "complete"

  # TODO refactor with SaveCancelForm
  validate: ->
    # Get all visible items
    items = _.filter(@contents, (c) ->
      c.visible and c.validate
    )
    return not _.any(_.map(items, (item) ->
      item.validate()
    ))

  close: ->
    @trigger 'close'

  complete: ->
    if @validate()
      @trigger 'complete'
      
# Creates a form view from a string
exports.instantiateView = (viewStr, options) =>
  viewFunc = new Function("options", viewStr)
  viewFunc(options)

_.extend(exports, require('./form-controls'))


# TODO figure out how to allow two surveys for differing client versions? Or just use minVersion?