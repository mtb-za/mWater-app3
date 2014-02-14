assert = chai.assert
_ = require 'underscore'

LocalDb = require("minimongo").LocalDb
SourceLayerCreators = require '../app/js/map/SourceLayerCreators'

describe "EColiAnalyzer", ->
  beforeEach ->
    @db = new LocalDb()
    @db.addCollection("tests")
    @source = { code : "1" }

    @analyzer = new SourceLayerCreators.EColiAnalyzer(@db)

  it "returns nodata for no tests", (done) ->
    @analyzer.analyzeSource @source, (level) =>
      assert.equal level, "nodata"
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

  describe "combines min/maxes", ->
    it "lowers max", ->
      assert.deepEqual @analyzer.combineMinMax([[0, 20], [0, 40]]), [0, 20]

    it "keeps max for -1", ->
      assert.deepEqual @analyzer.combineMinMax([[0, 20], [0, -1]]), [0, 20]

    it "raises min", ->
      assert.deepEqual @analyzer.combineMinMax([[0, 20], [10, 40]]), [10, 20]

    it "prioritizes min when conflict", ->
      assert.deepEqual @analyzer.combineMinMax([[0, 5], [10, 40]]), [10, 10]

  it "correctly returns for complex example", (done) ->
    @db.tests.upsert({ type: "ColilertMPN", data: { source: "1", dilution: 1, ecoli_present: false }, completed: "2012-01-10T12:00:00.000Z" })
    @db.tests.upsert({ type: "Aquagenx100PA", data: { source: "1", dilution: 2, ecoli_present: true }, completed: "2012-01-09T12:01:00.000Z" })

    @analyzer.analyzeSource @source, (level) =>
      assert.equal level, 9
      done()

  it "correctly returns for example with no upper bound", (done) ->
    @db.tests.upsert({ type: "Aquagenx100PA", data: { source: "1", dilution: 2, ecoli_present: true }, completed: "2012-01-09T12:01:00.000Z" })

    @analyzer.analyzeSource @source, (level) =>
      assert.equal level, 'high'
      done()
