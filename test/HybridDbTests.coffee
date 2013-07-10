assert = chai.assert
LocalDb = require "../app/js/db/LocalDb"
HybridDb = require "../app/js/db/HybridDb"
db_queries = require "./db_queries"

# Note: Assumes local db is synchronous!
fail = ->
  throw new Error("failed")

describe 'HybridDb', ->
  beforeEach ->
    @local = new LocalDb()
    @remote = new LocalDb()
    @hybrid = new HybridDb(@local, @remote)

    @lc = @local.addCollection("scratch")
    @rc = @remote.addCollection("scratch")
    @hc = @hybrid.addCollection("scratch")

  context "hybrid mode", ->
    it "find gives only one result if data unchanged", (done) ->
      @lc.seed(_id:"1", a:1)
      @lc.seed(_id:"2", a:2)

      @rc.seed(_id:"1", a:1)
      @rc.seed(_id:"2", a:2)

      @hc.find({}).fetch (data) ->
        assert.equal data.length, 2
        done()
      , fail

    it "local upserts are respected", (done) ->
      @lc.seed(_id:"1", a:1)
      @lc.upsert(_id:"2", a:2)

      @rc.seed(_id:"1", a:1)
      @rc.seed(_id:"2", a:4)

      @hc.findOne { _id: "2"}, (doc) ->
        assert.deepEqual doc, { _id: "2", a: 2 }
        done()
      , fail

    it "respects projections"

    it "does not cache projected remote docs"

    it "find gives results twice if remote gives different answer", (done) ->
      @lc.seed(_id:"1", a:1)
      @lc.seed(_id:"2", a:2)

      @rc.seed(_id:"1", a:3)
      @rc.seed(_id:"2", a:4)

      calls = 0
      @hc.find({}).fetch (data) ->
        assert.equal data.length, 2
        calls = calls + 1
        if calls >=2
          done()
      , fail

    it "find gives results once if remote gives same answer with sort differences", (done) ->
      @lc.seed(_id:"1", a:1)
      @lc.seed(_id:"2", a:2)

      @rc.find = () =>
        return fetch: (success) =>
          success([{_id:"2", a:2}, {_id:"1", a:1}])

      @hc.find({}).fetch (data) ->
        assert.equal data.length, 2
        done()
      , fail

    it "findOne gives results twice if remote gives different answer", (done) ->
      @lc.seed(_id:"1", a:1)
      @lc.seed(_id:"2", a:2)

      @rc.seed(_id:"1", a:3)
      @rc.seed(_id:"2", a:4)

      calls = 0
      @hc.findOne { _id: "1"}, (data) ->
        calls = calls + 1
        if calls == 1
          assert.deepEqual data, { _id : "1", a:1 }
        if calls >= 2
          assert.deepEqual data, { _id : "1", a:3 }
          done()
      , fail

    it "findOne gives results null once if remote fails", (done) ->
      called = 0
      @rc.findOne = (selector, options = {}, success, error) ->
        called = called + 1
        error(new Error("fail"))
      @hc.findOne { _id: "xyz"}, (data) ->
        assert.equal data, null
        assert.equal called, 1
        done()
      , fail

    it "caches remote data", (done) ->
      @lc.seed(_id:"1", a:1)
      @lc.seed(_id:"2", a:2)

      @rc.seed(_id:"1", a:3)
      @rc.seed(_id:"2", a:2)

      calls = 0
      @hc.find({}).fetch (data) =>
        assert.equal data.length, 2
        calls = calls + 1

        # After second call, check that local collection has latest
        if calls == 2
          @lc.find({}).fetch (data) =>
            assert.equal data.length, 2
            assert.deepEqual _.pluck(data, 'a'), [3,2]
            done()

  context "local mode", ->
    it "find only calls local", (done) ->
      @lc.seed(_id:"1", a:1)
      @lc.seed(_id:"2", a:2)

      @rc.seed(_id:"1", a:3)
      @rc.seed(_id:"2", a:4)

      @hc.find({}, {mode:"local"}).fetch (data) =>
        assert.equal data.length, 2
        assert.deepEqual _.pluck(data, 'a'), [1,2]
        done()

    it "findOne only calls local if found", (done) ->
      @lc.seed(_id:"1", a:1)
      @lc.seed(_id:"2", a:2)

      @rc.seed(_id:"1", a:3)
      @rc.seed(_id:"2", a:4)

      calls = 0
      @hc.findOne { _id: "1" }, { mode: "local" }, (data) =>
        assert.deepEqual data, { _id : "1", a:1 }
        done()
      , fail

    it "findOne calls remote if not found", (done) ->
      @lc.seed(_id:"2", a:2)

      @rc.seed(_id:"1", a:3)
      @rc.seed(_id:"2", a:4)

      calls = 0
      @hc.findOne { _id: "1"}, { mode:"local" }, (data) =>
        assert.deepEqual data, { _id : "1", a:3 }
        done()
      , fail

  context "remote mode", ->
    beforeEach ->
      @lc.seed(_id:"1", a:1)
      @lc.seed(_id:"2", a:2)

      @rc.seed(_id:"1", a:3)
      @rc.seed(_id:"2", a:4)

    it "find only calls remote", (done) ->
      @hc.find({}, { mode: "remote" }).fetch (data) =>
        assert.deepEqual _.pluck(data, 'a'), [3,4]
        done()

    it "find does not cache results", (done) ->
      @hc.find({}, { mode: "remote" }).fetch (data) =>
        @lc.find({}).fetch (data) =>
          assert.deepEqual _.pluck(data, 'a'), [1,2]
          done()

    it "find falls back to local if remote fails", (done) ->
      @rc.find = (selector, options) =>
        return { fetch: (success, error) ->
          error()
        }
      @hc.find({}, { mode: "remote" }).fetch (data) =>
        assert.deepEqual _.pluck(data, 'a'), [1,2]
        done()

    it "find respects local upserts", (done) ->
      @lc.upsert({ _id:"1", a:9 })

      @hc.find({}, { mode: "remote", sort: ['_id'] }).fetch (data) =>
        assert.deepEqual _.pluck(data, 'a'), [9,4]
        done()

    it "find respects local removes", (done) ->
      @lc.remove("1")

      @hc.find({}, { mode: "remote" }).fetch (data) =>
        assert.deepEqual _.pluck(data, 'a'), [4]
        done()
    
  it "sync applies pending upserts and deletes"
  it "keeps upserts and deletes if failed to apply"

