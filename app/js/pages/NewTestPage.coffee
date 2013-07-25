Page = require "../Page"
TestPage = require "./TestPage"

# Parameter is optional source code
class NewTestPage extends Page
  @canOpen: (ctx) -> ctx.auth.insert("tests")

  events: 
    "click .test" : "startTest"

  activate: ->
    @setTitle "Select Test"

    @db.forms.find({type:"WaterTest"}).fetch (forms) =>
      @forms = forms
      @$el.html templates['pages/NewTestPage'](forms:forms)

  startTest: (ev) ->
    testCode = ev.currentTarget.id

    form = _.findWhere(@forms, { code: testCode })
    if not form
      @error("Form not found")
      return

    # Create test
    test = {
      source: @options.source
      type: form.code
      type_rev: form._rev
      started: new Date().toISOString()
      completed: null
      user: @login.user
      org: @login.org
    }
    @db.tests.upsert test, (test) =>
      @pager.closePage(TestPage, { _id: test._id })

module.exports = NewTestPage