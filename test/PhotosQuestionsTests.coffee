assert = chai.assert
PhotosQuestion = require('forms').PhotosQuestion
UIDriver = require './helpers/UIDriver'
ImagePage = require '../app/js/pages/ImagePage'

class MockImageManager 
  getImageThumbnailUrl: (imageUid, success, error) ->
    success "images/" + imageUid + ".jpg"

  getImageUrl = (imageUid, success, error) ->
    success "images/" + imageUid + ".jpg"

describe 'PhotosQuestion', ->
  context 'With a single image', ->
    beforeEach ->
      # Create model
      @model = new Backbone.Model 

      # Create context
      @ctx = {
        imageManager: new MockImageManager()
      }

      @question = new PhotosQuestion
        model: @model
        id: "q1"
        ctx: @ctx

    it 'displays no image', ->
      @model.set(q1: [])
      assert.isTrue true

    it 'displays one image', ->
      @model.set(q1: [{id: "1234"}])
      assert.equal @question.$("img.thumbnail").attr("src"), "images/1234.jpg"

    it 'opens page', ->
      @model.set(q1: [{id: "1234"}])
      spy = sinon.spy()
      @ctx.pager = { openPage: spy }
      @question.$("img.thumbnail").click()

      assert.isTrue spy.calledOnce
      assert.isTrue spy.calledWith(ImagePage, { id: "1234"})
    