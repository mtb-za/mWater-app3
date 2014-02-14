assert = chai.assert
LocalDb = require("minimongo").LocalDb
utils = require '../app/js/pages/utils'

describe 'utils', ->
  describe "changeUserOrgDocs", ->
    before ->
      @db = new LocalDb()

    beforeEach (done) ->
      @db.removeCollection('sources')
      @db.removeCollection('source_notes')
      @db.removeCollection('tests')
      @db.removeCollection('responses')
      @db.addCollection('sources')
      @db.addCollection('source_notes')
      @db.addCollection('tests')
      @db.addCollection('responses')
      @db.sources.upsert { _id: "1", a: 'apple', user: "test", org:"org1" }, =>
        @db.sources.upsert { _id: "2", a: 'banana', user: "test2", org:"org1" }, =>
          @db.sources.upsert { _id: "3", a: 'orange', user: "test", org:"org1" }, =>
            @db.tests.upsert { _id: "1", a: 'orange', user: "test", org:"org1" }, =>
              done()

    it 'updates rows', (done) ->
      utils.changeUserOrgDocs @db, 'test', 'org2', =>
        @db.sources.findOne { _id: "1" }, (doc) =>
          assert.equal doc.a, 'apple'
          assert.equal doc.user, 'test'
          assert.equal doc.org, 'org2'
          @db.sources.findOne { _id: "2" }, (doc) =>
            assert.equal doc.org, 'org1'
            @db.sources.findOne { _id: "3" }, (doc) =>
              assert.equal doc.org, 'org2'
              @db.tests.findOne { _id: "1" }, (doc) =>
                assert.equal doc.org, 'org2'
                done()
