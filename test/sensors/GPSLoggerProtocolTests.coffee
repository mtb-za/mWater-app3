assert = chai.assert
GPSLoggerProtocol = require '../../app/js/sensors/gpslogger/GPSLoggerProtocol'

class MockGPSLoggerPacketMgr
  constructor: ->
    _.extend @, Backbone.Events

  setExpected: (id, data) ->
    @expectedId = id
    @expectedData = data

  send: (id, data, success, error) ->
    assert.equal id, @expectedId
    assert.equal data, @expectedData
    success()
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
    @mgr.setResponse("GS", "0,05")
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
    @prot.getNumberRecords (count, lowestId, nextId) ->
      assert.equal count, 66
      assert.equal lowestId, 45
      assert.equal highestId, 111
      done()

  it "gets records", (done) ->
    @mgr.setExpected("gn", "00000045,001")
    @mgr.setResponse("GN", '''0, 
00000155000000000000000000000201012235945000000, 
00000156000000000000000000000201012235950000000, 
00000157000000000000000000000201012235955000000, 
00000158000000000000000000000251012220045000000, 
00000159000000000000000000000220514220050000000, 
00000160110029324538095234169220514220055000909, 
00000161110029324534095234129220514220100000909, 
00000162110029324526095234127220514220105000810, 
00000163110029324526095234127220514220110000810, 
00000164110029324526095234127220514220115000810, 
00000165110029324526095234127220514220120000810'''.replace(/, *\n\r?/g, ","))
    @prot.getRecords 45, 1, (records) ->
      assert.equal records.length, 11
      assert.deepEqual records[0], {
        rec: 155
        valid: false
        ts: "2012-10-20T23:59:45Z"
      } 
      cmp = {
        rec: 160
        valid: true
        ts: "2014-05-22T22:00:55Z"
        acc: 0.9
        lat: 29 + (32.4538/60)
        lng: - (95 + 23.4169/60)
        sats: 9
      }
      assert.deepEqual records[5], cmp
      done()

  it "gets error records", (done) ->
    @mgr.setExpected("gn", "00000045,001")
    @mgr.setResponse("GN", '1')
    @prot.getRecords 45, 1, ->
      assert.fail()
    , () ->
      done()

  it "disables logging", (done) ->
    @mgr.setExpected("dl", "1")
    @mgr.setResponse("DL", "1")
    @prot.disableLogging ->
      done()

  it "enables logging", (done) ->
    @mgr.setExpected("dl", "0")
    @mgr.setResponse("DL", "0")
    @prot.enableLogging ->
      done()
  
  it "exits command mode", (done) ->
    @mgr.setExpected("ex", "0")
    @mgr.setResponse("EX", "0")
    @prot.exitCommandMode ->
      done()

  it "deletes all records successfully", (done) ->
    @mgr.setExpected("da", "0")
    @mgr.setResponse("DA", "1")
    @prot.deleteAllRecords ->
      done()

  it "deletes all records unsuccessfully", (done) ->
    @mgr.setExpected("da", "0")
    @mgr.setResponse("DA", "0")
    @prot.deleteAllRecords ->
      assert.fail()
    , =>
      done()

  it "calls error on unknown command", (done) ->
    @mgr.setExpected("fw", "0")
    @mgr.setResponse("ZZ", "0")
    @prot.getUid (uid) ->
      assert.fail()
    , () ->
      done()


