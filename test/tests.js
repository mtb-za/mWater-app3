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


},{"../app/js/GeoJSON":6}],7:[function(require,module,exports){
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


},{"../app/js/db/LocalDb":8,"../app/js/db/HybridDb":9,"./db_queries":10}],11:[function(require,module,exports){
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


},{"forms":"EAVIrc","./helpers/UIDriver":4,"../app/js/pages/ImagePage":12}],13:[function(require,module,exports){
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


},{"../app/js/ItemTracker":14}],15:[function(require,module,exports){
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


},{"forms":"EAVIrc","../app/js/pages/ImagePage":12,"./helpers/UIDriver":4}],16:[function(require,module,exports){
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


},{"../app/js/db/LocalDb":8,"./db_queries":10}],17:[function(require,module,exports){
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


},{"./db_queries":10,"../app/js/db/RemoteDb":18}],19:[function(require,module,exports){
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


},{"../app/js/LocationView":20,"./helpers/UIDriver":4}],10:[function(require,module,exports){
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


},{"../app/js/GeoJSON":6}],21:[function(require,module,exports){
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


},{"../app/js/auth":22}],"forms":[function(require,module,exports){
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


},{"./form-controls":23,"./DateQuestion":24,"./QuestionGroup":25,"./SaveCancelForm":26,"./DropdownQuestion":27,"./SourceQuestion":28,"./ImageQuestion":29,"./ImagesQuestion":30,"./Instructions":31,"./NumberQuestion":32}],2:[function(require,module,exports){
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


},{}],6:[function(require,module,exports){
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


},{}],14:[function(require,module,exports){
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


},{}],22:[function(require,module,exports){
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


},{}],18:[function(require,module,exports){
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
          if (_this.client) {
            params.client = _this.client;
          }
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
      if (this.client) {
        params.client = this.client;
      }
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
      if (!this.client) {
        throw new Error("Client required to upsert");
      }
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
      if (!this.client) {
        throw new Error("Client required to remove");
      }
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


},{}],20:[function(require,module,exports){
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
      this.readonly = options.readonly;
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
      return this.$("#location_set").attr("disabled", this.settingLocation || this.readonly);
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


},{"./LocationFinder":33,"./GeoJSON":6}],9:[function(require,module,exports){
/*

Database which caches locally in a localDb but pulls results
ultimately from a RemoteDb
*/


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


},{"./utils":34}],12:[function(require,module,exports){
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


},{"../Page":35}],8:[function(require,module,exports){
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


},{"./selector":36,"./utils":34}],23:[function(require,module,exports){
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
        "click #close" : "close",
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

    close : function() {
        this.trigger('close');
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

},{}],25:[function(require,module,exports){
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


},{}],26:[function(require,module,exports){
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


},{"./form-controls":23}],32:[function(require,module,exports){
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


},{"./form-controls":23}],27:[function(require,module,exports){
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


},{"./form-controls":23}],28:[function(require,module,exports){
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


},{"./form-controls":23,"../pages/SourceListPage":37,"../sourcecodes":38}],29:[function(require,module,exports){
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


},{"./form-controls":23,"../pages/ImagePage":12}],30:[function(require,module,exports){
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


},{"./form-controls":23,"../pages/ImagePage":12}],33:[function(require,module,exports){
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


},{}],35:[function(require,module,exports){
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
      _.defaults(this, ctx);
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


},{}],38:[function(require,module,exports){
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
/*
========================================
Meteor is licensed under the MIT License
========================================

Copyright (C) 2011--2012 Meteor Development Group

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


====================================================================
This license applies to all code in Meteor that is not an externally
maintained library. Externally maintained libraries have their own
licenses, included below:
====================================================================

*/

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
},{"./EJSON":39}],34:[function(require,module,exports){
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


},{"./selector":36,"../GeoJSON":6}],37:[function(require,module,exports){
(function() {
  var GeoJSON, LocationFinder, Page, SourceListPage, SourcePage, _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Page = require("../Page");

  SourcePage = require("./SourcePage");

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
      if (this.login.user) {
        this.db.sources.find({
          geo: {
            $exists: false
          },
          user: this.login.user
        }).fetch(function(sources) {
          _this.unlocatedSources = sources;
          return _this.renderList();
        });
      }
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
      return this.db.sources.find(selector, {
        limit: 100
      }).fetch(function(sources) {
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
      return this.pager.openPage(SourcePage, {
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
            $or: [
              {
                name: new RegExp(this.searchText, "i")
              }, {
                desc: new RegExp(this.searchText, "i")
              }
            ]
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


},{"../Page":35,"../LocationFinder":33,"../GeoJSON":6,"./NewSourcePage":40,"./SourcePage":41}],39:[function(require,module,exports){
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
      return ctx.auth.insert("sources") && ctx.login.user;
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
        source.user = _this.login.user;
        source.org = _this.login.org;
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


},{"../Page":35,"./SourcePage":41,"../forms":"EAVIrc"}],41:[function(require,module,exports){
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
        _this.render();
        _this.$("#edit_source_button").toggle(_this.auth.update("sources", source));
        _this.$("#add_test_button").toggle(_this.auth.insert("tests"));
        return _this.$("#add_note_button").toggle(_this.auth.insert("source_notes"));
      });
    };

    SourcePage.prototype.render = function() {
      var locationView, menu, photosView,
        _this = this;
      this.setTitle("Source " + this.source.code);
      if (this.auth.remove("sources", this.source)) {
        this.setupContextMenu([
          {
            glyph: 'remove',
            text: "Delete Source",
            click: function() {
              return _this.deleteSource();
            }
          }
        ]);
      }
      menu = [];
      if (this.auth.insert("tests")) {
        menu.push({
          text: "Start Water Test",
          click: function() {
            return _this.addTest();
          }
        });
      }
      if (this.auth.insert("source_notes")) {
        menu.push({
          text: "Add Note",
          click: function() {
            return _this.addNote();
          }
        });
      }
      this.setupButtonBar([
        {
          icon: "plus.png",
          menu: menu
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
        loc: this.source.geo,
        readonly: !this.auth.update("sources", this.source)
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
        return _this.pager.openPage(require("./SourceMapPage"), {
          initialGeo: loc
        });
      });
      this.addSubview(locationView);
      this.$("#location").append(locationView.el);
      this.db.tests.find({
        source: this.source.code
      }).fetch(function(tests) {
        var test, _i, _len, _results;
        _this.$("#tests").html(templates['pages/SourcePage_tests']({
          tests: tests
        }));
        _results = [];
        for (_i = 0, _len = tests.length; _i < _len; _i++) {
          test = tests[_i];
          _results.push(_this.db.forms.findOne({
            code: test.type
          }, {
            mode: "local"
          }, function(form) {
            return _this.$("#test_name_" + test._id).text(form.name(form ? void 0 : "???"));
          }));
        }
        return _results;
      });
      this.db.source_notes.find({
        source: this.source.code
      }).fetch(function(notes) {
        return _this.$("#notes").html(templates['pages/SourcePage_notes']({
          notes: notes
        }));
      });
      photosView = new forms.ImagesQuestion({
        id: 'photos',
        model: new Backbone.Model(this.source),
        ctx: this.ctx,
        readonly: !this.auth.update("sources", this.source)
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
      if (this.auth.remove("sources", this.source) && confirm("Permanently delete source?")) {
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


},{"../Page":35,"../LocationView":20,"./SourceMapPage":42,"./SourceEditPage":43,"./TestPage":44,"./SourceNotePage":45,"./NewTestPage":46,"../forms":"EAVIrc"}],42:[function(require,module,exports){
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
        limit: 100,
        mode: "remote",
        fields: {
          geo: 1
        }
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
      if (radius > 1000) {
        return;
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


},{"../Page":35,"./SourcePage":41,"../ItemTracker":14,"../LocationFinder":33,"../GeoJSON":6}],46:[function(require,module,exports){
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
      return ctx.auth.insert("tests") && ctx.login.user;
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
        started: new Date().toISOString(),
        user: this.login.user,
        org: this.login.org
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


},{"./TestPage":44,"../Page":35}],45:[function(require,module,exports){
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
            if (!_this.auth.update("source_notes", sourceNote)) {
              return _this.pager.closePage();
            }
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


},{"../Page":35,"../forms":"EAVIrc"}],43:[function(require,module,exports){
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
        if (!_this.auth.update("sources", source)) {
          return _this.pager.closePage();
        }
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


},{"../Page":35,"../forms":"EAVIrc"}],44:[function(require,module,exports){
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
      this.setTitle("Water Test");
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
          if (!_this.auth.update("tests", test)) {
            _this.$("#edit_button").hide();
          }
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


},{"../Page":35,"../forms":"EAVIrc"}]},{},[3,5,7,11,15,13,16,19,1,17,21,10])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL3Rlc3QvUHJvYmxlbVJlcG9ydGVyVGVzdHMuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My90ZXN0L0Ryb3Bkb3duUXVlc3Rpb25UZXN0cy5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL3Rlc3QvR2VvSlNPTlRlc3RzLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvdGVzdC9IeWJyaWREYlRlc3RzLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvdGVzdC9JbWFnZVF1ZXN0aW9uVGVzdHMuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My90ZXN0L0l0ZW1UcmFja2VyVGVzdHMuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My90ZXN0L0ltYWdlc1F1ZXN0aW9uc1Rlc3RzLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvdGVzdC9Mb2NhbERiVGVzdHMuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My90ZXN0L1JlbW90ZURiVGVzdHMuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My90ZXN0L0xvY2F0aW9uVmlld1Rlc3RzLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvdGVzdC9kYl9xdWVyaWVzLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvdGVzdC9hdXRoVGVzdHMuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvZm9ybXMvaW5kZXguY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvUHJvYmxlbVJlcG9ydGVyLmpzIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My90ZXN0L2hlbHBlcnMvVUlEcml2ZXIuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvR2VvSlNPTi5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9JdGVtVHJhY2tlci5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9hdXRoLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL2RiL1JlbW90ZURiLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL0xvY2F0aW9uVmlldy5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9kYi9IeWJyaWREYi5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9wYWdlcy9JbWFnZVBhZ2UuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvZGIvTG9jYWxEYi5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9mb3Jtcy9mb3JtLWNvbnRyb2xzLmpzIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvZm9ybXMvUXVlc3Rpb25Hcm91cC5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9mb3Jtcy9TYXZlQ2FuY2VsRm9ybS5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9mb3Jtcy9JbnN0cnVjdGlvbnMuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvZm9ybXMvRGF0ZVF1ZXN0aW9uLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL2Zvcm1zL051bWJlclF1ZXN0aW9uLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL2Zvcm1zL0Ryb3Bkb3duUXVlc3Rpb24uY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvZm9ybXMvU291cmNlUXVlc3Rpb24uY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvZm9ybXMvSW1hZ2VRdWVzdGlvbi5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9mb3Jtcy9JbWFnZXNRdWVzdGlvbi5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9Mb2NhdGlvbkZpbmRlci5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9QYWdlLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL3NvdXJjZWNvZGVzLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL2RiL3NlbGVjdG9yLmpzIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvZGIvdXRpbHMuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvcGFnZXMvU291cmNlTGlzdFBhZ2UuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvZGIvRUpTT04uanMiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9wYWdlcy9OZXdTb3VyY2VQYWdlLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL3BhZ2VzL1NvdXJjZVBhZ2UuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvcGFnZXMvU291cmNlTWFwUGFnZS5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9wYWdlcy9OZXdUZXN0UGFnZS5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9wYWdlcy9Tb3VyY2VOb3RlUGFnZS5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9wYWdlcy9Tb3VyY2VFZGl0UGFnZS5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9wYWdlcy9UZXN0UGFnZS5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0NBQUEsS0FBQSxpQkFBQTs7Q0FBQSxDQUFBLENBQVMsQ0FBSSxFQUFiOztDQUFBLENBQ0EsQ0FBa0IsSUFBQSxRQUFsQixZQUFrQjs7Q0FEbEIsQ0FHQSxDQUE0QixLQUE1QixDQUE0QixRQUE1QjtDQUNFLEVBQU8sQ0FBUCxFQUFBLEdBQU87Q0FDTCxRQUFBLENBQUE7Q0FBQSxFQUFZLEdBQVosR0FBQTtDQUNFLEtBQUEsU0FBTztDQURULE1BQVk7Q0FBWixFQUVtQixDQUFsQixDQUZELENBRUEsQ0FBMEIsUUFBMUI7Q0FDQyxDQUFELENBQVUsQ0FBVCxDQUFTLElBQUEsSUFBVixFQUFVLHdCQUFBO0NBSlosSUFBTztDQUFQLEVBS00sQ0FBTixDQUFBLElBQU07Q0FDSixDQUFHLEVBQUYsRUFBRCxDQUFBO0NBQ08sQ0FBcUIsRUFBQyxDQUE3QixDQUFNLENBQWMsTUFBcEIsRUFBQTtDQUZGLElBQU07Q0FJSCxDQUFILENBQW1DLE1BQUEsRUFBbkMsbUJBQUE7Q0FDRSxHQUFBLE1BQUE7Q0FBQSxDQUFxQixDQUFkLENBQVAsQ0FBWSxDQUFaO0NBQUEsSUFDQSxDQUFBLENBQU8sYUFBUDtDQURBLEdBR2tCLEVBQWxCLElBQUE7Q0FIQSxDQUlzQyxFQUFyQixDQUFqQixDQUFBLENBQUE7Q0FKQSxDQUtx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QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0VkE7Q0FBQSxDQUFBLENBQWlCLENBQWEsRUFBeEIsQ0FBTixDQUF5QjtDQUN2QixDQUFZLENBQUEsQ0FBWixLQUFZLENBQVo7Q0FDRSxFQUFZLENBQVgsRUFBRCxDQUFvQixDQUFwQjtDQUNDLEdBQUEsRUFBRCxPQUFBO0NBRkYsSUFBWTtDQUFaLENBSVUsQ0FBQSxDQUFWLElBQUEsQ0FBVTtDQUVSLElBQUEsS0FBQTtDQUFBLENB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Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzF0QkE7Q0FBQSxLQUFBLDBGQUFBOztDQUFBLENBQUEsQ0FBMEIsSUFBQSxLQUFBLFdBQTFCOztDQUFBLENBQ0EsQ0FBYyxJQUFBLElBQWQsQ0FBYzs7Q0FEZCxDQUVBLENBQVUsSUFBVixLQUFVOztDQUZWLENBS0EsQ0FBc0IsRUFBQSxFQUFmLENBQWUsQ0FBQyxFQUF2QjtDQUNFLE9BQUE7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QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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O0NBQ0wsR0FBQyxFQUFEO0NBQ0MsR0FBQSxDQUFLLElBQU4sSUFBQTtDQXpERixJQXVETzs7Q0F2RFAsRUEyRFcsTUFBWDtDQUVFLFNBQUEsRUFBQTtDQUFBLEVBQXNCLENBQXJCLEVBQUQsR0FBQSxFQUFzQjtDQUNyQixDQUFFLENBQXFCLENBQXZCLENBQVEsQ0FBVCxHQUF3QixJQUF4QjtDQUE0QixJQUFBLENBQUQsU0FBQTtDQUEzQixNQUF3QjtDQTlEMUIsSUEyRFc7O0NBM0RYLEVBZ0VZLE1BQUEsQ0FBWjtDQUNFLFNBQUEsRUFBQTtDQUFBLEdBQUcsRUFBSCxDQUFHLG1CQUFBO0NBQ0EsQ0FBRSxDQUFILENBQUMsQ0FBUSxDQUFULEdBQTRCLE1BQTVCO0NBQ0UsRUFBUSxDQUFSLENBQUMsS0FBRDtDQUFBLElBQ0MsSUFBRCxDQUFBO0NBQ0MsQ0FBNEIsR0FBNUIsSUFBRCxLQUFBLEdBQUE7Q0FIRixRQUE0QjtRQUZwQjtDQWhFWixJQWdFWTs7Q0FoRVo7O0NBRHFCOztDQUh2QixDQTJFQSxDQUFpQixHQUFYLENBQU4sQ0EzRUE7Q0FBQSIsInNvdXJjZXNDb250ZW50IjpbImFzc2VydCA9IGNoYWkuYXNzZXJ0XG5Qcm9ibGVtUmVwb3J0ZXIgPSByZXF1aXJlICcuLi9hcHAvanMvUHJvYmxlbVJlcG9ydGVyJ1xuXG5kZXNjcmliZSBcIlByb2JsZW1SZXBvcnRlclwiLCAtPlxuICBiZWZvcmUgLT5cbiAgICBnZXRDbGllbnQgPSAtPlxuICAgICAgcmV0dXJuIFwiMTIzNFwiXG4gICAgQG9sZENvbnNvbGVFcnJvciA9IGNvbnNvbGUuZXJyb3JcbiAgICBAcHIgPSBuZXcgUHJvYmxlbVJlcG9ydGVyKFwiaHR0cDovL2xvY2FsaG9zdDo4MDgwL3Byb2JsZW1fcmVwb3J0c1wiLCBcIjEuMlwiLCBnZXRDbGllbnQpXG4gIGFmdGVyIC0+XG4gICAgQHByLnJlc3RvcmUoKVxuICAgIGFzc2VydC5lcXVhbCBjb25zb2xlLmVycm9yLCBAb2xkQ29uc29sZUVycm9yXG5cbiAgaXQgXCJwb3N0cyBlcnJvciBvbiBjb25zb2xlLmVycm9yXCIsIC0+XG4gICAgcG9zdCA9IHNpbm9uLnN0dWIoJCwgXCJwb3N0XCIpXG4gICAgY29uc29sZS5lcnJvciBcIlNvbWUgZXJyb3IgbWVzc2FnZVwiXG5cbiAgICBhc3NlcnQuaXNUcnVlIHBvc3QuY2FsbGVkT25jZVxuICAgIGFzc2VydC5lcXVhbCBwb3N0LmFyZ3NbMF1bMV0udmVyc2lvbiwgXCIxLjJcIlxuICAgIGFzc2VydC5lcXVhbCBwb3N0LmFyZ3NbMF1bMV0uY2xpZW50LCBcIjEyMzRcIlxuXG4gICAgcG9zdC5yZXN0b3JlKClcbiIsImFzc2VydCA9IGNoYWkuYXNzZXJ0XG5Ecm9wZG93blF1ZXN0aW9uID0gcmVxdWlyZSgnZm9ybXMnKS5Ecm9wZG93blF1ZXN0aW9uXG5VSURyaXZlciA9IHJlcXVpcmUgJy4vaGVscGVycy9VSURyaXZlcidcblxuIyBjbGFzcyBNb2NrTG9jYXRpb25GaW5kZXJcbiMgICBjb25zdHJ1Y3RvcjogIC0+XG4jICAgICBfLmV4dGVuZCBALCBCYWNrYm9uZS5FdmVudHNcblxuIyAgIGdldExvY2F0aW9uOiAtPlxuIyAgIHN0YXJ0V2F0Y2g6IC0+XG4jICAgc3RvcFdhdGNoOiAtPlxuXG5kZXNjcmliZSAnRHJvcGRvd25RdWVzdGlvbicsIC0+XG4gIGNvbnRleHQgJ1dpdGggYSBmZXcgb3B0aW9ucycsIC0+XG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgQG1vZGVsID0gbmV3IEJhY2tib25lLk1vZGVsKClcbiAgICAgIEBxdWVzdGlvbiA9IG5ldyBEcm9wZG93blF1ZXN0aW9uXG4gICAgICAgIG9wdGlvbnM6IFtbJ2EnLCAnQXBwbGUnXSwgWydiJywgJ0JhbmFuYSddXVxuICAgICAgICBtb2RlbDogQG1vZGVsXG4gICAgICAgIGlkOiBcInExXCJcblxuICAgIGl0ICdhY2NlcHRzIGtub3duIHZhbHVlJywgLT5cbiAgICAgIEBtb2RlbC5zZXQocTE6ICdhJylcbiAgICAgIGFzc2VydC5lcXVhbCBAbW9kZWwuZ2V0KCdxMScpLCAnYSdcbiAgICAgIGFzc2VydC5pc0ZhbHNlIEBxdWVzdGlvbi4kKFwic2VsZWN0XCIpLmlzKFwiOmRpc2FibGVkXCIpXG5cbiAgICBpdCAnaXMgZGlzYWJsZWQgd2l0aCB1bmtub3duIHZhbHVlJywgLT5cbiAgICAgIEBtb2RlbC5zZXQocTE6ICd4JylcbiAgICAgIGFzc2VydC5lcXVhbCBAbW9kZWwuZ2V0KCdxMScpLCAneCdcbiAgICAgIGFzc2VydC5pc1RydWUgQHF1ZXN0aW9uLiQoXCJzZWxlY3RcIikuaXMoXCI6ZGlzYWJsZWRcIilcblxuICAgIGl0ICdpcyBub3QgZGlzYWJsZWQgd2l0aCBlbXB0eSB2YWx1ZScsIC0+XG4gICAgICBAbW9kZWwuc2V0KHExOiBudWxsKVxuICAgICAgYXNzZXJ0LmVxdWFsIEBtb2RlbC5nZXQoJ3ExJyksIG51bGxcbiAgICAgIGFzc2VydC5pc0ZhbHNlIEBxdWVzdGlvbi4kKFwic2VsZWN0XCIpLmlzKFwiOmRpc2FibGVkXCIpXG5cbiAgICBpdCAnaXMgcmVlbmFibGVkIHdpdGggc2V0dGluZyB2YWx1ZScsIC0+XG4gICAgICBAbW9kZWwuc2V0KHExOiAneCcpXG4gICAgICBhc3NlcnQuZXF1YWwgQG1vZGVsLmdldCgncTEnKSwgJ3gnXG4gICAgICBAcXVlc3Rpb24uc2V0T3B0aW9ucyhbWydhJywgJ0FwcGxlJ10sIFsnYicsICdCYW5hbmEnXSwgWyd4JywgJ0tpd2knXV0pXG4gICAgICBhc3NlcnQuaXNGYWxzZSBAcXVlc3Rpb24uJChcInNlbGVjdFwiKS5pcyhcIjpkaXNhYmxlZFwiKVxuXG4iLCJhc3NlcnQgPSBjaGFpLmFzc2VydFxuR2VvSlNPTiA9IHJlcXVpcmUgXCIuLi9hcHAvanMvR2VvSlNPTlwiXG5cbmRlc2NyaWJlICdHZW9KU09OJywgLT5cbiAgaXQgJ3JldHVybnMgYSBwcm9wZXIgcG9seWdvbicsIC0+XG4gICAgc291dGhXZXN0ID0gbmV3IEwuTGF0TG5nKDEwLCAyMClcbiAgICBub3J0aEVhc3QgPSBuZXcgTC5MYXRMbmcoMTMsIDIzKVxuICAgIGJvdW5kcyA9IG5ldyBMLkxhdExuZ0JvdW5kcyhzb3V0aFdlc3QsIG5vcnRoRWFzdClcblxuICAgIGpzb24gPSBHZW9KU09OLmxhdExuZ0JvdW5kc1RvR2VvSlNPTihib3VuZHMpXG4gICAgYXNzZXJ0IF8uaXNFcXVhbCBqc29uLCB7XG4gICAgICB0eXBlOiBcIlBvbHlnb25cIixcbiAgICAgIGNvb3JkaW5hdGVzOiBbXG4gICAgICAgIFtbMjAsMTBdLFsyMCwxM10sWzIzLDEzXSxbMjMsMTBdLFsyMCwxMF1dXG4gICAgICBdXG4gICAgfVxuXG4gIGl0ICdnZXRzIHJlbGF0aXZlIGxvY2F0aW9uIE4nLCAtPlxuICAgIGZyb20gPSB7IHR5cGU6IFwiUG9pbnRcIiwgY29vcmRpbmF0ZXM6IFsxMCwgMjBdfVxuICAgIHRvID0geyB0eXBlOiBcIlBvaW50XCIsIGNvb3JkaW5hdGVzOiBbMTAsIDIxXX1cbiAgICBzdHIgPSBHZW9KU09OLmdldFJlbGF0aXZlTG9jYXRpb24oZnJvbSwgdG8pXG4gICAgYXNzZXJ0LmVxdWFsIHN0ciwgJzExMS4ya20gTidcblxuICBpdCAnZ2V0cyByZWxhdGl2ZSBsb2NhdGlvbiBTJywgLT5cbiAgICBmcm9tID0geyB0eXBlOiBcIlBvaW50XCIsIGNvb3JkaW5hdGVzOiBbMTAsIDIwXX1cbiAgICB0byA9IHsgdHlwZTogXCJQb2ludFwiLCBjb29yZGluYXRlczogWzEwLCAxOV19XG4gICAgc3RyID0gR2VvSlNPTi5nZXRSZWxhdGl2ZUxvY2F0aW9uKGZyb20sIHRvKVxuICAgIGFzc2VydC5lcXVhbCBzdHIsICcxMTEuMmttIFMnXG4iLCJhc3NlcnQgPSBjaGFpLmFzc2VydFxuTG9jYWxEYiA9IHJlcXVpcmUgXCIuLi9hcHAvanMvZGIvTG9jYWxEYlwiXG5IeWJyaWREYiA9IHJlcXVpcmUgXCIuLi9hcHAvanMvZGIvSHlicmlkRGJcIlxuZGJfcXVlcmllcyA9IHJlcXVpcmUgXCIuL2RiX3F1ZXJpZXNcIlxuXG4jIE5vdGU6IEFzc3VtZXMgbG9jYWwgZGIgaXMgc3luY2hyb25vdXMhXG5mYWlsID0gLT5cbiAgdGhyb3cgbmV3IEVycm9yKFwiZmFpbGVkXCIpXG5cbmRlc2NyaWJlICdIeWJyaWREYicsIC0+XG4gIGJlZm9yZUVhY2ggLT5cbiAgICBAbG9jYWwgPSBuZXcgTG9jYWxEYigpXG4gICAgQHJlbW90ZSA9IG5ldyBMb2NhbERiKClcbiAgICBAaHlicmlkID0gbmV3IEh5YnJpZERiKEBsb2NhbCwgQHJlbW90ZSlcblxuICAgIEBsYyA9IEBsb2NhbC5hZGRDb2xsZWN0aW9uKFwic2NyYXRjaFwiKVxuICAgIEByYyA9IEByZW1vdGUuYWRkQ29sbGVjdGlvbihcInNjcmF0Y2hcIilcbiAgICBAaGMgPSBAaHlicmlkLmFkZENvbGxlY3Rpb24oXCJzY3JhdGNoXCIpXG5cbiAgY29udGV4dCBcImh5YnJpZCBtb2RlXCIsIC0+XG4gICAgaXQgXCJmaW5kIGdpdmVzIG9ubHkgb25lIHJlc3VsdCBpZiBkYXRhIHVuY2hhbmdlZFwiLCAoZG9uZSkgLT5cbiAgICAgIEBsYy5zZWVkKF9pZDpcIjFcIiwgYToxKVxuICAgICAgQGxjLnNlZWQoX2lkOlwiMlwiLCBhOjIpXG5cbiAgICAgIEByYy5zZWVkKF9pZDpcIjFcIiwgYToxKVxuICAgICAgQHJjLnNlZWQoX2lkOlwiMlwiLCBhOjIpXG5cbiAgICAgIGNhbGxzID0gMFxuICAgICAgQGhjLmZpbmQoe30pLmZldGNoIChkYXRhKSAtPlxuICAgICAgICBjYWxscyArPSAxXG4gICAgICAgIGFzc2VydC5lcXVhbCBkYXRhLmxlbmd0aCwgMlxuICAgICAgICBhc3NlcnQuZXF1YWwgY2FsbHMsIDFcbiAgICAgICAgZG9uZSgpXG4gICAgICAsIGZhaWxcblxuICAgIGl0IFwibG9jYWwgdXBzZXJ0cyBhcmUgcmVzcGVjdGVkXCIsIChkb25lKSAtPlxuICAgICAgQGxjLnNlZWQoX2lkOlwiMVwiLCBhOjEpXG4gICAgICBAbGMudXBzZXJ0KF9pZDpcIjJcIiwgYToyKVxuXG4gICAgICBAcmMuc2VlZChfaWQ6XCIxXCIsIGE6MSlcbiAgICAgIEByYy5zZWVkKF9pZDpcIjJcIiwgYTo0KVxuXG4gICAgICBAaGMuZmluZE9uZSB7IF9pZDogXCIyXCJ9LCAoZG9jKSAtPlxuICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIGRvYywgeyBfaWQ6IFwiMlwiLCBhOiAyIH1cbiAgICAgICAgZG9uZSgpXG4gICAgICAsIGZhaWxcblxuICAgIGl0IFwiZmluZCBwZXJmb3JtcyBmdWxsIGZpZWxkIHJlbW90ZSBxdWVyaWVzIGluIGh5YnJpZCBtb2RlXCIsIChkb25lKSAtPlxuICAgICAgQHJjLnNlZWQoX2lkOlwiMVwiLCBhOjEsIGI6MTEpXG4gICAgICBAcmMuc2VlZChfaWQ6XCIyXCIsIGE6MiwgYjoxMilcblxuICAgICAgQGhjLmZpbmQoe30sIHsgZmllbGRzOiB7IGI6MCB9IH0pLmZldGNoIChkYXRhKSA9PlxuICAgICAgICBpZiBkYXRhLmxlbmd0aCA9PSAwXG4gICAgICAgICAgcmV0dXJuXG4gICAgICAgIGFzc2VydC5pc1VuZGVmaW5lZCBkYXRhWzBdLmJcbiAgICAgICAgQGxjLmZpbmRPbmUgeyBfaWQ6IFwiMVwiIH0sIChkb2MpIC0+XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsIGRvYy5iLCAxMVxuICAgICAgICAgIGRvbmUoKVxuXG4gICAgaXQgXCJmaW5kT25lIHBlcmZvcm1zIGZ1bGwgZmllbGQgcmVtb3RlIHF1ZXJpZXMgaW4gaHlicmlkIG1vZGVcIiwgKGRvbmUpIC0+XG4gICAgICBAcmMuc2VlZChfaWQ6XCIxXCIsIGE6MSwgYjoxMSlcbiAgICAgIEByYy5zZWVkKF9pZDpcIjJcIiwgYToyLCBiOjEyKVxuXG4gICAgICBAaGMuZmluZE9uZSB7IF9pZDogXCIxXCIgfSwgeyBmaWVsZHM6IHsgYjowIH0gfSwgKGRvYykgPT5cbiAgICAgICAgYXNzZXJ0LmlzVW5kZWZpbmVkIGRvYy5iXG4gICAgICAgIEBsYy5maW5kT25lIHsgX2lkOiBcIjFcIiB9LCAoZG9jKSAtPlxuICAgICAgICAgIGFzc2VydC5lcXVhbCBkb2MuYiwgMTFcbiAgICAgICAgICBkb25lKClcblxuICAgIGl0IFwiZmluZCBnaXZlcyByZXN1bHRzIHR3aWNlIGlmIHJlbW90ZSBnaXZlcyBkaWZmZXJlbnQgYW5zd2VyXCIsIChkb25lKSAtPlxuICAgICAgQGxjLnNlZWQoX2lkOlwiMVwiLCBhOjEpXG4gICAgICBAbGMuc2VlZChfaWQ6XCIyXCIsIGE6MilcblxuICAgICAgQHJjLnNlZWQoX2lkOlwiMVwiLCBhOjMpXG4gICAgICBAcmMuc2VlZChfaWQ6XCIyXCIsIGE6NClcblxuICAgICAgY2FsbHMgPSAwXG4gICAgICBAaGMuZmluZCh7fSkuZmV0Y2ggKGRhdGEpIC0+XG4gICAgICAgIGFzc2VydC5lcXVhbCBkYXRhLmxlbmd0aCwgMlxuICAgICAgICBjYWxscyA9IGNhbGxzICsgMVxuICAgICAgICBpZiBjYWxscyA+PTJcbiAgICAgICAgICBkb25lKClcbiAgICAgICwgZmFpbFxuXG4gICAgaXQgXCJmaW5kIGdpdmVzIHJlc3VsdHMgb25jZSBpZiByZW1vdGUgZ2l2ZXMgc2FtZSBhbnN3ZXIgd2l0aCBzb3J0IGRpZmZlcmVuY2VzXCIsIChkb25lKSAtPlxuICAgICAgQGxjLnNlZWQoX2lkOlwiMVwiLCBhOjEpXG4gICAgICBAbGMuc2VlZChfaWQ6XCIyXCIsIGE6MilcblxuICAgICAgQHJjLmZpbmQgPSAoKSA9PlxuICAgICAgICByZXR1cm4gZmV0Y2g6IChzdWNjZXNzKSA9PlxuICAgICAgICAgIHN1Y2Nlc3MoW3tfaWQ6XCIyXCIsIGE6Mn0sIHtfaWQ6XCIxXCIsIGE6MX1dKVxuXG4gICAgICBAaGMuZmluZCh7fSkuZmV0Y2ggKGRhdGEpIC0+XG4gICAgICAgIGFzc2VydC5lcXVhbCBkYXRhLmxlbmd0aCwgMlxuICAgICAgICBkb25lKClcbiAgICAgICwgZmFpbFxuXG4gICAgaXQgXCJmaW5kT25lIGdpdmVzIHJlc3VsdHMgdHdpY2UgaWYgcmVtb3RlIGdpdmVzIGRpZmZlcmVudCBhbnN3ZXJcIiwgKGRvbmUpIC0+XG4gICAgICBAbGMuc2VlZChfaWQ6XCIxXCIsIGE6MSlcbiAgICAgIEBsYy5zZWVkKF9pZDpcIjJcIiwgYToyKVxuXG4gICAgICBAcmMuc2VlZChfaWQ6XCIxXCIsIGE6MylcbiAgICAgIEByYy5zZWVkKF9pZDpcIjJcIiwgYTo0KVxuXG4gICAgICBjYWxscyA9IDBcbiAgICAgIEBoYy5maW5kT25lIHsgX2lkOiBcIjFcIn0sIChkYXRhKSAtPlxuICAgICAgICBjYWxscyA9IGNhbGxzICsgMVxuICAgICAgICBpZiBjYWxscyA9PSAxXG4gICAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCBkYXRhLCB7IF9pZCA6IFwiMVwiLCBhOjEgfVxuICAgICAgICBpZiBjYWxscyA+PSAyXG4gICAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCBkYXRhLCB7IF9pZCA6IFwiMVwiLCBhOjMgfVxuICAgICAgICAgIGRvbmUoKVxuICAgICAgLCBmYWlsXG5cbiAgICBpdCBcImZpbmRPbmUgZ2l2ZXMgcmVzdWx0cyBudWxsIG9uY2UgaWYgcmVtb3RlIGZhaWxzXCIsIChkb25lKSAtPlxuICAgICAgY2FsbGVkID0gMFxuICAgICAgQHJjLmZpbmRPbmUgPSAoc2VsZWN0b3IsIG9wdGlvbnMgPSB7fSwgc3VjY2VzcywgZXJyb3IpIC0+XG4gICAgICAgIGNhbGxlZCA9IGNhbGxlZCArIDFcbiAgICAgICAgZXJyb3IobmV3IEVycm9yKFwiZmFpbFwiKSlcbiAgICAgIEBoYy5maW5kT25lIHsgX2lkOiBcInh5elwifSwgKGRhdGEpIC0+XG4gICAgICAgIGFzc2VydC5lcXVhbCBkYXRhLCBudWxsXG4gICAgICAgIGFzc2VydC5lcXVhbCBjYWxsZWQsIDFcbiAgICAgICAgZG9uZSgpXG4gICAgICAsIGZhaWxcblxuICAgIGl0IFwiY2FjaGVzIHJlbW90ZSBkYXRhXCIsIChkb25lKSAtPlxuICAgICAgQGxjLnNlZWQoX2lkOlwiMVwiLCBhOjEpXG4gICAgICBAbGMuc2VlZChfaWQ6XCIyXCIsIGE6MilcblxuICAgICAgQHJjLnNlZWQoX2lkOlwiMVwiLCBhOjMpXG4gICAgICBAcmMuc2VlZChfaWQ6XCIyXCIsIGE6MilcblxuICAgICAgY2FsbHMgPSAwXG4gICAgICBAaGMuZmluZCh7fSkuZmV0Y2ggKGRhdGEpID0+XG4gICAgICAgIGFzc2VydC5lcXVhbCBkYXRhLmxlbmd0aCwgMlxuICAgICAgICBjYWxscyA9IGNhbGxzICsgMVxuXG4gICAgICAgICMgQWZ0ZXIgc2Vjb25kIGNhbGwsIGNoZWNrIHRoYXQgbG9jYWwgY29sbGVjdGlvbiBoYXMgbGF0ZXN0XG4gICAgICAgIGlmIGNhbGxzID09IDJcbiAgICAgICAgICBAbGMuZmluZCh7fSkuZmV0Y2ggKGRhdGEpID0+XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwgZGF0YS5sZW5ndGgsIDJcbiAgICAgICAgICAgIGFzc2VydC5kZWVwRXF1YWwgXy5wbHVjayhkYXRhLCAnYScpLCBbMywyXVxuICAgICAgICAgICAgZG9uZSgpXG5cbiAgY29udGV4dCBcImxvY2FsIG1vZGVcIiwgLT5cbiAgICBpdCBcImZpbmQgb25seSBjYWxscyBsb2NhbFwiLCAoZG9uZSkgLT5cbiAgICAgIEBsYy5zZWVkKF9pZDpcIjFcIiwgYToxKVxuICAgICAgQGxjLnNlZWQoX2lkOlwiMlwiLCBhOjIpXG5cbiAgICAgIEByYy5zZWVkKF9pZDpcIjFcIiwgYTozKVxuICAgICAgQHJjLnNlZWQoX2lkOlwiMlwiLCBhOjQpXG5cbiAgICAgIEBoYy5maW5kKHt9LCB7bW9kZTpcImxvY2FsXCJ9KS5mZXRjaCAoZGF0YSkgPT5cbiAgICAgICAgYXNzZXJ0LmVxdWFsIGRhdGEubGVuZ3RoLCAyXG4gICAgICAgIGFzc2VydC5kZWVwRXF1YWwgXy5wbHVjayhkYXRhLCAnYScpLCBbMSwyXVxuICAgICAgICBkb25lKClcblxuICAgIGl0IFwiZmluZE9uZSBvbmx5IGNhbGxzIGxvY2FsIGlmIGZvdW5kXCIsIChkb25lKSAtPlxuICAgICAgQGxjLnNlZWQoX2lkOlwiMVwiLCBhOjEpXG4gICAgICBAbGMuc2VlZChfaWQ6XCIyXCIsIGE6MilcblxuICAgICAgQHJjLnNlZWQoX2lkOlwiMVwiLCBhOjMpXG4gICAgICBAcmMuc2VlZChfaWQ6XCIyXCIsIGE6NClcblxuICAgICAgY2FsbHMgPSAwXG4gICAgICBAaGMuZmluZE9uZSB7IF9pZDogXCIxXCIgfSwgeyBtb2RlOiBcImxvY2FsXCIgfSwgKGRhdGEpID0+XG4gICAgICAgIGFzc2VydC5kZWVwRXF1YWwgZGF0YSwgeyBfaWQgOiBcIjFcIiwgYToxIH1cbiAgICAgICAgZG9uZSgpXG4gICAgICAsIGZhaWxcblxuICAgIGl0IFwiZmluZE9uZSBjYWxscyByZW1vdGUgaWYgbm90IGZvdW5kXCIsIChkb25lKSAtPlxuICAgICAgQGxjLnNlZWQoX2lkOlwiMlwiLCBhOjIpXG5cbiAgICAgIEByYy5zZWVkKF9pZDpcIjFcIiwgYTozKVxuICAgICAgQHJjLnNlZWQoX2lkOlwiMlwiLCBhOjQpXG5cbiAgICAgIGNhbGxzID0gMFxuICAgICAgQGhjLmZpbmRPbmUgeyBfaWQ6IFwiMVwifSwgeyBtb2RlOlwibG9jYWxcIiB9LCAoZGF0YSkgPT5cbiAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCBkYXRhLCB7IF9pZCA6IFwiMVwiLCBhOjMgfVxuICAgICAgICBkb25lKClcbiAgICAgICwgZmFpbFxuXG4gIGNvbnRleHQgXCJyZW1vdGUgbW9kZVwiLCAtPlxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgIEBsYy5zZWVkKF9pZDpcIjFcIiwgYToxKVxuICAgICAgQGxjLnNlZWQoX2lkOlwiMlwiLCBhOjIpXG5cbiAgICAgIEByYy5zZWVkKF9pZDpcIjFcIiwgYTozKVxuICAgICAgQHJjLnNlZWQoX2lkOlwiMlwiLCBhOjQpXG5cbiAgICBpdCBcImZpbmQgb25seSBjYWxscyByZW1vdGVcIiwgKGRvbmUpIC0+XG4gICAgICBAaGMuZmluZCh7fSwgeyBtb2RlOiBcInJlbW90ZVwiIH0pLmZldGNoIChkYXRhKSA9PlxuICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIF8ucGx1Y2soZGF0YSwgJ2EnKSwgWzMsNF1cbiAgICAgICAgZG9uZSgpXG5cbiAgICBpdCBcImZpbmQgZG9lcyBub3QgY2FjaGUgcmVzdWx0c1wiLCAoZG9uZSkgLT5cbiAgICAgIEBoYy5maW5kKHt9LCB7IG1vZGU6IFwicmVtb3RlXCIgfSkuZmV0Y2ggKGRhdGEpID0+XG4gICAgICAgIEBsYy5maW5kKHt9KS5mZXRjaCAoZGF0YSkgPT5cbiAgICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIF8ucGx1Y2soZGF0YSwgJ2EnKSwgWzEsMl1cbiAgICAgICAgICBkb25lKClcblxuICAgIGl0IFwiZmluZCBmYWxscyBiYWNrIHRvIGxvY2FsIGlmIHJlbW90ZSBmYWlsc1wiLCAoZG9uZSkgLT5cbiAgICAgIEByYy5maW5kID0gKHNlbGVjdG9yLCBvcHRpb25zKSA9PlxuICAgICAgICByZXR1cm4geyBmZXRjaDogKHN1Y2Nlc3MsIGVycm9yKSAtPlxuICAgICAgICAgIGVycm9yKClcbiAgICAgICAgfVxuICAgICAgQGhjLmZpbmQoe30sIHsgbW9kZTogXCJyZW1vdGVcIiB9KS5mZXRjaCAoZGF0YSkgPT5cbiAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCBfLnBsdWNrKGRhdGEsICdhJyksIFsxLDJdXG4gICAgICAgIGRvbmUoKVxuXG4gICAgaXQgXCJmaW5kIHJlc3BlY3RzIGxvY2FsIHVwc2VydHNcIiwgKGRvbmUpIC0+XG4gICAgICBAbGMudXBzZXJ0KHsgX2lkOlwiMVwiLCBhOjkgfSlcblxuICAgICAgQGhjLmZpbmQoe30sIHsgbW9kZTogXCJyZW1vdGVcIiwgc29ydDogWydfaWQnXSB9KS5mZXRjaCAoZGF0YSkgPT5cbiAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCBfLnBsdWNrKGRhdGEsICdhJyksIFs5LDRdXG4gICAgICAgIGRvbmUoKVxuXG4gICAgaXQgXCJmaW5kIHJlc3BlY3RzIGxvY2FsIHJlbW92ZXNcIiwgKGRvbmUpIC0+XG4gICAgICBAbGMucmVtb3ZlKFwiMVwiKVxuXG4gICAgICBAaGMuZmluZCh7fSwgeyBtb2RlOiBcInJlbW90ZVwiIH0pLmZldGNoIChkYXRhKSA9PlxuICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIF8ucGx1Y2soZGF0YSwgJ2EnKSwgWzRdXG4gICAgICAgIGRvbmUoKVxuICAgIFxuICBpdCBcInVwbG9hZCBhcHBsaWVzIHBlbmRpbmcgdXBzZXJ0cyBhbmQgZGVsZXRlc1wiLCAoZG9uZSkgLT5cbiAgICBAbGMudXBzZXJ0KF9pZDpcIjFcIiwgYToxKVxuICAgIEBsYy51cHNlcnQoX2lkOlwiMlwiLCBhOjIpXG5cbiAgICBAaHlicmlkLnVwbG9hZCgoKSA9PlxuICAgICAgQGxjLnBlbmRpbmdVcHNlcnRzIChkYXRhKSA9PlxuICAgICAgICBhc3NlcnQuZXF1YWwgZGF0YS5sZW5ndGgsIDBcblxuICAgICAgICBAcmMucGVuZGluZ1Vwc2VydHMgKGRhdGEpID0+XG4gICAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCBfLnBsdWNrKGRhdGEsICdhJyksIFsxLDJdXG4gICAgICAgICAgZG9uZSgpXG4gICAgLCBmYWlsKVxuXG4gIGl0IFwia2VlcHMgdXBzZXJ0cyBhbmQgZGVsZXRlcyBpZiBmYWlsZWQgdG8gYXBwbHlcIiwgKGRvbmUpIC0+XG4gICAgQGxjLnVwc2VydChfaWQ6XCIxXCIsIGE6MSlcbiAgICBAbGMudXBzZXJ0KF9pZDpcIjJcIiwgYToyKVxuXG4gICAgQHJjLnVwc2VydCA9IChkb2MsIHN1Y2Nlc3MsIGVycm9yKSA9PlxuICAgICAgZXJyb3IobmV3IEVycm9yKFwiZmFpbFwiKSlcblxuICAgIEBoeWJyaWQudXBsb2FkKCgpID0+XG4gICAgICBhc3NlcnQuZmFpbCgpXG4gICAgLCAoKT0+XG4gICAgICBAbGMucGVuZGluZ1Vwc2VydHMgKGRhdGEpID0+XG4gICAgICAgIGFzc2VydC5lcXVhbCBkYXRhLmxlbmd0aCwgMlxuICAgICAgICBkb25lKClcbiAgICApXG5cbiAgaXQgXCJ1cHNlcnRzIHRvIGxvY2FsIGRiXCIsIChkb25lKSAtPlxuICAgIEBoYy51cHNlcnQoX2lkOlwiMVwiLCBhOjEpXG4gICAgQGxjLnBlbmRpbmdVcHNlcnRzIChkYXRhKSA9PlxuICAgICAgYXNzZXJ0LmVxdWFsIGRhdGEubGVuZ3RoLCAxXG4gICAgICBkb25lKClcblxuICBpdCBcInJlbW92ZXMgdG8gbG9jYWwgZGJcIiwgKGRvbmUpIC0+XG4gICAgQGxjLnNlZWQoX2lkOlwiMVwiLCBhOjEpXG4gICAgQGhjLnJlbW92ZShcIjFcIilcbiAgICBAbGMucGVuZGluZ1JlbW92ZXMgKGRhdGEpID0+XG4gICAgICBhc3NlcnQuZXF1YWwgZGF0YS5sZW5ndGgsIDFcbiAgICAgIGRvbmUoKVxuIiwiYXNzZXJ0ID0gY2hhaS5hc3NlcnRcbmZvcm1zID0gcmVxdWlyZSgnZm9ybXMnKVxuVUlEcml2ZXIgPSByZXF1aXJlICcuL2hlbHBlcnMvVUlEcml2ZXInXG5JbWFnZVBhZ2UgPSByZXF1aXJlICcuLi9hcHAvanMvcGFnZXMvSW1hZ2VQYWdlJ1xuXG5jbGFzcyBNb2NrSW1hZ2VNYW5hZ2VyIFxuICBnZXRJbWFnZVRodW1ibmFpbFVybDogKGltYWdlVWlkLCBzdWNjZXNzLCBlcnJvcikgLT5cbiAgICBzdWNjZXNzIFwiaW1hZ2VzL1wiICsgaW1hZ2VVaWQgKyBcIi5qcGdcIlxuXG4gIGdldEltYWdlVXJsOiAoaW1hZ2VVaWQsIHN1Y2Nlc3MsIGVycm9yKSAtPlxuICAgIHN1Y2Nlc3MgXCJpbWFnZXMvXCIgKyBpbWFnZVVpZCArIFwiLmpwZ1wiXG5cbmNsYXNzIE1vY2tDYW1lcmFcbiAgdGFrZVBpY3R1cmU6IChzdWNjZXNzLCBlcnJvcikgLT5cbiAgICBzdWNjZXNzKFwiaHR0cDovLzEyMzQuanBnXCIpXG5cbmRlc2NyaWJlICdJbWFnZVF1ZXN0aW9uJywgLT5cbiAgYmVmb3JlRWFjaCAtPlxuICAgICMgQ3JlYXRlIG1vZGVsXG4gICAgQG1vZGVsID0gbmV3IEJhY2tib25lLk1vZGVsIFxuXG4gIGNvbnRleHQgJ1dpdGggYSBubyBjYW1lcmEnLCAtPlxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICMgQ3JlYXRlIGNvbnRleHRcbiAgICAgIEBjdHggPSB7XG4gICAgICAgIGltYWdlTWFuYWdlcjogbmV3IE1vY2tJbWFnZU1hbmFnZXIoKVxuICAgICAgfVxuXG4gICAgICBAcXVlc3Rpb24gPSBuZXcgZm9ybXMuSW1hZ2VRdWVzdGlvblxuICAgICAgICBtb2RlbDogQG1vZGVsXG4gICAgICAgIGlkOiBcInExXCJcbiAgICAgICAgY3R4OiBAY3R4XG5cbiAgICBpdCAnZGlzcGxheXMgbm8gaW1hZ2UnLCAtPlxuICAgICAgYXNzZXJ0LmlzVHJ1ZSB0cnVlXG5cbiAgICBpdCAnZGlzcGxheXMgb25lIGltYWdlJywgLT5cbiAgICAgIEBtb2RlbC5zZXQocTE6IHtpZDogXCIxMjM0XCJ9KVxuICAgICAgYXNzZXJ0LmVxdWFsIEBxdWVzdGlvbi4kKFwiaW1nLnRodW1ibmFpbC1pbWdcIikuYXR0cihcInNyY1wiKSwgXCJpbWFnZXMvMTIzNC5qcGdcIlxuXG4gICAgaXQgJ29wZW5zIHBhZ2UnLCAtPlxuICAgICAgQG1vZGVsLnNldChxMToge2lkOiBcIjEyMzRcIn0pXG4gICAgICBzcHkgPSBzaW5vbi5zcHkoKVxuICAgICAgQGN0eC5wYWdlciA9IHsgb3BlblBhZ2U6IHNweSB9XG4gICAgICBAcXVlc3Rpb24uJChcImltZy50aHVtYm5haWwtaW1nXCIpLmNsaWNrKClcblxuICAgICAgYXNzZXJ0LmlzVHJ1ZSBzcHkuY2FsbGVkT25jZVxuICAgICAgYXNzZXJ0LmVxdWFsIHNweS5hcmdzWzBdWzFdLmlkLCBcIjEyMzRcIlxuXG4gICAgaXQgJ2FsbG93cyByZW1vdmluZyBpbWFnZScsIC0+XG4gICAgICBAbW9kZWwuc2V0KHExOiB7aWQ6IFwiMTIzNFwifSlcbiAgICAgIEBjdHgucGFnZXIgPSB7IFxuICAgICAgICBvcGVuUGFnZTogKHBhZ2UsIG9wdGlvbnMpID0+XG4gICAgICAgICAgb3B0aW9ucy5vblJlbW92ZSgpXG4gICAgICB9XG4gICAgICBAcXVlc3Rpb24uJChcImltZy50aHVtYm5haWwtaW1nXCIpLmNsaWNrKClcbiAgICAgIGFzc2VydC5lcXVhbCBAbW9kZWwuZ2V0KFwicTFcIiksIG51bGxcblxuICAgIGl0ICdkaXNwbGF5cyBubyBhZGQnLCAtPlxuICAgICAgYXNzZXJ0LmVxdWFsIEBxdWVzdGlvbi4kKFwiaW1nI2FkZFwiKS5sZW5ndGgsIDBcblxuICBjb250ZXh0ICdXaXRoIGEgY2FtZXJhJywgLT5cbiAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAjIENyZWF0ZSBjb250ZXh0XG4gICAgICBAY3R4ID0ge1xuICAgICAgICBpbWFnZU1hbmFnZXI6IG5ldyBNb2NrSW1hZ2VNYW5hZ2VyKClcbiAgICAgICAgY2FtZXJhOiBuZXcgTW9ja0NhbWVyYSgpXG4gICAgICB9XG5cbiAgICAgIEBxdWVzdGlvbiA9IG5ldyBmb3Jtcy5JbWFnZVF1ZXN0aW9uXG4gICAgICAgIG1vZGVsOiBAbW9kZWxcbiAgICAgICAgaWQ6IFwicTFcIlxuICAgICAgICBjdHg6IEBjdHhcblxuICAgIGl0ICdkaXNwbGF5cyBubyBhZGQgaWYgaW1hZ2UgbWFuYWdlciBoYXMgbm8gYWRkSW1hZ2UnLCAtPlxuICAgICAgYXNzZXJ0LmVxdWFsIEBxdWVzdGlvbi4kKFwiaW1nI2FkZFwiKS5sZW5ndGgsIDBcblxuICBjb250ZXh0ICdXaXRoIGEgY2FtZXJhIGFuZCBpbWFnZU1hbmFnZXIgd2l0aCBhZGRJbWFnZScsIC0+XG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgaW1hZ2VNYW5hZ2VyID0gbmV3IE1vY2tJbWFnZU1hbmFnZXIoKVxuICAgICAgaW1hZ2VNYW5hZ2VyLmFkZEltYWdlID0gKHVybCwgc3VjY2VzcywgZXJyb3IpIC0+XG4gICAgICAgIGFzc2VydC5lcXVhbCB1cmwsIFwiaHR0cDovLzEyMzQuanBnXCJcbiAgICAgICAgc3VjY2VzcyBcIjEyMzRcIlxuXG4gICAgICAjIENyZWF0ZSBjb250ZXh0XG4gICAgICBAY3R4ID0ge1xuICAgICAgICBpbWFnZU1hbmFnZXI6IGltYWdlTWFuYWdlclxuICAgICAgICBjYW1lcmE6IG5ldyBNb2NrQ2FtZXJhKClcbiAgICAgIH1cblxuICAgICAgQHF1ZXN0aW9uID0gbmV3IGZvcm1zLkltYWdlUXVlc3Rpb25cbiAgICAgICAgbW9kZWw6IEBtb2RlbFxuICAgICAgICBpZDogXCJxMVwiXG4gICAgICAgIGN0eDogQGN0eFxuXG4gICAgaXQgJ3Rha2VzIGEgcGhvdG8nLCAtPlxuICAgICAgQGN0eC5jYW1lcmEgPSBuZXcgTW9ja0NhbWVyYSgpXG4gICAgICBAcXVlc3Rpb24uJChcImltZyNhZGRcIikuY2xpY2soKVxuICAgICAgYXNzZXJ0LmlzVHJ1ZSBfLmlzRXF1YWwoQG1vZGVsLmdldChcInExXCIpLCB7aWQ6XCIxMjM0XCJ9KSwgQG1vZGVsLmdldChcInExXCIpXG5cbiAgICBpdCAnbm8gbG9uZ2VyIGhhcyBhZGQgYWZ0ZXIgdGFraW5nIHBob3RvJywgLT5cbiAgICAgIEBjdHguY2FtZXJhID0gbmV3IE1vY2tDYW1lcmEoKVxuICAgICAgQHF1ZXN0aW9uLiQoXCJpbWcjYWRkXCIpLmNsaWNrKClcbiAgICAgIGFzc2VydC5lcXVhbCBAcXVlc3Rpb24uJChcImltZyNhZGRcIikubGVuZ3RoLCAwXG5cbiAgICAiLCJhc3NlcnQgPSBjaGFpLmFzc2VydFxuSXRlbVRyYWNrZXIgPSByZXF1aXJlIFwiLi4vYXBwL2pzL0l0ZW1UcmFja2VyXCJcblxuZGVzY3JpYmUgJ0l0ZW1UcmFja2VyJywgLT5cbiAgYmVmb3JlRWFjaCAtPlxuICAgIEB0cmFja2VyID0gbmV3IEl0ZW1UcmFja2VyKClcblxuICBpdCBcInJlY29yZHMgYWRkc1wiLCAtPlxuICAgIGl0ZW1zID0gIFtcbiAgICAgIF9pZDogMSwgeDoxXG4gICAgICBfaWQ6IDIsIHg6MlxuICAgIF1cbiAgICBbYWRkcywgcmVtb3Zlc10gPSBAdHJhY2tlci51cGRhdGUoaXRlbXMpXG4gICAgYXNzZXJ0LmRlZXBFcXVhbCBhZGRzLCBpdGVtc1xuICAgIGFzc2VydC5kZWVwRXF1YWwgcmVtb3ZlcywgW11cblxuICBpdCBcInJlbWVtYmVycyBpdGVtc1wiLCAtPlxuICAgIGl0ZW1zID0gIFtcbiAgICAgIHtfaWQ6IDEsIHg6MX1cbiAgICAgIHtfaWQ6IDIsIHg6Mn1cbiAgICBdXG4gICAgW2FkZHMsIHJlbW92ZXNdID0gQHRyYWNrZXIudXBkYXRlKGl0ZW1zKVxuICAgIFthZGRzLCByZW1vdmVzXSA9IEB0cmFja2VyLnVwZGF0ZShpdGVtcylcbiAgICBhc3NlcnQuZGVlcEVxdWFsIGFkZHMsIFtdXG4gICAgYXNzZXJ0LmRlZXBFcXVhbCByZW1vdmVzLCBbXVxuXG4gIGl0IFwic2VlcyByZW1vdmVkIGl0ZW1zXCIsIC0+XG4gICAgaXRlbXMxID0gIFtcbiAgICAgIHtfaWQ6IDEsIHg6MX1cbiAgICAgIHtfaWQ6IDIsIHg6Mn1cbiAgICBdXG4gICAgaXRlbXMyID0gIFtcbiAgICAgIHtfaWQ6IDEsIHg6MX1cbiAgICBdXG4gICAgQHRyYWNrZXIudXBkYXRlKGl0ZW1zMSlcbiAgICBbYWRkcywgcmVtb3Zlc10gPSBAdHJhY2tlci51cGRhdGUoaXRlbXMyKVxuICAgIGFzc2VydC5kZWVwRXF1YWwgYWRkcywgW11cbiAgICBhc3NlcnQuZGVlcEVxdWFsIHJlbW92ZXMsIFt7X2lkOiAyLCB4OjJ9XVxuXG4gIGl0IFwic2VlcyByZW1vdmVkIGNoYW5nZXNcIiwgLT5cbiAgICBpdGVtczEgPSAgW1xuICAgICAge19pZDogMSwgeDoxfVxuICAgICAge19pZDogMiwgeDoyfVxuICAgIF1cbiAgICBpdGVtczIgPSAgW1xuICAgICAge19pZDogMSwgeDoxfVxuICAgICAge19pZDogMiwgeDo0fVxuICAgIF1cbiAgICBAdHJhY2tlci51cGRhdGUoaXRlbXMxKVxuICAgIFthZGRzLCByZW1vdmVzXSA9IEB0cmFja2VyLnVwZGF0ZShpdGVtczIpXG4gICAgYXNzZXJ0LmRlZXBFcXVhbCBhZGRzLCBbe19pZDogMiwgeDo0fV1cbiAgICBhc3NlcnQuZGVlcEVxdWFsIHJlbW92ZXMsIFt7X2lkOiAyLCB4OjJ9XVxuIiwiYXNzZXJ0ID0gY2hhaS5hc3NlcnRcbmZvcm1zID0gcmVxdWlyZSgnZm9ybXMnKVxuVUlEcml2ZXIgPSByZXF1aXJlICcuL2hlbHBlcnMvVUlEcml2ZXInXG5JbWFnZVBhZ2UgPSByZXF1aXJlICcuLi9hcHAvanMvcGFnZXMvSW1hZ2VQYWdlJ1xuXG5jbGFzcyBNb2NrSW1hZ2VNYW5hZ2VyIFxuICBnZXRJbWFnZVRodW1ibmFpbFVybDogKGltYWdlVWlkLCBzdWNjZXNzLCBlcnJvcikgLT5cbiAgICBzdWNjZXNzIFwiaW1hZ2VzL1wiICsgaW1hZ2VVaWQgKyBcIi5qcGdcIlxuXG4gIGdldEltYWdlVXJsOiAoaW1hZ2VVaWQsIHN1Y2Nlc3MsIGVycm9yKSAtPlxuICAgIHN1Y2Nlc3MgXCJpbWFnZXMvXCIgKyBpbWFnZVVpZCArIFwiLmpwZ1wiXG5cbmNsYXNzIE1vY2tDYW1lcmFcbiAgdGFrZVBpY3R1cmU6IChzdWNjZXNzLCBlcnJvcikgLT5cbiAgICBzdWNjZXNzKFwiaHR0cDovLzEyMzQuanBnXCIpXG5cbmRlc2NyaWJlICdJbWFnZXNRdWVzdGlvbicsIC0+XG4gIGJlZm9yZUVhY2ggLT5cbiAgICAjIENyZWF0ZSBtb2RlbFxuICAgIEBtb2RlbCA9IG5ldyBCYWNrYm9uZS5Nb2RlbCBcblxuICBjb250ZXh0ICdXaXRoIGEgbm8gY2FtZXJhJywgLT5cbiAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAjIENyZWF0ZSBjb250ZXh0XG4gICAgICBAY3R4ID0ge1xuICAgICAgICBpbWFnZU1hbmFnZXI6IG5ldyBNb2NrSW1hZ2VNYW5hZ2VyKClcbiAgICAgIH1cblxuICAgICAgQHF1ZXN0aW9uID0gbmV3IGZvcm1zLkltYWdlc1F1ZXN0aW9uXG4gICAgICAgIG1vZGVsOiBAbW9kZWxcbiAgICAgICAgaWQ6IFwicTFcIlxuICAgICAgICBjdHg6IEBjdHhcblxuICAgIGl0ICdkaXNwbGF5cyBubyBpbWFnZScsIC0+XG4gICAgICBAbW9kZWwuc2V0KHExOiBbXSlcbiAgICAgIGFzc2VydC5pc1RydWUgdHJ1ZVxuXG4gICAgaXQgJ2Rpc3BsYXlzIG9uZSBpbWFnZScsIC0+XG4gICAgICBAbW9kZWwuc2V0KHExOiBbe2lkOiBcIjEyMzRcIn1dKVxuICAgICAgYXNzZXJ0LmVxdWFsIEBxdWVzdGlvbi4kKFwiaW1nLnRodW1ibmFpbC1pbWdcIikuYXR0cihcInNyY1wiKSwgXCJpbWFnZXMvMTIzNC5qcGdcIlxuXG4gICAgaXQgJ29wZW5zIHBhZ2UnLCAtPlxuICAgICAgQG1vZGVsLnNldChxMTogW3tpZDogXCIxMjM0XCJ9XSlcbiAgICAgIHNweSA9IHNpbm9uLnNweSgpXG4gICAgICBAY3R4LnBhZ2VyID0geyBvcGVuUGFnZTogc3B5IH1cbiAgICAgIEBxdWVzdGlvbi4kKFwiaW1nLnRodW1ibmFpbC1pbWdcIikuY2xpY2soKVxuXG4gICAgICBhc3NlcnQuaXNUcnVlIHNweS5jYWxsZWRPbmNlXG4gICAgICBhc3NlcnQuZXF1YWwgc3B5LmFyZ3NbMF1bMV0uaWQsIFwiMTIzNFwiXG5cbiAgICBpdCAnYWxsb3dzIHJlbW92aW5nIGltYWdlJywgLT5cbiAgICAgIEBtb2RlbC5zZXQocTE6IFt7aWQ6IFwiMTIzNFwifV0pXG4gICAgICBAY3R4LnBhZ2VyID0geyBcbiAgICAgICAgb3BlblBhZ2U6IChwYWdlLCBvcHRpb25zKSA9PlxuICAgICAgICAgIG9wdGlvbnMub25SZW1vdmUoKVxuICAgICAgfVxuICAgICAgQHF1ZXN0aW9uLiQoXCJpbWcudGh1bWJuYWlsLWltZ1wiKS5jbGljaygpXG4gICAgICBhc3NlcnQuZXF1YWwgQHF1ZXN0aW9uLiQoXCJpbWcjYWRkXCIpLmxlbmd0aCwgMFxuXG4gICAgaXQgJ2Rpc3BsYXlzIG5vIGFkZCcsIC0+XG4gICAgICBhc3NlcnQuZXF1YWwgQHF1ZXN0aW9uLiQoXCJpbWcjYWRkXCIpLmxlbmd0aCwgMFxuXG4gIGNvbnRleHQgJ1dpdGggYSBjYW1lcmEnLCAtPlxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICMgQ3JlYXRlIGNvbnRleHRcbiAgICAgIEBjdHggPSB7XG4gICAgICAgIGltYWdlTWFuYWdlcjogbmV3IE1vY2tJbWFnZU1hbmFnZXIoKVxuICAgICAgICBjYW1lcmE6IG5ldyBNb2NrQ2FtZXJhKClcbiAgICAgIH1cblxuICAgICAgQHF1ZXN0aW9uID0gbmV3IGZvcm1zLkltYWdlc1F1ZXN0aW9uXG4gICAgICAgIG1vZGVsOiBAbW9kZWxcbiAgICAgICAgaWQ6IFwicTFcIlxuICAgICAgICBjdHg6IEBjdHhcblxuICAgIGl0ICdkaXNwbGF5cyBubyBhZGQgaWYgaW1hZ2UgbWFuYWdlciBoYXMgbm8gYWRkSW1hZ2UnLCAtPlxuICAgICAgYXNzZXJ0LmVxdWFsIEBxdWVzdGlvbi4kKFwiaW1nI2FkZFwiKS5sZW5ndGgsIDBcblxuICBjb250ZXh0ICdXaXRoIGEgY2FtZXJhIGFuZCBpbWFnZU1hbmFnZXIgd2l0aCBhZGRJbWFnZScsIC0+XG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgaW1hZ2VNYW5hZ2VyID0gbmV3IE1vY2tJbWFnZU1hbmFnZXIoKVxuICAgICAgaW1hZ2VNYW5hZ2VyLmFkZEltYWdlID0gKHVybCwgc3VjY2VzcywgZXJyb3IpIC0+XG4gICAgICAgIGFzc2VydC5lcXVhbCB1cmwsIFwiaHR0cDovLzEyMzQuanBnXCJcbiAgICAgICAgc3VjY2VzcyBcIjEyMzRcIlxuXG4gICAgICAjIENyZWF0ZSBjb250ZXh0XG4gICAgICBAY3R4ID0ge1xuICAgICAgICBpbWFnZU1hbmFnZXI6IGltYWdlTWFuYWdlclxuICAgICAgICBjYW1lcmE6IG5ldyBNb2NrQ2FtZXJhKClcbiAgICAgIH1cblxuICAgICAgQHF1ZXN0aW9uID0gbmV3IGZvcm1zLkltYWdlc1F1ZXN0aW9uXG4gICAgICAgIG1vZGVsOiBAbW9kZWxcbiAgICAgICAgaWQ6IFwicTFcIlxuICAgICAgICBjdHg6IEBjdHhcblxuICAgIGl0ICd0YWtlcyBhIHBob3RvJywgLT5cbiAgICAgIEBjdHguY2FtZXJhID0gbmV3IE1vY2tDYW1lcmEoKVxuICAgICAgQHF1ZXN0aW9uLiQoXCJpbWcjYWRkXCIpLmNsaWNrKClcbiAgICAgIGFzc2VydC5pc1RydWUgXy5pc0VxdWFsKEBtb2RlbC5nZXQoXCJxMVwiKSwgW3tpZDpcIjEyMzRcIn1dKSwgQG1vZGVsLmdldChcInExXCIpXG5cbiAgICAiLCJhc3NlcnQgPSBjaGFpLmFzc2VydFxuTG9jYWxEYiA9IHJlcXVpcmUgXCIuLi9hcHAvanMvZGIvTG9jYWxEYlwiXG5kYl9xdWVyaWVzID0gcmVxdWlyZSBcIi4vZGJfcXVlcmllc1wiXG5cbmRlc2NyaWJlICdMb2NhbERiJywgLT5cbiAgYmVmb3JlIC0+XG4gICAgQGRiID0gbmV3IExvY2FsRGIoJ3NjcmF0Y2gnKVxuXG4gIGJlZm9yZUVhY2ggKGRvbmUpIC0+XG4gICAgQGRiLnJlbW92ZUNvbGxlY3Rpb24oJ3NjcmF0Y2gnKVxuICAgIEBkYi5hZGRDb2xsZWN0aW9uKCdzY3JhdGNoJylcbiAgICBkb25lKClcblxuICBkZXNjcmliZSBcInBhc3NlcyBxdWVyaWVzXCIsIC0+XG4gICAgZGJfcXVlcmllcy5jYWxsKHRoaXMpXG5cbiAgaXQgJ2NhY2hlcyByb3dzJywgKGRvbmUpIC0+XG4gICAgQGRiLnNjcmF0Y2guY2FjaGUgW3sgX2lkOiAxLCBhOiAnYXBwbGUnIH1dLCB7fSwge30sID0+XG4gICAgICBAZGIuc2NyYXRjaC5maW5kKHt9KS5mZXRjaCAocmVzdWx0cykgLT5cbiAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHNbMF0uYSwgJ2FwcGxlJ1xuICAgICAgICBkb25lKClcblxuICBpdCAnY2FjaGUgb3ZlcndyaXRlIGV4aXN0aW5nJywgKGRvbmUpIC0+XG4gICAgQGRiLnNjcmF0Y2guY2FjaGUgW3sgX2lkOiAxLCBhOiAnYXBwbGUnIH1dLCB7fSwge30sID0+XG4gICAgICBAZGIuc2NyYXRjaC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdiYW5hbmEnIH1dLCB7fSwge30sID0+XG4gICAgICAgIEBkYi5zY3JhdGNoLmZpbmQoe30pLmZldGNoIChyZXN1bHRzKSAtPlxuICAgICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzWzBdLmEsICdiYW5hbmEnXG4gICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJjYWNoZSBkb2Vzbid0IG92ZXJ3cml0ZSB1cHNlcnRcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnNjcmF0Y2gudXBzZXJ0IHsgX2lkOiAxLCBhOiAnYXBwbGUnIH0sID0+XG4gICAgICBAZGIuc2NyYXRjaC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdiYW5hbmEnIH1dLCB7fSwge30sID0+XG4gICAgICAgIEBkYi5zY3JhdGNoLmZpbmQoe30pLmZldGNoIChyZXN1bHRzKSAtPlxuICAgICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzWzBdLmEsICdhcHBsZSdcbiAgICAgICAgICBkb25lKClcblxuICBpdCBcImNhY2hlIGRvZXNuJ3Qgb3ZlcndyaXRlIHJlbW92ZVwiLCAoZG9uZSkgLT5cbiAgICBAZGIuc2NyYXRjaC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdkZWxldGUnIH1dLCB7fSwge30sID0+XG4gICAgICBAZGIuc2NyYXRjaC5yZW1vdmUgMSwgPT5cbiAgICAgIEBkYi5zY3JhdGNoLmNhY2hlIFt7IF9pZDogMSwgYTogJ2JhbmFuYScgfV0sIHt9LCB7fSwgPT5cbiAgICAgICAgQGRiLnNjcmF0Y2guZmluZCh7fSkuZmV0Y2ggKHJlc3VsdHMpIC0+XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHMubGVuZ3RoLCAwXG4gICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJjYWNoZSByZW1vdmVzIG1pc3NpbmcgdW5zb3J0ZWRcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnNjcmF0Y2guY2FjaGUgW3sgX2lkOiAxLCBhOiAnYScgfSwgeyBfaWQ6IDIsIGE6ICdiJyB9LCB7IF9pZDogMywgYTogJ2MnIH1dLCB7fSwge30sID0+XG4gICAgICBAZGIuc2NyYXRjaC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdhJyB9LCB7IF9pZDogMywgYTogJ2MnIH1dLCB7fSwge30sID0+XG4gICAgICAgIEBkYi5zY3JhdGNoLmZpbmQoe30pLmZldGNoIChyZXN1bHRzKSAtPlxuICAgICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzLmxlbmd0aCwgMlxuICAgICAgICAgIGRvbmUoKVxuXG4gIGl0IFwiY2FjaGUgcmVtb3ZlcyBtaXNzaW5nIGZpbHRlcmVkXCIsIChkb25lKSAtPlxuICAgIEBkYi5zY3JhdGNoLmNhY2hlIFt7IF9pZDogMSwgYTogJ2EnIH0sIHsgX2lkOiAyLCBhOiAnYicgfSwgeyBfaWQ6IDMsIGE6ICdjJyB9XSwge30sIHt9LCA9PlxuICAgICAgQGRiLnNjcmF0Y2guY2FjaGUgW3sgX2lkOiAxLCBhOiAnYScgfV0sIHtfaWQ6IHskbHQ6M319LCB7fSwgPT5cbiAgICAgICAgQGRiLnNjcmF0Y2guZmluZCh7fSwge3NvcnQ6WydfaWQnXX0pLmZldGNoIChyZXN1bHRzKSAtPlxuICAgICAgICAgIGFzc2VydC5kZWVwRXF1YWwgXy5wbHVjayhyZXN1bHRzLCAnX2lkJyksIFsxLDNdXG4gICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJjYWNoZSByZW1vdmVzIG1pc3Npbmcgc29ydGVkIGxpbWl0ZWRcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnNjcmF0Y2guY2FjaGUgW3sgX2lkOiAxLCBhOiAnYScgfSwgeyBfaWQ6IDIsIGE6ICdiJyB9LCB7IF9pZDogMywgYTogJ2MnIH1dLCB7fSwge30sID0+XG4gICAgICBAZGIuc2NyYXRjaC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdhJyB9XSwge30sIHtzb3J0OlsnX2lkJ10sIGxpbWl0OjJ9LCA9PlxuICAgICAgICBAZGIuc2NyYXRjaC5maW5kKHt9LCB7c29ydDpbJ19pZCddfSkuZmV0Y2ggKHJlc3VsdHMpIC0+XG4gICAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCBfLnBsdWNrKHJlc3VsdHMsICdfaWQnKSwgWzEsM11cbiAgICAgICAgICBkb25lKClcblxuICBpdCBcImNhY2hlIGRvZXMgbm90IHJlbW92ZSBtaXNzaW5nIHNvcnRlZCBsaW1pdGVkIHBhc3QgZW5kXCIsIChkb25lKSAtPlxuICAgIEBkYi5zY3JhdGNoLmNhY2hlIFt7IF9pZDogMSwgYTogJ2EnIH0sIHsgX2lkOiAyLCBhOiAnYicgfSwgeyBfaWQ6IDMsIGE6ICdjJyB9LCB7IF9pZDogNCwgYTogJ2QnIH1dLCB7fSwge30sID0+XG4gICAgICBAZGIuc2NyYXRjaC5yZW1vdmUgMiwgPT5cbiAgICAgICAgQGRiLnNjcmF0Y2guY2FjaGUgW3sgX2lkOiAxLCBhOiAnYScgfSwgeyBfaWQ6IDIsIGE6ICdiJyB9XSwge30sIHtzb3J0OlsnX2lkJ10sIGxpbWl0OjJ9LCA9PlxuICAgICAgICAgIEBkYi5zY3JhdGNoLmZpbmQoe30sIHtzb3J0OlsnX2lkJ119KS5mZXRjaCAocmVzdWx0cykgLT5cbiAgICAgICAgICAgIGFzc2VydC5kZWVwRXF1YWwgXy5wbHVjayhyZXN1bHRzLCAnX2lkJyksIFsxLDMsNF1cbiAgICAgICAgICAgIGRvbmUoKVxuXG4gIGl0IFwicmV0dXJucyBwZW5kaW5nIHVwc2VydHNcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnNjcmF0Y2guY2FjaGUgW3sgX2lkOiAxLCBhOiAnYXBwbGUnIH1dLCB7fSwge30sID0+XG4gICAgICBAZGIuc2NyYXRjaC51cHNlcnQgeyBfaWQ6IDIsIGE6ICdiYW5hbmEnIH0sID0+XG4gICAgICAgIEBkYi5zY3JhdGNoLnBlbmRpbmdVcHNlcnRzIChyZXN1bHRzKSA9PlxuICAgICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzLmxlbmd0aCwgMVxuICAgICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzWzBdLmEsICdiYW5hbmEnXG4gICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJyZXNvbHZlcyBwZW5kaW5nIHVwc2VydHNcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnNjcmF0Y2gudXBzZXJ0IHsgX2lkOiAyLCBhOiAnYmFuYW5hJyB9LCA9PlxuICAgICAgQGRiLnNjcmF0Y2gucmVzb2x2ZVVwc2VydCB7IF9pZDogMiwgYTogJ2JhbmFuYScgfSwgPT5cbiAgICAgICAgQGRiLnNjcmF0Y2gucGVuZGluZ1Vwc2VydHMgKHJlc3VsdHMpID0+XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHMubGVuZ3RoLCAwXG4gICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJyZXRhaW5zIGNoYW5nZWQgcGVuZGluZyB1cHNlcnRzXCIsIChkb25lKSAtPlxuICAgIEBkYi5zY3JhdGNoLnVwc2VydCB7IF9pZDogMiwgYTogJ2JhbmFuYScgfSwgPT5cbiAgICAgIEBkYi5zY3JhdGNoLnVwc2VydCB7IF9pZDogMiwgYTogJ2JhbmFuYTInIH0sID0+XG4gICAgICAgIEBkYi5zY3JhdGNoLnJlc29sdmVVcHNlcnQgeyBfaWQ6IDIsIGE6ICdiYW5hbmEnIH0sID0+XG4gICAgICAgICAgQGRiLnNjcmF0Y2gucGVuZGluZ1Vwc2VydHMgKHJlc3VsdHMpID0+XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0cy5sZW5ndGgsIDFcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzWzBdLmEsICdiYW5hbmEyJ1xuICAgICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJyZW1vdmVzIHBlbmRpbmcgdXBzZXJ0c1wiLCAoZG9uZSkgLT5cbiAgICBAZGIuc2NyYXRjaC51cHNlcnQgeyBfaWQ6IDIsIGE6ICdiYW5hbmEnIH0sID0+XG4gICAgICBAZGIuc2NyYXRjaC5yZW1vdmUgMiwgPT5cbiAgICAgICAgQGRiLnNjcmF0Y2gucGVuZGluZ1Vwc2VydHMgKHJlc3VsdHMpID0+XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHMubGVuZ3RoLCAwXG4gICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJyZXR1cm5zIHBlbmRpbmcgcmVtb3Zlc1wiLCAoZG9uZSkgLT5cbiAgICBAZGIuc2NyYXRjaC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdhcHBsZScgfV0sIHt9LCB7fSwgPT5cbiAgICAgIEBkYi5zY3JhdGNoLnJlbW92ZSAxLCA9PlxuICAgICAgICBAZGIuc2NyYXRjaC5wZW5kaW5nUmVtb3ZlcyAocmVzdWx0cykgPT5cbiAgICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0cy5sZW5ndGgsIDFcbiAgICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0c1swXSwgMVxuICAgICAgICAgIGRvbmUoKVxuXG4gIGl0IFwicmVzb2x2ZXMgcGVuZGluZyByZW1vdmVzXCIsIChkb25lKSAtPlxuICAgIEBkYi5zY3JhdGNoLmNhY2hlIFt7IF9pZDogMSwgYTogJ2FwcGxlJyB9XSwge30sIHt9LCA9PlxuICAgICAgQGRiLnNjcmF0Y2gucmVtb3ZlIDEsID0+XG4gICAgICAgIEBkYi5zY3JhdGNoLnJlc29sdmVSZW1vdmUgMSwgPT5cbiAgICAgICAgICBAZGIuc2NyYXRjaC5wZW5kaW5nUmVtb3ZlcyAocmVzdWx0cykgPT5cbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzLmxlbmd0aCwgMFxuICAgICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJzZWVkc1wiLCAoZG9uZSkgLT5cbiAgICBAZGIuc2NyYXRjaC5zZWVkIHsgX2lkOiAxLCBhOiAnYXBwbGUnIH0sID0+XG4gICAgICBAZGIuc2NyYXRjaC5maW5kKHt9KS5mZXRjaCAocmVzdWx0cykgLT5cbiAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHNbMF0uYSwgJ2FwcGxlJ1xuICAgICAgICBkb25lKClcblxuICBpdCBcImRvZXMgbm90IG92ZXJ3cml0ZSBleGlzdGluZ1wiLCAoZG9uZSkgLT5cbiAgICBAZGIuc2NyYXRjaC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdiYW5hbmEnIH1dLCB7fSwge30sID0+XG4gICAgICBAZGIuc2NyYXRjaC5zZWVkIHsgX2lkOiAxLCBhOiAnYXBwbGUnIH0sID0+XG4gICAgICAgIEBkYi5zY3JhdGNoLmZpbmQoe30pLmZldGNoIChyZXN1bHRzKSAtPlxuICAgICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzWzBdLmEsICdiYW5hbmEnXG4gICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJkb2VzIG5vdCBhZGQgcmVtb3ZlZFwiLCAoZG9uZSkgLT5cbiAgICBAZGIuc2NyYXRjaC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdhcHBsZScgfV0sIHt9LCB7fSwgPT5cbiAgICAgIEBkYi5zY3JhdGNoLnJlbW92ZSAxLCA9PlxuICAgICAgICBAZGIuc2NyYXRjaC5zZWVkIHsgX2lkOiAxLCBhOiAnYXBwbGUnIH0sID0+XG4gICAgICAgICAgQGRiLnNjcmF0Y2guZmluZCh7fSkuZmV0Y2ggKHJlc3VsdHMpIC0+XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0cy5sZW5ndGgsIDBcbiAgICAgICAgICAgIGRvbmUoKVxuXG5kZXNjcmliZSAnTG9jYWxEYiB3aXRoIGxvY2FsIHN0b3JhZ2UnLCAtPlxuICBiZWZvcmUgLT5cbiAgICBAZGIgPSBuZXcgTG9jYWxEYignc2NyYXRjaCcsIHsgbmFtZXNwYWNlOiBcImRiLnNjcmF0Y2hcIiB9KVxuXG4gIGJlZm9yZUVhY2ggKGRvbmUpIC0+XG4gICAgQGRiLnJlbW92ZUNvbGxlY3Rpb24oJ3NjcmF0Y2gnKVxuICAgIEBkYi5hZGRDb2xsZWN0aW9uKCdzY3JhdGNoJylcbiAgICBkb25lKClcblxuICBpdCBcInJldGFpbnMgaXRlbXNcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnNjcmF0Y2gudXBzZXJ0IHsgX2lkOjEsIGE6XCJBbGljZVwiIH0sID0+XG4gICAgICBkYjIgPSBuZXcgTG9jYWxEYignc2NyYXRjaCcsIHsgbmFtZXNwYWNlOiBcImRiLnNjcmF0Y2hcIiB9KVxuICAgICAgZGIyLmFkZENvbGxlY3Rpb24gJ3NjcmF0Y2gnXG4gICAgICBkYjIuc2NyYXRjaC5maW5kKHt9KS5mZXRjaCAocmVzdWx0cykgLT5cbiAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHNbMF0uYSwgXCJBbGljZVwiXG4gICAgICAgIGRvbmUoKVxuXG4gIGl0IFwicmV0YWlucyB1cHNlcnRzXCIsIChkb25lKSAtPlxuICAgIEBkYi5zY3JhdGNoLnVwc2VydCB7IF9pZDoxLCBhOlwiQWxpY2VcIiB9LCA9PlxuICAgICAgZGIyID0gbmV3IExvY2FsRGIoJ3NjcmF0Y2gnLCB7IG5hbWVzcGFjZTogXCJkYi5zY3JhdGNoXCIgfSlcbiAgICAgIGRiMi5hZGRDb2xsZWN0aW9uICdzY3JhdGNoJ1xuICAgICAgZGIyLnNjcmF0Y2guZmluZCh7fSkuZmV0Y2ggKHJlc3VsdHMpIC0+XG4gICAgICAgIGRiMi5zY3JhdGNoLnBlbmRpbmdVcHNlcnRzICh1cHNlcnRzKSAtPlxuICAgICAgICAgIGFzc2VydC5kZWVwRXF1YWwgcmVzdWx0cywgdXBzZXJ0c1xuICAgICAgICAgIGRvbmUoKVxuXG4gIGl0IFwicmV0YWlucyByZW1vdmVzXCIsIChkb25lKSAtPlxuICAgIEBkYi5zY3JhdGNoLnNlZWQgeyBfaWQ6MSwgYTpcIkFsaWNlXCIgfSwgPT5cbiAgICAgIEBkYi5zY3JhdGNoLnJlbW92ZSAxLCA9PlxuICAgICAgICBkYjIgPSBuZXcgTG9jYWxEYignc2NyYXRjaCcsIHsgbmFtZXNwYWNlOiBcImRiLnNjcmF0Y2hcIiB9KVxuICAgICAgICBkYjIuYWRkQ29sbGVjdGlvbiAnc2NyYXRjaCdcbiAgICAgICAgZGIyLnNjcmF0Y2gucGVuZGluZ1JlbW92ZXMgKHJlbW92ZXMpIC0+XG4gICAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCByZW1vdmVzLCBbMV1cbiAgICAgICAgICBkb25lKClcblxuZGVzY3JpYmUgJ0xvY2FsRGIgd2l0aG91dCBsb2NhbCBzdG9yYWdlJywgLT5cbiAgYmVmb3JlIC0+XG4gICAgQGRiID0gbmV3IExvY2FsRGIoJ3NjcmF0Y2gnKVxuXG4gIGJlZm9yZUVhY2ggKGRvbmUpIC0+XG4gICAgQGRiLnJlbW92ZUNvbGxlY3Rpb24oJ3NjcmF0Y2gnKVxuICAgIEBkYi5hZGRDb2xsZWN0aW9uKCdzY3JhdGNoJylcbiAgICBkb25lKClcblxuICBpdCBcImRvZXMgbm90IHJldGFpbiBpdGVtc1wiLCAoZG9uZSkgLT5cbiAgICBAZGIuc2NyYXRjaC51cHNlcnQgeyBfaWQ6MSwgYTpcIkFsaWNlXCIgfSwgPT5cbiAgICAgIGRiMiA9IG5ldyBMb2NhbERiKCdzY3JhdGNoJylcbiAgICAgIGRiMi5hZGRDb2xsZWN0aW9uICdzY3JhdGNoJ1xuICAgICAgZGIyLnNjcmF0Y2guZmluZCh7fSkuZmV0Y2ggKHJlc3VsdHMpIC0+XG4gICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzLmxlbmd0aCwgMFxuICAgICAgICBkb25lKClcblxuICBpdCBcImRvZXMgbm90IHJldGFpbiB1cHNlcnRzXCIsIChkb25lKSAtPlxuICAgIEBkYi5zY3JhdGNoLnVwc2VydCB7IF9pZDoxLCBhOlwiQWxpY2VcIiB9LCA9PlxuICAgICAgZGIyID0gbmV3IExvY2FsRGIoJ3NjcmF0Y2gnKVxuICAgICAgZGIyLmFkZENvbGxlY3Rpb24gJ3NjcmF0Y2gnXG4gICAgICBkYjIuc2NyYXRjaC5maW5kKHt9KS5mZXRjaCAocmVzdWx0cykgLT5cbiAgICAgICAgZGIyLnNjcmF0Y2gucGVuZGluZ1Vwc2VydHMgKHVwc2VydHMpIC0+XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHMubGVuZ3RoLCAwXG4gICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJkb2VzIG5vdCByZXRhaW4gcmVtb3Zlc1wiLCAoZG9uZSkgLT5cbiAgICBAZGIuc2NyYXRjaC5zZWVkIHsgX2lkOjEsIGE6XCJBbGljZVwiIH0sID0+XG4gICAgICBAZGIuc2NyYXRjaC5yZW1vdmUgMSwgPT5cbiAgICAgICAgZGIyID0gbmV3IExvY2FsRGIoJ3NjcmF0Y2gnKVxuICAgICAgICBkYjIuYWRkQ29sbGVjdGlvbiAnc2NyYXRjaCdcbiAgICAgICAgZGIyLnNjcmF0Y2gucGVuZGluZ1JlbW92ZXMgKHJlbW92ZXMpIC0+XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsIHJlbW92ZXMubGVuZ3RoLCAwXG4gICAgICAgICAgZG9uZSgpXG5cbiIsImFzc2VydCA9IGNoYWkuYXNzZXJ0XG5SZW1vdGVEYiA9IHJlcXVpcmUgXCIuLi9hcHAvanMvZGIvUmVtb3RlRGJcIlxuZGJfcXVlcmllcyA9IHJlcXVpcmUgXCIuL2RiX3F1ZXJpZXNcIlxuXG4jIFRvIHdvcmssIHRoaXMgbXVzdCBoYXZlIHRoZSBmb2xsb3dpbmcgc2VydmVyIHJ1bm5pbmc6XG4jIE5PREVfRU5WPXRlc3Qgbm9kZSBzZXJ2ZXIuanNcbmlmIGZhbHNlXG4gIGRlc2NyaWJlICdSZW1vdGVEYicsIC0+XG4gICAgYmVmb3JlRWFjaCAoZG9uZSkgLT5cbiAgICAgIHVybCA9ICdodHRwOi8vbG9jYWxob3N0OjgwODAvdjMvJ1xuICAgICAgcmVxID0gJC5wb3N0KHVybCArIFwiX3Jlc2V0XCIsIHt9KVxuICAgICAgcmVxLmZhaWwgKGpxWEhSLCB0ZXh0U3RhdHVzLCBlcnJvclRocm93bikgPT5cbiAgICAgICAgdGhyb3cgdGV4dFN0YXR1c1xuICAgICAgcmVxLmRvbmUgPT5cbiAgICAgICAgcmVxID0gJC5hamF4KHVybCArIFwidXNlcnMvdGVzdFwiLCB7XG4gICAgICAgICAgZGF0YSA6IEpTT04uc3RyaW5naWZ5KHsgZW1haWw6IFwidGVzdEB0ZXN0LmNvbVwiLCBwYXNzd29yZDpcInh5enp5XCIgfSksXG4gICAgICAgICAgY29udGVudFR5cGUgOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICAgdHlwZSA6ICdQVVQnfSlcbiAgICAgICAgcmVxLmRvbmUgKGRhdGEpID0+XG4gICAgICAgICAgcmVxID0gJC5hamF4KHVybCArIFwidXNlcnMvdGVzdFwiLCB7XG4gICAgICAgICAgZGF0YSA6IEpTT04uc3RyaW5naWZ5KHsgcGFzc3dvcmQ6XCJ4eXp6eVwiIH0pLFxuICAgICAgICAgIGNvbnRlbnRUeXBlIDogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICAgIHR5cGUgOiAnUE9TVCd9KVxuICAgICAgICAgIHJlcS5kb25lIChkYXRhKSA9PlxuICAgICAgICAgICAgQGNsaWVudCA9IGRhdGEuY2xpZW50XG5cbiAgICAgICAgICAgIEBkYiA9IG5ldyBSZW1vdGVEYih1cmwsIEBjbGllbnQpXG4gICAgICAgICAgICBAZGIuYWRkQ29sbGVjdGlvbignc2NyYXRjaCcpXG5cbiAgICAgICAgICAgIGRvbmUoKVxuXG4gICAgZGVzY3JpYmUgXCJwYXNzZXMgcXVlcmllc1wiLCAtPlxuICAgICAgZGJfcXVlcmllcy5jYWxsKHRoaXMpXG4iLCJhc3NlcnQgPSBjaGFpLmFzc2VydFxuTG9jYXRpb25WaWV3ID0gcmVxdWlyZSAnLi4vYXBwL2pzL0xvY2F0aW9uVmlldydcblVJRHJpdmVyID0gcmVxdWlyZSAnLi9oZWxwZXJzL1VJRHJpdmVyJ1xuXG5jbGFzcyBNb2NrTG9jYXRpb25GaW5kZXJcbiAgY29uc3RydWN0b3I6ICAtPlxuICAgIF8uZXh0ZW5kIEAsIEJhY2tib25lLkV2ZW50c1xuXG4gIGdldExvY2F0aW9uOiAtPlxuICBzdGFydFdhdGNoOiAtPlxuICBzdG9wV2F0Y2g6IC0+XG5cbmRlc2NyaWJlICdMb2NhdGlvblZpZXcnLCAtPlxuICBjb250ZXh0ICdXaXRoIG5vIHNldCBsb2NhdGlvbicsIC0+XG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgQGxvY2F0aW9uRmluZGVyID0gbmV3IE1vY2tMb2NhdGlvbkZpbmRlcigpXG4gICAgICBAbG9jYXRpb25WaWV3ID0gbmV3IExvY2F0aW9uVmlldyhsb2M6bnVsbCwgbG9jYXRpb25GaW5kZXI6IEBsb2NhdGlvbkZpbmRlcilcbiAgICAgIEB1aSA9IG5ldyBVSURyaXZlcihAbG9jYXRpb25WaWV3LmVsKVxuXG4gICAgaXQgJ2Rpc3BsYXlzIFVuc3BlY2lmaWVkJywgLT5cbiAgICAgIGFzc2VydC5pbmNsdWRlKEB1aS50ZXh0KCksICdVbnNwZWNpZmllZCcpXG5cbiAgICBpdCAnZGlzYWJsZXMgbWFwJywgLT5cbiAgICAgIGFzc2VydC5pc1RydWUgQHVpLmdldERpc2FibGVkKFwiTWFwXCIpIFxuXG4gICAgaXQgJ2FsbG93cyBzZXR0aW5nIGxvY2F0aW9uJywgLT5cbiAgICAgIEB1aS5jbGljaygnU2V0JylcbiAgICAgIHNldFBvcyA9IG51bGxcbiAgICAgIEBsb2NhdGlvblZpZXcub24gJ2xvY2F0aW9uc2V0JywgKHBvcykgLT5cbiAgICAgICAgc2V0UG9zID0gcG9zXG5cbiAgICAgIEBsb2NhdGlvbkZpbmRlci50cmlnZ2VyICdmb3VuZCcsIHsgY29vcmRzOiB7IGxhdGl0dWRlOiAyLCBsb25naXR1ZGU6IDMsIGFjY3VyYWN5OiAxMH19XG4gICAgICBhc3NlcnQuZXF1YWwgc2V0UG9zLmNvb3JkaW5hdGVzWzFdLCAyXG5cbiAgICBpdCAnRGlzcGxheXMgZXJyb3InLCAtPlxuICAgICAgQHVpLmNsaWNrKCdTZXQnKVxuICAgICAgc2V0UG9zID0gbnVsbFxuICAgICAgQGxvY2F0aW9uVmlldy5vbiAnbG9jYXRpb25zZXQnLCAocG9zKSAtPlxuICAgICAgICBzZXRQb3MgPSBwb3NcblxuICAgICAgQGxvY2F0aW9uRmluZGVyLnRyaWdnZXIgJ2Vycm9yJ1xuICAgICAgYXNzZXJ0LmVxdWFsIHNldFBvcywgbnVsbFxuICAgICAgYXNzZXJ0LmluY2x1ZGUoQHVpLnRleHQoKSwgJ0Nhbm5vdCcpXG5cbiAgY29udGV4dCAnV2l0aCBzZXQgbG9jYXRpb24nLCAtPlxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgIEBsb2NhdGlvbkZpbmRlciA9IG5ldyBNb2NrTG9jYXRpb25GaW5kZXIoKVxuICAgICAgQGxvY2F0aW9uVmlldyA9IG5ldyBMb2NhdGlvblZpZXcobG9jOiB7IHR5cGU6IFwiUG9pbnRcIiwgY29vcmRpbmF0ZXM6IFsxMCwgMjBdfSwgbG9jYXRpb25GaW5kZXI6IEBsb2NhdGlvbkZpbmRlcilcbiAgICAgIEB1aSA9IG5ldyBVSURyaXZlcihAbG9jYXRpb25WaWV3LmVsKVxuXG4gICAgaXQgJ2Rpc3BsYXlzIFdhaXRpbmcnLCAtPlxuICAgICAgYXNzZXJ0LmluY2x1ZGUoQHVpLnRleHQoKSwgJ1dhaXRpbmcnKVxuXG4gICAgaXQgJ2Rpc3BsYXlzIHJlbGF0aXZlJywgLT5cbiAgICAgIEBsb2NhdGlvbkZpbmRlci50cmlnZ2VyICdmb3VuZCcsIHsgY29vcmRzOiB7IGxhdGl0dWRlOiAyMSwgbG9uZ2l0dWRlOiAxMCwgYWNjdXJhY3k6IDEwfX1cbiAgICAgIGFzc2VydC5pbmNsdWRlKEB1aS50ZXh0KCksICcxMTEuMmttIFMnKVxuXG4iLCJhc3NlcnQgPSBjaGFpLmFzc2VydFxuXG5HZW9KU09OID0gcmVxdWlyZSAnLi4vYXBwL2pzL0dlb0pTT04nXG5cbm1vZHVsZS5leHBvcnRzID0gLT5cbiAgY29udGV4dCAnV2l0aCBzYW1wbGUgcm93cycsIC0+XG4gICAgYmVmb3JlRWFjaCAoZG9uZSkgLT5cbiAgICAgIEBkYi5zY3JhdGNoLnVwc2VydCB7IF9pZDpcIjFcIiwgYTpcIkFsaWNlXCIsIGI6MSB9LCA9PlxuICAgICAgICBAZGIuc2NyYXRjaC51cHNlcnQgeyBfaWQ6XCIyXCIsIGE6XCJDaGFybGllXCIsIGI6MiB9LCA9PlxuICAgICAgICAgIEBkYi5zY3JhdGNoLnVwc2VydCB7IF9pZDpcIjNcIiwgYTpcIkJvYlwiLCBiOjMgfSwgPT5cbiAgICAgICAgICAgIGRvbmUoKVxuXG4gICAgaXQgJ2ZpbmRzIGFsbCByb3dzJywgKGRvbmUpIC0+XG4gICAgICBAZGIuc2NyYXRjaC5maW5kKHt9KS5mZXRjaCAocmVzdWx0cykgPT5cbiAgICAgICAgYXNzZXJ0LmVxdWFsIDMsIHJlc3VsdHMubGVuZ3RoXG4gICAgICAgIGRvbmUoKVxuXG4gICAgaXQgJ2ZpbmRzIGFsbCByb3dzIHdpdGggb3B0aW9ucycsIChkb25lKSAtPlxuICAgICAgQGRiLnNjcmF0Y2guZmluZCh7fSwge30pLmZldGNoIChyZXN1bHRzKSA9PlxuICAgICAgICBhc3NlcnQuZXF1YWwgMywgcmVzdWx0cy5sZW5ndGhcbiAgICAgICAgZG9uZSgpXG5cbiAgICBpdCAnZmlsdGVycyByb3dzIGJ5IGlkJywgKGRvbmUpIC0+XG4gICAgICBAZGIuc2NyYXRjaC5maW5kKHsgX2lkOiBcIjFcIiB9KS5mZXRjaCAocmVzdWx0cykgPT5cbiAgICAgICAgYXNzZXJ0LmVxdWFsIDEsIHJlc3VsdHMubGVuZ3RoXG4gICAgICAgIGFzc2VydC5lcXVhbCAnQWxpY2UnLCByZXN1bHRzWzBdLmFcbiAgICAgICAgZG9uZSgpXG5cbiAgICBpdCAnaW5jbHVkZXMgZmllbGRzJywgKGRvbmUpIC0+XG4gICAgICBAZGIuc2NyYXRjaC5maW5kKHsgX2lkOiBcIjFcIiB9LCB7IGZpZWxkczogeyBhOjEgfX0pLmZldGNoIChyZXN1bHRzKSA9PlxuICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIHJlc3VsdHNbMF0sIHsgX2lkOiBcIjFcIiwgIGE6IFwiQWxpY2VcIiB9XG4gICAgICAgIGRvbmUoKVxuXG4gICAgaXQgJ2V4Y2x1ZGVzIGZpZWxkcycsIChkb25lKSAtPlxuICAgICAgQGRiLnNjcmF0Y2guZmluZCh7IF9pZDogXCIxXCIgfSwgeyBmaWVsZHM6IHsgYTowIH19KS5mZXRjaCAocmVzdWx0cykgPT5cbiAgICAgICAgYXNzZXJ0LmlzVW5kZWZpbmVkIHJlc3VsdHNbMF0uYVxuICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0c1swXS5iLCAxXG4gICAgICAgIGRvbmUoKVxuXG4gICAgaXQgJ2ZpbmRzIG9uZSByb3cnLCAoZG9uZSkgLT5cbiAgICAgIEBkYi5zY3JhdGNoLmZpbmRPbmUgeyBfaWQ6IFwiMlwiIH0sIChyZXN1bHQpID0+XG4gICAgICAgIGFzc2VydC5lcXVhbCAnQ2hhcmxpZScsIHJlc3VsdC5hXG4gICAgICAgIGRvbmUoKVxuXG4gICAgaXQgJ3JlbW92ZXMgaXRlbScsIChkb25lKSAtPlxuICAgICAgQGRiLnNjcmF0Y2gucmVtb3ZlIFwiMlwiLCA9PlxuICAgICAgICBAZGIuc2NyYXRjaC5maW5kKHt9KS5mZXRjaCAocmVzdWx0cykgPT5cbiAgICAgICAgICBhc3NlcnQuZXF1YWwgMiwgcmVzdWx0cy5sZW5ndGhcbiAgICAgICAgICBhc3NlcnQgXCIxXCIgaW4gKHJlc3VsdC5faWQgZm9yIHJlc3VsdCBpbiByZXN1bHRzKVxuICAgICAgICAgIGFzc2VydCBcIjJcIiBub3QgaW4gKHJlc3VsdC5faWQgZm9yIHJlc3VsdCBpbiByZXN1bHRzKVxuICAgICAgICAgIGRvbmUoKVxuXG4gICAgaXQgJ3JlbW92ZXMgbm9uLWV4aXN0ZW50IGl0ZW0nLCAoZG9uZSkgLT5cbiAgICAgIEBkYi5zY3JhdGNoLnJlbW92ZSBcIjk5OVwiLCA9PlxuICAgICAgICBAZGIuc2NyYXRjaC5maW5kKHt9KS5mZXRjaCAocmVzdWx0cykgPT5cbiAgICAgICAgICBhc3NlcnQuZXF1YWwgMywgcmVzdWx0cy5sZW5ndGhcbiAgICAgICAgICBkb25lKClcblxuICAgIGl0ICdzb3J0cyBhc2NlbmRpbmcnLCAoZG9uZSkgLT5cbiAgICAgIEBkYi5zY3JhdGNoLmZpbmQoe30sIHtzb3J0OiBbJ2EnXX0pLmZldGNoIChyZXN1bHRzKSA9PlxuICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIF8ucGx1Y2socmVzdWx0cywgJ19pZCcpLCBbXCIxXCIsXCIzXCIsXCIyXCJdXG4gICAgICAgIGRvbmUoKVxuXG4gICAgaXQgJ3NvcnRzIGRlc2NlbmRpbmcnLCAoZG9uZSkgLT5cbiAgICAgIEBkYi5zY3JhdGNoLmZpbmQoe30sIHtzb3J0OiBbWydhJywnZGVzYyddXX0pLmZldGNoIChyZXN1bHRzKSA9PlxuICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIF8ucGx1Y2socmVzdWx0cywgJ19pZCcpLCBbXCIyXCIsXCIzXCIsXCIxXCJdXG4gICAgICAgIGRvbmUoKVxuXG4gICAgaXQgJ2xpbWl0cycsIChkb25lKSAtPlxuICAgICAgQGRiLnNjcmF0Y2guZmluZCh7fSwge3NvcnQ6IFsnYSddLCBsaW1pdDoyfSkuZmV0Y2ggKHJlc3VsdHMpID0+XG4gICAgICAgIGFzc2VydC5kZWVwRXF1YWwgXy5wbHVjayhyZXN1bHRzLCAnX2lkJyksIFtcIjFcIixcIjNcIl1cbiAgICAgICAgZG9uZSgpXG5cbiAgICBpdCAnZmV0Y2hlcyBpbmRlcGVuZGVudCBjb3BpZXMnLCAoZG9uZSkgLT5cbiAgICAgIEBkYi5zY3JhdGNoLmZpbmRPbmUgeyBfaWQ6IFwiMlwiIH0sIChyZXN1bHQpID0+XG4gICAgICAgIHJlc3VsdC5hID0gJ0RhdmlkJ1xuICAgICAgICBAZGIuc2NyYXRjaC5maW5kT25lIHsgX2lkOiBcIjJcIiB9LCAocmVzdWx0KSA9PlxuICAgICAgICAgIGFzc2VydC5lcXVhbCAnQ2hhcmxpZScsIHJlc3VsdC5hXG4gICAgICAgICAgZG9uZSgpXG5cbiAgaXQgJ2FkZHMgX2lkIHRvIHJvd3MnLCAoZG9uZSkgLT5cbiAgICBAZGIuc2NyYXRjaC51cHNlcnQgeyBhOiAxIH0sIChpdGVtKSA9PlxuICAgICAgYXNzZXJ0LnByb3BlcnR5IGl0ZW0sICdfaWQnXG4gICAgICBhc3NlcnQubGVuZ3RoT2YgaXRlbS5faWQsIDMyXG4gICAgICBkb25lKClcblxuICBpdCAndXBkYXRlcyBieSBpZCcsIChkb25lKSAtPlxuICAgIEBkYi5zY3JhdGNoLnVwc2VydCB7IF9pZDpcIjFcIiwgYToxIH0sIChpdGVtKSA9PlxuICAgICAgQGRiLnNjcmF0Y2gudXBzZXJ0IHsgX2lkOlwiMVwiLCBhOjIsIF9yZXY6IDEgfSwgKGl0ZW0pID0+XG4gICAgICAgIGFzc2VydC5lcXVhbCBpdGVtLmEsIDJcbiAgXG4gICAgICAgIEBkYi5zY3JhdGNoLmZpbmQoe30pLmZldGNoIChyZXN1bHRzKSA9PlxuICAgICAgICAgIGFzc2VydC5lcXVhbCAxLCByZXN1bHRzLmxlbmd0aFxuICAgICAgICAgIGRvbmUoKVxuXG5cbiAgZ2VvcG9pbnQgPSAobG5nLCBsYXQpIC0+XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6ICdQb2ludCdcbiAgICAgIGNvb3JkaW5hdGVzOiBbbG5nLCBsYXRdXG4gICAgfVxuXG4gIGNvbnRleHQgJ1dpdGggZ2VvbG9jYXRlZCByb3dzJywgLT5cbiAgICBiZWZvcmVFYWNoIChkb25lKSAtPlxuICAgICAgQGRiLnNjcmF0Y2gudXBzZXJ0IHsgX2lkOlwiMVwiLCBsb2M6Z2VvcG9pbnQoOTAsIDQ1KSB9LCA9PlxuICAgICAgICBAZGIuc2NyYXRjaC51cHNlcnQgeyBfaWQ6XCIyXCIsIGxvYzpnZW9wb2ludCg5MCwgNDYpIH0sID0+XG4gICAgICAgICAgQGRiLnNjcmF0Y2gudXBzZXJ0IHsgX2lkOlwiM1wiLCBsb2M6Z2VvcG9pbnQoOTEsIDQ1KSB9LCA9PlxuICAgICAgICAgICAgQGRiLnNjcmF0Y2gudXBzZXJ0IHsgX2lkOlwiNFwiLCBsb2M6Z2VvcG9pbnQoOTEsIDQ2KSB9LCA9PlxuICAgICAgICAgICAgICBkb25lKClcblxuICAgIGl0ICdmaW5kcyBwb2ludHMgbmVhcicsIChkb25lKSAtPlxuICAgICAgc2VsZWN0b3IgPSBsb2M6IFxuICAgICAgICAkbmVhcjogXG4gICAgICAgICAgJGdlb21ldHJ5OiBnZW9wb2ludCg5MCwgNDUpXG5cbiAgICAgIEBkYi5zY3JhdGNoLmZpbmQoc2VsZWN0b3IpLmZldGNoIChyZXN1bHRzKSA9PlxuICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIF8ucGx1Y2socmVzdWx0cywgJ19pZCcpLCBbXCIxXCIsXCIzXCIsXCIyXCIsXCI0XCJdXG4gICAgICAgIGRvbmUoKVxuXG4gICAgaXQgJ2ZpbmRzIHBvaW50cyBuZWFyIG1heERpc3RhbmNlJywgKGRvbmUpIC0+XG4gICAgICBzZWxlY3RvciA9IGxvYzogXG4gICAgICAgICRuZWFyOiBcbiAgICAgICAgICAkZ2VvbWV0cnk6IGdlb3BvaW50KDkwLCA0NSlcbiAgICAgICAgICAkbWF4RGlzdGFuY2U6IDExMTAwMFxuXG4gICAgICBAZGIuc2NyYXRjaC5maW5kKHNlbGVjdG9yKS5mZXRjaCAocmVzdWx0cykgPT5cbiAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCBfLnBsdWNrKHJlc3VsdHMsICdfaWQnKSwgW1wiMVwiLFwiM1wiXVxuICAgICAgICBkb25lKCkgICAgICBcblxuICAgIGl0ICdmaW5kcyBwb2ludHMgbmVhciBtYXhEaXN0YW5jZSBqdXN0IGFib3ZlJywgKGRvbmUpIC0+XG4gICAgICBzZWxlY3RvciA9IGxvYzogXG4gICAgICAgICRuZWFyOiBcbiAgICAgICAgICAkZ2VvbWV0cnk6IGdlb3BvaW50KDkwLCA0NSlcbiAgICAgICAgICAkbWF4RGlzdGFuY2U6IDExMjAwMFxuXG4gICAgICBAZGIuc2NyYXRjaC5maW5kKHNlbGVjdG9yKS5mZXRjaCAocmVzdWx0cykgPT5cbiAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCBfLnBsdWNrKHJlc3VsdHMsICdfaWQnKSwgW1wiMVwiLFwiM1wiLFwiMlwiXVxuICAgICAgICBkb25lKClcblxuICAgIGl0ICdmaW5kcyBwb2ludHMgd2l0aGluIHNpbXBsZSBib3gnLCAoZG9uZSkgLT5cbiAgICAgIHNlbGVjdG9yID0gbG9jOiBcbiAgICAgICAgJGdlb0ludGVyc2VjdHM6IFxuICAgICAgICAgICRnZW9tZXRyeTogXG4gICAgICAgICAgICB0eXBlOiAnUG9seWdvbidcbiAgICAgICAgICAgIGNvb3JkaW5hdGVzOiBbW1xuICAgICAgICAgICAgICBbODkuNSwgNDUuNV0sIFs4OS41LCA0Ni41XSwgWzkwLjUsIDQ2LjVdLCBbOTAuNSwgNDUuNV0sIFs4OS41LCA0NS41XVxuICAgICAgICAgICAgXV1cbiAgICAgIEBkYi5zY3JhdGNoLmZpbmQoc2VsZWN0b3IpLmZldGNoIChyZXN1bHRzKSA9PlxuICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIF8ucGx1Y2socmVzdWx0cywgJ19pZCcpLCBbXCIyXCJdXG4gICAgICAgIGRvbmUoKVxuXG4gICAgaXQgJ2hhbmRsZXMgdW5kZWZpbmVkJywgKGRvbmUpIC0+XG4gICAgICBzZWxlY3RvciA9IGxvYzogXG4gICAgICAgICRnZW9JbnRlcnNlY3RzOiBcbiAgICAgICAgICAkZ2VvbWV0cnk6IFxuICAgICAgICAgICAgdHlwZTogJ1BvbHlnb24nXG4gICAgICAgICAgICBjb29yZGluYXRlczogW1tcbiAgICAgICAgICAgICAgWzg5LjUsIDQ1LjVdLCBbODkuNSwgNDYuNV0sIFs5MC41LCA0Ni41XSwgWzkwLjUsIDQ1LjVdLCBbODkuNSwgNDUuNV1cbiAgICAgICAgICAgIF1dXG4gICAgICBAZGIuc2NyYXRjaC51cHNlcnQgeyBfaWQ6NSB9LCA9PlxuICAgICAgICBAZGIuc2NyYXRjaC5maW5kKHNlbGVjdG9yKS5mZXRjaCAocmVzdWx0cykgPT5cbiAgICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIF8ucGx1Y2socmVzdWx0cywgJ19pZCcpLCBbXCIyXCJdXG4gICAgICAgICAgZG9uZSgpXG5cblxuIiwiYXNzZXJ0ID0gY2hhaS5hc3NlcnRcbmF1dGggPSByZXF1aXJlIFwiLi4vYXBwL2pzL2F1dGhcIlxuXG5cbmRlc2NyaWJlIFwiVXNlckF1dGhcIiwgLT5cbiAgY29udGV4dCBcInVzZXIgb25seVwiLCAtPlxuICAgIGJlZm9yZSAtPlxuICAgICAgQGF1dGggPSBuZXcgYXV0aC5Vc2VyQXV0aChcInNvbWV1c2VyXCIpXG5cbiAgICBpdCBcImRvZXMgbm90IGFsbG93IHNvdXJjZV90eXBlcyBpbnNlcnRcIiwgLT5cbiAgICAgIGFzc2VydC5pc0ZhbHNlIEBhdXRoLmluc2VydChcInNvdXJjZV90eXBlc1wiKVxuXG4gICAgaXQgXCJkb2VzIGFsbG93IHNvdXJjZXMgaW5zZXJ0XCIsIC0+XG4gICAgICBhc3NlcnQuaXNUcnVlIEBhdXRoLmluc2VydChcInNvdXJjZXNcIilcblxuICAgIGl0IFwiZG9lcyBhbGxvdyBzb3VyY2VzIHVwZGF0ZSBmb3IgdXNlclwiLCAtPlxuICAgICAgYXNzZXJ0LmlzVHJ1ZSBAYXV0aC51cGRhdGUoXCJzb3VyY2VzXCIsIHsgdXNlcjogXCJzb21ldXNlclwifSlcblxuICAgIGl0IFwiZG9lcyBhbGxvdyBzb3VyY2VzIHVwZGF0ZXMgaW4gZ2VuZXJhbFwiLCAtPlxuICAgICAgYXNzZXJ0LmlzVHJ1ZSBAYXV0aC51cGRhdGUoXCJzb3VyY2VzXCIpXG5cbiAgICBpdCBcImRvZXMgbm90IGFsbG93IHNvdXJjZXMgdXBkYXRlIGZvciBvdGhlciB1c2VyXCIsIC0+XG4gICAgICBhc3NlcnQuaXNGYWxzZSBAYXV0aC51cGRhdGUoXCJzb3VyY2VzXCIsIHsgdXNlcjogXCJ4eXp6eVwifSlcblxuICBjb250ZXh0IFwidXNlciBhbmQgb3JnXCIsIC0+XG4gICAgYmVmb3JlIC0+XG4gICAgICBAYXV0aCA9IG5ldyBhdXRoLlVzZXJBdXRoKFwic29tZXVzZXJcIiwgXCJzb21lb3JnXCIpXG5cbiAgICBpdCBcImRvZXMgbm90IGFsbG93IHNvdXJjZV90eXBlcyBpbnNlcnRcIiwgLT5cbiAgICAgIGFzc2VydC5pc0ZhbHNlIEBhdXRoLmluc2VydChcInNvdXJjZV90eXBlc1wiKVxuXG4gICAgaXQgXCJkb2VzIGFsbG93IHNvdXJjZXMgaW5zZXJ0XCIsIC0+XG4gICAgICBhc3NlcnQuaXNUcnVlIEBhdXRoLmluc2VydChcInNvdXJjZXNcIilcblxuICAgIGl0IFwiZG9lcyBhbGxvdyBzb3VyY2VzIHVwZGF0ZSBmb3IgdXNlclwiLCAtPlxuICAgICAgYXNzZXJ0LmlzVHJ1ZSBAYXV0aC51cGRhdGUoXCJzb3VyY2VzXCIsIHsgdXNlcjogXCJzb21ldXNlclwifSlcblxuICAgIGl0IFwiZG9lcyBub3QgYWxsb3cgc291cmNlcyB1cGRhdGUgZm9yIG90aGVyIHVzZXIgd2l0aCBubyBvcmdcIiwgLT5cbiAgICAgIGFzc2VydC5pc0ZhbHNlIEBhdXRoLnVwZGF0ZShcInNvdXJjZXNcIiwgeyB1c2VyOiBcInh5enp5XCJ9KVxuXG4gICAgaXQgXCJkb2VzIGFsbG93IHNvdXJjZXMgdXBkYXRlIGZvciBvdGhlciB1c2VyIHdpdGggc2FtZSBvcmdcIiwgLT5cbiAgICAgIGFzc2VydC5pc1RydWUgQGF1dGgudXBkYXRlKFwic291cmNlc1wiLCB7IHVzZXI6IFwieHl6enlcIiwgb3JnOiBcInNvbWVvcmdcIn0pXG4iLCJcbmV4cG9ydHMuRGF0ZVF1ZXN0aW9uID0gcmVxdWlyZSAnLi9EYXRlUXVlc3Rpb24nXG5leHBvcnRzLkRyb3Bkb3duUXVlc3Rpb24gPSByZXF1aXJlICcuL0Ryb3Bkb3duUXVlc3Rpb24nXG5leHBvcnRzLk51bWJlclF1ZXN0aW9uID0gcmVxdWlyZSAnLi9OdW1iZXJRdWVzdGlvbidcbmV4cG9ydHMuUXVlc3Rpb25Hcm91cCA9IHJlcXVpcmUgJy4vUXVlc3Rpb25Hcm91cCdcbmV4cG9ydHMuU2F2ZUNhbmNlbEZvcm0gPSByZXF1aXJlICcuL1NhdmVDYW5jZWxGb3JtJ1xuZXhwb3J0cy5Tb3VyY2VRdWVzdGlvbiA9IHJlcXVpcmUgJy4vU291cmNlUXVlc3Rpb24nXG5leHBvcnRzLkltYWdlUXVlc3Rpb24gPSByZXF1aXJlICcuL0ltYWdlUXVlc3Rpb24nXG5leHBvcnRzLkltYWdlc1F1ZXN0aW9uID0gcmVxdWlyZSAnLi9JbWFnZXNRdWVzdGlvbidcbmV4cG9ydHMuSW5zdHJ1Y3Rpb25zID0gcmVxdWlyZSAnLi9JbnN0cnVjdGlvbnMnXG5cbiMgTXVzdCBiZSBjcmVhdGVkIHdpdGggbW9kZWwgKGJhY2tib25lIG1vZGVsKSBhbmQgY29udGVudHMgKGFycmF5IG9mIHZpZXdzKVxuZXhwb3J0cy5Gb3JtVmlldyA9IGNsYXNzIEZvcm1WaWV3IGV4dGVuZHMgQmFja2JvbmUuVmlld1xuICBpbml0aWFsaXplOiAob3B0aW9ucykgLT5cbiAgICBAY29udGVudHMgPSBvcHRpb25zLmNvbnRlbnRzXG4gICAgXG4gICAgIyBBZGQgY29udGVudHMgYW5kIGxpc3RlbiB0byBldmVudHNcbiAgICBmb3IgY29udGVudCBpbiBvcHRpb25zLmNvbnRlbnRzXG4gICAgICBAJGVsLmFwcGVuZChjb250ZW50LmVsKTtcbiAgICAgIEBsaXN0ZW5UbyBjb250ZW50LCAnY2xvc2UnLCA9PiBAdHJpZ2dlcignY2xvc2UnKVxuICAgICAgQGxpc3RlblRvIGNvbnRlbnQsICdjb21wbGV0ZScsID0+IEB0cmlnZ2VyKCdjb21wbGV0ZScpXG5cbiAgICAjIEFkZCBsaXN0ZW5lciB0byBtb2RlbFxuICAgIEBsaXN0ZW5UbyBAbW9kZWwsICdjaGFuZ2UnLCA9PiBAdHJpZ2dlcignY2hhbmdlJylcblxuICAgICMgT3ZlcnJpZGUgc2F2ZSBpZiBwYXNzZWQgYXMgb3B0aW9uXG4gICAgaWYgb3B0aW9ucy5zYXZlXG4gICAgICBAc2F2ZSA9IG9wdGlvbnMuc2F2ZVxuXG4gIGxvYWQ6IChkYXRhKSAtPlxuICAgIEBtb2RlbC5jbGVhcigpICAjVE9ETyBjbGVhciBvciBub3QgY2xlYXI/IGNsZWFyaW5nIHJlbW92ZXMgZGVmYXVsdHMsIGJ1dCBhbGxvd3MgdHJ1ZSByZXVzZS5cblxuICAgICMgQXBwbHkgZGVmYXVsdHMgXG4gICAgQG1vZGVsLnNldChfLmRlZmF1bHRzKF8uY2xvbmVEZWVwKGRhdGEpLCBAb3B0aW9ucy5kZWZhdWx0cyB8fCB7fSkpXG5cbiAgc2F2ZTogLT5cbiAgICByZXR1cm4gQG1vZGVsLnRvSlNPTigpXG5cblxuIyBTaW1wbGUgZm9ybSB0aGF0IGRpc3BsYXlzIGEgdGVtcGxhdGUgYmFzZWQgb24gbG9hZGVkIGRhdGFcbmV4cG9ydHMudGVtcGxhdGVWaWV3ID0gKHRlbXBsYXRlKSAtPiBcbiAgcmV0dXJuIHtcbiAgICBlbDogJCgnPGRpdj48L2Rpdj4nKVxuICAgIGxvYWQ6IChkYXRhKSAtPlxuICAgICAgJChAZWwpLmh0bWwgdGVtcGxhdGUoZGF0YSlcbiAgfVxuXG4gICMgY2xhc3MgVGVtcGxhdGVWaWV3IGV4dGVuZHMgQmFja2JvbmUuVmlld1xuICAjIGNvbnN0cnVjdG9yOiAodGVtcGxhdGUpIC0+XG4gICMgICBAdGVtcGxhdGUgPSB0ZW1wbGF0ZVxuXG4gICMgbG9hZDogKGRhdGEpIC0+XG4gICMgICBAJGVsLmh0bWwgQHRlbXBsYXRlKGRhdGEpXG5cblxuZXhwb3J0cy5TdXJ2ZXlWaWV3ID0gY2xhc3MgU3VydmV5VmlldyBleHRlbmRzIEZvcm1WaWV3XG5cbmV4cG9ydHMuV2F0ZXJUZXN0RWRpdFZpZXcgPSBjbGFzcyBXYXRlclRlc3RFZGl0VmlldyBleHRlbmRzIEZvcm1WaWV3XG4gIGluaXRpYWxpemU6IChvcHRpb25zKSAtPlxuICAgIHN1cGVyKG9wdGlvbnMpXG5cbiAgICAjIEFkZCBidXR0b25zIGF0IGJvdHRvbVxuICAgICMgVE9ETyBtb3ZlIHRvIHRlbXBsYXRlIGFuZCBzZXAgZmlsZVxuICAgIEAkZWwuYXBwZW5kICQoJycnXG4gICAgICA8ZGl2PlxuICAgICAgICAgIDxidXR0b24gaWQ9XCJjbG9zZV9idXR0b25cIiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJidG4gbWFyZ2luZWRcIj5TYXZlIGZvciBMYXRlcjwvYnV0dG9uPlxuICAgICAgICAgICZuYnNwO1xuICAgICAgICAgIDxidXR0b24gaWQ9XCJjb21wbGV0ZV9idXR0b25cIiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJidG4gYnRuLXByaW1hcnkgbWFyZ2luZWRcIj48aSBjbGFzcz1cImljb24tb2sgaWNvbi13aGl0ZVwiPjwvaT4gQ29tcGxldGU8L2J1dHRvbj5cbiAgICAgIDwvZGl2PlxuICAgICcnJylcblxuICBldmVudHM6IFxuICAgIFwiY2xpY2sgI2Nsb3NlX2J1dHRvblwiIDogXCJjbG9zZVwiXG4gICAgXCJjbGljayAjY29tcGxldGVfYnV0dG9uXCIgOiBcImNvbXBsZXRlXCJcblxuICAjIFRPRE8gcmVmYWN0b3Igd2l0aCBTYXZlQ2FuY2VsRm9ybVxuICB2YWxpZGF0ZTogLT5cbiAgICAjIEdldCBhbGwgdmlzaWJsZSBpdGVtc1xuICAgIGl0ZW1zID0gXy5maWx0ZXIoQGNvbnRlbnRzLCAoYykgLT5cbiAgICAgIGMudmlzaWJsZSBhbmQgYy52YWxpZGF0ZVxuICAgIClcbiAgICByZXR1cm4gbm90IF8uYW55KF8ubWFwKGl0ZW1zLCAoaXRlbSkgLT5cbiAgICAgIGl0ZW0udmFsaWRhdGUoKVxuICAgICkpXG5cbiAgY2xvc2U6IC0+XG4gICAgQHRyaWdnZXIgJ2Nsb3NlJ1xuXG4gIGNvbXBsZXRlOiAtPlxuICAgIGlmIEB2YWxpZGF0ZSgpXG4gICAgICBAdHJpZ2dlciAnY29tcGxldGUnXG4gICAgICBcbiMgQ3JlYXRlcyBhIGZvcm0gdmlldyBmcm9tIGEgc3RyaW5nXG5leHBvcnRzLmluc3RhbnRpYXRlVmlldyA9ICh2aWV3U3RyLCBvcHRpb25zKSA9PlxuICB2aWV3RnVuYyA9IG5ldyBGdW5jdGlvbihcIm9wdGlvbnNcIiwgdmlld1N0cilcbiAgdmlld0Z1bmMob3B0aW9ucylcblxuXy5leHRlbmQoZXhwb3J0cywgcmVxdWlyZSgnLi9mb3JtLWNvbnRyb2xzJykpXG5cblxuIyBUT0RPIGZpZ3VyZSBvdXQgaG93IHRvIGFsbG93IHR3byBzdXJ2ZXlzIGZvciBkaWZmZXJpbmcgY2xpZW50IHZlcnNpb25zPyBPciBqdXN0IHVzZSBtaW5WZXJzaW9uPyIsImZ1bmN0aW9uIFByb2JsZW1SZXBvcnRlcih1cmwsIHZlcnNpb24sIGdldENsaWVudCkge1xuICAgIHZhciBoaXN0b3J5ID0gW107XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgLy8gSUU5IGhhY2tcbiAgICBpZiAoRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQgJiYgY29uc29sZSAmJiB0eXBlb2YgY29uc29sZS5sb2cgPT0gXCJvYmplY3RcIikge1xuICAgICAgICBbXG4gICAgICAgICAgXCJsb2dcIixcImluZm9cIixcIndhcm5cIixcImVycm9yXCIsXCJhc3NlcnRcIixcImRpclwiLFwiY2xlYXJcIixcInByb2ZpbGVcIixcInByb2ZpbGVFbmRcIlxuICAgICAgICBdLmZvckVhY2goZnVuY3Rpb24gKG1ldGhvZCkge1xuICAgICAgICAgICAgY29uc29sZVttZXRob2RdID0gdGhpcy5iaW5kKGNvbnNvbGVbbWV0aG9kXSwgY29uc29sZSk7XG4gICAgICAgIH0sIEZ1bmN0aW9uLnByb3RvdHlwZS5jYWxsKTtcbiAgICB9XG5cbiAgICB2YXIgX2NhcHR1cmVkID0ge31cblxuICAgIGZ1bmN0aW9uIGNhcHR1cmUoZnVuYykge1xuICAgICAgICB2YXIgb2xkID0gY29uc29sZVtmdW5jXTtcbiAgICAgICAgX2NhcHR1cmVkW2Z1bmNdID0gb2xkO1xuICAgICAgICBjb25zb2xlW2Z1bmNdID0gZnVuY3Rpb24oYXJnKSB7XG4gICAgICAgICAgICBoaXN0b3J5LnB1c2goYXJnKTtcbiAgICAgICAgICAgIGlmIChoaXN0b3J5Lmxlbmd0aCA+IDIwMClcbiAgICAgICAgICAgICAgICBoaXN0b3J5LnNwbGljZSgwLCAyMCk7XG4gICAgICAgICAgICBvbGQuY2FsbChjb25zb2xlLCBhcmcpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgY2FwdHVyZShcImxvZ1wiKTtcbiAgICBjYXB0dXJlKFwid2FyblwiKTtcbiAgICBjYXB0dXJlKFwiZXJyb3JcIik7XG5cbiAgICBmdW5jdGlvbiBnZXRMb2coKSB7XG4gICAgICAgIHZhciBsb2cgPSBcIlwiO1xuICAgICAgICBfLmVhY2goaGlzdG9yeSwgZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICAgICAgbG9nICs9IFN0cmluZyhpdGVtKSArIFwiXFxyXFxuXCI7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gbG9nO1xuICAgIH1cblxuXG4gICAgdGhpcy5yZXBvcnRQcm9ibGVtID0gZnVuY3Rpb24oZGVzYykge1xuICAgICAgICAvLyBDcmVhdGUgbG9nIHN0cmluZ1xuICAgICAgICB2YXIgbG9nID0gZ2V0TG9nKCk7XG5cbiAgICAgICAgY29uc29sZS5sb2coXCJSZXBvcnRpbmcgcHJvYmxlbS4uLlwiKTtcblxuICAgICAgICAkLnBvc3QodXJsLCB7XG4gICAgICAgICAgICBjbGllbnQgOiBnZXRDbGllbnQoKSxcbiAgICAgICAgICAgIHZlcnNpb24gOiB2ZXJzaW9uLFxuICAgICAgICAgICAgdXNlcl9hZ2VudCA6IG5hdmlnYXRvci51c2VyQWdlbnQsXG4gICAgICAgICAgICBsb2cgOiBsb2csXG4gICAgICAgICAgICBkZXNjIDogZGVzY1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgLy8gQ2FwdHVyZSBlcnJvciBsb2dzXG4gICAgdmFyIGRlYm91bmNlZFJlcG9ydFByb2JsZW0gPSBfLmRlYm91bmNlKHRoaXMucmVwb3J0UHJvYmxlbSwgNTAwMCwgdHJ1ZSk7XG5cbiAgICB2YXIgb2xkQ29uc29sZUVycm9yID0gY29uc29sZS5lcnJvcjtcbiAgICBjb25zb2xlLmVycm9yID0gZnVuY3Rpb24oYXJnKSB7XG4gICAgICAgIG9sZENvbnNvbGVFcnJvcihhcmcpO1xuXG4gICAgICAgIGRlYm91bmNlZFJlcG9ydFByb2JsZW0oYXJnKTtcbiAgICB9O1xuXG4gICAgLy8gQ2FwdHVyZSB3aW5kb3cub25lcnJvclxuICAgIHZhciBvbGRXaW5kb3dPbkVycm9yID0gd2luZG93Lm9uZXJyb3I7XG4gICAgd2luZG93Lm9uZXJyb3IgPSBmdW5jdGlvbihlcnJvck1zZywgdXJsLCBsaW5lTnVtYmVyKSB7XG4gICAgICAgIHRoYXQucmVwb3J0UHJvYmxlbShcIndpbmRvdy5vbmVycm9yOlwiICsgZXJyb3JNc2cgKyBcIjpcIiArIHVybCArIFwiOlwiICsgbGluZU51bWJlcik7XG4gICAgICAgIFxuICAgICAgICAvLyBQdXQgdXAgYWxlcnQgaW5zdGVhZCBvZiBvbGQgYWN0aW9uXG4gICAgICAgIGFsZXJ0KFwiSW50ZXJuYWwgRXJyb3JcXG5cIiArIGVycm9yTXNnICsgXCJcXG5cIiArIHVybCArIFwiOlwiICsgbGluZU51bWJlcik7XG4gICAgICAgIC8vaWYgKG9sZFdpbmRvd09uRXJyb3IpXG4gICAgICAgIC8vICAgIG9sZFdpbmRvd09uRXJyb3IoZXJyb3JNc2csIHVybCwgbGluZU51bWJlcik7XG4gICAgfTtcblxuICAgIHRoaXMucmVzdG9yZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBfLmVhY2goXy5rZXlzKF9jYXB0dXJlZCksIGZ1bmN0aW9uKGtleSkge1xuICAgICAgICAgICAgY29uc29sZVtrZXldID0gX2NhcHR1cmVkW2tleV07XG4gICAgICAgIH0pO1xuICAgICAgICB3aW5kb3cub25lcnJvciA9IG9sZFdpbmRvd09uRXJyb3I7XG4gICAgfTtcbn1cblxuUHJvYmxlbVJlcG9ydGVyLnJlZ2lzdGVyID0gZnVuY3Rpb24oYmFzZVVybCwgdmVyc2lvbiwgZ2V0Q2xpZW50KSB7XG4gICAgaWYgKCFQcm9ibGVtUmVwb3J0ZXIuaW5zdGFuY2VzKVxuICAgICAgICBQcm9ibGVtUmVwb3J0ZXIuaW5zdGFuY2VzID0ge31cblxuICAgIGlmIChQcm9ibGVtUmVwb3J0ZXIuaW5zdGFuY2VzW2Jhc2VVcmxdKVxuICAgICAgICByZXR1cm47XG5cbiAgICBuZXcgUHJvYmxlbVJlcG9ydGVyKGJhc2VVcmwsIHZlcnNpb24sIGdldENsaWVudCk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFByb2JsZW1SZXBvcnRlcjsiLCJhc3NlcnQgPSBjaGFpLmFzc2VydFxuXG5jbGFzcyBVSURyaXZlclxuICBjb25zdHJ1Y3RvcjogKGVsKSAtPlxuICAgIEBlbCA9ICQoZWwpXG5cbiAgZ2V0RGlzYWJsZWQ6IChzdHIpIC0+XG4gICAgZm9yIGl0ZW0gaW4gQGVsLmZpbmQoXCJhLGJ1dHRvblwiKVxuICAgICAgaWYgJChpdGVtKS50ZXh0KCkuaW5kZXhPZihzdHIpICE9IC0xXG4gICAgICAgIHJldHVybiAkKGl0ZW0pLmlzKFwiOmRpc2FibGVkXCIpXG4gICAgYXNzZXJ0LmZhaWwobnVsbCwgc3RyLCBcIkNhbid0IGZpbmQ6IFwiICsgc3RyKVxuXG4gIGNsaWNrOiAoc3RyKSAtPlxuICAgIGZvciBpdGVtIGluIEBlbC5maW5kKFwiYSxidXR0b25cIilcbiAgICAgIGlmICQoaXRlbSkudGV4dCgpLmluZGV4T2Yoc3RyKSAhPSAtMVxuICAgICAgICBjb25zb2xlLmxvZyBcIkNsaWNraW5nOiBcIiArICQoaXRlbSkudGV4dCgpXG4gICAgICAgICQoaXRlbSkudHJpZ2dlcihcImNsaWNrXCIpXG4gICAgICAgIHJldHVyblxuICAgIGFzc2VydC5mYWlsKG51bGwsIHN0ciwgXCJDYW4ndCBmaW5kOiBcIiArIHN0cilcbiAgXG4gIGZpbGw6IChzdHIsIHZhbHVlKSAtPlxuICAgIGZvciBpdGVtIGluIEBlbC5maW5kKFwibGFiZWxcIilcbiAgICAgIGlmICQoaXRlbSkudGV4dCgpLmluZGV4T2Yoc3RyKSAhPSAtMVxuICAgICAgICBib3ggPSBAZWwuZmluZChcIiNcIiskKGl0ZW0pLmF0dHIoJ2ZvcicpKVxuICAgICAgICBib3gudmFsKHZhbHVlKVxuICBcbiAgdGV4dDogLT5cbiAgICByZXR1cm4gQGVsLnRleHQoKVxuICAgICAgXG4gIHdhaXQ6IChhZnRlcikgLT5cbiAgICBzZXRUaW1lb3V0IGFmdGVyLCAxMFxuXG5tb2R1bGUuZXhwb3J0cyA9IFVJRHJpdmVyIiwiIyBHZW9KU09OIGhlbHBlciByb3V0aW5lc1xuXG4jIENvbnZlcnRzIG5hdmlnYXRvciBwb3NpdGlvbiB0byBwb2ludFxuZXhwb3J0cy5wb3NUb1BvaW50ID0gKHBvcykgLT5cbiAgcmV0dXJuIHtcbiAgICB0eXBlOiAnUG9pbnQnXG4gICAgY29vcmRpbmF0ZXM6IFtwb3MuY29vcmRzLmxvbmdpdHVkZSwgcG9zLmNvb3Jkcy5sYXRpdHVkZV1cbiAgfVxuXG5cbmV4cG9ydHMubGF0TG5nQm91bmRzVG9HZW9KU09OID0gKGJvdW5kcykgLT5cbiAgc3cgPSBib3VuZHMuZ2V0U291dGhXZXN0KClcbiAgbmUgPSBib3VuZHMuZ2V0Tm9ydGhFYXN0KClcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiAnUG9seWdvbicsXG4gICAgY29vcmRpbmF0ZXM6IFtcbiAgICAgIFtbc3cubG5nLCBzdy5sYXRdLCBcbiAgICAgIFtzdy5sbmcsIG5lLmxhdF0sIFxuICAgICAgW25lLmxuZywgbmUubGF0XSwgXG4gICAgICBbbmUubG5nLCBzdy5sYXRdLFxuICAgICAgW3N3LmxuZywgc3cubGF0XV1cbiAgICBdXG4gIH1cblxuIyBUT0RPOiBvbmx5IHdvcmtzIHdpdGggYm91bmRzXG5leHBvcnRzLnBvaW50SW5Qb2x5Z29uID0gKHBvaW50LCBwb2x5Z29uKSAtPlxuICAjIENoZWNrIHRoYXQgZmlyc3QgPT0gbGFzdFxuICBpZiBub3QgXy5pc0VxdWFsKF8uZmlyc3QocG9seWdvbi5jb29yZGluYXRlc1swXSksIF8ubGFzdChwb2x5Z29uLmNvb3JkaW5hdGVzWzBdKSlcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJGaXJzdCBtdXN0IGVxdWFsIGxhc3RcIilcblxuICAjIEdldCBib3VuZHNcbiAgYm91bmRzID0gbmV3IEwuTGF0TG5nQm91bmRzKF8ubWFwKHBvbHlnb24uY29vcmRpbmF0ZXNbMF0sIChjb29yZCkgLT4gbmV3IEwuTGF0TG5nKGNvb3JkWzFdLCBjb29yZFswXSkpKVxuICByZXR1cm4gYm91bmRzLmNvbnRhaW5zKG5ldyBMLkxhdExuZyhwb2ludC5jb29yZGluYXRlc1sxXSwgcG9pbnQuY29vcmRpbmF0ZXNbMF0pKVxuXG5leHBvcnRzLmdldFJlbGF0aXZlTG9jYXRpb24gPSAoZnJvbSwgdG8pIC0+XG4gIHgxID0gZnJvbS5jb29yZGluYXRlc1swXVxuICB5MSA9IGZyb20uY29vcmRpbmF0ZXNbMV1cbiAgeDIgPSB0by5jb29yZGluYXRlc1swXVxuICB5MiA9IHRvLmNvb3JkaW5hdGVzWzFdXG4gIFxuICAjIENvbnZlcnQgdG8gcmVsYXRpdmUgcG9zaXRpb24gKGFwcHJveGltYXRlKVxuICBkeSA9ICh5MiAtIHkxKSAvIDU3LjMgKiA2MzcxMDAwXG4gIGR4ID0gTWF0aC5jb3MoeTEgLyA1Ny4zKSAqICh4MiAtIHgxKSAvIDU3LjMgKiA2MzcxMDAwXG4gIFxuICAjIERldGVybWluZSBkaXJlY3Rpb24gYW5kIGFuZ2xlXG4gIGRpc3QgPSBNYXRoLnNxcnQoZHggKiBkeCArIGR5ICogZHkpXG4gIGFuZ2xlID0gOTAgLSAoTWF0aC5hdGFuMihkeSwgZHgpICogNTcuMylcbiAgYW5nbGUgKz0gMzYwIGlmIGFuZ2xlIDwgMFxuICBhbmdsZSAtPSAzNjAgaWYgYW5nbGUgPiAzNjBcbiAgXG4gICMgR2V0IGFwcHJveGltYXRlIGRpcmVjdGlvblxuICBjb21wYXNzRGlyID0gKE1hdGguZmxvb3IoKGFuZ2xlICsgMjIuNSkgLyA0NSkpICUgOFxuICBjb21wYXNzU3RycyA9IFtcIk5cIiwgXCJORVwiLCBcIkVcIiwgXCJTRVwiLCBcIlNcIiwgXCJTV1wiLCBcIldcIiwgXCJOV1wiXVxuICBpZiBkaXN0ID4gMTAwMFxuICAgIChkaXN0IC8gMTAwMCkudG9GaXhlZCgxKSArIFwia20gXCIgKyBjb21wYXNzU3Ryc1tjb21wYXNzRGlyXVxuICBlbHNlXG4gICAgKGRpc3QpLnRvRml4ZWQoMCkgKyBcIm0gXCIgKyBjb21wYXNzU3Ryc1tjb21wYXNzRGlyXSIsIlxuIyBUcmFja3MgYSBzZXQgb2YgaXRlbXMgYnkgaWQsIGluZGljYXRpbmcgd2hpY2ggaGF2ZSBiZWVuIGFkZGVkIG9yIHJlbW92ZWQuXG4jIENoYW5nZXMgYXJlIGJvdGggYWRkIGFuZCByZW1vdmVcbmNsYXNzIEl0ZW1UcmFja2VyXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgIEBrZXkgPSAnX2lkJ1xuICAgIEBpdGVtcyA9IHt9XG5cbiAgdXBkYXRlOiAoaXRlbXMpIC0+ICAgICMgUmV0dXJuIFtbYWRkZWRdLFtyZW1vdmVkXV0gaXRlbXNcbiAgICBhZGRzID0gW11cbiAgICByZW1vdmVzID0gW11cblxuICAgICMgQWRkIGFueSBuZXcgb25lc1xuICAgIGZvciBpdGVtIGluIGl0ZW1zXG4gICAgICBpZiBub3QgXy5oYXMoQGl0ZW1zLCBpdGVtW0BrZXldKVxuICAgICAgICBhZGRzLnB1c2goaXRlbSlcblxuICAgICMgQ3JlYXRlIG1hcCBvZiBpdGVtcyBwYXJhbWV0ZXJcbiAgICBtYXAgPSBfLm9iamVjdChfLnBsdWNrKGl0ZW1zLCBAa2V5KSwgaXRlbXMpXG5cbiAgICAjIEZpbmQgcmVtb3Zlc1xuICAgIGZvciBrZXksIHZhbHVlIG9mIEBpdGVtc1xuICAgICAgaWYgbm90IF8uaGFzKG1hcCwga2V5KVxuICAgICAgICByZW1vdmVzLnB1c2godmFsdWUpXG4gICAgICBlbHNlIGlmIG5vdCBfLmlzRXF1YWwodmFsdWUsIG1hcFtrZXldKVxuICAgICAgICBhZGRzLnB1c2gobWFwW2tleV0pXG4gICAgICAgIHJlbW92ZXMucHVzaCh2YWx1ZSlcblxuICAgIGZvciBpdGVtIGluIHJlbW92ZXNcbiAgICAgIGRlbGV0ZSBAaXRlbXNbaXRlbVtAa2V5XV1cblxuICAgIGZvciBpdGVtIGluIGFkZHNcbiAgICAgIEBpdGVtc1tpdGVtW0BrZXldXSA9IGl0ZW1cblxuICAgIHJldHVybiBbYWRkcywgcmVtb3Zlc11cblxubW9kdWxlLmV4cG9ydHMgPSBJdGVtVHJhY2tlciIsIlxuIyBBdXRob3JpemF0aW9uIGNsYXNzZXMgYWxsIGZvbGxvdyBzYW1lIHBhdHRlcm4uXG4jIGRvYyBjYW4gYmUgdW5kZWZpbmVkIGluIHVwZGF0ZSBhbmQgcmVtb3ZlOiBhdXRob3JpemVzIHdoZXRoZXIgZXZlciBwb3NzaWJsZS5cblxuZXhwb3J0cy5BbGxBdXRoID0gY2xhc3MgQWxsQXV0aFxuICBpbnNlcnQ6IChjb2wpIC0+XG4gICAgcmV0dXJuIHRydWVcblxuICB1cGRhdGU6IChjb2wsIGRvYykgLT5cbiAgICByZXR1cm4gdHJ1ZVxuXG4gIHJlbW92ZTogKGNvbCwgZG9jKSAtPlxuICAgIHJldHVybiB0cnVlXG4gICAgXG5leHBvcnRzLk5vbmVBdXRoID0gY2xhc3MgTm9uZUF1dGhcbiAgaW5zZXJ0OiAoY29sKSAtPlxuICAgIHJldHVybiBmYWxzZVxuXG4gIHVwZGF0ZTogKGNvbCwgZG9jKSAtPlxuICAgIHJldHVybiBmYWxzZVxuXG4gIHJlbW92ZTogKGNvbCwgZG9jKSAtPlxuICAgIHJldHVybiBmYWxzZVxuXG5leHBvcnRzLlVzZXJBdXRoID0gY2xhc3MgVXNlckF1dGhcbiAgIyB1c2VyIGlzIHVzZXJuYW1lLCBvcmcgaXMgb3JnIGNvZGVcbiAgY29uc3RydWN0b3I6ICh1c2VyLCBvcmcpIC0+XG4gICAgQHVzZXIgPSB1c2VyXG4gICAgQG9yZyA9IG9yZ1xuXG4gICAgQGVkaXRhYmxlQ29scyA9IFsnc291cmNlcycsICdzb3VyY2Vfbm90ZXMnLCAndGVzdHMnLCAncmVzcG9uc2VzJ11cblxuICBpbnNlcnQ6IChjb2wpIC0+XG4gICAgaWYgbm90IChjb2wgaW4gQGVkaXRhYmxlQ29scylcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIHJldHVybiB0cnVlXG5cbiAgdXBkYXRlOiAoY29sLCBkb2MpIC0+XG4gICAgaWYgbm90IChjb2wgaW4gQGVkaXRhYmxlQ29scylcbiAgICAgIHJldHVybiBmYWxzZVxuXG4gICAgaWYgbm90IGRvY1xuICAgICAgcmV0dXJuIHRydWVcblxuICAgIGlmIGRvYy5vcmcgYW5kIEBvcmdcbiAgICAgIHJldHVybiBkb2MudXNlciA9PSBAdXNlciB8fCBkb2Mub3JnID09IEBvcmdcbiAgICBlbHNlXG4gICAgICByZXR1cm4gZG9jLnVzZXIgPT0gQHVzZXJcblxuICByZW1vdmU6IChjb2wsIGRvYykgLT5cbiAgICBpZiBub3QgKGNvbCBpbiBAZWRpdGFibGVDb2xzKVxuICAgICAgcmV0dXJuIGZhbHNlXG5cbiAgICBpZiBub3QgZG9jXG4gICAgICByZXR1cm4gdHJ1ZVxuXG4gICAgaWYgZG9jLm9yZyBhbmQgQG9yZ1xuICAgICAgcmV0dXJuIGRvYy51c2VyID09IEB1c2VyIHx8IGRvYy5vcmcgPT0gQG9yZ1xuICAgIGVsc2VcbiAgICAgIHJldHVybiBkb2MudXNlciA9PSBAdXNlclxuXG5cbiAgICAiLCJtb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFJlbW90ZURiXG4gICMgVXJsIG11c3QgaGF2ZSB0cmFpbGluZyAvXG4gIGNvbnN0cnVjdG9yOiAodXJsLCBjbGllbnQpIC0+XG4gICAgQHVybCA9IHVybFxuICAgIEBjbGllbnQgPSBjbGllbnRcbiAgICBAY29sbGVjdGlvbnMgPSB7fVxuXG4gIGFkZENvbGxlY3Rpb246IChuYW1lKSAtPlxuICAgIGNvbGxlY3Rpb24gPSBuZXcgQ29sbGVjdGlvbihuYW1lLCBAdXJsICsgbmFtZSwgQGNsaWVudClcbiAgICBAW25hbWVdID0gY29sbGVjdGlvblxuICAgIEBjb2xsZWN0aW9uc1tuYW1lXSA9IGNvbGxlY3Rpb25cblxuICByZW1vdmVDb2xsZWN0aW9uOiAobmFtZSkgLT5cbiAgICBkZWxldGUgQFtuYW1lXVxuICAgIGRlbGV0ZSBAY29sbGVjdGlvbnNbbmFtZV1cblxuIyBSZW1vdGUgY29sbGVjdGlvbiBvbiBzZXJ2ZXJcbmNsYXNzIENvbGxlY3Rpb25cbiAgY29uc3RydWN0b3I6IChuYW1lLCB1cmwsIGNsaWVudCkgLT5cbiAgICBAbmFtZSA9IG5hbWVcbiAgICBAdXJsID0gdXJsXG4gICAgQGNsaWVudCA9IGNsaWVudFxuXG4gIGZpbmQ6IChzZWxlY3Rvciwgb3B0aW9ucyA9IHt9KSAtPlxuICAgIHJldHVybiBmZXRjaDogKHN1Y2Nlc3MsIGVycm9yKSA9PlxuICAgICAgIyBDcmVhdGUgdXJsXG4gICAgICBwYXJhbXMgPSB7fVxuICAgICAgaWYgb3B0aW9ucy5zb3J0XG4gICAgICAgIHBhcmFtcy5zb3J0ID0gSlNPTi5zdHJpbmdpZnkob3B0aW9ucy5zb3J0KVxuICAgICAgaWYgb3B0aW9ucy5saW1pdFxuICAgICAgICBwYXJhbXMubGltaXQgPSBvcHRpb25zLmxpbWl0XG4gICAgICBpZiBvcHRpb25zLmZpZWxkc1xuICAgICAgICBwYXJhbXMuZmllbGRzID0gSlNPTi5zdHJpbmdpZnkob3B0aW9ucy5maWVsZHMpXG4gICAgICBpZiBAY2xpZW50XG4gICAgICAgIHBhcmFtcy5jbGllbnQgPSBAY2xpZW50XG4gICAgICBwYXJhbXMuc2VsZWN0b3IgPSBKU09OLnN0cmluZ2lmeShzZWxlY3RvciB8fCB7fSlcblxuICAgICAgcmVxID0gJC5nZXRKU09OKEB1cmwsIHBhcmFtcylcbiAgICAgIHJlcS5kb25lIChkYXRhLCB0ZXh0U3RhdHVzLCBqcVhIUikgPT5cbiAgICAgICAgc3VjY2VzcyhkYXRhKVxuICAgICAgcmVxLmZhaWwgKGpxWEhSLCB0ZXh0U3RhdHVzLCBlcnJvclRocm93bikgPT5cbiAgICAgICAgaWYgZXJyb3JcbiAgICAgICAgICBlcnJvcihlcnJvclRocm93bilcblxuICBmaW5kT25lOiAoc2VsZWN0b3IsIG9wdGlvbnMgPSB7fSwgc3VjY2VzcywgZXJyb3IpIC0+XG4gICAgaWYgXy5pc0Z1bmN0aW9uKG9wdGlvbnMpIFxuICAgICAgW29wdGlvbnMsIHN1Y2Nlc3MsIGVycm9yXSA9IFt7fSwgb3B0aW9ucywgc3VjY2Vzc11cblxuICAgICMgQ3JlYXRlIHVybFxuICAgIHBhcmFtcyA9IHt9XG4gICAgaWYgb3B0aW9ucy5zb3J0XG4gICAgICBwYXJhbXMuc29ydCA9IEpTT04uc3RyaW5naWZ5KG9wdGlvbnMuc29ydClcbiAgICBwYXJhbXMubGltaXQgPSAxXG4gICAgaWYgQGNsaWVudFxuICAgICAgcGFyYW1zLmNsaWVudCA9IEBjbGllbnRcbiAgICBwYXJhbXMuc2VsZWN0b3IgPSBKU09OLnN0cmluZ2lmeShzZWxlY3RvciB8fCB7fSlcblxuICAgIHJlcSA9ICQuZ2V0SlNPTihAdXJsLCBwYXJhbXMpXG4gICAgcmVxLmRvbmUgKGRhdGEsIHRleHRTdGF0dXMsIGpxWEhSKSA9PlxuICAgICAgc3VjY2VzcyhkYXRhWzBdIHx8IG51bGwpXG4gICAgcmVxLmZhaWwgKGpxWEhSLCB0ZXh0U3RhdHVzLCBlcnJvclRocm93bikgPT5cbiAgICAgIGlmIGVycm9yXG4gICAgICAgIGVycm9yKGVycm9yVGhyb3duKVxuXG4gIHVwc2VydDogKGRvYywgc3VjY2VzcywgZXJyb3IpIC0+XG4gICAgaWYgbm90IEBjbGllbnRcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkNsaWVudCByZXF1aXJlZCB0byB1cHNlcnRcIilcblxuICAgIGlmIG5vdCBkb2MuX2lkXG4gICAgICBkb2MuX2lkID0gY3JlYXRlVWlkKClcblxuICAgIHJlcSA9ICQuYWpheChAdXJsICsgXCI/Y2xpZW50PVwiICsgQGNsaWVudCwge1xuICAgICAgZGF0YSA6IEpTT04uc3RyaW5naWZ5KGRvYyksXG4gICAgICBjb250ZW50VHlwZSA6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgIHR5cGUgOiAnUE9TVCd9KVxuICAgIHJlcS5kb25lIChkYXRhLCB0ZXh0U3RhdHVzLCBqcVhIUikgPT5cbiAgICAgIHN1Y2Nlc3MoZGF0YSB8fCBudWxsKVxuICAgIHJlcS5mYWlsIChqcVhIUiwgdGV4dFN0YXR1cywgZXJyb3JUaHJvd24pID0+XG4gICAgICBpZiBlcnJvclxuICAgICAgICBlcnJvcihlcnJvclRocm93bilcblxuICByZW1vdmU6IChpZCwgc3VjY2VzcywgZXJyb3IpIC0+XG4gICAgaWYgbm90IEBjbGllbnRcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkNsaWVudCByZXF1aXJlZCB0byByZW1vdmVcIilcbiAgICAgIFxuICAgIHJlcSA9ICQuYWpheChAdXJsICsgXCIvXCIgKyBpZCArIFwiP2NsaWVudD1cIiArIEBjbGllbnQsIHsgdHlwZSA6ICdERUxFVEUnfSlcbiAgICByZXEuZG9uZSAoZGF0YSwgdGV4dFN0YXR1cywganFYSFIpID0+XG4gICAgICBzdWNjZXNzKClcbiAgICByZXEuZmFpbCAoanFYSFIsIHRleHRTdGF0dXMsIGVycm9yVGhyb3duKSA9PlxuICAgICAgaWYganFYSFIuc3RhdHVzID09IDQwNFxuICAgICAgICBzdWNjZXNzKClcbiAgICAgIGVsc2UgaWYgZXJyb3JcbiAgICAgICAgZXJyb3IoZXJyb3JUaHJvd24pXG5cblxuY3JlYXRlVWlkID0gLT4gXG4gICd4eHh4eHh4eHh4eHg0eHh4eXh4eHh4eHh4eHh4eHh4eCcucmVwbGFjZSgvW3h5XS9nLCAoYykgLT5cbiAgICByID0gTWF0aC5yYW5kb20oKSoxNnwwXG4gICAgdiA9IGlmIGMgPT0gJ3gnIHRoZW4gciBlbHNlIChyJjB4M3wweDgpXG4gICAgcmV0dXJuIHYudG9TdHJpbmcoMTYpXG4gICApIiwiTG9jYXRpb25GaW5kZXIgPSByZXF1aXJlICcuL0xvY2F0aW9uRmluZGVyJ1xuR2VvSlNPTiA9IHJlcXVpcmUgJy4vR2VvSlNPTidcblxuIyBTaG93cyB0aGUgcmVsYXRpdmUgbG9jYXRpb24gb2YgYSBwb2ludCBhbmQgYWxsb3dzIHNldHRpbmcgaXRcbiMgRmlyZXMgZXZlbnRzIGxvY2F0aW9uc2V0LCBtYXAsIGJvdGggd2l0aCBcbiMgb3B0aW9ucyByZWFkb25seSBtYWtlcyBpdCBub24tZWRpdGFibGVcbmNsYXNzIExvY2F0aW9uVmlldyBleHRlbmRzIEJhY2tib25lLlZpZXdcbiAgY29uc3RydWN0b3I6IChvcHRpb25zKSAtPlxuICAgIHN1cGVyKClcbiAgICBAbG9jID0gb3B0aW9ucy5sb2NcbiAgICBAcmVhZG9ubHkgPSBvcHRpb25zLnJlYWRvbmx5XG4gICAgQHNldHRpbmdMb2NhdGlvbiA9IGZhbHNlXG4gICAgQGxvY2F0aW9uRmluZGVyID0gb3B0aW9ucy5sb2NhdGlvbkZpbmRlciB8fCBuZXcgTG9jYXRpb25GaW5kZXIoKVxuXG4gICAgIyBMaXN0ZW4gdG8gbG9jYXRpb24gZXZlbnRzXG4gICAgQGxpc3RlblRvKEBsb2NhdGlvbkZpbmRlciwgJ2ZvdW5kJywgQGxvY2F0aW9uRm91bmQpXG4gICAgQGxpc3RlblRvKEBsb2NhdGlvbkZpbmRlciwgJ2Vycm9yJywgQGxvY2F0aW9uRXJyb3IpXG5cbiAgICAjIFN0YXJ0IHRyYWNraW5nIGxvY2F0aW9uIGlmIHNldFxuICAgIGlmIEBsb2NcbiAgICAgIEBsb2NhdGlvbkZpbmRlci5zdGFydFdhdGNoKClcblxuICAgIEByZW5kZXIoKVxuXG4gIGV2ZW50czpcbiAgICAnY2xpY2sgI2xvY2F0aW9uX21hcCcgOiAnbWFwQ2xpY2tlZCdcbiAgICAnY2xpY2sgI2xvY2F0aW9uX3NldCcgOiAnc2V0TG9jYXRpb24nXG5cbiAgcmVtb3ZlOiAtPlxuICAgIEBsb2NhdGlvbkZpbmRlci5zdG9wV2F0Y2goKVxuICAgIHN1cGVyKClcblxuICByZW5kZXI6IC0+XG4gICAgQCRlbC5odG1sIHRlbXBsYXRlc1snTG9jYXRpb25WaWV3J10oKVxuXG4gICAgIyBTZXQgbG9jYXRpb24gc3RyaW5nXG4gICAgaWYgQGVycm9yRmluZGluZ0xvY2F0aW9uXG4gICAgICBAJChcIiNsb2NhdGlvbl9yZWxhdGl2ZVwiKS50ZXh0KFwiQ2Fubm90IGZpbmQgbG9jYXRpb25cIilcbiAgICBlbHNlIGlmIG5vdCBAbG9jIGFuZCBub3QgQHNldHRpbmdMb2NhdGlvbiBcbiAgICAgIEAkKFwiI2xvY2F0aW9uX3JlbGF0aXZlXCIpLnRleHQoXCJVbnNwZWNpZmllZCBsb2NhdGlvblwiKVxuICAgIGVsc2UgaWYgQHNldHRpbmdMb2NhdGlvblxuICAgICAgQCQoXCIjbG9jYXRpb25fcmVsYXRpdmVcIikudGV4dChcIlNldHRpbmcgbG9jYXRpb24uLi5cIilcbiAgICBlbHNlIGlmIG5vdCBAY3VycmVudExvY1xuICAgICAgQCQoXCIjbG9jYXRpb25fcmVsYXRpdmVcIikudGV4dChcIldhaXRpbmcgZm9yIEdQUy4uLlwiKVxuICAgIGVsc2VcbiAgICAgIEAkKFwiI2xvY2F0aW9uX3JlbGF0aXZlXCIpLnRleHQoR2VvSlNPTi5nZXRSZWxhdGl2ZUxvY2F0aW9uKEBjdXJyZW50TG9jLCBAbG9jKSlcblxuICAgICMgRGlzYWJsZSBtYXAgaWYgbG9jYXRpb24gbm90IHNldFxuICAgIEAkKFwiI2xvY2F0aW9uX21hcFwiKS5hdHRyKFwiZGlzYWJsZWRcIiwgbm90IEBsb2MpO1xuXG4gICAgIyBEaXNhYmxlIHNldCBpZiBzZXR0aW5nIG9yIHJlYWRvbmx5XG4gICAgQCQoXCIjbG9jYXRpb25fc2V0XCIpLmF0dHIoXCJkaXNhYmxlZFwiLCBAc2V0dGluZ0xvY2F0aW9uIHx8IEByZWFkb25seSk7ICAgIFxuXG4gIHNldExvY2F0aW9uOiAtPlxuICAgIEBzZXR0aW5nTG9jYXRpb24gPSB0cnVlXG4gICAgQGVycm9yRmluZGluZ0xvY2F0aW9uID0gZmFsc2VcbiAgICBAbG9jYXRpb25GaW5kZXIuc3RhcnRXYXRjaCgpXG4gICAgQHJlbmRlcigpXG5cbiAgbG9jYXRpb25Gb3VuZDogKHBvcykgPT5cbiAgICBpZiBAc2V0dGluZ0xvY2F0aW9uXG4gICAgICBAc2V0dGluZ0xvY2F0aW9uID0gZmFsc2VcbiAgICAgIEBlcnJvckZpbmRpbmdMb2NhdGlvbiA9IGZhbHNlXG5cbiAgICAgICMgU2V0IGxvY2F0aW9uXG4gICAgICBAbG9jID0gR2VvSlNPTi5wb3NUb1BvaW50KHBvcylcbiAgICAgIEB0cmlnZ2VyKCdsb2NhdGlvbnNldCcsIEBsb2MpXG5cbiAgICBAY3VycmVudExvYyA9IEdlb0pTT04ucG9zVG9Qb2ludChwb3MpXG4gICAgQHJlbmRlcigpXG5cbiAgbG9jYXRpb25FcnJvcjogPT5cbiAgICBAc2V0dGluZ0xvY2F0aW9uID0gZmFsc2VcbiAgICBAZXJyb3JGaW5kaW5nTG9jYXRpb24gPSB0cnVlXG4gICAgQHJlbmRlcigpXG5cbiAgbWFwQ2xpY2tlZDogPT5cbiAgICBAdHJpZ2dlcignbWFwJywgQGxvYylcblxuXG5tb2R1bGUuZXhwb3J0cyA9IExvY2F0aW9uVmlldyIsIiMjI1xuXG5EYXRhYmFzZSB3aGljaCBjYWNoZXMgbG9jYWxseSBpbiBhIGxvY2FsRGIgYnV0IHB1bGxzIHJlc3VsdHNcbnVsdGltYXRlbHkgZnJvbSBhIFJlbW90ZURiXG5cbiMjI1xuXG5wcm9jZXNzRmluZCA9IHJlcXVpcmUoJy4vdXRpbHMnKS5wcm9jZXNzRmluZFxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEh5YnJpZERiXG4gIGNvbnN0cnVjdG9yOiAobG9jYWxEYiwgcmVtb3RlRGIpIC0+XG4gICAgQGxvY2FsRGIgPSBsb2NhbERiXG4gICAgQHJlbW90ZURiID0gcmVtb3RlRGJcbiAgICBAY29sbGVjdGlvbnMgPSB7fVxuXG4gIGFkZENvbGxlY3Rpb246IChuYW1lKSAtPlxuICAgIGNvbGxlY3Rpb24gPSBuZXcgSHlicmlkQ29sbGVjdGlvbihuYW1lLCBAbG9jYWxEYltuYW1lXSwgQHJlbW90ZURiW25hbWVdKVxuICAgIEBbbmFtZV0gPSBjb2xsZWN0aW9uXG4gICAgQGNvbGxlY3Rpb25zW25hbWVdID0gY29sbGVjdGlvblxuXG4gIHJlbW92ZUNvbGxlY3Rpb246IChuYW1lKSAtPlxuICAgIGRlbGV0ZSBAW25hbWVdXG4gICAgZGVsZXRlIEBjb2xsZWN0aW9uc1tuYW1lXVxuICBcbiAgdXBsb2FkOiAoc3VjY2VzcywgZXJyb3IpIC0+XG4gICAgY29scyA9IF8udmFsdWVzKEBjb2xsZWN0aW9ucylcblxuICAgIHVwbG9hZENvbHMgPSAoY29scywgc3VjY2VzcywgZXJyb3IpID0+XG4gICAgICBjb2wgPSBfLmZpcnN0KGNvbHMpXG4gICAgICBpZiBjb2xcbiAgICAgICAgY29sLnVwbG9hZCgoKSA9PlxuICAgICAgICAgIHVwbG9hZENvbHMoXy5yZXN0KGNvbHMpLCBzdWNjZXNzLCBlcnJvcilcbiAgICAgICAgLCAoZXJyKSA9PlxuICAgICAgICAgIGVycm9yKGVycikpXG4gICAgICBlbHNlXG4gICAgICAgIHN1Y2Nlc3MoKVxuICAgIHVwbG9hZENvbHMoY29scywgc3VjY2VzcywgZXJyb3IpXG5cbmNsYXNzIEh5YnJpZENvbGxlY3Rpb25cbiAgY29uc3RydWN0b3I6IChuYW1lLCBsb2NhbENvbCwgcmVtb3RlQ29sKSAtPlxuICAgIEBuYW1lID0gbmFtZVxuICAgIEBsb2NhbENvbCA9IGxvY2FsQ29sXG4gICAgQHJlbW90ZUNvbCA9IHJlbW90ZUNvbFxuXG4gICMgb3B0aW9ucy5tb2RlIGRlZmF1bHRzIHRvIFwiaHlicmlkXCIuXG4gICMgSW4gXCJoeWJyaWRcIiwgaXQgd2lsbCByZXR1cm4gbG9jYWwgcmVzdWx0cywgdGhlbiBoaXQgcmVtb3RlIGFuZCByZXR1cm4gYWdhaW4gaWYgZGlmZmVyZW50XG4gICMgSWYgcmVtb3RlIGdpdmVzIGVycm9yLCBpdCB3aWxsIGJlIGlnbm9yZWRcbiAgIyBJbiBcInJlbW90ZVwiLCBpdCB3aWxsIGNhbGwgcmVtb3RlIGFuZCBub3QgY2FjaGUsIGJ1dCBpbnRlZ3JhdGVzIGxvY2FsIHVwc2VydHMvZGVsZXRlc1xuICAjIElmIHJlbW90ZSBnaXZlcyBlcnJvciwgdGhlbiBpdCB3aWxsIHJldHVybiBsb2NhbCByZXN1bHRzXG4gICMgSW4gXCJsb2NhbFwiLCBqdXN0IHJldHVybnMgbG9jYWwgcmVzdWx0c1xuICBmaW5kOiAoc2VsZWN0b3IsIG9wdGlvbnMgPSB7fSkgLT5cbiAgICByZXR1cm4gZmV0Y2g6IChzdWNjZXNzLCBlcnJvcikgPT5cbiAgICAgIEBfZmluZEZldGNoKHNlbGVjdG9yLCBvcHRpb25zLCBzdWNjZXNzLCBlcnJvcilcblxuICAjIG9wdGlvbnMubW9kZSBkZWZhdWx0cyB0byBcImh5YnJpZFwiLlxuICAjIEluIFwiaHlicmlkXCIsIGl0IHdpbGwgcmV0dXJuIGxvY2FsIGlmIHByZXNlbnQsIG90aGVyd2lzZSBmYWxsIHRvIHJlbW90ZSB3aXRob3V0IHJldHVybmluZyBudWxsXG4gICMgSWYgcmVtb3RlIGdpdmVzIGVycm9yLCB0aGVuIGl0IHdpbGwgcmV0dXJuIG51bGwgaWYgbm9uZSBsb2NhbGx5LiBJZiByZW1vdGUgYW5kIGxvY2FsIGRpZmZlciwgaXRcbiAgIyB3aWxsIHJldHVybiB0d2ljZVxuICAjIEluIFwibG9jYWxcIiwgaXQgd2lsbCByZXR1cm4gbG9jYWwgaWYgcHJlc2VudC4gSWYgbm90IHByZXNlbnQsIG9ubHkgdGhlbiB3aWxsIGl0IGhpdCByZW1vdGUuXG4gICMgSWYgcmVtb3RlIGdpdmVzIGVycm9yLCB0aGVuIGl0IHdpbGwgcmV0dXJuIG51bGxcbiAgIyBJbiBcInJlbW90ZVwiLi4uIChub3QgaW1wbGVtZW50ZWQpXG4gIGZpbmRPbmU6IChzZWxlY3Rvciwgb3B0aW9ucyA9IHt9LCBzdWNjZXNzLCBlcnJvcikgLT5cbiAgICBpZiBfLmlzRnVuY3Rpb24ob3B0aW9ucykgXG4gICAgICBbb3B0aW9ucywgc3VjY2VzcywgZXJyb3JdID0gW3t9LCBvcHRpb25zLCBzdWNjZXNzXVxuXG4gICAgbW9kZSA9IG9wdGlvbnMubW9kZSB8fCBcImh5YnJpZFwiXG5cbiAgICBpZiBtb2RlID09IFwiaHlicmlkXCIgb3IgbW9kZSA9PSBcImxvY2FsXCJcbiAgICAgIG9wdGlvbnMubGltaXQgPSAxXG4gICAgICBAbG9jYWxDb2wuZmluZE9uZSBzZWxlY3Rvciwgb3B0aW9ucywgKGxvY2FsRG9jKSA9PlxuICAgICAgICAjIElmIGZvdW5kLCByZXR1cm5cbiAgICAgICAgaWYgbG9jYWxEb2NcbiAgICAgICAgICBzdWNjZXNzKGxvY2FsRG9jKVxuICAgICAgICAgICMgTm8gbmVlZCB0byBoaXQgcmVtb3RlIGlmIGxvY2FsXG4gICAgICAgICAgaWYgbW9kZSA9PSBcImxvY2FsXCJcbiAgICAgICAgICAgIHJldHVybiBcblxuICAgICAgICByZW1vdGVTdWNjZXNzID0gKHJlbW90ZURvYykgPT5cbiAgICAgICAgICAjIENhY2hlXG4gICAgICAgICAgY2FjaGVTdWNjZXNzID0gPT5cbiAgICAgICAgICAgICMgVHJ5IHF1ZXJ5IGFnYWluXG4gICAgICAgICAgICBAbG9jYWxDb2wuZmluZE9uZSBzZWxlY3Rvciwgb3B0aW9ucywgKGxvY2FsRG9jMikgPT5cbiAgICAgICAgICAgICAgaWYgbm90IF8uaXNFcXVhbChsb2NhbERvYywgbG9jYWxEb2MyKVxuICAgICAgICAgICAgICAgIHN1Y2Nlc3MobG9jYWxEb2MyKVxuICAgICAgICAgICAgICBlbHNlIGlmIG5vdCBsb2NhbERvY1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3MobnVsbClcblxuICAgICAgICAgIGRvY3MgPSBpZiByZW1vdGVEb2MgdGhlbiBbcmVtb3RlRG9jXSBlbHNlIFtdXG4gICAgICAgICAgQGxvY2FsQ29sLmNhY2hlKGRvY3MsIHNlbGVjdG9yLCBvcHRpb25zLCBjYWNoZVN1Y2Nlc3MsIGVycm9yKVxuXG4gICAgICAgIHJlbW90ZUVycm9yID0gPT5cbiAgICAgICAgICAjIFJlbW90ZSBlcnJvcmVkIG91dC4gUmV0dXJuIG51bGwgaWYgbG9jYWwgZGlkIG5vdCByZXR1cm5cbiAgICAgICAgICBpZiBub3QgbG9jYWxEb2NcbiAgICAgICAgICAgIHN1Y2Nlc3MobnVsbClcblxuICAgICAgICAjIENhbGwgcmVtb3RlXG4gICAgICAgIEByZW1vdGVDb2wuZmluZE9uZSBzZWxlY3RvciwgXy5vbWl0KG9wdGlvbnMsICdmaWVsZHMnKSwgcmVtb3RlU3VjY2VzcywgcmVtb3RlRXJyb3JcbiAgICAgICwgZXJyb3JcbiAgICBlbHNlIFxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5rbm93biBtb2RlXCIpXG5cbiAgX2ZpbmRGZXRjaDogKHNlbGVjdG9yLCBvcHRpb25zLCBzdWNjZXNzLCBlcnJvcikgLT5cbiAgICBtb2RlID0gb3B0aW9ucy5tb2RlIHx8IFwiaHlicmlkXCJcblxuICAgIGlmIG1vZGUgPT0gXCJoeWJyaWRcIlxuICAgICAgIyBHZXQgbG9jYWwgcmVzdWx0c1xuICAgICAgbG9jYWxTdWNjZXNzID0gKGxvY2FsRGF0YSkgPT5cbiAgICAgICAgIyBSZXR1cm4gZGF0YSBpbW1lZGlhdGVseVxuICAgICAgICBzdWNjZXNzKGxvY2FsRGF0YSlcblxuICAgICAgICAjIEdldCByZW1vdGUgZGF0YVxuICAgICAgICByZW1vdGVTdWNjZXNzID0gKHJlbW90ZURhdGEpID0+XG4gICAgICAgICAgIyBDYWNoZSBsb2NhbGx5XG4gICAgICAgICAgY2FjaGVTdWNjZXNzID0gKCkgPT5cbiAgICAgICAgICAgICMgR2V0IGxvY2FsIGRhdGEgYWdhaW5cbiAgICAgICAgICAgIGxvY2FsU3VjY2VzczIgPSAobG9jYWxEYXRhMikgPT5cbiAgICAgICAgICAgICAgIyBDaGVjayBpZiBkaWZmZXJlbnRcbiAgICAgICAgICAgICAgaWYgbm90IF8uaXNFcXVhbChsb2NhbERhdGEsIGxvY2FsRGF0YTIpXG4gICAgICAgICAgICAgICAgIyBTZW5kIGFnYWluXG4gICAgICAgICAgICAgICAgc3VjY2Vzcyhsb2NhbERhdGEyKVxuICAgICAgICAgICAgQGxvY2FsQ29sLmZpbmQoc2VsZWN0b3IsIG9wdGlvbnMpLmZldGNoKGxvY2FsU3VjY2VzczIpXG4gICAgICAgICAgQGxvY2FsQ29sLmNhY2hlKHJlbW90ZURhdGEsIHNlbGVjdG9yLCBvcHRpb25zLCBjYWNoZVN1Y2Nlc3MsIGVycm9yKVxuICAgICAgICBAcmVtb3RlQ29sLmZpbmQoc2VsZWN0b3IsIF8ub21pdChvcHRpb25zLCBcImZpZWxkc1wiKSkuZmV0Y2gocmVtb3RlU3VjY2VzcylcblxuICAgICAgQGxvY2FsQ29sLmZpbmQoc2VsZWN0b3IsIG9wdGlvbnMpLmZldGNoKGxvY2FsU3VjY2VzcywgZXJyb3IpXG4gICAgZWxzZSBpZiBtb2RlID09IFwibG9jYWxcIlxuICAgICAgQGxvY2FsQ29sLmZpbmQoc2VsZWN0b3IsIG9wdGlvbnMpLmZldGNoKHN1Y2Nlc3MsIGVycm9yKVxuICAgIGVsc2UgaWYgbW9kZSA9PSBcInJlbW90ZVwiXG4gICAgICAjIEdldCByZW1vdGUgcmVzdWx0c1xuICAgICAgcmVtb3RlU3VjY2VzcyA9IChyZW1vdGVEYXRhKSA9PlxuICAgICAgICAjIFJlbW92ZSBsb2NhbCByZW1vdGVzXG4gICAgICAgIGRhdGEgPSByZW1vdGVEYXRhXG5cbiAgICAgICAgQGxvY2FsQ29sLnBlbmRpbmdSZW1vdmVzIChyZW1vdmVzKSA9PlxuICAgICAgICAgIGlmIHJlbW92ZXMubGVuZ3RoID4gMFxuICAgICAgICAgICAgcmVtb3Zlc01hcCA9IF8ub2JqZWN0KF8ubWFwKHJlbW92ZXMsIChpZCkgLT4gW2lkLCBpZF0pKVxuICAgICAgICAgICAgZGF0YSA9IF8uZmlsdGVyIHJlbW90ZURhdGEsIChkb2MpIC0+XG4gICAgICAgICAgICAgIHJldHVybiBub3QgXy5oYXMocmVtb3Zlc01hcCwgZG9jLl9pZClcblxuICAgICAgICAgICMgQWRkIHVwc2VydHNcbiAgICAgICAgICBAbG9jYWxDb2wucGVuZGluZ1Vwc2VydHMgKHVwc2VydHMpID0+XG4gICAgICAgICAgICBpZiB1cHNlcnRzLmxlbmd0aCA+IDBcbiAgICAgICAgICAgICAgIyBSZW1vdmUgdXBzZXJ0cyBmcm9tIGRhdGFcbiAgICAgICAgICAgICAgdXBzZXJ0c01hcCA9IF8ub2JqZWN0KF8ucGx1Y2sodXBzZXJ0cywgJ19pZCcpLCBfLnBsdWNrKHVwc2VydHMsICdfaWQnKSlcbiAgICAgICAgICAgICAgZGF0YSA9IF8uZmlsdGVyIGRhdGEsIChkb2MpIC0+XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5vdCBfLmhhcyh1cHNlcnRzTWFwLCBkb2MuX2lkKVxuXG4gICAgICAgICAgICAgICMgQWRkIHVwc2VydHNcbiAgICAgICAgICAgICAgZGF0YSA9IGRhdGEuY29uY2F0KHVwc2VydHMpXG5cbiAgICAgICAgICAgICAgIyBSZWZpbHRlci9zb3J0L2xpbWl0XG4gICAgICAgICAgICAgIGRhdGEgPSBwcm9jZXNzRmluZChkYXRhLCBzZWxlY3Rvciwgb3B0aW9ucylcblxuICAgICAgICAgICAgc3VjY2VzcyhkYXRhKVxuXG4gICAgICByZW1vdGVFcnJvciA9ID0+XG4gICAgICAgICMgQ2FsbCBsb2NhbFxuICAgICAgICBAbG9jYWxDb2wuZmluZChzZWxlY3Rvciwgb3B0aW9ucykuZmV0Y2goc3VjY2VzcywgZXJyb3IpXG5cbiAgICAgIEByZW1vdGVDb2wuZmluZChzZWxlY3Rvciwgb3B0aW9ucykuZmV0Y2gocmVtb3RlU3VjY2VzcywgcmVtb3RlRXJyb3IpXG4gICAgZWxzZVxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5rbm93biBtb2RlXCIpXG5cbiAgdXBzZXJ0OiAoZG9jLCBzdWNjZXNzLCBlcnJvcikgLT5cbiAgICBAbG9jYWxDb2wudXBzZXJ0KGRvYywgc3VjY2VzcywgZXJyb3IpXG5cbiAgcmVtb3ZlOiAoaWQsIHN1Y2Nlc3MsIGVycm9yKSAtPlxuICAgIEBsb2NhbENvbC5yZW1vdmUoaWQsIHN1Y2Nlc3MsIGVycm9yKVxuXG4gIHVwbG9hZDogKHN1Y2Nlc3MsIGVycm9yKSAtPlxuICAgIHVwbG9hZFVwc2VydHMgPSAodXBzZXJ0cywgc3VjY2VzcywgZXJyb3IpID0+XG4gICAgICB1cHNlcnQgPSBfLmZpcnN0KHVwc2VydHMpXG4gICAgICBpZiB1cHNlcnRcbiAgICAgICAgQHJlbW90ZUNvbC51cHNlcnQodXBzZXJ0LCAoKSA9PlxuICAgICAgICAgIEBsb2NhbENvbC5yZXNvbHZlVXBzZXJ0IHVwc2VydCwgPT5cbiAgICAgICAgICAgIHVwbG9hZFVwc2VydHMoXy5yZXN0KHVwc2VydHMpLCBzdWNjZXNzLCBlcnJvcilcbiAgICAgICAgLCAoZXJyKSA9PlxuICAgICAgICAgIGVycm9yKGVycikpXG4gICAgICBlbHNlIFxuICAgICAgICBzdWNjZXNzKClcbiAgICBAbG9jYWxDb2wucGVuZGluZ1Vwc2VydHMgKHVwc2VydHMpID0+XG4gICAgICB1cGxvYWRVcHNlcnRzKHVwc2VydHMsIHN1Y2Nlc3MsIGVycm9yKVxuIiwiUGFnZSA9IHJlcXVpcmUgXCIuLi9QYWdlXCJcblxuIyBEaXNwbGF5cyBhbiBpbWFnZS4gT3B0aW9uczogdWlkOiB1aWQgb2YgaW1hZ2Vcbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgSW1hZ2VQYWdlIGV4dGVuZHMgUGFnZVxuICBjcmVhdGU6IC0+XG4gICAgQCRlbC5odG1sIHRlbXBsYXRlc1sncGFnZXMvSW1hZ2VQYWdlJ10oKVxuXG4gICAgIyBHZXQgaW1hZ2UgdXJsXG4gICAgQGltYWdlTWFuYWdlci5nZXRJbWFnZVVybChAb3B0aW9ucy5pZCwgKHVybCkgPT5cbiAgICAgIEAkKFwiI21lc3NhZ2VfYmFyXCIpLmhpZGUoKVxuICAgICAgQCQoXCIjaW1hZ2VcIikuYXR0cihcInNyY1wiLCB1cmwpLnNob3coKVxuICAgICwgQGVycm9yKVxuXG4gIGFjdGl2YXRlOiAtPlxuICAgIEBzZXRUaXRsZSBcIkltYWdlXCJcblxuICAgICMgSWYgcmVtb3ZlIGFsbG93ZWQsIHNldCBpbiBidXR0b24gYmFyXG4gICAgaWYgQG9wdGlvbnMub25SZW1vdmVcbiAgICAgIEBzZXR1cEJ1dHRvbkJhciBbXG4gICAgICAgIHsgaWNvbjogXCJkZWxldGUucG5nXCIsIGNsaWNrOiA9PiBAcmVtb3ZlUGhvdG8oKSB9XG4gICAgICBdXG4gICAgZWxzZVxuICAgICAgQHNldHVwQnV0dG9uQmFyIFtdXG5cbiAgcmVtb3ZlUGhvdG86IC0+XG4gICAgaWYgY29uZmlybShcIlJlbW92ZSBpbWFnZT9cIilcbiAgICAgIEBvcHRpb25zLm9uUmVtb3ZlKClcbiAgICAgIEBwYWdlci5jbG9zZVBhZ2UoKVxuIiwiY3JlYXRlVWlkID0gcmVxdWlyZSgnLi91dGlscycpLmNyZWF0ZVVpZFxucHJvY2Vzc0ZpbmQgPSByZXF1aXJlKCcuL3V0aWxzJykucHJvY2Vzc0ZpbmRcbmNvbXBpbGVTb3J0ID0gcmVxdWlyZSgnLi9zZWxlY3RvcicpLmNvbXBpbGVTb3J0XG5cbmNsYXNzIExvY2FsRGJcbiAgY29uc3RydWN0b3I6IChuYW1lLCBvcHRpb25zKSAtPlxuICAgIEBuYW1lID0gbmFtZVxuICAgIEBjb2xsZWN0aW9ucyA9IHt9XG5cbiAgICBpZiBvcHRpb25zIGFuZCBvcHRpb25zLm5hbWVzcGFjZSBhbmQgd2luZG93LmxvY2FsU3RvcmFnZVxuICAgICAgQG5hbWVzcGFjZSA9IG9wdGlvbnMubmFtZXNwYWNlXG5cbiAgYWRkQ29sbGVjdGlvbjogKG5hbWUpIC0+XG4gICAgIyBTZXQgbmFtZXNwYWNlIGZvciBjb2xsZWN0aW9uXG4gICAgbmFtZXNwYWNlID0gQG5hbWVzcGFjZStcIi5cIituYW1lIGlmIEBuYW1lc3BhY2VcblxuICAgIGNvbGxlY3Rpb24gPSBuZXcgQ29sbGVjdGlvbihuYW1lLCBuYW1lc3BhY2UpXG4gICAgQFtuYW1lXSA9IGNvbGxlY3Rpb25cbiAgICBAY29sbGVjdGlvbnNbbmFtZV0gPSBjb2xsZWN0aW9uXG5cbiAgcmVtb3ZlQ29sbGVjdGlvbjogKG5hbWUpIC0+XG4gICAgaWYgQG5hbWVzcGFjZSBhbmQgd2luZG93LmxvY2FsU3RvcmFnZVxuICAgICAga2V5cyA9IFtdXG4gICAgICBmb3IgaSBpbiBbMC4uLmxvY2FsU3RvcmFnZS5sZW5ndGhdXG4gICAgICAgIGtleXMucHVzaChsb2NhbFN0b3JhZ2Uua2V5KGkpKVxuXG4gICAgICBmb3Iga2V5IGluIGtleXNcbiAgICAgICAgaWYga2V5LnN1YnN0cmluZygwLCBAbmFtZXNwYWNlLmxlbmd0aCArIDEpID09IEBuYW1lc3BhY2UgKyBcIi5cIlxuICAgICAgICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKGtleSlcblxuICAgIGRlbGV0ZSBAW25hbWVdXG4gICAgZGVsZXRlIEBjb2xsZWN0aW9uc1tuYW1lXVxuXG5cbiMgU3RvcmVzIGRhdGEgaW4gbWVtb3J5LCBvcHRpb25hbGx5IGJhY2tlZCBieSBsb2NhbCBzdG9yYWdlXG5jbGFzcyBDb2xsZWN0aW9uXG4gIGNvbnN0cnVjdG9yOiAobmFtZSwgbmFtZXNwYWNlKSAtPlxuICAgIEBuYW1lID0gbmFtZVxuICAgIEBuYW1lc3BhY2UgPSBuYW1lc3BhY2VcblxuICAgIEBpdGVtcyA9IHt9XG4gICAgQHVwc2VydHMgPSB7fSAgIyBQZW5kaW5nIHVwc2VydHMgYnkgX2lkLiBTdGlsbCBpbiBpdGVtc1xuICAgIEByZW1vdmVzID0ge30gICMgUGVuZGluZyByZW1vdmVzIGJ5IF9pZC4gTm8gbG9uZ2VyIGluIGl0ZW1zXG5cbiAgICAjIFJlYWQgZnJvbSBsb2NhbCBzdG9yYWdlXG4gICAgaWYgd2luZG93LmxvY2FsU3RvcmFnZSBhbmQgbmFtZXNwYWNlP1xuICAgICAgQGxvYWRTdG9yYWdlKClcblxuICBsb2FkU3RvcmFnZTogLT5cbiAgICAjIFJlYWQgaXRlbXMgZnJvbSBsb2NhbFN0b3JhZ2VcbiAgICBAaXRlbU5hbWVzcGFjZSA9IEBuYW1lc3BhY2UgKyBcIl9cIlxuXG4gICAgZm9yIGkgaW4gWzAuLi5sb2NhbFN0b3JhZ2UubGVuZ3RoXVxuICAgICAga2V5ID0gbG9jYWxTdG9yYWdlLmtleShpKVxuICAgICAgaWYga2V5LnN1YnN0cmluZygwLCBAaXRlbU5hbWVzcGFjZS5sZW5ndGgpID09IEBpdGVtTmFtZXNwYWNlXG4gICAgICAgIGl0ZW0gPSBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZVtrZXldKVxuICAgICAgICBAaXRlbXNbaXRlbS5faWRdID0gaXRlbVxuXG4gICAgIyBSZWFkIHVwc2VydHNcbiAgICB1cHNlcnRLZXlzID0gaWYgbG9jYWxTdG9yYWdlW0BuYW1lc3BhY2UrXCJ1cHNlcnRzXCJdIHRoZW4gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2VbQG5hbWVzcGFjZStcInVwc2VydHNcIl0pIGVsc2UgW11cbiAgICBmb3Iga2V5IGluIHVwc2VydEtleXNcbiAgICAgIEB1cHNlcnRzW2tleV0gPSBAaXRlbXNba2V5XVxuXG4gICAgIyBSZWFkIHJlbW92ZXNcbiAgICByZW1vdmVJdGVtcyA9IGlmIGxvY2FsU3RvcmFnZVtAbmFtZXNwYWNlK1wicmVtb3Zlc1wiXSB0aGVuIEpTT04ucGFyc2UobG9jYWxTdG9yYWdlW0BuYW1lc3BhY2UrXCJyZW1vdmVzXCJdKSBlbHNlIFtdXG4gICAgQHJlbW92ZXMgPSBfLm9iamVjdChfLnBsdWNrKHJlbW92ZUl0ZW1zLCBcIl9pZFwiKSwgcmVtb3ZlSXRlbXMpXG5cbiAgZmluZDogKHNlbGVjdG9yLCBvcHRpb25zKSAtPlxuICAgIHJldHVybiBmZXRjaDogKHN1Y2Nlc3MsIGVycm9yKSA9PlxuICAgICAgQF9maW5kRmV0Y2goc2VsZWN0b3IsIG9wdGlvbnMsIHN1Y2Nlc3MsIGVycm9yKVxuXG4gIGZpbmRPbmU6IChzZWxlY3Rvciwgb3B0aW9ucywgc3VjY2VzcywgZXJyb3IpIC0+XG4gICAgaWYgXy5pc0Z1bmN0aW9uKG9wdGlvbnMpIFxuICAgICAgW29wdGlvbnMsIHN1Y2Nlc3MsIGVycm9yXSA9IFt7fSwgb3B0aW9ucywgc3VjY2Vzc11cblxuICAgIEBmaW5kKHNlbGVjdG9yLCBvcHRpb25zKS5mZXRjaCAocmVzdWx0cykgLT5cbiAgICAgIGlmIHN1Y2Nlc3M/IHRoZW4gc3VjY2VzcyhpZiByZXN1bHRzLmxlbmd0aD4wIHRoZW4gcmVzdWx0c1swXSBlbHNlIG51bGwpXG4gICAgLCBlcnJvclxuXG4gIF9maW5kRmV0Y2g6IChzZWxlY3Rvciwgb3B0aW9ucywgc3VjY2VzcywgZXJyb3IpIC0+XG4gICAgaWYgc3VjY2Vzcz8gdGhlbiBzdWNjZXNzKHByb2Nlc3NGaW5kKEBpdGVtcywgc2VsZWN0b3IsIG9wdGlvbnMpKVxuXG4gIHVwc2VydDogKGRvYywgc3VjY2VzcywgZXJyb3IpIC0+XG4gICAgaWYgbm90IGRvYy5faWRcbiAgICAgIGRvYy5faWQgPSBjcmVhdGVVaWQoKVxuXG4gICAgIyBSZXBsYWNlL2FkZCBcbiAgICBAX3B1dEl0ZW0oZG9jKVxuICAgIEBfcHV0VXBzZXJ0KGRvYylcblxuICAgIGlmIHN1Y2Nlc3M/IHRoZW4gc3VjY2Vzcyhkb2MpXG5cbiAgcmVtb3ZlOiAoaWQsIHN1Y2Nlc3MsIGVycm9yKSAtPlxuICAgIGlmIF8uaGFzKEBpdGVtcywgaWQpXG4gICAgICBAX3B1dFJlbW92ZShAaXRlbXNbaWRdKVxuICAgICAgQF9kZWxldGVJdGVtKGlkKVxuICAgICAgQF9kZWxldGVVcHNlcnQoaWQpXG5cbiAgICBpZiBzdWNjZXNzPyB0aGVuIHN1Y2Nlc3MoKVxuXG4gIF9wdXRJdGVtOiAoZG9jKSAtPlxuICAgIEBpdGVtc1tkb2MuX2lkXSA9IGRvY1xuICAgIGlmIEBuYW1lc3BhY2VcbiAgICAgIGxvY2FsU3RvcmFnZVtAaXRlbU5hbWVzcGFjZSArIGRvYy5faWRdID0gSlNPTi5zdHJpbmdpZnkoZG9jKVxuXG4gIF9kZWxldGVJdGVtOiAoaWQpIC0+XG4gICAgZGVsZXRlIEBpdGVtc1tpZF1cbiAgICBpZiBAbmFtZXNwYWNlXG4gICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbShAaXRlbU5hbWVzcGFjZSArIGlkKVxuXG4gIF9wdXRVcHNlcnQ6IChkb2MpIC0+XG4gICAgQHVwc2VydHNbZG9jLl9pZF0gPSBkb2NcbiAgICBpZiBAbmFtZXNwYWNlXG4gICAgICBsb2NhbFN0b3JhZ2VbQG5hbWVzcGFjZStcInVwc2VydHNcIl0gPSBKU09OLnN0cmluZ2lmeShfLmtleXMoQHVwc2VydHMpKVxuXG4gIF9kZWxldGVVcHNlcnQ6IChpZCkgLT5cbiAgICBkZWxldGUgQHVwc2VydHNbaWRdXG4gICAgaWYgQG5hbWVzcGFjZVxuICAgICAgbG9jYWxTdG9yYWdlW0BuYW1lc3BhY2UrXCJ1cHNlcnRzXCJdID0gSlNPTi5zdHJpbmdpZnkoXy5rZXlzKEB1cHNlcnRzKSlcblxuICBfcHV0UmVtb3ZlOiAoZG9jKSAtPlxuICAgIEByZW1vdmVzW2RvYy5faWRdID0gZG9jXG4gICAgaWYgQG5hbWVzcGFjZVxuICAgICAgbG9jYWxTdG9yYWdlW0BuYW1lc3BhY2UrXCJyZW1vdmVzXCJdID0gSlNPTi5zdHJpbmdpZnkoXy52YWx1ZXMoQHJlbW92ZXMpKVxuXG4gIF9kZWxldGVSZW1vdmU6IChpZCkgLT5cbiAgICBkZWxldGUgQHJlbW92ZXNbaWRdXG4gICAgaWYgQG5hbWVzcGFjZVxuICAgICAgbG9jYWxTdG9yYWdlW0BuYW1lc3BhY2UrXCJyZW1vdmVzXCJdID0gSlNPTi5zdHJpbmdpZnkoXy52YWx1ZXMoQHJlbW92ZXMpKVxuXG4gIGNhY2hlOiAoZG9jcywgc2VsZWN0b3IsIG9wdGlvbnMsIHN1Y2Nlc3MsIGVycm9yKSAtPlxuICAgICMgQWRkIGFsbCBub24tbG9jYWwgdGhhdCBhcmUgbm90IHVwc2VydGVkIG9yIHJlbW92ZWRcbiAgICBmb3IgZG9jIGluIGRvY3NcbiAgICAgIGlmIG5vdCBfLmhhcyhAdXBzZXJ0cywgZG9jLl9pZCkgYW5kIG5vdCBfLmhhcyhAcmVtb3ZlcywgZG9jLl9pZClcbiAgICAgICAgQF9wdXRJdGVtKGRvYylcblxuICAgIGRvY3NNYXAgPSBfLm9iamVjdChfLnBsdWNrKGRvY3MsIFwiX2lkXCIpLCBkb2NzKVxuXG4gICAgaWYgb3B0aW9ucy5zb3J0XG4gICAgICBzb3J0ID0gY29tcGlsZVNvcnQob3B0aW9ucy5zb3J0KVxuXG4gICAgIyBQZXJmb3JtIHF1ZXJ5LCByZW1vdmluZyByb3dzIG1pc3NpbmcgaW4gZG9jcyBmcm9tIGxvY2FsIGRiIFxuICAgIEBmaW5kKHNlbGVjdG9yLCBvcHRpb25zKS5mZXRjaCAocmVzdWx0cykgPT5cbiAgICAgIGZvciByZXN1bHQgaW4gcmVzdWx0c1xuICAgICAgICBpZiBub3QgZG9jc01hcFtyZXN1bHQuX2lkXSBhbmQgbm90IF8uaGFzKEB1cHNlcnRzLCByZXN1bHQuX2lkKVxuICAgICAgICAgICMgSWYgcGFzdCBlbmQgb24gc29ydGVkIGxpbWl0ZWQsIGlnbm9yZVxuICAgICAgICAgIGlmIG9wdGlvbnMuc29ydCBhbmQgb3B0aW9ucy5saW1pdCBhbmQgZG9jcy5sZW5ndGggPT0gb3B0aW9ucy5saW1pdFxuICAgICAgICAgICAgaWYgc29ydChyZXN1bHQsIF8ubGFzdChkb2NzKSkgPj0gMFxuICAgICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgIEBfZGVsZXRlSXRlbShyZXN1bHQuX2lkKVxuXG4gICAgICBpZiBzdWNjZXNzPyB0aGVuIHN1Y2Nlc3MoKSAgXG4gICAgLCBlcnJvclxuICAgIFxuICBwZW5kaW5nVXBzZXJ0czogKHN1Y2Nlc3MpIC0+XG4gICAgc3VjY2VzcyBfLnZhbHVlcyhAdXBzZXJ0cylcblxuICBwZW5kaW5nUmVtb3ZlczogKHN1Y2Nlc3MpIC0+XG4gICAgc3VjY2VzcyBfLnBsdWNrKEByZW1vdmVzLCBcIl9pZFwiKVxuXG4gIHJlc29sdmVVcHNlcnQ6IChkb2MsIHN1Y2Nlc3MpIC0+XG4gICAgaWYgQHVwc2VydHNbZG9jLl9pZF0gYW5kIF8uaXNFcXVhbChkb2MsIEB1cHNlcnRzW2RvYy5faWRdKVxuICAgICAgQF9kZWxldGVVcHNlcnQoZG9jLl9pZClcbiAgICBpZiBzdWNjZXNzPyB0aGVuIHN1Y2Nlc3MoKVxuXG4gIHJlc29sdmVSZW1vdmU6IChpZCwgc3VjY2VzcykgLT5cbiAgICBAX2RlbGV0ZVJlbW92ZShpZClcbiAgICBpZiBzdWNjZXNzPyB0aGVuIHN1Y2Nlc3MoKVxuXG4gICMgQWRkIGJ1dCBkbyBub3Qgb3ZlcndyaXRlIG9yIHJlY29yZCBhcyB1cHNlcnRcbiAgc2VlZDogKGRvYywgc3VjY2VzcykgLT5cbiAgICBpZiBub3QgXy5oYXMoQGl0ZW1zLCBkb2MuX2lkKSBhbmQgbm90IF8uaGFzKEByZW1vdmVzLCBkb2MuX2lkKVxuICAgICAgQF9wdXRJdGVtKGRvYylcbiAgICBpZiBzdWNjZXNzPyB0aGVuIHN1Y2Nlc3MoKVxuXG5tb2R1bGUuZXhwb3J0cyA9IExvY2FsRGJcbiIsImV4cG9ydHMuU2VjdGlvbnMgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCh7XG4gICAgY2xhc3NOYW1lIDogXCJzdXJ2ZXlcIixcblxuICAgIGluaXRpYWxpemUgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy50aXRsZSA9IHRoaXMub3B0aW9ucy50aXRsZTtcbiAgICAgICAgdGhpcy5zZWN0aW9ucyA9IHRoaXMub3B0aW9ucy5zZWN0aW9ucztcbiAgICAgICAgdGhpcy5yZW5kZXIoKTtcblxuICAgICAgICAvLyBBZGp1c3QgbmV4dC9wcmV2IGJhc2VkIG9uIG1vZGVsXG4gICAgICAgIHRoaXMubW9kZWwub24oXCJjaGFuZ2VcIiwgdGhpcy5yZW5kZXJOZXh0UHJldiwgdGhpcyk7XG5cbiAgICAgICAgLy8gR28gdG8gYXBwcm9wcmlhdGUgc2VjdGlvbiBUT0RPXG4gICAgICAgIHRoaXMuc2hvd1NlY3Rpb24oMCk7XG4gICAgfSxcblxuICAgIGV2ZW50cyA6IHtcbiAgICAgICAgXCJjbGljayAjY2xvc2VcIiA6IFwiY2xvc2VcIixcbiAgICAgICAgXCJjbGljayAubmV4dFwiIDogXCJuZXh0U2VjdGlvblwiLFxuICAgICAgICBcImNsaWNrIC5wcmV2XCIgOiBcInByZXZTZWN0aW9uXCIsXG4gICAgICAgIFwiY2xpY2sgLmZpbmlzaFwiIDogXCJmaW5pc2hcIixcbiAgICAgICAgXCJjbGljayBhLnNlY3Rpb24tY3J1bWJcIiA6IFwiY3J1bWJTZWN0aW9uXCJcbiAgICB9LFxuXG4gICAgZmluaXNoIDogZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIFZhbGlkYXRlIGN1cnJlbnQgc2VjdGlvblxuICAgICAgICB2YXIgc2VjdGlvbiA9IHRoaXMuc2VjdGlvbnNbdGhpcy5zZWN0aW9uXTtcbiAgICAgICAgaWYgKHNlY3Rpb24udmFsaWRhdGUoKSkge1xuICAgICAgICAgICAgdGhpcy50cmlnZ2VyKCdjb21wbGV0ZScpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGNsb3NlIDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMudHJpZ2dlcignY2xvc2UnKTtcbiAgICB9LFxuXG4gICAgY3J1bWJTZWN0aW9uIDogZnVuY3Rpb24oZSkge1xuICAgICAgICAvLyBHbyB0byBzZWN0aW9uXG4gICAgICAgIHZhciBpbmRleCA9IHBhcnNlSW50KGUudGFyZ2V0LmdldEF0dHJpYnV0ZShcImRhdGEtdmFsdWVcIikpO1xuICAgICAgICB0aGlzLnNob3dTZWN0aW9uKGluZGV4KTtcbiAgICB9LFxuXG4gICAgZ2V0TmV4dFNlY3Rpb25JbmRleCA6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgaSA9IHRoaXMuc2VjdGlvbiArIDE7XG4gICAgICAgIHdoaWxlIChpIDwgdGhpcy5zZWN0aW9ucy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnNlY3Rpb25zW2ldLnNob3VsZEJlVmlzaWJsZSgpKVxuICAgICAgICAgICAgICAgIHJldHVybiBpO1xuICAgICAgICAgICAgaSsrO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGdldFByZXZTZWN0aW9uSW5kZXggOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGkgPSB0aGlzLnNlY3Rpb24gLSAxO1xuICAgICAgICB3aGlsZSAoaSA+PSAwKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5zZWN0aW9uc1tpXS5zaG91bGRCZVZpc2libGUoKSlcbiAgICAgICAgICAgICAgICByZXR1cm4gaTtcbiAgICAgICAgICAgIGktLTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBuZXh0U2VjdGlvbiA6IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBWYWxpZGF0ZSBjdXJyZW50IHNlY3Rpb25cbiAgICAgICAgdmFyIHNlY3Rpb24gPSB0aGlzLnNlY3Rpb25zW3RoaXMuc2VjdGlvbl07XG4gICAgICAgIGlmIChzZWN0aW9uLnZhbGlkYXRlKCkpIHtcbiAgICAgICAgICAgIHRoaXMuc2hvd1NlY3Rpb24odGhpcy5nZXROZXh0U2VjdGlvbkluZGV4KCkpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIHByZXZTZWN0aW9uIDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuc2hvd1NlY3Rpb24odGhpcy5nZXRQcmV2U2VjdGlvbkluZGV4KCkpO1xuICAgIH0sXG5cbiAgICBzaG93U2VjdGlvbiA6IGZ1bmN0aW9uKGluZGV4KSB7XG4gICAgICAgIHRoaXMuc2VjdGlvbiA9IGluZGV4O1xuXG4gICAgICAgIF8uZWFjaCh0aGlzLnNlY3Rpb25zLCBmdW5jdGlvbihzKSB7XG4gICAgICAgICAgICBzLiRlbC5oaWRlKCk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLnNlY3Rpb25zW2luZGV4XS4kZWwuc2hvdygpO1xuXG4gICAgICAgIC8vIFNldHVwIGJyZWFkY3J1bWJzXG4gICAgICAgIHZhciB2aXNpYmxlU2VjdGlvbnMgPSBfLmZpbHRlcihfLmZpcnN0KHRoaXMuc2VjdGlvbnMsIGluZGV4ICsgMSksIGZ1bmN0aW9uKHMpIHtcbiAgICAgICAgICAgIHJldHVybiBzLnNob3VsZEJlVmlzaWJsZSgpXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLiQoXCIuYnJlYWRjcnVtYlwiKS5odG1sKHRlbXBsYXRlc1snZm9ybXMvU2VjdGlvbnNfYnJlYWRjcnVtYnMnXSh7XG4gICAgICAgICAgICBzZWN0aW9ucyA6IF8uaW5pdGlhbCh2aXNpYmxlU2VjdGlvbnMpLFxuICAgICAgICAgICAgbGFzdFNlY3Rpb246IF8ubGFzdCh2aXNpYmxlU2VjdGlvbnMpXG4gICAgICAgIH0pKTtcbiAgICAgICAgXG4gICAgICAgIHRoaXMucmVuZGVyTmV4dFByZXYoKTtcblxuICAgICAgICAvLyBTY3JvbGwgaW50byB2aWV3XG4gICAgICAgIHRoaXMuJGVsLnNjcm9sbGludG92aWV3KCk7XG4gICAgfSxcbiAgICBcbiAgICByZW5kZXJOZXh0UHJldiA6IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBTZXR1cCBuZXh0L3ByZXYgYnV0dG9uc1xuICAgICAgICB0aGlzLiQoXCIucHJldlwiKS50b2dnbGUodGhpcy5nZXRQcmV2U2VjdGlvbkluZGV4KCkgIT09IHVuZGVmaW5lZCk7XG4gICAgICAgIHRoaXMuJChcIi5uZXh0XCIpLnRvZ2dsZSh0aGlzLmdldE5leHRTZWN0aW9uSW5kZXgoKSAhPT0gdW5kZWZpbmVkKTtcbiAgICAgICAgdGhpcy4kKFwiLmZpbmlzaFwiKS50b2dnbGUodGhpcy5nZXROZXh0U2VjdGlvbkluZGV4KCkgPT09IHVuZGVmaW5lZCk7XG4gICAgfSxcblxuICAgIHJlbmRlciA6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLiRlbC5odG1sKHRlbXBsYXRlc1snZm9ybXMvU2VjdGlvbnMnXSgpKTtcblxuICAgICAgICAvLyBBZGQgc2VjdGlvbnNcbiAgICAgICAgdmFyIHNlY3Rpb25zRWwgPSB0aGlzLiQoXCIuc2VjdGlvbnNcIik7XG4gICAgICAgIF8uZWFjaCh0aGlzLnNlY3Rpb25zLCBmdW5jdGlvbihzKSB7XG4gICAgICAgICAgICBzZWN0aW9uc0VsLmFwcGVuZChzLiRlbCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxufSk7XG5cbmV4cG9ydHMuU2VjdGlvbiA9IEJhY2tib25lLlZpZXcuZXh0ZW5kKHtcbiAgICBjbGFzc05hbWUgOiBcInNlY3Rpb25cIixcbiAgICB0ZW1wbGF0ZSA6IF8udGVtcGxhdGUoJzxkaXYgY2xhc3M9XCJjb250ZW50c1wiPjwvZGl2PicpLFxuXG4gICAgaW5pdGlhbGl6ZSA6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnRpdGxlID0gdGhpcy5vcHRpb25zLnRpdGxlO1xuICAgICAgICB0aGlzLmNvbnRlbnRzID0gdGhpcy5vcHRpb25zLmNvbnRlbnRzO1xuXG4gICAgICAgIC8vIEFsd2F5cyBpbnZpc2libGUgaW5pdGlhbGx5XG4gICAgICAgIHRoaXMuJGVsLmhpZGUoKTtcbiAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICB9LFxuXG4gICAgc2hvdWxkQmVWaXNpYmxlIDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICghdGhpcy5vcHRpb25zLmNvbmRpdGlvbmFsKVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIHJldHVybiB0aGlzLm9wdGlvbnMuY29uZGl0aW9uYWwodGhpcy5tb2RlbCk7XG4gICAgfSxcblxuICAgIHZhbGlkYXRlIDogZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIEdldCBhbGwgdmlzaWJsZSBpdGVtc1xuICAgICAgICB2YXIgaXRlbXMgPSBfLmZpbHRlcih0aGlzLmNvbnRlbnRzLCBmdW5jdGlvbihjKSB7XG4gICAgICAgICAgICByZXR1cm4gYy52aXNpYmxlICYmIGMudmFsaWRhdGU7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gIV8uYW55KF8ubWFwKGl0ZW1zLCBmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgICAgICByZXR1cm4gaXRlbS52YWxpZGF0ZSgpO1xuICAgICAgICB9KSk7XG4gICAgfSxcblxuICAgIHJlbmRlciA6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLiRlbC5odG1sKHRoaXMudGVtcGxhdGUodGhpcykpO1xuXG4gICAgICAgIC8vIEFkZCBjb250ZW50cyAocXVlc3Rpb25zLCBtb3N0bHkpXG4gICAgICAgIHZhciBjb250ZW50c0VsID0gdGhpcy4kKFwiLmNvbnRlbnRzXCIpO1xuICAgICAgICBfLmVhY2godGhpcy5jb250ZW50cywgZnVuY3Rpb24oYykge1xuICAgICAgICAgICAgY29udGVudHNFbC5hcHBlbmQoYy4kZWwpO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbn0pO1xuXG5leHBvcnRzLlF1ZXN0aW9uID0gQmFja2JvbmUuVmlldy5leHRlbmQoe1xuICAgIGNsYXNzTmFtZSA6IFwicXVlc3Rpb25cIixcblxuICAgIHRlbXBsYXRlIDogXy50ZW1wbGF0ZSgnPCUgaWYgKG9wdGlvbnMucHJvbXB0KSB7ICU+PGRpdiBjbGFzcz1cInByb21wdFwiPjwlPW9wdGlvbnMucHJvbXB0JT48JT1yZW5kZXJSZXF1aXJlZCgpJT48L2Rpdj48JSB9ICU+PGRpdiBjbGFzcz1cImFuc3dlclwiPjwvZGl2PjwlPXJlbmRlckhpbnQoKSU+JyksXG5cbiAgICByZW5kZXJSZXF1aXJlZCA6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5yZXF1aXJlZClcbiAgICAgICAgICAgIHJldHVybiAnJm5ic3A7PHNwYW4gY2xhc3M9XCJyZXF1aXJlZFwiPio8L3NwYW4+JztcbiAgICAgICAgcmV0dXJuICcnO1xuICAgIH0sXG5cbiAgICByZW5kZXJIaW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5oaW50KVxuICAgICAgICAgICAgcmV0dXJuIF8udGVtcGxhdGUoJzxkaXYgY2xhc3M9XCJtdXRlZFwiPjwlPWhpbnQlPjwvZGl2PicpKHtoaW50OiB0aGlzLm9wdGlvbnMuaGludH0pO1xuICAgIH0sXG5cbiAgICB2YWxpZGF0ZSA6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgdmFsO1xuXG4gICAgICAgIC8vIENoZWNrIHJlcXVpcmVkXG4gICAgICAgIGlmICh0aGlzLnJlcXVpcmVkKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5tb2RlbC5nZXQodGhpcy5pZCkgPT09IHVuZGVmaW5lZCB8fCB0aGlzLm1vZGVsLmdldCh0aGlzLmlkKSA9PT0gbnVsbCB8fCB0aGlzLm1vZGVsLmdldCh0aGlzLmlkKSA9PT0gXCJcIilcbiAgICAgICAgICAgICAgICB2YWwgPSBcIlJlcXVpcmVkXCI7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDaGVjayBpbnRlcm5hbCB2YWxpZGF0aW9uXG4gICAgICAgIGlmICghdmFsICYmIHRoaXMudmFsaWRhdGVJbnRlcm5hbCkge1xuICAgICAgICAgICAgdmFsID0gdGhpcy52YWxpZGF0ZUludGVybmFsKCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDaGVjayBjdXN0b20gdmFsaWRhdGlvblxuICAgICAgICBpZiAoIXZhbCAmJiB0aGlzLm9wdGlvbnMudmFsaWRhdGUpIHtcbiAgICAgICAgICAgIHZhbCA9IHRoaXMub3B0aW9ucy52YWxpZGF0ZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gU2hvdyB2YWxpZGF0aW9uIHJlc3VsdHMgVE9ET1xuICAgICAgICBpZiAodmFsKSB7XG4gICAgICAgICAgICB0aGlzLiRlbC5hZGRDbGFzcyhcImludmFsaWRcIik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLiRlbC5yZW1vdmVDbGFzcyhcImludmFsaWRcIik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdmFsO1xuICAgIH0sXG5cbiAgICB1cGRhdGVWaXNpYmlsaXR5IDogZnVuY3Rpb24oZSkge1xuICAgICAgICAvLyBzbGlkZVVwL3NsaWRlRG93blxuICAgICAgICBpZiAodGhpcy5zaG91bGRCZVZpc2libGUoKSAmJiAhdGhpcy52aXNpYmxlKVxuICAgICAgICAgICAgdGhpcy4kZWwuc2xpZGVEb3duKCk7XG4gICAgICAgIGlmICghdGhpcy5zaG91bGRCZVZpc2libGUoKSAmJiB0aGlzLnZpc2libGUpXG4gICAgICAgICAgICB0aGlzLiRlbC5zbGlkZVVwKCk7XG4gICAgICAgIHRoaXMudmlzaWJsZSA9IHRoaXMuc2hvdWxkQmVWaXNpYmxlKCk7XG4gICAgfSxcblxuICAgIHNob3VsZEJlVmlzaWJsZSA6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoIXRoaXMub3B0aW9ucy5jb25kaXRpb25hbClcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25zLmNvbmRpdGlvbmFsKHRoaXMubW9kZWwpO1xuICAgIH0sXG5cbiAgICBpbml0aWFsaXplIDogZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIEFkanVzdCB2aXNpYmlsaXR5IGJhc2VkIG9uIG1vZGVsXG4gICAgICAgIHRoaXMubW9kZWwub24oXCJjaGFuZ2VcIiwgdGhpcy51cGRhdGVWaXNpYmlsaXR5LCB0aGlzKTtcblxuICAgICAgICAvLyBSZS1yZW5kZXIgYmFzZWQgb24gbW9kZWwgY2hhbmdlc1xuICAgICAgICB0aGlzLm1vZGVsLm9uKFwiY2hhbmdlOlwiICsgdGhpcy5pZCwgdGhpcy5yZW5kZXIsIHRoaXMpO1xuXG4gICAgICAgIHRoaXMucmVxdWlyZWQgPSB0aGlzLm9wdGlvbnMucmVxdWlyZWQ7XG5cbiAgICAgICAgLy8gU2F2ZSBjb250ZXh0XG4gICAgICAgIHRoaXMuY3R4ID0gdGhpcy5vcHRpb25zLmN0eCB8fCB7fTtcblxuICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgIH0sXG5cbiAgICByZW5kZXIgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy4kZWwuaHRtbCh0aGlzLnRlbXBsYXRlKHRoaXMpKTtcblxuICAgICAgICAvLyBSZW5kZXIgYW5zd2VyXG4gICAgICAgIHRoaXMucmVuZGVyQW5zd2VyKHRoaXMuJChcIi5hbnN3ZXJcIikpO1xuXG4gICAgICAgIHRoaXMuJGVsLnRvZ2dsZSh0aGlzLnNob3VsZEJlVmlzaWJsZSgpKTtcbiAgICAgICAgdGhpcy52aXNpYmxlID0gdGhpcy5zaG91bGRCZVZpc2libGUoKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG59KTtcblxuZXhwb3J0cy5SYWRpb1F1ZXN0aW9uID0gZXhwb3J0cy5RdWVzdGlvbi5leHRlbmQoe1xuICAgIGV2ZW50cyA6IHtcbiAgICAgICAgXCJjaGVja2VkXCIgOiBcImNoZWNrZWRcIixcbiAgICB9LFxuXG4gICAgY2hlY2tlZCA6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgdmFyIGluZGV4ID0gcGFyc2VJbnQoZS50YXJnZXQuZ2V0QXR0cmlidXRlKFwiZGF0YS12YWx1ZVwiKSk7XG4gICAgICAgIHZhciB2YWx1ZSA9IHRoaXMub3B0aW9ucy5vcHRpb25zW2luZGV4XVswXTtcbiAgICAgICAgdGhpcy5tb2RlbC5zZXQodGhpcy5pZCwgdmFsdWUpO1xuICAgIH0sXG5cbiAgICByZW5kZXJBbnN3ZXIgOiBmdW5jdGlvbihhbnN3ZXJFbCkge1xuICAgICAgICBhbnN3ZXJFbC5odG1sKF8udGVtcGxhdGUoJzxkaXYgY2xhc3M9XCJyYWRpby1ncm91cFwiPjwlPXJlbmRlclJhZGlvT3B0aW9ucygpJT48L2Rpdj4nLCB0aGlzKSk7XG4gICAgfSxcblxuICAgIHJlbmRlclJhZGlvT3B0aW9ucyA6IGZ1bmN0aW9uKCkge1xuICAgICAgICBodG1sID0gXCJcIjtcbiAgICAgICAgdmFyIGk7XG4gICAgICAgIGZvciAoIGkgPSAwOyBpIDwgdGhpcy5vcHRpb25zLm9wdGlvbnMubGVuZ3RoOyBpKyspXG4gICAgICAgICAgICBodG1sICs9IF8udGVtcGxhdGUoJzxkaXYgY2xhc3M9XCJyYWRpby1idXR0b24gPCU9Y2hlY2tlZCU+XCIgZGF0YS12YWx1ZT1cIjwlPXBvc2l0aW9uJT5cIj48JT10ZXh0JT48L2Rpdj4nLCB7XG4gICAgICAgICAgICAgICAgcG9zaXRpb24gOiBpLFxuICAgICAgICAgICAgICAgIHRleHQgOiB0aGlzLm9wdGlvbnMub3B0aW9uc1tpXVsxXSxcbiAgICAgICAgICAgICAgICBjaGVja2VkIDogdGhpcy5tb2RlbC5nZXQodGhpcy5pZCkgPT09IHRoaXMub3B0aW9ucy5vcHRpb25zW2ldWzBdID8gXCJjaGVja2VkXCIgOiBcIlwiXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gaHRtbDtcbiAgICB9XG5cbn0pO1xuXG5leHBvcnRzLkNoZWNrUXVlc3Rpb24gPSBleHBvcnRzLlF1ZXN0aW9uLmV4dGVuZCh7XG4gICAgZXZlbnRzIDoge1xuICAgICAgICBcImNoZWNrZWRcIiA6IFwiY2hlY2tlZFwiLFxuICAgIH0sXG5cbiAgICBjaGVja2VkIDogZnVuY3Rpb24oZSkge1xuICAgICAgICAvLyBHZXQgY2hlY2tlZFxuICAgICAgICB0aGlzLm1vZGVsLnNldCh0aGlzLmlkLCB0aGlzLiQoXCIuY2hlY2tib3hcIikuaGFzQ2xhc3MoXCJjaGVja2VkXCIpKTtcbiAgICB9LFxuXG4gICAgcmVuZGVyQW5zd2VyIDogZnVuY3Rpb24oYW5zd2VyRWwpIHtcbiAgICAgICAgdmFyIGk7XG4gICAgICAgIGFuc3dlckVsLmFwcGVuZCgkKF8udGVtcGxhdGUoJzxkaXYgY2xhc3M9XCJjaGVja2JveCA8JT1jaGVja2VkJT5cIj48JT10ZXh0JT48L2Rpdj4nLCB7XG4gICAgICAgICAgICB0ZXh0IDogdGhpcy5vcHRpb25zLnRleHQsXG4gICAgICAgICAgICBjaGVja2VkIDogKHRoaXMubW9kZWwuZ2V0KHRoaXMuaWQpKSA/IFwiY2hlY2tlZFwiIDogXCJcIlxuICAgICAgICB9KSkpO1xuICAgIH1cblxufSk7XG5cblxuZXhwb3J0cy5NdWx0aWNoZWNrUXVlc3Rpb24gPSBleHBvcnRzLlF1ZXN0aW9uLmV4dGVuZCh7XG4gICAgZXZlbnRzIDoge1xuICAgICAgICBcImNoZWNrZWRcIiA6IFwiY2hlY2tlZFwiLFxuICAgIH0sXG5cbiAgICBjaGVja2VkIDogZnVuY3Rpb24oZSkge1xuICAgICAgICAvLyBHZXQgYWxsIGNoZWNrZWRcbiAgICAgICAgdmFyIHZhbHVlID0gW107XG4gICAgICAgIHZhciBvcHRzID0gdGhpcy5vcHRpb25zLm9wdGlvbnM7XG4gICAgICAgIHRoaXMuJChcIi5jaGVja2JveFwiKS5lYWNoKGZ1bmN0aW9uKGluZGV4KSB7XG4gICAgICAgICAgICBpZiAoJCh0aGlzKS5oYXNDbGFzcyhcImNoZWNrZWRcIikpXG4gICAgICAgICAgICAgICAgdmFsdWUucHVzaChvcHRzW2luZGV4XVswXSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLm1vZGVsLnNldCh0aGlzLmlkLCB2YWx1ZSk7XG4gICAgfSxcblxuICAgIHJlbmRlckFuc3dlciA6IGZ1bmN0aW9uKGFuc3dlckVsKSB7XG4gICAgICAgIHZhciBpO1xuICAgICAgICBmb3IgKCBpID0gMDsgaSA8IHRoaXMub3B0aW9ucy5vcHRpb25zLmxlbmd0aDsgaSsrKVxuICAgICAgICAgICAgYW5zd2VyRWwuYXBwZW5kKCQoXy50ZW1wbGF0ZSgnPGRpdiBjbGFzcz1cImNoZWNrYm94IDwlPWNoZWNrZWQlPlwiIGRhdGEtdmFsdWU9XCI8JT1wb3NpdGlvbiU+XCI+PCU9dGV4dCU+PC9kaXY+Jywge1xuICAgICAgICAgICAgICAgIHBvc2l0aW9uIDogaSxcbiAgICAgICAgICAgICAgICB0ZXh0IDogdGhpcy5vcHRpb25zLm9wdGlvbnNbaV1bMV0sXG4gICAgICAgICAgICAgICAgY2hlY2tlZCA6ICh0aGlzLm1vZGVsLmdldCh0aGlzLmlkKSAmJiBfLmNvbnRhaW5zKHRoaXMubW9kZWwuZ2V0KHRoaXMuaWQpLCB0aGlzLm9wdGlvbnMub3B0aW9uc1tpXVswXSkpID8gXCJjaGVja2VkXCIgOiBcIlwiXG4gICAgICAgICAgICB9KSkpO1xuICAgIH1cblxufSk7XG5cbmV4cG9ydHMuVGV4dFF1ZXN0aW9uID0gZXhwb3J0cy5RdWVzdGlvbi5leHRlbmQoe1xuICAgIHJlbmRlckFuc3dlciA6IGZ1bmN0aW9uKGFuc3dlckVsKSB7XG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMubXVsdGlsaW5lKSB7XG4gICAgICAgICAgICBhbnN3ZXJFbC5odG1sKF8udGVtcGxhdGUoJzx0ZXh0YXJlYSBzdHlsZT1cIndpZHRoOjkwJVwiLz4nLCB0aGlzKSk7IC8vIFRPRE8gbWFrZSB3aWR0aCBwcm9wZXJseVxuICAgICAgICAgICAgYW5zd2VyRWwuZmluZChcInRleHRhcmVhXCIpLnZhbCh0aGlzLm1vZGVsLmdldCh0aGlzLmlkKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhbnN3ZXJFbC5odG1sKF8udGVtcGxhdGUoJzxpbnB1dCB0eXBlPVwidGV4dFwiLz4nLCB0aGlzKSk7XG4gICAgICAgICAgICBhbnN3ZXJFbC5maW5kKFwiaW5wdXRcIikudmFsKHRoaXMubW9kZWwuZ2V0KHRoaXMuaWQpKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBldmVudHMgOiB7XG4gICAgICAgIFwiY2hhbmdlXCIgOiBcImNoYW5nZWRcIlxuICAgIH0sXG4gICAgY2hhbmdlZCA6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLm1vZGVsLnNldCh0aGlzLmlkLCB0aGlzLiQodGhpcy5vcHRpb25zLm11bHRpbGluZSA/IFwidGV4dGFyZWFcIiA6IFwiaW5wdXRcIikudmFsKCkpO1xuICAgIH1cblxufSk7XG4iLCIjIEdyb3VwIG9mIHF1ZXN0aW9ucyB3aGljaCB2YWxpZGF0ZSBhcyBhIHVuaXRcblxubW9kdWxlLmV4cG9ydHMgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZFxuICBpbml0aWFsaXplOiAtPlxuICAgIEBjb250ZW50cyA9IEBvcHRpb25zLmNvbnRlbnRzXG4gICAgQHJlbmRlcigpXG5cbiAgdmFsaWRhdGU6IC0+XG4gICAgIyBHZXQgYWxsIHZpc2libGUgaXRlbXNcbiAgICBpdGVtcyA9IF8uZmlsdGVyKEBjb250ZW50cywgKGMpIC0+XG4gICAgICBjLnZpc2libGUgYW5kIGMudmFsaWRhdGVcbiAgICApXG4gICAgcmV0dXJuIG5vdCBfLmFueShfLm1hcChpdGVtcywgKGl0ZW0pIC0+XG4gICAgICBpdGVtLnZhbGlkYXRlKClcbiAgICApKVxuXG4gIHJlbmRlcjogLT5cbiAgICBAJGVsLmh0bWwgXCJcIlxuICAgIFxuICAgICMgQWRkIGNvbnRlbnRzIChxdWVzdGlvbnMsIG1vc3RseSlcbiAgICBfLmVhY2ggQGNvbnRlbnRzLCAoYykgPT4gQCRlbC5hcHBlbmQgYy4kZWxcblxuICAgIHRoaXNcbiIsIiMgRm9ybSB0aGF0IGhhcyBzYXZlIGFuZCBjYW5jZWwgYnV0dG9ucyB0aGF0IGZpcmUgc2F2ZSBhbmQgY2FuY2VsIGV2ZW50cy5cbiMgU2F2ZSBldmVudCB3aWxsIG9ubHkgYmUgZmlyZWQgaWYgdmFsaWRhdGVzXG5cbm1vZHVsZS5leHBvcnRzID0gQmFja2JvbmUuVmlldy5leHRlbmRcbiAgaW5pdGlhbGl6ZTogLT5cbiAgICBAY29udGVudHMgPSBAb3B0aW9ucy5jb250ZW50c1xuICAgIEByZW5kZXIoKVxuXG4gIGV2ZW50czogXG4gICAgJ2NsaWNrICNzYXZlX2J1dHRvbic6ICdzYXZlJ1xuICAgICdjbGljayAjY2FuY2VsX2J1dHRvbic6ICdjYW5jZWwnXG5cbiAgdmFsaWRhdGU6IC0+XG4gICAgIyBHZXQgYWxsIHZpc2libGUgaXRlbXNcbiAgICBpdGVtcyA9IF8uZmlsdGVyKEBjb250ZW50cywgKGMpIC0+XG4gICAgICBjLnZpc2libGUgYW5kIGMudmFsaWRhdGVcbiAgICApXG4gICAgcmV0dXJuIG5vdCBfLmFueShfLm1hcChpdGVtcywgKGl0ZW0pIC0+XG4gICAgICBpdGVtLnZhbGlkYXRlKClcbiAgICApKVxuXG4gIHJlbmRlcjogLT5cbiAgICBAJGVsLmh0bWwgJycnPGRpdiBpZD1cImNvbnRlbnRzXCI+PC9kaXY+XG4gICAgPGRpdj5cbiAgICAgICAgPGJ1dHRvbiBpZD1cInNhdmVfYnV0dG9uXCIgdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwiYnRuIGJ0bi1wcmltYXJ5IG1hcmdpbmVkXCI+U2F2ZTwvYnV0dG9uPlxuICAgICAgICAmbmJzcDtcbiAgICAgICAgPGJ1dHRvbiBpZD1cImNhbmNlbF9idXR0b25cIiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJidG4gbWFyZ2luZWRcIj5DYW5jZWw8L2J1dHRvbj5cbiAgICA8L2Rpdj4nJydcbiAgICBcbiAgICAjIEFkZCBjb250ZW50cyAocXVlc3Rpb25zLCBtb3N0bHkpXG4gICAgXy5lYWNoIEBjb250ZW50cywgKGMpID0+IEAkKCcjY29udGVudHMnKS5hcHBlbmQgYy4kZWxcbiAgICB0aGlzXG5cbiAgc2F2ZTogLT5cbiAgICBpZiBAdmFsaWRhdGUoKVxuICAgICAgQHRyaWdnZXIgJ3NhdmUnXG5cbiAgY2FuY2VsOiAtPlxuICAgIEB0cmlnZ2VyICdjYW5jZWwnXG4iLCJtb2R1bGUuZXhwb3J0cyA9IEJhY2tib25lLlZpZXcuZXh0ZW5kXG4gIGluaXRpYWxpemU6IC0+XG4gICAgQCRlbC5odG1sIF8udGVtcGxhdGUoJycnXG4gICAgICA8ZGl2IGNsYXNzPVwid2VsbCB3ZWxsLXNtYWxsXCI+PCU9aHRtbCU+PCUtdGV4dCU+PC9kaXY+XG4gICAgICAnJycpKGh0bWw6IEBvcHRpb25zLmh0bWwsIHRleHQ6IEBvcHRpb25zLnRleHQpXG4iLCIjIFRPRE8gRml4IHRvIGhhdmUgZWRpdGFibGUgWVlZWS1NTS1ERCB3aXRoIGNsaWNrIHRvIHBvcHVwIHNjcm9sbGVyXG5cblF1ZXN0aW9uID0gcmVxdWlyZSgnLi9mb3JtLWNvbnRyb2xzJykuUXVlc3Rpb25cblxubW9kdWxlLmV4cG9ydHMgPSBRdWVzdGlvbi5leHRlbmQoXG4gIGV2ZW50czpcbiAgICBjaGFuZ2U6IFwiY2hhbmdlZFwiXG5cbiAgY2hhbmdlZDogLT5cbiAgICBAbW9kZWwuc2V0IEBpZCwgQCRlbC5maW5kKFwiaW5wdXRbbmFtZT1cXFwiZGF0ZVxcXCJdXCIpLnZhbCgpXG5cbiAgcmVuZGVyQW5zd2VyOiAoYW5zd2VyRWwpIC0+XG4gICAgYW5zd2VyRWwuaHRtbCBfLnRlbXBsYXRlKFwiPGlucHV0IGNsYXNzPVxcXCJuZWVkc2NsaWNrXFxcIiBuYW1lPVxcXCJkYXRlXFxcIiAvPlwiLCB0aGlzKVxuICAgIGFuc3dlckVsLmZpbmQoXCJpbnB1dFwiKS52YWwgQG1vZGVsLmdldChAaWQpXG4gICAgYW5zd2VyRWwuZmluZChcImlucHV0XCIpLnNjcm9sbGVyXG4gICAgICBwcmVzZXQ6IFwiZGF0ZVwiXG4gICAgICB0aGVtZTogXCJpb3NcIlxuICAgICAgZGlzcGxheTogXCJtb2RhbFwiXG4gICAgICBtb2RlOiBcInNjcm9sbGVyXCJcbiAgICAgIGRhdGVPcmRlcjogXCJ5eW1tRCBkZFwiXG4gICAgICBkYXRlRm9ybWF0OiBcInl5LW1tLWRkXCJcblxuKSIsIlF1ZXN0aW9uID0gcmVxdWlyZSgnLi9mb3JtLWNvbnRyb2xzJykuUXVlc3Rpb25cblxubW9kdWxlLmV4cG9ydHMgPSBRdWVzdGlvbi5leHRlbmRcbiAgcmVuZGVyQW5zd2VyOiAoYW5zd2VyRWwpIC0+XG4gICAgYW5zd2VyRWwuaHRtbCBfLnRlbXBsYXRlKFwiPGlucHV0IHR5cGU9XFxcIm51bWJlclxcXCIgPCUgaWYgKG9wdGlvbnMuZGVjaW1hbCkgeyU+c3RlcD1cXFwiYW55XFxcIjwlfSU+IC8+XCIsIHRoaXMpXG4gICAgYW5zd2VyRWwuZmluZChcImlucHV0XCIpLnZhbCBAbW9kZWwuZ2V0KEBpZClcblxuICBldmVudHM6XG4gICAgY2hhbmdlOiBcImNoYW5nZWRcIlxuXG4gIHZhbGlkYXRlSW50ZXJuYWw6IC0+XG4gICAgdmFsID0gQCQoXCJpbnB1dFwiKS52YWwoKVxuICAgIGlmIEBvcHRpb25zLmRlY2ltYWwgYW5kIHZhbC5sZW5ndGggPiAwXG4gICAgICBpZiBwYXJzZUZsb2F0KHZhbCkgPT0gTmFOXG4gICAgICAgIHJldHVybiBcIkludmFsaWQgZGVjaW1hbCBudW1iZXJcIlxuICAgIGVsc2UgaWYgdmFsLmxlbmd0aCA+IDBcbiAgICAgIGlmIG5vdCB2YWwubWF0Y2goL14tP1xcZCskLylcbiAgICAgICAgcmV0dXJuIFwiSW52YWxpZCBpbnRlZ2VyIG51bWJlclwiXG4gICAgcmV0dXJuIG51bGxcblxuICBjaGFuZ2VkOiAtPlxuICAgIHZhbCA9IHBhcnNlRmxvYXQoQCQoXCJpbnB1dFwiKS52YWwoKSlcbiAgICBpZiB2YWwgPT0gTmFOXG4gICAgICB2YWwgPSBudWxsXG4gICAgQG1vZGVsLnNldCBAaWQsIHZhbCBcbiIsIlF1ZXN0aW9uID0gcmVxdWlyZSgnLi9mb3JtLWNvbnRyb2xzJykuUXVlc3Rpb25cblxubW9kdWxlLmV4cG9ydHMgPSBRdWVzdGlvbi5leHRlbmQoXG4gIGV2ZW50czpcbiAgICBjaGFuZ2U6IFwiY2hhbmdlZFwiXG5cbiAgc2V0T3B0aW9uczogKG9wdGlvbnMpIC0+XG4gICAgQG9wdGlvbnMub3B0aW9ucyA9IG9wdGlvbnNcbiAgICBAcmVuZGVyKClcblxuICBjaGFuZ2VkOiAoZSkgLT5cbiAgICB2YWwgPSAkKGUudGFyZ2V0KS52YWwoKVxuICAgIGlmIHZhbCBpcyBcIlwiXG4gICAgICBAbW9kZWwuc2V0IEBpZCwgbnVsbFxuICAgIGVsc2VcbiAgICAgIGluZGV4ID0gcGFyc2VJbnQodmFsKVxuICAgICAgdmFsdWUgPSBAb3B0aW9ucy5vcHRpb25zW2luZGV4XVswXVxuICAgICAgQG1vZGVsLnNldCBAaWQsIHZhbHVlXG5cbiAgcmVuZGVyQW5zd2VyOiAoYW5zd2VyRWwpIC0+XG4gICAgYW5zd2VyRWwuaHRtbCBfLnRlbXBsYXRlKFwiPHNlbGVjdCBpZD1cXFwic291cmNlX3R5cGVcXFwiPjwlPXJlbmRlckRyb3Bkb3duT3B0aW9ucygpJT48L3NlbGVjdD5cIiwgdGhpcylcbiAgICAjIENoZWNrIGlmIGFuc3dlciBwcmVzZW50IFxuICAgIGlmIG5vdCBfLmFueShAb3B0aW9ucy5vcHRpb25zLCAob3B0KSA9PiBvcHRbMF0gPT0gQG1vZGVsLmdldChAaWQpKSBhbmQgQG1vZGVsLmdldChAaWQpP1xuICAgICAgQCQoXCJzZWxlY3RcIikuYXR0cignZGlzYWJsZWQnLCAnZGlzYWJsZWQnKVxuXG4gIHJlbmRlckRyb3Bkb3duT3B0aW9uczogLT5cbiAgICBodG1sID0gXCJcIlxuICAgIFxuICAgICMgQWRkIGVtcHR5IG9wdGlvblxuICAgIGh0bWwgKz0gXCI8b3B0aW9uIHZhbHVlPVxcXCJcXFwiPjwvb3B0aW9uPlwiXG4gICAgZm9yIGkgaW4gWzAuLi5Ab3B0aW9ucy5vcHRpb25zLmxlbmd0aF1cbiAgICAgIGh0bWwgKz0gXy50ZW1wbGF0ZShcIjxvcHRpb24gdmFsdWU9XFxcIjwlPXBvc2l0aW9uJT5cXFwiIDwlPXNlbGVjdGVkJT4+PCUtdGV4dCU+PC9vcHRpb24+XCIsXG4gICAgICAgIHBvc2l0aW9uOiBpXG4gICAgICAgIHRleHQ6IEBvcHRpb25zLm9wdGlvbnNbaV1bMV1cbiAgICAgICAgc2VsZWN0ZWQ6IChpZiBAbW9kZWwuZ2V0KEBpZCkgaXMgQG9wdGlvbnMub3B0aW9uc1tpXVswXSB0aGVuIFwic2VsZWN0ZWQ9XFxcInNlbGVjdGVkXFxcIlwiIGVsc2UgXCJcIilcbiAgICAgIClcbiAgICByZXR1cm4gaHRtbFxuKSIsIlF1ZXN0aW9uID0gcmVxdWlyZSgnLi9mb3JtLWNvbnRyb2xzJykuUXVlc3Rpb25cblNvdXJjZUxpc3RQYWdlID0gcmVxdWlyZSAnLi4vcGFnZXMvU291cmNlTGlzdFBhZ2UnXG5zb3VyY2Vjb2RlcyA9IHJlcXVpcmUgJy4uL3NvdXJjZWNvZGVzJ1xuXG5tb2R1bGUuZXhwb3J0cyA9IFF1ZXN0aW9uLmV4dGVuZFxuICByZW5kZXJBbnN3ZXI6IChhbnN3ZXJFbCkgLT5cbiAgICBhbnN3ZXJFbC5odG1sICcnJ1xuICAgICAgPGRpdiBjbGFzcz1cImlucHV0LWFwcGVuZFwiPlxuICAgICAgICA8aW5wdXQgdHlwZT1cInRlbFwiPlxuICAgICAgICA8YnV0dG9uIGNsYXNzPVwiYnRuXCIgaWQ9XCJzZWxlY3RcIiB0eXBlPVwiYnV0dG9uXCI+U2VsZWN0PC9idXR0b24+XG4gICAgICA8L2Rpdj4nJydcbiAgICBhbnN3ZXJFbC5maW5kKFwiaW5wdXRcIikudmFsIEBtb2RlbC5nZXQoQGlkKVxuXG4gIGV2ZW50czpcbiAgICAnY2hhbmdlJyA6ICdjaGFuZ2VkJ1xuICAgICdjbGljayAjc2VsZWN0JyA6ICdzZWxlY3RTb3VyY2UnXG5cbiAgY2hhbmdlZDogLT5cbiAgICBAbW9kZWwuc2V0IEBpZCwgQCQoXCJpbnB1dFwiKS52YWwoKVxuXG4gIHNlbGVjdFNvdXJjZTogLT5cbiAgICBAY3R4LnBhZ2VyLm9wZW5QYWdlIFNvdXJjZUxpc3RQYWdlLCBcbiAgICAgIHsgb25TZWxlY3Q6IChzb3VyY2UpPT5cbiAgICAgICAgQG1vZGVsLnNldCBAaWQsIHNvdXJjZS5jb2RlXG4gICAgICB9XG5cbiAgdmFsaWRhdGVJbnRlcm5hbDogLT5cbiAgICBpZiBub3QgQCQoXCJpbnB1dFwiKS52YWwoKVxuICAgICAgcmV0dXJuIGZhbHNlXG5cbiAgICBpZiBzb3VyY2Vjb2Rlcy5pc1ZhbGlkKEAkKFwiaW5wdXRcIikudmFsKCkpXG4gICAgICByZXR1cm4gZmFsc2VcblxuICAgIHJldHVybiBcIkludmFsaWQgU291cmNlXCJcblxuIiwiUXVlc3Rpb24gPSByZXF1aXJlKCcuL2Zvcm0tY29udHJvbHMnKS5RdWVzdGlvblxuSW1hZ2VQYWdlID0gcmVxdWlyZSAnLi4vcGFnZXMvSW1hZ2VQYWdlJ1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEltYWdlUXVlc3Rpb24gZXh0ZW5kcyBRdWVzdGlvblxuICBldmVudHM6XG4gICAgXCJjbGljayAjYWRkXCI6IFwiYWRkQ2xpY2tcIlxuICAgIFwiY2xpY2sgLnRodW1ibmFpbC1pbWdcIjogXCJ0aHVtYm5haWxDbGlja1wiXG5cbiAgcmVuZGVyQW5zd2VyOiAoYW5zd2VyRWwpIC0+XG4gICAgIyBSZW5kZXIgaW1hZ2UgdXNpbmcgaW1hZ2UgbWFuYWdlclxuICAgIGlmIG5vdCBAY3R4LmltYWdlTWFuYWdlclxuICAgICAgYW5zd2VyRWwuaHRtbCAnJyc8ZGl2IGNsYXNzPVwidGV4dC1lcnJvclwiPkltYWdlcyBub3QgYXZhaWxhYmxlPC9kaXY+JycnXG4gICAgZWxzZVxuICAgICAgaW1hZ2UgPSBAbW9kZWwuZ2V0KEBpZClcblxuICAgICAgIyBEZXRlcm1pbmUgaWYgY2FuIGFkZCBpbWFnZXNcbiAgICAgIG5vdFN1cHBvcnRlZCA9IGZhbHNlXG4gICAgICBpZiBAb3B0aW9ucy5yZWFkb25seVxuICAgICAgICBjYW5BZGQgPSBmYWxzZVxuICAgICAgZWxzZSBpZiBAY3R4LmNhbWVyYSBhbmQgQGN0eC5pbWFnZU1hbmFnZXIuYWRkSW1hZ2VcbiAgICAgICAgY2FuQWRkID0gbm90IGltYWdlPyAjIERvbid0IGFsbG93IGFkZGluZyBtb3JlIHRoYW4gb25lXG4gICAgICBlbHNlXG4gICAgICAgIGNhbkFkZCA9IGZhbHNlXG4gICAgICAgIG5vdFN1cHBvcnRlZCA9IG5vdCBpbWFnZVxuXG4gICAgICAjIERldGVybWluZSBpZiB3ZSBuZWVkIHRvIHRlbGwgdXNlciB0aGF0IG5vIGltYWdlIGlzIGF2YWlsYWJsZVxuICAgICAgbm9JbWFnZSA9IG5vdCBjYW5BZGQgYW5kIG5vdCBpbWFnZSBhbmQgbm90IG5vdFN1cHBvcnRlZFxuXG4gICAgICAjIFJlbmRlciBpbWFnZXNcbiAgICAgIGFuc3dlckVsLmh0bWwgdGVtcGxhdGVzWydmb3Jtcy9JbWFnZVF1ZXN0aW9uJ10oaW1hZ2U6IGltYWdlLCBjYW5BZGQ6IGNhbkFkZCwgbm9JbWFnZTogbm9JbWFnZSwgbm90U3VwcG9ydGVkOiBub3RTdXBwb3J0ZWQpXG5cbiAgICAgICMgU2V0IHNvdXJjZVxuICAgICAgaWYgaW1hZ2VcbiAgICAgICAgQHNldFRodW1ibmFpbFVybChpbWFnZS5pZClcbiAgICBcbiAgc2V0VGh1bWJuYWlsVXJsOiAoaWQpIC0+XG4gICAgc3VjY2VzcyA9ICh1cmwpID0+XG4gICAgICBAJChcIiNcIiArIGlkKS5hdHRyKFwic3JjXCIsIHVybClcbiAgICBAY3R4LmltYWdlTWFuYWdlci5nZXRJbWFnZVRodW1ibmFpbFVybCBpZCwgc3VjY2VzcywgQGVycm9yXG5cbiAgYWRkQ2xpY2s6IC0+XG4gICAgIyBDYWxsIGNhbWVyYSB0byBnZXQgaW1hZ2VcbiAgICBzdWNjZXNzID0gKHVybCkgPT5cbiAgICAgICMgQWRkIGltYWdlXG4gICAgICBAY3R4LmltYWdlTWFuYWdlci5hZGRJbWFnZSh1cmwsIChpZCkgPT5cbiAgICAgICAgIyBBZGQgdG8gbW9kZWxcbiAgICAgICAgQG1vZGVsLnNldChAaWQsIHsgaWQ6IGlkIH0pXG4gICAgICAsIEBjdHguZXJyb3IpXG4gICAgQGN0eC5jYW1lcmEudGFrZVBpY3R1cmUgc3VjY2VzcywgKGVycikgLT5cbiAgICAgIGFsZXJ0KFwiRmFpbGVkIHRvIHRha2UgcGljdHVyZVwiKVxuXG4gIHRodW1ibmFpbENsaWNrOiAoZXYpIC0+XG4gICAgaWQgPSBldi5jdXJyZW50VGFyZ2V0LmlkXG5cbiAgICAjIENyZWF0ZSBvblJlbW92ZSBjYWxsYmFja1xuICAgIG9uUmVtb3ZlID0gKCkgPT4gXG4gICAgICBAbW9kZWwuc2V0KEBpZCwgbnVsbClcblxuICAgIEBjdHgucGFnZXIub3BlblBhZ2UoSW1hZ2VQYWdlLCB7IGlkOiBpZCwgb25SZW1vdmU6IG9uUmVtb3ZlIH0pIiwiUXVlc3Rpb24gPSByZXF1aXJlKCcuL2Zvcm0tY29udHJvbHMnKS5RdWVzdGlvblxuSW1hZ2VQYWdlID0gcmVxdWlyZSAnLi4vcGFnZXMvSW1hZ2VQYWdlJ1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEltYWdlc1F1ZXN0aW9uIGV4dGVuZHMgUXVlc3Rpb25cbiAgZXZlbnRzOlxuICAgIFwiY2xpY2sgI2FkZFwiOiBcImFkZENsaWNrXCJcbiAgICBcImNsaWNrIC50aHVtYm5haWwtaW1nXCI6IFwidGh1bWJuYWlsQ2xpY2tcIlxuXG4gIHJlbmRlckFuc3dlcjogKGFuc3dlckVsKSAtPlxuICAgICMgUmVuZGVyIGltYWdlIHVzaW5nIGltYWdlIG1hbmFnZXJcbiAgICBpZiBub3QgQGN0eC5pbWFnZU1hbmFnZXJcbiAgICAgIGFuc3dlckVsLmh0bWwgJycnPGRpdiBjbGFzcz1cInRleHQtZXJyb3JcIj5JbWFnZXMgbm90IGF2YWlsYWJsZTwvZGl2PicnJ1xuICAgIGVsc2VcbiAgICAgIGltYWdlcyA9IEBtb2RlbC5nZXQoQGlkKVxuXG4gICAgICAjIERldGVybWluZSBpZiBjYW4gYWRkIGltYWdlc1xuICAgICAgbm90U3VwcG9ydGVkID0gZmFsc2VcbiAgICAgIGlmIEBvcHRpb25zLnJlYWRvbmx5XG4gICAgICAgIGNhbkFkZCA9IGZhbHNlXG4gICAgICBlbHNlIGlmIEBjdHguY2FtZXJhIGFuZCBAY3R4LmltYWdlTWFuYWdlci5hZGRJbWFnZVxuICAgICAgICBjYW5BZGQgPSB0cnVlXG4gICAgICBlbHNlXG4gICAgICAgIGNhbkFkZCA9IGZhbHNlXG4gICAgICAgIG5vdFN1cHBvcnRlZCA9IG5vdCBpbWFnZXMgb3IgaW1hZ2VzLmxlbmd0aCA9PSAwXG5cbiAgICAgICMgRGV0ZXJtaW5lIGlmIHdlIG5lZWQgdG8gdGVsbCB1c2VyIHRoYXQgbm8gaW1hZ2UgYXJlIGF2YWlsYWJsZVxuICAgICAgbm9JbWFnZSA9IG5vdCBjYW5BZGQgYW5kIChub3QgaW1hZ2VzIG9yIGltYWdlcy5sZW5ndGggPT0gMCkgYW5kIG5vdCBub3RTdXBwb3J0ZWRcblxuICAgICAgIyBSZW5kZXIgaW1hZ2VzXG4gICAgICBhbnN3ZXJFbC5odG1sIHRlbXBsYXRlc1snZm9ybXMvSW1hZ2VzUXVlc3Rpb24nXShpbWFnZXM6IGltYWdlcywgY2FuQWRkOiBjYW5BZGQsIG5vSW1hZ2U6IG5vSW1hZ2UsIG5vdFN1cHBvcnRlZDogbm90U3VwcG9ydGVkKVxuXG4gICAgICAjIFNldCBzb3VyY2VzXG4gICAgICBpZiBpbWFnZXNcbiAgICAgICAgZm9yIGltYWdlIGluIGltYWdlc1xuICAgICAgICAgIEBzZXRUaHVtYm5haWxVcmwoaW1hZ2UuaWQpXG4gICAgXG4gIHNldFRodW1ibmFpbFVybDogKGlkKSAtPlxuICAgIHN1Y2Nlc3MgPSAodXJsKSA9PlxuICAgICAgQCQoXCIjXCIgKyBpZCkuYXR0cihcInNyY1wiLCB1cmwpXG4gICAgQGN0eC5pbWFnZU1hbmFnZXIuZ2V0SW1hZ2VUaHVtYm5haWxVcmwgaWQsIHN1Y2Nlc3MsIEBlcnJvclxuXG4gIGFkZENsaWNrOiAtPlxuICAgICMgQ2FsbCBjYW1lcmEgdG8gZ2V0IGltYWdlXG4gICAgc3VjY2VzcyA9ICh1cmwpID0+XG4gICAgICAjIEFkZCBpbWFnZVxuICAgICAgQGN0eC5pbWFnZU1hbmFnZXIuYWRkSW1hZ2UodXJsLCAoaWQpID0+XG4gICAgICAgICMgQWRkIHRvIG1vZGVsXG4gICAgICAgIGltYWdlcyA9IEBtb2RlbC5nZXQoQGlkKSB8fCBbXVxuICAgICAgICBpbWFnZXMucHVzaCB7IGlkOiBpZCB9XG4gICAgICAgIEBtb2RlbC5zZXQoQGlkLCBpbWFnZXMpXG5cbiAgICAgICwgQGN0eC5lcnJvcilcbiAgICBAY3R4LmNhbWVyYS50YWtlUGljdHVyZSBzdWNjZXNzLCAoZXJyKSAtPlxuICAgICAgYWxlcnQoXCJGYWlsZWQgdG8gdGFrZSBwaWN0dXJlXCIpXG5cbiAgdGh1bWJuYWlsQ2xpY2s6IChldikgLT5cbiAgICBpZCA9IGV2LmN1cnJlbnRUYXJnZXQuaWRcblxuICAgICMgQ3JlYXRlIG9uUmVtb3ZlIGNhbGxiYWNrXG4gICAgb25SZW1vdmUgPSAoKSA9PiBcbiAgICAgIGltYWdlcyA9IEBtb2RlbC5nZXQoQGlkKSB8fCBbXVxuICAgICAgaW1hZ2VzID0gXy5yZWplY3QgaW1hZ2VzLCAoaW1nKSA9PlxuICAgICAgICBpbWcuaWQgPT0gaWRcbiAgICAgIEBtb2RlbC5zZXQoQGlkLCBpbWFnZXMpICAgICAgXG5cbiAgICBAY3R4LnBhZ2VyLm9wZW5QYWdlKEltYWdlUGFnZSwgeyBpZDogaWQsIG9uUmVtb3ZlOiBvblJlbW92ZSB9KSIsIiMgSW1wcm92ZWQgbG9jYXRpb24gZmluZGVyXG5jbGFzcyBMb2NhdGlvbkZpbmRlclxuICBjb25zdHJ1Y3RvcjogLT5cbiAgICBfLmV4dGVuZCBALCBCYWNrYm9uZS5FdmVudHNcbiAgICBcbiAgZ2V0TG9jYXRpb246IC0+XG4gICAgIyBCb3RoIGZhaWx1cmVzIGFyZSByZXF1aXJlZCB0byB0cmlnZ2VyIGVycm9yXG4gICAgbG9jYXRpb25FcnJvciA9IF8uYWZ0ZXIgMiwgPT5cbiAgICAgIEB0cmlnZ2VyICdlcnJvcidcblxuICAgIGhpZ2hBY2N1cmFjeUZpcmVkID0gZmFsc2VcblxuICAgIGxvd0FjY3VyYWN5ID0gKHBvcykgPT5cbiAgICAgIGlmIG5vdCBoaWdoQWNjdXJhY3lGaXJlZFxuICAgICAgICBAdHJpZ2dlciAnZm91bmQnLCBwb3NcblxuICAgIGhpZ2hBY2N1cmFjeSA9IChwb3MpID0+XG4gICAgICBoaWdoQWNjdXJhY3lGaXJlZCA9IHRydWVcbiAgICAgIEB0cmlnZ2VyICdmb3VuZCcsIHBvc1xuXG4gICAgIyBHZXQgYm90aCBoaWdoIGFuZCBsb3cgYWNjdXJhY3ksIGFzIGxvdyBpcyBzdWZmaWNpZW50IGZvciBpbml0aWFsIGRpc3BsYXlcbiAgICBuYXZpZ2F0b3IuZ2VvbG9jYXRpb24uZ2V0Q3VycmVudFBvc2l0aW9uKGxvd0FjY3VyYWN5LCBsb2NhdGlvbkVycm9yLCB7XG4gICAgICAgIG1heGltdW1BZ2UgOiAzNjAwKjI0LFxuICAgICAgICB0aW1lb3V0IDogMTAwMDAsXG4gICAgICAgIGVuYWJsZUhpZ2hBY2N1cmFjeSA6IGZhbHNlXG4gICAgfSlcblxuICAgIG5hdmlnYXRvci5nZW9sb2NhdGlvbi5nZXRDdXJyZW50UG9zaXRpb24oaGlnaEFjY3VyYWN5LCBsb2NhdGlvbkVycm9yLCB7XG4gICAgICAgIG1heGltdW1BZ2UgOiAzNjAwLFxuICAgICAgICB0aW1lb3V0IDogMzAwMDAsXG4gICAgICAgIGVuYWJsZUhpZ2hBY2N1cmFjeSA6IHRydWVcbiAgICB9KVxuXG4gIHN0YXJ0V2F0Y2g6IC0+XG4gICAgIyBBbGxvdyBvbmUgd2F0Y2ggYXQgbW9zdFxuICAgIGlmIEBsb2NhdGlvbldhdGNoSWQ/XG4gICAgICBAc3RvcFdhdGNoKClcblxuICAgIGhpZ2hBY2N1cmFjeUZpcmVkID0gZmFsc2VcbiAgICBsb3dBY2N1cmFjeUZpcmVkID0gZmFsc2VcblxuICAgIGxvd0FjY3VyYWN5ID0gKHBvcykgPT5cbiAgICAgIGlmIG5vdCBoaWdoQWNjdXJhY3lGaXJlZFxuICAgICAgICBsb3dBY2N1cmFjeUZpcmVkID0gdHJ1ZVxuICAgICAgICBAdHJpZ2dlciAnZm91bmQnLCBwb3NcblxuICAgIGhpZ2hBY2N1cmFjeSA9IChwb3MpID0+XG4gICAgICBoaWdoQWNjdXJhY3lGaXJlZCA9IHRydWVcbiAgICAgIEB0cmlnZ2VyICdmb3VuZCcsIHBvc1xuXG4gICAgZXJyb3IgPSAoZXJyb3IpID0+XG4gICAgICBjb25zb2xlLmxvZyBcIiMjIyBlcnJvciBcIlxuICAgICAgIyBObyBlcnJvciBpZiBmaXJlZCBvbmNlXG4gICAgICBpZiBub3QgbG93QWNjdXJhY3lGaXJlZCBhbmQgbm90IGhpZ2hBY2N1cmFjeUZpcmVkXG4gICAgICAgIEB0cmlnZ2VyICdlcnJvcicsIGVycm9yXG5cbiAgICAjIEZpcmUgaW5pdGlhbCBsb3ctYWNjdXJhY3kgb25lXG4gICAgbmF2aWdhdG9yLmdlb2xvY2F0aW9uLmdldEN1cnJlbnRQb3NpdGlvbihsb3dBY2N1cmFjeSwgZXJyb3IsIHtcbiAgICAgICAgbWF4aW11bUFnZSA6IDM2MDAqMjQsXG4gICAgICAgIHRpbWVvdXQgOiAxMDAwMCxcbiAgICAgICAgZW5hYmxlSGlnaEFjY3VyYWN5IDogZmFsc2VcbiAgICB9KVxuXG4gICAgQGxvY2F0aW9uV2F0Y2hJZCA9IG5hdmlnYXRvci5nZW9sb2NhdGlvbi53YXRjaFBvc2l0aW9uKGhpZ2hBY2N1cmFjeSwgZXJyb3IsIHtcbiAgICAgICAgbWF4aW11bUFnZSA6IDMwMDAsXG4gICAgICAgIGVuYWJsZUhpZ2hBY2N1cmFjeSA6IHRydWVcbiAgICB9KSAgXG5cbiAgc3RvcFdhdGNoOiAtPlxuICAgIGlmIEBsb2NhdGlvbldhdGNoSWQ/XG4gICAgICBuYXZpZ2F0b3IuZ2VvbG9jYXRpb24uY2xlYXJXYXRjaChAbG9jYXRpb25XYXRjaElkKVxuICAgICAgQGxvY2F0aW9uV2F0Y2hJZCA9IHVuZGVmaW5lZFxuXG5cbm1vZHVsZS5leHBvcnRzID0gTG9jYXRpb25GaW5kZXIgICIsIiMgUGFnZSB0aGF0IGlzIGRpc3BsYXllZCBieSB0aGUgUGFnZXIuIFBhZ2VzIGhhdmUgdGhlIGZvbGxvd2luZyBsaWZlY3ljbGU6XG4jIGNyZWF0ZSwgYWN0aXZhdGUsIFtkZWFjdGl2YXRlLCBhY3RpdmF0ZS4uLl0sIGRlYWN0aXZhdGUsIGRlc3Ryb3lcbiMgQ29udGV4dCBpcyBtaXhlZCBpbiB0byB0aGUgcGFnZSBvYmplY3RcbiMgU3RhdGljIG1ldGhvZCBcImNhbk9wZW4oY3R4KVwiLCBpZiBwcmVzZW50LCBjYW4gZm9yYmlkIG9wZW5pbmcgcGFnZSBpZiBpdCByZXR1cm5zIGZhbHNlXG4jIFVzZWZ1bCBmb3IgZGlzcGxheWluZyBtZW51cyB3aXRoIHBhZ2UgbGlzdHMuXG5cbmNsYXNzIFBhZ2UgZXh0ZW5kcyBCYWNrYm9uZS5WaWV3XG4gIGNvbnN0cnVjdG9yOiAoY3R4LCBvcHRpb25zPXt9KSAtPlxuICAgIHN1cGVyKG9wdGlvbnMpXG4gICAgQGN0eCA9IGN0eFxuXG4gICAgIyBNaXggaW4gY29udGV4dCBmb3IgY29udmVuaWVuY2VcbiAgICBfLmRlZmF1bHRzKEAsIGN0eCkgXG5cbiAgICAjIFN0b3JlIHN1YnZpZXdzXG4gICAgQF9zdWJ2aWV3cyA9IFtdXG5cbiAgICAjIFNldHVwIGRlZmF1bHQgYnV0dG9uIGJhclxuICAgIEBidXR0b25CYXIgPSBuZXcgQnV0dG9uQmFyKClcblxuICAgICMgU2V0dXAgZGVmYXVsdCBjb250ZXh0IG1lbnVcbiAgICBAY29udGV4dE1lbnUgPSBuZXcgQ29udGV4dE1lbnUoKVxuXG4gIGNsYXNzTmFtZTogXCJwYWdlXCJcblxuICBAY2FuT3BlbjogKGN0eCkgLT4gdHJ1ZVxuICBjcmVhdGU6IC0+XG4gIGFjdGl2YXRlOiAtPlxuICBkZWFjdGl2YXRlOiAtPlxuICBkZXN0cm95OiAtPlxuICByZW1vdmU6IC0+XG4gICAgQHJlbW92ZVN1YnZpZXdzKClcbiAgICBzdXBlcigpXG5cbiAgZ2V0VGl0bGU6IC0+IEB0aXRsZVxuXG4gIHNldFRpdGxlOiAodGl0bGUpIC0+XG4gICAgQHRpdGxlID0gdGl0bGVcbiAgICBAdHJpZ2dlciAnY2hhbmdlOnRpdGxlJ1xuXG4gIGFkZFN1YnZpZXc6ICh2aWV3KSAtPlxuICAgIEBfc3Vidmlld3MucHVzaCh2aWV3KVxuXG4gIHJlbW92ZVN1YnZpZXdzOiAtPlxuICAgIGZvciBzdWJ2aWV3IGluIEBfc3Vidmlld3NcbiAgICAgIHN1YnZpZXcucmVtb3ZlKClcblxuICBnZXRCdXR0b25CYXI6IC0+XG4gICAgcmV0dXJuIEBidXR0b25CYXJcblxuICBnZXRDb250ZXh0TWVudTogLT5cbiAgICByZXR1cm4gQGNvbnRleHRNZW51XG5cbiAgc2V0dXBCdXR0b25CYXI6IChpdGVtcykgLT5cbiAgICAjIFNldHVwIGJ1dHRvbiBiYXJcbiAgICBAYnV0dG9uQmFyLnNldHVwKGl0ZW1zKVxuXG4gIHNldHVwQ29udGV4dE1lbnU6IChpdGVtcykgLT5cbiAgICAjIFNldHVwIGNvbnRleHQgbWVudVxuICAgIEBjb250ZXh0TWVudS5zZXR1cChpdGVtcylcblxuIyBTdGFuZGFyZCBidXR0b24gYmFyLiBFYWNoIGl0ZW1cbiMgaGFzIG9wdGlvbmFsIFwidGV4dFwiLCBvcHRpb25hbCBcImljb25cIiBhbmQgXCJjbGlja1wiIChhY3Rpb24pLlxuIyBGb3Igc3VibWVudSwgYWRkIGFycmF5IHRvIFwibWVudVwiLiBPbmUgbGV2ZWwgbmVzdGluZyBvbmx5LlxuY2xhc3MgQnV0dG9uQmFyIGV4dGVuZHMgQmFja2JvbmUuVmlld1xuICBldmVudHM6IFxuICAgIFwiY2xpY2sgLm1lbnVpdGVtXCIgOiBcImNsaWNrTWVudUl0ZW1cIlxuXG4gIHNldHVwOiAoaXRlbXMpIC0+XG4gICAgQGl0ZW1zID0gaXRlbXNcbiAgICBAaXRlbU1hcCA9IHt9XG5cbiAgICAjIEFkZCBpZCB0byBhbGwgaXRlbXMgaWYgbm90IHByZXNlbnRcbiAgICBpZCA9IDFcbiAgICBmb3IgaXRlbSBpbiBpdGVtc1xuICAgICAgaWYgbm90IGl0ZW0uaWQ/XG4gICAgICAgIGl0ZW0uaWQgPSBpZFxuICAgICAgICBpZD1pZCsxXG4gICAgICBAaXRlbU1hcFtpdGVtLmlkXSA9IGl0ZW1cblxuICAgICAgIyBBZGQgdG8gc3VibWVudVxuICAgICAgaWYgaXRlbS5tZW51XG4gICAgICAgIGZvciBzdWJpdGVtIGluIGl0ZW0ubWVudVxuICAgICAgICAgIGlmIG5vdCBzdWJpdGVtLmlkP1xuICAgICAgICAgICAgc3ViaXRlbS5pZCA9IGlkLnRvU3RyaW5nKClcbiAgICAgICAgICAgIGlkPWlkKzFcbiAgICAgICAgICBAaXRlbU1hcFtzdWJpdGVtLmlkXSA9IHN1Yml0ZW1cblxuICAgIEByZW5kZXIoKVxuXG4gIHJlbmRlcjogLT5cbiAgICBAJGVsLmh0bWwgdGVtcGxhdGVzWydCdXR0b25CYXInXShpdGVtczogQGl0ZW1zKVxuXG4gIGNsaWNrTWVudUl0ZW06IChlKSAtPlxuICAgIGlkID0gZS5jdXJyZW50VGFyZ2V0LmlkXG4gICAgaXRlbSA9IEBpdGVtTWFwW2lkXVxuICAgIGlmIGl0ZW0uY2xpY2s/XG4gICAgICBpdGVtLmNsaWNrKClcblxuIyBDb250ZXh0IG1lbnUgdG8gZ28gaW4gc2xpZGUgbWVudVxuIyBTdGFuZGFyZCBidXR0b24gYmFyLiBFYWNoIGl0ZW0gXCJ0ZXh0XCIsIG9wdGlvbmFsIFwiZ2x5cGhcIiAoYm9vdHN0cmFwIGdseXBoIHdpdGhvdXQgaWNvbi0gcHJlZml4KSBhbmQgXCJjbGlja1wiIChhY3Rpb24pLlxuY2xhc3MgQ29udGV4dE1lbnUgZXh0ZW5kcyBCYWNrYm9uZS5WaWV3XG4gIGV2ZW50czogXG4gICAgXCJjbGljayAubWVudWl0ZW1cIiA6IFwiY2xpY2tNZW51SXRlbVwiXG5cbiAgc2V0dXA6IChpdGVtcykgLT5cbiAgICBAaXRlbXMgPSBpdGVtc1xuICAgIEBpdGVtTWFwID0ge31cblxuICAgICMgQWRkIGlkIHRvIGFsbCBpdGVtcyBpZiBub3QgcHJlc2VudFxuICAgIGlkID0gMVxuICAgIGZvciBpdGVtIGluIGl0ZW1zXG4gICAgICBpZiBub3QgaXRlbS5pZD9cbiAgICAgICAgaXRlbS5pZCA9IGlkXG4gICAgICAgIGlkPWlkKzFcbiAgICAgIEBpdGVtTWFwW2l0ZW0uaWRdID0gaXRlbVxuXG4gICAgQHJlbmRlcigpXG5cbiAgcmVuZGVyOiAtPlxuICAgIEAkZWwuaHRtbCB0ZW1wbGF0ZXNbJ0NvbnRleHRNZW51J10oaXRlbXM6IEBpdGVtcylcblxuICBjbGlja01lbnVJdGVtOiAoZSkgLT5cbiAgICBpZCA9IGUuY3VycmVudFRhcmdldC5pZFxuICAgIGl0ZW0gPSBAaXRlbU1hcFtpZF1cbiAgICBpZiBpdGVtLmNsaWNrP1xuICAgICAgaXRlbS5jbGljaygpXG5cbm1vZHVsZS5leHBvcnRzID0gUGFnZSIsImV4cG9ydHMuc2VxVG9Db2RlID0gKHNlcSkgLT5cbiAgIyBHZXQgc3RyaW5nIG9mIHNlcSBudW1iZXJcbiAgc3RyID0gXCJcIiArIHNlcVxuXG4gIHN1bSA9IDBcbiAgZm9yIGkgaW4gWzAuLi5zdHIubGVuZ3RoXVxuICAgIGRpZ2l0ID0gcGFyc2VJbnQoc3RyW3N0ci5sZW5ndGgtMS1pXSlcbiAgICBpZiBpJTMgPT0gMFxuICAgICAgc3VtICs9IDcgKiBkaWdpdFxuICAgIGlmIGklMyA9PSAxXG4gICAgICBzdW0gKz0gMyAqIGRpZ2l0XG4gICAgaWYgaSUzID09IDJcbiAgICAgIHN1bSArPSAgZGlnaXRcbiAgcmV0dXJuIHN0ciArIChzdW0gJSAxMClcblxuZXhwb3J0cy5pc1ZhbGlkID0gKGNvZGUpIC0+XG4gIHNlcSA9IHBhcnNlSW50KGNvZGUuc3Vic3RyaW5nKDAsIGNvZGUubGVuZ3RoIC0gMSkpXG5cbiAgcmV0dXJuIGV4cG9ydHMuc2VxVG9Db2RlKHNlcSkgPT0gY29kZSIsIi8qXG49PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5NZXRlb3IgaXMgbGljZW5zZWQgdW5kZXIgdGhlIE1JVCBMaWNlbnNlXG49PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbkNvcHlyaWdodCAoQykgMjAxMS0tMjAxMiBNZXRlb3IgRGV2ZWxvcG1lbnQgR3JvdXBcblxuUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcblxuVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG5cblRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG5cbj09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5UaGlzIGxpY2Vuc2UgYXBwbGllcyB0byBhbGwgY29kZSBpbiBNZXRlb3IgdGhhdCBpcyBub3QgYW4gZXh0ZXJuYWxseVxubWFpbnRhaW5lZCBsaWJyYXJ5LiBFeHRlcm5hbGx5IG1haW50YWluZWQgbGlicmFyaWVzIGhhdmUgdGhlaXIgb3duXG5saWNlbnNlcywgaW5jbHVkZWQgYmVsb3c6XG49PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4qL1xuXG5Mb2NhbENvbGxlY3Rpb24gPSB7fTtcbkVKU09OID0gcmVxdWlyZShcIi4vRUpTT05cIik7XG5cbi8vIExpa2UgXy5pc0FycmF5LCBidXQgZG9lc24ndCByZWdhcmQgcG9seWZpbGxlZCBVaW50OEFycmF5cyBvbiBvbGQgYnJvd3NlcnMgYXNcbi8vIGFycmF5cy5cbnZhciBpc0FycmF5ID0gZnVuY3Rpb24gKHgpIHtcbiAgcmV0dXJuIF8uaXNBcnJheSh4KSAmJiAhRUpTT04uaXNCaW5hcnkoeCk7XG59O1xuXG52YXIgX2FueUlmQXJyYXkgPSBmdW5jdGlvbiAoeCwgZikge1xuICBpZiAoaXNBcnJheSh4KSlcbiAgICByZXR1cm4gXy5hbnkoeCwgZik7XG4gIHJldHVybiBmKHgpO1xufTtcblxudmFyIF9hbnlJZkFycmF5UGx1cyA9IGZ1bmN0aW9uICh4LCBmKSB7XG4gIGlmIChmKHgpKVxuICAgIHJldHVybiB0cnVlO1xuICByZXR1cm4gaXNBcnJheSh4KSAmJiBfLmFueSh4LCBmKTtcbn07XG5cbnZhciBoYXNPcGVyYXRvcnMgPSBmdW5jdGlvbih2YWx1ZVNlbGVjdG9yKSB7XG4gIHZhciB0aGVzZUFyZU9wZXJhdG9ycyA9IHVuZGVmaW5lZDtcbiAgZm9yICh2YXIgc2VsS2V5IGluIHZhbHVlU2VsZWN0b3IpIHtcbiAgICB2YXIgdGhpc0lzT3BlcmF0b3IgPSBzZWxLZXkuc3Vic3RyKDAsIDEpID09PSAnJCc7XG4gICAgaWYgKHRoZXNlQXJlT3BlcmF0b3JzID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoZXNlQXJlT3BlcmF0b3JzID0gdGhpc0lzT3BlcmF0b3I7XG4gICAgfSBlbHNlIGlmICh0aGVzZUFyZU9wZXJhdG9ycyAhPT0gdGhpc0lzT3BlcmF0b3IpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkluY29uc2lzdGVudCBzZWxlY3RvcjogXCIgKyB2YWx1ZVNlbGVjdG9yKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuICEhdGhlc2VBcmVPcGVyYXRvcnM7ICAvLyB7fSBoYXMgbm8gb3BlcmF0b3JzXG59O1xuXG52YXIgY29tcGlsZVZhbHVlU2VsZWN0b3IgPSBmdW5jdGlvbiAodmFsdWVTZWxlY3Rvcikge1xuICBpZiAodmFsdWVTZWxlY3RvciA9PSBudWxsKSB7ICAvLyB1bmRlZmluZWQgb3IgbnVsbFxuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJldHVybiBfYW55SWZBcnJheSh2YWx1ZSwgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIHggPT0gbnVsbDsgIC8vIHVuZGVmaW5lZCBvciBudWxsXG4gICAgICB9KTtcbiAgICB9O1xuICB9XG5cbiAgLy8gU2VsZWN0b3IgaXMgYSBub24tbnVsbCBwcmltaXRpdmUgKGFuZCBub3QgYW4gYXJyYXkgb3IgUmVnRXhwIGVpdGhlcikuXG4gIGlmICghXy5pc09iamVjdCh2YWx1ZVNlbGVjdG9yKSkge1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJldHVybiBfYW55SWZBcnJheSh2YWx1ZSwgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIHggPT09IHZhbHVlU2VsZWN0b3I7XG4gICAgICB9KTtcbiAgICB9O1xuICB9XG5cbiAgaWYgKHZhbHVlU2VsZWN0b3IgaW5zdGFuY2VvZiBSZWdFeHApIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZClcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgcmV0dXJuIF9hbnlJZkFycmF5KHZhbHVlLCBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4gdmFsdWVTZWxlY3Rvci50ZXN0KHgpO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfVxuXG4gIC8vIEFycmF5cyBtYXRjaCBlaXRoZXIgaWRlbnRpY2FsIGFycmF5cyBvciBhcnJheXMgdGhhdCBjb250YWluIGl0IGFzIGEgdmFsdWUuXG4gIGlmIChpc0FycmF5KHZhbHVlU2VsZWN0b3IpKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgaWYgKCFpc0FycmF5KHZhbHVlKSlcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgcmV0dXJuIF9hbnlJZkFycmF5UGx1cyh2YWx1ZSwgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIExvY2FsQ29sbGVjdGlvbi5fZi5fZXF1YWwodmFsdWVTZWxlY3RvciwgeCk7XG4gICAgICB9KTtcbiAgICB9O1xuICB9XG5cbiAgLy8gSXQncyBhbiBvYmplY3QsIGJ1dCBub3QgYW4gYXJyYXkgb3IgcmVnZXhwLlxuICBpZiAoaGFzT3BlcmF0b3JzKHZhbHVlU2VsZWN0b3IpKSB7XG4gICAgdmFyIG9wZXJhdG9yRnVuY3Rpb25zID0gW107XG4gICAgXy5lYWNoKHZhbHVlU2VsZWN0b3IsIGZ1bmN0aW9uIChvcGVyYW5kLCBvcGVyYXRvcikge1xuICAgICAgaWYgKCFfLmhhcyhWQUxVRV9PUEVSQVRPUlMsIG9wZXJhdG9yKSlcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5yZWNvZ25pemVkIG9wZXJhdG9yOiBcIiArIG9wZXJhdG9yKTtcbiAgICAgIG9wZXJhdG9yRnVuY3Rpb25zLnB1c2goVkFMVUVfT1BFUkFUT1JTW29wZXJhdG9yXShcbiAgICAgICAgb3BlcmFuZCwgdmFsdWVTZWxlY3Rvci4kb3B0aW9ucykpO1xuICAgIH0pO1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJldHVybiBfLmFsbChvcGVyYXRvckZ1bmN0aW9ucywgZnVuY3Rpb24gKGYpIHtcbiAgICAgICAgcmV0dXJuIGYodmFsdWUpO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfVxuXG4gIC8vIEl0J3MgYSBsaXRlcmFsOyBjb21wYXJlIHZhbHVlIChvciBlbGVtZW50IG9mIHZhbHVlIGFycmF5KSBkaXJlY3RseSB0byB0aGVcbiAgLy8gc2VsZWN0b3IuXG4gIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICByZXR1cm4gX2FueUlmQXJyYXkodmFsdWUsIGZ1bmN0aW9uICh4KSB7XG4gICAgICByZXR1cm4gTG9jYWxDb2xsZWN0aW9uLl9mLl9lcXVhbCh2YWx1ZVNlbGVjdG9yLCB4KTtcbiAgICB9KTtcbiAgfTtcbn07XG5cbi8vIFhYWCBjYW4gZmFjdG9yIG91dCBjb21tb24gbG9naWMgYmVsb3dcbnZhciBMT0dJQ0FMX09QRVJBVE9SUyA9IHtcbiAgXCIkYW5kXCI6IGZ1bmN0aW9uKHN1YlNlbGVjdG9yKSB7XG4gICAgaWYgKCFpc0FycmF5KHN1YlNlbGVjdG9yKSB8fCBfLmlzRW1wdHkoc3ViU2VsZWN0b3IpKVxuICAgICAgdGhyb3cgRXJyb3IoXCIkYW5kLyRvci8kbm9yIG11c3QgYmUgbm9uZW1wdHkgYXJyYXlcIik7XG4gICAgdmFyIHN1YlNlbGVjdG9yRnVuY3Rpb25zID0gXy5tYXAoXG4gICAgICBzdWJTZWxlY3RvciwgY29tcGlsZURvY3VtZW50U2VsZWN0b3IpO1xuICAgIHJldHVybiBmdW5jdGlvbiAoZG9jKSB7XG4gICAgICByZXR1cm4gXy5hbGwoc3ViU2VsZWN0b3JGdW5jdGlvbnMsIGZ1bmN0aW9uIChmKSB7XG4gICAgICAgIHJldHVybiBmKGRvYyk7XG4gICAgICB9KTtcbiAgICB9O1xuICB9LFxuXG4gIFwiJG9yXCI6IGZ1bmN0aW9uKHN1YlNlbGVjdG9yKSB7XG4gICAgaWYgKCFpc0FycmF5KHN1YlNlbGVjdG9yKSB8fCBfLmlzRW1wdHkoc3ViU2VsZWN0b3IpKVxuICAgICAgdGhyb3cgRXJyb3IoXCIkYW5kLyRvci8kbm9yIG11c3QgYmUgbm9uZW1wdHkgYXJyYXlcIik7XG4gICAgdmFyIHN1YlNlbGVjdG9yRnVuY3Rpb25zID0gXy5tYXAoXG4gICAgICBzdWJTZWxlY3RvciwgY29tcGlsZURvY3VtZW50U2VsZWN0b3IpO1xuICAgIHJldHVybiBmdW5jdGlvbiAoZG9jKSB7XG4gICAgICByZXR1cm4gXy5hbnkoc3ViU2VsZWN0b3JGdW5jdGlvbnMsIGZ1bmN0aW9uIChmKSB7XG4gICAgICAgIHJldHVybiBmKGRvYyk7XG4gICAgICB9KTtcbiAgICB9O1xuICB9LFxuXG4gIFwiJG5vclwiOiBmdW5jdGlvbihzdWJTZWxlY3Rvcikge1xuICAgIGlmICghaXNBcnJheShzdWJTZWxlY3RvcikgfHwgXy5pc0VtcHR5KHN1YlNlbGVjdG9yKSlcbiAgICAgIHRocm93IEVycm9yKFwiJGFuZC8kb3IvJG5vciBtdXN0IGJlIG5vbmVtcHR5IGFycmF5XCIpO1xuICAgIHZhciBzdWJTZWxlY3RvckZ1bmN0aW9ucyA9IF8ubWFwKFxuICAgICAgc3ViU2VsZWN0b3IsIGNvbXBpbGVEb2N1bWVudFNlbGVjdG9yKTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGRvYykge1xuICAgICAgcmV0dXJuIF8uYWxsKHN1YlNlbGVjdG9yRnVuY3Rpb25zLCBmdW5jdGlvbiAoZikge1xuICAgICAgICByZXR1cm4gIWYoZG9jKTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0sXG5cbiAgXCIkd2hlcmVcIjogZnVuY3Rpb24oc2VsZWN0b3JWYWx1ZSkge1xuICAgIGlmICghKHNlbGVjdG9yVmFsdWUgaW5zdGFuY2VvZiBGdW5jdGlvbikpIHtcbiAgICAgIHNlbGVjdG9yVmFsdWUgPSBGdW5jdGlvbihcInJldHVybiBcIiArIHNlbGVjdG9yVmFsdWUpO1xuICAgIH1cbiAgICByZXR1cm4gZnVuY3Rpb24gKGRvYykge1xuICAgICAgcmV0dXJuIHNlbGVjdG9yVmFsdWUuY2FsbChkb2MpO1xuICAgIH07XG4gIH1cbn07XG5cbnZhciBWQUxVRV9PUEVSQVRPUlMgPSB7XG4gIFwiJGluXCI6IGZ1bmN0aW9uIChvcGVyYW5kKSB7XG4gICAgaWYgKCFpc0FycmF5KG9wZXJhbmQpKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQXJndW1lbnQgdG8gJGluIG11c3QgYmUgYXJyYXlcIik7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgcmV0dXJuIF9hbnlJZkFycmF5UGx1cyh2YWx1ZSwgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIF8uYW55KG9wZXJhbmQsIGZ1bmN0aW9uIChvcGVyYW5kRWx0KSB7XG4gICAgICAgICAgcmV0dXJuIExvY2FsQ29sbGVjdGlvbi5fZi5fZXF1YWwob3BlcmFuZEVsdCwgeCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSxcblxuICBcIiRhbGxcIjogZnVuY3Rpb24gKG9wZXJhbmQpIHtcbiAgICBpZiAoIWlzQXJyYXkob3BlcmFuZCkpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJBcmd1bWVudCB0byAkYWxsIG11c3QgYmUgYXJyYXlcIik7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgaWYgKCFpc0FycmF5KHZhbHVlKSlcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgcmV0dXJuIF8uYWxsKG9wZXJhbmQsIGZ1bmN0aW9uIChvcGVyYW5kRWx0KSB7XG4gICAgICAgIHJldHVybiBfLmFueSh2YWx1ZSwgZnVuY3Rpb24gKHZhbHVlRWx0KSB7XG4gICAgICAgICAgcmV0dXJuIExvY2FsQ29sbGVjdGlvbi5fZi5fZXF1YWwob3BlcmFuZEVsdCwgdmFsdWVFbHQpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0sXG5cbiAgXCIkbHRcIjogZnVuY3Rpb24gKG9wZXJhbmQpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICByZXR1cm4gX2FueUlmQXJyYXkodmFsdWUsIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiBMb2NhbENvbGxlY3Rpb24uX2YuX2NtcCh4LCBvcGVyYW5kKSA8IDA7XG4gICAgICB9KTtcbiAgICB9O1xuICB9LFxuXG4gIFwiJGx0ZVwiOiBmdW5jdGlvbiAob3BlcmFuZCkge1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJldHVybiBfYW55SWZBcnJheSh2YWx1ZSwgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIExvY2FsQ29sbGVjdGlvbi5fZi5fY21wKHgsIG9wZXJhbmQpIDw9IDA7XG4gICAgICB9KTtcbiAgICB9O1xuICB9LFxuXG4gIFwiJGd0XCI6IGZ1bmN0aW9uIChvcGVyYW5kKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgcmV0dXJuIF9hbnlJZkFycmF5KHZhbHVlLCBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4gTG9jYWxDb2xsZWN0aW9uLl9mLl9jbXAoeCwgb3BlcmFuZCkgPiAwO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSxcblxuICBcIiRndGVcIjogZnVuY3Rpb24gKG9wZXJhbmQpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICByZXR1cm4gX2FueUlmQXJyYXkodmFsdWUsIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiBMb2NhbENvbGxlY3Rpb24uX2YuX2NtcCh4LCBvcGVyYW5kKSA+PSAwO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSxcblxuICBcIiRuZVwiOiBmdW5jdGlvbiAob3BlcmFuZCkge1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJldHVybiAhIF9hbnlJZkFycmF5UGx1cyh2YWx1ZSwgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIExvY2FsQ29sbGVjdGlvbi5fZi5fZXF1YWwoeCwgb3BlcmFuZCk7XG4gICAgICB9KTtcbiAgICB9O1xuICB9LFxuXG4gIFwiJG5pblwiOiBmdW5jdGlvbiAob3BlcmFuZCkge1xuICAgIGlmICghaXNBcnJheShvcGVyYW5kKSlcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkFyZ3VtZW50IHRvICRuaW4gbXVzdCBiZSBhcnJheVwiKTtcbiAgICB2YXIgaW5GdW5jdGlvbiA9IFZBTFVFX09QRVJBVE9SUy4kaW4ob3BlcmFuZCk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgLy8gRmllbGQgZG9lc24ndCBleGlzdCwgc28gaXQncyBub3QtaW4gb3BlcmFuZFxuICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgcmV0dXJuICFpbkZ1bmN0aW9uKHZhbHVlKTtcbiAgICB9O1xuICB9LFxuXG4gIFwiJGV4aXN0c1wiOiBmdW5jdGlvbiAob3BlcmFuZCkge1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJldHVybiBvcGVyYW5kID09PSAodmFsdWUgIT09IHVuZGVmaW5lZCk7XG4gICAgfTtcbiAgfSxcblxuICBcIiRtb2RcIjogZnVuY3Rpb24gKG9wZXJhbmQpIHtcbiAgICB2YXIgZGl2aXNvciA9IG9wZXJhbmRbMF0sXG4gICAgICAgIHJlbWFpbmRlciA9IG9wZXJhbmRbMV07XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgcmV0dXJuIF9hbnlJZkFycmF5KHZhbHVlLCBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4geCAlIGRpdmlzb3IgPT09IHJlbWFpbmRlcjtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0sXG5cbiAgXCIkc2l6ZVwiOiBmdW5jdGlvbiAob3BlcmFuZCkge1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJldHVybiBpc0FycmF5KHZhbHVlKSAmJiBvcGVyYW5kID09PSB2YWx1ZS5sZW5ndGg7XG4gICAgfTtcbiAgfSxcblxuICBcIiR0eXBlXCI6IGZ1bmN0aW9uIChvcGVyYW5kKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgLy8gQSBub25leGlzdGVudCBmaWVsZCBpcyBvZiBubyB0eXBlLlxuICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIC8vIERlZmluaXRlbHkgbm90IF9hbnlJZkFycmF5UGx1czogJHR5cGU6IDQgb25seSBtYXRjaGVzIGFycmF5cyB0aGF0IGhhdmVcbiAgICAgIC8vIGFycmF5cyBhcyBlbGVtZW50cyBhY2NvcmRpbmcgdG8gdGhlIE1vbmdvIGRvY3MuXG4gICAgICByZXR1cm4gX2FueUlmQXJyYXkodmFsdWUsIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiBMb2NhbENvbGxlY3Rpb24uX2YuX3R5cGUoeCkgPT09IG9wZXJhbmQ7XG4gICAgICB9KTtcbiAgICB9O1xuICB9LFxuXG4gIFwiJHJlZ2V4XCI6IGZ1bmN0aW9uIChvcGVyYW5kLCBvcHRpb25zKSB7XG4gICAgaWYgKG9wdGlvbnMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgLy8gT3B0aW9ucyBwYXNzZWQgaW4gJG9wdGlvbnMgKGV2ZW4gdGhlIGVtcHR5IHN0cmluZykgYWx3YXlzIG92ZXJyaWRlc1xuICAgICAgLy8gb3B0aW9ucyBpbiB0aGUgUmVnRXhwIG9iamVjdCBpdHNlbGYuXG5cbiAgICAgIC8vIEJlIGNsZWFyIHRoYXQgd2Ugb25seSBzdXBwb3J0IHRoZSBKUy1zdXBwb3J0ZWQgb3B0aW9ucywgbm90IGV4dGVuZGVkXG4gICAgICAvLyBvbmVzIChlZywgTW9uZ28gc3VwcG9ydHMgeCBhbmQgcykuIElkZWFsbHkgd2Ugd291bGQgaW1wbGVtZW50IHggYW5kIHNcbiAgICAgIC8vIGJ5IHRyYW5zZm9ybWluZyB0aGUgcmVnZXhwLCBidXQgbm90IHRvZGF5Li4uXG4gICAgICBpZiAoL1teZ2ltXS8udGVzdChvcHRpb25zKSlcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiT25seSB0aGUgaSwgbSwgYW5kIGcgcmVnZXhwIG9wdGlvbnMgYXJlIHN1cHBvcnRlZFwiKTtcblxuICAgICAgdmFyIHJlZ2V4U291cmNlID0gb3BlcmFuZCBpbnN0YW5jZW9mIFJlZ0V4cCA/IG9wZXJhbmQuc291cmNlIDogb3BlcmFuZDtcbiAgICAgIG9wZXJhbmQgPSBuZXcgUmVnRXhwKHJlZ2V4U291cmNlLCBvcHRpb25zKTtcbiAgICB9IGVsc2UgaWYgKCEob3BlcmFuZCBpbnN0YW5jZW9mIFJlZ0V4cCkpIHtcbiAgICAgIG9wZXJhbmQgPSBuZXcgUmVnRXhwKG9wZXJhbmQpO1xuICAgIH1cblxuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICByZXR1cm4gX2FueUlmQXJyYXkodmFsdWUsIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiBvcGVyYW5kLnRlc3QoeCk7XG4gICAgICB9KTtcbiAgICB9O1xuICB9LFxuXG4gIFwiJG9wdGlvbnNcIjogZnVuY3Rpb24gKG9wZXJhbmQpIHtcbiAgICAvLyBldmFsdWF0aW9uIGhhcHBlbnMgYXQgdGhlICRyZWdleCBmdW5jdGlvbiBhYm92ZVxuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHsgcmV0dXJuIHRydWU7IH07XG4gIH0sXG5cbiAgXCIkZWxlbU1hdGNoXCI6IGZ1bmN0aW9uIChvcGVyYW5kKSB7XG4gICAgdmFyIG1hdGNoZXIgPSBjb21waWxlRG9jdW1lbnRTZWxlY3RvcihvcGVyYW5kKTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICBpZiAoIWlzQXJyYXkodmFsdWUpKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICByZXR1cm4gXy5hbnkodmFsdWUsIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiBtYXRjaGVyKHgpO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSxcblxuICBcIiRub3RcIjogZnVuY3Rpb24gKG9wZXJhbmQpIHtcbiAgICB2YXIgbWF0Y2hlciA9IGNvbXBpbGVWYWx1ZVNlbGVjdG9yKG9wZXJhbmQpO1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJldHVybiAhbWF0Y2hlcih2YWx1ZSk7XG4gICAgfTtcbiAgfSxcblxuICBcIiRuZWFyXCI6IGZ1bmN0aW9uIChvcGVyYW5kKSB7XG4gICAgLy8gQWx3YXlzIHJldHVybnMgdHJ1ZS4gTXVzdCBiZSBoYW5kbGVkIGluIHBvc3QtZmlsdGVyL3NvcnQvbGltaXRcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH0sXG5cbiAgXCIkZ2VvSW50ZXJzZWN0c1wiOiBmdW5jdGlvbiAob3BlcmFuZCkge1xuICAgIC8vIEFsd2F5cyByZXR1cm5zIHRydWUuIE11c3QgYmUgaGFuZGxlZCBpbiBwb3N0LWZpbHRlci9zb3J0L2xpbWl0XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG5cbn07XG5cbi8vIGhlbHBlcnMgdXNlZCBieSBjb21waWxlZCBzZWxlY3RvciBjb2RlXG5Mb2NhbENvbGxlY3Rpb24uX2YgPSB7XG4gIC8vIFhYWCBmb3IgX2FsbCBhbmQgX2luLCBjb25zaWRlciBidWlsZGluZyAnaW5xdWVyeScgYXQgY29tcGlsZSB0aW1lLi5cblxuICBfdHlwZTogZnVuY3Rpb24gKHYpIHtcbiAgICBpZiAodHlwZW9mIHYgPT09IFwibnVtYmVyXCIpXG4gICAgICByZXR1cm4gMTtcbiAgICBpZiAodHlwZW9mIHYgPT09IFwic3RyaW5nXCIpXG4gICAgICByZXR1cm4gMjtcbiAgICBpZiAodHlwZW9mIHYgPT09IFwiYm9vbGVhblwiKVxuICAgICAgcmV0dXJuIDg7XG4gICAgaWYgKGlzQXJyYXkodikpXG4gICAgICByZXR1cm4gNDtcbiAgICBpZiAodiA9PT0gbnVsbClcbiAgICAgIHJldHVybiAxMDtcbiAgICBpZiAodiBpbnN0YW5jZW9mIFJlZ0V4cClcbiAgICAgIHJldHVybiAxMTtcbiAgICBpZiAodHlwZW9mIHYgPT09IFwiZnVuY3Rpb25cIilcbiAgICAgIC8vIG5vdGUgdGhhdCB0eXBlb2YoL3gvKSA9PT0gXCJmdW5jdGlvblwiXG4gICAgICByZXR1cm4gMTM7XG4gICAgaWYgKHYgaW5zdGFuY2VvZiBEYXRlKVxuICAgICAgcmV0dXJuIDk7XG4gICAgaWYgKEVKU09OLmlzQmluYXJ5KHYpKVxuICAgICAgcmV0dXJuIDU7XG4gICAgaWYgKHYgaW5zdGFuY2VvZiBNZXRlb3IuQ29sbGVjdGlvbi5PYmplY3RJRClcbiAgICAgIHJldHVybiA3O1xuICAgIHJldHVybiAzOyAvLyBvYmplY3RcblxuICAgIC8vIFhYWCBzdXBwb3J0IHNvbWUvYWxsIG9mIHRoZXNlOlxuICAgIC8vIDE0LCBzeW1ib2xcbiAgICAvLyAxNSwgamF2YXNjcmlwdCBjb2RlIHdpdGggc2NvcGVcbiAgICAvLyAxNiwgMTg6IDMyLWJpdC82NC1iaXQgaW50ZWdlclxuICAgIC8vIDE3LCB0aW1lc3RhbXBcbiAgICAvLyAyNTUsIG1pbmtleVxuICAgIC8vIDEyNywgbWF4a2V5XG4gIH0sXG5cbiAgLy8gZGVlcCBlcXVhbGl0eSB0ZXN0OiB1c2UgZm9yIGxpdGVyYWwgZG9jdW1lbnQgYW5kIGFycmF5IG1hdGNoZXNcbiAgX2VxdWFsOiBmdW5jdGlvbiAoYSwgYikge1xuICAgIHJldHVybiBFSlNPTi5lcXVhbHMoYSwgYiwge2tleU9yZGVyU2Vuc2l0aXZlOiB0cnVlfSk7XG4gIH0sXG5cbiAgLy8gbWFwcyBhIHR5cGUgY29kZSB0byBhIHZhbHVlIHRoYXQgY2FuIGJlIHVzZWQgdG8gc29ydCB2YWx1ZXMgb2ZcbiAgLy8gZGlmZmVyZW50IHR5cGVzXG4gIF90eXBlb3JkZXI6IGZ1bmN0aW9uICh0KSB7XG4gICAgLy8gaHR0cDovL3d3dy5tb25nb2RiLm9yZy9kaXNwbGF5L0RPQ1MvV2hhdCtpcyt0aGUrQ29tcGFyZStPcmRlcitmb3IrQlNPTitUeXBlc1xuICAgIC8vIFhYWCB3aGF0IGlzIHRoZSBjb3JyZWN0IHNvcnQgcG9zaXRpb24gZm9yIEphdmFzY3JpcHQgY29kZT9cbiAgICAvLyAoJzEwMCcgaW4gdGhlIG1hdHJpeCBiZWxvdylcbiAgICAvLyBYWFggbWlua2V5L21heGtleVxuICAgIHJldHVybiBbLTEsICAvLyAobm90IGEgdHlwZSlcbiAgICAgICAgICAgIDEsICAgLy8gbnVtYmVyXG4gICAgICAgICAgICAyLCAgIC8vIHN0cmluZ1xuICAgICAgICAgICAgMywgICAvLyBvYmplY3RcbiAgICAgICAgICAgIDQsICAgLy8gYXJyYXlcbiAgICAgICAgICAgIDUsICAgLy8gYmluYXJ5XG4gICAgICAgICAgICAtMSwgIC8vIGRlcHJlY2F0ZWRcbiAgICAgICAgICAgIDYsICAgLy8gT2JqZWN0SURcbiAgICAgICAgICAgIDcsICAgLy8gYm9vbFxuICAgICAgICAgICAgOCwgICAvLyBEYXRlXG4gICAgICAgICAgICAwLCAgIC8vIG51bGxcbiAgICAgICAgICAgIDksICAgLy8gUmVnRXhwXG4gICAgICAgICAgICAtMSwgIC8vIGRlcHJlY2F0ZWRcbiAgICAgICAgICAgIDEwMCwgLy8gSlMgY29kZVxuICAgICAgICAgICAgMiwgICAvLyBkZXByZWNhdGVkIChzeW1ib2wpXG4gICAgICAgICAgICAxMDAsIC8vIEpTIGNvZGVcbiAgICAgICAgICAgIDEsICAgLy8gMzItYml0IGludFxuICAgICAgICAgICAgOCwgICAvLyBNb25nbyB0aW1lc3RhbXBcbiAgICAgICAgICAgIDEgICAgLy8gNjQtYml0IGludFxuICAgICAgICAgICBdW3RdO1xuICB9LFxuXG4gIC8vIGNvbXBhcmUgdHdvIHZhbHVlcyBvZiB1bmtub3duIHR5cGUgYWNjb3JkaW5nIHRvIEJTT04gb3JkZXJpbmdcbiAgLy8gc2VtYW50aWNzLiAoYXMgYW4gZXh0ZW5zaW9uLCBjb25zaWRlciAndW5kZWZpbmVkJyB0byBiZSBsZXNzIHRoYW5cbiAgLy8gYW55IG90aGVyIHZhbHVlLikgcmV0dXJuIG5lZ2F0aXZlIGlmIGEgaXMgbGVzcywgcG9zaXRpdmUgaWYgYiBpc1xuICAvLyBsZXNzLCBvciAwIGlmIGVxdWFsXG4gIF9jbXA6IGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgaWYgKGEgPT09IHVuZGVmaW5lZClcbiAgICAgIHJldHVybiBiID09PSB1bmRlZmluZWQgPyAwIDogLTE7XG4gICAgaWYgKGIgPT09IHVuZGVmaW5lZClcbiAgICAgIHJldHVybiAxO1xuICAgIHZhciB0YSA9IExvY2FsQ29sbGVjdGlvbi5fZi5fdHlwZShhKTtcbiAgICB2YXIgdGIgPSBMb2NhbENvbGxlY3Rpb24uX2YuX3R5cGUoYik7XG4gICAgdmFyIG9hID0gTG9jYWxDb2xsZWN0aW9uLl9mLl90eXBlb3JkZXIodGEpO1xuICAgIHZhciBvYiA9IExvY2FsQ29sbGVjdGlvbi5fZi5fdHlwZW9yZGVyKHRiKTtcbiAgICBpZiAob2EgIT09IG9iKVxuICAgICAgcmV0dXJuIG9hIDwgb2IgPyAtMSA6IDE7XG4gICAgaWYgKHRhICE9PSB0YilcbiAgICAgIC8vIFhYWCBuZWVkIHRvIGltcGxlbWVudCB0aGlzIGlmIHdlIGltcGxlbWVudCBTeW1ib2wgb3IgaW50ZWdlcnMsIG9yXG4gICAgICAvLyBUaW1lc3RhbXBcbiAgICAgIHRocm93IEVycm9yKFwiTWlzc2luZyB0eXBlIGNvZXJjaW9uIGxvZ2ljIGluIF9jbXBcIik7XG4gICAgaWYgKHRhID09PSA3KSB7IC8vIE9iamVjdElEXG4gICAgICAvLyBDb252ZXJ0IHRvIHN0cmluZy5cbiAgICAgIHRhID0gdGIgPSAyO1xuICAgICAgYSA9IGEudG9IZXhTdHJpbmcoKTtcbiAgICAgIGIgPSBiLnRvSGV4U3RyaW5nKCk7XG4gICAgfVxuICAgIGlmICh0YSA9PT0gOSkgeyAvLyBEYXRlXG4gICAgICAvLyBDb252ZXJ0IHRvIG1pbGxpcy5cbiAgICAgIHRhID0gdGIgPSAxO1xuICAgICAgYSA9IGEuZ2V0VGltZSgpO1xuICAgICAgYiA9IGIuZ2V0VGltZSgpO1xuICAgIH1cblxuICAgIGlmICh0YSA9PT0gMSkgLy8gZG91YmxlXG4gICAgICByZXR1cm4gYSAtIGI7XG4gICAgaWYgKHRiID09PSAyKSAvLyBzdHJpbmdcbiAgICAgIHJldHVybiBhIDwgYiA/IC0xIDogKGEgPT09IGIgPyAwIDogMSk7XG4gICAgaWYgKHRhID09PSAzKSB7IC8vIE9iamVjdFxuICAgICAgLy8gdGhpcyBjb3VsZCBiZSBtdWNoIG1vcmUgZWZmaWNpZW50IGluIHRoZSBleHBlY3RlZCBjYXNlIC4uLlxuICAgICAgdmFyIHRvX2FycmF5ID0gZnVuY3Rpb24gKG9iaikge1xuICAgICAgICB2YXIgcmV0ID0gW107XG4gICAgICAgIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICAgICAgICByZXQucHVzaChrZXkpO1xuICAgICAgICAgIHJldC5wdXNoKG9ialtrZXldKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgfTtcbiAgICAgIHJldHVybiBMb2NhbENvbGxlY3Rpb24uX2YuX2NtcCh0b19hcnJheShhKSwgdG9fYXJyYXkoYikpO1xuICAgIH1cbiAgICBpZiAodGEgPT09IDQpIHsgLy8gQXJyYXlcbiAgICAgIGZvciAodmFyIGkgPSAwOyA7IGkrKykge1xuICAgICAgICBpZiAoaSA9PT0gYS5sZW5ndGgpXG4gICAgICAgICAgcmV0dXJuIChpID09PSBiLmxlbmd0aCkgPyAwIDogLTE7XG4gICAgICAgIGlmIChpID09PSBiLmxlbmd0aClcbiAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgdmFyIHMgPSBMb2NhbENvbGxlY3Rpb24uX2YuX2NtcChhW2ldLCBiW2ldKTtcbiAgICAgICAgaWYgKHMgIT09IDApXG4gICAgICAgICAgcmV0dXJuIHM7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICh0YSA9PT0gNSkgeyAvLyBiaW5hcnlcbiAgICAgIC8vIFN1cnByaXNpbmdseSwgYSBzbWFsbCBiaW5hcnkgYmxvYiBpcyBhbHdheXMgbGVzcyB0aGFuIGEgbGFyZ2Ugb25lIGluXG4gICAgICAvLyBNb25nby5cbiAgICAgIGlmIChhLmxlbmd0aCAhPT0gYi5sZW5ndGgpXG4gICAgICAgIHJldHVybiBhLmxlbmd0aCAtIGIubGVuZ3RoO1xuICAgICAgZm9yIChpID0gMDsgaSA8IGEubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGFbaV0gPCBiW2ldKVxuICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgaWYgKGFbaV0gPiBiW2ldKVxuICAgICAgICAgIHJldHVybiAxO1xuICAgICAgfVxuICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICAgIGlmICh0YSA9PT0gOCkgeyAvLyBib29sZWFuXG4gICAgICBpZiAoYSkgcmV0dXJuIGIgPyAwIDogMTtcbiAgICAgIHJldHVybiBiID8gLTEgOiAwO1xuICAgIH1cbiAgICBpZiAodGEgPT09IDEwKSAvLyBudWxsXG4gICAgICByZXR1cm4gMDtcbiAgICBpZiAodGEgPT09IDExKSAvLyByZWdleHBcbiAgICAgIHRocm93IEVycm9yKFwiU29ydGluZyBub3Qgc3VwcG9ydGVkIG9uIHJlZ3VsYXIgZXhwcmVzc2lvblwiKTsgLy8gWFhYXG4gICAgLy8gMTM6IGphdmFzY3JpcHQgY29kZVxuICAgIC8vIDE0OiBzeW1ib2xcbiAgICAvLyAxNTogamF2YXNjcmlwdCBjb2RlIHdpdGggc2NvcGVcbiAgICAvLyAxNjogMzItYml0IGludGVnZXJcbiAgICAvLyAxNzogdGltZXN0YW1wXG4gICAgLy8gMTg6IDY0LWJpdCBpbnRlZ2VyXG4gICAgLy8gMjU1OiBtaW5rZXlcbiAgICAvLyAxMjc6IG1heGtleVxuICAgIGlmICh0YSA9PT0gMTMpIC8vIGphdmFzY3JpcHQgY29kZVxuICAgICAgdGhyb3cgRXJyb3IoXCJTb3J0aW5nIG5vdCBzdXBwb3J0ZWQgb24gSmF2YXNjcmlwdCBjb2RlXCIpOyAvLyBYWFhcbiAgICB0aHJvdyBFcnJvcihcIlVua25vd24gdHlwZSB0byBzb3J0XCIpO1xuICB9XG59O1xuXG4vLyBGb3IgdW5pdCB0ZXN0cy4gVHJ1ZSBpZiB0aGUgZ2l2ZW4gZG9jdW1lbnQgbWF0Y2hlcyB0aGUgZ2l2ZW5cbi8vIHNlbGVjdG9yLlxuTG9jYWxDb2xsZWN0aW9uLl9tYXRjaGVzID0gZnVuY3Rpb24gKHNlbGVjdG9yLCBkb2MpIHtcbiAgcmV0dXJuIChMb2NhbENvbGxlY3Rpb24uX2NvbXBpbGVTZWxlY3RvcihzZWxlY3RvcikpKGRvYyk7XG59O1xuXG4vLyBfbWFrZUxvb2t1cEZ1bmN0aW9uKGtleSkgcmV0dXJucyBhIGxvb2t1cCBmdW5jdGlvbi5cbi8vXG4vLyBBIGxvb2t1cCBmdW5jdGlvbiB0YWtlcyBpbiBhIGRvY3VtZW50IGFuZCByZXR1cm5zIGFuIGFycmF5IG9mIG1hdGNoaW5nXG4vLyB2YWx1ZXMuICBUaGlzIGFycmF5IGhhcyBtb3JlIHRoYW4gb25lIGVsZW1lbnQgaWYgYW55IHNlZ21lbnQgb2YgdGhlIGtleSBvdGhlclxuLy8gdGhhbiB0aGUgbGFzdCBvbmUgaXMgYW4gYXJyYXkuICBpZSwgYW55IGFycmF5cyBmb3VuZCB3aGVuIGRvaW5nIG5vbi1maW5hbFxuLy8gbG9va3VwcyByZXN1bHQgaW4gdGhpcyBmdW5jdGlvbiBcImJyYW5jaGluZ1wiOyBlYWNoIGVsZW1lbnQgaW4gdGhlIHJldHVybmVkXG4vLyBhcnJheSByZXByZXNlbnRzIHRoZSB2YWx1ZSBmb3VuZCBhdCB0aGlzIGJyYW5jaC4gSWYgYW55IGJyYW5jaCBkb2Vzbid0IGhhdmUgYVxuLy8gZmluYWwgdmFsdWUgZm9yIHRoZSBmdWxsIGtleSwgaXRzIGVsZW1lbnQgaW4gdGhlIHJldHVybmVkIGxpc3Qgd2lsbCBiZVxuLy8gdW5kZWZpbmVkLiBJdCBhbHdheXMgcmV0dXJucyBhIG5vbi1lbXB0eSBhcnJheS5cbi8vXG4vLyBfbWFrZUxvb2t1cEZ1bmN0aW9uKCdhLngnKSh7YToge3g6IDF9fSkgcmV0dXJucyBbMV1cbi8vIF9tYWtlTG9va3VwRnVuY3Rpb24oJ2EueCcpKHthOiB7eDogWzFdfX0pIHJldHVybnMgW1sxXV1cbi8vIF9tYWtlTG9va3VwRnVuY3Rpb24oJ2EueCcpKHthOiA1fSkgIHJldHVybnMgW3VuZGVmaW5lZF1cbi8vIF9tYWtlTG9va3VwRnVuY3Rpb24oJ2EueCcpKHthOiBbe3g6IDF9LFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7eDogWzJdfSxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3k6IDN9XX0pXG4vLyAgIHJldHVybnMgWzEsIFsyXSwgdW5kZWZpbmVkXVxuTG9jYWxDb2xsZWN0aW9uLl9tYWtlTG9va3VwRnVuY3Rpb24gPSBmdW5jdGlvbiAoa2V5KSB7XG4gIHZhciBkb3RMb2NhdGlvbiA9IGtleS5pbmRleE9mKCcuJyk7XG4gIHZhciBmaXJzdCwgbG9va3VwUmVzdCwgbmV4dElzTnVtZXJpYztcbiAgaWYgKGRvdExvY2F0aW9uID09PSAtMSkge1xuICAgIGZpcnN0ID0ga2V5O1xuICB9IGVsc2Uge1xuICAgIGZpcnN0ID0ga2V5LnN1YnN0cigwLCBkb3RMb2NhdGlvbik7XG4gICAgdmFyIHJlc3QgPSBrZXkuc3Vic3RyKGRvdExvY2F0aW9uICsgMSk7XG4gICAgbG9va3VwUmVzdCA9IExvY2FsQ29sbGVjdGlvbi5fbWFrZUxvb2t1cEZ1bmN0aW9uKHJlc3QpO1xuICAgIC8vIElzIHRoZSBuZXh0IChwZXJoYXBzIGZpbmFsKSBwaWVjZSBudW1lcmljIChpZSwgYW4gYXJyYXkgbG9va3VwPylcbiAgICBuZXh0SXNOdW1lcmljID0gL15cXGQrKFxcLnwkKS8udGVzdChyZXN0KTtcbiAgfVxuXG4gIHJldHVybiBmdW5jdGlvbiAoZG9jKSB7XG4gICAgaWYgKGRvYyA9PSBudWxsKSAgLy8gbnVsbCBvciB1bmRlZmluZWRcbiAgICAgIHJldHVybiBbdW5kZWZpbmVkXTtcbiAgICB2YXIgZmlyc3RMZXZlbCA9IGRvY1tmaXJzdF07XG5cbiAgICAvLyBXZSBkb24ndCBcImJyYW5jaFwiIGF0IHRoZSBmaW5hbCBsZXZlbC5cbiAgICBpZiAoIWxvb2t1cFJlc3QpXG4gICAgICByZXR1cm4gW2ZpcnN0TGV2ZWxdO1xuXG4gICAgLy8gSXQncyBhbiBlbXB0eSBhcnJheSwgYW5kIHdlJ3JlIG5vdCBkb25lOiB3ZSB3b24ndCBmaW5kIGFueXRoaW5nLlxuICAgIGlmIChpc0FycmF5KGZpcnN0TGV2ZWwpICYmIGZpcnN0TGV2ZWwubGVuZ3RoID09PSAwKVxuICAgICAgcmV0dXJuIFt1bmRlZmluZWRdO1xuXG4gICAgLy8gRm9yIGVhY2ggcmVzdWx0IGF0IHRoaXMgbGV2ZWwsIGZpbmlzaCB0aGUgbG9va3VwIG9uIHRoZSByZXN0IG9mIHRoZSBrZXksXG4gICAgLy8gYW5kIHJldHVybiBldmVyeXRoaW5nIHdlIGZpbmQuIEFsc28sIGlmIHRoZSBuZXh0IHJlc3VsdCBpcyBhIG51bWJlcixcbiAgICAvLyBkb24ndCBicmFuY2ggaGVyZS5cbiAgICAvL1xuICAgIC8vIFRlY2huaWNhbGx5LCBpbiBNb25nb0RCLCB3ZSBzaG91bGQgYmUgYWJsZSB0byBoYW5kbGUgdGhlIGNhc2Ugd2hlcmVcbiAgICAvLyBvYmplY3RzIGhhdmUgbnVtZXJpYyBrZXlzLCBidXQgTW9uZ28gZG9lc24ndCBhY3R1YWxseSBoYW5kbGUgdGhpc1xuICAgIC8vIGNvbnNpc3RlbnRseSB5ZXQgaXRzZWxmLCBzZWUgZWdcbiAgICAvLyBodHRwczovL2ppcmEubW9uZ29kYi5vcmcvYnJvd3NlL1NFUlZFUi0yODk4XG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL21vbmdvZGIvbW9uZ28vYmxvYi9tYXN0ZXIvanN0ZXN0cy9hcnJheV9tYXRjaDIuanNcbiAgICBpZiAoIWlzQXJyYXkoZmlyc3RMZXZlbCkgfHwgbmV4dElzTnVtZXJpYylcbiAgICAgIGZpcnN0TGV2ZWwgPSBbZmlyc3RMZXZlbF07XG4gICAgcmV0dXJuIEFycmF5LnByb3RvdHlwZS5jb25jYXQuYXBwbHkoW10sIF8ubWFwKGZpcnN0TGV2ZWwsIGxvb2t1cFJlc3QpKTtcbiAgfTtcbn07XG5cbi8vIFRoZSBtYWluIGNvbXBpbGF0aW9uIGZ1bmN0aW9uIGZvciBhIGdpdmVuIHNlbGVjdG9yLlxudmFyIGNvbXBpbGVEb2N1bWVudFNlbGVjdG9yID0gZnVuY3Rpb24gKGRvY1NlbGVjdG9yKSB7XG4gIHZhciBwZXJLZXlTZWxlY3RvcnMgPSBbXTtcbiAgXy5lYWNoKGRvY1NlbGVjdG9yLCBmdW5jdGlvbiAoc3ViU2VsZWN0b3IsIGtleSkge1xuICAgIGlmIChrZXkuc3Vic3RyKDAsIDEpID09PSAnJCcpIHtcbiAgICAgIC8vIE91dGVyIG9wZXJhdG9ycyBhcmUgZWl0aGVyIGxvZ2ljYWwgb3BlcmF0b3JzICh0aGV5IHJlY3Vyc2UgYmFjayBpbnRvXG4gICAgICAvLyB0aGlzIGZ1bmN0aW9uKSwgb3IgJHdoZXJlLlxuICAgICAgaWYgKCFfLmhhcyhMT0dJQ0FMX09QRVJBVE9SUywga2V5KSlcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5yZWNvZ25pemVkIGxvZ2ljYWwgb3BlcmF0b3I6IFwiICsga2V5KTtcbiAgICAgIHBlcktleVNlbGVjdG9ycy5wdXNoKExPR0lDQUxfT1BFUkFUT1JTW2tleV0oc3ViU2VsZWN0b3IpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGxvb2tVcEJ5SW5kZXggPSBMb2NhbENvbGxlY3Rpb24uX21ha2VMb29rdXBGdW5jdGlvbihrZXkpO1xuICAgICAgdmFyIHZhbHVlU2VsZWN0b3JGdW5jID0gY29tcGlsZVZhbHVlU2VsZWN0b3Ioc3ViU2VsZWN0b3IpO1xuICAgICAgcGVyS2V5U2VsZWN0b3JzLnB1c2goZnVuY3Rpb24gKGRvYykge1xuICAgICAgICB2YXIgYnJhbmNoVmFsdWVzID0gbG9va1VwQnlJbmRleChkb2MpO1xuICAgICAgICAvLyBXZSBhcHBseSB0aGUgc2VsZWN0b3IgdG8gZWFjaCBcImJyYW5jaGVkXCIgdmFsdWUgYW5kIHJldHVybiB0cnVlIGlmIGFueVxuICAgICAgICAvLyBtYXRjaC4gVGhpcyBpc24ndCAxMDAlIGNvbnNpc3RlbnQgd2l0aCBNb25nb0RCOyBlZywgc2VlOlxuICAgICAgICAvLyBodHRwczovL2ppcmEubW9uZ29kYi5vcmcvYnJvd3NlL1NFUlZFUi04NTg1XG4gICAgICAgIHJldHVybiBfLmFueShicmFuY2hWYWx1ZXMsIHZhbHVlU2VsZWN0b3JGdW5jKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfSk7XG5cblxuICByZXR1cm4gZnVuY3Rpb24gKGRvYykge1xuICAgIHJldHVybiBfLmFsbChwZXJLZXlTZWxlY3RvcnMsIGZ1bmN0aW9uIChmKSB7XG4gICAgICByZXR1cm4gZihkb2MpO1xuICAgIH0pO1xuICB9O1xufTtcblxuLy8gR2l2ZW4gYSBzZWxlY3RvciwgcmV0dXJuIGEgZnVuY3Rpb24gdGhhdCB0YWtlcyBvbmUgYXJndW1lbnQsIGFcbi8vIGRvY3VtZW50LCBhbmQgcmV0dXJucyB0cnVlIGlmIHRoZSBkb2N1bWVudCBtYXRjaGVzIHRoZSBzZWxlY3Rvcixcbi8vIGVsc2UgZmFsc2UuXG5Mb2NhbENvbGxlY3Rpb24uX2NvbXBpbGVTZWxlY3RvciA9IGZ1bmN0aW9uIChzZWxlY3Rvcikge1xuICAvLyB5b3UgY2FuIHBhc3MgYSBsaXRlcmFsIGZ1bmN0aW9uIGluc3RlYWQgb2YgYSBzZWxlY3RvclxuICBpZiAoc2VsZWN0b3IgaW5zdGFuY2VvZiBGdW5jdGlvbilcbiAgICByZXR1cm4gZnVuY3Rpb24gKGRvYykge3JldHVybiBzZWxlY3Rvci5jYWxsKGRvYyk7fTtcblxuICAvLyBzaG9ydGhhbmQgLS0gc2NhbGFycyBtYXRjaCBfaWRcbiAgaWYgKExvY2FsQ29sbGVjdGlvbi5fc2VsZWN0b3JJc0lkKHNlbGVjdG9yKSkge1xuICAgIHJldHVybiBmdW5jdGlvbiAoZG9jKSB7XG4gICAgICByZXR1cm4gRUpTT04uZXF1YWxzKGRvYy5faWQsIHNlbGVjdG9yKTtcbiAgICB9O1xuICB9XG5cbiAgLy8gcHJvdGVjdCBhZ2FpbnN0IGRhbmdlcm91cyBzZWxlY3RvcnMuICBmYWxzZXkgYW5kIHtfaWQ6IGZhbHNleX0gYXJlIGJvdGhcbiAgLy8gbGlrZWx5IHByb2dyYW1tZXIgZXJyb3IsIGFuZCBub3Qgd2hhdCB5b3Ugd2FudCwgcGFydGljdWxhcmx5IGZvclxuICAvLyBkZXN0cnVjdGl2ZSBvcGVyYXRpb25zLlxuICBpZiAoIXNlbGVjdG9yIHx8ICgoJ19pZCcgaW4gc2VsZWN0b3IpICYmICFzZWxlY3Rvci5faWQpKVxuICAgIHJldHVybiBmdW5jdGlvbiAoZG9jKSB7cmV0dXJuIGZhbHNlO307XG5cbiAgLy8gVG9wIGxldmVsIGNhbid0IGJlIGFuIGFycmF5IG9yIHRydWUgb3IgYmluYXJ5LlxuICBpZiAodHlwZW9mKHNlbGVjdG9yKSA9PT0gJ2Jvb2xlYW4nIHx8IGlzQXJyYXkoc2VsZWN0b3IpIHx8XG4gICAgICBFSlNPTi5pc0JpbmFyeShzZWxlY3RvcikpXG4gICAgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBzZWxlY3RvcjogXCIgKyBzZWxlY3Rvcik7XG5cbiAgcmV0dXJuIGNvbXBpbGVEb2N1bWVudFNlbGVjdG9yKHNlbGVjdG9yKTtcbn07XG5cbi8vIEdpdmUgYSBzb3J0IHNwZWMsIHdoaWNoIGNhbiBiZSBpbiBhbnkgb2YgdGhlc2UgZm9ybXM6XG4vLyAgIHtcImtleTFcIjogMSwgXCJrZXkyXCI6IC0xfVxuLy8gICBbW1wia2V5MVwiLCBcImFzY1wiXSwgW1wia2V5MlwiLCBcImRlc2NcIl1dXG4vLyAgIFtcImtleTFcIiwgW1wia2V5MlwiLCBcImRlc2NcIl1dXG4vL1xuLy8gKC4uIHdpdGggdGhlIGZpcnN0IGZvcm0gYmVpbmcgZGVwZW5kZW50IG9uIHRoZSBrZXkgZW51bWVyYXRpb25cbi8vIGJlaGF2aW9yIG9mIHlvdXIgamF2YXNjcmlwdCBWTSwgd2hpY2ggdXN1YWxseSBkb2VzIHdoYXQgeW91IG1lYW4gaW5cbi8vIHRoaXMgY2FzZSBpZiB0aGUga2V5IG5hbWVzIGRvbid0IGxvb2sgbGlrZSBpbnRlZ2VycyAuLilcbi8vXG4vLyByZXR1cm4gYSBmdW5jdGlvbiB0aGF0IHRha2VzIHR3byBvYmplY3RzLCBhbmQgcmV0dXJucyAtMSBpZiB0aGVcbi8vIGZpcnN0IG9iamVjdCBjb21lcyBmaXJzdCBpbiBvcmRlciwgMSBpZiB0aGUgc2Vjb25kIG9iamVjdCBjb21lc1xuLy8gZmlyc3QsIG9yIDAgaWYgbmVpdGhlciBvYmplY3QgY29tZXMgYmVmb3JlIHRoZSBvdGhlci5cblxuTG9jYWxDb2xsZWN0aW9uLl9jb21waWxlU29ydCA9IGZ1bmN0aW9uIChzcGVjKSB7XG4gIHZhciBzb3J0U3BlY1BhcnRzID0gW107XG5cbiAgaWYgKHNwZWMgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3BlYy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHR5cGVvZiBzcGVjW2ldID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIHNvcnRTcGVjUGFydHMucHVzaCh7XG4gICAgICAgICAgbG9va3VwOiBMb2NhbENvbGxlY3Rpb24uX21ha2VMb29rdXBGdW5jdGlvbihzcGVjW2ldKSxcbiAgICAgICAgICBhc2NlbmRpbmc6IHRydWVcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzb3J0U3BlY1BhcnRzLnB1c2goe1xuICAgICAgICAgIGxvb2t1cDogTG9jYWxDb2xsZWN0aW9uLl9tYWtlTG9va3VwRnVuY3Rpb24oc3BlY1tpXVswXSksXG4gICAgICAgICAgYXNjZW5kaW5nOiBzcGVjW2ldWzFdICE9PSBcImRlc2NcIlxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSBpZiAodHlwZW9mIHNwZWMgPT09IFwib2JqZWN0XCIpIHtcbiAgICBmb3IgKHZhciBrZXkgaW4gc3BlYykge1xuICAgICAgc29ydFNwZWNQYXJ0cy5wdXNoKHtcbiAgICAgICAgbG9va3VwOiBMb2NhbENvbGxlY3Rpb24uX21ha2VMb29rdXBGdW5jdGlvbihrZXkpLFxuICAgICAgICBhc2NlbmRpbmc6IHNwZWNba2V5XSA+PSAwXG4gICAgICB9KTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgRXJyb3IoXCJCYWQgc29ydCBzcGVjaWZpY2F0aW9uOiBcIiwgSlNPTi5zdHJpbmdpZnkoc3BlYykpO1xuICB9XG5cbiAgaWYgKHNvcnRTcGVjUGFydHMubGVuZ3RoID09PSAwKVxuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7cmV0dXJuIDA7fTtcblxuICAvLyByZWR1Y2VWYWx1ZSB0YWtlcyBpbiBhbGwgdGhlIHBvc3NpYmxlIHZhbHVlcyBmb3IgdGhlIHNvcnQga2V5IGFsb25nIHZhcmlvdXNcbiAgLy8gYnJhbmNoZXMsIGFuZCByZXR1cm5zIHRoZSBtaW4gb3IgbWF4IHZhbHVlIChhY2NvcmRpbmcgdG8gdGhlIGJvb2xcbiAgLy8gZmluZE1pbikuIEVhY2ggdmFsdWUgY2FuIGl0c2VsZiBiZSBhbiBhcnJheSwgYW5kIHdlIGxvb2sgYXQgaXRzIHZhbHVlc1xuICAvLyB0b28uIChpZSwgd2UgZG8gYSBzaW5nbGUgbGV2ZWwgb2YgZmxhdHRlbmluZyBvbiBicmFuY2hWYWx1ZXMsIHRoZW4gZmluZCB0aGVcbiAgLy8gbWluL21heC4pXG4gIHZhciByZWR1Y2VWYWx1ZSA9IGZ1bmN0aW9uIChicmFuY2hWYWx1ZXMsIGZpbmRNaW4pIHtcbiAgICB2YXIgcmVkdWNlZDtcbiAgICB2YXIgZmlyc3QgPSB0cnVlO1xuICAgIC8vIEl0ZXJhdGUgb3ZlciBhbGwgdGhlIHZhbHVlcyBmb3VuZCBpbiBhbGwgdGhlIGJyYW5jaGVzLCBhbmQgaWYgYSB2YWx1ZSBpc1xuICAgIC8vIGFuIGFycmF5IGl0c2VsZiwgaXRlcmF0ZSBvdmVyIHRoZSB2YWx1ZXMgaW4gdGhlIGFycmF5IHNlcGFyYXRlbHkuXG4gICAgXy5lYWNoKGJyYW5jaFZhbHVlcywgZnVuY3Rpb24gKGJyYW5jaFZhbHVlKSB7XG4gICAgICAvLyBWYWx1ZSBub3QgYW4gYXJyYXk/IFByZXRlbmQgaXQgaXMuXG4gICAgICBpZiAoIWlzQXJyYXkoYnJhbmNoVmFsdWUpKVxuICAgICAgICBicmFuY2hWYWx1ZSA9IFticmFuY2hWYWx1ZV07XG4gICAgICAvLyBWYWx1ZSBpcyBhbiBlbXB0eSBhcnJheT8gUHJldGVuZCBpdCB3YXMgbWlzc2luZywgc2luY2UgdGhhdCdzIHdoZXJlIGl0XG4gICAgICAvLyBzaG91bGQgYmUgc29ydGVkLlxuICAgICAgaWYgKGlzQXJyYXkoYnJhbmNoVmFsdWUpICYmIGJyYW5jaFZhbHVlLmxlbmd0aCA9PT0gMClcbiAgICAgICAgYnJhbmNoVmFsdWUgPSBbdW5kZWZpbmVkXTtcbiAgICAgIF8uZWFjaChicmFuY2hWYWx1ZSwgZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIC8vIFdlIHNob3VsZCBnZXQgaGVyZSBhdCBsZWFzdCBvbmNlOiBsb29rdXAgZnVuY3Rpb25zIHJldHVybiBub24tZW1wdHlcbiAgICAgICAgLy8gYXJyYXlzLCBzbyB0aGUgb3V0ZXIgbG9vcCBydW5zIGF0IGxlYXN0IG9uY2UsIGFuZCB3ZSBwcmV2ZW50ZWRcbiAgICAgICAgLy8gYnJhbmNoVmFsdWUgZnJvbSBiZWluZyBhbiBlbXB0eSBhcnJheS5cbiAgICAgICAgaWYgKGZpcnN0KSB7XG4gICAgICAgICAgcmVkdWNlZCA9IHZhbHVlO1xuICAgICAgICAgIGZpcnN0ID0gZmFsc2U7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gQ29tcGFyZSB0aGUgdmFsdWUgd2UgZm91bmQgdG8gdGhlIHZhbHVlIHdlIGZvdW5kIHNvIGZhciwgc2F2aW5nIGl0XG4gICAgICAgICAgLy8gaWYgaXQncyBsZXNzIChmb3IgYW4gYXNjZW5kaW5nIHNvcnQpIG9yIG1vcmUgKGZvciBhIGRlc2NlbmRpbmdcbiAgICAgICAgICAvLyBzb3J0KS5cbiAgICAgICAgICB2YXIgY21wID0gTG9jYWxDb2xsZWN0aW9uLl9mLl9jbXAocmVkdWNlZCwgdmFsdWUpO1xuICAgICAgICAgIGlmICgoZmluZE1pbiAmJiBjbXAgPiAwKSB8fCAoIWZpbmRNaW4gJiYgY21wIDwgMCkpXG4gICAgICAgICAgICByZWR1Y2VkID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIHJldHVybiByZWR1Y2VkO1xuICB9O1xuXG4gIHJldHVybiBmdW5jdGlvbiAoYSwgYikge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc29ydFNwZWNQYXJ0cy5sZW5ndGg7ICsraSkge1xuICAgICAgdmFyIHNwZWNQYXJ0ID0gc29ydFNwZWNQYXJ0c1tpXTtcbiAgICAgIHZhciBhVmFsdWUgPSByZWR1Y2VWYWx1ZShzcGVjUGFydC5sb29rdXAoYSksIHNwZWNQYXJ0LmFzY2VuZGluZyk7XG4gICAgICB2YXIgYlZhbHVlID0gcmVkdWNlVmFsdWUoc3BlY1BhcnQubG9va3VwKGIpLCBzcGVjUGFydC5hc2NlbmRpbmcpO1xuICAgICAgdmFyIGNvbXBhcmUgPSBMb2NhbENvbGxlY3Rpb24uX2YuX2NtcChhVmFsdWUsIGJWYWx1ZSk7XG4gICAgICBpZiAoY29tcGFyZSAhPT0gMClcbiAgICAgICAgcmV0dXJuIHNwZWNQYXJ0LmFzY2VuZGluZyA/IGNvbXBhcmUgOiAtY29tcGFyZTtcbiAgICB9O1xuICAgIHJldHVybiAwO1xuICB9O1xufTtcblxuZXhwb3J0cy5jb21waWxlRG9jdW1lbnRTZWxlY3RvciA9IGNvbXBpbGVEb2N1bWVudFNlbGVjdG9yO1xuZXhwb3J0cy5jb21waWxlU29ydCA9IExvY2FsQ29sbGVjdGlvbi5fY29tcGlsZVNvcnQ7IiwiIyBVdGlsaXRpZXMgZm9yIGRiIGhhbmRsaW5nXG5cbmNvbXBpbGVEb2N1bWVudFNlbGVjdG9yID0gcmVxdWlyZSgnLi9zZWxlY3RvcicpLmNvbXBpbGVEb2N1bWVudFNlbGVjdG9yXG5jb21waWxlU29ydCA9IHJlcXVpcmUoJy4vc2VsZWN0b3InKS5jb21waWxlU29ydFxuR2VvSlNPTiA9IHJlcXVpcmUgJy4uL0dlb0pTT04nXG5cblxuZXhwb3J0cy5wcm9jZXNzRmluZCA9IChpdGVtcywgc2VsZWN0b3IsIG9wdGlvbnMpIC0+XG4gIGZpbHRlcmVkID0gXy5maWx0ZXIoXy52YWx1ZXMoaXRlbXMpLCBjb21waWxlRG9jdW1lbnRTZWxlY3RvcihzZWxlY3RvcikpXG5cbiAgIyBIYW5kbGUgZ2Vvc3BhdGlhbCBvcGVyYXRvcnNcbiAgZmlsdGVyZWQgPSBwcm9jZXNzTmVhck9wZXJhdG9yKHNlbGVjdG9yLCBmaWx0ZXJlZClcbiAgZmlsdGVyZWQgPSBwcm9jZXNzR2VvSW50ZXJzZWN0c09wZXJhdG9yKHNlbGVjdG9yLCBmaWx0ZXJlZClcblxuICBpZiBvcHRpb25zIGFuZCBvcHRpb25zLnNvcnQgXG4gICAgZmlsdGVyZWQuc29ydChjb21waWxlU29ydChvcHRpb25zLnNvcnQpKVxuXG4gIGlmIG9wdGlvbnMgYW5kIG9wdGlvbnMubGltaXRcbiAgICBmaWx0ZXJlZCA9IF8uZmlyc3QgZmlsdGVyZWQsIG9wdGlvbnMubGltaXRcblxuICAjIENsb25lIHRvIHByZXZlbnQgYWNjaWRlbnRhbCB1cGRhdGVzLCBvciBhcHBseSBmaWVsZHMgaWYgcHJlc2VudFxuICBpZiBvcHRpb25zIGFuZCBvcHRpb25zLmZpZWxkc1xuICAgIGlmIF8uZmlyc3QoXy52YWx1ZXMob3B0aW9ucy5maWVsZHMpKSA9PSAxXG4gICAgICAjIEluY2x1ZGUgZmllbGRzXG4gICAgICBmaWx0ZXJlZCA9IF8ubWFwIGZpbHRlcmVkLCAoZG9jKSAtPiBfLnBpY2soZG9jLCBfLmtleXMob3B0aW9ucy5maWVsZHMpLmNvbmNhdChbXCJfaWRcIl0pKVxuICAgIGVsc2VcbiAgICAgICMgRXhjbHVkZSBmaWVsZHNcbiAgICAgIGZpbHRlcmVkID0gXy5tYXAgZmlsdGVyZWQsIChkb2MpIC0+IF8ub21pdChkb2MsIF8ua2V5cyhvcHRpb25zLmZpZWxkcykpXG4gIGVsc2VcbiAgICBmaWx0ZXJlZCA9IF8ubWFwIGZpbHRlcmVkLCAoZG9jKSAtPiBfLmNsb25lRGVlcChkb2MpXG5cbiAgcmV0dXJuIGZpbHRlcmVkXG5cbmV4cG9ydHMuY3JlYXRlVWlkID0gLT4gXG4gICd4eHh4eHh4eHh4eHg0eHh4eXh4eHh4eHh4eHh4eHh4eCcucmVwbGFjZSgvW3h5XS9nLCAoYykgLT5cbiAgICByID0gTWF0aC5yYW5kb20oKSoxNnwwXG4gICAgdiA9IGlmIGMgPT0gJ3gnIHRoZW4gciBlbHNlIChyJjB4M3wweDgpXG4gICAgcmV0dXJuIHYudG9TdHJpbmcoMTYpXG4gICApXG5cbnByb2Nlc3NOZWFyT3BlcmF0b3IgPSAoc2VsZWN0b3IsIGxpc3QpIC0+XG4gIGZvciBrZXksIHZhbHVlIG9mIHNlbGVjdG9yXG4gICAgaWYgdmFsdWU/IGFuZCB2YWx1ZVsnJG5lYXInXVxuICAgICAgZ2VvID0gdmFsdWVbJyRuZWFyJ11bJyRnZW9tZXRyeSddXG4gICAgICBpZiBnZW8udHlwZSAhPSAnUG9pbnQnXG4gICAgICAgIGJyZWFrXG5cbiAgICAgIG5lYXIgPSBuZXcgTC5MYXRMbmcoZ2VvLmNvb3JkaW5hdGVzWzFdLCBnZW8uY29vcmRpbmF0ZXNbMF0pXG5cbiAgICAgIGxpc3QgPSBfLmZpbHRlciBsaXN0LCAoZG9jKSAtPlxuICAgICAgICByZXR1cm4gZG9jW2tleV0gYW5kIGRvY1trZXldLnR5cGUgPT0gJ1BvaW50J1xuXG4gICAgICAjIEdldCBkaXN0YW5jZXNcbiAgICAgIGRpc3RhbmNlcyA9IF8ubWFwIGxpc3QsIChkb2MpIC0+XG4gICAgICAgIHJldHVybiB7IGRvYzogZG9jLCBkaXN0YW5jZTogXG4gICAgICAgICAgbmVhci5kaXN0YW5jZVRvKG5ldyBMLkxhdExuZyhkb2Nba2V5XS5jb29yZGluYXRlc1sxXSwgZG9jW2tleV0uY29vcmRpbmF0ZXNbMF0pKVxuICAgICAgICB9XG5cbiAgICAgICMgRmlsdGVyIG5vbi1wb2ludHNcbiAgICAgIGRpc3RhbmNlcyA9IF8uZmlsdGVyIGRpc3RhbmNlcywgKGl0ZW0pIC0+IGl0ZW0uZGlzdGFuY2UgPj0gMFxuXG4gICAgICAjIFNvcnQgYnkgZGlzdGFuY2VcbiAgICAgIGRpc3RhbmNlcyA9IF8uc29ydEJ5IGRpc3RhbmNlcywgJ2Rpc3RhbmNlJ1xuXG4gICAgICAjIEZpbHRlciBieSBtYXhEaXN0YW5jZVxuICAgICAgaWYgdmFsdWVbJyRuZWFyJ11bJyRtYXhEaXN0YW5jZSddXG4gICAgICAgIGRpc3RhbmNlcyA9IF8uZmlsdGVyIGRpc3RhbmNlcywgKGl0ZW0pIC0+IGl0ZW0uZGlzdGFuY2UgPD0gdmFsdWVbJyRuZWFyJ11bJyRtYXhEaXN0YW5jZSddXG5cbiAgICAgICMgTGltaXQgdG8gMTAwXG4gICAgICBkaXN0YW5jZXMgPSBfLmZpcnN0IGRpc3RhbmNlcywgMTAwXG5cbiAgICAgICMgRXh0cmFjdCBkb2NzXG4gICAgICBsaXN0ID0gXy5wbHVjayBkaXN0YW5jZXMsICdkb2MnXG4gIHJldHVybiBsaXN0XG5cbnByb2Nlc3NHZW9JbnRlcnNlY3RzT3BlcmF0b3IgPSAoc2VsZWN0b3IsIGxpc3QpIC0+XG4gIGZvciBrZXksIHZhbHVlIG9mIHNlbGVjdG9yXG4gICAgaWYgdmFsdWU/IGFuZCB2YWx1ZVsnJGdlb0ludGVyc2VjdHMnXVxuICAgICAgZ2VvID0gdmFsdWVbJyRnZW9JbnRlcnNlY3RzJ11bJyRnZW9tZXRyeSddXG4gICAgICBpZiBnZW8udHlwZSAhPSAnUG9seWdvbidcbiAgICAgICAgYnJlYWtcblxuICAgICAgIyBDaGVjayB3aXRoaW4gZm9yIGVhY2hcbiAgICAgIGxpc3QgPSBfLmZpbHRlciBsaXN0LCAoZG9jKSAtPlxuICAgICAgICAjIFJlamVjdCBub24tcG9pbnRzXG4gICAgICAgIGlmIG5vdCBkb2Nba2V5XSBvciBkb2Nba2V5XS50eXBlICE9ICdQb2ludCdcbiAgICAgICAgICByZXR1cm4gZmFsc2VcblxuICAgICAgICAjIENoZWNrIHBvbHlnb25cbiAgICAgICAgcmV0dXJuIEdlb0pTT04ucG9pbnRJblBvbHlnb24oZG9jW2tleV0sIGdlbylcblxuICByZXR1cm4gbGlzdFxuIiwiUGFnZSA9IHJlcXVpcmUoXCIuLi9QYWdlXCIpXG5Tb3VyY2VQYWdlID0gcmVxdWlyZShcIi4vU291cmNlUGFnZVwiKVxuTG9jYXRpb25GaW5kZXIgPSByZXF1aXJlICcuLi9Mb2NhdGlvbkZpbmRlcidcbkdlb0pTT04gPSByZXF1aXJlICcuLi9HZW9KU09OJ1xuXG5cbiMgTGlzdHMgbmVhcmJ5IGFuZCB1bmxvY2F0ZWQgc291cmNlc1xuIyBPcHRpb25zOiBvblNlbGVjdCAtIGZ1bmN0aW9uIHRvIGNhbGwgd2l0aCBzb3VyY2UgZG9jIHdoZW4gc2VsZWN0ZWRcbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgU291cmNlTGlzdFBhZ2UgZXh0ZW5kcyBQYWdlXG4gIGV2ZW50czogXG4gICAgJ2NsaWNrIHRyLnRhcHBhYmxlJyA6ICdzb3VyY2VDbGlja2VkJ1xuICAgICdjbGljayAjc2VhcmNoX2NhbmNlbCcgOiAnY2FuY2VsU2VhcmNoJ1xuXG4gIGNyZWF0ZTogLT5cbiAgICBAc2V0VGl0bGUgJ05lYXJieSBTb3VyY2VzJ1xuXG4gIGFjdGl2YXRlOiAtPlxuICAgIEAkZWwuaHRtbCB0ZW1wbGF0ZXNbJ3BhZ2VzL1NvdXJjZUxpc3RQYWdlJ10oKVxuICAgIEBuZWFyU291cmNlcyA9IFtdXG4gICAgQHVubG9jYXRlZFNvdXJjZXMgPSBbXVxuXG4gICAgIyBGaW5kIGxvY2F0aW9uXG4gICAgQGxvY2F0aW9uRmluZGVyID0gbmV3IExvY2F0aW9uRmluZGVyKClcbiAgICBAbG9jYXRpb25GaW5kZXIub24oJ2ZvdW5kJywgQGxvY2F0aW9uRm91bmQpLm9uKCdlcnJvcicsIEBsb2NhdGlvbkVycm9yKVxuICAgIEBsb2NhdGlvbkZpbmRlci5nZXRMb2NhdGlvbigpXG4gICAgQCQoXCIjbG9jYXRpb25fbXNnXCIpLnNob3coKVxuXG4gICAgQHNldHVwQnV0dG9uQmFyIFtcbiAgICAgIHsgaWNvbjogXCJzZWFyY2gucG5nXCIsIGNsaWNrOiA9PiBAc2VhcmNoKCkgfVxuICAgICAgeyBpY29uOiBcInBsdXMucG5nXCIsIGNsaWNrOiA9PiBAYWRkU291cmNlKCkgfVxuICAgIF1cblxuICAgICMgUXVlcnkgZGF0YWJhc2UgZm9yIHVubG9jYXRlZCBzb3VyY2VzXG4gICAgaWYgQGxvZ2luLnVzZXJcbiAgICAgIEBkYi5zb3VyY2VzLmZpbmQoZ2VvOiB7ICRleGlzdHM6IGZhbHNlIH0sIHVzZXI6IEBsb2dpbi51c2VyKS5mZXRjaCAoc291cmNlcykgPT5cbiAgICAgICAgQHVubG9jYXRlZFNvdXJjZXMgPSBzb3VyY2VzXG4gICAgICAgIEByZW5kZXJMaXN0KClcblxuICAgIEBwZXJmb3JtU2VhcmNoKClcblxuICBhZGRTb3VyY2U6IC0+XG4gICAgQHBhZ2VyLm9wZW5QYWdlKHJlcXVpcmUoXCIuL05ld1NvdXJjZVBhZ2VcIikpXG4gICAgXG4gIGxvY2F0aW9uRm91bmQ6IChwb3MpID0+XG4gICAgQCQoXCIjbG9jYXRpb25fbXNnXCIpLmhpZGUoKVxuICAgIHNlbGVjdG9yID0gZ2VvOiBcbiAgICAgICRuZWFyOiBcbiAgICAgICAgJGdlb21ldHJ5OiBHZW9KU09OLnBvc1RvUG9pbnQocG9zKVxuXG4gICAgIyBRdWVyeSBkYXRhYmFzZSBmb3IgbmVhciBzb3VyY2VzXG4gICAgQGRiLnNvdXJjZXMuZmluZChzZWxlY3RvciwgeyBsaW1pdDogMTAwIH0pLmZldGNoIChzb3VyY2VzKSA9PlxuICAgICAgQG5lYXJTb3VyY2VzID0gc291cmNlc1xuICAgICAgQHJlbmRlckxpc3QoKVxuXG4gIHJlbmRlckxpc3Q6IC0+XG4gICAgIyBBcHBlbmQgbG9jYXRlZCBhbmQgdW5sb2NhdGVkIHNvdXJjZXNcbiAgICBpZiBub3QgQHNlYXJjaFRleHRcbiAgICAgIHNvdXJjZXMgPSBAdW5sb2NhdGVkU291cmNlcy5jb25jYXQoQG5lYXJTb3VyY2VzKVxuICAgIGVsc2VcbiAgICAgIHNvdXJjZXMgPSBAc2VhcmNoU291cmNlc1xuXG4gICAgQCQoXCIjdGFibGVcIikuaHRtbCB0ZW1wbGF0ZXNbJ3BhZ2VzL1NvdXJjZUxpc3RQYWdlX2l0ZW1zJ10oc291cmNlczpzb3VyY2VzKVxuXG4gIGxvY2F0aW9uRXJyb3I6IChwb3MpID0+XG4gICAgQCQoXCIjbG9jYXRpb25fbXNnXCIpLmhpZGUoKVxuICAgIEBwYWdlci5mbGFzaCBcIlVuYWJsZSB0byBkZXRlcm1pbmUgbG9jYXRpb25cIiwgXCJlcnJvclwiXG5cbiAgc291cmNlQ2xpY2tlZDogKGV2KSAtPlxuICAgICMgV3JhcCBvblNlbGVjdFxuICAgIG9uU2VsZWN0ID0gdW5kZWZpbmVkXG4gICAgaWYgQG9wdGlvbnMub25TZWxlY3RcbiAgICAgIG9uU2VsZWN0ID0gKHNvdXJjZSkgPT5cbiAgICAgICAgQHBhZ2VyLmNsb3NlUGFnZSgpXG4gICAgICAgIEBvcHRpb25zLm9uU2VsZWN0KHNvdXJjZSlcbiAgICBAcGFnZXIub3BlblBhZ2UoU291cmNlUGFnZSwgeyBfaWQ6IGV2LmN1cnJlbnRUYXJnZXQuaWQsIG9uU2VsZWN0OiBvblNlbGVjdH0pXG5cbiAgc2VhcmNoOiAtPlxuICAgICMgUHJvbXB0IGZvciBzZWFyY2hcbiAgICBAc2VhcmNoVGV4dCA9IHByb21wdChcIkVudGVyIHNlYXJjaCB0ZXh0IG9yIElEIG9mIHdhdGVyIHNvdXJjZVwiKVxuICAgIEBwZXJmb3JtU2VhcmNoKClcblxuICBwZXJmb3JtU2VhcmNoOiAtPlxuICAgIEAkKFwiI3NlYXJjaF9iYXJcIikudG9nZ2xlKEBzZWFyY2hUZXh0IGFuZCBAc2VhcmNoVGV4dC5sZW5ndGg+MClcbiAgICBAJChcIiNzZWFyY2hfdGV4dFwiKS50ZXh0KEBzZWFyY2hUZXh0KVxuICAgIGlmIEBzZWFyY2hUZXh0XG4gICAgICAjIElmIGRpZ2l0cywgc2VhcmNoIGZvciBjb2RlXG4gICAgICBpZiBAc2VhcmNoVGV4dC5tYXRjaCgvXlxcZCskLylcbiAgICAgICAgc2VsZWN0b3IgPSB7IGNvZGU6IEBzZWFyY2hUZXh0IH1cbiAgICAgIGVsc2VcbiAgICAgICAgc2VsZWN0b3IgPSB7ICRvcjogWyB7IG5hbWU6IG5ldyBSZWdFeHAoQHNlYXJjaFRleHQsXCJpXCIpIH0sIHsgZGVzYzogbmV3IFJlZ0V4cChAc2VhcmNoVGV4dCxcImlcIikgfSBdIH1cbiAgICAgICAgXG4gICAgICBAZGIuc291cmNlcy5maW5kKHNlbGVjdG9yLCB7bGltaXQ6IDUwfSkuZmV0Y2ggKHNvdXJjZXMpID0+XG4gICAgICAgIEBzZWFyY2hTb3VyY2VzID0gc291cmNlc1xuICAgICAgICBAcmVuZGVyTGlzdCgpXG4gICAgZWxzZVxuICAgICAgQHJlbmRlckxpc3QoKVxuXG4gIGNhbmNlbFNlYXJjaDogLT5cbiAgICBAc2VhcmNoVGV4dCA9IFwiXCJcbiAgICBAcGVyZm9ybVNlYXJjaCgpXG5cbiIsIkVKU09OID0ge307IC8vIEdsb2JhbCFcbnZhciBjdXN0b21UeXBlcyA9IHt9O1xuLy8gQWRkIGEgY3VzdG9tIHR5cGUsIHVzaW5nIGEgbWV0aG9kIG9mIHlvdXIgY2hvaWNlIHRvIGdldCB0byBhbmRcbi8vIGZyb20gYSBiYXNpYyBKU09OLWFibGUgcmVwcmVzZW50YXRpb24uICBUaGUgZmFjdG9yeSBhcmd1bWVudFxuLy8gaXMgYSBmdW5jdGlvbiBvZiBKU09OLWFibGUgLS0+IHlvdXIgb2JqZWN0XG4vLyBUaGUgdHlwZSB5b3UgYWRkIG11c3QgaGF2ZTpcbi8vIC0gQSBjbG9uZSgpIG1ldGhvZCwgc28gdGhhdCBNZXRlb3IgY2FuIGRlZXAtY29weSBpdCB3aGVuIG5lY2Vzc2FyeS5cbi8vIC0gQSBlcXVhbHMoKSBtZXRob2QsIHNvIHRoYXQgTWV0ZW9yIGNhbiBjb21wYXJlIGl0XG4vLyAtIEEgdG9KU09OVmFsdWUoKSBtZXRob2QsIHNvIHRoYXQgTWV0ZW9yIGNhbiBzZXJpYWxpemUgaXRcbi8vIC0gYSB0eXBlTmFtZSgpIG1ldGhvZCwgdG8gc2hvdyBob3cgdG8gbG9vayBpdCB1cCBpbiBvdXIgdHlwZSB0YWJsZS5cbi8vIEl0IGlzIG9rYXkgaWYgdGhlc2UgbWV0aG9kcyBhcmUgbW9ua2V5LXBhdGNoZWQgb24uXG5FSlNPTi5hZGRUeXBlID0gZnVuY3Rpb24gKG5hbWUsIGZhY3RvcnkpIHtcbiAgaWYgKF8uaGFzKGN1c3RvbVR5cGVzLCBuYW1lKSlcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJUeXBlIFwiICsgbmFtZSArIFwiIGFscmVhZHkgcHJlc2VudFwiKTtcbiAgY3VzdG9tVHlwZXNbbmFtZV0gPSBmYWN0b3J5O1xufTtcblxudmFyIGJ1aWx0aW5Db252ZXJ0ZXJzID0gW1xuICB7IC8vIERhdGVcbiAgICBtYXRjaEpTT05WYWx1ZTogZnVuY3Rpb24gKG9iaikge1xuICAgICAgcmV0dXJuIF8uaGFzKG9iaiwgJyRkYXRlJykgJiYgXy5zaXplKG9iaikgPT09IDE7XG4gICAgfSxcbiAgICBtYXRjaE9iamVjdDogZnVuY3Rpb24gKG9iaikge1xuICAgICAgcmV0dXJuIG9iaiBpbnN0YW5jZW9mIERhdGU7XG4gICAgfSxcbiAgICB0b0pTT05WYWx1ZTogZnVuY3Rpb24gKG9iaikge1xuICAgICAgcmV0dXJuIHskZGF0ZTogb2JqLmdldFRpbWUoKX07XG4gICAgfSxcbiAgICBmcm9tSlNPTlZhbHVlOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICByZXR1cm4gbmV3IERhdGUob2JqLiRkYXRlKTtcbiAgICB9XG4gIH0sXG4gIHsgLy8gQmluYXJ5XG4gICAgbWF0Y2hKU09OVmFsdWU6IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgIHJldHVybiBfLmhhcyhvYmosICckYmluYXJ5JykgJiYgXy5zaXplKG9iaikgPT09IDE7XG4gICAgfSxcbiAgICBtYXRjaE9iamVjdDogZnVuY3Rpb24gKG9iaikge1xuICAgICAgcmV0dXJuIHR5cGVvZiBVaW50OEFycmF5ICE9PSAndW5kZWZpbmVkJyAmJiBvYmogaW5zdGFuY2VvZiBVaW50OEFycmF5XG4gICAgICAgIHx8IChvYmogJiYgXy5oYXMob2JqLCAnJFVpbnQ4QXJyYXlQb2x5ZmlsbCcpKTtcbiAgICB9LFxuICAgIHRvSlNPTlZhbHVlOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICByZXR1cm4geyRiaW5hcnk6IEVKU09OLl9iYXNlNjRFbmNvZGUob2JqKX07XG4gICAgfSxcbiAgICBmcm9tSlNPTlZhbHVlOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICByZXR1cm4gRUpTT04uX2Jhc2U2NERlY29kZShvYmouJGJpbmFyeSk7XG4gICAgfVxuICB9LFxuICB7IC8vIEVzY2FwaW5nIG9uZSBsZXZlbFxuICAgIG1hdGNoSlNPTlZhbHVlOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICByZXR1cm4gXy5oYXMob2JqLCAnJGVzY2FwZScpICYmIF8uc2l6ZShvYmopID09PSAxO1xuICAgIH0sXG4gICAgbWF0Y2hPYmplY3Q6IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgIGlmIChfLmlzRW1wdHkob2JqKSB8fCBfLnNpemUob2JqKSA+IDIpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIF8uYW55KGJ1aWx0aW5Db252ZXJ0ZXJzLCBmdW5jdGlvbiAoY29udmVydGVyKSB7XG4gICAgICAgIHJldHVybiBjb252ZXJ0ZXIubWF0Y2hKU09OVmFsdWUob2JqKTtcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgdG9KU09OVmFsdWU6IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgIHZhciBuZXdPYmogPSB7fTtcbiAgICAgIF8uZWFjaChvYmosIGZ1bmN0aW9uICh2YWx1ZSwga2V5KSB7XG4gICAgICAgIG5ld09ialtrZXldID0gRUpTT04udG9KU09OVmFsdWUodmFsdWUpO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4geyRlc2NhcGU6IG5ld09ian07XG4gICAgfSxcbiAgICBmcm9tSlNPTlZhbHVlOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICB2YXIgbmV3T2JqID0ge307XG4gICAgICBfLmVhY2gob2JqLiRlc2NhcGUsIGZ1bmN0aW9uICh2YWx1ZSwga2V5KSB7XG4gICAgICAgIG5ld09ialtrZXldID0gRUpTT04uZnJvbUpTT05WYWx1ZSh2YWx1ZSk7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBuZXdPYmo7XG4gICAgfVxuICB9LFxuICB7IC8vIEN1c3RvbVxuICAgIG1hdGNoSlNPTlZhbHVlOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICByZXR1cm4gXy5oYXMob2JqLCAnJHR5cGUnKSAmJiBfLmhhcyhvYmosICckdmFsdWUnKSAmJiBfLnNpemUob2JqKSA9PT0gMjtcbiAgICB9LFxuICAgIG1hdGNoT2JqZWN0OiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICByZXR1cm4gRUpTT04uX2lzQ3VzdG9tVHlwZShvYmopO1xuICAgIH0sXG4gICAgdG9KU09OVmFsdWU6IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgIHJldHVybiB7JHR5cGU6IG9iai50eXBlTmFtZSgpLCAkdmFsdWU6IG9iai50b0pTT05WYWx1ZSgpfTtcbiAgICB9LFxuICAgIGZyb21KU09OVmFsdWU6IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgIHZhciB0eXBlTmFtZSA9IG9iai4kdHlwZTtcbiAgICAgIHZhciBjb252ZXJ0ZXIgPSBjdXN0b21UeXBlc1t0eXBlTmFtZV07XG4gICAgICByZXR1cm4gY29udmVydGVyKG9iai4kdmFsdWUpO1xuICAgIH1cbiAgfVxuXTtcblxuRUpTT04uX2lzQ3VzdG9tVHlwZSA9IGZ1bmN0aW9uIChvYmopIHtcbiAgcmV0dXJuIG9iaiAmJlxuICAgIHR5cGVvZiBvYmoudG9KU09OVmFsdWUgPT09ICdmdW5jdGlvbicgJiZcbiAgICB0eXBlb2Ygb2JqLnR5cGVOYW1lID09PSAnZnVuY3Rpb24nICYmXG4gICAgXy5oYXMoY3VzdG9tVHlwZXMsIG9iai50eXBlTmFtZSgpKTtcbn07XG5cblxuLy9mb3IgYm90aCBhcnJheXMgYW5kIG9iamVjdHMsIGluLXBsYWNlIG1vZGlmaWNhdGlvbi5cbnZhciBhZGp1c3RUeXBlc1RvSlNPTlZhbHVlID1cbkVKU09OLl9hZGp1c3RUeXBlc1RvSlNPTlZhbHVlID0gZnVuY3Rpb24gKG9iaikge1xuICBpZiAob2JqID09PSBudWxsKVxuICAgIHJldHVybiBudWxsO1xuICB2YXIgbWF5YmVDaGFuZ2VkID0gdG9KU09OVmFsdWVIZWxwZXIob2JqKTtcbiAgaWYgKG1heWJlQ2hhbmdlZCAhPT0gdW5kZWZpbmVkKVxuICAgIHJldHVybiBtYXliZUNoYW5nZWQ7XG4gIF8uZWFjaChvYmosIGZ1bmN0aW9uICh2YWx1ZSwga2V5KSB7XG4gICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ29iamVjdCcgJiYgdmFsdWUgIT09IHVuZGVmaW5lZClcbiAgICAgIHJldHVybjsgLy8gY29udGludWVcbiAgICB2YXIgY2hhbmdlZCA9IHRvSlNPTlZhbHVlSGVscGVyKHZhbHVlKTtcbiAgICBpZiAoY2hhbmdlZCkge1xuICAgICAgb2JqW2tleV0gPSBjaGFuZ2VkO1xuICAgICAgcmV0dXJuOyAvLyBvbiB0byB0aGUgbmV4dCBrZXlcbiAgICB9XG4gICAgLy8gaWYgd2UgZ2V0IGhlcmUsIHZhbHVlIGlzIGFuIG9iamVjdCBidXQgbm90IGFkanVzdGFibGVcbiAgICAvLyBhdCB0aGlzIGxldmVsLiAgcmVjdXJzZS5cbiAgICBhZGp1c3RUeXBlc1RvSlNPTlZhbHVlKHZhbHVlKTtcbiAgfSk7XG4gIHJldHVybiBvYmo7XG59O1xuXG4vLyBFaXRoZXIgcmV0dXJuIHRoZSBKU09OLWNvbXBhdGlibGUgdmVyc2lvbiBvZiB0aGUgYXJndW1lbnQsIG9yIHVuZGVmaW5lZCAoaWZcbi8vIHRoZSBpdGVtIGlzbid0IGl0c2VsZiByZXBsYWNlYWJsZSwgYnV0IG1heWJlIHNvbWUgZmllbGRzIGluIGl0IGFyZSlcbnZhciB0b0pTT05WYWx1ZUhlbHBlciA9IGZ1bmN0aW9uIChpdGVtKSB7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYnVpbHRpbkNvbnZlcnRlcnMubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgY29udmVydGVyID0gYnVpbHRpbkNvbnZlcnRlcnNbaV07XG4gICAgaWYgKGNvbnZlcnRlci5tYXRjaE9iamVjdChpdGVtKSkge1xuICAgICAgcmV0dXJuIGNvbnZlcnRlci50b0pTT05WYWx1ZShpdGVtKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHVuZGVmaW5lZDtcbn07XG5cbkVKU09OLnRvSlNPTlZhbHVlID0gZnVuY3Rpb24gKGl0ZW0pIHtcbiAgdmFyIGNoYW5nZWQgPSB0b0pTT05WYWx1ZUhlbHBlcihpdGVtKTtcbiAgaWYgKGNoYW5nZWQgIT09IHVuZGVmaW5lZClcbiAgICByZXR1cm4gY2hhbmdlZDtcbiAgaWYgKHR5cGVvZiBpdGVtID09PSAnb2JqZWN0Jykge1xuICAgIGl0ZW0gPSBFSlNPTi5jbG9uZShpdGVtKTtcbiAgICBhZGp1c3RUeXBlc1RvSlNPTlZhbHVlKGl0ZW0pO1xuICB9XG4gIHJldHVybiBpdGVtO1xufTtcblxuLy9mb3IgYm90aCBhcnJheXMgYW5kIG9iamVjdHMuIFRyaWVzIGl0cyBiZXN0IHRvIGp1c3Rcbi8vIHVzZSB0aGUgb2JqZWN0IHlvdSBoYW5kIGl0LCBidXQgbWF5IHJldHVybiBzb21ldGhpbmdcbi8vIGRpZmZlcmVudCBpZiB0aGUgb2JqZWN0IHlvdSBoYW5kIGl0IGl0c2VsZiBuZWVkcyBjaGFuZ2luZy5cbnZhciBhZGp1c3RUeXBlc0Zyb21KU09OVmFsdWUgPVxuRUpTT04uX2FkanVzdFR5cGVzRnJvbUpTT05WYWx1ZSA9IGZ1bmN0aW9uIChvYmopIHtcbiAgaWYgKG9iaiA9PT0gbnVsbClcbiAgICByZXR1cm4gbnVsbDtcbiAgdmFyIG1heWJlQ2hhbmdlZCA9IGZyb21KU09OVmFsdWVIZWxwZXIob2JqKTtcbiAgaWYgKG1heWJlQ2hhbmdlZCAhPT0gb2JqKVxuICAgIHJldHVybiBtYXliZUNoYW5nZWQ7XG4gIF8uZWFjaChvYmosIGZ1bmN0aW9uICh2YWx1ZSwga2V5KSB7XG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgIHZhciBjaGFuZ2VkID0gZnJvbUpTT05WYWx1ZUhlbHBlcih2YWx1ZSk7XG4gICAgICBpZiAodmFsdWUgIT09IGNoYW5nZWQpIHtcbiAgICAgICAgb2JqW2tleV0gPSBjaGFuZ2VkO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICAvLyBpZiB3ZSBnZXQgaGVyZSwgdmFsdWUgaXMgYW4gb2JqZWN0IGJ1dCBub3QgYWRqdXN0YWJsZVxuICAgICAgLy8gYXQgdGhpcyBsZXZlbC4gIHJlY3Vyc2UuXG4gICAgICBhZGp1c3RUeXBlc0Zyb21KU09OVmFsdWUodmFsdWUpO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiBvYmo7XG59O1xuXG4vLyBFaXRoZXIgcmV0dXJuIHRoZSBhcmd1bWVudCBjaGFuZ2VkIHRvIGhhdmUgdGhlIG5vbi1qc29uXG4vLyByZXAgb2YgaXRzZWxmICh0aGUgT2JqZWN0IHZlcnNpb24pIG9yIHRoZSBhcmd1bWVudCBpdHNlbGYuXG5cbi8vIERPRVMgTk9UIFJFQ1VSU0UuICBGb3IgYWN0dWFsbHkgZ2V0dGluZyB0aGUgZnVsbHktY2hhbmdlZCB2YWx1ZSwgdXNlXG4vLyBFSlNPTi5mcm9tSlNPTlZhbHVlXG52YXIgZnJvbUpTT05WYWx1ZUhlbHBlciA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICBpZiAodHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiB2YWx1ZSAhPT0gbnVsbCkge1xuICAgIGlmIChfLnNpemUodmFsdWUpIDw9IDJcbiAgICAgICAgJiYgXy5hbGwodmFsdWUsIGZ1bmN0aW9uICh2LCBrKSB7XG4gICAgICAgICAgcmV0dXJuIHR5cGVvZiBrID09PSAnc3RyaW5nJyAmJiBrLnN1YnN0cigwLCAxKSA9PT0gJyQnO1xuICAgICAgICB9KSkge1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBidWlsdGluQ29udmVydGVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgY29udmVydGVyID0gYnVpbHRpbkNvbnZlcnRlcnNbaV07XG4gICAgICAgIGlmIChjb252ZXJ0ZXIubWF0Y2hKU09OVmFsdWUodmFsdWUpKSB7XG4gICAgICAgICAgcmV0dXJuIGNvbnZlcnRlci5mcm9tSlNPTlZhbHVlKHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gdmFsdWU7XG59O1xuXG5FSlNPTi5mcm9tSlNPTlZhbHVlID0gZnVuY3Rpb24gKGl0ZW0pIHtcbiAgdmFyIGNoYW5nZWQgPSBmcm9tSlNPTlZhbHVlSGVscGVyKGl0ZW0pO1xuICBpZiAoY2hhbmdlZCA9PT0gaXRlbSAmJiB0eXBlb2YgaXRlbSA9PT0gJ29iamVjdCcpIHtcbiAgICBpdGVtID0gRUpTT04uY2xvbmUoaXRlbSk7XG4gICAgYWRqdXN0VHlwZXNGcm9tSlNPTlZhbHVlKGl0ZW0pO1xuICAgIHJldHVybiBpdGVtO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBjaGFuZ2VkO1xuICB9XG59O1xuXG5FSlNPTi5zdHJpbmdpZnkgPSBmdW5jdGlvbiAoaXRlbSkge1xuICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoRUpTT04udG9KU09OVmFsdWUoaXRlbSkpO1xufTtcblxuRUpTT04ucGFyc2UgPSBmdW5jdGlvbiAoaXRlbSkge1xuICByZXR1cm4gRUpTT04uZnJvbUpTT05WYWx1ZShKU09OLnBhcnNlKGl0ZW0pKTtcbn07XG5cbkVKU09OLmlzQmluYXJ5ID0gZnVuY3Rpb24gKG9iaikge1xuICByZXR1cm4gKHR5cGVvZiBVaW50OEFycmF5ICE9PSAndW5kZWZpbmVkJyAmJiBvYmogaW5zdGFuY2VvZiBVaW50OEFycmF5KSB8fFxuICAgIChvYmogJiYgb2JqLiRVaW50OEFycmF5UG9seWZpbGwpO1xufTtcblxuRUpTT04uZXF1YWxzID0gZnVuY3Rpb24gKGEsIGIsIG9wdGlvbnMpIHtcbiAgdmFyIGk7XG4gIHZhciBrZXlPcmRlclNlbnNpdGl2ZSA9ICEhKG9wdGlvbnMgJiYgb3B0aW9ucy5rZXlPcmRlclNlbnNpdGl2ZSk7XG4gIGlmIChhID09PSBiKVxuICAgIHJldHVybiB0cnVlO1xuICBpZiAoIWEgfHwgIWIpIC8vIGlmIGVpdGhlciBvbmUgaXMgZmFsc3ksIHRoZXknZCBoYXZlIHRvIGJlID09PSB0byBiZSBlcXVhbFxuICAgIHJldHVybiBmYWxzZTtcbiAgaWYgKCEodHlwZW9mIGEgPT09ICdvYmplY3QnICYmIHR5cGVvZiBiID09PSAnb2JqZWN0JykpXG4gICAgcmV0dXJuIGZhbHNlO1xuICBpZiAoYSBpbnN0YW5jZW9mIERhdGUgJiYgYiBpbnN0YW5jZW9mIERhdGUpXG4gICAgcmV0dXJuIGEudmFsdWVPZigpID09PSBiLnZhbHVlT2YoKTtcbiAgaWYgKEVKU09OLmlzQmluYXJ5KGEpICYmIEVKU09OLmlzQmluYXJ5KGIpKSB7XG4gICAgaWYgKGEubGVuZ3RoICE9PSBiLmxlbmd0aClcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgYS5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKGFbaV0gIT09IGJbaV0pXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgaWYgKHR5cGVvZiAoYS5lcXVhbHMpID09PSAnZnVuY3Rpb24nKVxuICAgIHJldHVybiBhLmVxdWFscyhiLCBvcHRpb25zKTtcbiAgaWYgKGEgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgIGlmICghKGIgaW5zdGFuY2VvZiBBcnJheSkpXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgaWYgKGEubGVuZ3RoICE9PSBiLmxlbmd0aClcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgYS5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKCFFSlNPTi5lcXVhbHMoYVtpXSwgYltpXSwgb3B0aW9ucykpXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgLy8gZmFsbCBiYWNrIHRvIHN0cnVjdHVyYWwgZXF1YWxpdHkgb2Ygb2JqZWN0c1xuICB2YXIgcmV0O1xuICBpZiAoa2V5T3JkZXJTZW5zaXRpdmUpIHtcbiAgICB2YXIgYktleXMgPSBbXTtcbiAgICBfLmVhY2goYiwgZnVuY3Rpb24gKHZhbCwgeCkge1xuICAgICAgICBiS2V5cy5wdXNoKHgpO1xuICAgIH0pO1xuICAgIGkgPSAwO1xuICAgIHJldCA9IF8uYWxsKGEsIGZ1bmN0aW9uICh2YWwsIHgpIHtcbiAgICAgIGlmIChpID49IGJLZXlzLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBpZiAoeCAhPT0gYktleXNbaV0pIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgaWYgKCFFSlNPTi5lcXVhbHModmFsLCBiW2JLZXlzW2ldXSwgb3B0aW9ucykpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgaSsrO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSk7XG4gICAgcmV0dXJuIHJldCAmJiBpID09PSBiS2V5cy5sZW5ndGg7XG4gIH0gZWxzZSB7XG4gICAgaSA9IDA7XG4gICAgcmV0ID0gXy5hbGwoYSwgZnVuY3Rpb24gKHZhbCwga2V5KSB7XG4gICAgICBpZiAoIV8uaGFzKGIsIGtleSkpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgaWYgKCFFSlNPTi5lcXVhbHModmFsLCBiW2tleV0sIG9wdGlvbnMpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGkrKztcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0pO1xuICAgIHJldHVybiByZXQgJiYgXy5zaXplKGIpID09PSBpO1xuICB9XG59O1xuXG5FSlNPTi5jbG9uZSA9IGZ1bmN0aW9uICh2KSB7XG4gIHZhciByZXQ7XG4gIGlmICh0eXBlb2YgdiAhPT0gXCJvYmplY3RcIilcbiAgICByZXR1cm4gdjtcbiAgaWYgKHYgPT09IG51bGwpXG4gICAgcmV0dXJuIG51bGw7IC8vIG51bGwgaGFzIHR5cGVvZiBcIm9iamVjdFwiXG4gIGlmICh2IGluc3RhbmNlb2YgRGF0ZSlcbiAgICByZXR1cm4gbmV3IERhdGUodi5nZXRUaW1lKCkpO1xuICBpZiAoRUpTT04uaXNCaW5hcnkodikpIHtcbiAgICByZXQgPSBFSlNPTi5uZXdCaW5hcnkodi5sZW5ndGgpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdi5sZW5ndGg7IGkrKykge1xuICAgICAgcmV0W2ldID0gdltpXTtcbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbiAgfVxuICBpZiAoXy5pc0FycmF5KHYpIHx8IF8uaXNBcmd1bWVudHModikpIHtcbiAgICAvLyBGb3Igc29tZSByZWFzb24sIF8ubWFwIGRvZXNuJ3Qgd29yayBpbiB0aGlzIGNvbnRleHQgb24gT3BlcmEgKHdlaXJkIHRlc3RcbiAgICAvLyBmYWlsdXJlcykuXG4gICAgcmV0ID0gW107XG4gICAgZm9yIChpID0gMDsgaSA8IHYubGVuZ3RoOyBpKyspXG4gICAgICByZXRbaV0gPSBFSlNPTi5jbG9uZSh2W2ldKTtcbiAgICByZXR1cm4gcmV0O1xuICB9XG4gIC8vIGhhbmRsZSBnZW5lcmFsIHVzZXItZGVmaW5lZCB0eXBlZCBPYmplY3RzIGlmIHRoZXkgaGF2ZSBhIGNsb25lIG1ldGhvZFxuICBpZiAodHlwZW9mIHYuY2xvbmUgPT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gdi5jbG9uZSgpO1xuICB9XG4gIC8vIGhhbmRsZSBvdGhlciBvYmplY3RzXG4gIHJldCA9IHt9O1xuICBfLmVhY2godiwgZnVuY3Rpb24gKHZhbHVlLCBrZXkpIHtcbiAgICByZXRba2V5XSA9IEVKU09OLmNsb25lKHZhbHVlKTtcbiAgfSk7XG4gIHJldHVybiByZXQ7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEVKU09OOyIsIlBhZ2UgPSByZXF1aXJlICcuLi9QYWdlJ1xuZm9ybXMgPSByZXF1aXJlICcuLi9mb3JtcydcblNvdXJjZVBhZ2UgPSByZXF1aXJlIFwiLi9Tb3VyY2VQYWdlXCJcblxuIyBBbGxvd3MgY3JlYXRpbmcgb2YgYSBzb3VyY2Vcbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgTmV3U291cmNlUGFnZSBleHRlbmRzIFBhZ2VcbiAgQGNhbk9wZW46IChjdHgpIC0+IGN0eC5hdXRoLmluc2VydChcInNvdXJjZXNcIikgYW5kIGN0eC5sb2dpbi51c2VyXG5cbiAgYWN0aXZhdGU6IC0+XG4gICAgQHNldFRpdGxlIFwiTmV3IFNvdXJjZVwiXG5cbiAgICAjIENyZWF0ZSBtb2RlbCBmcm9tIHNvdXJjZVxuICAgIEBtb2RlbCA9IG5ldyBCYWNrYm9uZS5Nb2RlbChzZXRMb2NhdGlvbjogdHJ1ZSlcbiAgXG4gICAgIyBDcmVhdGUgcXVlc3Rpb25zXG4gICAgc291cmNlVHlwZXNRdWVzdGlvbiA9IG5ldyBmb3Jtcy5Ecm9wZG93blF1ZXN0aW9uXG4gICAgICBpZDogJ3R5cGUnXG4gICAgICBtb2RlbDogQG1vZGVsXG4gICAgICBwcm9tcHQ6ICdFbnRlciBTb3VyY2UgVHlwZSdcbiAgICAgIG9wdGlvbnM6IFtdXG4gICAgQGRiLnNvdXJjZV90eXBlcy5maW5kKHt9KS5mZXRjaCAoc291cmNlVHlwZXMpID0+XG4gICAgICAjIEZpbGwgc291cmNlIHR5cGVzXG4gICAgICBzb3VyY2VUeXBlc1F1ZXN0aW9uLnNldE9wdGlvbnMgXy5tYXAoc291cmNlVHlwZXMsIChzdCkgPT4gW3N0LmNvZGUsIHN0Lm5hbWVdKVxuXG4gICAgc2F2ZUNhbmNlbEZvcm0gPSBuZXcgZm9ybXMuU2F2ZUNhbmNlbEZvcm1cbiAgICAgIGNvbnRlbnRzOiBbXG4gICAgICAgIHNvdXJjZVR5cGVzUXVlc3Rpb25cbiAgICAgICAgbmV3IGZvcm1zLlRleHRRdWVzdGlvblxuICAgICAgICAgIGlkOiAnbmFtZSdcbiAgICAgICAgICBtb2RlbDogQG1vZGVsXG4gICAgICAgICAgcHJvbXB0OiAnRW50ZXIgb3B0aW9uYWwgbmFtZSdcbiAgICAgICAgbmV3IGZvcm1zLlRleHRRdWVzdGlvblxuICAgICAgICAgIGlkOiAnZGVzYydcbiAgICAgICAgICBtb2RlbDogQG1vZGVsXG4gICAgICAgICAgcHJvbXB0OiAnRW50ZXIgb3B0aW9uYWwgZGVzY3JpcHRpb24nXG4gICAgICAgIG5ldyBmb3Jtcy5DaGVja1F1ZXN0aW9uXG4gICAgICAgICAgaWQ6ICdwcml2YXRlJ1xuICAgICAgICAgIG1vZGVsOiBAbW9kZWxcbiAgICAgICAgICBwcm9tcHQ6IFwiUHJpdmFjeVwiXG4gICAgICAgICAgdGV4dDogJ1dhdGVyIHNvdXJjZSBpcyBwcml2YXRlJ1xuICAgICAgICAgIGhpbnQ6ICdUaGlzIHNob3VsZCBvbmx5IGJlIHVzZWQgZm9yIHNvdXJjZXMgdGhhdCBhcmUgbm90IHB1YmxpY2FsbHkgYWNjZXNzaWJsZSdcbiAgICAgICAgbmV3IGZvcm1zLlJhZGlvUXVlc3Rpb25cbiAgICAgICAgICBpZDogJ3NldExvY2F0aW9uJ1xuICAgICAgICAgIG1vZGVsOiBAbW9kZWxcbiAgICAgICAgICBwcm9tcHQ6ICdTZXQgdG8gY3VycmVudCBsb2NhdGlvbj8nXG4gICAgICAgICAgb3B0aW9uczogW1t0cnVlLCAnWWVzJ10sIFtmYWxzZSwgJ05vJ11dXG4gICAgICBdXG5cbiAgICBAJGVsLmVtcHR5KCkuYXBwZW5kKHNhdmVDYW5jZWxGb3JtLmVsKVxuXG4gICAgQGxpc3RlblRvIHNhdmVDYW5jZWxGb3JtLCAnc2F2ZScsID0+XG4gICAgICBzb3VyY2UgPSBfLnBpY2soQG1vZGVsLnRvSlNPTigpLCAnbmFtZScsICdkZXNjJywgJ3R5cGUnLCAncHJpdmF0ZScpXG4gICAgICBzb3VyY2UuY29kZSA9IFwiXCIrTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpKjEwMDAwMDApICAjIFRPRE8gcmVhbCBjb2Rlc1xuXG4gICAgICBzb3VyY2UudXNlciA9IEBsb2dpbi51c2VyXG4gICAgICBzb3VyY2Uub3JnID0gQGxvZ2luLm9yZ1xuXG4gICAgICBAZGIuc291cmNlcy51cHNlcnQgc291cmNlLCAoc291cmNlKSA9PiBcbiAgICAgICAgQHBhZ2VyLmNsb3NlUGFnZShTb3VyY2VQYWdlLCB7IF9pZDogc291cmNlLl9pZCwgc2V0TG9jYXRpb246IEBtb2RlbC5nZXQoJ3NldExvY2F0aW9uJyl9KVxuXG4gICAgQGxpc3RlblRvIHNhdmVDYW5jZWxGb3JtLCAnY2FuY2VsJywgPT5cbiAgICAgIEBwYWdlci5jbG9zZVBhZ2UoKVxuICIsIlBhZ2UgPSByZXF1aXJlKFwiLi4vUGFnZVwiKVxuTG9jYXRpb25WaWV3ID0gcmVxdWlyZSAoXCIuLi9Mb2NhdGlvblZpZXdcIilcbmZvcm1zID0gcmVxdWlyZSAnLi4vZm9ybXMnXG5cblxuIyBEaXNwbGF5cyBhIHNvdXJjZVxuIyBPcHRpb25zOiBzZXRMb2NhdGlvbiAtIHRydWUgdG8gYXV0b3NldCBsb2NhdGlvblxuIyBvblNlbGVjdCAtIGNhbGwgd2hlbiBzb3VyY2UgaXMgc2VsZWN0ZWQgdmlhIGJ1dHRvbiB0aGF0IGFwcGVhcnNcbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgU291cmNlUGFnZSBleHRlbmRzIFBhZ2VcbiAgZXZlbnRzOlxuICAgICdjbGljayAjZWRpdF9zb3VyY2VfYnV0dG9uJyA6ICdlZGl0U291cmNlJ1xuICAgICdjbGljayAjYWRkX3Rlc3RfYnV0dG9uJyA6ICdhZGRUZXN0J1xuICAgICdjbGljayAjYWRkX25vdGVfYnV0dG9uJyA6ICdhZGROb3RlJ1xuICAgICdjbGljayAudGVzdCcgOiAnb3BlblRlc3QnXG4gICAgJ2NsaWNrIC5ub3RlJyA6ICdvcGVuTm90ZSdcbiAgICAnY2xpY2sgI3NlbGVjdF9zb3VyY2UnIDogJ3NlbGVjdFNvdXJjZSdcblxuICBjcmVhdGU6IC0+XG4gICAgQHNldExvY2F0aW9uID0gQG9wdGlvbnMuc2V0TG9jYXRpb25cblxuICBhY3RpdmF0ZTogLT5cbiAgICBAZGIuc291cmNlcy5maW5kT25lIHtfaWQ6IEBvcHRpb25zLl9pZH0sIChzb3VyY2UpID0+XG4gICAgICBAc291cmNlID0gc291cmNlXG4gICAgICBAcmVuZGVyKClcblxuICAgICAgIyBIaWRlIGFkZC9lZGl0IGlmIG5vdCBhdXRob3JpemVkXG4gICAgICBAJChcIiNlZGl0X3NvdXJjZV9idXR0b25cIikudG9nZ2xlKEBhdXRoLnVwZGF0ZShcInNvdXJjZXNcIiwgc291cmNlKSlcbiAgICAgIEAkKFwiI2FkZF90ZXN0X2J1dHRvblwiKS50b2dnbGUoQGF1dGguaW5zZXJ0KFwidGVzdHNcIikpXG4gICAgICBAJChcIiNhZGRfbm90ZV9idXR0b25cIikudG9nZ2xlKEBhdXRoLmluc2VydChcInNvdXJjZV9ub3Rlc1wiKSlcblxuICByZW5kZXI6IC0+XG4gICAgQHNldFRpdGxlIFwiU291cmNlIFwiICsgQHNvdXJjZS5jb2RlXG5cbiAgICBpZiBAYXV0aC5yZW1vdmUoXCJzb3VyY2VzXCIsIEBzb3VyY2UpXG4gICAgICBAc2V0dXBDb250ZXh0TWVudSBbXG4gICAgICAgIHsgZ2x5cGg6ICdyZW1vdmUnLCB0ZXh0OiBcIkRlbGV0ZSBTb3VyY2VcIiwgY2xpY2s6ID0+IEBkZWxldGVTb3VyY2UoKSB9XG4gICAgICBdXG5cbiAgICBtZW51ID0gW11cbiAgICBpZiBAYXV0aC5pbnNlcnQoXCJ0ZXN0c1wiKVxuICAgICAgbWVudS5wdXNoKHsgdGV4dDogXCJTdGFydCBXYXRlciBUZXN0XCIsIGNsaWNrOiA9PiBAYWRkVGVzdCgpIH0pXG4gICAgaWYgQGF1dGguaW5zZXJ0KFwic291cmNlX25vdGVzXCIpXG4gICAgICBtZW51LnB1c2goeyB0ZXh0OiBcIkFkZCBOb3RlXCIsIGNsaWNrOiA9PiBAYWRkTm90ZSgpIH0pXG5cbiAgICBAc2V0dXBCdXR0b25CYXIgWyB7IGljb246IFwicGx1cy5wbmdcIiwgbWVudTogbWVudSB9IF1cblxuICAgICMgUmUtcmVuZGVyIHRlbXBsYXRlXG4gICAgQHJlbW92ZVN1YnZpZXdzKClcbiAgICBAJGVsLmh0bWwgdGVtcGxhdGVzWydwYWdlcy9Tb3VyY2VQYWdlJ10oc291cmNlOiBAc291cmNlLCBzZWxlY3Q6IEBvcHRpb25zLm9uU2VsZWN0PylcblxuICAgICMgU2V0IHNvdXJjZSB0eXBlXG4gICAgaWYgQHNvdXJjZS50eXBlP1xuICAgICAgQGRiLnNvdXJjZV90eXBlcy5maW5kT25lIHtjb2RlOiBAc291cmNlLnR5cGV9LCAoc291cmNlVHlwZSkgPT5cbiAgICAgICAgaWYgc291cmNlVHlwZT8gdGhlbiBAJChcIiNzb3VyY2VfdHlwZVwiKS50ZXh0KHNvdXJjZVR5cGUubmFtZSlcblxuICAgICMgQWRkIGxvY2F0aW9uIHZpZXdcbiAgICBsb2NhdGlvblZpZXcgPSBuZXcgTG9jYXRpb25WaWV3KGxvYzogQHNvdXJjZS5nZW8sIHJlYWRvbmx5OiBub3QgQGF1dGgudXBkYXRlKFwic291cmNlc1wiLCBAc291cmNlKSlcbiAgICBpZiBAc2V0TG9jYXRpb25cbiAgICAgIGxvY2F0aW9uVmlldy5zZXRMb2NhdGlvbigpXG4gICAgICBAc2V0TG9jYXRpb24gPSBmYWxzZVxuXG4gICAgQGxpc3RlblRvIGxvY2F0aW9uVmlldywgJ2xvY2F0aW9uc2V0JywgKGxvYykgLT5cbiAgICAgIEBzb3VyY2UuZ2VvID0gbG9jXG4gICAgICBAZGIuc291cmNlcy51cHNlcnQgQHNvdXJjZSwgPT4gQHJlbmRlcigpXG5cbiAgICBAbGlzdGVuVG8gbG9jYXRpb25WaWV3LCAnbWFwJywgKGxvYykgPT5cbiAgICAgIEBwYWdlci5vcGVuUGFnZShyZXF1aXJlKFwiLi9Tb3VyY2VNYXBQYWdlXCIpLCB7aW5pdGlhbEdlbzogbG9jfSlcbiAgICAgIFxuICAgIEBhZGRTdWJ2aWV3KGxvY2F0aW9uVmlldylcbiAgICBAJChcIiNsb2NhdGlvblwiKS5hcHBlbmQobG9jYXRpb25WaWV3LmVsKVxuXG4gICAgIyBBZGQgdGVzdHNcbiAgICBAZGIudGVzdHMuZmluZCh7c291cmNlOiBAc291cmNlLmNvZGV9KS5mZXRjaCAodGVzdHMpID0+XG4gICAgICBAJChcIiN0ZXN0c1wiKS5odG1sIHRlbXBsYXRlc1sncGFnZXMvU291cmNlUGFnZV90ZXN0cyddKHRlc3RzOnRlc3RzKVxuXG4gICAgICAjIEZpbGwgaW4gbmFtZXNcbiAgICAgIGZvciB0ZXN0IGluIHRlc3RzXG4gICAgICAgIEBkYi5mb3Jtcy5maW5kT25lIHsgY29kZTp0ZXN0LnR5cGUgfSwgeyBtb2RlOiBcImxvY2FsXCIgfSwgKGZvcm0pID0+XG4gICAgICAgICAgQCQoXCIjdGVzdF9uYW1lX1wiK3Rlc3QuX2lkKS50ZXh0KGZvcm0ubmFtZSBpZiBmb3JtIGVsc2UgXCI/Pz9cIilcblxuICAgICMgQWRkIG5vdGVzXG4gICAgQGRiLnNvdXJjZV9ub3Rlcy5maW5kKHtzb3VyY2U6IEBzb3VyY2UuY29kZX0pLmZldGNoIChub3RlcykgPT4gXG4gICAgICBAJChcIiNub3Rlc1wiKS5odG1sIHRlbXBsYXRlc1sncGFnZXMvU291cmNlUGFnZV9ub3RlcyddKG5vdGVzOm5vdGVzKVxuXG4gICAgIyBBZGQgcGhvdG9zXG4gICAgcGhvdG9zVmlldyA9IG5ldyBmb3Jtcy5JbWFnZXNRdWVzdGlvblxuICAgICAgaWQ6ICdwaG90b3MnXG4gICAgICBtb2RlbDogbmV3IEJhY2tib25lLk1vZGVsKEBzb3VyY2UpXG4gICAgICBjdHg6IEBjdHhcbiAgICAgIHJlYWRvbmx5OiBub3QgQGF1dGgudXBkYXRlKFwic291cmNlc1wiLCBAc291cmNlKVxuICAgICAgXG4gICAgcGhvdG9zVmlldy5tb2RlbC5vbiAnY2hhbmdlJywgPT5cbiAgICAgIEBkYi5zb3VyY2VzLnVwc2VydCBAc291cmNlLnRvSlNPTigpLCA9PiBAcmVuZGVyKClcbiAgICBAJCgnI3Bob3RvcycpLmFwcGVuZChwaG90b3NWaWV3LmVsKVxuXG4gIGVkaXRTb3VyY2U6IC0+XG4gICAgQHBhZ2VyLm9wZW5QYWdlKHJlcXVpcmUoXCIuL1NvdXJjZUVkaXRQYWdlXCIpLCB7IF9pZDogQHNvdXJjZS5faWR9KVxuXG4gIGRlbGV0ZVNvdXJjZTogLT5cbiAgICBpZiBAYXV0aC5yZW1vdmUoXCJzb3VyY2VzXCIsIEBzb3VyY2UpIGFuZCBjb25maXJtKFwiUGVybWFuZW50bHkgZGVsZXRlIHNvdXJjZT9cIilcbiAgICAgIEBkYi5zb3VyY2VzLnJlbW92ZSBAc291cmNlLl9pZCwgPT5cbiAgICAgICAgQHBhZ2VyLmNsb3NlUGFnZSgpXG4gICAgICAgIEBwYWdlci5mbGFzaCBcIlNvdXJjZSBkZWxldGVkXCIsIFwic3VjY2Vzc1wiXG5cbiAgYWRkVGVzdDogLT5cbiAgICBAcGFnZXIub3BlblBhZ2UocmVxdWlyZShcIi4vTmV3VGVzdFBhZ2VcIiksIHsgc291cmNlOiBAc291cmNlLmNvZGV9KVxuXG4gIG9wZW5UZXN0OiAoZXYpIC0+XG4gICAgQHBhZ2VyLm9wZW5QYWdlKHJlcXVpcmUoXCIuL1Rlc3RQYWdlXCIpLCB7IF9pZDogZXYuY3VycmVudFRhcmdldC5pZH0pXG5cbiAgYWRkTm90ZTogLT5cbiAgICBAcGFnZXIub3BlblBhZ2UocmVxdWlyZShcIi4vU291cmNlTm90ZVBhZ2VcIiksIHsgc291cmNlOiBAc291cmNlLmNvZGV9KSAgICMgVE9ETyBpZCBvciBjb2RlP1xuXG4gIG9wZW5Ob3RlOiAoZXYpIC0+XG4gICAgQHBhZ2VyLm9wZW5QYWdlKHJlcXVpcmUoXCIuL1NvdXJjZU5vdGVQYWdlXCIpLCB7IHNvdXJjZTogQHNvdXJjZS5jb2RlLCBfaWQ6IGV2LmN1cnJlbnRUYXJnZXQuaWR9KVxuXG4gIHNlbGVjdFNvdXJjZTogLT5cbiAgICBpZiBAb3B0aW9ucy5vblNlbGVjdD9cbiAgICAgIEBwYWdlci5jbG9zZVBhZ2UoKVxuICAgICAgQG9wdGlvbnMub25TZWxlY3QoQHNvdXJjZSkiLCJQYWdlID0gcmVxdWlyZSBcIi4uL1BhZ2VcIlxuU291cmNlUGFnZSA9IHJlcXVpcmUgXCIuL1NvdXJjZVBhZ2VcIlxuSXRlbVRyYWNrZXIgPSByZXF1aXJlIFwiLi4vSXRlbVRyYWNrZXJcIlxuTG9jYXRpb25GaW5kZXIgPSByZXF1aXJlICcuLi9Mb2NhdGlvbkZpbmRlcidcbkdlb0pTT04gPSByZXF1aXJlICcuLi9HZW9KU09OJ1xuXG4jIE1hcCBvZiB3YXRlciBzb3VyY2VzLiBPcHRpb25zIGluY2x1ZGU6XG4jIGluaXRpYWxHZW86IEdlb21ldHJ5IHRvIHpvb20gdG8uIFBvaW50IG9ubHkgc3VwcG9ydGVkLlxuY2xhc3MgU291cmNlTWFwUGFnZSBleHRlbmRzIFBhZ2VcbiAgY3JlYXRlOiAtPlxuICAgIEBzZXRUaXRsZSBcIlNvdXJjZSBNYXBcIlxuXG4gICAgIyBDYWxjdWxhdGUgaGVpZ2h0XG4gICAgQCRlbC5odG1sIHRlbXBsYXRlc1sncGFnZXMvU291cmNlTWFwUGFnZSddKClcblxuICAgIEwuSWNvbi5EZWZhdWx0LmltYWdlUGF0aCA9IFwiaW1nL2xlYWZsZXRcIlxuICAgIEBtYXAgPSBMLm1hcCh0aGlzLiQoXCIjbWFwXCIpWzBdKVxuICAgIEwuY29udHJvbC5zY2FsZShpbXBlcmlhbDpmYWxzZSkuYWRkVG8oQG1hcClcbiAgICBAcmVzaXplTWFwKClcblxuICAgICMgUmVjYWxjdWxhdGUgb24gcmVzaXplXG4gICAgJCh3aW5kb3cpLm9uKCdyZXNpemUnLCBAcmVzaXplTWFwKVxuXG4gICAgIyBTZXR1cCBtYXAgdGlsZXNcbiAgICBzZXR1cE1hcFRpbGVzKCkuYWRkVG8oQG1hcClcblxuICAgICMgU2V0dXAgbWFya2VyIGRpc3BsYXlcbiAgICBAc291cmNlRGlzcGxheSA9IG5ldyBTb3VyY2VEaXNwbGF5KEBtYXAsIEBkYiwgQHBhZ2VyKVxuXG4gICAgIyBUT0RPIHpvb20gdG8gbGFzdCBrbm93biBib3VuZHNcbiAgICBcbiAgICAjIFNldHVwIGluaXRpYWwgem9vbVxuICAgIGlmIEBvcHRpb25zLmluaXRpYWxHZW8gYW5kIEBvcHRpb25zLmluaXRpYWxHZW8udHlwZT09XCJQb2ludFwiXG4gICAgICBAbWFwLnNldFZpZXcoTC5HZW9KU09OLmNvb3Jkc1RvTGF0TG5nKEBvcHRpb25zLmluaXRpYWxHZW8uY29vcmRpbmF0ZXMpLCAxNSlcblxuICAgICMgU2V0dXAgbG9jYWx0aW9uIGRpc3BsYXlcbiAgICBAbG9jYXRpb25EaXNwbGF5ID0gbmV3IExvY2F0aW9uRGlzcGxheShAbWFwLCBub3QgQG9wdGlvbnMuaW5pdGlhbEdlbz8pXG5cbiAgZGVzdHJveTogLT5cbiAgICAkKHdpbmRvdykub2ZmKCdyZXNpemUnLCBAcmVzaXplTWFwKVxuICAgIEBsb2NhdGlvbkRpc3BsYXkuc3RvcCgpXG5cbiAgcmVzaXplTWFwOiA9PlxuICAgICMgQ2FsY3VsYXRlIG1hcCBoZWlnaHRcbiAgICBtYXBIZWlnaHQgPSAkKFwiaHRtbFwiKS5oZWlnaHQoKSAtIDQwXG4gICAgJChcIiNtYXBcIikuY3NzKFwiaGVpZ2h0XCIsIG1hcEhlaWdodCArIFwicHhcIilcbiAgICBAbWFwLmludmFsaWRhdGVTaXplKClcblxuXG5zZXR1cE1hcFRpbGVzID0gLT5cbiAgbWFwcXVlc3RVcmwgPSAnaHR0cDovL3tzfS5tcWNkbi5jb20vdGlsZXMvMS4wLjAvb3NtL3t6fS97eH0ve3l9LnBuZydcbiAgc3ViRG9tYWlucyA9IFsnb3RpbGUxJywnb3RpbGUyJywnb3RpbGUzJywnb3RpbGU0J11cbiAgbWFwcXVlc3RBdHRyaWIgPSAnRGF0YSwgaW1hZ2VyeSBhbmQgbWFwIGluZm9ybWF0aW9uIHByb3ZpZGVkIGJ5IDxhIGhyZWY9XCJodHRwOi8vb3Blbi5tYXBxdWVzdC5jby51a1wiIHRhcmdldD1cIl9ibGFua1wiPk1hcFF1ZXN0PC9hPiwgPGEgaHJlZj1cImh0dHA6Ly93d3cub3BlbnN0cmVldG1hcC5vcmcvXCIgdGFyZ2V0PVwiX2JsYW5rXCI+T3BlblN0cmVldE1hcDwvYT4gYW5kIGNvbnRyaWJ1dG9ycy4nXG4gIHJldHVybiBuZXcgTC5UaWxlTGF5ZXIobWFwcXVlc3RVcmwsIHttYXhab29tOiAxOCwgYXR0cmlidXRpb246IG1hcHF1ZXN0QXR0cmliLCBzdWJkb21haW5zOiBzdWJEb21haW5zfSlcblxuY2xhc3MgU291cmNlRGlzcGxheVxuICBjb25zdHJ1Y3RvcjogKG1hcCwgZGIsIHBhZ2VyKSAtPlxuICAgIEBtYXAgPSBtYXBcbiAgICBAZGIgPSBkYlxuICAgIEBwYWdlciA9IHBhZ2VyXG4gICAgQGl0ZW1UcmFja2VyID0gbmV3IEl0ZW1UcmFja2VyKClcblxuICAgIEBzb3VyY2VNYXJrZXJzID0ge31cbiAgICBAbWFwLm9uKCdtb3ZlZW5kJywgQHVwZGF0ZU1hcmtlcnMpXG5cbiAgICBAaWNvbiA9IG5ldyBMLmljb25cbiAgICAgIGljb25Vcmw6ICdpbWcvRHJvcE1hcmtlci5wbmcnXG4gICAgICBpY29uUmV0aW5hVXJsOiAnaW1nL0Ryb3BNYXJrZXJAMngucG5nJ1xuICAgICAgaWNvblNpemU6IFsyNywgNDFdLFxuICAgICAgaWNvbkFuY2hvcjogWzEzLCA0MV1cbiAgICAgIHBvcHVwQW5jaG9yOiBbLTMsIC00MV1cbiAgXG4gIHVwZGF0ZU1hcmtlcnM6ID0+XG4gICAgIyBHZXQgYm91bmRzIHBhZGRlZFxuICAgIGJvdW5kcyA9IEBtYXAuZ2V0Qm91bmRzKCkucGFkKDAuMzMpXG5cbiAgICBib3VuZHNHZW9KU09OID0gR2VvSlNPTi5sYXRMbmdCb3VuZHNUb0dlb0pTT04oYm91bmRzKVxuICAgIHNlbGVjdG9yID0geyBnZW86IHsgJGdlb0ludGVyc2VjdHM6IHsgJGdlb21ldHJ5OiBib3VuZHNHZW9KU09OIH0gfSB9XG5cbiAgICAjIFF1ZXJ5IHNvdXJjZXMgd2l0aCBwcm9qZWN0aW9uLiBVc2UgcmVtb3RlIG1vZGUgc28gbm8gY2FjaGluZyBvY2N1cnNcbiAgICBAZGIuc291cmNlcy5maW5kKHNlbGVjdG9yLCB7IHNvcnQ6IFtcIl9pZFwiXSwgbGltaXQ6IDEwMCwgbW9kZTogXCJyZW1vdGVcIiwgZmllbGRzOiB7IGdlbzogMSB9IH0pLmZldGNoIChzb3VyY2VzKSA9PlxuICAgICAgIyBGaW5kIG91dCB3aGljaCB0byBhZGQvcmVtb3ZlXG4gICAgICBbYWRkcywgcmVtb3Zlc10gPSBAaXRlbVRyYWNrZXIudXBkYXRlKHNvdXJjZXMpXG5cbiAgICAgICMgUmVtb3ZlIG9sZCBtYXJrZXJzXG4gICAgICBmb3IgcmVtb3ZlIGluIHJlbW92ZXNcbiAgICAgICAgQHJlbW92ZVNvdXJjZU1hcmtlcihyZW1vdmUpXG4gICAgICBmb3IgYWRkIGluIGFkZHNcbiAgICAgICAgQGFkZFNvdXJjZU1hcmtlcihhZGQpXG5cbiAgYWRkU291cmNlTWFya2VyOiAoc291cmNlKSAtPlxuICAgIGlmIHNvdXJjZS5nZW8/XG4gICAgICBsYXRsbmcgPSBuZXcgTC5MYXRMbmcoc291cmNlLmdlby5jb29yZGluYXRlc1sxXSwgc291cmNlLmdlby5jb29yZGluYXRlc1swXSlcbiAgICAgIG1hcmtlciA9IG5ldyBMLk1hcmtlcihsYXRsbmcsIHtpY29uOkBpY29ufSlcbiAgICAgIFxuICAgICAgbWFya2VyLm9uICdjbGljaycsID0+XG4gICAgICAgIEBwYWdlci5vcGVuUGFnZShTb3VyY2VQYWdlLCB7X2lkOiBzb3VyY2UuX2lkfSlcbiAgICAgIFxuICAgICAgQHNvdXJjZU1hcmtlcnNbc291cmNlLl9pZF0gPSBtYXJrZXJcbiAgICAgIG1hcmtlci5hZGRUbyhAbWFwKVxuXG4gIHJlbW92ZVNvdXJjZU1hcmtlcjogKHNvdXJjZSkgLT5cbiAgICBpZiBfLmhhcyhAc291cmNlTWFya2Vycywgc291cmNlLl9pZClcbiAgICAgIEBtYXAucmVtb3ZlTGF5ZXIoQHNvdXJjZU1hcmtlcnNbc291cmNlLl9pZF0pXG5cblxuY2xhc3MgTG9jYXRpb25EaXNwbGF5XG4gICMgU2V0dXAgZGlzcGxheSwgb3B0aW9uYWxseSB6b29taW5nIHRvIGN1cnJlbnQgbG9jYXRpb25cbiAgY29uc3RydWN0b3I6IChtYXAsIHpvb21UbykgLT5cbiAgICBAbWFwID0gbWFwXG4gICAgQHpvb21UbyA9IHpvb21Ub1xuXG4gICAgQGxvY2F0aW9uRmluZGVyID0gbmV3IExvY2F0aW9uRmluZGVyKClcbiAgICBAbG9jYXRpb25GaW5kZXIub24oJ2ZvdW5kJywgQGxvY2F0aW9uRm91bmQpLm9uKCdlcnJvcicsIEBsb2NhdGlvbkVycm9yKVxuICAgIEBsb2NhdGlvbkZpbmRlci5zdGFydFdhdGNoKClcblxuICBzdG9wOiAtPlxuICAgIEBsb2NhdGlvbkZpbmRlci5zdG9wV2F0Y2goKVxuXG4gIGxvY2F0aW9uRXJyb3I6IChlKSA9PlxuICAgIGlmIEB6b29tVG9cbiAgICAgIEBtYXAuZml0V29ybGQoKVxuICAgICAgQHpvb21UbyA9IGZhbHNlXG4gICAgICBhbGVydChcIlVuYWJsZSB0byBkZXRlcm1pbmUgbG9jYXRpb25cIilcblxuICBsb2NhdGlvbkZvdW5kOiAoZSkgPT5cbiAgICByYWRpdXMgPSBlLmNvb3Jkcy5hY2N1cmFjeVxuICAgIGxhdGxuZyA9IG5ldyBMLkxhdExuZyhlLmNvb3Jkcy5sYXRpdHVkZSwgZS5jb29yZHMubG9uZ2l0dWRlKVxuXG4gICAgIyBTZXQgcG9zaXRpb24gb25jZVxuICAgIGlmIEB6b29tVG9cbiAgICAgIHpvb20gPSAxNVxuICAgICAgQG1hcC5zZXRWaWV3KGxhdGxuZywgem9vbSlcbiAgICAgIEB6b29tVG8gPSBmYWxzZVxuXG4gICAgIyBSYWRpdXMgbGFyZ2VyIHRoYW4gMWttIG1lYW5zIG5vIGxvY2F0aW9uIHdvcnRoIGRpc3BsYXlpbmdcbiAgICBpZiByYWRpdXMgPiAxMDAwXG4gICAgICByZXR1cm5cblxuICAgICMgU2V0dXAgbWFya2VyIGFuZCBjaXJjbGVcbiAgICBpZiBub3QgQG1lTWFya2VyXG4gICAgICBpY29uID0gIEwuaWNvbihpY29uVXJsOiBcImltZy9teV9sb2NhdGlvbi5wbmdcIiwgaWNvblNpemU6IFsyMiwgMjJdKVxuICAgICAgQG1lTWFya2VyID0gTC5tYXJrZXIobGF0bG5nLCBpY29uOmljb24pLmFkZFRvKEBtYXApXG4gICAgICBAbWVDaXJjbGUgPSBMLmNpcmNsZShsYXRsbmcsIHJhZGl1cylcbiAgICAgIEBtZUNpcmNsZS5hZGRUbyhAbWFwKVxuICAgIGVsc2VcbiAgICAgIEBtZU1hcmtlci5zZXRMYXRMbmcobGF0bG5nKVxuICAgICAgQG1lQ2lyY2xlLnNldExhdExuZyhsYXRsbmcpLnNldFJhZGl1cyhyYWRpdXMpXG5cbm1vZHVsZS5leHBvcnRzID0gU291cmNlTWFwUGFnZSIsIlBhZ2UgPSByZXF1aXJlIFwiLi4vUGFnZVwiXG5UZXN0UGFnZSA9IHJlcXVpcmUgXCIuL1Rlc3RQYWdlXCJcblxuIyBQYXJhbWV0ZXIgaXMgb3B0aW9uYWwgc291cmNlIGNvZGVcbmNsYXNzIE5ld1Rlc3RQYWdlIGV4dGVuZHMgUGFnZVxuICBAY2FuT3BlbjogKGN0eCkgLT4gY3R4LmF1dGguaW5zZXJ0KFwidGVzdHNcIikgYW5kIGN0eC5sb2dpbi51c2VyXG5cbiAgZXZlbnRzOiBcbiAgICBcImNsaWNrIC50ZXN0XCIgOiBcInN0YXJ0VGVzdFwiXG5cbiAgYWN0aXZhdGU6IC0+XG4gICAgQHNldFRpdGxlIFwiU2VsZWN0IFRlc3RcIlxuXG4gICAgQGRiLmZvcm1zLmZpbmQoe3R5cGU6XCJXYXRlclRlc3RcIn0pLmZldGNoIChmb3JtcykgPT5cbiAgICAgIEBmb3JtcyA9IGZvcm1zXG4gICAgICBAJGVsLmh0bWwgdGVtcGxhdGVzWydwYWdlcy9OZXdUZXN0UGFnZSddKGZvcm1zOmZvcm1zKVxuXG4gIHN0YXJ0VGVzdDogKGV2KSAtPlxuICAgIHRlc3RDb2RlID0gZXYuY3VycmVudFRhcmdldC5pZFxuXG4gICAgIyBDcmVhdGUgdGVzdFxuICAgIHRlc3QgPSB7XG4gICAgICBzb3VyY2U6IEBvcHRpb25zLnNvdXJjZVxuICAgICAgdHlwZTogdGVzdENvZGVcbiAgICAgIGNvbXBsZXRlZDogbnVsbFxuICAgICAgc3RhcnRlZDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpXG4gICAgICB1c2VyOiBAbG9naW4udXNlclxuICAgICAgb3JnOiBAbG9naW4ub3JnXG4gICAgfVxuICAgIEBkYi50ZXN0cy51cHNlcnQgdGVzdCwgKHRlc3QpID0+XG4gICAgICBAcGFnZXIuY2xvc2VQYWdlKFRlc3RQYWdlLCB7IF9pZDogdGVzdC5faWQgfSlcblxubW9kdWxlLmV4cG9ydHMgPSBOZXdUZXN0UGFnZSIsIlBhZ2UgPSByZXF1aXJlICcuLi9QYWdlJ1xuZm9ybXMgPSByZXF1aXJlICcuLi9mb3JtcydcblxuIyBBbGxvd3MgY3JlYXRpbmcvZWRpdGluZyBvZiBzb3VyY2Ugbm90ZXNcbiMgT3B0aW9ucyBhcmUgXG4jIF9pZDogaWQgb2Ygc291cmNlIG5vdGVcbiMgc291cmNlOiBjb2RlIG9mIHNvdXJjZVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFNvdXJjZU5vdGVQYWdlIGV4dGVuZHMgUGFnZVxuICBAY2FuT3BlbjogKGN0eCkgLT4gY3R4LmF1dGgudXBkYXRlKFwic291cmNlX25vdGVzXCIpICYmIGN0eC5hdXRoLmluc2VydChcInNvdXJjZV9ub3Rlc1wiKSBcblxuICBhY3RpdmF0ZTogLT5cbiAgICAjIEZpbmQgd2F0ZXIgc291cmNlXG4gICAgQGRiLnNvdXJjZXMuZmluZE9uZSB7Y29kZTogQG9wdGlvbnMuc291cmNlfSwgKHNvdXJjZSkgPT5cbiAgICAgIEBzZXRUaXRsZSBcIk5vdGUgZm9yIFNvdXJjZSAje3NvdXJjZS5jb2RlfVwiXG5cbiAgICAgICMgQ3JlYXRlIG1vZGVsIFxuICAgICAgQG1vZGVsID0gbmV3IEJhY2tib25lLk1vZGVsKClcbiAgXG4gICAgICAjIENyZWF0ZSBxdWVzdGlvbnNcbiAgICAgIHNhdmVDYW5jZWxGb3JtID0gbmV3IGZvcm1zLlNhdmVDYW5jZWxGb3JtXG4gICAgICAgIGNvbnRlbnRzOiBbXG4gICAgICAgICAgbmV3IGZvcm1zLkRhdGVRdWVzdGlvblxuICAgICAgICAgICAgaWQ6ICdkYXRlJ1xuICAgICAgICAgICAgbW9kZWw6IEBtb2RlbFxuICAgICAgICAgICAgcHJvbXB0OiAnRGF0ZSBvZiBWaXNpdCdcbiAgICAgICAgICAgIHJlcXVpcmVkOiB0cnVlXG4gICAgICAgICAgbmV3IGZvcm1zLlJhZGlvUXVlc3Rpb25cbiAgICAgICAgICAgIGlkOiAnc3RhdHVzJ1xuICAgICAgICAgICAgbW9kZWw6IEBtb2RlbFxuICAgICAgICAgICAgcHJvbXB0OiAnU3RhdHVzIG9mIFdhdGVyIFNvdXJjZSdcbiAgICAgICAgICAgIG9wdGlvbnM6IFtbJ29rJywgJ0Z1bmN0aW9uYWwnXSwgWydtYWludCcsICdOZWVkcyBtYWludGVuYW5jZSddLCBbJ2Jyb2tlbicsICdOb24tZnVuY3Rpb25hbCddLCBbJ21pc3NpbmcnLCAnTm8gbG9uZ2VyIGV4aXN0cyddXVxuICAgICAgICAgICAgcmVxdWlyZWQ6IHRydWVcbiAgICAgICAgICBuZXcgZm9ybXMuVGV4dFF1ZXN0aW9uXG4gICAgICAgICAgICBpZDogJ25vdGVzJ1xuICAgICAgICAgICAgbW9kZWw6IEBtb2RlbFxuICAgICAgICAgICAgcHJvbXB0OiAnTm90ZXMnXG4gICAgICAgICAgICBtdWx0aWxpbmU6IHRydWVcbiAgICAgICAgXVxuXG4gICAgICAjIExvYWQgZm9ybSBmcm9tIHNvdXJjZSBub3RlIGlmIGV4aXN0c1xuICAgICAgaWYgQG9wdGlvbnMuX2lkXG4gICAgICAgIEBkYi5zb3VyY2Vfbm90ZXMuZmluZE9uZSB7X2lkOiBAb3B0aW9ucy5faWR9LCAoc291cmNlTm90ZSkgPT5cbiAgICAgICAgICBpZiBub3QgQGF1dGgudXBkYXRlKFwic291cmNlX25vdGVzXCIsIHNvdXJjZU5vdGUpXG4gICAgICAgICAgICByZXR1cm4gQHBhZ2VyLmNsb3NlUGFnZSgpXG4gICAgICAgICAgICBcbiAgICAgICAgICBAbW9kZWwuc2V0KHNvdXJjZU5vdGUpXG4gICAgICBlbHNlXG4gICAgICAgICMgQ3JlYXRlIGRlZmF1bHQgZW50cnlcbiAgICAgICAgQG1vZGVsLnNldChzb3VyY2U6IEBvcHRpb25zLnNvdXJjZSwgZGF0ZTogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnN1YnN0cmluZygwLDEwKSlcblxuICAgICAgQCRlbC5lbXB0eSgpLmFwcGVuZChzYXZlQ2FuY2VsRm9ybS5lbClcblxuICAgICAgQGxpc3RlblRvIHNhdmVDYW5jZWxGb3JtLCAnc2F2ZScsID0+XG4gICAgICAgIEBkYi5zb3VyY2Vfbm90ZXMudXBzZXJ0IEBtb2RlbC50b0pTT04oKSwgPT4gQHBhZ2VyLmNsb3NlUGFnZSgpXG5cbiAgICAgIEBsaXN0ZW5UbyBzYXZlQ2FuY2VsRm9ybSwgJ2NhbmNlbCcsID0+XG4gICAgICAgIEBwYWdlci5jbG9zZVBhZ2UoKVxuICIsIlBhZ2UgPSByZXF1aXJlICcuLi9QYWdlJ1xuZm9ybXMgPSByZXF1aXJlICcuLi9mb3JtcydcblxuIyBBbGxvd3MgZWRpdGluZyBvZiBzb3VyY2UgZGV0YWlsc1xubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBTb3VyY2VFZGl0UGFnZSBleHRlbmRzIFBhZ2VcbiAgQGNhbk9wZW46IChjdHgpIC0+IGN0eC5hdXRoLnVwZGF0ZShcInNvdXJjZXNcIilcblxuICBhY3RpdmF0ZTogLT5cbiAgICBAZGIuc291cmNlcy5maW5kT25lIHtfaWQ6IEBvcHRpb25zLl9pZH0sIChzb3VyY2UpID0+XG4gICAgICAjIENoZWNrIGF1dGhcbiAgICAgIGlmIG5vdCBAYXV0aC51cGRhdGUoXCJzb3VyY2VzXCIsIHNvdXJjZSlcbiAgICAgICAgcmV0dXJuIEBwYWdlci5jbG9zZVBhZ2UoKVxuXG4gICAgICBAc2V0VGl0bGUgXCJFZGl0IFNvdXJjZSAje3NvdXJjZS5jb2RlfVwiXG5cbiAgICAgICMgQ3JlYXRlIG1vZGVsIGZyb20gc291cmNlXG4gICAgICBAbW9kZWwgPSBuZXcgQmFja2JvbmUuTW9kZWwoc291cmNlKVxuICBcbiAgICAgICMgQ3JlYXRlIHF1ZXN0aW9uc1xuICAgICAgc291cmNlVHlwZXNRdWVzdGlvbiA9IG5ldyBmb3Jtcy5Ecm9wZG93blF1ZXN0aW9uXG4gICAgICAgIGlkOiAndHlwZSdcbiAgICAgICAgbW9kZWw6IEBtb2RlbFxuICAgICAgICBwcm9tcHQ6ICdFbnRlciBTb3VyY2UgVHlwZSdcbiAgICAgICAgb3B0aW9uczogW11cbiAgICAgIEBkYi5zb3VyY2VfdHlwZXMuZmluZCh7fSkuZmV0Y2ggKHNvdXJjZVR5cGVzKSA9PlxuICAgICAgICAjIEZpbGwgc291cmNlIHR5cGVzXG4gICAgICAgIHNvdXJjZVR5cGVzUXVlc3Rpb24uc2V0T3B0aW9ucyBfLm1hcChzb3VyY2VUeXBlcywgKHN0KSA9PiBbc3QuY29kZSwgc3QubmFtZV0pXG5cbiAgICAgIHNhdmVDYW5jZWxGb3JtID0gbmV3IGZvcm1zLlNhdmVDYW5jZWxGb3JtXG4gICAgICAgIGNvbnRlbnRzOiBbXG4gICAgICAgICAgc291cmNlVHlwZXNRdWVzdGlvblxuICAgICAgICAgIG5ldyBmb3Jtcy5UZXh0UXVlc3Rpb25cbiAgICAgICAgICAgIGlkOiAnbmFtZSdcbiAgICAgICAgICAgIG1vZGVsOiBAbW9kZWxcbiAgICAgICAgICAgIHByb21wdDogJ0VudGVyIG9wdGlvbmFsIG5hbWUnXG4gICAgICAgICAgbmV3IGZvcm1zLlRleHRRdWVzdGlvblxuICAgICAgICAgICAgaWQ6ICdkZXNjJ1xuICAgICAgICAgICAgbW9kZWw6IEBtb2RlbFxuICAgICAgICAgICAgcHJvbXB0OiAnRW50ZXIgb3B0aW9uYWwgZGVzY3JpcHRpb24nXG4gICAgICAgICAgbmV3IGZvcm1zLkNoZWNrUXVlc3Rpb25cbiAgICAgICAgICAgIGlkOiAncHJpdmF0ZSdcbiAgICAgICAgICAgIG1vZGVsOiBAbW9kZWxcbiAgICAgICAgICAgIHByb21wdDogXCJQcml2YWN5XCJcbiAgICAgICAgICAgIHRleHQ6ICdXYXRlciBzb3VyY2UgaXMgcHJpdmF0ZSdcbiAgICAgICAgICAgIGhpbnQ6ICdUaGlzIHNob3VsZCBvbmx5IGJlIHVzZWQgZm9yIHNvdXJjZXMgdGhhdCBhcmUgbm90IHB1YmxpY2FsbHkgYWNjZXNzaWJsZSdcbiAgICAgICAgXVxuXG4gICAgICBAJGVsLmVtcHR5KCkuYXBwZW5kKHNhdmVDYW5jZWxGb3JtLmVsKVxuXG4gICAgICBAbGlzdGVuVG8gc2F2ZUNhbmNlbEZvcm0sICdzYXZlJywgPT5cbiAgICAgICAgQGRiLnNvdXJjZXMudXBzZXJ0IEBtb2RlbC50b0pTT04oKSwgPT4gQHBhZ2VyLmNsb3NlUGFnZSgpXG5cbiAgICAgIEBsaXN0ZW5UbyBzYXZlQ2FuY2VsRm9ybSwgJ2NhbmNlbCcsID0+XG4gICAgICAgIEBwYWdlci5jbG9zZVBhZ2UoKVxuICIsIlBhZ2UgPSByZXF1aXJlIFwiLi4vUGFnZVwiXG5mb3JtcyA9IHJlcXVpcmUgJy4uL2Zvcm1zJ1xuXG5jbGFzcyBUZXN0UGFnZSBleHRlbmRzIFBhZ2VcbiAgQGNhbk9wZW46IChjdHgpIC0+IGN0eC5hdXRoLnVwZGF0ZShcInRlc3RzXCIpICYmIGN0eC5hdXRoLmluc2VydChcInRlc3RzXCIpIFxuXG4gIGNyZWF0ZTogLT4gQHJlbmRlcigpXG5cbiAgYWN0aXZhdGU6IC0+XG4gICAgQHNldHVwQ29udGV4dE1lbnUgW1xuICAgICAgeyBnbHlwaDogJ3JlbW92ZScsIHRleHQ6IFwiRGVsZXRlIFRlc3RcIiwgY2xpY2s6ID0+IEBkZWxldGVUZXN0KCkgfVxuICAgIF1cblxuICByZW5kZXI6IC0+XG4gICAgQHNldFRpdGxlIFwiV2F0ZXIgVGVzdFwiXG5cbiAgICAjIEdldCB0ZXN0XG4gICAgQGRiLnRlc3RzLmZpbmRPbmUge19pZDogQG9wdGlvbnMuX2lkfSwgKHRlc3QpID0+XG4gICAgICBAdGVzdCA9IHRlc3RcblxuICAgICAgIyBHZXQgZm9ybVxuICAgICAgQGRiLmZvcm1zLmZpbmRPbmUgeyB0eXBlOiBcIldhdGVyVGVzdFwiLCBjb2RlOiB0ZXN0LnR5cGUgfSwgKGZvcm0pID0+XG4gICAgICAgICMgQ2hlY2sgaWYgY29tcGxldGVkXG4gICAgICAgIGlmIG5vdCB0ZXN0LmNvbXBsZXRlZFxuICAgICAgICAgIEBmb3JtVmlldyA9IGZvcm1zLmluc3RhbnRpYXRlVmlldyhmb3JtLnZpZXdzLmVkaXQsIHsgY3R4OiBAY3R4IH0pXG5cbiAgICAgICAgICAjIExpc3RlbiB0byBldmVudHNcbiAgICAgICAgICBAbGlzdGVuVG8gQGZvcm1WaWV3LCAnY2hhbmdlJywgQHNhdmVcbiAgICAgICAgICBAbGlzdGVuVG8gQGZvcm1WaWV3LCAnY29tcGxldGUnLCBAY29tcGxldGVkXG4gICAgICAgICAgQGxpc3RlblRvIEBmb3JtVmlldywgJ2Nsb3NlJywgQGNsb3NlXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBAZm9ybVZpZXcgPSBmb3Jtcy5pbnN0YW50aWF0ZVZpZXcoZm9ybS52aWV3cy5kZXRhaWwsIHsgY3R4OiBAY3R4IH0pXG4gIFxuICAgICAgICBAJGVsLmh0bWwgdGVtcGxhdGVzWydwYWdlcy9UZXN0UGFnZSddKGNvbXBsZXRlZDogdGVzdC5jb21wbGV0ZWQsIHRpdGxlOiBmb3JtLm5hbWUpXG4gICAgICAgIEAkKCcjY29udGVudHMnKS5hcHBlbmQoQGZvcm1WaWV3LmVsKVxuXG4gICAgICAgIGlmIG5vdCBAYXV0aC51cGRhdGUoXCJ0ZXN0c1wiLCB0ZXN0KVxuICAgICAgICAgIEAkKFwiI2VkaXRfYnV0dG9uXCIpLmhpZGUoKVxuXG4gICAgICAgIEBmb3JtVmlldy5sb2FkIEB0ZXN0XG5cbiAgZXZlbnRzOlxuICAgIFwiY2xpY2sgI2VkaXRfYnV0dG9uXCIgOiBcImVkaXRcIlxuXG4gIGRlc3Ryb3k6IC0+XG4gICAgIyBMZXQga25vdyB0aGF0IHNhdmVkIGlmIGNsb3NlZCBpbmNvbXBsZXRlZFxuICAgIGlmIEB0ZXN0IGFuZCBub3QgQHRlc3QuY29tcGxldGVkXG4gICAgICBAcGFnZXIuZmxhc2ggXCJUZXN0IHNhdmVkIGFzIGRyYWZ0LlwiXG5cbiAgZWRpdDogLT5cbiAgICAjIE1hcmsgYXMgaW5jb21wbGV0ZVxuICAgIEB0ZXN0LmNvbXBsZXRlZCA9IG51bGxcbiAgICBAZGIudGVzdHMudXBzZXJ0IEB0ZXN0LCA9PiBAcmVuZGVyKClcblxuICBzYXZlOiA9PlxuICAgICMgU2F2ZSB0byBkYlxuICAgIEB0ZXN0ID0gQGZvcm1WaWV3LnNhdmUoKVxuICAgIEBkYi50ZXN0cy51cHNlcnQoQHRlc3QpXG5cbiAgY2xvc2U6ID0+XG4gICAgQHNhdmUoKVxuICAgIEBwYWdlci5jbG9zZVBhZ2UoKVxuXG4gIGNvbXBsZXRlZDogPT5cbiAgICAjIE1hcmsgYXMgY29tcGxldGVkXG4gICAgQHRlc3QuY29tcGxldGVkID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpXG4gICAgQGRiLnRlc3RzLnVwc2VydCBAdGVzdCwgPT4gQHJlbmRlcigpXG5cbiAgZGVsZXRlVGVzdDogLT5cbiAgICBpZiBjb25maXJtKFwiUGVybWFuZW50bHkgZGVsZXRlIHRlc3Q/XCIpXG4gICAgICBAZGIudGVzdHMucmVtb3ZlIEB0ZXN0Ll9pZCwgPT5cbiAgICAgICAgQHRlc3QgPSBudWxsXG4gICAgICAgIEBwYWdlci5jbG9zZVBhZ2UoKVxuICAgICAgICBAcGFnZXIuZmxhc2ggXCJUZXN0IGRlbGV0ZWRcIiwgXCJzdWNjZXNzXCJcblxubW9kdWxlLmV4cG9ydHMgPSBUZXN0UGFnZSJdfQ==
;