Page = require "../Page"
async = require 'async'
GPSLoggerPacketMgr = require "../sensors/gpslogger/GPSLoggerPacketMgr"
GPSLoggerProtocol = require "../sensors/gpslogger/GPSLoggerProtocol"

# Pass in `address` to connect to
module.exports = class SensorPage extends Page
  events: 
    "click #update_status": "updateStats"
    "click #upgrade_firmware": "upgradeFirmware"

  activate: ->
    @setTitle T("Sensor")

    @connected = false
    @stats = {}
    @render()
    @connect()

  deactivate: ->
    disconnectBluetooth = =>
      console.log "Disconnecting bluetooth"
      window.bluetooth.disconnect (success) =>
        console.log "Disconnect success = #{success}"
      , (error) =>
        console.log "Disconnect error = #{error}"

    # If connected, exit command mode and disconnect
    if @connected
      console.log "Exiting command mode"
      @protocol.exitCommandMode () =>
        console.log "Exited command mode"
        disconnectBluetooth()
      , (error) =>
        console.log "Error exiting command mode: " + error
        disconnectBluetooth()

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
    connectionError = (error) =>
      @connected = false
      console.error "Error connecting: " + JSON.stringify(error)
      @status = "Error connecting: " + JSON.stringify(error)
      @render()

    updateStatus = (status) =>
      @status = status
      console.log "Bluetooth status: #{status}"
      @render()

    startConnectionManager = =>
      updateStatus("Starting connection manager...")

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
        console.error "Error in connection manager: " + JSON.stringify(error)
        @status = "Error in connection: " + JSON.stringify(error)
        @render()

      # Manage connection
      window.bluetooth.startConnectionManager(onRead, onError)

      # Create packet manager
      @packetMgr = new GPSLoggerPacketMgr(@connection)
      @protocol = new GPSLoggerProtocol(@packetMgr)

      @connected = true
      updateStatus("Connected")

      #@updateStats()

    makeConnection = (device) =>
      updateStatus("Connecting...")
      opts = { address: device.address, uuid: device.uuids[0], conn: "Hax" }
      console.log "Connecting to " + JSON.stringify(opts)

      window.bluetooth.connect () =>  
        updateStatus("Finalizing connection...")

        async.retry 60, (cb) =>
          setTimeout =>
            console.log "Checking isConnected"
            window.bluetooth.isConnected (connected) =>
              console.log "isConnected = #{connected}"
              if connected
                cb()
              else
                cb("Not connected")
            , (error) =>
              console.log "isConnected Error = #{error}"
              cb(error)
          , 1000
        , =>
          startConnectionManager()

        # TODO this is a hack due to delay in socket being actually connected, it seems
        #setTimeout startConnectionManager, 1000
      , connectionError, opts

    getUuids = =>
      updateStatus("Getting UUIDs...")
      window.bluetooth.getUuids (device) =>
        console.log "Device: " + JSON.stringify(device)
        makeConnection(device)
      , connectionError, @options.address

    checkPairing = =>
      # Check pairing
      updateStatus("Checking pairing...")
      window.bluetooth.isPaired (paired) =>
        if paired
          return getUuids()

        updateStatus("Pairing...")
        window.bluetooth.pair getUuids, connectionError, @options.address
      , connectionError, @options.address

    # First stop discovery
    window.bluetooth.stopDiscovery () =>
      console.log "Stopped discovery"
      checkPairing()
    , =>
      console.log "Unable to stop discovery"
      checkPairing()

  render: ->
    data = {
      status: @status
      connected: @connected
      stats: @stats
    }

    @$el.html require('./SensorPage.hbs')(data)

  upgradeFirmware: ->
    if confirm("You will need an Ant+ connection and PC and a binary ready. This cannot be undone. Proceed?")
      if confirm("Are you really sure you want to do this?")
        @protocol.upgradeFirmware =>
          @connected = false
          @pager.closePage()
          alert("Now upload new firmware, following instructions carefully")
        , 
          alert("Unable to upgrade firmware")

