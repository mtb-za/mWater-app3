# Group of questions which validate as a unit

module.exports = Backbone.View.extend
  initialize: (options) ->
    @options = options || {}
    @contents = options.contents
    @render()

  validate: ->
    # Get all visible items
    items = _.filter(@contents, (c) ->
      c.visible and c.validate
    )
    return not _.any(_.map(items, (item) ->
      item.validate()
    ))

  render: ->
    @$el.html ""
    
    # Add contents (questions, mostly)
    _.each @contents, (c) => @$el.append c.$el

    this
