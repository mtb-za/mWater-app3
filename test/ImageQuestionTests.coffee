assert = chai.assert
forms = require('forms')
UIDriver = require './helpers/UIDriver'
ImagePage = require '../app/js/pages/ImagePage'

class MockImageManager 
  getImageThumbnailUrl: (imageUid, success, error) ->
    success "images/" + imageUid + ".jpg"

  getImageUrl: (imageUid, success, error) ->
    success "images/" + imageUid + ".jpg"

class MockCamera
  takePicture: (success, error) ->
    success("http://1234.jpg")

describe 'ImageQuestion', ->
  beforeEach ->
    # Create model
    @model = new Backbone.Model 

  context 'With a no camera', ->
    beforeEach ->
      # Create context
      @ctx = {
        imageManager: new MockImageManager()
      }

      @question = new forms.ImageQuestion
        model: @model
        id: "q1"
        ctx: @ctx

    it 'displays no image', ->
      assert.isTrue true

    it 'displays one image', ->
      @model.set(q1: {id: "1234"})
      assert.equal @question.$("img.thumbnail").attr("src"), "images/1234.jpg"

    it 'opens page', ->
      @model.set(q1: {id: "1234"})
      spy = sinon.spy()
      @ctx.pager = { openPage: spy }
      @question.$("img.thumbnail").click()

      assert.isTrue spy.calledOnce
      assert.isTrue spy.calledWith(ImagePage, { id: "1234"})

    it 'displays no add', ->
      assert.equal @question.$("img#add").length, 0

  context 'With a camera', ->
    beforeEach ->
      # Create context
      @ctx = {
        imageManager: new MockImageManager()
        camera: new MockCamera()
      }

      @question = new forms.ImageQuestion
        model: @model
        id: "q1"
        ctx: @ctx

    it 'displays no add if image manager has no addImage', ->
      assert.equal @question.$("img#add").length, 0

  context 'With a camera and imageManager with addImage', ->
    beforeEach ->
      imageManager = new MockImageManager()
      imageManager.addImage = (url, success, error) ->
        assert.equal url, "http://1234.jpg"
        success "1234"

      # Create context
      @ctx = {
        imageManager: imageManager
        camera: new MockCamera()
      }

      @question = new forms.ImageQuestion
        model: @model
        id: "q1"
        ctx: @ctx

    it 'takes a photo', ->
      @ctx.camera = new MockCamera()
      @question.$("img#add").click()
      assert.isTrue _.isEqual(@model.get("q1"), {id:"1234"}), @model.get("q1")

    it 'no longer has add after taking photo', ->
      @ctx.camera = new MockCamera()
      @question.$("img#add").click()
      assert.equal @question.$("img#add").length, 0

    