assert = chai.assert
SourceCSV = require "../app/js/conversion/SourceCSV"

describe "SourceCSV import", ->
  before ->
    @sourceCSV = new SourceCSV()

  it "parses name/desc", ->
    sources = @sourceCSV.import('name,desc\n"a","b"\nc,d')
    assert.deepEqual sources, [{name:"a", desc:"b"}, {name:"c", desc:"d"}]

  it "allows blank type", ->
    sourceCSV = new SourceCSV(["x", "y"])
    sources = sourceCSV.import('name,type\n"a",')
    assert.deepEqual sources, [{name:"a"}]

  it "checks valid types", ->
    sourceCSV = new SourceCSV(["x", "y"])

    sources = sourceCSV.import('name,type\n"a","y",')
    assert.deepEqual sources, [{name:"a", type:"y"}]

    assert.throws ->
      sourceCSV.import('name,type\n"a","z"')

  it "converts latitude and longitude", ->
    sources = @sourceCSV.import('latitude,longitude\n"2",3')
    assert.deepEqual sources, [{geo: {"type":"Point", coordinates: [3,2]}}]

  it "accepts blank latitude and longitude", ->
    sources = @sourceCSV.import('latitude,longitude\n"",""')
    assert.deepEqual sources, [{}]

  it "moves unknown fields to custom", ->
    sources = @sourceCSV.import('x,y\n"a","2b"')
    assert.deepEqual sources, [{custom:{x:"a", y:"2b"}}]

  # TODO should check if all values are numbers
  # it "converts custom fields to numbers if possible", ->
  #   sources = @sourceCSV.import('x,y\n"a","3"')
  #   assert.deepEqual sources, [{custom:{x:"a", y:3}}]

  it "sets private true when true", ->
    sources = @sourceCSV.import('private\n""\n"true"\n"false"')
    assert.deepEqual sources, [{}, {private:true}, {}]

  it "strips _id", ->
    sources = @sourceCSV.import('_id\n1234')
    assert.deepEqual sources, [{}]
