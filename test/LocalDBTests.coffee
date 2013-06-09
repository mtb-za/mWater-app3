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

  it "returns pending upserts", (done) ->
    @db.test.cache [{ _id: 1, a: 'apple' }], {}, {}, =>
      @db.test.upsert { _id: 2, a: 'banana' }, =>
        @db.test.pendingUpserts (results) =>
          assert.equal results.length, 1
          assert.equal results[0].a, 'banana'
          done()

  it "resolves pending upserts", (done) ->
    @db.test.upsert { _id: 2, a: 'banana' }, =>
      @db.test.resolveUpsert { _id: 2, a: 'banana' }, =>
        @db.test.pendingUpserts (results) =>
          assert.equal results.length, 0
          done()

  it "retains changed pending upserts", (done) ->
    @db.test.upsert { _id: 2, a: 'banana' }, =>
      @db.test.upsert { _id: 2, a: 'banana2' }, =>
        @db.test.resolveUpsert { _id: 2, a: 'banana' }, =>
          @db.test.pendingUpserts (results) =>
            assert.equal results.length, 1
            assert.equal results[0].a, 'banana2'
            done()

  it "removes pending upserts", (done) ->
    @db.test.upsert { _id: 2, a: 'banana' }, =>
      @db.test.remove 2, =>
        @db.test.pendingUpserts (results) =>
          assert.equal results.length, 0
          done()

  it "returns pending removes", (done) ->
    @db.test.cache [{ _id: 1, a: 'apple' }], {}, {}, =>
      @db.test.remove 1, =>
        @db.test.pendingRemoves (results) =>
          assert.equal results.length, 1
          assert.equal results[0], 1
          done()

  it "resolves pending removes", (done) ->
    @db.test.cache [{ _id: 1, a: 'apple' }], {}, {}, =>
      @db.test.remove 1, =>
        @db.test.resolveRemove 1, =>
          @db.test.pendingRemoves (results) =>
            assert.equal results.length, 0
            done()

  it "seeds", (done) ->
    @db.test.seed { _id: 1, a: 'apple' }, =>
      @db.test.find({}).fetch (results) ->
        assert.equal results[0].a, 'apple'
        done()

  it "does not overwrite existing", (done) ->
    @db.test.cache [{ _id: 1, a: 'banana' }], {}, {}, =>
      @db.test.seed { _id: 1, a: 'apple' }, =>
        @db.test.find({}).fetch (results) ->
          assert.equal results[0].a, 'banana'
          done()

  it "does not add removed", (done) ->
    @db.test.cache [{ _id: 1, a: 'apple' }], {}, {}, =>
      @db.test.remove 1, =>
        @db.test.seed { _id: 1, a: 'apple' }, =>
          @db.test.find({}).fetch (results) ->
            assert.equal results.length, 0
            done()
