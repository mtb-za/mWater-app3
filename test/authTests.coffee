assert = chai.assert
auth = require "../app/js/auth"

describe "UserAuth", ->
  before ->
    @auth = new auth.UserAuth("user1", ["group1", "group2"])

  it "does not allow site_types insert", ->
    assert.isFalse @auth.insert("site_types")

  it "does allow sites insert", ->
    assert.isTrue @auth.insert("sites")

  it "does allow sites update for admin user", ->
    assert.isTrue @auth.update "sites", {
      roles: [{ id: "user:user1", role: "admin"}]
    }

  it "does allow sites update for admin group", ->
    assert.isTrue @auth.update "sites", {
      roles: [{ id: "group:group1", role: "admin"}]
    }

  it "does not allow sites update for view user", ->
    assert.isFalse @auth.update "sites", {
      roles: [{ id: "user:user1", role: "view"}]
    }

  it "does allow responses updates in general", ->
    assert.isTrue @auth.update("responses")

  it "does allow responses update for admin user", ->
    assert.isTrue @auth.update "responses", {
      roles: [{ id: "user:user1", role: "admin"}]
    }

  it "does allow responses update for admin group", ->
    assert.isTrue @auth.update "responses", {
      roles: [{ id: "group:group1", role: "admin"}]
    }

  it "does not allow responses update for view user", ->
    assert.isFalse @auth.update "responses", {
      roles: [{ id: "user:user1", role: "view"}]
    }

  it "does allow responses updates in general", ->
    assert.isTrue @auth.update("responses")

  it "does allow tests insert", ->
    assert.isTrue @auth.insert("tests")

  it "does allow test updates for user", ->
    assert.isTrue @auth.update "tests", {
      user: "user1"
    }

  it "does not allow test updates for other user", ->
    assert.isFalse @auth.update "tests", {
      user: "user123"
    }
    
  it "does allow source_notes insert", ->
    assert.isTrue @auth.insert("source_notes")

  it "does allow source_note updates for user", ->
    assert.isTrue @auth.update "source_notes", {
      user: "user1"
    }

  it "does not allow source_note updates for other user", ->
    assert.isFalse @auth.update "source_notes", {
      user: "user123"
    }
