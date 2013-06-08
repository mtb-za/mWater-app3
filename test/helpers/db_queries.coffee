assert = chai.assert

window.test_queries = (db) ->
  context 'With sample rows', ->
    beforeEach (done) ->
      db.test.upsert { _id:1, a:"Alice" }, ->
        db.test.upsert { _id:2, a:"Charlie" }, ->
          db.test.upsert { _id:3, a:"Bob" }, ->
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

    it 'finds one row', (done) ->
      db.test.findOne { _id: 2 }, (result) ->
        assert.equal 'Charlie', result.a
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

    it 'sorts ascending', (done) ->
      db.test.find({}, {sort: ['a']}).fetch (results) ->
        assert.deepEqual _.pluck(results, '_id'), [1,3,2]
        done()

    it 'sorts descending', (done) ->
      db.test.find({}, {sort: [['a','desc']]}).fetch (results) ->
        assert.deepEqual _.pluck(results, '_id'), [2,3,1]
        done()

    it 'limits', (done) ->
      db.test.find({}, {sort: ['a'], limit:2}).fetch (results) ->
        assert.deepEqual _.pluck(results, '_id'), [1,3]
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

