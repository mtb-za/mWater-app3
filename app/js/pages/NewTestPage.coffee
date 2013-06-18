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

    # Create test
    test = {
      source: @args[0] if @args.length > 0
      type: testCode
      completed: null
      started: new Date().toISOString()
      name: _.findWhere(@forms, { code: testCode }).name  # TODO don't put name here? Also fix in TestListPage
    }
    @db.tests.upsert test, (test) =>
      @pager.closePage(TestPage, test._id)

module.exports = NewTestPage