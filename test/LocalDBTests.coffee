assert = chai.assert
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
    @db.test.cache { _id: 1, a: 'apple' }, =>
      @db.test.find({}).fetch (results) ->
        assert.equal results[0].a, 'apple'
        done()

  it 'cache overwrite existing', (done) ->
    @db.test.cache { _id: 1, a: 'apple' }, =>
      @db.test.cache { _id: 1, a: 'banana' }, =>
        @db.test.find({}).fetch (results) ->
          assert.equal results[0].a, 'banana'
          done()

  it "cache doesn't overwrite upsert", (done) ->
    @db.test.upsert { _id: 1, a: 'apple' }, =>
      @db.test.cache { _id: 1, a: 'banana' }, =>
        @db.test.find({}).fetch (results) ->
          assert.equal results[0].a, 'apple'
          done()

  it "cache doesn't overwrite remove", (done) ->
    @db.test.cache { _id: 1, a: 'delete' }, =>
      @db.test.remove 1, =>
      @db.test.cache { _id: 1, a: 'banana' }, =>
        @db.test.find({}).fetch (results) ->
          assert.equal results.length, 0
          done()
