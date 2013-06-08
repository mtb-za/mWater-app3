LocalDb = require "LocalDb"

describe 'LocalDb', ->
  before ->
    @db = new LocalDb()

  beforeEach (done) ->
    @db.removeCollection('test')
    @db.addCollection('test')
    done()

  it "passes queries", (done) ->
    test_queries @db
    done()

  it 'caches rows', (done) ->
    @db.test.cache { _id: 1, a: 'apple' }, ->
      @db.find({}).fetch (results) ->
        assert.equal results[0].a, 'apple'
        done()


