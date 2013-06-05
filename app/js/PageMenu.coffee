# Lists pages to jump to
# ctx must be passed in as option

module.exports = class PageMenu extends Backbone.View
  initialize: (options) ->
    @pager = options.ctx.pager

  events:
    "click #home" : "goto_home"

  render: ->
    @$el.html templates['PageMenu']()

  goto_home: ->
    while @pager.multiplePages()
      @pager.closePage()