

exports.Form = class Form extends Backbone.View
  initialize: (options) ->
    # Add views and listen to events
    for view in options.view
      @el.append(view.el);
      @listenTo view, 'close', =>
        @trigger('close')

    # Add listener to model
    @model.listenTo 'change', =>
      @trigger('change')

  load: (data) ->
    @model.clear(silent:true)
    @model.set(data)

  save: ->
    return @model.toJSON()

_.extend(exports, require('./form-controls'))
