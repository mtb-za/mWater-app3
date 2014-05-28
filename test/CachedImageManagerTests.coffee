assert = chai.assert

CachedImageManager = require '../app/js/images/CachedImageManager'
FileUtils = require './helpers/FileUtils'

fail = (err) ->
  console.error err
  assert.ok(false, err)

createImage = FileUtils.createFile
readFileEntry = FileUtils.readFileEntry
requestFileSystem  = FileUtils.requestFileSystem
resolveLocalFileSystemURI = FileUtils.resolveLocalFileSystemURI

describe "CachedImageManager", ->
  beforeEach (done) ->
    # Obtain temp storage
    FileUtils.getTempFileSystem (fs) =>
      @fs = fs
      @fileTransfer = {}
      @mgr = new CachedImageManager(fs, "http://api.mwater.co/v3/", "Android/data/co.mwater.clientapp/images", "1234", @fileTransfer)
      done()
      
  context "added image", ->
    beforeEach (done) ->
      createImage @fs, "test.jpg", "test", (url) =>
        @imgUrl = url
        @mgr.addImage url, (id) =>
          @id = id
          done()
        , fail

    it "has id", ->
      assert.equal @id.length, 32

    it "removed original image", (done) ->
      resolveLocalFileSystemURI @imgUrl, fail, ->
        assert.isTrue true
        done()

    it "recalls image", (done) ->
      @mgr.getImageUrl @id, (url) =>
        # Get contents of url
        resolveLocalFileSystemURI url, (fileEntry) =>
          readFileEntry fileEntry, (data) =>
            assert.equal data, "test"
            done()
        , fail
      , fail

    it "returns numPendingImages", (done) ->
      @mgr.numPendingImages (n) =>
        assert.equal n, 1
        done()
      , fail

    it "uploads image", (done) ->
      called = false
      @fileTransfer.upload = (filePath, server, successCallback, errorCallback, options) =>
        assert.equal options.fileKey, "image"
        assert.equal server, "http://api.mwater.co/v3/images/#{this.id}?client=1234"
        called = true
        successCallback()

      @mgr.upload (num) =>
        assert.equal num, 0
        assert.isTrue called

        done()
      , fail

    it "retries on failure", (done) ->
      @fileTransfer.upload = (filePath, server, successCallback, errorCallback, options) =>
        @fileTransfer.upload = (filePath, server, successCallback, errorCallback, options) =>
          assert.equal options.fileKey, "image"
          assert.equal server, "http://api.mwater.co/v3/images/#{this.id}?client=1234"
          successCallback()
        errorCallback { http_status: 0 }

      @mgr.upload (num) =>
        assert.ok false, "Should not call success"
      , =>
        @mgr.upload (num) =>
          assert.equal num, 0, "after retry"

          done()
        , fail

    it "does not upload twice", (done) ->
      @fileTransfer.upload = (filePath, server, successCallback, errorCallback, options) =>
        successCallback()

      @mgr.upload (num) =>
        assert.equal num, 0

        @fileTransfer.upload = (filePath, server, successCallback, errorCallback, options) =>
          assert.fail()
        @mgr.upload (num) =>
          assert.equal num, 0
          done()
      , fail

    it "recalls image after upload", (done) ->
      @fileTransfer.upload = (filePath, server, successCallback, errorCallback, options) =>
        successCallback()

      @mgr.upload (num) =>
        @mgr.getImageUrl @id, (url) =>
          # Check not remote
          assert.notMatch url, /api\.mwater\.co/

          # Get contents of url
          resolveLocalFileSystemURI url, (fileEntry) =>
            readFileEntry fileEntry, (data) =>
              assert.equal data, "test"
              done()
        , fail

  it "downloads image", (done) ->
    id = "123abc"

    @fileTransfer.download = (source, target, successCallback, errorCallback) =>
      assert.equal source, "http://api.mwater.co/v3/images/#{id}?h=1280"
      createImage @fs, target, "downloaded", (url) =>
        resolveLocalFileSystemURI url, successCallback, fail

    @mgr.getImageUrl id, (url) =>
      # Check not remote
      assert.notMatch url, /api\.mwater\.co/

      # Get contents of url
      resolveLocalFileSystemURI url, (fileEntry) =>
        readFileEntry fileEntry, (data) =>
          assert.equal data, "downloaded"
          done()
    , fail

  it "caches downloaded image", (done) ->
    id = "123abc"

    @fileTransfer.download = (source, target, successCallback, errorCallback) =>
      assert.equal source, "http://api.mwater.co/v3/images/#{id}?h=1280"
      createImage @fs, target, "downloaded", (url) =>
        resolveLocalFileSystemURI url, successCallback, fail

    @mgr.getImageUrl id, (url) =>
      @fileTransfer.download = fail
      @mgr.getImageUrl id, (url2) =>
        assert.equal url, url2
        done()
    , fail

  it "downloads thumbnail", (done) ->
    id = "123abc"

    @fileTransfer.download = (source, target, successCallback, errorCallback) =>
      assert.equal source, "http://api.mwater.co/v3/images/#{id}?h=160"
      createImage @fs, target, "downloaded", (url) =>
        resolveLocalFileSystemURI url, successCallback, fail

    @mgr.getImageThumbnailUrl id, (url) =>
      # Check not remote
      assert.notMatch url, /api\.mwater\.co/

      # Get contents of url
      resolveLocalFileSystemURI url, (fileEntry) =>
        readFileEntry fileEntry, (data) =>
          assert.equal data, "downloaded"
          done()
    , fail

  it "caches downloaded thumbnail", (done) ->
    id = "123abc"

    @fileTransfer.download = (source, target, successCallback, errorCallback) =>
      assert.equal source, "http://api.mwater.co/v3/images/#{id}?h=160"
      createImage @fs, target, "downloaded", (url) =>
        resolveLocalFileSystemURI url, successCallback, fail

    @mgr.getImageThumbnailUrl id, (url) =>
      @fileTransfer.download = fail
      @mgr.getImageThumbnailUrl id, (url2) =>
        assert.equal url, url2
        done()
    , fail

  it "calls error on error downloading image", (done) ->
    @fileTransfer.download = (source, target, successCallback, errorCallback) =>
      errorCallback()

    @mgr.getImageUrl "123", fail, done

  it "removes partial download on error", (done) ->
    @fileTransfer.download = (source, target, successCallback, errorCallback) =>
      # Create file and fail
      @target = target
      createImage @fs, target, "text", =>
        errorCallback("some fake error")
      , fail

    @mgr.getImageUrl "123", fail, =>
      # Check that file is gone
      resolveLocalFileSystemURI @target, =>
        assert.ok(false, "File should be gone")
      , =>
        done()

