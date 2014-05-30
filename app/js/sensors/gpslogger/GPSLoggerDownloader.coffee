async = require 'async'

# Implements downloader from GPS logger. Pass protocol and collection for data (db.sensor_data) to constructor and duid (Bluetooth address)
module.exports = class GPSLoggerDownloader
  constructor: (prot, col, duid) ->
    _.extend @, Backbone.Events

    @prot = prot
    @col = col
    @duid = duid

  # Download data, triggering progress events along the way
  download: (success, error) ->
    @canceled = false

    progressCompleted = 0
    progressTotal = 0

    downloadPageSet = (pageSet, callback) =>
      if @canceled
        return callback("Cancelled")
      @prot.getRecords pageSet.pageNumber, pageSet.numPages, (records) =>
        # Add duid (device uid)
        for record in records
          record.duid = @duid

        # Remove records to skip
        records.splice(0, pageSet.skip)

        # Store records
        @col.upsert records, () =>
          # Report progress
          progressCompleted += records.length
          @trigger 'progress', progressCompleted, progressTotal

          callback()
        , callback
      , error

    downloadRange = (startIndex, number) =>
      # Download 10 pages at a time
      pagesPerQuery = 10
      progressTotal = number

      # Create list of page sets to download
      pageSets = []
      startPage = Math.floor(startIndex/(11*pagesPerQuery))
      endPage = Math.floor((startIndex+number-1)/(11*pagesPerQuery))
      for i in [startPage..endPage]
        pageSet = { 
          pageNumber: i * pagesPerQuery
          numPages: Math.min(Math.ceil((startIndex+number)/11) - i * pagesPerQuery, pagesPerQuery)
          skip: Math.max(0, startIndex - i * pagesPerQuery * 11)
        }
        pageSets.push(pageSet)

      # For each page set
      async.eachSeries pageSets, downloadPageSet, (err) =>
        if err
          return error(err)
        success(number)

    @getDownloadRange(downloadRange, error)

  # Get range to download. Calls success with (startIndex, number)
  getDownloadRange: (success, error) ->
    gotHighestRecord = (highestRecord) =>
      # Get range available
      @prot.getNumberRecords (number, lowestId, nextId) =>
        startAt = lowestId

        # Determine range needed
        if highestRecord and highestRecord.rec >= startAt
          startAt = highestRecord.rec + 1

        # If nothing to do, return
        if startAt >= nextId
          return success(startAt, 0)

        # Download range (subtract lowestId since pages start at 0 regardless of record ids)
        success(startAt - lowestId, nextId - startAt)
      , error

    # Determine highest record id downloaded (wait for server to respond differently, but not long)
    @col.findOne { duid: @duid }, { sort: [['rec','desc']] }, _.debounce(_.once(gotHighestRecord), 1000), error

  cancel: ->
    @canceled = true
