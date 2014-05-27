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

  displayEvent: (message) =>
    row = $("<div>" + message + "</div>")
    row.appendTo(@$("#events")).delay(3000).slideUp 200, ->
      row.remove()

  updateStats: ->
    updateError = (error) =>
      @displayEvent("Update error: " + error)

    console.log "Updating stats"

    # Get battery status
    @protocol.getBatteryVoltage (volts) =>
      @stats.batteryVoltage = volts
      @render()
    , updateError

    # Get uid
    @protocol.getUid (uid) =>
      @stats.uid = uid
      @render()
    , updateError
    
    @protocol.getStatus (recording, sampleRate) =>
      @stats.recording = recording
      @stats.sampleRate = sampleRate
      @render()
    , updateError

    @protocol.getNumberRecords (totalRecords, lowestRecord, highestRecord) =>
      @stats.totalRecords = totalRecords
      @stats.lowestRecord = lowestRecord
      @stats.highestRecord = highestRecord
      @render()
    , updateError

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
        @status = "Error in connection manager: " + JSON.stringify(error)
        @render()

      # Manage connection
      window.bluetooth.startConnectionManager(onRead, onError)

      # Create packet manager
      @packetMgr = new GPSLoggerPacketMgr(@connection)
      @protocol = new GPSLoggerProtocol(@packetMgr)

      # Listen to move events
      @protocol.on "move", (data) =>
        @displayEvent("Move: " + data)

      @connected = true
      updateStatus("Connected")

    makeConnection = () =>
      updateStatus("Connecting...")
      opts = { address: @options.address, uuid: "00001101-0000-1000-8000-00805f9b34fb", conn: "Hax" }
      console.log "Connecting to " + JSON.stringify(opts)

      window.bluetooth.connect () =>  
        startConnectionManager()
      , connectionError, opts

    # getUuids = =>
    #   updateStatus("Getting UUIDs...")
    #   window.bluetooth.getUuids (device) =>
    #     console.log "Device: " + JSON.stringify(device)
    #     makeConnection(device)
    #   , connectionError, @options.address

    checkPairing = =>
      # Check pairing
      updateStatus("Checking pairing...")
      window.bluetooth.isPaired (paired) =>
        if paired
          return makeConnection()

        updateStatus("Pairing...")
        window.bluetooth.pair makeConnection, connectionError, @options.address
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

