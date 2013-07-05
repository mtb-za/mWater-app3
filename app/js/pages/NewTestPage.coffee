Page = require "../Page"
TestPage = require "./TestPage"

# Parameter is optional source code
class NewTestPage extends Page
  events: 
    "click .test" : "startTest"

  activate: ->
    @setTitle "Select Test"

    @db.forms.find({type:"WaterTest"}).fetch (forms) =>
      @forms = forms
      @$el.html templates['pages/NewTestPage'](forms:forms)

  startTest: (ev) ->
    testCode = ev.currentTarget.id

    # TODO add user/org

    # Create test
    test = {
      source: @options.source
      type: testCode
      completed: null
      started: new Date().toISOString()
    }
    @db.tests.upsert test, (test) =>
      @pager.closePage(TestPage, { _id: test._id })

module.exports = NewTestPage