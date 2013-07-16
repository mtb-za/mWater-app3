# Objects that help with synchronizing with the server

# Class which repeats an operation every n ms or when called
# Puts mutex on action
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

    success = =>
      @inprogress = false
      if @running
        setTimeout @performRepeat, @every
      @lastSuccessDate = new Date()
      @lastError = undefined

    error = (err) =>
      @inprogress = false
      if @running
        setTimeout @performRepeat, @every
      @lastError = err

    @inprogress = true
    @action(success, error)

  perform: (success, error) ->
    success2 = =>
      @inprogress = false
      @lastSuccessDate = new Date()
      @lastError = undefined
      success() if success?

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

    @repeater = new Repeater(@_sync)

  start: (every) -> @repeater.start(every)
  stop: -> @repeater.stop()

  sync: (success, error) ->
    @repeater.perform(success, error)

  _sync: (success, error) =>
    success1 = =>
      success2 = =>
        progress = =>
          # Do nothing with progress
        @imageManager.upload progress, success, error
      @sourceCodesManager.replenishCodes 5, success2, error
    @hybridDb.upload success1, error
