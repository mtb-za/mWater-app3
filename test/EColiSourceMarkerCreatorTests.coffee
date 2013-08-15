assert = chai.assert

LocalDb = require "../app/js/db/LocalDb"
SourceMarkerCreators = require '../app/js/map/SourceMarkerCreators'

grey = "#606060"
green = "#00D000"

describe "EColiSourceMarkerCreatorTests", ->
  beforeEach ->
    @db = new LocalDb()
    @db.addCollection("tests")

    @source = { _id : "1" }

    @creator = new SourceMarkerCreators.EColi()

  it "returns grey marker for no tests", (done) ->
    @creator.create @source, (result) =>
      assert.equal result.marker.fillColor, grey

  it "returns green marker for Aquagenx negative test", (done) ->
    call = 0
    @creator.create @source, (result) =>
      call = call + 1
      # Ignore initial call
      if call == 1
        return

      assert.equal result.marker.fillColor, green





	