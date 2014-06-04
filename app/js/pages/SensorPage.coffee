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
      { text: T("Upgrade Firmware"), id: "upgradeFirmware", click: @upgradeFirmware }
      { text: T("Delete All Records"), id: "deleteAllRecords", click: @deleteAllRecords }
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
      @displayEvent(T("Update error") + ": " + error)

    console.log "Updating stats"

    @protocol.getStatus (enabled, sampleRate) =>
      @stats.enabled = enabled
      @stats.disabled = not enabled
      @stats.sampleRate = sampleRate
      @render()
    , updateError

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
    , updateError

      # No easy way to know number to download now
      # # Create downloader to get records to download
      # downloader = new GPSLoggerDownloader(@protocol, @db.sensor_data, @address)
      # downloader.getDownloadRange (startIndex, number) =>
      #   console.log "Got download range #{startIndex} + #{number}"
      #   @stats.numberToDownload = number
      #   @stats.numberToDownloadKnown = true
      #   @render()
      # , updateError

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
      @status = T("Error connecting")
      @render()

    updateStatus = (status) =>
      @status = status
      console.log "Bluetooth status: #{status}"
      @render()

    startCommandMode = =>
      updateStatus(T("Finalizing connection..."))

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
        updateStatus(T("Connected"))
        @updateStats()

    startConnectionManager = =>
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
        @status = T("Error connecting")
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
      updateStatus(T("Connecting..."))
      opts = { address: @options.address, uuid: "00001101-0000-1000-8000-00805f9b34fb", conn: "Hax" }
      console.log "Connecting to " + JSON.stringify(opts)

      window.bluetooth.connect () =>  
        startConnectionManager()
      , connectionError, opts

    checkPairing = =>
      # Check pairing
      window.bluetooth.isPaired (paired) =>
        if paired
          return makeConnection()

        updateStatus(T("Pairing with sensor..."))
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
      address: @options.address
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
        if number > 0
          alert(T("Successfully downloaded {0} records", number))
        else
          alert(T("No new records were available to download"))

    error = (err) =>
      @downloading = false
      @render()
      @error(err)

    # NOTE: Use Bluetooth address for duid, not internal deviceUid
    downloader = new GPSLoggerDownloader(@protocol, @db.sensor_data, @address)
    downloader.on 'progress', (completed, total) =>
      @progress = completed*100/total
      @render()
    downloader.download success, error

  enableLogging: =>
    @protocol.enableLogging () =>
      @updateStats()
    , (error) =>
      alert(T("Unable to enable logging"))

  disableLogging: =>
    @protocol.disableLogging () =>
      @updateStats()
    , (error) =>
      alert(T("Unable to disable logging"))

  upgradeFirmware: =>
    if @state != "connected"
      return alert(T("Not connected"))

    if confirm(T("You will need an Ant+ connection and PC and a binary ready. This cannot be undone. Proceed?"))
      if confirm(T("Are you really sure you want to do this?"))
        @protocol.upgradeFirmware () =>
          @connected = false
          @pager.closePage()
          alert(T("Now upload new firmware, following instructions carefully"))
        , ->
          alert(T("Unable to upgrade firmware"))

  deleteAllRecords: =>
    if @state != "connected"
      return alert(T("Not connected"))
      
    if confirm(T("This will delete all records on the device. This cannot be undone. Proceed?"))
      if confirm(T("Are you really sure you want to do this?"))
        @protocol.deleteAllRecords () =>
          alert(T("All records deleted"))
          @updateStats()
        , ->
          alert(T("Unable to delete all records"))

