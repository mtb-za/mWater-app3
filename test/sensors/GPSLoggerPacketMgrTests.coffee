assert = chai.assert

MockBluetoothConnection = require './MockBluetoothConnection'
GPSLoggerPacketMgr = require '../../app/js/sensors/gpslogger/GPSLoggerPacketMgr'

describe "GPSLoggerPackets", ->
  beforeEach ->
    @conn = new MockBluetoothConnection()
    @mgr = new GPSLoggerPacketMgr(@conn)

  it "sends packet to connection", ->
    @mgr.send "gn", "1234567"
    assert.deepEqual @conn.written, "#gn00007,1234567"

  it "decodes single packet", (done) ->
    @mgr.on 'receive', (id, data) ->
      assert.equal id, "gn"
      assert.equal data, "1234567"
      done()

    @conn.mockRead "#gn00007,1234567"

  it "combines parts of packets", (done) ->
    @mgr.on 'receive', (id, data) ->
      assert.equal id, "gn"
      assert.equal data, "1234567"
      done()

    @conn.mockRead "#gn00"
    @conn.mockRead "007,1234567"

  it "ignore cr/lf", (done) ->
    @mgr.on 'receive', (id, data) ->
      assert.equal id, "gn"
      assert.equal data, "1234567"
      done()

    @conn.mockRead "#gn0000\n7,12\r34567"

  it "splits into packets", (done) ->
    packets = []
    @mgr.on 'receive', (id, data) =>
      packets.push { id: id, data: data }
      if packets.length == 2
        assert.deepEqual packets, [
          { id: "gn", data: "1234567" }
          { id: "DL", data: "1" }
        ]
        done()

    @conn.mockRead "#gn00007,1234567#DL00001,1"

  it "fires error on missing #", (done) ->
    @mgr.on 'receive', (id, data) =>
      assert.fail()

    @mgr.on 'error', =>
      done()

    @conn.mockRead "gn0000\n7,12\r34567"

  it "fires error on missing NaN length", (done) ->
    @mgr.on 'receive', (id, data) =>
      assert.fail()

    @mgr.on 'error', =>
      done()

    @conn.mockRead "#gnxyzsfdfsdfsdfsdf"


