Page = require "../Page"
TestPage = require "./TestPage"

# Parameter is optional source code
class NewTestPage extends Page
  @canOpen: (ctx) -> ctx.auth.insert("tests") and ctx.login.user

  events: 
    "click .test" : "startTest"

  activate: ->
    @setTitle "Select Test"

    @db.forms.find({type:"WaterTest"}).fetch (forms) =>
      @forms = forms
      @$el.html templates['pages/NewTestPage'](forms:forms)

  startTest: (ev) ->
    testCode = ev.currentTarget.id

    # Create test
    test = {
      source: @options.source
      type: testCode
      completed: null
      started: new Date().toISOString()
      user: @login.user
      org: @login.org
    }
    @db.tests.upsert test, (test) =>
      @pager.closePage(TestPage, { _id: test._id })

module.exports = NewTestPage