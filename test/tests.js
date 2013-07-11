require=(function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
(function() {
  var ProblemReporter, assert;

  assert = chai.assert;

  ProblemReporter = require('../app/js/ProblemReporter');

  describe("ProblemReporter", function() {
    before(function() {
      var getClient;
      getClient = function() {
        return "1234";
      };
      this.oldConsoleError = console.error;
      return this.pr = new ProblemReporter("http://localhost:8080/problem_reports", "1.2", getClient);
    });
    after(function() {
      this.pr.restore();
      return assert.equal(console.error, this.oldConsoleError);
    });
    return it("posts error on console.error", function() {
      var post;
      post = sinon.stub($, "post");
      console.error("Some error message");
      assert.isTrue(post.calledOnce);
      assert.equal(post.args[0][1].version, "1.2");
      assert.equal(post.args[0][1].client, "1234");
      return post.restore();
    });
  });

}).call(this);


},{"../app/js/ProblemReporter":2}],3:[function(require,module,exports){
(function() {
  var DropdownQuestion, UIDriver, assert;

  assert = chai.assert;

  DropdownQuestion = require('forms').DropdownQuestion;

  UIDriver = require('./helpers/UIDriver');

  describe('DropdownQuestion', function() {
    return context('With a few options', function() {
      beforeEach(function() {
        this.model = new Backbone.Model();
        return this.question = new DropdownQuestion({
          options: [['a', 'Apple'], ['b', 'Banana']],
          model: this.model,
          id: "q1"
        });
      });
      it('accepts known value', function() {
        this.model.set({
          q1: 'a'
        });
        assert.equal(this.model.get('q1'), 'a');
        return assert.isFalse(this.question.$("select").is(":disabled"));
      });
      it('is disabled with unknown value', function() {
        this.model.set({
          q1: 'x'
        });
        assert.equal(this.model.get('q1'), 'x');
        return assert.isTrue(this.question.$("select").is(":disabled"));
      });
      it('is not disabled with empty value', function() {
        this.model.set({
          q1: null
        });
        assert.equal(this.model.get('q1'), null);
        return assert.isFalse(this.question.$("select").is(":disabled"));
      });
      return it('is reenabled with setting value', function() {
        this.model.set({
          q1: 'x'
        });
        assert.equal(this.model.get('q1'), 'x');
        this.question.setOptions([['a', 'Apple'], ['b', 'Banana'], ['x', 'Kiwi']]);
        return assert.isFalse(this.question.$("select").is(":disabled"));
      });
    });
  });

}).call(this);


},{"forms":"EAVIrc","./helpers/UIDriver":4}],5:[function(require,module,exports){
(function() {
  var HybridDb, LocalDb, assert, db_queries, fail;

  assert = chai.assert;

  LocalDb = require("../app/js/db/LocalDb");

  HybridDb = require("../app/js/db/HybridDb");

  db_queries = require("./db_queries");

  fail = function() {
    throw new Error("failed");
  };

  describe('HybridDb', function() {
    beforeEach(function() {
      this.local = new LocalDb();
      this.remote = new LocalDb();
      this.hybrid = new HybridDb(this.local, this.remote);
      this.lc = this.local.addCollection("scratch");
      this.rc = this.remote.addCollection("scratch");
      return this.hc = this.hybrid.addCollection("scratch");
    });
    context("hybrid mode", function() {
      it("find gives only one result if data unchanged", function(done) {
        var calls;
        this.lc.seed({
          _id: "1",
          a: 1
        });
        this.lc.seed({
          _id: "2",
          a: 2
        });
        this.rc.seed({
          _id: "1",
          a: 1
        });
        this.rc.seed({
          _id: "2",
          a: 2
        });
        calls = 0;
        return this.hc.find({}).fetch(function(data) {
          calls += 1;
          assert.equal(data.length, 2);
          assert.equal(calls, 1);
          return done();
        }, fail);
      });
      it("local upserts are respected", function(done) {
        this.lc.seed({
          _id: "1",
          a: 1
        });
        this.lc.upsert({
          _id: "2",
          a: 2
        });
        this.rc.seed({
          _id: "1",
          a: 1
        });
        this.rc.seed({
          _id: "2",
          a: 4
        });
        return this.hc.findOne({
          _id: "2"
        }, function(doc) {
          assert.deepEqual(doc, {
            _id: "2",
            a: 2
          });
          return done();
        }, fail);
      });
      it("find performs full field remote queries in hybrid mode", function(done) {
        var _this = this;
        this.rc.seed({
          _id: "1",
          a: 1,
          b: 11
        });
        this.rc.seed({
          _id: "2",
          a: 2,
          b: 12
        });
        return this.hc.find({}, {
          fields: {
            b: 0
          }
        }).fetch(function(data) {
          if (data.length === 0) {
            return;
          }
          assert.isUndefined(data[0].b);
          return _this.lc.findOne({
            _id: "1"
          }, function(doc) {
            assert.equal(doc.b, 11);
            return done();
          });
        });
      });
      it("findOne performs full field remote queries in hybrid mode", function(done) {
        var _this = this;
        this.rc.seed({
          _id: "1",
          a: 1,
          b: 11
        });
        this.rc.seed({
          _id: "2",
          a: 2,
          b: 12
        });
        return this.hc.findOne({
          _id: "1"
        }, {
          fields: {
            b: 0
          }
        }, function(doc) {
          assert.isUndefined(doc.b);
          return _this.lc.findOne({
            _id: "1"
          }, function(doc) {
            assert.equal(doc.b, 11);
            return done();
          });
        });
      });
      it("find gives results twice if remote gives different answer", function(done) {
        var calls;
        this.lc.seed({
          _id: "1",
          a: 1
        });
        this.lc.seed({
          _id: "2",
          a: 2
        });
        this.rc.seed({
          _id: "1",
          a: 3
        });
        this.rc.seed({
          _id: "2",
          a: 4
        });
        calls = 0;
        return this.hc.find({}).fetch(function(data) {
          assert.equal(data.length, 2);
          calls = calls + 1;
          if (calls >= 2) {
            return done();
          }
        }, fail);
      });
      it("find gives results once if remote gives same answer with sort differences", function(done) {
        var _this = this;
        this.lc.seed({
          _id: "1",
          a: 1
        });
        this.lc.seed({
          _id: "2",
          a: 2
        });
        this.rc.find = function() {
          return {
            fetch: function(success) {
              return success([
                {
                  _id: "2",
                  a: 2
                }, {
                  _id: "1",
                  a: 1
                }
              ]);
            }
          };
        };
        return this.hc.find({}).fetch(function(data) {
          assert.equal(data.length, 2);
          return done();
        }, fail);
      });
      it("findOne gives results twice if remote gives different answer", function(done) {
        var calls;
        this.lc.seed({
          _id: "1",
          a: 1
        });
        this.lc.seed({
          _id: "2",
          a: 2
        });
        this.rc.seed({
          _id: "1",
          a: 3
        });
        this.rc.seed({
          _id: "2",
          a: 4
        });
        calls = 0;
        return this.hc.findOne({
          _id: "1"
        }, function(data) {
          calls = calls + 1;
          if (calls === 1) {
            assert.deepEqual(data, {
              _id: "1",
              a: 1
            });
          }
          if (calls >= 2) {
            assert.deepEqual(data, {
              _id: "1",
              a: 3
            });
            return done();
          }
        }, fail);
      });
      it("findOne gives results null once if remote fails", function(done) {
        var called;
        called = 0;
        this.rc.findOne = function(selector, options, success, error) {
          if (options == null) {
            options = {};
          }
          called = called + 1;
          return error(new Error("fail"));
        };
        return this.hc.findOne({
          _id: "xyz"
        }, function(data) {
          assert.equal(data, null);
          assert.equal(called, 1);
          return done();
        }, fail);
      });
      return it("caches remote data", function(done) {
        var calls,
          _this = this;
        this.lc.seed({
          _id: "1",
          a: 1
        });
        this.lc.seed({
          _id: "2",
          a: 2
        });
        this.rc.seed({
          _id: "1",
          a: 3
        });
        this.rc.seed({
          _id: "2",
          a: 2
        });
        calls = 0;
        return this.hc.find({}).fetch(function(data) {
          assert.equal(data.length, 2);
          calls = calls + 1;
          if (calls === 2) {
            return _this.lc.find({}).fetch(function(data) {
              assert.equal(data.length, 2);
              assert.deepEqual(_.pluck(data, 'a'), [3, 2]);
              return done();
            });
          }
        });
      });
    });
    context("local mode", function() {
      it("find only calls local", function(done) {
        var _this = this;
        this.lc.seed({
          _id: "1",
          a: 1
        });
        this.lc.seed({
          _id: "2",
          a: 2
        });
        this.rc.seed({
          _id: "1",
          a: 3
        });
        this.rc.seed({
          _id: "2",
          a: 4
        });
        return this.hc.find({}, {
          mode: "local"
        }).fetch(function(data) {
          assert.equal(data.length, 2);
          assert.deepEqual(_.pluck(data, 'a'), [1, 2]);
          return done();
        });
      });
      it("findOne only calls local if found", function(done) {
        var calls,
          _this = this;
        this.lc.seed({
          _id: "1",
          a: 1
        });
        this.lc.seed({
          _id: "2",
          a: 2
        });
        this.rc.seed({
          _id: "1",
          a: 3
        });
        this.rc.seed({
          _id: "2",
          a: 4
        });
        calls = 0;
        return this.hc.findOne({
          _id: "1"
        }, {
          mode: "local"
        }, function(data) {
          assert.deepEqual(data, {
            _id: "1",
            a: 1
          });
          return done();
        }, fail);
      });
      return it("findOne calls remote if not found", function(done) {
        var calls,
          _this = this;
        this.lc.seed({
          _id: "2",
          a: 2
        });
        this.rc.seed({
          _id: "1",
          a: 3
        });
        this.rc.seed({
          _id: "2",
          a: 4
        });
        calls = 0;
        return this.hc.findOne({
          _id: "1"
        }, {
          mode: "local"
        }, function(data) {
          assert.deepEqual(data, {
            _id: "1",
            a: 3
          });
          return done();
        }, fail);
      });
    });
    context("remote mode", function() {
      beforeEach(function() {
        this.lc.seed({
          _id: "1",
          a: 1
        });
        this.lc.seed({
          _id: "2",
          a: 2
        });
        this.rc.seed({
          _id: "1",
          a: 3
        });
        return this.rc.seed({
          _id: "2",
          a: 4
        });
      });
      it("find only calls remote", function(done) {
        var _this = this;
        return this.hc.find({}, {
          mode: "remote"
        }).fetch(function(data) {
          assert.deepEqual(_.pluck(data, 'a'), [3, 4]);
          return done();
        });
      });
      it("find does not cache results", function(done) {
        var _this = this;
        return this.hc.find({}, {
          mode: "remote"
        }).fetch(function(data) {
          return _this.lc.find({}).fetch(function(data) {
            assert.deepEqual(_.pluck(data, 'a'), [1, 2]);
            return done();
          });
        });
      });
      it("find falls back to local if remote fails", function(done) {
        var _this = this;
        this.rc.find = function(selector, options) {
          return {
            fetch: function(success, error) {
              return error();
            }
          };
        };
        return this.hc.find({}, {
          mode: "remote"
        }).fetch(function(data) {
          assert.deepEqual(_.pluck(data, 'a'), [1, 2]);
          return done();
        });
      });
      it("find respects local upserts", function(done) {
        var _this = this;
        this.lc.upsert({
          _id: "1",
          a: 9
        });
        return this.hc.find({}, {
          mode: "remote",
          sort: ['_id']
        }).fetch(function(data) {
          assert.deepEqual(_.pluck(data, 'a'), [9, 4]);
          return done();
        });
      });
      return it("find respects local removes", function(done) {
        var _this = this;
        this.lc.remove("1");
        return this.hc.find({}, {
          mode: "remote"
        }).fetch(function(data) {
          assert.deepEqual(_.pluck(data, 'a'), [4]);
          return done();
        });
      });
    });
    it("upload applies pending upserts and deletes", function(done) {
      var _this = this;
      this.lc.upsert({
        _id: "1",
        a: 1
      });
      this.lc.upsert({
        _id: "2",
        a: 2
      });
      return this.hybrid.upload(function() {
        return _this.lc.pendingUpserts(function(data) {
          assert.equal(data.length, 0);
          return _this.rc.pendingUpserts(function(data) {
            assert.deepEqual(_.pluck(data, 'a'), [1, 2]);
            return done();
          });
        });
      }, fail);
    });
    it("keeps upserts and deletes if failed to apply", function(done) {
      var _this = this;
      this.lc.upsert({
        _id: "1",
        a: 1
      });
      this.lc.upsert({
        _id: "2",
        a: 2
      });
      this.rc.upsert = function(doc, success, error) {
        return error(new Error("fail"));
      };
      return this.hybrid.upload(function() {
        return assert.fail();
      }, function() {
        return _this.lc.pendingUpserts(function(data) {
          assert.equal(data.length, 2);
          return done();
        });
      });
    });
    it("upserts to local db", function(done) {
      var _this = this;
      this.hc.upsert({
        _id: "1",
        a: 1
      });
      return this.lc.pendingUpserts(function(data) {
        assert.equal(data.length, 1);
        return done();
      });
    });
    return it("removes to local db", function(done) {
      var _this = this;
      this.lc.seed({
        _id: "1",
        a: 1
      });
      this.hc.remove("1");
      return this.lc.pendingRemoves(function(data) {
        assert.equal(data.length, 1);
        return done();
      });
    });
  });

}).call(this);


},{"../app/js/db/HybridDb":6,"./db_queries":7,"../app/js/db/LocalDb":8}],9:[function(require,module,exports){
(function() {
  var ImagePage, MockCamera, MockImageManager, UIDriver, assert, forms;

  assert = chai.assert;

  forms = require('forms');

  UIDriver = require('./helpers/UIDriver');

  ImagePage = require('../app/js/pages/ImagePage');

  MockImageManager = (function() {
    function MockImageManager() {}

    MockImageManager.prototype.getImageThumbnailUrl = function(imageUid, success, error) {
      return success("images/" + imageUid + ".jpg");
    };

    MockImageManager.prototype.getImageUrl = function(imageUid, success, error) {
      return success("images/" + imageUid + ".jpg");
    };

    return MockImageManager;

  })();

  MockCamera = (function() {
    function MockCamera() {}

    MockCamera.prototype.takePicture = function(success, error) {
      return success("http://1234.jpg");
    };

    return MockCamera;

  })();

  describe('ImagesQuestion', function() {
    beforeEach(function() {
      return this.model = new Backbone.Model;
    });
    context('With a no camera', function() {
      beforeEach(function() {
        this.ctx = {
          imageManager: new MockImageManager()
        };
        return this.question = new forms.ImagesQuestion({
          model: this.model,
          id: "q1",
          ctx: this.ctx
        });
      });
      it('displays no image', function() {
        this.model.set({
          q1: []
        });
        return assert.isTrue(true);
      });
      it('displays one image', function() {
        this.model.set({
          q1: [
            {
              id: "1234"
            }
          ]
        });
        return assert.equal(this.question.$("img.thumbnail-img").attr("src"), "images/1234.jpg");
      });
      it('opens page', function() {
        var spy;
        this.model.set({
          q1: [
            {
              id: "1234"
            }
          ]
        });
        spy = sinon.spy();
        this.ctx.pager = {
          openPage: spy
        };
        this.question.$("img.thumbnail-img").click();
        assert.isTrue(spy.calledOnce);
        return assert.equal(spy.args[0][1].id, "1234");
      });
      it('allows removing image', function() {
        var _this = this;
        this.model.set({
          q1: [
            {
              id: "1234"
            }
          ]
        });
        this.ctx.pager = {
          openPage: function(page, options) {
            return options.onRemove();
          }
        };
        this.question.$("img.thumbnail-img").click();
        return assert.equal(this.question.$("img#add").length, 0);
      });
      return it('displays no add', function() {
        return assert.equal(this.question.$("img#add").length, 0);
      });
    });
    context('With a camera', function() {
      beforeEach(function() {
        this.ctx = {
          imageManager: new MockImageManager(),
          camera: new MockCamera()
        };
        return this.question = new forms.ImagesQuestion({
          model: this.model,
          id: "q1",
          ctx: this.ctx
        });
      });
      return it('displays no add if image manager has no addImage', function() {
        return assert.equal(this.question.$("img#add").length, 0);
      });
    });
    return context('With a camera and imageManager with addImage', function() {
      beforeEach(function() {
        var imageManager;
        imageManager = new MockImageManager();
        imageManager.addImage = function(url, success, error) {
          assert.equal(url, "http://1234.jpg");
          return success("1234");
        };
        this.ctx = {
          imageManager: imageManager,
          camera: new MockCamera()
        };
        return this.question = new forms.ImagesQuestion({
          model: this.model,
          id: "q1",
          ctx: this.ctx
        });
      });
      return it('takes a photo', function() {
        this.ctx.camera = new MockCamera();
        this.question.$("img#add").click();
        return assert.isTrue(_.isEqual(this.model.get("q1"), [
          {
            id: "1234"
          }
        ]), this.model.get("q1"));
      });
    });
  });

}).call(this);


},{"forms":"EAVIrc","../app/js/pages/ImagePage":10,"./helpers/UIDriver":4}],11:[function(require,module,exports){
(function() {
  var LocalDb, assert, db_queries;

  assert = chai.assert;

  LocalDb = require("../app/js/db/LocalDb");

  db_queries = require("./db_queries");

  describe('LocalDb', function() {
    before(function() {
      return this.db = new LocalDb('scratch');
    });
    beforeEach(function(done) {
      this.db.removeCollection('scratch');
      this.db.addCollection('scratch');
      return done();
    });
    describe("passes queries", function() {
      return db_queries.call(this);
    });
    it('caches rows', function(done) {
      var _this = this;
      return this.db.scratch.cache([
        {
          _id: 1,
          a: 'apple'
        }
      ], {}, {}, function() {
        return _this.db.scratch.find({}).fetch(function(results) {
          assert.equal(results[0].a, 'apple');
          return done();
        });
      });
    });
    it('cache overwrite existing', function(done) {
      var _this = this;
      return this.db.scratch.cache([
        {
          _id: 1,
          a: 'apple'
        }
      ], {}, {}, function() {
        return _this.db.scratch.cache([
          {
            _id: 1,
            a: 'banana'
          }
        ], {}, {}, function() {
          return _this.db.scratch.find({}).fetch(function(results) {
            assert.equal(results[0].a, 'banana');
            return done();
          });
        });
      });
    });
    it("cache doesn't overwrite upsert", function(done) {
      var _this = this;
      return this.db.scratch.upsert({
        _id: 1,
        a: 'apple'
      }, function() {
        return _this.db.scratch.cache([
          {
            _id: 1,
            a: 'banana'
          }
        ], {}, {}, function() {
          return _this.db.scratch.find({}).fetch(function(results) {
            assert.equal(results[0].a, 'apple');
            return done();
          });
        });
      });
    });
    it("cache doesn't overwrite remove", function(done) {
      var _this = this;
      return this.db.scratch.cache([
        {
          _id: 1,
          a: 'delete'
        }
      ], {}, {}, function() {
        _this.db.scratch.remove(1, function() {});
        return _this.db.scratch.cache([
          {
            _id: 1,
            a: 'banana'
          }
        ], {}, {}, function() {
          return _this.db.scratch.find({}).fetch(function(results) {
            assert.equal(results.length, 0);
            return done();
          });
        });
      });
    });
    it("cache removes missing unsorted", function(done) {
      var _this = this;
      return this.db.scratch.cache([
        {
          _id: 1,
          a: 'a'
        }, {
          _id: 2,
          a: 'b'
        }, {
          _id: 3,
          a: 'c'
        }
      ], {}, {}, function() {
        return _this.db.scratch.cache([
          {
            _id: 1,
            a: 'a'
          }, {
            _id: 3,
            a: 'c'
          }
        ], {}, {}, function() {
          return _this.db.scratch.find({}).fetch(function(results) {
            assert.equal(results.length, 2);
            return done();
          });
        });
      });
    });
    it("cache removes missing filtered", function(done) {
      var _this = this;
      return this.db.scratch.cache([
        {
          _id: 1,
          a: 'a'
        }, {
          _id: 2,
          a: 'b'
        }, {
          _id: 3,
          a: 'c'
        }
      ], {}, {}, function() {
        return _this.db.scratch.cache([
          {
            _id: 1,
            a: 'a'
          }
        ], {
          _id: {
            $lt: 3
          }
        }, {}, function() {
          return _this.db.scratch.find({}, {
            sort: ['_id']
          }).fetch(function(results) {
            assert.deepEqual(_.pluck(results, '_id'), [1, 3]);
            return done();
          });
        });
      });
    });
    it("cache removes missing sorted limited", function(done) {
      var _this = this;
      return this.db.scratch.cache([
        {
          _id: 1,
          a: 'a'
        }, {
          _id: 2,
          a: 'b'
        }, {
          _id: 3,
          a: 'c'
        }
      ], {}, {}, function() {
        return _this.db.scratch.cache([
          {
            _id: 1,
            a: 'a'
          }
        ], {}, {
          sort: ['_id'],
          limit: 2
        }, function() {
          return _this.db.scratch.find({}, {
            sort: ['_id']
          }).fetch(function(results) {
            assert.deepEqual(_.pluck(results, '_id'), [1, 3]);
            return done();
          });
        });
      });
    });
    it("cache does not remove missing sorted limited past end", function(done) {
      var _this = this;
      return this.db.scratch.cache([
        {
          _id: 1,
          a: 'a'
        }, {
          _id: 2,
          a: 'b'
        }, {
          _id: 3,
          a: 'c'
        }, {
          _id: 4,
          a: 'd'
        }
      ], {}, {}, function() {
        return _this.db.scratch.remove(2, function() {
          return _this.db.scratch.cache([
            {
              _id: 1,
              a: 'a'
            }, {
              _id: 2,
              a: 'b'
            }
          ], {}, {
            sort: ['_id'],
            limit: 2
          }, function() {
            return _this.db.scratch.find({}, {
              sort: ['_id']
            }).fetch(function(results) {
              assert.deepEqual(_.pluck(results, '_id'), [1, 3, 4]);
              return done();
            });
          });
        });
      });
    });
    it("returns pending upserts", function(done) {
      var _this = this;
      return this.db.scratch.cache([
        {
          _id: 1,
          a: 'apple'
        }
      ], {}, {}, function() {
        return _this.db.scratch.upsert({
          _id: 2,
          a: 'banana'
        }, function() {
          return _this.db.scratch.pendingUpserts(function(results) {
            assert.equal(results.length, 1);
            assert.equal(results[0].a, 'banana');
            return done();
          });
        });
      });
    });
    it("resolves pending upserts", function(done) {
      var _this = this;
      return this.db.scratch.upsert({
        _id: 2,
        a: 'banana'
      }, function() {
        return _this.db.scratch.resolveUpsert({
          _id: 2,
          a: 'banana'
        }, function() {
          return _this.db.scratch.pendingUpserts(function(results) {
            assert.equal(results.length, 0);
            return done();
          });
        });
      });
    });
    it("retains changed pending upserts", function(done) {
      var _this = this;
      return this.db.scratch.upsert({
        _id: 2,
        a: 'banana'
      }, function() {
        return _this.db.scratch.upsert({
          _id: 2,
          a: 'banana2'
        }, function() {
          return _this.db.scratch.resolveUpsert({
            _id: 2,
            a: 'banana'
          }, function() {
            return _this.db.scratch.pendingUpserts(function(results) {
              assert.equal(results.length, 1);
              assert.equal(results[0].a, 'banana2');
              return done();
            });
          });
        });
      });
    });
    it("removes pending upserts", function(done) {
      var _this = this;
      return this.db.scratch.upsert({
        _id: 2,
        a: 'banana'
      }, function() {
        return _this.db.scratch.remove(2, function() {
          return _this.db.scratch.pendingUpserts(function(results) {
            assert.equal(results.length, 0);
            return done();
          });
        });
      });
    });
    it("returns pending removes", function(done) {
      var _this = this;
      return this.db.scratch.cache([
        {
          _id: 1,
          a: 'apple'
        }
      ], {}, {}, function() {
        return _this.db.scratch.remove(1, function() {
          return _this.db.scratch.pendingRemoves(function(results) {
            assert.equal(results.length, 1);
            assert.equal(results[0], 1);
            return done();
          });
        });
      });
    });
    it("resolves pending removes", function(done) {
      var _this = this;
      return this.db.scratch.cache([
        {
          _id: 1,
          a: 'apple'
        }
      ], {}, {}, function() {
        return _this.db.scratch.remove(1, function() {
          return _this.db.scratch.resolveRemove(1, function() {
            return _this.db.scratch.pendingRemoves(function(results) {
              assert.equal(results.length, 0);
              return done();
            });
          });
        });
      });
    });
    it("seeds", function(done) {
      var _this = this;
      return this.db.scratch.seed({
        _id: 1,
        a: 'apple'
      }, function() {
        return _this.db.scratch.find({}).fetch(function(results) {
          assert.equal(results[0].a, 'apple');
          return done();
        });
      });
    });
    it("does not overwrite existing", function(done) {
      var _this = this;
      return this.db.scratch.cache([
        {
          _id: 1,
          a: 'banana'
        }
      ], {}, {}, function() {
        return _this.db.scratch.seed({
          _id: 1,
          a: 'apple'
        }, function() {
          return _this.db.scratch.find({}).fetch(function(results) {
            assert.equal(results[0].a, 'banana');
            return done();
          });
        });
      });
    });
    return it("does not add removed", function(done) {
      var _this = this;
      return this.db.scratch.cache([
        {
          _id: 1,
          a: 'apple'
        }
      ], {}, {}, function() {
        return _this.db.scratch.remove(1, function() {
          return _this.db.scratch.seed({
            _id: 1,
            a: 'apple'
          }, function() {
            return _this.db.scratch.find({}).fetch(function(results) {
              assert.equal(results.length, 0);
              return done();
            });
          });
        });
      });
    });
  });

  describe('LocalDb with local storage', function() {
    before(function() {
      return this.db = new LocalDb('scratch', {
        namespace: "db.scratch"
      });
    });
    beforeEach(function(done) {
      this.db.removeCollection('scratch');
      this.db.addCollection('scratch');
      return done();
    });
    it("retains items", function(done) {
      var _this = this;
      return this.db.scratch.upsert({
        _id: 1,
        a: "Alice"
      }, function() {
        var db2;
        db2 = new LocalDb('scratch', {
          namespace: "db.scratch"
        });
        db2.addCollection('scratch');
        return db2.scratch.find({}).fetch(function(results) {
          assert.equal(results[0].a, "Alice");
          return done();
        });
      });
    });
    it("retains upserts", function(done) {
      var _this = this;
      return this.db.scratch.upsert({
        _id: 1,
        a: "Alice"
      }, function() {
        var db2;
        db2 = new LocalDb('scratch', {
          namespace: "db.scratch"
        });
        db2.addCollection('scratch');
        return db2.scratch.find({}).fetch(function(results) {
          return db2.scratch.pendingUpserts(function(upserts) {
            assert.deepEqual(results, upserts);
            return done();
          });
        });
      });
    });
    return it("retains removes", function(done) {
      var _this = this;
      return this.db.scratch.seed({
        _id: 1,
        a: "Alice"
      }, function() {
        return _this.db.scratch.remove(1, function() {
          var db2;
          db2 = new LocalDb('scratch', {
            namespace: "db.scratch"
          });
          db2.addCollection('scratch');
          return db2.scratch.pendingRemoves(function(removes) {
            assert.deepEqual(removes, [1]);
            return done();
          });
        });
      });
    });
  });

  describe('LocalDb without local storage', function() {
    before(function() {
      return this.db = new LocalDb('scratch');
    });
    beforeEach(function(done) {
      this.db.removeCollection('scratch');
      this.db.addCollection('scratch');
      return done();
    });
    it("does not retain items", function(done) {
      var _this = this;
      return this.db.scratch.upsert({
        _id: 1,
        a: "Alice"
      }, function() {
        var db2;
        db2 = new LocalDb('scratch');
        db2.addCollection('scratch');
        return db2.scratch.find({}).fetch(function(results) {
          assert.equal(results.length, 0);
          return done();
        });
      });
    });
    it("does not retain upserts", function(done) {
      var _this = this;
      return this.db.scratch.upsert({
        _id: 1,
        a: "Alice"
      }, function() {
        var db2;
        db2 = new LocalDb('scratch');
        db2.addCollection('scratch');
        return db2.scratch.find({}).fetch(function(results) {
          return db2.scratch.pendingUpserts(function(upserts) {
            assert.equal(results.length, 0);
            return done();
          });
        });
      });
    });
    return it("does not retain removes", function(done) {
      var _this = this;
      return this.db.scratch.seed({
        _id: 1,
        a: "Alice"
      }, function() {
        return _this.db.scratch.remove(1, function() {
          var db2;
          db2 = new LocalDb('scratch');
          db2.addCollection('scratch');
          return db2.scratch.pendingRemoves(function(removes) {
            assert.equal(removes.length, 0);
            return done();
          });
        });
      });
    });
  });

}).call(this);


},{"./db_queries":7,"../app/js/db/LocalDb":8}],12:[function(require,module,exports){
(function() {
  var LocationView, MockLocationFinder, UIDriver, assert;

  assert = chai.assert;

  LocationView = require('../app/js/LocationView');

  UIDriver = require('./helpers/UIDriver');

  MockLocationFinder = (function() {
    function MockLocationFinder() {
      _.extend(this, Backbone.Events);
    }

    MockLocationFinder.prototype.getLocation = function() {};

    MockLocationFinder.prototype.startWatch = function() {};

    MockLocationFinder.prototype.stopWatch = function() {};

    return MockLocationFinder;

  })();

  describe('LocationView', function() {
    context('With no set location', function() {
      beforeEach(function() {
        this.locationFinder = new MockLocationFinder();
        this.locationView = new LocationView({
          loc: null,
          locationFinder: this.locationFinder
        });
        return this.ui = new UIDriver(this.locationView.el);
      });
      it('displays Unspecified', function() {
        return assert.include(this.ui.text(), 'Unspecified');
      });
      it('disables map', function() {
        return assert.isTrue(this.ui.getDisabled("Map"));
      });
      it('allows setting location', function() {
        var setPos;
        this.ui.click('Set');
        setPos = null;
        this.locationView.on('locationset', function(pos) {
          return setPos = pos;
        });
        this.locationFinder.trigger('found', {
          coords: {
            latitude: 2,
            longitude: 3,
            accuracy: 10
          }
        });
        return assert.equal(setPos.coordinates[1], 2);
      });
      return it('Displays error', function() {
        var setPos;
        this.ui.click('Set');
        setPos = null;
        this.locationView.on('locationset', function(pos) {
          return setPos = pos;
        });
        this.locationFinder.trigger('error');
        assert.equal(setPos, null);
        return assert.include(this.ui.text(), 'Cannot');
      });
    });
    return context('With set location', function() {
      beforeEach(function() {
        this.locationFinder = new MockLocationFinder();
        this.locationView = new LocationView({
          loc: {
            type: "Point",
            coordinates: [10, 20]
          },
          locationFinder: this.locationFinder
        });
        return this.ui = new UIDriver(this.locationView.el);
      });
      it('displays Waiting', function() {
        return assert.include(this.ui.text(), 'Waiting');
      });
      return it('displays relative', function() {
        this.locationFinder.trigger('found', {
          coords: {
            latitude: 21,
            longitude: 10,
            accuracy: 10
          }
        });
        return assert.include(this.ui.text(), '111.2km S');
      });
    });
  });

}).call(this);


},{"../app/js/LocationView":13,"./helpers/UIDriver":4}],14:[function(require,module,exports){
(function() {
  var GeoJSON, assert;

  assert = chai.assert;

  GeoJSON = require("../app/js/GeoJSON");

  describe('GeoJSON', function() {
    it('returns a proper polygon', function() {
      var bounds, json, northEast, southWest;
      southWest = new L.LatLng(10, 20);
      northEast = new L.LatLng(13, 23);
      bounds = new L.LatLngBounds(southWest, northEast);
      json = GeoJSON.latLngBoundsToGeoJSON(bounds);
      return assert(_.isEqual(json, {
        type: "Polygon",
        coordinates: [[[20, 10], [20, 13], [23, 13], [23, 10], [20, 10]]]
      }));
    });
    it('gets relative location N', function() {
      var from, str, to;
      from = {
        type: "Point",
        coordinates: [10, 20]
      };
      to = {
        type: "Point",
        coordinates: [10, 21]
      };
      str = GeoJSON.getRelativeLocation(from, to);
      return assert.equal(str, '111.2km N');
    });
    return it('gets relative location S', function() {
      var from, str, to;
      from = {
        type: "Point",
        coordinates: [10, 20]
      };
      to = {
        type: "Point",
        coordinates: [10, 19]
      };
      str = GeoJSON.getRelativeLocation(from, to);
      return assert.equal(str, '111.2km S');
    });
  });

}).call(this);


},{"../app/js/GeoJSON":15}],16:[function(require,module,exports){
(function() {
  var assert, auth;

  assert = chai.assert;

  auth = require("../app/js/auth");

  describe("UserAuth", function() {
    context("user only", function() {
      before(function() {
        return this.auth = new auth.UserAuth("someuser");
      });
      it("does not allow source_types insert", function() {
        return assert.isFalse(this.auth.insert("source_types"));
      });
      it("does allow sources insert", function() {
        return assert.isTrue(this.auth.insert("sources"));
      });
      it("does allow sources update for user", function() {
        return assert.isTrue(this.auth.update("sources", {
          user: "someuser"
        }));
      });
      it("does allow sources updates in general", function() {
        return assert.isTrue(this.auth.update("sources"));
      });
      return it("does not allow sources update for other user", function() {
        return assert.isFalse(this.auth.update("sources", {
          user: "xyzzy"
        }));
      });
    });
    return context("user and org", function() {
      before(function() {
        return this.auth = new auth.UserAuth("someuser", "someorg");
      });
      it("does not allow source_types insert", function() {
        return assert.isFalse(this.auth.insert("source_types"));
      });
      it("does allow sources insert", function() {
        return assert.isTrue(this.auth.insert("sources"));
      });
      it("does allow sources update for user", function() {
        return assert.isTrue(this.auth.update("sources", {
          user: "someuser"
        }));
      });
      it("does not allow sources update for other user with no org", function() {
        return assert.isFalse(this.auth.update("sources", {
          user: "xyzzy"
        }));
      });
      return it("does allow sources update for other user with same org", function() {
        return assert.isTrue(this.auth.update("sources", {
          user: "xyzzy",
          org: "someorg"
        }));
      });
    });
  });

}).call(this);


},{"../app/js/auth":17}],18:[function(require,module,exports){
(function() {
  var RemoteDb, assert, db_queries;

  assert = chai.assert;

  RemoteDb = require("../app/js/db/RemoteDb");

  db_queries = require("./db_queries");

  if (false) {
    describe('RemoteDb', function() {
      beforeEach(function(done) {
        var req, url,
          _this = this;
        url = 'http://localhost:8080/v3/';
        req = $.post(url + "_reset", {});
        req.fail(function(jqXHR, textStatus, errorThrown) {
          throw textStatus;
        });
        return req.done(function() {
          req = $.ajax(url + "users/test", {
            data: JSON.stringify({
              email: "test@test.com",
              password: "xyzzy"
            }),
            contentType: 'application/json',
            type: 'PUT'
          });
          return req.done(function(data) {
            req = $.ajax(url + "users/test", {
              data: JSON.stringify({
                password: "xyzzy"
              }),
              contentType: 'application/json',
              type: 'POST'
            });
            return req.done(function(data) {
              _this.client = data.client;
              _this.db = new RemoteDb(url, _this.client);
              _this.db.addCollection('scratch');
              return done();
            });
          });
        });
      });
      return describe("passes queries", function() {
        return db_queries.call(this);
      });
    });
  }

}).call(this);


},{"../app/js/db/RemoteDb":19,"./db_queries":7}],20:[function(require,module,exports){
(function() {
  var ImagePage, MockCamera, MockImageManager, UIDriver, assert, forms;

  assert = chai.assert;

  forms = require('forms');

  UIDriver = require('./helpers/UIDriver');

  ImagePage = require('../app/js/pages/ImagePage');

  MockImageManager = (function() {
    function MockImageManager() {}

    MockImageManager.prototype.getImageThumbnailUrl = function(imageUid, success, error) {
      return success("images/" + imageUid + ".jpg");
    };

    MockImageManager.prototype.getImageUrl = function(imageUid, success, error) {
      return success("images/" + imageUid + ".jpg");
    };

    return MockImageManager;

  })();

  MockCamera = (function() {
    function MockCamera() {}

    MockCamera.prototype.takePicture = function(success, error) {
      return success("http://1234.jpg");
    };

    return MockCamera;

  })();

  describe('ImageQuestion', function() {
    beforeEach(function() {
      return this.model = new Backbone.Model;
    });
    context('With a no camera', function() {
      beforeEach(function() {
        this.ctx = {
          imageManager: new MockImageManager()
        };
        return this.question = new forms.ImageQuestion({
          model: this.model,
          id: "q1",
          ctx: this.ctx
        });
      });
      it('displays no image', function() {
        return assert.isTrue(true);
      });
      it('displays one image', function() {
        this.model.set({
          q1: {
            id: "1234"
          }
        });
        return assert.equal(this.question.$("img.thumbnail-img").attr("src"), "images/1234.jpg");
      });
      it('opens page', function() {
        var spy;
        this.model.set({
          q1: {
            id: "1234"
          }
        });
        spy = sinon.spy();
        this.ctx.pager = {
          openPage: spy
        };
        this.question.$("img.thumbnail-img").click();
        assert.isTrue(spy.calledOnce);
        return assert.equal(spy.args[0][1].id, "1234");
      });
      it('allows removing image', function() {
        var _this = this;
        this.model.set({
          q1: {
            id: "1234"
          }
        });
        this.ctx.pager = {
          openPage: function(page, options) {
            return options.onRemove();
          }
        };
        this.question.$("img.thumbnail-img").click();
        return assert.equal(this.model.get("q1"), null);
      });
      return it('displays no add', function() {
        return assert.equal(this.question.$("img#add").length, 0);
      });
    });
    context('With a camera', function() {
      beforeEach(function() {
        this.ctx = {
          imageManager: new MockImageManager(),
          camera: new MockCamera()
        };
        return this.question = new forms.ImageQuestion({
          model: this.model,
          id: "q1",
          ctx: this.ctx
        });
      });
      return it('displays no add if image manager has no addImage', function() {
        return assert.equal(this.question.$("img#add").length, 0);
      });
    });
    return context('With a camera and imageManager with addImage', function() {
      beforeEach(function() {
        var imageManager;
        imageManager = new MockImageManager();
        imageManager.addImage = function(url, success, error) {
          assert.equal(url, "http://1234.jpg");
          return success("1234");
        };
        this.ctx = {
          imageManager: imageManager,
          camera: new MockCamera()
        };
        return this.question = new forms.ImageQuestion({
          model: this.model,
          id: "q1",
          ctx: this.ctx
        });
      });
      it('takes a photo', function() {
        this.ctx.camera = new MockCamera();
        this.question.$("img#add").click();
        return assert.isTrue(_.isEqual(this.model.get("q1"), {
          id: "1234"
        }), this.model.get("q1"));
      });
      return it('no longer has add after taking photo', function() {
        this.ctx.camera = new MockCamera();
        this.question.$("img#add").click();
        return assert.equal(this.question.$("img#add").length, 0);
      });
    });
  });

}).call(this);


},{"forms":"EAVIrc","./helpers/UIDriver":4,"../app/js/pages/ImagePage":10}],7:[function(require,module,exports){
(function() {
  var GeoJSON, assert,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  assert = chai.assert;

  GeoJSON = require('../app/js/GeoJSON');

  module.exports = function() {
    var geopoint;
    context('With sample rows', function() {
      beforeEach(function(done) {
        var _this = this;
        return this.db.scratch.upsert({
          _id: "1",
          a: "Alice",
          b: 1
        }, function() {
          return _this.db.scratch.upsert({
            _id: "2",
            a: "Charlie",
            b: 2
          }, function() {
            return _this.db.scratch.upsert({
              _id: "3",
              a: "Bob",
              b: 3
            }, function() {
              return done();
            });
          });
        });
      });
      it('finds all rows', function(done) {
        var _this = this;
        return this.db.scratch.find({}).fetch(function(results) {
          assert.equal(3, results.length);
          return done();
        });
      });
      it('finds all rows with options', function(done) {
        var _this = this;
        return this.db.scratch.find({}, {}).fetch(function(results) {
          assert.equal(3, results.length);
          return done();
        });
      });
      it('filters rows by id', function(done) {
        var _this = this;
        return this.db.scratch.find({
          _id: "1"
        }).fetch(function(results) {
          assert.equal(1, results.length);
          assert.equal('Alice', results[0].a);
          return done();
        });
      });
      it('includes fields', function(done) {
        var _this = this;
        return this.db.scratch.find({
          _id: "1"
        }, {
          fields: {
            a: 1
          }
        }).fetch(function(results) {
          assert.deepEqual(results[0], {
            _id: "1",
            a: "Alice"
          });
          return done();
        });
      });
      it('excludes fields', function(done) {
        var _this = this;
        return this.db.scratch.find({
          _id: "1"
        }, {
          fields: {
            a: 0
          }
        }).fetch(function(results) {
          assert.isUndefined(results[0].a);
          assert.equal(results[0].b, 1);
          return done();
        });
      });
      it('finds one row', function(done) {
        var _this = this;
        return this.db.scratch.findOne({
          _id: "2"
        }, function(result) {
          assert.equal('Charlie', result.a);
          return done();
        });
      });
      it('removes item', function(done) {
        var _this = this;
        return this.db.scratch.remove("2", function() {
          return _this.db.scratch.find({}).fetch(function(results) {
            var result;
            assert.equal(2, results.length);
            assert(__indexOf.call((function() {
              var _i, _len, _results;
              _results = [];
              for (_i = 0, _len = results.length; _i < _len; _i++) {
                result = results[_i];
                _results.push(result._id);
              }
              return _results;
            })(), "1") >= 0);
            assert(__indexOf.call((function() {
              var _i, _len, _results;
              _results = [];
              for (_i = 0, _len = results.length; _i < _len; _i++) {
                result = results[_i];
                _results.push(result._id);
              }
              return _results;
            })(), "2") < 0);
            return done();
          });
        });
      });
      it('removes non-existent item', function(done) {
        var _this = this;
        return this.db.scratch.remove("999", function() {
          return _this.db.scratch.find({}).fetch(function(results) {
            assert.equal(3, results.length);
            return done();
          });
        });
      });
      it('sorts ascending', function(done) {
        var _this = this;
        return this.db.scratch.find({}, {
          sort: ['a']
        }).fetch(function(results) {
          assert.deepEqual(_.pluck(results, '_id'), ["1", "3", "2"]);
          return done();
        });
      });
      it('sorts descending', function(done) {
        var _this = this;
        return this.db.scratch.find({}, {
          sort: [['a', 'desc']]
        }).fetch(function(results) {
          assert.deepEqual(_.pluck(results, '_id'), ["2", "3", "1"]);
          return done();
        });
      });
      it('limits', function(done) {
        var _this = this;
        return this.db.scratch.find({}, {
          sort: ['a'],
          limit: 2
        }).fetch(function(results) {
          assert.deepEqual(_.pluck(results, '_id'), ["1", "3"]);
          return done();
        });
      });
      return it('fetches independent copies', function(done) {
        var _this = this;
        return this.db.scratch.findOne({
          _id: "2"
        }, function(result) {
          result.a = 'David';
          return _this.db.scratch.findOne({
            _id: "2"
          }, function(result) {
            assert.equal('Charlie', result.a);
            return done();
          });
        });
      });
    });
    it('adds _id to rows', function(done) {
      var _this = this;
      return this.db.scratch.upsert({
        a: 1
      }, function(item) {
        assert.property(item, '_id');
        assert.lengthOf(item._id, 32);
        return done();
      });
    });
    it('updates by id', function(done) {
      var _this = this;
      return this.db.scratch.upsert({
        _id: "1",
        a: 1
      }, function(item) {
        return _this.db.scratch.upsert({
          _id: "1",
          a: 2,
          _rev: 1
        }, function(item) {
          assert.equal(item.a, 2);
          return _this.db.scratch.find({}).fetch(function(results) {
            assert.equal(1, results.length);
            return done();
          });
        });
      });
    });
    geopoint = function(lng, lat) {
      return {
        type: 'Point',
        coordinates: [lng, lat]
      };
    };
    return context('With geolocated rows', function() {
      beforeEach(function(done) {
        var _this = this;
        return this.db.scratch.upsert({
          _id: "1",
          loc: geopoint(90, 45)
        }, function() {
          return _this.db.scratch.upsert({
            _id: "2",
            loc: geopoint(90, 46)
          }, function() {
            return _this.db.scratch.upsert({
              _id: "3",
              loc: geopoint(91, 45)
            }, function() {
              return _this.db.scratch.upsert({
                _id: "4",
                loc: geopoint(91, 46)
              }, function() {
                return done();
              });
            });
          });
        });
      });
      it('finds points near', function(done) {
        var selector,
          _this = this;
        selector = {
          loc: {
            $near: {
              $geometry: geopoint(90, 45)
            }
          }
        };
        return this.db.scratch.find(selector).fetch(function(results) {
          assert.deepEqual(_.pluck(results, '_id'), ["1", "3", "2", "4"]);
          return done();
        });
      });
      it('finds points near maxDistance', function(done) {
        var selector,
          _this = this;
        selector = {
          loc: {
            $near: {
              $geometry: geopoint(90, 45),
              $maxDistance: 111000
            }
          }
        };
        return this.db.scratch.find(selector).fetch(function(results) {
          assert.deepEqual(_.pluck(results, '_id'), ["1", "3"]);
          return done();
        });
      });
      it('finds points near maxDistance just above', function(done) {
        var selector,
          _this = this;
        selector = {
          loc: {
            $near: {
              $geometry: geopoint(90, 45),
              $maxDistance: 112000
            }
          }
        };
        return this.db.scratch.find(selector).fetch(function(results) {
          assert.deepEqual(_.pluck(results, '_id'), ["1", "3", "2"]);
          return done();
        });
      });
      it('finds points within simple box', function(done) {
        var selector,
          _this = this;
        selector = {
          loc: {
            $geoIntersects: {
              $geometry: {
                type: 'Polygon',
                coordinates: [[[89.5, 45.5], [89.5, 46.5], [90.5, 46.5], [90.5, 45.5], [89.5, 45.5]]]
              }
            }
          }
        };
        return this.db.scratch.find(selector).fetch(function(results) {
          assert.deepEqual(_.pluck(results, '_id'), ["2"]);
          return done();
        });
      });
      return it('handles undefined', function(done) {
        var selector,
          _this = this;
        selector = {
          loc: {
            $geoIntersects: {
              $geometry: {
                type: 'Polygon',
                coordinates: [[[89.5, 45.5], [89.5, 46.5], [90.5, 46.5], [90.5, 45.5], [89.5, 45.5]]]
              }
            }
          }
        };
        return this.db.scratch.upsert({
          _id: 5
        }, function() {
          return _this.db.scratch.find(selector).fetch(function(results) {
            assert.deepEqual(_.pluck(results, '_id'), ["2"]);
            return done();
          });
        });
      });
    });
  };

}).call(this);


},{"../app/js/GeoJSON":15}],21:[function(require,module,exports){
(function() {
  var ItemTracker, assert;

  assert = chai.assert;

  ItemTracker = require("../app/js/ItemTracker");

  describe('ItemTracker', function() {
    beforeEach(function() {
      return this.tracker = new ItemTracker();
    });
    it("records adds", function() {
      var adds, items, removes, _ref;
      items = [
        {
          _id: 1,
          x: 1,
          _id: 2,
          x: 2
        }
      ];
      _ref = this.tracker.update(items), adds = _ref[0], removes = _ref[1];
      assert.deepEqual(adds, items);
      return assert.deepEqual(removes, []);
    });
    it("remembers items", function() {
      var adds, items, removes, _ref, _ref1;
      items = [
        {
          _id: 1,
          x: 1
        }, {
          _id: 2,
          x: 2
        }
      ];
      _ref = this.tracker.update(items), adds = _ref[0], removes = _ref[1];
      _ref1 = this.tracker.update(items), adds = _ref1[0], removes = _ref1[1];
      assert.deepEqual(adds, []);
      return assert.deepEqual(removes, []);
    });
    it("sees removed items", function() {
      var adds, items1, items2, removes, _ref;
      items1 = [
        {
          _id: 1,
          x: 1
        }, {
          _id: 2,
          x: 2
        }
      ];
      items2 = [
        {
          _id: 1,
          x: 1
        }
      ];
      this.tracker.update(items1);
      _ref = this.tracker.update(items2), adds = _ref[0], removes = _ref[1];
      assert.deepEqual(adds, []);
      return assert.deepEqual(removes, [
        {
          _id: 2,
          x: 2
        }
      ]);
    });
    return it("sees removed changes", function() {
      var adds, items1, items2, removes, _ref;
      items1 = [
        {
          _id: 1,
          x: 1
        }, {
          _id: 2,
          x: 2
        }
      ];
      items2 = [
        {
          _id: 1,
          x: 1
        }, {
          _id: 2,
          x: 4
        }
      ];
      this.tracker.update(items1);
      _ref = this.tracker.update(items2), adds = _ref[0], removes = _ref[1];
      assert.deepEqual(adds, [
        {
          _id: 2,
          x: 4
        }
      ]);
      return assert.deepEqual(removes, [
        {
          _id: 2,
          x: 2
        }
      ]);
    });
  });

}).call(this);


},{"../app/js/ItemTracker":22}],"forms":[function(require,module,exports){
module.exports=require('EAVIrc');
},{}],"EAVIrc":[function(require,module,exports){
(function() {
  var FormView, SurveyView, WaterTestEditView, _ref, _ref1, _ref2,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    _this = this;

  exports.DateQuestion = require('./DateQuestion');

  exports.DropdownQuestion = require('./DropdownQuestion');

  exports.NumberQuestion = require('./NumberQuestion');

  exports.QuestionGroup = require('./QuestionGroup');

  exports.SaveCancelForm = require('./SaveCancelForm');

  exports.SourceQuestion = require('./SourceQuestion');

  exports.ImageQuestion = require('./ImageQuestion');

  exports.ImagesQuestion = require('./ImagesQuestion');

  exports.Instructions = require('./Instructions');

  exports.FormView = FormView = (function(_super) {
    __extends(FormView, _super);

    function FormView() {
      _ref = FormView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    FormView.prototype.initialize = function(options) {
      var content, _i, _len, _ref1,
        _this = this;
      this.contents = options.contents;
      _ref1 = options.contents;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        content = _ref1[_i];
        this.$el.append(content.el);
        this.listenTo(content, 'close', function() {
          return _this.trigger('close');
        });
        this.listenTo(content, 'complete', function() {
          return _this.trigger('complete');
        });
      }
      this.listenTo(this.model, 'change', function() {
        return _this.trigger('change');
      });
      if (options.save) {
        return this.save = options.save;
      }
    };

    FormView.prototype.load = function(data) {
      this.model.clear();
      return this.model.set(_.defaults(_.cloneDeep(data), this.options.defaults || {}));
    };

    FormView.prototype.save = function() {
      return this.model.toJSON();
    };

    return FormView;

  })(Backbone.View);

  exports.templateView = function(template) {
    return {
      el: $('<div></div>'),
      load: function(data) {
        return $(this.el).html(template(data));
      }
    };
  };

  exports.SurveyView = SurveyView = (function(_super) {
    __extends(SurveyView, _super);

    function SurveyView() {
      _ref1 = SurveyView.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    return SurveyView;

  })(FormView);

  exports.WaterTestEditView = WaterTestEditView = (function(_super) {
    __extends(WaterTestEditView, _super);

    function WaterTestEditView() {
      _ref2 = WaterTestEditView.__super__.constructor.apply(this, arguments);
      return _ref2;
    }

    WaterTestEditView.prototype.initialize = function(options) {
      WaterTestEditView.__super__.initialize.call(this, options);
      return this.$el.append($('<div>\n    <button id="close_button" type="button" class="btn margined">Save for Later</button>\n    &nbsp;\n    <button id="complete_button" type="button" class="btn btn-primary margined"><i class="icon-ok icon-white"></i> Complete</button>\n</div>'));
    };

    WaterTestEditView.prototype.events = {
      "click #close_button": "close",
      "click #complete_button": "complete"
    };

    WaterTestEditView.prototype.validate = function() {
      var items;
      items = _.filter(this.contents, function(c) {
        return c.visible && c.validate;
      });
      return !_.any(_.map(items, function(item) {
        return item.validate();
      }));
    };

    WaterTestEditView.prototype.close = function() {
      return this.trigger('close');
    };

    WaterTestEditView.prototype.complete = function() {
      if (this.validate()) {
        return this.trigger('complete');
      }
    };

    return WaterTestEditView;

  })(FormView);

  exports.instantiateView = function(viewStr, options) {
    var viewFunc;
    viewFunc = new Function("options", viewStr);
    return viewFunc(options);
  };

  _.extend(exports, require('./form-controls'));

}).call(this);


},{"./form-controls":23,"./DateQuestion":24,"./DropdownQuestion":25,"./NumberQuestion":26,"./SaveCancelForm":27,"./QuestionGroup":28,"./SourceQuestion":29,"./ImageQuestion":30,"./Instructions":31,"./ImagesQuestion":32}],2:[function(require,module,exports){
function ProblemReporter(url, version, getClient) {
    var history = [];
    var that = this;

    // IE9 hack
    if (Function.prototype.bind && console && typeof console.log == "object") {
        [
          "log","info","warn","error","assert","dir","clear","profile","profileEnd"
        ].forEach(function (method) {
            console[method] = this.bind(console[method], console);
        }, Function.prototype.call);
    }

    var _captured = {}

    function capture(func) {
        var old = console[func];
        _captured[func] = old;
        console[func] = function(arg) {
            history.push(arg);
            if (history.length > 200)
                history.splice(0, 20);
            old.call(console, arg);
        }
    }

    capture("log");
    capture("warn");
    capture("error");

    function getLog() {
        var log = "";
        _.each(history, function(item) {
            log += String(item) + "\r\n";
        });
        return log;
    }


    this.reportProblem = function(desc) {
        // Create log string
        var log = getLog();

        console.log("Reporting problem...");

        $.post(url, {
            client : getClient(),
            version : version,
            user_agent : navigator.userAgent,
            log : log,
            desc : desc
        });
    };

    // Capture error logs
    var debouncedReportProblem = _.debounce(this.reportProblem, 5000, true);

    var oldConsoleError = console.error;
    console.error = function(arg) {
        oldConsoleError(arg);

        debouncedReportProblem(arg);
    };

    // Capture window.onerror
    var oldWindowOnError = window.onerror;
    window.onerror = function(errorMsg, url, lineNumber) {
        that.reportProblem("window.onerror:" + errorMsg + ":" + url + ":" + lineNumber);
        
        // Put up alert instead of old action
        alert("Internal Error\n" + errorMsg + "\n" + url + ":" + lineNumber);
        //if (oldWindowOnError)
        //    oldWindowOnError(errorMsg, url, lineNumber);
    };

    this.restore = function() {
        _.each(_.keys(_captured), function(key) {
            console[key] = _captured[key];
        });
        window.onerror = oldWindowOnError;
    };
}

ProblemReporter.register = function(baseUrl, version, getClient) {
    if (!ProblemReporter.instances)
        ProblemReporter.instances = {}

    if (ProblemReporter.instances[baseUrl])
        return;

    new ProblemReporter(baseUrl, version, getClient);
};

module.exports = ProblemReporter;
},{}],4:[function(require,module,exports){
(function() {
  var UIDriver, assert;

  assert = chai.assert;

  UIDriver = (function() {
    function UIDriver(el) {
      this.el = $(el);
    }

    UIDriver.prototype.getDisabled = function(str) {
      var item, _i, _len, _ref;
      _ref = this.el.find("a,button");
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        item = _ref[_i];
        if ($(item).text().indexOf(str) !== -1) {
          return $(item).is(":disabled");
        }
      }
      return assert.fail(null, str, "Can't find: " + str);
    };

    UIDriver.prototype.click = function(str) {
      var item, _i, _len, _ref;
      _ref = this.el.find("a,button");
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        item = _ref[_i];
        if ($(item).text().indexOf(str) !== -1) {
          console.log("Clicking: " + $(item).text());
          $(item).trigger("click");
          return;
        }
      }
      return assert.fail(null, str, "Can't find: " + str);
    };

    UIDriver.prototype.fill = function(str, value) {
      var box, item, _i, _len, _ref, _results;
      _ref = this.el.find("label");
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        item = _ref[_i];
        if ($(item).text().indexOf(str) !== -1) {
          box = this.el.find("#" + $(item).attr('for'));
          _results.push(box.val(value));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    UIDriver.prototype.text = function() {
      return this.el.text();
    };

    UIDriver.prototype.wait = function(after) {
      return setTimeout(after, 10);
    };

    return UIDriver;

  })();

  module.exports = UIDriver;

}).call(this);


},{}],17:[function(require,module,exports){
(function() {
  var AllAuth, NoneAuth, UserAuth,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  exports.AllAuth = AllAuth = (function() {
    function AllAuth() {}

    AllAuth.prototype.insert = function(col) {
      return true;
    };

    AllAuth.prototype.update = function(col, doc) {
      return true;
    };

    AllAuth.prototype.remove = function(col, doc) {
      return true;
    };

    return AllAuth;

  })();

  exports.NoneAuth = NoneAuth = (function() {
    function NoneAuth() {}

    NoneAuth.prototype.insert = function(col) {
      return false;
    };

    NoneAuth.prototype.update = function(col, doc) {
      return false;
    };

    NoneAuth.prototype.remove = function(col, doc) {
      return false;
    };

    return NoneAuth;

  })();

  exports.UserAuth = UserAuth = (function() {
    function UserAuth(user, org) {
      this.user = user;
      this.org = org;
      this.editableCols = ['sources', 'source_notes', 'tests', 'responses'];
    }

    UserAuth.prototype.insert = function(col) {
      if (!(__indexOf.call(this.editableCols, col) >= 0)) {
        return false;
      }
      return true;
    };

    UserAuth.prototype.update = function(col, doc) {
      if (!(__indexOf.call(this.editableCols, col) >= 0)) {
        return false;
      }
      if (!doc) {
        return true;
      }
      if (doc.org && this.org) {
        return doc.user === this.user || doc.org === this.org;
      } else {
        return doc.user === this.user;
      }
    };

    UserAuth.prototype.remove = function(col, doc) {
      if (!(__indexOf.call(this.editableCols, col) >= 0)) {
        return false;
      }
      if (!doc) {
        return true;
      }
      if (doc.org && this.org) {
        return doc.user === this.user || doc.org === this.org;
      } else {
        return doc.user === this.user;
      }
    };

    return UserAuth;

  })();

}).call(this);


},{}],22:[function(require,module,exports){
(function() {
  var ItemTracker;

  ItemTracker = (function() {
    function ItemTracker() {
      this.key = '_id';
      this.items = {};
    }

    ItemTracker.prototype.update = function(items) {
      var adds, item, key, map, removes, value, _i, _j, _k, _len, _len1, _len2, _ref;
      adds = [];
      removes = [];
      for (_i = 0, _len = items.length; _i < _len; _i++) {
        item = items[_i];
        if (!_.has(this.items, item[this.key])) {
          adds.push(item);
        }
      }
      map = _.object(_.pluck(items, this.key), items);
      _ref = this.items;
      for (key in _ref) {
        value = _ref[key];
        if (!_.has(map, key)) {
          removes.push(value);
        } else if (!_.isEqual(value, map[key])) {
          adds.push(map[key]);
          removes.push(value);
        }
      }
      for (_j = 0, _len1 = removes.length; _j < _len1; _j++) {
        item = removes[_j];
        delete this.items[item[this.key]];
      }
      for (_k = 0, _len2 = adds.length; _k < _len2; _k++) {
        item = adds[_k];
        this.items[item[this.key]] = item;
      }
      return [adds, removes];
    };

    return ItemTracker;

  })();

  module.exports = ItemTracker;

}).call(this);


},{}],15:[function(require,module,exports){
(function() {
  exports.posToPoint = function(pos) {
    return {
      type: 'Point',
      coordinates: [pos.coords.longitude, pos.coords.latitude]
    };
  };

  exports.latLngBoundsToGeoJSON = function(bounds) {
    var ne, sw;
    sw = bounds.getSouthWest();
    ne = bounds.getNorthEast();
    return {
      type: 'Polygon',
      coordinates: [[[sw.lng, sw.lat], [sw.lng, ne.lat], [ne.lng, ne.lat], [ne.lng, sw.lat], [sw.lng, sw.lat]]]
    };
  };

  exports.pointInPolygon = function(point, polygon) {
    var bounds;
    if (!_.isEqual(_.first(polygon.coordinates[0]), _.last(polygon.coordinates[0]))) {
      throw new Error("First must equal last");
    }
    bounds = new L.LatLngBounds(_.map(polygon.coordinates[0], function(coord) {
      return new L.LatLng(coord[1], coord[0]);
    }));
    return bounds.contains(new L.LatLng(point.coordinates[1], point.coordinates[0]));
  };

  exports.getRelativeLocation = function(from, to) {
    var angle, compassDir, compassStrs, dist, dx, dy, x1, x2, y1, y2;
    x1 = from.coordinates[0];
    y1 = from.coordinates[1];
    x2 = to.coordinates[0];
    y2 = to.coordinates[1];
    dy = (y2 - y1) / 57.3 * 6371000;
    dx = Math.cos(y1 / 57.3) * (x2 - x1) / 57.3 * 6371000;
    dist = Math.sqrt(dx * dx + dy * dy);
    angle = 90 - (Math.atan2(dy, dx) * 57.3);
    if (angle < 0) {
      angle += 360;
    }
    if (angle > 360) {
      angle -= 360;
    }
    compassDir = (Math.floor((angle + 22.5) / 45)) % 8;
    compassStrs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    if (dist > 1000) {
      return (dist / 1000).toFixed(1) + "km " + compassStrs[compassDir];
    } else {
      return dist.toFixed(0) + "m " + compassStrs[compassDir];
    }
  };

}).call(this);


},{}],19:[function(require,module,exports){
(function() {
  var Collection, RemoteDb, createUid;

  module.exports = RemoteDb = (function() {
    function RemoteDb(url, client) {
      this.url = url;
      this.client = client;
      this.collections = {};
    }

    RemoteDb.prototype.addCollection = function(name) {
      var collection;
      collection = new Collection(name, this.url + name, this.client);
      this[name] = collection;
      return this.collections[name] = collection;
    };

    RemoteDb.prototype.removeCollection = function(name) {
      delete this[name];
      return delete this.collections[name];
    };

    return RemoteDb;

  })();

  Collection = (function() {
    function Collection(name, url, client) {
      this.name = name;
      this.url = url;
      this.client = client;
    }

    Collection.prototype.find = function(selector, options) {
      var _this = this;
      if (options == null) {
        options = {};
      }
      return {
        fetch: function(success, error) {
          var params, req;
          params = {};
          if (options.sort) {
            params.sort = JSON.stringify(options.sort);
          }
          if (options.limit) {
            params.limit = options.limit;
          }
          if (options.fields) {
            params.fields = JSON.stringify(options.fields);
          }
          params.client = _this.client;
          params.selector = JSON.stringify(selector || {});
          req = $.getJSON(_this.url, params);
          req.done(function(data, textStatus, jqXHR) {
            return success(data);
          });
          return req.fail(function(jqXHR, textStatus, errorThrown) {
            if (error) {
              return error(errorThrown);
            }
          });
        }
      };
    };

    Collection.prototype.findOne = function(selector, options, success, error) {
      var params, req, _ref,
        _this = this;
      if (options == null) {
        options = {};
      }
      if (_.isFunction(options)) {
        _ref = [{}, options, success], options = _ref[0], success = _ref[1], error = _ref[2];
      }
      params = {};
      if (options.sort) {
        params.sort = JSON.stringify(options.sort);
      }
      params.limit = 1;
      params.client = this.client;
      params.selector = JSON.stringify(selector || {});
      req = $.getJSON(this.url, params);
      req.done(function(data, textStatus, jqXHR) {
        return success(data[0] || null);
      });
      return req.fail(function(jqXHR, textStatus, errorThrown) {
        if (error) {
          return error(errorThrown);
        }
      });
    };

    Collection.prototype.upsert = function(doc, success, error) {
      var req,
        _this = this;
      if (!doc._id) {
        doc._id = createUid();
      }
      req = $.ajax(this.url + "?client=" + this.client, {
        data: JSON.stringify(doc),
        contentType: 'application/json',
        type: 'POST'
      });
      req.done(function(data, textStatus, jqXHR) {
        return success(data || null);
      });
      return req.fail(function(jqXHR, textStatus, errorThrown) {
        if (error) {
          return error(errorThrown);
        }
      });
    };

    Collection.prototype.remove = function(id, success, error) {
      var req,
        _this = this;
      req = $.ajax(this.url + "/" + id + "?client=" + this.client, {
        type: 'DELETE'
      });
      req.done(function(data, textStatus, jqXHR) {
        return success();
      });
      return req.fail(function(jqXHR, textStatus, errorThrown) {
        if (jqXHR.status === 404) {
          return success();
        } else if (error) {
          return error(errorThrown);
        }
      });
    };

    return Collection;

  })();

  createUid = function() {
    return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r, v;
      r = Math.random() * 16 | 0;
      v = c === 'x' ? r : r & 0x3 | 0x8;
      return v.toString(16);
    });
  };

}).call(this);


},{}],13:[function(require,module,exports){
(function() {
  var GeoJSON, LocationFinder, LocationView,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  LocationFinder = require('./LocationFinder');

  GeoJSON = require('./GeoJSON');

  LocationView = (function(_super) {
    __extends(LocationView, _super);

    function LocationView(options) {
      this.mapClicked = __bind(this.mapClicked, this);
      this.locationError = __bind(this.locationError, this);
      this.locationFound = __bind(this.locationFound, this);
      LocationView.__super__.constructor.call(this);
      this.loc = options.loc;
      this.settingLocation = false;
      this.locationFinder = options.locationFinder || new LocationFinder();
      this.listenTo(this.locationFinder, 'found', this.locationFound);
      this.listenTo(this.locationFinder, 'error', this.locationError);
      if (this.loc) {
        this.locationFinder.startWatch();
      }
      this.render();
    }

    LocationView.prototype.events = {
      'click #location_map': 'mapClicked',
      'click #location_set': 'setLocation'
    };

    LocationView.prototype.remove = function() {
      this.locationFinder.stopWatch();
      return LocationView.__super__.remove.call(this);
    };

    LocationView.prototype.render = function() {
      this.$el.html(templates['LocationView']());
      if (this.errorFindingLocation) {
        this.$("#location_relative").text("Cannot find location");
      } else if (!this.loc && !this.settingLocation) {
        this.$("#location_relative").text("Unspecified location");
      } else if (this.settingLocation) {
        this.$("#location_relative").text("Setting location...");
      } else if (!this.currentLoc) {
        this.$("#location_relative").text("Waiting for GPS...");
      } else {
        this.$("#location_relative").text(GeoJSON.getRelativeLocation(this.currentLoc, this.loc));
      }
      this.$("#location_map").attr("disabled", !this.loc);
      return this.$("#location_set").attr("disabled", this.settingLocation === true);
    };

    LocationView.prototype.setLocation = function() {
      this.settingLocation = true;
      this.errorFindingLocation = false;
      this.locationFinder.startWatch();
      return this.render();
    };

    LocationView.prototype.locationFound = function(pos) {
      if (this.settingLocation) {
        this.settingLocation = false;
        this.errorFindingLocation = false;
        this.loc = GeoJSON.posToPoint(pos);
        this.trigger('locationset', this.loc);
      }
      this.currentLoc = GeoJSON.posToPoint(pos);
      return this.render();
    };

    LocationView.prototype.locationError = function() {
      this.settingLocation = false;
      this.errorFindingLocation = true;
      return this.render();
    };

    LocationView.prototype.mapClicked = function() {
      return this.trigger('map', this.loc);
    };

    return LocationView;

  })(Backbone.View);

  module.exports = LocationView;

}).call(this);


},{"./LocationFinder":33,"./GeoJSON":15}],10:[function(require,module,exports){
(function() {
  var ImagePage, Page, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Page = require("../Page");

  module.exports = ImagePage = (function(_super) {
    __extends(ImagePage, _super);

    function ImagePage() {
      _ref = ImagePage.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    ImagePage.prototype.create = function() {
      var _this = this;
      this.$el.html(templates['pages/ImagePage']());
      return this.imageManager.getImageUrl(this.options.id, function(url) {
        _this.$("#message_bar").hide();
        return _this.$("#image").attr("src", url).show();
      }, this.error);
    };

    ImagePage.prototype.activate = function() {
      var _this = this;
      this.setTitle("Image");
      if (this.options.onRemove) {
        return this.setupButtonBar([
          {
            icon: "delete.png",
            click: function() {
              return _this.removePhoto();
            }
          }
        ]);
      } else {
        return this.setupButtonBar([]);
      }
    };

    ImagePage.prototype.removePhoto = function() {
      if (confirm("Remove image?")) {
        this.options.onRemove();
        return this.pager.closePage();
      }
    };

    return ImagePage;

  })(Page);

}).call(this);


},{"../Page":34}],8:[function(require,module,exports){
(function() {
  var Collection, LocalDb, compileSort, createUid, processFind;

  createUid = require('./utils').createUid;

  processFind = require('./utils').processFind;

  compileSort = require('./selector').compileSort;

  LocalDb = (function() {
    function LocalDb(name, options) {
      this.name = name;
      this.collections = {};
      if (options && options.namespace && window.localStorage) {
        this.namespace = options.namespace;
      }
    }

    LocalDb.prototype.addCollection = function(name) {
      var collection, namespace;
      if (this.namespace) {
        namespace = this.namespace + "." + name;
      }
      collection = new Collection(name, namespace);
      this[name] = collection;
      return this.collections[name] = collection;
    };

    LocalDb.prototype.removeCollection = function(name) {
      var i, key, keys, _i, _j, _len, _ref;
      if (this.namespace && window.localStorage) {
        keys = [];
        for (i = _i = 0, _ref = localStorage.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
          keys.push(localStorage.key(i));
        }
        for (_j = 0, _len = keys.length; _j < _len; _j++) {
          key = keys[_j];
          if (key.substring(0, this.namespace.length + 1) === this.namespace + ".") {
            localStorage.removeItem(key);
          }
        }
      }
      delete this[name];
      return delete this.collections[name];
    };

    return LocalDb;

  })();

  Collection = (function() {
    function Collection(name, namespace) {
      this.name = name;
      this.namespace = namespace;
      this.items = {};
      this.upserts = {};
      this.removes = {};
      if (window.localStorage && (namespace != null)) {
        this.loadStorage();
      }
    }

    Collection.prototype.loadStorage = function() {
      var i, item, key, removeItems, upsertKeys, _i, _j, _len, _ref;
      this.itemNamespace = this.namespace + "_";
      for (i = _i = 0, _ref = localStorage.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
        key = localStorage.key(i);
        if (key.substring(0, this.itemNamespace.length) === this.itemNamespace) {
          item = JSON.parse(localStorage[key]);
          this.items[item._id] = item;
        }
      }
      upsertKeys = localStorage[this.namespace + "upserts"] ? JSON.parse(localStorage[this.namespace + "upserts"]) : [];
      for (_j = 0, _len = upsertKeys.length; _j < _len; _j++) {
        key = upsertKeys[_j];
        this.upserts[key] = this.items[key];
      }
      removeItems = localStorage[this.namespace + "removes"] ? JSON.parse(localStorage[this.namespace + "removes"]) : [];
      return this.removes = _.object(_.pluck(removeItems, "_id"), removeItems);
    };

    Collection.prototype.find = function(selector, options) {
      var _this = this;
      return {
        fetch: function(success, error) {
          return _this._findFetch(selector, options, success, error);
        }
      };
    };

    Collection.prototype.findOne = function(selector, options, success, error) {
      var _ref;
      if (_.isFunction(options)) {
        _ref = [{}, options, success], options = _ref[0], success = _ref[1], error = _ref[2];
      }
      return this.find(selector, options).fetch(function(results) {
        if (success != null) {
          return success(results.length > 0 ? results[0] : null);
        }
      }, error);
    };

    Collection.prototype._findFetch = function(selector, options, success, error) {
      if (success != null) {
        return success(processFind(this.items, selector, options));
      }
    };

    Collection.prototype.upsert = function(doc, success, error) {
      if (!doc._id) {
        doc._id = createUid();
      }
      this._putItem(doc);
      this._putUpsert(doc);
      if (success != null) {
        return success(doc);
      }
    };

    Collection.prototype.remove = function(id, success, error) {
      if (_.has(this.items, id)) {
        this._putRemove(this.items[id]);
        this._deleteItem(id);
        this._deleteUpsert(id);
      }
      if (success != null) {
        return success();
      }
    };

    Collection.prototype._putItem = function(doc) {
      this.items[doc._id] = doc;
      if (this.namespace) {
        return localStorage[this.itemNamespace + doc._id] = JSON.stringify(doc);
      }
    };

    Collection.prototype._deleteItem = function(id) {
      delete this.items[id];
      if (this.namespace) {
        return localStorage.removeItem(this.itemNamespace + id);
      }
    };

    Collection.prototype._putUpsert = function(doc) {
      this.upserts[doc._id] = doc;
      if (this.namespace) {
        return localStorage[this.namespace + "upserts"] = JSON.stringify(_.keys(this.upserts));
      }
    };

    Collection.prototype._deleteUpsert = function(id) {
      delete this.upserts[id];
      if (this.namespace) {
        return localStorage[this.namespace + "upserts"] = JSON.stringify(_.keys(this.upserts));
      }
    };

    Collection.prototype._putRemove = function(doc) {
      this.removes[doc._id] = doc;
      if (this.namespace) {
        return localStorage[this.namespace + "removes"] = JSON.stringify(_.values(this.removes));
      }
    };

    Collection.prototype._deleteRemove = function(id) {
      delete this.removes[id];
      if (this.namespace) {
        return localStorage[this.namespace + "removes"] = JSON.stringify(_.values(this.removes));
      }
    };

    Collection.prototype.cache = function(docs, selector, options, success, error) {
      var doc, docsMap, sort, _i, _len,
        _this = this;
      for (_i = 0, _len = docs.length; _i < _len; _i++) {
        doc = docs[_i];
        if (!_.has(this.upserts, doc._id) && !_.has(this.removes, doc._id)) {
          this._putItem(doc);
        }
      }
      docsMap = _.object(_.pluck(docs, "_id"), docs);
      if (options.sort) {
        sort = compileSort(options.sort);
      }
      return this.find(selector, options).fetch(function(results) {
        var result, _j, _len1;
        for (_j = 0, _len1 = results.length; _j < _len1; _j++) {
          result = results[_j];
          if (!docsMap[result._id] && !_.has(_this.upserts, result._id)) {
            if (options.sort && options.limit && docs.length === options.limit) {
              if (sort(result, _.last(docs)) >= 0) {
                continue;
              }
            }
            _this._deleteItem(result._id);
          }
        }
        if (success != null) {
          return success();
        }
      }, error);
    };

    Collection.prototype.pendingUpserts = function(success) {
      return success(_.values(this.upserts));
    };

    Collection.prototype.pendingRemoves = function(success) {
      return success(_.pluck(this.removes, "_id"));
    };

    Collection.prototype.resolveUpsert = function(doc, success) {
      if (this.upserts[doc._id] && _.isEqual(doc, this.upserts[doc._id])) {
        this._deleteUpsert(doc._id);
      }
      if (success != null) {
        return success();
      }
    };

    Collection.prototype.resolveRemove = function(id, success) {
      this._deleteRemove(id);
      if (success != null) {
        return success();
      }
    };

    Collection.prototype.seed = function(doc, success) {
      if (!_.has(this.items, doc._id) && !_.has(this.removes, doc._id)) {
        this._putItem(doc);
      }
      if (success != null) {
        return success();
      }
    };

    return Collection;

  })();

  module.exports = LocalDb;

}).call(this);


},{"./selector":35,"./utils":36}],6:[function(require,module,exports){
(function() {
  var HybridCollection, HybridDb, processFind;

  processFind = require('./utils').processFind;

  module.exports = HybridDb = (function() {
    function HybridDb(localDb, remoteDb) {
      this.localDb = localDb;
      this.remoteDb = remoteDb;
      this.collections = {};
    }

    HybridDb.prototype.addCollection = function(name) {
      var collection;
      collection = new HybridCollection(name, this.localDb[name], this.remoteDb[name]);
      this[name] = collection;
      return this.collections[name] = collection;
    };

    HybridDb.prototype.removeCollection = function(name) {
      delete this[name];
      return delete this.collections[name];
    };

    HybridDb.prototype.upload = function(success, error) {
      var cols, uploadCols,
        _this = this;
      cols = _.values(this.collections);
      uploadCols = function(cols, success, error) {
        var col;
        col = _.first(cols);
        if (col) {
          return col.upload(function() {
            return uploadCols(_.rest(cols), success, error);
          }, function(err) {
            return error(err);
          });
        } else {
          return success();
        }
      };
      return uploadCols(cols, success, error);
    };

    return HybridDb;

  })();

  HybridCollection = (function() {
    function HybridCollection(name, localCol, remoteCol) {
      this.name = name;
      this.localCol = localCol;
      this.remoteCol = remoteCol;
    }

    HybridCollection.prototype.find = function(selector, options) {
      var _this = this;
      if (options == null) {
        options = {};
      }
      return {
        fetch: function(success, error) {
          return _this._findFetch(selector, options, success, error);
        }
      };
    };

    HybridCollection.prototype.findOne = function(selector, options, success, error) {
      var mode, _ref,
        _this = this;
      if (options == null) {
        options = {};
      }
      if (_.isFunction(options)) {
        _ref = [{}, options, success], options = _ref[0], success = _ref[1], error = _ref[2];
      }
      mode = options.mode || "hybrid";
      if (mode === "hybrid" || mode === "local") {
        options.limit = 1;
        return this.localCol.findOne(selector, options, function(localDoc) {
          var remoteError, remoteSuccess;
          if (localDoc) {
            success(localDoc);
            if (mode === "local") {
              return;
            }
          }
          remoteSuccess = function(remoteDoc) {
            var cacheSuccess, docs;
            cacheSuccess = function() {
              return _this.localCol.findOne(selector, options, function(localDoc2) {
                if (!_.isEqual(localDoc, localDoc2)) {
                  return success(localDoc2);
                } else if (!localDoc) {
                  return success(null);
                }
              });
            };
            docs = remoteDoc ? [remoteDoc] : [];
            return _this.localCol.cache(docs, selector, options, cacheSuccess, error);
          };
          remoteError = function() {
            if (!localDoc) {
              return success(null);
            }
          };
          return _this.remoteCol.findOne(selector, _.omit(options, 'fields'), remoteSuccess, remoteError);
        }, error);
      } else {
        throw new Error("Unknown mode");
      }
    };

    HybridCollection.prototype._findFetch = function(selector, options, success, error) {
      var localSuccess, mode, remoteError, remoteSuccess,
        _this = this;
      mode = options.mode || "hybrid";
      if (mode === "hybrid") {
        localSuccess = function(localData) {
          var remoteSuccess;
          success(localData);
          remoteSuccess = function(remoteData) {
            var cacheSuccess;
            cacheSuccess = function() {
              var localSuccess2;
              localSuccess2 = function(localData2) {
                if (!_.isEqual(localData, localData2)) {
                  return success(localData2);
                }
              };
              return _this.localCol.find(selector, options).fetch(localSuccess2);
            };
            return _this.localCol.cache(remoteData, selector, options, cacheSuccess, error);
          };
          return _this.remoteCol.find(selector, _.omit(options, "fields")).fetch(remoteSuccess);
        };
        return this.localCol.find(selector, options).fetch(localSuccess, error);
      } else if (mode === "local") {
        return this.localCol.find(selector, options).fetch(success, error);
      } else if (mode === "remote") {
        remoteSuccess = function(remoteData) {
          var data;
          data = remoteData;
          return _this.localCol.pendingRemoves(function(removes) {
            var removesMap;
            if (removes.length > 0) {
              removesMap = _.object(_.map(removes, function(id) {
                return [id, id];
              }));
              data = _.filter(remoteData, function(doc) {
                return !_.has(removesMap, doc._id);
              });
            }
            return _this.localCol.pendingUpserts(function(upserts) {
              var upsertsMap;
              if (upserts.length > 0) {
                upsertsMap = _.object(_.pluck(upserts, '_id'), _.pluck(upserts, '_id'));
                data = _.filter(data, function(doc) {
                  return !_.has(upsertsMap, doc._id);
                });
                data = data.concat(upserts);
                data = processFind(data, selector, options);
              }
              return success(data);
            });
          });
        };
        remoteError = function() {
          return _this.localCol.find(selector, options).fetch(success, error);
        };
        return this.remoteCol.find(selector, options).fetch(remoteSuccess, remoteError);
      } else {
        throw new Error("Unknown mode");
      }
    };

    HybridCollection.prototype.upsert = function(doc, success, error) {
      return this.localCol.upsert(doc, success, error);
    };

    HybridCollection.prototype.remove = function(id, success, error) {
      return this.localCol.remove(id, success, error);
    };

    HybridCollection.prototype.upload = function(success, error) {
      var uploadUpserts,
        _this = this;
      uploadUpserts = function(upserts, success, error) {
        var upsert;
        upsert = _.first(upserts);
        if (upsert) {
          return _this.remoteCol.upsert(upsert, function() {
            return _this.localCol.resolveUpsert(upsert, function() {
              return uploadUpserts(_.rest(upserts), success, error);
            });
          }, function(err) {
            return error(err);
          });
        } else {
          return success();
        }
      };
      return this.localCol.pendingUpserts(function(upserts) {
        return uploadUpserts(upserts, success, error);
      });
    };

    return HybridCollection;

  })();

}).call(this);


},{"./utils":36}],23:[function(require,module,exports){
exports.Sections = Backbone.View.extend({
    className : "survey",

    initialize : function() {
        this.title = this.options.title;
        this.sections = this.options.sections;
        this.render();

        // Adjust next/prev based on model
        this.model.on("change", this.renderNextPrev, this);

        // Go to appropriate section TODO
        this.showSection(0);
    },

    events : {
        "click .next" : "nextSection",
        "click .prev" : "prevSection",
        "click .finish" : "finish",
        "click a.section-crumb" : "crumbSection"
    },

    finish : function() {
        // Validate current section
        var section = this.sections[this.section];
        if (section.validate()) {
            this.trigger('complete');
        }
    },

    crumbSection : function(e) {
        // Go to section
        var index = parseInt(e.target.getAttribute("data-value"));
        this.showSection(index);
    },

    getNextSectionIndex : function() {
        var i = this.section + 1;
        while (i < this.sections.length) {
            if (this.sections[i].shouldBeVisible())
                return i;
            i++;
        }
    },

    getPrevSectionIndex : function() {
        var i = this.section - 1;
        while (i >= 0) {
            if (this.sections[i].shouldBeVisible())
                return i;
            i--;
        }
    },

    nextSection : function() {
        // Validate current section
        var section = this.sections[this.section];
        if (section.validate()) {
            this.showSection(this.getNextSectionIndex());
        }
    },

    prevSection : function() {
        this.showSection(this.getPrevSectionIndex());
    },

    showSection : function(index) {
        this.section = index;

        _.each(this.sections, function(s) {
            s.$el.hide();
        });
        this.sections[index].$el.show();

        // Setup breadcrumbs
        var visibleSections = _.filter(_.first(this.sections, index + 1), function(s) {
            return s.shouldBeVisible()
        });
        this.$(".breadcrumb").html(templates['forms/Sections_breadcrumbs']({
            sections : _.initial(visibleSections),
            lastSection: _.last(visibleSections)
        }));
        
        this.renderNextPrev();

        // Scroll into view
        this.$el.scrollintoview();
    },
    
    renderNextPrev : function() {
        // Setup next/prev buttons
        this.$(".prev").toggle(this.getPrevSectionIndex() !== undefined);
        this.$(".next").toggle(this.getNextSectionIndex() !== undefined);
        this.$(".finish").toggle(this.getNextSectionIndex() === undefined);
    },

    render : function() {
        this.$el.html(templates['forms/Sections']());

        // Add sections
        var sectionsEl = this.$(".sections");
        _.each(this.sections, function(s) {
            sectionsEl.append(s.$el);
        });

        return this;
    }

});

exports.Section = Backbone.View.extend({
    className : "section",
    template : _.template('<div class="contents"></div>'),

    initialize : function() {
        this.title = this.options.title;
        this.contents = this.options.contents;

        // Always invisible initially
        this.$el.hide();
        this.render();
    },

    shouldBeVisible : function() {
        if (!this.options.conditional)
            return true;
        return this.options.conditional(this.model);
    },

    validate : function() {
        // Get all visible items
        var items = _.filter(this.contents, function(c) {
            return c.visible && c.validate;
        });
        return !_.any(_.map(items, function(item) {
            return item.validate();
        }));
    },

    render : function() {
        this.$el.html(this.template(this));

        // Add contents (questions, mostly)
        var contentsEl = this.$(".contents");
        _.each(this.contents, function(c) {
            contentsEl.append(c.$el);
        });

        return this;
    }

});

exports.Question = Backbone.View.extend({
    className : "question",

    template : _.template('<% if (options.prompt) { %><div class="prompt"><%=options.prompt%><%=renderRequired()%></div><% } %><div class="answer"></div><%=renderHint()%>'),

    renderRequired : function() {
        if (this.required)
            return '&nbsp;<span class="required">*</span>';
        return '';
    },

    renderHint: function() {
        if (this.options.hint)
            return _.template('<div class="muted"><%=hint%></div>')({hint: this.options.hint});
    },

    validate : function() {
        var val;

        // Check required
        if (this.required) {
            if (this.model.get(this.id) === undefined || this.model.get(this.id) === null || this.model.get(this.id) === "")
                val = "Required";
        }

        // Check internal validation
        if (!val && this.validateInternal) {
            val = this.validateInternal();
        }

        // Check custom validation
        if (!val && this.options.validate) {
            val = this.options.validate();
        }

        // Show validation results TODO
        if (val) {
            this.$el.addClass("invalid");
        } else {
            this.$el.removeClass("invalid");
        }

        return val;
    },

    updateVisibility : function(e) {
        // slideUp/slideDown
        if (this.shouldBeVisible() && !this.visible)
            this.$el.slideDown();
        if (!this.shouldBeVisible() && this.visible)
            this.$el.slideUp();
        this.visible = this.shouldBeVisible();
    },

    shouldBeVisible : function() {
        if (!this.options.conditional)
            return true;
        return this.options.conditional(this.model);
    },

    initialize : function() {
        // Adjust visibility based on model
        this.model.on("change", this.updateVisibility, this);

        // Re-render based on model changes
        this.model.on("change:" + this.id, this.render, this);

        this.required = this.options.required;

        // Save context
        this.ctx = this.options.ctx || {};

        this.render();
    },

    render : function() {
        this.$el.html(this.template(this));

        // Render answer
        this.renderAnswer(this.$(".answer"));

        this.$el.toggle(this.shouldBeVisible());
        this.visible = this.shouldBeVisible();
        return this;
    }

});

exports.RadioQuestion = exports.Question.extend({
    events : {
        "checked" : "checked",
    },

    checked : function(e) {
        var index = parseInt(e.target.getAttribute("data-value"));
        var value = this.options.options[index][0];
        this.model.set(this.id, value);
    },

    renderAnswer : function(answerEl) {
        answerEl.html(_.template('<div class="radio-group"><%=renderRadioOptions()%></div>', this));
    },

    renderRadioOptions : function() {
        html = "";
        var i;
        for ( i = 0; i < this.options.options.length; i++)
            html += _.template('<div class="radio-button <%=checked%>" data-value="<%=position%>"><%=text%></div>', {
                position : i,
                text : this.options.options[i][1],
                checked : this.model.get(this.id) === this.options.options[i][0] ? "checked" : ""
            });

        return html;
    }

});

exports.CheckQuestion = exports.Question.extend({
    events : {
        "checked" : "checked",
    },

    checked : function(e) {
        // Get checked
        this.model.set(this.id, this.$(".checkbox").hasClass("checked"));
    },

    renderAnswer : function(answerEl) {
        var i;
        answerEl.append($(_.template('<div class="checkbox <%=checked%>"><%=text%></div>', {
            text : this.options.text,
            checked : (this.model.get(this.id)) ? "checked" : ""
        })));
    }

});


exports.MulticheckQuestion = exports.Question.extend({
    events : {
        "checked" : "checked",
    },

    checked : function(e) {
        // Get all checked
        var value = [];
        var opts = this.options.options;
        this.$(".checkbox").each(function(index) {
            if ($(this).hasClass("checked"))
                value.push(opts[index][0]);
        });
        this.model.set(this.id, value);
    },

    renderAnswer : function(answerEl) {
        var i;
        for ( i = 0; i < this.options.options.length; i++)
            answerEl.append($(_.template('<div class="checkbox <%=checked%>" data-value="<%=position%>"><%=text%></div>', {
                position : i,
                text : this.options.options[i][1],
                checked : (this.model.get(this.id) && _.contains(this.model.get(this.id), this.options.options[i][0])) ? "checked" : ""
            })));
    }

});

exports.TextQuestion = exports.Question.extend({
    renderAnswer : function(answerEl) {
        if (this.options.multiline) {
            answerEl.html(_.template('<textarea style="width:90%"/>', this)); // TODO make width properly
            answerEl.find("textarea").val(this.model.get(this.id));
        } else {
            answerEl.html(_.template('<input type="text"/>', this));
            answerEl.find("input").val(this.model.get(this.id));
        }
    },

    events : {
        "change" : "changed"
    },
    changed : function() {
        this.model.set(this.id, this.$(this.options.multiline ? "textarea" : "input").val());
    }

});

},{}],27:[function(require,module,exports){
(function() {
  module.exports = Backbone.View.extend({
    initialize: function() {
      this.contents = this.options.contents;
      return this.render();
    },
    events: {
      'click #save_button': 'save',
      'click #cancel_button': 'cancel'
    },
    validate: function() {
      var items;
      items = _.filter(this.contents, function(c) {
        return c.visible && c.validate;
      });
      return !_.any(_.map(items, function(item) {
        return item.validate();
      }));
    },
    render: function() {
      var _this = this;
      this.$el.html('<div id="contents"></div>\n<div>\n    <button id="save_button" type="button" class="btn btn-primary margined">Save</button>\n    &nbsp;\n    <button id="cancel_button" type="button" class="btn margined">Cancel</button>\n</div>');
      _.each(this.contents, function(c) {
        return _this.$('#contents').append(c.$el);
      });
      return this;
    },
    save: function() {
      if (this.validate()) {
        return this.trigger('save');
      }
    },
    cancel: function() {
      return this.trigger('cancel');
    }
  });

}).call(this);


},{}],28:[function(require,module,exports){
(function() {
  module.exports = Backbone.View.extend({
    initialize: function() {
      this.contents = this.options.contents;
      return this.render();
    },
    validate: function() {
      var items;
      items = _.filter(this.contents, function(c) {
        return c.visible && c.validate;
      });
      return !_.any(_.map(items, function(item) {
        return item.validate();
      }));
    },
    render: function() {
      var _this = this;
      this.$el.html("");
      _.each(this.contents, function(c) {
        return _this.$el.append(c.$el);
      });
      return this;
    }
  });

}).call(this);


},{}],31:[function(require,module,exports){
(function() {
  module.exports = Backbone.View.extend({
    initialize: function() {
      return this.$el.html(_.template('<div class="well well-small"><%=html%><%-text%></div>')({
        html: this.options.html,
        text: this.options.text
      }));
    }
  });

}).call(this);


},{}],24:[function(require,module,exports){
(function() {
  var Question;

  Question = require('./form-controls').Question;

  module.exports = Question.extend({
    events: {
      change: "changed"
    },
    changed: function() {
      return this.model.set(this.id, this.$el.find("input[name=\"date\"]").val());
    },
    renderAnswer: function(answerEl) {
      answerEl.html(_.template("<input class=\"needsclick\" name=\"date\" />", this));
      answerEl.find("input").val(this.model.get(this.id));
      return answerEl.find("input").scroller({
        preset: "date",
        theme: "ios",
        display: "modal",
        mode: "scroller",
        dateOrder: "yymmD dd",
        dateFormat: "yy-mm-dd"
      });
    }
  });

}).call(this);


},{"./form-controls":23}],26:[function(require,module,exports){
(function() {
  var Question;

  Question = require('./form-controls').Question;

  module.exports = Question.extend({
    renderAnswer: function(answerEl) {
      answerEl.html(_.template("<input type=\"number\" <% if (options.decimal) {%>step=\"any\"<%}%> />", this));
      return answerEl.find("input").val(this.model.get(this.id));
    },
    events: {
      change: "changed"
    },
    validateInternal: function() {
      var val;
      val = this.$("input").val();
      if (this.options.decimal && val.length > 0) {
        if (parseFloat(val) === NaN) {
          return "Invalid decimal number";
        }
      } else if (val.length > 0) {
        if (!val.match(/^-?\d+$/)) {
          return "Invalid integer number";
        }
      }
      return null;
    },
    changed: function() {
      var val;
      val = parseFloat(this.$("input").val());
      if (val === NaN) {
        val = null;
      }
      return this.model.set(this.id, val);
    }
  });

}).call(this);


},{"./form-controls":23}],25:[function(require,module,exports){
(function() {
  var Question;

  Question = require('./form-controls').Question;

  module.exports = Question.extend({
    events: {
      change: "changed"
    },
    setOptions: function(options) {
      this.options.options = options;
      return this.render();
    },
    changed: function(e) {
      var index, val, value;
      val = $(e.target).val();
      if (val === "") {
        return this.model.set(this.id, null);
      } else {
        index = parseInt(val);
        value = this.options.options[index][0];
        return this.model.set(this.id, value);
      }
    },
    renderAnswer: function(answerEl) {
      var _this = this;
      answerEl.html(_.template("<select id=\"source_type\"><%=renderDropdownOptions()%></select>", this));
      if (!_.any(this.options.options, function(opt) {
        return opt[0] === _this.model.get(_this.id);
      }) && (this.model.get(this.id) != null)) {
        return this.$("select").attr('disabled', 'disabled');
      }
    },
    renderDropdownOptions: function() {
      var html, i, _i, _ref;
      html = "";
      html += "<option value=\"\"></option>";
      for (i = _i = 0, _ref = this.options.options.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
        html += _.template("<option value=\"<%=position%>\" <%=selected%>><%-text%></option>", {
          position: i,
          text: this.options.options[i][1],
          selected: (this.model.get(this.id) === this.options.options[i][0] ? "selected=\"selected\"" : "")
        });
      }
      return html;
    }
  });

}).call(this);


},{"./form-controls":23}],29:[function(require,module,exports){
(function() {
  var Question, SourceListPage, sourcecodes;

  Question = require('./form-controls').Question;

  SourceListPage = require('../pages/SourceListPage');

  sourcecodes = require('../sourcecodes');

  module.exports = Question.extend({
    renderAnswer: function(answerEl) {
      answerEl.html('<div class="input-append">\n  <input type="tel">\n  <button class="btn" id="select" type="button">Select</button>\n</div>');
      return answerEl.find("input").val(this.model.get(this.id));
    },
    events: {
      'change': 'changed',
      'click #select': 'selectSource'
    },
    changed: function() {
      return this.model.set(this.id, this.$("input").val());
    },
    selectSource: function() {
      var _this = this;
      return this.ctx.pager.openPage(SourceListPage, {
        onSelect: function(source) {
          return _this.model.set(_this.id, source.code);
        }
      });
    },
    validateInternal: function() {
      if (!this.$("input").val()) {
        return false;
      }
      if (sourcecodes.isValid(this.$("input").val())) {
        return false;
      }
      return "Invalid Source";
    }
  });

}).call(this);


},{"./form-controls":23,"../pages/SourceListPage":37,"../sourcecodes":38}],30:[function(require,module,exports){
(function() {
  var ImagePage, ImageQuestion, Question, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Question = require('./form-controls').Question;

  ImagePage = require('../pages/ImagePage');

  module.exports = ImageQuestion = (function(_super) {
    __extends(ImageQuestion, _super);

    function ImageQuestion() {
      _ref = ImageQuestion.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    ImageQuestion.prototype.events = {
      "click #add": "addClick",
      "click .thumbnail-img": "thumbnailClick"
    };

    ImageQuestion.prototype.renderAnswer = function(answerEl) {
      var canAdd, image, noImage, notSupported;
      if (!this.ctx.imageManager) {
        return answerEl.html('<div class="text-error">Images not available</div>');
      } else {
        image = this.model.get(this.id);
        notSupported = false;
        if (this.options.readonly) {
          canAdd = false;
        } else if (this.ctx.camera && this.ctx.imageManager.addImage) {
          canAdd = image == null;
        } else {
          canAdd = false;
          notSupported = !image;
        }
        noImage = !canAdd && !image && !notSupported;
        answerEl.html(templates['forms/ImageQuestion']({
          image: image,
          canAdd: canAdd,
          noImage: noImage,
          notSupported: notSupported
        }));
        if (image) {
          return this.setThumbnailUrl(image.id);
        }
      }
    };

    ImageQuestion.prototype.setThumbnailUrl = function(id) {
      var success,
        _this = this;
      success = function(url) {
        return _this.$("#" + id).attr("src", url);
      };
      return this.ctx.imageManager.getImageThumbnailUrl(id, success, this.error);
    };

    ImageQuestion.prototype.addClick = function() {
      var success,
        _this = this;
      success = function(url) {
        return _this.ctx.imageManager.addImage(url, function(id) {
          return _this.model.set(_this.id, {
            id: id
          });
        }, _this.ctx.error);
      };
      return this.ctx.camera.takePicture(success, function(err) {
        return alert("Failed to take picture");
      });
    };

    ImageQuestion.prototype.thumbnailClick = function(ev) {
      var id, onRemove,
        _this = this;
      id = ev.currentTarget.id;
      onRemove = function() {
        return _this.model.set(_this.id, null);
      };
      return this.ctx.pager.openPage(ImagePage, {
        id: id,
        onRemove: onRemove
      });
    };

    return ImageQuestion;

  })(Question);

}).call(this);


},{"./form-controls":23,"../pages/ImagePage":10}],32:[function(require,module,exports){
(function() {
  var ImagePage, ImagesQuestion, Question, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Question = require('./form-controls').Question;

  ImagePage = require('../pages/ImagePage');

  module.exports = ImagesQuestion = (function(_super) {
    __extends(ImagesQuestion, _super);

    function ImagesQuestion() {
      _ref = ImagesQuestion.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    ImagesQuestion.prototype.events = {
      "click #add": "addClick",
      "click .thumbnail-img": "thumbnailClick"
    };

    ImagesQuestion.prototype.renderAnswer = function(answerEl) {
      var canAdd, image, images, noImage, notSupported, _i, _len, _results;
      if (!this.ctx.imageManager) {
        return answerEl.html('<div class="text-error">Images not available</div>');
      } else {
        images = this.model.get(this.id);
        notSupported = false;
        if (this.options.readonly) {
          canAdd = false;
        } else if (this.ctx.camera && this.ctx.imageManager.addImage) {
          canAdd = true;
        } else {
          canAdd = false;
          notSupported = !images || images.length === 0;
        }
        noImage = !canAdd && (!images || images.length === 0) && !notSupported;
        answerEl.html(templates['forms/ImagesQuestion']({
          images: images,
          canAdd: canAdd,
          noImage: noImage,
          notSupported: notSupported
        }));
        if (images) {
          _results = [];
          for (_i = 0, _len = images.length; _i < _len; _i++) {
            image = images[_i];
            _results.push(this.setThumbnailUrl(image.id));
          }
          return _results;
        }
      }
    };

    ImagesQuestion.prototype.setThumbnailUrl = function(id) {
      var success,
        _this = this;
      success = function(url) {
        return _this.$("#" + id).attr("src", url);
      };
      return this.ctx.imageManager.getImageThumbnailUrl(id, success, this.error);
    };

    ImagesQuestion.prototype.addClick = function() {
      var success,
        _this = this;
      success = function(url) {
        return _this.ctx.imageManager.addImage(url, function(id) {
          var images;
          images = _this.model.get(_this.id) || [];
          images.push({
            id: id
          });
          return _this.model.set(_this.id, images);
        }, _this.ctx.error);
      };
      return this.ctx.camera.takePicture(success, function(err) {
        return alert("Failed to take picture");
      });
    };

    ImagesQuestion.prototype.thumbnailClick = function(ev) {
      var id, onRemove,
        _this = this;
      id = ev.currentTarget.id;
      onRemove = function() {
        var images;
        images = _this.model.get(_this.id) || [];
        images = _.reject(images, function(img) {
          return img.id === id;
        });
        return _this.model.set(_this.id, images);
      };
      return this.ctx.pager.openPage(ImagePage, {
        id: id,
        onRemove: onRemove
      });
    };

    return ImagesQuestion;

  })(Question);

}).call(this);


},{"./form-controls":23,"../pages/ImagePage":10}],33:[function(require,module,exports){
(function() {
  var LocationFinder;

  LocationFinder = (function() {
    function LocationFinder() {
      _.extend(this, Backbone.Events);
    }

    LocationFinder.prototype.getLocation = function() {
      var highAccuracy, highAccuracyFired, locationError, lowAccuracy,
        _this = this;
      locationError = _.after(2, function() {
        return _this.trigger('error');
      });
      highAccuracyFired = false;
      lowAccuracy = function(pos) {
        if (!highAccuracyFired) {
          return _this.trigger('found', pos);
        }
      };
      highAccuracy = function(pos) {
        highAccuracyFired = true;
        return _this.trigger('found', pos);
      };
      navigator.geolocation.getCurrentPosition(lowAccuracy, locationError, {
        maximumAge: 3600 * 24,
        timeout: 10000,
        enableHighAccuracy: false
      });
      return navigator.geolocation.getCurrentPosition(highAccuracy, locationError, {
        maximumAge: 3600,
        timeout: 30000,
        enableHighAccuracy: true
      });
    };

    LocationFinder.prototype.startWatch = function() {
      var error, highAccuracy, highAccuracyFired, lowAccuracy, lowAccuracyFired,
        _this = this;
      if (this.locationWatchId != null) {
        this.stopWatch();
      }
      highAccuracyFired = false;
      lowAccuracyFired = false;
      lowAccuracy = function(pos) {
        if (!highAccuracyFired) {
          lowAccuracyFired = true;
          return _this.trigger('found', pos);
        }
      };
      highAccuracy = function(pos) {
        highAccuracyFired = true;
        return _this.trigger('found', pos);
      };
      error = function(error) {
        console.log("### error ");
        if (!lowAccuracyFired && !highAccuracyFired) {
          return _this.trigger('error', error);
        }
      };
      navigator.geolocation.getCurrentPosition(lowAccuracy, error, {
        maximumAge: 3600 * 24,
        timeout: 10000,
        enableHighAccuracy: false
      });
      return this.locationWatchId = navigator.geolocation.watchPosition(highAccuracy, error, {
        maximumAge: 3000,
        enableHighAccuracy: true
      });
    };

    LocationFinder.prototype.stopWatch = function() {
      if (this.locationWatchId != null) {
        navigator.geolocation.clearWatch(this.locationWatchId);
        return this.locationWatchId = void 0;
      }
    };

    return LocationFinder;

  })();

  module.exports = LocationFinder;

}).call(this);


},{}],34:[function(require,module,exports){
(function() {
  var ButtonBar, ContextMenu, Page, _ref, _ref1,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Page = (function(_super) {
    __extends(Page, _super);

    function Page(ctx, options) {
      if (options == null) {
        options = {};
      }
      Page.__super__.constructor.call(this, options);
      this.ctx = ctx;
      _.extend(this, ctx);
      this._subviews = [];
      this.buttonBar = new ButtonBar();
      this.contextMenu = new ContextMenu();
    }

    Page.prototype.className = "page";

    Page.canOpen = function(ctx) {
      return true;
    };

    Page.prototype.create = function() {};

    Page.prototype.activate = function() {};

    Page.prototype.deactivate = function() {};

    Page.prototype.destroy = function() {};

    Page.prototype.remove = function() {
      this.removeSubviews();
      return Page.__super__.remove.call(this);
    };

    Page.prototype.getTitle = function() {
      return this.title;
    };

    Page.prototype.setTitle = function(title) {
      this.title = title;
      return this.trigger('change:title');
    };

    Page.prototype.addSubview = function(view) {
      return this._subviews.push(view);
    };

    Page.prototype.removeSubviews = function() {
      var subview, _i, _len, _ref, _results;
      _ref = this._subviews;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        subview = _ref[_i];
        _results.push(subview.remove());
      }
      return _results;
    };

    Page.prototype.getButtonBar = function() {
      return this.buttonBar;
    };

    Page.prototype.getContextMenu = function() {
      return this.contextMenu;
    };

    Page.prototype.setupButtonBar = function(items) {
      return this.buttonBar.setup(items);
    };

    Page.prototype.setupContextMenu = function(items) {
      return this.contextMenu.setup(items);
    };

    return Page;

  })(Backbone.View);

  ButtonBar = (function(_super) {
    __extends(ButtonBar, _super);

    function ButtonBar() {
      _ref = ButtonBar.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    ButtonBar.prototype.events = {
      "click .menuitem": "clickMenuItem"
    };

    ButtonBar.prototype.setup = function(items) {
      var id, item, subitem, _i, _j, _len, _len1, _ref1;
      this.items = items;
      this.itemMap = {};
      id = 1;
      for (_i = 0, _len = items.length; _i < _len; _i++) {
        item = items[_i];
        if (item.id == null) {
          item.id = id;
          id = id + 1;
        }
        this.itemMap[item.id] = item;
        if (item.menu) {
          _ref1 = item.menu;
          for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
            subitem = _ref1[_j];
            if (subitem.id == null) {
              subitem.id = id.toString();
              id = id + 1;
            }
            this.itemMap[subitem.id] = subitem;
          }
        }
      }
      return this.render();
    };

    ButtonBar.prototype.render = function() {
      return this.$el.html(templates['ButtonBar']({
        items: this.items
      }));
    };

    ButtonBar.prototype.clickMenuItem = function(e) {
      var id, item;
      id = e.currentTarget.id;
      item = this.itemMap[id];
      if (item.click != null) {
        return item.click();
      }
    };

    return ButtonBar;

  })(Backbone.View);

  ContextMenu = (function(_super) {
    __extends(ContextMenu, _super);

    function ContextMenu() {
      _ref1 = ContextMenu.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    ContextMenu.prototype.events = {
      "click .menuitem": "clickMenuItem"
    };

    ContextMenu.prototype.setup = function(items) {
      var id, item, _i, _len;
      this.items = items;
      this.itemMap = {};
      id = 1;
      for (_i = 0, _len = items.length; _i < _len; _i++) {
        item = items[_i];
        if (item.id == null) {
          item.id = id;
          id = id + 1;
        }
        this.itemMap[item.id] = item;
      }
      return this.render();
    };

    ContextMenu.prototype.render = function() {
      return this.$el.html(templates['ContextMenu']({
        items: this.items
      }));
    };

    ContextMenu.prototype.clickMenuItem = function(e) {
      var id, item;
      id = e.currentTarget.id;
      item = this.itemMap[id];
      if (item.click != null) {
        return item.click();
      }
    };

    return ContextMenu;

  })(Backbone.View);

  module.exports = Page;

}).call(this);


},{}],35:[function(require,module,exports){
// TODO add license

LocalCollection = {};
EJSON = require("./EJSON");

// Like _.isArray, but doesn't regard polyfilled Uint8Arrays on old browsers as
// arrays.
var isArray = function (x) {
  return _.isArray(x) && !EJSON.isBinary(x);
};

var _anyIfArray = function (x, f) {
  if (isArray(x))
    return _.any(x, f);
  return f(x);
};

var _anyIfArrayPlus = function (x, f) {
  if (f(x))
    return true;
  return isArray(x) && _.any(x, f);
};

var hasOperators = function(valueSelector) {
  var theseAreOperators = undefined;
  for (var selKey in valueSelector) {
    var thisIsOperator = selKey.substr(0, 1) === '$';
    if (theseAreOperators === undefined) {
      theseAreOperators = thisIsOperator;
    } else if (theseAreOperators !== thisIsOperator) {
      throw new Error("Inconsistent selector: " + valueSelector);
    }
  }
  return !!theseAreOperators;  // {} has no operators
};

var compileValueSelector = function (valueSelector) {
  if (valueSelector == null) {  // undefined or null
    return function (value) {
      return _anyIfArray(value, function (x) {
        return x == null;  // undefined or null
      });
    };
  }

  // Selector is a non-null primitive (and not an array or RegExp either).
  if (!_.isObject(valueSelector)) {
    return function (value) {
      return _anyIfArray(value, function (x) {
        return x === valueSelector;
      });
    };
  }

  if (valueSelector instanceof RegExp) {
    return function (value) {
      if (value === undefined)
        return false;
      return _anyIfArray(value, function (x) {
        return valueSelector.test(x);
      });
    };
  }

  // Arrays match either identical arrays or arrays that contain it as a value.
  if (isArray(valueSelector)) {
    return function (value) {
      if (!isArray(value))
        return false;
      return _anyIfArrayPlus(value, function (x) {
        return LocalCollection._f._equal(valueSelector, x);
      });
    };
  }

  // It's an object, but not an array or regexp.
  if (hasOperators(valueSelector)) {
    var operatorFunctions = [];
    _.each(valueSelector, function (operand, operator) {
      if (!_.has(VALUE_OPERATORS, operator))
        throw new Error("Unrecognized operator: " + operator);
      operatorFunctions.push(VALUE_OPERATORS[operator](
        operand, valueSelector.$options));
    });
    return function (value) {
      return _.all(operatorFunctions, function (f) {
        return f(value);
      });
    };
  }

  // It's a literal; compare value (or element of value array) directly to the
  // selector.
  return function (value) {
    return _anyIfArray(value, function (x) {
      return LocalCollection._f._equal(valueSelector, x);
    });
  };
};

// XXX can factor out common logic below
var LOGICAL_OPERATORS = {
  "$and": function(subSelector) {
    if (!isArray(subSelector) || _.isEmpty(subSelector))
      throw Error("$and/$or/$nor must be nonempty array");
    var subSelectorFunctions = _.map(
      subSelector, compileDocumentSelector);
    return function (doc) {
      return _.all(subSelectorFunctions, function (f) {
        return f(doc);
      });
    };
  },

  "$or": function(subSelector) {
    if (!isArray(subSelector) || _.isEmpty(subSelector))
      throw Error("$and/$or/$nor must be nonempty array");
    var subSelectorFunctions = _.map(
      subSelector, compileDocumentSelector);
    return function (doc) {
      return _.any(subSelectorFunctions, function (f) {
        return f(doc);
      });
    };
  },

  "$nor": function(subSelector) {
    if (!isArray(subSelector) || _.isEmpty(subSelector))
      throw Error("$and/$or/$nor must be nonempty array");
    var subSelectorFunctions = _.map(
      subSelector, compileDocumentSelector);
    return function (doc) {
      return _.all(subSelectorFunctions, function (f) {
        return !f(doc);
      });
    };
  },

  "$where": function(selectorValue) {
    if (!(selectorValue instanceof Function)) {
      selectorValue = Function("return " + selectorValue);
    }
    return function (doc) {
      return selectorValue.call(doc);
    };
  }
};

var VALUE_OPERATORS = {
  "$in": function (operand) {
    if (!isArray(operand))
      throw new Error("Argument to $in must be array");
    return function (value) {
      return _anyIfArrayPlus(value, function (x) {
        return _.any(operand, function (operandElt) {
          return LocalCollection._f._equal(operandElt, x);
        });
      });
    };
  },

  "$all": function (operand) {
    if (!isArray(operand))
      throw new Error("Argument to $all must be array");
    return function (value) {
      if (!isArray(value))
        return false;
      return _.all(operand, function (operandElt) {
        return _.any(value, function (valueElt) {
          return LocalCollection._f._equal(operandElt, valueElt);
        });
      });
    };
  },

  "$lt": function (operand) {
    return function (value) {
      return _anyIfArray(value, function (x) {
        return LocalCollection._f._cmp(x, operand) < 0;
      });
    };
  },

  "$lte": function (operand) {
    return function (value) {
      return _anyIfArray(value, function (x) {
        return LocalCollection._f._cmp(x, operand) <= 0;
      });
    };
  },

  "$gt": function (operand) {
    return function (value) {
      return _anyIfArray(value, function (x) {
        return LocalCollection._f._cmp(x, operand) > 0;
      });
    };
  },

  "$gte": function (operand) {
    return function (value) {
      return _anyIfArray(value, function (x) {
        return LocalCollection._f._cmp(x, operand) >= 0;
      });
    };
  },

  "$ne": function (operand) {
    return function (value) {
      return ! _anyIfArrayPlus(value, function (x) {
        return LocalCollection._f._equal(x, operand);
      });
    };
  },

  "$nin": function (operand) {
    if (!isArray(operand))
      throw new Error("Argument to $nin must be array");
    var inFunction = VALUE_OPERATORS.$in(operand);
    return function (value) {
      // Field doesn't exist, so it's not-in operand
      if (value === undefined)
        return true;
      return !inFunction(value);
    };
  },

  "$exists": function (operand) {
    return function (value) {
      return operand === (value !== undefined);
    };
  },

  "$mod": function (operand) {
    var divisor = operand[0],
        remainder = operand[1];
    return function (value) {
      return _anyIfArray(value, function (x) {
        return x % divisor === remainder;
      });
    };
  },

  "$size": function (operand) {
    return function (value) {
      return isArray(value) && operand === value.length;
    };
  },

  "$type": function (operand) {
    return function (value) {
      // A nonexistent field is of no type.
      if (value === undefined)
        return false;
      // Definitely not _anyIfArrayPlus: $type: 4 only matches arrays that have
      // arrays as elements according to the Mongo docs.
      return _anyIfArray(value, function (x) {
        return LocalCollection._f._type(x) === operand;
      });
    };
  },

  "$regex": function (operand, options) {
    if (options !== undefined) {
      // Options passed in $options (even the empty string) always overrides
      // options in the RegExp object itself.

      // Be clear that we only support the JS-supported options, not extended
      // ones (eg, Mongo supports x and s). Ideally we would implement x and s
      // by transforming the regexp, but not today...
      if (/[^gim]/.test(options))
        throw new Error("Only the i, m, and g regexp options are supported");

      var regexSource = operand instanceof RegExp ? operand.source : operand;
      operand = new RegExp(regexSource, options);
    } else if (!(operand instanceof RegExp)) {
      operand = new RegExp(operand);
    }

    return function (value) {
      if (value === undefined)
        return false;
      return _anyIfArray(value, function (x) {
        return operand.test(x);
      });
    };
  },

  "$options": function (operand) {
    // evaluation happens at the $regex function above
    return function (value) { return true; };
  },

  "$elemMatch": function (operand) {
    var matcher = compileDocumentSelector(operand);
    return function (value) {
      if (!isArray(value))
        return false;
      return _.any(value, function (x) {
        return matcher(x);
      });
    };
  },

  "$not": function (operand) {
    var matcher = compileValueSelector(operand);
    return function (value) {
      return !matcher(value);
    };
  },

  "$near": function (operand) {
    // Always returns true. Must be handled in post-filter/sort/limit
    return function (value) {
      return true;
    }
  },

  "$geoIntersects": function (operand) {
    // Always returns true. Must be handled in post-filter/sort/limit
    return function (value) {
      return true;
    }
  }

};

// helpers used by compiled selector code
LocalCollection._f = {
  // XXX for _all and _in, consider building 'inquery' at compile time..

  _type: function (v) {
    if (typeof v === "number")
      return 1;
    if (typeof v === "string")
      return 2;
    if (typeof v === "boolean")
      return 8;
    if (isArray(v))
      return 4;
    if (v === null)
      return 10;
    if (v instanceof RegExp)
      return 11;
    if (typeof v === "function")
      // note that typeof(/x/) === "function"
      return 13;
    if (v instanceof Date)
      return 9;
    if (EJSON.isBinary(v))
      return 5;
    if (v instanceof Meteor.Collection.ObjectID)
      return 7;
    return 3; // object

    // XXX support some/all of these:
    // 14, symbol
    // 15, javascript code with scope
    // 16, 18: 32-bit/64-bit integer
    // 17, timestamp
    // 255, minkey
    // 127, maxkey
  },

  // deep equality test: use for literal document and array matches
  _equal: function (a, b) {
    return EJSON.equals(a, b, {keyOrderSensitive: true});
  },

  // maps a type code to a value that can be used to sort values of
  // different types
  _typeorder: function (t) {
    // http://www.mongodb.org/display/DOCS/What+is+the+Compare+Order+for+BSON+Types
    // XXX what is the correct sort position for Javascript code?
    // ('100' in the matrix below)
    // XXX minkey/maxkey
    return [-1,  // (not a type)
            1,   // number
            2,   // string
            3,   // object
            4,   // array
            5,   // binary
            -1,  // deprecated
            6,   // ObjectID
            7,   // bool
            8,   // Date
            0,   // null
            9,   // RegExp
            -1,  // deprecated
            100, // JS code
            2,   // deprecated (symbol)
            100, // JS code
            1,   // 32-bit int
            8,   // Mongo timestamp
            1    // 64-bit int
           ][t];
  },

  // compare two values of unknown type according to BSON ordering
  // semantics. (as an extension, consider 'undefined' to be less than
  // any other value.) return negative if a is less, positive if b is
  // less, or 0 if equal
  _cmp: function (a, b) {
    if (a === undefined)
      return b === undefined ? 0 : -1;
    if (b === undefined)
      return 1;
    var ta = LocalCollection._f._type(a);
    var tb = LocalCollection._f._type(b);
    var oa = LocalCollection._f._typeorder(ta);
    var ob = LocalCollection._f._typeorder(tb);
    if (oa !== ob)
      return oa < ob ? -1 : 1;
    if (ta !== tb)
      // XXX need to implement this if we implement Symbol or integers, or
      // Timestamp
      throw Error("Missing type coercion logic in _cmp");
    if (ta === 7) { // ObjectID
      // Convert to string.
      ta = tb = 2;
      a = a.toHexString();
      b = b.toHexString();
    }
    if (ta === 9) { // Date
      // Convert to millis.
      ta = tb = 1;
      a = a.getTime();
      b = b.getTime();
    }

    if (ta === 1) // double
      return a - b;
    if (tb === 2) // string
      return a < b ? -1 : (a === b ? 0 : 1);
    if (ta === 3) { // Object
      // this could be much more efficient in the expected case ...
      var to_array = function (obj) {
        var ret = [];
        for (var key in obj) {
          ret.push(key);
          ret.push(obj[key]);
        }
        return ret;
      };
      return LocalCollection._f._cmp(to_array(a), to_array(b));
    }
    if (ta === 4) { // Array
      for (var i = 0; ; i++) {
        if (i === a.length)
          return (i === b.length) ? 0 : -1;
        if (i === b.length)
          return 1;
        var s = LocalCollection._f._cmp(a[i], b[i]);
        if (s !== 0)
          return s;
      }
    }
    if (ta === 5) { // binary
      // Surprisingly, a small binary blob is always less than a large one in
      // Mongo.
      if (a.length !== b.length)
        return a.length - b.length;
      for (i = 0; i < a.length; i++) {
        if (a[i] < b[i])
          return -1;
        if (a[i] > b[i])
          return 1;
      }
      return 0;
    }
    if (ta === 8) { // boolean
      if (a) return b ? 0 : 1;
      return b ? -1 : 0;
    }
    if (ta === 10) // null
      return 0;
    if (ta === 11) // regexp
      throw Error("Sorting not supported on regular expression"); // XXX
    // 13: javascript code
    // 14: symbol
    // 15: javascript code with scope
    // 16: 32-bit integer
    // 17: timestamp
    // 18: 64-bit integer
    // 255: minkey
    // 127: maxkey
    if (ta === 13) // javascript code
      throw Error("Sorting not supported on Javascript code"); // XXX
    throw Error("Unknown type to sort");
  }
};

// For unit tests. True if the given document matches the given
// selector.
LocalCollection._matches = function (selector, doc) {
  return (LocalCollection._compileSelector(selector))(doc);
};

// _makeLookupFunction(key) returns a lookup function.
//
// A lookup function takes in a document and returns an array of matching
// values.  This array has more than one element if any segment of the key other
// than the last one is an array.  ie, any arrays found when doing non-final
// lookups result in this function "branching"; each element in the returned
// array represents the value found at this branch. If any branch doesn't have a
// final value for the full key, its element in the returned list will be
// undefined. It always returns a non-empty array.
//
// _makeLookupFunction('a.x')({a: {x: 1}}) returns [1]
// _makeLookupFunction('a.x')({a: {x: [1]}}) returns [[1]]
// _makeLookupFunction('a.x')({a: 5})  returns [undefined]
// _makeLookupFunction('a.x')({a: [{x: 1},
//                                 {x: [2]},
//                                 {y: 3}]})
//   returns [1, [2], undefined]
LocalCollection._makeLookupFunction = function (key) {
  var dotLocation = key.indexOf('.');
  var first, lookupRest, nextIsNumeric;
  if (dotLocation === -1) {
    first = key;
  } else {
    first = key.substr(0, dotLocation);
    var rest = key.substr(dotLocation + 1);
    lookupRest = LocalCollection._makeLookupFunction(rest);
    // Is the next (perhaps final) piece numeric (ie, an array lookup?)
    nextIsNumeric = /^\d+(\.|$)/.test(rest);
  }

  return function (doc) {
    if (doc == null)  // null or undefined
      return [undefined];
    var firstLevel = doc[first];

    // We don't "branch" at the final level.
    if (!lookupRest)
      return [firstLevel];

    // It's an empty array, and we're not done: we won't find anything.
    if (isArray(firstLevel) && firstLevel.length === 0)
      return [undefined];

    // For each result at this level, finish the lookup on the rest of the key,
    // and return everything we find. Also, if the next result is a number,
    // don't branch here.
    //
    // Technically, in MongoDB, we should be able to handle the case where
    // objects have numeric keys, but Mongo doesn't actually handle this
    // consistently yet itself, see eg
    // https://jira.mongodb.org/browse/SERVER-2898
    // https://github.com/mongodb/mongo/blob/master/jstests/array_match2.js
    if (!isArray(firstLevel) || nextIsNumeric)
      firstLevel = [firstLevel];
    return Array.prototype.concat.apply([], _.map(firstLevel, lookupRest));
  };
};

// The main compilation function for a given selector.
var compileDocumentSelector = function (docSelector) {
  var perKeySelectors = [];
  _.each(docSelector, function (subSelector, key) {
    if (key.substr(0, 1) === '$') {
      // Outer operators are either logical operators (they recurse back into
      // this function), or $where.
      if (!_.has(LOGICAL_OPERATORS, key))
        throw new Error("Unrecognized logical operator: " + key);
      perKeySelectors.push(LOGICAL_OPERATORS[key](subSelector));
    } else {
      var lookUpByIndex = LocalCollection._makeLookupFunction(key);
      var valueSelectorFunc = compileValueSelector(subSelector);
      perKeySelectors.push(function (doc) {
        var branchValues = lookUpByIndex(doc);
        // We apply the selector to each "branched" value and return true if any
        // match. This isn't 100% consistent with MongoDB; eg, see:
        // https://jira.mongodb.org/browse/SERVER-8585
        return _.any(branchValues, valueSelectorFunc);
      });
    }
  });


  return function (doc) {
    return _.all(perKeySelectors, function (f) {
      return f(doc);
    });
  };
};

// Given a selector, return a function that takes one argument, a
// document, and returns true if the document matches the selector,
// else false.
LocalCollection._compileSelector = function (selector) {
  // you can pass a literal function instead of a selector
  if (selector instanceof Function)
    return function (doc) {return selector.call(doc);};

  // shorthand -- scalars match _id
  if (LocalCollection._selectorIsId(selector)) {
    return function (doc) {
      return EJSON.equals(doc._id, selector);
    };
  }

  // protect against dangerous selectors.  falsey and {_id: falsey} are both
  // likely programmer error, and not what you want, particularly for
  // destructive operations.
  if (!selector || (('_id' in selector) && !selector._id))
    return function (doc) {return false;};

  // Top level can't be an array or true or binary.
  if (typeof(selector) === 'boolean' || isArray(selector) ||
      EJSON.isBinary(selector))
    throw new Error("Invalid selector: " + selector);

  return compileDocumentSelector(selector);
};

// Give a sort spec, which can be in any of these forms:
//   {"key1": 1, "key2": -1}
//   [["key1", "asc"], ["key2", "desc"]]
//   ["key1", ["key2", "desc"]]
//
// (.. with the first form being dependent on the key enumeration
// behavior of your javascript VM, which usually does what you mean in
// this case if the key names don't look like integers ..)
//
// return a function that takes two objects, and returns -1 if the
// first object comes first in order, 1 if the second object comes
// first, or 0 if neither object comes before the other.

LocalCollection._compileSort = function (spec) {
  var sortSpecParts = [];

  if (spec instanceof Array) {
    for (var i = 0; i < spec.length; i++) {
      if (typeof spec[i] === "string") {
        sortSpecParts.push({
          lookup: LocalCollection._makeLookupFunction(spec[i]),
          ascending: true
        });
      } else {
        sortSpecParts.push({
          lookup: LocalCollection._makeLookupFunction(spec[i][0]),
          ascending: spec[i][1] !== "desc"
        });
      }
    }
  } else if (typeof spec === "object") {
    for (var key in spec) {
      sortSpecParts.push({
        lookup: LocalCollection._makeLookupFunction(key),
        ascending: spec[key] >= 0
      });
    }
  } else {
    throw Error("Bad sort specification: ", JSON.stringify(spec));
  }

  if (sortSpecParts.length === 0)
    return function () {return 0;};

  // reduceValue takes in all the possible values for the sort key along various
  // branches, and returns the min or max value (according to the bool
  // findMin). Each value can itself be an array, and we look at its values
  // too. (ie, we do a single level of flattening on branchValues, then find the
  // min/max.)
  var reduceValue = function (branchValues, findMin) {
    var reduced;
    var first = true;
    // Iterate over all the values found in all the branches, and if a value is
    // an array itself, iterate over the values in the array separately.
    _.each(branchValues, function (branchValue) {
      // Value not an array? Pretend it is.
      if (!isArray(branchValue))
        branchValue = [branchValue];
      // Value is an empty array? Pretend it was missing, since that's where it
      // should be sorted.
      if (isArray(branchValue) && branchValue.length === 0)
        branchValue = [undefined];
      _.each(branchValue, function (value) {
        // We should get here at least once: lookup functions return non-empty
        // arrays, so the outer loop runs at least once, and we prevented
        // branchValue from being an empty array.
        if (first) {
          reduced = value;
          first = false;
        } else {
          // Compare the value we found to the value we found so far, saving it
          // if it's less (for an ascending sort) or more (for a descending
          // sort).
          var cmp = LocalCollection._f._cmp(reduced, value);
          if ((findMin && cmp > 0) || (!findMin && cmp < 0))
            reduced = value;
        }
      });
    });
    return reduced;
  };

  return function (a, b) {
    for (var i = 0; i < sortSpecParts.length; ++i) {
      var specPart = sortSpecParts[i];
      var aValue = reduceValue(specPart.lookup(a), specPart.ascending);
      var bValue = reduceValue(specPart.lookup(b), specPart.ascending);
      var compare = LocalCollection._f._cmp(aValue, bValue);
      if (compare !== 0)
        return specPart.ascending ? compare : -compare;
    };
    return 0;
  };
};

exports.compileDocumentSelector = compileDocumentSelector;
exports.compileSort = LocalCollection._compileSort;
},{"./EJSON":39}],38:[function(require,module,exports){
(function() {
  exports.seqToCode = function(seq) {
    var digit, i, str, sum, _i, _ref;
    str = "" + seq;
    sum = 0;
    for (i = _i = 0, _ref = str.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
      digit = parseInt(str[str.length - 1 - i]);
      if (i % 3 === 0) {
        sum += 7 * digit;
      }
      if (i % 3 === 1) {
        sum += 3 * digit;
      }
      if (i % 3 === 2) {
        sum += digit;
      }
    }
    return str + (sum % 10);
  };

  exports.isValid = function(code) {
    var seq;
    seq = parseInt(code.substring(0, code.length - 1));
    return exports.seqToCode(seq) === code;
  };

}).call(this);


},{}],36:[function(require,module,exports){
(function() {
  var GeoJSON, compileDocumentSelector, compileSort, processGeoIntersectsOperator, processNearOperator;

  compileDocumentSelector = require('./selector').compileDocumentSelector;

  compileSort = require('./selector').compileSort;

  GeoJSON = require('../GeoJSON');

  exports.processFind = function(items, selector, options) {
    var filtered;
    filtered = _.filter(_.values(items), compileDocumentSelector(selector));
    filtered = processNearOperator(selector, filtered);
    filtered = processGeoIntersectsOperator(selector, filtered);
    if (options && options.sort) {
      filtered.sort(compileSort(options.sort));
    }
    if (options && options.limit) {
      filtered = _.first(filtered, options.limit);
    }
    if (options && options.fields) {
      if (_.first(_.values(options.fields)) === 1) {
        filtered = _.map(filtered, function(doc) {
          return _.pick(doc, _.keys(options.fields).concat(["_id"]));
        });
      } else {
        filtered = _.map(filtered, function(doc) {
          return _.omit(doc, _.keys(options.fields));
        });
      }
    } else {
      filtered = _.map(filtered, function(doc) {
        return _.cloneDeep(doc);
      });
    }
    return filtered;
  };

  exports.createUid = function() {
    return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r, v;
      r = Math.random() * 16 | 0;
      v = c === 'x' ? r : r & 0x3 | 0x8;
      return v.toString(16);
    });
  };

  processNearOperator = function(selector, list) {
    var distances, geo, key, near, value;
    for (key in selector) {
      value = selector[key];
      if ((value != null) && value['$near']) {
        geo = value['$near']['$geometry'];
        if (geo.type !== 'Point') {
          break;
        }
        near = new L.LatLng(geo.coordinates[1], geo.coordinates[0]);
        list = _.filter(list, function(doc) {
          return doc[key] && doc[key].type === 'Point';
        });
        distances = _.map(list, function(doc) {
          return {
            doc: doc,
            distance: near.distanceTo(new L.LatLng(doc[key].coordinates[1], doc[key].coordinates[0]))
          };
        });
        distances = _.filter(distances, function(item) {
          return item.distance >= 0;
        });
        distances = _.sortBy(distances, 'distance');
        if (value['$near']['$maxDistance']) {
          distances = _.filter(distances, function(item) {
            return item.distance <= value['$near']['$maxDistance'];
          });
        }
        distances = _.first(distances, 100);
        list = _.pluck(distances, 'doc');
      }
    }
    return list;
  };

  processGeoIntersectsOperator = function(selector, list) {
    var geo, key, value;
    for (key in selector) {
      value = selector[key];
      if ((value != null) && value['$geoIntersects']) {
        geo = value['$geoIntersects']['$geometry'];
        if (geo.type !== 'Polygon') {
          break;
        }
        list = _.filter(list, function(doc) {
          if (!doc[key] || doc[key].type !== 'Point') {
            return false;
          }
          return GeoJSON.pointInPolygon(doc[key], geo);
        });
      }
    }
    return list;
  };

}).call(this);


},{"./selector":35,"../GeoJSON":15}],37:[function(require,module,exports){
(function() {
  var GeoJSON, LocationFinder, Page, SourceListPage, _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Page = require("../Page");

  LocationFinder = require('../LocationFinder');

  GeoJSON = require('../GeoJSON');

  module.exports = SourceListPage = (function(_super) {
    __extends(SourceListPage, _super);

    function SourceListPage() {
      this.locationError = __bind(this.locationError, this);
      this.locationFound = __bind(this.locationFound, this);
      _ref = SourceListPage.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    SourceListPage.prototype.events = {
      'click tr.tappable': 'sourceClicked',
      'click #search_cancel': 'cancelSearch'
    };

    SourceListPage.prototype.create = function() {
      return this.setTitle('Nearby Sources');
    };

    SourceListPage.prototype.activate = function() {
      var _this = this;
      this.$el.html(templates['pages/SourceListPage']());
      this.nearSources = [];
      this.unlocatedSources = [];
      this.locationFinder = new LocationFinder();
      this.locationFinder.on('found', this.locationFound).on('error', this.locationError);
      this.locationFinder.getLocation();
      this.$("#location_msg").show();
      this.setupButtonBar([
        {
          icon: "search.png",
          click: function() {
            return _this.search();
          }
        }, {
          icon: "plus.png",
          click: function() {
            return _this.addSource();
          }
        }
      ]);
      this.db.sources.find({
        geo: {
          $exists: false
        }
      }).fetch(function(sources) {
        _this.unlocatedSources = sources;
        return _this.renderList();
      });
      return this.performSearch();
    };

    SourceListPage.prototype.addSource = function() {
      return this.pager.openPage(require("./NewSourcePage"));
    };

    SourceListPage.prototype.locationFound = function(pos) {
      var selector,
        _this = this;
      this.$("#location_msg").hide();
      selector = {
        geo: {
          $near: {
            $geometry: GeoJSON.posToPoint(pos)
          }
        }
      };
      return this.db.sources.find(selector).fetch(function(sources) {
        _this.nearSources = sources;
        return _this.renderList();
      });
    };

    SourceListPage.prototype.renderList = function() {
      var sources;
      if (!this.searchText) {
        sources = this.unlocatedSources.concat(this.nearSources);
      } else {
        sources = this.searchSources;
      }
      return this.$("#table").html(templates['pages/SourceListPage_items']({
        sources: sources
      }));
    };

    SourceListPage.prototype.locationError = function(pos) {
      this.$("#location_msg").hide();
      return this.pager.flash("Unable to determine location", "error");
    };

    SourceListPage.prototype.sourceClicked = function(ev) {
      var onSelect,
        _this = this;
      onSelect = void 0;
      if (this.options.onSelect) {
        onSelect = function(source) {
          _this.pager.closePage();
          return _this.options.onSelect(source);
        };
      }
      return this.pager.openPage(require("./SourcePage"), {
        _id: ev.currentTarget.id,
        onSelect: onSelect
      });
    };

    SourceListPage.prototype.search = function() {
      this.searchText = prompt("Enter search text or ID of water source");
      return this.performSearch();
    };

    SourceListPage.prototype.performSearch = function() {
      var selector,
        _this = this;
      this.$("#search_bar").toggle(this.searchText && this.searchText.length > 0);
      this.$("#search_text").text(this.searchText);
      if (this.searchText) {
        if (this.searchText.match(/^\d+$/)) {
          selector = {
            code: this.searchText
          };
        } else {
          selector = {
            name: new RegExp(this.searchText, "i")
          };
        }
        return this.db.sources.find(selector, {
          limit: 50
        }).fetch(function(sources) {
          _this.searchSources = sources;
          return _this.renderList();
        });
      } else {
        return this.renderList();
      }
    };

    SourceListPage.prototype.cancelSearch = function() {
      this.searchText = "";
      return this.performSearch();
    };

    return SourceListPage;

  })(Page);

}).call(this);


},{"../Page":34,"../LocationFinder":33,"../GeoJSON":15,"./NewSourcePage":40,"./SourcePage":41}],39:[function(require,module,exports){
EJSON = {}; // Global!
var customTypes = {};
// Add a custom type, using a method of your choice to get to and
// from a basic JSON-able representation.  The factory argument
// is a function of JSON-able --> your object
// The type you add must have:
// - A clone() method, so that Meteor can deep-copy it when necessary.
// - A equals() method, so that Meteor can compare it
// - A toJSONValue() method, so that Meteor can serialize it
// - a typeName() method, to show how to look it up in our type table.
// It is okay if these methods are monkey-patched on.
EJSON.addType = function (name, factory) {
  if (_.has(customTypes, name))
    throw new Error("Type " + name + " already present");
  customTypes[name] = factory;
};

var builtinConverters = [
  { // Date
    matchJSONValue: function (obj) {
      return _.has(obj, '$date') && _.size(obj) === 1;
    },
    matchObject: function (obj) {
      return obj instanceof Date;
    },
    toJSONValue: function (obj) {
      return {$date: obj.getTime()};
    },
    fromJSONValue: function (obj) {
      return new Date(obj.$date);
    }
  },
  { // Binary
    matchJSONValue: function (obj) {
      return _.has(obj, '$binary') && _.size(obj) === 1;
    },
    matchObject: function (obj) {
      return typeof Uint8Array !== 'undefined' && obj instanceof Uint8Array
        || (obj && _.has(obj, '$Uint8ArrayPolyfill'));
    },
    toJSONValue: function (obj) {
      return {$binary: EJSON._base64Encode(obj)};
    },
    fromJSONValue: function (obj) {
      return EJSON._base64Decode(obj.$binary);
    }
  },
  { // Escaping one level
    matchJSONValue: function (obj) {
      return _.has(obj, '$escape') && _.size(obj) === 1;
    },
    matchObject: function (obj) {
      if (_.isEmpty(obj) || _.size(obj) > 2) {
        return false;
      }
      return _.any(builtinConverters, function (converter) {
        return converter.matchJSONValue(obj);
      });
    },
    toJSONValue: function (obj) {
      var newObj = {};
      _.each(obj, function (value, key) {
        newObj[key] = EJSON.toJSONValue(value);
      });
      return {$escape: newObj};
    },
    fromJSONValue: function (obj) {
      var newObj = {};
      _.each(obj.$escape, function (value, key) {
        newObj[key] = EJSON.fromJSONValue(value);
      });
      return newObj;
    }
  },
  { // Custom
    matchJSONValue: function (obj) {
      return _.has(obj, '$type') && _.has(obj, '$value') && _.size(obj) === 2;
    },
    matchObject: function (obj) {
      return EJSON._isCustomType(obj);
    },
    toJSONValue: function (obj) {
      return {$type: obj.typeName(), $value: obj.toJSONValue()};
    },
    fromJSONValue: function (obj) {
      var typeName = obj.$type;
      var converter = customTypes[typeName];
      return converter(obj.$value);
    }
  }
];

EJSON._isCustomType = function (obj) {
  return obj &&
    typeof obj.toJSONValue === 'function' &&
    typeof obj.typeName === 'function' &&
    _.has(customTypes, obj.typeName());
};


//for both arrays and objects, in-place modification.
var adjustTypesToJSONValue =
EJSON._adjustTypesToJSONValue = function (obj) {
  if (obj === null)
    return null;
  var maybeChanged = toJSONValueHelper(obj);
  if (maybeChanged !== undefined)
    return maybeChanged;
  _.each(obj, function (value, key) {
    if (typeof value !== 'object' && value !== undefined)
      return; // continue
    var changed = toJSONValueHelper(value);
    if (changed) {
      obj[key] = changed;
      return; // on to the next key
    }
    // if we get here, value is an object but not adjustable
    // at this level.  recurse.
    adjustTypesToJSONValue(value);
  });
  return obj;
};

// Either return the JSON-compatible version of the argument, or undefined (if
// the item isn't itself replaceable, but maybe some fields in it are)
var toJSONValueHelper = function (item) {
  for (var i = 0; i < builtinConverters.length; i++) {
    var converter = builtinConverters[i];
    if (converter.matchObject(item)) {
      return converter.toJSONValue(item);
    }
  }
  return undefined;
};

EJSON.toJSONValue = function (item) {
  var changed = toJSONValueHelper(item);
  if (changed !== undefined)
    return changed;
  if (typeof item === 'object') {
    item = EJSON.clone(item);
    adjustTypesToJSONValue(item);
  }
  return item;
};

//for both arrays and objects. Tries its best to just
// use the object you hand it, but may return something
// different if the object you hand it itself needs changing.
var adjustTypesFromJSONValue =
EJSON._adjustTypesFromJSONValue = function (obj) {
  if (obj === null)
    return null;
  var maybeChanged = fromJSONValueHelper(obj);
  if (maybeChanged !== obj)
    return maybeChanged;
  _.each(obj, function (value, key) {
    if (typeof value === 'object') {
      var changed = fromJSONValueHelper(value);
      if (value !== changed) {
        obj[key] = changed;
        return;
      }
      // if we get here, value is an object but not adjustable
      // at this level.  recurse.
      adjustTypesFromJSONValue(value);
    }
  });
  return obj;
};

// Either return the argument changed to have the non-json
// rep of itself (the Object version) or the argument itself.

// DOES NOT RECURSE.  For actually getting the fully-changed value, use
// EJSON.fromJSONValue
var fromJSONValueHelper = function (value) {
  if (typeof value === 'object' && value !== null) {
    if (_.size(value) <= 2
        && _.all(value, function (v, k) {
          return typeof k === 'string' && k.substr(0, 1) === '$';
        })) {
      for (var i = 0; i < builtinConverters.length; i++) {
        var converter = builtinConverters[i];
        if (converter.matchJSONValue(value)) {
          return converter.fromJSONValue(value);
        }
      }
    }
  }
  return value;
};

EJSON.fromJSONValue = function (item) {
  var changed = fromJSONValueHelper(item);
  if (changed === item && typeof item === 'object') {
    item = EJSON.clone(item);
    adjustTypesFromJSONValue(item);
    return item;
  } else {
    return changed;
  }
};

EJSON.stringify = function (item) {
  return JSON.stringify(EJSON.toJSONValue(item));
};

EJSON.parse = function (item) {
  return EJSON.fromJSONValue(JSON.parse(item));
};

EJSON.isBinary = function (obj) {
  return (typeof Uint8Array !== 'undefined' && obj instanceof Uint8Array) ||
    (obj && obj.$Uint8ArrayPolyfill);
};

EJSON.equals = function (a, b, options) {
  var i;
  var keyOrderSensitive = !!(options && options.keyOrderSensitive);
  if (a === b)
    return true;
  if (!a || !b) // if either one is falsy, they'd have to be === to be equal
    return false;
  if (!(typeof a === 'object' && typeof b === 'object'))
    return false;
  if (a instanceof Date && b instanceof Date)
    return a.valueOf() === b.valueOf();
  if (EJSON.isBinary(a) && EJSON.isBinary(b)) {
    if (a.length !== b.length)
      return false;
    for (i = 0; i < a.length; i++) {
      if (a[i] !== b[i])
        return false;
    }
    return true;
  }
  if (typeof (a.equals) === 'function')
    return a.equals(b, options);
  if (a instanceof Array) {
    if (!(b instanceof Array))
      return false;
    if (a.length !== b.length)
      return false;
    for (i = 0; i < a.length; i++) {
      if (!EJSON.equals(a[i], b[i], options))
        return false;
    }
    return true;
  }
  // fall back to structural equality of objects
  var ret;
  if (keyOrderSensitive) {
    var bKeys = [];
    _.each(b, function (val, x) {
        bKeys.push(x);
    });
    i = 0;
    ret = _.all(a, function (val, x) {
      if (i >= bKeys.length) {
        return false;
      }
      if (x !== bKeys[i]) {
        return false;
      }
      if (!EJSON.equals(val, b[bKeys[i]], options)) {
        return false;
      }
      i++;
      return true;
    });
    return ret && i === bKeys.length;
  } else {
    i = 0;
    ret = _.all(a, function (val, key) {
      if (!_.has(b, key)) {
        return false;
      }
      if (!EJSON.equals(val, b[key], options)) {
        return false;
      }
      i++;
      return true;
    });
    return ret && _.size(b) === i;
  }
};

EJSON.clone = function (v) {
  var ret;
  if (typeof v !== "object")
    return v;
  if (v === null)
    return null; // null has typeof "object"
  if (v instanceof Date)
    return new Date(v.getTime());
  if (EJSON.isBinary(v)) {
    ret = EJSON.newBinary(v.length);
    for (var i = 0; i < v.length; i++) {
      ret[i] = v[i];
    }
    return ret;
  }
  if (_.isArray(v) || _.isArguments(v)) {
    // For some reason, _.map doesn't work in this context on Opera (weird test
    // failures).
    ret = [];
    for (i = 0; i < v.length; i++)
      ret[i] = EJSON.clone(v[i]);
    return ret;
  }
  // handle general user-defined typed Objects if they have a clone method
  if (typeof v.clone === 'function') {
    return v.clone();
  }
  // handle other objects
  ret = {};
  _.each(v, function (value, key) {
    ret[key] = EJSON.clone(value);
  });
  return ret;
};

module.exports = EJSON;
},{}],40:[function(require,module,exports){
(function() {
  var NewSourcePage, Page, SourcePage, forms, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Page = require('../Page');

  forms = require('../forms');

  SourcePage = require("./SourcePage");

  module.exports = NewSourcePage = (function(_super) {
    __extends(NewSourcePage, _super);

    function NewSourcePage() {
      _ref = NewSourcePage.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    NewSourcePage.canOpen = function(ctx) {
      return ctx.auth.insert("sources");
    };

    NewSourcePage.prototype.activate = function() {
      var saveCancelForm, sourceTypesQuestion,
        _this = this;
      this.setTitle("New Source");
      this.model = new Backbone.Model({
        setLocation: true
      });
      sourceTypesQuestion = new forms.DropdownQuestion({
        id: 'type',
        model: this.model,
        prompt: 'Enter Source Type',
        options: []
      });
      this.db.source_types.find({}).fetch(function(sourceTypes) {
        return sourceTypesQuestion.setOptions(_.map(sourceTypes, function(st) {
          return [st.code, st.name];
        }));
      });
      saveCancelForm = new forms.SaveCancelForm({
        contents: [
          sourceTypesQuestion, new forms.TextQuestion({
            id: 'name',
            model: this.model,
            prompt: 'Enter optional name'
          }), new forms.TextQuestion({
            id: 'desc',
            model: this.model,
            prompt: 'Enter optional description'
          }), new forms.CheckQuestion({
            id: 'private',
            model: this.model,
            prompt: "Privacy",
            text: 'Water source is private',
            hint: 'This should only be used for sources that are not publically accessible'
          }), new forms.RadioQuestion({
            id: 'setLocation',
            model: this.model,
            prompt: 'Set to current location?',
            options: [[true, 'Yes'], [false, 'No']]
          })
        ]
      });
      this.$el.empty().append(saveCancelForm.el);
      this.listenTo(saveCancelForm, 'save', function() {
        var source;
        source = _.pick(_this.model.toJSON(), 'name', 'desc', 'type', 'private');
        source.code = "" + Math.floor(Math.random() * 1000000);
        return _this.db.sources.upsert(source, function(source) {
          return _this.pager.closePage(SourcePage, {
            _id: source._id,
            setLocation: _this.model.get('setLocation')
          });
        });
      });
      return this.listenTo(saveCancelForm, 'cancel', function() {
        return _this.pager.closePage();
      });
    };

    return NewSourcePage;

  })(Page);

}).call(this);


},{"./SourcePage":41,"../Page":34,"../forms":"EAVIrc"}],41:[function(require,module,exports){
(function() {
  var LocationView, Page, SourcePage, forms, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Page = require("../Page");

  LocationView = require("../LocationView");

  forms = require('../forms');

  module.exports = SourcePage = (function(_super) {
    __extends(SourcePage, _super);

    function SourcePage() {
      _ref = SourcePage.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    SourcePage.prototype.events = {
      'click #edit_source_button': 'editSource',
      'click #add_test_button': 'addTest',
      'click #add_note_button': 'addNote',
      'click .test': 'openTest',
      'click .note': 'openNote',
      'click #select_source': 'selectSource'
    };

    SourcePage.prototype.create = function() {
      return this.setLocation = this.options.setLocation;
    };

    SourcePage.prototype.activate = function() {
      var _this = this;
      return this.db.sources.findOne({
        _id: this.options._id
      }, function(source) {
        _this.source = source;
        return _this.render();
      });
    };

    SourcePage.prototype.render = function() {
      var locationView, photosView,
        _this = this;
      this.setTitle("Source " + this.source.code);
      this.setupContextMenu([
        {
          glyph: 'remove',
          text: "Delete Source",
          click: function() {
            return _this.deleteSource();
          }
        }
      ]);
      this.setupButtonBar([
        {
          icon: "plus.png",
          menu: [
            {
              text: "Start Water Test",
              click: function() {
                return _this.addTest();
              }
            }, {
              text: "Add Note",
              click: function() {
                return _this.addNote();
              }
            }
          ]
        }
      ]);
      this.removeSubviews();
      this.$el.html(templates['pages/SourcePage']({
        source: this.source,
        select: this.options.onSelect != null
      }));
      if (this.source.type != null) {
        this.db.source_types.findOne({
          code: this.source.type
        }, function(sourceType) {
          if (sourceType != null) {
            return _this.$("#source_type").text(sourceType.name);
          }
        });
      }
      locationView = new LocationView({
        loc: this.source.geo
      });
      if (this.setLocation) {
        locationView.setLocation();
        this.setLocation = false;
      }
      this.listenTo(locationView, 'locationset', function(loc) {
        var _this = this;
        this.source.geo = loc;
        return this.db.sources.upsert(this.source, function() {
          return _this.render();
        });
      });
      this.listenTo(locationView, 'map', function(loc) {
        return this.pager.openPage(require("./SourceMapPage"), {
          initialGeo: loc
        });
      });
      this.addSubview(locationView);
      this.$("#location").append(locationView.el);
      this.db.tests.find({
        source: this.source.code
      }).fetch(function(tests) {
        return this.$("#tests").html(templates['pages/SourcePage_tests']({
          tests: tests
        }));
      });
      this.db.source_notes.find({
        source: this.source.code
      }).fetch(function(notes) {
        return this.$("#notes").html(templates['pages/SourcePage_notes']({
          notes: notes
        }));
      });
      photosView = new forms.ImagesQuestion({
        id: 'photos',
        model: new Backbone.Model(this.source),
        ctx: this.ctx
      });
      photosView.model.on('change', function() {
        return _this.db.sources.upsert(_this.source.toJSON(), function() {
          return _this.render();
        });
      });
      return this.$('#photos').append(photosView.el);
    };

    SourcePage.prototype.editSource = function() {
      return this.pager.openPage(require("./SourceEditPage"), {
        _id: this.source._id
      });
    };

    SourcePage.prototype.deleteSource = function() {
      var _this = this;
      if (confirm("Permanently delete source?")) {
        return this.db.sources.remove(this.source._id, function() {
          _this.pager.closePage();
          return _this.pager.flash("Source deleted", "success");
        });
      }
    };

    SourcePage.prototype.addTest = function() {
      return this.pager.openPage(require("./NewTestPage"), {
        source: this.source.code
      });
    };

    SourcePage.prototype.openTest = function(ev) {
      return this.pager.openPage(require("./TestPage"), {
        _id: ev.currentTarget.id
      });
    };

    SourcePage.prototype.addNote = function() {
      return this.pager.openPage(require("./SourceNotePage"), {
        source: this.source.code
      });
    };

    SourcePage.prototype.openNote = function(ev) {
      return this.pager.openPage(require("./SourceNotePage"), {
        source: this.source.code,
        _id: ev.currentTarget.id
      });
    };

    SourcePage.prototype.selectSource = function() {
      if (this.options.onSelect != null) {
        this.pager.closePage();
        return this.options.onSelect(this.source);
      }
    };

    return SourcePage;

  })(Page);

}).call(this);


},{"../LocationView":13,"./SourceMapPage":42,"./SourceEditPage":43,"../Page":34,"./NewTestPage":44,"./TestPage":45,"./SourceNotePage":46,"../forms":"EAVIrc"}],42:[function(require,module,exports){
(function() {
  var GeoJSON, ItemTracker, LocationDisplay, LocationFinder, Page, SourceDisplay, SourceMapPage, SourcePage, setupMapTiles, _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Page = require("../Page");

  SourcePage = require("./SourcePage");

  ItemTracker = require("../ItemTracker");

  LocationFinder = require('../LocationFinder');

  GeoJSON = require('../GeoJSON');

  SourceMapPage = (function(_super) {
    __extends(SourceMapPage, _super);

    function SourceMapPage() {
      this.resizeMap = __bind(this.resizeMap, this);
      _ref = SourceMapPage.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    SourceMapPage.prototype.create = function() {
      this.setTitle("Source Map");
      this.$el.html(templates['pages/SourceMapPage']());
      L.Icon.Default.imagePath = "img/leaflet";
      this.map = L.map(this.$("#map")[0]);
      L.control.scale({
        imperial: false
      }).addTo(this.map);
      this.resizeMap();
      $(window).on('resize', this.resizeMap);
      setupMapTiles().addTo(this.map);
      this.sourceDisplay = new SourceDisplay(this.map, this.db, this.pager);
      if (this.options.initialGeo && this.options.initialGeo.type === "Point") {
        this.map.setView(L.GeoJSON.coordsToLatLng(this.options.initialGeo.coordinates), 15);
      }
      return this.locationDisplay = new LocationDisplay(this.map, this.options.initialGeo == null);
    };

    SourceMapPage.prototype.destroy = function() {
      $(window).off('resize', this.resizeMap);
      return this.locationDisplay.stop();
    };

    SourceMapPage.prototype.resizeMap = function() {
      var mapHeight;
      mapHeight = $("html").height() - 40;
      $("#map").css("height", mapHeight + "px");
      return this.map.invalidateSize();
    };

    return SourceMapPage;

  })(Page);

  setupMapTiles = function() {
    var mapquestAttrib, mapquestUrl, subDomains;
    mapquestUrl = 'http://{s}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png';
    subDomains = ['otile1', 'otile2', 'otile3', 'otile4'];
    mapquestAttrib = 'Data, imagery and map information provided by <a href="http://open.mapquest.co.uk" target="_blank">MapQuest</a>, <a href="http://www.openstreetmap.org/" target="_blank">OpenStreetMap</a> and contributors.';
    return new L.TileLayer(mapquestUrl, {
      maxZoom: 18,
      attribution: mapquestAttrib,
      subdomains: subDomains
    });
  };

  SourceDisplay = (function() {
    function SourceDisplay(map, db, pager) {
      this.updateMarkers = __bind(this.updateMarkers, this);
      this.map = map;
      this.db = db;
      this.pager = pager;
      this.itemTracker = new ItemTracker();
      this.sourceMarkers = {};
      this.map.on('moveend', this.updateMarkers);
      this.icon = new L.icon({
        iconUrl: 'img/DropMarker.png',
        iconRetinaUrl: 'img/DropMarker@2x.png',
        iconSize: [27, 41],
        iconAnchor: [13, 41],
        popupAnchor: [-3, -41]
      });
    }

    SourceDisplay.prototype.updateMarkers = function() {
      var bounds, boundsGeoJSON, selector,
        _this = this;
      bounds = this.map.getBounds().pad(0.33);
      boundsGeoJSON = GeoJSON.latLngBoundsToGeoJSON(bounds);
      selector = {
        geo: {
          $geoIntersects: {
            $geometry: boundsGeoJSON
          }
        }
      };
      return this.db.sources.find(selector, {
        sort: ["_id"],
        limit: 100
      }).fetch(function(sources) {
        var add, adds, remove, removes, _i, _j, _len, _len1, _ref1, _results;
        _ref1 = _this.itemTracker.update(sources), adds = _ref1[0], removes = _ref1[1];
        for (_i = 0, _len = removes.length; _i < _len; _i++) {
          remove = removes[_i];
          _this.removeSourceMarker(remove);
        }
        _results = [];
        for (_j = 0, _len1 = adds.length; _j < _len1; _j++) {
          add = adds[_j];
          _results.push(_this.addSourceMarker(add));
        }
        return _results;
      });
    };

    SourceDisplay.prototype.addSourceMarker = function(source) {
      var latlng, marker,
        _this = this;
      if (source.geo != null) {
        latlng = new L.LatLng(source.geo.coordinates[1], source.geo.coordinates[0]);
        marker = new L.Marker(latlng, {
          icon: this.icon
        });
        marker.on('click', function() {
          return _this.pager.openPage(SourcePage, {
            _id: source._id
          });
        });
        this.sourceMarkers[source._id] = marker;
        return marker.addTo(this.map);
      }
    };

    SourceDisplay.prototype.removeSourceMarker = function(source) {
      if (_.has(this.sourceMarkers, source._id)) {
        return this.map.removeLayer(this.sourceMarkers[source._id]);
      }
    };

    return SourceDisplay;

  })();

  LocationDisplay = (function() {
    function LocationDisplay(map, zoomTo) {
      this.locationFound = __bind(this.locationFound, this);
      this.locationError = __bind(this.locationError, this);
      this.map = map;
      this.zoomTo = zoomTo;
      this.locationFinder = new LocationFinder();
      this.locationFinder.on('found', this.locationFound).on('error', this.locationError);
      this.locationFinder.startWatch();
    }

    LocationDisplay.prototype.stop = function() {
      return this.locationFinder.stopWatch();
    };

    LocationDisplay.prototype.locationError = function(e) {
      if (this.zoomTo) {
        this.map.fitWorld();
        this.zoomTo = false;
        return alert("Unable to determine location");
      }
    };

    LocationDisplay.prototype.locationFound = function(e) {
      var icon, latlng, radius, zoom;
      radius = e.coords.accuracy;
      latlng = new L.LatLng(e.coords.latitude, e.coords.longitude);
      if (this.zoomTo) {
        zoom = 15;
        this.map.setView(latlng, zoom);
        this.zoomTo = false;
      }
      if (!this.meMarker) {
        icon = L.icon({
          iconUrl: "img/my_location.png",
          iconSize: [22, 22]
        });
        this.meMarker = L.marker(latlng, {
          icon: icon
        }).addTo(this.map);
        this.meCircle = L.circle(latlng, radius);
        return this.meCircle.addTo(this.map);
      } else {
        this.meMarker.setLatLng(latlng);
        return this.meCircle.setLatLng(latlng).setRadius(radius);
      }
    };

    return LocationDisplay;

  })();

  module.exports = SourceMapPage;

}).call(this);


},{"../Page":34,"./SourcePage":41,"../ItemTracker":22,"../LocationFinder":33,"../GeoJSON":15}],44:[function(require,module,exports){
(function() {
  var NewTestPage, Page, TestPage, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Page = require("../Page");

  TestPage = require("./TestPage");

  NewTestPage = (function(_super) {
    __extends(NewTestPage, _super);

    function NewTestPage() {
      _ref = NewTestPage.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    NewTestPage.canOpen = function(ctx) {
      return ctx.auth.insert("tests");
    };

    NewTestPage.prototype.events = {
      "click .test": "startTest"
    };

    NewTestPage.prototype.activate = function() {
      var _this = this;
      this.setTitle("Select Test");
      return this.db.forms.find({
        type: "WaterTest"
      }).fetch(function(forms) {
        _this.forms = forms;
        return _this.$el.html(templates['pages/NewTestPage']({
          forms: forms
        }));
      });
    };

    NewTestPage.prototype.startTest = function(ev) {
      var test, testCode,
        _this = this;
      testCode = ev.currentTarget.id;
      test = {
        source: this.options.source,
        type: testCode,
        completed: null,
        started: new Date().toISOString()
      };
      return this.db.tests.upsert(test, function(test) {
        return _this.pager.closePage(TestPage, {
          _id: test._id
        });
      });
    };

    return NewTestPage;

  })(Page);

  module.exports = NewTestPage;

}).call(this);


},{"../Page":34,"./TestPage":45}],43:[function(require,module,exports){
(function() {
  var Page, SourceEditPage, forms, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Page = require('../Page');

  forms = require('../forms');

  module.exports = SourceEditPage = (function(_super) {
    __extends(SourceEditPage, _super);

    function SourceEditPage() {
      _ref = SourceEditPage.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    SourceEditPage.canOpen = function(ctx) {
      return ctx.auth.update("sources");
    };

    SourceEditPage.prototype.activate = function() {
      var _this = this;
      return this.db.sources.findOne({
        _id: this.options._id
      }, function(source) {
        var saveCancelForm, sourceTypesQuestion;
        _this.setTitle("Edit Source " + source.code);
        _this.model = new Backbone.Model(source);
        sourceTypesQuestion = new forms.DropdownQuestion({
          id: 'type',
          model: _this.model,
          prompt: 'Enter Source Type',
          options: []
        });
        _this.db.source_types.find({}).fetch(function(sourceTypes) {
          return sourceTypesQuestion.setOptions(_.map(sourceTypes, function(st) {
            return [st.code, st.name];
          }));
        });
        saveCancelForm = new forms.SaveCancelForm({
          contents: [
            sourceTypesQuestion, new forms.TextQuestion({
              id: 'name',
              model: _this.model,
              prompt: 'Enter optional name'
            }), new forms.TextQuestion({
              id: 'desc',
              model: _this.model,
              prompt: 'Enter optional description'
            }), new forms.CheckQuestion({
              id: 'private',
              model: _this.model,
              prompt: "Privacy",
              text: 'Water source is private',
              hint: 'This should only be used for sources that are not publically accessible'
            })
          ]
        });
        _this.$el.empty().append(saveCancelForm.el);
        _this.listenTo(saveCancelForm, 'save', function() {
          return _this.db.sources.upsert(_this.model.toJSON(), function() {
            return _this.pager.closePage();
          });
        });
        return _this.listenTo(saveCancelForm, 'cancel', function() {
          return _this.pager.closePage();
        });
      });
    };

    return SourceEditPage;

  })(Page);

}).call(this);


},{"../Page":34,"../forms":"EAVIrc"}],45:[function(require,module,exports){
(function() {
  var Page, TestPage, forms, _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Page = require("../Page");

  forms = require('../forms');

  TestPage = (function(_super) {
    __extends(TestPage, _super);

    function TestPage() {
      this.completed = __bind(this.completed, this);
      this.close = __bind(this.close, this);
      this.save = __bind(this.save, this);
      _ref = TestPage.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    TestPage.canOpen = function(ctx) {
      return ctx.auth.update("tests") && ctx.auth.insert("tests");
    };

    TestPage.prototype.create = function() {
      return this.render();
    };

    TestPage.prototype.activate = function() {
      var _this = this;
      return this.setupContextMenu([
        {
          glyph: 'remove',
          text: "Delete Test",
          click: function() {
            return _this.deleteTest();
          }
        }
      ]);
    };

    TestPage.prototype.render = function() {
      var _this = this;
      this.setTitle("Test");
      return this.db.tests.findOne({
        _id: this.options._id
      }, function(test) {
        _this.test = test;
        return _this.db.forms.findOne({
          type: "WaterTest",
          code: test.type
        }, function(form) {
          if (!test.completed) {
            _this.formView = forms.instantiateView(form.views.edit, {
              ctx: _this.ctx
            });
            _this.listenTo(_this.formView, 'change', _this.save);
            _this.listenTo(_this.formView, 'complete', _this.completed);
            _this.listenTo(_this.formView, 'close', _this.close);
          } else {
            _this.formView = forms.instantiateView(form.views.detail, {
              ctx: _this.ctx
            });
          }
          _this.$el.html(templates['pages/TestPage']({
            completed: test.completed,
            title: form.name
          }));
          _this.$('#contents').append(_this.formView.el);
          return _this.formView.load(_this.test);
        });
      });
    };

    TestPage.prototype.events = {
      "click #edit_button": "edit"
    };

    TestPage.prototype.destroy = function() {
      if (this.test && !this.test.completed) {
        return this.pager.flash("Test saved as draft.");
      }
    };

    TestPage.prototype.edit = function() {
      var _this = this;
      this.test.completed = null;
      return this.db.tests.upsert(this.test, function() {
        return _this.render();
      });
    };

    TestPage.prototype.save = function() {
      this.test = this.formView.save();
      return this.db.tests.upsert(this.test);
    };

    TestPage.prototype.close = function() {
      this.save();
      return this.pager.closePage();
    };

    TestPage.prototype.completed = function() {
      var _this = this;
      this.test.completed = new Date().toISOString();
      return this.db.tests.upsert(this.test, function() {
        return _this.render();
      });
    };

    TestPage.prototype.deleteTest = function() {
      var _this = this;
      if (confirm("Permanently delete test?")) {
        return this.db.tests.remove(this.test._id, function() {
          _this.test = null;
          _this.pager.closePage();
          return _this.pager.flash("Test deleted", "success");
        });
      }
    };

    return TestPage;

  })(Page);

  module.exports = TestPage;

}).call(this);


},{"../Page":34,"../forms":"EAVIrc"}],46:[function(require,module,exports){
(function() {
  var Page, SourceNotePage, forms, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Page = require('../Page');

  forms = require('../forms');

  module.exports = SourceNotePage = (function(_super) {
    __extends(SourceNotePage, _super);

    function SourceNotePage() {
      _ref = SourceNotePage.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    SourceNotePage.canOpen = function(ctx) {
      return ctx.auth.update("source_notes") && ctx.auth.insert("source_notes");
    };

    SourceNotePage.prototype.activate = function() {
      var _this = this;
      return this.db.sources.findOne({
        code: this.options.source
      }, function(source) {
        var saveCancelForm;
        _this.setTitle("Note for Source " + source.code);
        _this.model = new Backbone.Model();
        saveCancelForm = new forms.SaveCancelForm({
          contents: [
            new forms.DateQuestion({
              id: 'date',
              model: _this.model,
              prompt: 'Date of Visit',
              required: true
            }), new forms.RadioQuestion({
              id: 'status',
              model: _this.model,
              prompt: 'Status of Water Source',
              options: [['ok', 'Functional'], ['maint', 'Needs maintenance'], ['broken', 'Non-functional'], ['missing', 'No longer exists']],
              required: true
            }), new forms.TextQuestion({
              id: 'notes',
              model: _this.model,
              prompt: 'Notes',
              multiline: true
            })
          ]
        });
        if (_this.options._id) {
          _this.db.source_notes.findOne({
            _id: _this.options._id
          }, function(sourceNote) {
            return _this.model.set(sourceNote);
          });
        } else {
          _this.model.set({
            source: _this.options.source,
            date: new Date().toISOString().substring(0, 10)
          });
        }
        _this.$el.empty().append(saveCancelForm.el);
        _this.listenTo(saveCancelForm, 'save', function() {
          return _this.db.source_notes.upsert(_this.model.toJSON(), function() {
            return _this.pager.closePage();
          });
        });
        return _this.listenTo(saveCancelForm, 'cancel', function() {
          return _this.pager.closePage();
        });
      });
    };

    return SourceNotePage;

  })(Page);

}).call(this);


},{"../Page":34,"../forms":"EAVIrc"}]},{},[3,14,5,20,9,21,11,12,1,16,18,7])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL3Rlc3QvUHJvYmxlbVJlcG9ydGVyVGVzdHMuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My90ZXN0L0Ryb3Bkb3duUXVlc3Rpb25UZXN0cy5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL3Rlc3QvSHlicmlkRGJUZXN0cy5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL3Rlc3QvSW1hZ2VzUXVlc3Rpb25zVGVzdHMuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My90ZXN0L0xvY2FsRGJUZXN0cy5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL3Rlc3QvTG9jYXRpb25WaWV3VGVzdHMuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My90ZXN0L0dlb0pTT05UZXN0cy5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL3Rlc3QvYXV0aFRlc3RzLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvdGVzdC9SZW1vdGVEYlRlc3RzLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvdGVzdC9JbWFnZVF1ZXN0aW9uVGVzdHMuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My90ZXN0L2RiX3F1ZXJpZXMuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My90ZXN0L0l0ZW1UcmFja2VyVGVzdHMuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvZm9ybXMvaW5kZXguY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvUHJvYmxlbVJlcG9ydGVyLmpzIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My90ZXN0L2hlbHBlcnMvVUlEcml2ZXIuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvYXV0aC5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9JdGVtVHJhY2tlci5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9HZW9KU09OLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL2RiL1JlbW90ZURiLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL0xvY2F0aW9uVmlldy5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9wYWdlcy9JbWFnZVBhZ2UuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvZGIvTG9jYWxEYi5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9kYi9IeWJyaWREYi5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9mb3Jtcy9mb3JtLWNvbnRyb2xzLmpzIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvZm9ybXMvU2F2ZUNhbmNlbEZvcm0uY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvZm9ybXMvUXVlc3Rpb25Hcm91cC5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9mb3Jtcy9JbnN0cnVjdGlvbnMuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvZm9ybXMvRGF0ZVF1ZXN0aW9uLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL2Zvcm1zL051bWJlclF1ZXN0aW9uLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL2Zvcm1zL0Ryb3Bkb3duUXVlc3Rpb24uY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvZm9ybXMvU291cmNlUXVlc3Rpb24uY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvZm9ybXMvSW1hZ2VRdWVzdGlvbi5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9mb3Jtcy9JbWFnZXNRdWVzdGlvbi5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9Mb2NhdGlvbkZpbmRlci5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9QYWdlLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL2RiL3NlbGVjdG9yLmpzIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvc291cmNlY29kZXMuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvZGIvdXRpbHMuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvcGFnZXMvU291cmNlTGlzdFBhZ2UuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvZGIvRUpTT04uanMiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9wYWdlcy9OZXdTb3VyY2VQYWdlLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL3BhZ2VzL1NvdXJjZVBhZ2UuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvcGFnZXMvU291cmNlTWFwUGFnZS5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9wYWdlcy9OZXdUZXN0UGFnZS5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9wYWdlcy9Tb3VyY2VFZGl0UGFnZS5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9wYWdlcy9UZXN0UGFnZS5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9wYWdlcy9Tb3VyY2VOb3RlUGFnZS5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0NBQUEsS0FBQSxpQkFBQTs7Q0FBQSxDQUFBLENBQVMsQ0FBSSxFQUFiOztDQUFBLENBQ0EsQ0FBa0IsSUFBQSxRQUFsQixZQUFrQjs7Q0FEbEIsQ0FHQSxDQUE0QixLQUE1QixDQUE0QixRQUE1QjtDQUNFLEVBQU8sQ0FBUCxFQUFBLEdBQU87Q0FDTCxRQUFBLENBQUE7Q0FBQSxFQUFZLEdBQVosR0FBQTtDQUNFLEtBQUEsU0FBTztDQURULE1BQVk7Q0FBWixFQUVtQixDQUFsQixDQUZELENBRUEsQ0FBMEIsUUFBMUI7Q0FDQyxDQUFELENBQVUsQ0FBVCxDQUFTLElBQUEsSUFBVixFQUFVLHdCQUFBO0NBSlosSUFBTztDQUFQLEVBS00sQ0FBTixDQUFBLElBQU07Q0FDSixDQUFHLEVBQUYsRUFBRCxDQUFBO0NBQ08sQ0FBcUIsRUFBQyxDQUE3QixDQUFNLENBQWMsTUFBcEIsRUFBQTtDQUZGLElBQU07Q0FJSCxDQUFILENBQW1DLE1BQUEsRUFBbkMsbUJBQUE7Q0FDRSxHQUFBLE1BQUE7Q0FBQSxDQUFxQixDQUFkLENBQVAsQ0FBWSxDQUFaO0NBQUEsSUFDQSxDQUFBLENBQU8sYUFBUDtDQURBLEdBR2tCLEVBQWxCLElBQUE7Q0FIQSxDQUlzQyxFQUFyQixDQUFqQixDQUFBLENBQUE7Q0FKQSxDQUtx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O0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hWQTtDQUFBLENBQUEsQ0FBaUIsQ0FBYSxFQUF4QixDQUFOLENBQXlCO0NBQ3ZCLENBQVksQ0FBQSxDQUFaLEtBQVksQ0FBWjtDQUNFLEVBQVksQ0FBWCxFQUFELENBQW9CLENBQXBCO0NBQ0MsR0FBQSxFQUFELE9BQUE7Q0FGRixJQUFZO0NBQVosQ0FLRSxFQURGLEVBQUE7Q0FDRSxDQUFzQixJQUF0QixjQUFBO0NBQUEsQ0FDd0IsSUFBeEIsRUFEQSxjQUNBO01BTkY7Q0FBQSxDQVFVLENBQUEsQ0FBVixJQUFBLENBQVU7Q0FFUixJQUFBLEtBQUE7Q0FBQSxDQUE0QixDQUFwQixDQUFVLENBQWxCLENBQUEsRUFBUSxDQUFxQjtDQUMxQixHQUFhLEdBQWQsUUFBQTtDQURNLE1BQW9CO0FBR2pCLENBQVgsQ0FBOEIsQ0FBbkIsQ0FBbUIsQ0FBYixJQUFjLElBQXhCO0NBQ0EsR0FBRCxJQUFKLE9BQUE7Q0FEZSxNQUFhO0NBYmhDLElBUVU7Q0FSVixDQWlCUSxDQUFBLENBQVIsRUFBQSxHQUFRO0NBQ04sU0FBQSxFQUFBO0NBQUEsRUFBSSxDQUFILEVBQUQsOE5BQUE7Q0FBQSxDQVFrQixDQUFBLENBQWxCLEVBQUEsRUFBQSxDQUFtQjtDQUFPLEVBQUQsRUFBQyxDQUFELEtBQUEsSUFBQTtDQUF6QixNQUFrQjtDQVRaLFlBVU47Q0EzQkYsSUFpQlE7Q0FqQlIsQ0E2Qk0sQ0FBQSxDQUFOLEtBQU07Q0FDSixHQUFHLEVBQUgsRUFBRztDQUNBLEdBQUEsRUFBRCxDQUFBLFFBQUE7UUFGRTtDQTdCTixJQTZCTTtDQTdCTixDQWlDUSxDQUFBLENBQVIsRUFBQSxHQUFRO0NBQ0wsR0FBQSxHQUFELENBQUEsS0FBQTtDQWxDRixJQWlDUTtDQWxDVixHQUFpQjtDQUFqQjs7Ozs7QUNEQTtDQUFBLENBQUEsQ0FBaUIsQ0FBYSxFQUF4QixDQUFOLENBQXlCO0NBQ3ZCLENBQVksQ0FBQSxDQUFaLEtBQVksQ0FBWjtDQUNFLEVBQVksQ0FBWCxFQUFELENBQW9CLENBQXBCO0NBQ0MsR0FBQSxFQUFELE9BQUE7Q0FGRixJQUFZO0NBQVosQ0FJVSxDQUFBLENBQVYsSUFBQSxDQUFVO0NBRVIsSUFBQSxLQUFBO0NBQUEsQ0FBNEIsQ0FBcEIsQ0FBVSxDQUFsQixDQUFBLEVBQVEsQ0FBcUI7Q0FDMUIsR0FBYSxHQUFkLFFBQUE7Q0FETSxNQUFvQjtBQUdqQixDQUFYLENBQThCLENBQW5CLENBQW1CLENBQWIsSUFBYyxJQUF4QjtDQUNBLEdBQUQsSUFBSixPQUFBO0NBRGUsTUFBYTtDQVRoQyxJQUlVO0NBSlYsQ0FhUSxDQUFBLENBQVIsRUFBQSxHQUFRO0NBQ04sU0FBQSxFQUFBO0NBQUEsQ0FBQSxDQUFJLENBQUgsRUFBRDtDQUFBLENBR2tCLENBQUEsQ0FBbEIsRUFBQSxFQUFBLENBQW1CO0NBQU8sRUFBRyxFQUFILENBQUQsU0FBQTtDQUF6QixNQUFrQjtDQUpaLFlBTU47Q0FuQkYsSUFhUTtDQWRWLEdBQWlCO0NBQWpCOzs7OztBQ0ZBO0NBQUEsQ0FBQSxDQUFpQixDQUFhLEVBQXhCLENBQU4sQ0FBeUI7Q0FDdkIsQ0FBWSxDQUFBLENBQVosS0FBWSxDQUFaO0NBQ0csRUFBRyxDQUFILElBQVMsS0FBViwwQ0FBVTtDQUVILENBQU0sRUFBTixHQUFjLENBQWQ7Q0FBQSxDQUEyQixFQUFOLEdBQWMsQ0FBZDtDQUY1QixPQUFVO0NBRFosSUFBWTtDQURkLEdBQWlCO0NBQWpCOzs7OztBQ0VBO0NBQUEsS0FBQSxFQUFBOztDQUFBLENBQUEsQ0FBVyxJQUFBLENBQVgsU0FBVzs7Q0FBWCxDQUVBLENBQWlCLEdBQVgsQ0FBTixDQUF5QjtDQUN2QixDQUNFLEVBREYsRUFBQTtDQUNFLENBQVEsSUFBUixHQUFBO01BREY7Q0FBQSxDQUdTLENBQUEsQ0FBVCxHQUFBLEVBQVM7Q0FDTixDQUFELENBQUEsQ0FBQyxDQUFLLFFBQU4sU0FBZ0I7Q0FKbEIsSUFHUztDQUhULENBTWMsQ0FBQSxDQUFkLElBQWMsQ0FBQyxHQUFmO0NBQ0UsQ0FBeUUsRUFBekUsRUFBQSxFQUFRLHNDQUFNO0NBQWQsQ0FDMkIsQ0FBM0IsQ0FBQSxDQUFpQyxDQUFqQyxDQUFBLENBQVE7Q0FDQyxHQUFULEdBQUEsQ0FBUSxLQUFSO0NBQ0UsQ0FBUSxJQUFSLEVBQUE7Q0FBQSxDQUNPLEdBQVAsR0FBQTtDQURBLENBRVMsS0FBVCxDQUFBO0NBRkEsQ0FHTSxFQUFOLElBQUEsRUFIQTtDQUFBLENBSVcsTUFBWCxDQUFBLENBSkE7Q0FBQSxDQUtZLE1BQVosRUFBQTtDQVRVLE9BR1o7Q0FURixJQU1jO0NBVGhCLEdBRWlCO0NBRmpCOzs7OztBQ0ZBO0NBQUEsS0FBQSxFQUFBOztDQUFBLENBQUEsQ0FBVyxJQUFBLENBQVgsU0FBVzs7Q0FBWCxDQUVBLENBQWlCLEdBQVgsQ0FBTixDQUF5QjtDQUN2QixDQUFjLENBQUEsQ0FBZCxJQUFjLENBQUMsR0FBZjtDQUNFLENBQW1HLEVBQW5HLEVBQUEsRUFBUSxnRUFBTTtDQUNMLENBQWtCLENBQTNCLENBQUEsQ0FBaUMsRUFBakMsQ0FBUSxLQUFSO0NBRkYsSUFBYztDQUFkLENBS0UsRUFERixFQUFBO0NBQ0UsQ0FBUSxJQUFSLEdBQUE7TUFMRjtDQUFBLENBT2tCLENBQUEsQ0FBbEIsS0FBa0IsT0FBbEI7Q0FDRSxFQUFBLE9BQUE7Q0FBQSxFQUFBLENBQU8sRUFBUCxDQUFNO0NBQ04sRUFBMkIsQ0FBeEIsRUFBSCxDQUFXO0NBQ1QsRUFBRyxDQUFBLENBQW1CLEdBQXRCLEVBQUc7Q0FDRCxnQkFBTyxPQUFQO1VBRko7Q0FHWSxFQUFELENBQUgsRUFIUixFQUFBO0FBSVMsQ0FBUCxFQUFVLENBQVAsQ0FBSSxHQUFQLENBQU87Q0FDTCxnQkFBTyxPQUFQO1VBTEo7UUFEQTtDQU9BLEdBQUEsU0FBTztDQWZULElBT2tCO0NBUGxCLENBaUJTLENBQUEsQ0FBVCxHQUFBLEVBQVM7Q0FDUCxFQUFBLE9BQUE7Q0FBQSxFQUFBLENBQWtCLEVBQWxCLENBQWlCLEdBQVg7Q0FDTixFQUFHLENBQUEsQ0FBTyxDQUFWO0NBQ0UsRUFBQSxDQUFBLElBQUE7UUFGRjtDQUdDLENBQUQsQ0FBQSxDQUFDLENBQUssUUFBTjtDQXJCRixJQWlCUztDQXBCWCxHQUVpQjtDQUZqQjs7Ozs7QUNBQTtDQUFBLEtBQUEsRUFBQTs7Q0FBQSxDQUFBLENBQVcsSUFBQSxDQUFYLFNBQVc7O0NBQVgsQ0FFQSxDQUFpQixHQUFYLENBQU4sQ0FBeUI7Q0FDdkIsQ0FDRSxFQURGLEVBQUE7Q0FDRSxDQUFRLElBQVIsR0FBQTtNQURGO0NBQUEsQ0FHWSxDQUFBLENBQVosR0FBWSxFQUFDLENBQWI7Q0FDRSxFQUFtQixDQUFsQixFQUFELENBQVE7Q0FDUCxHQUFBLEVBQUQsT0FBQTtDQUxGLElBR1k7Q0FIWixDQU9TLENBQUEsQ0FBVCxHQUFBLEVBQVU7Q0FDUixTQUFBLE9BQUE7Q0FBQSxFQUFBLEdBQUE7Q0FDQSxDQUFBLENBQUcsQ0FBQSxDQUFPLENBQVY7Q0FDRyxDQUFELENBQUEsQ0FBQyxDQUFLLFVBQU47TUFERixFQUFBO0NBR0UsRUFBUSxFQUFSLEdBQUE7Q0FBQSxFQUNRLENBQUMsQ0FBVCxFQUFnQixDQUFoQjtDQUNDLENBQUQsQ0FBQSxDQUFDLENBQUssVUFBTjtRQVBLO0NBUFQsSUFPUztDQVBULENBZ0JjLENBQUEsQ0FBZCxJQUFjLENBQUMsR0FBZjtDQUNFLFNBQUEsRUFBQTtDQUFBLENBQTZGLEVBQTdGLEVBQUEsRUFBUSwwREFBTTtBQUVQLENBQVAsQ0FBK0IsQ0FBeEIsQ0FBSixFQUFILENBQXFCLEVBQVc7Q0FBWSxDQUFNLENBQU4sRUFBTSxVQUFWO0NBQWpDLEdBQWdFLEdBQXhDLDBCQUEvQjtDQUNHLENBQTZCLEVBQTdCLElBQUQsRUFBQSxLQUFBO1FBSlU7Q0FoQmQsSUFnQmM7Q0FoQmQsQ0FzQnVCLENBQUEsQ0FBdkIsS0FBdUIsWUFBdkI7Q0FDRSxTQUFBLE9BQUE7Q0FBQSxDQUFBLENBQU8sQ0FBUCxFQUFBO0NBQUEsR0FHQSxFQUFBLHdCQUhBO0FBSUEsQ0FBQSxFQUFBLFFBQVMsbUdBQVQ7Q0FDRSxDQUNFLEVBREYsSUFBQSwwREFBUTtDQUNOLENBQVUsTUFBVixFQUFBO0NBQUEsQ0FDTSxFQUFOLEdBQWMsR0FBZDtDQURBLENBRVUsQ0FBSSxDQUFDLENBQUssRUFBcUIsQ0FBekMsRUFBQSxhQUFXO0NBSGIsU0FBUTtDQURWLE1BSkE7Q0FVQSxHQUFBLFNBQU87Q0FqQ1QsSUFzQnVCO0NBekJ6QixHQUVpQjtDQUZqQjs7Ozs7QUNBQTtDQUFBLEtBQUEsK0JBQUE7O0NBQUEsQ0FBQSxDQUFXLElBQUEsQ0FBWCxTQUFXOztDQUFYLENBQ0EsQ0FBaUIsSUFBQSxPQUFqQixXQUFpQjs7Q0FEakIsQ0FFQSxDQUFjLElBQUEsSUFBZCxLQUFjOztDQUZkLENBSUEsQ0FBaUIsR0FBWCxDQUFOLENBQXlCO0NBQ3ZCLENBQWMsQ0FBQSxDQUFkLElBQWMsQ0FBQyxHQUFmO0NBQ0UsR0FBQSxFQUFBLEVBQVEsbUhBQVI7Q0FLUyxDQUFrQixDQUEzQixDQUFBLENBQWlDLEVBQWpDLENBQVEsS0FBUjtDQU5GLElBQWM7Q0FBZCxDQVNFLEVBREYsRUFBQTtDQUNFLENBQVcsSUFBWCxFQUFBLENBQUE7Q0FBQSxDQUNrQixJQUFsQixRQURBLENBQ0E7TUFWRjtDQUFBLENBWVMsQ0FBQSxDQUFULEdBQUEsRUFBUztDQUNOLENBQUQsQ0FBQSxDQUFDLENBQUssRUFBVSxNQUFoQjtDQWJGLElBWVM7Q0FaVCxDQWVjLENBQUEsQ0FBZCxLQUFjLEdBQWQ7Q0FDRSxTQUFBLEVBQUE7Q0FBQyxDQUNDLENBREUsQ0FBSCxDQUFTLEdBQVYsS0FBQSxDQUFBO0NBQ0UsQ0FBWSxDQUFBLEdBQUEsRUFBVixDQUFXO0NBQ1YsQ0FBRCxDQUFBLENBQUEsQ0FBQyxDQUFxQixXQUF0QjtDQURGLFFBQVk7Q0FGRixPQUNaO0NBaEJGLElBZWM7Q0FmZCxDQXFCa0IsQ0FBQSxDQUFsQixLQUFrQixPQUFsQjtBQUNTLENBQVAsRUFBTyxDQUFKLEVBQUgsQ0FBTztDQUNMLElBQUEsVUFBTztRQURUO0NBR0EsRUFBdUIsQ0FBcEIsRUFBSCxDQUFHLElBQVc7Q0FDWixJQUFBLFVBQU87UUFKVDtDQU1BLFlBQU8sR0FBUDtDQTVCRixJQXFCa0I7Q0ExQnBCLEdBSWlCO0NBSmpCOzs7OztBQ0FBO0NBQUEsS0FBQSxrQ0FBQTtLQUFBO29TQUFBOztDQUFBLENBQUEsQ0FBVyxJQUFBLENBQVgsU0FBVzs7Q0FBWCxDQUNBLENBQVksSUFBQSxFQUFaLFdBQVk7O0NBRFosQ0FHQSxDQUF1QixHQUFqQixDQUFOO0NBQ0U7Ozs7O0NBQUE7O0NBQUEsRUFDRSxHQURGO0NBQ0UsQ0FBYyxJQUFkLElBQUEsRUFBQTtDQUFBLENBQ3dCLElBQXhCLFVBREEsTUFDQTtDQUZGLEtBQUE7O0NBQUEsRUFJYyxLQUFBLENBQUMsR0FBZjtDQUVFLFNBQUEsMEJBQUE7QUFBTyxDQUFQLEVBQVcsQ0FBUixFQUFILE1BQUE7Q0FDVyxHQUFULElBQVEsT0FBUixxQ0FBQTtNQURGLEVBQUE7Q0FHRSxDQUFRLENBQUEsQ0FBQyxDQUFULEdBQUE7Q0FBQSxFQUdlLEVBSGYsR0FHQSxJQUFBO0NBQ0EsR0FBRyxHQUFRLENBQVg7Q0FDRSxFQUFTLEVBQVQsQ0FBQSxJQUFBO0NBQ08sRUFBRyxDQUFKLEVBRlIsRUFBQSxFQUFBLEVBRXlDO0NBQ3ZDLEVBQWEsR0FBYixJQUFBLEdBQUE7TUFIRixJQUFBO0NBS0UsRUFBUyxFQUFULENBQUEsSUFBQTtBQUNtQixDQURuQixFQUNlLEVBRGYsS0FDQSxFQUFBO1VBVkY7QUFhYyxDQWJkLEVBYVUsQ0FBZSxDQUFmLENBQUEsQ0FBVixDQUFBLElBYkE7Q0FBQSxHQWdCQSxJQUFBLENBQXdCLFlBQUE7Q0FBdUIsQ0FBTyxHQUFQLEtBQUE7Q0FBQSxDQUFzQixJQUFSLElBQUE7Q0FBZCxDQUF1QyxLQUFULEdBQUE7Q0FBOUIsQ0FBOEQsUUFBZCxFQUFBO0NBQS9GLFNBQWM7Q0FHZCxHQUFHLENBQUgsR0FBQTtDQUNHLENBQUQsRUFBQyxDQUFxQixVQUF0QixFQUFBO1VBdkJKO1FBRlk7Q0FKZCxJQUljOztDQUpkLENBK0JpQixDQUFBLE1BQUMsTUFBbEI7Q0FDRSxNQUFBLEdBQUE7U0FBQSxHQUFBO0NBQUEsRUFBVSxHQUFWLENBQUEsRUFBVztDQUNSLENBQUQsQ0FBRyxDQUFILENBQUMsVUFBRDtDQURGLE1BQVU7Q0FFVCxDQUFELENBQUksQ0FBSCxDQUFELEVBQUEsS0FBaUIsQ0FBakIsT0FBQTtDQWxDRixJQStCaUI7O0NBL0JqQixFQW9DVSxLQUFWLENBQVU7Q0FFUixNQUFBLEdBQUE7U0FBQSxHQUFBO0NBQUEsRUFBVSxHQUFWLENBQUEsRUFBVztDQUVSLENBQStCLENBQTVCLEVBQUgsR0FBRCxDQUFpQyxHQUFoQixHQUFqQjtDQUVHLENBQUQsQ0FBQSxFQUFDLFlBQUQ7Q0FBZ0IsQ0FBRSxVQUFBO0NBRlksV0FFOUI7Q0FGRixDQUdFLENBQUksRUFBSCxJQUg2QjtDQUZsQyxNQUFVO0NBTVQsQ0FBZ0MsQ0FBN0IsQ0FBSCxFQUFVLENBQVgsRUFBa0MsRUFBbEMsRUFBQTtDQUNRLElBQU4sVUFBQSxTQUFBO0NBREYsTUFBaUM7Q0E1Q25DLElBb0NVOztDQXBDVixDQStDZ0IsQ0FBQSxNQUFDLEtBQWpCO0NBQ0UsU0FBQSxFQUFBO1NBQUEsR0FBQTtDQUFBLENBQUEsQ0FBSyxHQUFMLE9BQXFCO0NBQXJCLEVBR1csR0FBWCxFQUFBLENBQVc7Q0FDUixDQUFELENBQUEsQ0FBQSxDQUFDLFVBQUQ7Q0FKRixNQUdXO0NBR1YsQ0FBOEIsQ0FBM0IsQ0FBSCxDQUFTLEdBQVYsQ0FBQSxJQUFBO0NBQStCLENBQUUsTUFBQTtDQUFGLENBQW9CLE1BQVY7Q0FQM0IsT0FPZDtDQXRERixJQStDZ0I7O0NBL0NoQjs7Q0FEMkM7Q0FIN0M7Ozs7O0FDQUE7Q0FBQSxLQUFBLG1DQUFBO0tBQUE7b1NBQUE7O0NBQUEsQ0FBQSxDQUFXLElBQUEsQ0FBWCxTQUFXOztDQUFYLENBQ0EsQ0FBWSxJQUFBLEVBQVosV0FBWTs7Q0FEWixDQUdBLENBQXVCLEdBQWpCLENBQU47Q0FDRTs7Ozs7Q0FBQTs7Q0FBQSxFQUNFLEdBREY7Q0FDRSxDQUFjLElBQWQsSUFBQSxFQUFBO0NBQUEsQ0FDd0IsSUFBeEIsVUFEQSxNQUNBO0NBRkYsS0FBQTs7Q0FBQSxFQUljLEtBQUEsQ0FBQyxHQUFmO0NBRUUsU0FBQSxzREFBQTtBQUFPLENBQVAsRUFBVyxDQUFSLEVBQUgsTUFBQTtDQUNXLEdBQVQsSUFBUSxPQUFSLHFDQUFBO01BREYsRUFBQTtDQUdFLENBQVMsQ0FBQSxDQUFDLENBQUssQ0FBZixFQUFBO0NBQUEsRUFHZSxFQUhmLEdBR0EsSUFBQTtDQUNBLEdBQUcsR0FBUSxDQUFYO0NBQ0UsRUFBUyxFQUFULENBQUEsSUFBQTtDQUNPLEVBQUcsQ0FBSixFQUZSLEVBQUEsRUFBQSxFQUV5QztDQUN2QyxFQUFTLENBQVQsRUFBQSxJQUFBO01BSEYsSUFBQTtDQUtFLEVBQVMsRUFBVCxDQUFBLElBQUE7QUFDbUIsQ0FEbkIsRUFDZSxDQUFjLENBQWlCLENBQS9CLElBQWYsRUFBQTtVQVZGO0FBYWMsQ0FiZCxFQWFVLENBQWUsQ0FBZ0MsQ0FBL0MsQ0FBVixDQUFBLElBYkE7Q0FBQSxHQWdCQSxJQUFBLENBQXdCLGFBQUE7Q0FBd0IsQ0FBUSxJQUFSLElBQUE7Q0FBQSxDQUF3QixJQUFSLElBQUE7Q0FBaEIsQ0FBeUMsS0FBVCxHQUFBO0NBQWhDLENBQWdFLFFBQWQsRUFBQTtDQUFsRyxTQUFjO0NBR2QsR0FBRyxFQUFILEVBQUE7QUFDRSxDQUFBO2dCQUFBLDZCQUFBO2dDQUFBO0NBQ0UsQ0FBQSxFQUFDLENBQXFCLFVBQXRCO0NBREY7MkJBREY7VUF0QkY7UUFGWTtDQUpkLElBSWM7O0NBSmQsQ0FnQ2lCLENBQUEsTUFBQyxNQUFsQjtDQUNFLE1BQUEsR0FBQTtTQUFBLEdBQUE7Q0FBQSxFQUFVLEdBQVYsQ0FBQSxFQUFXO0NBQ1IsQ0FBRCxDQUFHLENBQUgsQ0FBQyxVQUFEO0NBREYsTUFBVTtDQUVULENBQUQsQ0FBSSxDQUFILENBQUQsRUFBQSxLQUFpQixDQUFqQixPQUFBO0NBbkNGLElBZ0NpQjs7Q0FoQ2pCLEVBcUNVLEtBQVYsQ0FBVTtDQUVSLE1BQUEsR0FBQTtTQUFBLEdBQUE7Q0FBQSxFQUFVLEdBQVYsQ0FBQSxFQUFXO0NBRVIsQ0FBK0IsQ0FBNUIsRUFBSCxHQUFELENBQWlDLEdBQWhCLEdBQWpCO0NBRUUsS0FBQSxRQUFBO0NBQUEsQ0FBUyxDQUFBLENBQW1CLENBQWxCLENBQVYsSUFBQTtDQUFBLEdBQ0EsRUFBTSxJQUFOO0NBQVksQ0FBRSxVQUFBO0NBRGQsV0FDQTtDQUNDLENBQUQsQ0FBQSxFQUFDLENBQUQsV0FBQTtDQUpGLENBTUUsQ0FBSSxFQUFILElBTjZCO0NBRmxDLE1BQVU7Q0FTVCxDQUFnQyxDQUE3QixDQUFILEVBQVUsQ0FBWCxFQUFrQyxFQUFsQyxFQUFBO0NBQ1EsSUFBTixVQUFBLFNBQUE7Q0FERixNQUFpQztDQWhEbkMsSUFxQ1U7O0NBckNWLENBbURnQixDQUFBLE1BQUMsS0FBakI7Q0FDRSxTQUFBLEVBQUE7U0FBQSxHQUFBO0NBQUEsQ0FBQSxDQUFLLEdBQUwsT0FBcUI7Q0FBckIsRUFHVyxHQUFYLEVBQUEsQ0FBVztDQUNULEtBQUEsTUFBQTtDQUFBLENBQVMsQ0FBQSxDQUFtQixDQUFsQixDQUFWLEVBQUE7Q0FBQSxDQUMwQixDQUFqQixHQUFULEVBQUEsQ0FBMkI7Q0FDckIsQ0FBSixDQUFHLEVBQU8sWUFBVjtDQURPLFFBQWlCO0NBRXpCLENBQUQsQ0FBQSxFQUFDLENBQUQsU0FBQTtDQVBGLE1BR1c7Q0FNVixDQUE4QixDQUEzQixDQUFILENBQVMsR0FBVixDQUFBLElBQUE7Q0FBK0IsQ0FBRSxNQUFBO0NBQUYsQ0FBb0IsTUFBVjtDQVYzQixPQVVkO0NBN0RGLElBbURnQjs7Q0FuRGhCOztDQUQ0QztDQUg5Qzs7Ozs7QUNDQTtDQUFBLEtBQUEsUUFBQTs7Q0FBQSxDQUFNO0NBQ1MsRUFBQSxDQUFBLG9CQUFBO0NBQ1gsQ0FBWSxFQUFaLEVBQUEsRUFBb0I7Q0FEdEIsSUFBYTs7Q0FBYixFQUdhLE1BQUEsRUFBYjtDQUVFLFNBQUEsaURBQUE7U0FBQSxHQUFBO0NBQUEsQ0FBMkIsQ0FBWCxFQUFBLENBQWhCLEdBQTJCLElBQTNCO0NBQ0csSUFBQSxFQUFELFFBQUE7Q0FEYyxNQUFXO0NBQTNCLEVBR29CLEVBSHBCLENBR0EsV0FBQTtDQUhBLEVBS2MsR0FBZCxHQUFlLEVBQWY7QUFDUyxDQUFQLEdBQUcsSUFBSCxTQUFBO0NBQ0csQ0FBaUIsQ0FBbEIsRUFBQyxFQUFELFVBQUE7VUFGVTtDQUxkLE1BS2M7Q0FMZCxFQVNlLEdBQWYsR0FBZ0IsR0FBaEI7Q0FDRSxFQUFvQixDQUFwQixJQUFBLFNBQUE7Q0FDQyxDQUFpQixDQUFsQixFQUFDLEVBQUQsUUFBQTtDQVhGLE1BU2U7Q0FUZixDQWNzRCxJQUF0RCxHQUFTLEVBQVksRUFBckIsS0FBQTtDQUFxRSxDQUNwRCxDQUFLLENBQUwsSUFBYixFQUFBO0NBRGlFLENBRXZELEdBRnVELEVBRWpFLENBQUE7Q0FGaUUsQ0FHNUMsR0FINEMsR0FHakUsVUFBQTtDQWpCSixPQWNBO0NBTVUsQ0FBNkMsT0FBOUMsRUFBWSxDQUFyQixDQUFBLEtBQUE7Q0FBc0UsQ0FDckQsRUFEcUQsSUFDbEUsRUFBQTtDQURrRSxDQUV4RCxHQUZ3RCxFQUVsRSxDQUFBO0NBRmtFLENBRzdDLEVBSDZDLElBR2xFLFVBQUE7Q0F6Qk8sT0FzQlg7Q0F6QkYsSUFHYTs7Q0FIYixFQStCWSxNQUFBLENBQVo7Q0FFRSxTQUFBLDJEQUFBO1NBQUEsR0FBQTtDQUFBLEdBQUcsRUFBSCxzQkFBQTtDQUNFLEdBQUMsSUFBRCxDQUFBO1FBREY7Q0FBQSxFQUdvQixFQUhwQixDQUdBLFdBQUE7Q0FIQSxFQUltQixFQUpuQixDQUlBLFVBQUE7Q0FKQSxFQU1jLEdBQWQsR0FBZSxFQUFmO0FBQ1MsQ0FBUCxHQUFHLElBQUgsU0FBQTtDQUNFLEVBQW1CLENBQW5CLE1BQUEsTUFBQTtDQUNDLENBQWlCLENBQWxCLEVBQUMsRUFBRCxVQUFBO1VBSFU7Q0FOZCxNQU1jO0NBTmQsRUFXZSxHQUFmLEdBQWdCLEdBQWhCO0NBQ0UsRUFBb0IsQ0FBcEIsSUFBQSxTQUFBO0NBQ0MsQ0FBaUIsQ0FBbEIsRUFBQyxFQUFELFFBQUE7Q0FiRixNQVdlO0NBWGYsRUFlUSxFQUFSLENBQUEsR0FBUztDQUNQLEVBQUEsSUFBTyxDQUFQLElBQUE7QUFFTyxDQUFQLEdBQUcsSUFBSCxRQUFHLENBQUg7Q0FDRyxDQUFpQixHQUFqQixFQUFELFVBQUE7VUFKSTtDQWZSLE1BZVE7Q0FmUixDQXNCc0QsR0FBdEQsQ0FBQSxHQUFTLEVBQVksT0FBckI7Q0FBNkQsQ0FDNUMsQ0FBSyxDQUFMLElBQWIsRUFBQTtDQUR5RCxDQUUvQyxHQUYrQyxFQUV6RCxDQUFBO0NBRnlELENBR3BDLEdBSG9DLEdBR3pELFVBQUE7Q0F6QkosT0FzQkE7Q0FNQyxDQUFvRSxDQUFsRCxDQUFsQixDQUFrQixJQUFTLEVBQVksQ0FBckIsQ0FBbkIsRUFBQTtDQUE0RSxDQUMzRCxFQUQyRCxJQUN4RSxFQUFBO0NBRHdFLENBRW5ELEVBRm1ELElBRXhFLFVBQUE7Q0FoQ00sT0E4QlM7Q0E3RHJCLElBK0JZOztDQS9CWixFQWtFVyxNQUFYO0NBQ0UsR0FBRyxFQUFILHNCQUFBO0NBQ0UsR0FBa0MsSUFBbEMsQ0FBUyxDQUFULENBQXFCLElBQXJCO0NBQ0MsRUFBa0IsQ0FBbEIsV0FBRDtRQUhPO0NBbEVYLElBa0VXOztDQWxFWDs7Q0FERjs7Q0FBQSxDQXlFQSxDQUFpQixHQUFYLENBQU4sT0F6RUE7Q0FBQTs7Ozs7QUNLQTtDQUFBLEtBQUEsbUNBQUE7S0FBQTtvU0FBQTs7Q0FBQSxDQUFNO0NBQ0o7O0NBQWEsQ0FBTSxDQUFOLENBQUEsR0FBQSxPQUFDOztHQUFhLEtBQVI7UUFDakI7Q0FBQSxLQUFBLENBQUEsK0JBQU07Q0FBTixFQUNBLENBQUMsRUFBRDtDQURBLENBSVksQ0FBWixDQUFBLEVBQUE7Q0FKQSxDQUFBLENBT2EsQ0FBWixFQUFELEdBQUE7Q0FQQSxFQVVpQixDQUFoQixFQUFELEdBQUE7Q0FWQSxFQWFtQixDQUFsQixFQUFELEtBQUE7Q0FkRixJQUFhOztDQUFiLEVBZ0JXLEdBaEJYLEdBZ0JBOztDQWhCQSxFQWtCVSxDQUFWLEdBQUEsRUFBVztDQUFELFlBQVM7Q0FsQm5CLElBa0JVOztDQWxCVixFQW1CUSxHQUFSLEdBQVE7O0NBbkJSLEVBb0JVLEtBQVYsQ0FBVTs7Q0FwQlYsRUFxQlksTUFBQSxDQUFaOztDQXJCQSxFQXNCUyxJQUFULEVBQVM7O0NBdEJULEVBdUJRLEdBQVIsR0FBUTtDQUNOLEdBQUMsRUFBRCxRQUFBO0NBRE0sWUFFTixrQkFBQTtDQXpCRixJQXVCUTs7Q0F2QlIsRUEyQlUsS0FBVixDQUFVO0NBQUksR0FBQSxTQUFEO0NBM0JiLElBMkJVOztDQTNCVixFQTZCVSxFQUFBLEdBQVYsQ0FBVztDQUNULEVBQVMsQ0FBUixDQUFELENBQUE7Q0FDQyxHQUFBLEdBQUQsTUFBQSxDQUFBO0NBL0JGLElBNkJVOztDQTdCVixFQWlDWSxDQUFBLEtBQUMsQ0FBYjtDQUNHLEdBQUEsS0FBUyxJQUFWO0NBbENGLElBaUNZOztDQWpDWixFQW9DZ0IsTUFBQSxLQUFoQjtDQUNFLFNBQUEsdUJBQUE7Q0FBQTtDQUFBO1lBQUEsK0JBQUE7NEJBQUE7Q0FDRSxLQUFBLENBQU87Q0FEVDt1QkFEYztDQXBDaEIsSUFvQ2dCOztDQXBDaEIsRUF3Q2MsTUFBQSxHQUFkO0NBQ0UsR0FBUSxLQUFSLElBQU87Q0F6Q1QsSUF3Q2M7O0NBeENkLEVBMkNnQixNQUFBLEtBQWhCO0NBQ0UsR0FBUSxPQUFSLEVBQU87Q0E1Q1QsSUEyQ2dCOztDQTNDaEIsRUE4Q2dCLEVBQUEsSUFBQyxLQUFqQjtDQUVHLEdBQUEsQ0FBRCxJQUFVLElBQVY7Q0FoREYsSUE4Q2dCOztDQTlDaEIsRUFrRGtCLEVBQUEsSUFBQyxPQUFuQjtDQUVHLEdBQUEsQ0FBRCxNQUFZLEVBQVo7Q0FwREYsSUFrRGtCOztDQWxEbEI7O0NBRGlCLE9BQVE7O0NBQTNCLENBMERNO0NBQ0o7Ozs7O0NBQUE7O0NBQUEsRUFDRSxHQURGO0NBQ0UsQ0FBb0IsSUFBcEIsU0FBQSxFQUFBO0NBREYsS0FBQTs7Q0FBQSxFQUdPLEVBQVAsSUFBUTtDQUNOLFNBQUEsbUNBQUE7Q0FBQSxFQUFTLENBQVIsQ0FBRCxDQUFBO0NBQUEsQ0FBQSxDQUNXLENBQVYsRUFBRCxDQUFBO0NBREEsQ0FJQSxDQUFLLEdBQUw7QUFDQSxDQUFBLFVBQUEsaUNBQUE7MEJBQUE7Q0FDRSxHQUFPLElBQVAsT0FBQTtDQUNFLENBQUEsQ0FBVSxDQUFOLE1BQUo7Q0FBQSxDQUNBLENBQUcsT0FBSDtVQUZGO0NBQUEsQ0FHUyxDQUFXLENBQW5CLEdBQVEsQ0FBVDtDQUdBLEdBQUcsSUFBSDtDQUNFO0NBQUEsY0FBQSwrQkFBQTtpQ0FBQTtDQUNFLEdBQU8sUUFBUCxNQUFBO0NBQ0UsQ0FBQSxDQUFhLElBQU4sQ0FBTSxNQUFiO0NBQUEsQ0FDQSxDQUFHLFdBQUg7Y0FGRjtDQUFBLENBR1MsQ0FBYyxDQUF0QixHQUFRLEtBQVQ7Q0FKRixVQURGO1VBUEY7Q0FBQSxNQUxBO0NBbUJDLEdBQUEsRUFBRCxPQUFBO0NBdkJGLElBR087O0NBSFAsRUF5QlEsR0FBUixHQUFRO0NBQ0wsRUFBRyxDQUFILEtBQW1CLEVBQUEsRUFBcEI7Q0FBaUMsQ0FBTyxFQUFDLENBQVIsR0FBQTtDQUFqQyxPQUFVO0NBMUJaLElBeUJROztDQXpCUixFQTRCZSxNQUFDLElBQWhCO0NBQ0UsT0FBQSxFQUFBO0NBQUEsQ0FBQSxDQUFLLEdBQUwsT0FBb0I7Q0FBcEIsQ0FDZ0IsQ0FBVCxDQUFQLEVBQUEsQ0FBZ0I7Q0FDaEIsR0FBRyxFQUFILFlBQUE7Q0FDTyxHQUFELENBQUosVUFBQTtRQUpXO0NBNUJmLElBNEJlOztDQTVCZjs7Q0FEc0IsT0FBUTs7Q0ExRGhDLENBK0ZNO0NBQ0o7Ozs7O0NBQUE7O0NBQUEsRUFDRSxHQURGO0NBQ0UsQ0FBb0IsSUFBcEIsU0FBQSxFQUFBO0NBREYsS0FBQTs7Q0FBQSxFQUdPLEVBQVAsSUFBUTtDQUNOLFNBQUEsUUFBQTtDQUFBLEVBQVMsQ0FBUixDQUFELENBQUE7Q0FBQSxDQUFBLENBQ1csQ0FBVixFQUFELENBQUE7Q0FEQSxDQUlBLENBQUssR0FBTDtBQUNBLENBQUEsVUFBQSxpQ0FBQTswQkFBQTtDQUNFLEdBQU8sSUFBUCxPQUFBO0NBQ0UsQ0FBQSxDQUFVLENBQU4sTUFBSjtDQUFBLENBQ0EsQ0FBRyxPQUFIO1VBRkY7Q0FBQSxDQUdTLENBQVcsQ0FBbkIsR0FBUSxDQUFUO0NBSkYsTUFMQTtDQVdDLEdBQUEsRUFBRCxPQUFBO0NBZkYsSUFHTzs7Q0FIUCxFQWlCUSxHQUFSLEdBQVE7Q0FDTCxFQUFHLENBQUgsS0FBbUIsSUFBcEI7Q0FBbUMsQ0FBTyxFQUFDLENBQVIsR0FBQTtDQUFuQyxPQUFVO0NBbEJaLElBaUJROztDQWpCUixFQW9CZSxNQUFDLElBQWhCO0NBQ0UsT0FBQSxFQUFBO0NBQUEsQ0FBQSxDQUFLLEdBQUwsT0FBb0I7Q0FBcEIsQ0FDZ0IsQ0FBVCxDQUFQLEVBQUEsQ0FBZ0I7Q0FDaEIsR0FBRyxFQUFILFlBQUE7Q0FDTyxHQUFELENBQUosVUFBQTtRQUpXO0NBcEJmLElBb0JlOztDQXBCZjs7Q0FEd0IsT0FBUTs7Q0EvRmxDLENBMEhBLENBQWlCLENBMUhqQixFQTBITSxDQUFOO0NBMUhBOzs7OztBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeHNCQTtDQUFBLENBQUEsQ0FBb0IsSUFBYixFQUFQO0NBRUUsT0FBQSxvQkFBQTtDQUFBLENBQU0sQ0FBTixDQUFBO0NBQUEsRUFFQSxDQUFBO0FB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QUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuVUE7Q0FBQSxLQUFBLHNDQUFBO0tBQUE7b1NBQUE7O0NBQUEsQ0FBQSxDQUFPLENBQVAsR0FBTyxFQUFBOztDQUFQLENBQ0EsQ0FBUSxFQUFSLEVBQVEsR0FBQTs7Q0FEUixDQUVBLENBQWEsSUFBQSxHQUFiLElBQWE7O0NBRmIsQ0FNQSxDQUF1QixHQUFqQixDQUFOO0NBQ0U7Ozs7O0NBQUE7O0NBQUEsRUFBVSxDQUFWLEdBQUEsRUFBVyxJQUFWO0NBQXNCLEVBQUQsQ0FBSyxFQUFSLEdBQUEsSUFBQTtDQUFuQixJQUFVOztDQUFWLEVBRVUsS0FBVixDQUFVO0NBQ1IsU0FBQSx5QkFBQTtTQUFBLEdBQUE7Q0FBQSxHQUFDLEVBQUQsRUFBQSxJQUFBO0NBQUEsRUFHYSxDQUFaLENBQUQsQ0FBQSxFQUFxQjtDQUFPLENBQWEsRUFBYixJQUFBLEdBQUE7Q0FINUIsT0FHYTtDQUhiLEVBTTBCLENBQUEsQ0FBSyxDQUEvQixVQUEwQixHQUExQjtDQUNFLENBQUEsSUFBQSxFQUFBO0NBQUEsQ0FDTyxFQUFDLENBQVIsR0FBQTtDQURBLENBRVEsSUFBUixFQUFBLFdBRkE7Q0FBQSxDQUdTLEtBQVQsQ0FBQTtDQVZGLE9BTTBCO0NBTjFCLENBV0csQ0FBNkIsQ0FBL0IsQ0FBRCxDQUFBLEdBQWlDLEVBQUQsQ0FBaEI7Q0FFTSxDQUE4QixDQUFuQixNQUFvQixDQUFuRCxDQUErQixJQUEvQixJQUFtQjtDQUF3QyxDQUFFLEVBQUgsYUFBQTtDQUEzQixRQUFtQjtDQUZwRCxNQUFnQztDQVhoQyxFQWVxQixDQUFBLENBQUssQ0FBMUIsUUFBQTtDQUNFLENBQVUsTUFBVjtDQUVZLENBQU4sRUFBQSxDQUFLLE1BRFQsQ0FDSSxPQUZJO0NBR04sQ0FBQSxJQUFBLE1BQUE7Q0FBQSxDQUNPLEVBQUMsQ0FBUixPQUFBO0NBREEsQ0FFUSxJQUFSLE1BQUEsU0FGQTtDQUhNLENBTUosRUFBQSxDQUFLLE9BSkw7Q0FLRixDQUFBLElBQUEsTUFBQTtDQUFBLENBQ08sRUFBQyxDQUFSLE9BQUE7Q0FEQSxDQUVRLElBQVIsTUFBQSxnQkFGQTtDQVBNLENBVUosRUFBQSxDQUFLLE9BSkwsQ0FJQTtDQUNGLENBQUEsT0FBQSxHQUFBO0NBQUEsQ0FDTyxFQUFDLENBQVIsT0FBQTtDQURBLENBRVEsSUFBUixHQUZBLEdBRUE7Q0FGQSxDQUdNLEVBQU4sUUFBQSxhQUhBO0NBQUEsQ0FJTSxFQUFOLFFBQUEsNkRBSkE7Q0FYTSxDQWdCSixFQUFBLENBQUssT0FOTCxDQU1BO0NBQ0YsQ0FBQSxVQUFBLENBQUE7Q0FBQSxDQUNPLEVBQUMsQ0FBUixPQUFBO0NBREEsQ0FFUSxJQUFSLE1BQUEsY0FGQTtDQUFBLENBR1MsRUFBQyxDQUFBLEVBQVYsS0FBQTtDQXBCTSxXQWdCSjtVQWhCTjtDQWhCRixPQWVxQjtDQWZyQixDQXVDQSxDQUFJLENBQUgsQ0FBRCxDQUFBLFFBQWtDO0NBdkNsQyxDQXlDMEIsQ0FBUSxDQUFqQyxFQUFELEVBQUEsQ0FBa0MsS0FBbEM7Q0FDRSxLQUFBLE1BQUE7Q0FBQSxDQUFpQyxDQUF4QixDQUFBLENBQVEsQ0FBakIsRUFBQSxDQUFTO0NBQVQsQ0FDYyxDQUFBLENBQWQsQ0FBaUIsQ0FBWCxDQUFXLENBQWpCO0NBQ0MsQ0FBRSxDQUF3QixFQUExQixDQUFELENBQVcsRUFBaUIsTUFBNUI7Q0FDRyxDQUE0QixHQUE1QixJQUFELENBQUEsT0FBQTtDQUE2QixDQUFPLENBQUwsR0FBVyxNQUFYO0NBQUYsQ0FBZ0MsQ0FBQSxFQUFDLE1BQWQsQ0FBQSxDQUFhO0NBRHBDLFdBQ3pCO0NBREYsUUFBMkI7Q0FIN0IsTUFBa0M7Q0FNakMsQ0FBeUIsQ0FBVSxDQUFuQyxJQUFELENBQW9DLElBQXBDLENBQUE7Q0FDRyxJQUFBLElBQUQsTUFBQTtDQURGLE1BQW9DO0NBbER0QyxJQUVVOztDQUZWOztDQUQyQztDQU43Qzs7Ozs7QUNBQTtDQUFBLEtBQUEscUNBQUE7S0FBQTtvU0FBQTs7Q0FBQSxDQUFBLENBQU8sQ0FBUCxHQUFPLEVBQUE7O0NBQVAsQ0FDQSxDQUFlLElBQUEsS0FBZixLQUFlOztDQURmLENBRUEsQ0FBUSxFQUFSLEVBQVEsR0FBQTs7Q0FGUixDQVFBLENBQXVCLEdBQWpCLENBQU47Q0FDRTs7Ozs7Q0FBQTs7Q0FBQSxFQUNFLEdBREY7Q0FDRSxDQUE4QixJQUE5QixNQUFBLGVBQUE7Q0FBQSxDQUMyQixJQUEzQixHQURBLGVBQ0E7Q0FEQSxDQUUyQixJQUEzQixHQUZBLGVBRUE7Q0FGQSxDQUdnQixJQUFoQixJQUhBLEdBR0E7Q0FIQSxDQUlnQixJQUFoQixJQUpBLEdBSUE7Q0FKQSxDQUt5QixJQUF6QixRQUxBLFFBS0E7Q0FORixLQUFBOztDQUFBLEVBUVEsR0FBUixHQUFRO0NBQ0wsRUFBYyxDQUFkLEdBQXNCLElBQXZCLEVBQUE7Q0FURixJQVFROztDQVJSLEVBV1UsS0FBVixDQUFVO0NBQ1IsU0FBQSxFQUFBO0NBQUMsQ0FBRSxFQUFGLEdBQVUsTUFBWDtDQUFvQixDQUFNLENBQUwsQ0FBTSxHQUFPLENBQWI7RUFBb0IsQ0FBQSxHQUFBLEVBQXpDLENBQTBDO0NBQ3hDLEVBQVUsRUFBVCxDQUFELEVBQUE7Q0FDQyxJQUFBLENBQUQsU0FBQTtDQUZGLE1BQXlDO0NBWjNDLElBV1U7O0NBWFYsRUFnQlEsR0FBUixHQUFRO0NBQ04sU0FBQSxjQUFBO1NBQUEsR0FBQTtDQUFBLEVBQXNCLENBQXJCLEVBQUQsRUFBQSxDQUFVO0NBQVYsR0FFQyxFQUFELFVBQUE7U0FDRTtDQUFBLENBQVMsR0FBUCxHQUFGLEVBQUU7Q0FBRixDQUF5QixFQUFOLE1BQUEsS0FBbkI7Q0FBQSxDQUFpRCxDQUFBLEVBQVAsSUFBTyxDQUFQO0NBQVcsSUFBQSxPQUFELE9BQUE7Q0FBcEQsVUFBaUQ7VUFEakM7Q0FGbEIsT0FFQTtDQUZBLEdBTUMsRUFBRCxRQUFBO1NBQ0U7Q0FBQSxDQUFRLEVBQU4sTUFBQTtDQUFGLENBQTBCLEVBQU4sTUFBQTthQUNsQjtDQUFBLENBQVEsRUFBTixVQUFBLElBQUY7Q0FBQSxDQUFtQyxDQUFBLEVBQVAsSUFBTyxLQUFQO0NBQVcsSUFBQSxFQUFELGdCQUFBO0NBQXRDLGNBQW1DO0VBQ25DLFlBRndCO0NBRXhCLENBQVEsRUFBTixNQUFGLElBQUU7Q0FBRixDQUEyQixDQUFBLEVBQVAsSUFBTyxLQUFQO0NBQVcsSUFBQSxFQUFELGdCQUFBO0NBQTlCLGNBQTJCO2NBRkg7WUFBMUI7VUFEYztDQU5oQixPQU1BO0NBTkEsR0FjQyxFQUFELFFBQUE7Q0FkQSxFQWVJLENBQUgsRUFBRCxHQUFvQixTQUFBO0NBQW9CLENBQVEsRUFBQyxFQUFULEVBQUE7Q0FBQSxDQUF5QixJQUFSLEVBQUEscUJBQWpCO0NBQXhDLE9BQVU7Q0FHVixHQUFHLEVBQUgsa0JBQUE7Q0FDRSxDQUFHLEVBQUYsR0FBRCxDQUFBLElBQWdCO0NBQVMsQ0FBTyxFQUFOLEVBQWEsSUFBYjtFQUFxQixDQUFBLE1BQUMsQ0FBaEQ7Q0FDRSxHQUFHLE1BQUgsUUFBQTtDQUFxQixHQUFELENBQUMsS0FBaUMsSUFBbEMsS0FBQTtZQUR5QjtDQUEvQyxRQUErQztRQW5CakQ7Q0FBQSxFQXVCbUIsQ0FBQSxFQUFuQixNQUFBO0NBQWdDLENBQUssQ0FBTCxDQUFNLEVBQU0sRUFBWjtDQXZCaEMsT0F1Qm1CO0NBQ25CLEdBQUcsRUFBSCxLQUFBO0NBQ0UsT0FBQSxHQUFBLENBQVk7Q0FBWixFQUNlLENBQWQsQ0FERCxHQUNBLEdBQUE7UUExQkY7Q0FBQSxDQTRCd0IsQ0FBZSxDQUF0QyxFQUFELEVBQUEsQ0FBd0MsR0FBeEMsQ0FBQTtDQUNFLFdBQUE7Q0FBQSxFQUFBLENBQUMsRUFBTSxFQUFQO0NBQ0MsQ0FBRSxDQUF5QixDQUEzQixFQUFELENBQVcsRUFBaUIsTUFBNUI7Q0FBZ0MsSUFBQSxDQUFELFdBQUE7Q0FBL0IsUUFBNEI7Q0FGOUIsTUFBdUM7Q0E1QnZDLENBZ0N3QixDQUFPLENBQTlCLENBQUQsQ0FBQSxFQUFBLENBQWdDLEdBQWhDO0NBQ0csQ0FBMkMsRUFBM0MsQ0FBSyxFQUFVLENBQWhCLE9BQUEsRUFBZ0I7Q0FBNEIsQ0FBYSxDQUFiLE9BQUM7Q0FEaEIsU0FDN0I7Q0FERixNQUErQjtDQWhDL0IsR0FtQ0MsRUFBRCxJQUFBLEVBQUE7Q0FuQ0EsQ0FvQ0EsRUFBQyxFQUFELEtBQUEsQ0FBbUM7Q0FwQ25DLENBdUNHLEVBQUYsQ0FBUSxDQUFUO0NBQWUsQ0FBUyxFQUFDLEVBQVQsRUFBQTtDQUFzQixFQUFPLEVBQTdDLEdBQUEsQ0FBOEM7Q0FDM0MsR0FBQSxJQUFELENBQTRCLE1BQTVCLFNBQTRCO0NBQTBCLENBQU0sR0FBTixLQUFBO0NBQXRELFNBQWtCO0NBRHBCLE1BQTZDO0NBdkM3QyxDQTJDRyxFQUFGLEVBQUQsTUFBZ0I7Q0FBTSxDQUFTLEVBQUMsRUFBVCxFQUFBO0NBQXNCLEVBQU8sRUFBcEQsR0FBQSxDQUFxRDtDQUNsRCxHQUFBLElBQUQsQ0FBNEIsTUFBNUIsU0FBNEI7Q0FBMEIsQ0FBTSxHQUFOLEtBQUE7Q0FBdEQsU0FBa0I7Q0FEcEIsTUFBb0Q7Q0EzQ3BELEVBK0NpQixDQUFBLENBQUssQ0FBdEIsSUFBQSxJQUFpQjtDQUNmLENBQUEsTUFBQTtDQUFBLENBQ1csRUFBQSxDQUFYLENBQVcsRUFBWDtDQURBLENBRUssQ0FBTCxDQUFNLElBQU47Q0FsREYsT0ErQ2lCO0NBL0NqQixDQW9EQSxDQUE4QixFQUFkLENBQWhCLEVBQUEsQ0FBOEIsQ0FBcEI7Q0FDUCxDQUFFLENBQWtDLEVBQXBDLENBQUQsQ0FBVyxFQUEwQixNQUFyQztDQUF5QyxJQUFBLENBQUQsV0FBQTtDQUF4QyxRQUFxQztDQUR2QyxNQUE4QjtDQUU3QixDQUFELEVBQUMsRUFBRCxHQUFBLENBQStCLEdBQS9CO0NBdkVGLElBZ0JROztDQWhCUixFQXlFWSxNQUFBLENBQVo7Q0FDRyxDQUE0QyxFQUE1QyxDQUFLLEVBQVUsQ0FBaEIsS0FBQSxLQUFnQjtDQUE2QixDQUFPLENBQUwsQ0FBTSxFQUFNLEVBQVo7Q0FEckMsT0FDVjtDQTFFRixJQXlFWTs7Q0F6RVosRUE0RWMsTUFBQSxHQUFkO0NBQ0UsU0FBQSxFQUFBO0NBQUEsR0FBRyxFQUFILENBQUcscUJBQUE7Q0FDQSxDQUFFLENBQUgsQ0FBQyxFQUFELENBQVcsRUFBcUIsTUFBaEM7Q0FDRSxJQUFDLElBQUQsQ0FBQTtDQUNDLENBQThCLEdBQTlCLElBQUQsT0FBQSxDQUFBO0NBRkYsUUFBZ0M7UUFGdEI7Q0E1RWQsSUE0RWM7O0NBNUVkLEVBa0ZTLElBQVQsRUFBUztDQUNOLENBQXlDLEVBQXpDLENBQUssRUFBVSxDQUFoQixLQUFBLEVBQWdCO0NBQTBCLENBQVUsRUFBQyxFQUFULEVBQUE7Q0FEckMsT0FDUDtDQW5GRixJQWtGUzs7Q0FsRlQsQ0FxRlUsQ0FBQSxLQUFWLENBQVc7Q0FDUixDQUFzQyxFQUF0QyxDQUFLLEVBQVUsQ0FBaEIsSUFBZ0IsQ0FBaEI7Q0FBdUMsQ0FBTyxDQUFMLEtBQUEsS0FBcUI7Q0FEdEQsT0FDUjtDQXRGRixJQXFGVTs7Q0FyRlYsRUF3RlMsSUFBVCxFQUFTO0NBQ04sQ0FBNEMsRUFBNUMsQ0FBSyxFQUFVLENBQWhCLEtBQUEsS0FBZ0I7Q0FBNkIsQ0FBVSxFQUFDLEVBQVQsRUFBQTtDQUR4QyxPQUNQO0NBekZGLElBd0ZTOztDQXhGVCxDQTJGVSxDQUFBLEtBQVYsQ0FBVztDQUNSLENBQTRDLEVBQTVDLENBQUssRUFBVSxDQUFoQixLQUFBLEtBQWdCO0NBQTZCLENBQVUsRUFBQyxFQUFULEVBQUE7Q0FBRixDQUE2QixDQUFMLEtBQUEsS0FBcUI7Q0FEbEYsT0FDUjtDQTVGRixJQTJGVTs7Q0EzRlYsRUE4RmMsTUFBQSxHQUFkO0NBQ0UsR0FBRyxFQUFILHVCQUFBO0NBQ0UsR0FBQyxDQUFLLEdBQU4sQ0FBQTtDQUNDLEdBQUEsRUFBRCxDQUFRLENBQVIsT0FBQTtRQUhVO0NBOUZkLElBOEZjOztDQTlGZDs7Q0FEd0M7Q0FSMUM7Ozs7O0FDQUE7Q0FBQSxLQUFBLG9IQUFBO0tBQUE7O29TQUFBOztDQUFBLENBQUEsQ0FBTyxDQUFQLEdBQU8sRUFBQTs7Q0FBUCxDQUNBLENBQWEsSUFBQSxHQUFiLElBQWE7O0NBRGIsQ0FFQSxDQUFjLElBQUEsSUFBZCxLQUFjOztDQUZkLENBR0EsQ0FBaUIsSUFBQSxPQUFqQixLQUFpQjs7Q0FIakIsQ0FJQSxDQUFVLElBQVYsS0FBVTs7Q0FKVixDQVFNO0NBQ0o7Ozs7OztDQUFBOztDQUFBLEVBQVEsR0FBUixHQUFRO0NBQ04sR0FBQyxFQUFELEVBQUEsSUFBQTtDQUFBLEVBR0ksQ0FBSCxFQUFELEdBQW9CLFlBQUE7Q0FIcEIsRUFLMkIsQ0FBckIsRUFBTixDQUFjLEVBQWQsSUFMQTtDQUFBLEVBTUEsQ0FBQyxFQUFEO0NBTkEsSUFPQSxDQUFBLENBQVM7Q0FBTyxDQUFTLEdBQVQsR0FBQTtDQUFlLEVBQS9CLENBQXVDLENBQXZDLEdBQUE7Q0FQQSxHQVFDLEVBQUQsR0FBQTtDQVJBLENBV0EsRUFBd0IsRUFBeEIsRUFBQSxDQUFBO0NBWEEsRUFjQSxDQUF1QixDQUF2QixDQUFBLE9BQUE7Q0FkQSxDQWlCeUMsQ0FBcEIsQ0FBcEIsQ0FBb0IsQ0FBckIsT0FBQTtDQUtBLEdBQUcsQ0FBa0QsQ0FBckQsQ0FBVyxHQUFSO0NBQ0QsQ0FBd0UsQ0FBcEUsQ0FBSCxHQUFELENBQUEsRUFBeUQsQ0FBNUMsR0FBQTtRQXZCZjtDQTBCQyxDQUFnRCxDQUExQixDQUF0QixTQUFELEVBQUEsZ0JBQXVCO0NBM0J6QixJQUFROztDQUFSLEVBNkJTLElBQVQsRUFBUztDQUNQLENBQXdCLENBQXhCLENBQXlCLEVBQXpCLEVBQUEsQ0FBQTtDQUNDLEdBQUEsU0FBRCxFQUFnQjtDQS9CbEIsSUE2QlM7O0NBN0JULEVBaUNXLE1BQVg7Q0FFRSxRQUFBLENBQUE7Q0FBQSxDQUFBLENBQVksR0FBWixHQUFBO0NBQUEsQ0FDd0IsQ0FBeEIsQ0FBQSxFQUFBLEVBQUEsQ0FBd0I7Q0FDdkIsRUFBRyxDQUFILFNBQUQsQ0FBQTtDQXJDRixJQWlDVzs7Q0FqQ1g7O0NBRDBCOztDQVI1QixDQWlEQSxDQUFnQixNQUFBLElBQWhCO0NBQ0UsT0FBQSwrQkFBQTtDQUFBLEVBQWMsQ0FBZCxPQUFBLDJDQUFBO0NBQUEsQ0FDdUIsQ0FBVixDQUFiLElBQWEsRUFBYjtDQURBLEVBRWlCLENBQWpCLFVBQUEsZ01BRkE7Q0FHQSxDQUFvQyxFQUF6QixLQUFBLEVBQUE7Q0FBeUIsQ0FBVSxJQUFULENBQUE7Q0FBRCxDQUEyQixJQUFiLEtBQUEsR0FBZDtDQUFBLENBQXVELElBQVosSUFBQTtDQUEvRSxLQUFXO0NBckRiLEVBaURnQjs7Q0FqRGhCLENBdURNO0NBQ1MsQ0FBTSxDQUFOLENBQUEsQ0FBQSxrQkFBQztDQUNaLG9EQUFBO0NBQUEsRUFBQSxDQUFDLEVBQUQ7Q0FBQSxDQUNBLENBQU0sQ0FBTCxFQUFEO0NBREEsRUFFUyxDQUFSLENBQUQsQ0FBQTtDQUZBLEVBR21CLENBQWxCLEVBQUQsS0FBQTtDQUhBLENBQUEsQ0FLaUIsQ0FBaEIsRUFBRCxPQUFBO0NBTEEsQ0FNQSxDQUFJLENBQUgsRUFBRCxHQUFBLElBQUE7Q0FOQSxFQVFZLENBQVgsRUFBRDtDQUNFLENBQVMsS0FBVCxDQUFBLFlBQUE7Q0FBQSxDQUNlLE1BQWYsS0FBQSxVQURBO0NBQUEsQ0FFVSxNQUFWO0NBRkEsQ0FHWSxNQUFaLEVBQUE7QUFDZSxDQUpmLENBSWEsTUFBYixHQUFBO0NBYkYsT0FRWTtDQVRkLElBQWE7O0NBQWIsRUFnQmUsTUFBQSxJQUFmO0NBRUUsU0FBQSxxQkFBQTtTQUFBLEdBQUE7Q0FBQSxFQUFTLENBQUMsRUFBVixHQUFTO0NBQVQsRUFFZ0IsR0FBaEIsQ0FBdUIsTUFBdkIsUUFBZ0I7Q0FGaEIsRUFHVyxHQUFYLEVBQUE7Q0FBVyxDQUFPLENBQUwsS0FBQTtDQUFLLENBQWtCLFFBQWhCLElBQUE7Q0FBZ0IsQ0FBYSxPQUFYLEdBQUEsQ0FBRjtZQUFsQjtVQUFQO0NBSFgsT0FBQTtDQU1DLENBQUUsRUFBRixHQUFVLENBQVgsS0FBQTtDQUEyQixDQUFRLEVBQU4sQ0FBTSxHQUFOO0NBQUYsQ0FBd0IsQ0FBeEIsRUFBaUIsR0FBQTtDQUFhLEVBQU8sRUFBaEUsRUFBZ0UsQ0FBaEUsQ0FBaUU7Q0FFL0QsV0FBQSxvREFBQTtDQUFBLENBQUMsR0FBa0IsQ0FBRCxDQUFBLENBQWxCLEdBQThCO0FBRzlCLENBQUEsWUFBQSxpQ0FBQTtnQ0FBQTtDQUNFLElBQUMsQ0FBRCxJQUFBLFFBQUE7Q0FERixRQUhBO0FBS0EsQ0FBQTtjQUFBLCtCQUFBOzBCQUFBO0NBQ0UsRUFBQSxFQUFDLFVBQUQ7Q0FERjt5QkFQOEQ7Q0FBaEUsTUFBZ0U7Q0F4QmxFLElBZ0JlOztDQWhCZixFQWtDaUIsR0FBQSxHQUFDLE1BQWxCO0NBQ0UsU0FBQSxJQUFBO1NBQUEsR0FBQTtDQUFBLEdBQUcsRUFBSCxZQUFBO0NBQ0UsQ0FBaUQsQ0FBcEMsQ0FBQSxFQUFiLEVBQUEsR0FBNkM7Q0FBN0MsQ0FDOEIsQ0FBakIsQ0FBQSxFQUFiLEVBQUE7Q0FBOEIsQ0FBTSxFQUFMLE1BQUE7Q0FEL0IsU0FDYTtDQURiLENBR0EsQ0FBbUIsR0FBYixDQUFOLENBQUEsQ0FBbUI7Q0FDaEIsQ0FBMkIsR0FBM0IsR0FBRCxFQUFBLE9BQUE7Q0FBNEIsQ0FBTSxDQUFMLEdBQVcsTUFBWDtDQURaLFdBQ2pCO0NBREYsUUFBbUI7Q0FIbkIsRUFNZSxDQUFkLEVBQW9CLEVBQXJCLEtBQWU7Q0FDUixFQUFQLENBQWMsQ0FBZCxDQUFNLFNBQU47UUFUYTtDQWxDakIsSUFrQ2lCOztDQWxDakIsRUE2Q29CLEdBQUEsR0FBQyxTQUFyQjtDQUNFLENBQXlCLENBQXRCLENBQUEsRUFBSCxPQUFHO0NBQ0EsRUFBRyxDQUFILEVBQXFDLEtBQXRDLEVBQWdDLEVBQWhDO1FBRmdCO0NBN0NwQixJQTZDb0I7O0NBN0NwQjs7Q0F4REY7O0NBQUEsQ0EwR007Q0FFUyxDQUFNLENBQU4sQ0FBQSxFQUFBLG1CQUFDO0NBQ1osb0RBQUE7Q0FBQSxvREFBQTtDQUFBLEVBQUEsQ0FBQyxFQUFEO0NBQUEsRUFDVSxDQUFULEVBQUQ7Q0FEQSxFQUdzQixDQUFyQixFQUFELFFBQUE7Q0FIQSxDQUlBLEVBQUMsRUFBRCxDQUFBLE1BQUEsQ0FBZTtDQUpmLEdBS0MsRUFBRCxJQUFBLElBQWU7Q0FOakIsSUFBYTs7Q0FBYixFQVFNLENBQU4sS0FBTTtDQUNILEdBQUEsS0FBRCxJQUFBLENBQWU7Q0FUakIsSUFRTTs7Q0FSTixFQVdlLE1BQUMsSUFBaEI7Q0FDRSxHQUFHLEVBQUg7Q0FDRSxFQUFJLENBQUgsSUFBRDtDQUFBLEVBQ1UsQ0FBVCxDQURELENBQ0EsRUFBQTtDQUNNLElBQU4sVUFBQSxlQUFBO1FBSlc7Q0FYZixJQVdlOztDQVhmLEVBaUJlLE1BQUMsSUFBaEI7Q0FDRSxTQUFBLGdCQUFBO0NBQUEsRUFBUyxHQUFULEVBQUE7Q0FBQSxDQUN5QyxDQUE1QixDQUFBLEVBQWIsRUFBYSxDQUFBO0NBR2IsR0FBRyxFQUFIO0NBQ0UsQ0FBQSxDQUFPLENBQVAsSUFBQTtDQUFBLENBQ3FCLENBQWpCLENBQUgsRUFBRCxDQUFBLENBQUE7Q0FEQSxFQUVVLENBQVQsQ0FGRCxDQUVBLEVBQUE7UUFQRjtBQVVPLENBQVAsR0FBRyxFQUFILEVBQUE7Q0FDRSxFQUFRLENBQVIsSUFBQTtDQUFlLENBQVMsS0FBVCxHQUFBLFdBQUE7Q0FBQSxDQUEwQyxNQUFWLEVBQUE7Q0FBL0MsU0FBUTtDQUFSLENBQzZCLENBQWpCLENBQVgsRUFBVyxFQUFaO0NBQTZCLENBQUssRUFBTCxNQUFBO0NBQVUsRUFBM0IsQ0FBbUMsQ0FBbkMsS0FBQTtDQURaLENBRTZCLENBQWpCLENBQVgsRUFBVyxFQUFaO0NBQ0MsRUFBRCxDQUFDLENBQUQsR0FBUyxPQUFUO01BSkYsRUFBQTtDQU1FLEdBQUMsRUFBRCxFQUFBLENBQUE7Q0FDQyxHQUFBLEVBQUQsRUFBUyxDQUFULE1BQUE7UUFsQlc7Q0FqQmYsSUFpQmU7O0NBakJmOztDQTVHRjs7Q0FBQSxDQWlKQSxDQUFpQixHQUFYLENBQU4sTUFqSkE7Q0FBQTs7Ozs7QUNBQTtDQUFBLEtBQUEsMkJBQUE7S0FBQTtvU0FBQTs7Q0FBQSxDQUFBLENBQU8sQ0FBUCxHQUFPLEVBQUE7O0NBQVAsQ0FDQSxDQUFXLElBQUEsQ0FBWCxJQUFXOztDQURYLENBSU07Q0FDSjs7Ozs7Q0FBQTs7Q0FBQSxFQUFVLENBQVYsR0FBQSxFQUFXLEVBQVY7Q0FBc0IsRUFBRCxDQUFLLEVBQVIsQ0FBQSxNQUFBO0NBQW5CLElBQVU7O0NBQVYsRUFHRSxHQURGO0NBQ0UsQ0FBZ0IsSUFBaEIsS0FBQSxFQUFBO0NBSEYsS0FBQTs7Q0FBQSxFQUtVLEtBQVYsQ0FBVTtDQUNSLFNBQUEsRUFBQTtDQUFBLEdBQUMsRUFBRCxFQUFBLEtBQUE7Q0FFQyxDQUFFLEVBQUYsQ0FBUSxRQUFUO0NBQWUsQ0FBTSxFQUFMLElBQUEsR0FBRDtDQUFtQixFQUFPLEVBQXpDLEdBQUEsQ0FBMEM7Q0FDeEMsRUFBUyxFQUFSLEdBQUQ7Q0FDQyxFQUFHLENBQUosQ0FBQyxJQUFtQixNQUFwQixJQUFvQjtDQUFxQixDQUFNLEdBQU4sS0FBQTtDQUF6QyxTQUFVO0NBRlosTUFBeUM7Q0FSM0MsSUFLVTs7Q0FMVixDQVlXLENBQUEsTUFBWDtDQUNFLFNBQUEsSUFBQTtTQUFBLEdBQUE7Q0FBQSxDQUFhLENBQUYsR0FBWCxFQUFBLEtBQTJCO0NBQTNCLEVBS08sQ0FBUCxFQUFBO0NBQU8sQ0FDRyxFQUFDLEVBQVQsQ0FBZ0IsQ0FBaEI7Q0FESyxDQUVDLEVBQU4sSUFBQTtDQUZLLENBR00sRUFITixJQUdMLENBQUE7Q0FISyxDQUlRLEVBQUEsR0FBYixDQUFBLEdBQWE7Q0FUZixPQUFBO0NBV0MsQ0FBRSxDQUFvQixDQUF0QixDQUFRLENBQVQsR0FBd0IsSUFBeEI7Q0FDRyxDQUEwQixHQUExQixHQUFELENBQUEsTUFBQTtDQUEyQixDQUFPLENBQUwsQ0FBUyxNQUFUO0NBRFIsU0FDckI7Q0FERixNQUF1QjtDQXhCekIsSUFZVzs7Q0FaWDs7Q0FEd0I7O0NBSjFCLENBZ0NBLENBQWlCLEdBQVgsQ0FBTixJQWhDQTtDQUFBOzs7OztBQ0FBO0NBQUEsS0FBQSwyQkFBQTtLQUFBO29TQUFBOztDQUFBLENBQUEsQ0FBTyxDQUFQLEdBQU8sRUFBQTs7Q0FBUCxDQUNBLENBQVEsRUFBUixFQUFRLEdBQUE7O0NBRFIsQ0FLQSxDQUF1QixHQUFqQixDQUFOO0NBQ0U7Ozs7O0NBQUE7O0NBQUEsRUFBVSxDQUFWLEdBQUEsRUFBVyxLQUFWO0NBQXNCLEVBQUQsQ0FBSyxFQUFSLEdBQUEsSUFBQTtDQUFuQixJQUFVOztDQUFWLEVBRVUsS0FBVixDQUFVO0NBQ1IsU0FBQSxFQUFBO0NBQUMsQ0FBRSxFQUFGLEdBQVUsTUFBWDtDQUFvQixDQUFNLENBQUwsQ0FBTSxHQUFPLENBQWI7RUFBb0IsQ0FBQSxHQUFBLEVBQXpDLENBQTBDO0NBQ3hDLFdBQUEsdUJBQUE7Q0FBQSxFQUF3QixDQUF4QixDQUFDLENBQTZCLEVBQTlCLE1BQVc7Q0FBWCxFQUdhLENBQUEsQ0FBWixDQUFZLEVBQWI7Q0FIQSxFQU0wQixDQUFBLENBQUssR0FBL0IsUUFBMEIsR0FBMUI7Q0FDRSxDQUFBLElBQUEsSUFBQTtDQUFBLENBQ08sR0FBUCxLQUFBO0NBREEsQ0FFUSxJQUFSLElBQUEsU0FGQTtDQUFBLENBR1MsS0FBVCxHQUFBO0NBVkYsU0FNMEI7Q0FOMUIsQ0FXRyxDQUE2QixDQUFoQyxDQUFDLEdBQUQsQ0FBaUMsRUFBRCxDQUFoQjtDQUVNLENBQThCLENBQW5CLE1BQW9CLENBQW5ELENBQStCLE1BQS9CLEVBQW1CO0NBQXdDLENBQUUsRUFBSCxlQUFBO0NBQTNCLFVBQW1CO0NBRnBELFFBQWdDO0NBWGhDLEVBZXFCLENBQUEsQ0FBSyxHQUExQixNQUFBO0NBQ0UsQ0FBVSxNQUFWLEVBQUE7Q0FFWSxDQUFOLEVBQUEsQ0FBSyxPQUFMLENBREosTUFEUTtDQUdOLENBQUEsSUFBQSxRQUFBO0NBQUEsQ0FDTyxHQUFQLFNBQUE7Q0FEQSxDQUVRLElBQVIsUUFBQSxPQUZBO0NBSE0sQ0FNSixFQUFBLENBQUssT0FBTCxFQUpBO0NBS0YsQ0FBQSxJQUFBLFFBQUE7Q0FBQSxDQUNPLEdBQVAsU0FBQTtDQURBLENBRVEsSUFBUixRQUFBLGNBRkE7Q0FQTSxDQVVKLEVBQUEsQ0FBSyxRQUFMLENBSkE7Q0FLRixDQUFBLE9BQUEsS0FBQTtDQUFBLENBQ08sR0FBUCxTQUFBO0NBREEsQ0FFUSxJQUFSLEdBRkEsS0FFQTtDQUZBLENBR00sRUFBTixVQUFBLFdBSEE7Q0FBQSxDQUlNLEVBQU4sVUFBQSwyREFKQTtDQVhNLGFBVUo7WUFWTjtDQWhCRixTQWVxQjtDQWZyQixDQWtDQSxDQUFJLEVBQUgsQ0FBRCxFQUFBLE1BQWtDO0NBbENsQyxDQW9DMEIsQ0FBUSxFQUFqQyxDQUFELEVBQUEsQ0FBa0MsS0FBbEM7Q0FDRyxDQUFFLENBQWlDLEVBQW5DLENBQUQsQ0FBVyxFQUF5QixRQUFwQztDQUF3QyxJQUFBLElBQUQsVUFBQTtDQUF2QyxVQUFvQztDQUR0QyxRQUFrQztDQUdqQyxDQUF5QixDQUFVLEVBQW5DLEdBQUQsQ0FBb0MsS0FBcEMsQ0FBQTtDQUNHLElBQUEsSUFBRCxRQUFBO0NBREYsUUFBb0M7Q0F4Q3RDLE1BQXlDO0NBSDNDLElBRVU7O0NBRlY7O0NBRDRDO0NBTDlDOzs7OztBQ0FBO0NBQUEsS0FBQSxxQkFBQTtLQUFBOztvU0FBQTs7Q0FBQSxDQUFBLENBQU8sQ0FBUCxHQUFPLEVBQUE7O0NBQVAsQ0FDQSxDQUFRLEVBQVIsRUFBUSxHQUFBOztDQURSLENBR007Q0FDSjs7Ozs7Ozs7Q0FBQTs7Q0FBQSxFQUFVLENBQVYsR0FBQSxDQUFDLENBQVU7Q0FBWSxFQUFELENBQUssRUFBUixDQUFBLE1BQUE7Q0FBbkIsSUFBVTs7Q0FBVixFQUVRLEdBQVIsR0FBUTtDQUFJLEdBQUEsRUFBRCxPQUFBO0NBRlgsSUFFUTs7Q0FGUixFQUlVLEtBQVYsQ0FBVTtDQUNSLFNBQUEsRUFBQTtDQUFDLEdBQUEsU0FBRCxHQUFBO1NBQ0U7Q0FBQSxDQUFTLEdBQVAsR0FBRixFQUFFO0NBQUYsQ0FBeUIsRUFBTixNQUFBLEdBQW5CO0NBQUEsQ0FBK0MsQ0FBQSxFQUFQLElBQU8sQ0FBUDtDQUFXLElBQUEsS0FBRCxTQUFBO0NBQWxELFVBQStDO1VBRC9CO0NBRFYsT0FDUjtDQUxGLElBSVU7O0NBSlYsRUFTUSxHQUFSLEdBQVE7Q0FDTixTQUFBLEVBQUE7Q0FBQSxHQUFDLEVBQUQsRUFBQTtDQUdDLENBQUUsRUFBRixDQUFRLEVBQVQsTUFBQTtDQUFrQixDQUFNLENBQUwsQ0FBTSxHQUFPLENBQWI7RUFBb0IsQ0FBQSxDQUFBLElBQXZDLENBQXdDO0NBQ3RDLEVBQVEsQ0FBUixDQUFDLEdBQUQ7Q0FHQyxDQUFFLEdBQUYsRUFBRCxRQUFBO0NBQWtCLENBQVEsRUFBTixNQUFBLENBQUY7Q0FBQSxDQUEyQixFQUFOLE1BQUE7RUFBbUIsQ0FBQSxDQUFBLEtBQUMsQ0FBM0Q7QUFFUyxDQUFQLEdBQUcsS0FBSCxDQUFBO0NBQ0UsQ0FBbUQsQ0FBdkMsQ0FBMEIsQ0FBckMsR0FBRCxJQUFBLEdBQVk7Q0FBdUMsQ0FBTyxDQUFMLEVBQU0sU0FBTjtDQUFyRCxhQUFZO0NBQVosQ0FHcUIsRUFBckIsQ0FBQyxHQUFELElBQUE7Q0FIQSxDQUlxQixHQUFwQixHQUFELENBQUEsQ0FBQSxFQUFBO0NBSkEsQ0FLcUIsR0FBcEIsRUFBRCxDQUFBLElBQUE7TUFORixNQUFBO0NBUUUsQ0FBcUQsQ0FBekMsQ0FBMEIsQ0FBckMsQ0FBVyxFQUFaLElBQUEsR0FBWTtDQUF5QyxDQUFPLENBQUwsRUFBTSxTQUFOO0NBQXZELGFBQVk7WUFSZDtDQUFBLEVBV0ksQ0FBSixDQUFDLElBQW1CLENBQXBCLE1BQW9CO0NBQWtCLENBQVcsRUFBSSxLQUFmLEdBQUE7Q0FBQSxDQUFrQyxFQUFJLENBQVgsT0FBQTtDQUFqRSxXQUFVO0NBWFYsQ0FZQSxHQUFDLENBQUQsRUFBZ0MsRUFBaEMsQ0FBQTtDQUVDLEdBQUQsQ0FBQyxHQUFRLFNBQVQ7Q0FoQkYsUUFBMEQ7Q0FKNUQsTUFBdUM7Q0FiekMsSUFTUTs7Q0FUUixFQW9DRSxHQURGO0NBQ0UsQ0FBdUIsSUFBdkIsY0FBQTtDQXBDRixLQUFBOztDQUFBLEVBc0NTLElBQVQsRUFBUztBQUVVLENBQWpCLEdBQUcsRUFBSCxHQUFBO0NBQ0csR0FBQSxDQUFLLFVBQU4sT0FBQTtRQUhLO0NBdENULElBc0NTOztDQXRDVCxFQTJDTSxDQUFOLEtBQU07Q0FFSixTQUFBLEVBQUE7Q0FBQSxFQUFrQixDQUFqQixFQUFELEdBQUE7Q0FDQyxDQUFFLENBQXFCLENBQXZCLENBQVEsQ0FBVCxHQUF3QixJQUF4QjtDQUE0QixJQUFBLENBQUQsU0FBQTtDQUEzQixNQUF3QjtDQTlDMUIsSUEyQ007O0NBM0NOLEVBZ0RNLENBQU4sS0FBTTtDQUVKLEVBQVEsQ0FBUCxFQUFELEVBQWlCO0NBQ2hCLENBQUUsRUFBRixDQUFRLENBQVQsT0FBQTtDQW5ERixJQWdETTs7Q0FoRE4sRUFxRE8sRUFBUCxJQUFPO0NBQ0wsR0FBQyxFQUFEO0NBQ0MsR0FBQSxDQUFLLElBQU4sSUFBQTtDQXZERixJQXFETzs7Q0FyRFAsRUF5RFcsTUFBWDtDQUVFLFNBQUEsRUFBQTtDQUFBLEVBQXNCLENBQXJCLEVBQUQsR0FBQSxFQUFzQjtDQUNyQixDQUFFLENBQXFCLENBQXZCLENBQVEsQ0FBVCxHQUF3QixJQUF4QjtDQUE0QixJQUFBLENBQUQsU0FBQTtDQUEzQixNQUF3QjtDQTVEMUIsSUF5RFc7O0NBekRYLEVBOERZLE1BQUEsQ0FBWjtDQUNFLFNBQUEsRUFBQTtDQUFBLEdBQUcsRUFBSCxDQUFHLG1CQUFBO0NBQ0EsQ0FBRSxDQUFILENBQUMsQ0FBUSxDQUFULEdBQTRCLE1BQTVCO0NBQ0UsRUFBUSxDQUFSLENBQUMsS0FBRDtDQUFBLElBQ0MsSUFBRCxDQUFBO0NBQ0MsQ0FBNEIsR0FBNUIsSUFBRCxLQUFBLEdBQUE7Q0FIRixRQUE0QjtRQUZwQjtDQTlEWixJQThEWTs7Q0E5RFo7O0NBRHFCOztDQUh2QixDQXlFQSxDQUFpQixHQUFYLENBQU4sQ0F6RUE7Q0FBQTs7Ozs7QUNBQTtDQUFBLEtBQUEsMkJBQUE7S0FBQTtvU0FBQTs7Q0FBQSxDQUFBLENBQU8sQ0FBUCxHQUFPLEVBQUE7O0NBQVAsQ0FDQSxDQUFRLEVBQVIsRUFBUSxHQUFBOztDQURSLENBU0EsQ0FBdUIsR0FBakIsQ0FBTjtDQUNFOzs7OztDQUFBOztDQUFBLEVBQVUsQ0FBVixHQUFBLEVBQVcsS0FBVjtDQUFzQixFQUFELENBQUssRUFBUixPQUFBLENBQUE7Q0FBbkIsSUFBVTs7Q0FBVixFQUVVLEtBQVYsQ0FBVTtDQUVSLFNBQUEsRUFBQTtDQUFDLENBQUUsRUFBRixHQUFVLE1BQVg7Q0FBb0IsQ0FBTyxFQUFOLEVBQUQsQ0FBZSxDQUFkO0VBQXdCLENBQUEsR0FBQSxFQUE3QyxDQUE4QztDQUM1QyxXQUFBLEVBQUE7Q0FBQSxFQUE0QixDQUE1QixDQUFDLENBQWlDLEVBQWxDLFVBQVc7Q0FBWCxFQUdhLENBQUEsQ0FBWixHQUFEO0NBSEEsRUFNcUIsQ0FBQSxDQUFLLEdBQTFCLE1BQUE7Q0FDRSxDQUFVLE1BQVYsRUFBQTtDQUNZLEdBQU4sQ0FBSyxPQUFMLENBQUE7Q0FDRixDQUFBLElBQUEsUUFBQTtDQUFBLENBQ08sR0FBUCxTQUFBO0NBREEsQ0FFUSxJQUFSLFFBQUEsQ0FGQTtDQUFBLENBR1UsRUFIVixJQUdBLE1BQUE7Q0FMTSxDQU1KLEVBQUEsQ0FBSyxRQUFMLENBTEE7Q0FNRixDQUFBLE1BQUEsTUFBQTtDQUFBLENBQ08sR0FBUCxTQUFBO0NBREEsQ0FFUSxJQUFSLFFBQUEsVUFGQTtDQUFBLENBR1MsRUFBQyxHQUFWLENBQWdFLENBQThCLEdBQXBGLEVBQVYsRUFBZ0UsRUFBOEIsQ0FBOUQ7Q0FIaEMsQ0FJVSxFQUpWLElBSUEsTUFBQTtDQVhNLENBWUosRUFBQSxDQUFLLE9BQUwsRUFOQTtDQU9GLENBQUEsS0FBQSxPQUFBO0NBQUEsQ0FDTyxHQUFQLFNBQUE7Q0FEQSxDQUVRLElBQVIsQ0FGQSxPQUVBO0NBRkEsQ0FHVyxFQUhYLEtBR0EsS0FBQTtDQWhCTSxhQVlKO1lBWk47Q0FQRixTQU1xQjtDQXFCckIsRUFBQSxDQUFHLENBQUMsRUFBTyxDQUFYO0NBQ0UsQ0FBRyxHQUFGLEVBQUQsR0FBQSxFQUFnQjtDQUFTLENBQU0sQ0FBTCxFQUFNLEVBQU8sS0FBYjtFQUFvQixDQUFBLE1BQUMsQ0FBRCxFQUE5QztDQUNHLEVBQUQsRUFBQyxLQUFELFNBQUE7Q0FERixVQUE4QztNQURoRCxJQUFBO0NBS0UsRUFBQSxFQUFDLEtBQUQ7Q0FBVyxDQUFRLEdBQUMsQ0FBVCxDQUFnQixLQUFoQjtDQUFBLENBQW1DLEVBQVYsS0FBVSxFQUFBLENBQVY7Q0FBcEMsV0FBQTtVQWhDRjtDQUFBLENBa0NBLENBQUksRUFBSCxDQUFELEVBQUEsTUFBa0M7Q0FsQ2xDLENBb0MwQixDQUFRLEVBQWpDLENBQUQsRUFBQSxDQUFrQyxLQUFsQztDQUNHLENBQUUsQ0FBc0MsRUFBeEMsQ0FBRCxHQUF5QyxHQUF6QixLQUFoQjtDQUE2QyxJQUFBLElBQUQsVUFBQTtDQUE1QyxVQUF5QztDQUQzQyxRQUFrQztDQUdqQyxDQUF5QixDQUFVLEVBQW5DLEdBQUQsQ0FBb0MsS0FBcEMsQ0FBQTtDQUNHLElBQUEsSUFBRCxRQUFBO0NBREYsUUFBb0M7Q0F4Q3RDLE1BQTZDO0NBSi9DLElBRVU7O0NBRlY7O0NBRDRDO0NBVDlDIiwic291cmNlc0NvbnRlbnQiOlsiYXNzZXJ0ID0gY2hhaS5hc3NlcnRcblByb2JsZW1SZXBvcnRlciA9IHJlcXVpcmUgJy4uL2FwcC9qcy9Qcm9ibGVtUmVwb3J0ZXInXG5cbmRlc2NyaWJlIFwiUHJvYmxlbVJlcG9ydGVyXCIsIC0+XG4gIGJlZm9yZSAtPlxuICAgIGdldENsaWVudCA9IC0+XG4gICAgICByZXR1cm4gXCIxMjM0XCJcbiAgICBAb2xkQ29uc29sZUVycm9yID0gY29uc29sZS5lcnJvclxuICAgIEBwciA9IG5ldyBQcm9ibGVtUmVwb3J0ZXIoXCJodHRwOi8vbG9jYWxob3N0OjgwODAvcHJvYmxlbV9yZXBvcnRzXCIsIFwiMS4yXCIsIGdldENsaWVudClcbiAgYWZ0ZXIgLT5cbiAgICBAcHIucmVzdG9yZSgpXG4gICAgYXNzZXJ0LmVxdWFsIGNvbnNvbGUuZXJyb3IsIEBvbGRDb25zb2xlRXJyb3JcblxuICBpdCBcInBvc3RzIGVycm9yIG9uIGNvbnNvbGUuZXJyb3JcIiwgLT5cbiAgICBwb3N0ID0gc2lub24uc3R1YigkLCBcInBvc3RcIilcbiAgICBjb25zb2xlLmVycm9yIFwiU29tZSBlcnJvciBtZXNzYWdlXCJcblxuICAgIGFzc2VydC5pc1RydWUgcG9zdC5jYWxsZWRPbmNlXG4gICAgYXNzZXJ0LmVxdWFsIHBvc3QuYXJnc1swXVsxXS52ZXJzaW9uLCBcIjEuMlwiXG4gICAgYXNzZXJ0LmVxdWFsIHBvc3QuYXJnc1swXVsxXS5jbGllbnQsIFwiMTIzNFwiXG5cbiAgICBwb3N0LnJlc3RvcmUoKVxuIiwiYXNzZXJ0ID0gY2hhaS5hc3NlcnRcbkRyb3Bkb3duUXVlc3Rpb24gPSByZXF1aXJlKCdmb3JtcycpLkRyb3Bkb3duUXVlc3Rpb25cblVJRHJpdmVyID0gcmVxdWlyZSAnLi9oZWxwZXJzL1VJRHJpdmVyJ1xuXG4jIGNsYXNzIE1vY2tMb2NhdGlvbkZpbmRlclxuIyAgIGNvbnN0cnVjdG9yOiAgLT5cbiMgICAgIF8uZXh0ZW5kIEAsIEJhY2tib25lLkV2ZW50c1xuXG4jICAgZ2V0TG9jYXRpb246IC0+XG4jICAgc3RhcnRXYXRjaDogLT5cbiMgICBzdG9wV2F0Y2g6IC0+XG5cbmRlc2NyaWJlICdEcm9wZG93blF1ZXN0aW9uJywgLT5cbiAgY29udGV4dCAnV2l0aCBhIGZldyBvcHRpb25zJywgLT5cbiAgICBiZWZvcmVFYWNoIC0+XG4gICAgICBAbW9kZWwgPSBuZXcgQmFja2JvbmUuTW9kZWwoKVxuICAgICAgQHF1ZXN0aW9uID0gbmV3IERyb3Bkb3duUXVlc3Rpb25cbiAgICAgICAgb3B0aW9uczogW1snYScsICdBcHBsZSddLCBbJ2InLCAnQmFuYW5hJ11dXG4gICAgICAgIG1vZGVsOiBAbW9kZWxcbiAgICAgICAgaWQ6IFwicTFcIlxuXG4gICAgaXQgJ2FjY2VwdHMga25vd24gdmFsdWUnLCAtPlxuICAgICAgQG1vZGVsLnNldChxMTogJ2EnKVxuICAgICAgYXNzZXJ0LmVxdWFsIEBtb2RlbC5nZXQoJ3ExJyksICdhJ1xuICAgICAgYXNzZXJ0LmlzRmFsc2UgQHF1ZXN0aW9uLiQoXCJzZWxlY3RcIikuaXMoXCI6ZGlzYWJsZWRcIilcblxuICAgIGl0ICdpcyBkaXNhYmxlZCB3aXRoIHVua25vd24gdmFsdWUnLCAtPlxuICAgICAgQG1vZGVsLnNldChxMTogJ3gnKVxuICAgICAgYXNzZXJ0LmVxdWFsIEBtb2RlbC5nZXQoJ3ExJyksICd4J1xuICAgICAgYXNzZXJ0LmlzVHJ1ZSBAcXVlc3Rpb24uJChcInNlbGVjdFwiKS5pcyhcIjpkaXNhYmxlZFwiKVxuXG4gICAgaXQgJ2lzIG5vdCBkaXNhYmxlZCB3aXRoIGVtcHR5IHZhbHVlJywgLT5cbiAgICAgIEBtb2RlbC5zZXQocTE6IG51bGwpXG4gICAgICBhc3NlcnQuZXF1YWwgQG1vZGVsLmdldCgncTEnKSwgbnVsbFxuICAgICAgYXNzZXJ0LmlzRmFsc2UgQHF1ZXN0aW9uLiQoXCJzZWxlY3RcIikuaXMoXCI6ZGlzYWJsZWRcIilcblxuICAgIGl0ICdpcyByZWVuYWJsZWQgd2l0aCBzZXR0aW5nIHZhbHVlJywgLT5cbiAgICAgIEBtb2RlbC5zZXQocTE6ICd4JylcbiAgICAgIGFzc2VydC5lcXVhbCBAbW9kZWwuZ2V0KCdxMScpLCAneCdcbiAgICAgIEBxdWVzdGlvbi5zZXRPcHRpb25zKFtbJ2EnLCAnQXBwbGUnXSwgWydiJywgJ0JhbmFuYSddLCBbJ3gnLCAnS2l3aSddXSlcbiAgICAgIGFzc2VydC5pc0ZhbHNlIEBxdWVzdGlvbi4kKFwic2VsZWN0XCIpLmlzKFwiOmRpc2FibGVkXCIpXG5cbiIsImFzc2VydCA9IGNoYWkuYXNzZXJ0XG5Mb2NhbERiID0gcmVxdWlyZSBcIi4uL2FwcC9qcy9kYi9Mb2NhbERiXCJcbkh5YnJpZERiID0gcmVxdWlyZSBcIi4uL2FwcC9qcy9kYi9IeWJyaWREYlwiXG5kYl9xdWVyaWVzID0gcmVxdWlyZSBcIi4vZGJfcXVlcmllc1wiXG5cbiMgTm90ZTogQXNzdW1lcyBsb2NhbCBkYiBpcyBzeW5jaHJvbm91cyFcbmZhaWwgPSAtPlxuICB0aHJvdyBuZXcgRXJyb3IoXCJmYWlsZWRcIilcblxuZGVzY3JpYmUgJ0h5YnJpZERiJywgLT5cbiAgYmVmb3JlRWFjaCAtPlxuICAgIEBsb2NhbCA9IG5ldyBMb2NhbERiKClcbiAgICBAcmVtb3RlID0gbmV3IExvY2FsRGIoKVxuICAgIEBoeWJyaWQgPSBuZXcgSHlicmlkRGIoQGxvY2FsLCBAcmVtb3RlKVxuXG4gICAgQGxjID0gQGxvY2FsLmFkZENvbGxlY3Rpb24oXCJzY3JhdGNoXCIpXG4gICAgQHJjID0gQHJlbW90ZS5hZGRDb2xsZWN0aW9uKFwic2NyYXRjaFwiKVxuICAgIEBoYyA9IEBoeWJyaWQuYWRkQ29sbGVjdGlvbihcInNjcmF0Y2hcIilcblxuICBjb250ZXh0IFwiaHlicmlkIG1vZGVcIiwgLT5cbiAgICBpdCBcImZpbmQgZ2l2ZXMgb25seSBvbmUgcmVzdWx0IGlmIGRhdGEgdW5jaGFuZ2VkXCIsIChkb25lKSAtPlxuICAgICAgQGxjLnNlZWQoX2lkOlwiMVwiLCBhOjEpXG4gICAgICBAbGMuc2VlZChfaWQ6XCIyXCIsIGE6MilcblxuICAgICAgQHJjLnNlZWQoX2lkOlwiMVwiLCBhOjEpXG4gICAgICBAcmMuc2VlZChfaWQ6XCIyXCIsIGE6MilcblxuICAgICAgY2FsbHMgPSAwXG4gICAgICBAaGMuZmluZCh7fSkuZmV0Y2ggKGRhdGEpIC0+XG4gICAgICAgIGNhbGxzICs9IDFcbiAgICAgICAgYXNzZXJ0LmVxdWFsIGRhdGEubGVuZ3RoLCAyXG4gICAgICAgIGFzc2VydC5lcXVhbCBjYWxscywgMVxuICAgICAgICBkb25lKClcbiAgICAgICwgZmFpbFxuXG4gICAgaXQgXCJsb2NhbCB1cHNlcnRzIGFyZSByZXNwZWN0ZWRcIiwgKGRvbmUpIC0+XG4gICAgICBAbGMuc2VlZChfaWQ6XCIxXCIsIGE6MSlcbiAgICAgIEBsYy51cHNlcnQoX2lkOlwiMlwiLCBhOjIpXG5cbiAgICAgIEByYy5zZWVkKF9pZDpcIjFcIiwgYToxKVxuICAgICAgQHJjLnNlZWQoX2lkOlwiMlwiLCBhOjQpXG5cbiAgICAgIEBoYy5maW5kT25lIHsgX2lkOiBcIjJcIn0sIChkb2MpIC0+XG4gICAgICAgIGFzc2VydC5kZWVwRXF1YWwgZG9jLCB7IF9pZDogXCIyXCIsIGE6IDIgfVxuICAgICAgICBkb25lKClcbiAgICAgICwgZmFpbFxuXG4gICAgaXQgXCJmaW5kIHBlcmZvcm1zIGZ1bGwgZmllbGQgcmVtb3RlIHF1ZXJpZXMgaW4gaHlicmlkIG1vZGVcIiwgKGRvbmUpIC0+XG4gICAgICBAcmMuc2VlZChfaWQ6XCIxXCIsIGE6MSwgYjoxMSlcbiAgICAgIEByYy5zZWVkKF9pZDpcIjJcIiwgYToyLCBiOjEyKVxuXG4gICAgICBAaGMuZmluZCh7fSwgeyBmaWVsZHM6IHsgYjowIH0gfSkuZmV0Y2ggKGRhdGEpID0+XG4gICAgICAgIGlmIGRhdGEubGVuZ3RoID09IDBcbiAgICAgICAgICByZXR1cm5cbiAgICAgICAgYXNzZXJ0LmlzVW5kZWZpbmVkIGRhdGFbMF0uYlxuICAgICAgICBAbGMuZmluZE9uZSB7IF9pZDogXCIxXCIgfSwgKGRvYykgLT5cbiAgICAgICAgICBhc3NlcnQuZXF1YWwgZG9jLmIsIDExXG4gICAgICAgICAgZG9uZSgpXG5cbiAgICBpdCBcImZpbmRPbmUgcGVyZm9ybXMgZnVsbCBmaWVsZCByZW1vdGUgcXVlcmllcyBpbiBoeWJyaWQgbW9kZVwiLCAoZG9uZSkgLT5cbiAgICAgIEByYy5zZWVkKF9pZDpcIjFcIiwgYToxLCBiOjExKVxuICAgICAgQHJjLnNlZWQoX2lkOlwiMlwiLCBhOjIsIGI6MTIpXG5cbiAgICAgIEBoYy5maW5kT25lIHsgX2lkOiBcIjFcIiB9LCB7IGZpZWxkczogeyBiOjAgfSB9LCAoZG9jKSA9PlxuICAgICAgICBhc3NlcnQuaXNVbmRlZmluZWQgZG9jLmJcbiAgICAgICAgQGxjLmZpbmRPbmUgeyBfaWQ6IFwiMVwiIH0sIChkb2MpIC0+XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsIGRvYy5iLCAxMVxuICAgICAgICAgIGRvbmUoKVxuXG4gICAgaXQgXCJmaW5kIGdpdmVzIHJlc3VsdHMgdHdpY2UgaWYgcmVtb3RlIGdpdmVzIGRpZmZlcmVudCBhbnN3ZXJcIiwgKGRvbmUpIC0+XG4gICAgICBAbGMuc2VlZChfaWQ6XCIxXCIsIGE6MSlcbiAgICAgIEBsYy5zZWVkKF9pZDpcIjJcIiwgYToyKVxuXG4gICAgICBAcmMuc2VlZChfaWQ6XCIxXCIsIGE6MylcbiAgICAgIEByYy5zZWVkKF9pZDpcIjJcIiwgYTo0KVxuXG4gICAgICBjYWxscyA9IDBcbiAgICAgIEBoYy5maW5kKHt9KS5mZXRjaCAoZGF0YSkgLT5cbiAgICAgICAgYXNzZXJ0LmVxdWFsIGRhdGEubGVuZ3RoLCAyXG4gICAgICAgIGNhbGxzID0gY2FsbHMgKyAxXG4gICAgICAgIGlmIGNhbGxzID49MlxuICAgICAgICAgIGRvbmUoKVxuICAgICAgLCBmYWlsXG5cbiAgICBpdCBcImZpbmQgZ2l2ZXMgcmVzdWx0cyBvbmNlIGlmIHJlbW90ZSBnaXZlcyBzYW1lIGFuc3dlciB3aXRoIHNvcnQgZGlmZmVyZW5jZXNcIiwgKGRvbmUpIC0+XG4gICAgICBAbGMuc2VlZChfaWQ6XCIxXCIsIGE6MSlcbiAgICAgIEBsYy5zZWVkKF9pZDpcIjJcIiwgYToyKVxuXG4gICAgICBAcmMuZmluZCA9ICgpID0+XG4gICAgICAgIHJldHVybiBmZXRjaDogKHN1Y2Nlc3MpID0+XG4gICAgICAgICAgc3VjY2Vzcyhbe19pZDpcIjJcIiwgYToyfSwge19pZDpcIjFcIiwgYToxfV0pXG5cbiAgICAgIEBoYy5maW5kKHt9KS5mZXRjaCAoZGF0YSkgLT5cbiAgICAgICAgYXNzZXJ0LmVxdWFsIGRhdGEubGVuZ3RoLCAyXG4gICAgICAgIGRvbmUoKVxuICAgICAgLCBmYWlsXG5cbiAgICBpdCBcImZpbmRPbmUgZ2l2ZXMgcmVzdWx0cyB0d2ljZSBpZiByZW1vdGUgZ2l2ZXMgZGlmZmVyZW50IGFuc3dlclwiLCAoZG9uZSkgLT5cbiAgICAgIEBsYy5zZWVkKF9pZDpcIjFcIiwgYToxKVxuICAgICAgQGxjLnNlZWQoX2lkOlwiMlwiLCBhOjIpXG5cbiAgICAgIEByYy5zZWVkKF9pZDpcIjFcIiwgYTozKVxuICAgICAgQHJjLnNlZWQoX2lkOlwiMlwiLCBhOjQpXG5cbiAgICAgIGNhbGxzID0gMFxuICAgICAgQGhjLmZpbmRPbmUgeyBfaWQ6IFwiMVwifSwgKGRhdGEpIC0+XG4gICAgICAgIGNhbGxzID0gY2FsbHMgKyAxXG4gICAgICAgIGlmIGNhbGxzID09IDFcbiAgICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIGRhdGEsIHsgX2lkIDogXCIxXCIsIGE6MSB9XG4gICAgICAgIGlmIGNhbGxzID49IDJcbiAgICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIGRhdGEsIHsgX2lkIDogXCIxXCIsIGE6MyB9XG4gICAgICAgICAgZG9uZSgpXG4gICAgICAsIGZhaWxcblxuICAgIGl0IFwiZmluZE9uZSBnaXZlcyByZXN1bHRzIG51bGwgb25jZSBpZiByZW1vdGUgZmFpbHNcIiwgKGRvbmUpIC0+XG4gICAgICBjYWxsZWQgPSAwXG4gICAgICBAcmMuZmluZE9uZSA9IChzZWxlY3Rvciwgb3B0aW9ucyA9IHt9LCBzdWNjZXNzLCBlcnJvcikgLT5cbiAgICAgICAgY2FsbGVkID0gY2FsbGVkICsgMVxuICAgICAgICBlcnJvcihuZXcgRXJyb3IoXCJmYWlsXCIpKVxuICAgICAgQGhjLmZpbmRPbmUgeyBfaWQ6IFwieHl6XCJ9LCAoZGF0YSkgLT5cbiAgICAgICAgYXNzZXJ0LmVxdWFsIGRhdGEsIG51bGxcbiAgICAgICAgYXNzZXJ0LmVxdWFsIGNhbGxlZCwgMVxuICAgICAgICBkb25lKClcbiAgICAgICwgZmFpbFxuXG4gICAgaXQgXCJjYWNoZXMgcmVtb3RlIGRhdGFcIiwgKGRvbmUpIC0+XG4gICAgICBAbGMuc2VlZChfaWQ6XCIxXCIsIGE6MSlcbiAgICAgIEBsYy5zZWVkKF9pZDpcIjJcIiwgYToyKVxuXG4gICAgICBAcmMuc2VlZChfaWQ6XCIxXCIsIGE6MylcbiAgICAgIEByYy5zZWVkKF9pZDpcIjJcIiwgYToyKVxuXG4gICAgICBjYWxscyA9IDBcbiAgICAgIEBoYy5maW5kKHt9KS5mZXRjaCAoZGF0YSkgPT5cbiAgICAgICAgYXNzZXJ0LmVxdWFsIGRhdGEubGVuZ3RoLCAyXG4gICAgICAgIGNhbGxzID0gY2FsbHMgKyAxXG5cbiAgICAgICAgIyBBZnRlciBzZWNvbmQgY2FsbCwgY2hlY2sgdGhhdCBsb2NhbCBjb2xsZWN0aW9uIGhhcyBsYXRlc3RcbiAgICAgICAgaWYgY2FsbHMgPT0gMlxuICAgICAgICAgIEBsYy5maW5kKHt9KS5mZXRjaCAoZGF0YSkgPT5cbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCBkYXRhLmxlbmd0aCwgMlxuICAgICAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCBfLnBsdWNrKGRhdGEsICdhJyksIFszLDJdXG4gICAgICAgICAgICBkb25lKClcblxuICBjb250ZXh0IFwibG9jYWwgbW9kZVwiLCAtPlxuICAgIGl0IFwiZmluZCBvbmx5IGNhbGxzIGxvY2FsXCIsIChkb25lKSAtPlxuICAgICAgQGxjLnNlZWQoX2lkOlwiMVwiLCBhOjEpXG4gICAgICBAbGMuc2VlZChfaWQ6XCIyXCIsIGE6MilcblxuICAgICAgQHJjLnNlZWQoX2lkOlwiMVwiLCBhOjMpXG4gICAgICBAcmMuc2VlZChfaWQ6XCIyXCIsIGE6NClcblxuICAgICAgQGhjLmZpbmQoe30sIHttb2RlOlwibG9jYWxcIn0pLmZldGNoIChkYXRhKSA9PlxuICAgICAgICBhc3NlcnQuZXF1YWwgZGF0YS5sZW5ndGgsIDJcbiAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCBfLnBsdWNrKGRhdGEsICdhJyksIFsxLDJdXG4gICAgICAgIGRvbmUoKVxuXG4gICAgaXQgXCJmaW5kT25lIG9ubHkgY2FsbHMgbG9jYWwgaWYgZm91bmRcIiwgKGRvbmUpIC0+XG4gICAgICBAbGMuc2VlZChfaWQ6XCIxXCIsIGE6MSlcbiAgICAgIEBsYy5zZWVkKF9pZDpcIjJcIiwgYToyKVxuXG4gICAgICBAcmMuc2VlZChfaWQ6XCIxXCIsIGE6MylcbiAgICAgIEByYy5zZWVkKF9pZDpcIjJcIiwgYTo0KVxuXG4gICAgICBjYWxscyA9IDBcbiAgICAgIEBoYy5maW5kT25lIHsgX2lkOiBcIjFcIiB9LCB7IG1vZGU6IFwibG9jYWxcIiB9LCAoZGF0YSkgPT5cbiAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCBkYXRhLCB7IF9pZCA6IFwiMVwiLCBhOjEgfVxuICAgICAgICBkb25lKClcbiAgICAgICwgZmFpbFxuXG4gICAgaXQgXCJmaW5kT25lIGNhbGxzIHJlbW90ZSBpZiBub3QgZm91bmRcIiwgKGRvbmUpIC0+XG4gICAgICBAbGMuc2VlZChfaWQ6XCIyXCIsIGE6MilcblxuICAgICAgQHJjLnNlZWQoX2lkOlwiMVwiLCBhOjMpXG4gICAgICBAcmMuc2VlZChfaWQ6XCIyXCIsIGE6NClcblxuICAgICAgY2FsbHMgPSAwXG4gICAgICBAaGMuZmluZE9uZSB7IF9pZDogXCIxXCJ9LCB7IG1vZGU6XCJsb2NhbFwiIH0sIChkYXRhKSA9PlxuICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIGRhdGEsIHsgX2lkIDogXCIxXCIsIGE6MyB9XG4gICAgICAgIGRvbmUoKVxuICAgICAgLCBmYWlsXG5cbiAgY29udGV4dCBcInJlbW90ZSBtb2RlXCIsIC0+XG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgQGxjLnNlZWQoX2lkOlwiMVwiLCBhOjEpXG4gICAgICBAbGMuc2VlZChfaWQ6XCIyXCIsIGE6MilcblxuICAgICAgQHJjLnNlZWQoX2lkOlwiMVwiLCBhOjMpXG4gICAgICBAcmMuc2VlZChfaWQ6XCIyXCIsIGE6NClcblxuICAgIGl0IFwiZmluZCBvbmx5IGNhbGxzIHJlbW90ZVwiLCAoZG9uZSkgLT5cbiAgICAgIEBoYy5maW5kKHt9LCB7IG1vZGU6IFwicmVtb3RlXCIgfSkuZmV0Y2ggKGRhdGEpID0+XG4gICAgICAgIGFzc2VydC5kZWVwRXF1YWwgXy5wbHVjayhkYXRhLCAnYScpLCBbMyw0XVxuICAgICAgICBkb25lKClcblxuICAgIGl0IFwiZmluZCBkb2VzIG5vdCBjYWNoZSByZXN1bHRzXCIsIChkb25lKSAtPlxuICAgICAgQGhjLmZpbmQoe30sIHsgbW9kZTogXCJyZW1vdGVcIiB9KS5mZXRjaCAoZGF0YSkgPT5cbiAgICAgICAgQGxjLmZpbmQoe30pLmZldGNoIChkYXRhKSA9PlxuICAgICAgICAgIGFzc2VydC5kZWVwRXF1YWwgXy5wbHVjayhkYXRhLCAnYScpLCBbMSwyXVxuICAgICAgICAgIGRvbmUoKVxuXG4gICAgaXQgXCJmaW5kIGZhbGxzIGJhY2sgdG8gbG9jYWwgaWYgcmVtb3RlIGZhaWxzXCIsIChkb25lKSAtPlxuICAgICAgQHJjLmZpbmQgPSAoc2VsZWN0b3IsIG9wdGlvbnMpID0+XG4gICAgICAgIHJldHVybiB7IGZldGNoOiAoc3VjY2VzcywgZXJyb3IpIC0+XG4gICAgICAgICAgZXJyb3IoKVxuICAgICAgICB9XG4gICAgICBAaGMuZmluZCh7fSwgeyBtb2RlOiBcInJlbW90ZVwiIH0pLmZldGNoIChkYXRhKSA9PlxuICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIF8ucGx1Y2soZGF0YSwgJ2EnKSwgWzEsMl1cbiAgICAgICAgZG9uZSgpXG5cbiAgICBpdCBcImZpbmQgcmVzcGVjdHMgbG9jYWwgdXBzZXJ0c1wiLCAoZG9uZSkgLT5cbiAgICAgIEBsYy51cHNlcnQoeyBfaWQ6XCIxXCIsIGE6OSB9KVxuXG4gICAgICBAaGMuZmluZCh7fSwgeyBtb2RlOiBcInJlbW90ZVwiLCBzb3J0OiBbJ19pZCddIH0pLmZldGNoIChkYXRhKSA9PlxuICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIF8ucGx1Y2soZGF0YSwgJ2EnKSwgWzksNF1cbiAgICAgICAgZG9uZSgpXG5cbiAgICBpdCBcImZpbmQgcmVzcGVjdHMgbG9jYWwgcmVtb3Zlc1wiLCAoZG9uZSkgLT5cbiAgICAgIEBsYy5yZW1vdmUoXCIxXCIpXG5cbiAgICAgIEBoYy5maW5kKHt9LCB7IG1vZGU6IFwicmVtb3RlXCIgfSkuZmV0Y2ggKGRhdGEpID0+XG4gICAgICAgIGFzc2VydC5kZWVwRXF1YWwgXy5wbHVjayhkYXRhLCAnYScpLCBbNF1cbiAgICAgICAgZG9uZSgpXG4gICAgXG4gIGl0IFwidXBsb2FkIGFwcGxpZXMgcGVuZGluZyB1cHNlcnRzIGFuZCBkZWxldGVzXCIsIChkb25lKSAtPlxuICAgIEBsYy51cHNlcnQoX2lkOlwiMVwiLCBhOjEpXG4gICAgQGxjLnVwc2VydChfaWQ6XCIyXCIsIGE6MilcblxuICAgIEBoeWJyaWQudXBsb2FkKCgpID0+XG4gICAgICBAbGMucGVuZGluZ1Vwc2VydHMgKGRhdGEpID0+XG4gICAgICAgIGFzc2VydC5lcXVhbCBkYXRhLmxlbmd0aCwgMFxuXG4gICAgICAgIEByYy5wZW5kaW5nVXBzZXJ0cyAoZGF0YSkgPT5cbiAgICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIF8ucGx1Y2soZGF0YSwgJ2EnKSwgWzEsMl1cbiAgICAgICAgICBkb25lKClcbiAgICAsIGZhaWwpXG5cbiAgaXQgXCJrZWVwcyB1cHNlcnRzIGFuZCBkZWxldGVzIGlmIGZhaWxlZCB0byBhcHBseVwiLCAoZG9uZSkgLT5cbiAgICBAbGMudXBzZXJ0KF9pZDpcIjFcIiwgYToxKVxuICAgIEBsYy51cHNlcnQoX2lkOlwiMlwiLCBhOjIpXG5cbiAgICBAcmMudXBzZXJ0ID0gKGRvYywgc3VjY2VzcywgZXJyb3IpID0+XG4gICAgICBlcnJvcihuZXcgRXJyb3IoXCJmYWlsXCIpKVxuXG4gICAgQGh5YnJpZC51cGxvYWQoKCkgPT5cbiAgICAgIGFzc2VydC5mYWlsKClcbiAgICAsICgpPT5cbiAgICAgIEBsYy5wZW5kaW5nVXBzZXJ0cyAoZGF0YSkgPT5cbiAgICAgICAgYXNzZXJ0LmVxdWFsIGRhdGEubGVuZ3RoLCAyXG4gICAgICAgIGRvbmUoKVxuICAgIClcblxuICBpdCBcInVwc2VydHMgdG8gbG9jYWwgZGJcIiwgKGRvbmUpIC0+XG4gICAgQGhjLnVwc2VydChfaWQ6XCIxXCIsIGE6MSlcbiAgICBAbGMucGVuZGluZ1Vwc2VydHMgKGRhdGEpID0+XG4gICAgICBhc3NlcnQuZXF1YWwgZGF0YS5sZW5ndGgsIDFcbiAgICAgIGRvbmUoKVxuXG4gIGl0IFwicmVtb3ZlcyB0byBsb2NhbCBkYlwiLCAoZG9uZSkgLT5cbiAgICBAbGMuc2VlZChfaWQ6XCIxXCIsIGE6MSlcbiAgICBAaGMucmVtb3ZlKFwiMVwiKVxuICAgIEBsYy5wZW5kaW5nUmVtb3ZlcyAoZGF0YSkgPT5cbiAgICAgIGFzc2VydC5lcXVhbCBkYXRhLmxlbmd0aCwgMVxuICAgICAgZG9uZSgpXG4iLCJhc3NlcnQgPSBjaGFpLmFzc2VydFxuZm9ybXMgPSByZXF1aXJlKCdmb3JtcycpXG5VSURyaXZlciA9IHJlcXVpcmUgJy4vaGVscGVycy9VSURyaXZlcidcbkltYWdlUGFnZSA9IHJlcXVpcmUgJy4uL2FwcC9qcy9wYWdlcy9JbWFnZVBhZ2UnXG5cbmNsYXNzIE1vY2tJbWFnZU1hbmFnZXIgXG4gIGdldEltYWdlVGh1bWJuYWlsVXJsOiAoaW1hZ2VVaWQsIHN1Y2Nlc3MsIGVycm9yKSAtPlxuICAgIHN1Y2Nlc3MgXCJpbWFnZXMvXCIgKyBpbWFnZVVpZCArIFwiLmpwZ1wiXG5cbiAgZ2V0SW1hZ2VVcmw6IChpbWFnZVVpZCwgc3VjY2VzcywgZXJyb3IpIC0+XG4gICAgc3VjY2VzcyBcImltYWdlcy9cIiArIGltYWdlVWlkICsgXCIuanBnXCJcblxuY2xhc3MgTW9ja0NhbWVyYVxuICB0YWtlUGljdHVyZTogKHN1Y2Nlc3MsIGVycm9yKSAtPlxuICAgIHN1Y2Nlc3MoXCJodHRwOi8vMTIzNC5qcGdcIilcblxuZGVzY3JpYmUgJ0ltYWdlc1F1ZXN0aW9uJywgLT5cbiAgYmVmb3JlRWFjaCAtPlxuICAgICMgQ3JlYXRlIG1vZGVsXG4gICAgQG1vZGVsID0gbmV3IEJhY2tib25lLk1vZGVsIFxuXG4gIGNvbnRleHQgJ1dpdGggYSBubyBjYW1lcmEnLCAtPlxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICMgQ3JlYXRlIGNvbnRleHRcbiAgICAgIEBjdHggPSB7XG4gICAgICAgIGltYWdlTWFuYWdlcjogbmV3IE1vY2tJbWFnZU1hbmFnZXIoKVxuICAgICAgfVxuXG4gICAgICBAcXVlc3Rpb24gPSBuZXcgZm9ybXMuSW1hZ2VzUXVlc3Rpb25cbiAgICAgICAgbW9kZWw6IEBtb2RlbFxuICAgICAgICBpZDogXCJxMVwiXG4gICAgICAgIGN0eDogQGN0eFxuXG4gICAgaXQgJ2Rpc3BsYXlzIG5vIGltYWdlJywgLT5cbiAgICAgIEBtb2RlbC5zZXQocTE6IFtdKVxuICAgICAgYXNzZXJ0LmlzVHJ1ZSB0cnVlXG5cbiAgICBpdCAnZGlzcGxheXMgb25lIGltYWdlJywgLT5cbiAgICAgIEBtb2RlbC5zZXQocTE6IFt7aWQ6IFwiMTIzNFwifV0pXG4gICAgICBhc3NlcnQuZXF1YWwgQHF1ZXN0aW9uLiQoXCJpbWcudGh1bWJuYWlsLWltZ1wiKS5hdHRyKFwic3JjXCIpLCBcImltYWdlcy8xMjM0LmpwZ1wiXG5cbiAgICBpdCAnb3BlbnMgcGFnZScsIC0+XG4gICAgICBAbW9kZWwuc2V0KHExOiBbe2lkOiBcIjEyMzRcIn1dKVxuICAgICAgc3B5ID0gc2lub24uc3B5KClcbiAgICAgIEBjdHgucGFnZXIgPSB7IG9wZW5QYWdlOiBzcHkgfVxuICAgICAgQHF1ZXN0aW9uLiQoXCJpbWcudGh1bWJuYWlsLWltZ1wiKS5jbGljaygpXG5cbiAgICAgIGFzc2VydC5pc1RydWUgc3B5LmNhbGxlZE9uY2VcbiAgICAgIGFzc2VydC5lcXVhbCBzcHkuYXJnc1swXVsxXS5pZCwgXCIxMjM0XCJcblxuICAgIGl0ICdhbGxvd3MgcmVtb3ZpbmcgaW1hZ2UnLCAtPlxuICAgICAgQG1vZGVsLnNldChxMTogW3tpZDogXCIxMjM0XCJ9XSlcbiAgICAgIEBjdHgucGFnZXIgPSB7IFxuICAgICAgICBvcGVuUGFnZTogKHBhZ2UsIG9wdGlvbnMpID0+XG4gICAgICAgICAgb3B0aW9ucy5vblJlbW92ZSgpXG4gICAgICB9XG4gICAgICBAcXVlc3Rpb24uJChcImltZy50aHVtYm5haWwtaW1nXCIpLmNsaWNrKClcbiAgICAgIGFzc2VydC5lcXVhbCBAcXVlc3Rpb24uJChcImltZyNhZGRcIikubGVuZ3RoLCAwXG5cbiAgICBpdCAnZGlzcGxheXMgbm8gYWRkJywgLT5cbiAgICAgIGFzc2VydC5lcXVhbCBAcXVlc3Rpb24uJChcImltZyNhZGRcIikubGVuZ3RoLCAwXG5cbiAgY29udGV4dCAnV2l0aCBhIGNhbWVyYScsIC0+XG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgIyBDcmVhdGUgY29udGV4dFxuICAgICAgQGN0eCA9IHtcbiAgICAgICAgaW1hZ2VNYW5hZ2VyOiBuZXcgTW9ja0ltYWdlTWFuYWdlcigpXG4gICAgICAgIGNhbWVyYTogbmV3IE1vY2tDYW1lcmEoKVxuICAgICAgfVxuXG4gICAgICBAcXVlc3Rpb24gPSBuZXcgZm9ybXMuSW1hZ2VzUXVlc3Rpb25cbiAgICAgICAgbW9kZWw6IEBtb2RlbFxuICAgICAgICBpZDogXCJxMVwiXG4gICAgICAgIGN0eDogQGN0eFxuXG4gICAgaXQgJ2Rpc3BsYXlzIG5vIGFkZCBpZiBpbWFnZSBtYW5hZ2VyIGhhcyBubyBhZGRJbWFnZScsIC0+XG4gICAgICBhc3NlcnQuZXF1YWwgQHF1ZXN0aW9uLiQoXCJpbWcjYWRkXCIpLmxlbmd0aCwgMFxuXG4gIGNvbnRleHQgJ1dpdGggYSBjYW1lcmEgYW5kIGltYWdlTWFuYWdlciB3aXRoIGFkZEltYWdlJywgLT5cbiAgICBiZWZvcmVFYWNoIC0+XG4gICAgICBpbWFnZU1hbmFnZXIgPSBuZXcgTW9ja0ltYWdlTWFuYWdlcigpXG4gICAgICBpbWFnZU1hbmFnZXIuYWRkSW1hZ2UgPSAodXJsLCBzdWNjZXNzLCBlcnJvcikgLT5cbiAgICAgICAgYXNzZXJ0LmVxdWFsIHVybCwgXCJodHRwOi8vMTIzNC5qcGdcIlxuICAgICAgICBzdWNjZXNzIFwiMTIzNFwiXG5cbiAgICAgICMgQ3JlYXRlIGNvbnRleHRcbiAgICAgIEBjdHggPSB7XG4gICAgICAgIGltYWdlTWFuYWdlcjogaW1hZ2VNYW5hZ2VyXG4gICAgICAgIGNhbWVyYTogbmV3IE1vY2tDYW1lcmEoKVxuICAgICAgfVxuXG4gICAgICBAcXVlc3Rpb24gPSBuZXcgZm9ybXMuSW1hZ2VzUXVlc3Rpb25cbiAgICAgICAgbW9kZWw6IEBtb2RlbFxuICAgICAgICBpZDogXCJxMVwiXG4gICAgICAgIGN0eDogQGN0eFxuXG4gICAgaXQgJ3Rha2VzIGEgcGhvdG8nLCAtPlxuICAgICAgQGN0eC5jYW1lcmEgPSBuZXcgTW9ja0NhbWVyYSgpXG4gICAgICBAcXVlc3Rpb24uJChcImltZyNhZGRcIikuY2xpY2soKVxuICAgICAgYXNzZXJ0LmlzVHJ1ZSBfLmlzRXF1YWwoQG1vZGVsLmdldChcInExXCIpLCBbe2lkOlwiMTIzNFwifV0pLCBAbW9kZWwuZ2V0KFwicTFcIilcblxuICAgICIsImFzc2VydCA9IGNoYWkuYXNzZXJ0XG5Mb2NhbERiID0gcmVxdWlyZSBcIi4uL2FwcC9qcy9kYi9Mb2NhbERiXCJcbmRiX3F1ZXJpZXMgPSByZXF1aXJlIFwiLi9kYl9xdWVyaWVzXCJcblxuZGVzY3JpYmUgJ0xvY2FsRGInLCAtPlxuICBiZWZvcmUgLT5cbiAgICBAZGIgPSBuZXcgTG9jYWxEYignc2NyYXRjaCcpXG5cbiAgYmVmb3JlRWFjaCAoZG9uZSkgLT5cbiAgICBAZGIucmVtb3ZlQ29sbGVjdGlvbignc2NyYXRjaCcpXG4gICAgQGRiLmFkZENvbGxlY3Rpb24oJ3NjcmF0Y2gnKVxuICAgIGRvbmUoKVxuXG4gIGRlc2NyaWJlIFwicGFzc2VzIHF1ZXJpZXNcIiwgLT5cbiAgICBkYl9xdWVyaWVzLmNhbGwodGhpcylcblxuICBpdCAnY2FjaGVzIHJvd3MnLCAoZG9uZSkgLT5cbiAgICBAZGIuc2NyYXRjaC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdhcHBsZScgfV0sIHt9LCB7fSwgPT5cbiAgICAgIEBkYi5zY3JhdGNoLmZpbmQoe30pLmZldGNoIChyZXN1bHRzKSAtPlxuICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0c1swXS5hLCAnYXBwbGUnXG4gICAgICAgIGRvbmUoKVxuXG4gIGl0ICdjYWNoZSBvdmVyd3JpdGUgZXhpc3RpbmcnLCAoZG9uZSkgLT5cbiAgICBAZGIuc2NyYXRjaC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdhcHBsZScgfV0sIHt9LCB7fSwgPT5cbiAgICAgIEBkYi5zY3JhdGNoLmNhY2hlIFt7IF9pZDogMSwgYTogJ2JhbmFuYScgfV0sIHt9LCB7fSwgPT5cbiAgICAgICAgQGRiLnNjcmF0Y2guZmluZCh7fSkuZmV0Y2ggKHJlc3VsdHMpIC0+XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHNbMF0uYSwgJ2JhbmFuYSdcbiAgICAgICAgICBkb25lKClcblxuICBpdCBcImNhY2hlIGRvZXNuJ3Qgb3ZlcndyaXRlIHVwc2VydFwiLCAoZG9uZSkgLT5cbiAgICBAZGIuc2NyYXRjaC51cHNlcnQgeyBfaWQ6IDEsIGE6ICdhcHBsZScgfSwgPT5cbiAgICAgIEBkYi5zY3JhdGNoLmNhY2hlIFt7IF9pZDogMSwgYTogJ2JhbmFuYScgfV0sIHt9LCB7fSwgPT5cbiAgICAgICAgQGRiLnNjcmF0Y2guZmluZCh7fSkuZmV0Y2ggKHJlc3VsdHMpIC0+XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHNbMF0uYSwgJ2FwcGxlJ1xuICAgICAgICAgIGRvbmUoKVxuXG4gIGl0IFwiY2FjaGUgZG9lc24ndCBvdmVyd3JpdGUgcmVtb3ZlXCIsIChkb25lKSAtPlxuICAgIEBkYi5zY3JhdGNoLmNhY2hlIFt7IF9pZDogMSwgYTogJ2RlbGV0ZScgfV0sIHt9LCB7fSwgPT5cbiAgICAgIEBkYi5zY3JhdGNoLnJlbW92ZSAxLCA9PlxuICAgICAgQGRiLnNjcmF0Y2guY2FjaGUgW3sgX2lkOiAxLCBhOiAnYmFuYW5hJyB9XSwge30sIHt9LCA9PlxuICAgICAgICBAZGIuc2NyYXRjaC5maW5kKHt9KS5mZXRjaCAocmVzdWx0cykgLT5cbiAgICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0cy5sZW5ndGgsIDBcbiAgICAgICAgICBkb25lKClcblxuICBpdCBcImNhY2hlIHJlbW92ZXMgbWlzc2luZyB1bnNvcnRlZFwiLCAoZG9uZSkgLT5cbiAgICBAZGIuc2NyYXRjaC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdhJyB9LCB7IF9pZDogMiwgYTogJ2InIH0sIHsgX2lkOiAzLCBhOiAnYycgfV0sIHt9LCB7fSwgPT5cbiAgICAgIEBkYi5zY3JhdGNoLmNhY2hlIFt7IF9pZDogMSwgYTogJ2EnIH0sIHsgX2lkOiAzLCBhOiAnYycgfV0sIHt9LCB7fSwgPT5cbiAgICAgICAgQGRiLnNjcmF0Y2guZmluZCh7fSkuZmV0Y2ggKHJlc3VsdHMpIC0+XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHMubGVuZ3RoLCAyXG4gICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJjYWNoZSByZW1vdmVzIG1pc3NpbmcgZmlsdGVyZWRcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnNjcmF0Y2guY2FjaGUgW3sgX2lkOiAxLCBhOiAnYScgfSwgeyBfaWQ6IDIsIGE6ICdiJyB9LCB7IF9pZDogMywgYTogJ2MnIH1dLCB7fSwge30sID0+XG4gICAgICBAZGIuc2NyYXRjaC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdhJyB9XSwge19pZDogeyRsdDozfX0sIHt9LCA9PlxuICAgICAgICBAZGIuc2NyYXRjaC5maW5kKHt9LCB7c29ydDpbJ19pZCddfSkuZmV0Y2ggKHJlc3VsdHMpIC0+XG4gICAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCBfLnBsdWNrKHJlc3VsdHMsICdfaWQnKSwgWzEsM11cbiAgICAgICAgICBkb25lKClcblxuICBpdCBcImNhY2hlIHJlbW92ZXMgbWlzc2luZyBzb3J0ZWQgbGltaXRlZFwiLCAoZG9uZSkgLT5cbiAgICBAZGIuc2NyYXRjaC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdhJyB9LCB7IF9pZDogMiwgYTogJ2InIH0sIHsgX2lkOiAzLCBhOiAnYycgfV0sIHt9LCB7fSwgPT5cbiAgICAgIEBkYi5zY3JhdGNoLmNhY2hlIFt7IF9pZDogMSwgYTogJ2EnIH1dLCB7fSwge3NvcnQ6WydfaWQnXSwgbGltaXQ6Mn0sID0+XG4gICAgICAgIEBkYi5zY3JhdGNoLmZpbmQoe30sIHtzb3J0OlsnX2lkJ119KS5mZXRjaCAocmVzdWx0cykgLT5cbiAgICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIF8ucGx1Y2socmVzdWx0cywgJ19pZCcpLCBbMSwzXVxuICAgICAgICAgIGRvbmUoKVxuXG4gIGl0IFwiY2FjaGUgZG9lcyBub3QgcmVtb3ZlIG1pc3Npbmcgc29ydGVkIGxpbWl0ZWQgcGFzdCBlbmRcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnNjcmF0Y2guY2FjaGUgW3sgX2lkOiAxLCBhOiAnYScgfSwgeyBfaWQ6IDIsIGE6ICdiJyB9LCB7IF9pZDogMywgYTogJ2MnIH0sIHsgX2lkOiA0LCBhOiAnZCcgfV0sIHt9LCB7fSwgPT5cbiAgICAgIEBkYi5zY3JhdGNoLnJlbW92ZSAyLCA9PlxuICAgICAgICBAZGIuc2NyYXRjaC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdhJyB9LCB7IF9pZDogMiwgYTogJ2InIH1dLCB7fSwge3NvcnQ6WydfaWQnXSwgbGltaXQ6Mn0sID0+XG4gICAgICAgICAgQGRiLnNjcmF0Y2guZmluZCh7fSwge3NvcnQ6WydfaWQnXX0pLmZldGNoIChyZXN1bHRzKSAtPlxuICAgICAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCBfLnBsdWNrKHJlc3VsdHMsICdfaWQnKSwgWzEsMyw0XVxuICAgICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJyZXR1cm5zIHBlbmRpbmcgdXBzZXJ0c1wiLCAoZG9uZSkgLT5cbiAgICBAZGIuc2NyYXRjaC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdhcHBsZScgfV0sIHt9LCB7fSwgPT5cbiAgICAgIEBkYi5zY3JhdGNoLnVwc2VydCB7IF9pZDogMiwgYTogJ2JhbmFuYScgfSwgPT5cbiAgICAgICAgQGRiLnNjcmF0Y2gucGVuZGluZ1Vwc2VydHMgKHJlc3VsdHMpID0+XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHMubGVuZ3RoLCAxXG4gICAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHNbMF0uYSwgJ2JhbmFuYSdcbiAgICAgICAgICBkb25lKClcblxuICBpdCBcInJlc29sdmVzIHBlbmRpbmcgdXBzZXJ0c1wiLCAoZG9uZSkgLT5cbiAgICBAZGIuc2NyYXRjaC51cHNlcnQgeyBfaWQ6IDIsIGE6ICdiYW5hbmEnIH0sID0+XG4gICAgICBAZGIuc2NyYXRjaC5yZXNvbHZlVXBzZXJ0IHsgX2lkOiAyLCBhOiAnYmFuYW5hJyB9LCA9PlxuICAgICAgICBAZGIuc2NyYXRjaC5wZW5kaW5nVXBzZXJ0cyAocmVzdWx0cykgPT5cbiAgICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0cy5sZW5ndGgsIDBcbiAgICAgICAgICBkb25lKClcblxuICBpdCBcInJldGFpbnMgY2hhbmdlZCBwZW5kaW5nIHVwc2VydHNcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnNjcmF0Y2gudXBzZXJ0IHsgX2lkOiAyLCBhOiAnYmFuYW5hJyB9LCA9PlxuICAgICAgQGRiLnNjcmF0Y2gudXBzZXJ0IHsgX2lkOiAyLCBhOiAnYmFuYW5hMicgfSwgPT5cbiAgICAgICAgQGRiLnNjcmF0Y2gucmVzb2x2ZVVwc2VydCB7IF9pZDogMiwgYTogJ2JhbmFuYScgfSwgPT5cbiAgICAgICAgICBAZGIuc2NyYXRjaC5wZW5kaW5nVXBzZXJ0cyAocmVzdWx0cykgPT5cbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzLmxlbmd0aCwgMVxuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHNbMF0uYSwgJ2JhbmFuYTInXG4gICAgICAgICAgICBkb25lKClcblxuICBpdCBcInJlbW92ZXMgcGVuZGluZyB1cHNlcnRzXCIsIChkb25lKSAtPlxuICAgIEBkYi5zY3JhdGNoLnVwc2VydCB7IF9pZDogMiwgYTogJ2JhbmFuYScgfSwgPT5cbiAgICAgIEBkYi5zY3JhdGNoLnJlbW92ZSAyLCA9PlxuICAgICAgICBAZGIuc2NyYXRjaC5wZW5kaW5nVXBzZXJ0cyAocmVzdWx0cykgPT5cbiAgICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0cy5sZW5ndGgsIDBcbiAgICAgICAgICBkb25lKClcblxuICBpdCBcInJldHVybnMgcGVuZGluZyByZW1vdmVzXCIsIChkb25lKSAtPlxuICAgIEBkYi5zY3JhdGNoLmNhY2hlIFt7IF9pZDogMSwgYTogJ2FwcGxlJyB9XSwge30sIHt9LCA9PlxuICAgICAgQGRiLnNjcmF0Y2gucmVtb3ZlIDEsID0+XG4gICAgICAgIEBkYi5zY3JhdGNoLnBlbmRpbmdSZW1vdmVzIChyZXN1bHRzKSA9PlxuICAgICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzLmxlbmd0aCwgMVxuICAgICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzWzBdLCAxXG4gICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJyZXNvbHZlcyBwZW5kaW5nIHJlbW92ZXNcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnNjcmF0Y2guY2FjaGUgW3sgX2lkOiAxLCBhOiAnYXBwbGUnIH1dLCB7fSwge30sID0+XG4gICAgICBAZGIuc2NyYXRjaC5yZW1vdmUgMSwgPT5cbiAgICAgICAgQGRiLnNjcmF0Y2gucmVzb2x2ZVJlbW92ZSAxLCA9PlxuICAgICAgICAgIEBkYi5zY3JhdGNoLnBlbmRpbmdSZW1vdmVzIChyZXN1bHRzKSA9PlxuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHMubGVuZ3RoLCAwXG4gICAgICAgICAgICBkb25lKClcblxuICBpdCBcInNlZWRzXCIsIChkb25lKSAtPlxuICAgIEBkYi5zY3JhdGNoLnNlZWQgeyBfaWQ6IDEsIGE6ICdhcHBsZScgfSwgPT5cbiAgICAgIEBkYi5zY3JhdGNoLmZpbmQoe30pLmZldGNoIChyZXN1bHRzKSAtPlxuICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0c1swXS5hLCAnYXBwbGUnXG4gICAgICAgIGRvbmUoKVxuXG4gIGl0IFwiZG9lcyBub3Qgb3ZlcndyaXRlIGV4aXN0aW5nXCIsIChkb25lKSAtPlxuICAgIEBkYi5zY3JhdGNoLmNhY2hlIFt7IF9pZDogMSwgYTogJ2JhbmFuYScgfV0sIHt9LCB7fSwgPT5cbiAgICAgIEBkYi5zY3JhdGNoLnNlZWQgeyBfaWQ6IDEsIGE6ICdhcHBsZScgfSwgPT5cbiAgICAgICAgQGRiLnNjcmF0Y2guZmluZCh7fSkuZmV0Y2ggKHJlc3VsdHMpIC0+XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHNbMF0uYSwgJ2JhbmFuYSdcbiAgICAgICAgICBkb25lKClcblxuICBpdCBcImRvZXMgbm90IGFkZCByZW1vdmVkXCIsIChkb25lKSAtPlxuICAgIEBkYi5zY3JhdGNoLmNhY2hlIFt7IF9pZDogMSwgYTogJ2FwcGxlJyB9XSwge30sIHt9LCA9PlxuICAgICAgQGRiLnNjcmF0Y2gucmVtb3ZlIDEsID0+XG4gICAgICAgIEBkYi5zY3JhdGNoLnNlZWQgeyBfaWQ6IDEsIGE6ICdhcHBsZScgfSwgPT5cbiAgICAgICAgICBAZGIuc2NyYXRjaC5maW5kKHt9KS5mZXRjaCAocmVzdWx0cykgLT5cbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzLmxlbmd0aCwgMFxuICAgICAgICAgICAgZG9uZSgpXG5cbmRlc2NyaWJlICdMb2NhbERiIHdpdGggbG9jYWwgc3RvcmFnZScsIC0+XG4gIGJlZm9yZSAtPlxuICAgIEBkYiA9IG5ldyBMb2NhbERiKCdzY3JhdGNoJywgeyBuYW1lc3BhY2U6IFwiZGIuc2NyYXRjaFwiIH0pXG5cbiAgYmVmb3JlRWFjaCAoZG9uZSkgLT5cbiAgICBAZGIucmVtb3ZlQ29sbGVjdGlvbignc2NyYXRjaCcpXG4gICAgQGRiLmFkZENvbGxlY3Rpb24oJ3NjcmF0Y2gnKVxuICAgIGRvbmUoKVxuXG4gIGl0IFwicmV0YWlucyBpdGVtc1wiLCAoZG9uZSkgLT5cbiAgICBAZGIuc2NyYXRjaC51cHNlcnQgeyBfaWQ6MSwgYTpcIkFsaWNlXCIgfSwgPT5cbiAgICAgIGRiMiA9IG5ldyBMb2NhbERiKCdzY3JhdGNoJywgeyBuYW1lc3BhY2U6IFwiZGIuc2NyYXRjaFwiIH0pXG4gICAgICBkYjIuYWRkQ29sbGVjdGlvbiAnc2NyYXRjaCdcbiAgICAgIGRiMi5zY3JhdGNoLmZpbmQoe30pLmZldGNoIChyZXN1bHRzKSAtPlxuICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0c1swXS5hLCBcIkFsaWNlXCJcbiAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJyZXRhaW5zIHVwc2VydHNcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnNjcmF0Y2gudXBzZXJ0IHsgX2lkOjEsIGE6XCJBbGljZVwiIH0sID0+XG4gICAgICBkYjIgPSBuZXcgTG9jYWxEYignc2NyYXRjaCcsIHsgbmFtZXNwYWNlOiBcImRiLnNjcmF0Y2hcIiB9KVxuICAgICAgZGIyLmFkZENvbGxlY3Rpb24gJ3NjcmF0Y2gnXG4gICAgICBkYjIuc2NyYXRjaC5maW5kKHt9KS5mZXRjaCAocmVzdWx0cykgLT5cbiAgICAgICAgZGIyLnNjcmF0Y2gucGVuZGluZ1Vwc2VydHMgKHVwc2VydHMpIC0+XG4gICAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCByZXN1bHRzLCB1cHNlcnRzXG4gICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJyZXRhaW5zIHJlbW92ZXNcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnNjcmF0Y2guc2VlZCB7IF9pZDoxLCBhOlwiQWxpY2VcIiB9LCA9PlxuICAgICAgQGRiLnNjcmF0Y2gucmVtb3ZlIDEsID0+XG4gICAgICAgIGRiMiA9IG5ldyBMb2NhbERiKCdzY3JhdGNoJywgeyBuYW1lc3BhY2U6IFwiZGIuc2NyYXRjaFwiIH0pXG4gICAgICAgIGRiMi5hZGRDb2xsZWN0aW9uICdzY3JhdGNoJ1xuICAgICAgICBkYjIuc2NyYXRjaC5wZW5kaW5nUmVtb3ZlcyAocmVtb3ZlcykgLT5cbiAgICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIHJlbW92ZXMsIFsxXVxuICAgICAgICAgIGRvbmUoKVxuXG5kZXNjcmliZSAnTG9jYWxEYiB3aXRob3V0IGxvY2FsIHN0b3JhZ2UnLCAtPlxuICBiZWZvcmUgLT5cbiAgICBAZGIgPSBuZXcgTG9jYWxEYignc2NyYXRjaCcpXG5cbiAgYmVmb3JlRWFjaCAoZG9uZSkgLT5cbiAgICBAZGIucmVtb3ZlQ29sbGVjdGlvbignc2NyYXRjaCcpXG4gICAgQGRiLmFkZENvbGxlY3Rpb24oJ3NjcmF0Y2gnKVxuICAgIGRvbmUoKVxuXG4gIGl0IFwiZG9lcyBub3QgcmV0YWluIGl0ZW1zXCIsIChkb25lKSAtPlxuICAgIEBkYi5zY3JhdGNoLnVwc2VydCB7IF9pZDoxLCBhOlwiQWxpY2VcIiB9LCA9PlxuICAgICAgZGIyID0gbmV3IExvY2FsRGIoJ3NjcmF0Y2gnKVxuICAgICAgZGIyLmFkZENvbGxlY3Rpb24gJ3NjcmF0Y2gnXG4gICAgICBkYjIuc2NyYXRjaC5maW5kKHt9KS5mZXRjaCAocmVzdWx0cykgLT5cbiAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHMubGVuZ3RoLCAwXG4gICAgICAgIGRvbmUoKVxuXG4gIGl0IFwiZG9lcyBub3QgcmV0YWluIHVwc2VydHNcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnNjcmF0Y2gudXBzZXJ0IHsgX2lkOjEsIGE6XCJBbGljZVwiIH0sID0+XG4gICAgICBkYjIgPSBuZXcgTG9jYWxEYignc2NyYXRjaCcpXG4gICAgICBkYjIuYWRkQ29sbGVjdGlvbiAnc2NyYXRjaCdcbiAgICAgIGRiMi5zY3JhdGNoLmZpbmQoe30pLmZldGNoIChyZXN1bHRzKSAtPlxuICAgICAgICBkYjIuc2NyYXRjaC5wZW5kaW5nVXBzZXJ0cyAodXBzZXJ0cykgLT5cbiAgICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0cy5sZW5ndGgsIDBcbiAgICAgICAgICBkb25lKClcblxuICBpdCBcImRvZXMgbm90IHJldGFpbiByZW1vdmVzXCIsIChkb25lKSAtPlxuICAgIEBkYi5zY3JhdGNoLnNlZWQgeyBfaWQ6MSwgYTpcIkFsaWNlXCIgfSwgPT5cbiAgICAgIEBkYi5zY3JhdGNoLnJlbW92ZSAxLCA9PlxuICAgICAgICBkYjIgPSBuZXcgTG9jYWxEYignc2NyYXRjaCcpXG4gICAgICAgIGRiMi5hZGRDb2xsZWN0aW9uICdzY3JhdGNoJ1xuICAgICAgICBkYjIuc2NyYXRjaC5wZW5kaW5nUmVtb3ZlcyAocmVtb3ZlcykgLT5cbiAgICAgICAgICBhc3NlcnQuZXF1YWwgcmVtb3Zlcy5sZW5ndGgsIDBcbiAgICAgICAgICBkb25lKClcblxuIiwiYXNzZXJ0ID0gY2hhaS5hc3NlcnRcbkxvY2F0aW9uVmlldyA9IHJlcXVpcmUgJy4uL2FwcC9qcy9Mb2NhdGlvblZpZXcnXG5VSURyaXZlciA9IHJlcXVpcmUgJy4vaGVscGVycy9VSURyaXZlcidcblxuY2xhc3MgTW9ja0xvY2F0aW9uRmluZGVyXG4gIGNvbnN0cnVjdG9yOiAgLT5cbiAgICBfLmV4dGVuZCBALCBCYWNrYm9uZS5FdmVudHNcblxuICBnZXRMb2NhdGlvbjogLT5cbiAgc3RhcnRXYXRjaDogLT5cbiAgc3RvcFdhdGNoOiAtPlxuXG5kZXNjcmliZSAnTG9jYXRpb25WaWV3JywgLT5cbiAgY29udGV4dCAnV2l0aCBubyBzZXQgbG9jYXRpb24nLCAtPlxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgIEBsb2NhdGlvbkZpbmRlciA9IG5ldyBNb2NrTG9jYXRpb25GaW5kZXIoKVxuICAgICAgQGxvY2F0aW9uVmlldyA9IG5ldyBMb2NhdGlvblZpZXcobG9jOm51bGwsIGxvY2F0aW9uRmluZGVyOiBAbG9jYXRpb25GaW5kZXIpXG4gICAgICBAdWkgPSBuZXcgVUlEcml2ZXIoQGxvY2F0aW9uVmlldy5lbClcblxuICAgIGl0ICdkaXNwbGF5cyBVbnNwZWNpZmllZCcsIC0+XG4gICAgICBhc3NlcnQuaW5jbHVkZShAdWkudGV4dCgpLCAnVW5zcGVjaWZpZWQnKVxuXG4gICAgaXQgJ2Rpc2FibGVzIG1hcCcsIC0+XG4gICAgICBhc3NlcnQuaXNUcnVlIEB1aS5nZXREaXNhYmxlZChcIk1hcFwiKSBcblxuICAgIGl0ICdhbGxvd3Mgc2V0dGluZyBsb2NhdGlvbicsIC0+XG4gICAgICBAdWkuY2xpY2soJ1NldCcpXG4gICAgICBzZXRQb3MgPSBudWxsXG4gICAgICBAbG9jYXRpb25WaWV3Lm9uICdsb2NhdGlvbnNldCcsIChwb3MpIC0+XG4gICAgICAgIHNldFBvcyA9IHBvc1xuXG4gICAgICBAbG9jYXRpb25GaW5kZXIudHJpZ2dlciAnZm91bmQnLCB7IGNvb3JkczogeyBsYXRpdHVkZTogMiwgbG9uZ2l0dWRlOiAzLCBhY2N1cmFjeTogMTB9fVxuICAgICAgYXNzZXJ0LmVxdWFsIHNldFBvcy5jb29yZGluYXRlc1sxXSwgMlxuXG4gICAgaXQgJ0Rpc3BsYXlzIGVycm9yJywgLT5cbiAgICAgIEB1aS5jbGljaygnU2V0JylcbiAgICAgIHNldFBvcyA9IG51bGxcbiAgICAgIEBsb2NhdGlvblZpZXcub24gJ2xvY2F0aW9uc2V0JywgKHBvcykgLT5cbiAgICAgICAgc2V0UG9zID0gcG9zXG5cbiAgICAgIEBsb2NhdGlvbkZpbmRlci50cmlnZ2VyICdlcnJvcidcbiAgICAgIGFzc2VydC5lcXVhbCBzZXRQb3MsIG51bGxcbiAgICAgIGFzc2VydC5pbmNsdWRlKEB1aS50ZXh0KCksICdDYW5ub3QnKVxuXG4gIGNvbnRleHQgJ1dpdGggc2V0IGxvY2F0aW9uJywgLT5cbiAgICBiZWZvcmVFYWNoIC0+XG4gICAgICBAbG9jYXRpb25GaW5kZXIgPSBuZXcgTW9ja0xvY2F0aW9uRmluZGVyKClcbiAgICAgIEBsb2NhdGlvblZpZXcgPSBuZXcgTG9jYXRpb25WaWV3KGxvYzogeyB0eXBlOiBcIlBvaW50XCIsIGNvb3JkaW5hdGVzOiBbMTAsIDIwXX0sIGxvY2F0aW9uRmluZGVyOiBAbG9jYXRpb25GaW5kZXIpXG4gICAgICBAdWkgPSBuZXcgVUlEcml2ZXIoQGxvY2F0aW9uVmlldy5lbClcblxuICAgIGl0ICdkaXNwbGF5cyBXYWl0aW5nJywgLT5cbiAgICAgIGFzc2VydC5pbmNsdWRlKEB1aS50ZXh0KCksICdXYWl0aW5nJylcblxuICAgIGl0ICdkaXNwbGF5cyByZWxhdGl2ZScsIC0+XG4gICAgICBAbG9jYXRpb25GaW5kZXIudHJpZ2dlciAnZm91bmQnLCB7IGNvb3JkczogeyBsYXRpdHVkZTogMjEsIGxvbmdpdHVkZTogMTAsIGFjY3VyYWN5OiAxMH19XG4gICAgICBhc3NlcnQuaW5jbHVkZShAdWkudGV4dCgpLCAnMTExLjJrbSBTJylcblxuIiwiYXNzZXJ0ID0gY2hhaS5hc3NlcnRcbkdlb0pTT04gPSByZXF1aXJlIFwiLi4vYXBwL2pzL0dlb0pTT05cIlxuXG5kZXNjcmliZSAnR2VvSlNPTicsIC0+XG4gIGl0ICdyZXR1cm5zIGEgcHJvcGVyIHBvbHlnb24nLCAtPlxuICAgIHNvdXRoV2VzdCA9IG5ldyBMLkxhdExuZygxMCwgMjApXG4gICAgbm9ydGhFYXN0ID0gbmV3IEwuTGF0TG5nKDEzLCAyMylcbiAgICBib3VuZHMgPSBuZXcgTC5MYXRMbmdCb3VuZHMoc291dGhXZXN0LCBub3J0aEVhc3QpXG5cbiAgICBqc29uID0gR2VvSlNPTi5sYXRMbmdCb3VuZHNUb0dlb0pTT04oYm91bmRzKVxuICAgIGFzc2VydCBfLmlzRXF1YWwganNvbiwge1xuICAgICAgdHlwZTogXCJQb2x5Z29uXCIsXG4gICAgICBjb29yZGluYXRlczogW1xuICAgICAgICBbWzIwLDEwXSxbMjAsMTNdLFsyMywxM10sWzIzLDEwXSxbMjAsMTBdXVxuICAgICAgXVxuICAgIH1cblxuICBpdCAnZ2V0cyByZWxhdGl2ZSBsb2NhdGlvbiBOJywgLT5cbiAgICBmcm9tID0geyB0eXBlOiBcIlBvaW50XCIsIGNvb3JkaW5hdGVzOiBbMTAsIDIwXX1cbiAgICB0byA9IHsgdHlwZTogXCJQb2ludFwiLCBjb29yZGluYXRlczogWzEwLCAyMV19XG4gICAgc3RyID0gR2VvSlNPTi5nZXRSZWxhdGl2ZUxvY2F0aW9uKGZyb20sIHRvKVxuICAgIGFzc2VydC5lcXVhbCBzdHIsICcxMTEuMmttIE4nXG5cbiAgaXQgJ2dldHMgcmVsYXRpdmUgbG9jYXRpb24gUycsIC0+XG4gICAgZnJvbSA9IHsgdHlwZTogXCJQb2ludFwiLCBjb29yZGluYXRlczogWzEwLCAyMF19XG4gICAgdG8gPSB7IHR5cGU6IFwiUG9pbnRcIiwgY29vcmRpbmF0ZXM6IFsxMCwgMTldfVxuICAgIHN0ciA9IEdlb0pTT04uZ2V0UmVsYXRpdmVMb2NhdGlvbihmcm9tLCB0bylcbiAgICBhc3NlcnQuZXF1YWwgc3RyLCAnMTExLjJrbSBTJ1xuIiwiYXNzZXJ0ID0gY2hhaS5hc3NlcnRcbmF1dGggPSByZXF1aXJlIFwiLi4vYXBwL2pzL2F1dGhcIlxuXG5cbmRlc2NyaWJlIFwiVXNlckF1dGhcIiwgLT5cbiAgY29udGV4dCBcInVzZXIgb25seVwiLCAtPlxuICAgIGJlZm9yZSAtPlxuICAgICAgQGF1dGggPSBuZXcgYXV0aC5Vc2VyQXV0aChcInNvbWV1c2VyXCIpXG5cbiAgICBpdCBcImRvZXMgbm90IGFsbG93IHNvdXJjZV90eXBlcyBpbnNlcnRcIiwgLT5cbiAgICAgIGFzc2VydC5pc0ZhbHNlIEBhdXRoLmluc2VydChcInNvdXJjZV90eXBlc1wiKVxuXG4gICAgaXQgXCJkb2VzIGFsbG93IHNvdXJjZXMgaW5zZXJ0XCIsIC0+XG4gICAgICBhc3NlcnQuaXNUcnVlIEBhdXRoLmluc2VydChcInNvdXJjZXNcIilcblxuICAgIGl0IFwiZG9lcyBhbGxvdyBzb3VyY2VzIHVwZGF0ZSBmb3IgdXNlclwiLCAtPlxuICAgICAgYXNzZXJ0LmlzVHJ1ZSBAYXV0aC51cGRhdGUoXCJzb3VyY2VzXCIsIHsgdXNlcjogXCJzb21ldXNlclwifSlcblxuICAgIGl0IFwiZG9lcyBhbGxvdyBzb3VyY2VzIHVwZGF0ZXMgaW4gZ2VuZXJhbFwiLCAtPlxuICAgICAgYXNzZXJ0LmlzVHJ1ZSBAYXV0aC51cGRhdGUoXCJzb3VyY2VzXCIpXG5cbiAgICBpdCBcImRvZXMgbm90IGFsbG93IHNvdXJjZXMgdXBkYXRlIGZvciBvdGhlciB1c2VyXCIsIC0+XG4gICAgICBhc3NlcnQuaXNGYWxzZSBAYXV0aC51cGRhdGUoXCJzb3VyY2VzXCIsIHsgdXNlcjogXCJ4eXp6eVwifSlcblxuICBjb250ZXh0IFwidXNlciBhbmQgb3JnXCIsIC0+XG4gICAgYmVmb3JlIC0+XG4gICAgICBAYXV0aCA9IG5ldyBhdXRoLlVzZXJBdXRoKFwic29tZXVzZXJcIiwgXCJzb21lb3JnXCIpXG5cbiAgICBpdCBcImRvZXMgbm90IGFsbG93IHNvdXJjZV90eXBlcyBpbnNlcnRcIiwgLT5cbiAgICAgIGFzc2VydC5pc0ZhbHNlIEBhdXRoLmluc2VydChcInNvdXJjZV90eXBlc1wiKVxuXG4gICAgaXQgXCJkb2VzIGFsbG93IHNvdXJjZXMgaW5zZXJ0XCIsIC0+XG4gICAgICBhc3NlcnQuaXNUcnVlIEBhdXRoLmluc2VydChcInNvdXJjZXNcIilcblxuICAgIGl0IFwiZG9lcyBhbGxvdyBzb3VyY2VzIHVwZGF0ZSBmb3IgdXNlclwiLCAtPlxuICAgICAgYXNzZXJ0LmlzVHJ1ZSBAYXV0aC51cGRhdGUoXCJzb3VyY2VzXCIsIHsgdXNlcjogXCJzb21ldXNlclwifSlcblxuICAgIGl0IFwiZG9lcyBub3QgYWxsb3cgc291cmNlcyB1cGRhdGUgZm9yIG90aGVyIHVzZXIgd2l0aCBubyBvcmdcIiwgLT5cbiAgICAgIGFzc2VydC5pc0ZhbHNlIEBhdXRoLnVwZGF0ZShcInNvdXJjZXNcIiwgeyB1c2VyOiBcInh5enp5XCJ9KVxuXG4gICAgaXQgXCJkb2VzIGFsbG93IHNvdXJjZXMgdXBkYXRlIGZvciBvdGhlciB1c2VyIHdpdGggc2FtZSBvcmdcIiwgLT5cbiAgICAgIGFzc2VydC5pc1RydWUgQGF1dGgudXBkYXRlKFwic291cmNlc1wiLCB7IHVzZXI6IFwieHl6enlcIiwgb3JnOiBcInNvbWVvcmdcIn0pXG4iLCJhc3NlcnQgPSBjaGFpLmFzc2VydFxuUmVtb3RlRGIgPSByZXF1aXJlIFwiLi4vYXBwL2pzL2RiL1JlbW90ZURiXCJcbmRiX3F1ZXJpZXMgPSByZXF1aXJlIFwiLi9kYl9xdWVyaWVzXCJcblxuIyBUbyB3b3JrLCB0aGlzIG11c3QgaGF2ZSB0aGUgZm9sbG93aW5nIHNlcnZlciBydW5uaW5nOlxuIyBOT0RFX0VOVj10ZXN0IG5vZGUgc2VydmVyLmpzXG5pZiBmYWxzZVxuICBkZXNjcmliZSAnUmVtb3RlRGInLCAtPlxuICAgIGJlZm9yZUVhY2ggKGRvbmUpIC0+XG4gICAgICB1cmwgPSAnaHR0cDovL2xvY2FsaG9zdDo4MDgwL3YzLydcbiAgICAgIHJlcSA9ICQucG9zdCh1cmwgKyBcIl9yZXNldFwiLCB7fSlcbiAgICAgIHJlcS5mYWlsIChqcVhIUiwgdGV4dFN0YXR1cywgZXJyb3JUaHJvd24pID0+XG4gICAgICAgIHRocm93IHRleHRTdGF0dXNcbiAgICAgIHJlcS5kb25lID0+XG4gICAgICAgIHJlcSA9ICQuYWpheCh1cmwgKyBcInVzZXJzL3Rlc3RcIiwge1xuICAgICAgICAgIGRhdGEgOiBKU09OLnN0cmluZ2lmeSh7IGVtYWlsOiBcInRlc3RAdGVzdC5jb21cIiwgcGFzc3dvcmQ6XCJ4eXp6eVwiIH0pLFxuICAgICAgICAgIGNvbnRlbnRUeXBlIDogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICAgIHR5cGUgOiAnUFVUJ30pXG4gICAgICAgIHJlcS5kb25lIChkYXRhKSA9PlxuICAgICAgICAgIHJlcSA9ICQuYWpheCh1cmwgKyBcInVzZXJzL3Rlc3RcIiwge1xuICAgICAgICAgIGRhdGEgOiBKU09OLnN0cmluZ2lmeSh7IHBhc3N3b3JkOlwieHl6enlcIiB9KSxcbiAgICAgICAgICBjb250ZW50VHlwZSA6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICB0eXBlIDogJ1BPU1QnfSlcbiAgICAgICAgICByZXEuZG9uZSAoZGF0YSkgPT5cbiAgICAgICAgICAgIEBjbGllbnQgPSBkYXRhLmNsaWVudFxuXG4gICAgICAgICAgICBAZGIgPSBuZXcgUmVtb3RlRGIodXJsLCBAY2xpZW50KVxuICAgICAgICAgICAgQGRiLmFkZENvbGxlY3Rpb24oJ3NjcmF0Y2gnKVxuXG4gICAgICAgICAgICBkb25lKClcblxuICAgIGRlc2NyaWJlIFwicGFzc2VzIHF1ZXJpZXNcIiwgLT5cbiAgICAgIGRiX3F1ZXJpZXMuY2FsbCh0aGlzKVxuIiwiYXNzZXJ0ID0gY2hhaS5hc3NlcnRcbmZvcm1zID0gcmVxdWlyZSgnZm9ybXMnKVxuVUlEcml2ZXIgPSByZXF1aXJlICcuL2hlbHBlcnMvVUlEcml2ZXInXG5JbWFnZVBhZ2UgPSByZXF1aXJlICcuLi9hcHAvanMvcGFnZXMvSW1hZ2VQYWdlJ1xuXG5jbGFzcyBNb2NrSW1hZ2VNYW5hZ2VyIFxuICBnZXRJbWFnZVRodW1ibmFpbFVybDogKGltYWdlVWlkLCBzdWNjZXNzLCBlcnJvcikgLT5cbiAgICBzdWNjZXNzIFwiaW1hZ2VzL1wiICsgaW1hZ2VVaWQgKyBcIi5qcGdcIlxuXG4gIGdldEltYWdlVXJsOiAoaW1hZ2VVaWQsIHN1Y2Nlc3MsIGVycm9yKSAtPlxuICAgIHN1Y2Nlc3MgXCJpbWFnZXMvXCIgKyBpbWFnZVVpZCArIFwiLmpwZ1wiXG5cbmNsYXNzIE1vY2tDYW1lcmFcbiAgdGFrZVBpY3R1cmU6IChzdWNjZXNzLCBlcnJvcikgLT5cbiAgICBzdWNjZXNzKFwiaHR0cDovLzEyMzQuanBnXCIpXG5cbmRlc2NyaWJlICdJbWFnZVF1ZXN0aW9uJywgLT5cbiAgYmVmb3JlRWFjaCAtPlxuICAgICMgQ3JlYXRlIG1vZGVsXG4gICAgQG1vZGVsID0gbmV3IEJhY2tib25lLk1vZGVsIFxuXG4gIGNvbnRleHQgJ1dpdGggYSBubyBjYW1lcmEnLCAtPlxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICMgQ3JlYXRlIGNvbnRleHRcbiAgICAgIEBjdHggPSB7XG4gICAgICAgIGltYWdlTWFuYWdlcjogbmV3IE1vY2tJbWFnZU1hbmFnZXIoKVxuICAgICAgfVxuXG4gICAgICBAcXVlc3Rpb24gPSBuZXcgZm9ybXMuSW1hZ2VRdWVzdGlvblxuICAgICAgICBtb2RlbDogQG1vZGVsXG4gICAgICAgIGlkOiBcInExXCJcbiAgICAgICAgY3R4OiBAY3R4XG5cbiAgICBpdCAnZGlzcGxheXMgbm8gaW1hZ2UnLCAtPlxuICAgICAgYXNzZXJ0LmlzVHJ1ZSB0cnVlXG5cbiAgICBpdCAnZGlzcGxheXMgb25lIGltYWdlJywgLT5cbiAgICAgIEBtb2RlbC5zZXQocTE6IHtpZDogXCIxMjM0XCJ9KVxuICAgICAgYXNzZXJ0LmVxdWFsIEBxdWVzdGlvbi4kKFwiaW1nLnRodW1ibmFpbC1pbWdcIikuYXR0cihcInNyY1wiKSwgXCJpbWFnZXMvMTIzNC5qcGdcIlxuXG4gICAgaXQgJ29wZW5zIHBhZ2UnLCAtPlxuICAgICAgQG1vZGVsLnNldChxMToge2lkOiBcIjEyMzRcIn0pXG4gICAgICBzcHkgPSBzaW5vbi5zcHkoKVxuICAgICAgQGN0eC5wYWdlciA9IHsgb3BlblBhZ2U6IHNweSB9XG4gICAgICBAcXVlc3Rpb24uJChcImltZy50aHVtYm5haWwtaW1nXCIpLmNsaWNrKClcblxuICAgICAgYXNzZXJ0LmlzVHJ1ZSBzcHkuY2FsbGVkT25jZVxuICAgICAgYXNzZXJ0LmVxdWFsIHNweS5hcmdzWzBdWzFdLmlkLCBcIjEyMzRcIlxuXG4gICAgaXQgJ2FsbG93cyByZW1vdmluZyBpbWFnZScsIC0+XG4gICAgICBAbW9kZWwuc2V0KHExOiB7aWQ6IFwiMTIzNFwifSlcbiAgICAgIEBjdHgucGFnZXIgPSB7IFxuICAgICAgICBvcGVuUGFnZTogKHBhZ2UsIG9wdGlvbnMpID0+XG4gICAgICAgICAgb3B0aW9ucy5vblJlbW92ZSgpXG4gICAgICB9XG4gICAgICBAcXVlc3Rpb24uJChcImltZy50aHVtYm5haWwtaW1nXCIpLmNsaWNrKClcbiAgICAgIGFzc2VydC5lcXVhbCBAbW9kZWwuZ2V0KFwicTFcIiksIG51bGxcblxuICAgIGl0ICdkaXNwbGF5cyBubyBhZGQnLCAtPlxuICAgICAgYXNzZXJ0LmVxdWFsIEBxdWVzdGlvbi4kKFwiaW1nI2FkZFwiKS5sZW5ndGgsIDBcblxuICBjb250ZXh0ICdXaXRoIGEgY2FtZXJhJywgLT5cbiAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAjIENyZWF0ZSBjb250ZXh0XG4gICAgICBAY3R4ID0ge1xuICAgICAgICBpbWFnZU1hbmFnZXI6IG5ldyBNb2NrSW1hZ2VNYW5hZ2VyKClcbiAgICAgICAgY2FtZXJhOiBuZXcgTW9ja0NhbWVyYSgpXG4gICAgICB9XG5cbiAgICAgIEBxdWVzdGlvbiA9IG5ldyBmb3Jtcy5JbWFnZVF1ZXN0aW9uXG4gICAgICAgIG1vZGVsOiBAbW9kZWxcbiAgICAgICAgaWQ6IFwicTFcIlxuICAgICAgICBjdHg6IEBjdHhcblxuICAgIGl0ICdkaXNwbGF5cyBubyBhZGQgaWYgaW1hZ2UgbWFuYWdlciBoYXMgbm8gYWRkSW1hZ2UnLCAtPlxuICAgICAgYXNzZXJ0LmVxdWFsIEBxdWVzdGlvbi4kKFwiaW1nI2FkZFwiKS5sZW5ndGgsIDBcblxuICBjb250ZXh0ICdXaXRoIGEgY2FtZXJhIGFuZCBpbWFnZU1hbmFnZXIgd2l0aCBhZGRJbWFnZScsIC0+XG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgaW1hZ2VNYW5hZ2VyID0gbmV3IE1vY2tJbWFnZU1hbmFnZXIoKVxuICAgICAgaW1hZ2VNYW5hZ2VyLmFkZEltYWdlID0gKHVybCwgc3VjY2VzcywgZXJyb3IpIC0+XG4gICAgICAgIGFzc2VydC5lcXVhbCB1cmwsIFwiaHR0cDovLzEyMzQuanBnXCJcbiAgICAgICAgc3VjY2VzcyBcIjEyMzRcIlxuXG4gICAgICAjIENyZWF0ZSBjb250ZXh0XG4gICAgICBAY3R4ID0ge1xuICAgICAgICBpbWFnZU1hbmFnZXI6IGltYWdlTWFuYWdlclxuICAgICAgICBjYW1lcmE6IG5ldyBNb2NrQ2FtZXJhKClcbiAgICAgIH1cblxuICAgICAgQHF1ZXN0aW9uID0gbmV3IGZvcm1zLkltYWdlUXVlc3Rpb25cbiAgICAgICAgbW9kZWw6IEBtb2RlbFxuICAgICAgICBpZDogXCJxMVwiXG4gICAgICAgIGN0eDogQGN0eFxuXG4gICAgaXQgJ3Rha2VzIGEgcGhvdG8nLCAtPlxuICAgICAgQGN0eC5jYW1lcmEgPSBuZXcgTW9ja0NhbWVyYSgpXG4gICAgICBAcXVlc3Rpb24uJChcImltZyNhZGRcIikuY2xpY2soKVxuICAgICAgYXNzZXJ0LmlzVHJ1ZSBfLmlzRXF1YWwoQG1vZGVsLmdldChcInExXCIpLCB7aWQ6XCIxMjM0XCJ9KSwgQG1vZGVsLmdldChcInExXCIpXG5cbiAgICBpdCAnbm8gbG9uZ2VyIGhhcyBhZGQgYWZ0ZXIgdGFraW5nIHBob3RvJywgLT5cbiAgICAgIEBjdHguY2FtZXJhID0gbmV3IE1vY2tDYW1lcmEoKVxuICAgICAgQHF1ZXN0aW9uLiQoXCJpbWcjYWRkXCIpLmNsaWNrKClcbiAgICAgIGFzc2VydC5lcXVhbCBAcXVlc3Rpb24uJChcImltZyNhZGRcIikubGVuZ3RoLCAwXG5cbiAgICAiLCJhc3NlcnQgPSBjaGFpLmFzc2VydFxuXG5HZW9KU09OID0gcmVxdWlyZSAnLi4vYXBwL2pzL0dlb0pTT04nXG5cbm1vZHVsZS5leHBvcnRzID0gLT5cbiAgY29udGV4dCAnV2l0aCBzYW1wbGUgcm93cycsIC0+XG4gICAgYmVmb3JlRWFjaCAoZG9uZSkgLT5cbiAgICAgIEBkYi5zY3JhdGNoLnVwc2VydCB7IF9pZDpcIjFcIiwgYTpcIkFsaWNlXCIsIGI6MSB9LCA9PlxuICAgICAgICBAZGIuc2NyYXRjaC51cHNlcnQgeyBfaWQ6XCIyXCIsIGE6XCJDaGFybGllXCIsIGI6MiB9LCA9PlxuICAgICAgICAgIEBkYi5zY3JhdGNoLnVwc2VydCB7IF9pZDpcIjNcIiwgYTpcIkJvYlwiLCBiOjMgfSwgPT5cbiAgICAgICAgICAgIGRvbmUoKVxuXG4gICAgaXQgJ2ZpbmRzIGFsbCByb3dzJywgKGRvbmUpIC0+XG4gICAgICBAZGIuc2NyYXRjaC5maW5kKHt9KS5mZXRjaCAocmVzdWx0cykgPT5cbiAgICAgICAgYXNzZXJ0LmVxdWFsIDMsIHJlc3VsdHMubGVuZ3RoXG4gICAgICAgIGRvbmUoKVxuXG4gICAgaXQgJ2ZpbmRzIGFsbCByb3dzIHdpdGggb3B0aW9ucycsIChkb25lKSAtPlxuICAgICAgQGRiLnNjcmF0Y2guZmluZCh7fSwge30pLmZldGNoIChyZXN1bHRzKSA9PlxuICAgICAgICBhc3NlcnQuZXF1YWwgMywgcmVzdWx0cy5sZW5ndGhcbiAgICAgICAgZG9uZSgpXG5cbiAgICBpdCAnZmlsdGVycyByb3dzIGJ5IGlkJywgKGRvbmUpIC0+XG4gICAgICBAZGIuc2NyYXRjaC5maW5kKHsgX2lkOiBcIjFcIiB9KS5mZXRjaCAocmVzdWx0cykgPT5cbiAgICAgICAgYXNzZXJ0LmVxdWFsIDEsIHJlc3VsdHMubGVuZ3RoXG4gICAgICAgIGFzc2VydC5lcXVhbCAnQWxpY2UnLCByZXN1bHRzWzBdLmFcbiAgICAgICAgZG9uZSgpXG5cbiAgICBpdCAnaW5jbHVkZXMgZmllbGRzJywgKGRvbmUpIC0+XG4gICAgICBAZGIuc2NyYXRjaC5maW5kKHsgX2lkOiBcIjFcIiB9LCB7IGZpZWxkczogeyBhOjEgfX0pLmZldGNoIChyZXN1bHRzKSA9PlxuICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIHJlc3VsdHNbMF0sIHsgX2lkOiBcIjFcIiwgIGE6IFwiQWxpY2VcIiB9XG4gICAgICAgIGRvbmUoKVxuXG4gICAgaXQgJ2V4Y2x1ZGVzIGZpZWxkcycsIChkb25lKSAtPlxuICAgICAgQGRiLnNjcmF0Y2guZmluZCh7IF9pZDogXCIxXCIgfSwgeyBmaWVsZHM6IHsgYTowIH19KS5mZXRjaCAocmVzdWx0cykgPT5cbiAgICAgICAgYXNzZXJ0LmlzVW5kZWZpbmVkIHJlc3VsdHNbMF0uYVxuICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0c1swXS5iLCAxXG4gICAgICAgIGRvbmUoKVxuXG4gICAgaXQgJ2ZpbmRzIG9uZSByb3cnLCAoZG9uZSkgLT5cbiAgICAgIEBkYi5zY3JhdGNoLmZpbmRPbmUgeyBfaWQ6IFwiMlwiIH0sIChyZXN1bHQpID0+XG4gICAgICAgIGFzc2VydC5lcXVhbCAnQ2hhcmxpZScsIHJlc3VsdC5hXG4gICAgICAgIGRvbmUoKVxuXG4gICAgaXQgJ3JlbW92ZXMgaXRlbScsIChkb25lKSAtPlxuICAgICAgQGRiLnNjcmF0Y2gucmVtb3ZlIFwiMlwiLCA9PlxuICAgICAgICBAZGIuc2NyYXRjaC5maW5kKHt9KS5mZXRjaCAocmVzdWx0cykgPT5cbiAgICAgICAgICBhc3NlcnQuZXF1YWwgMiwgcmVzdWx0cy5sZW5ndGhcbiAgICAgICAgICBhc3NlcnQgXCIxXCIgaW4gKHJlc3VsdC5faWQgZm9yIHJlc3VsdCBpbiByZXN1bHRzKVxuICAgICAgICAgIGFzc2VydCBcIjJcIiBub3QgaW4gKHJlc3VsdC5faWQgZm9yIHJlc3VsdCBpbiByZXN1bHRzKVxuICAgICAgICAgIGRvbmUoKVxuXG4gICAgaXQgJ3JlbW92ZXMgbm9uLWV4aXN0ZW50IGl0ZW0nLCAoZG9uZSkgLT5cbiAgICAgIEBkYi5zY3JhdGNoLnJlbW92ZSBcIjk5OVwiLCA9PlxuICAgICAgICBAZGIuc2NyYXRjaC5maW5kKHt9KS5mZXRjaCAocmVzdWx0cykgPT5cbiAgICAgICAgICBhc3NlcnQuZXF1YWwgMywgcmVzdWx0cy5sZW5ndGhcbiAgICAgICAgICBkb25lKClcblxuICAgIGl0ICdzb3J0cyBhc2NlbmRpbmcnLCAoZG9uZSkgLT5cbiAgICAgIEBkYi5zY3JhdGNoLmZpbmQoe30sIHtzb3J0OiBbJ2EnXX0pLmZldGNoIChyZXN1bHRzKSA9PlxuICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIF8ucGx1Y2socmVzdWx0cywgJ19pZCcpLCBbXCIxXCIsXCIzXCIsXCIyXCJdXG4gICAgICAgIGRvbmUoKVxuXG4gICAgaXQgJ3NvcnRzIGRlc2NlbmRpbmcnLCAoZG9uZSkgLT5cbiAgICAgIEBkYi5zY3JhdGNoLmZpbmQoe30sIHtzb3J0OiBbWydhJywnZGVzYyddXX0pLmZldGNoIChyZXN1bHRzKSA9PlxuICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIF8ucGx1Y2socmVzdWx0cywgJ19pZCcpLCBbXCIyXCIsXCIzXCIsXCIxXCJdXG4gICAgICAgIGRvbmUoKVxuXG4gICAgaXQgJ2xpbWl0cycsIChkb25lKSAtPlxuICAgICAgQGRiLnNjcmF0Y2guZmluZCh7fSwge3NvcnQ6IFsnYSddLCBsaW1pdDoyfSkuZmV0Y2ggKHJlc3VsdHMpID0+XG4gICAgICAgIGFzc2VydC5kZWVwRXF1YWwgXy5wbHVjayhyZXN1bHRzLCAnX2lkJyksIFtcIjFcIixcIjNcIl1cbiAgICAgICAgZG9uZSgpXG5cbiAgICBpdCAnZmV0Y2hlcyBpbmRlcGVuZGVudCBjb3BpZXMnLCAoZG9uZSkgLT5cbiAgICAgIEBkYi5zY3JhdGNoLmZpbmRPbmUgeyBfaWQ6IFwiMlwiIH0sIChyZXN1bHQpID0+XG4gICAgICAgIHJlc3VsdC5hID0gJ0RhdmlkJ1xuICAgICAgICBAZGIuc2NyYXRjaC5maW5kT25lIHsgX2lkOiBcIjJcIiB9LCAocmVzdWx0KSA9PlxuICAgICAgICAgIGFzc2VydC5lcXVhbCAnQ2hhcmxpZScsIHJlc3VsdC5hXG4gICAgICAgICAgZG9uZSgpXG5cbiAgaXQgJ2FkZHMgX2lkIHRvIHJvd3MnLCAoZG9uZSkgLT5cbiAgICBAZGIuc2NyYXRjaC51cHNlcnQgeyBhOiAxIH0sIChpdGVtKSA9PlxuICAgICAgYXNzZXJ0LnByb3BlcnR5IGl0ZW0sICdfaWQnXG4gICAgICBhc3NlcnQubGVuZ3RoT2YgaXRlbS5faWQsIDMyXG4gICAgICBkb25lKClcblxuICBpdCAndXBkYXRlcyBieSBpZCcsIChkb25lKSAtPlxuICAgIEBkYi5zY3JhdGNoLnVwc2VydCB7IF9pZDpcIjFcIiwgYToxIH0sIChpdGVtKSA9PlxuICAgICAgQGRiLnNjcmF0Y2gudXBzZXJ0IHsgX2lkOlwiMVwiLCBhOjIsIF9yZXY6IDEgfSwgKGl0ZW0pID0+XG4gICAgICAgIGFzc2VydC5lcXVhbCBpdGVtLmEsIDJcbiAgXG4gICAgICAgIEBkYi5zY3JhdGNoLmZpbmQoe30pLmZldGNoIChyZXN1bHRzKSA9PlxuICAgICAgICAgIGFzc2VydC5lcXVhbCAxLCByZXN1bHRzLmxlbmd0aFxuICAgICAgICAgIGRvbmUoKVxuXG5cbiAgZ2VvcG9pbnQgPSAobG5nLCBsYXQpIC0+XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6ICdQb2ludCdcbiAgICAgIGNvb3JkaW5hdGVzOiBbbG5nLCBsYXRdXG4gICAgfVxuXG4gIGNvbnRleHQgJ1dpdGggZ2VvbG9jYXRlZCByb3dzJywgLT5cbiAgICBiZWZvcmVFYWNoIChkb25lKSAtPlxuICAgICAgQGRiLnNjcmF0Y2gudXBzZXJ0IHsgX2lkOlwiMVwiLCBsb2M6Z2VvcG9pbnQoOTAsIDQ1KSB9LCA9PlxuICAgICAgICBAZGIuc2NyYXRjaC51cHNlcnQgeyBfaWQ6XCIyXCIsIGxvYzpnZW9wb2ludCg5MCwgNDYpIH0sID0+XG4gICAgICAgICAgQGRiLnNjcmF0Y2gudXBzZXJ0IHsgX2lkOlwiM1wiLCBsb2M6Z2VvcG9pbnQoOTEsIDQ1KSB9LCA9PlxuICAgICAgICAgICAgQGRiLnNjcmF0Y2gudXBzZXJ0IHsgX2lkOlwiNFwiLCBsb2M6Z2VvcG9pbnQoOTEsIDQ2KSB9LCA9PlxuICAgICAgICAgICAgICBkb25lKClcblxuICAgIGl0ICdmaW5kcyBwb2ludHMgbmVhcicsIChkb25lKSAtPlxuICAgICAgc2VsZWN0b3IgPSBsb2M6IFxuICAgICAgICAkbmVhcjogXG4gICAgICAgICAgJGdlb21ldHJ5OiBnZW9wb2ludCg5MCwgNDUpXG5cbiAgICAgIEBkYi5zY3JhdGNoLmZpbmQoc2VsZWN0b3IpLmZldGNoIChyZXN1bHRzKSA9PlxuICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIF8ucGx1Y2socmVzdWx0cywgJ19pZCcpLCBbXCIxXCIsXCIzXCIsXCIyXCIsXCI0XCJdXG4gICAgICAgIGRvbmUoKVxuXG4gICAgaXQgJ2ZpbmRzIHBvaW50cyBuZWFyIG1heERpc3RhbmNlJywgKGRvbmUpIC0+XG4gICAgICBzZWxlY3RvciA9IGxvYzogXG4gICAgICAgICRuZWFyOiBcbiAgICAgICAgICAkZ2VvbWV0cnk6IGdlb3BvaW50KDkwLCA0NSlcbiAgICAgICAgICAkbWF4RGlzdGFuY2U6IDExMTAwMFxuXG4gICAgICBAZGIuc2NyYXRjaC5maW5kKHNlbGVjdG9yKS5mZXRjaCAocmVzdWx0cykgPT5cbiAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCBfLnBsdWNrKHJlc3VsdHMsICdfaWQnKSwgW1wiMVwiLFwiM1wiXVxuICAgICAgICBkb25lKCkgICAgICBcblxuICAgIGl0ICdmaW5kcyBwb2ludHMgbmVhciBtYXhEaXN0YW5jZSBqdXN0IGFib3ZlJywgKGRvbmUpIC0+XG4gICAgICBzZWxlY3RvciA9IGxvYzogXG4gICAgICAgICRuZWFyOiBcbiAgICAgICAgICAkZ2VvbWV0cnk6IGdlb3BvaW50KDkwLCA0NSlcbiAgICAgICAgICAkbWF4RGlzdGFuY2U6IDExMjAwMFxuXG4gICAgICBAZGIuc2NyYXRjaC5maW5kKHNlbGVjdG9yKS5mZXRjaCAocmVzdWx0cykgPT5cbiAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCBfLnBsdWNrKHJlc3VsdHMsICdfaWQnKSwgW1wiMVwiLFwiM1wiLFwiMlwiXVxuICAgICAgICBkb25lKClcblxuICAgIGl0ICdmaW5kcyBwb2ludHMgd2l0aGluIHNpbXBsZSBib3gnLCAoZG9uZSkgLT5cbiAgICAgIHNlbGVjdG9yID0gbG9jOiBcbiAgICAgICAgJGdlb0ludGVyc2VjdHM6IFxuICAgICAgICAgICRnZW9tZXRyeTogXG4gICAgICAgICAgICB0eXBlOiAnUG9seWdvbidcbiAgICAgICAgICAgIGNvb3JkaW5hdGVzOiBbW1xuICAgICAgICAgICAgICBbODkuNSwgNDUuNV0sIFs4OS41LCA0Ni41XSwgWzkwLjUsIDQ2LjVdLCBbOTAuNSwgNDUuNV0sIFs4OS41LCA0NS41XVxuICAgICAgICAgICAgXV1cbiAgICAgIEBkYi5zY3JhdGNoLmZpbmQoc2VsZWN0b3IpLmZldGNoIChyZXN1bHRzKSA9PlxuICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIF8ucGx1Y2socmVzdWx0cywgJ19pZCcpLCBbXCIyXCJdXG4gICAgICAgIGRvbmUoKVxuXG4gICAgaXQgJ2hhbmRsZXMgdW5kZWZpbmVkJywgKGRvbmUpIC0+XG4gICAgICBzZWxlY3RvciA9IGxvYzogXG4gICAgICAgICRnZW9JbnRlcnNlY3RzOiBcbiAgICAgICAgICAkZ2VvbWV0cnk6IFxuICAgICAgICAgICAgdHlwZTogJ1BvbHlnb24nXG4gICAgICAgICAgICBjb29yZGluYXRlczogW1tcbiAgICAgICAgICAgICAgWzg5LjUsIDQ1LjVdLCBbODkuNSwgNDYuNV0sIFs5MC41LCA0Ni41XSwgWzkwLjUsIDQ1LjVdLCBbODkuNSwgNDUuNV1cbiAgICAgICAgICAgIF1dXG4gICAgICBAZGIuc2NyYXRjaC51cHNlcnQgeyBfaWQ6NSB9LCA9PlxuICAgICAgICBAZGIuc2NyYXRjaC5maW5kKHNlbGVjdG9yKS5mZXRjaCAocmVzdWx0cykgPT5cbiAgICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIF8ucGx1Y2socmVzdWx0cywgJ19pZCcpLCBbXCIyXCJdXG4gICAgICAgICAgZG9uZSgpXG5cblxuIiwiYXNzZXJ0ID0gY2hhaS5hc3NlcnRcbkl0ZW1UcmFja2VyID0gcmVxdWlyZSBcIi4uL2FwcC9qcy9JdGVtVHJhY2tlclwiXG5cbmRlc2NyaWJlICdJdGVtVHJhY2tlcicsIC0+XG4gIGJlZm9yZUVhY2ggLT5cbiAgICBAdHJhY2tlciA9IG5ldyBJdGVtVHJhY2tlcigpXG5cbiAgaXQgXCJyZWNvcmRzIGFkZHNcIiwgLT5cbiAgICBpdGVtcyA9ICBbXG4gICAgICBfaWQ6IDEsIHg6MVxuICAgICAgX2lkOiAyLCB4OjJcbiAgICBdXG4gICAgW2FkZHMsIHJlbW92ZXNdID0gQHRyYWNrZXIudXBkYXRlKGl0ZW1zKVxuICAgIGFzc2VydC5kZWVwRXF1YWwgYWRkcywgaXRlbXNcbiAgICBhc3NlcnQuZGVlcEVxdWFsIHJlbW92ZXMsIFtdXG5cbiAgaXQgXCJyZW1lbWJlcnMgaXRlbXNcIiwgLT5cbiAgICBpdGVtcyA9ICBbXG4gICAgICB7X2lkOiAxLCB4OjF9XG4gICAgICB7X2lkOiAyLCB4OjJ9XG4gICAgXVxuICAgIFthZGRzLCByZW1vdmVzXSA9IEB0cmFja2VyLnVwZGF0ZShpdGVtcylcbiAgICBbYWRkcywgcmVtb3Zlc10gPSBAdHJhY2tlci51cGRhdGUoaXRlbXMpXG4gICAgYXNzZXJ0LmRlZXBFcXVhbCBhZGRzLCBbXVxuICAgIGFzc2VydC5kZWVwRXF1YWwgcmVtb3ZlcywgW11cblxuICBpdCBcInNlZXMgcmVtb3ZlZCBpdGVtc1wiLCAtPlxuICAgIGl0ZW1zMSA9ICBbXG4gICAgICB7X2lkOiAxLCB4OjF9XG4gICAgICB7X2lkOiAyLCB4OjJ9XG4gICAgXVxuICAgIGl0ZW1zMiA9ICBbXG4gICAgICB7X2lkOiAxLCB4OjF9XG4gICAgXVxuICAgIEB0cmFja2VyLnVwZGF0ZShpdGVtczEpXG4gICAgW2FkZHMsIHJlbW92ZXNdID0gQHRyYWNrZXIudXBkYXRlKGl0ZW1zMilcbiAgICBhc3NlcnQuZGVlcEVxdWFsIGFkZHMsIFtdXG4gICAgYXNzZXJ0LmRlZXBFcXVhbCByZW1vdmVzLCBbe19pZDogMiwgeDoyfV1cblxuICBpdCBcInNlZXMgcmVtb3ZlZCBjaGFuZ2VzXCIsIC0+XG4gICAgaXRlbXMxID0gIFtcbiAgICAgIHtfaWQ6IDEsIHg6MX1cbiAgICAgIHtfaWQ6IDIsIHg6Mn1cbiAgICBdXG4gICAgaXRlbXMyID0gIFtcbiAgICAgIHtfaWQ6IDEsIHg6MX1cbiAgICAgIHtfaWQ6IDIsIHg6NH1cbiAgICBdXG4gICAgQHRyYWNrZXIudXBkYXRlKGl0ZW1zMSlcbiAgICBbYWRkcywgcmVtb3Zlc10gPSBAdHJhY2tlci51cGRhdGUoaXRlbXMyKVxuICAgIGFzc2VydC5kZWVwRXF1YWwgYWRkcywgW3tfaWQ6IDIsIHg6NH1dXG4gICAgYXNzZXJ0LmRlZXBFcXVhbCByZW1vdmVzLCBbe19pZDogMiwgeDoyfV1cbiIsIlxuZXhwb3J0cy5EYXRlUXVlc3Rpb24gPSByZXF1aXJlICcuL0RhdGVRdWVzdGlvbidcbmV4cG9ydHMuRHJvcGRvd25RdWVzdGlvbiA9IHJlcXVpcmUgJy4vRHJvcGRvd25RdWVzdGlvbidcbmV4cG9ydHMuTnVtYmVyUXVlc3Rpb24gPSByZXF1aXJlICcuL051bWJlclF1ZXN0aW9uJ1xuZXhwb3J0cy5RdWVzdGlvbkdyb3VwID0gcmVxdWlyZSAnLi9RdWVzdGlvbkdyb3VwJ1xuZXhwb3J0cy5TYXZlQ2FuY2VsRm9ybSA9IHJlcXVpcmUgJy4vU2F2ZUNhbmNlbEZvcm0nXG5leHBvcnRzLlNvdXJjZVF1ZXN0aW9uID0gcmVxdWlyZSAnLi9Tb3VyY2VRdWVzdGlvbidcbmV4cG9ydHMuSW1hZ2VRdWVzdGlvbiA9IHJlcXVpcmUgJy4vSW1hZ2VRdWVzdGlvbidcbmV4cG9ydHMuSW1hZ2VzUXVlc3Rpb24gPSByZXF1aXJlICcuL0ltYWdlc1F1ZXN0aW9uJ1xuZXhwb3J0cy5JbnN0cnVjdGlvbnMgPSByZXF1aXJlICcuL0luc3RydWN0aW9ucydcblxuIyBNdXN0IGJlIGNyZWF0ZWQgd2l0aCBtb2RlbCAoYmFja2JvbmUgbW9kZWwpIGFuZCBjb250ZW50cyAoYXJyYXkgb2Ygdmlld3MpXG5leHBvcnRzLkZvcm1WaWV3ID0gY2xhc3MgRm9ybVZpZXcgZXh0ZW5kcyBCYWNrYm9uZS5WaWV3XG4gIGluaXRpYWxpemU6IChvcHRpb25zKSAtPlxuICAgIEBjb250ZW50cyA9IG9wdGlvbnMuY29udGVudHNcbiAgICBcbiAgICAjIEFkZCBjb250ZW50cyBhbmQgbGlzdGVuIHRvIGV2ZW50c1xuICAgIGZvciBjb250ZW50IGluIG9wdGlvbnMuY29udGVudHNcbiAgICAgIEAkZWwuYXBwZW5kKGNvbnRlbnQuZWwpO1xuICAgICAgQGxpc3RlblRvIGNvbnRlbnQsICdjbG9zZScsID0+IEB0cmlnZ2VyKCdjbG9zZScpXG4gICAgICBAbGlzdGVuVG8gY29udGVudCwgJ2NvbXBsZXRlJywgPT4gQHRyaWdnZXIoJ2NvbXBsZXRlJylcblxuICAgICMgQWRkIGxpc3RlbmVyIHRvIG1vZGVsXG4gICAgQGxpc3RlblRvIEBtb2RlbCwgJ2NoYW5nZScsID0+IEB0cmlnZ2VyKCdjaGFuZ2UnKVxuXG4gICAgIyBPdmVycmlkZSBzYXZlIGlmIHBhc3NlZCBhcyBvcHRpb25cbiAgICBpZiBvcHRpb25zLnNhdmVcbiAgICAgIEBzYXZlID0gb3B0aW9ucy5zYXZlXG5cbiAgbG9hZDogKGRhdGEpIC0+XG4gICAgQG1vZGVsLmNsZWFyKCkgICNUT0RPIGNsZWFyIG9yIG5vdCBjbGVhcj8gY2xlYXJpbmcgcmVtb3ZlcyBkZWZhdWx0cywgYnV0IGFsbG93cyB0cnVlIHJldXNlLlxuXG4gICAgIyBBcHBseSBkZWZhdWx0cyBcbiAgICBAbW9kZWwuc2V0KF8uZGVmYXVsdHMoXy5jbG9uZURlZXAoZGF0YSksIEBvcHRpb25zLmRlZmF1bHRzIHx8IHt9KSlcblxuICBzYXZlOiAtPlxuICAgIHJldHVybiBAbW9kZWwudG9KU09OKClcblxuXG4jIFNpbXBsZSBmb3JtIHRoYXQgZGlzcGxheXMgYSB0ZW1wbGF0ZSBiYXNlZCBvbiBsb2FkZWQgZGF0YVxuZXhwb3J0cy50ZW1wbGF0ZVZpZXcgPSAodGVtcGxhdGUpIC0+IFxuICByZXR1cm4ge1xuICAgIGVsOiAkKCc8ZGl2PjwvZGl2PicpXG4gICAgbG9hZDogKGRhdGEpIC0+XG4gICAgICAkKEBlbCkuaHRtbCB0ZW1wbGF0ZShkYXRhKVxuICB9XG5cbiAgIyBjbGFzcyBUZW1wbGF0ZVZpZXcgZXh0ZW5kcyBCYWNrYm9uZS5WaWV3XG4gICMgY29uc3RydWN0b3I6ICh0ZW1wbGF0ZSkgLT5cbiAgIyAgIEB0ZW1wbGF0ZSA9IHRlbXBsYXRlXG5cbiAgIyBsb2FkOiAoZGF0YSkgLT5cbiAgIyAgIEAkZWwuaHRtbCBAdGVtcGxhdGUoZGF0YSlcblxuXG5leHBvcnRzLlN1cnZleVZpZXcgPSBjbGFzcyBTdXJ2ZXlWaWV3IGV4dGVuZHMgRm9ybVZpZXdcblxuZXhwb3J0cy5XYXRlclRlc3RFZGl0VmlldyA9IGNsYXNzIFdhdGVyVGVzdEVkaXRWaWV3IGV4dGVuZHMgRm9ybVZpZXdcbiAgaW5pdGlhbGl6ZTogKG9wdGlvbnMpIC0+XG4gICAgc3VwZXIob3B0aW9ucylcblxuICAgICMgQWRkIGJ1dHRvbnMgYXQgYm90dG9tXG4gICAgIyBUT0RPIG1vdmUgdG8gdGVtcGxhdGUgYW5kIHNlcCBmaWxlXG4gICAgQCRlbC5hcHBlbmQgJCgnJydcbiAgICAgIDxkaXY+XG4gICAgICAgICAgPGJ1dHRvbiBpZD1cImNsb3NlX2J1dHRvblwiIHR5cGU9XCJidXR0b25cIiBjbGFzcz1cImJ0biBtYXJnaW5lZFwiPlNhdmUgZm9yIExhdGVyPC9idXR0b24+XG4gICAgICAgICAgJm5ic3A7XG4gICAgICAgICAgPGJ1dHRvbiBpZD1cImNvbXBsZXRlX2J1dHRvblwiIHR5cGU9XCJidXR0b25cIiBjbGFzcz1cImJ0biBidG4tcHJpbWFyeSBtYXJnaW5lZFwiPjxpIGNsYXNzPVwiaWNvbi1vayBpY29uLXdoaXRlXCI+PC9pPiBDb21wbGV0ZTwvYnV0dG9uPlxuICAgICAgPC9kaXY+XG4gICAgJycnKVxuXG4gIGV2ZW50czogXG4gICAgXCJjbGljayAjY2xvc2VfYnV0dG9uXCIgOiBcImNsb3NlXCJcbiAgICBcImNsaWNrICNjb21wbGV0ZV9idXR0b25cIiA6IFwiY29tcGxldGVcIlxuXG4gICMgVE9ETyByZWZhY3RvciB3aXRoIFNhdmVDYW5jZWxGb3JtXG4gIHZhbGlkYXRlOiAtPlxuICAgICMgR2V0IGFsbCB2aXNpYmxlIGl0ZW1zXG4gICAgaXRlbXMgPSBfLmZpbHRlcihAY29udGVudHMsIChjKSAtPlxuICAgICAgYy52aXNpYmxlIGFuZCBjLnZhbGlkYXRlXG4gICAgKVxuICAgIHJldHVybiBub3QgXy5hbnkoXy5tYXAoaXRlbXMsIChpdGVtKSAtPlxuICAgICAgaXRlbS52YWxpZGF0ZSgpXG4gICAgKSlcblxuICBjbG9zZTogLT5cbiAgICBAdHJpZ2dlciAnY2xvc2UnXG5cbiAgY29tcGxldGU6IC0+XG4gICAgaWYgQHZhbGlkYXRlKClcbiAgICAgIEB0cmlnZ2VyICdjb21wbGV0ZSdcbiAgICAgIFxuIyBDcmVhdGVzIGEgZm9ybSB2aWV3IGZyb20gYSBzdHJpbmdcbmV4cG9ydHMuaW5zdGFudGlhdGVWaWV3ID0gKHZpZXdTdHIsIG9wdGlvbnMpID0+XG4gIHZpZXdGdW5jID0gbmV3IEZ1bmN0aW9uKFwib3B0aW9uc1wiLCB2aWV3U3RyKVxuICB2aWV3RnVuYyhvcHRpb25zKVxuXG5fLmV4dGVuZChleHBvcnRzLCByZXF1aXJlKCcuL2Zvcm0tY29udHJvbHMnKSlcblxuXG4jIFRPRE8gZmlndXJlIG91dCBob3cgdG8gYWxsb3cgdHdvIHN1cnZleXMgZm9yIGRpZmZlcmluZyBjbGllbnQgdmVyc2lvbnM/IE9yIGp1c3QgdXNlIG1pblZlcnNpb24/IiwiZnVuY3Rpb24gUHJvYmxlbVJlcG9ydGVyKHVybCwgdmVyc2lvbiwgZ2V0Q2xpZW50KSB7XG4gICAgdmFyIGhpc3RvcnkgPSBbXTtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG5cbiAgICAvLyBJRTkgaGFja1xuICAgIGlmIChGdW5jdGlvbi5wcm90b3R5cGUuYmluZCAmJiBjb25zb2xlICYmIHR5cGVvZiBjb25zb2xlLmxvZyA9PSBcIm9iamVjdFwiKSB7XG4gICAgICAgIFtcbiAgICAgICAgICBcImxvZ1wiLFwiaW5mb1wiLFwid2FyblwiLFwiZXJyb3JcIixcImFzc2VydFwiLFwiZGlyXCIsXCJjbGVhclwiLFwicHJvZmlsZVwiLFwicHJvZmlsZUVuZFwiXG4gICAgICAgIF0uZm9yRWFjaChmdW5jdGlvbiAobWV0aG9kKSB7XG4gICAgICAgICAgICBjb25zb2xlW21ldGhvZF0gPSB0aGlzLmJpbmQoY29uc29sZVttZXRob2RdLCBjb25zb2xlKTtcbiAgICAgICAgfSwgRnVuY3Rpb24ucHJvdG90eXBlLmNhbGwpO1xuICAgIH1cblxuICAgIHZhciBfY2FwdHVyZWQgPSB7fVxuXG4gICAgZnVuY3Rpb24gY2FwdHVyZShmdW5jKSB7XG4gICAgICAgIHZhciBvbGQgPSBjb25zb2xlW2Z1bmNdO1xuICAgICAgICBfY2FwdHVyZWRbZnVuY10gPSBvbGQ7XG4gICAgICAgIGNvbnNvbGVbZnVuY10gPSBmdW5jdGlvbihhcmcpIHtcbiAgICAgICAgICAgIGhpc3RvcnkucHVzaChhcmcpO1xuICAgICAgICAgICAgaWYgKGhpc3RvcnkubGVuZ3RoID4gMjAwKVxuICAgICAgICAgICAgICAgIGhpc3Rvcnkuc3BsaWNlKDAsIDIwKTtcbiAgICAgICAgICAgIG9sZC5jYWxsKGNvbnNvbGUsIGFyZyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjYXB0dXJlKFwibG9nXCIpO1xuICAgIGNhcHR1cmUoXCJ3YXJuXCIpO1xuICAgIGNhcHR1cmUoXCJlcnJvclwiKTtcblxuICAgIGZ1bmN0aW9uIGdldExvZygpIHtcbiAgICAgICAgdmFyIGxvZyA9IFwiXCI7XG4gICAgICAgIF8uZWFjaChoaXN0b3J5LCBmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgICAgICBsb2cgKz0gU3RyaW5nKGl0ZW0pICsgXCJcXHJcXG5cIjtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBsb2c7XG4gICAgfVxuXG5cbiAgICB0aGlzLnJlcG9ydFByb2JsZW0gPSBmdW5jdGlvbihkZXNjKSB7XG4gICAgICAgIC8vIENyZWF0ZSBsb2cgc3RyaW5nXG4gICAgICAgIHZhciBsb2cgPSBnZXRMb2coKTtcblxuICAgICAgICBjb25zb2xlLmxvZyhcIlJlcG9ydGluZyBwcm9ibGVtLi4uXCIpO1xuXG4gICAgICAgICQucG9zdCh1cmwsIHtcbiAgICAgICAgICAgIGNsaWVudCA6IGdldENsaWVudCgpLFxuICAgICAgICAgICAgdmVyc2lvbiA6IHZlcnNpb24sXG4gICAgICAgICAgICB1c2VyX2FnZW50IDogbmF2aWdhdG9yLnVzZXJBZ2VudCxcbiAgICAgICAgICAgIGxvZyA6IGxvZyxcbiAgICAgICAgICAgIGRlc2MgOiBkZXNjXG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICAvLyBDYXB0dXJlIGVycm9yIGxvZ3NcbiAgICB2YXIgZGVib3VuY2VkUmVwb3J0UHJvYmxlbSA9IF8uZGVib3VuY2UodGhpcy5yZXBvcnRQcm9ibGVtLCA1MDAwLCB0cnVlKTtcblxuICAgIHZhciBvbGRDb25zb2xlRXJyb3IgPSBjb25zb2xlLmVycm9yO1xuICAgIGNvbnNvbGUuZXJyb3IgPSBmdW5jdGlvbihhcmcpIHtcbiAgICAgICAgb2xkQ29uc29sZUVycm9yKGFyZyk7XG5cbiAgICAgICAgZGVib3VuY2VkUmVwb3J0UHJvYmxlbShhcmcpO1xuICAgIH07XG5cbiAgICAvLyBDYXB0dXJlIHdpbmRvdy5vbmVycm9yXG4gICAgdmFyIG9sZFdpbmRvd09uRXJyb3IgPSB3aW5kb3cub25lcnJvcjtcbiAgICB3aW5kb3cub25lcnJvciA9IGZ1bmN0aW9uKGVycm9yTXNnLCB1cmwsIGxpbmVOdW1iZXIpIHtcbiAgICAgICAgdGhhdC5yZXBvcnRQcm9ibGVtKFwid2luZG93Lm9uZXJyb3I6XCIgKyBlcnJvck1zZyArIFwiOlwiICsgdXJsICsgXCI6XCIgKyBsaW5lTnVtYmVyKTtcbiAgICAgICAgXG4gICAgICAgIC8vIFB1dCB1cCBhbGVydCBpbnN0ZWFkIG9mIG9sZCBhY3Rpb25cbiAgICAgICAgYWxlcnQoXCJJbnRlcm5hbCBFcnJvclxcblwiICsgZXJyb3JNc2cgKyBcIlxcblwiICsgdXJsICsgXCI6XCIgKyBsaW5lTnVtYmVyKTtcbiAgICAgICAgLy9pZiAob2xkV2luZG93T25FcnJvcilcbiAgICAgICAgLy8gICAgb2xkV2luZG93T25FcnJvcihlcnJvck1zZywgdXJsLCBsaW5lTnVtYmVyKTtcbiAgICB9O1xuXG4gICAgdGhpcy5yZXN0b3JlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIF8uZWFjaChfLmtleXMoX2NhcHR1cmVkKSwgZnVuY3Rpb24oa2V5KSB7XG4gICAgICAgICAgICBjb25zb2xlW2tleV0gPSBfY2FwdHVyZWRba2V5XTtcbiAgICAgICAgfSk7XG4gICAgICAgIHdpbmRvdy5vbmVycm9yID0gb2xkV2luZG93T25FcnJvcjtcbiAgICB9O1xufVxuXG5Qcm9ibGVtUmVwb3J0ZXIucmVnaXN0ZXIgPSBmdW5jdGlvbihiYXNlVXJsLCB2ZXJzaW9uLCBnZXRDbGllbnQpIHtcbiAgICBpZiAoIVByb2JsZW1SZXBvcnRlci5pbnN0YW5jZXMpXG4gICAgICAgIFByb2JsZW1SZXBvcnRlci5pbnN0YW5jZXMgPSB7fVxuXG4gICAgaWYgKFByb2JsZW1SZXBvcnRlci5pbnN0YW5jZXNbYmFzZVVybF0pXG4gICAgICAgIHJldHVybjtcblxuICAgIG5ldyBQcm9ibGVtUmVwb3J0ZXIoYmFzZVVybCwgdmVyc2lvbiwgZ2V0Q2xpZW50KTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUHJvYmxlbVJlcG9ydGVyOyIsImFzc2VydCA9IGNoYWkuYXNzZXJ0XG5cbmNsYXNzIFVJRHJpdmVyXG4gIGNvbnN0cnVjdG9yOiAoZWwpIC0+XG4gICAgQGVsID0gJChlbClcblxuICBnZXREaXNhYmxlZDogKHN0cikgLT5cbiAgICBmb3IgaXRlbSBpbiBAZWwuZmluZChcImEsYnV0dG9uXCIpXG4gICAgICBpZiAkKGl0ZW0pLnRleHQoKS5pbmRleE9mKHN0cikgIT0gLTFcbiAgICAgICAgcmV0dXJuICQoaXRlbSkuaXMoXCI6ZGlzYWJsZWRcIilcbiAgICBhc3NlcnQuZmFpbChudWxsLCBzdHIsIFwiQ2FuJ3QgZmluZDogXCIgKyBzdHIpXG5cbiAgY2xpY2s6IChzdHIpIC0+XG4gICAgZm9yIGl0ZW0gaW4gQGVsLmZpbmQoXCJhLGJ1dHRvblwiKVxuICAgICAgaWYgJChpdGVtKS50ZXh0KCkuaW5kZXhPZihzdHIpICE9IC0xXG4gICAgICAgIGNvbnNvbGUubG9nIFwiQ2xpY2tpbmc6IFwiICsgJChpdGVtKS50ZXh0KClcbiAgICAgICAgJChpdGVtKS50cmlnZ2VyKFwiY2xpY2tcIilcbiAgICAgICAgcmV0dXJuXG4gICAgYXNzZXJ0LmZhaWwobnVsbCwgc3RyLCBcIkNhbid0IGZpbmQ6IFwiICsgc3RyKVxuICBcbiAgZmlsbDogKHN0ciwgdmFsdWUpIC0+XG4gICAgZm9yIGl0ZW0gaW4gQGVsLmZpbmQoXCJsYWJlbFwiKVxuICAgICAgaWYgJChpdGVtKS50ZXh0KCkuaW5kZXhPZihzdHIpICE9IC0xXG4gICAgICAgIGJveCA9IEBlbC5maW5kKFwiI1wiKyQoaXRlbSkuYXR0cignZm9yJykpXG4gICAgICAgIGJveC52YWwodmFsdWUpXG4gIFxuICB0ZXh0OiAtPlxuICAgIHJldHVybiBAZWwudGV4dCgpXG4gICAgICBcbiAgd2FpdDogKGFmdGVyKSAtPlxuICAgIHNldFRpbWVvdXQgYWZ0ZXIsIDEwXG5cbm1vZHVsZS5leHBvcnRzID0gVUlEcml2ZXIiLCJcbiMgQXV0aG9yaXphdGlvbiBjbGFzc2VzIGFsbCBmb2xsb3cgc2FtZSBwYXR0ZXJuLlxuIyBkb2MgY2FuIGJlIHVuZGVmaW5lZCBpbiB1cGRhdGUgYW5kIHJlbW92ZTogYXV0aG9yaXplcyB3aGV0aGVyIGV2ZXIgcG9zc2libGUuXG5cbmV4cG9ydHMuQWxsQXV0aCA9IGNsYXNzIEFsbEF1dGhcbiAgaW5zZXJ0OiAoY29sKSAtPlxuICAgIHJldHVybiB0cnVlXG5cbiAgdXBkYXRlOiAoY29sLCBkb2MpIC0+XG4gICAgcmV0dXJuIHRydWVcblxuICByZW1vdmU6IChjb2wsIGRvYykgLT5cbiAgICByZXR1cm4gdHJ1ZVxuICAgIFxuZXhwb3J0cy5Ob25lQXV0aCA9IGNsYXNzIE5vbmVBdXRoXG4gIGluc2VydDogKGNvbCkgLT5cbiAgICByZXR1cm4gZmFsc2VcblxuICB1cGRhdGU6IChjb2wsIGRvYykgLT5cbiAgICByZXR1cm4gZmFsc2VcblxuICByZW1vdmU6IChjb2wsIGRvYykgLT5cbiAgICByZXR1cm4gZmFsc2VcblxuZXhwb3J0cy5Vc2VyQXV0aCA9IGNsYXNzIFVzZXJBdXRoXG4gICMgdXNlciBpcyB1c2VybmFtZSwgb3JnIGlzIG9yZyBjb2RlXG4gIGNvbnN0cnVjdG9yOiAodXNlciwgb3JnKSAtPlxuICAgIEB1c2VyID0gdXNlclxuICAgIEBvcmcgPSBvcmdcblxuICAgIEBlZGl0YWJsZUNvbHMgPSBbJ3NvdXJjZXMnLCAnc291cmNlX25vdGVzJywgJ3Rlc3RzJywgJ3Jlc3BvbnNlcyddXG5cbiAgaW5zZXJ0OiAoY29sKSAtPlxuICAgIGlmIG5vdCAoY29sIGluIEBlZGl0YWJsZUNvbHMpXG4gICAgICByZXR1cm4gZmFsc2VcbiAgICByZXR1cm4gdHJ1ZVxuXG4gIHVwZGF0ZTogKGNvbCwgZG9jKSAtPlxuICAgIGlmIG5vdCAoY29sIGluIEBlZGl0YWJsZUNvbHMpXG4gICAgICByZXR1cm4gZmFsc2VcblxuICAgIGlmIG5vdCBkb2NcbiAgICAgIHJldHVybiB0cnVlXG5cbiAgICBpZiBkb2Mub3JnIGFuZCBAb3JnXG4gICAgICByZXR1cm4gZG9jLnVzZXIgPT0gQHVzZXIgfHwgZG9jLm9yZyA9PSBAb3JnXG4gICAgZWxzZVxuICAgICAgcmV0dXJuIGRvYy51c2VyID09IEB1c2VyXG5cbiAgcmVtb3ZlOiAoY29sLCBkb2MpIC0+XG4gICAgaWYgbm90IChjb2wgaW4gQGVkaXRhYmxlQ29scylcbiAgICAgIHJldHVybiBmYWxzZVxuXG4gICAgaWYgbm90IGRvY1xuICAgICAgcmV0dXJuIHRydWVcblxuICAgIGlmIGRvYy5vcmcgYW5kIEBvcmdcbiAgICAgIHJldHVybiBkb2MudXNlciA9PSBAdXNlciB8fCBkb2Mub3JnID09IEBvcmdcbiAgICBlbHNlXG4gICAgICByZXR1cm4gZG9jLnVzZXIgPT0gQHVzZXJcblxuXG4gICAgIiwiXG4jIFRyYWNrcyBhIHNldCBvZiBpdGVtcyBieSBpZCwgaW5kaWNhdGluZyB3aGljaCBoYXZlIGJlZW4gYWRkZWQgb3IgcmVtb3ZlZC5cbiMgQ2hhbmdlcyBhcmUgYm90aCBhZGQgYW5kIHJlbW92ZVxuY2xhc3MgSXRlbVRyYWNrZXJcbiAgY29uc3RydWN0b3I6IC0+XG4gICAgQGtleSA9ICdfaWQnXG4gICAgQGl0ZW1zID0ge31cblxuICB1cGRhdGU6IChpdGVtcykgLT4gICAgIyBSZXR1cm4gW1thZGRlZF0sW3JlbW92ZWRdXSBpdGVtc1xuICAgIGFkZHMgPSBbXVxuICAgIHJlbW92ZXMgPSBbXVxuXG4gICAgIyBBZGQgYW55IG5ldyBvbmVzXG4gICAgZm9yIGl0ZW0gaW4gaXRlbXNcbiAgICAgIGlmIG5vdCBfLmhhcyhAaXRlbXMsIGl0ZW1bQGtleV0pXG4gICAgICAgIGFkZHMucHVzaChpdGVtKVxuXG4gICAgIyBDcmVhdGUgbWFwIG9mIGl0ZW1zIHBhcmFtZXRlclxuICAgIG1hcCA9IF8ub2JqZWN0KF8ucGx1Y2soaXRlbXMsIEBrZXkpLCBpdGVtcylcblxuICAgICMgRmluZCByZW1vdmVzXG4gICAgZm9yIGtleSwgdmFsdWUgb2YgQGl0ZW1zXG4gICAgICBpZiBub3QgXy5oYXMobWFwLCBrZXkpXG4gICAgICAgIHJlbW92ZXMucHVzaCh2YWx1ZSlcbiAgICAgIGVsc2UgaWYgbm90IF8uaXNFcXVhbCh2YWx1ZSwgbWFwW2tleV0pXG4gICAgICAgIGFkZHMucHVzaChtYXBba2V5XSlcbiAgICAgICAgcmVtb3Zlcy5wdXNoKHZhbHVlKVxuXG4gICAgZm9yIGl0ZW0gaW4gcmVtb3Zlc1xuICAgICAgZGVsZXRlIEBpdGVtc1tpdGVtW0BrZXldXVxuXG4gICAgZm9yIGl0ZW0gaW4gYWRkc1xuICAgICAgQGl0ZW1zW2l0ZW1bQGtleV1dID0gaXRlbVxuXG4gICAgcmV0dXJuIFthZGRzLCByZW1vdmVzXVxuXG5tb2R1bGUuZXhwb3J0cyA9IEl0ZW1UcmFja2VyIiwiIyBHZW9KU09OIGhlbHBlciByb3V0aW5lc1xuXG4jIENvbnZlcnRzIG5hdmlnYXRvciBwb3NpdGlvbiB0byBwb2ludFxuZXhwb3J0cy5wb3NUb1BvaW50ID0gKHBvcykgLT5cbiAgcmV0dXJuIHtcbiAgICB0eXBlOiAnUG9pbnQnXG4gICAgY29vcmRpbmF0ZXM6IFtwb3MuY29vcmRzLmxvbmdpdHVkZSwgcG9zLmNvb3Jkcy5sYXRpdHVkZV1cbiAgfVxuXG5cbmV4cG9ydHMubGF0TG5nQm91bmRzVG9HZW9KU09OID0gKGJvdW5kcykgLT5cbiAgc3cgPSBib3VuZHMuZ2V0U291dGhXZXN0KClcbiAgbmUgPSBib3VuZHMuZ2V0Tm9ydGhFYXN0KClcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiAnUG9seWdvbicsXG4gICAgY29vcmRpbmF0ZXM6IFtcbiAgICAgIFtbc3cubG5nLCBzdy5sYXRdLCBcbiAgICAgIFtzdy5sbmcsIG5lLmxhdF0sIFxuICAgICAgW25lLmxuZywgbmUubGF0XSwgXG4gICAgICBbbmUubG5nLCBzdy5sYXRdLFxuICAgICAgW3N3LmxuZywgc3cubGF0XV1cbiAgICBdXG4gIH1cblxuIyBUT0RPOiBvbmx5IHdvcmtzIHdpdGggYm91bmRzXG5leHBvcnRzLnBvaW50SW5Qb2x5Z29uID0gKHBvaW50LCBwb2x5Z29uKSAtPlxuICAjIENoZWNrIHRoYXQgZmlyc3QgPT0gbGFzdFxuICBpZiBub3QgXy5pc0VxdWFsKF8uZmlyc3QocG9seWdvbi5jb29yZGluYXRlc1swXSksIF8ubGFzdChwb2x5Z29uLmNvb3JkaW5hdGVzWzBdKSlcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJGaXJzdCBtdXN0IGVxdWFsIGxhc3RcIilcblxuICAjIEdldCBib3VuZHNcbiAgYm91bmRzID0gbmV3IEwuTGF0TG5nQm91bmRzKF8ubWFwKHBvbHlnb24uY29vcmRpbmF0ZXNbMF0sIChjb29yZCkgLT4gbmV3IEwuTGF0TG5nKGNvb3JkWzFdLCBjb29yZFswXSkpKVxuICByZXR1cm4gYm91bmRzLmNvbnRhaW5zKG5ldyBMLkxhdExuZyhwb2ludC5jb29yZGluYXRlc1sxXSwgcG9pbnQuY29vcmRpbmF0ZXNbMF0pKVxuXG5leHBvcnRzLmdldFJlbGF0aXZlTG9jYXRpb24gPSAoZnJvbSwgdG8pIC0+XG4gIHgxID0gZnJvbS5jb29yZGluYXRlc1swXVxuICB5MSA9IGZyb20uY29vcmRpbmF0ZXNbMV1cbiAgeDIgPSB0by5jb29yZGluYXRlc1swXVxuICB5MiA9IHRvLmNvb3JkaW5hdGVzWzFdXG4gIFxuICAjIENvbnZlcnQgdG8gcmVsYXRpdmUgcG9zaXRpb24gKGFwcHJveGltYXRlKVxuICBkeSA9ICh5MiAtIHkxKSAvIDU3LjMgKiA2MzcxMDAwXG4gIGR4ID0gTWF0aC5jb3MoeTEgLyA1Ny4zKSAqICh4MiAtIHgxKSAvIDU3LjMgKiA2MzcxMDAwXG4gIFxuICAjIERldGVybWluZSBkaXJlY3Rpb24gYW5kIGFuZ2xlXG4gIGRpc3QgPSBNYXRoLnNxcnQoZHggKiBkeCArIGR5ICogZHkpXG4gIGFuZ2xlID0gOTAgLSAoTWF0aC5hdGFuMihkeSwgZHgpICogNTcuMylcbiAgYW5nbGUgKz0gMzYwIGlmIGFuZ2xlIDwgMFxuICBhbmdsZSAtPSAzNjAgaWYgYW5nbGUgPiAzNjBcbiAgXG4gICMgR2V0IGFwcHJveGltYXRlIGRpcmVjdGlvblxuICBjb21wYXNzRGlyID0gKE1hdGguZmxvb3IoKGFuZ2xlICsgMjIuNSkgLyA0NSkpICUgOFxuICBjb21wYXNzU3RycyA9IFtcIk5cIiwgXCJORVwiLCBcIkVcIiwgXCJTRVwiLCBcIlNcIiwgXCJTV1wiLCBcIldcIiwgXCJOV1wiXVxuICBpZiBkaXN0ID4gMTAwMFxuICAgIChkaXN0IC8gMTAwMCkudG9GaXhlZCgxKSArIFwia20gXCIgKyBjb21wYXNzU3Ryc1tjb21wYXNzRGlyXVxuICBlbHNlXG4gICAgKGRpc3QpLnRvRml4ZWQoMCkgKyBcIm0gXCIgKyBjb21wYXNzU3Ryc1tjb21wYXNzRGlyXSIsIm1vZHVsZS5leHBvcnRzID0gY2xhc3MgUmVtb3RlRGJcbiAgIyBVcmwgbXVzdCBoYXZlIHRyYWlsaW5nIC9cbiAgY29uc3RydWN0b3I6ICh1cmwsIGNsaWVudCkgLT5cbiAgICBAdXJsID0gdXJsXG4gICAgQGNsaWVudCA9IGNsaWVudFxuICAgIEBjb2xsZWN0aW9ucyA9IHt9XG5cbiAgYWRkQ29sbGVjdGlvbjogKG5hbWUpIC0+XG4gICAgY29sbGVjdGlvbiA9IG5ldyBDb2xsZWN0aW9uKG5hbWUsIEB1cmwgKyBuYW1lLCBAY2xpZW50KVxuICAgIEBbbmFtZV0gPSBjb2xsZWN0aW9uXG4gICAgQGNvbGxlY3Rpb25zW25hbWVdID0gY29sbGVjdGlvblxuXG4gIHJlbW92ZUNvbGxlY3Rpb246IChuYW1lKSAtPlxuICAgIGRlbGV0ZSBAW25hbWVdXG4gICAgZGVsZXRlIEBjb2xsZWN0aW9uc1tuYW1lXVxuXG4jIFJlbW90ZSBjb2xsZWN0aW9uIG9uIHNlcnZlclxuY2xhc3MgQ29sbGVjdGlvblxuICBjb25zdHJ1Y3RvcjogKG5hbWUsIHVybCwgY2xpZW50KSAtPlxuICAgIEBuYW1lID0gbmFtZVxuICAgIEB1cmwgPSB1cmxcbiAgICBAY2xpZW50ID0gY2xpZW50XG5cbiAgZmluZDogKHNlbGVjdG9yLCBvcHRpb25zID0ge30pIC0+XG4gICAgcmV0dXJuIGZldGNoOiAoc3VjY2VzcywgZXJyb3IpID0+XG4gICAgICAjIENyZWF0ZSB1cmxcbiAgICAgIHBhcmFtcyA9IHt9XG4gICAgICBpZiBvcHRpb25zLnNvcnRcbiAgICAgICAgcGFyYW1zLnNvcnQgPSBKU09OLnN0cmluZ2lmeShvcHRpb25zLnNvcnQpXG4gICAgICBpZiBvcHRpb25zLmxpbWl0XG4gICAgICAgIHBhcmFtcy5saW1pdCA9IG9wdGlvbnMubGltaXRcbiAgICAgIGlmIG9wdGlvbnMuZmllbGRzXG4gICAgICAgIHBhcmFtcy5maWVsZHMgPSBKU09OLnN0cmluZ2lmeShvcHRpb25zLmZpZWxkcylcbiAgICAgIHBhcmFtcy5jbGllbnQgPSBAY2xpZW50XG4gICAgICBwYXJhbXMuc2VsZWN0b3IgPSBKU09OLnN0cmluZ2lmeShzZWxlY3RvciB8fCB7fSlcblxuICAgICAgcmVxID0gJC5nZXRKU09OKEB1cmwsIHBhcmFtcylcbiAgICAgIHJlcS5kb25lIChkYXRhLCB0ZXh0U3RhdHVzLCBqcVhIUikgPT5cbiAgICAgICAgc3VjY2VzcyhkYXRhKVxuICAgICAgcmVxLmZhaWwgKGpxWEhSLCB0ZXh0U3RhdHVzLCBlcnJvclRocm93bikgPT5cbiAgICAgICAgaWYgZXJyb3JcbiAgICAgICAgICBlcnJvcihlcnJvclRocm93bilcblxuICBmaW5kT25lOiAoc2VsZWN0b3IsIG9wdGlvbnMgPSB7fSwgc3VjY2VzcywgZXJyb3IpIC0+XG4gICAgaWYgXy5pc0Z1bmN0aW9uKG9wdGlvbnMpIFxuICAgICAgW29wdGlvbnMsIHN1Y2Nlc3MsIGVycm9yXSA9IFt7fSwgb3B0aW9ucywgc3VjY2Vzc11cblxuICAgICMgQ3JlYXRlIHVybFxuICAgIHBhcmFtcyA9IHt9XG4gICAgaWYgb3B0aW9ucy5zb3J0XG4gICAgICBwYXJhbXMuc29ydCA9IEpTT04uc3RyaW5naWZ5KG9wdGlvbnMuc29ydClcbiAgICBwYXJhbXMubGltaXQgPSAxXG4gICAgcGFyYW1zLmNsaWVudCA9IEBjbGllbnRcbiAgICBwYXJhbXMuc2VsZWN0b3IgPSBKU09OLnN0cmluZ2lmeShzZWxlY3RvciB8fCB7fSlcblxuICAgIHJlcSA9ICQuZ2V0SlNPTihAdXJsLCBwYXJhbXMpXG4gICAgcmVxLmRvbmUgKGRhdGEsIHRleHRTdGF0dXMsIGpxWEhSKSA9PlxuICAgICAgc3VjY2VzcyhkYXRhWzBdIHx8IG51bGwpXG4gICAgcmVxLmZhaWwgKGpxWEhSLCB0ZXh0U3RhdHVzLCBlcnJvclRocm93bikgPT5cbiAgICAgIGlmIGVycm9yXG4gICAgICAgIGVycm9yKGVycm9yVGhyb3duKVxuXG4gIHVwc2VydDogKGRvYywgc3VjY2VzcywgZXJyb3IpIC0+XG4gICAgaWYgbm90IGRvYy5faWRcbiAgICAgIGRvYy5faWQgPSBjcmVhdGVVaWQoKVxuXG4gICAgcmVxID0gJC5hamF4KEB1cmwgKyBcIj9jbGllbnQ9XCIgKyBAY2xpZW50LCB7XG4gICAgICBkYXRhIDogSlNPTi5zdHJpbmdpZnkoZG9jKSxcbiAgICAgIGNvbnRlbnRUeXBlIDogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgdHlwZSA6ICdQT1NUJ30pXG4gICAgcmVxLmRvbmUgKGRhdGEsIHRleHRTdGF0dXMsIGpxWEhSKSA9PlxuICAgICAgc3VjY2VzcyhkYXRhIHx8IG51bGwpXG4gICAgcmVxLmZhaWwgKGpxWEhSLCB0ZXh0U3RhdHVzLCBlcnJvclRocm93bikgPT5cbiAgICAgIGlmIGVycm9yXG4gICAgICAgIGVycm9yKGVycm9yVGhyb3duKVxuXG4gIHJlbW92ZTogKGlkLCBzdWNjZXNzLCBlcnJvcikgLT5cbiAgICByZXEgPSAkLmFqYXgoQHVybCArIFwiL1wiICsgaWQgKyBcIj9jbGllbnQ9XCIgKyBAY2xpZW50LCB7IHR5cGUgOiAnREVMRVRFJ30pXG4gICAgcmVxLmRvbmUgKGRhdGEsIHRleHRTdGF0dXMsIGpxWEhSKSA9PlxuICAgICAgc3VjY2VzcygpXG4gICAgcmVxLmZhaWwgKGpxWEhSLCB0ZXh0U3RhdHVzLCBlcnJvclRocm93bikgPT5cbiAgICAgIGlmIGpxWEhSLnN0YXR1cyA9PSA0MDRcbiAgICAgICAgc3VjY2VzcygpXG4gICAgICBlbHNlIGlmIGVycm9yXG4gICAgICAgIGVycm9yKGVycm9yVGhyb3duKVxuXG5cbmNyZWF0ZVVpZCA9IC0+IFxuICAneHh4eHh4eHh4eHh4NHh4eHl4eHh4eHh4eHh4eHh4eHgnLnJlcGxhY2UoL1t4eV0vZywgKGMpIC0+XG4gICAgciA9IE1hdGgucmFuZG9tKCkqMTZ8MFxuICAgIHYgPSBpZiBjID09ICd4JyB0aGVuIHIgZWxzZSAociYweDN8MHg4KVxuICAgIHJldHVybiB2LnRvU3RyaW5nKDE2KVxuICAgKSIsIkxvY2F0aW9uRmluZGVyID0gcmVxdWlyZSAnLi9Mb2NhdGlvbkZpbmRlcidcbkdlb0pTT04gPSByZXF1aXJlICcuL0dlb0pTT04nXG5cbiMgU2hvd3MgdGhlIHJlbGF0aXZlIGxvY2F0aW9uIG9mIGEgcG9pbnQgYW5kIGFsbG93cyBzZXR0aW5nIGl0XG4jIEZpcmVzIGV2ZW50cyBsb2NhdGlvbnNldCwgbWFwLCBib3RoIHdpdGggXG5jbGFzcyBMb2NhdGlvblZpZXcgZXh0ZW5kcyBCYWNrYm9uZS5WaWV3XG4gIGNvbnN0cnVjdG9yOiAob3B0aW9ucykgLT5cbiAgICBzdXBlcigpXG4gICAgQGxvYyA9IG9wdGlvbnMubG9jXG4gICAgQHNldHRpbmdMb2NhdGlvbiA9IGZhbHNlXG4gICAgQGxvY2F0aW9uRmluZGVyID0gb3B0aW9ucy5sb2NhdGlvbkZpbmRlciB8fCBuZXcgTG9jYXRpb25GaW5kZXIoKVxuXG4gICAgIyBMaXN0ZW4gdG8gbG9jYXRpb24gZXZlbnRzXG4gICAgQGxpc3RlblRvKEBsb2NhdGlvbkZpbmRlciwgJ2ZvdW5kJywgQGxvY2F0aW9uRm91bmQpXG4gICAgQGxpc3RlblRvKEBsb2NhdGlvbkZpbmRlciwgJ2Vycm9yJywgQGxvY2F0aW9uRXJyb3IpXG5cbiAgICAjIFN0YXJ0IHRyYWNraW5nIGxvY2F0aW9uIGlmIHNldFxuICAgIGlmIEBsb2NcbiAgICAgIEBsb2NhdGlvbkZpbmRlci5zdGFydFdhdGNoKClcblxuICAgIEByZW5kZXIoKVxuXG4gIGV2ZW50czpcbiAgICAnY2xpY2sgI2xvY2F0aW9uX21hcCcgOiAnbWFwQ2xpY2tlZCdcbiAgICAnY2xpY2sgI2xvY2F0aW9uX3NldCcgOiAnc2V0TG9jYXRpb24nXG5cbiAgcmVtb3ZlOiAtPlxuICAgIEBsb2NhdGlvbkZpbmRlci5zdG9wV2F0Y2goKVxuICAgIHN1cGVyKClcblxuICByZW5kZXI6IC0+XG4gICAgQCRlbC5odG1sIHRlbXBsYXRlc1snTG9jYXRpb25WaWV3J10oKVxuXG4gICAgIyBTZXQgbG9jYXRpb24gc3RyaW5nXG4gICAgaWYgQGVycm9yRmluZGluZ0xvY2F0aW9uXG4gICAgICBAJChcIiNsb2NhdGlvbl9yZWxhdGl2ZVwiKS50ZXh0KFwiQ2Fubm90IGZpbmQgbG9jYXRpb25cIilcbiAgICBlbHNlIGlmIG5vdCBAbG9jIGFuZCBub3QgQHNldHRpbmdMb2NhdGlvbiBcbiAgICAgIEAkKFwiI2xvY2F0aW9uX3JlbGF0aXZlXCIpLnRleHQoXCJVbnNwZWNpZmllZCBsb2NhdGlvblwiKVxuICAgIGVsc2UgaWYgQHNldHRpbmdMb2NhdGlvblxuICAgICAgQCQoXCIjbG9jYXRpb25fcmVsYXRpdmVcIikudGV4dChcIlNldHRpbmcgbG9jYXRpb24uLi5cIilcbiAgICBlbHNlIGlmIG5vdCBAY3VycmVudExvY1xuICAgICAgQCQoXCIjbG9jYXRpb25fcmVsYXRpdmVcIikudGV4dChcIldhaXRpbmcgZm9yIEdQUy4uLlwiKVxuICAgIGVsc2VcbiAgICAgIEAkKFwiI2xvY2F0aW9uX3JlbGF0aXZlXCIpLnRleHQoR2VvSlNPTi5nZXRSZWxhdGl2ZUxvY2F0aW9uKEBjdXJyZW50TG9jLCBAbG9jKSlcblxuICAgICMgRGlzYWJsZSBtYXAgaWYgbG9jYXRpb24gbm90IHNldFxuICAgIEAkKFwiI2xvY2F0aW9uX21hcFwiKS5hdHRyKFwiZGlzYWJsZWRcIiwgbm90IEBsb2MpO1xuXG4gICAgIyBEaXNhYmxlIHNldCBpZiBzZXR0aW5nXG4gICAgQCQoXCIjbG9jYXRpb25fc2V0XCIpLmF0dHIoXCJkaXNhYmxlZFwiLCBAc2V0dGluZ0xvY2F0aW9uID09IHRydWUpOyAgICBcblxuICBzZXRMb2NhdGlvbjogLT5cbiAgICBAc2V0dGluZ0xvY2F0aW9uID0gdHJ1ZVxuICAgIEBlcnJvckZpbmRpbmdMb2NhdGlvbiA9IGZhbHNlXG4gICAgQGxvY2F0aW9uRmluZGVyLnN0YXJ0V2F0Y2goKVxuICAgIEByZW5kZXIoKVxuXG4gIGxvY2F0aW9uRm91bmQ6IChwb3MpID0+XG4gICAgaWYgQHNldHRpbmdMb2NhdGlvblxuICAgICAgQHNldHRpbmdMb2NhdGlvbiA9IGZhbHNlXG4gICAgICBAZXJyb3JGaW5kaW5nTG9jYXRpb24gPSBmYWxzZVxuXG4gICAgICAjIFNldCBsb2NhdGlvblxuICAgICAgQGxvYyA9IEdlb0pTT04ucG9zVG9Qb2ludChwb3MpXG4gICAgICBAdHJpZ2dlcignbG9jYXRpb25zZXQnLCBAbG9jKVxuXG4gICAgQGN1cnJlbnRMb2MgPSBHZW9KU09OLnBvc1RvUG9pbnQocG9zKVxuICAgIEByZW5kZXIoKVxuXG4gIGxvY2F0aW9uRXJyb3I6ID0+XG4gICAgQHNldHRpbmdMb2NhdGlvbiA9IGZhbHNlXG4gICAgQGVycm9yRmluZGluZ0xvY2F0aW9uID0gdHJ1ZVxuICAgIEByZW5kZXIoKVxuXG4gIG1hcENsaWNrZWQ6ID0+XG4gICAgQHRyaWdnZXIoJ21hcCcsIEBsb2MpXG5cblxubW9kdWxlLmV4cG9ydHMgPSBMb2NhdGlvblZpZXciLCJQYWdlID0gcmVxdWlyZSBcIi4uL1BhZ2VcIlxuXG4jIERpc3BsYXlzIGFuIGltYWdlLiBPcHRpb25zOiB1aWQ6IHVpZCBvZiBpbWFnZVxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBJbWFnZVBhZ2UgZXh0ZW5kcyBQYWdlXG4gIGNyZWF0ZTogLT5cbiAgICBAJGVsLmh0bWwgdGVtcGxhdGVzWydwYWdlcy9JbWFnZVBhZ2UnXSgpXG5cbiAgICAjIEdldCBpbWFnZSB1cmxcbiAgICBAaW1hZ2VNYW5hZ2VyLmdldEltYWdlVXJsKEBvcHRpb25zLmlkLCAodXJsKSA9PlxuICAgICAgQCQoXCIjbWVzc2FnZV9iYXJcIikuaGlkZSgpXG4gICAgICBAJChcIiNpbWFnZVwiKS5hdHRyKFwic3JjXCIsIHVybCkuc2hvdygpXG4gICAgLCBAZXJyb3IpXG5cbiAgYWN0aXZhdGU6IC0+XG4gICAgQHNldFRpdGxlIFwiSW1hZ2VcIlxuXG4gICAgIyBJZiByZW1vdmUgYWxsb3dlZCwgc2V0IGluIGJ1dHRvbiBiYXJcbiAgICBpZiBAb3B0aW9ucy5vblJlbW92ZVxuICAgICAgQHNldHVwQnV0dG9uQmFyIFtcbiAgICAgICAgeyBpY29uOiBcImRlbGV0ZS5wbmdcIiwgY2xpY2s6ID0+IEByZW1vdmVQaG90bygpIH1cbiAgICAgIF1cbiAgICBlbHNlXG4gICAgICBAc2V0dXBCdXR0b25CYXIgW11cblxuICByZW1vdmVQaG90bzogLT5cbiAgICBpZiBjb25maXJtKFwiUmVtb3ZlIGltYWdlP1wiKVxuICAgICAgQG9wdGlvbnMub25SZW1vdmUoKVxuICAgICAgQHBhZ2VyLmNsb3NlUGFnZSgpXG4iLCJjcmVhdGVVaWQgPSByZXF1aXJlKCcuL3V0aWxzJykuY3JlYXRlVWlkXG5wcm9jZXNzRmluZCA9IHJlcXVpcmUoJy4vdXRpbHMnKS5wcm9jZXNzRmluZFxuY29tcGlsZVNvcnQgPSByZXF1aXJlKCcuL3NlbGVjdG9yJykuY29tcGlsZVNvcnRcblxuY2xhc3MgTG9jYWxEYlxuICBjb25zdHJ1Y3RvcjogKG5hbWUsIG9wdGlvbnMpIC0+XG4gICAgQG5hbWUgPSBuYW1lXG4gICAgQGNvbGxlY3Rpb25zID0ge31cblxuICAgIGlmIG9wdGlvbnMgYW5kIG9wdGlvbnMubmFtZXNwYWNlIGFuZCB3aW5kb3cubG9jYWxTdG9yYWdlXG4gICAgICBAbmFtZXNwYWNlID0gb3B0aW9ucy5uYW1lc3BhY2VcblxuICBhZGRDb2xsZWN0aW9uOiAobmFtZSkgLT5cbiAgICAjIFNldCBuYW1lc3BhY2UgZm9yIGNvbGxlY3Rpb25cbiAgICBuYW1lc3BhY2UgPSBAbmFtZXNwYWNlK1wiLlwiK25hbWUgaWYgQG5hbWVzcGFjZVxuXG4gICAgY29sbGVjdGlvbiA9IG5ldyBDb2xsZWN0aW9uKG5hbWUsIG5hbWVzcGFjZSlcbiAgICBAW25hbWVdID0gY29sbGVjdGlvblxuICAgIEBjb2xsZWN0aW9uc1tuYW1lXSA9IGNvbGxlY3Rpb25cblxuICByZW1vdmVDb2xsZWN0aW9uOiAobmFtZSkgLT5cbiAgICBpZiBAbmFtZXNwYWNlIGFuZCB3aW5kb3cubG9jYWxTdG9yYWdlXG4gICAgICBrZXlzID0gW11cbiAgICAgIGZvciBpIGluIFswLi4ubG9jYWxTdG9yYWdlLmxlbmd0aF1cbiAgICAgICAga2V5cy5wdXNoKGxvY2FsU3RvcmFnZS5rZXkoaSkpXG5cbiAgICAgIGZvciBrZXkgaW4ga2V5c1xuICAgICAgICBpZiBrZXkuc3Vic3RyaW5nKDAsIEBuYW1lc3BhY2UubGVuZ3RoICsgMSkgPT0gQG5hbWVzcGFjZSArIFwiLlwiXG4gICAgICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oa2V5KVxuXG4gICAgZGVsZXRlIEBbbmFtZV1cbiAgICBkZWxldGUgQGNvbGxlY3Rpb25zW25hbWVdXG5cblxuIyBTdG9yZXMgZGF0YSBpbiBtZW1vcnksIG9wdGlvbmFsbHkgYmFja2VkIGJ5IGxvY2FsIHN0b3JhZ2VcbmNsYXNzIENvbGxlY3Rpb25cbiAgY29uc3RydWN0b3I6IChuYW1lLCBuYW1lc3BhY2UpIC0+XG4gICAgQG5hbWUgPSBuYW1lXG4gICAgQG5hbWVzcGFjZSA9IG5hbWVzcGFjZVxuXG4gICAgQGl0ZW1zID0ge31cbiAgICBAdXBzZXJ0cyA9IHt9ICAjIFBlbmRpbmcgdXBzZXJ0cyBieSBfaWQuIFN0aWxsIGluIGl0ZW1zXG4gICAgQHJlbW92ZXMgPSB7fSAgIyBQZW5kaW5nIHJlbW92ZXMgYnkgX2lkLiBObyBsb25nZXIgaW4gaXRlbXNcblxuICAgICMgUmVhZCBmcm9tIGxvY2FsIHN0b3JhZ2VcbiAgICBpZiB3aW5kb3cubG9jYWxTdG9yYWdlIGFuZCBuYW1lc3BhY2U/XG4gICAgICBAbG9hZFN0b3JhZ2UoKVxuXG4gIGxvYWRTdG9yYWdlOiAtPlxuICAgICMgUmVhZCBpdGVtcyBmcm9tIGxvY2FsU3RvcmFnZVxuICAgIEBpdGVtTmFtZXNwYWNlID0gQG5hbWVzcGFjZSArIFwiX1wiXG5cbiAgICBmb3IgaSBpbiBbMC4uLmxvY2FsU3RvcmFnZS5sZW5ndGhdXG4gICAgICBrZXkgPSBsb2NhbFN0b3JhZ2Uua2V5KGkpXG4gICAgICBpZiBrZXkuc3Vic3RyaW5nKDAsIEBpdGVtTmFtZXNwYWNlLmxlbmd0aCkgPT0gQGl0ZW1OYW1lc3BhY2VcbiAgICAgICAgaXRlbSA9IEpTT04ucGFyc2UobG9jYWxTdG9yYWdlW2tleV0pXG4gICAgICAgIEBpdGVtc1tpdGVtLl9pZF0gPSBpdGVtXG5cbiAgICAjIFJlYWQgdXBzZXJ0c1xuICAgIHVwc2VydEtleXMgPSBpZiBsb2NhbFN0b3JhZ2VbQG5hbWVzcGFjZStcInVwc2VydHNcIl0gdGhlbiBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZVtAbmFtZXNwYWNlK1widXBzZXJ0c1wiXSkgZWxzZSBbXVxuICAgIGZvciBrZXkgaW4gdXBzZXJ0S2V5c1xuICAgICAgQHVwc2VydHNba2V5XSA9IEBpdGVtc1trZXldXG5cbiAgICAjIFJlYWQgcmVtb3Zlc1xuICAgIHJlbW92ZUl0ZW1zID0gaWYgbG9jYWxTdG9yYWdlW0BuYW1lc3BhY2UrXCJyZW1vdmVzXCJdIHRoZW4gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2VbQG5hbWVzcGFjZStcInJlbW92ZXNcIl0pIGVsc2UgW11cbiAgICBAcmVtb3ZlcyA9IF8ub2JqZWN0KF8ucGx1Y2socmVtb3ZlSXRlbXMsIFwiX2lkXCIpLCByZW1vdmVJdGVtcylcblxuICBmaW5kOiAoc2VsZWN0b3IsIG9wdGlvbnMpIC0+XG4gICAgcmV0dXJuIGZldGNoOiAoc3VjY2VzcywgZXJyb3IpID0+XG4gICAgICBAX2ZpbmRGZXRjaChzZWxlY3Rvciwgb3B0aW9ucywgc3VjY2VzcywgZXJyb3IpXG5cbiAgZmluZE9uZTogKHNlbGVjdG9yLCBvcHRpb25zLCBzdWNjZXNzLCBlcnJvcikgLT5cbiAgICBpZiBfLmlzRnVuY3Rpb24ob3B0aW9ucykgXG4gICAgICBbb3B0aW9ucywgc3VjY2VzcywgZXJyb3JdID0gW3t9LCBvcHRpb25zLCBzdWNjZXNzXVxuXG4gICAgQGZpbmQoc2VsZWN0b3IsIG9wdGlvbnMpLmZldGNoIChyZXN1bHRzKSAtPlxuICAgICAgaWYgc3VjY2Vzcz8gdGhlbiBzdWNjZXNzKGlmIHJlc3VsdHMubGVuZ3RoPjAgdGhlbiByZXN1bHRzWzBdIGVsc2UgbnVsbClcbiAgICAsIGVycm9yXG5cbiAgX2ZpbmRGZXRjaDogKHNlbGVjdG9yLCBvcHRpb25zLCBzdWNjZXNzLCBlcnJvcikgLT5cbiAgICBpZiBzdWNjZXNzPyB0aGVuIHN1Y2Nlc3MocHJvY2Vzc0ZpbmQoQGl0ZW1zLCBzZWxlY3Rvciwgb3B0aW9ucykpXG5cbiAgdXBzZXJ0OiAoZG9jLCBzdWNjZXNzLCBlcnJvcikgLT5cbiAgICBpZiBub3QgZG9jLl9pZFxuICAgICAgZG9jLl9pZCA9IGNyZWF0ZVVpZCgpXG5cbiAgICAjIFJlcGxhY2UvYWRkIFxuICAgIEBfcHV0SXRlbShkb2MpXG4gICAgQF9wdXRVcHNlcnQoZG9jKVxuXG4gICAgaWYgc3VjY2Vzcz8gdGhlbiBzdWNjZXNzKGRvYylcblxuICByZW1vdmU6IChpZCwgc3VjY2VzcywgZXJyb3IpIC0+XG4gICAgaWYgXy5oYXMoQGl0ZW1zLCBpZClcbiAgICAgIEBfcHV0UmVtb3ZlKEBpdGVtc1tpZF0pXG4gICAgICBAX2RlbGV0ZUl0ZW0oaWQpXG4gICAgICBAX2RlbGV0ZVVwc2VydChpZClcblxuICAgIGlmIHN1Y2Nlc3M/IHRoZW4gc3VjY2VzcygpXG5cbiAgX3B1dEl0ZW06IChkb2MpIC0+XG4gICAgQGl0ZW1zW2RvYy5faWRdID0gZG9jXG4gICAgaWYgQG5hbWVzcGFjZVxuICAgICAgbG9jYWxTdG9yYWdlW0BpdGVtTmFtZXNwYWNlICsgZG9jLl9pZF0gPSBKU09OLnN0cmluZ2lmeShkb2MpXG5cbiAgX2RlbGV0ZUl0ZW06IChpZCkgLT5cbiAgICBkZWxldGUgQGl0ZW1zW2lkXVxuICAgIGlmIEBuYW1lc3BhY2VcbiAgICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKEBpdGVtTmFtZXNwYWNlICsgaWQpXG5cbiAgX3B1dFVwc2VydDogKGRvYykgLT5cbiAgICBAdXBzZXJ0c1tkb2MuX2lkXSA9IGRvY1xuICAgIGlmIEBuYW1lc3BhY2VcbiAgICAgIGxvY2FsU3RvcmFnZVtAbmFtZXNwYWNlK1widXBzZXJ0c1wiXSA9IEpTT04uc3RyaW5naWZ5KF8ua2V5cyhAdXBzZXJ0cykpXG5cbiAgX2RlbGV0ZVVwc2VydDogKGlkKSAtPlxuICAgIGRlbGV0ZSBAdXBzZXJ0c1tpZF1cbiAgICBpZiBAbmFtZXNwYWNlXG4gICAgICBsb2NhbFN0b3JhZ2VbQG5hbWVzcGFjZStcInVwc2VydHNcIl0gPSBKU09OLnN0cmluZ2lmeShfLmtleXMoQHVwc2VydHMpKVxuXG4gIF9wdXRSZW1vdmU6IChkb2MpIC0+XG4gICAgQHJlbW92ZXNbZG9jLl9pZF0gPSBkb2NcbiAgICBpZiBAbmFtZXNwYWNlXG4gICAgICBsb2NhbFN0b3JhZ2VbQG5hbWVzcGFjZStcInJlbW92ZXNcIl0gPSBKU09OLnN0cmluZ2lmeShfLnZhbHVlcyhAcmVtb3ZlcykpXG5cbiAgX2RlbGV0ZVJlbW92ZTogKGlkKSAtPlxuICAgIGRlbGV0ZSBAcmVtb3Zlc1tpZF1cbiAgICBpZiBAbmFtZXNwYWNlXG4gICAgICBsb2NhbFN0b3JhZ2VbQG5hbWVzcGFjZStcInJlbW92ZXNcIl0gPSBKU09OLnN0cmluZ2lmeShfLnZhbHVlcyhAcmVtb3ZlcykpXG5cbiAgY2FjaGU6IChkb2NzLCBzZWxlY3Rvciwgb3B0aW9ucywgc3VjY2VzcywgZXJyb3IpIC0+XG4gICAgIyBBZGQgYWxsIG5vbi1sb2NhbCB0aGF0IGFyZSBub3QgdXBzZXJ0ZWQgb3IgcmVtb3ZlZFxuICAgIGZvciBkb2MgaW4gZG9jc1xuICAgICAgaWYgbm90IF8uaGFzKEB1cHNlcnRzLCBkb2MuX2lkKSBhbmQgbm90IF8uaGFzKEByZW1vdmVzLCBkb2MuX2lkKVxuICAgICAgICBAX3B1dEl0ZW0oZG9jKVxuXG4gICAgZG9jc01hcCA9IF8ub2JqZWN0KF8ucGx1Y2soZG9jcywgXCJfaWRcIiksIGRvY3MpXG5cbiAgICBpZiBvcHRpb25zLnNvcnRcbiAgICAgIHNvcnQgPSBjb21waWxlU29ydChvcHRpb25zLnNvcnQpXG5cbiAgICAjIFBlcmZvcm0gcXVlcnksIHJlbW92aW5nIHJvd3MgbWlzc2luZyBpbiBkb2NzIGZyb20gbG9jYWwgZGIgXG4gICAgQGZpbmQoc2VsZWN0b3IsIG9wdGlvbnMpLmZldGNoIChyZXN1bHRzKSA9PlxuICAgICAgZm9yIHJlc3VsdCBpbiByZXN1bHRzXG4gICAgICAgIGlmIG5vdCBkb2NzTWFwW3Jlc3VsdC5faWRdIGFuZCBub3QgXy5oYXMoQHVwc2VydHMsIHJlc3VsdC5faWQpXG4gICAgICAgICAgIyBJZiBwYXN0IGVuZCBvbiBzb3J0ZWQgbGltaXRlZCwgaWdub3JlXG4gICAgICAgICAgaWYgb3B0aW9ucy5zb3J0IGFuZCBvcHRpb25zLmxpbWl0IGFuZCBkb2NzLmxlbmd0aCA9PSBvcHRpb25zLmxpbWl0XG4gICAgICAgICAgICBpZiBzb3J0KHJlc3VsdCwgXy5sYXN0KGRvY3MpKSA+PSAwXG4gICAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgQF9kZWxldGVJdGVtKHJlc3VsdC5faWQpXG5cbiAgICAgIGlmIHN1Y2Nlc3M/IHRoZW4gc3VjY2VzcygpICBcbiAgICAsIGVycm9yXG4gICAgXG4gIHBlbmRpbmdVcHNlcnRzOiAoc3VjY2VzcykgLT5cbiAgICBzdWNjZXNzIF8udmFsdWVzKEB1cHNlcnRzKVxuXG4gIHBlbmRpbmdSZW1vdmVzOiAoc3VjY2VzcykgLT5cbiAgICBzdWNjZXNzIF8ucGx1Y2soQHJlbW92ZXMsIFwiX2lkXCIpXG5cbiAgcmVzb2x2ZVVwc2VydDogKGRvYywgc3VjY2VzcykgLT5cbiAgICBpZiBAdXBzZXJ0c1tkb2MuX2lkXSBhbmQgXy5pc0VxdWFsKGRvYywgQHVwc2VydHNbZG9jLl9pZF0pXG4gICAgICBAX2RlbGV0ZVVwc2VydChkb2MuX2lkKVxuICAgIGlmIHN1Y2Nlc3M/IHRoZW4gc3VjY2VzcygpXG5cbiAgcmVzb2x2ZVJlbW92ZTogKGlkLCBzdWNjZXNzKSAtPlxuICAgIEBfZGVsZXRlUmVtb3ZlKGlkKVxuICAgIGlmIHN1Y2Nlc3M/IHRoZW4gc3VjY2VzcygpXG5cbiAgIyBBZGQgYnV0IGRvIG5vdCBvdmVyd3JpdGUgb3IgcmVjb3JkIGFzIHVwc2VydFxuICBzZWVkOiAoZG9jLCBzdWNjZXNzKSAtPlxuICAgIGlmIG5vdCBfLmhhcyhAaXRlbXMsIGRvYy5faWQpIGFuZCBub3QgXy5oYXMoQHJlbW92ZXMsIGRvYy5faWQpXG4gICAgICBAX3B1dEl0ZW0oZG9jKVxuICAgIGlmIHN1Y2Nlc3M/IHRoZW4gc3VjY2VzcygpXG5cbm1vZHVsZS5leHBvcnRzID0gTG9jYWxEYlxuIiwicHJvY2Vzc0ZpbmQgPSByZXF1aXJlKCcuL3V0aWxzJykucHJvY2Vzc0ZpbmRcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBIeWJyaWREYlxuICBjb25zdHJ1Y3RvcjogKGxvY2FsRGIsIHJlbW90ZURiKSAtPlxuICAgIEBsb2NhbERiID0gbG9jYWxEYlxuICAgIEByZW1vdGVEYiA9IHJlbW90ZURiXG4gICAgQGNvbGxlY3Rpb25zID0ge31cblxuICBhZGRDb2xsZWN0aW9uOiAobmFtZSkgLT5cbiAgICBjb2xsZWN0aW9uID0gbmV3IEh5YnJpZENvbGxlY3Rpb24obmFtZSwgQGxvY2FsRGJbbmFtZV0sIEByZW1vdGVEYltuYW1lXSlcbiAgICBAW25hbWVdID0gY29sbGVjdGlvblxuICAgIEBjb2xsZWN0aW9uc1tuYW1lXSA9IGNvbGxlY3Rpb25cblxuICByZW1vdmVDb2xsZWN0aW9uOiAobmFtZSkgLT5cbiAgICBkZWxldGUgQFtuYW1lXVxuICAgIGRlbGV0ZSBAY29sbGVjdGlvbnNbbmFtZV1cbiAgXG4gIHVwbG9hZDogKHN1Y2Nlc3MsIGVycm9yKSAtPlxuICAgIGNvbHMgPSBfLnZhbHVlcyhAY29sbGVjdGlvbnMpXG5cbiAgICB1cGxvYWRDb2xzID0gKGNvbHMsIHN1Y2Nlc3MsIGVycm9yKSA9PlxuICAgICAgY29sID0gXy5maXJzdChjb2xzKVxuICAgICAgaWYgY29sXG4gICAgICAgIGNvbC51cGxvYWQoKCkgPT5cbiAgICAgICAgICB1cGxvYWRDb2xzKF8ucmVzdChjb2xzKSwgc3VjY2VzcywgZXJyb3IpXG4gICAgICAgICwgKGVycikgPT5cbiAgICAgICAgICBlcnJvcihlcnIpKVxuICAgICAgZWxzZVxuICAgICAgICBzdWNjZXNzKClcbiAgICB1cGxvYWRDb2xzKGNvbHMsIHN1Y2Nlc3MsIGVycm9yKVxuXG5jbGFzcyBIeWJyaWRDb2xsZWN0aW9uXG4gIGNvbnN0cnVjdG9yOiAobmFtZSwgbG9jYWxDb2wsIHJlbW90ZUNvbCkgLT5cbiAgICBAbmFtZSA9IG5hbWVcbiAgICBAbG9jYWxDb2wgPSBsb2NhbENvbFxuICAgIEByZW1vdGVDb2wgPSByZW1vdGVDb2xcblxuICAjIG9wdGlvbnMubW9kZSBkZWZhdWx0cyB0byBcImh5YnJpZFwiLlxuICAjIEluIFwiaHlicmlkXCIsIGl0IHdpbGwgcmV0dXJuIGxvY2FsIHJlc3VsdHMsIHRoZW4gaGl0IHJlbW90ZSBhbmQgcmV0dXJuIGFnYWluIGlmIGRpZmZlcmVudFxuICAjIElmIHJlbW90ZSBnaXZlcyBlcnJvciwgaXQgd2lsbCBiZSBpZ25vcmVkXG4gICMgSW4gXCJyZW1vdGVcIiwgaXQgd2lsbCBjYWxsIHJlbW90ZSBhbmQgbm90IGNhY2hlLCBidXQgaW50ZWdyYXRlcyBsb2NhbCB1cHNlcnRzL2RlbGV0ZXNcbiAgIyBJZiByZW1vdGUgZ2l2ZXMgZXJyb3IsIHRoZW4gaXQgd2lsbCByZXR1cm4gbG9jYWwgcmVzdWx0c1xuICAjIEluIFwibG9jYWxcIiwganVzdCByZXR1cm5zIGxvY2FsIHJlc3VsdHNcbiAgZmluZDogKHNlbGVjdG9yLCBvcHRpb25zID0ge30pIC0+XG4gICAgcmV0dXJuIGZldGNoOiAoc3VjY2VzcywgZXJyb3IpID0+XG4gICAgICBAX2ZpbmRGZXRjaChzZWxlY3Rvciwgb3B0aW9ucywgc3VjY2VzcywgZXJyb3IpXG5cbiAgIyBvcHRpb25zLm1vZGUgZGVmYXVsdHMgdG8gXCJoeWJyaWRcIi5cbiAgIyBJbiBcImh5YnJpZFwiLCBpdCB3aWxsIHJldHVybiBsb2NhbCBpZiBwcmVzZW50LCBvdGhlcndpc2UgZmFsbCB0byByZW1vdGUgd2l0aG91dCByZXR1cm5pbmcgbnVsbFxuICAjIElmIHJlbW90ZSBnaXZlcyBlcnJvciwgdGhlbiBpdCB3aWxsIHJldHVybiBudWxsIGlmIG5vbmUgbG9jYWxseS4gSWYgcmVtb3RlIGFuZCBsb2NhbCBkaWZmZXIsIGl0XG4gICMgd2lsbCByZXR1cm4gdHdpY2VcbiAgIyBJbiBcImxvY2FsXCIsIGl0IHdpbGwgcmV0dXJuIGxvY2FsIGlmIHByZXNlbnQuIElmIG5vdCBwcmVzZW50LCBvbmx5IHRoZW4gd2lsbCBpdCBoaXQgcmVtb3RlLlxuICAjIElmIHJlbW90ZSBnaXZlcyBlcnJvciwgdGhlbiBpdCB3aWxsIHJldHVybiBudWxsXG4gICMgSW4gXCJyZW1vdGVcIi4uLiAobm90IGltcGxlbWVudGVkKVxuICBmaW5kT25lOiAoc2VsZWN0b3IsIG9wdGlvbnMgPSB7fSwgc3VjY2VzcywgZXJyb3IpIC0+XG4gICAgaWYgXy5pc0Z1bmN0aW9uKG9wdGlvbnMpIFxuICAgICAgW29wdGlvbnMsIHN1Y2Nlc3MsIGVycm9yXSA9IFt7fSwgb3B0aW9ucywgc3VjY2Vzc11cblxuICAgIG1vZGUgPSBvcHRpb25zLm1vZGUgfHwgXCJoeWJyaWRcIlxuXG4gICAgaWYgbW9kZSA9PSBcImh5YnJpZFwiIG9yIG1vZGUgPT0gXCJsb2NhbFwiXG4gICAgICBvcHRpb25zLmxpbWl0ID0gMVxuICAgICAgQGxvY2FsQ29sLmZpbmRPbmUgc2VsZWN0b3IsIG9wdGlvbnMsIChsb2NhbERvYykgPT5cbiAgICAgICAgIyBJZiBmb3VuZCwgcmV0dXJuXG4gICAgICAgIGlmIGxvY2FsRG9jXG4gICAgICAgICAgc3VjY2Vzcyhsb2NhbERvYylcbiAgICAgICAgICAjIE5vIG5lZWQgdG8gaGl0IHJlbW90ZSBpZiBsb2NhbFxuICAgICAgICAgIGlmIG1vZGUgPT0gXCJsb2NhbFwiXG4gICAgICAgICAgICByZXR1cm4gXG5cbiAgICAgICAgcmVtb3RlU3VjY2VzcyA9IChyZW1vdGVEb2MpID0+XG4gICAgICAgICAgIyBDYWNoZVxuICAgICAgICAgIGNhY2hlU3VjY2VzcyA9ID0+XG4gICAgICAgICAgICAjIFRyeSBxdWVyeSBhZ2FpblxuICAgICAgICAgICAgQGxvY2FsQ29sLmZpbmRPbmUgc2VsZWN0b3IsIG9wdGlvbnMsIChsb2NhbERvYzIpID0+XG4gICAgICAgICAgICAgIGlmIG5vdCBfLmlzRXF1YWwobG9jYWxEb2MsIGxvY2FsRG9jMilcbiAgICAgICAgICAgICAgICBzdWNjZXNzKGxvY2FsRG9jMilcbiAgICAgICAgICAgICAgZWxzZSBpZiBub3QgbG9jYWxEb2NcbiAgICAgICAgICAgICAgICBzdWNjZXNzKG51bGwpXG5cbiAgICAgICAgICBkb2NzID0gaWYgcmVtb3RlRG9jIHRoZW4gW3JlbW90ZURvY10gZWxzZSBbXVxuICAgICAgICAgIEBsb2NhbENvbC5jYWNoZShkb2NzLCBzZWxlY3Rvciwgb3B0aW9ucywgY2FjaGVTdWNjZXNzLCBlcnJvcilcblxuICAgICAgICByZW1vdGVFcnJvciA9ID0+XG4gICAgICAgICAgIyBSZW1vdGUgZXJyb3JlZCBvdXQuIFJldHVybiBudWxsIGlmIGxvY2FsIGRpZCBub3QgcmV0dXJuXG4gICAgICAgICAgaWYgbm90IGxvY2FsRG9jXG4gICAgICAgICAgICBzdWNjZXNzKG51bGwpXG5cbiAgICAgICAgIyBDYWxsIHJlbW90ZVxuICAgICAgICBAcmVtb3RlQ29sLmZpbmRPbmUgc2VsZWN0b3IsIF8ub21pdChvcHRpb25zLCAnZmllbGRzJyksIHJlbW90ZVN1Y2Nlc3MsIHJlbW90ZUVycm9yXG4gICAgICAsIGVycm9yXG4gICAgZWxzZSBcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlVua25vd24gbW9kZVwiKVxuXG4gIF9maW5kRmV0Y2g6IChzZWxlY3Rvciwgb3B0aW9ucywgc3VjY2VzcywgZXJyb3IpIC0+XG4gICAgbW9kZSA9IG9wdGlvbnMubW9kZSB8fCBcImh5YnJpZFwiXG5cbiAgICBpZiBtb2RlID09IFwiaHlicmlkXCJcbiAgICAgICMgR2V0IGxvY2FsIHJlc3VsdHNcbiAgICAgIGxvY2FsU3VjY2VzcyA9IChsb2NhbERhdGEpID0+XG4gICAgICAgICMgUmV0dXJuIGRhdGEgaW1tZWRpYXRlbHlcbiAgICAgICAgc3VjY2Vzcyhsb2NhbERhdGEpXG5cbiAgICAgICAgIyBHZXQgcmVtb3RlIGRhdGFcbiAgICAgICAgcmVtb3RlU3VjY2VzcyA9IChyZW1vdGVEYXRhKSA9PlxuICAgICAgICAgICMgQ2FjaGUgbG9jYWxseVxuICAgICAgICAgIGNhY2hlU3VjY2VzcyA9ICgpID0+XG4gICAgICAgICAgICAjIEdldCBsb2NhbCBkYXRhIGFnYWluXG4gICAgICAgICAgICBsb2NhbFN1Y2Nlc3MyID0gKGxvY2FsRGF0YTIpID0+XG4gICAgICAgICAgICAgICMgQ2hlY2sgaWYgZGlmZmVyZW50XG4gICAgICAgICAgICAgIGlmIG5vdCBfLmlzRXF1YWwobG9jYWxEYXRhLCBsb2NhbERhdGEyKVxuICAgICAgICAgICAgICAgICMgU2VuZCBhZ2FpblxuICAgICAgICAgICAgICAgIHN1Y2Nlc3MobG9jYWxEYXRhMilcbiAgICAgICAgICAgIEBsb2NhbENvbC5maW5kKHNlbGVjdG9yLCBvcHRpb25zKS5mZXRjaChsb2NhbFN1Y2Nlc3MyKVxuICAgICAgICAgIEBsb2NhbENvbC5jYWNoZShyZW1vdGVEYXRhLCBzZWxlY3Rvciwgb3B0aW9ucywgY2FjaGVTdWNjZXNzLCBlcnJvcilcbiAgICAgICAgQHJlbW90ZUNvbC5maW5kKHNlbGVjdG9yLCBfLm9taXQob3B0aW9ucywgXCJmaWVsZHNcIikpLmZldGNoKHJlbW90ZVN1Y2Nlc3MpXG5cbiAgICAgIEBsb2NhbENvbC5maW5kKHNlbGVjdG9yLCBvcHRpb25zKS5mZXRjaChsb2NhbFN1Y2Nlc3MsIGVycm9yKVxuICAgIGVsc2UgaWYgbW9kZSA9PSBcImxvY2FsXCJcbiAgICAgIEBsb2NhbENvbC5maW5kKHNlbGVjdG9yLCBvcHRpb25zKS5mZXRjaChzdWNjZXNzLCBlcnJvcilcbiAgICBlbHNlIGlmIG1vZGUgPT0gXCJyZW1vdGVcIlxuICAgICAgIyBHZXQgcmVtb3RlIHJlc3VsdHNcbiAgICAgIHJlbW90ZVN1Y2Nlc3MgPSAocmVtb3RlRGF0YSkgPT5cbiAgICAgICAgIyBSZW1vdmUgbG9jYWwgcmVtb3Rlc1xuICAgICAgICBkYXRhID0gcmVtb3RlRGF0YVxuXG4gICAgICAgIEBsb2NhbENvbC5wZW5kaW5nUmVtb3ZlcyAocmVtb3ZlcykgPT5cbiAgICAgICAgICBpZiByZW1vdmVzLmxlbmd0aCA+IDBcbiAgICAgICAgICAgIHJlbW92ZXNNYXAgPSBfLm9iamVjdChfLm1hcChyZW1vdmVzLCAoaWQpIC0+IFtpZCwgaWRdKSlcbiAgICAgICAgICAgIGRhdGEgPSBfLmZpbHRlciByZW1vdGVEYXRhLCAoZG9jKSAtPlxuICAgICAgICAgICAgICByZXR1cm4gbm90IF8uaGFzKHJlbW92ZXNNYXAsIGRvYy5faWQpXG5cbiAgICAgICAgICAjIEFkZCB1cHNlcnRzXG4gICAgICAgICAgQGxvY2FsQ29sLnBlbmRpbmdVcHNlcnRzICh1cHNlcnRzKSA9PlxuICAgICAgICAgICAgaWYgdXBzZXJ0cy5sZW5ndGggPiAwXG4gICAgICAgICAgICAgICMgUmVtb3ZlIHVwc2VydHMgZnJvbSBkYXRhXG4gICAgICAgICAgICAgIHVwc2VydHNNYXAgPSBfLm9iamVjdChfLnBsdWNrKHVwc2VydHMsICdfaWQnKSwgXy5wbHVjayh1cHNlcnRzLCAnX2lkJykpXG4gICAgICAgICAgICAgIGRhdGEgPSBfLmZpbHRlciBkYXRhLCAoZG9jKSAtPlxuICAgICAgICAgICAgICAgIHJldHVybiBub3QgXy5oYXModXBzZXJ0c01hcCwgZG9jLl9pZClcblxuICAgICAgICAgICAgICAjIEFkZCB1cHNlcnRzXG4gICAgICAgICAgICAgIGRhdGEgPSBkYXRhLmNvbmNhdCh1cHNlcnRzKVxuXG4gICAgICAgICAgICAgICMgUmVmaWx0ZXIvc29ydC9saW1pdFxuICAgICAgICAgICAgICBkYXRhID0gcHJvY2Vzc0ZpbmQoZGF0YSwgc2VsZWN0b3IsIG9wdGlvbnMpXG5cbiAgICAgICAgICAgIHN1Y2Nlc3MoZGF0YSlcblxuICAgICAgcmVtb3RlRXJyb3IgPSA9PlxuICAgICAgICAjIENhbGwgbG9jYWxcbiAgICAgICAgQGxvY2FsQ29sLmZpbmQoc2VsZWN0b3IsIG9wdGlvbnMpLmZldGNoKHN1Y2Nlc3MsIGVycm9yKVxuXG4gICAgICBAcmVtb3RlQ29sLmZpbmQoc2VsZWN0b3IsIG9wdGlvbnMpLmZldGNoKHJlbW90ZVN1Y2Nlc3MsIHJlbW90ZUVycm9yKVxuICAgIGVsc2VcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlVua25vd24gbW9kZVwiKVxuXG4gIHVwc2VydDogKGRvYywgc3VjY2VzcywgZXJyb3IpIC0+XG4gICAgQGxvY2FsQ29sLnVwc2VydChkb2MsIHN1Y2Nlc3MsIGVycm9yKVxuXG4gIHJlbW92ZTogKGlkLCBzdWNjZXNzLCBlcnJvcikgLT5cbiAgICBAbG9jYWxDb2wucmVtb3ZlKGlkLCBzdWNjZXNzLCBlcnJvcilcblxuICB1cGxvYWQ6IChzdWNjZXNzLCBlcnJvcikgLT5cbiAgICB1cGxvYWRVcHNlcnRzID0gKHVwc2VydHMsIHN1Y2Nlc3MsIGVycm9yKSA9PlxuICAgICAgdXBzZXJ0ID0gXy5maXJzdCh1cHNlcnRzKVxuICAgICAgaWYgdXBzZXJ0XG4gICAgICAgIEByZW1vdGVDb2wudXBzZXJ0KHVwc2VydCwgKCkgPT5cbiAgICAgICAgICBAbG9jYWxDb2wucmVzb2x2ZVVwc2VydCB1cHNlcnQsID0+XG4gICAgICAgICAgICB1cGxvYWRVcHNlcnRzKF8ucmVzdCh1cHNlcnRzKSwgc3VjY2VzcywgZXJyb3IpXG4gICAgICAgICwgKGVycikgPT5cbiAgICAgICAgICBlcnJvcihlcnIpKVxuICAgICAgZWxzZSBcbiAgICAgICAgc3VjY2VzcygpXG4gICAgQGxvY2FsQ29sLnBlbmRpbmdVcHNlcnRzICh1cHNlcnRzKSA9PlxuICAgICAgdXBsb2FkVXBzZXJ0cyh1cHNlcnRzLCBzdWNjZXNzLCBlcnJvcilcbiIsImV4cG9ydHMuU2VjdGlvbnMgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCh7XG4gICAgY2xhc3NOYW1lIDogXCJzdXJ2ZXlcIixcblxuICAgIGluaXRpYWxpemUgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy50aXRsZSA9IHRoaXMub3B0aW9ucy50aXRsZTtcbiAgICAgICAgdGhpcy5zZWN0aW9ucyA9IHRoaXMub3B0aW9ucy5zZWN0aW9ucztcbiAgICAgICAgdGhpcy5yZW5kZXIoKTtcblxuICAgICAgICAvLyBBZGp1c3QgbmV4dC9wcmV2IGJhc2VkIG9uIG1vZGVsXG4gICAgICAgIHRoaXMubW9kZWwub24oXCJjaGFuZ2VcIiwgdGhpcy5yZW5kZXJOZXh0UHJldiwgdGhpcyk7XG5cbiAgICAgICAgLy8gR28gdG8gYXBwcm9wcmlhdGUgc2VjdGlvbiBUT0RPXG4gICAgICAgIHRoaXMuc2hvd1NlY3Rpb24oMCk7XG4gICAgfSxcblxuICAgIGV2ZW50cyA6IHtcbiAgICAgICAgXCJjbGljayAubmV4dFwiIDogXCJuZXh0U2VjdGlvblwiLFxuICAgICAgICBcImNsaWNrIC5wcmV2XCIgOiBcInByZXZTZWN0aW9uXCIsXG4gICAgICAgIFwiY2xpY2sgLmZpbmlzaFwiIDogXCJmaW5pc2hcIixcbiAgICAgICAgXCJjbGljayBhLnNlY3Rpb24tY3J1bWJcIiA6IFwiY3J1bWJTZWN0aW9uXCJcbiAgICB9LFxuXG4gICAgZmluaXNoIDogZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIFZhbGlkYXRlIGN1cnJlbnQgc2VjdGlvblxuICAgICAgICB2YXIgc2VjdGlvbiA9IHRoaXMuc2VjdGlvbnNbdGhpcy5zZWN0aW9uXTtcbiAgICAgICAgaWYgKHNlY3Rpb24udmFsaWRhdGUoKSkge1xuICAgICAgICAgICAgdGhpcy50cmlnZ2VyKCdjb21wbGV0ZScpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGNydW1iU2VjdGlvbiA6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgLy8gR28gdG8gc2VjdGlvblxuICAgICAgICB2YXIgaW5kZXggPSBwYXJzZUludChlLnRhcmdldC5nZXRBdHRyaWJ1dGUoXCJkYXRhLXZhbHVlXCIpKTtcbiAgICAgICAgdGhpcy5zaG93U2VjdGlvbihpbmRleCk7XG4gICAgfSxcblxuICAgIGdldE5leHRTZWN0aW9uSW5kZXggOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGkgPSB0aGlzLnNlY3Rpb24gKyAxO1xuICAgICAgICB3aGlsZSAoaSA8IHRoaXMuc2VjdGlvbnMubGVuZ3RoKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5zZWN0aW9uc1tpXS5zaG91bGRCZVZpc2libGUoKSlcbiAgICAgICAgICAgICAgICByZXR1cm4gaTtcbiAgICAgICAgICAgIGkrKztcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBnZXRQcmV2U2VjdGlvbkluZGV4IDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBpID0gdGhpcy5zZWN0aW9uIC0gMTtcbiAgICAgICAgd2hpbGUgKGkgPj0gMCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuc2VjdGlvbnNbaV0uc2hvdWxkQmVWaXNpYmxlKCkpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGk7XG4gICAgICAgICAgICBpLS07XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgbmV4dFNlY3Rpb24gOiBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gVmFsaWRhdGUgY3VycmVudCBzZWN0aW9uXG4gICAgICAgIHZhciBzZWN0aW9uID0gdGhpcy5zZWN0aW9uc1t0aGlzLnNlY3Rpb25dO1xuICAgICAgICBpZiAoc2VjdGlvbi52YWxpZGF0ZSgpKSB7XG4gICAgICAgICAgICB0aGlzLnNob3dTZWN0aW9uKHRoaXMuZ2V0TmV4dFNlY3Rpb25JbmRleCgpKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBwcmV2U2VjdGlvbiA6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnNob3dTZWN0aW9uKHRoaXMuZ2V0UHJldlNlY3Rpb25JbmRleCgpKTtcbiAgICB9LFxuXG4gICAgc2hvd1NlY3Rpb24gOiBmdW5jdGlvbihpbmRleCkge1xuICAgICAgICB0aGlzLnNlY3Rpb24gPSBpbmRleDtcblxuICAgICAgICBfLmVhY2godGhpcy5zZWN0aW9ucywgZnVuY3Rpb24ocykge1xuICAgICAgICAgICAgcy4kZWwuaGlkZSgpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5zZWN0aW9uc1tpbmRleF0uJGVsLnNob3coKTtcblxuICAgICAgICAvLyBTZXR1cCBicmVhZGNydW1ic1xuICAgICAgICB2YXIgdmlzaWJsZVNlY3Rpb25zID0gXy5maWx0ZXIoXy5maXJzdCh0aGlzLnNlY3Rpb25zLCBpbmRleCArIDEpLCBmdW5jdGlvbihzKSB7XG4gICAgICAgICAgICByZXR1cm4gcy5zaG91bGRCZVZpc2libGUoKVxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy4kKFwiLmJyZWFkY3J1bWJcIikuaHRtbCh0ZW1wbGF0ZXNbJ2Zvcm1zL1NlY3Rpb25zX2JyZWFkY3J1bWJzJ10oe1xuICAgICAgICAgICAgc2VjdGlvbnMgOiBfLmluaXRpYWwodmlzaWJsZVNlY3Rpb25zKSxcbiAgICAgICAgICAgIGxhc3RTZWN0aW9uOiBfLmxhc3QodmlzaWJsZVNlY3Rpb25zKVxuICAgICAgICB9KSk7XG4gICAgICAgIFxuICAgICAgICB0aGlzLnJlbmRlck5leHRQcmV2KCk7XG5cbiAgICAgICAgLy8gU2Nyb2xsIGludG8gdmlld1xuICAgICAgICB0aGlzLiRlbC5zY3JvbGxpbnRvdmlldygpO1xuICAgIH0sXG4gICAgXG4gICAgcmVuZGVyTmV4dFByZXYgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gU2V0dXAgbmV4dC9wcmV2IGJ1dHRvbnNcbiAgICAgICAgdGhpcy4kKFwiLnByZXZcIikudG9nZ2xlKHRoaXMuZ2V0UHJldlNlY3Rpb25JbmRleCgpICE9PSB1bmRlZmluZWQpO1xuICAgICAgICB0aGlzLiQoXCIubmV4dFwiKS50b2dnbGUodGhpcy5nZXROZXh0U2VjdGlvbkluZGV4KCkgIT09IHVuZGVmaW5lZCk7XG4gICAgICAgIHRoaXMuJChcIi5maW5pc2hcIikudG9nZ2xlKHRoaXMuZ2V0TmV4dFNlY3Rpb25JbmRleCgpID09PSB1bmRlZmluZWQpO1xuICAgIH0sXG5cbiAgICByZW5kZXIgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy4kZWwuaHRtbCh0ZW1wbGF0ZXNbJ2Zvcm1zL1NlY3Rpb25zJ10oKSk7XG5cbiAgICAgICAgLy8gQWRkIHNlY3Rpb25zXG4gICAgICAgIHZhciBzZWN0aW9uc0VsID0gdGhpcy4kKFwiLnNlY3Rpb25zXCIpO1xuICAgICAgICBfLmVhY2godGhpcy5zZWN0aW9ucywgZnVuY3Rpb24ocykge1xuICAgICAgICAgICAgc2VjdGlvbnNFbC5hcHBlbmQocy4kZWwpO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbn0pO1xuXG5leHBvcnRzLlNlY3Rpb24gPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCh7XG4gICAgY2xhc3NOYW1lIDogXCJzZWN0aW9uXCIsXG4gICAgdGVtcGxhdGUgOiBfLnRlbXBsYXRlKCc8ZGl2IGNsYXNzPVwiY29udGVudHNcIj48L2Rpdj4nKSxcblxuICAgIGluaXRpYWxpemUgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy50aXRsZSA9IHRoaXMub3B0aW9ucy50aXRsZTtcbiAgICAgICAgdGhpcy5jb250ZW50cyA9IHRoaXMub3B0aW9ucy5jb250ZW50cztcblxuICAgICAgICAvLyBBbHdheXMgaW52aXNpYmxlIGluaXRpYWxseVxuICAgICAgICB0aGlzLiRlbC5oaWRlKCk7XG4gICAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgfSxcblxuICAgIHNob3VsZEJlVmlzaWJsZSA6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoIXRoaXMub3B0aW9ucy5jb25kaXRpb25hbClcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25zLmNvbmRpdGlvbmFsKHRoaXMubW9kZWwpO1xuICAgIH0sXG5cbiAgICB2YWxpZGF0ZSA6IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBHZXQgYWxsIHZpc2libGUgaXRlbXNcbiAgICAgICAgdmFyIGl0ZW1zID0gXy5maWx0ZXIodGhpcy5jb250ZW50cywgZnVuY3Rpb24oYykge1xuICAgICAgICAgICAgcmV0dXJuIGMudmlzaWJsZSAmJiBjLnZhbGlkYXRlO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuICFfLmFueShfLm1hcChpdGVtcywgZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICAgICAgcmV0dXJuIGl0ZW0udmFsaWRhdGUoKTtcbiAgICAgICAgfSkpO1xuICAgIH0sXG5cbiAgICByZW5kZXIgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy4kZWwuaHRtbCh0aGlzLnRlbXBsYXRlKHRoaXMpKTtcblxuICAgICAgICAvLyBBZGQgY29udGVudHMgKHF1ZXN0aW9ucywgbW9zdGx5KVxuICAgICAgICB2YXIgY29udGVudHNFbCA9IHRoaXMuJChcIi5jb250ZW50c1wiKTtcbiAgICAgICAgXy5lYWNoKHRoaXMuY29udGVudHMsIGZ1bmN0aW9uKGMpIHtcbiAgICAgICAgICAgIGNvbnRlbnRzRWwuYXBwZW5kKGMuJGVsKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG59KTtcblxuZXhwb3J0cy5RdWVzdGlvbiA9IEJhY2tib25lLlZpZXcuZXh0ZW5kKHtcbiAgICBjbGFzc05hbWUgOiBcInF1ZXN0aW9uXCIsXG5cbiAgICB0ZW1wbGF0ZSA6IF8udGVtcGxhdGUoJzwlIGlmIChvcHRpb25zLnByb21wdCkgeyAlPjxkaXYgY2xhc3M9XCJwcm9tcHRcIj48JT1vcHRpb25zLnByb21wdCU+PCU9cmVuZGVyUmVxdWlyZWQoKSU+PC9kaXY+PCUgfSAlPjxkaXYgY2xhc3M9XCJhbnN3ZXJcIj48L2Rpdj48JT1yZW5kZXJIaW50KCklPicpLFxuXG4gICAgcmVuZGVyUmVxdWlyZWQgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMucmVxdWlyZWQpXG4gICAgICAgICAgICByZXR1cm4gJyZuYnNwOzxzcGFuIGNsYXNzPVwicmVxdWlyZWRcIj4qPC9zcGFuPic7XG4gICAgICAgIHJldHVybiAnJztcbiAgICB9LFxuXG4gICAgcmVuZGVySGludDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuaGludClcbiAgICAgICAgICAgIHJldHVybiBfLnRlbXBsYXRlKCc8ZGl2IGNsYXNzPVwibXV0ZWRcIj48JT1oaW50JT48L2Rpdj4nKSh7aGludDogdGhpcy5vcHRpb25zLmhpbnR9KTtcbiAgICB9LFxuXG4gICAgdmFsaWRhdGUgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHZhbDtcblxuICAgICAgICAvLyBDaGVjayByZXF1aXJlZFxuICAgICAgICBpZiAodGhpcy5yZXF1aXJlZCkge1xuICAgICAgICAgICAgaWYgKHRoaXMubW9kZWwuZ2V0KHRoaXMuaWQpID09PSB1bmRlZmluZWQgfHwgdGhpcy5tb2RlbC5nZXQodGhpcy5pZCkgPT09IG51bGwgfHwgdGhpcy5tb2RlbC5nZXQodGhpcy5pZCkgPT09IFwiXCIpXG4gICAgICAgICAgICAgICAgdmFsID0gXCJSZXF1aXJlZFwiO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2hlY2sgaW50ZXJuYWwgdmFsaWRhdGlvblxuICAgICAgICBpZiAoIXZhbCAmJiB0aGlzLnZhbGlkYXRlSW50ZXJuYWwpIHtcbiAgICAgICAgICAgIHZhbCA9IHRoaXMudmFsaWRhdGVJbnRlcm5hbCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2hlY2sgY3VzdG9tIHZhbGlkYXRpb25cbiAgICAgICAgaWYgKCF2YWwgJiYgdGhpcy5vcHRpb25zLnZhbGlkYXRlKSB7XG4gICAgICAgICAgICB2YWwgPSB0aGlzLm9wdGlvbnMudmFsaWRhdGUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFNob3cgdmFsaWRhdGlvbiByZXN1bHRzIFRPRE9cbiAgICAgICAgaWYgKHZhbCkge1xuICAgICAgICAgICAgdGhpcy4kZWwuYWRkQ2xhc3MoXCJpbnZhbGlkXCIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy4kZWwucmVtb3ZlQ2xhc3MoXCJpbnZhbGlkXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHZhbDtcbiAgICB9LFxuXG4gICAgdXBkYXRlVmlzaWJpbGl0eSA6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgLy8gc2xpZGVVcC9zbGlkZURvd25cbiAgICAgICAgaWYgKHRoaXMuc2hvdWxkQmVWaXNpYmxlKCkgJiYgIXRoaXMudmlzaWJsZSlcbiAgICAgICAgICAgIHRoaXMuJGVsLnNsaWRlRG93bigpO1xuICAgICAgICBpZiAoIXRoaXMuc2hvdWxkQmVWaXNpYmxlKCkgJiYgdGhpcy52aXNpYmxlKVxuICAgICAgICAgICAgdGhpcy4kZWwuc2xpZGVVcCgpO1xuICAgICAgICB0aGlzLnZpc2libGUgPSB0aGlzLnNob3VsZEJlVmlzaWJsZSgpO1xuICAgIH0sXG5cbiAgICBzaG91bGRCZVZpc2libGUgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKCF0aGlzLm9wdGlvbnMuY29uZGl0aW9uYWwpXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy5jb25kaXRpb25hbCh0aGlzLm1vZGVsKTtcbiAgICB9LFxuXG4gICAgaW5pdGlhbGl6ZSA6IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBBZGp1c3QgdmlzaWJpbGl0eSBiYXNlZCBvbiBtb2RlbFxuICAgICAgICB0aGlzLm1vZGVsLm9uKFwiY2hhbmdlXCIsIHRoaXMudXBkYXRlVmlzaWJpbGl0eSwgdGhpcyk7XG5cbiAgICAgICAgLy8gUmUtcmVuZGVyIGJhc2VkIG9uIG1vZGVsIGNoYW5nZXNcbiAgICAgICAgdGhpcy5tb2RlbC5vbihcImNoYW5nZTpcIiArIHRoaXMuaWQsIHRoaXMucmVuZGVyLCB0aGlzKTtcblxuICAgICAgICB0aGlzLnJlcXVpcmVkID0gdGhpcy5vcHRpb25zLnJlcXVpcmVkO1xuXG4gICAgICAgIC8vIFNhdmUgY29udGV4dFxuICAgICAgICB0aGlzLmN0eCA9IHRoaXMub3B0aW9ucy5jdHggfHwge307XG5cbiAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICB9LFxuXG4gICAgcmVuZGVyIDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuJGVsLmh0bWwodGhpcy50ZW1wbGF0ZSh0aGlzKSk7XG5cbiAgICAgICAgLy8gUmVuZGVyIGFuc3dlclxuICAgICAgICB0aGlzLnJlbmRlckFuc3dlcih0aGlzLiQoXCIuYW5zd2VyXCIpKTtcblxuICAgICAgICB0aGlzLiRlbC50b2dnbGUodGhpcy5zaG91bGRCZVZpc2libGUoKSk7XG4gICAgICAgIHRoaXMudmlzaWJsZSA9IHRoaXMuc2hvdWxkQmVWaXNpYmxlKCk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxufSk7XG5cbmV4cG9ydHMuUmFkaW9RdWVzdGlvbiA9IGV4cG9ydHMuUXVlc3Rpb24uZXh0ZW5kKHtcbiAgICBldmVudHMgOiB7XG4gICAgICAgIFwiY2hlY2tlZFwiIDogXCJjaGVja2VkXCIsXG4gICAgfSxcblxuICAgIGNoZWNrZWQgOiBmdW5jdGlvbihlKSB7XG4gICAgICAgIHZhciBpbmRleCA9IHBhcnNlSW50KGUudGFyZ2V0LmdldEF0dHJpYnV0ZShcImRhdGEtdmFsdWVcIikpO1xuICAgICAgICB2YXIgdmFsdWUgPSB0aGlzLm9wdGlvbnMub3B0aW9uc1tpbmRleF1bMF07XG4gICAgICAgIHRoaXMubW9kZWwuc2V0KHRoaXMuaWQsIHZhbHVlKTtcbiAgICB9LFxuXG4gICAgcmVuZGVyQW5zd2VyIDogZnVuY3Rpb24oYW5zd2VyRWwpIHtcbiAgICAgICAgYW5zd2VyRWwuaHRtbChfLnRlbXBsYXRlKCc8ZGl2IGNsYXNzPVwicmFkaW8tZ3JvdXBcIj48JT1yZW5kZXJSYWRpb09wdGlvbnMoKSU+PC9kaXY+JywgdGhpcykpO1xuICAgIH0sXG5cbiAgICByZW5kZXJSYWRpb09wdGlvbnMgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaHRtbCA9IFwiXCI7XG4gICAgICAgIHZhciBpO1xuICAgICAgICBmb3IgKCBpID0gMDsgaSA8IHRoaXMub3B0aW9ucy5vcHRpb25zLmxlbmd0aDsgaSsrKVxuICAgICAgICAgICAgaHRtbCArPSBfLnRlbXBsYXRlKCc8ZGl2IGNsYXNzPVwicmFkaW8tYnV0dG9uIDwlPWNoZWNrZWQlPlwiIGRhdGEtdmFsdWU9XCI8JT1wb3NpdGlvbiU+XCI+PCU9dGV4dCU+PC9kaXY+Jywge1xuICAgICAgICAgICAgICAgIHBvc2l0aW9uIDogaSxcbiAgICAgICAgICAgICAgICB0ZXh0IDogdGhpcy5vcHRpb25zLm9wdGlvbnNbaV1bMV0sXG4gICAgICAgICAgICAgICAgY2hlY2tlZCA6IHRoaXMubW9kZWwuZ2V0KHRoaXMuaWQpID09PSB0aGlzLm9wdGlvbnMub3B0aW9uc1tpXVswXSA/IFwiY2hlY2tlZFwiIDogXCJcIlxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIGh0bWw7XG4gICAgfVxuXG59KTtcblxuZXhwb3J0cy5DaGVja1F1ZXN0aW9uID0gZXhwb3J0cy5RdWVzdGlvbi5leHRlbmQoe1xuICAgIGV2ZW50cyA6IHtcbiAgICAgICAgXCJjaGVja2VkXCIgOiBcImNoZWNrZWRcIixcbiAgICB9LFxuXG4gICAgY2hlY2tlZCA6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgLy8gR2V0IGNoZWNrZWRcbiAgICAgICAgdGhpcy5tb2RlbC5zZXQodGhpcy5pZCwgdGhpcy4kKFwiLmNoZWNrYm94XCIpLmhhc0NsYXNzKFwiY2hlY2tlZFwiKSk7XG4gICAgfSxcblxuICAgIHJlbmRlckFuc3dlciA6IGZ1bmN0aW9uKGFuc3dlckVsKSB7XG4gICAgICAgIHZhciBpO1xuICAgICAgICBhbnN3ZXJFbC5hcHBlbmQoJChfLnRlbXBsYXRlKCc8ZGl2IGNsYXNzPVwiY2hlY2tib3ggPCU9Y2hlY2tlZCU+XCI+PCU9dGV4dCU+PC9kaXY+Jywge1xuICAgICAgICAgICAgdGV4dCA6IHRoaXMub3B0aW9ucy50ZXh0LFxuICAgICAgICAgICAgY2hlY2tlZCA6ICh0aGlzLm1vZGVsLmdldCh0aGlzLmlkKSkgPyBcImNoZWNrZWRcIiA6IFwiXCJcbiAgICAgICAgfSkpKTtcbiAgICB9XG5cbn0pO1xuXG5cbmV4cG9ydHMuTXVsdGljaGVja1F1ZXN0aW9uID0gZXhwb3J0cy5RdWVzdGlvbi5leHRlbmQoe1xuICAgIGV2ZW50cyA6IHtcbiAgICAgICAgXCJjaGVja2VkXCIgOiBcImNoZWNrZWRcIixcbiAgICB9LFxuXG4gICAgY2hlY2tlZCA6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgLy8gR2V0IGFsbCBjaGVja2VkXG4gICAgICAgIHZhciB2YWx1ZSA9IFtdO1xuICAgICAgICB2YXIgb3B0cyA9IHRoaXMub3B0aW9ucy5vcHRpb25zO1xuICAgICAgICB0aGlzLiQoXCIuY2hlY2tib3hcIikuZWFjaChmdW5jdGlvbihpbmRleCkge1xuICAgICAgICAgICAgaWYgKCQodGhpcykuaGFzQ2xhc3MoXCJjaGVja2VkXCIpKVxuICAgICAgICAgICAgICAgIHZhbHVlLnB1c2gob3B0c1tpbmRleF1bMF0pO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5tb2RlbC5zZXQodGhpcy5pZCwgdmFsdWUpO1xuICAgIH0sXG5cbiAgICByZW5kZXJBbnN3ZXIgOiBmdW5jdGlvbihhbnN3ZXJFbCkge1xuICAgICAgICB2YXIgaTtcbiAgICAgICAgZm9yICggaSA9IDA7IGkgPCB0aGlzLm9wdGlvbnMub3B0aW9ucy5sZW5ndGg7IGkrKylcbiAgICAgICAgICAgIGFuc3dlckVsLmFwcGVuZCgkKF8udGVtcGxhdGUoJzxkaXYgY2xhc3M9XCJjaGVja2JveCA8JT1jaGVja2VkJT5cIiBkYXRhLXZhbHVlPVwiPCU9cG9zaXRpb24lPlwiPjwlPXRleHQlPjwvZGl2PicsIHtcbiAgICAgICAgICAgICAgICBwb3NpdGlvbiA6IGksXG4gICAgICAgICAgICAgICAgdGV4dCA6IHRoaXMub3B0aW9ucy5vcHRpb25zW2ldWzFdLFxuICAgICAgICAgICAgICAgIGNoZWNrZWQgOiAodGhpcy5tb2RlbC5nZXQodGhpcy5pZCkgJiYgXy5jb250YWlucyh0aGlzLm1vZGVsLmdldCh0aGlzLmlkKSwgdGhpcy5vcHRpb25zLm9wdGlvbnNbaV1bMF0pKSA/IFwiY2hlY2tlZFwiIDogXCJcIlxuICAgICAgICAgICAgfSkpKTtcbiAgICB9XG5cbn0pO1xuXG5leHBvcnRzLlRleHRRdWVzdGlvbiA9IGV4cG9ydHMuUXVlc3Rpb24uZXh0ZW5kKHtcbiAgICByZW5kZXJBbnN3ZXIgOiBmdW5jdGlvbihhbnN3ZXJFbCkge1xuICAgICAgICBpZiAodGhpcy5vcHRpb25zLm11bHRpbGluZSkge1xuICAgICAgICAgICAgYW5zd2VyRWwuaHRtbChfLnRlbXBsYXRlKCc8dGV4dGFyZWEgc3R5bGU9XCJ3aWR0aDo5MCVcIi8+JywgdGhpcykpOyAvLyBUT0RPIG1ha2Ugd2lkdGggcHJvcGVybHlcbiAgICAgICAgICAgIGFuc3dlckVsLmZpbmQoXCJ0ZXh0YXJlYVwiKS52YWwodGhpcy5tb2RlbC5nZXQodGhpcy5pZCkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYW5zd2VyRWwuaHRtbChfLnRlbXBsYXRlKCc8aW5wdXQgdHlwZT1cInRleHRcIi8+JywgdGhpcykpO1xuICAgICAgICAgICAgYW5zd2VyRWwuZmluZChcImlucHV0XCIpLnZhbCh0aGlzLm1vZGVsLmdldCh0aGlzLmlkKSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgZXZlbnRzIDoge1xuICAgICAgICBcImNoYW5nZVwiIDogXCJjaGFuZ2VkXCJcbiAgICB9LFxuICAgIGNoYW5nZWQgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5tb2RlbC5zZXQodGhpcy5pZCwgdGhpcy4kKHRoaXMub3B0aW9ucy5tdWx0aWxpbmUgPyBcInRleHRhcmVhXCIgOiBcImlucHV0XCIpLnZhbCgpKTtcbiAgICB9XG5cbn0pO1xuIiwiIyBGb3JtIHRoYXQgaGFzIHNhdmUgYW5kIGNhbmNlbCBidXR0b25zIHRoYXQgZmlyZSBzYXZlIGFuZCBjYW5jZWwgZXZlbnRzLlxuIyBTYXZlIGV2ZW50IHdpbGwgb25seSBiZSBmaXJlZCBpZiB2YWxpZGF0ZXNcblxubW9kdWxlLmV4cG9ydHMgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZFxuICBpbml0aWFsaXplOiAtPlxuICAgIEBjb250ZW50cyA9IEBvcHRpb25zLmNvbnRlbnRzXG4gICAgQHJlbmRlcigpXG5cbiAgZXZlbnRzOiBcbiAgICAnY2xpY2sgI3NhdmVfYnV0dG9uJzogJ3NhdmUnXG4gICAgJ2NsaWNrICNjYW5jZWxfYnV0dG9uJzogJ2NhbmNlbCdcblxuICB2YWxpZGF0ZTogLT5cbiAgICAjIEdldCBhbGwgdmlzaWJsZSBpdGVtc1xuICAgIGl0ZW1zID0gXy5maWx0ZXIoQGNvbnRlbnRzLCAoYykgLT5cbiAgICAgIGMudmlzaWJsZSBhbmQgYy52YWxpZGF0ZVxuICAgIClcbiAgICByZXR1cm4gbm90IF8uYW55KF8ubWFwKGl0ZW1zLCAoaXRlbSkgLT5cbiAgICAgIGl0ZW0udmFsaWRhdGUoKVxuICAgICkpXG5cbiAgcmVuZGVyOiAtPlxuICAgIEAkZWwuaHRtbCAnJyc8ZGl2IGlkPVwiY29udGVudHNcIj48L2Rpdj5cbiAgICA8ZGl2PlxuICAgICAgICA8YnV0dG9uIGlkPVwic2F2ZV9idXR0b25cIiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJidG4gYnRuLXByaW1hcnkgbWFyZ2luZWRcIj5TYXZlPC9idXR0b24+XG4gICAgICAgICZuYnNwO1xuICAgICAgICA8YnV0dG9uIGlkPVwiY2FuY2VsX2J1dHRvblwiIHR5cGU9XCJidXR0b25cIiBjbGFzcz1cImJ0biBtYXJnaW5lZFwiPkNhbmNlbDwvYnV0dG9uPlxuICAgIDwvZGl2PicnJ1xuICAgIFxuICAgICMgQWRkIGNvbnRlbnRzIChxdWVzdGlvbnMsIG1vc3RseSlcbiAgICBfLmVhY2ggQGNvbnRlbnRzLCAoYykgPT4gQCQoJyNjb250ZW50cycpLmFwcGVuZCBjLiRlbFxuICAgIHRoaXNcblxuICBzYXZlOiAtPlxuICAgIGlmIEB2YWxpZGF0ZSgpXG4gICAgICBAdHJpZ2dlciAnc2F2ZSdcblxuICBjYW5jZWw6IC0+XG4gICAgQHRyaWdnZXIgJ2NhbmNlbCdcbiIsIiMgR3JvdXAgb2YgcXVlc3Rpb25zIHdoaWNoIHZhbGlkYXRlIGFzIGEgdW5pdFxuXG5tb2R1bGUuZXhwb3J0cyA9IEJhY2tib25lLlZpZXcuZXh0ZW5kXG4gIGluaXRpYWxpemU6IC0+XG4gICAgQGNvbnRlbnRzID0gQG9wdGlvbnMuY29udGVudHNcbiAgICBAcmVuZGVyKClcblxuICB2YWxpZGF0ZTogLT5cbiAgICAjIEdldCBhbGwgdmlzaWJsZSBpdGVtc1xuICAgIGl0ZW1zID0gXy5maWx0ZXIoQGNvbnRlbnRzLCAoYykgLT5cbiAgICAgIGMudmlzaWJsZSBhbmQgYy52YWxpZGF0ZVxuICAgIClcbiAgICByZXR1cm4gbm90IF8uYW55KF8ubWFwKGl0ZW1zLCAoaXRlbSkgLT5cbiAgICAgIGl0ZW0udmFsaWRhdGUoKVxuICAgICkpXG5cbiAgcmVuZGVyOiAtPlxuICAgIEAkZWwuaHRtbCBcIlwiXG4gICAgXG4gICAgIyBBZGQgY29udGVudHMgKHF1ZXN0aW9ucywgbW9zdGx5KVxuICAgIF8uZWFjaCBAY29udGVudHMsIChjKSA9PiBAJGVsLmFwcGVuZCBjLiRlbFxuXG4gICAgdGhpc1xuIiwibW9kdWxlLmV4cG9ydHMgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZFxuICBpbml0aWFsaXplOiAtPlxuICAgIEAkZWwuaHRtbCBfLnRlbXBsYXRlKCcnJ1xuICAgICAgPGRpdiBjbGFzcz1cIndlbGwgd2VsbC1zbWFsbFwiPjwlPWh0bWwlPjwlLXRleHQlPjwvZGl2PlxuICAgICAgJycnKShodG1sOiBAb3B0aW9ucy5odG1sLCB0ZXh0OiBAb3B0aW9ucy50ZXh0KVxuIiwiIyBUT0RPIEZpeCB0byBoYXZlIGVkaXRhYmxlIFlZWVktTU0tREQgd2l0aCBjbGljayB0byBwb3B1cCBzY3JvbGxlclxuXG5RdWVzdGlvbiA9IHJlcXVpcmUoJy4vZm9ybS1jb250cm9scycpLlF1ZXN0aW9uXG5cbm1vZHVsZS5leHBvcnRzID0gUXVlc3Rpb24uZXh0ZW5kKFxuICBldmVudHM6XG4gICAgY2hhbmdlOiBcImNoYW5nZWRcIlxuXG4gIGNoYW5nZWQ6IC0+XG4gICAgQG1vZGVsLnNldCBAaWQsIEAkZWwuZmluZChcImlucHV0W25hbWU9XFxcImRhdGVcXFwiXVwiKS52YWwoKVxuXG4gIHJlbmRlckFuc3dlcjogKGFuc3dlckVsKSAtPlxuICAgIGFuc3dlckVsLmh0bWwgXy50ZW1wbGF0ZShcIjxpbnB1dCBjbGFzcz1cXFwibmVlZHNjbGlja1xcXCIgbmFtZT1cXFwiZGF0ZVxcXCIgLz5cIiwgdGhpcylcbiAgICBhbnN3ZXJFbC5maW5kKFwiaW5wdXRcIikudmFsIEBtb2RlbC5nZXQoQGlkKVxuICAgIGFuc3dlckVsLmZpbmQoXCJpbnB1dFwiKS5zY3JvbGxlclxuICAgICAgcHJlc2V0OiBcImRhdGVcIlxuICAgICAgdGhlbWU6IFwiaW9zXCJcbiAgICAgIGRpc3BsYXk6IFwibW9kYWxcIlxuICAgICAgbW9kZTogXCJzY3JvbGxlclwiXG4gICAgICBkYXRlT3JkZXI6IFwieXltbUQgZGRcIlxuICAgICAgZGF0ZUZvcm1hdDogXCJ5eS1tbS1kZFwiXG5cbikiLCJRdWVzdGlvbiA9IHJlcXVpcmUoJy4vZm9ybS1jb250cm9scycpLlF1ZXN0aW9uXG5cbm1vZHVsZS5leHBvcnRzID0gUXVlc3Rpb24uZXh0ZW5kXG4gIHJlbmRlckFuc3dlcjogKGFuc3dlckVsKSAtPlxuICAgIGFuc3dlckVsLmh0bWwgXy50ZW1wbGF0ZShcIjxpbnB1dCB0eXBlPVxcXCJudW1iZXJcXFwiIDwlIGlmIChvcHRpb25zLmRlY2ltYWwpIHslPnN0ZXA9XFxcImFueVxcXCI8JX0lPiAvPlwiLCB0aGlzKVxuICAgIGFuc3dlckVsLmZpbmQoXCJpbnB1dFwiKS52YWwgQG1vZGVsLmdldChAaWQpXG5cbiAgZXZlbnRzOlxuICAgIGNoYW5nZTogXCJjaGFuZ2VkXCJcblxuICB2YWxpZGF0ZUludGVybmFsOiAtPlxuICAgIHZhbCA9IEAkKFwiaW5wdXRcIikudmFsKClcbiAgICBpZiBAb3B0aW9ucy5kZWNpbWFsIGFuZCB2YWwubGVuZ3RoID4gMFxuICAgICAgaWYgcGFyc2VGbG9hdCh2YWwpID09IE5hTlxuICAgICAgICByZXR1cm4gXCJJbnZhbGlkIGRlY2ltYWwgbnVtYmVyXCJcbiAgICBlbHNlIGlmIHZhbC5sZW5ndGggPiAwXG4gICAgICBpZiBub3QgdmFsLm1hdGNoKC9eLT9cXGQrJC8pXG4gICAgICAgIHJldHVybiBcIkludmFsaWQgaW50ZWdlciBudW1iZXJcIlxuICAgIHJldHVybiBudWxsXG5cbiAgY2hhbmdlZDogLT5cbiAgICB2YWwgPSBwYXJzZUZsb2F0KEAkKFwiaW5wdXRcIikudmFsKCkpXG4gICAgaWYgdmFsID09IE5hTlxuICAgICAgdmFsID0gbnVsbFxuICAgIEBtb2RlbC5zZXQgQGlkLCB2YWwgXG4iLCJRdWVzdGlvbiA9IHJlcXVpcmUoJy4vZm9ybS1jb250cm9scycpLlF1ZXN0aW9uXG5cbm1vZHVsZS5leHBvcnRzID0gUXVlc3Rpb24uZXh0ZW5kKFxuICBldmVudHM6XG4gICAgY2hhbmdlOiBcImNoYW5nZWRcIlxuXG4gIHNldE9wdGlvbnM6IChvcHRpb25zKSAtPlxuICAgIEBvcHRpb25zLm9wdGlvbnMgPSBvcHRpb25zXG4gICAgQHJlbmRlcigpXG5cbiAgY2hhbmdlZDogKGUpIC0+XG4gICAgdmFsID0gJChlLnRhcmdldCkudmFsKClcbiAgICBpZiB2YWwgaXMgXCJcIlxuICAgICAgQG1vZGVsLnNldCBAaWQsIG51bGxcbiAgICBlbHNlXG4gICAgICBpbmRleCA9IHBhcnNlSW50KHZhbClcbiAgICAgIHZhbHVlID0gQG9wdGlvbnMub3B0aW9uc1tpbmRleF1bMF1cbiAgICAgIEBtb2RlbC5zZXQgQGlkLCB2YWx1ZVxuXG4gIHJlbmRlckFuc3dlcjogKGFuc3dlckVsKSAtPlxuICAgIGFuc3dlckVsLmh0bWwgXy50ZW1wbGF0ZShcIjxzZWxlY3QgaWQ9XFxcInNvdXJjZV90eXBlXFxcIj48JT1yZW5kZXJEcm9wZG93bk9wdGlvbnMoKSU+PC9zZWxlY3Q+XCIsIHRoaXMpXG4gICAgIyBDaGVjayBpZiBhbnN3ZXIgcHJlc2VudCBcbiAgICBpZiBub3QgXy5hbnkoQG9wdGlvbnMub3B0aW9ucywgKG9wdCkgPT4gb3B0WzBdID09IEBtb2RlbC5nZXQoQGlkKSkgYW5kIEBtb2RlbC5nZXQoQGlkKT9cbiAgICAgIEAkKFwic2VsZWN0XCIpLmF0dHIoJ2Rpc2FibGVkJywgJ2Rpc2FibGVkJylcblxuICByZW5kZXJEcm9wZG93bk9wdGlvbnM6IC0+XG4gICAgaHRtbCA9IFwiXCJcbiAgICBcbiAgICAjIEFkZCBlbXB0eSBvcHRpb25cbiAgICBodG1sICs9IFwiPG9wdGlvbiB2YWx1ZT1cXFwiXFxcIj48L29wdGlvbj5cIlxuICAgIGZvciBpIGluIFswLi4uQG9wdGlvbnMub3B0aW9ucy5sZW5ndGhdXG4gICAgICBodG1sICs9IF8udGVtcGxhdGUoXCI8b3B0aW9uIHZhbHVlPVxcXCI8JT1wb3NpdGlvbiU+XFxcIiA8JT1zZWxlY3RlZCU+PjwlLXRleHQlPjwvb3B0aW9uPlwiLFxuICAgICAgICBwb3NpdGlvbjogaVxuICAgICAgICB0ZXh0OiBAb3B0aW9ucy5vcHRpb25zW2ldWzFdXG4gICAgICAgIHNlbGVjdGVkOiAoaWYgQG1vZGVsLmdldChAaWQpIGlzIEBvcHRpb25zLm9wdGlvbnNbaV1bMF0gdGhlbiBcInNlbGVjdGVkPVxcXCJzZWxlY3RlZFxcXCJcIiBlbHNlIFwiXCIpXG4gICAgICApXG4gICAgcmV0dXJuIGh0bWxcbikiLCJRdWVzdGlvbiA9IHJlcXVpcmUoJy4vZm9ybS1jb250cm9scycpLlF1ZXN0aW9uXG5Tb3VyY2VMaXN0UGFnZSA9IHJlcXVpcmUgJy4uL3BhZ2VzL1NvdXJjZUxpc3RQYWdlJ1xuc291cmNlY29kZXMgPSByZXF1aXJlICcuLi9zb3VyY2Vjb2RlcydcblxubW9kdWxlLmV4cG9ydHMgPSBRdWVzdGlvbi5leHRlbmRcbiAgcmVuZGVyQW5zd2VyOiAoYW5zd2VyRWwpIC0+XG4gICAgYW5zd2VyRWwuaHRtbCAnJydcbiAgICAgIDxkaXYgY2xhc3M9XCJpbnB1dC1hcHBlbmRcIj5cbiAgICAgICAgPGlucHV0IHR5cGU9XCJ0ZWxcIj5cbiAgICAgICAgPGJ1dHRvbiBjbGFzcz1cImJ0blwiIGlkPVwic2VsZWN0XCIgdHlwZT1cImJ1dHRvblwiPlNlbGVjdDwvYnV0dG9uPlxuICAgICAgPC9kaXY+JycnXG4gICAgYW5zd2VyRWwuZmluZChcImlucHV0XCIpLnZhbCBAbW9kZWwuZ2V0KEBpZClcblxuICBldmVudHM6XG4gICAgJ2NoYW5nZScgOiAnY2hhbmdlZCdcbiAgICAnY2xpY2sgI3NlbGVjdCcgOiAnc2VsZWN0U291cmNlJ1xuXG4gIGNoYW5nZWQ6IC0+XG4gICAgQG1vZGVsLnNldCBAaWQsIEAkKFwiaW5wdXRcIikudmFsKClcblxuICBzZWxlY3RTb3VyY2U6IC0+XG4gICAgQGN0eC5wYWdlci5vcGVuUGFnZSBTb3VyY2VMaXN0UGFnZSwgXG4gICAgICB7IG9uU2VsZWN0OiAoc291cmNlKT0+XG4gICAgICAgIEBtb2RlbC5zZXQgQGlkLCBzb3VyY2UuY29kZVxuICAgICAgfVxuXG4gIHZhbGlkYXRlSW50ZXJuYWw6IC0+XG4gICAgaWYgbm90IEAkKFwiaW5wdXRcIikudmFsKClcbiAgICAgIHJldHVybiBmYWxzZVxuXG4gICAgaWYgc291cmNlY29kZXMuaXNWYWxpZChAJChcImlucHV0XCIpLnZhbCgpKVxuICAgICAgcmV0dXJuIGZhbHNlXG5cbiAgICByZXR1cm4gXCJJbnZhbGlkIFNvdXJjZVwiXG5cbiIsIlF1ZXN0aW9uID0gcmVxdWlyZSgnLi9mb3JtLWNvbnRyb2xzJykuUXVlc3Rpb25cbkltYWdlUGFnZSA9IHJlcXVpcmUgJy4uL3BhZ2VzL0ltYWdlUGFnZSdcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBJbWFnZVF1ZXN0aW9uIGV4dGVuZHMgUXVlc3Rpb25cbiAgZXZlbnRzOlxuICAgIFwiY2xpY2sgI2FkZFwiOiBcImFkZENsaWNrXCJcbiAgICBcImNsaWNrIC50aHVtYm5haWwtaW1nXCI6IFwidGh1bWJuYWlsQ2xpY2tcIlxuXG4gIHJlbmRlckFuc3dlcjogKGFuc3dlckVsKSAtPlxuICAgICMgUmVuZGVyIGltYWdlIHVzaW5nIGltYWdlIG1hbmFnZXJcbiAgICBpZiBub3QgQGN0eC5pbWFnZU1hbmFnZXJcbiAgICAgIGFuc3dlckVsLmh0bWwgJycnPGRpdiBjbGFzcz1cInRleHQtZXJyb3JcIj5JbWFnZXMgbm90IGF2YWlsYWJsZTwvZGl2PicnJ1xuICAgIGVsc2VcbiAgICAgIGltYWdlID0gQG1vZGVsLmdldChAaWQpXG5cbiAgICAgICMgRGV0ZXJtaW5lIGlmIGNhbiBhZGQgaW1hZ2VzXG4gICAgICBub3RTdXBwb3J0ZWQgPSBmYWxzZVxuICAgICAgaWYgQG9wdGlvbnMucmVhZG9ubHlcbiAgICAgICAgY2FuQWRkID0gZmFsc2VcbiAgICAgIGVsc2UgaWYgQGN0eC5jYW1lcmEgYW5kIEBjdHguaW1hZ2VNYW5hZ2VyLmFkZEltYWdlXG4gICAgICAgIGNhbkFkZCA9IG5vdCBpbWFnZT8gIyBEb24ndCBhbGxvdyBhZGRpbmcgbW9yZSB0aGFuIG9uZVxuICAgICAgZWxzZVxuICAgICAgICBjYW5BZGQgPSBmYWxzZVxuICAgICAgICBub3RTdXBwb3J0ZWQgPSBub3QgaW1hZ2VcblxuICAgICAgIyBEZXRlcm1pbmUgaWYgd2UgbmVlZCB0byB0ZWxsIHVzZXIgdGhhdCBubyBpbWFnZSBpcyBhdmFpbGFibGVcbiAgICAgIG5vSW1hZ2UgPSBub3QgY2FuQWRkIGFuZCBub3QgaW1hZ2UgYW5kIG5vdCBub3RTdXBwb3J0ZWRcblxuICAgICAgIyBSZW5kZXIgaW1hZ2VzXG4gICAgICBhbnN3ZXJFbC5odG1sIHRlbXBsYXRlc1snZm9ybXMvSW1hZ2VRdWVzdGlvbiddKGltYWdlOiBpbWFnZSwgY2FuQWRkOiBjYW5BZGQsIG5vSW1hZ2U6IG5vSW1hZ2UsIG5vdFN1cHBvcnRlZDogbm90U3VwcG9ydGVkKVxuXG4gICAgICAjIFNldCBzb3VyY2VcbiAgICAgIGlmIGltYWdlXG4gICAgICAgIEBzZXRUaHVtYm5haWxVcmwoaW1hZ2UuaWQpXG4gICAgXG4gIHNldFRodW1ibmFpbFVybDogKGlkKSAtPlxuICAgIHN1Y2Nlc3MgPSAodXJsKSA9PlxuICAgICAgQCQoXCIjXCIgKyBpZCkuYXR0cihcInNyY1wiLCB1cmwpXG4gICAgQGN0eC5pbWFnZU1hbmFnZXIuZ2V0SW1hZ2VUaHVtYm5haWxVcmwgaWQsIHN1Y2Nlc3MsIEBlcnJvclxuXG4gIGFkZENsaWNrOiAtPlxuICAgICMgQ2FsbCBjYW1lcmEgdG8gZ2V0IGltYWdlXG4gICAgc3VjY2VzcyA9ICh1cmwpID0+XG4gICAgICAjIEFkZCBpbWFnZVxuICAgICAgQGN0eC5pbWFnZU1hbmFnZXIuYWRkSW1hZ2UodXJsLCAoaWQpID0+XG4gICAgICAgICMgQWRkIHRvIG1vZGVsXG4gICAgICAgIEBtb2RlbC5zZXQoQGlkLCB7IGlkOiBpZCB9KVxuICAgICAgLCBAY3R4LmVycm9yKVxuICAgIEBjdHguY2FtZXJhLnRha2VQaWN0dXJlIHN1Y2Nlc3MsIChlcnIpIC0+XG4gICAgICBhbGVydChcIkZhaWxlZCB0byB0YWtlIHBpY3R1cmVcIilcblxuICB0aHVtYm5haWxDbGljazogKGV2KSAtPlxuICAgIGlkID0gZXYuY3VycmVudFRhcmdldC5pZFxuXG4gICAgIyBDcmVhdGUgb25SZW1vdmUgY2FsbGJhY2tcbiAgICBvblJlbW92ZSA9ICgpID0+IFxuICAgICAgQG1vZGVsLnNldChAaWQsIG51bGwpXG5cbiAgICBAY3R4LnBhZ2VyLm9wZW5QYWdlKEltYWdlUGFnZSwgeyBpZDogaWQsIG9uUmVtb3ZlOiBvblJlbW92ZSB9KSIsIlF1ZXN0aW9uID0gcmVxdWlyZSgnLi9mb3JtLWNvbnRyb2xzJykuUXVlc3Rpb25cbkltYWdlUGFnZSA9IHJlcXVpcmUgJy4uL3BhZ2VzL0ltYWdlUGFnZSdcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBJbWFnZXNRdWVzdGlvbiBleHRlbmRzIFF1ZXN0aW9uXG4gIGV2ZW50czpcbiAgICBcImNsaWNrICNhZGRcIjogXCJhZGRDbGlja1wiXG4gICAgXCJjbGljayAudGh1bWJuYWlsLWltZ1wiOiBcInRodW1ibmFpbENsaWNrXCJcblxuICByZW5kZXJBbnN3ZXI6IChhbnN3ZXJFbCkgLT5cbiAgICAjIFJlbmRlciBpbWFnZSB1c2luZyBpbWFnZSBtYW5hZ2VyXG4gICAgaWYgbm90IEBjdHguaW1hZ2VNYW5hZ2VyXG4gICAgICBhbnN3ZXJFbC5odG1sICcnJzxkaXYgY2xhc3M9XCJ0ZXh0LWVycm9yXCI+SW1hZ2VzIG5vdCBhdmFpbGFibGU8L2Rpdj4nJydcbiAgICBlbHNlXG4gICAgICBpbWFnZXMgPSBAbW9kZWwuZ2V0KEBpZClcblxuICAgICAgIyBEZXRlcm1pbmUgaWYgY2FuIGFkZCBpbWFnZXNcbiAgICAgIG5vdFN1cHBvcnRlZCA9IGZhbHNlXG4gICAgICBpZiBAb3B0aW9ucy5yZWFkb25seVxuICAgICAgICBjYW5BZGQgPSBmYWxzZVxuICAgICAgZWxzZSBpZiBAY3R4LmNhbWVyYSBhbmQgQGN0eC5pbWFnZU1hbmFnZXIuYWRkSW1hZ2VcbiAgICAgICAgY2FuQWRkID0gdHJ1ZVxuICAgICAgZWxzZVxuICAgICAgICBjYW5BZGQgPSBmYWxzZVxuICAgICAgICBub3RTdXBwb3J0ZWQgPSBub3QgaW1hZ2VzIG9yIGltYWdlcy5sZW5ndGggPT0gMFxuXG4gICAgICAjIERldGVybWluZSBpZiB3ZSBuZWVkIHRvIHRlbGwgdXNlciB0aGF0IG5vIGltYWdlIGFyZSBhdmFpbGFibGVcbiAgICAgIG5vSW1hZ2UgPSBub3QgY2FuQWRkIGFuZCAobm90IGltYWdlcyBvciBpbWFnZXMubGVuZ3RoID09IDApIGFuZCBub3Qgbm90U3VwcG9ydGVkXG5cbiAgICAgICMgUmVuZGVyIGltYWdlc1xuICAgICAgYW5zd2VyRWwuaHRtbCB0ZW1wbGF0ZXNbJ2Zvcm1zL0ltYWdlc1F1ZXN0aW9uJ10oaW1hZ2VzOiBpbWFnZXMsIGNhbkFkZDogY2FuQWRkLCBub0ltYWdlOiBub0ltYWdlLCBub3RTdXBwb3J0ZWQ6IG5vdFN1cHBvcnRlZClcblxuICAgICAgIyBTZXQgc291cmNlc1xuICAgICAgaWYgaW1hZ2VzXG4gICAgICAgIGZvciBpbWFnZSBpbiBpbWFnZXNcbiAgICAgICAgICBAc2V0VGh1bWJuYWlsVXJsKGltYWdlLmlkKVxuICAgIFxuICBzZXRUaHVtYm5haWxVcmw6IChpZCkgLT5cbiAgICBzdWNjZXNzID0gKHVybCkgPT5cbiAgICAgIEAkKFwiI1wiICsgaWQpLmF0dHIoXCJzcmNcIiwgdXJsKVxuICAgIEBjdHguaW1hZ2VNYW5hZ2VyLmdldEltYWdlVGh1bWJuYWlsVXJsIGlkLCBzdWNjZXNzLCBAZXJyb3JcblxuICBhZGRDbGljazogLT5cbiAgICAjIENhbGwgY2FtZXJhIHRvIGdldCBpbWFnZVxuICAgIHN1Y2Nlc3MgPSAodXJsKSA9PlxuICAgICAgIyBBZGQgaW1hZ2VcbiAgICAgIEBjdHguaW1hZ2VNYW5hZ2VyLmFkZEltYWdlKHVybCwgKGlkKSA9PlxuICAgICAgICAjIEFkZCB0byBtb2RlbFxuICAgICAgICBpbWFnZXMgPSBAbW9kZWwuZ2V0KEBpZCkgfHwgW11cbiAgICAgICAgaW1hZ2VzLnB1c2ggeyBpZDogaWQgfVxuICAgICAgICBAbW9kZWwuc2V0KEBpZCwgaW1hZ2VzKVxuXG4gICAgICAsIEBjdHguZXJyb3IpXG4gICAgQGN0eC5jYW1lcmEudGFrZVBpY3R1cmUgc3VjY2VzcywgKGVycikgLT5cbiAgICAgIGFsZXJ0KFwiRmFpbGVkIHRvIHRha2UgcGljdHVyZVwiKVxuXG4gIHRodW1ibmFpbENsaWNrOiAoZXYpIC0+XG4gICAgaWQgPSBldi5jdXJyZW50VGFyZ2V0LmlkXG5cbiAgICAjIENyZWF0ZSBvblJlbW92ZSBjYWxsYmFja1xuICAgIG9uUmVtb3ZlID0gKCkgPT4gXG4gICAgICBpbWFnZXMgPSBAbW9kZWwuZ2V0KEBpZCkgfHwgW11cbiAgICAgIGltYWdlcyA9IF8ucmVqZWN0IGltYWdlcywgKGltZykgPT5cbiAgICAgICAgaW1nLmlkID09IGlkXG4gICAgICBAbW9kZWwuc2V0KEBpZCwgaW1hZ2VzKSAgICAgIFxuXG4gICAgQGN0eC5wYWdlci5vcGVuUGFnZShJbWFnZVBhZ2UsIHsgaWQ6IGlkLCBvblJlbW92ZTogb25SZW1vdmUgfSkiLCIjIEltcHJvdmVkIGxvY2F0aW9uIGZpbmRlclxuY2xhc3MgTG9jYXRpb25GaW5kZXJcbiAgY29uc3RydWN0b3I6IC0+XG4gICAgXy5leHRlbmQgQCwgQmFja2JvbmUuRXZlbnRzXG4gICAgXG4gIGdldExvY2F0aW9uOiAtPlxuICAgICMgQm90aCBmYWlsdXJlcyBhcmUgcmVxdWlyZWQgdG8gdHJpZ2dlciBlcnJvclxuICAgIGxvY2F0aW9uRXJyb3IgPSBfLmFmdGVyIDIsID0+XG4gICAgICBAdHJpZ2dlciAnZXJyb3InXG5cbiAgICBoaWdoQWNjdXJhY3lGaXJlZCA9IGZhbHNlXG5cbiAgICBsb3dBY2N1cmFjeSA9IChwb3MpID0+XG4gICAgICBpZiBub3QgaGlnaEFjY3VyYWN5RmlyZWRcbiAgICAgICAgQHRyaWdnZXIgJ2ZvdW5kJywgcG9zXG5cbiAgICBoaWdoQWNjdXJhY3kgPSAocG9zKSA9PlxuICAgICAgaGlnaEFjY3VyYWN5RmlyZWQgPSB0cnVlXG4gICAgICBAdHJpZ2dlciAnZm91bmQnLCBwb3NcblxuICAgICMgR2V0IGJvdGggaGlnaCBhbmQgbG93IGFjY3VyYWN5LCBhcyBsb3cgaXMgc3VmZmljaWVudCBmb3IgaW5pdGlhbCBkaXNwbGF5XG4gICAgbmF2aWdhdG9yLmdlb2xvY2F0aW9uLmdldEN1cnJlbnRQb3NpdGlvbihsb3dBY2N1cmFjeSwgbG9jYXRpb25FcnJvciwge1xuICAgICAgICBtYXhpbXVtQWdlIDogMzYwMCoyNCxcbiAgICAgICAgdGltZW91dCA6IDEwMDAwLFxuICAgICAgICBlbmFibGVIaWdoQWNjdXJhY3kgOiBmYWxzZVxuICAgIH0pXG5cbiAgICBuYXZpZ2F0b3IuZ2VvbG9jYXRpb24uZ2V0Q3VycmVudFBvc2l0aW9uKGhpZ2hBY2N1cmFjeSwgbG9jYXRpb25FcnJvciwge1xuICAgICAgICBtYXhpbXVtQWdlIDogMzYwMCxcbiAgICAgICAgdGltZW91dCA6IDMwMDAwLFxuICAgICAgICBlbmFibGVIaWdoQWNjdXJhY3kgOiB0cnVlXG4gICAgfSlcblxuICBzdGFydFdhdGNoOiAtPlxuICAgICMgQWxsb3cgb25lIHdhdGNoIGF0IG1vc3RcbiAgICBpZiBAbG9jYXRpb25XYXRjaElkP1xuICAgICAgQHN0b3BXYXRjaCgpXG5cbiAgICBoaWdoQWNjdXJhY3lGaXJlZCA9IGZhbHNlXG4gICAgbG93QWNjdXJhY3lGaXJlZCA9IGZhbHNlXG5cbiAgICBsb3dBY2N1cmFjeSA9IChwb3MpID0+XG4gICAgICBpZiBub3QgaGlnaEFjY3VyYWN5RmlyZWRcbiAgICAgICAgbG93QWNjdXJhY3lGaXJlZCA9IHRydWVcbiAgICAgICAgQHRyaWdnZXIgJ2ZvdW5kJywgcG9zXG5cbiAgICBoaWdoQWNjdXJhY3kgPSAocG9zKSA9PlxuICAgICAgaGlnaEFjY3VyYWN5RmlyZWQgPSB0cnVlXG4gICAgICBAdHJpZ2dlciAnZm91bmQnLCBwb3NcblxuICAgIGVycm9yID0gKGVycm9yKSA9PlxuICAgICAgY29uc29sZS5sb2cgXCIjIyMgZXJyb3IgXCJcbiAgICAgICMgTm8gZXJyb3IgaWYgZmlyZWQgb25jZVxuICAgICAgaWYgbm90IGxvd0FjY3VyYWN5RmlyZWQgYW5kIG5vdCBoaWdoQWNjdXJhY3lGaXJlZFxuICAgICAgICBAdHJpZ2dlciAnZXJyb3InLCBlcnJvclxuXG4gICAgIyBGaXJlIGluaXRpYWwgbG93LWFjY3VyYWN5IG9uZVxuICAgIG5hdmlnYXRvci5nZW9sb2NhdGlvbi5nZXRDdXJyZW50UG9zaXRpb24obG93QWNjdXJhY3ksIGVycm9yLCB7XG4gICAgICAgIG1heGltdW1BZ2UgOiAzNjAwKjI0LFxuICAgICAgICB0aW1lb3V0IDogMTAwMDAsXG4gICAgICAgIGVuYWJsZUhpZ2hBY2N1cmFjeSA6IGZhbHNlXG4gICAgfSlcblxuICAgIEBsb2NhdGlvbldhdGNoSWQgPSBuYXZpZ2F0b3IuZ2VvbG9jYXRpb24ud2F0Y2hQb3NpdGlvbihoaWdoQWNjdXJhY3ksIGVycm9yLCB7XG4gICAgICAgIG1heGltdW1BZ2UgOiAzMDAwLFxuICAgICAgICBlbmFibGVIaWdoQWNjdXJhY3kgOiB0cnVlXG4gICAgfSkgIFxuXG4gIHN0b3BXYXRjaDogLT5cbiAgICBpZiBAbG9jYXRpb25XYXRjaElkP1xuICAgICAgbmF2aWdhdG9yLmdlb2xvY2F0aW9uLmNsZWFyV2F0Y2goQGxvY2F0aW9uV2F0Y2hJZClcbiAgICAgIEBsb2NhdGlvbldhdGNoSWQgPSB1bmRlZmluZWRcblxuXG5tb2R1bGUuZXhwb3J0cyA9IExvY2F0aW9uRmluZGVyICAiLCIjIFBhZ2UgdGhhdCBpcyBkaXNwbGF5ZWQgYnkgdGhlIFBhZ2VyLiBQYWdlcyBoYXZlIHRoZSBmb2xsb3dpbmcgbGlmZWN5Y2xlOlxuIyBjcmVhdGUsIGFjdGl2YXRlLCBbZGVhY3RpdmF0ZSwgYWN0aXZhdGUuLi5dLCBkZWFjdGl2YXRlLCBkZXN0cm95XG4jIENvbnRleHQgaXMgbWl4ZWQgaW4gdG8gdGhlIHBhZ2Ugb2JqZWN0XG4jIFN0YXRpYyBtZXRob2QgXCJjYW5PcGVuKGN0eClcIiwgaWYgcHJlc2VudCwgY2FuIGZvcmJpZCBvcGVuaW5nIHBhZ2UgaWYgaXQgcmV0dXJucyBmYWxzZVxuIyBVc2VmdWwgZm9yIGRpc3BsYXlpbmcgbWVudXMgd2l0aCBwYWdlIGxpc3RzLlxuXG5jbGFzcyBQYWdlIGV4dGVuZHMgQmFja2JvbmUuVmlld1xuICBjb25zdHJ1Y3RvcjogKGN0eCwgb3B0aW9ucz17fSkgLT5cbiAgICBzdXBlcihvcHRpb25zKVxuICAgIEBjdHggPSBjdHhcblxuICAgICMgTWl4IGluIGNvbnRleHQgZm9yIGNvbnZlbmllbmNlXG4gICAgXy5leHRlbmQoQCwgY3R4KSBcblxuICAgICMgU3RvcmUgc3Vidmlld3NcbiAgICBAX3N1YnZpZXdzID0gW11cblxuICAgICMgU2V0dXAgZGVmYXVsdCBidXR0b24gYmFyXG4gICAgQGJ1dHRvbkJhciA9IG5ldyBCdXR0b25CYXIoKVxuXG4gICAgIyBTZXR1cCBkZWZhdWx0IGNvbnRleHQgbWVudVxuICAgIEBjb250ZXh0TWVudSA9IG5ldyBDb250ZXh0TWVudSgpXG5cbiAgY2xhc3NOYW1lOiBcInBhZ2VcIlxuXG4gIEBjYW5PcGVuOiAoY3R4KSAtPiB0cnVlXG4gIGNyZWF0ZTogLT5cbiAgYWN0aXZhdGU6IC0+XG4gIGRlYWN0aXZhdGU6IC0+XG4gIGRlc3Ryb3k6IC0+XG4gIHJlbW92ZTogLT5cbiAgICBAcmVtb3ZlU3Vidmlld3MoKVxuICAgIHN1cGVyKClcblxuICBnZXRUaXRsZTogLT4gQHRpdGxlXG5cbiAgc2V0VGl0bGU6ICh0aXRsZSkgLT5cbiAgICBAdGl0bGUgPSB0aXRsZVxuICAgIEB0cmlnZ2VyICdjaGFuZ2U6dGl0bGUnXG5cbiAgYWRkU3VidmlldzogKHZpZXcpIC0+XG4gICAgQF9zdWJ2aWV3cy5wdXNoKHZpZXcpXG5cbiAgcmVtb3ZlU3Vidmlld3M6IC0+XG4gICAgZm9yIHN1YnZpZXcgaW4gQF9zdWJ2aWV3c1xuICAgICAgc3Vidmlldy5yZW1vdmUoKVxuXG4gIGdldEJ1dHRvbkJhcjogLT5cbiAgICByZXR1cm4gQGJ1dHRvbkJhclxuXG4gIGdldENvbnRleHRNZW51OiAtPlxuICAgIHJldHVybiBAY29udGV4dE1lbnVcblxuICBzZXR1cEJ1dHRvbkJhcjogKGl0ZW1zKSAtPlxuICAgICMgU2V0dXAgYnV0dG9uIGJhclxuICAgIEBidXR0b25CYXIuc2V0dXAoaXRlbXMpXG5cbiAgc2V0dXBDb250ZXh0TWVudTogKGl0ZW1zKSAtPlxuICAgICMgU2V0dXAgY29udGV4dCBtZW51XG4gICAgQGNvbnRleHRNZW51LnNldHVwKGl0ZW1zKVxuXG4jIFN0YW5kYXJkIGJ1dHRvbiBiYXIuIEVhY2ggaXRlbVxuIyBoYXMgb3B0aW9uYWwgXCJ0ZXh0XCIsIG9wdGlvbmFsIFwiaWNvblwiIGFuZCBcImNsaWNrXCIgKGFjdGlvbikuXG4jIEZvciBzdWJtZW51LCBhZGQgYXJyYXkgdG8gXCJtZW51XCIuIE9uZSBsZXZlbCBuZXN0aW5nIG9ubHkuXG5jbGFzcyBCdXR0b25CYXIgZXh0ZW5kcyBCYWNrYm9uZS5WaWV3XG4gIGV2ZW50czogXG4gICAgXCJjbGljayAubWVudWl0ZW1cIiA6IFwiY2xpY2tNZW51SXRlbVwiXG5cbiAgc2V0dXA6IChpdGVtcykgLT5cbiAgICBAaXRlbXMgPSBpdGVtc1xuICAgIEBpdGVtTWFwID0ge31cblxuICAgICMgQWRkIGlkIHRvIGFsbCBpdGVtcyBpZiBub3QgcHJlc2VudFxuICAgIGlkID0gMVxuICAgIGZvciBpdGVtIGluIGl0ZW1zXG4gICAgICBpZiBub3QgaXRlbS5pZD9cbiAgICAgICAgaXRlbS5pZCA9IGlkXG4gICAgICAgIGlkPWlkKzFcbiAgICAgIEBpdGVtTWFwW2l0ZW0uaWRdID0gaXRlbVxuXG4gICAgICAjIEFkZCB0byBzdWJtZW51XG4gICAgICBpZiBpdGVtLm1lbnVcbiAgICAgICAgZm9yIHN1Yml0ZW0gaW4gaXRlbS5tZW51XG4gICAgICAgICAgaWYgbm90IHN1Yml0ZW0uaWQ/XG4gICAgICAgICAgICBzdWJpdGVtLmlkID0gaWQudG9TdHJpbmcoKVxuICAgICAgICAgICAgaWQ9aWQrMVxuICAgICAgICAgIEBpdGVtTWFwW3N1Yml0ZW0uaWRdID0gc3ViaXRlbVxuXG4gICAgQHJlbmRlcigpXG5cbiAgcmVuZGVyOiAtPlxuICAgIEAkZWwuaHRtbCB0ZW1wbGF0ZXNbJ0J1dHRvbkJhciddKGl0ZW1zOiBAaXRlbXMpXG5cbiAgY2xpY2tNZW51SXRlbTogKGUpIC0+XG4gICAgaWQgPSBlLmN1cnJlbnRUYXJnZXQuaWRcbiAgICBpdGVtID0gQGl0ZW1NYXBbaWRdXG4gICAgaWYgaXRlbS5jbGljaz9cbiAgICAgIGl0ZW0uY2xpY2soKVxuXG4jIENvbnRleHQgbWVudSB0byBnbyBpbiBzbGlkZSBtZW51XG4jIFN0YW5kYXJkIGJ1dHRvbiBiYXIuIEVhY2ggaXRlbSBcInRleHRcIiwgb3B0aW9uYWwgXCJnbHlwaFwiIChib290c3RyYXAgZ2x5cGggd2l0aG91dCBpY29uLSBwcmVmaXgpIGFuZCBcImNsaWNrXCIgKGFjdGlvbikuXG5jbGFzcyBDb250ZXh0TWVudSBleHRlbmRzIEJhY2tib25lLlZpZXdcbiAgZXZlbnRzOiBcbiAgICBcImNsaWNrIC5tZW51aXRlbVwiIDogXCJjbGlja01lbnVJdGVtXCJcblxuICBzZXR1cDogKGl0ZW1zKSAtPlxuICAgIEBpdGVtcyA9IGl0ZW1zXG4gICAgQGl0ZW1NYXAgPSB7fVxuXG4gICAgIyBBZGQgaWQgdG8gYWxsIGl0ZW1zIGlmIG5vdCBwcmVzZW50XG4gICAgaWQgPSAxXG4gICAgZm9yIGl0ZW0gaW4gaXRlbXNcbiAgICAgIGlmIG5vdCBpdGVtLmlkP1xuICAgICAgICBpdGVtLmlkID0gaWRcbiAgICAgICAgaWQ9aWQrMVxuICAgICAgQGl0ZW1NYXBbaXRlbS5pZF0gPSBpdGVtXG5cbiAgICBAcmVuZGVyKClcblxuICByZW5kZXI6IC0+XG4gICAgQCRlbC5odG1sIHRlbXBsYXRlc1snQ29udGV4dE1lbnUnXShpdGVtczogQGl0ZW1zKVxuXG4gIGNsaWNrTWVudUl0ZW06IChlKSAtPlxuICAgIGlkID0gZS5jdXJyZW50VGFyZ2V0LmlkXG4gICAgaXRlbSA9IEBpdGVtTWFwW2lkXVxuICAgIGlmIGl0ZW0uY2xpY2s/XG4gICAgICBpdGVtLmNsaWNrKClcblxubW9kdWxlLmV4cG9ydHMgPSBQYWdlIiwiLy8gVE9ETyBhZGQgbGljZW5zZVxuXG5Mb2NhbENvbGxlY3Rpb24gPSB7fTtcbkVKU09OID0gcmVxdWlyZShcIi4vRUpTT05cIik7XG5cbi8vIExpa2UgXy5pc0FycmF5LCBidXQgZG9lc24ndCByZWdhcmQgcG9seWZpbGxlZCBVaW50OEFycmF5cyBvbiBvbGQgYnJvd3NlcnMgYXNcbi8vIGFycmF5cy5cbnZhciBpc0FycmF5ID0gZnVuY3Rpb24gKHgpIHtcbiAgcmV0dXJuIF8uaXNBcnJheSh4KSAmJiAhRUpTT04uaXNCaW5hcnkoeCk7XG59O1xuXG52YXIgX2FueUlmQXJyYXkgPSBmdW5jdGlvbiAoeCwgZikge1xuICBpZiAoaXNBcnJheSh4KSlcbiAgICByZXR1cm4gXy5hbnkoeCwgZik7XG4gIHJldHVybiBmKHgpO1xufTtcblxudmFyIF9hbnlJZkFycmF5UGx1cyA9IGZ1bmN0aW9uICh4LCBmKSB7XG4gIGlmIChmKHgpKVxuICAgIHJldHVybiB0cnVlO1xuICByZXR1cm4gaXNBcnJheSh4KSAmJiBfLmFueSh4LCBmKTtcbn07XG5cbnZhciBoYXNPcGVyYXRvcnMgPSBmdW5jdGlvbih2YWx1ZVNlbGVjdG9yKSB7XG4gIHZhciB0aGVzZUFyZU9wZXJhdG9ycyA9IHVuZGVmaW5lZDtcbiAgZm9yICh2YXIgc2VsS2V5IGluIHZhbHVlU2VsZWN0b3IpIHtcbiAgICB2YXIgdGhpc0lzT3BlcmF0b3IgPSBzZWxLZXkuc3Vic3RyKDAsIDEpID09PSAnJCc7XG4gICAgaWYgKHRoZXNlQXJlT3BlcmF0b3JzID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoZXNlQXJlT3BlcmF0b3JzID0gdGhpc0lzT3BlcmF0b3I7XG4gICAgfSBlbHNlIGlmICh0aGVzZUFyZU9wZXJhdG9ycyAhPT0gdGhpc0lzT3BlcmF0b3IpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkluY29uc2lzdGVudCBzZWxlY3RvcjogXCIgKyB2YWx1ZVNlbGVjdG9yKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuICEhdGhlc2VBcmVPcGVyYXRvcnM7ICAvLyB7fSBoYXMgbm8gb3BlcmF0b3JzXG59O1xuXG52YXIgY29tcGlsZVZhbHVlU2VsZWN0b3IgPSBmdW5jdGlvbiAodmFsdWVTZWxlY3Rvcikge1xuICBpZiAodmFsdWVTZWxlY3RvciA9PSBudWxsKSB7ICAvLyB1bmRlZmluZWQgb3IgbnVsbFxuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJldHVybiBfYW55SWZBcnJheSh2YWx1ZSwgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIHggPT0gbnVsbDsgIC8vIHVuZGVmaW5lZCBvciBudWxsXG4gICAgICB9KTtcbiAgICB9O1xuICB9XG5cbiAgLy8gU2VsZWN0b3IgaXMgYSBub24tbnVsbCBwcmltaXRpdmUgKGFuZCBub3QgYW4gYXJyYXkgb3IgUmVnRXhwIGVpdGhlcikuXG4gIGlmICghXy5pc09iamVjdCh2YWx1ZVNlbGVjdG9yKSkge1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJldHVybiBfYW55SWZBcnJheSh2YWx1ZSwgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIHggPT09IHZhbHVlU2VsZWN0b3I7XG4gICAgICB9KTtcbiAgICB9O1xuICB9XG5cbiAgaWYgKHZhbHVlU2VsZWN0b3IgaW5zdGFuY2VvZiBSZWdFeHApIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZClcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgcmV0dXJuIF9hbnlJZkFycmF5KHZhbHVlLCBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4gdmFsdWVTZWxlY3Rvci50ZXN0KHgpO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfVxuXG4gIC8vIEFycmF5cyBtYXRjaCBlaXRoZXIgaWRlbnRpY2FsIGFycmF5cyBvciBhcnJheXMgdGhhdCBjb250YWluIGl0IGFzIGEgdmFsdWUuXG4gIGlmIChpc0FycmF5KHZhbHVlU2VsZWN0b3IpKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgaWYgKCFpc0FycmF5KHZhbHVlKSlcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgcmV0dXJuIF9hbnlJZkFycmF5UGx1cyh2YWx1ZSwgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIExvY2FsQ29sbGVjdGlvbi5fZi5fZXF1YWwodmFsdWVTZWxlY3RvciwgeCk7XG4gICAgICB9KTtcbiAgICB9O1xuICB9XG5cbiAgLy8gSXQncyBhbiBvYmplY3QsIGJ1dCBub3QgYW4gYXJyYXkgb3IgcmVnZXhwLlxuICBpZiAoaGFzT3BlcmF0b3JzKHZhbHVlU2VsZWN0b3IpKSB7XG4gICAgdmFyIG9wZXJhdG9yRnVuY3Rpb25zID0gW107XG4gICAgXy5lYWNoKHZhbHVlU2VsZWN0b3IsIGZ1bmN0aW9uIChvcGVyYW5kLCBvcGVyYXRvcikge1xuICAgICAgaWYgKCFfLmhhcyhWQUxVRV9PUEVSQVRPUlMsIG9wZXJhdG9yKSlcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5yZWNvZ25pemVkIG9wZXJhdG9yOiBcIiArIG9wZXJhdG9yKTtcbiAgICAgIG9wZXJhdG9yRnVuY3Rpb25zLnB1c2goVkFMVUVfT1BFUkFUT1JTW29wZXJhdG9yXShcbiAgICAgICAgb3BlcmFuZCwgdmFsdWVTZWxlY3Rvci4kb3B0aW9ucykpO1xuICAgIH0pO1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJldHVybiBfLmFsbChvcGVyYXRvckZ1bmN0aW9ucywgZnVuY3Rpb24gKGYpIHtcbiAgICAgICAgcmV0dXJuIGYodmFsdWUpO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfVxuXG4gIC8vIEl0J3MgYSBsaXRlcmFsOyBjb21wYXJlIHZhbHVlIChvciBlbGVtZW50IG9mIHZhbHVlIGFycmF5KSBkaXJlY3RseSB0byB0aGVcbiAgLy8gc2VsZWN0b3IuXG4gIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICByZXR1cm4gX2FueUlmQXJyYXkodmFsdWUsIGZ1bmN0aW9uICh4KSB7XG4gICAgICByZXR1cm4gTG9jYWxDb2xsZWN0aW9uLl9mLl9lcXVhbCh2YWx1ZVNlbGVjdG9yLCB4KTtcbiAgICB9KTtcbiAgfTtcbn07XG5cbi8vIFhYWCBjYW4gZmFjdG9yIG91dCBjb21tb24gbG9naWMgYmVsb3dcbnZhciBMT0dJQ0FMX09QRVJBVE9SUyA9IHtcbiAgXCIkYW5kXCI6IGZ1bmN0aW9uKHN1YlNlbGVjdG9yKSB7XG4gICAgaWYgKCFpc0FycmF5KHN1YlNlbGVjdG9yKSB8fCBfLmlzRW1wdHkoc3ViU2VsZWN0b3IpKVxuICAgICAgdGhyb3cgRXJyb3IoXCIkYW5kLyRvci8kbm9yIG11c3QgYmUgbm9uZW1wdHkgYXJyYXlcIik7XG4gICAgdmFyIHN1YlNlbGVjdG9yRnVuY3Rpb25zID0gXy5tYXAoXG4gICAgICBzdWJTZWxlY3RvciwgY29tcGlsZURvY3VtZW50U2VsZWN0b3IpO1xuICAgIHJldHVybiBmdW5jdGlvbiAoZG9jKSB7XG4gICAgICByZXR1cm4gXy5hbGwoc3ViU2VsZWN0b3JGdW5jdGlvbnMsIGZ1bmN0aW9uIChmKSB7XG4gICAgICAgIHJldHVybiBmKGRvYyk7XG4gICAgICB9KTtcbiAgICB9O1xuICB9LFxuXG4gIFwiJG9yXCI6IGZ1bmN0aW9uKHN1YlNlbGVjdG9yKSB7XG4gICAgaWYgKCFpc0FycmF5KHN1YlNlbGVjdG9yKSB8fCBfLmlzRW1wdHkoc3ViU2VsZWN0b3IpKVxuICAgICAgdGhyb3cgRXJyb3IoXCIkYW5kLyRvci8kbm9yIG11c3QgYmUgbm9uZW1wdHkgYXJyYXlcIik7XG4gICAgdmFyIHN1YlNlbGVjdG9yRnVuY3Rpb25zID0gXy5tYXAoXG4gICAgICBzdWJTZWxlY3RvciwgY29tcGlsZURvY3VtZW50U2VsZWN0b3IpO1xuICAgIHJldHVybiBmdW5jdGlvbiAoZG9jKSB7XG4gICAgICByZXR1cm4gXy5hbnkoc3ViU2VsZWN0b3JGdW5jdGlvbnMsIGZ1bmN0aW9uIChmKSB7XG4gICAgICAgIHJldHVybiBmKGRvYyk7XG4gICAgICB9KTtcbiAgICB9O1xuICB9LFxuXG4gIFwiJG5vclwiOiBmdW5jdGlvbihzdWJTZWxlY3Rvcikge1xuICAgIGlmICghaXNBcnJheShzdWJTZWxlY3RvcikgfHwgXy5pc0VtcHR5KHN1YlNlbGVjdG9yKSlcbiAgICAgIHRocm93IEVycm9yKFwiJGFuZC8kb3IvJG5vciBtdXN0IGJlIG5vbmVtcHR5IGFycmF5XCIpO1xuICAgIHZhciBzdWJTZWxlY3RvckZ1bmN0aW9ucyA9IF8ubWFwKFxuICAgICAgc3ViU2VsZWN0b3IsIGNvbXBpbGVEb2N1bWVudFNlbGVjdG9yKTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGRvYykge1xuICAgICAgcmV0dXJuIF8uYWxsKHN1YlNlbGVjdG9yRnVuY3Rpb25zLCBmdW5jdGlvbiAoZikge1xuICAgICAgICByZXR1cm4gIWYoZG9jKTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0sXG5cbiAgXCIkd2hlcmVcIjogZnVuY3Rpb24oc2VsZWN0b3JWYWx1ZSkge1xuICAgIGlmICghKHNlbGVjdG9yVmFsdWUgaW5zdGFuY2VvZiBGdW5jdGlvbikpIHtcbiAgICAgIHNlbGVjdG9yVmFsdWUgPSBGdW5jdGlvbihcInJldHVybiBcIiArIHNlbGVjdG9yVmFsdWUpO1xuICAgIH1cbiAgICByZXR1cm4gZnVuY3Rpb24gKGRvYykge1xuICAgICAgcmV0dXJuIHNlbGVjdG9yVmFsdWUuY2FsbChkb2MpO1xuICAgIH07XG4gIH1cbn07XG5cbnZhciBWQUxVRV9PUEVSQVRPUlMgPSB7XG4gIFwiJGluXCI6IGZ1bmN0aW9uIChvcGVyYW5kKSB7XG4gICAgaWYgKCFpc0FycmF5KG9wZXJhbmQpKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQXJndW1lbnQgdG8gJGluIG11c3QgYmUgYXJyYXlcIik7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgcmV0dXJuIF9hbnlJZkFycmF5UGx1cyh2YWx1ZSwgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIF8uYW55KG9wZXJhbmQsIGZ1bmN0aW9uIChvcGVyYW5kRWx0KSB7XG4gICAgICAgICAgcmV0dXJuIExvY2FsQ29sbGVjdGlvbi5fZi5fZXF1YWwob3BlcmFuZEVsdCwgeCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSxcblxuICBcIiRhbGxcIjogZnVuY3Rpb24gKG9wZXJhbmQpIHtcbiAgICBpZiAoIWlzQXJyYXkob3BlcmFuZCkpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJBcmd1bWVudCB0byAkYWxsIG11c3QgYmUgYXJyYXlcIik7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgaWYgKCFpc0FycmF5KHZhbHVlKSlcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgcmV0dXJuIF8uYWxsKG9wZXJhbmQsIGZ1bmN0aW9uIChvcGVyYW5kRWx0KSB7XG4gICAgICAgIHJldHVybiBfLmFueSh2YWx1ZSwgZnVuY3Rpb24gKHZhbHVlRWx0KSB7XG4gICAgICAgICAgcmV0dXJuIExvY2FsQ29sbGVjdGlvbi5fZi5fZXF1YWwob3BlcmFuZEVsdCwgdmFsdWVFbHQpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0sXG5cbiAgXCIkbHRcIjogZnVuY3Rpb24gKG9wZXJhbmQpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICByZXR1cm4gX2FueUlmQXJyYXkodmFsdWUsIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiBMb2NhbENvbGxlY3Rpb24uX2YuX2NtcCh4LCBvcGVyYW5kKSA8IDA7XG4gICAgICB9KTtcbiAgICB9O1xuICB9LFxuXG4gIFwiJGx0ZVwiOiBmdW5jdGlvbiAob3BlcmFuZCkge1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJldHVybiBfYW55SWZBcnJheSh2YWx1ZSwgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIExvY2FsQ29sbGVjdGlvbi5fZi5fY21wKHgsIG9wZXJhbmQpIDw9IDA7XG4gICAgICB9KTtcbiAgICB9O1xuICB9LFxuXG4gIFwiJGd0XCI6IGZ1bmN0aW9uIChvcGVyYW5kKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgcmV0dXJuIF9hbnlJZkFycmF5KHZhbHVlLCBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4gTG9jYWxDb2xsZWN0aW9uLl9mLl9jbXAoeCwgb3BlcmFuZCkgPiAwO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSxcblxuICBcIiRndGVcIjogZnVuY3Rpb24gKG9wZXJhbmQpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICByZXR1cm4gX2FueUlmQXJyYXkodmFsdWUsIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiBMb2NhbENvbGxlY3Rpb24uX2YuX2NtcCh4LCBvcGVyYW5kKSA+PSAwO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSxcblxuICBcIiRuZVwiOiBmdW5jdGlvbiAob3BlcmFuZCkge1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJldHVybiAhIF9hbnlJZkFycmF5UGx1cyh2YWx1ZSwgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIExvY2FsQ29sbGVjdGlvbi5fZi5fZXF1YWwoeCwgb3BlcmFuZCk7XG4gICAgICB9KTtcbiAgICB9O1xuICB9LFxuXG4gIFwiJG5pblwiOiBmdW5jdGlvbiAob3BlcmFuZCkge1xuICAgIGlmICghaXNBcnJheShvcGVyYW5kKSlcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkFyZ3VtZW50IHRvICRuaW4gbXVzdCBiZSBhcnJheVwiKTtcbiAgICB2YXIgaW5GdW5jdGlvbiA9IFZBTFVFX09QRVJBVE9SUy4kaW4ob3BlcmFuZCk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgLy8gRmllbGQgZG9lc24ndCBleGlzdCwgc28gaXQncyBub3QtaW4gb3BlcmFuZFxuICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgcmV0dXJuICFpbkZ1bmN0aW9uKHZhbHVlKTtcbiAgICB9O1xuICB9LFxuXG4gIFwiJGV4aXN0c1wiOiBmdW5jdGlvbiAob3BlcmFuZCkge1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJldHVybiBvcGVyYW5kID09PSAodmFsdWUgIT09IHVuZGVmaW5lZCk7XG4gICAgfTtcbiAgfSxcblxuICBcIiRtb2RcIjogZnVuY3Rpb24gKG9wZXJhbmQpIHtcbiAgICB2YXIgZGl2aXNvciA9IG9wZXJhbmRbMF0sXG4gICAgICAgIHJlbWFpbmRlciA9IG9wZXJhbmRbMV07XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgcmV0dXJuIF9hbnlJZkFycmF5KHZhbHVlLCBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4geCAlIGRpdmlzb3IgPT09IHJlbWFpbmRlcjtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0sXG5cbiAgXCIkc2l6ZVwiOiBmdW5jdGlvbiAob3BlcmFuZCkge1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJldHVybiBpc0FycmF5KHZhbHVlKSAmJiBvcGVyYW5kID09PSB2YWx1ZS5sZW5ndGg7XG4gICAgfTtcbiAgfSxcblxuICBcIiR0eXBlXCI6IGZ1bmN0aW9uIChvcGVyYW5kKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgLy8gQSBub25leGlzdGVudCBmaWVsZCBpcyBvZiBubyB0eXBlLlxuICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIC8vIERlZmluaXRlbHkgbm90IF9hbnlJZkFycmF5UGx1czogJHR5cGU6IDQgb25seSBtYXRjaGVzIGFycmF5cyB0aGF0IGhhdmVcbiAgICAgIC8vIGFycmF5cyBhcyBlbGVtZW50cyBhY2NvcmRpbmcgdG8gdGhlIE1vbmdvIGRvY3MuXG4gICAgICByZXR1cm4gX2FueUlmQXJyYXkodmFsdWUsIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiBMb2NhbENvbGxlY3Rpb24uX2YuX3R5cGUoeCkgPT09IG9wZXJhbmQ7XG4gICAgICB9KTtcbiAgICB9O1xuICB9LFxuXG4gIFwiJHJlZ2V4XCI6IGZ1bmN0aW9uIChvcGVyYW5kLCBvcHRpb25zKSB7XG4gICAgaWYgKG9wdGlvbnMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgLy8gT3B0aW9ucyBwYXNzZWQgaW4gJG9wdGlvbnMgKGV2ZW4gdGhlIGVtcHR5IHN0cmluZykgYWx3YXlzIG92ZXJyaWRlc1xuICAgICAgLy8gb3B0aW9ucyBpbiB0aGUgUmVnRXhwIG9iamVjdCBpdHNlbGYuXG5cbiAgICAgIC8vIEJlIGNsZWFyIHRoYXQgd2Ugb25seSBzdXBwb3J0IHRoZSBKUy1zdXBwb3J0ZWQgb3B0aW9ucywgbm90IGV4dGVuZGVkXG4gICAgICAvLyBvbmVzIChlZywgTW9uZ28gc3VwcG9ydHMgeCBhbmQgcykuIElkZWFsbHkgd2Ugd291bGQgaW1wbGVtZW50IHggYW5kIHNcbiAgICAgIC8vIGJ5IHRyYW5zZm9ybWluZyB0aGUgcmVnZXhwLCBidXQgbm90IHRvZGF5Li4uXG4gICAgICBpZiAoL1teZ2ltXS8udGVzdChvcHRpb25zKSlcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiT25seSB0aGUgaSwgbSwgYW5kIGcgcmVnZXhwIG9wdGlvbnMgYXJlIHN1cHBvcnRlZFwiKTtcblxuICAgICAgdmFyIHJlZ2V4U291cmNlID0gb3BlcmFuZCBpbnN0YW5jZW9mIFJlZ0V4cCA/IG9wZXJhbmQuc291cmNlIDogb3BlcmFuZDtcbiAgICAgIG9wZXJhbmQgPSBuZXcgUmVnRXhwKHJlZ2V4U291cmNlLCBvcHRpb25zKTtcbiAgICB9IGVsc2UgaWYgKCEob3BlcmFuZCBpbnN0YW5jZW9mIFJlZ0V4cCkpIHtcbiAgICAgIG9wZXJhbmQgPSBuZXcgUmVnRXhwKG9wZXJhbmQpO1xuICAgIH1cblxuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICByZXR1cm4gX2FueUlmQXJyYXkodmFsdWUsIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiBvcGVyYW5kLnRlc3QoeCk7XG4gICAgICB9KTtcbiAgICB9O1xuICB9LFxuXG4gIFwiJG9wdGlvbnNcIjogZnVuY3Rpb24gKG9wZXJhbmQpIHtcbiAgICAvLyBldmFsdWF0aW9uIGhhcHBlbnMgYXQgdGhlICRyZWdleCBmdW5jdGlvbiBhYm92ZVxuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHsgcmV0dXJuIHRydWU7IH07XG4gIH0sXG5cbiAgXCIkZWxlbU1hdGNoXCI6IGZ1bmN0aW9uIChvcGVyYW5kKSB7XG4gICAgdmFyIG1hdGNoZXIgPSBjb21waWxlRG9jdW1lbnRTZWxlY3RvcihvcGVyYW5kKTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICBpZiAoIWlzQXJyYXkodmFsdWUpKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICByZXR1cm4gXy5hbnkodmFsdWUsIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiBtYXRjaGVyKHgpO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSxcblxuICBcIiRub3RcIjogZnVuY3Rpb24gKG9wZXJhbmQpIHtcbiAgICB2YXIgbWF0Y2hlciA9IGNvbXBpbGVWYWx1ZVNlbGVjdG9yKG9wZXJhbmQpO1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJldHVybiAhbWF0Y2hlcih2YWx1ZSk7XG4gICAgfTtcbiAgfSxcblxuICBcIiRuZWFyXCI6IGZ1bmN0aW9uIChvcGVyYW5kKSB7XG4gICAgLy8gQWx3YXlzIHJldHVybnMgdHJ1ZS4gTXVzdCBiZSBoYW5kbGVkIGluIHBvc3QtZmlsdGVyL3NvcnQvbGltaXRcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH0sXG5cbiAgXCIkZ2VvSW50ZXJzZWN0c1wiOiBmdW5jdGlvbiAob3BlcmFuZCkge1xuICAgIC8vIEFsd2F5cyByZXR1cm5zIHRydWUuIE11c3QgYmUgaGFuZGxlZCBpbiBwb3N0LWZpbHRlci9zb3J0L2xpbWl0XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG5cbn07XG5cbi8vIGhlbHBlcnMgdXNlZCBieSBjb21waWxlZCBzZWxlY3RvciBjb2RlXG5Mb2NhbENvbGxlY3Rpb24uX2YgPSB7XG4gIC8vIFhYWCBmb3IgX2FsbCBhbmQgX2luLCBjb25zaWRlciBidWlsZGluZyAnaW5xdWVyeScgYXQgY29tcGlsZSB0aW1lLi5cblxuICBfdHlwZTogZnVuY3Rpb24gKHYpIHtcbiAgICBpZiAodHlwZW9mIHYgPT09IFwibnVtYmVyXCIpXG4gICAgICByZXR1cm4gMTtcbiAgICBpZiAodHlwZW9mIHYgPT09IFwic3RyaW5nXCIpXG4gICAgICByZXR1cm4gMjtcbiAgICBpZiAodHlwZW9mIHYgPT09IFwiYm9vbGVhblwiKVxuICAgICAgcmV0dXJuIDg7XG4gICAgaWYgKGlzQXJyYXkodikpXG4gICAgICByZXR1cm4gNDtcbiAgICBpZiAodiA9PT0gbnVsbClcbiAgICAgIHJldHVybiAxMDtcbiAgICBpZiAodiBpbnN0YW5jZW9mIFJlZ0V4cClcbiAgICAgIHJldHVybiAxMTtcbiAgICBpZiAodHlwZW9mIHYgPT09IFwiZnVuY3Rpb25cIilcbiAgICAgIC8vIG5vdGUgdGhhdCB0eXBlb2YoL3gvKSA9PT0gXCJmdW5jdGlvblwiXG4gICAgICByZXR1cm4gMTM7XG4gICAgaWYgKHYgaW5zdGFuY2VvZiBEYXRlKVxuICAgICAgcmV0dXJuIDk7XG4gICAgaWYgKEVKU09OLmlzQmluYXJ5KHYpKVxuICAgICAgcmV0dXJuIDU7XG4gICAgaWYgKHYgaW5zdGFuY2VvZiBNZXRlb3IuQ29sbGVjdGlvbi5PYmplY3RJRClcbiAgICAgIHJldHVybiA3O1xuICAgIHJldHVybiAzOyAvLyBvYmplY3RcblxuICAgIC8vIFhYWCBzdXBwb3J0IHNvbWUvYWxsIG9mIHRoZXNlOlxuICAgIC8vIDE0LCBzeW1ib2xcbiAgICAvLyAxNSwgamF2YXNjcmlwdCBjb2RlIHdpdGggc2NvcGVcbiAgICAvLyAxNiwgMTg6IDMyLWJpdC82NC1iaXQgaW50ZWdlclxuICAgIC8vIDE3LCB0aW1lc3RhbXBcbiAgICAvLyAyNTUsIG1pbmtleVxuICAgIC8vIDEyNywgbWF4a2V5XG4gIH0sXG5cbiAgLy8gZGVlcCBlcXVhbGl0eSB0ZXN0OiB1c2UgZm9yIGxpdGVyYWwgZG9jdW1lbnQgYW5kIGFycmF5IG1hdGNoZXNcbiAgX2VxdWFsOiBmdW5jdGlvbiAoYSwgYikge1xuICAgIHJldHVybiBFSlNPTi5lcXVhbHMoYSwgYiwge2tleU9yZGVyU2Vuc2l0aXZlOiB0cnVlfSk7XG4gIH0sXG5cbiAgLy8gbWFwcyBhIHR5cGUgY29kZSB0byBhIHZhbHVlIHRoYXQgY2FuIGJlIHVzZWQgdG8gc29ydCB2YWx1ZXMgb2ZcbiAgLy8gZGlmZmVyZW50IHR5cGVzXG4gIF90eXBlb3JkZXI6IGZ1bmN0aW9uICh0KSB7XG4gICAgLy8gaHR0cDovL3d3dy5tb25nb2RiLm9yZy9kaXNwbGF5L0RPQ1MvV2hhdCtpcyt0aGUrQ29tcGFyZStPcmRlcitmb3IrQlNPTitUeXBlc1xuICAgIC8vIFhYWCB3aGF0IGlzIHRoZSBjb3JyZWN0IHNvcnQgcG9zaXRpb24gZm9yIEphdmFzY3JpcHQgY29kZT9cbiAgICAvLyAoJzEwMCcgaW4gdGhlIG1hdHJpeCBiZWxvdylcbiAgICAvLyBYWFggbWlua2V5L21heGtleVxuICAgIHJldHVybiBbLTEsICAvLyAobm90IGEgdHlwZSlcbiAgICAgICAgICAgIDEsICAgLy8gbnVtYmVyXG4gICAgICAgICAgICAyLCAgIC8vIHN0cmluZ1xuICAgICAgICAgICAgMywgICAvLyBvYmplY3RcbiAgICAgICAgICAgIDQsICAgLy8gYXJyYXlcbiAgICAgICAgICAgIDUsICAgLy8gYmluYXJ5XG4gICAgICAgICAgICAtMSwgIC8vIGRlcHJlY2F0ZWRcbiAgICAgICAgICAgIDYsICAgLy8gT2JqZWN0SURcbiAgICAgICAgICAgIDcsICAgLy8gYm9vbFxuICAgICAgICAgICAgOCwgICAvLyBEYXRlXG4gICAgICAgICAgICAwLCAgIC8vIG51bGxcbiAgICAgICAgICAgIDksICAgLy8gUmVnRXhwXG4gICAgICAgICAgICAtMSwgIC8vIGRlcHJlY2F0ZWRcbiAgICAgICAgICAgIDEwMCwgLy8gSlMgY29kZVxuICAgICAgICAgICAgMiwgICAvLyBkZXByZWNhdGVkIChzeW1ib2wpXG4gICAgICAgICAgICAxMDAsIC8vIEpTIGNvZGVcbiAgICAgICAgICAgIDEsICAgLy8gMzItYml0IGludFxuICAgICAgICAgICAgOCwgICAvLyBNb25nbyB0aW1lc3RhbXBcbiAgICAgICAgICAgIDEgICAgLy8gNjQtYml0IGludFxuICAgICAgICAgICBdW3RdO1xuICB9LFxuXG4gIC8vIGNvbXBhcmUgdHdvIHZhbHVlcyBvZiB1bmtub3duIHR5cGUgYWNjb3JkaW5nIHRvIEJTT04gb3JkZXJpbmdcbiAgLy8gc2VtYW50aWNzLiAoYXMgYW4gZXh0ZW5zaW9uLCBjb25zaWRlciAndW5kZWZpbmVkJyB0byBiZSBsZXNzIHRoYW5cbiAgLy8gYW55IG90aGVyIHZhbHVlLikgcmV0dXJuIG5lZ2F0aXZlIGlmIGEgaXMgbGVzcywgcG9zaXRpdmUgaWYgYiBpc1xuICAvLyBsZXNzLCBvciAwIGlmIGVxdWFsXG4gIF9jbXA6IGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgaWYgKGEgPT09IHVuZGVmaW5lZClcbiAgICAgIHJldHVybiBiID09PSB1bmRlZmluZWQgPyAwIDogLTE7XG4gICAgaWYgKGIgPT09IHVuZGVmaW5lZClcbiAgICAgIHJldHVybiAxO1xuICAgIHZhciB0YSA9IExvY2FsQ29sbGVjdGlvbi5fZi5fdHlwZShhKTtcbiAgICB2YXIgdGIgPSBMb2NhbENvbGxlY3Rpb24uX2YuX3R5cGUoYik7XG4gICAgdmFyIG9hID0gTG9jYWxDb2xsZWN0aW9uLl9mLl90eXBlb3JkZXIodGEpO1xuICAgIHZhciBvYiA9IExvY2FsQ29sbGVjdGlvbi5fZi5fdHlwZW9yZGVyKHRiKTtcbiAgICBpZiAob2EgIT09IG9iKVxuICAgICAgcmV0dXJuIG9hIDwgb2IgPyAtMSA6IDE7XG4gICAgaWYgKHRhICE9PSB0YilcbiAgICAgIC8vIFhYWCBuZWVkIHRvIGltcGxlbWVudCB0aGlzIGlmIHdlIGltcGxlbWVudCBTeW1ib2wgb3IgaW50ZWdlcnMsIG9yXG4gICAgICAvLyBUaW1lc3RhbXBcbiAgICAgIHRocm93IEVycm9yKFwiTWlzc2luZyB0eXBlIGNvZXJjaW9uIGxvZ2ljIGluIF9jbXBcIik7XG4gICAgaWYgKHRhID09PSA3KSB7IC8vIE9iamVjdElEXG4gICAgICAvLyBDb252ZXJ0IHRvIHN0cmluZy5cbiAgICAgIHRhID0gdGIgPSAyO1xuICAgICAgYSA9IGEudG9IZXhTdHJpbmcoKTtcbiAgICAgIGIgPSBiLnRvSGV4U3RyaW5nKCk7XG4gICAgfVxuICAgIGlmICh0YSA9PT0gOSkgeyAvLyBEYXRlXG4gICAgICAvLyBDb252ZXJ0IHRvIG1pbGxpcy5cbiAgICAgIHRhID0gdGIgPSAxO1xuICAgICAgYSA9IGEuZ2V0VGltZSgpO1xuICAgICAgYiA9IGIuZ2V0VGltZSgpO1xuICAgIH1cblxuICAgIGlmICh0YSA9PT0gMSkgLy8gZG91YmxlXG4gICAgICByZXR1cm4gYSAtIGI7XG4gICAgaWYgKHRiID09PSAyKSAvLyBzdHJpbmdcbiAgICAgIHJldHVybiBhIDwgYiA/IC0xIDogKGEgPT09IGIgPyAwIDogMSk7XG4gICAgaWYgKHRhID09PSAzKSB7IC8vIE9iamVjdFxuICAgICAgLy8gdGhpcyBjb3VsZCBiZSBtdWNoIG1vcmUgZWZmaWNpZW50IGluIHRoZSBleHBlY3RlZCBjYXNlIC4uLlxuICAgICAgdmFyIHRvX2FycmF5ID0gZnVuY3Rpb24gKG9iaikge1xuICAgICAgICB2YXIgcmV0ID0gW107XG4gICAgICAgIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICAgICAgICByZXQucHVzaChrZXkpO1xuICAgICAgICAgIHJldC5wdXNoKG9ialtrZXldKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgfTtcbiAgICAgIHJldHVybiBMb2NhbENvbGxlY3Rpb24uX2YuX2NtcCh0b19hcnJheShhKSwgdG9fYXJyYXkoYikpO1xuICAgIH1cbiAgICBpZiAodGEgPT09IDQpIHsgLy8gQXJyYXlcbiAgICAgIGZvciAodmFyIGkgPSAwOyA7IGkrKykge1xuICAgICAgICBpZiAoaSA9PT0gYS5sZW5ndGgpXG4gICAgICAgICAgcmV0dXJuIChpID09PSBiLmxlbmd0aCkgPyAwIDogLTE7XG4gICAgICAgIGlmIChpID09PSBiLmxlbmd0aClcbiAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgdmFyIHMgPSBMb2NhbENvbGxlY3Rpb24uX2YuX2NtcChhW2ldLCBiW2ldKTtcbiAgICAgICAgaWYgKHMgIT09IDApXG4gICAgICAgICAgcmV0dXJuIHM7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICh0YSA9PT0gNSkgeyAvLyBiaW5hcnlcbiAgICAgIC8vIFN1cnByaXNpbmdseSwgYSBzbWFsbCBiaW5hcnkgYmxvYiBpcyBhbHdheXMgbGVzcyB0aGFuIGEgbGFyZ2Ugb25lIGluXG4gICAgICAvLyBNb25nby5cbiAgICAgIGlmIChhLmxlbmd0aCAhPT0gYi5sZW5ndGgpXG4gICAgICAgIHJldHVybiBhLmxlbmd0aCAtIGIubGVuZ3RoO1xuICAgICAgZm9yIChpID0gMDsgaSA8IGEubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGFbaV0gPCBiW2ldKVxuICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgaWYgKGFbaV0gPiBiW2ldKVxuICAgICAgICAgIHJldHVybiAxO1xuICAgICAgfVxuICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICAgIGlmICh0YSA9PT0gOCkgeyAvLyBib29sZWFuXG4gICAgICBpZiAoYSkgcmV0dXJuIGIgPyAwIDogMTtcbiAgICAgIHJldHVybiBiID8gLTEgOiAwO1xuICAgIH1cbiAgICBpZiAodGEgPT09IDEwKSAvLyBudWxsXG4gICAgICByZXR1cm4gMDtcbiAgICBpZiAodGEgPT09IDExKSAvLyByZWdleHBcbiAgICAgIHRocm93IEVycm9yKFwiU29ydGluZyBub3Qgc3VwcG9ydGVkIG9uIHJlZ3VsYXIgZXhwcmVzc2lvblwiKTsgLy8gWFhYXG4gICAgLy8gMTM6IGphdmFzY3JpcHQgY29kZVxuICAgIC8vIDE0OiBzeW1ib2xcbiAgICAvLyAxNTogamF2YXNjcmlwdCBjb2RlIHdpdGggc2NvcGVcbiAgICAvLyAxNjogMzItYml0IGludGVnZXJcbiAgICAvLyAxNzogdGltZXN0YW1wXG4gICAgLy8gMTg6IDY0LWJpdCBpbnRlZ2VyXG4gICAgLy8gMjU1OiBtaW5rZXlcbiAgICAvLyAxMjc6IG1heGtleVxuICAgIGlmICh0YSA9PT0gMTMpIC8vIGphdmFzY3JpcHQgY29kZVxuICAgICAgdGhyb3cgRXJyb3IoXCJTb3J0aW5nIG5vdCBzdXBwb3J0ZWQgb24gSmF2YXNjcmlwdCBjb2RlXCIpOyAvLyBYWFhcbiAgICB0aHJvdyBFcnJvcihcIlVua25vd24gdHlwZSB0byBzb3J0XCIpO1xuICB9XG59O1xuXG4vLyBGb3IgdW5pdCB0ZXN0cy4gVHJ1ZSBpZiB0aGUgZ2l2ZW4gZG9jdW1lbnQgbWF0Y2hlcyB0aGUgZ2l2ZW5cbi8vIHNlbGVjdG9yLlxuTG9jYWxDb2xsZWN0aW9uLl9tYXRjaGVzID0gZnVuY3Rpb24gKHNlbGVjdG9yLCBkb2MpIHtcbiAgcmV0dXJuIChMb2NhbENvbGxlY3Rpb24uX2NvbXBpbGVTZWxlY3RvcihzZWxlY3RvcikpKGRvYyk7XG59O1xuXG4vLyBfbWFrZUxvb2t1cEZ1bmN0aW9uKGtleSkgcmV0dXJucyBhIGxvb2t1cCBmdW5jdGlvbi5cbi8vXG4vLyBBIGxvb2t1cCBmdW5jdGlvbiB0YWtlcyBpbiBhIGRvY3VtZW50IGFuZCByZXR1cm5zIGFuIGFycmF5IG9mIG1hdGNoaW5nXG4vLyB2YWx1ZXMuICBUaGlzIGFycmF5IGhhcyBtb3JlIHRoYW4gb25lIGVsZW1lbnQgaWYgYW55IHNlZ21lbnQgb2YgdGhlIGtleSBvdGhlclxuLy8gdGhhbiB0aGUgbGFzdCBvbmUgaXMgYW4gYXJyYXkuICBpZSwgYW55IGFycmF5cyBmb3VuZCB3aGVuIGRvaW5nIG5vbi1maW5hbFxuLy8gbG9va3VwcyByZXN1bHQgaW4gdGhpcyBmdW5jdGlvbiBcImJyYW5jaGluZ1wiOyBlYWNoIGVsZW1lbnQgaW4gdGhlIHJldHVybmVkXG4vLyBhcnJheSByZXByZXNlbnRzIHRoZSB2YWx1ZSBmb3VuZCBhdCB0aGlzIGJyYW5jaC4gSWYgYW55IGJyYW5jaCBkb2Vzbid0IGhhdmUgYVxuLy8gZmluYWwgdmFsdWUgZm9yIHRoZSBmdWxsIGtleSwgaXRzIGVsZW1lbnQgaW4gdGhlIHJldHVybmVkIGxpc3Qgd2lsbCBiZVxuLy8gdW5kZWZpbmVkLiBJdCBhbHdheXMgcmV0dXJucyBhIG5vbi1lbXB0eSBhcnJheS5cbi8vXG4vLyBfbWFrZUxvb2t1cEZ1bmN0aW9uKCdhLngnKSh7YToge3g6IDF9fSkgcmV0dXJucyBbMV1cbi8vIF9tYWtlTG9va3VwRnVuY3Rpb24oJ2EueCcpKHthOiB7eDogWzFdfX0pIHJldHVybnMgW1sxXV1cbi8vIF9tYWtlTG9va3VwRnVuY3Rpb24oJ2EueCcpKHthOiA1fSkgIHJldHVybnMgW3VuZGVmaW5lZF1cbi8vIF9tYWtlTG9va3VwRnVuY3Rpb24oJ2EueCcpKHthOiBbe3g6IDF9LFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7eDogWzJdfSxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3k6IDN9XX0pXG4vLyAgIHJldHVybnMgWzEsIFsyXSwgdW5kZWZpbmVkXVxuTG9jYWxDb2xsZWN0aW9uLl9tYWtlTG9va3VwRnVuY3Rpb24gPSBmdW5jdGlvbiAoa2V5KSB7XG4gIHZhciBkb3RMb2NhdGlvbiA9IGtleS5pbmRleE9mKCcuJyk7XG4gIHZhciBmaXJzdCwgbG9va3VwUmVzdCwgbmV4dElzTnVtZXJpYztcbiAgaWYgKGRvdExvY2F0aW9uID09PSAtMSkge1xuICAgIGZpcnN0ID0ga2V5O1xuICB9IGVsc2Uge1xuICAgIGZpcnN0ID0ga2V5LnN1YnN0cigwLCBkb3RMb2NhdGlvbik7XG4gICAgdmFyIHJlc3QgPSBrZXkuc3Vic3RyKGRvdExvY2F0aW9uICsgMSk7XG4gICAgbG9va3VwUmVzdCA9IExvY2FsQ29sbGVjdGlvbi5fbWFrZUxvb2t1cEZ1bmN0aW9uKHJlc3QpO1xuICAgIC8vIElzIHRoZSBuZXh0IChwZXJoYXBzIGZpbmFsKSBwaWVjZSBudW1lcmljIChpZSwgYW4gYXJyYXkgbG9va3VwPylcbiAgICBuZXh0SXNOdW1lcmljID0gL15cXGQrKFxcLnwkKS8udGVzdChyZXN0KTtcbiAgfVxuXG4gIHJldHVybiBmdW5jdGlvbiAoZG9jKSB7XG4gICAgaWYgKGRvYyA9PSBudWxsKSAgLy8gbnVsbCBvciB1bmRlZmluZWRcbiAgICAgIHJldHVybiBbdW5kZWZpbmVkXTtcbiAgICB2YXIgZmlyc3RMZXZlbCA9IGRvY1tmaXJzdF07XG5cbiAgICAvLyBXZSBkb24ndCBcImJyYW5jaFwiIGF0IHRoZSBmaW5hbCBsZXZlbC5cbiAgICBpZiAoIWxvb2t1cFJlc3QpXG4gICAgICByZXR1cm4gW2ZpcnN0TGV2ZWxdO1xuXG4gICAgLy8gSXQncyBhbiBlbXB0eSBhcnJheSwgYW5kIHdlJ3JlIG5vdCBkb25lOiB3ZSB3b24ndCBmaW5kIGFueXRoaW5nLlxuICAgIGlmIChpc0FycmF5KGZpcnN0TGV2ZWwpICYmIGZpcnN0TGV2ZWwubGVuZ3RoID09PSAwKVxuICAgICAgcmV0dXJuIFt1bmRlZmluZWRdO1xuXG4gICAgLy8gRm9yIGVhY2ggcmVzdWx0IGF0IHRoaXMgbGV2ZWwsIGZpbmlzaCB0aGUgbG9va3VwIG9uIHRoZSByZXN0IG9mIHRoZSBrZXksXG4gICAgLy8gYW5kIHJldHVybiBldmVyeXRoaW5nIHdlIGZpbmQuIEFsc28sIGlmIHRoZSBuZXh0IHJlc3VsdCBpcyBhIG51bWJlcixcbiAgICAvLyBkb24ndCBicmFuY2ggaGVyZS5cbiAgICAvL1xuICAgIC8vIFRlY2huaWNhbGx5LCBpbiBNb25nb0RCLCB3ZSBzaG91bGQgYmUgYWJsZSB0byBoYW5kbGUgdGhlIGNhc2Ugd2hlcmVcbiAgICAvLyBvYmplY3RzIGhhdmUgbnVtZXJpYyBrZXlzLCBidXQgTW9uZ28gZG9lc24ndCBhY3R1YWxseSBoYW5kbGUgdGhpc1xuICAgIC8vIGNvbnNpc3RlbnRseSB5ZXQgaXRzZWxmLCBzZWUgZWdcbiAgICAvLyBodHRwczovL2ppcmEubW9uZ29kYi5vcmcvYnJvd3NlL1NFUlZFUi0yODk4XG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL21vbmdvZGIvbW9uZ28vYmxvYi9tYXN0ZXIvanN0ZXN0cy9hcnJheV9tYXRjaDIuanNcbiAgICBpZiAoIWlzQXJyYXkoZmlyc3RMZXZlbCkgfHwgbmV4dElzTnVtZXJpYylcbiAgICAgIGZpcnN0TGV2ZWwgPSBbZmlyc3RMZXZlbF07XG4gICAgcmV0dXJuIEFycmF5LnByb3RvdHlwZS5jb25jYXQuYXBwbHkoW10sIF8ubWFwKGZpcnN0TGV2ZWwsIGxvb2t1cFJlc3QpKTtcbiAgfTtcbn07XG5cbi8vIFRoZSBtYWluIGNvbXBpbGF0aW9uIGZ1bmN0aW9uIGZvciBhIGdpdmVuIHNlbGVjdG9yLlxudmFyIGNvbXBpbGVEb2N1bWVudFNlbGVjdG9yID0gZnVuY3Rpb24gKGRvY1NlbGVjdG9yKSB7XG4gIHZhciBwZXJLZXlTZWxlY3RvcnMgPSBbXTtcbiAgXy5lYWNoKGRvY1NlbGVjdG9yLCBmdW5jdGlvbiAoc3ViU2VsZWN0b3IsIGtleSkge1xuICAgIGlmIChrZXkuc3Vic3RyKDAsIDEpID09PSAnJCcpIHtcbiAgICAgIC8vIE91dGVyIG9wZXJhdG9ycyBhcmUgZWl0aGVyIGxvZ2ljYWwgb3BlcmF0b3JzICh0aGV5IHJlY3Vyc2UgYmFjayBpbnRvXG4gICAgICAvLyB0aGlzIGZ1bmN0aW9uKSwgb3IgJHdoZXJlLlxuICAgICAgaWYgKCFfLmhhcyhMT0dJQ0FMX09QRVJBVE9SUywga2V5KSlcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5yZWNvZ25pemVkIGxvZ2ljYWwgb3BlcmF0b3I6IFwiICsga2V5KTtcbiAgICAgIHBlcktleVNlbGVjdG9ycy5wdXNoKExPR0lDQUxfT1BFUkFUT1JTW2tleV0oc3ViU2VsZWN0b3IpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGxvb2tVcEJ5SW5kZXggPSBMb2NhbENvbGxlY3Rpb24uX21ha2VMb29rdXBGdW5jdGlvbihrZXkpO1xuICAgICAgdmFyIHZhbHVlU2VsZWN0b3JGdW5jID0gY29tcGlsZVZhbHVlU2VsZWN0b3Ioc3ViU2VsZWN0b3IpO1xuICAgICAgcGVyS2V5U2VsZWN0b3JzLnB1c2goZnVuY3Rpb24gKGRvYykge1xuICAgICAgICB2YXIgYnJhbmNoVmFsdWVzID0gbG9va1VwQnlJbmRleChkb2MpO1xuICAgICAgICAvLyBXZSBhcHBseSB0aGUgc2VsZWN0b3IgdG8gZWFjaCBcImJyYW5jaGVkXCIgdmFsdWUgYW5kIHJldHVybiB0cnVlIGlmIGFueVxuICAgICAgICAvLyBtYXRjaC4gVGhpcyBpc24ndCAxMDAlIGNvbnNpc3RlbnQgd2l0aCBNb25nb0RCOyBlZywgc2VlOlxuICAgICAgICAvLyBodHRwczovL2ppcmEubW9uZ29kYi5vcmcvYnJvd3NlL1NFUlZFUi04NTg1XG4gICAgICAgIHJldHVybiBfLmFueShicmFuY2hWYWx1ZXMsIHZhbHVlU2VsZWN0b3JGdW5jKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfSk7XG5cblxuICByZXR1cm4gZnVuY3Rpb24gKGRvYykge1xuICAgIHJldHVybiBfLmFsbChwZXJLZXlTZWxlY3RvcnMsIGZ1bmN0aW9uIChmKSB7XG4gICAgICByZXR1cm4gZihkb2MpO1xuICAgIH0pO1xuICB9O1xufTtcblxuLy8gR2l2ZW4gYSBzZWxlY3RvciwgcmV0dXJuIGEgZnVuY3Rpb24gdGhhdCB0YWtlcyBvbmUgYXJndW1lbnQsIGFcbi8vIGRvY3VtZW50LCBhbmQgcmV0dXJucyB0cnVlIGlmIHRoZSBkb2N1bWVudCBtYXRjaGVzIHRoZSBzZWxlY3Rvcixcbi8vIGVsc2UgZmFsc2UuXG5Mb2NhbENvbGxlY3Rpb24uX2NvbXBpbGVTZWxlY3RvciA9IGZ1bmN0aW9uIChzZWxlY3Rvcikge1xuICAvLyB5b3UgY2FuIHBhc3MgYSBsaXRlcmFsIGZ1bmN0aW9uIGluc3RlYWQgb2YgYSBzZWxlY3RvclxuICBpZiAoc2VsZWN0b3IgaW5zdGFuY2VvZiBGdW5jdGlvbilcbiAgICByZXR1cm4gZnVuY3Rpb24gKGRvYykge3JldHVybiBzZWxlY3Rvci5jYWxsKGRvYyk7fTtcblxuICAvLyBzaG9ydGhhbmQgLS0gc2NhbGFycyBtYXRjaCBfaWRcbiAgaWYgKExvY2FsQ29sbGVjdGlvbi5fc2VsZWN0b3JJc0lkKHNlbGVjdG9yKSkge1xuICAgIHJldHVybiBmdW5jdGlvbiAoZG9jKSB7XG4gICAgICByZXR1cm4gRUpTT04uZXF1YWxzKGRvYy5faWQsIHNlbGVjdG9yKTtcbiAgICB9O1xuICB9XG5cbiAgLy8gcHJvdGVjdCBhZ2FpbnN0IGRhbmdlcm91cyBzZWxlY3RvcnMuICBmYWxzZXkgYW5kIHtfaWQ6IGZhbHNleX0gYXJlIGJvdGhcbiAgLy8gbGlrZWx5IHByb2dyYW1tZXIgZXJyb3IsIGFuZCBub3Qgd2hhdCB5b3Ugd2FudCwgcGFydGljdWxhcmx5IGZvclxuICAvLyBkZXN0cnVjdGl2ZSBvcGVyYXRpb25zLlxuICBpZiAoIXNlbGVjdG9yIHx8ICgoJ19pZCcgaW4gc2VsZWN0b3IpICYmICFzZWxlY3Rvci5faWQpKVxuICAgIHJldHVybiBmdW5jdGlvbiAoZG9jKSB7cmV0dXJuIGZhbHNlO307XG5cbiAgLy8gVG9wIGxldmVsIGNhbid0IGJlIGFuIGFycmF5IG9yIHRydWUgb3IgYmluYXJ5LlxuICBpZiAodHlwZW9mKHNlbGVjdG9yKSA9PT0gJ2Jvb2xlYW4nIHx8IGlzQXJyYXkoc2VsZWN0b3IpIHx8XG4gICAgICBFSlNPTi5pc0JpbmFyeShzZWxlY3RvcikpXG4gICAgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBzZWxlY3RvcjogXCIgKyBzZWxlY3Rvcik7XG5cbiAgcmV0dXJuIGNvbXBpbGVEb2N1bWVudFNlbGVjdG9yKHNlbGVjdG9yKTtcbn07XG5cbi8vIEdpdmUgYSBzb3J0IHNwZWMsIHdoaWNoIGNhbiBiZSBpbiBhbnkgb2YgdGhlc2UgZm9ybXM6XG4vLyAgIHtcImtleTFcIjogMSwgXCJrZXkyXCI6IC0xfVxuLy8gICBbW1wia2V5MVwiLCBcImFzY1wiXSwgW1wia2V5MlwiLCBcImRlc2NcIl1dXG4vLyAgIFtcImtleTFcIiwgW1wia2V5MlwiLCBcImRlc2NcIl1dXG4vL1xuLy8gKC4uIHdpdGggdGhlIGZpcnN0IGZvcm0gYmVpbmcgZGVwZW5kZW50IG9uIHRoZSBrZXkgZW51bWVyYXRpb25cbi8vIGJlaGF2aW9yIG9mIHlvdXIgamF2YXNjcmlwdCBWTSwgd2hpY2ggdXN1YWxseSBkb2VzIHdoYXQgeW91IG1lYW4gaW5cbi8vIHRoaXMgY2FzZSBpZiB0aGUga2V5IG5hbWVzIGRvbid0IGxvb2sgbGlrZSBpbnRlZ2VycyAuLilcbi8vXG4vLyByZXR1cm4gYSBmdW5jdGlvbiB0aGF0IHRha2VzIHR3byBvYmplY3RzLCBhbmQgcmV0dXJucyAtMSBpZiB0aGVcbi8vIGZpcnN0IG9iamVjdCBjb21lcyBmaXJzdCBpbiBvcmRlciwgMSBpZiB0aGUgc2Vjb25kIG9iamVjdCBjb21lc1xuLy8gZmlyc3QsIG9yIDAgaWYgbmVpdGhlciBvYmplY3QgY29tZXMgYmVmb3JlIHRoZSBvdGhlci5cblxuTG9jYWxDb2xsZWN0aW9uLl9jb21waWxlU29ydCA9IGZ1bmN0aW9uIChzcGVjKSB7XG4gIHZhciBzb3J0U3BlY1BhcnRzID0gW107XG5cbiAgaWYgKHNwZWMgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3BlYy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHR5cGVvZiBzcGVjW2ldID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIHNvcnRTcGVjUGFydHMucHVzaCh7XG4gICAgICAgICAgbG9va3VwOiBMb2NhbENvbGxlY3Rpb24uX21ha2VMb29rdXBGdW5jdGlvbihzcGVjW2ldKSxcbiAgICAgICAgICBhc2NlbmRpbmc6IHRydWVcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzb3J0U3BlY1BhcnRzLnB1c2goe1xuICAgICAgICAgIGxvb2t1cDogTG9jYWxDb2xsZWN0aW9uLl9tYWtlTG9va3VwRnVuY3Rpb24oc3BlY1tpXVswXSksXG4gICAgICAgICAgYXNjZW5kaW5nOiBzcGVjW2ldWzFdICE9PSBcImRlc2NcIlxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSBpZiAodHlwZW9mIHNwZWMgPT09IFwib2JqZWN0XCIpIHtcbiAgICBmb3IgKHZhciBrZXkgaW4gc3BlYykge1xuICAgICAgc29ydFNwZWNQYXJ0cy5wdXNoKHtcbiAgICAgICAgbG9va3VwOiBMb2NhbENvbGxlY3Rpb24uX21ha2VMb29rdXBGdW5jdGlvbihrZXkpLFxuICAgICAgICBhc2NlbmRpbmc6IHNwZWNba2V5XSA+PSAwXG4gICAgICB9KTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgRXJyb3IoXCJCYWQgc29ydCBzcGVjaWZpY2F0aW9uOiBcIiwgSlNPTi5zdHJpbmdpZnkoc3BlYykpO1xuICB9XG5cbiAgaWYgKHNvcnRTcGVjUGFydHMubGVuZ3RoID09PSAwKVxuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7cmV0dXJuIDA7fTtcblxuICAvLyByZWR1Y2VWYWx1ZSB0YWtlcyBpbiBhbGwgdGhlIHBvc3NpYmxlIHZhbHVlcyBmb3IgdGhlIHNvcnQga2V5IGFsb25nIHZhcmlvdXNcbiAgLy8gYnJhbmNoZXMsIGFuZCByZXR1cm5zIHRoZSBtaW4gb3IgbWF4IHZhbHVlIChhY2NvcmRpbmcgdG8gdGhlIGJvb2xcbiAgLy8gZmluZE1pbikuIEVhY2ggdmFsdWUgY2FuIGl0c2VsZiBiZSBhbiBhcnJheSwgYW5kIHdlIGxvb2sgYXQgaXRzIHZhbHVlc1xuICAvLyB0b28uIChpZSwgd2UgZG8gYSBzaW5nbGUgbGV2ZWwgb2YgZmxhdHRlbmluZyBvbiBicmFuY2hWYWx1ZXMsIHRoZW4gZmluZCB0aGVcbiAgLy8gbWluL21heC4pXG4gIHZhciByZWR1Y2VWYWx1ZSA9IGZ1bmN0aW9uIChicmFuY2hWYWx1ZXMsIGZpbmRNaW4pIHtcbiAgICB2YXIgcmVkdWNlZDtcbiAgICB2YXIgZmlyc3QgPSB0cnVlO1xuICAgIC8vIEl0ZXJhdGUgb3ZlciBhbGwgdGhlIHZhbHVlcyBmb3VuZCBpbiBhbGwgdGhlIGJyYW5jaGVzLCBhbmQgaWYgYSB2YWx1ZSBpc1xuICAgIC8vIGFuIGFycmF5IGl0c2VsZiwgaXRlcmF0ZSBvdmVyIHRoZSB2YWx1ZXMgaW4gdGhlIGFycmF5IHNlcGFyYXRlbHkuXG4gICAgXy5lYWNoKGJyYW5jaFZhbHVlcywgZnVuY3Rpb24gKGJyYW5jaFZhbHVlKSB7XG4gICAgICAvLyBWYWx1ZSBub3QgYW4gYXJyYXk/IFByZXRlbmQgaXQgaXMuXG4gICAgICBpZiAoIWlzQXJyYXkoYnJhbmNoVmFsdWUpKVxuICAgICAgICBicmFuY2hWYWx1ZSA9IFticmFuY2hWYWx1ZV07XG4gICAgICAvLyBWYWx1ZSBpcyBhbiBlbXB0eSBhcnJheT8gUHJldGVuZCBpdCB3YXMgbWlzc2luZywgc2luY2UgdGhhdCdzIHdoZXJlIGl0XG4gICAgICAvLyBzaG91bGQgYmUgc29ydGVkLlxuICAgICAgaWYgKGlzQXJyYXkoYnJhbmNoVmFsdWUpICYmIGJyYW5jaFZhbHVlLmxlbmd0aCA9PT0gMClcbiAgICAgICAgYnJhbmNoVmFsdWUgPSBbdW5kZWZpbmVkXTtcbiAgICAgIF8uZWFjaChicmFuY2hWYWx1ZSwgZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIC8vIFdlIHNob3VsZCBnZXQgaGVyZSBhdCBsZWFzdCBvbmNlOiBsb29rdXAgZnVuY3Rpb25zIHJldHVybiBub24tZW1wdHlcbiAgICAgICAgLy8gYXJyYXlzLCBzbyB0aGUgb3V0ZXIgbG9vcCBydW5zIGF0IGxlYXN0IG9uY2UsIGFuZCB3ZSBwcmV2ZW50ZWRcbiAgICAgICAgLy8gYnJhbmNoVmFsdWUgZnJvbSBiZWluZyBhbiBlbXB0eSBhcnJheS5cbiAgICAgICAgaWYgKGZpcnN0KSB7XG4gICAgICAgICAgcmVkdWNlZCA9IHZhbHVlO1xuICAgICAgICAgIGZpcnN0ID0gZmFsc2U7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gQ29tcGFyZSB0aGUgdmFsdWUgd2UgZm91bmQgdG8gdGhlIHZhbHVlIHdlIGZvdW5kIHNvIGZhciwgc2F2aW5nIGl0XG4gICAgICAgICAgLy8gaWYgaXQncyBsZXNzIChmb3IgYW4gYXNjZW5kaW5nIHNvcnQpIG9yIG1vcmUgKGZvciBhIGRlc2NlbmRpbmdcbiAgICAgICAgICAvLyBzb3J0KS5cbiAgICAgICAgICB2YXIgY21wID0gTG9jYWxDb2xsZWN0aW9uLl9mLl9jbXAocmVkdWNlZCwgdmFsdWUpO1xuICAgICAgICAgIGlmICgoZmluZE1pbiAmJiBjbXAgPiAwKSB8fCAoIWZpbmRNaW4gJiYgY21wIDwgMCkpXG4gICAgICAgICAgICByZWR1Y2VkID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIHJldHVybiByZWR1Y2VkO1xuICB9O1xuXG4gIHJldHVybiBmdW5jdGlvbiAoYSwgYikge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc29ydFNwZWNQYXJ0cy5sZW5ndGg7ICsraSkge1xuICAgICAgdmFyIHNwZWNQYXJ0ID0gc29ydFNwZWNQYXJ0c1tpXTtcbiAgICAgIHZhciBhVmFsdWUgPSByZWR1Y2VWYWx1ZShzcGVjUGFydC5sb29rdXAoYSksIHNwZWNQYXJ0LmFzY2VuZGluZyk7XG4gICAgICB2YXIgYlZhbHVlID0gcmVkdWNlVmFsdWUoc3BlY1BhcnQubG9va3VwKGIpLCBzcGVjUGFydC5hc2NlbmRpbmcpO1xuICAgICAgdmFyIGNvbXBhcmUgPSBMb2NhbENvbGxlY3Rpb24uX2YuX2NtcChhVmFsdWUsIGJWYWx1ZSk7XG4gICAgICBpZiAoY29tcGFyZSAhPT0gMClcbiAgICAgICAgcmV0dXJuIHNwZWNQYXJ0LmFzY2VuZGluZyA/IGNvbXBhcmUgOiAtY29tcGFyZTtcbiAgICB9O1xuICAgIHJldHVybiAwO1xuICB9O1xufTtcblxuZXhwb3J0cy5jb21waWxlRG9jdW1lbnRTZWxlY3RvciA9IGNvbXBpbGVEb2N1bWVudFNlbGVjdG9yO1xuZXhwb3J0cy5jb21waWxlU29ydCA9IExvY2FsQ29sbGVjdGlvbi5fY29tcGlsZVNvcnQ7IiwiZXhwb3J0cy5zZXFUb0NvZGUgPSAoc2VxKSAtPlxuICAjIEdldCBzdHJpbmcgb2Ygc2VxIG51bWJlclxuICBzdHIgPSBcIlwiICsgc2VxXG5cbiAgc3VtID0gMFxuICBmb3IgaSBpbiBbMC4uLnN0ci5sZW5ndGhdXG4gICAgZGlnaXQgPSBwYXJzZUludChzdHJbc3RyLmxlbmd0aC0xLWldKVxuICAgIGlmIGklMyA9PSAwXG4gICAgICBzdW0gKz0gNyAqIGRpZ2l0XG4gICAgaWYgaSUzID09IDFcbiAgICAgIHN1bSArPSAzICogZGlnaXRcbiAgICBpZiBpJTMgPT0gMlxuICAgICAgc3VtICs9ICBkaWdpdFxuICByZXR1cm4gc3RyICsgKHN1bSAlIDEwKVxuXG5leHBvcnRzLmlzVmFsaWQgPSAoY29kZSkgLT5cbiAgc2VxID0gcGFyc2VJbnQoY29kZS5zdWJzdHJpbmcoMCwgY29kZS5sZW5ndGggLSAxKSlcblxuICByZXR1cm4gZXhwb3J0cy5zZXFUb0NvZGUoc2VxKSA9PSBjb2RlIiwiIyBVdGlsaXRpZXMgZm9yIGRiIGhhbmRsaW5nXG5cbmNvbXBpbGVEb2N1bWVudFNlbGVjdG9yID0gcmVxdWlyZSgnLi9zZWxlY3RvcicpLmNvbXBpbGVEb2N1bWVudFNlbGVjdG9yXG5jb21waWxlU29ydCA9IHJlcXVpcmUoJy4vc2VsZWN0b3InKS5jb21waWxlU29ydFxuR2VvSlNPTiA9IHJlcXVpcmUgJy4uL0dlb0pTT04nXG5cblxuZXhwb3J0cy5wcm9jZXNzRmluZCA9IChpdGVtcywgc2VsZWN0b3IsIG9wdGlvbnMpIC0+XG4gIGZpbHRlcmVkID0gXy5maWx0ZXIoXy52YWx1ZXMoaXRlbXMpLCBjb21waWxlRG9jdW1lbnRTZWxlY3RvcihzZWxlY3RvcikpXG5cbiAgIyBIYW5kbGUgZ2Vvc3BhdGlhbCBvcGVyYXRvcnNcbiAgZmlsdGVyZWQgPSBwcm9jZXNzTmVhck9wZXJhdG9yKHNlbGVjdG9yLCBmaWx0ZXJlZClcbiAgZmlsdGVyZWQgPSBwcm9jZXNzR2VvSW50ZXJzZWN0c09wZXJhdG9yKHNlbGVjdG9yLCBmaWx0ZXJlZClcblxuICBpZiBvcHRpb25zIGFuZCBvcHRpb25zLnNvcnQgXG4gICAgZmlsdGVyZWQuc29ydChjb21waWxlU29ydChvcHRpb25zLnNvcnQpKVxuXG4gIGlmIG9wdGlvbnMgYW5kIG9wdGlvbnMubGltaXRcbiAgICBmaWx0ZXJlZCA9IF8uZmlyc3QgZmlsdGVyZWQsIG9wdGlvbnMubGltaXRcblxuICAjIENsb25lIHRvIHByZXZlbnQgYWNjaWRlbnRhbCB1cGRhdGVzLCBvciBhcHBseSBmaWVsZHMgaWYgcHJlc2VudFxuICBpZiBvcHRpb25zIGFuZCBvcHRpb25zLmZpZWxkc1xuICAgIGlmIF8uZmlyc3QoXy52YWx1ZXMob3B0aW9ucy5maWVsZHMpKSA9PSAxXG4gICAgICAjIEluY2x1ZGUgZmllbGRzXG4gICAgICBmaWx0ZXJlZCA9IF8ubWFwIGZpbHRlcmVkLCAoZG9jKSAtPiBfLnBpY2soZG9jLCBfLmtleXMob3B0aW9ucy5maWVsZHMpLmNvbmNhdChbXCJfaWRcIl0pKVxuICAgIGVsc2VcbiAgICAgICMgRXhjbHVkZSBmaWVsZHNcbiAgICAgIGZpbHRlcmVkID0gXy5tYXAgZmlsdGVyZWQsIChkb2MpIC0+IF8ub21pdChkb2MsIF8ua2V5cyhvcHRpb25zLmZpZWxkcykpXG4gIGVsc2VcbiAgICBmaWx0ZXJlZCA9IF8ubWFwIGZpbHRlcmVkLCAoZG9jKSAtPiBfLmNsb25lRGVlcChkb2MpXG5cbiAgcmV0dXJuIGZpbHRlcmVkXG5cbmV4cG9ydHMuY3JlYXRlVWlkID0gLT4gXG4gICd4eHh4eHh4eHh4eHg0eHh4eXh4eHh4eHh4eHh4eHh4eCcucmVwbGFjZSgvW3h5XS9nLCAoYykgLT5cbiAgICByID0gTWF0aC5yYW5kb20oKSoxNnwwXG4gICAgdiA9IGlmIGMgPT0gJ3gnIHRoZW4gciBlbHNlIChyJjB4M3wweDgpXG4gICAgcmV0dXJuIHYudG9TdHJpbmcoMTYpXG4gICApXG5cbnByb2Nlc3NOZWFyT3BlcmF0b3IgPSAoc2VsZWN0b3IsIGxpc3QpIC0+XG4gIGZvciBrZXksIHZhbHVlIG9mIHNlbGVjdG9yXG4gICAgaWYgdmFsdWU/IGFuZCB2YWx1ZVsnJG5lYXInXVxuICAgICAgZ2VvID0gdmFsdWVbJyRuZWFyJ11bJyRnZW9tZXRyeSddXG4gICAgICBpZiBnZW8udHlwZSAhPSAnUG9pbnQnXG4gICAgICAgIGJyZWFrXG5cbiAgICAgIG5lYXIgPSBuZXcgTC5MYXRMbmcoZ2VvLmNvb3JkaW5hdGVzWzFdLCBnZW8uY29vcmRpbmF0ZXNbMF0pXG5cbiAgICAgIGxpc3QgPSBfLmZpbHRlciBsaXN0LCAoZG9jKSAtPlxuICAgICAgICByZXR1cm4gZG9jW2tleV0gYW5kIGRvY1trZXldLnR5cGUgPT0gJ1BvaW50J1xuXG4gICAgICAjIEdldCBkaXN0YW5jZXNcbiAgICAgIGRpc3RhbmNlcyA9IF8ubWFwIGxpc3QsIChkb2MpIC0+XG4gICAgICAgIHJldHVybiB7IGRvYzogZG9jLCBkaXN0YW5jZTogXG4gICAgICAgICAgbmVhci5kaXN0YW5jZVRvKG5ldyBMLkxhdExuZyhkb2Nba2V5XS5jb29yZGluYXRlc1sxXSwgZG9jW2tleV0uY29vcmRpbmF0ZXNbMF0pKVxuICAgICAgICB9XG5cbiAgICAgICMgRmlsdGVyIG5vbi1wb2ludHNcbiAgICAgIGRpc3RhbmNlcyA9IF8uZmlsdGVyIGRpc3RhbmNlcywgKGl0ZW0pIC0+IGl0ZW0uZGlzdGFuY2UgPj0gMFxuXG4gICAgICAjIFNvcnQgYnkgZGlzdGFuY2VcbiAgICAgIGRpc3RhbmNlcyA9IF8uc29ydEJ5IGRpc3RhbmNlcywgJ2Rpc3RhbmNlJ1xuXG4gICAgICAjIEZpbHRlciBieSBtYXhEaXN0YW5jZVxuICAgICAgaWYgdmFsdWVbJyRuZWFyJ11bJyRtYXhEaXN0YW5jZSddXG4gICAgICAgIGRpc3RhbmNlcyA9IF8uZmlsdGVyIGRpc3RhbmNlcywgKGl0ZW0pIC0+IGl0ZW0uZGlzdGFuY2UgPD0gdmFsdWVbJyRuZWFyJ11bJyRtYXhEaXN0YW5jZSddXG5cbiAgICAgICMgTGltaXQgdG8gMTAwXG4gICAgICBkaXN0YW5jZXMgPSBfLmZpcnN0IGRpc3RhbmNlcywgMTAwXG5cbiAgICAgICMgRXh0cmFjdCBkb2NzXG4gICAgICBsaXN0ID0gXy5wbHVjayBkaXN0YW5jZXMsICdkb2MnXG4gIHJldHVybiBsaXN0XG5cbnByb2Nlc3NHZW9JbnRlcnNlY3RzT3BlcmF0b3IgPSAoc2VsZWN0b3IsIGxpc3QpIC0+XG4gIGZvciBrZXksIHZhbHVlIG9mIHNlbGVjdG9yXG4gICAgaWYgdmFsdWU/IGFuZCB2YWx1ZVsnJGdlb0ludGVyc2VjdHMnXVxuICAgICAgZ2VvID0gdmFsdWVbJyRnZW9JbnRlcnNlY3RzJ11bJyRnZW9tZXRyeSddXG4gICAgICBpZiBnZW8udHlwZSAhPSAnUG9seWdvbidcbiAgICAgICAgYnJlYWtcblxuICAgICAgIyBDaGVjayB3aXRoaW4gZm9yIGVhY2hcbiAgICAgIGxpc3QgPSBfLmZpbHRlciBsaXN0LCAoZG9jKSAtPlxuICAgICAgICAjIFJlamVjdCBub24tcG9pbnRzXG4gICAgICAgIGlmIG5vdCBkb2Nba2V5XSBvciBkb2Nba2V5XS50eXBlICE9ICdQb2ludCdcbiAgICAgICAgICByZXR1cm4gZmFsc2VcblxuICAgICAgICAjIENoZWNrIHBvbHlnb25cbiAgICAgICAgcmV0dXJuIEdlb0pTT04ucG9pbnRJblBvbHlnb24oZG9jW2tleV0sIGdlbylcblxuICByZXR1cm4gbGlzdFxuIiwiUGFnZSA9IHJlcXVpcmUoXCIuLi9QYWdlXCIpXG5Mb2NhdGlvbkZpbmRlciA9IHJlcXVpcmUgJy4uL0xvY2F0aW9uRmluZGVyJ1xuR2VvSlNPTiA9IHJlcXVpcmUgJy4uL0dlb0pTT04nXG5cbiMgVE9ETyBzb3VyY2Ugc2VhcmNoXG5cbiMgTGlzdHMgbmVhcmJ5IGFuZCB1bmxvY2F0ZWQgc291cmNlc1xuIyBPcHRpb25zOiBvblNlbGVjdCAtIGZ1bmN0aW9uIHRvIGNhbGwgd2l0aCBzb3VyY2UgZG9jIHdoZW4gc2VsZWN0ZWRcbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgU291cmNlTGlzdFBhZ2UgZXh0ZW5kcyBQYWdlXG4gIGV2ZW50czogXG4gICAgJ2NsaWNrIHRyLnRhcHBhYmxlJyA6ICdzb3VyY2VDbGlja2VkJ1xuICAgICdjbGljayAjc2VhcmNoX2NhbmNlbCcgOiAnY2FuY2VsU2VhcmNoJ1xuXG4gIGNyZWF0ZTogLT5cbiAgICBAc2V0VGl0bGUgJ05lYXJieSBTb3VyY2VzJ1xuXG4gIGFjdGl2YXRlOiAtPlxuICAgIEAkZWwuaHRtbCB0ZW1wbGF0ZXNbJ3BhZ2VzL1NvdXJjZUxpc3RQYWdlJ10oKVxuICAgIEBuZWFyU291cmNlcyA9IFtdXG4gICAgQHVubG9jYXRlZFNvdXJjZXMgPSBbXVxuXG4gICAgIyBGaW5kIGxvY2F0aW9uXG4gICAgQGxvY2F0aW9uRmluZGVyID0gbmV3IExvY2F0aW9uRmluZGVyKClcbiAgICBAbG9jYXRpb25GaW5kZXIub24oJ2ZvdW5kJywgQGxvY2F0aW9uRm91bmQpLm9uKCdlcnJvcicsIEBsb2NhdGlvbkVycm9yKVxuICAgIEBsb2NhdGlvbkZpbmRlci5nZXRMb2NhdGlvbigpXG4gICAgQCQoXCIjbG9jYXRpb25fbXNnXCIpLnNob3coKVxuXG4gICAgQHNldHVwQnV0dG9uQmFyIFtcbiAgICAgIHsgaWNvbjogXCJzZWFyY2gucG5nXCIsIGNsaWNrOiA9PiBAc2VhcmNoKCkgfVxuICAgICAgeyBpY29uOiBcInBsdXMucG5nXCIsIGNsaWNrOiA9PiBAYWRkU291cmNlKCkgfVxuICAgIF1cblxuICAgICMgUXVlcnkgZGF0YWJhc2UgZm9yIHVubG9jYXRlZCBzb3VyY2VzICMgVE9ETyBvbmx5IGJ5IHVzZXJcbiAgICBAZGIuc291cmNlcy5maW5kKGdlbzogeyRleGlzdHM6ZmFsc2V9KS5mZXRjaCAoc291cmNlcykgPT5cbiAgICAgIEB1bmxvY2F0ZWRTb3VyY2VzID0gc291cmNlc1xuICAgICAgQHJlbmRlckxpc3QoKVxuXG4gICAgQHBlcmZvcm1TZWFyY2goKVxuXG4gIGFkZFNvdXJjZTogLT5cbiAgICBAcGFnZXIub3BlblBhZ2UocmVxdWlyZShcIi4vTmV3U291cmNlUGFnZVwiKSlcbiAgICBcbiAgbG9jYXRpb25Gb3VuZDogKHBvcykgPT5cbiAgICBAJChcIiNsb2NhdGlvbl9tc2dcIikuaGlkZSgpXG4gICAgc2VsZWN0b3IgPSBnZW86IFxuICAgICAgJG5lYXI6IFxuICAgICAgICAkZ2VvbWV0cnk6IEdlb0pTT04ucG9zVG9Qb2ludChwb3MpXG5cbiAgICAjIFF1ZXJ5IGRhdGFiYXNlIGZvciBuZWFyIHNvdXJjZXNcbiAgICBAZGIuc291cmNlcy5maW5kKHNlbGVjdG9yKS5mZXRjaCAoc291cmNlcykgPT5cbiAgICAgIEBuZWFyU291cmNlcyA9IHNvdXJjZXNcbiAgICAgIEByZW5kZXJMaXN0KClcblxuICByZW5kZXJMaXN0OiAtPlxuICAgICMgQXBwZW5kIGxvY2F0ZWQgYW5kIHVubG9jYXRlZCBzb3VyY2VzXG4gICAgaWYgbm90IEBzZWFyY2hUZXh0XG4gICAgICBzb3VyY2VzID0gQHVubG9jYXRlZFNvdXJjZXMuY29uY2F0KEBuZWFyU291cmNlcylcbiAgICBlbHNlXG4gICAgICBzb3VyY2VzID0gQHNlYXJjaFNvdXJjZXNcblxuICAgIEAkKFwiI3RhYmxlXCIpLmh0bWwgdGVtcGxhdGVzWydwYWdlcy9Tb3VyY2VMaXN0UGFnZV9pdGVtcyddKHNvdXJjZXM6c291cmNlcylcblxuICBsb2NhdGlvbkVycm9yOiAocG9zKSA9PlxuICAgIEAkKFwiI2xvY2F0aW9uX21zZ1wiKS5oaWRlKClcbiAgICBAcGFnZXIuZmxhc2ggXCJVbmFibGUgdG8gZGV0ZXJtaW5lIGxvY2F0aW9uXCIsIFwiZXJyb3JcIlxuXG4gIHNvdXJjZUNsaWNrZWQ6IChldikgLT5cbiAgICAjIFdyYXAgb25TZWxlY3RcbiAgICBvblNlbGVjdCA9IHVuZGVmaW5lZFxuICAgIGlmIEBvcHRpb25zLm9uU2VsZWN0XG4gICAgICBvblNlbGVjdCA9IChzb3VyY2UpID0+XG4gICAgICAgIEBwYWdlci5jbG9zZVBhZ2UoKVxuICAgICAgICBAb3B0aW9ucy5vblNlbGVjdChzb3VyY2UpXG4gICAgQHBhZ2VyLm9wZW5QYWdlKHJlcXVpcmUoXCIuL1NvdXJjZVBhZ2VcIiksIHsgX2lkOiBldi5jdXJyZW50VGFyZ2V0LmlkLCBvblNlbGVjdDogb25TZWxlY3R9KVxuXG4gIHNlYXJjaDogLT5cbiAgICAjIFByb21wdCBmb3Igc2VhcmNoXG4gICAgQHNlYXJjaFRleHQgPSBwcm9tcHQoXCJFbnRlciBzZWFyY2ggdGV4dCBvciBJRCBvZiB3YXRlciBzb3VyY2VcIilcbiAgICBAcGVyZm9ybVNlYXJjaCgpXG5cbiAgcGVyZm9ybVNlYXJjaDogLT5cbiAgICBAJChcIiNzZWFyY2hfYmFyXCIpLnRvZ2dsZShAc2VhcmNoVGV4dCBhbmQgQHNlYXJjaFRleHQubGVuZ3RoPjApXG4gICAgQCQoXCIjc2VhcmNoX3RleHRcIikudGV4dChAc2VhcmNoVGV4dClcbiAgICBpZiBAc2VhcmNoVGV4dFxuICAgICAgIyBJZiBkaWdpdHMsIHNlYXJjaCBmb3IgY29kZVxuICAgICAgaWYgQHNlYXJjaFRleHQubWF0Y2goL15cXGQrJC8pXG4gICAgICAgIHNlbGVjdG9yID0geyBjb2RlOiBAc2VhcmNoVGV4dCB9XG4gICAgICBlbHNlXG4gICAgICAgIHNlbGVjdG9yID0geyBuYW1lOiBuZXcgUmVnRXhwKEBzZWFyY2hUZXh0LFwiaVwiKX1cbiAgICAgICAgXG4gICAgICBAZGIuc291cmNlcy5maW5kKHNlbGVjdG9yLCB7bGltaXQ6IDUwfSkuZmV0Y2ggKHNvdXJjZXMpID0+XG4gICAgICAgIEBzZWFyY2hTb3VyY2VzID0gc291cmNlc1xuICAgICAgICBAcmVuZGVyTGlzdCgpXG4gICAgZWxzZVxuICAgICAgQHJlbmRlckxpc3QoKVxuXG4gIGNhbmNlbFNlYXJjaDogLT5cbiAgICBAc2VhcmNoVGV4dCA9IFwiXCJcbiAgICBAcGVyZm9ybVNlYXJjaCgpXG5cbiIsIkVKU09OID0ge307IC8vIEdsb2JhbCFcbnZhciBjdXN0b21UeXBlcyA9IHt9O1xuLy8gQWRkIGEgY3VzdG9tIHR5cGUsIHVzaW5nIGEgbWV0aG9kIG9mIHlvdXIgY2hvaWNlIHRvIGdldCB0byBhbmRcbi8vIGZyb20gYSBiYXNpYyBKU09OLWFibGUgcmVwcmVzZW50YXRpb24uICBUaGUgZmFjdG9yeSBhcmd1bWVudFxuLy8gaXMgYSBmdW5jdGlvbiBvZiBKU09OLWFibGUgLS0+IHlvdXIgb2JqZWN0XG4vLyBUaGUgdHlwZSB5b3UgYWRkIG11c3QgaGF2ZTpcbi8vIC0gQSBjbG9uZSgpIG1ldGhvZCwgc28gdGhhdCBNZXRlb3IgY2FuIGRlZXAtY29weSBpdCB3aGVuIG5lY2Vzc2FyeS5cbi8vIC0gQSBlcXVhbHMoKSBtZXRob2QsIHNvIHRoYXQgTWV0ZW9yIGNhbiBjb21wYXJlIGl0XG4vLyAtIEEgdG9KU09OVmFsdWUoKSBtZXRob2QsIHNvIHRoYXQgTWV0ZW9yIGNhbiBzZXJpYWxpemUgaXRcbi8vIC0gYSB0eXBlTmFtZSgpIG1ldGhvZCwgdG8gc2hvdyBob3cgdG8gbG9vayBpdCB1cCBpbiBvdXIgdHlwZSB0YWJsZS5cbi8vIEl0IGlzIG9rYXkgaWYgdGhlc2UgbWV0aG9kcyBhcmUgbW9ua2V5LXBhdGNoZWQgb24uXG5FSlNPTi5hZGRUeXBlID0gZnVuY3Rpb24gKG5hbWUsIGZhY3RvcnkpIHtcbiAgaWYgKF8uaGFzKGN1c3RvbVR5cGVzLCBuYW1lKSlcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJUeXBlIFwiICsgbmFtZSArIFwiIGFscmVhZHkgcHJlc2VudFwiKTtcbiAgY3VzdG9tVHlwZXNbbmFtZV0gPSBmYWN0b3J5O1xufTtcblxudmFyIGJ1aWx0aW5Db252ZXJ0ZXJzID0gW1xuICB7IC8vIERhdGVcbiAgICBtYXRjaEpTT05WYWx1ZTogZnVuY3Rpb24gKG9iaikge1xuICAgICAgcmV0dXJuIF8uaGFzKG9iaiwgJyRkYXRlJykgJiYgXy5zaXplKG9iaikgPT09IDE7XG4gICAgfSxcbiAgICBtYXRjaE9iamVjdDogZnVuY3Rpb24gKG9iaikge1xuICAgICAgcmV0dXJuIG9iaiBpbnN0YW5jZW9mIERhdGU7XG4gICAgfSxcbiAgICB0b0pTT05WYWx1ZTogZnVuY3Rpb24gKG9iaikge1xuICAgICAgcmV0dXJuIHskZGF0ZTogb2JqLmdldFRpbWUoKX07XG4gICAgfSxcbiAgICBmcm9tSlNPTlZhbHVlOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICByZXR1cm4gbmV3IERhdGUob2JqLiRkYXRlKTtcbiAgICB9XG4gIH0sXG4gIHsgLy8gQmluYXJ5XG4gICAgbWF0Y2hKU09OVmFsdWU6IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgIHJldHVybiBfLmhhcyhvYmosICckYmluYXJ5JykgJiYgXy5zaXplKG9iaikgPT09IDE7XG4gICAgfSxcbiAgICBtYXRjaE9iamVjdDogZnVuY3Rpb24gKG9iaikge1xuICAgICAgcmV0dXJuIHR5cGVvZiBVaW50OEFycmF5ICE9PSAndW5kZWZpbmVkJyAmJiBvYmogaW5zdGFuY2VvZiBVaW50OEFycmF5XG4gICAgICAgIHx8IChvYmogJiYgXy5oYXMob2JqLCAnJFVpbnQ4QXJyYXlQb2x5ZmlsbCcpKTtcbiAgICB9LFxuICAgIHRvSlNPTlZhbHVlOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICByZXR1cm4geyRiaW5hcnk6IEVKU09OLl9iYXNlNjRFbmNvZGUob2JqKX07XG4gICAgfSxcbiAgICBmcm9tSlNPTlZhbHVlOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICByZXR1cm4gRUpTT04uX2Jhc2U2NERlY29kZShvYmouJGJpbmFyeSk7XG4gICAgfVxuICB9LFxuICB7IC8vIEVzY2FwaW5nIG9uZSBsZXZlbFxuICAgIG1hdGNoSlNPTlZhbHVlOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICByZXR1cm4gXy5oYXMob2JqLCAnJGVzY2FwZScpICYmIF8uc2l6ZShvYmopID09PSAxO1xuICAgIH0sXG4gICAgbWF0Y2hPYmplY3Q6IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgIGlmIChfLmlzRW1wdHkob2JqKSB8fCBfLnNpemUob2JqKSA+IDIpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIF8uYW55KGJ1aWx0aW5Db252ZXJ0ZXJzLCBmdW5jdGlvbiAoY29udmVydGVyKSB7XG4gICAgICAgIHJldHVybiBjb252ZXJ0ZXIubWF0Y2hKU09OVmFsdWUob2JqKTtcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgdG9KU09OVmFsdWU6IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgIHZhciBuZXdPYmogPSB7fTtcbiAgICAgIF8uZWFjaChvYmosIGZ1bmN0aW9uICh2YWx1ZSwga2V5KSB7XG4gICAgICAgIG5ld09ialtrZXldID0gRUpTT04udG9KU09OVmFsdWUodmFsdWUpO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4geyRlc2NhcGU6IG5ld09ian07XG4gICAgfSxcbiAgICBmcm9tSlNPTlZhbHVlOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICB2YXIgbmV3T2JqID0ge307XG4gICAgICBfLmVhY2gob2JqLiRlc2NhcGUsIGZ1bmN0aW9uICh2YWx1ZSwga2V5KSB7XG4gICAgICAgIG5ld09ialtrZXldID0gRUpTT04uZnJvbUpTT05WYWx1ZSh2YWx1ZSk7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBuZXdPYmo7XG4gICAgfVxuICB9LFxuICB7IC8vIEN1c3RvbVxuICAgIG1hdGNoSlNPTlZhbHVlOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICByZXR1cm4gXy5oYXMob2JqLCAnJHR5cGUnKSAmJiBfLmhhcyhvYmosICckdmFsdWUnKSAmJiBfLnNpemUob2JqKSA9PT0gMjtcbiAgICB9LFxuICAgIG1hdGNoT2JqZWN0OiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICByZXR1cm4gRUpTT04uX2lzQ3VzdG9tVHlwZShvYmopO1xuICAgIH0sXG4gICAgdG9KU09OVmFsdWU6IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgIHJldHVybiB7JHR5cGU6IG9iai50eXBlTmFtZSgpLCAkdmFsdWU6IG9iai50b0pTT05WYWx1ZSgpfTtcbiAgICB9LFxuICAgIGZyb21KU09OVmFsdWU6IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgIHZhciB0eXBlTmFtZSA9IG9iai4kdHlwZTtcbiAgICAgIHZhciBjb252ZXJ0ZXIgPSBjdXN0b21UeXBlc1t0eXBlTmFtZV07XG4gICAgICByZXR1cm4gY29udmVydGVyKG9iai4kdmFsdWUpO1xuICAgIH1cbiAgfVxuXTtcblxuRUpTT04uX2lzQ3VzdG9tVHlwZSA9IGZ1bmN0aW9uIChvYmopIHtcbiAgcmV0dXJuIG9iaiAmJlxuICAgIHR5cGVvZiBvYmoudG9KU09OVmFsdWUgPT09ICdmdW5jdGlvbicgJiZcbiAgICB0eXBlb2Ygb2JqLnR5cGVOYW1lID09PSAnZnVuY3Rpb24nICYmXG4gICAgXy5oYXMoY3VzdG9tVHlwZXMsIG9iai50eXBlTmFtZSgpKTtcbn07XG5cblxuLy9mb3IgYm90aCBhcnJheXMgYW5kIG9iamVjdHMsIGluLXBsYWNlIG1vZGlmaWNhdGlvbi5cbnZhciBhZGp1c3RUeXBlc1RvSlNPTlZhbHVlID1cbkVKU09OLl9hZGp1c3RUeXBlc1RvSlNPTlZhbHVlID0gZnVuY3Rpb24gKG9iaikge1xuICBpZiAob2JqID09PSBudWxsKVxuICAgIHJldHVybiBudWxsO1xuICB2YXIgbWF5YmVDaGFuZ2VkID0gdG9KU09OVmFsdWVIZWxwZXIob2JqKTtcbiAgaWYgKG1heWJlQ2hhbmdlZCAhPT0gdW5kZWZpbmVkKVxuICAgIHJldHVybiBtYXliZUNoYW5nZWQ7XG4gIF8uZWFjaChvYmosIGZ1bmN0aW9uICh2YWx1ZSwga2V5KSB7XG4gICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ29iamVjdCcgJiYgdmFsdWUgIT09IHVuZGVmaW5lZClcbiAgICAgIHJldHVybjsgLy8gY29udGludWVcbiAgICB2YXIgY2hhbmdlZCA9IHRvSlNPTlZhbHVlSGVscGVyKHZhbHVlKTtcbiAgICBpZiAoY2hhbmdlZCkge1xuICAgICAgb2JqW2tleV0gPSBjaGFuZ2VkO1xuICAgICAgcmV0dXJuOyAvLyBvbiB0byB0aGUgbmV4dCBrZXlcbiAgICB9XG4gICAgLy8gaWYgd2UgZ2V0IGhlcmUsIHZhbHVlIGlzIGFuIG9iamVjdCBidXQgbm90IGFkanVzdGFibGVcbiAgICAvLyBhdCB0aGlzIGxldmVsLiAgcmVjdXJzZS5cbiAgICBhZGp1c3RUeXBlc1RvSlNPTlZhbHVlKHZhbHVlKTtcbiAgfSk7XG4gIHJldHVybiBvYmo7XG59O1xuXG4vLyBFaXRoZXIgcmV0dXJuIHRoZSBKU09OLWNvbXBhdGlibGUgdmVyc2lvbiBvZiB0aGUgYXJndW1lbnQsIG9yIHVuZGVmaW5lZCAoaWZcbi8vIHRoZSBpdGVtIGlzbid0IGl0c2VsZiByZXBsYWNlYWJsZSwgYnV0IG1heWJlIHNvbWUgZmllbGRzIGluIGl0IGFyZSlcbnZhciB0b0pTT05WYWx1ZUhlbHBlciA9IGZ1bmN0aW9uIChpdGVtKSB7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYnVpbHRpbkNvbnZlcnRlcnMubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgY29udmVydGVyID0gYnVpbHRpbkNvbnZlcnRlcnNbaV07XG4gICAgaWYgKGNvbnZlcnRlci5tYXRjaE9iamVjdChpdGVtKSkge1xuICAgICAgcmV0dXJuIGNvbnZlcnRlci50b0pTT05WYWx1ZShpdGVtKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHVuZGVmaW5lZDtcbn07XG5cbkVKU09OLnRvSlNPTlZhbHVlID0gZnVuY3Rpb24gKGl0ZW0pIHtcbiAgdmFyIGNoYW5nZWQgPSB0b0pTT05WYWx1ZUhlbHBlcihpdGVtKTtcbiAgaWYgKGNoYW5nZWQgIT09IHVuZGVmaW5lZClcbiAgICByZXR1cm4gY2hhbmdlZDtcbiAgaWYgKHR5cGVvZiBpdGVtID09PSAnb2JqZWN0Jykge1xuICAgIGl0ZW0gPSBFSlNPTi5jbG9uZShpdGVtKTtcbiAgICBhZGp1c3RUeXBlc1RvSlNPTlZhbHVlKGl0ZW0pO1xuICB9XG4gIHJldHVybiBpdGVtO1xufTtcblxuLy9mb3IgYm90aCBhcnJheXMgYW5kIG9iamVjdHMuIFRyaWVzIGl0cyBiZXN0IHRvIGp1c3Rcbi8vIHVzZSB0aGUgb2JqZWN0IHlvdSBoYW5kIGl0LCBidXQgbWF5IHJldHVybiBzb21ldGhpbmdcbi8vIGRpZmZlcmVudCBpZiB0aGUgb2JqZWN0IHlvdSBoYW5kIGl0IGl0c2VsZiBuZWVkcyBjaGFuZ2luZy5cbnZhciBhZGp1c3RUeXBlc0Zyb21KU09OVmFsdWUgPVxuRUpTT04uX2FkanVzdFR5cGVzRnJvbUpTT05WYWx1ZSA9IGZ1bmN0aW9uIChvYmopIHtcbiAgaWYgKG9iaiA9PT0gbnVsbClcbiAgICByZXR1cm4gbnVsbDtcbiAgdmFyIG1heWJlQ2hhbmdlZCA9IGZyb21KU09OVmFsdWVIZWxwZXIob2JqKTtcbiAgaWYgKG1heWJlQ2hhbmdlZCAhPT0gb2JqKVxuICAgIHJldHVybiBtYXliZUNoYW5nZWQ7XG4gIF8uZWFjaChvYmosIGZ1bmN0aW9uICh2YWx1ZSwga2V5KSB7XG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgIHZhciBjaGFuZ2VkID0gZnJvbUpTT05WYWx1ZUhlbHBlcih2YWx1ZSk7XG4gICAgICBpZiAodmFsdWUgIT09IGNoYW5nZWQpIHtcbiAgICAgICAgb2JqW2tleV0gPSBjaGFuZ2VkO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICAvLyBpZiB3ZSBnZXQgaGVyZSwgdmFsdWUgaXMgYW4gb2JqZWN0IGJ1dCBub3QgYWRqdXN0YWJsZVxuICAgICAgLy8gYXQgdGhpcyBsZXZlbC4gIHJlY3Vyc2UuXG4gICAgICBhZGp1c3RUeXBlc0Zyb21KU09OVmFsdWUodmFsdWUpO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiBvYmo7XG59O1xuXG4vLyBFaXRoZXIgcmV0dXJuIHRoZSBhcmd1bWVudCBjaGFuZ2VkIHRvIGhhdmUgdGhlIG5vbi1qc29uXG4vLyByZXAgb2YgaXRzZWxmICh0aGUgT2JqZWN0IHZlcnNpb24pIG9yIHRoZSBhcmd1bWVudCBpdHNlbGYuXG5cbi8vIERPRVMgTk9UIFJFQ1VSU0UuICBGb3IgYWN0dWFsbHkgZ2V0dGluZyB0aGUgZnVsbHktY2hhbmdlZCB2YWx1ZSwgdXNlXG4vLyBFSlNPTi5mcm9tSlNPTlZhbHVlXG52YXIgZnJvbUpTT05WYWx1ZUhlbHBlciA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICBpZiAodHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiB2YWx1ZSAhPT0gbnVsbCkge1xuICAgIGlmIChfLnNpemUodmFsdWUpIDw9IDJcbiAgICAgICAgJiYgXy5hbGwodmFsdWUsIGZ1bmN0aW9uICh2LCBrKSB7XG4gICAgICAgICAgcmV0dXJuIHR5cGVvZiBrID09PSAnc3RyaW5nJyAmJiBrLnN1YnN0cigwLCAxKSA9PT0gJyQnO1xuICAgICAgICB9KSkge1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBidWlsdGluQ29udmVydGVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgY29udmVydGVyID0gYnVpbHRpbkNvbnZlcnRlcnNbaV07XG4gICAgICAgIGlmIChjb252ZXJ0ZXIubWF0Y2hKU09OVmFsdWUodmFsdWUpKSB7XG4gICAgICAgICAgcmV0dXJuIGNvbnZlcnRlci5mcm9tSlNPTlZhbHVlKHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gdmFsdWU7XG59O1xuXG5FSlNPTi5mcm9tSlNPTlZhbHVlID0gZnVuY3Rpb24gKGl0ZW0pIHtcbiAgdmFyIGNoYW5nZWQgPSBmcm9tSlNPTlZhbHVlSGVscGVyKGl0ZW0pO1xuICBpZiAoY2hhbmdlZCA9PT0gaXRlbSAmJiB0eXBlb2YgaXRlbSA9PT0gJ29iamVjdCcpIHtcbiAgICBpdGVtID0gRUpTT04uY2xvbmUoaXRlbSk7XG4gICAgYWRqdXN0VHlwZXNGcm9tSlNPTlZhbHVlKGl0ZW0pO1xuICAgIHJldHVybiBpdGVtO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBjaGFuZ2VkO1xuICB9XG59O1xuXG5FSlNPTi5zdHJpbmdpZnkgPSBmdW5jdGlvbiAoaXRlbSkge1xuICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoRUpTT04udG9KU09OVmFsdWUoaXRlbSkpO1xufTtcblxuRUpTT04ucGFyc2UgPSBmdW5jdGlvbiAoaXRlbSkge1xuICByZXR1cm4gRUpTT04uZnJvbUpTT05WYWx1ZShKU09OLnBhcnNlKGl0ZW0pKTtcbn07XG5cbkVKU09OLmlzQmluYXJ5ID0gZnVuY3Rpb24gKG9iaikge1xuICByZXR1cm4gKHR5cGVvZiBVaW50OEFycmF5ICE9PSAndW5kZWZpbmVkJyAmJiBvYmogaW5zdGFuY2VvZiBVaW50OEFycmF5KSB8fFxuICAgIChvYmogJiYgb2JqLiRVaW50OEFycmF5UG9seWZpbGwpO1xufTtcblxuRUpTT04uZXF1YWxzID0gZnVuY3Rpb24gKGEsIGIsIG9wdGlvbnMpIHtcbiAgdmFyIGk7XG4gIHZhciBrZXlPcmRlclNlbnNpdGl2ZSA9ICEhKG9wdGlvbnMgJiYgb3B0aW9ucy5rZXlPcmRlclNlbnNpdGl2ZSk7XG4gIGlmIChhID09PSBiKVxuICAgIHJldHVybiB0cnVlO1xuICBpZiAoIWEgfHwgIWIpIC8vIGlmIGVpdGhlciBvbmUgaXMgZmFsc3ksIHRoZXknZCBoYXZlIHRvIGJlID09PSB0byBiZSBlcXVhbFxuICAgIHJldHVybiBmYWxzZTtcbiAgaWYgKCEodHlwZW9mIGEgPT09ICdvYmplY3QnICYmIHR5cGVvZiBiID09PSAnb2JqZWN0JykpXG4gICAgcmV0dXJuIGZhbHNlO1xuICBpZiAoYSBpbnN0YW5jZW9mIERhdGUgJiYgYiBpbnN0YW5jZW9mIERhdGUpXG4gICAgcmV0dXJuIGEudmFsdWVPZigpID09PSBiLnZhbHVlT2YoKTtcbiAgaWYgKEVKU09OLmlzQmluYXJ5KGEpICYmIEVKU09OLmlzQmluYXJ5KGIpKSB7XG4gICAgaWYgKGEubGVuZ3RoICE9PSBiLmxlbmd0aClcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgYS5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKGFbaV0gIT09IGJbaV0pXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgaWYgKHR5cGVvZiAoYS5lcXVhbHMpID09PSAnZnVuY3Rpb24nKVxuICAgIHJldHVybiBhLmVxdWFscyhiLCBvcHRpb25zKTtcbiAgaWYgKGEgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgIGlmICghKGIgaW5zdGFuY2VvZiBBcnJheSkpXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgaWYgKGEubGVuZ3RoICE9PSBiLmxlbmd0aClcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgYS5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKCFFSlNPTi5lcXVhbHMoYVtpXSwgYltpXSwgb3B0aW9ucykpXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgLy8gZmFsbCBiYWNrIHRvIHN0cnVjdHVyYWwgZXF1YWxpdHkgb2Ygb2JqZWN0c1xuICB2YXIgcmV0O1xuICBpZiAoa2V5T3JkZXJTZW5zaXRpdmUpIHtcbiAgICB2YXIgYktleXMgPSBbXTtcbiAgICBfLmVhY2goYiwgZnVuY3Rpb24gKHZhbCwgeCkge1xuICAgICAgICBiS2V5cy5wdXNoKHgpO1xuICAgIH0pO1xuICAgIGkgPSAwO1xuICAgIHJldCA9IF8uYWxsKGEsIGZ1bmN0aW9uICh2YWwsIHgpIHtcbiAgICAgIGlmIChpID49IGJLZXlzLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBpZiAoeCAhPT0gYktleXNbaV0pIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgaWYgKCFFSlNPTi5lcXVhbHModmFsLCBiW2JLZXlzW2ldXSwgb3B0aW9ucykpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgaSsrO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSk7XG4gICAgcmV0dXJuIHJldCAmJiBpID09PSBiS2V5cy5sZW5ndGg7XG4gIH0gZWxzZSB7XG4gICAgaSA9IDA7XG4gICAgcmV0ID0gXy5hbGwoYSwgZnVuY3Rpb24gKHZhbCwga2V5KSB7XG4gICAgICBpZiAoIV8uaGFzKGIsIGtleSkpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgaWYgKCFFSlNPTi5lcXVhbHModmFsLCBiW2tleV0sIG9wdGlvbnMpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGkrKztcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0pO1xuICAgIHJldHVybiByZXQgJiYgXy5zaXplKGIpID09PSBpO1xuICB9XG59O1xuXG5FSlNPTi5jbG9uZSA9IGZ1bmN0aW9uICh2KSB7XG4gIHZhciByZXQ7XG4gIGlmICh0eXBlb2YgdiAhPT0gXCJvYmplY3RcIilcbiAgICByZXR1cm4gdjtcbiAgaWYgKHYgPT09IG51bGwpXG4gICAgcmV0dXJuIG51bGw7IC8vIG51bGwgaGFzIHR5cGVvZiBcIm9iamVjdFwiXG4gIGlmICh2IGluc3RhbmNlb2YgRGF0ZSlcbiAgICByZXR1cm4gbmV3IERhdGUodi5nZXRUaW1lKCkpO1xuICBpZiAoRUpTT04uaXNCaW5hcnkodikpIHtcbiAgICByZXQgPSBFSlNPTi5uZXdCaW5hcnkodi5sZW5ndGgpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdi5sZW5ndGg7IGkrKykge1xuICAgICAgcmV0W2ldID0gdltpXTtcbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbiAgfVxuICBpZiAoXy5pc0FycmF5KHYpIHx8IF8uaXNBcmd1bWVudHModikpIHtcbiAgICAvLyBGb3Igc29tZSByZWFzb24sIF8ubWFwIGRvZXNuJ3Qgd29yayBpbiB0aGlzIGNvbnRleHQgb24gT3BlcmEgKHdlaXJkIHRlc3RcbiAgICAvLyBmYWlsdXJlcykuXG4gICAgcmV0ID0gW107XG4gICAgZm9yIChpID0gMDsgaSA8IHYubGVuZ3RoOyBpKyspXG4gICAgICByZXRbaV0gPSBFSlNPTi5jbG9uZSh2W2ldKTtcbiAgICByZXR1cm4gcmV0O1xuICB9XG4gIC8vIGhhbmRsZSBnZW5lcmFsIHVzZXItZGVmaW5lZCB0eXBlZCBPYmplY3RzIGlmIHRoZXkgaGF2ZSBhIGNsb25lIG1ldGhvZFxuICBpZiAodHlwZW9mIHYuY2xvbmUgPT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gdi5jbG9uZSgpO1xuICB9XG4gIC8vIGhhbmRsZSBvdGhlciBvYmplY3RzXG4gIHJldCA9IHt9O1xuICBfLmVhY2godiwgZnVuY3Rpb24gKHZhbHVlLCBrZXkpIHtcbiAgICByZXRba2V5XSA9IEVKU09OLmNsb25lKHZhbHVlKTtcbiAgfSk7XG4gIHJldHVybiByZXQ7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEVKU09OOyIsIlBhZ2UgPSByZXF1aXJlICcuLi9QYWdlJ1xuZm9ybXMgPSByZXF1aXJlICcuLi9mb3JtcydcblNvdXJjZVBhZ2UgPSByZXF1aXJlIFwiLi9Tb3VyY2VQYWdlXCJcblxuIyBBbGxvd3MgY3JlYXRpbmcgb2YgYSBzb3VyY2VcbiMgVE9ETyBsb2dpbiByZXF1aXJlZFxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBOZXdTb3VyY2VQYWdlIGV4dGVuZHMgUGFnZVxuICBAY2FuT3BlbjogKGN0eCkgLT4gY3R4LmF1dGguaW5zZXJ0KFwic291cmNlc1wiKVxuXG4gIGFjdGl2YXRlOiAtPlxuICAgIEBzZXRUaXRsZSBcIk5ldyBTb3VyY2VcIlxuXG4gICAgIyBDcmVhdGUgbW9kZWwgZnJvbSBzb3VyY2VcbiAgICBAbW9kZWwgPSBuZXcgQmFja2JvbmUuTW9kZWwoc2V0TG9jYXRpb246IHRydWUpXG4gIFxuICAgICMgQ3JlYXRlIHF1ZXN0aW9uc1xuICAgIHNvdXJjZVR5cGVzUXVlc3Rpb24gPSBuZXcgZm9ybXMuRHJvcGRvd25RdWVzdGlvblxuICAgICAgaWQ6ICd0eXBlJ1xuICAgICAgbW9kZWw6IEBtb2RlbFxuICAgICAgcHJvbXB0OiAnRW50ZXIgU291cmNlIFR5cGUnXG4gICAgICBvcHRpb25zOiBbXVxuICAgIEBkYi5zb3VyY2VfdHlwZXMuZmluZCh7fSkuZmV0Y2ggKHNvdXJjZVR5cGVzKSA9PlxuICAgICAgIyBGaWxsIHNvdXJjZSB0eXBlc1xuICAgICAgc291cmNlVHlwZXNRdWVzdGlvbi5zZXRPcHRpb25zIF8ubWFwKHNvdXJjZVR5cGVzLCAoc3QpID0+IFtzdC5jb2RlLCBzdC5uYW1lXSlcblxuICAgIHNhdmVDYW5jZWxGb3JtID0gbmV3IGZvcm1zLlNhdmVDYW5jZWxGb3JtXG4gICAgICBjb250ZW50czogW1xuICAgICAgICBzb3VyY2VUeXBlc1F1ZXN0aW9uXG4gICAgICAgIG5ldyBmb3Jtcy5UZXh0UXVlc3Rpb25cbiAgICAgICAgICBpZDogJ25hbWUnXG4gICAgICAgICAgbW9kZWw6IEBtb2RlbFxuICAgICAgICAgIHByb21wdDogJ0VudGVyIG9wdGlvbmFsIG5hbWUnXG4gICAgICAgIG5ldyBmb3Jtcy5UZXh0UXVlc3Rpb25cbiAgICAgICAgICBpZDogJ2Rlc2MnXG4gICAgICAgICAgbW9kZWw6IEBtb2RlbFxuICAgICAgICAgIHByb21wdDogJ0VudGVyIG9wdGlvbmFsIGRlc2NyaXB0aW9uJ1xuICAgICAgICBuZXcgZm9ybXMuQ2hlY2tRdWVzdGlvblxuICAgICAgICAgIGlkOiAncHJpdmF0ZSdcbiAgICAgICAgICBtb2RlbDogQG1vZGVsXG4gICAgICAgICAgcHJvbXB0OiBcIlByaXZhY3lcIlxuICAgICAgICAgIHRleHQ6ICdXYXRlciBzb3VyY2UgaXMgcHJpdmF0ZSdcbiAgICAgICAgICBoaW50OiAnVGhpcyBzaG91bGQgb25seSBiZSB1c2VkIGZvciBzb3VyY2VzIHRoYXQgYXJlIG5vdCBwdWJsaWNhbGx5IGFjY2Vzc2libGUnXG4gICAgICAgIG5ldyBmb3Jtcy5SYWRpb1F1ZXN0aW9uXG4gICAgICAgICAgaWQ6ICdzZXRMb2NhdGlvbidcbiAgICAgICAgICBtb2RlbDogQG1vZGVsXG4gICAgICAgICAgcHJvbXB0OiAnU2V0IHRvIGN1cnJlbnQgbG9jYXRpb24/J1xuICAgICAgICAgIG9wdGlvbnM6IFtbdHJ1ZSwgJ1llcyddLCBbZmFsc2UsICdObyddXVxuICAgICAgXVxuXG4gICAgQCRlbC5lbXB0eSgpLmFwcGVuZChzYXZlQ2FuY2VsRm9ybS5lbClcblxuICAgIEBsaXN0ZW5UbyBzYXZlQ2FuY2VsRm9ybSwgJ3NhdmUnLCA9PlxuICAgICAgc291cmNlID0gXy5waWNrKEBtb2RlbC50b0pTT04oKSwgJ25hbWUnLCAnZGVzYycsICd0eXBlJywgJ3ByaXZhdGUnKVxuICAgICAgc291cmNlLmNvZGUgPSBcIlwiK01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSoxMDAwMDAwKSAgIyBUT0RPIHJlYWwgY29kZXNcbiAgICAgIEBkYi5zb3VyY2VzLnVwc2VydCBzb3VyY2UsIChzb3VyY2UpID0+IFxuICAgICAgICBAcGFnZXIuY2xvc2VQYWdlKFNvdXJjZVBhZ2UsIHsgX2lkOiBzb3VyY2UuX2lkLCBzZXRMb2NhdGlvbjogQG1vZGVsLmdldCgnc2V0TG9jYXRpb24nKX0pXG5cbiAgICBAbGlzdGVuVG8gc2F2ZUNhbmNlbEZvcm0sICdjYW5jZWwnLCA9PlxuICAgICAgQHBhZ2VyLmNsb3NlUGFnZSgpXG4gIiwiUGFnZSA9IHJlcXVpcmUoXCIuLi9QYWdlXCIpXG5Mb2NhdGlvblZpZXcgPSByZXF1aXJlIChcIi4uL0xvY2F0aW9uVmlld1wiKVxuZm9ybXMgPSByZXF1aXJlICcuLi9mb3JtcydcblxuXG4jIERpc3BsYXlzIGEgc291cmNlXG4jIE9wdGlvbnM6IHNldExvY2F0aW9uIC0gdHJ1ZSB0byBhdXRvc2V0IGxvY2F0aW9uXG4jIG9uU2VsZWN0IC0gY2FsbCB3aGVuIHNvdXJjZSBpcyBzZWxlY3RlZCB2aWEgYnV0dG9uIHRoYXQgYXBwZWFyc1xubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBTb3VyY2VQYWdlIGV4dGVuZHMgUGFnZVxuICBldmVudHM6XG4gICAgJ2NsaWNrICNlZGl0X3NvdXJjZV9idXR0b24nIDogJ2VkaXRTb3VyY2UnXG4gICAgJ2NsaWNrICNhZGRfdGVzdF9idXR0b24nIDogJ2FkZFRlc3QnXG4gICAgJ2NsaWNrICNhZGRfbm90ZV9idXR0b24nIDogJ2FkZE5vdGUnXG4gICAgJ2NsaWNrIC50ZXN0JyA6ICdvcGVuVGVzdCdcbiAgICAnY2xpY2sgLm5vdGUnIDogJ29wZW5Ob3RlJ1xuICAgICdjbGljayAjc2VsZWN0X3NvdXJjZScgOiAnc2VsZWN0U291cmNlJ1xuXG4gIGNyZWF0ZTogLT5cbiAgICBAc2V0TG9jYXRpb24gPSBAb3B0aW9ucy5zZXRMb2NhdGlvblxuXG4gIGFjdGl2YXRlOiAtPlxuICAgIEBkYi5zb3VyY2VzLmZpbmRPbmUge19pZDogQG9wdGlvbnMuX2lkfSwgKHNvdXJjZSkgPT5cbiAgICAgIEBzb3VyY2UgPSBzb3VyY2VcbiAgICAgIEByZW5kZXIoKVxuXG4gIHJlbmRlcjogLT5cbiAgICBAc2V0VGl0bGUgXCJTb3VyY2UgXCIgKyBAc291cmNlLmNvZGVcblxuICAgIEBzZXR1cENvbnRleHRNZW51IFtcbiAgICAgIHsgZ2x5cGg6ICdyZW1vdmUnLCB0ZXh0OiBcIkRlbGV0ZSBTb3VyY2VcIiwgY2xpY2s6ID0+IEBkZWxldGVTb3VyY2UoKSB9XG4gICAgXVxuXG4gICAgQHNldHVwQnV0dG9uQmFyIFtcbiAgICAgIHsgaWNvbjogXCJwbHVzLnBuZ1wiLCBtZW51OiBbXG4gICAgICAgIHsgdGV4dDogXCJTdGFydCBXYXRlciBUZXN0XCIsIGNsaWNrOiA9PiBAYWRkVGVzdCgpIH1cbiAgICAgICAgeyB0ZXh0OiBcIkFkZCBOb3RlXCIsIGNsaWNrOiA9PiBAYWRkTm90ZSgpIH1cbiAgICAgIF19XG4gICAgXVxuXG4gICAgIyBSZS1yZW5kZXIgdGVtcGxhdGVcbiAgICBAcmVtb3ZlU3Vidmlld3MoKVxuICAgIEAkZWwuaHRtbCB0ZW1wbGF0ZXNbJ3BhZ2VzL1NvdXJjZVBhZ2UnXShzb3VyY2U6IEBzb3VyY2UsIHNlbGVjdDogQG9wdGlvbnMub25TZWxlY3Q/KVxuXG4gICAgIyBTZXQgc291cmNlIHR5cGVcbiAgICBpZiBAc291cmNlLnR5cGU/XG4gICAgICBAZGIuc291cmNlX3R5cGVzLmZpbmRPbmUge2NvZGU6IEBzb3VyY2UudHlwZX0sIChzb3VyY2VUeXBlKSA9PlxuICAgICAgICBpZiBzb3VyY2VUeXBlPyB0aGVuIEAkKFwiI3NvdXJjZV90eXBlXCIpLnRleHQoc291cmNlVHlwZS5uYW1lKVxuXG4gICAgIyBBZGQgbG9jYXRpb24gdmlld1xuICAgIGxvY2F0aW9uVmlldyA9IG5ldyBMb2NhdGlvblZpZXcobG9jOiBAc291cmNlLmdlbylcbiAgICBpZiBAc2V0TG9jYXRpb25cbiAgICAgIGxvY2F0aW9uVmlldy5zZXRMb2NhdGlvbigpXG4gICAgICBAc2V0TG9jYXRpb24gPSBmYWxzZVxuXG4gICAgQGxpc3RlblRvIGxvY2F0aW9uVmlldywgJ2xvY2F0aW9uc2V0JywgKGxvYykgLT5cbiAgICAgIEBzb3VyY2UuZ2VvID0gbG9jXG4gICAgICBAZGIuc291cmNlcy51cHNlcnQgQHNvdXJjZSwgPT4gQHJlbmRlcigpXG5cbiAgICBAbGlzdGVuVG8gbG9jYXRpb25WaWV3LCAnbWFwJywgKGxvYykgLT5cbiAgICAgIEBwYWdlci5vcGVuUGFnZShyZXF1aXJlKFwiLi9Tb3VyY2VNYXBQYWdlXCIpLCB7aW5pdGlhbEdlbzogbG9jfSlcbiAgICAgIFxuICAgIEBhZGRTdWJ2aWV3KGxvY2F0aW9uVmlldylcbiAgICBAJChcIiNsb2NhdGlvblwiKS5hcHBlbmQobG9jYXRpb25WaWV3LmVsKVxuXG4gICAgIyBBZGQgdGVzdHNcbiAgICBAZGIudGVzdHMuZmluZCh7c291cmNlOiBAc291cmNlLmNvZGV9KS5mZXRjaCAodGVzdHMpIC0+ICMgVE9ETyBzb3VyY2UuY29kZT8gXG4gICAgICBAJChcIiN0ZXN0c1wiKS5odG1sIHRlbXBsYXRlc1sncGFnZXMvU291cmNlUGFnZV90ZXN0cyddKHRlc3RzOnRlc3RzKVxuXG4gICAgIyBBZGQgbm90ZXNcbiAgICBAZGIuc291cmNlX25vdGVzLmZpbmQoe3NvdXJjZTogQHNvdXJjZS5jb2RlfSkuZmV0Y2ggKG5vdGVzKSAtPiAgIyBUT0RPIHNvdXJjZS5jb2RlP1xuICAgICAgQCQoXCIjbm90ZXNcIikuaHRtbCB0ZW1wbGF0ZXNbJ3BhZ2VzL1NvdXJjZVBhZ2Vfbm90ZXMnXShub3Rlczpub3RlcylcblxuICAgICMgQWRkIHBob3RvcyAjIFRPRE8gd2lyZSBtb2RlbCB0byBhY3R1YWwgZGJcbiAgICBwaG90b3NWaWV3ID0gbmV3IGZvcm1zLkltYWdlc1F1ZXN0aW9uXG4gICAgICBpZDogJ3Bob3RvcydcbiAgICAgIG1vZGVsOiBuZXcgQmFja2JvbmUuTW9kZWwoQHNvdXJjZSlcbiAgICAgIGN0eDogQGN0eFxuICAgICAgXG4gICAgcGhvdG9zVmlldy5tb2RlbC5vbiAnY2hhbmdlJywgPT5cbiAgICAgIEBkYi5zb3VyY2VzLnVwc2VydCBAc291cmNlLnRvSlNPTigpLCA9PiBAcmVuZGVyKClcbiAgICBAJCgnI3Bob3RvcycpLmFwcGVuZChwaG90b3NWaWV3LmVsKVxuXG4gIGVkaXRTb3VyY2U6IC0+XG4gICAgQHBhZ2VyLm9wZW5QYWdlKHJlcXVpcmUoXCIuL1NvdXJjZUVkaXRQYWdlXCIpLCB7IF9pZDogQHNvdXJjZS5faWR9KVxuXG4gIGRlbGV0ZVNvdXJjZTogLT5cbiAgICBpZiBjb25maXJtKFwiUGVybWFuZW50bHkgZGVsZXRlIHNvdXJjZT9cIilcbiAgICAgIEBkYi5zb3VyY2VzLnJlbW92ZSBAc291cmNlLl9pZCwgPT5cbiAgICAgICAgQHBhZ2VyLmNsb3NlUGFnZSgpXG4gICAgICAgIEBwYWdlci5mbGFzaCBcIlNvdXJjZSBkZWxldGVkXCIsIFwic3VjY2Vzc1wiXG5cbiAgYWRkVGVzdDogLT5cbiAgICBAcGFnZXIub3BlblBhZ2UocmVxdWlyZShcIi4vTmV3VGVzdFBhZ2VcIiksIHsgc291cmNlOiBAc291cmNlLmNvZGV9KVxuXG4gIG9wZW5UZXN0OiAoZXYpIC0+XG4gICAgQHBhZ2VyLm9wZW5QYWdlKHJlcXVpcmUoXCIuL1Rlc3RQYWdlXCIpLCB7IF9pZDogZXYuY3VycmVudFRhcmdldC5pZH0pXG5cbiAgYWRkTm90ZTogLT5cbiAgICBAcGFnZXIub3BlblBhZ2UocmVxdWlyZShcIi4vU291cmNlTm90ZVBhZ2VcIiksIHsgc291cmNlOiBAc291cmNlLmNvZGV9KSAgICMgVE9ETyBpZCBvciBjb2RlP1xuXG4gIG9wZW5Ob3RlOiAoZXYpIC0+XG4gICAgQHBhZ2VyLm9wZW5QYWdlKHJlcXVpcmUoXCIuL1NvdXJjZU5vdGVQYWdlXCIpLCB7IHNvdXJjZTogQHNvdXJjZS5jb2RlLCBfaWQ6IGV2LmN1cnJlbnRUYXJnZXQuaWR9KVxuXG4gIHNlbGVjdFNvdXJjZTogLT5cbiAgICBpZiBAb3B0aW9ucy5vblNlbGVjdD9cbiAgICAgIEBwYWdlci5jbG9zZVBhZ2UoKVxuICAgICAgQG9wdGlvbnMub25TZWxlY3QoQHNvdXJjZSkiLCJQYWdlID0gcmVxdWlyZSBcIi4uL1BhZ2VcIlxuU291cmNlUGFnZSA9IHJlcXVpcmUgXCIuL1NvdXJjZVBhZ2VcIlxuSXRlbVRyYWNrZXIgPSByZXF1aXJlIFwiLi4vSXRlbVRyYWNrZXJcIlxuTG9jYXRpb25GaW5kZXIgPSByZXF1aXJlICcuLi9Mb2NhdGlvbkZpbmRlcidcbkdlb0pTT04gPSByZXF1aXJlICcuLi9HZW9KU09OJ1xuXG4jIE1hcCBvZiB3YXRlciBzb3VyY2VzLiBPcHRpb25zIGluY2x1ZGU6XG4jIGluaXRpYWxHZW86IEdlb21ldHJ5IHRvIHpvb20gdG8uIFBvaW50IG9ubHkgc3VwcG9ydGVkLlxuY2xhc3MgU291cmNlTWFwUGFnZSBleHRlbmRzIFBhZ2VcbiAgY3JlYXRlOiAtPlxuICAgIEBzZXRUaXRsZSBcIlNvdXJjZSBNYXBcIlxuXG4gICAgIyBDYWxjdWxhdGUgaGVpZ2h0XG4gICAgQCRlbC5odG1sIHRlbXBsYXRlc1sncGFnZXMvU291cmNlTWFwUGFnZSddKClcblxuICAgIEwuSWNvbi5EZWZhdWx0LmltYWdlUGF0aCA9IFwiaW1nL2xlYWZsZXRcIlxuICAgIEBtYXAgPSBMLm1hcCh0aGlzLiQoXCIjbWFwXCIpWzBdKVxuICAgIEwuY29udHJvbC5zY2FsZShpbXBlcmlhbDpmYWxzZSkuYWRkVG8oQG1hcClcbiAgICBAcmVzaXplTWFwKClcblxuICAgICMgUmVjYWxjdWxhdGUgb24gcmVzaXplXG4gICAgJCh3aW5kb3cpLm9uKCdyZXNpemUnLCBAcmVzaXplTWFwKVxuXG4gICAgIyBTZXR1cCBtYXAgdGlsZXNcbiAgICBzZXR1cE1hcFRpbGVzKCkuYWRkVG8oQG1hcClcblxuICAgICMgU2V0dXAgbWFya2VyIGRpc3BsYXlcbiAgICBAc291cmNlRGlzcGxheSA9IG5ldyBTb3VyY2VEaXNwbGF5KEBtYXAsIEBkYiwgQHBhZ2VyKVxuXG4gICAgIyBUT0RPIHpvb20gdG8gbGFzdCBrbm93biBib3VuZHNcbiAgICBcbiAgICAjIFNldHVwIGluaXRpYWwgem9vbVxuICAgIGlmIEBvcHRpb25zLmluaXRpYWxHZW8gYW5kIEBvcHRpb25zLmluaXRpYWxHZW8udHlwZT09XCJQb2ludFwiXG4gICAgICBAbWFwLnNldFZpZXcoTC5HZW9KU09OLmNvb3Jkc1RvTGF0TG5nKEBvcHRpb25zLmluaXRpYWxHZW8uY29vcmRpbmF0ZXMpLCAxNSlcblxuICAgICMgU2V0dXAgbG9jYWx0aW9uIGRpc3BsYXlcbiAgICBAbG9jYXRpb25EaXNwbGF5ID0gbmV3IExvY2F0aW9uRGlzcGxheShAbWFwLCBub3QgQG9wdGlvbnMuaW5pdGlhbEdlbz8pXG5cbiAgZGVzdHJveTogLT5cbiAgICAkKHdpbmRvdykub2ZmKCdyZXNpemUnLCBAcmVzaXplTWFwKVxuICAgIEBsb2NhdGlvbkRpc3BsYXkuc3RvcCgpXG5cbiAgcmVzaXplTWFwOiA9PlxuICAgICMgQ2FsY3VsYXRlIG1hcCBoZWlnaHRcbiAgICBtYXBIZWlnaHQgPSAkKFwiaHRtbFwiKS5oZWlnaHQoKSAtIDQwXG4gICAgJChcIiNtYXBcIikuY3NzKFwiaGVpZ2h0XCIsIG1hcEhlaWdodCArIFwicHhcIilcbiAgICBAbWFwLmludmFsaWRhdGVTaXplKClcblxuXG5zZXR1cE1hcFRpbGVzID0gLT5cbiAgbWFwcXVlc3RVcmwgPSAnaHR0cDovL3tzfS5tcWNkbi5jb20vdGlsZXMvMS4wLjAvb3NtL3t6fS97eH0ve3l9LnBuZydcbiAgc3ViRG9tYWlucyA9IFsnb3RpbGUxJywnb3RpbGUyJywnb3RpbGUzJywnb3RpbGU0J11cbiAgbWFwcXVlc3RBdHRyaWIgPSAnRGF0YSwgaW1hZ2VyeSBhbmQgbWFwIGluZm9ybWF0aW9uIHByb3ZpZGVkIGJ5IDxhIGhyZWY9XCJodHRwOi8vb3Blbi5tYXBxdWVzdC5jby51a1wiIHRhcmdldD1cIl9ibGFua1wiPk1hcFF1ZXN0PC9hPiwgPGEgaHJlZj1cImh0dHA6Ly93d3cub3BlbnN0cmVldG1hcC5vcmcvXCIgdGFyZ2V0PVwiX2JsYW5rXCI+T3BlblN0cmVldE1hcDwvYT4gYW5kIGNvbnRyaWJ1dG9ycy4nXG4gIHJldHVybiBuZXcgTC5UaWxlTGF5ZXIobWFwcXVlc3RVcmwsIHttYXhab29tOiAxOCwgYXR0cmlidXRpb246IG1hcHF1ZXN0QXR0cmliLCBzdWJkb21haW5zOiBzdWJEb21haW5zfSlcblxuY2xhc3MgU291cmNlRGlzcGxheVxuICBjb25zdHJ1Y3RvcjogKG1hcCwgZGIsIHBhZ2VyKSAtPlxuICAgIEBtYXAgPSBtYXBcbiAgICBAZGIgPSBkYlxuICAgIEBwYWdlciA9IHBhZ2VyXG4gICAgQGl0ZW1UcmFja2VyID0gbmV3IEl0ZW1UcmFja2VyKClcblxuICAgIEBzb3VyY2VNYXJrZXJzID0ge31cbiAgICBAbWFwLm9uKCdtb3ZlZW5kJywgQHVwZGF0ZU1hcmtlcnMpXG5cbiAgICBAaWNvbiA9IG5ldyBMLmljb25cbiAgICAgIGljb25Vcmw6ICdpbWcvRHJvcE1hcmtlci5wbmcnXG4gICAgICBpY29uUmV0aW5hVXJsOiAnaW1nL0Ryb3BNYXJrZXJAMngucG5nJ1xuICAgICAgaWNvblNpemU6IFsyNywgNDFdLFxuICAgICAgaWNvbkFuY2hvcjogWzEzLCA0MV1cbiAgICAgIHBvcHVwQW5jaG9yOiBbLTMsIC00MV1cbiAgXG4gIHVwZGF0ZU1hcmtlcnM6ID0+XG4gICAgIyBHZXQgYm91bmRzIHBhZGRlZFxuICAgIGJvdW5kcyA9IEBtYXAuZ2V0Qm91bmRzKCkucGFkKDAuMzMpXG5cbiAgICBib3VuZHNHZW9KU09OID0gR2VvSlNPTi5sYXRMbmdCb3VuZHNUb0dlb0pTT04oYm91bmRzKVxuICAgIHNlbGVjdG9yID0geyBnZW86IHsgJGdlb0ludGVyc2VjdHM6IHsgJGdlb21ldHJ5OiBib3VuZHNHZW9KU09OIH0gfSB9XG5cbiAgICAjIFF1ZXJ5IHNvdXJjZXMgd2l0aCBwcm9qZWN0aW9uIFRPRE9cbiAgICBAZGIuc291cmNlcy5maW5kKHNlbGVjdG9yLCB7IHNvcnQ6IFtcIl9pZFwiXSwgbGltaXQ6IDEwMCB9KS5mZXRjaCAoc291cmNlcykgPT5cbiAgICAgICMgRmluZCBvdXQgd2hpY2ggdG8gYWRkL3JlbW92ZVxuICAgICAgW2FkZHMsIHJlbW92ZXNdID0gQGl0ZW1UcmFja2VyLnVwZGF0ZShzb3VyY2VzKVxuXG4gICAgICAjIFJlbW92ZSBvbGQgbWFya2Vyc1xuICAgICAgZm9yIHJlbW92ZSBpbiByZW1vdmVzXG4gICAgICAgIEByZW1vdmVTb3VyY2VNYXJrZXIocmVtb3ZlKVxuICAgICAgZm9yIGFkZCBpbiBhZGRzXG4gICAgICAgIEBhZGRTb3VyY2VNYXJrZXIoYWRkKVxuXG4gIGFkZFNvdXJjZU1hcmtlcjogKHNvdXJjZSkgLT5cbiAgICBpZiBzb3VyY2UuZ2VvP1xuICAgICAgbGF0bG5nID0gbmV3IEwuTGF0TG5nKHNvdXJjZS5nZW8uY29vcmRpbmF0ZXNbMV0sIHNvdXJjZS5nZW8uY29vcmRpbmF0ZXNbMF0pXG4gICAgICBtYXJrZXIgPSBuZXcgTC5NYXJrZXIobGF0bG5nLCB7aWNvbjpAaWNvbn0pXG4gICAgICBcbiAgICAgIG1hcmtlci5vbiAnY2xpY2snLCA9PlxuICAgICAgICBAcGFnZXIub3BlblBhZ2UoU291cmNlUGFnZSwge19pZDogc291cmNlLl9pZH0pXG4gICAgICBcbiAgICAgIEBzb3VyY2VNYXJrZXJzW3NvdXJjZS5faWRdID0gbWFya2VyXG4gICAgICBtYXJrZXIuYWRkVG8oQG1hcClcblxuICByZW1vdmVTb3VyY2VNYXJrZXI6IChzb3VyY2UpIC0+XG4gICAgaWYgXy5oYXMoQHNvdXJjZU1hcmtlcnMsIHNvdXJjZS5faWQpXG4gICAgICBAbWFwLnJlbW92ZUxheWVyKEBzb3VyY2VNYXJrZXJzW3NvdXJjZS5faWRdKVxuXG5cbmNsYXNzIExvY2F0aW9uRGlzcGxheVxuICAjIFNldHVwIGRpc3BsYXksIG9wdGlvbmFsbHkgem9vbWluZyB0byBjdXJyZW50IGxvY2F0aW9uXG4gIGNvbnN0cnVjdG9yOiAobWFwLCB6b29tVG8pIC0+XG4gICAgQG1hcCA9IG1hcFxuICAgIEB6b29tVG8gPSB6b29tVG9cblxuICAgIEBsb2NhdGlvbkZpbmRlciA9IG5ldyBMb2NhdGlvbkZpbmRlcigpXG4gICAgQGxvY2F0aW9uRmluZGVyLm9uKCdmb3VuZCcsIEBsb2NhdGlvbkZvdW5kKS5vbignZXJyb3InLCBAbG9jYXRpb25FcnJvcilcbiAgICBAbG9jYXRpb25GaW5kZXIuc3RhcnRXYXRjaCgpXG5cbiAgc3RvcDogLT5cbiAgICBAbG9jYXRpb25GaW5kZXIuc3RvcFdhdGNoKClcblxuICBsb2NhdGlvbkVycm9yOiAoZSkgPT5cbiAgICBpZiBAem9vbVRvXG4gICAgICBAbWFwLmZpdFdvcmxkKClcbiAgICAgIEB6b29tVG8gPSBmYWxzZVxuICAgICAgYWxlcnQoXCJVbmFibGUgdG8gZGV0ZXJtaW5lIGxvY2F0aW9uXCIpXG5cbiAgbG9jYXRpb25Gb3VuZDogKGUpID0+XG4gICAgcmFkaXVzID0gZS5jb29yZHMuYWNjdXJhY3lcbiAgICBsYXRsbmcgPSBuZXcgTC5MYXRMbmcoZS5jb29yZHMubGF0aXR1ZGUsIGUuY29vcmRzLmxvbmdpdHVkZSlcblxuICAgICMgU2V0IHBvc2l0aW9uIG9uY2VcbiAgICBpZiBAem9vbVRvXG4gICAgICB6b29tID0gMTVcbiAgICAgIEBtYXAuc2V0VmlldyhsYXRsbmcsIHpvb20pXG4gICAgICBAem9vbVRvID0gZmFsc2VcblxuICAgICMgU2V0dXAgbWFya2VyIGFuZCBjaXJjbGVcbiAgICBpZiBub3QgQG1lTWFya2VyXG4gICAgICBpY29uID0gIEwuaWNvbihpY29uVXJsOiBcImltZy9teV9sb2NhdGlvbi5wbmdcIiwgaWNvblNpemU6IFsyMiwgMjJdKVxuICAgICAgQG1lTWFya2VyID0gTC5tYXJrZXIobGF0bG5nLCBpY29uOmljb24pLmFkZFRvKEBtYXApXG4gICAgICBAbWVDaXJjbGUgPSBMLmNpcmNsZShsYXRsbmcsIHJhZGl1cylcbiAgICAgIEBtZUNpcmNsZS5hZGRUbyhAbWFwKVxuICAgIGVsc2VcbiAgICAgIEBtZU1hcmtlci5zZXRMYXRMbmcobGF0bG5nKVxuICAgICAgQG1lQ2lyY2xlLnNldExhdExuZyhsYXRsbmcpLnNldFJhZGl1cyhyYWRpdXMpXG5cbm1vZHVsZS5leHBvcnRzID0gU291cmNlTWFwUGFnZSIsIlBhZ2UgPSByZXF1aXJlIFwiLi4vUGFnZVwiXG5UZXN0UGFnZSA9IHJlcXVpcmUgXCIuL1Rlc3RQYWdlXCJcblxuIyBQYXJhbWV0ZXIgaXMgb3B0aW9uYWwgc291cmNlIGNvZGVcbmNsYXNzIE5ld1Rlc3RQYWdlIGV4dGVuZHMgUGFnZVxuICBAY2FuT3BlbjogKGN0eCkgLT4gY3R4LmF1dGguaW5zZXJ0KFwidGVzdHNcIilcblxuICBldmVudHM6IFxuICAgIFwiY2xpY2sgLnRlc3RcIiA6IFwic3RhcnRUZXN0XCJcblxuICBhY3RpdmF0ZTogLT5cbiAgICBAc2V0VGl0bGUgXCJTZWxlY3QgVGVzdFwiXG5cbiAgICBAZGIuZm9ybXMuZmluZCh7dHlwZTpcIldhdGVyVGVzdFwifSkuZmV0Y2ggKGZvcm1zKSA9PlxuICAgICAgQGZvcm1zID0gZm9ybXNcbiAgICAgIEAkZWwuaHRtbCB0ZW1wbGF0ZXNbJ3BhZ2VzL05ld1Rlc3RQYWdlJ10oZm9ybXM6Zm9ybXMpXG5cbiAgc3RhcnRUZXN0OiAoZXYpIC0+XG4gICAgdGVzdENvZGUgPSBldi5jdXJyZW50VGFyZ2V0LmlkXG5cbiAgICAjIFRPRE8gYWRkIHVzZXIvb3JnXG5cbiAgICAjIENyZWF0ZSB0ZXN0XG4gICAgdGVzdCA9IHtcbiAgICAgIHNvdXJjZTogQG9wdGlvbnMuc291cmNlXG4gICAgICB0eXBlOiB0ZXN0Q29kZVxuICAgICAgY29tcGxldGVkOiBudWxsXG4gICAgICBzdGFydGVkOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKClcbiAgICB9XG4gICAgQGRiLnRlc3RzLnVwc2VydCB0ZXN0LCAodGVzdCkgPT5cbiAgICAgIEBwYWdlci5jbG9zZVBhZ2UoVGVzdFBhZ2UsIHsgX2lkOiB0ZXN0Ll9pZCB9KVxuXG5tb2R1bGUuZXhwb3J0cyA9IE5ld1Rlc3RQYWdlIiwiUGFnZSA9IHJlcXVpcmUgJy4uL1BhZ2UnXG5mb3JtcyA9IHJlcXVpcmUgJy4uL2Zvcm1zJ1xuXG4jIEFsbG93cyBlZGl0aW5nIG9mIHNvdXJjZSBkZXRhaWxzXG4jIFRPRE8gbG9naW4gcmVxdWlyZWRcbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgU291cmNlRWRpdFBhZ2UgZXh0ZW5kcyBQYWdlXG4gIEBjYW5PcGVuOiAoY3R4KSAtPiBjdHguYXV0aC51cGRhdGUoXCJzb3VyY2VzXCIpXG5cbiAgYWN0aXZhdGU6IC0+XG4gICAgQGRiLnNvdXJjZXMuZmluZE9uZSB7X2lkOiBAb3B0aW9ucy5faWR9LCAoc291cmNlKSA9PlxuICAgICAgQHNldFRpdGxlIFwiRWRpdCBTb3VyY2UgI3tzb3VyY2UuY29kZX1cIlxuXG4gICAgICAjIENyZWF0ZSBtb2RlbCBmcm9tIHNvdXJjZVxuICAgICAgQG1vZGVsID0gbmV3IEJhY2tib25lLk1vZGVsKHNvdXJjZSlcbiAgXG4gICAgICAjIENyZWF0ZSBxdWVzdGlvbnNcbiAgICAgIHNvdXJjZVR5cGVzUXVlc3Rpb24gPSBuZXcgZm9ybXMuRHJvcGRvd25RdWVzdGlvblxuICAgICAgICBpZDogJ3R5cGUnXG4gICAgICAgIG1vZGVsOiBAbW9kZWxcbiAgICAgICAgcHJvbXB0OiAnRW50ZXIgU291cmNlIFR5cGUnXG4gICAgICAgIG9wdGlvbnM6IFtdXG4gICAgICBAZGIuc291cmNlX3R5cGVzLmZpbmQoe30pLmZldGNoIChzb3VyY2VUeXBlcykgPT5cbiAgICAgICAgIyBGaWxsIHNvdXJjZSB0eXBlc1xuICAgICAgICBzb3VyY2VUeXBlc1F1ZXN0aW9uLnNldE9wdGlvbnMgXy5tYXAoc291cmNlVHlwZXMsIChzdCkgPT4gW3N0LmNvZGUsIHN0Lm5hbWVdKVxuXG4gICAgICBzYXZlQ2FuY2VsRm9ybSA9IG5ldyBmb3Jtcy5TYXZlQ2FuY2VsRm9ybVxuICAgICAgICBjb250ZW50czogW1xuICAgICAgICAgIHNvdXJjZVR5cGVzUXVlc3Rpb25cbiAgICAgICAgICBuZXcgZm9ybXMuVGV4dFF1ZXN0aW9uXG4gICAgICAgICAgICBpZDogJ25hbWUnXG4gICAgICAgICAgICBtb2RlbDogQG1vZGVsXG4gICAgICAgICAgICBwcm9tcHQ6ICdFbnRlciBvcHRpb25hbCBuYW1lJ1xuICAgICAgICAgIG5ldyBmb3Jtcy5UZXh0UXVlc3Rpb25cbiAgICAgICAgICAgIGlkOiAnZGVzYydcbiAgICAgICAgICAgIG1vZGVsOiBAbW9kZWxcbiAgICAgICAgICAgIHByb21wdDogJ0VudGVyIG9wdGlvbmFsIGRlc2NyaXB0aW9uJ1xuICAgICAgICAgIG5ldyBmb3Jtcy5DaGVja1F1ZXN0aW9uXG4gICAgICAgICAgICBpZDogJ3ByaXZhdGUnXG4gICAgICAgICAgICBtb2RlbDogQG1vZGVsXG4gICAgICAgICAgICBwcm9tcHQ6IFwiUHJpdmFjeVwiXG4gICAgICAgICAgICB0ZXh0OiAnV2F0ZXIgc291cmNlIGlzIHByaXZhdGUnXG4gICAgICAgICAgICBoaW50OiAnVGhpcyBzaG91bGQgb25seSBiZSB1c2VkIGZvciBzb3VyY2VzIHRoYXQgYXJlIG5vdCBwdWJsaWNhbGx5IGFjY2Vzc2libGUnXG4gICAgICAgIF1cblxuICAgICAgQCRlbC5lbXB0eSgpLmFwcGVuZChzYXZlQ2FuY2VsRm9ybS5lbClcblxuICAgICAgQGxpc3RlblRvIHNhdmVDYW5jZWxGb3JtLCAnc2F2ZScsID0+XG4gICAgICAgIEBkYi5zb3VyY2VzLnVwc2VydCBAbW9kZWwudG9KU09OKCksID0+IEBwYWdlci5jbG9zZVBhZ2UoKVxuXG4gICAgICBAbGlzdGVuVG8gc2F2ZUNhbmNlbEZvcm0sICdjYW5jZWwnLCA9PlxuICAgICAgICBAcGFnZXIuY2xvc2VQYWdlKClcbiAiLCJQYWdlID0gcmVxdWlyZSBcIi4uL1BhZ2VcIlxuZm9ybXMgPSByZXF1aXJlICcuLi9mb3JtcydcblxuY2xhc3MgVGVzdFBhZ2UgZXh0ZW5kcyBQYWdlXG4gIEBjYW5PcGVuOiAoY3R4KSAtPiBjdHguYXV0aC51cGRhdGUoXCJ0ZXN0c1wiKSAmJiBjdHguYXV0aC5pbnNlcnQoXCJ0ZXN0c1wiKSBcblxuICBjcmVhdGU6IC0+IEByZW5kZXIoKVxuXG4gIGFjdGl2YXRlOiAtPlxuICAgIEBzZXR1cENvbnRleHRNZW51IFtcbiAgICAgIHsgZ2x5cGg6ICdyZW1vdmUnLCB0ZXh0OiBcIkRlbGV0ZSBUZXN0XCIsIGNsaWNrOiA9PiBAZGVsZXRlVGVzdCgpIH1cbiAgICBdXG5cbiAgcmVuZGVyOiAtPlxuICAgIEBzZXRUaXRsZSBcIlRlc3RcIiAjIFRPRE8gbmljZXIgdGl0bGVcblxuICAgICMgR2V0IHRlc3RcbiAgICBAZGIudGVzdHMuZmluZE9uZSB7X2lkOiBAb3B0aW9ucy5faWR9LCAodGVzdCkgPT5cbiAgICAgIEB0ZXN0ID0gdGVzdFxuXG4gICAgICAjIEdldCBmb3JtXG4gICAgICBAZGIuZm9ybXMuZmluZE9uZSB7IHR5cGU6IFwiV2F0ZXJUZXN0XCIsIGNvZGU6IHRlc3QudHlwZSB9LCAoZm9ybSkgPT5cbiAgICAgICAgIyBDaGVjayBpZiBjb21wbGV0ZWRcbiAgICAgICAgaWYgbm90IHRlc3QuY29tcGxldGVkXG4gICAgICAgICAgQGZvcm1WaWV3ID0gZm9ybXMuaW5zdGFudGlhdGVWaWV3KGZvcm0udmlld3MuZWRpdCwgeyBjdHg6IEBjdHggfSlcblxuICAgICAgICAgICMgTGlzdGVuIHRvIGV2ZW50c1xuICAgICAgICAgIEBsaXN0ZW5UbyBAZm9ybVZpZXcsICdjaGFuZ2UnLCBAc2F2ZVxuICAgICAgICAgIEBsaXN0ZW5UbyBAZm9ybVZpZXcsICdjb21wbGV0ZScsIEBjb21wbGV0ZWRcbiAgICAgICAgICBAbGlzdGVuVG8gQGZvcm1WaWV3LCAnY2xvc2UnLCBAY2xvc2VcbiAgICAgICAgZWxzZVxuICAgICAgICAgIEBmb3JtVmlldyA9IGZvcm1zLmluc3RhbnRpYXRlVmlldyhmb3JtLnZpZXdzLmRldGFpbCwgeyBjdHg6IEBjdHggfSlcbiAgXG4gICAgICAgICMgVE9ETyBkaXNhYmxlIGlmIG5vbi1lZGl0YWJsZVxuICAgICAgICBAJGVsLmh0bWwgdGVtcGxhdGVzWydwYWdlcy9UZXN0UGFnZSddKGNvbXBsZXRlZDogdGVzdC5jb21wbGV0ZWQsIHRpdGxlOiBmb3JtLm5hbWUpXG4gICAgICAgIEAkKCcjY29udGVudHMnKS5hcHBlbmQoQGZvcm1WaWV3LmVsKVxuXG4gICAgICAgIEBmb3JtVmlldy5sb2FkIEB0ZXN0XG5cbiAgZXZlbnRzOlxuICAgIFwiY2xpY2sgI2VkaXRfYnV0dG9uXCIgOiBcImVkaXRcIlxuXG4gIGRlc3Ryb3k6IC0+XG4gICAgIyBMZXQga25vdyB0aGF0IHNhdmVkIGlmIGNsb3NlZCBpbmNvbXBsZXRlZFxuICAgIGlmIEB0ZXN0IGFuZCBub3QgQHRlc3QuY29tcGxldGVkXG4gICAgICBAcGFnZXIuZmxhc2ggXCJUZXN0IHNhdmVkIGFzIGRyYWZ0LlwiXG5cbiAgZWRpdDogLT5cbiAgICAjIE1hcmsgYXMgaW5jb21wbGV0ZVxuICAgIEB0ZXN0LmNvbXBsZXRlZCA9IG51bGxcbiAgICBAZGIudGVzdHMudXBzZXJ0IEB0ZXN0LCA9PiBAcmVuZGVyKClcblxuICBzYXZlOiA9PlxuICAgICMgU2F2ZSB0byBkYlxuICAgIEB0ZXN0ID0gQGZvcm1WaWV3LnNhdmUoKVxuICAgIEBkYi50ZXN0cy51cHNlcnQoQHRlc3QpXG5cbiAgY2xvc2U6ID0+XG4gICAgQHNhdmUoKVxuICAgIEBwYWdlci5jbG9zZVBhZ2UoKVxuXG4gIGNvbXBsZXRlZDogPT5cbiAgICAjIE1hcmsgYXMgY29tcGxldGVkXG4gICAgQHRlc3QuY29tcGxldGVkID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpXG4gICAgQGRiLnRlc3RzLnVwc2VydCBAdGVzdCwgPT4gQHJlbmRlcigpXG5cbiAgZGVsZXRlVGVzdDogLT5cbiAgICBpZiBjb25maXJtKFwiUGVybWFuZW50bHkgZGVsZXRlIHRlc3Q/XCIpXG4gICAgICBAZGIudGVzdHMucmVtb3ZlIEB0ZXN0Ll9pZCwgPT5cbiAgICAgICAgQHRlc3QgPSBudWxsXG4gICAgICAgIEBwYWdlci5jbG9zZVBhZ2UoKVxuICAgICAgICBAcGFnZXIuZmxhc2ggXCJUZXN0IGRlbGV0ZWRcIiwgXCJzdWNjZXNzXCJcblxubW9kdWxlLmV4cG9ydHMgPSBUZXN0UGFnZSIsIlBhZ2UgPSByZXF1aXJlICcuLi9QYWdlJ1xuZm9ybXMgPSByZXF1aXJlICcuLi9mb3JtcydcblxuIyBBbGxvd3MgY3JlYXRpbmcvZWRpdGluZyBvZiBzb3VyY2Ugbm90ZXNcbiMgT3B0aW9ucyBhcmUgXG4jIF9pZDogaWQgb2Ygc291cmNlIG5vdGVcbiMgc291cmNlOiBjb2RlIG9mIHNvdXJjZVxuXG4jIFRPRE8gbG9naW4gcmVxdWlyZWRcbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgU291cmNlTm90ZVBhZ2UgZXh0ZW5kcyBQYWdlXG4gIEBjYW5PcGVuOiAoY3R4KSAtPiBjdHguYXV0aC51cGRhdGUoXCJzb3VyY2Vfbm90ZXNcIikgJiYgY3R4LmF1dGguaW5zZXJ0KFwic291cmNlX25vdGVzXCIpIFxuXG4gIGFjdGl2YXRlOiAtPlxuICAgICMgRmluZCB3YXRlciBzb3VyY2VcbiAgICBAZGIuc291cmNlcy5maW5kT25lIHtjb2RlOiBAb3B0aW9ucy5zb3VyY2V9LCAoc291cmNlKSA9PlxuICAgICAgQHNldFRpdGxlIFwiTm90ZSBmb3IgU291cmNlICN7c291cmNlLmNvZGV9XCJcblxuICAgICAgIyBDcmVhdGUgbW9kZWwgXG4gICAgICBAbW9kZWwgPSBuZXcgQmFja2JvbmUuTW9kZWwoKVxuICBcbiAgICAgICMgQ3JlYXRlIHF1ZXN0aW9uc1xuICAgICAgc2F2ZUNhbmNlbEZvcm0gPSBuZXcgZm9ybXMuU2F2ZUNhbmNlbEZvcm1cbiAgICAgICAgY29udGVudHM6IFtcbiAgICAgICAgICBuZXcgZm9ybXMuRGF0ZVF1ZXN0aW9uXG4gICAgICAgICAgICBpZDogJ2RhdGUnXG4gICAgICAgICAgICBtb2RlbDogQG1vZGVsXG4gICAgICAgICAgICBwcm9tcHQ6ICdEYXRlIG9mIFZpc2l0J1xuICAgICAgICAgICAgcmVxdWlyZWQ6IHRydWVcbiAgICAgICAgICBuZXcgZm9ybXMuUmFkaW9RdWVzdGlvblxuICAgICAgICAgICAgaWQ6ICdzdGF0dXMnXG4gICAgICAgICAgICBtb2RlbDogQG1vZGVsXG4gICAgICAgICAgICBwcm9tcHQ6ICdTdGF0dXMgb2YgV2F0ZXIgU291cmNlJ1xuICAgICAgICAgICAgb3B0aW9uczogW1snb2snLCAnRnVuY3Rpb25hbCddLCBbJ21haW50JywgJ05lZWRzIG1haW50ZW5hbmNlJ10sIFsnYnJva2VuJywgJ05vbi1mdW5jdGlvbmFsJ10sIFsnbWlzc2luZycsICdObyBsb25nZXIgZXhpc3RzJ11dXG4gICAgICAgICAgICByZXF1aXJlZDogdHJ1ZVxuICAgICAgICAgIG5ldyBmb3Jtcy5UZXh0UXVlc3Rpb25cbiAgICAgICAgICAgIGlkOiAnbm90ZXMnXG4gICAgICAgICAgICBtb2RlbDogQG1vZGVsXG4gICAgICAgICAgICBwcm9tcHQ6ICdOb3RlcydcbiAgICAgICAgICAgIG11bHRpbGluZTogdHJ1ZVxuICAgICAgICBdXG5cbiAgICAgICMgTG9hZCBmb3JtIGZyb20gc291cmNlIG5vdGUgaWYgZXhpc3RzXG4gICAgICBpZiBAb3B0aW9ucy5faWRcbiAgICAgICAgQGRiLnNvdXJjZV9ub3Rlcy5maW5kT25lIHtfaWQ6IEBvcHRpb25zLl9pZH0sIChzb3VyY2VOb3RlKSA9PlxuICAgICAgICAgIEBtb2RlbC5zZXQoc291cmNlTm90ZSlcbiAgICAgIGVsc2VcbiAgICAgICAgIyBDcmVhdGUgZGVmYXVsdCBlbnRyeVxuICAgICAgICBAbW9kZWwuc2V0KHNvdXJjZTogQG9wdGlvbnMuc291cmNlLCBkYXRlOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkuc3Vic3RyaW5nKDAsMTApKVxuXG4gICAgICBAJGVsLmVtcHR5KCkuYXBwZW5kKHNhdmVDYW5jZWxGb3JtLmVsKVxuXG4gICAgICBAbGlzdGVuVG8gc2F2ZUNhbmNlbEZvcm0sICdzYXZlJywgPT5cbiAgICAgICAgQGRiLnNvdXJjZV9ub3Rlcy51cHNlcnQgQG1vZGVsLnRvSlNPTigpLCA9PiBAcGFnZXIuY2xvc2VQYWdlKClcblxuICAgICAgQGxpc3RlblRvIHNhdmVDYW5jZWxGb3JtLCAnY2FuY2VsJywgPT5cbiAgICAgICAgQHBhZ2VyLmNsb3NlUGFnZSgpXG4gIl19
;