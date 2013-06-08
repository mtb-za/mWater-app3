assert = chai.assert
LocalDb = require "LocalDb"

describe 'LocalDb', ->
  before ->
    @db = new LocalDb()

  beforeEach (done) ->
    @db.removeCollection('test')
    @db.addCollection('test')
    done()

  describe "passes queries", ->
    test_queries.call(this)

  it 'caches rows', (done) ->
    @db.test.cache [{ _id: 1, a: 'apple' }], {}, {}, =>
      @db.test.find({}).fetch (results) ->
        assert.equal results[0].a, 'apple'
        done()

  it 'cache overwrite existing', (done) ->
    @db.test.cache [{ _id: 1, a: 'apple' }], {}, {}, =>
      @db.test.cache [{ _id: 1, a: 'banana' }], {}, {}, =>
        @db.test.find({}).fetch (results) ->
          assert.equal results[0].a, 'banana'
          done()

  it "cache doesn't overwrite upsert", (done) ->
    @db.test.upsert { _id: 1, a: 'apple' }, =>
      @db.test.cache [{ _id: 1, a: 'banana' }], {}, {}, =>
        @db.test.find({}).fetch (results) ->
          assert.equal results[0].a, 'apple'
          done()

  it "cache doesn't overwrite remove", (done) ->
    @db.test.cache [{ _id: 1, a: 'delete' }], {}, {}, =>
      @db.test.remove 1, =>
      @db.test.cache [{ _id: 1, a: 'banana' }], {}, {}, =>
        @db.test.find({}).fetch (results) ->
          assert.equal results.length, 0
          done()

  it "cache removes missing unsorted", (done) ->
    @db.test.cache [{ _id: 1, a: 'a' }, { _id: 2, a: 'b' }, { _id: 3, a: 'c' }], {}, {}, =>
      @db.test.cache [{ _id: 1, a: 'a' }, { _id: 3, a: 'c' }], {}, {}, =>
        @db.test.find({}).fetch (results) ->
          assert.equal results.length, 2
          done()

  it "cache removes missing filtered", (done) ->
    @db.test.cache [{ _id: 1, a: 'a' }, { _id: 2, a: 'b' }, { _id: 3, a: 'c' }], {}, {}, =>
      @db.test.cache [{ _id: 1, a: 'a' }], {_id: {$lt:3}}, {}, =>
        @db.test.find({}, {sort:['_id']}).fetch (results) ->
          assert.deepEqual _.pluck(results, '_id'), [1,3]
          done()

  it "cache removes missing sorted limited", (done) ->
    @db.test.cache [{ _id: 1, a: 'a' }, { _id: 2, a: 'b' }, { _id: 3, a: 'c' }], {}, {}, =>
      @db.test.cache [{ _id: 1, a: 'a' }], {}, {sort:['_id'], limit:2}, =>
        @db.test.find({}, {sort:['_id']}).fetch (results) ->
          assert.deepEqual _.pluck(results, '_id'), [1,3]
          done()

  it "cache does not remove missing sorted limited past end", (done) ->
    @db.test.cache [{ _id: 1, a: 'a' }, { _id: 2, a: 'b' }, { _id: 3, a: 'c' }, { _id: 4, a: 'd' }], {}, {}, =>
      @db.test.remove 2, =>
        @db.test.cache [{ _id: 1, a: 'a' }, { _id: 2, a: 'b' }], {}, {sort:['_id'], limit:2}, =>
          @db.test.find({}, {sort:['_id']}).fetch (results) ->
            assert.deepEqual _.pluck(results, '_id'), [1,3,4]
            done()