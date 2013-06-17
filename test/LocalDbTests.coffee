assert = chai.assert
LocalDb = require "../app/js/db/LocalDb"
db_queries = require "./db_queries"

describe 'LocalDb', ->
  before ->
    @db = new LocalDb('test')

  beforeEach (done) ->
    @db.removeCollection('test')
    @db.addCollection('test')
    done()

  describe "passes queries", ->
    db_queries.call(this)

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

describe 'LocalDb with local storage', ->
  before ->
    @db = new LocalDb('test', { namespace: "db.test" })

  beforeEach (done) ->
    @db.removeCollection('test')
    @db.addCollection('test')
    done()

  it "retains items", (done) ->
    @db.test.upsert { _id:1, a:"Alice" }, =>
      db2 = new LocalDb('test', { namespace: "db.test" })
      db2.addCollection 'test'
      db2.test.find({}).fetch (results) ->
        assert.equal results[0].a, "Alice"
        done()

  it "retains upserts", (done) ->
    @db.test.upsert { _id:1, a:"Alice" }, =>
      db2 = new LocalDb('test', { namespace: "db.test" })
      db2.addCollection 'test'
      db2.test.find({}).fetch (results) ->
        db2.test.pendingUpserts (upserts) ->
          assert.deepEqual results, upserts
          done()

  it "retains removes", (done) ->
    @db.test.seed { _id:1, a:"Alice" }, =>
      @db.test.remove 1, =>
        db2 = new LocalDb('test', { namespace: "db.test" })
        db2.addCollection 'test'
        db2.test.pendingRemoves (removes) ->
          assert.deepEqual removes, [1]
          done()

describe 'LocalDb without local storage', ->
  before ->
    @db = new LocalDb('test')

  beforeEach (done) ->
    @db.removeCollection('test')
    @db.addCollection('test')
    done()

  it "does not retain items", (done) ->
    @db.test.upsert { _id:1, a:"Alice" }, =>
      db2 = new LocalDb('test')
      db2.addCollection 'test'
      db2.test.find({}).fetch (results) ->
        assert.equal results.length, 0
        done()

  it "does not retain upserts", (done) ->
    @db.test.upsert { _id:1, a:"Alice" }, =>
      db2 = new LocalDb('test')
      db2.addCollection 'test'
      db2.test.find({}).fetch (results) ->
        db2.test.pendingUpserts (upserts) ->
          assert.equal results.length, 0
          done()

  it "does not retain removes", (done) ->
    @db.test.seed { _id:1, a:"Alice" }, =>
      @db.test.remove 1, =>
        db2 = new LocalDb('test')
        db2.addCollection 'test'
        db2.test.pendingRemoves (removes) ->
          assert.equal removes.length, 0
          done()

