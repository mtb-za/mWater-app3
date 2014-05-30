Page = require "../Page"
async = require 'async'
GPSLoggerPacketMgr = require "../sensors/gpslogger/GPSLoggerPacketMgr"
GPSLoggerProtocol = require "../sensors/gpslogger/GPSLoggerProtocol"
GPSLoggerDownloader = require "../sensors/gpslogger/GPSLoggerDownloader"

# Pass in `address` to connect to
module.exports = class SensorPage extends Page
  events: 
    "click #update_status": "updateStats"
    "click #upgrade_firmware": "upgradeFirmware"
    "click #download_data": "downloadData"
    "click #connect": "connect"
    "click #enable_logging": "enableLogging"
    "click #disable_logging": "disableLogging"

  activate: ->
    @setTitle T("Sensor")

    @state = "disconnected"
    @stats = {}
    @render()
    @connect()

    # Setup menu
    menu = [
      { text: "Upgrade Firmware", id: "upgradeFirmware", click: @upgradeFirmware }
      { text: "Delete All Records", id: "deleteAllRecords", click: @deleteAllRecords }
    ]
    @setupButtonBar [
      { icon: "gear.png", menu: menu }
    ]

  deactivate: ->
    disconnectBluetooth = =>
      console.log "Disconnecting bluetooth"
      window.bluetooth.disconnect (success) =>
        console.log "Disconnect success = #{success}"
      , (error) =>
        console.log "Disconnect error = #{error}"

    # If connected, go to sleep and disconnect
    if @state == "connected"
      console.log "Disconnecting"
      @protocol.exitCommandMode () =>
        console.log "Disconnected"
        disconnectBluetooth()
      , (error) =>
        console.log "Disconnecting: " + error
        disconnectBluetooth()

  displayEvent: (message) =>
    console.log "Event: #{message}"

    row = $('<div class="alert alert-warning">' + message + "</div>")
    row.appendTo(@$("#events"))
    _.delay ->
      row.remove()
    , 5000

  updateStats: ->
    @stats.numberToDownloadKnown = false
    
    updateError = (error) =>
      @displayEvent("Update error: " + error)

    console.log "Updating stats"

    # Get battery status
    @protocol.getBatteryVoltage (volts) =>
      @stats.batteryVoltage = volts

      # Calculate percentages
      percentage = (volts - 3.7)/0.5*100
      percentage = Math.max(Math.min(Math.floor(percentage), 100), 0)
      @stats.batteryPercentage = percentage
      if percentage > 50
        state = "success"
      else if percentage > 25
        state = "warning"
      else
        state = "danger"
      @stats.batteryState = state
      @render()
    , updateError

    # Get firmware info
    @protocol.getFirmwareInfo (deviceUid, channel, version) =>
      @stats.deviceUid = deviceUid
      @stats.channel = channel
      @stats.version = version
      @render()

      # Create downloader to get records to download
      downloader = new GPSLoggerDownloader(@protocol, @db.sensor_data, deviceUid)
      downloader.getDownloadRange (startIndex, number) =>
        console.log "Got download range #{startIndex} + #{number}"
        @stats.numberToDownload = number
        @stats.numberToDownloadKnown = true
        @render()
      , updateError

    , updateError
    
    @protocol.getStatus (enabled, sampleRate) =>
      @stats.enabled = enabled
      @stats.sampleRate = sampleRate
      @render()
    , updateError

    @protocol.getNumberRecords (totalRecords, lowestRecord, highestRecord) =>
      @stats.totalRecords = totalRecords
      @stats.lowestRecord = lowestRecord
      @stats.highestRecord = highestRecord

      # Calculate memory data
      percentage = Math.ceil(totalRecords * 100 / (65536 * 11))
      @stats.memoryPercentage = percentage
      if percentage < 50
        state = "success"
      else if percentage < 75
        state = "warning"
      else
        state = "danger"
      @stats.memoryState = state

      @render()
    , updateError

  connect: ->
    @state = "connecting"

    connectionError = (error) =>
      @state = "disconnected"
      console.error "Error connecting: " + JSON.stringify(error)
      @status = "Error connecting"
      @render()

    updateStatus = (status) =>
      @status = status
      console.log "Bluetooth status: #{status}"
      @render()

    startCommandMode = =>
      updateStatus("Entering command mode...")

      async.retry 10, (callback) =>
        @protocol.startCommandMode () =>
          callback()
        , callback
      , (error) =>
        if error
          # Disconnect
          console.log "Disconnecting"
          window.bluetooth.disconnect () =>
            console.log "Disconnected"
            return connectionError(error)
          , () =>
            console.log "Disconnection failed"
            return connectionError(error)
          return

        @state = "connected"
        updateStatus("Connected")
        @updateStats()

    startConnectionManager = =>
      updateStatus("Starting connection manager...")

      @connection = {
        write: (data, success, error) ->
          window.bluetooth.write success, error, data
      }
      _.extend @connection, Backbone.Events

      onRead = (data) =>
        @connection.trigger("read", data)

      onError = (error) =>
        @state = "disconnected"
        console.error "Error in connection manager: " + JSON.stringify(error)
        @status = "Error in connection manager: " + JSON.stringify(error)
        @render()

      # Manage connection
      window.bluetooth.startConnectionManager(onRead, onError)

      # Create packet manager
      @packetMgr = new GPSLoggerPacketMgr(@connection)
      @protocol = new GPSLoggerProtocol(@packetMgr)

      # # Listen to move events # TODO REMOVE
      # @protocol.on "move", (data) =>
      #   @displayEvent("Move: " + data)

      startCommandMode()

    makeConnection = () =>
      updateStatus("Connecting...")
      opts = { address: @options.address, uuid: "00001101-0000-1000-8000-00805f9b34fb", conn: "Hax" }
      console.log "Connecting to " + JSON.stringify(opts)

      window.bluetooth.connect () =>  
        startConnectionManager()
      , connectionError, opts

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
      connected: @state =="connected"
      connecting: @state =="connecting"
      disconnected: @state =="disconnected"
      stats: @stats
      downloading: @downloading
      progress: @progress
    }

    @$el.html require('./SensorPage.hbs')(data)

  downloadData: ->
    @downloading = true
    @progress = 0
    @render()

    success = (number) =>
      @downloading = false
      @render()
      @updateStats()
      _.defer ->
        alert("Successfully downloaded #{number} records")

    error = (err) =>
      @downloading = false
      @render()
      @error(err)

    # Get deviceUid
    @protocol.getFirmwareInfo (deviceUid, channel, version) =>
      # Create downloader
      downloader = new GPSLoggerDownloader(@protocol, @db.sensor_data, deviceUid)
      downloader.on 'progress', (completed, total) =>
        @progress = completed*100/total
        @render()
      downloader.download success, error
    , @error

  enableLogging: =>
    @protocol.enableLogging () =>
      @updateStats()
    , (error) =>
      alert("Unable to enable logging")

  disableLogging: =>
    @protocol.disableLogging () =>
      @updateStats()
    , (error) =>
      alert("Unable to disable logging")

  upgradeFirmware: =>
    if @state != "connected"
      return alert("Not connected")

    if confirm("You will need an Ant+ connection and PC and a binary ready. This cannot be undone. Proceed?")
      if confirm("Are you really sure you want to do this?")
        @protocol.upgradeFirmware () =>
          @connected = false
          @pager.closePage()
          alert("Now upload new firmware, following instructions carefully")
        , ->
          alert("Unable to upgrade firmware")

  deleteAllRecords: =>
    if @state != "connected"
      return alert("Not connected")
      
    if confirm("This will delete all records on the device. This cannot be undone. Proceed?")
      if confirm("Are you really sure you want to do this?")
        @protocol.deleteAllRecords () =>
          alert("All records deleted")
          @updateStats()
        , ->
          alert("Unable to delete all records")

