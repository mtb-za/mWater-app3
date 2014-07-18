# Objects that help with synchronizing with the server
async = require 'async'

# Class which repeats an operation every n ms or when called
# Puts mutex on action
# action should have (success, error) signature
# Fires "success", "error"
exports.Repeater = class Repeater 
  constructor: (action) ->
    @action = action
    @running = false
    @inProgress = false

    # Add events
    _.extend(this, Backbone.Events)

  start: (every) ->
    @every = every
    @running = true
    setTimeout @_performRepeat, every

  stop: ->
    @running = false

  _performRepeat: =>
    if not @running
      return

    success = (message) =>
      @inProgress = false
      if @running
        setTimeout @_performRepeat, @every
      @lastSuccessDate = new Date()
      @lastSuccessMessage = message
      @lastError = undefined
      @trigger('success')

    error = (err) =>
      @inProgress = false
      if @running
        setTimeout @_performRepeat, @every
      @lastError = err
      @trigger('error')

    @inProgress = true
    @action(success, error)

  # Perform the action if not in progress. If in progress, does nothing without callback.
  perform: (success, error) ->
    if @inProgress
      return

    success2 = (message) =>
      @inProgress = false
      @lastSuccessMessage = message
      @lastSuccessDate = new Date()
      @lastError = undefined
      success(message) if success?
      @trigger('success')

    error2 = (err) =>
      @inProgress = false
      @lastError = err
      error(err) if error?
      @trigger('error')

    @inProgress = true
    @action(success2, error2)

# Synchronizes database, uploading upserts and removes
# Uses Repeater to run indefinitely
# Triggers "error" and sets lastError 
exports.DataSync = class DataSync extends Repeater
  constructor: (hybridDb, siteCodesManager) ->
    super(@_sync)
    @hybridDb = hybridDb
    @siteCodesManager = siteCodesManager

  _sync: (success, error) =>
    @hybridDb.upload () =>
      # Replenish offline site codes available
      @siteCodesManager.replenishCodes 50, =>
        success()
      , error      
    , (err) ->
      console.log "Failed uploading database: " + JSON.stringify(err)
      error(err)

  # Gets the number of upserts pending (calls success with number)
  numUpsertsPending: (success, error) ->
    localDb = @hybridDb.localDb

    cols = _.values(localDb.collections)
    async.map cols, (col, cb) =>
      col.pendingUpserts (upserts) =>
        cb(null, upserts.length)
      , cb
    , (err, results) =>
      if err
        return error(err)
      sum = 0
      for result in results
        sum += result
      success(sum)

exports.ImageSync = class ImageSync extends Repeater
  constructor: (imageManager) ->
    super(@_sync)
    @imageManager = imageManager

  _sync: (success, error) =>
    @imageManager.upload success, error

