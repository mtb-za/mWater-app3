assert = chai.assert

AppUpdater = require '../app/js/AppUpdater'
FileUtils = require './helpers/FileUtils'

fail = (err) ->
  console.error err
  assert.fail()

createFile = FileUtils.createFile
readFileEntry = FileUtils.readFileEntry
requestFileSystem  = FileUtils.requestFileSystem
resolveLocalFileSystemURI = FileUtils.resolveLocalFileSystemURI

describe "AppUpdater", ->
  @timeout(10000)
  beforeEach (done) ->
    # Obtain temp storage
    FileUtils.getTempFileSystem (fs) =>
      @fs = fs
      @fileTransfer = 
        download: (source, target, successCallback, errorCallback) =>
          $.get(source).fail(errorCallback).done (data) =>
            createFile fs, target, data, successCallback
      done()

  context "clean install", ->
    beforeEach ->
      @up = new AppUpdater(@fs, @fileTransfer, "fixtures/AppUpdater/orig1/", "fixtures/AppUpdater/update1/", "Android/data/co.mwater.clientapp/updates")

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
      @up = new AppUpdater(@fs, @fileTransfer, "fixtures/AppUpdater/orig1/", "fixtures/AppUpdater/update2/", "Android/data/co.mwater.clientapp/updates")

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
      @up = new AppUpdater(@fs, @fileTransfer, "fixtures/AppUpdater/orig1/", "fixtures/AppUpdater/update2/", "Android/data/co.mwater.clientapp/updates")
      @up.update (status) =>
        assert.equal status, "relaunch"
        done()
      , fail

    it "gives different url", (done) ->
      @up.launch (url) =>
        assert.notEqual url, "fixtures/AppUpdater/orig1/"
        assert.notEqual url, "fixtures/AppUpdater/update2/"
        done()
      , fail

    it "gives updated folder", (done) ->
      @up.launch (url) =>
        q = $.get url + "test.txt", (data) -> 
          assert.equal data, "Text2"
          q = $.get url + "test2.txt", (data) -> 
            assert.equal data, "Text2a"
            done()
          q.fail fail
        q.fail fail
      , fail

    it "does not re-update", (done) ->
      @up.update (status) =>
        assert.equal status, "uptodate"
        done()
      , fail

    it "fresh orig files trump old update", (done) ->
      @up = new AppUpdater(@fs, @fileTransfer, "fixtures/AppUpdater/orig3/", "fixtures/AppUpdater/update2/", "Android/data/co.mwater.clientapp/updates")
      @up.launch (url) =>
        assert.equal url, "fixtures/AppUpdater/orig3/"
        done()
      , fail
    
  context "update missing", ->
    beforeEach ->
      @up = new AppUpdater(@fs, @fileTransfer, "fixtures/AppUpdater/orig1/", "fixtures/AppUpdater/MISSING/", "Android/data/co.mwater.clientapp/updates")

    it "updates fail gently", (done) ->
      @up.update (status) =>
        assert.equal status, "noconnection"
        done()
      , fail

  context "update invalid after successful one", ->
    beforeEach (done) ->
      @up = new AppUpdater(@fs, @fileTransfer, "fixtures/AppUpdater/orig1/", "fixtures/AppUpdater/update2/", "Android/data/co.mwater.clientapp/updates")
      @up.update (status) =>
        assert.equal status, "relaunch"
        @up = new AppUpdater(@fs, @fileTransfer, "fixtures/AppUpdater/orig1/", "fixtures/AppUpdater/update_bad/", "Android/data/co.mwater.clientapp/updates")
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
      @up = new AppUpdater(@fs, @fileTransfer, "fixtures/AppUpdater/orig1/", "fixtures/AppUpdater/update3/", "Android/data/co.mwater.clientapp/updates")
      @up.update (status) =>
        assert.equal status, "relaunch"
        @up.launch (url) =>
          $.get url + "test.txt", (data) -> 
            assert.equal data, "Text3"
            done()
        , fail
      , fail

