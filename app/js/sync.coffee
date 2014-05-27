# Objects that help with synchronizing with the server

# Class which repeats an operation every n ms or when called
# Puts mutex on action
# action should have (success, error) signature
exports.Repeater = class Repeater 
  constructor: (action) ->
    @action = action
    @running = false
    @inprogress = false

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
      @inprogress = false
      if @running
        setTimeout @_performRepeat, @every
      @lastSuccessDate = new Date()
      @lastSuccessMessage = message
      @lastError = undefined
      @trigger('success')

    error = (err) =>
      @inprogress = false
      if @running
        setTimeout @_performRepeat, @every
      @lastError = err
      @trigger('error')

    @inprogress = true
    @action(success, error)

  # Perform the action if not in progress. If in progress, does nothing without callback.
  perform: (success, error) ->
    if @inprogress
      return

    success2 = (message) =>
      @inprogress = false
      @lastSuccessMessage = message
      @lastSuccessDate = new Date()
      @lastError = undefined
      success(message) if success?
      @trigger('success')

    error2 = (err) =>
      @inprogress = false
      @lastError = err
      error(err) if error?
      @trigger('error')

    @inprogress = true
    @action(success2, error2)

exports.DataSync = class DataSync extends Repeater
  constructor: (hybridDb, sourceCodesManager) ->
    super(@_sync)
    @hybridDb = hybridDb
    @sourceCodesManager = sourceCodesManager

  _sync: (success, error) =>
    @hybridDb.upload () =>
      # Replenish offline source codes available
      @sourceCodesManager.replenishCodes 50, =>
        success()
      , error      
    , error

exports.ImageSync = class ImageSync extends Repeater
  constructor: (imageManager) ->
    super(@_sync)
    @imageManager = imageManager

  _sync: (success, error) =>
    @imageManager.upload success, error

