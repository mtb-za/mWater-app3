assert = chai.assert
GPSLoggerProtocol = require '../../app/js/sensors/gpslogger/GPSLoggerProtocol'

class MockGPSLoggerPacketMgr
  constructor: ->
    _.extend @, Backbone.Events

  setExpected: (id, data) ->
    @expectedId = id
    @expectedData = data

  send: (id, data) ->
    assert.equal id, @expectedId
    assert.equal data, @expectedData
    if @autoResponseId
      @trigger 'receive', @autoResponseId, @autoResponseData

  setResponse: (id, data) ->
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

  # it "waits until one command done before sending next"

  it "calls error on error", ->
    @mgr.send = =>
      @mgr.trigger 'error', "some error"

    @prot.getBatteryVoltage (volts) ->
      assert.fail()
    , (error) ->
      assert.equal error, "some error"
      done()

  it "gets battery voltage", (done) ->
    @mgr.setExpected("bv", "0")
    @mgr.setResponse("BV", "3.7")
    @prot.getBatteryVoltage (volts) ->
      assert.equal volts, 3.7
      done()

  it "gets uid", (done) ->
    @mgr.setExpected("fw", "0")
    @mgr.setResponse("FW", "c1fee0e3fb24852600001")
    @prot.getUid (uid) ->
      assert.equal uid, "c1fee0e3fb24852600001"
      done()

  it "gets status", (done) ->
    @mgr.setExpected("gs", "0")
    @mgr.setResponse("GS", "1,05")
    @prot.getStatus (running, samplingRate) ->
      assert.equal running, true
      assert.equal samplingRate, 5
      done()

  it "upgrades firmware", (done) ->
    @mgr.setExpected("ug", "0")
    @mgr.setResponse("UG", "0")
    @prot.upgradeFirmware () ->
      done()

  it "finds number of records", (done) ->
    @mgr.setExpected("fn", "0")
    @mgr.setResponse("FN", "00000066,00000111,00000045")
    @prot.getNumberRecords (count, lowestId, highestId) ->
      assert.equal count, 66
      assert.equal lowestId, 45
      assert.equal highestId, 111
      done()

  it "gets n records"

  it "deletes all records"
  it "disables logging"
  it "enables logging"
  it "exits command mode"
  it "calls error on unknown command"

