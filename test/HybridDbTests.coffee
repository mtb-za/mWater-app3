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

  it "gives only one result if data unchanged", (done) ->
    @lc.seed(_id:"1", a:1)
    @lc.seed(_id:"2", a:2)

    @rc.seed(_id:"1", a:1)
    @rc.seed(_id:"2", a:2)

    @hc.find({}).fetch (data) ->
      assert.equal data.length, 2
      done()
    , fail

  it "gives results twice if remote gives different answer", (done) ->
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

  it "caches remote data"
  it "find only calls local in local mode"
  it "findOne only calls local in local mode"
  it "find only calls remote in remote mode"
  it "findOne only calls remote in remote mode"
  it "find falls back to local if remote fails in remote mode"
  it "findOne falls back to local if remote fails in remote mode"

  it "sync applies pending upserts and deletes"
  it "keeps upserts and deletes if failed to apply"

