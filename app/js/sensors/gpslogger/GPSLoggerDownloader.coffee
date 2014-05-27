async = require 'async'

# Implements downloader from GPS logger. Pass protocol and collection for data (db.sensor_data) to constructor and device uid (device uid, not _id of sensors table)
module.exports = class GPSLoggerDownloader
  constructor: (prot, col, deviceUid) ->
    _.extend @, Backbone.Events

    @prot = prot
    @col = col
    @deviceUid = deviceUid

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
          record.duid = @deviceUid

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
      for i in [0...Math.ceil((number/11)/pagesPerQuery)]
        pageSets.push({ pageNumber: i * pagesPerQuery, numPages: Math.min(Math.ceil(number/11) - i * pagesPerQuery, pagesPerQuery) })

      # For each page set
      async.eachSeries pageSets, downloadPageSet, (err) =>
        if err
          return error(err)
        success(number)

    gotHighestRecord = (highestRecord) =>
      # Get range available
      @prot.getNumberRecords (number, lowestId, nextId) =>
        startAt = lowestId

        # Determine range needed
        if highestRecord and highestRecord.rec >= startAt
          startAt = highestRecord.rec + 1

        # If nothing to do, return
        if startAt >= nextId
          return success(0)

        # Download range (subtract lowestId since pages start at 0 regardless of record ids)
        downloadRange(startAt - lowestId, nextId - startAt)
      , error

    # Determine highest record id downloaded (wait for server to respond differently, but not long)
    @col.findOne { duid: @deviceUid }, { sort: [['rec','desc']] }, _.debounce(_.once(gotHighestRecord), 1000), error

  cancel: ->
    @canceled = true
