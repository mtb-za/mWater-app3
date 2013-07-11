# Lists pages to jump to
# ctx must be passed in as option

module.exports = class PageMenu extends Backbone.View
  initialize: (options) ->
    @pager = options.ctx.pager

  events:
    "click #home" : "gotoHome"
    "click #login" : "gotoLogin"
    "click #source_list" : "gotoSourceList"
    "click #source_map" : "gotoSourceMap"
    "click #settings" : "gotoSettings"
    "click #new_test" : "gotoNewTest"
    "click #existing_test" : "gotoExistingTest"
    "click #new_survey" : "gotoNewSurvey"
    "click #existing_survey" : "gotoExistingSurvey"

  render: ->
    @$el.html templates['PageMenu']()
    @$("#new_test").toggle(require("./pages/NewTestPage").canOpen(@options.ctx))
    @$("#new_survey").toggle(require("./pages/NewSurveyPage").canOpen(@options.ctx))
    @$("#existing_survey").toggle(require("./pages/ExistingSurveyPage").canOpen(@options.ctx))

  gotoHome: ->
    while @pager.multiplePages()
      @pager.closePage()

  gotoLogin: ->
    @pager.openPage(require("./pages/LoginPage"))

  gotoSourceList: ->
    while @pager.multiplePages()
      @pager.closePage()
    @pager.openPage(require("./pages/SourceListPage"))

  gotoSourceMap: ->
    while @pager.multiplePages()
      @pager.closePage()
    @pager.openPage(require("./pages/SourceMapPage"))

  gotoSettings: ->
    @pager.openPage(require("./pages/SettingsPage"))

  gotoNewTest: ->
    @pager.openPage(require("./pages/NewTestPage"))

  gotoExistingTest: ->
    @pager.openPage(require("./pages/TestListPage"))

  gotoNewSurvey: ->
    @pager.openPage(require("./pages/NewSurveyPage"))

  gotoExistingSurvey: ->
    @pager.openPage(require("./pages/ExistingSurveyPage"))
