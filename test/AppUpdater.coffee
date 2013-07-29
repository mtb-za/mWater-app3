assert = chai.assert

AppUpdater = require '../app/js/AppUpdater'
FileUtils = require './helpers/FileUtils'

fail = (err) ->
  console.error err
  assert.fail()

createImage = FileUtils.createFile
readFileEntry = FileUtils.readFileEntry
requestFileSystem  = FileUtils.requestFileSystem
resolveLocalFileSystemURI = FileUtils.resolveLocalFileSystemURI

describe "AppUpdater", ->
  beforeEach (done) ->
    # Obtain temp storage
    FileUtils.getTempFileSystem (fs) =>
      @fs = fs
      done()

  context "clean install", ->
    beforeEach ->
      @up = new AppUpdater("fixtures/AppUpdater/orig1/", "fixtures/AppUpdater/update1/", @fs, "Android/data/co.mwater.clientapp/updates")

    it "launches orig", (done) ->
      @up.launch (url) =>
        assert.equal url, "fixtures/AppUpdater/orig1/"
        done()
      , fail

    it "does not update", (done) ->
      @up.update (status) =>
        assert.equal status, "uptodate"
        done()
      , fail


  context "update available", ->
    beforeEach ->
      @up = new AppUpdater("fixtures/AppUpdater/orig1/", "fixtures/AppUpdater/update2/", @fs, "Android/data/co.mwater.clientapp/updates")

    it "launches orig", (done) ->
      @up.launch (url) =>
        assert.equal url, "fixtures/AppUpdater/orig1/"
        done()
      , fail

    it "updates successfully", (done) ->
      @up.update (status) =>
        assert.equal status, "relaunch"
        done()
      , fail

  context "updated to 2", ->
    beforeEach (done) ->
      @up = new AppUpdater("fixtures/AppUpdater/orig1/", "fixtures/AppUpdater/update2/", @fs, "Android/data/co.mwater.clientapp/updates")
      @up.update (status) =>
        assert.equal status, "relaunch"
        done()
      , fail

    it "gives different url", (done) ->
      @up.launch (url) =>
        assert.notEqual url, "fixtures/AppUpdater/orig1/"
        assert.notEqual url, "fixtures/AppUpdater/update2/"
        done()

    it "gives updated folder", (done) ->
      @up.launch (url) =>
        $.get url + "test.txt", (data) -> 
          assert.equal data, "Text2"
          $.get url + "test2.txt", (data) -> 
            assert.equal data, "Text2a"
            done()

  context "update missing", ->
    beforeEach ->
      @up = new AppUpdater("fixtures/AppUpdater/orig1/", "fixtures/AppUpdater/MISSING/", @fs, "Android/data/co.mwater.clientapp/updates")

    it "updates fail gently", (done) ->
      @up.update (status) =>
        assert.equal status, "noconnection"
        done()
      , fail

  context "update invalid after successful one", ->
    beforeEach (done) ->
      @up = new AppUpdater("fixtures/AppUpdater/orig1/", "fixtures/AppUpdater/update2/", @fs, "Android/data/co.mwater.clientapp/updates")
      @up.update (status) =>
        assert.equal status, "relaunch"
        @up = new AppUpdater("fixtures/AppUpdater/orig1/", "fixtures/AppUpdater/update_bad/", @fs, "Android/data/co.mwater.clientapp/updates")
        done()
      , fail

    it "updates fail gently", (done) ->
      @up.update (status) =>
        assert.equal status, "noconnection"
        done()
      , fail

    it "failed update did not disrupt", (done) ->
      @up.update (status) =>
        assert.equal status, "noconnection"
        @up.launch (url) =>
          $.get url + "index.html", (data) -> 
            assert.equal data, "index.html"
            done()
      , fail

    it "next update succeeds", (done) ->
      @up = new AppUpdater("fixtures/AppUpdater/orig1/", "fixtures/AppUpdater/update3/", @fs, "Android/data/co.mwater.clientapp/updates")
      @up.update (status) =>
        assert.equal status, "relaunch"
        $.get url + "test.txt", (data) -> 
          assert.equal data, "Text3"
          done()
      , fail
