# Lists pages to jump to

module.exports = class PageMenu extends Backbone.View
  #initialize: (options) ->
  render: ->
    @$el.html templates['PageMenu']()