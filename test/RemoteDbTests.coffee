assert = chai.assert
RemoteDb = require "../app/js/db/RemoteDb"
db_queries = require "./db_queries"

describe 'RemoteDb', ->
  beforeEach (done) ->
    url = 'http://localhost:8080/'
    req = $.post(url + "_reset", {})
    req.fail (jqXHR, textStatus, errorThrown) =>
      throw textStatus
    req.done =>
      req = $.ajax(url + "users/test", {
        data : JSON.stringify({ email: "test@test.com", password:"xyzzy" }),
        contentType : 'application/json',
        type : 'PUT'})
      req.done (data) =>
        req = $.ajax(url + "users/test", {
        data : JSON.stringify({ password:"xyzzy" }),
        contentType : 'application/json',
        type : 'POST'})
        req.done (data) =>
          @client = data.client

          @db = new RemoteDb(url, @client)
          @db.addCollection('scratch')

          done()

  describe "passes queries", ->
    db_queries.call(this)
