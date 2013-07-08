assert = chai.assert
ProblemReporter = require '../app/js/ProblemReporter'

describe "ProblemReporter", ->
  before ->
    getClient = ->
      return "1234"
    @oldConsoleError = console.error
    @pr = new ProblemReporter("http://localhost:8080/problem_reports", "1.2", getClient)
  after ->
    @pr.restore()
    assert.equal console.error, @oldConsoleError

  it "posts error on console.error", ->
    post = sinon.stub($, "post")
    console.error "Some error message"

    assert.isTrue post.calledOnce
    assert.equal post.args[0][1].version, "1.2"
    assert.equal post.args[0][1].client, "1234"

    post.restore()
