async = require 'async'

# Implements actual protocol to talk to GPS logger. Pass packet manager to constructor
module.exports = class GPSLoggerProtocol
  constructor: (mgr) ->
    _.extend @, Backbone.Events
    @mgr = mgr

    # Create queue of commands
    @queue = async.queue(@worker, 1)

    # Listen for spontaneous events 
    @mgr.on 'receive', (id, data) =>
      if id == "MV"
        @trigger "move", data

  worker: (task, callback) =>
    task(callback)

  startCommandMode: (success, error, timeout=2000) ->
    @command("!", "", "CM", success, error, timeout)

  command: (cmdId, cmdData, respId, respCb, errorCb, timeout=10000) ->
    # Queue a task
    task = (callback) =>
      # True if completed, one way or another
      completed = false

      stopListening = =>
        clearTimeout timeoutId
        @mgr.off 'error', taskErrorCb
        @mgr.off 'receive', taskReceiveCb

      taskErrorCb = (error) ->
        if completed
          return

        completed = true
        stopListening()

        errorCb(error)
        callback(error)

      taskReceiveCb = (id, data) ->
        if completed
          return

        # Ignore spontaneous events
        if id == "MV"
          return

        # Ignore CM (command mode) unless listening for it
        if id == "CM" and respId != "CM"
          return

        completed = true
        stopListening()

        # Check that matches expected respId
        if id != respId
          error = "Wrong id returned: " + id
          errorCb(error)
          return callback(error)

        # Call resp callback
        respCb(data)
        callback()

      # Timeout on calls
      taskTimeout = ->
        if completed
          return

        console.log "Timeout on #{cmdId} at " + new Date().getTime()

        completed = true
        stopListening()

        error = "Command timed out"
        errorCb(error)
        return callback(error)

      timeoutId = setTimeout taskTimeout, timeout

      @mgr.on 'error', taskErrorCb
      @mgr.on 'receive', taskReceiveCb

      console.log "Starting on #{cmdId} at " + new Date().getTime()
      if cmdId != "!"
        @mgr.send cmdId, cmdData, ->
          # Success, do nothing
          return
        , taskErrorCb
      else 
        # ! command is special
        @mgr.sendStartCommandMode ->
          # Success, do nothing
          return
        , taskErrorCb

    @queue.push(task)

  getBatteryVoltage: (success, error) ->
    @command "bv", "0", "BV", (data) ->
      volts = parseFloat(data)
      success(volts)
    , error 

  getFirmwareInfo: (success, error) ->
    @command "fw", "0", "FW", (data) ->
      success(data.substr(0,16), parseInt(data.substr(16,5)), data.substr(22, 5))
    , error 

  getStatus: (success, error) ->
    @command "gs", "0", "GS", (data) ->
      success(data[0] == "0", parseInt(data.substr(2, 2)))
    , error 

  # Gets number of records: success(number, lowestId, nextId)
  getNumberRecords: (success, error) ->
    @command "fn", "0", "FN", (data) ->
      success(parseInt(data.substr(0, 8)), parseInt(data.substr(19, 8)), parseInt(data.substr(9, 8)))
    , error

  upgradeFirmware: (success, error) ->
    @command "ug", "0", "UG", (data) ->
      success()
    , error

  exitCommandMode: (success, error) ->
    @command "ex", "0", "EX", (data) ->
      success()
    , error

  gotoSleep: (success, error) ->
    @command "sl", "0", "SL", (data) ->
      success()
    , error

  enableLogging: (success, error) ->
    @command "dl", "0", "DL", (data) ->
      success()
    , error

  disableLogging: (success, error) ->
    @command "dl", "1", "DL", (data) ->
      success()
    , error

  deleteAllRecords: (success, error) ->
    @command "da", "0", "DA", (data) ->
      if data == "1"
        success()
      else
        error("Unable to delete records")
    , error, 60*1000*10 # Takes a long time

  getRecords: (startPage, numPages, success, error) ->
    # Parse coords in xxx degrees xx minutes xxxx fractions
    parseCoord = (str) ->
      val = parseInt(str.substr(0, 3))
      val += parseInt(str.substr(3)) / 10000 / 60

    # Pad with zeros
    pad = (num, size) ->
      s = "000000000" + num
      return s.substr(s.length-size)

    @command "gn", pad(startPage, 8) + "," + pad(numPages, 3), "GN", (data) ->
      if data[0] != "0"
        return error("Invalid range")

      if (data.length % 48) != 1
        return error("Invalid range")        

      # For each record
      numRecords = (data.length - 2) / 48
      records = []
      for n in [0...numRecords]
        str = data.substr(n*48 + 2, 48)

        record = {
          rec: parseInt(str.substr(0, 8))
          valid: str[8] == "1"
          ts: "20" + str.substr(33, 2) + "-" + str.substr(31, 2) + "-" + str.substr(29, 2) + "T" + str.substr(35, 2) + ":" + str.substr(37, 2) + ":" + str.substr(39, 2) + "Z"
        }        

        records.push(record)

        # Check if valid fix
        if not record.valid
          continue

        # Get latitude, etc.
        record.lat = parseCoord(str.substr(11, 9))
        record.lng = parseCoord(str.substr(20, 9))
        record.sats = parseInt(str.substr(45, 2))
        record.acc = parseFloat(str.substr(41, 4))/10

        if str[9] == "0"
          record.lat = -record.lat
        if str[10] == "0"
          record.lng = -record.lng

      success(records)
    , error
