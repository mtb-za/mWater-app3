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
  var LocalDb, assert, db_queries;

  assert = chai.assert;

  LocalDb = require("../app/js/db/LocalDb");

  db_queries = require("./db_queries");

  describe('LocalDb', function() {
    before(function() {
      return this.db = new LocalDb('test');
    });
    beforeEach(function(done) {
      this.db.removeCollection('test');
      this.db.addCollection('test');
      return done();
    });
    describe("passes queries", function() {
      return db_queries.call(this);
    });
    it('caches rows', function(done) {
      var _this = this;
      return this.db.test.cache([
        {
          _id: 1,
          a: 'apple'
        }
      ], {}, {}, function() {
        return _this.db.test.find({}).fetch(function(results) {
          assert.equal(results[0].a, 'apple');
          return done();
        });
      });
    });
    it('cache overwrite existing', function(done) {
      var _this = this;
      return this.db.test.cache([
        {
          _id: 1,
          a: 'apple'
        }
      ], {}, {}, function() {
        return _this.db.test.cache([
          {
            _id: 1,
            a: 'banana'
          }
        ], {}, {}, function() {
          return _this.db.test.find({}).fetch(function(results) {
            assert.equal(results[0].a, 'banana');
            return done();
          });
        });
      });
    });
    it("cache doesn't overwrite upsert", function(done) {
      var _this = this;
      return this.db.test.upsert({
        _id: 1,
        a: 'apple'
      }, function() {
        return _this.db.test.cache([
          {
            _id: 1,
            a: 'banana'
          }
        ], {}, {}, function() {
          return _this.db.test.find({}).fetch(function(results) {
            assert.equal(results[0].a, 'apple');
            return done();
          });
        });
      });
    });
    it("cache doesn't overwrite remove", function(done) {
      var _this = this;
      return this.db.test.cache([
        {
          _id: 1,
          a: 'delete'
        }
      ], {}, {}, function() {
        _this.db.test.remove(1, function() {});
        return _this.db.test.cache([
          {
            _id: 1,
            a: 'banana'
          }
        ], {}, {}, function() {
          return _this.db.test.find({}).fetch(function(results) {
            assert.equal(results.length, 0);
            return done();
          });
        });
      });
    });
    it("cache removes missing unsorted", function(done) {
      var _this = this;
      return this.db.test.cache([
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
        return _this.db.test.cache([
          {
            _id: 1,
            a: 'a'
          }, {
            _id: 3,
            a: 'c'
          }
        ], {}, {}, function() {
          return _this.db.test.find({}).fetch(function(results) {
            assert.equal(results.length, 2);
            return done();
          });
        });
      });
    });
    it("cache removes missing filtered", function(done) {
      var _this = this;
      return this.db.test.cache([
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
        return _this.db.test.cache([
          {
            _id: 1,
            a: 'a'
          }
        ], {
          _id: {
            $lt: 3
          }
        }, {}, function() {
          return _this.db.test.find({}, {
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
      return this.db.test.cache([
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
        return _this.db.test.cache([
          {
            _id: 1,
            a: 'a'
          }
        ], {}, {
          sort: ['_id'],
          limit: 2
        }, function() {
          return _this.db.test.find({}, {
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
      return this.db.test.cache([
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
        return _this.db.test.remove(2, function() {
          return _this.db.test.cache([
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
            return _this.db.test.find({}, {
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
      return this.db.test.cache([
        {
          _id: 1,
          a: 'apple'
        }
      ], {}, {}, function() {
        return _this.db.test.upsert({
          _id: 2,
          a: 'banana'
        }, function() {
          return _this.db.test.pendingUpserts(function(results) {
            assert.equal(results.length, 1);
            assert.equal(results[0].a, 'banana');
            return done();
          });
        });
      });
    });
    it("resolves pending upserts", function(done) {
      var _this = this;
      return this.db.test.upsert({
        _id: 2,
        a: 'banana'
      }, function() {
        return _this.db.test.resolveUpsert({
          _id: 2,
          a: 'banana'
        }, function() {
          return _this.db.test.pendingUpserts(function(results) {
            assert.equal(results.length, 0);
            return done();
          });
        });
      });
    });
    it("retains changed pending upserts", function(done) {
      var _this = this;
      return this.db.test.upsert({
        _id: 2,
        a: 'banana'
      }, function() {
        return _this.db.test.upsert({
          _id: 2,
          a: 'banana2'
        }, function() {
          return _this.db.test.resolveUpsert({
            _id: 2,
            a: 'banana'
          }, function() {
            return _this.db.test.pendingUpserts(function(results) {
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
      return this.db.test.upsert({
        _id: 2,
        a: 'banana'
      }, function() {
        return _this.db.test.remove(2, function() {
          return _this.db.test.pendingUpserts(function(results) {
            assert.equal(results.length, 0);
            return done();
          });
        });
      });
    });
    it("returns pending removes", function(done) {
      var _this = this;
      return this.db.test.cache([
        {
          _id: 1,
          a: 'apple'
        }
      ], {}, {}, function() {
        return _this.db.test.remove(1, function() {
          return _this.db.test.pendingRemoves(function(results) {
            assert.equal(results.length, 1);
            assert.equal(results[0], 1);
            return done();
          });
        });
      });
    });
    it("resolves pending removes", function(done) {
      var _this = this;
      return this.db.test.cache([
        {
          _id: 1,
          a: 'apple'
        }
      ], {}, {}, function() {
        return _this.db.test.remove(1, function() {
          return _this.db.test.resolveRemove(1, function() {
            return _this.db.test.pendingRemoves(function(results) {
              assert.equal(results.length, 0);
              return done();
            });
          });
        });
      });
    });
    it("seeds", function(done) {
      var _this = this;
      return this.db.test.seed({
        _id: 1,
        a: 'apple'
      }, function() {
        return _this.db.test.find({}).fetch(function(results) {
          assert.equal(results[0].a, 'apple');
          return done();
        });
      });
    });
    it("does not overwrite existing", function(done) {
      var _this = this;
      return this.db.test.cache([
        {
          _id: 1,
          a: 'banana'
        }
      ], {}, {}, function() {
        return _this.db.test.seed({
          _id: 1,
          a: 'apple'
        }, function() {
          return _this.db.test.find({}).fetch(function(results) {
            assert.equal(results[0].a, 'banana');
            return done();
          });
        });
      });
    });
    return it("does not add removed", function(done) {
      var _this = this;
      return this.db.test.cache([
        {
          _id: 1,
          a: 'apple'
        }
      ], {}, {}, function() {
        return _this.db.test.remove(1, function() {
          return _this.db.test.seed({
            _id: 1,
            a: 'apple'
          }, function() {
            return _this.db.test.find({}).fetch(function(results) {
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
      return this.db = new LocalDb('test', {
        namespace: "db.test"
      });
    });
    beforeEach(function(done) {
      this.db.removeCollection('test');
      this.db.addCollection('test');
      return done();
    });
    it("retains items", function(done) {
      var _this = this;
      return this.db.test.upsert({
        _id: 1,
        a: "Alice"
      }, function() {
        var db2;
        db2 = new LocalDb('test', {
          namespace: "db.test"
        });
        db2.addCollection('test');
        return db2.test.find({}).fetch(function(results) {
          assert.equal(results[0].a, "Alice");
          return done();
        });
      });
    });
    it("retains upserts", function(done) {
      var _this = this;
      return this.db.test.upsert({
        _id: 1,
        a: "Alice"
      }, function() {
        var db2;
        db2 = new LocalDb('test', {
          namespace: "db.test"
        });
        db2.addCollection('test');
        return db2.test.find({}).fetch(function(results) {
          return db2.test.pendingUpserts(function(upserts) {
            assert.deepEqual(results, upserts);
            return done();
          });
        });
      });
    });
    return it("retains removes", function(done) {
      var _this = this;
      return this.db.test.seed({
        _id: 1,
        a: "Alice"
      }, function() {
        return _this.db.test.remove(1, function() {
          var db2;
          db2 = new LocalDb('test', {
            namespace: "db.test"
          });
          db2.addCollection('test');
          return db2.test.pendingRemoves(function(removes) {
            assert.deepEqual(removes, [1]);
            return done();
          });
        });
      });
    });
  });

  describe('LocalDb without local storage', function() {
    before(function() {
      return this.db = new LocalDb('test');
    });
    beforeEach(function(done) {
      this.db.removeCollection('test');
      this.db.addCollection('test');
      return done();
    });
    it("does not retain items", function(done) {
      var _this = this;
      return this.db.test.upsert({
        _id: 1,
        a: "Alice"
      }, function() {
        var db2;
        db2 = new LocalDb('test');
        db2.addCollection('test');
        return db2.test.find({}).fetch(function(results) {
          assert.equal(results.length, 0);
          return done();
        });
      });
    });
    it("does not retain upserts", function(done) {
      var _this = this;
      return this.db.test.upsert({
        _id: 1,
        a: "Alice"
      }, function() {
        var db2;
        db2 = new LocalDb('test');
        db2.addCollection('test');
        return db2.test.find({}).fetch(function(results) {
          return db2.test.pendingUpserts(function(upserts) {
            assert.equal(results.length, 0);
            return done();
          });
        });
      });
    });
    return it("does not retain removes", function(done) {
      var _this = this;
      return this.db.test.seed({
        _id: 1,
        a: "Alice"
      }, function() {
        return _this.db.test.remove(1, function() {
          var db2;
          db2 = new LocalDb('test');
          db2.addCollection('test');
          return db2.test.pendingRemoves(function(removes) {
            assert.equal(removes.length, 0);
            return done();
          });
        });
      });
    });
  });

}).call(this);


},{"../app/js/db/LocalDb":4,"./db_queries":5}],6:[function(require,module,exports){
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
        coordinates: [[[20, 10], [20, 13], [23, 13], [23, 10]]]
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


},{"../app/js/GeoJSON":7}],8:[function(require,module,exports){
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


},{"../app/js/LocationView":11,"./helpers/UIDriver":2}],12:[function(require,module,exports){
(function() {
  var ImagePage, MockImageManager, PhotosQuestion, UIDriver, assert;

  assert = chai.assert;

  PhotosQuestion = require('forms').PhotosQuestion;

  UIDriver = require('./helpers/UIDriver');

  ImagePage = require('../app/js/pages/ImagePage');

  MockImageManager = (function() {
    var getImageUrl;

    function MockImageManager() {}

    MockImageManager.prototype.getImageThumbnailUrl = function(imageUid, success, error) {
      return success("images/" + imageUid + ".jpg");
    };

    getImageUrl = function(imageUid, success, error) {
      return success("images/" + imageUid + ".jpg");
    };

    return MockImageManager;

  })();

  describe('PhotosQuestion', function() {
    return context('With a single image', function() {
      beforeEach(function() {
        this.model = new Backbone.Model;
        this.ctx = {
          imageManager: new MockImageManager()
        };
        return this.question = new PhotosQuestion({
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
        return assert.equal(this.question.$("img.thumbnail").attr("src"), "images/1234.jpg");
      });
      return it('opens page', function() {
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
        this.question.$("img.thumbnail").click();
        assert.isTrue(spy.calledOnce);
        return assert.isTrue(spy.calledWith(ImagePage, {
          id: "1234"
        }));
      });
    });
  });

}).call(this);


},{"forms":"EAVIrc","./helpers/UIDriver":2,"../app/js/pages/ImagePage":13}],5:[function(require,module,exports){
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
        return this.db.test.upsert({
          _id: 1,
          a: "Alice"
        }, function() {
          return _this.db.test.upsert({
            _id: 2,
            a: "Charlie"
          }, function() {
            return _this.db.test.upsert({
              _id: 3,
              a: "Bob"
            }, function() {
              return done();
            });
          });
        });
      });
      it('finds all rows', function(done) {
        var _this = this;
        return this.db.test.find({}).fetch(function(results) {
          assert.equal(3, results.length);
          return done();
        });
      });
      it('finds all rows with options', function(done) {
        var _this = this;
        return this.db.test.find({}, {}).fetch(function(results) {
          assert.equal(3, results.length);
          return done();
        });
      });
      it('filters rows by id', function(done) {
        var _this = this;
        return this.db.test.find({
          _id: 1
        }).fetch(function(results) {
          assert.equal(1, results.length);
          assert.equal('Alice', results[0].a);
          return done();
        });
      });
      it('finds one row', function(done) {
        var _this = this;
        return this.db.test.findOne({
          _id: 2
        }, function(result) {
          assert.equal('Charlie', result.a);
          return done();
        });
      });
      it('removes item', function(done) {
        var _this = this;
        return this.db.test.remove(2, function() {
          return _this.db.test.find({}).fetch(function(results) {
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
            })(), 1) >= 0);
            assert(__indexOf.call((function() {
              var _i, _len, _results;
              _results = [];
              for (_i = 0, _len = results.length; _i < _len; _i++) {
                result = results[_i];
                _results.push(result._id);
              }
              return _results;
            })(), 2) < 0);
            return done();
          });
        });
      });
      it('removes non-existent item', function(done) {
        var _this = this;
        return this.db.test.remove(999, function() {
          return _this.db.test.find({}).fetch(function(results) {
            assert.equal(3, results.length);
            return done();
          });
        });
      });
      it('sorts ascending', function(done) {
        var _this = this;
        return this.db.test.find({}, {
          sort: ['a']
        }).fetch(function(results) {
          assert.deepEqual(_.pluck(results, '_id'), [1, 3, 2]);
          return done();
        });
      });
      it('sorts descending', function(done) {
        var _this = this;
        return this.db.test.find({}, {
          sort: [['a', 'desc']]
        }).fetch(function(results) {
          assert.deepEqual(_.pluck(results, '_id'), [2, 3, 1]);
          return done();
        });
      });
      it('limits', function(done) {
        var _this = this;
        return this.db.test.find({}, {
          sort: ['a'],
          limit: 2
        }).fetch(function(results) {
          assert.deepEqual(_.pluck(results, '_id'), [1, 3]);
          return done();
        });
      });
      return it('fetches independent copies', function(done) {
        var _this = this;
        return this.db.test.findOne({
          _id: 2
        }, function(result) {
          result.a = 'David';
          return _this.db.test.findOne({
            _id: 2
          }, function(result) {
            assert.equal('Charlie', result.a);
            return done();
          });
        });
      });
    });
    it('adds _id to rows', function(done) {
      var _this = this;
      return this.db.test.upsert({
        a: 1
      }, function(item) {
        assert.property(item, '_id');
        assert.lengthOf(item._id, 32);
        return done();
      });
    });
    it('updates by id', function(done) {
      var _this = this;
      return this.db.test.upsert({
        _id: 1,
        a: 1
      }, function(item) {
        return _this.db.test.upsert({
          _id: 1,
          a: 2
        }, function(item) {
          assert.equal(item.a, 2);
          return _this.db.test.find({}).fetch(function(results) {
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
        return this.db.test.upsert({
          _id: 1,
          loc: geopoint(90, 45)
        }, function() {
          return _this.db.test.upsert({
            _id: 2,
            loc: geopoint(90, 46)
          }, function() {
            return _this.db.test.upsert({
              _id: 3,
              loc: geopoint(91, 45)
            }, function() {
              return _this.db.test.upsert({
                _id: 4,
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
        return this.db.test.find(selector).fetch(function(results) {
          assert.deepEqual(_.pluck(results, '_id'), [1, 3, 2, 4]);
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
        return this.db.test.find(selector).fetch(function(results) {
          assert.deepEqual(_.pluck(results, '_id'), [1, 3]);
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
        return this.db.test.find(selector).fetch(function(results) {
          assert.deepEqual(_.pluck(results, '_id'), [1, 3, 2]);
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
                coordinates: [[[89.5, 45.5], [89.5, 46.5], [90.5, 46.5], [90.5, 45.5]]]
              }
            }
          }
        };
        return this.db.test.find(selector).fetch(function(results) {
          assert.deepEqual(_.pluck(results, '_id'), [2]);
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
                coordinates: [[[89.5, 45.5], [89.5, 46.5], [90.5, 46.5], [90.5, 45.5]]]
              }
            }
          }
        };
        return this.db.test.upsert({
          _id: 5
        }, function() {
          return _this.db.test.find(selector).fetch(function(results) {
            assert.deepEqual(_.pluck(results, '_id'), [2]);
            return done();
          });
        });
      });
    });
  };

}).call(this);


},{"../app/js/GeoJSON":7}],"forms":[function(require,module,exports){
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

  exports.PhotoQuestion = require('./PhotoQuestion');

  exports.PhotosQuestion = require('./PhotosQuestion');

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


},{"./form-controls":14,"./DateQuestion":15,"./DropdownQuestion":16,"./NumberQuestion":17,"./QuestionGroup":18,"./SourceQuestion":19,"./SaveCancelForm":20,"./PhotoQuestion":21,"./PhotosQuestion":22,"./Instructions":23}],2:[function(require,module,exports){
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


},{}],7:[function(require,module,exports){
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
      coordinates: [[[sw.lng, sw.lat], [sw.lng, ne.lat], [ne.lng, ne.lat], [ne.lng, sw.lat]]]
    };
  };

  exports.pointInPolygon = function(point, polygon) {
    var bounds;
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


},{}],11:[function(require,module,exports){
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


},{"./LocationFinder":24,"./GeoJSON":7}],4:[function(require,module,exports){
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
      var collection, dbName, namespace;
      dbName = this.name;
      if (this.namespace) {
        namespace = this.namespace + "." + name;
      }
      collection = new Collection(name, namespace);
      this[name] = collection;
      return this.collections[name] = collection;
    };

    LocalDb.prototype.removeCollection = function(name) {
      var dbName, i, key, keys, _i, _j, _len, _ref;
      dbName = this.name;
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


},{"./selector":25,"../GeoJSON":7}],13:[function(require,module,exports){
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
      this.$el.html(templates['ImagePage']());
      return this.imageManager.getImageUrl(this.options.uid, function(url) {
        _this.$("#message_bar").hide();
        return _this.$("#image").attr("src", url).show();
      }, this.error);
    };

    ImagePage.prototype.activate = function() {
      return this.setTitle("Image");
    };

    return ImagePage;

  })(Page);

}).call(this);


},{"../Page":26}],14:[function(require,module,exports){
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

    template : _.template('<div class="prompt"><%=options.prompt%><%=renderRequired()%></div><div class="answer"></div><%=renderHint()%>'),

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

},{}],18:[function(require,module,exports){
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


},{}],20:[function(require,module,exports){
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


},{}],23:[function(require,module,exports){
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


},{}],15:[function(require,module,exports){
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


},{"./form-controls":14}],16:[function(require,module,exports){
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


},{"./form-controls":14}],17:[function(require,module,exports){
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


},{"./form-controls":14}],21:[function(require,module,exports){
(function() {
  var Question,
    _this = this;

  Question = require('./form-controls').Question;

  module.exports = Question.extend({
    events: {
      "click #camera": "cameraClick",
      "click .thumbnail": "thumbnailClick"
    },
    renderAnswer: function(answerEl) {
      var imageUid, success,
        _this = this;
      if (!this.ctx.imageManager) {
        return answerEl.html('<div class="text-error">Images not available</div>');
      } else {
        imageUid = this.model.get(this.id);
        if (!imageUid) {
          return answerEl.html('<img src="img/camera-icon.jpg" id="camera" class="img-rounded" style="max-height: 100px"/>');
        } else {
          answerEl.html(_.template('<img id="<%=imageUid%>" class="img-rounded thumbnail" style="max-height: 100px" onError="this.onerror=null;this.src=\'img/no-image-icon.jpg\';" />', {
            imageUid: imageUid
          }));
          success = function(url) {
            return _this.$("#" + imageUid).attr("src", url);
          };
          return this.ctx.imageManager.getImageThumbnailUrl(imageUid, success, this.error);
        }
      }
    },
    cameraClick: function() {
      return alert("On Android App, would launch Camera+Photo Viewer");
    },
    thumbnailClick: function() {
      return _this.pager.openPage(ImagePage, {
        uid: ev.currentTarget.id
      });
    }
  });

}).call(this);


},{"./form-controls":14}],19:[function(require,module,exports){
(function() {
  var Question, SourceListPage;

  Question = require('./form-controls').Question;

  SourceListPage = require('../pages/SourceListPage');

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
    }
  });

}).call(this);


},{"./form-controls":14,"../pages/SourceListPage":27}],22:[function(require,module,exports){
(function() {
  var ImagePage, PhotosQuestion, Question, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Question = require('./form-controls').Question;

  ImagePage = require('../pages/ImagePage');

  module.exports = PhotosQuestion = (function(_super) {
    __extends(PhotosQuestion, _super);

    function PhotosQuestion() {
      _ref = PhotosQuestion.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    PhotosQuestion.prototype.events = {
      "click #camera": "cameraClick",
      "click .thumbnail": "thumbnailClick"
    };

    PhotosQuestion.prototype.renderAnswer = function(answerEl) {
      var image, images, _i, _len, _results;
      if (!this.ctx.imageManager) {
        return answerEl.html('<div class="text-error">Images not available</div>');
      } else {
        images = this.model.get(this.id);
        answerEl.html(templates['forms/PhotosQuestion']({
          images: images
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

    PhotosQuestion.prototype.setThumbnailUrl = function(id) {
      var success,
        _this = this;
      success = function(url) {
        return _this.$("#" + id).attr("src", url);
      };
      return this.ctx.imageManager.getImageThumbnailUrl(id, success, this.error);
    };

    PhotosQuestion.prototype.cameraClick = function() {
      return alert("In Android App, Camera would open");
    };

    PhotosQuestion.prototype.thumbnailClick = function(ev) {
      return this.ctx.pager.openPage(ImagePage, {
        id: ev.currentTarget.id
      });
    };

    return PhotosQuestion;

  })(Question);

}).call(this);


},{"./form-controls":14,"../pages/ImagePage":13}],24:[function(require,module,exports){
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


},{}],26:[function(require,module,exports){
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


},{}],25:[function(require,module,exports){
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
},{"./EJSON":28}],27:[function(require,module,exports){
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


},{"../Page":26,"../LocationFinder":24,"../GeoJSON":7,"./NewSourcePage":29,"./SourcePage":30}],28:[function(require,module,exports){
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
},{}],29:[function(require,module,exports){
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


},{"../Page":26,"./SourcePage":30,"../forms":"EAVIrc"}],30:[function(require,module,exports){
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
      photosView = new forms.PhotosQuestion({
        id: 'photos',
        model: new Backbone.Model(this.source),
        prompt: 'Photos',
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


},{"../Page":26,"../LocationView":11,"./SourceMapPage":31,"./SourceEditPage":32,"./NewTestPage":33,"./TestPage":34,"./SourceNotePage":35,"../forms":"EAVIrc"}],31:[function(require,module,exports){
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


},{"../Page":26,"./SourcePage":30,"../ItemTracker":9,"../GeoJSON":7,"../LocationFinder":24}],33:[function(require,module,exports){
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
        started: new Date().toISOString(),
        name: _.findWhere(this.forms, {
          code: testCode
        }).name
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


},{"../Page":26,"./TestPage":34}],32:[function(require,module,exports){
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


},{"../Page":26,"../forms":"EAVIrc"}],35:[function(require,module,exports){
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
              options: [['ok', 'Functional'], ['repair', 'Needs repair'], ['broken', 'Non-functional'], ['missing', 'No longer exists']],
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


},{"../Page":26,"../forms":"EAVIrc"}],34:[function(require,module,exports){
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


},{"../Page":26,"../forms":"EAVIrc"}]},{},[1,6,8,3,10,12,5])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL3Rlc3QvRHJvcGRvd25RdWVzdGlvblRlc3RzLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvdGVzdC9Mb2NhbERiVGVzdHMuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My90ZXN0L0dlb0pTT05UZXN0cy5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL3Rlc3QvSXRlbVRyYWNrZXJUZXN0cy5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL3Rlc3QvTG9jYXRpb25WaWV3VGVzdHMuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My90ZXN0L1Bob3Rvc1F1ZXN0aW9uc1Rlc3RzLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvdGVzdC9kYl9xdWVyaWVzLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL2Zvcm1zL2luZGV4LmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvdGVzdC9oZWxwZXJzL1VJRHJpdmVyLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL0l0ZW1UcmFja2VyLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL0dlb0pTT04uY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvTG9jYXRpb25WaWV3LmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL2RiL0xvY2FsRGIuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvcGFnZXMvSW1hZ2VQYWdlLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL2Zvcm1zL2Zvcm0tY29udHJvbHMuanMiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9mb3Jtcy9RdWVzdGlvbkdyb3VwLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL2Zvcm1zL1NhdmVDYW5jZWxGb3JtLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL2Zvcm1zL0luc3RydWN0aW9ucy5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9mb3Jtcy9EYXRlUXVlc3Rpb24uY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvZm9ybXMvRHJvcGRvd25RdWVzdGlvbi5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9mb3Jtcy9OdW1iZXJRdWVzdGlvbi5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9mb3Jtcy9QaG90b1F1ZXN0aW9uLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL2Zvcm1zL1NvdXJjZVF1ZXN0aW9uLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL2Zvcm1zL1Bob3Rvc1F1ZXN0aW9uLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL0xvY2F0aW9uRmluZGVyLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL1BhZ2UuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvZGIvc2VsZWN0b3IuanMiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9wYWdlcy9Tb3VyY2VMaXN0UGFnZS5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9kYi9FSlNPTi5qcyIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL3BhZ2VzL05ld1NvdXJjZVBhZ2UuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvcGFnZXMvU291cmNlUGFnZS5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9wYWdlcy9Tb3VyY2VNYXBQYWdlLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL3BhZ2VzL05ld1Rlc3RQYWdlLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL3BhZ2VzL1NvdXJjZUVkaXRQYWdlLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL3BhZ2VzL1NvdXJjZU5vdGVQYWdlLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL3BhZ2VzL1Rlc3RQYWdlLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Q0FBQSxLQUFBLDRCQUFBOztDQUFBLENBQUEsQ0FBUyxDQUFJLEVBQWI7O0NBQUEsQ0FDQSxDQUFtQixJQUFBLFNBQW5COztDQURBLENBRUEsQ0FBVyxJQUFBLENBQVgsWUFBVzs7Q0FGWCxDQVlBLENBQTZCLEtBQTdCLENBQTZCLFNBQTdCO0NBQ1UsQ0FBc0IsQ0FBQSxJQUE5QixFQUE4QixFQUE5QixTQUFBO0NBQ0UsRUFBVyxHQUFYLEdBQVcsQ0FBWDtDQUNFLEVBQWEsQ0FBWixDQUFELEdBQUE7Q0FDQyxFQUFlLENBQWYsSUFBRCxPQUFBLENBQWdCO0NBQ2QsQ0FBUyxDQUFDLElBQVYsQ0FBMEIsRUFBMUI7Q0FBQSxDQUNPLEVBQUMsQ0FBUixLQUFBO0NBREEsQ0FF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Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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Q0UsRUFBUSxDQUFSLENBQUMsS0FBRDtDQUFBLElBQ0MsSUFBRCxDQUFBO0NBQ0MsQ0FBNEIsR0FBNUIsSUFBRCxLQUFBLEdBQUE7Q0FIRixRQUE0QjtRQUZwQjtDQTVEWixJQTREWTs7Q0E1RFo7O0NBRHFCOztDQUh2QixDQXVFQSxDQUFpQixHQUFYLENBQU4sQ0F2RUE7Q0FBQSIsInNvdXJjZXNDb250ZW50IjpbImFzc2VydCA9IGNoYWkuYXNzZXJ0XG5Ecm9wZG93blF1ZXN0aW9uID0gcmVxdWlyZSgnZm9ybXMnKS5Ecm9wZG93blF1ZXN0aW9uXG5VSURyaXZlciA9IHJlcXVpcmUgJy4vaGVscGVycy9VSURyaXZlcidcblxuIyBjbGFzcyBNb2NrTG9jYXRpb25GaW5kZXJcbiMgICBjb25zdHJ1Y3RvcjogIC0+XG4jICAgICBfLmV4dGVuZCBALCBCYWNrYm9uZS5FdmVudHNcblxuIyAgIGdldExvY2F0aW9uOiAtPlxuIyAgIHN0YXJ0V2F0Y2g6IC0+XG4jICAgc3RvcFdhdGNoOiAtPlxuXG5kZXNjcmliZSAnRHJvcGRvd25RdWVzdGlvbicsIC0+XG4gIGNvbnRleHQgJ1dpdGggYSBmZXcgb3B0aW9ucycsIC0+XG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgQG1vZGVsID0gbmV3IEJhY2tib25lLk1vZGVsKClcbiAgICAgIEBxdWVzdGlvbiA9IG5ldyBEcm9wZG93blF1ZXN0aW9uXG4gICAgICAgIG9wdGlvbnM6IFtbJ2EnLCAnQXBwbGUnXSwgWydiJywgJ0JhbmFuYSddXVxuICAgICAgICBtb2RlbDogQG1vZGVsXG4gICAgICAgIGlkOiBcInExXCJcblxuICAgIGl0ICdhY2NlcHRzIGtub3duIHZhbHVlJywgLT5cbiAgICAgIEBtb2RlbC5zZXQocTE6ICdhJylcbiAgICAgIGFzc2VydC5lcXVhbCBAbW9kZWwuZ2V0KCdxMScpLCAnYSdcbiAgICAgIGFzc2VydC5pc0ZhbHNlIEBxdWVzdGlvbi4kKFwic2VsZWN0XCIpLmlzKFwiOmRpc2FibGVkXCIpXG5cbiAgICBpdCAnaXMgZGlzYWJsZWQgd2l0aCB1bmtub3duIHZhbHVlJywgLT5cbiAgICAgIEBtb2RlbC5zZXQocTE6ICd4JylcbiAgICAgIGFzc2VydC5lcXVhbCBAbW9kZWwuZ2V0KCdxMScpLCAneCdcbiAgICAgIGFzc2VydC5pc1RydWUgQHF1ZXN0aW9uLiQoXCJzZWxlY3RcIikuaXMoXCI6ZGlzYWJsZWRcIilcblxuICAgIGl0ICdpcyBub3QgZGlzYWJsZWQgd2l0aCBlbXB0eSB2YWx1ZScsIC0+XG4gICAgICBAbW9kZWwuc2V0KHExOiBudWxsKVxuICAgICAgYXNzZXJ0LmVxdWFsIEBtb2RlbC5nZXQoJ3ExJyksIG51bGxcbiAgICAgIGFzc2VydC5pc0ZhbHNlIEBxdWVzdGlvbi4kKFwic2VsZWN0XCIpLmlzKFwiOmRpc2FibGVkXCIpXG5cbiAgICBpdCAnaXMgcmVlbmFibGVkIHdpdGggc2V0dGluZyB2YWx1ZScsIC0+XG4gICAgICBAbW9kZWwuc2V0KHExOiAneCcpXG4gICAgICBhc3NlcnQuZXF1YWwgQG1vZGVsLmdldCgncTEnKSwgJ3gnXG4gICAgICBAcXVlc3Rpb24uc2V0T3B0aW9ucyhbWydhJywgJ0FwcGxlJ10sIFsnYicsICdCYW5hbmEnXSwgWyd4JywgJ0tpd2knXV0pXG4gICAgICBhc3NlcnQuaXNGYWxzZSBAcXVlc3Rpb24uJChcInNlbGVjdFwiKS5pcyhcIjpkaXNhYmxlZFwiKVxuXG4iLCJhc3NlcnQgPSBjaGFpLmFzc2VydFxuTG9jYWxEYiA9IHJlcXVpcmUgXCIuLi9hcHAvanMvZGIvTG9jYWxEYlwiXG5kYl9xdWVyaWVzID0gcmVxdWlyZSBcIi4vZGJfcXVlcmllc1wiXG5cbmRlc2NyaWJlICdMb2NhbERiJywgLT5cbiAgYmVmb3JlIC0+XG4gICAgQGRiID0gbmV3IExvY2FsRGIoJ3Rlc3QnKVxuXG4gIGJlZm9yZUVhY2ggKGRvbmUpIC0+XG4gICAgQGRiLnJlbW92ZUNvbGxlY3Rpb24oJ3Rlc3QnKVxuICAgIEBkYi5hZGRDb2xsZWN0aW9uKCd0ZXN0JylcbiAgICBkb25lKClcblxuICBkZXNjcmliZSBcInBhc3NlcyBxdWVyaWVzXCIsIC0+XG4gICAgZGJfcXVlcmllcy5jYWxsKHRoaXMpXG5cbiAgaXQgJ2NhY2hlcyByb3dzJywgKGRvbmUpIC0+XG4gICAgQGRiLnRlc3QuY2FjaGUgW3sgX2lkOiAxLCBhOiAnYXBwbGUnIH1dLCB7fSwge30sID0+XG4gICAgICBAZGIudGVzdC5maW5kKHt9KS5mZXRjaCAocmVzdWx0cykgLT5cbiAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHNbMF0uYSwgJ2FwcGxlJ1xuICAgICAgICBkb25lKClcblxuICBpdCAnY2FjaGUgb3ZlcndyaXRlIGV4aXN0aW5nJywgKGRvbmUpIC0+XG4gICAgQGRiLnRlc3QuY2FjaGUgW3sgX2lkOiAxLCBhOiAnYXBwbGUnIH1dLCB7fSwge30sID0+XG4gICAgICBAZGIudGVzdC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdiYW5hbmEnIH1dLCB7fSwge30sID0+XG4gICAgICAgIEBkYi50ZXN0LmZpbmQoe30pLmZldGNoIChyZXN1bHRzKSAtPlxuICAgICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzWzBdLmEsICdiYW5hbmEnXG4gICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJjYWNoZSBkb2Vzbid0IG92ZXJ3cml0ZSB1cHNlcnRcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnRlc3QudXBzZXJ0IHsgX2lkOiAxLCBhOiAnYXBwbGUnIH0sID0+XG4gICAgICBAZGIudGVzdC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdiYW5hbmEnIH1dLCB7fSwge30sID0+XG4gICAgICAgIEBkYi50ZXN0LmZpbmQoe30pLmZldGNoIChyZXN1bHRzKSAtPlxuICAgICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzWzBdLmEsICdhcHBsZSdcbiAgICAgICAgICBkb25lKClcblxuICBpdCBcImNhY2hlIGRvZXNuJ3Qgb3ZlcndyaXRlIHJlbW92ZVwiLCAoZG9uZSkgLT5cbiAgICBAZGIudGVzdC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdkZWxldGUnIH1dLCB7fSwge30sID0+XG4gICAgICBAZGIudGVzdC5yZW1vdmUgMSwgPT5cbiAgICAgIEBkYi50ZXN0LmNhY2hlIFt7IF9pZDogMSwgYTogJ2JhbmFuYScgfV0sIHt9LCB7fSwgPT5cbiAgICAgICAgQGRiLnRlc3QuZmluZCh7fSkuZmV0Y2ggKHJlc3VsdHMpIC0+XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHMubGVuZ3RoLCAwXG4gICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJjYWNoZSByZW1vdmVzIG1pc3NpbmcgdW5zb3J0ZWRcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnRlc3QuY2FjaGUgW3sgX2lkOiAxLCBhOiAnYScgfSwgeyBfaWQ6IDIsIGE6ICdiJyB9LCB7IF9pZDogMywgYTogJ2MnIH1dLCB7fSwge30sID0+XG4gICAgICBAZGIudGVzdC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdhJyB9LCB7IF9pZDogMywgYTogJ2MnIH1dLCB7fSwge30sID0+XG4gICAgICAgIEBkYi50ZXN0LmZpbmQoe30pLmZldGNoIChyZXN1bHRzKSAtPlxuICAgICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzLmxlbmd0aCwgMlxuICAgICAgICAgIGRvbmUoKVxuXG4gIGl0IFwiY2FjaGUgcmVtb3ZlcyBtaXNzaW5nIGZpbHRlcmVkXCIsIChkb25lKSAtPlxuICAgIEBkYi50ZXN0LmNhY2hlIFt7IF9pZDogMSwgYTogJ2EnIH0sIHsgX2lkOiAyLCBhOiAnYicgfSwgeyBfaWQ6IDMsIGE6ICdjJyB9XSwge30sIHt9LCA9PlxuICAgICAgQGRiLnRlc3QuY2FjaGUgW3sgX2lkOiAxLCBhOiAnYScgfV0sIHtfaWQ6IHskbHQ6M319LCB7fSwgPT5cbiAgICAgICAgQGRiLnRlc3QuZmluZCh7fSwge3NvcnQ6WydfaWQnXX0pLmZldGNoIChyZXN1bHRzKSAtPlxuICAgICAgICAgIGFzc2VydC5kZWVwRXF1YWwgXy5wbHVjayhyZXN1bHRzLCAnX2lkJyksIFsxLDNdXG4gICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJjYWNoZSByZW1vdmVzIG1pc3Npbmcgc29ydGVkIGxpbWl0ZWRcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnRlc3QuY2FjaGUgW3sgX2lkOiAxLCBhOiAnYScgfSwgeyBfaWQ6IDIsIGE6ICdiJyB9LCB7IF9pZDogMywgYTogJ2MnIH1dLCB7fSwge30sID0+XG4gICAgICBAZGIudGVzdC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdhJyB9XSwge30sIHtzb3J0OlsnX2lkJ10sIGxpbWl0OjJ9LCA9PlxuICAgICAgICBAZGIudGVzdC5maW5kKHt9LCB7c29ydDpbJ19pZCddfSkuZmV0Y2ggKHJlc3VsdHMpIC0+XG4gICAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCBfLnBsdWNrKHJlc3VsdHMsICdfaWQnKSwgWzEsM11cbiAgICAgICAgICBkb25lKClcblxuICBpdCBcImNhY2hlIGRvZXMgbm90IHJlbW92ZSBtaXNzaW5nIHNvcnRlZCBsaW1pdGVkIHBhc3QgZW5kXCIsIChkb25lKSAtPlxuICAgIEBkYi50ZXN0LmNhY2hlIFt7IF9pZDogMSwgYTogJ2EnIH0sIHsgX2lkOiAyLCBhOiAnYicgfSwgeyBfaWQ6IDMsIGE6ICdjJyB9LCB7IF9pZDogNCwgYTogJ2QnIH1dLCB7fSwge30sID0+XG4gICAgICBAZGIudGVzdC5yZW1vdmUgMiwgPT5cbiAgICAgICAgQGRiLnRlc3QuY2FjaGUgW3sgX2lkOiAxLCBhOiAnYScgfSwgeyBfaWQ6IDIsIGE6ICdiJyB9XSwge30sIHtzb3J0OlsnX2lkJ10sIGxpbWl0OjJ9LCA9PlxuICAgICAgICAgIEBkYi50ZXN0LmZpbmQoe30sIHtzb3J0OlsnX2lkJ119KS5mZXRjaCAocmVzdWx0cykgLT5cbiAgICAgICAgICAgIGFzc2VydC5kZWVwRXF1YWwgXy5wbHVjayhyZXN1bHRzLCAnX2lkJyksIFsxLDMsNF1cbiAgICAgICAgICAgIGRvbmUoKVxuXG4gIGl0IFwicmV0dXJucyBwZW5kaW5nIHVwc2VydHNcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnRlc3QuY2FjaGUgW3sgX2lkOiAxLCBhOiAnYXBwbGUnIH1dLCB7fSwge30sID0+XG4gICAgICBAZGIudGVzdC51cHNlcnQgeyBfaWQ6IDIsIGE6ICdiYW5hbmEnIH0sID0+XG4gICAgICAgIEBkYi50ZXN0LnBlbmRpbmdVcHNlcnRzIChyZXN1bHRzKSA9PlxuICAgICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzLmxlbmd0aCwgMVxuICAgICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzWzBdLmEsICdiYW5hbmEnXG4gICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJyZXNvbHZlcyBwZW5kaW5nIHVwc2VydHNcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnRlc3QudXBzZXJ0IHsgX2lkOiAyLCBhOiAnYmFuYW5hJyB9LCA9PlxuICAgICAgQGRiLnRlc3QucmVzb2x2ZVVwc2VydCB7IF9pZDogMiwgYTogJ2JhbmFuYScgfSwgPT5cbiAgICAgICAgQGRiLnRlc3QucGVuZGluZ1Vwc2VydHMgKHJlc3VsdHMpID0+XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHMubGVuZ3RoLCAwXG4gICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJyZXRhaW5zIGNoYW5nZWQgcGVuZGluZyB1cHNlcnRzXCIsIChkb25lKSAtPlxuICAgIEBkYi50ZXN0LnVwc2VydCB7IF9pZDogMiwgYTogJ2JhbmFuYScgfSwgPT5cbiAgICAgIEBkYi50ZXN0LnVwc2VydCB7IF9pZDogMiwgYTogJ2JhbmFuYTInIH0sID0+XG4gICAgICAgIEBkYi50ZXN0LnJlc29sdmVVcHNlcnQgeyBfaWQ6IDIsIGE6ICdiYW5hbmEnIH0sID0+XG4gICAgICAgICAgQGRiLnRlc3QucGVuZGluZ1Vwc2VydHMgKHJlc3VsdHMpID0+XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0cy5sZW5ndGgsIDFcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzWzBdLmEsICdiYW5hbmEyJ1xuICAgICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJyZW1vdmVzIHBlbmRpbmcgdXBzZXJ0c1wiLCAoZG9uZSkgLT5cbiAgICBAZGIudGVzdC51cHNlcnQgeyBfaWQ6IDIsIGE6ICdiYW5hbmEnIH0sID0+XG4gICAgICBAZGIudGVzdC5yZW1vdmUgMiwgPT5cbiAgICAgICAgQGRiLnRlc3QucGVuZGluZ1Vwc2VydHMgKHJlc3VsdHMpID0+XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHMubGVuZ3RoLCAwXG4gICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJyZXR1cm5zIHBlbmRpbmcgcmVtb3Zlc1wiLCAoZG9uZSkgLT5cbiAgICBAZGIudGVzdC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdhcHBsZScgfV0sIHt9LCB7fSwgPT5cbiAgICAgIEBkYi50ZXN0LnJlbW92ZSAxLCA9PlxuICAgICAgICBAZGIudGVzdC5wZW5kaW5nUmVtb3ZlcyAocmVzdWx0cykgPT5cbiAgICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0cy5sZW5ndGgsIDFcbiAgICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0c1swXSwgMVxuICAgICAgICAgIGRvbmUoKVxuXG4gIGl0IFwicmVzb2x2ZXMgcGVuZGluZyByZW1vdmVzXCIsIChkb25lKSAtPlxuICAgIEBkYi50ZXN0LmNhY2hlIFt7IF9pZDogMSwgYTogJ2FwcGxlJyB9XSwge30sIHt9LCA9PlxuICAgICAgQGRiLnRlc3QucmVtb3ZlIDEsID0+XG4gICAgICAgIEBkYi50ZXN0LnJlc29sdmVSZW1vdmUgMSwgPT5cbiAgICAgICAgICBAZGIudGVzdC5wZW5kaW5nUmVtb3ZlcyAocmVzdWx0cykgPT5cbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzLmxlbmd0aCwgMFxuICAgICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJzZWVkc1wiLCAoZG9uZSkgLT5cbiAgICBAZGIudGVzdC5zZWVkIHsgX2lkOiAxLCBhOiAnYXBwbGUnIH0sID0+XG4gICAgICBAZGIudGVzdC5maW5kKHt9KS5mZXRjaCAocmVzdWx0cykgLT5cbiAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHNbMF0uYSwgJ2FwcGxlJ1xuICAgICAgICBkb25lKClcblxuICBpdCBcImRvZXMgbm90IG92ZXJ3cml0ZSBleGlzdGluZ1wiLCAoZG9uZSkgLT5cbiAgICBAZGIudGVzdC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdiYW5hbmEnIH1dLCB7fSwge30sID0+XG4gICAgICBAZGIudGVzdC5zZWVkIHsgX2lkOiAxLCBhOiAnYXBwbGUnIH0sID0+XG4gICAgICAgIEBkYi50ZXN0LmZpbmQoe30pLmZldGNoIChyZXN1bHRzKSAtPlxuICAgICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzWzBdLmEsICdiYW5hbmEnXG4gICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJkb2VzIG5vdCBhZGQgcmVtb3ZlZFwiLCAoZG9uZSkgLT5cbiAgICBAZGIudGVzdC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdhcHBsZScgfV0sIHt9LCB7fSwgPT5cbiAgICAgIEBkYi50ZXN0LnJlbW92ZSAxLCA9PlxuICAgICAgICBAZGIudGVzdC5zZWVkIHsgX2lkOiAxLCBhOiAnYXBwbGUnIH0sID0+XG4gICAgICAgICAgQGRiLnRlc3QuZmluZCh7fSkuZmV0Y2ggKHJlc3VsdHMpIC0+XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0cy5sZW5ndGgsIDBcbiAgICAgICAgICAgIGRvbmUoKVxuXG5kZXNjcmliZSAnTG9jYWxEYiB3aXRoIGxvY2FsIHN0b3JhZ2UnLCAtPlxuICBiZWZvcmUgLT5cbiAgICBAZGIgPSBuZXcgTG9jYWxEYigndGVzdCcsIHsgbmFtZXNwYWNlOiBcImRiLnRlc3RcIiB9KVxuXG4gIGJlZm9yZUVhY2ggKGRvbmUpIC0+XG4gICAgQGRiLnJlbW92ZUNvbGxlY3Rpb24oJ3Rlc3QnKVxuICAgIEBkYi5hZGRDb2xsZWN0aW9uKCd0ZXN0JylcbiAgICBkb25lKClcblxuICBpdCBcInJldGFpbnMgaXRlbXNcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnRlc3QudXBzZXJ0IHsgX2lkOjEsIGE6XCJBbGljZVwiIH0sID0+XG4gICAgICBkYjIgPSBuZXcgTG9jYWxEYigndGVzdCcsIHsgbmFtZXNwYWNlOiBcImRiLnRlc3RcIiB9KVxuICAgICAgZGIyLmFkZENvbGxlY3Rpb24gJ3Rlc3QnXG4gICAgICBkYjIudGVzdC5maW5kKHt9KS5mZXRjaCAocmVzdWx0cykgLT5cbiAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHNbMF0uYSwgXCJBbGljZVwiXG4gICAgICAgIGRvbmUoKVxuXG4gIGl0IFwicmV0YWlucyB1cHNlcnRzXCIsIChkb25lKSAtPlxuICAgIEBkYi50ZXN0LnVwc2VydCB7IF9pZDoxLCBhOlwiQWxpY2VcIiB9LCA9PlxuICAgICAgZGIyID0gbmV3IExvY2FsRGIoJ3Rlc3QnLCB7IG5hbWVzcGFjZTogXCJkYi50ZXN0XCIgfSlcbiAgICAgIGRiMi5hZGRDb2xsZWN0aW9uICd0ZXN0J1xuICAgICAgZGIyLnRlc3QuZmluZCh7fSkuZmV0Y2ggKHJlc3VsdHMpIC0+XG4gICAgICAgIGRiMi50ZXN0LnBlbmRpbmdVcHNlcnRzICh1cHNlcnRzKSAtPlxuICAgICAgICAgIGFzc2VydC5kZWVwRXF1YWwgcmVzdWx0cywgdXBzZXJ0c1xuICAgICAgICAgIGRvbmUoKVxuXG4gIGl0IFwicmV0YWlucyByZW1vdmVzXCIsIChkb25lKSAtPlxuICAgIEBkYi50ZXN0LnNlZWQgeyBfaWQ6MSwgYTpcIkFsaWNlXCIgfSwgPT5cbiAgICAgIEBkYi50ZXN0LnJlbW92ZSAxLCA9PlxuICAgICAgICBkYjIgPSBuZXcgTG9jYWxEYigndGVzdCcsIHsgbmFtZXNwYWNlOiBcImRiLnRlc3RcIiB9KVxuICAgICAgICBkYjIuYWRkQ29sbGVjdGlvbiAndGVzdCdcbiAgICAgICAgZGIyLnRlc3QucGVuZGluZ1JlbW92ZXMgKHJlbW92ZXMpIC0+XG4gICAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCByZW1vdmVzLCBbMV1cbiAgICAgICAgICBkb25lKClcblxuZGVzY3JpYmUgJ0xvY2FsRGIgd2l0aG91dCBsb2NhbCBzdG9yYWdlJywgLT5cbiAgYmVmb3JlIC0+XG4gICAgQGRiID0gbmV3IExvY2FsRGIoJ3Rlc3QnKVxuXG4gIGJlZm9yZUVhY2ggKGRvbmUpIC0+XG4gICAgQGRiLnJlbW92ZUNvbGxlY3Rpb24oJ3Rlc3QnKVxuICAgIEBkYi5hZGRDb2xsZWN0aW9uKCd0ZXN0JylcbiAgICBkb25lKClcblxuICBpdCBcImRvZXMgbm90IHJldGFpbiBpdGVtc1wiLCAoZG9uZSkgLT5cbiAgICBAZGIudGVzdC51cHNlcnQgeyBfaWQ6MSwgYTpcIkFsaWNlXCIgfSwgPT5cbiAgICAgIGRiMiA9IG5ldyBMb2NhbERiKCd0ZXN0JylcbiAgICAgIGRiMi5hZGRDb2xsZWN0aW9uICd0ZXN0J1xuICAgICAgZGIyLnRlc3QuZmluZCh7fSkuZmV0Y2ggKHJlc3VsdHMpIC0+XG4gICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzLmxlbmd0aCwgMFxuICAgICAgICBkb25lKClcblxuICBpdCBcImRvZXMgbm90IHJldGFpbiB1cHNlcnRzXCIsIChkb25lKSAtPlxuICAgIEBkYi50ZXN0LnVwc2VydCB7IF9pZDoxLCBhOlwiQWxpY2VcIiB9LCA9PlxuICAgICAgZGIyID0gbmV3IExvY2FsRGIoJ3Rlc3QnKVxuICAgICAgZGIyLmFkZENvbGxlY3Rpb24gJ3Rlc3QnXG4gICAgICBkYjIudGVzdC5maW5kKHt9KS5mZXRjaCAocmVzdWx0cykgLT5cbiAgICAgICAgZGIyLnRlc3QucGVuZGluZ1Vwc2VydHMgKHVwc2VydHMpIC0+XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHMubGVuZ3RoLCAwXG4gICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJkb2VzIG5vdCByZXRhaW4gcmVtb3Zlc1wiLCAoZG9uZSkgLT5cbiAgICBAZGIudGVzdC5zZWVkIHsgX2lkOjEsIGE6XCJBbGljZVwiIH0sID0+XG4gICAgICBAZGIudGVzdC5yZW1vdmUgMSwgPT5cbiAgICAgICAgZGIyID0gbmV3IExvY2FsRGIoJ3Rlc3QnKVxuICAgICAgICBkYjIuYWRkQ29sbGVjdGlvbiAndGVzdCdcbiAgICAgICAgZGIyLnRlc3QucGVuZGluZ1JlbW92ZXMgKHJlbW92ZXMpIC0+XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsIHJlbW92ZXMubGVuZ3RoLCAwXG4gICAgICAgICAgZG9uZSgpXG5cbiIsImFzc2VydCA9IGNoYWkuYXNzZXJ0XG5HZW9KU09OID0gcmVxdWlyZSBcIi4uL2FwcC9qcy9HZW9KU09OXCJcblxuZGVzY3JpYmUgJ0dlb0pTT04nLCAtPlxuICBpdCAncmV0dXJucyBhIHByb3BlciBwb2x5Z29uJywgLT5cbiAgICBzb3V0aFdlc3QgPSBuZXcgTC5MYXRMbmcoMTAsIDIwKVxuICAgIG5vcnRoRWFzdCA9IG5ldyBMLkxhdExuZygxMywgMjMpXG4gICAgYm91bmRzID0gbmV3IEwuTGF0TG5nQm91bmRzKHNvdXRoV2VzdCwgbm9ydGhFYXN0KVxuXG4gICAganNvbiA9IEdlb0pTT04ubGF0TG5nQm91bmRzVG9HZW9KU09OKGJvdW5kcylcbiAgICBhc3NlcnQgXy5pc0VxdWFsIGpzb24sIHtcbiAgICAgIHR5cGU6IFwiUG9seWdvblwiLFxuICAgICAgY29vcmRpbmF0ZXM6IFtcbiAgICAgICAgW1syMCwxMF0sWzIwLDEzXSxbMjMsMTNdLFsyMywxMF1dXG4gICAgICBdXG4gICAgfVxuXG4gIGl0ICdnZXRzIHJlbGF0aXZlIGxvY2F0aW9uIE4nLCAtPlxuICAgIGZyb20gPSB7IHR5cGU6IFwiUG9pbnRcIiwgY29vcmRpbmF0ZXM6IFsxMCwgMjBdfVxuICAgIHRvID0geyB0eXBlOiBcIlBvaW50XCIsIGNvb3JkaW5hdGVzOiBbMTAsIDIxXX1cbiAgICBzdHIgPSBHZW9KU09OLmdldFJlbGF0aXZlTG9jYXRpb24oZnJvbSwgdG8pXG4gICAgYXNzZXJ0LmVxdWFsIHN0ciwgJzExMS4ya20gTidcblxuICBpdCAnZ2V0cyByZWxhdGl2ZSBsb2NhdGlvbiBTJywgLT5cbiAgICBmcm9tID0geyB0eXBlOiBcIlBvaW50XCIsIGNvb3JkaW5hdGVzOiBbMTAsIDIwXX1cbiAgICB0byA9IHsgdHlwZTogXCJQb2ludFwiLCBjb29yZGluYXRlczogWzEwLCAxOV19XG4gICAgc3RyID0gR2VvSlNPTi5nZXRSZWxhdGl2ZUxvY2F0aW9uKGZyb20sIHRvKVxuICAgIGFzc2VydC5lcXVhbCBzdHIsICcxMTEuMmttIFMnXG4iLCJhc3NlcnQgPSBjaGFpLmFzc2VydFxuSXRlbVRyYWNrZXIgPSByZXF1aXJlIFwiLi4vYXBwL2pzL0l0ZW1UcmFja2VyXCJcblxuZGVzY3JpYmUgJ0l0ZW1UcmFja2VyJywgLT5cbiAgYmVmb3JlRWFjaCAtPlxuICAgIEB0cmFja2VyID0gbmV3IEl0ZW1UcmFja2VyKClcblxuICBpdCBcInJlY29yZHMgYWRkc1wiLCAtPlxuICAgIGl0ZW1zID0gIFtcbiAgICAgIF9pZDogMSwgeDoxXG4gICAgICBfaWQ6IDIsIHg6MlxuICAgIF1cbiAgICBbYWRkcywgcmVtb3Zlc10gPSBAdHJhY2tlci51cGRhdGUoaXRlbXMpXG4gICAgYXNzZXJ0LmRlZXBFcXVhbCBhZGRzLCBpdGVtc1xuICAgIGFzc2VydC5kZWVwRXF1YWwgcmVtb3ZlcywgW11cblxuICBpdCBcInJlbWVtYmVycyBpdGVtc1wiLCAtPlxuICAgIGl0ZW1zID0gIFtcbiAgICAgIHtfaWQ6IDEsIHg6MX1cbiAgICAgIHtfaWQ6IDIsIHg6Mn1cbiAgICBdXG4gICAgW2FkZHMsIHJlbW92ZXNdID0gQHRyYWNrZXIudXBkYXRlKGl0ZW1zKVxuICAgIFthZGRzLCByZW1vdmVzXSA9IEB0cmFja2VyLnVwZGF0ZShpdGVtcylcbiAgICBhc3NlcnQuZGVlcEVxdWFsIGFkZHMsIFtdXG4gICAgYXNzZXJ0LmRlZXBFcXVhbCByZW1vdmVzLCBbXVxuXG4gIGl0IFwic2VlcyByZW1vdmVkIGl0ZW1zXCIsIC0+XG4gICAgaXRlbXMxID0gIFtcbiAgICAgIHtfaWQ6IDEsIHg6MX1cbiAgICAgIHtfaWQ6IDIsIHg6Mn1cbiAgICBdXG4gICAgaXRlbXMyID0gIFtcbiAgICAgIHtfaWQ6IDEsIHg6MX1cbiAgICBdXG4gICAgQHRyYWNrZXIudXBkYXRlKGl0ZW1zMSlcbiAgICBbYWRkcywgcmVtb3Zlc10gPSBAdHJhY2tlci51cGRhdGUoaXRlbXMyKVxuICAgIGFzc2VydC5kZWVwRXF1YWwgYWRkcywgW11cbiAgICBhc3NlcnQuZGVlcEVxdWFsIHJlbW92ZXMsIFt7X2lkOiAyLCB4OjJ9XVxuXG4gIGl0IFwic2VlcyByZW1vdmVkIGNoYW5nZXNcIiwgLT5cbiAgICBpdGVtczEgPSAgW1xuICAgICAge19pZDogMSwgeDoxfVxuICAgICAge19pZDogMiwgeDoyfVxuICAgIF1cbiAgICBpdGVtczIgPSAgW1xuICAgICAge19pZDogMSwgeDoxfVxuICAgICAge19pZDogMiwgeDo0fVxuICAgIF1cbiAgICBAdHJhY2tlci51cGRhdGUoaXRlbXMxKVxuICAgIFthZGRzLCByZW1vdmVzXSA9IEB0cmFja2VyLnVwZGF0ZShpdGVtczIpXG4gICAgYXNzZXJ0LmRlZXBFcXVhbCBhZGRzLCBbe19pZDogMiwgeDo0fV1cbiAgICBhc3NlcnQuZGVlcEVxdWFsIHJlbW92ZXMsIFt7X2lkOiAyLCB4OjJ9XVxuIiwiYXNzZXJ0ID0gY2hhaS5hc3NlcnRcbkxvY2F0aW9uVmlldyA9IHJlcXVpcmUgJy4uL2FwcC9qcy9Mb2NhdGlvblZpZXcnXG5VSURyaXZlciA9IHJlcXVpcmUgJy4vaGVscGVycy9VSURyaXZlcidcblxuY2xhc3MgTW9ja0xvY2F0aW9uRmluZGVyXG4gIGNvbnN0cnVjdG9yOiAgLT5cbiAgICBfLmV4dGVuZCBALCBCYWNrYm9uZS5FdmVudHNcblxuICBnZXRMb2NhdGlvbjogLT5cbiAgc3RhcnRXYXRjaDogLT5cbiAgc3RvcFdhdGNoOiAtPlxuXG5kZXNjcmliZSAnTG9jYXRpb25WaWV3JywgLT5cbiAgY29udGV4dCAnV2l0aCBubyBzZXQgbG9jYXRpb24nLCAtPlxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgIEBsb2NhdGlvbkZpbmRlciA9IG5ldyBNb2NrTG9jYXRpb25GaW5kZXIoKVxuICAgICAgQGxvY2F0aW9uVmlldyA9IG5ldyBMb2NhdGlvblZpZXcobG9jOm51bGwsIGxvY2F0aW9uRmluZGVyOiBAbG9jYXRpb25GaW5kZXIpXG4gICAgICBAdWkgPSBuZXcgVUlEcml2ZXIoQGxvY2F0aW9uVmlldy5lbClcblxuICAgIGl0ICdkaXNwbGF5cyBVbnNwZWNpZmllZCcsIC0+XG4gICAgICBhc3NlcnQuaW5jbHVkZShAdWkudGV4dCgpLCAnVW5zcGVjaWZpZWQnKVxuXG4gICAgaXQgJ2Rpc2FibGVzIG1hcCcsIC0+XG4gICAgICBhc3NlcnQuaXNUcnVlIEB1aS5nZXREaXNhYmxlZChcIk1hcFwiKSBcblxuICAgIGl0ICdhbGxvd3Mgc2V0dGluZyBsb2NhdGlvbicsIC0+XG4gICAgICBAdWkuY2xpY2soJ1NldCcpXG4gICAgICBzZXRQb3MgPSBudWxsXG4gICAgICBAbG9jYXRpb25WaWV3Lm9uICdsb2NhdGlvbnNldCcsIChwb3MpIC0+XG4gICAgICAgIHNldFBvcyA9IHBvc1xuXG4gICAgICBAbG9jYXRpb25GaW5kZXIudHJpZ2dlciAnZm91bmQnLCB7IGNvb3JkczogeyBsYXRpdHVkZTogMiwgbG9uZ2l0dWRlOiAzLCBhY2N1cmFjeTogMTB9fVxuICAgICAgYXNzZXJ0LmVxdWFsIHNldFBvcy5jb29yZGluYXRlc1sxXSwgMlxuXG4gICAgaXQgJ0Rpc3BsYXlzIGVycm9yJywgLT5cbiAgICAgIEB1aS5jbGljaygnU2V0JylcbiAgICAgIHNldFBvcyA9IG51bGxcbiAgICAgIEBsb2NhdGlvblZpZXcub24gJ2xvY2F0aW9uc2V0JywgKHBvcykgLT5cbiAgICAgICAgc2V0UG9zID0gcG9zXG5cbiAgICAgIEBsb2NhdGlvbkZpbmRlci50cmlnZ2VyICdlcnJvcidcbiAgICAgIGFzc2VydC5lcXVhbCBzZXRQb3MsIG51bGxcbiAgICAgIGFzc2VydC5pbmNsdWRlKEB1aS50ZXh0KCksICdDYW5ub3QnKVxuXG4gIGNvbnRleHQgJ1dpdGggc2V0IGxvY2F0aW9uJywgLT5cbiAgICBiZWZvcmVFYWNoIC0+XG4gICAgICBAbG9jYXRpb25GaW5kZXIgPSBuZXcgTW9ja0xvY2F0aW9uRmluZGVyKClcbiAgICAgIEBsb2NhdGlvblZpZXcgPSBuZXcgTG9jYXRpb25WaWV3KGxvYzogeyB0eXBlOiBcIlBvaW50XCIsIGNvb3JkaW5hdGVzOiBbMTAsIDIwXX0sIGxvY2F0aW9uRmluZGVyOiBAbG9jYXRpb25GaW5kZXIpXG4gICAgICBAdWkgPSBuZXcgVUlEcml2ZXIoQGxvY2F0aW9uVmlldy5lbClcblxuICAgIGl0ICdkaXNwbGF5cyBXYWl0aW5nJywgLT5cbiAgICAgIGFzc2VydC5pbmNsdWRlKEB1aS50ZXh0KCksICdXYWl0aW5nJylcblxuICAgIGl0ICdkaXNwbGF5cyByZWxhdGl2ZScsIC0+XG4gICAgICBAbG9jYXRpb25GaW5kZXIudHJpZ2dlciAnZm91bmQnLCB7IGNvb3JkczogeyBsYXRpdHVkZTogMjEsIGxvbmdpdHVkZTogMTAsIGFjY3VyYWN5OiAxMH19XG4gICAgICBhc3NlcnQuaW5jbHVkZShAdWkudGV4dCgpLCAnMTExLjJrbSBTJylcblxuIiwiYXNzZXJ0ID0gY2hhaS5hc3NlcnRcblBob3Rvc1F1ZXN0aW9uID0gcmVxdWlyZSgnZm9ybXMnKS5QaG90b3NRdWVzdGlvblxuVUlEcml2ZXIgPSByZXF1aXJlICcuL2hlbHBlcnMvVUlEcml2ZXInXG5JbWFnZVBhZ2UgPSByZXF1aXJlICcuLi9hcHAvanMvcGFnZXMvSW1hZ2VQYWdlJ1xuXG5jbGFzcyBNb2NrSW1hZ2VNYW5hZ2VyIFxuICBnZXRJbWFnZVRodW1ibmFpbFVybDogKGltYWdlVWlkLCBzdWNjZXNzLCBlcnJvcikgLT5cbiAgICBzdWNjZXNzIFwiaW1hZ2VzL1wiICsgaW1hZ2VVaWQgKyBcIi5qcGdcIlxuXG4gIGdldEltYWdlVXJsID0gKGltYWdlVWlkLCBzdWNjZXNzLCBlcnJvcikgLT5cbiAgICBzdWNjZXNzIFwiaW1hZ2VzL1wiICsgaW1hZ2VVaWQgKyBcIi5qcGdcIlxuXG5kZXNjcmliZSAnUGhvdG9zUXVlc3Rpb24nLCAtPlxuICBjb250ZXh0ICdXaXRoIGEgc2luZ2xlIGltYWdlJywgLT5cbiAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAjIENyZWF0ZSBtb2RlbFxuICAgICAgQG1vZGVsID0gbmV3IEJhY2tib25lLk1vZGVsIFxuXG4gICAgICAjIENyZWF0ZSBjb250ZXh0XG4gICAgICBAY3R4ID0ge1xuICAgICAgICBpbWFnZU1hbmFnZXI6IG5ldyBNb2NrSW1hZ2VNYW5hZ2VyKClcbiAgICAgIH1cblxuICAgICAgQHF1ZXN0aW9uID0gbmV3IFBob3Rvc1F1ZXN0aW9uXG4gICAgICAgIG1vZGVsOiBAbW9kZWxcbiAgICAgICAgaWQ6IFwicTFcIlxuICAgICAgICBjdHg6IEBjdHhcblxuICAgIGl0ICdkaXNwbGF5cyBubyBpbWFnZScsIC0+XG4gICAgICBAbW9kZWwuc2V0KHExOiBbXSlcbiAgICAgIGFzc2VydC5pc1RydWUgdHJ1ZVxuXG4gICAgaXQgJ2Rpc3BsYXlzIG9uZSBpbWFnZScsIC0+XG4gICAgICBAbW9kZWwuc2V0KHExOiBbe2lkOiBcIjEyMzRcIn1dKVxuICAgICAgYXNzZXJ0LmVxdWFsIEBxdWVzdGlvbi4kKFwiaW1nLnRodW1ibmFpbFwiKS5hdHRyKFwic3JjXCIpLCBcImltYWdlcy8xMjM0LmpwZ1wiXG5cbiAgICBpdCAnb3BlbnMgcGFnZScsIC0+XG4gICAgICBAbW9kZWwuc2V0KHExOiBbe2lkOiBcIjEyMzRcIn1dKVxuICAgICAgc3B5ID0gc2lub24uc3B5KClcbiAgICAgIEBjdHgucGFnZXIgPSB7IG9wZW5QYWdlOiBzcHkgfVxuICAgICAgQHF1ZXN0aW9uLiQoXCJpbWcudGh1bWJuYWlsXCIpLmNsaWNrKClcblxuICAgICAgYXNzZXJ0LmlzVHJ1ZSBzcHkuY2FsbGVkT25jZVxuICAgICAgYXNzZXJ0LmlzVHJ1ZSBzcHkuY2FsbGVkV2l0aChJbWFnZVBhZ2UsIHsgaWQ6IFwiMTIzNFwifSlcbiAgICAiLCJhc3NlcnQgPSBjaGFpLmFzc2VydFxuXG5HZW9KU09OID0gcmVxdWlyZSAnLi4vYXBwL2pzL0dlb0pTT04nXG5cbm1vZHVsZS5leHBvcnRzID0gLT5cbiAgY29udGV4dCAnV2l0aCBzYW1wbGUgcm93cycsIC0+XG4gICAgYmVmb3JlRWFjaCAoZG9uZSkgLT5cbiAgICAgIEBkYi50ZXN0LnVwc2VydCB7IF9pZDoxLCBhOlwiQWxpY2VcIiB9LCA9PlxuICAgICAgICBAZGIudGVzdC51cHNlcnQgeyBfaWQ6MiwgYTpcIkNoYXJsaWVcIiB9LCA9PlxuICAgICAgICAgIEBkYi50ZXN0LnVwc2VydCB7IF9pZDozLCBhOlwiQm9iXCIgfSwgPT5cbiAgICAgICAgICAgIGRvbmUoKVxuXG4gICAgaXQgJ2ZpbmRzIGFsbCByb3dzJywgKGRvbmUpIC0+XG4gICAgICBAZGIudGVzdC5maW5kKHt9KS5mZXRjaCAocmVzdWx0cykgPT5cbiAgICAgICAgYXNzZXJ0LmVxdWFsIDMsIHJlc3VsdHMubGVuZ3RoXG4gICAgICAgIGRvbmUoKVxuXG4gICAgaXQgJ2ZpbmRzIGFsbCByb3dzIHdpdGggb3B0aW9ucycsIChkb25lKSAtPlxuICAgICAgQGRiLnRlc3QuZmluZCh7fSwge30pLmZldGNoIChyZXN1bHRzKSA9PlxuICAgICAgICBhc3NlcnQuZXF1YWwgMywgcmVzdWx0cy5sZW5ndGhcbiAgICAgICAgZG9uZSgpXG5cbiAgICBpdCAnZmlsdGVycyByb3dzIGJ5IGlkJywgKGRvbmUpIC0+XG4gICAgICBAZGIudGVzdC5maW5kKHsgX2lkOiAxIH0pLmZldGNoIChyZXN1bHRzKSA9PlxuICAgICAgICBhc3NlcnQuZXF1YWwgMSwgcmVzdWx0cy5sZW5ndGhcbiAgICAgICAgYXNzZXJ0LmVxdWFsICdBbGljZScsIHJlc3VsdHNbMF0uYVxuICAgICAgICBkb25lKClcblxuICAgIGl0ICdmaW5kcyBvbmUgcm93JywgKGRvbmUpIC0+XG4gICAgICBAZGIudGVzdC5maW5kT25lIHsgX2lkOiAyIH0sIChyZXN1bHQpID0+XG4gICAgICAgIGFzc2VydC5lcXVhbCAnQ2hhcmxpZScsIHJlc3VsdC5hXG4gICAgICAgIGRvbmUoKVxuXG4gICAgaXQgJ3JlbW92ZXMgaXRlbScsIChkb25lKSAtPlxuICAgICAgQGRiLnRlc3QucmVtb3ZlIDIsID0+XG4gICAgICAgIEBkYi50ZXN0LmZpbmQoe30pLmZldGNoIChyZXN1bHRzKSA9PlxuICAgICAgICAgIGFzc2VydC5lcXVhbCAyLCByZXN1bHRzLmxlbmd0aFxuICAgICAgICAgIGFzc2VydCAxIGluIChyZXN1bHQuX2lkIGZvciByZXN1bHQgaW4gcmVzdWx0cylcbiAgICAgICAgICBhc3NlcnQgMiBub3QgaW4gKHJlc3VsdC5faWQgZm9yIHJlc3VsdCBpbiByZXN1bHRzKVxuICAgICAgICAgIGRvbmUoKVxuXG4gICAgaXQgJ3JlbW92ZXMgbm9uLWV4aXN0ZW50IGl0ZW0nLCAoZG9uZSkgLT5cbiAgICAgIEBkYi50ZXN0LnJlbW92ZSA5OTksID0+XG4gICAgICAgIEBkYi50ZXN0LmZpbmQoe30pLmZldGNoIChyZXN1bHRzKSA9PlxuICAgICAgICAgIGFzc2VydC5lcXVhbCAzLCByZXN1bHRzLmxlbmd0aFxuICAgICAgICAgIGRvbmUoKVxuXG4gICAgaXQgJ3NvcnRzIGFzY2VuZGluZycsIChkb25lKSAtPlxuICAgICAgQGRiLnRlc3QuZmluZCh7fSwge3NvcnQ6IFsnYSddfSkuZmV0Y2ggKHJlc3VsdHMpID0+XG4gICAgICAgIGFzc2VydC5kZWVwRXF1YWwgXy5wbHVjayhyZXN1bHRzLCAnX2lkJyksIFsxLDMsMl1cbiAgICAgICAgZG9uZSgpXG5cbiAgICBpdCAnc29ydHMgZGVzY2VuZGluZycsIChkb25lKSAtPlxuICAgICAgQGRiLnRlc3QuZmluZCh7fSwge3NvcnQ6IFtbJ2EnLCdkZXNjJ11dfSkuZmV0Y2ggKHJlc3VsdHMpID0+XG4gICAgICAgIGFzc2VydC5kZWVwRXF1YWwgXy5wbHVjayhyZXN1bHRzLCAnX2lkJyksIFsyLDMsMV1cbiAgICAgICAgZG9uZSgpXG5cbiAgICBpdCAnbGltaXRzJywgKGRvbmUpIC0+XG4gICAgICBAZGIudGVzdC5maW5kKHt9LCB7c29ydDogWydhJ10sIGxpbWl0OjJ9KS5mZXRjaCAocmVzdWx0cykgPT5cbiAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCBfLnBsdWNrKHJlc3VsdHMsICdfaWQnKSwgWzEsM11cbiAgICAgICAgZG9uZSgpXG5cbiAgICBpdCAnZmV0Y2hlcyBpbmRlcGVuZGVudCBjb3BpZXMnLCAoZG9uZSkgLT5cbiAgICAgIEBkYi50ZXN0LmZpbmRPbmUgeyBfaWQ6IDIgfSwgKHJlc3VsdCkgPT5cbiAgICAgICAgcmVzdWx0LmEgPSAnRGF2aWQnXG4gICAgICAgIEBkYi50ZXN0LmZpbmRPbmUgeyBfaWQ6IDIgfSwgKHJlc3VsdCkgPT5cbiAgICAgICAgICBhc3NlcnQuZXF1YWwgJ0NoYXJsaWUnLCByZXN1bHQuYVxuICAgICAgICAgIGRvbmUoKVxuXG4gIGl0ICdhZGRzIF9pZCB0byByb3dzJywgKGRvbmUpIC0+XG4gICAgQGRiLnRlc3QudXBzZXJ0IHsgYTogMSB9LCAoaXRlbSkgPT5cbiAgICAgIGFzc2VydC5wcm9wZXJ0eSBpdGVtLCAnX2lkJ1xuICAgICAgYXNzZXJ0Lmxlbmd0aE9mIGl0ZW0uX2lkLCAzMlxuICAgICAgZG9uZSgpXG5cbiAgaXQgJ3VwZGF0ZXMgYnkgaWQnLCAoZG9uZSkgLT5cbiAgICBAZGIudGVzdC51cHNlcnQgeyBfaWQ6MSwgYToxIH0sIChpdGVtKSA9PlxuICAgICAgQGRiLnRlc3QudXBzZXJ0IHsgX2lkOjEsIGE6MiB9LCAoaXRlbSkgPT5cbiAgICAgICAgYXNzZXJ0LmVxdWFsIGl0ZW0uYSwgMlxuICBcbiAgICAgICAgQGRiLnRlc3QuZmluZCh7fSkuZmV0Y2ggKHJlc3VsdHMpID0+XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsIDEsIHJlc3VsdHMubGVuZ3RoXG4gICAgICAgICAgZG9uZSgpXG5cblxuICBnZW9wb2ludCA9IChsbmcsIGxhdCkgLT5cbiAgICByZXR1cm4ge1xuICAgICAgICB0eXBlOiAnUG9pbnQnXG4gICAgICAgIGNvb3JkaW5hdGVzOiBbbG5nLCBsYXRdXG4gICAgfVxuXG4gIGNvbnRleHQgJ1dpdGggZ2VvbG9jYXRlZCByb3dzJywgLT5cbiAgICBiZWZvcmVFYWNoIChkb25lKSAtPlxuICAgICAgQGRiLnRlc3QudXBzZXJ0IHsgX2lkOjEsIGxvYzpnZW9wb2ludCg5MCwgNDUpIH0sID0+XG4gICAgICAgIEBkYi50ZXN0LnVwc2VydCB7IF9pZDoyLCBsb2M6Z2VvcG9pbnQoOTAsIDQ2KSB9LCA9PlxuICAgICAgICAgIEBkYi50ZXN0LnVwc2VydCB7IF9pZDozLCBsb2M6Z2VvcG9pbnQoOTEsIDQ1KSB9LCA9PlxuICAgICAgICAgICAgQGRiLnRlc3QudXBzZXJ0IHsgX2lkOjQsIGxvYzpnZW9wb2ludCg5MSwgNDYpIH0sID0+XG4gICAgICAgICAgICAgIGRvbmUoKVxuXG4gICAgaXQgJ2ZpbmRzIHBvaW50cyBuZWFyJywgKGRvbmUpIC0+XG4gICAgICBzZWxlY3RvciA9IGxvYzogXG4gICAgICAgICRuZWFyOiBcbiAgICAgICAgICAkZ2VvbWV0cnk6IGdlb3BvaW50KDkwLCA0NSlcblxuICAgICAgQGRiLnRlc3QuZmluZChzZWxlY3RvcikuZmV0Y2ggKHJlc3VsdHMpID0+XG4gICAgICAgIGFzc2VydC5kZWVwRXF1YWwgXy5wbHVjayhyZXN1bHRzLCAnX2lkJyksIFsxLDMsMiw0XVxuICAgICAgICBkb25lKClcblxuICAgIGl0ICdmaW5kcyBwb2ludHMgbmVhciBtYXhEaXN0YW5jZScsIChkb25lKSAtPlxuICAgICAgc2VsZWN0b3IgPSBsb2M6IFxuICAgICAgICAkbmVhcjogXG4gICAgICAgICAgJGdlb21ldHJ5OiBnZW9wb2ludCg5MCwgNDUpXG4gICAgICAgICAgJG1heERpc3RhbmNlOiAxMTEwMDBcblxuICAgICAgQGRiLnRlc3QuZmluZChzZWxlY3RvcikuZmV0Y2ggKHJlc3VsdHMpID0+XG4gICAgICAgIGFzc2VydC5kZWVwRXF1YWwgXy5wbHVjayhyZXN1bHRzLCAnX2lkJyksIFsxLDNdXG4gICAgICAgIGRvbmUoKSAgICAgIFxuXG4gICAgaXQgJ2ZpbmRzIHBvaW50cyBuZWFyIG1heERpc3RhbmNlIGp1c3QgYWJvdmUnLCAoZG9uZSkgLT5cbiAgICAgIHNlbGVjdG9yID0gbG9jOiBcbiAgICAgICAgJG5lYXI6IFxuICAgICAgICAgICRnZW9tZXRyeTogZ2VvcG9pbnQoOTAsIDQ1KVxuICAgICAgICAgICRtYXhEaXN0YW5jZTogMTEyMDAwXG5cbiAgICAgIEBkYi50ZXN0LmZpbmQoc2VsZWN0b3IpLmZldGNoIChyZXN1bHRzKSA9PlxuICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIF8ucGx1Y2socmVzdWx0cywgJ19pZCcpLCBbMSwzLDJdXG4gICAgICAgIGRvbmUoKVxuXG4gICAgaXQgJ2ZpbmRzIHBvaW50cyB3aXRoaW4gc2ltcGxlIGJveCcsIChkb25lKSAtPlxuICAgICAgc2VsZWN0b3IgPSBsb2M6IFxuICAgICAgICAkZ2VvSW50ZXJzZWN0czogXG4gICAgICAgICAgJGdlb21ldHJ5OiBcbiAgICAgICAgICAgIHR5cGU6ICdQb2x5Z29uJ1xuICAgICAgICAgICAgY29vcmRpbmF0ZXM6IFtbXG4gICAgICAgICAgICAgIFs4OS41LCA0NS41XSwgWzg5LjUsIDQ2LjVdLCBbOTAuNSwgNDYuNV0sIFs5MC41LCA0NS41XVxuICAgICAgICAgICAgXV1cbiAgICAgIEBkYi50ZXN0LmZpbmQoc2VsZWN0b3IpLmZldGNoIChyZXN1bHRzKSA9PlxuICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIF8ucGx1Y2socmVzdWx0cywgJ19pZCcpLCBbMl1cbiAgICAgICAgZG9uZSgpXG5cbiAgICBpdCAnaGFuZGxlcyB1bmRlZmluZWQnLCAoZG9uZSkgLT5cbiAgICAgIHNlbGVjdG9yID0gbG9jOiBcbiAgICAgICAgJGdlb0ludGVyc2VjdHM6IFxuICAgICAgICAgICRnZW9tZXRyeTogXG4gICAgICAgICAgICB0eXBlOiAnUG9seWdvbidcbiAgICAgICAgICAgIGNvb3JkaW5hdGVzOiBbW1xuICAgICAgICAgICAgICBbODkuNSwgNDUuNV0sIFs4OS41LCA0Ni41XSwgWzkwLjUsIDQ2LjVdLCBbOTAuNSwgNDUuNV1cbiAgICAgICAgICAgIF1dXG4gICAgICBAZGIudGVzdC51cHNlcnQgeyBfaWQ6NSB9LCA9PlxuICAgICAgICBAZGIudGVzdC5maW5kKHNlbGVjdG9yKS5mZXRjaCAocmVzdWx0cykgPT5cbiAgICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIF8ucGx1Y2socmVzdWx0cywgJ19pZCcpLCBbMl1cbiAgICAgICAgICBkb25lKClcblxuXG4iLCJcbmV4cG9ydHMuRGF0ZVF1ZXN0aW9uID0gcmVxdWlyZSAnLi9EYXRlUXVlc3Rpb24nXG5leHBvcnRzLkRyb3Bkb3duUXVlc3Rpb24gPSByZXF1aXJlICcuL0Ryb3Bkb3duUXVlc3Rpb24nXG5leHBvcnRzLk51bWJlclF1ZXN0aW9uID0gcmVxdWlyZSAnLi9OdW1iZXJRdWVzdGlvbidcbmV4cG9ydHMuUXVlc3Rpb25Hcm91cCA9IHJlcXVpcmUgJy4vUXVlc3Rpb25Hcm91cCdcbmV4cG9ydHMuU2F2ZUNhbmNlbEZvcm0gPSByZXF1aXJlICcuL1NhdmVDYW5jZWxGb3JtJ1xuZXhwb3J0cy5Tb3VyY2VRdWVzdGlvbiA9IHJlcXVpcmUgJy4vU291cmNlUXVlc3Rpb24nXG5leHBvcnRzLlBob3RvUXVlc3Rpb24gPSByZXF1aXJlICcuL1Bob3RvUXVlc3Rpb24nXG5leHBvcnRzLlBob3Rvc1F1ZXN0aW9uID0gcmVxdWlyZSAnLi9QaG90b3NRdWVzdGlvbidcbmV4cG9ydHMuSW5zdHJ1Y3Rpb25zID0gcmVxdWlyZSAnLi9JbnN0cnVjdGlvbnMnXG5cbiMgTXVzdCBiZSBjcmVhdGVkIHdpdGggbW9kZWwgKGJhY2tib25lIG1vZGVsKSBhbmQgY29udGVudHMgKGFycmF5IG9mIHZpZXdzKVxuZXhwb3J0cy5Gb3JtVmlldyA9IGNsYXNzIEZvcm1WaWV3IGV4dGVuZHMgQmFja2JvbmUuVmlld1xuICBpbml0aWFsaXplOiAob3B0aW9ucykgLT5cbiAgICBAY29udGVudHMgPSBvcHRpb25zLmNvbnRlbnRzXG4gICAgXG4gICAgIyBBZGQgY29udGVudHMgYW5kIGxpc3RlbiB0byBldmVudHNcbiAgICBmb3IgY29udGVudCBpbiBvcHRpb25zLmNvbnRlbnRzXG4gICAgICBAJGVsLmFwcGVuZChjb250ZW50LmVsKTtcbiAgICAgIEBsaXN0ZW5UbyBjb250ZW50LCAnY2xvc2UnLCA9PiBAdHJpZ2dlcignY2xvc2UnKVxuICAgICAgQGxpc3RlblRvIGNvbnRlbnQsICdjb21wbGV0ZScsID0+IEB0cmlnZ2VyKCdjb21wbGV0ZScpXG5cbiAgICAjIEFkZCBsaXN0ZW5lciB0byBtb2RlbFxuICAgIEBsaXN0ZW5UbyBAbW9kZWwsICdjaGFuZ2UnLCA9PiBAdHJpZ2dlcignY2hhbmdlJylcblxuICBsb2FkOiAoZGF0YSkgLT5cbiAgICBAbW9kZWwuY2xlYXIoKSAgI1RPRE8gY2xlYXIgb3Igbm90IGNsZWFyPyBjbGVhcmluZyByZW1vdmVzIGRlZmF1bHRzLCBidXQgYWxsb3dzIHRydWUgcmV1c2UuXG5cbiAgICAjIEFwcGx5IGRlZmF1bHRzIFxuICAgIEBtb2RlbC5zZXQoXy5kZWZhdWx0cyhfLmNsb25lRGVlcChkYXRhKSwgQG9wdGlvbnMuZGVmYXVsdHMgfHwge30pKVxuXG4gIHNhdmU6IC0+XG4gICAgcmV0dXJuIEBtb2RlbC50b0pTT04oKVxuXG5cbiMgU2ltcGxlIGZvcm0gdGhhdCBkaXNwbGF5cyBhIHRlbXBsYXRlIGJhc2VkIG9uIGxvYWRlZCBkYXRhXG5leHBvcnRzLnRlbXBsYXRlVmlldyA9ICh0ZW1wbGF0ZSkgLT4gXG4gIHJldHVybiB7XG4gICAgZWw6ICQoJzxkaXY+PC9kaXY+JylcbiAgICBsb2FkOiAoZGF0YSkgLT5cbiAgICAgICQoQGVsKS5odG1sIHRlbXBsYXRlKGRhdGEpXG4gIH1cblxuICAjIGNsYXNzIFRlbXBsYXRlVmlldyBleHRlbmRzIEJhY2tib25lLlZpZXdcbiAgIyBjb25zdHJ1Y3RvcjogKHRlbXBsYXRlKSAtPlxuICAjICAgQHRlbXBsYXRlID0gdGVtcGxhdGVcblxuICAjIGxvYWQ6IChkYXRhKSAtPlxuICAjICAgQCRlbC5odG1sIEB0ZW1wbGF0ZShkYXRhKVxuXG5cbmV4cG9ydHMuU3VydmV5VmlldyA9IGNsYXNzIFN1cnZleVZpZXcgZXh0ZW5kcyBGb3JtVmlld1xuXG5leHBvcnRzLldhdGVyVGVzdEVkaXRWaWV3ID0gY2xhc3MgV2F0ZXJUZXN0RWRpdFZpZXcgZXh0ZW5kcyBGb3JtVmlld1xuICBpbml0aWFsaXplOiAob3B0aW9ucykgLT5cbiAgICBzdXBlcihvcHRpb25zKVxuXG4gICAgIyBBZGQgYnV0dG9ucyBhdCBib3R0b21cbiAgICAjIFRPRE8gbW92ZSB0byB0ZW1wbGF0ZSBhbmQgc2VwIGZpbGVcbiAgICBAJGVsLmFwcGVuZCAkKCcnJ1xuICAgICAgPGRpdj5cbiAgICAgICAgICA8YnV0dG9uIGlkPVwiY2xvc2VfYnV0dG9uXCIgdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwiYnRuIG1hcmdpbmVkXCI+U2F2ZSBmb3IgTGF0ZXI8L2J1dHRvbj5cbiAgICAgICAgICAmbmJzcDtcbiAgICAgICAgICA8YnV0dG9uIGlkPVwiY29tcGxldGVfYnV0dG9uXCIgdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwiYnRuIGJ0bi1wcmltYXJ5IG1hcmdpbmVkXCI+PGkgY2xhc3M9XCJpY29uLW9rIGljb24td2hpdGVcIj48L2k+IENvbXBsZXRlPC9idXR0b24+XG4gICAgICA8L2Rpdj5cbiAgICAnJycpXG5cbiAgZXZlbnRzOiBcbiAgICBcImNsaWNrICNjbG9zZV9idXR0b25cIiA6IFwiY2xvc2VcIlxuICAgIFwiY2xpY2sgI2NvbXBsZXRlX2J1dHRvblwiIDogXCJjb21wbGV0ZVwiXG5cbiAgIyBUT0RPIHJlZmFjdG9yIHdpdGggU2F2ZUNhbmNlbEZvcm1cbiAgdmFsaWRhdGU6IC0+XG4gICAgIyBHZXQgYWxsIHZpc2libGUgaXRlbXNcbiAgICBpdGVtcyA9IF8uZmlsdGVyKEBjb250ZW50cywgKGMpIC0+XG4gICAgICBjLnZpc2libGUgYW5kIGMudmFsaWRhdGVcbiAgICApXG4gICAgcmV0dXJuIG5vdCBfLmFueShfLm1hcChpdGVtcywgKGl0ZW0pIC0+XG4gICAgICBpdGVtLnZhbGlkYXRlKClcbiAgICApKVxuXG4gIGNsb3NlOiAtPlxuICAgIEB0cmlnZ2VyICdjbG9zZSdcblxuICBjb21wbGV0ZTogLT5cbiAgICBpZiBAdmFsaWRhdGUoKVxuICAgICAgQHRyaWdnZXIgJ2NvbXBsZXRlJ1xuICAgICAgXG4jIENyZWF0ZXMgYSBmb3JtIHZpZXcgZnJvbSBhIHN0cmluZ1xuZXhwb3J0cy5pbnN0YW50aWF0ZVZpZXcgPSAodmlld1N0ciwgb3B0aW9ucykgPT5cbiAgdmlld0Z1bmMgPSBuZXcgRnVuY3Rpb24oXCJvcHRpb25zXCIsIHZpZXdTdHIpXG4gIHZpZXdGdW5jKG9wdGlvbnMpXG5cbl8uZXh0ZW5kKGV4cG9ydHMsIHJlcXVpcmUoJy4vZm9ybS1jb250cm9scycpKVxuXG5cbiMgVE9ETyBmaWd1cmUgb3V0IGhvdyB0byBhbGxvdyB0d28gc3VydmV5cyBmb3IgZGlmZmVyaW5nIGNsaWVudCB2ZXJzaW9ucz8gT3IganVzdCB1c2UgbWluVmVyc2lvbj8iLCJhc3NlcnQgPSBjaGFpLmFzc2VydFxuXG5jbGFzcyBVSURyaXZlclxuICBjb25zdHJ1Y3RvcjogKGVsKSAtPlxuICAgIEBlbCA9ICQoZWwpXG5cbiAgZ2V0RGlzYWJsZWQ6IChzdHIpIC0+XG4gICAgZm9yIGl0ZW0gaW4gQGVsLmZpbmQoXCJhLGJ1dHRvblwiKVxuICAgICAgaWYgJChpdGVtKS50ZXh0KCkuaW5kZXhPZihzdHIpICE9IC0xXG4gICAgICAgIHJldHVybiAkKGl0ZW0pLmlzKFwiOmRpc2FibGVkXCIpXG4gICAgYXNzZXJ0LmZhaWwobnVsbCwgc3RyLCBcIkNhbid0IGZpbmQ6IFwiICsgc3RyKVxuXG4gIGNsaWNrOiAoc3RyKSAtPlxuICAgIGZvciBpdGVtIGluIEBlbC5maW5kKFwiYSxidXR0b25cIilcbiAgICAgIGlmICQoaXRlbSkudGV4dCgpLmluZGV4T2Yoc3RyKSAhPSAtMVxuICAgICAgICBjb25zb2xlLmxvZyBcIkNsaWNraW5nOiBcIiArICQoaXRlbSkudGV4dCgpXG4gICAgICAgICQoaXRlbSkudHJpZ2dlcihcImNsaWNrXCIpXG4gICAgICAgIHJldHVyblxuICAgIGFzc2VydC5mYWlsKG51bGwsIHN0ciwgXCJDYW4ndCBmaW5kOiBcIiArIHN0cilcbiAgXG4gIGZpbGw6IChzdHIsIHZhbHVlKSAtPlxuICAgIGZvciBpdGVtIGluIEBlbC5maW5kKFwibGFiZWxcIilcbiAgICAgIGlmICQoaXRlbSkudGV4dCgpLmluZGV4T2Yoc3RyKSAhPSAtMVxuICAgICAgICBib3ggPSBAZWwuZmluZChcIiNcIiskKGl0ZW0pLmF0dHIoJ2ZvcicpKVxuICAgICAgICBib3gudmFsKHZhbHVlKVxuICBcbiAgdGV4dDogLT5cbiAgICByZXR1cm4gQGVsLnRleHQoKVxuICAgICAgXG4gIHdhaXQ6IChhZnRlcikgLT5cbiAgICBzZXRUaW1lb3V0IGFmdGVyLCAxMFxuXG5tb2R1bGUuZXhwb3J0cyA9IFVJRHJpdmVyIiwiXG4jIFRyYWNrcyBhIHNldCBvZiBpdGVtcyBieSBpZCwgaW5kaWNhdGluZyB3aGljaCBoYXZlIGJlZW4gYWRkZWQgb3IgcmVtb3ZlZC5cbiMgQ2hhbmdlcyBhcmUgYm90aCBhZGQgYW5kIHJlbW92ZVxuY2xhc3MgSXRlbVRyYWNrZXJcbiAgY29uc3RydWN0b3I6IC0+XG4gICAgQGtleSA9ICdfaWQnXG4gICAgQGl0ZW1zID0ge31cblxuICB1cGRhdGU6IChpdGVtcykgLT4gICAgIyBSZXR1cm4gW1thZGRlZF0sW3JlbW92ZWRdXSBpdGVtc1xuICAgIGFkZHMgPSBbXVxuICAgIHJlbW92ZXMgPSBbXVxuXG4gICAgIyBBZGQgYW55IG5ldyBvbmVzXG4gICAgZm9yIGl0ZW0gaW4gaXRlbXNcbiAgICAgIGlmIG5vdCBfLmhhcyhAaXRlbXMsIGl0ZW1bQGtleV0pXG4gICAgICAgIGFkZHMucHVzaChpdGVtKVxuXG4gICAgIyBDcmVhdGUgbWFwIG9mIGl0ZW1zIHBhcmFtZXRlclxuICAgIG1hcCA9IF8ub2JqZWN0KF8ucGx1Y2soaXRlbXMsIEBrZXkpLCBpdGVtcylcblxuICAgICMgRmluZCByZW1vdmVzXG4gICAgZm9yIGtleSwgdmFsdWUgb2YgQGl0ZW1zXG4gICAgICBpZiBub3QgXy5oYXMobWFwLCBrZXkpXG4gICAgICAgIHJlbW92ZXMucHVzaCh2YWx1ZSlcbiAgICAgIGVsc2UgaWYgbm90IF8uaXNFcXVhbCh2YWx1ZSwgbWFwW2tleV0pXG4gICAgICAgIGFkZHMucHVzaChtYXBba2V5XSlcbiAgICAgICAgcmVtb3Zlcy5wdXNoKHZhbHVlKVxuXG4gICAgZm9yIGl0ZW0gaW4gcmVtb3Zlc1xuICAgICAgZGVsZXRlIEBpdGVtc1tpdGVtW0BrZXldXVxuXG4gICAgZm9yIGl0ZW0gaW4gYWRkc1xuICAgICAgQGl0ZW1zW2l0ZW1bQGtleV1dID0gaXRlbVxuXG4gICAgcmV0dXJuIFthZGRzLCByZW1vdmVzXVxuXG5tb2R1bGUuZXhwb3J0cyA9IEl0ZW1UcmFja2VyIiwiIyBHZW9KU09OIGhlbHBlciByb3V0aW5lc1xuXG4jIENvbnZlcnRzIG5hdmlnYXRvciBwb3NpdGlvbiB0byBwb2ludFxuZXhwb3J0cy5wb3NUb1BvaW50ID0gKHBvcykgLT5cbiAgcmV0dXJuIHtcbiAgICB0eXBlOiAnUG9pbnQnXG4gICAgY29vcmRpbmF0ZXM6IFtwb3MuY29vcmRzLmxvbmdpdHVkZSwgcG9zLmNvb3Jkcy5sYXRpdHVkZV1cbiAgfVxuXG5cbmV4cG9ydHMubGF0TG5nQm91bmRzVG9HZW9KU09OID0gKGJvdW5kcykgLT5cbiAgc3cgPSBib3VuZHMuZ2V0U291dGhXZXN0KClcbiAgbmUgPSBib3VuZHMuZ2V0Tm9ydGhFYXN0KClcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiAnUG9seWdvbicsXG4gICAgY29vcmRpbmF0ZXM6IFtcbiAgICAgIFtbc3cubG5nLCBzdy5sYXRdLCBcbiAgICAgIFtzdy5sbmcsIG5lLmxhdF0sIFxuICAgICAgW25lLmxuZywgbmUubGF0XSwgXG4gICAgICBbbmUubG5nLCBzdy5sYXRdXVxuICAgIF1cbiAgfVxuXG4jIFRPRE86IG9ubHkgd29ya3Mgd2l0aCBib3VuZHNcbmV4cG9ydHMucG9pbnRJblBvbHlnb24gPSAocG9pbnQsIHBvbHlnb24pIC0+XG4gICMgR2V0IGJvdW5kc1xuICBib3VuZHMgPSBuZXcgTC5MYXRMbmdCb3VuZHMoXy5tYXAocG9seWdvbi5jb29yZGluYXRlc1swXSwgKGNvb3JkKSAtPiBuZXcgTC5MYXRMbmcoY29vcmRbMV0sIGNvb3JkWzBdKSkpXG4gIHJldHVybiBib3VuZHMuY29udGFpbnMobmV3IEwuTGF0TG5nKHBvaW50LmNvb3JkaW5hdGVzWzFdLCBwb2ludC5jb29yZGluYXRlc1swXSkpXG5cbmV4cG9ydHMuZ2V0UmVsYXRpdmVMb2NhdGlvbiA9IChmcm9tLCB0bykgLT5cbiAgeDEgPSBmcm9tLmNvb3JkaW5hdGVzWzBdXG4gIHkxID0gZnJvbS5jb29yZGluYXRlc1sxXVxuICB4MiA9IHRvLmNvb3JkaW5hdGVzWzBdXG4gIHkyID0gdG8uY29vcmRpbmF0ZXNbMV1cbiAgXG4gICMgQ29udmVydCB0byByZWxhdGl2ZSBwb3NpdGlvbiAoYXBwcm94aW1hdGUpXG4gIGR5ID0gKHkyIC0geTEpIC8gNTcuMyAqIDYzNzEwMDBcbiAgZHggPSBNYXRoLmNvcyh5MSAvIDU3LjMpICogKHgyIC0geDEpIC8gNTcuMyAqIDYzNzEwMDBcbiAgXG4gICMgRGV0ZXJtaW5lIGRpcmVjdGlvbiBhbmQgYW5nbGVcbiAgZGlzdCA9IE1hdGguc3FydChkeCAqIGR4ICsgZHkgKiBkeSlcbiAgYW5nbGUgPSA5MCAtIChNYXRoLmF0YW4yKGR5LCBkeCkgKiA1Ny4zKVxuICBhbmdsZSArPSAzNjAgaWYgYW5nbGUgPCAwXG4gIGFuZ2xlIC09IDM2MCBpZiBhbmdsZSA+IDM2MFxuICBcbiAgIyBHZXQgYXBwcm94aW1hdGUgZGlyZWN0aW9uXG4gIGNvbXBhc3NEaXIgPSAoTWF0aC5mbG9vcigoYW5nbGUgKyAyMi41KSAvIDQ1KSkgJSA4XG4gIGNvbXBhc3NTdHJzID0gW1wiTlwiLCBcIk5FXCIsIFwiRVwiLCBcIlNFXCIsIFwiU1wiLCBcIlNXXCIsIFwiV1wiLCBcIk5XXCJdXG4gIGlmIGRpc3QgPiAxMDAwXG4gICAgKGRpc3QgLyAxMDAwKS50b0ZpeGVkKDEpICsgXCJrbSBcIiArIGNvbXBhc3NTdHJzW2NvbXBhc3NEaXJdXG4gIGVsc2VcbiAgICAoZGlzdCkudG9GaXhlZCgwKSArIFwibSBcIiArIGNvbXBhc3NTdHJzW2NvbXBhc3NEaXJdIiwiTG9jYXRpb25GaW5kZXIgPSByZXF1aXJlICcuL0xvY2F0aW9uRmluZGVyJ1xuR2VvSlNPTiA9IHJlcXVpcmUgJy4vR2VvSlNPTidcblxuIyBTaG93cyB0aGUgcmVsYXRpdmUgbG9jYXRpb24gb2YgYSBwb2ludCBhbmQgYWxsb3dzIHNldHRpbmcgaXRcbiMgRmlyZXMgZXZlbnRzIGxvY2F0aW9uc2V0LCBtYXAsIGJvdGggd2l0aCBcbmNsYXNzIExvY2F0aW9uVmlldyBleHRlbmRzIEJhY2tib25lLlZpZXdcbiAgY29uc3RydWN0b3I6IChvcHRpb25zKSAtPlxuICAgIHN1cGVyKClcbiAgICBAbG9jID0gb3B0aW9ucy5sb2NcbiAgICBAc2V0dGluZ0xvY2F0aW9uID0gZmFsc2VcbiAgICBAbG9jYXRpb25GaW5kZXIgPSBvcHRpb25zLmxvY2F0aW9uRmluZGVyIHx8IG5ldyBMb2NhdGlvbkZpbmRlcigpXG5cbiAgICAjIExpc3RlbiB0byBsb2NhdGlvbiBldmVudHNcbiAgICBAbGlzdGVuVG8oQGxvY2F0aW9uRmluZGVyLCAnZm91bmQnLCBAbG9jYXRpb25Gb3VuZClcbiAgICBAbGlzdGVuVG8oQGxvY2F0aW9uRmluZGVyLCAnZXJyb3InLCBAbG9jYXRpb25FcnJvcilcblxuICAgICMgU3RhcnQgdHJhY2tpbmcgbG9jYXRpb24gaWYgc2V0XG4gICAgaWYgQGxvY1xuICAgICAgQGxvY2F0aW9uRmluZGVyLnN0YXJ0V2F0Y2goKVxuXG4gICAgQHJlbmRlcigpXG5cbiAgZXZlbnRzOlxuICAgICdjbGljayAjbG9jYXRpb25fbWFwJyA6ICdtYXBDbGlja2VkJ1xuICAgICdjbGljayAjbG9jYXRpb25fc2V0JyA6ICdzZXRMb2NhdGlvbidcblxuICByZW1vdmU6IC0+XG4gICAgQGxvY2F0aW9uRmluZGVyLnN0b3BXYXRjaCgpXG4gICAgc3VwZXIoKVxuXG4gIHJlbmRlcjogLT5cbiAgICBAJGVsLmh0bWwgdGVtcGxhdGVzWydMb2NhdGlvblZpZXcnXSgpXG5cbiAgICAjIFNldCBsb2NhdGlvbiBzdHJpbmdcbiAgICBpZiBAZXJyb3JGaW5kaW5nTG9jYXRpb25cbiAgICAgIEAkKFwiI2xvY2F0aW9uX3JlbGF0aXZlXCIpLnRleHQoXCJDYW5ub3QgZmluZCBsb2NhdGlvblwiKVxuICAgIGVsc2UgaWYgbm90IEBsb2MgYW5kIG5vdCBAc2V0dGluZ0xvY2F0aW9uIFxuICAgICAgQCQoXCIjbG9jYXRpb25fcmVsYXRpdmVcIikudGV4dChcIlVuc3BlY2lmaWVkIGxvY2F0aW9uXCIpXG4gICAgZWxzZSBpZiBAc2V0dGluZ0xvY2F0aW9uXG4gICAgICBAJChcIiNsb2NhdGlvbl9yZWxhdGl2ZVwiKS50ZXh0KFwiU2V0dGluZyBsb2NhdGlvbi4uLlwiKVxuICAgIGVsc2UgaWYgbm90IEBjdXJyZW50TG9jXG4gICAgICBAJChcIiNsb2NhdGlvbl9yZWxhdGl2ZVwiKS50ZXh0KFwiV2FpdGluZyBmb3IgR1BTLi4uXCIpXG4gICAgZWxzZVxuICAgICAgQCQoXCIjbG9jYXRpb25fcmVsYXRpdmVcIikudGV4dChHZW9KU09OLmdldFJlbGF0aXZlTG9jYXRpb24oQGN1cnJlbnRMb2MsIEBsb2MpKVxuXG4gICAgIyBEaXNhYmxlIG1hcCBpZiBsb2NhdGlvbiBub3Qgc2V0XG4gICAgQCQoXCIjbG9jYXRpb25fbWFwXCIpLmF0dHIoXCJkaXNhYmxlZFwiLCBub3QgQGxvYyk7XG5cbiAgICAjIERpc2FibGUgc2V0IGlmIHNldHRpbmdcbiAgICBAJChcIiNsb2NhdGlvbl9zZXRcIikuYXR0cihcImRpc2FibGVkXCIsIEBzZXR0aW5nTG9jYXRpb24gPT0gdHJ1ZSk7ICAgIFxuXG4gIHNldExvY2F0aW9uOiAtPlxuICAgIEBzZXR0aW5nTG9jYXRpb24gPSB0cnVlXG4gICAgQGVycm9yRmluZGluZ0xvY2F0aW9uID0gZmFsc2VcbiAgICBAbG9jYXRpb25GaW5kZXIuc3RhcnRXYXRjaCgpXG4gICAgQHJlbmRlcigpXG5cbiAgbG9jYXRpb25Gb3VuZDogKHBvcykgPT5cbiAgICBpZiBAc2V0dGluZ0xvY2F0aW9uXG4gICAgICBAc2V0dGluZ0xvY2F0aW9uID0gZmFsc2VcbiAgICAgIEBlcnJvckZpbmRpbmdMb2NhdGlvbiA9IGZhbHNlXG5cbiAgICAgICMgU2V0IGxvY2F0aW9uXG4gICAgICBAbG9jID0gR2VvSlNPTi5wb3NUb1BvaW50KHBvcylcbiAgICAgIEB0cmlnZ2VyKCdsb2NhdGlvbnNldCcsIEBsb2MpXG5cbiAgICBAY3VycmVudExvYyA9IEdlb0pTT04ucG9zVG9Qb2ludChwb3MpXG4gICAgQHJlbmRlcigpXG5cbiAgbG9jYXRpb25FcnJvcjogPT5cbiAgICBAc2V0dGluZ0xvY2F0aW9uID0gZmFsc2VcbiAgICBAZXJyb3JGaW5kaW5nTG9jYXRpb24gPSB0cnVlXG4gICAgQHJlbmRlcigpXG5cbiAgbWFwQ2xpY2tlZDogPT5cbiAgICBAdHJpZ2dlcignbWFwJywgQGxvYylcblxuXG5tb2R1bGUuZXhwb3J0cyA9IExvY2F0aW9uVmlldyIsImNvbXBpbGVEb2N1bWVudFNlbGVjdG9yID0gcmVxdWlyZSgnLi9zZWxlY3RvcicpLmNvbXBpbGVEb2N1bWVudFNlbGVjdG9yXG5jb21waWxlU29ydCA9IHJlcXVpcmUoJy4vc2VsZWN0b3InKS5jb21waWxlU29ydFxuR2VvSlNPTiA9IHJlcXVpcmUgJy4uL0dlb0pTT04nXG5cbmNsYXNzIExvY2FsRGJcbiAgY29uc3RydWN0b3I6IChuYW1lLCBvcHRpb25zKSAtPlxuICAgIEBuYW1lID0gbmFtZVxuICAgIEBjb2xsZWN0aW9ucyA9IHt9XG5cbiAgICBpZiBvcHRpb25zIGFuZCBvcHRpb25zLm5hbWVzcGFjZSBhbmQgd2luZG93LmxvY2FsU3RvcmFnZVxuICAgICAgQG5hbWVzcGFjZSA9IG9wdGlvbnMubmFtZXNwYWNlXG5cbiAgYWRkQ29sbGVjdGlvbjogKG5hbWUpIC0+XG4gICAgZGJOYW1lID0gQG5hbWVcblxuICAgICMgU2V0IG5hbWVzcGFjZSBmb3IgY29sbGVjdGlvblxuICAgIG5hbWVzcGFjZSA9IEBuYW1lc3BhY2UrXCIuXCIrbmFtZSBpZiBAbmFtZXNwYWNlXG5cbiAgICBjb2xsZWN0aW9uID0gbmV3IENvbGxlY3Rpb24obmFtZSwgbmFtZXNwYWNlKVxuICAgIEBbbmFtZV0gPSBjb2xsZWN0aW9uXG4gICAgQGNvbGxlY3Rpb25zW25hbWVdID0gY29sbGVjdGlvblxuXG4gIHJlbW92ZUNvbGxlY3Rpb246IChuYW1lKSAtPlxuICAgIGRiTmFtZSA9IEBuYW1lXG5cbiAgICBpZiBAbmFtZXNwYWNlIGFuZCB3aW5kb3cubG9jYWxTdG9yYWdlXG4gICAgICBrZXlzID0gW11cbiAgICAgIGZvciBpIGluIFswLi4ubG9jYWxTdG9yYWdlLmxlbmd0aF1cbiAgICAgICAga2V5cy5wdXNoKGxvY2FsU3RvcmFnZS5rZXkoaSkpXG5cbiAgICAgIGZvciBrZXkgaW4ga2V5c1xuICAgICAgICBpZiBrZXkuc3Vic3RyaW5nKDAsIEBuYW1lc3BhY2UubGVuZ3RoICsgMSkgPT0gQG5hbWVzcGFjZSArIFwiLlwiXG4gICAgICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oa2V5KVxuXG4gICAgZGVsZXRlIEBbbmFtZV1cbiAgICBkZWxldGUgQGNvbGxlY3Rpb25zW25hbWVdXG5cblxuIyBTdG9yZXMgZGF0YSBpbiBtZW1vcnksIG9wdGlvbmFsbHkgYmFja2VkIGJ5IGxvY2FsIHN0b3JhZ2VcbmNsYXNzIENvbGxlY3Rpb25cbiAgY29uc3RydWN0b3I6IChuYW1lLCBuYW1lc3BhY2UpIC0+XG4gICAgQG5hbWUgPSBuYW1lXG4gICAgQG5hbWVzcGFjZSA9IG5hbWVzcGFjZVxuXG4gICAgQGl0ZW1zID0ge31cbiAgICBAdXBzZXJ0cyA9IHt9ICAjIFBlbmRpbmcgdXBzZXJ0cyBieSBfaWQuIFN0aWxsIGluIGl0ZW1zXG4gICAgQHJlbW92ZXMgPSB7fSAgIyBQZW5kaW5nIHJlbW92ZXMgYnkgX2lkLiBObyBsb25nZXIgaW4gaXRlbXNcblxuICAgICMgUmVhZCBmcm9tIGxvY2FsIHN0b3JhZ2VcbiAgICBpZiB3aW5kb3cubG9jYWxTdG9yYWdlIGFuZCBuYW1lc3BhY2U/XG4gICAgICBAbG9hZFN0b3JhZ2UoKVxuXG4gIGxvYWRTdG9yYWdlOiAtPlxuICAgICMgUmVhZCBpdGVtcyBmcm9tIGxvY2FsU3RvcmFnZVxuICAgIEBpdGVtTmFtZXNwYWNlID0gQG5hbWVzcGFjZSArIFwiX1wiXG5cbiAgICBmb3IgaSBpbiBbMC4uLmxvY2FsU3RvcmFnZS5sZW5ndGhdXG4gICAgICBrZXkgPSBsb2NhbFN0b3JhZ2Uua2V5KGkpXG4gICAgICBpZiBrZXkuc3Vic3RyaW5nKDAsIEBpdGVtTmFtZXNwYWNlLmxlbmd0aCkgPT0gQGl0ZW1OYW1lc3BhY2VcbiAgICAgICAgaXRlbSA9IEpTT04ucGFyc2UobG9jYWxTdG9yYWdlW2tleV0pXG4gICAgICAgIEBpdGVtc1tpdGVtLl9pZF0gPSBpdGVtXG5cbiAgICAjIFJlYWQgdXBzZXJ0c1xuICAgIHVwc2VydEtleXMgPSBpZiBsb2NhbFN0b3JhZ2VbQG5hbWVzcGFjZStcInVwc2VydHNcIl0gdGhlbiBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZVtAbmFtZXNwYWNlK1widXBzZXJ0c1wiXSkgZWxzZSBbXVxuICAgIGZvciBrZXkgaW4gdXBzZXJ0S2V5c1xuICAgICAgQHVwc2VydHNba2V5XSA9IEBpdGVtc1trZXldXG5cbiAgICAjIFJlYWQgcmVtb3Zlc1xuICAgIHJlbW92ZUl0ZW1zID0gaWYgbG9jYWxTdG9yYWdlW0BuYW1lc3BhY2UrXCJyZW1vdmVzXCJdIHRoZW4gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2VbQG5hbWVzcGFjZStcInJlbW92ZXNcIl0pIGVsc2UgW11cbiAgICBAcmVtb3ZlcyA9IF8ub2JqZWN0KF8ucGx1Y2socmVtb3ZlSXRlbXMsIFwiX2lkXCIpLCByZW1vdmVJdGVtcylcblxuICBmaW5kOiAoc2VsZWN0b3IsIG9wdGlvbnMpIC0+XG4gICAgcmV0dXJuIGZldGNoOiAoc3VjY2VzcywgZXJyb3IpID0+XG4gICAgICBAX2ZpbmRGZXRjaChzZWxlY3Rvciwgb3B0aW9ucywgc3VjY2VzcywgZXJyb3IpXG5cbiAgZmluZE9uZTogKHNlbGVjdG9yLCBvcHRpb25zLCBzdWNjZXNzLCBlcnJvcikgLT5cbiAgICBpZiBfLmlzRnVuY3Rpb24ob3B0aW9ucykgXG4gICAgICBbb3B0aW9ucywgc3VjY2VzcywgZXJyb3JdID0gW3t9LCBvcHRpb25zLCBzdWNjZXNzXVxuXG4gICAgQGZpbmQoc2VsZWN0b3IsIG9wdGlvbnMpLmZldGNoIChyZXN1bHRzKSAtPlxuICAgICAgaWYgc3VjY2Vzcz8gdGhlbiBzdWNjZXNzKGlmIHJlc3VsdHMubGVuZ3RoPjAgdGhlbiByZXN1bHRzWzBdIGVsc2UgbnVsbClcbiAgICAsIGVycm9yXG5cbiAgX2ZpbmRGZXRjaDogKHNlbGVjdG9yLCBvcHRpb25zLCBzdWNjZXNzLCBlcnJvcikgLT5cbiAgICBmaWx0ZXJlZCA9IF8uZmlsdGVyKF8udmFsdWVzKEBpdGVtcyksIGNvbXBpbGVEb2N1bWVudFNlbGVjdG9yKHNlbGVjdG9yKSlcblxuICAgICMgSGFuZGxlIGdlb3NwYXRpYWwgb3BlcmF0b3JzXG4gICAgZmlsdGVyZWQgPSBwcm9jZXNzTmVhck9wZXJhdG9yKHNlbGVjdG9yLCBmaWx0ZXJlZClcbiAgICBmaWx0ZXJlZCA9IHByb2Nlc3NHZW9JbnRlcnNlY3RzT3BlcmF0b3Ioc2VsZWN0b3IsIGZpbHRlcmVkKVxuXG4gICAgaWYgb3B0aW9ucyBhbmQgb3B0aW9ucy5zb3J0IFxuICAgICAgZmlsdGVyZWQuc29ydChjb21waWxlU29ydChvcHRpb25zLnNvcnQpKVxuXG4gICAgaWYgb3B0aW9ucyBhbmQgb3B0aW9ucy5saW1pdFxuICAgICAgZmlsdGVyZWQgPSBfLmZpcnN0IGZpbHRlcmVkLCBvcHRpb25zLmxpbWl0XG5cbiAgICAjIENsb25lIHRvIHByZXZlbnQgYWNjaWRlbnRhbCB1cGRhdGVzXG4gICAgZmlsdGVyZWQgPSBfLm1hcCBmaWx0ZXJlZCwgKGRvYykgLT4gXy5jbG9uZURlZXAoZG9jKVxuICAgIGlmIHN1Y2Nlc3M/IHRoZW4gc3VjY2VzcyhmaWx0ZXJlZClcblxuICB1cHNlcnQ6IChkb2MsIHN1Y2Nlc3MsIGVycm9yKSAtPlxuICAgIGlmIG5vdCBkb2MuX2lkXG4gICAgICBkb2MuX2lkID0gY3JlYXRlVWlkKClcblxuICAgICMgUmVwbGFjZS9hZGQgXG4gICAgQF9wdXRJdGVtKGRvYylcbiAgICBAX3B1dFVwc2VydChkb2MpXG5cbiAgICBpZiBzdWNjZXNzPyB0aGVuIHN1Y2Nlc3MoZG9jKVxuXG4gIHJlbW92ZTogKGlkLCBzdWNjZXNzLCBlcnJvcikgLT5cbiAgICBpZiBfLmhhcyhAaXRlbXMsIGlkKVxuICAgICAgQF9wdXRSZW1vdmUoQGl0ZW1zW2lkXSlcbiAgICAgIEBfZGVsZXRlSXRlbShpZClcbiAgICAgIEBfZGVsZXRlVXBzZXJ0KGlkKVxuXG4gICAgaWYgc3VjY2Vzcz8gdGhlbiBzdWNjZXNzKClcblxuICBfcHV0SXRlbTogKGRvYykgLT5cbiAgICBAaXRlbXNbZG9jLl9pZF0gPSBkb2NcbiAgICBpZiBAbmFtZXNwYWNlXG4gICAgICBsb2NhbFN0b3JhZ2VbQGl0ZW1OYW1lc3BhY2UgKyBkb2MuX2lkXSA9IEpTT04uc3RyaW5naWZ5KGRvYylcblxuICBfZGVsZXRlSXRlbTogKGlkKSAtPlxuICAgIGRlbGV0ZSBAaXRlbXNbaWRdXG4gICAgaWYgQG5hbWVzcGFjZVxuICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oQGl0ZW1OYW1lc3BhY2UgKyBpZClcblxuICBfcHV0VXBzZXJ0OiAoZG9jKSAtPlxuICAgIEB1cHNlcnRzW2RvYy5faWRdID0gZG9jXG4gICAgaWYgQG5hbWVzcGFjZVxuICAgICAgbG9jYWxTdG9yYWdlW0BuYW1lc3BhY2UrXCJ1cHNlcnRzXCJdID0gSlNPTi5zdHJpbmdpZnkoXy5rZXlzKEB1cHNlcnRzKSlcblxuICBfZGVsZXRlVXBzZXJ0OiAoaWQpIC0+XG4gICAgZGVsZXRlIEB1cHNlcnRzW2lkXVxuICAgIGlmIEBuYW1lc3BhY2VcbiAgICAgIGxvY2FsU3RvcmFnZVtAbmFtZXNwYWNlK1widXBzZXJ0c1wiXSA9IEpTT04uc3RyaW5naWZ5KF8ua2V5cyhAdXBzZXJ0cykpXG5cbiAgX3B1dFJlbW92ZTogKGRvYykgLT5cbiAgICBAcmVtb3Zlc1tkb2MuX2lkXSA9IGRvY1xuICAgIGlmIEBuYW1lc3BhY2VcbiAgICAgIGxvY2FsU3RvcmFnZVtAbmFtZXNwYWNlK1wicmVtb3Zlc1wiXSA9IEpTT04uc3RyaW5naWZ5KF8udmFsdWVzKEByZW1vdmVzKSlcblxuICBfZGVsZXRlUmVtb3ZlOiAoaWQpIC0+XG4gICAgZGVsZXRlIEByZW1vdmVzW2lkXVxuICAgIGlmIEBuYW1lc3BhY2VcbiAgICAgIGxvY2FsU3RvcmFnZVtAbmFtZXNwYWNlK1wicmVtb3Zlc1wiXSA9IEpTT04uc3RyaW5naWZ5KF8udmFsdWVzKEByZW1vdmVzKSlcblxuICBjYWNoZTogKGRvY3MsIHNlbGVjdG9yLCBvcHRpb25zLCBzdWNjZXNzLCBlcnJvcikgLT5cbiAgICAjIEFkZCBhbGwgbm9uLWxvY2FsIHRoYXQgYXJlIG5vdCB1cHNlcnRlZCBvciByZW1vdmVkXG4gICAgZm9yIGRvYyBpbiBkb2NzXG4gICAgICBpZiBub3QgXy5oYXMoQHVwc2VydHMsIGRvYy5faWQpIGFuZCBub3QgXy5oYXMoQHJlbW92ZXMsIGRvYy5faWQpXG4gICAgICAgIEBfcHV0SXRlbShkb2MpXG5cbiAgICBkb2NzTWFwID0gXy5vYmplY3QoXy5wbHVjayhkb2NzLCBcIl9pZFwiKSwgZG9jcylcblxuICAgIGlmIG9wdGlvbnMuc29ydFxuICAgICAgc29ydCA9IGNvbXBpbGVTb3J0KG9wdGlvbnMuc29ydClcblxuICAgICMgUGVyZm9ybSBxdWVyeSwgcmVtb3Zpbmcgcm93cyBtaXNzaW5nIGluIGRvY3MgZnJvbSBsb2NhbCBkYiBcbiAgICBAZmluZChzZWxlY3Rvciwgb3B0aW9ucykuZmV0Y2ggKHJlc3VsdHMpID0+XG4gICAgICBmb3IgcmVzdWx0IGluIHJlc3VsdHNcbiAgICAgICAgaWYgbm90IGRvY3NNYXBbcmVzdWx0Ll9pZF0gYW5kIG5vdCBfLmhhcyhAdXBzZXJ0cywgcmVzdWx0Ll9pZClcbiAgICAgICAgICAjIElmIHBhc3QgZW5kIG9uIHNvcnRlZCBsaW1pdGVkLCBpZ25vcmVcbiAgICAgICAgICBpZiBvcHRpb25zLnNvcnQgYW5kIG9wdGlvbnMubGltaXQgYW5kIGRvY3MubGVuZ3RoID09IG9wdGlvbnMubGltaXRcbiAgICAgICAgICAgIGlmIHNvcnQocmVzdWx0LCBfLmxhc3QoZG9jcykpID49IDBcbiAgICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICBAX2RlbGV0ZUl0ZW0ocmVzdWx0Ll9pZClcblxuICAgICAgaWYgc3VjY2Vzcz8gdGhlbiBzdWNjZXNzKCkgIFxuICAgICwgZXJyb3JcbiAgICBcbiAgcGVuZGluZ1Vwc2VydHM6IChzdWNjZXNzKSAtPlxuICAgIHN1Y2Nlc3MgXy52YWx1ZXMoQHVwc2VydHMpXG5cbiAgcGVuZGluZ1JlbW92ZXM6IChzdWNjZXNzKSAtPlxuICAgIHN1Y2Nlc3MgXy5wbHVjayhAcmVtb3ZlcywgXCJfaWRcIilcblxuICByZXNvbHZlVXBzZXJ0OiAoZG9jLCBzdWNjZXNzKSAtPlxuICAgIGlmIEB1cHNlcnRzW2RvYy5faWRdIGFuZCBfLmlzRXF1YWwoZG9jLCBAdXBzZXJ0c1tkb2MuX2lkXSlcbiAgICAgIEBfZGVsZXRlVXBzZXJ0KGRvYy5faWQpXG4gICAgaWYgc3VjY2Vzcz8gdGhlbiBzdWNjZXNzKClcblxuICByZXNvbHZlUmVtb3ZlOiAoaWQsIHN1Y2Nlc3MpIC0+XG4gICAgQF9kZWxldGVSZW1vdmUoaWQpXG4gICAgaWYgc3VjY2Vzcz8gdGhlbiBzdWNjZXNzKClcblxuICAjIEFkZCBidXQgZG8gbm90IG92ZXJ3cml0ZSBvciByZWNvcmQgYXMgdXBzZXJ0XG4gIHNlZWQ6IChkb2MsIHN1Y2Nlc3MpIC0+XG4gICAgaWYgbm90IF8uaGFzKEBpdGVtcywgZG9jLl9pZCkgYW5kIG5vdCBfLmhhcyhAcmVtb3ZlcywgZG9jLl9pZClcbiAgICAgIEBfcHV0SXRlbShkb2MpXG4gICAgaWYgc3VjY2Vzcz8gdGhlbiBzdWNjZXNzKClcblxuXG5jcmVhdGVVaWQgPSAtPiBcbiAgJ3h4eHh4eHh4eHh4eDR4eHh5eHh4eHh4eHh4eHh4eHh4Jy5yZXBsYWNlKC9beHldL2csIChjKSAtPlxuICAgIHIgPSBNYXRoLnJhbmRvbSgpKjE2fDBcbiAgICB2ID0gaWYgYyA9PSAneCcgdGhlbiByIGVsc2UgKHImMHgzfDB4OClcbiAgICByZXR1cm4gdi50b1N0cmluZygxNilcbiAgIClcblxucHJvY2Vzc05lYXJPcGVyYXRvciA9IChzZWxlY3RvciwgbGlzdCkgLT5cbiAgZm9yIGtleSwgdmFsdWUgb2Ygc2VsZWN0b3JcbiAgICBpZiB2YWx1ZT8gYW5kIHZhbHVlWyckbmVhciddXG4gICAgICBnZW8gPSB2YWx1ZVsnJG5lYXInXVsnJGdlb21ldHJ5J11cbiAgICAgIGlmIGdlby50eXBlICE9ICdQb2ludCdcbiAgICAgICAgYnJlYWtcblxuICAgICAgbmVhciA9IG5ldyBMLkxhdExuZyhnZW8uY29vcmRpbmF0ZXNbMV0sIGdlby5jb29yZGluYXRlc1swXSlcblxuICAgICAgbGlzdCA9IF8uZmlsdGVyIGxpc3QsIChkb2MpIC0+XG4gICAgICAgIHJldHVybiBkb2Nba2V5XSBhbmQgZG9jW2tleV0udHlwZSA9PSAnUG9pbnQnXG5cbiAgICAgICMgR2V0IGRpc3RhbmNlc1xuICAgICAgZGlzdGFuY2VzID0gXy5tYXAgbGlzdCwgKGRvYykgLT5cbiAgICAgICAgcmV0dXJuIHsgZG9jOiBkb2MsIGRpc3RhbmNlOiBcbiAgICAgICAgICBuZWFyLmRpc3RhbmNlVG8obmV3IEwuTGF0TG5nKGRvY1trZXldLmNvb3JkaW5hdGVzWzFdLCBkb2Nba2V5XS5jb29yZGluYXRlc1swXSkpXG4gICAgICAgIH1cblxuICAgICAgIyBGaWx0ZXIgbm9uLXBvaW50c1xuICAgICAgZGlzdGFuY2VzID0gXy5maWx0ZXIgZGlzdGFuY2VzLCAoaXRlbSkgLT4gaXRlbS5kaXN0YW5jZSA+PSAwXG5cbiAgICAgICMgU29ydCBieSBkaXN0YW5jZVxuICAgICAgZGlzdGFuY2VzID0gXy5zb3J0QnkgZGlzdGFuY2VzLCAnZGlzdGFuY2UnXG5cbiAgICAgICMgRmlsdGVyIGJ5IG1heERpc3RhbmNlXG4gICAgICBpZiB2YWx1ZVsnJG5lYXInXVsnJG1heERpc3RhbmNlJ11cbiAgICAgICAgZGlzdGFuY2VzID0gXy5maWx0ZXIgZGlzdGFuY2VzLCAoaXRlbSkgLT4gaXRlbS5kaXN0YW5jZSA8PSB2YWx1ZVsnJG5lYXInXVsnJG1heERpc3RhbmNlJ11cblxuICAgICAgIyBMaW1pdCB0byAxMDBcbiAgICAgIGRpc3RhbmNlcyA9IF8uZmlyc3QgZGlzdGFuY2VzLCAxMDBcblxuICAgICAgIyBFeHRyYWN0IGRvY3NcbiAgICAgIGxpc3QgPSBfLnBsdWNrIGRpc3RhbmNlcywgJ2RvYydcbiAgcmV0dXJuIGxpc3RcblxucHJvY2Vzc0dlb0ludGVyc2VjdHNPcGVyYXRvciA9IChzZWxlY3RvciwgbGlzdCkgLT5cbiAgZm9yIGtleSwgdmFsdWUgb2Ygc2VsZWN0b3JcbiAgICBpZiB2YWx1ZT8gYW5kIHZhbHVlWyckZ2VvSW50ZXJzZWN0cyddXG4gICAgICBnZW8gPSB2YWx1ZVsnJGdlb0ludGVyc2VjdHMnXVsnJGdlb21ldHJ5J11cbiAgICAgIGlmIGdlby50eXBlICE9ICdQb2x5Z29uJ1xuICAgICAgICBicmVha1xuXG4gICAgICAjIENoZWNrIHdpdGhpbiBmb3IgZWFjaFxuICAgICAgbGlzdCA9IF8uZmlsdGVyIGxpc3QsIChkb2MpIC0+XG4gICAgICAgICMgUmVqZWN0IG5vbi1wb2ludHNcbiAgICAgICAgaWYgbm90IGRvY1trZXldIG9yIGRvY1trZXldLnR5cGUgIT0gJ1BvaW50J1xuICAgICAgICAgIHJldHVybiBmYWxzZVxuXG4gICAgICAgICMgQ2hlY2sgcG9seWdvblxuICAgICAgICByZXR1cm4gR2VvSlNPTi5wb2ludEluUG9seWdvbihkb2Nba2V5XSwgZ2VvKVxuXG4gIHJldHVybiBsaXN0XG5cbm1vZHVsZS5leHBvcnRzID0gTG9jYWxEYlxuIiwiUGFnZSA9IHJlcXVpcmUgXCIuLi9QYWdlXCJcblxuIyBEaXNwbGF5cyBhbiBpbWFnZS4gT3B0aW9uczogdWlkOiB1aWQgb2YgaW1hZ2Vcbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgSW1hZ2VQYWdlIGV4dGVuZHMgUGFnZVxuICBjcmVhdGU6IC0+XG4gICAgQCRlbC5odG1sIHRlbXBsYXRlc1snSW1hZ2VQYWdlJ10oKVxuXG4gICAgIyBHZXQgaW1hZ2UgdXJsXG4gICAgQGltYWdlTWFuYWdlci5nZXRJbWFnZVVybChAb3B0aW9ucy51aWQsICh1cmwpID0+XG4gICAgICBAJChcIiNtZXNzYWdlX2JhclwiKS5oaWRlKClcbiAgICAgIEAkKFwiI2ltYWdlXCIpLmF0dHIoXCJzcmNcIiwgdXJsKS5zaG93KClcbiAgICAsIEBlcnJvcilcblxuICBhY3RpdmF0ZTogLT5cbiAgICBAc2V0VGl0bGUgXCJJbWFnZVwiXG5cbiIsImV4cG9ydHMuU2VjdGlvbnMgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCh7XG4gICAgY2xhc3NOYW1lIDogXCJzdXJ2ZXlcIixcblxuICAgIGluaXRpYWxpemUgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy50aXRsZSA9IHRoaXMub3B0aW9ucy50aXRsZTtcbiAgICAgICAgdGhpcy5zZWN0aW9ucyA9IHRoaXMub3B0aW9ucy5zZWN0aW9ucztcbiAgICAgICAgdGhpcy5yZW5kZXIoKTtcblxuICAgICAgICAvLyBBZGp1c3QgbmV4dC9wcmV2IGJhc2VkIG9uIG1vZGVsXG4gICAgICAgIHRoaXMubW9kZWwub24oXCJjaGFuZ2VcIiwgdGhpcy5yZW5kZXJOZXh0UHJldiwgdGhpcyk7XG5cbiAgICAgICAgLy8gR28gdG8gYXBwcm9wcmlhdGUgc2VjdGlvbiBUT0RPXG4gICAgICAgIHRoaXMuc2hvd1NlY3Rpb24oMCk7XG4gICAgfSxcblxuICAgIGV2ZW50cyA6IHtcbiAgICAgICAgXCJjbGljayAubmV4dFwiIDogXCJuZXh0U2VjdGlvblwiLFxuICAgICAgICBcImNsaWNrIC5wcmV2XCIgOiBcInByZXZTZWN0aW9uXCIsXG4gICAgICAgIFwiY2xpY2sgLmZpbmlzaFwiIDogXCJmaW5pc2hcIixcbiAgICAgICAgXCJjbGljayBhLnNlY3Rpb24tY3J1bWJcIiA6IFwiY3J1bWJTZWN0aW9uXCJcbiAgICB9LFxuXG4gICAgZmluaXNoIDogZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIFZhbGlkYXRlIGN1cnJlbnQgc2VjdGlvblxuICAgICAgICB2YXIgc2VjdGlvbiA9IHRoaXMuc2VjdGlvbnNbdGhpcy5zZWN0aW9uXTtcbiAgICAgICAgaWYgKHNlY3Rpb24udmFsaWRhdGUoKSkge1xuICAgICAgICAgICAgdGhpcy50cmlnZ2VyKCdjb21wbGV0ZScpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGNydW1iU2VjdGlvbiA6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgLy8gR28gdG8gc2VjdGlvblxuICAgICAgICB2YXIgaW5kZXggPSBwYXJzZUludChlLnRhcmdldC5nZXRBdHRyaWJ1dGUoXCJkYXRhLXZhbHVlXCIpKTtcbiAgICAgICAgdGhpcy5zaG93U2VjdGlvbihpbmRleCk7XG4gICAgfSxcblxuICAgIGdldE5leHRTZWN0aW9uSW5kZXggOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGkgPSB0aGlzLnNlY3Rpb24gKyAxO1xuICAgICAgICB3aGlsZSAoaSA8IHRoaXMuc2VjdGlvbnMubGVuZ3RoKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5zZWN0aW9uc1tpXS5zaG91bGRCZVZpc2libGUoKSlcbiAgICAgICAgICAgICAgICByZXR1cm4gaTtcbiAgICAgICAgICAgIGkrKztcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBnZXRQcmV2U2VjdGlvbkluZGV4IDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBpID0gdGhpcy5zZWN0aW9uIC0gMTtcbiAgICAgICAgd2hpbGUgKGkgPj0gMCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuc2VjdGlvbnNbaV0uc2hvdWxkQmVWaXNpYmxlKCkpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGk7XG4gICAgICAgICAgICBpLS07XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgbmV4dFNlY3Rpb24gOiBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gVmFsaWRhdGUgY3VycmVudCBzZWN0aW9uXG4gICAgICAgIHZhciBzZWN0aW9uID0gdGhpcy5zZWN0aW9uc1t0aGlzLnNlY3Rpb25dO1xuICAgICAgICBpZiAoc2VjdGlvbi52YWxpZGF0ZSgpKSB7XG4gICAgICAgICAgICB0aGlzLnNob3dTZWN0aW9uKHRoaXMuZ2V0TmV4dFNlY3Rpb25JbmRleCgpKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBwcmV2U2VjdGlvbiA6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnNob3dTZWN0aW9uKHRoaXMuZ2V0UHJldlNlY3Rpb25JbmRleCgpKTtcbiAgICB9LFxuXG4gICAgc2hvd1NlY3Rpb24gOiBmdW5jdGlvbihpbmRleCkge1xuICAgICAgICB0aGlzLnNlY3Rpb24gPSBpbmRleDtcblxuICAgICAgICBfLmVhY2godGhpcy5zZWN0aW9ucywgZnVuY3Rpb24ocykge1xuICAgICAgICAgICAgcy4kZWwuaGlkZSgpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5zZWN0aW9uc1tpbmRleF0uJGVsLnNob3coKTtcblxuICAgICAgICAvLyBTZXR1cCBicmVhZGNydW1ic1xuICAgICAgICB2YXIgdmlzaWJsZVNlY3Rpb25zID0gXy5maWx0ZXIoXy5maXJzdCh0aGlzLnNlY3Rpb25zLCBpbmRleCArIDEpLCBmdW5jdGlvbihzKSB7XG4gICAgICAgICAgICByZXR1cm4gcy5zaG91bGRCZVZpc2libGUoKVxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy4kKFwiLmJyZWFkY3J1bWJcIikuaHRtbCh0ZW1wbGF0ZXNbJ2Zvcm1zL1NlY3Rpb25zX2JyZWFkY3J1bWJzJ10oe1xuICAgICAgICAgICAgc2VjdGlvbnMgOiBfLmluaXRpYWwodmlzaWJsZVNlY3Rpb25zKSxcbiAgICAgICAgICAgIGxhc3RTZWN0aW9uOiBfLmxhc3QodmlzaWJsZVNlY3Rpb25zKVxuICAgICAgICB9KSk7XG4gICAgICAgIFxuICAgICAgICB0aGlzLnJlbmRlck5leHRQcmV2KCk7XG5cbiAgICAgICAgLy8gU2Nyb2xsIGludG8gdmlld1xuICAgICAgICB0aGlzLiRlbC5zY3JvbGxpbnRvdmlldygpO1xuICAgIH0sXG4gICAgXG4gICAgcmVuZGVyTmV4dFByZXYgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gU2V0dXAgbmV4dC9wcmV2IGJ1dHRvbnNcbiAgICAgICAgdGhpcy4kKFwiLnByZXZcIikudG9nZ2xlKHRoaXMuZ2V0UHJldlNlY3Rpb25JbmRleCgpICE9PSB1bmRlZmluZWQpO1xuICAgICAgICB0aGlzLiQoXCIubmV4dFwiKS50b2dnbGUodGhpcy5nZXROZXh0U2VjdGlvbkluZGV4KCkgIT09IHVuZGVmaW5lZCk7XG4gICAgICAgIHRoaXMuJChcIi5maW5pc2hcIikudG9nZ2xlKHRoaXMuZ2V0TmV4dFNlY3Rpb25JbmRleCgpID09PSB1bmRlZmluZWQpO1xuICAgIH0sXG5cbiAgICByZW5kZXIgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy4kZWwuaHRtbCh0ZW1wbGF0ZXNbJ2Zvcm1zL1NlY3Rpb25zJ10oKSk7XG5cbiAgICAgICAgLy8gQWRkIHNlY3Rpb25zXG4gICAgICAgIHZhciBzZWN0aW9uc0VsID0gdGhpcy4kKFwiLnNlY3Rpb25zXCIpO1xuICAgICAgICBfLmVhY2godGhpcy5zZWN0aW9ucywgZnVuY3Rpb24ocykge1xuICAgICAgICAgICAgc2VjdGlvbnNFbC5hcHBlbmQocy4kZWwpO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbn0pO1xuXG5leHBvcnRzLlNlY3Rpb24gPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCh7XG4gICAgY2xhc3NOYW1lIDogXCJzZWN0aW9uXCIsXG4gICAgdGVtcGxhdGUgOiBfLnRlbXBsYXRlKCc8ZGl2IGNsYXNzPVwiY29udGVudHNcIj48L2Rpdj4nKSxcblxuICAgIGluaXRpYWxpemUgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy50aXRsZSA9IHRoaXMub3B0aW9ucy50aXRsZTtcbiAgICAgICAgdGhpcy5jb250ZW50cyA9IHRoaXMub3B0aW9ucy5jb250ZW50cztcblxuICAgICAgICAvLyBBbHdheXMgaW52aXNpYmxlIGluaXRpYWxseVxuICAgICAgICB0aGlzLiRlbC5oaWRlKCk7XG4gICAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgfSxcblxuICAgIHNob3VsZEJlVmlzaWJsZSA6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoIXRoaXMub3B0aW9ucy5jb25kaXRpb25hbClcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25zLmNvbmRpdGlvbmFsKHRoaXMubW9kZWwpO1xuICAgIH0sXG5cbiAgICB2YWxpZGF0ZSA6IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBHZXQgYWxsIHZpc2libGUgaXRlbXNcbiAgICAgICAgdmFyIGl0ZW1zID0gXy5maWx0ZXIodGhpcy5jb250ZW50cywgZnVuY3Rpb24oYykge1xuICAgICAgICAgICAgcmV0dXJuIGMudmlzaWJsZSAmJiBjLnZhbGlkYXRlO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuICFfLmFueShfLm1hcChpdGVtcywgZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICAgICAgcmV0dXJuIGl0ZW0udmFsaWRhdGUoKTtcbiAgICAgICAgfSkpO1xuICAgIH0sXG5cbiAgICByZW5kZXIgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy4kZWwuaHRtbCh0aGlzLnRlbXBsYXRlKHRoaXMpKTtcblxuICAgICAgICAvLyBBZGQgY29udGVudHMgKHF1ZXN0aW9ucywgbW9zdGx5KVxuICAgICAgICB2YXIgY29udGVudHNFbCA9IHRoaXMuJChcIi5jb250ZW50c1wiKTtcbiAgICAgICAgXy5lYWNoKHRoaXMuY29udGVudHMsIGZ1bmN0aW9uKGMpIHtcbiAgICAgICAgICAgIGNvbnRlbnRzRWwuYXBwZW5kKGMuJGVsKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG59KTtcblxuZXhwb3J0cy5RdWVzdGlvbiA9IEJhY2tib25lLlZpZXcuZXh0ZW5kKHtcbiAgICBjbGFzc05hbWUgOiBcInF1ZXN0aW9uXCIsXG5cbiAgICB0ZW1wbGF0ZSA6IF8udGVtcGxhdGUoJzxkaXYgY2xhc3M9XCJwcm9tcHRcIj48JT1vcHRpb25zLnByb21wdCU+PCU9cmVuZGVyUmVxdWlyZWQoKSU+PC9kaXY+PGRpdiBjbGFzcz1cImFuc3dlclwiPjwvZGl2PjwlPXJlbmRlckhpbnQoKSU+JyksXG5cbiAgICByZW5kZXJSZXF1aXJlZCA6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5yZXF1aXJlZClcbiAgICAgICAgICAgIHJldHVybiAnJm5ic3A7PHNwYW4gY2xhc3M9XCJyZXF1aXJlZFwiPio8L3NwYW4+JztcbiAgICAgICAgcmV0dXJuICcnO1xuICAgIH0sXG5cbiAgICByZW5kZXJIaW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5oaW50KVxuICAgICAgICAgICAgcmV0dXJuIF8udGVtcGxhdGUoJzxkaXYgY2xhc3M9XCJtdXRlZFwiPjwlPWhpbnQlPjwvZGl2PicpKHtoaW50OiB0aGlzLm9wdGlvbnMuaGludH0pO1xuICAgIH0sXG5cbiAgICB2YWxpZGF0ZSA6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgdmFsO1xuXG4gICAgICAgIC8vIENoZWNrIHJlcXVpcmVkXG4gICAgICAgIGlmICh0aGlzLnJlcXVpcmVkKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5tb2RlbC5nZXQodGhpcy5pZCkgPT09IHVuZGVmaW5lZCB8fCB0aGlzLm1vZGVsLmdldCh0aGlzLmlkKSA9PT0gbnVsbCB8fCB0aGlzLm1vZGVsLmdldCh0aGlzLmlkKSA9PT0gXCJcIilcbiAgICAgICAgICAgICAgICB2YWwgPSBcIlJlcXVpcmVkXCI7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDaGVjayBpbnRlcm5hbCB2YWxpZGF0aW9uXG4gICAgICAgIGlmICghdmFsICYmIHRoaXMudmFsaWRhdGVJbnRlcm5hbCkge1xuICAgICAgICAgICAgdmFsID0gdGhpcy52YWxpZGF0ZUludGVybmFsKCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDaGVjayBjdXN0b20gdmFsaWRhdGlvblxuICAgICAgICBpZiAoIXZhbCAmJiB0aGlzLm9wdGlvbnMudmFsaWRhdGUpIHtcbiAgICAgICAgICAgIHZhbCA9IHRoaXMub3B0aW9ucy52YWxpZGF0ZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gU2hvdyB2YWxpZGF0aW9uIHJlc3VsdHMgVE9ET1xuICAgICAgICBpZiAodmFsKSB7XG4gICAgICAgICAgICB0aGlzLiRlbC5hZGRDbGFzcyhcImludmFsaWRcIik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLiRlbC5yZW1vdmVDbGFzcyhcImludmFsaWRcIik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdmFsO1xuICAgIH0sXG5cbiAgICB1cGRhdGVWaXNpYmlsaXR5IDogZnVuY3Rpb24oZSkge1xuICAgICAgICAvLyBzbGlkZVVwL3NsaWRlRG93blxuICAgICAgICBpZiAodGhpcy5zaG91bGRCZVZpc2libGUoKSAmJiAhdGhpcy52aXNpYmxlKVxuICAgICAgICAgICAgdGhpcy4kZWwuc2xpZGVEb3duKCk7XG4gICAgICAgIGlmICghdGhpcy5zaG91bGRCZVZpc2libGUoKSAmJiB0aGlzLnZpc2libGUpXG4gICAgICAgICAgICB0aGlzLiRlbC5zbGlkZVVwKCk7XG4gICAgICAgIHRoaXMudmlzaWJsZSA9IHRoaXMuc2hvdWxkQmVWaXNpYmxlKCk7XG4gICAgfSxcblxuICAgIHNob3VsZEJlVmlzaWJsZSA6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoIXRoaXMub3B0aW9ucy5jb25kaXRpb25hbClcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25zLmNvbmRpdGlvbmFsKHRoaXMubW9kZWwpO1xuICAgIH0sXG5cbiAgICBpbml0aWFsaXplIDogZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIEFkanVzdCB2aXNpYmlsaXR5IGJhc2VkIG9uIG1vZGVsXG4gICAgICAgIHRoaXMubW9kZWwub24oXCJjaGFuZ2VcIiwgdGhpcy51cGRhdGVWaXNpYmlsaXR5LCB0aGlzKTtcblxuICAgICAgICAvLyBSZS1yZW5kZXIgYmFzZWQgb24gbW9kZWwgY2hhbmdlc1xuICAgICAgICB0aGlzLm1vZGVsLm9uKFwiY2hhbmdlOlwiICsgdGhpcy5pZCwgdGhpcy5yZW5kZXIsIHRoaXMpO1xuXG4gICAgICAgIHRoaXMucmVxdWlyZWQgPSB0aGlzLm9wdGlvbnMucmVxdWlyZWQ7XG5cbiAgICAgICAgLy8gU2F2ZSBjb250ZXh0XG4gICAgICAgIHRoaXMuY3R4ID0gdGhpcy5vcHRpb25zLmN0eCB8fCB7fTtcblxuICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgIH0sXG5cbiAgICByZW5kZXIgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy4kZWwuaHRtbCh0aGlzLnRlbXBsYXRlKHRoaXMpKTtcblxuICAgICAgICAvLyBSZW5kZXIgYW5zd2VyXG4gICAgICAgIHRoaXMucmVuZGVyQW5zd2VyKHRoaXMuJChcIi5hbnN3ZXJcIikpO1xuXG4gICAgICAgIHRoaXMuJGVsLnRvZ2dsZSh0aGlzLnNob3VsZEJlVmlzaWJsZSgpKTtcbiAgICAgICAgdGhpcy52aXNpYmxlID0gdGhpcy5zaG91bGRCZVZpc2libGUoKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG59KTtcblxuZXhwb3J0cy5SYWRpb1F1ZXN0aW9uID0gZXhwb3J0cy5RdWVzdGlvbi5leHRlbmQoe1xuICAgIGV2ZW50cyA6IHtcbiAgICAgICAgXCJjaGVja2VkXCIgOiBcImNoZWNrZWRcIixcbiAgICB9LFxuXG4gICAgY2hlY2tlZCA6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgdmFyIGluZGV4ID0gcGFyc2VJbnQoZS50YXJnZXQuZ2V0QXR0cmlidXRlKFwiZGF0YS12YWx1ZVwiKSk7XG4gICAgICAgIHZhciB2YWx1ZSA9IHRoaXMub3B0aW9ucy5vcHRpb25zW2luZGV4XVswXTtcbiAgICAgICAgdGhpcy5tb2RlbC5zZXQodGhpcy5pZCwgdmFsdWUpO1xuICAgIH0sXG5cbiAgICByZW5kZXJBbnN3ZXIgOiBmdW5jdGlvbihhbnN3ZXJFbCkge1xuICAgICAgICBhbnN3ZXJFbC5odG1sKF8udGVtcGxhdGUoJzxkaXYgY2xhc3M9XCJyYWRpby1ncm91cFwiPjwlPXJlbmRlclJhZGlvT3B0aW9ucygpJT48L2Rpdj4nLCB0aGlzKSk7XG4gICAgfSxcblxuICAgIHJlbmRlclJhZGlvT3B0aW9ucyA6IGZ1bmN0aW9uKCkge1xuICAgICAgICBodG1sID0gXCJcIjtcbiAgICAgICAgdmFyIGk7XG4gICAgICAgIGZvciAoIGkgPSAwOyBpIDwgdGhpcy5vcHRpb25zLm9wdGlvbnMubGVuZ3RoOyBpKyspXG4gICAgICAgICAgICBodG1sICs9IF8udGVtcGxhdGUoJzxkaXYgY2xhc3M9XCJyYWRpby1idXR0b24gPCU9Y2hlY2tlZCU+XCIgZGF0YS12YWx1ZT1cIjwlPXBvc2l0aW9uJT5cIj48JT10ZXh0JT48L2Rpdj4nLCB7XG4gICAgICAgICAgICAgICAgcG9zaXRpb24gOiBpLFxuICAgICAgICAgICAgICAgIHRleHQgOiB0aGlzLm9wdGlvbnMub3B0aW9uc1tpXVsxXSxcbiAgICAgICAgICAgICAgICBjaGVja2VkIDogdGhpcy5tb2RlbC5nZXQodGhpcy5pZCkgPT09IHRoaXMub3B0aW9ucy5vcHRpb25zW2ldWzBdID8gXCJjaGVja2VkXCIgOiBcIlwiXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gaHRtbDtcbiAgICB9XG5cbn0pO1xuXG5leHBvcnRzLkNoZWNrUXVlc3Rpb24gPSBleHBvcnRzLlF1ZXN0aW9uLmV4dGVuZCh7XG4gICAgZXZlbnRzIDoge1xuICAgICAgICBcImNoZWNrZWRcIiA6IFwiY2hlY2tlZFwiLFxuICAgIH0sXG5cbiAgICBjaGVja2VkIDogZnVuY3Rpb24oZSkge1xuICAgICAgICAvLyBHZXQgY2hlY2tlZFxuICAgICAgICB0aGlzLm1vZGVsLnNldCh0aGlzLmlkLCB0aGlzLiQoXCIuY2hlY2tib3hcIikuaGFzQ2xhc3MoXCJjaGVja2VkXCIpKTtcbiAgICB9LFxuXG4gICAgcmVuZGVyQW5zd2VyIDogZnVuY3Rpb24oYW5zd2VyRWwpIHtcbiAgICAgICAgdmFyIGk7XG4gICAgICAgIGFuc3dlckVsLmFwcGVuZCgkKF8udGVtcGxhdGUoJzxkaXYgY2xhc3M9XCJjaGVja2JveCA8JT1jaGVja2VkJT5cIj48JT10ZXh0JT48L2Rpdj4nLCB7XG4gICAgICAgICAgICB0ZXh0IDogdGhpcy5vcHRpb25zLnRleHQsXG4gICAgICAgICAgICBjaGVja2VkIDogKHRoaXMubW9kZWwuZ2V0KHRoaXMuaWQpKSA/IFwiY2hlY2tlZFwiIDogXCJcIlxuICAgICAgICB9KSkpO1xuICAgIH1cblxufSk7XG5cblxuZXhwb3J0cy5NdWx0aWNoZWNrUXVlc3Rpb24gPSBleHBvcnRzLlF1ZXN0aW9uLmV4dGVuZCh7XG4gICAgZXZlbnRzIDoge1xuICAgICAgICBcImNoZWNrZWRcIiA6IFwiY2hlY2tlZFwiLFxuICAgIH0sXG5cbiAgICBjaGVja2VkIDogZnVuY3Rpb24oZSkge1xuICAgICAgICAvLyBHZXQgYWxsIGNoZWNrZWRcbiAgICAgICAgdmFyIHZhbHVlID0gW107XG4gICAgICAgIHZhciBvcHRzID0gdGhpcy5vcHRpb25zLm9wdGlvbnM7XG4gICAgICAgIHRoaXMuJChcIi5jaGVja2JveFwiKS5lYWNoKGZ1bmN0aW9uKGluZGV4KSB7XG4gICAgICAgICAgICBpZiAoJCh0aGlzKS5oYXNDbGFzcyhcImNoZWNrZWRcIikpXG4gICAgICAgICAgICAgICAgdmFsdWUucHVzaChvcHRzW2luZGV4XVswXSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLm1vZGVsLnNldCh0aGlzLmlkLCB2YWx1ZSk7XG4gICAgfSxcblxuICAgIHJlbmRlckFuc3dlciA6IGZ1bmN0aW9uKGFuc3dlckVsKSB7XG4gICAgICAgIHZhciBpO1xuICAgICAgICBmb3IgKCBpID0gMDsgaSA8IHRoaXMub3B0aW9ucy5vcHRpb25zLmxlbmd0aDsgaSsrKVxuICAgICAgICAgICAgYW5zd2VyRWwuYXBwZW5kKCQoXy50ZW1wbGF0ZSgnPGRpdiBjbGFzcz1cImNoZWNrYm94IDwlPWNoZWNrZWQlPlwiIGRhdGEtdmFsdWU9XCI8JT1wb3NpdGlvbiU+XCI+PCU9dGV4dCU+PC9kaXY+Jywge1xuICAgICAgICAgICAgICAgIHBvc2l0aW9uIDogaSxcbiAgICAgICAgICAgICAgICB0ZXh0IDogdGhpcy5vcHRpb25zLm9wdGlvbnNbaV1bMV0sXG4gICAgICAgICAgICAgICAgY2hlY2tlZCA6ICh0aGlzLm1vZGVsLmdldCh0aGlzLmlkKSAmJiBfLmNvbnRhaW5zKHRoaXMubW9kZWwuZ2V0KHRoaXMuaWQpLCB0aGlzLm9wdGlvbnMub3B0aW9uc1tpXVswXSkpID8gXCJjaGVja2VkXCIgOiBcIlwiXG4gICAgICAgICAgICB9KSkpO1xuICAgIH1cblxufSk7XG5cbmV4cG9ydHMuVGV4dFF1ZXN0aW9uID0gZXhwb3J0cy5RdWVzdGlvbi5leHRlbmQoe1xuICAgIHJlbmRlckFuc3dlciA6IGZ1bmN0aW9uKGFuc3dlckVsKSB7XG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMubXVsdGlsaW5lKSB7XG4gICAgICAgICAgICBhbnN3ZXJFbC5odG1sKF8udGVtcGxhdGUoJzx0ZXh0YXJlYSBzdHlsZT1cIndpZHRoOjkwJVwiLz4nLCB0aGlzKSk7IC8vIFRPRE8gbWFrZSB3aWR0aCBwcm9wZXJseVxuICAgICAgICAgICAgYW5zd2VyRWwuZmluZChcInRleHRhcmVhXCIpLnZhbCh0aGlzLm1vZGVsLmdldCh0aGlzLmlkKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhbnN3ZXJFbC5odG1sKF8udGVtcGxhdGUoJzxpbnB1dCB0eXBlPVwidGV4dFwiLz4nLCB0aGlzKSk7XG4gICAgICAgICAgICBhbnN3ZXJFbC5maW5kKFwiaW5wdXRcIikudmFsKHRoaXMubW9kZWwuZ2V0KHRoaXMuaWQpKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBldmVudHMgOiB7XG4gICAgICAgIFwiY2hhbmdlXCIgOiBcImNoYW5nZWRcIlxuICAgIH0sXG4gICAgY2hhbmdlZCA6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLm1vZGVsLnNldCh0aGlzLmlkLCB0aGlzLiQodGhpcy5vcHRpb25zLm11bHRpbGluZSA/IFwidGV4dGFyZWFcIiA6IFwiaW5wdXRcIikudmFsKCkpO1xuICAgIH1cblxufSk7XG4iLCIjIEdyb3VwIG9mIHF1ZXN0aW9ucyB3aGljaCB2YWxpZGF0ZSBhcyBhIHVuaXRcblxubW9kdWxlLmV4cG9ydHMgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZFxuICBpbml0aWFsaXplOiAtPlxuICAgIEBjb250ZW50cyA9IEBvcHRpb25zLmNvbnRlbnRzXG4gICAgQHJlbmRlcigpXG5cbiAgdmFsaWRhdGU6IC0+XG4gICAgIyBHZXQgYWxsIHZpc2libGUgaXRlbXNcbiAgICBpdGVtcyA9IF8uZmlsdGVyKEBjb250ZW50cywgKGMpIC0+XG4gICAgICBjLnZpc2libGUgYW5kIGMudmFsaWRhdGVcbiAgICApXG4gICAgcmV0dXJuIG5vdCBfLmFueShfLm1hcChpdGVtcywgKGl0ZW0pIC0+XG4gICAgICBpdGVtLnZhbGlkYXRlKClcbiAgICApKVxuXG4gIHJlbmRlcjogLT5cbiAgICBAJGVsLmh0bWwgXCJcIlxuICAgIFxuICAgICMgQWRkIGNvbnRlbnRzIChxdWVzdGlvbnMsIG1vc3RseSlcbiAgICBfLmVhY2ggQGNvbnRlbnRzLCAoYykgPT4gQCRlbC5hcHBlbmQgYy4kZWxcblxuICAgIHRoaXNcbiIsIiMgRm9ybSB0aGF0IGhhcyBzYXZlIGFuZCBjYW5jZWwgYnV0dG9ucyB0aGF0IGZpcmUgc2F2ZSBhbmQgY2FuY2VsIGV2ZW50cy5cbiMgU2F2ZSBldmVudCB3aWxsIG9ubHkgYmUgZmlyZWQgaWYgdmFsaWRhdGVzXG5cbm1vZHVsZS5leHBvcnRzID0gQmFja2JvbmUuVmlldy5leHRlbmRcbiAgaW5pdGlhbGl6ZTogLT5cbiAgICBAY29udGVudHMgPSBAb3B0aW9ucy5jb250ZW50c1xuICAgIEByZW5kZXIoKVxuXG4gIGV2ZW50czogXG4gICAgJ2NsaWNrICNzYXZlX2J1dHRvbic6ICdzYXZlJ1xuICAgICdjbGljayAjY2FuY2VsX2J1dHRvbic6ICdjYW5jZWwnXG5cbiAgdmFsaWRhdGU6IC0+XG4gICAgIyBHZXQgYWxsIHZpc2libGUgaXRlbXNcbiAgICBpdGVtcyA9IF8uZmlsdGVyKEBjb250ZW50cywgKGMpIC0+XG4gICAgICBjLnZpc2libGUgYW5kIGMudmFsaWRhdGVcbiAgICApXG4gICAgcmV0dXJuIG5vdCBfLmFueShfLm1hcChpdGVtcywgKGl0ZW0pIC0+XG4gICAgICBpdGVtLnZhbGlkYXRlKClcbiAgICApKVxuXG4gIHJlbmRlcjogLT5cbiAgICBAJGVsLmh0bWwgJycnPGRpdiBpZD1cImNvbnRlbnRzXCI+PC9kaXY+XG4gICAgPGRpdj5cbiAgICAgICAgPGJ1dHRvbiBpZD1cInNhdmVfYnV0dG9uXCIgdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwiYnRuIGJ0bi1wcmltYXJ5IG1hcmdpbmVkXCI+U2F2ZTwvYnV0dG9uPlxuICAgICAgICAmbmJzcDtcbiAgICAgICAgPGJ1dHRvbiBpZD1cImNhbmNlbF9idXR0b25cIiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJidG4gbWFyZ2luZWRcIj5DYW5jZWw8L2J1dHRvbj5cbiAgICA8L2Rpdj4nJydcbiAgICBcbiAgICAjIEFkZCBjb250ZW50cyAocXVlc3Rpb25zLCBtb3N0bHkpXG4gICAgXy5lYWNoIEBjb250ZW50cywgKGMpID0+IEAkKCcjY29udGVudHMnKS5hcHBlbmQgYy4kZWxcbiAgICB0aGlzXG5cbiAgc2F2ZTogLT5cbiAgICBpZiBAdmFsaWRhdGUoKVxuICAgICAgQHRyaWdnZXIgJ3NhdmUnXG5cbiAgY2FuY2VsOiAtPlxuICAgIEB0cmlnZ2VyICdjYW5jZWwnXG4iLCJtb2R1bGUuZXhwb3J0cyA9IEJhY2tib25lLlZpZXcuZXh0ZW5kXG4gIGluaXRpYWxpemU6IC0+XG4gICAgQCRlbC5odG1sIF8udGVtcGxhdGUoJycnXG4gICAgICA8ZGl2IGNsYXNzPVwid2VsbCB3ZWxsLXNtYWxsXCI+PCU9aHRtbCU+PCUtdGV4dCU+PC9kaXY+XG4gICAgICAnJycpKGh0bWw6IEBvcHRpb25zLmh0bWwsIHRleHQ6IEBvcHRpb25zLnRleHQpXG4iLCIjIFRPRE8gRml4IHRvIGhhdmUgZWRpdGFibGUgWVlZWS1NTS1ERCB3aXRoIGNsaWNrIHRvIHBvcHVwIHNjcm9sbGVyXG5cblF1ZXN0aW9uID0gcmVxdWlyZSgnLi9mb3JtLWNvbnRyb2xzJykuUXVlc3Rpb25cblxubW9kdWxlLmV4cG9ydHMgPSBRdWVzdGlvbi5leHRlbmQoXG4gIGV2ZW50czpcbiAgICBjaGFuZ2U6IFwiY2hhbmdlZFwiXG5cbiAgY2hhbmdlZDogLT5cbiAgICBAbW9kZWwuc2V0IEBpZCwgQCRlbC5maW5kKFwiaW5wdXRbbmFtZT1cXFwiZGF0ZVxcXCJdXCIpLnZhbCgpXG5cbiAgcmVuZGVyQW5zd2VyOiAoYW5zd2VyRWwpIC0+XG4gICAgYW5zd2VyRWwuaHRtbCBfLnRlbXBsYXRlKFwiPGlucHV0IGNsYXNzPVxcXCJuZWVkc2NsaWNrXFxcIiBuYW1lPVxcXCJkYXRlXFxcIiAvPlwiLCB0aGlzKVxuICAgIGFuc3dlckVsLmZpbmQoXCJpbnB1dFwiKS52YWwgQG1vZGVsLmdldChAaWQpXG4gICAgYW5zd2VyRWwuZmluZChcImlucHV0XCIpLnNjcm9sbGVyXG4gICAgICBwcmVzZXQ6IFwiZGF0ZVwiXG4gICAgICB0aGVtZTogXCJpb3NcIlxuICAgICAgZGlzcGxheTogXCJtb2RhbFwiXG4gICAgICBtb2RlOiBcInNjcm9sbGVyXCJcbiAgICAgIGRhdGVPcmRlcjogXCJ5eW1tRCBkZFwiXG4gICAgICBkYXRlRm9ybWF0OiBcInl5LW1tLWRkXCJcblxuKSIsIlF1ZXN0aW9uID0gcmVxdWlyZSgnLi9mb3JtLWNvbnRyb2xzJykuUXVlc3Rpb25cblxubW9kdWxlLmV4cG9ydHMgPSBRdWVzdGlvbi5leHRlbmQoXG4gIGV2ZW50czpcbiAgICBjaGFuZ2U6IFwiY2hhbmdlZFwiXG5cbiAgc2V0T3B0aW9uczogKG9wdGlvbnMpIC0+XG4gICAgQG9wdGlvbnMub3B0aW9ucyA9IG9wdGlvbnNcbiAgICBAcmVuZGVyKClcblxuICBjaGFuZ2VkOiAoZSkgLT5cbiAgICB2YWwgPSAkKGUudGFyZ2V0KS52YWwoKVxuICAgIGlmIHZhbCBpcyBcIlwiXG4gICAgICBAbW9kZWwuc2V0IEBpZCwgbnVsbFxuICAgIGVsc2VcbiAgICAgIGluZGV4ID0gcGFyc2VJbnQodmFsKVxuICAgICAgdmFsdWUgPSBAb3B0aW9ucy5vcHRpb25zW2luZGV4XVswXVxuICAgICAgQG1vZGVsLnNldCBAaWQsIHZhbHVlXG5cbiAgcmVuZGVyQW5zd2VyOiAoYW5zd2VyRWwpIC0+XG4gICAgYW5zd2VyRWwuaHRtbCBfLnRlbXBsYXRlKFwiPHNlbGVjdCBpZD1cXFwic291cmNlX3R5cGVcXFwiPjwlPXJlbmRlckRyb3Bkb3duT3B0aW9ucygpJT48L3NlbGVjdD5cIiwgdGhpcylcbiAgICAjIENoZWNrIGlmIGFuc3dlciBwcmVzZW50IFxuICAgIGlmIG5vdCBfLmFueShAb3B0aW9ucy5vcHRpb25zLCAob3B0KSA9PiBvcHRbMF0gPT0gQG1vZGVsLmdldChAaWQpKSBhbmQgQG1vZGVsLmdldChAaWQpP1xuICAgICAgQCQoXCJzZWxlY3RcIikuYXR0cignZGlzYWJsZWQnLCAnZGlzYWJsZWQnKVxuXG4gIHJlbmRlckRyb3Bkb3duT3B0aW9uczogLT5cbiAgICBodG1sID0gXCJcIlxuICAgIFxuICAgICMgQWRkIGVtcHR5IG9wdGlvblxuICAgIGh0bWwgKz0gXCI8b3B0aW9uIHZhbHVlPVxcXCJcXFwiPjwvb3B0aW9uPlwiXG4gICAgZm9yIGkgaW4gWzAuLi5Ab3B0aW9ucy5vcHRpb25zLmxlbmd0aF1cbiAgICAgIGh0bWwgKz0gXy50ZW1wbGF0ZShcIjxvcHRpb24gdmFsdWU9XFxcIjwlPXBvc2l0aW9uJT5cXFwiIDwlPXNlbGVjdGVkJT4+PCUtdGV4dCU+PC9vcHRpb24+XCIsXG4gICAgICAgIHBvc2l0aW9uOiBpXG4gICAgICAgIHRleHQ6IEBvcHRpb25zLm9wdGlvbnNbaV1bMV1cbiAgICAgICAgc2VsZWN0ZWQ6IChpZiBAbW9kZWwuZ2V0KEBpZCkgaXMgQG9wdGlvbnMub3B0aW9uc1tpXVswXSB0aGVuIFwic2VsZWN0ZWQ9XFxcInNlbGVjdGVkXFxcIlwiIGVsc2UgXCJcIilcbiAgICAgIClcbiAgICByZXR1cm4gaHRtbFxuKSIsIlF1ZXN0aW9uID0gcmVxdWlyZSgnLi9mb3JtLWNvbnRyb2xzJykuUXVlc3Rpb25cblxubW9kdWxlLmV4cG9ydHMgPSBRdWVzdGlvbi5leHRlbmRcbiAgcmVuZGVyQW5zd2VyOiAoYW5zd2VyRWwpIC0+XG4gICAgYW5zd2VyRWwuaHRtbCBfLnRlbXBsYXRlKFwiPGlucHV0IHR5cGU9XFxcIm51bWJlclxcXCIgPCUgaWYgKG9wdGlvbnMuZGVjaW1hbCkgeyU+c3RlcD1cXFwiYW55XFxcIjwlfSU+IC8+XCIsIHRoaXMpXG4gICAgYW5zd2VyRWwuZmluZChcImlucHV0XCIpLnZhbCBAbW9kZWwuZ2V0KEBpZClcblxuICBldmVudHM6XG4gICAgY2hhbmdlOiBcImNoYW5nZWRcIlxuXG4gIHZhbGlkYXRlSW50ZXJuYWw6IC0+XG4gICAgdmFsID0gQCQoXCJpbnB1dFwiKS52YWwoKVxuICAgIGlmIEBvcHRpb25zLmRlY2ltYWwgYW5kIHZhbC5sZW5ndGggPiAwXG4gICAgICBpZiBwYXJzZUZsb2F0KHZhbCkgPT0gTmFOXG4gICAgICAgIHJldHVybiBcIkludmFsaWQgZGVjaW1hbCBudW1iZXJcIlxuICAgIGVsc2UgaWYgdmFsLmxlbmd0aCA+IDBcbiAgICAgIGlmIG5vdCB2YWwubWF0Y2goL14tP1xcZCskLylcbiAgICAgICAgcmV0dXJuIFwiSW52YWxpZCBpbnRlZ2VyIG51bWJlclwiXG4gICAgcmV0dXJuIG51bGxcblxuICBjaGFuZ2VkOiAtPlxuICAgIHZhbCA9IHBhcnNlRmxvYXQoQCQoXCJpbnB1dFwiKS52YWwoKSlcbiAgICBpZiB2YWwgPT0gTmFOXG4gICAgICB2YWwgPSBudWxsXG4gICAgQG1vZGVsLnNldCBAaWQsIHZhbCBcbiIsIlF1ZXN0aW9uID0gcmVxdWlyZSgnLi9mb3JtLWNvbnRyb2xzJykuUXVlc3Rpb25cblxubW9kdWxlLmV4cG9ydHMgPSBRdWVzdGlvbi5leHRlbmRcbiAgZXZlbnRzOlxuICAgIFwiY2xpY2sgI2NhbWVyYVwiOiBcImNhbWVyYUNsaWNrXCJcbiAgICBcImNsaWNrIC50aHVtYm5haWxcIjogXCJ0aHVtYm5haWxDbGlja1wiXG5cbiAgcmVuZGVyQW5zd2VyOiAoYW5zd2VyRWwpIC0+XG4gICAgIyBSZW5kZXIgaW1hZ2UgdXNpbmcgaW1hZ2UgbWFuYWdlclxuICAgIGlmIG5vdCBAY3R4LmltYWdlTWFuYWdlclxuICAgICAgYW5zd2VyRWwuaHRtbCAnJyc8ZGl2IGNsYXNzPVwidGV4dC1lcnJvclwiPkltYWdlcyBub3QgYXZhaWxhYmxlPC9kaXY+JycnXG4gICAgZWxzZVxuICAgICAgaW1hZ2VVaWQgPSBAbW9kZWwuZ2V0KEBpZClcblxuICAgICAgIyBJZiBub25lLCBzaG93IGNhbWVyYVxuICAgICAgaWYgbm90IGltYWdlVWlkXG4gICAgICAgIGFuc3dlckVsLmh0bWwgJycnXG4gICAgICAgICAgPGltZyBzcmM9XCJpbWcvY2FtZXJhLWljb24uanBnXCIgaWQ9XCJjYW1lcmFcIiBjbGFzcz1cImltZy1yb3VuZGVkXCIgc3R5bGU9XCJtYXgtaGVpZ2h0OiAxMDBweFwiLz5cbiAgICAgICAgJycnXG4gICAgICBlbHNlXG4gICAgICAgICMgUmVuZGVyIGltYWdlXG4gICAgICAgIGFuc3dlckVsLmh0bWwgXy50ZW1wbGF0ZSgnJydcbiAgICAgICAgICA8aW1nIGlkPVwiPCU9aW1hZ2VVaWQlPlwiIGNsYXNzPVwiaW1nLXJvdW5kZWQgdGh1bWJuYWlsXCIgc3R5bGU9XCJtYXgtaGVpZ2h0OiAxMDBweFwiIG9uRXJyb3I9XCJ0aGlzLm9uZXJyb3I9bnVsbDt0aGlzLnNyYz0naW1nL25vLWltYWdlLWljb24uanBnJztcIiAvPlxuICAgICAgICAnJycsIHsgaW1hZ2VVaWQ6IGltYWdlVWlkIH0pXG5cbiAgICAgICAgIyBTZXQgc291cmNlXG4gICAgICAgIHN1Y2Nlc3MgPSAodXJsKSA9PlxuICAgICAgICAgIEAkKFwiI1wiK2ltYWdlVWlkKS5hdHRyKFwic3JjXCIsIHVybClcbiAgICAgICAgQGN0eC5pbWFnZU1hbmFnZXIuZ2V0SW1hZ2VUaHVtYm5haWxVcmwgaW1hZ2VVaWQsIHN1Y2Nlc3MsIEBlcnJvclxuXG4gIGNhbWVyYUNsaWNrOiAtPlxuICAgIGFsZXJ0KFwiT24gQW5kcm9pZCBBcHAsIHdvdWxkIGxhdW5jaCBDYW1lcmErUGhvdG8gVmlld2VyXCIpXG5cbiAgdGh1bWJuYWlsQ2xpY2s6ID0+XG4gICAgQHBhZ2VyLm9wZW5QYWdlKEltYWdlUGFnZSwgeyB1aWQ6IGV2LmN1cnJlbnRUYXJnZXQuaWQgfSkiLCJRdWVzdGlvbiA9IHJlcXVpcmUoJy4vZm9ybS1jb250cm9scycpLlF1ZXN0aW9uXG5Tb3VyY2VMaXN0UGFnZSA9IHJlcXVpcmUgJy4uL3BhZ2VzL1NvdXJjZUxpc3RQYWdlJ1xuXG5tb2R1bGUuZXhwb3J0cyA9IFF1ZXN0aW9uLmV4dGVuZFxuICByZW5kZXJBbnN3ZXI6IChhbnN3ZXJFbCkgLT5cbiAgICBhbnN3ZXJFbC5odG1sICcnJ1xuICAgICAgPGRpdiBjbGFzcz1cImlucHV0LWFwcGVuZFwiPlxuICAgICAgICA8aW5wdXQgdHlwZT1cInRlbFwiPlxuICAgICAgICA8YnV0dG9uIGNsYXNzPVwiYnRuXCIgaWQ9XCJzZWxlY3RcIiB0eXBlPVwiYnV0dG9uXCI+U2VsZWN0PC9idXR0b24+XG4gICAgICA8L2Rpdj4nJydcbiAgICBhbnN3ZXJFbC5maW5kKFwiaW5wdXRcIikudmFsIEBtb2RlbC5nZXQoQGlkKVxuXG4gIGV2ZW50czpcbiAgICAnY2hhbmdlJyA6ICdjaGFuZ2VkJ1xuICAgICdjbGljayAjc2VsZWN0JyA6ICdzZWxlY3RTb3VyY2UnXG5cbiAgY2hhbmdlZDogLT5cbiAgICBAbW9kZWwuc2V0IEBpZCwgQCQoXCJpbnB1dFwiKS52YWwoKVxuXG4gIHNlbGVjdFNvdXJjZTogLT5cbiAgICBAY3R4LnBhZ2VyLm9wZW5QYWdlIFNvdXJjZUxpc3RQYWdlLCBcbiAgICAgIHsgb25TZWxlY3Q6IChzb3VyY2UpPT5cbiAgICAgICAgQG1vZGVsLnNldCBAaWQsIHNvdXJjZS5jb2RlXG4gICAgICB9IiwiUXVlc3Rpb24gPSByZXF1aXJlKCcuL2Zvcm0tY29udHJvbHMnKS5RdWVzdGlvblxuSW1hZ2VQYWdlID0gcmVxdWlyZSAnLi4vcGFnZXMvSW1hZ2VQYWdlJ1xuXG4jIFRPRE8gcmVuYW1lIGltYWdlc3F1ZXN0aW9uXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFBob3Rvc1F1ZXN0aW9uIGV4dGVuZHMgUXVlc3Rpb25cbiAgZXZlbnRzOlxuICAgIFwiY2xpY2sgI2NhbWVyYVwiOiBcImNhbWVyYUNsaWNrXCJcbiAgICBcImNsaWNrIC50aHVtYm5haWxcIjogXCJ0aHVtYm5haWxDbGlja1wiXG5cbiAgcmVuZGVyQW5zd2VyOiAoYW5zd2VyRWwpIC0+XG4gICAgIyBSZW5kZXIgaW1hZ2UgdXNpbmcgaW1hZ2UgbWFuYWdlclxuICAgIGlmIG5vdCBAY3R4LmltYWdlTWFuYWdlclxuICAgICAgYW5zd2VyRWwuaHRtbCAnJyc8ZGl2IGNsYXNzPVwidGV4dC1lcnJvclwiPkltYWdlcyBub3QgYXZhaWxhYmxlPC9kaXY+JycnXG4gICAgZWxzZVxuICAgICAgaW1hZ2VzID0gQG1vZGVsLmdldChAaWQpXG5cbiAgICAgICMgUmVuZGVyIGltYWdlc1xuICAgICAgYW5zd2VyRWwuaHRtbCB0ZW1wbGF0ZXNbJ2Zvcm1zL1Bob3Rvc1F1ZXN0aW9uJ10oaW1hZ2VzOiBpbWFnZXMpXG5cbiAgICAgICMgU2V0IHNvdXJjZXNcbiAgICAgIGlmIGltYWdlc1xuICAgICAgICBmb3IgaW1hZ2UgaW4gaW1hZ2VzXG4gICAgICAgICAgQHNldFRodW1ibmFpbFVybChpbWFnZS5pZClcbiAgICBcbiAgc2V0VGh1bWJuYWlsVXJsOiAoaWQpIC0+XG4gICAgc3VjY2VzcyA9ICh1cmwpID0+XG4gICAgICBAJChcIiNcIiArIGlkKS5hdHRyKFwic3JjXCIsIHVybClcbiAgICBAY3R4LmltYWdlTWFuYWdlci5nZXRJbWFnZVRodW1ibmFpbFVybCBpZCwgc3VjY2VzcywgQGVycm9yXG5cbiAgY2FtZXJhQ2xpY2s6IC0+XG4gICAgYWxlcnQoXCJJbiBBbmRyb2lkIEFwcCwgQ2FtZXJhIHdvdWxkIG9wZW5cIikgICMgVE9ET1xuXG4gIHRodW1ibmFpbENsaWNrOiAoZXYpIC0+XG4gICAgQGN0eC5wYWdlci5vcGVuUGFnZShJbWFnZVBhZ2UsIHsgaWQ6IGV2LmN1cnJlbnRUYXJnZXQuaWQgfSkiLCIjIEltcHJvdmVkIGxvY2F0aW9uIGZpbmRlclxuY2xhc3MgTG9jYXRpb25GaW5kZXJcbiAgY29uc3RydWN0b3I6IC0+XG4gICAgXy5leHRlbmQgQCwgQmFja2JvbmUuRXZlbnRzXG4gICAgXG4gIGdldExvY2F0aW9uOiAtPlxuICAgICMgQm90aCBmYWlsdXJlcyBhcmUgcmVxdWlyZWQgdG8gdHJpZ2dlciBlcnJvclxuICAgIGxvY2F0aW9uRXJyb3IgPSBfLmFmdGVyIDIsID0+XG4gICAgICBAdHJpZ2dlciAnZXJyb3InXG5cbiAgICBoaWdoQWNjdXJhY3lGaXJlZCA9IGZhbHNlXG5cbiAgICBsb3dBY2N1cmFjeSA9IChwb3MpID0+XG4gICAgICBpZiBub3QgaGlnaEFjY3VyYWN5RmlyZWRcbiAgICAgICAgQHRyaWdnZXIgJ2ZvdW5kJywgcG9zXG5cbiAgICBoaWdoQWNjdXJhY3kgPSAocG9zKSA9PlxuICAgICAgaGlnaEFjY3VyYWN5RmlyZWQgPSB0cnVlXG4gICAgICBAdHJpZ2dlciAnZm91bmQnLCBwb3NcblxuICAgICMgR2V0IGJvdGggaGlnaCBhbmQgbG93IGFjY3VyYWN5LCBhcyBsb3cgaXMgc3VmZmljaWVudCBmb3IgaW5pdGlhbCBkaXNwbGF5XG4gICAgbmF2aWdhdG9yLmdlb2xvY2F0aW9uLmdldEN1cnJlbnRQb3NpdGlvbihsb3dBY2N1cmFjeSwgbG9jYXRpb25FcnJvciwge1xuICAgICAgICBtYXhpbXVtQWdlIDogMzYwMCoyNCxcbiAgICAgICAgdGltZW91dCA6IDEwMDAwLFxuICAgICAgICBlbmFibGVIaWdoQWNjdXJhY3kgOiBmYWxzZVxuICAgIH0pXG5cbiAgICBuYXZpZ2F0b3IuZ2VvbG9jYXRpb24uZ2V0Q3VycmVudFBvc2l0aW9uKGhpZ2hBY2N1cmFjeSwgbG9jYXRpb25FcnJvciwge1xuICAgICAgICBtYXhpbXVtQWdlIDogMzYwMCxcbiAgICAgICAgdGltZW91dCA6IDMwMDAwLFxuICAgICAgICBlbmFibGVIaWdoQWNjdXJhY3kgOiB0cnVlXG4gICAgfSlcblxuICBzdGFydFdhdGNoOiAtPlxuICAgICMgQWxsb3cgb25lIHdhdGNoIGF0IG1vc3RcbiAgICBpZiBAbG9jYXRpb25XYXRjaElkP1xuICAgICAgQHN0b3BXYXRjaCgpXG5cbiAgICBoaWdoQWNjdXJhY3lGaXJlZCA9IGZhbHNlXG4gICAgbG93QWNjdXJhY3lGaXJlZCA9IGZhbHNlXG5cbiAgICBsb3dBY2N1cmFjeSA9IChwb3MpID0+XG4gICAgICBpZiBub3QgaGlnaEFjY3VyYWN5RmlyZWRcbiAgICAgICAgbG93QWNjdXJhY3lGaXJlZCA9IHRydWVcbiAgICAgICAgQHRyaWdnZXIgJ2ZvdW5kJywgcG9zXG5cbiAgICBoaWdoQWNjdXJhY3kgPSAocG9zKSA9PlxuICAgICAgaGlnaEFjY3VyYWN5RmlyZWQgPSB0cnVlXG4gICAgICBAdHJpZ2dlciAnZm91bmQnLCBwb3NcblxuICAgIGVycm9yID0gKGVycm9yKSA9PlxuICAgICAgY29uc29sZS5sb2cgXCIjIyMgZXJyb3IgXCJcbiAgICAgICMgTm8gZXJyb3IgaWYgZmlyZWQgb25jZVxuICAgICAgaWYgbm90IGxvd0FjY3VyYWN5RmlyZWQgYW5kIG5vdCBoaWdoQWNjdXJhY3lGaXJlZFxuICAgICAgICBAdHJpZ2dlciAnZXJyb3InLCBlcnJvclxuXG4gICAgIyBGaXJlIGluaXRpYWwgbG93LWFjY3VyYWN5IG9uZVxuICAgIG5hdmlnYXRvci5nZW9sb2NhdGlvbi5nZXRDdXJyZW50UG9zaXRpb24obG93QWNjdXJhY3ksIGVycm9yLCB7XG4gICAgICAgIG1heGltdW1BZ2UgOiAzNjAwKjI0LFxuICAgICAgICB0aW1lb3V0IDogMTAwMDAsXG4gICAgICAgIGVuYWJsZUhpZ2hBY2N1cmFjeSA6IGZhbHNlXG4gICAgfSlcblxuICAgIEBsb2NhdGlvbldhdGNoSWQgPSBuYXZpZ2F0b3IuZ2VvbG9jYXRpb24ud2F0Y2hQb3NpdGlvbihoaWdoQWNjdXJhY3ksIGVycm9yLCB7XG4gICAgICAgIG1heGltdW1BZ2UgOiAzMDAwLFxuICAgICAgICBlbmFibGVIaWdoQWNjdXJhY3kgOiB0cnVlXG4gICAgfSkgIFxuXG4gIHN0b3BXYXRjaDogLT5cbiAgICBpZiBAbG9jYXRpb25XYXRjaElkP1xuICAgICAgbmF2aWdhdG9yLmdlb2xvY2F0aW9uLmNsZWFyV2F0Y2goQGxvY2F0aW9uV2F0Y2hJZClcbiAgICAgIEBsb2NhdGlvbldhdGNoSWQgPSB1bmRlZmluZWRcblxuXG5tb2R1bGUuZXhwb3J0cyA9IExvY2F0aW9uRmluZGVyICAiLCJjbGFzcyBQYWdlIGV4dGVuZHMgQmFja2JvbmUuVmlld1xuICBjb25zdHJ1Y3RvcjogKGN0eCwgb3B0aW9ucz17fSkgLT5cbiAgICBzdXBlcihvcHRpb25zKVxuICAgIEBjdHggPSBjdHhcblxuICAgICMgTWl4IGluIGNvbnRleHQgZm9yIGNvbnZlbmllbmNlXG4gICAgXy5leHRlbmQoQCwgY3R4KSBcblxuICAgICMgU3RvcmUgc3Vidmlld3NcbiAgICBAX3N1YnZpZXdzID0gW11cblxuICAgICMgU2V0dXAgZGVmYXVsdCBidXR0b24gYmFyXG4gICAgQGJ1dHRvbkJhciA9IG5ldyBCdXR0b25CYXIoKVxuXG4gICAgIyBTZXR1cCBkZWZhdWx0IGNvbnRleHQgbWVudVxuICAgIEBjb250ZXh0TWVudSA9IG5ldyBDb250ZXh0TWVudSgpXG5cbiAgY2xhc3NOYW1lOiBcInBhZ2VcIlxuICBjcmVhdGU6IC0+XG4gIGFjdGl2YXRlOiAtPlxuICBkZWFjdGl2YXRlOiAtPlxuICBkZXN0cm95OiAtPlxuICByZW1vdmU6IC0+XG4gICAgQHJlbW92ZVN1YnZpZXdzKClcbiAgICBzdXBlcigpXG5cbiAgZ2V0VGl0bGU6IC0+IEB0aXRsZVxuXG4gIHNldFRpdGxlOiAodGl0bGUpIC0+XG4gICAgQHRpdGxlID0gdGl0bGVcbiAgICBAdHJpZ2dlciAnY2hhbmdlOnRpdGxlJ1xuXG4gIGFkZFN1YnZpZXc6ICh2aWV3KSAtPlxuICAgIEBfc3Vidmlld3MucHVzaCh2aWV3KVxuXG4gIHJlbW92ZVN1YnZpZXdzOiAtPlxuICAgIGZvciBzdWJ2aWV3IGluIEBfc3Vidmlld3NcbiAgICAgIHN1YnZpZXcucmVtb3ZlKClcblxuICBnZXRCdXR0b25CYXI6IC0+XG4gICAgcmV0dXJuIEBidXR0b25CYXJcblxuICBnZXRDb250ZXh0TWVudTogLT5cbiAgICByZXR1cm4gQGNvbnRleHRNZW51XG5cbiAgc2V0dXBCdXR0b25CYXI6IChpdGVtcykgLT5cbiAgICAjIFNldHVwIGJ1dHRvbiBiYXJcbiAgICBAYnV0dG9uQmFyLnNldHVwKGl0ZW1zKVxuXG4gIHNldHVwQ29udGV4dE1lbnU6IChpdGVtcykgLT5cbiAgICAjIFNldHVwIGNvbnRleHQgbWVudVxuICAgIEBjb250ZXh0TWVudS5zZXR1cChpdGVtcylcblxuIyBTdGFuZGFyZCBidXR0b24gYmFyLiBFYWNoIGl0ZW1cbiMgaGFzIG9wdGlvbmFsIFwidGV4dFwiLCBvcHRpb25hbCBcImljb25cIiBhbmQgXCJjbGlja1wiIChhY3Rpb24pLlxuIyBGb3Igc3VibWVudSwgYWRkIGFycmF5IHRvIFwibWVudVwiLiBPbmUgbGV2ZWwgbmVzdGluZyBvbmx5LlxuY2xhc3MgQnV0dG9uQmFyIGV4dGVuZHMgQmFja2JvbmUuVmlld1xuICBldmVudHM6IFxuICAgIFwiY2xpY2sgLm1lbnVpdGVtXCIgOiBcImNsaWNrTWVudUl0ZW1cIlxuXG4gIHNldHVwOiAoaXRlbXMpIC0+XG4gICAgQGl0ZW1zID0gaXRlbXNcbiAgICBAaXRlbU1hcCA9IHt9XG5cbiAgICAjIEFkZCBpZCB0byBhbGwgaXRlbXMgaWYgbm90IHByZXNlbnRcbiAgICBpZCA9IDFcbiAgICBmb3IgaXRlbSBpbiBpdGVtc1xuICAgICAgaWYgbm90IGl0ZW0uaWQ/XG4gICAgICAgIGl0ZW0uaWQgPSBpZFxuICAgICAgICBpZD1pZCsxXG4gICAgICBAaXRlbU1hcFtpdGVtLmlkXSA9IGl0ZW1cblxuICAgICAgIyBBZGQgdG8gc3VibWVudVxuICAgICAgaWYgaXRlbS5tZW51XG4gICAgICAgIGZvciBzdWJpdGVtIGluIGl0ZW0ubWVudVxuICAgICAgICAgIGlmIG5vdCBzdWJpdGVtLmlkP1xuICAgICAgICAgICAgc3ViaXRlbS5pZCA9IGlkLnRvU3RyaW5nKClcbiAgICAgICAgICAgIGlkPWlkKzFcbiAgICAgICAgICBAaXRlbU1hcFtzdWJpdGVtLmlkXSA9IHN1Yml0ZW1cblxuICAgIEByZW5kZXIoKVxuXG4gIHJlbmRlcjogLT5cbiAgICBAJGVsLmh0bWwgdGVtcGxhdGVzWydCdXR0b25CYXInXShpdGVtczogQGl0ZW1zKVxuXG4gIGNsaWNrTWVudUl0ZW06IChlKSAtPlxuICAgIGlkID0gZS5jdXJyZW50VGFyZ2V0LmlkXG4gICAgaXRlbSA9IEBpdGVtTWFwW2lkXVxuICAgIGlmIGl0ZW0uY2xpY2s/XG4gICAgICBpdGVtLmNsaWNrKClcblxuIyBDb250ZXh0IG1lbnUgdG8gZ28gaW4gc2xpZGUgbWVudVxuIyBTdGFuZGFyZCBidXR0b24gYmFyLiBFYWNoIGl0ZW0gXCJ0ZXh0XCIsIG9wdGlvbmFsIFwiZ2x5cGhcIiAoYm9vdHN0cmFwIGdseXBoIHdpdGhvdXQgaWNvbi0gcHJlZml4KSBhbmQgXCJjbGlja1wiIChhY3Rpb24pLlxuY2xhc3MgQ29udGV4dE1lbnUgZXh0ZW5kcyBCYWNrYm9uZS5WaWV3XG4gIGV2ZW50czogXG4gICAgXCJjbGljayAubWVudWl0ZW1cIiA6IFwiY2xpY2tNZW51SXRlbVwiXG5cbiAgc2V0dXA6IChpdGVtcykgLT5cbiAgICBAaXRlbXMgPSBpdGVtc1xuICAgIEBpdGVtTWFwID0ge31cblxuICAgICMgQWRkIGlkIHRvIGFsbCBpdGVtcyBpZiBub3QgcHJlc2VudFxuICAgIGlkID0gMVxuICAgIGZvciBpdGVtIGluIGl0ZW1zXG4gICAgICBpZiBub3QgaXRlbS5pZD9cbiAgICAgICAgaXRlbS5pZCA9IGlkXG4gICAgICAgIGlkPWlkKzFcbiAgICAgIEBpdGVtTWFwW2l0ZW0uaWRdID0gaXRlbVxuXG4gICAgQHJlbmRlcigpXG5cbiAgcmVuZGVyOiAtPlxuICAgIEAkZWwuaHRtbCB0ZW1wbGF0ZXNbJ0NvbnRleHRNZW51J10oaXRlbXM6IEBpdGVtcylcblxuICBjbGlja01lbnVJdGVtOiAoZSkgLT5cbiAgICBpZCA9IGUuY3VycmVudFRhcmdldC5pZFxuICAgIGl0ZW0gPSBAaXRlbU1hcFtpZF1cbiAgICBpZiBpdGVtLmNsaWNrP1xuICAgICAgaXRlbS5jbGljaygpXG5cbm1vZHVsZS5leHBvcnRzID0gUGFnZSIsIi8vIFRPRE8gYWRkIGxpY2Vuc2VcblxuTG9jYWxDb2xsZWN0aW9uID0ge307XG5FSlNPTiA9IHJlcXVpcmUoXCIuL0VKU09OXCIpO1xuXG4vLyBMaWtlIF8uaXNBcnJheSwgYnV0IGRvZXNuJ3QgcmVnYXJkIHBvbHlmaWxsZWQgVWludDhBcnJheXMgb24gb2xkIGJyb3dzZXJzIGFzXG4vLyBhcnJheXMuXG52YXIgaXNBcnJheSA9IGZ1bmN0aW9uICh4KSB7XG4gIHJldHVybiBfLmlzQXJyYXkoeCkgJiYgIUVKU09OLmlzQmluYXJ5KHgpO1xufTtcblxudmFyIF9hbnlJZkFycmF5ID0gZnVuY3Rpb24gKHgsIGYpIHtcbiAgaWYgKGlzQXJyYXkoeCkpXG4gICAgcmV0dXJuIF8uYW55KHgsIGYpO1xuICByZXR1cm4gZih4KTtcbn07XG5cbnZhciBfYW55SWZBcnJheVBsdXMgPSBmdW5jdGlvbiAoeCwgZikge1xuICBpZiAoZih4KSlcbiAgICByZXR1cm4gdHJ1ZTtcbiAgcmV0dXJuIGlzQXJyYXkoeCkgJiYgXy5hbnkoeCwgZik7XG59O1xuXG52YXIgaGFzT3BlcmF0b3JzID0gZnVuY3Rpb24odmFsdWVTZWxlY3Rvcikge1xuICB2YXIgdGhlc2VBcmVPcGVyYXRvcnMgPSB1bmRlZmluZWQ7XG4gIGZvciAodmFyIHNlbEtleSBpbiB2YWx1ZVNlbGVjdG9yKSB7XG4gICAgdmFyIHRoaXNJc09wZXJhdG9yID0gc2VsS2V5LnN1YnN0cigwLCAxKSA9PT0gJyQnO1xuICAgIGlmICh0aGVzZUFyZU9wZXJhdG9ycyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGVzZUFyZU9wZXJhdG9ycyA9IHRoaXNJc09wZXJhdG9yO1xuICAgIH0gZWxzZSBpZiAodGhlc2VBcmVPcGVyYXRvcnMgIT09IHRoaXNJc09wZXJhdG9yKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbmNvbnNpc3RlbnQgc2VsZWN0b3I6IFwiICsgdmFsdWVTZWxlY3Rvcik7XG4gICAgfVxuICB9XG4gIHJldHVybiAhIXRoZXNlQXJlT3BlcmF0b3JzOyAgLy8ge30gaGFzIG5vIG9wZXJhdG9yc1xufTtcblxudmFyIGNvbXBpbGVWYWx1ZVNlbGVjdG9yID0gZnVuY3Rpb24gKHZhbHVlU2VsZWN0b3IpIHtcbiAgaWYgKHZhbHVlU2VsZWN0b3IgPT0gbnVsbCkgeyAgLy8gdW5kZWZpbmVkIG9yIG51bGxcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICByZXR1cm4gX2FueUlmQXJyYXkodmFsdWUsIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiB4ID09IG51bGw7ICAvLyB1bmRlZmluZWQgb3IgbnVsbFxuICAgICAgfSk7XG4gICAgfTtcbiAgfVxuXG4gIC8vIFNlbGVjdG9yIGlzIGEgbm9uLW51bGwgcHJpbWl0aXZlIChhbmQgbm90IGFuIGFycmF5IG9yIFJlZ0V4cCBlaXRoZXIpLlxuICBpZiAoIV8uaXNPYmplY3QodmFsdWVTZWxlY3RvcikpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICByZXR1cm4gX2FueUlmQXJyYXkodmFsdWUsIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiB4ID09PSB2YWx1ZVNlbGVjdG9yO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfVxuXG4gIGlmICh2YWx1ZVNlbGVjdG9yIGluc3RhbmNlb2YgUmVnRXhwKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIHJldHVybiBfYW55SWZBcnJheSh2YWx1ZSwgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlU2VsZWN0b3IudGVzdCh4KTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH1cblxuICAvLyBBcnJheXMgbWF0Y2ggZWl0aGVyIGlkZW50aWNhbCBhcnJheXMgb3IgYXJyYXlzIHRoYXQgY29udGFpbiBpdCBhcyBhIHZhbHVlLlxuICBpZiAoaXNBcnJheSh2YWx1ZVNlbGVjdG9yKSkge1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIGlmICghaXNBcnJheSh2YWx1ZSkpXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIHJldHVybiBfYW55SWZBcnJheVBsdXModmFsdWUsIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiBMb2NhbENvbGxlY3Rpb24uX2YuX2VxdWFsKHZhbHVlU2VsZWN0b3IsIHgpO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfVxuXG4gIC8vIEl0J3MgYW4gb2JqZWN0LCBidXQgbm90IGFuIGFycmF5IG9yIHJlZ2V4cC5cbiAgaWYgKGhhc09wZXJhdG9ycyh2YWx1ZVNlbGVjdG9yKSkge1xuICAgIHZhciBvcGVyYXRvckZ1bmN0aW9ucyA9IFtdO1xuICAgIF8uZWFjaCh2YWx1ZVNlbGVjdG9yLCBmdW5jdGlvbiAob3BlcmFuZCwgb3BlcmF0b3IpIHtcbiAgICAgIGlmICghXy5oYXMoVkFMVUVfT1BFUkFUT1JTLCBvcGVyYXRvcikpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlVucmVjb2duaXplZCBvcGVyYXRvcjogXCIgKyBvcGVyYXRvcik7XG4gICAgICBvcGVyYXRvckZ1bmN0aW9ucy5wdXNoKFZBTFVFX09QRVJBVE9SU1tvcGVyYXRvcl0oXG4gICAgICAgIG9wZXJhbmQsIHZhbHVlU2VsZWN0b3IuJG9wdGlvbnMpKTtcbiAgICB9KTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICByZXR1cm4gXy5hbGwob3BlcmF0b3JGdW5jdGlvbnMsIGZ1bmN0aW9uIChmKSB7XG4gICAgICAgIHJldHVybiBmKHZhbHVlKTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH1cblxuICAvLyBJdCdzIGEgbGl0ZXJhbDsgY29tcGFyZSB2YWx1ZSAob3IgZWxlbWVudCBvZiB2YWx1ZSBhcnJheSkgZGlyZWN0bHkgdG8gdGhlXG4gIC8vIHNlbGVjdG9yLlxuICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgcmV0dXJuIF9hbnlJZkFycmF5KHZhbHVlLCBmdW5jdGlvbiAoeCkge1xuICAgICAgcmV0dXJuIExvY2FsQ29sbGVjdGlvbi5fZi5fZXF1YWwodmFsdWVTZWxlY3RvciwgeCk7XG4gICAgfSk7XG4gIH07XG59O1xuXG4vLyBYWFggY2FuIGZhY3RvciBvdXQgY29tbW9uIGxvZ2ljIGJlbG93XG52YXIgTE9HSUNBTF9PUEVSQVRPUlMgPSB7XG4gIFwiJGFuZFwiOiBmdW5jdGlvbihzdWJTZWxlY3Rvcikge1xuICAgIGlmICghaXNBcnJheShzdWJTZWxlY3RvcikgfHwgXy5pc0VtcHR5KHN1YlNlbGVjdG9yKSlcbiAgICAgIHRocm93IEVycm9yKFwiJGFuZC8kb3IvJG5vciBtdXN0IGJlIG5vbmVtcHR5IGFycmF5XCIpO1xuICAgIHZhciBzdWJTZWxlY3RvckZ1bmN0aW9ucyA9IF8ubWFwKFxuICAgICAgc3ViU2VsZWN0b3IsIGNvbXBpbGVEb2N1bWVudFNlbGVjdG9yKTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGRvYykge1xuICAgICAgcmV0dXJuIF8uYWxsKHN1YlNlbGVjdG9yRnVuY3Rpb25zLCBmdW5jdGlvbiAoZikge1xuICAgICAgICByZXR1cm4gZihkb2MpO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSxcblxuICBcIiRvclwiOiBmdW5jdGlvbihzdWJTZWxlY3Rvcikge1xuICAgIGlmICghaXNBcnJheShzdWJTZWxlY3RvcikgfHwgXy5pc0VtcHR5KHN1YlNlbGVjdG9yKSlcbiAgICAgIHRocm93IEVycm9yKFwiJGFuZC8kb3IvJG5vciBtdXN0IGJlIG5vbmVtcHR5IGFycmF5XCIpO1xuICAgIHZhciBzdWJTZWxlY3RvckZ1bmN0aW9ucyA9IF8ubWFwKFxuICAgICAgc3ViU2VsZWN0b3IsIGNvbXBpbGVEb2N1bWVudFNlbGVjdG9yKTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGRvYykge1xuICAgICAgcmV0dXJuIF8uYW55KHN1YlNlbGVjdG9yRnVuY3Rpb25zLCBmdW5jdGlvbiAoZikge1xuICAgICAgICByZXR1cm4gZihkb2MpO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSxcblxuICBcIiRub3JcIjogZnVuY3Rpb24oc3ViU2VsZWN0b3IpIHtcbiAgICBpZiAoIWlzQXJyYXkoc3ViU2VsZWN0b3IpIHx8IF8uaXNFbXB0eShzdWJTZWxlY3RvcikpXG4gICAgICB0aHJvdyBFcnJvcihcIiRhbmQvJG9yLyRub3IgbXVzdCBiZSBub25lbXB0eSBhcnJheVwiKTtcbiAgICB2YXIgc3ViU2VsZWN0b3JGdW5jdGlvbnMgPSBfLm1hcChcbiAgICAgIHN1YlNlbGVjdG9yLCBjb21waWxlRG9jdW1lbnRTZWxlY3Rvcik7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChkb2MpIHtcbiAgICAgIHJldHVybiBfLmFsbChzdWJTZWxlY3RvckZ1bmN0aW9ucywgZnVuY3Rpb24gKGYpIHtcbiAgICAgICAgcmV0dXJuICFmKGRvYyk7XG4gICAgICB9KTtcbiAgICB9O1xuICB9LFxuXG4gIFwiJHdoZXJlXCI6IGZ1bmN0aW9uKHNlbGVjdG9yVmFsdWUpIHtcbiAgICBpZiAoIShzZWxlY3RvclZhbHVlIGluc3RhbmNlb2YgRnVuY3Rpb24pKSB7XG4gICAgICBzZWxlY3RvclZhbHVlID0gRnVuY3Rpb24oXCJyZXR1cm4gXCIgKyBzZWxlY3RvclZhbHVlKTtcbiAgICB9XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChkb2MpIHtcbiAgICAgIHJldHVybiBzZWxlY3RvclZhbHVlLmNhbGwoZG9jKTtcbiAgICB9O1xuICB9XG59O1xuXG52YXIgVkFMVUVfT1BFUkFUT1JTID0ge1xuICBcIiRpblwiOiBmdW5jdGlvbiAob3BlcmFuZCkge1xuICAgIGlmICghaXNBcnJheShvcGVyYW5kKSlcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkFyZ3VtZW50IHRvICRpbiBtdXN0IGJlIGFycmF5XCIpO1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJldHVybiBfYW55SWZBcnJheVBsdXModmFsdWUsIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiBfLmFueShvcGVyYW5kLCBmdW5jdGlvbiAob3BlcmFuZEVsdCkge1xuICAgICAgICAgIHJldHVybiBMb2NhbENvbGxlY3Rpb24uX2YuX2VxdWFsKG9wZXJhbmRFbHQsIHgpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0sXG5cbiAgXCIkYWxsXCI6IGZ1bmN0aW9uIChvcGVyYW5kKSB7XG4gICAgaWYgKCFpc0FycmF5KG9wZXJhbmQpKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQXJndW1lbnQgdG8gJGFsbCBtdXN0IGJlIGFycmF5XCIpO1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIGlmICghaXNBcnJheSh2YWx1ZSkpXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIHJldHVybiBfLmFsbChvcGVyYW5kLCBmdW5jdGlvbiAob3BlcmFuZEVsdCkge1xuICAgICAgICByZXR1cm4gXy5hbnkodmFsdWUsIGZ1bmN0aW9uICh2YWx1ZUVsdCkge1xuICAgICAgICAgIHJldHVybiBMb2NhbENvbGxlY3Rpb24uX2YuX2VxdWFsKG9wZXJhbmRFbHQsIHZhbHVlRWx0KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9O1xuICB9LFxuXG4gIFwiJGx0XCI6IGZ1bmN0aW9uIChvcGVyYW5kKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgcmV0dXJuIF9hbnlJZkFycmF5KHZhbHVlLCBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4gTG9jYWxDb2xsZWN0aW9uLl9mLl9jbXAoeCwgb3BlcmFuZCkgPCAwO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSxcblxuICBcIiRsdGVcIjogZnVuY3Rpb24gKG9wZXJhbmQpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICByZXR1cm4gX2FueUlmQXJyYXkodmFsdWUsIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiBMb2NhbENvbGxlY3Rpb24uX2YuX2NtcCh4LCBvcGVyYW5kKSA8PSAwO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSxcblxuICBcIiRndFwiOiBmdW5jdGlvbiAob3BlcmFuZCkge1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJldHVybiBfYW55SWZBcnJheSh2YWx1ZSwgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIExvY2FsQ29sbGVjdGlvbi5fZi5fY21wKHgsIG9wZXJhbmQpID4gMDtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0sXG5cbiAgXCIkZ3RlXCI6IGZ1bmN0aW9uIChvcGVyYW5kKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgcmV0dXJuIF9hbnlJZkFycmF5KHZhbHVlLCBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4gTG9jYWxDb2xsZWN0aW9uLl9mLl9jbXAoeCwgb3BlcmFuZCkgPj0gMDtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0sXG5cbiAgXCIkbmVcIjogZnVuY3Rpb24gKG9wZXJhbmQpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICByZXR1cm4gISBfYW55SWZBcnJheVBsdXModmFsdWUsIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiBMb2NhbENvbGxlY3Rpb24uX2YuX2VxdWFsKHgsIG9wZXJhbmQpO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSxcblxuICBcIiRuaW5cIjogZnVuY3Rpb24gKG9wZXJhbmQpIHtcbiAgICBpZiAoIWlzQXJyYXkob3BlcmFuZCkpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJBcmd1bWVudCB0byAkbmluIG11c3QgYmUgYXJyYXlcIik7XG4gICAgdmFyIGluRnVuY3Rpb24gPSBWQUxVRV9PUEVSQVRPUlMuJGluKG9wZXJhbmQpO1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIC8vIEZpZWxkIGRvZXNuJ3QgZXhpc3QsIHNvIGl0J3Mgbm90LWluIG9wZXJhbmRcbiAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIHJldHVybiAhaW5GdW5jdGlvbih2YWx1ZSk7XG4gICAgfTtcbiAgfSxcblxuICBcIiRleGlzdHNcIjogZnVuY3Rpb24gKG9wZXJhbmQpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICByZXR1cm4gb3BlcmFuZCA9PT0gKHZhbHVlICE9PSB1bmRlZmluZWQpO1xuICAgIH07XG4gIH0sXG5cbiAgXCIkbW9kXCI6IGZ1bmN0aW9uIChvcGVyYW5kKSB7XG4gICAgdmFyIGRpdmlzb3IgPSBvcGVyYW5kWzBdLFxuICAgICAgICByZW1haW5kZXIgPSBvcGVyYW5kWzFdO1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJldHVybiBfYW55SWZBcnJheSh2YWx1ZSwgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIHggJSBkaXZpc29yID09PSByZW1haW5kZXI7XG4gICAgICB9KTtcbiAgICB9O1xuICB9LFxuXG4gIFwiJHNpemVcIjogZnVuY3Rpb24gKG9wZXJhbmQpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICByZXR1cm4gaXNBcnJheSh2YWx1ZSkgJiYgb3BlcmFuZCA9PT0gdmFsdWUubGVuZ3RoO1xuICAgIH07XG4gIH0sXG5cbiAgXCIkdHlwZVwiOiBmdW5jdGlvbiAob3BlcmFuZCkge1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIC8vIEEgbm9uZXhpc3RlbnQgZmllbGQgaXMgb2Ygbm8gdHlwZS5cbiAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAvLyBEZWZpbml0ZWx5IG5vdCBfYW55SWZBcnJheVBsdXM6ICR0eXBlOiA0IG9ubHkgbWF0Y2hlcyBhcnJheXMgdGhhdCBoYXZlXG4gICAgICAvLyBhcnJheXMgYXMgZWxlbWVudHMgYWNjb3JkaW5nIHRvIHRoZSBNb25nbyBkb2NzLlxuICAgICAgcmV0dXJuIF9hbnlJZkFycmF5KHZhbHVlLCBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4gTG9jYWxDb2xsZWN0aW9uLl9mLl90eXBlKHgpID09PSBvcGVyYW5kO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSxcblxuICBcIiRyZWdleFwiOiBmdW5jdGlvbiAob3BlcmFuZCwgb3B0aW9ucykge1xuICAgIGlmIChvcHRpb25zICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIC8vIE9wdGlvbnMgcGFzc2VkIGluICRvcHRpb25zIChldmVuIHRoZSBlbXB0eSBzdHJpbmcpIGFsd2F5cyBvdmVycmlkZXNcbiAgICAgIC8vIG9wdGlvbnMgaW4gdGhlIFJlZ0V4cCBvYmplY3QgaXRzZWxmLlxuXG4gICAgICAvLyBCZSBjbGVhciB0aGF0IHdlIG9ubHkgc3VwcG9ydCB0aGUgSlMtc3VwcG9ydGVkIG9wdGlvbnMsIG5vdCBleHRlbmRlZFxuICAgICAgLy8gb25lcyAoZWcsIE1vbmdvIHN1cHBvcnRzIHggYW5kIHMpLiBJZGVhbGx5IHdlIHdvdWxkIGltcGxlbWVudCB4IGFuZCBzXG4gICAgICAvLyBieSB0cmFuc2Zvcm1pbmcgdGhlIHJlZ2V4cCwgYnV0IG5vdCB0b2RheS4uLlxuICAgICAgaWYgKC9bXmdpbV0vLnRlc3Qob3B0aW9ucykpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIk9ubHkgdGhlIGksIG0sIGFuZCBnIHJlZ2V4cCBvcHRpb25zIGFyZSBzdXBwb3J0ZWRcIik7XG5cbiAgICAgIHZhciByZWdleFNvdXJjZSA9IG9wZXJhbmQgaW5zdGFuY2VvZiBSZWdFeHAgPyBvcGVyYW5kLnNvdXJjZSA6IG9wZXJhbmQ7XG4gICAgICBvcGVyYW5kID0gbmV3IFJlZ0V4cChyZWdleFNvdXJjZSwgb3B0aW9ucyk7XG4gICAgfSBlbHNlIGlmICghKG9wZXJhbmQgaW5zdGFuY2VvZiBSZWdFeHApKSB7XG4gICAgICBvcGVyYW5kID0gbmV3IFJlZ0V4cChvcGVyYW5kKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZClcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgcmV0dXJuIF9hbnlJZkFycmF5KHZhbHVlLCBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4gb3BlcmFuZC50ZXN0KHgpO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSxcblxuICBcIiRvcHRpb25zXCI6IGZ1bmN0aW9uIChvcGVyYW5kKSB7XG4gICAgLy8gZXZhbHVhdGlvbiBoYXBwZW5zIGF0IHRoZSAkcmVnZXggZnVuY3Rpb24gYWJvdmVcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7IHJldHVybiB0cnVlOyB9O1xuICB9LFxuXG4gIFwiJGVsZW1NYXRjaFwiOiBmdW5jdGlvbiAob3BlcmFuZCkge1xuICAgIHZhciBtYXRjaGVyID0gY29tcGlsZURvY3VtZW50U2VsZWN0b3Iob3BlcmFuZCk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgaWYgKCFpc0FycmF5KHZhbHVlKSlcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgcmV0dXJuIF8uYW55KHZhbHVlLCBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4gbWF0Y2hlcih4KTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0sXG5cbiAgXCIkbm90XCI6IGZ1bmN0aW9uIChvcGVyYW5kKSB7XG4gICAgdmFyIG1hdGNoZXIgPSBjb21waWxlVmFsdWVTZWxlY3RvcihvcGVyYW5kKTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICByZXR1cm4gIW1hdGNoZXIodmFsdWUpO1xuICAgIH07XG4gIH0sXG5cbiAgXCIkbmVhclwiOiBmdW5jdGlvbiAob3BlcmFuZCkge1xuICAgIC8vIEFsd2F5cyByZXR1cm5zIHRydWUuIE11c3QgYmUgaGFuZGxlZCBpbiBwb3N0LWZpbHRlci9zb3J0L2xpbWl0XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9LFxuXG4gIFwiJGdlb0ludGVyc2VjdHNcIjogZnVuY3Rpb24gKG9wZXJhbmQpIHtcbiAgICAvLyBBbHdheXMgcmV0dXJucyB0cnVlLiBNdXN0IGJlIGhhbmRsZWQgaW4gcG9zdC1maWx0ZXIvc29ydC9saW1pdFxuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuXG59O1xuXG4vLyBoZWxwZXJzIHVzZWQgYnkgY29tcGlsZWQgc2VsZWN0b3IgY29kZVxuTG9jYWxDb2xsZWN0aW9uLl9mID0ge1xuICAvLyBYWFggZm9yIF9hbGwgYW5kIF9pbiwgY29uc2lkZXIgYnVpbGRpbmcgJ2lucXVlcnknIGF0IGNvbXBpbGUgdGltZS4uXG5cbiAgX3R5cGU6IGZ1bmN0aW9uICh2KSB7XG4gICAgaWYgKHR5cGVvZiB2ID09PSBcIm51bWJlclwiKVxuICAgICAgcmV0dXJuIDE7XG4gICAgaWYgKHR5cGVvZiB2ID09PSBcInN0cmluZ1wiKVxuICAgICAgcmV0dXJuIDI7XG4gICAgaWYgKHR5cGVvZiB2ID09PSBcImJvb2xlYW5cIilcbiAgICAgIHJldHVybiA4O1xuICAgIGlmIChpc0FycmF5KHYpKVxuICAgICAgcmV0dXJuIDQ7XG4gICAgaWYgKHYgPT09IG51bGwpXG4gICAgICByZXR1cm4gMTA7XG4gICAgaWYgKHYgaW5zdGFuY2VvZiBSZWdFeHApXG4gICAgICByZXR1cm4gMTE7XG4gICAgaWYgKHR5cGVvZiB2ID09PSBcImZ1bmN0aW9uXCIpXG4gICAgICAvLyBub3RlIHRoYXQgdHlwZW9mKC94LykgPT09IFwiZnVuY3Rpb25cIlxuICAgICAgcmV0dXJuIDEzO1xuICAgIGlmICh2IGluc3RhbmNlb2YgRGF0ZSlcbiAgICAgIHJldHVybiA5O1xuICAgIGlmIChFSlNPTi5pc0JpbmFyeSh2KSlcbiAgICAgIHJldHVybiA1O1xuICAgIGlmICh2IGluc3RhbmNlb2YgTWV0ZW9yLkNvbGxlY3Rpb24uT2JqZWN0SUQpXG4gICAgICByZXR1cm4gNztcbiAgICByZXR1cm4gMzsgLy8gb2JqZWN0XG5cbiAgICAvLyBYWFggc3VwcG9ydCBzb21lL2FsbCBvZiB0aGVzZTpcbiAgICAvLyAxNCwgc3ltYm9sXG4gICAgLy8gMTUsIGphdmFzY3JpcHQgY29kZSB3aXRoIHNjb3BlXG4gICAgLy8gMTYsIDE4OiAzMi1iaXQvNjQtYml0IGludGVnZXJcbiAgICAvLyAxNywgdGltZXN0YW1wXG4gICAgLy8gMjU1LCBtaW5rZXlcbiAgICAvLyAxMjcsIG1heGtleVxuICB9LFxuXG4gIC8vIGRlZXAgZXF1YWxpdHkgdGVzdDogdXNlIGZvciBsaXRlcmFsIGRvY3VtZW50IGFuZCBhcnJheSBtYXRjaGVzXG4gIF9lcXVhbDogZnVuY3Rpb24gKGEsIGIpIHtcbiAgICByZXR1cm4gRUpTT04uZXF1YWxzKGEsIGIsIHtrZXlPcmRlclNlbnNpdGl2ZTogdHJ1ZX0pO1xuICB9LFxuXG4gIC8vIG1hcHMgYSB0eXBlIGNvZGUgdG8gYSB2YWx1ZSB0aGF0IGNhbiBiZSB1c2VkIHRvIHNvcnQgdmFsdWVzIG9mXG4gIC8vIGRpZmZlcmVudCB0eXBlc1xuICBfdHlwZW9yZGVyOiBmdW5jdGlvbiAodCkge1xuICAgIC8vIGh0dHA6Ly93d3cubW9uZ29kYi5vcmcvZGlzcGxheS9ET0NTL1doYXQraXMrdGhlK0NvbXBhcmUrT3JkZXIrZm9yK0JTT04rVHlwZXNcbiAgICAvLyBYWFggd2hhdCBpcyB0aGUgY29ycmVjdCBzb3J0IHBvc2l0aW9uIGZvciBKYXZhc2NyaXB0IGNvZGU/XG4gICAgLy8gKCcxMDAnIGluIHRoZSBtYXRyaXggYmVsb3cpXG4gICAgLy8gWFhYIG1pbmtleS9tYXhrZXlcbiAgICByZXR1cm4gWy0xLCAgLy8gKG5vdCBhIHR5cGUpXG4gICAgICAgICAgICAxLCAgIC8vIG51bWJlclxuICAgICAgICAgICAgMiwgICAvLyBzdHJpbmdcbiAgICAgICAgICAgIDMsICAgLy8gb2JqZWN0XG4gICAgICAgICAgICA0LCAgIC8vIGFycmF5XG4gICAgICAgICAgICA1LCAgIC8vIGJpbmFyeVxuICAgICAgICAgICAgLTEsICAvLyBkZXByZWNhdGVkXG4gICAgICAgICAgICA2LCAgIC8vIE9iamVjdElEXG4gICAgICAgICAgICA3LCAgIC8vIGJvb2xcbiAgICAgICAgICAgIDgsICAgLy8gRGF0ZVxuICAgICAgICAgICAgMCwgICAvLyBudWxsXG4gICAgICAgICAgICA5LCAgIC8vIFJlZ0V4cFxuICAgICAgICAgICAgLTEsICAvLyBkZXByZWNhdGVkXG4gICAgICAgICAgICAxMDAsIC8vIEpTIGNvZGVcbiAgICAgICAgICAgIDIsICAgLy8gZGVwcmVjYXRlZCAoc3ltYm9sKVxuICAgICAgICAgICAgMTAwLCAvLyBKUyBjb2RlXG4gICAgICAgICAgICAxLCAgIC8vIDMyLWJpdCBpbnRcbiAgICAgICAgICAgIDgsICAgLy8gTW9uZ28gdGltZXN0YW1wXG4gICAgICAgICAgICAxICAgIC8vIDY0LWJpdCBpbnRcbiAgICAgICAgICAgXVt0XTtcbiAgfSxcblxuICAvLyBjb21wYXJlIHR3byB2YWx1ZXMgb2YgdW5rbm93biB0eXBlIGFjY29yZGluZyB0byBCU09OIG9yZGVyaW5nXG4gIC8vIHNlbWFudGljcy4gKGFzIGFuIGV4dGVuc2lvbiwgY29uc2lkZXIgJ3VuZGVmaW5lZCcgdG8gYmUgbGVzcyB0aGFuXG4gIC8vIGFueSBvdGhlciB2YWx1ZS4pIHJldHVybiBuZWdhdGl2ZSBpZiBhIGlzIGxlc3MsIHBvc2l0aXZlIGlmIGIgaXNcbiAgLy8gbGVzcywgb3IgMCBpZiBlcXVhbFxuICBfY21wOiBmdW5jdGlvbiAoYSwgYikge1xuICAgIGlmIChhID09PSB1bmRlZmluZWQpXG4gICAgICByZXR1cm4gYiA9PT0gdW5kZWZpbmVkID8gMCA6IC0xO1xuICAgIGlmIChiID09PSB1bmRlZmluZWQpXG4gICAgICByZXR1cm4gMTtcbiAgICB2YXIgdGEgPSBMb2NhbENvbGxlY3Rpb24uX2YuX3R5cGUoYSk7XG4gICAgdmFyIHRiID0gTG9jYWxDb2xsZWN0aW9uLl9mLl90eXBlKGIpO1xuICAgIHZhciBvYSA9IExvY2FsQ29sbGVjdGlvbi5fZi5fdHlwZW9yZGVyKHRhKTtcbiAgICB2YXIgb2IgPSBMb2NhbENvbGxlY3Rpb24uX2YuX3R5cGVvcmRlcih0Yik7XG4gICAgaWYgKG9hICE9PSBvYilcbiAgICAgIHJldHVybiBvYSA8IG9iID8gLTEgOiAxO1xuICAgIGlmICh0YSAhPT0gdGIpXG4gICAgICAvLyBYWFggbmVlZCB0byBpbXBsZW1lbnQgdGhpcyBpZiB3ZSBpbXBsZW1lbnQgU3ltYm9sIG9yIGludGVnZXJzLCBvclxuICAgICAgLy8gVGltZXN0YW1wXG4gICAgICB0aHJvdyBFcnJvcihcIk1pc3NpbmcgdHlwZSBjb2VyY2lvbiBsb2dpYyBpbiBfY21wXCIpO1xuICAgIGlmICh0YSA9PT0gNykgeyAvLyBPYmplY3RJRFxuICAgICAgLy8gQ29udmVydCB0byBzdHJpbmcuXG4gICAgICB0YSA9IHRiID0gMjtcbiAgICAgIGEgPSBhLnRvSGV4U3RyaW5nKCk7XG4gICAgICBiID0gYi50b0hleFN0cmluZygpO1xuICAgIH1cbiAgICBpZiAodGEgPT09IDkpIHsgLy8gRGF0ZVxuICAgICAgLy8gQ29udmVydCB0byBtaWxsaXMuXG4gICAgICB0YSA9IHRiID0gMTtcbiAgICAgIGEgPSBhLmdldFRpbWUoKTtcbiAgICAgIGIgPSBiLmdldFRpbWUoKTtcbiAgICB9XG5cbiAgICBpZiAodGEgPT09IDEpIC8vIGRvdWJsZVxuICAgICAgcmV0dXJuIGEgLSBiO1xuICAgIGlmICh0YiA9PT0gMikgLy8gc3RyaW5nXG4gICAgICByZXR1cm4gYSA8IGIgPyAtMSA6IChhID09PSBiID8gMCA6IDEpO1xuICAgIGlmICh0YSA9PT0gMykgeyAvLyBPYmplY3RcbiAgICAgIC8vIHRoaXMgY291bGQgYmUgbXVjaCBtb3JlIGVmZmljaWVudCBpbiB0aGUgZXhwZWN0ZWQgY2FzZSAuLi5cbiAgICAgIHZhciB0b19hcnJheSA9IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgICAgdmFyIHJldCA9IFtdO1xuICAgICAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgICAgICAgcmV0LnB1c2goa2V5KTtcbiAgICAgICAgICByZXQucHVzaChvYmpba2V5XSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgIH07XG4gICAgICByZXR1cm4gTG9jYWxDb2xsZWN0aW9uLl9mLl9jbXAodG9fYXJyYXkoYSksIHRvX2FycmF5KGIpKTtcbiAgICB9XG4gICAgaWYgKHRhID09PSA0KSB7IC8vIEFycmF5XG4gICAgICBmb3IgKHZhciBpID0gMDsgOyBpKyspIHtcbiAgICAgICAgaWYgKGkgPT09IGEubGVuZ3RoKVxuICAgICAgICAgIHJldHVybiAoaSA9PT0gYi5sZW5ndGgpID8gMCA6IC0xO1xuICAgICAgICBpZiAoaSA9PT0gYi5sZW5ndGgpXG4gICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgIHZhciBzID0gTG9jYWxDb2xsZWN0aW9uLl9mLl9jbXAoYVtpXSwgYltpXSk7XG4gICAgICAgIGlmIChzICE9PSAwKVxuICAgICAgICAgIHJldHVybiBzO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAodGEgPT09IDUpIHsgLy8gYmluYXJ5XG4gICAgICAvLyBTdXJwcmlzaW5nbHksIGEgc21hbGwgYmluYXJ5IGJsb2IgaXMgYWx3YXlzIGxlc3MgdGhhbiBhIGxhcmdlIG9uZSBpblxuICAgICAgLy8gTW9uZ28uXG4gICAgICBpZiAoYS5sZW5ndGggIT09IGIubGVuZ3RoKVxuICAgICAgICByZXR1cm4gYS5sZW5ndGggLSBiLmxlbmd0aDtcbiAgICAgIGZvciAoaSA9IDA7IGkgPCBhLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChhW2ldIDwgYltpXSlcbiAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgIGlmIChhW2ldID4gYltpXSlcbiAgICAgICAgICByZXR1cm4gMTtcbiAgICAgIH1cbiAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICBpZiAodGEgPT09IDgpIHsgLy8gYm9vbGVhblxuICAgICAgaWYgKGEpIHJldHVybiBiID8gMCA6IDE7XG4gICAgICByZXR1cm4gYiA/IC0xIDogMDtcbiAgICB9XG4gICAgaWYgKHRhID09PSAxMCkgLy8gbnVsbFxuICAgICAgcmV0dXJuIDA7XG4gICAgaWYgKHRhID09PSAxMSkgLy8gcmVnZXhwXG4gICAgICB0aHJvdyBFcnJvcihcIlNvcnRpbmcgbm90IHN1cHBvcnRlZCBvbiByZWd1bGFyIGV4cHJlc3Npb25cIik7IC8vIFhYWFxuICAgIC8vIDEzOiBqYXZhc2NyaXB0IGNvZGVcbiAgICAvLyAxNDogc3ltYm9sXG4gICAgLy8gMTU6IGphdmFzY3JpcHQgY29kZSB3aXRoIHNjb3BlXG4gICAgLy8gMTY6IDMyLWJpdCBpbnRlZ2VyXG4gICAgLy8gMTc6IHRpbWVzdGFtcFxuICAgIC8vIDE4OiA2NC1iaXQgaW50ZWdlclxuICAgIC8vIDI1NTogbWlua2V5XG4gICAgLy8gMTI3OiBtYXhrZXlcbiAgICBpZiAodGEgPT09IDEzKSAvLyBqYXZhc2NyaXB0IGNvZGVcbiAgICAgIHRocm93IEVycm9yKFwiU29ydGluZyBub3Qgc3VwcG9ydGVkIG9uIEphdmFzY3JpcHQgY29kZVwiKTsgLy8gWFhYXG4gICAgdGhyb3cgRXJyb3IoXCJVbmtub3duIHR5cGUgdG8gc29ydFwiKTtcbiAgfVxufTtcblxuLy8gRm9yIHVuaXQgdGVzdHMuIFRydWUgaWYgdGhlIGdpdmVuIGRvY3VtZW50IG1hdGNoZXMgdGhlIGdpdmVuXG4vLyBzZWxlY3Rvci5cbkxvY2FsQ29sbGVjdGlvbi5fbWF0Y2hlcyA9IGZ1bmN0aW9uIChzZWxlY3RvciwgZG9jKSB7XG4gIHJldHVybiAoTG9jYWxDb2xsZWN0aW9uLl9jb21waWxlU2VsZWN0b3Ioc2VsZWN0b3IpKShkb2MpO1xufTtcblxuLy8gX21ha2VMb29rdXBGdW5jdGlvbihrZXkpIHJldHVybnMgYSBsb29rdXAgZnVuY3Rpb24uXG4vL1xuLy8gQSBsb29rdXAgZnVuY3Rpb24gdGFrZXMgaW4gYSBkb2N1bWVudCBhbmQgcmV0dXJucyBhbiBhcnJheSBvZiBtYXRjaGluZ1xuLy8gdmFsdWVzLiAgVGhpcyBhcnJheSBoYXMgbW9yZSB0aGFuIG9uZSBlbGVtZW50IGlmIGFueSBzZWdtZW50IG9mIHRoZSBrZXkgb3RoZXJcbi8vIHRoYW4gdGhlIGxhc3Qgb25lIGlzIGFuIGFycmF5LiAgaWUsIGFueSBhcnJheXMgZm91bmQgd2hlbiBkb2luZyBub24tZmluYWxcbi8vIGxvb2t1cHMgcmVzdWx0IGluIHRoaXMgZnVuY3Rpb24gXCJicmFuY2hpbmdcIjsgZWFjaCBlbGVtZW50IGluIHRoZSByZXR1cm5lZFxuLy8gYXJyYXkgcmVwcmVzZW50cyB0aGUgdmFsdWUgZm91bmQgYXQgdGhpcyBicmFuY2guIElmIGFueSBicmFuY2ggZG9lc24ndCBoYXZlIGFcbi8vIGZpbmFsIHZhbHVlIGZvciB0aGUgZnVsbCBrZXksIGl0cyBlbGVtZW50IGluIHRoZSByZXR1cm5lZCBsaXN0IHdpbGwgYmVcbi8vIHVuZGVmaW5lZC4gSXQgYWx3YXlzIHJldHVybnMgYSBub24tZW1wdHkgYXJyYXkuXG4vL1xuLy8gX21ha2VMb29rdXBGdW5jdGlvbignYS54Jykoe2E6IHt4OiAxfX0pIHJldHVybnMgWzFdXG4vLyBfbWFrZUxvb2t1cEZ1bmN0aW9uKCdhLngnKSh7YToge3g6IFsxXX19KSByZXR1cm5zIFtbMV1dXG4vLyBfbWFrZUxvb2t1cEZ1bmN0aW9uKCdhLngnKSh7YTogNX0pICByZXR1cm5zIFt1bmRlZmluZWRdXG4vLyBfbWFrZUxvb2t1cEZ1bmN0aW9uKCdhLngnKSh7YTogW3t4OiAxfSxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3g6IFsyXX0sXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHt5OiAzfV19KVxuLy8gICByZXR1cm5zIFsxLCBbMl0sIHVuZGVmaW5lZF1cbkxvY2FsQ29sbGVjdGlvbi5fbWFrZUxvb2t1cEZ1bmN0aW9uID0gZnVuY3Rpb24gKGtleSkge1xuICB2YXIgZG90TG9jYXRpb24gPSBrZXkuaW5kZXhPZignLicpO1xuICB2YXIgZmlyc3QsIGxvb2t1cFJlc3QsIG5leHRJc051bWVyaWM7XG4gIGlmIChkb3RMb2NhdGlvbiA9PT0gLTEpIHtcbiAgICBmaXJzdCA9IGtleTtcbiAgfSBlbHNlIHtcbiAgICBmaXJzdCA9IGtleS5zdWJzdHIoMCwgZG90TG9jYXRpb24pO1xuICAgIHZhciByZXN0ID0ga2V5LnN1YnN0cihkb3RMb2NhdGlvbiArIDEpO1xuICAgIGxvb2t1cFJlc3QgPSBMb2NhbENvbGxlY3Rpb24uX21ha2VMb29rdXBGdW5jdGlvbihyZXN0KTtcbiAgICAvLyBJcyB0aGUgbmV4dCAocGVyaGFwcyBmaW5hbCkgcGllY2UgbnVtZXJpYyAoaWUsIGFuIGFycmF5IGxvb2t1cD8pXG4gICAgbmV4dElzTnVtZXJpYyA9IC9eXFxkKyhcXC58JCkvLnRlc3QocmVzdCk7XG4gIH1cblxuICByZXR1cm4gZnVuY3Rpb24gKGRvYykge1xuICAgIGlmIChkb2MgPT0gbnVsbCkgIC8vIG51bGwgb3IgdW5kZWZpbmVkXG4gICAgICByZXR1cm4gW3VuZGVmaW5lZF07XG4gICAgdmFyIGZpcnN0TGV2ZWwgPSBkb2NbZmlyc3RdO1xuXG4gICAgLy8gV2UgZG9uJ3QgXCJicmFuY2hcIiBhdCB0aGUgZmluYWwgbGV2ZWwuXG4gICAgaWYgKCFsb29rdXBSZXN0KVxuICAgICAgcmV0dXJuIFtmaXJzdExldmVsXTtcblxuICAgIC8vIEl0J3MgYW4gZW1wdHkgYXJyYXksIGFuZCB3ZSdyZSBub3QgZG9uZTogd2Ugd29uJ3QgZmluZCBhbnl0aGluZy5cbiAgICBpZiAoaXNBcnJheShmaXJzdExldmVsKSAmJiBmaXJzdExldmVsLmxlbmd0aCA9PT0gMClcbiAgICAgIHJldHVybiBbdW5kZWZpbmVkXTtcblxuICAgIC8vIEZvciBlYWNoIHJlc3VsdCBhdCB0aGlzIGxldmVsLCBmaW5pc2ggdGhlIGxvb2t1cCBvbiB0aGUgcmVzdCBvZiB0aGUga2V5LFxuICAgIC8vIGFuZCByZXR1cm4gZXZlcnl0aGluZyB3ZSBmaW5kLiBBbHNvLCBpZiB0aGUgbmV4dCByZXN1bHQgaXMgYSBudW1iZXIsXG4gICAgLy8gZG9uJ3QgYnJhbmNoIGhlcmUuXG4gICAgLy9cbiAgICAvLyBUZWNobmljYWxseSwgaW4gTW9uZ29EQiwgd2Ugc2hvdWxkIGJlIGFibGUgdG8gaGFuZGxlIHRoZSBjYXNlIHdoZXJlXG4gICAgLy8gb2JqZWN0cyBoYXZlIG51bWVyaWMga2V5cywgYnV0IE1vbmdvIGRvZXNuJ3QgYWN0dWFsbHkgaGFuZGxlIHRoaXNcbiAgICAvLyBjb25zaXN0ZW50bHkgeWV0IGl0c2VsZiwgc2VlIGVnXG4gICAgLy8gaHR0cHM6Ly9qaXJhLm1vbmdvZGIub3JnL2Jyb3dzZS9TRVJWRVItMjg5OFxuICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9tb25nb2RiL21vbmdvL2Jsb2IvbWFzdGVyL2pzdGVzdHMvYXJyYXlfbWF0Y2gyLmpzXG4gICAgaWYgKCFpc0FycmF5KGZpcnN0TGV2ZWwpIHx8IG5leHRJc051bWVyaWMpXG4gICAgICBmaXJzdExldmVsID0gW2ZpcnN0TGV2ZWxdO1xuICAgIHJldHVybiBBcnJheS5wcm90b3R5cGUuY29uY2F0LmFwcGx5KFtdLCBfLm1hcChmaXJzdExldmVsLCBsb29rdXBSZXN0KSk7XG4gIH07XG59O1xuXG4vLyBUaGUgbWFpbiBjb21waWxhdGlvbiBmdW5jdGlvbiBmb3IgYSBnaXZlbiBzZWxlY3Rvci5cbnZhciBjb21waWxlRG9jdW1lbnRTZWxlY3RvciA9IGZ1bmN0aW9uIChkb2NTZWxlY3Rvcikge1xuICB2YXIgcGVyS2V5U2VsZWN0b3JzID0gW107XG4gIF8uZWFjaChkb2NTZWxlY3RvciwgZnVuY3Rpb24gKHN1YlNlbGVjdG9yLCBrZXkpIHtcbiAgICBpZiAoa2V5LnN1YnN0cigwLCAxKSA9PT0gJyQnKSB7XG4gICAgICAvLyBPdXRlciBvcGVyYXRvcnMgYXJlIGVpdGhlciBsb2dpY2FsIG9wZXJhdG9ycyAodGhleSByZWN1cnNlIGJhY2sgaW50b1xuICAgICAgLy8gdGhpcyBmdW5jdGlvbiksIG9yICR3aGVyZS5cbiAgICAgIGlmICghXy5oYXMoTE9HSUNBTF9PUEVSQVRPUlMsIGtleSkpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlVucmVjb2duaXplZCBsb2dpY2FsIG9wZXJhdG9yOiBcIiArIGtleSk7XG4gICAgICBwZXJLZXlTZWxlY3RvcnMucHVzaChMT0dJQ0FMX09QRVJBVE9SU1trZXldKHN1YlNlbGVjdG9yKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBsb29rVXBCeUluZGV4ID0gTG9jYWxDb2xsZWN0aW9uLl9tYWtlTG9va3VwRnVuY3Rpb24oa2V5KTtcbiAgICAgIHZhciB2YWx1ZVNlbGVjdG9yRnVuYyA9IGNvbXBpbGVWYWx1ZVNlbGVjdG9yKHN1YlNlbGVjdG9yKTtcbiAgICAgIHBlcktleVNlbGVjdG9ycy5wdXNoKGZ1bmN0aW9uIChkb2MpIHtcbiAgICAgICAgdmFyIGJyYW5jaFZhbHVlcyA9IGxvb2tVcEJ5SW5kZXgoZG9jKTtcbiAgICAgICAgLy8gV2UgYXBwbHkgdGhlIHNlbGVjdG9yIHRvIGVhY2ggXCJicmFuY2hlZFwiIHZhbHVlIGFuZCByZXR1cm4gdHJ1ZSBpZiBhbnlcbiAgICAgICAgLy8gbWF0Y2guIFRoaXMgaXNuJ3QgMTAwJSBjb25zaXN0ZW50IHdpdGggTW9uZ29EQjsgZWcsIHNlZTpcbiAgICAgICAgLy8gaHR0cHM6Ly9qaXJhLm1vbmdvZGIub3JnL2Jyb3dzZS9TRVJWRVItODU4NVxuICAgICAgICByZXR1cm4gXy5hbnkoYnJhbmNoVmFsdWVzLCB2YWx1ZVNlbGVjdG9yRnVuYyk7XG4gICAgICB9KTtcbiAgICB9XG4gIH0pO1xuXG5cbiAgcmV0dXJuIGZ1bmN0aW9uIChkb2MpIHtcbiAgICByZXR1cm4gXy5hbGwocGVyS2V5U2VsZWN0b3JzLCBmdW5jdGlvbiAoZikge1xuICAgICAgcmV0dXJuIGYoZG9jKTtcbiAgICB9KTtcbiAgfTtcbn07XG5cbi8vIEdpdmVuIGEgc2VsZWN0b3IsIHJldHVybiBhIGZ1bmN0aW9uIHRoYXQgdGFrZXMgb25lIGFyZ3VtZW50LCBhXG4vLyBkb2N1bWVudCwgYW5kIHJldHVybnMgdHJ1ZSBpZiB0aGUgZG9jdW1lbnQgbWF0Y2hlcyB0aGUgc2VsZWN0b3IsXG4vLyBlbHNlIGZhbHNlLlxuTG9jYWxDb2xsZWN0aW9uLl9jb21waWxlU2VsZWN0b3IgPSBmdW5jdGlvbiAoc2VsZWN0b3IpIHtcbiAgLy8geW91IGNhbiBwYXNzIGEgbGl0ZXJhbCBmdW5jdGlvbiBpbnN0ZWFkIG9mIGEgc2VsZWN0b3JcbiAgaWYgKHNlbGVjdG9yIGluc3RhbmNlb2YgRnVuY3Rpb24pXG4gICAgcmV0dXJuIGZ1bmN0aW9uIChkb2MpIHtyZXR1cm4gc2VsZWN0b3IuY2FsbChkb2MpO307XG5cbiAgLy8gc2hvcnRoYW5kIC0tIHNjYWxhcnMgbWF0Y2ggX2lkXG4gIGlmIChMb2NhbENvbGxlY3Rpb24uX3NlbGVjdG9ySXNJZChzZWxlY3RvcikpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGRvYykge1xuICAgICAgcmV0dXJuIEVKU09OLmVxdWFscyhkb2MuX2lkLCBzZWxlY3Rvcik7XG4gICAgfTtcbiAgfVxuXG4gIC8vIHByb3RlY3QgYWdhaW5zdCBkYW5nZXJvdXMgc2VsZWN0b3JzLiAgZmFsc2V5IGFuZCB7X2lkOiBmYWxzZXl9IGFyZSBib3RoXG4gIC8vIGxpa2VseSBwcm9ncmFtbWVyIGVycm9yLCBhbmQgbm90IHdoYXQgeW91IHdhbnQsIHBhcnRpY3VsYXJseSBmb3JcbiAgLy8gZGVzdHJ1Y3RpdmUgb3BlcmF0aW9ucy5cbiAgaWYgKCFzZWxlY3RvciB8fCAoKCdfaWQnIGluIHNlbGVjdG9yKSAmJiAhc2VsZWN0b3IuX2lkKSlcbiAgICByZXR1cm4gZnVuY3Rpb24gKGRvYykge3JldHVybiBmYWxzZTt9O1xuXG4gIC8vIFRvcCBsZXZlbCBjYW4ndCBiZSBhbiBhcnJheSBvciB0cnVlIG9yIGJpbmFyeS5cbiAgaWYgKHR5cGVvZihzZWxlY3RvcikgPT09ICdib29sZWFuJyB8fCBpc0FycmF5KHNlbGVjdG9yKSB8fFxuICAgICAgRUpTT04uaXNCaW5hcnkoc2VsZWN0b3IpKVxuICAgIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgc2VsZWN0b3I6IFwiICsgc2VsZWN0b3IpO1xuXG4gIHJldHVybiBjb21waWxlRG9jdW1lbnRTZWxlY3RvcihzZWxlY3Rvcik7XG59O1xuXG4vLyBHaXZlIGEgc29ydCBzcGVjLCB3aGljaCBjYW4gYmUgaW4gYW55IG9mIHRoZXNlIGZvcm1zOlxuLy8gICB7XCJrZXkxXCI6IDEsIFwia2V5MlwiOiAtMX1cbi8vICAgW1tcImtleTFcIiwgXCJhc2NcIl0sIFtcImtleTJcIiwgXCJkZXNjXCJdXVxuLy8gICBbXCJrZXkxXCIsIFtcImtleTJcIiwgXCJkZXNjXCJdXVxuLy9cbi8vICguLiB3aXRoIHRoZSBmaXJzdCBmb3JtIGJlaW5nIGRlcGVuZGVudCBvbiB0aGUga2V5IGVudW1lcmF0aW9uXG4vLyBiZWhhdmlvciBvZiB5b3VyIGphdmFzY3JpcHQgVk0sIHdoaWNoIHVzdWFsbHkgZG9lcyB3aGF0IHlvdSBtZWFuIGluXG4vLyB0aGlzIGNhc2UgaWYgdGhlIGtleSBuYW1lcyBkb24ndCBsb29rIGxpa2UgaW50ZWdlcnMgLi4pXG4vL1xuLy8gcmV0dXJuIGEgZnVuY3Rpb24gdGhhdCB0YWtlcyB0d28gb2JqZWN0cywgYW5kIHJldHVybnMgLTEgaWYgdGhlXG4vLyBmaXJzdCBvYmplY3QgY29tZXMgZmlyc3QgaW4gb3JkZXIsIDEgaWYgdGhlIHNlY29uZCBvYmplY3QgY29tZXNcbi8vIGZpcnN0LCBvciAwIGlmIG5laXRoZXIgb2JqZWN0IGNvbWVzIGJlZm9yZSB0aGUgb3RoZXIuXG5cbkxvY2FsQ29sbGVjdGlvbi5fY29tcGlsZVNvcnQgPSBmdW5jdGlvbiAoc3BlYykge1xuICB2YXIgc29ydFNwZWNQYXJ0cyA9IFtdO1xuXG4gIGlmIChzcGVjIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNwZWMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmICh0eXBlb2Ygc3BlY1tpXSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICBzb3J0U3BlY1BhcnRzLnB1c2goe1xuICAgICAgICAgIGxvb2t1cDogTG9jYWxDb2xsZWN0aW9uLl9tYWtlTG9va3VwRnVuY3Rpb24oc3BlY1tpXSksXG4gICAgICAgICAgYXNjZW5kaW5nOiB0cnVlXG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc29ydFNwZWNQYXJ0cy5wdXNoKHtcbiAgICAgICAgICBsb29rdXA6IExvY2FsQ29sbGVjdGlvbi5fbWFrZUxvb2t1cEZ1bmN0aW9uKHNwZWNbaV1bMF0pLFxuICAgICAgICAgIGFzY2VuZGluZzogc3BlY1tpXVsxXSAhPT0gXCJkZXNjXCJcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2UgaWYgKHR5cGVvZiBzcGVjID09PSBcIm9iamVjdFwiKSB7XG4gICAgZm9yICh2YXIga2V5IGluIHNwZWMpIHtcbiAgICAgIHNvcnRTcGVjUGFydHMucHVzaCh7XG4gICAgICAgIGxvb2t1cDogTG9jYWxDb2xsZWN0aW9uLl9tYWtlTG9va3VwRnVuY3Rpb24oa2V5KSxcbiAgICAgICAgYXNjZW5kaW5nOiBzcGVjW2tleV0gPj0gMFxuICAgICAgfSk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHRocm93IEVycm9yKFwiQmFkIHNvcnQgc3BlY2lmaWNhdGlvbjogXCIsIEpTT04uc3RyaW5naWZ5KHNwZWMpKTtcbiAgfVxuXG4gIGlmIChzb3J0U3BlY1BhcnRzLmxlbmd0aCA9PT0gMClcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge3JldHVybiAwO307XG5cbiAgLy8gcmVkdWNlVmFsdWUgdGFrZXMgaW4gYWxsIHRoZSBwb3NzaWJsZSB2YWx1ZXMgZm9yIHRoZSBzb3J0IGtleSBhbG9uZyB2YXJpb3VzXG4gIC8vIGJyYW5jaGVzLCBhbmQgcmV0dXJucyB0aGUgbWluIG9yIG1heCB2YWx1ZSAoYWNjb3JkaW5nIHRvIHRoZSBib29sXG4gIC8vIGZpbmRNaW4pLiBFYWNoIHZhbHVlIGNhbiBpdHNlbGYgYmUgYW4gYXJyYXksIGFuZCB3ZSBsb29rIGF0IGl0cyB2YWx1ZXNcbiAgLy8gdG9vLiAoaWUsIHdlIGRvIGEgc2luZ2xlIGxldmVsIG9mIGZsYXR0ZW5pbmcgb24gYnJhbmNoVmFsdWVzLCB0aGVuIGZpbmQgdGhlXG4gIC8vIG1pbi9tYXguKVxuICB2YXIgcmVkdWNlVmFsdWUgPSBmdW5jdGlvbiAoYnJhbmNoVmFsdWVzLCBmaW5kTWluKSB7XG4gICAgdmFyIHJlZHVjZWQ7XG4gICAgdmFyIGZpcnN0ID0gdHJ1ZTtcbiAgICAvLyBJdGVyYXRlIG92ZXIgYWxsIHRoZSB2YWx1ZXMgZm91bmQgaW4gYWxsIHRoZSBicmFuY2hlcywgYW5kIGlmIGEgdmFsdWUgaXNcbiAgICAvLyBhbiBhcnJheSBpdHNlbGYsIGl0ZXJhdGUgb3ZlciB0aGUgdmFsdWVzIGluIHRoZSBhcnJheSBzZXBhcmF0ZWx5LlxuICAgIF8uZWFjaChicmFuY2hWYWx1ZXMsIGZ1bmN0aW9uIChicmFuY2hWYWx1ZSkge1xuICAgICAgLy8gVmFsdWUgbm90IGFuIGFycmF5PyBQcmV0ZW5kIGl0IGlzLlxuICAgICAgaWYgKCFpc0FycmF5KGJyYW5jaFZhbHVlKSlcbiAgICAgICAgYnJhbmNoVmFsdWUgPSBbYnJhbmNoVmFsdWVdO1xuICAgICAgLy8gVmFsdWUgaXMgYW4gZW1wdHkgYXJyYXk/IFByZXRlbmQgaXQgd2FzIG1pc3NpbmcsIHNpbmNlIHRoYXQncyB3aGVyZSBpdFxuICAgICAgLy8gc2hvdWxkIGJlIHNvcnRlZC5cbiAgICAgIGlmIChpc0FycmF5KGJyYW5jaFZhbHVlKSAmJiBicmFuY2hWYWx1ZS5sZW5ndGggPT09IDApXG4gICAgICAgIGJyYW5jaFZhbHVlID0gW3VuZGVmaW5lZF07XG4gICAgICBfLmVhY2goYnJhbmNoVmFsdWUsIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAvLyBXZSBzaG91bGQgZ2V0IGhlcmUgYXQgbGVhc3Qgb25jZTogbG9va3VwIGZ1bmN0aW9ucyByZXR1cm4gbm9uLWVtcHR5XG4gICAgICAgIC8vIGFycmF5cywgc28gdGhlIG91dGVyIGxvb3AgcnVucyBhdCBsZWFzdCBvbmNlLCBhbmQgd2UgcHJldmVudGVkXG4gICAgICAgIC8vIGJyYW5jaFZhbHVlIGZyb20gYmVpbmcgYW4gZW1wdHkgYXJyYXkuXG4gICAgICAgIGlmIChmaXJzdCkge1xuICAgICAgICAgIHJlZHVjZWQgPSB2YWx1ZTtcbiAgICAgICAgICBmaXJzdCA9IGZhbHNlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIENvbXBhcmUgdGhlIHZhbHVlIHdlIGZvdW5kIHRvIHRoZSB2YWx1ZSB3ZSBmb3VuZCBzbyBmYXIsIHNhdmluZyBpdFxuICAgICAgICAgIC8vIGlmIGl0J3MgbGVzcyAoZm9yIGFuIGFzY2VuZGluZyBzb3J0KSBvciBtb3JlIChmb3IgYSBkZXNjZW5kaW5nXG4gICAgICAgICAgLy8gc29ydCkuXG4gICAgICAgICAgdmFyIGNtcCA9IExvY2FsQ29sbGVjdGlvbi5fZi5fY21wKHJlZHVjZWQsIHZhbHVlKTtcbiAgICAgICAgICBpZiAoKGZpbmRNaW4gJiYgY21wID4gMCkgfHwgKCFmaW5kTWluICYmIGNtcCA8IDApKVxuICAgICAgICAgICAgcmVkdWNlZCA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICByZXR1cm4gcmVkdWNlZDtcbiAgfTtcblxuICByZXR1cm4gZnVuY3Rpb24gKGEsIGIpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNvcnRTcGVjUGFydHMubGVuZ3RoOyArK2kpIHtcbiAgICAgIHZhciBzcGVjUGFydCA9IHNvcnRTcGVjUGFydHNbaV07XG4gICAgICB2YXIgYVZhbHVlID0gcmVkdWNlVmFsdWUoc3BlY1BhcnQubG9va3VwKGEpLCBzcGVjUGFydC5hc2NlbmRpbmcpO1xuICAgICAgdmFyIGJWYWx1ZSA9IHJlZHVjZVZhbHVlKHNwZWNQYXJ0Lmxvb2t1cChiKSwgc3BlY1BhcnQuYXNjZW5kaW5nKTtcbiAgICAgIHZhciBjb21wYXJlID0gTG9jYWxDb2xsZWN0aW9uLl9mLl9jbXAoYVZhbHVlLCBiVmFsdWUpO1xuICAgICAgaWYgKGNvbXBhcmUgIT09IDApXG4gICAgICAgIHJldHVybiBzcGVjUGFydC5hc2NlbmRpbmcgPyBjb21wYXJlIDogLWNvbXBhcmU7XG4gICAgfTtcbiAgICByZXR1cm4gMDtcbiAgfTtcbn07XG5cbmV4cG9ydHMuY29tcGlsZURvY3VtZW50U2VsZWN0b3IgPSBjb21waWxlRG9jdW1lbnRTZWxlY3RvcjtcbmV4cG9ydHMuY29tcGlsZVNvcnQgPSBMb2NhbENvbGxlY3Rpb24uX2NvbXBpbGVTb3J0OyIsIlBhZ2UgPSByZXF1aXJlKFwiLi4vUGFnZVwiKVxuTG9jYXRpb25GaW5kZXIgPSByZXF1aXJlICcuLi9Mb2NhdGlvbkZpbmRlcidcbkdlb0pTT04gPSByZXF1aXJlICcuLi9HZW9KU09OJ1xuXG4jIFRPRE8gc291cmNlIHNlYXJjaFxuXG4jIExpc3RzIG5lYXJieSBhbmQgdW5sb2NhdGVkIHNvdXJjZXNcbiMgT3B0aW9uczogb25TZWxlY3QgLSBmdW5jdGlvbiB0byBjYWxsIHdpdGggc291cmNlIGRvYyB3aGVuIHNlbGVjdGVkXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFNvdXJjZUxpc3RQYWdlIGV4dGVuZHMgUGFnZVxuICBldmVudHM6IFxuICAgICdjbGljayB0ci50YXBwYWJsZScgOiAnc291cmNlQ2xpY2tlZCdcbiAgICAnY2xpY2sgI3NlYXJjaF9jYW5jZWwnIDogJ2NhbmNlbFNlYXJjaCdcblxuICBjcmVhdGU6IC0+XG4gICAgQHNldFRpdGxlICdOZWFyYnkgU291cmNlcydcblxuICBhY3RpdmF0ZTogLT5cbiAgICBAJGVsLmh0bWwgdGVtcGxhdGVzWydwYWdlcy9Tb3VyY2VMaXN0UGFnZSddKClcbiAgICBAbmVhclNvdXJjZXMgPSBbXVxuICAgIEB1bmxvY2F0ZWRTb3VyY2VzID0gW11cblxuICAgICMgRmluZCBsb2NhdGlvblxuICAgIEBsb2NhdGlvbkZpbmRlciA9IG5ldyBMb2NhdGlvbkZpbmRlcigpXG4gICAgQGxvY2F0aW9uRmluZGVyLm9uKCdmb3VuZCcsIEBsb2NhdGlvbkZvdW5kKS5vbignZXJyb3InLCBAbG9jYXRpb25FcnJvcilcbiAgICBAbG9jYXRpb25GaW5kZXIuZ2V0TG9jYXRpb24oKVxuICAgIEAkKFwiI2xvY2F0aW9uX21zZ1wiKS5zaG93KClcblxuICAgIEBzZXR1cEJ1dHRvbkJhciBbXG4gICAgICB7IGljb246IFwic2VhcmNoLnBuZ1wiLCBjbGljazogPT4gQHNlYXJjaCgpIH1cbiAgICAgIHsgaWNvbjogXCJwbHVzLnBuZ1wiLCBjbGljazogPT4gQGFkZFNvdXJjZSgpIH1cbiAgICBdXG5cbiAgICAjIFF1ZXJ5IGRhdGFiYXNlIGZvciB1bmxvY2F0ZWQgc291cmNlcyAjIFRPRE8gb25seSBieSB1c2VyXG4gICAgQGRiLnNvdXJjZXMuZmluZChnZW86IHskZXhpc3RzOmZhbHNlfSkuZmV0Y2ggKHNvdXJjZXMpID0+XG4gICAgICBAdW5sb2NhdGVkU291cmNlcyA9IHNvdXJjZXNcbiAgICAgIEByZW5kZXJMaXN0KClcblxuICAgIEBwZXJmb3JtU2VhcmNoKClcblxuICBhZGRTb3VyY2U6IC0+XG4gICAgQHBhZ2VyLm9wZW5QYWdlKHJlcXVpcmUoXCIuL05ld1NvdXJjZVBhZ2VcIikpXG4gICAgXG4gIGxvY2F0aW9uRm91bmQ6IChwb3MpID0+XG4gICAgQCQoXCIjbG9jYXRpb25fbXNnXCIpLmhpZGUoKVxuICAgIHNlbGVjdG9yID0gZ2VvOiBcbiAgICAgICRuZWFyOiBcbiAgICAgICAgJGdlb21ldHJ5OiBHZW9KU09OLnBvc1RvUG9pbnQocG9zKVxuXG4gICAgIyBRdWVyeSBkYXRhYmFzZSBmb3IgbmVhciBzb3VyY2VzXG4gICAgQGRiLnNvdXJjZXMuZmluZChzZWxlY3RvcikuZmV0Y2ggKHNvdXJjZXMpID0+XG4gICAgICBAbmVhclNvdXJjZXMgPSBzb3VyY2VzXG4gICAgICBAcmVuZGVyTGlzdCgpXG5cbiAgcmVuZGVyTGlzdDogLT5cbiAgICAjIEFwcGVuZCBsb2NhdGVkIGFuZCB1bmxvY2F0ZWQgc291cmNlc1xuICAgIGlmIG5vdCBAc2VhcmNoVGV4dFxuICAgICAgc291cmNlcyA9IEB1bmxvY2F0ZWRTb3VyY2VzLmNvbmNhdChAbmVhclNvdXJjZXMpXG4gICAgZWxzZVxuICAgICAgc291cmNlcyA9IEBzZWFyY2hTb3VyY2VzXG5cbiAgICBAJChcIiN0YWJsZVwiKS5odG1sIHRlbXBsYXRlc1sncGFnZXMvU291cmNlTGlzdFBhZ2VfaXRlbXMnXShzb3VyY2VzOnNvdXJjZXMpXG5cbiAgbG9jYXRpb25FcnJvcjogKHBvcykgPT5cbiAgICBAJChcIiNsb2NhdGlvbl9tc2dcIikuaGlkZSgpXG4gICAgQHBhZ2VyLmZsYXNoIFwiVW5hYmxlIHRvIGRldGVybWluZSBsb2NhdGlvblwiLCBcImVycm9yXCJcblxuICBzb3VyY2VDbGlja2VkOiAoZXYpIC0+XG4gICAgIyBXcmFwIG9uU2VsZWN0XG4gICAgb25TZWxlY3QgPSB1bmRlZmluZWRcbiAgICBpZiBAb3B0aW9ucy5vblNlbGVjdFxuICAgICAgb25TZWxlY3QgPSAoc291cmNlKSA9PlxuICAgICAgICBAcGFnZXIuY2xvc2VQYWdlKClcbiAgICAgICAgQG9wdGlvbnMub25TZWxlY3Qoc291cmNlKVxuICAgIEBwYWdlci5vcGVuUGFnZShyZXF1aXJlKFwiLi9Tb3VyY2VQYWdlXCIpLCB7IF9pZDogZXYuY3VycmVudFRhcmdldC5pZCwgb25TZWxlY3Q6IG9uU2VsZWN0fSlcblxuICBzZWFyY2g6IC0+XG4gICAgIyBQcm9tcHQgZm9yIHNlYXJjaFxuICAgIEBzZWFyY2hUZXh0ID0gcHJvbXB0KFwiRW50ZXIgc2VhcmNoIHRleHQgb3IgSUQgb2Ygd2F0ZXIgc291cmNlXCIpXG4gICAgQHBlcmZvcm1TZWFyY2goKVxuXG4gIHBlcmZvcm1TZWFyY2g6IC0+XG4gICAgQCQoXCIjc2VhcmNoX2JhclwiKS50b2dnbGUoQHNlYXJjaFRleHQgYW5kIEBzZWFyY2hUZXh0Lmxlbmd0aD4wKVxuICAgIEAkKFwiI3NlYXJjaF90ZXh0XCIpLnRleHQoQHNlYXJjaFRleHQpXG4gICAgaWYgQHNlYXJjaFRleHRcbiAgICAgICMgSWYgZGlnaXRzLCBzZWFyY2ggZm9yIGNvZGVcbiAgICAgIGlmIEBzZWFyY2hUZXh0Lm1hdGNoKC9eXFxkKyQvKVxuICAgICAgICBzZWxlY3RvciA9IHsgY29kZTogQHNlYXJjaFRleHQgfVxuICAgICAgZWxzZVxuICAgICAgICBzZWxlY3RvciA9IHsgbmFtZTogbmV3IFJlZ0V4cChAc2VhcmNoVGV4dCxcImlcIil9XG4gICAgICAgIFxuICAgICAgQGRiLnNvdXJjZXMuZmluZChzZWxlY3Rvciwge2xpbWl0OiA1MH0pLmZldGNoIChzb3VyY2VzKSA9PlxuICAgICAgICBAc2VhcmNoU291cmNlcyA9IHNvdXJjZXNcbiAgICAgICAgQHJlbmRlckxpc3QoKVxuICAgIGVsc2VcbiAgICAgIEByZW5kZXJMaXN0KClcblxuICBjYW5jZWxTZWFyY2g6IC0+XG4gICAgQHNlYXJjaFRleHQgPSBcIlwiXG4gICAgQHBlcmZvcm1TZWFyY2goKVxuXG4iLCJFSlNPTiA9IHt9OyAvLyBHbG9iYWwhXG52YXIgY3VzdG9tVHlwZXMgPSB7fTtcbi8vIEFkZCBhIGN1c3RvbSB0eXBlLCB1c2luZyBhIG1ldGhvZCBvZiB5b3VyIGNob2ljZSB0byBnZXQgdG8gYW5kXG4vLyBmcm9tIGEgYmFzaWMgSlNPTi1hYmxlIHJlcHJlc2VudGF0aW9uLiAgVGhlIGZhY3RvcnkgYXJndW1lbnRcbi8vIGlzIGEgZnVuY3Rpb24gb2YgSlNPTi1hYmxlIC0tPiB5b3VyIG9iamVjdFxuLy8gVGhlIHR5cGUgeW91IGFkZCBtdXN0IGhhdmU6XG4vLyAtIEEgY2xvbmUoKSBtZXRob2QsIHNvIHRoYXQgTWV0ZW9yIGNhbiBkZWVwLWNvcHkgaXQgd2hlbiBuZWNlc3NhcnkuXG4vLyAtIEEgZXF1YWxzKCkgbWV0aG9kLCBzbyB0aGF0IE1ldGVvciBjYW4gY29tcGFyZSBpdFxuLy8gLSBBIHRvSlNPTlZhbHVlKCkgbWV0aG9kLCBzbyB0aGF0IE1ldGVvciBjYW4gc2VyaWFsaXplIGl0XG4vLyAtIGEgdHlwZU5hbWUoKSBtZXRob2QsIHRvIHNob3cgaG93IHRvIGxvb2sgaXQgdXAgaW4gb3VyIHR5cGUgdGFibGUuXG4vLyBJdCBpcyBva2F5IGlmIHRoZXNlIG1ldGhvZHMgYXJlIG1vbmtleS1wYXRjaGVkIG9uLlxuRUpTT04uYWRkVHlwZSA9IGZ1bmN0aW9uIChuYW1lLCBmYWN0b3J5KSB7XG4gIGlmIChfLmhhcyhjdXN0b21UeXBlcywgbmFtZSkpXG4gICAgdGhyb3cgbmV3IEVycm9yKFwiVHlwZSBcIiArIG5hbWUgKyBcIiBhbHJlYWR5IHByZXNlbnRcIik7XG4gIGN1c3RvbVR5cGVzW25hbWVdID0gZmFjdG9yeTtcbn07XG5cbnZhciBidWlsdGluQ29udmVydGVycyA9IFtcbiAgeyAvLyBEYXRlXG4gICAgbWF0Y2hKU09OVmFsdWU6IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgIHJldHVybiBfLmhhcyhvYmosICckZGF0ZScpICYmIF8uc2l6ZShvYmopID09PSAxO1xuICAgIH0sXG4gICAgbWF0Y2hPYmplY3Q6IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgIHJldHVybiBvYmogaW5zdGFuY2VvZiBEYXRlO1xuICAgIH0sXG4gICAgdG9KU09OVmFsdWU6IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgIHJldHVybiB7JGRhdGU6IG9iai5nZXRUaW1lKCl9O1xuICAgIH0sXG4gICAgZnJvbUpTT05WYWx1ZTogZnVuY3Rpb24gKG9iaikge1xuICAgICAgcmV0dXJuIG5ldyBEYXRlKG9iai4kZGF0ZSk7XG4gICAgfVxuICB9LFxuICB7IC8vIEJpbmFyeVxuICAgIG1hdGNoSlNPTlZhbHVlOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICByZXR1cm4gXy5oYXMob2JqLCAnJGJpbmFyeScpICYmIF8uc2l6ZShvYmopID09PSAxO1xuICAgIH0sXG4gICAgbWF0Y2hPYmplY3Q6IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgIHJldHVybiB0eXBlb2YgVWludDhBcnJheSAhPT0gJ3VuZGVmaW5lZCcgJiYgb2JqIGluc3RhbmNlb2YgVWludDhBcnJheVxuICAgICAgICB8fCAob2JqICYmIF8uaGFzKG9iaiwgJyRVaW50OEFycmF5UG9seWZpbGwnKSk7XG4gICAgfSxcbiAgICB0b0pTT05WYWx1ZTogZnVuY3Rpb24gKG9iaikge1xuICAgICAgcmV0dXJuIHskYmluYXJ5OiBFSlNPTi5fYmFzZTY0RW5jb2RlKG9iail9O1xuICAgIH0sXG4gICAgZnJvbUpTT05WYWx1ZTogZnVuY3Rpb24gKG9iaikge1xuICAgICAgcmV0dXJuIEVKU09OLl9iYXNlNjREZWNvZGUob2JqLiRiaW5hcnkpO1xuICAgIH1cbiAgfSxcbiAgeyAvLyBFc2NhcGluZyBvbmUgbGV2ZWxcbiAgICBtYXRjaEpTT05WYWx1ZTogZnVuY3Rpb24gKG9iaikge1xuICAgICAgcmV0dXJuIF8uaGFzKG9iaiwgJyRlc2NhcGUnKSAmJiBfLnNpemUob2JqKSA9PT0gMTtcbiAgICB9LFxuICAgIG1hdGNoT2JqZWN0OiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICBpZiAoXy5pc0VtcHR5KG9iaikgfHwgXy5zaXplKG9iaikgPiAyKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBfLmFueShidWlsdGluQ29udmVydGVycywgZnVuY3Rpb24gKGNvbnZlcnRlcikge1xuICAgICAgICByZXR1cm4gY29udmVydGVyLm1hdGNoSlNPTlZhbHVlKG9iaik7XG4gICAgICB9KTtcbiAgICB9LFxuICAgIHRvSlNPTlZhbHVlOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICB2YXIgbmV3T2JqID0ge307XG4gICAgICBfLmVhY2gob2JqLCBmdW5jdGlvbiAodmFsdWUsIGtleSkge1xuICAgICAgICBuZXdPYmpba2V5XSA9IEVKU09OLnRvSlNPTlZhbHVlKHZhbHVlKTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHskZXNjYXBlOiBuZXdPYmp9O1xuICAgIH0sXG4gICAgZnJvbUpTT05WYWx1ZTogZnVuY3Rpb24gKG9iaikge1xuICAgICAgdmFyIG5ld09iaiA9IHt9O1xuICAgICAgXy5lYWNoKG9iai4kZXNjYXBlLCBmdW5jdGlvbiAodmFsdWUsIGtleSkge1xuICAgICAgICBuZXdPYmpba2V5XSA9IEVKU09OLmZyb21KU09OVmFsdWUodmFsdWUpO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gbmV3T2JqO1xuICAgIH1cbiAgfSxcbiAgeyAvLyBDdXN0b21cbiAgICBtYXRjaEpTT05WYWx1ZTogZnVuY3Rpb24gKG9iaikge1xuICAgICAgcmV0dXJuIF8uaGFzKG9iaiwgJyR0eXBlJykgJiYgXy5oYXMob2JqLCAnJHZhbHVlJykgJiYgXy5zaXplKG9iaikgPT09IDI7XG4gICAgfSxcbiAgICBtYXRjaE9iamVjdDogZnVuY3Rpb24gKG9iaikge1xuICAgICAgcmV0dXJuIEVKU09OLl9pc0N1c3RvbVR5cGUob2JqKTtcbiAgICB9LFxuICAgIHRvSlNPTlZhbHVlOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICByZXR1cm4geyR0eXBlOiBvYmoudHlwZU5hbWUoKSwgJHZhbHVlOiBvYmoudG9KU09OVmFsdWUoKX07XG4gICAgfSxcbiAgICBmcm9tSlNPTlZhbHVlOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICB2YXIgdHlwZU5hbWUgPSBvYmouJHR5cGU7XG4gICAgICB2YXIgY29udmVydGVyID0gY3VzdG9tVHlwZXNbdHlwZU5hbWVdO1xuICAgICAgcmV0dXJuIGNvbnZlcnRlcihvYmouJHZhbHVlKTtcbiAgICB9XG4gIH1cbl07XG5cbkVKU09OLl9pc0N1c3RvbVR5cGUgPSBmdW5jdGlvbiAob2JqKSB7XG4gIHJldHVybiBvYmogJiZcbiAgICB0eXBlb2Ygb2JqLnRvSlNPTlZhbHVlID09PSAnZnVuY3Rpb24nICYmXG4gICAgdHlwZW9mIG9iai50eXBlTmFtZSA9PT0gJ2Z1bmN0aW9uJyAmJlxuICAgIF8uaGFzKGN1c3RvbVR5cGVzLCBvYmoudHlwZU5hbWUoKSk7XG59O1xuXG5cbi8vZm9yIGJvdGggYXJyYXlzIGFuZCBvYmplY3RzLCBpbi1wbGFjZSBtb2RpZmljYXRpb24uXG52YXIgYWRqdXN0VHlwZXNUb0pTT05WYWx1ZSA9XG5FSlNPTi5fYWRqdXN0VHlwZXNUb0pTT05WYWx1ZSA9IGZ1bmN0aW9uIChvYmopIHtcbiAgaWYgKG9iaiA9PT0gbnVsbClcbiAgICByZXR1cm4gbnVsbDtcbiAgdmFyIG1heWJlQ2hhbmdlZCA9IHRvSlNPTlZhbHVlSGVscGVyKG9iaik7XG4gIGlmIChtYXliZUNoYW5nZWQgIT09IHVuZGVmaW5lZClcbiAgICByZXR1cm4gbWF5YmVDaGFuZ2VkO1xuICBfLmVhY2gob2JqLCBmdW5jdGlvbiAodmFsdWUsIGtleSkge1xuICAgIGlmICh0eXBlb2YgdmFsdWUgIT09ICdvYmplY3QnICYmIHZhbHVlICE9PSB1bmRlZmluZWQpXG4gICAgICByZXR1cm47IC8vIGNvbnRpbnVlXG4gICAgdmFyIGNoYW5nZWQgPSB0b0pTT05WYWx1ZUhlbHBlcih2YWx1ZSk7XG4gICAgaWYgKGNoYW5nZWQpIHtcbiAgICAgIG9ialtrZXldID0gY2hhbmdlZDtcbiAgICAgIHJldHVybjsgLy8gb24gdG8gdGhlIG5leHQga2V5XG4gICAgfVxuICAgIC8vIGlmIHdlIGdldCBoZXJlLCB2YWx1ZSBpcyBhbiBvYmplY3QgYnV0IG5vdCBhZGp1c3RhYmxlXG4gICAgLy8gYXQgdGhpcyBsZXZlbC4gIHJlY3Vyc2UuXG4gICAgYWRqdXN0VHlwZXNUb0pTT05WYWx1ZSh2YWx1ZSk7XG4gIH0pO1xuICByZXR1cm4gb2JqO1xufTtcblxuLy8gRWl0aGVyIHJldHVybiB0aGUgSlNPTi1jb21wYXRpYmxlIHZlcnNpb24gb2YgdGhlIGFyZ3VtZW50LCBvciB1bmRlZmluZWQgKGlmXG4vLyB0aGUgaXRlbSBpc24ndCBpdHNlbGYgcmVwbGFjZWFibGUsIGJ1dCBtYXliZSBzb21lIGZpZWxkcyBpbiBpdCBhcmUpXG52YXIgdG9KU09OVmFsdWVIZWxwZXIgPSBmdW5jdGlvbiAoaXRlbSkge1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGJ1aWx0aW5Db252ZXJ0ZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGNvbnZlcnRlciA9IGJ1aWx0aW5Db252ZXJ0ZXJzW2ldO1xuICAgIGlmIChjb252ZXJ0ZXIubWF0Y2hPYmplY3QoaXRlbSkpIHtcbiAgICAgIHJldHVybiBjb252ZXJ0ZXIudG9KU09OVmFsdWUoaXRlbSk7XG4gICAgfVxuICB9XG4gIHJldHVybiB1bmRlZmluZWQ7XG59O1xuXG5FSlNPTi50b0pTT05WYWx1ZSA9IGZ1bmN0aW9uIChpdGVtKSB7XG4gIHZhciBjaGFuZ2VkID0gdG9KU09OVmFsdWVIZWxwZXIoaXRlbSk7XG4gIGlmIChjaGFuZ2VkICE9PSB1bmRlZmluZWQpXG4gICAgcmV0dXJuIGNoYW5nZWQ7XG4gIGlmICh0eXBlb2YgaXRlbSA9PT0gJ29iamVjdCcpIHtcbiAgICBpdGVtID0gRUpTT04uY2xvbmUoaXRlbSk7XG4gICAgYWRqdXN0VHlwZXNUb0pTT05WYWx1ZShpdGVtKTtcbiAgfVxuICByZXR1cm4gaXRlbTtcbn07XG5cbi8vZm9yIGJvdGggYXJyYXlzIGFuZCBvYmplY3RzLiBUcmllcyBpdHMgYmVzdCB0byBqdXN0XG4vLyB1c2UgdGhlIG9iamVjdCB5b3UgaGFuZCBpdCwgYnV0IG1heSByZXR1cm4gc29tZXRoaW5nXG4vLyBkaWZmZXJlbnQgaWYgdGhlIG9iamVjdCB5b3UgaGFuZCBpdCBpdHNlbGYgbmVlZHMgY2hhbmdpbmcuXG52YXIgYWRqdXN0VHlwZXNGcm9tSlNPTlZhbHVlID1cbkVKU09OLl9hZGp1c3RUeXBlc0Zyb21KU09OVmFsdWUgPSBmdW5jdGlvbiAob2JqKSB7XG4gIGlmIChvYmogPT09IG51bGwpXG4gICAgcmV0dXJuIG51bGw7XG4gIHZhciBtYXliZUNoYW5nZWQgPSBmcm9tSlNPTlZhbHVlSGVscGVyKG9iaik7XG4gIGlmIChtYXliZUNoYW5nZWQgIT09IG9iailcbiAgICByZXR1cm4gbWF5YmVDaGFuZ2VkO1xuICBfLmVhY2gob2JqLCBmdW5jdGlvbiAodmFsdWUsIGtleSkge1xuICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnKSB7XG4gICAgICB2YXIgY2hhbmdlZCA9IGZyb21KU09OVmFsdWVIZWxwZXIodmFsdWUpO1xuICAgICAgaWYgKHZhbHVlICE9PSBjaGFuZ2VkKSB7XG4gICAgICAgIG9ialtrZXldID0gY2hhbmdlZDtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgLy8gaWYgd2UgZ2V0IGhlcmUsIHZhbHVlIGlzIGFuIG9iamVjdCBidXQgbm90IGFkanVzdGFibGVcbiAgICAgIC8vIGF0IHRoaXMgbGV2ZWwuICByZWN1cnNlLlxuICAgICAgYWRqdXN0VHlwZXNGcm9tSlNPTlZhbHVlKHZhbHVlKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gb2JqO1xufTtcblxuLy8gRWl0aGVyIHJldHVybiB0aGUgYXJndW1lbnQgY2hhbmdlZCB0byBoYXZlIHRoZSBub24tanNvblxuLy8gcmVwIG9mIGl0c2VsZiAodGhlIE9iamVjdCB2ZXJzaW9uKSBvciB0aGUgYXJndW1lbnQgaXRzZWxmLlxuXG4vLyBET0VTIE5PVCBSRUNVUlNFLiAgRm9yIGFjdHVhbGx5IGdldHRpbmcgdGhlIGZ1bGx5LWNoYW5nZWQgdmFsdWUsIHVzZVxuLy8gRUpTT04uZnJvbUpTT05WYWx1ZVxudmFyIGZyb21KU09OVmFsdWVIZWxwZXIgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUgIT09IG51bGwpIHtcbiAgICBpZiAoXy5zaXplKHZhbHVlKSA8PSAyXG4gICAgICAgICYmIF8uYWxsKHZhbHVlLCBmdW5jdGlvbiAodiwgaykge1xuICAgICAgICAgIHJldHVybiB0eXBlb2YgayA9PT0gJ3N0cmluZycgJiYgay5zdWJzdHIoMCwgMSkgPT09ICckJztcbiAgICAgICAgfSkpIHtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYnVpbHRpbkNvbnZlcnRlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGNvbnZlcnRlciA9IGJ1aWx0aW5Db252ZXJ0ZXJzW2ldO1xuICAgICAgICBpZiAoY29udmVydGVyLm1hdGNoSlNPTlZhbHVlKHZhbHVlKSkge1xuICAgICAgICAgIHJldHVybiBjb252ZXJ0ZXIuZnJvbUpTT05WYWx1ZSh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIHZhbHVlO1xufTtcblxuRUpTT04uZnJvbUpTT05WYWx1ZSA9IGZ1bmN0aW9uIChpdGVtKSB7XG4gIHZhciBjaGFuZ2VkID0gZnJvbUpTT05WYWx1ZUhlbHBlcihpdGVtKTtcbiAgaWYgKGNoYW5nZWQgPT09IGl0ZW0gJiYgdHlwZW9mIGl0ZW0gPT09ICdvYmplY3QnKSB7XG4gICAgaXRlbSA9IEVKU09OLmNsb25lKGl0ZW0pO1xuICAgIGFkanVzdFR5cGVzRnJvbUpTT05WYWx1ZShpdGVtKTtcbiAgICByZXR1cm4gaXRlbTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gY2hhbmdlZDtcbiAgfVxufTtcblxuRUpTT04uc3RyaW5naWZ5ID0gZnVuY3Rpb24gKGl0ZW0pIHtcbiAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KEVKU09OLnRvSlNPTlZhbHVlKGl0ZW0pKTtcbn07XG5cbkVKU09OLnBhcnNlID0gZnVuY3Rpb24gKGl0ZW0pIHtcbiAgcmV0dXJuIEVKU09OLmZyb21KU09OVmFsdWUoSlNPTi5wYXJzZShpdGVtKSk7XG59O1xuXG5FSlNPTi5pc0JpbmFyeSA9IGZ1bmN0aW9uIChvYmopIHtcbiAgcmV0dXJuICh0eXBlb2YgVWludDhBcnJheSAhPT0gJ3VuZGVmaW5lZCcgJiYgb2JqIGluc3RhbmNlb2YgVWludDhBcnJheSkgfHxcbiAgICAob2JqICYmIG9iai4kVWludDhBcnJheVBvbHlmaWxsKTtcbn07XG5cbkVKU09OLmVxdWFscyA9IGZ1bmN0aW9uIChhLCBiLCBvcHRpb25zKSB7XG4gIHZhciBpO1xuICB2YXIga2V5T3JkZXJTZW5zaXRpdmUgPSAhIShvcHRpb25zICYmIG9wdGlvbnMua2V5T3JkZXJTZW5zaXRpdmUpO1xuICBpZiAoYSA9PT0gYilcbiAgICByZXR1cm4gdHJ1ZTtcbiAgaWYgKCFhIHx8ICFiKSAvLyBpZiBlaXRoZXIgb25lIGlzIGZhbHN5LCB0aGV5J2QgaGF2ZSB0byBiZSA9PT0gdG8gYmUgZXF1YWxcbiAgICByZXR1cm4gZmFsc2U7XG4gIGlmICghKHR5cGVvZiBhID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgYiA9PT0gJ29iamVjdCcpKVxuICAgIHJldHVybiBmYWxzZTtcbiAgaWYgKGEgaW5zdGFuY2VvZiBEYXRlICYmIGIgaW5zdGFuY2VvZiBEYXRlKVxuICAgIHJldHVybiBhLnZhbHVlT2YoKSA9PT0gYi52YWx1ZU9mKCk7XG4gIGlmIChFSlNPTi5pc0JpbmFyeShhKSAmJiBFSlNPTi5pc0JpbmFyeShiKSkge1xuICAgIGlmIChhLmxlbmd0aCAhPT0gYi5sZW5ndGgpXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgZm9yIChpID0gMDsgaSA8IGEubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChhW2ldICE9PSBiW2ldKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIGlmICh0eXBlb2YgKGEuZXF1YWxzKSA9PT0gJ2Z1bmN0aW9uJylcbiAgICByZXR1cm4gYS5lcXVhbHMoYiwgb3B0aW9ucyk7XG4gIGlmIChhIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICBpZiAoIShiIGluc3RhbmNlb2YgQXJyYXkpKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIGlmIChhLmxlbmd0aCAhPT0gYi5sZW5ndGgpXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgZm9yIChpID0gMDsgaSA8IGEubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmICghRUpTT04uZXF1YWxzKGFbaV0sIGJbaV0sIG9wdGlvbnMpKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIC8vIGZhbGwgYmFjayB0byBzdHJ1Y3R1cmFsIGVxdWFsaXR5IG9mIG9iamVjdHNcbiAgdmFyIHJldDtcbiAgaWYgKGtleU9yZGVyU2Vuc2l0aXZlKSB7XG4gICAgdmFyIGJLZXlzID0gW107XG4gICAgXy5lYWNoKGIsIGZ1bmN0aW9uICh2YWwsIHgpIHtcbiAgICAgICAgYktleXMucHVzaCh4KTtcbiAgICB9KTtcbiAgICBpID0gMDtcbiAgICByZXQgPSBfLmFsbChhLCBmdW5jdGlvbiAodmFsLCB4KSB7XG4gICAgICBpZiAoaSA+PSBiS2V5cy5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgaWYgKHggIT09IGJLZXlzW2ldKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGlmICghRUpTT04uZXF1YWxzKHZhbCwgYltiS2V5c1tpXV0sIG9wdGlvbnMpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGkrKztcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0pO1xuICAgIHJldHVybiByZXQgJiYgaSA9PT0gYktleXMubGVuZ3RoO1xuICB9IGVsc2Uge1xuICAgIGkgPSAwO1xuICAgIHJldCA9IF8uYWxsKGEsIGZ1bmN0aW9uICh2YWwsIGtleSkge1xuICAgICAgaWYgKCFfLmhhcyhiLCBrZXkpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGlmICghRUpTT04uZXF1YWxzKHZhbCwgYltrZXldLCBvcHRpb25zKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBpKys7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9KTtcbiAgICByZXR1cm4gcmV0ICYmIF8uc2l6ZShiKSA9PT0gaTtcbiAgfVxufTtcblxuRUpTT04uY2xvbmUgPSBmdW5jdGlvbiAodikge1xuICB2YXIgcmV0O1xuICBpZiAodHlwZW9mIHYgIT09IFwib2JqZWN0XCIpXG4gICAgcmV0dXJuIHY7XG4gIGlmICh2ID09PSBudWxsKVxuICAgIHJldHVybiBudWxsOyAvLyBudWxsIGhhcyB0eXBlb2YgXCJvYmplY3RcIlxuICBpZiAodiBpbnN0YW5jZW9mIERhdGUpXG4gICAgcmV0dXJuIG5ldyBEYXRlKHYuZ2V0VGltZSgpKTtcbiAgaWYgKEVKU09OLmlzQmluYXJ5KHYpKSB7XG4gICAgcmV0ID0gRUpTT04ubmV3QmluYXJ5KHYubGVuZ3RoKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHYubGVuZ3RoOyBpKyspIHtcbiAgICAgIHJldFtpXSA9IHZbaV07XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG4gIH1cbiAgaWYgKF8uaXNBcnJheSh2KSB8fCBfLmlzQXJndW1lbnRzKHYpKSB7XG4gICAgLy8gRm9yIHNvbWUgcmVhc29uLCBfLm1hcCBkb2Vzbid0IHdvcmsgaW4gdGhpcyBjb250ZXh0IG9uIE9wZXJhICh3ZWlyZCB0ZXN0XG4gICAgLy8gZmFpbHVyZXMpLlxuICAgIHJldCA9IFtdO1xuICAgIGZvciAoaSA9IDA7IGkgPCB2Lmxlbmd0aDsgaSsrKVxuICAgICAgcmV0W2ldID0gRUpTT04uY2xvbmUodltpXSk7XG4gICAgcmV0dXJuIHJldDtcbiAgfVxuICAvLyBoYW5kbGUgZ2VuZXJhbCB1c2VyLWRlZmluZWQgdHlwZWQgT2JqZWN0cyBpZiB0aGV5IGhhdmUgYSBjbG9uZSBtZXRob2RcbiAgaWYgKHR5cGVvZiB2LmNsb25lID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIHYuY2xvbmUoKTtcbiAgfVxuICAvLyBoYW5kbGUgb3RoZXIgb2JqZWN0c1xuICByZXQgPSB7fTtcbiAgXy5lYWNoKHYsIGZ1bmN0aW9uICh2YWx1ZSwga2V5KSB7XG4gICAgcmV0W2tleV0gPSBFSlNPTi5jbG9uZSh2YWx1ZSk7XG4gIH0pO1xuICByZXR1cm4gcmV0O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBFSlNPTjsiLCJQYWdlID0gcmVxdWlyZSAnLi4vUGFnZSdcbmZvcm1zID0gcmVxdWlyZSAnLi4vZm9ybXMnXG5Tb3VyY2VQYWdlID0gcmVxdWlyZSBcIi4vU291cmNlUGFnZVwiXG5cbiMgQWxsb3dzIGNyZWF0aW5nIG9mIGEgc291cmNlXG4jIFRPRE8gbG9naW4gcmVxdWlyZWRcbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgTmV3U291cmNlUGFnZSBleHRlbmRzIFBhZ2VcbiAgYWN0aXZhdGU6IC0+XG4gICAgQHNldFRpdGxlIFwiTmV3IFNvdXJjZVwiXG5cbiAgICAjIENyZWF0ZSBtb2RlbCBmcm9tIHNvdXJjZVxuICAgIEBtb2RlbCA9IG5ldyBCYWNrYm9uZS5Nb2RlbChzZXRMb2NhdGlvbjogdHJ1ZSlcbiAgXG4gICAgIyBDcmVhdGUgcXVlc3Rpb25zXG4gICAgc291cmNlVHlwZXNRdWVzdGlvbiA9IG5ldyBmb3Jtcy5Ecm9wZG93blF1ZXN0aW9uXG4gICAgICBpZDogJ3R5cGUnXG4gICAgICBtb2RlbDogQG1vZGVsXG4gICAgICBwcm9tcHQ6ICdFbnRlciBTb3VyY2UgVHlwZSdcbiAgICAgIG9wdGlvbnM6IFtdXG4gICAgQGRiLnNvdXJjZV90eXBlcy5maW5kKHt9KS5mZXRjaCAoc291cmNlVHlwZXMpID0+XG4gICAgICAjIEZpbGwgc291cmNlIHR5cGVzXG4gICAgICBzb3VyY2VUeXBlc1F1ZXN0aW9uLnNldE9wdGlvbnMgXy5tYXAoc291cmNlVHlwZXMsIChzdCkgPT4gW3N0LmNvZGUsIHN0Lm5hbWVdKVxuXG4gICAgc2F2ZUNhbmNlbEZvcm0gPSBuZXcgZm9ybXMuU2F2ZUNhbmNlbEZvcm1cbiAgICAgIGNvbnRlbnRzOiBbXG4gICAgICAgIHNvdXJjZVR5cGVzUXVlc3Rpb25cbiAgICAgICAgbmV3IGZvcm1zLlRleHRRdWVzdGlvblxuICAgICAgICAgIGlkOiAnbmFtZSdcbiAgICAgICAgICBtb2RlbDogQG1vZGVsXG4gICAgICAgICAgcHJvbXB0OiAnRW50ZXIgb3B0aW9uYWwgbmFtZSdcbiAgICAgICAgbmV3IGZvcm1zLlRleHRRdWVzdGlvblxuICAgICAgICAgIGlkOiAnZGVzYydcbiAgICAgICAgICBtb2RlbDogQG1vZGVsXG4gICAgICAgICAgcHJvbXB0OiAnRW50ZXIgb3B0aW9uYWwgZGVzY3JpcHRpb24nXG4gICAgICAgIG5ldyBmb3Jtcy5DaGVja1F1ZXN0aW9uXG4gICAgICAgICAgaWQ6ICdwcml2YXRlJ1xuICAgICAgICAgIG1vZGVsOiBAbW9kZWxcbiAgICAgICAgICBwcm9tcHQ6IFwiUHJpdmFjeVwiXG4gICAgICAgICAgdGV4dDogJ1dhdGVyIHNvdXJjZSBpcyBwcml2YXRlJ1xuICAgICAgICAgIGhpbnQ6ICdUaGlzIHNob3VsZCBvbmx5IGJlIHVzZWQgZm9yIHNvdXJjZXMgdGhhdCBhcmUgbm90IHB1YmxpY2FsbHkgYWNjZXNzaWJsZSdcbiAgICAgICAgbmV3IGZvcm1zLlJhZGlvUXVlc3Rpb25cbiAgICAgICAgICBpZDogJ3NldExvY2F0aW9uJ1xuICAgICAgICAgIG1vZGVsOiBAbW9kZWxcbiAgICAgICAgICBwcm9tcHQ6ICdTZXQgdG8gY3VycmVudCBsb2NhdGlvbj8nXG4gICAgICAgICAgb3B0aW9uczogW1t0cnVlLCAnWWVzJ10sIFtmYWxzZSwgJ05vJ11dXG4gICAgICBdXG5cbiAgICBAJGVsLmVtcHR5KCkuYXBwZW5kKHNhdmVDYW5jZWxGb3JtLmVsKVxuXG4gICAgQGxpc3RlblRvIHNhdmVDYW5jZWxGb3JtLCAnc2F2ZScsID0+XG4gICAgICBzb3VyY2UgPSBfLnBpY2soQG1vZGVsLnRvSlNPTigpLCAnbmFtZScsICdkZXNjJywgJ3R5cGUnLCAncHJpdmF0ZScpXG4gICAgICBzb3VyY2UuY29kZSA9IFwiXCIrTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpKjEwMDAwMDApICAjIFRPRE8gcmVhbCBjb2Rlc1xuICAgICAgQGRiLnNvdXJjZXMudXBzZXJ0IHNvdXJjZSwgKHNvdXJjZSkgPT4gXG4gICAgICAgIEBwYWdlci5jbG9zZVBhZ2UoU291cmNlUGFnZSwgeyBfaWQ6IHNvdXJjZS5faWQsIHNldExvY2F0aW9uOiBAbW9kZWwuZ2V0KCdzZXRMb2NhdGlvbicpfSlcblxuICAgIEBsaXN0ZW5UbyBzYXZlQ2FuY2VsRm9ybSwgJ2NhbmNlbCcsID0+XG4gICAgICBAcGFnZXIuY2xvc2VQYWdlKClcbiAiLCJQYWdlID0gcmVxdWlyZShcIi4uL1BhZ2VcIilcbkxvY2F0aW9uVmlldyA9IHJlcXVpcmUgKFwiLi4vTG9jYXRpb25WaWV3XCIpXG5mb3JtcyA9IHJlcXVpcmUgJy4uL2Zvcm1zJ1xuXG5cbiMgRGlzcGxheXMgYSBzb3VyY2VcbiMgT3B0aW9uczogc2V0TG9jYXRpb24gLSB0cnVlIHRvIGF1dG9zZXQgbG9jYXRpb25cbiMgb25TZWxlY3QgLSBjYWxsIHdoZW4gc291cmNlIGlzIHNlbGVjdGVkIHZpYSBidXR0b24gdGhhdCBhcHBlYXJzXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFNvdXJjZVBhZ2UgZXh0ZW5kcyBQYWdlXG4gIGV2ZW50czpcbiAgICAnY2xpY2sgI2VkaXRfc291cmNlX2J1dHRvbicgOiAnZWRpdFNvdXJjZSdcbiAgICAnY2xpY2sgI2FkZF90ZXN0X2J1dHRvbicgOiAnYWRkVGVzdCdcbiAgICAnY2xpY2sgI2FkZF9ub3RlX2J1dHRvbicgOiAnYWRkTm90ZSdcbiAgICAnY2xpY2sgLnRlc3QnIDogJ29wZW5UZXN0J1xuICAgICdjbGljayAubm90ZScgOiAnb3Blbk5vdGUnXG4gICAgJ2NsaWNrICNzZWxlY3Rfc291cmNlJyA6ICdzZWxlY3RTb3VyY2UnXG5cbiAgY3JlYXRlOiAtPlxuICAgIEBzZXRMb2NhdGlvbiA9IEBvcHRpb25zLnNldExvY2F0aW9uXG5cbiAgYWN0aXZhdGU6IC0+XG4gICAgQGRiLnNvdXJjZXMuZmluZE9uZSB7X2lkOiBAb3B0aW9ucy5faWR9LCAoc291cmNlKSA9PlxuICAgICAgQHNvdXJjZSA9IHNvdXJjZVxuICAgICAgQHJlbmRlcigpXG5cbiAgcmVuZGVyOiAtPlxuICAgIEBzZXRUaXRsZSBcIlNvdXJjZSBcIiArIEBzb3VyY2UuY29kZVxuXG4gICAgQHNldHVwQ29udGV4dE1lbnUgW1xuICAgICAgeyBnbHlwaDogJ3JlbW92ZScsIHRleHQ6IFwiRGVsZXRlIFNvdXJjZVwiLCBjbGljazogPT4gQGRlbGV0ZVNvdXJjZSgpIH1cbiAgICBdXG5cbiAgICBAc2V0dXBCdXR0b25CYXIgW1xuICAgICAgeyBpY29uOiBcInBsdXMucG5nXCIsIG1lbnU6IFtcbiAgICAgICAgeyB0ZXh0OiBcIlN0YXJ0IFdhdGVyIFRlc3RcIiwgY2xpY2s6ID0+IEBhZGRUZXN0KCkgfVxuICAgICAgICB7IHRleHQ6IFwiQWRkIE5vdGVcIiwgY2xpY2s6ID0+IEBhZGROb3RlKCkgfVxuICAgICAgXX1cbiAgICBdXG5cbiAgICAjIFJlLXJlbmRlciB0ZW1wbGF0ZVxuICAgIEByZW1vdmVTdWJ2aWV3cygpXG4gICAgQCRlbC5odG1sIHRlbXBsYXRlc1sncGFnZXMvU291cmNlUGFnZSddKHNvdXJjZTogQHNvdXJjZSwgc2VsZWN0OiBAb3B0aW9ucy5vblNlbGVjdD8pXG5cbiAgICAjIFNldCBzb3VyY2UgdHlwZVxuICAgIGlmIEBzb3VyY2UudHlwZT9cbiAgICAgIEBkYi5zb3VyY2VfdHlwZXMuZmluZE9uZSB7Y29kZTogQHNvdXJjZS50eXBlfSwgKHNvdXJjZVR5cGUpID0+XG4gICAgICAgIGlmIHNvdXJjZVR5cGU/IHRoZW4gQCQoXCIjc291cmNlX3R5cGVcIikudGV4dChzb3VyY2VUeXBlLm5hbWUpXG5cbiAgICAjIEFkZCBsb2NhdGlvbiB2aWV3XG4gICAgbG9jYXRpb25WaWV3ID0gbmV3IExvY2F0aW9uVmlldyhsb2M6IEBzb3VyY2UuZ2VvKVxuICAgIGlmIEBzZXRMb2NhdGlvblxuICAgICAgbG9jYXRpb25WaWV3LnNldExvY2F0aW9uKClcbiAgICAgIEBzZXRMb2NhdGlvbiA9IGZhbHNlXG5cbiAgICBAbGlzdGVuVG8gbG9jYXRpb25WaWV3LCAnbG9jYXRpb25zZXQnLCAobG9jKSAtPlxuICAgICAgQHNvdXJjZS5nZW8gPSBsb2NcbiAgICAgIEBkYi5zb3VyY2VzLnVwc2VydCBAc291cmNlLCA9PiBAcmVuZGVyKClcblxuICAgIEBsaXN0ZW5UbyBsb2NhdGlvblZpZXcsICdtYXAnLCAobG9jKSAtPlxuICAgICAgQHBhZ2VyLm9wZW5QYWdlKHJlcXVpcmUoXCIuL1NvdXJjZU1hcFBhZ2VcIiksIHtpbml0aWFsR2VvOiBsb2N9KVxuICAgICAgXG4gICAgQGFkZFN1YnZpZXcobG9jYXRpb25WaWV3KVxuICAgIEAkKFwiI2xvY2F0aW9uXCIpLmFwcGVuZChsb2NhdGlvblZpZXcuZWwpXG5cbiAgICAjIEFkZCB0ZXN0c1xuICAgIEBkYi50ZXN0cy5maW5kKHtzb3VyY2U6IEBzb3VyY2UuY29kZX0pLmZldGNoICh0ZXN0cykgLT4gIyBUT0RPIHNvdXJjZS5jb2RlPyBcbiAgICAgIEAkKFwiI3Rlc3RzXCIpLmh0bWwgdGVtcGxhdGVzWydwYWdlcy9Tb3VyY2VQYWdlX3Rlc3RzJ10odGVzdHM6dGVzdHMpXG5cbiAgICAjIEFkZCBub3Rlc1xuICAgIEBkYi5zb3VyY2Vfbm90ZXMuZmluZCh7c291cmNlOiBAc291cmNlLmNvZGV9KS5mZXRjaCAobm90ZXMpIC0+ICAjIFRPRE8gc291cmNlLmNvZGU/XG4gICAgICBAJChcIiNub3Rlc1wiKS5odG1sIHRlbXBsYXRlc1sncGFnZXMvU291cmNlUGFnZV9ub3RlcyddKG5vdGVzOm5vdGVzKVxuXG4gICAgIyBBZGQgcGhvdG9zICMgVE9ETyB3aXJlIG1vZGVsIHRvIGFjdHVhbCBkYlxuICAgIHBob3Rvc1ZpZXcgPSBuZXcgZm9ybXMuUGhvdG9zUXVlc3Rpb25cbiAgICAgIGlkOiAncGhvdG9zJ1xuICAgICAgbW9kZWw6IG5ldyBCYWNrYm9uZS5Nb2RlbChAc291cmNlKVxuICAgICAgcHJvbXB0OiAnUGhvdG9zJ1xuICAgICAgY3R4OiBAY3R4XG4gICAgICBcbiAgICBwaG90b3NWaWV3Lm1vZGVsLm9uICdjaGFuZ2UnLCA9PlxuICAgICAgQGRiLnNvdXJjZXMudXBzZXJ0IEBzb3VyY2UudG9KU09OKCksID0+IEByZW5kZXIoKVxuICAgIEAkKCcjcGhvdG9zJykuYXBwZW5kKHBob3Rvc1ZpZXcuZWwpXG5cbiAgZWRpdFNvdXJjZTogLT5cbiAgICBAcGFnZXIub3BlblBhZ2UocmVxdWlyZShcIi4vU291cmNlRWRpdFBhZ2VcIiksIHsgX2lkOiBAc291cmNlLl9pZH0pXG5cbiAgZGVsZXRlU291cmNlOiAtPlxuICAgIGlmIGNvbmZpcm0oXCJQZXJtYW5lbnRseSBkZWxldGUgc291cmNlP1wiKVxuICAgICAgQGRiLnNvdXJjZXMucmVtb3ZlIEBzb3VyY2UuX2lkLCA9PlxuICAgICAgICBAcGFnZXIuY2xvc2VQYWdlKClcbiAgICAgICAgQHBhZ2VyLmZsYXNoIFwiU291cmNlIGRlbGV0ZWRcIiwgXCJzdWNjZXNzXCJcblxuICBhZGRUZXN0OiAtPlxuICAgIEBwYWdlci5vcGVuUGFnZShyZXF1aXJlKFwiLi9OZXdUZXN0UGFnZVwiKSwgeyBzb3VyY2U6IEBzb3VyY2UuY29kZX0pXG5cbiAgb3BlblRlc3Q6IChldikgLT5cbiAgICBAcGFnZXIub3BlblBhZ2UocmVxdWlyZShcIi4vVGVzdFBhZ2VcIiksIHsgX2lkOiBldi5jdXJyZW50VGFyZ2V0LmlkfSlcblxuICBhZGROb3RlOiAtPlxuICAgIEBwYWdlci5vcGVuUGFnZShyZXF1aXJlKFwiLi9Tb3VyY2VOb3RlUGFnZVwiKSwgeyBzb3VyY2U6IEBzb3VyY2UuY29kZX0pICAgIyBUT0RPIGlkIG9yIGNvZGU/XG5cbiAgb3Blbk5vdGU6IChldikgLT5cbiAgICBAcGFnZXIub3BlblBhZ2UocmVxdWlyZShcIi4vU291cmNlTm90ZVBhZ2VcIiksIHsgc291cmNlOiBAc291cmNlLmNvZGUsIF9pZDogZXYuY3VycmVudFRhcmdldC5pZH0pXG5cbiAgc2VsZWN0U291cmNlOiAtPlxuICAgIGlmIEBvcHRpb25zLm9uU2VsZWN0P1xuICAgICAgQHBhZ2VyLmNsb3NlUGFnZSgpXG4gICAgICBAb3B0aW9ucy5vblNlbGVjdChAc291cmNlKSIsIlBhZ2UgPSByZXF1aXJlIFwiLi4vUGFnZVwiXG5Tb3VyY2VQYWdlID0gcmVxdWlyZSBcIi4vU291cmNlUGFnZVwiXG5JdGVtVHJhY2tlciA9IHJlcXVpcmUgXCIuLi9JdGVtVHJhY2tlclwiXG5Mb2NhdGlvbkZpbmRlciA9IHJlcXVpcmUgJy4uL0xvY2F0aW9uRmluZGVyJ1xuR2VvSlNPTiA9IHJlcXVpcmUgJy4uL0dlb0pTT04nXG5cbiMgTWFwIG9mIHdhdGVyIHNvdXJjZXMuIE9wdGlvbnMgaW5jbHVkZTpcbiMgaW5pdGlhbEdlbzogR2VvbWV0cnkgdG8gem9vbSB0by4gUG9pbnQgb25seSBzdXBwb3J0ZWQuXG5jbGFzcyBTb3VyY2VNYXBQYWdlIGV4dGVuZHMgUGFnZVxuICBjcmVhdGU6IC0+XG4gICAgQHNldFRpdGxlIFwiU291cmNlIE1hcFwiXG5cbiAgICAjIENhbGN1bGF0ZSBoZWlnaHRcbiAgICBAJGVsLmh0bWwgdGVtcGxhdGVzWydwYWdlcy9Tb3VyY2VNYXBQYWdlJ10oKVxuXG4gICAgTC5JY29uLkRlZmF1bHQuaW1hZ2VQYXRoID0gXCJpbWcvbGVhZmxldFwiXG4gICAgQG1hcCA9IEwubWFwKHRoaXMuJChcIiNtYXBcIilbMF0pXG4gICAgTC5jb250cm9sLnNjYWxlKGltcGVyaWFsOmZhbHNlKS5hZGRUbyhAbWFwKVxuICAgIEByZXNpemVNYXAoKVxuXG4gICAgIyBSZWNhbGN1bGF0ZSBvbiByZXNpemVcbiAgICAkKHdpbmRvdykub24oJ3Jlc2l6ZScsIEByZXNpemVNYXApXG5cbiAgICAjIFNldHVwIG1hcCB0aWxlc1xuICAgIHNldHVwTWFwVGlsZXMoKS5hZGRUbyhAbWFwKVxuXG4gICAgIyBTZXR1cCBtYXJrZXIgZGlzcGxheVxuICAgIEBzb3VyY2VEaXNwbGF5ID0gbmV3IFNvdXJjZURpc3BsYXkoQG1hcCwgQGRiLCBAcGFnZXIpXG5cbiAgICAjIFRPRE8gem9vbSB0byBsYXN0IGtub3duIGJvdW5kc1xuICAgIFxuICAgICMgU2V0dXAgaW5pdGlhbCB6b29tXG4gICAgaWYgQG9wdGlvbnMuaW5pdGlhbEdlbyBhbmQgQG9wdGlvbnMuaW5pdGlhbEdlby50eXBlPT1cIlBvaW50XCJcbiAgICAgIEBtYXAuc2V0VmlldyhMLkdlb0pTT04uY29vcmRzVG9MYXRMbmcoQG9wdGlvbnMuaW5pdGlhbEdlby5jb29yZGluYXRlcyksIDE1KVxuXG4gICAgIyBTZXR1cCBsb2NhbHRpb24gZGlzcGxheVxuICAgIEBsb2NhdGlvbkRpc3BsYXkgPSBuZXcgTG9jYXRpb25EaXNwbGF5KEBtYXAsIG5vdCBAb3B0aW9ucy5pbml0aWFsR2VvPylcblxuICBkZXN0cm95OiAtPlxuICAgICQod2luZG93KS5vZmYoJ3Jlc2l6ZScsIEByZXNpemVNYXApXG4gICAgQGxvY2F0aW9uRGlzcGxheS5zdG9wKClcblxuICByZXNpemVNYXA6ID0+XG4gICAgIyBDYWxjdWxhdGUgbWFwIGhlaWdodFxuICAgIG1hcEhlaWdodCA9ICQoXCJodG1sXCIpLmhlaWdodCgpIC0gNDBcbiAgICAkKFwiI21hcFwiKS5jc3MoXCJoZWlnaHRcIiwgbWFwSGVpZ2h0ICsgXCJweFwiKVxuICAgIEBtYXAuaW52YWxpZGF0ZVNpemUoKVxuXG5cbnNldHVwTWFwVGlsZXMgPSAtPlxuICBtYXBxdWVzdFVybCA9ICdodHRwOi8ve3N9Lm1xY2RuLmNvbS90aWxlcy8xLjAuMC9vc20ve3p9L3t4fS97eX0ucG5nJ1xuICBzdWJEb21haW5zID0gWydvdGlsZTEnLCdvdGlsZTInLCdvdGlsZTMnLCdvdGlsZTQnXVxuICBtYXBxdWVzdEF0dHJpYiA9ICdEYXRhLCBpbWFnZXJ5IGFuZCBtYXAgaW5mb3JtYXRpb24gcHJvdmlkZWQgYnkgPGEgaHJlZj1cImh0dHA6Ly9vcGVuLm1hcHF1ZXN0LmNvLnVrXCIgdGFyZ2V0PVwiX2JsYW5rXCI+TWFwUXVlc3Q8L2E+LCA8YSBocmVmPVwiaHR0cDovL3d3dy5vcGVuc3RyZWV0bWFwLm9yZy9cIiB0YXJnZXQ9XCJfYmxhbmtcIj5PcGVuU3RyZWV0TWFwPC9hPiBhbmQgY29udHJpYnV0b3JzLidcbiAgcmV0dXJuIG5ldyBMLlRpbGVMYXllcihtYXBxdWVzdFVybCwge21heFpvb206IDE4LCBhdHRyaWJ1dGlvbjogbWFwcXVlc3RBdHRyaWIsIHN1YmRvbWFpbnM6IHN1YkRvbWFpbnN9KVxuXG5jbGFzcyBTb3VyY2VEaXNwbGF5XG4gIGNvbnN0cnVjdG9yOiAobWFwLCBkYiwgcGFnZXIpIC0+XG4gICAgQG1hcCA9IG1hcFxuICAgIEBkYiA9IGRiXG4gICAgQHBhZ2VyID0gcGFnZXJcbiAgICBAaXRlbVRyYWNrZXIgPSBuZXcgSXRlbVRyYWNrZXIoKVxuXG4gICAgQHNvdXJjZU1hcmtlcnMgPSB7fVxuICAgIEBtYXAub24oJ21vdmVlbmQnLCBAdXBkYXRlTWFya2VycylcblxuICAgIEBpY29uID0gbmV3IEwuaWNvblxuICAgICAgaWNvblVybDogJ2ltZy9Ecm9wTWFya2VyLnBuZydcbiAgICAgIGljb25SZXRpbmFVcmw6ICdpbWcvRHJvcE1hcmtlckAyeC5wbmcnXG4gICAgICBpY29uU2l6ZTogWzI3LCA0MV0sXG4gICAgICBpY29uQW5jaG9yOiBbMTMsIDQxXVxuICAgICAgcG9wdXBBbmNob3I6IFstMywgLTQxXVxuICBcbiAgdXBkYXRlTWFya2VyczogPT5cbiAgICAjIEdldCBib3VuZHMgcGFkZGVkXG4gICAgYm91bmRzID0gQG1hcC5nZXRCb3VuZHMoKS5wYWQoMC4zMylcblxuICAgIGJvdW5kc0dlb0pTT04gPSBHZW9KU09OLmxhdExuZ0JvdW5kc1RvR2VvSlNPTihib3VuZHMpXG4gICAgc2VsZWN0b3IgPSB7IGdlbzogeyAkZ2VvSW50ZXJzZWN0czogeyAkZ2VvbWV0cnk6IGJvdW5kc0dlb0pTT04gfSB9IH1cblxuICAgICMgUXVlcnkgc291cmNlcyB3aXRoIHByb2plY3Rpb24gVE9ET1xuICAgIEBkYi5zb3VyY2VzLmZpbmQoc2VsZWN0b3IsIHsgc29ydDogW1wiX2lkXCJdLCBsaW1pdDogMTAwIH0pLmZldGNoIChzb3VyY2VzKSA9PlxuICAgICAgIyBGaW5kIG91dCB3aGljaCB0byBhZGQvcmVtb3ZlXG4gICAgICBbYWRkcywgcmVtb3Zlc10gPSBAaXRlbVRyYWNrZXIudXBkYXRlKHNvdXJjZXMpXG5cbiAgICAgICMgUmVtb3ZlIG9sZCBtYXJrZXJzXG4gICAgICBmb3IgcmVtb3ZlIGluIHJlbW92ZXNcbiAgICAgICAgQHJlbW92ZVNvdXJjZU1hcmtlcihyZW1vdmUpXG4gICAgICBmb3IgYWRkIGluIGFkZHNcbiAgICAgICAgQGFkZFNvdXJjZU1hcmtlcihhZGQpXG5cbiAgYWRkU291cmNlTWFya2VyOiAoc291cmNlKSAtPlxuICAgIGlmIHNvdXJjZS5nZW8/XG4gICAgICBsYXRsbmcgPSBuZXcgTC5MYXRMbmcoc291cmNlLmdlby5jb29yZGluYXRlc1sxXSwgc291cmNlLmdlby5jb29yZGluYXRlc1swXSlcbiAgICAgIG1hcmtlciA9IG5ldyBMLk1hcmtlcihsYXRsbmcsIHtpY29uOkBpY29ufSlcbiAgICAgIFxuICAgICAgbWFya2VyLm9uICdjbGljaycsID0+XG4gICAgICAgIEBwYWdlci5vcGVuUGFnZShTb3VyY2VQYWdlLCB7X2lkOiBzb3VyY2UuX2lkfSlcbiAgICAgIFxuICAgICAgQHNvdXJjZU1hcmtlcnNbc291cmNlLl9pZF0gPSBtYXJrZXJcbiAgICAgIG1hcmtlci5hZGRUbyhAbWFwKVxuXG4gIHJlbW92ZVNvdXJjZU1hcmtlcjogKHNvdXJjZSkgLT5cbiAgICBpZiBfLmhhcyhAc291cmNlTWFya2Vycywgc291cmNlLl9pZClcbiAgICAgIEBtYXAucmVtb3ZlTGF5ZXIoQHNvdXJjZU1hcmtlcnNbc291cmNlLl9pZF0pXG5cblxuY2xhc3MgTG9jYXRpb25EaXNwbGF5XG4gICMgU2V0dXAgZGlzcGxheSwgb3B0aW9uYWxseSB6b29taW5nIHRvIGN1cnJlbnQgbG9jYXRpb25cbiAgY29uc3RydWN0b3I6IChtYXAsIHpvb21UbykgLT5cbiAgICBAbWFwID0gbWFwXG4gICAgQHpvb21UbyA9IHpvb21Ub1xuXG4gICAgQGxvY2F0aW9uRmluZGVyID0gbmV3IExvY2F0aW9uRmluZGVyKClcbiAgICBAbG9jYXRpb25GaW5kZXIub24oJ2ZvdW5kJywgQGxvY2F0aW9uRm91bmQpLm9uKCdlcnJvcicsIEBsb2NhdGlvbkVycm9yKVxuICAgIEBsb2NhdGlvbkZpbmRlci5zdGFydFdhdGNoKClcblxuICBzdG9wOiAtPlxuICAgIEBsb2NhdGlvbkZpbmRlci5zdG9wV2F0Y2goKVxuXG4gIGxvY2F0aW9uRXJyb3I6IChlKSA9PlxuICAgIGlmIEB6b29tVG9cbiAgICAgIEBtYXAuZml0V29ybGQoKVxuICAgICAgQHpvb21UbyA9IGZhbHNlXG4gICAgICBhbGVydChcIlVuYWJsZSB0byBkZXRlcm1pbmUgbG9jYXRpb25cIilcblxuICBsb2NhdGlvbkZvdW5kOiAoZSkgPT5cbiAgICByYWRpdXMgPSBlLmNvb3Jkcy5hY2N1cmFjeVxuICAgIGxhdGxuZyA9IG5ldyBMLkxhdExuZyhlLmNvb3Jkcy5sYXRpdHVkZSwgZS5jb29yZHMubG9uZ2l0dWRlKVxuXG4gICAgIyBTZXQgcG9zaXRpb24gb25jZVxuICAgIGlmIEB6b29tVG9cbiAgICAgIHpvb20gPSAxNVxuICAgICAgQG1hcC5zZXRWaWV3KGxhdGxuZywgem9vbSlcbiAgICAgIEB6b29tVG8gPSBmYWxzZVxuXG4gICAgIyBTZXR1cCBtYXJrZXIgYW5kIGNpcmNsZVxuICAgIGlmIG5vdCBAbWVNYXJrZXJcbiAgICAgIGljb24gPSAgTC5pY29uKGljb25Vcmw6IFwiaW1nL215X2xvY2F0aW9uLnBuZ1wiLCBpY29uU2l6ZTogWzIyLCAyMl0pXG4gICAgICBAbWVNYXJrZXIgPSBMLm1hcmtlcihsYXRsbmcsIGljb246aWNvbikuYWRkVG8oQG1hcClcbiAgICAgIEBtZUNpcmNsZSA9IEwuY2lyY2xlKGxhdGxuZywgcmFkaXVzKVxuICAgICAgQG1lQ2lyY2xlLmFkZFRvKEBtYXApXG4gICAgZWxzZVxuICAgICAgQG1lTWFya2VyLnNldExhdExuZyhsYXRsbmcpXG4gICAgICBAbWVDaXJjbGUuc2V0TGF0TG5nKGxhdGxuZykuc2V0UmFkaXVzKHJhZGl1cylcblxubW9kdWxlLmV4cG9ydHMgPSBTb3VyY2VNYXBQYWdlIiwiUGFnZSA9IHJlcXVpcmUgXCIuLi9QYWdlXCJcblRlc3RQYWdlID0gcmVxdWlyZSBcIi4vVGVzdFBhZ2VcIlxuXG4jIFBhcmFtZXRlciBpcyBvcHRpb25hbCBzb3VyY2UgY29kZVxuY2xhc3MgTmV3VGVzdFBhZ2UgZXh0ZW5kcyBQYWdlXG4gIGV2ZW50czogXG4gICAgXCJjbGljayAudGVzdFwiIDogXCJzdGFydFRlc3RcIlxuXG4gIGFjdGl2YXRlOiAtPlxuICAgIEBzZXRUaXRsZSBcIlNlbGVjdCBUZXN0XCJcblxuICAgIEBkYi5mb3Jtcy5maW5kKHt0eXBlOlwiV2F0ZXJUZXN0XCJ9KS5mZXRjaCAoZm9ybXMpID0+XG4gICAgICBAZm9ybXMgPSBmb3Jtc1xuICAgICAgQCRlbC5odG1sIHRlbXBsYXRlc1sncGFnZXMvTmV3VGVzdFBhZ2UnXShmb3Jtczpmb3JtcylcblxuICBzdGFydFRlc3Q6IChldikgLT5cbiAgICB0ZXN0Q29kZSA9IGV2LmN1cnJlbnRUYXJnZXQuaWRcblxuICAgICMgQ3JlYXRlIHRlc3RcbiAgICB0ZXN0ID0ge1xuICAgICAgc291cmNlOiBAb3B0aW9ucy5zb3VyY2VcbiAgICAgIHR5cGU6IHRlc3RDb2RlXG4gICAgICBjb21wbGV0ZWQ6IG51bGxcbiAgICAgIHN0YXJ0ZWQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKVxuICAgICAgbmFtZTogXy5maW5kV2hlcmUoQGZvcm1zLCB7IGNvZGU6IHRlc3RDb2RlIH0pLm5hbWUgICMgVE9ETyBkb24ndCBwdXQgbmFtZSBoZXJlPyBBbHNvIGZpeCBpbiBUZXN0TGlzdFBhZ2VcbiAgICB9XG4gICAgQGRiLnRlc3RzLnVwc2VydCB0ZXN0LCAodGVzdCkgPT5cbiAgICAgIEBwYWdlci5jbG9zZVBhZ2UoVGVzdFBhZ2UsIHsgX2lkOiB0ZXN0Ll9pZCB9KVxuXG5tb2R1bGUuZXhwb3J0cyA9IE5ld1Rlc3RQYWdlIiwiUGFnZSA9IHJlcXVpcmUgJy4uL1BhZ2UnXG5mb3JtcyA9IHJlcXVpcmUgJy4uL2Zvcm1zJ1xuXG4jIEFsbG93cyBlZGl0aW5nIG9mIHNvdXJjZSBkZXRhaWxzXG4jIFRPRE8gbG9naW4gcmVxdWlyZWRcbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgU291cmNlRWRpdFBhZ2UgZXh0ZW5kcyBQYWdlXG4gIGFjdGl2YXRlOiAtPlxuICAgIEBkYi5zb3VyY2VzLmZpbmRPbmUge19pZDogQG9wdGlvbnMuX2lkfSwgKHNvdXJjZSkgPT5cbiAgICAgIEBzZXRUaXRsZSBcIkVkaXQgU291cmNlICN7c291cmNlLmNvZGV9XCJcblxuICAgICAgIyBDcmVhdGUgbW9kZWwgZnJvbSBzb3VyY2VcbiAgICAgIEBtb2RlbCA9IG5ldyBCYWNrYm9uZS5Nb2RlbChzb3VyY2UpXG4gIFxuICAgICAgIyBDcmVhdGUgcXVlc3Rpb25zXG4gICAgICBzb3VyY2VUeXBlc1F1ZXN0aW9uID0gbmV3IGZvcm1zLkRyb3Bkb3duUXVlc3Rpb25cbiAgICAgICAgaWQ6ICd0eXBlJ1xuICAgICAgICBtb2RlbDogQG1vZGVsXG4gICAgICAgIHByb21wdDogJ0VudGVyIFNvdXJjZSBUeXBlJ1xuICAgICAgICBvcHRpb25zOiBbXVxuICAgICAgQGRiLnNvdXJjZV90eXBlcy5maW5kKHt9KS5mZXRjaCAoc291cmNlVHlwZXMpID0+XG4gICAgICAgICMgRmlsbCBzb3VyY2UgdHlwZXNcbiAgICAgICAgc291cmNlVHlwZXNRdWVzdGlvbi5zZXRPcHRpb25zIF8ubWFwKHNvdXJjZVR5cGVzLCAoc3QpID0+IFtzdC5jb2RlLCBzdC5uYW1lXSlcblxuICAgICAgc2F2ZUNhbmNlbEZvcm0gPSBuZXcgZm9ybXMuU2F2ZUNhbmNlbEZvcm1cbiAgICAgICAgY29udGVudHM6IFtcbiAgICAgICAgICBzb3VyY2VUeXBlc1F1ZXN0aW9uXG4gICAgICAgICAgbmV3IGZvcm1zLlRleHRRdWVzdGlvblxuICAgICAgICAgICAgaWQ6ICduYW1lJ1xuICAgICAgICAgICAgbW9kZWw6IEBtb2RlbFxuICAgICAgICAgICAgcHJvbXB0OiAnRW50ZXIgb3B0aW9uYWwgbmFtZSdcbiAgICAgICAgICBuZXcgZm9ybXMuVGV4dFF1ZXN0aW9uXG4gICAgICAgICAgICBpZDogJ2Rlc2MnXG4gICAgICAgICAgICBtb2RlbDogQG1vZGVsXG4gICAgICAgICAgICBwcm9tcHQ6ICdFbnRlciBvcHRpb25hbCBkZXNjcmlwdGlvbidcbiAgICAgICAgICBuZXcgZm9ybXMuQ2hlY2tRdWVzdGlvblxuICAgICAgICAgICAgaWQ6ICdwcml2YXRlJ1xuICAgICAgICAgICAgbW9kZWw6IEBtb2RlbFxuICAgICAgICAgICAgcHJvbXB0OiBcIlByaXZhY3lcIlxuICAgICAgICAgICAgdGV4dDogJ1dhdGVyIHNvdXJjZSBpcyBwcml2YXRlJ1xuICAgICAgICAgICAgaGludDogJ1RoaXMgc2hvdWxkIG9ubHkgYmUgdXNlZCBmb3Igc291cmNlcyB0aGF0IGFyZSBub3QgcHVibGljYWxseSBhY2Nlc3NpYmxlJ1xuICAgICAgICBdXG5cbiAgICAgIEAkZWwuZW1wdHkoKS5hcHBlbmQoc2F2ZUNhbmNlbEZvcm0uZWwpXG5cbiAgICAgIEBsaXN0ZW5UbyBzYXZlQ2FuY2VsRm9ybSwgJ3NhdmUnLCA9PlxuICAgICAgICBAZGIuc291cmNlcy51cHNlcnQgQG1vZGVsLnRvSlNPTigpLCA9PiBAcGFnZXIuY2xvc2VQYWdlKClcblxuICAgICAgQGxpc3RlblRvIHNhdmVDYW5jZWxGb3JtLCAnY2FuY2VsJywgPT5cbiAgICAgICAgQHBhZ2VyLmNsb3NlUGFnZSgpXG4gIiwiUGFnZSA9IHJlcXVpcmUgJy4uL1BhZ2UnXG5mb3JtcyA9IHJlcXVpcmUgJy4uL2Zvcm1zJ1xuXG4jIEFsbG93cyBjcmVhdGluZy9lZGl0aW5nIG9mIHNvdXJjZSBub3Rlc1xuIyBPcHRpb25zIGFyZSBcbiMgX2lkOiBpZCBvZiBzb3VyY2Ugbm90ZVxuIyBzb3VyY2U6IGNvZGUgb2Ygc291cmNlXG5cbiMgVE9ETyBsb2dpbiByZXF1aXJlZFxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBTb3VyY2VOb3RlUGFnZSBleHRlbmRzIFBhZ2VcbiAgYWN0aXZhdGU6IC0+XG4gICAgIyBGaW5kIHdhdGVyIHNvdXJjZVxuICAgIEBkYi5zb3VyY2VzLmZpbmRPbmUge2NvZGU6IEBvcHRpb25zLnNvdXJjZX0sIChzb3VyY2UpID0+XG4gICAgICBAc2V0VGl0bGUgXCJOb3RlIGZvciBTb3VyY2UgI3tzb3VyY2UuY29kZX1cIlxuXG4gICAgICAjIENyZWF0ZSBtb2RlbCBcbiAgICAgIEBtb2RlbCA9IG5ldyBCYWNrYm9uZS5Nb2RlbCgpXG4gIFxuICAgICAgIyBDcmVhdGUgcXVlc3Rpb25zXG4gICAgICBzYXZlQ2FuY2VsRm9ybSA9IG5ldyBmb3Jtcy5TYXZlQ2FuY2VsRm9ybVxuICAgICAgICBjb250ZW50czogW1xuICAgICAgICAgIG5ldyBmb3Jtcy5EYXRlUXVlc3Rpb25cbiAgICAgICAgICAgIGlkOiAnZGF0ZSdcbiAgICAgICAgICAgIG1vZGVsOiBAbW9kZWxcbiAgICAgICAgICAgIHByb21wdDogJ0RhdGUgb2YgVmlzaXQnXG4gICAgICAgICAgICByZXF1aXJlZDogdHJ1ZVxuICAgICAgICAgIG5ldyBmb3Jtcy5SYWRpb1F1ZXN0aW9uXG4gICAgICAgICAgICBpZDogJ3N0YXR1cydcbiAgICAgICAgICAgIG1vZGVsOiBAbW9kZWxcbiAgICAgICAgICAgIHByb21wdDogJ1N0YXR1cyBvZiBXYXRlciBTb3VyY2UnXG4gICAgICAgICAgICBvcHRpb25zOiBbWydvaycsICdGdW5jdGlvbmFsJ10sIFsncmVwYWlyJywgJ05lZWRzIHJlcGFpciddLCBbJ2Jyb2tlbicsICdOb24tZnVuY3Rpb25hbCddLCBbJ21pc3NpbmcnLCAnTm8gbG9uZ2VyIGV4aXN0cyddXVxuICAgICAgICAgICAgcmVxdWlyZWQ6IHRydWVcbiAgICAgICAgICBuZXcgZm9ybXMuVGV4dFF1ZXN0aW9uXG4gICAgICAgICAgICBpZDogJ25vdGVzJ1xuICAgICAgICAgICAgbW9kZWw6IEBtb2RlbFxuICAgICAgICAgICAgcHJvbXB0OiAnTm90ZXMnXG4gICAgICAgICAgICBtdWx0aWxpbmU6IHRydWVcbiAgICAgICAgXVxuXG4gICAgICAjIExvYWQgZm9ybSBmcm9tIHNvdXJjZSBub3RlIGlmIGV4aXN0c1xuICAgICAgaWYgQG9wdGlvbnMuX2lkXG4gICAgICAgIEBkYi5zb3VyY2Vfbm90ZXMuZmluZE9uZSB7X2lkOiBAb3B0aW9ucy5faWR9LCAoc291cmNlTm90ZSkgPT5cbiAgICAgICAgICBAbW9kZWwuc2V0KHNvdXJjZU5vdGUpXG4gICAgICBlbHNlXG4gICAgICAgICMgQ3JlYXRlIGRlZmF1bHQgZW50cnlcbiAgICAgICAgQG1vZGVsLnNldChzb3VyY2U6IEBvcHRpb25zLnNvdXJjZSwgZGF0ZTogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnN1YnN0cmluZygwLDEwKSlcblxuICAgICAgQCRlbC5lbXB0eSgpLmFwcGVuZChzYXZlQ2FuY2VsRm9ybS5lbClcblxuICAgICAgQGxpc3RlblRvIHNhdmVDYW5jZWxGb3JtLCAnc2F2ZScsID0+XG4gICAgICAgIEBkYi5zb3VyY2Vfbm90ZXMudXBzZXJ0IEBtb2RlbC50b0pTT04oKSwgPT4gQHBhZ2VyLmNsb3NlUGFnZSgpXG5cbiAgICAgIEBsaXN0ZW5UbyBzYXZlQ2FuY2VsRm9ybSwgJ2NhbmNlbCcsID0+XG4gICAgICAgIEBwYWdlci5jbG9zZVBhZ2UoKVxuICIsIlBhZ2UgPSByZXF1aXJlIFwiLi4vUGFnZVwiXG5mb3JtcyA9IHJlcXVpcmUgJy4uL2Zvcm1zJ1xuXG5jbGFzcyBUZXN0UGFnZSBleHRlbmRzIFBhZ2VcbiAgY3JlYXRlOiAtPiBAcmVuZGVyKClcblxuICBhY3RpdmF0ZTogLT5cbiAgICBAc2V0dXBDb250ZXh0TWVudSBbXG4gICAgICB7IGdseXBoOiAncmVtb3ZlJywgdGV4dDogXCJEZWxldGUgVGVzdFwiLCBjbGljazogPT4gQGRlbGV0ZVRlc3QoKSB9XG4gICAgXVxuXG4gIHJlbmRlcjogLT5cbiAgICBAc2V0VGl0bGUgXCJUZXN0XCIgIyBUT0RPIG5pY2VyIHRpdGxlXG5cbiAgICAjIEdldCB0ZXN0XG4gICAgQGRiLnRlc3RzLmZpbmRPbmUge19pZDogQG9wdGlvbnMuX2lkfSwgKHRlc3QpID0+XG4gICAgICBAdGVzdCA9IHRlc3RcblxuICAgICAgIyBHZXQgZm9ybVxuICAgICAgQGRiLmZvcm1zLmZpbmRPbmUgeyB0eXBlOiBcIldhdGVyVGVzdFwiLCBjb2RlOiB0ZXN0LnR5cGUgfSwgKGZvcm0pID0+XG4gICAgICAgICMgQ2hlY2sgaWYgY29tcGxldGVkXG4gICAgICAgIGlmIG5vdCB0ZXN0LmNvbXBsZXRlZFxuICAgICAgICAgIEBmb3JtVmlldyA9IGZvcm1zLmluc3RhbnRpYXRlVmlldyhmb3JtLnZpZXdzLmVkaXQsIHsgY3R4OiBAY3R4IH0pXG5cbiAgICAgICAgICAjIExpc3RlbiB0byBldmVudHNcbiAgICAgICAgICBAbGlzdGVuVG8gQGZvcm1WaWV3LCAnY2hhbmdlJywgQHNhdmVcbiAgICAgICAgICBAbGlzdGVuVG8gQGZvcm1WaWV3LCAnY29tcGxldGUnLCBAY29tcGxldGVkXG4gICAgICAgICAgQGxpc3RlblRvIEBmb3JtVmlldywgJ2Nsb3NlJywgQGNsb3NlXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBAZm9ybVZpZXcgPSBmb3Jtcy5pbnN0YW50aWF0ZVZpZXcoZm9ybS52aWV3cy5kZXRhaWwsIHsgY3R4OiBAY3R4IH0pXG4gIFxuICAgICAgICAjIFRPRE8gZGlzYWJsZSBpZiBub24tZWRpdGFibGVcbiAgICAgICAgQCRlbC5odG1sIHRlbXBsYXRlc1sncGFnZXMvVGVzdFBhZ2UnXShjb21wbGV0ZWQ6IHRlc3QuY29tcGxldGVkLCB0aXRsZTogZm9ybS5uYW1lKVxuICAgICAgICBAJCgnI2NvbnRlbnRzJykuYXBwZW5kKEBmb3JtVmlldy5lbClcblxuICAgICAgICBAZm9ybVZpZXcubG9hZCBAdGVzdFxuXG4gIGV2ZW50czpcbiAgICBcImNsaWNrICNlZGl0X2J1dHRvblwiIDogXCJlZGl0XCJcblxuICBkZXN0cm95OiAtPlxuICAgICMgTGV0IGtub3cgdGhhdCBzYXZlZCBpZiBjbG9zZWQgaW5jb21wbGV0ZWRcbiAgICBpZiBAdGVzdCBhbmQgbm90IEB0ZXN0LmNvbXBsZXRlZFxuICAgICAgQHBhZ2VyLmZsYXNoIFwiVGVzdCBzYXZlZCBhcyBkcmFmdC5cIlxuXG4gIGVkaXQ6IC0+XG4gICAgIyBNYXJrIGFzIGluY29tcGxldGVcbiAgICBAdGVzdC5jb21wbGV0ZWQgPSBudWxsXG4gICAgQGRiLnRlc3RzLnVwc2VydCBAdGVzdCwgPT4gQHJlbmRlcigpXG5cbiAgc2F2ZTogPT5cbiAgICAjIFNhdmUgdG8gZGJcbiAgICBAdGVzdCA9IEBmb3JtVmlldy5zYXZlKClcbiAgICBAZGIudGVzdHMudXBzZXJ0KEB0ZXN0KVxuXG4gIGNsb3NlOiA9PlxuICAgIEBzYXZlKClcbiAgICBAcGFnZXIuY2xvc2VQYWdlKClcblxuICBjb21wbGV0ZWQ6ID0+XG4gICAgIyBNYXJrIGFzIGNvbXBsZXRlZFxuICAgIEB0ZXN0LmNvbXBsZXRlZCA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKVxuICAgIEBkYi50ZXN0cy51cHNlcnQgQHRlc3QsID0+IEByZW5kZXIoKVxuXG4gIGRlbGV0ZVRlc3Q6IC0+XG4gICAgaWYgY29uZmlybShcIlBlcm1hbmVudGx5IGRlbGV0ZSB0ZXN0P1wiKVxuICAgICAgQGRiLnRlc3RzLnJlbW92ZSBAdGVzdC5faWQsID0+XG4gICAgICAgIEB0ZXN0ID0gbnVsbFxuICAgICAgICBAcGFnZXIuY2xvc2VQYWdlKClcbiAgICAgICAgQHBhZ2VyLmZsYXNoIFwiVGVzdCBkZWxldGVkXCIsIFwic3VjY2Vzc1wiXG5cbm1vZHVsZS5leHBvcnRzID0gVGVzdFBhZ2UiXX0=
;