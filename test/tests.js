require=(function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
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


},{"forms":"EAVIrc","./helpers/UIDriver":2}],3:[function(require,module,exports){
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


},{"../app/js/GeoJSON":4}],5:[function(require,module,exports){
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


},{"forms":"EAVIrc","./helpers/UIDriver":2,"../app/js/pages/ImagePage":6}],7:[function(require,module,exports){
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


},{"forms":"EAVIrc","./helpers/UIDriver":2,"../app/js/pages/ImagePage":6}],8:[function(require,module,exports){
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


},{"../app/js/ItemTracker":9}],10:[function(require,module,exports){
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


},{"../app/js/db/LocalDb":11,"../app/js/db/HybridDb":12,"./db_queries":13}],14:[function(require,module,exports){
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


},{"../app/js/db/LocalDb":11,"./db_queries":13}],15:[function(require,module,exports){
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


},{"../app/js/LocationView":16,"./helpers/UIDriver":2}],17:[function(require,module,exports){
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


},{"../app/js/db/RemoteDb":18,"./db_queries":13}],19:[function(require,module,exports){
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


},{"../app/js/auth":20}],13:[function(require,module,exports){
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


},{"../app/js/GeoJSON":4}],21:[function(require,module,exports){
(function() {
  var assert, sync;

  assert = chai.assert;

  sync = require('../app/js/sync');

  describe("Repeater", function() {
    beforeEach(function() {});
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

}).call(this);


},{"../app/js/sync":22}],23:[function(require,module,exports){
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


},{"../app/js/sourcecodes":24,"./helpers/JsonServer":25}],"forms":[function(require,module,exports){
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


},{"./form-controls":26,"./DateQuestion":27,"./DropdownQuestion":28,"./QuestionGroup":29,"./NumberQuestion":30,"./SaveCancelForm":31,"./SourceQuestion":32,"./ImageQuestion":33,"./ImagesQuestion":34,"./Instructions":35}],2:[function(require,module,exports){
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


},{}],4:[function(require,module,exports){
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


},{}],9:[function(require,module,exports){
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


},{}],24:[function(require,module,exports){
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


},{}],22:[function(require,module,exports){
(function() {
  var Repeater,
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


},{}],25:[function(require,module,exports){
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


},{"./LocationFinder":36,"./GeoJSON":4}],6:[function(require,module,exports){
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


},{"../Page":37}],11:[function(require,module,exports){
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


},{"./selector":38,"./utils":39}],12:[function(require,module,exports){
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


},{"./utils":39}],26:[function(require,module,exports){
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

},{}],29:[function(require,module,exports){
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


},{}],28:[function(require,module,exports){
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


},{"./form-controls":26}],27:[function(require,module,exports){
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


},{"./form-controls":26}],30:[function(require,module,exports){
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


},{"./form-controls":26,"../pages/SourceListPage":40,"../sourcecodes":24}],34:[function(require,module,exports){
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


},{"./form-controls":26,"../pages/ImagePage":6}],33:[function(require,module,exports){
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


},{"./form-controls":26,"../pages/ImagePage":6}],36:[function(require,module,exports){
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


},{}],37:[function(require,module,exports){
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
},{"./EJSON":41}],39:[function(require,module,exports){
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


},{"./selector":38,"../GeoJSON":4}],40:[function(require,module,exports){
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


},{"../Page":37,"./SourcePage":42,"../LocationFinder":36,"../GeoJSON":4,"./NewSourcePage":43}],41:[function(require,module,exports){
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


},{"../Page":37,"../LocationView":16,"./SourceMapPage":44,"./SourceEditPage":45,"./NewTestPage":46,"./TestPage":47,"./SourceNotePage":48,"../forms":"EAVIrc"}],43:[function(require,module,exports){
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


},{"../Page":37,"./SourcePage":42,"../forms":"EAVIrc"}],46:[function(require,module,exports){
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


},{"../Page":37,"./TestPage":47}],44:[function(require,module,exports){
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
      if (bounds.getWest() === bounds.getEast()) {
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


},{"../Page":37,"./SourcePage":42,"../ItemTracker":9,"../LocationFinder":36,"../GeoJSON":4}],45:[function(require,module,exports){
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


},{"../Page":37,"../forms":"EAVIrc"}],48:[function(require,module,exports){
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


},{"../Page":37,"../forms":"EAVIrc"}],47:[function(require,module,exports){
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


},{"../Page":37,"../forms":"EAVIrc"}]},{},[1,3,10,7,5,8,14,15,17,19,13,23,21])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL3Rlc3QvRHJvcGRvd25RdWVzdGlvblRlc3RzLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvdGVzdC9HZW9KU09OVGVzdHMuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My90ZXN0L0ltYWdlc1F1ZXN0aW9uc1Rlc3RzLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvdGVzdC9JbWFnZVF1ZXN0aW9uVGVzdHMuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My90ZXN0L0l0ZW1UcmFja2VyVGVzdHMuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My90ZXN0L0h5YnJpZERiVGVzdHMuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My90ZXN0L0xvY2FsRGJUZXN0cy5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL3Rlc3QvTG9jYXRpb25WaWV3VGVzdHMuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My90ZXN0L1JlbW90ZURiVGVzdHMuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My90ZXN0L2F1dGhUZXN0cy5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL3Rlc3QvZGJfcXVlcmllcy5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL3Rlc3Qvc3luY1Rlc3RzLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvdGVzdC9zb3VyY2Vjb2Rlc1Rlc3RzLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL2Zvcm1zL2luZGV4LmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvdGVzdC9oZWxwZXJzL1VJRHJpdmVyLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL0dlb0pTT04uY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvSXRlbVRyYWNrZXIuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvc291cmNlY29kZXMuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvc3luYy5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9hdXRoLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvdGVzdC9oZWxwZXJzL0pzb25TZXJ2ZXIuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvZGIvUmVtb3RlRGIuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvTG9jYXRpb25WaWV3LmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL3BhZ2VzL0ltYWdlUGFnZS5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9kYi9Mb2NhbERiLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL2RiL0h5YnJpZERiLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL2Zvcm1zL2Zvcm0tY29udHJvbHMuanMiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9mb3Jtcy9RdWVzdGlvbkdyb3VwLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL2Zvcm1zL1NhdmVDYW5jZWxGb3JtLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL2Zvcm1zL0luc3RydWN0aW9ucy5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9mb3Jtcy9Ecm9wZG93blF1ZXN0aW9uLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL2Zvcm1zL0RhdGVRdWVzdGlvbi5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9mb3Jtcy9OdW1iZXJRdWVzdGlvbi5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9mb3Jtcy9Tb3VyY2VRdWVzdGlvbi5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9mb3Jtcy9JbWFnZXNRdWVzdGlvbi5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9mb3Jtcy9JbWFnZVF1ZXN0aW9uLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL0xvY2F0aW9uRmluZGVyLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL1BhZ2UuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvZGIvc2VsZWN0b3IuanMiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9kYi91dGlscy5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9wYWdlcy9Tb3VyY2VMaXN0UGFnZS5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9kYi9FSlNPTi5qcyIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL3BhZ2VzL1NvdXJjZVBhZ2UuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvcGFnZXMvTmV3U291cmNlUGFnZS5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9wYWdlcy9OZXdUZXN0UGFnZS5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9wYWdlcy9Tb3VyY2VNYXBQYWdlLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL3BhZ2VzL1NvdXJjZUVkaXRQYWdlLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL3BhZ2VzL1NvdXJjZU5vdGVQYWdlLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL3BhZ2VzL1Rlc3RQYWdlLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Q0FBQSxLQUFBLDRCQUFBOztDQUFBLENBQUEsQ0FBUyxDQUFJLEVBQWI7O0NBQUEsQ0FDQSxDQUFtQixJQUFBLFNBQW5COztDQURBLENBRUEsQ0FBVyxJQUFBLENBQVgsWUFBVzs7Q0FGWCxDQVlBLENBQTZCLEtBQTdCLENBQTZCLFNBQTdCO0NBQ1UsQ0FBc0IsQ0FBQSxJQUE5QixFQUE4QixFQUE5QixTQUFBO0NBQ0UsRUFBVyxHQUFYLEdBQVcsQ0FBWDtDQUNFLEVBQWEsQ0FBWixDQUFELEdBQUE7Q0FDQyxFQUFlLENBQWYsSUFBRCxPQUFBLENBQWdCO0NBQ2QsQ0FBUyxDQUFDLElBQVYsQ0FBMEIsRUFBMUI7Q0FBQSxDQUNPLEVBQUMsQ0FBUixLQUFBO0NBREEsQ0FFQSxFQUZBLE1BRUE7Q0FMTyxTQUVPO0NBRmxCLE1BQVc7Q0FBWCxDQU9BLENBQTBCLEdBQTFCLEdBQTBCLFlBQTFCO0NBQ0UsRUFBQSxDQUFDLENBQUssR0FBTjtDQUFXLENBQUEsQ0FBQSxPQUFBO0NBQVgsU0FBQTtDQUFBLENBQytC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QUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtB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Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMXRCQTtDQUFBLEtBQUEsMEZBQUE7O0NBQUEsQ0FBQSxDQUEwQixJQUFBLEtBQUEsV0FBMUI7O0NBQUEsQ0FDQSxDQUFjLElBQUEsSUFBZCxDQUFjOztDQURkLENBRUEsQ0FBVSxJQUFWLEtBQVU7O0NBRlYsQ0FLQSxDQUFzQixFQUFBLEVBQWYsQ0FBZSxDQUFDLEVBQXZCO0NBQ0UsT0FBQTtDQUFBLENBQXFD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QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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QTVCLElBQUQsS0FBQSxHQUFBO0NBSEYsUUFBNEI7UUFGcEI7Q0FoRVosSUFnRVk7O0NBaEVaOztDQURxQjs7Q0FIdkIsQ0EyRUEsQ0FBaUIsR0FBWCxDQUFOLENBM0VBO0NBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJhc3NlcnQgPSBjaGFpLmFzc2VydFxuRHJvcGRvd25RdWVzdGlvbiA9IHJlcXVpcmUoJ2Zvcm1zJykuRHJvcGRvd25RdWVzdGlvblxuVUlEcml2ZXIgPSByZXF1aXJlICcuL2hlbHBlcnMvVUlEcml2ZXInXG5cbiMgY2xhc3MgTW9ja0xvY2F0aW9uRmluZGVyXG4jICAgY29uc3RydWN0b3I6ICAtPlxuIyAgICAgXy5leHRlbmQgQCwgQmFja2JvbmUuRXZlbnRzXG5cbiMgICBnZXRMb2NhdGlvbjogLT5cbiMgICBzdGFydFdhdGNoOiAtPlxuIyAgIHN0b3BXYXRjaDogLT5cblxuZGVzY3JpYmUgJ0Ryb3Bkb3duUXVlc3Rpb24nLCAtPlxuICBjb250ZXh0ICdXaXRoIGEgZmV3IG9wdGlvbnMnLCAtPlxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgIEBtb2RlbCA9IG5ldyBCYWNrYm9uZS5Nb2RlbCgpXG4gICAgICBAcXVlc3Rpb24gPSBuZXcgRHJvcGRvd25RdWVzdGlvblxuICAgICAgICBvcHRpb25zOiBbWydhJywgJ0FwcGxlJ10sIFsnYicsICdCYW5hbmEnXV1cbiAgICAgICAgbW9kZWw6IEBtb2RlbFxuICAgICAgICBpZDogXCJxMVwiXG5cbiAgICBpdCAnYWNjZXB0cyBrbm93biB2YWx1ZScsIC0+XG4gICAgICBAbW9kZWwuc2V0KHExOiAnYScpXG4gICAgICBhc3NlcnQuZXF1YWwgQG1vZGVsLmdldCgncTEnKSwgJ2EnXG4gICAgICBhc3NlcnQuaXNGYWxzZSBAcXVlc3Rpb24uJChcInNlbGVjdFwiKS5pcyhcIjpkaXNhYmxlZFwiKVxuXG4gICAgaXQgJ2lzIGRpc2FibGVkIHdpdGggdW5rbm93biB2YWx1ZScsIC0+XG4gICAgICBAbW9kZWwuc2V0KHExOiAneCcpXG4gICAgICBhc3NlcnQuZXF1YWwgQG1vZGVsLmdldCgncTEnKSwgJ3gnXG4gICAgICBhc3NlcnQuaXNUcnVlIEBxdWVzdGlvbi4kKFwic2VsZWN0XCIpLmlzKFwiOmRpc2FibGVkXCIpXG5cbiAgICBpdCAnaXMgbm90IGRpc2FibGVkIHdpdGggZW1wdHkgdmFsdWUnLCAtPlxuICAgICAgQG1vZGVsLnNldChxMTogbnVsbClcbiAgICAgIGFzc2VydC5lcXVhbCBAbW9kZWwuZ2V0KCdxMScpLCBudWxsXG4gICAgICBhc3NlcnQuaXNGYWxzZSBAcXVlc3Rpb24uJChcInNlbGVjdFwiKS5pcyhcIjpkaXNhYmxlZFwiKVxuXG4gICAgaXQgJ2lzIHJlZW5hYmxlZCB3aXRoIHNldHRpbmcgdmFsdWUnLCAtPlxuICAgICAgQG1vZGVsLnNldChxMTogJ3gnKVxuICAgICAgYXNzZXJ0LmVxdWFsIEBtb2RlbC5nZXQoJ3ExJyksICd4J1xuICAgICAgQHF1ZXN0aW9uLnNldE9wdGlvbnMoW1snYScsICdBcHBsZSddLCBbJ2InLCAnQmFuYW5hJ10sIFsneCcsICdLaXdpJ11dKVxuICAgICAgYXNzZXJ0LmlzRmFsc2UgQHF1ZXN0aW9uLiQoXCJzZWxlY3RcIikuaXMoXCI6ZGlzYWJsZWRcIilcblxuIiwiYXNzZXJ0ID0gY2hhaS5hc3NlcnRcbkdlb0pTT04gPSByZXF1aXJlIFwiLi4vYXBwL2pzL0dlb0pTT05cIlxuXG5kZXNjcmliZSAnR2VvSlNPTicsIC0+XG4gIGl0ICdyZXR1cm5zIGEgcHJvcGVyIHBvbHlnb24nLCAtPlxuICAgIHNvdXRoV2VzdCA9IG5ldyBMLkxhdExuZygxMCwgMjApXG4gICAgbm9ydGhFYXN0ID0gbmV3IEwuTGF0TG5nKDEzLCAyMylcbiAgICBib3VuZHMgPSBuZXcgTC5MYXRMbmdCb3VuZHMoc291dGhXZXN0LCBub3J0aEVhc3QpXG5cbiAgICBqc29uID0gR2VvSlNPTi5sYXRMbmdCb3VuZHNUb0dlb0pTT04oYm91bmRzKVxuICAgIGFzc2VydCBfLmlzRXF1YWwganNvbiwge1xuICAgICAgdHlwZTogXCJQb2x5Z29uXCIsXG4gICAgICBjb29yZGluYXRlczogW1xuICAgICAgICBbWzIwLDEwXSxbMjAsMTNdLFsyMywxM10sWzIzLDEwXSxbMjAsMTBdXVxuICAgICAgXVxuICAgIH1cblxuICBpdCAnZ2V0cyByZWxhdGl2ZSBsb2NhdGlvbiBOJywgLT5cbiAgICBmcm9tID0geyB0eXBlOiBcIlBvaW50XCIsIGNvb3JkaW5hdGVzOiBbMTAsIDIwXX1cbiAgICB0byA9IHsgdHlwZTogXCJQb2ludFwiLCBjb29yZGluYXRlczogWzEwLCAyMV19XG4gICAgc3RyID0gR2VvSlNPTi5nZXRSZWxhdGl2ZUxvY2F0aW9uKGZyb20sIHRvKVxuICAgIGFzc2VydC5lcXVhbCBzdHIsICcxMTEuMmttIE4nXG5cbiAgaXQgJ2dldHMgcmVsYXRpdmUgbG9jYXRpb24gUycsIC0+XG4gICAgZnJvbSA9IHsgdHlwZTogXCJQb2ludFwiLCBjb29yZGluYXRlczogWzEwLCAyMF19XG4gICAgdG8gPSB7IHR5cGU6IFwiUG9pbnRcIiwgY29vcmRpbmF0ZXM6IFsxMCwgMTldfVxuICAgIHN0ciA9IEdlb0pTT04uZ2V0UmVsYXRpdmVMb2NhdGlvbihmcm9tLCB0bylcbiAgICBhc3NlcnQuZXF1YWwgc3RyLCAnMTExLjJrbSBTJ1xuIiwiYXNzZXJ0ID0gY2hhaS5hc3NlcnRcbmZvcm1zID0gcmVxdWlyZSgnZm9ybXMnKVxuVUlEcml2ZXIgPSByZXF1aXJlICcuL2hlbHBlcnMvVUlEcml2ZXInXG5JbWFnZVBhZ2UgPSByZXF1aXJlICcuLi9hcHAvanMvcGFnZXMvSW1hZ2VQYWdlJ1xuXG5jbGFzcyBNb2NrSW1hZ2VNYW5hZ2VyIFxuICBnZXRJbWFnZVRodW1ibmFpbFVybDogKGltYWdlVWlkLCBzdWNjZXNzLCBlcnJvcikgLT5cbiAgICBzdWNjZXNzIFwiaW1hZ2VzL1wiICsgaW1hZ2VVaWQgKyBcIi5qcGdcIlxuXG4gIGdldEltYWdlVXJsOiAoaW1hZ2VVaWQsIHN1Y2Nlc3MsIGVycm9yKSAtPlxuICAgIHN1Y2Nlc3MgXCJpbWFnZXMvXCIgKyBpbWFnZVVpZCArIFwiLmpwZ1wiXG5cbmNsYXNzIE1vY2tDYW1lcmFcbiAgdGFrZVBpY3R1cmU6IChzdWNjZXNzLCBlcnJvcikgLT5cbiAgICBzdWNjZXNzKFwiaHR0cDovLzEyMzQuanBnXCIpXG5cbmRlc2NyaWJlICdJbWFnZXNRdWVzdGlvbicsIC0+XG4gIGJlZm9yZUVhY2ggLT5cbiAgICAjIENyZWF0ZSBtb2RlbFxuICAgIEBtb2RlbCA9IG5ldyBCYWNrYm9uZS5Nb2RlbCBcblxuICBjb250ZXh0ICdXaXRoIGEgbm8gY2FtZXJhJywgLT5cbiAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAjIENyZWF0ZSBjb250ZXh0XG4gICAgICBAY3R4ID0ge1xuICAgICAgICBpbWFnZU1hbmFnZXI6IG5ldyBNb2NrSW1hZ2VNYW5hZ2VyKClcbiAgICAgIH1cblxuICAgICAgQHF1ZXN0aW9uID0gbmV3IGZvcm1zLkltYWdlc1F1ZXN0aW9uXG4gICAgICAgIG1vZGVsOiBAbW9kZWxcbiAgICAgICAgaWQ6IFwicTFcIlxuICAgICAgICBjdHg6IEBjdHhcblxuICAgIGl0ICdkaXNwbGF5cyBubyBpbWFnZScsIC0+XG4gICAgICBAbW9kZWwuc2V0KHExOiBbXSlcbiAgICAgIGFzc2VydC5pc1RydWUgdHJ1ZVxuXG4gICAgaXQgJ2Rpc3BsYXlzIG9uZSBpbWFnZScsIC0+XG4gICAgICBAbW9kZWwuc2V0KHExOiBbe2lkOiBcIjEyMzRcIn1dKVxuICAgICAgYXNzZXJ0LmVxdWFsIEBxdWVzdGlvbi4kKFwiaW1nLnRodW1ibmFpbC1pbWdcIikuYXR0cihcInNyY1wiKSwgXCJpbWFnZXMvMTIzNC5qcGdcIlxuXG4gICAgaXQgJ29wZW5zIHBhZ2UnLCAtPlxuICAgICAgQG1vZGVsLnNldChxMTogW3tpZDogXCIxMjM0XCJ9XSlcbiAgICAgIHNweSA9IHNpbm9uLnNweSgpXG4gICAgICBAY3R4LnBhZ2VyID0geyBvcGVuUGFnZTogc3B5IH1cbiAgICAgIEBxdWVzdGlvbi4kKFwiaW1nLnRodW1ibmFpbC1pbWdcIikuY2xpY2soKVxuXG4gICAgICBhc3NlcnQuaXNUcnVlIHNweS5jYWxsZWRPbmNlXG4gICAgICBhc3NlcnQuZXF1YWwgc3B5LmFyZ3NbMF1bMV0uaWQsIFwiMTIzNFwiXG5cbiAgICBpdCAnYWxsb3dzIHJlbW92aW5nIGltYWdlJywgLT5cbiAgICAgIEBtb2RlbC5zZXQocTE6IFt7aWQ6IFwiMTIzNFwifV0pXG4gICAgICBAY3R4LnBhZ2VyID0geyBcbiAgICAgICAgb3BlblBhZ2U6IChwYWdlLCBvcHRpb25zKSA9PlxuICAgICAgICAgIG9wdGlvbnMub25SZW1vdmUoKVxuICAgICAgfVxuICAgICAgQHF1ZXN0aW9uLiQoXCJpbWcudGh1bWJuYWlsLWltZ1wiKS5jbGljaygpXG4gICAgICBhc3NlcnQuZXF1YWwgQHF1ZXN0aW9uLiQoXCJpbWcjYWRkXCIpLmxlbmd0aCwgMFxuXG4gICAgaXQgJ2Rpc3BsYXlzIG5vIGFkZCcsIC0+XG4gICAgICBhc3NlcnQuZXF1YWwgQHF1ZXN0aW9uLiQoXCJpbWcjYWRkXCIpLmxlbmd0aCwgMFxuXG4gIGNvbnRleHQgJ1dpdGggYSBjYW1lcmEnLCAtPlxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICMgQ3JlYXRlIGNvbnRleHRcbiAgICAgIEBjdHggPSB7XG4gICAgICAgIGltYWdlTWFuYWdlcjogbmV3IE1vY2tJbWFnZU1hbmFnZXIoKVxuICAgICAgICBjYW1lcmE6IG5ldyBNb2NrQ2FtZXJhKClcbiAgICAgIH1cblxuICAgICAgQHF1ZXN0aW9uID0gbmV3IGZvcm1zLkltYWdlc1F1ZXN0aW9uXG4gICAgICAgIG1vZGVsOiBAbW9kZWxcbiAgICAgICAgaWQ6IFwicTFcIlxuICAgICAgICBjdHg6IEBjdHhcblxuICAgIGl0ICdkaXNwbGF5cyBubyBhZGQgaWYgaW1hZ2UgbWFuYWdlciBoYXMgbm8gYWRkSW1hZ2UnLCAtPlxuICAgICAgYXNzZXJ0LmVxdWFsIEBxdWVzdGlvbi4kKFwiaW1nI2FkZFwiKS5sZW5ndGgsIDBcblxuICBjb250ZXh0ICdXaXRoIGEgY2FtZXJhIGFuZCBpbWFnZU1hbmFnZXIgd2l0aCBhZGRJbWFnZScsIC0+XG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgaW1hZ2VNYW5hZ2VyID0gbmV3IE1vY2tJbWFnZU1hbmFnZXIoKVxuICAgICAgaW1hZ2VNYW5hZ2VyLmFkZEltYWdlID0gKHVybCwgc3VjY2VzcywgZXJyb3IpIC0+XG4gICAgICAgIGFzc2VydC5lcXVhbCB1cmwsIFwiaHR0cDovLzEyMzQuanBnXCJcbiAgICAgICAgc3VjY2VzcyBcIjEyMzRcIlxuXG4gICAgICAjIENyZWF0ZSBjb250ZXh0XG4gICAgICBAY3R4ID0ge1xuICAgICAgICBpbWFnZU1hbmFnZXI6IGltYWdlTWFuYWdlclxuICAgICAgICBjYW1lcmE6IG5ldyBNb2NrQ2FtZXJhKClcbiAgICAgIH1cblxuICAgICAgQHF1ZXN0aW9uID0gbmV3IGZvcm1zLkltYWdlc1F1ZXN0aW9uXG4gICAgICAgIG1vZGVsOiBAbW9kZWxcbiAgICAgICAgaWQ6IFwicTFcIlxuICAgICAgICBjdHg6IEBjdHhcblxuICAgIGl0ICd0YWtlcyBhIHBob3RvJywgLT5cbiAgICAgIEBjdHguY2FtZXJhID0gbmV3IE1vY2tDYW1lcmEoKVxuICAgICAgQHF1ZXN0aW9uLiQoXCJpbWcjYWRkXCIpLmNsaWNrKClcbiAgICAgIGFzc2VydC5pc1RydWUgXy5pc0VxdWFsKEBtb2RlbC5nZXQoXCJxMVwiKSwgW3tpZDpcIjEyMzRcIn1dKSwgQG1vZGVsLmdldChcInExXCIpXG5cbiAgICAiLCJhc3NlcnQgPSBjaGFpLmFzc2VydFxuZm9ybXMgPSByZXF1aXJlKCdmb3JtcycpXG5VSURyaXZlciA9IHJlcXVpcmUgJy4vaGVscGVycy9VSURyaXZlcidcbkltYWdlUGFnZSA9IHJlcXVpcmUgJy4uL2FwcC9qcy9wYWdlcy9JbWFnZVBhZ2UnXG5cbmNsYXNzIE1vY2tJbWFnZU1hbmFnZXIgXG4gIGdldEltYWdlVGh1bWJuYWlsVXJsOiAoaW1hZ2VVaWQsIHN1Y2Nlc3MsIGVycm9yKSAtPlxuICAgIHN1Y2Nlc3MgXCJpbWFnZXMvXCIgKyBpbWFnZVVpZCArIFwiLmpwZ1wiXG5cbiAgZ2V0SW1hZ2VVcmw6IChpbWFnZVVpZCwgc3VjY2VzcywgZXJyb3IpIC0+XG4gICAgc3VjY2VzcyBcImltYWdlcy9cIiArIGltYWdlVWlkICsgXCIuanBnXCJcblxuY2xhc3MgTW9ja0NhbWVyYVxuICB0YWtlUGljdHVyZTogKHN1Y2Nlc3MsIGVycm9yKSAtPlxuICAgIHN1Y2Nlc3MoXCJodHRwOi8vMTIzNC5qcGdcIilcblxuZGVzY3JpYmUgJ0ltYWdlUXVlc3Rpb24nLCAtPlxuICBiZWZvcmVFYWNoIC0+XG4gICAgIyBDcmVhdGUgbW9kZWxcbiAgICBAbW9kZWwgPSBuZXcgQmFja2JvbmUuTW9kZWwgXG5cbiAgY29udGV4dCAnV2l0aCBhIG5vIGNhbWVyYScsIC0+XG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgIyBDcmVhdGUgY29udGV4dFxuICAgICAgQGN0eCA9IHtcbiAgICAgICAgaW1hZ2VNYW5hZ2VyOiBuZXcgTW9ja0ltYWdlTWFuYWdlcigpXG4gICAgICB9XG5cbiAgICAgIEBxdWVzdGlvbiA9IG5ldyBmb3Jtcy5JbWFnZVF1ZXN0aW9uXG4gICAgICAgIG1vZGVsOiBAbW9kZWxcbiAgICAgICAgaWQ6IFwicTFcIlxuICAgICAgICBjdHg6IEBjdHhcblxuICAgIGl0ICdkaXNwbGF5cyBubyBpbWFnZScsIC0+XG4gICAgICBhc3NlcnQuaXNUcnVlIHRydWVcblxuICAgIGl0ICdkaXNwbGF5cyBvbmUgaW1hZ2UnLCAtPlxuICAgICAgQG1vZGVsLnNldChxMToge2lkOiBcIjEyMzRcIn0pXG4gICAgICBhc3NlcnQuZXF1YWwgQHF1ZXN0aW9uLiQoXCJpbWcudGh1bWJuYWlsLWltZ1wiKS5hdHRyKFwic3JjXCIpLCBcImltYWdlcy8xMjM0LmpwZ1wiXG5cbiAgICBpdCAnb3BlbnMgcGFnZScsIC0+XG4gICAgICBAbW9kZWwuc2V0KHExOiB7aWQ6IFwiMTIzNFwifSlcbiAgICAgIHNweSA9IHNpbm9uLnNweSgpXG4gICAgICBAY3R4LnBhZ2VyID0geyBvcGVuUGFnZTogc3B5IH1cbiAgICAgIEBxdWVzdGlvbi4kKFwiaW1nLnRodW1ibmFpbC1pbWdcIikuY2xpY2soKVxuXG4gICAgICBhc3NlcnQuaXNUcnVlIHNweS5jYWxsZWRPbmNlXG4gICAgICBhc3NlcnQuZXF1YWwgc3B5LmFyZ3NbMF1bMV0uaWQsIFwiMTIzNFwiXG5cbiAgICBpdCAnYWxsb3dzIHJlbW92aW5nIGltYWdlJywgLT5cbiAgICAgIEBtb2RlbC5zZXQocTE6IHtpZDogXCIxMjM0XCJ9KVxuICAgICAgQGN0eC5wYWdlciA9IHsgXG4gICAgICAgIG9wZW5QYWdlOiAocGFnZSwgb3B0aW9ucykgPT5cbiAgICAgICAgICBvcHRpb25zLm9uUmVtb3ZlKClcbiAgICAgIH1cbiAgICAgIEBxdWVzdGlvbi4kKFwiaW1nLnRodW1ibmFpbC1pbWdcIikuY2xpY2soKVxuICAgICAgYXNzZXJ0LmVxdWFsIEBtb2RlbC5nZXQoXCJxMVwiKSwgbnVsbFxuXG4gICAgaXQgJ2Rpc3BsYXlzIG5vIGFkZCcsIC0+XG4gICAgICBhc3NlcnQuZXF1YWwgQHF1ZXN0aW9uLiQoXCJpbWcjYWRkXCIpLmxlbmd0aCwgMFxuXG4gIGNvbnRleHQgJ1dpdGggYSBjYW1lcmEnLCAtPlxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICMgQ3JlYXRlIGNvbnRleHRcbiAgICAgIEBjdHggPSB7XG4gICAgICAgIGltYWdlTWFuYWdlcjogbmV3IE1vY2tJbWFnZU1hbmFnZXIoKVxuICAgICAgICBjYW1lcmE6IG5ldyBNb2NrQ2FtZXJhKClcbiAgICAgIH1cblxuICAgICAgQHF1ZXN0aW9uID0gbmV3IGZvcm1zLkltYWdlUXVlc3Rpb25cbiAgICAgICAgbW9kZWw6IEBtb2RlbFxuICAgICAgICBpZDogXCJxMVwiXG4gICAgICAgIGN0eDogQGN0eFxuXG4gICAgaXQgJ2Rpc3BsYXlzIG5vIGFkZCBpZiBpbWFnZSBtYW5hZ2VyIGhhcyBubyBhZGRJbWFnZScsIC0+XG4gICAgICBhc3NlcnQuZXF1YWwgQHF1ZXN0aW9uLiQoXCJpbWcjYWRkXCIpLmxlbmd0aCwgMFxuXG4gIGNvbnRleHQgJ1dpdGggYSBjYW1lcmEgYW5kIGltYWdlTWFuYWdlciB3aXRoIGFkZEltYWdlJywgLT5cbiAgICBiZWZvcmVFYWNoIC0+XG4gICAgICBpbWFnZU1hbmFnZXIgPSBuZXcgTW9ja0ltYWdlTWFuYWdlcigpXG4gICAgICBpbWFnZU1hbmFnZXIuYWRkSW1hZ2UgPSAodXJsLCBzdWNjZXNzLCBlcnJvcikgLT5cbiAgICAgICAgYXNzZXJ0LmVxdWFsIHVybCwgXCJodHRwOi8vMTIzNC5qcGdcIlxuICAgICAgICBzdWNjZXNzIFwiMTIzNFwiXG5cbiAgICAgICMgQ3JlYXRlIGNvbnRleHRcbiAgICAgIEBjdHggPSB7XG4gICAgICAgIGltYWdlTWFuYWdlcjogaW1hZ2VNYW5hZ2VyXG4gICAgICAgIGNhbWVyYTogbmV3IE1vY2tDYW1lcmEoKVxuICAgICAgfVxuXG4gICAgICBAcXVlc3Rpb24gPSBuZXcgZm9ybXMuSW1hZ2VRdWVzdGlvblxuICAgICAgICBtb2RlbDogQG1vZGVsXG4gICAgICAgIGlkOiBcInExXCJcbiAgICAgICAgY3R4OiBAY3R4XG5cbiAgICBpdCAndGFrZXMgYSBwaG90bycsIC0+XG4gICAgICBAY3R4LmNhbWVyYSA9IG5ldyBNb2NrQ2FtZXJhKClcbiAgICAgIEBxdWVzdGlvbi4kKFwiaW1nI2FkZFwiKS5jbGljaygpXG4gICAgICBhc3NlcnQuaXNUcnVlIF8uaXNFcXVhbChAbW9kZWwuZ2V0KFwicTFcIiksIHtpZDpcIjEyMzRcIn0pLCBAbW9kZWwuZ2V0KFwicTFcIilcblxuICAgIGl0ICdubyBsb25nZXIgaGFzIGFkZCBhZnRlciB0YWtpbmcgcGhvdG8nLCAtPlxuICAgICAgQGN0eC5jYW1lcmEgPSBuZXcgTW9ja0NhbWVyYSgpXG4gICAgICBAcXVlc3Rpb24uJChcImltZyNhZGRcIikuY2xpY2soKVxuICAgICAgYXNzZXJ0LmVxdWFsIEBxdWVzdGlvbi4kKFwiaW1nI2FkZFwiKS5sZW5ndGgsIDBcblxuICAgICIsImFzc2VydCA9IGNoYWkuYXNzZXJ0XG5JdGVtVHJhY2tlciA9IHJlcXVpcmUgXCIuLi9hcHAvanMvSXRlbVRyYWNrZXJcIlxuXG5kZXNjcmliZSAnSXRlbVRyYWNrZXInLCAtPlxuICBiZWZvcmVFYWNoIC0+XG4gICAgQHRyYWNrZXIgPSBuZXcgSXRlbVRyYWNrZXIoKVxuXG4gIGl0IFwicmVjb3JkcyBhZGRzXCIsIC0+XG4gICAgaXRlbXMgPSAgW1xuICAgICAgX2lkOiAxLCB4OjFcbiAgICAgIF9pZDogMiwgeDoyXG4gICAgXVxuICAgIFthZGRzLCByZW1vdmVzXSA9IEB0cmFja2VyLnVwZGF0ZShpdGVtcylcbiAgICBhc3NlcnQuZGVlcEVxdWFsIGFkZHMsIGl0ZW1zXG4gICAgYXNzZXJ0LmRlZXBFcXVhbCByZW1vdmVzLCBbXVxuXG4gIGl0IFwicmVtZW1iZXJzIGl0ZW1zXCIsIC0+XG4gICAgaXRlbXMgPSAgW1xuICAgICAge19pZDogMSwgeDoxfVxuICAgICAge19pZDogMiwgeDoyfVxuICAgIF1cbiAgICBbYWRkcywgcmVtb3Zlc10gPSBAdHJhY2tlci51cGRhdGUoaXRlbXMpXG4gICAgW2FkZHMsIHJlbW92ZXNdID0gQHRyYWNrZXIudXBkYXRlKGl0ZW1zKVxuICAgIGFzc2VydC5kZWVwRXF1YWwgYWRkcywgW11cbiAgICBhc3NlcnQuZGVlcEVxdWFsIHJlbW92ZXMsIFtdXG5cbiAgaXQgXCJzZWVzIHJlbW92ZWQgaXRlbXNcIiwgLT5cbiAgICBpdGVtczEgPSAgW1xuICAgICAge19pZDogMSwgeDoxfVxuICAgICAge19pZDogMiwgeDoyfVxuICAgIF1cbiAgICBpdGVtczIgPSAgW1xuICAgICAge19pZDogMSwgeDoxfVxuICAgIF1cbiAgICBAdHJhY2tlci51cGRhdGUoaXRlbXMxKVxuICAgIFthZGRzLCByZW1vdmVzXSA9IEB0cmFja2VyLnVwZGF0ZShpdGVtczIpXG4gICAgYXNzZXJ0LmRlZXBFcXVhbCBhZGRzLCBbXVxuICAgIGFzc2VydC5kZWVwRXF1YWwgcmVtb3ZlcywgW3tfaWQ6IDIsIHg6Mn1dXG5cbiAgaXQgXCJzZWVzIHJlbW92ZWQgY2hhbmdlc1wiLCAtPlxuICAgIGl0ZW1zMSA9ICBbXG4gICAgICB7X2lkOiAxLCB4OjF9XG4gICAgICB7X2lkOiAyLCB4OjJ9XG4gICAgXVxuICAgIGl0ZW1zMiA9ICBbXG4gICAgICB7X2lkOiAxLCB4OjF9XG4gICAgICB7X2lkOiAyLCB4OjR9XG4gICAgXVxuICAgIEB0cmFja2VyLnVwZGF0ZShpdGVtczEpXG4gICAgW2FkZHMsIHJlbW92ZXNdID0gQHRyYWNrZXIudXBkYXRlKGl0ZW1zMilcbiAgICBhc3NlcnQuZGVlcEVxdWFsIGFkZHMsIFt7X2lkOiAyLCB4OjR9XVxuICAgIGFzc2VydC5kZWVwRXF1YWwgcmVtb3ZlcywgW3tfaWQ6IDIsIHg6Mn1dXG4iLCJhc3NlcnQgPSBjaGFpLmFzc2VydFxuTG9jYWxEYiA9IHJlcXVpcmUgXCIuLi9hcHAvanMvZGIvTG9jYWxEYlwiXG5IeWJyaWREYiA9IHJlcXVpcmUgXCIuLi9hcHAvanMvZGIvSHlicmlkRGJcIlxuZGJfcXVlcmllcyA9IHJlcXVpcmUgXCIuL2RiX3F1ZXJpZXNcIlxuXG4jIE5vdGU6IEFzc3VtZXMgbG9jYWwgZGIgaXMgc3luY2hyb25vdXMhXG5mYWlsID0gLT5cbiAgdGhyb3cgbmV3IEVycm9yKFwiZmFpbGVkXCIpXG5cbmRlc2NyaWJlICdIeWJyaWREYicsIC0+XG4gIGJlZm9yZUVhY2ggLT5cbiAgICBAbG9jYWwgPSBuZXcgTG9jYWxEYigpXG4gICAgQHJlbW90ZSA9IG5ldyBMb2NhbERiKClcbiAgICBAaHlicmlkID0gbmV3IEh5YnJpZERiKEBsb2NhbCwgQHJlbW90ZSlcbiAgICBAZGIgPSBAaHlicmlkXG5cbiAgICBAbGMgPSBAbG9jYWwuYWRkQ29sbGVjdGlvbihcInNjcmF0Y2hcIilcbiAgICBAcmMgPSBAcmVtb3RlLmFkZENvbGxlY3Rpb24oXCJzY3JhdGNoXCIpXG4gICAgQGhjID0gQGh5YnJpZC5hZGRDb2xsZWN0aW9uKFwic2NyYXRjaFwiKVxuXG4gICMgVE9ETyBGb3Igc29tZSByZWFzb24sIHRoaXMgYmxvY2tzIHRlc3RzXG4gICNkZXNjcmliZSBcInBhc3NlcyBxdWVyaWVzXCIsIC0+XG4gICMgIGRiX3F1ZXJpZXMuY2FsbCh0aGlzKVxuXG4gIGNvbnRleHQgXCJoeWJyaWQgbW9kZVwiLCAtPlxuICAgIGl0IFwiZmluZCBnaXZlcyBvbmx5IG9uZSByZXN1bHQgaWYgZGF0YSB1bmNoYW5nZWRcIiwgKGRvbmUpIC0+XG4gICAgICBAbGMuc2VlZChfaWQ6XCIxXCIsIGE6MSlcbiAgICAgIEBsYy5zZWVkKF9pZDpcIjJcIiwgYToyKVxuXG4gICAgICBAcmMuc2VlZChfaWQ6XCIxXCIsIGE6MSlcbiAgICAgIEByYy5zZWVkKF9pZDpcIjJcIiwgYToyKVxuXG4gICAgICBjYWxscyA9IDBcbiAgICAgIEBoYy5maW5kKHt9KS5mZXRjaCAoZGF0YSkgLT5cbiAgICAgICAgY2FsbHMgKz0gMVxuICAgICAgICBhc3NlcnQuZXF1YWwgZGF0YS5sZW5ndGgsIDJcbiAgICAgICAgYXNzZXJ0LmVxdWFsIGNhbGxzLCAxXG4gICAgICAgIGRvbmUoKVxuICAgICAgLCBmYWlsXG5cbiAgICBpdCBcImxvY2FsIHVwc2VydHMgYXJlIHJlc3BlY3RlZFwiLCAoZG9uZSkgLT5cbiAgICAgIEBsYy5zZWVkKF9pZDpcIjFcIiwgYToxKVxuICAgICAgQGxjLnVwc2VydChfaWQ6XCIyXCIsIGE6MilcblxuICAgICAgQHJjLnNlZWQoX2lkOlwiMVwiLCBhOjEpXG4gICAgICBAcmMuc2VlZChfaWQ6XCIyXCIsIGE6NClcblxuICAgICAgQGhjLmZpbmRPbmUgeyBfaWQ6IFwiMlwifSwgKGRvYykgLT5cbiAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCBkb2MsIHsgX2lkOiBcIjJcIiwgYTogMiB9XG4gICAgICAgIGRvbmUoKVxuICAgICAgLCBmYWlsXG5cbiAgICBpdCBcImZpbmQgcGVyZm9ybXMgZnVsbCBmaWVsZCByZW1vdGUgcXVlcmllcyBpbiBoeWJyaWQgbW9kZVwiLCAoZG9uZSkgLT5cbiAgICAgIEByYy5zZWVkKF9pZDpcIjFcIiwgYToxLCBiOjExKVxuICAgICAgQHJjLnNlZWQoX2lkOlwiMlwiLCBhOjIsIGI6MTIpXG5cbiAgICAgIEBoYy5maW5kKHt9LCB7IGZpZWxkczogeyBiOjAgfSB9KS5mZXRjaCAoZGF0YSkgPT5cbiAgICAgICAgaWYgZGF0YS5sZW5ndGggPT0gMFxuICAgICAgICAgIHJldHVyblxuICAgICAgICBhc3NlcnQuaXNVbmRlZmluZWQgZGF0YVswXS5iXG4gICAgICAgIEBsYy5maW5kT25lIHsgX2lkOiBcIjFcIiB9LCAoZG9jKSAtPlxuICAgICAgICAgIGFzc2VydC5lcXVhbCBkb2MuYiwgMTFcbiAgICAgICAgICBkb25lKClcblxuICAgIGl0IFwiZmluZE9uZSBwZXJmb3JtcyBmdWxsIGZpZWxkIHJlbW90ZSBxdWVyaWVzIGluIGh5YnJpZCBtb2RlXCIsIChkb25lKSAtPlxuICAgICAgQHJjLnNlZWQoX2lkOlwiMVwiLCBhOjEsIGI6MTEpXG4gICAgICBAcmMuc2VlZChfaWQ6XCIyXCIsIGE6MiwgYjoxMilcblxuICAgICAgQGhjLmZpbmRPbmUgeyBfaWQ6IFwiMVwiIH0sIHsgZmllbGRzOiB7IGI6MCB9IH0sIChkb2MpID0+XG4gICAgICAgIGFzc2VydC5pc1VuZGVmaW5lZCBkb2MuYlxuICAgICAgICBAbGMuZmluZE9uZSB7IF9pZDogXCIxXCIgfSwgKGRvYykgLT5cbiAgICAgICAgICBhc3NlcnQuZXF1YWwgZG9jLmIsIDExXG4gICAgICAgICAgZG9uZSgpXG5cbiAgICBpdCBcImZpbmQgZ2l2ZXMgcmVzdWx0cyB0d2ljZSBpZiByZW1vdGUgZ2l2ZXMgZGlmZmVyZW50IGFuc3dlclwiLCAoZG9uZSkgLT5cbiAgICAgIEBsYy5zZWVkKF9pZDpcIjFcIiwgYToxKVxuICAgICAgQGxjLnNlZWQoX2lkOlwiMlwiLCBhOjIpXG5cbiAgICAgIEByYy5zZWVkKF9pZDpcIjFcIiwgYTozKVxuICAgICAgQHJjLnNlZWQoX2lkOlwiMlwiLCBhOjQpXG5cbiAgICAgIGNhbGxzID0gMFxuICAgICAgQGhjLmZpbmQoe30pLmZldGNoIChkYXRhKSAtPlxuICAgICAgICBhc3NlcnQuZXF1YWwgZGF0YS5sZW5ndGgsIDJcbiAgICAgICAgY2FsbHMgPSBjYWxscyArIDFcbiAgICAgICAgaWYgY2FsbHMgPj0yXG4gICAgICAgICAgZG9uZSgpXG4gICAgICAsIGZhaWxcblxuICAgIGl0IFwiZmluZCBnaXZlcyByZXN1bHRzIG9uY2UgaWYgcmVtb3RlIGdpdmVzIHNhbWUgYW5zd2VyIHdpdGggc29ydCBkaWZmZXJlbmNlc1wiLCAoZG9uZSkgLT5cbiAgICAgIEBsYy5zZWVkKF9pZDpcIjFcIiwgYToxKVxuICAgICAgQGxjLnNlZWQoX2lkOlwiMlwiLCBhOjIpXG5cbiAgICAgIEByYy5maW5kID0gKCkgPT5cbiAgICAgICAgcmV0dXJuIGZldGNoOiAoc3VjY2VzcykgPT5cbiAgICAgICAgICBzdWNjZXNzKFt7X2lkOlwiMlwiLCBhOjJ9LCB7X2lkOlwiMVwiLCBhOjF9XSlcblxuICAgICAgQGhjLmZpbmQoe30pLmZldGNoIChkYXRhKSAtPlxuICAgICAgICBhc3NlcnQuZXF1YWwgZGF0YS5sZW5ndGgsIDJcbiAgICAgICAgZG9uZSgpXG4gICAgICAsIGZhaWxcblxuICAgIGl0IFwiZmluZE9uZSBnaXZlcyByZXN1bHRzIHR3aWNlIGlmIHJlbW90ZSBnaXZlcyBkaWZmZXJlbnQgYW5zd2VyXCIsIChkb25lKSAtPlxuICAgICAgQGxjLnNlZWQoX2lkOlwiMVwiLCBhOjEpXG4gICAgICBAbGMuc2VlZChfaWQ6XCIyXCIsIGE6MilcblxuICAgICAgQHJjLnNlZWQoX2lkOlwiMVwiLCBhOjMpXG4gICAgICBAcmMuc2VlZChfaWQ6XCIyXCIsIGE6NClcblxuICAgICAgY2FsbHMgPSAwXG4gICAgICBAaGMuZmluZE9uZSB7IF9pZDogXCIxXCJ9LCAoZGF0YSkgLT5cbiAgICAgICAgY2FsbHMgPSBjYWxscyArIDFcbiAgICAgICAgaWYgY2FsbHMgPT0gMVxuICAgICAgICAgIGFzc2VydC5kZWVwRXF1YWwgZGF0YSwgeyBfaWQgOiBcIjFcIiwgYToxIH1cbiAgICAgICAgaWYgY2FsbHMgPj0gMlxuICAgICAgICAgIGFzc2VydC5kZWVwRXF1YWwgZGF0YSwgeyBfaWQgOiBcIjFcIiwgYTozIH1cbiAgICAgICAgICBkb25lKClcbiAgICAgICwgZmFpbFxuXG4gICAgaXQgXCJmaW5kT25lIGdpdmVzIHJlc3VsdHMgbnVsbCBvbmNlIGlmIHJlbW90ZSBmYWlsc1wiLCAoZG9uZSkgLT5cbiAgICAgIGNhbGxlZCA9IDBcbiAgICAgIEByYy5maW5kT25lID0gKHNlbGVjdG9yLCBvcHRpb25zID0ge30sIHN1Y2Nlc3MsIGVycm9yKSAtPlxuICAgICAgICBjYWxsZWQgPSBjYWxsZWQgKyAxXG4gICAgICAgIGVycm9yKG5ldyBFcnJvcihcImZhaWxcIikpXG4gICAgICBAaGMuZmluZE9uZSB7IF9pZDogXCJ4eXpcIn0sIChkYXRhKSAtPlxuICAgICAgICBhc3NlcnQuZXF1YWwgZGF0YSwgbnVsbFxuICAgICAgICBhc3NlcnQuZXF1YWwgY2FsbGVkLCAxXG4gICAgICAgIGRvbmUoKVxuICAgICAgLCBmYWlsXG5cbiAgICBpdCBcImNhY2hlcyByZW1vdGUgZGF0YVwiLCAoZG9uZSkgLT5cbiAgICAgIEBsYy5zZWVkKF9pZDpcIjFcIiwgYToxKVxuICAgICAgQGxjLnNlZWQoX2lkOlwiMlwiLCBhOjIpXG5cbiAgICAgIEByYy5zZWVkKF9pZDpcIjFcIiwgYTozKVxuICAgICAgQHJjLnNlZWQoX2lkOlwiMlwiLCBhOjIpXG5cbiAgICAgIGNhbGxzID0gMFxuICAgICAgQGhjLmZpbmQoe30pLmZldGNoIChkYXRhKSA9PlxuICAgICAgICBhc3NlcnQuZXF1YWwgZGF0YS5sZW5ndGgsIDJcbiAgICAgICAgY2FsbHMgPSBjYWxscyArIDFcblxuICAgICAgICAjIEFmdGVyIHNlY29uZCBjYWxsLCBjaGVjayB0aGF0IGxvY2FsIGNvbGxlY3Rpb24gaGFzIGxhdGVzdFxuICAgICAgICBpZiBjYWxscyA9PSAyXG4gICAgICAgICAgQGxjLmZpbmQoe30pLmZldGNoIChkYXRhKSA9PlxuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsIGRhdGEubGVuZ3RoLCAyXG4gICAgICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIF8ucGx1Y2soZGF0YSwgJ2EnKSwgWzMsMl1cbiAgICAgICAgICAgIGRvbmUoKVxuXG4gIGNvbnRleHQgXCJsb2NhbCBtb2RlXCIsIC0+XG4gICAgaXQgXCJmaW5kIG9ubHkgY2FsbHMgbG9jYWxcIiwgKGRvbmUpIC0+XG4gICAgICBAbGMuc2VlZChfaWQ6XCIxXCIsIGE6MSlcbiAgICAgIEBsYy5zZWVkKF9pZDpcIjJcIiwgYToyKVxuXG4gICAgICBAcmMuc2VlZChfaWQ6XCIxXCIsIGE6MylcbiAgICAgIEByYy5zZWVkKF9pZDpcIjJcIiwgYTo0KVxuXG4gICAgICBAaGMuZmluZCh7fSwge21vZGU6XCJsb2NhbFwifSkuZmV0Y2ggKGRhdGEpID0+XG4gICAgICAgIGFzc2VydC5lcXVhbCBkYXRhLmxlbmd0aCwgMlxuICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIF8ucGx1Y2soZGF0YSwgJ2EnKSwgWzEsMl1cbiAgICAgICAgZG9uZSgpXG5cbiAgICBpdCBcImZpbmRPbmUgb25seSBjYWxscyBsb2NhbCBpZiBmb3VuZFwiLCAoZG9uZSkgLT5cbiAgICAgIEBsYy5zZWVkKF9pZDpcIjFcIiwgYToxKVxuICAgICAgQGxjLnNlZWQoX2lkOlwiMlwiLCBhOjIpXG5cbiAgICAgIEByYy5zZWVkKF9pZDpcIjFcIiwgYTozKVxuICAgICAgQHJjLnNlZWQoX2lkOlwiMlwiLCBhOjQpXG5cbiAgICAgIGNhbGxzID0gMFxuICAgICAgQGhjLmZpbmRPbmUgeyBfaWQ6IFwiMVwiIH0sIHsgbW9kZTogXCJsb2NhbFwiIH0sIChkYXRhKSA9PlxuICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIGRhdGEsIHsgX2lkIDogXCIxXCIsIGE6MSB9XG4gICAgICAgIGRvbmUoKVxuICAgICAgLCBmYWlsXG5cbiAgICBpdCBcImZpbmRPbmUgY2FsbHMgcmVtb3RlIGlmIG5vdCBmb3VuZFwiLCAoZG9uZSkgLT5cbiAgICAgIEBsYy5zZWVkKF9pZDpcIjJcIiwgYToyKVxuXG4gICAgICBAcmMuc2VlZChfaWQ6XCIxXCIsIGE6MylcbiAgICAgIEByYy5zZWVkKF9pZDpcIjJcIiwgYTo0KVxuXG4gICAgICBjYWxscyA9IDBcbiAgICAgIEBoYy5maW5kT25lIHsgX2lkOiBcIjFcIn0sIHsgbW9kZTpcImxvY2FsXCIgfSwgKGRhdGEpID0+XG4gICAgICAgIGFzc2VydC5kZWVwRXF1YWwgZGF0YSwgeyBfaWQgOiBcIjFcIiwgYTozIH1cbiAgICAgICAgZG9uZSgpXG4gICAgICAsIGZhaWxcblxuICBjb250ZXh0IFwicmVtb3RlIG1vZGVcIiwgLT5cbiAgICBiZWZvcmVFYWNoIC0+XG4gICAgICBAbGMuc2VlZChfaWQ6XCIxXCIsIGE6MSlcbiAgICAgIEBsYy5zZWVkKF9pZDpcIjJcIiwgYToyKVxuXG4gICAgICBAcmMuc2VlZChfaWQ6XCIxXCIsIGE6MylcbiAgICAgIEByYy5zZWVkKF9pZDpcIjJcIiwgYTo0KVxuXG4gICAgaXQgXCJmaW5kIG9ubHkgY2FsbHMgcmVtb3RlXCIsIChkb25lKSAtPlxuICAgICAgQGhjLmZpbmQoe30sIHsgbW9kZTogXCJyZW1vdGVcIiB9KS5mZXRjaCAoZGF0YSkgPT5cbiAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCBfLnBsdWNrKGRhdGEsICdhJyksIFszLDRdXG4gICAgICAgIGRvbmUoKVxuXG4gICAgaXQgXCJmaW5kIGRvZXMgbm90IGNhY2hlIHJlc3VsdHNcIiwgKGRvbmUpIC0+XG4gICAgICBAaGMuZmluZCh7fSwgeyBtb2RlOiBcInJlbW90ZVwiIH0pLmZldGNoIChkYXRhKSA9PlxuICAgICAgICBAbGMuZmluZCh7fSkuZmV0Y2ggKGRhdGEpID0+XG4gICAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCBfLnBsdWNrKGRhdGEsICdhJyksIFsxLDJdXG4gICAgICAgICAgZG9uZSgpXG5cbiAgICBpdCBcImZpbmQgZmFsbHMgYmFjayB0byBsb2NhbCBpZiByZW1vdGUgZmFpbHNcIiwgKGRvbmUpIC0+XG4gICAgICBAcmMuZmluZCA9IChzZWxlY3Rvciwgb3B0aW9ucykgPT5cbiAgICAgICAgcmV0dXJuIHsgZmV0Y2g6IChzdWNjZXNzLCBlcnJvcikgLT5cbiAgICAgICAgICBlcnJvcigpXG4gICAgICAgIH1cbiAgICAgIEBoYy5maW5kKHt9LCB7IG1vZGU6IFwicmVtb3RlXCIgfSkuZmV0Y2ggKGRhdGEpID0+XG4gICAgICAgIGFzc2VydC5kZWVwRXF1YWwgXy5wbHVjayhkYXRhLCAnYScpLCBbMSwyXVxuICAgICAgICBkb25lKClcblxuICAgIGl0IFwiZmluZCByZXNwZWN0cyBsb2NhbCB1cHNlcnRzXCIsIChkb25lKSAtPlxuICAgICAgQGxjLnVwc2VydCh7IF9pZDpcIjFcIiwgYTo5IH0pXG5cbiAgICAgIEBoYy5maW5kKHt9LCB7IG1vZGU6IFwicmVtb3RlXCIsIHNvcnQ6IFsnX2lkJ10gfSkuZmV0Y2ggKGRhdGEpID0+XG4gICAgICAgIGFzc2VydC5kZWVwRXF1YWwgXy5wbHVjayhkYXRhLCAnYScpLCBbOSw0XVxuICAgICAgICBkb25lKClcblxuICAgIGl0IFwiZmluZCByZXNwZWN0cyBsb2NhbCByZW1vdmVzXCIsIChkb25lKSAtPlxuICAgICAgQGxjLnJlbW92ZShcIjFcIilcblxuICAgICAgQGhjLmZpbmQoe30sIHsgbW9kZTogXCJyZW1vdGVcIiB9KS5mZXRjaCAoZGF0YSkgPT5cbiAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCBfLnBsdWNrKGRhdGEsICdhJyksIFs0XVxuICAgICAgICBkb25lKClcbiAgICBcbiAgaXQgXCJ1cGxvYWQgYXBwbGllcyBwZW5kaW5nIHVwc2VydHMgYW5kIGRlbGV0ZXNcIiwgKGRvbmUpIC0+XG4gICAgQGxjLnVwc2VydChfaWQ6XCIxXCIsIGE6MSlcbiAgICBAbGMudXBzZXJ0KF9pZDpcIjJcIiwgYToyKVxuXG4gICAgQGh5YnJpZC51cGxvYWQoKCkgPT5cbiAgICAgIEBsYy5wZW5kaW5nVXBzZXJ0cyAoZGF0YSkgPT5cbiAgICAgICAgYXNzZXJ0LmVxdWFsIGRhdGEubGVuZ3RoLCAwXG5cbiAgICAgICAgQHJjLnBlbmRpbmdVcHNlcnRzIChkYXRhKSA9PlxuICAgICAgICAgIGFzc2VydC5kZWVwRXF1YWwgXy5wbHVjayhkYXRhLCAnYScpLCBbMSwyXVxuICAgICAgICAgIGRvbmUoKVxuICAgICwgZmFpbClcblxuICBpdCBcImtlZXBzIHVwc2VydHMgYW5kIGRlbGV0ZXMgaWYgZmFpbGVkIHRvIGFwcGx5XCIsIChkb25lKSAtPlxuICAgIEBsYy51cHNlcnQoX2lkOlwiMVwiLCBhOjEpXG4gICAgQGxjLnVwc2VydChfaWQ6XCIyXCIsIGE6MilcblxuICAgIEByYy51cHNlcnQgPSAoZG9jLCBzdWNjZXNzLCBlcnJvcikgPT5cbiAgICAgIGVycm9yKG5ldyBFcnJvcihcImZhaWxcIikpXG5cbiAgICBAaHlicmlkLnVwbG9hZCgoKSA9PlxuICAgICAgYXNzZXJ0LmZhaWwoKVxuICAgICwgKCk9PlxuICAgICAgQGxjLnBlbmRpbmdVcHNlcnRzIChkYXRhKSA9PlxuICAgICAgICBhc3NlcnQuZXF1YWwgZGF0YS5sZW5ndGgsIDJcbiAgICAgICAgZG9uZSgpXG4gICAgKVxuXG4gIGl0IFwidXBzZXJ0cyB0byBsb2NhbCBkYlwiLCAoZG9uZSkgLT5cbiAgICBAaGMudXBzZXJ0KF9pZDpcIjFcIiwgYToxKVxuICAgIEBsYy5wZW5kaW5nVXBzZXJ0cyAoZGF0YSkgPT5cbiAgICAgIGFzc2VydC5lcXVhbCBkYXRhLmxlbmd0aCwgMVxuICAgICAgZG9uZSgpXG5cbiAgaXQgXCJyZW1vdmVzIHRvIGxvY2FsIGRiXCIsIChkb25lKSAtPlxuICAgIEBsYy5zZWVkKF9pZDpcIjFcIiwgYToxKVxuICAgIEBoYy5yZW1vdmUoXCIxXCIpXG4gICAgQGxjLnBlbmRpbmdSZW1vdmVzIChkYXRhKSA9PlxuICAgICAgYXNzZXJ0LmVxdWFsIGRhdGEubGVuZ3RoLCAxXG4gICAgICBkb25lKClcbiIsImFzc2VydCA9IGNoYWkuYXNzZXJ0XG5Mb2NhbERiID0gcmVxdWlyZSBcIi4uL2FwcC9qcy9kYi9Mb2NhbERiXCJcbmRiX3F1ZXJpZXMgPSByZXF1aXJlIFwiLi9kYl9xdWVyaWVzXCJcblxuZGVzY3JpYmUgJ0xvY2FsRGInLCAtPlxuICBiZWZvcmUgLT5cbiAgICBAZGIgPSBuZXcgTG9jYWxEYigpXG5cbiAgYmVmb3JlRWFjaCAoZG9uZSkgLT5cbiAgICBAZGIucmVtb3ZlQ29sbGVjdGlvbignc2NyYXRjaCcpXG4gICAgQGRiLmFkZENvbGxlY3Rpb24oJ3NjcmF0Y2gnKVxuICAgIGRvbmUoKVxuXG4gIGRlc2NyaWJlIFwicGFzc2VzIHF1ZXJpZXNcIiwgLT5cbiAgICBkYl9xdWVyaWVzLmNhbGwodGhpcylcblxuICBpdCAnY2FjaGVzIHJvd3MnLCAoZG9uZSkgLT5cbiAgICBAZGIuc2NyYXRjaC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdhcHBsZScgfV0sIHt9LCB7fSwgPT5cbiAgICAgIEBkYi5zY3JhdGNoLmZpbmQoe30pLmZldGNoIChyZXN1bHRzKSAtPlxuICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0c1swXS5hLCAnYXBwbGUnXG4gICAgICAgIGRvbmUoKVxuXG4gIGl0ICdjYWNoZSBvdmVyd3JpdGUgZXhpc3RpbmcnLCAoZG9uZSkgLT5cbiAgICBAZGIuc2NyYXRjaC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdhcHBsZScgfV0sIHt9LCB7fSwgPT5cbiAgICAgIEBkYi5zY3JhdGNoLmNhY2hlIFt7IF9pZDogMSwgYTogJ2JhbmFuYScgfV0sIHt9LCB7fSwgPT5cbiAgICAgICAgQGRiLnNjcmF0Y2guZmluZCh7fSkuZmV0Y2ggKHJlc3VsdHMpIC0+XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHNbMF0uYSwgJ2JhbmFuYSdcbiAgICAgICAgICBkb25lKClcblxuICBpdCBcImNhY2hlIGRvZXNuJ3Qgb3ZlcndyaXRlIHVwc2VydFwiLCAoZG9uZSkgLT5cbiAgICBAZGIuc2NyYXRjaC51cHNlcnQgeyBfaWQ6IDEsIGE6ICdhcHBsZScgfSwgPT5cbiAgICAgIEBkYi5zY3JhdGNoLmNhY2hlIFt7IF9pZDogMSwgYTogJ2JhbmFuYScgfV0sIHt9LCB7fSwgPT5cbiAgICAgICAgQGRiLnNjcmF0Y2guZmluZCh7fSkuZmV0Y2ggKHJlc3VsdHMpIC0+XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHNbMF0uYSwgJ2FwcGxlJ1xuICAgICAgICAgIGRvbmUoKVxuXG4gIGl0IFwiY2FjaGUgZG9lc24ndCBvdmVyd3JpdGUgcmVtb3ZlXCIsIChkb25lKSAtPlxuICAgIEBkYi5zY3JhdGNoLmNhY2hlIFt7IF9pZDogMSwgYTogJ2RlbGV0ZScgfV0sIHt9LCB7fSwgPT5cbiAgICAgIEBkYi5zY3JhdGNoLnJlbW92ZSAxLCA9PlxuICAgICAgQGRiLnNjcmF0Y2guY2FjaGUgW3sgX2lkOiAxLCBhOiAnYmFuYW5hJyB9XSwge30sIHt9LCA9PlxuICAgICAgICBAZGIuc2NyYXRjaC5maW5kKHt9KS5mZXRjaCAocmVzdWx0cykgLT5cbiAgICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0cy5sZW5ndGgsIDBcbiAgICAgICAgICBkb25lKClcblxuICBpdCBcImNhY2hlIHJlbW92ZXMgbWlzc2luZyB1bnNvcnRlZFwiLCAoZG9uZSkgLT5cbiAgICBAZGIuc2NyYXRjaC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdhJyB9LCB7IF9pZDogMiwgYTogJ2InIH0sIHsgX2lkOiAzLCBhOiAnYycgfV0sIHt9LCB7fSwgPT5cbiAgICAgIEBkYi5zY3JhdGNoLmNhY2hlIFt7IF9pZDogMSwgYTogJ2EnIH0sIHsgX2lkOiAzLCBhOiAnYycgfV0sIHt9LCB7fSwgPT5cbiAgICAgICAgQGRiLnNjcmF0Y2guZmluZCh7fSkuZmV0Y2ggKHJlc3VsdHMpIC0+XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHMubGVuZ3RoLCAyXG4gICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJjYWNoZSByZW1vdmVzIG1pc3NpbmcgZmlsdGVyZWRcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnNjcmF0Y2guY2FjaGUgW3sgX2lkOiAxLCBhOiAnYScgfSwgeyBfaWQ6IDIsIGE6ICdiJyB9LCB7IF9pZDogMywgYTogJ2MnIH1dLCB7fSwge30sID0+XG4gICAgICBAZGIuc2NyYXRjaC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdhJyB9XSwge19pZDogeyRsdDozfX0sIHt9LCA9PlxuICAgICAgICBAZGIuc2NyYXRjaC5maW5kKHt9LCB7c29ydDpbJ19pZCddfSkuZmV0Y2ggKHJlc3VsdHMpIC0+XG4gICAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCBfLnBsdWNrKHJlc3VsdHMsICdfaWQnKSwgWzEsM11cbiAgICAgICAgICBkb25lKClcblxuICBpdCBcImNhY2hlIHJlbW92ZXMgbWlzc2luZyBzb3J0ZWQgbGltaXRlZFwiLCAoZG9uZSkgLT5cbiAgICBAZGIuc2NyYXRjaC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdhJyB9LCB7IF9pZDogMiwgYTogJ2InIH0sIHsgX2lkOiAzLCBhOiAnYycgfV0sIHt9LCB7fSwgPT5cbiAgICAgIEBkYi5zY3JhdGNoLmNhY2hlIFt7IF9pZDogMSwgYTogJ2EnIH1dLCB7fSwge3NvcnQ6WydfaWQnXSwgbGltaXQ6Mn0sID0+XG4gICAgICAgIEBkYi5zY3JhdGNoLmZpbmQoe30sIHtzb3J0OlsnX2lkJ119KS5mZXRjaCAocmVzdWx0cykgLT5cbiAgICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIF8ucGx1Y2socmVzdWx0cywgJ19pZCcpLCBbMSwzXVxuICAgICAgICAgIGRvbmUoKVxuXG4gIGl0IFwiY2FjaGUgZG9lcyBub3QgcmVtb3ZlIG1pc3Npbmcgc29ydGVkIGxpbWl0ZWQgcGFzdCBlbmRcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnNjcmF0Y2guY2FjaGUgW3sgX2lkOiAxLCBhOiAnYScgfSwgeyBfaWQ6IDIsIGE6ICdiJyB9LCB7IF9pZDogMywgYTogJ2MnIH0sIHsgX2lkOiA0LCBhOiAnZCcgfV0sIHt9LCB7fSwgPT5cbiAgICAgIEBkYi5zY3JhdGNoLnJlbW92ZSAyLCA9PlxuICAgICAgICBAZGIuc2NyYXRjaC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdhJyB9LCB7IF9pZDogMiwgYTogJ2InIH1dLCB7fSwge3NvcnQ6WydfaWQnXSwgbGltaXQ6Mn0sID0+XG4gICAgICAgICAgQGRiLnNjcmF0Y2guZmluZCh7fSwge3NvcnQ6WydfaWQnXX0pLmZldGNoIChyZXN1bHRzKSAtPlxuICAgICAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCBfLnBsdWNrKHJlc3VsdHMsICdfaWQnKSwgWzEsMyw0XVxuICAgICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJyZXR1cm5zIHBlbmRpbmcgdXBzZXJ0c1wiLCAoZG9uZSkgLT5cbiAgICBAZGIuc2NyYXRjaC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdhcHBsZScgfV0sIHt9LCB7fSwgPT5cbiAgICAgIEBkYi5zY3JhdGNoLnVwc2VydCB7IF9pZDogMiwgYTogJ2JhbmFuYScgfSwgPT5cbiAgICAgICAgQGRiLnNjcmF0Y2gucGVuZGluZ1Vwc2VydHMgKHJlc3VsdHMpID0+XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHMubGVuZ3RoLCAxXG4gICAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHNbMF0uYSwgJ2JhbmFuYSdcbiAgICAgICAgICBkb25lKClcblxuICBpdCBcInJlc29sdmVzIHBlbmRpbmcgdXBzZXJ0c1wiLCAoZG9uZSkgLT5cbiAgICBAZGIuc2NyYXRjaC51cHNlcnQgeyBfaWQ6IDIsIGE6ICdiYW5hbmEnIH0sID0+XG4gICAgICBAZGIuc2NyYXRjaC5yZXNvbHZlVXBzZXJ0IHsgX2lkOiAyLCBhOiAnYmFuYW5hJyB9LCA9PlxuICAgICAgICBAZGIuc2NyYXRjaC5wZW5kaW5nVXBzZXJ0cyAocmVzdWx0cykgPT5cbiAgICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0cy5sZW5ndGgsIDBcbiAgICAgICAgICBkb25lKClcblxuICBpdCBcInJldGFpbnMgY2hhbmdlZCBwZW5kaW5nIHVwc2VydHNcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnNjcmF0Y2gudXBzZXJ0IHsgX2lkOiAyLCBhOiAnYmFuYW5hJyB9LCA9PlxuICAgICAgQGRiLnNjcmF0Y2gudXBzZXJ0IHsgX2lkOiAyLCBhOiAnYmFuYW5hMicgfSwgPT5cbiAgICAgICAgQGRiLnNjcmF0Y2gucmVzb2x2ZVVwc2VydCB7IF9pZDogMiwgYTogJ2JhbmFuYScgfSwgPT5cbiAgICAgICAgICBAZGIuc2NyYXRjaC5wZW5kaW5nVXBzZXJ0cyAocmVzdWx0cykgPT5cbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzLmxlbmd0aCwgMVxuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHNbMF0uYSwgJ2JhbmFuYTInXG4gICAgICAgICAgICBkb25lKClcblxuICBpdCBcInJlbW92ZXMgcGVuZGluZyB1cHNlcnRzXCIsIChkb25lKSAtPlxuICAgIEBkYi5zY3JhdGNoLnVwc2VydCB7IF9pZDogMiwgYTogJ2JhbmFuYScgfSwgPT5cbiAgICAgIEBkYi5zY3JhdGNoLnJlbW92ZSAyLCA9PlxuICAgICAgICBAZGIuc2NyYXRjaC5wZW5kaW5nVXBzZXJ0cyAocmVzdWx0cykgPT5cbiAgICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0cy5sZW5ndGgsIDBcbiAgICAgICAgICBkb25lKClcblxuICBpdCBcInJldHVybnMgcGVuZGluZyByZW1vdmVzXCIsIChkb25lKSAtPlxuICAgIEBkYi5zY3JhdGNoLmNhY2hlIFt7IF9pZDogMSwgYTogJ2FwcGxlJyB9XSwge30sIHt9LCA9PlxuICAgICAgQGRiLnNjcmF0Y2gucmVtb3ZlIDEsID0+XG4gICAgICAgIEBkYi5zY3JhdGNoLnBlbmRpbmdSZW1vdmVzIChyZXN1bHRzKSA9PlxuICAgICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzLmxlbmd0aCwgMVxuICAgICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzWzBdLCAxXG4gICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJyZXNvbHZlcyBwZW5kaW5nIHJlbW92ZXNcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnNjcmF0Y2guY2FjaGUgW3sgX2lkOiAxLCBhOiAnYXBwbGUnIH1dLCB7fSwge30sID0+XG4gICAgICBAZGIuc2NyYXRjaC5yZW1vdmUgMSwgPT5cbiAgICAgICAgQGRiLnNjcmF0Y2gucmVzb2x2ZVJlbW92ZSAxLCA9PlxuICAgICAgICAgIEBkYi5zY3JhdGNoLnBlbmRpbmdSZW1vdmVzIChyZXN1bHRzKSA9PlxuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHMubGVuZ3RoLCAwXG4gICAgICAgICAgICBkb25lKClcblxuICBpdCBcInNlZWRzXCIsIChkb25lKSAtPlxuICAgIEBkYi5zY3JhdGNoLnNlZWQgeyBfaWQ6IDEsIGE6ICdhcHBsZScgfSwgPT5cbiAgICAgIEBkYi5zY3JhdGNoLmZpbmQoe30pLmZldGNoIChyZXN1bHRzKSAtPlxuICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0c1swXS5hLCAnYXBwbGUnXG4gICAgICAgIGRvbmUoKVxuXG4gIGl0IFwiZG9lcyBub3Qgb3ZlcndyaXRlIGV4aXN0aW5nXCIsIChkb25lKSAtPlxuICAgIEBkYi5zY3JhdGNoLmNhY2hlIFt7IF9pZDogMSwgYTogJ2JhbmFuYScgfV0sIHt9LCB7fSwgPT5cbiAgICAgIEBkYi5zY3JhdGNoLnNlZWQgeyBfaWQ6IDEsIGE6ICdhcHBsZScgfSwgPT5cbiAgICAgICAgQGRiLnNjcmF0Y2guZmluZCh7fSkuZmV0Y2ggKHJlc3VsdHMpIC0+XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHNbMF0uYSwgJ2JhbmFuYSdcbiAgICAgICAgICBkb25lKClcblxuICBpdCBcImRvZXMgbm90IGFkZCByZW1vdmVkXCIsIChkb25lKSAtPlxuICAgIEBkYi5zY3JhdGNoLmNhY2hlIFt7IF9pZDogMSwgYTogJ2FwcGxlJyB9XSwge30sIHt9LCA9PlxuICAgICAgQGRiLnNjcmF0Y2gucmVtb3ZlIDEsID0+XG4gICAgICAgIEBkYi5zY3JhdGNoLnNlZWQgeyBfaWQ6IDEsIGE6ICdhcHBsZScgfSwgPT5cbiAgICAgICAgICBAZGIuc2NyYXRjaC5maW5kKHt9KS5mZXRjaCAocmVzdWx0cykgLT5cbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzLmxlbmd0aCwgMFxuICAgICAgICAgICAgZG9uZSgpXG5cbmRlc2NyaWJlICdMb2NhbERiIHdpdGggbG9jYWwgc3RvcmFnZScsIC0+XG4gIGJlZm9yZSAtPlxuICAgIEBkYiA9IG5ldyBMb2NhbERiKHsgbmFtZXNwYWNlOiBcImRiLnNjcmF0Y2hcIiB9KVxuXG4gIGJlZm9yZUVhY2ggKGRvbmUpIC0+XG4gICAgQGRiLnJlbW92ZUNvbGxlY3Rpb24oJ3NjcmF0Y2gnKVxuICAgIEBkYi5hZGRDb2xsZWN0aW9uKCdzY3JhdGNoJylcbiAgICBkb25lKClcblxuICBpdCBcInJldGFpbnMgaXRlbXNcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnNjcmF0Y2gudXBzZXJ0IHsgX2lkOjEsIGE6XCJBbGljZVwiIH0sID0+XG4gICAgICBkYjIgPSBuZXcgTG9jYWxEYih7IG5hbWVzcGFjZTogXCJkYi5zY3JhdGNoXCIgfSlcbiAgICAgIGRiMi5hZGRDb2xsZWN0aW9uICdzY3JhdGNoJ1xuICAgICAgZGIyLnNjcmF0Y2guZmluZCh7fSkuZmV0Y2ggKHJlc3VsdHMpIC0+XG4gICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzWzBdLmEsIFwiQWxpY2VcIlxuICAgICAgICBkb25lKClcblxuICBpdCBcInJldGFpbnMgdXBzZXJ0c1wiLCAoZG9uZSkgLT5cbiAgICBAZGIuc2NyYXRjaC51cHNlcnQgeyBfaWQ6MSwgYTpcIkFsaWNlXCIgfSwgPT5cbiAgICAgIGRiMiA9IG5ldyBMb2NhbERiKHsgbmFtZXNwYWNlOiBcImRiLnNjcmF0Y2hcIiB9KVxuICAgICAgZGIyLmFkZENvbGxlY3Rpb24gJ3NjcmF0Y2gnXG4gICAgICBkYjIuc2NyYXRjaC5maW5kKHt9KS5mZXRjaCAocmVzdWx0cykgLT5cbiAgICAgICAgZGIyLnNjcmF0Y2gucGVuZGluZ1Vwc2VydHMgKHVwc2VydHMpIC0+XG4gICAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCByZXN1bHRzLCB1cHNlcnRzXG4gICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJyZXRhaW5zIHJlbW92ZXNcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnNjcmF0Y2guc2VlZCB7IF9pZDoxLCBhOlwiQWxpY2VcIiB9LCA9PlxuICAgICAgQGRiLnNjcmF0Y2gucmVtb3ZlIDEsID0+XG4gICAgICAgIGRiMiA9IG5ldyBMb2NhbERiKHsgbmFtZXNwYWNlOiBcImRiLnNjcmF0Y2hcIiB9KVxuICAgICAgICBkYjIuYWRkQ29sbGVjdGlvbiAnc2NyYXRjaCdcbiAgICAgICAgZGIyLnNjcmF0Y2gucGVuZGluZ1JlbW92ZXMgKHJlbW92ZXMpIC0+XG4gICAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCByZW1vdmVzLCBbMV1cbiAgICAgICAgICBkb25lKClcblxuZGVzY3JpYmUgJ0xvY2FsRGIgd2l0aG91dCBsb2NhbCBzdG9yYWdlJywgLT5cbiAgYmVmb3JlIC0+XG4gICAgQGRiID0gbmV3IExvY2FsRGIoKVxuXG4gIGJlZm9yZUVhY2ggKGRvbmUpIC0+XG4gICAgQGRiLnJlbW92ZUNvbGxlY3Rpb24oJ3NjcmF0Y2gnKVxuICAgIEBkYi5hZGRDb2xsZWN0aW9uKCdzY3JhdGNoJylcbiAgICBkb25lKClcblxuICBpdCBcImRvZXMgbm90IHJldGFpbiBpdGVtc1wiLCAoZG9uZSkgLT5cbiAgICBAZGIuc2NyYXRjaC51cHNlcnQgeyBfaWQ6MSwgYTpcIkFsaWNlXCIgfSwgPT5cbiAgICAgIGRiMiA9IG5ldyBMb2NhbERiKClcbiAgICAgIGRiMi5hZGRDb2xsZWN0aW9uICdzY3JhdGNoJ1xuICAgICAgZGIyLnNjcmF0Y2guZmluZCh7fSkuZmV0Y2ggKHJlc3VsdHMpIC0+XG4gICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzLmxlbmd0aCwgMFxuICAgICAgICBkb25lKClcblxuICBpdCBcImRvZXMgbm90IHJldGFpbiB1cHNlcnRzXCIsIChkb25lKSAtPlxuICAgIEBkYi5zY3JhdGNoLnVwc2VydCB7IF9pZDoxLCBhOlwiQWxpY2VcIiB9LCA9PlxuICAgICAgZGIyID0gbmV3IExvY2FsRGIoKVxuICAgICAgZGIyLmFkZENvbGxlY3Rpb24gJ3NjcmF0Y2gnXG4gICAgICBkYjIuc2NyYXRjaC5maW5kKHt9KS5mZXRjaCAocmVzdWx0cykgLT5cbiAgICAgICAgZGIyLnNjcmF0Y2gucGVuZGluZ1Vwc2VydHMgKHVwc2VydHMpIC0+XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHMubGVuZ3RoLCAwXG4gICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJkb2VzIG5vdCByZXRhaW4gcmVtb3Zlc1wiLCAoZG9uZSkgLT5cbiAgICBAZGIuc2NyYXRjaC5zZWVkIHsgX2lkOjEsIGE6XCJBbGljZVwiIH0sID0+XG4gICAgICBAZGIuc2NyYXRjaC5yZW1vdmUgMSwgPT5cbiAgICAgICAgZGIyID0gbmV3IExvY2FsRGIoKVxuICAgICAgICBkYjIuYWRkQ29sbGVjdGlvbiAnc2NyYXRjaCdcbiAgICAgICAgZGIyLnNjcmF0Y2gucGVuZGluZ1JlbW92ZXMgKHJlbW92ZXMpIC0+XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsIHJlbW92ZXMubGVuZ3RoLCAwXG4gICAgICAgICAgZG9uZSgpXG5cbiIsImFzc2VydCA9IGNoYWkuYXNzZXJ0XG5Mb2NhdGlvblZpZXcgPSByZXF1aXJlICcuLi9hcHAvanMvTG9jYXRpb25WaWV3J1xuVUlEcml2ZXIgPSByZXF1aXJlICcuL2hlbHBlcnMvVUlEcml2ZXInXG5cbmNsYXNzIE1vY2tMb2NhdGlvbkZpbmRlclxuICBjb25zdHJ1Y3RvcjogIC0+XG4gICAgXy5leHRlbmQgQCwgQmFja2JvbmUuRXZlbnRzXG5cbiAgZ2V0TG9jYXRpb246IC0+XG4gIHN0YXJ0V2F0Y2g6IC0+XG4gIHN0b3BXYXRjaDogLT5cblxuZGVzY3JpYmUgJ0xvY2F0aW9uVmlldycsIC0+XG4gIGNvbnRleHQgJ1dpdGggbm8gc2V0IGxvY2F0aW9uJywgLT5cbiAgICBiZWZvcmVFYWNoIC0+XG4gICAgICBAbG9jYXRpb25GaW5kZXIgPSBuZXcgTW9ja0xvY2F0aW9uRmluZGVyKClcbiAgICAgIEBsb2NhdGlvblZpZXcgPSBuZXcgTG9jYXRpb25WaWV3KGxvYzpudWxsLCBsb2NhdGlvbkZpbmRlcjogQGxvY2F0aW9uRmluZGVyKVxuICAgICAgQHVpID0gbmV3IFVJRHJpdmVyKEBsb2NhdGlvblZpZXcuZWwpXG5cbiAgICBpdCAnZGlzcGxheXMgVW5zcGVjaWZpZWQnLCAtPlxuICAgICAgYXNzZXJ0LmluY2x1ZGUoQHVpLnRleHQoKSwgJ1Vuc3BlY2lmaWVkJylcblxuICAgIGl0ICdkaXNhYmxlcyBtYXAnLCAtPlxuICAgICAgYXNzZXJ0LmlzVHJ1ZSBAdWkuZ2V0RGlzYWJsZWQoXCJNYXBcIikgXG5cbiAgICBpdCAnYWxsb3dzIHNldHRpbmcgbG9jYXRpb24nLCAtPlxuICAgICAgQHVpLmNsaWNrKCdTZXQnKVxuICAgICAgc2V0UG9zID0gbnVsbFxuICAgICAgQGxvY2F0aW9uVmlldy5vbiAnbG9jYXRpb25zZXQnLCAocG9zKSAtPlxuICAgICAgICBzZXRQb3MgPSBwb3NcblxuICAgICAgQGxvY2F0aW9uRmluZGVyLnRyaWdnZXIgJ2ZvdW5kJywgeyBjb29yZHM6IHsgbGF0aXR1ZGU6IDIsIGxvbmdpdHVkZTogMywgYWNjdXJhY3k6IDEwfX1cbiAgICAgIGFzc2VydC5lcXVhbCBzZXRQb3MuY29vcmRpbmF0ZXNbMV0sIDJcblxuICAgIGl0ICdEaXNwbGF5cyBlcnJvcicsIC0+XG4gICAgICBAdWkuY2xpY2soJ1NldCcpXG4gICAgICBzZXRQb3MgPSBudWxsXG4gICAgICBAbG9jYXRpb25WaWV3Lm9uICdsb2NhdGlvbnNldCcsIChwb3MpIC0+XG4gICAgICAgIHNldFBvcyA9IHBvc1xuXG4gICAgICBAbG9jYXRpb25GaW5kZXIudHJpZ2dlciAnZXJyb3InXG4gICAgICBhc3NlcnQuZXF1YWwgc2V0UG9zLCBudWxsXG4gICAgICBhc3NlcnQuaW5jbHVkZShAdWkudGV4dCgpLCAnQ2Fubm90JylcblxuICBjb250ZXh0ICdXaXRoIHNldCBsb2NhdGlvbicsIC0+XG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgQGxvY2F0aW9uRmluZGVyID0gbmV3IE1vY2tMb2NhdGlvbkZpbmRlcigpXG4gICAgICBAbG9jYXRpb25WaWV3ID0gbmV3IExvY2F0aW9uVmlldyhsb2M6IHsgdHlwZTogXCJQb2ludFwiLCBjb29yZGluYXRlczogWzEwLCAyMF19LCBsb2NhdGlvbkZpbmRlcjogQGxvY2F0aW9uRmluZGVyKVxuICAgICAgQHVpID0gbmV3IFVJRHJpdmVyKEBsb2NhdGlvblZpZXcuZWwpXG5cbiAgICBpdCAnZGlzcGxheXMgV2FpdGluZycsIC0+XG4gICAgICBhc3NlcnQuaW5jbHVkZShAdWkudGV4dCgpLCAnV2FpdGluZycpXG5cbiAgICBpdCAnZGlzcGxheXMgcmVsYXRpdmUnLCAtPlxuICAgICAgQGxvY2F0aW9uRmluZGVyLnRyaWdnZXIgJ2ZvdW5kJywgeyBjb29yZHM6IHsgbGF0aXR1ZGU6IDIxLCBsb25naXR1ZGU6IDEwLCBhY2N1cmFjeTogMTB9fVxuICAgICAgYXNzZXJ0LmluY2x1ZGUoQHVpLnRleHQoKSwgJzExMS4ya20gUycpXG5cbiIsImFzc2VydCA9IGNoYWkuYXNzZXJ0XG5SZW1vdGVEYiA9IHJlcXVpcmUgXCIuLi9hcHAvanMvZGIvUmVtb3RlRGJcIlxuZGJfcXVlcmllcyA9IHJlcXVpcmUgXCIuL2RiX3F1ZXJpZXNcIlxuXG4jIFRvIHdvcmssIHRoaXMgbXVzdCBoYXZlIHRoZSBmb2xsb3dpbmcgc2VydmVyIHJ1bm5pbmc6XG4jIE5PREVfRU5WPXRlc3Qgbm9kZSBzZXJ2ZXIuanNcbmlmIGZhbHNlXG4gIGRlc2NyaWJlICdSZW1vdGVEYicsIC0+XG4gICAgYmVmb3JlRWFjaCAoZG9uZSkgLT5cbiAgICAgIHVybCA9ICdodHRwOi8vbG9jYWxob3N0OjgwODAvdjMvJ1xuICAgICAgcmVxID0gJC5wb3N0KHVybCArIFwiX3Jlc2V0XCIsIHt9KVxuICAgICAgcmVxLmZhaWwgKGpxWEhSLCB0ZXh0U3RhdHVzLCBlcnJvclRocm93bikgPT5cbiAgICAgICAgdGhyb3cgdGV4dFN0YXR1c1xuICAgICAgcmVxLmRvbmUgPT5cbiAgICAgICAgcmVxID0gJC5hamF4KHVybCArIFwidXNlcnMvdGVzdFwiLCB7XG4gICAgICAgICAgZGF0YSA6IEpTT04uc3RyaW5naWZ5KHsgZW1haWw6IFwidGVzdEB0ZXN0LmNvbVwiLCBwYXNzd29yZDpcInh5enp5XCIgfSksXG4gICAgICAgICAgY29udGVudFR5cGUgOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICAgdHlwZSA6ICdQVVQnfSlcbiAgICAgICAgcmVxLmRvbmUgKGRhdGEpID0+XG4gICAgICAgICAgcmVxID0gJC5hamF4KHVybCArIFwidXNlcnMvdGVzdFwiLCB7XG4gICAgICAgICAgZGF0YSA6IEpTT04uc3RyaW5naWZ5KHsgcGFzc3dvcmQ6XCJ4eXp6eVwiIH0pLFxuICAgICAgICAgIGNvbnRlbnRUeXBlIDogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICAgIHR5cGUgOiAnUE9TVCd9KVxuICAgICAgICAgIHJlcS5kb25lIChkYXRhKSA9PlxuICAgICAgICAgICAgQGNsaWVudCA9IGRhdGEuY2xpZW50XG5cbiAgICAgICAgICAgIEBkYiA9IG5ldyBSZW1vdGVEYih1cmwsIEBjbGllbnQpXG4gICAgICAgICAgICBAZGIuYWRkQ29sbGVjdGlvbignc2NyYXRjaCcpXG5cbiAgICAgICAgICAgIGRvbmUoKVxuXG4gICAgZGVzY3JpYmUgXCJwYXNzZXMgcXVlcmllc1wiLCAtPlxuICAgICAgZGJfcXVlcmllcy5jYWxsKHRoaXMpXG4iLCJhc3NlcnQgPSBjaGFpLmFzc2VydFxuYXV0aCA9IHJlcXVpcmUgXCIuLi9hcHAvanMvYXV0aFwiXG5cblxuZGVzY3JpYmUgXCJVc2VyQXV0aFwiLCAtPlxuICBjb250ZXh0IFwidXNlciBvbmx5XCIsIC0+XG4gICAgYmVmb3JlIC0+XG4gICAgICBAYXV0aCA9IG5ldyBhdXRoLlVzZXJBdXRoKFwic29tZXVzZXJcIilcblxuICAgIGl0IFwiZG9lcyBub3QgYWxsb3cgc291cmNlX3R5cGVzIGluc2VydFwiLCAtPlxuICAgICAgYXNzZXJ0LmlzRmFsc2UgQGF1dGguaW5zZXJ0KFwic291cmNlX3R5cGVzXCIpXG5cbiAgICBpdCBcImRvZXMgYWxsb3cgc291cmNlcyBpbnNlcnRcIiwgLT5cbiAgICAgIGFzc2VydC5pc1RydWUgQGF1dGguaW5zZXJ0KFwic291cmNlc1wiKVxuXG4gICAgaXQgXCJkb2VzIGFsbG93IHNvdXJjZXMgdXBkYXRlIGZvciB1c2VyXCIsIC0+XG4gICAgICBhc3NlcnQuaXNUcnVlIEBhdXRoLnVwZGF0ZShcInNvdXJjZXNcIiwgeyB1c2VyOiBcInNvbWV1c2VyXCJ9KVxuXG4gICAgaXQgXCJkb2VzIGFsbG93IHNvdXJjZXMgdXBkYXRlcyBpbiBnZW5lcmFsXCIsIC0+XG4gICAgICBhc3NlcnQuaXNUcnVlIEBhdXRoLnVwZGF0ZShcInNvdXJjZXNcIilcblxuICAgIGl0IFwiZG9lcyBub3QgYWxsb3cgc291cmNlcyB1cGRhdGUgZm9yIG90aGVyIHVzZXJcIiwgLT5cbiAgICAgIGFzc2VydC5pc0ZhbHNlIEBhdXRoLnVwZGF0ZShcInNvdXJjZXNcIiwgeyB1c2VyOiBcInh5enp5XCJ9KVxuXG4gIGNvbnRleHQgXCJ1c2VyIGFuZCBvcmdcIiwgLT5cbiAgICBiZWZvcmUgLT5cbiAgICAgIEBhdXRoID0gbmV3IGF1dGguVXNlckF1dGgoXCJzb21ldXNlclwiLCBcInNvbWVvcmdcIilcblxuICAgIGl0IFwiZG9lcyBub3QgYWxsb3cgc291cmNlX3R5cGVzIGluc2VydFwiLCAtPlxuICAgICAgYXNzZXJ0LmlzRmFsc2UgQGF1dGguaW5zZXJ0KFwic291cmNlX3R5cGVzXCIpXG5cbiAgICBpdCBcImRvZXMgYWxsb3cgc291cmNlcyBpbnNlcnRcIiwgLT5cbiAgICAgIGFzc2VydC5pc1RydWUgQGF1dGguaW5zZXJ0KFwic291cmNlc1wiKVxuXG4gICAgaXQgXCJkb2VzIGFsbG93IHNvdXJjZXMgdXBkYXRlIGZvciB1c2VyXCIsIC0+XG4gICAgICBhc3NlcnQuaXNUcnVlIEBhdXRoLnVwZGF0ZShcInNvdXJjZXNcIiwgeyB1c2VyOiBcInNvbWV1c2VyXCJ9KVxuXG4gICAgaXQgXCJkb2VzIG5vdCBhbGxvdyBzb3VyY2VzIHVwZGF0ZSBmb3Igb3RoZXIgdXNlciB3aXRoIG5vIG9yZ1wiLCAtPlxuICAgICAgYXNzZXJ0LmlzRmFsc2UgQGF1dGgudXBkYXRlKFwic291cmNlc1wiLCB7IHVzZXI6IFwieHl6enlcIn0pXG5cbiAgICBpdCBcImRvZXMgYWxsb3cgc291cmNlcyB1cGRhdGUgZm9yIG90aGVyIHVzZXIgd2l0aCBzYW1lIG9yZ1wiLCAtPlxuICAgICAgYXNzZXJ0LmlzVHJ1ZSBAYXV0aC51cGRhdGUoXCJzb3VyY2VzXCIsIHsgdXNlcjogXCJ4eXp6eVwiLCBvcmc6IFwic29tZW9yZ1wifSlcbiIsImFzc2VydCA9IGNoYWkuYXNzZXJ0XG5cbkdlb0pTT04gPSByZXF1aXJlICcuLi9hcHAvanMvR2VvSlNPTidcblxubW9kdWxlLmV4cG9ydHMgPSAtPlxuICBjb250ZXh0ICdXaXRoIHNhbXBsZSByb3dzJywgLT5cbiAgICBiZWZvcmVFYWNoIChkb25lKSAtPlxuICAgICAgQGRiLnNjcmF0Y2gudXBzZXJ0IHsgX2lkOlwiMVwiLCBhOlwiQWxpY2VcIiwgYjoxIH0sID0+XG4gICAgICAgIEBkYi5zY3JhdGNoLnVwc2VydCB7IF9pZDpcIjJcIiwgYTpcIkNoYXJsaWVcIiwgYjoyIH0sID0+XG4gICAgICAgICAgQGRiLnNjcmF0Y2gudXBzZXJ0IHsgX2lkOlwiM1wiLCBhOlwiQm9iXCIsIGI6MyB9LCA9PlxuICAgICAgICAgICAgZG9uZSgpXG5cbiAgICBpdCAnZmluZHMgYWxsIHJvd3MnLCAoZG9uZSkgLT5cbiAgICAgIEBkYi5zY3JhdGNoLmZpbmQoe30pLmZldGNoIChyZXN1bHRzKSA9PlxuICAgICAgICBhc3NlcnQuZXF1YWwgMywgcmVzdWx0cy5sZW5ndGhcbiAgICAgICAgZG9uZSgpXG5cbiAgICBpdCAnZmluZHMgYWxsIHJvd3Mgd2l0aCBvcHRpb25zJywgKGRvbmUpIC0+XG4gICAgICBAZGIuc2NyYXRjaC5maW5kKHt9LCB7fSkuZmV0Y2ggKHJlc3VsdHMpID0+XG4gICAgICAgIGFzc2VydC5lcXVhbCAzLCByZXN1bHRzLmxlbmd0aFxuICAgICAgICBkb25lKClcblxuICAgIGl0ICdmaWx0ZXJzIHJvd3MgYnkgaWQnLCAoZG9uZSkgLT5cbiAgICAgIEBkYi5zY3JhdGNoLmZpbmQoeyBfaWQ6IFwiMVwiIH0pLmZldGNoIChyZXN1bHRzKSA9PlxuICAgICAgICBhc3NlcnQuZXF1YWwgMSwgcmVzdWx0cy5sZW5ndGhcbiAgICAgICAgYXNzZXJ0LmVxdWFsICdBbGljZScsIHJlc3VsdHNbMF0uYVxuICAgICAgICBkb25lKClcblxuICAgIGl0ICdpbmNsdWRlcyBmaWVsZHMnLCAoZG9uZSkgLT5cbiAgICAgIEBkYi5zY3JhdGNoLmZpbmQoeyBfaWQ6IFwiMVwiIH0sIHsgZmllbGRzOiB7IGE6MSB9fSkuZmV0Y2ggKHJlc3VsdHMpID0+XG4gICAgICAgIGFzc2VydC5kZWVwRXF1YWwgcmVzdWx0c1swXSwgeyBfaWQ6IFwiMVwiLCAgYTogXCJBbGljZVwiIH1cbiAgICAgICAgZG9uZSgpXG5cbiAgICBpdCAnZXhjbHVkZXMgZmllbGRzJywgKGRvbmUpIC0+XG4gICAgICBAZGIuc2NyYXRjaC5maW5kKHsgX2lkOiBcIjFcIiB9LCB7IGZpZWxkczogeyBhOjAgfX0pLmZldGNoIChyZXN1bHRzKSA9PlxuICAgICAgICBhc3NlcnQuaXNVbmRlZmluZWQgcmVzdWx0c1swXS5hXG4gICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzWzBdLmIsIDFcbiAgICAgICAgZG9uZSgpXG5cbiAgICBpdCAnZmluZHMgb25lIHJvdycsIChkb25lKSAtPlxuICAgICAgQGRiLnNjcmF0Y2guZmluZE9uZSB7IF9pZDogXCIyXCIgfSwgKHJlc3VsdCkgPT5cbiAgICAgICAgYXNzZXJ0LmVxdWFsICdDaGFybGllJywgcmVzdWx0LmFcbiAgICAgICAgZG9uZSgpXG5cbiAgICBpdCAncmVtb3ZlcyBpdGVtJywgKGRvbmUpIC0+XG4gICAgICBAZGIuc2NyYXRjaC5yZW1vdmUgXCIyXCIsID0+XG4gICAgICAgIEBkYi5zY3JhdGNoLmZpbmQoe30pLmZldGNoIChyZXN1bHRzKSA9PlxuICAgICAgICAgIGFzc2VydC5lcXVhbCAyLCByZXN1bHRzLmxlbmd0aFxuICAgICAgICAgIGFzc2VydCBcIjFcIiBpbiAocmVzdWx0Ll9pZCBmb3IgcmVzdWx0IGluIHJlc3VsdHMpXG4gICAgICAgICAgYXNzZXJ0IFwiMlwiIG5vdCBpbiAocmVzdWx0Ll9pZCBmb3IgcmVzdWx0IGluIHJlc3VsdHMpXG4gICAgICAgICAgZG9uZSgpXG5cbiAgICBpdCAncmVtb3ZlcyBub24tZXhpc3RlbnQgaXRlbScsIChkb25lKSAtPlxuICAgICAgQGRiLnNjcmF0Y2gucmVtb3ZlIFwiOTk5XCIsID0+XG4gICAgICAgIEBkYi5zY3JhdGNoLmZpbmQoe30pLmZldGNoIChyZXN1bHRzKSA9PlxuICAgICAgICAgIGFzc2VydC5lcXVhbCAzLCByZXN1bHRzLmxlbmd0aFxuICAgICAgICAgIGRvbmUoKVxuXG4gICAgaXQgJ3NvcnRzIGFzY2VuZGluZycsIChkb25lKSAtPlxuICAgICAgQGRiLnNjcmF0Y2guZmluZCh7fSwge3NvcnQ6IFsnYSddfSkuZmV0Y2ggKHJlc3VsdHMpID0+XG4gICAgICAgIGFzc2VydC5kZWVwRXF1YWwgXy5wbHVjayhyZXN1bHRzLCAnX2lkJyksIFtcIjFcIixcIjNcIixcIjJcIl1cbiAgICAgICAgZG9uZSgpXG5cbiAgICBpdCAnc29ydHMgZGVzY2VuZGluZycsIChkb25lKSAtPlxuICAgICAgQGRiLnNjcmF0Y2guZmluZCh7fSwge3NvcnQ6IFtbJ2EnLCdkZXNjJ11dfSkuZmV0Y2ggKHJlc3VsdHMpID0+XG4gICAgICAgIGFzc2VydC5kZWVwRXF1YWwgXy5wbHVjayhyZXN1bHRzLCAnX2lkJyksIFtcIjJcIixcIjNcIixcIjFcIl1cbiAgICAgICAgZG9uZSgpXG5cbiAgICBpdCAnbGltaXRzJywgKGRvbmUpIC0+XG4gICAgICBAZGIuc2NyYXRjaC5maW5kKHt9LCB7c29ydDogWydhJ10sIGxpbWl0OjJ9KS5mZXRjaCAocmVzdWx0cykgPT5cbiAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCBfLnBsdWNrKHJlc3VsdHMsICdfaWQnKSwgW1wiMVwiLFwiM1wiXVxuICAgICAgICBkb25lKClcblxuICAgIGl0ICdmZXRjaGVzIGluZGVwZW5kZW50IGNvcGllcycsIChkb25lKSAtPlxuICAgICAgQGRiLnNjcmF0Y2guZmluZE9uZSB7IF9pZDogXCIyXCIgfSwgKHJlc3VsdCkgPT5cbiAgICAgICAgcmVzdWx0LmEgPSAnRGF2aWQnXG4gICAgICAgIEBkYi5zY3JhdGNoLmZpbmRPbmUgeyBfaWQ6IFwiMlwiIH0sIChyZXN1bHQpID0+XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsICdDaGFybGllJywgcmVzdWx0LmFcbiAgICAgICAgICBkb25lKClcblxuICBpdCAnYWRkcyBfaWQgdG8gcm93cycsIChkb25lKSAtPlxuICAgIEBkYi5zY3JhdGNoLnVwc2VydCB7IGE6IDEgfSwgKGl0ZW0pID0+XG4gICAgICBhc3NlcnQucHJvcGVydHkgaXRlbSwgJ19pZCdcbiAgICAgIGFzc2VydC5sZW5ndGhPZiBpdGVtLl9pZCwgMzJcbiAgICAgIGRvbmUoKVxuXG4gIGl0ICd1cGRhdGVzIGJ5IGlkJywgKGRvbmUpIC0+XG4gICAgQGRiLnNjcmF0Y2gudXBzZXJ0IHsgX2lkOlwiMVwiLCBhOjEgfSwgKGl0ZW0pID0+XG4gICAgICBAZGIuc2NyYXRjaC51cHNlcnQgeyBfaWQ6XCIxXCIsIGE6MiwgX3JldjogMSB9LCAoaXRlbSkgPT5cbiAgICAgICAgYXNzZXJ0LmVxdWFsIGl0ZW0uYSwgMlxuICBcbiAgICAgICAgQGRiLnNjcmF0Y2guZmluZCh7fSkuZmV0Y2ggKHJlc3VsdHMpID0+XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsIDEsIHJlc3VsdHMubGVuZ3RoXG4gICAgICAgICAgZG9uZSgpXG5cbiAgZ2VvcG9pbnQgPSAobG5nLCBsYXQpIC0+XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6ICdQb2ludCdcbiAgICAgIGNvb3JkaW5hdGVzOiBbbG5nLCBsYXRdXG4gICAgfVxuXG4gIGNvbnRleHQgJ1dpdGggZ2VvbG9jYXRlZCByb3dzJywgLT5cbiAgICBiZWZvcmVFYWNoIChkb25lKSAtPlxuICAgICAgQGRiLnNjcmF0Y2gudXBzZXJ0IHsgX2lkOlwiMVwiLCBsb2M6Z2VvcG9pbnQoOTAsIDQ1KSB9LCA9PlxuICAgICAgICBAZGIuc2NyYXRjaC51cHNlcnQgeyBfaWQ6XCIyXCIsIGxvYzpnZW9wb2ludCg5MCwgNDYpIH0sID0+XG4gICAgICAgICAgQGRiLnNjcmF0Y2gudXBzZXJ0IHsgX2lkOlwiM1wiLCBsb2M6Z2VvcG9pbnQoOTEsIDQ1KSB9LCA9PlxuICAgICAgICAgICAgQGRiLnNjcmF0Y2gudXBzZXJ0IHsgX2lkOlwiNFwiLCBsb2M6Z2VvcG9pbnQoOTEsIDQ2KSB9LCA9PlxuICAgICAgICAgICAgICBkb25lKClcblxuICAgIGl0ICdmaW5kcyBwb2ludHMgbmVhcicsIChkb25lKSAtPlxuICAgICAgc2VsZWN0b3IgPSBsb2M6IFxuICAgICAgICAkbmVhcjogXG4gICAgICAgICAgJGdlb21ldHJ5OiBnZW9wb2ludCg5MCwgNDUpXG5cbiAgICAgIEBkYi5zY3JhdGNoLmZpbmQoc2VsZWN0b3IpLmZldGNoIChyZXN1bHRzKSA9PlxuICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIF8ucGx1Y2socmVzdWx0cywgJ19pZCcpLCBbXCIxXCIsXCIzXCIsXCIyXCIsXCI0XCJdXG4gICAgICAgIGRvbmUoKVxuXG4gICAgaXQgJ2ZpbmRzIHBvaW50cyBuZWFyIG1heERpc3RhbmNlJywgKGRvbmUpIC0+XG4gICAgICBzZWxlY3RvciA9IGxvYzogXG4gICAgICAgICRuZWFyOiBcbiAgICAgICAgICAkZ2VvbWV0cnk6IGdlb3BvaW50KDkwLCA0NSlcbiAgICAgICAgICAkbWF4RGlzdGFuY2U6IDExMTAwMFxuXG4gICAgICBAZGIuc2NyYXRjaC5maW5kKHNlbGVjdG9yKS5mZXRjaCAocmVzdWx0cykgPT5cbiAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCBfLnBsdWNrKHJlc3VsdHMsICdfaWQnKSwgW1wiMVwiLFwiM1wiXVxuICAgICAgICBkb25lKCkgICAgICBcblxuICAgIGl0ICdmaW5kcyBwb2ludHMgbmVhciBtYXhEaXN0YW5jZSBqdXN0IGFib3ZlJywgKGRvbmUpIC0+XG4gICAgICBzZWxlY3RvciA9IGxvYzogXG4gICAgICAgICRuZWFyOiBcbiAgICAgICAgICAkZ2VvbWV0cnk6IGdlb3BvaW50KDkwLCA0NSlcbiAgICAgICAgICAkbWF4RGlzdGFuY2U6IDExMjAwMFxuXG4gICAgICBAZGIuc2NyYXRjaC5maW5kKHNlbGVjdG9yKS5mZXRjaCAocmVzdWx0cykgPT5cbiAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCBfLnBsdWNrKHJlc3VsdHMsICdfaWQnKSwgW1wiMVwiLFwiM1wiLFwiMlwiXVxuICAgICAgICBkb25lKClcblxuICAgIGl0ICdmaW5kcyBwb2ludHMgd2l0aGluIHNpbXBsZSBib3gnLCAoZG9uZSkgLT5cbiAgICAgIHNlbGVjdG9yID0gbG9jOiBcbiAgICAgICAgJGdlb0ludGVyc2VjdHM6IFxuICAgICAgICAgICRnZW9tZXRyeTogXG4gICAgICAgICAgICB0eXBlOiAnUG9seWdvbidcbiAgICAgICAgICAgIGNvb3JkaW5hdGVzOiBbW1xuICAgICAgICAgICAgICBbODkuNSwgNDUuNV0sIFs4OS41LCA0Ni41XSwgWzkwLjUsIDQ2LjVdLCBbOTAuNSwgNDUuNV0sIFs4OS41LCA0NS41XVxuICAgICAgICAgICAgXV1cbiAgICAgIEBkYi5zY3JhdGNoLmZpbmQoc2VsZWN0b3IpLmZldGNoIChyZXN1bHRzKSA9PlxuICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIF8ucGx1Y2socmVzdWx0cywgJ19pZCcpLCBbXCIyXCJdXG4gICAgICAgIGRvbmUoKVxuXG4gICAgaXQgJ2hhbmRsZXMgdW5kZWZpbmVkJywgKGRvbmUpIC0+XG4gICAgICBzZWxlY3RvciA9IGxvYzogXG4gICAgICAgICRnZW9JbnRlcnNlY3RzOiBcbiAgICAgICAgICAkZ2VvbWV0cnk6IFxuICAgICAgICAgICAgdHlwZTogJ1BvbHlnb24nXG4gICAgICAgICAgICBjb29yZGluYXRlczogW1tcbiAgICAgICAgICAgICAgWzg5LjUsIDQ1LjVdLCBbODkuNSwgNDYuNV0sIFs5MC41LCA0Ni41XSwgWzkwLjUsIDQ1LjVdLCBbODkuNSwgNDUuNV1cbiAgICAgICAgICAgIF1dXG4gICAgICBAZGIuc2NyYXRjaC51cHNlcnQgeyBfaWQ6NSB9LCA9PlxuICAgICAgICBAZGIuc2NyYXRjaC5maW5kKHNlbGVjdG9yKS5mZXRjaCAocmVzdWx0cykgPT5cbiAgICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIF8ucGx1Y2socmVzdWx0cywgJ19pZCcpLCBbXCIyXCJdXG4gICAgICAgICAgZG9uZSgpXG5cblxuIiwiYXNzZXJ0ID0gY2hhaS5hc3NlcnRcbnN5bmMgPSByZXF1aXJlICcuLi9hcHAvanMvc3luYydcblxuXG5kZXNjcmliZSBcIlJlcGVhdGVyXCIsIC0+XG4gIGJlZm9yZUVhY2ggLT5cblxuICBpdCBcImNhbGxzIGFjdGlvbiBldmVyeSBuIG1pbGxpc2Vjb25kc1wiLCAoZG9uZSkgLT5cbiAgICBjb3VudCA9IDBcbiAgICBAcmVwZWF0ZXIgPSBuZXcgc3luYy5SZXBlYXRlciAoc3VjY2VzcywgZXJyb3IpIC0+XG4gICAgICBjb3VudCArPSAxXG4gICAgICBzdWNjZXNzKClcblxuICAgIEByZXBlYXRlci5zdGFydCgxMClcbiAgICBzZXRUaW1lb3V0ID0+XG4gICAgICBAcmVwZWF0ZXIuc3RvcCgpXG5cbiAgICAgICMgQ2hlY2sgY291bnRcbiAgICAgIGFzc2VydC5jbG9zZVRvIGNvdW50LCAxMCwgM1xuICAgICAgZG9uZSgpXG4gICAgLCAxMDBcblxuXG4gIGl0IFwiZG9lcyBub3QgY2FsbCBhY3Rpb24gaWYgc3RpbGwgaW4gcHJvZ3Jlc3NcIiwgKGRvbmUpIC0+XG4gICAgY291bnQgPSAwXG4gICAgQHJlcGVhdGVyID0gbmV3IHN5bmMuUmVwZWF0ZXIgKHN1Y2Nlc3MsIGVycm9yKSAtPlxuICAgICAgY291bnQgKz0gMVxuICAgICAgc2V0VGltZW91dCAtPiBcbiAgICAgICAgc3VjY2VzcygpXG4gICAgICAsIDIwMFxuXG4gICAgQHJlcGVhdGVyLnN0YXJ0KDEwKVxuICAgIHNldFRpbWVvdXQgPT5cbiAgICAgIEByZXBlYXRlci5zdG9wKClcblxuICAgICAgIyBDaGVjayBjb3VudFxuICAgICAgYXNzZXJ0LmVxdWFsIGNvdW50LCAxXG4gICAgICBkb25lKClcbiAgICAsIDEwMFxuXG4gIGl0IFwiY2FsbHMgYWN0aW9uIHJpZ2h0IGF3YXkgaWYgY2FsbGVkXCIsIChkb25lKSAtPlxuICAgIGNvdW50ID0gMFxuICAgIEByZXBlYXRlciA9IG5ldyBzeW5jLlJlcGVhdGVyIChzdWNjZXNzLCBlcnJvcikgLT5cbiAgICAgIGNvdW50ICs9IDFcbiAgICAgIHN1Y2Nlc3MoKVxuXG4gICAgQHJlcGVhdGVyLnBlcmZvcm0oKVxuICAgIGFzc2VydC5lcXVhbCBjb3VudCwgMVxuICAgIGRvbmUoKVxuXG4gIGl0IFwic3RvcHMgb24gcmVxdWVzdFwiLCAoZG9uZSkgLT5cbiAgICBjb3VudCA9IDBcbiAgICBAcmVwZWF0ZXIgPSBuZXcgc3luYy5SZXBlYXRlciAoc3VjY2VzcywgZXJyb3IpID0+XG4gICAgICBjb3VudCArPSAxXG4gICAgICBpZiBjb3VudCA9PSAxMFxuICAgICAgICBAcmVwZWF0ZXIuc3RvcCgpXG4gICAgICBzdWNjZXNzKClcblxuICAgIEByZXBlYXRlci5zdGFydCgxMClcbiAgICBzZXRUaW1lb3V0ID0+XG4gICAgICAjIENoZWNrIGNvdW50XG4gICAgICBhc3NlcnQuZXF1YWwgY291bnQsIDEwXG4gICAgICBkb25lKClcbiAgICAsIDIwMFxuXG4gIGl0IFwicmVjb3JkcyBsYXN0IGVycm9yXCIsIChkb25lKSAtPlxuICAgIEByZXBlYXRlciA9IG5ldyBzeW5jLlJlcGVhdGVyIChzdWNjZXNzLCBlcnJvcikgLT5cbiAgICAgIGVycm9yKFwic29tZSBtZXNzYWdlXCIpXG5cbiAgICBAcmVwZWF0ZXIuc3RhcnQoMTApXG4gICAgc2V0VGltZW91dCA9PlxuICAgICAgQHJlcGVhdGVyLnN0b3AoKVxuXG4gICAgICAjIENoZWNrIGNvdW50XG4gICAgICBhc3NlcnQuZXF1YWwgQHJlcGVhdGVyLmxhc3RFcnJvciwgXCJzb21lIG1lc3NhZ2VcIlxuICAgICAgZG9uZSgpXG4gICAgLCAxMDBcblxuXG4gIGl0IFwicmVjb3JkcyBsYXN0IHN1Y2Nlc3MgZGF0ZVwiLCAoZG9uZSkgLT5cbiAgICBiZWZvcmUgPSBuZXcgRGF0ZSgpXG4gICAgQHJlcGVhdGVyID0gbmV3IHN5bmMuUmVwZWF0ZXIgKHN1Y2Nlc3MsIGVycm9yKSAtPlxuICAgICAgc3VjY2VzcygpXG5cbiAgICBAcmVwZWF0ZXIuc3RhcnQoMTApXG4gICAgc2V0VGltZW91dCA9PlxuICAgICAgQHJlcGVhdGVyLnN0b3AoKVxuXG4gICAgICAjIENoZWNrIGRhdGVcbiAgICAgIGFzc2VydC5pc1RydWUgbmV3IERhdGUoKSA+IEByZXBlYXRlci5sYXN0U3VjY2Vzc0RhdGVcbiAgICAgIGFzc2VydC5pc1RydWUgYmVmb3JlIDwgQHJlcGVhdGVyLmxhc3RTdWNjZXNzRGF0ZVxuICAgICAgZG9uZSgpXG4gICAgLCAxMDBcblxuICBpdCBcImNsZWFycyBsYXN0IGVycm9yIG9uIHN1Y2Nlc3NcIiwgKGRvbmUpIC0+XG4gICAgY291bnQgPSAwXG4gICAgQHJlcGVhdGVyID0gbmV3IHN5bmMuUmVwZWF0ZXIgKHN1Y2Nlc3MsIGVycm9yKSAtPlxuICAgICAgY291bnQgKz0gMVxuICAgICAgaWYgY291bnQgPCAzXG4gICAgICAgIGVycm9yKFwic29tZSBtZXNzYWdlXCIpXG4gICAgICBlbHNlXG4gICAgICAgIHN1Y2Nlc3MoKVxuXG4gICAgQHJlcGVhdGVyLnN0YXJ0KDEwKVxuICAgIHNldFRpbWVvdXQgPT5cbiAgICAgIEByZXBlYXRlci5zdG9wKClcblxuICAgICAgIyBDaGVjayBjb3VudFxuICAgICAgYXNzZXJ0LmlzRmFsc2UgQHJlcGVhdGVyLmxhc3RFcnJvcj9cbiAgICAgIGRvbmUoKVxuICAgICwgMTAwXG5cblxuIiwiYXNzZXJ0ID0gY2hhaS5hc3NlcnRcbnNvdXJjZWNvZGVzID0gcmVxdWlyZSAnLi4vYXBwL2pzL3NvdXJjZWNvZGVzJ1xuSnNvblNlcnZlciA9IHJlcXVpcmUgJy4vaGVscGVycy9Kc29uU2VydmVyJ1xuXG5kZXNjcmliZSBcIlNvdXJjZSBDb2RlIE1hbmFnZXJcIiwgLT5cbiAgYmVmb3JlRWFjaCAtPlxuICAgIEBtZ3IgPSBuZXcgc291cmNlY29kZXMuU291cmNlQ29kZXNNYW5hZ2VyKFwic291cmNlX2NvZGVzXCIpXG4gICAgQG1nci5yZXNldCgpXG5cbiAgICBAc2VydmVyID0gbmV3IEpzb25TZXJ2ZXIoKVxuXG4gIGFmdGVyRWFjaCAtPlxuICAgIEBzZXJ2ZXIudGVhcmRvd24oKVxuXG4gIGl0IFwiRmFpbHMgdG8gcmV0dXJuIGNvZGVzIGluaXRpYWxseVwiLCAoZG9uZSkgLT5cbiAgICBzdWNjZXNzID0gLT4gYXNzZXJ0LmZhaWwoKVxuICAgIGVycm9yID0gLT4gZG9uZSgpXG4gICAgY3V0b2ZmID0gXCIyMDEyLTAxLTAxVDAwOjAwOjAwWlwiXG4gICAgQG1nci5yZXF1ZXN0Q29kZShzdWNjZXNzLCBlcnJvciwgY3V0b2ZmKVxuXG4gIGl0IFwiQ2FsbHMgc2VydmVyIGZvciBtb3JlIGNvZGVzIGlmIG5vbmVcIiwgKGRvbmUpIC0+XG4gICAgQHNlcnZlci5yZXNwb25kIFwiUE9TVFwiLCBcInNvdXJjZV9jb2Rlc1wiLCAocmVxdWVzdCkgPT5cbiAgICAgIGFzc2VydC5lcXVhbCByZXF1ZXN0LnBhcmFtcy5udW1iZXIsIDFcbiAgICAgIHJldHVybiBbIFxuICAgICAgICB7IGNvZGU6IDEwMDA3LCBleHBpcnk6IFwiMjAxMy0wMS0wMVQwMDowMDowMFpcIn0gXG4gICAgICAgIHsgY29kZTogMTAwMTQsIGV4cGlyeTogXCIyMDEzLTAxLTAxVDAwOjAwOjAwWlwifSBcbiAgICAgIF1cbiAgICBzdWNjZXNzID0gKGNvZGUpIC0+IFxuICAgICAgYXNzZXJ0LmVxdWFsIGNvZGUsIDEwMDA3XG4gICAgICBkb25lKClcbiAgICBlcnJvciA9IC0+IGFzc2VydC5mYWlsKClcbiAgICBjdXRvZmYgPSBcIjIwMTItMDEtMDFUMDA6MDA6MDBaXCJcbiAgICBAbWdyLnJlcXVlc3RDb2RlKHN1Y2Nlc3MsIGVycm9yLCBjdXRvZmYpXG5cbiAgaXQgXCJSZXR1cm5zIG5vbi1leHBpcmVkIGNvZGVzIGlmIHByZXNlbnRcIiwgKGRvbmUpIC0+XG4gICAgQG1nci5zZXRMb2NhbENvZGVzIFsgXG4gICAgICB7IGNvZGU6IDEwMDA3LCBleHBpcnk6IFwiMjAxMi0wMS0wMVQwMDowMDowMFpcIn0gXG4gICAgICB7IGNvZGU6IDEwMDE0LCBleHBpcnk6IFwiMjAxMy0wMS0wMVQwMDowMDowMFpcIn0gXG4gICAgXVxuXG4gICAgc3VjY2VzcyA9IChjb2RlKSA9PiBcbiAgICAgIGFzc2VydC5lcXVhbCBjb2RlLCAxMDAxNFxuXG4gICAgICAjIE9ubHkgb25lIGF2YWlsYWJsZS4gTm93IGZhaWxzXG4gICAgICBzdWNjZXNzID0gLT4gYXNzZXJ0LmZhaWwoKVxuICAgICAgZXJyb3IgPSAtPiBkb25lKClcbiAgICAgIGN1dG9mZiA9IFwiMjAxMC0wMS0wMVQwMDowMDowMFpcIlxuICAgICAgQG1nci5yZXF1ZXN0Q29kZShzdWNjZXNzLCBlcnJvciwgY3V0b2ZmKVxuXG4gICAgZXJyb3IgPSAtPiBhc3NlcnQuZmFpbCgpXG4gICAgY3V0b2ZmID0gXCIyMDEyLTA2LTAxVDAwOjAwOjAwWlwiXG4gICAgQG1nci5yZXF1ZXN0Q29kZShzdWNjZXNzLCBlcnJvciwgY3V0b2ZmKVxuXG5cbiAgaXQgXCJSZXR1cm4gbnVtYmVyIG9mIG5vbi1leHBpcmVkIGNvZGVzXCIsIChkb25lKSAtPlxuICAgIEBtZ3Iuc2V0TG9jYWxDb2RlcyBbIFxuICAgICAgeyBjb2RlOiAxMDAwNywgZXhwaXJ5OiBcIjIwMTItMDEtMDFUMDA6MDA6MDBaXCJ9IFxuICAgICAgeyBjb2RlOiAxMDAxNCwgZXhwaXJ5OiBcIjIwMTMtMDEtMDFUMDA6MDA6MDBaXCJ9IFxuICAgIF1cblxuICAgIGN1dG9mZiA9IFwiMjAxMi0wNi0wMVQwMDowMDowMFpcIlxuICAgIGFzc2VydC5lcXVhbCBAbWdyLmdldE51bWJlckF2YWlsYWJsZUNvZGVzKGN1dG9mZiksIDFcbiAgICBkb25lKClcblxuICBpdCBcIlN0b3JlcyBjb2RlcyBpbiBsb2NhbCBzdG9yYWdlXCIsIC0+XG4gICAgQG1nci5zZXRMb2NhbENvZGVzIFsgXG4gICAgICB7IGNvZGU6IDEwMDA3LCBleHBpcnk6IFwiMjAxMi0wMS0wMVQwMDowMDowMFpcIn0gXG4gICAgICB7IGNvZGU6IDEwMDE0LCBleHBpcnk6IFwiMjAxMy0wMS0wMVQwMDowMDowMFpcIn0gXG4gICAgXVxuICAgIGN1dG9mZiA9IFwiMjAxMi0wNi0wMVQwMDowMDowMFpcIlxuICAgIG1ncjIgPSBuZXcgc291cmNlY29kZXMuU291cmNlQ29kZXNNYW5hZ2VyKClcbiAgICBhc3NlcnQuZXF1YWwgbWdyMi5nZXROdW1iZXJBdmFpbGFibGVDb2RlcyhjdXRvZmYpLCAxXG5cblxuXG5cbiIsIlxuZXhwb3J0cy5EYXRlUXVlc3Rpb24gPSByZXF1aXJlICcuL0RhdGVRdWVzdGlvbidcbmV4cG9ydHMuRHJvcGRvd25RdWVzdGlvbiA9IHJlcXVpcmUgJy4vRHJvcGRvd25RdWVzdGlvbidcbmV4cG9ydHMuTnVtYmVyUXVlc3Rpb24gPSByZXF1aXJlICcuL051bWJlclF1ZXN0aW9uJ1xuZXhwb3J0cy5RdWVzdGlvbkdyb3VwID0gcmVxdWlyZSAnLi9RdWVzdGlvbkdyb3VwJ1xuZXhwb3J0cy5TYXZlQ2FuY2VsRm9ybSA9IHJlcXVpcmUgJy4vU2F2ZUNhbmNlbEZvcm0nXG5leHBvcnRzLlNvdXJjZVF1ZXN0aW9uID0gcmVxdWlyZSAnLi9Tb3VyY2VRdWVzdGlvbidcbmV4cG9ydHMuSW1hZ2VRdWVzdGlvbiA9IHJlcXVpcmUgJy4vSW1hZ2VRdWVzdGlvbidcbmV4cG9ydHMuSW1hZ2VzUXVlc3Rpb24gPSByZXF1aXJlICcuL0ltYWdlc1F1ZXN0aW9uJ1xuZXhwb3J0cy5JbnN0cnVjdGlvbnMgPSByZXF1aXJlICcuL0luc3RydWN0aW9ucydcblxuIyBNdXN0IGJlIGNyZWF0ZWQgd2l0aCBtb2RlbCAoYmFja2JvbmUgbW9kZWwpIGFuZCBjb250ZW50cyAoYXJyYXkgb2Ygdmlld3MpXG5leHBvcnRzLkZvcm1WaWV3ID0gY2xhc3MgRm9ybVZpZXcgZXh0ZW5kcyBCYWNrYm9uZS5WaWV3XG4gIGluaXRpYWxpemU6IChvcHRpb25zKSAtPlxuICAgIEBjb250ZW50cyA9IG9wdGlvbnMuY29udGVudHNcbiAgICBcbiAgICAjIEFkZCBjb250ZW50cyBhbmQgbGlzdGVuIHRvIGV2ZW50c1xuICAgIGZvciBjb250ZW50IGluIG9wdGlvbnMuY29udGVudHNcbiAgICAgIEAkZWwuYXBwZW5kKGNvbnRlbnQuZWwpO1xuICAgICAgQGxpc3RlblRvIGNvbnRlbnQsICdjbG9zZScsID0+IEB0cmlnZ2VyKCdjbG9zZScpXG4gICAgICBAbGlzdGVuVG8gY29udGVudCwgJ2NvbXBsZXRlJywgPT4gQHRyaWdnZXIoJ2NvbXBsZXRlJylcblxuICAgICMgQWRkIGxpc3RlbmVyIHRvIG1vZGVsXG4gICAgQGxpc3RlblRvIEBtb2RlbCwgJ2NoYW5nZScsID0+IEB0cmlnZ2VyKCdjaGFuZ2UnKVxuXG4gICAgIyBPdmVycmlkZSBzYXZlIGlmIHBhc3NlZCBhcyBvcHRpb25cbiAgICBpZiBvcHRpb25zLnNhdmVcbiAgICAgIEBzYXZlID0gb3B0aW9ucy5zYXZlXG5cbiAgbG9hZDogKGRhdGEpIC0+XG4gICAgQG1vZGVsLmNsZWFyKCkgICNUT0RPIGNsZWFyIG9yIG5vdCBjbGVhcj8gY2xlYXJpbmcgcmVtb3ZlcyBkZWZhdWx0cywgYnV0IGFsbG93cyB0cnVlIHJldXNlLlxuXG4gICAgIyBBcHBseSBkZWZhdWx0cyBcbiAgICBAbW9kZWwuc2V0KF8uZGVmYXVsdHMoXy5jbG9uZURlZXAoZGF0YSksIEBvcHRpb25zLmRlZmF1bHRzIHx8IHt9KSlcblxuICBzYXZlOiAtPlxuICAgIHJldHVybiBAbW9kZWwudG9KU09OKClcblxuXG4jIFNpbXBsZSBmb3JtIHRoYXQgZGlzcGxheXMgYSB0ZW1wbGF0ZSBiYXNlZCBvbiBsb2FkZWQgZGF0YVxuZXhwb3J0cy50ZW1wbGF0ZVZpZXcgPSAodGVtcGxhdGUpIC0+IFxuICByZXR1cm4ge1xuICAgIGVsOiAkKCc8ZGl2PjwvZGl2PicpXG4gICAgbG9hZDogKGRhdGEpIC0+XG4gICAgICAkKEBlbCkuaHRtbCB0ZW1wbGF0ZShkYXRhKVxuICB9XG5cbiAgIyBjbGFzcyBUZW1wbGF0ZVZpZXcgZXh0ZW5kcyBCYWNrYm9uZS5WaWV3XG4gICMgY29uc3RydWN0b3I6ICh0ZW1wbGF0ZSkgLT5cbiAgIyAgIEB0ZW1wbGF0ZSA9IHRlbXBsYXRlXG5cbiAgIyBsb2FkOiAoZGF0YSkgLT5cbiAgIyAgIEAkZWwuaHRtbCBAdGVtcGxhdGUoZGF0YSlcblxuXG5leHBvcnRzLlN1cnZleVZpZXcgPSBjbGFzcyBTdXJ2ZXlWaWV3IGV4dGVuZHMgRm9ybVZpZXdcblxuZXhwb3J0cy5XYXRlclRlc3RFZGl0VmlldyA9IGNsYXNzIFdhdGVyVGVzdEVkaXRWaWV3IGV4dGVuZHMgRm9ybVZpZXdcbiAgaW5pdGlhbGl6ZTogKG9wdGlvbnMpIC0+XG4gICAgc3VwZXIob3B0aW9ucylcblxuICAgICMgQWRkIGJ1dHRvbnMgYXQgYm90dG9tXG4gICAgIyBUT0RPIG1vdmUgdG8gdGVtcGxhdGUgYW5kIHNlcCBmaWxlXG4gICAgQCRlbC5hcHBlbmQgJCgnJydcbiAgICAgIDxkaXY+XG4gICAgICAgICAgPGJ1dHRvbiBpZD1cImNsb3NlX2J1dHRvblwiIHR5cGU9XCJidXR0b25cIiBjbGFzcz1cImJ0biBtYXJnaW5lZFwiPlNhdmUgZm9yIExhdGVyPC9idXR0b24+XG4gICAgICAgICAgJm5ic3A7XG4gICAgICAgICAgPGJ1dHRvbiBpZD1cImNvbXBsZXRlX2J1dHRvblwiIHR5cGU9XCJidXR0b25cIiBjbGFzcz1cImJ0biBidG4tcHJpbWFyeSBtYXJnaW5lZFwiPjxpIGNsYXNzPVwiaWNvbi1vayBpY29uLXdoaXRlXCI+PC9pPiBDb21wbGV0ZTwvYnV0dG9uPlxuICAgICAgPC9kaXY+XG4gICAgJycnKVxuXG4gIGV2ZW50czogXG4gICAgXCJjbGljayAjY2xvc2VfYnV0dG9uXCIgOiBcImNsb3NlXCJcbiAgICBcImNsaWNrICNjb21wbGV0ZV9idXR0b25cIiA6IFwiY29tcGxldGVcIlxuXG4gICMgVE9ETyByZWZhY3RvciB3aXRoIFNhdmVDYW5jZWxGb3JtXG4gIHZhbGlkYXRlOiAtPlxuICAgICMgR2V0IGFsbCB2aXNpYmxlIGl0ZW1zXG4gICAgaXRlbXMgPSBfLmZpbHRlcihAY29udGVudHMsIChjKSAtPlxuICAgICAgYy52aXNpYmxlIGFuZCBjLnZhbGlkYXRlXG4gICAgKVxuICAgIHJldHVybiBub3QgXy5hbnkoXy5tYXAoaXRlbXMsIChpdGVtKSAtPlxuICAgICAgaXRlbS52YWxpZGF0ZSgpXG4gICAgKSlcblxuICBjbG9zZTogLT5cbiAgICBAdHJpZ2dlciAnY2xvc2UnXG5cbiAgY29tcGxldGU6IC0+XG4gICAgaWYgQHZhbGlkYXRlKClcbiAgICAgIEB0cmlnZ2VyICdjb21wbGV0ZSdcbiAgICAgIFxuIyBDcmVhdGVzIGEgZm9ybSB2aWV3IGZyb20gYSBzdHJpbmdcbmV4cG9ydHMuaW5zdGFudGlhdGVWaWV3ID0gKHZpZXdTdHIsIG9wdGlvbnMpID0+XG4gIHZpZXdGdW5jID0gbmV3IEZ1bmN0aW9uKFwib3B0aW9uc1wiLCB2aWV3U3RyKVxuICB2aWV3RnVuYyhvcHRpb25zKVxuXG5fLmV4dGVuZChleHBvcnRzLCByZXF1aXJlKCcuL2Zvcm0tY29udHJvbHMnKSlcblxuXG4jIFRPRE8gZmlndXJlIG91dCBob3cgdG8gYWxsb3cgdHdvIHN1cnZleXMgZm9yIGRpZmZlcmluZyBjbGllbnQgdmVyc2lvbnM/IE9yIGp1c3QgdXNlIG1pblZlcnNpb24/IiwiYXNzZXJ0ID0gY2hhaS5hc3NlcnRcblxuY2xhc3MgVUlEcml2ZXJcbiAgY29uc3RydWN0b3I6IChlbCkgLT5cbiAgICBAZWwgPSAkKGVsKVxuXG4gIGdldERpc2FibGVkOiAoc3RyKSAtPlxuICAgIGZvciBpdGVtIGluIEBlbC5maW5kKFwiYSxidXR0b25cIilcbiAgICAgIGlmICQoaXRlbSkudGV4dCgpLmluZGV4T2Yoc3RyKSAhPSAtMVxuICAgICAgICByZXR1cm4gJChpdGVtKS5pcyhcIjpkaXNhYmxlZFwiKVxuICAgIGFzc2VydC5mYWlsKG51bGwsIHN0ciwgXCJDYW4ndCBmaW5kOiBcIiArIHN0cilcblxuICBjbGljazogKHN0cikgLT5cbiAgICBmb3IgaXRlbSBpbiBAZWwuZmluZChcImEsYnV0dG9uXCIpXG4gICAgICBpZiAkKGl0ZW0pLnRleHQoKS5pbmRleE9mKHN0cikgIT0gLTFcbiAgICAgICAgY29uc29sZS5sb2cgXCJDbGlja2luZzogXCIgKyAkKGl0ZW0pLnRleHQoKVxuICAgICAgICAkKGl0ZW0pLnRyaWdnZXIoXCJjbGlja1wiKVxuICAgICAgICByZXR1cm5cbiAgICBhc3NlcnQuZmFpbChudWxsLCBzdHIsIFwiQ2FuJ3QgZmluZDogXCIgKyBzdHIpXG4gIFxuICBmaWxsOiAoc3RyLCB2YWx1ZSkgLT5cbiAgICBmb3IgaXRlbSBpbiBAZWwuZmluZChcImxhYmVsXCIpXG4gICAgICBpZiAkKGl0ZW0pLnRleHQoKS5pbmRleE9mKHN0cikgIT0gLTFcbiAgICAgICAgYm94ID0gQGVsLmZpbmQoXCIjXCIrJChpdGVtKS5hdHRyKCdmb3InKSlcbiAgICAgICAgYm94LnZhbCh2YWx1ZSlcbiAgXG4gIHRleHQ6IC0+XG4gICAgcmV0dXJuIEBlbC50ZXh0KClcbiAgICAgIFxuICB3YWl0OiAoYWZ0ZXIpIC0+XG4gICAgc2V0VGltZW91dCBhZnRlciwgMTBcblxubW9kdWxlLmV4cG9ydHMgPSBVSURyaXZlciIsIiMgR2VvSlNPTiBoZWxwZXIgcm91dGluZXNcblxuIyBDb252ZXJ0cyBuYXZpZ2F0b3IgcG9zaXRpb24gdG8gcG9pbnRcbmV4cG9ydHMucG9zVG9Qb2ludCA9IChwb3MpIC0+XG4gIHJldHVybiB7XG4gICAgdHlwZTogJ1BvaW50J1xuICAgIGNvb3JkaW5hdGVzOiBbcG9zLmNvb3Jkcy5sb25naXR1ZGUsIHBvcy5jb29yZHMubGF0aXR1ZGVdXG4gIH1cblxuXG5leHBvcnRzLmxhdExuZ0JvdW5kc1RvR2VvSlNPTiA9IChib3VuZHMpIC0+XG4gIHN3ID0gYm91bmRzLmdldFNvdXRoV2VzdCgpXG4gIG5lID0gYm91bmRzLmdldE5vcnRoRWFzdCgpXG4gIHJldHVybiB7XG4gICAgdHlwZTogJ1BvbHlnb24nLFxuICAgIGNvb3JkaW5hdGVzOiBbXG4gICAgICBbW3N3LmxuZywgc3cubGF0XSwgXG4gICAgICBbc3cubG5nLCBuZS5sYXRdLCBcbiAgICAgIFtuZS5sbmcsIG5lLmxhdF0sIFxuICAgICAgW25lLmxuZywgc3cubGF0XSxcbiAgICAgIFtzdy5sbmcsIHN3LmxhdF1dXG4gICAgXVxuICB9XG5cbiMgVE9ETzogb25seSB3b3JrcyB3aXRoIGJvdW5kc1xuZXhwb3J0cy5wb2ludEluUG9seWdvbiA9IChwb2ludCwgcG9seWdvbikgLT5cbiAgIyBDaGVjayB0aGF0IGZpcnN0ID09IGxhc3RcbiAgaWYgbm90IF8uaXNFcXVhbChfLmZpcnN0KHBvbHlnb24uY29vcmRpbmF0ZXNbMF0pLCBfLmxhc3QocG9seWdvbi5jb29yZGluYXRlc1swXSkpXG4gICAgdGhyb3cgbmV3IEVycm9yKFwiRmlyc3QgbXVzdCBlcXVhbCBsYXN0XCIpXG5cbiAgIyBHZXQgYm91bmRzXG4gIGJvdW5kcyA9IG5ldyBMLkxhdExuZ0JvdW5kcyhfLm1hcChwb2x5Z29uLmNvb3JkaW5hdGVzWzBdLCAoY29vcmQpIC0+IG5ldyBMLkxhdExuZyhjb29yZFsxXSwgY29vcmRbMF0pKSlcbiAgcmV0dXJuIGJvdW5kcy5jb250YWlucyhuZXcgTC5MYXRMbmcocG9pbnQuY29vcmRpbmF0ZXNbMV0sIHBvaW50LmNvb3JkaW5hdGVzWzBdKSlcblxuZXhwb3J0cy5nZXRSZWxhdGl2ZUxvY2F0aW9uID0gKGZyb20sIHRvKSAtPlxuICB4MSA9IGZyb20uY29vcmRpbmF0ZXNbMF1cbiAgeTEgPSBmcm9tLmNvb3JkaW5hdGVzWzFdXG4gIHgyID0gdG8uY29vcmRpbmF0ZXNbMF1cbiAgeTIgPSB0by5jb29yZGluYXRlc1sxXVxuICBcbiAgIyBDb252ZXJ0IHRvIHJlbGF0aXZlIHBvc2l0aW9uIChhcHByb3hpbWF0ZSlcbiAgZHkgPSAoeTIgLSB5MSkgLyA1Ny4zICogNjM3MTAwMFxuICBkeCA9IE1hdGguY29zKHkxIC8gNTcuMykgKiAoeDIgLSB4MSkgLyA1Ny4zICogNjM3MTAwMFxuICBcbiAgIyBEZXRlcm1pbmUgZGlyZWN0aW9uIGFuZCBhbmdsZVxuICBkaXN0ID0gTWF0aC5zcXJ0KGR4ICogZHggKyBkeSAqIGR5KVxuICBhbmdsZSA9IDkwIC0gKE1hdGguYXRhbjIoZHksIGR4KSAqIDU3LjMpXG4gIGFuZ2xlICs9IDM2MCBpZiBhbmdsZSA8IDBcbiAgYW5nbGUgLT0gMzYwIGlmIGFuZ2xlID4gMzYwXG4gIFxuICAjIEdldCBhcHByb3hpbWF0ZSBkaXJlY3Rpb25cbiAgY29tcGFzc0RpciA9IChNYXRoLmZsb29yKChhbmdsZSArIDIyLjUpIC8gNDUpKSAlIDhcbiAgY29tcGFzc1N0cnMgPSBbXCJOXCIsIFwiTkVcIiwgXCJFXCIsIFwiU0VcIiwgXCJTXCIsIFwiU1dcIiwgXCJXXCIsIFwiTldcIl1cbiAgaWYgZGlzdCA+IDEwMDBcbiAgICAoZGlzdCAvIDEwMDApLnRvRml4ZWQoMSkgKyBcImttIFwiICsgY29tcGFzc1N0cnNbY29tcGFzc0Rpcl1cbiAgZWxzZVxuICAgIChkaXN0KS50b0ZpeGVkKDApICsgXCJtIFwiICsgY29tcGFzc1N0cnNbY29tcGFzc0Rpcl0iLCJcbiMgVHJhY2tzIGEgc2V0IG9mIGl0ZW1zIGJ5IGlkLCBpbmRpY2F0aW5nIHdoaWNoIGhhdmUgYmVlbiBhZGRlZCBvciByZW1vdmVkLlxuIyBDaGFuZ2VzIGFyZSBib3RoIGFkZCBhbmQgcmVtb3ZlXG5jbGFzcyBJdGVtVHJhY2tlclxuICBjb25zdHJ1Y3RvcjogLT5cbiAgICBAa2V5ID0gJ19pZCdcbiAgICBAaXRlbXMgPSB7fVxuXG4gIHVwZGF0ZTogKGl0ZW1zKSAtPiAgICAjIFJldHVybiBbW2FkZGVkXSxbcmVtb3ZlZF1dIGl0ZW1zXG4gICAgYWRkcyA9IFtdXG4gICAgcmVtb3ZlcyA9IFtdXG5cbiAgICAjIEFkZCBhbnkgbmV3IG9uZXNcbiAgICBmb3IgaXRlbSBpbiBpdGVtc1xuICAgICAgaWYgbm90IF8uaGFzKEBpdGVtcywgaXRlbVtAa2V5XSlcbiAgICAgICAgYWRkcy5wdXNoKGl0ZW0pXG5cbiAgICAjIENyZWF0ZSBtYXAgb2YgaXRlbXMgcGFyYW1ldGVyXG4gICAgbWFwID0gXy5vYmplY3QoXy5wbHVjayhpdGVtcywgQGtleSksIGl0ZW1zKVxuXG4gICAgIyBGaW5kIHJlbW92ZXNcbiAgICBmb3Iga2V5LCB2YWx1ZSBvZiBAaXRlbXNcbiAgICAgIGlmIG5vdCBfLmhhcyhtYXAsIGtleSlcbiAgICAgICAgcmVtb3Zlcy5wdXNoKHZhbHVlKVxuICAgICAgZWxzZSBpZiBub3QgXy5pc0VxdWFsKHZhbHVlLCBtYXBba2V5XSlcbiAgICAgICAgYWRkcy5wdXNoKG1hcFtrZXldKVxuICAgICAgICByZW1vdmVzLnB1c2godmFsdWUpXG5cbiAgICBmb3IgaXRlbSBpbiByZW1vdmVzXG4gICAgICBkZWxldGUgQGl0ZW1zW2l0ZW1bQGtleV1dXG5cbiAgICBmb3IgaXRlbSBpbiBhZGRzXG4gICAgICBAaXRlbXNbaXRlbVtAa2V5XV0gPSBpdGVtXG5cbiAgICByZXR1cm4gW2FkZHMsIHJlbW92ZXNdXG5cbm1vZHVsZS5leHBvcnRzID0gSXRlbVRyYWNrZXIiLCJleHBvcnRzLnNlcVRvQ29kZSA9IChzZXEpIC0+XG4gICMgR2V0IHN0cmluZyBvZiBzZXEgbnVtYmVyXG4gIHN0ciA9IFwiXCIgKyBzZXFcblxuICBzdW0gPSAwXG4gIGZvciBpIGluIFswLi4uc3RyLmxlbmd0aF1cbiAgICBkaWdpdCA9IHBhcnNlSW50KHN0cltzdHIubGVuZ3RoLTEtaV0pXG4gICAgaWYgaSUzID09IDBcbiAgICAgIHN1bSArPSA3ICogZGlnaXRcbiAgICBpZiBpJTMgPT0gMVxuICAgICAgc3VtICs9IDMgKiBkaWdpdFxuICAgIGlmIGklMyA9PSAyXG4gICAgICBzdW0gKz0gIGRpZ2l0XG4gIHJldHVybiBzdHIgKyAoc3VtICUgMTApXG5cbmV4cG9ydHMuaXNWYWxpZCA9IChjb2RlKSAtPlxuICBzZXEgPSBwYXJzZUludChjb2RlLnN1YnN0cmluZygwLCBjb2RlLmxlbmd0aCAtIDEpKVxuXG4gIHJldHVybiBleHBvcnRzLnNlcVRvQ29kZShzZXEpID09IGNvZGVcblxuZXhwb3J0cy5Tb3VyY2VDb2Rlc01hbmFnZXIgPSBjbGFzcyBTb3VyY2VDb2Rlc01hbmFnZXIgXG4gICMgVVJMIHRvIG9idGFpbiBtb3JlIGNvZGVzIGZyb21cbiAgY29uc3RydWN0b3I6ICh1cmwpIC0+XG4gICAgQHVybCA9IHVybFxuXG4gICMgRGVmYXVsdCBjdXRvZmYgaXMgdGhyZWUgbW9udGhzIGluIGZ1dHVyZVxuICBkZWZhdWx0Q3V0b2ZmID0gLT5cbiAgICBjdXRvZmYgPSBuZXcgRGF0ZSgpXG4gICAgY3V0b2ZmLnNldERhdGUoY3V0b2ZmLmdldERhdGUoKSArIDMwKjMpXG4gICAgcmV0dXJuIGN1dG9mZi50b0lTT1N0cmluZygpXG5cbiAgIyBHZXRzIGxpc3Qgb2YgY2FjaGVkIHNvdXJjZSBjb2RlcyBpbiBmb3JtIHsgY29kZTo8Y29kZT4sIGV4cGlyeTo8ZXhwaXJ5IGluIElTTyBkYXRldGltZT4gfVxuICBnZXRMb2NhbENvZGVzOiAtPlxuICAgIHJldHVybiBbXSAgdW5sZXNzIGxvY2FsU3RvcmFnZS5nZXRJdGVtKFwic291cmNlQ29kZXNcIilcbiAgICBKU09OLnBhcnNlIGxvY2FsU3RvcmFnZS5nZXRJdGVtKFwic291cmNlQ29kZXNcIilcbiAgXG4gICMgU2V0cyBsaXN0IG9mIGNhY2hlZCBzb3VyY2UgY29kZXMgaW4gZm9ybSB7IGNvZGU6PGNvZGU+LCBleHBpcnk6PGV4cGlyeSBpbiBJU08gZGF0ZXRpbWU+IH1cbiAgc2V0TG9jYWxDb2RlczogKGNvZGVzKSAtPlxuICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtIFwic291cmNlQ29kZXNcIiwgSlNPTi5zdHJpbmdpZnkoY29kZXMpXG4gIFxuICAjIFB1cmdlIGV4cGlyZWQgY29kZVxuICBwdXJnZUNvZGVzOiAoY3V0b2ZmKSAtPlxuICAgIEBzZXRMb2NhbENvZGVzIF8ucmVqZWN0KEBnZXRMb2NhbENvZGVzKCksIChpdGVtKSAtPlxuICAgICAgaXRlbS5leHBpcnkgPCBjdXRvZmZcbiAgICApXG4gIFxuICAjIFJlcGxlbmlzaCBjb2RlcyBmcm9tIHNlcnZlciB0byBoYXZlIGEgbWluaW11bSBvZiB4IGF2YWlsYWJsZVxuICByZXBsZW5pc2hDb2RlczogKG1pbk51bWJlciwgc3VjY2VzcywgZXJyb3IsIGN1dG9mZikgLT5cbiAgICBjdXRvZmYgPSBjdXRvZmYgb3IgZGVmYXVsdEN1dG9mZigpXG4gICAgXG4gICAgIyBQdXJnZSBvbGQgY29kZXNcbiAgICBAcHVyZ2VDb2RlcyBjdXRvZmZcbiAgICBcbiAgICAjIERldGVybWluZSBob3cgbWFueSBhcmUgbmVlZGVkXG4gICAgbnVtTmVlZGVkID0gbWluTnVtYmVyIC0gQGdldExvY2FsQ29kZXMoKS5sZW5ndGhcbiAgICBcbiAgICAjIElmIGhhdmUgZW5vdWdoXG4gICAgaWYgbnVtTmVlZGVkIDw9IDBcbiAgICAgIHN1Y2Nlc3MoKVxuICAgICAgcmV0dXJuXG4gICAgXG4gICAgIyBSZXF1ZXN0IG5ldyBjb2Rlc1xuICAgIHJlcSA9ICQuYWpheChAdXJsLCB7XG4gICAgICBkYXRhIDogSlNPTi5zdHJpbmdpZnkoeyBudW1iZXI6IG51bU5lZWRlZCB9KSxcbiAgICAgIGNvbnRlbnRUeXBlIDogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgdHlwZSA6ICdQT1NUJ30pXG4gICAgcmVxLmRvbmUgKGRhdGEsIHRleHRTdGF0dXMsIGpxWEhSKSA9PlxuICAgICAgIyBBZGQgdG8gbG9jYWwgc3RvcmFnZVxuICAgICAgQHNldExvY2FsQ29kZXMgQGdldExvY2FsQ29kZXMoKS5jb25jYXQoZGF0YSlcbiAgICAgIHN1Y2Nlc3MoKVxuICAgIHJlcS5mYWlsIChqcVhIUiwgdGV4dFN0YXR1cywgZXJyb3JUaHJvd24pID0+XG4gICAgICBpZiBlcnJvclxuICAgICAgICBlcnJvcihlcnJvclRocm93bilcblxuICBnZXROdW1iZXJBdmFpbGFibGVDb2RlczogKGN1dG9mZikgLT5cbiAgICBjdXRvZmYgPSBjdXRvZmYgb3IgZGVmYXVsdEN1dG9mZigpXG4gICAgQHB1cmdlQ29kZXMgY3V0b2ZmXG4gICAgQGdldExvY2FsQ29kZXMoKS5sZW5ndGhcblxuICByZXF1ZXN0Q29kZTogKHN1Y2Nlc3MsIGVycm9yLCBjdXRvZmYpIC0+XG4gICAgIyBSZXBsZW5pc2ggY29kZXMgdG8gaGF2ZSBhdCBsZWFzdCBvbmVcbiAgICBAcmVwbGVuaXNoQ29kZXMgMSwgKD0+XG4gICAgICBjb2RlcyA9IEBnZXRMb2NhbENvZGVzKClcbiAgICAgIFxuICAgICAgIyBSZW1vdmUgZmlyc3QgY29kZVxuICAgICAgQHNldExvY2FsQ29kZXMgXy5yZXN0KGNvZGVzKVxuICAgICAgc3VjY2VzcyBfLmZpcnN0KGNvZGVzKS5jb2RlXG4gICAgKSwgZXJyb3IsIGN1dG9mZlxuXG4gIFxuICAjIFJlc2V0IGFsbCBjb2RlcyBjYWNoZWRcbiAgcmVzZXQ6IC0+XG4gICAgQHNldExvY2FsQ29kZXMgW11cblxuIyBGYWtlIHNvdXJjZSBjb2RlcyBtYW5hZ2VyIHRoYXQgcmV0dXJucyB2YWxpZCwgYnV0IG5vbi11bmlxdWUgY29kZXNcbmV4cG9ydHMuRGVtb1NvdXJjZUNvZGVzTWFuYWdlciA9IGNsYXNzIERlbW9Tb3VyY2VDb2Rlc01hbmFnZXJcbiAgY29uc3RydWN0b3I6IC0+XG4gICAgQG51bUF2YWlsID0gMTBcblxuICBnZXROdW1iZXJBdmFpbGFibGVDb2RlczogKGN1dG9mZikgLT5cbiAgICByZXR1cm4gQG51bUF2YWlsXG5cbiAgcmVxdWVzdENvZGU6IChzdWNjZXNzLCBlcnJvciwgY3V0b2ZmKSAtPlxuICAgIHN1Y2Nlc3MoZXhwb3J0cy5zZXFUb0NvZGUoTWF0aC5yb3VuZChNYXRoLnJhbmRvbSgpKjEwMDAwMDApKSlcblxuICByZXBsZW5pc2hDb2RlczogKG1pbk51bWJlciwgc3VjY2VzcywgZXJyb3IsIGN1dG9mZikgLT5cbiAgICBAbnVtQXZhaWwgPSBtaW5OdW1iZXJcbiAgICBzdWNjZXNzKClcbiIsIiMgT2JqZWN0cyB0aGF0IGhlbHAgd2l0aCBzeW5jaHJvbml6aW5nIHdpdGggdGhlIHNlcnZlclxuXG4jIENsYXNzIHdoaWNoIHJlcGVhdHMgYW4gb3BlcmF0aW9uIGV2ZXJ5IG4gbXMgb3Igd2hlbiBjYWxsZWRcbiMgUHV0cyBtdXRleCBvbiBhY3Rpb25cbmV4cG9ydHMuUmVwZWF0ZXIgPSBjbGFzcyBSZXBlYXRlciBcbiAgY29uc3RydWN0b3I6IChhY3Rpb24pIC0+XG4gICAgQGFjdGlvbiA9IGFjdGlvblxuICAgIEBydW5uaW5nID0gZmFsc2VcbiAgICBAaW5wcm9ncmVzcyA9IGZhbHNlXG5cbiAgc3RhcnQ6IChldmVyeSkgLT5cbiAgICBAZXZlcnkgPSBldmVyeVxuICAgIEBydW5uaW5nID0gdHJ1ZVxuICAgIHNldFRpbWVvdXQgQHBlcmZvcm1SZXBlYXQsIGV2ZXJ5XG5cbiAgc3RvcDogLT5cbiAgICBAcnVubmluZyA9IGZhbHNlXG5cbiAgcGVyZm9ybVJlcGVhdDogPT5cbiAgICBpZiBub3QgQHJ1bm5pbmdcbiAgICAgIHJldHVyblxuXG4gICAgc3VjY2VzcyA9ID0+XG4gICAgICBAaW5wcm9ncmVzcyA9IGZhbHNlXG4gICAgICBpZiBAcnVubmluZ1xuICAgICAgICBzZXRUaW1lb3V0IEBwZXJmb3JtUmVwZWF0LCBAZXZlcnlcbiAgICAgIEBsYXN0U3VjY2Vzc0RhdGUgPSBuZXcgRGF0ZSgpXG4gICAgICBAbGFzdEVycm9yID0gdW5kZWZpbmVkXG5cbiAgICBlcnJvciA9IChlcnIpID0+XG4gICAgICBAaW5wcm9ncmVzcyA9IGZhbHNlXG4gICAgICBpZiBAcnVubmluZ1xuICAgICAgICBzZXRUaW1lb3V0IEBwZXJmb3JtUmVwZWF0LCBAZXZlcnlcbiAgICAgIEBsYXN0RXJyb3IgPSBlcnJcblxuICAgIEBpbnByb2dyZXNzID0gdHJ1ZVxuICAgIEBhY3Rpb24oc3VjY2VzcywgZXJyb3IpXG5cbiAgcGVyZm9ybTogKHN1Y2Nlc3MsIGVycm9yKSAtPlxuICAgIHN1Y2Nlc3MyID0gPT5cbiAgICAgIEBpbnByb2dyZXNzID0gZmFsc2VcbiAgICAgIEBsYXN0U3VjY2Vzc0RhdGUgPSBuZXcgRGF0ZSgpXG4gICAgICBAbGFzdEVycm9yID0gdW5kZWZpbmVkXG4gICAgICBzdWNjZXNzKCkgaWYgc3VjY2Vzcz9cblxuICAgIGVycm9yMiA9IChlcnIpID0+XG4gICAgICBAaW5wcm9ncmVzcyA9IGZhbHNlXG4gICAgICBAbGFzdEVycm9yID0gZXJyXG4gICAgICBlcnJvcihlcnIpIGlmIGVycm9yP1xuXG4gICAgQGlucHJvZ3Jlc3MgPSB0cnVlXG4gICAgQGFjdGlvbihzdWNjZXNzMiwgZXJyb3IyKVxuXG5cblxuICIsIlxuIyBBdXRob3JpemF0aW9uIGNsYXNzZXMgYWxsIGZvbGxvdyBzYW1lIHBhdHRlcm4uXG4jIGRvYyBjYW4gYmUgdW5kZWZpbmVkIGluIHVwZGF0ZSBhbmQgcmVtb3ZlOiBhdXRob3JpemVzIHdoZXRoZXIgZXZlciBwb3NzaWJsZS5cblxuZXhwb3J0cy5BbGxBdXRoID0gY2xhc3MgQWxsQXV0aFxuICBpbnNlcnQ6IChjb2wpIC0+XG4gICAgcmV0dXJuIHRydWVcblxuICB1cGRhdGU6IChjb2wsIGRvYykgLT5cbiAgICByZXR1cm4gdHJ1ZVxuXG4gIHJlbW92ZTogKGNvbCwgZG9jKSAtPlxuICAgIHJldHVybiB0cnVlXG4gICAgXG5leHBvcnRzLk5vbmVBdXRoID0gY2xhc3MgTm9uZUF1dGhcbiAgaW5zZXJ0OiAoY29sKSAtPlxuICAgIHJldHVybiBmYWxzZVxuXG4gIHVwZGF0ZTogKGNvbCwgZG9jKSAtPlxuICAgIHJldHVybiBmYWxzZVxuXG4gIHJlbW92ZTogKGNvbCwgZG9jKSAtPlxuICAgIHJldHVybiBmYWxzZVxuXG5leHBvcnRzLlVzZXJBdXRoID0gY2xhc3MgVXNlckF1dGhcbiAgIyB1c2VyIGlzIHVzZXJuYW1lLCBvcmcgaXMgb3JnIGNvZGVcbiAgY29uc3RydWN0b3I6ICh1c2VyLCBvcmcpIC0+XG4gICAgQHVzZXIgPSB1c2VyXG4gICAgQG9yZyA9IG9yZ1xuXG4gICAgQGVkaXRhYmxlQ29scyA9IFsnc291cmNlcycsICdzb3VyY2Vfbm90ZXMnLCAndGVzdHMnLCAncmVzcG9uc2VzJ11cblxuICBpbnNlcnQ6IChjb2wpIC0+XG4gICAgaWYgbm90IChjb2wgaW4gQGVkaXRhYmxlQ29scylcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIHJldHVybiB0cnVlXG5cbiAgdXBkYXRlOiAoY29sLCBkb2MpIC0+XG4gICAgaWYgbm90IChjb2wgaW4gQGVkaXRhYmxlQ29scylcbiAgICAgIHJldHVybiBmYWxzZVxuXG4gICAgaWYgbm90IGRvY1xuICAgICAgcmV0dXJuIHRydWVcblxuICAgIGlmIGRvYy5vcmcgYW5kIEBvcmdcbiAgICAgIHJldHVybiBkb2MudXNlciA9PSBAdXNlciB8fCBkb2Mub3JnID09IEBvcmdcbiAgICBlbHNlXG4gICAgICByZXR1cm4gZG9jLnVzZXIgPT0gQHVzZXJcblxuICByZW1vdmU6IChjb2wsIGRvYykgLT5cbiAgICBpZiBub3QgKGNvbCBpbiBAZWRpdGFibGVDb2xzKVxuICAgICAgcmV0dXJuIGZhbHNlXG5cbiAgICBpZiBub3QgZG9jXG4gICAgICByZXR1cm4gdHJ1ZVxuXG4gICAgaWYgZG9jLm9yZyBhbmQgQG9yZ1xuICAgICAgcmV0dXJuIGRvYy51c2VyID09IEB1c2VyIHx8IGRvYy5vcmcgPT0gQG9yZ1xuICAgIGVsc2VcbiAgICAgIHJldHVybiBkb2MudXNlciA9PSBAdXNlclxuXG5cbiAgICAiLCJjbGFzcyBKc29uU2VydmVyXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgIEBtYXAgPSB7fVxuICAgIEBzZXJ2ZXIgPSBzaW5vbi5mYWtlU2VydmVyLmNyZWF0ZSgpXG4gICAgQHNlcnZlci5hdXRvUmVzcG9uZCA9IHRydWVcbiAgICBAc2VydmVyLnJlc3BvbmRXaXRoKEBoYW5kbGUpXG4gICAgXG4gIGhhbmRsZTogKHJlcXVlc3QpID0+XG4gICAgIyBQYXJzZSBib2R5XG4gICAgcmVxdWVzdC5wYXJhbXMgPSBKU09OLnBhcnNlKHJlcXVlc3QucmVxdWVzdEJvZHkpXG4gICAgXG4gICAgIyBHZXQgZGF0YVxuICAgIGl0ZW0gPSBAbWFwW3JlcXVlc3QubWV0aG9kK1wiOlwiK3JlcXVlc3QudXJsXVxuICAgIGNvbnNvbGUubG9nIHJlcXVlc3QubWV0aG9kK1wiOlwiK3JlcXVlc3QudXJsXG4gICAgaWYgaXRlbVxuICAgICAgZGF0YSA9IGl0ZW0ocmVxdWVzdClcbiAgICAgIGNvbnNvbGUubG9nIGRhdGFcbiAgICAgIHJlcXVlc3QucmVzcG9uZCgyMDAsIHsgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIgfSwgSlNPTi5zdHJpbmdpZnkoZGF0YSkpXG4gICAgICByZXR1cm5cbiAgICBjb25zb2xlLmxvZyBcIjQwNFwiXG4gICAgcmVxdWVzdC5yZXNwb25kKDQwNClcbiAgICBcbiAgcmVzcG9uZDogKG1ldGhvZCwgdXJsLCBmdW5jKSA9PlxuICAgIEBtYXBbbWV0aG9kK1wiOlwiK3VybF0gPSBmdW5jXG4gICAgXG4gIHRlYXJkb3duOiAtPlxuICAgIEBzZXJ2ZXIucmVzdG9yZSgpXG5cbiN3aW5kb3cuSnNvblNlcnZlciA9IEpzb25TZXJ2ZXJcbm1vZHVsZS5leHBvcnRzID0gSnNvblNlcnZlciIsIm1vZHVsZS5leHBvcnRzID0gY2xhc3MgUmVtb3RlRGJcbiAgIyBVcmwgbXVzdCBoYXZlIHRyYWlsaW5nIC9cbiAgY29uc3RydWN0b3I6ICh1cmwsIGNsaWVudCkgLT5cbiAgICBAdXJsID0gdXJsXG4gICAgQGNsaWVudCA9IGNsaWVudFxuICAgIEBjb2xsZWN0aW9ucyA9IHt9XG5cbiAgYWRkQ29sbGVjdGlvbjogKG5hbWUpIC0+XG4gICAgY29sbGVjdGlvbiA9IG5ldyBDb2xsZWN0aW9uKG5hbWUsIEB1cmwgKyBuYW1lLCBAY2xpZW50KVxuICAgIEBbbmFtZV0gPSBjb2xsZWN0aW9uXG4gICAgQGNvbGxlY3Rpb25zW25hbWVdID0gY29sbGVjdGlvblxuXG4gIHJlbW92ZUNvbGxlY3Rpb246IChuYW1lKSAtPlxuICAgIGRlbGV0ZSBAW25hbWVdXG4gICAgZGVsZXRlIEBjb2xsZWN0aW9uc1tuYW1lXVxuXG4jIFJlbW90ZSBjb2xsZWN0aW9uIG9uIHNlcnZlclxuY2xhc3MgQ29sbGVjdGlvblxuICBjb25zdHJ1Y3RvcjogKG5hbWUsIHVybCwgY2xpZW50KSAtPlxuICAgIEBuYW1lID0gbmFtZVxuICAgIEB1cmwgPSB1cmxcbiAgICBAY2xpZW50ID0gY2xpZW50XG5cbiAgZmluZDogKHNlbGVjdG9yLCBvcHRpb25zID0ge30pIC0+XG4gICAgcmV0dXJuIGZldGNoOiAoc3VjY2VzcywgZXJyb3IpID0+XG4gICAgICAjIENyZWF0ZSB1cmxcbiAgICAgIHBhcmFtcyA9IHt9XG4gICAgICBpZiBvcHRpb25zLnNvcnRcbiAgICAgICAgcGFyYW1zLnNvcnQgPSBKU09OLnN0cmluZ2lmeShvcHRpb25zLnNvcnQpXG4gICAgICBpZiBvcHRpb25zLmxpbWl0XG4gICAgICAgIHBhcmFtcy5saW1pdCA9IG9wdGlvbnMubGltaXRcbiAgICAgIGlmIG9wdGlvbnMuZmllbGRzXG4gICAgICAgIHBhcmFtcy5maWVsZHMgPSBKU09OLnN0cmluZ2lmeShvcHRpb25zLmZpZWxkcylcbiAgICAgIGlmIEBjbGllbnRcbiAgICAgICAgcGFyYW1zLmNsaWVudCA9IEBjbGllbnRcbiAgICAgIHBhcmFtcy5zZWxlY3RvciA9IEpTT04uc3RyaW5naWZ5KHNlbGVjdG9yIHx8IHt9KVxuXG4gICAgICByZXEgPSAkLmdldEpTT04oQHVybCwgcGFyYW1zKVxuICAgICAgcmVxLmRvbmUgKGRhdGEsIHRleHRTdGF0dXMsIGpxWEhSKSA9PlxuICAgICAgICBzdWNjZXNzKGRhdGEpXG4gICAgICByZXEuZmFpbCAoanFYSFIsIHRleHRTdGF0dXMsIGVycm9yVGhyb3duKSA9PlxuICAgICAgICBpZiBlcnJvclxuICAgICAgICAgIGVycm9yKGVycm9yVGhyb3duKVxuXG4gIGZpbmRPbmU6IChzZWxlY3Rvciwgb3B0aW9ucyA9IHt9LCBzdWNjZXNzLCBlcnJvcikgLT5cbiAgICBpZiBfLmlzRnVuY3Rpb24ob3B0aW9ucykgXG4gICAgICBbb3B0aW9ucywgc3VjY2VzcywgZXJyb3JdID0gW3t9LCBvcHRpb25zLCBzdWNjZXNzXVxuXG4gICAgIyBDcmVhdGUgdXJsXG4gICAgcGFyYW1zID0ge31cbiAgICBpZiBvcHRpb25zLnNvcnRcbiAgICAgIHBhcmFtcy5zb3J0ID0gSlNPTi5zdHJpbmdpZnkob3B0aW9ucy5zb3J0KVxuICAgIHBhcmFtcy5saW1pdCA9IDFcbiAgICBpZiBAY2xpZW50XG4gICAgICBwYXJhbXMuY2xpZW50ID0gQGNsaWVudFxuICAgIHBhcmFtcy5zZWxlY3RvciA9IEpTT04uc3RyaW5naWZ5KHNlbGVjdG9yIHx8IHt9KVxuXG4gICAgcmVxID0gJC5nZXRKU09OKEB1cmwsIHBhcmFtcylcbiAgICByZXEuZG9uZSAoZGF0YSwgdGV4dFN0YXR1cywganFYSFIpID0+XG4gICAgICBzdWNjZXNzKGRhdGFbMF0gfHwgbnVsbClcbiAgICByZXEuZmFpbCAoanFYSFIsIHRleHRTdGF0dXMsIGVycm9yVGhyb3duKSA9PlxuICAgICAgaWYgZXJyb3JcbiAgICAgICAgZXJyb3IoZXJyb3JUaHJvd24pXG5cbiAgdXBzZXJ0OiAoZG9jLCBzdWNjZXNzLCBlcnJvcikgLT5cbiAgICBpZiBub3QgQGNsaWVudFxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2xpZW50IHJlcXVpcmVkIHRvIHVwc2VydFwiKVxuXG4gICAgaWYgbm90IGRvYy5faWRcbiAgICAgIGRvYy5faWQgPSBjcmVhdGVVaWQoKVxuXG4gICAgcmVxID0gJC5hamF4KEB1cmwgKyBcIj9jbGllbnQ9XCIgKyBAY2xpZW50LCB7XG4gICAgICBkYXRhIDogSlNPTi5zdHJpbmdpZnkoZG9jKSxcbiAgICAgIGNvbnRlbnRUeXBlIDogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgdHlwZSA6ICdQT1NUJ30pXG4gICAgcmVxLmRvbmUgKGRhdGEsIHRleHRTdGF0dXMsIGpxWEhSKSA9PlxuICAgICAgc3VjY2VzcyhkYXRhIHx8IG51bGwpXG4gICAgcmVxLmZhaWwgKGpxWEhSLCB0ZXh0U3RhdHVzLCBlcnJvclRocm93bikgPT5cbiAgICAgIGlmIGVycm9yXG4gICAgICAgIGVycm9yKGVycm9yVGhyb3duKVxuXG4gIHJlbW92ZTogKGlkLCBzdWNjZXNzLCBlcnJvcikgLT5cbiAgICBpZiBub3QgQGNsaWVudFxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2xpZW50IHJlcXVpcmVkIHRvIHJlbW92ZVwiKVxuICAgICAgXG4gICAgcmVxID0gJC5hamF4KEB1cmwgKyBcIi9cIiArIGlkICsgXCI/Y2xpZW50PVwiICsgQGNsaWVudCwgeyB0eXBlIDogJ0RFTEVURSd9KVxuICAgIHJlcS5kb25lIChkYXRhLCB0ZXh0U3RhdHVzLCBqcVhIUikgPT5cbiAgICAgIHN1Y2Nlc3MoKVxuICAgIHJlcS5mYWlsIChqcVhIUiwgdGV4dFN0YXR1cywgZXJyb3JUaHJvd24pID0+XG4gICAgICBpZiBqcVhIUi5zdGF0dXMgPT0gNDA0XG4gICAgICAgIHN1Y2Nlc3MoKVxuICAgICAgZWxzZSBpZiBlcnJvclxuICAgICAgICBlcnJvcihlcnJvclRocm93bilcblxuXG5jcmVhdGVVaWQgPSAtPiBcbiAgJ3h4eHh4eHh4eHh4eDR4eHh5eHh4eHh4eHh4eHh4eHh4Jy5yZXBsYWNlKC9beHldL2csIChjKSAtPlxuICAgIHIgPSBNYXRoLnJhbmRvbSgpKjE2fDBcbiAgICB2ID0gaWYgYyA9PSAneCcgdGhlbiByIGVsc2UgKHImMHgzfDB4OClcbiAgICByZXR1cm4gdi50b1N0cmluZygxNilcbiAgICkiLCJMb2NhdGlvbkZpbmRlciA9IHJlcXVpcmUgJy4vTG9jYXRpb25GaW5kZXInXG5HZW9KU09OID0gcmVxdWlyZSAnLi9HZW9KU09OJ1xuXG4jIFNob3dzIHRoZSByZWxhdGl2ZSBsb2NhdGlvbiBvZiBhIHBvaW50IGFuZCBhbGxvd3Mgc2V0dGluZyBpdFxuIyBGaXJlcyBldmVudHMgbG9jYXRpb25zZXQsIG1hcCwgYm90aCB3aXRoIFxuIyBvcHRpb25zIHJlYWRvbmx5IG1ha2VzIGl0IG5vbi1lZGl0YWJsZVxuY2xhc3MgTG9jYXRpb25WaWV3IGV4dGVuZHMgQmFja2JvbmUuVmlld1xuICBjb25zdHJ1Y3RvcjogKG9wdGlvbnMpIC0+XG4gICAgc3VwZXIoKVxuICAgIEBsb2MgPSBvcHRpb25zLmxvY1xuICAgIEByZWFkb25seSA9IG9wdGlvbnMucmVhZG9ubHlcbiAgICBAc2V0dGluZ0xvY2F0aW9uID0gZmFsc2VcbiAgICBAbG9jYXRpb25GaW5kZXIgPSBvcHRpb25zLmxvY2F0aW9uRmluZGVyIHx8IG5ldyBMb2NhdGlvbkZpbmRlcigpXG5cbiAgICAjIExpc3RlbiB0byBsb2NhdGlvbiBldmVudHNcbiAgICBAbGlzdGVuVG8oQGxvY2F0aW9uRmluZGVyLCAnZm91bmQnLCBAbG9jYXRpb25Gb3VuZClcbiAgICBAbGlzdGVuVG8oQGxvY2F0aW9uRmluZGVyLCAnZXJyb3InLCBAbG9jYXRpb25FcnJvcilcblxuICAgICMgU3RhcnQgdHJhY2tpbmcgbG9jYXRpb24gaWYgc2V0XG4gICAgaWYgQGxvY1xuICAgICAgQGxvY2F0aW9uRmluZGVyLnN0YXJ0V2F0Y2goKVxuXG4gICAgQHJlbmRlcigpXG5cbiAgZXZlbnRzOlxuICAgICdjbGljayAjbG9jYXRpb25fbWFwJyA6ICdtYXBDbGlja2VkJ1xuICAgICdjbGljayAjbG9jYXRpb25fc2V0JyA6ICdzZXRMb2NhdGlvbidcblxuICByZW1vdmU6IC0+XG4gICAgQGxvY2F0aW9uRmluZGVyLnN0b3BXYXRjaCgpXG4gICAgc3VwZXIoKVxuXG4gIHJlbmRlcjogLT5cbiAgICBAJGVsLmh0bWwgdGVtcGxhdGVzWydMb2NhdGlvblZpZXcnXSgpXG5cbiAgICAjIFNldCBsb2NhdGlvbiBzdHJpbmdcbiAgICBpZiBAZXJyb3JGaW5kaW5nTG9jYXRpb25cbiAgICAgIEAkKFwiI2xvY2F0aW9uX3JlbGF0aXZlXCIpLnRleHQoXCJDYW5ub3QgZmluZCBsb2NhdGlvblwiKVxuICAgIGVsc2UgaWYgbm90IEBsb2MgYW5kIG5vdCBAc2V0dGluZ0xvY2F0aW9uIFxuICAgICAgQCQoXCIjbG9jYXRpb25fcmVsYXRpdmVcIikudGV4dChcIlVuc3BlY2lmaWVkIGxvY2F0aW9uXCIpXG4gICAgZWxzZSBpZiBAc2V0dGluZ0xvY2F0aW9uXG4gICAgICBAJChcIiNsb2NhdGlvbl9yZWxhdGl2ZVwiKS50ZXh0KFwiU2V0dGluZyBsb2NhdGlvbi4uLlwiKVxuICAgIGVsc2UgaWYgbm90IEBjdXJyZW50TG9jXG4gICAgICBAJChcIiNsb2NhdGlvbl9yZWxhdGl2ZVwiKS50ZXh0KFwiV2FpdGluZyBmb3IgR1BTLi4uXCIpXG4gICAgZWxzZVxuICAgICAgQCQoXCIjbG9jYXRpb25fcmVsYXRpdmVcIikudGV4dChHZW9KU09OLmdldFJlbGF0aXZlTG9jYXRpb24oQGN1cnJlbnRMb2MsIEBsb2MpKVxuXG4gICAgIyBEaXNhYmxlIG1hcCBpZiBsb2NhdGlvbiBub3Qgc2V0XG4gICAgQCQoXCIjbG9jYXRpb25fbWFwXCIpLmF0dHIoXCJkaXNhYmxlZFwiLCBub3QgQGxvYyk7XG5cbiAgICAjIERpc2FibGUgc2V0IGlmIHNldHRpbmcgb3IgcmVhZG9ubHlcbiAgICBAJChcIiNsb2NhdGlvbl9zZXRcIikuYXR0cihcImRpc2FibGVkXCIsIEBzZXR0aW5nTG9jYXRpb24gfHwgQHJlYWRvbmx5KTsgICAgXG5cbiAgc2V0TG9jYXRpb246IC0+XG4gICAgQHNldHRpbmdMb2NhdGlvbiA9IHRydWVcbiAgICBAZXJyb3JGaW5kaW5nTG9jYXRpb24gPSBmYWxzZVxuICAgIEBsb2NhdGlvbkZpbmRlci5zdGFydFdhdGNoKClcbiAgICBAcmVuZGVyKClcblxuICBsb2NhdGlvbkZvdW5kOiAocG9zKSA9PlxuICAgIGlmIEBzZXR0aW5nTG9jYXRpb25cbiAgICAgIEBzZXR0aW5nTG9jYXRpb24gPSBmYWxzZVxuICAgICAgQGVycm9yRmluZGluZ0xvY2F0aW9uID0gZmFsc2VcblxuICAgICAgIyBTZXQgbG9jYXRpb25cbiAgICAgIEBsb2MgPSBHZW9KU09OLnBvc1RvUG9pbnQocG9zKVxuICAgICAgQHRyaWdnZXIoJ2xvY2F0aW9uc2V0JywgQGxvYylcblxuICAgIEBjdXJyZW50TG9jID0gR2VvSlNPTi5wb3NUb1BvaW50KHBvcylcbiAgICBAcmVuZGVyKClcblxuICBsb2NhdGlvbkVycm9yOiA9PlxuICAgIEBzZXR0aW5nTG9jYXRpb24gPSBmYWxzZVxuICAgIEBlcnJvckZpbmRpbmdMb2NhdGlvbiA9IHRydWVcbiAgICBAcmVuZGVyKClcblxuICBtYXBDbGlja2VkOiA9PlxuICAgIEB0cmlnZ2VyKCdtYXAnLCBAbG9jKVxuXG5cbm1vZHVsZS5leHBvcnRzID0gTG9jYXRpb25WaWV3IiwiUGFnZSA9IHJlcXVpcmUgXCIuLi9QYWdlXCJcblxuIyBEaXNwbGF5cyBhbiBpbWFnZS4gT3B0aW9uczogdWlkOiB1aWQgb2YgaW1hZ2Vcbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgSW1hZ2VQYWdlIGV4dGVuZHMgUGFnZVxuICBjcmVhdGU6IC0+XG4gICAgQCRlbC5odG1sIHRlbXBsYXRlc1sncGFnZXMvSW1hZ2VQYWdlJ10oKVxuXG4gICAgIyBHZXQgaW1hZ2UgdXJsXG4gICAgQGltYWdlTWFuYWdlci5nZXRJbWFnZVVybChAb3B0aW9ucy5pZCwgKHVybCkgPT5cbiAgICAgIEAkKFwiI21lc3NhZ2VfYmFyXCIpLmhpZGUoKVxuICAgICAgQCQoXCIjaW1hZ2VcIikuYXR0cihcInNyY1wiLCB1cmwpLnNob3coKVxuICAgICwgQGVycm9yKVxuXG4gIGFjdGl2YXRlOiAtPlxuICAgIEBzZXRUaXRsZSBcIkltYWdlXCJcblxuICAgICMgSWYgcmVtb3ZlIGFsbG93ZWQsIHNldCBpbiBidXR0b24gYmFyXG4gICAgaWYgQG9wdGlvbnMub25SZW1vdmVcbiAgICAgIEBzZXR1cEJ1dHRvbkJhciBbXG4gICAgICAgIHsgaWNvbjogXCJkZWxldGUucG5nXCIsIGNsaWNrOiA9PiBAcmVtb3ZlUGhvdG8oKSB9XG4gICAgICBdXG4gICAgZWxzZVxuICAgICAgQHNldHVwQnV0dG9uQmFyIFtdXG5cbiAgcmVtb3ZlUGhvdG86IC0+XG4gICAgaWYgY29uZmlybShcIlJlbW92ZSBpbWFnZT9cIilcbiAgICAgIEBvcHRpb25zLm9uUmVtb3ZlKClcbiAgICAgIEBwYWdlci5jbG9zZVBhZ2UoKVxuIiwiY3JlYXRlVWlkID0gcmVxdWlyZSgnLi91dGlscycpLmNyZWF0ZVVpZFxucHJvY2Vzc0ZpbmQgPSByZXF1aXJlKCcuL3V0aWxzJykucHJvY2Vzc0ZpbmRcbmNvbXBpbGVTb3J0ID0gcmVxdWlyZSgnLi9zZWxlY3RvcicpLmNvbXBpbGVTb3J0XG5cbmNsYXNzIExvY2FsRGJcbiAgY29uc3RydWN0b3I6IChvcHRpb25zKSAtPlxuICAgIEBjb2xsZWN0aW9ucyA9IHt9XG5cbiAgICBpZiBvcHRpb25zIGFuZCBvcHRpb25zLm5hbWVzcGFjZSBhbmQgd2luZG93LmxvY2FsU3RvcmFnZVxuICAgICAgQG5hbWVzcGFjZSA9IG9wdGlvbnMubmFtZXNwYWNlXG5cbiAgYWRkQ29sbGVjdGlvbjogKG5hbWUpIC0+XG4gICAgIyBTZXQgbmFtZXNwYWNlIGZvciBjb2xsZWN0aW9uXG4gICAgbmFtZXNwYWNlID0gQG5hbWVzcGFjZStcIi5cIituYW1lIGlmIEBuYW1lc3BhY2VcblxuICAgIGNvbGxlY3Rpb24gPSBuZXcgQ29sbGVjdGlvbihuYW1lLCBuYW1lc3BhY2UpXG4gICAgQFtuYW1lXSA9IGNvbGxlY3Rpb25cbiAgICBAY29sbGVjdGlvbnNbbmFtZV0gPSBjb2xsZWN0aW9uXG5cbiAgcmVtb3ZlQ29sbGVjdGlvbjogKG5hbWUpIC0+XG4gICAgaWYgQG5hbWVzcGFjZSBhbmQgd2luZG93LmxvY2FsU3RvcmFnZVxuICAgICAga2V5cyA9IFtdXG4gICAgICBmb3IgaSBpbiBbMC4uLmxvY2FsU3RvcmFnZS5sZW5ndGhdXG4gICAgICAgIGtleXMucHVzaChsb2NhbFN0b3JhZ2Uua2V5KGkpKVxuXG4gICAgICBmb3Iga2V5IGluIGtleXNcbiAgICAgICAgaWYga2V5LnN1YnN0cmluZygwLCBAbmFtZXNwYWNlLmxlbmd0aCArIDEpID09IEBuYW1lc3BhY2UgKyBcIi5cIlxuICAgICAgICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKGtleSlcblxuICAgIGRlbGV0ZSBAW25hbWVdXG4gICAgZGVsZXRlIEBjb2xsZWN0aW9uc1tuYW1lXVxuXG5cbiMgU3RvcmVzIGRhdGEgaW4gbWVtb3J5LCBvcHRpb25hbGx5IGJhY2tlZCBieSBsb2NhbCBzdG9yYWdlXG5jbGFzcyBDb2xsZWN0aW9uXG4gIGNvbnN0cnVjdG9yOiAobmFtZSwgbmFtZXNwYWNlKSAtPlxuICAgIEBuYW1lID0gbmFtZVxuICAgIEBuYW1lc3BhY2UgPSBuYW1lc3BhY2VcblxuICAgIEBpdGVtcyA9IHt9XG4gICAgQHVwc2VydHMgPSB7fSAgIyBQZW5kaW5nIHVwc2VydHMgYnkgX2lkLiBTdGlsbCBpbiBpdGVtc1xuICAgIEByZW1vdmVzID0ge30gICMgUGVuZGluZyByZW1vdmVzIGJ5IF9pZC4gTm8gbG9uZ2VyIGluIGl0ZW1zXG5cbiAgICAjIFJlYWQgZnJvbSBsb2NhbCBzdG9yYWdlXG4gICAgaWYgd2luZG93LmxvY2FsU3RvcmFnZSBhbmQgbmFtZXNwYWNlP1xuICAgICAgQGxvYWRTdG9yYWdlKClcblxuICBsb2FkU3RvcmFnZTogLT5cbiAgICAjIFJlYWQgaXRlbXMgZnJvbSBsb2NhbFN0b3JhZ2VcbiAgICBAaXRlbU5hbWVzcGFjZSA9IEBuYW1lc3BhY2UgKyBcIl9cIlxuXG4gICAgZm9yIGkgaW4gWzAuLi5sb2NhbFN0b3JhZ2UubGVuZ3RoXVxuICAgICAga2V5ID0gbG9jYWxTdG9yYWdlLmtleShpKVxuICAgICAgaWYga2V5LnN1YnN0cmluZygwLCBAaXRlbU5hbWVzcGFjZS5sZW5ndGgpID09IEBpdGVtTmFtZXNwYWNlXG4gICAgICAgIGl0ZW0gPSBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZVtrZXldKVxuICAgICAgICBAaXRlbXNbaXRlbS5faWRdID0gaXRlbVxuXG4gICAgIyBSZWFkIHVwc2VydHNcbiAgICB1cHNlcnRLZXlzID0gaWYgbG9jYWxTdG9yYWdlW0BuYW1lc3BhY2UrXCJ1cHNlcnRzXCJdIHRoZW4gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2VbQG5hbWVzcGFjZStcInVwc2VydHNcIl0pIGVsc2UgW11cbiAgICBmb3Iga2V5IGluIHVwc2VydEtleXNcbiAgICAgIEB1cHNlcnRzW2tleV0gPSBAaXRlbXNba2V5XVxuXG4gICAgIyBSZWFkIHJlbW92ZXNcbiAgICByZW1vdmVJdGVtcyA9IGlmIGxvY2FsU3RvcmFnZVtAbmFtZXNwYWNlK1wicmVtb3Zlc1wiXSB0aGVuIEpTT04ucGFyc2UobG9jYWxTdG9yYWdlW0BuYW1lc3BhY2UrXCJyZW1vdmVzXCJdKSBlbHNlIFtdXG4gICAgQHJlbW92ZXMgPSBfLm9iamVjdChfLnBsdWNrKHJlbW92ZUl0ZW1zLCBcIl9pZFwiKSwgcmVtb3ZlSXRlbXMpXG5cbiAgZmluZDogKHNlbGVjdG9yLCBvcHRpb25zKSAtPlxuICAgIHJldHVybiBmZXRjaDogKHN1Y2Nlc3MsIGVycm9yKSA9PlxuICAgICAgQF9maW5kRmV0Y2goc2VsZWN0b3IsIG9wdGlvbnMsIHN1Y2Nlc3MsIGVycm9yKVxuXG4gIGZpbmRPbmU6IChzZWxlY3Rvciwgb3B0aW9ucywgc3VjY2VzcywgZXJyb3IpIC0+XG4gICAgaWYgXy5pc0Z1bmN0aW9uKG9wdGlvbnMpIFxuICAgICAgW29wdGlvbnMsIHN1Y2Nlc3MsIGVycm9yXSA9IFt7fSwgb3B0aW9ucywgc3VjY2Vzc11cblxuICAgIEBmaW5kKHNlbGVjdG9yLCBvcHRpb25zKS5mZXRjaCAocmVzdWx0cykgLT5cbiAgICAgIGlmIHN1Y2Nlc3M/IHRoZW4gc3VjY2VzcyhpZiByZXN1bHRzLmxlbmd0aD4wIHRoZW4gcmVzdWx0c1swXSBlbHNlIG51bGwpXG4gICAgLCBlcnJvclxuXG4gIF9maW5kRmV0Y2g6IChzZWxlY3Rvciwgb3B0aW9ucywgc3VjY2VzcywgZXJyb3IpIC0+XG4gICAgaWYgc3VjY2Vzcz8gdGhlbiBzdWNjZXNzKHByb2Nlc3NGaW5kKEBpdGVtcywgc2VsZWN0b3IsIG9wdGlvbnMpKVxuXG4gIHVwc2VydDogKGRvYywgc3VjY2VzcywgZXJyb3IpIC0+XG4gICAgaWYgbm90IGRvYy5faWRcbiAgICAgIGRvYy5faWQgPSBjcmVhdGVVaWQoKVxuXG4gICAgIyBSZXBsYWNlL2FkZCBcbiAgICBAX3B1dEl0ZW0oZG9jKVxuICAgIEBfcHV0VXBzZXJ0KGRvYylcblxuICAgIGlmIHN1Y2Nlc3M/IHRoZW4gc3VjY2Vzcyhkb2MpXG5cbiAgcmVtb3ZlOiAoaWQsIHN1Y2Nlc3MsIGVycm9yKSAtPlxuICAgIGlmIF8uaGFzKEBpdGVtcywgaWQpXG4gICAgICBAX3B1dFJlbW92ZShAaXRlbXNbaWRdKVxuICAgICAgQF9kZWxldGVJdGVtKGlkKVxuICAgICAgQF9kZWxldGVVcHNlcnQoaWQpXG5cbiAgICBpZiBzdWNjZXNzPyB0aGVuIHN1Y2Nlc3MoKVxuXG4gIF9wdXRJdGVtOiAoZG9jKSAtPlxuICAgIEBpdGVtc1tkb2MuX2lkXSA9IGRvY1xuICAgIGlmIEBuYW1lc3BhY2VcbiAgICAgIGxvY2FsU3RvcmFnZVtAaXRlbU5hbWVzcGFjZSArIGRvYy5faWRdID0gSlNPTi5zdHJpbmdpZnkoZG9jKVxuXG4gIF9kZWxldGVJdGVtOiAoaWQpIC0+XG4gICAgZGVsZXRlIEBpdGVtc1tpZF1cbiAgICBpZiBAbmFtZXNwYWNlXG4gICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbShAaXRlbU5hbWVzcGFjZSArIGlkKVxuXG4gIF9wdXRVcHNlcnQ6IChkb2MpIC0+XG4gICAgQHVwc2VydHNbZG9jLl9pZF0gPSBkb2NcbiAgICBpZiBAbmFtZXNwYWNlXG4gICAgICBsb2NhbFN0b3JhZ2VbQG5hbWVzcGFjZStcInVwc2VydHNcIl0gPSBKU09OLnN0cmluZ2lmeShfLmtleXMoQHVwc2VydHMpKVxuXG4gIF9kZWxldGVVcHNlcnQ6IChpZCkgLT5cbiAgICBkZWxldGUgQHVwc2VydHNbaWRdXG4gICAgaWYgQG5hbWVzcGFjZVxuICAgICAgbG9jYWxTdG9yYWdlW0BuYW1lc3BhY2UrXCJ1cHNlcnRzXCJdID0gSlNPTi5zdHJpbmdpZnkoXy5rZXlzKEB1cHNlcnRzKSlcblxuICBfcHV0UmVtb3ZlOiAoZG9jKSAtPlxuICAgIEByZW1vdmVzW2RvYy5faWRdID0gZG9jXG4gICAgaWYgQG5hbWVzcGFjZVxuICAgICAgbG9jYWxTdG9yYWdlW0BuYW1lc3BhY2UrXCJyZW1vdmVzXCJdID0gSlNPTi5zdHJpbmdpZnkoXy52YWx1ZXMoQHJlbW92ZXMpKVxuXG4gIF9kZWxldGVSZW1vdmU6IChpZCkgLT5cbiAgICBkZWxldGUgQHJlbW92ZXNbaWRdXG4gICAgaWYgQG5hbWVzcGFjZVxuICAgICAgbG9jYWxTdG9yYWdlW0BuYW1lc3BhY2UrXCJyZW1vdmVzXCJdID0gSlNPTi5zdHJpbmdpZnkoXy52YWx1ZXMoQHJlbW92ZXMpKVxuXG4gIGNhY2hlOiAoZG9jcywgc2VsZWN0b3IsIG9wdGlvbnMsIHN1Y2Nlc3MsIGVycm9yKSAtPlxuICAgICMgQWRkIGFsbCBub24tbG9jYWwgdGhhdCBhcmUgbm90IHVwc2VydGVkIG9yIHJlbW92ZWRcbiAgICBmb3IgZG9jIGluIGRvY3NcbiAgICAgIGlmIG5vdCBfLmhhcyhAdXBzZXJ0cywgZG9jLl9pZCkgYW5kIG5vdCBfLmhhcyhAcmVtb3ZlcywgZG9jLl9pZClcbiAgICAgICAgQF9wdXRJdGVtKGRvYylcblxuICAgIGRvY3NNYXAgPSBfLm9iamVjdChfLnBsdWNrKGRvY3MsIFwiX2lkXCIpLCBkb2NzKVxuXG4gICAgaWYgb3B0aW9ucy5zb3J0XG4gICAgICBzb3J0ID0gY29tcGlsZVNvcnQob3B0aW9ucy5zb3J0KVxuXG4gICAgIyBQZXJmb3JtIHF1ZXJ5LCByZW1vdmluZyByb3dzIG1pc3NpbmcgaW4gZG9jcyBmcm9tIGxvY2FsIGRiIFxuICAgIEBmaW5kKHNlbGVjdG9yLCBvcHRpb25zKS5mZXRjaCAocmVzdWx0cykgPT5cbiAgICAgIGZvciByZXN1bHQgaW4gcmVzdWx0c1xuICAgICAgICBpZiBub3QgZG9jc01hcFtyZXN1bHQuX2lkXSBhbmQgbm90IF8uaGFzKEB1cHNlcnRzLCByZXN1bHQuX2lkKVxuICAgICAgICAgICMgSWYgcGFzdCBlbmQgb24gc29ydGVkIGxpbWl0ZWQsIGlnbm9yZVxuICAgICAgICAgIGlmIG9wdGlvbnMuc29ydCBhbmQgb3B0aW9ucy5saW1pdCBhbmQgZG9jcy5sZW5ndGggPT0gb3B0aW9ucy5saW1pdFxuICAgICAgICAgICAgaWYgc29ydChyZXN1bHQsIF8ubGFzdChkb2NzKSkgPj0gMFxuICAgICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgIEBfZGVsZXRlSXRlbShyZXN1bHQuX2lkKVxuXG4gICAgICBpZiBzdWNjZXNzPyB0aGVuIHN1Y2Nlc3MoKSAgXG4gICAgLCBlcnJvclxuICAgIFxuICBwZW5kaW5nVXBzZXJ0czogKHN1Y2Nlc3MpIC0+XG4gICAgc3VjY2VzcyBfLnZhbHVlcyhAdXBzZXJ0cylcblxuICBwZW5kaW5nUmVtb3ZlczogKHN1Y2Nlc3MpIC0+XG4gICAgc3VjY2VzcyBfLnBsdWNrKEByZW1vdmVzLCBcIl9pZFwiKVxuXG4gIHJlc29sdmVVcHNlcnQ6IChkb2MsIHN1Y2Nlc3MpIC0+XG4gICAgaWYgQHVwc2VydHNbZG9jLl9pZF0gYW5kIF8uaXNFcXVhbChkb2MsIEB1cHNlcnRzW2RvYy5faWRdKVxuICAgICAgQF9kZWxldGVVcHNlcnQoZG9jLl9pZClcbiAgICBpZiBzdWNjZXNzPyB0aGVuIHN1Y2Nlc3MoKVxuXG4gIHJlc29sdmVSZW1vdmU6IChpZCwgc3VjY2VzcykgLT5cbiAgICBAX2RlbGV0ZVJlbW92ZShpZClcbiAgICBpZiBzdWNjZXNzPyB0aGVuIHN1Y2Nlc3MoKVxuXG4gICMgQWRkIGJ1dCBkbyBub3Qgb3ZlcndyaXRlIG9yIHJlY29yZCBhcyB1cHNlcnRcbiAgc2VlZDogKGRvYywgc3VjY2VzcykgLT5cbiAgICBpZiBub3QgXy5oYXMoQGl0ZW1zLCBkb2MuX2lkKSBhbmQgbm90IF8uaGFzKEByZW1vdmVzLCBkb2MuX2lkKVxuICAgICAgQF9wdXRJdGVtKGRvYylcbiAgICBpZiBzdWNjZXNzPyB0aGVuIHN1Y2Nlc3MoKVxuXG5tb2R1bGUuZXhwb3J0cyA9IExvY2FsRGJcbiIsIiMjI1xuXG5EYXRhYmFzZSB3aGljaCBjYWNoZXMgbG9jYWxseSBpbiBhIGxvY2FsRGIgYnV0IHB1bGxzIHJlc3VsdHNcbnVsdGltYXRlbHkgZnJvbSBhIFJlbW90ZURiXG5cbiMjI1xuXG5wcm9jZXNzRmluZCA9IHJlcXVpcmUoJy4vdXRpbHMnKS5wcm9jZXNzRmluZFxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEh5YnJpZERiXG4gIGNvbnN0cnVjdG9yOiAobG9jYWxEYiwgcmVtb3RlRGIpIC0+XG4gICAgQGxvY2FsRGIgPSBsb2NhbERiXG4gICAgQHJlbW90ZURiID0gcmVtb3RlRGJcbiAgICBAY29sbGVjdGlvbnMgPSB7fVxuXG4gICAgIyBBZGQgZXZlbnRzXG4gICAgXy5leHRlbmQodGhpcywgQmFja2JvbmUuRXZlbnRzKVxuXG4gIGFkZENvbGxlY3Rpb246IChuYW1lKSAtPlxuICAgIGNvbGxlY3Rpb24gPSBuZXcgSHlicmlkQ29sbGVjdGlvbihuYW1lLCBAbG9jYWxEYltuYW1lXSwgQHJlbW90ZURiW25hbWVdKVxuICAgIEBbbmFtZV0gPSBjb2xsZWN0aW9uXG4gICAgQGNvbGxlY3Rpb25zW25hbWVdID0gY29sbGVjdGlvblxuXG4gICAgY29sbGVjdGlvbi5vbiAnY2hhbmdlJywgPT5cbiAgICAgIEB0cmlnZ2VyICdjaGFuZ2UnXG5cbiAgcmVtb3ZlQ29sbGVjdGlvbjogKG5hbWUpIC0+XG4gICAgZGVsZXRlIEBbbmFtZV1cbiAgICBkZWxldGUgQGNvbGxlY3Rpb25zW25hbWVdXG4gIFxuICB1cGxvYWQ6IChzdWNjZXNzLCBlcnJvcikgLT5cbiAgICBjb2xzID0gXy52YWx1ZXMoQGNvbGxlY3Rpb25zKVxuXG4gICAgdXBsb2FkQ29scyA9IChjb2xzLCBzdWNjZXNzLCBlcnJvcikgPT5cbiAgICAgIGNvbCA9IF8uZmlyc3QoY29scylcbiAgICAgIGlmIGNvbFxuICAgICAgICBjb2wudXBsb2FkKCgpID0+XG4gICAgICAgICAgdXBsb2FkQ29scyhfLnJlc3QoY29scyksIHN1Y2Nlc3MsIGVycm9yKVxuICAgICAgICAsIChlcnIpID0+XG4gICAgICAgICAgZXJyb3IoZXJyKSlcbiAgICAgIGVsc2VcbiAgICAgICAgc3VjY2VzcygpXG4gICAgdXBsb2FkQ29scyhjb2xzLCBzdWNjZXNzLCBlcnJvcilcblxuY2xhc3MgSHlicmlkQ29sbGVjdGlvblxuICBjb25zdHJ1Y3RvcjogKG5hbWUsIGxvY2FsQ29sLCByZW1vdGVDb2wpIC0+XG4gICAgQG5hbWUgPSBuYW1lXG4gICAgQGxvY2FsQ29sID0gbG9jYWxDb2xcbiAgICBAcmVtb3RlQ29sID0gcmVtb3RlQ29sXG5cbiAgICAjIEFkZCBldmVudHNcbiAgICBfLmV4dGVuZCh0aGlzLCBCYWNrYm9uZS5FdmVudHMpXG5cbiAgIyBvcHRpb25zLm1vZGUgZGVmYXVsdHMgdG8gXCJoeWJyaWRcIi5cbiAgIyBJbiBcImh5YnJpZFwiLCBpdCB3aWxsIHJldHVybiBsb2NhbCByZXN1bHRzLCB0aGVuIGhpdCByZW1vdGUgYW5kIHJldHVybiBhZ2FpbiBpZiBkaWZmZXJlbnRcbiAgIyBJZiByZW1vdGUgZ2l2ZXMgZXJyb3IsIGl0IHdpbGwgYmUgaWdub3JlZFxuICAjIEluIFwicmVtb3RlXCIsIGl0IHdpbGwgY2FsbCByZW1vdGUgYW5kIG5vdCBjYWNoZSwgYnV0IGludGVncmF0ZXMgbG9jYWwgdXBzZXJ0cy9kZWxldGVzXG4gICMgSWYgcmVtb3RlIGdpdmVzIGVycm9yLCB0aGVuIGl0IHdpbGwgcmV0dXJuIGxvY2FsIHJlc3VsdHNcbiAgIyBJbiBcImxvY2FsXCIsIGp1c3QgcmV0dXJucyBsb2NhbCByZXN1bHRzXG4gIGZpbmQ6IChzZWxlY3Rvciwgb3B0aW9ucyA9IHt9KSAtPlxuICAgIHJldHVybiBmZXRjaDogKHN1Y2Nlc3MsIGVycm9yKSA9PlxuICAgICAgQF9maW5kRmV0Y2goc2VsZWN0b3IsIG9wdGlvbnMsIHN1Y2Nlc3MsIGVycm9yKVxuXG4gICMgb3B0aW9ucy5tb2RlIGRlZmF1bHRzIHRvIFwiaHlicmlkXCIuXG4gICMgSW4gXCJoeWJyaWRcIiwgaXQgd2lsbCByZXR1cm4gbG9jYWwgaWYgcHJlc2VudCwgb3RoZXJ3aXNlIGZhbGwgdG8gcmVtb3RlIHdpdGhvdXQgcmV0dXJuaW5nIG51bGxcbiAgIyBJZiByZW1vdGUgZ2l2ZXMgZXJyb3IsIHRoZW4gaXQgd2lsbCByZXR1cm4gbnVsbCBpZiBub25lIGxvY2FsbHkuIElmIHJlbW90ZSBhbmQgbG9jYWwgZGlmZmVyLCBpdFxuICAjIHdpbGwgcmV0dXJuIHR3aWNlXG4gICMgSW4gXCJsb2NhbFwiLCBpdCB3aWxsIHJldHVybiBsb2NhbCBpZiBwcmVzZW50LiBJZiBub3QgcHJlc2VudCwgb25seSB0aGVuIHdpbGwgaXQgaGl0IHJlbW90ZS5cbiAgIyBJZiByZW1vdGUgZ2l2ZXMgZXJyb3IsIHRoZW4gaXQgd2lsbCByZXR1cm4gbnVsbFxuICAjIEluIFwicmVtb3RlXCIuLi4gKG5vdCBpbXBsZW1lbnRlZClcbiAgZmluZE9uZTogKHNlbGVjdG9yLCBvcHRpb25zID0ge30sIHN1Y2Nlc3MsIGVycm9yKSAtPlxuICAgIGlmIF8uaXNGdW5jdGlvbihvcHRpb25zKSBcbiAgICAgIFtvcHRpb25zLCBzdWNjZXNzLCBlcnJvcl0gPSBbe30sIG9wdGlvbnMsIHN1Y2Nlc3NdXG5cbiAgICBtb2RlID0gb3B0aW9ucy5tb2RlIHx8IFwiaHlicmlkXCJcblxuICAgIGlmIG1vZGUgPT0gXCJoeWJyaWRcIiBvciBtb2RlID09IFwibG9jYWxcIlxuICAgICAgb3B0aW9ucy5saW1pdCA9IDFcbiAgICAgIEBsb2NhbENvbC5maW5kT25lIHNlbGVjdG9yLCBvcHRpb25zLCAobG9jYWxEb2MpID0+XG4gICAgICAgICMgSWYgZm91bmQsIHJldHVyblxuICAgICAgICBpZiBsb2NhbERvY1xuICAgICAgICAgIHN1Y2Nlc3MobG9jYWxEb2MpXG4gICAgICAgICAgIyBObyBuZWVkIHRvIGhpdCByZW1vdGUgaWYgbG9jYWxcbiAgICAgICAgICBpZiBtb2RlID09IFwibG9jYWxcIlxuICAgICAgICAgICAgcmV0dXJuIFxuXG4gICAgICAgIHJlbW90ZVN1Y2Nlc3MgPSAocmVtb3RlRG9jKSA9PlxuICAgICAgICAgICMgQ2FjaGVcbiAgICAgICAgICBjYWNoZVN1Y2Nlc3MgPSA9PlxuICAgICAgICAgICAgIyBUcnkgcXVlcnkgYWdhaW5cbiAgICAgICAgICAgIEBsb2NhbENvbC5maW5kT25lIHNlbGVjdG9yLCBvcHRpb25zLCAobG9jYWxEb2MyKSA9PlxuICAgICAgICAgICAgICBpZiBub3QgXy5pc0VxdWFsKGxvY2FsRG9jLCBsb2NhbERvYzIpXG4gICAgICAgICAgICAgICAgc3VjY2Vzcyhsb2NhbERvYzIpXG4gICAgICAgICAgICAgIGVsc2UgaWYgbm90IGxvY2FsRG9jXG4gICAgICAgICAgICAgICAgc3VjY2VzcyhudWxsKVxuXG4gICAgICAgICAgZG9jcyA9IGlmIHJlbW90ZURvYyB0aGVuIFtyZW1vdGVEb2NdIGVsc2UgW11cbiAgICAgICAgICBAbG9jYWxDb2wuY2FjaGUoZG9jcywgc2VsZWN0b3IsIG9wdGlvbnMsIGNhY2hlU3VjY2VzcywgZXJyb3IpXG5cbiAgICAgICAgcmVtb3RlRXJyb3IgPSA9PlxuICAgICAgICAgICMgUmVtb3RlIGVycm9yZWQgb3V0LiBSZXR1cm4gbnVsbCBpZiBsb2NhbCBkaWQgbm90IHJldHVyblxuICAgICAgICAgIGlmIG5vdCBsb2NhbERvY1xuICAgICAgICAgICAgc3VjY2VzcyhudWxsKVxuXG4gICAgICAgICMgQ2FsbCByZW1vdGVcbiAgICAgICAgQHJlbW90ZUNvbC5maW5kT25lIHNlbGVjdG9yLCBfLm9taXQob3B0aW9ucywgJ2ZpZWxkcycpLCByZW1vdGVTdWNjZXNzLCByZW1vdGVFcnJvclxuICAgICAgLCBlcnJvclxuICAgIGVsc2UgXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJVbmtub3duIG1vZGVcIilcblxuICBfZmluZEZldGNoOiAoc2VsZWN0b3IsIG9wdGlvbnMsIHN1Y2Nlc3MsIGVycm9yKSAtPlxuICAgIG1vZGUgPSBvcHRpb25zLm1vZGUgfHwgXCJoeWJyaWRcIlxuXG4gICAgaWYgbW9kZSA9PSBcImh5YnJpZFwiXG4gICAgICAjIEdldCBsb2NhbCByZXN1bHRzXG4gICAgICBsb2NhbFN1Y2Nlc3MgPSAobG9jYWxEYXRhKSA9PlxuICAgICAgICAjIFJldHVybiBkYXRhIGltbWVkaWF0ZWx5XG4gICAgICAgIHN1Y2Nlc3MobG9jYWxEYXRhKVxuXG4gICAgICAgICMgR2V0IHJlbW90ZSBkYXRhXG4gICAgICAgIHJlbW90ZVN1Y2Nlc3MgPSAocmVtb3RlRGF0YSkgPT5cbiAgICAgICAgICAjIENhY2hlIGxvY2FsbHlcbiAgICAgICAgICBjYWNoZVN1Y2Nlc3MgPSAoKSA9PlxuICAgICAgICAgICAgIyBHZXQgbG9jYWwgZGF0YSBhZ2FpblxuICAgICAgICAgICAgbG9jYWxTdWNjZXNzMiA9IChsb2NhbERhdGEyKSA9PlxuICAgICAgICAgICAgICAjIENoZWNrIGlmIGRpZmZlcmVudFxuICAgICAgICAgICAgICBpZiBub3QgXy5pc0VxdWFsKGxvY2FsRGF0YSwgbG9jYWxEYXRhMilcbiAgICAgICAgICAgICAgICAjIFNlbmQgYWdhaW5cbiAgICAgICAgICAgICAgICBzdWNjZXNzKGxvY2FsRGF0YTIpXG4gICAgICAgICAgICBAbG9jYWxDb2wuZmluZChzZWxlY3Rvciwgb3B0aW9ucykuZmV0Y2gobG9jYWxTdWNjZXNzMilcbiAgICAgICAgICBAbG9jYWxDb2wuY2FjaGUocmVtb3RlRGF0YSwgc2VsZWN0b3IsIG9wdGlvbnMsIGNhY2hlU3VjY2VzcywgZXJyb3IpXG4gICAgICAgIEByZW1vdGVDb2wuZmluZChzZWxlY3RvciwgXy5vbWl0KG9wdGlvbnMsIFwiZmllbGRzXCIpKS5mZXRjaChyZW1vdGVTdWNjZXNzKVxuXG4gICAgICBAbG9jYWxDb2wuZmluZChzZWxlY3Rvciwgb3B0aW9ucykuZmV0Y2gobG9jYWxTdWNjZXNzLCBlcnJvcilcbiAgICBlbHNlIGlmIG1vZGUgPT0gXCJsb2NhbFwiXG4gICAgICBAbG9jYWxDb2wuZmluZChzZWxlY3Rvciwgb3B0aW9ucykuZmV0Y2goc3VjY2VzcywgZXJyb3IpXG4gICAgZWxzZSBpZiBtb2RlID09IFwicmVtb3RlXCJcbiAgICAgICMgR2V0IHJlbW90ZSByZXN1bHRzXG4gICAgICByZW1vdGVTdWNjZXNzID0gKHJlbW90ZURhdGEpID0+XG4gICAgICAgICMgUmVtb3ZlIGxvY2FsIHJlbW90ZXNcbiAgICAgICAgZGF0YSA9IHJlbW90ZURhdGFcblxuICAgICAgICBAbG9jYWxDb2wucGVuZGluZ1JlbW92ZXMgKHJlbW92ZXMpID0+XG4gICAgICAgICAgaWYgcmVtb3Zlcy5sZW5ndGggPiAwXG4gICAgICAgICAgICByZW1vdmVzTWFwID0gXy5vYmplY3QoXy5tYXAocmVtb3ZlcywgKGlkKSAtPiBbaWQsIGlkXSkpXG4gICAgICAgICAgICBkYXRhID0gXy5maWx0ZXIgcmVtb3RlRGF0YSwgKGRvYykgLT5cbiAgICAgICAgICAgICAgcmV0dXJuIG5vdCBfLmhhcyhyZW1vdmVzTWFwLCBkb2MuX2lkKVxuXG4gICAgICAgICAgIyBBZGQgdXBzZXJ0c1xuICAgICAgICAgIEBsb2NhbENvbC5wZW5kaW5nVXBzZXJ0cyAodXBzZXJ0cykgPT5cbiAgICAgICAgICAgIGlmIHVwc2VydHMubGVuZ3RoID4gMFxuICAgICAgICAgICAgICAjIFJlbW92ZSB1cHNlcnRzIGZyb20gZGF0YVxuICAgICAgICAgICAgICB1cHNlcnRzTWFwID0gXy5vYmplY3QoXy5wbHVjayh1cHNlcnRzLCAnX2lkJyksIF8ucGx1Y2sodXBzZXJ0cywgJ19pZCcpKVxuICAgICAgICAgICAgICBkYXRhID0gXy5maWx0ZXIgZGF0YSwgKGRvYykgLT5cbiAgICAgICAgICAgICAgICByZXR1cm4gbm90IF8uaGFzKHVwc2VydHNNYXAsIGRvYy5faWQpXG5cbiAgICAgICAgICAgICAgIyBBZGQgdXBzZXJ0c1xuICAgICAgICAgICAgICBkYXRhID0gZGF0YS5jb25jYXQodXBzZXJ0cylcblxuICAgICAgICAgICAgICAjIFJlZmlsdGVyL3NvcnQvbGltaXRcbiAgICAgICAgICAgICAgZGF0YSA9IHByb2Nlc3NGaW5kKGRhdGEsIHNlbGVjdG9yLCBvcHRpb25zKVxuXG4gICAgICAgICAgICBzdWNjZXNzKGRhdGEpXG5cbiAgICAgIHJlbW90ZUVycm9yID0gPT5cbiAgICAgICAgIyBDYWxsIGxvY2FsXG4gICAgICAgIEBsb2NhbENvbC5maW5kKHNlbGVjdG9yLCBvcHRpb25zKS5mZXRjaChzdWNjZXNzLCBlcnJvcilcblxuICAgICAgQHJlbW90ZUNvbC5maW5kKHNlbGVjdG9yLCBvcHRpb25zKS5mZXRjaChyZW1vdGVTdWNjZXNzLCByZW1vdGVFcnJvcilcbiAgICBlbHNlXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJVbmtub3duIG1vZGVcIilcblxuICB1cHNlcnQ6IChkb2MsIHN1Y2Nlc3MsIGVycm9yKSAtPlxuICAgIEBsb2NhbENvbC51cHNlcnQoZG9jLCAocmVzdWx0KSA9PlxuICAgICAgQHRyaWdnZXIgJ2NoYW5nZSdcbiAgICAgIHN1Y2Nlc3MocmVzdWx0KSBpZiBzdWNjZXNzP1xuICAgICwgZXJyb3IpXG5cbiAgcmVtb3ZlOiAoaWQsIHN1Y2Nlc3MsIGVycm9yKSAtPlxuICAgIEBsb2NhbENvbC5yZW1vdmUoaWQsICgpID0+XG4gICAgICBAdHJpZ2dlciAnY2hhbmdlJ1xuICAgICAgc3VjY2VzcygpIGlmIHN1Y2Nlc3M/XG4gICAgLCBlcnJvcikgIFxuXG4gIHVwbG9hZDogKHN1Y2Nlc3MsIGVycm9yKSAtPlxuICAgIHVwbG9hZFVwc2VydHMgPSAodXBzZXJ0cywgc3VjY2VzcywgZXJyb3IpID0+XG4gICAgICB1cHNlcnQgPSBfLmZpcnN0KHVwc2VydHMpXG4gICAgICBpZiB1cHNlcnRcbiAgICAgICAgQHJlbW90ZUNvbC51cHNlcnQodXBzZXJ0LCAoKSA9PlxuICAgICAgICAgIEBsb2NhbENvbC5yZXNvbHZlVXBzZXJ0IHVwc2VydCwgPT5cbiAgICAgICAgICAgIHVwbG9hZFVwc2VydHMoXy5yZXN0KHVwc2VydHMpLCBzdWNjZXNzLCBlcnJvcilcbiAgICAgICAgLCAoZXJyKSA9PlxuICAgICAgICAgIGVycm9yKGVycikpXG4gICAgICBlbHNlIFxuICAgICAgICBzdWNjZXNzKClcbiAgICBAbG9jYWxDb2wucGVuZGluZ1Vwc2VydHMgKHVwc2VydHMpID0+XG4gICAgICB1cGxvYWRVcHNlcnRzKHVwc2VydHMsIHN1Y2Nlc3MsIGVycm9yKVxuIiwiZXhwb3J0cy5TZWN0aW9ucyA9IEJhY2tib25lLlZpZXcuZXh0ZW5kKHtcbiAgICBjbGFzc05hbWUgOiBcInN1cnZleVwiLFxuXG4gICAgaW5pdGlhbGl6ZSA6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnRpdGxlID0gdGhpcy5vcHRpb25zLnRpdGxlO1xuICAgICAgICB0aGlzLnNlY3Rpb25zID0gdGhpcy5vcHRpb25zLnNlY3Rpb25zO1xuICAgICAgICB0aGlzLnJlbmRlcigpO1xuXG4gICAgICAgIC8vIEFkanVzdCBuZXh0L3ByZXYgYmFzZWQgb24gbW9kZWxcbiAgICAgICAgdGhpcy5tb2RlbC5vbihcImNoYW5nZVwiLCB0aGlzLnJlbmRlck5leHRQcmV2LCB0aGlzKTtcblxuICAgICAgICAvLyBHbyB0byBhcHByb3ByaWF0ZSBzZWN0aW9uIFRPRE9cbiAgICAgICAgdGhpcy5zaG93U2VjdGlvbigwKTtcbiAgICB9LFxuXG4gICAgZXZlbnRzIDoge1xuICAgICAgICBcImNsaWNrICNjbG9zZVwiIDogXCJjbG9zZVwiLFxuICAgICAgICBcImNsaWNrIC5uZXh0XCIgOiBcIm5leHRTZWN0aW9uXCIsXG4gICAgICAgIFwiY2xpY2sgLnByZXZcIiA6IFwicHJldlNlY3Rpb25cIixcbiAgICAgICAgXCJjbGljayAuZmluaXNoXCIgOiBcImZpbmlzaFwiLFxuICAgICAgICBcImNsaWNrIGEuc2VjdGlvbi1jcnVtYlwiIDogXCJjcnVtYlNlY3Rpb25cIlxuICAgIH0sXG5cbiAgICBmaW5pc2ggOiBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gVmFsaWRhdGUgY3VycmVudCBzZWN0aW9uXG4gICAgICAgIHZhciBzZWN0aW9uID0gdGhpcy5zZWN0aW9uc1t0aGlzLnNlY3Rpb25dO1xuICAgICAgICBpZiAoc2VjdGlvbi52YWxpZGF0ZSgpKSB7XG4gICAgICAgICAgICB0aGlzLnRyaWdnZXIoJ2NvbXBsZXRlJyk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgY2xvc2UgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy50cmlnZ2VyKCdjbG9zZScpO1xuICAgIH0sXG5cbiAgICBjcnVtYlNlY3Rpb24gOiBmdW5jdGlvbihlKSB7XG4gICAgICAgIC8vIEdvIHRvIHNlY3Rpb25cbiAgICAgICAgdmFyIGluZGV4ID0gcGFyc2VJbnQoZS50YXJnZXQuZ2V0QXR0cmlidXRlKFwiZGF0YS12YWx1ZVwiKSk7XG4gICAgICAgIHRoaXMuc2hvd1NlY3Rpb24oaW5kZXgpO1xuICAgIH0sXG5cbiAgICBnZXROZXh0U2VjdGlvbkluZGV4IDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBpID0gdGhpcy5zZWN0aW9uICsgMTtcbiAgICAgICAgd2hpbGUgKGkgPCB0aGlzLnNlY3Rpb25zLmxlbmd0aCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuc2VjdGlvbnNbaV0uc2hvdWxkQmVWaXNpYmxlKCkpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGk7XG4gICAgICAgICAgICBpKys7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgZ2V0UHJldlNlY3Rpb25JbmRleCA6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgaSA9IHRoaXMuc2VjdGlvbiAtIDE7XG4gICAgICAgIHdoaWxlIChpID49IDApIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnNlY3Rpb25zW2ldLnNob3VsZEJlVmlzaWJsZSgpKVxuICAgICAgICAgICAgICAgIHJldHVybiBpO1xuICAgICAgICAgICAgaS0tO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIG5leHRTZWN0aW9uIDogZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIFZhbGlkYXRlIGN1cnJlbnQgc2VjdGlvblxuICAgICAgICB2YXIgc2VjdGlvbiA9IHRoaXMuc2VjdGlvbnNbdGhpcy5zZWN0aW9uXTtcbiAgICAgICAgaWYgKHNlY3Rpb24udmFsaWRhdGUoKSkge1xuICAgICAgICAgICAgdGhpcy5zaG93U2VjdGlvbih0aGlzLmdldE5leHRTZWN0aW9uSW5kZXgoKSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgcHJldlNlY3Rpb24gOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5zaG93U2VjdGlvbih0aGlzLmdldFByZXZTZWN0aW9uSW5kZXgoKSk7XG4gICAgfSxcblxuICAgIHNob3dTZWN0aW9uIDogZnVuY3Rpb24oaW5kZXgpIHtcbiAgICAgICAgdGhpcy5zZWN0aW9uID0gaW5kZXg7XG5cbiAgICAgICAgXy5lYWNoKHRoaXMuc2VjdGlvbnMsIGZ1bmN0aW9uKHMpIHtcbiAgICAgICAgICAgIHMuJGVsLmhpZGUoKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuc2VjdGlvbnNbaW5kZXhdLiRlbC5zaG93KCk7XG5cbiAgICAgICAgLy8gU2V0dXAgYnJlYWRjcnVtYnNcbiAgICAgICAgdmFyIHZpc2libGVTZWN0aW9ucyA9IF8uZmlsdGVyKF8uZmlyc3QodGhpcy5zZWN0aW9ucywgaW5kZXggKyAxKSwgZnVuY3Rpb24ocykge1xuICAgICAgICAgICAgcmV0dXJuIHMuc2hvdWxkQmVWaXNpYmxlKClcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuJChcIi5icmVhZGNydW1iXCIpLmh0bWwodGVtcGxhdGVzWydmb3Jtcy9TZWN0aW9uc19icmVhZGNydW1icyddKHtcbiAgICAgICAgICAgIHNlY3Rpb25zIDogXy5pbml0aWFsKHZpc2libGVTZWN0aW9ucyksXG4gICAgICAgICAgICBsYXN0U2VjdGlvbjogXy5sYXN0KHZpc2libGVTZWN0aW9ucylcbiAgICAgICAgfSkpO1xuICAgICAgICBcbiAgICAgICAgdGhpcy5yZW5kZXJOZXh0UHJldigpO1xuXG4gICAgICAgIC8vIFNjcm9sbCBpbnRvIHZpZXdcbiAgICAgICAgdGhpcy4kZWwuc2Nyb2xsaW50b3ZpZXcoKTtcbiAgICB9LFxuICAgIFxuICAgIHJlbmRlck5leHRQcmV2IDogZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIFNldHVwIG5leHQvcHJldiBidXR0b25zXG4gICAgICAgIHRoaXMuJChcIi5wcmV2XCIpLnRvZ2dsZSh0aGlzLmdldFByZXZTZWN0aW9uSW5kZXgoKSAhPT0gdW5kZWZpbmVkKTtcbiAgICAgICAgdGhpcy4kKFwiLm5leHRcIikudG9nZ2xlKHRoaXMuZ2V0TmV4dFNlY3Rpb25JbmRleCgpICE9PSB1bmRlZmluZWQpO1xuICAgICAgICB0aGlzLiQoXCIuZmluaXNoXCIpLnRvZ2dsZSh0aGlzLmdldE5leHRTZWN0aW9uSW5kZXgoKSA9PT0gdW5kZWZpbmVkKTtcbiAgICB9LFxuXG4gICAgcmVuZGVyIDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuJGVsLmh0bWwodGVtcGxhdGVzWydmb3Jtcy9TZWN0aW9ucyddKCkpO1xuXG4gICAgICAgIC8vIEFkZCBzZWN0aW9uc1xuICAgICAgICB2YXIgc2VjdGlvbnNFbCA9IHRoaXMuJChcIi5zZWN0aW9uc1wiKTtcbiAgICAgICAgXy5lYWNoKHRoaXMuc2VjdGlvbnMsIGZ1bmN0aW9uKHMpIHtcbiAgICAgICAgICAgIHNlY3Rpb25zRWwuYXBwZW5kKHMuJGVsKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG59KTtcblxuZXhwb3J0cy5TZWN0aW9uID0gQmFja2JvbmUuVmlldy5leHRlbmQoe1xuICAgIGNsYXNzTmFtZSA6IFwic2VjdGlvblwiLFxuICAgIHRlbXBsYXRlIDogXy50ZW1wbGF0ZSgnPGRpdiBjbGFzcz1cImNvbnRlbnRzXCI+PC9kaXY+JyksXG5cbiAgICBpbml0aWFsaXplIDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMudGl0bGUgPSB0aGlzLm9wdGlvbnMudGl0bGU7XG4gICAgICAgIHRoaXMuY29udGVudHMgPSB0aGlzLm9wdGlvbnMuY29udGVudHM7XG5cbiAgICAgICAgLy8gQWx3YXlzIGludmlzaWJsZSBpbml0aWFsbHlcbiAgICAgICAgdGhpcy4kZWwuaGlkZSgpO1xuICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgIH0sXG5cbiAgICBzaG91bGRCZVZpc2libGUgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKCF0aGlzLm9wdGlvbnMuY29uZGl0aW9uYWwpXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy5jb25kaXRpb25hbCh0aGlzLm1vZGVsKTtcbiAgICB9LFxuXG4gICAgdmFsaWRhdGUgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gR2V0IGFsbCB2aXNpYmxlIGl0ZW1zXG4gICAgICAgIHZhciBpdGVtcyA9IF8uZmlsdGVyKHRoaXMuY29udGVudHMsIGZ1bmN0aW9uKGMpIHtcbiAgICAgICAgICAgIHJldHVybiBjLnZpc2libGUgJiYgYy52YWxpZGF0ZTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiAhXy5hbnkoXy5tYXAoaXRlbXMsIGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgICAgIHJldHVybiBpdGVtLnZhbGlkYXRlKCk7XG4gICAgICAgIH0pKTtcbiAgICB9LFxuXG4gICAgcmVuZGVyIDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuJGVsLmh0bWwodGhpcy50ZW1wbGF0ZSh0aGlzKSk7XG5cbiAgICAgICAgLy8gQWRkIGNvbnRlbnRzIChxdWVzdGlvbnMsIG1vc3RseSlcbiAgICAgICAgdmFyIGNvbnRlbnRzRWwgPSB0aGlzLiQoXCIuY29udGVudHNcIik7XG4gICAgICAgIF8uZWFjaCh0aGlzLmNvbnRlbnRzLCBmdW5jdGlvbihjKSB7XG4gICAgICAgICAgICBjb250ZW50c0VsLmFwcGVuZChjLiRlbCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxufSk7XG5cbmV4cG9ydHMuUXVlc3Rpb24gPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCh7XG4gICAgY2xhc3NOYW1lIDogXCJxdWVzdGlvblwiLFxuXG4gICAgdGVtcGxhdGUgOiBfLnRlbXBsYXRlKCc8JSBpZiAob3B0aW9ucy5wcm9tcHQpIHsgJT48ZGl2IGNsYXNzPVwicHJvbXB0XCI+PCU9b3B0aW9ucy5wcm9tcHQlPjwlPXJlbmRlclJlcXVpcmVkKCklPjwvZGl2PjwlIH0gJT48ZGl2IGNsYXNzPVwiYW5zd2VyXCI+PC9kaXY+PCU9cmVuZGVySGludCgpJT4nKSxcblxuICAgIHJlbmRlclJlcXVpcmVkIDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0aGlzLnJlcXVpcmVkKVxuICAgICAgICAgICAgcmV0dXJuICcmbmJzcDs8c3BhbiBjbGFzcz1cInJlcXVpcmVkXCI+Kjwvc3Bhbj4nO1xuICAgICAgICByZXR1cm4gJyc7XG4gICAgfSxcblxuICAgIHJlbmRlckhpbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmhpbnQpXG4gICAgICAgICAgICByZXR1cm4gXy50ZW1wbGF0ZSgnPGRpdiBjbGFzcz1cIm11dGVkXCI+PCU9aGludCU+PC9kaXY+Jykoe2hpbnQ6IHRoaXMub3B0aW9ucy5oaW50fSk7XG4gICAgfSxcblxuICAgIHZhbGlkYXRlIDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciB2YWw7XG5cbiAgICAgICAgLy8gQ2hlY2sgcmVxdWlyZWRcbiAgICAgICAgaWYgKHRoaXMucmVxdWlyZWQpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLm1vZGVsLmdldCh0aGlzLmlkKSA9PT0gdW5kZWZpbmVkIHx8IHRoaXMubW9kZWwuZ2V0KHRoaXMuaWQpID09PSBudWxsIHx8IHRoaXMubW9kZWwuZ2V0KHRoaXMuaWQpID09PSBcIlwiKVxuICAgICAgICAgICAgICAgIHZhbCA9IFwiUmVxdWlyZWRcIjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENoZWNrIGludGVybmFsIHZhbGlkYXRpb25cbiAgICAgICAgaWYgKCF2YWwgJiYgdGhpcy52YWxpZGF0ZUludGVybmFsKSB7XG4gICAgICAgICAgICB2YWwgPSB0aGlzLnZhbGlkYXRlSW50ZXJuYWwoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENoZWNrIGN1c3RvbSB2YWxpZGF0aW9uXG4gICAgICAgIGlmICghdmFsICYmIHRoaXMub3B0aW9ucy52YWxpZGF0ZSkge1xuICAgICAgICAgICAgdmFsID0gdGhpcy5vcHRpb25zLnZhbGlkYXRlKCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBTaG93IHZhbGlkYXRpb24gcmVzdWx0cyBUT0RPXG4gICAgICAgIGlmICh2YWwpIHtcbiAgICAgICAgICAgIHRoaXMuJGVsLmFkZENsYXNzKFwiaW52YWxpZFwiKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuJGVsLnJlbW92ZUNsYXNzKFwiaW52YWxpZFwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB2YWw7XG4gICAgfSxcblxuICAgIHVwZGF0ZVZpc2liaWxpdHkgOiBmdW5jdGlvbihlKSB7XG4gICAgICAgIC8vIHNsaWRlVXAvc2xpZGVEb3duXG4gICAgICAgIGlmICh0aGlzLnNob3VsZEJlVmlzaWJsZSgpICYmICF0aGlzLnZpc2libGUpXG4gICAgICAgICAgICB0aGlzLiRlbC5zbGlkZURvd24oKTtcbiAgICAgICAgaWYgKCF0aGlzLnNob3VsZEJlVmlzaWJsZSgpICYmIHRoaXMudmlzaWJsZSlcbiAgICAgICAgICAgIHRoaXMuJGVsLnNsaWRlVXAoKTtcbiAgICAgICAgdGhpcy52aXNpYmxlID0gdGhpcy5zaG91bGRCZVZpc2libGUoKTtcbiAgICB9LFxuXG4gICAgc2hvdWxkQmVWaXNpYmxlIDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICghdGhpcy5vcHRpb25zLmNvbmRpdGlvbmFsKVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIHJldHVybiB0aGlzLm9wdGlvbnMuY29uZGl0aW9uYWwodGhpcy5tb2RlbCk7XG4gICAgfSxcblxuICAgIGluaXRpYWxpemUgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gQWRqdXN0IHZpc2liaWxpdHkgYmFzZWQgb24gbW9kZWxcbiAgICAgICAgdGhpcy5tb2RlbC5vbihcImNoYW5nZVwiLCB0aGlzLnVwZGF0ZVZpc2liaWxpdHksIHRoaXMpO1xuXG4gICAgICAgIC8vIFJlLXJlbmRlciBiYXNlZCBvbiBtb2RlbCBjaGFuZ2VzXG4gICAgICAgIHRoaXMubW9kZWwub24oXCJjaGFuZ2U6XCIgKyB0aGlzLmlkLCB0aGlzLnJlbmRlciwgdGhpcyk7XG5cbiAgICAgICAgdGhpcy5yZXF1aXJlZCA9IHRoaXMub3B0aW9ucy5yZXF1aXJlZDtcblxuICAgICAgICAvLyBTYXZlIGNvbnRleHRcbiAgICAgICAgdGhpcy5jdHggPSB0aGlzLm9wdGlvbnMuY3R4IHx8IHt9O1xuXG4gICAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgfSxcblxuICAgIHJlbmRlciA6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLiRlbC5odG1sKHRoaXMudGVtcGxhdGUodGhpcykpO1xuXG4gICAgICAgIC8vIFJlbmRlciBhbnN3ZXJcbiAgICAgICAgdGhpcy5yZW5kZXJBbnN3ZXIodGhpcy4kKFwiLmFuc3dlclwiKSk7XG5cbiAgICAgICAgdGhpcy4kZWwudG9nZ2xlKHRoaXMuc2hvdWxkQmVWaXNpYmxlKCkpO1xuICAgICAgICB0aGlzLnZpc2libGUgPSB0aGlzLnNob3VsZEJlVmlzaWJsZSgpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbn0pO1xuXG5leHBvcnRzLlJhZGlvUXVlc3Rpb24gPSBleHBvcnRzLlF1ZXN0aW9uLmV4dGVuZCh7XG4gICAgZXZlbnRzIDoge1xuICAgICAgICBcImNoZWNrZWRcIiA6IFwiY2hlY2tlZFwiLFxuICAgIH0sXG5cbiAgICBjaGVja2VkIDogZnVuY3Rpb24oZSkge1xuICAgICAgICB2YXIgaW5kZXggPSBwYXJzZUludChlLnRhcmdldC5nZXRBdHRyaWJ1dGUoXCJkYXRhLXZhbHVlXCIpKTtcbiAgICAgICAgdmFyIHZhbHVlID0gdGhpcy5vcHRpb25zLm9wdGlvbnNbaW5kZXhdWzBdO1xuICAgICAgICB0aGlzLm1vZGVsLnNldCh0aGlzLmlkLCB2YWx1ZSk7XG4gICAgfSxcblxuICAgIHJlbmRlckFuc3dlciA6IGZ1bmN0aW9uKGFuc3dlckVsKSB7XG4gICAgICAgIGFuc3dlckVsLmh0bWwoXy50ZW1wbGF0ZSgnPGRpdiBjbGFzcz1cInJhZGlvLWdyb3VwXCI+PCU9cmVuZGVyUmFkaW9PcHRpb25zKCklPjwvZGl2PicsIHRoaXMpKTtcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5yZWFkb25seSlcbiAgICAgICAgICAgIGFuc3dlckVsLmZpbmQoXCIucmFkaW8tZ3JvdXBcIikuYWRkQ2xhc3MoXCJyZWFkb25seVwiKTtcbiAgICB9LFxuXG4gICAgcmVuZGVyUmFkaW9PcHRpb25zIDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGh0bWwgPSBcIlwiO1xuICAgICAgICB2YXIgaTtcbiAgICAgICAgZm9yICggaSA9IDA7IGkgPCB0aGlzLm9wdGlvbnMub3B0aW9ucy5sZW5ndGg7IGkrKylcbiAgICAgICAgICAgIGh0bWwgKz0gXy50ZW1wbGF0ZSgnPGRpdiBjbGFzcz1cInJhZGlvLWJ1dHRvbiA8JT1jaGVja2VkJT5cIiBkYXRhLXZhbHVlPVwiPCU9cG9zaXRpb24lPlwiPjwlPXRleHQlPjwvZGl2PicsIHtcbiAgICAgICAgICAgICAgICBwb3NpdGlvbiA6IGksXG4gICAgICAgICAgICAgICAgdGV4dCA6IHRoaXMub3B0aW9ucy5vcHRpb25zW2ldWzFdLFxuICAgICAgICAgICAgICAgIGNoZWNrZWQgOiB0aGlzLm1vZGVsLmdldCh0aGlzLmlkKSA9PT0gdGhpcy5vcHRpb25zLm9wdGlvbnNbaV1bMF0gPyBcImNoZWNrZWRcIiA6IFwiXCJcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBodG1sO1xuICAgIH1cblxufSk7XG5cbmV4cG9ydHMuQ2hlY2tRdWVzdGlvbiA9IGV4cG9ydHMuUXVlc3Rpb24uZXh0ZW5kKHtcbiAgICBldmVudHMgOiB7XG4gICAgICAgIFwiY2hlY2tlZFwiIDogXCJjaGVja2VkXCIsXG4gICAgfSxcblxuICAgIGNoZWNrZWQgOiBmdW5jdGlvbihlKSB7XG4gICAgICAgIC8vIEdldCBjaGVja2VkXG4gICAgICAgIHRoaXMubW9kZWwuc2V0KHRoaXMuaWQsIHRoaXMuJChcIi5jaGVja2JveFwiKS5oYXNDbGFzcyhcImNoZWNrZWRcIikpO1xuICAgIH0sXG5cbiAgICByZW5kZXJBbnN3ZXIgOiBmdW5jdGlvbihhbnN3ZXJFbCkge1xuICAgICAgICB2YXIgaTtcbiAgICAgICAgYW5zd2VyRWwuYXBwZW5kKCQoXy50ZW1wbGF0ZSgnPGRpdiBjbGFzcz1cImNoZWNrYm94IDwlPWNoZWNrZWQlPlwiPjwlPXRleHQlPjwvZGl2PicsIHtcbiAgICAgICAgICAgIHRleHQgOiB0aGlzLm9wdGlvbnMudGV4dCxcbiAgICAgICAgICAgIGNoZWNrZWQgOiAodGhpcy5tb2RlbC5nZXQodGhpcy5pZCkpID8gXCJjaGVja2VkXCIgOiBcIlwiXG4gICAgICAgIH0pKSk7XG4gICAgfVxuXG59KTtcblxuXG5leHBvcnRzLk11bHRpY2hlY2tRdWVzdGlvbiA9IGV4cG9ydHMuUXVlc3Rpb24uZXh0ZW5kKHtcbiAgICBldmVudHMgOiB7XG4gICAgICAgIFwiY2hlY2tlZFwiIDogXCJjaGVja2VkXCIsXG4gICAgfSxcblxuICAgIGNoZWNrZWQgOiBmdW5jdGlvbihlKSB7XG4gICAgICAgIC8vIEdldCBhbGwgY2hlY2tlZFxuICAgICAgICB2YXIgdmFsdWUgPSBbXTtcbiAgICAgICAgdmFyIG9wdHMgPSB0aGlzLm9wdGlvbnMub3B0aW9ucztcbiAgICAgICAgdGhpcy4kKFwiLmNoZWNrYm94XCIpLmVhY2goZnVuY3Rpb24oaW5kZXgpIHtcbiAgICAgICAgICAgIGlmICgkKHRoaXMpLmhhc0NsYXNzKFwiY2hlY2tlZFwiKSlcbiAgICAgICAgICAgICAgICB2YWx1ZS5wdXNoKG9wdHNbaW5kZXhdWzBdKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMubW9kZWwuc2V0KHRoaXMuaWQsIHZhbHVlKTtcbiAgICB9LFxuXG4gICAgcmVuZGVyQW5zd2VyIDogZnVuY3Rpb24oYW5zd2VyRWwpIHtcbiAgICAgICAgdmFyIGk7XG4gICAgICAgIGZvciAoIGkgPSAwOyBpIDwgdGhpcy5vcHRpb25zLm9wdGlvbnMubGVuZ3RoOyBpKyspXG4gICAgICAgICAgICBhbnN3ZXJFbC5hcHBlbmQoJChfLnRlbXBsYXRlKCc8ZGl2IGNsYXNzPVwiY2hlY2tib3ggPCU9Y2hlY2tlZCU+XCIgZGF0YS12YWx1ZT1cIjwlPXBvc2l0aW9uJT5cIj48JT10ZXh0JT48L2Rpdj4nLCB7XG4gICAgICAgICAgICAgICAgcG9zaXRpb24gOiBpLFxuICAgICAgICAgICAgICAgIHRleHQgOiB0aGlzLm9wdGlvbnMub3B0aW9uc1tpXVsxXSxcbiAgICAgICAgICAgICAgICBjaGVja2VkIDogKHRoaXMubW9kZWwuZ2V0KHRoaXMuaWQpICYmIF8uY29udGFpbnModGhpcy5tb2RlbC5nZXQodGhpcy5pZCksIHRoaXMub3B0aW9ucy5vcHRpb25zW2ldWzBdKSkgPyBcImNoZWNrZWRcIiA6IFwiXCJcbiAgICAgICAgICAgIH0pKSk7XG4gICAgfVxuXG59KTtcblxuZXhwb3J0cy5UZXh0UXVlc3Rpb24gPSBleHBvcnRzLlF1ZXN0aW9uLmV4dGVuZCh7XG4gICAgcmVuZGVyQW5zd2VyIDogZnVuY3Rpb24oYW5zd2VyRWwpIHtcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5tdWx0aWxpbmUpIHtcbiAgICAgICAgICAgIGFuc3dlckVsLmh0bWwoXy50ZW1wbGF0ZSgnPHRleHRhcmVhIHN0eWxlPVwid2lkdGg6OTAlXCIvPicsIHRoaXMpKTsgLy8gVE9ETyBtYWtlIHdpZHRoIHByb3Blcmx5XG4gICAgICAgICAgICBhbnN3ZXJFbC5maW5kKFwidGV4dGFyZWFcIikudmFsKHRoaXMubW9kZWwuZ2V0KHRoaXMuaWQpKTtcbiAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMucmVhZG9ubHkpXG4gICAgICAgICAgICAgICAgYW5zd2VyRWwuZmluZChcInRleHRhcmVhXCIpLmF0dHIoXCJyZWFkb25seVwiLCBcInJlYWRvbmx5XCIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYW5zd2VyRWwuaHRtbChfLnRlbXBsYXRlKCc8aW5wdXQgdHlwZT1cInRleHRcIi8+JywgdGhpcykpO1xuICAgICAgICAgICAgYW5zd2VyRWwuZmluZChcImlucHV0XCIpLnZhbCh0aGlzLm1vZGVsLmdldCh0aGlzLmlkKSk7XG4gICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLnJlYWRvbmx5KVxuICAgICAgICAgICAgICAgIGFuc3dlckVsLmZpbmQoXCJpbnB1dFwiKS5hdHRyKFwicmVhZG9ubHlcIiwgXCJyZWFkb25seVwiKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBldmVudHMgOiB7XG4gICAgICAgIFwiY2hhbmdlXCIgOiBcImNoYW5nZWRcIlxuICAgIH0sXG4gICAgY2hhbmdlZCA6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLm1vZGVsLnNldCh0aGlzLmlkLCB0aGlzLiQodGhpcy5vcHRpb25zLm11bHRpbGluZSA/IFwidGV4dGFyZWFcIiA6IFwiaW5wdXRcIikudmFsKCkpO1xuICAgIH1cblxufSk7XG4iLCIjIEdyb3VwIG9mIHF1ZXN0aW9ucyB3aGljaCB2YWxpZGF0ZSBhcyBhIHVuaXRcblxubW9kdWxlLmV4cG9ydHMgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZFxuICBpbml0aWFsaXplOiAtPlxuICAgIEBjb250ZW50cyA9IEBvcHRpb25zLmNvbnRlbnRzXG4gICAgQHJlbmRlcigpXG5cbiAgdmFsaWRhdGU6IC0+XG4gICAgIyBHZXQgYWxsIHZpc2libGUgaXRlbXNcbiAgICBpdGVtcyA9IF8uZmlsdGVyKEBjb250ZW50cywgKGMpIC0+XG4gICAgICBjLnZpc2libGUgYW5kIGMudmFsaWRhdGVcbiAgICApXG4gICAgcmV0dXJuIG5vdCBfLmFueShfLm1hcChpdGVtcywgKGl0ZW0pIC0+XG4gICAgICBpdGVtLnZhbGlkYXRlKClcbiAgICApKVxuXG4gIHJlbmRlcjogLT5cbiAgICBAJGVsLmh0bWwgXCJcIlxuICAgIFxuICAgICMgQWRkIGNvbnRlbnRzIChxdWVzdGlvbnMsIG1vc3RseSlcbiAgICBfLmVhY2ggQGNvbnRlbnRzLCAoYykgPT4gQCRlbC5hcHBlbmQgYy4kZWxcblxuICAgIHRoaXNcbiIsIiMgRm9ybSB0aGF0IGhhcyBzYXZlIGFuZCBjYW5jZWwgYnV0dG9ucyB0aGF0IGZpcmUgc2F2ZSBhbmQgY2FuY2VsIGV2ZW50cy5cbiMgU2F2ZSBldmVudCB3aWxsIG9ubHkgYmUgZmlyZWQgaWYgdmFsaWRhdGVzXG5cbm1vZHVsZS5leHBvcnRzID0gQmFja2JvbmUuVmlldy5leHRlbmRcbiAgaW5pdGlhbGl6ZTogLT5cbiAgICBAY29udGVudHMgPSBAb3B0aW9ucy5jb250ZW50c1xuICAgIEByZW5kZXIoKVxuXG4gIGV2ZW50czogXG4gICAgJ2NsaWNrICNzYXZlX2J1dHRvbic6ICdzYXZlJ1xuICAgICdjbGljayAjY2FuY2VsX2J1dHRvbic6ICdjYW5jZWwnXG5cbiAgdmFsaWRhdGU6IC0+XG4gICAgIyBHZXQgYWxsIHZpc2libGUgaXRlbXNcbiAgICBpdGVtcyA9IF8uZmlsdGVyKEBjb250ZW50cywgKGMpIC0+XG4gICAgICBjLnZpc2libGUgYW5kIGMudmFsaWRhdGVcbiAgICApXG4gICAgcmV0dXJuIG5vdCBfLmFueShfLm1hcChpdGVtcywgKGl0ZW0pIC0+XG4gICAgICBpdGVtLnZhbGlkYXRlKClcbiAgICApKVxuXG4gIHJlbmRlcjogLT5cbiAgICBAJGVsLmh0bWwgJycnPGRpdiBpZD1cImNvbnRlbnRzXCI+PC9kaXY+XG4gICAgPGRpdj5cbiAgICAgICAgPGJ1dHRvbiBpZD1cInNhdmVfYnV0dG9uXCIgdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwiYnRuIGJ0bi1wcmltYXJ5IG1hcmdpbmVkXCI+U2F2ZTwvYnV0dG9uPlxuICAgICAgICAmbmJzcDtcbiAgICAgICAgPGJ1dHRvbiBpZD1cImNhbmNlbF9idXR0b25cIiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJidG4gbWFyZ2luZWRcIj5DYW5jZWw8L2J1dHRvbj5cbiAgICA8L2Rpdj4nJydcbiAgICBcbiAgICAjIEFkZCBjb250ZW50cyAocXVlc3Rpb25zLCBtb3N0bHkpXG4gICAgXy5lYWNoIEBjb250ZW50cywgKGMpID0+IEAkKCcjY29udGVudHMnKS5hcHBlbmQgYy4kZWxcbiAgICB0aGlzXG5cbiAgc2F2ZTogLT5cbiAgICBpZiBAdmFsaWRhdGUoKVxuICAgICAgQHRyaWdnZXIgJ3NhdmUnXG5cbiAgY2FuY2VsOiAtPlxuICAgIEB0cmlnZ2VyICdjYW5jZWwnXG4iLCJtb2R1bGUuZXhwb3J0cyA9IEJhY2tib25lLlZpZXcuZXh0ZW5kXG4gIGluaXRpYWxpemU6IC0+XG4gICAgQCRlbC5odG1sIF8udGVtcGxhdGUoJycnXG4gICAgICA8ZGl2IGNsYXNzPVwid2VsbCB3ZWxsLXNtYWxsXCI+PCU9aHRtbCU+PCUtdGV4dCU+PC9kaXY+XG4gICAgICAnJycpKGh0bWw6IEBvcHRpb25zLmh0bWwsIHRleHQ6IEBvcHRpb25zLnRleHQpXG4iLCJRdWVzdGlvbiA9IHJlcXVpcmUoJy4vZm9ybS1jb250cm9scycpLlF1ZXN0aW9uXG5cbm1vZHVsZS5leHBvcnRzID0gUXVlc3Rpb24uZXh0ZW5kKFxuICBldmVudHM6XG4gICAgY2hhbmdlOiBcImNoYW5nZWRcIlxuXG4gIHNldE9wdGlvbnM6IChvcHRpb25zKSAtPlxuICAgIEBvcHRpb25zLm9wdGlvbnMgPSBvcHRpb25zXG4gICAgQHJlbmRlcigpXG5cbiAgY2hhbmdlZDogKGUpIC0+XG4gICAgdmFsID0gJChlLnRhcmdldCkudmFsKClcbiAgICBpZiB2YWwgaXMgXCJcIlxuICAgICAgQG1vZGVsLnNldCBAaWQsIG51bGxcbiAgICBlbHNlXG4gICAgICBpbmRleCA9IHBhcnNlSW50KHZhbClcbiAgICAgIHZhbHVlID0gQG9wdGlvbnMub3B0aW9uc1tpbmRleF1bMF1cbiAgICAgIEBtb2RlbC5zZXQgQGlkLCB2YWx1ZVxuXG4gIHJlbmRlckFuc3dlcjogKGFuc3dlckVsKSAtPlxuICAgIGFuc3dlckVsLmh0bWwgXy50ZW1wbGF0ZShcIjxzZWxlY3QgaWQ9XFxcInNvdXJjZV90eXBlXFxcIj48JT1yZW5kZXJEcm9wZG93bk9wdGlvbnMoKSU+PC9zZWxlY3Q+XCIsIHRoaXMpXG4gICAgIyBDaGVjayBpZiBhbnN3ZXIgcHJlc2VudCBcbiAgICBpZiBub3QgXy5hbnkoQG9wdGlvbnMub3B0aW9ucywgKG9wdCkgPT4gb3B0WzBdID09IEBtb2RlbC5nZXQoQGlkKSkgYW5kIEBtb2RlbC5nZXQoQGlkKT9cbiAgICAgIEAkKFwic2VsZWN0XCIpLmF0dHIoJ2Rpc2FibGVkJywgJ2Rpc2FibGVkJylcblxuICByZW5kZXJEcm9wZG93bk9wdGlvbnM6IC0+XG4gICAgaHRtbCA9IFwiXCJcbiAgICBcbiAgICAjIEFkZCBlbXB0eSBvcHRpb25cbiAgICBodG1sICs9IFwiPG9wdGlvbiB2YWx1ZT1cXFwiXFxcIj48L29wdGlvbj5cIlxuICAgIGZvciBpIGluIFswLi4uQG9wdGlvbnMub3B0aW9ucy5sZW5ndGhdXG4gICAgICBodG1sICs9IF8udGVtcGxhdGUoXCI8b3B0aW9uIHZhbHVlPVxcXCI8JT1wb3NpdGlvbiU+XFxcIiA8JT1zZWxlY3RlZCU+PjwlLXRleHQlPjwvb3B0aW9uPlwiLFxuICAgICAgICBwb3NpdGlvbjogaVxuICAgICAgICB0ZXh0OiBAb3B0aW9ucy5vcHRpb25zW2ldWzFdXG4gICAgICAgIHNlbGVjdGVkOiAoaWYgQG1vZGVsLmdldChAaWQpIGlzIEBvcHRpb25zLm9wdGlvbnNbaV1bMF0gdGhlbiBcInNlbGVjdGVkPVxcXCJzZWxlY3RlZFxcXCJcIiBlbHNlIFwiXCIpXG4gICAgICApXG4gICAgcmV0dXJuIGh0bWxcbikiLCIjIFRPRE8gRml4IHRvIGhhdmUgZWRpdGFibGUgWVlZWS1NTS1ERCB3aXRoIGNsaWNrIHRvIHBvcHVwIHNjcm9sbGVyXG5cblF1ZXN0aW9uID0gcmVxdWlyZSgnLi9mb3JtLWNvbnRyb2xzJykuUXVlc3Rpb25cblxubW9kdWxlLmV4cG9ydHMgPSBRdWVzdGlvbi5leHRlbmRcbiAgZXZlbnRzOlxuICAgIGNoYW5nZTogXCJjaGFuZ2VkXCJcblxuICBjaGFuZ2VkOiAtPlxuICAgIEBtb2RlbC5zZXQgQGlkLCBAJGVsLmZpbmQoXCJpbnB1dFtuYW1lPVxcXCJkYXRlXFxcIl1cIikudmFsKClcblxuICByZW5kZXJBbnN3ZXI6IChhbnN3ZXJFbCkgLT5cbiAgICBhbnN3ZXJFbC5odG1sIF8udGVtcGxhdGUoXCI8aW5wdXQgY2xhc3M9XFxcIm5lZWRzY2xpY2tcXFwiIG5hbWU9XFxcImRhdGVcXFwiIC8+XCIsIHRoaXMpXG4gICAgYW5zd2VyRWwuZmluZChcImlucHV0XCIpLnZhbCBAbW9kZWwuZ2V0KEBpZClcblxuICAgICMgU3VwcG9ydCByZWFkb25seVxuICAgIGlmIEBvcHRpb25zLnJlYWRvbmx5XG4gICAgICBhbnN3ZXJFbC5maW5kKFwiaW5wdXRcIikuYXR0cigncmVhZG9ubHknLCAncmVhZG9ubHknKVxuICAgIGVsc2VcbiAgICAgIGFuc3dlckVsLmZpbmQoXCJpbnB1dFwiKS5zY3JvbGxlclxuICAgICAgICBwcmVzZXQ6IFwiZGF0ZVwiXG4gICAgICAgIHRoZW1lOiBcImlvc1wiXG4gICAgICAgIGRpc3BsYXk6IFwibW9kYWxcIlxuICAgICAgICBtb2RlOiBcInNjcm9sbGVyXCJcbiAgICAgICAgZGF0ZU9yZGVyOiBcInl5bW1EIGRkXCJcbiAgICAgICAgZGF0ZUZvcm1hdDogXCJ5eS1tbS1kZFwiXG4iLCJRdWVzdGlvbiA9IHJlcXVpcmUoJy4vZm9ybS1jb250cm9scycpLlF1ZXN0aW9uXG5cbm1vZHVsZS5leHBvcnRzID0gUXVlc3Rpb24uZXh0ZW5kXG4gIHJlbmRlckFuc3dlcjogKGFuc3dlckVsKSAtPlxuICAgIGFuc3dlckVsLmh0bWwgXy50ZW1wbGF0ZShcIjxpbnB1dCB0eXBlPVxcXCJudW1iZXJcXFwiIDwlIGlmIChvcHRpb25zLmRlY2ltYWwpIHslPnN0ZXA9XFxcImFueVxcXCI8JX0lPiAvPlwiLCB0aGlzKVxuICAgIGFuc3dlckVsLmZpbmQoXCJpbnB1dFwiKS52YWwgQG1vZGVsLmdldChAaWQpXG5cbiAgZXZlbnRzOlxuICAgIGNoYW5nZTogXCJjaGFuZ2VkXCJcblxuICB2YWxpZGF0ZUludGVybmFsOiAtPlxuICAgIHZhbCA9IEAkKFwiaW5wdXRcIikudmFsKClcbiAgICBpZiBAb3B0aW9ucy5kZWNpbWFsIGFuZCB2YWwubGVuZ3RoID4gMFxuICAgICAgaWYgcGFyc2VGbG9hdCh2YWwpID09IE5hTlxuICAgICAgICByZXR1cm4gXCJJbnZhbGlkIGRlY2ltYWwgbnVtYmVyXCJcbiAgICBlbHNlIGlmIHZhbC5sZW5ndGggPiAwXG4gICAgICBpZiBub3QgdmFsLm1hdGNoKC9eLT9cXGQrJC8pXG4gICAgICAgIHJldHVybiBcIkludmFsaWQgaW50ZWdlciBudW1iZXJcIlxuICAgIHJldHVybiBudWxsXG5cbiAgY2hhbmdlZDogLT5cbiAgICB2YWwgPSBwYXJzZUZsb2F0KEAkKFwiaW5wdXRcIikudmFsKCkpXG4gICAgaWYgdmFsID09IE5hTlxuICAgICAgdmFsID0gbnVsbFxuICAgIEBtb2RlbC5zZXQgQGlkLCB2YWwgXG4iLCJRdWVzdGlvbiA9IHJlcXVpcmUoJy4vZm9ybS1jb250cm9scycpLlF1ZXN0aW9uXG5Tb3VyY2VMaXN0UGFnZSA9IHJlcXVpcmUgJy4uL3BhZ2VzL1NvdXJjZUxpc3RQYWdlJ1xuc291cmNlY29kZXMgPSByZXF1aXJlICcuLi9zb3VyY2Vjb2RlcydcblxubW9kdWxlLmV4cG9ydHMgPSBRdWVzdGlvbi5leHRlbmRcbiAgcmVuZGVyQW5zd2VyOiAoYW5zd2VyRWwpIC0+XG4gICAgYW5zd2VyRWwuaHRtbCAnJydcbiAgICAgIDxkaXYgY2xhc3M9XCJpbnB1dC1hcHBlbmRcIj5cbiAgICAgICAgPGlucHV0IHR5cGU9XCJ0ZWxcIj5cbiAgICAgICAgPGJ1dHRvbiBjbGFzcz1cImJ0blwiIGlkPVwic2VsZWN0XCIgdHlwZT1cImJ1dHRvblwiPlNlbGVjdDwvYnV0dG9uPlxuICAgICAgPC9kaXY+JycnXG4gICAgYW5zd2VyRWwuZmluZChcImlucHV0XCIpLnZhbCBAbW9kZWwuZ2V0KEBpZClcblxuICBldmVudHM6XG4gICAgJ2NoYW5nZScgOiAnY2hhbmdlZCdcbiAgICAnY2xpY2sgI3NlbGVjdCcgOiAnc2VsZWN0U291cmNlJ1xuXG4gIGNoYW5nZWQ6IC0+XG4gICAgQG1vZGVsLnNldCBAaWQsIEAkKFwiaW5wdXRcIikudmFsKClcblxuICBzZWxlY3RTb3VyY2U6IC0+XG4gICAgQGN0eC5wYWdlci5vcGVuUGFnZSBTb3VyY2VMaXN0UGFnZSwgXG4gICAgICB7IG9uU2VsZWN0OiAoc291cmNlKT0+XG4gICAgICAgIEBtb2RlbC5zZXQgQGlkLCBzb3VyY2UuY29kZVxuICAgICAgfVxuXG4gIHZhbGlkYXRlSW50ZXJuYWw6IC0+XG4gICAgaWYgbm90IEAkKFwiaW5wdXRcIikudmFsKClcbiAgICAgIHJldHVybiBmYWxzZVxuXG4gICAgaWYgc291cmNlY29kZXMuaXNWYWxpZChAJChcImlucHV0XCIpLnZhbCgpKVxuICAgICAgcmV0dXJuIGZhbHNlXG5cbiAgICByZXR1cm4gXCJJbnZhbGlkIFNvdXJjZVwiXG5cbiIsIlF1ZXN0aW9uID0gcmVxdWlyZSgnLi9mb3JtLWNvbnRyb2xzJykuUXVlc3Rpb25cbkltYWdlUGFnZSA9IHJlcXVpcmUgJy4uL3BhZ2VzL0ltYWdlUGFnZSdcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBJbWFnZXNRdWVzdGlvbiBleHRlbmRzIFF1ZXN0aW9uXG4gIGV2ZW50czpcbiAgICBcImNsaWNrICNhZGRcIjogXCJhZGRDbGlja1wiXG4gICAgXCJjbGljayAudGh1bWJuYWlsLWltZ1wiOiBcInRodW1ibmFpbENsaWNrXCJcblxuICByZW5kZXJBbnN3ZXI6IChhbnN3ZXJFbCkgLT5cbiAgICAjIFJlbmRlciBpbWFnZSB1c2luZyBpbWFnZSBtYW5hZ2VyXG4gICAgaWYgbm90IEBjdHguaW1hZ2VNYW5hZ2VyXG4gICAgICBhbnN3ZXJFbC5odG1sICcnJzxkaXYgY2xhc3M9XCJ0ZXh0LWVycm9yXCI+SW1hZ2VzIG5vdCBhdmFpbGFibGU8L2Rpdj4nJydcbiAgICBlbHNlXG4gICAgICBpbWFnZXMgPSBAbW9kZWwuZ2V0KEBpZClcblxuICAgICAgIyBEZXRlcm1pbmUgaWYgY2FuIGFkZCBpbWFnZXNcbiAgICAgIG5vdFN1cHBvcnRlZCA9IGZhbHNlXG4gICAgICBpZiBAb3B0aW9ucy5yZWFkb25seVxuICAgICAgICBjYW5BZGQgPSBmYWxzZVxuICAgICAgZWxzZSBpZiBAY3R4LmNhbWVyYSBhbmQgQGN0eC5pbWFnZU1hbmFnZXIuYWRkSW1hZ2VcbiAgICAgICAgY2FuQWRkID0gdHJ1ZVxuICAgICAgZWxzZVxuICAgICAgICBjYW5BZGQgPSBmYWxzZVxuICAgICAgICBub3RTdXBwb3J0ZWQgPSBub3QgaW1hZ2VzIG9yIGltYWdlcy5sZW5ndGggPT0gMFxuXG4gICAgICAjIERldGVybWluZSBpZiB3ZSBuZWVkIHRvIHRlbGwgdXNlciB0aGF0IG5vIGltYWdlIGFyZSBhdmFpbGFibGVcbiAgICAgIG5vSW1hZ2UgPSBub3QgY2FuQWRkIGFuZCAobm90IGltYWdlcyBvciBpbWFnZXMubGVuZ3RoID09IDApIGFuZCBub3Qgbm90U3VwcG9ydGVkXG5cbiAgICAgICMgUmVuZGVyIGltYWdlc1xuICAgICAgYW5zd2VyRWwuaHRtbCB0ZW1wbGF0ZXNbJ2Zvcm1zL0ltYWdlc1F1ZXN0aW9uJ10oaW1hZ2VzOiBpbWFnZXMsIGNhbkFkZDogY2FuQWRkLCBub0ltYWdlOiBub0ltYWdlLCBub3RTdXBwb3J0ZWQ6IG5vdFN1cHBvcnRlZClcblxuICAgICAgIyBTZXQgc291cmNlc1xuICAgICAgaWYgaW1hZ2VzXG4gICAgICAgIGZvciBpbWFnZSBpbiBpbWFnZXNcbiAgICAgICAgICBAc2V0VGh1bWJuYWlsVXJsKGltYWdlLmlkKVxuICAgIFxuICBzZXRUaHVtYm5haWxVcmw6IChpZCkgLT5cbiAgICBzdWNjZXNzID0gKHVybCkgPT5cbiAgICAgIEAkKFwiI1wiICsgaWQpLmF0dHIoXCJzcmNcIiwgdXJsKVxuICAgIEBjdHguaW1hZ2VNYW5hZ2VyLmdldEltYWdlVGh1bWJuYWlsVXJsIGlkLCBzdWNjZXNzLCBAZXJyb3JcblxuICBhZGRDbGljazogLT5cbiAgICAjIENhbGwgY2FtZXJhIHRvIGdldCBpbWFnZVxuICAgIHN1Y2Nlc3MgPSAodXJsKSA9PlxuICAgICAgIyBBZGQgaW1hZ2VcbiAgICAgIEBjdHguaW1hZ2VNYW5hZ2VyLmFkZEltYWdlKHVybCwgKGlkKSA9PlxuICAgICAgICAjIEFkZCB0byBtb2RlbFxuICAgICAgICBpbWFnZXMgPSBAbW9kZWwuZ2V0KEBpZCkgfHwgW11cbiAgICAgICAgaW1hZ2VzLnB1c2ggeyBpZDogaWQgfVxuICAgICAgICBAbW9kZWwuc2V0KEBpZCwgaW1hZ2VzKVxuXG4gICAgICAsIEBjdHguZXJyb3IpXG4gICAgQGN0eC5jYW1lcmEudGFrZVBpY3R1cmUgc3VjY2VzcywgKGVycikgLT5cbiAgICAgIGFsZXJ0KFwiRmFpbGVkIHRvIHRha2UgcGljdHVyZVwiKVxuXG4gIHRodW1ibmFpbENsaWNrOiAoZXYpIC0+XG4gICAgaWQgPSBldi5jdXJyZW50VGFyZ2V0LmlkXG5cbiAgICAjIENyZWF0ZSBvblJlbW92ZSBjYWxsYmFja1xuICAgIG9uUmVtb3ZlID0gKCkgPT4gXG4gICAgICBpbWFnZXMgPSBAbW9kZWwuZ2V0KEBpZCkgfHwgW11cbiAgICAgIGltYWdlcyA9IF8ucmVqZWN0IGltYWdlcywgKGltZykgPT5cbiAgICAgICAgaW1nLmlkID09IGlkXG4gICAgICBAbW9kZWwuc2V0KEBpZCwgaW1hZ2VzKSAgICAgIFxuXG4gICAgQGN0eC5wYWdlci5vcGVuUGFnZShJbWFnZVBhZ2UsIHsgaWQ6IGlkLCBvblJlbW92ZTogb25SZW1vdmUgfSkiLCJRdWVzdGlvbiA9IHJlcXVpcmUoJy4vZm9ybS1jb250cm9scycpLlF1ZXN0aW9uXG5JbWFnZVBhZ2UgPSByZXF1aXJlICcuLi9wYWdlcy9JbWFnZVBhZ2UnXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgSW1hZ2VRdWVzdGlvbiBleHRlbmRzIFF1ZXN0aW9uXG4gIGV2ZW50czpcbiAgICBcImNsaWNrICNhZGRcIjogXCJhZGRDbGlja1wiXG4gICAgXCJjbGljayAudGh1bWJuYWlsLWltZ1wiOiBcInRodW1ibmFpbENsaWNrXCJcblxuICByZW5kZXJBbnN3ZXI6IChhbnN3ZXJFbCkgLT5cbiAgICAjIFJlbmRlciBpbWFnZSB1c2luZyBpbWFnZSBtYW5hZ2VyXG4gICAgaWYgbm90IEBjdHguaW1hZ2VNYW5hZ2VyXG4gICAgICBhbnN3ZXJFbC5odG1sICcnJzxkaXYgY2xhc3M9XCJ0ZXh0LWVycm9yXCI+SW1hZ2VzIG5vdCBhdmFpbGFibGU8L2Rpdj4nJydcbiAgICBlbHNlXG4gICAgICBpbWFnZSA9IEBtb2RlbC5nZXQoQGlkKVxuXG4gICAgICAjIERldGVybWluZSBpZiBjYW4gYWRkIGltYWdlc1xuICAgICAgbm90U3VwcG9ydGVkID0gZmFsc2VcbiAgICAgIGlmIEBvcHRpb25zLnJlYWRvbmx5XG4gICAgICAgIGNhbkFkZCA9IGZhbHNlXG4gICAgICBlbHNlIGlmIEBjdHguY2FtZXJhIGFuZCBAY3R4LmltYWdlTWFuYWdlci5hZGRJbWFnZVxuICAgICAgICBjYW5BZGQgPSBub3QgaW1hZ2U/ICMgRG9uJ3QgYWxsb3cgYWRkaW5nIG1vcmUgdGhhbiBvbmVcbiAgICAgIGVsc2VcbiAgICAgICAgY2FuQWRkID0gZmFsc2VcbiAgICAgICAgbm90U3VwcG9ydGVkID0gbm90IGltYWdlXG5cbiAgICAgICMgRGV0ZXJtaW5lIGlmIHdlIG5lZWQgdG8gdGVsbCB1c2VyIHRoYXQgbm8gaW1hZ2UgaXMgYXZhaWxhYmxlXG4gICAgICBub0ltYWdlID0gbm90IGNhbkFkZCBhbmQgbm90IGltYWdlIGFuZCBub3Qgbm90U3VwcG9ydGVkXG5cbiAgICAgICMgUmVuZGVyIGltYWdlc1xuICAgICAgYW5zd2VyRWwuaHRtbCB0ZW1wbGF0ZXNbJ2Zvcm1zL0ltYWdlUXVlc3Rpb24nXShpbWFnZTogaW1hZ2UsIGNhbkFkZDogY2FuQWRkLCBub0ltYWdlOiBub0ltYWdlLCBub3RTdXBwb3J0ZWQ6IG5vdFN1cHBvcnRlZClcblxuICAgICAgIyBTZXQgc291cmNlXG4gICAgICBpZiBpbWFnZVxuICAgICAgICBAc2V0VGh1bWJuYWlsVXJsKGltYWdlLmlkKVxuICAgIFxuICBzZXRUaHVtYm5haWxVcmw6IChpZCkgLT5cbiAgICBzdWNjZXNzID0gKHVybCkgPT5cbiAgICAgIEAkKFwiI1wiICsgaWQpLmF0dHIoXCJzcmNcIiwgdXJsKVxuICAgIEBjdHguaW1hZ2VNYW5hZ2VyLmdldEltYWdlVGh1bWJuYWlsVXJsIGlkLCBzdWNjZXNzLCBAZXJyb3JcblxuICBhZGRDbGljazogLT5cbiAgICAjIENhbGwgY2FtZXJhIHRvIGdldCBpbWFnZVxuICAgIHN1Y2Nlc3MgPSAodXJsKSA9PlxuICAgICAgIyBBZGQgaW1hZ2VcbiAgICAgIEBjdHguaW1hZ2VNYW5hZ2VyLmFkZEltYWdlKHVybCwgKGlkKSA9PlxuICAgICAgICAjIEFkZCB0byBtb2RlbFxuICAgICAgICBAbW9kZWwuc2V0KEBpZCwgeyBpZDogaWQgfSlcbiAgICAgICwgQGN0eC5lcnJvcilcbiAgICBAY3R4LmNhbWVyYS50YWtlUGljdHVyZSBzdWNjZXNzLCAoZXJyKSAtPlxuICAgICAgYWxlcnQoXCJGYWlsZWQgdG8gdGFrZSBwaWN0dXJlXCIpXG5cbiAgdGh1bWJuYWlsQ2xpY2s6IChldikgLT5cbiAgICBpZCA9IGV2LmN1cnJlbnRUYXJnZXQuaWRcblxuICAgICMgQ3JlYXRlIG9uUmVtb3ZlIGNhbGxiYWNrXG4gICAgb25SZW1vdmUgPSAoKSA9PiBcbiAgICAgIEBtb2RlbC5zZXQoQGlkLCBudWxsKVxuXG4gICAgQGN0eC5wYWdlci5vcGVuUGFnZShJbWFnZVBhZ2UsIHsgaWQ6IGlkLCBvblJlbW92ZTogb25SZW1vdmUgfSkiLCIjIEltcHJvdmVkIGxvY2F0aW9uIGZpbmRlclxuY2xhc3MgTG9jYXRpb25GaW5kZXJcbiAgY29uc3RydWN0b3I6IC0+XG4gICAgXy5leHRlbmQgQCwgQmFja2JvbmUuRXZlbnRzXG4gICAgXG4gIGdldExvY2F0aW9uOiAtPlxuICAgICMgQm90aCBmYWlsdXJlcyBhcmUgcmVxdWlyZWQgdG8gdHJpZ2dlciBlcnJvclxuICAgIGxvY2F0aW9uRXJyb3IgPSBfLmFmdGVyIDIsID0+XG4gICAgICBAdHJpZ2dlciAnZXJyb3InXG5cbiAgICBoaWdoQWNjdXJhY3lGaXJlZCA9IGZhbHNlXG5cbiAgICBsb3dBY2N1cmFjeSA9IChwb3MpID0+XG4gICAgICBpZiBub3QgaGlnaEFjY3VyYWN5RmlyZWRcbiAgICAgICAgQHRyaWdnZXIgJ2ZvdW5kJywgcG9zXG5cbiAgICBoaWdoQWNjdXJhY3kgPSAocG9zKSA9PlxuICAgICAgaGlnaEFjY3VyYWN5RmlyZWQgPSB0cnVlXG4gICAgICBAdHJpZ2dlciAnZm91bmQnLCBwb3NcblxuICAgICMgR2V0IGJvdGggaGlnaCBhbmQgbG93IGFjY3VyYWN5LCBhcyBsb3cgaXMgc3VmZmljaWVudCBmb3IgaW5pdGlhbCBkaXNwbGF5XG4gICAgbmF2aWdhdG9yLmdlb2xvY2F0aW9uLmdldEN1cnJlbnRQb3NpdGlvbihsb3dBY2N1cmFjeSwgbG9jYXRpb25FcnJvciwge1xuICAgICAgICBtYXhpbXVtQWdlIDogMzYwMCoyNCxcbiAgICAgICAgdGltZW91dCA6IDEwMDAwLFxuICAgICAgICBlbmFibGVIaWdoQWNjdXJhY3kgOiBmYWxzZVxuICAgIH0pXG5cbiAgICBuYXZpZ2F0b3IuZ2VvbG9jYXRpb24uZ2V0Q3VycmVudFBvc2l0aW9uKGhpZ2hBY2N1cmFjeSwgbG9jYXRpb25FcnJvciwge1xuICAgICAgICBtYXhpbXVtQWdlIDogMzYwMCxcbiAgICAgICAgdGltZW91dCA6IDMwMDAwLFxuICAgICAgICBlbmFibGVIaWdoQWNjdXJhY3kgOiB0cnVlXG4gICAgfSlcblxuICBzdGFydFdhdGNoOiAtPlxuICAgICMgQWxsb3cgb25lIHdhdGNoIGF0IG1vc3RcbiAgICBpZiBAbG9jYXRpb25XYXRjaElkP1xuICAgICAgQHN0b3BXYXRjaCgpXG5cbiAgICBoaWdoQWNjdXJhY3lGaXJlZCA9IGZhbHNlXG4gICAgbG93QWNjdXJhY3lGaXJlZCA9IGZhbHNlXG5cbiAgICBsb3dBY2N1cmFjeSA9IChwb3MpID0+XG4gICAgICBpZiBub3QgaGlnaEFjY3VyYWN5RmlyZWRcbiAgICAgICAgbG93QWNjdXJhY3lGaXJlZCA9IHRydWVcbiAgICAgICAgQHRyaWdnZXIgJ2ZvdW5kJywgcG9zXG5cbiAgICBoaWdoQWNjdXJhY3kgPSAocG9zKSA9PlxuICAgICAgaGlnaEFjY3VyYWN5RmlyZWQgPSB0cnVlXG4gICAgICBAdHJpZ2dlciAnZm91bmQnLCBwb3NcblxuICAgIGVycm9yID0gKGVycm9yKSA9PlxuICAgICAgY29uc29sZS5sb2cgXCIjIyMgZXJyb3IgXCJcbiAgICAgICMgTm8gZXJyb3IgaWYgZmlyZWQgb25jZVxuICAgICAgaWYgbm90IGxvd0FjY3VyYWN5RmlyZWQgYW5kIG5vdCBoaWdoQWNjdXJhY3lGaXJlZFxuICAgICAgICBAdHJpZ2dlciAnZXJyb3InLCBlcnJvclxuXG4gICAgIyBGaXJlIGluaXRpYWwgbG93LWFjY3VyYWN5IG9uZVxuICAgIG5hdmlnYXRvci5nZW9sb2NhdGlvbi5nZXRDdXJyZW50UG9zaXRpb24obG93QWNjdXJhY3ksIGVycm9yLCB7XG4gICAgICAgIG1heGltdW1BZ2UgOiAzNjAwKjI0LFxuICAgICAgICB0aW1lb3V0IDogMTAwMDAsXG4gICAgICAgIGVuYWJsZUhpZ2hBY2N1cmFjeSA6IGZhbHNlXG4gICAgfSlcblxuICAgIEBsb2NhdGlvbldhdGNoSWQgPSBuYXZpZ2F0b3IuZ2VvbG9jYXRpb24ud2F0Y2hQb3NpdGlvbihoaWdoQWNjdXJhY3ksIGVycm9yLCB7XG4gICAgICAgIG1heGltdW1BZ2UgOiAzMDAwLFxuICAgICAgICBlbmFibGVIaWdoQWNjdXJhY3kgOiB0cnVlXG4gICAgfSkgIFxuXG4gIHN0b3BXYXRjaDogLT5cbiAgICBpZiBAbG9jYXRpb25XYXRjaElkP1xuICAgICAgbmF2aWdhdG9yLmdlb2xvY2F0aW9uLmNsZWFyV2F0Y2goQGxvY2F0aW9uV2F0Y2hJZClcbiAgICAgIEBsb2NhdGlvbldhdGNoSWQgPSB1bmRlZmluZWRcblxuXG5tb2R1bGUuZXhwb3J0cyA9IExvY2F0aW9uRmluZGVyICAiLCIjIFBhZ2UgdGhhdCBpcyBkaXNwbGF5ZWQgYnkgdGhlIFBhZ2VyLiBQYWdlcyBoYXZlIHRoZSBmb2xsb3dpbmcgbGlmZWN5Y2xlOlxuIyBjcmVhdGUsIGFjdGl2YXRlLCBbZGVhY3RpdmF0ZSwgYWN0aXZhdGUuLi5dLCBkZWFjdGl2YXRlLCBkZXN0cm95XG4jIENvbnRleHQgaXMgbWl4ZWQgaW4gdG8gdGhlIHBhZ2Ugb2JqZWN0XG4jIFN0YXRpYyBtZXRob2QgXCJjYW5PcGVuKGN0eClcIiwgaWYgcHJlc2VudCwgY2FuIGZvcmJpZCBvcGVuaW5nIHBhZ2UgaWYgaXQgcmV0dXJucyBmYWxzZVxuIyBVc2VmdWwgZm9yIGRpc3BsYXlpbmcgbWVudXMgd2l0aCBwYWdlIGxpc3RzLlxuXG5jbGFzcyBQYWdlIGV4dGVuZHMgQmFja2JvbmUuVmlld1xuICBjb25zdHJ1Y3RvcjogKGN0eCwgb3B0aW9ucz17fSkgLT5cbiAgICBzdXBlcihvcHRpb25zKVxuICAgIEBjdHggPSBjdHhcblxuICAgICMgTWl4IGluIGNvbnRleHQgZm9yIGNvbnZlbmllbmNlXG4gICAgXy5kZWZhdWx0cyhALCBjdHgpIFxuXG4gICAgIyBTdG9yZSBzdWJ2aWV3c1xuICAgIEBfc3Vidmlld3MgPSBbXVxuXG4gICAgIyBTZXR1cCBkZWZhdWx0IGJ1dHRvbiBiYXJcbiAgICBAYnV0dG9uQmFyID0gbmV3IEJ1dHRvbkJhcigpXG5cbiAgICAjIFNldHVwIGRlZmF1bHQgY29udGV4dCBtZW51XG4gICAgQGNvbnRleHRNZW51ID0gbmV3IENvbnRleHRNZW51KClcblxuICBjbGFzc05hbWU6IFwicGFnZVwiXG5cbiAgQGNhbk9wZW46IChjdHgpIC0+IHRydWVcbiAgY3JlYXRlOiAtPlxuICBhY3RpdmF0ZTogLT5cbiAgZGVhY3RpdmF0ZTogLT5cbiAgZGVzdHJveTogLT5cbiAgcmVtb3ZlOiAtPlxuICAgIEByZW1vdmVTdWJ2aWV3cygpXG4gICAgc3VwZXIoKVxuXG4gIGdldFRpdGxlOiAtPiBAdGl0bGVcblxuICBzZXRUaXRsZTogKHRpdGxlKSAtPlxuICAgIEB0aXRsZSA9IHRpdGxlXG4gICAgQHRyaWdnZXIgJ2NoYW5nZTp0aXRsZSdcblxuICBhZGRTdWJ2aWV3OiAodmlldykgLT5cbiAgICBAX3N1YnZpZXdzLnB1c2godmlldylcblxuICByZW1vdmVTdWJ2aWV3czogLT5cbiAgICBmb3Igc3VidmlldyBpbiBAX3N1YnZpZXdzXG4gICAgICBzdWJ2aWV3LnJlbW92ZSgpXG5cbiAgZ2V0QnV0dG9uQmFyOiAtPlxuICAgIHJldHVybiBAYnV0dG9uQmFyXG5cbiAgZ2V0Q29udGV4dE1lbnU6IC0+XG4gICAgcmV0dXJuIEBjb250ZXh0TWVudVxuXG4gIHNldHVwQnV0dG9uQmFyOiAoaXRlbXMpIC0+XG4gICAgIyBTZXR1cCBidXR0b24gYmFyXG4gICAgQGJ1dHRvbkJhci5zZXR1cChpdGVtcylcblxuICBzZXR1cENvbnRleHRNZW51OiAoaXRlbXMpIC0+XG4gICAgIyBTZXR1cCBjb250ZXh0IG1lbnVcbiAgICBAY29udGV4dE1lbnUuc2V0dXAoaXRlbXMpXG5cbiMgU3RhbmRhcmQgYnV0dG9uIGJhci4gRWFjaCBpdGVtXG4jIGhhcyBvcHRpb25hbCBcInRleHRcIiwgb3B0aW9uYWwgXCJpY29uXCIgYW5kIFwiY2xpY2tcIiAoYWN0aW9uKS5cbiMgRm9yIHN1Ym1lbnUsIGFkZCBhcnJheSB0byBcIm1lbnVcIi4gT25lIGxldmVsIG5lc3Rpbmcgb25seS5cbmNsYXNzIEJ1dHRvbkJhciBleHRlbmRzIEJhY2tib25lLlZpZXdcbiAgZXZlbnRzOiBcbiAgICBcImNsaWNrIC5tZW51aXRlbVwiIDogXCJjbGlja01lbnVJdGVtXCJcblxuICBzZXR1cDogKGl0ZW1zKSAtPlxuICAgIEBpdGVtcyA9IGl0ZW1zXG4gICAgQGl0ZW1NYXAgPSB7fVxuXG4gICAgIyBBZGQgaWQgdG8gYWxsIGl0ZW1zIGlmIG5vdCBwcmVzZW50XG4gICAgaWQgPSAxXG4gICAgZm9yIGl0ZW0gaW4gaXRlbXNcbiAgICAgIGlmIG5vdCBpdGVtLmlkP1xuICAgICAgICBpdGVtLmlkID0gaWRcbiAgICAgICAgaWQ9aWQrMVxuICAgICAgQGl0ZW1NYXBbaXRlbS5pZF0gPSBpdGVtXG5cbiAgICAgICMgQWRkIHRvIHN1Ym1lbnVcbiAgICAgIGlmIGl0ZW0ubWVudVxuICAgICAgICBmb3Igc3ViaXRlbSBpbiBpdGVtLm1lbnVcbiAgICAgICAgICBpZiBub3Qgc3ViaXRlbS5pZD9cbiAgICAgICAgICAgIHN1Yml0ZW0uaWQgPSBpZC50b1N0cmluZygpXG4gICAgICAgICAgICBpZD1pZCsxXG4gICAgICAgICAgQGl0ZW1NYXBbc3ViaXRlbS5pZF0gPSBzdWJpdGVtXG5cbiAgICBAcmVuZGVyKClcblxuICByZW5kZXI6IC0+XG4gICAgQCRlbC5odG1sIHRlbXBsYXRlc1snQnV0dG9uQmFyJ10oaXRlbXM6IEBpdGVtcylcblxuICBjbGlja01lbnVJdGVtOiAoZSkgLT5cbiAgICBpZCA9IGUuY3VycmVudFRhcmdldC5pZFxuICAgIGl0ZW0gPSBAaXRlbU1hcFtpZF1cbiAgICBpZiBpdGVtLmNsaWNrP1xuICAgICAgaXRlbS5jbGljaygpXG5cbiMgQ29udGV4dCBtZW51IHRvIGdvIGluIHNsaWRlIG1lbnVcbiMgU3RhbmRhcmQgYnV0dG9uIGJhci4gRWFjaCBpdGVtIFwidGV4dFwiLCBvcHRpb25hbCBcImdseXBoXCIgKGJvb3RzdHJhcCBnbHlwaCB3aXRob3V0IGljb24tIHByZWZpeCkgYW5kIFwiY2xpY2tcIiAoYWN0aW9uKS5cbmNsYXNzIENvbnRleHRNZW51IGV4dGVuZHMgQmFja2JvbmUuVmlld1xuICBldmVudHM6IFxuICAgIFwiY2xpY2sgLm1lbnVpdGVtXCIgOiBcImNsaWNrTWVudUl0ZW1cIlxuXG4gIHNldHVwOiAoaXRlbXMpIC0+XG4gICAgQGl0ZW1zID0gaXRlbXNcbiAgICBAaXRlbU1hcCA9IHt9XG5cbiAgICAjIEFkZCBpZCB0byBhbGwgaXRlbXMgaWYgbm90IHByZXNlbnRcbiAgICBpZCA9IDFcbiAgICBmb3IgaXRlbSBpbiBpdGVtc1xuICAgICAgaWYgbm90IGl0ZW0uaWQ/XG4gICAgICAgIGl0ZW0uaWQgPSBpZFxuICAgICAgICBpZD1pZCsxXG4gICAgICBAaXRlbU1hcFtpdGVtLmlkXSA9IGl0ZW1cblxuICAgIEByZW5kZXIoKVxuXG4gIHJlbmRlcjogLT5cbiAgICBAJGVsLmh0bWwgdGVtcGxhdGVzWydDb250ZXh0TWVudSddKGl0ZW1zOiBAaXRlbXMpXG5cbiAgY2xpY2tNZW51SXRlbTogKGUpIC0+XG4gICAgaWQgPSBlLmN1cnJlbnRUYXJnZXQuaWRcbiAgICBpdGVtID0gQGl0ZW1NYXBbaWRdXG4gICAgaWYgaXRlbS5jbGljaz9cbiAgICAgIGl0ZW0uY2xpY2soKVxuXG5tb2R1bGUuZXhwb3J0cyA9IFBhZ2UiLCIvKlxuPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuTWV0ZW9yIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgTGljZW5zZVxuPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG5Db3B5cmlnaHQgKEMpIDIwMTEtLTIwMTIgTWV0ZW9yIERldmVsb3BtZW50IEdyb3VwXG5cblBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG5cblRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuXG5USEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuXG49PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuVGhpcyBsaWNlbnNlIGFwcGxpZXMgdG8gYWxsIGNvZGUgaW4gTWV0ZW9yIHRoYXQgaXMgbm90IGFuIGV4dGVybmFsbHlcbm1haW50YWluZWQgbGlicmFyeS4gRXh0ZXJuYWxseSBtYWludGFpbmVkIGxpYnJhcmllcyBoYXZlIHRoZWlyIG93blxubGljZW5zZXMsIGluY2x1ZGVkIGJlbG93OlxuPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuKi9cblxuTG9jYWxDb2xsZWN0aW9uID0ge307XG5FSlNPTiA9IHJlcXVpcmUoXCIuL0VKU09OXCIpO1xuXG4vLyBMaWtlIF8uaXNBcnJheSwgYnV0IGRvZXNuJ3QgcmVnYXJkIHBvbHlmaWxsZWQgVWludDhBcnJheXMgb24gb2xkIGJyb3dzZXJzIGFzXG4vLyBhcnJheXMuXG52YXIgaXNBcnJheSA9IGZ1bmN0aW9uICh4KSB7XG4gIHJldHVybiBfLmlzQXJyYXkoeCkgJiYgIUVKU09OLmlzQmluYXJ5KHgpO1xufTtcblxudmFyIF9hbnlJZkFycmF5ID0gZnVuY3Rpb24gKHgsIGYpIHtcbiAgaWYgKGlzQXJyYXkoeCkpXG4gICAgcmV0dXJuIF8uYW55KHgsIGYpO1xuICByZXR1cm4gZih4KTtcbn07XG5cbnZhciBfYW55SWZBcnJheVBsdXMgPSBmdW5jdGlvbiAoeCwgZikge1xuICBpZiAoZih4KSlcbiAgICByZXR1cm4gdHJ1ZTtcbiAgcmV0dXJuIGlzQXJyYXkoeCkgJiYgXy5hbnkoeCwgZik7XG59O1xuXG52YXIgaGFzT3BlcmF0b3JzID0gZnVuY3Rpb24odmFsdWVTZWxlY3Rvcikge1xuICB2YXIgdGhlc2VBcmVPcGVyYXRvcnMgPSB1bmRlZmluZWQ7XG4gIGZvciAodmFyIHNlbEtleSBpbiB2YWx1ZVNlbGVjdG9yKSB7XG4gICAgdmFyIHRoaXNJc09wZXJhdG9yID0gc2VsS2V5LnN1YnN0cigwLCAxKSA9PT0gJyQnO1xuICAgIGlmICh0aGVzZUFyZU9wZXJhdG9ycyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGVzZUFyZU9wZXJhdG9ycyA9IHRoaXNJc09wZXJhdG9yO1xuICAgIH0gZWxzZSBpZiAodGhlc2VBcmVPcGVyYXRvcnMgIT09IHRoaXNJc09wZXJhdG9yKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbmNvbnNpc3RlbnQgc2VsZWN0b3I6IFwiICsgdmFsdWVTZWxlY3Rvcik7XG4gICAgfVxuICB9XG4gIHJldHVybiAhIXRoZXNlQXJlT3BlcmF0b3JzOyAgLy8ge30gaGFzIG5vIG9wZXJhdG9yc1xufTtcblxudmFyIGNvbXBpbGVWYWx1ZVNlbGVjdG9yID0gZnVuY3Rpb24gKHZhbHVlU2VsZWN0b3IpIHtcbiAgaWYgKHZhbHVlU2VsZWN0b3IgPT0gbnVsbCkgeyAgLy8gdW5kZWZpbmVkIG9yIG51bGxcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICByZXR1cm4gX2FueUlmQXJyYXkodmFsdWUsIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiB4ID09IG51bGw7ICAvLyB1bmRlZmluZWQgb3IgbnVsbFxuICAgICAgfSk7XG4gICAgfTtcbiAgfVxuXG4gIC8vIFNlbGVjdG9yIGlzIGEgbm9uLW51bGwgcHJpbWl0aXZlIChhbmQgbm90IGFuIGFycmF5IG9yIFJlZ0V4cCBlaXRoZXIpLlxuICBpZiAoIV8uaXNPYmplY3QodmFsdWVTZWxlY3RvcikpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICByZXR1cm4gX2FueUlmQXJyYXkodmFsdWUsIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiB4ID09PSB2YWx1ZVNlbGVjdG9yO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfVxuXG4gIGlmICh2YWx1ZVNlbGVjdG9yIGluc3RhbmNlb2YgUmVnRXhwKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIHJldHVybiBfYW55SWZBcnJheSh2YWx1ZSwgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlU2VsZWN0b3IudGVzdCh4KTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH1cblxuICAvLyBBcnJheXMgbWF0Y2ggZWl0aGVyIGlkZW50aWNhbCBhcnJheXMgb3IgYXJyYXlzIHRoYXQgY29udGFpbiBpdCBhcyBhIHZhbHVlLlxuICBpZiAoaXNBcnJheSh2YWx1ZVNlbGVjdG9yKSkge1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIGlmICghaXNBcnJheSh2YWx1ZSkpXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIHJldHVybiBfYW55SWZBcnJheVBsdXModmFsdWUsIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiBMb2NhbENvbGxlY3Rpb24uX2YuX2VxdWFsKHZhbHVlU2VsZWN0b3IsIHgpO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfVxuXG4gIC8vIEl0J3MgYW4gb2JqZWN0LCBidXQgbm90IGFuIGFycmF5IG9yIHJlZ2V4cC5cbiAgaWYgKGhhc09wZXJhdG9ycyh2YWx1ZVNlbGVjdG9yKSkge1xuICAgIHZhciBvcGVyYXRvckZ1bmN0aW9ucyA9IFtdO1xuICAgIF8uZWFjaCh2YWx1ZVNlbGVjdG9yLCBmdW5jdGlvbiAob3BlcmFuZCwgb3BlcmF0b3IpIHtcbiAgICAgIGlmICghXy5oYXMoVkFMVUVfT1BFUkFUT1JTLCBvcGVyYXRvcikpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlVucmVjb2duaXplZCBvcGVyYXRvcjogXCIgKyBvcGVyYXRvcik7XG4gICAgICBvcGVyYXRvckZ1bmN0aW9ucy5wdXNoKFZBTFVFX09QRVJBVE9SU1tvcGVyYXRvcl0oXG4gICAgICAgIG9wZXJhbmQsIHZhbHVlU2VsZWN0b3IuJG9wdGlvbnMpKTtcbiAgICB9KTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICByZXR1cm4gXy5hbGwob3BlcmF0b3JGdW5jdGlvbnMsIGZ1bmN0aW9uIChmKSB7XG4gICAgICAgIHJldHVybiBmKHZhbHVlKTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH1cblxuICAvLyBJdCdzIGEgbGl0ZXJhbDsgY29tcGFyZSB2YWx1ZSAob3IgZWxlbWVudCBvZiB2YWx1ZSBhcnJheSkgZGlyZWN0bHkgdG8gdGhlXG4gIC8vIHNlbGVjdG9yLlxuICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgcmV0dXJuIF9hbnlJZkFycmF5KHZhbHVlLCBmdW5jdGlvbiAoeCkge1xuICAgICAgcmV0dXJuIExvY2FsQ29sbGVjdGlvbi5fZi5fZXF1YWwodmFsdWVTZWxlY3RvciwgeCk7XG4gICAgfSk7XG4gIH07XG59O1xuXG4vLyBYWFggY2FuIGZhY3RvciBvdXQgY29tbW9uIGxvZ2ljIGJlbG93XG52YXIgTE9HSUNBTF9PUEVSQVRPUlMgPSB7XG4gIFwiJGFuZFwiOiBmdW5jdGlvbihzdWJTZWxlY3Rvcikge1xuICAgIGlmICghaXNBcnJheShzdWJTZWxlY3RvcikgfHwgXy5pc0VtcHR5KHN1YlNlbGVjdG9yKSlcbiAgICAgIHRocm93IEVycm9yKFwiJGFuZC8kb3IvJG5vciBtdXN0IGJlIG5vbmVtcHR5IGFycmF5XCIpO1xuICAgIHZhciBzdWJTZWxlY3RvckZ1bmN0aW9ucyA9IF8ubWFwKFxuICAgICAgc3ViU2VsZWN0b3IsIGNvbXBpbGVEb2N1bWVudFNlbGVjdG9yKTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGRvYykge1xuICAgICAgcmV0dXJuIF8uYWxsKHN1YlNlbGVjdG9yRnVuY3Rpb25zLCBmdW5jdGlvbiAoZikge1xuICAgICAgICByZXR1cm4gZihkb2MpO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSxcblxuICBcIiRvclwiOiBmdW5jdGlvbihzdWJTZWxlY3Rvcikge1xuICAgIGlmICghaXNBcnJheShzdWJTZWxlY3RvcikgfHwgXy5pc0VtcHR5KHN1YlNlbGVjdG9yKSlcbiAgICAgIHRocm93IEVycm9yKFwiJGFuZC8kb3IvJG5vciBtdXN0IGJlIG5vbmVtcHR5IGFycmF5XCIpO1xuICAgIHZhciBzdWJTZWxlY3RvckZ1bmN0aW9ucyA9IF8ubWFwKFxuICAgICAgc3ViU2VsZWN0b3IsIGNvbXBpbGVEb2N1bWVudFNlbGVjdG9yKTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGRvYykge1xuICAgICAgcmV0dXJuIF8uYW55KHN1YlNlbGVjdG9yRnVuY3Rpb25zLCBmdW5jdGlvbiAoZikge1xuICAgICAgICByZXR1cm4gZihkb2MpO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSxcblxuICBcIiRub3JcIjogZnVuY3Rpb24oc3ViU2VsZWN0b3IpIHtcbiAgICBpZiAoIWlzQXJyYXkoc3ViU2VsZWN0b3IpIHx8IF8uaXNFbXB0eShzdWJTZWxlY3RvcikpXG4gICAgICB0aHJvdyBFcnJvcihcIiRhbmQvJG9yLyRub3IgbXVzdCBiZSBub25lbXB0eSBhcnJheVwiKTtcbiAgICB2YXIgc3ViU2VsZWN0b3JGdW5jdGlvbnMgPSBfLm1hcChcbiAgICAgIHN1YlNlbGVjdG9yLCBjb21waWxlRG9jdW1lbnRTZWxlY3Rvcik7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChkb2MpIHtcbiAgICAgIHJldHVybiBfLmFsbChzdWJTZWxlY3RvckZ1bmN0aW9ucywgZnVuY3Rpb24gKGYpIHtcbiAgICAgICAgcmV0dXJuICFmKGRvYyk7XG4gICAgICB9KTtcbiAgICB9O1xuICB9LFxuXG4gIFwiJHdoZXJlXCI6IGZ1bmN0aW9uKHNlbGVjdG9yVmFsdWUpIHtcbiAgICBpZiAoIShzZWxlY3RvclZhbHVlIGluc3RhbmNlb2YgRnVuY3Rpb24pKSB7XG4gICAgICBzZWxlY3RvclZhbHVlID0gRnVuY3Rpb24oXCJyZXR1cm4gXCIgKyBzZWxlY3RvclZhbHVlKTtcbiAgICB9XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChkb2MpIHtcbiAgICAgIHJldHVybiBzZWxlY3RvclZhbHVlLmNhbGwoZG9jKTtcbiAgICB9O1xuICB9XG59O1xuXG52YXIgVkFMVUVfT1BFUkFUT1JTID0ge1xuICBcIiRpblwiOiBmdW5jdGlvbiAob3BlcmFuZCkge1xuICAgIGlmICghaXNBcnJheShvcGVyYW5kKSlcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkFyZ3VtZW50IHRvICRpbiBtdXN0IGJlIGFycmF5XCIpO1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJldHVybiBfYW55SWZBcnJheVBsdXModmFsdWUsIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiBfLmFueShvcGVyYW5kLCBmdW5jdGlvbiAob3BlcmFuZEVsdCkge1xuICAgICAgICAgIHJldHVybiBMb2NhbENvbGxlY3Rpb24uX2YuX2VxdWFsKG9wZXJhbmRFbHQsIHgpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0sXG5cbiAgXCIkYWxsXCI6IGZ1bmN0aW9uIChvcGVyYW5kKSB7XG4gICAgaWYgKCFpc0FycmF5KG9wZXJhbmQpKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQXJndW1lbnQgdG8gJGFsbCBtdXN0IGJlIGFycmF5XCIpO1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIGlmICghaXNBcnJheSh2YWx1ZSkpXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIHJldHVybiBfLmFsbChvcGVyYW5kLCBmdW5jdGlvbiAob3BlcmFuZEVsdCkge1xuICAgICAgICByZXR1cm4gXy5hbnkodmFsdWUsIGZ1bmN0aW9uICh2YWx1ZUVsdCkge1xuICAgICAgICAgIHJldHVybiBMb2NhbENvbGxlY3Rpb24uX2YuX2VxdWFsKG9wZXJhbmRFbHQsIHZhbHVlRWx0KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9O1xuICB9LFxuXG4gIFwiJGx0XCI6IGZ1bmN0aW9uIChvcGVyYW5kKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgcmV0dXJuIF9hbnlJZkFycmF5KHZhbHVlLCBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4gTG9jYWxDb2xsZWN0aW9uLl9mLl9jbXAoeCwgb3BlcmFuZCkgPCAwO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSxcblxuICBcIiRsdGVcIjogZnVuY3Rpb24gKG9wZXJhbmQpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICByZXR1cm4gX2FueUlmQXJyYXkodmFsdWUsIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiBMb2NhbENvbGxlY3Rpb24uX2YuX2NtcCh4LCBvcGVyYW5kKSA8PSAwO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSxcblxuICBcIiRndFwiOiBmdW5jdGlvbiAob3BlcmFuZCkge1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJldHVybiBfYW55SWZBcnJheSh2YWx1ZSwgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIExvY2FsQ29sbGVjdGlvbi5fZi5fY21wKHgsIG9wZXJhbmQpID4gMDtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0sXG5cbiAgXCIkZ3RlXCI6IGZ1bmN0aW9uIChvcGVyYW5kKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgcmV0dXJuIF9hbnlJZkFycmF5KHZhbHVlLCBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4gTG9jYWxDb2xsZWN0aW9uLl9mLl9jbXAoeCwgb3BlcmFuZCkgPj0gMDtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0sXG5cbiAgXCIkbmVcIjogZnVuY3Rpb24gKG9wZXJhbmQpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICByZXR1cm4gISBfYW55SWZBcnJheVBsdXModmFsdWUsIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiBMb2NhbENvbGxlY3Rpb24uX2YuX2VxdWFsKHgsIG9wZXJhbmQpO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSxcblxuICBcIiRuaW5cIjogZnVuY3Rpb24gKG9wZXJhbmQpIHtcbiAgICBpZiAoIWlzQXJyYXkob3BlcmFuZCkpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJBcmd1bWVudCB0byAkbmluIG11c3QgYmUgYXJyYXlcIik7XG4gICAgdmFyIGluRnVuY3Rpb24gPSBWQUxVRV9PUEVSQVRPUlMuJGluKG9wZXJhbmQpO1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIC8vIEZpZWxkIGRvZXNuJ3QgZXhpc3QsIHNvIGl0J3Mgbm90LWluIG9wZXJhbmRcbiAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIHJldHVybiAhaW5GdW5jdGlvbih2YWx1ZSk7XG4gICAgfTtcbiAgfSxcblxuICBcIiRleGlzdHNcIjogZnVuY3Rpb24gKG9wZXJhbmQpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICByZXR1cm4gb3BlcmFuZCA9PT0gKHZhbHVlICE9PSB1bmRlZmluZWQpO1xuICAgIH07XG4gIH0sXG5cbiAgXCIkbW9kXCI6IGZ1bmN0aW9uIChvcGVyYW5kKSB7XG4gICAgdmFyIGRpdmlzb3IgPSBvcGVyYW5kWzBdLFxuICAgICAgICByZW1haW5kZXIgPSBvcGVyYW5kWzFdO1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJldHVybiBfYW55SWZBcnJheSh2YWx1ZSwgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIHggJSBkaXZpc29yID09PSByZW1haW5kZXI7XG4gICAgICB9KTtcbiAgICB9O1xuICB9LFxuXG4gIFwiJHNpemVcIjogZnVuY3Rpb24gKG9wZXJhbmQpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICByZXR1cm4gaXNBcnJheSh2YWx1ZSkgJiYgb3BlcmFuZCA9PT0gdmFsdWUubGVuZ3RoO1xuICAgIH07XG4gIH0sXG5cbiAgXCIkdHlwZVwiOiBmdW5jdGlvbiAob3BlcmFuZCkge1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIC8vIEEgbm9uZXhpc3RlbnQgZmllbGQgaXMgb2Ygbm8gdHlwZS5cbiAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAvLyBEZWZpbml0ZWx5IG5vdCBfYW55SWZBcnJheVBsdXM6ICR0eXBlOiA0IG9ubHkgbWF0Y2hlcyBhcnJheXMgdGhhdCBoYXZlXG4gICAgICAvLyBhcnJheXMgYXMgZWxlbWVudHMgYWNjb3JkaW5nIHRvIHRoZSBNb25nbyBkb2NzLlxuICAgICAgcmV0dXJuIF9hbnlJZkFycmF5KHZhbHVlLCBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4gTG9jYWxDb2xsZWN0aW9uLl9mLl90eXBlKHgpID09PSBvcGVyYW5kO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSxcblxuICBcIiRyZWdleFwiOiBmdW5jdGlvbiAob3BlcmFuZCwgb3B0aW9ucykge1xuICAgIGlmIChvcHRpb25zICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIC8vIE9wdGlvbnMgcGFzc2VkIGluICRvcHRpb25zIChldmVuIHRoZSBlbXB0eSBzdHJpbmcpIGFsd2F5cyBvdmVycmlkZXNcbiAgICAgIC8vIG9wdGlvbnMgaW4gdGhlIFJlZ0V4cCBvYmplY3QgaXRzZWxmLlxuXG4gICAgICAvLyBCZSBjbGVhciB0aGF0IHdlIG9ubHkgc3VwcG9ydCB0aGUgSlMtc3VwcG9ydGVkIG9wdGlvbnMsIG5vdCBleHRlbmRlZFxuICAgICAgLy8gb25lcyAoZWcsIE1vbmdvIHN1cHBvcnRzIHggYW5kIHMpLiBJZGVhbGx5IHdlIHdvdWxkIGltcGxlbWVudCB4IGFuZCBzXG4gICAgICAvLyBieSB0cmFuc2Zvcm1pbmcgdGhlIHJlZ2V4cCwgYnV0IG5vdCB0b2RheS4uLlxuICAgICAgaWYgKC9bXmdpbV0vLnRlc3Qob3B0aW9ucykpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIk9ubHkgdGhlIGksIG0sIGFuZCBnIHJlZ2V4cCBvcHRpb25zIGFyZSBzdXBwb3J0ZWRcIik7XG5cbiAgICAgIHZhciByZWdleFNvdXJjZSA9IG9wZXJhbmQgaW5zdGFuY2VvZiBSZWdFeHAgPyBvcGVyYW5kLnNvdXJjZSA6IG9wZXJhbmQ7XG4gICAgICBvcGVyYW5kID0gbmV3IFJlZ0V4cChyZWdleFNvdXJjZSwgb3B0aW9ucyk7XG4gICAgfSBlbHNlIGlmICghKG9wZXJhbmQgaW5zdGFuY2VvZiBSZWdFeHApKSB7XG4gICAgICBvcGVyYW5kID0gbmV3IFJlZ0V4cChvcGVyYW5kKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZClcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgcmV0dXJuIF9hbnlJZkFycmF5KHZhbHVlLCBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4gb3BlcmFuZC50ZXN0KHgpO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSxcblxuICBcIiRvcHRpb25zXCI6IGZ1bmN0aW9uIChvcGVyYW5kKSB7XG4gICAgLy8gZXZhbHVhdGlvbiBoYXBwZW5zIGF0IHRoZSAkcmVnZXggZnVuY3Rpb24gYWJvdmVcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7IHJldHVybiB0cnVlOyB9O1xuICB9LFxuXG4gIFwiJGVsZW1NYXRjaFwiOiBmdW5jdGlvbiAob3BlcmFuZCkge1xuICAgIHZhciBtYXRjaGVyID0gY29tcGlsZURvY3VtZW50U2VsZWN0b3Iob3BlcmFuZCk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgaWYgKCFpc0FycmF5KHZhbHVlKSlcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgcmV0dXJuIF8uYW55KHZhbHVlLCBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4gbWF0Y2hlcih4KTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0sXG5cbiAgXCIkbm90XCI6IGZ1bmN0aW9uIChvcGVyYW5kKSB7XG4gICAgdmFyIG1hdGNoZXIgPSBjb21waWxlVmFsdWVTZWxlY3RvcihvcGVyYW5kKTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICByZXR1cm4gIW1hdGNoZXIodmFsdWUpO1xuICAgIH07XG4gIH0sXG5cbiAgXCIkbmVhclwiOiBmdW5jdGlvbiAob3BlcmFuZCkge1xuICAgIC8vIEFsd2F5cyByZXR1cm5zIHRydWUuIE11c3QgYmUgaGFuZGxlZCBpbiBwb3N0LWZpbHRlci9zb3J0L2xpbWl0XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9LFxuXG4gIFwiJGdlb0ludGVyc2VjdHNcIjogZnVuY3Rpb24gKG9wZXJhbmQpIHtcbiAgICAvLyBBbHdheXMgcmV0dXJucyB0cnVlLiBNdXN0IGJlIGhhbmRsZWQgaW4gcG9zdC1maWx0ZXIvc29ydC9saW1pdFxuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuXG59O1xuXG4vLyBoZWxwZXJzIHVzZWQgYnkgY29tcGlsZWQgc2VsZWN0b3IgY29kZVxuTG9jYWxDb2xsZWN0aW9uLl9mID0ge1xuICAvLyBYWFggZm9yIF9hbGwgYW5kIF9pbiwgY29uc2lkZXIgYnVpbGRpbmcgJ2lucXVlcnknIGF0IGNvbXBpbGUgdGltZS4uXG5cbiAgX3R5cGU6IGZ1bmN0aW9uICh2KSB7XG4gICAgaWYgKHR5cGVvZiB2ID09PSBcIm51bWJlclwiKVxuICAgICAgcmV0dXJuIDE7XG4gICAgaWYgKHR5cGVvZiB2ID09PSBcInN0cmluZ1wiKVxuICAgICAgcmV0dXJuIDI7XG4gICAgaWYgKHR5cGVvZiB2ID09PSBcImJvb2xlYW5cIilcbiAgICAgIHJldHVybiA4O1xuICAgIGlmIChpc0FycmF5KHYpKVxuICAgICAgcmV0dXJuIDQ7XG4gICAgaWYgKHYgPT09IG51bGwpXG4gICAgICByZXR1cm4gMTA7XG4gICAgaWYgKHYgaW5zdGFuY2VvZiBSZWdFeHApXG4gICAgICByZXR1cm4gMTE7XG4gICAgaWYgKHR5cGVvZiB2ID09PSBcImZ1bmN0aW9uXCIpXG4gICAgICAvLyBub3RlIHRoYXQgdHlwZW9mKC94LykgPT09IFwiZnVuY3Rpb25cIlxuICAgICAgcmV0dXJuIDEzO1xuICAgIGlmICh2IGluc3RhbmNlb2YgRGF0ZSlcbiAgICAgIHJldHVybiA5O1xuICAgIGlmIChFSlNPTi5pc0JpbmFyeSh2KSlcbiAgICAgIHJldHVybiA1O1xuICAgIGlmICh2IGluc3RhbmNlb2YgTWV0ZW9yLkNvbGxlY3Rpb24uT2JqZWN0SUQpXG4gICAgICByZXR1cm4gNztcbiAgICByZXR1cm4gMzsgLy8gb2JqZWN0XG5cbiAgICAvLyBYWFggc3VwcG9ydCBzb21lL2FsbCBvZiB0aGVzZTpcbiAgICAvLyAxNCwgc3ltYm9sXG4gICAgLy8gMTUsIGphdmFzY3JpcHQgY29kZSB3aXRoIHNjb3BlXG4gICAgLy8gMTYsIDE4OiAzMi1iaXQvNjQtYml0IGludGVnZXJcbiAgICAvLyAxNywgdGltZXN0YW1wXG4gICAgLy8gMjU1LCBtaW5rZXlcbiAgICAvLyAxMjcsIG1heGtleVxuICB9LFxuXG4gIC8vIGRlZXAgZXF1YWxpdHkgdGVzdDogdXNlIGZvciBsaXRlcmFsIGRvY3VtZW50IGFuZCBhcnJheSBtYXRjaGVzXG4gIF9lcXVhbDogZnVuY3Rpb24gKGEsIGIpIHtcbiAgICByZXR1cm4gRUpTT04uZXF1YWxzKGEsIGIsIHtrZXlPcmRlclNlbnNpdGl2ZTogdHJ1ZX0pO1xuICB9LFxuXG4gIC8vIG1hcHMgYSB0eXBlIGNvZGUgdG8gYSB2YWx1ZSB0aGF0IGNhbiBiZSB1c2VkIHRvIHNvcnQgdmFsdWVzIG9mXG4gIC8vIGRpZmZlcmVudCB0eXBlc1xuICBfdHlwZW9yZGVyOiBmdW5jdGlvbiAodCkge1xuICAgIC8vIGh0dHA6Ly93d3cubW9uZ29kYi5vcmcvZGlzcGxheS9ET0NTL1doYXQraXMrdGhlK0NvbXBhcmUrT3JkZXIrZm9yK0JTT04rVHlwZXNcbiAgICAvLyBYWFggd2hhdCBpcyB0aGUgY29ycmVjdCBzb3J0IHBvc2l0aW9uIGZvciBKYXZhc2NyaXB0IGNvZGU/XG4gICAgLy8gKCcxMDAnIGluIHRoZSBtYXRyaXggYmVsb3cpXG4gICAgLy8gWFhYIG1pbmtleS9tYXhrZXlcbiAgICByZXR1cm4gWy0xLCAgLy8gKG5vdCBhIHR5cGUpXG4gICAgICAgICAgICAxLCAgIC8vIG51bWJlclxuICAgICAgICAgICAgMiwgICAvLyBzdHJpbmdcbiAgICAgICAgICAgIDMsICAgLy8gb2JqZWN0XG4gICAgICAgICAgICA0LCAgIC8vIGFycmF5XG4gICAgICAgICAgICA1LCAgIC8vIGJpbmFyeVxuICAgICAgICAgICAgLTEsICAvLyBkZXByZWNhdGVkXG4gICAgICAgICAgICA2LCAgIC8vIE9iamVjdElEXG4gICAgICAgICAgICA3LCAgIC8vIGJvb2xcbiAgICAgICAgICAgIDgsICAgLy8gRGF0ZVxuICAgICAgICAgICAgMCwgICAvLyBudWxsXG4gICAgICAgICAgICA5LCAgIC8vIFJlZ0V4cFxuICAgICAgICAgICAgLTEsICAvLyBkZXByZWNhdGVkXG4gICAgICAgICAgICAxMDAsIC8vIEpTIGNvZGVcbiAgICAgICAgICAgIDIsICAgLy8gZGVwcmVjYXRlZCAoc3ltYm9sKVxuICAgICAgICAgICAgMTAwLCAvLyBKUyBjb2RlXG4gICAgICAgICAgICAxLCAgIC8vIDMyLWJpdCBpbnRcbiAgICAgICAgICAgIDgsICAgLy8gTW9uZ28gdGltZXN0YW1wXG4gICAgICAgICAgICAxICAgIC8vIDY0LWJpdCBpbnRcbiAgICAgICAgICAgXVt0XTtcbiAgfSxcblxuICAvLyBjb21wYXJlIHR3byB2YWx1ZXMgb2YgdW5rbm93biB0eXBlIGFjY29yZGluZyB0byBCU09OIG9yZGVyaW5nXG4gIC8vIHNlbWFudGljcy4gKGFzIGFuIGV4dGVuc2lvbiwgY29uc2lkZXIgJ3VuZGVmaW5lZCcgdG8gYmUgbGVzcyB0aGFuXG4gIC8vIGFueSBvdGhlciB2YWx1ZS4pIHJldHVybiBuZWdhdGl2ZSBpZiBhIGlzIGxlc3MsIHBvc2l0aXZlIGlmIGIgaXNcbiAgLy8gbGVzcywgb3IgMCBpZiBlcXVhbFxuICBfY21wOiBmdW5jdGlvbiAoYSwgYikge1xuICAgIGlmIChhID09PSB1bmRlZmluZWQpXG4gICAgICByZXR1cm4gYiA9PT0gdW5kZWZpbmVkID8gMCA6IC0xO1xuICAgIGlmIChiID09PSB1bmRlZmluZWQpXG4gICAgICByZXR1cm4gMTtcbiAgICB2YXIgdGEgPSBMb2NhbENvbGxlY3Rpb24uX2YuX3R5cGUoYSk7XG4gICAgdmFyIHRiID0gTG9jYWxDb2xsZWN0aW9uLl9mLl90eXBlKGIpO1xuICAgIHZhciBvYSA9IExvY2FsQ29sbGVjdGlvbi5fZi5fdHlwZW9yZGVyKHRhKTtcbiAgICB2YXIgb2IgPSBMb2NhbENvbGxlY3Rpb24uX2YuX3R5cGVvcmRlcih0Yik7XG4gICAgaWYgKG9hICE9PSBvYilcbiAgICAgIHJldHVybiBvYSA8IG9iID8gLTEgOiAxO1xuICAgIGlmICh0YSAhPT0gdGIpXG4gICAgICAvLyBYWFggbmVlZCB0byBpbXBsZW1lbnQgdGhpcyBpZiB3ZSBpbXBsZW1lbnQgU3ltYm9sIG9yIGludGVnZXJzLCBvclxuICAgICAgLy8gVGltZXN0YW1wXG4gICAgICB0aHJvdyBFcnJvcihcIk1pc3NpbmcgdHlwZSBjb2VyY2lvbiBsb2dpYyBpbiBfY21wXCIpO1xuICAgIGlmICh0YSA9PT0gNykgeyAvLyBPYmplY3RJRFxuICAgICAgLy8gQ29udmVydCB0byBzdHJpbmcuXG4gICAgICB0YSA9IHRiID0gMjtcbiAgICAgIGEgPSBhLnRvSGV4U3RyaW5nKCk7XG4gICAgICBiID0gYi50b0hleFN0cmluZygpO1xuICAgIH1cbiAgICBpZiAodGEgPT09IDkpIHsgLy8gRGF0ZVxuICAgICAgLy8gQ29udmVydCB0byBtaWxsaXMuXG4gICAgICB0YSA9IHRiID0gMTtcbiAgICAgIGEgPSBhLmdldFRpbWUoKTtcbiAgICAgIGIgPSBiLmdldFRpbWUoKTtcbiAgICB9XG5cbiAgICBpZiAodGEgPT09IDEpIC8vIGRvdWJsZVxuICAgICAgcmV0dXJuIGEgLSBiO1xuICAgIGlmICh0YiA9PT0gMikgLy8gc3RyaW5nXG4gICAgICByZXR1cm4gYSA8IGIgPyAtMSA6IChhID09PSBiID8gMCA6IDEpO1xuICAgIGlmICh0YSA9PT0gMykgeyAvLyBPYmplY3RcbiAgICAgIC8vIHRoaXMgY291bGQgYmUgbXVjaCBtb3JlIGVmZmljaWVudCBpbiB0aGUgZXhwZWN0ZWQgY2FzZSAuLi5cbiAgICAgIHZhciB0b19hcnJheSA9IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgICAgdmFyIHJldCA9IFtdO1xuICAgICAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgICAgICAgcmV0LnB1c2goa2V5KTtcbiAgICAgICAgICByZXQucHVzaChvYmpba2V5XSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgIH07XG4gICAgICByZXR1cm4gTG9jYWxDb2xsZWN0aW9uLl9mLl9jbXAodG9fYXJyYXkoYSksIHRvX2FycmF5KGIpKTtcbiAgICB9XG4gICAgaWYgKHRhID09PSA0KSB7IC8vIEFycmF5XG4gICAgICBmb3IgKHZhciBpID0gMDsgOyBpKyspIHtcbiAgICAgICAgaWYgKGkgPT09IGEubGVuZ3RoKVxuICAgICAgICAgIHJldHVybiAoaSA9PT0gYi5sZW5ndGgpID8gMCA6IC0xO1xuICAgICAgICBpZiAoaSA9PT0gYi5sZW5ndGgpXG4gICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgIHZhciBzID0gTG9jYWxDb2xsZWN0aW9uLl9mLl9jbXAoYVtpXSwgYltpXSk7XG4gICAgICAgIGlmIChzICE9PSAwKVxuICAgICAgICAgIHJldHVybiBzO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAodGEgPT09IDUpIHsgLy8gYmluYXJ5XG4gICAgICAvLyBTdXJwcmlzaW5nbHksIGEgc21hbGwgYmluYXJ5IGJsb2IgaXMgYWx3YXlzIGxlc3MgdGhhbiBhIGxhcmdlIG9uZSBpblxuICAgICAgLy8gTW9uZ28uXG4gICAgICBpZiAoYS5sZW5ndGggIT09IGIubGVuZ3RoKVxuICAgICAgICByZXR1cm4gYS5sZW5ndGggLSBiLmxlbmd0aDtcbiAgICAgIGZvciAoaSA9IDA7IGkgPCBhLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChhW2ldIDwgYltpXSlcbiAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgIGlmIChhW2ldID4gYltpXSlcbiAgICAgICAgICByZXR1cm4gMTtcbiAgICAgIH1cbiAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICBpZiAodGEgPT09IDgpIHsgLy8gYm9vbGVhblxuICAgICAgaWYgKGEpIHJldHVybiBiID8gMCA6IDE7XG4gICAgICByZXR1cm4gYiA/IC0xIDogMDtcbiAgICB9XG4gICAgaWYgKHRhID09PSAxMCkgLy8gbnVsbFxuICAgICAgcmV0dXJuIDA7XG4gICAgaWYgKHRhID09PSAxMSkgLy8gcmVnZXhwXG4gICAgICB0aHJvdyBFcnJvcihcIlNvcnRpbmcgbm90IHN1cHBvcnRlZCBvbiByZWd1bGFyIGV4cHJlc3Npb25cIik7IC8vIFhYWFxuICAgIC8vIDEzOiBqYXZhc2NyaXB0IGNvZGVcbiAgICAvLyAxNDogc3ltYm9sXG4gICAgLy8gMTU6IGphdmFzY3JpcHQgY29kZSB3aXRoIHNjb3BlXG4gICAgLy8gMTY6IDMyLWJpdCBpbnRlZ2VyXG4gICAgLy8gMTc6IHRpbWVzdGFtcFxuICAgIC8vIDE4OiA2NC1iaXQgaW50ZWdlclxuICAgIC8vIDI1NTogbWlua2V5XG4gICAgLy8gMTI3OiBtYXhrZXlcbiAgICBpZiAodGEgPT09IDEzKSAvLyBqYXZhc2NyaXB0IGNvZGVcbiAgICAgIHRocm93IEVycm9yKFwiU29ydGluZyBub3Qgc3VwcG9ydGVkIG9uIEphdmFzY3JpcHQgY29kZVwiKTsgLy8gWFhYXG4gICAgdGhyb3cgRXJyb3IoXCJVbmtub3duIHR5cGUgdG8gc29ydFwiKTtcbiAgfVxufTtcblxuLy8gRm9yIHVuaXQgdGVzdHMuIFRydWUgaWYgdGhlIGdpdmVuIGRvY3VtZW50IG1hdGNoZXMgdGhlIGdpdmVuXG4vLyBzZWxlY3Rvci5cbkxvY2FsQ29sbGVjdGlvbi5fbWF0Y2hlcyA9IGZ1bmN0aW9uIChzZWxlY3RvciwgZG9jKSB7XG4gIHJldHVybiAoTG9jYWxDb2xsZWN0aW9uLl9jb21waWxlU2VsZWN0b3Ioc2VsZWN0b3IpKShkb2MpO1xufTtcblxuLy8gX21ha2VMb29rdXBGdW5jdGlvbihrZXkpIHJldHVybnMgYSBsb29rdXAgZnVuY3Rpb24uXG4vL1xuLy8gQSBsb29rdXAgZnVuY3Rpb24gdGFrZXMgaW4gYSBkb2N1bWVudCBhbmQgcmV0dXJucyBhbiBhcnJheSBvZiBtYXRjaGluZ1xuLy8gdmFsdWVzLiAgVGhpcyBhcnJheSBoYXMgbW9yZSB0aGFuIG9uZSBlbGVtZW50IGlmIGFueSBzZWdtZW50IG9mIHRoZSBrZXkgb3RoZXJcbi8vIHRoYW4gdGhlIGxhc3Qgb25lIGlzIGFuIGFycmF5LiAgaWUsIGFueSBhcnJheXMgZm91bmQgd2hlbiBkb2luZyBub24tZmluYWxcbi8vIGxvb2t1cHMgcmVzdWx0IGluIHRoaXMgZnVuY3Rpb24gXCJicmFuY2hpbmdcIjsgZWFjaCBlbGVtZW50IGluIHRoZSByZXR1cm5lZFxuLy8gYXJyYXkgcmVwcmVzZW50cyB0aGUgdmFsdWUgZm91bmQgYXQgdGhpcyBicmFuY2guIElmIGFueSBicmFuY2ggZG9lc24ndCBoYXZlIGFcbi8vIGZpbmFsIHZhbHVlIGZvciB0aGUgZnVsbCBrZXksIGl0cyBlbGVtZW50IGluIHRoZSByZXR1cm5lZCBsaXN0IHdpbGwgYmVcbi8vIHVuZGVmaW5lZC4gSXQgYWx3YXlzIHJldHVybnMgYSBub24tZW1wdHkgYXJyYXkuXG4vL1xuLy8gX21ha2VMb29rdXBGdW5jdGlvbignYS54Jykoe2E6IHt4OiAxfX0pIHJldHVybnMgWzFdXG4vLyBfbWFrZUxvb2t1cEZ1bmN0aW9uKCdhLngnKSh7YToge3g6IFsxXX19KSByZXR1cm5zIFtbMV1dXG4vLyBfbWFrZUxvb2t1cEZ1bmN0aW9uKCdhLngnKSh7YTogNX0pICByZXR1cm5zIFt1bmRlZmluZWRdXG4vLyBfbWFrZUxvb2t1cEZ1bmN0aW9uKCdhLngnKSh7YTogW3t4OiAxfSxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3g6IFsyXX0sXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHt5OiAzfV19KVxuLy8gICByZXR1cm5zIFsxLCBbMl0sIHVuZGVmaW5lZF1cbkxvY2FsQ29sbGVjdGlvbi5fbWFrZUxvb2t1cEZ1bmN0aW9uID0gZnVuY3Rpb24gKGtleSkge1xuICB2YXIgZG90TG9jYXRpb24gPSBrZXkuaW5kZXhPZignLicpO1xuICB2YXIgZmlyc3QsIGxvb2t1cFJlc3QsIG5leHRJc051bWVyaWM7XG4gIGlmIChkb3RMb2NhdGlvbiA9PT0gLTEpIHtcbiAgICBmaXJzdCA9IGtleTtcbiAgfSBlbHNlIHtcbiAgICBmaXJzdCA9IGtleS5zdWJzdHIoMCwgZG90TG9jYXRpb24pO1xuICAgIHZhciByZXN0ID0ga2V5LnN1YnN0cihkb3RMb2NhdGlvbiArIDEpO1xuICAgIGxvb2t1cFJlc3QgPSBMb2NhbENvbGxlY3Rpb24uX21ha2VMb29rdXBGdW5jdGlvbihyZXN0KTtcbiAgICAvLyBJcyB0aGUgbmV4dCAocGVyaGFwcyBmaW5hbCkgcGllY2UgbnVtZXJpYyAoaWUsIGFuIGFycmF5IGxvb2t1cD8pXG4gICAgbmV4dElzTnVtZXJpYyA9IC9eXFxkKyhcXC58JCkvLnRlc3QocmVzdCk7XG4gIH1cblxuICByZXR1cm4gZnVuY3Rpb24gKGRvYykge1xuICAgIGlmIChkb2MgPT0gbnVsbCkgIC8vIG51bGwgb3IgdW5kZWZpbmVkXG4gICAgICByZXR1cm4gW3VuZGVmaW5lZF07XG4gICAgdmFyIGZpcnN0TGV2ZWwgPSBkb2NbZmlyc3RdO1xuXG4gICAgLy8gV2UgZG9uJ3QgXCJicmFuY2hcIiBhdCB0aGUgZmluYWwgbGV2ZWwuXG4gICAgaWYgKCFsb29rdXBSZXN0KVxuICAgICAgcmV0dXJuIFtmaXJzdExldmVsXTtcblxuICAgIC8vIEl0J3MgYW4gZW1wdHkgYXJyYXksIGFuZCB3ZSdyZSBub3QgZG9uZTogd2Ugd29uJ3QgZmluZCBhbnl0aGluZy5cbiAgICBpZiAoaXNBcnJheShmaXJzdExldmVsKSAmJiBmaXJzdExldmVsLmxlbmd0aCA9PT0gMClcbiAgICAgIHJldHVybiBbdW5kZWZpbmVkXTtcblxuICAgIC8vIEZvciBlYWNoIHJlc3VsdCBhdCB0aGlzIGxldmVsLCBmaW5pc2ggdGhlIGxvb2t1cCBvbiB0aGUgcmVzdCBvZiB0aGUga2V5LFxuICAgIC8vIGFuZCByZXR1cm4gZXZlcnl0aGluZyB3ZSBmaW5kLiBBbHNvLCBpZiB0aGUgbmV4dCByZXN1bHQgaXMgYSBudW1iZXIsXG4gICAgLy8gZG9uJ3QgYnJhbmNoIGhlcmUuXG4gICAgLy9cbiAgICAvLyBUZWNobmljYWxseSwgaW4gTW9uZ29EQiwgd2Ugc2hvdWxkIGJlIGFibGUgdG8gaGFuZGxlIHRoZSBjYXNlIHdoZXJlXG4gICAgLy8gb2JqZWN0cyBoYXZlIG51bWVyaWMga2V5cywgYnV0IE1vbmdvIGRvZXNuJ3QgYWN0dWFsbHkgaGFuZGxlIHRoaXNcbiAgICAvLyBjb25zaXN0ZW50bHkgeWV0IGl0c2VsZiwgc2VlIGVnXG4gICAgLy8gaHR0cHM6Ly9qaXJhLm1vbmdvZGIub3JnL2Jyb3dzZS9TRVJWRVItMjg5OFxuICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9tb25nb2RiL21vbmdvL2Jsb2IvbWFzdGVyL2pzdGVzdHMvYXJyYXlfbWF0Y2gyLmpzXG4gICAgaWYgKCFpc0FycmF5KGZpcnN0TGV2ZWwpIHx8IG5leHRJc051bWVyaWMpXG4gICAgICBmaXJzdExldmVsID0gW2ZpcnN0TGV2ZWxdO1xuICAgIHJldHVybiBBcnJheS5wcm90b3R5cGUuY29uY2F0LmFwcGx5KFtdLCBfLm1hcChmaXJzdExldmVsLCBsb29rdXBSZXN0KSk7XG4gIH07XG59O1xuXG4vLyBUaGUgbWFpbiBjb21waWxhdGlvbiBmdW5jdGlvbiBmb3IgYSBnaXZlbiBzZWxlY3Rvci5cbnZhciBjb21waWxlRG9jdW1lbnRTZWxlY3RvciA9IGZ1bmN0aW9uIChkb2NTZWxlY3Rvcikge1xuICB2YXIgcGVyS2V5U2VsZWN0b3JzID0gW107XG4gIF8uZWFjaChkb2NTZWxlY3RvciwgZnVuY3Rpb24gKHN1YlNlbGVjdG9yLCBrZXkpIHtcbiAgICBpZiAoa2V5LnN1YnN0cigwLCAxKSA9PT0gJyQnKSB7XG4gICAgICAvLyBPdXRlciBvcGVyYXRvcnMgYXJlIGVpdGhlciBsb2dpY2FsIG9wZXJhdG9ycyAodGhleSByZWN1cnNlIGJhY2sgaW50b1xuICAgICAgLy8gdGhpcyBmdW5jdGlvbiksIG9yICR3aGVyZS5cbiAgICAgIGlmICghXy5oYXMoTE9HSUNBTF9PUEVSQVRPUlMsIGtleSkpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlVucmVjb2duaXplZCBsb2dpY2FsIG9wZXJhdG9yOiBcIiArIGtleSk7XG4gICAgICBwZXJLZXlTZWxlY3RvcnMucHVzaChMT0dJQ0FMX09QRVJBVE9SU1trZXldKHN1YlNlbGVjdG9yKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBsb29rVXBCeUluZGV4ID0gTG9jYWxDb2xsZWN0aW9uLl9tYWtlTG9va3VwRnVuY3Rpb24oa2V5KTtcbiAgICAgIHZhciB2YWx1ZVNlbGVjdG9yRnVuYyA9IGNvbXBpbGVWYWx1ZVNlbGVjdG9yKHN1YlNlbGVjdG9yKTtcbiAgICAgIHBlcktleVNlbGVjdG9ycy5wdXNoKGZ1bmN0aW9uIChkb2MpIHtcbiAgICAgICAgdmFyIGJyYW5jaFZhbHVlcyA9IGxvb2tVcEJ5SW5kZXgoZG9jKTtcbiAgICAgICAgLy8gV2UgYXBwbHkgdGhlIHNlbGVjdG9yIHRvIGVhY2ggXCJicmFuY2hlZFwiIHZhbHVlIGFuZCByZXR1cm4gdHJ1ZSBpZiBhbnlcbiAgICAgICAgLy8gbWF0Y2guIFRoaXMgaXNuJ3QgMTAwJSBjb25zaXN0ZW50IHdpdGggTW9uZ29EQjsgZWcsIHNlZTpcbiAgICAgICAgLy8gaHR0cHM6Ly9qaXJhLm1vbmdvZGIub3JnL2Jyb3dzZS9TRVJWRVItODU4NVxuICAgICAgICByZXR1cm4gXy5hbnkoYnJhbmNoVmFsdWVzLCB2YWx1ZVNlbGVjdG9yRnVuYyk7XG4gICAgICB9KTtcbiAgICB9XG4gIH0pO1xuXG5cbiAgcmV0dXJuIGZ1bmN0aW9uIChkb2MpIHtcbiAgICByZXR1cm4gXy5hbGwocGVyS2V5U2VsZWN0b3JzLCBmdW5jdGlvbiAoZikge1xuICAgICAgcmV0dXJuIGYoZG9jKTtcbiAgICB9KTtcbiAgfTtcbn07XG5cbi8vIEdpdmVuIGEgc2VsZWN0b3IsIHJldHVybiBhIGZ1bmN0aW9uIHRoYXQgdGFrZXMgb25lIGFyZ3VtZW50LCBhXG4vLyBkb2N1bWVudCwgYW5kIHJldHVybnMgdHJ1ZSBpZiB0aGUgZG9jdW1lbnQgbWF0Y2hlcyB0aGUgc2VsZWN0b3IsXG4vLyBlbHNlIGZhbHNlLlxuTG9jYWxDb2xsZWN0aW9uLl9jb21waWxlU2VsZWN0b3IgPSBmdW5jdGlvbiAoc2VsZWN0b3IpIHtcbiAgLy8geW91IGNhbiBwYXNzIGEgbGl0ZXJhbCBmdW5jdGlvbiBpbnN0ZWFkIG9mIGEgc2VsZWN0b3JcbiAgaWYgKHNlbGVjdG9yIGluc3RhbmNlb2YgRnVuY3Rpb24pXG4gICAgcmV0dXJuIGZ1bmN0aW9uIChkb2MpIHtyZXR1cm4gc2VsZWN0b3IuY2FsbChkb2MpO307XG5cbiAgLy8gc2hvcnRoYW5kIC0tIHNjYWxhcnMgbWF0Y2ggX2lkXG4gIGlmIChMb2NhbENvbGxlY3Rpb24uX3NlbGVjdG9ySXNJZChzZWxlY3RvcikpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGRvYykge1xuICAgICAgcmV0dXJuIEVKU09OLmVxdWFscyhkb2MuX2lkLCBzZWxlY3Rvcik7XG4gICAgfTtcbiAgfVxuXG4gIC8vIHByb3RlY3QgYWdhaW5zdCBkYW5nZXJvdXMgc2VsZWN0b3JzLiAgZmFsc2V5IGFuZCB7X2lkOiBmYWxzZXl9IGFyZSBib3RoXG4gIC8vIGxpa2VseSBwcm9ncmFtbWVyIGVycm9yLCBhbmQgbm90IHdoYXQgeW91IHdhbnQsIHBhcnRpY3VsYXJseSBmb3JcbiAgLy8gZGVzdHJ1Y3RpdmUgb3BlcmF0aW9ucy5cbiAgaWYgKCFzZWxlY3RvciB8fCAoKCdfaWQnIGluIHNlbGVjdG9yKSAmJiAhc2VsZWN0b3IuX2lkKSlcbiAgICByZXR1cm4gZnVuY3Rpb24gKGRvYykge3JldHVybiBmYWxzZTt9O1xuXG4gIC8vIFRvcCBsZXZlbCBjYW4ndCBiZSBhbiBhcnJheSBvciB0cnVlIG9yIGJpbmFyeS5cbiAgaWYgKHR5cGVvZihzZWxlY3RvcikgPT09ICdib29sZWFuJyB8fCBpc0FycmF5KHNlbGVjdG9yKSB8fFxuICAgICAgRUpTT04uaXNCaW5hcnkoc2VsZWN0b3IpKVxuICAgIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgc2VsZWN0b3I6IFwiICsgc2VsZWN0b3IpO1xuXG4gIHJldHVybiBjb21waWxlRG9jdW1lbnRTZWxlY3RvcihzZWxlY3Rvcik7XG59O1xuXG4vLyBHaXZlIGEgc29ydCBzcGVjLCB3aGljaCBjYW4gYmUgaW4gYW55IG9mIHRoZXNlIGZvcm1zOlxuLy8gICB7XCJrZXkxXCI6IDEsIFwia2V5MlwiOiAtMX1cbi8vICAgW1tcImtleTFcIiwgXCJhc2NcIl0sIFtcImtleTJcIiwgXCJkZXNjXCJdXVxuLy8gICBbXCJrZXkxXCIsIFtcImtleTJcIiwgXCJkZXNjXCJdXVxuLy9cbi8vICguLiB3aXRoIHRoZSBmaXJzdCBmb3JtIGJlaW5nIGRlcGVuZGVudCBvbiB0aGUga2V5IGVudW1lcmF0aW9uXG4vLyBiZWhhdmlvciBvZiB5b3VyIGphdmFzY3JpcHQgVk0sIHdoaWNoIHVzdWFsbHkgZG9lcyB3aGF0IHlvdSBtZWFuIGluXG4vLyB0aGlzIGNhc2UgaWYgdGhlIGtleSBuYW1lcyBkb24ndCBsb29rIGxpa2UgaW50ZWdlcnMgLi4pXG4vL1xuLy8gcmV0dXJuIGEgZnVuY3Rpb24gdGhhdCB0YWtlcyB0d28gb2JqZWN0cywgYW5kIHJldHVybnMgLTEgaWYgdGhlXG4vLyBmaXJzdCBvYmplY3QgY29tZXMgZmlyc3QgaW4gb3JkZXIsIDEgaWYgdGhlIHNlY29uZCBvYmplY3QgY29tZXNcbi8vIGZpcnN0LCBvciAwIGlmIG5laXRoZXIgb2JqZWN0IGNvbWVzIGJlZm9yZSB0aGUgb3RoZXIuXG5cbkxvY2FsQ29sbGVjdGlvbi5fY29tcGlsZVNvcnQgPSBmdW5jdGlvbiAoc3BlYykge1xuICB2YXIgc29ydFNwZWNQYXJ0cyA9IFtdO1xuXG4gIGlmIChzcGVjIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNwZWMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmICh0eXBlb2Ygc3BlY1tpXSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICBzb3J0U3BlY1BhcnRzLnB1c2goe1xuICAgICAgICAgIGxvb2t1cDogTG9jYWxDb2xsZWN0aW9uLl9tYWtlTG9va3VwRnVuY3Rpb24oc3BlY1tpXSksXG4gICAgICAgICAgYXNjZW5kaW5nOiB0cnVlXG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc29ydFNwZWNQYXJ0cy5wdXNoKHtcbiAgICAgICAgICBsb29rdXA6IExvY2FsQ29sbGVjdGlvbi5fbWFrZUxvb2t1cEZ1bmN0aW9uKHNwZWNbaV1bMF0pLFxuICAgICAgICAgIGFzY2VuZGluZzogc3BlY1tpXVsxXSAhPT0gXCJkZXNjXCJcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2UgaWYgKHR5cGVvZiBzcGVjID09PSBcIm9iamVjdFwiKSB7XG4gICAgZm9yICh2YXIga2V5IGluIHNwZWMpIHtcbiAgICAgIHNvcnRTcGVjUGFydHMucHVzaCh7XG4gICAgICAgIGxvb2t1cDogTG9jYWxDb2xsZWN0aW9uLl9tYWtlTG9va3VwRnVuY3Rpb24oa2V5KSxcbiAgICAgICAgYXNjZW5kaW5nOiBzcGVjW2tleV0gPj0gMFxuICAgICAgfSk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHRocm93IEVycm9yKFwiQmFkIHNvcnQgc3BlY2lmaWNhdGlvbjogXCIsIEpTT04uc3RyaW5naWZ5KHNwZWMpKTtcbiAgfVxuXG4gIGlmIChzb3J0U3BlY1BhcnRzLmxlbmd0aCA9PT0gMClcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge3JldHVybiAwO307XG5cbiAgLy8gcmVkdWNlVmFsdWUgdGFrZXMgaW4gYWxsIHRoZSBwb3NzaWJsZSB2YWx1ZXMgZm9yIHRoZSBzb3J0IGtleSBhbG9uZyB2YXJpb3VzXG4gIC8vIGJyYW5jaGVzLCBhbmQgcmV0dXJucyB0aGUgbWluIG9yIG1heCB2YWx1ZSAoYWNjb3JkaW5nIHRvIHRoZSBib29sXG4gIC8vIGZpbmRNaW4pLiBFYWNoIHZhbHVlIGNhbiBpdHNlbGYgYmUgYW4gYXJyYXksIGFuZCB3ZSBsb29rIGF0IGl0cyB2YWx1ZXNcbiAgLy8gdG9vLiAoaWUsIHdlIGRvIGEgc2luZ2xlIGxldmVsIG9mIGZsYXR0ZW5pbmcgb24gYnJhbmNoVmFsdWVzLCB0aGVuIGZpbmQgdGhlXG4gIC8vIG1pbi9tYXguKVxuICB2YXIgcmVkdWNlVmFsdWUgPSBmdW5jdGlvbiAoYnJhbmNoVmFsdWVzLCBmaW5kTWluKSB7XG4gICAgdmFyIHJlZHVjZWQ7XG4gICAgdmFyIGZpcnN0ID0gdHJ1ZTtcbiAgICAvLyBJdGVyYXRlIG92ZXIgYWxsIHRoZSB2YWx1ZXMgZm91bmQgaW4gYWxsIHRoZSBicmFuY2hlcywgYW5kIGlmIGEgdmFsdWUgaXNcbiAgICAvLyBhbiBhcnJheSBpdHNlbGYsIGl0ZXJhdGUgb3ZlciB0aGUgdmFsdWVzIGluIHRoZSBhcnJheSBzZXBhcmF0ZWx5LlxuICAgIF8uZWFjaChicmFuY2hWYWx1ZXMsIGZ1bmN0aW9uIChicmFuY2hWYWx1ZSkge1xuICAgICAgLy8gVmFsdWUgbm90IGFuIGFycmF5PyBQcmV0ZW5kIGl0IGlzLlxuICAgICAgaWYgKCFpc0FycmF5KGJyYW5jaFZhbHVlKSlcbiAgICAgICAgYnJhbmNoVmFsdWUgPSBbYnJhbmNoVmFsdWVdO1xuICAgICAgLy8gVmFsdWUgaXMgYW4gZW1wdHkgYXJyYXk/IFByZXRlbmQgaXQgd2FzIG1pc3NpbmcsIHNpbmNlIHRoYXQncyB3aGVyZSBpdFxuICAgICAgLy8gc2hvdWxkIGJlIHNvcnRlZC5cbiAgICAgIGlmIChpc0FycmF5KGJyYW5jaFZhbHVlKSAmJiBicmFuY2hWYWx1ZS5sZW5ndGggPT09IDApXG4gICAgICAgIGJyYW5jaFZhbHVlID0gW3VuZGVmaW5lZF07XG4gICAgICBfLmVhY2goYnJhbmNoVmFsdWUsIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAvLyBXZSBzaG91bGQgZ2V0IGhlcmUgYXQgbGVhc3Qgb25jZTogbG9va3VwIGZ1bmN0aW9ucyByZXR1cm4gbm9uLWVtcHR5XG4gICAgICAgIC8vIGFycmF5cywgc28gdGhlIG91dGVyIGxvb3AgcnVucyBhdCBsZWFzdCBvbmNlLCBhbmQgd2UgcHJldmVudGVkXG4gICAgICAgIC8vIGJyYW5jaFZhbHVlIGZyb20gYmVpbmcgYW4gZW1wdHkgYXJyYXkuXG4gICAgICAgIGlmIChmaXJzdCkge1xuICAgICAgICAgIHJlZHVjZWQgPSB2YWx1ZTtcbiAgICAgICAgICBmaXJzdCA9IGZhbHNlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIENvbXBhcmUgdGhlIHZhbHVlIHdlIGZvdW5kIHRvIHRoZSB2YWx1ZSB3ZSBmb3VuZCBzbyBmYXIsIHNhdmluZyBpdFxuICAgICAgICAgIC8vIGlmIGl0J3MgbGVzcyAoZm9yIGFuIGFzY2VuZGluZyBzb3J0KSBvciBtb3JlIChmb3IgYSBkZXNjZW5kaW5nXG4gICAgICAgICAgLy8gc29ydCkuXG4gICAgICAgICAgdmFyIGNtcCA9IExvY2FsQ29sbGVjdGlvbi5fZi5fY21wKHJlZHVjZWQsIHZhbHVlKTtcbiAgICAgICAgICBpZiAoKGZpbmRNaW4gJiYgY21wID4gMCkgfHwgKCFmaW5kTWluICYmIGNtcCA8IDApKVxuICAgICAgICAgICAgcmVkdWNlZCA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICByZXR1cm4gcmVkdWNlZDtcbiAgfTtcblxuICByZXR1cm4gZnVuY3Rpb24gKGEsIGIpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNvcnRTcGVjUGFydHMubGVuZ3RoOyArK2kpIHtcbiAgICAgIHZhciBzcGVjUGFydCA9IHNvcnRTcGVjUGFydHNbaV07XG4gICAgICB2YXIgYVZhbHVlID0gcmVkdWNlVmFsdWUoc3BlY1BhcnQubG9va3VwKGEpLCBzcGVjUGFydC5hc2NlbmRpbmcpO1xuICAgICAgdmFyIGJWYWx1ZSA9IHJlZHVjZVZhbHVlKHNwZWNQYXJ0Lmxvb2t1cChiKSwgc3BlY1BhcnQuYXNjZW5kaW5nKTtcbiAgICAgIHZhciBjb21wYXJlID0gTG9jYWxDb2xsZWN0aW9uLl9mLl9jbXAoYVZhbHVlLCBiVmFsdWUpO1xuICAgICAgaWYgKGNvbXBhcmUgIT09IDApXG4gICAgICAgIHJldHVybiBzcGVjUGFydC5hc2NlbmRpbmcgPyBjb21wYXJlIDogLWNvbXBhcmU7XG4gICAgfTtcbiAgICByZXR1cm4gMDtcbiAgfTtcbn07XG5cbmV4cG9ydHMuY29tcGlsZURvY3VtZW50U2VsZWN0b3IgPSBjb21waWxlRG9jdW1lbnRTZWxlY3RvcjtcbmV4cG9ydHMuY29tcGlsZVNvcnQgPSBMb2NhbENvbGxlY3Rpb24uX2NvbXBpbGVTb3J0OyIsIiMgVXRpbGl0aWVzIGZvciBkYiBoYW5kbGluZ1xuXG5jb21waWxlRG9jdW1lbnRTZWxlY3RvciA9IHJlcXVpcmUoJy4vc2VsZWN0b3InKS5jb21waWxlRG9jdW1lbnRTZWxlY3RvclxuY29tcGlsZVNvcnQgPSByZXF1aXJlKCcuL3NlbGVjdG9yJykuY29tcGlsZVNvcnRcbkdlb0pTT04gPSByZXF1aXJlICcuLi9HZW9KU09OJ1xuXG5cbmV4cG9ydHMucHJvY2Vzc0ZpbmQgPSAoaXRlbXMsIHNlbGVjdG9yLCBvcHRpb25zKSAtPlxuICBmaWx0ZXJlZCA9IF8uZmlsdGVyKF8udmFsdWVzKGl0ZW1zKSwgY29tcGlsZURvY3VtZW50U2VsZWN0b3Ioc2VsZWN0b3IpKVxuXG4gICMgSGFuZGxlIGdlb3NwYXRpYWwgb3BlcmF0b3JzXG4gIGZpbHRlcmVkID0gcHJvY2Vzc05lYXJPcGVyYXRvcihzZWxlY3RvciwgZmlsdGVyZWQpXG4gIGZpbHRlcmVkID0gcHJvY2Vzc0dlb0ludGVyc2VjdHNPcGVyYXRvcihzZWxlY3RvciwgZmlsdGVyZWQpXG5cbiAgaWYgb3B0aW9ucyBhbmQgb3B0aW9ucy5zb3J0IFxuICAgIGZpbHRlcmVkLnNvcnQoY29tcGlsZVNvcnQob3B0aW9ucy5zb3J0KSlcblxuICBpZiBvcHRpb25zIGFuZCBvcHRpb25zLmxpbWl0XG4gICAgZmlsdGVyZWQgPSBfLmZpcnN0IGZpbHRlcmVkLCBvcHRpb25zLmxpbWl0XG5cbiAgIyBDbG9uZSB0byBwcmV2ZW50IGFjY2lkZW50YWwgdXBkYXRlcywgb3IgYXBwbHkgZmllbGRzIGlmIHByZXNlbnRcbiAgaWYgb3B0aW9ucyBhbmQgb3B0aW9ucy5maWVsZHNcbiAgICBpZiBfLmZpcnN0KF8udmFsdWVzKG9wdGlvbnMuZmllbGRzKSkgPT0gMVxuICAgICAgIyBJbmNsdWRlIGZpZWxkc1xuICAgICAgZmlsdGVyZWQgPSBfLm1hcCBmaWx0ZXJlZCwgKGRvYykgLT4gXy5waWNrKGRvYywgXy5rZXlzKG9wdGlvbnMuZmllbGRzKS5jb25jYXQoW1wiX2lkXCJdKSlcbiAgICBlbHNlXG4gICAgICAjIEV4Y2x1ZGUgZmllbGRzXG4gICAgICBmaWx0ZXJlZCA9IF8ubWFwIGZpbHRlcmVkLCAoZG9jKSAtPiBfLm9taXQoZG9jLCBfLmtleXMob3B0aW9ucy5maWVsZHMpKVxuICBlbHNlXG4gICAgZmlsdGVyZWQgPSBfLm1hcCBmaWx0ZXJlZCwgKGRvYykgLT4gXy5jbG9uZURlZXAoZG9jKVxuXG4gIHJldHVybiBmaWx0ZXJlZFxuXG5leHBvcnRzLmNyZWF0ZVVpZCA9IC0+IFxuICAneHh4eHh4eHh4eHh4NHh4eHl4eHh4eHh4eHh4eHh4eHgnLnJlcGxhY2UoL1t4eV0vZywgKGMpIC0+XG4gICAgciA9IE1hdGgucmFuZG9tKCkqMTZ8MFxuICAgIHYgPSBpZiBjID09ICd4JyB0aGVuIHIgZWxzZSAociYweDN8MHg4KVxuICAgIHJldHVybiB2LnRvU3RyaW5nKDE2KVxuICAgKVxuXG5wcm9jZXNzTmVhck9wZXJhdG9yID0gKHNlbGVjdG9yLCBsaXN0KSAtPlxuICBmb3Iga2V5LCB2YWx1ZSBvZiBzZWxlY3RvclxuICAgIGlmIHZhbHVlPyBhbmQgdmFsdWVbJyRuZWFyJ11cbiAgICAgIGdlbyA9IHZhbHVlWyckbmVhciddWyckZ2VvbWV0cnknXVxuICAgICAgaWYgZ2VvLnR5cGUgIT0gJ1BvaW50J1xuICAgICAgICBicmVha1xuXG4gICAgICBuZWFyID0gbmV3IEwuTGF0TG5nKGdlby5jb29yZGluYXRlc1sxXSwgZ2VvLmNvb3JkaW5hdGVzWzBdKVxuXG4gICAgICBsaXN0ID0gXy5maWx0ZXIgbGlzdCwgKGRvYykgLT5cbiAgICAgICAgcmV0dXJuIGRvY1trZXldIGFuZCBkb2Nba2V5XS50eXBlID09ICdQb2ludCdcblxuICAgICAgIyBHZXQgZGlzdGFuY2VzXG4gICAgICBkaXN0YW5jZXMgPSBfLm1hcCBsaXN0LCAoZG9jKSAtPlxuICAgICAgICByZXR1cm4geyBkb2M6IGRvYywgZGlzdGFuY2U6IFxuICAgICAgICAgIG5lYXIuZGlzdGFuY2VUbyhuZXcgTC5MYXRMbmcoZG9jW2tleV0uY29vcmRpbmF0ZXNbMV0sIGRvY1trZXldLmNvb3JkaW5hdGVzWzBdKSlcbiAgICAgICAgfVxuXG4gICAgICAjIEZpbHRlciBub24tcG9pbnRzXG4gICAgICBkaXN0YW5jZXMgPSBfLmZpbHRlciBkaXN0YW5jZXMsIChpdGVtKSAtPiBpdGVtLmRpc3RhbmNlID49IDBcblxuICAgICAgIyBTb3J0IGJ5IGRpc3RhbmNlXG4gICAgICBkaXN0YW5jZXMgPSBfLnNvcnRCeSBkaXN0YW5jZXMsICdkaXN0YW5jZSdcblxuICAgICAgIyBGaWx0ZXIgYnkgbWF4RGlzdGFuY2VcbiAgICAgIGlmIHZhbHVlWyckbmVhciddWyckbWF4RGlzdGFuY2UnXVxuICAgICAgICBkaXN0YW5jZXMgPSBfLmZpbHRlciBkaXN0YW5jZXMsIChpdGVtKSAtPiBpdGVtLmRpc3RhbmNlIDw9IHZhbHVlWyckbmVhciddWyckbWF4RGlzdGFuY2UnXVxuXG4gICAgICAjIExpbWl0IHRvIDEwMFxuICAgICAgZGlzdGFuY2VzID0gXy5maXJzdCBkaXN0YW5jZXMsIDEwMFxuXG4gICAgICAjIEV4dHJhY3QgZG9jc1xuICAgICAgbGlzdCA9IF8ucGx1Y2sgZGlzdGFuY2VzLCAnZG9jJ1xuICByZXR1cm4gbGlzdFxuXG5wcm9jZXNzR2VvSW50ZXJzZWN0c09wZXJhdG9yID0gKHNlbGVjdG9yLCBsaXN0KSAtPlxuICBmb3Iga2V5LCB2YWx1ZSBvZiBzZWxlY3RvclxuICAgIGlmIHZhbHVlPyBhbmQgdmFsdWVbJyRnZW9JbnRlcnNlY3RzJ11cbiAgICAgIGdlbyA9IHZhbHVlWyckZ2VvSW50ZXJzZWN0cyddWyckZ2VvbWV0cnknXVxuICAgICAgaWYgZ2VvLnR5cGUgIT0gJ1BvbHlnb24nXG4gICAgICAgIGJyZWFrXG5cbiAgICAgICMgQ2hlY2sgd2l0aGluIGZvciBlYWNoXG4gICAgICBsaXN0ID0gXy5maWx0ZXIgbGlzdCwgKGRvYykgLT5cbiAgICAgICAgIyBSZWplY3Qgbm9uLXBvaW50c1xuICAgICAgICBpZiBub3QgZG9jW2tleV0gb3IgZG9jW2tleV0udHlwZSAhPSAnUG9pbnQnXG4gICAgICAgICAgcmV0dXJuIGZhbHNlXG5cbiAgICAgICAgIyBDaGVjayBwb2x5Z29uXG4gICAgICAgIHJldHVybiBHZW9KU09OLnBvaW50SW5Qb2x5Z29uKGRvY1trZXldLCBnZW8pXG5cbiAgcmV0dXJuIGxpc3RcbiIsIlBhZ2UgPSByZXF1aXJlKFwiLi4vUGFnZVwiKVxuU291cmNlUGFnZSA9IHJlcXVpcmUoXCIuL1NvdXJjZVBhZ2VcIilcbkxvY2F0aW9uRmluZGVyID0gcmVxdWlyZSAnLi4vTG9jYXRpb25GaW5kZXInXG5HZW9KU09OID0gcmVxdWlyZSAnLi4vR2VvSlNPTidcblxuXG4jIExpc3RzIG5lYXJieSBhbmQgdW5sb2NhdGVkIHNvdXJjZXNcbiMgT3B0aW9uczogb25TZWxlY3QgLSBmdW5jdGlvbiB0byBjYWxsIHdpdGggc291cmNlIGRvYyB3aGVuIHNlbGVjdGVkXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFNvdXJjZUxpc3RQYWdlIGV4dGVuZHMgUGFnZVxuICBldmVudHM6IFxuICAgICdjbGljayB0ci50YXBwYWJsZScgOiAnc291cmNlQ2xpY2tlZCdcbiAgICAnY2xpY2sgI3NlYXJjaF9jYW5jZWwnIDogJ2NhbmNlbFNlYXJjaCdcblxuICBjcmVhdGU6IC0+XG4gICAgQHNldFRpdGxlICdOZWFyYnkgU291cmNlcydcblxuICBhY3RpdmF0ZTogLT5cbiAgICBAJGVsLmh0bWwgdGVtcGxhdGVzWydwYWdlcy9Tb3VyY2VMaXN0UGFnZSddKClcbiAgICBAbmVhclNvdXJjZXMgPSBbXVxuICAgIEB1bmxvY2F0ZWRTb3VyY2VzID0gW11cblxuICAgICMgRmluZCBsb2NhdGlvblxuICAgIEBsb2NhdGlvbkZpbmRlciA9IG5ldyBMb2NhdGlvbkZpbmRlcigpXG4gICAgQGxvY2F0aW9uRmluZGVyLm9uKCdmb3VuZCcsIEBsb2NhdGlvbkZvdW5kKS5vbignZXJyb3InLCBAbG9jYXRpb25FcnJvcilcbiAgICBAbG9jYXRpb25GaW5kZXIuZ2V0TG9jYXRpb24oKVxuICAgIEAkKFwiI2xvY2F0aW9uX21zZ1wiKS5zaG93KClcblxuICAgIEBzZXR1cEJ1dHRvbkJhciBbXG4gICAgICB7IGljb246IFwic2VhcmNoLnBuZ1wiLCBjbGljazogPT4gQHNlYXJjaCgpIH1cbiAgICAgIHsgaWNvbjogXCJwbHVzLnBuZ1wiLCBjbGljazogPT4gQGFkZFNvdXJjZSgpIH1cbiAgICBdXG5cbiAgICAjIFF1ZXJ5IGRhdGFiYXNlIGZvciB1bmxvY2F0ZWQgc291cmNlc1xuICAgIGlmIEBsb2dpblxuICAgICAgQGRiLnNvdXJjZXMuZmluZChnZW86IHsgJGV4aXN0czogZmFsc2UgfSwgdXNlcjogQGxvZ2luLnVzZXIpLmZldGNoIChzb3VyY2VzKSA9PlxuICAgICAgICBAdW5sb2NhdGVkU291cmNlcyA9IHNvdXJjZXNcbiAgICAgICAgQHJlbmRlckxpc3QoKVxuXG4gICAgQHBlcmZvcm1TZWFyY2goKVxuXG4gIGFkZFNvdXJjZTogLT5cbiAgICBAcGFnZXIub3BlblBhZ2UocmVxdWlyZShcIi4vTmV3U291cmNlUGFnZVwiKSlcbiAgICBcbiAgbG9jYXRpb25Gb3VuZDogKHBvcykgPT5cbiAgICBAJChcIiNsb2NhdGlvbl9tc2dcIikuaGlkZSgpXG4gICAgc2VsZWN0b3IgPSBnZW86IFxuICAgICAgJG5lYXI6IFxuICAgICAgICAkZ2VvbWV0cnk6IEdlb0pTT04ucG9zVG9Qb2ludChwb3MpXG5cbiAgICAjIFF1ZXJ5IGRhdGFiYXNlIGZvciBuZWFyIHNvdXJjZXNcbiAgICBAZGIuc291cmNlcy5maW5kKHNlbGVjdG9yLCB7IGxpbWl0OiAxMDAgfSkuZmV0Y2ggKHNvdXJjZXMpID0+XG4gICAgICBAbmVhclNvdXJjZXMgPSBzb3VyY2VzXG4gICAgICBAcmVuZGVyTGlzdCgpXG5cbiAgcmVuZGVyTGlzdDogLT5cbiAgICAjIEFwcGVuZCBsb2NhdGVkIGFuZCB1bmxvY2F0ZWQgc291cmNlc1xuICAgIGlmIG5vdCBAc2VhcmNoVGV4dFxuICAgICAgc291cmNlcyA9IEB1bmxvY2F0ZWRTb3VyY2VzLmNvbmNhdChAbmVhclNvdXJjZXMpXG4gICAgZWxzZVxuICAgICAgc291cmNlcyA9IEBzZWFyY2hTb3VyY2VzXG5cbiAgICBAJChcIiN0YWJsZVwiKS5odG1sIHRlbXBsYXRlc1sncGFnZXMvU291cmNlTGlzdFBhZ2VfaXRlbXMnXShzb3VyY2VzOnNvdXJjZXMpXG5cbiAgbG9jYXRpb25FcnJvcjogKHBvcykgPT5cbiAgICBAJChcIiNsb2NhdGlvbl9tc2dcIikuaGlkZSgpXG4gICAgQHBhZ2VyLmZsYXNoIFwiVW5hYmxlIHRvIGRldGVybWluZSBsb2NhdGlvblwiLCBcImVycm9yXCJcblxuICBzb3VyY2VDbGlja2VkOiAoZXYpIC0+XG4gICAgIyBXcmFwIG9uU2VsZWN0XG4gICAgb25TZWxlY3QgPSB1bmRlZmluZWRcbiAgICBpZiBAb3B0aW9ucy5vblNlbGVjdFxuICAgICAgb25TZWxlY3QgPSAoc291cmNlKSA9PlxuICAgICAgICBAcGFnZXIuY2xvc2VQYWdlKClcbiAgICAgICAgQG9wdGlvbnMub25TZWxlY3Qoc291cmNlKVxuICAgIEBwYWdlci5vcGVuUGFnZShTb3VyY2VQYWdlLCB7IF9pZDogZXYuY3VycmVudFRhcmdldC5pZCwgb25TZWxlY3Q6IG9uU2VsZWN0fSlcblxuICBzZWFyY2g6IC0+XG4gICAgIyBQcm9tcHQgZm9yIHNlYXJjaFxuICAgIEBzZWFyY2hUZXh0ID0gcHJvbXB0KFwiRW50ZXIgc2VhcmNoIHRleHQgb3IgSUQgb2Ygd2F0ZXIgc291cmNlXCIpXG4gICAgQHBlcmZvcm1TZWFyY2goKVxuXG4gIHBlcmZvcm1TZWFyY2g6IC0+XG4gICAgQCQoXCIjc2VhcmNoX2JhclwiKS50b2dnbGUoQHNlYXJjaFRleHQgYW5kIEBzZWFyY2hUZXh0Lmxlbmd0aD4wKVxuICAgIEAkKFwiI3NlYXJjaF90ZXh0XCIpLnRleHQoQHNlYXJjaFRleHQpXG4gICAgaWYgQHNlYXJjaFRleHRcbiAgICAgICMgSWYgZGlnaXRzLCBzZWFyY2ggZm9yIGNvZGVcbiAgICAgIGlmIEBzZWFyY2hUZXh0Lm1hdGNoKC9eXFxkKyQvKVxuICAgICAgICBzZWxlY3RvciA9IHsgY29kZTogQHNlYXJjaFRleHQgfVxuICAgICAgZWxzZVxuICAgICAgICBzZWxlY3RvciA9IHsgJG9yOiBbIHsgbmFtZTogbmV3IFJlZ0V4cChAc2VhcmNoVGV4dCxcImlcIikgfSwgeyBkZXNjOiBuZXcgUmVnRXhwKEBzZWFyY2hUZXh0LFwiaVwiKSB9IF0gfVxuICAgICAgICBcbiAgICAgIEBkYi5zb3VyY2VzLmZpbmQoc2VsZWN0b3IsIHtsaW1pdDogNTB9KS5mZXRjaCAoc291cmNlcykgPT5cbiAgICAgICAgQHNlYXJjaFNvdXJjZXMgPSBzb3VyY2VzXG4gICAgICAgIEByZW5kZXJMaXN0KClcbiAgICBlbHNlXG4gICAgICBAcmVuZGVyTGlzdCgpXG5cbiAgY2FuY2VsU2VhcmNoOiAtPlxuICAgIEBzZWFyY2hUZXh0ID0gXCJcIlxuICAgIEBwZXJmb3JtU2VhcmNoKClcblxuIiwiRUpTT04gPSB7fTsgLy8gR2xvYmFsIVxudmFyIGN1c3RvbVR5cGVzID0ge307XG4vLyBBZGQgYSBjdXN0b20gdHlwZSwgdXNpbmcgYSBtZXRob2Qgb2YgeW91ciBjaG9pY2UgdG8gZ2V0IHRvIGFuZFxuLy8gZnJvbSBhIGJhc2ljIEpTT04tYWJsZSByZXByZXNlbnRhdGlvbi4gIFRoZSBmYWN0b3J5IGFyZ3VtZW50XG4vLyBpcyBhIGZ1bmN0aW9uIG9mIEpTT04tYWJsZSAtLT4geW91ciBvYmplY3Rcbi8vIFRoZSB0eXBlIHlvdSBhZGQgbXVzdCBoYXZlOlxuLy8gLSBBIGNsb25lKCkgbWV0aG9kLCBzbyB0aGF0IE1ldGVvciBjYW4gZGVlcC1jb3B5IGl0IHdoZW4gbmVjZXNzYXJ5LlxuLy8gLSBBIGVxdWFscygpIG1ldGhvZCwgc28gdGhhdCBNZXRlb3IgY2FuIGNvbXBhcmUgaXRcbi8vIC0gQSB0b0pTT05WYWx1ZSgpIG1ldGhvZCwgc28gdGhhdCBNZXRlb3IgY2FuIHNlcmlhbGl6ZSBpdFxuLy8gLSBhIHR5cGVOYW1lKCkgbWV0aG9kLCB0byBzaG93IGhvdyB0byBsb29rIGl0IHVwIGluIG91ciB0eXBlIHRhYmxlLlxuLy8gSXQgaXMgb2theSBpZiB0aGVzZSBtZXRob2RzIGFyZSBtb25rZXktcGF0Y2hlZCBvbi5cbkVKU09OLmFkZFR5cGUgPSBmdW5jdGlvbiAobmFtZSwgZmFjdG9yeSkge1xuICBpZiAoXy5oYXMoY3VzdG9tVHlwZXMsIG5hbWUpKVxuICAgIHRocm93IG5ldyBFcnJvcihcIlR5cGUgXCIgKyBuYW1lICsgXCIgYWxyZWFkeSBwcmVzZW50XCIpO1xuICBjdXN0b21UeXBlc1tuYW1lXSA9IGZhY3Rvcnk7XG59O1xuXG52YXIgYnVpbHRpbkNvbnZlcnRlcnMgPSBbXG4gIHsgLy8gRGF0ZVxuICAgIG1hdGNoSlNPTlZhbHVlOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICByZXR1cm4gXy5oYXMob2JqLCAnJGRhdGUnKSAmJiBfLnNpemUob2JqKSA9PT0gMTtcbiAgICB9LFxuICAgIG1hdGNoT2JqZWN0OiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICByZXR1cm4gb2JqIGluc3RhbmNlb2YgRGF0ZTtcbiAgICB9LFxuICAgIHRvSlNPTlZhbHVlOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICByZXR1cm4geyRkYXRlOiBvYmouZ2V0VGltZSgpfTtcbiAgICB9LFxuICAgIGZyb21KU09OVmFsdWU6IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgIHJldHVybiBuZXcgRGF0ZShvYmouJGRhdGUpO1xuICAgIH1cbiAgfSxcbiAgeyAvLyBCaW5hcnlcbiAgICBtYXRjaEpTT05WYWx1ZTogZnVuY3Rpb24gKG9iaikge1xuICAgICAgcmV0dXJuIF8uaGFzKG9iaiwgJyRiaW5hcnknKSAmJiBfLnNpemUob2JqKSA9PT0gMTtcbiAgICB9LFxuICAgIG1hdGNoT2JqZWN0OiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICByZXR1cm4gdHlwZW9mIFVpbnQ4QXJyYXkgIT09ICd1bmRlZmluZWQnICYmIG9iaiBpbnN0YW5jZW9mIFVpbnQ4QXJyYXlcbiAgICAgICAgfHwgKG9iaiAmJiBfLmhhcyhvYmosICckVWludDhBcnJheVBvbHlmaWxsJykpO1xuICAgIH0sXG4gICAgdG9KU09OVmFsdWU6IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgIHJldHVybiB7JGJpbmFyeTogRUpTT04uX2Jhc2U2NEVuY29kZShvYmopfTtcbiAgICB9LFxuICAgIGZyb21KU09OVmFsdWU6IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgIHJldHVybiBFSlNPTi5fYmFzZTY0RGVjb2RlKG9iai4kYmluYXJ5KTtcbiAgICB9XG4gIH0sXG4gIHsgLy8gRXNjYXBpbmcgb25lIGxldmVsXG4gICAgbWF0Y2hKU09OVmFsdWU6IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgIHJldHVybiBfLmhhcyhvYmosICckZXNjYXBlJykgJiYgXy5zaXplKG9iaikgPT09IDE7XG4gICAgfSxcbiAgICBtYXRjaE9iamVjdDogZnVuY3Rpb24gKG9iaikge1xuICAgICAgaWYgKF8uaXNFbXB0eShvYmopIHx8IF8uc2l6ZShvYmopID4gMikge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICByZXR1cm4gXy5hbnkoYnVpbHRpbkNvbnZlcnRlcnMsIGZ1bmN0aW9uIChjb252ZXJ0ZXIpIHtcbiAgICAgICAgcmV0dXJuIGNvbnZlcnRlci5tYXRjaEpTT05WYWx1ZShvYmopO1xuICAgICAgfSk7XG4gICAgfSxcbiAgICB0b0pTT05WYWx1ZTogZnVuY3Rpb24gKG9iaikge1xuICAgICAgdmFyIG5ld09iaiA9IHt9O1xuICAgICAgXy5lYWNoKG9iaiwgZnVuY3Rpb24gKHZhbHVlLCBrZXkpIHtcbiAgICAgICAgbmV3T2JqW2tleV0gPSBFSlNPTi50b0pTT05WYWx1ZSh2YWx1ZSk7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiB7JGVzY2FwZTogbmV3T2JqfTtcbiAgICB9LFxuICAgIGZyb21KU09OVmFsdWU6IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgIHZhciBuZXdPYmogPSB7fTtcbiAgICAgIF8uZWFjaChvYmouJGVzY2FwZSwgZnVuY3Rpb24gKHZhbHVlLCBrZXkpIHtcbiAgICAgICAgbmV3T2JqW2tleV0gPSBFSlNPTi5mcm9tSlNPTlZhbHVlKHZhbHVlKTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIG5ld09iajtcbiAgICB9XG4gIH0sXG4gIHsgLy8gQ3VzdG9tXG4gICAgbWF0Y2hKU09OVmFsdWU6IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgIHJldHVybiBfLmhhcyhvYmosICckdHlwZScpICYmIF8uaGFzKG9iaiwgJyR2YWx1ZScpICYmIF8uc2l6ZShvYmopID09PSAyO1xuICAgIH0sXG4gICAgbWF0Y2hPYmplY3Q6IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgIHJldHVybiBFSlNPTi5faXNDdXN0b21UeXBlKG9iaik7XG4gICAgfSxcbiAgICB0b0pTT05WYWx1ZTogZnVuY3Rpb24gKG9iaikge1xuICAgICAgcmV0dXJuIHskdHlwZTogb2JqLnR5cGVOYW1lKCksICR2YWx1ZTogb2JqLnRvSlNPTlZhbHVlKCl9O1xuICAgIH0sXG4gICAgZnJvbUpTT05WYWx1ZTogZnVuY3Rpb24gKG9iaikge1xuICAgICAgdmFyIHR5cGVOYW1lID0gb2JqLiR0eXBlO1xuICAgICAgdmFyIGNvbnZlcnRlciA9IGN1c3RvbVR5cGVzW3R5cGVOYW1lXTtcbiAgICAgIHJldHVybiBjb252ZXJ0ZXIob2JqLiR2YWx1ZSk7XG4gICAgfVxuICB9XG5dO1xuXG5FSlNPTi5faXNDdXN0b21UeXBlID0gZnVuY3Rpb24gKG9iaikge1xuICByZXR1cm4gb2JqICYmXG4gICAgdHlwZW9mIG9iai50b0pTT05WYWx1ZSA9PT0gJ2Z1bmN0aW9uJyAmJlxuICAgIHR5cGVvZiBvYmoudHlwZU5hbWUgPT09ICdmdW5jdGlvbicgJiZcbiAgICBfLmhhcyhjdXN0b21UeXBlcywgb2JqLnR5cGVOYW1lKCkpO1xufTtcblxuXG4vL2ZvciBib3RoIGFycmF5cyBhbmQgb2JqZWN0cywgaW4tcGxhY2UgbW9kaWZpY2F0aW9uLlxudmFyIGFkanVzdFR5cGVzVG9KU09OVmFsdWUgPVxuRUpTT04uX2FkanVzdFR5cGVzVG9KU09OVmFsdWUgPSBmdW5jdGlvbiAob2JqKSB7XG4gIGlmIChvYmogPT09IG51bGwpXG4gICAgcmV0dXJuIG51bGw7XG4gIHZhciBtYXliZUNoYW5nZWQgPSB0b0pTT05WYWx1ZUhlbHBlcihvYmopO1xuICBpZiAobWF5YmVDaGFuZ2VkICE9PSB1bmRlZmluZWQpXG4gICAgcmV0dXJuIG1heWJlQ2hhbmdlZDtcbiAgXy5lYWNoKG9iaiwgZnVuY3Rpb24gKHZhbHVlLCBrZXkpIHtcbiAgICBpZiAodHlwZW9mIHZhbHVlICE9PSAnb2JqZWN0JyAmJiB2YWx1ZSAhPT0gdW5kZWZpbmVkKVxuICAgICAgcmV0dXJuOyAvLyBjb250aW51ZVxuICAgIHZhciBjaGFuZ2VkID0gdG9KU09OVmFsdWVIZWxwZXIodmFsdWUpO1xuICAgIGlmIChjaGFuZ2VkKSB7XG4gICAgICBvYmpba2V5XSA9IGNoYW5nZWQ7XG4gICAgICByZXR1cm47IC8vIG9uIHRvIHRoZSBuZXh0IGtleVxuICAgIH1cbiAgICAvLyBpZiB3ZSBnZXQgaGVyZSwgdmFsdWUgaXMgYW4gb2JqZWN0IGJ1dCBub3QgYWRqdXN0YWJsZVxuICAgIC8vIGF0IHRoaXMgbGV2ZWwuICByZWN1cnNlLlxuICAgIGFkanVzdFR5cGVzVG9KU09OVmFsdWUodmFsdWUpO1xuICB9KTtcbiAgcmV0dXJuIG9iajtcbn07XG5cbi8vIEVpdGhlciByZXR1cm4gdGhlIEpTT04tY29tcGF0aWJsZSB2ZXJzaW9uIG9mIHRoZSBhcmd1bWVudCwgb3IgdW5kZWZpbmVkIChpZlxuLy8gdGhlIGl0ZW0gaXNuJ3QgaXRzZWxmIHJlcGxhY2VhYmxlLCBidXQgbWF5YmUgc29tZSBmaWVsZHMgaW4gaXQgYXJlKVxudmFyIHRvSlNPTlZhbHVlSGVscGVyID0gZnVuY3Rpb24gKGl0ZW0pIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBidWlsdGluQ29udmVydGVycy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBjb252ZXJ0ZXIgPSBidWlsdGluQ29udmVydGVyc1tpXTtcbiAgICBpZiAoY29udmVydGVyLm1hdGNoT2JqZWN0KGl0ZW0pKSB7XG4gICAgICByZXR1cm4gY29udmVydGVyLnRvSlNPTlZhbHVlKGl0ZW0pO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdW5kZWZpbmVkO1xufTtcblxuRUpTT04udG9KU09OVmFsdWUgPSBmdW5jdGlvbiAoaXRlbSkge1xuICB2YXIgY2hhbmdlZCA9IHRvSlNPTlZhbHVlSGVscGVyKGl0ZW0pO1xuICBpZiAoY2hhbmdlZCAhPT0gdW5kZWZpbmVkKVxuICAgIHJldHVybiBjaGFuZ2VkO1xuICBpZiAodHlwZW9mIGl0ZW0gPT09ICdvYmplY3QnKSB7XG4gICAgaXRlbSA9IEVKU09OLmNsb25lKGl0ZW0pO1xuICAgIGFkanVzdFR5cGVzVG9KU09OVmFsdWUoaXRlbSk7XG4gIH1cbiAgcmV0dXJuIGl0ZW07XG59O1xuXG4vL2ZvciBib3RoIGFycmF5cyBhbmQgb2JqZWN0cy4gVHJpZXMgaXRzIGJlc3QgdG8ganVzdFxuLy8gdXNlIHRoZSBvYmplY3QgeW91IGhhbmQgaXQsIGJ1dCBtYXkgcmV0dXJuIHNvbWV0aGluZ1xuLy8gZGlmZmVyZW50IGlmIHRoZSBvYmplY3QgeW91IGhhbmQgaXQgaXRzZWxmIG5lZWRzIGNoYW5naW5nLlxudmFyIGFkanVzdFR5cGVzRnJvbUpTT05WYWx1ZSA9XG5FSlNPTi5fYWRqdXN0VHlwZXNGcm9tSlNPTlZhbHVlID0gZnVuY3Rpb24gKG9iaikge1xuICBpZiAob2JqID09PSBudWxsKVxuICAgIHJldHVybiBudWxsO1xuICB2YXIgbWF5YmVDaGFuZ2VkID0gZnJvbUpTT05WYWx1ZUhlbHBlcihvYmopO1xuICBpZiAobWF5YmVDaGFuZ2VkICE9PSBvYmopXG4gICAgcmV0dXJuIG1heWJlQ2hhbmdlZDtcbiAgXy5lYWNoKG9iaiwgZnVuY3Rpb24gKHZhbHVlLCBrZXkpIHtcbiAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnb2JqZWN0Jykge1xuICAgICAgdmFyIGNoYW5nZWQgPSBmcm9tSlNPTlZhbHVlSGVscGVyKHZhbHVlKTtcbiAgICAgIGlmICh2YWx1ZSAhPT0gY2hhbmdlZCkge1xuICAgICAgICBvYmpba2V5XSA9IGNoYW5nZWQ7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIC8vIGlmIHdlIGdldCBoZXJlLCB2YWx1ZSBpcyBhbiBvYmplY3QgYnV0IG5vdCBhZGp1c3RhYmxlXG4gICAgICAvLyBhdCB0aGlzIGxldmVsLiAgcmVjdXJzZS5cbiAgICAgIGFkanVzdFR5cGVzRnJvbUpTT05WYWx1ZSh2YWx1ZSk7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIG9iajtcbn07XG5cbi8vIEVpdGhlciByZXR1cm4gdGhlIGFyZ3VtZW50IGNoYW5nZWQgdG8gaGF2ZSB0aGUgbm9uLWpzb25cbi8vIHJlcCBvZiBpdHNlbGYgKHRoZSBPYmplY3QgdmVyc2lvbikgb3IgdGhlIGFyZ3VtZW50IGl0c2VsZi5cblxuLy8gRE9FUyBOT1QgUkVDVVJTRS4gIEZvciBhY3R1YWxseSBnZXR0aW5nIHRoZSBmdWxseS1jaGFuZ2VkIHZhbHVlLCB1c2Vcbi8vIEVKU09OLmZyb21KU09OVmFsdWVcbnZhciBmcm9tSlNPTlZhbHVlSGVscGVyID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gIGlmICh0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIHZhbHVlICE9PSBudWxsKSB7XG4gICAgaWYgKF8uc2l6ZSh2YWx1ZSkgPD0gMlxuICAgICAgICAmJiBfLmFsbCh2YWx1ZSwgZnVuY3Rpb24gKHYsIGspIHtcbiAgICAgICAgICByZXR1cm4gdHlwZW9mIGsgPT09ICdzdHJpbmcnICYmIGsuc3Vic3RyKDAsIDEpID09PSAnJCc7XG4gICAgICAgIH0pKSB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGJ1aWx0aW5Db252ZXJ0ZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBjb252ZXJ0ZXIgPSBidWlsdGluQ29udmVydGVyc1tpXTtcbiAgICAgICAgaWYgKGNvbnZlcnRlci5tYXRjaEpTT05WYWx1ZSh2YWx1ZSkpIHtcbiAgICAgICAgICByZXR1cm4gY29udmVydGVyLmZyb21KU09OVmFsdWUodmFsdWUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiB2YWx1ZTtcbn07XG5cbkVKU09OLmZyb21KU09OVmFsdWUgPSBmdW5jdGlvbiAoaXRlbSkge1xuICB2YXIgY2hhbmdlZCA9IGZyb21KU09OVmFsdWVIZWxwZXIoaXRlbSk7XG4gIGlmIChjaGFuZ2VkID09PSBpdGVtICYmIHR5cGVvZiBpdGVtID09PSAnb2JqZWN0Jykge1xuICAgIGl0ZW0gPSBFSlNPTi5jbG9uZShpdGVtKTtcbiAgICBhZGp1c3RUeXBlc0Zyb21KU09OVmFsdWUoaXRlbSk7XG4gICAgcmV0dXJuIGl0ZW07XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGNoYW5nZWQ7XG4gIH1cbn07XG5cbkVKU09OLnN0cmluZ2lmeSA9IGZ1bmN0aW9uIChpdGVtKSB7XG4gIHJldHVybiBKU09OLnN0cmluZ2lmeShFSlNPTi50b0pTT05WYWx1ZShpdGVtKSk7XG59O1xuXG5FSlNPTi5wYXJzZSA9IGZ1bmN0aW9uIChpdGVtKSB7XG4gIHJldHVybiBFSlNPTi5mcm9tSlNPTlZhbHVlKEpTT04ucGFyc2UoaXRlbSkpO1xufTtcblxuRUpTT04uaXNCaW5hcnkgPSBmdW5jdGlvbiAob2JqKSB7XG4gIHJldHVybiAodHlwZW9mIFVpbnQ4QXJyYXkgIT09ICd1bmRlZmluZWQnICYmIG9iaiBpbnN0YW5jZW9mIFVpbnQ4QXJyYXkpIHx8XG4gICAgKG9iaiAmJiBvYmouJFVpbnQ4QXJyYXlQb2x5ZmlsbCk7XG59O1xuXG5FSlNPTi5lcXVhbHMgPSBmdW5jdGlvbiAoYSwgYiwgb3B0aW9ucykge1xuICB2YXIgaTtcbiAgdmFyIGtleU9yZGVyU2Vuc2l0aXZlID0gISEob3B0aW9ucyAmJiBvcHRpb25zLmtleU9yZGVyU2Vuc2l0aXZlKTtcbiAgaWYgKGEgPT09IGIpXG4gICAgcmV0dXJuIHRydWU7XG4gIGlmICghYSB8fCAhYikgLy8gaWYgZWl0aGVyIG9uZSBpcyBmYWxzeSwgdGhleSdkIGhhdmUgdG8gYmUgPT09IHRvIGJlIGVxdWFsXG4gICAgcmV0dXJuIGZhbHNlO1xuICBpZiAoISh0eXBlb2YgYSA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIGIgPT09ICdvYmplY3QnKSlcbiAgICByZXR1cm4gZmFsc2U7XG4gIGlmIChhIGluc3RhbmNlb2YgRGF0ZSAmJiBiIGluc3RhbmNlb2YgRGF0ZSlcbiAgICByZXR1cm4gYS52YWx1ZU9mKCkgPT09IGIudmFsdWVPZigpO1xuICBpZiAoRUpTT04uaXNCaW5hcnkoYSkgJiYgRUpTT04uaXNCaW5hcnkoYikpIHtcbiAgICBpZiAoYS5sZW5ndGggIT09IGIubGVuZ3RoKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIGZvciAoaSA9IDA7IGkgPCBhLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoYVtpXSAhPT0gYltpXSlcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICBpZiAodHlwZW9mIChhLmVxdWFscykgPT09ICdmdW5jdGlvbicpXG4gICAgcmV0dXJuIGEuZXF1YWxzKGIsIG9wdGlvbnMpO1xuICBpZiAoYSBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgaWYgKCEoYiBpbnN0YW5jZW9mIEFycmF5KSlcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICBpZiAoYS5sZW5ndGggIT09IGIubGVuZ3RoKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIGZvciAoaSA9IDA7IGkgPCBhLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoIUVKU09OLmVxdWFscyhhW2ldLCBiW2ldLCBvcHRpb25zKSlcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICAvLyBmYWxsIGJhY2sgdG8gc3RydWN0dXJhbCBlcXVhbGl0eSBvZiBvYmplY3RzXG4gIHZhciByZXQ7XG4gIGlmIChrZXlPcmRlclNlbnNpdGl2ZSkge1xuICAgIHZhciBiS2V5cyA9IFtdO1xuICAgIF8uZWFjaChiLCBmdW5jdGlvbiAodmFsLCB4KSB7XG4gICAgICAgIGJLZXlzLnB1c2goeCk7XG4gICAgfSk7XG4gICAgaSA9IDA7XG4gICAgcmV0ID0gXy5hbGwoYSwgZnVuY3Rpb24gKHZhbCwgeCkge1xuICAgICAgaWYgKGkgPj0gYktleXMubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGlmICh4ICE9PSBiS2V5c1tpXSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBpZiAoIUVKU09OLmVxdWFscyh2YWwsIGJbYktleXNbaV1dLCBvcHRpb25zKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBpKys7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9KTtcbiAgICByZXR1cm4gcmV0ICYmIGkgPT09IGJLZXlzLmxlbmd0aDtcbiAgfSBlbHNlIHtcbiAgICBpID0gMDtcbiAgICByZXQgPSBfLmFsbChhLCBmdW5jdGlvbiAodmFsLCBrZXkpIHtcbiAgICAgIGlmICghXy5oYXMoYiwga2V5KSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBpZiAoIUVKU09OLmVxdWFscyh2YWwsIGJba2V5XSwgb3B0aW9ucykpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgaSsrO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSk7XG4gICAgcmV0dXJuIHJldCAmJiBfLnNpemUoYikgPT09IGk7XG4gIH1cbn07XG5cbkVKU09OLmNsb25lID0gZnVuY3Rpb24gKHYpIHtcbiAgdmFyIHJldDtcbiAgaWYgKHR5cGVvZiB2ICE9PSBcIm9iamVjdFwiKVxuICAgIHJldHVybiB2O1xuICBpZiAodiA9PT0gbnVsbClcbiAgICByZXR1cm4gbnVsbDsgLy8gbnVsbCBoYXMgdHlwZW9mIFwib2JqZWN0XCJcbiAgaWYgKHYgaW5zdGFuY2VvZiBEYXRlKVxuICAgIHJldHVybiBuZXcgRGF0ZSh2LmdldFRpbWUoKSk7XG4gIGlmIChFSlNPTi5pc0JpbmFyeSh2KSkge1xuICAgIHJldCA9IEVKU09OLm5ld0JpbmFyeSh2Lmxlbmd0aCk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB2Lmxlbmd0aDsgaSsrKSB7XG4gICAgICByZXRbaV0gPSB2W2ldO1xuICAgIH1cbiAgICByZXR1cm4gcmV0O1xuICB9XG4gIGlmIChfLmlzQXJyYXkodikgfHwgXy5pc0FyZ3VtZW50cyh2KSkge1xuICAgIC8vIEZvciBzb21lIHJlYXNvbiwgXy5tYXAgZG9lc24ndCB3b3JrIGluIHRoaXMgY29udGV4dCBvbiBPcGVyYSAod2VpcmQgdGVzdFxuICAgIC8vIGZhaWx1cmVzKS5cbiAgICByZXQgPSBbXTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgdi5sZW5ndGg7IGkrKylcbiAgICAgIHJldFtpXSA9IEVKU09OLmNsb25lKHZbaV0pO1xuICAgIHJldHVybiByZXQ7XG4gIH1cbiAgLy8gaGFuZGxlIGdlbmVyYWwgdXNlci1kZWZpbmVkIHR5cGVkIE9iamVjdHMgaWYgdGhleSBoYXZlIGEgY2xvbmUgbWV0aG9kXG4gIGlmICh0eXBlb2Ygdi5jbG9uZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiB2LmNsb25lKCk7XG4gIH1cbiAgLy8gaGFuZGxlIG90aGVyIG9iamVjdHNcbiAgcmV0ID0ge307XG4gIF8uZWFjaCh2LCBmdW5jdGlvbiAodmFsdWUsIGtleSkge1xuICAgIHJldFtrZXldID0gRUpTT04uY2xvbmUodmFsdWUpO1xuICB9KTtcbiAgcmV0dXJuIHJldDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRUpTT047IiwiUGFnZSA9IHJlcXVpcmUoXCIuLi9QYWdlXCIpXG5Mb2NhdGlvblZpZXcgPSByZXF1aXJlIChcIi4uL0xvY2F0aW9uVmlld1wiKVxuZm9ybXMgPSByZXF1aXJlICcuLi9mb3JtcydcblxuXG4jIERpc3BsYXlzIGEgc291cmNlXG4jIE9wdGlvbnM6IHNldExvY2F0aW9uIC0gdHJ1ZSB0byBhdXRvc2V0IGxvY2F0aW9uXG4jIG9uU2VsZWN0IC0gY2FsbCB3aGVuIHNvdXJjZSBpcyBzZWxlY3RlZCB2aWEgYnV0dG9uIHRoYXQgYXBwZWFyc1xubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBTb3VyY2VQYWdlIGV4dGVuZHMgUGFnZVxuICBldmVudHM6XG4gICAgJ2NsaWNrICNlZGl0X3NvdXJjZV9idXR0b24nIDogJ2VkaXRTb3VyY2UnXG4gICAgJ2NsaWNrICNhZGRfdGVzdF9idXR0b24nIDogJ2FkZFRlc3QnXG4gICAgJ2NsaWNrICNhZGRfbm90ZV9idXR0b24nIDogJ2FkZE5vdGUnXG4gICAgJ2NsaWNrIC50ZXN0JyA6ICdvcGVuVGVzdCdcbiAgICAnY2xpY2sgLm5vdGUnIDogJ29wZW5Ob3RlJ1xuICAgICdjbGljayAjc2VsZWN0X3NvdXJjZScgOiAnc2VsZWN0U291cmNlJ1xuXG4gIGNyZWF0ZTogLT5cbiAgICBAc2V0TG9jYXRpb24gPSBAb3B0aW9ucy5zZXRMb2NhdGlvblxuXG4gIGFjdGl2YXRlOiAtPlxuICAgIEBkYi5zb3VyY2VzLmZpbmRPbmUge19pZDogQG9wdGlvbnMuX2lkfSwgKHNvdXJjZSkgPT5cbiAgICAgIEBzb3VyY2UgPSBzb3VyY2VcbiAgICAgIEByZW5kZXIoKVxuXG4gICAgICAjIEhpZGUgYWRkL2VkaXQgaWYgbm90IGF1dGhvcml6ZWRcbiAgICAgIEAkKFwiI2VkaXRfc291cmNlX2J1dHRvblwiKS50b2dnbGUoQGF1dGgudXBkYXRlKFwic291cmNlc1wiLCBzb3VyY2UpKVxuICAgICAgQCQoXCIjYWRkX3Rlc3RfYnV0dG9uXCIpLnRvZ2dsZShAYXV0aC5pbnNlcnQoXCJ0ZXN0c1wiKSlcbiAgICAgIEAkKFwiI2FkZF9ub3RlX2J1dHRvblwiKS50b2dnbGUoQGF1dGguaW5zZXJ0KFwic291cmNlX25vdGVzXCIpKVxuXG4gIHJlbmRlcjogLT5cbiAgICBAc2V0VGl0bGUgXCJTb3VyY2UgXCIgKyBAc291cmNlLmNvZGVcblxuICAgIGlmIEBhdXRoLnJlbW92ZShcInNvdXJjZXNcIiwgQHNvdXJjZSlcbiAgICAgIEBzZXR1cENvbnRleHRNZW51IFsgeyBnbHlwaDogJ3JlbW92ZScsIHRleHQ6IFwiRGVsZXRlIFNvdXJjZVwiLCBjbGljazogPT4gQGRlbGV0ZVNvdXJjZSgpIH0gXVxuICAgIGVsc2UgXG4gICAgICBAc2V0dXBDb250ZXh0TWVudSBbIF1cblxuICAgIG1lbnUgPSBbXVxuICAgIGlmIEBhdXRoLmluc2VydChcInRlc3RzXCIpXG4gICAgICBtZW51LnB1c2goeyB0ZXh0OiBcIlN0YXJ0IFdhdGVyIFRlc3RcIiwgY2xpY2s6ID0+IEBhZGRUZXN0KCkgfSlcbiAgICBpZiBAYXV0aC5pbnNlcnQoXCJzb3VyY2Vfbm90ZXNcIilcbiAgICAgIG1lbnUucHVzaCh7IHRleHQ6IFwiQWRkIE5vdGVcIiwgY2xpY2s6ID0+IEBhZGROb3RlKCkgfSlcblxuICAgIEBzZXR1cEJ1dHRvbkJhciBbIHsgaWNvbjogXCJwbHVzLnBuZ1wiLCBtZW51OiBtZW51IH0gXVxuXG4gICAgIyBSZS1yZW5kZXIgdGVtcGxhdGVcbiAgICBAcmVtb3ZlU3Vidmlld3MoKVxuICAgIEAkZWwuaHRtbCB0ZW1wbGF0ZXNbJ3BhZ2VzL1NvdXJjZVBhZ2UnXShzb3VyY2U6IEBzb3VyY2UsIHNlbGVjdDogQG9wdGlvbnMub25TZWxlY3Q/KVxuXG4gICAgIyBTZXQgc291cmNlIHR5cGVcbiAgICBpZiBAc291cmNlLnR5cGU/XG4gICAgICBAZGIuc291cmNlX3R5cGVzLmZpbmRPbmUge2NvZGU6IEBzb3VyY2UudHlwZX0sIChzb3VyY2VUeXBlKSA9PlxuICAgICAgICBpZiBzb3VyY2VUeXBlPyB0aGVuIEAkKFwiI3NvdXJjZV90eXBlXCIpLnRleHQoc291cmNlVHlwZS5uYW1lKVxuXG4gICAgIyBBZGQgbG9jYXRpb24gdmlld1xuICAgIGxvY2F0aW9uVmlldyA9IG5ldyBMb2NhdGlvblZpZXcobG9jOiBAc291cmNlLmdlbywgcmVhZG9ubHk6IG5vdCBAYXV0aC51cGRhdGUoXCJzb3VyY2VzXCIsIEBzb3VyY2UpKVxuICAgIGlmIEBzZXRMb2NhdGlvblxuICAgICAgbG9jYXRpb25WaWV3LnNldExvY2F0aW9uKClcbiAgICAgIEBzZXRMb2NhdGlvbiA9IGZhbHNlXG5cbiAgICBAbGlzdGVuVG8gbG9jYXRpb25WaWV3LCAnbG9jYXRpb25zZXQnLCAobG9jKSAtPlxuICAgICAgQHNvdXJjZS5nZW8gPSBsb2NcbiAgICAgIEBkYi5zb3VyY2VzLnVwc2VydCBAc291cmNlLCA9PiBAcmVuZGVyKClcblxuICAgIEBsaXN0ZW5UbyBsb2NhdGlvblZpZXcsICdtYXAnLCAobG9jKSA9PlxuICAgICAgQHBhZ2VyLm9wZW5QYWdlKHJlcXVpcmUoXCIuL1NvdXJjZU1hcFBhZ2VcIiksIHtpbml0aWFsR2VvOiBsb2N9KVxuICAgICAgXG4gICAgQGFkZFN1YnZpZXcobG9jYXRpb25WaWV3KVxuICAgIEAkKFwiI2xvY2F0aW9uXCIpLmFwcGVuZChsb2NhdGlvblZpZXcuZWwpXG5cbiAgICAjIEFkZCB0ZXN0c1xuICAgIEBkYi50ZXN0cy5maW5kKHtzb3VyY2U6IEBzb3VyY2UuY29kZX0pLmZldGNoICh0ZXN0cykgPT5cbiAgICAgIEAkKFwiI3Rlc3RzXCIpLmh0bWwgdGVtcGxhdGVzWydwYWdlcy9Tb3VyY2VQYWdlX3Rlc3RzJ10odGVzdHM6dGVzdHMpXG5cbiAgICAgICMgRmlsbCBpbiBuYW1lc1xuICAgICAgZm9yIHRlc3QgaW4gdGVzdHNcbiAgICAgICAgQGRiLmZvcm1zLmZpbmRPbmUgeyBjb2RlOnRlc3QudHlwZSB9LCB7IG1vZGU6IFwibG9jYWxcIiB9LCAoZm9ybSkgPT5cbiAgICAgICAgICBAJChcIiN0ZXN0X25hbWVfXCIrdGVzdC5faWQpLnRleHQoaWYgZm9ybSB0aGVuIGZvcm0ubmFtZSBlbHNlIFwiPz8/XCIpXG5cbiAgICAjIEFkZCBub3Rlc1xuICAgIEBkYi5zb3VyY2Vfbm90ZXMuZmluZCh7c291cmNlOiBAc291cmNlLmNvZGV9KS5mZXRjaCAobm90ZXMpID0+IFxuICAgICAgQCQoXCIjbm90ZXNcIikuaHRtbCB0ZW1wbGF0ZXNbJ3BhZ2VzL1NvdXJjZVBhZ2Vfbm90ZXMnXShub3Rlczpub3RlcylcblxuICAgICMgQWRkIHBob3Rvc1xuICAgIHBob3Rvc1ZpZXcgPSBuZXcgZm9ybXMuSW1hZ2VzUXVlc3Rpb25cbiAgICAgIGlkOiAncGhvdG9zJ1xuICAgICAgbW9kZWw6IG5ldyBCYWNrYm9uZS5Nb2RlbChAc291cmNlKVxuICAgICAgY3R4OiBAY3R4XG4gICAgICByZWFkb25seTogbm90IEBhdXRoLnVwZGF0ZShcInNvdXJjZXNcIiwgQHNvdXJjZSlcbiAgICAgIFxuICAgIHBob3Rvc1ZpZXcubW9kZWwub24gJ2NoYW5nZScsID0+XG4gICAgICBAZGIuc291cmNlcy51cHNlcnQgQHNvdXJjZS50b0pTT04oKSwgPT4gQHJlbmRlcigpXG4gICAgQCQoJyNwaG90b3MnKS5hcHBlbmQocGhvdG9zVmlldy5lbClcblxuICBlZGl0U291cmNlOiAtPlxuICAgIEBwYWdlci5vcGVuUGFnZShyZXF1aXJlKFwiLi9Tb3VyY2VFZGl0UGFnZVwiKSwgeyBfaWQ6IEBzb3VyY2UuX2lkfSlcblxuICBkZWxldGVTb3VyY2U6IC0+XG4gICAgaWYgQGF1dGgucmVtb3ZlKFwic291cmNlc1wiLCBAc291cmNlKSBhbmQgY29uZmlybShcIlBlcm1hbmVudGx5IGRlbGV0ZSBzb3VyY2U/XCIpXG4gICAgICBAZGIuc291cmNlcy5yZW1vdmUgQHNvdXJjZS5faWQsID0+XG4gICAgICAgIEBwYWdlci5jbG9zZVBhZ2UoKVxuICAgICAgICBAcGFnZXIuZmxhc2ggXCJTb3VyY2UgZGVsZXRlZFwiLCBcInN1Y2Nlc3NcIlxuXG4gIGFkZFRlc3Q6IC0+XG4gICAgQHBhZ2VyLm9wZW5QYWdlKHJlcXVpcmUoXCIuL05ld1Rlc3RQYWdlXCIpLCB7IHNvdXJjZTogQHNvdXJjZS5jb2RlfSlcblxuICBvcGVuVGVzdDogKGV2KSAtPlxuICAgIEBwYWdlci5vcGVuUGFnZShyZXF1aXJlKFwiLi9UZXN0UGFnZVwiKSwgeyBfaWQ6IGV2LmN1cnJlbnRUYXJnZXQuaWR9KVxuXG4gIGFkZE5vdGU6IC0+XG4gICAgQHBhZ2VyLm9wZW5QYWdlKHJlcXVpcmUoXCIuL1NvdXJjZU5vdGVQYWdlXCIpLCB7IHNvdXJjZTogQHNvdXJjZS5jb2RlfSkgICAjIFRPRE8gaWQgb3IgY29kZT9cblxuICBvcGVuTm90ZTogKGV2KSAtPlxuICAgIEBwYWdlci5vcGVuUGFnZShyZXF1aXJlKFwiLi9Tb3VyY2VOb3RlUGFnZVwiKSwgeyBzb3VyY2U6IEBzb3VyY2UuY29kZSwgX2lkOiBldi5jdXJyZW50VGFyZ2V0LmlkfSlcblxuICBzZWxlY3RTb3VyY2U6IC0+XG4gICAgaWYgQG9wdGlvbnMub25TZWxlY3Q/XG4gICAgICBAcGFnZXIuY2xvc2VQYWdlKClcbiAgICAgIEBvcHRpb25zLm9uU2VsZWN0KEBzb3VyY2UpIiwiUGFnZSA9IHJlcXVpcmUgJy4uL1BhZ2UnXG5mb3JtcyA9IHJlcXVpcmUgJy4uL2Zvcm1zJ1xuU291cmNlUGFnZSA9IHJlcXVpcmUgXCIuL1NvdXJjZVBhZ2VcIlxuXG4jIEFsbG93cyBjcmVhdGluZyBvZiBhIHNvdXJjZVxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBOZXdTb3VyY2VQYWdlIGV4dGVuZHMgUGFnZVxuICBAY2FuT3BlbjogKGN0eCkgLT4gY3R4LmF1dGguaW5zZXJ0KFwic291cmNlc1wiKVxuXG4gIGFjdGl2YXRlOiAtPlxuICAgIEBzZXRUaXRsZSBcIk5ldyBTb3VyY2VcIlxuXG4gICAgIyBDcmVhdGUgbW9kZWwgZnJvbSBzb3VyY2VcbiAgICBAbW9kZWwgPSBuZXcgQmFja2JvbmUuTW9kZWwoc2V0TG9jYXRpb246IHRydWUpXG4gIFxuICAgICMgQ3JlYXRlIHF1ZXN0aW9uc1xuICAgIHNvdXJjZVR5cGVzUXVlc3Rpb24gPSBuZXcgZm9ybXMuRHJvcGRvd25RdWVzdGlvblxuICAgICAgaWQ6ICd0eXBlJ1xuICAgICAgbW9kZWw6IEBtb2RlbFxuICAgICAgcHJvbXB0OiAnRW50ZXIgU291cmNlIFR5cGUnXG4gICAgICBvcHRpb25zOiBbXVxuICAgIEBkYi5zb3VyY2VfdHlwZXMuZmluZCh7fSkuZmV0Y2ggKHNvdXJjZVR5cGVzKSA9PlxuICAgICAgIyBGaWxsIHNvdXJjZSB0eXBlc1xuICAgICAgc291cmNlVHlwZXNRdWVzdGlvbi5zZXRPcHRpb25zIF8ubWFwKHNvdXJjZVR5cGVzLCAoc3QpID0+IFtzdC5jb2RlLCBzdC5uYW1lXSlcblxuICAgIHNhdmVDYW5jZWxGb3JtID0gbmV3IGZvcm1zLlNhdmVDYW5jZWxGb3JtXG4gICAgICBjb250ZW50czogW1xuICAgICAgICBzb3VyY2VUeXBlc1F1ZXN0aW9uXG4gICAgICAgIG5ldyBmb3Jtcy5UZXh0UXVlc3Rpb25cbiAgICAgICAgICBpZDogJ25hbWUnXG4gICAgICAgICAgbW9kZWw6IEBtb2RlbFxuICAgICAgICAgIHByb21wdDogJ0VudGVyIG9wdGlvbmFsIG5hbWUnXG4gICAgICAgIG5ldyBmb3Jtcy5UZXh0UXVlc3Rpb25cbiAgICAgICAgICBpZDogJ2Rlc2MnXG4gICAgICAgICAgbW9kZWw6IEBtb2RlbFxuICAgICAgICAgIHByb21wdDogJ0VudGVyIG9wdGlvbmFsIGRlc2NyaXB0aW9uJ1xuICAgICAgICBuZXcgZm9ybXMuQ2hlY2tRdWVzdGlvblxuICAgICAgICAgIGlkOiAncHJpdmF0ZSdcbiAgICAgICAgICBtb2RlbDogQG1vZGVsXG4gICAgICAgICAgcHJvbXB0OiBcIlByaXZhY3lcIlxuICAgICAgICAgIHRleHQ6ICdXYXRlciBzb3VyY2UgaXMgcHJpdmF0ZSdcbiAgICAgICAgICBoaW50OiAnVGhpcyBzaG91bGQgb25seSBiZSB1c2VkIGZvciBzb3VyY2VzIHRoYXQgYXJlIG5vdCBwdWJsaWNhbGx5IGFjY2Vzc2libGUnXG4gICAgICAgIG5ldyBmb3Jtcy5SYWRpb1F1ZXN0aW9uXG4gICAgICAgICAgaWQ6ICdzZXRMb2NhdGlvbidcbiAgICAgICAgICBtb2RlbDogQG1vZGVsXG4gICAgICAgICAgcHJvbXB0OiAnU2V0IHRvIGN1cnJlbnQgbG9jYXRpb24/J1xuICAgICAgICAgIG9wdGlvbnM6IFtbdHJ1ZSwgJ1llcyddLCBbZmFsc2UsICdObyddXVxuICAgICAgXVxuXG4gICAgQCRlbC5lbXB0eSgpLmFwcGVuZChzYXZlQ2FuY2VsRm9ybS5lbClcblxuICAgIEBsaXN0ZW5UbyBzYXZlQ2FuY2VsRm9ybSwgJ3NhdmUnLCA9PlxuICAgICAgc291cmNlID0gXy5waWNrKEBtb2RlbC50b0pTT04oKSwgJ25hbWUnLCAnZGVzYycsICd0eXBlJywgJ3ByaXZhdGUnKVxuXG4gICAgICBzdWNjZXNzID0gKGNvZGUpID0+XG4gICAgICAgIHNvdXJjZS5jb2RlID0gY29kZVxuICAgICAgICBzb3VyY2UudXNlciA9IEBsb2dpbi51c2VyXG4gICAgICAgIHNvdXJjZS5vcmcgPSBAbG9naW4ub3JnXG5cbiAgICAgICAgQGRiLnNvdXJjZXMudXBzZXJ0IHNvdXJjZSwgKHNvdXJjZSkgPT4gXG4gICAgICAgICAgQHBhZ2VyLmNsb3NlUGFnZShTb3VyY2VQYWdlLCB7IF9pZDogc291cmNlLl9pZCwgc2V0TG9jYXRpb246IEBtb2RlbC5nZXQoJ3NldExvY2F0aW9uJyl9KVxuXG4gICAgICBlcnJvciA9ID0+XG4gICAgICAgIGFsZXJ0KFwiVW5hYmxlIHRvIGdlbmVyYXRlIHNvdXJjZSBpZC4gUGxlYXNlIGVuc3VyZSB0aGF0IHlvdSBoYXZlIGEgY29ubmVjdGlvbiBvciB1c2UgU2V0dGluZ3MgdG8gb2J0YWluIG1vcmUgYmVmb3JlIGdvaW5nIG91dCBvZiBjb25uZWN0aW9uIHJhbmdlLlwiKVxuXG4gICAgICBAc291cmNlQ29kZXNNYW5hZ2VyLnJlcXVlc3RDb2RlKHN1Y2Nlc3MsIGVycm9yKVxuXG4gICAgQGxpc3RlblRvIHNhdmVDYW5jZWxGb3JtLCAnY2FuY2VsJywgPT5cbiAgICAgIEBwYWdlci5jbG9zZVBhZ2UoKVxuICIsIlBhZ2UgPSByZXF1aXJlIFwiLi4vUGFnZVwiXG5UZXN0UGFnZSA9IHJlcXVpcmUgXCIuL1Rlc3RQYWdlXCJcblxuIyBQYXJhbWV0ZXIgaXMgb3B0aW9uYWwgc291cmNlIGNvZGVcbmNsYXNzIE5ld1Rlc3RQYWdlIGV4dGVuZHMgUGFnZVxuICBAY2FuT3BlbjogKGN0eCkgLT4gY3R4LmF1dGguaW5zZXJ0KFwidGVzdHNcIilcblxuICBldmVudHM6IFxuICAgIFwiY2xpY2sgLnRlc3RcIiA6IFwic3RhcnRUZXN0XCJcblxuICBhY3RpdmF0ZTogLT5cbiAgICBAc2V0VGl0bGUgXCJTZWxlY3QgVGVzdFwiXG5cbiAgICBAZGIuZm9ybXMuZmluZCh7dHlwZTpcIldhdGVyVGVzdFwifSkuZmV0Y2ggKGZvcm1zKSA9PlxuICAgICAgQGZvcm1zID0gZm9ybXNcbiAgICAgIEAkZWwuaHRtbCB0ZW1wbGF0ZXNbJ3BhZ2VzL05ld1Rlc3RQYWdlJ10oZm9ybXM6Zm9ybXMpXG5cbiAgc3RhcnRUZXN0OiAoZXYpIC0+XG4gICAgdGVzdENvZGUgPSBldi5jdXJyZW50VGFyZ2V0LmlkXG5cbiAgICAjIENyZWF0ZSB0ZXN0XG4gICAgdGVzdCA9IHtcbiAgICAgIHNvdXJjZTogQG9wdGlvbnMuc291cmNlXG4gICAgICB0eXBlOiB0ZXN0Q29kZVxuICAgICAgY29tcGxldGVkOiBudWxsXG4gICAgICBzdGFydGVkOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKClcbiAgICAgIHVzZXI6IEBsb2dpbi51c2VyXG4gICAgICBvcmc6IEBsb2dpbi5vcmdcbiAgICB9XG4gICAgQGRiLnRlc3RzLnVwc2VydCB0ZXN0LCAodGVzdCkgPT5cbiAgICAgIEBwYWdlci5jbG9zZVBhZ2UoVGVzdFBhZ2UsIHsgX2lkOiB0ZXN0Ll9pZCB9KVxuXG5tb2R1bGUuZXhwb3J0cyA9IE5ld1Rlc3RQYWdlIiwiUGFnZSA9IHJlcXVpcmUgXCIuLi9QYWdlXCJcblNvdXJjZVBhZ2UgPSByZXF1aXJlIFwiLi9Tb3VyY2VQYWdlXCJcbkl0ZW1UcmFja2VyID0gcmVxdWlyZSBcIi4uL0l0ZW1UcmFja2VyXCJcbkxvY2F0aW9uRmluZGVyID0gcmVxdWlyZSAnLi4vTG9jYXRpb25GaW5kZXInXG5HZW9KU09OID0gcmVxdWlyZSAnLi4vR2VvSlNPTidcblxuIyBNYXAgb2Ygd2F0ZXIgc291cmNlcy4gT3B0aW9ucyBpbmNsdWRlOlxuIyBpbml0aWFsR2VvOiBHZW9tZXRyeSB0byB6b29tIHRvLiBQb2ludCBvbmx5IHN1cHBvcnRlZC5cbmNsYXNzIFNvdXJjZU1hcFBhZ2UgZXh0ZW5kcyBQYWdlXG4gIGNyZWF0ZTogLT5cbiAgICBAc2V0VGl0bGUgXCJTb3VyY2UgTWFwXCJcblxuICAgICMgQ2FsY3VsYXRlIGhlaWdodFxuICAgIEAkZWwuaHRtbCB0ZW1wbGF0ZXNbJ3BhZ2VzL1NvdXJjZU1hcFBhZ2UnXSgpXG5cbiAgICBMLkljb24uRGVmYXVsdC5pbWFnZVBhdGggPSBcImltZy9sZWFmbGV0XCJcbiAgICBAbWFwID0gTC5tYXAodGhpcy4kKFwiI21hcFwiKVswXSlcbiAgICBMLmNvbnRyb2wuc2NhbGUoaW1wZXJpYWw6ZmFsc2UpLmFkZFRvKEBtYXApXG4gICAgQHJlc2l6ZU1hcCgpXG5cbiAgICAjIFJlY2FsY3VsYXRlIG9uIHJlc2l6ZVxuICAgICQod2luZG93KS5vbigncmVzaXplJywgQHJlc2l6ZU1hcClcblxuICAgICMgU2V0dXAgbWFwIHRpbGVzXG4gICAgc2V0dXBNYXBUaWxlcygpLmFkZFRvKEBtYXApXG5cbiAgICAjIFNldHVwIG1hcmtlciBkaXNwbGF5XG4gICAgQHNvdXJjZURpc3BsYXkgPSBuZXcgU291cmNlRGlzcGxheShAbWFwLCBAZGIsIEBwYWdlcilcblxuICAgICMgVE9ETyB6b29tIHRvIGxhc3Qga25vd24gYm91bmRzXG4gICAgXG4gICAgIyBTZXR1cCBpbml0aWFsIHpvb21cbiAgICBpZiBAb3B0aW9ucy5pbml0aWFsR2VvIGFuZCBAb3B0aW9ucy5pbml0aWFsR2VvLnR5cGU9PVwiUG9pbnRcIlxuICAgICAgQG1hcC5zZXRWaWV3KEwuR2VvSlNPTi5jb29yZHNUb0xhdExuZyhAb3B0aW9ucy5pbml0aWFsR2VvLmNvb3JkaW5hdGVzKSwgMTUpXG5cbiAgICAjIFNldHVwIGxvY2FsdGlvbiBkaXNwbGF5XG4gICAgQGxvY2F0aW9uRGlzcGxheSA9IG5ldyBMb2NhdGlvbkRpc3BsYXkoQG1hcCwgbm90IEBvcHRpb25zLmluaXRpYWxHZW8/KVxuXG4gIGRlc3Ryb3k6IC0+XG4gICAgJCh3aW5kb3cpLm9mZigncmVzaXplJywgQHJlc2l6ZU1hcClcbiAgICBAbG9jYXRpb25EaXNwbGF5LnN0b3AoKVxuXG4gIHJlc2l6ZU1hcDogPT5cbiAgICAjIENhbGN1bGF0ZSBtYXAgaGVpZ2h0XG4gICAgbWFwSGVpZ2h0ID0gJChcImh0bWxcIikuaGVpZ2h0KCkgLSA0MFxuICAgICQoXCIjbWFwXCIpLmNzcyhcImhlaWdodFwiLCBtYXBIZWlnaHQgKyBcInB4XCIpXG4gICAgQG1hcC5pbnZhbGlkYXRlU2l6ZSgpXG5cblxuc2V0dXBNYXBUaWxlcyA9IC0+XG4gIG1hcHF1ZXN0VXJsID0gJ2h0dHA6Ly97c30ubXFjZG4uY29tL3RpbGVzLzEuMC4wL29zbS97en0ve3h9L3t5fS5wbmcnXG4gIHN1YkRvbWFpbnMgPSBbJ290aWxlMScsJ290aWxlMicsJ290aWxlMycsJ290aWxlNCddXG4gIG1hcHF1ZXN0QXR0cmliID0gJ0RhdGEsIGltYWdlcnkgYW5kIG1hcCBpbmZvcm1hdGlvbiBwcm92aWRlZCBieSA8YSBocmVmPVwiaHR0cDovL29wZW4ubWFwcXVlc3QuY28udWtcIiB0YXJnZXQ9XCJfYmxhbmtcIj5NYXBRdWVzdDwvYT4sIDxhIGhyZWY9XCJodHRwOi8vd3d3Lm9wZW5zdHJlZXRtYXAub3JnL1wiIHRhcmdldD1cIl9ibGFua1wiPk9wZW5TdHJlZXRNYXA8L2E+IGFuZCBjb250cmlidXRvcnMuJ1xuICByZXR1cm4gbmV3IEwuVGlsZUxheWVyKG1hcHF1ZXN0VXJsLCB7bWF4Wm9vbTogMTgsIGF0dHJpYnV0aW9uOiBtYXBxdWVzdEF0dHJpYiwgc3ViZG9tYWluczogc3ViRG9tYWluc30pXG5cbmNsYXNzIFNvdXJjZURpc3BsYXlcbiAgY29uc3RydWN0b3I6IChtYXAsIGRiLCBwYWdlcikgLT5cbiAgICBAbWFwID0gbWFwXG4gICAgQGRiID0gZGJcbiAgICBAcGFnZXIgPSBwYWdlclxuICAgIEBpdGVtVHJhY2tlciA9IG5ldyBJdGVtVHJhY2tlcigpXG5cbiAgICBAc291cmNlTWFya2VycyA9IHt9XG4gICAgQG1hcC5vbignbW92ZWVuZCcsIEB1cGRhdGVNYXJrZXJzKVxuXG4gICAgQGljb24gPSBuZXcgTC5pY29uXG4gICAgICBpY29uVXJsOiAnaW1nL0Ryb3BNYXJrZXIucG5nJ1xuICAgICAgaWNvblJldGluYVVybDogJ2ltZy9Ecm9wTWFya2VyQDJ4LnBuZydcbiAgICAgIGljb25TaXplOiBbMjcsIDQxXSxcbiAgICAgIGljb25BbmNob3I6IFsxMywgNDFdXG4gICAgICBwb3B1cEFuY2hvcjogWy0zLCAtNDFdXG4gIFxuICB1cGRhdGVNYXJrZXJzOiA9PlxuICAgICMgR2V0IGJvdW5kcyBwYWRkZWRcbiAgICBib3VuZHMgPSBAbWFwLmdldEJvdW5kcygpLnBhZCgwLjMzKVxuXG4gICAgIyBDaGVjayBmb3IgZW1wdHkgY2FzZVxuICAgIGlmIGJvdW5kcy5nZXRXZXN0KCkgPT0gYm91bmRzLmdldEVhc3QoKVxuICAgICAgcmV0dXJuXG5cbiAgICBib3VuZHNHZW9KU09OID0gR2VvSlNPTi5sYXRMbmdCb3VuZHNUb0dlb0pTT04oYm91bmRzKVxuICAgIHNlbGVjdG9yID0geyBnZW86IHsgJGdlb0ludGVyc2VjdHM6IHsgJGdlb21ldHJ5OiBib3VuZHNHZW9KU09OIH0gfSB9XG5cbiAgICAjIFF1ZXJ5IHNvdXJjZXMgd2l0aCBwcm9qZWN0aW9uLiBVc2UgcmVtb3RlIG1vZGUgc28gbm8gY2FjaGluZyBvY2N1cnNcbiAgICBAZGIuc291cmNlcy5maW5kKHNlbGVjdG9yLCB7IHNvcnQ6IFtcIl9pZFwiXSwgbGltaXQ6IDEwMCwgbW9kZTogXCJyZW1vdGVcIiwgZmllbGRzOiB7IGdlbzogMSB9IH0pLmZldGNoIChzb3VyY2VzKSA9PlxuICAgICAgIyBGaW5kIG91dCB3aGljaCB0byBhZGQvcmVtb3ZlXG4gICAgICBbYWRkcywgcmVtb3Zlc10gPSBAaXRlbVRyYWNrZXIudXBkYXRlKHNvdXJjZXMpXG5cbiAgICAgICMgUmVtb3ZlIG9sZCBtYXJrZXJzXG4gICAgICBmb3IgcmVtb3ZlIGluIHJlbW92ZXNcbiAgICAgICAgQHJlbW92ZVNvdXJjZU1hcmtlcihyZW1vdmUpXG4gICAgICBmb3IgYWRkIGluIGFkZHNcbiAgICAgICAgQGFkZFNvdXJjZU1hcmtlcihhZGQpXG5cbiAgYWRkU291cmNlTWFya2VyOiAoc291cmNlKSAtPlxuICAgIGlmIHNvdXJjZS5nZW8/XG4gICAgICBsYXRsbmcgPSBuZXcgTC5MYXRMbmcoc291cmNlLmdlby5jb29yZGluYXRlc1sxXSwgc291cmNlLmdlby5jb29yZGluYXRlc1swXSlcbiAgICAgIG1hcmtlciA9IG5ldyBMLk1hcmtlcihsYXRsbmcsIHtpY29uOkBpY29ufSlcbiAgICAgIFxuICAgICAgbWFya2VyLm9uICdjbGljaycsID0+XG4gICAgICAgIEBwYWdlci5vcGVuUGFnZShTb3VyY2VQYWdlLCB7X2lkOiBzb3VyY2UuX2lkfSlcbiAgICAgIFxuICAgICAgQHNvdXJjZU1hcmtlcnNbc291cmNlLl9pZF0gPSBtYXJrZXJcbiAgICAgIG1hcmtlci5hZGRUbyhAbWFwKVxuXG4gIHJlbW92ZVNvdXJjZU1hcmtlcjogKHNvdXJjZSkgLT5cbiAgICBpZiBfLmhhcyhAc291cmNlTWFya2Vycywgc291cmNlLl9pZClcbiAgICAgIEBtYXAucmVtb3ZlTGF5ZXIoQHNvdXJjZU1hcmtlcnNbc291cmNlLl9pZF0pXG5cblxuY2xhc3MgTG9jYXRpb25EaXNwbGF5XG4gICMgU2V0dXAgZGlzcGxheSwgb3B0aW9uYWxseSB6b29taW5nIHRvIGN1cnJlbnQgbG9jYXRpb25cbiAgY29uc3RydWN0b3I6IChtYXAsIHpvb21UbykgLT5cbiAgICBAbWFwID0gbWFwXG4gICAgQHpvb21UbyA9IHpvb21Ub1xuXG4gICAgQGxvY2F0aW9uRmluZGVyID0gbmV3IExvY2F0aW9uRmluZGVyKClcbiAgICBAbG9jYXRpb25GaW5kZXIub24oJ2ZvdW5kJywgQGxvY2F0aW9uRm91bmQpLm9uKCdlcnJvcicsIEBsb2NhdGlvbkVycm9yKVxuICAgIEBsb2NhdGlvbkZpbmRlci5zdGFydFdhdGNoKClcblxuICBzdG9wOiAtPlxuICAgIEBsb2NhdGlvbkZpbmRlci5zdG9wV2F0Y2goKVxuXG4gIGxvY2F0aW9uRXJyb3I6IChlKSA9PlxuICAgIGlmIEB6b29tVG9cbiAgICAgIEBtYXAuZml0V29ybGQoKVxuICAgICAgQHpvb21UbyA9IGZhbHNlXG4gICAgICBhbGVydChcIlVuYWJsZSB0byBkZXRlcm1pbmUgbG9jYXRpb25cIilcblxuICBsb2NhdGlvbkZvdW5kOiAoZSkgPT5cbiAgICByYWRpdXMgPSBlLmNvb3Jkcy5hY2N1cmFjeVxuICAgIGxhdGxuZyA9IG5ldyBMLkxhdExuZyhlLmNvb3Jkcy5sYXRpdHVkZSwgZS5jb29yZHMubG9uZ2l0dWRlKVxuXG4gICAgIyBTZXQgcG9zaXRpb24gb25jZVxuICAgIGlmIEB6b29tVG9cbiAgICAgIHpvb20gPSAxNVxuICAgICAgQG1hcC5zZXRWaWV3KGxhdGxuZywgem9vbSlcbiAgICAgIEB6b29tVG8gPSBmYWxzZVxuXG4gICAgIyBSYWRpdXMgbGFyZ2VyIHRoYW4gMWttIG1lYW5zIG5vIGxvY2F0aW9uIHdvcnRoIGRpc3BsYXlpbmdcbiAgICBpZiByYWRpdXMgPiAxMDAwXG4gICAgICByZXR1cm5cblxuICAgICMgU2V0dXAgbWFya2VyIGFuZCBjaXJjbGVcbiAgICBpZiBub3QgQG1lTWFya2VyXG4gICAgICBpY29uID0gIEwuaWNvbihpY29uVXJsOiBcImltZy9teV9sb2NhdGlvbi5wbmdcIiwgaWNvblNpemU6IFsyMiwgMjJdKVxuICAgICAgQG1lTWFya2VyID0gTC5tYXJrZXIobGF0bG5nLCBpY29uOmljb24pLmFkZFRvKEBtYXApXG4gICAgICBAbWVDaXJjbGUgPSBMLmNpcmNsZShsYXRsbmcsIHJhZGl1cylcbiAgICAgIEBtZUNpcmNsZS5hZGRUbyhAbWFwKVxuICAgIGVsc2VcbiAgICAgIEBtZU1hcmtlci5zZXRMYXRMbmcobGF0bG5nKVxuICAgICAgQG1lQ2lyY2xlLnNldExhdExuZyhsYXRsbmcpLnNldFJhZGl1cyhyYWRpdXMpXG5cbm1vZHVsZS5leHBvcnRzID0gU291cmNlTWFwUGFnZSIsIlBhZ2UgPSByZXF1aXJlICcuLi9QYWdlJ1xuZm9ybXMgPSByZXF1aXJlICcuLi9mb3JtcydcblxuIyBBbGxvd3MgZWRpdGluZyBvZiBzb3VyY2UgZGV0YWlsc1xubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBTb3VyY2VFZGl0UGFnZSBleHRlbmRzIFBhZ2VcbiAgQGNhbk9wZW46IChjdHgpIC0+IGN0eC5hdXRoLnVwZGF0ZShcInNvdXJjZXNcIilcblxuICBhY3RpdmF0ZTogLT5cbiAgICBAZGIuc291cmNlcy5maW5kT25lIHtfaWQ6IEBvcHRpb25zLl9pZH0sIChzb3VyY2UpID0+XG4gICAgICAjIENoZWNrIGF1dGhcbiAgICAgIGlmIG5vdCBAYXV0aC51cGRhdGUoXCJzb3VyY2VzXCIsIHNvdXJjZSlcbiAgICAgICAgcmV0dXJuIEBwYWdlci5jbG9zZVBhZ2UoKVxuXG4gICAgICBAc2V0VGl0bGUgXCJFZGl0IFNvdXJjZSAje3NvdXJjZS5jb2RlfVwiXG5cbiAgICAgICMgQ3JlYXRlIG1vZGVsIGZyb20gc291cmNlXG4gICAgICBAbW9kZWwgPSBuZXcgQmFja2JvbmUuTW9kZWwoc291cmNlKVxuICBcbiAgICAgICMgQ3JlYXRlIHF1ZXN0aW9uc1xuICAgICAgc291cmNlVHlwZXNRdWVzdGlvbiA9IG5ldyBmb3Jtcy5Ecm9wZG93blF1ZXN0aW9uXG4gICAgICAgIGlkOiAndHlwZSdcbiAgICAgICAgbW9kZWw6IEBtb2RlbFxuICAgICAgICBwcm9tcHQ6ICdFbnRlciBTb3VyY2UgVHlwZSdcbiAgICAgICAgb3B0aW9uczogW11cbiAgICAgIEBkYi5zb3VyY2VfdHlwZXMuZmluZCh7fSkuZmV0Y2ggKHNvdXJjZVR5cGVzKSA9PlxuICAgICAgICAjIEZpbGwgc291cmNlIHR5cGVzXG4gICAgICAgIHNvdXJjZVR5cGVzUXVlc3Rpb24uc2V0T3B0aW9ucyBfLm1hcChzb3VyY2VUeXBlcywgKHN0KSA9PiBbc3QuY29kZSwgc3QubmFtZV0pXG5cbiAgICAgIHNhdmVDYW5jZWxGb3JtID0gbmV3IGZvcm1zLlNhdmVDYW5jZWxGb3JtXG4gICAgICAgIGNvbnRlbnRzOiBbXG4gICAgICAgICAgc291cmNlVHlwZXNRdWVzdGlvblxuICAgICAgICAgIG5ldyBmb3Jtcy5UZXh0UXVlc3Rpb25cbiAgICAgICAgICAgIGlkOiAnbmFtZSdcbiAgICAgICAgICAgIG1vZGVsOiBAbW9kZWxcbiAgICAgICAgICAgIHByb21wdDogJ0VudGVyIG9wdGlvbmFsIG5hbWUnXG4gICAgICAgICAgbmV3IGZvcm1zLlRleHRRdWVzdGlvblxuICAgICAgICAgICAgaWQ6ICdkZXNjJ1xuICAgICAgICAgICAgbW9kZWw6IEBtb2RlbFxuICAgICAgICAgICAgcHJvbXB0OiAnRW50ZXIgb3B0aW9uYWwgZGVzY3JpcHRpb24nXG4gICAgICAgICAgbmV3IGZvcm1zLkNoZWNrUXVlc3Rpb25cbiAgICAgICAgICAgIGlkOiAncHJpdmF0ZSdcbiAgICAgICAgICAgIG1vZGVsOiBAbW9kZWxcbiAgICAgICAgICAgIHByb21wdDogXCJQcml2YWN5XCJcbiAgICAgICAgICAgIHRleHQ6ICdXYXRlciBzb3VyY2UgaXMgcHJpdmF0ZSdcbiAgICAgICAgICAgIGhpbnQ6ICdUaGlzIHNob3VsZCBvbmx5IGJlIHVzZWQgZm9yIHNvdXJjZXMgdGhhdCBhcmUgbm90IHB1YmxpY2FsbHkgYWNjZXNzaWJsZSdcbiAgICAgICAgXVxuXG4gICAgICBAJGVsLmVtcHR5KCkuYXBwZW5kKHNhdmVDYW5jZWxGb3JtLmVsKVxuXG4gICAgICBAbGlzdGVuVG8gc2F2ZUNhbmNlbEZvcm0sICdzYXZlJywgPT5cbiAgICAgICAgQGRiLnNvdXJjZXMudXBzZXJ0IEBtb2RlbC50b0pTT04oKSwgPT4gQHBhZ2VyLmNsb3NlUGFnZSgpXG5cbiAgICAgIEBsaXN0ZW5UbyBzYXZlQ2FuY2VsRm9ybSwgJ2NhbmNlbCcsID0+XG4gICAgICAgIEBwYWdlci5jbG9zZVBhZ2UoKVxuICIsIlBhZ2UgPSByZXF1aXJlICcuLi9QYWdlJ1xuZm9ybXMgPSByZXF1aXJlICcuLi9mb3JtcydcblxuIyBBbGxvd3MgY3JlYXRpbmcvZWRpdGluZyBvZiBzb3VyY2Ugbm90ZXNcbiMgT3B0aW9ucyBhcmUgXG4jIF9pZDogaWQgb2Ygc291cmNlIG5vdGVcbiMgc291cmNlOiBjb2RlIG9mIHNvdXJjZVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFNvdXJjZU5vdGVQYWdlIGV4dGVuZHMgUGFnZVxuICBhY3RpdmF0ZTogLT5cbiAgICAjIEZpbmQgd2F0ZXIgc291cmNlXG4gICAgQGRiLnNvdXJjZXMuZmluZE9uZSB7Y29kZTogQG9wdGlvbnMuc291cmNlfSwgKHNvdXJjZSkgPT5cbiAgICAgIEBzZXRUaXRsZSBcIk5vdGUgZm9yIFNvdXJjZSAje3NvdXJjZS5jb2RlfVwiXG5cbiAgICAgICMgRmluZCBzb3VyY2Ugbm90ZVxuICAgICAgaWYgQG9wdGlvbnMuX2lkXG4gICAgICAgIEBkYi5zb3VyY2Vfbm90ZXMuZmluZE9uZSB7X2lkOiBAb3B0aW9ucy5faWR9LCAoc291cmNlTm90ZSkgPT5cbiAgICAgICAgICBAc291cmNlTm90ZSA9IHNvdXJjZU5vdGVcbiAgICAgICAgICBAcmVuZGVyKClcbiAgICAgIGVsc2VcbiAgICAgICAgIyBOZXcgc291cmNlIG5vdGUsIGp1c3QgcmVuZGVyXG4gICAgICAgIGlmIG5vdCBAYXV0aC5pbnNlcnQoXCJzb3VyY2Vfbm90ZXNcIilcbiAgICAgICAgICByZXR1cm4gQHBhZ2VyLmNsb3NlUGFnZSgpXG4gICAgICAgIEByZW5kZXIoKVxuXG4gIHJlbmRlcjogLT5cbiAgICAgICMgQ3JlYXRlIG1vZGVsIFxuICAgICAgQG1vZGVsID0gbmV3IEJhY2tib25lLk1vZGVsKClcbiAgXG4gICAgICAjIENyZWF0ZSBxdWVzdGlvbnNcbiAgICAgIHJlYWRvbmx5ID0gQHNvdXJjZU5vdGU/IGFuZCBub3QgQGF1dGgudXBkYXRlKFwic291cmNlX25vdGVzXCIsIEBzb3VyY2VOb3RlKVxuXG4gICAgICBxdWVzdGlvbnMgPSBbXG4gICAgICAgIG5ldyBmb3Jtcy5EYXRlUXVlc3Rpb25cbiAgICAgICAgICBpZDogJ2RhdGUnXG4gICAgICAgICAgbW9kZWw6IEBtb2RlbFxuICAgICAgICAgIHByb21wdDogJ0RhdGUgb2YgVmlzaXQnXG4gICAgICAgICAgcmVxdWlyZWQ6IHRydWVcbiAgICAgICAgICByZWFkb25seTogcmVhZG9ubHlcbiAgICAgICAgbmV3IGZvcm1zLlJhZGlvUXVlc3Rpb25cbiAgICAgICAgICBpZDogJ3N0YXR1cydcbiAgICAgICAgICBtb2RlbDogQG1vZGVsXG4gICAgICAgICAgcHJvbXB0OiAnU3RhdHVzIG9mIFdhdGVyIFNvdXJjZSdcbiAgICAgICAgICBvcHRpb25zOiBbWydvaycsICdGdW5jdGlvbmFsJ10sIFsnbWFpbnQnLCAnTmVlZHMgbWFpbnRlbmFuY2UnXSwgWydicm9rZW4nLCAnTm9uLWZ1bmN0aW9uYWwnXSwgWydtaXNzaW5nJywgJ05vIGxvbmdlciBleGlzdHMnXV1cbiAgICAgICAgICByZXF1aXJlZDogdHJ1ZVxuICAgICAgICAgIHJlYWRvbmx5OiByZWFkb25seVxuICAgICAgICBuZXcgZm9ybXMuVGV4dFF1ZXN0aW9uXG4gICAgICAgICAgaWQ6ICdub3RlcydcbiAgICAgICAgICBtb2RlbDogQG1vZGVsXG4gICAgICAgICAgcHJvbXB0OiAnTm90ZXMnXG4gICAgICAgICAgbXVsdGlsaW5lOiB0cnVlXG4gICAgICAgICAgcmVhZG9ubHk6IHJlYWRvbmx5XG4gICAgICBdXG5cbiAgICAgICMgQ3JlYXRlIGZvcm1cbiAgICAgIGlmIHJlYWRvbmx5XG4gICAgICAgIGZvcm0gPSBuZXcgZm9ybXMuUXVlc3Rpb25Hcm91cFxuICAgICAgICAgIGNvbnRlbnRzOiBxdWVzdGlvbnNcbiAgICAgIGVsc2VcbiAgICAgICAgZm9ybSA9IG5ldyBmb3Jtcy5TYXZlQ2FuY2VsRm9ybVxuICAgICAgICAgIGNvbnRlbnRzOiBxdWVzdGlvbnNcbiAgXG4gICAgICAgIEBsaXN0ZW5UbyBmb3JtLCAnc2F2ZScsID0+XG4gICAgICAgICAgQGRiLnNvdXJjZV9ub3Rlcy51cHNlcnQgQG1vZGVsLnRvSlNPTigpLCA9PiBAcGFnZXIuY2xvc2VQYWdlKClcblxuICAgICAgICBAbGlzdGVuVG8gZm9ybSwgJ2NhbmNlbCcsID0+XG4gICAgICAgICAgQHBhZ2VyLmNsb3NlUGFnZSgpXG5cbiAgICAgICMgTG9hZCBmb3JtIGZyb20gc291cmNlIG5vdGUgaWYgZXhpc3RzXG4gICAgICBpZiBAc291cmNlTm90ZVxuICAgICAgICAgIEBtb2RlbC5zZXQoQHNvdXJjZU5vdGUpXG4gICAgICBlbHNlXG4gICAgICAgICMgQ3JlYXRlIGRlZmF1bHQgZW50cnlcbiAgICAgICAgQG1vZGVsLnNldChzb3VyY2U6IEBvcHRpb25zLnNvdXJjZSwgZGF0ZTogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnN1YnN0cmluZygwLDEwKSlcblxuICAgICAgQCRlbC5lbXB0eSgpLmFwcGVuZChmb3JtLmVsKSAiLCJQYWdlID0gcmVxdWlyZSBcIi4uL1BhZ2VcIlxuZm9ybXMgPSByZXF1aXJlICcuLi9mb3JtcydcblxuY2xhc3MgVGVzdFBhZ2UgZXh0ZW5kcyBQYWdlXG4gIEBjYW5PcGVuOiAoY3R4KSAtPiBjdHguYXV0aC51cGRhdGUoXCJ0ZXN0c1wiKSAmJiBjdHguYXV0aC5pbnNlcnQoXCJ0ZXN0c1wiKSBcblxuICBjcmVhdGU6IC0+IEByZW5kZXIoKVxuXG4gIHJlbmRlcjogLT5cbiAgICBAc2V0VGl0bGUgXCJXYXRlciBUZXN0XCJcblxuICAgICMgR2V0IHRlc3RcbiAgICBAZGIudGVzdHMuZmluZE9uZSB7X2lkOiBAb3B0aW9ucy5faWR9LCAodGVzdCkgPT5cbiAgICAgIEB0ZXN0ID0gdGVzdFxuXG4gICAgICBpZiBAYXV0aC5yZW1vdmUoXCJ0ZXN0c1wiLCBAdGVzdClcbiAgICAgICAgQHNldHVwQ29udGV4dE1lbnUgWyB7IGdseXBoOiAncmVtb3ZlJywgdGV4dDogXCJEZWxldGUgVGVzdFwiLCBjbGljazogPT4gQGRlbGV0ZVRlc3QoKSB9IF1cbiAgICAgIGVsc2UgXG4gICAgICAgIEBzZXR1cENvbnRleHRNZW51IFsgXVxuXG4gICAgICAjIEdldCBmb3JtXG4gICAgICBAZGIuZm9ybXMuZmluZE9uZSB7IHR5cGU6IFwiV2F0ZXJUZXN0XCIsIGNvZGU6IHRlc3QudHlwZSB9LCAoZm9ybSkgPT5cbiAgICAgICAgIyBDaGVjayBpZiBjb21wbGV0ZWRcbiAgICAgICAgaWYgbm90IHRlc3QuY29tcGxldGVkXG4gICAgICAgICAgQGZvcm1WaWV3ID0gZm9ybXMuaW5zdGFudGlhdGVWaWV3KGZvcm0udmlld3MuZWRpdCwgeyBjdHg6IEBjdHggfSlcblxuICAgICAgICAgICMgTGlzdGVuIHRvIGV2ZW50c1xuICAgICAgICAgIEBsaXN0ZW5UbyBAZm9ybVZpZXcsICdjaGFuZ2UnLCBAc2F2ZVxuICAgICAgICAgIEBsaXN0ZW5UbyBAZm9ybVZpZXcsICdjb21wbGV0ZScsIEBjb21wbGV0ZWRcbiAgICAgICAgICBAbGlzdGVuVG8gQGZvcm1WaWV3LCAnY2xvc2UnLCBAY2xvc2VcbiAgICAgICAgZWxzZVxuICAgICAgICAgIEBmb3JtVmlldyA9IGZvcm1zLmluc3RhbnRpYXRlVmlldyhmb3JtLnZpZXdzLmRldGFpbCwgeyBjdHg6IEBjdHggfSlcbiAgXG4gICAgICAgIEAkZWwuaHRtbCB0ZW1wbGF0ZXNbJ3BhZ2VzL1Rlc3RQYWdlJ10oY29tcGxldGVkOiB0ZXN0LmNvbXBsZXRlZCwgdGl0bGU6IGZvcm0ubmFtZSlcbiAgICAgICAgQCQoJyNjb250ZW50cycpLmFwcGVuZChAZm9ybVZpZXcuZWwpXG5cbiAgICAgICAgaWYgbm90IEBhdXRoLnVwZGF0ZShcInRlc3RzXCIsIHRlc3QpXG4gICAgICAgICAgQCQoXCIjZWRpdF9idXR0b25cIikuaGlkZSgpXG5cbiAgICAgICAgQGZvcm1WaWV3LmxvYWQgQHRlc3RcblxuICBldmVudHM6XG4gICAgXCJjbGljayAjZWRpdF9idXR0b25cIiA6IFwiZWRpdFwiXG5cbiAgZGVzdHJveTogLT5cbiAgICAjIExldCBrbm93IHRoYXQgc2F2ZWQgaWYgY2xvc2VkIGluY29tcGxldGVkXG4gICAgaWYgQHRlc3QgYW5kIG5vdCBAdGVzdC5jb21wbGV0ZWRcbiAgICAgIEBwYWdlci5mbGFzaCBcIlRlc3Qgc2F2ZWQgYXMgZHJhZnQuXCJcblxuICBlZGl0OiAtPlxuICAgICMgTWFyayBhcyBpbmNvbXBsZXRlXG4gICAgQHRlc3QuY29tcGxldGVkID0gbnVsbFxuICAgIEBkYi50ZXN0cy51cHNlcnQgQHRlc3QsID0+IEByZW5kZXIoKVxuXG4gIHNhdmU6ID0+XG4gICAgIyBTYXZlIHRvIGRiXG4gICAgQHRlc3QgPSBAZm9ybVZpZXcuc2F2ZSgpXG4gICAgQGRiLnRlc3RzLnVwc2VydChAdGVzdClcblxuICBjbG9zZTogPT5cbiAgICBAc2F2ZSgpXG4gICAgQHBhZ2VyLmNsb3NlUGFnZSgpXG5cbiAgY29tcGxldGVkOiA9PlxuICAgICMgTWFyayBhcyBjb21wbGV0ZWRcbiAgICBAdGVzdC5jb21wbGV0ZWQgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKClcbiAgICBAZGIudGVzdHMudXBzZXJ0IEB0ZXN0LCA9PiBAcmVuZGVyKClcblxuICBkZWxldGVUZXN0OiAtPlxuICAgIGlmIGNvbmZpcm0oXCJQZXJtYW5lbnRseSBkZWxldGUgdGVzdD9cIilcbiAgICAgIEBkYi50ZXN0cy5yZW1vdmUgQHRlc3QuX2lkLCA9PlxuICAgICAgICBAdGVzdCA9IG51bGxcbiAgICAgICAgQHBhZ2VyLmNsb3NlUGFnZSgpXG4gICAgICAgIEBwYWdlci5mbGFzaCBcIlRlc3QgZGVsZXRlZFwiLCBcInN1Y2Nlc3NcIlxuXG5tb2R1bGUuZXhwb3J0cyA9IFRlc3RQYWdlIl19
;