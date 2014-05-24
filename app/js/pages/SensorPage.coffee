Page = require "../Page"
async = require 'async'
GPSLoggerPacketMgr = require "../sensors/gpslogger/GPSLoggerPacketMgr"
GPSLoggerProtocol = require "../sensors/gpslogger/GPSLoggerProtocol"

# Pass in `address` to connect to
module.exports = class SensorPage extends Page
  #events: 

  activate: ->
    @setTitle T("Sensor")

    @connected = false
    @stats = {}
    @render()
    @connect()

  deactivate: ->
    window.bluetooth.disconnect()

  updateStats: ->
    console.log "Updating stats"

    # Get battery status
    @protocol.getBatteryVoltage (volts) =>
      @stats.batteryVoltage = volts
      @render()
    , @error

    # Get uid
    @protocol.getUid (uid) =>
      @stats.uid = uid
      @render()
    , @error
    
    @protocol.getStatus (recording, sampleRate) =>
      @stats.recording = recording
      @stats.sampleRate = sampleRate
      @render()
    , @error

    @protocol.getNumberRecords (totalRecords, lowestRecord, highestRecord) =>
      @stats.totalRecords = totalRecords
      @stats.lowestRecord = lowestRecord
      @stats.highestRecord = highestRecord
      @render()
    , @error

  getNumberRecords: (success, error) ->
    @command "fn", "0", "FN", (data) ->
      success(parseInt(data.substr(0, 8)), parseInt(data.substr(19, 8)), parseInt(data.substr(9, 8)))
    , error

  connect: ->
    #@connecting = true
    @status = "Getting UUIDs..."
    @render()

    window.bluetooth.getUuids (device) =>
      console.log "Device: " + JSON.stringify(device)
      opts = { address: device.address, uuid: device.uuids[0], conn: "Hax" }
      console.log "Connecting to " + JSON.stringify(opts)
      @status = "Connecting to " + JSON.stringify(opts)
      @render()

      attempt = 1

      tryConnect = (cb) =>
        console.log "tryConnect attempt #{attempt}"
        window.bluetooth.connect () =>
          console.log "Connected!"
          # Success
          @status = "Connected!"
          @connected = true
          @render()

          @connection = {
            write: (data, success, error) ->
              console.log "Write called with #{data}"
              window.bluetooth.write success, error, data
          }
          _.extend @connection, Backbone.Events

          onRead = (data) =>
            console.log "Read with #{data}"
            @connection.trigger("read", data)

          onError = (error) =>
            @connected = false
            console.error "Error in connection: " + JSON.stringify(error)
            @status = "Error in connection: " + JSON.stringify(error)
            @render()

          # Manage connection
          window.bluetooth.startConnectionManager(onRead, onError)

          # Create packet manager
          @packetMgr = new GPSLoggerPacketMgr(@connection)
          @protocol = new GPSLoggerProtocol(@packetMgr)

          @updateStats()

          cb()
        , (error) =>
          console.error "Error connecting: " + JSON.stringify(error)
          @status = "Error connecting attempt #{attempt}: " + JSON.stringify(error)
          attempt += 1
          @render()
          setTimeout () ->
            cb(error)
          , 100
        , opts
      
      max = 100
      doit = =>
        if attempt > max
          return

        tryConnect (err) =>
          if not err
            return
          doit()
      doit()

      #console.log "about to async retry"
      #async.retry 100, tryConnect

    , (error) =>
      console.error "Error getting UUIDs: " + JSON.stringify(error)
      @status = "Error getting UUIDs: " + JSON.stringify(error)
      @render()
    , @options.address

  render: ->
    data = {
      status: @status
      connected: @connected
      stats: @stats
    }

    @$el.html require('./SensorPage.hbs')(data)



