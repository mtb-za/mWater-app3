assert = chai.assert
sourcecodes = require '../app/js/sourcecodes'
JsonServer = require './helpers/JsonServer'

describe "Source Code Manager", ->
  beforeEach ->
    @mgr = new sourcecodes.SourceCodeManager("source_codes")
    @mgr.reset()

    @server = new JsonServer()

  afterEach ->
    @server.teardown()

  it "Fails to return codes initially", (done) ->
    success = -> assert.fail()
    error = -> done()
    cutoff = "2012-01-01T00:00:00Z"
    @mgr.requestCode(success, error, cutoff)

  it "Calls server for more codes if none", (done) ->
    @server.respond "POST", "source_codes", (request) =>
      assert.equal request.params.number, 1
      return [ 
        { code: 10007, expiry: "2013-01-01T00:00:00Z"} 
        { code: 10014, expiry: "2013-01-01T00:00:00Z"} 
      ]
    success = (code) -> 
      assert.equal code, 10007
      done()
    error = -> assert.fail()
    cutoff = "2012-01-01T00:00:00Z"
    @mgr.requestCode(success, error, cutoff)

  it "Returns non-expired codes if present", (done) ->
    @mgr.setLocalCodes [ 
      { code: 10007, expiry: "2012-01-01T00:00:00Z"} 
      { code: 10014, expiry: "2013-01-01T00:00:00Z"} 
    ]

    success = (code) => 
      assert.equal code, 10014

      # Only one available. Now fails
      success = -> assert.fail()
      error = -> done()
      cutoff = "2010-01-01T00:00:00Z"
      @mgr.requestCode(success, error, cutoff)

    error = -> assert.fail()
    cutoff = "2012-06-01T00:00:00Z"
    @mgr.requestCode(success, error, cutoff)


  it "Return number of non-expired codes", (done) ->
    @mgr.setLocalCodes [ 
      { code: 10007, expiry: "2012-01-01T00:00:00Z"} 
      { code: 10014, expiry: "2013-01-01T00:00:00Z"} 
    ]

    cutoff = "2012-06-01T00:00:00Z"
    assert.equal @mgr.getNumberAvailableCodes(cutoff), 1
    done()

  it "Stores codes in local storage", ->
    @mgr.setLocalCodes [ 
      { code: 10007, expiry: "2012-01-01T00:00:00Z"} 
      { code: 10014, expiry: "2013-01-01T00:00:00Z"} 
    ]
    cutoff = "2012-06-01T00:00:00Z"
    mgr2 = new sourcecodes.SourceCodeManager()
    assert.equal mgr2.getNumberAvailableCodes(cutoff), 1




