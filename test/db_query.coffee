assert = chai.assert
LocalDb = require "LocalDb"

test_queries = (db, reset) ->
  beforeEach (done) ->
    reset(done)

  context 'With sample rows', ->
    beforeEach (done) ->
      db.test.upsert { _id:1, a:"Alice" }, ->
        db.test.upsert { _id:2, a:"Bob" }, ->
          db.test.upsert { _id:3, a:"Charlie" }, ->
            done()

    it 'finds all rows', (done) ->
      db.test.find({}).fetch (results) ->
        assert.equal 3, results.length
        done()

    it 'finds all rows with options', (done) ->
      db.test.find({}, {}).fetch (results) ->
        assert.equal 3, results.length
        done()

    it 'filters rows by id', (done) ->
      db.test.find({ _id: 1 }).fetch (results) ->
        assert.equal 1, results.length
        assert.equal 'Alice', results[0].a
        done()

    it 'removes item', (done) ->
      db.test.remove 2, ->
        db.test.find({}).fetch (results) ->
          assert.equal 2, results.length
          assert 1 in (result._id for result in results)
          assert 2 not in (result._id for result in results)
          done()

    it 'removes non-existent item', (done) ->
      db.test.remove 999, ->
        db.test.find({}).fetch (results) ->
          assert.equal 3, results.length
          done()

  it 'adds _id to rows', (done) ->
    db.test.upsert { a: 1 }, (item) ->
      assert.property item, '_id'
      assert.lengthOf item._id, 32
      done()

  it 'updates by id', (done) ->
    db.test.upsert { _id:1, a:1 }, (item) ->
      db.test.upsert { _id:1, a:2 }, (item) ->
        assert.equal item.a, 2
  
        db.test.find({}).fetch (results) ->
          assert.equal 1, results.length
          done()

describe 'LocalDb', ->
  @db = new LocalDb()

  test_queries @db, (done) =>
    @db.removeCollection('test')
    @db.addCollection('test')
    done()