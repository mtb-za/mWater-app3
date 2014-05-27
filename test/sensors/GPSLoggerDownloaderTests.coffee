assert = chai.assert
GPSLoggerProtocol = require '../../app/js/sensors/gpslogger/GPSLoggerProtocol'
GPSLoggerDownloader = require '../../app/js/sensors/gpslogger/GPSLoggerDownloader'
minimongo = require 'minimongo'

class MockGPSLoggerProtocol
  constructor: ->
    _.extend @, Backbone.Events

    @records = []
    @numberGetCalls = 0

  getRecords: (startPage, numPages, success, error) =>
    @numberGetCalls += 1

    @results = []
    lowestId = _.min(@records, (rec) -> rec.rec)
    nextId = _.max(@records, (rec) -> rec.rec) + 1

    for page in [startPage...startPage+numPages]
      index = page * 11 
      assert @records[index], "First record of page #{page} not present"

      for i in [0...11]
        index = page * 11 + i
        if @records[index]
          @results.push(_.cloneDeep(@records[index]))

    success(@results)

  # Gets number of records: success(number, lowestId, nextId)
  getNumberRecords: (success, error) ->
    number = @records.length 

    lowestId = _.min(@records, (rec) -> rec.rec)
    if lowestId 
      lowestId = lowestId.rec
    else
      lowestId = 1

    nextId = _.max(@records, (rec) -> rec.rec)
    if nextId 
      nextId = nextId.rec + 1
    else
      nextId = 1

    success(number, lowestId, nextId)
    return

stridDbFields = (docs) ->
  return _.map docs, (d) -> _.omit(d, "duid", "_id")

describe "GPSLoggerDownloader", ->
  @timeout(10000)

  beforeEach ->
    @prot = new MockGPSLoggerProtocol()
    @db = new minimongo.MemoryDb()
    @db.addCollection("sensor_data")

    @deviceUid = "1234"
    @downloader = new GPSLoggerDownloader(@prot, @db.sensor_data, @deviceUid)

  it "downloads no data", (done) ->
    @downloader.download () =>
      @db.sensor_data.find({}, { sort: ['rec']}).fetch (docs) =>
        assert.deepEqual stridDbFields(docs), @prot.records
        done()
    , assert.fail

  it "downloads one page", (done) ->
    for i in [0...11]
      @prot.records.push { rec: i + 1, lat: i }

    @downloader.download () =>
      @db.sensor_data.find({}, { sort: ['rec']}).fetch (docs) =>
        assert.deepEqual stridDbFields(docs), @prot.records
        done()
    , assert.fail    

  it "sets device uid in records", (done) ->
    for i in [0...11]
      @prot.records.push { rec: i + 1, lat: i }

    @downloader.download () =>
      @db.sensor_data.find({}, { sort: ['rec']}).fetch (docs) =>
        assert.equal docs[0].duid, @deviceUid
        done()
    , assert.fail    

  it "skips data already downloaded", (done) ->
    for i in [0...11]
      @prot.records.push { rec: i + 1, lat: i }

    existing = _.extend(@prot.records[0], { already: true })
    @db.sensor_data.upsert(existing)
      
    @downloader.download () =>
      @db.sensor_data.find({}, { sort: ['rec']}).fetch (docs) =>
        assert.deepEqual stridDbFields(docs).slice(1), @prot.records.slice(1)
        assert.deepEqual stridDbFields(docs)[0], stridDbFields([existing])[0]
        done()
    , assert.fail    

  it "gets multiple pages of data", (done) ->
    for i in [0...110]
      @prot.records.push { rec: i + 1, lat: i }

    @downloader.download () =>
      @db.sensor_data.find({}, { sort: ['rec']}).fetch (docs) =>
        assert.deepEqual stridDbFields(docs), @prot.records
        assert.equal @prot.numberGetCalls, 1
        done()
    , assert.fail    

  it "gets multiple sets of data", (done) ->
    for i in [0...111]
      @prot.records.push { rec: i + 1, lat: i }

    @downloader.download () =>
      @db.sensor_data.find({}, { sort: ['rec']}).fetch (docs) =>
        assert.deepEqual stridDbFields(docs), @prot.records
        assert.equal @prot.numberGetCalls, 2
        done()
    , assert.fail    

  it "offsets record ids correctly", (done) ->
    for i in [0...111]
      @prot.records.push { rec: i + 5, lat: i }

    @downloader.download () =>
      @db.sensor_data.find({}, { sort: ['rec']}).fetch (docs) =>
        assert.deepEqual stridDbFields(docs), @prot.records
        assert.equal @prot.numberGetCalls, 2
        done()
    , assert.fail    

  it "cancels", (done) ->
    # Set up two pages
    for i in [0...111]
      @prot.records.push { rec: i + 1, lat: i }

    oldGetRecords = @prot.getRecords
    @prot.getRecords = (startPage, numPages, success, error) =>
      if @numberGetCalls > 0
        # Wait a while before calling real function
        setTimeout ->
          oldGetRecords(startPage, numPages, success, error)
        , 1000
      else
        @downloader.cancel()
        oldGetRecords(startPage, numPages, success, error)

    @downloader.download () =>
      assert.fail()
    , =>
      # Check that only first 110 records made it
      @db.sensor_data.find({}, { sort: ['rec']}).fetch (docs) =>
        assert.deepEqual stridDbFields(docs), @prot.records.slice(0, 110)
        done()

  it "aborts on error", (done) ->
    # Set up two pages
    for i in [0...111]
      @prot.records.push { rec: i + 1, lat: i }

    callCount = 0
    @prot.getRecords = (startPage, numPages, success, error) =>
      if callCount > 0 
        assert.fail()

      callCount += 1
      error("some error")

    @downloader.download () =>
      assert.fail()
    , =>
      done()

  it "reports progress", (done) ->
    # Set up two pages
    for i in [0...111]
      @prot.records.push { rec: i + 1, lat: i }

    callCount = 0
    @downloader.on "progress", (completed, total) =>
      callCount += 1

      if callCount == 1
        assert.equal completed, 110
        assert.equal total, 111
      else if callCount == 2
        assert.equal completed, 111
        assert.equal total, 111
      else
        assert.fail()

    @downloader.download () =>
      assert.equal callCount, 2
      done()
