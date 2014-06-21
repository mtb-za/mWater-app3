Page = require "../Page"
TestPage = require './TestPage'
forms = require '../forms'

# Parameter is optional source code
module.exports = class NewTestPage extends Page
  @canOpen: (ctx) -> ctx.auth.insert("tests")

  events: 
    "click .test" : "startTest"

  activate: ->
    @setTitle T("Select Test")

    @db.forms.find({type:"WaterTest"}).fetch (forms) =>
      @forms = forms
      @$el.html require('./NewTestPage.hbs')(forms:forms)

  startTest: (ev) ->
    testCode = ev.currentTarget.id

    form = _.findWhere(@forms, { code: testCode })
    if not form
      @error(T("Form not found"))
      return

    # Create code. Not unique, but unique per user if logged in once.
    code = @login.user + "-" + forms.createBase32TimeCode(new Date())

    # Create test
    test = {
      type: form.code
      type_rev: form._rev
      code: code
      started: new Date().toISOString()
      completed: null
      user: @login.user
      org: @login.org
    }

    if @options.source
      test.data = { source: @options.source }
      
    @db.tests.upsert test, (test) =>
      @pager.closePage(TestPage, { _id: test._id })
    , @error
