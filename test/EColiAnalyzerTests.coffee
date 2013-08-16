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

  it "gets min/max for tests", ->
    # Unknown test
    assert.deepEqual @analyzer.analyzeTest({ type: "xyz" }), [0, -1]

    # Aquagenx100PA
    test = { type: "Aquagenx100PA", data: { dilution: 1, ecoli_present: true } }
    assert.deepEqual @analyzer.analyzeTest(test), [1, -1]

    test = { type: "Aquagenx100PA", data: { dilution: 5, ecoli_present: true } }
    assert.deepEqual @analyzer.analyzeTest(test), [5, -1]

    test = { type: "Aquagenx100PA", data: { dilution: 5, ecoli_present: false } }
    assert.deepEqual @analyzer.analyzeTest(test), [0, 4]

    # ColilertMPN
    test = { type: "ColilertMPN", data: { dilution: 1, ecoli_present: true } }
    assert.deepEqual @analyzer.analyzeTest(test), [10, -1]

    test = { type: "ColilertMPN", data: { dilution: 5, ecoli_present: true } }
    assert.deepEqual @analyzer.analyzeTest(test), [50, -1]

    test = { type: "ColilertMPN", data: { dilution: 5, ecoli_present: false } }
    assert.deepEqual @analyzer.analyzeTest(test), [0, 49]

    # CompactDryEC
    test = { type: "CompactDryEC", data: { dilution: 1, ecoli_count: 2 } }
    assert.deepEqual @analyzer.analyzeTest(test), [200, 299]

    test = { type: "CompactDryEC", data: { dilution: 1, ecoli_count: 0 } }
    assert.deepEqual @analyzer.analyzeTest(test), [0, 99]

    test = { type: "CompactDryEC", data: { dilution: 2, ecoli_count: 0 } }
    assert.deepEqual @analyzer.analyzeTest(test), [0, 199]

    test = { type: "CompactDryEC", data: { dilution: 2, ecoli_count: 0, ecoli_tntc: true } }
    assert.deepEqual @analyzer.analyzeTest(test), [20000, -1]

    # PetrifilmEcoliColiform
    test = { type: "PetrifilmEcoliColiform", data: { dilution: 2, ecoli_count: 2 } }
    assert.deepEqual @analyzer.analyzeTest(test), [400, 599]

    test = { type: "PetrifilmEcoliColiform", data: { dilution: 1, ecoli_count: 0 } }
    assert.deepEqual @analyzer.analyzeTest(test), [0, 99]

    test = { type: "PetrifilmEcoliColiform", data: { dilution: 2, ecoli_count: 0 } }
    assert.deepEqual @analyzer.analyzeTest(test), [0, 199]

  it "combines min/maxes"
  it "correctly returns for complex example"	