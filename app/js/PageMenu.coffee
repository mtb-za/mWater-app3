# Lists pages to jump to
# ctx must be passed in as option

login = require './login'
context = require './context'

module.exports = class PageMenu extends Backbone.View
  initialize: (options) ->
    @pager = options.ctx.pager
    @options = options || {}

  events:
    "click #home" : "gotoHome"
    "click #login" : "gotoLogin"
    "click #logout" : "logout"
    "click #source_list" : "gotoSourceList"
    "click #source_map" : "gotoSourceMap"
    "click #settings" : "gotoSettings"
    "click #new_test" : "gotoNewTest"
    "click #test_list" : "gotoTestList"
    "click #survey_list" : "gotoSurveyList"
    "click #report_problem" : 'gotoProblemReport'
    "click #admin" : 'gotoAdmin'

  render: ->
    @$el.html require('./PageMenu.hbs')()
    @$("#new_test").toggle(require("./pages/NewTestPage").canOpen(@options.ctx))
    @$("#survey_list").toggle(require("./pages/SurveyListPage").canOpen(@options.ctx))
    @$("#test_list").toggle(require("./pages/TestListPage").canOpen(@options.ctx))
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
    context.createAnonymousContext (ctx) =>
      _.extend @options.ctx, ctx
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

  gotoTestList: ->
    @pager.openPage(require("./pages/TestListPage"))

  gotoSurveyList: ->
    @pager.openPage(require("./pages/SurveyListPage"))

  gotoProblemReport: ->
    @pager.openPage(require("./pages/ProblemReportPage"))

  gotoAdmin: ->
    @pager.openPage(require("./pages/AdminPage"))
