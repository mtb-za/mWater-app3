# Objects that help with synchronizing with the server

# Class which repeats an operation every n ms or when called
# Puts mutex on action
# action should have (success, error) signature
exports.Repeater = class Repeater 
  constructor: (action) ->
    @action = action
    @running = false
    @inprogress = false

  start: (every) ->
    @every = every
    @running = true
    setTimeout @performRepeat, every

  stop: ->
    @running = false

  performRepeat: =>
    if not @running
      return

    success = (message) =>
      @inprogress = false
      if @running
        setTimeout @performRepeat, @every
      @lastSuccessDate = new Date()
      @lastSuccessMessage = message
      @lastError = undefined

    error = (err) =>
      @inprogress = false
      if @running
        setTimeout @performRepeat, @every
      @lastError = err

    @inprogress = true
    @action(success, error)

  perform: (success, error) ->
    success2 = (message) =>
      @inprogress = false
      @lastSuccessMessage = message
      @lastSuccessDate = new Date()
      @lastError = undefined
      success(message) if success?

    error2 = (err) =>
      @inprogress = false
      @lastError = err
      error(err) if error?

    @inprogress = true
    @action(success2, error2)

exports.Synchronizer = class Synchronizer
  constructor: (hybridDb, imageManager, sourceCodesManager) ->
    @hybridDb = hybridDb
    @imageManager = imageManager
    @sourceCodesManager = sourceCodesManager

    # Add events
    _.extend(this, Backbone.Events)

    @repeater = new Repeater(@_sync)

  start: (every) -> @repeater.start(every)
  stop: -> @repeater.stop()

  lastSuccessMessage: -> @repeater.lastSuccessMessage
  lastSuccessDate: -> @repeater.lastSuccessDate
  lastError: -> @repeater.lastError

  sync: (success, error) ->
    @repeater.perform(success, error)

  _sync: (success, error) =>
    successFinal = (message) =>
      success(message)

      # Fire event
      @trigger('success')

    errorFinal = (err) =>
      error(err)

      # Fire event
      @trigger('error')
    successHybrid = =>
      successSourceCodes = =>
        progress = =>
          # Do nothing with progress
        successImages = (numImagesRemaining) =>
          successFinal(if numImagesRemaining then "#{numImagesRemaining} images left" else "complete")
        @imageManager.upload progress, successImages, errorFinal
      @sourceCodesManager.replenishCodes 5, successSourceCodes, errorFinal
    @hybridDb.upload successHybrid, errorFinal

# Synchronizer that does nothing and always returns success
exports.DemoSynchronizer = class DemoSynchronizer
  constructor: ->
    # Add events
    _.extend(this, Backbone.Events)

  start: -> 
  stop: -> 
  sync: (success, error) ->
    success("complete")

  lastSuccessMessage: -> "complete"
  lastSuccessDate: -> new Date()
  lastError: -> undefined
