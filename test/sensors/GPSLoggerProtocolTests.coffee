assert = chai.assert
GPSLoggerProtocol = require '../../app/js/sensors/gpslogger/GPSLoggerProtocol'

class MockGPSLoggerPacketMgr
  constructor: ->
    _.extend @, Backbone.Events

  setExpected: (id, data="") ->
    @expectedId = id
    @expectedData = data

  send: (id, data) ->
    assert.equal id, @expectedId
    assert.equal data, @expectedData
    if @autoResponseId
      @trigger 'receive', @autoResponseId, @autoResponseData

  setResponse: (id, data="") ->
    @autoResponseId = id
    @autoResponseData = data

  mockReceive: (id, data) ->
    @trigger 'receive', id, data

  mockError: (error) ->
    @trigger 'error', error


describe "GPSLoggerProtocol", ->
  beforeEach ->
    @mgr = new MockGPSLoggerPacketMgr()
    @prot = new GPSLoggerProtocol(@mgr)

  it "waits until one command done before sending next"
  
  it "calls error on error", ->
    @mgr.send = =>
      @mgr.trigger 'error', "some error"

    @prot.getBatteryVoltage (volts) ->
      assert.fail()
    , (error) ->
      assert.equal error, "some error"
      done()

  it "gets battery voltage", (done) ->
    @mgr.setExpected("bv")
    @mgr.setResponse("BV", "3.7")
    @prot.getBatteryVoltage (volts) ->
      assert.equal volts, 3.7
      done()

  it "deletes all records"
  it "disables logging"
  it "enables logging"
  it "exits command mode"
  it "finds number of records"
  it "gets uid"
  it "gets n records"
  it "gets status"
  it "calls error on unknown command"
  it "updates firmware"

