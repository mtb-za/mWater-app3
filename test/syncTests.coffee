assert = chai.assert
sync = require '../app/js/sync'

describe "Repeater", ->
  # Too time specific
  # it "calls action every n milliseconds", (done) ->
  #   count = 0
  #   @repeater = new sync.Repeater (success, error) ->
  #     count += 1
  #     success()

  #   @repeater.start(10)
  #   setTimeout =>
  #     @repeater.stop()

  #     # Check count
  #     assert.closeTo count, 10, 6
  #     done()
  #   , 100


  it "does not call action if still in progress", (done) ->
    count = 0
    @repeater = new sync.Repeater (success, error) ->
      count += 1
      setTimeout -> 
        success()
      , 200

    @repeater.start(10)
    setTimeout =>
      @repeater.stop()

      # Check count
      assert.equal count, 1
      done()
    , 100

  it "calls action right away if called", (done) ->
    count = 0
    @repeater = new sync.Repeater (success, error) ->
      count += 1
      success()

    @repeater.perform()
    assert.equal count, 1
    done()

  # TOO TIME SPECIFIC
  # it "stops on request", (done) ->
  #   count = 0
  #   @repeater = new sync.Repeater (success, error) =>
  #     count += 1
  #     if count == 10
  #       @repeater.stop()
  #     success()

  #   @repeater.start(10)
  #   setTimeout =>
  #     # Check count
  #     assert.equal count, 10
  #     done()
  #   , 200

  it "records last error", (done) ->
    @repeater = new sync.Repeater (success, error) ->
      error("some message")

    @repeater.start(10)
    setTimeout =>
      @repeater.stop()

      # Check count
      assert.equal @repeater.lastError, "some message"
      done()
    , 100

  it "fires success event", (done) ->
    @repeater = new sync.Repeater (success, error) ->
      success()

    @repeater.on "success", ->
      done()

    @repeater.perform()

  it "fires error event", (done) ->
    @repeater = new sync.Repeater (success, error) ->
      error()

    @repeater.on "error", ->
      done()

    @repeater.perform()

  # Too time specific
  # it "records last success message and date", (done) ->
  #   before = new Date()
  #   @repeater = new sync.Repeater (success, error) ->
  #     success("some message")

  #   @repeater.start(10)
  #   setTimeout =>
  #     @repeater.stop()

  #     # Check message
  #     assert.equal @repeater.lastSuccessMessage, "some message"

  #     # Check date
  #     assert.isTrue new Date() > @repeater.lastSuccessDate
  #     assert.isTrue before < @repeater.lastSuccessDate
  #     done()
  #   , 100

  # TOO TIME SPECIFIC
  # it "clears last error on success", (done) ->
  #   count = 0
  #   @repeater = new sync.Repeater (success, error) ->
  #     count += 1
  #     if count < 3
  #       error("some message")
  #     else
  #       success()

  #   @repeater.start(10)
  #   setTimeout =>
  #     @repeater.stop()

  #     # Check count
  #     assert.isFalse @repeater.lastError?
  #     done()
  #   , 100

describe "DataSync", ->
  beforeEach ->
    @c1 = 0
    @c2 = 0

    @hybridDb = 
      upload: (success, error) => 
        @c1 += 1
        success()
    @sourceCodesManager = 
      replenishCodes: (minNumber, success, error) =>
        @c2 += 1
        success()

  it "calls all things to be synced", (done) ->
    s = new sync.DataSync(@hybridDb, @sourceCodesManager)

    success = (message) =>
      assert.isUndefined(message)
      assert.equal @c1, 1
      assert.equal @c2, 1
      done()

    error = ->
      assert.fail()

    s.perform(success, error)

  it "fires success event", (done) ->
    s = new sync.DataSync(@hybridDb, @sourceCodesManager)

    called = false

    success = () =>

    error = ->
      assert.fail()

    s.on "success", ->
      done()
    s.perform(success, error)

  it "fires error event", (done) ->
    s = new sync.DataSync(@hybridDb, @sourceCodesManager)
    @hybridDb.upload = (success, error) =>
      error("some error")

    called = false

    success = () =>
      assert.fail()

    error = ->

    s.on "success", ->
      assert.fail()
    s.on "error", ->
      done()
    s.perform(success, error)

describe "ImageSync", ->
  beforeEach ->
    @c1 = 0

    @imageManager =
      upload: (success, error) =>
        @c1 += 1
        success(3)

  it "calls all things to be synced", (done) ->
    s = new sync.ImageSync(@imageManager)

    success = (message) =>
      assert.equal message, 3
      done()

    error = ->
      assert.fail()

    s.perform(success, error)

  it "fires success event", (done) ->
    s = new sync.ImageSync(@imageManager)

    called = false

    success = () =>

    error = ->
      assert.fail()

    s.on "success", ->
      done()
    s.perform(success, error)

  it "fires error event", (done) ->
    s = new sync.ImageSync(@imageManager)
    @imageManager.upload = (success, error) =>
      error("some error")

    called = false

    success = () =>
      assert.fail()

    error = ->

    s.on "success", ->
      assert.fail()
    s.on "error", ->
      done()
    s.perform(success, error)
