assert = chai.assert
sync = require '../app/js/sync'


describe "Repeater", ->
  beforeEach ->

  it "calls action every n milliseconds", (done) ->
    count = 0
    @repeater = new sync.Repeater (success, error) ->
      count += 1
      success()

    @repeater.start(10)
    setTimeout =>
      @repeater.stop()

      # Check count
      assert.closeTo count, 10, 3
      done()
    , 100


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

  it "stops on request", (done) ->
    count = 0
    @repeater = new sync.Repeater (success, error) =>
      count += 1
      if count == 10
        @repeater.stop()
      success()

    @repeater.start(10)
    setTimeout =>
      # Check count
      assert.equal count, 10
      done()
    , 200

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


  it "records last success date", (done) ->
    before = new Date()
    @repeater = new sync.Repeater (success, error) ->
      success()

    @repeater.start(10)
    setTimeout =>
      @repeater.stop()

      # Check date
      assert.isTrue new Date() > @repeater.lastSuccessDate
      assert.isTrue before < @repeater.lastSuccessDate
      done()
    , 100

  it "clears last error on success", (done) ->
    count = 0
    @repeater = new sync.Repeater (success, error) ->
      count += 1
      if count < 3
        error("some message")
      else
        success()

    @repeater.start(10)
    setTimeout =>
      @repeater.stop()

      # Check count
      assert.isFalse @repeater.lastError?
      done()
    , 100


