require=(function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
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


},{"../app/js/GeoJSON":2}],3:[function(require,module,exports){
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
      this.db = this.hybrid;
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


},{"../app/js/db/LocalDb":4,"../app/js/db/HybridDb":5,"./db_queries":6}],7:[function(require,module,exports){
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


},{"forms":"EAVIrc","../app/js/pages/ImagePage":8,"./helpers/UIDriver":9}],10:[function(require,module,exports){
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


},{"forms":"EAVIrc","./helpers/UIDriver":9,"../app/js/pages/ImagePage":8}],11:[function(require,module,exports){
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


},{"forms":"EAVIrc","./helpers/UIDriver":9}],12:[function(require,module,exports){
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


},{"../app/js/ItemTracker":13}],14:[function(require,module,exports){
(function() {
  var LocalDb, assert, db_queries;

  assert = chai.assert;

  LocalDb = require("../app/js/db/LocalDb");

  db_queries = require("./db_queries");

  describe('LocalDb', function() {
    before(function() {
      return this.db = new LocalDb();
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
      return this.db = new LocalDb({
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
        db2 = new LocalDb({
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
        db2 = new LocalDb({
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
          db2 = new LocalDb({
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
      return this.db = new LocalDb();
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
        db2 = new LocalDb();
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
        db2 = new LocalDb();
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
          db2 = new LocalDb();
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


},{"../app/js/db/LocalDb":4,"./db_queries":6}],15:[function(require,module,exports){
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


},{"./helpers/UIDriver":9,"../app/js/LocationView":16}],17:[function(require,module,exports){
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


},{"../app/js/db/RemoteDb":18,"./db_queries":6}],19:[function(require,module,exports){
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


},{"../app/js/auth":20}],21:[function(require,module,exports){
(function() {
  var JsonServer, assert, sourcecodes;

  assert = chai.assert;

  sourcecodes = require('../app/js/sourcecodes');

  JsonServer = require('./helpers/JsonServer');

  describe("Source Code Manager", function() {
    beforeEach(function() {
      this.mgr = new sourcecodes.SourceCodesManager("source_codes");
      this.mgr.reset();
      return this.server = new JsonServer();
    });
    afterEach(function() {
      return this.server.teardown();
    });
    it("Fails to return codes initially", function(done) {
      var cutoff, error, success;
      success = function() {
        return assert.fail();
      };
      error = function() {
        return done();
      };
      cutoff = "2012-01-01T00:00:00Z";
      return this.mgr.requestCode(success, error, cutoff);
    });
    it("Calls server for more codes if none", function(done) {
      var cutoff, error, success,
        _this = this;
      this.server.respond("POST", "source_codes", function(request) {
        assert.equal(request.params.number, 1);
        return [
          {
            code: 10007,
            expiry: "2013-01-01T00:00:00Z"
          }, {
            code: 10014,
            expiry: "2013-01-01T00:00:00Z"
          }
        ];
      });
      success = function(code) {
        assert.equal(code, 10007);
        return done();
      };
      error = function() {
        return assert.fail();
      };
      cutoff = "2012-01-01T00:00:00Z";
      return this.mgr.requestCode(success, error, cutoff);
    });
    it("Returns non-expired codes if present", function(done) {
      var cutoff, error, success,
        _this = this;
      this.mgr.setLocalCodes([
        {
          code: 10007,
          expiry: "2012-01-01T00:00:00Z"
        }, {
          code: 10014,
          expiry: "2013-01-01T00:00:00Z"
        }
      ]);
      success = function(code) {
        var cutoff, error;
        assert.equal(code, 10014);
        success = function() {
          return assert.fail();
        };
        error = function() {
          return done();
        };
        cutoff = "2010-01-01T00:00:00Z";
        return _this.mgr.requestCode(success, error, cutoff);
      };
      error = function() {
        return assert.fail();
      };
      cutoff = "2012-06-01T00:00:00Z";
      return this.mgr.requestCode(success, error, cutoff);
    });
    it("Return number of non-expired codes", function(done) {
      var cutoff;
      this.mgr.setLocalCodes([
        {
          code: 10007,
          expiry: "2012-01-01T00:00:00Z"
        }, {
          code: 10014,
          expiry: "2013-01-01T00:00:00Z"
        }
      ]);
      cutoff = "2012-06-01T00:00:00Z";
      assert.equal(this.mgr.getNumberAvailableCodes(cutoff), 1);
      return done();
    });
    return it("Stores codes in local storage", function() {
      var cutoff, mgr2;
      this.mgr.setLocalCodes([
        {
          code: 10007,
          expiry: "2012-01-01T00:00:00Z"
        }, {
          code: 10014,
          expiry: "2013-01-01T00:00:00Z"
        }
      ]);
      cutoff = "2012-06-01T00:00:00Z";
      mgr2 = new sourcecodes.SourceCodesManager();
      return assert.equal(mgr2.getNumberAvailableCodes(cutoff), 1);
    });
  });

}).call(this);


},{"../app/js/sourcecodes":22,"./helpers/JsonServer":23}],24:[function(require,module,exports){
(function() {
  var assert, sync;

  assert = chai.assert;

  sync = require('../app/js/sync');

  describe("Repeater", function() {
    it("calls action every n milliseconds", function(done) {
      var count,
        _this = this;
      count = 0;
      this.repeater = new sync.Repeater(function(success, error) {
        count += 1;
        return success();
      });
      this.repeater.start(10);
      return setTimeout(function() {
        _this.repeater.stop();
        assert.closeTo(count, 10, 3);
        return done();
      }, 100);
    });
    it("does not call action if still in progress", function(done) {
      var count,
        _this = this;
      count = 0;
      this.repeater = new sync.Repeater(function(success, error) {
        count += 1;
        return setTimeout(function() {
          return success();
        }, 200);
      });
      this.repeater.start(10);
      return setTimeout(function() {
        _this.repeater.stop();
        assert.equal(count, 1);
        return done();
      }, 100);
    });
    it("calls action right away if called", function(done) {
      var count;
      count = 0;
      this.repeater = new sync.Repeater(function(success, error) {
        count += 1;
        return success();
      });
      this.repeater.perform();
      assert.equal(count, 1);
      return done();
    });
    it("stops on request", function(done) {
      var count,
        _this = this;
      count = 0;
      this.repeater = new sync.Repeater(function(success, error) {
        count += 1;
        if (count === 10) {
          _this.repeater.stop();
        }
        return success();
      });
      this.repeater.start(10);
      return setTimeout(function() {
        assert.equal(count, 10);
        return done();
      }, 200);
    });
    it("records last error", function(done) {
      var _this = this;
      this.repeater = new sync.Repeater(function(success, error) {
        return error("some message");
      });
      this.repeater.start(10);
      return setTimeout(function() {
        _this.repeater.stop();
        assert.equal(_this.repeater.lastError, "some message");
        return done();
      }, 100);
    });
    it("records last success date", function(done) {
      var before,
        _this = this;
      before = new Date();
      this.repeater = new sync.Repeater(function(success, error) {
        return success();
      });
      this.repeater.start(10);
      return setTimeout(function() {
        _this.repeater.stop();
        assert.isTrue(new Date() > _this.repeater.lastSuccessDate);
        assert.isTrue(before < _this.repeater.lastSuccessDate);
        return done();
      }, 100);
    });
    return it("clears last error on success", function(done) {
      var count,
        _this = this;
      count = 0;
      this.repeater = new sync.Repeater(function(success, error) {
        count += 1;
        if (count < 3) {
          return error("some message");
        } else {
          return success();
        }
      });
      this.repeater.start(10);
      return setTimeout(function() {
        _this.repeater.stop();
        assert.isFalse(_this.repeater.lastError != null);
        return done();
      }, 100);
    });
  });

  describe("Synchronizer", function() {
    before(function() {
      var _this = this;
      this.c1 = 0;
      this.c2 = 0;
      this.c3 = 0;
      this.hybridDb = {
        upload: function(success, error) {
          _this.c1 += 1;
          return success();
        }
      };
      this.imageManager = {
        upload: function(progress, success, error) {
          _this.c1 += 1;
          return success();
        }
      };
      return this.sourceCodesManager = {
        replenishCodes: function(minNumber, success, error) {
          return success();
        }
      };
    });
    it("calls all things to be synched", function(done) {});
    return it("stops");
  });

}).call(this);


},{"../app/js/sync":25}],6:[function(require,module,exports){
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


},{"../app/js/GeoJSON":2}],"forms":[function(require,module,exports){
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


},{"./form-controls":26,"./DateQuestion":27,"./DropdownQuestion":28,"./NumberQuestion":29,"./QuestionGroup":30,"./SaveCancelForm":31,"./SourceQuestion":32,"./ImageQuestion":33,"./ImagesQuestion":34,"./Instructions":35}],2:[function(require,module,exports){
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


},{}],13:[function(require,module,exports){
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


},{}],9:[function(require,module,exports){
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


},{}],20:[function(require,module,exports){
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
  var DemoSourceCodesManager, SourceCodesManager;

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

  exports.SourceCodesManager = SourceCodesManager = (function() {
    var defaultCutoff;

    function SourceCodesManager(url) {
      this.url = url;
    }

    defaultCutoff = function() {
      var cutoff;
      cutoff = new Date();
      cutoff.setDate(cutoff.getDate() + 30 * 3);
      return cutoff.toISOString();
    };

    SourceCodesManager.prototype.getLocalCodes = function() {
      if (!localStorage.getItem("sourceCodes")) {
        return [];
      }
      return JSON.parse(localStorage.getItem("sourceCodes"));
    };

    SourceCodesManager.prototype.setLocalCodes = function(codes) {
      return localStorage.setItem("sourceCodes", JSON.stringify(codes));
    };

    SourceCodesManager.prototype.purgeCodes = function(cutoff) {
      return this.setLocalCodes(_.reject(this.getLocalCodes(), function(item) {
        return item.expiry < cutoff;
      }));
    };

    SourceCodesManager.prototype.replenishCodes = function(minNumber, success, error, cutoff) {
      var numNeeded, req,
        _this = this;
      cutoff = cutoff || defaultCutoff();
      this.purgeCodes(cutoff);
      numNeeded = minNumber - this.getLocalCodes().length;
      if (numNeeded <= 0) {
        success();
        return;
      }
      req = $.ajax(this.url, {
        data: JSON.stringify({
          number: numNeeded
        }),
        contentType: 'application/json',
        type: 'POST'
      });
      req.done(function(data, textStatus, jqXHR) {
        _this.setLocalCodes(_this.getLocalCodes().concat(data));
        return success();
      });
      return req.fail(function(jqXHR, textStatus, errorThrown) {
        if (error) {
          return error(errorThrown);
        }
      });
    };

    SourceCodesManager.prototype.getNumberAvailableCodes = function(cutoff) {
      cutoff = cutoff || defaultCutoff();
      this.purgeCodes(cutoff);
      return this.getLocalCodes().length;
    };

    SourceCodesManager.prototype.requestCode = function(success, error, cutoff) {
      var _this = this;
      return this.replenishCodes(1, (function() {
        var codes;
        codes = _this.getLocalCodes();
        _this.setLocalCodes(_.rest(codes));
        return success(_.first(codes).code);
      }), error, cutoff);
    };

    SourceCodesManager.prototype.reset = function() {
      return this.setLocalCodes([]);
    };

    return SourceCodesManager;

  })();

  exports.DemoSourceCodesManager = DemoSourceCodesManager = (function() {
    function DemoSourceCodesManager() {
      this.numAvail = 10;
    }

    DemoSourceCodesManager.prototype.getNumberAvailableCodes = function(cutoff) {
      return this.numAvail;
    };

    DemoSourceCodesManager.prototype.requestCode = function(success, error, cutoff) {
      return success(exports.seqToCode(Math.round(Math.random() * 1000000)));
    };

    DemoSourceCodesManager.prototype.replenishCodes = function(minNumber, success, error, cutoff) {
      this.numAvail = minNumber;
      return success();
    };

    return DemoSourceCodesManager;

  })();

}).call(this);


},{}],23:[function(require,module,exports){
(function() {
  var JsonServer,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  JsonServer = (function() {
    function JsonServer() {
      this.respond = __bind(this.respond, this);
      this.handle = __bind(this.handle, this);
      this.map = {};
      this.server = sinon.fakeServer.create();
      this.server.autoRespond = true;
      this.server.respondWith(this.handle);
    }

    JsonServer.prototype.handle = function(request) {
      var data, item;
      request.params = JSON.parse(request.requestBody);
      item = this.map[request.method + ":" + request.url];
      console.log(request.method + ":" + request.url);
      if (item) {
        data = item(request);
        console.log(data);
        request.respond(200, {
          "Content-Type": "application/json"
        }, JSON.stringify(data));
        return;
      }
      console.log("404");
      return request.respond(404);
    };

    JsonServer.prototype.respond = function(method, url, func) {
      return this.map[method + ":" + url] = func;
    };

    JsonServer.prototype.teardown = function() {
      return this.server.restore();
    };

    return JsonServer;

  })();

  module.exports = JsonServer;

}).call(this);


},{}],25:[function(require,module,exports){
(function() {
  var Repeater, Synchronizer,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  exports.Repeater = Repeater = (function() {
    function Repeater(action) {
      this.performRepeat = __bind(this.performRepeat, this);
      this.action = action;
      this.running = false;
      this.inprogress = false;
    }

    Repeater.prototype.start = function(every) {
      this.every = every;
      this.running = true;
      return setTimeout(this.performRepeat, every);
    };

    Repeater.prototype.stop = function() {
      return this.running = false;
    };

    Repeater.prototype.performRepeat = function() {
      var error, success,
        _this = this;
      if (!this.running) {
        return;
      }
      success = function() {
        _this.inprogress = false;
        if (_this.running) {
          setTimeout(_this.performRepeat, _this.every);
        }
        _this.lastSuccessDate = new Date();
        return _this.lastError = void 0;
      };
      error = function(err) {
        _this.inprogress = false;
        if (_this.running) {
          setTimeout(_this.performRepeat, _this.every);
        }
        return _this.lastError = err;
      };
      this.inprogress = true;
      return this.action(success, error);
    };

    Repeater.prototype.perform = function(success, error) {
      var error2, success2,
        _this = this;
      success2 = function() {
        _this.inprogress = false;
        _this.lastSuccessDate = new Date();
        _this.lastError = void 0;
        if (success != null) {
          return success();
        }
      };
      error2 = function(err) {
        _this.inprogress = false;
        _this.lastError = err;
        if (error != null) {
          return error(err);
        }
      };
      this.inprogress = true;
      return this.action(success2, error2);
    };

    return Repeater;

  })();

  exports.Synchronizer = Synchronizer = (function() {
    function Synchronizer(hybridDb, imageManager, sourceCodesManager) {
      this._sync = __bind(this._sync, this);
      this.hybridDb = hybridDb;
      this.imageManager = imageManager;
      this.sourceCodesManager = sourceCodesManager;
      this.repeater = new Repeater(this._sync);
    }

    Synchronizer.prototype.start = function(every) {
      return this.repeater.start(every);
    };

    Synchronizer.prototype.stop = function() {
      return this.repeater.stop();
    };

    Synchronizer.prototype.sync = function(success, error) {
      return this.repeater.perform(success, error);
    };

    Synchronizer.prototype._sync = function(success, error) {
      var success1,
        _this = this;
      success1 = function() {
        var success2;
        success2 = function() {
          var progress;
          progress = function() {};
          return _this.imageManager.upload(progress, success, error);
        };
        return _this.sourceCodesManager.replenishCodes(5, success2, error);
      };
      return this.hybridDb.upload(success1, error);
    };

    return Synchronizer;

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


},{}],16:[function(require,module,exports){
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


},{"./GeoJSON":2,"./LocationFinder":36}],4:[function(require,module,exports){
(function() {
  var Collection, LocalDb, compileSort, createUid, processFind;

  createUid = require('./utils').createUid;

  processFind = require('./utils').processFind;

  compileSort = require('./selector').compileSort;

  LocalDb = (function() {
    function LocalDb(options) {
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


},{"./selector":37,"./utils":38}],8:[function(require,module,exports){
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


},{"../Page":39}],5:[function(require,module,exports){
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
      _.extend(this, Backbone.Events);
    }

    HybridDb.prototype.addCollection = function(name) {
      var collection,
        _this = this;
      collection = new HybridCollection(name, this.localDb[name], this.remoteDb[name]);
      this[name] = collection;
      this.collections[name] = collection;
      return collection.on('change', function() {
        return _this.trigger('change');
      });
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
      _.extend(this, Backbone.Events);
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
      var _this = this;
      return this.localCol.upsert(doc, function(result) {
        _this.trigger('change');
        if (success != null) {
          return success(result);
        }
      }, error);
    };

    HybridCollection.prototype.remove = function(id, success, error) {
      var _this = this;
      return this.localCol.remove(id, function() {
        _this.trigger('change');
        if (success != null) {
          return success();
        }
      }, error);
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


},{"./utils":38}],26:[function(require,module,exports){
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
        if (this.options.readonly)
            answerEl.find(".radio-group").addClass("readonly");
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
            if (this.options.readonly)
                answerEl.find("textarea").attr("readonly", "readonly");
        } else {
            answerEl.html(_.template('<input type="text"/>', this));
            answerEl.find("input").val(this.model.get(this.id));
            if (this.options.readonly)
                answerEl.find("input").attr("readonly", "readonly");
        }
    },

    events : {
        "change" : "changed"
    },
    changed : function() {
        this.model.set(this.id, this.$(this.options.multiline ? "textarea" : "input").val());
    }

});

},{}],30:[function(require,module,exports){
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


},{}],35:[function(require,module,exports){
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


},{}],27:[function(require,module,exports){
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
      if (this.options.readonly) {
        return answerEl.find("input").attr('readonly', 'readonly');
      } else {
        return answerEl.find("input").scroller({
          preset: "date",
          theme: "ios",
          display: "modal",
          mode: "scroller",
          dateOrder: "yymmD dd",
          dateFormat: "yy-mm-dd"
        });
      }
    }
  });

}).call(this);


},{"./form-controls":26}],28:[function(require,module,exports){
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


},{"./form-controls":26}],29:[function(require,module,exports){
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


},{"./form-controls":26}],32:[function(require,module,exports){
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


},{"./form-controls":26,"../pages/SourceListPage":40,"../sourcecodes":22}],33:[function(require,module,exports){
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


},{"./form-controls":26,"../pages/ImagePage":8}],34:[function(require,module,exports){
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


},{"./form-controls":26,"../pages/ImagePage":8}],36:[function(require,module,exports){
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


},{}],39:[function(require,module,exports){
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


},{}],37:[function(require,module,exports){
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
},{"./EJSON":41}],38:[function(require,module,exports){
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


},{"./selector":37,"../GeoJSON":2}],40:[function(require,module,exports){
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
      if (this.login) {
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
                name: {
                  $regex: this.searchText,
                  $options: 'i'
                }
              }, {
                desc: {
                  $regex: this.searchText,
                  $options: 'i'
                }
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


},{"../Page":39,"./SourcePage":42,"../LocationFinder":36,"../GeoJSON":2,"./NewSourcePage":43}],41:[function(require,module,exports){
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
},{}],42:[function(require,module,exports){
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
      } else {
        this.setupContextMenu([]);
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
            return _this.$("#test_name_" + test._id).text(form ? form.name : "???");
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


},{"../Page":39,"../LocationView":16,"./SourceMapPage":44,"./SourceEditPage":45,"./NewTestPage":46,"./TestPage":47,"./SourceNotePage":48,"../forms":"EAVIrc"}],43:[function(require,module,exports){
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
        var error, source, success;
        source = _.pick(_this.model.toJSON(), 'name', 'desc', 'type', 'private');
        success = function(code) {
          source.code = code;
          source.user = _this.login.user;
          source.org = _this.login.org;
          return _this.db.sources.upsert(source, function(source) {
            return _this.pager.closePage(SourcePage, {
              _id: source._id,
              setLocation: _this.model.get('setLocation')
            });
          });
        };
        error = function() {
          return alert("Unable to generate source id. Please ensure that you have a connection or use Settings to obtain more before going out of connection range.");
        };
        return _this.sourceCodesManager.requestCode(success, error);
      });
      return this.listenTo(saveCancelForm, 'cancel', function() {
        return _this.pager.closePage();
      });
    };

    return NewSourcePage;

  })(Page);

}).call(this);


},{"./SourcePage":42,"../Page":39,"../forms":"EAVIrc"}],44:[function(require,module,exports){
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
      if (_.isEqual(bounds.getSouthWest(), bounds.getNorthEast())) {
        return;
      }
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


},{"../Page":39,"./SourcePage":42,"../LocationFinder":36,"../GeoJSON":2,"../ItemTracker":13}],46:[function(require,module,exports){
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


},{"../Page":39,"./TestPage":47}],47:[function(require,module,exports){
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

    TestPage.prototype.render = function() {
      var _this = this;
      this.setTitle("Water Test");
      return this.db.tests.findOne({
        _id: this.options._id
      }, function(test) {
        _this.test = test;
        if (_this.auth.remove("tests", _this.test)) {
          _this.setupContextMenu([
            {
              glyph: 'remove',
              text: "Delete Test",
              click: function() {
                return _this.deleteTest();
              }
            }
          ]);
        } else {
          _this.setupContextMenu([]);
        }
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


},{"../Page":39,"../forms":"EAVIrc"}],45:[function(require,module,exports){
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


},{"../Page":39,"../forms":"EAVIrc"}],48:[function(require,module,exports){
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

    SourceNotePage.prototype.activate = function() {
      var _this = this;
      return this.db.sources.findOne({
        code: this.options.source
      }, function(source) {
        _this.setTitle("Note for Source " + source.code);
        if (_this.options._id) {
          return _this.db.source_notes.findOne({
            _id: _this.options._id
          }, function(sourceNote) {
            _this.sourceNote = sourceNote;
            return _this.render();
          });
        } else {
          if (!_this.auth.insert("source_notes")) {
            return _this.pager.closePage();
          }
          return _this.render();
        }
      });
    };

    SourceNotePage.prototype.render = function() {
      var form, questions, readonly,
        _this = this;
      this.model = new Backbone.Model();
      readonly = (this.sourceNote != null) && !this.auth.update("source_notes", this.sourceNote);
      questions = [
        new forms.DateQuestion({
          id: 'date',
          model: this.model,
          prompt: 'Date of Visit',
          required: true,
          readonly: readonly
        }), new forms.RadioQuestion({
          id: 'status',
          model: this.model,
          prompt: 'Status of Water Source',
          options: [['ok', 'Functional'], ['maint', 'Needs maintenance'], ['broken', 'Non-functional'], ['missing', 'No longer exists']],
          required: true,
          readonly: readonly
        }), new forms.TextQuestion({
          id: 'notes',
          model: this.model,
          prompt: 'Notes',
          multiline: true,
          readonly: readonly
        })
      ];
      if (readonly) {
        form = new forms.QuestionGroup({
          contents: questions
        });
      } else {
        form = new forms.SaveCancelForm({
          contents: questions
        });
        this.listenTo(form, 'save', function() {
          return _this.db.source_notes.upsert(_this.model.toJSON(), function() {
            return _this.pager.closePage();
          });
        });
        this.listenTo(form, 'cancel', function() {
          return _this.pager.closePage();
        });
      }
      if (this.sourceNote) {
        this.model.set(this.sourceNote);
      } else {
        this.model.set({
          source: this.options.source,
          date: new Date().toISOString().substring(0, 10)
        });
      }
      return this.$el.empty().append(form.el);
    };

    return SourceNotePage;

  })(Page);

}).call(this);


},{"../Page":39,"../forms":"EAVIrc"}]},{},[11,1,3,7,10,14,12,15,17,19,21,6,24])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL3Rlc3QvR2VvSlNPTlRlc3RzLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvdGVzdC9IeWJyaWREYlRlc3RzLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvdGVzdC9JbWFnZVF1ZXN0aW9uVGVzdHMuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My90ZXN0L0ltYWdlc1F1ZXN0aW9uc1Rlc3RzLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvdGVzdC9Ecm9wZG93blF1ZXN0aW9uVGVzdHMuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My90ZXN0L0l0ZW1UcmFja2VyVGVzdHMuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My90ZXN0L0xvY2FsRGJUZXN0cy5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL3Rlc3QvTG9jYXRpb25WaWV3VGVzdHMuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My90ZXN0L1JlbW90ZURiVGVzdHMuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My90ZXN0L2F1dGhUZXN0cy5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL3Rlc3Qvc291cmNlY29kZXNUZXN0cy5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL3Rlc3Qvc3luY1Rlc3RzLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvdGVzdC9kYl9xdWVyaWVzLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL2Zvcm1zL2luZGV4LmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL0dlb0pTT04uY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvSXRlbVRyYWNrZXIuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My90ZXN0L2hlbHBlcnMvVUlEcml2ZXIuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvYXV0aC5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9zb3VyY2Vjb2Rlcy5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL3Rlc3QvaGVscGVycy9Kc29uU2VydmVyLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL3N5bmMuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvZGIvUmVtb3RlRGIuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvTG9jYXRpb25WaWV3LmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL2RiL0xvY2FsRGIuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvcGFnZXMvSW1hZ2VQYWdlLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL2RiL0h5YnJpZERiLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL2Zvcm1zL2Zvcm0tY29udHJvbHMuanMiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9mb3Jtcy9RdWVzdGlvbkdyb3VwLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL2Zvcm1zL1NhdmVDYW5jZWxGb3JtLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL2Zvcm1zL0luc3RydWN0aW9ucy5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9mb3Jtcy9EYXRlUXVlc3Rpb24uY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvZm9ybXMvRHJvcGRvd25RdWVzdGlvbi5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9mb3Jtcy9OdW1iZXJRdWVzdGlvbi5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9mb3Jtcy9Tb3VyY2VRdWVzdGlvbi5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9mb3Jtcy9JbWFnZVF1ZXN0aW9uLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL2Zvcm1zL0ltYWdlc1F1ZXN0aW9uLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL0xvY2F0aW9uRmluZGVyLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL1BhZ2UuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvZGIvc2VsZWN0b3IuanMiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9kYi91dGlscy5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9wYWdlcy9Tb3VyY2VMaXN0UGFnZS5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9kYi9FSlNPTi5qcyIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL3BhZ2VzL1NvdXJjZVBhZ2UuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvcGFnZXMvTmV3U291cmNlUGFnZS5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9wYWdlcy9Tb3VyY2VNYXBQYWdlLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL3BhZ2VzL05ld1Rlc3RQYWdlLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL3BhZ2VzL1Rlc3RQYWdlLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL3BhZ2VzL1NvdXJjZUVkaXRQYWdlLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL3BhZ2VzL1NvdXJjZU5vdGVQYWdlLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Q0FBQSxLQUFBLFNBQUE7O0NBQUEsQ0FBQSxDQUFTLENBQUksRUFBYjs7Q0FBQSxDQUNBLENBQVUsSUFBVixZQUFVOztDQURWLENBR0EsQ0FBb0IsS0FBcEIsQ0FBQTtDQUNFLENBQUEsQ0FBK0IsQ0FBL0IsS0FBK0IsaUJBQS9CO0NBQ0UsU0FBQSx3QkFBQTtDQUFBLENBQWdCLENBQUEsQ0FBQSxFQUFoQixHQUFBO0NBQUEsQ0FDZ0IsQ0FBQSxDQUFBLEVBQWhCLEdBQUE7Q0FEQSxDQUV1QyxDQUExQixDQUFBLEVBQWIsR0FBYSxHQUFBO0NBRmIsRUFJTyxDQUFQLEVBQUEsQ0FBYyxjQUFQO0NBQ0EsQ0FBZ0IsRUFBaEIsRUFBUCxDQUFPLE1BQVA7Q0FBdUIsQ0FDZixFQUFOLElBQUEsQ0FEcUI7Q0FBQSxDQUVSLE1BQWIsR0FBQTtDQUZGLE9BQU87Q0FOVCxJQUErQjtDQUEvQixDQWFBLENBQStCLENBQS9CLEtBQStCLGlCQUEvQjtDQUNFLFNBQUEsR0FBQTtDQUFBLEVBQU8sQ0FBUCxFQUFBO0NBQU8s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QUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtB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Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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RSxFQUFXLENBQVgsQ0FBZ0IsR0FBaEIsS0FBVztDQUNULENBQVUsTUFBVixDQUFBLENBQUE7Q0FERixTQUFXO01BRGIsRUFBQTtDQUlFLEVBQVcsQ0FBWCxDQUFnQixHQUFoQixNQUFXO0NBQ1QsQ0FBVSxNQUFWLENBQUEsQ0FBQTtDQURGLFNBQVc7Q0FBWCxDQUdnQixDQUFRLENBQXZCLEVBQUQsRUFBQSxDQUF3QjtDQUNyQixDQUFFLENBQXNDLEVBQXhDLENBQUQsR0FBeUMsR0FBekIsS0FBaEI7Q0FBNkMsSUFBQSxJQUFELFVBQUE7Q0FBNUMsVUFBeUM7Q0FEM0MsUUFBd0I7Q0FIeEIsQ0FNZ0IsQ0FBVSxDQUF6QixJQUFELENBQTBCO0NBQ3ZCLElBQUEsSUFBRCxRQUFBO0NBREYsUUFBMEI7UUF0QzVCO0NBMENBLEdBQUcsRUFBSCxJQUFBO0NBQ0ksRUFBQSxDQUFDLENBQUssR0FBTixFQUFBO01BREosRUFBQTtDQUlFLEVBQUEsQ0FBQyxDQUFLLEdBQU47Q0FBVyxDQUFRLEVBQUMsRUFBVCxDQUFnQixHQUFoQjtDQUFBLENBQW1DLEVBQVYsS0FBVSxDQUFWLENBQVU7Q0FBOUMsU0FBQTtRQTlDRjtDQWdEQyxDQUFELENBQUksQ0FBSCxDQUFELENBQUEsT0FBQTtDQWxFSixJQWdCUTs7Q0FoQlI7O0NBRDRDO0NBUjlDIiwic291cmNlc0NvbnRlbnQiOlsiYXNzZXJ0ID0gY2hhaS5hc3NlcnRcbkdlb0pTT04gPSByZXF1aXJlIFwiLi4vYXBwL2pzL0dlb0pTT05cIlxuXG5kZXNjcmliZSAnR2VvSlNPTicsIC0+XG4gIGl0ICdyZXR1cm5zIGEgcHJvcGVyIHBvbHlnb24nLCAtPlxuICAgIHNvdXRoV2VzdCA9IG5ldyBMLkxhdExuZygxMCwgMjApXG4gICAgbm9ydGhFYXN0ID0gbmV3IEwuTGF0TG5nKDEzLCAyMylcbiAgICBib3VuZHMgPSBuZXcgTC5MYXRMbmdCb3VuZHMoc291dGhXZXN0LCBub3J0aEVhc3QpXG5cbiAgICBqc29uID0gR2VvSlNPTi5sYXRMbmdCb3VuZHNUb0dlb0pTT04oYm91bmRzKVxuICAgIGFzc2VydCBfLmlzRXF1YWwganNvbiwge1xuICAgICAgdHlwZTogXCJQb2x5Z29uXCIsXG4gICAgICBjb29yZGluYXRlczogW1xuICAgICAgICBbWzIwLDEwXSxbMjAsMTNdLFsyMywxM10sWzIzLDEwXSxbMjAsMTBdXVxuICAgICAgXVxuICAgIH1cblxuICBpdCAnZ2V0cyByZWxhdGl2ZSBsb2NhdGlvbiBOJywgLT5cbiAgICBmcm9tID0geyB0eXBlOiBcIlBvaW50XCIsIGNvb3JkaW5hdGVzOiBbMTAsIDIwXX1cbiAgICB0byA9IHsgdHlwZTogXCJQb2ludFwiLCBjb29yZGluYXRlczogWzEwLCAyMV19XG4gICAgc3RyID0gR2VvSlNPTi5nZXRSZWxhdGl2ZUxvY2F0aW9uKGZyb20sIHRvKVxuICAgIGFzc2VydC5lcXVhbCBzdHIsICcxMTEuMmttIE4nXG5cbiAgaXQgJ2dldHMgcmVsYXRpdmUgbG9jYXRpb24gUycsIC0+XG4gICAgZnJvbSA9IHsgdHlwZTogXCJQb2ludFwiLCBjb29yZGluYXRlczogWzEwLCAyMF19XG4gICAgdG8gPSB7IHR5cGU6IFwiUG9pbnRcIiwgY29vcmRpbmF0ZXM6IFsxMCwgMTldfVxuICAgIHN0ciA9IEdlb0pTT04uZ2V0UmVsYXRpdmVMb2NhdGlvbihmcm9tLCB0bylcbiAgICBhc3NlcnQuZXF1YWwgc3RyLCAnMTExLjJrbSBTJ1xuIiwiYXNzZXJ0ID0gY2hhaS5hc3NlcnRcbkxvY2FsRGIgPSByZXF1aXJlIFwiLi4vYXBwL2pzL2RiL0xvY2FsRGJcIlxuSHlicmlkRGIgPSByZXF1aXJlIFwiLi4vYXBwL2pzL2RiL0h5YnJpZERiXCJcbmRiX3F1ZXJpZXMgPSByZXF1aXJlIFwiLi9kYl9xdWVyaWVzXCJcblxuIyBOb3RlOiBBc3N1bWVzIGxvY2FsIGRiIGlzIHN5bmNocm9ub3VzIVxuZmFpbCA9IC0+XG4gIHRocm93IG5ldyBFcnJvcihcImZhaWxlZFwiKVxuXG5kZXNjcmliZSAnSHlicmlkRGInLCAtPlxuICBiZWZvcmVFYWNoIC0+XG4gICAgQGxvY2FsID0gbmV3IExvY2FsRGIoKVxuICAgIEByZW1vdGUgPSBuZXcgTG9jYWxEYigpXG4gICAgQGh5YnJpZCA9IG5ldyBIeWJyaWREYihAbG9jYWwsIEByZW1vdGUpXG4gICAgQGRiID0gQGh5YnJpZFxuXG4gICAgQGxjID0gQGxvY2FsLmFkZENvbGxlY3Rpb24oXCJzY3JhdGNoXCIpXG4gICAgQHJjID0gQHJlbW90ZS5hZGRDb2xsZWN0aW9uKFwic2NyYXRjaFwiKVxuICAgIEBoYyA9IEBoeWJyaWQuYWRkQ29sbGVjdGlvbihcInNjcmF0Y2hcIilcblxuICAjIFRPRE8gRm9yIHNvbWUgcmVhc29uLCB0aGlzIGJsb2NrcyB0ZXN0c1xuICAjZGVzY3JpYmUgXCJwYXNzZXMgcXVlcmllc1wiLCAtPlxuICAjICBkYl9xdWVyaWVzLmNhbGwodGhpcylcblxuICBjb250ZXh0IFwiaHlicmlkIG1vZGVcIiwgLT5cbiAgICBpdCBcImZpbmQgZ2l2ZXMgb25seSBvbmUgcmVzdWx0IGlmIGRhdGEgdW5jaGFuZ2VkXCIsIChkb25lKSAtPlxuICAgICAgQGxjLnNlZWQoX2lkOlwiMVwiLCBhOjEpXG4gICAgICBAbGMuc2VlZChfaWQ6XCIyXCIsIGE6MilcblxuICAgICAgQHJjLnNlZWQoX2lkOlwiMVwiLCBhOjEpXG4gICAgICBAcmMuc2VlZChfaWQ6XCIyXCIsIGE6MilcblxuICAgICAgY2FsbHMgPSAwXG4gICAgICBAaGMuZmluZCh7fSkuZmV0Y2ggKGRhdGEpIC0+XG4gICAgICAgIGNhbGxzICs9IDFcbiAgICAgICAgYXNzZXJ0LmVxdWFsIGRhdGEubGVuZ3RoLCAyXG4gICAgICAgIGFzc2VydC5lcXVhbCBjYWxscywgMVxuICAgICAgICBkb25lKClcbiAgICAgICwgZmFpbFxuXG4gICAgaXQgXCJsb2NhbCB1cHNlcnRzIGFyZSByZXNwZWN0ZWRcIiwgKGRvbmUpIC0+XG4gICAgICBAbGMuc2VlZChfaWQ6XCIxXCIsIGE6MSlcbiAgICAgIEBsYy51cHNlcnQoX2lkOlwiMlwiLCBhOjIpXG5cbiAgICAgIEByYy5zZWVkKF9pZDpcIjFcIiwgYToxKVxuICAgICAgQHJjLnNlZWQoX2lkOlwiMlwiLCBhOjQpXG5cbiAgICAgIEBoYy5maW5kT25lIHsgX2lkOiBcIjJcIn0sIChkb2MpIC0+XG4gICAgICAgIGFzc2VydC5kZWVwRXF1YWwgZG9jLCB7IF9pZDogXCIyXCIsIGE6IDIgfVxuICAgICAgICBkb25lKClcbiAgICAgICwgZmFpbFxuXG4gICAgaXQgXCJmaW5kIHBlcmZvcm1zIGZ1bGwgZmllbGQgcmVtb3RlIHF1ZXJpZXMgaW4gaHlicmlkIG1vZGVcIiwgKGRvbmUpIC0+XG4gICAgICBAcmMuc2VlZChfaWQ6XCIxXCIsIGE6MSwgYjoxMSlcbiAgICAgIEByYy5zZWVkKF9pZDpcIjJcIiwgYToyLCBiOjEyKVxuXG4gICAgICBAaGMuZmluZCh7fSwgeyBmaWVsZHM6IHsgYjowIH0gfSkuZmV0Y2ggKGRhdGEpID0+XG4gICAgICAgIGlmIGRhdGEubGVuZ3RoID09IDBcbiAgICAgICAgICByZXR1cm5cbiAgICAgICAgYXNzZXJ0LmlzVW5kZWZpbmVkIGRhdGFbMF0uYlxuICAgICAgICBAbGMuZmluZE9uZSB7IF9pZDogXCIxXCIgfSwgKGRvYykgLT5cbiAgICAgICAgICBhc3NlcnQuZXF1YWwgZG9jLmIsIDExXG4gICAgICAgICAgZG9uZSgpXG5cbiAgICBpdCBcImZpbmRPbmUgcGVyZm9ybXMgZnVsbCBmaWVsZCByZW1vdGUgcXVlcmllcyBpbiBoeWJyaWQgbW9kZVwiLCAoZG9uZSkgLT5cbiAgICAgIEByYy5zZWVkKF9pZDpcIjFcIiwgYToxLCBiOjExKVxuICAgICAgQHJjLnNlZWQoX2lkOlwiMlwiLCBhOjIsIGI6MTIpXG5cbiAgICAgIEBoYy5maW5kT25lIHsgX2lkOiBcIjFcIiB9LCB7IGZpZWxkczogeyBiOjAgfSB9LCAoZG9jKSA9PlxuICAgICAgICBhc3NlcnQuaXNVbmRlZmluZWQgZG9jLmJcbiAgICAgICAgQGxjLmZpbmRPbmUgeyBfaWQ6IFwiMVwiIH0sIChkb2MpIC0+XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsIGRvYy5iLCAxMVxuICAgICAgICAgIGRvbmUoKVxuXG4gICAgaXQgXCJmaW5kIGdpdmVzIHJlc3VsdHMgdHdpY2UgaWYgcmVtb3RlIGdpdmVzIGRpZmZlcmVudCBhbnN3ZXJcIiwgKGRvbmUpIC0+XG4gICAgICBAbGMuc2VlZChfaWQ6XCIxXCIsIGE6MSlcbiAgICAgIEBsYy5zZWVkKF9pZDpcIjJcIiwgYToyKVxuXG4gICAgICBAcmMuc2VlZChfaWQ6XCIxXCIsIGE6MylcbiAgICAgIEByYy5zZWVkKF9pZDpcIjJcIiwgYTo0KVxuXG4gICAgICBjYWxscyA9IDBcbiAgICAgIEBoYy5maW5kKHt9KS5mZXRjaCAoZGF0YSkgLT5cbiAgICAgICAgYXNzZXJ0LmVxdWFsIGRhdGEubGVuZ3RoLCAyXG4gICAgICAgIGNhbGxzID0gY2FsbHMgKyAxXG4gICAgICAgIGlmIGNhbGxzID49MlxuICAgICAgICAgIGRvbmUoKVxuICAgICAgLCBmYWlsXG5cbiAgICBpdCBcImZpbmQgZ2l2ZXMgcmVzdWx0cyBvbmNlIGlmIHJlbW90ZSBnaXZlcyBzYW1lIGFuc3dlciB3aXRoIHNvcnQgZGlmZmVyZW5jZXNcIiwgKGRvbmUpIC0+XG4gICAgICBAbGMuc2VlZChfaWQ6XCIxXCIsIGE6MSlcbiAgICAgIEBsYy5zZWVkKF9pZDpcIjJcIiwgYToyKVxuXG4gICAgICBAcmMuZmluZCA9ICgpID0+XG4gICAgICAgIHJldHVybiBmZXRjaDogKHN1Y2Nlc3MpID0+XG4gICAgICAgICAgc3VjY2Vzcyhbe19pZDpcIjJcIiwgYToyfSwge19pZDpcIjFcIiwgYToxfV0pXG5cbiAgICAgIEBoYy5maW5kKHt9KS5mZXRjaCAoZGF0YSkgLT5cbiAgICAgICAgYXNzZXJ0LmVxdWFsIGRhdGEubGVuZ3RoLCAyXG4gICAgICAgIGRvbmUoKVxuICAgICAgLCBmYWlsXG5cbiAgICBpdCBcImZpbmRPbmUgZ2l2ZXMgcmVzdWx0cyB0d2ljZSBpZiByZW1vdGUgZ2l2ZXMgZGlmZmVyZW50IGFuc3dlclwiLCAoZG9uZSkgLT5cbiAgICAgIEBsYy5zZWVkKF9pZDpcIjFcIiwgYToxKVxuICAgICAgQGxjLnNlZWQoX2lkOlwiMlwiLCBhOjIpXG5cbiAgICAgIEByYy5zZWVkKF9pZDpcIjFcIiwgYTozKVxuICAgICAgQHJjLnNlZWQoX2lkOlwiMlwiLCBhOjQpXG5cbiAgICAgIGNhbGxzID0gMFxuICAgICAgQGhjLmZpbmRPbmUgeyBfaWQ6IFwiMVwifSwgKGRhdGEpIC0+XG4gICAgICAgIGNhbGxzID0gY2FsbHMgKyAxXG4gICAgICAgIGlmIGNhbGxzID09IDFcbiAgICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIGRhdGEsIHsgX2lkIDogXCIxXCIsIGE6MSB9XG4gICAgICAgIGlmIGNhbGxzID49IDJcbiAgICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIGRhdGEsIHsgX2lkIDogXCIxXCIsIGE6MyB9XG4gICAgICAgICAgZG9uZSgpXG4gICAgICAsIGZhaWxcblxuICAgIGl0IFwiZmluZE9uZSBnaXZlcyByZXN1bHRzIG51bGwgb25jZSBpZiByZW1vdGUgZmFpbHNcIiwgKGRvbmUpIC0+XG4gICAgICBjYWxsZWQgPSAwXG4gICAgICBAcmMuZmluZE9uZSA9IChzZWxlY3Rvciwgb3B0aW9ucyA9IHt9LCBzdWNjZXNzLCBlcnJvcikgLT5cbiAgICAgICAgY2FsbGVkID0gY2FsbGVkICsgMVxuICAgICAgICBlcnJvcihuZXcgRXJyb3IoXCJmYWlsXCIpKVxuICAgICAgQGhjLmZpbmRPbmUgeyBfaWQ6IFwieHl6XCJ9LCAoZGF0YSkgLT5cbiAgICAgICAgYXNzZXJ0LmVxdWFsIGRhdGEsIG51bGxcbiAgICAgICAgYXNzZXJ0LmVxdWFsIGNhbGxlZCwgMVxuICAgICAgICBkb25lKClcbiAgICAgICwgZmFpbFxuXG4gICAgaXQgXCJjYWNoZXMgcmVtb3RlIGRhdGFcIiwgKGRvbmUpIC0+XG4gICAgICBAbGMuc2VlZChfaWQ6XCIxXCIsIGE6MSlcbiAgICAgIEBsYy5zZWVkKF9pZDpcIjJcIiwgYToyKVxuXG4gICAgICBAcmMuc2VlZChfaWQ6XCIxXCIsIGE6MylcbiAgICAgIEByYy5zZWVkKF9pZDpcIjJcIiwgYToyKVxuXG4gICAgICBjYWxscyA9IDBcbiAgICAgIEBoYy5maW5kKHt9KS5mZXRjaCAoZGF0YSkgPT5cbiAgICAgICAgYXNzZXJ0LmVxdWFsIGRhdGEubGVuZ3RoLCAyXG4gICAgICAgIGNhbGxzID0gY2FsbHMgKyAxXG5cbiAgICAgICAgIyBBZnRlciBzZWNvbmQgY2FsbCwgY2hlY2sgdGhhdCBsb2NhbCBjb2xsZWN0aW9uIGhhcyBsYXRlc3RcbiAgICAgICAgaWYgY2FsbHMgPT0gMlxuICAgICAgICAgIEBsYy5maW5kKHt9KS5mZXRjaCAoZGF0YSkgPT5cbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCBkYXRhLmxlbmd0aCwgMlxuICAgICAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCBfLnBsdWNrKGRhdGEsICdhJyksIFszLDJdXG4gICAgICAgICAgICBkb25lKClcblxuICBjb250ZXh0IFwibG9jYWwgbW9kZVwiLCAtPlxuICAgIGl0IFwiZmluZCBvbmx5IGNhbGxzIGxvY2FsXCIsIChkb25lKSAtPlxuICAgICAgQGxjLnNlZWQoX2lkOlwiMVwiLCBhOjEpXG4gICAgICBAbGMuc2VlZChfaWQ6XCIyXCIsIGE6MilcblxuICAgICAgQHJjLnNlZWQoX2lkOlwiMVwiLCBhOjMpXG4gICAgICBAcmMuc2VlZChfaWQ6XCIyXCIsIGE6NClcblxuICAgICAgQGhjLmZpbmQoe30sIHttb2RlOlwibG9jYWxcIn0pLmZldGNoIChkYXRhKSA9PlxuICAgICAgICBhc3NlcnQuZXF1YWwgZGF0YS5sZW5ndGgsIDJcbiAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCBfLnBsdWNrKGRhdGEsICdhJyksIFsxLDJdXG4gICAgICAgIGRvbmUoKVxuXG4gICAgaXQgXCJmaW5kT25lIG9ubHkgY2FsbHMgbG9jYWwgaWYgZm91bmRcIiwgKGRvbmUpIC0+XG4gICAgICBAbGMuc2VlZChfaWQ6XCIxXCIsIGE6MSlcbiAgICAgIEBsYy5zZWVkKF9pZDpcIjJcIiwgYToyKVxuXG4gICAgICBAcmMuc2VlZChfaWQ6XCIxXCIsIGE6MylcbiAgICAgIEByYy5zZWVkKF9pZDpcIjJcIiwgYTo0KVxuXG4gICAgICBjYWxscyA9IDBcbiAgICAgIEBoYy5maW5kT25lIHsgX2lkOiBcIjFcIiB9LCB7IG1vZGU6IFwibG9jYWxcIiB9LCAoZGF0YSkgPT5cbiAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCBkYXRhLCB7IF9pZCA6IFwiMVwiLCBhOjEgfVxuICAgICAgICBkb25lKClcbiAgICAgICwgZmFpbFxuXG4gICAgaXQgXCJmaW5kT25lIGNhbGxzIHJlbW90ZSBpZiBub3QgZm91bmRcIiwgKGRvbmUpIC0+XG4gICAgICBAbGMuc2VlZChfaWQ6XCIyXCIsIGE6MilcblxuICAgICAgQHJjLnNlZWQoX2lkOlwiMVwiLCBhOjMpXG4gICAgICBAcmMuc2VlZChfaWQ6XCIyXCIsIGE6NClcblxuICAgICAgY2FsbHMgPSAwXG4gICAgICBAaGMuZmluZE9uZSB7IF9pZDogXCIxXCJ9LCB7IG1vZGU6XCJsb2NhbFwiIH0sIChkYXRhKSA9PlxuICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIGRhdGEsIHsgX2lkIDogXCIxXCIsIGE6MyB9XG4gICAgICAgIGRvbmUoKVxuICAgICAgLCBmYWlsXG5cbiAgY29udGV4dCBcInJlbW90ZSBtb2RlXCIsIC0+XG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgQGxjLnNlZWQoX2lkOlwiMVwiLCBhOjEpXG4gICAgICBAbGMuc2VlZChfaWQ6XCIyXCIsIGE6MilcblxuICAgICAgQHJjLnNlZWQoX2lkOlwiMVwiLCBhOjMpXG4gICAgICBAcmMuc2VlZChfaWQ6XCIyXCIsIGE6NClcblxuICAgIGl0IFwiZmluZCBvbmx5IGNhbGxzIHJlbW90ZVwiLCAoZG9uZSkgLT5cbiAgICAgIEBoYy5maW5kKHt9LCB7IG1vZGU6IFwicmVtb3RlXCIgfSkuZmV0Y2ggKGRhdGEpID0+XG4gICAgICAgIGFzc2VydC5kZWVwRXF1YWwgXy5wbHVjayhkYXRhLCAnYScpLCBbMyw0XVxuICAgICAgICBkb25lKClcblxuICAgIGl0IFwiZmluZCBkb2VzIG5vdCBjYWNoZSByZXN1bHRzXCIsIChkb25lKSAtPlxuICAgICAgQGhjLmZpbmQoe30sIHsgbW9kZTogXCJyZW1vdGVcIiB9KS5mZXRjaCAoZGF0YSkgPT5cbiAgICAgICAgQGxjLmZpbmQoe30pLmZldGNoIChkYXRhKSA9PlxuICAgICAgICAgIGFzc2VydC5kZWVwRXF1YWwgXy5wbHVjayhkYXRhLCAnYScpLCBbMSwyXVxuICAgICAgICAgIGRvbmUoKVxuXG4gICAgaXQgXCJmaW5kIGZhbGxzIGJhY2sgdG8gbG9jYWwgaWYgcmVtb3RlIGZhaWxzXCIsIChkb25lKSAtPlxuICAgICAgQHJjLmZpbmQgPSAoc2VsZWN0b3IsIG9wdGlvbnMpID0+XG4gICAgICAgIHJldHVybiB7IGZldGNoOiAoc3VjY2VzcywgZXJyb3IpIC0+XG4gICAgICAgICAgZXJyb3IoKVxuICAgICAgICB9XG4gICAgICBAaGMuZmluZCh7fSwgeyBtb2RlOiBcInJlbW90ZVwiIH0pLmZldGNoIChkYXRhKSA9PlxuICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIF8ucGx1Y2soZGF0YSwgJ2EnKSwgWzEsMl1cbiAgICAgICAgZG9uZSgpXG5cbiAgICBpdCBcImZpbmQgcmVzcGVjdHMgbG9jYWwgdXBzZXJ0c1wiLCAoZG9uZSkgLT5cbiAgICAgIEBsYy51cHNlcnQoeyBfaWQ6XCIxXCIsIGE6OSB9KVxuXG4gICAgICBAaGMuZmluZCh7fSwgeyBtb2RlOiBcInJlbW90ZVwiLCBzb3J0OiBbJ19pZCddIH0pLmZldGNoIChkYXRhKSA9PlxuICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIF8ucGx1Y2soZGF0YSwgJ2EnKSwgWzksNF1cbiAgICAgICAgZG9uZSgpXG5cbiAgICBpdCBcImZpbmQgcmVzcGVjdHMgbG9jYWwgcmVtb3Zlc1wiLCAoZG9uZSkgLT5cbiAgICAgIEBsYy5yZW1vdmUoXCIxXCIpXG5cbiAgICAgIEBoYy5maW5kKHt9LCB7IG1vZGU6IFwicmVtb3RlXCIgfSkuZmV0Y2ggKGRhdGEpID0+XG4gICAgICAgIGFzc2VydC5kZWVwRXF1YWwgXy5wbHVjayhkYXRhLCAnYScpLCBbNF1cbiAgICAgICAgZG9uZSgpXG4gICAgXG4gIGl0IFwidXBsb2FkIGFwcGxpZXMgcGVuZGluZyB1cHNlcnRzIGFuZCBkZWxldGVzXCIsIChkb25lKSAtPlxuICAgIEBsYy51cHNlcnQoX2lkOlwiMVwiLCBhOjEpXG4gICAgQGxjLnVwc2VydChfaWQ6XCIyXCIsIGE6MilcblxuICAgIEBoeWJyaWQudXBsb2FkKCgpID0+XG4gICAgICBAbGMucGVuZGluZ1Vwc2VydHMgKGRhdGEpID0+XG4gICAgICAgIGFzc2VydC5lcXVhbCBkYXRhLmxlbmd0aCwgMFxuXG4gICAgICAgIEByYy5wZW5kaW5nVXBzZXJ0cyAoZGF0YSkgPT5cbiAgICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIF8ucGx1Y2soZGF0YSwgJ2EnKSwgWzEsMl1cbiAgICAgICAgICBkb25lKClcbiAgICAsIGZhaWwpXG5cbiAgaXQgXCJrZWVwcyB1cHNlcnRzIGFuZCBkZWxldGVzIGlmIGZhaWxlZCB0byBhcHBseVwiLCAoZG9uZSkgLT5cbiAgICBAbGMudXBzZXJ0KF9pZDpcIjFcIiwgYToxKVxuICAgIEBsYy51cHNlcnQoX2lkOlwiMlwiLCBhOjIpXG5cbiAgICBAcmMudXBzZXJ0ID0gKGRvYywgc3VjY2VzcywgZXJyb3IpID0+XG4gICAgICBlcnJvcihuZXcgRXJyb3IoXCJmYWlsXCIpKVxuXG4gICAgQGh5YnJpZC51cGxvYWQoKCkgPT5cbiAgICAgIGFzc2VydC5mYWlsKClcbiAgICAsICgpPT5cbiAgICAgIEBsYy5wZW5kaW5nVXBzZXJ0cyAoZGF0YSkgPT5cbiAgICAgICAgYXNzZXJ0LmVxdWFsIGRhdGEubGVuZ3RoLCAyXG4gICAgICAgIGRvbmUoKVxuICAgIClcblxuICBpdCBcInVwc2VydHMgdG8gbG9jYWwgZGJcIiwgKGRvbmUpIC0+XG4gICAgQGhjLnVwc2VydChfaWQ6XCIxXCIsIGE6MSlcbiAgICBAbGMucGVuZGluZ1Vwc2VydHMgKGRhdGEpID0+XG4gICAgICBhc3NlcnQuZXF1YWwgZGF0YS5sZW5ndGgsIDFcbiAgICAgIGRvbmUoKVxuXG4gIGl0IFwicmVtb3ZlcyB0byBsb2NhbCBkYlwiLCAoZG9uZSkgLT5cbiAgICBAbGMuc2VlZChfaWQ6XCIxXCIsIGE6MSlcbiAgICBAaGMucmVtb3ZlKFwiMVwiKVxuICAgIEBsYy5wZW5kaW5nUmVtb3ZlcyAoZGF0YSkgPT5cbiAgICAgIGFzc2VydC5lcXVhbCBkYXRhLmxlbmd0aCwgMVxuICAgICAgZG9uZSgpXG4iLCJhc3NlcnQgPSBjaGFpLmFzc2VydFxuZm9ybXMgPSByZXF1aXJlKCdmb3JtcycpXG5VSURyaXZlciA9IHJlcXVpcmUgJy4vaGVscGVycy9VSURyaXZlcidcbkltYWdlUGFnZSA9IHJlcXVpcmUgJy4uL2FwcC9qcy9wYWdlcy9JbWFnZVBhZ2UnXG5cbmNsYXNzIE1vY2tJbWFnZU1hbmFnZXIgXG4gIGdldEltYWdlVGh1bWJuYWlsVXJsOiAoaW1hZ2VVaWQsIHN1Y2Nlc3MsIGVycm9yKSAtPlxuICAgIHN1Y2Nlc3MgXCJpbWFnZXMvXCIgKyBpbWFnZVVpZCArIFwiLmpwZ1wiXG5cbiAgZ2V0SW1hZ2VVcmw6IChpbWFnZVVpZCwgc3VjY2VzcywgZXJyb3IpIC0+XG4gICAgc3VjY2VzcyBcImltYWdlcy9cIiArIGltYWdlVWlkICsgXCIuanBnXCJcblxuY2xhc3MgTW9ja0NhbWVyYVxuICB0YWtlUGljdHVyZTogKHN1Y2Nlc3MsIGVycm9yKSAtPlxuICAgIHN1Y2Nlc3MoXCJodHRwOi8vMTIzNC5qcGdcIilcblxuZGVzY3JpYmUgJ0ltYWdlUXVlc3Rpb24nLCAtPlxuICBiZWZvcmVFYWNoIC0+XG4gICAgIyBDcmVhdGUgbW9kZWxcbiAgICBAbW9kZWwgPSBuZXcgQmFja2JvbmUuTW9kZWwgXG5cbiAgY29udGV4dCAnV2l0aCBhIG5vIGNhbWVyYScsIC0+XG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgIyBDcmVhdGUgY29udGV4dFxuICAgICAgQGN0eCA9IHtcbiAgICAgICAgaW1hZ2VNYW5hZ2VyOiBuZXcgTW9ja0ltYWdlTWFuYWdlcigpXG4gICAgICB9XG5cbiAgICAgIEBxdWVzdGlvbiA9IG5ldyBmb3Jtcy5JbWFnZVF1ZXN0aW9uXG4gICAgICAgIG1vZGVsOiBAbW9kZWxcbiAgICAgICAgaWQ6IFwicTFcIlxuICAgICAgICBjdHg6IEBjdHhcblxuICAgIGl0ICdkaXNwbGF5cyBubyBpbWFnZScsIC0+XG4gICAgICBhc3NlcnQuaXNUcnVlIHRydWVcblxuICAgIGl0ICdkaXNwbGF5cyBvbmUgaW1hZ2UnLCAtPlxuICAgICAgQG1vZGVsLnNldChxMToge2lkOiBcIjEyMzRcIn0pXG4gICAgICBhc3NlcnQuZXF1YWwgQHF1ZXN0aW9uLiQoXCJpbWcudGh1bWJuYWlsLWltZ1wiKS5hdHRyKFwic3JjXCIpLCBcImltYWdlcy8xMjM0LmpwZ1wiXG5cbiAgICBpdCAnb3BlbnMgcGFnZScsIC0+XG4gICAgICBAbW9kZWwuc2V0KHExOiB7aWQ6IFwiMTIzNFwifSlcbiAgICAgIHNweSA9IHNpbm9uLnNweSgpXG4gICAgICBAY3R4LnBhZ2VyID0geyBvcGVuUGFnZTogc3B5IH1cbiAgICAgIEBxdWVzdGlvbi4kKFwiaW1nLnRodW1ibmFpbC1pbWdcIikuY2xpY2soKVxuXG4gICAgICBhc3NlcnQuaXNUcnVlIHNweS5jYWxsZWRPbmNlXG4gICAgICBhc3NlcnQuZXF1YWwgc3B5LmFyZ3NbMF1bMV0uaWQsIFwiMTIzNFwiXG5cbiAgICBpdCAnYWxsb3dzIHJlbW92aW5nIGltYWdlJywgLT5cbiAgICAgIEBtb2RlbC5zZXQocTE6IHtpZDogXCIxMjM0XCJ9KVxuICAgICAgQGN0eC5wYWdlciA9IHsgXG4gICAgICAgIG9wZW5QYWdlOiAocGFnZSwgb3B0aW9ucykgPT5cbiAgICAgICAgICBvcHRpb25zLm9uUmVtb3ZlKClcbiAgICAgIH1cbiAgICAgIEBxdWVzdGlvbi4kKFwiaW1nLnRodW1ibmFpbC1pbWdcIikuY2xpY2soKVxuICAgICAgYXNzZXJ0LmVxdWFsIEBtb2RlbC5nZXQoXCJxMVwiKSwgbnVsbFxuXG4gICAgaXQgJ2Rpc3BsYXlzIG5vIGFkZCcsIC0+XG4gICAgICBhc3NlcnQuZXF1YWwgQHF1ZXN0aW9uLiQoXCJpbWcjYWRkXCIpLmxlbmd0aCwgMFxuXG4gIGNvbnRleHQgJ1dpdGggYSBjYW1lcmEnLCAtPlxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICMgQ3JlYXRlIGNvbnRleHRcbiAgICAgIEBjdHggPSB7XG4gICAgICAgIGltYWdlTWFuYWdlcjogbmV3IE1vY2tJbWFnZU1hbmFnZXIoKVxuICAgICAgICBjYW1lcmE6IG5ldyBNb2NrQ2FtZXJhKClcbiAgICAgIH1cblxuICAgICAgQHF1ZXN0aW9uID0gbmV3IGZvcm1zLkltYWdlUXVlc3Rpb25cbiAgICAgICAgbW9kZWw6IEBtb2RlbFxuICAgICAgICBpZDogXCJxMVwiXG4gICAgICAgIGN0eDogQGN0eFxuXG4gICAgaXQgJ2Rpc3BsYXlzIG5vIGFkZCBpZiBpbWFnZSBtYW5hZ2VyIGhhcyBubyBhZGRJbWFnZScsIC0+XG4gICAgICBhc3NlcnQuZXF1YWwgQHF1ZXN0aW9uLiQoXCJpbWcjYWRkXCIpLmxlbmd0aCwgMFxuXG4gIGNvbnRleHQgJ1dpdGggYSBjYW1lcmEgYW5kIGltYWdlTWFuYWdlciB3aXRoIGFkZEltYWdlJywgLT5cbiAgICBiZWZvcmVFYWNoIC0+XG4gICAgICBpbWFnZU1hbmFnZXIgPSBuZXcgTW9ja0ltYWdlTWFuYWdlcigpXG4gICAgICBpbWFnZU1hbmFnZXIuYWRkSW1hZ2UgPSAodXJsLCBzdWNjZXNzLCBlcnJvcikgLT5cbiAgICAgICAgYXNzZXJ0LmVxdWFsIHVybCwgXCJodHRwOi8vMTIzNC5qcGdcIlxuICAgICAgICBzdWNjZXNzIFwiMTIzNFwiXG5cbiAgICAgICMgQ3JlYXRlIGNvbnRleHRcbiAgICAgIEBjdHggPSB7XG4gICAgICAgIGltYWdlTWFuYWdlcjogaW1hZ2VNYW5hZ2VyXG4gICAgICAgIGNhbWVyYTogbmV3IE1vY2tDYW1lcmEoKVxuICAgICAgfVxuXG4gICAgICBAcXVlc3Rpb24gPSBuZXcgZm9ybXMuSW1hZ2VRdWVzdGlvblxuICAgICAgICBtb2RlbDogQG1vZGVsXG4gICAgICAgIGlkOiBcInExXCJcbiAgICAgICAgY3R4OiBAY3R4XG5cbiAgICBpdCAndGFrZXMgYSBwaG90bycsIC0+XG4gICAgICBAY3R4LmNhbWVyYSA9IG5ldyBNb2NrQ2FtZXJhKClcbiAgICAgIEBxdWVzdGlvbi4kKFwiaW1nI2FkZFwiKS5jbGljaygpXG4gICAgICBhc3NlcnQuaXNUcnVlIF8uaXNFcXVhbChAbW9kZWwuZ2V0KFwicTFcIiksIHtpZDpcIjEyMzRcIn0pLCBAbW9kZWwuZ2V0KFwicTFcIilcblxuICAgIGl0ICdubyBsb25nZXIgaGFzIGFkZCBhZnRlciB0YWtpbmcgcGhvdG8nLCAtPlxuICAgICAgQGN0eC5jYW1lcmEgPSBuZXcgTW9ja0NhbWVyYSgpXG4gICAgICBAcXVlc3Rpb24uJChcImltZyNhZGRcIikuY2xpY2soKVxuICAgICAgYXNzZXJ0LmVxdWFsIEBxdWVzdGlvbi4kKFwiaW1nI2FkZFwiKS5sZW5ndGgsIDBcblxuICAgICIsImFzc2VydCA9IGNoYWkuYXNzZXJ0XG5mb3JtcyA9IHJlcXVpcmUoJ2Zvcm1zJylcblVJRHJpdmVyID0gcmVxdWlyZSAnLi9oZWxwZXJzL1VJRHJpdmVyJ1xuSW1hZ2VQYWdlID0gcmVxdWlyZSAnLi4vYXBwL2pzL3BhZ2VzL0ltYWdlUGFnZSdcblxuY2xhc3MgTW9ja0ltYWdlTWFuYWdlciBcbiAgZ2V0SW1hZ2VUaHVtYm5haWxVcmw6IChpbWFnZVVpZCwgc3VjY2VzcywgZXJyb3IpIC0+XG4gICAgc3VjY2VzcyBcImltYWdlcy9cIiArIGltYWdlVWlkICsgXCIuanBnXCJcblxuICBnZXRJbWFnZVVybDogKGltYWdlVWlkLCBzdWNjZXNzLCBlcnJvcikgLT5cbiAgICBzdWNjZXNzIFwiaW1hZ2VzL1wiICsgaW1hZ2VVaWQgKyBcIi5qcGdcIlxuXG5jbGFzcyBNb2NrQ2FtZXJhXG4gIHRha2VQaWN0dXJlOiAoc3VjY2VzcywgZXJyb3IpIC0+XG4gICAgc3VjY2VzcyhcImh0dHA6Ly8xMjM0LmpwZ1wiKVxuXG5kZXNjcmliZSAnSW1hZ2VzUXVlc3Rpb24nLCAtPlxuICBiZWZvcmVFYWNoIC0+XG4gICAgIyBDcmVhdGUgbW9kZWxcbiAgICBAbW9kZWwgPSBuZXcgQmFja2JvbmUuTW9kZWwgXG5cbiAgY29udGV4dCAnV2l0aCBhIG5vIGNhbWVyYScsIC0+XG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgIyBDcmVhdGUgY29udGV4dFxuICAgICAgQGN0eCA9IHtcbiAgICAgICAgaW1hZ2VNYW5hZ2VyOiBuZXcgTW9ja0ltYWdlTWFuYWdlcigpXG4gICAgICB9XG5cbiAgICAgIEBxdWVzdGlvbiA9IG5ldyBmb3Jtcy5JbWFnZXNRdWVzdGlvblxuICAgICAgICBtb2RlbDogQG1vZGVsXG4gICAgICAgIGlkOiBcInExXCJcbiAgICAgICAgY3R4OiBAY3R4XG5cbiAgICBpdCAnZGlzcGxheXMgbm8gaW1hZ2UnLCAtPlxuICAgICAgQG1vZGVsLnNldChxMTogW10pXG4gICAgICBhc3NlcnQuaXNUcnVlIHRydWVcblxuICAgIGl0ICdkaXNwbGF5cyBvbmUgaW1hZ2UnLCAtPlxuICAgICAgQG1vZGVsLnNldChxMTogW3tpZDogXCIxMjM0XCJ9XSlcbiAgICAgIGFzc2VydC5lcXVhbCBAcXVlc3Rpb24uJChcImltZy50aHVtYm5haWwtaW1nXCIpLmF0dHIoXCJzcmNcIiksIFwiaW1hZ2VzLzEyMzQuanBnXCJcblxuICAgIGl0ICdvcGVucyBwYWdlJywgLT5cbiAgICAgIEBtb2RlbC5zZXQocTE6IFt7aWQ6IFwiMTIzNFwifV0pXG4gICAgICBzcHkgPSBzaW5vbi5zcHkoKVxuICAgICAgQGN0eC5wYWdlciA9IHsgb3BlblBhZ2U6IHNweSB9XG4gICAgICBAcXVlc3Rpb24uJChcImltZy50aHVtYm5haWwtaW1nXCIpLmNsaWNrKClcblxuICAgICAgYXNzZXJ0LmlzVHJ1ZSBzcHkuY2FsbGVkT25jZVxuICAgICAgYXNzZXJ0LmVxdWFsIHNweS5hcmdzWzBdWzFdLmlkLCBcIjEyMzRcIlxuXG4gICAgaXQgJ2FsbG93cyByZW1vdmluZyBpbWFnZScsIC0+XG4gICAgICBAbW9kZWwuc2V0KHExOiBbe2lkOiBcIjEyMzRcIn1dKVxuICAgICAgQGN0eC5wYWdlciA9IHsgXG4gICAgICAgIG9wZW5QYWdlOiAocGFnZSwgb3B0aW9ucykgPT5cbiAgICAgICAgICBvcHRpb25zLm9uUmVtb3ZlKClcbiAgICAgIH1cbiAgICAgIEBxdWVzdGlvbi4kKFwiaW1nLnRodW1ibmFpbC1pbWdcIikuY2xpY2soKVxuICAgICAgYXNzZXJ0LmVxdWFsIEBxdWVzdGlvbi4kKFwiaW1nI2FkZFwiKS5sZW5ndGgsIDBcblxuICAgIGl0ICdkaXNwbGF5cyBubyBhZGQnLCAtPlxuICAgICAgYXNzZXJ0LmVxdWFsIEBxdWVzdGlvbi4kKFwiaW1nI2FkZFwiKS5sZW5ndGgsIDBcblxuICBjb250ZXh0ICdXaXRoIGEgY2FtZXJhJywgLT5cbiAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAjIENyZWF0ZSBjb250ZXh0XG4gICAgICBAY3R4ID0ge1xuICAgICAgICBpbWFnZU1hbmFnZXI6IG5ldyBNb2NrSW1hZ2VNYW5hZ2VyKClcbiAgICAgICAgY2FtZXJhOiBuZXcgTW9ja0NhbWVyYSgpXG4gICAgICB9XG5cbiAgICAgIEBxdWVzdGlvbiA9IG5ldyBmb3Jtcy5JbWFnZXNRdWVzdGlvblxuICAgICAgICBtb2RlbDogQG1vZGVsXG4gICAgICAgIGlkOiBcInExXCJcbiAgICAgICAgY3R4OiBAY3R4XG5cbiAgICBpdCAnZGlzcGxheXMgbm8gYWRkIGlmIGltYWdlIG1hbmFnZXIgaGFzIG5vIGFkZEltYWdlJywgLT5cbiAgICAgIGFzc2VydC5lcXVhbCBAcXVlc3Rpb24uJChcImltZyNhZGRcIikubGVuZ3RoLCAwXG5cbiAgY29udGV4dCAnV2l0aCBhIGNhbWVyYSBhbmQgaW1hZ2VNYW5hZ2VyIHdpdGggYWRkSW1hZ2UnLCAtPlxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgIGltYWdlTWFuYWdlciA9IG5ldyBNb2NrSW1hZ2VNYW5hZ2VyKClcbiAgICAgIGltYWdlTWFuYWdlci5hZGRJbWFnZSA9ICh1cmwsIHN1Y2Nlc3MsIGVycm9yKSAtPlxuICAgICAgICBhc3NlcnQuZXF1YWwgdXJsLCBcImh0dHA6Ly8xMjM0LmpwZ1wiXG4gICAgICAgIHN1Y2Nlc3MgXCIxMjM0XCJcblxuICAgICAgIyBDcmVhdGUgY29udGV4dFxuICAgICAgQGN0eCA9IHtcbiAgICAgICAgaW1hZ2VNYW5hZ2VyOiBpbWFnZU1hbmFnZXJcbiAgICAgICAgY2FtZXJhOiBuZXcgTW9ja0NhbWVyYSgpXG4gICAgICB9XG5cbiAgICAgIEBxdWVzdGlvbiA9IG5ldyBmb3Jtcy5JbWFnZXNRdWVzdGlvblxuICAgICAgICBtb2RlbDogQG1vZGVsXG4gICAgICAgIGlkOiBcInExXCJcbiAgICAgICAgY3R4OiBAY3R4XG5cbiAgICBpdCAndGFrZXMgYSBwaG90bycsIC0+XG4gICAgICBAY3R4LmNhbWVyYSA9IG5ldyBNb2NrQ2FtZXJhKClcbiAgICAgIEBxdWVzdGlvbi4kKFwiaW1nI2FkZFwiKS5jbGljaygpXG4gICAgICBhc3NlcnQuaXNUcnVlIF8uaXNFcXVhbChAbW9kZWwuZ2V0KFwicTFcIiksIFt7aWQ6XCIxMjM0XCJ9XSksIEBtb2RlbC5nZXQoXCJxMVwiKVxuXG4gICAgIiwiYXNzZXJ0ID0gY2hhaS5hc3NlcnRcbkRyb3Bkb3duUXVlc3Rpb24gPSByZXF1aXJlKCdmb3JtcycpLkRyb3Bkb3duUXVlc3Rpb25cblVJRHJpdmVyID0gcmVxdWlyZSAnLi9oZWxwZXJzL1VJRHJpdmVyJ1xuXG4jIGNsYXNzIE1vY2tMb2NhdGlvbkZpbmRlclxuIyAgIGNvbnN0cnVjdG9yOiAgLT5cbiMgICAgIF8uZXh0ZW5kIEAsIEJhY2tib25lLkV2ZW50c1xuXG4jICAgZ2V0TG9jYXRpb246IC0+XG4jICAgc3RhcnRXYXRjaDogLT5cbiMgICBzdG9wV2F0Y2g6IC0+XG5cbmRlc2NyaWJlICdEcm9wZG93blF1ZXN0aW9uJywgLT5cbiAgY29udGV4dCAnV2l0aCBhIGZldyBvcHRpb25zJywgLT5cbiAgICBiZWZvcmVFYWNoIC0+XG4gICAgICBAbW9kZWwgPSBuZXcgQmFja2JvbmUuTW9kZWwoKVxuICAgICAgQHF1ZXN0aW9uID0gbmV3IERyb3Bkb3duUXVlc3Rpb25cbiAgICAgICAgb3B0aW9uczogW1snYScsICdBcHBsZSddLCBbJ2InLCAnQmFuYW5hJ11dXG4gICAgICAgIG1vZGVsOiBAbW9kZWxcbiAgICAgICAgaWQ6IFwicTFcIlxuXG4gICAgaXQgJ2FjY2VwdHMga25vd24gdmFsdWUnLCAtPlxuICAgICAgQG1vZGVsLnNldChxMTogJ2EnKVxuICAgICAgYXNzZXJ0LmVxdWFsIEBtb2RlbC5nZXQoJ3ExJyksICdhJ1xuICAgICAgYXNzZXJ0LmlzRmFsc2UgQHF1ZXN0aW9uLiQoXCJzZWxlY3RcIikuaXMoXCI6ZGlzYWJsZWRcIilcblxuICAgIGl0ICdpcyBkaXNhYmxlZCB3aXRoIHVua25vd24gdmFsdWUnLCAtPlxuICAgICAgQG1vZGVsLnNldChxMTogJ3gnKVxuICAgICAgYXNzZXJ0LmVxdWFsIEBtb2RlbC5nZXQoJ3ExJyksICd4J1xuICAgICAgYXNzZXJ0LmlzVHJ1ZSBAcXVlc3Rpb24uJChcInNlbGVjdFwiKS5pcyhcIjpkaXNhYmxlZFwiKVxuXG4gICAgaXQgJ2lzIG5vdCBkaXNhYmxlZCB3aXRoIGVtcHR5IHZhbHVlJywgLT5cbiAgICAgIEBtb2RlbC5zZXQocTE6IG51bGwpXG4gICAgICBhc3NlcnQuZXF1YWwgQG1vZGVsLmdldCgncTEnKSwgbnVsbFxuICAgICAgYXNzZXJ0LmlzRmFsc2UgQHF1ZXN0aW9uLiQoXCJzZWxlY3RcIikuaXMoXCI6ZGlzYWJsZWRcIilcblxuICAgIGl0ICdpcyByZWVuYWJsZWQgd2l0aCBzZXR0aW5nIHZhbHVlJywgLT5cbiAgICAgIEBtb2RlbC5zZXQocTE6ICd4JylcbiAgICAgIGFzc2VydC5lcXVhbCBAbW9kZWwuZ2V0KCdxMScpLCAneCdcbiAgICAgIEBxdWVzdGlvbi5zZXRPcHRpb25zKFtbJ2EnLCAnQXBwbGUnXSwgWydiJywgJ0JhbmFuYSddLCBbJ3gnLCAnS2l3aSddXSlcbiAgICAgIGFzc2VydC5pc0ZhbHNlIEBxdWVzdGlvbi4kKFwic2VsZWN0XCIpLmlzKFwiOmRpc2FibGVkXCIpXG5cbiIsImFzc2VydCA9IGNoYWkuYXNzZXJ0XG5JdGVtVHJhY2tlciA9IHJlcXVpcmUgXCIuLi9hcHAvanMvSXRlbVRyYWNrZXJcIlxuXG5kZXNjcmliZSAnSXRlbVRyYWNrZXInLCAtPlxuICBiZWZvcmVFYWNoIC0+XG4gICAgQHRyYWNrZXIgPSBuZXcgSXRlbVRyYWNrZXIoKVxuXG4gIGl0IFwicmVjb3JkcyBhZGRzXCIsIC0+XG4gICAgaXRlbXMgPSAgW1xuICAgICAgX2lkOiAxLCB4OjFcbiAgICAgIF9pZDogMiwgeDoyXG4gICAgXVxuICAgIFthZGRzLCByZW1vdmVzXSA9IEB0cmFja2VyLnVwZGF0ZShpdGVtcylcbiAgICBhc3NlcnQuZGVlcEVxdWFsIGFkZHMsIGl0ZW1zXG4gICAgYXNzZXJ0LmRlZXBFcXVhbCByZW1vdmVzLCBbXVxuXG4gIGl0IFwicmVtZW1iZXJzIGl0ZW1zXCIsIC0+XG4gICAgaXRlbXMgPSAgW1xuICAgICAge19pZDogMSwgeDoxfVxuICAgICAge19pZDogMiwgeDoyfVxuICAgIF1cbiAgICBbYWRkcywgcmVtb3Zlc10gPSBAdHJhY2tlci51cGRhdGUoaXRlbXMpXG4gICAgW2FkZHMsIHJlbW92ZXNdID0gQHRyYWNrZXIudXBkYXRlKGl0ZW1zKVxuICAgIGFzc2VydC5kZWVwRXF1YWwgYWRkcywgW11cbiAgICBhc3NlcnQuZGVlcEVxdWFsIHJlbW92ZXMsIFtdXG5cbiAgaXQgXCJzZWVzIHJlbW92ZWQgaXRlbXNcIiwgLT5cbiAgICBpdGVtczEgPSAgW1xuICAgICAge19pZDogMSwgeDoxfVxuICAgICAge19pZDogMiwgeDoyfVxuICAgIF1cbiAgICBpdGVtczIgPSAgW1xuICAgICAge19pZDogMSwgeDoxfVxuICAgIF1cbiAgICBAdHJhY2tlci51cGRhdGUoaXRlbXMxKVxuICAgIFthZGRzLCByZW1vdmVzXSA9IEB0cmFja2VyLnVwZGF0ZShpdGVtczIpXG4gICAgYXNzZXJ0LmRlZXBFcXVhbCBhZGRzLCBbXVxuICAgIGFzc2VydC5kZWVwRXF1YWwgcmVtb3ZlcywgW3tfaWQ6IDIsIHg6Mn1dXG5cbiAgaXQgXCJzZWVzIHJlbW92ZWQgY2hhbmdlc1wiLCAtPlxuICAgIGl0ZW1zMSA9ICBbXG4gICAgICB7X2lkOiAxLCB4OjF9XG4gICAgICB7X2lkOiAyLCB4OjJ9XG4gICAgXVxuICAgIGl0ZW1zMiA9ICBbXG4gICAgICB7X2lkOiAxLCB4OjF9XG4gICAgICB7X2lkOiAyLCB4OjR9XG4gICAgXVxuICAgIEB0cmFja2VyLnVwZGF0ZShpdGVtczEpXG4gICAgW2FkZHMsIHJlbW92ZXNdID0gQHRyYWNrZXIudXBkYXRlKGl0ZW1zMilcbiAgICBhc3NlcnQuZGVlcEVxdWFsIGFkZHMsIFt7X2lkOiAyLCB4OjR9XVxuICAgIGFzc2VydC5kZWVwRXF1YWwgcmVtb3ZlcywgW3tfaWQ6IDIsIHg6Mn1dXG4iLCJhc3NlcnQgPSBjaGFpLmFzc2VydFxuTG9jYWxEYiA9IHJlcXVpcmUgXCIuLi9hcHAvanMvZGIvTG9jYWxEYlwiXG5kYl9xdWVyaWVzID0gcmVxdWlyZSBcIi4vZGJfcXVlcmllc1wiXG5cbmRlc2NyaWJlICdMb2NhbERiJywgLT5cbiAgYmVmb3JlIC0+XG4gICAgQGRiID0gbmV3IExvY2FsRGIoKVxuXG4gIGJlZm9yZUVhY2ggKGRvbmUpIC0+XG4gICAgQGRiLnJlbW92ZUNvbGxlY3Rpb24oJ3NjcmF0Y2gnKVxuICAgIEBkYi5hZGRDb2xsZWN0aW9uKCdzY3JhdGNoJylcbiAgICBkb25lKClcblxuICBkZXNjcmliZSBcInBhc3NlcyBxdWVyaWVzXCIsIC0+XG4gICAgZGJfcXVlcmllcy5jYWxsKHRoaXMpXG5cbiAgaXQgJ2NhY2hlcyByb3dzJywgKGRvbmUpIC0+XG4gICAgQGRiLnNjcmF0Y2guY2FjaGUgW3sgX2lkOiAxLCBhOiAnYXBwbGUnIH1dLCB7fSwge30sID0+XG4gICAgICBAZGIuc2NyYXRjaC5maW5kKHt9KS5mZXRjaCAocmVzdWx0cykgLT5cbiAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHNbMF0uYSwgJ2FwcGxlJ1xuICAgICAgICBkb25lKClcblxuICBpdCAnY2FjaGUgb3ZlcndyaXRlIGV4aXN0aW5nJywgKGRvbmUpIC0+XG4gICAgQGRiLnNjcmF0Y2guY2FjaGUgW3sgX2lkOiAxLCBhOiAnYXBwbGUnIH1dLCB7fSwge30sID0+XG4gICAgICBAZGIuc2NyYXRjaC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdiYW5hbmEnIH1dLCB7fSwge30sID0+XG4gICAgICAgIEBkYi5zY3JhdGNoLmZpbmQoe30pLmZldGNoIChyZXN1bHRzKSAtPlxuICAgICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzWzBdLmEsICdiYW5hbmEnXG4gICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJjYWNoZSBkb2Vzbid0IG92ZXJ3cml0ZSB1cHNlcnRcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnNjcmF0Y2gudXBzZXJ0IHsgX2lkOiAxLCBhOiAnYXBwbGUnIH0sID0+XG4gICAgICBAZGIuc2NyYXRjaC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdiYW5hbmEnIH1dLCB7fSwge30sID0+XG4gICAgICAgIEBkYi5zY3JhdGNoLmZpbmQoe30pLmZldGNoIChyZXN1bHRzKSAtPlxuICAgICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzWzBdLmEsICdhcHBsZSdcbiAgICAgICAgICBkb25lKClcblxuICBpdCBcImNhY2hlIGRvZXNuJ3Qgb3ZlcndyaXRlIHJlbW92ZVwiLCAoZG9uZSkgLT5cbiAgICBAZGIuc2NyYXRjaC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdkZWxldGUnIH1dLCB7fSwge30sID0+XG4gICAgICBAZGIuc2NyYXRjaC5yZW1vdmUgMSwgPT5cbiAgICAgIEBkYi5zY3JhdGNoLmNhY2hlIFt7IF9pZDogMSwgYTogJ2JhbmFuYScgfV0sIHt9LCB7fSwgPT5cbiAgICAgICAgQGRiLnNjcmF0Y2guZmluZCh7fSkuZmV0Y2ggKHJlc3VsdHMpIC0+XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHMubGVuZ3RoLCAwXG4gICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJjYWNoZSByZW1vdmVzIG1pc3NpbmcgdW5zb3J0ZWRcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnNjcmF0Y2guY2FjaGUgW3sgX2lkOiAxLCBhOiAnYScgfSwgeyBfaWQ6IDIsIGE6ICdiJyB9LCB7IF9pZDogMywgYTogJ2MnIH1dLCB7fSwge30sID0+XG4gICAgICBAZGIuc2NyYXRjaC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdhJyB9LCB7IF9pZDogMywgYTogJ2MnIH1dLCB7fSwge30sID0+XG4gICAgICAgIEBkYi5zY3JhdGNoLmZpbmQoe30pLmZldGNoIChyZXN1bHRzKSAtPlxuICAgICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzLmxlbmd0aCwgMlxuICAgICAgICAgIGRvbmUoKVxuXG4gIGl0IFwiY2FjaGUgcmVtb3ZlcyBtaXNzaW5nIGZpbHRlcmVkXCIsIChkb25lKSAtPlxuICAgIEBkYi5zY3JhdGNoLmNhY2hlIFt7IF9pZDogMSwgYTogJ2EnIH0sIHsgX2lkOiAyLCBhOiAnYicgfSwgeyBfaWQ6IDMsIGE6ICdjJyB9XSwge30sIHt9LCA9PlxuICAgICAgQGRiLnNjcmF0Y2guY2FjaGUgW3sgX2lkOiAxLCBhOiAnYScgfV0sIHtfaWQ6IHskbHQ6M319LCB7fSwgPT5cbiAgICAgICAgQGRiLnNjcmF0Y2guZmluZCh7fSwge3NvcnQ6WydfaWQnXX0pLmZldGNoIChyZXN1bHRzKSAtPlxuICAgICAgICAgIGFzc2VydC5kZWVwRXF1YWwgXy5wbHVjayhyZXN1bHRzLCAnX2lkJyksIFsxLDNdXG4gICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJjYWNoZSByZW1vdmVzIG1pc3Npbmcgc29ydGVkIGxpbWl0ZWRcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnNjcmF0Y2guY2FjaGUgW3sgX2lkOiAxLCBhOiAnYScgfSwgeyBfaWQ6IDIsIGE6ICdiJyB9LCB7IF9pZDogMywgYTogJ2MnIH1dLCB7fSwge30sID0+XG4gICAgICBAZGIuc2NyYXRjaC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdhJyB9XSwge30sIHtzb3J0OlsnX2lkJ10sIGxpbWl0OjJ9LCA9PlxuICAgICAgICBAZGIuc2NyYXRjaC5maW5kKHt9LCB7c29ydDpbJ19pZCddfSkuZmV0Y2ggKHJlc3VsdHMpIC0+XG4gICAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCBfLnBsdWNrKHJlc3VsdHMsICdfaWQnKSwgWzEsM11cbiAgICAgICAgICBkb25lKClcblxuICBpdCBcImNhY2hlIGRvZXMgbm90IHJlbW92ZSBtaXNzaW5nIHNvcnRlZCBsaW1pdGVkIHBhc3QgZW5kXCIsIChkb25lKSAtPlxuICAgIEBkYi5zY3JhdGNoLmNhY2hlIFt7IF9pZDogMSwgYTogJ2EnIH0sIHsgX2lkOiAyLCBhOiAnYicgfSwgeyBfaWQ6IDMsIGE6ICdjJyB9LCB7IF9pZDogNCwgYTogJ2QnIH1dLCB7fSwge30sID0+XG4gICAgICBAZGIuc2NyYXRjaC5yZW1vdmUgMiwgPT5cbiAgICAgICAgQGRiLnNjcmF0Y2guY2FjaGUgW3sgX2lkOiAxLCBhOiAnYScgfSwgeyBfaWQ6IDIsIGE6ICdiJyB9XSwge30sIHtzb3J0OlsnX2lkJ10sIGxpbWl0OjJ9LCA9PlxuICAgICAgICAgIEBkYi5zY3JhdGNoLmZpbmQoe30sIHtzb3J0OlsnX2lkJ119KS5mZXRjaCAocmVzdWx0cykgLT5cbiAgICAgICAgICAgIGFzc2VydC5kZWVwRXF1YWwgXy5wbHVjayhyZXN1bHRzLCAnX2lkJyksIFsxLDMsNF1cbiAgICAgICAgICAgIGRvbmUoKVxuXG4gIGl0IFwicmV0dXJucyBwZW5kaW5nIHVwc2VydHNcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnNjcmF0Y2guY2FjaGUgW3sgX2lkOiAxLCBhOiAnYXBwbGUnIH1dLCB7fSwge30sID0+XG4gICAgICBAZGIuc2NyYXRjaC51cHNlcnQgeyBfaWQ6IDIsIGE6ICdiYW5hbmEnIH0sID0+XG4gICAgICAgIEBkYi5zY3JhdGNoLnBlbmRpbmdVcHNlcnRzIChyZXN1bHRzKSA9PlxuICAgICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzLmxlbmd0aCwgMVxuICAgICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzWzBdLmEsICdiYW5hbmEnXG4gICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJyZXNvbHZlcyBwZW5kaW5nIHVwc2VydHNcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnNjcmF0Y2gudXBzZXJ0IHsgX2lkOiAyLCBhOiAnYmFuYW5hJyB9LCA9PlxuICAgICAgQGRiLnNjcmF0Y2gucmVzb2x2ZVVwc2VydCB7IF9pZDogMiwgYTogJ2JhbmFuYScgfSwgPT5cbiAgICAgICAgQGRiLnNjcmF0Y2gucGVuZGluZ1Vwc2VydHMgKHJlc3VsdHMpID0+XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHMubGVuZ3RoLCAwXG4gICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJyZXRhaW5zIGNoYW5nZWQgcGVuZGluZyB1cHNlcnRzXCIsIChkb25lKSAtPlxuICAgIEBkYi5zY3JhdGNoLnVwc2VydCB7IF9pZDogMiwgYTogJ2JhbmFuYScgfSwgPT5cbiAgICAgIEBkYi5zY3JhdGNoLnVwc2VydCB7IF9pZDogMiwgYTogJ2JhbmFuYTInIH0sID0+XG4gICAgICAgIEBkYi5zY3JhdGNoLnJlc29sdmVVcHNlcnQgeyBfaWQ6IDIsIGE6ICdiYW5hbmEnIH0sID0+XG4gICAgICAgICAgQGRiLnNjcmF0Y2gucGVuZGluZ1Vwc2VydHMgKHJlc3VsdHMpID0+XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0cy5sZW5ndGgsIDFcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzWzBdLmEsICdiYW5hbmEyJ1xuICAgICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJyZW1vdmVzIHBlbmRpbmcgdXBzZXJ0c1wiLCAoZG9uZSkgLT5cbiAgICBAZGIuc2NyYXRjaC51cHNlcnQgeyBfaWQ6IDIsIGE6ICdiYW5hbmEnIH0sID0+XG4gICAgICBAZGIuc2NyYXRjaC5yZW1vdmUgMiwgPT5cbiAgICAgICAgQGRiLnNjcmF0Y2gucGVuZGluZ1Vwc2VydHMgKHJlc3VsdHMpID0+XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHMubGVuZ3RoLCAwXG4gICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJyZXR1cm5zIHBlbmRpbmcgcmVtb3Zlc1wiLCAoZG9uZSkgLT5cbiAgICBAZGIuc2NyYXRjaC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdhcHBsZScgfV0sIHt9LCB7fSwgPT5cbiAgICAgIEBkYi5zY3JhdGNoLnJlbW92ZSAxLCA9PlxuICAgICAgICBAZGIuc2NyYXRjaC5wZW5kaW5nUmVtb3ZlcyAocmVzdWx0cykgPT5cbiAgICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0cy5sZW5ndGgsIDFcbiAgICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0c1swXSwgMVxuICAgICAgICAgIGRvbmUoKVxuXG4gIGl0IFwicmVzb2x2ZXMgcGVuZGluZyByZW1vdmVzXCIsIChkb25lKSAtPlxuICAgIEBkYi5zY3JhdGNoLmNhY2hlIFt7IF9pZDogMSwgYTogJ2FwcGxlJyB9XSwge30sIHt9LCA9PlxuICAgICAgQGRiLnNjcmF0Y2gucmVtb3ZlIDEsID0+XG4gICAgICAgIEBkYi5zY3JhdGNoLnJlc29sdmVSZW1vdmUgMSwgPT5cbiAgICAgICAgICBAZGIuc2NyYXRjaC5wZW5kaW5nUmVtb3ZlcyAocmVzdWx0cykgPT5cbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzLmxlbmd0aCwgMFxuICAgICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJzZWVkc1wiLCAoZG9uZSkgLT5cbiAgICBAZGIuc2NyYXRjaC5zZWVkIHsgX2lkOiAxLCBhOiAnYXBwbGUnIH0sID0+XG4gICAgICBAZGIuc2NyYXRjaC5maW5kKHt9KS5mZXRjaCAocmVzdWx0cykgLT5cbiAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHNbMF0uYSwgJ2FwcGxlJ1xuICAgICAgICBkb25lKClcblxuICBpdCBcImRvZXMgbm90IG92ZXJ3cml0ZSBleGlzdGluZ1wiLCAoZG9uZSkgLT5cbiAgICBAZGIuc2NyYXRjaC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdiYW5hbmEnIH1dLCB7fSwge30sID0+XG4gICAgICBAZGIuc2NyYXRjaC5zZWVkIHsgX2lkOiAxLCBhOiAnYXBwbGUnIH0sID0+XG4gICAgICAgIEBkYi5zY3JhdGNoLmZpbmQoe30pLmZldGNoIChyZXN1bHRzKSAtPlxuICAgICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzWzBdLmEsICdiYW5hbmEnXG4gICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJkb2VzIG5vdCBhZGQgcmVtb3ZlZFwiLCAoZG9uZSkgLT5cbiAgICBAZGIuc2NyYXRjaC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdhcHBsZScgfV0sIHt9LCB7fSwgPT5cbiAgICAgIEBkYi5zY3JhdGNoLnJlbW92ZSAxLCA9PlxuICAgICAgICBAZGIuc2NyYXRjaC5zZWVkIHsgX2lkOiAxLCBhOiAnYXBwbGUnIH0sID0+XG4gICAgICAgICAgQGRiLnNjcmF0Y2guZmluZCh7fSkuZmV0Y2ggKHJlc3VsdHMpIC0+XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0cy5sZW5ndGgsIDBcbiAgICAgICAgICAgIGRvbmUoKVxuXG5kZXNjcmliZSAnTG9jYWxEYiB3aXRoIGxvY2FsIHN0b3JhZ2UnLCAtPlxuICBiZWZvcmUgLT5cbiAgICBAZGIgPSBuZXcgTG9jYWxEYih7IG5hbWVzcGFjZTogXCJkYi5zY3JhdGNoXCIgfSlcblxuICBiZWZvcmVFYWNoIChkb25lKSAtPlxuICAgIEBkYi5yZW1vdmVDb2xsZWN0aW9uKCdzY3JhdGNoJylcbiAgICBAZGIuYWRkQ29sbGVjdGlvbignc2NyYXRjaCcpXG4gICAgZG9uZSgpXG5cbiAgaXQgXCJyZXRhaW5zIGl0ZW1zXCIsIChkb25lKSAtPlxuICAgIEBkYi5zY3JhdGNoLnVwc2VydCB7IF9pZDoxLCBhOlwiQWxpY2VcIiB9LCA9PlxuICAgICAgZGIyID0gbmV3IExvY2FsRGIoeyBuYW1lc3BhY2U6IFwiZGIuc2NyYXRjaFwiIH0pXG4gICAgICBkYjIuYWRkQ29sbGVjdGlvbiAnc2NyYXRjaCdcbiAgICAgIGRiMi5zY3JhdGNoLmZpbmQoe30pLmZldGNoIChyZXN1bHRzKSAtPlxuICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0c1swXS5hLCBcIkFsaWNlXCJcbiAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJyZXRhaW5zIHVwc2VydHNcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnNjcmF0Y2gudXBzZXJ0IHsgX2lkOjEsIGE6XCJBbGljZVwiIH0sID0+XG4gICAgICBkYjIgPSBuZXcgTG9jYWxEYih7IG5hbWVzcGFjZTogXCJkYi5zY3JhdGNoXCIgfSlcbiAgICAgIGRiMi5hZGRDb2xsZWN0aW9uICdzY3JhdGNoJ1xuICAgICAgZGIyLnNjcmF0Y2guZmluZCh7fSkuZmV0Y2ggKHJlc3VsdHMpIC0+XG4gICAgICAgIGRiMi5zY3JhdGNoLnBlbmRpbmdVcHNlcnRzICh1cHNlcnRzKSAtPlxuICAgICAgICAgIGFzc2VydC5kZWVwRXF1YWwgcmVzdWx0cywgdXBzZXJ0c1xuICAgICAgICAgIGRvbmUoKVxuXG4gIGl0IFwicmV0YWlucyByZW1vdmVzXCIsIChkb25lKSAtPlxuICAgIEBkYi5zY3JhdGNoLnNlZWQgeyBfaWQ6MSwgYTpcIkFsaWNlXCIgfSwgPT5cbiAgICAgIEBkYi5zY3JhdGNoLnJlbW92ZSAxLCA9PlxuICAgICAgICBkYjIgPSBuZXcgTG9jYWxEYih7IG5hbWVzcGFjZTogXCJkYi5zY3JhdGNoXCIgfSlcbiAgICAgICAgZGIyLmFkZENvbGxlY3Rpb24gJ3NjcmF0Y2gnXG4gICAgICAgIGRiMi5zY3JhdGNoLnBlbmRpbmdSZW1vdmVzIChyZW1vdmVzKSAtPlxuICAgICAgICAgIGFzc2VydC5kZWVwRXF1YWwgcmVtb3ZlcywgWzFdXG4gICAgICAgICAgZG9uZSgpXG5cbmRlc2NyaWJlICdMb2NhbERiIHdpdGhvdXQgbG9jYWwgc3RvcmFnZScsIC0+XG4gIGJlZm9yZSAtPlxuICAgIEBkYiA9IG5ldyBMb2NhbERiKClcblxuICBiZWZvcmVFYWNoIChkb25lKSAtPlxuICAgIEBkYi5yZW1vdmVDb2xsZWN0aW9uKCdzY3JhdGNoJylcbiAgICBAZGIuYWRkQ29sbGVjdGlvbignc2NyYXRjaCcpXG4gICAgZG9uZSgpXG5cbiAgaXQgXCJkb2VzIG5vdCByZXRhaW4gaXRlbXNcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnNjcmF0Y2gudXBzZXJ0IHsgX2lkOjEsIGE6XCJBbGljZVwiIH0sID0+XG4gICAgICBkYjIgPSBuZXcgTG9jYWxEYigpXG4gICAgICBkYjIuYWRkQ29sbGVjdGlvbiAnc2NyYXRjaCdcbiAgICAgIGRiMi5zY3JhdGNoLmZpbmQoe30pLmZldGNoIChyZXN1bHRzKSAtPlxuICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0cy5sZW5ndGgsIDBcbiAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJkb2VzIG5vdCByZXRhaW4gdXBzZXJ0c1wiLCAoZG9uZSkgLT5cbiAgICBAZGIuc2NyYXRjaC51cHNlcnQgeyBfaWQ6MSwgYTpcIkFsaWNlXCIgfSwgPT5cbiAgICAgIGRiMiA9IG5ldyBMb2NhbERiKClcbiAgICAgIGRiMi5hZGRDb2xsZWN0aW9uICdzY3JhdGNoJ1xuICAgICAgZGIyLnNjcmF0Y2guZmluZCh7fSkuZmV0Y2ggKHJlc3VsdHMpIC0+XG4gICAgICAgIGRiMi5zY3JhdGNoLnBlbmRpbmdVcHNlcnRzICh1cHNlcnRzKSAtPlxuICAgICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzLmxlbmd0aCwgMFxuICAgICAgICAgIGRvbmUoKVxuXG4gIGl0IFwiZG9lcyBub3QgcmV0YWluIHJlbW92ZXNcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnNjcmF0Y2guc2VlZCB7IF9pZDoxLCBhOlwiQWxpY2VcIiB9LCA9PlxuICAgICAgQGRiLnNjcmF0Y2gucmVtb3ZlIDEsID0+XG4gICAgICAgIGRiMiA9IG5ldyBMb2NhbERiKClcbiAgICAgICAgZGIyLmFkZENvbGxlY3Rpb24gJ3NjcmF0Y2gnXG4gICAgICAgIGRiMi5zY3JhdGNoLnBlbmRpbmdSZW1vdmVzIChyZW1vdmVzKSAtPlxuICAgICAgICAgIGFzc2VydC5lcXVhbCByZW1vdmVzLmxlbmd0aCwgMFxuICAgICAgICAgIGRvbmUoKVxuXG4iLCJhc3NlcnQgPSBjaGFpLmFzc2VydFxuTG9jYXRpb25WaWV3ID0gcmVxdWlyZSAnLi4vYXBwL2pzL0xvY2F0aW9uVmlldydcblVJRHJpdmVyID0gcmVxdWlyZSAnLi9oZWxwZXJzL1VJRHJpdmVyJ1xuXG5jbGFzcyBNb2NrTG9jYXRpb25GaW5kZXJcbiAgY29uc3RydWN0b3I6ICAtPlxuICAgIF8uZXh0ZW5kIEAsIEJhY2tib25lLkV2ZW50c1xuXG4gIGdldExvY2F0aW9uOiAtPlxuICBzdGFydFdhdGNoOiAtPlxuICBzdG9wV2F0Y2g6IC0+XG5cbmRlc2NyaWJlICdMb2NhdGlvblZpZXcnLCAtPlxuICBjb250ZXh0ICdXaXRoIG5vIHNldCBsb2NhdGlvbicsIC0+XG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgQGxvY2F0aW9uRmluZGVyID0gbmV3IE1vY2tMb2NhdGlvbkZpbmRlcigpXG4gICAgICBAbG9jYXRpb25WaWV3ID0gbmV3IExvY2F0aW9uVmlldyhsb2M6bnVsbCwgbG9jYXRpb25GaW5kZXI6IEBsb2NhdGlvbkZpbmRlcilcbiAgICAgIEB1aSA9IG5ldyBVSURyaXZlcihAbG9jYXRpb25WaWV3LmVsKVxuXG4gICAgaXQgJ2Rpc3BsYXlzIFVuc3BlY2lmaWVkJywgLT5cbiAgICAgIGFzc2VydC5pbmNsdWRlKEB1aS50ZXh0KCksICdVbnNwZWNpZmllZCcpXG5cbiAgICBpdCAnZGlzYWJsZXMgbWFwJywgLT5cbiAgICAgIGFzc2VydC5pc1RydWUgQHVpLmdldERpc2FibGVkKFwiTWFwXCIpIFxuXG4gICAgaXQgJ2FsbG93cyBzZXR0aW5nIGxvY2F0aW9uJywgLT5cbiAgICAgIEB1aS5jbGljaygnU2V0JylcbiAgICAgIHNldFBvcyA9IG51bGxcbiAgICAgIEBsb2NhdGlvblZpZXcub24gJ2xvY2F0aW9uc2V0JywgKHBvcykgLT5cbiAgICAgICAgc2V0UG9zID0gcG9zXG5cbiAgICAgIEBsb2NhdGlvbkZpbmRlci50cmlnZ2VyICdmb3VuZCcsIHsgY29vcmRzOiB7IGxhdGl0dWRlOiAyLCBsb25naXR1ZGU6IDMsIGFjY3VyYWN5OiAxMH19XG4gICAgICBhc3NlcnQuZXF1YWwgc2V0UG9zLmNvb3JkaW5hdGVzWzFdLCAyXG5cbiAgICBpdCAnRGlzcGxheXMgZXJyb3InLCAtPlxuICAgICAgQHVpLmNsaWNrKCdTZXQnKVxuICAgICAgc2V0UG9zID0gbnVsbFxuICAgICAgQGxvY2F0aW9uVmlldy5vbiAnbG9jYXRpb25zZXQnLCAocG9zKSAtPlxuICAgICAgICBzZXRQb3MgPSBwb3NcblxuICAgICAgQGxvY2F0aW9uRmluZGVyLnRyaWdnZXIgJ2Vycm9yJ1xuICAgICAgYXNzZXJ0LmVxdWFsIHNldFBvcywgbnVsbFxuICAgICAgYXNzZXJ0LmluY2x1ZGUoQHVpLnRleHQoKSwgJ0Nhbm5vdCcpXG5cbiAgY29udGV4dCAnV2l0aCBzZXQgbG9jYXRpb24nLCAtPlxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgIEBsb2NhdGlvbkZpbmRlciA9IG5ldyBNb2NrTG9jYXRpb25GaW5kZXIoKVxuICAgICAgQGxvY2F0aW9uVmlldyA9IG5ldyBMb2NhdGlvblZpZXcobG9jOiB7IHR5cGU6IFwiUG9pbnRcIiwgY29vcmRpbmF0ZXM6IFsxMCwgMjBdfSwgbG9jYXRpb25GaW5kZXI6IEBsb2NhdGlvbkZpbmRlcilcbiAgICAgIEB1aSA9IG5ldyBVSURyaXZlcihAbG9jYXRpb25WaWV3LmVsKVxuXG4gICAgaXQgJ2Rpc3BsYXlzIFdhaXRpbmcnLCAtPlxuICAgICAgYXNzZXJ0LmluY2x1ZGUoQHVpLnRleHQoKSwgJ1dhaXRpbmcnKVxuXG4gICAgaXQgJ2Rpc3BsYXlzIHJlbGF0aXZlJywgLT5cbiAgICAgIEBsb2NhdGlvbkZpbmRlci50cmlnZ2VyICdmb3VuZCcsIHsgY29vcmRzOiB7IGxhdGl0dWRlOiAyMSwgbG9uZ2l0dWRlOiAxMCwgYWNjdXJhY3k6IDEwfX1cbiAgICAgIGFzc2VydC5pbmNsdWRlKEB1aS50ZXh0KCksICcxMTEuMmttIFMnKVxuXG4iLCJhc3NlcnQgPSBjaGFpLmFzc2VydFxuUmVtb3RlRGIgPSByZXF1aXJlIFwiLi4vYXBwL2pzL2RiL1JlbW90ZURiXCJcbmRiX3F1ZXJpZXMgPSByZXF1aXJlIFwiLi9kYl9xdWVyaWVzXCJcblxuIyBUbyB3b3JrLCB0aGlzIG11c3QgaGF2ZSB0aGUgZm9sbG93aW5nIHNlcnZlciBydW5uaW5nOlxuIyBOT0RFX0VOVj10ZXN0IG5vZGUgc2VydmVyLmpzXG5pZiBmYWxzZVxuICBkZXNjcmliZSAnUmVtb3RlRGInLCAtPlxuICAgIGJlZm9yZUVhY2ggKGRvbmUpIC0+XG4gICAgICB1cmwgPSAnaHR0cDovL2xvY2FsaG9zdDo4MDgwL3YzLydcbiAgICAgIHJlcSA9ICQucG9zdCh1cmwgKyBcIl9yZXNldFwiLCB7fSlcbiAgICAgIHJlcS5mYWlsIChqcVhIUiwgdGV4dFN0YXR1cywgZXJyb3JUaHJvd24pID0+XG4gICAgICAgIHRocm93IHRleHRTdGF0dXNcbiAgICAgIHJlcS5kb25lID0+XG4gICAgICAgIHJlcSA9ICQuYWpheCh1cmwgKyBcInVzZXJzL3Rlc3RcIiwge1xuICAgICAgICAgIGRhdGEgOiBKU09OLnN0cmluZ2lmeSh7IGVtYWlsOiBcInRlc3RAdGVzdC5jb21cIiwgcGFzc3dvcmQ6XCJ4eXp6eVwiIH0pLFxuICAgICAgICAgIGNvbnRlbnRUeXBlIDogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICAgIHR5cGUgOiAnUFVUJ30pXG4gICAgICAgIHJlcS5kb25lIChkYXRhKSA9PlxuICAgICAgICAgIHJlcSA9ICQuYWpheCh1cmwgKyBcInVzZXJzL3Rlc3RcIiwge1xuICAgICAgICAgIGRhdGEgOiBKU09OLnN0cmluZ2lmeSh7IHBhc3N3b3JkOlwieHl6enlcIiB9KSxcbiAgICAgICAgICBjb250ZW50VHlwZSA6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICB0eXBlIDogJ1BPU1QnfSlcbiAgICAgICAgICByZXEuZG9uZSAoZGF0YSkgPT5cbiAgICAgICAgICAgIEBjbGllbnQgPSBkYXRhLmNsaWVudFxuXG4gICAgICAgICAgICBAZGIgPSBuZXcgUmVtb3RlRGIodXJsLCBAY2xpZW50KVxuICAgICAgICAgICAgQGRiLmFkZENvbGxlY3Rpb24oJ3NjcmF0Y2gnKVxuXG4gICAgICAgICAgICBkb25lKClcblxuICAgIGRlc2NyaWJlIFwicGFzc2VzIHF1ZXJpZXNcIiwgLT5cbiAgICAgIGRiX3F1ZXJpZXMuY2FsbCh0aGlzKVxuIiwiYXNzZXJ0ID0gY2hhaS5hc3NlcnRcbmF1dGggPSByZXF1aXJlIFwiLi4vYXBwL2pzL2F1dGhcIlxuXG5cbmRlc2NyaWJlIFwiVXNlckF1dGhcIiwgLT5cbiAgY29udGV4dCBcInVzZXIgb25seVwiLCAtPlxuICAgIGJlZm9yZSAtPlxuICAgICAgQGF1dGggPSBuZXcgYXV0aC5Vc2VyQXV0aChcInNvbWV1c2VyXCIpXG5cbiAgICBpdCBcImRvZXMgbm90IGFsbG93IHNvdXJjZV90eXBlcyBpbnNlcnRcIiwgLT5cbiAgICAgIGFzc2VydC5pc0ZhbHNlIEBhdXRoLmluc2VydChcInNvdXJjZV90eXBlc1wiKVxuXG4gICAgaXQgXCJkb2VzIGFsbG93IHNvdXJjZXMgaW5zZXJ0XCIsIC0+XG4gICAgICBhc3NlcnQuaXNUcnVlIEBhdXRoLmluc2VydChcInNvdXJjZXNcIilcblxuICAgIGl0IFwiZG9lcyBhbGxvdyBzb3VyY2VzIHVwZGF0ZSBmb3IgdXNlclwiLCAtPlxuICAgICAgYXNzZXJ0LmlzVHJ1ZSBAYXV0aC51cGRhdGUoXCJzb3VyY2VzXCIsIHsgdXNlcjogXCJzb21ldXNlclwifSlcblxuICAgIGl0IFwiZG9lcyBhbGxvdyBzb3VyY2VzIHVwZGF0ZXMgaW4gZ2VuZXJhbFwiLCAtPlxuICAgICAgYXNzZXJ0LmlzVHJ1ZSBAYXV0aC51cGRhdGUoXCJzb3VyY2VzXCIpXG5cbiAgICBpdCBcImRvZXMgbm90IGFsbG93IHNvdXJjZXMgdXBkYXRlIGZvciBvdGhlciB1c2VyXCIsIC0+XG4gICAgICBhc3NlcnQuaXNGYWxzZSBAYXV0aC51cGRhdGUoXCJzb3VyY2VzXCIsIHsgdXNlcjogXCJ4eXp6eVwifSlcblxuICBjb250ZXh0IFwidXNlciBhbmQgb3JnXCIsIC0+XG4gICAgYmVmb3JlIC0+XG4gICAgICBAYXV0aCA9IG5ldyBhdXRoLlVzZXJBdXRoKFwic29tZXVzZXJcIiwgXCJzb21lb3JnXCIpXG5cbiAgICBpdCBcImRvZXMgbm90IGFsbG93IHNvdXJjZV90eXBlcyBpbnNlcnRcIiwgLT5cbiAgICAgIGFzc2VydC5pc0ZhbHNlIEBhdXRoLmluc2VydChcInNvdXJjZV90eXBlc1wiKVxuXG4gICAgaXQgXCJkb2VzIGFsbG93IHNvdXJjZXMgaW5zZXJ0XCIsIC0+XG4gICAgICBhc3NlcnQuaXNUcnVlIEBhdXRoLmluc2VydChcInNvdXJjZXNcIilcblxuICAgIGl0IFwiZG9lcyBhbGxvdyBzb3VyY2VzIHVwZGF0ZSBmb3IgdXNlclwiLCAtPlxuICAgICAgYXNzZXJ0LmlzVHJ1ZSBAYXV0aC51cGRhdGUoXCJzb3VyY2VzXCIsIHsgdXNlcjogXCJzb21ldXNlclwifSlcblxuICAgIGl0IFwiZG9lcyBub3QgYWxsb3cgc291cmNlcyB1cGRhdGUgZm9yIG90aGVyIHVzZXIgd2l0aCBubyBvcmdcIiwgLT5cbiAgICAgIGFzc2VydC5pc0ZhbHNlIEBhdXRoLnVwZGF0ZShcInNvdXJjZXNcIiwgeyB1c2VyOiBcInh5enp5XCJ9KVxuXG4gICAgaXQgXCJkb2VzIGFsbG93IHNvdXJjZXMgdXBkYXRlIGZvciBvdGhlciB1c2VyIHdpdGggc2FtZSBvcmdcIiwgLT5cbiAgICAgIGFzc2VydC5pc1RydWUgQGF1dGgudXBkYXRlKFwic291cmNlc1wiLCB7IHVzZXI6IFwieHl6enlcIiwgb3JnOiBcInNvbWVvcmdcIn0pXG4iLCJhc3NlcnQgPSBjaGFpLmFzc2VydFxuc291cmNlY29kZXMgPSByZXF1aXJlICcuLi9hcHAvanMvc291cmNlY29kZXMnXG5Kc29uU2VydmVyID0gcmVxdWlyZSAnLi9oZWxwZXJzL0pzb25TZXJ2ZXInXG5cbmRlc2NyaWJlIFwiU291cmNlIENvZGUgTWFuYWdlclwiLCAtPlxuICBiZWZvcmVFYWNoIC0+XG4gICAgQG1nciA9IG5ldyBzb3VyY2Vjb2Rlcy5Tb3VyY2VDb2Rlc01hbmFnZXIoXCJzb3VyY2VfY29kZXNcIilcbiAgICBAbWdyLnJlc2V0KClcblxuICAgIEBzZXJ2ZXIgPSBuZXcgSnNvblNlcnZlcigpXG5cbiAgYWZ0ZXJFYWNoIC0+XG4gICAgQHNlcnZlci50ZWFyZG93bigpXG5cbiAgaXQgXCJGYWlscyB0byByZXR1cm4gY29kZXMgaW5pdGlhbGx5XCIsIChkb25lKSAtPlxuICAgIHN1Y2Nlc3MgPSAtPiBhc3NlcnQuZmFpbCgpXG4gICAgZXJyb3IgPSAtPiBkb25lKClcbiAgICBjdXRvZmYgPSBcIjIwMTItMDEtMDFUMDA6MDA6MDBaXCJcbiAgICBAbWdyLnJlcXVlc3RDb2RlKHN1Y2Nlc3MsIGVycm9yLCBjdXRvZmYpXG5cbiAgaXQgXCJDYWxscyBzZXJ2ZXIgZm9yIG1vcmUgY29kZXMgaWYgbm9uZVwiLCAoZG9uZSkgLT5cbiAgICBAc2VydmVyLnJlc3BvbmQgXCJQT1NUXCIsIFwic291cmNlX2NvZGVzXCIsIChyZXF1ZXN0KSA9PlxuICAgICAgYXNzZXJ0LmVxdWFsIHJlcXVlc3QucGFyYW1zLm51bWJlciwgMVxuICAgICAgcmV0dXJuIFsgXG4gICAgICAgIHsgY29kZTogMTAwMDcsIGV4cGlyeTogXCIyMDEzLTAxLTAxVDAwOjAwOjAwWlwifSBcbiAgICAgICAgeyBjb2RlOiAxMDAxNCwgZXhwaXJ5OiBcIjIwMTMtMDEtMDFUMDA6MDA6MDBaXCJ9IFxuICAgICAgXVxuICAgIHN1Y2Nlc3MgPSAoY29kZSkgLT4gXG4gICAgICBhc3NlcnQuZXF1YWwgY29kZSwgMTAwMDdcbiAgICAgIGRvbmUoKVxuICAgIGVycm9yID0gLT4gYXNzZXJ0LmZhaWwoKVxuICAgIGN1dG9mZiA9IFwiMjAxMi0wMS0wMVQwMDowMDowMFpcIlxuICAgIEBtZ3IucmVxdWVzdENvZGUoc3VjY2VzcywgZXJyb3IsIGN1dG9mZilcblxuICBpdCBcIlJldHVybnMgbm9uLWV4cGlyZWQgY29kZXMgaWYgcHJlc2VudFwiLCAoZG9uZSkgLT5cbiAgICBAbWdyLnNldExvY2FsQ29kZXMgWyBcbiAgICAgIHsgY29kZTogMTAwMDcsIGV4cGlyeTogXCIyMDEyLTAxLTAxVDAwOjAwOjAwWlwifSBcbiAgICAgIHsgY29kZTogMTAwMTQsIGV4cGlyeTogXCIyMDEzLTAxLTAxVDAwOjAwOjAwWlwifSBcbiAgICBdXG5cbiAgICBzdWNjZXNzID0gKGNvZGUpID0+IFxuICAgICAgYXNzZXJ0LmVxdWFsIGNvZGUsIDEwMDE0XG5cbiAgICAgICMgT25seSBvbmUgYXZhaWxhYmxlLiBOb3cgZmFpbHNcbiAgICAgIHN1Y2Nlc3MgPSAtPiBhc3NlcnQuZmFpbCgpXG4gICAgICBlcnJvciA9IC0+IGRvbmUoKVxuICAgICAgY3V0b2ZmID0gXCIyMDEwLTAxLTAxVDAwOjAwOjAwWlwiXG4gICAgICBAbWdyLnJlcXVlc3RDb2RlKHN1Y2Nlc3MsIGVycm9yLCBjdXRvZmYpXG5cbiAgICBlcnJvciA9IC0+IGFzc2VydC5mYWlsKClcbiAgICBjdXRvZmYgPSBcIjIwMTItMDYtMDFUMDA6MDA6MDBaXCJcbiAgICBAbWdyLnJlcXVlc3RDb2RlKHN1Y2Nlc3MsIGVycm9yLCBjdXRvZmYpXG5cblxuICBpdCBcIlJldHVybiBudW1iZXIgb2Ygbm9uLWV4cGlyZWQgY29kZXNcIiwgKGRvbmUpIC0+XG4gICAgQG1nci5zZXRMb2NhbENvZGVzIFsgXG4gICAgICB7IGNvZGU6IDEwMDA3LCBleHBpcnk6IFwiMjAxMi0wMS0wMVQwMDowMDowMFpcIn0gXG4gICAgICB7IGNvZGU6IDEwMDE0LCBleHBpcnk6IFwiMjAxMy0wMS0wMVQwMDowMDowMFpcIn0gXG4gICAgXVxuXG4gICAgY3V0b2ZmID0gXCIyMDEyLTA2LTAxVDAwOjAwOjAwWlwiXG4gICAgYXNzZXJ0LmVxdWFsIEBtZ3IuZ2V0TnVtYmVyQXZhaWxhYmxlQ29kZXMoY3V0b2ZmKSwgMVxuICAgIGRvbmUoKVxuXG4gIGl0IFwiU3RvcmVzIGNvZGVzIGluIGxvY2FsIHN0b3JhZ2VcIiwgLT5cbiAgICBAbWdyLnNldExvY2FsQ29kZXMgWyBcbiAgICAgIHsgY29kZTogMTAwMDcsIGV4cGlyeTogXCIyMDEyLTAxLTAxVDAwOjAwOjAwWlwifSBcbiAgICAgIHsgY29kZTogMTAwMTQsIGV4cGlyeTogXCIyMDEzLTAxLTAxVDAwOjAwOjAwWlwifSBcbiAgICBdXG4gICAgY3V0b2ZmID0gXCIyMDEyLTA2LTAxVDAwOjAwOjAwWlwiXG4gICAgbWdyMiA9IG5ldyBzb3VyY2Vjb2Rlcy5Tb3VyY2VDb2Rlc01hbmFnZXIoKVxuICAgIGFzc2VydC5lcXVhbCBtZ3IyLmdldE51bWJlckF2YWlsYWJsZUNvZGVzKGN1dG9mZiksIDFcblxuXG5cblxuIiwiYXNzZXJ0ID0gY2hhaS5hc3NlcnRcbnN5bmMgPSByZXF1aXJlICcuLi9hcHAvanMvc3luYydcblxuXG5kZXNjcmliZSBcIlJlcGVhdGVyXCIsIC0+XG4gIGl0IFwiY2FsbHMgYWN0aW9uIGV2ZXJ5IG4gbWlsbGlzZWNvbmRzXCIsIChkb25lKSAtPlxuICAgIGNvdW50ID0gMFxuICAgIEByZXBlYXRlciA9IG5ldyBzeW5jLlJlcGVhdGVyIChzdWNjZXNzLCBlcnJvcikgLT5cbiAgICAgIGNvdW50ICs9IDFcbiAgICAgIHN1Y2Nlc3MoKVxuXG4gICAgQHJlcGVhdGVyLnN0YXJ0KDEwKVxuICAgIHNldFRpbWVvdXQgPT5cbiAgICAgIEByZXBlYXRlci5zdG9wKClcblxuICAgICAgIyBDaGVjayBjb3VudFxuICAgICAgYXNzZXJ0LmNsb3NlVG8gY291bnQsIDEwLCAzXG4gICAgICBkb25lKClcbiAgICAsIDEwMFxuXG5cbiAgaXQgXCJkb2VzIG5vdCBjYWxsIGFjdGlvbiBpZiBzdGlsbCBpbiBwcm9ncmVzc1wiLCAoZG9uZSkgLT5cbiAgICBjb3VudCA9IDBcbiAgICBAcmVwZWF0ZXIgPSBuZXcgc3luYy5SZXBlYXRlciAoc3VjY2VzcywgZXJyb3IpIC0+XG4gICAgICBjb3VudCArPSAxXG4gICAgICBzZXRUaW1lb3V0IC0+IFxuICAgICAgICBzdWNjZXNzKClcbiAgICAgICwgMjAwXG5cbiAgICBAcmVwZWF0ZXIuc3RhcnQoMTApXG4gICAgc2V0VGltZW91dCA9PlxuICAgICAgQHJlcGVhdGVyLnN0b3AoKVxuXG4gICAgICAjIENoZWNrIGNvdW50XG4gICAgICBhc3NlcnQuZXF1YWwgY291bnQsIDFcbiAgICAgIGRvbmUoKVxuICAgICwgMTAwXG5cbiAgaXQgXCJjYWxscyBhY3Rpb24gcmlnaHQgYXdheSBpZiBjYWxsZWRcIiwgKGRvbmUpIC0+XG4gICAgY291bnQgPSAwXG4gICAgQHJlcGVhdGVyID0gbmV3IHN5bmMuUmVwZWF0ZXIgKHN1Y2Nlc3MsIGVycm9yKSAtPlxuICAgICAgY291bnQgKz0gMVxuICAgICAgc3VjY2VzcygpXG5cbiAgICBAcmVwZWF0ZXIucGVyZm9ybSgpXG4gICAgYXNzZXJ0LmVxdWFsIGNvdW50LCAxXG4gICAgZG9uZSgpXG5cbiAgaXQgXCJzdG9wcyBvbiByZXF1ZXN0XCIsIChkb25lKSAtPlxuICAgIGNvdW50ID0gMFxuICAgIEByZXBlYXRlciA9IG5ldyBzeW5jLlJlcGVhdGVyIChzdWNjZXNzLCBlcnJvcikgPT5cbiAgICAgIGNvdW50ICs9IDFcbiAgICAgIGlmIGNvdW50ID09IDEwXG4gICAgICAgIEByZXBlYXRlci5zdG9wKClcbiAgICAgIHN1Y2Nlc3MoKVxuXG4gICAgQHJlcGVhdGVyLnN0YXJ0KDEwKVxuICAgIHNldFRpbWVvdXQgPT5cbiAgICAgICMgQ2hlY2sgY291bnRcbiAgICAgIGFzc2VydC5lcXVhbCBjb3VudCwgMTBcbiAgICAgIGRvbmUoKVxuICAgICwgMjAwXG5cbiAgaXQgXCJyZWNvcmRzIGxhc3QgZXJyb3JcIiwgKGRvbmUpIC0+XG4gICAgQHJlcGVhdGVyID0gbmV3IHN5bmMuUmVwZWF0ZXIgKHN1Y2Nlc3MsIGVycm9yKSAtPlxuICAgICAgZXJyb3IoXCJzb21lIG1lc3NhZ2VcIilcblxuICAgIEByZXBlYXRlci5zdGFydCgxMClcbiAgICBzZXRUaW1lb3V0ID0+XG4gICAgICBAcmVwZWF0ZXIuc3RvcCgpXG5cbiAgICAgICMgQ2hlY2sgY291bnRcbiAgICAgIGFzc2VydC5lcXVhbCBAcmVwZWF0ZXIubGFzdEVycm9yLCBcInNvbWUgbWVzc2FnZVwiXG4gICAgICBkb25lKClcbiAgICAsIDEwMFxuXG5cbiAgaXQgXCJyZWNvcmRzIGxhc3Qgc3VjY2VzcyBkYXRlXCIsIChkb25lKSAtPlxuICAgIGJlZm9yZSA9IG5ldyBEYXRlKClcbiAgICBAcmVwZWF0ZXIgPSBuZXcgc3luYy5SZXBlYXRlciAoc3VjY2VzcywgZXJyb3IpIC0+XG4gICAgICBzdWNjZXNzKClcblxuICAgIEByZXBlYXRlci5zdGFydCgxMClcbiAgICBzZXRUaW1lb3V0ID0+XG4gICAgICBAcmVwZWF0ZXIuc3RvcCgpXG5cbiAgICAgICMgQ2hlY2sgZGF0ZVxuICAgICAgYXNzZXJ0LmlzVHJ1ZSBuZXcgRGF0ZSgpID4gQHJlcGVhdGVyLmxhc3RTdWNjZXNzRGF0ZVxuICAgICAgYXNzZXJ0LmlzVHJ1ZSBiZWZvcmUgPCBAcmVwZWF0ZXIubGFzdFN1Y2Nlc3NEYXRlXG4gICAgICBkb25lKClcbiAgICAsIDEwMFxuXG4gIGl0IFwiY2xlYXJzIGxhc3QgZXJyb3Igb24gc3VjY2Vzc1wiLCAoZG9uZSkgLT5cbiAgICBjb3VudCA9IDBcbiAgICBAcmVwZWF0ZXIgPSBuZXcgc3luYy5SZXBlYXRlciAoc3VjY2VzcywgZXJyb3IpIC0+XG4gICAgICBjb3VudCArPSAxXG4gICAgICBpZiBjb3VudCA8IDNcbiAgICAgICAgZXJyb3IoXCJzb21lIG1lc3NhZ2VcIilcbiAgICAgIGVsc2VcbiAgICAgICAgc3VjY2VzcygpXG5cbiAgICBAcmVwZWF0ZXIuc3RhcnQoMTApXG4gICAgc2V0VGltZW91dCA9PlxuICAgICAgQHJlcGVhdGVyLnN0b3AoKVxuXG4gICAgICAjIENoZWNrIGNvdW50XG4gICAgICBhc3NlcnQuaXNGYWxzZSBAcmVwZWF0ZXIubGFzdEVycm9yP1xuICAgICAgZG9uZSgpXG4gICAgLCAxMDBcblxuZGVzY3JpYmUgXCJTeW5jaHJvbml6ZXJcIiwgLT5cbiAgYmVmb3JlIC0+XG4gICAgQGMxID0gMFxuICAgIEBjMiA9IDBcbiAgICBAYzMgPSAwXG5cbiAgICBAaHlicmlkRGIgPSBcbiAgICAgIHVwbG9hZDogKHN1Y2Nlc3MsIGVycm9yKSA9PiBcbiAgICAgICAgQGMxICs9IDFcbiAgICAgICAgc3VjY2VzcygpXG4gICAgQGltYWdlTWFuYWdlciA9XG4gICAgICB1cGxvYWQ6IChwcm9ncmVzcywgc3VjY2VzcywgZXJyb3IpID0+XG4gICAgICAgIEBjMSArPSAxXG4gICAgICAgIHN1Y2Nlc3MoKVxuICAgIEBzb3VyY2VDb2Rlc01hbmFnZXIgPSBcbiAgICAgIHJlcGxlbmlzaENvZGVzOiAobWluTnVtYmVyLCBzdWNjZXNzLCBlcnJvcikgLT4gc3VjY2VzcygpXG5cbiAgaXQgXCJjYWxscyBhbGwgdGhpbmdzIHRvIGJlIHN5bmNoZWRcIiwgKGRvbmUpIC0+XG5cblxuICBpdCBcInN0b3BzXCJcblxuXG4iLCJhc3NlcnQgPSBjaGFpLmFzc2VydFxuXG5HZW9KU09OID0gcmVxdWlyZSAnLi4vYXBwL2pzL0dlb0pTT04nXG5cbm1vZHVsZS5leHBvcnRzID0gLT5cbiAgY29udGV4dCAnV2l0aCBzYW1wbGUgcm93cycsIC0+XG4gICAgYmVmb3JlRWFjaCAoZG9uZSkgLT5cbiAgICAgIEBkYi5zY3JhdGNoLnVwc2VydCB7IF9pZDpcIjFcIiwgYTpcIkFsaWNlXCIsIGI6MSB9LCA9PlxuICAgICAgICBAZGIuc2NyYXRjaC51cHNlcnQgeyBfaWQ6XCIyXCIsIGE6XCJDaGFybGllXCIsIGI6MiB9LCA9PlxuICAgICAgICAgIEBkYi5zY3JhdGNoLnVwc2VydCB7IF9pZDpcIjNcIiwgYTpcIkJvYlwiLCBiOjMgfSwgPT5cbiAgICAgICAgICAgIGRvbmUoKVxuXG4gICAgaXQgJ2ZpbmRzIGFsbCByb3dzJywgKGRvbmUpIC0+XG4gICAgICBAZGIuc2NyYXRjaC5maW5kKHt9KS5mZXRjaCAocmVzdWx0cykgPT5cbiAgICAgICAgYXNzZXJ0LmVxdWFsIDMsIHJlc3VsdHMubGVuZ3RoXG4gICAgICAgIGRvbmUoKVxuXG4gICAgaXQgJ2ZpbmRzIGFsbCByb3dzIHdpdGggb3B0aW9ucycsIChkb25lKSAtPlxuICAgICAgQGRiLnNjcmF0Y2guZmluZCh7fSwge30pLmZldGNoIChyZXN1bHRzKSA9PlxuICAgICAgICBhc3NlcnQuZXF1YWwgMywgcmVzdWx0cy5sZW5ndGhcbiAgICAgICAgZG9uZSgpXG5cbiAgICBpdCAnZmlsdGVycyByb3dzIGJ5IGlkJywgKGRvbmUpIC0+XG4gICAgICBAZGIuc2NyYXRjaC5maW5kKHsgX2lkOiBcIjFcIiB9KS5mZXRjaCAocmVzdWx0cykgPT5cbiAgICAgICAgYXNzZXJ0LmVxdWFsIDEsIHJlc3VsdHMubGVuZ3RoXG4gICAgICAgIGFzc2VydC5lcXVhbCAnQWxpY2UnLCByZXN1bHRzWzBdLmFcbiAgICAgICAgZG9uZSgpXG5cbiAgICBpdCAnaW5jbHVkZXMgZmllbGRzJywgKGRvbmUpIC0+XG4gICAgICBAZGIuc2NyYXRjaC5maW5kKHsgX2lkOiBcIjFcIiB9LCB7IGZpZWxkczogeyBhOjEgfX0pLmZldGNoIChyZXN1bHRzKSA9PlxuICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIHJlc3VsdHNbMF0sIHsgX2lkOiBcIjFcIiwgIGE6IFwiQWxpY2VcIiB9XG4gICAgICAgIGRvbmUoKVxuXG4gICAgaXQgJ2V4Y2x1ZGVzIGZpZWxkcycsIChkb25lKSAtPlxuICAgICAgQGRiLnNjcmF0Y2guZmluZCh7IF9pZDogXCIxXCIgfSwgeyBmaWVsZHM6IHsgYTowIH19KS5mZXRjaCAocmVzdWx0cykgPT5cbiAgICAgICAgYXNzZXJ0LmlzVW5kZWZpbmVkIHJlc3VsdHNbMF0uYVxuICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0c1swXS5iLCAxXG4gICAgICAgIGRvbmUoKVxuXG4gICAgaXQgJ2ZpbmRzIG9uZSByb3cnLCAoZG9uZSkgLT5cbiAgICAgIEBkYi5zY3JhdGNoLmZpbmRPbmUgeyBfaWQ6IFwiMlwiIH0sIChyZXN1bHQpID0+XG4gICAgICAgIGFzc2VydC5lcXVhbCAnQ2hhcmxpZScsIHJlc3VsdC5hXG4gICAgICAgIGRvbmUoKVxuXG4gICAgaXQgJ3JlbW92ZXMgaXRlbScsIChkb25lKSAtPlxuICAgICAgQGRiLnNjcmF0Y2gucmVtb3ZlIFwiMlwiLCA9PlxuICAgICAgICBAZGIuc2NyYXRjaC5maW5kKHt9KS5mZXRjaCAocmVzdWx0cykgPT5cbiAgICAgICAgICBhc3NlcnQuZXF1YWwgMiwgcmVzdWx0cy5sZW5ndGhcbiAgICAgICAgICBhc3NlcnQgXCIxXCIgaW4gKHJlc3VsdC5faWQgZm9yIHJlc3VsdCBpbiByZXN1bHRzKVxuICAgICAgICAgIGFzc2VydCBcIjJcIiBub3QgaW4gKHJlc3VsdC5faWQgZm9yIHJlc3VsdCBpbiByZXN1bHRzKVxuICAgICAgICAgIGRvbmUoKVxuXG4gICAgaXQgJ3JlbW92ZXMgbm9uLWV4aXN0ZW50IGl0ZW0nLCAoZG9uZSkgLT5cbiAgICAgIEBkYi5zY3JhdGNoLnJlbW92ZSBcIjk5OVwiLCA9PlxuICAgICAgICBAZGIuc2NyYXRjaC5maW5kKHt9KS5mZXRjaCAocmVzdWx0cykgPT5cbiAgICAgICAgICBhc3NlcnQuZXF1YWwgMywgcmVzdWx0cy5sZW5ndGhcbiAgICAgICAgICBkb25lKClcblxuICAgIGl0ICdzb3J0cyBhc2NlbmRpbmcnLCAoZG9uZSkgLT5cbiAgICAgIEBkYi5zY3JhdGNoLmZpbmQoe30sIHtzb3J0OiBbJ2EnXX0pLmZldGNoIChyZXN1bHRzKSA9PlxuICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIF8ucGx1Y2socmVzdWx0cywgJ19pZCcpLCBbXCIxXCIsXCIzXCIsXCIyXCJdXG4gICAgICAgIGRvbmUoKVxuXG4gICAgaXQgJ3NvcnRzIGRlc2NlbmRpbmcnLCAoZG9uZSkgLT5cbiAgICAgIEBkYi5zY3JhdGNoLmZpbmQoe30sIHtzb3J0OiBbWydhJywnZGVzYyddXX0pLmZldGNoIChyZXN1bHRzKSA9PlxuICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIF8ucGx1Y2socmVzdWx0cywgJ19pZCcpLCBbXCIyXCIsXCIzXCIsXCIxXCJdXG4gICAgICAgIGRvbmUoKVxuXG4gICAgaXQgJ2xpbWl0cycsIChkb25lKSAtPlxuICAgICAgQGRiLnNjcmF0Y2guZmluZCh7fSwge3NvcnQ6IFsnYSddLCBsaW1pdDoyfSkuZmV0Y2ggKHJlc3VsdHMpID0+XG4gICAgICAgIGFzc2VydC5kZWVwRXF1YWwgXy5wbHVjayhyZXN1bHRzLCAnX2lkJyksIFtcIjFcIixcIjNcIl1cbiAgICAgICAgZG9uZSgpXG5cbiAgICBpdCAnZmV0Y2hlcyBpbmRlcGVuZGVudCBjb3BpZXMnLCAoZG9uZSkgLT5cbiAgICAgIEBkYi5zY3JhdGNoLmZpbmRPbmUgeyBfaWQ6IFwiMlwiIH0sIChyZXN1bHQpID0+XG4gICAgICAgIHJlc3VsdC5hID0gJ0RhdmlkJ1xuICAgICAgICBAZGIuc2NyYXRjaC5maW5kT25lIHsgX2lkOiBcIjJcIiB9LCAocmVzdWx0KSA9PlxuICAgICAgICAgIGFzc2VydC5lcXVhbCAnQ2hhcmxpZScsIHJlc3VsdC5hXG4gICAgICAgICAgZG9uZSgpXG5cbiAgaXQgJ2FkZHMgX2lkIHRvIHJvd3MnLCAoZG9uZSkgLT5cbiAgICBAZGIuc2NyYXRjaC51cHNlcnQgeyBhOiAxIH0sIChpdGVtKSA9PlxuICAgICAgYXNzZXJ0LnByb3BlcnR5IGl0ZW0sICdfaWQnXG4gICAgICBhc3NlcnQubGVuZ3RoT2YgaXRlbS5faWQsIDMyXG4gICAgICBkb25lKClcblxuICBpdCAndXBkYXRlcyBieSBpZCcsIChkb25lKSAtPlxuICAgIEBkYi5zY3JhdGNoLnVwc2VydCB7IF9pZDpcIjFcIiwgYToxIH0sIChpdGVtKSA9PlxuICAgICAgQGRiLnNjcmF0Y2gudXBzZXJ0IHsgX2lkOlwiMVwiLCBhOjIsIF9yZXY6IDEgfSwgKGl0ZW0pID0+XG4gICAgICAgIGFzc2VydC5lcXVhbCBpdGVtLmEsIDJcbiAgXG4gICAgICAgIEBkYi5zY3JhdGNoLmZpbmQoe30pLmZldGNoIChyZXN1bHRzKSA9PlxuICAgICAgICAgIGFzc2VydC5lcXVhbCAxLCByZXN1bHRzLmxlbmd0aFxuICAgICAgICAgIGRvbmUoKVxuXG4gIGdlb3BvaW50ID0gKGxuZywgbGF0KSAtPlxuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiAnUG9pbnQnXG4gICAgICBjb29yZGluYXRlczogW2xuZywgbGF0XVxuICAgIH1cblxuICBjb250ZXh0ICdXaXRoIGdlb2xvY2F0ZWQgcm93cycsIC0+XG4gICAgYmVmb3JlRWFjaCAoZG9uZSkgLT5cbiAgICAgIEBkYi5zY3JhdGNoLnVwc2VydCB7IF9pZDpcIjFcIiwgbG9jOmdlb3BvaW50KDkwLCA0NSkgfSwgPT5cbiAgICAgICAgQGRiLnNjcmF0Y2gudXBzZXJ0IHsgX2lkOlwiMlwiLCBsb2M6Z2VvcG9pbnQoOTAsIDQ2KSB9LCA9PlxuICAgICAgICAgIEBkYi5zY3JhdGNoLnVwc2VydCB7IF9pZDpcIjNcIiwgbG9jOmdlb3BvaW50KDkxLCA0NSkgfSwgPT5cbiAgICAgICAgICAgIEBkYi5zY3JhdGNoLnVwc2VydCB7IF9pZDpcIjRcIiwgbG9jOmdlb3BvaW50KDkxLCA0NikgfSwgPT5cbiAgICAgICAgICAgICAgZG9uZSgpXG5cbiAgICBpdCAnZmluZHMgcG9pbnRzIG5lYXInLCAoZG9uZSkgLT5cbiAgICAgIHNlbGVjdG9yID0gbG9jOiBcbiAgICAgICAgJG5lYXI6IFxuICAgICAgICAgICRnZW9tZXRyeTogZ2VvcG9pbnQoOTAsIDQ1KVxuXG4gICAgICBAZGIuc2NyYXRjaC5maW5kKHNlbGVjdG9yKS5mZXRjaCAocmVzdWx0cykgPT5cbiAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCBfLnBsdWNrKHJlc3VsdHMsICdfaWQnKSwgW1wiMVwiLFwiM1wiLFwiMlwiLFwiNFwiXVxuICAgICAgICBkb25lKClcblxuICAgIGl0ICdmaW5kcyBwb2ludHMgbmVhciBtYXhEaXN0YW5jZScsIChkb25lKSAtPlxuICAgICAgc2VsZWN0b3IgPSBsb2M6IFxuICAgICAgICAkbmVhcjogXG4gICAgICAgICAgJGdlb21ldHJ5OiBnZW9wb2ludCg5MCwgNDUpXG4gICAgICAgICAgJG1heERpc3RhbmNlOiAxMTEwMDBcblxuICAgICAgQGRiLnNjcmF0Y2guZmluZChzZWxlY3RvcikuZmV0Y2ggKHJlc3VsdHMpID0+XG4gICAgICAgIGFzc2VydC5kZWVwRXF1YWwgXy5wbHVjayhyZXN1bHRzLCAnX2lkJyksIFtcIjFcIixcIjNcIl1cbiAgICAgICAgZG9uZSgpICAgICAgXG5cbiAgICBpdCAnZmluZHMgcG9pbnRzIG5lYXIgbWF4RGlzdGFuY2UganVzdCBhYm92ZScsIChkb25lKSAtPlxuICAgICAgc2VsZWN0b3IgPSBsb2M6IFxuICAgICAgICAkbmVhcjogXG4gICAgICAgICAgJGdlb21ldHJ5OiBnZW9wb2ludCg5MCwgNDUpXG4gICAgICAgICAgJG1heERpc3RhbmNlOiAxMTIwMDBcblxuICAgICAgQGRiLnNjcmF0Y2guZmluZChzZWxlY3RvcikuZmV0Y2ggKHJlc3VsdHMpID0+XG4gICAgICAgIGFzc2VydC5kZWVwRXF1YWwgXy5wbHVjayhyZXN1bHRzLCAnX2lkJyksIFtcIjFcIixcIjNcIixcIjJcIl1cbiAgICAgICAgZG9uZSgpXG5cbiAgICBpdCAnZmluZHMgcG9pbnRzIHdpdGhpbiBzaW1wbGUgYm94JywgKGRvbmUpIC0+XG4gICAgICBzZWxlY3RvciA9IGxvYzogXG4gICAgICAgICRnZW9JbnRlcnNlY3RzOiBcbiAgICAgICAgICAkZ2VvbWV0cnk6IFxuICAgICAgICAgICAgdHlwZTogJ1BvbHlnb24nXG4gICAgICAgICAgICBjb29yZGluYXRlczogW1tcbiAgICAgICAgICAgICAgWzg5LjUsIDQ1LjVdLCBbODkuNSwgNDYuNV0sIFs5MC41LCA0Ni41XSwgWzkwLjUsIDQ1LjVdLCBbODkuNSwgNDUuNV1cbiAgICAgICAgICAgIF1dXG4gICAgICBAZGIuc2NyYXRjaC5maW5kKHNlbGVjdG9yKS5mZXRjaCAocmVzdWx0cykgPT5cbiAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCBfLnBsdWNrKHJlc3VsdHMsICdfaWQnKSwgW1wiMlwiXVxuICAgICAgICBkb25lKClcblxuICAgIGl0ICdoYW5kbGVzIHVuZGVmaW5lZCcsIChkb25lKSAtPlxuICAgICAgc2VsZWN0b3IgPSBsb2M6IFxuICAgICAgICAkZ2VvSW50ZXJzZWN0czogXG4gICAgICAgICAgJGdlb21ldHJ5OiBcbiAgICAgICAgICAgIHR5cGU6ICdQb2x5Z29uJ1xuICAgICAgICAgICAgY29vcmRpbmF0ZXM6IFtbXG4gICAgICAgICAgICAgIFs4OS41LCA0NS41XSwgWzg5LjUsIDQ2LjVdLCBbOTAuNSwgNDYuNV0sIFs5MC41LCA0NS41XSwgWzg5LjUsIDQ1LjVdXG4gICAgICAgICAgICBdXVxuICAgICAgQGRiLnNjcmF0Y2gudXBzZXJ0IHsgX2lkOjUgfSwgPT5cbiAgICAgICAgQGRiLnNjcmF0Y2guZmluZChzZWxlY3RvcikuZmV0Y2ggKHJlc3VsdHMpID0+XG4gICAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCBfLnBsdWNrKHJlc3VsdHMsICdfaWQnKSwgW1wiMlwiXVxuICAgICAgICAgIGRvbmUoKVxuXG5cbiIsIlxuZXhwb3J0cy5EYXRlUXVlc3Rpb24gPSByZXF1aXJlICcuL0RhdGVRdWVzdGlvbidcbmV4cG9ydHMuRHJvcGRvd25RdWVzdGlvbiA9IHJlcXVpcmUgJy4vRHJvcGRvd25RdWVzdGlvbidcbmV4cG9ydHMuTnVtYmVyUXVlc3Rpb24gPSByZXF1aXJlICcuL051bWJlclF1ZXN0aW9uJ1xuZXhwb3J0cy5RdWVzdGlvbkdyb3VwID0gcmVxdWlyZSAnLi9RdWVzdGlvbkdyb3VwJ1xuZXhwb3J0cy5TYXZlQ2FuY2VsRm9ybSA9IHJlcXVpcmUgJy4vU2F2ZUNhbmNlbEZvcm0nXG5leHBvcnRzLlNvdXJjZVF1ZXN0aW9uID0gcmVxdWlyZSAnLi9Tb3VyY2VRdWVzdGlvbidcbmV4cG9ydHMuSW1hZ2VRdWVzdGlvbiA9IHJlcXVpcmUgJy4vSW1hZ2VRdWVzdGlvbidcbmV4cG9ydHMuSW1hZ2VzUXVlc3Rpb24gPSByZXF1aXJlICcuL0ltYWdlc1F1ZXN0aW9uJ1xuZXhwb3J0cy5JbnN0cnVjdGlvbnMgPSByZXF1aXJlICcuL0luc3RydWN0aW9ucydcblxuIyBNdXN0IGJlIGNyZWF0ZWQgd2l0aCBtb2RlbCAoYmFja2JvbmUgbW9kZWwpIGFuZCBjb250ZW50cyAoYXJyYXkgb2Ygdmlld3MpXG5leHBvcnRzLkZvcm1WaWV3ID0gY2xhc3MgRm9ybVZpZXcgZXh0ZW5kcyBCYWNrYm9uZS5WaWV3XG4gIGluaXRpYWxpemU6IChvcHRpb25zKSAtPlxuICAgIEBjb250ZW50cyA9IG9wdGlvbnMuY29udGVudHNcbiAgICBcbiAgICAjIEFkZCBjb250ZW50cyBhbmQgbGlzdGVuIHRvIGV2ZW50c1xuICAgIGZvciBjb250ZW50IGluIG9wdGlvbnMuY29udGVudHNcbiAgICAgIEAkZWwuYXBwZW5kKGNvbnRlbnQuZWwpO1xuICAgICAgQGxpc3RlblRvIGNvbnRlbnQsICdjbG9zZScsID0+IEB0cmlnZ2VyKCdjbG9zZScpXG4gICAgICBAbGlzdGVuVG8gY29udGVudCwgJ2NvbXBsZXRlJywgPT4gQHRyaWdnZXIoJ2NvbXBsZXRlJylcblxuICAgICMgQWRkIGxpc3RlbmVyIHRvIG1vZGVsXG4gICAgQGxpc3RlblRvIEBtb2RlbCwgJ2NoYW5nZScsID0+IEB0cmlnZ2VyKCdjaGFuZ2UnKVxuXG4gICAgIyBPdmVycmlkZSBzYXZlIGlmIHBhc3NlZCBhcyBvcHRpb25cbiAgICBpZiBvcHRpb25zLnNhdmVcbiAgICAgIEBzYXZlID0gb3B0aW9ucy5zYXZlXG5cbiAgbG9hZDogKGRhdGEpIC0+XG4gICAgQG1vZGVsLmNsZWFyKCkgICNUT0RPIGNsZWFyIG9yIG5vdCBjbGVhcj8gY2xlYXJpbmcgcmVtb3ZlcyBkZWZhdWx0cywgYnV0IGFsbG93cyB0cnVlIHJldXNlLlxuXG4gICAgIyBBcHBseSBkZWZhdWx0cyBcbiAgICBAbW9kZWwuc2V0KF8uZGVmYXVsdHMoXy5jbG9uZURlZXAoZGF0YSksIEBvcHRpb25zLmRlZmF1bHRzIHx8IHt9KSlcblxuICBzYXZlOiAtPlxuICAgIHJldHVybiBAbW9kZWwudG9KU09OKClcblxuXG4jIFNpbXBsZSBmb3JtIHRoYXQgZGlzcGxheXMgYSB0ZW1wbGF0ZSBiYXNlZCBvbiBsb2FkZWQgZGF0YVxuZXhwb3J0cy50ZW1wbGF0ZVZpZXcgPSAodGVtcGxhdGUpIC0+IFxuICByZXR1cm4ge1xuICAgIGVsOiAkKCc8ZGl2PjwvZGl2PicpXG4gICAgbG9hZDogKGRhdGEpIC0+XG4gICAgICAkKEBlbCkuaHRtbCB0ZW1wbGF0ZShkYXRhKVxuICB9XG5cbiAgIyBjbGFzcyBUZW1wbGF0ZVZpZXcgZXh0ZW5kcyBCYWNrYm9uZS5WaWV3XG4gICMgY29uc3RydWN0b3I6ICh0ZW1wbGF0ZSkgLT5cbiAgIyAgIEB0ZW1wbGF0ZSA9IHRlbXBsYXRlXG5cbiAgIyBsb2FkOiAoZGF0YSkgLT5cbiAgIyAgIEAkZWwuaHRtbCBAdGVtcGxhdGUoZGF0YSlcblxuXG5leHBvcnRzLlN1cnZleVZpZXcgPSBjbGFzcyBTdXJ2ZXlWaWV3IGV4dGVuZHMgRm9ybVZpZXdcblxuZXhwb3J0cy5XYXRlclRlc3RFZGl0VmlldyA9IGNsYXNzIFdhdGVyVGVzdEVkaXRWaWV3IGV4dGVuZHMgRm9ybVZpZXdcbiAgaW5pdGlhbGl6ZTogKG9wdGlvbnMpIC0+XG4gICAgc3VwZXIob3B0aW9ucylcblxuICAgICMgQWRkIGJ1dHRvbnMgYXQgYm90dG9tXG4gICAgIyBUT0RPIG1vdmUgdG8gdGVtcGxhdGUgYW5kIHNlcCBmaWxlXG4gICAgQCRlbC5hcHBlbmQgJCgnJydcbiAgICAgIDxkaXY+XG4gICAgICAgICAgPGJ1dHRvbiBpZD1cImNsb3NlX2J1dHRvblwiIHR5cGU9XCJidXR0b25cIiBjbGFzcz1cImJ0biBtYXJnaW5lZFwiPlNhdmUgZm9yIExhdGVyPC9idXR0b24+XG4gICAgICAgICAgJm5ic3A7XG4gICAgICAgICAgPGJ1dHRvbiBpZD1cImNvbXBsZXRlX2J1dHRvblwiIHR5cGU9XCJidXR0b25cIiBjbGFzcz1cImJ0biBidG4tcHJpbWFyeSBtYXJnaW5lZFwiPjxpIGNsYXNzPVwiaWNvbi1vayBpY29uLXdoaXRlXCI+PC9pPiBDb21wbGV0ZTwvYnV0dG9uPlxuICAgICAgPC9kaXY+XG4gICAgJycnKVxuXG4gIGV2ZW50czogXG4gICAgXCJjbGljayAjY2xvc2VfYnV0dG9uXCIgOiBcImNsb3NlXCJcbiAgICBcImNsaWNrICNjb21wbGV0ZV9idXR0b25cIiA6IFwiY29tcGxldGVcIlxuXG4gICMgVE9ETyByZWZhY3RvciB3aXRoIFNhdmVDYW5jZWxGb3JtXG4gIHZhbGlkYXRlOiAtPlxuICAgICMgR2V0IGFsbCB2aXNpYmxlIGl0ZW1zXG4gICAgaXRlbXMgPSBfLmZpbHRlcihAY29udGVudHMsIChjKSAtPlxuICAgICAgYy52aXNpYmxlIGFuZCBjLnZhbGlkYXRlXG4gICAgKVxuICAgIHJldHVybiBub3QgXy5hbnkoXy5tYXAoaXRlbXMsIChpdGVtKSAtPlxuICAgICAgaXRlbS52YWxpZGF0ZSgpXG4gICAgKSlcblxuICBjbG9zZTogLT5cbiAgICBAdHJpZ2dlciAnY2xvc2UnXG5cbiAgY29tcGxldGU6IC0+XG4gICAgaWYgQHZhbGlkYXRlKClcbiAgICAgIEB0cmlnZ2VyICdjb21wbGV0ZSdcbiAgICAgIFxuIyBDcmVhdGVzIGEgZm9ybSB2aWV3IGZyb20gYSBzdHJpbmdcbmV4cG9ydHMuaW5zdGFudGlhdGVWaWV3ID0gKHZpZXdTdHIsIG9wdGlvbnMpID0+XG4gIHZpZXdGdW5jID0gbmV3IEZ1bmN0aW9uKFwib3B0aW9uc1wiLCB2aWV3U3RyKVxuICB2aWV3RnVuYyhvcHRpb25zKVxuXG5fLmV4dGVuZChleHBvcnRzLCByZXF1aXJlKCcuL2Zvcm0tY29udHJvbHMnKSlcblxuXG4jIFRPRE8gZmlndXJlIG91dCBob3cgdG8gYWxsb3cgdHdvIHN1cnZleXMgZm9yIGRpZmZlcmluZyBjbGllbnQgdmVyc2lvbnM/IE9yIGp1c3QgdXNlIG1pblZlcnNpb24/IiwiIyBHZW9KU09OIGhlbHBlciByb3V0aW5lc1xuXG4jIENvbnZlcnRzIG5hdmlnYXRvciBwb3NpdGlvbiB0byBwb2ludFxuZXhwb3J0cy5wb3NUb1BvaW50ID0gKHBvcykgLT5cbiAgcmV0dXJuIHtcbiAgICB0eXBlOiAnUG9pbnQnXG4gICAgY29vcmRpbmF0ZXM6IFtwb3MuY29vcmRzLmxvbmdpdHVkZSwgcG9zLmNvb3Jkcy5sYXRpdHVkZV1cbiAgfVxuXG5cbmV4cG9ydHMubGF0TG5nQm91bmRzVG9HZW9KU09OID0gKGJvdW5kcykgLT5cbiAgc3cgPSBib3VuZHMuZ2V0U291dGhXZXN0KClcbiAgbmUgPSBib3VuZHMuZ2V0Tm9ydGhFYXN0KClcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiAnUG9seWdvbicsXG4gICAgY29vcmRpbmF0ZXM6IFtcbiAgICAgIFtbc3cubG5nLCBzdy5sYXRdLCBcbiAgICAgIFtzdy5sbmcsIG5lLmxhdF0sIFxuICAgICAgW25lLmxuZywgbmUubGF0XSwgXG4gICAgICBbbmUubG5nLCBzdy5sYXRdLFxuICAgICAgW3N3LmxuZywgc3cubGF0XV1cbiAgICBdXG4gIH1cblxuIyBUT0RPOiBvbmx5IHdvcmtzIHdpdGggYm91bmRzXG5leHBvcnRzLnBvaW50SW5Qb2x5Z29uID0gKHBvaW50LCBwb2x5Z29uKSAtPlxuICAjIENoZWNrIHRoYXQgZmlyc3QgPT0gbGFzdFxuICBpZiBub3QgXy5pc0VxdWFsKF8uZmlyc3QocG9seWdvbi5jb29yZGluYXRlc1swXSksIF8ubGFzdChwb2x5Z29uLmNvb3JkaW5hdGVzWzBdKSlcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJGaXJzdCBtdXN0IGVxdWFsIGxhc3RcIilcblxuICAjIEdldCBib3VuZHNcbiAgYm91bmRzID0gbmV3IEwuTGF0TG5nQm91bmRzKF8ubWFwKHBvbHlnb24uY29vcmRpbmF0ZXNbMF0sIChjb29yZCkgLT4gbmV3IEwuTGF0TG5nKGNvb3JkWzFdLCBjb29yZFswXSkpKVxuICByZXR1cm4gYm91bmRzLmNvbnRhaW5zKG5ldyBMLkxhdExuZyhwb2ludC5jb29yZGluYXRlc1sxXSwgcG9pbnQuY29vcmRpbmF0ZXNbMF0pKVxuXG5leHBvcnRzLmdldFJlbGF0aXZlTG9jYXRpb24gPSAoZnJvbSwgdG8pIC0+XG4gIHgxID0gZnJvbS5jb29yZGluYXRlc1swXVxuICB5MSA9IGZyb20uY29vcmRpbmF0ZXNbMV1cbiAgeDIgPSB0by5jb29yZGluYXRlc1swXVxuICB5MiA9IHRvLmNvb3JkaW5hdGVzWzFdXG4gIFxuICAjIENvbnZlcnQgdG8gcmVsYXRpdmUgcG9zaXRpb24gKGFwcHJveGltYXRlKVxuICBkeSA9ICh5MiAtIHkxKSAvIDU3LjMgKiA2MzcxMDAwXG4gIGR4ID0gTWF0aC5jb3MoeTEgLyA1Ny4zKSAqICh4MiAtIHgxKSAvIDU3LjMgKiA2MzcxMDAwXG4gIFxuICAjIERldGVybWluZSBkaXJlY3Rpb24gYW5kIGFuZ2xlXG4gIGRpc3QgPSBNYXRoLnNxcnQoZHggKiBkeCArIGR5ICogZHkpXG4gIGFuZ2xlID0gOTAgLSAoTWF0aC5hdGFuMihkeSwgZHgpICogNTcuMylcbiAgYW5nbGUgKz0gMzYwIGlmIGFuZ2xlIDwgMFxuICBhbmdsZSAtPSAzNjAgaWYgYW5nbGUgPiAzNjBcbiAgXG4gICMgR2V0IGFwcHJveGltYXRlIGRpcmVjdGlvblxuICBjb21wYXNzRGlyID0gKE1hdGguZmxvb3IoKGFuZ2xlICsgMjIuNSkgLyA0NSkpICUgOFxuICBjb21wYXNzU3RycyA9IFtcIk5cIiwgXCJORVwiLCBcIkVcIiwgXCJTRVwiLCBcIlNcIiwgXCJTV1wiLCBcIldcIiwgXCJOV1wiXVxuICBpZiBkaXN0ID4gMTAwMFxuICAgIChkaXN0IC8gMTAwMCkudG9GaXhlZCgxKSArIFwia20gXCIgKyBjb21wYXNzU3Ryc1tjb21wYXNzRGlyXVxuICBlbHNlXG4gICAgKGRpc3QpLnRvRml4ZWQoMCkgKyBcIm0gXCIgKyBjb21wYXNzU3Ryc1tjb21wYXNzRGlyXSIsIlxuIyBUcmFja3MgYSBzZXQgb2YgaXRlbXMgYnkgaWQsIGluZGljYXRpbmcgd2hpY2ggaGF2ZSBiZWVuIGFkZGVkIG9yIHJlbW92ZWQuXG4jIENoYW5nZXMgYXJlIGJvdGggYWRkIGFuZCByZW1vdmVcbmNsYXNzIEl0ZW1UcmFja2VyXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgIEBrZXkgPSAnX2lkJ1xuICAgIEBpdGVtcyA9IHt9XG5cbiAgdXBkYXRlOiAoaXRlbXMpIC0+ICAgICMgUmV0dXJuIFtbYWRkZWRdLFtyZW1vdmVkXV0gaXRlbXNcbiAgICBhZGRzID0gW11cbiAgICByZW1vdmVzID0gW11cblxuICAgICMgQWRkIGFueSBuZXcgb25lc1xuICAgIGZvciBpdGVtIGluIGl0ZW1zXG4gICAgICBpZiBub3QgXy5oYXMoQGl0ZW1zLCBpdGVtW0BrZXldKVxuICAgICAgICBhZGRzLnB1c2goaXRlbSlcblxuICAgICMgQ3JlYXRlIG1hcCBvZiBpdGVtcyBwYXJhbWV0ZXJcbiAgICBtYXAgPSBfLm9iamVjdChfLnBsdWNrKGl0ZW1zLCBAa2V5KSwgaXRlbXMpXG5cbiAgICAjIEZpbmQgcmVtb3Zlc1xuICAgIGZvciBrZXksIHZhbHVlIG9mIEBpdGVtc1xuICAgICAgaWYgbm90IF8uaGFzKG1hcCwga2V5KVxuICAgICAgICByZW1vdmVzLnB1c2godmFsdWUpXG4gICAgICBlbHNlIGlmIG5vdCBfLmlzRXF1YWwodmFsdWUsIG1hcFtrZXldKVxuICAgICAgICBhZGRzLnB1c2gobWFwW2tleV0pXG4gICAgICAgIHJlbW92ZXMucHVzaCh2YWx1ZSlcblxuICAgIGZvciBpdGVtIGluIHJlbW92ZXNcbiAgICAgIGRlbGV0ZSBAaXRlbXNbaXRlbVtAa2V5XV1cblxuICAgIGZvciBpdGVtIGluIGFkZHNcbiAgICAgIEBpdGVtc1tpdGVtW0BrZXldXSA9IGl0ZW1cblxuICAgIHJldHVybiBbYWRkcywgcmVtb3Zlc11cblxubW9kdWxlLmV4cG9ydHMgPSBJdGVtVHJhY2tlciIsImFzc2VydCA9IGNoYWkuYXNzZXJ0XG5cbmNsYXNzIFVJRHJpdmVyXG4gIGNvbnN0cnVjdG9yOiAoZWwpIC0+XG4gICAgQGVsID0gJChlbClcblxuICBnZXREaXNhYmxlZDogKHN0cikgLT5cbiAgICBmb3IgaXRlbSBpbiBAZWwuZmluZChcImEsYnV0dG9uXCIpXG4gICAgICBpZiAkKGl0ZW0pLnRleHQoKS5pbmRleE9mKHN0cikgIT0gLTFcbiAgICAgICAgcmV0dXJuICQoaXRlbSkuaXMoXCI6ZGlzYWJsZWRcIilcbiAgICBhc3NlcnQuZmFpbChudWxsLCBzdHIsIFwiQ2FuJ3QgZmluZDogXCIgKyBzdHIpXG5cbiAgY2xpY2s6IChzdHIpIC0+XG4gICAgZm9yIGl0ZW0gaW4gQGVsLmZpbmQoXCJhLGJ1dHRvblwiKVxuICAgICAgaWYgJChpdGVtKS50ZXh0KCkuaW5kZXhPZihzdHIpICE9IC0xXG4gICAgICAgIGNvbnNvbGUubG9nIFwiQ2xpY2tpbmc6IFwiICsgJChpdGVtKS50ZXh0KClcbiAgICAgICAgJChpdGVtKS50cmlnZ2VyKFwiY2xpY2tcIilcbiAgICAgICAgcmV0dXJuXG4gICAgYXNzZXJ0LmZhaWwobnVsbCwgc3RyLCBcIkNhbid0IGZpbmQ6IFwiICsgc3RyKVxuICBcbiAgZmlsbDogKHN0ciwgdmFsdWUpIC0+XG4gICAgZm9yIGl0ZW0gaW4gQGVsLmZpbmQoXCJsYWJlbFwiKVxuICAgICAgaWYgJChpdGVtKS50ZXh0KCkuaW5kZXhPZihzdHIpICE9IC0xXG4gICAgICAgIGJveCA9IEBlbC5maW5kKFwiI1wiKyQoaXRlbSkuYXR0cignZm9yJykpXG4gICAgICAgIGJveC52YWwodmFsdWUpXG4gIFxuICB0ZXh0OiAtPlxuICAgIHJldHVybiBAZWwudGV4dCgpXG4gICAgICBcbiAgd2FpdDogKGFmdGVyKSAtPlxuICAgIHNldFRpbWVvdXQgYWZ0ZXIsIDEwXG5cbm1vZHVsZS5leHBvcnRzID0gVUlEcml2ZXIiLCJcbiMgQXV0aG9yaXphdGlvbiBjbGFzc2VzIGFsbCBmb2xsb3cgc2FtZSBwYXR0ZXJuLlxuIyBkb2MgY2FuIGJlIHVuZGVmaW5lZCBpbiB1cGRhdGUgYW5kIHJlbW92ZTogYXV0aG9yaXplcyB3aGV0aGVyIGV2ZXIgcG9zc2libGUuXG5cbmV4cG9ydHMuQWxsQXV0aCA9IGNsYXNzIEFsbEF1dGhcbiAgaW5zZXJ0OiAoY29sKSAtPlxuICAgIHJldHVybiB0cnVlXG5cbiAgdXBkYXRlOiAoY29sLCBkb2MpIC0+XG4gICAgcmV0dXJuIHRydWVcblxuICByZW1vdmU6IChjb2wsIGRvYykgLT5cbiAgICByZXR1cm4gdHJ1ZVxuICAgIFxuZXhwb3J0cy5Ob25lQXV0aCA9IGNsYXNzIE5vbmVBdXRoXG4gIGluc2VydDogKGNvbCkgLT5cbiAgICByZXR1cm4gZmFsc2VcblxuICB1cGRhdGU6IChjb2wsIGRvYykgLT5cbiAgICByZXR1cm4gZmFsc2VcblxuICByZW1vdmU6IChjb2wsIGRvYykgLT5cbiAgICByZXR1cm4gZmFsc2VcblxuZXhwb3J0cy5Vc2VyQXV0aCA9IGNsYXNzIFVzZXJBdXRoXG4gICMgdXNlciBpcyB1c2VybmFtZSwgb3JnIGlzIG9yZyBjb2RlXG4gIGNvbnN0cnVjdG9yOiAodXNlciwgb3JnKSAtPlxuICAgIEB1c2VyID0gdXNlclxuICAgIEBvcmcgPSBvcmdcblxuICAgIEBlZGl0YWJsZUNvbHMgPSBbJ3NvdXJjZXMnLCAnc291cmNlX25vdGVzJywgJ3Rlc3RzJywgJ3Jlc3BvbnNlcyddXG5cbiAgaW5zZXJ0OiAoY29sKSAtPlxuICAgIGlmIG5vdCAoY29sIGluIEBlZGl0YWJsZUNvbHMpXG4gICAgICByZXR1cm4gZmFsc2VcbiAgICByZXR1cm4gdHJ1ZVxuXG4gIHVwZGF0ZTogKGNvbCwgZG9jKSAtPlxuICAgIGlmIG5vdCAoY29sIGluIEBlZGl0YWJsZUNvbHMpXG4gICAgICByZXR1cm4gZmFsc2VcblxuICAgIGlmIG5vdCBkb2NcbiAgICAgIHJldHVybiB0cnVlXG5cbiAgICBpZiBkb2Mub3JnIGFuZCBAb3JnXG4gICAgICByZXR1cm4gZG9jLnVzZXIgPT0gQHVzZXIgfHwgZG9jLm9yZyA9PSBAb3JnXG4gICAgZWxzZVxuICAgICAgcmV0dXJuIGRvYy51c2VyID09IEB1c2VyXG5cbiAgcmVtb3ZlOiAoY29sLCBkb2MpIC0+XG4gICAgaWYgbm90IChjb2wgaW4gQGVkaXRhYmxlQ29scylcbiAgICAgIHJldHVybiBmYWxzZVxuXG4gICAgaWYgbm90IGRvY1xuICAgICAgcmV0dXJuIHRydWVcblxuICAgIGlmIGRvYy5vcmcgYW5kIEBvcmdcbiAgICAgIHJldHVybiBkb2MudXNlciA9PSBAdXNlciB8fCBkb2Mub3JnID09IEBvcmdcbiAgICBlbHNlXG4gICAgICByZXR1cm4gZG9jLnVzZXIgPT0gQHVzZXJcblxuXG4gICAgIiwiZXhwb3J0cy5zZXFUb0NvZGUgPSAoc2VxKSAtPlxuICAjIEdldCBzdHJpbmcgb2Ygc2VxIG51bWJlclxuICBzdHIgPSBcIlwiICsgc2VxXG5cbiAgc3VtID0gMFxuICBmb3IgaSBpbiBbMC4uLnN0ci5sZW5ndGhdXG4gICAgZGlnaXQgPSBwYXJzZUludChzdHJbc3RyLmxlbmd0aC0xLWldKVxuICAgIGlmIGklMyA9PSAwXG4gICAgICBzdW0gKz0gNyAqIGRpZ2l0XG4gICAgaWYgaSUzID09IDFcbiAgICAgIHN1bSArPSAzICogZGlnaXRcbiAgICBpZiBpJTMgPT0gMlxuICAgICAgc3VtICs9ICBkaWdpdFxuICByZXR1cm4gc3RyICsgKHN1bSAlIDEwKVxuXG5leHBvcnRzLmlzVmFsaWQgPSAoY29kZSkgLT5cbiAgc2VxID0gcGFyc2VJbnQoY29kZS5zdWJzdHJpbmcoMCwgY29kZS5sZW5ndGggLSAxKSlcblxuICByZXR1cm4gZXhwb3J0cy5zZXFUb0NvZGUoc2VxKSA9PSBjb2RlXG5cbmV4cG9ydHMuU291cmNlQ29kZXNNYW5hZ2VyID0gY2xhc3MgU291cmNlQ29kZXNNYW5hZ2VyIFxuICAjIFVSTCB0byBvYnRhaW4gbW9yZSBjb2RlcyBmcm9tXG4gIGNvbnN0cnVjdG9yOiAodXJsKSAtPlxuICAgIEB1cmwgPSB1cmxcblxuICAjIERlZmF1bHQgY3V0b2ZmIGlzIHRocmVlIG1vbnRocyBpbiBmdXR1cmVcbiAgZGVmYXVsdEN1dG9mZiA9IC0+XG4gICAgY3V0b2ZmID0gbmV3IERhdGUoKVxuICAgIGN1dG9mZi5zZXREYXRlKGN1dG9mZi5nZXREYXRlKCkgKyAzMCozKVxuICAgIHJldHVybiBjdXRvZmYudG9JU09TdHJpbmcoKVxuXG4gICMgR2V0cyBsaXN0IG9mIGNhY2hlZCBzb3VyY2UgY29kZXMgaW4gZm9ybSB7IGNvZGU6PGNvZGU+LCBleHBpcnk6PGV4cGlyeSBpbiBJU08gZGF0ZXRpbWU+IH1cbiAgZ2V0TG9jYWxDb2RlczogLT5cbiAgICByZXR1cm4gW10gIHVubGVzcyBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShcInNvdXJjZUNvZGVzXCIpXG4gICAgSlNPTi5wYXJzZSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShcInNvdXJjZUNvZGVzXCIpXG4gIFxuICAjIFNldHMgbGlzdCBvZiBjYWNoZWQgc291cmNlIGNvZGVzIGluIGZvcm0geyBjb2RlOjxjb2RlPiwgZXhwaXJ5OjxleHBpcnkgaW4gSVNPIGRhdGV0aW1lPiB9XG4gIHNldExvY2FsQ29kZXM6IChjb2RlcykgLT5cbiAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSBcInNvdXJjZUNvZGVzXCIsIEpTT04uc3RyaW5naWZ5KGNvZGVzKVxuICBcbiAgIyBQdXJnZSBleHBpcmVkIGNvZGVcbiAgcHVyZ2VDb2RlczogKGN1dG9mZikgLT5cbiAgICBAc2V0TG9jYWxDb2RlcyBfLnJlamVjdChAZ2V0TG9jYWxDb2RlcygpLCAoaXRlbSkgLT5cbiAgICAgIGl0ZW0uZXhwaXJ5IDwgY3V0b2ZmXG4gICAgKVxuICBcbiAgIyBSZXBsZW5pc2ggY29kZXMgZnJvbSBzZXJ2ZXIgdG8gaGF2ZSBhIG1pbmltdW0gb2YgeCBhdmFpbGFibGVcbiAgcmVwbGVuaXNoQ29kZXM6IChtaW5OdW1iZXIsIHN1Y2Nlc3MsIGVycm9yLCBjdXRvZmYpIC0+XG4gICAgY3V0b2ZmID0gY3V0b2ZmIG9yIGRlZmF1bHRDdXRvZmYoKVxuICAgIFxuICAgICMgUHVyZ2Ugb2xkIGNvZGVzXG4gICAgQHB1cmdlQ29kZXMgY3V0b2ZmXG4gICAgXG4gICAgIyBEZXRlcm1pbmUgaG93IG1hbnkgYXJlIG5lZWRlZFxuICAgIG51bU5lZWRlZCA9IG1pbk51bWJlciAtIEBnZXRMb2NhbENvZGVzKCkubGVuZ3RoXG4gICAgXG4gICAgIyBJZiBoYXZlIGVub3VnaFxuICAgIGlmIG51bU5lZWRlZCA8PSAwXG4gICAgICBzdWNjZXNzKClcbiAgICAgIHJldHVyblxuICAgIFxuICAgICMgUmVxdWVzdCBuZXcgY29kZXNcbiAgICByZXEgPSAkLmFqYXgoQHVybCwge1xuICAgICAgZGF0YSA6IEpTT04uc3RyaW5naWZ5KHsgbnVtYmVyOiBudW1OZWVkZWQgfSksXG4gICAgICBjb250ZW50VHlwZSA6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgIHR5cGUgOiAnUE9TVCd9KVxuICAgIHJlcS5kb25lIChkYXRhLCB0ZXh0U3RhdHVzLCBqcVhIUikgPT5cbiAgICAgICMgQWRkIHRvIGxvY2FsIHN0b3JhZ2VcbiAgICAgIEBzZXRMb2NhbENvZGVzIEBnZXRMb2NhbENvZGVzKCkuY29uY2F0KGRhdGEpXG4gICAgICBzdWNjZXNzKClcbiAgICByZXEuZmFpbCAoanFYSFIsIHRleHRTdGF0dXMsIGVycm9yVGhyb3duKSA9PlxuICAgICAgaWYgZXJyb3JcbiAgICAgICAgZXJyb3IoZXJyb3JUaHJvd24pXG5cbiAgZ2V0TnVtYmVyQXZhaWxhYmxlQ29kZXM6IChjdXRvZmYpIC0+XG4gICAgY3V0b2ZmID0gY3V0b2ZmIG9yIGRlZmF1bHRDdXRvZmYoKVxuICAgIEBwdXJnZUNvZGVzIGN1dG9mZlxuICAgIEBnZXRMb2NhbENvZGVzKCkubGVuZ3RoXG5cbiAgcmVxdWVzdENvZGU6IChzdWNjZXNzLCBlcnJvciwgY3V0b2ZmKSAtPlxuICAgICMgUmVwbGVuaXNoIGNvZGVzIHRvIGhhdmUgYXQgbGVhc3Qgb25lXG4gICAgQHJlcGxlbmlzaENvZGVzIDEsICg9PlxuICAgICAgY29kZXMgPSBAZ2V0TG9jYWxDb2RlcygpXG4gICAgICBcbiAgICAgICMgUmVtb3ZlIGZpcnN0IGNvZGVcbiAgICAgIEBzZXRMb2NhbENvZGVzIF8ucmVzdChjb2RlcylcbiAgICAgIHN1Y2Nlc3MgXy5maXJzdChjb2RlcykuY29kZVxuICAgICksIGVycm9yLCBjdXRvZmZcblxuICBcbiAgIyBSZXNldCBhbGwgY29kZXMgY2FjaGVkXG4gIHJlc2V0OiAtPlxuICAgIEBzZXRMb2NhbENvZGVzIFtdXG5cbiMgRmFrZSBzb3VyY2UgY29kZXMgbWFuYWdlciB0aGF0IHJldHVybnMgdmFsaWQsIGJ1dCBub24tdW5pcXVlIGNvZGVzXG5leHBvcnRzLkRlbW9Tb3VyY2VDb2Rlc01hbmFnZXIgPSBjbGFzcyBEZW1vU291cmNlQ29kZXNNYW5hZ2VyXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgIEBudW1BdmFpbCA9IDEwXG5cbiAgZ2V0TnVtYmVyQXZhaWxhYmxlQ29kZXM6IChjdXRvZmYpIC0+XG4gICAgcmV0dXJuIEBudW1BdmFpbFxuXG4gIHJlcXVlc3RDb2RlOiAoc3VjY2VzcywgZXJyb3IsIGN1dG9mZikgLT5cbiAgICBzdWNjZXNzKGV4cG9ydHMuc2VxVG9Db2RlKE1hdGgucm91bmQoTWF0aC5yYW5kb20oKSoxMDAwMDAwKSkpXG5cbiAgcmVwbGVuaXNoQ29kZXM6IChtaW5OdW1iZXIsIHN1Y2Nlc3MsIGVycm9yLCBjdXRvZmYpIC0+XG4gICAgQG51bUF2YWlsID0gbWluTnVtYmVyXG4gICAgc3VjY2VzcygpXG4iLCJjbGFzcyBKc29uU2VydmVyXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgIEBtYXAgPSB7fVxuICAgIEBzZXJ2ZXIgPSBzaW5vbi5mYWtlU2VydmVyLmNyZWF0ZSgpXG4gICAgQHNlcnZlci5hdXRvUmVzcG9uZCA9IHRydWVcbiAgICBAc2VydmVyLnJlc3BvbmRXaXRoKEBoYW5kbGUpXG4gICAgXG4gIGhhbmRsZTogKHJlcXVlc3QpID0+XG4gICAgIyBQYXJzZSBib2R5XG4gICAgcmVxdWVzdC5wYXJhbXMgPSBKU09OLnBhcnNlKHJlcXVlc3QucmVxdWVzdEJvZHkpXG4gICAgXG4gICAgIyBHZXQgZGF0YVxuICAgIGl0ZW0gPSBAbWFwW3JlcXVlc3QubWV0aG9kK1wiOlwiK3JlcXVlc3QudXJsXVxuICAgIGNvbnNvbGUubG9nIHJlcXVlc3QubWV0aG9kK1wiOlwiK3JlcXVlc3QudXJsXG4gICAgaWYgaXRlbVxuICAgICAgZGF0YSA9IGl0ZW0ocmVxdWVzdClcbiAgICAgIGNvbnNvbGUubG9nIGRhdGFcbiAgICAgIHJlcXVlc3QucmVzcG9uZCgyMDAsIHsgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIgfSwgSlNPTi5zdHJpbmdpZnkoZGF0YSkpXG4gICAgICByZXR1cm5cbiAgICBjb25zb2xlLmxvZyBcIjQwNFwiXG4gICAgcmVxdWVzdC5yZXNwb25kKDQwNClcbiAgICBcbiAgcmVzcG9uZDogKG1ldGhvZCwgdXJsLCBmdW5jKSA9PlxuICAgIEBtYXBbbWV0aG9kK1wiOlwiK3VybF0gPSBmdW5jXG4gICAgXG4gIHRlYXJkb3duOiAtPlxuICAgIEBzZXJ2ZXIucmVzdG9yZSgpXG5cbiN3aW5kb3cuSnNvblNlcnZlciA9IEpzb25TZXJ2ZXJcbm1vZHVsZS5leHBvcnRzID0gSnNvblNlcnZlciIsIiMgT2JqZWN0cyB0aGF0IGhlbHAgd2l0aCBzeW5jaHJvbml6aW5nIHdpdGggdGhlIHNlcnZlclxuXG4jIENsYXNzIHdoaWNoIHJlcGVhdHMgYW4gb3BlcmF0aW9uIGV2ZXJ5IG4gbXMgb3Igd2hlbiBjYWxsZWRcbiMgUHV0cyBtdXRleCBvbiBhY3Rpb25cbmV4cG9ydHMuUmVwZWF0ZXIgPSBjbGFzcyBSZXBlYXRlciBcbiAgY29uc3RydWN0b3I6IChhY3Rpb24pIC0+XG4gICAgQGFjdGlvbiA9IGFjdGlvblxuICAgIEBydW5uaW5nID0gZmFsc2VcbiAgICBAaW5wcm9ncmVzcyA9IGZhbHNlXG5cbiAgc3RhcnQ6IChldmVyeSkgLT5cbiAgICBAZXZlcnkgPSBldmVyeVxuICAgIEBydW5uaW5nID0gdHJ1ZVxuICAgIHNldFRpbWVvdXQgQHBlcmZvcm1SZXBlYXQsIGV2ZXJ5XG5cbiAgc3RvcDogLT5cbiAgICBAcnVubmluZyA9IGZhbHNlXG5cbiAgcGVyZm9ybVJlcGVhdDogPT5cbiAgICBpZiBub3QgQHJ1bm5pbmdcbiAgICAgIHJldHVyblxuXG4gICAgc3VjY2VzcyA9ID0+XG4gICAgICBAaW5wcm9ncmVzcyA9IGZhbHNlXG4gICAgICBpZiBAcnVubmluZ1xuICAgICAgICBzZXRUaW1lb3V0IEBwZXJmb3JtUmVwZWF0LCBAZXZlcnlcbiAgICAgIEBsYXN0U3VjY2Vzc0RhdGUgPSBuZXcgRGF0ZSgpXG4gICAgICBAbGFzdEVycm9yID0gdW5kZWZpbmVkXG5cbiAgICBlcnJvciA9IChlcnIpID0+XG4gICAgICBAaW5wcm9ncmVzcyA9IGZhbHNlXG4gICAgICBpZiBAcnVubmluZ1xuICAgICAgICBzZXRUaW1lb3V0IEBwZXJmb3JtUmVwZWF0LCBAZXZlcnlcbiAgICAgIEBsYXN0RXJyb3IgPSBlcnJcblxuICAgIEBpbnByb2dyZXNzID0gdHJ1ZVxuICAgIEBhY3Rpb24oc3VjY2VzcywgZXJyb3IpXG5cbiAgcGVyZm9ybTogKHN1Y2Nlc3MsIGVycm9yKSAtPlxuICAgIHN1Y2Nlc3MyID0gPT5cbiAgICAgIEBpbnByb2dyZXNzID0gZmFsc2VcbiAgICAgIEBsYXN0U3VjY2Vzc0RhdGUgPSBuZXcgRGF0ZSgpXG4gICAgICBAbGFzdEVycm9yID0gdW5kZWZpbmVkXG4gICAgICBzdWNjZXNzKCkgaWYgc3VjY2Vzcz9cblxuICAgIGVycm9yMiA9IChlcnIpID0+XG4gICAgICBAaW5wcm9ncmVzcyA9IGZhbHNlXG4gICAgICBAbGFzdEVycm9yID0gZXJyXG4gICAgICBlcnJvcihlcnIpIGlmIGVycm9yP1xuXG4gICAgQGlucHJvZ3Jlc3MgPSB0cnVlXG4gICAgQGFjdGlvbihzdWNjZXNzMiwgZXJyb3IyKVxuXG5leHBvcnRzLlN5bmNocm9uaXplciA9IGNsYXNzIFN5bmNocm9uaXplclxuICBjb25zdHJ1Y3RvcjogKGh5YnJpZERiLCBpbWFnZU1hbmFnZXIsIHNvdXJjZUNvZGVzTWFuYWdlcikgLT5cbiAgICBAaHlicmlkRGIgPSBoeWJyaWREYlxuICAgIEBpbWFnZU1hbmFnZXIgPSBpbWFnZU1hbmFnZXJcbiAgICBAc291cmNlQ29kZXNNYW5hZ2VyID0gc291cmNlQ29kZXNNYW5hZ2VyXG5cbiAgICBAcmVwZWF0ZXIgPSBuZXcgUmVwZWF0ZXIoQF9zeW5jKVxuXG4gIHN0YXJ0OiAoZXZlcnkpIC0+IEByZXBlYXRlci5zdGFydChldmVyeSlcbiAgc3RvcDogLT4gQHJlcGVhdGVyLnN0b3AoKVxuXG4gIHN5bmM6IChzdWNjZXNzLCBlcnJvcikgLT5cbiAgICBAcmVwZWF0ZXIucGVyZm9ybShzdWNjZXNzLCBlcnJvcilcblxuICBfc3luYzogKHN1Y2Nlc3MsIGVycm9yKSA9PlxuICAgIHN1Y2Nlc3MxID0gPT5cbiAgICAgIHN1Y2Nlc3MyID0gPT5cbiAgICAgICAgcHJvZ3Jlc3MgPSA9PlxuICAgICAgICAgICMgRG8gbm90aGluZyB3aXRoIHByb2dyZXNzXG4gICAgICAgIEBpbWFnZU1hbmFnZXIudXBsb2FkIHByb2dyZXNzLCBzdWNjZXNzLCBlcnJvclxuICAgICAgQHNvdXJjZUNvZGVzTWFuYWdlci5yZXBsZW5pc2hDb2RlcyA1LCBzdWNjZXNzMiwgZXJyb3JcbiAgICBAaHlicmlkRGIudXBsb2FkIHN1Y2Nlc3MxLCBlcnJvclxuIiwibW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBSZW1vdGVEYlxuICAjIFVybCBtdXN0IGhhdmUgdHJhaWxpbmcgL1xuICBjb25zdHJ1Y3RvcjogKHVybCwgY2xpZW50KSAtPlxuICAgIEB1cmwgPSB1cmxcbiAgICBAY2xpZW50ID0gY2xpZW50XG4gICAgQGNvbGxlY3Rpb25zID0ge31cblxuICBhZGRDb2xsZWN0aW9uOiAobmFtZSkgLT5cbiAgICBjb2xsZWN0aW9uID0gbmV3IENvbGxlY3Rpb24obmFtZSwgQHVybCArIG5hbWUsIEBjbGllbnQpXG4gICAgQFtuYW1lXSA9IGNvbGxlY3Rpb25cbiAgICBAY29sbGVjdGlvbnNbbmFtZV0gPSBjb2xsZWN0aW9uXG5cbiAgcmVtb3ZlQ29sbGVjdGlvbjogKG5hbWUpIC0+XG4gICAgZGVsZXRlIEBbbmFtZV1cbiAgICBkZWxldGUgQGNvbGxlY3Rpb25zW25hbWVdXG5cbiMgUmVtb3RlIGNvbGxlY3Rpb24gb24gc2VydmVyXG5jbGFzcyBDb2xsZWN0aW9uXG4gIGNvbnN0cnVjdG9yOiAobmFtZSwgdXJsLCBjbGllbnQpIC0+XG4gICAgQG5hbWUgPSBuYW1lXG4gICAgQHVybCA9IHVybFxuICAgIEBjbGllbnQgPSBjbGllbnRcblxuICBmaW5kOiAoc2VsZWN0b3IsIG9wdGlvbnMgPSB7fSkgLT5cbiAgICByZXR1cm4gZmV0Y2g6IChzdWNjZXNzLCBlcnJvcikgPT5cbiAgICAgICMgQ3JlYXRlIHVybFxuICAgICAgcGFyYW1zID0ge31cbiAgICAgIGlmIG9wdGlvbnMuc29ydFxuICAgICAgICBwYXJhbXMuc29ydCA9IEpTT04uc3RyaW5naWZ5KG9wdGlvbnMuc29ydClcbiAgICAgIGlmIG9wdGlvbnMubGltaXRcbiAgICAgICAgcGFyYW1zLmxpbWl0ID0gb3B0aW9ucy5saW1pdFxuICAgICAgaWYgb3B0aW9ucy5maWVsZHNcbiAgICAgICAgcGFyYW1zLmZpZWxkcyA9IEpTT04uc3RyaW5naWZ5KG9wdGlvbnMuZmllbGRzKVxuICAgICAgaWYgQGNsaWVudFxuICAgICAgICBwYXJhbXMuY2xpZW50ID0gQGNsaWVudFxuICAgICAgcGFyYW1zLnNlbGVjdG9yID0gSlNPTi5zdHJpbmdpZnkoc2VsZWN0b3IgfHwge30pXG5cbiAgICAgIHJlcSA9ICQuZ2V0SlNPTihAdXJsLCBwYXJhbXMpXG4gICAgICByZXEuZG9uZSAoZGF0YSwgdGV4dFN0YXR1cywganFYSFIpID0+XG4gICAgICAgIHN1Y2Nlc3MoZGF0YSlcbiAgICAgIHJlcS5mYWlsIChqcVhIUiwgdGV4dFN0YXR1cywgZXJyb3JUaHJvd24pID0+XG4gICAgICAgIGlmIGVycm9yXG4gICAgICAgICAgZXJyb3IoZXJyb3JUaHJvd24pXG5cbiAgZmluZE9uZTogKHNlbGVjdG9yLCBvcHRpb25zID0ge30sIHN1Y2Nlc3MsIGVycm9yKSAtPlxuICAgIGlmIF8uaXNGdW5jdGlvbihvcHRpb25zKSBcbiAgICAgIFtvcHRpb25zLCBzdWNjZXNzLCBlcnJvcl0gPSBbe30sIG9wdGlvbnMsIHN1Y2Nlc3NdXG5cbiAgICAjIENyZWF0ZSB1cmxcbiAgICBwYXJhbXMgPSB7fVxuICAgIGlmIG9wdGlvbnMuc29ydFxuICAgICAgcGFyYW1zLnNvcnQgPSBKU09OLnN0cmluZ2lmeShvcHRpb25zLnNvcnQpXG4gICAgcGFyYW1zLmxpbWl0ID0gMVxuICAgIGlmIEBjbGllbnRcbiAgICAgIHBhcmFtcy5jbGllbnQgPSBAY2xpZW50XG4gICAgcGFyYW1zLnNlbGVjdG9yID0gSlNPTi5zdHJpbmdpZnkoc2VsZWN0b3IgfHwge30pXG5cbiAgICByZXEgPSAkLmdldEpTT04oQHVybCwgcGFyYW1zKVxuICAgIHJlcS5kb25lIChkYXRhLCB0ZXh0U3RhdHVzLCBqcVhIUikgPT5cbiAgICAgIHN1Y2Nlc3MoZGF0YVswXSB8fCBudWxsKVxuICAgIHJlcS5mYWlsIChqcVhIUiwgdGV4dFN0YXR1cywgZXJyb3JUaHJvd24pID0+XG4gICAgICBpZiBlcnJvclxuICAgICAgICBlcnJvcihlcnJvclRocm93bilcblxuICB1cHNlcnQ6IChkb2MsIHN1Y2Nlc3MsIGVycm9yKSAtPlxuICAgIGlmIG5vdCBAY2xpZW50XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDbGllbnQgcmVxdWlyZWQgdG8gdXBzZXJ0XCIpXG5cbiAgICBpZiBub3QgZG9jLl9pZFxuICAgICAgZG9jLl9pZCA9IGNyZWF0ZVVpZCgpXG5cbiAgICByZXEgPSAkLmFqYXgoQHVybCArIFwiP2NsaWVudD1cIiArIEBjbGllbnQsIHtcbiAgICAgIGRhdGEgOiBKU09OLnN0cmluZ2lmeShkb2MpLFxuICAgICAgY29udGVudFR5cGUgOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICB0eXBlIDogJ1BPU1QnfSlcbiAgICByZXEuZG9uZSAoZGF0YSwgdGV4dFN0YXR1cywganFYSFIpID0+XG4gICAgICBzdWNjZXNzKGRhdGEgfHwgbnVsbClcbiAgICByZXEuZmFpbCAoanFYSFIsIHRleHRTdGF0dXMsIGVycm9yVGhyb3duKSA9PlxuICAgICAgaWYgZXJyb3JcbiAgICAgICAgZXJyb3IoZXJyb3JUaHJvd24pXG5cbiAgcmVtb3ZlOiAoaWQsIHN1Y2Nlc3MsIGVycm9yKSAtPlxuICAgIGlmIG5vdCBAY2xpZW50XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDbGllbnQgcmVxdWlyZWQgdG8gcmVtb3ZlXCIpXG4gICAgICBcbiAgICByZXEgPSAkLmFqYXgoQHVybCArIFwiL1wiICsgaWQgKyBcIj9jbGllbnQ9XCIgKyBAY2xpZW50LCB7IHR5cGUgOiAnREVMRVRFJ30pXG4gICAgcmVxLmRvbmUgKGRhdGEsIHRleHRTdGF0dXMsIGpxWEhSKSA9PlxuICAgICAgc3VjY2VzcygpXG4gICAgcmVxLmZhaWwgKGpxWEhSLCB0ZXh0U3RhdHVzLCBlcnJvclRocm93bikgPT5cbiAgICAgIGlmIGpxWEhSLnN0YXR1cyA9PSA0MDRcbiAgICAgICAgc3VjY2VzcygpXG4gICAgICBlbHNlIGlmIGVycm9yXG4gICAgICAgIGVycm9yKGVycm9yVGhyb3duKVxuXG5cbmNyZWF0ZVVpZCA9IC0+IFxuICAneHh4eHh4eHh4eHh4NHh4eHl4eHh4eHh4eHh4eHh4eHgnLnJlcGxhY2UoL1t4eV0vZywgKGMpIC0+XG4gICAgciA9IE1hdGgucmFuZG9tKCkqMTZ8MFxuICAgIHYgPSBpZiBjID09ICd4JyB0aGVuIHIgZWxzZSAociYweDN8MHg4KVxuICAgIHJldHVybiB2LnRvU3RyaW5nKDE2KVxuICAgKSIsIkxvY2F0aW9uRmluZGVyID0gcmVxdWlyZSAnLi9Mb2NhdGlvbkZpbmRlcidcbkdlb0pTT04gPSByZXF1aXJlICcuL0dlb0pTT04nXG5cbiMgU2hvd3MgdGhlIHJlbGF0aXZlIGxvY2F0aW9uIG9mIGEgcG9pbnQgYW5kIGFsbG93cyBzZXR0aW5nIGl0XG4jIEZpcmVzIGV2ZW50cyBsb2NhdGlvbnNldCwgbWFwLCBib3RoIHdpdGggXG4jIG9wdGlvbnMgcmVhZG9ubHkgbWFrZXMgaXQgbm9uLWVkaXRhYmxlXG5jbGFzcyBMb2NhdGlvblZpZXcgZXh0ZW5kcyBCYWNrYm9uZS5WaWV3XG4gIGNvbnN0cnVjdG9yOiAob3B0aW9ucykgLT5cbiAgICBzdXBlcigpXG4gICAgQGxvYyA9IG9wdGlvbnMubG9jXG4gICAgQHJlYWRvbmx5ID0gb3B0aW9ucy5yZWFkb25seVxuICAgIEBzZXR0aW5nTG9jYXRpb24gPSBmYWxzZVxuICAgIEBsb2NhdGlvbkZpbmRlciA9IG9wdGlvbnMubG9jYXRpb25GaW5kZXIgfHwgbmV3IExvY2F0aW9uRmluZGVyKClcblxuICAgICMgTGlzdGVuIHRvIGxvY2F0aW9uIGV2ZW50c1xuICAgIEBsaXN0ZW5UbyhAbG9jYXRpb25GaW5kZXIsICdmb3VuZCcsIEBsb2NhdGlvbkZvdW5kKVxuICAgIEBsaXN0ZW5UbyhAbG9jYXRpb25GaW5kZXIsICdlcnJvcicsIEBsb2NhdGlvbkVycm9yKVxuXG4gICAgIyBTdGFydCB0cmFja2luZyBsb2NhdGlvbiBpZiBzZXRcbiAgICBpZiBAbG9jXG4gICAgICBAbG9jYXRpb25GaW5kZXIuc3RhcnRXYXRjaCgpXG5cbiAgICBAcmVuZGVyKClcblxuICBldmVudHM6XG4gICAgJ2NsaWNrICNsb2NhdGlvbl9tYXAnIDogJ21hcENsaWNrZWQnXG4gICAgJ2NsaWNrICNsb2NhdGlvbl9zZXQnIDogJ3NldExvY2F0aW9uJ1xuXG4gIHJlbW92ZTogLT5cbiAgICBAbG9jYXRpb25GaW5kZXIuc3RvcFdhdGNoKClcbiAgICBzdXBlcigpXG5cbiAgcmVuZGVyOiAtPlxuICAgIEAkZWwuaHRtbCB0ZW1wbGF0ZXNbJ0xvY2F0aW9uVmlldyddKClcblxuICAgICMgU2V0IGxvY2F0aW9uIHN0cmluZ1xuICAgIGlmIEBlcnJvckZpbmRpbmdMb2NhdGlvblxuICAgICAgQCQoXCIjbG9jYXRpb25fcmVsYXRpdmVcIikudGV4dChcIkNhbm5vdCBmaW5kIGxvY2F0aW9uXCIpXG4gICAgZWxzZSBpZiBub3QgQGxvYyBhbmQgbm90IEBzZXR0aW5nTG9jYXRpb24gXG4gICAgICBAJChcIiNsb2NhdGlvbl9yZWxhdGl2ZVwiKS50ZXh0KFwiVW5zcGVjaWZpZWQgbG9jYXRpb25cIilcbiAgICBlbHNlIGlmIEBzZXR0aW5nTG9jYXRpb25cbiAgICAgIEAkKFwiI2xvY2F0aW9uX3JlbGF0aXZlXCIpLnRleHQoXCJTZXR0aW5nIGxvY2F0aW9uLi4uXCIpXG4gICAgZWxzZSBpZiBub3QgQGN1cnJlbnRMb2NcbiAgICAgIEAkKFwiI2xvY2F0aW9uX3JlbGF0aXZlXCIpLnRleHQoXCJXYWl0aW5nIGZvciBHUFMuLi5cIilcbiAgICBlbHNlXG4gICAgICBAJChcIiNsb2NhdGlvbl9yZWxhdGl2ZVwiKS50ZXh0KEdlb0pTT04uZ2V0UmVsYXRpdmVMb2NhdGlvbihAY3VycmVudExvYywgQGxvYykpXG5cbiAgICAjIERpc2FibGUgbWFwIGlmIGxvY2F0aW9uIG5vdCBzZXRcbiAgICBAJChcIiNsb2NhdGlvbl9tYXBcIikuYXR0cihcImRpc2FibGVkXCIsIG5vdCBAbG9jKTtcblxuICAgICMgRGlzYWJsZSBzZXQgaWYgc2V0dGluZyBvciByZWFkb25seVxuICAgIEAkKFwiI2xvY2F0aW9uX3NldFwiKS5hdHRyKFwiZGlzYWJsZWRcIiwgQHNldHRpbmdMb2NhdGlvbiB8fCBAcmVhZG9ubHkpOyAgICBcblxuICBzZXRMb2NhdGlvbjogLT5cbiAgICBAc2V0dGluZ0xvY2F0aW9uID0gdHJ1ZVxuICAgIEBlcnJvckZpbmRpbmdMb2NhdGlvbiA9IGZhbHNlXG4gICAgQGxvY2F0aW9uRmluZGVyLnN0YXJ0V2F0Y2goKVxuICAgIEByZW5kZXIoKVxuXG4gIGxvY2F0aW9uRm91bmQ6IChwb3MpID0+XG4gICAgaWYgQHNldHRpbmdMb2NhdGlvblxuICAgICAgQHNldHRpbmdMb2NhdGlvbiA9IGZhbHNlXG4gICAgICBAZXJyb3JGaW5kaW5nTG9jYXRpb24gPSBmYWxzZVxuXG4gICAgICAjIFNldCBsb2NhdGlvblxuICAgICAgQGxvYyA9IEdlb0pTT04ucG9zVG9Qb2ludChwb3MpXG4gICAgICBAdHJpZ2dlcignbG9jYXRpb25zZXQnLCBAbG9jKVxuXG4gICAgQGN1cnJlbnRMb2MgPSBHZW9KU09OLnBvc1RvUG9pbnQocG9zKVxuICAgIEByZW5kZXIoKVxuXG4gIGxvY2F0aW9uRXJyb3I6ID0+XG4gICAgQHNldHRpbmdMb2NhdGlvbiA9IGZhbHNlXG4gICAgQGVycm9yRmluZGluZ0xvY2F0aW9uID0gdHJ1ZVxuICAgIEByZW5kZXIoKVxuXG4gIG1hcENsaWNrZWQ6ID0+XG4gICAgQHRyaWdnZXIoJ21hcCcsIEBsb2MpXG5cblxubW9kdWxlLmV4cG9ydHMgPSBMb2NhdGlvblZpZXciLCJjcmVhdGVVaWQgPSByZXF1aXJlKCcuL3V0aWxzJykuY3JlYXRlVWlkXG5wcm9jZXNzRmluZCA9IHJlcXVpcmUoJy4vdXRpbHMnKS5wcm9jZXNzRmluZFxuY29tcGlsZVNvcnQgPSByZXF1aXJlKCcuL3NlbGVjdG9yJykuY29tcGlsZVNvcnRcblxuY2xhc3MgTG9jYWxEYlxuICBjb25zdHJ1Y3RvcjogKG9wdGlvbnMpIC0+XG4gICAgQGNvbGxlY3Rpb25zID0ge31cblxuICAgIGlmIG9wdGlvbnMgYW5kIG9wdGlvbnMubmFtZXNwYWNlIGFuZCB3aW5kb3cubG9jYWxTdG9yYWdlXG4gICAgICBAbmFtZXNwYWNlID0gb3B0aW9ucy5uYW1lc3BhY2VcblxuICBhZGRDb2xsZWN0aW9uOiAobmFtZSkgLT5cbiAgICAjIFNldCBuYW1lc3BhY2UgZm9yIGNvbGxlY3Rpb25cbiAgICBuYW1lc3BhY2UgPSBAbmFtZXNwYWNlK1wiLlwiK25hbWUgaWYgQG5hbWVzcGFjZVxuXG4gICAgY29sbGVjdGlvbiA9IG5ldyBDb2xsZWN0aW9uKG5hbWUsIG5hbWVzcGFjZSlcbiAgICBAW25hbWVdID0gY29sbGVjdGlvblxuICAgIEBjb2xsZWN0aW9uc1tuYW1lXSA9IGNvbGxlY3Rpb25cblxuICByZW1vdmVDb2xsZWN0aW9uOiAobmFtZSkgLT5cbiAgICBpZiBAbmFtZXNwYWNlIGFuZCB3aW5kb3cubG9jYWxTdG9yYWdlXG4gICAgICBrZXlzID0gW11cbiAgICAgIGZvciBpIGluIFswLi4ubG9jYWxTdG9yYWdlLmxlbmd0aF1cbiAgICAgICAga2V5cy5wdXNoKGxvY2FsU3RvcmFnZS5rZXkoaSkpXG5cbiAgICAgIGZvciBrZXkgaW4ga2V5c1xuICAgICAgICBpZiBrZXkuc3Vic3RyaW5nKDAsIEBuYW1lc3BhY2UubGVuZ3RoICsgMSkgPT0gQG5hbWVzcGFjZSArIFwiLlwiXG4gICAgICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oa2V5KVxuXG4gICAgZGVsZXRlIEBbbmFtZV1cbiAgICBkZWxldGUgQGNvbGxlY3Rpb25zW25hbWVdXG5cblxuIyBTdG9yZXMgZGF0YSBpbiBtZW1vcnksIG9wdGlvbmFsbHkgYmFja2VkIGJ5IGxvY2FsIHN0b3JhZ2VcbmNsYXNzIENvbGxlY3Rpb25cbiAgY29uc3RydWN0b3I6IChuYW1lLCBuYW1lc3BhY2UpIC0+XG4gICAgQG5hbWUgPSBuYW1lXG4gICAgQG5hbWVzcGFjZSA9IG5hbWVzcGFjZVxuXG4gICAgQGl0ZW1zID0ge31cbiAgICBAdXBzZXJ0cyA9IHt9ICAjIFBlbmRpbmcgdXBzZXJ0cyBieSBfaWQuIFN0aWxsIGluIGl0ZW1zXG4gICAgQHJlbW92ZXMgPSB7fSAgIyBQZW5kaW5nIHJlbW92ZXMgYnkgX2lkLiBObyBsb25nZXIgaW4gaXRlbXNcblxuICAgICMgUmVhZCBmcm9tIGxvY2FsIHN0b3JhZ2VcbiAgICBpZiB3aW5kb3cubG9jYWxTdG9yYWdlIGFuZCBuYW1lc3BhY2U/XG4gICAgICBAbG9hZFN0b3JhZ2UoKVxuXG4gIGxvYWRTdG9yYWdlOiAtPlxuICAgICMgUmVhZCBpdGVtcyBmcm9tIGxvY2FsU3RvcmFnZVxuICAgIEBpdGVtTmFtZXNwYWNlID0gQG5hbWVzcGFjZSArIFwiX1wiXG5cbiAgICBmb3IgaSBpbiBbMC4uLmxvY2FsU3RvcmFnZS5sZW5ndGhdXG4gICAgICBrZXkgPSBsb2NhbFN0b3JhZ2Uua2V5KGkpXG4gICAgICBpZiBrZXkuc3Vic3RyaW5nKDAsIEBpdGVtTmFtZXNwYWNlLmxlbmd0aCkgPT0gQGl0ZW1OYW1lc3BhY2VcbiAgICAgICAgaXRlbSA9IEpTT04ucGFyc2UobG9jYWxTdG9yYWdlW2tleV0pXG4gICAgICAgIEBpdGVtc1tpdGVtLl9pZF0gPSBpdGVtXG5cbiAgICAjIFJlYWQgdXBzZXJ0c1xuICAgIHVwc2VydEtleXMgPSBpZiBsb2NhbFN0b3JhZ2VbQG5hbWVzcGFjZStcInVwc2VydHNcIl0gdGhlbiBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZVtAbmFtZXNwYWNlK1widXBzZXJ0c1wiXSkgZWxzZSBbXVxuICAgIGZvciBrZXkgaW4gdXBzZXJ0S2V5c1xuICAgICAgQHVwc2VydHNba2V5XSA9IEBpdGVtc1trZXldXG5cbiAgICAjIFJlYWQgcmVtb3Zlc1xuICAgIHJlbW92ZUl0ZW1zID0gaWYgbG9jYWxTdG9yYWdlW0BuYW1lc3BhY2UrXCJyZW1vdmVzXCJdIHRoZW4gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2VbQG5hbWVzcGFjZStcInJlbW92ZXNcIl0pIGVsc2UgW11cbiAgICBAcmVtb3ZlcyA9IF8ub2JqZWN0KF8ucGx1Y2socmVtb3ZlSXRlbXMsIFwiX2lkXCIpLCByZW1vdmVJdGVtcylcblxuICBmaW5kOiAoc2VsZWN0b3IsIG9wdGlvbnMpIC0+XG4gICAgcmV0dXJuIGZldGNoOiAoc3VjY2VzcywgZXJyb3IpID0+XG4gICAgICBAX2ZpbmRGZXRjaChzZWxlY3Rvciwgb3B0aW9ucywgc3VjY2VzcywgZXJyb3IpXG5cbiAgZmluZE9uZTogKHNlbGVjdG9yLCBvcHRpb25zLCBzdWNjZXNzLCBlcnJvcikgLT5cbiAgICBpZiBfLmlzRnVuY3Rpb24ob3B0aW9ucykgXG4gICAgICBbb3B0aW9ucywgc3VjY2VzcywgZXJyb3JdID0gW3t9LCBvcHRpb25zLCBzdWNjZXNzXVxuXG4gICAgQGZpbmQoc2VsZWN0b3IsIG9wdGlvbnMpLmZldGNoIChyZXN1bHRzKSAtPlxuICAgICAgaWYgc3VjY2Vzcz8gdGhlbiBzdWNjZXNzKGlmIHJlc3VsdHMubGVuZ3RoPjAgdGhlbiByZXN1bHRzWzBdIGVsc2UgbnVsbClcbiAgICAsIGVycm9yXG5cbiAgX2ZpbmRGZXRjaDogKHNlbGVjdG9yLCBvcHRpb25zLCBzdWNjZXNzLCBlcnJvcikgLT5cbiAgICBpZiBzdWNjZXNzPyB0aGVuIHN1Y2Nlc3MocHJvY2Vzc0ZpbmQoQGl0ZW1zLCBzZWxlY3Rvciwgb3B0aW9ucykpXG5cbiAgdXBzZXJ0OiAoZG9jLCBzdWNjZXNzLCBlcnJvcikgLT5cbiAgICBpZiBub3QgZG9jLl9pZFxuICAgICAgZG9jLl9pZCA9IGNyZWF0ZVVpZCgpXG5cbiAgICAjIFJlcGxhY2UvYWRkIFxuICAgIEBfcHV0SXRlbShkb2MpXG4gICAgQF9wdXRVcHNlcnQoZG9jKVxuXG4gICAgaWYgc3VjY2Vzcz8gdGhlbiBzdWNjZXNzKGRvYylcblxuICByZW1vdmU6IChpZCwgc3VjY2VzcywgZXJyb3IpIC0+XG4gICAgaWYgXy5oYXMoQGl0ZW1zLCBpZClcbiAgICAgIEBfcHV0UmVtb3ZlKEBpdGVtc1tpZF0pXG4gICAgICBAX2RlbGV0ZUl0ZW0oaWQpXG4gICAgICBAX2RlbGV0ZVVwc2VydChpZClcblxuICAgIGlmIHN1Y2Nlc3M/IHRoZW4gc3VjY2VzcygpXG5cbiAgX3B1dEl0ZW06IChkb2MpIC0+XG4gICAgQGl0ZW1zW2RvYy5faWRdID0gZG9jXG4gICAgaWYgQG5hbWVzcGFjZVxuICAgICAgbG9jYWxTdG9yYWdlW0BpdGVtTmFtZXNwYWNlICsgZG9jLl9pZF0gPSBKU09OLnN0cmluZ2lmeShkb2MpXG5cbiAgX2RlbGV0ZUl0ZW06IChpZCkgLT5cbiAgICBkZWxldGUgQGl0ZW1zW2lkXVxuICAgIGlmIEBuYW1lc3BhY2VcbiAgICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKEBpdGVtTmFtZXNwYWNlICsgaWQpXG5cbiAgX3B1dFVwc2VydDogKGRvYykgLT5cbiAgICBAdXBzZXJ0c1tkb2MuX2lkXSA9IGRvY1xuICAgIGlmIEBuYW1lc3BhY2VcbiAgICAgIGxvY2FsU3RvcmFnZVtAbmFtZXNwYWNlK1widXBzZXJ0c1wiXSA9IEpTT04uc3RyaW5naWZ5KF8ua2V5cyhAdXBzZXJ0cykpXG5cbiAgX2RlbGV0ZVVwc2VydDogKGlkKSAtPlxuICAgIGRlbGV0ZSBAdXBzZXJ0c1tpZF1cbiAgICBpZiBAbmFtZXNwYWNlXG4gICAgICBsb2NhbFN0b3JhZ2VbQG5hbWVzcGFjZStcInVwc2VydHNcIl0gPSBKU09OLnN0cmluZ2lmeShfLmtleXMoQHVwc2VydHMpKVxuXG4gIF9wdXRSZW1vdmU6IChkb2MpIC0+XG4gICAgQHJlbW92ZXNbZG9jLl9pZF0gPSBkb2NcbiAgICBpZiBAbmFtZXNwYWNlXG4gICAgICBsb2NhbFN0b3JhZ2VbQG5hbWVzcGFjZStcInJlbW92ZXNcIl0gPSBKU09OLnN0cmluZ2lmeShfLnZhbHVlcyhAcmVtb3ZlcykpXG5cbiAgX2RlbGV0ZVJlbW92ZTogKGlkKSAtPlxuICAgIGRlbGV0ZSBAcmVtb3Zlc1tpZF1cbiAgICBpZiBAbmFtZXNwYWNlXG4gICAgICBsb2NhbFN0b3JhZ2VbQG5hbWVzcGFjZStcInJlbW92ZXNcIl0gPSBKU09OLnN0cmluZ2lmeShfLnZhbHVlcyhAcmVtb3ZlcykpXG5cbiAgY2FjaGU6IChkb2NzLCBzZWxlY3Rvciwgb3B0aW9ucywgc3VjY2VzcywgZXJyb3IpIC0+XG4gICAgIyBBZGQgYWxsIG5vbi1sb2NhbCB0aGF0IGFyZSBub3QgdXBzZXJ0ZWQgb3IgcmVtb3ZlZFxuICAgIGZvciBkb2MgaW4gZG9jc1xuICAgICAgaWYgbm90IF8uaGFzKEB1cHNlcnRzLCBkb2MuX2lkKSBhbmQgbm90IF8uaGFzKEByZW1vdmVzLCBkb2MuX2lkKVxuICAgICAgICBAX3B1dEl0ZW0oZG9jKVxuXG4gICAgZG9jc01hcCA9IF8ub2JqZWN0KF8ucGx1Y2soZG9jcywgXCJfaWRcIiksIGRvY3MpXG5cbiAgICBpZiBvcHRpb25zLnNvcnRcbiAgICAgIHNvcnQgPSBjb21waWxlU29ydChvcHRpb25zLnNvcnQpXG5cbiAgICAjIFBlcmZvcm0gcXVlcnksIHJlbW92aW5nIHJvd3MgbWlzc2luZyBpbiBkb2NzIGZyb20gbG9jYWwgZGIgXG4gICAgQGZpbmQoc2VsZWN0b3IsIG9wdGlvbnMpLmZldGNoIChyZXN1bHRzKSA9PlxuICAgICAgZm9yIHJlc3VsdCBpbiByZXN1bHRzXG4gICAgICAgIGlmIG5vdCBkb2NzTWFwW3Jlc3VsdC5faWRdIGFuZCBub3QgXy5oYXMoQHVwc2VydHMsIHJlc3VsdC5faWQpXG4gICAgICAgICAgIyBJZiBwYXN0IGVuZCBvbiBzb3J0ZWQgbGltaXRlZCwgaWdub3JlXG4gICAgICAgICAgaWYgb3B0aW9ucy5zb3J0IGFuZCBvcHRpb25zLmxpbWl0IGFuZCBkb2NzLmxlbmd0aCA9PSBvcHRpb25zLmxpbWl0XG4gICAgICAgICAgICBpZiBzb3J0KHJlc3VsdCwgXy5sYXN0KGRvY3MpKSA+PSAwXG4gICAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgQF9kZWxldGVJdGVtKHJlc3VsdC5faWQpXG5cbiAgICAgIGlmIHN1Y2Nlc3M/IHRoZW4gc3VjY2VzcygpICBcbiAgICAsIGVycm9yXG4gICAgXG4gIHBlbmRpbmdVcHNlcnRzOiAoc3VjY2VzcykgLT5cbiAgICBzdWNjZXNzIF8udmFsdWVzKEB1cHNlcnRzKVxuXG4gIHBlbmRpbmdSZW1vdmVzOiAoc3VjY2VzcykgLT5cbiAgICBzdWNjZXNzIF8ucGx1Y2soQHJlbW92ZXMsIFwiX2lkXCIpXG5cbiAgcmVzb2x2ZVVwc2VydDogKGRvYywgc3VjY2VzcykgLT5cbiAgICBpZiBAdXBzZXJ0c1tkb2MuX2lkXSBhbmQgXy5pc0VxdWFsKGRvYywgQHVwc2VydHNbZG9jLl9pZF0pXG4gICAgICBAX2RlbGV0ZVVwc2VydChkb2MuX2lkKVxuICAgIGlmIHN1Y2Nlc3M/IHRoZW4gc3VjY2VzcygpXG5cbiAgcmVzb2x2ZVJlbW92ZTogKGlkLCBzdWNjZXNzKSAtPlxuICAgIEBfZGVsZXRlUmVtb3ZlKGlkKVxuICAgIGlmIHN1Y2Nlc3M/IHRoZW4gc3VjY2VzcygpXG5cbiAgIyBBZGQgYnV0IGRvIG5vdCBvdmVyd3JpdGUgb3IgcmVjb3JkIGFzIHVwc2VydFxuICBzZWVkOiAoZG9jLCBzdWNjZXNzKSAtPlxuICAgIGlmIG5vdCBfLmhhcyhAaXRlbXMsIGRvYy5faWQpIGFuZCBub3QgXy5oYXMoQHJlbW92ZXMsIGRvYy5faWQpXG4gICAgICBAX3B1dEl0ZW0oZG9jKVxuICAgIGlmIHN1Y2Nlc3M/IHRoZW4gc3VjY2VzcygpXG5cbm1vZHVsZS5leHBvcnRzID0gTG9jYWxEYlxuIiwiUGFnZSA9IHJlcXVpcmUgXCIuLi9QYWdlXCJcblxuIyBEaXNwbGF5cyBhbiBpbWFnZS4gT3B0aW9uczogdWlkOiB1aWQgb2YgaW1hZ2Vcbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgSW1hZ2VQYWdlIGV4dGVuZHMgUGFnZVxuICBjcmVhdGU6IC0+XG4gICAgQCRlbC5odG1sIHRlbXBsYXRlc1sncGFnZXMvSW1hZ2VQYWdlJ10oKVxuXG4gICAgIyBHZXQgaW1hZ2UgdXJsXG4gICAgQGltYWdlTWFuYWdlci5nZXRJbWFnZVVybChAb3B0aW9ucy5pZCwgKHVybCkgPT5cbiAgICAgIEAkKFwiI21lc3NhZ2VfYmFyXCIpLmhpZGUoKVxuICAgICAgQCQoXCIjaW1hZ2VcIikuYXR0cihcInNyY1wiLCB1cmwpLnNob3coKVxuICAgICwgQGVycm9yKVxuXG4gIGFjdGl2YXRlOiAtPlxuICAgIEBzZXRUaXRsZSBcIkltYWdlXCJcblxuICAgICMgSWYgcmVtb3ZlIGFsbG93ZWQsIHNldCBpbiBidXR0b24gYmFyXG4gICAgaWYgQG9wdGlvbnMub25SZW1vdmVcbiAgICAgIEBzZXR1cEJ1dHRvbkJhciBbXG4gICAgICAgIHsgaWNvbjogXCJkZWxldGUucG5nXCIsIGNsaWNrOiA9PiBAcmVtb3ZlUGhvdG8oKSB9XG4gICAgICBdXG4gICAgZWxzZVxuICAgICAgQHNldHVwQnV0dG9uQmFyIFtdXG5cbiAgcmVtb3ZlUGhvdG86IC0+XG4gICAgaWYgY29uZmlybShcIlJlbW92ZSBpbWFnZT9cIilcbiAgICAgIEBvcHRpb25zLm9uUmVtb3ZlKClcbiAgICAgIEBwYWdlci5jbG9zZVBhZ2UoKVxuIiwiIyMjXG5cbkRhdGFiYXNlIHdoaWNoIGNhY2hlcyBsb2NhbGx5IGluIGEgbG9jYWxEYiBidXQgcHVsbHMgcmVzdWx0c1xudWx0aW1hdGVseSBmcm9tIGEgUmVtb3RlRGJcblxuIyMjXG5cbnByb2Nlc3NGaW5kID0gcmVxdWlyZSgnLi91dGlscycpLnByb2Nlc3NGaW5kXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgSHlicmlkRGJcbiAgY29uc3RydWN0b3I6IChsb2NhbERiLCByZW1vdGVEYikgLT5cbiAgICBAbG9jYWxEYiA9IGxvY2FsRGJcbiAgICBAcmVtb3RlRGIgPSByZW1vdGVEYlxuICAgIEBjb2xsZWN0aW9ucyA9IHt9XG5cbiAgICAjIEFkZCBldmVudHNcbiAgICBfLmV4dGVuZCh0aGlzLCBCYWNrYm9uZS5FdmVudHMpXG5cbiAgYWRkQ29sbGVjdGlvbjogKG5hbWUpIC0+XG4gICAgY29sbGVjdGlvbiA9IG5ldyBIeWJyaWRDb2xsZWN0aW9uKG5hbWUsIEBsb2NhbERiW25hbWVdLCBAcmVtb3RlRGJbbmFtZV0pXG4gICAgQFtuYW1lXSA9IGNvbGxlY3Rpb25cbiAgICBAY29sbGVjdGlvbnNbbmFtZV0gPSBjb2xsZWN0aW9uXG5cbiAgICBjb2xsZWN0aW9uLm9uICdjaGFuZ2UnLCA9PlxuICAgICAgQHRyaWdnZXIgJ2NoYW5nZSdcblxuICByZW1vdmVDb2xsZWN0aW9uOiAobmFtZSkgLT5cbiAgICBkZWxldGUgQFtuYW1lXVxuICAgIGRlbGV0ZSBAY29sbGVjdGlvbnNbbmFtZV1cbiAgXG4gIHVwbG9hZDogKHN1Y2Nlc3MsIGVycm9yKSAtPlxuICAgIGNvbHMgPSBfLnZhbHVlcyhAY29sbGVjdGlvbnMpXG5cbiAgICB1cGxvYWRDb2xzID0gKGNvbHMsIHN1Y2Nlc3MsIGVycm9yKSA9PlxuICAgICAgY29sID0gXy5maXJzdChjb2xzKVxuICAgICAgaWYgY29sXG4gICAgICAgIGNvbC51cGxvYWQoKCkgPT5cbiAgICAgICAgICB1cGxvYWRDb2xzKF8ucmVzdChjb2xzKSwgc3VjY2VzcywgZXJyb3IpXG4gICAgICAgICwgKGVycikgPT5cbiAgICAgICAgICBlcnJvcihlcnIpKVxuICAgICAgZWxzZVxuICAgICAgICBzdWNjZXNzKClcbiAgICB1cGxvYWRDb2xzKGNvbHMsIHN1Y2Nlc3MsIGVycm9yKVxuXG5jbGFzcyBIeWJyaWRDb2xsZWN0aW9uXG4gIGNvbnN0cnVjdG9yOiAobmFtZSwgbG9jYWxDb2wsIHJlbW90ZUNvbCkgLT5cbiAgICBAbmFtZSA9IG5hbWVcbiAgICBAbG9jYWxDb2wgPSBsb2NhbENvbFxuICAgIEByZW1vdGVDb2wgPSByZW1vdGVDb2xcblxuICAgICMgQWRkIGV2ZW50c1xuICAgIF8uZXh0ZW5kKHRoaXMsIEJhY2tib25lLkV2ZW50cylcblxuICAjIG9wdGlvbnMubW9kZSBkZWZhdWx0cyB0byBcImh5YnJpZFwiLlxuICAjIEluIFwiaHlicmlkXCIsIGl0IHdpbGwgcmV0dXJuIGxvY2FsIHJlc3VsdHMsIHRoZW4gaGl0IHJlbW90ZSBhbmQgcmV0dXJuIGFnYWluIGlmIGRpZmZlcmVudFxuICAjIElmIHJlbW90ZSBnaXZlcyBlcnJvciwgaXQgd2lsbCBiZSBpZ25vcmVkXG4gICMgSW4gXCJyZW1vdGVcIiwgaXQgd2lsbCBjYWxsIHJlbW90ZSBhbmQgbm90IGNhY2hlLCBidXQgaW50ZWdyYXRlcyBsb2NhbCB1cHNlcnRzL2RlbGV0ZXNcbiAgIyBJZiByZW1vdGUgZ2l2ZXMgZXJyb3IsIHRoZW4gaXQgd2lsbCByZXR1cm4gbG9jYWwgcmVzdWx0c1xuICAjIEluIFwibG9jYWxcIiwganVzdCByZXR1cm5zIGxvY2FsIHJlc3VsdHNcbiAgZmluZDogKHNlbGVjdG9yLCBvcHRpb25zID0ge30pIC0+XG4gICAgcmV0dXJuIGZldGNoOiAoc3VjY2VzcywgZXJyb3IpID0+XG4gICAgICBAX2ZpbmRGZXRjaChzZWxlY3Rvciwgb3B0aW9ucywgc3VjY2VzcywgZXJyb3IpXG5cbiAgIyBvcHRpb25zLm1vZGUgZGVmYXVsdHMgdG8gXCJoeWJyaWRcIi5cbiAgIyBJbiBcImh5YnJpZFwiLCBpdCB3aWxsIHJldHVybiBsb2NhbCBpZiBwcmVzZW50LCBvdGhlcndpc2UgZmFsbCB0byByZW1vdGUgd2l0aG91dCByZXR1cm5pbmcgbnVsbFxuICAjIElmIHJlbW90ZSBnaXZlcyBlcnJvciwgdGhlbiBpdCB3aWxsIHJldHVybiBudWxsIGlmIG5vbmUgbG9jYWxseS4gSWYgcmVtb3RlIGFuZCBsb2NhbCBkaWZmZXIsIGl0XG4gICMgd2lsbCByZXR1cm4gdHdpY2VcbiAgIyBJbiBcImxvY2FsXCIsIGl0IHdpbGwgcmV0dXJuIGxvY2FsIGlmIHByZXNlbnQuIElmIG5vdCBwcmVzZW50LCBvbmx5IHRoZW4gd2lsbCBpdCBoaXQgcmVtb3RlLlxuICAjIElmIHJlbW90ZSBnaXZlcyBlcnJvciwgdGhlbiBpdCB3aWxsIHJldHVybiBudWxsXG4gICMgSW4gXCJyZW1vdGVcIi4uLiAobm90IGltcGxlbWVudGVkKVxuICBmaW5kT25lOiAoc2VsZWN0b3IsIG9wdGlvbnMgPSB7fSwgc3VjY2VzcywgZXJyb3IpIC0+XG4gICAgaWYgXy5pc0Z1bmN0aW9uKG9wdGlvbnMpIFxuICAgICAgW29wdGlvbnMsIHN1Y2Nlc3MsIGVycm9yXSA9IFt7fSwgb3B0aW9ucywgc3VjY2Vzc11cblxuICAgIG1vZGUgPSBvcHRpb25zLm1vZGUgfHwgXCJoeWJyaWRcIlxuXG4gICAgaWYgbW9kZSA9PSBcImh5YnJpZFwiIG9yIG1vZGUgPT0gXCJsb2NhbFwiXG4gICAgICBvcHRpb25zLmxpbWl0ID0gMVxuICAgICAgQGxvY2FsQ29sLmZpbmRPbmUgc2VsZWN0b3IsIG9wdGlvbnMsIChsb2NhbERvYykgPT5cbiAgICAgICAgIyBJZiBmb3VuZCwgcmV0dXJuXG4gICAgICAgIGlmIGxvY2FsRG9jXG4gICAgICAgICAgc3VjY2Vzcyhsb2NhbERvYylcbiAgICAgICAgICAjIE5vIG5lZWQgdG8gaGl0IHJlbW90ZSBpZiBsb2NhbFxuICAgICAgICAgIGlmIG1vZGUgPT0gXCJsb2NhbFwiXG4gICAgICAgICAgICByZXR1cm4gXG5cbiAgICAgICAgcmVtb3RlU3VjY2VzcyA9IChyZW1vdGVEb2MpID0+XG4gICAgICAgICAgIyBDYWNoZVxuICAgICAgICAgIGNhY2hlU3VjY2VzcyA9ID0+XG4gICAgICAgICAgICAjIFRyeSBxdWVyeSBhZ2FpblxuICAgICAgICAgICAgQGxvY2FsQ29sLmZpbmRPbmUgc2VsZWN0b3IsIG9wdGlvbnMsIChsb2NhbERvYzIpID0+XG4gICAgICAgICAgICAgIGlmIG5vdCBfLmlzRXF1YWwobG9jYWxEb2MsIGxvY2FsRG9jMilcbiAgICAgICAgICAgICAgICBzdWNjZXNzKGxvY2FsRG9jMilcbiAgICAgICAgICAgICAgZWxzZSBpZiBub3QgbG9jYWxEb2NcbiAgICAgICAgICAgICAgICBzdWNjZXNzKG51bGwpXG5cbiAgICAgICAgICBkb2NzID0gaWYgcmVtb3RlRG9jIHRoZW4gW3JlbW90ZURvY10gZWxzZSBbXVxuICAgICAgICAgIEBsb2NhbENvbC5jYWNoZShkb2NzLCBzZWxlY3Rvciwgb3B0aW9ucywgY2FjaGVTdWNjZXNzLCBlcnJvcilcblxuICAgICAgICByZW1vdGVFcnJvciA9ID0+XG4gICAgICAgICAgIyBSZW1vdGUgZXJyb3JlZCBvdXQuIFJldHVybiBudWxsIGlmIGxvY2FsIGRpZCBub3QgcmV0dXJuXG4gICAgICAgICAgaWYgbm90IGxvY2FsRG9jXG4gICAgICAgICAgICBzdWNjZXNzKG51bGwpXG5cbiAgICAgICAgIyBDYWxsIHJlbW90ZVxuICAgICAgICBAcmVtb3RlQ29sLmZpbmRPbmUgc2VsZWN0b3IsIF8ub21pdChvcHRpb25zLCAnZmllbGRzJyksIHJlbW90ZVN1Y2Nlc3MsIHJlbW90ZUVycm9yXG4gICAgICAsIGVycm9yXG4gICAgZWxzZSBcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlVua25vd24gbW9kZVwiKVxuXG4gIF9maW5kRmV0Y2g6IChzZWxlY3Rvciwgb3B0aW9ucywgc3VjY2VzcywgZXJyb3IpIC0+XG4gICAgbW9kZSA9IG9wdGlvbnMubW9kZSB8fCBcImh5YnJpZFwiXG5cbiAgICBpZiBtb2RlID09IFwiaHlicmlkXCJcbiAgICAgICMgR2V0IGxvY2FsIHJlc3VsdHNcbiAgICAgIGxvY2FsU3VjY2VzcyA9IChsb2NhbERhdGEpID0+XG4gICAgICAgICMgUmV0dXJuIGRhdGEgaW1tZWRpYXRlbHlcbiAgICAgICAgc3VjY2Vzcyhsb2NhbERhdGEpXG5cbiAgICAgICAgIyBHZXQgcmVtb3RlIGRhdGFcbiAgICAgICAgcmVtb3RlU3VjY2VzcyA9IChyZW1vdGVEYXRhKSA9PlxuICAgICAgICAgICMgQ2FjaGUgbG9jYWxseVxuICAgICAgICAgIGNhY2hlU3VjY2VzcyA9ICgpID0+XG4gICAgICAgICAgICAjIEdldCBsb2NhbCBkYXRhIGFnYWluXG4gICAgICAgICAgICBsb2NhbFN1Y2Nlc3MyID0gKGxvY2FsRGF0YTIpID0+XG4gICAgICAgICAgICAgICMgQ2hlY2sgaWYgZGlmZmVyZW50XG4gICAgICAgICAgICAgIGlmIG5vdCBfLmlzRXF1YWwobG9jYWxEYXRhLCBsb2NhbERhdGEyKVxuICAgICAgICAgICAgICAgICMgU2VuZCBhZ2FpblxuICAgICAgICAgICAgICAgIHN1Y2Nlc3MobG9jYWxEYXRhMilcbiAgICAgICAgICAgIEBsb2NhbENvbC5maW5kKHNlbGVjdG9yLCBvcHRpb25zKS5mZXRjaChsb2NhbFN1Y2Nlc3MyKVxuICAgICAgICAgIEBsb2NhbENvbC5jYWNoZShyZW1vdGVEYXRhLCBzZWxlY3Rvciwgb3B0aW9ucywgY2FjaGVTdWNjZXNzLCBlcnJvcilcbiAgICAgICAgQHJlbW90ZUNvbC5maW5kKHNlbGVjdG9yLCBfLm9taXQob3B0aW9ucywgXCJmaWVsZHNcIikpLmZldGNoKHJlbW90ZVN1Y2Nlc3MpXG5cbiAgICAgIEBsb2NhbENvbC5maW5kKHNlbGVjdG9yLCBvcHRpb25zKS5mZXRjaChsb2NhbFN1Y2Nlc3MsIGVycm9yKVxuICAgIGVsc2UgaWYgbW9kZSA9PSBcImxvY2FsXCJcbiAgICAgIEBsb2NhbENvbC5maW5kKHNlbGVjdG9yLCBvcHRpb25zKS5mZXRjaChzdWNjZXNzLCBlcnJvcilcbiAgICBlbHNlIGlmIG1vZGUgPT0gXCJyZW1vdGVcIlxuICAgICAgIyBHZXQgcmVtb3RlIHJlc3VsdHNcbiAgICAgIHJlbW90ZVN1Y2Nlc3MgPSAocmVtb3RlRGF0YSkgPT5cbiAgICAgICAgIyBSZW1vdmUgbG9jYWwgcmVtb3Rlc1xuICAgICAgICBkYXRhID0gcmVtb3RlRGF0YVxuXG4gICAgICAgIEBsb2NhbENvbC5wZW5kaW5nUmVtb3ZlcyAocmVtb3ZlcykgPT5cbiAgICAgICAgICBpZiByZW1vdmVzLmxlbmd0aCA+IDBcbiAgICAgICAgICAgIHJlbW92ZXNNYXAgPSBfLm9iamVjdChfLm1hcChyZW1vdmVzLCAoaWQpIC0+IFtpZCwgaWRdKSlcbiAgICAgICAgICAgIGRhdGEgPSBfLmZpbHRlciByZW1vdGVEYXRhLCAoZG9jKSAtPlxuICAgICAgICAgICAgICByZXR1cm4gbm90IF8uaGFzKHJlbW92ZXNNYXAsIGRvYy5faWQpXG5cbiAgICAgICAgICAjIEFkZCB1cHNlcnRzXG4gICAgICAgICAgQGxvY2FsQ29sLnBlbmRpbmdVcHNlcnRzICh1cHNlcnRzKSA9PlxuICAgICAgICAgICAgaWYgdXBzZXJ0cy5sZW5ndGggPiAwXG4gICAgICAgICAgICAgICMgUmVtb3ZlIHVwc2VydHMgZnJvbSBkYXRhXG4gICAgICAgICAgICAgIHVwc2VydHNNYXAgPSBfLm9iamVjdChfLnBsdWNrKHVwc2VydHMsICdfaWQnKSwgXy5wbHVjayh1cHNlcnRzLCAnX2lkJykpXG4gICAgICAgICAgICAgIGRhdGEgPSBfLmZpbHRlciBkYXRhLCAoZG9jKSAtPlxuICAgICAgICAgICAgICAgIHJldHVybiBub3QgXy5oYXModXBzZXJ0c01hcCwgZG9jLl9pZClcblxuICAgICAgICAgICAgICAjIEFkZCB1cHNlcnRzXG4gICAgICAgICAgICAgIGRhdGEgPSBkYXRhLmNvbmNhdCh1cHNlcnRzKVxuXG4gICAgICAgICAgICAgICMgUmVmaWx0ZXIvc29ydC9saW1pdFxuICAgICAgICAgICAgICBkYXRhID0gcHJvY2Vzc0ZpbmQoZGF0YSwgc2VsZWN0b3IsIG9wdGlvbnMpXG5cbiAgICAgICAgICAgIHN1Y2Nlc3MoZGF0YSlcblxuICAgICAgcmVtb3RlRXJyb3IgPSA9PlxuICAgICAgICAjIENhbGwgbG9jYWxcbiAgICAgICAgQGxvY2FsQ29sLmZpbmQoc2VsZWN0b3IsIG9wdGlvbnMpLmZldGNoKHN1Y2Nlc3MsIGVycm9yKVxuXG4gICAgICBAcmVtb3RlQ29sLmZpbmQoc2VsZWN0b3IsIG9wdGlvbnMpLmZldGNoKHJlbW90ZVN1Y2Nlc3MsIHJlbW90ZUVycm9yKVxuICAgIGVsc2VcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlVua25vd24gbW9kZVwiKVxuXG4gIHVwc2VydDogKGRvYywgc3VjY2VzcywgZXJyb3IpIC0+XG4gICAgQGxvY2FsQ29sLnVwc2VydChkb2MsIChyZXN1bHQpID0+XG4gICAgICBAdHJpZ2dlciAnY2hhbmdlJ1xuICAgICAgc3VjY2VzcyhyZXN1bHQpIGlmIHN1Y2Nlc3M/XG4gICAgLCBlcnJvcilcblxuICByZW1vdmU6IChpZCwgc3VjY2VzcywgZXJyb3IpIC0+XG4gICAgQGxvY2FsQ29sLnJlbW92ZShpZCwgKCkgPT5cbiAgICAgIEB0cmlnZ2VyICdjaGFuZ2UnXG4gICAgICBzdWNjZXNzKCkgaWYgc3VjY2Vzcz9cbiAgICAsIGVycm9yKSAgXG5cbiAgdXBsb2FkOiAoc3VjY2VzcywgZXJyb3IpIC0+XG4gICAgdXBsb2FkVXBzZXJ0cyA9ICh1cHNlcnRzLCBzdWNjZXNzLCBlcnJvcikgPT5cbiAgICAgIHVwc2VydCA9IF8uZmlyc3QodXBzZXJ0cylcbiAgICAgIGlmIHVwc2VydFxuICAgICAgICBAcmVtb3RlQ29sLnVwc2VydCh1cHNlcnQsICgpID0+XG4gICAgICAgICAgQGxvY2FsQ29sLnJlc29sdmVVcHNlcnQgdXBzZXJ0LCA9PlxuICAgICAgICAgICAgdXBsb2FkVXBzZXJ0cyhfLnJlc3QodXBzZXJ0cyksIHN1Y2Nlc3MsIGVycm9yKVxuICAgICAgICAsIChlcnIpID0+XG4gICAgICAgICAgZXJyb3IoZXJyKSlcbiAgICAgIGVsc2UgXG4gICAgICAgIHN1Y2Nlc3MoKVxuICAgIEBsb2NhbENvbC5wZW5kaW5nVXBzZXJ0cyAodXBzZXJ0cykgPT5cbiAgICAgIHVwbG9hZFVwc2VydHModXBzZXJ0cywgc3VjY2VzcywgZXJyb3IpXG4iLCJleHBvcnRzLlNlY3Rpb25zID0gQmFja2JvbmUuVmlldy5leHRlbmQoe1xuICAgIGNsYXNzTmFtZSA6IFwic3VydmV5XCIsXG5cbiAgICBpbml0aWFsaXplIDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMudGl0bGUgPSB0aGlzLm9wdGlvbnMudGl0bGU7XG4gICAgICAgIHRoaXMuc2VjdGlvbnMgPSB0aGlzLm9wdGlvbnMuc2VjdGlvbnM7XG4gICAgICAgIHRoaXMucmVuZGVyKCk7XG5cbiAgICAgICAgLy8gQWRqdXN0IG5leHQvcHJldiBiYXNlZCBvbiBtb2RlbFxuICAgICAgICB0aGlzLm1vZGVsLm9uKFwiY2hhbmdlXCIsIHRoaXMucmVuZGVyTmV4dFByZXYsIHRoaXMpO1xuXG4gICAgICAgIC8vIEdvIHRvIGFwcHJvcHJpYXRlIHNlY3Rpb24gVE9ET1xuICAgICAgICB0aGlzLnNob3dTZWN0aW9uKDApO1xuICAgIH0sXG5cbiAgICBldmVudHMgOiB7XG4gICAgICAgIFwiY2xpY2sgI2Nsb3NlXCIgOiBcImNsb3NlXCIsXG4gICAgICAgIFwiY2xpY2sgLm5leHRcIiA6IFwibmV4dFNlY3Rpb25cIixcbiAgICAgICAgXCJjbGljayAucHJldlwiIDogXCJwcmV2U2VjdGlvblwiLFxuICAgICAgICBcImNsaWNrIC5maW5pc2hcIiA6IFwiZmluaXNoXCIsXG4gICAgICAgIFwiY2xpY2sgYS5zZWN0aW9uLWNydW1iXCIgOiBcImNydW1iU2VjdGlvblwiXG4gICAgfSxcblxuICAgIGZpbmlzaCA6IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBWYWxpZGF0ZSBjdXJyZW50IHNlY3Rpb25cbiAgICAgICAgdmFyIHNlY3Rpb24gPSB0aGlzLnNlY3Rpb25zW3RoaXMuc2VjdGlvbl07XG4gICAgICAgIGlmIChzZWN0aW9uLnZhbGlkYXRlKCkpIHtcbiAgICAgICAgICAgIHRoaXMudHJpZ2dlcignY29tcGxldGUnKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBjbG9zZSA6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnRyaWdnZXIoJ2Nsb3NlJyk7XG4gICAgfSxcblxuICAgIGNydW1iU2VjdGlvbiA6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgLy8gR28gdG8gc2VjdGlvblxuICAgICAgICB2YXIgaW5kZXggPSBwYXJzZUludChlLnRhcmdldC5nZXRBdHRyaWJ1dGUoXCJkYXRhLXZhbHVlXCIpKTtcbiAgICAgICAgdGhpcy5zaG93U2VjdGlvbihpbmRleCk7XG4gICAgfSxcblxuICAgIGdldE5leHRTZWN0aW9uSW5kZXggOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGkgPSB0aGlzLnNlY3Rpb24gKyAxO1xuICAgICAgICB3aGlsZSAoaSA8IHRoaXMuc2VjdGlvbnMubGVuZ3RoKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5zZWN0aW9uc1tpXS5zaG91bGRCZVZpc2libGUoKSlcbiAgICAgICAgICAgICAgICByZXR1cm4gaTtcbiAgICAgICAgICAgIGkrKztcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBnZXRQcmV2U2VjdGlvbkluZGV4IDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBpID0gdGhpcy5zZWN0aW9uIC0gMTtcbiAgICAgICAgd2hpbGUgKGkgPj0gMCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuc2VjdGlvbnNbaV0uc2hvdWxkQmVWaXNpYmxlKCkpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGk7XG4gICAgICAgICAgICBpLS07XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgbmV4dFNlY3Rpb24gOiBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gVmFsaWRhdGUgY3VycmVudCBzZWN0aW9uXG4gICAgICAgIHZhciBzZWN0aW9uID0gdGhpcy5zZWN0aW9uc1t0aGlzLnNlY3Rpb25dO1xuICAgICAgICBpZiAoc2VjdGlvbi52YWxpZGF0ZSgpKSB7XG4gICAgICAgICAgICB0aGlzLnNob3dTZWN0aW9uKHRoaXMuZ2V0TmV4dFNlY3Rpb25JbmRleCgpKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBwcmV2U2VjdGlvbiA6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnNob3dTZWN0aW9uKHRoaXMuZ2V0UHJldlNlY3Rpb25JbmRleCgpKTtcbiAgICB9LFxuXG4gICAgc2hvd1NlY3Rpb24gOiBmdW5jdGlvbihpbmRleCkge1xuICAgICAgICB0aGlzLnNlY3Rpb24gPSBpbmRleDtcblxuICAgICAgICBfLmVhY2godGhpcy5zZWN0aW9ucywgZnVuY3Rpb24ocykge1xuICAgICAgICAgICAgcy4kZWwuaGlkZSgpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5zZWN0aW9uc1tpbmRleF0uJGVsLnNob3coKTtcblxuICAgICAgICAvLyBTZXR1cCBicmVhZGNydW1ic1xuICAgICAgICB2YXIgdmlzaWJsZVNlY3Rpb25zID0gXy5maWx0ZXIoXy5maXJzdCh0aGlzLnNlY3Rpb25zLCBpbmRleCArIDEpLCBmdW5jdGlvbihzKSB7XG4gICAgICAgICAgICByZXR1cm4gcy5zaG91bGRCZVZpc2libGUoKVxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy4kKFwiLmJyZWFkY3J1bWJcIikuaHRtbCh0ZW1wbGF0ZXNbJ2Zvcm1zL1NlY3Rpb25zX2JyZWFkY3J1bWJzJ10oe1xuICAgICAgICAgICAgc2VjdGlvbnMgOiBfLmluaXRpYWwodmlzaWJsZVNlY3Rpb25zKSxcbiAgICAgICAgICAgIGxhc3RTZWN0aW9uOiBfLmxhc3QodmlzaWJsZVNlY3Rpb25zKVxuICAgICAgICB9KSk7XG4gICAgICAgIFxuICAgICAgICB0aGlzLnJlbmRlck5leHRQcmV2KCk7XG5cbiAgICAgICAgLy8gU2Nyb2xsIGludG8gdmlld1xuICAgICAgICB0aGlzLiRlbC5zY3JvbGxpbnRvdmlldygpO1xuICAgIH0sXG4gICAgXG4gICAgcmVuZGVyTmV4dFByZXYgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gU2V0dXAgbmV4dC9wcmV2IGJ1dHRvbnNcbiAgICAgICAgdGhpcy4kKFwiLnByZXZcIikudG9nZ2xlKHRoaXMuZ2V0UHJldlNlY3Rpb25JbmRleCgpICE9PSB1bmRlZmluZWQpO1xuICAgICAgICB0aGlzLiQoXCIubmV4dFwiKS50b2dnbGUodGhpcy5nZXROZXh0U2VjdGlvbkluZGV4KCkgIT09IHVuZGVmaW5lZCk7XG4gICAgICAgIHRoaXMuJChcIi5maW5pc2hcIikudG9nZ2xlKHRoaXMuZ2V0TmV4dFNlY3Rpb25JbmRleCgpID09PSB1bmRlZmluZWQpO1xuICAgIH0sXG5cbiAgICByZW5kZXIgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy4kZWwuaHRtbCh0ZW1wbGF0ZXNbJ2Zvcm1zL1NlY3Rpb25zJ10oKSk7XG5cbiAgICAgICAgLy8gQWRkIHNlY3Rpb25zXG4gICAgICAgIHZhciBzZWN0aW9uc0VsID0gdGhpcy4kKFwiLnNlY3Rpb25zXCIpO1xuICAgICAgICBfLmVhY2godGhpcy5zZWN0aW9ucywgZnVuY3Rpb24ocykge1xuICAgICAgICAgICAgc2VjdGlvbnNFbC5hcHBlbmQocy4kZWwpO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbn0pO1xuXG5leHBvcnRzLlNlY3Rpb24gPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCh7XG4gICAgY2xhc3NOYW1lIDogXCJzZWN0aW9uXCIsXG4gICAgdGVtcGxhdGUgOiBfLnRlbXBsYXRlKCc8ZGl2IGNsYXNzPVwiY29udGVudHNcIj48L2Rpdj4nKSxcblxuICAgIGluaXRpYWxpemUgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy50aXRsZSA9IHRoaXMub3B0aW9ucy50aXRsZTtcbiAgICAgICAgdGhpcy5jb250ZW50cyA9IHRoaXMub3B0aW9ucy5jb250ZW50cztcblxuICAgICAgICAvLyBBbHdheXMgaW52aXNpYmxlIGluaXRpYWxseVxuICAgICAgICB0aGlzLiRlbC5oaWRlKCk7XG4gICAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgfSxcblxuICAgIHNob3VsZEJlVmlzaWJsZSA6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoIXRoaXMub3B0aW9ucy5jb25kaXRpb25hbClcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25zLmNvbmRpdGlvbmFsKHRoaXMubW9kZWwpO1xuICAgIH0sXG5cbiAgICB2YWxpZGF0ZSA6IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBHZXQgYWxsIHZpc2libGUgaXRlbXNcbiAgICAgICAgdmFyIGl0ZW1zID0gXy5maWx0ZXIodGhpcy5jb250ZW50cywgZnVuY3Rpb24oYykge1xuICAgICAgICAgICAgcmV0dXJuIGMudmlzaWJsZSAmJiBjLnZhbGlkYXRlO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuICFfLmFueShfLm1hcChpdGVtcywgZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICAgICAgcmV0dXJuIGl0ZW0udmFsaWRhdGUoKTtcbiAgICAgICAgfSkpO1xuICAgIH0sXG5cbiAgICByZW5kZXIgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy4kZWwuaHRtbCh0aGlzLnRlbXBsYXRlKHRoaXMpKTtcblxuICAgICAgICAvLyBBZGQgY29udGVudHMgKHF1ZXN0aW9ucywgbW9zdGx5KVxuICAgICAgICB2YXIgY29udGVudHNFbCA9IHRoaXMuJChcIi5jb250ZW50c1wiKTtcbiAgICAgICAgXy5lYWNoKHRoaXMuY29udGVudHMsIGZ1bmN0aW9uKGMpIHtcbiAgICAgICAgICAgIGNvbnRlbnRzRWwuYXBwZW5kKGMuJGVsKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG59KTtcblxuZXhwb3J0cy5RdWVzdGlvbiA9IEJhY2tib25lLlZpZXcuZXh0ZW5kKHtcbiAgICBjbGFzc05hbWUgOiBcInF1ZXN0aW9uXCIsXG5cbiAgICB0ZW1wbGF0ZSA6IF8udGVtcGxhdGUoJzwlIGlmIChvcHRpb25zLnByb21wdCkgeyAlPjxkaXYgY2xhc3M9XCJwcm9tcHRcIj48JT1vcHRpb25zLnByb21wdCU+PCU9cmVuZGVyUmVxdWlyZWQoKSU+PC9kaXY+PCUgfSAlPjxkaXYgY2xhc3M9XCJhbnN3ZXJcIj48L2Rpdj48JT1yZW5kZXJIaW50KCklPicpLFxuXG4gICAgcmVuZGVyUmVxdWlyZWQgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMucmVxdWlyZWQpXG4gICAgICAgICAgICByZXR1cm4gJyZuYnNwOzxzcGFuIGNsYXNzPVwicmVxdWlyZWRcIj4qPC9zcGFuPic7XG4gICAgICAgIHJldHVybiAnJztcbiAgICB9LFxuXG4gICAgcmVuZGVySGludDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuaGludClcbiAgICAgICAgICAgIHJldHVybiBfLnRlbXBsYXRlKCc8ZGl2IGNsYXNzPVwibXV0ZWRcIj48JT1oaW50JT48L2Rpdj4nKSh7aGludDogdGhpcy5vcHRpb25zLmhpbnR9KTtcbiAgICB9LFxuXG4gICAgdmFsaWRhdGUgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHZhbDtcblxuICAgICAgICAvLyBDaGVjayByZXF1aXJlZFxuICAgICAgICBpZiAodGhpcy5yZXF1aXJlZCkge1xuICAgICAgICAgICAgaWYgKHRoaXMubW9kZWwuZ2V0KHRoaXMuaWQpID09PSB1bmRlZmluZWQgfHwgdGhpcy5tb2RlbC5nZXQodGhpcy5pZCkgPT09IG51bGwgfHwgdGhpcy5tb2RlbC5nZXQodGhpcy5pZCkgPT09IFwiXCIpXG4gICAgICAgICAgICAgICAgdmFsID0gXCJSZXF1aXJlZFwiO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2hlY2sgaW50ZXJuYWwgdmFsaWRhdGlvblxuICAgICAgICBpZiAoIXZhbCAmJiB0aGlzLnZhbGlkYXRlSW50ZXJuYWwpIHtcbiAgICAgICAgICAgIHZhbCA9IHRoaXMudmFsaWRhdGVJbnRlcm5hbCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2hlY2sgY3VzdG9tIHZhbGlkYXRpb25cbiAgICAgICAgaWYgKCF2YWwgJiYgdGhpcy5vcHRpb25zLnZhbGlkYXRlKSB7XG4gICAgICAgICAgICB2YWwgPSB0aGlzLm9wdGlvbnMudmFsaWRhdGUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFNob3cgdmFsaWRhdGlvbiByZXN1bHRzIFRPRE9cbiAgICAgICAgaWYgKHZhbCkge1xuICAgICAgICAgICAgdGhpcy4kZWwuYWRkQ2xhc3MoXCJpbnZhbGlkXCIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy4kZWwucmVtb3ZlQ2xhc3MoXCJpbnZhbGlkXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHZhbDtcbiAgICB9LFxuXG4gICAgdXBkYXRlVmlzaWJpbGl0eSA6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgLy8gc2xpZGVVcC9zbGlkZURvd25cbiAgICAgICAgaWYgKHRoaXMuc2hvdWxkQmVWaXNpYmxlKCkgJiYgIXRoaXMudmlzaWJsZSlcbiAgICAgICAgICAgIHRoaXMuJGVsLnNsaWRlRG93bigpO1xuICAgICAgICBpZiAoIXRoaXMuc2hvdWxkQmVWaXNpYmxlKCkgJiYgdGhpcy52aXNpYmxlKVxuICAgICAgICAgICAgdGhpcy4kZWwuc2xpZGVVcCgpO1xuICAgICAgICB0aGlzLnZpc2libGUgPSB0aGlzLnNob3VsZEJlVmlzaWJsZSgpO1xuICAgIH0sXG5cbiAgICBzaG91bGRCZVZpc2libGUgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKCF0aGlzLm9wdGlvbnMuY29uZGl0aW9uYWwpXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy5jb25kaXRpb25hbCh0aGlzLm1vZGVsKTtcbiAgICB9LFxuXG4gICAgaW5pdGlhbGl6ZSA6IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBBZGp1c3QgdmlzaWJpbGl0eSBiYXNlZCBvbiBtb2RlbFxuICAgICAgICB0aGlzLm1vZGVsLm9uKFwiY2hhbmdlXCIsIHRoaXMudXBkYXRlVmlzaWJpbGl0eSwgdGhpcyk7XG5cbiAgICAgICAgLy8gUmUtcmVuZGVyIGJhc2VkIG9uIG1vZGVsIGNoYW5nZXNcbiAgICAgICAgdGhpcy5tb2RlbC5vbihcImNoYW5nZTpcIiArIHRoaXMuaWQsIHRoaXMucmVuZGVyLCB0aGlzKTtcblxuICAgICAgICB0aGlzLnJlcXVpcmVkID0gdGhpcy5vcHRpb25zLnJlcXVpcmVkO1xuXG4gICAgICAgIC8vIFNhdmUgY29udGV4dFxuICAgICAgICB0aGlzLmN0eCA9IHRoaXMub3B0aW9ucy5jdHggfHwge307XG5cbiAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICB9LFxuXG4gICAgcmVuZGVyIDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuJGVsLmh0bWwodGhpcy50ZW1wbGF0ZSh0aGlzKSk7XG5cbiAgICAgICAgLy8gUmVuZGVyIGFuc3dlclxuICAgICAgICB0aGlzLnJlbmRlckFuc3dlcih0aGlzLiQoXCIuYW5zd2VyXCIpKTtcblxuICAgICAgICB0aGlzLiRlbC50b2dnbGUodGhpcy5zaG91bGRCZVZpc2libGUoKSk7XG4gICAgICAgIHRoaXMudmlzaWJsZSA9IHRoaXMuc2hvdWxkQmVWaXNpYmxlKCk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxufSk7XG5cbmV4cG9ydHMuUmFkaW9RdWVzdGlvbiA9IGV4cG9ydHMuUXVlc3Rpb24uZXh0ZW5kKHtcbiAgICBldmVudHMgOiB7XG4gICAgICAgIFwiY2hlY2tlZFwiIDogXCJjaGVja2VkXCIsXG4gICAgfSxcblxuICAgIGNoZWNrZWQgOiBmdW5jdGlvbihlKSB7XG4gICAgICAgIHZhciBpbmRleCA9IHBhcnNlSW50KGUudGFyZ2V0LmdldEF0dHJpYnV0ZShcImRhdGEtdmFsdWVcIikpO1xuICAgICAgICB2YXIgdmFsdWUgPSB0aGlzLm9wdGlvbnMub3B0aW9uc1tpbmRleF1bMF07XG4gICAgICAgIHRoaXMubW9kZWwuc2V0KHRoaXMuaWQsIHZhbHVlKTtcbiAgICB9LFxuXG4gICAgcmVuZGVyQW5zd2VyIDogZnVuY3Rpb24oYW5zd2VyRWwpIHtcbiAgICAgICAgYW5zd2VyRWwuaHRtbChfLnRlbXBsYXRlKCc8ZGl2IGNsYXNzPVwicmFkaW8tZ3JvdXBcIj48JT1yZW5kZXJSYWRpb09wdGlvbnMoKSU+PC9kaXY+JywgdGhpcykpO1xuICAgICAgICBpZiAodGhpcy5vcHRpb25zLnJlYWRvbmx5KVxuICAgICAgICAgICAgYW5zd2VyRWwuZmluZChcIi5yYWRpby1ncm91cFwiKS5hZGRDbGFzcyhcInJlYWRvbmx5XCIpO1xuICAgIH0sXG5cbiAgICByZW5kZXJSYWRpb09wdGlvbnMgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaHRtbCA9IFwiXCI7XG4gICAgICAgIHZhciBpO1xuICAgICAgICBmb3IgKCBpID0gMDsgaSA8IHRoaXMub3B0aW9ucy5vcHRpb25zLmxlbmd0aDsgaSsrKVxuICAgICAgICAgICAgaHRtbCArPSBfLnRlbXBsYXRlKCc8ZGl2IGNsYXNzPVwicmFkaW8tYnV0dG9uIDwlPWNoZWNrZWQlPlwiIGRhdGEtdmFsdWU9XCI8JT1wb3NpdGlvbiU+XCI+PCU9dGV4dCU+PC9kaXY+Jywge1xuICAgICAgICAgICAgICAgIHBvc2l0aW9uIDogaSxcbiAgICAgICAgICAgICAgICB0ZXh0IDogdGhpcy5vcHRpb25zLm9wdGlvbnNbaV1bMV0sXG4gICAgICAgICAgICAgICAgY2hlY2tlZCA6IHRoaXMubW9kZWwuZ2V0KHRoaXMuaWQpID09PSB0aGlzLm9wdGlvbnMub3B0aW9uc1tpXVswXSA/IFwiY2hlY2tlZFwiIDogXCJcIlxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIGh0bWw7XG4gICAgfVxuXG59KTtcblxuZXhwb3J0cy5DaGVja1F1ZXN0aW9uID0gZXhwb3J0cy5RdWVzdGlvbi5leHRlbmQoe1xuICAgIGV2ZW50cyA6IHtcbiAgICAgICAgXCJjaGVja2VkXCIgOiBcImNoZWNrZWRcIixcbiAgICB9LFxuXG4gICAgY2hlY2tlZCA6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgLy8gR2V0IGNoZWNrZWRcbiAgICAgICAgdGhpcy5tb2RlbC5zZXQodGhpcy5pZCwgdGhpcy4kKFwiLmNoZWNrYm94XCIpLmhhc0NsYXNzKFwiY2hlY2tlZFwiKSk7XG4gICAgfSxcblxuICAgIHJlbmRlckFuc3dlciA6IGZ1bmN0aW9uKGFuc3dlckVsKSB7XG4gICAgICAgIHZhciBpO1xuICAgICAgICBhbnN3ZXJFbC5hcHBlbmQoJChfLnRlbXBsYXRlKCc8ZGl2IGNsYXNzPVwiY2hlY2tib3ggPCU9Y2hlY2tlZCU+XCI+PCU9dGV4dCU+PC9kaXY+Jywge1xuICAgICAgICAgICAgdGV4dCA6IHRoaXMub3B0aW9ucy50ZXh0LFxuICAgICAgICAgICAgY2hlY2tlZCA6ICh0aGlzLm1vZGVsLmdldCh0aGlzLmlkKSkgPyBcImNoZWNrZWRcIiA6IFwiXCJcbiAgICAgICAgfSkpKTtcbiAgICB9XG5cbn0pO1xuXG5cbmV4cG9ydHMuTXVsdGljaGVja1F1ZXN0aW9uID0gZXhwb3J0cy5RdWVzdGlvbi5leHRlbmQoe1xuICAgIGV2ZW50cyA6IHtcbiAgICAgICAgXCJjaGVja2VkXCIgOiBcImNoZWNrZWRcIixcbiAgICB9LFxuXG4gICAgY2hlY2tlZCA6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgLy8gR2V0IGFsbCBjaGVja2VkXG4gICAgICAgIHZhciB2YWx1ZSA9IFtdO1xuICAgICAgICB2YXIgb3B0cyA9IHRoaXMub3B0aW9ucy5vcHRpb25zO1xuICAgICAgICB0aGlzLiQoXCIuY2hlY2tib3hcIikuZWFjaChmdW5jdGlvbihpbmRleCkge1xuICAgICAgICAgICAgaWYgKCQodGhpcykuaGFzQ2xhc3MoXCJjaGVja2VkXCIpKVxuICAgICAgICAgICAgICAgIHZhbHVlLnB1c2gob3B0c1tpbmRleF1bMF0pO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5tb2RlbC5zZXQodGhpcy5pZCwgdmFsdWUpO1xuICAgIH0sXG5cbiAgICByZW5kZXJBbnN3ZXIgOiBmdW5jdGlvbihhbnN3ZXJFbCkge1xuICAgICAgICB2YXIgaTtcbiAgICAgICAgZm9yICggaSA9IDA7IGkgPCB0aGlzLm9wdGlvbnMub3B0aW9ucy5sZW5ndGg7IGkrKylcbiAgICAgICAgICAgIGFuc3dlckVsLmFwcGVuZCgkKF8udGVtcGxhdGUoJzxkaXYgY2xhc3M9XCJjaGVja2JveCA8JT1jaGVja2VkJT5cIiBkYXRhLXZhbHVlPVwiPCU9cG9zaXRpb24lPlwiPjwlPXRleHQlPjwvZGl2PicsIHtcbiAgICAgICAgICAgICAgICBwb3NpdGlvbiA6IGksXG4gICAgICAgICAgICAgICAgdGV4dCA6IHRoaXMub3B0aW9ucy5vcHRpb25zW2ldWzFdLFxuICAgICAgICAgICAgICAgIGNoZWNrZWQgOiAodGhpcy5tb2RlbC5nZXQodGhpcy5pZCkgJiYgXy5jb250YWlucyh0aGlzLm1vZGVsLmdldCh0aGlzLmlkKSwgdGhpcy5vcHRpb25zLm9wdGlvbnNbaV1bMF0pKSA/IFwiY2hlY2tlZFwiIDogXCJcIlxuICAgICAgICAgICAgfSkpKTtcbiAgICB9XG5cbn0pO1xuXG5leHBvcnRzLlRleHRRdWVzdGlvbiA9IGV4cG9ydHMuUXVlc3Rpb24uZXh0ZW5kKHtcbiAgICByZW5kZXJBbnN3ZXIgOiBmdW5jdGlvbihhbnN3ZXJFbCkge1xuICAgICAgICBpZiAodGhpcy5vcHRpb25zLm11bHRpbGluZSkge1xuICAgICAgICAgICAgYW5zd2VyRWwuaHRtbChfLnRlbXBsYXRlKCc8dGV4dGFyZWEgc3R5bGU9XCJ3aWR0aDo5MCVcIi8+JywgdGhpcykpOyAvLyBUT0RPIG1ha2Ugd2lkdGggcHJvcGVybHlcbiAgICAgICAgICAgIGFuc3dlckVsLmZpbmQoXCJ0ZXh0YXJlYVwiKS52YWwodGhpcy5tb2RlbC5nZXQodGhpcy5pZCkpO1xuICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5yZWFkb25seSlcbiAgICAgICAgICAgICAgICBhbnN3ZXJFbC5maW5kKFwidGV4dGFyZWFcIikuYXR0cihcInJlYWRvbmx5XCIsIFwicmVhZG9ubHlcIik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhbnN3ZXJFbC5odG1sKF8udGVtcGxhdGUoJzxpbnB1dCB0eXBlPVwidGV4dFwiLz4nLCB0aGlzKSk7XG4gICAgICAgICAgICBhbnN3ZXJFbC5maW5kKFwiaW5wdXRcIikudmFsKHRoaXMubW9kZWwuZ2V0KHRoaXMuaWQpKTtcbiAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMucmVhZG9ubHkpXG4gICAgICAgICAgICAgICAgYW5zd2VyRWwuZmluZChcImlucHV0XCIpLmF0dHIoXCJyZWFkb25seVwiLCBcInJlYWRvbmx5XCIpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGV2ZW50cyA6IHtcbiAgICAgICAgXCJjaGFuZ2VcIiA6IFwiY2hhbmdlZFwiXG4gICAgfSxcbiAgICBjaGFuZ2VkIDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMubW9kZWwuc2V0KHRoaXMuaWQsIHRoaXMuJCh0aGlzLm9wdGlvbnMubXVsdGlsaW5lID8gXCJ0ZXh0YXJlYVwiIDogXCJpbnB1dFwiKS52YWwoKSk7XG4gICAgfVxuXG59KTtcbiIsIiMgR3JvdXAgb2YgcXVlc3Rpb25zIHdoaWNoIHZhbGlkYXRlIGFzIGEgdW5pdFxuXG5tb2R1bGUuZXhwb3J0cyA9IEJhY2tib25lLlZpZXcuZXh0ZW5kXG4gIGluaXRpYWxpemU6IC0+XG4gICAgQGNvbnRlbnRzID0gQG9wdGlvbnMuY29udGVudHNcbiAgICBAcmVuZGVyKClcblxuICB2YWxpZGF0ZTogLT5cbiAgICAjIEdldCBhbGwgdmlzaWJsZSBpdGVtc1xuICAgIGl0ZW1zID0gXy5maWx0ZXIoQGNvbnRlbnRzLCAoYykgLT5cbiAgICAgIGMudmlzaWJsZSBhbmQgYy52YWxpZGF0ZVxuICAgIClcbiAgICByZXR1cm4gbm90IF8uYW55KF8ubWFwKGl0ZW1zLCAoaXRlbSkgLT5cbiAgICAgIGl0ZW0udmFsaWRhdGUoKVxuICAgICkpXG5cbiAgcmVuZGVyOiAtPlxuICAgIEAkZWwuaHRtbCBcIlwiXG4gICAgXG4gICAgIyBBZGQgY29udGVudHMgKHF1ZXN0aW9ucywgbW9zdGx5KVxuICAgIF8uZWFjaCBAY29udGVudHMsIChjKSA9PiBAJGVsLmFwcGVuZCBjLiRlbFxuXG4gICAgdGhpc1xuIiwiIyBGb3JtIHRoYXQgaGFzIHNhdmUgYW5kIGNhbmNlbCBidXR0b25zIHRoYXQgZmlyZSBzYXZlIGFuZCBjYW5jZWwgZXZlbnRzLlxuIyBTYXZlIGV2ZW50IHdpbGwgb25seSBiZSBmaXJlZCBpZiB2YWxpZGF0ZXNcblxubW9kdWxlLmV4cG9ydHMgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZFxuICBpbml0aWFsaXplOiAtPlxuICAgIEBjb250ZW50cyA9IEBvcHRpb25zLmNvbnRlbnRzXG4gICAgQHJlbmRlcigpXG5cbiAgZXZlbnRzOiBcbiAgICAnY2xpY2sgI3NhdmVfYnV0dG9uJzogJ3NhdmUnXG4gICAgJ2NsaWNrICNjYW5jZWxfYnV0dG9uJzogJ2NhbmNlbCdcblxuICB2YWxpZGF0ZTogLT5cbiAgICAjIEdldCBhbGwgdmlzaWJsZSBpdGVtc1xuICAgIGl0ZW1zID0gXy5maWx0ZXIoQGNvbnRlbnRzLCAoYykgLT5cbiAgICAgIGMudmlzaWJsZSBhbmQgYy52YWxpZGF0ZVxuICAgIClcbiAgICByZXR1cm4gbm90IF8uYW55KF8ubWFwKGl0ZW1zLCAoaXRlbSkgLT5cbiAgICAgIGl0ZW0udmFsaWRhdGUoKVxuICAgICkpXG5cbiAgcmVuZGVyOiAtPlxuICAgIEAkZWwuaHRtbCAnJyc8ZGl2IGlkPVwiY29udGVudHNcIj48L2Rpdj5cbiAgICA8ZGl2PlxuICAgICAgICA8YnV0dG9uIGlkPVwic2F2ZV9idXR0b25cIiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJidG4gYnRuLXByaW1hcnkgbWFyZ2luZWRcIj5TYXZlPC9idXR0b24+XG4gICAgICAgICZuYnNwO1xuICAgICAgICA8YnV0dG9uIGlkPVwiY2FuY2VsX2J1dHRvblwiIHR5cGU9XCJidXR0b25cIiBjbGFzcz1cImJ0biBtYXJnaW5lZFwiPkNhbmNlbDwvYnV0dG9uPlxuICAgIDwvZGl2PicnJ1xuICAgIFxuICAgICMgQWRkIGNvbnRlbnRzIChxdWVzdGlvbnMsIG1vc3RseSlcbiAgICBfLmVhY2ggQGNvbnRlbnRzLCAoYykgPT4gQCQoJyNjb250ZW50cycpLmFwcGVuZCBjLiRlbFxuICAgIHRoaXNcblxuICBzYXZlOiAtPlxuICAgIGlmIEB2YWxpZGF0ZSgpXG4gICAgICBAdHJpZ2dlciAnc2F2ZSdcblxuICBjYW5jZWw6IC0+XG4gICAgQHRyaWdnZXIgJ2NhbmNlbCdcbiIsIm1vZHVsZS5leHBvcnRzID0gQmFja2JvbmUuVmlldy5leHRlbmRcbiAgaW5pdGlhbGl6ZTogLT5cbiAgICBAJGVsLmh0bWwgXy50ZW1wbGF0ZSgnJydcbiAgICAgIDxkaXYgY2xhc3M9XCJ3ZWxsIHdlbGwtc21hbGxcIj48JT1odG1sJT48JS10ZXh0JT48L2Rpdj5cbiAgICAgICcnJykoaHRtbDogQG9wdGlvbnMuaHRtbCwgdGV4dDogQG9wdGlvbnMudGV4dClcbiIsIiMgVE9ETyBGaXggdG8gaGF2ZSBlZGl0YWJsZSBZWVlZLU1NLUREIHdpdGggY2xpY2sgdG8gcG9wdXAgc2Nyb2xsZXJcblxuUXVlc3Rpb24gPSByZXF1aXJlKCcuL2Zvcm0tY29udHJvbHMnKS5RdWVzdGlvblxuXG5tb2R1bGUuZXhwb3J0cyA9IFF1ZXN0aW9uLmV4dGVuZFxuICBldmVudHM6XG4gICAgY2hhbmdlOiBcImNoYW5nZWRcIlxuXG4gIGNoYW5nZWQ6IC0+XG4gICAgQG1vZGVsLnNldCBAaWQsIEAkZWwuZmluZChcImlucHV0W25hbWU9XFxcImRhdGVcXFwiXVwiKS52YWwoKVxuXG4gIHJlbmRlckFuc3dlcjogKGFuc3dlckVsKSAtPlxuICAgIGFuc3dlckVsLmh0bWwgXy50ZW1wbGF0ZShcIjxpbnB1dCBjbGFzcz1cXFwibmVlZHNjbGlja1xcXCIgbmFtZT1cXFwiZGF0ZVxcXCIgLz5cIiwgdGhpcylcbiAgICBhbnN3ZXJFbC5maW5kKFwiaW5wdXRcIikudmFsIEBtb2RlbC5nZXQoQGlkKVxuXG4gICAgIyBTdXBwb3J0IHJlYWRvbmx5XG4gICAgaWYgQG9wdGlvbnMucmVhZG9ubHlcbiAgICAgIGFuc3dlckVsLmZpbmQoXCJpbnB1dFwiKS5hdHRyKCdyZWFkb25seScsICdyZWFkb25seScpXG4gICAgZWxzZVxuICAgICAgYW5zd2VyRWwuZmluZChcImlucHV0XCIpLnNjcm9sbGVyXG4gICAgICAgIHByZXNldDogXCJkYXRlXCJcbiAgICAgICAgdGhlbWU6IFwiaW9zXCJcbiAgICAgICAgZGlzcGxheTogXCJtb2RhbFwiXG4gICAgICAgIG1vZGU6IFwic2Nyb2xsZXJcIlxuICAgICAgICBkYXRlT3JkZXI6IFwieXltbUQgZGRcIlxuICAgICAgICBkYXRlRm9ybWF0OiBcInl5LW1tLWRkXCJcbiIsIlF1ZXN0aW9uID0gcmVxdWlyZSgnLi9mb3JtLWNvbnRyb2xzJykuUXVlc3Rpb25cblxubW9kdWxlLmV4cG9ydHMgPSBRdWVzdGlvbi5leHRlbmQoXG4gIGV2ZW50czpcbiAgICBjaGFuZ2U6IFwiY2hhbmdlZFwiXG5cbiAgc2V0T3B0aW9uczogKG9wdGlvbnMpIC0+XG4gICAgQG9wdGlvbnMub3B0aW9ucyA9IG9wdGlvbnNcbiAgICBAcmVuZGVyKClcblxuICBjaGFuZ2VkOiAoZSkgLT5cbiAgICB2YWwgPSAkKGUudGFyZ2V0KS52YWwoKVxuICAgIGlmIHZhbCBpcyBcIlwiXG4gICAgICBAbW9kZWwuc2V0IEBpZCwgbnVsbFxuICAgIGVsc2VcbiAgICAgIGluZGV4ID0gcGFyc2VJbnQodmFsKVxuICAgICAgdmFsdWUgPSBAb3B0aW9ucy5vcHRpb25zW2luZGV4XVswXVxuICAgICAgQG1vZGVsLnNldCBAaWQsIHZhbHVlXG5cbiAgcmVuZGVyQW5zd2VyOiAoYW5zd2VyRWwpIC0+XG4gICAgYW5zd2VyRWwuaHRtbCBfLnRlbXBsYXRlKFwiPHNlbGVjdCBpZD1cXFwic291cmNlX3R5cGVcXFwiPjwlPXJlbmRlckRyb3Bkb3duT3B0aW9ucygpJT48L3NlbGVjdD5cIiwgdGhpcylcbiAgICAjIENoZWNrIGlmIGFuc3dlciBwcmVzZW50IFxuICAgIGlmIG5vdCBfLmFueShAb3B0aW9ucy5vcHRpb25zLCAob3B0KSA9PiBvcHRbMF0gPT0gQG1vZGVsLmdldChAaWQpKSBhbmQgQG1vZGVsLmdldChAaWQpP1xuICAgICAgQCQoXCJzZWxlY3RcIikuYXR0cignZGlzYWJsZWQnLCAnZGlzYWJsZWQnKVxuXG4gIHJlbmRlckRyb3Bkb3duT3B0aW9uczogLT5cbiAgICBodG1sID0gXCJcIlxuICAgIFxuICAgICMgQWRkIGVtcHR5IG9wdGlvblxuICAgIGh0bWwgKz0gXCI8b3B0aW9uIHZhbHVlPVxcXCJcXFwiPjwvb3B0aW9uPlwiXG4gICAgZm9yIGkgaW4gWzAuLi5Ab3B0aW9ucy5vcHRpb25zLmxlbmd0aF1cbiAgICAgIGh0bWwgKz0gXy50ZW1wbGF0ZShcIjxvcHRpb24gdmFsdWU9XFxcIjwlPXBvc2l0aW9uJT5cXFwiIDwlPXNlbGVjdGVkJT4+PCUtdGV4dCU+PC9vcHRpb24+XCIsXG4gICAgICAgIHBvc2l0aW9uOiBpXG4gICAgICAgIHRleHQ6IEBvcHRpb25zLm9wdGlvbnNbaV1bMV1cbiAgICAgICAgc2VsZWN0ZWQ6IChpZiBAbW9kZWwuZ2V0KEBpZCkgaXMgQG9wdGlvbnMub3B0aW9uc1tpXVswXSB0aGVuIFwic2VsZWN0ZWQ9XFxcInNlbGVjdGVkXFxcIlwiIGVsc2UgXCJcIilcbiAgICAgIClcbiAgICByZXR1cm4gaHRtbFxuKSIsIlF1ZXN0aW9uID0gcmVxdWlyZSgnLi9mb3JtLWNvbnRyb2xzJykuUXVlc3Rpb25cblxubW9kdWxlLmV4cG9ydHMgPSBRdWVzdGlvbi5leHRlbmRcbiAgcmVuZGVyQW5zd2VyOiAoYW5zd2VyRWwpIC0+XG4gICAgYW5zd2VyRWwuaHRtbCBfLnRlbXBsYXRlKFwiPGlucHV0IHR5cGU9XFxcIm51bWJlclxcXCIgPCUgaWYgKG9wdGlvbnMuZGVjaW1hbCkgeyU+c3RlcD1cXFwiYW55XFxcIjwlfSU+IC8+XCIsIHRoaXMpXG4gICAgYW5zd2VyRWwuZmluZChcImlucHV0XCIpLnZhbCBAbW9kZWwuZ2V0KEBpZClcblxuICBldmVudHM6XG4gICAgY2hhbmdlOiBcImNoYW5nZWRcIlxuXG4gIHZhbGlkYXRlSW50ZXJuYWw6IC0+XG4gICAgdmFsID0gQCQoXCJpbnB1dFwiKS52YWwoKVxuICAgIGlmIEBvcHRpb25zLmRlY2ltYWwgYW5kIHZhbC5sZW5ndGggPiAwXG4gICAgICBpZiBwYXJzZUZsb2F0KHZhbCkgPT0gTmFOXG4gICAgICAgIHJldHVybiBcIkludmFsaWQgZGVjaW1hbCBudW1iZXJcIlxuICAgIGVsc2UgaWYgdmFsLmxlbmd0aCA+IDBcbiAgICAgIGlmIG5vdCB2YWwubWF0Y2goL14tP1xcZCskLylcbiAgICAgICAgcmV0dXJuIFwiSW52YWxpZCBpbnRlZ2VyIG51bWJlclwiXG4gICAgcmV0dXJuIG51bGxcblxuICBjaGFuZ2VkOiAtPlxuICAgIHZhbCA9IHBhcnNlRmxvYXQoQCQoXCJpbnB1dFwiKS52YWwoKSlcbiAgICBpZiB2YWwgPT0gTmFOXG4gICAgICB2YWwgPSBudWxsXG4gICAgQG1vZGVsLnNldCBAaWQsIHZhbCBcbiIsIlF1ZXN0aW9uID0gcmVxdWlyZSgnLi9mb3JtLWNvbnRyb2xzJykuUXVlc3Rpb25cblNvdXJjZUxpc3RQYWdlID0gcmVxdWlyZSAnLi4vcGFnZXMvU291cmNlTGlzdFBhZ2UnXG5zb3VyY2Vjb2RlcyA9IHJlcXVpcmUgJy4uL3NvdXJjZWNvZGVzJ1xuXG5tb2R1bGUuZXhwb3J0cyA9IFF1ZXN0aW9uLmV4dGVuZFxuICByZW5kZXJBbnN3ZXI6IChhbnN3ZXJFbCkgLT5cbiAgICBhbnN3ZXJFbC5odG1sICcnJ1xuICAgICAgPGRpdiBjbGFzcz1cImlucHV0LWFwcGVuZFwiPlxuICAgICAgICA8aW5wdXQgdHlwZT1cInRlbFwiPlxuICAgICAgICA8YnV0dG9uIGNsYXNzPVwiYnRuXCIgaWQ9XCJzZWxlY3RcIiB0eXBlPVwiYnV0dG9uXCI+U2VsZWN0PC9idXR0b24+XG4gICAgICA8L2Rpdj4nJydcbiAgICBhbnN3ZXJFbC5maW5kKFwiaW5wdXRcIikudmFsIEBtb2RlbC5nZXQoQGlkKVxuXG4gIGV2ZW50czpcbiAgICAnY2hhbmdlJyA6ICdjaGFuZ2VkJ1xuICAgICdjbGljayAjc2VsZWN0JyA6ICdzZWxlY3RTb3VyY2UnXG5cbiAgY2hhbmdlZDogLT5cbiAgICBAbW9kZWwuc2V0IEBpZCwgQCQoXCJpbnB1dFwiKS52YWwoKVxuXG4gIHNlbGVjdFNvdXJjZTogLT5cbiAgICBAY3R4LnBhZ2VyLm9wZW5QYWdlIFNvdXJjZUxpc3RQYWdlLCBcbiAgICAgIHsgb25TZWxlY3Q6IChzb3VyY2UpPT5cbiAgICAgICAgQG1vZGVsLnNldCBAaWQsIHNvdXJjZS5jb2RlXG4gICAgICB9XG5cbiAgdmFsaWRhdGVJbnRlcm5hbDogLT5cbiAgICBpZiBub3QgQCQoXCJpbnB1dFwiKS52YWwoKVxuICAgICAgcmV0dXJuIGZhbHNlXG5cbiAgICBpZiBzb3VyY2Vjb2Rlcy5pc1ZhbGlkKEAkKFwiaW5wdXRcIikudmFsKCkpXG4gICAgICByZXR1cm4gZmFsc2VcblxuICAgIHJldHVybiBcIkludmFsaWQgU291cmNlXCJcblxuIiwiUXVlc3Rpb24gPSByZXF1aXJlKCcuL2Zvcm0tY29udHJvbHMnKS5RdWVzdGlvblxuSW1hZ2VQYWdlID0gcmVxdWlyZSAnLi4vcGFnZXMvSW1hZ2VQYWdlJ1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEltYWdlUXVlc3Rpb24gZXh0ZW5kcyBRdWVzdGlvblxuICBldmVudHM6XG4gICAgXCJjbGljayAjYWRkXCI6IFwiYWRkQ2xpY2tcIlxuICAgIFwiY2xpY2sgLnRodW1ibmFpbC1pbWdcIjogXCJ0aHVtYm5haWxDbGlja1wiXG5cbiAgcmVuZGVyQW5zd2VyOiAoYW5zd2VyRWwpIC0+XG4gICAgIyBSZW5kZXIgaW1hZ2UgdXNpbmcgaW1hZ2UgbWFuYWdlclxuICAgIGlmIG5vdCBAY3R4LmltYWdlTWFuYWdlclxuICAgICAgYW5zd2VyRWwuaHRtbCAnJyc8ZGl2IGNsYXNzPVwidGV4dC1lcnJvclwiPkltYWdlcyBub3QgYXZhaWxhYmxlPC9kaXY+JycnXG4gICAgZWxzZVxuICAgICAgaW1hZ2UgPSBAbW9kZWwuZ2V0KEBpZClcblxuICAgICAgIyBEZXRlcm1pbmUgaWYgY2FuIGFkZCBpbWFnZXNcbiAgICAgIG5vdFN1cHBvcnRlZCA9IGZhbHNlXG4gICAgICBpZiBAb3B0aW9ucy5yZWFkb25seVxuICAgICAgICBjYW5BZGQgPSBmYWxzZVxuICAgICAgZWxzZSBpZiBAY3R4LmNhbWVyYSBhbmQgQGN0eC5pbWFnZU1hbmFnZXIuYWRkSW1hZ2VcbiAgICAgICAgY2FuQWRkID0gbm90IGltYWdlPyAjIERvbid0IGFsbG93IGFkZGluZyBtb3JlIHRoYW4gb25lXG4gICAgICBlbHNlXG4gICAgICAgIGNhbkFkZCA9IGZhbHNlXG4gICAgICAgIG5vdFN1cHBvcnRlZCA9IG5vdCBpbWFnZVxuXG4gICAgICAjIERldGVybWluZSBpZiB3ZSBuZWVkIHRvIHRlbGwgdXNlciB0aGF0IG5vIGltYWdlIGlzIGF2YWlsYWJsZVxuICAgICAgbm9JbWFnZSA9IG5vdCBjYW5BZGQgYW5kIG5vdCBpbWFnZSBhbmQgbm90IG5vdFN1cHBvcnRlZFxuXG4gICAgICAjIFJlbmRlciBpbWFnZXNcbiAgICAgIGFuc3dlckVsLmh0bWwgdGVtcGxhdGVzWydmb3Jtcy9JbWFnZVF1ZXN0aW9uJ10oaW1hZ2U6IGltYWdlLCBjYW5BZGQ6IGNhbkFkZCwgbm9JbWFnZTogbm9JbWFnZSwgbm90U3VwcG9ydGVkOiBub3RTdXBwb3J0ZWQpXG5cbiAgICAgICMgU2V0IHNvdXJjZVxuICAgICAgaWYgaW1hZ2VcbiAgICAgICAgQHNldFRodW1ibmFpbFVybChpbWFnZS5pZClcbiAgICBcbiAgc2V0VGh1bWJuYWlsVXJsOiAoaWQpIC0+XG4gICAgc3VjY2VzcyA9ICh1cmwpID0+XG4gICAgICBAJChcIiNcIiArIGlkKS5hdHRyKFwic3JjXCIsIHVybClcbiAgICBAY3R4LmltYWdlTWFuYWdlci5nZXRJbWFnZVRodW1ibmFpbFVybCBpZCwgc3VjY2VzcywgQGVycm9yXG5cbiAgYWRkQ2xpY2s6IC0+XG4gICAgIyBDYWxsIGNhbWVyYSB0byBnZXQgaW1hZ2VcbiAgICBzdWNjZXNzID0gKHVybCkgPT5cbiAgICAgICMgQWRkIGltYWdlXG4gICAgICBAY3R4LmltYWdlTWFuYWdlci5hZGRJbWFnZSh1cmwsIChpZCkgPT5cbiAgICAgICAgIyBBZGQgdG8gbW9kZWxcbiAgICAgICAgQG1vZGVsLnNldChAaWQsIHsgaWQ6IGlkIH0pXG4gICAgICAsIEBjdHguZXJyb3IpXG4gICAgQGN0eC5jYW1lcmEudGFrZVBpY3R1cmUgc3VjY2VzcywgKGVycikgLT5cbiAgICAgIGFsZXJ0KFwiRmFpbGVkIHRvIHRha2UgcGljdHVyZVwiKVxuXG4gIHRodW1ibmFpbENsaWNrOiAoZXYpIC0+XG4gICAgaWQgPSBldi5jdXJyZW50VGFyZ2V0LmlkXG5cbiAgICAjIENyZWF0ZSBvblJlbW92ZSBjYWxsYmFja1xuICAgIG9uUmVtb3ZlID0gKCkgPT4gXG4gICAgICBAbW9kZWwuc2V0KEBpZCwgbnVsbClcblxuICAgIEBjdHgucGFnZXIub3BlblBhZ2UoSW1hZ2VQYWdlLCB7IGlkOiBpZCwgb25SZW1vdmU6IG9uUmVtb3ZlIH0pIiwiUXVlc3Rpb24gPSByZXF1aXJlKCcuL2Zvcm0tY29udHJvbHMnKS5RdWVzdGlvblxuSW1hZ2VQYWdlID0gcmVxdWlyZSAnLi4vcGFnZXMvSW1hZ2VQYWdlJ1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEltYWdlc1F1ZXN0aW9uIGV4dGVuZHMgUXVlc3Rpb25cbiAgZXZlbnRzOlxuICAgIFwiY2xpY2sgI2FkZFwiOiBcImFkZENsaWNrXCJcbiAgICBcImNsaWNrIC50aHVtYm5haWwtaW1nXCI6IFwidGh1bWJuYWlsQ2xpY2tcIlxuXG4gIHJlbmRlckFuc3dlcjogKGFuc3dlckVsKSAtPlxuICAgICMgUmVuZGVyIGltYWdlIHVzaW5nIGltYWdlIG1hbmFnZXJcbiAgICBpZiBub3QgQGN0eC5pbWFnZU1hbmFnZXJcbiAgICAgIGFuc3dlckVsLmh0bWwgJycnPGRpdiBjbGFzcz1cInRleHQtZXJyb3JcIj5JbWFnZXMgbm90IGF2YWlsYWJsZTwvZGl2PicnJ1xuICAgIGVsc2VcbiAgICAgIGltYWdlcyA9IEBtb2RlbC5nZXQoQGlkKVxuXG4gICAgICAjIERldGVybWluZSBpZiBjYW4gYWRkIGltYWdlc1xuICAgICAgbm90U3VwcG9ydGVkID0gZmFsc2VcbiAgICAgIGlmIEBvcHRpb25zLnJlYWRvbmx5XG4gICAgICAgIGNhbkFkZCA9IGZhbHNlXG4gICAgICBlbHNlIGlmIEBjdHguY2FtZXJhIGFuZCBAY3R4LmltYWdlTWFuYWdlci5hZGRJbWFnZVxuICAgICAgICBjYW5BZGQgPSB0cnVlXG4gICAgICBlbHNlXG4gICAgICAgIGNhbkFkZCA9IGZhbHNlXG4gICAgICAgIG5vdFN1cHBvcnRlZCA9IG5vdCBpbWFnZXMgb3IgaW1hZ2VzLmxlbmd0aCA9PSAwXG5cbiAgICAgICMgRGV0ZXJtaW5lIGlmIHdlIG5lZWQgdG8gdGVsbCB1c2VyIHRoYXQgbm8gaW1hZ2UgYXJlIGF2YWlsYWJsZVxuICAgICAgbm9JbWFnZSA9IG5vdCBjYW5BZGQgYW5kIChub3QgaW1hZ2VzIG9yIGltYWdlcy5sZW5ndGggPT0gMCkgYW5kIG5vdCBub3RTdXBwb3J0ZWRcblxuICAgICAgIyBSZW5kZXIgaW1hZ2VzXG4gICAgICBhbnN3ZXJFbC5odG1sIHRlbXBsYXRlc1snZm9ybXMvSW1hZ2VzUXVlc3Rpb24nXShpbWFnZXM6IGltYWdlcywgY2FuQWRkOiBjYW5BZGQsIG5vSW1hZ2U6IG5vSW1hZ2UsIG5vdFN1cHBvcnRlZDogbm90U3VwcG9ydGVkKVxuXG4gICAgICAjIFNldCBzb3VyY2VzXG4gICAgICBpZiBpbWFnZXNcbiAgICAgICAgZm9yIGltYWdlIGluIGltYWdlc1xuICAgICAgICAgIEBzZXRUaHVtYm5haWxVcmwoaW1hZ2UuaWQpXG4gICAgXG4gIHNldFRodW1ibmFpbFVybDogKGlkKSAtPlxuICAgIHN1Y2Nlc3MgPSAodXJsKSA9PlxuICAgICAgQCQoXCIjXCIgKyBpZCkuYXR0cihcInNyY1wiLCB1cmwpXG4gICAgQGN0eC5pbWFnZU1hbmFnZXIuZ2V0SW1hZ2VUaHVtYm5haWxVcmwgaWQsIHN1Y2Nlc3MsIEBlcnJvclxuXG4gIGFkZENsaWNrOiAtPlxuICAgICMgQ2FsbCBjYW1lcmEgdG8gZ2V0IGltYWdlXG4gICAgc3VjY2VzcyA9ICh1cmwpID0+XG4gICAgICAjIEFkZCBpbWFnZVxuICAgICAgQGN0eC5pbWFnZU1hbmFnZXIuYWRkSW1hZ2UodXJsLCAoaWQpID0+XG4gICAgICAgICMgQWRkIHRvIG1vZGVsXG4gICAgICAgIGltYWdlcyA9IEBtb2RlbC5nZXQoQGlkKSB8fCBbXVxuICAgICAgICBpbWFnZXMucHVzaCB7IGlkOiBpZCB9XG4gICAgICAgIEBtb2RlbC5zZXQoQGlkLCBpbWFnZXMpXG5cbiAgICAgICwgQGN0eC5lcnJvcilcbiAgICBAY3R4LmNhbWVyYS50YWtlUGljdHVyZSBzdWNjZXNzLCAoZXJyKSAtPlxuICAgICAgYWxlcnQoXCJGYWlsZWQgdG8gdGFrZSBwaWN0dXJlXCIpXG5cbiAgdGh1bWJuYWlsQ2xpY2s6IChldikgLT5cbiAgICBpZCA9IGV2LmN1cnJlbnRUYXJnZXQuaWRcblxuICAgICMgQ3JlYXRlIG9uUmVtb3ZlIGNhbGxiYWNrXG4gICAgb25SZW1vdmUgPSAoKSA9PiBcbiAgICAgIGltYWdlcyA9IEBtb2RlbC5nZXQoQGlkKSB8fCBbXVxuICAgICAgaW1hZ2VzID0gXy5yZWplY3QgaW1hZ2VzLCAoaW1nKSA9PlxuICAgICAgICBpbWcuaWQgPT0gaWRcbiAgICAgIEBtb2RlbC5zZXQoQGlkLCBpbWFnZXMpICAgICAgXG5cbiAgICBAY3R4LnBhZ2VyLm9wZW5QYWdlKEltYWdlUGFnZSwgeyBpZDogaWQsIG9uUmVtb3ZlOiBvblJlbW92ZSB9KSIsIiMgSW1wcm92ZWQgbG9jYXRpb24gZmluZGVyXG5jbGFzcyBMb2NhdGlvbkZpbmRlclxuICBjb25zdHJ1Y3RvcjogLT5cbiAgICBfLmV4dGVuZCBALCBCYWNrYm9uZS5FdmVudHNcbiAgICBcbiAgZ2V0TG9jYXRpb246IC0+XG4gICAgIyBCb3RoIGZhaWx1cmVzIGFyZSByZXF1aXJlZCB0byB0cmlnZ2VyIGVycm9yXG4gICAgbG9jYXRpb25FcnJvciA9IF8uYWZ0ZXIgMiwgPT5cbiAgICAgIEB0cmlnZ2VyICdlcnJvcidcblxuICAgIGhpZ2hBY2N1cmFjeUZpcmVkID0gZmFsc2VcblxuICAgIGxvd0FjY3VyYWN5ID0gKHBvcykgPT5cbiAgICAgIGlmIG5vdCBoaWdoQWNjdXJhY3lGaXJlZFxuICAgICAgICBAdHJpZ2dlciAnZm91bmQnLCBwb3NcblxuICAgIGhpZ2hBY2N1cmFjeSA9IChwb3MpID0+XG4gICAgICBoaWdoQWNjdXJhY3lGaXJlZCA9IHRydWVcbiAgICAgIEB0cmlnZ2VyICdmb3VuZCcsIHBvc1xuXG4gICAgIyBHZXQgYm90aCBoaWdoIGFuZCBsb3cgYWNjdXJhY3ksIGFzIGxvdyBpcyBzdWZmaWNpZW50IGZvciBpbml0aWFsIGRpc3BsYXlcbiAgICBuYXZpZ2F0b3IuZ2VvbG9jYXRpb24uZ2V0Q3VycmVudFBvc2l0aW9uKGxvd0FjY3VyYWN5LCBsb2NhdGlvbkVycm9yLCB7XG4gICAgICAgIG1heGltdW1BZ2UgOiAzNjAwKjI0LFxuICAgICAgICB0aW1lb3V0IDogMTAwMDAsXG4gICAgICAgIGVuYWJsZUhpZ2hBY2N1cmFjeSA6IGZhbHNlXG4gICAgfSlcblxuICAgIG5hdmlnYXRvci5nZW9sb2NhdGlvbi5nZXRDdXJyZW50UG9zaXRpb24oaGlnaEFjY3VyYWN5LCBsb2NhdGlvbkVycm9yLCB7XG4gICAgICAgIG1heGltdW1BZ2UgOiAzNjAwLFxuICAgICAgICB0aW1lb3V0IDogMzAwMDAsXG4gICAgICAgIGVuYWJsZUhpZ2hBY2N1cmFjeSA6IHRydWVcbiAgICB9KVxuXG4gIHN0YXJ0V2F0Y2g6IC0+XG4gICAgIyBBbGxvdyBvbmUgd2F0Y2ggYXQgbW9zdFxuICAgIGlmIEBsb2NhdGlvbldhdGNoSWQ/XG4gICAgICBAc3RvcFdhdGNoKClcblxuICAgIGhpZ2hBY2N1cmFjeUZpcmVkID0gZmFsc2VcbiAgICBsb3dBY2N1cmFjeUZpcmVkID0gZmFsc2VcblxuICAgIGxvd0FjY3VyYWN5ID0gKHBvcykgPT5cbiAgICAgIGlmIG5vdCBoaWdoQWNjdXJhY3lGaXJlZFxuICAgICAgICBsb3dBY2N1cmFjeUZpcmVkID0gdHJ1ZVxuICAgICAgICBAdHJpZ2dlciAnZm91bmQnLCBwb3NcblxuICAgIGhpZ2hBY2N1cmFjeSA9IChwb3MpID0+XG4gICAgICBoaWdoQWNjdXJhY3lGaXJlZCA9IHRydWVcbiAgICAgIEB0cmlnZ2VyICdmb3VuZCcsIHBvc1xuXG4gICAgZXJyb3IgPSAoZXJyb3IpID0+XG4gICAgICBjb25zb2xlLmxvZyBcIiMjIyBlcnJvciBcIlxuICAgICAgIyBObyBlcnJvciBpZiBmaXJlZCBvbmNlXG4gICAgICBpZiBub3QgbG93QWNjdXJhY3lGaXJlZCBhbmQgbm90IGhpZ2hBY2N1cmFjeUZpcmVkXG4gICAgICAgIEB0cmlnZ2VyICdlcnJvcicsIGVycm9yXG5cbiAgICAjIEZpcmUgaW5pdGlhbCBsb3ctYWNjdXJhY3kgb25lXG4gICAgbmF2aWdhdG9yLmdlb2xvY2F0aW9uLmdldEN1cnJlbnRQb3NpdGlvbihsb3dBY2N1cmFjeSwgZXJyb3IsIHtcbiAgICAgICAgbWF4aW11bUFnZSA6IDM2MDAqMjQsXG4gICAgICAgIHRpbWVvdXQgOiAxMDAwMCxcbiAgICAgICAgZW5hYmxlSGlnaEFjY3VyYWN5IDogZmFsc2VcbiAgICB9KVxuXG4gICAgQGxvY2F0aW9uV2F0Y2hJZCA9IG5hdmlnYXRvci5nZW9sb2NhdGlvbi53YXRjaFBvc2l0aW9uKGhpZ2hBY2N1cmFjeSwgZXJyb3IsIHtcbiAgICAgICAgbWF4aW11bUFnZSA6IDMwMDAsXG4gICAgICAgIGVuYWJsZUhpZ2hBY2N1cmFjeSA6IHRydWVcbiAgICB9KSAgXG5cbiAgc3RvcFdhdGNoOiAtPlxuICAgIGlmIEBsb2NhdGlvbldhdGNoSWQ/XG4gICAgICBuYXZpZ2F0b3IuZ2VvbG9jYXRpb24uY2xlYXJXYXRjaChAbG9jYXRpb25XYXRjaElkKVxuICAgICAgQGxvY2F0aW9uV2F0Y2hJZCA9IHVuZGVmaW5lZFxuXG5cbm1vZHVsZS5leHBvcnRzID0gTG9jYXRpb25GaW5kZXIgICIsIiMgUGFnZSB0aGF0IGlzIGRpc3BsYXllZCBieSB0aGUgUGFnZXIuIFBhZ2VzIGhhdmUgdGhlIGZvbGxvd2luZyBsaWZlY3ljbGU6XG4jIGNyZWF0ZSwgYWN0aXZhdGUsIFtkZWFjdGl2YXRlLCBhY3RpdmF0ZS4uLl0sIGRlYWN0aXZhdGUsIGRlc3Ryb3lcbiMgQ29udGV4dCBpcyBtaXhlZCBpbiB0byB0aGUgcGFnZSBvYmplY3RcbiMgU3RhdGljIG1ldGhvZCBcImNhbk9wZW4oY3R4KVwiLCBpZiBwcmVzZW50LCBjYW4gZm9yYmlkIG9wZW5pbmcgcGFnZSBpZiBpdCByZXR1cm5zIGZhbHNlXG4jIFVzZWZ1bCBmb3IgZGlzcGxheWluZyBtZW51cyB3aXRoIHBhZ2UgbGlzdHMuXG5cbmNsYXNzIFBhZ2UgZXh0ZW5kcyBCYWNrYm9uZS5WaWV3XG4gIGNvbnN0cnVjdG9yOiAoY3R4LCBvcHRpb25zPXt9KSAtPlxuICAgIHN1cGVyKG9wdGlvbnMpXG4gICAgQGN0eCA9IGN0eFxuXG4gICAgIyBNaXggaW4gY29udGV4dCBmb3IgY29udmVuaWVuY2VcbiAgICBfLmRlZmF1bHRzKEAsIGN0eCkgXG5cbiAgICAjIFN0b3JlIHN1YnZpZXdzXG4gICAgQF9zdWJ2aWV3cyA9IFtdXG5cbiAgICAjIFNldHVwIGRlZmF1bHQgYnV0dG9uIGJhclxuICAgIEBidXR0b25CYXIgPSBuZXcgQnV0dG9uQmFyKClcblxuICAgICMgU2V0dXAgZGVmYXVsdCBjb250ZXh0IG1lbnVcbiAgICBAY29udGV4dE1lbnUgPSBuZXcgQ29udGV4dE1lbnUoKVxuXG4gIGNsYXNzTmFtZTogXCJwYWdlXCJcblxuICBAY2FuT3BlbjogKGN0eCkgLT4gdHJ1ZVxuICBjcmVhdGU6IC0+XG4gIGFjdGl2YXRlOiAtPlxuICBkZWFjdGl2YXRlOiAtPlxuICBkZXN0cm95OiAtPlxuICByZW1vdmU6IC0+XG4gICAgQHJlbW92ZVN1YnZpZXdzKClcbiAgICBzdXBlcigpXG5cbiAgZ2V0VGl0bGU6IC0+IEB0aXRsZVxuXG4gIHNldFRpdGxlOiAodGl0bGUpIC0+XG4gICAgQHRpdGxlID0gdGl0bGVcbiAgICBAdHJpZ2dlciAnY2hhbmdlOnRpdGxlJ1xuXG4gIGFkZFN1YnZpZXc6ICh2aWV3KSAtPlxuICAgIEBfc3Vidmlld3MucHVzaCh2aWV3KVxuXG4gIHJlbW92ZVN1YnZpZXdzOiAtPlxuICAgIGZvciBzdWJ2aWV3IGluIEBfc3Vidmlld3NcbiAgICAgIHN1YnZpZXcucmVtb3ZlKClcblxuICBnZXRCdXR0b25CYXI6IC0+XG4gICAgcmV0dXJuIEBidXR0b25CYXJcblxuICBnZXRDb250ZXh0TWVudTogLT5cbiAgICByZXR1cm4gQGNvbnRleHRNZW51XG5cbiAgc2V0dXBCdXR0b25CYXI6IChpdGVtcykgLT5cbiAgICAjIFNldHVwIGJ1dHRvbiBiYXJcbiAgICBAYnV0dG9uQmFyLnNldHVwKGl0ZW1zKVxuXG4gIHNldHVwQ29udGV4dE1lbnU6IChpdGVtcykgLT5cbiAgICAjIFNldHVwIGNvbnRleHQgbWVudVxuICAgIEBjb250ZXh0TWVudS5zZXR1cChpdGVtcylcblxuIyBTdGFuZGFyZCBidXR0b24gYmFyLiBFYWNoIGl0ZW1cbiMgaGFzIG9wdGlvbmFsIFwidGV4dFwiLCBvcHRpb25hbCBcImljb25cIiBhbmQgXCJjbGlja1wiIChhY3Rpb24pLlxuIyBGb3Igc3VibWVudSwgYWRkIGFycmF5IHRvIFwibWVudVwiLiBPbmUgbGV2ZWwgbmVzdGluZyBvbmx5LlxuY2xhc3MgQnV0dG9uQmFyIGV4dGVuZHMgQmFja2JvbmUuVmlld1xuICBldmVudHM6IFxuICAgIFwiY2xpY2sgLm1lbnVpdGVtXCIgOiBcImNsaWNrTWVudUl0ZW1cIlxuXG4gIHNldHVwOiAoaXRlbXMpIC0+XG4gICAgQGl0ZW1zID0gaXRlbXNcbiAgICBAaXRlbU1hcCA9IHt9XG5cbiAgICAjIEFkZCBpZCB0byBhbGwgaXRlbXMgaWYgbm90IHByZXNlbnRcbiAgICBpZCA9IDFcbiAgICBmb3IgaXRlbSBpbiBpdGVtc1xuICAgICAgaWYgbm90IGl0ZW0uaWQ/XG4gICAgICAgIGl0ZW0uaWQgPSBpZFxuICAgICAgICBpZD1pZCsxXG4gICAgICBAaXRlbU1hcFtpdGVtLmlkXSA9IGl0ZW1cblxuICAgICAgIyBBZGQgdG8gc3VibWVudVxuICAgICAgaWYgaXRlbS5tZW51XG4gICAgICAgIGZvciBzdWJpdGVtIGluIGl0ZW0ubWVudVxuICAgICAgICAgIGlmIG5vdCBzdWJpdGVtLmlkP1xuICAgICAgICAgICAgc3ViaXRlbS5pZCA9IGlkLnRvU3RyaW5nKClcbiAgICAgICAgICAgIGlkPWlkKzFcbiAgICAgICAgICBAaXRlbU1hcFtzdWJpdGVtLmlkXSA9IHN1Yml0ZW1cblxuICAgIEByZW5kZXIoKVxuXG4gIHJlbmRlcjogLT5cbiAgICBAJGVsLmh0bWwgdGVtcGxhdGVzWydCdXR0b25CYXInXShpdGVtczogQGl0ZW1zKVxuXG4gIGNsaWNrTWVudUl0ZW06IChlKSAtPlxuICAgIGlkID0gZS5jdXJyZW50VGFyZ2V0LmlkXG4gICAgaXRlbSA9IEBpdGVtTWFwW2lkXVxuICAgIGlmIGl0ZW0uY2xpY2s/XG4gICAgICBpdGVtLmNsaWNrKClcblxuIyBDb250ZXh0IG1lbnUgdG8gZ28gaW4gc2xpZGUgbWVudVxuIyBTdGFuZGFyZCBidXR0b24gYmFyLiBFYWNoIGl0ZW0gXCJ0ZXh0XCIsIG9wdGlvbmFsIFwiZ2x5cGhcIiAoYm9vdHN0cmFwIGdseXBoIHdpdGhvdXQgaWNvbi0gcHJlZml4KSBhbmQgXCJjbGlja1wiIChhY3Rpb24pLlxuY2xhc3MgQ29udGV4dE1lbnUgZXh0ZW5kcyBCYWNrYm9uZS5WaWV3XG4gIGV2ZW50czogXG4gICAgXCJjbGljayAubWVudWl0ZW1cIiA6IFwiY2xpY2tNZW51SXRlbVwiXG5cbiAgc2V0dXA6IChpdGVtcykgLT5cbiAgICBAaXRlbXMgPSBpdGVtc1xuICAgIEBpdGVtTWFwID0ge31cblxuICAgICMgQWRkIGlkIHRvIGFsbCBpdGVtcyBpZiBub3QgcHJlc2VudFxuICAgIGlkID0gMVxuICAgIGZvciBpdGVtIGluIGl0ZW1zXG4gICAgICBpZiBub3QgaXRlbS5pZD9cbiAgICAgICAgaXRlbS5pZCA9IGlkXG4gICAgICAgIGlkPWlkKzFcbiAgICAgIEBpdGVtTWFwW2l0ZW0uaWRdID0gaXRlbVxuXG4gICAgQHJlbmRlcigpXG5cbiAgcmVuZGVyOiAtPlxuICAgIEAkZWwuaHRtbCB0ZW1wbGF0ZXNbJ0NvbnRleHRNZW51J10oaXRlbXM6IEBpdGVtcylcblxuICBjbGlja01lbnVJdGVtOiAoZSkgLT5cbiAgICBpZCA9IGUuY3VycmVudFRhcmdldC5pZFxuICAgIGl0ZW0gPSBAaXRlbU1hcFtpZF1cbiAgICBpZiBpdGVtLmNsaWNrP1xuICAgICAgaXRlbS5jbGljaygpXG5cbm1vZHVsZS5leHBvcnRzID0gUGFnZSIsIi8qXG49PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5NZXRlb3IgaXMgbGljZW5zZWQgdW5kZXIgdGhlIE1JVCBMaWNlbnNlXG49PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbkNvcHlyaWdodCAoQykgMjAxMS0tMjAxMiBNZXRlb3IgRGV2ZWxvcG1lbnQgR3JvdXBcblxuUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcblxuVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG5cblRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG5cbj09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5UaGlzIGxpY2Vuc2UgYXBwbGllcyB0byBhbGwgY29kZSBpbiBNZXRlb3IgdGhhdCBpcyBub3QgYW4gZXh0ZXJuYWxseVxubWFpbnRhaW5lZCBsaWJyYXJ5LiBFeHRlcm5hbGx5IG1haW50YWluZWQgbGlicmFyaWVzIGhhdmUgdGhlaXIgb3duXG5saWNlbnNlcywgaW5jbHVkZWQgYmVsb3c6XG49PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4qL1xuXG5Mb2NhbENvbGxlY3Rpb24gPSB7fTtcbkVKU09OID0gcmVxdWlyZShcIi4vRUpTT05cIik7XG5cbi8vIExpa2UgXy5pc0FycmF5LCBidXQgZG9lc24ndCByZWdhcmQgcG9seWZpbGxlZCBVaW50OEFycmF5cyBvbiBvbGQgYnJvd3NlcnMgYXNcbi8vIGFycmF5cy5cbnZhciBpc0FycmF5ID0gZnVuY3Rpb24gKHgpIHtcbiAgcmV0dXJuIF8uaXNBcnJheSh4KSAmJiAhRUpTT04uaXNCaW5hcnkoeCk7XG59O1xuXG52YXIgX2FueUlmQXJyYXkgPSBmdW5jdGlvbiAoeCwgZikge1xuICBpZiAoaXNBcnJheSh4KSlcbiAgICByZXR1cm4gXy5hbnkoeCwgZik7XG4gIHJldHVybiBmKHgpO1xufTtcblxudmFyIF9hbnlJZkFycmF5UGx1cyA9IGZ1bmN0aW9uICh4LCBmKSB7XG4gIGlmIChmKHgpKVxuICAgIHJldHVybiB0cnVlO1xuICByZXR1cm4gaXNBcnJheSh4KSAmJiBfLmFueSh4LCBmKTtcbn07XG5cbnZhciBoYXNPcGVyYXRvcnMgPSBmdW5jdGlvbih2YWx1ZVNlbGVjdG9yKSB7XG4gIHZhciB0aGVzZUFyZU9wZXJhdG9ycyA9IHVuZGVmaW5lZDtcbiAgZm9yICh2YXIgc2VsS2V5IGluIHZhbHVlU2VsZWN0b3IpIHtcbiAgICB2YXIgdGhpc0lzT3BlcmF0b3IgPSBzZWxLZXkuc3Vic3RyKDAsIDEpID09PSAnJCc7XG4gICAgaWYgKHRoZXNlQXJlT3BlcmF0b3JzID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoZXNlQXJlT3BlcmF0b3JzID0gdGhpc0lzT3BlcmF0b3I7XG4gICAgfSBlbHNlIGlmICh0aGVzZUFyZU9wZXJhdG9ycyAhPT0gdGhpc0lzT3BlcmF0b3IpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkluY29uc2lzdGVudCBzZWxlY3RvcjogXCIgKyB2YWx1ZVNlbGVjdG9yKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuICEhdGhlc2VBcmVPcGVyYXRvcnM7ICAvLyB7fSBoYXMgbm8gb3BlcmF0b3JzXG59O1xuXG52YXIgY29tcGlsZVZhbHVlU2VsZWN0b3IgPSBmdW5jdGlvbiAodmFsdWVTZWxlY3Rvcikge1xuICBpZiAodmFsdWVTZWxlY3RvciA9PSBudWxsKSB7ICAvLyB1bmRlZmluZWQgb3IgbnVsbFxuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJldHVybiBfYW55SWZBcnJheSh2YWx1ZSwgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIHggPT0gbnVsbDsgIC8vIHVuZGVmaW5lZCBvciBudWxsXG4gICAgICB9KTtcbiAgICB9O1xuICB9XG5cbiAgLy8gU2VsZWN0b3IgaXMgYSBub24tbnVsbCBwcmltaXRpdmUgKGFuZCBub3QgYW4gYXJyYXkgb3IgUmVnRXhwIGVpdGhlcikuXG4gIGlmICghXy5pc09iamVjdCh2YWx1ZVNlbGVjdG9yKSkge1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJldHVybiBfYW55SWZBcnJheSh2YWx1ZSwgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIHggPT09IHZhbHVlU2VsZWN0b3I7XG4gICAgICB9KTtcbiAgICB9O1xuICB9XG5cbiAgaWYgKHZhbHVlU2VsZWN0b3IgaW5zdGFuY2VvZiBSZWdFeHApIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZClcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgcmV0dXJuIF9hbnlJZkFycmF5KHZhbHVlLCBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4gdmFsdWVTZWxlY3Rvci50ZXN0KHgpO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfVxuXG4gIC8vIEFycmF5cyBtYXRjaCBlaXRoZXIgaWRlbnRpY2FsIGFycmF5cyBvciBhcnJheXMgdGhhdCBjb250YWluIGl0IGFzIGEgdmFsdWUuXG4gIGlmIChpc0FycmF5KHZhbHVlU2VsZWN0b3IpKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgaWYgKCFpc0FycmF5KHZhbHVlKSlcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgcmV0dXJuIF9hbnlJZkFycmF5UGx1cyh2YWx1ZSwgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIExvY2FsQ29sbGVjdGlvbi5fZi5fZXF1YWwodmFsdWVTZWxlY3RvciwgeCk7XG4gICAgICB9KTtcbiAgICB9O1xuICB9XG5cbiAgLy8gSXQncyBhbiBvYmplY3QsIGJ1dCBub3QgYW4gYXJyYXkgb3IgcmVnZXhwLlxuICBpZiAoaGFzT3BlcmF0b3JzKHZhbHVlU2VsZWN0b3IpKSB7XG4gICAgdmFyIG9wZXJhdG9yRnVuY3Rpb25zID0gW107XG4gICAgXy5lYWNoKHZhbHVlU2VsZWN0b3IsIGZ1bmN0aW9uIChvcGVyYW5kLCBvcGVyYXRvcikge1xuICAgICAgaWYgKCFfLmhhcyhWQUxVRV9PUEVSQVRPUlMsIG9wZXJhdG9yKSlcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5yZWNvZ25pemVkIG9wZXJhdG9yOiBcIiArIG9wZXJhdG9yKTtcbiAgICAgIG9wZXJhdG9yRnVuY3Rpb25zLnB1c2goVkFMVUVfT1BFUkFUT1JTW29wZXJhdG9yXShcbiAgICAgICAgb3BlcmFuZCwgdmFsdWVTZWxlY3Rvci4kb3B0aW9ucykpO1xuICAgIH0pO1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJldHVybiBfLmFsbChvcGVyYXRvckZ1bmN0aW9ucywgZnVuY3Rpb24gKGYpIHtcbiAgICAgICAgcmV0dXJuIGYodmFsdWUpO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfVxuXG4gIC8vIEl0J3MgYSBsaXRlcmFsOyBjb21wYXJlIHZhbHVlIChvciBlbGVtZW50IG9mIHZhbHVlIGFycmF5KSBkaXJlY3RseSB0byB0aGVcbiAgLy8gc2VsZWN0b3IuXG4gIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICByZXR1cm4gX2FueUlmQXJyYXkodmFsdWUsIGZ1bmN0aW9uICh4KSB7XG4gICAgICByZXR1cm4gTG9jYWxDb2xsZWN0aW9uLl9mLl9lcXVhbCh2YWx1ZVNlbGVjdG9yLCB4KTtcbiAgICB9KTtcbiAgfTtcbn07XG5cbi8vIFhYWCBjYW4gZmFjdG9yIG91dCBjb21tb24gbG9naWMgYmVsb3dcbnZhciBMT0dJQ0FMX09QRVJBVE9SUyA9IHtcbiAgXCIkYW5kXCI6IGZ1bmN0aW9uKHN1YlNlbGVjdG9yKSB7XG4gICAgaWYgKCFpc0FycmF5KHN1YlNlbGVjdG9yKSB8fCBfLmlzRW1wdHkoc3ViU2VsZWN0b3IpKVxuICAgICAgdGhyb3cgRXJyb3IoXCIkYW5kLyRvci8kbm9yIG11c3QgYmUgbm9uZW1wdHkgYXJyYXlcIik7XG4gICAgdmFyIHN1YlNlbGVjdG9yRnVuY3Rpb25zID0gXy5tYXAoXG4gICAgICBzdWJTZWxlY3RvciwgY29tcGlsZURvY3VtZW50U2VsZWN0b3IpO1xuICAgIHJldHVybiBmdW5jdGlvbiAoZG9jKSB7XG4gICAgICByZXR1cm4gXy5hbGwoc3ViU2VsZWN0b3JGdW5jdGlvbnMsIGZ1bmN0aW9uIChmKSB7XG4gICAgICAgIHJldHVybiBmKGRvYyk7XG4gICAgICB9KTtcbiAgICB9O1xuICB9LFxuXG4gIFwiJG9yXCI6IGZ1bmN0aW9uKHN1YlNlbGVjdG9yKSB7XG4gICAgaWYgKCFpc0FycmF5KHN1YlNlbGVjdG9yKSB8fCBfLmlzRW1wdHkoc3ViU2VsZWN0b3IpKVxuICAgICAgdGhyb3cgRXJyb3IoXCIkYW5kLyRvci8kbm9yIG11c3QgYmUgbm9uZW1wdHkgYXJyYXlcIik7XG4gICAgdmFyIHN1YlNlbGVjdG9yRnVuY3Rpb25zID0gXy5tYXAoXG4gICAgICBzdWJTZWxlY3RvciwgY29tcGlsZURvY3VtZW50U2VsZWN0b3IpO1xuICAgIHJldHVybiBmdW5jdGlvbiAoZG9jKSB7XG4gICAgICByZXR1cm4gXy5hbnkoc3ViU2VsZWN0b3JGdW5jdGlvbnMsIGZ1bmN0aW9uIChmKSB7XG4gICAgICAgIHJldHVybiBmKGRvYyk7XG4gICAgICB9KTtcbiAgICB9O1xuICB9LFxuXG4gIFwiJG5vclwiOiBmdW5jdGlvbihzdWJTZWxlY3Rvcikge1xuICAgIGlmICghaXNBcnJheShzdWJTZWxlY3RvcikgfHwgXy5pc0VtcHR5KHN1YlNlbGVjdG9yKSlcbiAgICAgIHRocm93IEVycm9yKFwiJGFuZC8kb3IvJG5vciBtdXN0IGJlIG5vbmVtcHR5IGFycmF5XCIpO1xuICAgIHZhciBzdWJTZWxlY3RvckZ1bmN0aW9ucyA9IF8ubWFwKFxuICAgICAgc3ViU2VsZWN0b3IsIGNvbXBpbGVEb2N1bWVudFNlbGVjdG9yKTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGRvYykge1xuICAgICAgcmV0dXJuIF8uYWxsKHN1YlNlbGVjdG9yRnVuY3Rpb25zLCBmdW5jdGlvbiAoZikge1xuICAgICAgICByZXR1cm4gIWYoZG9jKTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0sXG5cbiAgXCIkd2hlcmVcIjogZnVuY3Rpb24oc2VsZWN0b3JWYWx1ZSkge1xuICAgIGlmICghKHNlbGVjdG9yVmFsdWUgaW5zdGFuY2VvZiBGdW5jdGlvbikpIHtcbiAgICAgIHNlbGVjdG9yVmFsdWUgPSBGdW5jdGlvbihcInJldHVybiBcIiArIHNlbGVjdG9yVmFsdWUpO1xuICAgIH1cbiAgICByZXR1cm4gZnVuY3Rpb24gKGRvYykge1xuICAgICAgcmV0dXJuIHNlbGVjdG9yVmFsdWUuY2FsbChkb2MpO1xuICAgIH07XG4gIH1cbn07XG5cbnZhciBWQUxVRV9PUEVSQVRPUlMgPSB7XG4gIFwiJGluXCI6IGZ1bmN0aW9uIChvcGVyYW5kKSB7XG4gICAgaWYgKCFpc0FycmF5KG9wZXJhbmQpKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQXJndW1lbnQgdG8gJGluIG11c3QgYmUgYXJyYXlcIik7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgcmV0dXJuIF9hbnlJZkFycmF5UGx1cyh2YWx1ZSwgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIF8uYW55KG9wZXJhbmQsIGZ1bmN0aW9uIChvcGVyYW5kRWx0KSB7XG4gICAgICAgICAgcmV0dXJuIExvY2FsQ29sbGVjdGlvbi5fZi5fZXF1YWwob3BlcmFuZEVsdCwgeCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSxcblxuICBcIiRhbGxcIjogZnVuY3Rpb24gKG9wZXJhbmQpIHtcbiAgICBpZiAoIWlzQXJyYXkob3BlcmFuZCkpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJBcmd1bWVudCB0byAkYWxsIG11c3QgYmUgYXJyYXlcIik7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgaWYgKCFpc0FycmF5KHZhbHVlKSlcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgcmV0dXJuIF8uYWxsKG9wZXJhbmQsIGZ1bmN0aW9uIChvcGVyYW5kRWx0KSB7XG4gICAgICAgIHJldHVybiBfLmFueSh2YWx1ZSwgZnVuY3Rpb24gKHZhbHVlRWx0KSB7XG4gICAgICAgICAgcmV0dXJuIExvY2FsQ29sbGVjdGlvbi5fZi5fZXF1YWwob3BlcmFuZEVsdCwgdmFsdWVFbHQpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0sXG5cbiAgXCIkbHRcIjogZnVuY3Rpb24gKG9wZXJhbmQpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICByZXR1cm4gX2FueUlmQXJyYXkodmFsdWUsIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiBMb2NhbENvbGxlY3Rpb24uX2YuX2NtcCh4LCBvcGVyYW5kKSA8IDA7XG4gICAgICB9KTtcbiAgICB9O1xuICB9LFxuXG4gIFwiJGx0ZVwiOiBmdW5jdGlvbiAob3BlcmFuZCkge1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJldHVybiBfYW55SWZBcnJheSh2YWx1ZSwgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIExvY2FsQ29sbGVjdGlvbi5fZi5fY21wKHgsIG9wZXJhbmQpIDw9IDA7XG4gICAgICB9KTtcbiAgICB9O1xuICB9LFxuXG4gIFwiJGd0XCI6IGZ1bmN0aW9uIChvcGVyYW5kKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgcmV0dXJuIF9hbnlJZkFycmF5KHZhbHVlLCBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4gTG9jYWxDb2xsZWN0aW9uLl9mLl9jbXAoeCwgb3BlcmFuZCkgPiAwO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSxcblxuICBcIiRndGVcIjogZnVuY3Rpb24gKG9wZXJhbmQpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICByZXR1cm4gX2FueUlmQXJyYXkodmFsdWUsIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiBMb2NhbENvbGxlY3Rpb24uX2YuX2NtcCh4LCBvcGVyYW5kKSA+PSAwO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSxcblxuICBcIiRuZVwiOiBmdW5jdGlvbiAob3BlcmFuZCkge1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJldHVybiAhIF9hbnlJZkFycmF5UGx1cyh2YWx1ZSwgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIExvY2FsQ29sbGVjdGlvbi5fZi5fZXF1YWwoeCwgb3BlcmFuZCk7XG4gICAgICB9KTtcbiAgICB9O1xuICB9LFxuXG4gIFwiJG5pblwiOiBmdW5jdGlvbiAob3BlcmFuZCkge1xuICAgIGlmICghaXNBcnJheShvcGVyYW5kKSlcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkFyZ3VtZW50IHRvICRuaW4gbXVzdCBiZSBhcnJheVwiKTtcbiAgICB2YXIgaW5GdW5jdGlvbiA9IFZBTFVFX09QRVJBVE9SUy4kaW4ob3BlcmFuZCk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgLy8gRmllbGQgZG9lc24ndCBleGlzdCwgc28gaXQncyBub3QtaW4gb3BlcmFuZFxuICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgcmV0dXJuICFpbkZ1bmN0aW9uKHZhbHVlKTtcbiAgICB9O1xuICB9LFxuXG4gIFwiJGV4aXN0c1wiOiBmdW5jdGlvbiAob3BlcmFuZCkge1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJldHVybiBvcGVyYW5kID09PSAodmFsdWUgIT09IHVuZGVmaW5lZCk7XG4gICAgfTtcbiAgfSxcblxuICBcIiRtb2RcIjogZnVuY3Rpb24gKG9wZXJhbmQpIHtcbiAgICB2YXIgZGl2aXNvciA9IG9wZXJhbmRbMF0sXG4gICAgICAgIHJlbWFpbmRlciA9IG9wZXJhbmRbMV07XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgcmV0dXJuIF9hbnlJZkFycmF5KHZhbHVlLCBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4geCAlIGRpdmlzb3IgPT09IHJlbWFpbmRlcjtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0sXG5cbiAgXCIkc2l6ZVwiOiBmdW5jdGlvbiAob3BlcmFuZCkge1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJldHVybiBpc0FycmF5KHZhbHVlKSAmJiBvcGVyYW5kID09PSB2YWx1ZS5sZW5ndGg7XG4gICAgfTtcbiAgfSxcblxuICBcIiR0eXBlXCI6IGZ1bmN0aW9uIChvcGVyYW5kKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgLy8gQSBub25leGlzdGVudCBmaWVsZCBpcyBvZiBubyB0eXBlLlxuICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIC8vIERlZmluaXRlbHkgbm90IF9hbnlJZkFycmF5UGx1czogJHR5cGU6IDQgb25seSBtYXRjaGVzIGFycmF5cyB0aGF0IGhhdmVcbiAgICAgIC8vIGFycmF5cyBhcyBlbGVtZW50cyBhY2NvcmRpbmcgdG8gdGhlIE1vbmdvIGRvY3MuXG4gICAgICByZXR1cm4gX2FueUlmQXJyYXkodmFsdWUsIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiBMb2NhbENvbGxlY3Rpb24uX2YuX3R5cGUoeCkgPT09IG9wZXJhbmQ7XG4gICAgICB9KTtcbiAgICB9O1xuICB9LFxuXG4gIFwiJHJlZ2V4XCI6IGZ1bmN0aW9uIChvcGVyYW5kLCBvcHRpb25zKSB7XG4gICAgaWYgKG9wdGlvbnMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgLy8gT3B0aW9ucyBwYXNzZWQgaW4gJG9wdGlvbnMgKGV2ZW4gdGhlIGVtcHR5IHN0cmluZykgYWx3YXlzIG92ZXJyaWRlc1xuICAgICAgLy8gb3B0aW9ucyBpbiB0aGUgUmVnRXhwIG9iamVjdCBpdHNlbGYuXG5cbiAgICAgIC8vIEJlIGNsZWFyIHRoYXQgd2Ugb25seSBzdXBwb3J0IHRoZSBKUy1zdXBwb3J0ZWQgb3B0aW9ucywgbm90IGV4dGVuZGVkXG4gICAgICAvLyBvbmVzIChlZywgTW9uZ28gc3VwcG9ydHMgeCBhbmQgcykuIElkZWFsbHkgd2Ugd291bGQgaW1wbGVtZW50IHggYW5kIHNcbiAgICAgIC8vIGJ5IHRyYW5zZm9ybWluZyB0aGUgcmVnZXhwLCBidXQgbm90IHRvZGF5Li4uXG4gICAgICBpZiAoL1teZ2ltXS8udGVzdChvcHRpb25zKSlcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiT25seSB0aGUgaSwgbSwgYW5kIGcgcmVnZXhwIG9wdGlvbnMgYXJlIHN1cHBvcnRlZFwiKTtcblxuICAgICAgdmFyIHJlZ2V4U291cmNlID0gb3BlcmFuZCBpbnN0YW5jZW9mIFJlZ0V4cCA/IG9wZXJhbmQuc291cmNlIDogb3BlcmFuZDtcbiAgICAgIG9wZXJhbmQgPSBuZXcgUmVnRXhwKHJlZ2V4U291cmNlLCBvcHRpb25zKTtcbiAgICB9IGVsc2UgaWYgKCEob3BlcmFuZCBpbnN0YW5jZW9mIFJlZ0V4cCkpIHtcbiAgICAgIG9wZXJhbmQgPSBuZXcgUmVnRXhwKG9wZXJhbmQpO1xuICAgIH1cblxuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICByZXR1cm4gX2FueUlmQXJyYXkodmFsdWUsIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiBvcGVyYW5kLnRlc3QoeCk7XG4gICAgICB9KTtcbiAgICB9O1xuICB9LFxuXG4gIFwiJG9wdGlvbnNcIjogZnVuY3Rpb24gKG9wZXJhbmQpIHtcbiAgICAvLyBldmFsdWF0aW9uIGhhcHBlbnMgYXQgdGhlICRyZWdleCBmdW5jdGlvbiBhYm92ZVxuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHsgcmV0dXJuIHRydWU7IH07XG4gIH0sXG5cbiAgXCIkZWxlbU1hdGNoXCI6IGZ1bmN0aW9uIChvcGVyYW5kKSB7XG4gICAgdmFyIG1hdGNoZXIgPSBjb21waWxlRG9jdW1lbnRTZWxlY3RvcihvcGVyYW5kKTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICBpZiAoIWlzQXJyYXkodmFsdWUpKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICByZXR1cm4gXy5hbnkodmFsdWUsIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiBtYXRjaGVyKHgpO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSxcblxuICBcIiRub3RcIjogZnVuY3Rpb24gKG9wZXJhbmQpIHtcbiAgICB2YXIgbWF0Y2hlciA9IGNvbXBpbGVWYWx1ZVNlbGVjdG9yKG9wZXJhbmQpO1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJldHVybiAhbWF0Y2hlcih2YWx1ZSk7XG4gICAgfTtcbiAgfSxcblxuICBcIiRuZWFyXCI6IGZ1bmN0aW9uIChvcGVyYW5kKSB7XG4gICAgLy8gQWx3YXlzIHJldHVybnMgdHJ1ZS4gTXVzdCBiZSBoYW5kbGVkIGluIHBvc3QtZmlsdGVyL3NvcnQvbGltaXRcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH0sXG5cbiAgXCIkZ2VvSW50ZXJzZWN0c1wiOiBmdW5jdGlvbiAob3BlcmFuZCkge1xuICAgIC8vIEFsd2F5cyByZXR1cm5zIHRydWUuIE11c3QgYmUgaGFuZGxlZCBpbiBwb3N0LWZpbHRlci9zb3J0L2xpbWl0XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG5cbn07XG5cbi8vIGhlbHBlcnMgdXNlZCBieSBjb21waWxlZCBzZWxlY3RvciBjb2RlXG5Mb2NhbENvbGxlY3Rpb24uX2YgPSB7XG4gIC8vIFhYWCBmb3IgX2FsbCBhbmQgX2luLCBjb25zaWRlciBidWlsZGluZyAnaW5xdWVyeScgYXQgY29tcGlsZSB0aW1lLi5cblxuICBfdHlwZTogZnVuY3Rpb24gKHYpIHtcbiAgICBpZiAodHlwZW9mIHYgPT09IFwibnVtYmVyXCIpXG4gICAgICByZXR1cm4gMTtcbiAgICBpZiAodHlwZW9mIHYgPT09IFwic3RyaW5nXCIpXG4gICAgICByZXR1cm4gMjtcbiAgICBpZiAodHlwZW9mIHYgPT09IFwiYm9vbGVhblwiKVxuICAgICAgcmV0dXJuIDg7XG4gICAgaWYgKGlzQXJyYXkodikpXG4gICAgICByZXR1cm4gNDtcbiAgICBpZiAodiA9PT0gbnVsbClcbiAgICAgIHJldHVybiAxMDtcbiAgICBpZiAodiBpbnN0YW5jZW9mIFJlZ0V4cClcbiAgICAgIHJldHVybiAxMTtcbiAgICBpZiAodHlwZW9mIHYgPT09IFwiZnVuY3Rpb25cIilcbiAgICAgIC8vIG5vdGUgdGhhdCB0eXBlb2YoL3gvKSA9PT0gXCJmdW5jdGlvblwiXG4gICAgICByZXR1cm4gMTM7XG4gICAgaWYgKHYgaW5zdGFuY2VvZiBEYXRlKVxuICAgICAgcmV0dXJuIDk7XG4gICAgaWYgKEVKU09OLmlzQmluYXJ5KHYpKVxuICAgICAgcmV0dXJuIDU7XG4gICAgaWYgKHYgaW5zdGFuY2VvZiBNZXRlb3IuQ29sbGVjdGlvbi5PYmplY3RJRClcbiAgICAgIHJldHVybiA3O1xuICAgIHJldHVybiAzOyAvLyBvYmplY3RcblxuICAgIC8vIFhYWCBzdXBwb3J0IHNvbWUvYWxsIG9mIHRoZXNlOlxuICAgIC8vIDE0LCBzeW1ib2xcbiAgICAvLyAxNSwgamF2YXNjcmlwdCBjb2RlIHdpdGggc2NvcGVcbiAgICAvLyAxNiwgMTg6IDMyLWJpdC82NC1iaXQgaW50ZWdlclxuICAgIC8vIDE3LCB0aW1lc3RhbXBcbiAgICAvLyAyNTUsIG1pbmtleVxuICAgIC8vIDEyNywgbWF4a2V5XG4gIH0sXG5cbiAgLy8gZGVlcCBlcXVhbGl0eSB0ZXN0OiB1c2UgZm9yIGxpdGVyYWwgZG9jdW1lbnQgYW5kIGFycmF5IG1hdGNoZXNcbiAgX2VxdWFsOiBmdW5jdGlvbiAoYSwgYikge1xuICAgIHJldHVybiBFSlNPTi5lcXVhbHMoYSwgYiwge2tleU9yZGVyU2Vuc2l0aXZlOiB0cnVlfSk7XG4gIH0sXG5cbiAgLy8gbWFwcyBhIHR5cGUgY29kZSB0byBhIHZhbHVlIHRoYXQgY2FuIGJlIHVzZWQgdG8gc29ydCB2YWx1ZXMgb2ZcbiAgLy8gZGlmZmVyZW50IHR5cGVzXG4gIF90eXBlb3JkZXI6IGZ1bmN0aW9uICh0KSB7XG4gICAgLy8gaHR0cDovL3d3dy5tb25nb2RiLm9yZy9kaXNwbGF5L0RPQ1MvV2hhdCtpcyt0aGUrQ29tcGFyZStPcmRlcitmb3IrQlNPTitUeXBlc1xuICAgIC8vIFhYWCB3aGF0IGlzIHRoZSBjb3JyZWN0IHNvcnQgcG9zaXRpb24gZm9yIEphdmFzY3JpcHQgY29kZT9cbiAgICAvLyAoJzEwMCcgaW4gdGhlIG1hdHJpeCBiZWxvdylcbiAgICAvLyBYWFggbWlua2V5L21heGtleVxuICAgIHJldHVybiBbLTEsICAvLyAobm90IGEgdHlwZSlcbiAgICAgICAgICAgIDEsICAgLy8gbnVtYmVyXG4gICAgICAgICAgICAyLCAgIC8vIHN0cmluZ1xuICAgICAgICAgICAgMywgICAvLyBvYmplY3RcbiAgICAgICAgICAgIDQsICAgLy8gYXJyYXlcbiAgICAgICAgICAgIDUsICAgLy8gYmluYXJ5XG4gICAgICAgICAgICAtMSwgIC8vIGRlcHJlY2F0ZWRcbiAgICAgICAgICAgIDYsICAgLy8gT2JqZWN0SURcbiAgICAgICAgICAgIDcsICAgLy8gYm9vbFxuICAgICAgICAgICAgOCwgICAvLyBEYXRlXG4gICAgICAgICAgICAwLCAgIC8vIG51bGxcbiAgICAgICAgICAgIDksICAgLy8gUmVnRXhwXG4gICAgICAgICAgICAtMSwgIC8vIGRlcHJlY2F0ZWRcbiAgICAgICAgICAgIDEwMCwgLy8gSlMgY29kZVxuICAgICAgICAgICAgMiwgICAvLyBkZXByZWNhdGVkIChzeW1ib2wpXG4gICAgICAgICAgICAxMDAsIC8vIEpTIGNvZGVcbiAgICAgICAgICAgIDEsICAgLy8gMzItYml0IGludFxuICAgICAgICAgICAgOCwgICAvLyBNb25nbyB0aW1lc3RhbXBcbiAgICAgICAgICAgIDEgICAgLy8gNjQtYml0IGludFxuICAgICAgICAgICBdW3RdO1xuICB9LFxuXG4gIC8vIGNvbXBhcmUgdHdvIHZhbHVlcyBvZiB1bmtub3duIHR5cGUgYWNjb3JkaW5nIHRvIEJTT04gb3JkZXJpbmdcbiAgLy8gc2VtYW50aWNzLiAoYXMgYW4gZXh0ZW5zaW9uLCBjb25zaWRlciAndW5kZWZpbmVkJyB0byBiZSBsZXNzIHRoYW5cbiAgLy8gYW55IG90aGVyIHZhbHVlLikgcmV0dXJuIG5lZ2F0aXZlIGlmIGEgaXMgbGVzcywgcG9zaXRpdmUgaWYgYiBpc1xuICAvLyBsZXNzLCBvciAwIGlmIGVxdWFsXG4gIF9jbXA6IGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgaWYgKGEgPT09IHVuZGVmaW5lZClcbiAgICAgIHJldHVybiBiID09PSB1bmRlZmluZWQgPyAwIDogLTE7XG4gICAgaWYgKGIgPT09IHVuZGVmaW5lZClcbiAgICAgIHJldHVybiAxO1xuICAgIHZhciB0YSA9IExvY2FsQ29sbGVjdGlvbi5fZi5fdHlwZShhKTtcbiAgICB2YXIgdGIgPSBMb2NhbENvbGxlY3Rpb24uX2YuX3R5cGUoYik7XG4gICAgdmFyIG9hID0gTG9jYWxDb2xsZWN0aW9uLl9mLl90eXBlb3JkZXIodGEpO1xuICAgIHZhciBvYiA9IExvY2FsQ29sbGVjdGlvbi5fZi5fdHlwZW9yZGVyKHRiKTtcbiAgICBpZiAob2EgIT09IG9iKVxuICAgICAgcmV0dXJuIG9hIDwgb2IgPyAtMSA6IDE7XG4gICAgaWYgKHRhICE9PSB0YilcbiAgICAgIC8vIFhYWCBuZWVkIHRvIGltcGxlbWVudCB0aGlzIGlmIHdlIGltcGxlbWVudCBTeW1ib2wgb3IgaW50ZWdlcnMsIG9yXG4gICAgICAvLyBUaW1lc3RhbXBcbiAgICAgIHRocm93IEVycm9yKFwiTWlzc2luZyB0eXBlIGNvZXJjaW9uIGxvZ2ljIGluIF9jbXBcIik7XG4gICAgaWYgKHRhID09PSA3KSB7IC8vIE9iamVjdElEXG4gICAgICAvLyBDb252ZXJ0IHRvIHN0cmluZy5cbiAgICAgIHRhID0gdGIgPSAyO1xuICAgICAgYSA9IGEudG9IZXhTdHJpbmcoKTtcbiAgICAgIGIgPSBiLnRvSGV4U3RyaW5nKCk7XG4gICAgfVxuICAgIGlmICh0YSA9PT0gOSkgeyAvLyBEYXRlXG4gICAgICAvLyBDb252ZXJ0IHRvIG1pbGxpcy5cbiAgICAgIHRhID0gdGIgPSAxO1xuICAgICAgYSA9IGEuZ2V0VGltZSgpO1xuICAgICAgYiA9IGIuZ2V0VGltZSgpO1xuICAgIH1cblxuICAgIGlmICh0YSA9PT0gMSkgLy8gZG91YmxlXG4gICAgICByZXR1cm4gYSAtIGI7XG4gICAgaWYgKHRiID09PSAyKSAvLyBzdHJpbmdcbiAgICAgIHJldHVybiBhIDwgYiA/IC0xIDogKGEgPT09IGIgPyAwIDogMSk7XG4gICAgaWYgKHRhID09PSAzKSB7IC8vIE9iamVjdFxuICAgICAgLy8gdGhpcyBjb3VsZCBiZSBtdWNoIG1vcmUgZWZmaWNpZW50IGluIHRoZSBleHBlY3RlZCBjYXNlIC4uLlxuICAgICAgdmFyIHRvX2FycmF5ID0gZnVuY3Rpb24gKG9iaikge1xuICAgICAgICB2YXIgcmV0ID0gW107XG4gICAgICAgIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICAgICAgICByZXQucHVzaChrZXkpO1xuICAgICAgICAgIHJldC5wdXNoKG9ialtrZXldKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgfTtcbiAgICAgIHJldHVybiBMb2NhbENvbGxlY3Rpb24uX2YuX2NtcCh0b19hcnJheShhKSwgdG9fYXJyYXkoYikpO1xuICAgIH1cbiAgICBpZiAodGEgPT09IDQpIHsgLy8gQXJyYXlcbiAgICAgIGZvciAodmFyIGkgPSAwOyA7IGkrKykge1xuICAgICAgICBpZiAoaSA9PT0gYS5sZW5ndGgpXG4gICAgICAgICAgcmV0dXJuIChpID09PSBiLmxlbmd0aCkgPyAwIDogLTE7XG4gICAgICAgIGlmIChpID09PSBiLmxlbmd0aClcbiAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgdmFyIHMgPSBMb2NhbENvbGxlY3Rpb24uX2YuX2NtcChhW2ldLCBiW2ldKTtcbiAgICAgICAgaWYgKHMgIT09IDApXG4gICAgICAgICAgcmV0dXJuIHM7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICh0YSA9PT0gNSkgeyAvLyBiaW5hcnlcbiAgICAgIC8vIFN1cnByaXNpbmdseSwgYSBzbWFsbCBiaW5hcnkgYmxvYiBpcyBhbHdheXMgbGVzcyB0aGFuIGEgbGFyZ2Ugb25lIGluXG4gICAgICAvLyBNb25nby5cbiAgICAgIGlmIChhLmxlbmd0aCAhPT0gYi5sZW5ndGgpXG4gICAgICAgIHJldHVybiBhLmxlbmd0aCAtIGIubGVuZ3RoO1xuICAgICAgZm9yIChpID0gMDsgaSA8IGEubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGFbaV0gPCBiW2ldKVxuICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgaWYgKGFbaV0gPiBiW2ldKVxuICAgICAgICAgIHJldHVybiAxO1xuICAgICAgfVxuICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICAgIGlmICh0YSA9PT0gOCkgeyAvLyBib29sZWFuXG4gICAgICBpZiAoYSkgcmV0dXJuIGIgPyAwIDogMTtcbiAgICAgIHJldHVybiBiID8gLTEgOiAwO1xuICAgIH1cbiAgICBpZiAodGEgPT09IDEwKSAvLyBudWxsXG4gICAgICByZXR1cm4gMDtcbiAgICBpZiAodGEgPT09IDExKSAvLyByZWdleHBcbiAgICAgIHRocm93IEVycm9yKFwiU29ydGluZyBub3Qgc3VwcG9ydGVkIG9uIHJlZ3VsYXIgZXhwcmVzc2lvblwiKTsgLy8gWFhYXG4gICAgLy8gMTM6IGphdmFzY3JpcHQgY29kZVxuICAgIC8vIDE0OiBzeW1ib2xcbiAgICAvLyAxNTogamF2YXNjcmlwdCBjb2RlIHdpdGggc2NvcGVcbiAgICAvLyAxNjogMzItYml0IGludGVnZXJcbiAgICAvLyAxNzogdGltZXN0YW1wXG4gICAgLy8gMTg6IDY0LWJpdCBpbnRlZ2VyXG4gICAgLy8gMjU1OiBtaW5rZXlcbiAgICAvLyAxMjc6IG1heGtleVxuICAgIGlmICh0YSA9PT0gMTMpIC8vIGphdmFzY3JpcHQgY29kZVxuICAgICAgdGhyb3cgRXJyb3IoXCJTb3J0aW5nIG5vdCBzdXBwb3J0ZWQgb24gSmF2YXNjcmlwdCBjb2RlXCIpOyAvLyBYWFhcbiAgICB0aHJvdyBFcnJvcihcIlVua25vd24gdHlwZSB0byBzb3J0XCIpO1xuICB9XG59O1xuXG4vLyBGb3IgdW5pdCB0ZXN0cy4gVHJ1ZSBpZiB0aGUgZ2l2ZW4gZG9jdW1lbnQgbWF0Y2hlcyB0aGUgZ2l2ZW5cbi8vIHNlbGVjdG9yLlxuTG9jYWxDb2xsZWN0aW9uLl9tYXRjaGVzID0gZnVuY3Rpb24gKHNlbGVjdG9yLCBkb2MpIHtcbiAgcmV0dXJuIChMb2NhbENvbGxlY3Rpb24uX2NvbXBpbGVTZWxlY3RvcihzZWxlY3RvcikpKGRvYyk7XG59O1xuXG4vLyBfbWFrZUxvb2t1cEZ1bmN0aW9uKGtleSkgcmV0dXJucyBhIGxvb2t1cCBmdW5jdGlvbi5cbi8vXG4vLyBBIGxvb2t1cCBmdW5jdGlvbiB0YWtlcyBpbiBhIGRvY3VtZW50IGFuZCByZXR1cm5zIGFuIGFycmF5IG9mIG1hdGNoaW5nXG4vLyB2YWx1ZXMuICBUaGlzIGFycmF5IGhhcyBtb3JlIHRoYW4gb25lIGVsZW1lbnQgaWYgYW55IHNlZ21lbnQgb2YgdGhlIGtleSBvdGhlclxuLy8gdGhhbiB0aGUgbGFzdCBvbmUgaXMgYW4gYXJyYXkuICBpZSwgYW55IGFycmF5cyBmb3VuZCB3aGVuIGRvaW5nIG5vbi1maW5hbFxuLy8gbG9va3VwcyByZXN1bHQgaW4gdGhpcyBmdW5jdGlvbiBcImJyYW5jaGluZ1wiOyBlYWNoIGVsZW1lbnQgaW4gdGhlIHJldHVybmVkXG4vLyBhcnJheSByZXByZXNlbnRzIHRoZSB2YWx1ZSBmb3VuZCBhdCB0aGlzIGJyYW5jaC4gSWYgYW55IGJyYW5jaCBkb2Vzbid0IGhhdmUgYVxuLy8gZmluYWwgdmFsdWUgZm9yIHRoZSBmdWxsIGtleSwgaXRzIGVsZW1lbnQgaW4gdGhlIHJldHVybmVkIGxpc3Qgd2lsbCBiZVxuLy8gdW5kZWZpbmVkLiBJdCBhbHdheXMgcmV0dXJucyBhIG5vbi1lbXB0eSBhcnJheS5cbi8vXG4vLyBfbWFrZUxvb2t1cEZ1bmN0aW9uKCdhLngnKSh7YToge3g6IDF9fSkgcmV0dXJucyBbMV1cbi8vIF9tYWtlTG9va3VwRnVuY3Rpb24oJ2EueCcpKHthOiB7eDogWzFdfX0pIHJldHVybnMgW1sxXV1cbi8vIF9tYWtlTG9va3VwRnVuY3Rpb24oJ2EueCcpKHthOiA1fSkgIHJldHVybnMgW3VuZGVmaW5lZF1cbi8vIF9tYWtlTG9va3VwRnVuY3Rpb24oJ2EueCcpKHthOiBbe3g6IDF9LFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7eDogWzJdfSxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3k6IDN9XX0pXG4vLyAgIHJldHVybnMgWzEsIFsyXSwgdW5kZWZpbmVkXVxuTG9jYWxDb2xsZWN0aW9uLl9tYWtlTG9va3VwRnVuY3Rpb24gPSBmdW5jdGlvbiAoa2V5KSB7XG4gIHZhciBkb3RMb2NhdGlvbiA9IGtleS5pbmRleE9mKCcuJyk7XG4gIHZhciBmaXJzdCwgbG9va3VwUmVzdCwgbmV4dElzTnVtZXJpYztcbiAgaWYgKGRvdExvY2F0aW9uID09PSAtMSkge1xuICAgIGZpcnN0ID0ga2V5O1xuICB9IGVsc2Uge1xuICAgIGZpcnN0ID0ga2V5LnN1YnN0cigwLCBkb3RMb2NhdGlvbik7XG4gICAgdmFyIHJlc3QgPSBrZXkuc3Vic3RyKGRvdExvY2F0aW9uICsgMSk7XG4gICAgbG9va3VwUmVzdCA9IExvY2FsQ29sbGVjdGlvbi5fbWFrZUxvb2t1cEZ1bmN0aW9uKHJlc3QpO1xuICAgIC8vIElzIHRoZSBuZXh0IChwZXJoYXBzIGZpbmFsKSBwaWVjZSBudW1lcmljIChpZSwgYW4gYXJyYXkgbG9va3VwPylcbiAgICBuZXh0SXNOdW1lcmljID0gL15cXGQrKFxcLnwkKS8udGVzdChyZXN0KTtcbiAgfVxuXG4gIHJldHVybiBmdW5jdGlvbiAoZG9jKSB7XG4gICAgaWYgKGRvYyA9PSBudWxsKSAgLy8gbnVsbCBvciB1bmRlZmluZWRcbiAgICAgIHJldHVybiBbdW5kZWZpbmVkXTtcbiAgICB2YXIgZmlyc3RMZXZlbCA9IGRvY1tmaXJzdF07XG5cbiAgICAvLyBXZSBkb24ndCBcImJyYW5jaFwiIGF0IHRoZSBmaW5hbCBsZXZlbC5cbiAgICBpZiAoIWxvb2t1cFJlc3QpXG4gICAgICByZXR1cm4gW2ZpcnN0TGV2ZWxdO1xuXG4gICAgLy8gSXQncyBhbiBlbXB0eSBhcnJheSwgYW5kIHdlJ3JlIG5vdCBkb25lOiB3ZSB3b24ndCBmaW5kIGFueXRoaW5nLlxuICAgIGlmIChpc0FycmF5KGZpcnN0TGV2ZWwpICYmIGZpcnN0TGV2ZWwubGVuZ3RoID09PSAwKVxuICAgICAgcmV0dXJuIFt1bmRlZmluZWRdO1xuXG4gICAgLy8gRm9yIGVhY2ggcmVzdWx0IGF0IHRoaXMgbGV2ZWwsIGZpbmlzaCB0aGUgbG9va3VwIG9uIHRoZSByZXN0IG9mIHRoZSBrZXksXG4gICAgLy8gYW5kIHJldHVybiBldmVyeXRoaW5nIHdlIGZpbmQuIEFsc28sIGlmIHRoZSBuZXh0IHJlc3VsdCBpcyBhIG51bWJlcixcbiAgICAvLyBkb24ndCBicmFuY2ggaGVyZS5cbiAgICAvL1xuICAgIC8vIFRlY2huaWNhbGx5LCBpbiBNb25nb0RCLCB3ZSBzaG91bGQgYmUgYWJsZSB0byBoYW5kbGUgdGhlIGNhc2Ugd2hlcmVcbiAgICAvLyBvYmplY3RzIGhhdmUgbnVtZXJpYyBrZXlzLCBidXQgTW9uZ28gZG9lc24ndCBhY3R1YWxseSBoYW5kbGUgdGhpc1xuICAgIC8vIGNvbnNpc3RlbnRseSB5ZXQgaXRzZWxmLCBzZWUgZWdcbiAgICAvLyBodHRwczovL2ppcmEubW9uZ29kYi5vcmcvYnJvd3NlL1NFUlZFUi0yODk4XG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL21vbmdvZGIvbW9uZ28vYmxvYi9tYXN0ZXIvanN0ZXN0cy9hcnJheV9tYXRjaDIuanNcbiAgICBpZiAoIWlzQXJyYXkoZmlyc3RMZXZlbCkgfHwgbmV4dElzTnVtZXJpYylcbiAgICAgIGZpcnN0TGV2ZWwgPSBbZmlyc3RMZXZlbF07XG4gICAgcmV0dXJuIEFycmF5LnByb3RvdHlwZS5jb25jYXQuYXBwbHkoW10sIF8ubWFwKGZpcnN0TGV2ZWwsIGxvb2t1cFJlc3QpKTtcbiAgfTtcbn07XG5cbi8vIFRoZSBtYWluIGNvbXBpbGF0aW9uIGZ1bmN0aW9uIGZvciBhIGdpdmVuIHNlbGVjdG9yLlxudmFyIGNvbXBpbGVEb2N1bWVudFNlbGVjdG9yID0gZnVuY3Rpb24gKGRvY1NlbGVjdG9yKSB7XG4gIHZhciBwZXJLZXlTZWxlY3RvcnMgPSBbXTtcbiAgXy5lYWNoKGRvY1NlbGVjdG9yLCBmdW5jdGlvbiAoc3ViU2VsZWN0b3IsIGtleSkge1xuICAgIGlmIChrZXkuc3Vic3RyKDAsIDEpID09PSAnJCcpIHtcbiAgICAgIC8vIE91dGVyIG9wZXJhdG9ycyBhcmUgZWl0aGVyIGxvZ2ljYWwgb3BlcmF0b3JzICh0aGV5IHJlY3Vyc2UgYmFjayBpbnRvXG4gICAgICAvLyB0aGlzIGZ1bmN0aW9uKSwgb3IgJHdoZXJlLlxuICAgICAgaWYgKCFfLmhhcyhMT0dJQ0FMX09QRVJBVE9SUywga2V5KSlcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5yZWNvZ25pemVkIGxvZ2ljYWwgb3BlcmF0b3I6IFwiICsga2V5KTtcbiAgICAgIHBlcktleVNlbGVjdG9ycy5wdXNoKExPR0lDQUxfT1BFUkFUT1JTW2tleV0oc3ViU2VsZWN0b3IpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGxvb2tVcEJ5SW5kZXggPSBMb2NhbENvbGxlY3Rpb24uX21ha2VMb29rdXBGdW5jdGlvbihrZXkpO1xuICAgICAgdmFyIHZhbHVlU2VsZWN0b3JGdW5jID0gY29tcGlsZVZhbHVlU2VsZWN0b3Ioc3ViU2VsZWN0b3IpO1xuICAgICAgcGVyS2V5U2VsZWN0b3JzLnB1c2goZnVuY3Rpb24gKGRvYykge1xuICAgICAgICB2YXIgYnJhbmNoVmFsdWVzID0gbG9va1VwQnlJbmRleChkb2MpO1xuICAgICAgICAvLyBXZSBhcHBseSB0aGUgc2VsZWN0b3IgdG8gZWFjaCBcImJyYW5jaGVkXCIgdmFsdWUgYW5kIHJldHVybiB0cnVlIGlmIGFueVxuICAgICAgICAvLyBtYXRjaC4gVGhpcyBpc24ndCAxMDAlIGNvbnNpc3RlbnQgd2l0aCBNb25nb0RCOyBlZywgc2VlOlxuICAgICAgICAvLyBodHRwczovL2ppcmEubW9uZ29kYi5vcmcvYnJvd3NlL1NFUlZFUi04NTg1XG4gICAgICAgIHJldHVybiBfLmFueShicmFuY2hWYWx1ZXMsIHZhbHVlU2VsZWN0b3JGdW5jKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfSk7XG5cblxuICByZXR1cm4gZnVuY3Rpb24gKGRvYykge1xuICAgIHJldHVybiBfLmFsbChwZXJLZXlTZWxlY3RvcnMsIGZ1bmN0aW9uIChmKSB7XG4gICAgICByZXR1cm4gZihkb2MpO1xuICAgIH0pO1xuICB9O1xufTtcblxuLy8gR2l2ZW4gYSBzZWxlY3RvciwgcmV0dXJuIGEgZnVuY3Rpb24gdGhhdCB0YWtlcyBvbmUgYXJndW1lbnQsIGFcbi8vIGRvY3VtZW50LCBhbmQgcmV0dXJucyB0cnVlIGlmIHRoZSBkb2N1bWVudCBtYXRjaGVzIHRoZSBzZWxlY3Rvcixcbi8vIGVsc2UgZmFsc2UuXG5Mb2NhbENvbGxlY3Rpb24uX2NvbXBpbGVTZWxlY3RvciA9IGZ1bmN0aW9uIChzZWxlY3Rvcikge1xuICAvLyB5b3UgY2FuIHBhc3MgYSBsaXRlcmFsIGZ1bmN0aW9uIGluc3RlYWQgb2YgYSBzZWxlY3RvclxuICBpZiAoc2VsZWN0b3IgaW5zdGFuY2VvZiBGdW5jdGlvbilcbiAgICByZXR1cm4gZnVuY3Rpb24gKGRvYykge3JldHVybiBzZWxlY3Rvci5jYWxsKGRvYyk7fTtcblxuICAvLyBzaG9ydGhhbmQgLS0gc2NhbGFycyBtYXRjaCBfaWRcbiAgaWYgKExvY2FsQ29sbGVjdGlvbi5fc2VsZWN0b3JJc0lkKHNlbGVjdG9yKSkge1xuICAgIHJldHVybiBmdW5jdGlvbiAoZG9jKSB7XG4gICAgICByZXR1cm4gRUpTT04uZXF1YWxzKGRvYy5faWQsIHNlbGVjdG9yKTtcbiAgICB9O1xuICB9XG5cbiAgLy8gcHJvdGVjdCBhZ2FpbnN0IGRhbmdlcm91cyBzZWxlY3RvcnMuICBmYWxzZXkgYW5kIHtfaWQ6IGZhbHNleX0gYXJlIGJvdGhcbiAgLy8gbGlrZWx5IHByb2dyYW1tZXIgZXJyb3IsIGFuZCBub3Qgd2hhdCB5b3Ugd2FudCwgcGFydGljdWxhcmx5IGZvclxuICAvLyBkZXN0cnVjdGl2ZSBvcGVyYXRpb25zLlxuICBpZiAoIXNlbGVjdG9yIHx8ICgoJ19pZCcgaW4gc2VsZWN0b3IpICYmICFzZWxlY3Rvci5faWQpKVxuICAgIHJldHVybiBmdW5jdGlvbiAoZG9jKSB7cmV0dXJuIGZhbHNlO307XG5cbiAgLy8gVG9wIGxldmVsIGNhbid0IGJlIGFuIGFycmF5IG9yIHRydWUgb3IgYmluYXJ5LlxuICBpZiAodHlwZW9mKHNlbGVjdG9yKSA9PT0gJ2Jvb2xlYW4nIHx8IGlzQXJyYXkoc2VsZWN0b3IpIHx8XG4gICAgICBFSlNPTi5pc0JpbmFyeShzZWxlY3RvcikpXG4gICAgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBzZWxlY3RvcjogXCIgKyBzZWxlY3Rvcik7XG5cbiAgcmV0dXJuIGNvbXBpbGVEb2N1bWVudFNlbGVjdG9yKHNlbGVjdG9yKTtcbn07XG5cbi8vIEdpdmUgYSBzb3J0IHNwZWMsIHdoaWNoIGNhbiBiZSBpbiBhbnkgb2YgdGhlc2UgZm9ybXM6XG4vLyAgIHtcImtleTFcIjogMSwgXCJrZXkyXCI6IC0xfVxuLy8gICBbW1wia2V5MVwiLCBcImFzY1wiXSwgW1wia2V5MlwiLCBcImRlc2NcIl1dXG4vLyAgIFtcImtleTFcIiwgW1wia2V5MlwiLCBcImRlc2NcIl1dXG4vL1xuLy8gKC4uIHdpdGggdGhlIGZpcnN0IGZvcm0gYmVpbmcgZGVwZW5kZW50IG9uIHRoZSBrZXkgZW51bWVyYXRpb25cbi8vIGJlaGF2aW9yIG9mIHlvdXIgamF2YXNjcmlwdCBWTSwgd2hpY2ggdXN1YWxseSBkb2VzIHdoYXQgeW91IG1lYW4gaW5cbi8vIHRoaXMgY2FzZSBpZiB0aGUga2V5IG5hbWVzIGRvbid0IGxvb2sgbGlrZSBpbnRlZ2VycyAuLilcbi8vXG4vLyByZXR1cm4gYSBmdW5jdGlvbiB0aGF0IHRha2VzIHR3byBvYmplY3RzLCBhbmQgcmV0dXJucyAtMSBpZiB0aGVcbi8vIGZpcnN0IG9iamVjdCBjb21lcyBmaXJzdCBpbiBvcmRlciwgMSBpZiB0aGUgc2Vjb25kIG9iamVjdCBjb21lc1xuLy8gZmlyc3QsIG9yIDAgaWYgbmVpdGhlciBvYmplY3QgY29tZXMgYmVmb3JlIHRoZSBvdGhlci5cblxuTG9jYWxDb2xsZWN0aW9uLl9jb21waWxlU29ydCA9IGZ1bmN0aW9uIChzcGVjKSB7XG4gIHZhciBzb3J0U3BlY1BhcnRzID0gW107XG5cbiAgaWYgKHNwZWMgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3BlYy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHR5cGVvZiBzcGVjW2ldID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIHNvcnRTcGVjUGFydHMucHVzaCh7XG4gICAgICAgICAgbG9va3VwOiBMb2NhbENvbGxlY3Rpb24uX21ha2VMb29rdXBGdW5jdGlvbihzcGVjW2ldKSxcbiAgICAgICAgICBhc2NlbmRpbmc6IHRydWVcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzb3J0U3BlY1BhcnRzLnB1c2goe1xuICAgICAgICAgIGxvb2t1cDogTG9jYWxDb2xsZWN0aW9uLl9tYWtlTG9va3VwRnVuY3Rpb24oc3BlY1tpXVswXSksXG4gICAgICAgICAgYXNjZW5kaW5nOiBzcGVjW2ldWzFdICE9PSBcImRlc2NcIlxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSBpZiAodHlwZW9mIHNwZWMgPT09IFwib2JqZWN0XCIpIHtcbiAgICBmb3IgKHZhciBrZXkgaW4gc3BlYykge1xuICAgICAgc29ydFNwZWNQYXJ0cy5wdXNoKHtcbiAgICAgICAgbG9va3VwOiBMb2NhbENvbGxlY3Rpb24uX21ha2VMb29rdXBGdW5jdGlvbihrZXkpLFxuICAgICAgICBhc2NlbmRpbmc6IHNwZWNba2V5XSA+PSAwXG4gICAgICB9KTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgRXJyb3IoXCJCYWQgc29ydCBzcGVjaWZpY2F0aW9uOiBcIiwgSlNPTi5zdHJpbmdpZnkoc3BlYykpO1xuICB9XG5cbiAgaWYgKHNvcnRTcGVjUGFydHMubGVuZ3RoID09PSAwKVxuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7cmV0dXJuIDA7fTtcblxuICAvLyByZWR1Y2VWYWx1ZSB0YWtlcyBpbiBhbGwgdGhlIHBvc3NpYmxlIHZhbHVlcyBmb3IgdGhlIHNvcnQga2V5IGFsb25nIHZhcmlvdXNcbiAgLy8gYnJhbmNoZXMsIGFuZCByZXR1cm5zIHRoZSBtaW4gb3IgbWF4IHZhbHVlIChhY2NvcmRpbmcgdG8gdGhlIGJvb2xcbiAgLy8gZmluZE1pbikuIEVhY2ggdmFsdWUgY2FuIGl0c2VsZiBiZSBhbiBhcnJheSwgYW5kIHdlIGxvb2sgYXQgaXRzIHZhbHVlc1xuICAvLyB0b28uIChpZSwgd2UgZG8gYSBzaW5nbGUgbGV2ZWwgb2YgZmxhdHRlbmluZyBvbiBicmFuY2hWYWx1ZXMsIHRoZW4gZmluZCB0aGVcbiAgLy8gbWluL21heC4pXG4gIHZhciByZWR1Y2VWYWx1ZSA9IGZ1bmN0aW9uIChicmFuY2hWYWx1ZXMsIGZpbmRNaW4pIHtcbiAgICB2YXIgcmVkdWNlZDtcbiAgICB2YXIgZmlyc3QgPSB0cnVlO1xuICAgIC8vIEl0ZXJhdGUgb3ZlciBhbGwgdGhlIHZhbHVlcyBmb3VuZCBpbiBhbGwgdGhlIGJyYW5jaGVzLCBhbmQgaWYgYSB2YWx1ZSBpc1xuICAgIC8vIGFuIGFycmF5IGl0c2VsZiwgaXRlcmF0ZSBvdmVyIHRoZSB2YWx1ZXMgaW4gdGhlIGFycmF5IHNlcGFyYXRlbHkuXG4gICAgXy5lYWNoKGJyYW5jaFZhbHVlcywgZnVuY3Rpb24gKGJyYW5jaFZhbHVlKSB7XG4gICAgICAvLyBWYWx1ZSBub3QgYW4gYXJyYXk/IFByZXRlbmQgaXQgaXMuXG4gICAgICBpZiAoIWlzQXJyYXkoYnJhbmNoVmFsdWUpKVxuICAgICAgICBicmFuY2hWYWx1ZSA9IFticmFuY2hWYWx1ZV07XG4gICAgICAvLyBWYWx1ZSBpcyBhbiBlbXB0eSBhcnJheT8gUHJldGVuZCBpdCB3YXMgbWlzc2luZywgc2luY2UgdGhhdCdzIHdoZXJlIGl0XG4gICAgICAvLyBzaG91bGQgYmUgc29ydGVkLlxuICAgICAgaWYgKGlzQXJyYXkoYnJhbmNoVmFsdWUpICYmIGJyYW5jaFZhbHVlLmxlbmd0aCA9PT0gMClcbiAgICAgICAgYnJhbmNoVmFsdWUgPSBbdW5kZWZpbmVkXTtcbiAgICAgIF8uZWFjaChicmFuY2hWYWx1ZSwgZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIC8vIFdlIHNob3VsZCBnZXQgaGVyZSBhdCBsZWFzdCBvbmNlOiBsb29rdXAgZnVuY3Rpb25zIHJldHVybiBub24tZW1wdHlcbiAgICAgICAgLy8gYXJyYXlzLCBzbyB0aGUgb3V0ZXIgbG9vcCBydW5zIGF0IGxlYXN0IG9uY2UsIGFuZCB3ZSBwcmV2ZW50ZWRcbiAgICAgICAgLy8gYnJhbmNoVmFsdWUgZnJvbSBiZWluZyBhbiBlbXB0eSBhcnJheS5cbiAgICAgICAgaWYgKGZpcnN0KSB7XG4gICAgICAgICAgcmVkdWNlZCA9IHZhbHVlO1xuICAgICAgICAgIGZpcnN0ID0gZmFsc2U7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gQ29tcGFyZSB0aGUgdmFsdWUgd2UgZm91bmQgdG8gdGhlIHZhbHVlIHdlIGZvdW5kIHNvIGZhciwgc2F2aW5nIGl0XG4gICAgICAgICAgLy8gaWYgaXQncyBsZXNzIChmb3IgYW4gYXNjZW5kaW5nIHNvcnQpIG9yIG1vcmUgKGZvciBhIGRlc2NlbmRpbmdcbiAgICAgICAgICAvLyBzb3J0KS5cbiAgICAgICAgICB2YXIgY21wID0gTG9jYWxDb2xsZWN0aW9uLl9mLl9jbXAocmVkdWNlZCwgdmFsdWUpO1xuICAgICAgICAgIGlmICgoZmluZE1pbiAmJiBjbXAgPiAwKSB8fCAoIWZpbmRNaW4gJiYgY21wIDwgMCkpXG4gICAgICAgICAgICByZWR1Y2VkID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIHJldHVybiByZWR1Y2VkO1xuICB9O1xuXG4gIHJldHVybiBmdW5jdGlvbiAoYSwgYikge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc29ydFNwZWNQYXJ0cy5sZW5ndGg7ICsraSkge1xuICAgICAgdmFyIHNwZWNQYXJ0ID0gc29ydFNwZWNQYXJ0c1tpXTtcbiAgICAgIHZhciBhVmFsdWUgPSByZWR1Y2VWYWx1ZShzcGVjUGFydC5sb29rdXAoYSksIHNwZWNQYXJ0LmFzY2VuZGluZyk7XG4gICAgICB2YXIgYlZhbHVlID0gcmVkdWNlVmFsdWUoc3BlY1BhcnQubG9va3VwKGIpLCBzcGVjUGFydC5hc2NlbmRpbmcpO1xuICAgICAgdmFyIGNvbXBhcmUgPSBMb2NhbENvbGxlY3Rpb24uX2YuX2NtcChhVmFsdWUsIGJWYWx1ZSk7XG4gICAgICBpZiAoY29tcGFyZSAhPT0gMClcbiAgICAgICAgcmV0dXJuIHNwZWNQYXJ0LmFzY2VuZGluZyA/IGNvbXBhcmUgOiAtY29tcGFyZTtcbiAgICB9O1xuICAgIHJldHVybiAwO1xuICB9O1xufTtcblxuZXhwb3J0cy5jb21waWxlRG9jdW1lbnRTZWxlY3RvciA9IGNvbXBpbGVEb2N1bWVudFNlbGVjdG9yO1xuZXhwb3J0cy5jb21waWxlU29ydCA9IExvY2FsQ29sbGVjdGlvbi5fY29tcGlsZVNvcnQ7IiwiIyBVdGlsaXRpZXMgZm9yIGRiIGhhbmRsaW5nXG5cbmNvbXBpbGVEb2N1bWVudFNlbGVjdG9yID0gcmVxdWlyZSgnLi9zZWxlY3RvcicpLmNvbXBpbGVEb2N1bWVudFNlbGVjdG9yXG5jb21waWxlU29ydCA9IHJlcXVpcmUoJy4vc2VsZWN0b3InKS5jb21waWxlU29ydFxuR2VvSlNPTiA9IHJlcXVpcmUgJy4uL0dlb0pTT04nXG5cblxuZXhwb3J0cy5wcm9jZXNzRmluZCA9IChpdGVtcywgc2VsZWN0b3IsIG9wdGlvbnMpIC0+XG4gIGZpbHRlcmVkID0gXy5maWx0ZXIoXy52YWx1ZXMoaXRlbXMpLCBjb21waWxlRG9jdW1lbnRTZWxlY3RvcihzZWxlY3RvcikpXG5cbiAgIyBIYW5kbGUgZ2Vvc3BhdGlhbCBvcGVyYXRvcnNcbiAgZmlsdGVyZWQgPSBwcm9jZXNzTmVhck9wZXJhdG9yKHNlbGVjdG9yLCBmaWx0ZXJlZClcbiAgZmlsdGVyZWQgPSBwcm9jZXNzR2VvSW50ZXJzZWN0c09wZXJhdG9yKHNlbGVjdG9yLCBmaWx0ZXJlZClcblxuICBpZiBvcHRpb25zIGFuZCBvcHRpb25zLnNvcnQgXG4gICAgZmlsdGVyZWQuc29ydChjb21waWxlU29ydChvcHRpb25zLnNvcnQpKVxuXG4gIGlmIG9wdGlvbnMgYW5kIG9wdGlvbnMubGltaXRcbiAgICBmaWx0ZXJlZCA9IF8uZmlyc3QgZmlsdGVyZWQsIG9wdGlvbnMubGltaXRcblxuICAjIENsb25lIHRvIHByZXZlbnQgYWNjaWRlbnRhbCB1cGRhdGVzLCBvciBhcHBseSBmaWVsZHMgaWYgcHJlc2VudFxuICBpZiBvcHRpb25zIGFuZCBvcHRpb25zLmZpZWxkc1xuICAgIGlmIF8uZmlyc3QoXy52YWx1ZXMob3B0aW9ucy5maWVsZHMpKSA9PSAxXG4gICAgICAjIEluY2x1ZGUgZmllbGRzXG4gICAgICBmaWx0ZXJlZCA9IF8ubWFwIGZpbHRlcmVkLCAoZG9jKSAtPiBfLnBpY2soZG9jLCBfLmtleXMob3B0aW9ucy5maWVsZHMpLmNvbmNhdChbXCJfaWRcIl0pKVxuICAgIGVsc2VcbiAgICAgICMgRXhjbHVkZSBmaWVsZHNcbiAgICAgIGZpbHRlcmVkID0gXy5tYXAgZmlsdGVyZWQsIChkb2MpIC0+IF8ub21pdChkb2MsIF8ua2V5cyhvcHRpb25zLmZpZWxkcykpXG4gIGVsc2VcbiAgICBmaWx0ZXJlZCA9IF8ubWFwIGZpbHRlcmVkLCAoZG9jKSAtPiBfLmNsb25lRGVlcChkb2MpXG5cbiAgcmV0dXJuIGZpbHRlcmVkXG5cbmV4cG9ydHMuY3JlYXRlVWlkID0gLT4gXG4gICd4eHh4eHh4eHh4eHg0eHh4eXh4eHh4eHh4eHh4eHh4eCcucmVwbGFjZSgvW3h5XS9nLCAoYykgLT5cbiAgICByID0gTWF0aC5yYW5kb20oKSoxNnwwXG4gICAgdiA9IGlmIGMgPT0gJ3gnIHRoZW4gciBlbHNlIChyJjB4M3wweDgpXG4gICAgcmV0dXJuIHYudG9TdHJpbmcoMTYpXG4gICApXG5cbnByb2Nlc3NOZWFyT3BlcmF0b3IgPSAoc2VsZWN0b3IsIGxpc3QpIC0+XG4gIGZvciBrZXksIHZhbHVlIG9mIHNlbGVjdG9yXG4gICAgaWYgdmFsdWU/IGFuZCB2YWx1ZVsnJG5lYXInXVxuICAgICAgZ2VvID0gdmFsdWVbJyRuZWFyJ11bJyRnZW9tZXRyeSddXG4gICAgICBpZiBnZW8udHlwZSAhPSAnUG9pbnQnXG4gICAgICAgIGJyZWFrXG5cbiAgICAgIG5lYXIgPSBuZXcgTC5MYXRMbmcoZ2VvLmNvb3JkaW5hdGVzWzFdLCBnZW8uY29vcmRpbmF0ZXNbMF0pXG5cbiAgICAgIGxpc3QgPSBfLmZpbHRlciBsaXN0LCAoZG9jKSAtPlxuICAgICAgICByZXR1cm4gZG9jW2tleV0gYW5kIGRvY1trZXldLnR5cGUgPT0gJ1BvaW50J1xuXG4gICAgICAjIEdldCBkaXN0YW5jZXNcbiAgICAgIGRpc3RhbmNlcyA9IF8ubWFwIGxpc3QsIChkb2MpIC0+XG4gICAgICAgIHJldHVybiB7IGRvYzogZG9jLCBkaXN0YW5jZTogXG4gICAgICAgICAgbmVhci5kaXN0YW5jZVRvKG5ldyBMLkxhdExuZyhkb2Nba2V5XS5jb29yZGluYXRlc1sxXSwgZG9jW2tleV0uY29vcmRpbmF0ZXNbMF0pKVxuICAgICAgICB9XG5cbiAgICAgICMgRmlsdGVyIG5vbi1wb2ludHNcbiAgICAgIGRpc3RhbmNlcyA9IF8uZmlsdGVyIGRpc3RhbmNlcywgKGl0ZW0pIC0+IGl0ZW0uZGlzdGFuY2UgPj0gMFxuXG4gICAgICAjIFNvcnQgYnkgZGlzdGFuY2VcbiAgICAgIGRpc3RhbmNlcyA9IF8uc29ydEJ5IGRpc3RhbmNlcywgJ2Rpc3RhbmNlJ1xuXG4gICAgICAjIEZpbHRlciBieSBtYXhEaXN0YW5jZVxuICAgICAgaWYgdmFsdWVbJyRuZWFyJ11bJyRtYXhEaXN0YW5jZSddXG4gICAgICAgIGRpc3RhbmNlcyA9IF8uZmlsdGVyIGRpc3RhbmNlcywgKGl0ZW0pIC0+IGl0ZW0uZGlzdGFuY2UgPD0gdmFsdWVbJyRuZWFyJ11bJyRtYXhEaXN0YW5jZSddXG5cbiAgICAgICMgTGltaXQgdG8gMTAwXG4gICAgICBkaXN0YW5jZXMgPSBfLmZpcnN0IGRpc3RhbmNlcywgMTAwXG5cbiAgICAgICMgRXh0cmFjdCBkb2NzXG4gICAgICBsaXN0ID0gXy5wbHVjayBkaXN0YW5jZXMsICdkb2MnXG4gIHJldHVybiBsaXN0XG5cbnByb2Nlc3NHZW9JbnRlcnNlY3RzT3BlcmF0b3IgPSAoc2VsZWN0b3IsIGxpc3QpIC0+XG4gIGZvciBrZXksIHZhbHVlIG9mIHNlbGVjdG9yXG4gICAgaWYgdmFsdWU/IGFuZCB2YWx1ZVsnJGdlb0ludGVyc2VjdHMnXVxuICAgICAgZ2VvID0gdmFsdWVbJyRnZW9JbnRlcnNlY3RzJ11bJyRnZW9tZXRyeSddXG4gICAgICBpZiBnZW8udHlwZSAhPSAnUG9seWdvbidcbiAgICAgICAgYnJlYWtcblxuICAgICAgIyBDaGVjayB3aXRoaW4gZm9yIGVhY2hcbiAgICAgIGxpc3QgPSBfLmZpbHRlciBsaXN0LCAoZG9jKSAtPlxuICAgICAgICAjIFJlamVjdCBub24tcG9pbnRzXG4gICAgICAgIGlmIG5vdCBkb2Nba2V5XSBvciBkb2Nba2V5XS50eXBlICE9ICdQb2ludCdcbiAgICAgICAgICByZXR1cm4gZmFsc2VcblxuICAgICAgICAjIENoZWNrIHBvbHlnb25cbiAgICAgICAgcmV0dXJuIEdlb0pTT04ucG9pbnRJblBvbHlnb24oZG9jW2tleV0sIGdlbylcblxuICByZXR1cm4gbGlzdFxuIiwiUGFnZSA9IHJlcXVpcmUoXCIuLi9QYWdlXCIpXG5Tb3VyY2VQYWdlID0gcmVxdWlyZShcIi4vU291cmNlUGFnZVwiKVxuTG9jYXRpb25GaW5kZXIgPSByZXF1aXJlICcuLi9Mb2NhdGlvbkZpbmRlcidcbkdlb0pTT04gPSByZXF1aXJlICcuLi9HZW9KU09OJ1xuXG5cbiMgTGlzdHMgbmVhcmJ5IGFuZCB1bmxvY2F0ZWQgc291cmNlc1xuIyBPcHRpb25zOiBvblNlbGVjdCAtIGZ1bmN0aW9uIHRvIGNhbGwgd2l0aCBzb3VyY2UgZG9jIHdoZW4gc2VsZWN0ZWRcbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgU291cmNlTGlzdFBhZ2UgZXh0ZW5kcyBQYWdlXG4gIGV2ZW50czogXG4gICAgJ2NsaWNrIHRyLnRhcHBhYmxlJyA6ICdzb3VyY2VDbGlja2VkJ1xuICAgICdjbGljayAjc2VhcmNoX2NhbmNlbCcgOiAnY2FuY2VsU2VhcmNoJ1xuXG4gIGNyZWF0ZTogLT5cbiAgICBAc2V0VGl0bGUgJ05lYXJieSBTb3VyY2VzJ1xuXG4gIGFjdGl2YXRlOiAtPlxuICAgIEAkZWwuaHRtbCB0ZW1wbGF0ZXNbJ3BhZ2VzL1NvdXJjZUxpc3RQYWdlJ10oKVxuICAgIEBuZWFyU291cmNlcyA9IFtdXG4gICAgQHVubG9jYXRlZFNvdXJjZXMgPSBbXVxuXG4gICAgIyBGaW5kIGxvY2F0aW9uXG4gICAgQGxvY2F0aW9uRmluZGVyID0gbmV3IExvY2F0aW9uRmluZGVyKClcbiAgICBAbG9jYXRpb25GaW5kZXIub24oJ2ZvdW5kJywgQGxvY2F0aW9uRm91bmQpLm9uKCdlcnJvcicsIEBsb2NhdGlvbkVycm9yKVxuICAgIEBsb2NhdGlvbkZpbmRlci5nZXRMb2NhdGlvbigpXG4gICAgQCQoXCIjbG9jYXRpb25fbXNnXCIpLnNob3coKVxuXG4gICAgQHNldHVwQnV0dG9uQmFyIFtcbiAgICAgIHsgaWNvbjogXCJzZWFyY2gucG5nXCIsIGNsaWNrOiA9PiBAc2VhcmNoKCkgfVxuICAgICAgeyBpY29uOiBcInBsdXMucG5nXCIsIGNsaWNrOiA9PiBAYWRkU291cmNlKCkgfVxuICAgIF1cblxuICAgICMgUXVlcnkgZGF0YWJhc2UgZm9yIHVubG9jYXRlZCBzb3VyY2VzXG4gICAgaWYgQGxvZ2luXG4gICAgICBAZGIuc291cmNlcy5maW5kKGdlbzogeyAkZXhpc3RzOiBmYWxzZSB9LCB1c2VyOiBAbG9naW4udXNlcikuZmV0Y2ggKHNvdXJjZXMpID0+XG4gICAgICAgIEB1bmxvY2F0ZWRTb3VyY2VzID0gc291cmNlc1xuICAgICAgICBAcmVuZGVyTGlzdCgpXG5cbiAgICBAcGVyZm9ybVNlYXJjaCgpXG5cbiAgYWRkU291cmNlOiAtPlxuICAgIEBwYWdlci5vcGVuUGFnZShyZXF1aXJlKFwiLi9OZXdTb3VyY2VQYWdlXCIpKVxuICAgIFxuICBsb2NhdGlvbkZvdW5kOiAocG9zKSA9PlxuICAgIEAkKFwiI2xvY2F0aW9uX21zZ1wiKS5oaWRlKClcbiAgICBzZWxlY3RvciA9IGdlbzogXG4gICAgICAkbmVhcjogXG4gICAgICAgICRnZW9tZXRyeTogR2VvSlNPTi5wb3NUb1BvaW50KHBvcylcblxuICAgICMgUXVlcnkgZGF0YWJhc2UgZm9yIG5lYXIgc291cmNlc1xuICAgIEBkYi5zb3VyY2VzLmZpbmQoc2VsZWN0b3IsIHsgbGltaXQ6IDEwMCB9KS5mZXRjaCAoc291cmNlcykgPT5cbiAgICAgIEBuZWFyU291cmNlcyA9IHNvdXJjZXNcbiAgICAgIEByZW5kZXJMaXN0KClcblxuICByZW5kZXJMaXN0OiAtPlxuICAgICMgQXBwZW5kIGxvY2F0ZWQgYW5kIHVubG9jYXRlZCBzb3VyY2VzXG4gICAgaWYgbm90IEBzZWFyY2hUZXh0XG4gICAgICBzb3VyY2VzID0gQHVubG9jYXRlZFNvdXJjZXMuY29uY2F0KEBuZWFyU291cmNlcylcbiAgICBlbHNlXG4gICAgICBzb3VyY2VzID0gQHNlYXJjaFNvdXJjZXNcblxuICAgIEAkKFwiI3RhYmxlXCIpLmh0bWwgdGVtcGxhdGVzWydwYWdlcy9Tb3VyY2VMaXN0UGFnZV9pdGVtcyddKHNvdXJjZXM6c291cmNlcylcblxuICBsb2NhdGlvbkVycm9yOiAocG9zKSA9PlxuICAgIEAkKFwiI2xvY2F0aW9uX21zZ1wiKS5oaWRlKClcbiAgICBAcGFnZXIuZmxhc2ggXCJVbmFibGUgdG8gZGV0ZXJtaW5lIGxvY2F0aW9uXCIsIFwiZXJyb3JcIlxuXG4gIHNvdXJjZUNsaWNrZWQ6IChldikgLT5cbiAgICAjIFdyYXAgb25TZWxlY3RcbiAgICBvblNlbGVjdCA9IHVuZGVmaW5lZFxuICAgIGlmIEBvcHRpb25zLm9uU2VsZWN0XG4gICAgICBvblNlbGVjdCA9IChzb3VyY2UpID0+XG4gICAgICAgIEBwYWdlci5jbG9zZVBhZ2UoKVxuICAgICAgICBAb3B0aW9ucy5vblNlbGVjdChzb3VyY2UpXG4gICAgQHBhZ2VyLm9wZW5QYWdlKFNvdXJjZVBhZ2UsIHsgX2lkOiBldi5jdXJyZW50VGFyZ2V0LmlkLCBvblNlbGVjdDogb25TZWxlY3R9KVxuXG4gIHNlYXJjaDogLT5cbiAgICAjIFByb21wdCBmb3Igc2VhcmNoXG4gICAgQHNlYXJjaFRleHQgPSBwcm9tcHQoXCJFbnRlciBzZWFyY2ggdGV4dCBvciBJRCBvZiB3YXRlciBzb3VyY2VcIilcbiAgICBAcGVyZm9ybVNlYXJjaCgpXG5cbiAgcGVyZm9ybVNlYXJjaDogLT5cbiAgICBAJChcIiNzZWFyY2hfYmFyXCIpLnRvZ2dsZShAc2VhcmNoVGV4dCBhbmQgQHNlYXJjaFRleHQubGVuZ3RoPjApXG4gICAgQCQoXCIjc2VhcmNoX3RleHRcIikudGV4dChAc2VhcmNoVGV4dClcbiAgICBpZiBAc2VhcmNoVGV4dFxuICAgICAgIyBJZiBkaWdpdHMsIHNlYXJjaCBmb3IgY29kZVxuICAgICAgaWYgQHNlYXJjaFRleHQubWF0Y2goL15cXGQrJC8pXG4gICAgICAgIHNlbGVjdG9yID0geyBjb2RlOiBAc2VhcmNoVGV4dCB9XG4gICAgICBlbHNlXG4gICAgICAgIHNlbGVjdG9yID0geyAkb3I6IFsgeyBuYW1lOiB7ICRyZWdleCA6IEBzZWFyY2hUZXh0LCAgJG9wdGlvbnM6ICdpJyB9IH0sIHsgZGVzYzogeyAkcmVnZXggOiBAc2VhcmNoVGV4dCwgICRvcHRpb25zOiAnaScgfSB9IF0gfVxuICAgICAgICBcbiAgICAgIEBkYi5zb3VyY2VzLmZpbmQoc2VsZWN0b3IsIHtsaW1pdDogNTB9KS5mZXRjaCAoc291cmNlcykgPT5cbiAgICAgICAgQHNlYXJjaFNvdXJjZXMgPSBzb3VyY2VzXG4gICAgICAgIEByZW5kZXJMaXN0KClcbiAgICBlbHNlXG4gICAgICBAcmVuZGVyTGlzdCgpXG5cbiAgY2FuY2VsU2VhcmNoOiAtPlxuICAgIEBzZWFyY2hUZXh0ID0gXCJcIlxuICAgIEBwZXJmb3JtU2VhcmNoKClcblxuIiwiRUpTT04gPSB7fTsgLy8gR2xvYmFsIVxudmFyIGN1c3RvbVR5cGVzID0ge307XG4vLyBBZGQgYSBjdXN0b20gdHlwZSwgdXNpbmcgYSBtZXRob2Qgb2YgeW91ciBjaG9pY2UgdG8gZ2V0IHRvIGFuZFxuLy8gZnJvbSBhIGJhc2ljIEpTT04tYWJsZSByZXByZXNlbnRhdGlvbi4gIFRoZSBmYWN0b3J5IGFyZ3VtZW50XG4vLyBpcyBhIGZ1bmN0aW9uIG9mIEpTT04tYWJsZSAtLT4geW91ciBvYmplY3Rcbi8vIFRoZSB0eXBlIHlvdSBhZGQgbXVzdCBoYXZlOlxuLy8gLSBBIGNsb25lKCkgbWV0aG9kLCBzbyB0aGF0IE1ldGVvciBjYW4gZGVlcC1jb3B5IGl0IHdoZW4gbmVjZXNzYXJ5LlxuLy8gLSBBIGVxdWFscygpIG1ldGhvZCwgc28gdGhhdCBNZXRlb3IgY2FuIGNvbXBhcmUgaXRcbi8vIC0gQSB0b0pTT05WYWx1ZSgpIG1ldGhvZCwgc28gdGhhdCBNZXRlb3IgY2FuIHNlcmlhbGl6ZSBpdFxuLy8gLSBhIHR5cGVOYW1lKCkgbWV0aG9kLCB0byBzaG93IGhvdyB0byBsb29rIGl0IHVwIGluIG91ciB0eXBlIHRhYmxlLlxuLy8gSXQgaXMgb2theSBpZiB0aGVzZSBtZXRob2RzIGFyZSBtb25rZXktcGF0Y2hlZCBvbi5cbkVKU09OLmFkZFR5cGUgPSBmdW5jdGlvbiAobmFtZSwgZmFjdG9yeSkge1xuICBpZiAoXy5oYXMoY3VzdG9tVHlwZXMsIG5hbWUpKVxuICAgIHRocm93IG5ldyBFcnJvcihcIlR5cGUgXCIgKyBuYW1lICsgXCIgYWxyZWFkeSBwcmVzZW50XCIpO1xuICBjdXN0b21UeXBlc1tuYW1lXSA9IGZhY3Rvcnk7XG59O1xuXG52YXIgYnVpbHRpbkNvbnZlcnRlcnMgPSBbXG4gIHsgLy8gRGF0ZVxuICAgIG1hdGNoSlNPTlZhbHVlOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICByZXR1cm4gXy5oYXMob2JqLCAnJGRhdGUnKSAmJiBfLnNpemUob2JqKSA9PT0gMTtcbiAgICB9LFxuICAgIG1hdGNoT2JqZWN0OiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICByZXR1cm4gb2JqIGluc3RhbmNlb2YgRGF0ZTtcbiAgICB9LFxuICAgIHRvSlNPTlZhbHVlOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICByZXR1cm4geyRkYXRlOiBvYmouZ2V0VGltZSgpfTtcbiAgICB9LFxuICAgIGZyb21KU09OVmFsdWU6IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgIHJldHVybiBuZXcgRGF0ZShvYmouJGRhdGUpO1xuICAgIH1cbiAgfSxcbiAgeyAvLyBCaW5hcnlcbiAgICBtYXRjaEpTT05WYWx1ZTogZnVuY3Rpb24gKG9iaikge1xuICAgICAgcmV0dXJuIF8uaGFzKG9iaiwgJyRiaW5hcnknKSAmJiBfLnNpemUob2JqKSA9PT0gMTtcbiAgICB9LFxuICAgIG1hdGNoT2JqZWN0OiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICByZXR1cm4gdHlwZW9mIFVpbnQ4QXJyYXkgIT09ICd1bmRlZmluZWQnICYmIG9iaiBpbnN0YW5jZW9mIFVpbnQ4QXJyYXlcbiAgICAgICAgfHwgKG9iaiAmJiBfLmhhcyhvYmosICckVWludDhBcnJheVBvbHlmaWxsJykpO1xuICAgIH0sXG4gICAgdG9KU09OVmFsdWU6IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgIHJldHVybiB7JGJpbmFyeTogRUpTT04uX2Jhc2U2NEVuY29kZShvYmopfTtcbiAgICB9LFxuICAgIGZyb21KU09OVmFsdWU6IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgIHJldHVybiBFSlNPTi5fYmFzZTY0RGVjb2RlKG9iai4kYmluYXJ5KTtcbiAgICB9XG4gIH0sXG4gIHsgLy8gRXNjYXBpbmcgb25lIGxldmVsXG4gICAgbWF0Y2hKU09OVmFsdWU6IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgIHJldHVybiBfLmhhcyhvYmosICckZXNjYXBlJykgJiYgXy5zaXplKG9iaikgPT09IDE7XG4gICAgfSxcbiAgICBtYXRjaE9iamVjdDogZnVuY3Rpb24gKG9iaikge1xuICAgICAgaWYgKF8uaXNFbXB0eShvYmopIHx8IF8uc2l6ZShvYmopID4gMikge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICByZXR1cm4gXy5hbnkoYnVpbHRpbkNvbnZlcnRlcnMsIGZ1bmN0aW9uIChjb252ZXJ0ZXIpIHtcbiAgICAgICAgcmV0dXJuIGNvbnZlcnRlci5tYXRjaEpTT05WYWx1ZShvYmopO1xuICAgICAgfSk7XG4gICAgfSxcbiAgICB0b0pTT05WYWx1ZTogZnVuY3Rpb24gKG9iaikge1xuICAgICAgdmFyIG5ld09iaiA9IHt9O1xuICAgICAgXy5lYWNoKG9iaiwgZnVuY3Rpb24gKHZhbHVlLCBrZXkpIHtcbiAgICAgICAgbmV3T2JqW2tleV0gPSBFSlNPTi50b0pTT05WYWx1ZSh2YWx1ZSk7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiB7JGVzY2FwZTogbmV3T2JqfTtcbiAgICB9LFxuICAgIGZyb21KU09OVmFsdWU6IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgIHZhciBuZXdPYmogPSB7fTtcbiAgICAgIF8uZWFjaChvYmouJGVzY2FwZSwgZnVuY3Rpb24gKHZhbHVlLCBrZXkpIHtcbiAgICAgICAgbmV3T2JqW2tleV0gPSBFSlNPTi5mcm9tSlNPTlZhbHVlKHZhbHVlKTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIG5ld09iajtcbiAgICB9XG4gIH0sXG4gIHsgLy8gQ3VzdG9tXG4gICAgbWF0Y2hKU09OVmFsdWU6IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgIHJldHVybiBfLmhhcyhvYmosICckdHlwZScpICYmIF8uaGFzKG9iaiwgJyR2YWx1ZScpICYmIF8uc2l6ZShvYmopID09PSAyO1xuICAgIH0sXG4gICAgbWF0Y2hPYmplY3Q6IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgIHJldHVybiBFSlNPTi5faXNDdXN0b21UeXBlKG9iaik7XG4gICAgfSxcbiAgICB0b0pTT05WYWx1ZTogZnVuY3Rpb24gKG9iaikge1xuICAgICAgcmV0dXJuIHskdHlwZTogb2JqLnR5cGVOYW1lKCksICR2YWx1ZTogb2JqLnRvSlNPTlZhbHVlKCl9O1xuICAgIH0sXG4gICAgZnJvbUpTT05WYWx1ZTogZnVuY3Rpb24gKG9iaikge1xuICAgICAgdmFyIHR5cGVOYW1lID0gb2JqLiR0eXBlO1xuICAgICAgdmFyIGNvbnZlcnRlciA9IGN1c3RvbVR5cGVzW3R5cGVOYW1lXTtcbiAgICAgIHJldHVybiBjb252ZXJ0ZXIob2JqLiR2YWx1ZSk7XG4gICAgfVxuICB9XG5dO1xuXG5FSlNPTi5faXNDdXN0b21UeXBlID0gZnVuY3Rpb24gKG9iaikge1xuICByZXR1cm4gb2JqICYmXG4gICAgdHlwZW9mIG9iai50b0pTT05WYWx1ZSA9PT0gJ2Z1bmN0aW9uJyAmJlxuICAgIHR5cGVvZiBvYmoudHlwZU5hbWUgPT09ICdmdW5jdGlvbicgJiZcbiAgICBfLmhhcyhjdXN0b21UeXBlcywgb2JqLnR5cGVOYW1lKCkpO1xufTtcblxuXG4vL2ZvciBib3RoIGFycmF5cyBhbmQgb2JqZWN0cywgaW4tcGxhY2UgbW9kaWZpY2F0aW9uLlxudmFyIGFkanVzdFR5cGVzVG9KU09OVmFsdWUgPVxuRUpTT04uX2FkanVzdFR5cGVzVG9KU09OVmFsdWUgPSBmdW5jdGlvbiAob2JqKSB7XG4gIGlmIChvYmogPT09IG51bGwpXG4gICAgcmV0dXJuIG51bGw7XG4gIHZhciBtYXliZUNoYW5nZWQgPSB0b0pTT05WYWx1ZUhlbHBlcihvYmopO1xuICBpZiAobWF5YmVDaGFuZ2VkICE9PSB1bmRlZmluZWQpXG4gICAgcmV0dXJuIG1heWJlQ2hhbmdlZDtcbiAgXy5lYWNoKG9iaiwgZnVuY3Rpb24gKHZhbHVlLCBrZXkpIHtcbiAgICBpZiAodHlwZW9mIHZhbHVlICE9PSAnb2JqZWN0JyAmJiB2YWx1ZSAhPT0gdW5kZWZpbmVkKVxuICAgICAgcmV0dXJuOyAvLyBjb250aW51ZVxuICAgIHZhciBjaGFuZ2VkID0gdG9KU09OVmFsdWVIZWxwZXIodmFsdWUpO1xuICAgIGlmIChjaGFuZ2VkKSB7XG4gICAgICBvYmpba2V5XSA9IGNoYW5nZWQ7XG4gICAgICByZXR1cm47IC8vIG9uIHRvIHRoZSBuZXh0IGtleVxuICAgIH1cbiAgICAvLyBpZiB3ZSBnZXQgaGVyZSwgdmFsdWUgaXMgYW4gb2JqZWN0IGJ1dCBub3QgYWRqdXN0YWJsZVxuICAgIC8vIGF0IHRoaXMgbGV2ZWwuICByZWN1cnNlLlxuICAgIGFkanVzdFR5cGVzVG9KU09OVmFsdWUodmFsdWUpO1xuICB9KTtcbiAgcmV0dXJuIG9iajtcbn07XG5cbi8vIEVpdGhlciByZXR1cm4gdGhlIEpTT04tY29tcGF0aWJsZSB2ZXJzaW9uIG9mIHRoZSBhcmd1bWVudCwgb3IgdW5kZWZpbmVkIChpZlxuLy8gdGhlIGl0ZW0gaXNuJ3QgaXRzZWxmIHJlcGxhY2VhYmxlLCBidXQgbWF5YmUgc29tZSBmaWVsZHMgaW4gaXQgYXJlKVxudmFyIHRvSlNPTlZhbHVlSGVscGVyID0gZnVuY3Rpb24gKGl0ZW0pIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBidWlsdGluQ29udmVydGVycy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBjb252ZXJ0ZXIgPSBidWlsdGluQ29udmVydGVyc1tpXTtcbiAgICBpZiAoY29udmVydGVyLm1hdGNoT2JqZWN0KGl0ZW0pKSB7XG4gICAgICByZXR1cm4gY29udmVydGVyLnRvSlNPTlZhbHVlKGl0ZW0pO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdW5kZWZpbmVkO1xufTtcblxuRUpTT04udG9KU09OVmFsdWUgPSBmdW5jdGlvbiAoaXRlbSkge1xuICB2YXIgY2hhbmdlZCA9IHRvSlNPTlZhbHVlSGVscGVyKGl0ZW0pO1xuICBpZiAoY2hhbmdlZCAhPT0gdW5kZWZpbmVkKVxuICAgIHJldHVybiBjaGFuZ2VkO1xuICBpZiAodHlwZW9mIGl0ZW0gPT09ICdvYmplY3QnKSB7XG4gICAgaXRlbSA9IEVKU09OLmNsb25lKGl0ZW0pO1xuICAgIGFkanVzdFR5cGVzVG9KU09OVmFsdWUoaXRlbSk7XG4gIH1cbiAgcmV0dXJuIGl0ZW07XG59O1xuXG4vL2ZvciBib3RoIGFycmF5cyBhbmQgb2JqZWN0cy4gVHJpZXMgaXRzIGJlc3QgdG8ganVzdFxuLy8gdXNlIHRoZSBvYmplY3QgeW91IGhhbmQgaXQsIGJ1dCBtYXkgcmV0dXJuIHNvbWV0aGluZ1xuLy8gZGlmZmVyZW50IGlmIHRoZSBvYmplY3QgeW91IGhhbmQgaXQgaXRzZWxmIG5lZWRzIGNoYW5naW5nLlxudmFyIGFkanVzdFR5cGVzRnJvbUpTT05WYWx1ZSA9XG5FSlNPTi5fYWRqdXN0VHlwZXNGcm9tSlNPTlZhbHVlID0gZnVuY3Rpb24gKG9iaikge1xuICBpZiAob2JqID09PSBudWxsKVxuICAgIHJldHVybiBudWxsO1xuICB2YXIgbWF5YmVDaGFuZ2VkID0gZnJvbUpTT05WYWx1ZUhlbHBlcihvYmopO1xuICBpZiAobWF5YmVDaGFuZ2VkICE9PSBvYmopXG4gICAgcmV0dXJuIG1heWJlQ2hhbmdlZDtcbiAgXy5lYWNoKG9iaiwgZnVuY3Rpb24gKHZhbHVlLCBrZXkpIHtcbiAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnb2JqZWN0Jykge1xuICAgICAgdmFyIGNoYW5nZWQgPSBmcm9tSlNPTlZhbHVlSGVscGVyKHZhbHVlKTtcbiAgICAgIGlmICh2YWx1ZSAhPT0gY2hhbmdlZCkge1xuICAgICAgICBvYmpba2V5XSA9IGNoYW5nZWQ7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIC8vIGlmIHdlIGdldCBoZXJlLCB2YWx1ZSBpcyBhbiBvYmplY3QgYnV0IG5vdCBhZGp1c3RhYmxlXG4gICAgICAvLyBhdCB0aGlzIGxldmVsLiAgcmVjdXJzZS5cbiAgICAgIGFkanVzdFR5cGVzRnJvbUpTT05WYWx1ZSh2YWx1ZSk7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIG9iajtcbn07XG5cbi8vIEVpdGhlciByZXR1cm4gdGhlIGFyZ3VtZW50IGNoYW5nZWQgdG8gaGF2ZSB0aGUgbm9uLWpzb25cbi8vIHJlcCBvZiBpdHNlbGYgKHRoZSBPYmplY3QgdmVyc2lvbikgb3IgdGhlIGFyZ3VtZW50IGl0c2VsZi5cblxuLy8gRE9FUyBOT1QgUkVDVVJTRS4gIEZvciBhY3R1YWxseSBnZXR0aW5nIHRoZSBmdWxseS1jaGFuZ2VkIHZhbHVlLCB1c2Vcbi8vIEVKU09OLmZyb21KU09OVmFsdWVcbnZhciBmcm9tSlNPTlZhbHVlSGVscGVyID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gIGlmICh0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIHZhbHVlICE9PSBudWxsKSB7XG4gICAgaWYgKF8uc2l6ZSh2YWx1ZSkgPD0gMlxuICAgICAgICAmJiBfLmFsbCh2YWx1ZSwgZnVuY3Rpb24gKHYsIGspIHtcbiAgICAgICAgICByZXR1cm4gdHlwZW9mIGsgPT09ICdzdHJpbmcnICYmIGsuc3Vic3RyKDAsIDEpID09PSAnJCc7XG4gICAgICAgIH0pKSB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGJ1aWx0aW5Db252ZXJ0ZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBjb252ZXJ0ZXIgPSBidWlsdGluQ29udmVydGVyc1tpXTtcbiAgICAgICAgaWYgKGNvbnZlcnRlci5tYXRjaEpTT05WYWx1ZSh2YWx1ZSkpIHtcbiAgICAgICAgICByZXR1cm4gY29udmVydGVyLmZyb21KU09OVmFsdWUodmFsdWUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiB2YWx1ZTtcbn07XG5cbkVKU09OLmZyb21KU09OVmFsdWUgPSBmdW5jdGlvbiAoaXRlbSkge1xuICB2YXIgY2hhbmdlZCA9IGZyb21KU09OVmFsdWVIZWxwZXIoaXRlbSk7XG4gIGlmIChjaGFuZ2VkID09PSBpdGVtICYmIHR5cGVvZiBpdGVtID09PSAnb2JqZWN0Jykge1xuICAgIGl0ZW0gPSBFSlNPTi5jbG9uZShpdGVtKTtcbiAgICBhZGp1c3RUeXBlc0Zyb21KU09OVmFsdWUoaXRlbSk7XG4gICAgcmV0dXJuIGl0ZW07XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGNoYW5nZWQ7XG4gIH1cbn07XG5cbkVKU09OLnN0cmluZ2lmeSA9IGZ1bmN0aW9uIChpdGVtKSB7XG4gIHJldHVybiBKU09OLnN0cmluZ2lmeShFSlNPTi50b0pTT05WYWx1ZShpdGVtKSk7XG59O1xuXG5FSlNPTi5wYXJzZSA9IGZ1bmN0aW9uIChpdGVtKSB7XG4gIHJldHVybiBFSlNPTi5mcm9tSlNPTlZhbHVlKEpTT04ucGFyc2UoaXRlbSkpO1xufTtcblxuRUpTT04uaXNCaW5hcnkgPSBmdW5jdGlvbiAob2JqKSB7XG4gIHJldHVybiAodHlwZW9mIFVpbnQ4QXJyYXkgIT09ICd1bmRlZmluZWQnICYmIG9iaiBpbnN0YW5jZW9mIFVpbnQ4QXJyYXkpIHx8XG4gICAgKG9iaiAmJiBvYmouJFVpbnQ4QXJyYXlQb2x5ZmlsbCk7XG59O1xuXG5FSlNPTi5lcXVhbHMgPSBmdW5jdGlvbiAoYSwgYiwgb3B0aW9ucykge1xuICB2YXIgaTtcbiAgdmFyIGtleU9yZGVyU2Vuc2l0aXZlID0gISEob3B0aW9ucyAmJiBvcHRpb25zLmtleU9yZGVyU2Vuc2l0aXZlKTtcbiAgaWYgKGEgPT09IGIpXG4gICAgcmV0dXJuIHRydWU7XG4gIGlmICghYSB8fCAhYikgLy8gaWYgZWl0aGVyIG9uZSBpcyBmYWxzeSwgdGhleSdkIGhhdmUgdG8gYmUgPT09IHRvIGJlIGVxdWFsXG4gICAgcmV0dXJuIGZhbHNlO1xuICBpZiAoISh0eXBlb2YgYSA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIGIgPT09ICdvYmplY3QnKSlcbiAgICByZXR1cm4gZmFsc2U7XG4gIGlmIChhIGluc3RhbmNlb2YgRGF0ZSAmJiBiIGluc3RhbmNlb2YgRGF0ZSlcbiAgICByZXR1cm4gYS52YWx1ZU9mKCkgPT09IGIudmFsdWVPZigpO1xuICBpZiAoRUpTT04uaXNCaW5hcnkoYSkgJiYgRUpTT04uaXNCaW5hcnkoYikpIHtcbiAgICBpZiAoYS5sZW5ndGggIT09IGIubGVuZ3RoKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIGZvciAoaSA9IDA7IGkgPCBhLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoYVtpXSAhPT0gYltpXSlcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICBpZiAodHlwZW9mIChhLmVxdWFscykgPT09ICdmdW5jdGlvbicpXG4gICAgcmV0dXJuIGEuZXF1YWxzKGIsIG9wdGlvbnMpO1xuICBpZiAoYSBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgaWYgKCEoYiBpbnN0YW5jZW9mIEFycmF5KSlcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICBpZiAoYS5sZW5ndGggIT09IGIubGVuZ3RoKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIGZvciAoaSA9IDA7IGkgPCBhLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoIUVKU09OLmVxdWFscyhhW2ldLCBiW2ldLCBvcHRpb25zKSlcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICAvLyBmYWxsIGJhY2sgdG8gc3RydWN0dXJhbCBlcXVhbGl0eSBvZiBvYmplY3RzXG4gIHZhciByZXQ7XG4gIGlmIChrZXlPcmRlclNlbnNpdGl2ZSkge1xuICAgIHZhciBiS2V5cyA9IFtdO1xuICAgIF8uZWFjaChiLCBmdW5jdGlvbiAodmFsLCB4KSB7XG4gICAgICAgIGJLZXlzLnB1c2goeCk7XG4gICAgfSk7XG4gICAgaSA9IDA7XG4gICAgcmV0ID0gXy5hbGwoYSwgZnVuY3Rpb24gKHZhbCwgeCkge1xuICAgICAgaWYgKGkgPj0gYktleXMubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGlmICh4ICE9PSBiS2V5c1tpXSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBpZiAoIUVKU09OLmVxdWFscyh2YWwsIGJbYktleXNbaV1dLCBvcHRpb25zKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBpKys7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9KTtcbiAgICByZXR1cm4gcmV0ICYmIGkgPT09IGJLZXlzLmxlbmd0aDtcbiAgfSBlbHNlIHtcbiAgICBpID0gMDtcbiAgICByZXQgPSBfLmFsbChhLCBmdW5jdGlvbiAodmFsLCBrZXkpIHtcbiAgICAgIGlmICghXy5oYXMoYiwga2V5KSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBpZiAoIUVKU09OLmVxdWFscyh2YWwsIGJba2V5XSwgb3B0aW9ucykpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgaSsrO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSk7XG4gICAgcmV0dXJuIHJldCAmJiBfLnNpemUoYikgPT09IGk7XG4gIH1cbn07XG5cbkVKU09OLmNsb25lID0gZnVuY3Rpb24gKHYpIHtcbiAgdmFyIHJldDtcbiAgaWYgKHR5cGVvZiB2ICE9PSBcIm9iamVjdFwiKVxuICAgIHJldHVybiB2O1xuICBpZiAodiA9PT0gbnVsbClcbiAgICByZXR1cm4gbnVsbDsgLy8gbnVsbCBoYXMgdHlwZW9mIFwib2JqZWN0XCJcbiAgaWYgKHYgaW5zdGFuY2VvZiBEYXRlKVxuICAgIHJldHVybiBuZXcgRGF0ZSh2LmdldFRpbWUoKSk7XG4gIGlmIChFSlNPTi5pc0JpbmFyeSh2KSkge1xuICAgIHJldCA9IEVKU09OLm5ld0JpbmFyeSh2Lmxlbmd0aCk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB2Lmxlbmd0aDsgaSsrKSB7XG4gICAgICByZXRbaV0gPSB2W2ldO1xuICAgIH1cbiAgICByZXR1cm4gcmV0O1xuICB9XG4gIGlmIChfLmlzQXJyYXkodikgfHwgXy5pc0FyZ3VtZW50cyh2KSkge1xuICAgIC8vIEZvciBzb21lIHJlYXNvbiwgXy5tYXAgZG9lc24ndCB3b3JrIGluIHRoaXMgY29udGV4dCBvbiBPcGVyYSAod2VpcmQgdGVzdFxuICAgIC8vIGZhaWx1cmVzKS5cbiAgICByZXQgPSBbXTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgdi5sZW5ndGg7IGkrKylcbiAgICAgIHJldFtpXSA9IEVKU09OLmNsb25lKHZbaV0pO1xuICAgIHJldHVybiByZXQ7XG4gIH1cbiAgLy8gaGFuZGxlIGdlbmVyYWwgdXNlci1kZWZpbmVkIHR5cGVkIE9iamVjdHMgaWYgdGhleSBoYXZlIGEgY2xvbmUgbWV0aG9kXG4gIGlmICh0eXBlb2Ygdi5jbG9uZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiB2LmNsb25lKCk7XG4gIH1cbiAgLy8gaGFuZGxlIG90aGVyIG9iamVjdHNcbiAgcmV0ID0ge307XG4gIF8uZWFjaCh2LCBmdW5jdGlvbiAodmFsdWUsIGtleSkge1xuICAgIHJldFtrZXldID0gRUpTT04uY2xvbmUodmFsdWUpO1xuICB9KTtcbiAgcmV0dXJuIHJldDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRUpTT047IiwiUGFnZSA9IHJlcXVpcmUoXCIuLi9QYWdlXCIpXG5Mb2NhdGlvblZpZXcgPSByZXF1aXJlIChcIi4uL0xvY2F0aW9uVmlld1wiKVxuZm9ybXMgPSByZXF1aXJlICcuLi9mb3JtcydcblxuXG4jIERpc3BsYXlzIGEgc291cmNlXG4jIE9wdGlvbnM6IHNldExvY2F0aW9uIC0gdHJ1ZSB0byBhdXRvc2V0IGxvY2F0aW9uXG4jIG9uU2VsZWN0IC0gY2FsbCB3aGVuIHNvdXJjZSBpcyBzZWxlY3RlZCB2aWEgYnV0dG9uIHRoYXQgYXBwZWFyc1xubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBTb3VyY2VQYWdlIGV4dGVuZHMgUGFnZVxuICBldmVudHM6XG4gICAgJ2NsaWNrICNlZGl0X3NvdXJjZV9idXR0b24nIDogJ2VkaXRTb3VyY2UnXG4gICAgJ2NsaWNrICNhZGRfdGVzdF9idXR0b24nIDogJ2FkZFRlc3QnXG4gICAgJ2NsaWNrICNhZGRfbm90ZV9idXR0b24nIDogJ2FkZE5vdGUnXG4gICAgJ2NsaWNrIC50ZXN0JyA6ICdvcGVuVGVzdCdcbiAgICAnY2xpY2sgLm5vdGUnIDogJ29wZW5Ob3RlJ1xuICAgICdjbGljayAjc2VsZWN0X3NvdXJjZScgOiAnc2VsZWN0U291cmNlJ1xuXG4gIGNyZWF0ZTogLT5cbiAgICBAc2V0TG9jYXRpb24gPSBAb3B0aW9ucy5zZXRMb2NhdGlvblxuXG4gIGFjdGl2YXRlOiAtPlxuICAgIEBkYi5zb3VyY2VzLmZpbmRPbmUge19pZDogQG9wdGlvbnMuX2lkfSwgKHNvdXJjZSkgPT5cbiAgICAgIEBzb3VyY2UgPSBzb3VyY2VcbiAgICAgIEByZW5kZXIoKVxuXG4gICAgICAjIEhpZGUgYWRkL2VkaXQgaWYgbm90IGF1dGhvcml6ZWRcbiAgICAgIEAkKFwiI2VkaXRfc291cmNlX2J1dHRvblwiKS50b2dnbGUoQGF1dGgudXBkYXRlKFwic291cmNlc1wiLCBzb3VyY2UpKVxuICAgICAgQCQoXCIjYWRkX3Rlc3RfYnV0dG9uXCIpLnRvZ2dsZShAYXV0aC5pbnNlcnQoXCJ0ZXN0c1wiKSlcbiAgICAgIEAkKFwiI2FkZF9ub3RlX2J1dHRvblwiKS50b2dnbGUoQGF1dGguaW5zZXJ0KFwic291cmNlX25vdGVzXCIpKVxuXG4gIHJlbmRlcjogLT5cbiAgICBAc2V0VGl0bGUgXCJTb3VyY2UgXCIgKyBAc291cmNlLmNvZGVcblxuICAgIGlmIEBhdXRoLnJlbW92ZShcInNvdXJjZXNcIiwgQHNvdXJjZSlcbiAgICAgIEBzZXR1cENvbnRleHRNZW51IFsgeyBnbHlwaDogJ3JlbW92ZScsIHRleHQ6IFwiRGVsZXRlIFNvdXJjZVwiLCBjbGljazogPT4gQGRlbGV0ZVNvdXJjZSgpIH0gXVxuICAgIGVsc2UgXG4gICAgICBAc2V0dXBDb250ZXh0TWVudSBbIF1cblxuICAgIG1lbnUgPSBbXVxuICAgIGlmIEBhdXRoLmluc2VydChcInRlc3RzXCIpXG4gICAgICBtZW51LnB1c2goeyB0ZXh0OiBcIlN0YXJ0IFdhdGVyIFRlc3RcIiwgY2xpY2s6ID0+IEBhZGRUZXN0KCkgfSlcbiAgICBpZiBAYXV0aC5pbnNlcnQoXCJzb3VyY2Vfbm90ZXNcIilcbiAgICAgIG1lbnUucHVzaCh7IHRleHQ6IFwiQWRkIE5vdGVcIiwgY2xpY2s6ID0+IEBhZGROb3RlKCkgfSlcblxuICAgIEBzZXR1cEJ1dHRvbkJhciBbIHsgaWNvbjogXCJwbHVzLnBuZ1wiLCBtZW51OiBtZW51IH0gXVxuXG4gICAgIyBSZS1yZW5kZXIgdGVtcGxhdGVcbiAgICBAcmVtb3ZlU3Vidmlld3MoKVxuICAgIEAkZWwuaHRtbCB0ZW1wbGF0ZXNbJ3BhZ2VzL1NvdXJjZVBhZ2UnXShzb3VyY2U6IEBzb3VyY2UsIHNlbGVjdDogQG9wdGlvbnMub25TZWxlY3Q/KVxuXG4gICAgIyBTZXQgc291cmNlIHR5cGVcbiAgICBpZiBAc291cmNlLnR5cGU/XG4gICAgICBAZGIuc291cmNlX3R5cGVzLmZpbmRPbmUge2NvZGU6IEBzb3VyY2UudHlwZX0sIChzb3VyY2VUeXBlKSA9PlxuICAgICAgICBpZiBzb3VyY2VUeXBlPyB0aGVuIEAkKFwiI3NvdXJjZV90eXBlXCIpLnRleHQoc291cmNlVHlwZS5uYW1lKVxuXG4gICAgIyBBZGQgbG9jYXRpb24gdmlld1xuICAgIGxvY2F0aW9uVmlldyA9IG5ldyBMb2NhdGlvblZpZXcobG9jOiBAc291cmNlLmdlbywgcmVhZG9ubHk6IG5vdCBAYXV0aC51cGRhdGUoXCJzb3VyY2VzXCIsIEBzb3VyY2UpKVxuICAgIGlmIEBzZXRMb2NhdGlvblxuICAgICAgbG9jYXRpb25WaWV3LnNldExvY2F0aW9uKClcbiAgICAgIEBzZXRMb2NhdGlvbiA9IGZhbHNlXG5cbiAgICBAbGlzdGVuVG8gbG9jYXRpb25WaWV3LCAnbG9jYXRpb25zZXQnLCAobG9jKSAtPlxuICAgICAgQHNvdXJjZS5nZW8gPSBsb2NcbiAgICAgIEBkYi5zb3VyY2VzLnVwc2VydCBAc291cmNlLCA9PiBAcmVuZGVyKClcblxuICAgIEBsaXN0ZW5UbyBsb2NhdGlvblZpZXcsICdtYXAnLCAobG9jKSA9PlxuICAgICAgQHBhZ2VyLm9wZW5QYWdlKHJlcXVpcmUoXCIuL1NvdXJjZU1hcFBhZ2VcIiksIHtpbml0aWFsR2VvOiBsb2N9KVxuICAgICAgXG4gICAgQGFkZFN1YnZpZXcobG9jYXRpb25WaWV3KVxuICAgIEAkKFwiI2xvY2F0aW9uXCIpLmFwcGVuZChsb2NhdGlvblZpZXcuZWwpXG5cbiAgICAjIEFkZCB0ZXN0c1xuICAgIEBkYi50ZXN0cy5maW5kKHtzb3VyY2U6IEBzb3VyY2UuY29kZX0pLmZldGNoICh0ZXN0cykgPT5cbiAgICAgIEAkKFwiI3Rlc3RzXCIpLmh0bWwgdGVtcGxhdGVzWydwYWdlcy9Tb3VyY2VQYWdlX3Rlc3RzJ10odGVzdHM6dGVzdHMpXG5cbiAgICAgICMgRmlsbCBpbiBuYW1lc1xuICAgICAgZm9yIHRlc3QgaW4gdGVzdHNcbiAgICAgICAgQGRiLmZvcm1zLmZpbmRPbmUgeyBjb2RlOnRlc3QudHlwZSB9LCB7IG1vZGU6IFwibG9jYWxcIiB9LCAoZm9ybSkgPT5cbiAgICAgICAgICBAJChcIiN0ZXN0X25hbWVfXCIrdGVzdC5faWQpLnRleHQoaWYgZm9ybSB0aGVuIGZvcm0ubmFtZSBlbHNlIFwiPz8/XCIpXG5cbiAgICAjIEFkZCBub3Rlc1xuICAgIEBkYi5zb3VyY2Vfbm90ZXMuZmluZCh7c291cmNlOiBAc291cmNlLmNvZGV9KS5mZXRjaCAobm90ZXMpID0+IFxuICAgICAgQCQoXCIjbm90ZXNcIikuaHRtbCB0ZW1wbGF0ZXNbJ3BhZ2VzL1NvdXJjZVBhZ2Vfbm90ZXMnXShub3Rlczpub3RlcylcblxuICAgICMgQWRkIHBob3Rvc1xuICAgIHBob3Rvc1ZpZXcgPSBuZXcgZm9ybXMuSW1hZ2VzUXVlc3Rpb25cbiAgICAgIGlkOiAncGhvdG9zJ1xuICAgICAgbW9kZWw6IG5ldyBCYWNrYm9uZS5Nb2RlbChAc291cmNlKVxuICAgICAgY3R4OiBAY3R4XG4gICAgICByZWFkb25seTogbm90IEBhdXRoLnVwZGF0ZShcInNvdXJjZXNcIiwgQHNvdXJjZSlcbiAgICAgIFxuICAgIHBob3Rvc1ZpZXcubW9kZWwub24gJ2NoYW5nZScsID0+XG4gICAgICBAZGIuc291cmNlcy51cHNlcnQgQHNvdXJjZS50b0pTT04oKSwgPT4gQHJlbmRlcigpXG4gICAgQCQoJyNwaG90b3MnKS5hcHBlbmQocGhvdG9zVmlldy5lbClcblxuICBlZGl0U291cmNlOiAtPlxuICAgIEBwYWdlci5vcGVuUGFnZShyZXF1aXJlKFwiLi9Tb3VyY2VFZGl0UGFnZVwiKSwgeyBfaWQ6IEBzb3VyY2UuX2lkfSlcblxuICBkZWxldGVTb3VyY2U6IC0+XG4gICAgaWYgQGF1dGgucmVtb3ZlKFwic291cmNlc1wiLCBAc291cmNlKSBhbmQgY29uZmlybShcIlBlcm1hbmVudGx5IGRlbGV0ZSBzb3VyY2U/XCIpXG4gICAgICBAZGIuc291cmNlcy5yZW1vdmUgQHNvdXJjZS5faWQsID0+XG4gICAgICAgIEBwYWdlci5jbG9zZVBhZ2UoKVxuICAgICAgICBAcGFnZXIuZmxhc2ggXCJTb3VyY2UgZGVsZXRlZFwiLCBcInN1Y2Nlc3NcIlxuXG4gIGFkZFRlc3Q6IC0+XG4gICAgQHBhZ2VyLm9wZW5QYWdlKHJlcXVpcmUoXCIuL05ld1Rlc3RQYWdlXCIpLCB7IHNvdXJjZTogQHNvdXJjZS5jb2RlfSlcblxuICBvcGVuVGVzdDogKGV2KSAtPlxuICAgIEBwYWdlci5vcGVuUGFnZShyZXF1aXJlKFwiLi9UZXN0UGFnZVwiKSwgeyBfaWQ6IGV2LmN1cnJlbnRUYXJnZXQuaWR9KVxuXG4gIGFkZE5vdGU6IC0+XG4gICAgQHBhZ2VyLm9wZW5QYWdlKHJlcXVpcmUoXCIuL1NvdXJjZU5vdGVQYWdlXCIpLCB7IHNvdXJjZTogQHNvdXJjZS5jb2RlfSkgICAjIFRPRE8gaWQgb3IgY29kZT9cblxuICBvcGVuTm90ZTogKGV2KSAtPlxuICAgIEBwYWdlci5vcGVuUGFnZShyZXF1aXJlKFwiLi9Tb3VyY2VOb3RlUGFnZVwiKSwgeyBzb3VyY2U6IEBzb3VyY2UuY29kZSwgX2lkOiBldi5jdXJyZW50VGFyZ2V0LmlkfSlcblxuICBzZWxlY3RTb3VyY2U6IC0+XG4gICAgaWYgQG9wdGlvbnMub25TZWxlY3Q/XG4gICAgICBAcGFnZXIuY2xvc2VQYWdlKClcbiAgICAgIEBvcHRpb25zLm9uU2VsZWN0KEBzb3VyY2UpIiwiUGFnZSA9IHJlcXVpcmUgJy4uL1BhZ2UnXG5mb3JtcyA9IHJlcXVpcmUgJy4uL2Zvcm1zJ1xuU291cmNlUGFnZSA9IHJlcXVpcmUgXCIuL1NvdXJjZVBhZ2VcIlxuXG4jIEFsbG93cyBjcmVhdGluZyBvZiBhIHNvdXJjZVxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBOZXdTb3VyY2VQYWdlIGV4dGVuZHMgUGFnZVxuICBAY2FuT3BlbjogKGN0eCkgLT4gY3R4LmF1dGguaW5zZXJ0KFwic291cmNlc1wiKVxuXG4gIGFjdGl2YXRlOiAtPlxuICAgIEBzZXRUaXRsZSBcIk5ldyBTb3VyY2VcIlxuXG4gICAgIyBDcmVhdGUgbW9kZWwgZnJvbSBzb3VyY2VcbiAgICBAbW9kZWwgPSBuZXcgQmFja2JvbmUuTW9kZWwoc2V0TG9jYXRpb246IHRydWUpXG4gIFxuICAgICMgQ3JlYXRlIHF1ZXN0aW9uc1xuICAgIHNvdXJjZVR5cGVzUXVlc3Rpb24gPSBuZXcgZm9ybXMuRHJvcGRvd25RdWVzdGlvblxuICAgICAgaWQ6ICd0eXBlJ1xuICAgICAgbW9kZWw6IEBtb2RlbFxuICAgICAgcHJvbXB0OiAnRW50ZXIgU291cmNlIFR5cGUnXG4gICAgICBvcHRpb25zOiBbXVxuICAgIEBkYi5zb3VyY2VfdHlwZXMuZmluZCh7fSkuZmV0Y2ggKHNvdXJjZVR5cGVzKSA9PlxuICAgICAgIyBGaWxsIHNvdXJjZSB0eXBlc1xuICAgICAgc291cmNlVHlwZXNRdWVzdGlvbi5zZXRPcHRpb25zIF8ubWFwKHNvdXJjZVR5cGVzLCAoc3QpID0+IFtzdC5jb2RlLCBzdC5uYW1lXSlcblxuICAgIHNhdmVDYW5jZWxGb3JtID0gbmV3IGZvcm1zLlNhdmVDYW5jZWxGb3JtXG4gICAgICBjb250ZW50czogW1xuICAgICAgICBzb3VyY2VUeXBlc1F1ZXN0aW9uXG4gICAgICAgIG5ldyBmb3Jtcy5UZXh0UXVlc3Rpb25cbiAgICAgICAgICBpZDogJ25hbWUnXG4gICAgICAgICAgbW9kZWw6IEBtb2RlbFxuICAgICAgICAgIHByb21wdDogJ0VudGVyIG9wdGlvbmFsIG5hbWUnXG4gICAgICAgIG5ldyBmb3Jtcy5UZXh0UXVlc3Rpb25cbiAgICAgICAgICBpZDogJ2Rlc2MnXG4gICAgICAgICAgbW9kZWw6IEBtb2RlbFxuICAgICAgICAgIHByb21wdDogJ0VudGVyIG9wdGlvbmFsIGRlc2NyaXB0aW9uJ1xuICAgICAgICBuZXcgZm9ybXMuQ2hlY2tRdWVzdGlvblxuICAgICAgICAgIGlkOiAncHJpdmF0ZSdcbiAgICAgICAgICBtb2RlbDogQG1vZGVsXG4gICAgICAgICAgcHJvbXB0OiBcIlByaXZhY3lcIlxuICAgICAgICAgIHRleHQ6ICdXYXRlciBzb3VyY2UgaXMgcHJpdmF0ZSdcbiAgICAgICAgICBoaW50OiAnVGhpcyBzaG91bGQgb25seSBiZSB1c2VkIGZvciBzb3VyY2VzIHRoYXQgYXJlIG5vdCBwdWJsaWNhbGx5IGFjY2Vzc2libGUnXG4gICAgICAgIG5ldyBmb3Jtcy5SYWRpb1F1ZXN0aW9uXG4gICAgICAgICAgaWQ6ICdzZXRMb2NhdGlvbidcbiAgICAgICAgICBtb2RlbDogQG1vZGVsXG4gICAgICAgICAgcHJvbXB0OiAnU2V0IHRvIGN1cnJlbnQgbG9jYXRpb24/J1xuICAgICAgICAgIG9wdGlvbnM6IFtbdHJ1ZSwgJ1llcyddLCBbZmFsc2UsICdObyddXVxuICAgICAgXVxuXG4gICAgQCRlbC5lbXB0eSgpLmFwcGVuZChzYXZlQ2FuY2VsRm9ybS5lbClcblxuICAgIEBsaXN0ZW5UbyBzYXZlQ2FuY2VsRm9ybSwgJ3NhdmUnLCA9PlxuICAgICAgc291cmNlID0gXy5waWNrKEBtb2RlbC50b0pTT04oKSwgJ25hbWUnLCAnZGVzYycsICd0eXBlJywgJ3ByaXZhdGUnKVxuXG4gICAgICBzdWNjZXNzID0gKGNvZGUpID0+XG4gICAgICAgIHNvdXJjZS5jb2RlID0gY29kZVxuICAgICAgICBzb3VyY2UudXNlciA9IEBsb2dpbi51c2VyXG4gICAgICAgIHNvdXJjZS5vcmcgPSBAbG9naW4ub3JnXG5cbiAgICAgICAgQGRiLnNvdXJjZXMudXBzZXJ0IHNvdXJjZSwgKHNvdXJjZSkgPT4gXG4gICAgICAgICAgQHBhZ2VyLmNsb3NlUGFnZShTb3VyY2VQYWdlLCB7IF9pZDogc291cmNlLl9pZCwgc2V0TG9jYXRpb246IEBtb2RlbC5nZXQoJ3NldExvY2F0aW9uJyl9KVxuXG4gICAgICBlcnJvciA9ID0+XG4gICAgICAgIGFsZXJ0KFwiVW5hYmxlIHRvIGdlbmVyYXRlIHNvdXJjZSBpZC4gUGxlYXNlIGVuc3VyZSB0aGF0IHlvdSBoYXZlIGEgY29ubmVjdGlvbiBvciB1c2UgU2V0dGluZ3MgdG8gb2J0YWluIG1vcmUgYmVmb3JlIGdvaW5nIG91dCBvZiBjb25uZWN0aW9uIHJhbmdlLlwiKVxuXG4gICAgICBAc291cmNlQ29kZXNNYW5hZ2VyLnJlcXVlc3RDb2RlKHN1Y2Nlc3MsIGVycm9yKVxuXG4gICAgQGxpc3RlblRvIHNhdmVDYW5jZWxGb3JtLCAnY2FuY2VsJywgPT5cbiAgICAgIEBwYWdlci5jbG9zZVBhZ2UoKVxuICIsIlBhZ2UgPSByZXF1aXJlIFwiLi4vUGFnZVwiXG5Tb3VyY2VQYWdlID0gcmVxdWlyZSBcIi4vU291cmNlUGFnZVwiXG5JdGVtVHJhY2tlciA9IHJlcXVpcmUgXCIuLi9JdGVtVHJhY2tlclwiXG5Mb2NhdGlvbkZpbmRlciA9IHJlcXVpcmUgJy4uL0xvY2F0aW9uRmluZGVyJ1xuR2VvSlNPTiA9IHJlcXVpcmUgJy4uL0dlb0pTT04nXG5cbiMgTWFwIG9mIHdhdGVyIHNvdXJjZXMuIE9wdGlvbnMgaW5jbHVkZTpcbiMgaW5pdGlhbEdlbzogR2VvbWV0cnkgdG8gem9vbSB0by4gUG9pbnQgb25seSBzdXBwb3J0ZWQuXG5jbGFzcyBTb3VyY2VNYXBQYWdlIGV4dGVuZHMgUGFnZVxuICBjcmVhdGU6IC0+XG4gICAgQHNldFRpdGxlIFwiU291cmNlIE1hcFwiXG5cbiAgICAjIENhbGN1bGF0ZSBoZWlnaHRcbiAgICBAJGVsLmh0bWwgdGVtcGxhdGVzWydwYWdlcy9Tb3VyY2VNYXBQYWdlJ10oKVxuXG4gICAgTC5JY29uLkRlZmF1bHQuaW1hZ2VQYXRoID0gXCJpbWcvbGVhZmxldFwiXG4gICAgQG1hcCA9IEwubWFwKHRoaXMuJChcIiNtYXBcIilbMF0pXG4gICAgTC5jb250cm9sLnNjYWxlKGltcGVyaWFsOmZhbHNlKS5hZGRUbyhAbWFwKVxuICAgIEByZXNpemVNYXAoKVxuXG4gICAgIyBSZWNhbGN1bGF0ZSBvbiByZXNpemVcbiAgICAkKHdpbmRvdykub24oJ3Jlc2l6ZScsIEByZXNpemVNYXApXG5cbiAgICAjIFNldHVwIG1hcCB0aWxlc1xuICAgIHNldHVwTWFwVGlsZXMoKS5hZGRUbyhAbWFwKVxuXG4gICAgIyBTZXR1cCBtYXJrZXIgZGlzcGxheVxuICAgIEBzb3VyY2VEaXNwbGF5ID0gbmV3IFNvdXJjZURpc3BsYXkoQG1hcCwgQGRiLCBAcGFnZXIpXG5cbiAgICAjIFRPRE8gem9vbSB0byBsYXN0IGtub3duIGJvdW5kc1xuICAgIFxuICAgICMgU2V0dXAgaW5pdGlhbCB6b29tXG4gICAgaWYgQG9wdGlvbnMuaW5pdGlhbEdlbyBhbmQgQG9wdGlvbnMuaW5pdGlhbEdlby50eXBlPT1cIlBvaW50XCJcbiAgICAgIEBtYXAuc2V0VmlldyhMLkdlb0pTT04uY29vcmRzVG9MYXRMbmcoQG9wdGlvbnMuaW5pdGlhbEdlby5jb29yZGluYXRlcyksIDE1KVxuXG4gICAgIyBTZXR1cCBsb2NhbHRpb24gZGlzcGxheVxuICAgIEBsb2NhdGlvbkRpc3BsYXkgPSBuZXcgTG9jYXRpb25EaXNwbGF5KEBtYXAsIG5vdCBAb3B0aW9ucy5pbml0aWFsR2VvPylcblxuICBkZXN0cm95OiAtPlxuICAgICQod2luZG93KS5vZmYoJ3Jlc2l6ZScsIEByZXNpemVNYXApXG4gICAgQGxvY2F0aW9uRGlzcGxheS5zdG9wKClcblxuICByZXNpemVNYXA6ID0+XG4gICAgIyBDYWxjdWxhdGUgbWFwIGhlaWdodFxuICAgIG1hcEhlaWdodCA9ICQoXCJodG1sXCIpLmhlaWdodCgpIC0gNDBcbiAgICAkKFwiI21hcFwiKS5jc3MoXCJoZWlnaHRcIiwgbWFwSGVpZ2h0ICsgXCJweFwiKVxuICAgIEBtYXAuaW52YWxpZGF0ZVNpemUoKVxuXG5cbnNldHVwTWFwVGlsZXMgPSAtPlxuICBtYXBxdWVzdFVybCA9ICdodHRwOi8ve3N9Lm1xY2RuLmNvbS90aWxlcy8xLjAuMC9vc20ve3p9L3t4fS97eX0ucG5nJ1xuICBzdWJEb21haW5zID0gWydvdGlsZTEnLCdvdGlsZTInLCdvdGlsZTMnLCdvdGlsZTQnXVxuICBtYXBxdWVzdEF0dHJpYiA9ICdEYXRhLCBpbWFnZXJ5IGFuZCBtYXAgaW5mb3JtYXRpb24gcHJvdmlkZWQgYnkgPGEgaHJlZj1cImh0dHA6Ly9vcGVuLm1hcHF1ZXN0LmNvLnVrXCIgdGFyZ2V0PVwiX2JsYW5rXCI+TWFwUXVlc3Q8L2E+LCA8YSBocmVmPVwiaHR0cDovL3d3dy5vcGVuc3RyZWV0bWFwLm9yZy9cIiB0YXJnZXQ9XCJfYmxhbmtcIj5PcGVuU3RyZWV0TWFwPC9hPiBhbmQgY29udHJpYnV0b3JzLidcbiAgcmV0dXJuIG5ldyBMLlRpbGVMYXllcihtYXBxdWVzdFVybCwge21heFpvb206IDE4LCBhdHRyaWJ1dGlvbjogbWFwcXVlc3RBdHRyaWIsIHN1YmRvbWFpbnM6IHN1YkRvbWFpbnN9KVxuXG5jbGFzcyBTb3VyY2VEaXNwbGF5XG4gIGNvbnN0cnVjdG9yOiAobWFwLCBkYiwgcGFnZXIpIC0+XG4gICAgQG1hcCA9IG1hcFxuICAgIEBkYiA9IGRiXG4gICAgQHBhZ2VyID0gcGFnZXJcbiAgICBAaXRlbVRyYWNrZXIgPSBuZXcgSXRlbVRyYWNrZXIoKVxuXG4gICAgQHNvdXJjZU1hcmtlcnMgPSB7fVxuICAgIEBtYXAub24oJ21vdmVlbmQnLCBAdXBkYXRlTWFya2VycylcblxuICAgIEBpY29uID0gbmV3IEwuaWNvblxuICAgICAgaWNvblVybDogJ2ltZy9Ecm9wTWFya2VyLnBuZydcbiAgICAgIGljb25SZXRpbmFVcmw6ICdpbWcvRHJvcE1hcmtlckAyeC5wbmcnXG4gICAgICBpY29uU2l6ZTogWzI3LCA0MV0sXG4gICAgICBpY29uQW5jaG9yOiBbMTMsIDQxXVxuICAgICAgcG9wdXBBbmNob3I6IFstMywgLTQxXVxuICBcbiAgdXBkYXRlTWFya2VyczogPT5cbiAgICAjIEdldCBib3VuZHMgcGFkZGVkXG4gICAgYm91bmRzID0gQG1hcC5nZXRCb3VuZHMoKS5wYWQoMC4zMylcblxuICAgICMgQ2hlY2sgZm9yIGVtcHR5IGNhc2VcbiAgICBpZiBfLmlzRXF1YWwoYm91bmRzLmdldFNvdXRoV2VzdCgpLCBib3VuZHMuZ2V0Tm9ydGhFYXN0KCkpXG4gICAgICByZXR1cm5cblxuICAgIGJvdW5kc0dlb0pTT04gPSBHZW9KU09OLmxhdExuZ0JvdW5kc1RvR2VvSlNPTihib3VuZHMpXG4gICAgc2VsZWN0b3IgPSB7IGdlbzogeyAkZ2VvSW50ZXJzZWN0czogeyAkZ2VvbWV0cnk6IGJvdW5kc0dlb0pTT04gfSB9IH1cblxuICAgICMgUXVlcnkgc291cmNlcyB3aXRoIHByb2plY3Rpb24uIFVzZSByZW1vdGUgbW9kZSBzbyBubyBjYWNoaW5nIG9jY3Vyc1xuICAgIEBkYi5zb3VyY2VzLmZpbmQoc2VsZWN0b3IsIHsgc29ydDogW1wiX2lkXCJdLCBsaW1pdDogMTAwLCBtb2RlOiBcInJlbW90ZVwiLCBmaWVsZHM6IHsgZ2VvOiAxIH0gfSkuZmV0Y2ggKHNvdXJjZXMpID0+XG4gICAgICAjIEZpbmQgb3V0IHdoaWNoIHRvIGFkZC9yZW1vdmVcbiAgICAgIFthZGRzLCByZW1vdmVzXSA9IEBpdGVtVHJhY2tlci51cGRhdGUoc291cmNlcylcblxuICAgICAgIyBSZW1vdmUgb2xkIG1hcmtlcnNcbiAgICAgIGZvciByZW1vdmUgaW4gcmVtb3Zlc1xuICAgICAgICBAcmVtb3ZlU291cmNlTWFya2VyKHJlbW92ZSlcbiAgICAgIGZvciBhZGQgaW4gYWRkc1xuICAgICAgICBAYWRkU291cmNlTWFya2VyKGFkZClcblxuICBhZGRTb3VyY2VNYXJrZXI6IChzb3VyY2UpIC0+XG4gICAgaWYgc291cmNlLmdlbz9cbiAgICAgIGxhdGxuZyA9IG5ldyBMLkxhdExuZyhzb3VyY2UuZ2VvLmNvb3JkaW5hdGVzWzFdLCBzb3VyY2UuZ2VvLmNvb3JkaW5hdGVzWzBdKVxuICAgICAgbWFya2VyID0gbmV3IEwuTWFya2VyKGxhdGxuZywge2ljb246QGljb259KVxuICAgICAgXG4gICAgICBtYXJrZXIub24gJ2NsaWNrJywgPT5cbiAgICAgICAgQHBhZ2VyLm9wZW5QYWdlKFNvdXJjZVBhZ2UsIHtfaWQ6IHNvdXJjZS5faWR9KVxuICAgICAgXG4gICAgICBAc291cmNlTWFya2Vyc1tzb3VyY2UuX2lkXSA9IG1hcmtlclxuICAgICAgbWFya2VyLmFkZFRvKEBtYXApXG5cbiAgcmVtb3ZlU291cmNlTWFya2VyOiAoc291cmNlKSAtPlxuICAgIGlmIF8uaGFzKEBzb3VyY2VNYXJrZXJzLCBzb3VyY2UuX2lkKVxuICAgICAgQG1hcC5yZW1vdmVMYXllcihAc291cmNlTWFya2Vyc1tzb3VyY2UuX2lkXSlcblxuXG5jbGFzcyBMb2NhdGlvbkRpc3BsYXlcbiAgIyBTZXR1cCBkaXNwbGF5LCBvcHRpb25hbGx5IHpvb21pbmcgdG8gY3VycmVudCBsb2NhdGlvblxuICBjb25zdHJ1Y3RvcjogKG1hcCwgem9vbVRvKSAtPlxuICAgIEBtYXAgPSBtYXBcbiAgICBAem9vbVRvID0gem9vbVRvXG5cbiAgICBAbG9jYXRpb25GaW5kZXIgPSBuZXcgTG9jYXRpb25GaW5kZXIoKVxuICAgIEBsb2NhdGlvbkZpbmRlci5vbignZm91bmQnLCBAbG9jYXRpb25Gb3VuZCkub24oJ2Vycm9yJywgQGxvY2F0aW9uRXJyb3IpXG4gICAgQGxvY2F0aW9uRmluZGVyLnN0YXJ0V2F0Y2goKVxuXG4gIHN0b3A6IC0+XG4gICAgQGxvY2F0aW9uRmluZGVyLnN0b3BXYXRjaCgpXG5cbiAgbG9jYXRpb25FcnJvcjogKGUpID0+XG4gICAgaWYgQHpvb21Ub1xuICAgICAgQG1hcC5maXRXb3JsZCgpXG4gICAgICBAem9vbVRvID0gZmFsc2VcbiAgICAgIGFsZXJ0KFwiVW5hYmxlIHRvIGRldGVybWluZSBsb2NhdGlvblwiKVxuXG4gIGxvY2F0aW9uRm91bmQ6IChlKSA9PlxuICAgIHJhZGl1cyA9IGUuY29vcmRzLmFjY3VyYWN5XG4gICAgbGF0bG5nID0gbmV3IEwuTGF0TG5nKGUuY29vcmRzLmxhdGl0dWRlLCBlLmNvb3Jkcy5sb25naXR1ZGUpXG5cbiAgICAjIFNldCBwb3NpdGlvbiBvbmNlXG4gICAgaWYgQHpvb21Ub1xuICAgICAgem9vbSA9IDE1XG4gICAgICBAbWFwLnNldFZpZXcobGF0bG5nLCB6b29tKVxuICAgICAgQHpvb21UbyA9IGZhbHNlXG5cbiAgICAjIFJhZGl1cyBsYXJnZXIgdGhhbiAxa20gbWVhbnMgbm8gbG9jYXRpb24gd29ydGggZGlzcGxheWluZ1xuICAgIGlmIHJhZGl1cyA+IDEwMDBcbiAgICAgIHJldHVyblxuXG4gICAgIyBTZXR1cCBtYXJrZXIgYW5kIGNpcmNsZVxuICAgIGlmIG5vdCBAbWVNYXJrZXJcbiAgICAgIGljb24gPSAgTC5pY29uKGljb25Vcmw6IFwiaW1nL215X2xvY2F0aW9uLnBuZ1wiLCBpY29uU2l6ZTogWzIyLCAyMl0pXG4gICAgICBAbWVNYXJrZXIgPSBMLm1hcmtlcihsYXRsbmcsIGljb246aWNvbikuYWRkVG8oQG1hcClcbiAgICAgIEBtZUNpcmNsZSA9IEwuY2lyY2xlKGxhdGxuZywgcmFkaXVzKVxuICAgICAgQG1lQ2lyY2xlLmFkZFRvKEBtYXApXG4gICAgZWxzZVxuICAgICAgQG1lTWFya2VyLnNldExhdExuZyhsYXRsbmcpXG4gICAgICBAbWVDaXJjbGUuc2V0TGF0TG5nKGxhdGxuZykuc2V0UmFkaXVzKHJhZGl1cylcblxubW9kdWxlLmV4cG9ydHMgPSBTb3VyY2VNYXBQYWdlIiwiUGFnZSA9IHJlcXVpcmUgXCIuLi9QYWdlXCJcblRlc3RQYWdlID0gcmVxdWlyZSBcIi4vVGVzdFBhZ2VcIlxuXG4jIFBhcmFtZXRlciBpcyBvcHRpb25hbCBzb3VyY2UgY29kZVxuY2xhc3MgTmV3VGVzdFBhZ2UgZXh0ZW5kcyBQYWdlXG4gIEBjYW5PcGVuOiAoY3R4KSAtPiBjdHguYXV0aC5pbnNlcnQoXCJ0ZXN0c1wiKVxuXG4gIGV2ZW50czogXG4gICAgXCJjbGljayAudGVzdFwiIDogXCJzdGFydFRlc3RcIlxuXG4gIGFjdGl2YXRlOiAtPlxuICAgIEBzZXRUaXRsZSBcIlNlbGVjdCBUZXN0XCJcblxuICAgIEBkYi5mb3Jtcy5maW5kKHt0eXBlOlwiV2F0ZXJUZXN0XCJ9KS5mZXRjaCAoZm9ybXMpID0+XG4gICAgICBAZm9ybXMgPSBmb3Jtc1xuICAgICAgQCRlbC5odG1sIHRlbXBsYXRlc1sncGFnZXMvTmV3VGVzdFBhZ2UnXShmb3Jtczpmb3JtcylcblxuICBzdGFydFRlc3Q6IChldikgLT5cbiAgICB0ZXN0Q29kZSA9IGV2LmN1cnJlbnRUYXJnZXQuaWRcblxuICAgICMgQ3JlYXRlIHRlc3RcbiAgICB0ZXN0ID0ge1xuICAgICAgc291cmNlOiBAb3B0aW9ucy5zb3VyY2VcbiAgICAgIHR5cGU6IHRlc3RDb2RlXG4gICAgICBjb21wbGV0ZWQ6IG51bGxcbiAgICAgIHN0YXJ0ZWQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKVxuICAgICAgdXNlcjogQGxvZ2luLnVzZXJcbiAgICAgIG9yZzogQGxvZ2luLm9yZ1xuICAgIH1cbiAgICBAZGIudGVzdHMudXBzZXJ0IHRlc3QsICh0ZXN0KSA9PlxuICAgICAgQHBhZ2VyLmNsb3NlUGFnZShUZXN0UGFnZSwgeyBfaWQ6IHRlc3QuX2lkIH0pXG5cbm1vZHVsZS5leHBvcnRzID0gTmV3VGVzdFBhZ2UiLCJQYWdlID0gcmVxdWlyZSBcIi4uL1BhZ2VcIlxuZm9ybXMgPSByZXF1aXJlICcuLi9mb3JtcydcblxuY2xhc3MgVGVzdFBhZ2UgZXh0ZW5kcyBQYWdlXG4gIEBjYW5PcGVuOiAoY3R4KSAtPiBjdHguYXV0aC51cGRhdGUoXCJ0ZXN0c1wiKSAmJiBjdHguYXV0aC5pbnNlcnQoXCJ0ZXN0c1wiKSBcblxuICBjcmVhdGU6IC0+IEByZW5kZXIoKVxuXG4gIHJlbmRlcjogLT5cbiAgICBAc2V0VGl0bGUgXCJXYXRlciBUZXN0XCJcblxuICAgICMgR2V0IHRlc3RcbiAgICBAZGIudGVzdHMuZmluZE9uZSB7X2lkOiBAb3B0aW9ucy5faWR9LCAodGVzdCkgPT5cbiAgICAgIEB0ZXN0ID0gdGVzdFxuXG4gICAgICBpZiBAYXV0aC5yZW1vdmUoXCJ0ZXN0c1wiLCBAdGVzdClcbiAgICAgICAgQHNldHVwQ29udGV4dE1lbnUgWyB7IGdseXBoOiAncmVtb3ZlJywgdGV4dDogXCJEZWxldGUgVGVzdFwiLCBjbGljazogPT4gQGRlbGV0ZVRlc3QoKSB9IF1cbiAgICAgIGVsc2UgXG4gICAgICAgIEBzZXR1cENvbnRleHRNZW51IFsgXVxuXG4gICAgICAjIEdldCBmb3JtXG4gICAgICBAZGIuZm9ybXMuZmluZE9uZSB7IHR5cGU6IFwiV2F0ZXJUZXN0XCIsIGNvZGU6IHRlc3QudHlwZSB9LCAoZm9ybSkgPT5cbiAgICAgICAgIyBDaGVjayBpZiBjb21wbGV0ZWRcbiAgICAgICAgaWYgbm90IHRlc3QuY29tcGxldGVkXG4gICAgICAgICAgQGZvcm1WaWV3ID0gZm9ybXMuaW5zdGFudGlhdGVWaWV3KGZvcm0udmlld3MuZWRpdCwgeyBjdHg6IEBjdHggfSlcblxuICAgICAgICAgICMgTGlzdGVuIHRvIGV2ZW50c1xuICAgICAgICAgIEBsaXN0ZW5UbyBAZm9ybVZpZXcsICdjaGFuZ2UnLCBAc2F2ZVxuICAgICAgICAgIEBsaXN0ZW5UbyBAZm9ybVZpZXcsICdjb21wbGV0ZScsIEBjb21wbGV0ZWRcbiAgICAgICAgICBAbGlzdGVuVG8gQGZvcm1WaWV3LCAnY2xvc2UnLCBAY2xvc2VcbiAgICAgICAgZWxzZVxuICAgICAgICAgIEBmb3JtVmlldyA9IGZvcm1zLmluc3RhbnRpYXRlVmlldyhmb3JtLnZpZXdzLmRldGFpbCwgeyBjdHg6IEBjdHggfSlcbiAgXG4gICAgICAgIEAkZWwuaHRtbCB0ZW1wbGF0ZXNbJ3BhZ2VzL1Rlc3RQYWdlJ10oY29tcGxldGVkOiB0ZXN0LmNvbXBsZXRlZCwgdGl0bGU6IGZvcm0ubmFtZSlcbiAgICAgICAgQCQoJyNjb250ZW50cycpLmFwcGVuZChAZm9ybVZpZXcuZWwpXG5cbiAgICAgICAgaWYgbm90IEBhdXRoLnVwZGF0ZShcInRlc3RzXCIsIHRlc3QpXG4gICAgICAgICAgQCQoXCIjZWRpdF9idXR0b25cIikuaGlkZSgpXG5cbiAgICAgICAgQGZvcm1WaWV3LmxvYWQgQHRlc3RcblxuICBldmVudHM6XG4gICAgXCJjbGljayAjZWRpdF9idXR0b25cIiA6IFwiZWRpdFwiXG5cbiAgZGVzdHJveTogLT5cbiAgICAjIExldCBrbm93IHRoYXQgc2F2ZWQgaWYgY2xvc2VkIGluY29tcGxldGVkXG4gICAgaWYgQHRlc3QgYW5kIG5vdCBAdGVzdC5jb21wbGV0ZWRcbiAgICAgIEBwYWdlci5mbGFzaCBcIlRlc3Qgc2F2ZWQgYXMgZHJhZnQuXCJcblxuICBlZGl0OiAtPlxuICAgICMgTWFyayBhcyBpbmNvbXBsZXRlXG4gICAgQHRlc3QuY29tcGxldGVkID0gbnVsbFxuICAgIEBkYi50ZXN0cy51cHNlcnQgQHRlc3QsID0+IEByZW5kZXIoKVxuXG4gIHNhdmU6ID0+XG4gICAgIyBTYXZlIHRvIGRiXG4gICAgQHRlc3QgPSBAZm9ybVZpZXcuc2F2ZSgpXG4gICAgQGRiLnRlc3RzLnVwc2VydChAdGVzdClcblxuICBjbG9zZTogPT5cbiAgICBAc2F2ZSgpXG4gICAgQHBhZ2VyLmNsb3NlUGFnZSgpXG5cbiAgY29tcGxldGVkOiA9PlxuICAgICMgTWFyayBhcyBjb21wbGV0ZWRcbiAgICBAdGVzdC5jb21wbGV0ZWQgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKClcbiAgICBAZGIudGVzdHMudXBzZXJ0IEB0ZXN0LCA9PiBAcmVuZGVyKClcblxuICBkZWxldGVUZXN0OiAtPlxuICAgIGlmIGNvbmZpcm0oXCJQZXJtYW5lbnRseSBkZWxldGUgdGVzdD9cIilcbiAgICAgIEBkYi50ZXN0cy5yZW1vdmUgQHRlc3QuX2lkLCA9PlxuICAgICAgICBAdGVzdCA9IG51bGxcbiAgICAgICAgQHBhZ2VyLmNsb3NlUGFnZSgpXG4gICAgICAgIEBwYWdlci5mbGFzaCBcIlRlc3QgZGVsZXRlZFwiLCBcInN1Y2Nlc3NcIlxuXG5tb2R1bGUuZXhwb3J0cyA9IFRlc3RQYWdlIiwiUGFnZSA9IHJlcXVpcmUgJy4uL1BhZ2UnXG5mb3JtcyA9IHJlcXVpcmUgJy4uL2Zvcm1zJ1xuXG4jIEFsbG93cyBlZGl0aW5nIG9mIHNvdXJjZSBkZXRhaWxzXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFNvdXJjZUVkaXRQYWdlIGV4dGVuZHMgUGFnZVxuICBAY2FuT3BlbjogKGN0eCkgLT4gY3R4LmF1dGgudXBkYXRlKFwic291cmNlc1wiKVxuXG4gIGFjdGl2YXRlOiAtPlxuICAgIEBkYi5zb3VyY2VzLmZpbmRPbmUge19pZDogQG9wdGlvbnMuX2lkfSwgKHNvdXJjZSkgPT5cbiAgICAgICMgQ2hlY2sgYXV0aFxuICAgICAgaWYgbm90IEBhdXRoLnVwZGF0ZShcInNvdXJjZXNcIiwgc291cmNlKVxuICAgICAgICByZXR1cm4gQHBhZ2VyLmNsb3NlUGFnZSgpXG5cbiAgICAgIEBzZXRUaXRsZSBcIkVkaXQgU291cmNlICN7c291cmNlLmNvZGV9XCJcblxuICAgICAgIyBDcmVhdGUgbW9kZWwgZnJvbSBzb3VyY2VcbiAgICAgIEBtb2RlbCA9IG5ldyBCYWNrYm9uZS5Nb2RlbChzb3VyY2UpXG4gIFxuICAgICAgIyBDcmVhdGUgcXVlc3Rpb25zXG4gICAgICBzb3VyY2VUeXBlc1F1ZXN0aW9uID0gbmV3IGZvcm1zLkRyb3Bkb3duUXVlc3Rpb25cbiAgICAgICAgaWQ6ICd0eXBlJ1xuICAgICAgICBtb2RlbDogQG1vZGVsXG4gICAgICAgIHByb21wdDogJ0VudGVyIFNvdXJjZSBUeXBlJ1xuICAgICAgICBvcHRpb25zOiBbXVxuICAgICAgQGRiLnNvdXJjZV90eXBlcy5maW5kKHt9KS5mZXRjaCAoc291cmNlVHlwZXMpID0+XG4gICAgICAgICMgRmlsbCBzb3VyY2UgdHlwZXNcbiAgICAgICAgc291cmNlVHlwZXNRdWVzdGlvbi5zZXRPcHRpb25zIF8ubWFwKHNvdXJjZVR5cGVzLCAoc3QpID0+IFtzdC5jb2RlLCBzdC5uYW1lXSlcblxuICAgICAgc2F2ZUNhbmNlbEZvcm0gPSBuZXcgZm9ybXMuU2F2ZUNhbmNlbEZvcm1cbiAgICAgICAgY29udGVudHM6IFtcbiAgICAgICAgICBzb3VyY2VUeXBlc1F1ZXN0aW9uXG4gICAgICAgICAgbmV3IGZvcm1zLlRleHRRdWVzdGlvblxuICAgICAgICAgICAgaWQ6ICduYW1lJ1xuICAgICAgICAgICAgbW9kZWw6IEBtb2RlbFxuICAgICAgICAgICAgcHJvbXB0OiAnRW50ZXIgb3B0aW9uYWwgbmFtZSdcbiAgICAgICAgICBuZXcgZm9ybXMuVGV4dFF1ZXN0aW9uXG4gICAgICAgICAgICBpZDogJ2Rlc2MnXG4gICAgICAgICAgICBtb2RlbDogQG1vZGVsXG4gICAgICAgICAgICBwcm9tcHQ6ICdFbnRlciBvcHRpb25hbCBkZXNjcmlwdGlvbidcbiAgICAgICAgICBuZXcgZm9ybXMuQ2hlY2tRdWVzdGlvblxuICAgICAgICAgICAgaWQ6ICdwcml2YXRlJ1xuICAgICAgICAgICAgbW9kZWw6IEBtb2RlbFxuICAgICAgICAgICAgcHJvbXB0OiBcIlByaXZhY3lcIlxuICAgICAgICAgICAgdGV4dDogJ1dhdGVyIHNvdXJjZSBpcyBwcml2YXRlJ1xuICAgICAgICAgICAgaGludDogJ1RoaXMgc2hvdWxkIG9ubHkgYmUgdXNlZCBmb3Igc291cmNlcyB0aGF0IGFyZSBub3QgcHVibGljYWxseSBhY2Nlc3NpYmxlJ1xuICAgICAgICBdXG5cbiAgICAgIEAkZWwuZW1wdHkoKS5hcHBlbmQoc2F2ZUNhbmNlbEZvcm0uZWwpXG5cbiAgICAgIEBsaXN0ZW5UbyBzYXZlQ2FuY2VsRm9ybSwgJ3NhdmUnLCA9PlxuICAgICAgICBAZGIuc291cmNlcy51cHNlcnQgQG1vZGVsLnRvSlNPTigpLCA9PiBAcGFnZXIuY2xvc2VQYWdlKClcblxuICAgICAgQGxpc3RlblRvIHNhdmVDYW5jZWxGb3JtLCAnY2FuY2VsJywgPT5cbiAgICAgICAgQHBhZ2VyLmNsb3NlUGFnZSgpXG4gIiwiUGFnZSA9IHJlcXVpcmUgJy4uL1BhZ2UnXG5mb3JtcyA9IHJlcXVpcmUgJy4uL2Zvcm1zJ1xuXG4jIEFsbG93cyBjcmVhdGluZy9lZGl0aW5nIG9mIHNvdXJjZSBub3Rlc1xuIyBPcHRpb25zIGFyZSBcbiMgX2lkOiBpZCBvZiBzb3VyY2Ugbm90ZVxuIyBzb3VyY2U6IGNvZGUgb2Ygc291cmNlXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgU291cmNlTm90ZVBhZ2UgZXh0ZW5kcyBQYWdlXG4gIGFjdGl2YXRlOiAtPlxuICAgICMgRmluZCB3YXRlciBzb3VyY2VcbiAgICBAZGIuc291cmNlcy5maW5kT25lIHtjb2RlOiBAb3B0aW9ucy5zb3VyY2V9LCAoc291cmNlKSA9PlxuICAgICAgQHNldFRpdGxlIFwiTm90ZSBmb3IgU291cmNlICN7c291cmNlLmNvZGV9XCJcblxuICAgICAgIyBGaW5kIHNvdXJjZSBub3RlXG4gICAgICBpZiBAb3B0aW9ucy5faWRcbiAgICAgICAgQGRiLnNvdXJjZV9ub3Rlcy5maW5kT25lIHtfaWQ6IEBvcHRpb25zLl9pZH0sIChzb3VyY2VOb3RlKSA9PlxuICAgICAgICAgIEBzb3VyY2VOb3RlID0gc291cmNlTm90ZVxuICAgICAgICAgIEByZW5kZXIoKVxuICAgICAgZWxzZVxuICAgICAgICAjIE5ldyBzb3VyY2Ugbm90ZSwganVzdCByZW5kZXJcbiAgICAgICAgaWYgbm90IEBhdXRoLmluc2VydChcInNvdXJjZV9ub3Rlc1wiKVxuICAgICAgICAgIHJldHVybiBAcGFnZXIuY2xvc2VQYWdlKClcbiAgICAgICAgQHJlbmRlcigpXG5cbiAgcmVuZGVyOiAtPlxuICAgICAgIyBDcmVhdGUgbW9kZWwgXG4gICAgICBAbW9kZWwgPSBuZXcgQmFja2JvbmUuTW9kZWwoKVxuICBcbiAgICAgICMgQ3JlYXRlIHF1ZXN0aW9uc1xuICAgICAgcmVhZG9ubHkgPSBAc291cmNlTm90ZT8gYW5kIG5vdCBAYXV0aC51cGRhdGUoXCJzb3VyY2Vfbm90ZXNcIiwgQHNvdXJjZU5vdGUpXG5cbiAgICAgIHF1ZXN0aW9ucyA9IFtcbiAgICAgICAgbmV3IGZvcm1zLkRhdGVRdWVzdGlvblxuICAgICAgICAgIGlkOiAnZGF0ZSdcbiAgICAgICAgICBtb2RlbDogQG1vZGVsXG4gICAgICAgICAgcHJvbXB0OiAnRGF0ZSBvZiBWaXNpdCdcbiAgICAgICAgICByZXF1aXJlZDogdHJ1ZVxuICAgICAgICAgIHJlYWRvbmx5OiByZWFkb25seVxuICAgICAgICBuZXcgZm9ybXMuUmFkaW9RdWVzdGlvblxuICAgICAgICAgIGlkOiAnc3RhdHVzJ1xuICAgICAgICAgIG1vZGVsOiBAbW9kZWxcbiAgICAgICAgICBwcm9tcHQ6ICdTdGF0dXMgb2YgV2F0ZXIgU291cmNlJ1xuICAgICAgICAgIG9wdGlvbnM6IFtbJ29rJywgJ0Z1bmN0aW9uYWwnXSwgWydtYWludCcsICdOZWVkcyBtYWludGVuYW5jZSddLCBbJ2Jyb2tlbicsICdOb24tZnVuY3Rpb25hbCddLCBbJ21pc3NpbmcnLCAnTm8gbG9uZ2VyIGV4aXN0cyddXVxuICAgICAgICAgIHJlcXVpcmVkOiB0cnVlXG4gICAgICAgICAgcmVhZG9ubHk6IHJlYWRvbmx5XG4gICAgICAgIG5ldyBmb3Jtcy5UZXh0UXVlc3Rpb25cbiAgICAgICAgICBpZDogJ25vdGVzJ1xuICAgICAgICAgIG1vZGVsOiBAbW9kZWxcbiAgICAgICAgICBwcm9tcHQ6ICdOb3RlcydcbiAgICAgICAgICBtdWx0aWxpbmU6IHRydWVcbiAgICAgICAgICByZWFkb25seTogcmVhZG9ubHlcbiAgICAgIF1cblxuICAgICAgIyBDcmVhdGUgZm9ybVxuICAgICAgaWYgcmVhZG9ubHlcbiAgICAgICAgZm9ybSA9IG5ldyBmb3Jtcy5RdWVzdGlvbkdyb3VwXG4gICAgICAgICAgY29udGVudHM6IHF1ZXN0aW9uc1xuICAgICAgZWxzZVxuICAgICAgICBmb3JtID0gbmV3IGZvcm1zLlNhdmVDYW5jZWxGb3JtXG4gICAgICAgICAgY29udGVudHM6IHF1ZXN0aW9uc1xuICBcbiAgICAgICAgQGxpc3RlblRvIGZvcm0sICdzYXZlJywgPT5cbiAgICAgICAgICBAZGIuc291cmNlX25vdGVzLnVwc2VydCBAbW9kZWwudG9KU09OKCksID0+IEBwYWdlci5jbG9zZVBhZ2UoKVxuXG4gICAgICAgIEBsaXN0ZW5UbyBmb3JtLCAnY2FuY2VsJywgPT5cbiAgICAgICAgICBAcGFnZXIuY2xvc2VQYWdlKClcblxuICAgICAgIyBMb2FkIGZvcm0gZnJvbSBzb3VyY2Ugbm90ZSBpZiBleGlzdHNcbiAgICAgIGlmIEBzb3VyY2VOb3RlXG4gICAgICAgICAgQG1vZGVsLnNldChAc291cmNlTm90ZSlcbiAgICAgIGVsc2VcbiAgICAgICAgIyBDcmVhdGUgZGVmYXVsdCBlbnRyeVxuICAgICAgICBAbW9kZWwuc2V0KHNvdXJjZTogQG9wdGlvbnMuc291cmNlLCBkYXRlOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkuc3Vic3RyaW5nKDAsMTApKVxuXG4gICAgICBAJGVsLmVtcHR5KCkuYXBwZW5kKGZvcm0uZWwpICJdfQ==
;