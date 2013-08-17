Page = require("../Page")
NewSurveyPage = require("./NewSurveyPage")
NewTestPage = require("./NewTestPage")
NewSourcePage = require("./NewSourcePage")
SourceListPage = require("./SourceListPage")
SourceMapPage = require("./SourceMapPage")

class MainPage extends Page
  events:
    "click #source_list" : "gotoSourceList"
    "click #source_map" : "gotoSourceMap"
    "click #new_test" : "addTest"
    "click #new_survey" : "addSurvey"

  activate: ->
    @setTitle "mWater"

    # Rerender on error/success of sync
    if @dataSync?
      @listenTo @dataSync, "success error", =>
        @render()

    if @imageSync?
      @listenTo @imageSync, "success error", =>
        @render()

    @render()

  deactivate: ->
    # Stop listening to events
    if @dataSync?
      @stopListening @dataSync
    if @imageSync?
      @stopListening @imageSync

  render: ->
    data = {}
    data.login = @login
    data.version = @version
    data.baseVersion = @baseVersion
    data.lastSyncDate = @dataSync.lastSuccessDate if @dataSync?

    data.imagesRemaining = @imageSync.lastSuccessMessage if @imageSync?

    @$el.html templates['pages/MainPage'](data)

    # Display images pending
    if @imageManager? and @imageManager.numPendingImages?
      @imageManager.numPendingImages (num) =>
        if num > 0
          $("#images_pending").html("<b>#{num} images to upload</b>")
        else
          $("#images_pending").html("")
      , @error

    menu = []
    if NewSourcePage.canOpen(@ctx)
      menu.push({ text: "Add Water Source", click: => @addSource() })
    if NewTestPage.canOpen(@ctx)
      menu.push({ text: "Start Water Test", click: => @addTest() })
    if NewSurveyPage.canOpen(@ctx)
      menu.push({ text: "Start Survey", click: => @addSurvey() })
    if menu.length > 0
      @setupButtonBar [{ icon: "plus.png", menu: menu }]

  addSurvey: ->
    @pager.openPage(NewSurveyPage)

  addTest: ->
    @pager.openPage(NewTestPage)

  addSource: ->
    @pager.openPage(NewSourcePage)

  gotoSourceList: ->
    @pager.openPage(SourceListPage)

  gotoSourceMap: ->
    @pager.openPage(SourceMapPage)

module.exports = MainPage