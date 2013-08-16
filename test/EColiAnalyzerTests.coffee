assert = chai.assert
_ = require 'underscore'

LocalDb = require "../app/js/db/LocalDb"
SourceLayerCreators = require '../app/js/map/SourceLayerCreators'

describe "EColiAnalyzer", ->
  beforeEach ->
    @db = new LocalDb()
    @db.addCollection("tests")
    @source = { code : "1" }

    @analyzer = new SourceLayerCreators.EColiAnalyzer(@db)

  it.skip "returns -1 for no tests", (done) ->
    @analyzer.analyzeSource @source, (level) =>
      assert.equal level, -1
      done()

  it "gets last tests", (done) ->
    @db.tests.upsert({ _id: '1', data: { source: "1" }, completed: null })
    @db.tests.upsert({ _id: '2', data: { source: "1" }, completed: "2012-01-10T12:00:00.000Z" })
    @db.tests.upsert({ _id: '3', data: { source: "1" }, completed: "2012-01-09T12:01:00.000Z" })
    @db.tests.upsert({ _id: '4', data: { source: "1" }, completed: "2012-01-09T11:59:00.000Z" })
    @db.tests.upsert({ _id: '5', data: { source: "1" }, completed: "2012-01-08T11:59:00.000Z" })
    @db.tests.upsert({ _id: '6', data: { source: "2" }, completed: "2012-01-11T12:00:00.000Z" })

    @analyzer.getLastTests @source, (tests) =>
      assert.deepEqual _.pluck(tests, '_id'), ["2", "3"]
      done()

#   it "returns grey marker for no tests", (done) ->
#     @creator.create @source, (result) =>
#       assert.equal result.marker.fillColor, grey

#   it "returns green marker for Aquagenx negative test", (done) ->
#     call = 0
#     @creator.create @source, (result) =>
#       call = call + 1
#       # Ignore initial call
#       if call == 1
#         return

#       assert.equal result.marker.fillColor, green





	