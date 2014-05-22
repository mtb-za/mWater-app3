MockBluetoothConnection = require './MockBluetoothConnection'
GPSLoggerPacketMgr = require '../../app/js/sensors/gpslogger/GPSLoggerPacketMgr'

describe "GPSLoggerPackets", ->
  beforeEach ->
    @conn = new MockBluetoothConnection()
    @mgr = new GPSLoggerPacketMgr()

  it "sends packet to connection", ->
    @mgr.send "gn", "1234567"
    assert.deepEqual @conn.written, "#gn007,1234567"

  it "decodes single packet", (done) ->
    @mgr.on 'receive', (id, data) ->
      assert.equal id, "gn"
      assert.equal data, "1234567"
      done()

    @conn.mockRead "#gn007,1234567"

  it "combines parts of packets"
  it "ignore cr/lf"
  it "splits into packets"