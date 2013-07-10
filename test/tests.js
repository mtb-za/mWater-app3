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
    it("gives only one result if data unchanged", function(done) {
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
      return this.hc.find({}).fetch(function(data) {
        assert.equal(data.length, 2);
        return done();
      }, fail);
    });
    it("gives results twice if remote gives different answer", function(done) {
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
    it("caches remote data");
    it("find only calls local in local mode");
    it("findOne only calls local in local mode");
    it("find only calls remote in remote mode");
    it("findOne only calls remote in remote mode");
    it("find falls back to local if remote fails in remote mode");
    it("findOne falls back to local if remote fails in remote mode");
    it("sync applies pending upserts and deletes");
    return it("keeps upserts and deletes if failed to apply");
  });

}).call(this);


},{"../app/js/db/LocalDb":6,"../app/js/db/HybridDb":7,"./db_queries":8}],9:[function(require,module,exports){
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


},{"forms":"EAVIrc","./helpers/UIDriver":10,"../app/js/pages/ImagePage":11}],12:[function(require,module,exports){
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


},{"forms":"EAVIrc","./helpers/UIDriver":10,"../app/js/pages/ImagePage":11}],13:[function(require,module,exports){
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


},{"../app/js/LocationView":16,"./helpers/UIDriver":10}],17:[function(require,module,exports){
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


},{"../app/js/db/LocalDb":6,"./db_queries":8}],18:[function(require,module,exports){
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


},{"../app/js/db/RemoteDb":19,"./db_queries":8}],20:[function(require,module,exports){
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


},{"forms":"EAVIrc","./helpers/UIDriver":10}],8:[function(require,module,exports){
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
          a: "Alice"
        }, function() {
          return _this.db.scratch.upsert({
            _id: "2",
            a: "Charlie"
          }, function() {
            return _this.db.scratch.upsert({
              _id: "3",
              a: "Bob"
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


},{"../app/js/GeoJSON":4}],"forms":[function(require,module,exports){
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
      return this.listenTo(this.model, 'change', function() {
        return _this.trigger('change');
      });
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


},{"./form-controls":21,"./DateQuestion":22,"./QuestionGroup":23,"./NumberQuestion":24,"./DropdownQuestion":25,"./SaveCancelForm":26,"./SourceQuestion":27,"./ImageQuestion":28,"./ImagesQuestion":29,"./Instructions":30}],2:[function(require,module,exports){
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


},{}],10:[function(require,module,exports){
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


},{}],7:[function(require,module,exports){
(function() {
  var HybridCollection, HybridDb;

  module.exports = HybridDb = (function() {
    function HybridDb(localDb, remoteDb) {
      this.localDb = localDb;
      this.remoteDb = remoteDb;
    }

    HybridDb.prototype.addCollection = function(name) {
      return this[name] = new HybridCollection(name, this.localDb[name], this.remoteDb[name]);
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
      var _ref;
      if (options == null) {
        options = {};
      }
      if (_.isFunction(options)) {
        return _ref = [{}, options, success], options = _ref[0], success = _ref[1], error = _ref[2], _ref;
      }
    };

    HybridCollection.prototype._findFetch = function(selector, options, success, error) {
      var localSuccess, mode,
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
          return _this.remoteCol.find(selector, options).fetch(remoteSuccess);
        };
        return this.localCol.find(selector, options).fetch(localSuccess, error);
      }
    };

    HybridCollection.prototype.upsert = function(doc, success, error) {};

    HybridCollection.prototype.remove = function(id, success, error) {};

    return HybridCollection;

  })();

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


},{"./GeoJSON":4,"./LocationFinder":31}],6:[function(require,module,exports){
(function() {
  var Collection, GeoJSON, LocalDb, compileDocumentSelector, compileSort, createUid, processGeoIntersectsOperator, processNearOperator;

  compileDocumentSelector = require('./selector').compileDocumentSelector;

  compileSort = require('./selector').compileSort;

  GeoJSON = require('../GeoJSON');

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
      var filtered;
      filtered = _.filter(_.values(this.items), compileDocumentSelector(selector));
      filtered = processNearOperator(selector, filtered);
      filtered = processGeoIntersectsOperator(selector, filtered);
      if (options && options.sort) {
        filtered.sort(compileSort(options.sort));
      }
      if (options && options.limit) {
        filtered = _.first(filtered, options.limit);
      }
      filtered = _.map(filtered, function(doc) {
        return _.cloneDeep(doc);
      });
      if (success != null) {
        return success(filtered);
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

  createUid = function() {
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

  module.exports = LocalDb;

}).call(this);


},{"./selector":32,"../GeoJSON":4}],11:[function(require,module,exports){
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


},{"../Page":33}],21:[function(require,module,exports){
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

},{}],23:[function(require,module,exports){
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


},{}],30:[function(require,module,exports){
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


},{}],22:[function(require,module,exports){
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


},{"./form-controls":21}],25:[function(require,module,exports){
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


},{"./form-controls":21}],24:[function(require,module,exports){
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


},{"./form-controls":21}],27:[function(require,module,exports){
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


},{"./form-controls":21,"../pages/SourceListPage":34,"../sourcecodes":35}],28:[function(require,module,exports){
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


},{"./form-controls":21,"../pages/ImagePage":11}],29:[function(require,module,exports){
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


},{"./form-controls":21,"../pages/ImagePage":11}],31:[function(require,module,exports){
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


},{}],33:[function(require,module,exports){
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


},{}],32:[function(require,module,exports){
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
},{"./EJSON":36}],34:[function(require,module,exports){
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


},{"../Page":33,"../LocationFinder":31,"./NewSourcePage":37,"../GeoJSON":4,"./SourcePage":38}],36:[function(require,module,exports){
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
},{}],37:[function(require,module,exports){
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


},{"../Page":33,"./SourcePage":38,"../forms":"EAVIrc"}],38:[function(require,module,exports){
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


},{"../LocationView":16,"./SourceMapPage":39,"./SourceEditPage":40,"../Page":33,"./NewTestPage":41,"./SourceNotePage":42,"./TestPage":43,"../forms":"EAVIrc"}],39:[function(require,module,exports){
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


},{"../Page":33,"./SourcePage":38,"../ItemTracker":14,"../LocationFinder":31,"../GeoJSON":4}],41:[function(require,module,exports){
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


},{"../Page":33,"./TestPage":43}],40:[function(require,module,exports){
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


},{"../Page":33,"../forms":"EAVIrc"}],42:[function(require,module,exports){
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


},{"../Page":33,"../forms":"EAVIrc"}],43:[function(require,module,exports){
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


},{"../Page":33,"../forms":"EAVIrc"}]},{},[20,3,5,9,12,13,17,15,18,1,8])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL3Rlc3QvUHJvYmxlbVJlcG9ydGVyVGVzdHMuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My90ZXN0L0dlb0pTT05UZXN0cy5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL3Rlc3QvSHlicmlkRGJUZXN0cy5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL3Rlc3QvSW1hZ2VRdWVzdGlvblRlc3RzLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvdGVzdC9JbWFnZXNRdWVzdGlvbnNUZXN0cy5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL3Rlc3QvSXRlbVRyYWNrZXJUZXN0cy5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL3Rlc3QvTG9jYXRpb25WaWV3VGVzdHMuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My90ZXN0L0xvY2FsRGJUZXN0cy5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL3Rlc3QvUmVtb3RlRGJUZXN0cy5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL3Rlc3QvRHJvcGRvd25RdWVzdGlvblRlc3RzLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvdGVzdC9kYl9xdWVyaWVzLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL2Zvcm1zL2luZGV4LmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL1Byb2JsZW1SZXBvcnRlci5qcyIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL0dlb0pTT04uY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My90ZXN0L2hlbHBlcnMvVUlEcml2ZXIuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvSXRlbVRyYWNrZXIuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvZGIvSHlicmlkRGIuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvZGIvUmVtb3RlRGIuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvTG9jYXRpb25WaWV3LmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL2RiL0xvY2FsRGIuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvcGFnZXMvSW1hZ2VQYWdlLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL2Zvcm1zL2Zvcm0tY29udHJvbHMuanMiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9mb3Jtcy9RdWVzdGlvbkdyb3VwLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL2Zvcm1zL1NhdmVDYW5jZWxGb3JtLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL2Zvcm1zL0luc3RydWN0aW9ucy5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9mb3Jtcy9EYXRlUXVlc3Rpb24uY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvZm9ybXMvRHJvcGRvd25RdWVzdGlvbi5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9mb3Jtcy9OdW1iZXJRdWVzdGlvbi5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9mb3Jtcy9Tb3VyY2VRdWVzdGlvbi5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9mb3Jtcy9JbWFnZVF1ZXN0aW9uLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL2Zvcm1zL0ltYWdlc1F1ZXN0aW9uLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL0xvY2F0aW9uRmluZGVyLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL1BhZ2UuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvc291cmNlY29kZXMuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvZGIvc2VsZWN0b3IuanMiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9wYWdlcy9Tb3VyY2VMaXN0UGFnZS5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9kYi9FSlNPTi5qcyIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL3BhZ2VzL05ld1NvdXJjZVBhZ2UuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvcGFnZXMvU291cmNlUGFnZS5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9wYWdlcy9Tb3VyY2VNYXBQYWdlLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL3BhZ2VzL05ld1Rlc3RQYWdlLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL3BhZ2VzL1NvdXJjZUVkaXRQYWdlLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL3BhZ2VzL1NvdXJjZU5vdGVQYWdlLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL3BhZ2VzL1Rlc3RQYWdlLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Q0FBQSxLQUFBLGlCQUFBOztDQUFBLENBQUEsQ0FBUyxDQUFJLEVBQWI7O0NBQUEsQ0FDQSxDQUFrQixJQUFBLFFBQWxCLFlBQWtCOztDQURsQixDQUdBLENBQTRCLEtBQTVCLENBQTRCLFFBQTVCO0NBQ0UsRUFBTyxDQUFQLEVBQUEsR0FBTztDQUNMLFFBQUEsQ0FBQTtDQUFBLEVBQVksR0FBWixHQUFBO0NBQ0UsS0FBQSxTQUFPO0NBRFQsTUFBWTtDQUFaLEVBRW1CLENBQWxCLENBRkQsQ0FFQSxDQUEwQixRQUExQjtDQUNDLENBQUQsQ0FBVSxDQUFULENBQVMsSUFBQSxJQUFWLEVBQVUsd0JBQUE7Q0FKWixJQUFPO0NBQVAsRUFLTSxDQUFOLENBQUEsSUFBTTtDQUNKLENBQUcsRUFBRixFQUFELENBQUE7Q0FDTyxDQUFxQixFQUFDLENBQTdCLENBQU0sQ0FBYyxNQUFwQixFQUFBO0NBRkYsSUFBTTtDQUlILENBQUgsQ0FBbUMsTUFBQSxFQUFuQyxtQkFBQTtDQUNFLEdBQUEsTUFBQTtDQUFBLENBQXFCLENBQWQsQ0FBUCxDQUFZLENBQVo7Q0FBQSxJQUNBLENBQUEsQ0FBTyxhQUFQO0NBREEsR0FHa0IsRUFBbEIsSUFBQTtDQUhBLENBSXNDLEVBQXJCLENBQWpCLENBQUEsQ0FBQTtDQUpBLENBS3FDLEVBQXBCLENBQWpCLENBQUE7Q0FFSyxHQUFELEdBQUosTUFBQTtDQVJGLElBQW1DO0NBVnJDLEVBQTRCO0NBSDVCOzs7OztBQ0FBO0NBQUEsS0FBQSxTQUFBOztDQUFBLENBQUEsQ0FBUyxDQUFJLEVBQWI7O0NBQUEsQ0FDQSxDQUFVLElBQVYsWUFBVTs7Q0FEVixDQUdBLENBQW9CLEtBQXBC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Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pWQTtDQUFBLENBQUEsQ0FBaUIsQ0FBYSxFQUF4QixDQUFOLENBQXlCO0NBQ3ZCLENBQVksQ0FBQSxDQUFaLEtBQVksQ0FBWjtDQUNFLEVBQVksQ0FBWCxFQUFELENBQW9CLENBQXBC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QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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Q0FBcUIsQ0FBdkIsQ0FBUSxDQUFULEdBQXdCLElBQXhCO0NBQTRCLElBQUEsQ0FBRCxTQUFBO0NBQTNCLE1BQXdCO0NBMUQxQixJQXVEVzs7Q0F2RFgsRUE0RFksTUFBQSxDQUFaO0NBQ0UsU0FBQSxFQUFBO0NBQUEsR0FBRyxFQUFILENBQUcsbUJBQUE7Q0FDQSxDQUFFLENBQUgsQ0FBQyxDQUFRLENBQVQsR0FBNEIsTUFBNUI7Q0FDRSxFQUFRLENBQVIsQ0FBQyxLQUFEO0NBQUEsSUFDQyxJQUFELENBQUE7Q0FDQyxDQUE0QixHQUE1QixJQUFELEtBQUEsR0FBQTtDQUhGLFFBQTRCO1FBRnBCO0NBNURaLElBNERZOztDQTVEWjs7Q0FEcUI7O0NBSHZCLENBdUVBLENBQWlCLEdBQVgsQ0FBTixDQXZFQTtDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiYXNzZXJ0ID0gY2hhaS5hc3NlcnRcblByb2JsZW1SZXBvcnRlciA9IHJlcXVpcmUgJy4uL2FwcC9qcy9Qcm9ibGVtUmVwb3J0ZXInXG5cbmRlc2NyaWJlIFwiUHJvYmxlbVJlcG9ydGVyXCIsIC0+XG4gIGJlZm9yZSAtPlxuICAgIGdldENsaWVudCA9IC0+XG4gICAgICByZXR1cm4gXCIxMjM0XCJcbiAgICBAb2xkQ29uc29sZUVycm9yID0gY29uc29sZS5lcnJvclxuICAgIEBwciA9IG5ldyBQcm9ibGVtUmVwb3J0ZXIoXCJodHRwOi8vbG9jYWxob3N0OjgwODAvcHJvYmxlbV9yZXBvcnRzXCIsIFwiMS4yXCIsIGdldENsaWVudClcbiAgYWZ0ZXIgLT5cbiAgICBAcHIucmVzdG9yZSgpXG4gICAgYXNzZXJ0LmVxdWFsIGNvbnNvbGUuZXJyb3IsIEBvbGRDb25zb2xlRXJyb3JcblxuICBpdCBcInBvc3RzIGVycm9yIG9uIGNvbnNvbGUuZXJyb3JcIiwgLT5cbiAgICBwb3N0ID0gc2lub24uc3R1YigkLCBcInBvc3RcIilcbiAgICBjb25zb2xlLmVycm9yIFwiU29tZSBlcnJvciBtZXNzYWdlXCJcblxuICAgIGFzc2VydC5pc1RydWUgcG9zdC5jYWxsZWRPbmNlXG4gICAgYXNzZXJ0LmVxdWFsIHBvc3QuYXJnc1swXVsxXS52ZXJzaW9uLCBcIjEuMlwiXG4gICAgYXNzZXJ0LmVxdWFsIHBvc3QuYXJnc1swXVsxXS5jbGllbnQsIFwiMTIzNFwiXG5cbiAgICBwb3N0LnJlc3RvcmUoKVxuIiwiYXNzZXJ0ID0gY2hhaS5hc3NlcnRcbkdlb0pTT04gPSByZXF1aXJlIFwiLi4vYXBwL2pzL0dlb0pTT05cIlxuXG5kZXNjcmliZSAnR2VvSlNPTicsIC0+XG4gIGl0ICdyZXR1cm5zIGEgcHJvcGVyIHBvbHlnb24nLCAtPlxuICAgIHNvdXRoV2VzdCA9IG5ldyBMLkxhdExuZygxMCwgMjApXG4gICAgbm9ydGhFYXN0ID0gbmV3IEwuTGF0TG5nKDEzLCAyMylcbiAgICBib3VuZHMgPSBuZXcgTC5MYXRMbmdCb3VuZHMoc291dGhXZXN0LCBub3J0aEVhc3QpXG5cbiAgICBqc29uID0gR2VvSlNPTi5sYXRMbmdCb3VuZHNUb0dlb0pTT04oYm91bmRzKVxuICAgIGFzc2VydCBfLmlzRXF1YWwganNvbiwge1xuICAgICAgdHlwZTogXCJQb2x5Z29uXCIsXG4gICAgICBjb29yZGluYXRlczogW1xuICAgICAgICBbWzIwLDEwXSxbMjAsMTNdLFsyMywxM10sWzIzLDEwXSxbMjAsMTBdXVxuICAgICAgXVxuICAgIH1cblxuICBpdCAnZ2V0cyByZWxhdGl2ZSBsb2NhdGlvbiBOJywgLT5cbiAgICBmcm9tID0geyB0eXBlOiBcIlBvaW50XCIsIGNvb3JkaW5hdGVzOiBbMTAsIDIwXX1cbiAgICB0byA9IHsgdHlwZTogXCJQb2ludFwiLCBjb29yZGluYXRlczogWzEwLCAyMV19XG4gICAgc3RyID0gR2VvSlNPTi5nZXRSZWxhdGl2ZUxvY2F0aW9uKGZyb20sIHRvKVxuICAgIGFzc2VydC5lcXVhbCBzdHIsICcxMTEuMmttIE4nXG5cbiAgaXQgJ2dldHMgcmVsYXRpdmUgbG9jYXRpb24gUycsIC0+XG4gICAgZnJvbSA9IHsgdHlwZTogXCJQb2ludFwiLCBjb29yZGluYXRlczogWzEwLCAyMF19XG4gICAgdG8gPSB7IHR5cGU6IFwiUG9pbnRcIiwgY29vcmRpbmF0ZXM6IFsxMCwgMTldfVxuICAgIHN0ciA9IEdlb0pTT04uZ2V0UmVsYXRpdmVMb2NhdGlvbihmcm9tLCB0bylcbiAgICBhc3NlcnQuZXF1YWwgc3RyLCAnMTExLjJrbSBTJ1xuIiwiYXNzZXJ0ID0gY2hhaS5hc3NlcnRcbkxvY2FsRGIgPSByZXF1aXJlIFwiLi4vYXBwL2pzL2RiL0xvY2FsRGJcIlxuSHlicmlkRGIgPSByZXF1aXJlIFwiLi4vYXBwL2pzL2RiL0h5YnJpZERiXCJcbmRiX3F1ZXJpZXMgPSByZXF1aXJlIFwiLi9kYl9xdWVyaWVzXCJcblxuIyBOb3RlOiBBc3N1bWVzIGxvY2FsIGRiIGlzIHN5bmNocm9ub3VzIVxuZmFpbCA9IC0+XG4gIHRocm93IG5ldyBFcnJvcihcImZhaWxlZFwiKVxuXG5kZXNjcmliZSAnSHlicmlkRGInLCAtPlxuICBiZWZvcmVFYWNoIC0+XG4gICAgQGxvY2FsID0gbmV3IExvY2FsRGIoKVxuICAgIEByZW1vdGUgPSBuZXcgTG9jYWxEYigpXG4gICAgQGh5YnJpZCA9IG5ldyBIeWJyaWREYihAbG9jYWwsIEByZW1vdGUpXG5cbiAgICBAbGMgPSBAbG9jYWwuYWRkQ29sbGVjdGlvbihcInNjcmF0Y2hcIilcbiAgICBAcmMgPSBAcmVtb3RlLmFkZENvbGxlY3Rpb24oXCJzY3JhdGNoXCIpXG4gICAgQGhjID0gQGh5YnJpZC5hZGRDb2xsZWN0aW9uKFwic2NyYXRjaFwiKVxuXG4gIGl0IFwiZ2l2ZXMgb25seSBvbmUgcmVzdWx0IGlmIGRhdGEgdW5jaGFuZ2VkXCIsIChkb25lKSAtPlxuICAgIEBsYy5zZWVkKF9pZDpcIjFcIiwgYToxKVxuICAgIEBsYy5zZWVkKF9pZDpcIjJcIiwgYToyKVxuXG4gICAgQHJjLnNlZWQoX2lkOlwiMVwiLCBhOjEpXG4gICAgQHJjLnNlZWQoX2lkOlwiMlwiLCBhOjIpXG5cbiAgICBAaGMuZmluZCh7fSkuZmV0Y2ggKGRhdGEpIC0+XG4gICAgICBhc3NlcnQuZXF1YWwgZGF0YS5sZW5ndGgsIDJcbiAgICAgIGRvbmUoKVxuICAgICwgZmFpbFxuXG4gIGl0IFwiZ2l2ZXMgcmVzdWx0cyB0d2ljZSBpZiByZW1vdGUgZ2l2ZXMgZGlmZmVyZW50IGFuc3dlclwiLCAoZG9uZSkgLT5cbiAgICBAbGMuc2VlZChfaWQ6XCIxXCIsIGE6MSlcbiAgICBAbGMuc2VlZChfaWQ6XCIyXCIsIGE6MilcblxuICAgIEByYy5zZWVkKF9pZDpcIjFcIiwgYTozKVxuICAgIEByYy5zZWVkKF9pZDpcIjJcIiwgYTo0KVxuXG4gICAgY2FsbHMgPSAwXG4gICAgQGhjLmZpbmQoe30pLmZldGNoIChkYXRhKSAtPlxuICAgICAgYXNzZXJ0LmVxdWFsIGRhdGEubGVuZ3RoLCAyXG4gICAgICBjYWxscyA9IGNhbGxzICsgMVxuICAgICAgaWYgY2FsbHMgPj0yXG4gICAgICAgIGRvbmUoKVxuICAgICwgZmFpbFxuXG4gIGl0IFwiY2FjaGVzIHJlbW90ZSBkYXRhXCJcbiAgaXQgXCJmaW5kIG9ubHkgY2FsbHMgbG9jYWwgaW4gbG9jYWwgbW9kZVwiXG4gIGl0IFwiZmluZE9uZSBvbmx5IGNhbGxzIGxvY2FsIGluIGxvY2FsIG1vZGVcIlxuICBpdCBcImZpbmQgb25seSBjYWxscyByZW1vdGUgaW4gcmVtb3RlIG1vZGVcIlxuICBpdCBcImZpbmRPbmUgb25seSBjYWxscyByZW1vdGUgaW4gcmVtb3RlIG1vZGVcIlxuICBpdCBcImZpbmQgZmFsbHMgYmFjayB0byBsb2NhbCBpZiByZW1vdGUgZmFpbHMgaW4gcmVtb3RlIG1vZGVcIlxuICBpdCBcImZpbmRPbmUgZmFsbHMgYmFjayB0byBsb2NhbCBpZiByZW1vdGUgZmFpbHMgaW4gcmVtb3RlIG1vZGVcIlxuXG4gIGl0IFwic3luYyBhcHBsaWVzIHBlbmRpbmcgdXBzZXJ0cyBhbmQgZGVsZXRlc1wiXG4gIGl0IFwia2VlcHMgdXBzZXJ0cyBhbmQgZGVsZXRlcyBpZiBmYWlsZWQgdG8gYXBwbHlcIlxuXG4iLCJhc3NlcnQgPSBjaGFpLmFzc2VydFxuZm9ybXMgPSByZXF1aXJlKCdmb3JtcycpXG5VSURyaXZlciA9IHJlcXVpcmUgJy4vaGVscGVycy9VSURyaXZlcidcbkltYWdlUGFnZSA9IHJlcXVpcmUgJy4uL2FwcC9qcy9wYWdlcy9JbWFnZVBhZ2UnXG5cbmNsYXNzIE1vY2tJbWFnZU1hbmFnZXIgXG4gIGdldEltYWdlVGh1bWJuYWlsVXJsOiAoaW1hZ2VVaWQsIHN1Y2Nlc3MsIGVycm9yKSAtPlxuICAgIHN1Y2Nlc3MgXCJpbWFnZXMvXCIgKyBpbWFnZVVpZCArIFwiLmpwZ1wiXG5cbiAgZ2V0SW1hZ2VVcmw6IChpbWFnZVVpZCwgc3VjY2VzcywgZXJyb3IpIC0+XG4gICAgc3VjY2VzcyBcImltYWdlcy9cIiArIGltYWdlVWlkICsgXCIuanBnXCJcblxuY2xhc3MgTW9ja0NhbWVyYVxuICB0YWtlUGljdHVyZTogKHN1Y2Nlc3MsIGVycm9yKSAtPlxuICAgIHN1Y2Nlc3MoXCJodHRwOi8vMTIzNC5qcGdcIilcblxuZGVzY3JpYmUgJ0ltYWdlUXVlc3Rpb24nLCAtPlxuICBiZWZvcmVFYWNoIC0+XG4gICAgIyBDcmVhdGUgbW9kZWxcbiAgICBAbW9kZWwgPSBuZXcgQmFja2JvbmUuTW9kZWwgXG5cbiAgY29udGV4dCAnV2l0aCBhIG5vIGNhbWVyYScsIC0+XG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgIyBDcmVhdGUgY29udGV4dFxuICAgICAgQGN0eCA9IHtcbiAgICAgICAgaW1hZ2VNYW5hZ2VyOiBuZXcgTW9ja0ltYWdlTWFuYWdlcigpXG4gICAgICB9XG5cbiAgICAgIEBxdWVzdGlvbiA9IG5ldyBmb3Jtcy5JbWFnZVF1ZXN0aW9uXG4gICAgICAgIG1vZGVsOiBAbW9kZWxcbiAgICAgICAgaWQ6IFwicTFcIlxuICAgICAgICBjdHg6IEBjdHhcblxuICAgIGl0ICdkaXNwbGF5cyBubyBpbWFnZScsIC0+XG4gICAgICBhc3NlcnQuaXNUcnVlIHRydWVcblxuICAgIGl0ICdkaXNwbGF5cyBvbmUgaW1hZ2UnLCAtPlxuICAgICAgQG1vZGVsLnNldChxMToge2lkOiBcIjEyMzRcIn0pXG4gICAgICBhc3NlcnQuZXF1YWwgQHF1ZXN0aW9uLiQoXCJpbWcudGh1bWJuYWlsLWltZ1wiKS5hdHRyKFwic3JjXCIpLCBcImltYWdlcy8xMjM0LmpwZ1wiXG5cbiAgICBpdCAnb3BlbnMgcGFnZScsIC0+XG4gICAgICBAbW9kZWwuc2V0KHExOiB7aWQ6IFwiMTIzNFwifSlcbiAgICAgIHNweSA9IHNpbm9uLnNweSgpXG4gICAgICBAY3R4LnBhZ2VyID0geyBvcGVuUGFnZTogc3B5IH1cbiAgICAgIEBxdWVzdGlvbi4kKFwiaW1nLnRodW1ibmFpbC1pbWdcIikuY2xpY2soKVxuXG4gICAgICBhc3NlcnQuaXNUcnVlIHNweS5jYWxsZWRPbmNlXG4gICAgICBhc3NlcnQuZXF1YWwgc3B5LmFyZ3NbMF1bMV0uaWQsIFwiMTIzNFwiXG5cbiAgICBpdCAnYWxsb3dzIHJlbW92aW5nIGltYWdlJywgLT5cbiAgICAgIEBtb2RlbC5zZXQocTE6IHtpZDogXCIxMjM0XCJ9KVxuICAgICAgQGN0eC5wYWdlciA9IHsgXG4gICAgICAgIG9wZW5QYWdlOiAocGFnZSwgb3B0aW9ucykgPT5cbiAgICAgICAgICBvcHRpb25zLm9uUmVtb3ZlKClcbiAgICAgIH1cbiAgICAgIEBxdWVzdGlvbi4kKFwiaW1nLnRodW1ibmFpbC1pbWdcIikuY2xpY2soKVxuICAgICAgYXNzZXJ0LmVxdWFsIEBtb2RlbC5nZXQoXCJxMVwiKSwgbnVsbFxuXG4gICAgaXQgJ2Rpc3BsYXlzIG5vIGFkZCcsIC0+XG4gICAgICBhc3NlcnQuZXF1YWwgQHF1ZXN0aW9uLiQoXCJpbWcjYWRkXCIpLmxlbmd0aCwgMFxuXG4gIGNvbnRleHQgJ1dpdGggYSBjYW1lcmEnLCAtPlxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICMgQ3JlYXRlIGNvbnRleHRcbiAgICAgIEBjdHggPSB7XG4gICAgICAgIGltYWdlTWFuYWdlcjogbmV3IE1vY2tJbWFnZU1hbmFnZXIoKVxuICAgICAgICBjYW1lcmE6IG5ldyBNb2NrQ2FtZXJhKClcbiAgICAgIH1cblxuICAgICAgQHF1ZXN0aW9uID0gbmV3IGZvcm1zLkltYWdlUXVlc3Rpb25cbiAgICAgICAgbW9kZWw6IEBtb2RlbFxuICAgICAgICBpZDogXCJxMVwiXG4gICAgICAgIGN0eDogQGN0eFxuXG4gICAgaXQgJ2Rpc3BsYXlzIG5vIGFkZCBpZiBpbWFnZSBtYW5hZ2VyIGhhcyBubyBhZGRJbWFnZScsIC0+XG4gICAgICBhc3NlcnQuZXF1YWwgQHF1ZXN0aW9uLiQoXCJpbWcjYWRkXCIpLmxlbmd0aCwgMFxuXG4gIGNvbnRleHQgJ1dpdGggYSBjYW1lcmEgYW5kIGltYWdlTWFuYWdlciB3aXRoIGFkZEltYWdlJywgLT5cbiAgICBiZWZvcmVFYWNoIC0+XG4gICAgICBpbWFnZU1hbmFnZXIgPSBuZXcgTW9ja0ltYWdlTWFuYWdlcigpXG4gICAgICBpbWFnZU1hbmFnZXIuYWRkSW1hZ2UgPSAodXJsLCBzdWNjZXNzLCBlcnJvcikgLT5cbiAgICAgICAgYXNzZXJ0LmVxdWFsIHVybCwgXCJodHRwOi8vMTIzNC5qcGdcIlxuICAgICAgICBzdWNjZXNzIFwiMTIzNFwiXG5cbiAgICAgICMgQ3JlYXRlIGNvbnRleHRcbiAgICAgIEBjdHggPSB7XG4gICAgICAgIGltYWdlTWFuYWdlcjogaW1hZ2VNYW5hZ2VyXG4gICAgICAgIGNhbWVyYTogbmV3IE1vY2tDYW1lcmEoKVxuICAgICAgfVxuXG4gICAgICBAcXVlc3Rpb24gPSBuZXcgZm9ybXMuSW1hZ2VRdWVzdGlvblxuICAgICAgICBtb2RlbDogQG1vZGVsXG4gICAgICAgIGlkOiBcInExXCJcbiAgICAgICAgY3R4OiBAY3R4XG5cbiAgICBpdCAndGFrZXMgYSBwaG90bycsIC0+XG4gICAgICBAY3R4LmNhbWVyYSA9IG5ldyBNb2NrQ2FtZXJhKClcbiAgICAgIEBxdWVzdGlvbi4kKFwiaW1nI2FkZFwiKS5jbGljaygpXG4gICAgICBhc3NlcnQuaXNUcnVlIF8uaXNFcXVhbChAbW9kZWwuZ2V0KFwicTFcIiksIHtpZDpcIjEyMzRcIn0pLCBAbW9kZWwuZ2V0KFwicTFcIilcblxuICAgIGl0ICdubyBsb25nZXIgaGFzIGFkZCBhZnRlciB0YWtpbmcgcGhvdG8nLCAtPlxuICAgICAgQGN0eC5jYW1lcmEgPSBuZXcgTW9ja0NhbWVyYSgpXG4gICAgICBAcXVlc3Rpb24uJChcImltZyNhZGRcIikuY2xpY2soKVxuICAgICAgYXNzZXJ0LmVxdWFsIEBxdWVzdGlvbi4kKFwiaW1nI2FkZFwiKS5sZW5ndGgsIDBcblxuICAgICIsImFzc2VydCA9IGNoYWkuYXNzZXJ0XG5mb3JtcyA9IHJlcXVpcmUoJ2Zvcm1zJylcblVJRHJpdmVyID0gcmVxdWlyZSAnLi9oZWxwZXJzL1VJRHJpdmVyJ1xuSW1hZ2VQYWdlID0gcmVxdWlyZSAnLi4vYXBwL2pzL3BhZ2VzL0ltYWdlUGFnZSdcblxuY2xhc3MgTW9ja0ltYWdlTWFuYWdlciBcbiAgZ2V0SW1hZ2VUaHVtYm5haWxVcmw6IChpbWFnZVVpZCwgc3VjY2VzcywgZXJyb3IpIC0+XG4gICAgc3VjY2VzcyBcImltYWdlcy9cIiArIGltYWdlVWlkICsgXCIuanBnXCJcblxuICBnZXRJbWFnZVVybDogKGltYWdlVWlkLCBzdWNjZXNzLCBlcnJvcikgLT5cbiAgICBzdWNjZXNzIFwiaW1hZ2VzL1wiICsgaW1hZ2VVaWQgKyBcIi5qcGdcIlxuXG5jbGFzcyBNb2NrQ2FtZXJhXG4gIHRha2VQaWN0dXJlOiAoc3VjY2VzcywgZXJyb3IpIC0+XG4gICAgc3VjY2VzcyhcImh0dHA6Ly8xMjM0LmpwZ1wiKVxuXG5kZXNjcmliZSAnSW1hZ2VzUXVlc3Rpb24nLCAtPlxuICBiZWZvcmVFYWNoIC0+XG4gICAgIyBDcmVhdGUgbW9kZWxcbiAgICBAbW9kZWwgPSBuZXcgQmFja2JvbmUuTW9kZWwgXG5cbiAgY29udGV4dCAnV2l0aCBhIG5vIGNhbWVyYScsIC0+XG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgIyBDcmVhdGUgY29udGV4dFxuICAgICAgQGN0eCA9IHtcbiAgICAgICAgaW1hZ2VNYW5hZ2VyOiBuZXcgTW9ja0ltYWdlTWFuYWdlcigpXG4gICAgICB9XG5cbiAgICAgIEBxdWVzdGlvbiA9IG5ldyBmb3Jtcy5JbWFnZXNRdWVzdGlvblxuICAgICAgICBtb2RlbDogQG1vZGVsXG4gICAgICAgIGlkOiBcInExXCJcbiAgICAgICAgY3R4OiBAY3R4XG5cbiAgICBpdCAnZGlzcGxheXMgbm8gaW1hZ2UnLCAtPlxuICAgICAgQG1vZGVsLnNldChxMTogW10pXG4gICAgICBhc3NlcnQuaXNUcnVlIHRydWVcblxuICAgIGl0ICdkaXNwbGF5cyBvbmUgaW1hZ2UnLCAtPlxuICAgICAgQG1vZGVsLnNldChxMTogW3tpZDogXCIxMjM0XCJ9XSlcbiAgICAgIGFzc2VydC5lcXVhbCBAcXVlc3Rpb24uJChcImltZy50aHVtYm5haWwtaW1nXCIpLmF0dHIoXCJzcmNcIiksIFwiaW1hZ2VzLzEyMzQuanBnXCJcblxuICAgIGl0ICdvcGVucyBwYWdlJywgLT5cbiAgICAgIEBtb2RlbC5zZXQocTE6IFt7aWQ6IFwiMTIzNFwifV0pXG4gICAgICBzcHkgPSBzaW5vbi5zcHkoKVxuICAgICAgQGN0eC5wYWdlciA9IHsgb3BlblBhZ2U6IHNweSB9XG4gICAgICBAcXVlc3Rpb24uJChcImltZy50aHVtYm5haWwtaW1nXCIpLmNsaWNrKClcblxuICAgICAgYXNzZXJ0LmlzVHJ1ZSBzcHkuY2FsbGVkT25jZVxuICAgICAgYXNzZXJ0LmVxdWFsIHNweS5hcmdzWzBdWzFdLmlkLCBcIjEyMzRcIlxuXG4gICAgaXQgJ2FsbG93cyByZW1vdmluZyBpbWFnZScsIC0+XG4gICAgICBAbW9kZWwuc2V0KHExOiBbe2lkOiBcIjEyMzRcIn1dKVxuICAgICAgQGN0eC5wYWdlciA9IHsgXG4gICAgICAgIG9wZW5QYWdlOiAocGFnZSwgb3B0aW9ucykgPT5cbiAgICAgICAgICBvcHRpb25zLm9uUmVtb3ZlKClcbiAgICAgIH1cbiAgICAgIEBxdWVzdGlvbi4kKFwiaW1nLnRodW1ibmFpbC1pbWdcIikuY2xpY2soKVxuICAgICAgYXNzZXJ0LmVxdWFsIEBxdWVzdGlvbi4kKFwiaW1nI2FkZFwiKS5sZW5ndGgsIDBcblxuICAgIGl0ICdkaXNwbGF5cyBubyBhZGQnLCAtPlxuICAgICAgYXNzZXJ0LmVxdWFsIEBxdWVzdGlvbi4kKFwiaW1nI2FkZFwiKS5sZW5ndGgsIDBcblxuICBjb250ZXh0ICdXaXRoIGEgY2FtZXJhJywgLT5cbiAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAjIENyZWF0ZSBjb250ZXh0XG4gICAgICBAY3R4ID0ge1xuICAgICAgICBpbWFnZU1hbmFnZXI6IG5ldyBNb2NrSW1hZ2VNYW5hZ2VyKClcbiAgICAgICAgY2FtZXJhOiBuZXcgTW9ja0NhbWVyYSgpXG4gICAgICB9XG5cbiAgICAgIEBxdWVzdGlvbiA9IG5ldyBmb3Jtcy5JbWFnZXNRdWVzdGlvblxuICAgICAgICBtb2RlbDogQG1vZGVsXG4gICAgICAgIGlkOiBcInExXCJcbiAgICAgICAgY3R4OiBAY3R4XG5cbiAgICBpdCAnZGlzcGxheXMgbm8gYWRkIGlmIGltYWdlIG1hbmFnZXIgaGFzIG5vIGFkZEltYWdlJywgLT5cbiAgICAgIGFzc2VydC5lcXVhbCBAcXVlc3Rpb24uJChcImltZyNhZGRcIikubGVuZ3RoLCAwXG5cbiAgY29udGV4dCAnV2l0aCBhIGNhbWVyYSBhbmQgaW1hZ2VNYW5hZ2VyIHdpdGggYWRkSW1hZ2UnLCAtPlxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgIGltYWdlTWFuYWdlciA9IG5ldyBNb2NrSW1hZ2VNYW5hZ2VyKClcbiAgICAgIGltYWdlTWFuYWdlci5hZGRJbWFnZSA9ICh1cmwsIHN1Y2Nlc3MsIGVycm9yKSAtPlxuICAgICAgICBhc3NlcnQuZXF1YWwgdXJsLCBcImh0dHA6Ly8xMjM0LmpwZ1wiXG4gICAgICAgIHN1Y2Nlc3MgXCIxMjM0XCJcblxuICAgICAgIyBDcmVhdGUgY29udGV4dFxuICAgICAgQGN0eCA9IHtcbiAgICAgICAgaW1hZ2VNYW5hZ2VyOiBpbWFnZU1hbmFnZXJcbiAgICAgICAgY2FtZXJhOiBuZXcgTW9ja0NhbWVyYSgpXG4gICAgICB9XG5cbiAgICAgIEBxdWVzdGlvbiA9IG5ldyBmb3Jtcy5JbWFnZXNRdWVzdGlvblxuICAgICAgICBtb2RlbDogQG1vZGVsXG4gICAgICAgIGlkOiBcInExXCJcbiAgICAgICAgY3R4OiBAY3R4XG5cbiAgICBpdCAndGFrZXMgYSBwaG90bycsIC0+XG4gICAgICBAY3R4LmNhbWVyYSA9IG5ldyBNb2NrQ2FtZXJhKClcbiAgICAgIEBxdWVzdGlvbi4kKFwiaW1nI2FkZFwiKS5jbGljaygpXG4gICAgICBhc3NlcnQuaXNUcnVlIF8uaXNFcXVhbChAbW9kZWwuZ2V0KFwicTFcIiksIFt7aWQ6XCIxMjM0XCJ9XSksIEBtb2RlbC5nZXQoXCJxMVwiKVxuXG4gICAgIiwiYXNzZXJ0ID0gY2hhaS5hc3NlcnRcbkl0ZW1UcmFja2VyID0gcmVxdWlyZSBcIi4uL2FwcC9qcy9JdGVtVHJhY2tlclwiXG5cbmRlc2NyaWJlICdJdGVtVHJhY2tlcicsIC0+XG4gIGJlZm9yZUVhY2ggLT5cbiAgICBAdHJhY2tlciA9IG5ldyBJdGVtVHJhY2tlcigpXG5cbiAgaXQgXCJyZWNvcmRzIGFkZHNcIiwgLT5cbiAgICBpdGVtcyA9ICBbXG4gICAgICBfaWQ6IDEsIHg6MVxuICAgICAgX2lkOiAyLCB4OjJcbiAgICBdXG4gICAgW2FkZHMsIHJlbW92ZXNdID0gQHRyYWNrZXIudXBkYXRlKGl0ZW1zKVxuICAgIGFzc2VydC5kZWVwRXF1YWwgYWRkcywgaXRlbXNcbiAgICBhc3NlcnQuZGVlcEVxdWFsIHJlbW92ZXMsIFtdXG5cbiAgaXQgXCJyZW1lbWJlcnMgaXRlbXNcIiwgLT5cbiAgICBpdGVtcyA9ICBbXG4gICAgICB7X2lkOiAxLCB4OjF9XG4gICAgICB7X2lkOiAyLCB4OjJ9XG4gICAgXVxuICAgIFthZGRzLCByZW1vdmVzXSA9IEB0cmFja2VyLnVwZGF0ZShpdGVtcylcbiAgICBbYWRkcywgcmVtb3Zlc10gPSBAdHJhY2tlci51cGRhdGUoaXRlbXMpXG4gICAgYXNzZXJ0LmRlZXBFcXVhbCBhZGRzLCBbXVxuICAgIGFzc2VydC5kZWVwRXF1YWwgcmVtb3ZlcywgW11cblxuICBpdCBcInNlZXMgcmVtb3ZlZCBpdGVtc1wiLCAtPlxuICAgIGl0ZW1zMSA9ICBbXG4gICAgICB7X2lkOiAxLCB4OjF9XG4gICAgICB7X2lkOiAyLCB4OjJ9XG4gICAgXVxuICAgIGl0ZW1zMiA9ICBbXG4gICAgICB7X2lkOiAxLCB4OjF9XG4gICAgXVxuICAgIEB0cmFja2VyLnVwZGF0ZShpdGVtczEpXG4gICAgW2FkZHMsIHJlbW92ZXNdID0gQHRyYWNrZXIudXBkYXRlKGl0ZW1zMilcbiAgICBhc3NlcnQuZGVlcEVxdWFsIGFkZHMsIFtdXG4gICAgYXNzZXJ0LmRlZXBFcXVhbCByZW1vdmVzLCBbe19pZDogMiwgeDoyfV1cblxuICBpdCBcInNlZXMgcmVtb3ZlZCBjaGFuZ2VzXCIsIC0+XG4gICAgaXRlbXMxID0gIFtcbiAgICAgIHtfaWQ6IDEsIHg6MX1cbiAgICAgIHtfaWQ6IDIsIHg6Mn1cbiAgICBdXG4gICAgaXRlbXMyID0gIFtcbiAgICAgIHtfaWQ6IDEsIHg6MX1cbiAgICAgIHtfaWQ6IDIsIHg6NH1cbiAgICBdXG4gICAgQHRyYWNrZXIudXBkYXRlKGl0ZW1zMSlcbiAgICBbYWRkcywgcmVtb3Zlc10gPSBAdHJhY2tlci51cGRhdGUoaXRlbXMyKVxuICAgIGFzc2VydC5kZWVwRXF1YWwgYWRkcywgW3tfaWQ6IDIsIHg6NH1dXG4gICAgYXNzZXJ0LmRlZXBFcXVhbCByZW1vdmVzLCBbe19pZDogMiwgeDoyfV1cbiIsImFzc2VydCA9IGNoYWkuYXNzZXJ0XG5Mb2NhdGlvblZpZXcgPSByZXF1aXJlICcuLi9hcHAvanMvTG9jYXRpb25WaWV3J1xuVUlEcml2ZXIgPSByZXF1aXJlICcuL2hlbHBlcnMvVUlEcml2ZXInXG5cbmNsYXNzIE1vY2tMb2NhdGlvbkZpbmRlclxuICBjb25zdHJ1Y3RvcjogIC0+XG4gICAgXy5leHRlbmQgQCwgQmFja2JvbmUuRXZlbnRzXG5cbiAgZ2V0TG9jYXRpb246IC0+XG4gIHN0YXJ0V2F0Y2g6IC0+XG4gIHN0b3BXYXRjaDogLT5cblxuZGVzY3JpYmUgJ0xvY2F0aW9uVmlldycsIC0+XG4gIGNvbnRleHQgJ1dpdGggbm8gc2V0IGxvY2F0aW9uJywgLT5cbiAgICBiZWZvcmVFYWNoIC0+XG4gICAgICBAbG9jYXRpb25GaW5kZXIgPSBuZXcgTW9ja0xvY2F0aW9uRmluZGVyKClcbiAgICAgIEBsb2NhdGlvblZpZXcgPSBuZXcgTG9jYXRpb25WaWV3KGxvYzpudWxsLCBsb2NhdGlvbkZpbmRlcjogQGxvY2F0aW9uRmluZGVyKVxuICAgICAgQHVpID0gbmV3IFVJRHJpdmVyKEBsb2NhdGlvblZpZXcuZWwpXG5cbiAgICBpdCAnZGlzcGxheXMgVW5zcGVjaWZpZWQnLCAtPlxuICAgICAgYXNzZXJ0LmluY2x1ZGUoQHVpLnRleHQoKSwgJ1Vuc3BlY2lmaWVkJylcblxuICAgIGl0ICdkaXNhYmxlcyBtYXAnLCAtPlxuICAgICAgYXNzZXJ0LmlzVHJ1ZSBAdWkuZ2V0RGlzYWJsZWQoXCJNYXBcIikgXG5cbiAgICBpdCAnYWxsb3dzIHNldHRpbmcgbG9jYXRpb24nLCAtPlxuICAgICAgQHVpLmNsaWNrKCdTZXQnKVxuICAgICAgc2V0UG9zID0gbnVsbFxuICAgICAgQGxvY2F0aW9uVmlldy5vbiAnbG9jYXRpb25zZXQnLCAocG9zKSAtPlxuICAgICAgICBzZXRQb3MgPSBwb3NcblxuICAgICAgQGxvY2F0aW9uRmluZGVyLnRyaWdnZXIgJ2ZvdW5kJywgeyBjb29yZHM6IHsgbGF0aXR1ZGU6IDIsIGxvbmdpdHVkZTogMywgYWNjdXJhY3k6IDEwfX1cbiAgICAgIGFzc2VydC5lcXVhbCBzZXRQb3MuY29vcmRpbmF0ZXNbMV0sIDJcblxuICAgIGl0ICdEaXNwbGF5cyBlcnJvcicsIC0+XG4gICAgICBAdWkuY2xpY2soJ1NldCcpXG4gICAgICBzZXRQb3MgPSBudWxsXG4gICAgICBAbG9jYXRpb25WaWV3Lm9uICdsb2NhdGlvbnNldCcsIChwb3MpIC0+XG4gICAgICAgIHNldFBvcyA9IHBvc1xuXG4gICAgICBAbG9jYXRpb25GaW5kZXIudHJpZ2dlciAnZXJyb3InXG4gICAgICBhc3NlcnQuZXF1YWwgc2V0UG9zLCBudWxsXG4gICAgICBhc3NlcnQuaW5jbHVkZShAdWkudGV4dCgpLCAnQ2Fubm90JylcblxuICBjb250ZXh0ICdXaXRoIHNldCBsb2NhdGlvbicsIC0+XG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgQGxvY2F0aW9uRmluZGVyID0gbmV3IE1vY2tMb2NhdGlvbkZpbmRlcigpXG4gICAgICBAbG9jYXRpb25WaWV3ID0gbmV3IExvY2F0aW9uVmlldyhsb2M6IHsgdHlwZTogXCJQb2ludFwiLCBjb29yZGluYXRlczogWzEwLCAyMF19LCBsb2NhdGlvbkZpbmRlcjogQGxvY2F0aW9uRmluZGVyKVxuICAgICAgQHVpID0gbmV3IFVJRHJpdmVyKEBsb2NhdGlvblZpZXcuZWwpXG5cbiAgICBpdCAnZGlzcGxheXMgV2FpdGluZycsIC0+XG4gICAgICBhc3NlcnQuaW5jbHVkZShAdWkudGV4dCgpLCAnV2FpdGluZycpXG5cbiAgICBpdCAnZGlzcGxheXMgcmVsYXRpdmUnLCAtPlxuICAgICAgQGxvY2F0aW9uRmluZGVyLnRyaWdnZXIgJ2ZvdW5kJywgeyBjb29yZHM6IHsgbGF0aXR1ZGU6IDIxLCBsb25naXR1ZGU6IDEwLCBhY2N1cmFjeTogMTB9fVxuICAgICAgYXNzZXJ0LmluY2x1ZGUoQHVpLnRleHQoKSwgJzExMS4ya20gUycpXG5cbiIsImFzc2VydCA9IGNoYWkuYXNzZXJ0XG5Mb2NhbERiID0gcmVxdWlyZSBcIi4uL2FwcC9qcy9kYi9Mb2NhbERiXCJcbmRiX3F1ZXJpZXMgPSByZXF1aXJlIFwiLi9kYl9xdWVyaWVzXCJcblxuZGVzY3JpYmUgJ0xvY2FsRGInLCAtPlxuICBiZWZvcmUgLT5cbiAgICBAZGIgPSBuZXcgTG9jYWxEYignc2NyYXRjaCcpXG5cbiAgYmVmb3JlRWFjaCAoZG9uZSkgLT5cbiAgICBAZGIucmVtb3ZlQ29sbGVjdGlvbignc2NyYXRjaCcpXG4gICAgQGRiLmFkZENvbGxlY3Rpb24oJ3NjcmF0Y2gnKVxuICAgIGRvbmUoKVxuXG4gIGRlc2NyaWJlIFwicGFzc2VzIHF1ZXJpZXNcIiwgLT5cbiAgICBkYl9xdWVyaWVzLmNhbGwodGhpcylcblxuICBpdCAnY2FjaGVzIHJvd3MnLCAoZG9uZSkgLT5cbiAgICBAZGIuc2NyYXRjaC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdhcHBsZScgfV0sIHt9LCB7fSwgPT5cbiAgICAgIEBkYi5zY3JhdGNoLmZpbmQoe30pLmZldGNoIChyZXN1bHRzKSAtPlxuICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0c1swXS5hLCAnYXBwbGUnXG4gICAgICAgIGRvbmUoKVxuXG4gIGl0ICdjYWNoZSBvdmVyd3JpdGUgZXhpc3RpbmcnLCAoZG9uZSkgLT5cbiAgICBAZGIuc2NyYXRjaC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdhcHBsZScgfV0sIHt9LCB7fSwgPT5cbiAgICAgIEBkYi5zY3JhdGNoLmNhY2hlIFt7IF9pZDogMSwgYTogJ2JhbmFuYScgfV0sIHt9LCB7fSwgPT5cbiAgICAgICAgQGRiLnNjcmF0Y2guZmluZCh7fSkuZmV0Y2ggKHJlc3VsdHMpIC0+XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHNbMF0uYSwgJ2JhbmFuYSdcbiAgICAgICAgICBkb25lKClcblxuICBpdCBcImNhY2hlIGRvZXNuJ3Qgb3ZlcndyaXRlIHVwc2VydFwiLCAoZG9uZSkgLT5cbiAgICBAZGIuc2NyYXRjaC51cHNlcnQgeyBfaWQ6IDEsIGE6ICdhcHBsZScgfSwgPT5cbiAgICAgIEBkYi5zY3JhdGNoLmNhY2hlIFt7IF9pZDogMSwgYTogJ2JhbmFuYScgfV0sIHt9LCB7fSwgPT5cbiAgICAgICAgQGRiLnNjcmF0Y2guZmluZCh7fSkuZmV0Y2ggKHJlc3VsdHMpIC0+XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHNbMF0uYSwgJ2FwcGxlJ1xuICAgICAgICAgIGRvbmUoKVxuXG4gIGl0IFwiY2FjaGUgZG9lc24ndCBvdmVyd3JpdGUgcmVtb3ZlXCIsIChkb25lKSAtPlxuICAgIEBkYi5zY3JhdGNoLmNhY2hlIFt7IF9pZDogMSwgYTogJ2RlbGV0ZScgfV0sIHt9LCB7fSwgPT5cbiAgICAgIEBkYi5zY3JhdGNoLnJlbW92ZSAxLCA9PlxuICAgICAgQGRiLnNjcmF0Y2guY2FjaGUgW3sgX2lkOiAxLCBhOiAnYmFuYW5hJyB9XSwge30sIHt9LCA9PlxuICAgICAgICBAZGIuc2NyYXRjaC5maW5kKHt9KS5mZXRjaCAocmVzdWx0cykgLT5cbiAgICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0cy5sZW5ndGgsIDBcbiAgICAgICAgICBkb25lKClcblxuICBpdCBcImNhY2hlIHJlbW92ZXMgbWlzc2luZyB1bnNvcnRlZFwiLCAoZG9uZSkgLT5cbiAgICBAZGIuc2NyYXRjaC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdhJyB9LCB7IF9pZDogMiwgYTogJ2InIH0sIHsgX2lkOiAzLCBhOiAnYycgfV0sIHt9LCB7fSwgPT5cbiAgICAgIEBkYi5zY3JhdGNoLmNhY2hlIFt7IF9pZDogMSwgYTogJ2EnIH0sIHsgX2lkOiAzLCBhOiAnYycgfV0sIHt9LCB7fSwgPT5cbiAgICAgICAgQGRiLnNjcmF0Y2guZmluZCh7fSkuZmV0Y2ggKHJlc3VsdHMpIC0+XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHMubGVuZ3RoLCAyXG4gICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJjYWNoZSByZW1vdmVzIG1pc3NpbmcgZmlsdGVyZWRcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnNjcmF0Y2guY2FjaGUgW3sgX2lkOiAxLCBhOiAnYScgfSwgeyBfaWQ6IDIsIGE6ICdiJyB9LCB7IF9pZDogMywgYTogJ2MnIH1dLCB7fSwge30sID0+XG4gICAgICBAZGIuc2NyYXRjaC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdhJyB9XSwge19pZDogeyRsdDozfX0sIHt9LCA9PlxuICAgICAgICBAZGIuc2NyYXRjaC5maW5kKHt9LCB7c29ydDpbJ19pZCddfSkuZmV0Y2ggKHJlc3VsdHMpIC0+XG4gICAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCBfLnBsdWNrKHJlc3VsdHMsICdfaWQnKSwgWzEsM11cbiAgICAgICAgICBkb25lKClcblxuICBpdCBcImNhY2hlIHJlbW92ZXMgbWlzc2luZyBzb3J0ZWQgbGltaXRlZFwiLCAoZG9uZSkgLT5cbiAgICBAZGIuc2NyYXRjaC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdhJyB9LCB7IF9pZDogMiwgYTogJ2InIH0sIHsgX2lkOiAzLCBhOiAnYycgfV0sIHt9LCB7fSwgPT5cbiAgICAgIEBkYi5zY3JhdGNoLmNhY2hlIFt7IF9pZDogMSwgYTogJ2EnIH1dLCB7fSwge3NvcnQ6WydfaWQnXSwgbGltaXQ6Mn0sID0+XG4gICAgICAgIEBkYi5zY3JhdGNoLmZpbmQoe30sIHtzb3J0OlsnX2lkJ119KS5mZXRjaCAocmVzdWx0cykgLT5cbiAgICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIF8ucGx1Y2socmVzdWx0cywgJ19pZCcpLCBbMSwzXVxuICAgICAgICAgIGRvbmUoKVxuXG4gIGl0IFwiY2FjaGUgZG9lcyBub3QgcmVtb3ZlIG1pc3Npbmcgc29ydGVkIGxpbWl0ZWQgcGFzdCBlbmRcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnNjcmF0Y2guY2FjaGUgW3sgX2lkOiAxLCBhOiAnYScgfSwgeyBfaWQ6IDIsIGE6ICdiJyB9LCB7IF9pZDogMywgYTogJ2MnIH0sIHsgX2lkOiA0LCBhOiAnZCcgfV0sIHt9LCB7fSwgPT5cbiAgICAgIEBkYi5zY3JhdGNoLnJlbW92ZSAyLCA9PlxuICAgICAgICBAZGIuc2NyYXRjaC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdhJyB9LCB7IF9pZDogMiwgYTogJ2InIH1dLCB7fSwge3NvcnQ6WydfaWQnXSwgbGltaXQ6Mn0sID0+XG4gICAgICAgICAgQGRiLnNjcmF0Y2guZmluZCh7fSwge3NvcnQ6WydfaWQnXX0pLmZldGNoIChyZXN1bHRzKSAtPlxuICAgICAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCBfLnBsdWNrKHJlc3VsdHMsICdfaWQnKSwgWzEsMyw0XVxuICAgICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJyZXR1cm5zIHBlbmRpbmcgdXBzZXJ0c1wiLCAoZG9uZSkgLT5cbiAgICBAZGIuc2NyYXRjaC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdhcHBsZScgfV0sIHt9LCB7fSwgPT5cbiAgICAgIEBkYi5zY3JhdGNoLnVwc2VydCB7IF9pZDogMiwgYTogJ2JhbmFuYScgfSwgPT5cbiAgICAgICAgQGRiLnNjcmF0Y2gucGVuZGluZ1Vwc2VydHMgKHJlc3VsdHMpID0+XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHMubGVuZ3RoLCAxXG4gICAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHNbMF0uYSwgJ2JhbmFuYSdcbiAgICAgICAgICBkb25lKClcblxuICBpdCBcInJlc29sdmVzIHBlbmRpbmcgdXBzZXJ0c1wiLCAoZG9uZSkgLT5cbiAgICBAZGIuc2NyYXRjaC51cHNlcnQgeyBfaWQ6IDIsIGE6ICdiYW5hbmEnIH0sID0+XG4gICAgICBAZGIuc2NyYXRjaC5yZXNvbHZlVXBzZXJ0IHsgX2lkOiAyLCBhOiAnYmFuYW5hJyB9LCA9PlxuICAgICAgICBAZGIuc2NyYXRjaC5wZW5kaW5nVXBzZXJ0cyAocmVzdWx0cykgPT5cbiAgICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0cy5sZW5ndGgsIDBcbiAgICAgICAgICBkb25lKClcblxuICBpdCBcInJldGFpbnMgY2hhbmdlZCBwZW5kaW5nIHVwc2VydHNcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnNjcmF0Y2gudXBzZXJ0IHsgX2lkOiAyLCBhOiAnYmFuYW5hJyB9LCA9PlxuICAgICAgQGRiLnNjcmF0Y2gudXBzZXJ0IHsgX2lkOiAyLCBhOiAnYmFuYW5hMicgfSwgPT5cbiAgICAgICAgQGRiLnNjcmF0Y2gucmVzb2x2ZVVwc2VydCB7IF9pZDogMiwgYTogJ2JhbmFuYScgfSwgPT5cbiAgICAgICAgICBAZGIuc2NyYXRjaC5wZW5kaW5nVXBzZXJ0cyAocmVzdWx0cykgPT5cbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzLmxlbmd0aCwgMVxuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHNbMF0uYSwgJ2JhbmFuYTInXG4gICAgICAgICAgICBkb25lKClcblxuICBpdCBcInJlbW92ZXMgcGVuZGluZyB1cHNlcnRzXCIsIChkb25lKSAtPlxuICAgIEBkYi5zY3JhdGNoLnVwc2VydCB7IF9pZDogMiwgYTogJ2JhbmFuYScgfSwgPT5cbiAgICAgIEBkYi5zY3JhdGNoLnJlbW92ZSAyLCA9PlxuICAgICAgICBAZGIuc2NyYXRjaC5wZW5kaW5nVXBzZXJ0cyAocmVzdWx0cykgPT5cbiAgICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0cy5sZW5ndGgsIDBcbiAgICAgICAgICBkb25lKClcblxuICBpdCBcInJldHVybnMgcGVuZGluZyByZW1vdmVzXCIsIChkb25lKSAtPlxuICAgIEBkYi5zY3JhdGNoLmNhY2hlIFt7IF9pZDogMSwgYTogJ2FwcGxlJyB9XSwge30sIHt9LCA9PlxuICAgICAgQGRiLnNjcmF0Y2gucmVtb3ZlIDEsID0+XG4gICAgICAgIEBkYi5zY3JhdGNoLnBlbmRpbmdSZW1vdmVzIChyZXN1bHRzKSA9PlxuICAgICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzLmxlbmd0aCwgMVxuICAgICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzWzBdLCAxXG4gICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJyZXNvbHZlcyBwZW5kaW5nIHJlbW92ZXNcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnNjcmF0Y2guY2FjaGUgW3sgX2lkOiAxLCBhOiAnYXBwbGUnIH1dLCB7fSwge30sID0+XG4gICAgICBAZGIuc2NyYXRjaC5yZW1vdmUgMSwgPT5cbiAgICAgICAgQGRiLnNjcmF0Y2gucmVzb2x2ZVJlbW92ZSAxLCA9PlxuICAgICAgICAgIEBkYi5zY3JhdGNoLnBlbmRpbmdSZW1vdmVzIChyZXN1bHRzKSA9PlxuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHMubGVuZ3RoLCAwXG4gICAgICAgICAgICBkb25lKClcblxuICBpdCBcInNlZWRzXCIsIChkb25lKSAtPlxuICAgIEBkYi5zY3JhdGNoLnNlZWQgeyBfaWQ6IDEsIGE6ICdhcHBsZScgfSwgPT5cbiAgICAgIEBkYi5zY3JhdGNoLmZpbmQoe30pLmZldGNoIChyZXN1bHRzKSAtPlxuICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0c1swXS5hLCAnYXBwbGUnXG4gICAgICAgIGRvbmUoKVxuXG4gIGl0IFwiZG9lcyBub3Qgb3ZlcndyaXRlIGV4aXN0aW5nXCIsIChkb25lKSAtPlxuICAgIEBkYi5zY3JhdGNoLmNhY2hlIFt7IF9pZDogMSwgYTogJ2JhbmFuYScgfV0sIHt9LCB7fSwgPT5cbiAgICAgIEBkYi5zY3JhdGNoLnNlZWQgeyBfaWQ6IDEsIGE6ICdhcHBsZScgfSwgPT5cbiAgICAgICAgQGRiLnNjcmF0Y2guZmluZCh7fSkuZmV0Y2ggKHJlc3VsdHMpIC0+XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHNbMF0uYSwgJ2JhbmFuYSdcbiAgICAgICAgICBkb25lKClcblxuICBpdCBcImRvZXMgbm90IGFkZCByZW1vdmVkXCIsIChkb25lKSAtPlxuICAgIEBkYi5zY3JhdGNoLmNhY2hlIFt7IF9pZDogMSwgYTogJ2FwcGxlJyB9XSwge30sIHt9LCA9PlxuICAgICAgQGRiLnNjcmF0Y2gucmVtb3ZlIDEsID0+XG4gICAgICAgIEBkYi5zY3JhdGNoLnNlZWQgeyBfaWQ6IDEsIGE6ICdhcHBsZScgfSwgPT5cbiAgICAgICAgICBAZGIuc2NyYXRjaC5maW5kKHt9KS5mZXRjaCAocmVzdWx0cykgLT5cbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzLmxlbmd0aCwgMFxuICAgICAgICAgICAgZG9uZSgpXG5cbmRlc2NyaWJlICdMb2NhbERiIHdpdGggbG9jYWwgc3RvcmFnZScsIC0+XG4gIGJlZm9yZSAtPlxuICAgIEBkYiA9IG5ldyBMb2NhbERiKCdzY3JhdGNoJywgeyBuYW1lc3BhY2U6IFwiZGIuc2NyYXRjaFwiIH0pXG5cbiAgYmVmb3JlRWFjaCAoZG9uZSkgLT5cbiAgICBAZGIucmVtb3ZlQ29sbGVjdGlvbignc2NyYXRjaCcpXG4gICAgQGRiLmFkZENvbGxlY3Rpb24oJ3NjcmF0Y2gnKVxuICAgIGRvbmUoKVxuXG4gIGl0IFwicmV0YWlucyBpdGVtc1wiLCAoZG9uZSkgLT5cbiAgICBAZGIuc2NyYXRjaC51cHNlcnQgeyBfaWQ6MSwgYTpcIkFsaWNlXCIgfSwgPT5cbiAgICAgIGRiMiA9IG5ldyBMb2NhbERiKCdzY3JhdGNoJywgeyBuYW1lc3BhY2U6IFwiZGIuc2NyYXRjaFwiIH0pXG4gICAgICBkYjIuYWRkQ29sbGVjdGlvbiAnc2NyYXRjaCdcbiAgICAgIGRiMi5zY3JhdGNoLmZpbmQoe30pLmZldGNoIChyZXN1bHRzKSAtPlxuICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0c1swXS5hLCBcIkFsaWNlXCJcbiAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJyZXRhaW5zIHVwc2VydHNcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnNjcmF0Y2gudXBzZXJ0IHsgX2lkOjEsIGE6XCJBbGljZVwiIH0sID0+XG4gICAgICBkYjIgPSBuZXcgTG9jYWxEYignc2NyYXRjaCcsIHsgbmFtZXNwYWNlOiBcImRiLnNjcmF0Y2hcIiB9KVxuICAgICAgZGIyLmFkZENvbGxlY3Rpb24gJ3NjcmF0Y2gnXG4gICAgICBkYjIuc2NyYXRjaC5maW5kKHt9KS5mZXRjaCAocmVzdWx0cykgLT5cbiAgICAgICAgZGIyLnNjcmF0Y2gucGVuZGluZ1Vwc2VydHMgKHVwc2VydHMpIC0+XG4gICAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCByZXN1bHRzLCB1cHNlcnRzXG4gICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJyZXRhaW5zIHJlbW92ZXNcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnNjcmF0Y2guc2VlZCB7IF9pZDoxLCBhOlwiQWxpY2VcIiB9LCA9PlxuICAgICAgQGRiLnNjcmF0Y2gucmVtb3ZlIDEsID0+XG4gICAgICAgIGRiMiA9IG5ldyBMb2NhbERiKCdzY3JhdGNoJywgeyBuYW1lc3BhY2U6IFwiZGIuc2NyYXRjaFwiIH0pXG4gICAgICAgIGRiMi5hZGRDb2xsZWN0aW9uICdzY3JhdGNoJ1xuICAgICAgICBkYjIuc2NyYXRjaC5wZW5kaW5nUmVtb3ZlcyAocmVtb3ZlcykgLT5cbiAgICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIHJlbW92ZXMsIFsxXVxuICAgICAgICAgIGRvbmUoKVxuXG5kZXNjcmliZSAnTG9jYWxEYiB3aXRob3V0IGxvY2FsIHN0b3JhZ2UnLCAtPlxuICBiZWZvcmUgLT5cbiAgICBAZGIgPSBuZXcgTG9jYWxEYignc2NyYXRjaCcpXG5cbiAgYmVmb3JlRWFjaCAoZG9uZSkgLT5cbiAgICBAZGIucmVtb3ZlQ29sbGVjdGlvbignc2NyYXRjaCcpXG4gICAgQGRiLmFkZENvbGxlY3Rpb24oJ3NjcmF0Y2gnKVxuICAgIGRvbmUoKVxuXG4gIGl0IFwiZG9lcyBub3QgcmV0YWluIGl0ZW1zXCIsIChkb25lKSAtPlxuICAgIEBkYi5zY3JhdGNoLnVwc2VydCB7IF9pZDoxLCBhOlwiQWxpY2VcIiB9LCA9PlxuICAgICAgZGIyID0gbmV3IExvY2FsRGIoJ3NjcmF0Y2gnKVxuICAgICAgZGIyLmFkZENvbGxlY3Rpb24gJ3NjcmF0Y2gnXG4gICAgICBkYjIuc2NyYXRjaC5maW5kKHt9KS5mZXRjaCAocmVzdWx0cykgLT5cbiAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHMubGVuZ3RoLCAwXG4gICAgICAgIGRvbmUoKVxuXG4gIGl0IFwiZG9lcyBub3QgcmV0YWluIHVwc2VydHNcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnNjcmF0Y2gudXBzZXJ0IHsgX2lkOjEsIGE6XCJBbGljZVwiIH0sID0+XG4gICAgICBkYjIgPSBuZXcgTG9jYWxEYignc2NyYXRjaCcpXG4gICAgICBkYjIuYWRkQ29sbGVjdGlvbiAnc2NyYXRjaCdcbiAgICAgIGRiMi5zY3JhdGNoLmZpbmQoe30pLmZldGNoIChyZXN1bHRzKSAtPlxuICAgICAgICBkYjIuc2NyYXRjaC5wZW5kaW5nVXBzZXJ0cyAodXBzZXJ0cykgLT5cbiAgICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0cy5sZW5ndGgsIDBcbiAgICAgICAgICBkb25lKClcblxuICBpdCBcImRvZXMgbm90IHJldGFpbiByZW1vdmVzXCIsIChkb25lKSAtPlxuICAgIEBkYi5zY3JhdGNoLnNlZWQgeyBfaWQ6MSwgYTpcIkFsaWNlXCIgfSwgPT5cbiAgICAgIEBkYi5zY3JhdGNoLnJlbW92ZSAxLCA9PlxuICAgICAgICBkYjIgPSBuZXcgTG9jYWxEYignc2NyYXRjaCcpXG4gICAgICAgIGRiMi5hZGRDb2xsZWN0aW9uICdzY3JhdGNoJ1xuICAgICAgICBkYjIuc2NyYXRjaC5wZW5kaW5nUmVtb3ZlcyAocmVtb3ZlcykgLT5cbiAgICAgICAgICBhc3NlcnQuZXF1YWwgcmVtb3Zlcy5sZW5ndGgsIDBcbiAgICAgICAgICBkb25lKClcblxuIiwiYXNzZXJ0ID0gY2hhaS5hc3NlcnRcblJlbW90ZURiID0gcmVxdWlyZSBcIi4uL2FwcC9qcy9kYi9SZW1vdGVEYlwiXG5kYl9xdWVyaWVzID0gcmVxdWlyZSBcIi4vZGJfcXVlcmllc1wiXG5cbmlmIGZhbHNlXG4gIGRlc2NyaWJlICdSZW1vdGVEYicsIC0+XG4gICAgYmVmb3JlRWFjaCAoZG9uZSkgLT5cbiAgICAgIHVybCA9ICdodHRwOi8vbG9jYWxob3N0OjgwODAvdjMvJ1xuICAgICAgcmVxID0gJC5wb3N0KHVybCArIFwiX3Jlc2V0XCIsIHt9KVxuICAgICAgcmVxLmZhaWwgKGpxWEhSLCB0ZXh0U3RhdHVzLCBlcnJvclRocm93bikgPT5cbiAgICAgICAgdGhyb3cgdGV4dFN0YXR1c1xuICAgICAgcmVxLmRvbmUgPT5cbiAgICAgICAgcmVxID0gJC5hamF4KHVybCArIFwidXNlcnMvdGVzdFwiLCB7XG4gICAgICAgICAgZGF0YSA6IEpTT04uc3RyaW5naWZ5KHsgZW1haWw6IFwidGVzdEB0ZXN0LmNvbVwiLCBwYXNzd29yZDpcInh5enp5XCIgfSksXG4gICAgICAgICAgY29udGVudFR5cGUgOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICAgdHlwZSA6ICdQVVQnfSlcbiAgICAgICAgcmVxLmRvbmUgKGRhdGEpID0+XG4gICAgICAgICAgcmVxID0gJC5hamF4KHVybCArIFwidXNlcnMvdGVzdFwiLCB7XG4gICAgICAgICAgZGF0YSA6IEpTT04uc3RyaW5naWZ5KHsgcGFzc3dvcmQ6XCJ4eXp6eVwiIH0pLFxuICAgICAgICAgIGNvbnRlbnRUeXBlIDogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICAgIHR5cGUgOiAnUE9TVCd9KVxuICAgICAgICAgIHJlcS5kb25lIChkYXRhKSA9PlxuICAgICAgICAgICAgQGNsaWVudCA9IGRhdGEuY2xpZW50XG5cbiAgICAgICAgICAgIEBkYiA9IG5ldyBSZW1vdGVEYih1cmwsIEBjbGllbnQpXG4gICAgICAgICAgICBAZGIuYWRkQ29sbGVjdGlvbignc2NyYXRjaCcpXG5cbiAgICAgICAgICAgIGRvbmUoKVxuXG4gICAgZGVzY3JpYmUgXCJwYXNzZXMgcXVlcmllc1wiLCAtPlxuICAgICAgZGJfcXVlcmllcy5jYWxsKHRoaXMpXG4iLCJhc3NlcnQgPSBjaGFpLmFzc2VydFxuRHJvcGRvd25RdWVzdGlvbiA9IHJlcXVpcmUoJ2Zvcm1zJykuRHJvcGRvd25RdWVzdGlvblxuVUlEcml2ZXIgPSByZXF1aXJlICcuL2hlbHBlcnMvVUlEcml2ZXInXG5cbiMgY2xhc3MgTW9ja0xvY2F0aW9uRmluZGVyXG4jICAgY29uc3RydWN0b3I6ICAtPlxuIyAgICAgXy5leHRlbmQgQCwgQmFja2JvbmUuRXZlbnRzXG5cbiMgICBnZXRMb2NhdGlvbjogLT5cbiMgICBzdGFydFdhdGNoOiAtPlxuIyAgIHN0b3BXYXRjaDogLT5cblxuZGVzY3JpYmUgJ0Ryb3Bkb3duUXVlc3Rpb24nLCAtPlxuICBjb250ZXh0ICdXaXRoIGEgZmV3IG9wdGlvbnMnLCAtPlxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgIEBtb2RlbCA9IG5ldyBCYWNrYm9uZS5Nb2RlbCgpXG4gICAgICBAcXVlc3Rpb24gPSBuZXcgRHJvcGRvd25RdWVzdGlvblxuICAgICAgICBvcHRpb25zOiBbWydhJywgJ0FwcGxlJ10sIFsnYicsICdCYW5hbmEnXV1cbiAgICAgICAgbW9kZWw6IEBtb2RlbFxuICAgICAgICBpZDogXCJxMVwiXG5cbiAgICBpdCAnYWNjZXB0cyBrbm93biB2YWx1ZScsIC0+XG4gICAgICBAbW9kZWwuc2V0KHExOiAnYScpXG4gICAgICBhc3NlcnQuZXF1YWwgQG1vZGVsLmdldCgncTEnKSwgJ2EnXG4gICAgICBhc3NlcnQuaXNGYWxzZSBAcXVlc3Rpb24uJChcInNlbGVjdFwiKS5pcyhcIjpkaXNhYmxlZFwiKVxuXG4gICAgaXQgJ2lzIGRpc2FibGVkIHdpdGggdW5rbm93biB2YWx1ZScsIC0+XG4gICAgICBAbW9kZWwuc2V0KHExOiAneCcpXG4gICAgICBhc3NlcnQuZXF1YWwgQG1vZGVsLmdldCgncTEnKSwgJ3gnXG4gICAgICBhc3NlcnQuaXNUcnVlIEBxdWVzdGlvbi4kKFwic2VsZWN0XCIpLmlzKFwiOmRpc2FibGVkXCIpXG5cbiAgICBpdCAnaXMgbm90IGRpc2FibGVkIHdpdGggZW1wdHkgdmFsdWUnLCAtPlxuICAgICAgQG1vZGVsLnNldChxMTogbnVsbClcbiAgICAgIGFzc2VydC5lcXVhbCBAbW9kZWwuZ2V0KCdxMScpLCBudWxsXG4gICAgICBhc3NlcnQuaXNGYWxzZSBAcXVlc3Rpb24uJChcInNlbGVjdFwiKS5pcyhcIjpkaXNhYmxlZFwiKVxuXG4gICAgaXQgJ2lzIHJlZW5hYmxlZCB3aXRoIHNldHRpbmcgdmFsdWUnLCAtPlxuICAgICAgQG1vZGVsLnNldChxMTogJ3gnKVxuICAgICAgYXNzZXJ0LmVxdWFsIEBtb2RlbC5nZXQoJ3ExJyksICd4J1xuICAgICAgQHF1ZXN0aW9uLnNldE9wdGlvbnMoW1snYScsICdBcHBsZSddLCBbJ2InLCAnQmFuYW5hJ10sIFsneCcsICdLaXdpJ11dKVxuICAgICAgYXNzZXJ0LmlzRmFsc2UgQHF1ZXN0aW9uLiQoXCJzZWxlY3RcIikuaXMoXCI6ZGlzYWJsZWRcIilcblxuIiwiYXNzZXJ0ID0gY2hhaS5hc3NlcnRcblxuR2VvSlNPTiA9IHJlcXVpcmUgJy4uL2FwcC9qcy9HZW9KU09OJ1xuXG5tb2R1bGUuZXhwb3J0cyA9IC0+XG4gIGNvbnRleHQgJ1dpdGggc2FtcGxlIHJvd3MnLCAtPlxuICAgIGJlZm9yZUVhY2ggKGRvbmUpIC0+XG4gICAgICBAZGIuc2NyYXRjaC51cHNlcnQgeyBfaWQ6XCIxXCIsIGE6XCJBbGljZVwiIH0sID0+XG4gICAgICAgIEBkYi5zY3JhdGNoLnVwc2VydCB7IF9pZDpcIjJcIiwgYTpcIkNoYXJsaWVcIiB9LCA9PlxuICAgICAgICAgIEBkYi5zY3JhdGNoLnVwc2VydCB7IF9pZDpcIjNcIiwgYTpcIkJvYlwiIH0sID0+XG4gICAgICAgICAgICBkb25lKClcblxuICAgIGl0ICdmaW5kcyBhbGwgcm93cycsIChkb25lKSAtPlxuICAgICAgQGRiLnNjcmF0Y2guZmluZCh7fSkuZmV0Y2ggKHJlc3VsdHMpID0+XG4gICAgICAgIGFzc2VydC5lcXVhbCAzLCByZXN1bHRzLmxlbmd0aFxuICAgICAgICBkb25lKClcblxuICAgIGl0ICdmaW5kcyBhbGwgcm93cyB3aXRoIG9wdGlvbnMnLCAoZG9uZSkgLT5cbiAgICAgIEBkYi5zY3JhdGNoLmZpbmQoe30sIHt9KS5mZXRjaCAocmVzdWx0cykgPT5cbiAgICAgICAgYXNzZXJ0LmVxdWFsIDMsIHJlc3VsdHMubGVuZ3RoXG4gICAgICAgIGRvbmUoKVxuXG4gICAgaXQgJ2ZpbHRlcnMgcm93cyBieSBpZCcsIChkb25lKSAtPlxuICAgICAgQGRiLnNjcmF0Y2guZmluZCh7IF9pZDogXCIxXCIgfSkuZmV0Y2ggKHJlc3VsdHMpID0+XG4gICAgICAgIGFzc2VydC5lcXVhbCAxLCByZXN1bHRzLmxlbmd0aFxuICAgICAgICBhc3NlcnQuZXF1YWwgJ0FsaWNlJywgcmVzdWx0c1swXS5hXG4gICAgICAgIGRvbmUoKVxuXG4gICAgaXQgJ2ZpbmRzIG9uZSByb3cnLCAoZG9uZSkgLT5cbiAgICAgIEBkYi5zY3JhdGNoLmZpbmRPbmUgeyBfaWQ6IFwiMlwiIH0sIChyZXN1bHQpID0+XG4gICAgICAgIGFzc2VydC5lcXVhbCAnQ2hhcmxpZScsIHJlc3VsdC5hXG4gICAgICAgIGRvbmUoKVxuXG4gICAgaXQgJ3JlbW92ZXMgaXRlbScsIChkb25lKSAtPlxuICAgICAgQGRiLnNjcmF0Y2gucmVtb3ZlIFwiMlwiLCA9PlxuICAgICAgICBAZGIuc2NyYXRjaC5maW5kKHt9KS5mZXRjaCAocmVzdWx0cykgPT5cbiAgICAgICAgICBhc3NlcnQuZXF1YWwgMiwgcmVzdWx0cy5sZW5ndGhcbiAgICAgICAgICBhc3NlcnQgXCIxXCIgaW4gKHJlc3VsdC5faWQgZm9yIHJlc3VsdCBpbiByZXN1bHRzKVxuICAgICAgICAgIGFzc2VydCBcIjJcIiBub3QgaW4gKHJlc3VsdC5faWQgZm9yIHJlc3VsdCBpbiByZXN1bHRzKVxuICAgICAgICAgIGRvbmUoKVxuXG4gICAgaXQgJ3JlbW92ZXMgbm9uLWV4aXN0ZW50IGl0ZW0nLCAoZG9uZSkgLT5cbiAgICAgIEBkYi5zY3JhdGNoLnJlbW92ZSBcIjk5OVwiLCA9PlxuICAgICAgICBAZGIuc2NyYXRjaC5maW5kKHt9KS5mZXRjaCAocmVzdWx0cykgPT5cbiAgICAgICAgICBhc3NlcnQuZXF1YWwgMywgcmVzdWx0cy5sZW5ndGhcbiAgICAgICAgICBkb25lKClcblxuICAgIGl0ICdzb3J0cyBhc2NlbmRpbmcnLCAoZG9uZSkgLT5cbiAgICAgIEBkYi5zY3JhdGNoLmZpbmQoe30sIHtzb3J0OiBbJ2EnXX0pLmZldGNoIChyZXN1bHRzKSA9PlxuICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIF8ucGx1Y2socmVzdWx0cywgJ19pZCcpLCBbXCIxXCIsXCIzXCIsXCIyXCJdXG4gICAgICAgIGRvbmUoKVxuXG4gICAgaXQgJ3NvcnRzIGRlc2NlbmRpbmcnLCAoZG9uZSkgLT5cbiAgICAgIEBkYi5zY3JhdGNoLmZpbmQoe30sIHtzb3J0OiBbWydhJywnZGVzYyddXX0pLmZldGNoIChyZXN1bHRzKSA9PlxuICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIF8ucGx1Y2socmVzdWx0cywgJ19pZCcpLCBbXCIyXCIsXCIzXCIsXCIxXCJdXG4gICAgICAgIGRvbmUoKVxuXG4gICAgaXQgJ2xpbWl0cycsIChkb25lKSAtPlxuICAgICAgQGRiLnNjcmF0Y2guZmluZCh7fSwge3NvcnQ6IFsnYSddLCBsaW1pdDoyfSkuZmV0Y2ggKHJlc3VsdHMpID0+XG4gICAgICAgIGFzc2VydC5kZWVwRXF1YWwgXy5wbHVjayhyZXN1bHRzLCAnX2lkJyksIFtcIjFcIixcIjNcIl1cbiAgICAgICAgZG9uZSgpXG5cbiAgICBpdCAnZmV0Y2hlcyBpbmRlcGVuZGVudCBjb3BpZXMnLCAoZG9uZSkgLT5cbiAgICAgIEBkYi5zY3JhdGNoLmZpbmRPbmUgeyBfaWQ6IFwiMlwiIH0sIChyZXN1bHQpID0+XG4gICAgICAgIHJlc3VsdC5hID0gJ0RhdmlkJ1xuICAgICAgICBAZGIuc2NyYXRjaC5maW5kT25lIHsgX2lkOiBcIjJcIiB9LCAocmVzdWx0KSA9PlxuICAgICAgICAgIGFzc2VydC5lcXVhbCAnQ2hhcmxpZScsIHJlc3VsdC5hXG4gICAgICAgICAgZG9uZSgpXG5cbiAgaXQgJ2FkZHMgX2lkIHRvIHJvd3MnLCAoZG9uZSkgLT5cbiAgICBAZGIuc2NyYXRjaC51cHNlcnQgeyBhOiAxIH0sIChpdGVtKSA9PlxuICAgICAgYXNzZXJ0LnByb3BlcnR5IGl0ZW0sICdfaWQnXG4gICAgICBhc3NlcnQubGVuZ3RoT2YgaXRlbS5faWQsIDMyXG4gICAgICBkb25lKClcblxuICBpdCAndXBkYXRlcyBieSBpZCcsIChkb25lKSAtPlxuICAgIEBkYi5zY3JhdGNoLnVwc2VydCB7IF9pZDpcIjFcIiwgYToxIH0sIChpdGVtKSA9PlxuICAgICAgQGRiLnNjcmF0Y2gudXBzZXJ0IHsgX2lkOlwiMVwiLCBhOjIsIF9yZXY6IDEgfSwgKGl0ZW0pID0+XG4gICAgICAgIGFzc2VydC5lcXVhbCBpdGVtLmEsIDJcbiAgXG4gICAgICAgIEBkYi5zY3JhdGNoLmZpbmQoe30pLmZldGNoIChyZXN1bHRzKSA9PlxuICAgICAgICAgIGFzc2VydC5lcXVhbCAxLCByZXN1bHRzLmxlbmd0aFxuICAgICAgICAgIGRvbmUoKVxuXG5cbiAgZ2VvcG9pbnQgPSAobG5nLCBsYXQpIC0+XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZTogJ1BvaW50J1xuICAgICAgICBjb29yZGluYXRlczogW2xuZywgbGF0XVxuICAgIH1cblxuICBjb250ZXh0ICdXaXRoIGdlb2xvY2F0ZWQgcm93cycsIC0+XG4gICAgYmVmb3JlRWFjaCAoZG9uZSkgLT5cbiAgICAgIEBkYi5zY3JhdGNoLnVwc2VydCB7IF9pZDpcIjFcIiwgbG9jOmdlb3BvaW50KDkwLCA0NSkgfSwgPT5cbiAgICAgICAgQGRiLnNjcmF0Y2gudXBzZXJ0IHsgX2lkOlwiMlwiLCBsb2M6Z2VvcG9pbnQoOTAsIDQ2KSB9LCA9PlxuICAgICAgICAgIEBkYi5zY3JhdGNoLnVwc2VydCB7IF9pZDpcIjNcIiwgbG9jOmdlb3BvaW50KDkxLCA0NSkgfSwgPT5cbiAgICAgICAgICAgIEBkYi5zY3JhdGNoLnVwc2VydCB7IF9pZDpcIjRcIiwgbG9jOmdlb3BvaW50KDkxLCA0NikgfSwgPT5cbiAgICAgICAgICAgICAgZG9uZSgpXG5cbiAgICBpdCAnZmluZHMgcG9pbnRzIG5lYXInLCAoZG9uZSkgLT5cbiAgICAgIHNlbGVjdG9yID0gbG9jOiBcbiAgICAgICAgJG5lYXI6IFxuICAgICAgICAgICRnZW9tZXRyeTogZ2VvcG9pbnQoOTAsIDQ1KVxuXG4gICAgICBAZGIuc2NyYXRjaC5maW5kKHNlbGVjdG9yKS5mZXRjaCAocmVzdWx0cykgPT5cbiAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCBfLnBsdWNrKHJlc3VsdHMsICdfaWQnKSwgW1wiMVwiLFwiM1wiLFwiMlwiLFwiNFwiXVxuICAgICAgICBkb25lKClcblxuICAgIGl0ICdmaW5kcyBwb2ludHMgbmVhciBtYXhEaXN0YW5jZScsIChkb25lKSAtPlxuICAgICAgc2VsZWN0b3IgPSBsb2M6IFxuICAgICAgICAkbmVhcjogXG4gICAgICAgICAgJGdlb21ldHJ5OiBnZW9wb2ludCg5MCwgNDUpXG4gICAgICAgICAgJG1heERpc3RhbmNlOiAxMTEwMDBcblxuICAgICAgQGRiLnNjcmF0Y2guZmluZChzZWxlY3RvcikuZmV0Y2ggKHJlc3VsdHMpID0+XG4gICAgICAgIGFzc2VydC5kZWVwRXF1YWwgXy5wbHVjayhyZXN1bHRzLCAnX2lkJyksIFtcIjFcIixcIjNcIl1cbiAgICAgICAgZG9uZSgpICAgICAgXG5cbiAgICBpdCAnZmluZHMgcG9pbnRzIG5lYXIgbWF4RGlzdGFuY2UganVzdCBhYm92ZScsIChkb25lKSAtPlxuICAgICAgc2VsZWN0b3IgPSBsb2M6IFxuICAgICAgICAkbmVhcjogXG4gICAgICAgICAgJGdlb21ldHJ5OiBnZW9wb2ludCg5MCwgNDUpXG4gICAgICAgICAgJG1heERpc3RhbmNlOiAxMTIwMDBcblxuICAgICAgQGRiLnNjcmF0Y2guZmluZChzZWxlY3RvcikuZmV0Y2ggKHJlc3VsdHMpID0+XG4gICAgICAgIGFzc2VydC5kZWVwRXF1YWwgXy5wbHVjayhyZXN1bHRzLCAnX2lkJyksIFtcIjFcIixcIjNcIixcIjJcIl1cbiAgICAgICAgZG9uZSgpXG5cbiAgICBpdCAnZmluZHMgcG9pbnRzIHdpdGhpbiBzaW1wbGUgYm94JywgKGRvbmUpIC0+XG4gICAgICBzZWxlY3RvciA9IGxvYzogXG4gICAgICAgICRnZW9JbnRlcnNlY3RzOiBcbiAgICAgICAgICAkZ2VvbWV0cnk6IFxuICAgICAgICAgICAgdHlwZTogJ1BvbHlnb24nXG4gICAgICAgICAgICBjb29yZGluYXRlczogW1tcbiAgICAgICAgICAgICAgWzg5LjUsIDQ1LjVdLCBbODkuNSwgNDYuNV0sIFs5MC41LCA0Ni41XSwgWzkwLjUsIDQ1LjVdLCBbODkuNSwgNDUuNV1cbiAgICAgICAgICAgIF1dXG4gICAgICBAZGIuc2NyYXRjaC5maW5kKHNlbGVjdG9yKS5mZXRjaCAocmVzdWx0cykgPT5cbiAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCBfLnBsdWNrKHJlc3VsdHMsICdfaWQnKSwgW1wiMlwiXVxuICAgICAgICBkb25lKClcblxuICAgIGl0ICdoYW5kbGVzIHVuZGVmaW5lZCcsIChkb25lKSAtPlxuICAgICAgc2VsZWN0b3IgPSBsb2M6IFxuICAgICAgICAkZ2VvSW50ZXJzZWN0czogXG4gICAgICAgICAgJGdlb21ldHJ5OiBcbiAgICAgICAgICAgIHR5cGU6ICdQb2x5Z29uJ1xuICAgICAgICAgICAgY29vcmRpbmF0ZXM6IFtbXG4gICAgICAgICAgICAgIFs4OS41LCA0NS41XSwgWzg5LjUsIDQ2LjVdLCBbOTAuNSwgNDYuNV0sIFs5MC41LCA0NS41XSwgWzg5LjUsIDQ1LjVdXG4gICAgICAgICAgICBdXVxuICAgICAgQGRiLnNjcmF0Y2gudXBzZXJ0IHsgX2lkOjUgfSwgPT5cbiAgICAgICAgQGRiLnNjcmF0Y2guZmluZChzZWxlY3RvcikuZmV0Y2ggKHJlc3VsdHMpID0+XG4gICAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCBfLnBsdWNrKHJlc3VsdHMsICdfaWQnKSwgW1wiMlwiXVxuICAgICAgICAgIGRvbmUoKVxuXG5cbiIsIlxuZXhwb3J0cy5EYXRlUXVlc3Rpb24gPSByZXF1aXJlICcuL0RhdGVRdWVzdGlvbidcbmV4cG9ydHMuRHJvcGRvd25RdWVzdGlvbiA9IHJlcXVpcmUgJy4vRHJvcGRvd25RdWVzdGlvbidcbmV4cG9ydHMuTnVtYmVyUXVlc3Rpb24gPSByZXF1aXJlICcuL051bWJlclF1ZXN0aW9uJ1xuZXhwb3J0cy5RdWVzdGlvbkdyb3VwID0gcmVxdWlyZSAnLi9RdWVzdGlvbkdyb3VwJ1xuZXhwb3J0cy5TYXZlQ2FuY2VsRm9ybSA9IHJlcXVpcmUgJy4vU2F2ZUNhbmNlbEZvcm0nXG5leHBvcnRzLlNvdXJjZVF1ZXN0aW9uID0gcmVxdWlyZSAnLi9Tb3VyY2VRdWVzdGlvbidcbmV4cG9ydHMuSW1hZ2VRdWVzdGlvbiA9IHJlcXVpcmUgJy4vSW1hZ2VRdWVzdGlvbidcbmV4cG9ydHMuSW1hZ2VzUXVlc3Rpb24gPSByZXF1aXJlICcuL0ltYWdlc1F1ZXN0aW9uJ1xuZXhwb3J0cy5JbnN0cnVjdGlvbnMgPSByZXF1aXJlICcuL0luc3RydWN0aW9ucydcblxuIyBNdXN0IGJlIGNyZWF0ZWQgd2l0aCBtb2RlbCAoYmFja2JvbmUgbW9kZWwpIGFuZCBjb250ZW50cyAoYXJyYXkgb2Ygdmlld3MpXG5leHBvcnRzLkZvcm1WaWV3ID0gY2xhc3MgRm9ybVZpZXcgZXh0ZW5kcyBCYWNrYm9uZS5WaWV3XG4gIGluaXRpYWxpemU6IChvcHRpb25zKSAtPlxuICAgIEBjb250ZW50cyA9IG9wdGlvbnMuY29udGVudHNcbiAgICBcbiAgICAjIEFkZCBjb250ZW50cyBhbmQgbGlzdGVuIHRvIGV2ZW50c1xuICAgIGZvciBjb250ZW50IGluIG9wdGlvbnMuY29udGVudHNcbiAgICAgIEAkZWwuYXBwZW5kKGNvbnRlbnQuZWwpO1xuICAgICAgQGxpc3RlblRvIGNvbnRlbnQsICdjbG9zZScsID0+IEB0cmlnZ2VyKCdjbG9zZScpXG4gICAgICBAbGlzdGVuVG8gY29udGVudCwgJ2NvbXBsZXRlJywgPT4gQHRyaWdnZXIoJ2NvbXBsZXRlJylcblxuICAgICMgQWRkIGxpc3RlbmVyIHRvIG1vZGVsXG4gICAgQGxpc3RlblRvIEBtb2RlbCwgJ2NoYW5nZScsID0+IEB0cmlnZ2VyKCdjaGFuZ2UnKVxuXG4gIGxvYWQ6IChkYXRhKSAtPlxuICAgIEBtb2RlbC5jbGVhcigpICAjVE9ETyBjbGVhciBvciBub3QgY2xlYXI/IGNsZWFyaW5nIHJlbW92ZXMgZGVmYXVsdHMsIGJ1dCBhbGxvd3MgdHJ1ZSByZXVzZS5cblxuICAgICMgQXBwbHkgZGVmYXVsdHMgXG4gICAgQG1vZGVsLnNldChfLmRlZmF1bHRzKF8uY2xvbmVEZWVwKGRhdGEpLCBAb3B0aW9ucy5kZWZhdWx0cyB8fCB7fSkpXG5cbiAgc2F2ZTogLT5cbiAgICByZXR1cm4gQG1vZGVsLnRvSlNPTigpXG5cblxuIyBTaW1wbGUgZm9ybSB0aGF0IGRpc3BsYXlzIGEgdGVtcGxhdGUgYmFzZWQgb24gbG9hZGVkIGRhdGFcbmV4cG9ydHMudGVtcGxhdGVWaWV3ID0gKHRlbXBsYXRlKSAtPiBcbiAgcmV0dXJuIHtcbiAgICBlbDogJCgnPGRpdj48L2Rpdj4nKVxuICAgIGxvYWQ6IChkYXRhKSAtPlxuICAgICAgJChAZWwpLmh0bWwgdGVtcGxhdGUoZGF0YSlcbiAgfVxuXG4gICMgY2xhc3MgVGVtcGxhdGVWaWV3IGV4dGVuZHMgQmFja2JvbmUuVmlld1xuICAjIGNvbnN0cnVjdG9yOiAodGVtcGxhdGUpIC0+XG4gICMgICBAdGVtcGxhdGUgPSB0ZW1wbGF0ZVxuXG4gICMgbG9hZDogKGRhdGEpIC0+XG4gICMgICBAJGVsLmh0bWwgQHRlbXBsYXRlKGRhdGEpXG5cblxuZXhwb3J0cy5TdXJ2ZXlWaWV3ID0gY2xhc3MgU3VydmV5VmlldyBleHRlbmRzIEZvcm1WaWV3XG5cbmV4cG9ydHMuV2F0ZXJUZXN0RWRpdFZpZXcgPSBjbGFzcyBXYXRlclRlc3RFZGl0VmlldyBleHRlbmRzIEZvcm1WaWV3XG4gIGluaXRpYWxpemU6IChvcHRpb25zKSAtPlxuICAgIHN1cGVyKG9wdGlvbnMpXG5cbiAgICAjIEFkZCBidXR0b25zIGF0IGJvdHRvbVxuICAgICMgVE9ETyBtb3ZlIHRvIHRlbXBsYXRlIGFuZCBzZXAgZmlsZVxuICAgIEAkZWwuYXBwZW5kICQoJycnXG4gICAgICA8ZGl2PlxuICAgICAgICAgIDxidXR0b24gaWQ9XCJjbG9zZV9idXR0b25cIiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJidG4gbWFyZ2luZWRcIj5TYXZlIGZvciBMYXRlcjwvYnV0dG9uPlxuICAgICAgICAgICZuYnNwO1xuICAgICAgICAgIDxidXR0b24gaWQ9XCJjb21wbGV0ZV9idXR0b25cIiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJidG4gYnRuLXByaW1hcnkgbWFyZ2luZWRcIj48aSBjbGFzcz1cImljb24tb2sgaWNvbi13aGl0ZVwiPjwvaT4gQ29tcGxldGU8L2J1dHRvbj5cbiAgICAgIDwvZGl2PlxuICAgICcnJylcblxuICBldmVudHM6IFxuICAgIFwiY2xpY2sgI2Nsb3NlX2J1dHRvblwiIDogXCJjbG9zZVwiXG4gICAgXCJjbGljayAjY29tcGxldGVfYnV0dG9uXCIgOiBcImNvbXBsZXRlXCJcblxuICAjIFRPRE8gcmVmYWN0b3Igd2l0aCBTYXZlQ2FuY2VsRm9ybVxuICB2YWxpZGF0ZTogLT5cbiAgICAjIEdldCBhbGwgdmlzaWJsZSBpdGVtc1xuICAgIGl0ZW1zID0gXy5maWx0ZXIoQGNvbnRlbnRzLCAoYykgLT5cbiAgICAgIGMudmlzaWJsZSBhbmQgYy52YWxpZGF0ZVxuICAgIClcbiAgICByZXR1cm4gbm90IF8uYW55KF8ubWFwKGl0ZW1zLCAoaXRlbSkgLT5cbiAgICAgIGl0ZW0udmFsaWRhdGUoKVxuICAgICkpXG5cbiAgY2xvc2U6IC0+XG4gICAgQHRyaWdnZXIgJ2Nsb3NlJ1xuXG4gIGNvbXBsZXRlOiAtPlxuICAgIGlmIEB2YWxpZGF0ZSgpXG4gICAgICBAdHJpZ2dlciAnY29tcGxldGUnXG4gICAgICBcbiMgQ3JlYXRlcyBhIGZvcm0gdmlldyBmcm9tIGEgc3RyaW5nXG5leHBvcnRzLmluc3RhbnRpYXRlVmlldyA9ICh2aWV3U3RyLCBvcHRpb25zKSA9PlxuICB2aWV3RnVuYyA9IG5ldyBGdW5jdGlvbihcIm9wdGlvbnNcIiwgdmlld1N0cilcbiAgdmlld0Z1bmMob3B0aW9ucylcblxuXy5leHRlbmQoZXhwb3J0cywgcmVxdWlyZSgnLi9mb3JtLWNvbnRyb2xzJykpXG5cblxuIyBUT0RPIGZpZ3VyZSBvdXQgaG93IHRvIGFsbG93IHR3byBzdXJ2ZXlzIGZvciBkaWZmZXJpbmcgY2xpZW50IHZlcnNpb25zPyBPciBqdXN0IHVzZSBtaW5WZXJzaW9uPyIsImZ1bmN0aW9uIFByb2JsZW1SZXBvcnRlcih1cmwsIHZlcnNpb24sIGdldENsaWVudCkge1xuICAgIHZhciBoaXN0b3J5ID0gW107XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgLy8gSUU5IGhhY2tcbiAgICBpZiAoRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQgJiYgY29uc29sZSAmJiB0eXBlb2YgY29uc29sZS5sb2cgPT0gXCJvYmplY3RcIikge1xuICAgICAgICBbXG4gICAgICAgICAgXCJsb2dcIixcImluZm9cIixcIndhcm5cIixcImVycm9yXCIsXCJhc3NlcnRcIixcImRpclwiLFwiY2xlYXJcIixcInByb2ZpbGVcIixcInByb2ZpbGVFbmRcIlxuICAgICAgICBdLmZvckVhY2goZnVuY3Rpb24gKG1ldGhvZCkge1xuICAgICAgICAgICAgY29uc29sZVttZXRob2RdID0gdGhpcy5iaW5kKGNvbnNvbGVbbWV0aG9kXSwgY29uc29sZSk7XG4gICAgICAgIH0sIEZ1bmN0aW9uLnByb3RvdHlwZS5jYWxsKTtcbiAgICB9XG5cbiAgICB2YXIgX2NhcHR1cmVkID0ge31cblxuICAgIGZ1bmN0aW9uIGNhcHR1cmUoZnVuYykge1xuICAgICAgICB2YXIgb2xkID0gY29uc29sZVtmdW5jXTtcbiAgICAgICAgX2NhcHR1cmVkW2Z1bmNdID0gb2xkO1xuICAgICAgICBjb25zb2xlW2Z1bmNdID0gZnVuY3Rpb24oYXJnKSB7XG4gICAgICAgICAgICBoaXN0b3J5LnB1c2goYXJnKTtcbiAgICAgICAgICAgIGlmIChoaXN0b3J5Lmxlbmd0aCA+IDIwMClcbiAgICAgICAgICAgICAgICBoaXN0b3J5LnNwbGljZSgwLCAyMCk7XG4gICAgICAgICAgICBvbGQuY2FsbChjb25zb2xlLCBhcmcpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgY2FwdHVyZShcImxvZ1wiKTtcbiAgICBjYXB0dXJlKFwid2FyblwiKTtcbiAgICBjYXB0dXJlKFwiZXJyb3JcIik7XG5cbiAgICBmdW5jdGlvbiBnZXRMb2coKSB7XG4gICAgICAgIHZhciBsb2cgPSBcIlwiO1xuICAgICAgICBfLmVhY2goaGlzdG9yeSwgZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICAgICAgbG9nICs9IFN0cmluZyhpdGVtKSArIFwiXFxyXFxuXCI7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gbG9nO1xuICAgIH1cblxuXG4gICAgdGhpcy5yZXBvcnRQcm9ibGVtID0gZnVuY3Rpb24oZGVzYykge1xuICAgICAgICAvLyBDcmVhdGUgbG9nIHN0cmluZ1xuICAgICAgICB2YXIgbG9nID0gZ2V0TG9nKCk7XG5cbiAgICAgICAgY29uc29sZS5sb2coXCJSZXBvcnRpbmcgcHJvYmxlbS4uLlwiKTtcblxuICAgICAgICAkLnBvc3QodXJsLCB7XG4gICAgICAgICAgICBjbGllbnQgOiBnZXRDbGllbnQoKSxcbiAgICAgICAgICAgIHZlcnNpb24gOiB2ZXJzaW9uLFxuICAgICAgICAgICAgdXNlcl9hZ2VudCA6IG5hdmlnYXRvci51c2VyQWdlbnQsXG4gICAgICAgICAgICBsb2cgOiBsb2csXG4gICAgICAgICAgICBkZXNjIDogZGVzY1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgLy8gQ2FwdHVyZSBlcnJvciBsb2dzXG4gICAgdmFyIGRlYm91bmNlZFJlcG9ydFByb2JsZW0gPSBfLmRlYm91bmNlKHRoaXMucmVwb3J0UHJvYmxlbSwgNTAwMCwgdHJ1ZSk7XG5cbiAgICB2YXIgb2xkQ29uc29sZUVycm9yID0gY29uc29sZS5lcnJvcjtcbiAgICBjb25zb2xlLmVycm9yID0gZnVuY3Rpb24oYXJnKSB7XG4gICAgICAgIG9sZENvbnNvbGVFcnJvcihhcmcpO1xuXG4gICAgICAgIGRlYm91bmNlZFJlcG9ydFByb2JsZW0oYXJnKTtcbiAgICB9O1xuXG4gICAgLy8gQ2FwdHVyZSB3aW5kb3cub25lcnJvclxuICAgIHZhciBvbGRXaW5kb3dPbkVycm9yID0gd2luZG93Lm9uZXJyb3I7XG4gICAgd2luZG93Lm9uZXJyb3IgPSBmdW5jdGlvbihlcnJvck1zZywgdXJsLCBsaW5lTnVtYmVyKSB7XG4gICAgICAgIHRoYXQucmVwb3J0UHJvYmxlbShcIndpbmRvdy5vbmVycm9yOlwiICsgZXJyb3JNc2cgKyBcIjpcIiArIHVybCArIFwiOlwiICsgbGluZU51bWJlcik7XG4gICAgICAgIFxuICAgICAgICAvLyBQdXQgdXAgYWxlcnQgaW5zdGVhZCBvZiBvbGQgYWN0aW9uXG4gICAgICAgIGFsZXJ0KFwiSW50ZXJuYWwgRXJyb3JcXG5cIiArIGVycm9yTXNnICsgXCJcXG5cIiArIHVybCArIFwiOlwiICsgbGluZU51bWJlcik7XG4gICAgICAgIC8vaWYgKG9sZFdpbmRvd09uRXJyb3IpXG4gICAgICAgIC8vICAgIG9sZFdpbmRvd09uRXJyb3IoZXJyb3JNc2csIHVybCwgbGluZU51bWJlcik7XG4gICAgfTtcblxuICAgIHRoaXMucmVzdG9yZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBfLmVhY2goXy5rZXlzKF9jYXB0dXJlZCksIGZ1bmN0aW9uKGtleSkge1xuICAgICAgICAgICAgY29uc29sZVtrZXldID0gX2NhcHR1cmVkW2tleV07XG4gICAgICAgIH0pO1xuICAgICAgICB3aW5kb3cub25lcnJvciA9IG9sZFdpbmRvd09uRXJyb3I7XG4gICAgfTtcbn1cblxuUHJvYmxlbVJlcG9ydGVyLnJlZ2lzdGVyID0gZnVuY3Rpb24oYmFzZVVybCwgdmVyc2lvbiwgZ2V0Q2xpZW50KSB7XG4gICAgaWYgKCFQcm9ibGVtUmVwb3J0ZXIuaW5zdGFuY2VzKVxuICAgICAgICBQcm9ibGVtUmVwb3J0ZXIuaW5zdGFuY2VzID0ge31cblxuICAgIGlmIChQcm9ibGVtUmVwb3J0ZXIuaW5zdGFuY2VzW2Jhc2VVcmxdKVxuICAgICAgICByZXR1cm47XG5cbiAgICBuZXcgUHJvYmxlbVJlcG9ydGVyKGJhc2VVcmwsIHZlcnNpb24sIGdldENsaWVudCk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFByb2JsZW1SZXBvcnRlcjsiLCIjIEdlb0pTT04gaGVscGVyIHJvdXRpbmVzXG5cbiMgQ29udmVydHMgbmF2aWdhdG9yIHBvc2l0aW9uIHRvIHBvaW50XG5leHBvcnRzLnBvc1RvUG9pbnQgPSAocG9zKSAtPlxuICByZXR1cm4ge1xuICAgIHR5cGU6ICdQb2ludCdcbiAgICBjb29yZGluYXRlczogW3Bvcy5jb29yZHMubG9uZ2l0dWRlLCBwb3MuY29vcmRzLmxhdGl0dWRlXVxuICB9XG5cblxuZXhwb3J0cy5sYXRMbmdCb3VuZHNUb0dlb0pTT04gPSAoYm91bmRzKSAtPlxuICBzdyA9IGJvdW5kcy5nZXRTb3V0aFdlc3QoKVxuICBuZSA9IGJvdW5kcy5nZXROb3J0aEVhc3QoKVxuICByZXR1cm4ge1xuICAgIHR5cGU6ICdQb2x5Z29uJyxcbiAgICBjb29yZGluYXRlczogW1xuICAgICAgW1tzdy5sbmcsIHN3LmxhdF0sIFxuICAgICAgW3N3LmxuZywgbmUubGF0XSwgXG4gICAgICBbbmUubG5nLCBuZS5sYXRdLCBcbiAgICAgIFtuZS5sbmcsIHN3LmxhdF0sXG4gICAgICBbc3cubG5nLCBzdy5sYXRdXVxuICAgIF1cbiAgfVxuXG4jIFRPRE86IG9ubHkgd29ya3Mgd2l0aCBib3VuZHNcbmV4cG9ydHMucG9pbnRJblBvbHlnb24gPSAocG9pbnQsIHBvbHlnb24pIC0+XG4gICMgQ2hlY2sgdGhhdCBmaXJzdCA9PSBsYXN0XG4gIGlmIG5vdCBfLmlzRXF1YWwoXy5maXJzdChwb2x5Z29uLmNvb3JkaW5hdGVzWzBdKSwgXy5sYXN0KHBvbHlnb24uY29vcmRpbmF0ZXNbMF0pKVxuICAgIHRocm93IG5ldyBFcnJvcihcIkZpcnN0IG11c3QgZXF1YWwgbGFzdFwiKVxuXG4gICMgR2V0IGJvdW5kc1xuICBib3VuZHMgPSBuZXcgTC5MYXRMbmdCb3VuZHMoXy5tYXAocG9seWdvbi5jb29yZGluYXRlc1swXSwgKGNvb3JkKSAtPiBuZXcgTC5MYXRMbmcoY29vcmRbMV0sIGNvb3JkWzBdKSkpXG4gIHJldHVybiBib3VuZHMuY29udGFpbnMobmV3IEwuTGF0TG5nKHBvaW50LmNvb3JkaW5hdGVzWzFdLCBwb2ludC5jb29yZGluYXRlc1swXSkpXG5cbmV4cG9ydHMuZ2V0UmVsYXRpdmVMb2NhdGlvbiA9IChmcm9tLCB0bykgLT5cbiAgeDEgPSBmcm9tLmNvb3JkaW5hdGVzWzBdXG4gIHkxID0gZnJvbS5jb29yZGluYXRlc1sxXVxuICB4MiA9IHRvLmNvb3JkaW5hdGVzWzBdXG4gIHkyID0gdG8uY29vcmRpbmF0ZXNbMV1cbiAgXG4gICMgQ29udmVydCB0byByZWxhdGl2ZSBwb3NpdGlvbiAoYXBwcm94aW1hdGUpXG4gIGR5ID0gKHkyIC0geTEpIC8gNTcuMyAqIDYzNzEwMDBcbiAgZHggPSBNYXRoLmNvcyh5MSAvIDU3LjMpICogKHgyIC0geDEpIC8gNTcuMyAqIDYzNzEwMDBcbiAgXG4gICMgRGV0ZXJtaW5lIGRpcmVjdGlvbiBhbmQgYW5nbGVcbiAgZGlzdCA9IE1hdGguc3FydChkeCAqIGR4ICsgZHkgKiBkeSlcbiAgYW5nbGUgPSA5MCAtIChNYXRoLmF0YW4yKGR5LCBkeCkgKiA1Ny4zKVxuICBhbmdsZSArPSAzNjAgaWYgYW5nbGUgPCAwXG4gIGFuZ2xlIC09IDM2MCBpZiBhbmdsZSA+IDM2MFxuICBcbiAgIyBHZXQgYXBwcm94aW1hdGUgZGlyZWN0aW9uXG4gIGNvbXBhc3NEaXIgPSAoTWF0aC5mbG9vcigoYW5nbGUgKyAyMi41KSAvIDQ1KSkgJSA4XG4gIGNvbXBhc3NTdHJzID0gW1wiTlwiLCBcIk5FXCIsIFwiRVwiLCBcIlNFXCIsIFwiU1wiLCBcIlNXXCIsIFwiV1wiLCBcIk5XXCJdXG4gIGlmIGRpc3QgPiAxMDAwXG4gICAgKGRpc3QgLyAxMDAwKS50b0ZpeGVkKDEpICsgXCJrbSBcIiArIGNvbXBhc3NTdHJzW2NvbXBhc3NEaXJdXG4gIGVsc2VcbiAgICAoZGlzdCkudG9GaXhlZCgwKSArIFwibSBcIiArIGNvbXBhc3NTdHJzW2NvbXBhc3NEaXJdIiwiYXNzZXJ0ID0gY2hhaS5hc3NlcnRcblxuY2xhc3MgVUlEcml2ZXJcbiAgY29uc3RydWN0b3I6IChlbCkgLT5cbiAgICBAZWwgPSAkKGVsKVxuXG4gIGdldERpc2FibGVkOiAoc3RyKSAtPlxuICAgIGZvciBpdGVtIGluIEBlbC5maW5kKFwiYSxidXR0b25cIilcbiAgICAgIGlmICQoaXRlbSkudGV4dCgpLmluZGV4T2Yoc3RyKSAhPSAtMVxuICAgICAgICByZXR1cm4gJChpdGVtKS5pcyhcIjpkaXNhYmxlZFwiKVxuICAgIGFzc2VydC5mYWlsKG51bGwsIHN0ciwgXCJDYW4ndCBmaW5kOiBcIiArIHN0cilcblxuICBjbGljazogKHN0cikgLT5cbiAgICBmb3IgaXRlbSBpbiBAZWwuZmluZChcImEsYnV0dG9uXCIpXG4gICAgICBpZiAkKGl0ZW0pLnRleHQoKS5pbmRleE9mKHN0cikgIT0gLTFcbiAgICAgICAgY29uc29sZS5sb2cgXCJDbGlja2luZzogXCIgKyAkKGl0ZW0pLnRleHQoKVxuICAgICAgICAkKGl0ZW0pLnRyaWdnZXIoXCJjbGlja1wiKVxuICAgICAgICByZXR1cm5cbiAgICBhc3NlcnQuZmFpbChudWxsLCBzdHIsIFwiQ2FuJ3QgZmluZDogXCIgKyBzdHIpXG4gIFxuICBmaWxsOiAoc3RyLCB2YWx1ZSkgLT5cbiAgICBmb3IgaXRlbSBpbiBAZWwuZmluZChcImxhYmVsXCIpXG4gICAgICBpZiAkKGl0ZW0pLnRleHQoKS5pbmRleE9mKHN0cikgIT0gLTFcbiAgICAgICAgYm94ID0gQGVsLmZpbmQoXCIjXCIrJChpdGVtKS5hdHRyKCdmb3InKSlcbiAgICAgICAgYm94LnZhbCh2YWx1ZSlcbiAgXG4gIHRleHQ6IC0+XG4gICAgcmV0dXJuIEBlbC50ZXh0KClcbiAgICAgIFxuICB3YWl0OiAoYWZ0ZXIpIC0+XG4gICAgc2V0VGltZW91dCBhZnRlciwgMTBcblxubW9kdWxlLmV4cG9ydHMgPSBVSURyaXZlciIsIlxuIyBUcmFja3MgYSBzZXQgb2YgaXRlbXMgYnkgaWQsIGluZGljYXRpbmcgd2hpY2ggaGF2ZSBiZWVuIGFkZGVkIG9yIHJlbW92ZWQuXG4jIENoYW5nZXMgYXJlIGJvdGggYWRkIGFuZCByZW1vdmVcbmNsYXNzIEl0ZW1UcmFja2VyXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgIEBrZXkgPSAnX2lkJ1xuICAgIEBpdGVtcyA9IHt9XG5cbiAgdXBkYXRlOiAoaXRlbXMpIC0+ICAgICMgUmV0dXJuIFtbYWRkZWRdLFtyZW1vdmVkXV0gaXRlbXNcbiAgICBhZGRzID0gW11cbiAgICByZW1vdmVzID0gW11cblxuICAgICMgQWRkIGFueSBuZXcgb25lc1xuICAgIGZvciBpdGVtIGluIGl0ZW1zXG4gICAgICBpZiBub3QgXy5oYXMoQGl0ZW1zLCBpdGVtW0BrZXldKVxuICAgICAgICBhZGRzLnB1c2goaXRlbSlcblxuICAgICMgQ3JlYXRlIG1hcCBvZiBpdGVtcyBwYXJhbWV0ZXJcbiAgICBtYXAgPSBfLm9iamVjdChfLnBsdWNrKGl0ZW1zLCBAa2V5KSwgaXRlbXMpXG5cbiAgICAjIEZpbmQgcmVtb3Zlc1xuICAgIGZvciBrZXksIHZhbHVlIG9mIEBpdGVtc1xuICAgICAgaWYgbm90IF8uaGFzKG1hcCwga2V5KVxuICAgICAgICByZW1vdmVzLnB1c2godmFsdWUpXG4gICAgICBlbHNlIGlmIG5vdCBfLmlzRXF1YWwodmFsdWUsIG1hcFtrZXldKVxuICAgICAgICBhZGRzLnB1c2gobWFwW2tleV0pXG4gICAgICAgIHJlbW92ZXMucHVzaCh2YWx1ZSlcblxuICAgIGZvciBpdGVtIGluIHJlbW92ZXNcbiAgICAgIGRlbGV0ZSBAaXRlbXNbaXRlbVtAa2V5XV1cblxuICAgIGZvciBpdGVtIGluIGFkZHNcbiAgICAgIEBpdGVtc1tpdGVtW0BrZXldXSA9IGl0ZW1cblxuICAgIHJldHVybiBbYWRkcywgcmVtb3Zlc11cblxubW9kdWxlLmV4cG9ydHMgPSBJdGVtVHJhY2tlciIsIlxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBIeWJyaWREYlxuICBjb25zdHJ1Y3RvcjogKGxvY2FsRGIsIHJlbW90ZURiKSAtPlxuICAgIEBsb2NhbERiID0gbG9jYWxEYlxuICAgIEByZW1vdGVEYiA9IHJlbW90ZURiXG5cbiAgYWRkQ29sbGVjdGlvbjogKG5hbWUpIC0+XG4gICAgQFtuYW1lXSA9IG5ldyBIeWJyaWRDb2xsZWN0aW9uKG5hbWUsIEBsb2NhbERiW25hbWVdLCBAcmVtb3RlRGJbbmFtZV0pXG5cbmNsYXNzIEh5YnJpZENvbGxlY3Rpb25cbiAgY29uc3RydWN0b3I6IChuYW1lLCBsb2NhbENvbCwgcmVtb3RlQ29sKSAtPlxuICAgIEBuYW1lID0gbmFtZVxuICAgIEBsb2NhbENvbCA9IGxvY2FsQ29sXG4gICAgQHJlbW90ZUNvbCA9IHJlbW90ZUNvbFxuXG4gIGZpbmQ6IChzZWxlY3Rvciwgb3B0aW9ucyA9IHt9KSAtPlxuICAgIHJldHVybiBmZXRjaDogKHN1Y2Nlc3MsIGVycm9yKSA9PlxuICAgICAgQF9maW5kRmV0Y2goc2VsZWN0b3IsIG9wdGlvbnMsIHN1Y2Nlc3MsIGVycm9yKVxuXG4gIGZpbmRPbmU6IChzZWxlY3Rvciwgb3B0aW9ucyA9IHt9LCBzdWNjZXNzLCBlcnJvcikgLT5cbiAgICBpZiBfLmlzRnVuY3Rpb24ob3B0aW9ucykgXG4gICAgICBbb3B0aW9ucywgc3VjY2VzcywgZXJyb3JdID0gW3t9LCBvcHRpb25zLCBzdWNjZXNzXVxuXG4gICAgI0BmaW5kKHNlbGVjdG9yLCBvcHRpb25zKS5mZXRjaCAocmVzdWx0cykgLT5cbiAgICAjICBpZiBzdWNjZXNzPyB0aGVuIHN1Y2Nlc3MoaWYgcmVzdWx0cy5sZW5ndGg+MCB0aGVuIHJlc3VsdHNbMF0gZWxzZSBudWxsKVxuICAgICMsIGVycm9yXG5cbiAgX2ZpbmRGZXRjaDogKHNlbGVjdG9yLCBvcHRpb25zLCBzdWNjZXNzLCBlcnJvcikgLT5cbiAgICBtb2RlID0gb3B0aW9ucy5tb2RlIHx8IFwiaHlicmlkXCJcblxuICAgIGlmIG1vZGUgPT0gXCJoeWJyaWRcIlxuICAgICAgIyBHZXQgbG9jYWwgcmVzdWx0c1xuICAgICAgbG9jYWxTdWNjZXNzID0gKGxvY2FsRGF0YSkgPT5cbiAgICAgICAgIyBSZXR1cm4gZGF0YSBpbW1lZGlhdGVseVxuICAgICAgICBzdWNjZXNzKGxvY2FsRGF0YSlcblxuICAgICAgICAjIEdldCByZW1vdGUgZGF0YVxuICAgICAgICByZW1vdGVTdWNjZXNzID0gKHJlbW90ZURhdGEpID0+XG4gICAgICAgICAgIyBDYWNoZSBsb2NhbGx5XG4gICAgICAgICAgY2FjaGVTdWNjZXNzID0gKCkgPT5cbiAgICAgICAgICAgICMgR2V0IGxvY2FsIGRhdGEgYWdhaW5cbiAgICAgICAgICAgIGxvY2FsU3VjY2VzczIgPSAobG9jYWxEYXRhMikgPT5cbiAgICAgICAgICAgICAgIyBDaGVjayBpZiBkaWZmZXJlbnRcbiAgICAgICAgICAgICAgaWYgbm90IF8uaXNFcXVhbChsb2NhbERhdGEsIGxvY2FsRGF0YTIpXG4gICAgICAgICAgICAgICAgIyBTZW5kIGFnYWluXG4gICAgICAgICAgICAgICAgc3VjY2Vzcyhsb2NhbERhdGEyKVxuICAgICAgICAgICAgQGxvY2FsQ29sLmZpbmQoc2VsZWN0b3IsIG9wdGlvbnMpLmZldGNoKGxvY2FsU3VjY2VzczIpXG4gICAgICAgICAgQGxvY2FsQ29sLmNhY2hlKHJlbW90ZURhdGEsIHNlbGVjdG9yLCBvcHRpb25zLCBjYWNoZVN1Y2Nlc3MsIGVycm9yKVxuICAgICAgICBAcmVtb3RlQ29sLmZpbmQoc2VsZWN0b3IsIG9wdGlvbnMpLmZldGNoKHJlbW90ZVN1Y2Nlc3MpXG5cbiAgICAgIEBsb2NhbENvbC5maW5kKHNlbGVjdG9yLCBvcHRpb25zKS5mZXRjaChsb2NhbFN1Y2Nlc3MsIGVycm9yKVxuXG4gIHVwc2VydDogKGRvYywgc3VjY2VzcywgZXJyb3IpIC0+XG5cbiAgcmVtb3ZlOiAoaWQsIHN1Y2Nlc3MsIGVycm9yKSAtPlxuXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFJlbW90ZURiXG4gICMgVXJsIG11c3QgaGF2ZSB0cmFpbGluZyAvXG4gIGNvbnN0cnVjdG9yOiAodXJsLCBjbGllbnQpIC0+XG4gICAgQHVybCA9IHVybFxuICAgIEBjbGllbnQgPSBjbGllbnRcbiAgICBAY29sbGVjdGlvbnMgPSB7fVxuXG4gIGFkZENvbGxlY3Rpb246IChuYW1lKSAtPlxuICAgIGNvbGxlY3Rpb24gPSBuZXcgQ29sbGVjdGlvbihuYW1lLCBAdXJsICsgbmFtZSwgQGNsaWVudClcbiAgICBAW25hbWVdID0gY29sbGVjdGlvblxuICAgIEBjb2xsZWN0aW9uc1tuYW1lXSA9IGNvbGxlY3Rpb25cblxuICByZW1vdmVDb2xsZWN0aW9uOiAobmFtZSkgLT5cbiAgICBkZWxldGUgQFtuYW1lXVxuICAgIGRlbGV0ZSBAY29sbGVjdGlvbnNbbmFtZV1cblxuIyBSZW1vdGUgY29sbGVjdGlvbiBvbiBzZXJ2ZXJcbmNsYXNzIENvbGxlY3Rpb25cbiAgY29uc3RydWN0b3I6IChuYW1lLCB1cmwsIGNsaWVudCkgLT5cbiAgICBAbmFtZSA9IG5hbWVcbiAgICBAdXJsID0gdXJsXG4gICAgQGNsaWVudCA9IGNsaWVudFxuXG4gIGZpbmQ6IChzZWxlY3Rvciwgb3B0aW9ucyA9IHt9KSAtPlxuICAgIHJldHVybiBmZXRjaDogKHN1Y2Nlc3MsIGVycm9yKSA9PlxuICAgICAgIyBDcmVhdGUgdXJsXG4gICAgICBwYXJhbXMgPSB7fVxuICAgICAgaWYgb3B0aW9ucy5zb3J0XG4gICAgICAgIHBhcmFtcy5zb3J0ID0gSlNPTi5zdHJpbmdpZnkob3B0aW9ucy5zb3J0KVxuICAgICAgaWYgb3B0aW9ucy5saW1pdFxuICAgICAgICBwYXJhbXMubGltaXQgPSBvcHRpb25zLmxpbWl0XG4gICAgICBwYXJhbXMuY2xpZW50ID0gQGNsaWVudFxuICAgICAgcGFyYW1zLnNlbGVjdG9yID0gSlNPTi5zdHJpbmdpZnkoc2VsZWN0b3IgfHwge30pXG5cbiAgICAgIHJlcSA9ICQuZ2V0SlNPTihAdXJsLCBwYXJhbXMpXG4gICAgICByZXEuZG9uZSAoZGF0YSwgdGV4dFN0YXR1cywganFYSFIpID0+XG4gICAgICAgIHN1Y2Nlc3MoZGF0YSlcbiAgICAgIHJlcS5mYWlsIChqcVhIUiwgdGV4dFN0YXR1cywgZXJyb3JUaHJvd24pID0+XG4gICAgICAgIGlmIGVycm9yXG4gICAgICAgICAgZXJyb3IoZXJyb3JUaHJvd24pXG5cbiAgZmluZE9uZTogKHNlbGVjdG9yLCBvcHRpb25zID0ge30sIHN1Y2Nlc3MsIGVycm9yKSAtPlxuICAgIGlmIF8uaXNGdW5jdGlvbihvcHRpb25zKSBcbiAgICAgIFtvcHRpb25zLCBzdWNjZXNzLCBlcnJvcl0gPSBbe30sIG9wdGlvbnMsIHN1Y2Nlc3NdXG5cbiAgICAjIENyZWF0ZSB1cmxcbiAgICBwYXJhbXMgPSB7fVxuICAgIGlmIG9wdGlvbnMuc29ydFxuICAgICAgcGFyYW1zLnNvcnQgPSBKU09OLnN0cmluZ2lmeShvcHRpb25zLnNvcnQpXG4gICAgcGFyYW1zLmxpbWl0ID0gMVxuICAgIHBhcmFtcy5jbGllbnQgPSBAY2xpZW50XG4gICAgcGFyYW1zLnNlbGVjdG9yID0gSlNPTi5zdHJpbmdpZnkoc2VsZWN0b3IgfHwge30pXG5cbiAgICByZXEgPSAkLmdldEpTT04oQHVybCwgcGFyYW1zKVxuICAgIHJlcS5kb25lIChkYXRhLCB0ZXh0U3RhdHVzLCBqcVhIUikgPT5cbiAgICAgIHN1Y2Nlc3MoZGF0YVswXSB8fCBudWxsKVxuICAgIHJlcS5mYWlsIChqcVhIUiwgdGV4dFN0YXR1cywgZXJyb3JUaHJvd24pID0+XG4gICAgICBpZiBlcnJvclxuICAgICAgICBlcnJvcihlcnJvclRocm93bilcblxuICB1cHNlcnQ6IChkb2MsIHN1Y2Nlc3MsIGVycm9yKSAtPlxuICAgIGlmIG5vdCBkb2MuX2lkXG4gICAgICBkb2MuX2lkID0gY3JlYXRlVWlkKClcblxuICAgIHJlcSA9ICQuYWpheChAdXJsICsgXCI/Y2xpZW50PVwiICsgQGNsaWVudCwge1xuICAgICAgZGF0YSA6IEpTT04uc3RyaW5naWZ5KGRvYyksXG4gICAgICBjb250ZW50VHlwZSA6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgIHR5cGUgOiAnUE9TVCd9KVxuICAgIHJlcS5kb25lIChkYXRhLCB0ZXh0U3RhdHVzLCBqcVhIUikgPT5cbiAgICAgIHN1Y2Nlc3MoZGF0YSB8fCBudWxsKVxuICAgIHJlcS5mYWlsIChqcVhIUiwgdGV4dFN0YXR1cywgZXJyb3JUaHJvd24pID0+XG4gICAgICBpZiBlcnJvclxuICAgICAgICBlcnJvcihlcnJvclRocm93bilcblxuICByZW1vdmU6IChpZCwgc3VjY2VzcywgZXJyb3IpIC0+XG4gICAgcmVxID0gJC5hamF4KEB1cmwgKyBcIi9cIiArIGlkICsgXCI/Y2xpZW50PVwiICsgQGNsaWVudCwgeyB0eXBlIDogJ0RFTEVURSd9KVxuICAgIHJlcS5kb25lIChkYXRhLCB0ZXh0U3RhdHVzLCBqcVhIUikgPT5cbiAgICAgIHN1Y2Nlc3MoKVxuICAgIHJlcS5mYWlsIChqcVhIUiwgdGV4dFN0YXR1cywgZXJyb3JUaHJvd24pID0+XG4gICAgICBpZiBqcVhIUi5zdGF0dXMgPT0gNDA0XG4gICAgICAgIHN1Y2Nlc3MoKVxuICAgICAgZWxzZSBpZiBlcnJvclxuICAgICAgICBlcnJvcihlcnJvclRocm93bilcblxuXG5jcmVhdGVVaWQgPSAtPiBcbiAgJ3h4eHh4eHh4eHh4eDR4eHh5eHh4eHh4eHh4eHh4eHh4Jy5yZXBsYWNlKC9beHldL2csIChjKSAtPlxuICAgIHIgPSBNYXRoLnJhbmRvbSgpKjE2fDBcbiAgICB2ID0gaWYgYyA9PSAneCcgdGhlbiByIGVsc2UgKHImMHgzfDB4OClcbiAgICByZXR1cm4gdi50b1N0cmluZygxNilcbiAgICkiLCJMb2NhdGlvbkZpbmRlciA9IHJlcXVpcmUgJy4vTG9jYXRpb25GaW5kZXInXG5HZW9KU09OID0gcmVxdWlyZSAnLi9HZW9KU09OJ1xuXG4jIFNob3dzIHRoZSByZWxhdGl2ZSBsb2NhdGlvbiBvZiBhIHBvaW50IGFuZCBhbGxvd3Mgc2V0dGluZyBpdFxuIyBGaXJlcyBldmVudHMgbG9jYXRpb25zZXQsIG1hcCwgYm90aCB3aXRoIFxuY2xhc3MgTG9jYXRpb25WaWV3IGV4dGVuZHMgQmFja2JvbmUuVmlld1xuICBjb25zdHJ1Y3RvcjogKG9wdGlvbnMpIC0+XG4gICAgc3VwZXIoKVxuICAgIEBsb2MgPSBvcHRpb25zLmxvY1xuICAgIEBzZXR0aW5nTG9jYXRpb24gPSBmYWxzZVxuICAgIEBsb2NhdGlvbkZpbmRlciA9IG9wdGlvbnMubG9jYXRpb25GaW5kZXIgfHwgbmV3IExvY2F0aW9uRmluZGVyKClcblxuICAgICMgTGlzdGVuIHRvIGxvY2F0aW9uIGV2ZW50c1xuICAgIEBsaXN0ZW5UbyhAbG9jYXRpb25GaW5kZXIsICdmb3VuZCcsIEBsb2NhdGlvbkZvdW5kKVxuICAgIEBsaXN0ZW5UbyhAbG9jYXRpb25GaW5kZXIsICdlcnJvcicsIEBsb2NhdGlvbkVycm9yKVxuXG4gICAgIyBTdGFydCB0cmFja2luZyBsb2NhdGlvbiBpZiBzZXRcbiAgICBpZiBAbG9jXG4gICAgICBAbG9jYXRpb25GaW5kZXIuc3RhcnRXYXRjaCgpXG5cbiAgICBAcmVuZGVyKClcblxuICBldmVudHM6XG4gICAgJ2NsaWNrICNsb2NhdGlvbl9tYXAnIDogJ21hcENsaWNrZWQnXG4gICAgJ2NsaWNrICNsb2NhdGlvbl9zZXQnIDogJ3NldExvY2F0aW9uJ1xuXG4gIHJlbW92ZTogLT5cbiAgICBAbG9jYXRpb25GaW5kZXIuc3RvcFdhdGNoKClcbiAgICBzdXBlcigpXG5cbiAgcmVuZGVyOiAtPlxuICAgIEAkZWwuaHRtbCB0ZW1wbGF0ZXNbJ0xvY2F0aW9uVmlldyddKClcblxuICAgICMgU2V0IGxvY2F0aW9uIHN0cmluZ1xuICAgIGlmIEBlcnJvckZpbmRpbmdMb2NhdGlvblxuICAgICAgQCQoXCIjbG9jYXRpb25fcmVsYXRpdmVcIikudGV4dChcIkNhbm5vdCBmaW5kIGxvY2F0aW9uXCIpXG4gICAgZWxzZSBpZiBub3QgQGxvYyBhbmQgbm90IEBzZXR0aW5nTG9jYXRpb24gXG4gICAgICBAJChcIiNsb2NhdGlvbl9yZWxhdGl2ZVwiKS50ZXh0KFwiVW5zcGVjaWZpZWQgbG9jYXRpb25cIilcbiAgICBlbHNlIGlmIEBzZXR0aW5nTG9jYXRpb25cbiAgICAgIEAkKFwiI2xvY2F0aW9uX3JlbGF0aXZlXCIpLnRleHQoXCJTZXR0aW5nIGxvY2F0aW9uLi4uXCIpXG4gICAgZWxzZSBpZiBub3QgQGN1cnJlbnRMb2NcbiAgICAgIEAkKFwiI2xvY2F0aW9uX3JlbGF0aXZlXCIpLnRleHQoXCJXYWl0aW5nIGZvciBHUFMuLi5cIilcbiAgICBlbHNlXG4gICAgICBAJChcIiNsb2NhdGlvbl9yZWxhdGl2ZVwiKS50ZXh0KEdlb0pTT04uZ2V0UmVsYXRpdmVMb2NhdGlvbihAY3VycmVudExvYywgQGxvYykpXG5cbiAgICAjIERpc2FibGUgbWFwIGlmIGxvY2F0aW9uIG5vdCBzZXRcbiAgICBAJChcIiNsb2NhdGlvbl9tYXBcIikuYXR0cihcImRpc2FibGVkXCIsIG5vdCBAbG9jKTtcblxuICAgICMgRGlzYWJsZSBzZXQgaWYgc2V0dGluZ1xuICAgIEAkKFwiI2xvY2F0aW9uX3NldFwiKS5hdHRyKFwiZGlzYWJsZWRcIiwgQHNldHRpbmdMb2NhdGlvbiA9PSB0cnVlKTsgICAgXG5cbiAgc2V0TG9jYXRpb246IC0+XG4gICAgQHNldHRpbmdMb2NhdGlvbiA9IHRydWVcbiAgICBAZXJyb3JGaW5kaW5nTG9jYXRpb24gPSBmYWxzZVxuICAgIEBsb2NhdGlvbkZpbmRlci5zdGFydFdhdGNoKClcbiAgICBAcmVuZGVyKClcblxuICBsb2NhdGlvbkZvdW5kOiAocG9zKSA9PlxuICAgIGlmIEBzZXR0aW5nTG9jYXRpb25cbiAgICAgIEBzZXR0aW5nTG9jYXRpb24gPSBmYWxzZVxuICAgICAgQGVycm9yRmluZGluZ0xvY2F0aW9uID0gZmFsc2VcblxuICAgICAgIyBTZXQgbG9jYXRpb25cbiAgICAgIEBsb2MgPSBHZW9KU09OLnBvc1RvUG9pbnQocG9zKVxuICAgICAgQHRyaWdnZXIoJ2xvY2F0aW9uc2V0JywgQGxvYylcblxuICAgIEBjdXJyZW50TG9jID0gR2VvSlNPTi5wb3NUb1BvaW50KHBvcylcbiAgICBAcmVuZGVyKClcblxuICBsb2NhdGlvbkVycm9yOiA9PlxuICAgIEBzZXR0aW5nTG9jYXRpb24gPSBmYWxzZVxuICAgIEBlcnJvckZpbmRpbmdMb2NhdGlvbiA9IHRydWVcbiAgICBAcmVuZGVyKClcblxuICBtYXBDbGlja2VkOiA9PlxuICAgIEB0cmlnZ2VyKCdtYXAnLCBAbG9jKVxuXG5cbm1vZHVsZS5leHBvcnRzID0gTG9jYXRpb25WaWV3IiwiY29tcGlsZURvY3VtZW50U2VsZWN0b3IgPSByZXF1aXJlKCcuL3NlbGVjdG9yJykuY29tcGlsZURvY3VtZW50U2VsZWN0b3JcbmNvbXBpbGVTb3J0ID0gcmVxdWlyZSgnLi9zZWxlY3RvcicpLmNvbXBpbGVTb3J0XG5HZW9KU09OID0gcmVxdWlyZSAnLi4vR2VvSlNPTidcblxuY2xhc3MgTG9jYWxEYlxuICBjb25zdHJ1Y3RvcjogKG5hbWUsIG9wdGlvbnMpIC0+XG4gICAgQG5hbWUgPSBuYW1lXG4gICAgQGNvbGxlY3Rpb25zID0ge31cblxuICAgIGlmIG9wdGlvbnMgYW5kIG9wdGlvbnMubmFtZXNwYWNlIGFuZCB3aW5kb3cubG9jYWxTdG9yYWdlXG4gICAgICBAbmFtZXNwYWNlID0gb3B0aW9ucy5uYW1lc3BhY2VcblxuICBhZGRDb2xsZWN0aW9uOiAobmFtZSkgLT5cbiAgICAjIFNldCBuYW1lc3BhY2UgZm9yIGNvbGxlY3Rpb25cbiAgICBuYW1lc3BhY2UgPSBAbmFtZXNwYWNlK1wiLlwiK25hbWUgaWYgQG5hbWVzcGFjZVxuXG4gICAgY29sbGVjdGlvbiA9IG5ldyBDb2xsZWN0aW9uKG5hbWUsIG5hbWVzcGFjZSlcbiAgICBAW25hbWVdID0gY29sbGVjdGlvblxuICAgIEBjb2xsZWN0aW9uc1tuYW1lXSA9IGNvbGxlY3Rpb25cblxuICByZW1vdmVDb2xsZWN0aW9uOiAobmFtZSkgLT5cbiAgICBpZiBAbmFtZXNwYWNlIGFuZCB3aW5kb3cubG9jYWxTdG9yYWdlXG4gICAgICBrZXlzID0gW11cbiAgICAgIGZvciBpIGluIFswLi4ubG9jYWxTdG9yYWdlLmxlbmd0aF1cbiAgICAgICAga2V5cy5wdXNoKGxvY2FsU3RvcmFnZS5rZXkoaSkpXG5cbiAgICAgIGZvciBrZXkgaW4ga2V5c1xuICAgICAgICBpZiBrZXkuc3Vic3RyaW5nKDAsIEBuYW1lc3BhY2UubGVuZ3RoICsgMSkgPT0gQG5hbWVzcGFjZSArIFwiLlwiXG4gICAgICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oa2V5KVxuXG4gICAgZGVsZXRlIEBbbmFtZV1cbiAgICBkZWxldGUgQGNvbGxlY3Rpb25zW25hbWVdXG5cblxuIyBTdG9yZXMgZGF0YSBpbiBtZW1vcnksIG9wdGlvbmFsbHkgYmFja2VkIGJ5IGxvY2FsIHN0b3JhZ2VcbmNsYXNzIENvbGxlY3Rpb25cbiAgY29uc3RydWN0b3I6IChuYW1lLCBuYW1lc3BhY2UpIC0+XG4gICAgQG5hbWUgPSBuYW1lXG4gICAgQG5hbWVzcGFjZSA9IG5hbWVzcGFjZVxuXG4gICAgQGl0ZW1zID0ge31cbiAgICBAdXBzZXJ0cyA9IHt9ICAjIFBlbmRpbmcgdXBzZXJ0cyBieSBfaWQuIFN0aWxsIGluIGl0ZW1zXG4gICAgQHJlbW92ZXMgPSB7fSAgIyBQZW5kaW5nIHJlbW92ZXMgYnkgX2lkLiBObyBsb25nZXIgaW4gaXRlbXNcblxuICAgICMgUmVhZCBmcm9tIGxvY2FsIHN0b3JhZ2VcbiAgICBpZiB3aW5kb3cubG9jYWxTdG9yYWdlIGFuZCBuYW1lc3BhY2U/XG4gICAgICBAbG9hZFN0b3JhZ2UoKVxuXG4gIGxvYWRTdG9yYWdlOiAtPlxuICAgICMgUmVhZCBpdGVtcyBmcm9tIGxvY2FsU3RvcmFnZVxuICAgIEBpdGVtTmFtZXNwYWNlID0gQG5hbWVzcGFjZSArIFwiX1wiXG5cbiAgICBmb3IgaSBpbiBbMC4uLmxvY2FsU3RvcmFnZS5sZW5ndGhdXG4gICAgICBrZXkgPSBsb2NhbFN0b3JhZ2Uua2V5KGkpXG4gICAgICBpZiBrZXkuc3Vic3RyaW5nKDAsIEBpdGVtTmFtZXNwYWNlLmxlbmd0aCkgPT0gQGl0ZW1OYW1lc3BhY2VcbiAgICAgICAgaXRlbSA9IEpTT04ucGFyc2UobG9jYWxTdG9yYWdlW2tleV0pXG4gICAgICAgIEBpdGVtc1tpdGVtLl9pZF0gPSBpdGVtXG5cbiAgICAjIFJlYWQgdXBzZXJ0c1xuICAgIHVwc2VydEtleXMgPSBpZiBsb2NhbFN0b3JhZ2VbQG5hbWVzcGFjZStcInVwc2VydHNcIl0gdGhlbiBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZVtAbmFtZXNwYWNlK1widXBzZXJ0c1wiXSkgZWxzZSBbXVxuICAgIGZvciBrZXkgaW4gdXBzZXJ0S2V5c1xuICAgICAgQHVwc2VydHNba2V5XSA9IEBpdGVtc1trZXldXG5cbiAgICAjIFJlYWQgcmVtb3Zlc1xuICAgIHJlbW92ZUl0ZW1zID0gaWYgbG9jYWxTdG9yYWdlW0BuYW1lc3BhY2UrXCJyZW1vdmVzXCJdIHRoZW4gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2VbQG5hbWVzcGFjZStcInJlbW92ZXNcIl0pIGVsc2UgW11cbiAgICBAcmVtb3ZlcyA9IF8ub2JqZWN0KF8ucGx1Y2socmVtb3ZlSXRlbXMsIFwiX2lkXCIpLCByZW1vdmVJdGVtcylcblxuICBmaW5kOiAoc2VsZWN0b3IsIG9wdGlvbnMpIC0+XG4gICAgcmV0dXJuIGZldGNoOiAoc3VjY2VzcywgZXJyb3IpID0+XG4gICAgICBAX2ZpbmRGZXRjaChzZWxlY3Rvciwgb3B0aW9ucywgc3VjY2VzcywgZXJyb3IpXG5cbiAgZmluZE9uZTogKHNlbGVjdG9yLCBvcHRpb25zLCBzdWNjZXNzLCBlcnJvcikgLT5cbiAgICBpZiBfLmlzRnVuY3Rpb24ob3B0aW9ucykgXG4gICAgICBbb3B0aW9ucywgc3VjY2VzcywgZXJyb3JdID0gW3t9LCBvcHRpb25zLCBzdWNjZXNzXVxuXG4gICAgQGZpbmQoc2VsZWN0b3IsIG9wdGlvbnMpLmZldGNoIChyZXN1bHRzKSAtPlxuICAgICAgaWYgc3VjY2Vzcz8gdGhlbiBzdWNjZXNzKGlmIHJlc3VsdHMubGVuZ3RoPjAgdGhlbiByZXN1bHRzWzBdIGVsc2UgbnVsbClcbiAgICAsIGVycm9yXG5cbiAgX2ZpbmRGZXRjaDogKHNlbGVjdG9yLCBvcHRpb25zLCBzdWNjZXNzLCBlcnJvcikgLT5cbiAgICBmaWx0ZXJlZCA9IF8uZmlsdGVyKF8udmFsdWVzKEBpdGVtcyksIGNvbXBpbGVEb2N1bWVudFNlbGVjdG9yKHNlbGVjdG9yKSlcblxuICAgICMgSGFuZGxlIGdlb3NwYXRpYWwgb3BlcmF0b3JzXG4gICAgZmlsdGVyZWQgPSBwcm9jZXNzTmVhck9wZXJhdG9yKHNlbGVjdG9yLCBmaWx0ZXJlZClcbiAgICBmaWx0ZXJlZCA9IHByb2Nlc3NHZW9JbnRlcnNlY3RzT3BlcmF0b3Ioc2VsZWN0b3IsIGZpbHRlcmVkKVxuXG4gICAgaWYgb3B0aW9ucyBhbmQgb3B0aW9ucy5zb3J0IFxuICAgICAgZmlsdGVyZWQuc29ydChjb21waWxlU29ydChvcHRpb25zLnNvcnQpKVxuXG4gICAgaWYgb3B0aW9ucyBhbmQgb3B0aW9ucy5saW1pdFxuICAgICAgZmlsdGVyZWQgPSBfLmZpcnN0IGZpbHRlcmVkLCBvcHRpb25zLmxpbWl0XG5cbiAgICAjIENsb25lIHRvIHByZXZlbnQgYWNjaWRlbnRhbCB1cGRhdGVzXG4gICAgZmlsdGVyZWQgPSBfLm1hcCBmaWx0ZXJlZCwgKGRvYykgLT4gXy5jbG9uZURlZXAoZG9jKVxuICAgIGlmIHN1Y2Nlc3M/IHRoZW4gc3VjY2VzcyhmaWx0ZXJlZClcblxuICB1cHNlcnQ6IChkb2MsIHN1Y2Nlc3MsIGVycm9yKSAtPlxuICAgIGlmIG5vdCBkb2MuX2lkXG4gICAgICBkb2MuX2lkID0gY3JlYXRlVWlkKClcblxuICAgICMgUmVwbGFjZS9hZGQgXG4gICAgQF9wdXRJdGVtKGRvYylcbiAgICBAX3B1dFVwc2VydChkb2MpXG5cbiAgICBpZiBzdWNjZXNzPyB0aGVuIHN1Y2Nlc3MoZG9jKVxuXG4gIHJlbW92ZTogKGlkLCBzdWNjZXNzLCBlcnJvcikgLT5cbiAgICBpZiBfLmhhcyhAaXRlbXMsIGlkKVxuICAgICAgQF9wdXRSZW1vdmUoQGl0ZW1zW2lkXSlcbiAgICAgIEBfZGVsZXRlSXRlbShpZClcbiAgICAgIEBfZGVsZXRlVXBzZXJ0KGlkKVxuXG4gICAgaWYgc3VjY2Vzcz8gdGhlbiBzdWNjZXNzKClcblxuICBfcHV0SXRlbTogKGRvYykgLT5cbiAgICBAaXRlbXNbZG9jLl9pZF0gPSBkb2NcbiAgICBpZiBAbmFtZXNwYWNlXG4gICAgICBsb2NhbFN0b3JhZ2VbQGl0ZW1OYW1lc3BhY2UgKyBkb2MuX2lkXSA9IEpTT04uc3RyaW5naWZ5KGRvYylcblxuICBfZGVsZXRlSXRlbTogKGlkKSAtPlxuICAgIGRlbGV0ZSBAaXRlbXNbaWRdXG4gICAgaWYgQG5hbWVzcGFjZVxuICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oQGl0ZW1OYW1lc3BhY2UgKyBpZClcblxuICBfcHV0VXBzZXJ0OiAoZG9jKSAtPlxuICAgIEB1cHNlcnRzW2RvYy5faWRdID0gZG9jXG4gICAgaWYgQG5hbWVzcGFjZVxuICAgICAgbG9jYWxTdG9yYWdlW0BuYW1lc3BhY2UrXCJ1cHNlcnRzXCJdID0gSlNPTi5zdHJpbmdpZnkoXy5rZXlzKEB1cHNlcnRzKSlcblxuICBfZGVsZXRlVXBzZXJ0OiAoaWQpIC0+XG4gICAgZGVsZXRlIEB1cHNlcnRzW2lkXVxuICAgIGlmIEBuYW1lc3BhY2VcbiAgICAgIGxvY2FsU3RvcmFnZVtAbmFtZXNwYWNlK1widXBzZXJ0c1wiXSA9IEpTT04uc3RyaW5naWZ5KF8ua2V5cyhAdXBzZXJ0cykpXG5cbiAgX3B1dFJlbW92ZTogKGRvYykgLT5cbiAgICBAcmVtb3Zlc1tkb2MuX2lkXSA9IGRvY1xuICAgIGlmIEBuYW1lc3BhY2VcbiAgICAgIGxvY2FsU3RvcmFnZVtAbmFtZXNwYWNlK1wicmVtb3Zlc1wiXSA9IEpTT04uc3RyaW5naWZ5KF8udmFsdWVzKEByZW1vdmVzKSlcblxuICBfZGVsZXRlUmVtb3ZlOiAoaWQpIC0+XG4gICAgZGVsZXRlIEByZW1vdmVzW2lkXVxuICAgIGlmIEBuYW1lc3BhY2VcbiAgICAgIGxvY2FsU3RvcmFnZVtAbmFtZXNwYWNlK1wicmVtb3Zlc1wiXSA9IEpTT04uc3RyaW5naWZ5KF8udmFsdWVzKEByZW1vdmVzKSlcblxuICBjYWNoZTogKGRvY3MsIHNlbGVjdG9yLCBvcHRpb25zLCBzdWNjZXNzLCBlcnJvcikgLT5cbiAgICAjIEFkZCBhbGwgbm9uLWxvY2FsIHRoYXQgYXJlIG5vdCB1cHNlcnRlZCBvciByZW1vdmVkXG4gICAgZm9yIGRvYyBpbiBkb2NzXG4gICAgICBpZiBub3QgXy5oYXMoQHVwc2VydHMsIGRvYy5faWQpIGFuZCBub3QgXy5oYXMoQHJlbW92ZXMsIGRvYy5faWQpXG4gICAgICAgIEBfcHV0SXRlbShkb2MpXG5cbiAgICBkb2NzTWFwID0gXy5vYmplY3QoXy5wbHVjayhkb2NzLCBcIl9pZFwiKSwgZG9jcylcblxuICAgIGlmIG9wdGlvbnMuc29ydFxuICAgICAgc29ydCA9IGNvbXBpbGVTb3J0KG9wdGlvbnMuc29ydClcblxuICAgICMgUGVyZm9ybSBxdWVyeSwgcmVtb3Zpbmcgcm93cyBtaXNzaW5nIGluIGRvY3MgZnJvbSBsb2NhbCBkYiBcbiAgICBAZmluZChzZWxlY3Rvciwgb3B0aW9ucykuZmV0Y2ggKHJlc3VsdHMpID0+XG4gICAgICBmb3IgcmVzdWx0IGluIHJlc3VsdHNcbiAgICAgICAgaWYgbm90IGRvY3NNYXBbcmVzdWx0Ll9pZF0gYW5kIG5vdCBfLmhhcyhAdXBzZXJ0cywgcmVzdWx0Ll9pZClcbiAgICAgICAgICAjIElmIHBhc3QgZW5kIG9uIHNvcnRlZCBsaW1pdGVkLCBpZ25vcmVcbiAgICAgICAgICBpZiBvcHRpb25zLnNvcnQgYW5kIG9wdGlvbnMubGltaXQgYW5kIGRvY3MubGVuZ3RoID09IG9wdGlvbnMubGltaXRcbiAgICAgICAgICAgIGlmIHNvcnQocmVzdWx0LCBfLmxhc3QoZG9jcykpID49IDBcbiAgICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICBAX2RlbGV0ZUl0ZW0ocmVzdWx0Ll9pZClcblxuICAgICAgaWYgc3VjY2Vzcz8gdGhlbiBzdWNjZXNzKCkgIFxuICAgICwgZXJyb3JcbiAgICBcbiAgcGVuZGluZ1Vwc2VydHM6IChzdWNjZXNzKSAtPlxuICAgIHN1Y2Nlc3MgXy52YWx1ZXMoQHVwc2VydHMpXG5cbiAgcGVuZGluZ1JlbW92ZXM6IChzdWNjZXNzKSAtPlxuICAgIHN1Y2Nlc3MgXy5wbHVjayhAcmVtb3ZlcywgXCJfaWRcIilcblxuICByZXNvbHZlVXBzZXJ0OiAoZG9jLCBzdWNjZXNzKSAtPlxuICAgIGlmIEB1cHNlcnRzW2RvYy5faWRdIGFuZCBfLmlzRXF1YWwoZG9jLCBAdXBzZXJ0c1tkb2MuX2lkXSlcbiAgICAgIEBfZGVsZXRlVXBzZXJ0KGRvYy5faWQpXG4gICAgaWYgc3VjY2Vzcz8gdGhlbiBzdWNjZXNzKClcblxuICByZXNvbHZlUmVtb3ZlOiAoaWQsIHN1Y2Nlc3MpIC0+XG4gICAgQF9kZWxldGVSZW1vdmUoaWQpXG4gICAgaWYgc3VjY2Vzcz8gdGhlbiBzdWNjZXNzKClcblxuICAjIEFkZCBidXQgZG8gbm90IG92ZXJ3cml0ZSBvciByZWNvcmQgYXMgdXBzZXJ0XG4gIHNlZWQ6IChkb2MsIHN1Y2Nlc3MpIC0+XG4gICAgaWYgbm90IF8uaGFzKEBpdGVtcywgZG9jLl9pZCkgYW5kIG5vdCBfLmhhcyhAcmVtb3ZlcywgZG9jLl9pZClcbiAgICAgIEBfcHV0SXRlbShkb2MpXG4gICAgaWYgc3VjY2Vzcz8gdGhlbiBzdWNjZXNzKClcblxuXG5jcmVhdGVVaWQgPSAtPiBcbiAgJ3h4eHh4eHh4eHh4eDR4eHh5eHh4eHh4eHh4eHh4eHh4Jy5yZXBsYWNlKC9beHldL2csIChjKSAtPlxuICAgIHIgPSBNYXRoLnJhbmRvbSgpKjE2fDBcbiAgICB2ID0gaWYgYyA9PSAneCcgdGhlbiByIGVsc2UgKHImMHgzfDB4OClcbiAgICByZXR1cm4gdi50b1N0cmluZygxNilcbiAgIClcblxucHJvY2Vzc05lYXJPcGVyYXRvciA9IChzZWxlY3RvciwgbGlzdCkgLT5cbiAgZm9yIGtleSwgdmFsdWUgb2Ygc2VsZWN0b3JcbiAgICBpZiB2YWx1ZT8gYW5kIHZhbHVlWyckbmVhciddXG4gICAgICBnZW8gPSB2YWx1ZVsnJG5lYXInXVsnJGdlb21ldHJ5J11cbiAgICAgIGlmIGdlby50eXBlICE9ICdQb2ludCdcbiAgICAgICAgYnJlYWtcblxuICAgICAgbmVhciA9IG5ldyBMLkxhdExuZyhnZW8uY29vcmRpbmF0ZXNbMV0sIGdlby5jb29yZGluYXRlc1swXSlcblxuICAgICAgbGlzdCA9IF8uZmlsdGVyIGxpc3QsIChkb2MpIC0+XG4gICAgICAgIHJldHVybiBkb2Nba2V5XSBhbmQgZG9jW2tleV0udHlwZSA9PSAnUG9pbnQnXG5cbiAgICAgICMgR2V0IGRpc3RhbmNlc1xuICAgICAgZGlzdGFuY2VzID0gXy5tYXAgbGlzdCwgKGRvYykgLT5cbiAgICAgICAgcmV0dXJuIHsgZG9jOiBkb2MsIGRpc3RhbmNlOiBcbiAgICAgICAgICBuZWFyLmRpc3RhbmNlVG8obmV3IEwuTGF0TG5nKGRvY1trZXldLmNvb3JkaW5hdGVzWzFdLCBkb2Nba2V5XS5jb29yZGluYXRlc1swXSkpXG4gICAgICAgIH1cblxuICAgICAgIyBGaWx0ZXIgbm9uLXBvaW50c1xuICAgICAgZGlzdGFuY2VzID0gXy5maWx0ZXIgZGlzdGFuY2VzLCAoaXRlbSkgLT4gaXRlbS5kaXN0YW5jZSA+PSAwXG5cbiAgICAgICMgU29ydCBieSBkaXN0YW5jZVxuICAgICAgZGlzdGFuY2VzID0gXy5zb3J0QnkgZGlzdGFuY2VzLCAnZGlzdGFuY2UnXG5cbiAgICAgICMgRmlsdGVyIGJ5IG1heERpc3RhbmNlXG4gICAgICBpZiB2YWx1ZVsnJG5lYXInXVsnJG1heERpc3RhbmNlJ11cbiAgICAgICAgZGlzdGFuY2VzID0gXy5maWx0ZXIgZGlzdGFuY2VzLCAoaXRlbSkgLT4gaXRlbS5kaXN0YW5jZSA8PSB2YWx1ZVsnJG5lYXInXVsnJG1heERpc3RhbmNlJ11cblxuICAgICAgIyBMaW1pdCB0byAxMDBcbiAgICAgIGRpc3RhbmNlcyA9IF8uZmlyc3QgZGlzdGFuY2VzLCAxMDBcblxuICAgICAgIyBFeHRyYWN0IGRvY3NcbiAgICAgIGxpc3QgPSBfLnBsdWNrIGRpc3RhbmNlcywgJ2RvYydcbiAgcmV0dXJuIGxpc3RcblxucHJvY2Vzc0dlb0ludGVyc2VjdHNPcGVyYXRvciA9IChzZWxlY3RvciwgbGlzdCkgLT5cbiAgZm9yIGtleSwgdmFsdWUgb2Ygc2VsZWN0b3JcbiAgICBpZiB2YWx1ZT8gYW5kIHZhbHVlWyckZ2VvSW50ZXJzZWN0cyddXG4gICAgICBnZW8gPSB2YWx1ZVsnJGdlb0ludGVyc2VjdHMnXVsnJGdlb21ldHJ5J11cbiAgICAgIGlmIGdlby50eXBlICE9ICdQb2x5Z29uJ1xuICAgICAgICBicmVha1xuXG4gICAgICAjIENoZWNrIHdpdGhpbiBmb3IgZWFjaFxuICAgICAgbGlzdCA9IF8uZmlsdGVyIGxpc3QsIChkb2MpIC0+XG4gICAgICAgICMgUmVqZWN0IG5vbi1wb2ludHNcbiAgICAgICAgaWYgbm90IGRvY1trZXldIG9yIGRvY1trZXldLnR5cGUgIT0gJ1BvaW50J1xuICAgICAgICAgIHJldHVybiBmYWxzZVxuXG4gICAgICAgICMgQ2hlY2sgcG9seWdvblxuICAgICAgICByZXR1cm4gR2VvSlNPTi5wb2ludEluUG9seWdvbihkb2Nba2V5XSwgZ2VvKVxuXG4gIHJldHVybiBsaXN0XG5cbm1vZHVsZS5leHBvcnRzID0gTG9jYWxEYlxuIiwiUGFnZSA9IHJlcXVpcmUgXCIuLi9QYWdlXCJcblxuIyBEaXNwbGF5cyBhbiBpbWFnZS4gT3B0aW9uczogdWlkOiB1aWQgb2YgaW1hZ2Vcbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgSW1hZ2VQYWdlIGV4dGVuZHMgUGFnZVxuICBjcmVhdGU6IC0+XG4gICAgQCRlbC5odG1sIHRlbXBsYXRlc1sncGFnZXMvSW1hZ2VQYWdlJ10oKVxuXG4gICAgIyBHZXQgaW1hZ2UgdXJsXG4gICAgQGltYWdlTWFuYWdlci5nZXRJbWFnZVVybChAb3B0aW9ucy5pZCwgKHVybCkgPT5cbiAgICAgIEAkKFwiI21lc3NhZ2VfYmFyXCIpLmhpZGUoKVxuICAgICAgQCQoXCIjaW1hZ2VcIikuYXR0cihcInNyY1wiLCB1cmwpLnNob3coKVxuICAgICwgQGVycm9yKVxuXG4gIGFjdGl2YXRlOiAtPlxuICAgIEBzZXRUaXRsZSBcIkltYWdlXCJcblxuICAgICMgSWYgcmVtb3ZlIGFsbG93ZWQsIHNldCBpbiBidXR0b24gYmFyXG4gICAgaWYgQG9wdGlvbnMub25SZW1vdmVcbiAgICAgIEBzZXR1cEJ1dHRvbkJhciBbXG4gICAgICAgIHsgaWNvbjogXCJkZWxldGUucG5nXCIsIGNsaWNrOiA9PiBAcmVtb3ZlUGhvdG8oKSB9XG4gICAgICBdXG4gICAgZWxzZVxuICAgICAgQHNldHVwQnV0dG9uQmFyIFtdXG5cbiAgcmVtb3ZlUGhvdG86IC0+XG4gICAgaWYgY29uZmlybShcIlJlbW92ZSBpbWFnZT9cIilcbiAgICAgIEBvcHRpb25zLm9uUmVtb3ZlKClcbiAgICAgIEBwYWdlci5jbG9zZVBhZ2UoKVxuIiwiZXhwb3J0cy5TZWN0aW9ucyA9IEJhY2tib25lLlZpZXcuZXh0ZW5kKHtcbiAgICBjbGFzc05hbWUgOiBcInN1cnZleVwiLFxuXG4gICAgaW5pdGlhbGl6ZSA6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnRpdGxlID0gdGhpcy5vcHRpb25zLnRpdGxlO1xuICAgICAgICB0aGlzLnNlY3Rpb25zID0gdGhpcy5vcHRpb25zLnNlY3Rpb25zO1xuICAgICAgICB0aGlzLnJlbmRlcigpO1xuXG4gICAgICAgIC8vIEFkanVzdCBuZXh0L3ByZXYgYmFzZWQgb24gbW9kZWxcbiAgICAgICAgdGhpcy5tb2RlbC5vbihcImNoYW5nZVwiLCB0aGlzLnJlbmRlck5leHRQcmV2LCB0aGlzKTtcblxuICAgICAgICAvLyBHbyB0byBhcHByb3ByaWF0ZSBzZWN0aW9uIFRPRE9cbiAgICAgICAgdGhpcy5zaG93U2VjdGlvbigwKTtcbiAgICB9LFxuXG4gICAgZXZlbnRzIDoge1xuICAgICAgICBcImNsaWNrIC5uZXh0XCIgOiBcIm5leHRTZWN0aW9uXCIsXG4gICAgICAgIFwiY2xpY2sgLnByZXZcIiA6IFwicHJldlNlY3Rpb25cIixcbiAgICAgICAgXCJjbGljayAuZmluaXNoXCIgOiBcImZpbmlzaFwiLFxuICAgICAgICBcImNsaWNrIGEuc2VjdGlvbi1jcnVtYlwiIDogXCJjcnVtYlNlY3Rpb25cIlxuICAgIH0sXG5cbiAgICBmaW5pc2ggOiBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gVmFsaWRhdGUgY3VycmVudCBzZWN0aW9uXG4gICAgICAgIHZhciBzZWN0aW9uID0gdGhpcy5zZWN0aW9uc1t0aGlzLnNlY3Rpb25dO1xuICAgICAgICBpZiAoc2VjdGlvbi52YWxpZGF0ZSgpKSB7XG4gICAgICAgICAgICB0aGlzLnRyaWdnZXIoJ2NvbXBsZXRlJyk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgY3J1bWJTZWN0aW9uIDogZnVuY3Rpb24oZSkge1xuICAgICAgICAvLyBHbyB0byBzZWN0aW9uXG4gICAgICAgIHZhciBpbmRleCA9IHBhcnNlSW50KGUudGFyZ2V0LmdldEF0dHJpYnV0ZShcImRhdGEtdmFsdWVcIikpO1xuICAgICAgICB0aGlzLnNob3dTZWN0aW9uKGluZGV4KTtcbiAgICB9LFxuXG4gICAgZ2V0TmV4dFNlY3Rpb25JbmRleCA6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgaSA9IHRoaXMuc2VjdGlvbiArIDE7XG4gICAgICAgIHdoaWxlIChpIDwgdGhpcy5zZWN0aW9ucy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnNlY3Rpb25zW2ldLnNob3VsZEJlVmlzaWJsZSgpKVxuICAgICAgICAgICAgICAgIHJldHVybiBpO1xuICAgICAgICAgICAgaSsrO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGdldFByZXZTZWN0aW9uSW5kZXggOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGkgPSB0aGlzLnNlY3Rpb24gLSAxO1xuICAgICAgICB3aGlsZSAoaSA+PSAwKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5zZWN0aW9uc1tpXS5zaG91bGRCZVZpc2libGUoKSlcbiAgICAgICAgICAgICAgICByZXR1cm4gaTtcbiAgICAgICAgICAgIGktLTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBuZXh0U2VjdGlvbiA6IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBWYWxpZGF0ZSBjdXJyZW50IHNlY3Rpb25cbiAgICAgICAgdmFyIHNlY3Rpb24gPSB0aGlzLnNlY3Rpb25zW3RoaXMuc2VjdGlvbl07XG4gICAgICAgIGlmIChzZWN0aW9uLnZhbGlkYXRlKCkpIHtcbiAgICAgICAgICAgIHRoaXMuc2hvd1NlY3Rpb24odGhpcy5nZXROZXh0U2VjdGlvbkluZGV4KCkpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIHByZXZTZWN0aW9uIDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuc2hvd1NlY3Rpb24odGhpcy5nZXRQcmV2U2VjdGlvbkluZGV4KCkpO1xuICAgIH0sXG5cbiAgICBzaG93U2VjdGlvbiA6IGZ1bmN0aW9uKGluZGV4KSB7XG4gICAgICAgIHRoaXMuc2VjdGlvbiA9IGluZGV4O1xuXG4gICAgICAgIF8uZWFjaCh0aGlzLnNlY3Rpb25zLCBmdW5jdGlvbihzKSB7XG4gICAgICAgICAgICBzLiRlbC5oaWRlKCk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLnNlY3Rpb25zW2luZGV4XS4kZWwuc2hvdygpO1xuXG4gICAgICAgIC8vIFNldHVwIGJyZWFkY3J1bWJzXG4gICAgICAgIHZhciB2aXNpYmxlU2VjdGlvbnMgPSBfLmZpbHRlcihfLmZpcnN0KHRoaXMuc2VjdGlvbnMsIGluZGV4ICsgMSksIGZ1bmN0aW9uKHMpIHtcbiAgICAgICAgICAgIHJldHVybiBzLnNob3VsZEJlVmlzaWJsZSgpXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLiQoXCIuYnJlYWRjcnVtYlwiKS5odG1sKHRlbXBsYXRlc1snZm9ybXMvU2VjdGlvbnNfYnJlYWRjcnVtYnMnXSh7XG4gICAgICAgICAgICBzZWN0aW9ucyA6IF8uaW5pdGlhbCh2aXNpYmxlU2VjdGlvbnMpLFxuICAgICAgICAgICAgbGFzdFNlY3Rpb246IF8ubGFzdCh2aXNpYmxlU2VjdGlvbnMpXG4gICAgICAgIH0pKTtcbiAgICAgICAgXG4gICAgICAgIHRoaXMucmVuZGVyTmV4dFByZXYoKTtcblxuICAgICAgICAvLyBTY3JvbGwgaW50byB2aWV3XG4gICAgICAgIHRoaXMuJGVsLnNjcm9sbGludG92aWV3KCk7XG4gICAgfSxcbiAgICBcbiAgICByZW5kZXJOZXh0UHJldiA6IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBTZXR1cCBuZXh0L3ByZXYgYnV0dG9uc1xuICAgICAgICB0aGlzLiQoXCIucHJldlwiKS50b2dnbGUodGhpcy5nZXRQcmV2U2VjdGlvbkluZGV4KCkgIT09IHVuZGVmaW5lZCk7XG4gICAgICAgIHRoaXMuJChcIi5uZXh0XCIpLnRvZ2dsZSh0aGlzLmdldE5leHRTZWN0aW9uSW5kZXgoKSAhPT0gdW5kZWZpbmVkKTtcbiAgICAgICAgdGhpcy4kKFwiLmZpbmlzaFwiKS50b2dnbGUodGhpcy5nZXROZXh0U2VjdGlvbkluZGV4KCkgPT09IHVuZGVmaW5lZCk7XG4gICAgfSxcblxuICAgIHJlbmRlciA6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLiRlbC5odG1sKHRlbXBsYXRlc1snZm9ybXMvU2VjdGlvbnMnXSgpKTtcblxuICAgICAgICAvLyBBZGQgc2VjdGlvbnNcbiAgICAgICAgdmFyIHNlY3Rpb25zRWwgPSB0aGlzLiQoXCIuc2VjdGlvbnNcIik7XG4gICAgICAgIF8uZWFjaCh0aGlzLnNlY3Rpb25zLCBmdW5jdGlvbihzKSB7XG4gICAgICAgICAgICBzZWN0aW9uc0VsLmFwcGVuZChzLiRlbCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxufSk7XG5cbmV4cG9ydHMuU2VjdGlvbiA9IEJhY2tib25lLlZpZXcuZXh0ZW5kKHtcbiAgICBjbGFzc05hbWUgOiBcInNlY3Rpb25cIixcbiAgICB0ZW1wbGF0ZSA6IF8udGVtcGxhdGUoJzxkaXYgY2xhc3M9XCJjb250ZW50c1wiPjwvZGl2PicpLFxuXG4gICAgaW5pdGlhbGl6ZSA6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnRpdGxlID0gdGhpcy5vcHRpb25zLnRpdGxlO1xuICAgICAgICB0aGlzLmNvbnRlbnRzID0gdGhpcy5vcHRpb25zLmNvbnRlbnRzO1xuXG4gICAgICAgIC8vIEFsd2F5cyBpbnZpc2libGUgaW5pdGlhbGx5XG4gICAgICAgIHRoaXMuJGVsLmhpZGUoKTtcbiAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICB9LFxuXG4gICAgc2hvdWxkQmVWaXNpYmxlIDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICghdGhpcy5vcHRpb25zLmNvbmRpdGlvbmFsKVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIHJldHVybiB0aGlzLm9wdGlvbnMuY29uZGl0aW9uYWwodGhpcy5tb2RlbCk7XG4gICAgfSxcblxuICAgIHZhbGlkYXRlIDogZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIEdldCBhbGwgdmlzaWJsZSBpdGVtc1xuICAgICAgICB2YXIgaXRlbXMgPSBfLmZpbHRlcih0aGlzLmNvbnRlbnRzLCBmdW5jdGlvbihjKSB7XG4gICAgICAgICAgICByZXR1cm4gYy52aXNpYmxlICYmIGMudmFsaWRhdGU7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gIV8uYW55KF8ubWFwKGl0ZW1zLCBmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgICAgICByZXR1cm4gaXRlbS52YWxpZGF0ZSgpO1xuICAgICAgICB9KSk7XG4gICAgfSxcblxuICAgIHJlbmRlciA6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLiRlbC5odG1sKHRoaXMudGVtcGxhdGUodGhpcykpO1xuXG4gICAgICAgIC8vIEFkZCBjb250ZW50cyAocXVlc3Rpb25zLCBtb3N0bHkpXG4gICAgICAgIHZhciBjb250ZW50c0VsID0gdGhpcy4kKFwiLmNvbnRlbnRzXCIpO1xuICAgICAgICBfLmVhY2godGhpcy5jb250ZW50cywgZnVuY3Rpb24oYykge1xuICAgICAgICAgICAgY29udGVudHNFbC5hcHBlbmQoYy4kZWwpO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbn0pO1xuXG5leHBvcnRzLlF1ZXN0aW9uID0gQmFja2JvbmUuVmlldy5leHRlbmQoe1xuICAgIGNsYXNzTmFtZSA6IFwicXVlc3Rpb25cIixcblxuICAgIHRlbXBsYXRlIDogXy50ZW1wbGF0ZSgnPCUgaWYgKG9wdGlvbnMucHJvbXB0KSB7ICU+PGRpdiBjbGFzcz1cInByb21wdFwiPjwlPW9wdGlvbnMucHJvbXB0JT48JT1yZW5kZXJSZXF1aXJlZCgpJT48L2Rpdj48JSB9ICU+PGRpdiBjbGFzcz1cImFuc3dlclwiPjwvZGl2PjwlPXJlbmRlckhpbnQoKSU+JyksXG5cbiAgICByZW5kZXJSZXF1aXJlZCA6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5yZXF1aXJlZClcbiAgICAgICAgICAgIHJldHVybiAnJm5ic3A7PHNwYW4gY2xhc3M9XCJyZXF1aXJlZFwiPio8L3NwYW4+JztcbiAgICAgICAgcmV0dXJuICcnO1xuICAgIH0sXG5cbiAgICByZW5kZXJIaW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5oaW50KVxuICAgICAgICAgICAgcmV0dXJuIF8udGVtcGxhdGUoJzxkaXYgY2xhc3M9XCJtdXRlZFwiPjwlPWhpbnQlPjwvZGl2PicpKHtoaW50OiB0aGlzLm9wdGlvbnMuaGludH0pO1xuICAgIH0sXG5cbiAgICB2YWxpZGF0ZSA6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgdmFsO1xuXG4gICAgICAgIC8vIENoZWNrIHJlcXVpcmVkXG4gICAgICAgIGlmICh0aGlzLnJlcXVpcmVkKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5tb2RlbC5nZXQodGhpcy5pZCkgPT09IHVuZGVmaW5lZCB8fCB0aGlzLm1vZGVsLmdldCh0aGlzLmlkKSA9PT0gbnVsbCB8fCB0aGlzLm1vZGVsLmdldCh0aGlzLmlkKSA9PT0gXCJcIilcbiAgICAgICAgICAgICAgICB2YWwgPSBcIlJlcXVpcmVkXCI7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDaGVjayBpbnRlcm5hbCB2YWxpZGF0aW9uXG4gICAgICAgIGlmICghdmFsICYmIHRoaXMudmFsaWRhdGVJbnRlcm5hbCkge1xuICAgICAgICAgICAgdmFsID0gdGhpcy52YWxpZGF0ZUludGVybmFsKCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDaGVjayBjdXN0b20gdmFsaWRhdGlvblxuICAgICAgICBpZiAoIXZhbCAmJiB0aGlzLm9wdGlvbnMudmFsaWRhdGUpIHtcbiAgICAgICAgICAgIHZhbCA9IHRoaXMub3B0aW9ucy52YWxpZGF0ZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gU2hvdyB2YWxpZGF0aW9uIHJlc3VsdHMgVE9ET1xuICAgICAgICBpZiAodmFsKSB7XG4gICAgICAgICAgICB0aGlzLiRlbC5hZGRDbGFzcyhcImludmFsaWRcIik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLiRlbC5yZW1vdmVDbGFzcyhcImludmFsaWRcIik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdmFsO1xuICAgIH0sXG5cbiAgICB1cGRhdGVWaXNpYmlsaXR5IDogZnVuY3Rpb24oZSkge1xuICAgICAgICAvLyBzbGlkZVVwL3NsaWRlRG93blxuICAgICAgICBpZiAodGhpcy5zaG91bGRCZVZpc2libGUoKSAmJiAhdGhpcy52aXNpYmxlKVxuICAgICAgICAgICAgdGhpcy4kZWwuc2xpZGVEb3duKCk7XG4gICAgICAgIGlmICghdGhpcy5zaG91bGRCZVZpc2libGUoKSAmJiB0aGlzLnZpc2libGUpXG4gICAgICAgICAgICB0aGlzLiRlbC5zbGlkZVVwKCk7XG4gICAgICAgIHRoaXMudmlzaWJsZSA9IHRoaXMuc2hvdWxkQmVWaXNpYmxlKCk7XG4gICAgfSxcblxuICAgIHNob3VsZEJlVmlzaWJsZSA6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoIXRoaXMub3B0aW9ucy5jb25kaXRpb25hbClcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25zLmNvbmRpdGlvbmFsKHRoaXMubW9kZWwpO1xuICAgIH0sXG5cbiAgICBpbml0aWFsaXplIDogZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIEFkanVzdCB2aXNpYmlsaXR5IGJhc2VkIG9uIG1vZGVsXG4gICAgICAgIHRoaXMubW9kZWwub24oXCJjaGFuZ2VcIiwgdGhpcy51cGRhdGVWaXNpYmlsaXR5LCB0aGlzKTtcblxuICAgICAgICAvLyBSZS1yZW5kZXIgYmFzZWQgb24gbW9kZWwgY2hhbmdlc1xuICAgICAgICB0aGlzLm1vZGVsLm9uKFwiY2hhbmdlOlwiICsgdGhpcy5pZCwgdGhpcy5yZW5kZXIsIHRoaXMpO1xuXG4gICAgICAgIHRoaXMucmVxdWlyZWQgPSB0aGlzLm9wdGlvbnMucmVxdWlyZWQ7XG5cbiAgICAgICAgLy8gU2F2ZSBjb250ZXh0XG4gICAgICAgIHRoaXMuY3R4ID0gdGhpcy5vcHRpb25zLmN0eCB8fCB7fTtcblxuICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgIH0sXG5cbiAgICByZW5kZXIgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy4kZWwuaHRtbCh0aGlzLnRlbXBsYXRlKHRoaXMpKTtcblxuICAgICAgICAvLyBSZW5kZXIgYW5zd2VyXG4gICAgICAgIHRoaXMucmVuZGVyQW5zd2VyKHRoaXMuJChcIi5hbnN3ZXJcIikpO1xuXG4gICAgICAgIHRoaXMuJGVsLnRvZ2dsZSh0aGlzLnNob3VsZEJlVmlzaWJsZSgpKTtcbiAgICAgICAgdGhpcy52aXNpYmxlID0gdGhpcy5zaG91bGRCZVZpc2libGUoKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG59KTtcblxuZXhwb3J0cy5SYWRpb1F1ZXN0aW9uID0gZXhwb3J0cy5RdWVzdGlvbi5leHRlbmQoe1xuICAgIGV2ZW50cyA6IHtcbiAgICAgICAgXCJjaGVja2VkXCIgOiBcImNoZWNrZWRcIixcbiAgICB9LFxuXG4gICAgY2hlY2tlZCA6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgdmFyIGluZGV4ID0gcGFyc2VJbnQoZS50YXJnZXQuZ2V0QXR0cmlidXRlKFwiZGF0YS12YWx1ZVwiKSk7XG4gICAgICAgIHZhciB2YWx1ZSA9IHRoaXMub3B0aW9ucy5vcHRpb25zW2luZGV4XVswXTtcbiAgICAgICAgdGhpcy5tb2RlbC5zZXQodGhpcy5pZCwgdmFsdWUpO1xuICAgIH0sXG5cbiAgICByZW5kZXJBbnN3ZXIgOiBmdW5jdGlvbihhbnN3ZXJFbCkge1xuICAgICAgICBhbnN3ZXJFbC5odG1sKF8udGVtcGxhdGUoJzxkaXYgY2xhc3M9XCJyYWRpby1ncm91cFwiPjwlPXJlbmRlclJhZGlvT3B0aW9ucygpJT48L2Rpdj4nLCB0aGlzKSk7XG4gICAgfSxcblxuICAgIHJlbmRlclJhZGlvT3B0aW9ucyA6IGZ1bmN0aW9uKCkge1xuICAgICAgICBodG1sID0gXCJcIjtcbiAgICAgICAgdmFyIGk7XG4gICAgICAgIGZvciAoIGkgPSAwOyBpIDwgdGhpcy5vcHRpb25zLm9wdGlvbnMubGVuZ3RoOyBpKyspXG4gICAgICAgICAgICBodG1sICs9IF8udGVtcGxhdGUoJzxkaXYgY2xhc3M9XCJyYWRpby1idXR0b24gPCU9Y2hlY2tlZCU+XCIgZGF0YS12YWx1ZT1cIjwlPXBvc2l0aW9uJT5cIj48JT10ZXh0JT48L2Rpdj4nLCB7XG4gICAgICAgICAgICAgICAgcG9zaXRpb24gOiBpLFxuICAgICAgICAgICAgICAgIHRleHQgOiB0aGlzLm9wdGlvbnMub3B0aW9uc1tpXVsxXSxcbiAgICAgICAgICAgICAgICBjaGVja2VkIDogdGhpcy5tb2RlbC5nZXQodGhpcy5pZCkgPT09IHRoaXMub3B0aW9ucy5vcHRpb25zW2ldWzBdID8gXCJjaGVja2VkXCIgOiBcIlwiXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gaHRtbDtcbiAgICB9XG5cbn0pO1xuXG5leHBvcnRzLkNoZWNrUXVlc3Rpb24gPSBleHBvcnRzLlF1ZXN0aW9uLmV4dGVuZCh7XG4gICAgZXZlbnRzIDoge1xuICAgICAgICBcImNoZWNrZWRcIiA6IFwiY2hlY2tlZFwiLFxuICAgIH0sXG5cbiAgICBjaGVja2VkIDogZnVuY3Rpb24oZSkge1xuICAgICAgICAvLyBHZXQgY2hlY2tlZFxuICAgICAgICB0aGlzLm1vZGVsLnNldCh0aGlzLmlkLCB0aGlzLiQoXCIuY2hlY2tib3hcIikuaGFzQ2xhc3MoXCJjaGVja2VkXCIpKTtcbiAgICB9LFxuXG4gICAgcmVuZGVyQW5zd2VyIDogZnVuY3Rpb24oYW5zd2VyRWwpIHtcbiAgICAgICAgdmFyIGk7XG4gICAgICAgIGFuc3dlckVsLmFwcGVuZCgkKF8udGVtcGxhdGUoJzxkaXYgY2xhc3M9XCJjaGVja2JveCA8JT1jaGVja2VkJT5cIj48JT10ZXh0JT48L2Rpdj4nLCB7XG4gICAgICAgICAgICB0ZXh0IDogdGhpcy5vcHRpb25zLnRleHQsXG4gICAgICAgICAgICBjaGVja2VkIDogKHRoaXMubW9kZWwuZ2V0KHRoaXMuaWQpKSA/IFwiY2hlY2tlZFwiIDogXCJcIlxuICAgICAgICB9KSkpO1xuICAgIH1cblxufSk7XG5cblxuZXhwb3J0cy5NdWx0aWNoZWNrUXVlc3Rpb24gPSBleHBvcnRzLlF1ZXN0aW9uLmV4dGVuZCh7XG4gICAgZXZlbnRzIDoge1xuICAgICAgICBcImNoZWNrZWRcIiA6IFwiY2hlY2tlZFwiLFxuICAgIH0sXG5cbiAgICBjaGVja2VkIDogZnVuY3Rpb24oZSkge1xuICAgICAgICAvLyBHZXQgYWxsIGNoZWNrZWRcbiAgICAgICAgdmFyIHZhbHVlID0gW107XG4gICAgICAgIHZhciBvcHRzID0gdGhpcy5vcHRpb25zLm9wdGlvbnM7XG4gICAgICAgIHRoaXMuJChcIi5jaGVja2JveFwiKS5lYWNoKGZ1bmN0aW9uKGluZGV4KSB7XG4gICAgICAgICAgICBpZiAoJCh0aGlzKS5oYXNDbGFzcyhcImNoZWNrZWRcIikpXG4gICAgICAgICAgICAgICAgdmFsdWUucHVzaChvcHRzW2luZGV4XVswXSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLm1vZGVsLnNldCh0aGlzLmlkLCB2YWx1ZSk7XG4gICAgfSxcblxuICAgIHJlbmRlckFuc3dlciA6IGZ1bmN0aW9uKGFuc3dlckVsKSB7XG4gICAgICAgIHZhciBpO1xuICAgICAgICBmb3IgKCBpID0gMDsgaSA8IHRoaXMub3B0aW9ucy5vcHRpb25zLmxlbmd0aDsgaSsrKVxuICAgICAgICAgICAgYW5zd2VyRWwuYXBwZW5kKCQoXy50ZW1wbGF0ZSgnPGRpdiBjbGFzcz1cImNoZWNrYm94IDwlPWNoZWNrZWQlPlwiIGRhdGEtdmFsdWU9XCI8JT1wb3NpdGlvbiU+XCI+PCU9dGV4dCU+PC9kaXY+Jywge1xuICAgICAgICAgICAgICAgIHBvc2l0aW9uIDogaSxcbiAgICAgICAgICAgICAgICB0ZXh0IDogdGhpcy5vcHRpb25zLm9wdGlvbnNbaV1bMV0sXG4gICAgICAgICAgICAgICAgY2hlY2tlZCA6ICh0aGlzLm1vZGVsLmdldCh0aGlzLmlkKSAmJiBfLmNvbnRhaW5zKHRoaXMubW9kZWwuZ2V0KHRoaXMuaWQpLCB0aGlzLm9wdGlvbnMub3B0aW9uc1tpXVswXSkpID8gXCJjaGVja2VkXCIgOiBcIlwiXG4gICAgICAgICAgICB9KSkpO1xuICAgIH1cblxufSk7XG5cbmV4cG9ydHMuVGV4dFF1ZXN0aW9uID0gZXhwb3J0cy5RdWVzdGlvbi5leHRlbmQoe1xuICAgIHJlbmRlckFuc3dlciA6IGZ1bmN0aW9uKGFuc3dlckVsKSB7XG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMubXVsdGlsaW5lKSB7XG4gICAgICAgICAgICBhbnN3ZXJFbC5odG1sKF8udGVtcGxhdGUoJzx0ZXh0YXJlYSBzdHlsZT1cIndpZHRoOjkwJVwiLz4nLCB0aGlzKSk7IC8vIFRPRE8gbWFrZSB3aWR0aCBwcm9wZXJseVxuICAgICAgICAgICAgYW5zd2VyRWwuZmluZChcInRleHRhcmVhXCIpLnZhbCh0aGlzLm1vZGVsLmdldCh0aGlzLmlkKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhbnN3ZXJFbC5odG1sKF8udGVtcGxhdGUoJzxpbnB1dCB0eXBlPVwidGV4dFwiLz4nLCB0aGlzKSk7XG4gICAgICAgICAgICBhbnN3ZXJFbC5maW5kKFwiaW5wdXRcIikudmFsKHRoaXMubW9kZWwuZ2V0KHRoaXMuaWQpKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBldmVudHMgOiB7XG4gICAgICAgIFwiY2hhbmdlXCIgOiBcImNoYW5nZWRcIlxuICAgIH0sXG4gICAgY2hhbmdlZCA6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLm1vZGVsLnNldCh0aGlzLmlkLCB0aGlzLiQodGhpcy5vcHRpb25zLm11bHRpbGluZSA/IFwidGV4dGFyZWFcIiA6IFwiaW5wdXRcIikudmFsKCkpO1xuICAgIH1cblxufSk7XG4iLCIjIEdyb3VwIG9mIHF1ZXN0aW9ucyB3aGljaCB2YWxpZGF0ZSBhcyBhIHVuaXRcblxubW9kdWxlLmV4cG9ydHMgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZFxuICBpbml0aWFsaXplOiAtPlxuICAgIEBjb250ZW50cyA9IEBvcHRpb25zLmNvbnRlbnRzXG4gICAgQHJlbmRlcigpXG5cbiAgdmFsaWRhdGU6IC0+XG4gICAgIyBHZXQgYWxsIHZpc2libGUgaXRlbXNcbiAgICBpdGVtcyA9IF8uZmlsdGVyKEBjb250ZW50cywgKGMpIC0+XG4gICAgICBjLnZpc2libGUgYW5kIGMudmFsaWRhdGVcbiAgICApXG4gICAgcmV0dXJuIG5vdCBfLmFueShfLm1hcChpdGVtcywgKGl0ZW0pIC0+XG4gICAgICBpdGVtLnZhbGlkYXRlKClcbiAgICApKVxuXG4gIHJlbmRlcjogLT5cbiAgICBAJGVsLmh0bWwgXCJcIlxuICAgIFxuICAgICMgQWRkIGNvbnRlbnRzIChxdWVzdGlvbnMsIG1vc3RseSlcbiAgICBfLmVhY2ggQGNvbnRlbnRzLCAoYykgPT4gQCRlbC5hcHBlbmQgYy4kZWxcblxuICAgIHRoaXNcbiIsIiMgRm9ybSB0aGF0IGhhcyBzYXZlIGFuZCBjYW5jZWwgYnV0dG9ucyB0aGF0IGZpcmUgc2F2ZSBhbmQgY2FuY2VsIGV2ZW50cy5cbiMgU2F2ZSBldmVudCB3aWxsIG9ubHkgYmUgZmlyZWQgaWYgdmFsaWRhdGVzXG5cbm1vZHVsZS5leHBvcnRzID0gQmFja2JvbmUuVmlldy5leHRlbmRcbiAgaW5pdGlhbGl6ZTogLT5cbiAgICBAY29udGVudHMgPSBAb3B0aW9ucy5jb250ZW50c1xuICAgIEByZW5kZXIoKVxuXG4gIGV2ZW50czogXG4gICAgJ2NsaWNrICNzYXZlX2J1dHRvbic6ICdzYXZlJ1xuICAgICdjbGljayAjY2FuY2VsX2J1dHRvbic6ICdjYW5jZWwnXG5cbiAgdmFsaWRhdGU6IC0+XG4gICAgIyBHZXQgYWxsIHZpc2libGUgaXRlbXNcbiAgICBpdGVtcyA9IF8uZmlsdGVyKEBjb250ZW50cywgKGMpIC0+XG4gICAgICBjLnZpc2libGUgYW5kIGMudmFsaWRhdGVcbiAgICApXG4gICAgcmV0dXJuIG5vdCBfLmFueShfLm1hcChpdGVtcywgKGl0ZW0pIC0+XG4gICAgICBpdGVtLnZhbGlkYXRlKClcbiAgICApKVxuXG4gIHJlbmRlcjogLT5cbiAgICBAJGVsLmh0bWwgJycnPGRpdiBpZD1cImNvbnRlbnRzXCI+PC9kaXY+XG4gICAgPGRpdj5cbiAgICAgICAgPGJ1dHRvbiBpZD1cInNhdmVfYnV0dG9uXCIgdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwiYnRuIGJ0bi1wcmltYXJ5IG1hcmdpbmVkXCI+U2F2ZTwvYnV0dG9uPlxuICAgICAgICAmbmJzcDtcbiAgICAgICAgPGJ1dHRvbiBpZD1cImNhbmNlbF9idXR0b25cIiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJidG4gbWFyZ2luZWRcIj5DYW5jZWw8L2J1dHRvbj5cbiAgICA8L2Rpdj4nJydcbiAgICBcbiAgICAjIEFkZCBjb250ZW50cyAocXVlc3Rpb25zLCBtb3N0bHkpXG4gICAgXy5lYWNoIEBjb250ZW50cywgKGMpID0+IEAkKCcjY29udGVudHMnKS5hcHBlbmQgYy4kZWxcbiAgICB0aGlzXG5cbiAgc2F2ZTogLT5cbiAgICBpZiBAdmFsaWRhdGUoKVxuICAgICAgQHRyaWdnZXIgJ3NhdmUnXG5cbiAgY2FuY2VsOiAtPlxuICAgIEB0cmlnZ2VyICdjYW5jZWwnXG4iLCJtb2R1bGUuZXhwb3J0cyA9IEJhY2tib25lLlZpZXcuZXh0ZW5kXG4gIGluaXRpYWxpemU6IC0+XG4gICAgQCRlbC5odG1sIF8udGVtcGxhdGUoJycnXG4gICAgICA8ZGl2IGNsYXNzPVwid2VsbCB3ZWxsLXNtYWxsXCI+PCU9aHRtbCU+PCUtdGV4dCU+PC9kaXY+XG4gICAgICAnJycpKGh0bWw6IEBvcHRpb25zLmh0bWwsIHRleHQ6IEBvcHRpb25zLnRleHQpXG4iLCIjIFRPRE8gRml4IHRvIGhhdmUgZWRpdGFibGUgWVlZWS1NTS1ERCB3aXRoIGNsaWNrIHRvIHBvcHVwIHNjcm9sbGVyXG5cblF1ZXN0aW9uID0gcmVxdWlyZSgnLi9mb3JtLWNvbnRyb2xzJykuUXVlc3Rpb25cblxubW9kdWxlLmV4cG9ydHMgPSBRdWVzdGlvbi5leHRlbmQoXG4gIGV2ZW50czpcbiAgICBjaGFuZ2U6IFwiY2hhbmdlZFwiXG5cbiAgY2hhbmdlZDogLT5cbiAgICBAbW9kZWwuc2V0IEBpZCwgQCRlbC5maW5kKFwiaW5wdXRbbmFtZT1cXFwiZGF0ZVxcXCJdXCIpLnZhbCgpXG5cbiAgcmVuZGVyQW5zd2VyOiAoYW5zd2VyRWwpIC0+XG4gICAgYW5zd2VyRWwuaHRtbCBfLnRlbXBsYXRlKFwiPGlucHV0IGNsYXNzPVxcXCJuZWVkc2NsaWNrXFxcIiBuYW1lPVxcXCJkYXRlXFxcIiAvPlwiLCB0aGlzKVxuICAgIGFuc3dlckVsLmZpbmQoXCJpbnB1dFwiKS52YWwgQG1vZGVsLmdldChAaWQpXG4gICAgYW5zd2VyRWwuZmluZChcImlucHV0XCIpLnNjcm9sbGVyXG4gICAgICBwcmVzZXQ6IFwiZGF0ZVwiXG4gICAgICB0aGVtZTogXCJpb3NcIlxuICAgICAgZGlzcGxheTogXCJtb2RhbFwiXG4gICAgICBtb2RlOiBcInNjcm9sbGVyXCJcbiAgICAgIGRhdGVPcmRlcjogXCJ5eW1tRCBkZFwiXG4gICAgICBkYXRlRm9ybWF0OiBcInl5LW1tLWRkXCJcblxuKSIsIlF1ZXN0aW9uID0gcmVxdWlyZSgnLi9mb3JtLWNvbnRyb2xzJykuUXVlc3Rpb25cblxubW9kdWxlLmV4cG9ydHMgPSBRdWVzdGlvbi5leHRlbmQoXG4gIGV2ZW50czpcbiAgICBjaGFuZ2U6IFwiY2hhbmdlZFwiXG5cbiAgc2V0T3B0aW9uczogKG9wdGlvbnMpIC0+XG4gICAgQG9wdGlvbnMub3B0aW9ucyA9IG9wdGlvbnNcbiAgICBAcmVuZGVyKClcblxuICBjaGFuZ2VkOiAoZSkgLT5cbiAgICB2YWwgPSAkKGUudGFyZ2V0KS52YWwoKVxuICAgIGlmIHZhbCBpcyBcIlwiXG4gICAgICBAbW9kZWwuc2V0IEBpZCwgbnVsbFxuICAgIGVsc2VcbiAgICAgIGluZGV4ID0gcGFyc2VJbnQodmFsKVxuICAgICAgdmFsdWUgPSBAb3B0aW9ucy5vcHRpb25zW2luZGV4XVswXVxuICAgICAgQG1vZGVsLnNldCBAaWQsIHZhbHVlXG5cbiAgcmVuZGVyQW5zd2VyOiAoYW5zd2VyRWwpIC0+XG4gICAgYW5zd2VyRWwuaHRtbCBfLnRlbXBsYXRlKFwiPHNlbGVjdCBpZD1cXFwic291cmNlX3R5cGVcXFwiPjwlPXJlbmRlckRyb3Bkb3duT3B0aW9ucygpJT48L3NlbGVjdD5cIiwgdGhpcylcbiAgICAjIENoZWNrIGlmIGFuc3dlciBwcmVzZW50IFxuICAgIGlmIG5vdCBfLmFueShAb3B0aW9ucy5vcHRpb25zLCAob3B0KSA9PiBvcHRbMF0gPT0gQG1vZGVsLmdldChAaWQpKSBhbmQgQG1vZGVsLmdldChAaWQpP1xuICAgICAgQCQoXCJzZWxlY3RcIikuYXR0cignZGlzYWJsZWQnLCAnZGlzYWJsZWQnKVxuXG4gIHJlbmRlckRyb3Bkb3duT3B0aW9uczogLT5cbiAgICBodG1sID0gXCJcIlxuICAgIFxuICAgICMgQWRkIGVtcHR5IG9wdGlvblxuICAgIGh0bWwgKz0gXCI8b3B0aW9uIHZhbHVlPVxcXCJcXFwiPjwvb3B0aW9uPlwiXG4gICAgZm9yIGkgaW4gWzAuLi5Ab3B0aW9ucy5vcHRpb25zLmxlbmd0aF1cbiAgICAgIGh0bWwgKz0gXy50ZW1wbGF0ZShcIjxvcHRpb24gdmFsdWU9XFxcIjwlPXBvc2l0aW9uJT5cXFwiIDwlPXNlbGVjdGVkJT4+PCUtdGV4dCU+PC9vcHRpb24+XCIsXG4gICAgICAgIHBvc2l0aW9uOiBpXG4gICAgICAgIHRleHQ6IEBvcHRpb25zLm9wdGlvbnNbaV1bMV1cbiAgICAgICAgc2VsZWN0ZWQ6IChpZiBAbW9kZWwuZ2V0KEBpZCkgaXMgQG9wdGlvbnMub3B0aW9uc1tpXVswXSB0aGVuIFwic2VsZWN0ZWQ9XFxcInNlbGVjdGVkXFxcIlwiIGVsc2UgXCJcIilcbiAgICAgIClcbiAgICByZXR1cm4gaHRtbFxuKSIsIlF1ZXN0aW9uID0gcmVxdWlyZSgnLi9mb3JtLWNvbnRyb2xzJykuUXVlc3Rpb25cblxubW9kdWxlLmV4cG9ydHMgPSBRdWVzdGlvbi5leHRlbmRcbiAgcmVuZGVyQW5zd2VyOiAoYW5zd2VyRWwpIC0+XG4gICAgYW5zd2VyRWwuaHRtbCBfLnRlbXBsYXRlKFwiPGlucHV0IHR5cGU9XFxcIm51bWJlclxcXCIgPCUgaWYgKG9wdGlvbnMuZGVjaW1hbCkgeyU+c3RlcD1cXFwiYW55XFxcIjwlfSU+IC8+XCIsIHRoaXMpXG4gICAgYW5zd2VyRWwuZmluZChcImlucHV0XCIpLnZhbCBAbW9kZWwuZ2V0KEBpZClcblxuICBldmVudHM6XG4gICAgY2hhbmdlOiBcImNoYW5nZWRcIlxuXG4gIHZhbGlkYXRlSW50ZXJuYWw6IC0+XG4gICAgdmFsID0gQCQoXCJpbnB1dFwiKS52YWwoKVxuICAgIGlmIEBvcHRpb25zLmRlY2ltYWwgYW5kIHZhbC5sZW5ndGggPiAwXG4gICAgICBpZiBwYXJzZUZsb2F0KHZhbCkgPT0gTmFOXG4gICAgICAgIHJldHVybiBcIkludmFsaWQgZGVjaW1hbCBudW1iZXJcIlxuICAgIGVsc2UgaWYgdmFsLmxlbmd0aCA+IDBcbiAgICAgIGlmIG5vdCB2YWwubWF0Y2goL14tP1xcZCskLylcbiAgICAgICAgcmV0dXJuIFwiSW52YWxpZCBpbnRlZ2VyIG51bWJlclwiXG4gICAgcmV0dXJuIG51bGxcblxuICBjaGFuZ2VkOiAtPlxuICAgIHZhbCA9IHBhcnNlRmxvYXQoQCQoXCJpbnB1dFwiKS52YWwoKSlcbiAgICBpZiB2YWwgPT0gTmFOXG4gICAgICB2YWwgPSBudWxsXG4gICAgQG1vZGVsLnNldCBAaWQsIHZhbCBcbiIsIlF1ZXN0aW9uID0gcmVxdWlyZSgnLi9mb3JtLWNvbnRyb2xzJykuUXVlc3Rpb25cblNvdXJjZUxpc3RQYWdlID0gcmVxdWlyZSAnLi4vcGFnZXMvU291cmNlTGlzdFBhZ2UnXG5zb3VyY2Vjb2RlcyA9IHJlcXVpcmUgJy4uL3NvdXJjZWNvZGVzJ1xuXG5tb2R1bGUuZXhwb3J0cyA9IFF1ZXN0aW9uLmV4dGVuZFxuICByZW5kZXJBbnN3ZXI6IChhbnN3ZXJFbCkgLT5cbiAgICBhbnN3ZXJFbC5odG1sICcnJ1xuICAgICAgPGRpdiBjbGFzcz1cImlucHV0LWFwcGVuZFwiPlxuICAgICAgICA8aW5wdXQgdHlwZT1cInRlbFwiPlxuICAgICAgICA8YnV0dG9uIGNsYXNzPVwiYnRuXCIgaWQ9XCJzZWxlY3RcIiB0eXBlPVwiYnV0dG9uXCI+U2VsZWN0PC9idXR0b24+XG4gICAgICA8L2Rpdj4nJydcbiAgICBhbnN3ZXJFbC5maW5kKFwiaW5wdXRcIikudmFsIEBtb2RlbC5nZXQoQGlkKVxuXG4gIGV2ZW50czpcbiAgICAnY2hhbmdlJyA6ICdjaGFuZ2VkJ1xuICAgICdjbGljayAjc2VsZWN0JyA6ICdzZWxlY3RTb3VyY2UnXG5cbiAgY2hhbmdlZDogLT5cbiAgICBAbW9kZWwuc2V0IEBpZCwgQCQoXCJpbnB1dFwiKS52YWwoKVxuXG4gIHNlbGVjdFNvdXJjZTogLT5cbiAgICBAY3R4LnBhZ2VyLm9wZW5QYWdlIFNvdXJjZUxpc3RQYWdlLCBcbiAgICAgIHsgb25TZWxlY3Q6IChzb3VyY2UpPT5cbiAgICAgICAgQG1vZGVsLnNldCBAaWQsIHNvdXJjZS5jb2RlXG4gICAgICB9XG5cbiAgdmFsaWRhdGVJbnRlcm5hbDogLT5cbiAgICBpZiBub3QgQCQoXCJpbnB1dFwiKS52YWwoKVxuICAgICAgcmV0dXJuIGZhbHNlXG5cbiAgICBpZiBzb3VyY2Vjb2Rlcy5pc1ZhbGlkKEAkKFwiaW5wdXRcIikudmFsKCkpXG4gICAgICByZXR1cm4gZmFsc2VcblxuICAgIHJldHVybiBcIkludmFsaWQgU291cmNlXCJcblxuIiwiUXVlc3Rpb24gPSByZXF1aXJlKCcuL2Zvcm0tY29udHJvbHMnKS5RdWVzdGlvblxuSW1hZ2VQYWdlID0gcmVxdWlyZSAnLi4vcGFnZXMvSW1hZ2VQYWdlJ1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEltYWdlUXVlc3Rpb24gZXh0ZW5kcyBRdWVzdGlvblxuICBldmVudHM6XG4gICAgXCJjbGljayAjYWRkXCI6IFwiYWRkQ2xpY2tcIlxuICAgIFwiY2xpY2sgLnRodW1ibmFpbC1pbWdcIjogXCJ0aHVtYm5haWxDbGlja1wiXG5cbiAgcmVuZGVyQW5zd2VyOiAoYW5zd2VyRWwpIC0+XG4gICAgIyBSZW5kZXIgaW1hZ2UgdXNpbmcgaW1hZ2UgbWFuYWdlclxuICAgIGlmIG5vdCBAY3R4LmltYWdlTWFuYWdlclxuICAgICAgYW5zd2VyRWwuaHRtbCAnJyc8ZGl2IGNsYXNzPVwidGV4dC1lcnJvclwiPkltYWdlcyBub3QgYXZhaWxhYmxlPC9kaXY+JycnXG4gICAgZWxzZVxuICAgICAgaW1hZ2UgPSBAbW9kZWwuZ2V0KEBpZClcblxuICAgICAgIyBEZXRlcm1pbmUgaWYgY2FuIGFkZCBpbWFnZXNcbiAgICAgIG5vdFN1cHBvcnRlZCA9IGZhbHNlXG4gICAgICBpZiBAb3B0aW9ucy5yZWFkb25seVxuICAgICAgICBjYW5BZGQgPSBmYWxzZVxuICAgICAgZWxzZSBpZiBAY3R4LmNhbWVyYSBhbmQgQGN0eC5pbWFnZU1hbmFnZXIuYWRkSW1hZ2VcbiAgICAgICAgY2FuQWRkID0gbm90IGltYWdlPyAjIERvbid0IGFsbG93IGFkZGluZyBtb3JlIHRoYW4gb25lXG4gICAgICBlbHNlXG4gICAgICAgIGNhbkFkZCA9IGZhbHNlXG4gICAgICAgIG5vdFN1cHBvcnRlZCA9IG5vdCBpbWFnZVxuXG4gICAgICAjIERldGVybWluZSBpZiB3ZSBuZWVkIHRvIHRlbGwgdXNlciB0aGF0IG5vIGltYWdlIGlzIGF2YWlsYWJsZVxuICAgICAgbm9JbWFnZSA9IG5vdCBjYW5BZGQgYW5kIG5vdCBpbWFnZSBhbmQgbm90IG5vdFN1cHBvcnRlZFxuXG4gICAgICAjIFJlbmRlciBpbWFnZXNcbiAgICAgIGFuc3dlckVsLmh0bWwgdGVtcGxhdGVzWydmb3Jtcy9JbWFnZVF1ZXN0aW9uJ10oaW1hZ2U6IGltYWdlLCBjYW5BZGQ6IGNhbkFkZCwgbm9JbWFnZTogbm9JbWFnZSwgbm90U3VwcG9ydGVkOiBub3RTdXBwb3J0ZWQpXG5cbiAgICAgICMgU2V0IHNvdXJjZVxuICAgICAgaWYgaW1hZ2VcbiAgICAgICAgQHNldFRodW1ibmFpbFVybChpbWFnZS5pZClcbiAgICBcbiAgc2V0VGh1bWJuYWlsVXJsOiAoaWQpIC0+XG4gICAgc3VjY2VzcyA9ICh1cmwpID0+XG4gICAgICBAJChcIiNcIiArIGlkKS5hdHRyKFwic3JjXCIsIHVybClcbiAgICBAY3R4LmltYWdlTWFuYWdlci5nZXRJbWFnZVRodW1ibmFpbFVybCBpZCwgc3VjY2VzcywgQGVycm9yXG5cbiAgYWRkQ2xpY2s6IC0+XG4gICAgIyBDYWxsIGNhbWVyYSB0byBnZXQgaW1hZ2VcbiAgICBzdWNjZXNzID0gKHVybCkgPT5cbiAgICAgICMgQWRkIGltYWdlXG4gICAgICBAY3R4LmltYWdlTWFuYWdlci5hZGRJbWFnZSh1cmwsIChpZCkgPT5cbiAgICAgICAgIyBBZGQgdG8gbW9kZWxcbiAgICAgICAgQG1vZGVsLnNldChAaWQsIHsgaWQ6IGlkIH0pXG4gICAgICAsIEBjdHguZXJyb3IpXG4gICAgQGN0eC5jYW1lcmEudGFrZVBpY3R1cmUgc3VjY2VzcywgKGVycikgLT5cbiAgICAgIGFsZXJ0KFwiRmFpbGVkIHRvIHRha2UgcGljdHVyZVwiKVxuXG4gIHRodW1ibmFpbENsaWNrOiAoZXYpIC0+XG4gICAgaWQgPSBldi5jdXJyZW50VGFyZ2V0LmlkXG5cbiAgICAjIENyZWF0ZSBvblJlbW92ZSBjYWxsYmFja1xuICAgIG9uUmVtb3ZlID0gKCkgPT4gXG4gICAgICBAbW9kZWwuc2V0KEBpZCwgbnVsbClcblxuICAgIEBjdHgucGFnZXIub3BlblBhZ2UoSW1hZ2VQYWdlLCB7IGlkOiBpZCwgb25SZW1vdmU6IG9uUmVtb3ZlIH0pIiwiUXVlc3Rpb24gPSByZXF1aXJlKCcuL2Zvcm0tY29udHJvbHMnKS5RdWVzdGlvblxuSW1hZ2VQYWdlID0gcmVxdWlyZSAnLi4vcGFnZXMvSW1hZ2VQYWdlJ1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEltYWdlc1F1ZXN0aW9uIGV4dGVuZHMgUXVlc3Rpb25cbiAgZXZlbnRzOlxuICAgIFwiY2xpY2sgI2FkZFwiOiBcImFkZENsaWNrXCJcbiAgICBcImNsaWNrIC50aHVtYm5haWwtaW1nXCI6IFwidGh1bWJuYWlsQ2xpY2tcIlxuXG4gIHJlbmRlckFuc3dlcjogKGFuc3dlckVsKSAtPlxuICAgICMgUmVuZGVyIGltYWdlIHVzaW5nIGltYWdlIG1hbmFnZXJcbiAgICBpZiBub3QgQGN0eC5pbWFnZU1hbmFnZXJcbiAgICAgIGFuc3dlckVsLmh0bWwgJycnPGRpdiBjbGFzcz1cInRleHQtZXJyb3JcIj5JbWFnZXMgbm90IGF2YWlsYWJsZTwvZGl2PicnJ1xuICAgIGVsc2VcbiAgICAgIGltYWdlcyA9IEBtb2RlbC5nZXQoQGlkKVxuXG4gICAgICAjIERldGVybWluZSBpZiBjYW4gYWRkIGltYWdlc1xuICAgICAgbm90U3VwcG9ydGVkID0gZmFsc2VcbiAgICAgIGlmIEBvcHRpb25zLnJlYWRvbmx5XG4gICAgICAgIGNhbkFkZCA9IGZhbHNlXG4gICAgICBlbHNlIGlmIEBjdHguY2FtZXJhIGFuZCBAY3R4LmltYWdlTWFuYWdlci5hZGRJbWFnZVxuICAgICAgICBjYW5BZGQgPSB0cnVlXG4gICAgICBlbHNlXG4gICAgICAgIGNhbkFkZCA9IGZhbHNlXG4gICAgICAgIG5vdFN1cHBvcnRlZCA9IG5vdCBpbWFnZXMgb3IgaW1hZ2VzLmxlbmd0aCA9PSAwXG5cbiAgICAgICMgRGV0ZXJtaW5lIGlmIHdlIG5lZWQgdG8gdGVsbCB1c2VyIHRoYXQgbm8gaW1hZ2UgYXJlIGF2YWlsYWJsZVxuICAgICAgbm9JbWFnZSA9IG5vdCBjYW5BZGQgYW5kIChub3QgaW1hZ2VzIG9yIGltYWdlcy5sZW5ndGggPT0gMCkgYW5kIG5vdCBub3RTdXBwb3J0ZWRcblxuICAgICAgIyBSZW5kZXIgaW1hZ2VzXG4gICAgICBhbnN3ZXJFbC5odG1sIHRlbXBsYXRlc1snZm9ybXMvSW1hZ2VzUXVlc3Rpb24nXShpbWFnZXM6IGltYWdlcywgY2FuQWRkOiBjYW5BZGQsIG5vSW1hZ2U6IG5vSW1hZ2UsIG5vdFN1cHBvcnRlZDogbm90U3VwcG9ydGVkKVxuXG4gICAgICAjIFNldCBzb3VyY2VzXG4gICAgICBpZiBpbWFnZXNcbiAgICAgICAgZm9yIGltYWdlIGluIGltYWdlc1xuICAgICAgICAgIEBzZXRUaHVtYm5haWxVcmwoaW1hZ2UuaWQpXG4gICAgXG4gIHNldFRodW1ibmFpbFVybDogKGlkKSAtPlxuICAgIHN1Y2Nlc3MgPSAodXJsKSA9PlxuICAgICAgQCQoXCIjXCIgKyBpZCkuYXR0cihcInNyY1wiLCB1cmwpXG4gICAgQGN0eC5pbWFnZU1hbmFnZXIuZ2V0SW1hZ2VUaHVtYm5haWxVcmwgaWQsIHN1Y2Nlc3MsIEBlcnJvclxuXG4gIGFkZENsaWNrOiAtPlxuICAgICMgQ2FsbCBjYW1lcmEgdG8gZ2V0IGltYWdlXG4gICAgc3VjY2VzcyA9ICh1cmwpID0+XG4gICAgICAjIEFkZCBpbWFnZVxuICAgICAgQGN0eC5pbWFnZU1hbmFnZXIuYWRkSW1hZ2UodXJsLCAoaWQpID0+XG4gICAgICAgICMgQWRkIHRvIG1vZGVsXG4gICAgICAgIGltYWdlcyA9IEBtb2RlbC5nZXQoQGlkKSB8fCBbXVxuICAgICAgICBpbWFnZXMucHVzaCB7IGlkOiBpZCB9XG4gICAgICAgIEBtb2RlbC5zZXQoQGlkLCBpbWFnZXMpXG5cbiAgICAgICwgQGN0eC5lcnJvcilcbiAgICBAY3R4LmNhbWVyYS50YWtlUGljdHVyZSBzdWNjZXNzLCAoZXJyKSAtPlxuICAgICAgYWxlcnQoXCJGYWlsZWQgdG8gdGFrZSBwaWN0dXJlXCIpXG5cbiAgdGh1bWJuYWlsQ2xpY2s6IChldikgLT5cbiAgICBpZCA9IGV2LmN1cnJlbnRUYXJnZXQuaWRcblxuICAgICMgQ3JlYXRlIG9uUmVtb3ZlIGNhbGxiYWNrXG4gICAgb25SZW1vdmUgPSAoKSA9PiBcbiAgICAgIGltYWdlcyA9IEBtb2RlbC5nZXQoQGlkKSB8fCBbXVxuICAgICAgaW1hZ2VzID0gXy5yZWplY3QgaW1hZ2VzLCAoaW1nKSA9PlxuICAgICAgICBpbWcuaWQgPT0gaWRcbiAgICAgIEBtb2RlbC5zZXQoQGlkLCBpbWFnZXMpICAgICAgXG5cbiAgICBAY3R4LnBhZ2VyLm9wZW5QYWdlKEltYWdlUGFnZSwgeyBpZDogaWQsIG9uUmVtb3ZlOiBvblJlbW92ZSB9KSIsIiMgSW1wcm92ZWQgbG9jYXRpb24gZmluZGVyXG5jbGFzcyBMb2NhdGlvbkZpbmRlclxuICBjb25zdHJ1Y3RvcjogLT5cbiAgICBfLmV4dGVuZCBALCBCYWNrYm9uZS5FdmVudHNcbiAgICBcbiAgZ2V0TG9jYXRpb246IC0+XG4gICAgIyBCb3RoIGZhaWx1cmVzIGFyZSByZXF1aXJlZCB0byB0cmlnZ2VyIGVycm9yXG4gICAgbG9jYXRpb25FcnJvciA9IF8uYWZ0ZXIgMiwgPT5cbiAgICAgIEB0cmlnZ2VyICdlcnJvcidcblxuICAgIGhpZ2hBY2N1cmFjeUZpcmVkID0gZmFsc2VcblxuICAgIGxvd0FjY3VyYWN5ID0gKHBvcykgPT5cbiAgICAgIGlmIG5vdCBoaWdoQWNjdXJhY3lGaXJlZFxuICAgICAgICBAdHJpZ2dlciAnZm91bmQnLCBwb3NcblxuICAgIGhpZ2hBY2N1cmFjeSA9IChwb3MpID0+XG4gICAgICBoaWdoQWNjdXJhY3lGaXJlZCA9IHRydWVcbiAgICAgIEB0cmlnZ2VyICdmb3VuZCcsIHBvc1xuXG4gICAgIyBHZXQgYm90aCBoaWdoIGFuZCBsb3cgYWNjdXJhY3ksIGFzIGxvdyBpcyBzdWZmaWNpZW50IGZvciBpbml0aWFsIGRpc3BsYXlcbiAgICBuYXZpZ2F0b3IuZ2VvbG9jYXRpb24uZ2V0Q3VycmVudFBvc2l0aW9uKGxvd0FjY3VyYWN5LCBsb2NhdGlvbkVycm9yLCB7XG4gICAgICAgIG1heGltdW1BZ2UgOiAzNjAwKjI0LFxuICAgICAgICB0aW1lb3V0IDogMTAwMDAsXG4gICAgICAgIGVuYWJsZUhpZ2hBY2N1cmFjeSA6IGZhbHNlXG4gICAgfSlcblxuICAgIG5hdmlnYXRvci5nZW9sb2NhdGlvbi5nZXRDdXJyZW50UG9zaXRpb24oaGlnaEFjY3VyYWN5LCBsb2NhdGlvbkVycm9yLCB7XG4gICAgICAgIG1heGltdW1BZ2UgOiAzNjAwLFxuICAgICAgICB0aW1lb3V0IDogMzAwMDAsXG4gICAgICAgIGVuYWJsZUhpZ2hBY2N1cmFjeSA6IHRydWVcbiAgICB9KVxuXG4gIHN0YXJ0V2F0Y2g6IC0+XG4gICAgIyBBbGxvdyBvbmUgd2F0Y2ggYXQgbW9zdFxuICAgIGlmIEBsb2NhdGlvbldhdGNoSWQ/XG4gICAgICBAc3RvcFdhdGNoKClcblxuICAgIGhpZ2hBY2N1cmFjeUZpcmVkID0gZmFsc2VcbiAgICBsb3dBY2N1cmFjeUZpcmVkID0gZmFsc2VcblxuICAgIGxvd0FjY3VyYWN5ID0gKHBvcykgPT5cbiAgICAgIGlmIG5vdCBoaWdoQWNjdXJhY3lGaXJlZFxuICAgICAgICBsb3dBY2N1cmFjeUZpcmVkID0gdHJ1ZVxuICAgICAgICBAdHJpZ2dlciAnZm91bmQnLCBwb3NcblxuICAgIGhpZ2hBY2N1cmFjeSA9IChwb3MpID0+XG4gICAgICBoaWdoQWNjdXJhY3lGaXJlZCA9IHRydWVcbiAgICAgIEB0cmlnZ2VyICdmb3VuZCcsIHBvc1xuXG4gICAgZXJyb3IgPSAoZXJyb3IpID0+XG4gICAgICBjb25zb2xlLmxvZyBcIiMjIyBlcnJvciBcIlxuICAgICAgIyBObyBlcnJvciBpZiBmaXJlZCBvbmNlXG4gICAgICBpZiBub3QgbG93QWNjdXJhY3lGaXJlZCBhbmQgbm90IGhpZ2hBY2N1cmFjeUZpcmVkXG4gICAgICAgIEB0cmlnZ2VyICdlcnJvcicsIGVycm9yXG5cbiAgICAjIEZpcmUgaW5pdGlhbCBsb3ctYWNjdXJhY3kgb25lXG4gICAgbmF2aWdhdG9yLmdlb2xvY2F0aW9uLmdldEN1cnJlbnRQb3NpdGlvbihsb3dBY2N1cmFjeSwgZXJyb3IsIHtcbiAgICAgICAgbWF4aW11bUFnZSA6IDM2MDAqMjQsXG4gICAgICAgIHRpbWVvdXQgOiAxMDAwMCxcbiAgICAgICAgZW5hYmxlSGlnaEFjY3VyYWN5IDogZmFsc2VcbiAgICB9KVxuXG4gICAgQGxvY2F0aW9uV2F0Y2hJZCA9IG5hdmlnYXRvci5nZW9sb2NhdGlvbi53YXRjaFBvc2l0aW9uKGhpZ2hBY2N1cmFjeSwgZXJyb3IsIHtcbiAgICAgICAgbWF4aW11bUFnZSA6IDMwMDAsXG4gICAgICAgIGVuYWJsZUhpZ2hBY2N1cmFjeSA6IHRydWVcbiAgICB9KSAgXG5cbiAgc3RvcFdhdGNoOiAtPlxuICAgIGlmIEBsb2NhdGlvbldhdGNoSWQ/XG4gICAgICBuYXZpZ2F0b3IuZ2VvbG9jYXRpb24uY2xlYXJXYXRjaChAbG9jYXRpb25XYXRjaElkKVxuICAgICAgQGxvY2F0aW9uV2F0Y2hJZCA9IHVuZGVmaW5lZFxuXG5cbm1vZHVsZS5leHBvcnRzID0gTG9jYXRpb25GaW5kZXIgICIsImNsYXNzIFBhZ2UgZXh0ZW5kcyBCYWNrYm9uZS5WaWV3XG4gIGNvbnN0cnVjdG9yOiAoY3R4LCBvcHRpb25zPXt9KSAtPlxuICAgIHN1cGVyKG9wdGlvbnMpXG4gICAgQGN0eCA9IGN0eFxuXG4gICAgIyBNaXggaW4gY29udGV4dCBmb3IgY29udmVuaWVuY2VcbiAgICBfLmV4dGVuZChALCBjdHgpIFxuXG4gICAgIyBTdG9yZSBzdWJ2aWV3c1xuICAgIEBfc3Vidmlld3MgPSBbXVxuXG4gICAgIyBTZXR1cCBkZWZhdWx0IGJ1dHRvbiBiYXJcbiAgICBAYnV0dG9uQmFyID0gbmV3IEJ1dHRvbkJhcigpXG5cbiAgICAjIFNldHVwIGRlZmF1bHQgY29udGV4dCBtZW51XG4gICAgQGNvbnRleHRNZW51ID0gbmV3IENvbnRleHRNZW51KClcblxuICBjbGFzc05hbWU6IFwicGFnZVwiXG4gIGNyZWF0ZTogLT5cbiAgYWN0aXZhdGU6IC0+XG4gIGRlYWN0aXZhdGU6IC0+XG4gIGRlc3Ryb3k6IC0+XG4gIHJlbW92ZTogLT5cbiAgICBAcmVtb3ZlU3Vidmlld3MoKVxuICAgIHN1cGVyKClcblxuICBnZXRUaXRsZTogLT4gQHRpdGxlXG5cbiAgc2V0VGl0bGU6ICh0aXRsZSkgLT5cbiAgICBAdGl0bGUgPSB0aXRsZVxuICAgIEB0cmlnZ2VyICdjaGFuZ2U6dGl0bGUnXG5cbiAgYWRkU3VidmlldzogKHZpZXcpIC0+XG4gICAgQF9zdWJ2aWV3cy5wdXNoKHZpZXcpXG5cbiAgcmVtb3ZlU3Vidmlld3M6IC0+XG4gICAgZm9yIHN1YnZpZXcgaW4gQF9zdWJ2aWV3c1xuICAgICAgc3Vidmlldy5yZW1vdmUoKVxuXG4gIGdldEJ1dHRvbkJhcjogLT5cbiAgICByZXR1cm4gQGJ1dHRvbkJhclxuXG4gIGdldENvbnRleHRNZW51OiAtPlxuICAgIHJldHVybiBAY29udGV4dE1lbnVcblxuICBzZXR1cEJ1dHRvbkJhcjogKGl0ZW1zKSAtPlxuICAgICMgU2V0dXAgYnV0dG9uIGJhclxuICAgIEBidXR0b25CYXIuc2V0dXAoaXRlbXMpXG5cbiAgc2V0dXBDb250ZXh0TWVudTogKGl0ZW1zKSAtPlxuICAgICMgU2V0dXAgY29udGV4dCBtZW51XG4gICAgQGNvbnRleHRNZW51LnNldHVwKGl0ZW1zKVxuXG4jIFN0YW5kYXJkIGJ1dHRvbiBiYXIuIEVhY2ggaXRlbVxuIyBoYXMgb3B0aW9uYWwgXCJ0ZXh0XCIsIG9wdGlvbmFsIFwiaWNvblwiIGFuZCBcImNsaWNrXCIgKGFjdGlvbikuXG4jIEZvciBzdWJtZW51LCBhZGQgYXJyYXkgdG8gXCJtZW51XCIuIE9uZSBsZXZlbCBuZXN0aW5nIG9ubHkuXG5jbGFzcyBCdXR0b25CYXIgZXh0ZW5kcyBCYWNrYm9uZS5WaWV3XG4gIGV2ZW50czogXG4gICAgXCJjbGljayAubWVudWl0ZW1cIiA6IFwiY2xpY2tNZW51SXRlbVwiXG5cbiAgc2V0dXA6IChpdGVtcykgLT5cbiAgICBAaXRlbXMgPSBpdGVtc1xuICAgIEBpdGVtTWFwID0ge31cblxuICAgICMgQWRkIGlkIHRvIGFsbCBpdGVtcyBpZiBub3QgcHJlc2VudFxuICAgIGlkID0gMVxuICAgIGZvciBpdGVtIGluIGl0ZW1zXG4gICAgICBpZiBub3QgaXRlbS5pZD9cbiAgICAgICAgaXRlbS5pZCA9IGlkXG4gICAgICAgIGlkPWlkKzFcbiAgICAgIEBpdGVtTWFwW2l0ZW0uaWRdID0gaXRlbVxuXG4gICAgICAjIEFkZCB0byBzdWJtZW51XG4gICAgICBpZiBpdGVtLm1lbnVcbiAgICAgICAgZm9yIHN1Yml0ZW0gaW4gaXRlbS5tZW51XG4gICAgICAgICAgaWYgbm90IHN1Yml0ZW0uaWQ/XG4gICAgICAgICAgICBzdWJpdGVtLmlkID0gaWQudG9TdHJpbmcoKVxuICAgICAgICAgICAgaWQ9aWQrMVxuICAgICAgICAgIEBpdGVtTWFwW3N1Yml0ZW0uaWRdID0gc3ViaXRlbVxuXG4gICAgQHJlbmRlcigpXG5cbiAgcmVuZGVyOiAtPlxuICAgIEAkZWwuaHRtbCB0ZW1wbGF0ZXNbJ0J1dHRvbkJhciddKGl0ZW1zOiBAaXRlbXMpXG5cbiAgY2xpY2tNZW51SXRlbTogKGUpIC0+XG4gICAgaWQgPSBlLmN1cnJlbnRUYXJnZXQuaWRcbiAgICBpdGVtID0gQGl0ZW1NYXBbaWRdXG4gICAgaWYgaXRlbS5jbGljaz9cbiAgICAgIGl0ZW0uY2xpY2soKVxuXG4jIENvbnRleHQgbWVudSB0byBnbyBpbiBzbGlkZSBtZW51XG4jIFN0YW5kYXJkIGJ1dHRvbiBiYXIuIEVhY2ggaXRlbSBcInRleHRcIiwgb3B0aW9uYWwgXCJnbHlwaFwiIChib290c3RyYXAgZ2x5cGggd2l0aG91dCBpY29uLSBwcmVmaXgpIGFuZCBcImNsaWNrXCIgKGFjdGlvbikuXG5jbGFzcyBDb250ZXh0TWVudSBleHRlbmRzIEJhY2tib25lLlZpZXdcbiAgZXZlbnRzOiBcbiAgICBcImNsaWNrIC5tZW51aXRlbVwiIDogXCJjbGlja01lbnVJdGVtXCJcblxuICBzZXR1cDogKGl0ZW1zKSAtPlxuICAgIEBpdGVtcyA9IGl0ZW1zXG4gICAgQGl0ZW1NYXAgPSB7fVxuXG4gICAgIyBBZGQgaWQgdG8gYWxsIGl0ZW1zIGlmIG5vdCBwcmVzZW50XG4gICAgaWQgPSAxXG4gICAgZm9yIGl0ZW0gaW4gaXRlbXNcbiAgICAgIGlmIG5vdCBpdGVtLmlkP1xuICAgICAgICBpdGVtLmlkID0gaWRcbiAgICAgICAgaWQ9aWQrMVxuICAgICAgQGl0ZW1NYXBbaXRlbS5pZF0gPSBpdGVtXG5cbiAgICBAcmVuZGVyKClcblxuICByZW5kZXI6IC0+XG4gICAgQCRlbC5odG1sIHRlbXBsYXRlc1snQ29udGV4dE1lbnUnXShpdGVtczogQGl0ZW1zKVxuXG4gIGNsaWNrTWVudUl0ZW06IChlKSAtPlxuICAgIGlkID0gZS5jdXJyZW50VGFyZ2V0LmlkXG4gICAgaXRlbSA9IEBpdGVtTWFwW2lkXVxuICAgIGlmIGl0ZW0uY2xpY2s/XG4gICAgICBpdGVtLmNsaWNrKClcblxubW9kdWxlLmV4cG9ydHMgPSBQYWdlIiwiZXhwb3J0cy5zZXFUb0NvZGUgPSAoc2VxKSAtPlxuICAjIEdldCBzdHJpbmcgb2Ygc2VxIG51bWJlclxuICBzdHIgPSBcIlwiICsgc2VxXG5cbiAgc3VtID0gMFxuICBmb3IgaSBpbiBbMC4uLnN0ci5sZW5ndGhdXG4gICAgZGlnaXQgPSBwYXJzZUludChzdHJbc3RyLmxlbmd0aC0xLWldKVxuICAgIGlmIGklMyA9PSAwXG4gICAgICBzdW0gKz0gNyAqIGRpZ2l0XG4gICAgaWYgaSUzID09IDFcbiAgICAgIHN1bSArPSAzICogZGlnaXRcbiAgICBpZiBpJTMgPT0gMlxuICAgICAgc3VtICs9ICBkaWdpdFxuICByZXR1cm4gc3RyICsgKHN1bSAlIDEwKVxuXG5leHBvcnRzLmlzVmFsaWQgPSAoY29kZSkgLT5cbiAgc2VxID0gcGFyc2VJbnQoY29kZS5zdWJzdHJpbmcoMCwgY29kZS5sZW5ndGggLSAxKSlcblxuICByZXR1cm4gZXhwb3J0cy5zZXFUb0NvZGUoc2VxKSA9PSBjb2RlIiwiLy8gVE9ETyBhZGQgbGljZW5zZVxuXG5Mb2NhbENvbGxlY3Rpb24gPSB7fTtcbkVKU09OID0gcmVxdWlyZShcIi4vRUpTT05cIik7XG5cbi8vIExpa2UgXy5pc0FycmF5LCBidXQgZG9lc24ndCByZWdhcmQgcG9seWZpbGxlZCBVaW50OEFycmF5cyBvbiBvbGQgYnJvd3NlcnMgYXNcbi8vIGFycmF5cy5cbnZhciBpc0FycmF5ID0gZnVuY3Rpb24gKHgpIHtcbiAgcmV0dXJuIF8uaXNBcnJheSh4KSAmJiAhRUpTT04uaXNCaW5hcnkoeCk7XG59O1xuXG52YXIgX2FueUlmQXJyYXkgPSBmdW5jdGlvbiAoeCwgZikge1xuICBpZiAoaXNBcnJheSh4KSlcbiAgICByZXR1cm4gXy5hbnkoeCwgZik7XG4gIHJldHVybiBmKHgpO1xufTtcblxudmFyIF9hbnlJZkFycmF5UGx1cyA9IGZ1bmN0aW9uICh4LCBmKSB7XG4gIGlmIChmKHgpKVxuICAgIHJldHVybiB0cnVlO1xuICByZXR1cm4gaXNBcnJheSh4KSAmJiBfLmFueSh4LCBmKTtcbn07XG5cbnZhciBoYXNPcGVyYXRvcnMgPSBmdW5jdGlvbih2YWx1ZVNlbGVjdG9yKSB7XG4gIHZhciB0aGVzZUFyZU9wZXJhdG9ycyA9IHVuZGVmaW5lZDtcbiAgZm9yICh2YXIgc2VsS2V5IGluIHZhbHVlU2VsZWN0b3IpIHtcbiAgICB2YXIgdGhpc0lzT3BlcmF0b3IgPSBzZWxLZXkuc3Vic3RyKDAsIDEpID09PSAnJCc7XG4gICAgaWYgKHRoZXNlQXJlT3BlcmF0b3JzID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoZXNlQXJlT3BlcmF0b3JzID0gdGhpc0lzT3BlcmF0b3I7XG4gICAgfSBlbHNlIGlmICh0aGVzZUFyZU9wZXJhdG9ycyAhPT0gdGhpc0lzT3BlcmF0b3IpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkluY29uc2lzdGVudCBzZWxlY3RvcjogXCIgKyB2YWx1ZVNlbGVjdG9yKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuICEhdGhlc2VBcmVPcGVyYXRvcnM7ICAvLyB7fSBoYXMgbm8gb3BlcmF0b3JzXG59O1xuXG52YXIgY29tcGlsZVZhbHVlU2VsZWN0b3IgPSBmdW5jdGlvbiAodmFsdWVTZWxlY3Rvcikge1xuICBpZiAodmFsdWVTZWxlY3RvciA9PSBudWxsKSB7ICAvLyB1bmRlZmluZWQgb3IgbnVsbFxuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJldHVybiBfYW55SWZBcnJheSh2YWx1ZSwgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIHggPT0gbnVsbDsgIC8vIHVuZGVmaW5lZCBvciBudWxsXG4gICAgICB9KTtcbiAgICB9O1xuICB9XG5cbiAgLy8gU2VsZWN0b3IgaXMgYSBub24tbnVsbCBwcmltaXRpdmUgKGFuZCBub3QgYW4gYXJyYXkgb3IgUmVnRXhwIGVpdGhlcikuXG4gIGlmICghXy5pc09iamVjdCh2YWx1ZVNlbGVjdG9yKSkge1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJldHVybiBfYW55SWZBcnJheSh2YWx1ZSwgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIHggPT09IHZhbHVlU2VsZWN0b3I7XG4gICAgICB9KTtcbiAgICB9O1xuICB9XG5cbiAgaWYgKHZhbHVlU2VsZWN0b3IgaW5zdGFuY2VvZiBSZWdFeHApIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZClcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgcmV0dXJuIF9hbnlJZkFycmF5KHZhbHVlLCBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4gdmFsdWVTZWxlY3Rvci50ZXN0KHgpO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfVxuXG4gIC8vIEFycmF5cyBtYXRjaCBlaXRoZXIgaWRlbnRpY2FsIGFycmF5cyBvciBhcnJheXMgdGhhdCBjb250YWluIGl0IGFzIGEgdmFsdWUuXG4gIGlmIChpc0FycmF5KHZhbHVlU2VsZWN0b3IpKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgaWYgKCFpc0FycmF5KHZhbHVlKSlcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgcmV0dXJuIF9hbnlJZkFycmF5UGx1cyh2YWx1ZSwgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIExvY2FsQ29sbGVjdGlvbi5fZi5fZXF1YWwodmFsdWVTZWxlY3RvciwgeCk7XG4gICAgICB9KTtcbiAgICB9O1xuICB9XG5cbiAgLy8gSXQncyBhbiBvYmplY3QsIGJ1dCBub3QgYW4gYXJyYXkgb3IgcmVnZXhwLlxuICBpZiAoaGFzT3BlcmF0b3JzKHZhbHVlU2VsZWN0b3IpKSB7XG4gICAgdmFyIG9wZXJhdG9yRnVuY3Rpb25zID0gW107XG4gICAgXy5lYWNoKHZhbHVlU2VsZWN0b3IsIGZ1bmN0aW9uIChvcGVyYW5kLCBvcGVyYXRvcikge1xuICAgICAgaWYgKCFfLmhhcyhWQUxVRV9PUEVSQVRPUlMsIG9wZXJhdG9yKSlcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5yZWNvZ25pemVkIG9wZXJhdG9yOiBcIiArIG9wZXJhdG9yKTtcbiAgICAgIG9wZXJhdG9yRnVuY3Rpb25zLnB1c2goVkFMVUVfT1BFUkFUT1JTW29wZXJhdG9yXShcbiAgICAgICAgb3BlcmFuZCwgdmFsdWVTZWxlY3Rvci4kb3B0aW9ucykpO1xuICAgIH0pO1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJldHVybiBfLmFsbChvcGVyYXRvckZ1bmN0aW9ucywgZnVuY3Rpb24gKGYpIHtcbiAgICAgICAgcmV0dXJuIGYodmFsdWUpO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfVxuXG4gIC8vIEl0J3MgYSBsaXRlcmFsOyBjb21wYXJlIHZhbHVlIChvciBlbGVtZW50IG9mIHZhbHVlIGFycmF5KSBkaXJlY3RseSB0byB0aGVcbiAgLy8gc2VsZWN0b3IuXG4gIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICByZXR1cm4gX2FueUlmQXJyYXkodmFsdWUsIGZ1bmN0aW9uICh4KSB7XG4gICAgICByZXR1cm4gTG9jYWxDb2xsZWN0aW9uLl9mLl9lcXVhbCh2YWx1ZVNlbGVjdG9yLCB4KTtcbiAgICB9KTtcbiAgfTtcbn07XG5cbi8vIFhYWCBjYW4gZmFjdG9yIG91dCBjb21tb24gbG9naWMgYmVsb3dcbnZhciBMT0dJQ0FMX09QRVJBVE9SUyA9IHtcbiAgXCIkYW5kXCI6IGZ1bmN0aW9uKHN1YlNlbGVjdG9yKSB7XG4gICAgaWYgKCFpc0FycmF5KHN1YlNlbGVjdG9yKSB8fCBfLmlzRW1wdHkoc3ViU2VsZWN0b3IpKVxuICAgICAgdGhyb3cgRXJyb3IoXCIkYW5kLyRvci8kbm9yIG11c3QgYmUgbm9uZW1wdHkgYXJyYXlcIik7XG4gICAgdmFyIHN1YlNlbGVjdG9yRnVuY3Rpb25zID0gXy5tYXAoXG4gICAgICBzdWJTZWxlY3RvciwgY29tcGlsZURvY3VtZW50U2VsZWN0b3IpO1xuICAgIHJldHVybiBmdW5jdGlvbiAoZG9jKSB7XG4gICAgICByZXR1cm4gXy5hbGwoc3ViU2VsZWN0b3JGdW5jdGlvbnMsIGZ1bmN0aW9uIChmKSB7XG4gICAgICAgIHJldHVybiBmKGRvYyk7XG4gICAgICB9KTtcbiAgICB9O1xuICB9LFxuXG4gIFwiJG9yXCI6IGZ1bmN0aW9uKHN1YlNlbGVjdG9yKSB7XG4gICAgaWYgKCFpc0FycmF5KHN1YlNlbGVjdG9yKSB8fCBfLmlzRW1wdHkoc3ViU2VsZWN0b3IpKVxuICAgICAgdGhyb3cgRXJyb3IoXCIkYW5kLyRvci8kbm9yIG11c3QgYmUgbm9uZW1wdHkgYXJyYXlcIik7XG4gICAgdmFyIHN1YlNlbGVjdG9yRnVuY3Rpb25zID0gXy5tYXAoXG4gICAgICBzdWJTZWxlY3RvciwgY29tcGlsZURvY3VtZW50U2VsZWN0b3IpO1xuICAgIHJldHVybiBmdW5jdGlvbiAoZG9jKSB7XG4gICAgICByZXR1cm4gXy5hbnkoc3ViU2VsZWN0b3JGdW5jdGlvbnMsIGZ1bmN0aW9uIChmKSB7XG4gICAgICAgIHJldHVybiBmKGRvYyk7XG4gICAgICB9KTtcbiAgICB9O1xuICB9LFxuXG4gIFwiJG5vclwiOiBmdW5jdGlvbihzdWJTZWxlY3Rvcikge1xuICAgIGlmICghaXNBcnJheShzdWJTZWxlY3RvcikgfHwgXy5pc0VtcHR5KHN1YlNlbGVjdG9yKSlcbiAgICAgIHRocm93IEVycm9yKFwiJGFuZC8kb3IvJG5vciBtdXN0IGJlIG5vbmVtcHR5IGFycmF5XCIpO1xuICAgIHZhciBzdWJTZWxlY3RvckZ1bmN0aW9ucyA9IF8ubWFwKFxuICAgICAgc3ViU2VsZWN0b3IsIGNvbXBpbGVEb2N1bWVudFNlbGVjdG9yKTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGRvYykge1xuICAgICAgcmV0dXJuIF8uYWxsKHN1YlNlbGVjdG9yRnVuY3Rpb25zLCBmdW5jdGlvbiAoZikge1xuICAgICAgICByZXR1cm4gIWYoZG9jKTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0sXG5cbiAgXCIkd2hlcmVcIjogZnVuY3Rpb24oc2VsZWN0b3JWYWx1ZSkge1xuICAgIGlmICghKHNlbGVjdG9yVmFsdWUgaW5zdGFuY2VvZiBGdW5jdGlvbikpIHtcbiAgICAgIHNlbGVjdG9yVmFsdWUgPSBGdW5jdGlvbihcInJldHVybiBcIiArIHNlbGVjdG9yVmFsdWUpO1xuICAgIH1cbiAgICByZXR1cm4gZnVuY3Rpb24gKGRvYykge1xuICAgICAgcmV0dXJuIHNlbGVjdG9yVmFsdWUuY2FsbChkb2MpO1xuICAgIH07XG4gIH1cbn07XG5cbnZhciBWQUxVRV9PUEVSQVRPUlMgPSB7XG4gIFwiJGluXCI6IGZ1bmN0aW9uIChvcGVyYW5kKSB7XG4gICAgaWYgKCFpc0FycmF5KG9wZXJhbmQpKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQXJndW1lbnQgdG8gJGluIG11c3QgYmUgYXJyYXlcIik7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgcmV0dXJuIF9hbnlJZkFycmF5UGx1cyh2YWx1ZSwgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIF8uYW55KG9wZXJhbmQsIGZ1bmN0aW9uIChvcGVyYW5kRWx0KSB7XG4gICAgICAgICAgcmV0dXJuIExvY2FsQ29sbGVjdGlvbi5fZi5fZXF1YWwob3BlcmFuZEVsdCwgeCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSxcblxuICBcIiRhbGxcIjogZnVuY3Rpb24gKG9wZXJhbmQpIHtcbiAgICBpZiAoIWlzQXJyYXkob3BlcmFuZCkpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJBcmd1bWVudCB0byAkYWxsIG11c3QgYmUgYXJyYXlcIik7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgaWYgKCFpc0FycmF5KHZhbHVlKSlcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgcmV0dXJuIF8uYWxsKG9wZXJhbmQsIGZ1bmN0aW9uIChvcGVyYW5kRWx0KSB7XG4gICAgICAgIHJldHVybiBfLmFueSh2YWx1ZSwgZnVuY3Rpb24gKHZhbHVlRWx0KSB7XG4gICAgICAgICAgcmV0dXJuIExvY2FsQ29sbGVjdGlvbi5fZi5fZXF1YWwob3BlcmFuZEVsdCwgdmFsdWVFbHQpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0sXG5cbiAgXCIkbHRcIjogZnVuY3Rpb24gKG9wZXJhbmQpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICByZXR1cm4gX2FueUlmQXJyYXkodmFsdWUsIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiBMb2NhbENvbGxlY3Rpb24uX2YuX2NtcCh4LCBvcGVyYW5kKSA8IDA7XG4gICAgICB9KTtcbiAgICB9O1xuICB9LFxuXG4gIFwiJGx0ZVwiOiBmdW5jdGlvbiAob3BlcmFuZCkge1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJldHVybiBfYW55SWZBcnJheSh2YWx1ZSwgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIExvY2FsQ29sbGVjdGlvbi5fZi5fY21wKHgsIG9wZXJhbmQpIDw9IDA7XG4gICAgICB9KTtcbiAgICB9O1xuICB9LFxuXG4gIFwiJGd0XCI6IGZ1bmN0aW9uIChvcGVyYW5kKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgcmV0dXJuIF9hbnlJZkFycmF5KHZhbHVlLCBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4gTG9jYWxDb2xsZWN0aW9uLl9mLl9jbXAoeCwgb3BlcmFuZCkgPiAwO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSxcblxuICBcIiRndGVcIjogZnVuY3Rpb24gKG9wZXJhbmQpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICByZXR1cm4gX2FueUlmQXJyYXkodmFsdWUsIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiBMb2NhbENvbGxlY3Rpb24uX2YuX2NtcCh4LCBvcGVyYW5kKSA+PSAwO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSxcblxuICBcIiRuZVwiOiBmdW5jdGlvbiAob3BlcmFuZCkge1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJldHVybiAhIF9hbnlJZkFycmF5UGx1cyh2YWx1ZSwgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIExvY2FsQ29sbGVjdGlvbi5fZi5fZXF1YWwoeCwgb3BlcmFuZCk7XG4gICAgICB9KTtcbiAgICB9O1xuICB9LFxuXG4gIFwiJG5pblwiOiBmdW5jdGlvbiAob3BlcmFuZCkge1xuICAgIGlmICghaXNBcnJheShvcGVyYW5kKSlcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkFyZ3VtZW50IHRvICRuaW4gbXVzdCBiZSBhcnJheVwiKTtcbiAgICB2YXIgaW5GdW5jdGlvbiA9IFZBTFVFX09QRVJBVE9SUy4kaW4ob3BlcmFuZCk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgLy8gRmllbGQgZG9lc24ndCBleGlzdCwgc28gaXQncyBub3QtaW4gb3BlcmFuZFxuICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgcmV0dXJuICFpbkZ1bmN0aW9uKHZhbHVlKTtcbiAgICB9O1xuICB9LFxuXG4gIFwiJGV4aXN0c1wiOiBmdW5jdGlvbiAob3BlcmFuZCkge1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJldHVybiBvcGVyYW5kID09PSAodmFsdWUgIT09IHVuZGVmaW5lZCk7XG4gICAgfTtcbiAgfSxcblxuICBcIiRtb2RcIjogZnVuY3Rpb24gKG9wZXJhbmQpIHtcbiAgICB2YXIgZGl2aXNvciA9IG9wZXJhbmRbMF0sXG4gICAgICAgIHJlbWFpbmRlciA9IG9wZXJhbmRbMV07XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgcmV0dXJuIF9hbnlJZkFycmF5KHZhbHVlLCBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4geCAlIGRpdmlzb3IgPT09IHJlbWFpbmRlcjtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0sXG5cbiAgXCIkc2l6ZVwiOiBmdW5jdGlvbiAob3BlcmFuZCkge1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJldHVybiBpc0FycmF5KHZhbHVlKSAmJiBvcGVyYW5kID09PSB2YWx1ZS5sZW5ndGg7XG4gICAgfTtcbiAgfSxcblxuICBcIiR0eXBlXCI6IGZ1bmN0aW9uIChvcGVyYW5kKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgLy8gQSBub25leGlzdGVudCBmaWVsZCBpcyBvZiBubyB0eXBlLlxuICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIC8vIERlZmluaXRlbHkgbm90IF9hbnlJZkFycmF5UGx1czogJHR5cGU6IDQgb25seSBtYXRjaGVzIGFycmF5cyB0aGF0IGhhdmVcbiAgICAgIC8vIGFycmF5cyBhcyBlbGVtZW50cyBhY2NvcmRpbmcgdG8gdGhlIE1vbmdvIGRvY3MuXG4gICAgICByZXR1cm4gX2FueUlmQXJyYXkodmFsdWUsIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiBMb2NhbENvbGxlY3Rpb24uX2YuX3R5cGUoeCkgPT09IG9wZXJhbmQ7XG4gICAgICB9KTtcbiAgICB9O1xuICB9LFxuXG4gIFwiJHJlZ2V4XCI6IGZ1bmN0aW9uIChvcGVyYW5kLCBvcHRpb25zKSB7XG4gICAgaWYgKG9wdGlvbnMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgLy8gT3B0aW9ucyBwYXNzZWQgaW4gJG9wdGlvbnMgKGV2ZW4gdGhlIGVtcHR5IHN0cmluZykgYWx3YXlzIG92ZXJyaWRlc1xuICAgICAgLy8gb3B0aW9ucyBpbiB0aGUgUmVnRXhwIG9iamVjdCBpdHNlbGYuXG5cbiAgICAgIC8vIEJlIGNsZWFyIHRoYXQgd2Ugb25seSBzdXBwb3J0IHRoZSBKUy1zdXBwb3J0ZWQgb3B0aW9ucywgbm90IGV4dGVuZGVkXG4gICAgICAvLyBvbmVzIChlZywgTW9uZ28gc3VwcG9ydHMgeCBhbmQgcykuIElkZWFsbHkgd2Ugd291bGQgaW1wbGVtZW50IHggYW5kIHNcbiAgICAgIC8vIGJ5IHRyYW5zZm9ybWluZyB0aGUgcmVnZXhwLCBidXQgbm90IHRvZGF5Li4uXG4gICAgICBpZiAoL1teZ2ltXS8udGVzdChvcHRpb25zKSlcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiT25seSB0aGUgaSwgbSwgYW5kIGcgcmVnZXhwIG9wdGlvbnMgYXJlIHN1cHBvcnRlZFwiKTtcblxuICAgICAgdmFyIHJlZ2V4U291cmNlID0gb3BlcmFuZCBpbnN0YW5jZW9mIFJlZ0V4cCA/IG9wZXJhbmQuc291cmNlIDogb3BlcmFuZDtcbiAgICAgIG9wZXJhbmQgPSBuZXcgUmVnRXhwKHJlZ2V4U291cmNlLCBvcHRpb25zKTtcbiAgICB9IGVsc2UgaWYgKCEob3BlcmFuZCBpbnN0YW5jZW9mIFJlZ0V4cCkpIHtcbiAgICAgIG9wZXJhbmQgPSBuZXcgUmVnRXhwKG9wZXJhbmQpO1xuICAgIH1cblxuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICByZXR1cm4gX2FueUlmQXJyYXkodmFsdWUsIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiBvcGVyYW5kLnRlc3QoeCk7XG4gICAgICB9KTtcbiAgICB9O1xuICB9LFxuXG4gIFwiJG9wdGlvbnNcIjogZnVuY3Rpb24gKG9wZXJhbmQpIHtcbiAgICAvLyBldmFsdWF0aW9uIGhhcHBlbnMgYXQgdGhlICRyZWdleCBmdW5jdGlvbiBhYm92ZVxuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHsgcmV0dXJuIHRydWU7IH07XG4gIH0sXG5cbiAgXCIkZWxlbU1hdGNoXCI6IGZ1bmN0aW9uIChvcGVyYW5kKSB7XG4gICAgdmFyIG1hdGNoZXIgPSBjb21waWxlRG9jdW1lbnRTZWxlY3RvcihvcGVyYW5kKTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICBpZiAoIWlzQXJyYXkodmFsdWUpKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICByZXR1cm4gXy5hbnkodmFsdWUsIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiBtYXRjaGVyKHgpO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSxcblxuICBcIiRub3RcIjogZnVuY3Rpb24gKG9wZXJhbmQpIHtcbiAgICB2YXIgbWF0Y2hlciA9IGNvbXBpbGVWYWx1ZVNlbGVjdG9yKG9wZXJhbmQpO1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJldHVybiAhbWF0Y2hlcih2YWx1ZSk7XG4gICAgfTtcbiAgfSxcblxuICBcIiRuZWFyXCI6IGZ1bmN0aW9uIChvcGVyYW5kKSB7XG4gICAgLy8gQWx3YXlzIHJldHVybnMgdHJ1ZS4gTXVzdCBiZSBoYW5kbGVkIGluIHBvc3QtZmlsdGVyL3NvcnQvbGltaXRcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH0sXG5cbiAgXCIkZ2VvSW50ZXJzZWN0c1wiOiBmdW5jdGlvbiAob3BlcmFuZCkge1xuICAgIC8vIEFsd2F5cyByZXR1cm5zIHRydWUuIE11c3QgYmUgaGFuZGxlZCBpbiBwb3N0LWZpbHRlci9zb3J0L2xpbWl0XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG5cbn07XG5cbi8vIGhlbHBlcnMgdXNlZCBieSBjb21waWxlZCBzZWxlY3RvciBjb2RlXG5Mb2NhbENvbGxlY3Rpb24uX2YgPSB7XG4gIC8vIFhYWCBmb3IgX2FsbCBhbmQgX2luLCBjb25zaWRlciBidWlsZGluZyAnaW5xdWVyeScgYXQgY29tcGlsZSB0aW1lLi5cblxuICBfdHlwZTogZnVuY3Rpb24gKHYpIHtcbiAgICBpZiAodHlwZW9mIHYgPT09IFwibnVtYmVyXCIpXG4gICAgICByZXR1cm4gMTtcbiAgICBpZiAodHlwZW9mIHYgPT09IFwic3RyaW5nXCIpXG4gICAgICByZXR1cm4gMjtcbiAgICBpZiAodHlwZW9mIHYgPT09IFwiYm9vbGVhblwiKVxuICAgICAgcmV0dXJuIDg7XG4gICAgaWYgKGlzQXJyYXkodikpXG4gICAgICByZXR1cm4gNDtcbiAgICBpZiAodiA9PT0gbnVsbClcbiAgICAgIHJldHVybiAxMDtcbiAgICBpZiAodiBpbnN0YW5jZW9mIFJlZ0V4cClcbiAgICAgIHJldHVybiAxMTtcbiAgICBpZiAodHlwZW9mIHYgPT09IFwiZnVuY3Rpb25cIilcbiAgICAgIC8vIG5vdGUgdGhhdCB0eXBlb2YoL3gvKSA9PT0gXCJmdW5jdGlvblwiXG4gICAgICByZXR1cm4gMTM7XG4gICAgaWYgKHYgaW5zdGFuY2VvZiBEYXRlKVxuICAgICAgcmV0dXJuIDk7XG4gICAgaWYgKEVKU09OLmlzQmluYXJ5KHYpKVxuICAgICAgcmV0dXJuIDU7XG4gICAgaWYgKHYgaW5zdGFuY2VvZiBNZXRlb3IuQ29sbGVjdGlvbi5PYmplY3RJRClcbiAgICAgIHJldHVybiA3O1xuICAgIHJldHVybiAzOyAvLyBvYmplY3RcblxuICAgIC8vIFhYWCBzdXBwb3J0IHNvbWUvYWxsIG9mIHRoZXNlOlxuICAgIC8vIDE0LCBzeW1ib2xcbiAgICAvLyAxNSwgamF2YXNjcmlwdCBjb2RlIHdpdGggc2NvcGVcbiAgICAvLyAxNiwgMTg6IDMyLWJpdC82NC1iaXQgaW50ZWdlclxuICAgIC8vIDE3LCB0aW1lc3RhbXBcbiAgICAvLyAyNTUsIG1pbmtleVxuICAgIC8vIDEyNywgbWF4a2V5XG4gIH0sXG5cbiAgLy8gZGVlcCBlcXVhbGl0eSB0ZXN0OiB1c2UgZm9yIGxpdGVyYWwgZG9jdW1lbnQgYW5kIGFycmF5IG1hdGNoZXNcbiAgX2VxdWFsOiBmdW5jdGlvbiAoYSwgYikge1xuICAgIHJldHVybiBFSlNPTi5lcXVhbHMoYSwgYiwge2tleU9yZGVyU2Vuc2l0aXZlOiB0cnVlfSk7XG4gIH0sXG5cbiAgLy8gbWFwcyBhIHR5cGUgY29kZSB0byBhIHZhbHVlIHRoYXQgY2FuIGJlIHVzZWQgdG8gc29ydCB2YWx1ZXMgb2ZcbiAgLy8gZGlmZmVyZW50IHR5cGVzXG4gIF90eXBlb3JkZXI6IGZ1bmN0aW9uICh0KSB7XG4gICAgLy8gaHR0cDovL3d3dy5tb25nb2RiLm9yZy9kaXNwbGF5L0RPQ1MvV2hhdCtpcyt0aGUrQ29tcGFyZStPcmRlcitmb3IrQlNPTitUeXBlc1xuICAgIC8vIFhYWCB3aGF0IGlzIHRoZSBjb3JyZWN0IHNvcnQgcG9zaXRpb24gZm9yIEphdmFzY3JpcHQgY29kZT9cbiAgICAvLyAoJzEwMCcgaW4gdGhlIG1hdHJpeCBiZWxvdylcbiAgICAvLyBYWFggbWlua2V5L21heGtleVxuICAgIHJldHVybiBbLTEsICAvLyAobm90IGEgdHlwZSlcbiAgICAgICAgICAgIDEsICAgLy8gbnVtYmVyXG4gICAgICAgICAgICAyLCAgIC8vIHN0cmluZ1xuICAgICAgICAgICAgMywgICAvLyBvYmplY3RcbiAgICAgICAgICAgIDQsICAgLy8gYXJyYXlcbiAgICAgICAgICAgIDUsICAgLy8gYmluYXJ5XG4gICAgICAgICAgICAtMSwgIC8vIGRlcHJlY2F0ZWRcbiAgICAgICAgICAgIDYsICAgLy8gT2JqZWN0SURcbiAgICAgICAgICAgIDcsICAgLy8gYm9vbFxuICAgICAgICAgICAgOCwgICAvLyBEYXRlXG4gICAgICAgICAgICAwLCAgIC8vIG51bGxcbiAgICAgICAgICAgIDksICAgLy8gUmVnRXhwXG4gICAgICAgICAgICAtMSwgIC8vIGRlcHJlY2F0ZWRcbiAgICAgICAgICAgIDEwMCwgLy8gSlMgY29kZVxuICAgICAgICAgICAgMiwgICAvLyBkZXByZWNhdGVkIChzeW1ib2wpXG4gICAgICAgICAgICAxMDAsIC8vIEpTIGNvZGVcbiAgICAgICAgICAgIDEsICAgLy8gMzItYml0IGludFxuICAgICAgICAgICAgOCwgICAvLyBNb25nbyB0aW1lc3RhbXBcbiAgICAgICAgICAgIDEgICAgLy8gNjQtYml0IGludFxuICAgICAgICAgICBdW3RdO1xuICB9LFxuXG4gIC8vIGNvbXBhcmUgdHdvIHZhbHVlcyBvZiB1bmtub3duIHR5cGUgYWNjb3JkaW5nIHRvIEJTT04gb3JkZXJpbmdcbiAgLy8gc2VtYW50aWNzLiAoYXMgYW4gZXh0ZW5zaW9uLCBjb25zaWRlciAndW5kZWZpbmVkJyB0byBiZSBsZXNzIHRoYW5cbiAgLy8gYW55IG90aGVyIHZhbHVlLikgcmV0dXJuIG5lZ2F0aXZlIGlmIGEgaXMgbGVzcywgcG9zaXRpdmUgaWYgYiBpc1xuICAvLyBsZXNzLCBvciAwIGlmIGVxdWFsXG4gIF9jbXA6IGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgaWYgKGEgPT09IHVuZGVmaW5lZClcbiAgICAgIHJldHVybiBiID09PSB1bmRlZmluZWQgPyAwIDogLTE7XG4gICAgaWYgKGIgPT09IHVuZGVmaW5lZClcbiAgICAgIHJldHVybiAxO1xuICAgIHZhciB0YSA9IExvY2FsQ29sbGVjdGlvbi5fZi5fdHlwZShhKTtcbiAgICB2YXIgdGIgPSBMb2NhbENvbGxlY3Rpb24uX2YuX3R5cGUoYik7XG4gICAgdmFyIG9hID0gTG9jYWxDb2xsZWN0aW9uLl9mLl90eXBlb3JkZXIodGEpO1xuICAgIHZhciBvYiA9IExvY2FsQ29sbGVjdGlvbi5fZi5fdHlwZW9yZGVyKHRiKTtcbiAgICBpZiAob2EgIT09IG9iKVxuICAgICAgcmV0dXJuIG9hIDwgb2IgPyAtMSA6IDE7XG4gICAgaWYgKHRhICE9PSB0YilcbiAgICAgIC8vIFhYWCBuZWVkIHRvIGltcGxlbWVudCB0aGlzIGlmIHdlIGltcGxlbWVudCBTeW1ib2wgb3IgaW50ZWdlcnMsIG9yXG4gICAgICAvLyBUaW1lc3RhbXBcbiAgICAgIHRocm93IEVycm9yKFwiTWlzc2luZyB0eXBlIGNvZXJjaW9uIGxvZ2ljIGluIF9jbXBcIik7XG4gICAgaWYgKHRhID09PSA3KSB7IC8vIE9iamVjdElEXG4gICAgICAvLyBDb252ZXJ0IHRvIHN0cmluZy5cbiAgICAgIHRhID0gdGIgPSAyO1xuICAgICAgYSA9IGEudG9IZXhTdHJpbmcoKTtcbiAgICAgIGIgPSBiLnRvSGV4U3RyaW5nKCk7XG4gICAgfVxuICAgIGlmICh0YSA9PT0gOSkgeyAvLyBEYXRlXG4gICAgICAvLyBDb252ZXJ0IHRvIG1pbGxpcy5cbiAgICAgIHRhID0gdGIgPSAxO1xuICAgICAgYSA9IGEuZ2V0VGltZSgpO1xuICAgICAgYiA9IGIuZ2V0VGltZSgpO1xuICAgIH1cblxuICAgIGlmICh0YSA9PT0gMSkgLy8gZG91YmxlXG4gICAgICByZXR1cm4gYSAtIGI7XG4gICAgaWYgKHRiID09PSAyKSAvLyBzdHJpbmdcbiAgICAgIHJldHVybiBhIDwgYiA/IC0xIDogKGEgPT09IGIgPyAwIDogMSk7XG4gICAgaWYgKHRhID09PSAzKSB7IC8vIE9iamVjdFxuICAgICAgLy8gdGhpcyBjb3VsZCBiZSBtdWNoIG1vcmUgZWZmaWNpZW50IGluIHRoZSBleHBlY3RlZCBjYXNlIC4uLlxuICAgICAgdmFyIHRvX2FycmF5ID0gZnVuY3Rpb24gKG9iaikge1xuICAgICAgICB2YXIgcmV0ID0gW107XG4gICAgICAgIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICAgICAgICByZXQucHVzaChrZXkpO1xuICAgICAgICAgIHJldC5wdXNoKG9ialtrZXldKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgfTtcbiAgICAgIHJldHVybiBMb2NhbENvbGxlY3Rpb24uX2YuX2NtcCh0b19hcnJheShhKSwgdG9fYXJyYXkoYikpO1xuICAgIH1cbiAgICBpZiAodGEgPT09IDQpIHsgLy8gQXJyYXlcbiAgICAgIGZvciAodmFyIGkgPSAwOyA7IGkrKykge1xuICAgICAgICBpZiAoaSA9PT0gYS5sZW5ndGgpXG4gICAgICAgICAgcmV0dXJuIChpID09PSBiLmxlbmd0aCkgPyAwIDogLTE7XG4gICAgICAgIGlmIChpID09PSBiLmxlbmd0aClcbiAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgdmFyIHMgPSBMb2NhbENvbGxlY3Rpb24uX2YuX2NtcChhW2ldLCBiW2ldKTtcbiAgICAgICAgaWYgKHMgIT09IDApXG4gICAgICAgICAgcmV0dXJuIHM7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICh0YSA9PT0gNSkgeyAvLyBiaW5hcnlcbiAgICAgIC8vIFN1cnByaXNpbmdseSwgYSBzbWFsbCBiaW5hcnkgYmxvYiBpcyBhbHdheXMgbGVzcyB0aGFuIGEgbGFyZ2Ugb25lIGluXG4gICAgICAvLyBNb25nby5cbiAgICAgIGlmIChhLmxlbmd0aCAhPT0gYi5sZW5ndGgpXG4gICAgICAgIHJldHVybiBhLmxlbmd0aCAtIGIubGVuZ3RoO1xuICAgICAgZm9yIChpID0gMDsgaSA8IGEubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGFbaV0gPCBiW2ldKVxuICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgaWYgKGFbaV0gPiBiW2ldKVxuICAgICAgICAgIHJldHVybiAxO1xuICAgICAgfVxuICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICAgIGlmICh0YSA9PT0gOCkgeyAvLyBib29sZWFuXG4gICAgICBpZiAoYSkgcmV0dXJuIGIgPyAwIDogMTtcbiAgICAgIHJldHVybiBiID8gLTEgOiAwO1xuICAgIH1cbiAgICBpZiAodGEgPT09IDEwKSAvLyBudWxsXG4gICAgICByZXR1cm4gMDtcbiAgICBpZiAodGEgPT09IDExKSAvLyByZWdleHBcbiAgICAgIHRocm93IEVycm9yKFwiU29ydGluZyBub3Qgc3VwcG9ydGVkIG9uIHJlZ3VsYXIgZXhwcmVzc2lvblwiKTsgLy8gWFhYXG4gICAgLy8gMTM6IGphdmFzY3JpcHQgY29kZVxuICAgIC8vIDE0OiBzeW1ib2xcbiAgICAvLyAxNTogamF2YXNjcmlwdCBjb2RlIHdpdGggc2NvcGVcbiAgICAvLyAxNjogMzItYml0IGludGVnZXJcbiAgICAvLyAxNzogdGltZXN0YW1wXG4gICAgLy8gMTg6IDY0LWJpdCBpbnRlZ2VyXG4gICAgLy8gMjU1OiBtaW5rZXlcbiAgICAvLyAxMjc6IG1heGtleVxuICAgIGlmICh0YSA9PT0gMTMpIC8vIGphdmFzY3JpcHQgY29kZVxuICAgICAgdGhyb3cgRXJyb3IoXCJTb3J0aW5nIG5vdCBzdXBwb3J0ZWQgb24gSmF2YXNjcmlwdCBjb2RlXCIpOyAvLyBYWFhcbiAgICB0aHJvdyBFcnJvcihcIlVua25vd24gdHlwZSB0byBzb3J0XCIpO1xuICB9XG59O1xuXG4vLyBGb3IgdW5pdCB0ZXN0cy4gVHJ1ZSBpZiB0aGUgZ2l2ZW4gZG9jdW1lbnQgbWF0Y2hlcyB0aGUgZ2l2ZW5cbi8vIHNlbGVjdG9yLlxuTG9jYWxDb2xsZWN0aW9uLl9tYXRjaGVzID0gZnVuY3Rpb24gKHNlbGVjdG9yLCBkb2MpIHtcbiAgcmV0dXJuIChMb2NhbENvbGxlY3Rpb24uX2NvbXBpbGVTZWxlY3RvcihzZWxlY3RvcikpKGRvYyk7XG59O1xuXG4vLyBfbWFrZUxvb2t1cEZ1bmN0aW9uKGtleSkgcmV0dXJucyBhIGxvb2t1cCBmdW5jdGlvbi5cbi8vXG4vLyBBIGxvb2t1cCBmdW5jdGlvbiB0YWtlcyBpbiBhIGRvY3VtZW50IGFuZCByZXR1cm5zIGFuIGFycmF5IG9mIG1hdGNoaW5nXG4vLyB2YWx1ZXMuICBUaGlzIGFycmF5IGhhcyBtb3JlIHRoYW4gb25lIGVsZW1lbnQgaWYgYW55IHNlZ21lbnQgb2YgdGhlIGtleSBvdGhlclxuLy8gdGhhbiB0aGUgbGFzdCBvbmUgaXMgYW4gYXJyYXkuICBpZSwgYW55IGFycmF5cyBmb3VuZCB3aGVuIGRvaW5nIG5vbi1maW5hbFxuLy8gbG9va3VwcyByZXN1bHQgaW4gdGhpcyBmdW5jdGlvbiBcImJyYW5jaGluZ1wiOyBlYWNoIGVsZW1lbnQgaW4gdGhlIHJldHVybmVkXG4vLyBhcnJheSByZXByZXNlbnRzIHRoZSB2YWx1ZSBmb3VuZCBhdCB0aGlzIGJyYW5jaC4gSWYgYW55IGJyYW5jaCBkb2Vzbid0IGhhdmUgYVxuLy8gZmluYWwgdmFsdWUgZm9yIHRoZSBmdWxsIGtleSwgaXRzIGVsZW1lbnQgaW4gdGhlIHJldHVybmVkIGxpc3Qgd2lsbCBiZVxuLy8gdW5kZWZpbmVkLiBJdCBhbHdheXMgcmV0dXJucyBhIG5vbi1lbXB0eSBhcnJheS5cbi8vXG4vLyBfbWFrZUxvb2t1cEZ1bmN0aW9uKCdhLngnKSh7YToge3g6IDF9fSkgcmV0dXJucyBbMV1cbi8vIF9tYWtlTG9va3VwRnVuY3Rpb24oJ2EueCcpKHthOiB7eDogWzFdfX0pIHJldHVybnMgW1sxXV1cbi8vIF9tYWtlTG9va3VwRnVuY3Rpb24oJ2EueCcpKHthOiA1fSkgIHJldHVybnMgW3VuZGVmaW5lZF1cbi8vIF9tYWtlTG9va3VwRnVuY3Rpb24oJ2EueCcpKHthOiBbe3g6IDF9LFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7eDogWzJdfSxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3k6IDN9XX0pXG4vLyAgIHJldHVybnMgWzEsIFsyXSwgdW5kZWZpbmVkXVxuTG9jYWxDb2xsZWN0aW9uLl9tYWtlTG9va3VwRnVuY3Rpb24gPSBmdW5jdGlvbiAoa2V5KSB7XG4gIHZhciBkb3RMb2NhdGlvbiA9IGtleS5pbmRleE9mKCcuJyk7XG4gIHZhciBmaXJzdCwgbG9va3VwUmVzdCwgbmV4dElzTnVtZXJpYztcbiAgaWYgKGRvdExvY2F0aW9uID09PSAtMSkge1xuICAgIGZpcnN0ID0ga2V5O1xuICB9IGVsc2Uge1xuICAgIGZpcnN0ID0ga2V5LnN1YnN0cigwLCBkb3RMb2NhdGlvbik7XG4gICAgdmFyIHJlc3QgPSBrZXkuc3Vic3RyKGRvdExvY2F0aW9uICsgMSk7XG4gICAgbG9va3VwUmVzdCA9IExvY2FsQ29sbGVjdGlvbi5fbWFrZUxvb2t1cEZ1bmN0aW9uKHJlc3QpO1xuICAgIC8vIElzIHRoZSBuZXh0IChwZXJoYXBzIGZpbmFsKSBwaWVjZSBudW1lcmljIChpZSwgYW4gYXJyYXkgbG9va3VwPylcbiAgICBuZXh0SXNOdW1lcmljID0gL15cXGQrKFxcLnwkKS8udGVzdChyZXN0KTtcbiAgfVxuXG4gIHJldHVybiBmdW5jdGlvbiAoZG9jKSB7XG4gICAgaWYgKGRvYyA9PSBudWxsKSAgLy8gbnVsbCBvciB1bmRlZmluZWRcbiAgICAgIHJldHVybiBbdW5kZWZpbmVkXTtcbiAgICB2YXIgZmlyc3RMZXZlbCA9IGRvY1tmaXJzdF07XG5cbiAgICAvLyBXZSBkb24ndCBcImJyYW5jaFwiIGF0IHRoZSBmaW5hbCBsZXZlbC5cbiAgICBpZiAoIWxvb2t1cFJlc3QpXG4gICAgICByZXR1cm4gW2ZpcnN0TGV2ZWxdO1xuXG4gICAgLy8gSXQncyBhbiBlbXB0eSBhcnJheSwgYW5kIHdlJ3JlIG5vdCBkb25lOiB3ZSB3b24ndCBmaW5kIGFueXRoaW5nLlxuICAgIGlmIChpc0FycmF5KGZpcnN0TGV2ZWwpICYmIGZpcnN0TGV2ZWwubGVuZ3RoID09PSAwKVxuICAgICAgcmV0dXJuIFt1bmRlZmluZWRdO1xuXG4gICAgLy8gRm9yIGVhY2ggcmVzdWx0IGF0IHRoaXMgbGV2ZWwsIGZpbmlzaCB0aGUgbG9va3VwIG9uIHRoZSByZXN0IG9mIHRoZSBrZXksXG4gICAgLy8gYW5kIHJldHVybiBldmVyeXRoaW5nIHdlIGZpbmQuIEFsc28sIGlmIHRoZSBuZXh0IHJlc3VsdCBpcyBhIG51bWJlcixcbiAgICAvLyBkb24ndCBicmFuY2ggaGVyZS5cbiAgICAvL1xuICAgIC8vIFRlY2huaWNhbGx5LCBpbiBNb25nb0RCLCB3ZSBzaG91bGQgYmUgYWJsZSB0byBoYW5kbGUgdGhlIGNhc2Ugd2hlcmVcbiAgICAvLyBvYmplY3RzIGhhdmUgbnVtZXJpYyBrZXlzLCBidXQgTW9uZ28gZG9lc24ndCBhY3R1YWxseSBoYW5kbGUgdGhpc1xuICAgIC8vIGNvbnNpc3RlbnRseSB5ZXQgaXRzZWxmLCBzZWUgZWdcbiAgICAvLyBodHRwczovL2ppcmEubW9uZ29kYi5vcmcvYnJvd3NlL1NFUlZFUi0yODk4XG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL21vbmdvZGIvbW9uZ28vYmxvYi9tYXN0ZXIvanN0ZXN0cy9hcnJheV9tYXRjaDIuanNcbiAgICBpZiAoIWlzQXJyYXkoZmlyc3RMZXZlbCkgfHwgbmV4dElzTnVtZXJpYylcbiAgICAgIGZpcnN0TGV2ZWwgPSBbZmlyc3RMZXZlbF07XG4gICAgcmV0dXJuIEFycmF5LnByb3RvdHlwZS5jb25jYXQuYXBwbHkoW10sIF8ubWFwKGZpcnN0TGV2ZWwsIGxvb2t1cFJlc3QpKTtcbiAgfTtcbn07XG5cbi8vIFRoZSBtYWluIGNvbXBpbGF0aW9uIGZ1bmN0aW9uIGZvciBhIGdpdmVuIHNlbGVjdG9yLlxudmFyIGNvbXBpbGVEb2N1bWVudFNlbGVjdG9yID0gZnVuY3Rpb24gKGRvY1NlbGVjdG9yKSB7XG4gIHZhciBwZXJLZXlTZWxlY3RvcnMgPSBbXTtcbiAgXy5lYWNoKGRvY1NlbGVjdG9yLCBmdW5jdGlvbiAoc3ViU2VsZWN0b3IsIGtleSkge1xuICAgIGlmIChrZXkuc3Vic3RyKDAsIDEpID09PSAnJCcpIHtcbiAgICAgIC8vIE91dGVyIG9wZXJhdG9ycyBhcmUgZWl0aGVyIGxvZ2ljYWwgb3BlcmF0b3JzICh0aGV5IHJlY3Vyc2UgYmFjayBpbnRvXG4gICAgICAvLyB0aGlzIGZ1bmN0aW9uKSwgb3IgJHdoZXJlLlxuICAgICAgaWYgKCFfLmhhcyhMT0dJQ0FMX09QRVJBVE9SUywga2V5KSlcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5yZWNvZ25pemVkIGxvZ2ljYWwgb3BlcmF0b3I6IFwiICsga2V5KTtcbiAgICAgIHBlcktleVNlbGVjdG9ycy5wdXNoKExPR0lDQUxfT1BFUkFUT1JTW2tleV0oc3ViU2VsZWN0b3IpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGxvb2tVcEJ5SW5kZXggPSBMb2NhbENvbGxlY3Rpb24uX21ha2VMb29rdXBGdW5jdGlvbihrZXkpO1xuICAgICAgdmFyIHZhbHVlU2VsZWN0b3JGdW5jID0gY29tcGlsZVZhbHVlU2VsZWN0b3Ioc3ViU2VsZWN0b3IpO1xuICAgICAgcGVyS2V5U2VsZWN0b3JzLnB1c2goZnVuY3Rpb24gKGRvYykge1xuICAgICAgICB2YXIgYnJhbmNoVmFsdWVzID0gbG9va1VwQnlJbmRleChkb2MpO1xuICAgICAgICAvLyBXZSBhcHBseSB0aGUgc2VsZWN0b3IgdG8gZWFjaCBcImJyYW5jaGVkXCIgdmFsdWUgYW5kIHJldHVybiB0cnVlIGlmIGFueVxuICAgICAgICAvLyBtYXRjaC4gVGhpcyBpc24ndCAxMDAlIGNvbnNpc3RlbnQgd2l0aCBNb25nb0RCOyBlZywgc2VlOlxuICAgICAgICAvLyBodHRwczovL2ppcmEubW9uZ29kYi5vcmcvYnJvd3NlL1NFUlZFUi04NTg1XG4gICAgICAgIHJldHVybiBfLmFueShicmFuY2hWYWx1ZXMsIHZhbHVlU2VsZWN0b3JGdW5jKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfSk7XG5cblxuICByZXR1cm4gZnVuY3Rpb24gKGRvYykge1xuICAgIHJldHVybiBfLmFsbChwZXJLZXlTZWxlY3RvcnMsIGZ1bmN0aW9uIChmKSB7XG4gICAgICByZXR1cm4gZihkb2MpO1xuICAgIH0pO1xuICB9O1xufTtcblxuLy8gR2l2ZW4gYSBzZWxlY3RvciwgcmV0dXJuIGEgZnVuY3Rpb24gdGhhdCB0YWtlcyBvbmUgYXJndW1lbnQsIGFcbi8vIGRvY3VtZW50LCBhbmQgcmV0dXJucyB0cnVlIGlmIHRoZSBkb2N1bWVudCBtYXRjaGVzIHRoZSBzZWxlY3Rvcixcbi8vIGVsc2UgZmFsc2UuXG5Mb2NhbENvbGxlY3Rpb24uX2NvbXBpbGVTZWxlY3RvciA9IGZ1bmN0aW9uIChzZWxlY3Rvcikge1xuICAvLyB5b3UgY2FuIHBhc3MgYSBsaXRlcmFsIGZ1bmN0aW9uIGluc3RlYWQgb2YgYSBzZWxlY3RvclxuICBpZiAoc2VsZWN0b3IgaW5zdGFuY2VvZiBGdW5jdGlvbilcbiAgICByZXR1cm4gZnVuY3Rpb24gKGRvYykge3JldHVybiBzZWxlY3Rvci5jYWxsKGRvYyk7fTtcblxuICAvLyBzaG9ydGhhbmQgLS0gc2NhbGFycyBtYXRjaCBfaWRcbiAgaWYgKExvY2FsQ29sbGVjdGlvbi5fc2VsZWN0b3JJc0lkKHNlbGVjdG9yKSkge1xuICAgIHJldHVybiBmdW5jdGlvbiAoZG9jKSB7XG4gICAgICByZXR1cm4gRUpTT04uZXF1YWxzKGRvYy5faWQsIHNlbGVjdG9yKTtcbiAgICB9O1xuICB9XG5cbiAgLy8gcHJvdGVjdCBhZ2FpbnN0IGRhbmdlcm91cyBzZWxlY3RvcnMuICBmYWxzZXkgYW5kIHtfaWQ6IGZhbHNleX0gYXJlIGJvdGhcbiAgLy8gbGlrZWx5IHByb2dyYW1tZXIgZXJyb3IsIGFuZCBub3Qgd2hhdCB5b3Ugd2FudCwgcGFydGljdWxhcmx5IGZvclxuICAvLyBkZXN0cnVjdGl2ZSBvcGVyYXRpb25zLlxuICBpZiAoIXNlbGVjdG9yIHx8ICgoJ19pZCcgaW4gc2VsZWN0b3IpICYmICFzZWxlY3Rvci5faWQpKVxuICAgIHJldHVybiBmdW5jdGlvbiAoZG9jKSB7cmV0dXJuIGZhbHNlO307XG5cbiAgLy8gVG9wIGxldmVsIGNhbid0IGJlIGFuIGFycmF5IG9yIHRydWUgb3IgYmluYXJ5LlxuICBpZiAodHlwZW9mKHNlbGVjdG9yKSA9PT0gJ2Jvb2xlYW4nIHx8IGlzQXJyYXkoc2VsZWN0b3IpIHx8XG4gICAgICBFSlNPTi5pc0JpbmFyeShzZWxlY3RvcikpXG4gICAgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBzZWxlY3RvcjogXCIgKyBzZWxlY3Rvcik7XG5cbiAgcmV0dXJuIGNvbXBpbGVEb2N1bWVudFNlbGVjdG9yKHNlbGVjdG9yKTtcbn07XG5cbi8vIEdpdmUgYSBzb3J0IHNwZWMsIHdoaWNoIGNhbiBiZSBpbiBhbnkgb2YgdGhlc2UgZm9ybXM6XG4vLyAgIHtcImtleTFcIjogMSwgXCJrZXkyXCI6IC0xfVxuLy8gICBbW1wia2V5MVwiLCBcImFzY1wiXSwgW1wia2V5MlwiLCBcImRlc2NcIl1dXG4vLyAgIFtcImtleTFcIiwgW1wia2V5MlwiLCBcImRlc2NcIl1dXG4vL1xuLy8gKC4uIHdpdGggdGhlIGZpcnN0IGZvcm0gYmVpbmcgZGVwZW5kZW50IG9uIHRoZSBrZXkgZW51bWVyYXRpb25cbi8vIGJlaGF2aW9yIG9mIHlvdXIgamF2YXNjcmlwdCBWTSwgd2hpY2ggdXN1YWxseSBkb2VzIHdoYXQgeW91IG1lYW4gaW5cbi8vIHRoaXMgY2FzZSBpZiB0aGUga2V5IG5hbWVzIGRvbid0IGxvb2sgbGlrZSBpbnRlZ2VycyAuLilcbi8vXG4vLyByZXR1cm4gYSBmdW5jdGlvbiB0aGF0IHRha2VzIHR3byBvYmplY3RzLCBhbmQgcmV0dXJucyAtMSBpZiB0aGVcbi8vIGZpcnN0IG9iamVjdCBjb21lcyBmaXJzdCBpbiBvcmRlciwgMSBpZiB0aGUgc2Vjb25kIG9iamVjdCBjb21lc1xuLy8gZmlyc3QsIG9yIDAgaWYgbmVpdGhlciBvYmplY3QgY29tZXMgYmVmb3JlIHRoZSBvdGhlci5cblxuTG9jYWxDb2xsZWN0aW9uLl9jb21waWxlU29ydCA9IGZ1bmN0aW9uIChzcGVjKSB7XG4gIHZhciBzb3J0U3BlY1BhcnRzID0gW107XG5cbiAgaWYgKHNwZWMgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3BlYy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHR5cGVvZiBzcGVjW2ldID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIHNvcnRTcGVjUGFydHMucHVzaCh7XG4gICAgICAgICAgbG9va3VwOiBMb2NhbENvbGxlY3Rpb24uX21ha2VMb29rdXBGdW5jdGlvbihzcGVjW2ldKSxcbiAgICAgICAgICBhc2NlbmRpbmc6IHRydWVcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzb3J0U3BlY1BhcnRzLnB1c2goe1xuICAgICAgICAgIGxvb2t1cDogTG9jYWxDb2xsZWN0aW9uLl9tYWtlTG9va3VwRnVuY3Rpb24oc3BlY1tpXVswXSksXG4gICAgICAgICAgYXNjZW5kaW5nOiBzcGVjW2ldWzFdICE9PSBcImRlc2NcIlxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSBpZiAodHlwZW9mIHNwZWMgPT09IFwib2JqZWN0XCIpIHtcbiAgICBmb3IgKHZhciBrZXkgaW4gc3BlYykge1xuICAgICAgc29ydFNwZWNQYXJ0cy5wdXNoKHtcbiAgICAgICAgbG9va3VwOiBMb2NhbENvbGxlY3Rpb24uX21ha2VMb29rdXBGdW5jdGlvbihrZXkpLFxuICAgICAgICBhc2NlbmRpbmc6IHNwZWNba2V5XSA+PSAwXG4gICAgICB9KTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgRXJyb3IoXCJCYWQgc29ydCBzcGVjaWZpY2F0aW9uOiBcIiwgSlNPTi5zdHJpbmdpZnkoc3BlYykpO1xuICB9XG5cbiAgaWYgKHNvcnRTcGVjUGFydHMubGVuZ3RoID09PSAwKVxuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7cmV0dXJuIDA7fTtcblxuICAvLyByZWR1Y2VWYWx1ZSB0YWtlcyBpbiBhbGwgdGhlIHBvc3NpYmxlIHZhbHVlcyBmb3IgdGhlIHNvcnQga2V5IGFsb25nIHZhcmlvdXNcbiAgLy8gYnJhbmNoZXMsIGFuZCByZXR1cm5zIHRoZSBtaW4gb3IgbWF4IHZhbHVlIChhY2NvcmRpbmcgdG8gdGhlIGJvb2xcbiAgLy8gZmluZE1pbikuIEVhY2ggdmFsdWUgY2FuIGl0c2VsZiBiZSBhbiBhcnJheSwgYW5kIHdlIGxvb2sgYXQgaXRzIHZhbHVlc1xuICAvLyB0b28uIChpZSwgd2UgZG8gYSBzaW5nbGUgbGV2ZWwgb2YgZmxhdHRlbmluZyBvbiBicmFuY2hWYWx1ZXMsIHRoZW4gZmluZCB0aGVcbiAgLy8gbWluL21heC4pXG4gIHZhciByZWR1Y2VWYWx1ZSA9IGZ1bmN0aW9uIChicmFuY2hWYWx1ZXMsIGZpbmRNaW4pIHtcbiAgICB2YXIgcmVkdWNlZDtcbiAgICB2YXIgZmlyc3QgPSB0cnVlO1xuICAgIC8vIEl0ZXJhdGUgb3ZlciBhbGwgdGhlIHZhbHVlcyBmb3VuZCBpbiBhbGwgdGhlIGJyYW5jaGVzLCBhbmQgaWYgYSB2YWx1ZSBpc1xuICAgIC8vIGFuIGFycmF5IGl0c2VsZiwgaXRlcmF0ZSBvdmVyIHRoZSB2YWx1ZXMgaW4gdGhlIGFycmF5IHNlcGFyYXRlbHkuXG4gICAgXy5lYWNoKGJyYW5jaFZhbHVlcywgZnVuY3Rpb24gKGJyYW5jaFZhbHVlKSB7XG4gICAgICAvLyBWYWx1ZSBub3QgYW4gYXJyYXk/IFByZXRlbmQgaXQgaXMuXG4gICAgICBpZiAoIWlzQXJyYXkoYnJhbmNoVmFsdWUpKVxuICAgICAgICBicmFuY2hWYWx1ZSA9IFticmFuY2hWYWx1ZV07XG4gICAgICAvLyBWYWx1ZSBpcyBhbiBlbXB0eSBhcnJheT8gUHJldGVuZCBpdCB3YXMgbWlzc2luZywgc2luY2UgdGhhdCdzIHdoZXJlIGl0XG4gICAgICAvLyBzaG91bGQgYmUgc29ydGVkLlxuICAgICAgaWYgKGlzQXJyYXkoYnJhbmNoVmFsdWUpICYmIGJyYW5jaFZhbHVlLmxlbmd0aCA9PT0gMClcbiAgICAgICAgYnJhbmNoVmFsdWUgPSBbdW5kZWZpbmVkXTtcbiAgICAgIF8uZWFjaChicmFuY2hWYWx1ZSwgZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIC8vIFdlIHNob3VsZCBnZXQgaGVyZSBhdCBsZWFzdCBvbmNlOiBsb29rdXAgZnVuY3Rpb25zIHJldHVybiBub24tZW1wdHlcbiAgICAgICAgLy8gYXJyYXlzLCBzbyB0aGUgb3V0ZXIgbG9vcCBydW5zIGF0IGxlYXN0IG9uY2UsIGFuZCB3ZSBwcmV2ZW50ZWRcbiAgICAgICAgLy8gYnJhbmNoVmFsdWUgZnJvbSBiZWluZyBhbiBlbXB0eSBhcnJheS5cbiAgICAgICAgaWYgKGZpcnN0KSB7XG4gICAgICAgICAgcmVkdWNlZCA9IHZhbHVlO1xuICAgICAgICAgIGZpcnN0ID0gZmFsc2U7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gQ29tcGFyZSB0aGUgdmFsdWUgd2UgZm91bmQgdG8gdGhlIHZhbHVlIHdlIGZvdW5kIHNvIGZhciwgc2F2aW5nIGl0XG4gICAgICAgICAgLy8gaWYgaXQncyBsZXNzIChmb3IgYW4gYXNjZW5kaW5nIHNvcnQpIG9yIG1vcmUgKGZvciBhIGRlc2NlbmRpbmdcbiAgICAgICAgICAvLyBzb3J0KS5cbiAgICAgICAgICB2YXIgY21wID0gTG9jYWxDb2xsZWN0aW9uLl9mLl9jbXAocmVkdWNlZCwgdmFsdWUpO1xuICAgICAgICAgIGlmICgoZmluZE1pbiAmJiBjbXAgPiAwKSB8fCAoIWZpbmRNaW4gJiYgY21wIDwgMCkpXG4gICAgICAgICAgICByZWR1Y2VkID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIHJldHVybiByZWR1Y2VkO1xuICB9O1xuXG4gIHJldHVybiBmdW5jdGlvbiAoYSwgYikge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc29ydFNwZWNQYXJ0cy5sZW5ndGg7ICsraSkge1xuICAgICAgdmFyIHNwZWNQYXJ0ID0gc29ydFNwZWNQYXJ0c1tpXTtcbiAgICAgIHZhciBhVmFsdWUgPSByZWR1Y2VWYWx1ZShzcGVjUGFydC5sb29rdXAoYSksIHNwZWNQYXJ0LmFzY2VuZGluZyk7XG4gICAgICB2YXIgYlZhbHVlID0gcmVkdWNlVmFsdWUoc3BlY1BhcnQubG9va3VwKGIpLCBzcGVjUGFydC5hc2NlbmRpbmcpO1xuICAgICAgdmFyIGNvbXBhcmUgPSBMb2NhbENvbGxlY3Rpb24uX2YuX2NtcChhVmFsdWUsIGJWYWx1ZSk7XG4gICAgICBpZiAoY29tcGFyZSAhPT0gMClcbiAgICAgICAgcmV0dXJuIHNwZWNQYXJ0LmFzY2VuZGluZyA/IGNvbXBhcmUgOiAtY29tcGFyZTtcbiAgICB9O1xuICAgIHJldHVybiAwO1xuICB9O1xufTtcblxuZXhwb3J0cy5jb21waWxlRG9jdW1lbnRTZWxlY3RvciA9IGNvbXBpbGVEb2N1bWVudFNlbGVjdG9yO1xuZXhwb3J0cy5jb21waWxlU29ydCA9IExvY2FsQ29sbGVjdGlvbi5fY29tcGlsZVNvcnQ7IiwiUGFnZSA9IHJlcXVpcmUoXCIuLi9QYWdlXCIpXG5Mb2NhdGlvbkZpbmRlciA9IHJlcXVpcmUgJy4uL0xvY2F0aW9uRmluZGVyJ1xuR2VvSlNPTiA9IHJlcXVpcmUgJy4uL0dlb0pTT04nXG5cbiMgVE9ETyBzb3VyY2Ugc2VhcmNoXG5cbiMgTGlzdHMgbmVhcmJ5IGFuZCB1bmxvY2F0ZWQgc291cmNlc1xuIyBPcHRpb25zOiBvblNlbGVjdCAtIGZ1bmN0aW9uIHRvIGNhbGwgd2l0aCBzb3VyY2UgZG9jIHdoZW4gc2VsZWN0ZWRcbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgU291cmNlTGlzdFBhZ2UgZXh0ZW5kcyBQYWdlXG4gIGV2ZW50czogXG4gICAgJ2NsaWNrIHRyLnRhcHBhYmxlJyA6ICdzb3VyY2VDbGlja2VkJ1xuICAgICdjbGljayAjc2VhcmNoX2NhbmNlbCcgOiAnY2FuY2VsU2VhcmNoJ1xuXG4gIGNyZWF0ZTogLT5cbiAgICBAc2V0VGl0bGUgJ05lYXJieSBTb3VyY2VzJ1xuXG4gIGFjdGl2YXRlOiAtPlxuICAgIEAkZWwuaHRtbCB0ZW1wbGF0ZXNbJ3BhZ2VzL1NvdXJjZUxpc3RQYWdlJ10oKVxuICAgIEBuZWFyU291cmNlcyA9IFtdXG4gICAgQHVubG9jYXRlZFNvdXJjZXMgPSBbXVxuXG4gICAgIyBGaW5kIGxvY2F0aW9uXG4gICAgQGxvY2F0aW9uRmluZGVyID0gbmV3IExvY2F0aW9uRmluZGVyKClcbiAgICBAbG9jYXRpb25GaW5kZXIub24oJ2ZvdW5kJywgQGxvY2F0aW9uRm91bmQpLm9uKCdlcnJvcicsIEBsb2NhdGlvbkVycm9yKVxuICAgIEBsb2NhdGlvbkZpbmRlci5nZXRMb2NhdGlvbigpXG4gICAgQCQoXCIjbG9jYXRpb25fbXNnXCIpLnNob3coKVxuXG4gICAgQHNldHVwQnV0dG9uQmFyIFtcbiAgICAgIHsgaWNvbjogXCJzZWFyY2gucG5nXCIsIGNsaWNrOiA9PiBAc2VhcmNoKCkgfVxuICAgICAgeyBpY29uOiBcInBsdXMucG5nXCIsIGNsaWNrOiA9PiBAYWRkU291cmNlKCkgfVxuICAgIF1cblxuICAgICMgUXVlcnkgZGF0YWJhc2UgZm9yIHVubG9jYXRlZCBzb3VyY2VzICMgVE9ETyBvbmx5IGJ5IHVzZXJcbiAgICBAZGIuc291cmNlcy5maW5kKGdlbzogeyRleGlzdHM6ZmFsc2V9KS5mZXRjaCAoc291cmNlcykgPT5cbiAgICAgIEB1bmxvY2F0ZWRTb3VyY2VzID0gc291cmNlc1xuICAgICAgQHJlbmRlckxpc3QoKVxuXG4gICAgQHBlcmZvcm1TZWFyY2goKVxuXG4gIGFkZFNvdXJjZTogLT5cbiAgICBAcGFnZXIub3BlblBhZ2UocmVxdWlyZShcIi4vTmV3U291cmNlUGFnZVwiKSlcbiAgICBcbiAgbG9jYXRpb25Gb3VuZDogKHBvcykgPT5cbiAgICBAJChcIiNsb2NhdGlvbl9tc2dcIikuaGlkZSgpXG4gICAgc2VsZWN0b3IgPSBnZW86IFxuICAgICAgJG5lYXI6IFxuICAgICAgICAkZ2VvbWV0cnk6IEdlb0pTT04ucG9zVG9Qb2ludChwb3MpXG5cbiAgICAjIFF1ZXJ5IGRhdGFiYXNlIGZvciBuZWFyIHNvdXJjZXNcbiAgICBAZGIuc291cmNlcy5maW5kKHNlbGVjdG9yKS5mZXRjaCAoc291cmNlcykgPT5cbiAgICAgIEBuZWFyU291cmNlcyA9IHNvdXJjZXNcbiAgICAgIEByZW5kZXJMaXN0KClcblxuICByZW5kZXJMaXN0OiAtPlxuICAgICMgQXBwZW5kIGxvY2F0ZWQgYW5kIHVubG9jYXRlZCBzb3VyY2VzXG4gICAgaWYgbm90IEBzZWFyY2hUZXh0XG4gICAgICBzb3VyY2VzID0gQHVubG9jYXRlZFNvdXJjZXMuY29uY2F0KEBuZWFyU291cmNlcylcbiAgICBlbHNlXG4gICAgICBzb3VyY2VzID0gQHNlYXJjaFNvdXJjZXNcblxuICAgIEAkKFwiI3RhYmxlXCIpLmh0bWwgdGVtcGxhdGVzWydwYWdlcy9Tb3VyY2VMaXN0UGFnZV9pdGVtcyddKHNvdXJjZXM6c291cmNlcylcblxuICBsb2NhdGlvbkVycm9yOiAocG9zKSA9PlxuICAgIEAkKFwiI2xvY2F0aW9uX21zZ1wiKS5oaWRlKClcbiAgICBAcGFnZXIuZmxhc2ggXCJVbmFibGUgdG8gZGV0ZXJtaW5lIGxvY2F0aW9uXCIsIFwiZXJyb3JcIlxuXG4gIHNvdXJjZUNsaWNrZWQ6IChldikgLT5cbiAgICAjIFdyYXAgb25TZWxlY3RcbiAgICBvblNlbGVjdCA9IHVuZGVmaW5lZFxuICAgIGlmIEBvcHRpb25zLm9uU2VsZWN0XG4gICAgICBvblNlbGVjdCA9IChzb3VyY2UpID0+XG4gICAgICAgIEBwYWdlci5jbG9zZVBhZ2UoKVxuICAgICAgICBAb3B0aW9ucy5vblNlbGVjdChzb3VyY2UpXG4gICAgQHBhZ2VyLm9wZW5QYWdlKHJlcXVpcmUoXCIuL1NvdXJjZVBhZ2VcIiksIHsgX2lkOiBldi5jdXJyZW50VGFyZ2V0LmlkLCBvblNlbGVjdDogb25TZWxlY3R9KVxuXG4gIHNlYXJjaDogLT5cbiAgICAjIFByb21wdCBmb3Igc2VhcmNoXG4gICAgQHNlYXJjaFRleHQgPSBwcm9tcHQoXCJFbnRlciBzZWFyY2ggdGV4dCBvciBJRCBvZiB3YXRlciBzb3VyY2VcIilcbiAgICBAcGVyZm9ybVNlYXJjaCgpXG5cbiAgcGVyZm9ybVNlYXJjaDogLT5cbiAgICBAJChcIiNzZWFyY2hfYmFyXCIpLnRvZ2dsZShAc2VhcmNoVGV4dCBhbmQgQHNlYXJjaFRleHQubGVuZ3RoPjApXG4gICAgQCQoXCIjc2VhcmNoX3RleHRcIikudGV4dChAc2VhcmNoVGV4dClcbiAgICBpZiBAc2VhcmNoVGV4dFxuICAgICAgIyBJZiBkaWdpdHMsIHNlYXJjaCBmb3IgY29kZVxuICAgICAgaWYgQHNlYXJjaFRleHQubWF0Y2goL15cXGQrJC8pXG4gICAgICAgIHNlbGVjdG9yID0geyBjb2RlOiBAc2VhcmNoVGV4dCB9XG4gICAgICBlbHNlXG4gICAgICAgIHNlbGVjdG9yID0geyBuYW1lOiBuZXcgUmVnRXhwKEBzZWFyY2hUZXh0LFwiaVwiKX1cbiAgICAgICAgXG4gICAgICBAZGIuc291cmNlcy5maW5kKHNlbGVjdG9yLCB7bGltaXQ6IDUwfSkuZmV0Y2ggKHNvdXJjZXMpID0+XG4gICAgICAgIEBzZWFyY2hTb3VyY2VzID0gc291cmNlc1xuICAgICAgICBAcmVuZGVyTGlzdCgpXG4gICAgZWxzZVxuICAgICAgQHJlbmRlckxpc3QoKVxuXG4gIGNhbmNlbFNlYXJjaDogLT5cbiAgICBAc2VhcmNoVGV4dCA9IFwiXCJcbiAgICBAcGVyZm9ybVNlYXJjaCgpXG5cbiIsIkVKU09OID0ge307IC8vIEdsb2JhbCFcbnZhciBjdXN0b21UeXBlcyA9IHt9O1xuLy8gQWRkIGEgY3VzdG9tIHR5cGUsIHVzaW5nIGEgbWV0aG9kIG9mIHlvdXIgY2hvaWNlIHRvIGdldCB0byBhbmRcbi8vIGZyb20gYSBiYXNpYyBKU09OLWFibGUgcmVwcmVzZW50YXRpb24uICBUaGUgZmFjdG9yeSBhcmd1bWVudFxuLy8gaXMgYSBmdW5jdGlvbiBvZiBKU09OLWFibGUgLS0+IHlvdXIgb2JqZWN0XG4vLyBUaGUgdHlwZSB5b3UgYWRkIG11c3QgaGF2ZTpcbi8vIC0gQSBjbG9uZSgpIG1ldGhvZCwgc28gdGhhdCBNZXRlb3IgY2FuIGRlZXAtY29weSBpdCB3aGVuIG5lY2Vzc2FyeS5cbi8vIC0gQSBlcXVhbHMoKSBtZXRob2QsIHNvIHRoYXQgTWV0ZW9yIGNhbiBjb21wYXJlIGl0XG4vLyAtIEEgdG9KU09OVmFsdWUoKSBtZXRob2QsIHNvIHRoYXQgTWV0ZW9yIGNhbiBzZXJpYWxpemUgaXRcbi8vIC0gYSB0eXBlTmFtZSgpIG1ldGhvZCwgdG8gc2hvdyBob3cgdG8gbG9vayBpdCB1cCBpbiBvdXIgdHlwZSB0YWJsZS5cbi8vIEl0IGlzIG9rYXkgaWYgdGhlc2UgbWV0aG9kcyBhcmUgbW9ua2V5LXBhdGNoZWQgb24uXG5FSlNPTi5hZGRUeXBlID0gZnVuY3Rpb24gKG5hbWUsIGZhY3RvcnkpIHtcbiAgaWYgKF8uaGFzKGN1c3RvbVR5cGVzLCBuYW1lKSlcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJUeXBlIFwiICsgbmFtZSArIFwiIGFscmVhZHkgcHJlc2VudFwiKTtcbiAgY3VzdG9tVHlwZXNbbmFtZV0gPSBmYWN0b3J5O1xufTtcblxudmFyIGJ1aWx0aW5Db252ZXJ0ZXJzID0gW1xuICB7IC8vIERhdGVcbiAgICBtYXRjaEpTT05WYWx1ZTogZnVuY3Rpb24gKG9iaikge1xuICAgICAgcmV0dXJuIF8uaGFzKG9iaiwgJyRkYXRlJykgJiYgXy5zaXplKG9iaikgPT09IDE7XG4gICAgfSxcbiAgICBtYXRjaE9iamVjdDogZnVuY3Rpb24gKG9iaikge1xuICAgICAgcmV0dXJuIG9iaiBpbnN0YW5jZW9mIERhdGU7XG4gICAgfSxcbiAgICB0b0pTT05WYWx1ZTogZnVuY3Rpb24gKG9iaikge1xuICAgICAgcmV0dXJuIHskZGF0ZTogb2JqLmdldFRpbWUoKX07XG4gICAgfSxcbiAgICBmcm9tSlNPTlZhbHVlOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICByZXR1cm4gbmV3IERhdGUob2JqLiRkYXRlKTtcbiAgICB9XG4gIH0sXG4gIHsgLy8gQmluYXJ5XG4gICAgbWF0Y2hKU09OVmFsdWU6IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgIHJldHVybiBfLmhhcyhvYmosICckYmluYXJ5JykgJiYgXy5zaXplKG9iaikgPT09IDE7XG4gICAgfSxcbiAgICBtYXRjaE9iamVjdDogZnVuY3Rpb24gKG9iaikge1xuICAgICAgcmV0dXJuIHR5cGVvZiBVaW50OEFycmF5ICE9PSAndW5kZWZpbmVkJyAmJiBvYmogaW5zdGFuY2VvZiBVaW50OEFycmF5XG4gICAgICAgIHx8IChvYmogJiYgXy5oYXMob2JqLCAnJFVpbnQ4QXJyYXlQb2x5ZmlsbCcpKTtcbiAgICB9LFxuICAgIHRvSlNPTlZhbHVlOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICByZXR1cm4geyRiaW5hcnk6IEVKU09OLl9iYXNlNjRFbmNvZGUob2JqKX07XG4gICAgfSxcbiAgICBmcm9tSlNPTlZhbHVlOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICByZXR1cm4gRUpTT04uX2Jhc2U2NERlY29kZShvYmouJGJpbmFyeSk7XG4gICAgfVxuICB9LFxuICB7IC8vIEVzY2FwaW5nIG9uZSBsZXZlbFxuICAgIG1hdGNoSlNPTlZhbHVlOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICByZXR1cm4gXy5oYXMob2JqLCAnJGVzY2FwZScpICYmIF8uc2l6ZShvYmopID09PSAxO1xuICAgIH0sXG4gICAgbWF0Y2hPYmplY3Q6IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgIGlmIChfLmlzRW1wdHkob2JqKSB8fCBfLnNpemUob2JqKSA+IDIpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIF8uYW55KGJ1aWx0aW5Db252ZXJ0ZXJzLCBmdW5jdGlvbiAoY29udmVydGVyKSB7XG4gICAgICAgIHJldHVybiBjb252ZXJ0ZXIubWF0Y2hKU09OVmFsdWUob2JqKTtcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgdG9KU09OVmFsdWU6IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgIHZhciBuZXdPYmogPSB7fTtcbiAgICAgIF8uZWFjaChvYmosIGZ1bmN0aW9uICh2YWx1ZSwga2V5KSB7XG4gICAgICAgIG5ld09ialtrZXldID0gRUpTT04udG9KU09OVmFsdWUodmFsdWUpO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4geyRlc2NhcGU6IG5ld09ian07XG4gICAgfSxcbiAgICBmcm9tSlNPTlZhbHVlOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICB2YXIgbmV3T2JqID0ge307XG4gICAgICBfLmVhY2gob2JqLiRlc2NhcGUsIGZ1bmN0aW9uICh2YWx1ZSwga2V5KSB7XG4gICAgICAgIG5ld09ialtrZXldID0gRUpTT04uZnJvbUpTT05WYWx1ZSh2YWx1ZSk7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBuZXdPYmo7XG4gICAgfVxuICB9LFxuICB7IC8vIEN1c3RvbVxuICAgIG1hdGNoSlNPTlZhbHVlOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICByZXR1cm4gXy5oYXMob2JqLCAnJHR5cGUnKSAmJiBfLmhhcyhvYmosICckdmFsdWUnKSAmJiBfLnNpemUob2JqKSA9PT0gMjtcbiAgICB9LFxuICAgIG1hdGNoT2JqZWN0OiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICByZXR1cm4gRUpTT04uX2lzQ3VzdG9tVHlwZShvYmopO1xuICAgIH0sXG4gICAgdG9KU09OVmFsdWU6IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgIHJldHVybiB7JHR5cGU6IG9iai50eXBlTmFtZSgpLCAkdmFsdWU6IG9iai50b0pTT05WYWx1ZSgpfTtcbiAgICB9LFxuICAgIGZyb21KU09OVmFsdWU6IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgIHZhciB0eXBlTmFtZSA9IG9iai4kdHlwZTtcbiAgICAgIHZhciBjb252ZXJ0ZXIgPSBjdXN0b21UeXBlc1t0eXBlTmFtZV07XG4gICAgICByZXR1cm4gY29udmVydGVyKG9iai4kdmFsdWUpO1xuICAgIH1cbiAgfVxuXTtcblxuRUpTT04uX2lzQ3VzdG9tVHlwZSA9IGZ1bmN0aW9uIChvYmopIHtcbiAgcmV0dXJuIG9iaiAmJlxuICAgIHR5cGVvZiBvYmoudG9KU09OVmFsdWUgPT09ICdmdW5jdGlvbicgJiZcbiAgICB0eXBlb2Ygb2JqLnR5cGVOYW1lID09PSAnZnVuY3Rpb24nICYmXG4gICAgXy5oYXMoY3VzdG9tVHlwZXMsIG9iai50eXBlTmFtZSgpKTtcbn07XG5cblxuLy9mb3IgYm90aCBhcnJheXMgYW5kIG9iamVjdHMsIGluLXBsYWNlIG1vZGlmaWNhdGlvbi5cbnZhciBhZGp1c3RUeXBlc1RvSlNPTlZhbHVlID1cbkVKU09OLl9hZGp1c3RUeXBlc1RvSlNPTlZhbHVlID0gZnVuY3Rpb24gKG9iaikge1xuICBpZiAob2JqID09PSBudWxsKVxuICAgIHJldHVybiBudWxsO1xuICB2YXIgbWF5YmVDaGFuZ2VkID0gdG9KU09OVmFsdWVIZWxwZXIob2JqKTtcbiAgaWYgKG1heWJlQ2hhbmdlZCAhPT0gdW5kZWZpbmVkKVxuICAgIHJldHVybiBtYXliZUNoYW5nZWQ7XG4gIF8uZWFjaChvYmosIGZ1bmN0aW9uICh2YWx1ZSwga2V5KSB7XG4gICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ29iamVjdCcgJiYgdmFsdWUgIT09IHVuZGVmaW5lZClcbiAgICAgIHJldHVybjsgLy8gY29udGludWVcbiAgICB2YXIgY2hhbmdlZCA9IHRvSlNPTlZhbHVlSGVscGVyKHZhbHVlKTtcbiAgICBpZiAoY2hhbmdlZCkge1xuICAgICAgb2JqW2tleV0gPSBjaGFuZ2VkO1xuICAgICAgcmV0dXJuOyAvLyBvbiB0byB0aGUgbmV4dCBrZXlcbiAgICB9XG4gICAgLy8gaWYgd2UgZ2V0IGhlcmUsIHZhbHVlIGlzIGFuIG9iamVjdCBidXQgbm90IGFkanVzdGFibGVcbiAgICAvLyBhdCB0aGlzIGxldmVsLiAgcmVjdXJzZS5cbiAgICBhZGp1c3RUeXBlc1RvSlNPTlZhbHVlKHZhbHVlKTtcbiAgfSk7XG4gIHJldHVybiBvYmo7XG59O1xuXG4vLyBFaXRoZXIgcmV0dXJuIHRoZSBKU09OLWNvbXBhdGlibGUgdmVyc2lvbiBvZiB0aGUgYXJndW1lbnQsIG9yIHVuZGVmaW5lZCAoaWZcbi8vIHRoZSBpdGVtIGlzbid0IGl0c2VsZiByZXBsYWNlYWJsZSwgYnV0IG1heWJlIHNvbWUgZmllbGRzIGluIGl0IGFyZSlcbnZhciB0b0pTT05WYWx1ZUhlbHBlciA9IGZ1bmN0aW9uIChpdGVtKSB7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYnVpbHRpbkNvbnZlcnRlcnMubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgY29udmVydGVyID0gYnVpbHRpbkNvbnZlcnRlcnNbaV07XG4gICAgaWYgKGNvbnZlcnRlci5tYXRjaE9iamVjdChpdGVtKSkge1xuICAgICAgcmV0dXJuIGNvbnZlcnRlci50b0pTT05WYWx1ZShpdGVtKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHVuZGVmaW5lZDtcbn07XG5cbkVKU09OLnRvSlNPTlZhbHVlID0gZnVuY3Rpb24gKGl0ZW0pIHtcbiAgdmFyIGNoYW5nZWQgPSB0b0pTT05WYWx1ZUhlbHBlcihpdGVtKTtcbiAgaWYgKGNoYW5nZWQgIT09IHVuZGVmaW5lZClcbiAgICByZXR1cm4gY2hhbmdlZDtcbiAgaWYgKHR5cGVvZiBpdGVtID09PSAnb2JqZWN0Jykge1xuICAgIGl0ZW0gPSBFSlNPTi5jbG9uZShpdGVtKTtcbiAgICBhZGp1c3RUeXBlc1RvSlNPTlZhbHVlKGl0ZW0pO1xuICB9XG4gIHJldHVybiBpdGVtO1xufTtcblxuLy9mb3IgYm90aCBhcnJheXMgYW5kIG9iamVjdHMuIFRyaWVzIGl0cyBiZXN0IHRvIGp1c3Rcbi8vIHVzZSB0aGUgb2JqZWN0IHlvdSBoYW5kIGl0LCBidXQgbWF5IHJldHVybiBzb21ldGhpbmdcbi8vIGRpZmZlcmVudCBpZiB0aGUgb2JqZWN0IHlvdSBoYW5kIGl0IGl0c2VsZiBuZWVkcyBjaGFuZ2luZy5cbnZhciBhZGp1c3RUeXBlc0Zyb21KU09OVmFsdWUgPVxuRUpTT04uX2FkanVzdFR5cGVzRnJvbUpTT05WYWx1ZSA9IGZ1bmN0aW9uIChvYmopIHtcbiAgaWYgKG9iaiA9PT0gbnVsbClcbiAgICByZXR1cm4gbnVsbDtcbiAgdmFyIG1heWJlQ2hhbmdlZCA9IGZyb21KU09OVmFsdWVIZWxwZXIob2JqKTtcbiAgaWYgKG1heWJlQ2hhbmdlZCAhPT0gb2JqKVxuICAgIHJldHVybiBtYXliZUNoYW5nZWQ7XG4gIF8uZWFjaChvYmosIGZ1bmN0aW9uICh2YWx1ZSwga2V5KSB7XG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgIHZhciBjaGFuZ2VkID0gZnJvbUpTT05WYWx1ZUhlbHBlcih2YWx1ZSk7XG4gICAgICBpZiAodmFsdWUgIT09IGNoYW5nZWQpIHtcbiAgICAgICAgb2JqW2tleV0gPSBjaGFuZ2VkO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICAvLyBpZiB3ZSBnZXQgaGVyZSwgdmFsdWUgaXMgYW4gb2JqZWN0IGJ1dCBub3QgYWRqdXN0YWJsZVxuICAgICAgLy8gYXQgdGhpcyBsZXZlbC4gIHJlY3Vyc2UuXG4gICAgICBhZGp1c3RUeXBlc0Zyb21KU09OVmFsdWUodmFsdWUpO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiBvYmo7XG59O1xuXG4vLyBFaXRoZXIgcmV0dXJuIHRoZSBhcmd1bWVudCBjaGFuZ2VkIHRvIGhhdmUgdGhlIG5vbi1qc29uXG4vLyByZXAgb2YgaXRzZWxmICh0aGUgT2JqZWN0IHZlcnNpb24pIG9yIHRoZSBhcmd1bWVudCBpdHNlbGYuXG5cbi8vIERPRVMgTk9UIFJFQ1VSU0UuICBGb3IgYWN0dWFsbHkgZ2V0dGluZyB0aGUgZnVsbHktY2hhbmdlZCB2YWx1ZSwgdXNlXG4vLyBFSlNPTi5mcm9tSlNPTlZhbHVlXG52YXIgZnJvbUpTT05WYWx1ZUhlbHBlciA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICBpZiAodHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiB2YWx1ZSAhPT0gbnVsbCkge1xuICAgIGlmIChfLnNpemUodmFsdWUpIDw9IDJcbiAgICAgICAgJiYgXy5hbGwodmFsdWUsIGZ1bmN0aW9uICh2LCBrKSB7XG4gICAgICAgICAgcmV0dXJuIHR5cGVvZiBrID09PSAnc3RyaW5nJyAmJiBrLnN1YnN0cigwLCAxKSA9PT0gJyQnO1xuICAgICAgICB9KSkge1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBidWlsdGluQ29udmVydGVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgY29udmVydGVyID0gYnVpbHRpbkNvbnZlcnRlcnNbaV07XG4gICAgICAgIGlmIChjb252ZXJ0ZXIubWF0Y2hKU09OVmFsdWUodmFsdWUpKSB7XG4gICAgICAgICAgcmV0dXJuIGNvbnZlcnRlci5mcm9tSlNPTlZhbHVlKHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gdmFsdWU7XG59O1xuXG5FSlNPTi5mcm9tSlNPTlZhbHVlID0gZnVuY3Rpb24gKGl0ZW0pIHtcbiAgdmFyIGNoYW5nZWQgPSBmcm9tSlNPTlZhbHVlSGVscGVyKGl0ZW0pO1xuICBpZiAoY2hhbmdlZCA9PT0gaXRlbSAmJiB0eXBlb2YgaXRlbSA9PT0gJ29iamVjdCcpIHtcbiAgICBpdGVtID0gRUpTT04uY2xvbmUoaXRlbSk7XG4gICAgYWRqdXN0VHlwZXNGcm9tSlNPTlZhbHVlKGl0ZW0pO1xuICAgIHJldHVybiBpdGVtO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBjaGFuZ2VkO1xuICB9XG59O1xuXG5FSlNPTi5zdHJpbmdpZnkgPSBmdW5jdGlvbiAoaXRlbSkge1xuICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoRUpTT04udG9KU09OVmFsdWUoaXRlbSkpO1xufTtcblxuRUpTT04ucGFyc2UgPSBmdW5jdGlvbiAoaXRlbSkge1xuICByZXR1cm4gRUpTT04uZnJvbUpTT05WYWx1ZShKU09OLnBhcnNlKGl0ZW0pKTtcbn07XG5cbkVKU09OLmlzQmluYXJ5ID0gZnVuY3Rpb24gKG9iaikge1xuICByZXR1cm4gKHR5cGVvZiBVaW50OEFycmF5ICE9PSAndW5kZWZpbmVkJyAmJiBvYmogaW5zdGFuY2VvZiBVaW50OEFycmF5KSB8fFxuICAgIChvYmogJiYgb2JqLiRVaW50OEFycmF5UG9seWZpbGwpO1xufTtcblxuRUpTT04uZXF1YWxzID0gZnVuY3Rpb24gKGEsIGIsIG9wdGlvbnMpIHtcbiAgdmFyIGk7XG4gIHZhciBrZXlPcmRlclNlbnNpdGl2ZSA9ICEhKG9wdGlvbnMgJiYgb3B0aW9ucy5rZXlPcmRlclNlbnNpdGl2ZSk7XG4gIGlmIChhID09PSBiKVxuICAgIHJldHVybiB0cnVlO1xuICBpZiAoIWEgfHwgIWIpIC8vIGlmIGVpdGhlciBvbmUgaXMgZmFsc3ksIHRoZXknZCBoYXZlIHRvIGJlID09PSB0byBiZSBlcXVhbFxuICAgIHJldHVybiBmYWxzZTtcbiAgaWYgKCEodHlwZW9mIGEgPT09ICdvYmplY3QnICYmIHR5cGVvZiBiID09PSAnb2JqZWN0JykpXG4gICAgcmV0dXJuIGZhbHNlO1xuICBpZiAoYSBpbnN0YW5jZW9mIERhdGUgJiYgYiBpbnN0YW5jZW9mIERhdGUpXG4gICAgcmV0dXJuIGEudmFsdWVPZigpID09PSBiLnZhbHVlT2YoKTtcbiAgaWYgKEVKU09OLmlzQmluYXJ5KGEpICYmIEVKU09OLmlzQmluYXJ5KGIpKSB7XG4gICAgaWYgKGEubGVuZ3RoICE9PSBiLmxlbmd0aClcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgYS5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKGFbaV0gIT09IGJbaV0pXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgaWYgKHR5cGVvZiAoYS5lcXVhbHMpID09PSAnZnVuY3Rpb24nKVxuICAgIHJldHVybiBhLmVxdWFscyhiLCBvcHRpb25zKTtcbiAgaWYgKGEgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgIGlmICghKGIgaW5zdGFuY2VvZiBBcnJheSkpXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgaWYgKGEubGVuZ3RoICE9PSBiLmxlbmd0aClcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgYS5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKCFFSlNPTi5lcXVhbHMoYVtpXSwgYltpXSwgb3B0aW9ucykpXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgLy8gZmFsbCBiYWNrIHRvIHN0cnVjdHVyYWwgZXF1YWxpdHkgb2Ygb2JqZWN0c1xuICB2YXIgcmV0O1xuICBpZiAoa2V5T3JkZXJTZW5zaXRpdmUpIHtcbiAgICB2YXIgYktleXMgPSBbXTtcbiAgICBfLmVhY2goYiwgZnVuY3Rpb24gKHZhbCwgeCkge1xuICAgICAgICBiS2V5cy5wdXNoKHgpO1xuICAgIH0pO1xuICAgIGkgPSAwO1xuICAgIHJldCA9IF8uYWxsKGEsIGZ1bmN0aW9uICh2YWwsIHgpIHtcbiAgICAgIGlmIChpID49IGJLZXlzLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBpZiAoeCAhPT0gYktleXNbaV0pIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgaWYgKCFFSlNPTi5lcXVhbHModmFsLCBiW2JLZXlzW2ldXSwgb3B0aW9ucykpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgaSsrO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSk7XG4gICAgcmV0dXJuIHJldCAmJiBpID09PSBiS2V5cy5sZW5ndGg7XG4gIH0gZWxzZSB7XG4gICAgaSA9IDA7XG4gICAgcmV0ID0gXy5hbGwoYSwgZnVuY3Rpb24gKHZhbCwga2V5KSB7XG4gICAgICBpZiAoIV8uaGFzKGIsIGtleSkpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgaWYgKCFFSlNPTi5lcXVhbHModmFsLCBiW2tleV0sIG9wdGlvbnMpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGkrKztcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0pO1xuICAgIHJldHVybiByZXQgJiYgXy5zaXplKGIpID09PSBpO1xuICB9XG59O1xuXG5FSlNPTi5jbG9uZSA9IGZ1bmN0aW9uICh2KSB7XG4gIHZhciByZXQ7XG4gIGlmICh0eXBlb2YgdiAhPT0gXCJvYmplY3RcIilcbiAgICByZXR1cm4gdjtcbiAgaWYgKHYgPT09IG51bGwpXG4gICAgcmV0dXJuIG51bGw7IC8vIG51bGwgaGFzIHR5cGVvZiBcIm9iamVjdFwiXG4gIGlmICh2IGluc3RhbmNlb2YgRGF0ZSlcbiAgICByZXR1cm4gbmV3IERhdGUodi5nZXRUaW1lKCkpO1xuICBpZiAoRUpTT04uaXNCaW5hcnkodikpIHtcbiAgICByZXQgPSBFSlNPTi5uZXdCaW5hcnkodi5sZW5ndGgpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdi5sZW5ndGg7IGkrKykge1xuICAgICAgcmV0W2ldID0gdltpXTtcbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbiAgfVxuICBpZiAoXy5pc0FycmF5KHYpIHx8IF8uaXNBcmd1bWVudHModikpIHtcbiAgICAvLyBGb3Igc29tZSByZWFzb24sIF8ubWFwIGRvZXNuJ3Qgd29yayBpbiB0aGlzIGNvbnRleHQgb24gT3BlcmEgKHdlaXJkIHRlc3RcbiAgICAvLyBmYWlsdXJlcykuXG4gICAgcmV0ID0gW107XG4gICAgZm9yIChpID0gMDsgaSA8IHYubGVuZ3RoOyBpKyspXG4gICAgICByZXRbaV0gPSBFSlNPTi5jbG9uZSh2W2ldKTtcbiAgICByZXR1cm4gcmV0O1xuICB9XG4gIC8vIGhhbmRsZSBnZW5lcmFsIHVzZXItZGVmaW5lZCB0eXBlZCBPYmplY3RzIGlmIHRoZXkgaGF2ZSBhIGNsb25lIG1ldGhvZFxuICBpZiAodHlwZW9mIHYuY2xvbmUgPT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gdi5jbG9uZSgpO1xuICB9XG4gIC8vIGhhbmRsZSBvdGhlciBvYmplY3RzXG4gIHJldCA9IHt9O1xuICBfLmVhY2godiwgZnVuY3Rpb24gKHZhbHVlLCBrZXkpIHtcbiAgICByZXRba2V5XSA9IEVKU09OLmNsb25lKHZhbHVlKTtcbiAgfSk7XG4gIHJldHVybiByZXQ7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEVKU09OOyIsIlBhZ2UgPSByZXF1aXJlICcuLi9QYWdlJ1xuZm9ybXMgPSByZXF1aXJlICcuLi9mb3JtcydcblNvdXJjZVBhZ2UgPSByZXF1aXJlIFwiLi9Tb3VyY2VQYWdlXCJcblxuIyBBbGxvd3MgY3JlYXRpbmcgb2YgYSBzb3VyY2VcbiMgVE9ETyBsb2dpbiByZXF1aXJlZFxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBOZXdTb3VyY2VQYWdlIGV4dGVuZHMgUGFnZVxuICBhY3RpdmF0ZTogLT5cbiAgICBAc2V0VGl0bGUgXCJOZXcgU291cmNlXCJcblxuICAgICMgQ3JlYXRlIG1vZGVsIGZyb20gc291cmNlXG4gICAgQG1vZGVsID0gbmV3IEJhY2tib25lLk1vZGVsKHNldExvY2F0aW9uOiB0cnVlKVxuICBcbiAgICAjIENyZWF0ZSBxdWVzdGlvbnNcbiAgICBzb3VyY2VUeXBlc1F1ZXN0aW9uID0gbmV3IGZvcm1zLkRyb3Bkb3duUXVlc3Rpb25cbiAgICAgIGlkOiAndHlwZSdcbiAgICAgIG1vZGVsOiBAbW9kZWxcbiAgICAgIHByb21wdDogJ0VudGVyIFNvdXJjZSBUeXBlJ1xuICAgICAgb3B0aW9uczogW11cbiAgICBAZGIuc291cmNlX3R5cGVzLmZpbmQoe30pLmZldGNoIChzb3VyY2VUeXBlcykgPT5cbiAgICAgICMgRmlsbCBzb3VyY2UgdHlwZXNcbiAgICAgIHNvdXJjZVR5cGVzUXVlc3Rpb24uc2V0T3B0aW9ucyBfLm1hcChzb3VyY2VUeXBlcywgKHN0KSA9PiBbc3QuY29kZSwgc3QubmFtZV0pXG5cbiAgICBzYXZlQ2FuY2VsRm9ybSA9IG5ldyBmb3Jtcy5TYXZlQ2FuY2VsRm9ybVxuICAgICAgY29udGVudHM6IFtcbiAgICAgICAgc291cmNlVHlwZXNRdWVzdGlvblxuICAgICAgICBuZXcgZm9ybXMuVGV4dFF1ZXN0aW9uXG4gICAgICAgICAgaWQ6ICduYW1lJ1xuICAgICAgICAgIG1vZGVsOiBAbW9kZWxcbiAgICAgICAgICBwcm9tcHQ6ICdFbnRlciBvcHRpb25hbCBuYW1lJ1xuICAgICAgICBuZXcgZm9ybXMuVGV4dFF1ZXN0aW9uXG4gICAgICAgICAgaWQ6ICdkZXNjJ1xuICAgICAgICAgIG1vZGVsOiBAbW9kZWxcbiAgICAgICAgICBwcm9tcHQ6ICdFbnRlciBvcHRpb25hbCBkZXNjcmlwdGlvbidcbiAgICAgICAgbmV3IGZvcm1zLkNoZWNrUXVlc3Rpb25cbiAgICAgICAgICBpZDogJ3ByaXZhdGUnXG4gICAgICAgICAgbW9kZWw6IEBtb2RlbFxuICAgICAgICAgIHByb21wdDogXCJQcml2YWN5XCJcbiAgICAgICAgICB0ZXh0OiAnV2F0ZXIgc291cmNlIGlzIHByaXZhdGUnXG4gICAgICAgICAgaGludDogJ1RoaXMgc2hvdWxkIG9ubHkgYmUgdXNlZCBmb3Igc291cmNlcyB0aGF0IGFyZSBub3QgcHVibGljYWxseSBhY2Nlc3NpYmxlJ1xuICAgICAgICBuZXcgZm9ybXMuUmFkaW9RdWVzdGlvblxuICAgICAgICAgIGlkOiAnc2V0TG9jYXRpb24nXG4gICAgICAgICAgbW9kZWw6IEBtb2RlbFxuICAgICAgICAgIHByb21wdDogJ1NldCB0byBjdXJyZW50IGxvY2F0aW9uPydcbiAgICAgICAgICBvcHRpb25zOiBbW3RydWUsICdZZXMnXSwgW2ZhbHNlLCAnTm8nXV1cbiAgICAgIF1cblxuICAgIEAkZWwuZW1wdHkoKS5hcHBlbmQoc2F2ZUNhbmNlbEZvcm0uZWwpXG5cbiAgICBAbGlzdGVuVG8gc2F2ZUNhbmNlbEZvcm0sICdzYXZlJywgPT5cbiAgICAgIHNvdXJjZSA9IF8ucGljayhAbW9kZWwudG9KU09OKCksICduYW1lJywgJ2Rlc2MnLCAndHlwZScsICdwcml2YXRlJylcbiAgICAgIHNvdXJjZS5jb2RlID0gXCJcIitNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkqMTAwMDAwMCkgICMgVE9ETyByZWFsIGNvZGVzXG4gICAgICBAZGIuc291cmNlcy51cHNlcnQgc291cmNlLCAoc291cmNlKSA9PiBcbiAgICAgICAgQHBhZ2VyLmNsb3NlUGFnZShTb3VyY2VQYWdlLCB7IF9pZDogc291cmNlLl9pZCwgc2V0TG9jYXRpb246IEBtb2RlbC5nZXQoJ3NldExvY2F0aW9uJyl9KVxuXG4gICAgQGxpc3RlblRvIHNhdmVDYW5jZWxGb3JtLCAnY2FuY2VsJywgPT5cbiAgICAgIEBwYWdlci5jbG9zZVBhZ2UoKVxuICIsIlBhZ2UgPSByZXF1aXJlKFwiLi4vUGFnZVwiKVxuTG9jYXRpb25WaWV3ID0gcmVxdWlyZSAoXCIuLi9Mb2NhdGlvblZpZXdcIilcbmZvcm1zID0gcmVxdWlyZSAnLi4vZm9ybXMnXG5cblxuIyBEaXNwbGF5cyBhIHNvdXJjZVxuIyBPcHRpb25zOiBzZXRMb2NhdGlvbiAtIHRydWUgdG8gYXV0b3NldCBsb2NhdGlvblxuIyBvblNlbGVjdCAtIGNhbGwgd2hlbiBzb3VyY2UgaXMgc2VsZWN0ZWQgdmlhIGJ1dHRvbiB0aGF0IGFwcGVhcnNcbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgU291cmNlUGFnZSBleHRlbmRzIFBhZ2VcbiAgZXZlbnRzOlxuICAgICdjbGljayAjZWRpdF9zb3VyY2VfYnV0dG9uJyA6ICdlZGl0U291cmNlJ1xuICAgICdjbGljayAjYWRkX3Rlc3RfYnV0dG9uJyA6ICdhZGRUZXN0J1xuICAgICdjbGljayAjYWRkX25vdGVfYnV0dG9uJyA6ICdhZGROb3RlJ1xuICAgICdjbGljayAudGVzdCcgOiAnb3BlblRlc3QnXG4gICAgJ2NsaWNrIC5ub3RlJyA6ICdvcGVuTm90ZSdcbiAgICAnY2xpY2sgI3NlbGVjdF9zb3VyY2UnIDogJ3NlbGVjdFNvdXJjZSdcblxuICBjcmVhdGU6IC0+XG4gICAgQHNldExvY2F0aW9uID0gQG9wdGlvbnMuc2V0TG9jYXRpb25cblxuICBhY3RpdmF0ZTogLT5cbiAgICBAZGIuc291cmNlcy5maW5kT25lIHtfaWQ6IEBvcHRpb25zLl9pZH0sIChzb3VyY2UpID0+XG4gICAgICBAc291cmNlID0gc291cmNlXG4gICAgICBAcmVuZGVyKClcblxuICByZW5kZXI6IC0+XG4gICAgQHNldFRpdGxlIFwiU291cmNlIFwiICsgQHNvdXJjZS5jb2RlXG5cbiAgICBAc2V0dXBDb250ZXh0TWVudSBbXG4gICAgICB7IGdseXBoOiAncmVtb3ZlJywgdGV4dDogXCJEZWxldGUgU291cmNlXCIsIGNsaWNrOiA9PiBAZGVsZXRlU291cmNlKCkgfVxuICAgIF1cblxuICAgIEBzZXR1cEJ1dHRvbkJhciBbXG4gICAgICB7IGljb246IFwicGx1cy5wbmdcIiwgbWVudTogW1xuICAgICAgICB7IHRleHQ6IFwiU3RhcnQgV2F0ZXIgVGVzdFwiLCBjbGljazogPT4gQGFkZFRlc3QoKSB9XG4gICAgICAgIHsgdGV4dDogXCJBZGQgTm90ZVwiLCBjbGljazogPT4gQGFkZE5vdGUoKSB9XG4gICAgICBdfVxuICAgIF1cblxuICAgICMgUmUtcmVuZGVyIHRlbXBsYXRlXG4gICAgQHJlbW92ZVN1YnZpZXdzKClcbiAgICBAJGVsLmh0bWwgdGVtcGxhdGVzWydwYWdlcy9Tb3VyY2VQYWdlJ10oc291cmNlOiBAc291cmNlLCBzZWxlY3Q6IEBvcHRpb25zLm9uU2VsZWN0PylcblxuICAgICMgU2V0IHNvdXJjZSB0eXBlXG4gICAgaWYgQHNvdXJjZS50eXBlP1xuICAgICAgQGRiLnNvdXJjZV90eXBlcy5maW5kT25lIHtjb2RlOiBAc291cmNlLnR5cGV9LCAoc291cmNlVHlwZSkgPT5cbiAgICAgICAgaWYgc291cmNlVHlwZT8gdGhlbiBAJChcIiNzb3VyY2VfdHlwZVwiKS50ZXh0KHNvdXJjZVR5cGUubmFtZSlcblxuICAgICMgQWRkIGxvY2F0aW9uIHZpZXdcbiAgICBsb2NhdGlvblZpZXcgPSBuZXcgTG9jYXRpb25WaWV3KGxvYzogQHNvdXJjZS5nZW8pXG4gICAgaWYgQHNldExvY2F0aW9uXG4gICAgICBsb2NhdGlvblZpZXcuc2V0TG9jYXRpb24oKVxuICAgICAgQHNldExvY2F0aW9uID0gZmFsc2VcblxuICAgIEBsaXN0ZW5UbyBsb2NhdGlvblZpZXcsICdsb2NhdGlvbnNldCcsIChsb2MpIC0+XG4gICAgICBAc291cmNlLmdlbyA9IGxvY1xuICAgICAgQGRiLnNvdXJjZXMudXBzZXJ0IEBzb3VyY2UsID0+IEByZW5kZXIoKVxuXG4gICAgQGxpc3RlblRvIGxvY2F0aW9uVmlldywgJ21hcCcsIChsb2MpIC0+XG4gICAgICBAcGFnZXIub3BlblBhZ2UocmVxdWlyZShcIi4vU291cmNlTWFwUGFnZVwiKSwge2luaXRpYWxHZW86IGxvY30pXG4gICAgICBcbiAgICBAYWRkU3Vidmlldyhsb2NhdGlvblZpZXcpXG4gICAgQCQoXCIjbG9jYXRpb25cIikuYXBwZW5kKGxvY2F0aW9uVmlldy5lbClcblxuICAgICMgQWRkIHRlc3RzXG4gICAgQGRiLnRlc3RzLmZpbmQoe3NvdXJjZTogQHNvdXJjZS5jb2RlfSkuZmV0Y2ggKHRlc3RzKSAtPiAjIFRPRE8gc291cmNlLmNvZGU/IFxuICAgICAgQCQoXCIjdGVzdHNcIikuaHRtbCB0ZW1wbGF0ZXNbJ3BhZ2VzL1NvdXJjZVBhZ2VfdGVzdHMnXSh0ZXN0czp0ZXN0cylcblxuICAgICMgQWRkIG5vdGVzXG4gICAgQGRiLnNvdXJjZV9ub3Rlcy5maW5kKHtzb3VyY2U6IEBzb3VyY2UuY29kZX0pLmZldGNoIChub3RlcykgLT4gICMgVE9ETyBzb3VyY2UuY29kZT9cbiAgICAgIEAkKFwiI25vdGVzXCIpLmh0bWwgdGVtcGxhdGVzWydwYWdlcy9Tb3VyY2VQYWdlX25vdGVzJ10obm90ZXM6bm90ZXMpXG5cbiAgICAjIEFkZCBwaG90b3MgIyBUT0RPIHdpcmUgbW9kZWwgdG8gYWN0dWFsIGRiXG4gICAgcGhvdG9zVmlldyA9IG5ldyBmb3Jtcy5JbWFnZXNRdWVzdGlvblxuICAgICAgaWQ6ICdwaG90b3MnXG4gICAgICBtb2RlbDogbmV3IEJhY2tib25lLk1vZGVsKEBzb3VyY2UpXG4gICAgICBjdHg6IEBjdHhcbiAgICAgIFxuICAgIHBob3Rvc1ZpZXcubW9kZWwub24gJ2NoYW5nZScsID0+XG4gICAgICBAZGIuc291cmNlcy51cHNlcnQgQHNvdXJjZS50b0pTT04oKSwgPT4gQHJlbmRlcigpXG4gICAgQCQoJyNwaG90b3MnKS5hcHBlbmQocGhvdG9zVmlldy5lbClcblxuICBlZGl0U291cmNlOiAtPlxuICAgIEBwYWdlci5vcGVuUGFnZShyZXF1aXJlKFwiLi9Tb3VyY2VFZGl0UGFnZVwiKSwgeyBfaWQ6IEBzb3VyY2UuX2lkfSlcblxuICBkZWxldGVTb3VyY2U6IC0+XG4gICAgaWYgY29uZmlybShcIlBlcm1hbmVudGx5IGRlbGV0ZSBzb3VyY2U/XCIpXG4gICAgICBAZGIuc291cmNlcy5yZW1vdmUgQHNvdXJjZS5faWQsID0+XG4gICAgICAgIEBwYWdlci5jbG9zZVBhZ2UoKVxuICAgICAgICBAcGFnZXIuZmxhc2ggXCJTb3VyY2UgZGVsZXRlZFwiLCBcInN1Y2Nlc3NcIlxuXG4gIGFkZFRlc3Q6IC0+XG4gICAgQHBhZ2VyLm9wZW5QYWdlKHJlcXVpcmUoXCIuL05ld1Rlc3RQYWdlXCIpLCB7IHNvdXJjZTogQHNvdXJjZS5jb2RlfSlcblxuICBvcGVuVGVzdDogKGV2KSAtPlxuICAgIEBwYWdlci5vcGVuUGFnZShyZXF1aXJlKFwiLi9UZXN0UGFnZVwiKSwgeyBfaWQ6IGV2LmN1cnJlbnRUYXJnZXQuaWR9KVxuXG4gIGFkZE5vdGU6IC0+XG4gICAgQHBhZ2VyLm9wZW5QYWdlKHJlcXVpcmUoXCIuL1NvdXJjZU5vdGVQYWdlXCIpLCB7IHNvdXJjZTogQHNvdXJjZS5jb2RlfSkgICAjIFRPRE8gaWQgb3IgY29kZT9cblxuICBvcGVuTm90ZTogKGV2KSAtPlxuICAgIEBwYWdlci5vcGVuUGFnZShyZXF1aXJlKFwiLi9Tb3VyY2VOb3RlUGFnZVwiKSwgeyBzb3VyY2U6IEBzb3VyY2UuY29kZSwgX2lkOiBldi5jdXJyZW50VGFyZ2V0LmlkfSlcblxuICBzZWxlY3RTb3VyY2U6IC0+XG4gICAgaWYgQG9wdGlvbnMub25TZWxlY3Q/XG4gICAgICBAcGFnZXIuY2xvc2VQYWdlKClcbiAgICAgIEBvcHRpb25zLm9uU2VsZWN0KEBzb3VyY2UpIiwiUGFnZSA9IHJlcXVpcmUgXCIuLi9QYWdlXCJcblNvdXJjZVBhZ2UgPSByZXF1aXJlIFwiLi9Tb3VyY2VQYWdlXCJcbkl0ZW1UcmFja2VyID0gcmVxdWlyZSBcIi4uL0l0ZW1UcmFja2VyXCJcbkxvY2F0aW9uRmluZGVyID0gcmVxdWlyZSAnLi4vTG9jYXRpb25GaW5kZXInXG5HZW9KU09OID0gcmVxdWlyZSAnLi4vR2VvSlNPTidcblxuIyBNYXAgb2Ygd2F0ZXIgc291cmNlcy4gT3B0aW9ucyBpbmNsdWRlOlxuIyBpbml0aWFsR2VvOiBHZW9tZXRyeSB0byB6b29tIHRvLiBQb2ludCBvbmx5IHN1cHBvcnRlZC5cbmNsYXNzIFNvdXJjZU1hcFBhZ2UgZXh0ZW5kcyBQYWdlXG4gIGNyZWF0ZTogLT5cbiAgICBAc2V0VGl0bGUgXCJTb3VyY2UgTWFwXCJcblxuICAgICMgQ2FsY3VsYXRlIGhlaWdodFxuICAgIEAkZWwuaHRtbCB0ZW1wbGF0ZXNbJ3BhZ2VzL1NvdXJjZU1hcFBhZ2UnXSgpXG5cbiAgICBMLkljb24uRGVmYXVsdC5pbWFnZVBhdGggPSBcImltZy9sZWFmbGV0XCJcbiAgICBAbWFwID0gTC5tYXAodGhpcy4kKFwiI21hcFwiKVswXSlcbiAgICBMLmNvbnRyb2wuc2NhbGUoaW1wZXJpYWw6ZmFsc2UpLmFkZFRvKEBtYXApXG4gICAgQHJlc2l6ZU1hcCgpXG5cbiAgICAjIFJlY2FsY3VsYXRlIG9uIHJlc2l6ZVxuICAgICQod2luZG93KS5vbigncmVzaXplJywgQHJlc2l6ZU1hcClcblxuICAgICMgU2V0dXAgbWFwIHRpbGVzXG4gICAgc2V0dXBNYXBUaWxlcygpLmFkZFRvKEBtYXApXG5cbiAgICAjIFNldHVwIG1hcmtlciBkaXNwbGF5XG4gICAgQHNvdXJjZURpc3BsYXkgPSBuZXcgU291cmNlRGlzcGxheShAbWFwLCBAZGIsIEBwYWdlcilcblxuICAgICMgVE9ETyB6b29tIHRvIGxhc3Qga25vd24gYm91bmRzXG4gICAgXG4gICAgIyBTZXR1cCBpbml0aWFsIHpvb21cbiAgICBpZiBAb3B0aW9ucy5pbml0aWFsR2VvIGFuZCBAb3B0aW9ucy5pbml0aWFsR2VvLnR5cGU9PVwiUG9pbnRcIlxuICAgICAgQG1hcC5zZXRWaWV3KEwuR2VvSlNPTi5jb29yZHNUb0xhdExuZyhAb3B0aW9ucy5pbml0aWFsR2VvLmNvb3JkaW5hdGVzKSwgMTUpXG5cbiAgICAjIFNldHVwIGxvY2FsdGlvbiBkaXNwbGF5XG4gICAgQGxvY2F0aW9uRGlzcGxheSA9IG5ldyBMb2NhdGlvbkRpc3BsYXkoQG1hcCwgbm90IEBvcHRpb25zLmluaXRpYWxHZW8/KVxuXG4gIGRlc3Ryb3k6IC0+XG4gICAgJCh3aW5kb3cpLm9mZigncmVzaXplJywgQHJlc2l6ZU1hcClcbiAgICBAbG9jYXRpb25EaXNwbGF5LnN0b3AoKVxuXG4gIHJlc2l6ZU1hcDogPT5cbiAgICAjIENhbGN1bGF0ZSBtYXAgaGVpZ2h0XG4gICAgbWFwSGVpZ2h0ID0gJChcImh0bWxcIikuaGVpZ2h0KCkgLSA0MFxuICAgICQoXCIjbWFwXCIpLmNzcyhcImhlaWdodFwiLCBtYXBIZWlnaHQgKyBcInB4XCIpXG4gICAgQG1hcC5pbnZhbGlkYXRlU2l6ZSgpXG5cblxuc2V0dXBNYXBUaWxlcyA9IC0+XG4gIG1hcHF1ZXN0VXJsID0gJ2h0dHA6Ly97c30ubXFjZG4uY29tL3RpbGVzLzEuMC4wL29zbS97en0ve3h9L3t5fS5wbmcnXG4gIHN1YkRvbWFpbnMgPSBbJ290aWxlMScsJ290aWxlMicsJ290aWxlMycsJ290aWxlNCddXG4gIG1hcHF1ZXN0QXR0cmliID0gJ0RhdGEsIGltYWdlcnkgYW5kIG1hcCBpbmZvcm1hdGlvbiBwcm92aWRlZCBieSA8YSBocmVmPVwiaHR0cDovL29wZW4ubWFwcXVlc3QuY28udWtcIiB0YXJnZXQ9XCJfYmxhbmtcIj5NYXBRdWVzdDwvYT4sIDxhIGhyZWY9XCJodHRwOi8vd3d3Lm9wZW5zdHJlZXRtYXAub3JnL1wiIHRhcmdldD1cIl9ibGFua1wiPk9wZW5TdHJlZXRNYXA8L2E+IGFuZCBjb250cmlidXRvcnMuJ1xuICByZXR1cm4gbmV3IEwuVGlsZUxheWVyKG1hcHF1ZXN0VXJsLCB7bWF4Wm9vbTogMTgsIGF0dHJpYnV0aW9uOiBtYXBxdWVzdEF0dHJpYiwgc3ViZG9tYWluczogc3ViRG9tYWluc30pXG5cbmNsYXNzIFNvdXJjZURpc3BsYXlcbiAgY29uc3RydWN0b3I6IChtYXAsIGRiLCBwYWdlcikgLT5cbiAgICBAbWFwID0gbWFwXG4gICAgQGRiID0gZGJcbiAgICBAcGFnZXIgPSBwYWdlclxuICAgIEBpdGVtVHJhY2tlciA9IG5ldyBJdGVtVHJhY2tlcigpXG5cbiAgICBAc291cmNlTWFya2VycyA9IHt9XG4gICAgQG1hcC5vbignbW92ZWVuZCcsIEB1cGRhdGVNYXJrZXJzKVxuXG4gICAgQGljb24gPSBuZXcgTC5pY29uXG4gICAgICBpY29uVXJsOiAnaW1nL0Ryb3BNYXJrZXIucG5nJ1xuICAgICAgaWNvblJldGluYVVybDogJ2ltZy9Ecm9wTWFya2VyQDJ4LnBuZydcbiAgICAgIGljb25TaXplOiBbMjcsIDQxXSxcbiAgICAgIGljb25BbmNob3I6IFsxMywgNDFdXG4gICAgICBwb3B1cEFuY2hvcjogWy0zLCAtNDFdXG4gIFxuICB1cGRhdGVNYXJrZXJzOiA9PlxuICAgICMgR2V0IGJvdW5kcyBwYWRkZWRcbiAgICBib3VuZHMgPSBAbWFwLmdldEJvdW5kcygpLnBhZCgwLjMzKVxuXG4gICAgYm91bmRzR2VvSlNPTiA9IEdlb0pTT04ubGF0TG5nQm91bmRzVG9HZW9KU09OKGJvdW5kcylcbiAgICBzZWxlY3RvciA9IHsgZ2VvOiB7ICRnZW9JbnRlcnNlY3RzOiB7ICRnZW9tZXRyeTogYm91bmRzR2VvSlNPTiB9IH0gfVxuXG4gICAgIyBRdWVyeSBzb3VyY2VzIHdpdGggcHJvamVjdGlvbiBUT0RPXG4gICAgQGRiLnNvdXJjZXMuZmluZChzZWxlY3RvciwgeyBzb3J0OiBbXCJfaWRcIl0sIGxpbWl0OiAxMDAgfSkuZmV0Y2ggKHNvdXJjZXMpID0+XG4gICAgICAjIEZpbmQgb3V0IHdoaWNoIHRvIGFkZC9yZW1vdmVcbiAgICAgIFthZGRzLCByZW1vdmVzXSA9IEBpdGVtVHJhY2tlci51cGRhdGUoc291cmNlcylcblxuICAgICAgIyBSZW1vdmUgb2xkIG1hcmtlcnNcbiAgICAgIGZvciByZW1vdmUgaW4gcmVtb3Zlc1xuICAgICAgICBAcmVtb3ZlU291cmNlTWFya2VyKHJlbW92ZSlcbiAgICAgIGZvciBhZGQgaW4gYWRkc1xuICAgICAgICBAYWRkU291cmNlTWFya2VyKGFkZClcblxuICBhZGRTb3VyY2VNYXJrZXI6IChzb3VyY2UpIC0+XG4gICAgaWYgc291cmNlLmdlbz9cbiAgICAgIGxhdGxuZyA9IG5ldyBMLkxhdExuZyhzb3VyY2UuZ2VvLmNvb3JkaW5hdGVzWzFdLCBzb3VyY2UuZ2VvLmNvb3JkaW5hdGVzWzBdKVxuICAgICAgbWFya2VyID0gbmV3IEwuTWFya2VyKGxhdGxuZywge2ljb246QGljb259KVxuICAgICAgXG4gICAgICBtYXJrZXIub24gJ2NsaWNrJywgPT5cbiAgICAgICAgQHBhZ2VyLm9wZW5QYWdlKFNvdXJjZVBhZ2UsIHtfaWQ6IHNvdXJjZS5faWR9KVxuICAgICAgXG4gICAgICBAc291cmNlTWFya2Vyc1tzb3VyY2UuX2lkXSA9IG1hcmtlclxuICAgICAgbWFya2VyLmFkZFRvKEBtYXApXG5cbiAgcmVtb3ZlU291cmNlTWFya2VyOiAoc291cmNlKSAtPlxuICAgIGlmIF8uaGFzKEBzb3VyY2VNYXJrZXJzLCBzb3VyY2UuX2lkKVxuICAgICAgQG1hcC5yZW1vdmVMYXllcihAc291cmNlTWFya2Vyc1tzb3VyY2UuX2lkXSlcblxuXG5jbGFzcyBMb2NhdGlvbkRpc3BsYXlcbiAgIyBTZXR1cCBkaXNwbGF5LCBvcHRpb25hbGx5IHpvb21pbmcgdG8gY3VycmVudCBsb2NhdGlvblxuICBjb25zdHJ1Y3RvcjogKG1hcCwgem9vbVRvKSAtPlxuICAgIEBtYXAgPSBtYXBcbiAgICBAem9vbVRvID0gem9vbVRvXG5cbiAgICBAbG9jYXRpb25GaW5kZXIgPSBuZXcgTG9jYXRpb25GaW5kZXIoKVxuICAgIEBsb2NhdGlvbkZpbmRlci5vbignZm91bmQnLCBAbG9jYXRpb25Gb3VuZCkub24oJ2Vycm9yJywgQGxvY2F0aW9uRXJyb3IpXG4gICAgQGxvY2F0aW9uRmluZGVyLnN0YXJ0V2F0Y2goKVxuXG4gIHN0b3A6IC0+XG4gICAgQGxvY2F0aW9uRmluZGVyLnN0b3BXYXRjaCgpXG5cbiAgbG9jYXRpb25FcnJvcjogKGUpID0+XG4gICAgaWYgQHpvb21Ub1xuICAgICAgQG1hcC5maXRXb3JsZCgpXG4gICAgICBAem9vbVRvID0gZmFsc2VcbiAgICAgIGFsZXJ0KFwiVW5hYmxlIHRvIGRldGVybWluZSBsb2NhdGlvblwiKVxuXG4gIGxvY2F0aW9uRm91bmQ6IChlKSA9PlxuICAgIHJhZGl1cyA9IGUuY29vcmRzLmFjY3VyYWN5XG4gICAgbGF0bG5nID0gbmV3IEwuTGF0TG5nKGUuY29vcmRzLmxhdGl0dWRlLCBlLmNvb3Jkcy5sb25naXR1ZGUpXG5cbiAgICAjIFNldCBwb3NpdGlvbiBvbmNlXG4gICAgaWYgQHpvb21Ub1xuICAgICAgem9vbSA9IDE1XG4gICAgICBAbWFwLnNldFZpZXcobGF0bG5nLCB6b29tKVxuICAgICAgQHpvb21UbyA9IGZhbHNlXG5cbiAgICAjIFNldHVwIG1hcmtlciBhbmQgY2lyY2xlXG4gICAgaWYgbm90IEBtZU1hcmtlclxuICAgICAgaWNvbiA9ICBMLmljb24oaWNvblVybDogXCJpbWcvbXlfbG9jYXRpb24ucG5nXCIsIGljb25TaXplOiBbMjIsIDIyXSlcbiAgICAgIEBtZU1hcmtlciA9IEwubWFya2VyKGxhdGxuZywgaWNvbjppY29uKS5hZGRUbyhAbWFwKVxuICAgICAgQG1lQ2lyY2xlID0gTC5jaXJjbGUobGF0bG5nLCByYWRpdXMpXG4gICAgICBAbWVDaXJjbGUuYWRkVG8oQG1hcClcbiAgICBlbHNlXG4gICAgICBAbWVNYXJrZXIuc2V0TGF0TG5nKGxhdGxuZylcbiAgICAgIEBtZUNpcmNsZS5zZXRMYXRMbmcobGF0bG5nKS5zZXRSYWRpdXMocmFkaXVzKVxuXG5tb2R1bGUuZXhwb3J0cyA9IFNvdXJjZU1hcFBhZ2UiLCJQYWdlID0gcmVxdWlyZSBcIi4uL1BhZ2VcIlxuVGVzdFBhZ2UgPSByZXF1aXJlIFwiLi9UZXN0UGFnZVwiXG5cbiMgUGFyYW1ldGVyIGlzIG9wdGlvbmFsIHNvdXJjZSBjb2RlXG5jbGFzcyBOZXdUZXN0UGFnZSBleHRlbmRzIFBhZ2VcbiAgZXZlbnRzOiBcbiAgICBcImNsaWNrIC50ZXN0XCIgOiBcInN0YXJ0VGVzdFwiXG5cbiAgYWN0aXZhdGU6IC0+XG4gICAgQHNldFRpdGxlIFwiU2VsZWN0IFRlc3RcIlxuXG4gICAgQGRiLmZvcm1zLmZpbmQoe3R5cGU6XCJXYXRlclRlc3RcIn0pLmZldGNoIChmb3JtcykgPT5cbiAgICAgIEBmb3JtcyA9IGZvcm1zXG4gICAgICBAJGVsLmh0bWwgdGVtcGxhdGVzWydwYWdlcy9OZXdUZXN0UGFnZSddKGZvcm1zOmZvcm1zKVxuXG4gIHN0YXJ0VGVzdDogKGV2KSAtPlxuICAgIHRlc3RDb2RlID0gZXYuY3VycmVudFRhcmdldC5pZFxuXG4gICAgIyBUT0RPIGFkZCB1c2VyL29yZ1xuXG4gICAgIyBDcmVhdGUgdGVzdFxuICAgIHRlc3QgPSB7XG4gICAgICBzb3VyY2U6IEBvcHRpb25zLnNvdXJjZVxuICAgICAgdHlwZTogdGVzdENvZGVcbiAgICAgIGNvbXBsZXRlZDogbnVsbFxuICAgICAgc3RhcnRlZDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpXG4gICAgfVxuICAgIEBkYi50ZXN0cy51cHNlcnQgdGVzdCwgKHRlc3QpID0+XG4gICAgICBAcGFnZXIuY2xvc2VQYWdlKFRlc3RQYWdlLCB7IF9pZDogdGVzdC5faWQgfSlcblxubW9kdWxlLmV4cG9ydHMgPSBOZXdUZXN0UGFnZSIsIlBhZ2UgPSByZXF1aXJlICcuLi9QYWdlJ1xuZm9ybXMgPSByZXF1aXJlICcuLi9mb3JtcydcblxuIyBBbGxvd3MgZWRpdGluZyBvZiBzb3VyY2UgZGV0YWlsc1xuIyBUT0RPIGxvZ2luIHJlcXVpcmVkXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFNvdXJjZUVkaXRQYWdlIGV4dGVuZHMgUGFnZVxuICBhY3RpdmF0ZTogLT5cbiAgICBAZGIuc291cmNlcy5maW5kT25lIHtfaWQ6IEBvcHRpb25zLl9pZH0sIChzb3VyY2UpID0+XG4gICAgICBAc2V0VGl0bGUgXCJFZGl0IFNvdXJjZSAje3NvdXJjZS5jb2RlfVwiXG5cbiAgICAgICMgQ3JlYXRlIG1vZGVsIGZyb20gc291cmNlXG4gICAgICBAbW9kZWwgPSBuZXcgQmFja2JvbmUuTW9kZWwoc291cmNlKVxuICBcbiAgICAgICMgQ3JlYXRlIHF1ZXN0aW9uc1xuICAgICAgc291cmNlVHlwZXNRdWVzdGlvbiA9IG5ldyBmb3Jtcy5Ecm9wZG93blF1ZXN0aW9uXG4gICAgICAgIGlkOiAndHlwZSdcbiAgICAgICAgbW9kZWw6IEBtb2RlbFxuICAgICAgICBwcm9tcHQ6ICdFbnRlciBTb3VyY2UgVHlwZSdcbiAgICAgICAgb3B0aW9uczogW11cbiAgICAgIEBkYi5zb3VyY2VfdHlwZXMuZmluZCh7fSkuZmV0Y2ggKHNvdXJjZVR5cGVzKSA9PlxuICAgICAgICAjIEZpbGwgc291cmNlIHR5cGVzXG4gICAgICAgIHNvdXJjZVR5cGVzUXVlc3Rpb24uc2V0T3B0aW9ucyBfLm1hcChzb3VyY2VUeXBlcywgKHN0KSA9PiBbc3QuY29kZSwgc3QubmFtZV0pXG5cbiAgICAgIHNhdmVDYW5jZWxGb3JtID0gbmV3IGZvcm1zLlNhdmVDYW5jZWxGb3JtXG4gICAgICAgIGNvbnRlbnRzOiBbXG4gICAgICAgICAgc291cmNlVHlwZXNRdWVzdGlvblxuICAgICAgICAgIG5ldyBmb3Jtcy5UZXh0UXVlc3Rpb25cbiAgICAgICAgICAgIGlkOiAnbmFtZSdcbiAgICAgICAgICAgIG1vZGVsOiBAbW9kZWxcbiAgICAgICAgICAgIHByb21wdDogJ0VudGVyIG9wdGlvbmFsIG5hbWUnXG4gICAgICAgICAgbmV3IGZvcm1zLlRleHRRdWVzdGlvblxuICAgICAgICAgICAgaWQ6ICdkZXNjJ1xuICAgICAgICAgICAgbW9kZWw6IEBtb2RlbFxuICAgICAgICAgICAgcHJvbXB0OiAnRW50ZXIgb3B0aW9uYWwgZGVzY3JpcHRpb24nXG4gICAgICAgICAgbmV3IGZvcm1zLkNoZWNrUXVlc3Rpb25cbiAgICAgICAgICAgIGlkOiAncHJpdmF0ZSdcbiAgICAgICAgICAgIG1vZGVsOiBAbW9kZWxcbiAgICAgICAgICAgIHByb21wdDogXCJQcml2YWN5XCJcbiAgICAgICAgICAgIHRleHQ6ICdXYXRlciBzb3VyY2UgaXMgcHJpdmF0ZSdcbiAgICAgICAgICAgIGhpbnQ6ICdUaGlzIHNob3VsZCBvbmx5IGJlIHVzZWQgZm9yIHNvdXJjZXMgdGhhdCBhcmUgbm90IHB1YmxpY2FsbHkgYWNjZXNzaWJsZSdcbiAgICAgICAgXVxuXG4gICAgICBAJGVsLmVtcHR5KCkuYXBwZW5kKHNhdmVDYW5jZWxGb3JtLmVsKVxuXG4gICAgICBAbGlzdGVuVG8gc2F2ZUNhbmNlbEZvcm0sICdzYXZlJywgPT5cbiAgICAgICAgQGRiLnNvdXJjZXMudXBzZXJ0IEBtb2RlbC50b0pTT04oKSwgPT4gQHBhZ2VyLmNsb3NlUGFnZSgpXG5cbiAgICAgIEBsaXN0ZW5UbyBzYXZlQ2FuY2VsRm9ybSwgJ2NhbmNlbCcsID0+XG4gICAgICAgIEBwYWdlci5jbG9zZVBhZ2UoKVxuICIsIlBhZ2UgPSByZXF1aXJlICcuLi9QYWdlJ1xuZm9ybXMgPSByZXF1aXJlICcuLi9mb3JtcydcblxuIyBBbGxvd3MgY3JlYXRpbmcvZWRpdGluZyBvZiBzb3VyY2Ugbm90ZXNcbiMgT3B0aW9ucyBhcmUgXG4jIF9pZDogaWQgb2Ygc291cmNlIG5vdGVcbiMgc291cmNlOiBjb2RlIG9mIHNvdXJjZVxuXG4jIFRPRE8gbG9naW4gcmVxdWlyZWRcbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgU291cmNlTm90ZVBhZ2UgZXh0ZW5kcyBQYWdlXG4gIGFjdGl2YXRlOiAtPlxuICAgICMgRmluZCB3YXRlciBzb3VyY2VcbiAgICBAZGIuc291cmNlcy5maW5kT25lIHtjb2RlOiBAb3B0aW9ucy5zb3VyY2V9LCAoc291cmNlKSA9PlxuICAgICAgQHNldFRpdGxlIFwiTm90ZSBmb3IgU291cmNlICN7c291cmNlLmNvZGV9XCJcblxuICAgICAgIyBDcmVhdGUgbW9kZWwgXG4gICAgICBAbW9kZWwgPSBuZXcgQmFja2JvbmUuTW9kZWwoKVxuICBcbiAgICAgICMgQ3JlYXRlIHF1ZXN0aW9uc1xuICAgICAgc2F2ZUNhbmNlbEZvcm0gPSBuZXcgZm9ybXMuU2F2ZUNhbmNlbEZvcm1cbiAgICAgICAgY29udGVudHM6IFtcbiAgICAgICAgICBuZXcgZm9ybXMuRGF0ZVF1ZXN0aW9uXG4gICAgICAgICAgICBpZDogJ2RhdGUnXG4gICAgICAgICAgICBtb2RlbDogQG1vZGVsXG4gICAgICAgICAgICBwcm9tcHQ6ICdEYXRlIG9mIFZpc2l0J1xuICAgICAgICAgICAgcmVxdWlyZWQ6IHRydWVcbiAgICAgICAgICBuZXcgZm9ybXMuUmFkaW9RdWVzdGlvblxuICAgICAgICAgICAgaWQ6ICdzdGF0dXMnXG4gICAgICAgICAgICBtb2RlbDogQG1vZGVsXG4gICAgICAgICAgICBwcm9tcHQ6ICdTdGF0dXMgb2YgV2F0ZXIgU291cmNlJ1xuICAgICAgICAgICAgb3B0aW9uczogW1snb2snLCAnRnVuY3Rpb25hbCddLCBbJ21haW50JywgJ05lZWRzIG1haW50ZW5hbmNlJ10sIFsnYnJva2VuJywgJ05vbi1mdW5jdGlvbmFsJ10sIFsnbWlzc2luZycsICdObyBsb25nZXIgZXhpc3RzJ11dXG4gICAgICAgICAgICByZXF1aXJlZDogdHJ1ZVxuICAgICAgICAgIG5ldyBmb3Jtcy5UZXh0UXVlc3Rpb25cbiAgICAgICAgICAgIGlkOiAnbm90ZXMnXG4gICAgICAgICAgICBtb2RlbDogQG1vZGVsXG4gICAgICAgICAgICBwcm9tcHQ6ICdOb3RlcydcbiAgICAgICAgICAgIG11bHRpbGluZTogdHJ1ZVxuICAgICAgICBdXG5cbiAgICAgICMgTG9hZCBmb3JtIGZyb20gc291cmNlIG5vdGUgaWYgZXhpc3RzXG4gICAgICBpZiBAb3B0aW9ucy5faWRcbiAgICAgICAgQGRiLnNvdXJjZV9ub3Rlcy5maW5kT25lIHtfaWQ6IEBvcHRpb25zLl9pZH0sIChzb3VyY2VOb3RlKSA9PlxuICAgICAgICAgIEBtb2RlbC5zZXQoc291cmNlTm90ZSlcbiAgICAgIGVsc2VcbiAgICAgICAgIyBDcmVhdGUgZGVmYXVsdCBlbnRyeVxuICAgICAgICBAbW9kZWwuc2V0KHNvdXJjZTogQG9wdGlvbnMuc291cmNlLCBkYXRlOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkuc3Vic3RyaW5nKDAsMTApKVxuXG4gICAgICBAJGVsLmVtcHR5KCkuYXBwZW5kKHNhdmVDYW5jZWxGb3JtLmVsKVxuXG4gICAgICBAbGlzdGVuVG8gc2F2ZUNhbmNlbEZvcm0sICdzYXZlJywgPT5cbiAgICAgICAgQGRiLnNvdXJjZV9ub3Rlcy51cHNlcnQgQG1vZGVsLnRvSlNPTigpLCA9PiBAcGFnZXIuY2xvc2VQYWdlKClcblxuICAgICAgQGxpc3RlblRvIHNhdmVDYW5jZWxGb3JtLCAnY2FuY2VsJywgPT5cbiAgICAgICAgQHBhZ2VyLmNsb3NlUGFnZSgpXG4gIiwiUGFnZSA9IHJlcXVpcmUgXCIuLi9QYWdlXCJcbmZvcm1zID0gcmVxdWlyZSAnLi4vZm9ybXMnXG5cbmNsYXNzIFRlc3RQYWdlIGV4dGVuZHMgUGFnZVxuICBjcmVhdGU6IC0+IEByZW5kZXIoKVxuXG4gIGFjdGl2YXRlOiAtPlxuICAgIEBzZXR1cENvbnRleHRNZW51IFtcbiAgICAgIHsgZ2x5cGg6ICdyZW1vdmUnLCB0ZXh0OiBcIkRlbGV0ZSBUZXN0XCIsIGNsaWNrOiA9PiBAZGVsZXRlVGVzdCgpIH1cbiAgICBdXG5cbiAgcmVuZGVyOiAtPlxuICAgIEBzZXRUaXRsZSBcIlRlc3RcIiAjIFRPRE8gbmljZXIgdGl0bGVcblxuICAgICMgR2V0IHRlc3RcbiAgICBAZGIudGVzdHMuZmluZE9uZSB7X2lkOiBAb3B0aW9ucy5faWR9LCAodGVzdCkgPT5cbiAgICAgIEB0ZXN0ID0gdGVzdFxuXG4gICAgICAjIEdldCBmb3JtXG4gICAgICBAZGIuZm9ybXMuZmluZE9uZSB7IHR5cGU6IFwiV2F0ZXJUZXN0XCIsIGNvZGU6IHRlc3QudHlwZSB9LCAoZm9ybSkgPT5cbiAgICAgICAgIyBDaGVjayBpZiBjb21wbGV0ZWRcbiAgICAgICAgaWYgbm90IHRlc3QuY29tcGxldGVkXG4gICAgICAgICAgQGZvcm1WaWV3ID0gZm9ybXMuaW5zdGFudGlhdGVWaWV3KGZvcm0udmlld3MuZWRpdCwgeyBjdHg6IEBjdHggfSlcblxuICAgICAgICAgICMgTGlzdGVuIHRvIGV2ZW50c1xuICAgICAgICAgIEBsaXN0ZW5UbyBAZm9ybVZpZXcsICdjaGFuZ2UnLCBAc2F2ZVxuICAgICAgICAgIEBsaXN0ZW5UbyBAZm9ybVZpZXcsICdjb21wbGV0ZScsIEBjb21wbGV0ZWRcbiAgICAgICAgICBAbGlzdGVuVG8gQGZvcm1WaWV3LCAnY2xvc2UnLCBAY2xvc2VcbiAgICAgICAgZWxzZVxuICAgICAgICAgIEBmb3JtVmlldyA9IGZvcm1zLmluc3RhbnRpYXRlVmlldyhmb3JtLnZpZXdzLmRldGFpbCwgeyBjdHg6IEBjdHggfSlcbiAgXG4gICAgICAgICMgVE9ETyBkaXNhYmxlIGlmIG5vbi1lZGl0YWJsZVxuICAgICAgICBAJGVsLmh0bWwgdGVtcGxhdGVzWydwYWdlcy9UZXN0UGFnZSddKGNvbXBsZXRlZDogdGVzdC5jb21wbGV0ZWQsIHRpdGxlOiBmb3JtLm5hbWUpXG4gICAgICAgIEAkKCcjY29udGVudHMnKS5hcHBlbmQoQGZvcm1WaWV3LmVsKVxuXG4gICAgICAgIEBmb3JtVmlldy5sb2FkIEB0ZXN0XG5cbiAgZXZlbnRzOlxuICAgIFwiY2xpY2sgI2VkaXRfYnV0dG9uXCIgOiBcImVkaXRcIlxuXG4gIGRlc3Ryb3k6IC0+XG4gICAgIyBMZXQga25vdyB0aGF0IHNhdmVkIGlmIGNsb3NlZCBpbmNvbXBsZXRlZFxuICAgIGlmIEB0ZXN0IGFuZCBub3QgQHRlc3QuY29tcGxldGVkXG4gICAgICBAcGFnZXIuZmxhc2ggXCJUZXN0IHNhdmVkIGFzIGRyYWZ0LlwiXG5cbiAgZWRpdDogLT5cbiAgICAjIE1hcmsgYXMgaW5jb21wbGV0ZVxuICAgIEB0ZXN0LmNvbXBsZXRlZCA9IG51bGxcbiAgICBAZGIudGVzdHMudXBzZXJ0IEB0ZXN0LCA9PiBAcmVuZGVyKClcblxuICBzYXZlOiA9PlxuICAgICMgU2F2ZSB0byBkYlxuICAgIEB0ZXN0ID0gQGZvcm1WaWV3LnNhdmUoKVxuICAgIEBkYi50ZXN0cy51cHNlcnQoQHRlc3QpXG5cbiAgY2xvc2U6ID0+XG4gICAgQHNhdmUoKVxuICAgIEBwYWdlci5jbG9zZVBhZ2UoKVxuXG4gIGNvbXBsZXRlZDogPT5cbiAgICAjIE1hcmsgYXMgY29tcGxldGVkXG4gICAgQHRlc3QuY29tcGxldGVkID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpXG4gICAgQGRiLnRlc3RzLnVwc2VydCBAdGVzdCwgPT4gQHJlbmRlcigpXG5cbiAgZGVsZXRlVGVzdDogLT5cbiAgICBpZiBjb25maXJtKFwiUGVybWFuZW50bHkgZGVsZXRlIHRlc3Q/XCIpXG4gICAgICBAZGIudGVzdHMucmVtb3ZlIEB0ZXN0Ll9pZCwgPT5cbiAgICAgICAgQHRlc3QgPSBudWxsXG4gICAgICAgIEBwYWdlci5jbG9zZVBhZ2UoKVxuICAgICAgICBAcGFnZXIuZmxhc2ggXCJUZXN0IGRlbGV0ZWRcIiwgXCJzdWNjZXNzXCJcblxubW9kdWxlLmV4cG9ydHMgPSBUZXN0UGFnZSJdfQ==
;