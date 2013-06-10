# Lists pages to jump to
# ctx must be passed in as option

module.exports = class PageMenu extends Backbone.View
  initialize: (options) ->
    @pager = options.ctx.pager

  events:
    "click #home" : "gotoHome"
    "click #source_list" : "gotoSourceList"
    "click #source_map" : "gotoSourceMap"

  render: ->
    @$el.html templates['PageMenu']()

  gotoHome: ->
    while @pager.multiplePages()
      @pager.closePage()

  gotoSourceList: ->
    while @pager.multiplePages()
      @pager.closePage()
    @pager.openPage(require("./pages/SourceListPage"))

  gotoSourceMap: ->
    while @pager.multiplePages()
      @pager.closePage()
    @pager.openPage(require("./pages/SourceMapPage"))
