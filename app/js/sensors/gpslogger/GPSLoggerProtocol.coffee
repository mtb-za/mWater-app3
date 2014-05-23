async = require 'async'

# Implements actual protocol to talk to GPS logger. Pass packet manager to constructor
module.exports = class GPSLoggerProtocol
  constructor: (mgr) ->
    _.extend @, Backbone.Events
    @mgr = mgr

    # Create queue of commands
    @queue = async.queue(@worker, 1)

  worker: (task, callback) =>
    task(callback)

  command: (cmdId, cmdData, respId, respCb, errorCb) ->
    # Queue a task
    task = (callback) =>
      stopListening = =>
        @mgr.off 'error', taskErrorCb
        @mgr.off 'receive', taskReceiveCb

      taskErrorCb = (error) ->
        stopListening()
        errorCb(error)
        callback(error)

      taskReceiveCb = (id, data) ->
        stopListening()

        # Check that matches expected respId
        if id != respId
          error = "Wrong id returned: " + id
          errorCb(error)
          return callback(error)

        # Call resp callback
        respCb(data)
        callback()

      @mgr.on 'error', taskErrorCb
      @mgr.on 'receive', taskReceiveCb
      @mgr.send(cmdId, cmdData)

    @queue.push(task)

  getBatteryVoltage: (success, error) ->
    @command "bv", "", "BV", (data) ->
      volts = parseFloat(data)
      success(volts)
    , error 


