# Lists pages to jump to
# ctx must be passed in as option

login = require './login'
context = require './context'

module.exports = class PageMenu extends Backbone.View
  initialize: (options) ->
    @pager = options.ctx.pager

  events:
    "click #home" : "gotoHome"
    "click #login" : "gotoLogin"
    "click #logout" : "logout"
    "click #source_list" : "gotoSourceList"
    "click #source_map" : "gotoSourceMap"
    "click #settings" : "gotoSettings"
    "click #new_test" : "gotoNewTest"
    "click #existing_test" : "gotoExistingTest"
    "click #new_survey" : "gotoNewSurvey"
    "click #existing_survey" : "gotoExistingSurvey"
    "click #report_problem" : 'gotoProblemReport'
    "click #import_sources" : 'gotoImportSources'
    "click #admin" : 'gotoAdmin'

  render: ->
    @$el.html templates['PageMenu']()
    @$("#new_test").toggle(require("./pages/NewTestPage").canOpen(@options.ctx))
    @$("#new_survey").toggle(require("./pages/NewSurveyPage").canOpen(@options.ctx))
    @$("#existing_survey").toggle(require("./pages/ExistingSurveyPage").canOpen(@options.ctx))
    @$("#existing_test").toggle(require("./pages/TestListPage").canOpen(@options.ctx))
    @$("#admin").toggle(require("./pages/AdminPage").canOpen(@options.ctx))

    @$("#login").toggle(not @options.ctx.login?)
    @$("#logout").toggle(@options.ctx.login?)

  gotoHome: ->
    while @pager.multiplePages()
      @pager.closePage()
    @pager.closePage(require("./pages/MainPage"))

  logout: ->
    login.setLogin(null)
    
    # Update context, first stopping old one
    @options.ctx.stop()
    _.extend @options.ctx, context.createAnonymousContext()

    @gotoLogin()

  gotoLogin: ->
    while @pager.multiplePages()
      @pager.closePage()
    @pager.closePage(require("./pages/LoginPage"))

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

  gotoProblemReport: ->
    @pager.openPage(require("./pages/ProblemReportPage"))

  gotoImportSources: ->
    @pager.openPage(require("./pages/ImportSourcesPage"))

  gotoAdmin: ->
    @pager.openPage(require("./pages/AdminPage"))
