assert = chai.assert
auth = require "../app/js/auth"


describe "UserAuth", ->
  context "user only", ->
    before ->
      @auth = new auth.UserAuth("someuser")

    it "does not allow source_types insert", ->
      assert.isFalse @auth.insert("source_types")

    it "does allow sources insert", ->
      assert.isTrue @auth.insert("sources")

    it "does allow sources update for user", ->
      assert.isTrue @auth.update("sources", { user: "someuser"})

    it "does allow sources updates in general", ->
      assert.isTrue @auth.update("sources")

    it "does not allow sources update for other user", ->
      assert.isFalse @auth.update("sources", { user: "xyzzy"})

  context "user and org", ->
    before ->
      @auth = new auth.UserAuth("someuser", "someorg")

    it "does not allow source_types insert", ->
      assert.isFalse @auth.insert("source_types")

    it "does allow sources insert", ->
      assert.isTrue @auth.insert("sources")

    it "does allow sources update for user", ->
      assert.isTrue @auth.update("sources", { user: "someuser"})

    it "does not allow sources update for other user with no org", ->
      assert.isFalse @auth.update("sources", { user: "xyzzy"})

    it "does allow sources update for other user with same org", ->
      assert.isTrue @auth.update("sources", { user: "xyzzy", org: "someorg"})
