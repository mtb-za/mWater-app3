assert = chai.assert
GPSLoggerProtocol = require '../../app/js/sensors/gpslogger/GPSLoggerProtocol'
#GPSLoggerDownloader = require '../../app/js/sensors/gpslogger/GPSLoggerDownloader'

describe "GPSLoggerDownloader", ->
  it "determines which pages to ask for"