require=(function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
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


},{"../app/js/LocationView":2,"./helpers/UIDriver":3}],4:[function(require,module,exports){
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


},{"../app/js/db/LocalDb":5,"./db_queries":6}],7:[function(require,module,exports){
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


},{"../app/js/ItemTracker":8}],9:[function(require,module,exports){
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


},{"../app/js/GeoJSON":10}],6:[function(require,module,exports){
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


},{"../app/js/GeoJSON":10}],11:[function(require,module,exports){
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


},{"forms":"EAVIrc","./helpers/UIDriver":3}],"forms":[function(require,module,exports){
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


},{"./form-controls":12,"./DateQuestion":13,"./DropdownQuestion":14,"./NumberQuestion":15,"./QuestionGroup":16,"./SaveCancelForm":17,"./SourceQuestion":18,"./PhotoQuestion":19,"./Instructions":20,"./PhotosQuestion":21}],8:[function(require,module,exports){
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


},{}],10:[function(require,module,exports){
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


},{}],3:[function(require,module,exports){
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


},{}],2:[function(require,module,exports){
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


},{"./LocationFinder":22,"./GeoJSON":10}],5:[function(require,module,exports){
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


},{"./selector":23,"../GeoJSON":10}],12:[function(require,module,exports){
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

},{}],16:[function(require,module,exports){
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


},{}],17:[function(require,module,exports){
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


},{}],20:[function(require,module,exports){
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


},{}],13:[function(require,module,exports){
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


},{"./form-controls":12}],15:[function(require,module,exports){
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


},{"./form-controls":12}],19:[function(require,module,exports){
(function() {
  var Question;

  Question = require('./form-controls').Question;

  module.exports = Question.extend({
    events: {
      "click #camera": "cameraClick"
    },
    renderAnswer: function(answerEl) {
      return answerEl.html('<img src="img/camera-icon.jpg" id="camera" class="img-rounded" style="max-height: 100px"/>');
    },
    cameraClick: function() {
      return alert("On Android App, would launch Camera+Photo Viewer");
    }
  });

}).call(this);


},{"./form-controls":12}],21:[function(require,module,exports){
(function() {
  var Question;

  Question = require('./form-controls').Question;

  module.exports = Question.extend({
    events: {
      "click #camera": "cameraClick"
    },
    renderAnswer: function(answerEl) {
      return answerEl.html('<img src="img/camera-icon.jpg" id="camera" class="img-rounded" style="max-height: 100px"/>');
    },
    cameraClick: function() {
      return alert("On Android App, would launch Camera+Photo Viewer");
    }
  });

}).call(this);


},{"./form-controls":12}],14:[function(require,module,exports){
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


},{"./form-controls":12}],18:[function(require,module,exports){
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
      return this.options.ctx.pager.openPage(SourceListPage, {
        onSelect: function(source) {
          return _this.model.set(_this.id, source.code);
        }
      });
    }
  });

}).call(this);


},{"./form-controls":12,"../pages/SourceListPage":24}],22:[function(require,module,exports){
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


},{}],23:[function(require,module,exports){
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
},{"./EJSON":25}],24:[function(require,module,exports){
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
      'click tr.tappable': 'sourceClicked'
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
          icon: "plus-32.png",
          click: function() {
            return _this.addSource();
          }
        }
      ]);
      return this.db.sources.find({
        geo: {
          $exists: false
        }
      }).fetch(function(sources) {
        _this.unlocatedSources = sources;
        return _this.renderList();
      });
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
      sources = this.unlocatedSources.concat(this.nearSources);
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

    return SourceListPage;

  })(Page);

}).call(this);


},{"../Page":26,"../LocationFinder":22,"../GeoJSON":10,"./NewSourcePage":27,"./SourcePage":28}],25:[function(require,module,exports){
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


},{}],28:[function(require,module,exports){
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
      'click .test': 'openTest',
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
          icon: "plus-32.png",
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
      photosView = new forms.PhotosQuestion({
        id: 'photos',
        model: new Backbone.Model(this.source),
        prompt: 'Photos'
      });
      return photosView.model.on('change', function() {
        return _this.db.sources.upsert(_this.source.toJSON(), function() {
          return _this.render();
        });
      });
    };

    SourcePage.prototype.editSource = function() {
      return this.pager.openPage(require("./SourceEditPage"), {
        _id: this._id
      });
    };

    SourcePage.prototype.deleteSource = function() {
      var _this = this;
      if (confirm("Permanently delete source?")) {
        return this.db.sources.remove(this.source._id, function() {
          return _this.pager.closePage();
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
      return alert("TODO");
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


},{"../Page":26,"../LocationView":2,"./SourceMapPage":29,"./SourceEditPage":30,"./NewTestPage":31,"./TestPage":32,"../forms":"EAVIrc"}],27:[function(require,module,exports){
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
        source = _.pick(_this.model.toJSON(), 'name', 'desc', 'type');
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


},{"../Page":26,"./SourcePage":28,"../forms":"EAVIrc"}],31:[function(require,module,exports){
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


},{"./TestPage":32,"../Page":26}],29:[function(require,module,exports){
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
        marker = new L.Marker(latlng);
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


},{"../Page":26,"./SourcePage":28,"../ItemTracker":8,"../LocationFinder":22,"../GeoJSON":10}],30:[function(require,module,exports){
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


},{"../Page":26,"../forms":"EAVIrc"}],32:[function(require,module,exports){
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


},{"../Page":26,"../forms":"EAVIrc"}]},{},[9,7,4,1,11,6])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL3Rlc3QvTG9jYXRpb25WaWV3VGVzdHMuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My90ZXN0L0xvY2FsRGJUZXN0cy5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL3Rlc3QvSXRlbVRyYWNrZXJUZXN0cy5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL3Rlc3QvR2VvSlNPTlRlc3RzLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvdGVzdC9kYl9xdWVyaWVzLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvdGVzdC9Ecm9wZG93blF1ZXN0aW9uVGVzdHMuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvZm9ybXMvaW5kZXguY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvSXRlbVRyYWNrZXIuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvR2VvSlNPTi5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL3Rlc3QvaGVscGVycy9VSURyaXZlci5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9Mb2NhdGlvblZpZXcuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvZGIvTG9jYWxEYi5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9mb3Jtcy9mb3JtLWNvbnRyb2xzLmpzIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvZm9ybXMvUXVlc3Rpb25Hcm91cC5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9mb3Jtcy9TYXZlQ2FuY2VsRm9ybS5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9mb3Jtcy9JbnN0cnVjdGlvbnMuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvZm9ybXMvRGF0ZVF1ZXN0aW9uLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL2Zvcm1zL051bWJlclF1ZXN0aW9uLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL2Zvcm1zL1Bob3RvUXVlc3Rpb24uY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvZm9ybXMvUGhvdG9zUXVlc3Rpb24uY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvZm9ybXMvRHJvcGRvd25RdWVzdGlvbi5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9mb3Jtcy9Tb3VyY2VRdWVzdGlvbi5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9Mb2NhdGlvbkZpbmRlci5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9kYi9zZWxlY3Rvci5qcyIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL3BhZ2VzL1NvdXJjZUxpc3RQYWdlLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL2RiL0VKU09OLmpzIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvUGFnZS5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9wYWdlcy9Tb3VyY2VQYWdlLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL3BhZ2VzL05ld1NvdXJjZVBhZ2UuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvcGFnZXMvTmV3VGVzdFBhZ2UuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvcGFnZXMvU291cmNlTWFwUGFnZS5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9wYWdlcy9Tb3VyY2VFZGl0UGFnZS5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9wYWdlcy9UZXN0UGFnZS5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0NBQUEsS0FBQSw0Q0FBQTs7Q0FBQSxDQUFBLENBQVMsQ0FBSSxFQUFiOztDQUFBLENBQ0EsQ0FBZSxJQUFBLEtBQWYsWUFBZTs7Q0FEZixDQUVBLENBQVcsSUFBQSxDQUFYLFlBQVc7O0NBRlgsQ0FJTTtDQUNVLEVBQUEsQ0FBQSx3QkFBQTtDQUNaLENBQVksRUFBWixFQUFBLEVBQW9CO0NBRHRCLElBQWM7O0NBQWQsRUFHYSxNQUFBLEVBQWI7O0NBSEEsRUFJWSxNQUFBLENBQVo7O0NBSkEsRUFLVyxNQUFYOztDQUxBOztDQUxGOztDQUFBLENBWUEsQ0FBeUIsS0FBekIsQ0FBeUIsS0FBekI7Q0FDRSxDQUFnQyxDQUFBLENBQWhDLEdBQUEsRUFBZ0MsYUFBaEM7Q0FDRSxFQUFXLEdBQVgsR0FBVyxDQUFYO0NBQ0UsRUFBc0IsQ0FBckIsSUFBRCxNQUFBLElBQXNCO0NBQXRCLEVBQ29CLENBQW5CLElBQUQsSUFBQTtDQUFpQyxDQUFJLENBQUosQ0FBQSxNQUFBO0NBQUEsQ0FBMEIsRUFBQyxNQUFqQixJQUFBO0NBRDNDLFNBQ29CO0NBQ25CLENBQUQsQ0FBVSxDQUFULElBQVMsSUFBc0IsR0FBaEM7Q0FIRixNQUFXO0NBQVgsQ0FLQSxDQUEyQixHQUEzQixHQUEyQixhQUEzQjtDQUNTLENBQVcsRUFBRixFQUFWLENBQU4sTUFBQSxFQUFBO0NBREYsTUFBMkI7Q0FMM0IsQ0FRQSxDQUFtQixHQUFuQixHQUFtQixLQUFuQjtDQUNTLENBQVUsRUFBRixDQUFELENBQVIsS0FBUSxJQUFkO0NBREYsTUFBbUI7Q0FSbkIsQ0FXQSxDQUE4QixHQUE5QixHQUE4QixnQkFBOUI7Q0FDRSxLQUFBLE1BQUE7Q0FBQSxDQUFHLEVBQUYsQ0FBRCxHQUFBO0NBQUEsRUFDUyxDQURULEVBQ0EsRUFBQTtDQURBLENBRUEsQ0FBZ0MsQ0FBL0IsSUFBRCxDQUFpQyxHQUFwQixDQUFiO0NBQWdDLEVBQ3JCLEdBQVQsV0FBQTtDQURGLFFBQWdDO0NBRmhDLENBS2lDLEVBQWhDLEdBQUQsQ0FBQSxNQUFlO0NBQWtCLENBQVUsSUFBUixJQUFBO0NBQVEsQ0FBWSxNQUFWLElBQUE7Q0FBRixDQUEwQixPQUFYLEdBQUE7Q0FBZixDQUF1QyxNQUFWLElBQUE7WUFBdkM7Q0FMakMsU0FLQTtDQUNPLENBQTZCLEdBQXBDLENBQU0sS0FBMEIsSUFBaEM7Q0FQRixNQUE4QjtDQVMzQixDQUFILENBQXFCLE1BQUEsSUFBckIsR0FBQTtDQUNFLEtBQUEsTUFBQTtDQUFBLENBQUcsRUFBRixDQUFELEdBQUE7Q0FBQSxFQUNTLENBRFQsRUFDQSxFQUFBO0NBREEsQ0FFQSxDQUFnQyxDQUEvQixJQUFELENBQWlDLEdBQXBCLENBQWI7Q0FBZ0MsRUFDckIsR0FBVCxXQUFBO0NBREYsUUFBZ0M7Q0FGaEMsR0FLQyxHQUFELENBQUEsTUFBZTtDQUxmLENBTXFCLEVBQXJCLENBQUEsQ0FBTSxFQUFOO0NBQ08sQ0FBVyxFQUFGLEVBQVYsQ0FBTixDQUFBLE9BQUE7Q0FSRixNQUFxQjtDQXJCdkIsSUFBZ0M7Q0ErQnhCLENBQXFCLENBQUEsSUFBN0IsRUFBNkIsRUFBN0IsUUFBQTtDQUNFLEVBQVcsR0FBWCxHQUFXLENBQVg7Q0FDRSxFQUFzQixDQUFyQixJQUFELE1BQUEsSUFBc0I7Q0FBdEIsRUFDb0IsQ0FBbkIsSUFBRCxJQUFBO0NBQWlDLENBQUssQ0FBTCxPQUFBO0NBQUssQ0FBUSxFQUFOLEdBQUYsS0FBRTtDQUFGLENBQThCLFNBQWIsQ0FBQTtZQUF0QjtDQUFBLENBQThELEVBQUMsTUFBakIsSUFBQTtDQUQvRSxTQUNvQjtDQUNuQixDQUFELENBQVUsQ0FBVCxJQUFTLElBQXNCLEdBQWhDO0NBSEYsTUFBVztDQUFYLENBS0EsQ0FBdUIsR0FBdkIsR0FBdUIsU0FBdkI7Q0FDUyxDQUFXLEVBQUYsRUFBVixDQUFOLEVBQUEsTUFBQTtDQURGLE1BQXVCO0NBR3BCLENBQUgsQ0FBd0IsTUFBQSxJQUF4QixNQUFBO0NBQ0UsQ0FBaUMsRUFBaEMsR0FBRCxDQUFBLE1BQWU7Q0FBa0IsQ0FBVSxJQUFSLElBQUE7Q0FBUSxDQUFZLE1BQVYsSUFBQTtDQUFGLENBQTJCLE9BQVgsR0FBQTtDQUFoQixDQUF5QyxNQUFWLElBQUE7WUFBekM7Q0FBakMsU0FBQTtDQUNPLENBQVcsRUFBRixFQUFWLENBQU4sSUFBQSxJQUFBO0NBRkYsTUFBd0I7Q0FUMUIsSUFBNkI7Q0FoQy9CLEVBQXlCO0NBWnpCOzs7OztBQ0FBO0NBQUEsS0FBQSxxQkFBQTs7Q0FBQSxDQUFBLENBQVMsQ0FBSSxFQUFiOztDQUFBLENBQ0EsQ0FBVSxJQUFWLGVBQVU7O0NBRFYsQ0FFQSxDQUFhLElBQUEsR0FBYixJQUFhOztDQUZiLENBSUEsQ0FBb0IsS0FBcEIsQ0FBQTtDQUNFLEVBQU8sQ0FBUCxFQUFBLEdBQU87Q0FDSixDQUFELENBQVUsQ0FBVCxFQUFTLENBQUEsTUFBVjtDQURGLElBQU87Q0FBUCxFQUdXLENBQVgsS0FBWSxDQUFaO0NBQ0UsQ0FBRyxFQUFGLEVBQUQsVUFBQTtDQUFBLENBQ0csRUFBRixFQUFELE9BQUE7Q0FDQSxHQUFBLFNBQUE7Q0FIRixJQUFXO0NBSFgsQ0FRMkIsQ0FBQSxDQUEzQixJQUFBLENBQTJCLE9BQTNCO0NBQ2EsR0FBWCxNQUFVLEdBQVY7Q0FERixJQUEyQjtDQVIzQixDQVdBLENBQWtCLENBQWxCLEtBQW1CLElBQW5CO0NBQ0UsU0FBQSxFQUFBO0NBQUMsQ0FBRSxFQUFGLENBQUQsUUFBQTtTQUFnQjtDQUFBLENBQU8sQ0FBTCxPQUFBO0NBQUYsQ0FBYSxLQUFiLEdBQVU7VUFBWDtFQUEwQixDQUFRLEtBQWpELENBQWlEO0NBQzlDLENBQUUsQ0FBcUIsQ0FBaEIsQ0FBUCxFQUF1QixFQUFDLE1BQXpCO0NBQ0UsQ0FBMkIsR0FBM0IsQ0FBTSxDQUFlLEdBQXJCO0NBQ0EsR0FBQSxhQUFBO0NBRkYsUUFBd0I7Q0FEMUIsTUFBaUQ7Q0FEbkQsSUFBa0I7Q0FYbEIsQ0FpQkEsQ0FBK0IsQ0FBL0IsS0FBZ0MsaUJBQWhDO0NBQ0UsU0FBQSxFQUFBO0NBQUMsQ0FBRSxFQUFGLENBQUQsUUFBQTtTQUFnQjtDQUFBLENBQU8sQ0FBTCxPQUFBO0NBQUYsQ0FBYSxLQUFiLEdBQVU7VUFBWDtFQUEwQixDQUFRLEtBQWpELENBQWlEO0NBQzlDLENBQUUsRUFBSyxDQUFQLFVBQUQ7V0FBZ0I7Q0FBQSxDQUFPLENBQUwsU0FBQTtDQUFGLENBQWEsTUFBYixJQUFVO1lBQVg7RUFBMkIsQ0FBUSxNQUFBLENBQWxEO0NBQ0csQ0FBRSxDQUFxQixDQUFoQixDQUFQLEVBQXVCLEVBQUMsUUFBekI7Q0FDRSxDQUEyQixHQUEzQixDQUFNLENBQWUsQ0FBckIsSUFBQTtDQUNBLEdBQUEsZUFBQTtDQUZGLFVBQXdCO0NBRDFCLFFBQWtEO0NBRHBELE1BQWlEO0NBRG5ELElBQStCO0NBakIvQixDQXdCQSxDQUFxQyxDQUFyQyxLQUFzQyx1QkFBdEM7Q0FDRSxTQUFBLEVBQUE7Q0FBQyxDQUFFLEVBQUYsRUFBRCxPQUFBO0NBQWdCLENBQU8sQ0FBTCxLQUFBO0NBQUYsQ0FBYSxLQUFiLENBQVU7RUFBYyxDQUFBLEtBQXhDLENBQXdDO0NBQ3JDLENBQUUsRUFBSyxDQUFQLFVBQUQ7V0FBZ0I7Q0FBQSxDQUFPLENBQUwsU0FBQTtDQUFGLENBQWEsTUFBYixJQUFVO1lBQVg7RUFBMkIsQ0FBUSxNQUFBLENBQWxEO0NBQ0csQ0FBRSxDQUFxQixDQUFoQixDQUFQLEVBQXVCLEVBQUMsUUFBekI7Q0FDRSxDQUEyQixHQUEzQixDQUFNLENBQWUsS0FBckI7Q0FDQSxHQUFBLGVBQUE7Q0FGRixVQUF3QjtDQUQxQixRQUFrRDtDQURwRCxNQUF3QztDQUQxQyxJQUFxQztDQXhCckMsQ0ErQkEsQ0FBcUMsQ0FBckMsS0FBc0MsdUJBQXRDO0NBQ0UsU0FBQSxFQUFBO0NBQUMsQ0FBRSxFQUFGLENBQUQsUUFBQTtTQUFnQjtDQUFBLENBQU8sQ0FBTCxPQUFBO0NBQUYsQ0FBYSxNQUFiLEVBQVU7VUFBWDtFQUEyQixDQUFRLEtBQWxELENBQWtEO0NBQ2hELENBQUcsQ0FBZ0IsQ0FBWCxDQUFQLENBQUQsRUFBQSxDQUFtQjtDQUNsQixDQUFFLEVBQUssQ0FBUCxVQUFEO1dBQWdCO0NBQUEsQ0FBTyxDQUFMLFNBQUE7Q0FBRixDQUFhLE1BQWIsSUFBVTtZQUFYO0VBQTJCLENBQVEsTUFBQSxDQUFsRDtDQUNHLENBQUUsQ0FBcUIsQ0FBaEIsQ0FBUCxFQUF1QixFQUFDLFFBQXpCO0NBQ0UsQ0FBNkIsR0FBN0IsQ0FBTSxDQUFjLEtBQXBCO0NBQ0EsR0FBQSxlQUFBO0NBRkYsVUFBd0I7Q0FEMUIsUUFBa0Q7Q0FGcEQsTUFBa0Q7Q0FEcEQsSUFBcUM7Q0EvQnJDLENBdUNBLENBQXFDLENBQXJDLEtBQXNDLHVCQUF0QztDQUNFLFNBQUEsRUFBQTtDQUFDLENBQUUsRUFBRixDQUFELFFBQUE7U0FBZ0I7Q0FBQSxDQUFPLENBQUwsT0FBQTtDQUFGLENBQWEsQ0FBYixPQUFVO0VBQVUsUUFBckI7Q0FBcUIsQ0FBTyxDQUFMLE9BQUE7Q0FBRixDQUFhLENBQWIsT0FBVTtFQUFVLFFBQXpDO0NBQXlDLENBQU8sQ0FBTCxPQUFBO0NBQUYsQ0FBYSxDQUFiLE9BQVU7VUFBbkQ7RUFBOEQsQ0FBUSxLQUFyRixDQUFxRjtDQUNsRixDQUFFLEVBQUssQ0FBUCxVQUFEO1dBQWdCO0NBQUEsQ0FBTyxDQUFMLFNBQUE7Q0FBRixDQUFhLENBQWIsU0FBVTtFQUFVLFVBQXJCO0NBQXFCLENBQU8sQ0FBTCxTQUFBO0NBQUYsQ0FBYSxDQUFiLFNBQVU7WUFBL0I7RUFBMEMsQ0FBUSxNQUFBLENBQWpFO0NBQ0csQ0FBRSxDQUFxQixDQUFoQixDQUFQLEVBQXVCLEVBQUMsUUFBekI7Q0FDRSxDQUE2QixHQUE3QixDQUFNLENBQWMsS0FBcEI7Q0FDQSxHQUFBLGVBQUE7Q0FGRixVQUF3QjtDQUQxQixRQUFpRTtDQURuRSxNQUFxRjtDQUR2RixJQUFxQztDQXZDckMsQ0E4Q0EsQ0FBcUMsQ0FBckMsS0FBc0MsdUJBQXRDO0NBQ0UsU0FBQSxFQUFBO0NBQUMsQ0FBRSxFQUFGLENBQUQsUUFBQTtTQUFnQjtDQUFBLENBQU8sQ0FBTCxPQUFBO0NBQUYsQ0FBYSxDQUFiLE9BQVU7RUFBVSxRQUFyQjtDQUFxQixDQUFPLENBQUwsT0FBQTtDQUFGLENBQWEsQ0FBYixPQUFVO0VBQVUsUUFBekM7Q0FBeUMsQ0FBTyxDQUFMLE9BQUE7Q0FBRixDQUFhLENBQWIsT0FBVTtVQUFuRDtFQUE4RCxDQUFRLEtBQXJGLENBQXFGO0NBQ2xGLENBQUUsRUFBSyxDQUFQLFVBQUQ7V0FBZ0I7Q0FBQSxDQUFPLENBQUwsU0FBQTtDQUFGLENBQWEsQ0FBYixTQUFVO1lBQVg7RUFBc0IsUUFBckM7Q0FBcUMsQ0FBTSxDQUFMLE9BQUE7Q0FBSyxDQUFLLENBQUosU0FBQTtZQUFQO0VBQWdCLENBQUksTUFBQSxDQUF6RDtDQUNHLENBQUUsRUFBSyxDQUFQLFlBQUQ7Q0FBa0IsQ0FBTSxFQUFMLENBQUssT0FBTDtDQUFjLEVBQU8sRUFBeEMsRUFBd0MsRUFBQyxHQUF6QztDQUNFLENBQWtDLEdBQWpCLENBQVgsQ0FBVyxFQUFqQixHQUFBO0NBQ0EsR0FBQSxlQUFBO0NBRkYsVUFBd0M7Q0FEMUMsUUFBeUQ7Q0FEM0QsTUFBcUY7Q0FEdkYsSUFBcUM7Q0E5Q3JDLENBcURBLENBQTJDLENBQTNDLEtBQTRDLDZCQUE1QztDQUNFLFNBQUEsRUFBQTtDQUFDLENBQUUsRUFBRixDQUFELFFBQUE7U0FBZ0I7Q0FBQSxDQUFPLENBQUwsT0FBQTtDQUFGLENBQWEsQ0FBYixPQUFVO0VBQVUsUUFBckI7Q0FBcUIsQ0FBTyxDQUFMLE9BQUE7Q0FBRixDQUFhLENBQWIsT0FBVTtFQUFVLFFBQXpDO0NBQXlDLENBQU8sQ0FBTCxPQUFBO0NBQUYsQ0FBYSxDQUFiLE9BQVU7VUFBbkQ7RUFBOEQsQ0FBUSxLQUFyRixDQUFxRjtDQUNsRixDQUFFLEVBQUssQ0FBUCxVQUFEO1dBQWdCO0NBQUEsQ0FBTyxDQUFMLFNBQUE7Q0FBRixDQUFhLENBQWIsU0FBVTtZQUFYO0VBQXNCLFFBQXJDO0NBQXlDLENBQU0sRUFBTCxDQUFLLEtBQUw7Q0FBRCxDQUFxQixHQUFOLEtBQUE7RUFBVSxDQUFBLE1BQUEsQ0FBbEU7Q0FDRyxDQUFFLEVBQUssQ0FBUCxZQUFEO0NBQWtCLENBQU0sRUFBTCxDQUFLLE9BQUw7Q0FBYyxFQUFPLEVBQXhDLEVBQXdDLEVBQUMsR0FBekM7Q0FDRSxDQUFrQyxHQUFqQixDQUFYLENBQVcsRUFBakIsR0FBQTtDQUNBLEdBQUEsZUFBQTtDQUZGLFVBQXdDO0NBRDFDLFFBQWtFO0NBRHBFLE1BQXFGO0NBRHZGLElBQTJDO0NBckQzQyxDQTREQSxDQUE0RCxDQUE1RCxLQUE2RCw4Q0FBN0Q7Q0FDRSxTQUFBLEVBQUE7Q0FBQyxDQUFFLEVBQUYsQ0FBRCxRQUFBO1NBQWdCO0NBQUEsQ0FBTyxDQUFMLE9BQUE7Q0FBRixDQUFhLENBQWIsT0FBVTtFQUFVLFFBQXJCO0NBQXFCLENBQU8sQ0FBTCxPQUFBO0NBQUYsQ0FBYSxDQUFiLE9BQVU7RUFBVSxRQUF6QztDQUF5QyxDQUFPLENBQUwsT0FBQTtDQUFGLENBQWEsQ0FBYixPQUFVO0VBQVUsUUFBN0Q7Q0FBNkQsQ0FBTyxDQUFMLE9BQUE7Q0FBRixDQUFhLENBQWIsT0FBVTtVQUF2RTtFQUFrRixDQUFRLEtBQXpHLENBQXlHO0NBQ3RHLENBQUUsQ0FBZ0IsQ0FBWCxDQUFQLENBQUQsR0FBbUIsTUFBbkI7Q0FDRyxDQUFFLEVBQUssQ0FBUCxZQUFEO2FBQWdCO0NBQUEsQ0FBTyxDQUFMLFdBQUE7Q0FBRixDQUFhLENBQWIsV0FBVTtFQUFVLFlBQXJCO0NBQXFCLENBQU8sQ0FBTCxXQUFBO0NBQUYsQ0FBYSxDQUFiLFdBQVU7Y0FBL0I7RUFBMEMsVUFBekQ7Q0FBNkQsQ0FBTSxFQUFMLENBQUssT0FBTDtDQUFELENBQXFCLEdBQU4sT0FBQTtFQUFVLENBQUEsTUFBQSxHQUF0RjtDQUNHLENBQUUsRUFBSyxDQUFQLGNBQUQ7Q0FBa0IsQ0FBTSxFQUFMLENBQUssU0FBTDtDQUFjLEVBQU8sRUFBeEMsRUFBd0MsRUFBQyxLQUF6QztDQUNFLENBQWtDLEdBQWpCLENBQVgsQ0FBVyxFQUFqQixLQUFBO0NBQ0EsR0FBQSxpQkFBQTtDQUZGLFlBQXdDO0NBRDFDLFVBQXNGO0NBRHhGLFFBQW1CO0NBRHJCLE1BQXlHO0NBRDNHLElBQTREO0NBNUQ1RCxDQW9FQSxDQUE4QixDQUE5QixLQUErQixnQkFBL0I7Q0FDRSxTQUFBLEVBQUE7Q0FBQyxDQUFFLEVBQUYsQ0FBRCxRQUFBO1NBQWdCO0NBQUEsQ0FBTyxDQUFMLE9BQUE7Q0FBRixDQUFhLEtBQWIsR0FBVTtVQUFYO0VBQTBCLENBQVEsS0FBakQsQ0FBaUQ7Q0FDOUMsQ0FBRSxFQUFLLENBQVAsQ0FBRCxTQUFBO0NBQWdCLENBQU8sQ0FBTCxPQUFBO0NBQUYsQ0FBYSxNQUFiLEVBQVU7RUFBZSxDQUFBLE1BQUEsQ0FBekM7Q0FDRyxDQUFFLENBQXFCLENBQWhCLENBQVAsRUFBdUIsRUFBQyxLQUF6QixHQUFBO0NBQ0UsQ0FBNkIsR0FBN0IsQ0FBTSxDQUFjLEtBQXBCO0NBQUEsQ0FDMkIsR0FBM0IsQ0FBTSxDQUFlLENBQXJCLElBQUE7Q0FDQSxHQUFBLGVBQUE7Q0FIRixVQUF3QjtDQUQxQixRQUF5QztDQUQzQyxNQUFpRDtDQURuRCxJQUE4QjtDQXBFOUIsQ0E0RUEsQ0FBK0IsQ0FBL0IsS0FBZ0MsaUJBQWhDO0NBQ0UsU0FBQSxFQUFBO0NBQUMsQ0FBRSxFQUFGLEVBQUQsT0FBQTtDQUFnQixDQUFPLENBQUwsS0FBQTtDQUFGLENBQWEsTUFBSDtFQUFlLENBQUEsS0FBekMsQ0FBeUM7Q0FDdEMsQ0FBRSxFQUFLLENBQVAsUUFBRCxFQUFBO0NBQXVCLENBQU8sQ0FBTCxPQUFBO0NBQUYsQ0FBYSxNQUFiLEVBQVU7RUFBZSxDQUFBLE1BQUEsQ0FBaEQ7Q0FDRyxDQUFFLENBQXFCLENBQWhCLENBQVAsRUFBdUIsRUFBQyxLQUF6QixHQUFBO0NBQ0UsQ0FBNkIsR0FBN0IsQ0FBTSxDQUFjLEtBQXBCO0NBQ0EsR0FBQSxlQUFBO0NBRkYsVUFBd0I7Q0FEMUIsUUFBZ0Q7Q0FEbEQsTUFBeUM7Q0FEM0MsSUFBK0I7Q0E1RS9CLENBbUZBLENBQXNDLENBQXRDLEtBQXVDLHdCQUF2QztDQUNFLFNBQUEsRUFBQTtDQUFDLENBQUUsRUFBRixFQUFELE9BQUE7Q0FBZ0IsQ0FBTyxDQUFMLEtBQUE7Q0FBRixDQUFhLE1BQUg7RUFBZSxDQUFBLEtBQXpDLENBQXlDO0NBQ3RDLENBQUUsRUFBSyxDQUFQLENBQUQsU0FBQTtDQUFnQixDQUFPLENBQUwsT0FBQTtDQUFGLENBQWEsT0FBYixDQUFVO0VBQWdCLENBQUEsTUFBQSxDQUExQztDQUNHLENBQUUsRUFBSyxDQUFQLFFBQUQsSUFBQTtDQUF1QixDQUFPLENBQUwsU0FBQTtDQUFGLENBQWEsTUFBYixJQUFVO0VBQWUsQ0FBQSxNQUFBLEdBQWhEO0NBQ0csQ0FBRSxDQUFxQixDQUFoQixDQUFQLEVBQXVCLEVBQUMsS0FBekIsS0FBQTtDQUNFLENBQTZCLEdBQTdCLENBQU0sQ0FBYyxPQUFwQjtDQUFBLENBQzJCLEdBQTNCLENBQU0sQ0FBZSxFQUFyQixLQUFBO0NBQ0EsR0FBQSxpQkFBQTtDQUhGLFlBQXdCO0NBRDFCLFVBQWdEO0NBRGxELFFBQTBDO0NBRDVDLE1BQXlDO0NBRDNDLElBQXNDO0NBbkZ0QyxDQTRGQSxDQUE4QixDQUE5QixLQUErQixnQkFBL0I7Q0FDRSxTQUFBLEVBQUE7Q0FBQyxDQUFFLEVBQUYsRUFBRCxPQUFBO0NBQWdCLENBQU8sQ0FBTCxLQUFBO0NBQUYsQ0FBYSxNQUFIO0VBQWUsQ0FBQSxLQUF6QyxDQUF5QztDQUN0QyxDQUFFLENBQWdCLENBQVgsQ0FBUCxDQUFELEdBQW1CLE1BQW5CO0NBQ0csQ0FBRSxDQUFxQixDQUFoQixDQUFQLEVBQXVCLEVBQUMsS0FBekIsR0FBQTtDQUNFLENBQTZCLEdBQTdCLENBQU0sQ0FBYyxLQUFwQjtDQUNBLEdBQUEsZUFBQTtDQUZGLFVBQXdCO0NBRDFCLFFBQW1CO0NBRHJCLE1BQXlDO0NBRDNDLElBQThCO0NBNUY5QixDQW1HQSxDQUE4QixDQUE5QixLQUErQixnQkFBL0I7Q0FDRSxTQUFBLEVBQUE7Q0FBQyxDQUFFLEVBQUYsQ0FBRCxRQUFBO1NBQWdCO0NBQUEsQ0FBTyxDQUFMLE9BQUE7Q0FBRixDQUFhLEtBQWIsR0FBVTtVQUFYO0VBQTBCLENBQVEsS0FBakQsQ0FBaUQ7Q0FDOUMsQ0FBRSxDQUFnQixDQUFYLENBQVAsQ0FBRCxHQUFtQixNQUFuQjtDQUNHLENBQUUsQ0FBcUIsQ0FBaEIsQ0FBUCxFQUF1QixFQUFDLEtBQXpCLEdBQUE7Q0FDRSxDQUE2QixHQUE3QixDQUFNLENBQWMsS0FBcEI7Q0FBQSxDQUN5QixHQUF6QixDQUFNLENBQWUsS0FBckI7Q0FDQSxHQUFBLGVBQUE7Q0FIRixVQUF3QjtDQUQxQixRQUFtQjtDQURyQixNQUFpRDtDQURuRCxJQUE4QjtDQW5HOUIsQ0EyR0EsQ0FBK0IsQ0FBL0IsS0FBZ0MsaUJBQWhDO0NBQ0UsU0FBQSxFQUFBO0NBQUMsQ0FBRSxFQUFGLENBQUQsUUFBQTtTQUFnQjtDQUFBLENBQU8sQ0FBTCxPQUFBO0NBQUYsQ0FBYSxLQUFiLEdBQVU7VUFBWDtFQUEwQixDQUFRLEtBQWpELENBQWlEO0NBQzlDLENBQUUsQ0FBZ0IsQ0FBWCxDQUFQLENBQUQsR0FBbUIsTUFBbkI7Q0FDRyxDQUFFLENBQXVCLENBQWxCLENBQVAsSUFBeUIsSUFBMUIsSUFBQTtDQUNHLENBQUUsQ0FBcUIsQ0FBaEIsQ0FBUCxFQUF1QixFQUFDLEtBQXpCLEtBQUE7Q0FDRSxDQUE2QixHQUE3QixDQUFNLENBQWMsT0FBcEI7Q0FDQSxHQUFBLGlCQUFBO0NBRkYsWUFBd0I7Q0FEMUIsVUFBMEI7Q0FENUIsUUFBbUI7Q0FEckIsTUFBaUQ7Q0FEbkQsSUFBK0I7Q0EzRy9CLENBbUhBLENBQVksQ0FBWixHQUFBLEVBQWE7Q0FDWCxTQUFBLEVBQUE7Q0FBQyxDQUFFLEVBQUYsU0FBRDtDQUFjLENBQU8sQ0FBTCxLQUFBO0NBQUYsQ0FBYSxLQUFiLENBQVU7RUFBYyxDQUFBLEtBQXRDLENBQXNDO0NBQ25DLENBQUUsQ0FBcUIsQ0FBaEIsQ0FBUCxFQUF1QixFQUFDLE1BQXpCO0NBQ0UsQ0FBMkIsR0FBM0IsQ0FBTSxDQUFlLEdBQXJCO0NBQ0EsR0FBQSxhQUFBO0NBRkYsUUFBd0I7Q0FEMUIsTUFBc0M7Q0FEeEMsSUFBWTtDQW5IWixDQXlIQSxDQUFrQyxDQUFsQyxLQUFtQyxvQkFBbkM7Q0FDRSxTQUFBLEVBQUE7Q0FBQyxDQUFFLEVBQUYsQ0FBRCxRQUFBO1NBQWdCO0NBQUEsQ0FBTyxDQUFMLE9BQUE7Q0FBRixDQUFhLE1BQWIsRUFBVTtVQUFYO0VBQTJCLENBQVEsS0FBbEQsQ0FBa0Q7Q0FDL0MsQ0FBRSxFQUFLLENBQVAsVUFBRDtDQUFjLENBQU8sQ0FBTCxPQUFBO0NBQUYsQ0FBYSxLQUFiLEdBQVU7RUFBYyxDQUFBLE1BQUEsQ0FBdEM7Q0FDRyxDQUFFLENBQXFCLENBQWhCLENBQVAsRUFBdUIsRUFBQyxRQUF6QjtDQUNFLENBQTJCLEdBQTNCLENBQU0sQ0FBZSxDQUFyQixJQUFBO0NBQ0EsR0FBQSxlQUFBO0NBRkYsVUFBd0I7Q0FEMUIsUUFBc0M7Q0FEeEMsTUFBa0Q7Q0FEcEQsSUFBa0M7Q0FPL0IsQ0FBSCxDQUEyQixDQUFBLEtBQUMsRUFBNUIsV0FBQTtDQUNFLFNBQUEsRUFBQTtDQUFDLENBQUUsRUFBRixDQUFELFFBQUE7U0FBZ0I7Q0FBQSxDQUFPLENBQUwsT0FBQTtDQUFGLENBQWEsS0FBYixHQUFVO1VBQVg7RUFBMEIsQ0FBUSxLQUFqRCxDQUFpRDtDQUM5QyxDQUFFLENBQWdCLENBQVgsQ0FBUCxDQUFELEdBQW1CLE1BQW5CO0NBQ0csQ0FBRSxFQUFLLENBQVAsWUFBRDtDQUFjLENBQU8sQ0FBTCxTQUFBO0NBQUYsQ0FBYSxLQUFiLEtBQVU7RUFBYyxDQUFBLE1BQUEsR0FBdEM7Q0FDRyxDQUFFLENBQXFCLENBQWhCLENBQVAsRUFBdUIsRUFBQyxVQUF6QjtDQUNFLENBQTZCLEdBQTdCLENBQU0sQ0FBYyxPQUFwQjtDQUNBLEdBQUEsaUJBQUE7Q0FGRixZQUF3QjtDQUQxQixVQUFzQztDQUR4QyxRQUFtQjtDQURyQixNQUFpRDtDQURuRCxJQUEyQjtDQWpJN0IsRUFBb0I7O0NBSnBCLENBNklBLENBQXVDLEtBQXZDLENBQXVDLG1CQUF2QztDQUNFLEVBQU8sQ0FBUCxFQUFBLEdBQU87Q0FDSixDQUFELENBQVUsQ0FBVCxFQUFTLENBQUEsTUFBVjtDQUEwQixDQUFhLE1BQVgsQ0FBQTtDQUR2QixPQUNLO0NBRFosSUFBTztDQUFQLEVBR1csQ0FBWCxLQUFZLENBQVo7Q0FDRSxDQUFHLEVBQUYsRUFBRCxVQUFBO0NBQUEsQ0FDRyxFQUFGLEVBQUQsT0FBQTtDQUNBLEdBQUEsU0FBQTtDQUhGLElBQVc7Q0FIWCxDQVFBLENBQW9CLENBQXBCLEtBQXFCLE1BQXJCO0NBQ0UsU0FBQSxFQUFBO0NBQUMsQ0FBRSxFQUFGLEVBQUQsT0FBQTtDQUFnQixDQUFNLENBQUosS0FBQTtDQUFGLENBQVcsS0FBWCxDQUFTO0VBQWEsQ0FBQSxLQUF0QyxDQUFzQztDQUNwQyxFQUFBLFNBQUE7Q0FBQSxDQUEwQixDQUExQixDQUFVLEVBQUEsQ0FBQSxDQUFWO0NBQTBCLENBQWEsT0FBWCxDQUFBO0NBQTVCLFNBQVU7Q0FBVixFQUNHLEdBQUgsRUFBQSxLQUFBO0NBQ0ksQ0FBSixDQUFHLENBQUssQ0FBUixFQUF3QixFQUFDLE1BQXpCO0NBQ0UsQ0FBMkIsR0FBM0IsQ0FBTSxDQUFlLEdBQXJCO0NBQ0EsR0FBQSxhQUFBO0NBRkYsUUFBd0I7Q0FIMUIsTUFBc0M7Q0FEeEMsSUFBb0I7Q0FScEIsQ0FnQkEsQ0FBc0IsQ0FBdEIsS0FBdUIsUUFBdkI7Q0FDRSxTQUFBLEVBQUE7Q0FBQyxDQUFFLEVBQUYsRUFBRCxPQUFBO0NBQWdCLENBQU0sQ0FBSixLQUFBO0NBQUYsQ0FBVyxLQUFYLENBQVM7RUFBYSxDQUFBLEtBQXRDLENBQXNDO0NBQ3BDLEVBQUEsU0FBQTtDQUFBLENBQTBCLENBQTFCLENBQVUsRUFBQSxDQUFBLENBQVY7Q0FBMEIsQ0FBYSxPQUFYLENBQUE7Q0FBNUIsU0FBVTtDQUFWLEVBQ0csR0FBSCxFQUFBLEtBQUE7Q0FDSSxDQUFKLENBQUcsQ0FBSyxDQUFSLEVBQXdCLEVBQUMsTUFBekI7Q0FDTSxFQUFELENBQUssR0FBZ0IsRUFBQyxLQUF6QixHQUFBO0NBQ0UsQ0FBMEIsSUFBcEIsQ0FBTixFQUFBLEdBQUE7Q0FDQSxHQUFBLGVBQUE7Q0FGRixVQUF3QjtDQUQxQixRQUF3QjtDQUgxQixNQUFzQztDQUR4QyxJQUFzQjtDQVNuQixDQUFILENBQXNCLENBQUEsS0FBQyxFQUF2QixNQUFBO0NBQ0UsU0FBQSxFQUFBO0NBQUMsQ0FBRSxFQUFGLFNBQUQ7Q0FBYyxDQUFNLENBQUosS0FBQTtDQUFGLENBQVcsS0FBWCxDQUFTO0VBQWEsQ0FBQSxLQUFwQyxDQUFvQztDQUNqQyxDQUFFLENBQWdCLENBQVgsQ0FBUCxDQUFELEdBQW1CLE1BQW5CO0NBQ0UsRUFBQSxXQUFBO0NBQUEsQ0FBMEIsQ0FBMUIsQ0FBVSxFQUFBLENBQUEsR0FBVjtDQUEwQixDQUFhLE9BQVgsR0FBQTtDQUE1QixXQUFVO0NBQVYsRUFDRyxHQUFILElBQUEsR0FBQTtDQUNJLEVBQUQsQ0FBSyxHQUFnQixFQUFDLEtBQXpCLEdBQUE7Q0FDRSxDQUEwQixJQUFwQixDQUFOLEVBQUEsR0FBQTtDQUNBLEdBQUEsZUFBQTtDQUZGLFVBQXdCO0NBSDFCLFFBQW1CO0NBRHJCLE1BQW9DO0NBRHRDLElBQXNCO0NBMUJ4QixFQUF1Qzs7Q0E3SXZDLENBZ0xBLENBQTBDLEtBQTFDLENBQTBDLHNCQUExQztDQUNFLEVBQU8sQ0FBUCxFQUFBLEdBQU87Q0FDSixDQUFELENBQVUsQ0FBVCxFQUFTLENBQUEsTUFBVjtDQURGLElBQU87Q0FBUCxFQUdXLENBQVgsS0FBWSxDQUFaO0NBQ0UsQ0FBRyxFQUFGLEVBQUQsVUFBQTtDQUFBLENBQ0csRUFBRixFQUFELE9BQUE7Q0FDQSxHQUFBLFNBQUE7Q0FIRixJQUFXO0NBSFgsQ0FRQSxDQUE0QixDQUE1QixLQUE2QixjQUE3QjtDQUNFLFNBQUEsRUFBQTtDQUFDLENBQUUsRUFBRixFQUFELE9BQUE7Q0FBZ0IsQ0FBTSxDQUFKLEtBQUE7Q0FBRixDQUFXLEtBQVgsQ0FBUztFQUFhLENBQUEsS0FBdEMsQ0FBc0M7Q0FDcEMsRUFBQSxTQUFBO0NBQUEsRUFBQSxDQUFVLEVBQUEsQ0FBQSxDQUFWO0NBQUEsRUFDRyxHQUFILEVBQUEsS0FBQTtDQUNJLENBQUosQ0FBRyxDQUFLLENBQVIsRUFBd0IsRUFBQyxNQUF6QjtDQUNFLENBQTZCLEdBQTdCLENBQU0sQ0FBYyxHQUFwQjtDQUNBLEdBQUEsYUFBQTtDQUZGLFFBQXdCO0NBSDFCLE1BQXNDO0NBRHhDLElBQTRCO0NBUjVCLENBZ0JBLENBQThCLENBQTlCLEtBQStCLGdCQUEvQjtDQUNFLFNBQUEsRUFBQTtDQUFDLENBQUUsRUFBRixFQUFELE9BQUE7Q0FBZ0IsQ0FBTSxDQUFKLEtBQUE7Q0FBRixDQUFXLEtBQVgsQ0FBUztFQUFhLENBQUEsS0FBdEMsQ0FBc0M7Q0FDcEMsRUFBQSxTQUFBO0NBQUEsRUFBQSxDQUFVLEVBQUEsQ0FBQSxDQUFWO0NBQUEsRUFDRyxHQUFILEVBQUEsS0FBQTtDQUNJLENBQUosQ0FBRyxDQUFLLENBQVIsRUFBd0IsRUFBQyxNQUF6QjtDQUNNLEVBQUQsQ0FBSyxHQUFnQixFQUFDLEtBQXpCLEdBQUE7Q0FDRSxDQUE2QixHQUE3QixDQUFNLENBQWMsS0FBcEI7Q0FDQSxHQUFBLGVBQUE7Q0FGRixVQUF3QjtDQUQxQixRQUF3QjtDQUgxQixNQUFzQztDQUR4QyxJQUE4QjtDQVMzQixDQUFILENBQThCLENBQUEsS0FBQyxFQUEvQixjQUFBO0NBQ0UsU0FBQSxFQUFBO0NBQUMsQ0FBRSxFQUFGLFNBQUQ7Q0FBYyxDQUFNLENBQUosS0FBQTtDQUFGLENBQVcsS0FBWCxDQUFTO0VBQWEsQ0FBQSxLQUFwQyxDQUFvQztDQUNqQyxDQUFFLENBQWdCLENBQVgsQ0FBUCxDQUFELEdBQW1CLE1BQW5CO0NBQ0UsRUFBQSxXQUFBO0NBQUEsRUFBQSxDQUFVLEVBQUEsQ0FBQSxHQUFWO0NBQUEsRUFDRyxHQUFILElBQUEsR0FBQTtDQUNJLEVBQUQsQ0FBSyxHQUFnQixFQUFDLEtBQXpCLEdBQUE7Q0FDRSxDQUE2QixHQUE3QixDQUFNLENBQWMsS0FBcEI7Q0FDQSxHQUFBLGVBQUE7Q0FGRixVQUF3QjtDQUgxQixRQUFtQjtDQURyQixNQUFvQztDQUR0QyxJQUE4QjtDQTFCaEMsRUFBMEM7Q0FoTDFDOzs7OztBQ0FBO0NBQUEsS0FBQSxhQUFBOztDQUFBLENBQUEsQ0FBUyxDQUFJLEVBQWI7O0NBQUEsQ0FDQSxDQUFjLElBQUEsSUFBZCxZQUFjOztDQURkLENBR0EsQ0FBd0IsS0FBeEIsQ0FBd0IsSUFBeEI7Q0FDRSxFQUFXLENBQVgsS0FBVyxDQUFYO0NBQ0csRUFBYyxDQUFkLEdBQUQsSUFBZSxFQUFmO0NBREYsSUFBVztDQUFYLENBR0EsQ0FBbUIsQ0FBbkIsS0FBbUIsS0FBbkI7Q0FDRSxTQUFBLGdCQUFBO0NBQUEsRUFBUyxFQUFULENBQUE7U0FDRTtDQUFBLENBQUssQ0FBTCxPQUFBO0NBQUEsQ0FBVSxRQUFGO0NBQVIsQ0FDSyxDQUFMLE9BQUE7Q0FEQSxDQUNVLFFBQUY7VUFGRDtDQUFULE9BQUE7Q0FBQSxDQUlDLEVBQWtCLENBQUQsQ0FBbEIsQ0FBa0I7Q0FKbEIsQ0FLdUIsRUFBdkIsQ0FBQSxDQUFBLEdBQUE7Q0FDTyxDQUFtQixJQUFwQixDQUFOLEVBQUEsSUFBQTtDQVBGLElBQW1CO0NBSG5CLENBWUEsQ0FBc0IsQ0FBdEIsS0FBc0IsUUFBdEI7Q0FDRSxTQUFBLHVCQUFBO0NBQUEsRUFBUyxFQUFULENBQUE7U0FDRTtDQUFBLENBQU0sQ0FBTCxPQUFBO0NBQUQsQ0FBVyxRQUFGO0VBQ1QsUUFGTztDQUVQLENBQU0sQ0FBTCxPQUFBO0NBQUQsQ0FBVyxRQUFGO1VBRkY7Q0FBVCxPQUFBO0NBQUEsQ0FJQyxFQUFrQixDQUFELENBQWxCLENBQWtCO0NBSmxCLENBS0MsRUFBa0IsQ0FBRCxDQUFsQixDQUEwQixDQUFSO0NBTGxCLENBTXVCLEVBQXZCLEVBQUEsR0FBQTtDQUNPLENBQW1CLElBQXBCLENBQU4sRUFBQSxJQUFBO0NBUkYsSUFBc0I7Q0FadEIsQ0FzQkEsQ0FBeUIsQ0FBekIsS0FBeUIsV0FBekI7Q0FDRSxTQUFBLHlCQUFBO0NBQUEsRUFBVSxHQUFWO1NBQ0U7Q0FBQSxDQUFNLENBQUwsT0FBQTtDQUFELENBQVcsUUFBRjtFQUNULFFBRlE7Q0FFUixDQUFNLENBQUwsT0FBQTtDQUFELENBQVcsUUFBRjtVQUZEO0NBQVYsT0FBQTtDQUFBLEVBSVUsR0FBVjtTQUNFO0NBQUEsQ0FBTSxDQUFMLE9BQUE7Q0FBRCxDQUFXLFFBQUY7VUFERDtDQUpWLE9BQUE7Q0FBQSxHQU9DLEVBQUQsQ0FBUTtDQVBSLENBUUMsRUFBa0IsRUFBbkIsQ0FBa0I7Q0FSbEIsQ0FTdUIsRUFBdkIsRUFBQSxHQUFBO0NBQ08sQ0FBbUIsSUFBcEIsQ0FBTixFQUFBLElBQUE7U0FBMkI7Q0FBQSxDQUFNLENBQUwsT0FBQTtDQUFELENBQVcsUUFBRjtVQUFWO0NBWEgsT0FXdkI7Q0FYRixJQUF5QjtDQWF0QixDQUFILENBQTJCLE1BQUEsRUFBM0IsV0FBQTtDQUNFLFNBQUEseUJBQUE7Q0FBQSxFQUFVLEdBQVY7U0FDRTtDQUFBLENBQU0sQ0FBTCxPQUFBO0NBQUQsQ0FBVyxRQUFGO0VBQ1QsUUFGUTtDQUVSLENBQU0sQ0FBTCxPQUFBO0NBQUQsQ0FBVyxRQUFGO1VBRkQ7Q0FBVixPQUFBO0NBQUEsRUFJVSxHQUFWO1NBQ0U7Q0FBQSxDQUFNLENBQUwsT0FBQTtDQUFELENBQVcsUUFBRjtFQUNULFFBRlE7Q0FFUixDQUFNLENBQUwsT0FBQTtDQUFELENBQVcsUUFBRjtVQUZEO0NBSlYsT0FBQTtDQUFBLEdBUUMsRUFBRCxDQUFRO0NBUlIsQ0FTQyxFQUFrQixFQUFuQixDQUFrQjtDQVRsQixDQVV1QixFQUF2QixFQUFBLEdBQUE7U0FBd0I7Q0FBQSxDQUFNLENBQUwsT0FBQTtDQUFELENBQVcsUUFBRjtVQUFWO0NBVnZCLE9BVUE7Q0FDTyxDQUFtQixJQUFwQixDQUFOLEVBQUEsSUFBQTtTQUEyQjtDQUFBLENBQU0sQ0FBTCxPQUFBO0NBQUQsQ0FBVyxRQUFGO1VBQVY7Q0FaRCxPQVl6QjtDQVpGLElBQTJCO0NBcEM3QixFQUF3QjtDQUh4Qjs7Ozs7QUNBQTtDQUFBLEtBQUEsU0FBQTs7Q0FBQSxDQUFBLENBQVMsQ0FBSSxFQUFiOztDQUFBLENBQ0EsQ0FBVSxJQUFWLFlBQVU7O0NBRFYsQ0FHQSxDQUFvQixLQUFwQixDQUFBO0NBQ0UsQ0FBQSxDQUErQixDQUEvQixLQUErQixpQkFBL0I7Q0FDRSxTQUFBLHdCQUFBO0NBQUEsQ0FBZ0IsQ0FBQSxDQUFBLEVBQWhCLEdBQUE7Q0FBQSxDQUNnQixDQUFBLENBQUEsRUFBaEIsR0FBQTtDQURBLENBRXVDLENBQTFCLENBQUEsRUFBYixHQUFhLEdBQUE7Q0FGYixFQUlPLENBQVAsRUFBQSxDQUFjLGNBQVA7Q0FDQSxDQUFnQixFQUFoQixFQUFQLENBQU8sTUFBUDtDQUF1QixDQUNmLEVBQU4sSUFBQSxDQURxQjtDQUFBLENBRVIsTUFBYixHQUFBO0NBRkYsT0FBTztDQU5ULElBQStCO0NBQS9CLENBYUEsQ0FBK0IsQ0FBL0IsS0FBK0IsaUJBQS9CO0NBQ0UsU0FBQSxHQUFBO0NBQUEsRUFBTyxDQUFQLEVBQUE7Q0FBTyxDQUFRLEVBQU4sR0FBRixDQUFFO0NBQUYsQ0FBOEIsTUFBYixHQUFBO0NBQXhCLE9BQUE7Q0FBQSxDQUNBLENBQUssR0FBTDtDQUFLLENBQVEsRUFBTixHQUFGLENBQUU7Q0FBRixDQUE4QixNQUFiLEdBQUE7Q0FEdEIsT0FBQTtDQUFBLENBRXdDLENBQXhDLENBQU0sRUFBTixDQUFhLFlBQVA7Q0FDQyxDQUFXLENBQWxCLEVBQUEsQ0FBTSxLQUFOLEVBQUE7Q0FKRixJQUErQjtDQU01QixDQUFILENBQStCLE1BQUEsRUFBL0IsZUFBQTtDQUNFLFNBQUEsR0FBQTtDQUFBLEVBQU8sQ0FBUCxFQUFBO0NBQU8sQ0FBUSxFQUFOLEdBQUYsQ0FBRTtDQUFGLENBQThCLE1BQWIsR0FBQTtDQUF4QixPQUFBO0NBQUEsQ0FDQSxDQUFLLEdBQUw7Q0FBSyxDQUFRLEVBQU4sR0FBRixDQUFFO0NBQUYsQ0FBOEIsTUFBYixHQUFBO0NBRHRCLE9BQUE7Q0FBQSxDQUV3QyxDQUF4QyxDQUFNLEVBQU4sQ0FBYSxZQUFQO0NBQ0MsQ0FBVyxDQUFsQixFQUFBLENBQU0sS0FBTixFQUFBO0NBSkYsSUFBK0I7Q0FwQmpDLEVBQW9CO0NBSHBCOzs7OztBQ0FBO0NBQUEsS0FBQSxTQUFBO0tBQUEsZ0pBQUE7O0NBQUEsQ0FBQSxDQUFTLENBQUksRUFBYjs7Q0FBQSxDQUVBLENBQVUsSUFBVixZQUFVOztDQUZWLENBSUEsQ0FBaUIsR0FBWCxDQUFOLEVBQWlCO0NBQ2YsT0FBQTtDQUFBLENBQTRCLENBQUEsQ0FBNUIsR0FBQSxFQUE0QixTQUE1QjtDQUNFLEVBQVcsQ0FBQSxFQUFYLEdBQVksQ0FBWjtDQUNFLFdBQUE7Q0FBQyxDQUFFLEVBQUYsRUFBRCxTQUFBO0NBQWdCLENBQU0sQ0FBSixPQUFBO0NBQUYsQ0FBVyxLQUFYLEdBQVM7RUFBYSxDQUFBLE1BQUEsQ0FBdEM7Q0FDRyxDQUFFLEVBQUssQ0FBUCxDQUFELFdBQUE7Q0FBZ0IsQ0FBTSxDQUFKLFNBQUE7Q0FBRixDQUFXLE9BQVgsR0FBUztFQUFlLENBQUEsTUFBQSxHQUF4QztDQUNHLENBQUUsRUFBSyxDQUFQLENBQUQsYUFBQTtDQUFnQixDQUFNLENBQUosV0FBQTtDQUFGLENBQVcsR0FBWCxTQUFTO0VBQVcsQ0FBQSxNQUFBLEtBQXBDO0NBQ0UsR0FBQSxpQkFBQTtDQURGLFlBQW9DO0NBRHRDLFVBQXdDO0NBRDFDLFFBQXNDO0NBRHhDLE1BQVc7Q0FBWCxDQU1BLENBQXFCLENBQUEsRUFBckIsR0FBc0IsT0FBdEI7Q0FDRSxXQUFBO0NBQUMsQ0FBRSxDQUFxQixDQUF2QixDQUFELEVBQXdCLEVBQUMsTUFBekI7Q0FDRSxDQUFnQixHQUFoQixDQUFNLENBQWlCLEdBQXZCO0NBQ0EsR0FBQSxhQUFBO0NBRkYsUUFBd0I7Q0FEMUIsTUFBcUI7Q0FOckIsQ0FXQSxDQUFrQyxDQUFBLEVBQWxDLEdBQW1DLG9CQUFuQztDQUNFLFdBQUE7Q0FBQyxDQUFFLENBQXlCLENBQTNCLENBQUQsRUFBNEIsRUFBQyxNQUE3QjtDQUNFLENBQWdCLEdBQWhCLENBQU0sQ0FBaUIsR0FBdkI7Q0FDQSxHQUFBLGFBQUE7Q0FGRixRQUE0QjtDQUQ5QixNQUFrQztDQVhsQyxDQWdCQSxDQUF5QixDQUFBLEVBQXpCLEdBQTBCLFdBQTFCO0NBQ0UsV0FBQTtDQUFDLENBQUUsRUFBRixXQUFEO0NBQWMsQ0FBTyxDQUFMLE9BQUE7Q0FBUyxFQUFPLEVBQWhDLEVBQWdDLEVBQUMsQ0FBakM7Q0FDRSxDQUFnQixHQUFoQixDQUFNLENBQWlCLEdBQXZCO0NBQUEsQ0FDc0IsR0FBdEIsQ0FBTSxDQUFOLEdBQUE7Q0FDQSxHQUFBLGFBQUE7Q0FIRixRQUFnQztDQURsQyxNQUF5QjtDQWhCekIsQ0FzQkEsQ0FBb0IsQ0FBQSxFQUFwQixHQUFxQixNQUFyQjtDQUNFLFdBQUE7Q0FBQyxDQUFFLEVBQUYsR0FBRCxRQUFBO0NBQWlCLENBQU8sQ0FBTCxPQUFBO0VBQVUsQ0FBQSxHQUFBLEdBQUMsQ0FBOUI7Q0FDRSxDQUF3QixHQUF4QixDQUFNLEdBQU4sQ0FBQTtDQUNBLEdBQUEsYUFBQTtDQUZGLFFBQTZCO0NBRC9CLE1BQW9CO0NBdEJwQixDQTJCQSxDQUFtQixDQUFBLEVBQW5CLEdBQW9CLEtBQXBCO0NBQ0UsV0FBQTtDQUFDLENBQUUsQ0FBZ0IsQ0FBbEIsRUFBRCxHQUFtQixNQUFuQjtDQUNHLENBQUUsQ0FBcUIsQ0FBaEIsQ0FBUCxFQUF1QixFQUFDLFFBQXpCO0NBQ0UsS0FBQSxVQUFBO0NBQUEsQ0FBZ0IsR0FBaEIsQ0FBTSxDQUFpQixLQUF2QjtDQUFBLEtBQ0EsTUFBQTs7QUFBYSxDQUFBO29CQUFBLDBCQUFBO3NDQUFBO0NBQUEsS0FBTTtDQUFOOztDQUFOLENBQUEsSUFBUDtDQURBLEtBRUEsTUFBQTs7QUFBaUIsQ0FBQTtvQkFBQSwwQkFBQTtzQ0FBQTtDQUFBLEtBQU07Q0FBTjs7Q0FBVixDQUFBLEdBQVA7Q0FDQSxHQUFBLGVBQUE7Q0FKRixVQUF3QjtDQUQxQixRQUFtQjtDQURyQixNQUFtQjtDQTNCbkIsQ0FtQ0EsQ0FBZ0MsQ0FBQSxFQUFoQyxHQUFpQyxrQkFBakM7Q0FDRSxXQUFBO0NBQUMsQ0FBRSxDQUFILENBQUMsRUFBRCxHQUFxQixNQUFyQjtDQUNHLENBQUUsQ0FBcUIsQ0FBaEIsQ0FBUCxFQUF1QixFQUFDLFFBQXpCO0NBQ0UsQ0FBZ0IsR0FBaEIsQ0FBTSxDQUFpQixLQUF2QjtDQUNBLEdBQUEsZUFBQTtDQUZGLFVBQXdCO0NBRDFCLFFBQXFCO0NBRHZCLE1BQWdDO0NBbkNoQyxDQXlDQSxDQUFzQixDQUFBLEVBQXRCLEdBQXVCLFFBQXZCO0NBQ0UsV0FBQTtDQUFDLENBQUUsRUFBRixXQUFEO0NBQWtCLENBQU8sQ0FBQSxDQUFOLE1BQUE7Q0FBYSxFQUFPLEVBQXZDLEVBQXVDLEVBQUMsQ0FBeEM7Q0FDRSxDQUFrQyxHQUFqQixDQUFYLENBQVcsRUFBakIsQ0FBQTtDQUNBLEdBQUEsYUFBQTtDQUZGLFFBQXVDO0NBRHpDLE1BQXNCO0NBekN0QixDQThDQSxDQUF1QixDQUFBLEVBQXZCLEdBQXdCLFNBQXhCO0NBQ0UsV0FBQTtDQUFDLENBQUUsRUFBRixXQUFEO0NBQWtCLENBQU8sQ0FBQyxDQUFQLEVBQU8sSUFBUDtDQUFzQixFQUFPLEVBQWhELEVBQWdELEVBQUMsQ0FBakQ7Q0FDRSxDQUFrQyxHQUFqQixDQUFYLENBQVcsRUFBakIsQ0FBQTtDQUNBLEdBQUEsYUFBQTtDQUZGLFFBQWdEO0NBRGxELE1BQXVCO0NBOUN2QixDQW1EQSxDQUFhLENBQUEsRUFBYixFQUFBLENBQWM7Q0FDWixXQUFBO0NBQUMsQ0FBRSxFQUFGLFdBQUQ7Q0FBa0IsQ0FBTyxDQUFBLENBQU4sTUFBQTtDQUFELENBQW9CLEdBQU4sS0FBQTtDQUFTLEVBQU8sRUFBaEQsRUFBZ0QsRUFBQyxDQUFqRDtDQUNFLENBQWtDLEdBQWpCLENBQVgsQ0FBVyxFQUFqQixDQUFBO0NBQ0EsR0FBQSxhQUFBO0NBRkYsUUFBZ0Q7Q0FEbEQsTUFBYTtDQUtWLENBQUgsQ0FBaUMsQ0FBQSxLQUFDLElBQWxDLGVBQUE7Q0FDRSxXQUFBO0NBQUMsQ0FBRSxFQUFGLEdBQUQsUUFBQTtDQUFpQixDQUFPLENBQUwsT0FBQTtFQUFVLENBQUEsR0FBQSxHQUFDLENBQTlCO0NBQ0UsRUFBVyxHQUFMLENBQU4sR0FBQTtDQUNDLENBQUUsRUFBSyxDQUFQLEVBQUQsVUFBQTtDQUFpQixDQUFPLENBQUwsU0FBQTtFQUFVLENBQUEsR0FBQSxHQUFDLEdBQTlCO0NBQ0UsQ0FBd0IsR0FBeEIsQ0FBTSxHQUFOLEdBQUE7Q0FDQSxHQUFBLGVBQUE7Q0FGRixVQUE2QjtDQUYvQixRQUE2QjtDQUQvQixNQUFpQztDQXpEbkMsSUFBNEI7Q0FBNUIsQ0FnRUEsQ0FBdUIsQ0FBdkIsS0FBd0IsU0FBeEI7Q0FDRSxTQUFBLEVBQUE7Q0FBQyxDQUFFLEVBQUYsRUFBRCxPQUFBO0NBQWdCLENBQUssTUFBSDtFQUFRLENBQUEsQ0FBQSxJQUExQixDQUEyQjtDQUN6QixDQUFzQixFQUF0QixDQUFBLENBQU0sRUFBTjtDQUFBLENBQzBCLENBQTFCLENBQW9CLEVBQWQsRUFBTjtDQUNBLEdBQUEsV0FBQTtDQUhGLE1BQTBCO0NBRDVCLElBQXVCO0NBaEV2QixDQXNFQSxDQUFvQixDQUFwQixLQUFxQixNQUFyQjtDQUNFLFNBQUEsRUFBQTtDQUFDLENBQUUsRUFBRixFQUFELE9BQUE7Q0FBZ0IsQ0FBTSxDQUFKLEtBQUE7Q0FBRixDQUFXLE1BQUY7RUFBTyxDQUFBLENBQUEsSUFBaEMsQ0FBaUM7Q0FDOUIsQ0FBRSxFQUFLLENBQVAsQ0FBRCxTQUFBO0NBQWdCLENBQU0sQ0FBSixPQUFBO0NBQUYsQ0FBVyxRQUFGO0VBQU8sQ0FBQSxDQUFBLEtBQUMsQ0FBakM7Q0FDRSxDQUFxQixFQUFKLENBQWpCLENBQU0sSUFBTjtDQUVDLENBQUUsQ0FBcUIsQ0FBaEIsQ0FBUCxFQUF1QixFQUFDLFFBQXpCO0NBQ0UsQ0FBZ0IsR0FBaEIsQ0FBTSxDQUFpQixLQUF2QjtDQUNBLEdBQUEsZUFBQTtDQUZGLFVBQXdCO0NBSDFCLFFBQWdDO0NBRGxDLE1BQWdDO0NBRGxDLElBQW9CO0NBdEVwQixDQWdGaUIsQ0FBTixDQUFYLElBQUEsQ0FBWTtDQUNWLFlBQU87Q0FBQSxDQUNHLEVBQU4sR0FERyxDQUNIO0NBREcsQ0FFVSxDQUFBLEtBQWIsR0FBQTtDQUhLLE9BQ1Q7Q0FqRkYsSUFnRlc7Q0FNSCxDQUF3QixDQUFBLElBQWhDLEVBQWdDLEVBQWhDLFdBQUE7Q0FDRSxFQUFXLENBQUEsRUFBWCxHQUFZLENBQVo7Q0FDRSxXQUFBO0NBQUMsQ0FBRSxFQUFGLEVBQUQsU0FBQTtDQUFnQixDQUFNLENBQUosT0FBQTtDQUFGLENBQWEsQ0FBSixLQUFJLEVBQUo7RUFBd0IsQ0FBQSxNQUFBLENBQWpEO0NBQ0csQ0FBRSxFQUFLLENBQVAsQ0FBRCxXQUFBO0NBQWdCLENBQU0sQ0FBSixTQUFBO0NBQUYsQ0FBYSxDQUFKLEtBQUksSUFBSjtFQUF3QixDQUFBLE1BQUEsR0FBakQ7Q0FDRyxDQUFFLEVBQUssQ0FBUCxDQUFELGFBQUE7Q0FBZ0IsQ0FBTSxDQUFKLFdBQUE7Q0FBRixDQUFhLENBQUosS0FBSSxNQUFKO0VBQXdCLENBQUEsTUFBQSxLQUFqRDtDQUNHLENBQUUsRUFBSyxDQUFQLENBQUQsZUFBQTtDQUFnQixDQUFNLENBQUosYUFBQTtDQUFGLENBQWEsQ0FBSixLQUFJLFFBQUo7RUFBd0IsQ0FBQSxNQUFBLE9BQWpEO0NBQ0UsR0FBQSxtQkFBQTtDQURGLGNBQWlEO0NBRG5ELFlBQWlEO0NBRG5ELFVBQWlEO0NBRG5ELFFBQWlEO0NBRG5ELE1BQVc7Q0FBWCxDQU9BLENBQXdCLENBQUEsRUFBeEIsR0FBeUIsVUFBekI7Q0FDRSxPQUFBLElBQUE7V0FBQSxDQUFBO0NBQUEsRUFBVyxLQUFYO0NBQVcsQ0FDVCxDQURTLE9BQUE7Q0FDVCxDQUNFLEdBREYsT0FBQTtDQUNFLENBQVcsTUFBQSxDQUFYLEtBQUE7Y0FERjtZQURTO0NBQVgsU0FBQTtDQUlDLENBQUUsQ0FBMkIsQ0FBN0IsQ0FBRCxFQUE4QixDQUE5QixDQUErQixNQUEvQjtDQUNFLENBQWtDLEdBQWpCLENBQVgsQ0FBVyxFQUFqQixDQUFBO0NBQ0EsR0FBQSxhQUFBO0NBRkYsUUFBOEI7Q0FMaEMsTUFBd0I7Q0FQeEIsQ0FnQkEsQ0FBb0MsQ0FBQSxFQUFwQyxHQUFxQyxzQkFBckM7Q0FDRSxPQUFBLElBQUE7V0FBQSxDQUFBO0NBQUEsRUFBVyxLQUFYO0NBQVcsQ0FDVCxDQURTLE9BQUE7Q0FDVCxDQUNFLEdBREYsT0FBQTtDQUNFLENBQVcsTUFBQSxDQUFYLEtBQUE7Q0FBQSxDQUNjLElBRGQsTUFDQSxFQUFBO2NBRkY7WUFEUztDQUFYLFNBQUE7Q0FLQyxDQUFFLENBQTJCLENBQTdCLENBQUQsRUFBOEIsQ0FBOUIsQ0FBK0IsTUFBL0I7Q0FDRSxDQUFrQyxHQUFqQixDQUFYLENBQVcsRUFBakIsQ0FBQTtDQUNBLEdBQUEsYUFBQTtDQUZGLFFBQThCO0NBTmhDLE1BQW9DO0NBaEJwQyxDQTBCQSxDQUErQyxDQUFBLEVBQS9DLEdBQWdELGlDQUFoRDtDQUNFLE9BQUEsSUFBQTtXQUFBLENBQUE7Q0FBQSxFQUFXLEtBQVg7Q0FBVyxDQUNULENBRFMsT0FBQTtDQUNULENBQ0UsR0FERixPQUFBO0NBQ0UsQ0FBVyxNQUFBLENBQVgsS0FBQTtDQUFBLENBQ2MsSUFEZCxNQUNBLEVBQUE7Y0FGRjtZQURTO0NBQVgsU0FBQTtDQUtDLENBQUUsQ0FBMkIsQ0FBN0IsQ0FBRCxFQUE4QixDQUE5QixDQUErQixNQUEvQjtDQUNFLENBQWtDLEdBQWpCLENBQVgsQ0FBVyxFQUFqQixDQUFBO0NBQ0EsR0FBQSxhQUFBO0NBRkYsUUFBOEI7Q0FOaEMsTUFBK0M7Q0ExQi9DLENBb0NBLENBQXFDLENBQUEsRUFBckMsR0FBc0MsdUJBQXRDO0NBQ0UsT0FBQSxJQUFBO1dBQUEsQ0FBQTtDQUFBLEVBQVcsS0FBWDtDQUFXLENBQ1QsQ0FEUyxPQUFBO0NBQ1QsQ0FDRSxVQURGLEVBQUE7Q0FDRSxDQUNFLE9BREYsS0FBQTtDQUNFLENBQU0sRUFBTixLQUFBLE9BQUE7Q0FBQSxDQUNhLEVBQ1gsT0FERixLQUFBO2dCQUZGO2NBREY7WUFEUztDQUFYLFNBQUE7Q0FPQyxDQUFFLENBQTJCLENBQTdCLENBQUQsRUFBOEIsQ0FBOUIsQ0FBK0IsTUFBL0I7Q0FDRSxDQUFrQyxHQUFqQixDQUFYLENBQVcsRUFBakIsQ0FBQTtDQUNBLEdBQUEsYUFBQTtDQUZGLFFBQThCO0NBUmhDLE1BQXFDO0NBWWxDLENBQUgsQ0FBd0IsQ0FBQSxLQUFDLElBQXpCLE1BQUE7Q0FDRSxPQUFBLElBQUE7V0FBQSxDQUFBO0NBQUEsRUFBVyxLQUFYO0NBQVcsQ0FDVCxDQURTLE9BQUE7Q0FDVCxDQUNFLFVBREYsRUFBQTtDQUNFLENBQ0UsT0FERixLQUFBO0NBQ0UsQ0FBTSxFQUFOLEtBQUEsT0FBQTtDQUFBLENBQ2EsRUFDWCxPQURGLEtBQUE7Z0JBRkY7Y0FERjtZQURTO0NBQVgsU0FBQTtDQU9DLENBQUUsRUFBRixFQUFELFNBQUE7Q0FBZ0IsQ0FBTSxDQUFKLE9BQUE7RUFBUyxDQUFBLE1BQUEsQ0FBM0I7Q0FDRyxDQUFFLENBQTJCLENBQXRCLENBQVAsRUFBNkIsQ0FBOUIsQ0FBK0IsUUFBL0I7Q0FDRSxDQUFrQyxHQUFqQixDQUFYLENBQVcsRUFBakIsR0FBQTtDQUNBLEdBQUEsZUFBQTtDQUZGLFVBQThCO0NBRGhDLFFBQTJCO0NBUjdCLE1BQXdCO0NBakQxQixJQUFnQztDQTNGbEMsRUFJaUI7Q0FKakI7Ozs7O0FDQUE7Q0FBQSxLQUFBLDRCQUFBOztDQUFBLENBQUEsQ0FBUyxDQUFJLEVBQWI7O0NBQUEsQ0FDQSxDQUFtQixJQUFBLFNBQW5COztDQURBLENBRUEsQ0FBVyxJQUFBLENBQVgsWUFBVzs7Q0FGWCxDQVlBLENBQTZCLEtBQTdCLENBQTZCLFNBQTdCO0NBQ1UsQ0FBc0IsQ0FBQSxJQUE5QixFQUE4QixFQUE5QixTQUFBO0NBQ0UsRUFBVyxHQUFYLEdBQVcsQ0FBWDtDQUNFLEVBQWEsQ0FBWixDQUFELEdBQUE7Q0FDQyxFQUFlLENBQWYsSUFBRCxPQUFBLENBQWdCO0NBQ2QsQ0FBUyxDQUFDLElBQVYsQ0FBMEIsRUFBMUI7Q0FBQSxDQUNPLEVBQUMsQ0FBUixLQUFBO0NBREEsQ0FFQSxFQUZBLE1BRUE7Q0FMTyxTQUVPO0NBRmxCLE1BQVc7Q0FBWCxDQU9BLENBQTBCLEdBQTFCLEdBQTBCLFlBQTFCO0NBQ0UsRUFBQSxDQUFDLENBQUssR0FBTjtDQUFXLENBQUEsQ0FBQSxPQUFBO0NBQVgsU0FBQTtDQUFBLENBQytCLENBQWxCLENBQUMsQ0FBZCxDQUFNLEVBQU47Q0FDTyxDQUFRLEVBQUMsRUFBVixDQUFOLENBQXdCLEdBQVQsSUFBZjtDQUhGLE1BQTBCO0NBUDFCLENBWUEsQ0FBcUMsR0FBckMsR0FBcUMsdUJBQXJDO0NBQ0UsRUFBQSxDQUFDLENBQUssR0FBTjtDQUFXLENBQUEsQ0FBQSxPQUFBO0NBQVgsU0FBQTtDQUFBLENBQytCLENBQWxCLENBQUMsQ0FBZCxDQUFNLEVBQU47Q0FDTyxDQUFPLEVBQUMsRUFBVCxFQUFpQixHQUFULElBQWQ7Q0FIRixNQUFxQztDQVpyQyxDQWlCQSxDQUF1QyxHQUF2QyxHQUF1Qyx5QkFBdkM7Q0FDRSxFQUFBLENBQUMsQ0FBSyxHQUFOO0NBQVcsQ0FBQSxFQUFBLE1BQUE7Q0FBWCxTQUFBO0NBQUEsQ0FDK0IsQ0FBbEIsQ0FBQyxDQUFkLENBQU0sRUFBTjtDQUNPLENBQVEsRUFBQyxFQUFWLENBQU4sQ0FBd0IsR0FBVCxJQUFmO0NBSEYsTUFBdUM7Q0FLcEMsQ0FBSCxDQUFzQyxNQUFBLElBQXRDLG9CQUFBO0NBQ0UsRUFBQSxDQUFDLENBQUssR0FBTjtDQUFXLENBQUEsQ0FBQSxPQUFBO0NBQVgsU0FBQTtDQUFBLENBQytCLENBQWxCLENBQUMsQ0FBZCxDQUFNLEVBQU47Q0FEQSxDQUU0QixDQUFOLENBQXJCLEVBQXNELENBQWpDLENBQXRCLEVBQUE7Q0FDTyxDQUFRLEVBQUMsRUFBVixDQUFOLENBQXdCLEdBQVQsSUFBZjtDQUpGLE1BQXNDO0NBdkJ4QyxJQUE4QjtDQURoQyxFQUE2QjtDQVo3Qjs7Ozs7QUNBQTs7QUFDQTtDQUFBLEtBQUEscURBQUE7S0FBQTs7aUJBQUE7O0NBQUEsQ0FBQSxDQUF1QixJQUFoQixLQUFQLElBQXVCOztDQUF2QixDQUNBLENBQTJCLElBQXBCLFNBQVAsSUFBMkI7O0NBRDNCLENBRUEsQ0FBeUIsSUFBbEIsT0FBUCxJQUF5Qjs7Q0FGekIsQ0FHQSxDQUF3QixJQUFqQixNQUFQLElBQXdCOztDQUh4QixDQUlBLENBQXlCLElBQWxCLE9BQVAsSUFBeUI7O0NBSnpCLENBS0EsQ0FBeUIsSUFBbEIsT0FBUCxJQUF5Qjs7Q0FMekIsQ0FNQSxDQUF3QixJQUFqQixNQUFQLElBQXdCOztDQU54QixDQU9BLENBQXlCLElBQWxCLE9BQVAsSUFBeUI7O0NBUHpCLENBUUEsQ0FBdUIsSUFBaEIsS0FBUCxJQUF1Qjs7Q0FSdkIsQ0FXQSxDQUF5QixJQUFsQixDQUFQO0NBQ0U7Ozs7O0NBQUE7O0NBQUEsRUFBWSxJQUFBLEVBQUMsQ0FBYjtDQUNFLFNBQUEsY0FBQTtTQUFBLEdBQUE7Q0FBQSxFQUFZLENBQVgsRUFBRCxDQUFtQixDQUFuQjtDQUdBO0NBQUEsVUFBQSxpQ0FBQTs2QkFBQTtDQUNFLENBQUEsQ0FBSSxDQUFILEVBQUQsQ0FBbUIsQ0FBbkI7Q0FBQSxDQUNtQixDQUFTLENBQTNCLEdBQUQsQ0FBQSxDQUE0QjtDQUFJLElBQUEsRUFBRCxVQUFBO0NBQS9CLFFBQTRCO0NBRDVCLENBRW1CLENBQVksQ0FBOUIsR0FBRCxDQUFBLENBQStCLENBQS9CO0NBQW1DLElBQUEsRUFBRCxHQUFBLE9BQUE7Q0FBbEMsUUFBK0I7Q0FIakMsTUFIQTtDQVNDLENBQWlCLENBQVUsQ0FBM0IsQ0FBRCxHQUFBLENBQTRCLElBQTVCO0NBQWdDLElBQUEsRUFBRCxDQUFBLE9BQUE7Q0FBL0IsTUFBNEI7Q0FWOUIsSUFBWTs7Q0FBWixFQVlNLENBQU4sS0FBTztDQUNMLEdBQUMsQ0FBSyxDQUFOO0NBR0MsQ0FBd0MsQ0FBekMsQ0FBQyxDQUFLLEVBQTJDLENBQXRDLENBQVcsSUFBdEI7Q0FoQkYsSUFZTTs7Q0FaTixFQWtCTSxDQUFOLEtBQU07Q0FDSixHQUFRLENBQUssQ0FBTixPQUFBO0NBbkJULElBa0JNOztDQWxCTjs7Q0FEd0MsT0FBUTs7Q0FYbEQsQ0FtQ0EsQ0FBdUIsSUFBaEIsQ0FBZ0IsQ0FBQyxHQUF4QjtDQUNFLFVBQU87Q0FBQSxDQUNMLElBQUEsT0FBSTtDQURDLENBRUMsQ0FBQSxDQUFOLEVBQUEsR0FBTztDQUNMLENBQUEsRUFBRyxJQUFTLE9BQVo7Q0FIRyxNQUVDO0NBSGEsS0FDckI7Q0FwQ0YsRUFtQ3VCOztDQW5DdkIsQ0FrREEsQ0FBMkIsSUFBcEIsR0FBUDtDQUFxQjs7Ozs7Q0FBQTs7Q0FBQTs7Q0FBeUI7O0NBbEQ5QyxDQW9EQSxDQUFrQyxJQUEzQixVQUFQO0NBQ0U7Ozs7O0NBQUE7O0NBQUEsRUFBWSxJQUFBLEVBQUMsQ0FBYjtDQUNFLEtBQUEsQ0FBQSwyQ0FBTTtDQUlMLEVBQUcsQ0FBSCxFQUFELE9BQUEsOE9BQVk7Q0FMZCxJQUFZOztDQUFaLEVBY0UsR0FERjtDQUNFLENBQXdCLElBQXhCLENBQUEsY0FBQTtDQUFBLENBQzJCLElBQTNCLElBREEsY0FDQTtDQWZGLEtBQUE7O0NBQUEsRUFrQlUsS0FBVixDQUFVO0NBRVIsSUFBQSxLQUFBO0NBQUEsQ0FBNEIsQ0FBcEIsQ0FBVSxDQUFsQixDQUFBLEVBQVEsQ0FBcUI7Q0FDMUIsR0FBYSxHQUFkLFFBQUE7Q0FETSxNQUFvQjtBQUdqQixDQUFYLENBQThCLENBQW5CLENBQW1CLENBQWIsSUFBYyxJQUF4QjtDQUNBLEdBQUQsSUFBSixPQUFBO0NBRGUsTUFBYTtDQXZCaEMsSUFrQlU7O0NBbEJWLEVBMkJPLEVBQVAsSUFBTztDQUNKLEdBQUEsR0FBRCxNQUFBO0NBNUJGLElBMkJPOztDQTNCUCxFQThCVSxLQUFWLENBQVU7Q0FDUixHQUFHLEVBQUgsRUFBRztDQUNBLEdBQUEsR0FBRCxHQUFBLEtBQUE7UUFGTTtDQTlCVixJQThCVTs7Q0E5QlY7O0NBRDBEOztDQXBENUQsQ0F3RkEsQ0FBMEIsSUFBbkIsRUFBb0IsTUFBM0I7Q0FDRSxPQUFBO0NBQUEsQ0FBbUMsQ0FBcEIsQ0FBZixHQUFlLENBQWYsQ0FBZTtDQUNOLE1BQVQsQ0FBQSxHQUFBO0NBMUZGLEVBd0YwQjs7Q0F4RjFCLENBNEZBLElBQUEsQ0FBQSxVQUFrQjtDQTVGbEI7Ozs7O0FDRUE7Q0FBQSxLQUFBLEtBQUE7O0NBQUEsQ0FBTTtDQUNTLEVBQUEsQ0FBQSxpQkFBQTtDQUNYLEVBQUEsQ0FBQyxDQUFELENBQUE7Q0FBQSxDQUFBLENBQ1MsQ0FBUixDQUFELENBQUE7Q0FGRixJQUFhOztDQUFiLEVBSVEsRUFBQSxDQUFSLEdBQVM7Q0FDUCxTQUFBLGdFQUFBO0NBQUEsQ0FBQSxDQUFPLENBQVAsRUFBQTtDQUFBLENBQUEsQ0FDVSxHQUFWLENBQUE7QUFHQSxDQUFBLFVBQUEsaUNBQUE7MEJBQUE7QUFDUyxDQUFQLENBQXFCLENBQWQsQ0FBSixDQUFJLEdBQVA7Q0FDRSxHQUFJLE1BQUo7VUFGSjtDQUFBLE1BSkE7Q0FBQSxDQVM4QixDQUE5QixDQUErQixDQUFoQixDQUFmO0NBR0E7Q0FBQSxVQUFBOzJCQUFBO0FBQ1MsQ0FBUCxDQUFrQixDQUFYLENBQUosSUFBSDtDQUNFLEdBQUEsQ0FBQSxFQUFPLEdBQVA7QUFDVSxDQUFKLENBQXFCLENBQUksQ0FBekIsQ0FBSSxDQUZaLENBRVksR0FGWjtDQUdFLEVBQWMsQ0FBVixNQUFKO0NBQUEsR0FDQSxDQUFBLEVBQU8sR0FBUDtVQUxKO0NBQUEsTUFaQTtBQW1CQSxDQUFBLFVBQUEscUNBQUE7NEJBQUE7QUFDRSxDQUFBLEVBQW1CLENBQVgsQ0FBTSxDQUFkLEVBQUE7Q0FERixNQW5CQTtBQXNCQSxDQUFBLFVBQUEsa0NBQUE7eUJBQUE7Q0FDRSxFQUFZLENBQVgsQ0FBTSxHQUFQO0NBREYsTUF0QkE7Q0F5QkEsQ0FBYyxFQUFQLEdBQUEsTUFBQTtDQTlCVCxJQUlROztDQUpSOztDQURGOztDQUFBLENBaUNBLENBQWlCLEdBQVgsQ0FBTixJQWpDQTtDQUFBOzs7OztBQ0FBO0NBQUEsQ0FBQSxDQUFxQixJQUFkLEVBQWUsQ0FBdEI7Q0FDRSxVQUFPO0NBQUEsQ0FDQyxFQUFOLEVBQUEsQ0FESztDQUFBLENBRVEsQ0FBSSxHQUFqQixFQUFhLENBQUEsRUFBYjtDQUhpQixLQUNuQjtDQURGLEVBQXFCOztDQUFyQixDQU9BLENBQWdDLEdBQUEsQ0FBekIsRUFBMEIsWUFBakM7Q0FDRSxLQUFBLEVBQUE7Q0FBQSxDQUFBLENBQUssQ0FBTCxFQUFXLE1BQU47Q0FBTCxDQUNBLENBQUssQ0FBTCxFQUFXLE1BQU47Q0FDTCxVQUFPO0NBQUEsQ0FDQyxFQUFOLEVBQUEsR0FESztDQUFBLENBRVEsQ0FDVixHQURILEtBQUE7Q0FMNEIsS0FHOUI7Q0FWRixFQU9nQzs7Q0FQaEMsQ0FxQkEsQ0FBeUIsRUFBQSxFQUFsQixFQUFtQixLQUExQjtDQUVFLEtBQUEsRUFBQTtDQUFBLENBQTBELENBQTdDLENBQWIsQ0FBMEQsQ0FBMUQsQ0FBeUMsRUFBa0IsRUFBTCxDQUF6QztDQUE2RCxDQUFrQixFQUFuQixDQUFlLENBQWYsT0FBQTtDQUE3QyxJQUE4QjtDQUMxRCxDQUEwRCxFQUEvQixDQUFjLENBQTVCLEVBQU4sR0FBQTtDQXhCVCxFQXFCeUI7O0NBckJ6QixDQTBCQSxDQUE4QixDQUFBLEdBQXZCLEVBQXdCLFVBQS9CO0NBQ0UsT0FBQSxvREFBQTtDQUFBLENBQUEsQ0FBSyxDQUFMLE9BQXNCO0NBQXRCLENBQ0EsQ0FBSyxDQUFMLE9BQXNCO0NBRHRCLENBRUEsQ0FBSyxDQUFMLE9BQW9CO0NBRnBCLENBR0EsQ0FBSyxDQUFMLE9BQW9CO0NBSHBCLENBTUEsQ0FBSyxDQUFMLEdBTkE7Q0FBQSxDQU9BLENBQUssQ0FBTCxHQVBBO0NBQUEsQ0FVaUIsQ0FBVixDQUFQO0NBVkEsQ0FXUSxDQUFBLENBQVIsQ0FBQTtDQUNBLEVBQXdCLENBQXhCLENBQWdCO0NBQWhCLEVBQUEsQ0FBUyxDQUFULENBQUE7TUFaQTtDQWFBLEVBQXdCLENBQXhCLENBQWdCO0NBQWhCLEVBQUEsQ0FBUyxDQUFULENBQUE7TUFiQTtDQUFBLENBZ0JjLENBQUQsQ0FBYixDQUFjLEtBQWQ7Q0FoQkEsQ0FpQm9CLENBQU4sQ0FBZCxPQUFBO0NBQ0EsRUFBVSxDQUFWO0NBQ0csRUFBTyxDQUFQLENBQUQsRUFBQSxHQUErQyxDQUFBLEVBQS9DO01BREY7Q0FHUyxFQUFhLENBQWQsR0FBTixHQUF1QyxDQUFBLEVBQXRDO01BdEJ5QjtDQTFCOUIsRUEwQjhCO0NBMUI5Qjs7Ozs7QUNIQTtDQUFBLEtBQUEsVUFBQTs7Q0FBQSxDQUFBLENBQVMsQ0FBSSxFQUFiOztDQUFBLENBRU07Q0FDUyxDQUFBLENBQUEsQ0FBQSxjQUFDO0NBQ1osQ0FBQSxDQUFNLENBQUwsRUFBRDtDQURGLElBQWE7O0NBQWIsRUFHYSxNQUFDLEVBQWQ7Q0FDRSxTQUFBLFVBQUE7Q0FBQTtDQUFBLFVBQUEsZ0NBQUE7eUJBQUE7QUFDcUMsQ0FBbkMsRUFBRyxDQUFBLENBQStCLEVBQS9CLENBQUg7Q0FDRSxDQUFPLEVBQUEsT0FBQSxNQUFBO1VBRlg7Q0FBQSxNQUFBO0NBR08sQ0FBVyxDQUFsQixDQUFBLEVBQU0sT0FBTixDQUF1QjtDQVB6QixJQUdhOztDQUhiLEVBU08sRUFBUCxJQUFRO0NBQ04sU0FBQSxVQUFBO0NBQUE7Q0FBQSxVQUFBLGdDQUFBO3lCQUFBO0FBQ3FDLENBQW5DLEVBQUcsQ0FBQSxDQUErQixFQUEvQixDQUFIO0NBQ0UsRUFBQSxDQUEyQixHQUFwQixHQUFQLEVBQVk7Q0FBWixHQUNBLEdBQUEsR0FBQTtDQUNBLGVBQUE7VUFKSjtDQUFBLE1BQUE7Q0FLTyxDQUFXLENBQWxCLENBQUEsRUFBTSxPQUFOLENBQXVCO0NBZnpCLElBU087O0NBVFAsQ0FpQlksQ0FBTixDQUFOLENBQU0sSUFBQztDQUNMLFNBQUEseUJBQUE7Q0FBQTtDQUFBO1lBQUEsK0JBQUE7eUJBQUE7QUFDcUMsQ0FBbkMsRUFBRyxDQUFBLENBQStCLEVBQS9CLENBQUg7Q0FDRSxDQUFTLENBQVQsQ0FBTyxDQUFZLEtBQW5CO0NBQUEsRUFDRyxFQUFIO01BRkYsSUFBQTtDQUFBO1VBREY7Q0FBQTt1QkFESTtDQWpCTixJQWlCTTs7Q0FqQk4sRUF1Qk0sQ0FBTixLQUFNO0NBQ0osQ0FBVSxFQUFGLFNBQUQ7Q0F4QlQsSUF1Qk07O0NBdkJOLEVBMEJNLENBQU4sQ0FBTSxJQUFDO0NBQ00sQ0FBTyxHQUFsQixLQUFBLEdBQUE7Q0EzQkYsSUEwQk07O0NBMUJOOztDQUhGOztDQUFBLENBZ0NBLENBQWlCLEdBQVgsQ0FBTixDQWhDQTtDQUFBOzs7OztBQ0FBO0NBQUEsS0FBQSwrQkFBQTtLQUFBOztvU0FBQTs7Q0FBQSxDQUFBLENBQWlCLElBQUEsT0FBakIsSUFBaUI7O0NBQWpCLENBQ0EsQ0FBVSxJQUFWLElBQVU7O0NBRFYsQ0FLTTtDQUNKOztDQUFhLEVBQUEsQ0FBQSxHQUFBLGVBQUM7Q0FDWiw4Q0FBQTtDQUFBLG9EQUFBO0NBQUEsb0RBQUE7Q0FBQSxLQUFBLHNDQUFBO0NBQUEsRUFDQSxDQUFDLEVBQUQsQ0FBYztDQURkLEVBRW1CLENBQWxCLENBRkQsQ0FFQSxTQUFBO0NBRkEsRUFHa0IsQ0FBakIsRUFBRCxDQUF5QixPQUF6QjtDQUhBLENBTTJCLEVBQTFCLEVBQUQsQ0FBQSxDQUFBLEtBQUEsQ0FBQTtDQU5BLENBTzJCLEVBQTFCLEVBQUQsQ0FBQSxDQUFBLEtBQUEsQ0FBQTtDQUdBLEVBQUEsQ0FBRyxFQUFIO0NBQ0UsR0FBQyxJQUFELEVBQUEsSUFBZTtRQVhqQjtDQUFBLEdBYUMsRUFBRDtDQWRGLElBQWE7O0NBQWIsRUFpQkUsR0FERjtDQUNFLENBQXdCLElBQXhCLE1BQUEsU0FBQTtDQUFBLENBQ3dCLElBQXhCLE9BREEsUUFDQTtDQWxCRixLQUFBOztDQUFBLEVBb0JRLEdBQVIsR0FBUTtDQUNOLEdBQUMsRUFBRCxHQUFBLEtBQWU7Q0FEVCxZQUVOLDBCQUFBO0NBdEJGLElBb0JROztDQXBCUixFQXdCUSxHQUFSLEdBQVE7Q0FDTixFQUFJLENBQUgsRUFBRCxHQUFvQixLQUFBO0NBR3BCLEdBQUcsRUFBSCxjQUFBO0NBQ0UsR0FBQyxJQUFELFlBQUEsRUFBQTtBQUNVLENBQUosRUFBQSxDQUFBLEVBRlIsRUFBQSxPQUFBO0NBR0UsR0FBQyxJQUFELFlBQUEsRUFBQTtDQUNPLEdBQUQsRUFKUixFQUFBLE9BQUE7Q0FLRSxHQUFDLElBQUQsWUFBQSxDQUFBO0FBQ1UsQ0FBSixHQUFBLEVBTlIsRUFBQSxFQUFBO0NBT0UsR0FBQyxJQUFELFlBQUE7TUFQRixFQUFBO0NBU0UsQ0FBdUUsQ0FBekMsQ0FBN0IsR0FBb0MsQ0FBckMsRUFBOEIsU0FBQSxDQUE5QjtRQVpGO0FBZXlDLENBZnpDLENBZXFDLENBQXJDLENBQUMsRUFBRCxJQUFBLEtBQUE7Q0FHQyxDQUFvQyxFQUFwQyxDQUF3RCxLQUF6RCxHQUFBLEVBQUE7Q0EzQ0YsSUF3QlE7O0NBeEJSLEVBNkNhLE1BQUEsRUFBYjtDQUNFLEVBQW1CLENBQWxCLEVBQUQsU0FBQTtDQUFBLEVBQ3dCLENBQXZCLENBREQsQ0FDQSxjQUFBO0NBREEsR0FFQyxFQUFELElBQUEsSUFBZTtDQUNkLEdBQUEsRUFBRCxPQUFBO0NBakRGLElBNkNhOztDQTdDYixFQW1EZSxNQUFDLElBQWhCO0NBQ0UsR0FBRyxFQUFILFNBQUE7Q0FDRSxFQUFtQixDQUFsQixDQUFELEdBQUEsT0FBQTtDQUFBLEVBQ3dCLENBQXZCLENBREQsR0FDQSxZQUFBO0NBREEsRUFJQSxDQUFDLEdBQWEsQ0FBZCxFQUFPO0NBSlAsQ0FLd0IsQ0FBeEIsQ0FBQyxHQUFELENBQUEsS0FBQTtRQU5GO0NBQUEsRUFRYyxDQUFiLEVBQUQsQ0FBcUIsR0FBckI7Q0FDQyxHQUFBLEVBQUQsT0FBQTtDQTdERixJQW1EZTs7Q0FuRGYsRUErRGUsTUFBQSxJQUFmO0NBQ0UsRUFBbUIsQ0FBbEIsQ0FBRCxDQUFBLFNBQUE7Q0FBQSxFQUN3QixDQUF2QixFQUFELGNBQUE7Q0FDQyxHQUFBLEVBQUQsT0FBQTtDQWxFRixJQStEZTs7Q0EvRGYsRUFvRVksTUFBQSxDQUFaO0NBQ0csQ0FBZSxDQUFoQixDQUFDLENBQUQsRUFBQSxNQUFBO0NBckVGLElBb0VZOztDQXBFWjs7Q0FEeUIsT0FBUTs7Q0FMbkMsQ0E4RUEsQ0FBaUIsR0FBWCxDQUFOLEtBOUVBO0NBQUE7Ozs7O0FDQUE7Q0FBQSxLQUFBLDBIQUFBOztDQUFBLENBQUEsQ0FBMEIsSUFBQSxLQUFBLFdBQTFCOztDQUFBLENBQ0EsQ0FBYyxJQUFBLElBQWQsQ0FBYzs7Q0FEZCxDQUVBLENBQVUsSUFBVixLQUFVOztDQUZWLENBSU07Q0FDUyxDQUFPLENBQVAsQ0FBQSxHQUFBLFVBQUM7Q0FDWixFQUFRLENBQVAsRUFBRDtDQUFBLENBQUEsQ0FDZSxDQUFkLEVBQUQsS0FBQTtDQUVBLEdBQUcsRUFBSCxDQUFHLEVBQUEsR0FBSDtDQUNFLEVBQWEsQ0FBWixHQUFtQixDQUFwQixDQUFBO1FBTFM7Q0FBYixJQUFhOztDQUFiLEVBT2UsQ0FBQSxLQUFDLElBQWhCO0NBQ0UsU0FBQSxtQkFBQTtDQUFBLEVBQVMsQ0FBQyxFQUFWO0NBR0EsR0FBbUMsRUFBbkMsR0FBQTtDQUFBLEVBQVksQ0FBQyxJQUFiLENBQUE7UUFIQTtDQUFBLENBS2tDLENBQWpCLENBQUEsRUFBakIsR0FBaUIsQ0FBakI7Q0FMQSxFQU1VLENBQVIsRUFBRixJQU5BO0NBT0MsRUFBb0IsQ0FBcEIsT0FBWSxFQUFiO0NBZkYsSUFPZTs7Q0FQZixFQWlCa0IsQ0FBQSxLQUFDLE9BQW5CO0NBQ0UsU0FBQSw4QkFBQTtDQUFBLEVBQVMsQ0FBQyxFQUFWO0NBRUEsR0FBRyxFQUFILEdBQUcsR0FBSDtDQUNFLENBQUEsQ0FBTyxDQUFQLElBQUE7QUFDQSxDQUFBLEVBQUEsVUFBUyx5RkFBVDtDQUNFLEVBQVUsQ0FBTixNQUFKLEVBQXNCO0NBRHhCLFFBREE7QUFJQSxDQUFBLFlBQUEsOEJBQUE7MEJBQUE7Q0FDRSxDQUFvQixDQUFkLENBQUgsQ0FBMkMsQ0FBMUIsR0FBakIsQ0FBSDtDQUNFLEVBQUEsT0FBQSxFQUFBO1lBRko7Q0FBQSxRQUxGO1FBRkE7QUFXQSxDQVhBLEdBV1MsRUFBVDtBQUNBLENBQUEsR0FBUSxFQUFSLEtBQW9CLEVBQXBCO0NBOUJGLElBaUJrQjs7Q0FqQmxCOztDQUxGOztDQUFBLENBdUNNO0NBQ1MsQ0FBTyxDQUFQLENBQUEsS0FBQSxXQUFDO0NBQ1osRUFBUSxDQUFQLEVBQUQ7Q0FBQSxFQUNhLENBQVosRUFBRCxHQUFBO0NBREEsQ0FBQSxDQUdTLENBQVIsQ0FBRCxDQUFBO0NBSEEsQ0FBQSxDQUlXLENBQVYsRUFBRCxDQUFBO0NBSkEsQ0FBQSxDQUtXLENBQVYsRUFBRCxDQUFBO0NBR0EsR0FBRyxFQUFILE1BQUcsT0FBSDtDQUNFLEdBQUMsSUFBRCxHQUFBO1FBVlM7Q0FBYixJQUFhOztDQUFiLEVBWWEsTUFBQSxFQUFiO0NBRUUsU0FBQSwrQ0FBQTtDQUFBLEVBQWlCLENBQWhCLEVBQUQsR0FBaUIsSUFBakI7QUFFQSxDQUFBLEVBQUEsUUFBUywyRkFBVDtDQUNFLEVBQUEsS0FBQSxJQUFrQjtDQUNsQixDQUFvQixDQUFkLENBQUgsQ0FBMkMsQ0FBM0MsRUFBSCxDQUFHLElBQStCO0NBQ2hDLEVBQU8sQ0FBUCxDQUFPLEtBQVAsRUFBK0I7Q0FBL0IsRUFDTyxDQUFOLENBQU0sS0FBUDtVQUpKO0NBQUEsTUFGQTtDQUFBLENBQUEsQ0FTZ0IsQ0FBYyxDQUEwQixDQUF4RCxHQUE2QixDQUE3QixFQUE2QjtBQUM3QixDQUFBLFVBQUEsc0NBQUE7OEJBQUE7Q0FDRSxFQUFTLENBQVIsQ0FBc0IsRUFBZCxDQUFUO0NBREYsTUFWQTtDQUFBLENBQUEsQ0FjaUIsQ0FBYyxDQUEwQixDQUF6RCxHQUE4QixFQUE5QixDQUE4QjtDQUM3QixDQUF3QyxDQUE5QixDQUFWLENBQW1CLENBQVQsQ0FBWCxJQUFvQixFQUFwQjtDQTdCRixJQVlhOztDQVpiLENBK0JpQixDQUFYLENBQU4sR0FBTSxDQUFBLENBQUM7Q0FDTCxTQUFBLEVBQUE7Q0FBQSxZQUFPO0NBQUEsQ0FBTyxDQUFBLEVBQVAsRUFBTyxDQUFQLENBQVE7Q0FDWixDQUFxQixHQUFyQixFQUFELENBQUEsRUFBQSxPQUFBO0NBREssUUFBTztDQURWLE9BQ0o7Q0FoQ0YsSUErQk07O0NBL0JOLENBbUNvQixDQUFYLEVBQUEsRUFBVCxDQUFTLENBQUM7Q0FDUixHQUFBLE1BQUE7Q0FBQSxHQUFHLEVBQUgsQ0FBRyxHQUFBO0NBQ0QsQ0FBNEIsS0FBQSxDQUE1QjtRQURGO0NBR0MsQ0FBZSxDQUFlLENBQTlCLENBQUQsRUFBQSxDQUFBLENBQWdDLElBQWhDO0NBQ0UsR0FBRyxJQUFILE9BQUE7Q0FBNEIsRUFBZSxDQUExQixFQUFXLENBQVgsVUFBQTtVQURZO0NBQS9CLENBRUUsR0FGRixFQUErQjtDQXZDakMsSUFtQ1M7O0NBbkNULENBMkN1QixDQUFYLEVBQUEsRUFBQSxDQUFBLENBQUMsQ0FBYjtDQUNFLE9BQUEsRUFBQTtDQUFBLENBQXNDLENBQTNCLENBQW1CLENBQVYsQ0FBcEIsRUFBQSxlQUFzQztDQUF0QyxDQUd5QyxDQUE5QixHQUFYLEVBQUEsV0FBVztDQUhYLENBSWtELENBQXZDLEdBQVgsRUFBQSxvQkFBVztDQUVYLEdBQUcsRUFBSCxDQUFHO0NBQ0QsR0FBQSxHQUFpQyxDQUFqQyxHQUFjO1FBUGhCO0NBU0EsR0FBRyxDQUFILENBQUEsQ0FBRztDQUNELENBQTZCLENBQWxCLEVBQUEsRUFBeUIsQ0FBcEM7UUFWRjtDQUFBLENBYTJCLENBQWhCLEdBQVgsRUFBQSxDQUE0QjtDQUFTLEVBQUQsTUFBQSxNQUFBO0NBQXpCLE1BQWdCO0NBQzNCLEdBQUcsRUFBSCxTQUFBO0NBQXlCLE1BQVIsQ0FBQSxPQUFBO1FBZlA7Q0EzQ1osSUEyQ1k7O0NBM0NaLENBNERjLENBQU4sRUFBQSxDQUFSLENBQVEsRUFBQztBQUNBLENBQVAsRUFBVSxDQUFQLEVBQUg7Q0FDRSxFQUFHLEtBQUgsQ0FBVTtRQURaO0NBQUEsRUFJQSxDQUFDLEVBQUQsRUFBQTtDQUpBLEVBS0EsQ0FBQyxFQUFELElBQUE7Q0FFQSxHQUFHLEVBQUgsU0FBQTtDQUF5QixFQUFSLElBQUEsUUFBQTtRQVJYO0NBNURSLElBNERROztDQTVEUixDQXNFUSxDQUFBLEVBQUEsQ0FBUixDQUFRLEVBQUM7Q0FDUCxDQUFpQixDQUFkLENBQUEsQ0FBQSxDQUFIO0NBQ0UsQ0FBbUIsRUFBbEIsQ0FBa0IsR0FBbkIsRUFBQTtDQUFBLENBQ0EsRUFBQyxJQUFELEdBQUE7Q0FEQSxDQUVBLEVBQUMsSUFBRCxLQUFBO1FBSEY7Q0FLQSxHQUFHLEVBQUgsU0FBQTtDQUFpQixNQUFBLFFBQUE7UUFOWDtDQXRFUixJQXNFUTs7Q0F0RVIsRUE4RVUsS0FBVixDQUFXO0NBQ1QsRUFBVSxDQUFULENBQU0sQ0FBUDtDQUNBLEdBQUcsRUFBSCxHQUFBO0NBQ2UsRUFBaUIsQ0FBaEIsS0FBMkIsR0FBNUIsQ0FBQSxFQUFiO1FBSE07Q0E5RVYsSUE4RVU7O0NBOUVWLENBbUZhLENBQUEsTUFBQyxFQUFkO0FBQ0UsQ0FBQSxDQUFjLEVBQU4sQ0FBTSxDQUFkO0NBQ0EsR0FBRyxFQUFILEdBQUE7Q0FDZSxDQUFiLENBQXlDLENBQWhCLE1BQXpCLEVBQVksQ0FBWSxFQUF4QjtRQUhTO0NBbkZiLElBbUZhOztDQW5GYixFQXdGWSxNQUFDLENBQWI7Q0FDRSxFQUFZLENBQVgsRUFBRCxDQUFTO0NBQ1QsR0FBRyxFQUFILEdBQUE7Q0FDZSxFQUFXLENBQVYsR0FBc0MsRUFBdkMsR0FBQSxHQUFiO1FBSFE7Q0F4RlosSUF3Rlk7O0NBeEZaLENBNkZlLENBQUEsTUFBQyxJQUFoQjtBQUNFLENBQUEsQ0FBZ0IsRUFBUixFQUFSLENBQWdCO0NBQ2hCLEdBQUcsRUFBSCxHQUFBO0NBQ2UsRUFBVyxDQUFWLEdBQXNDLEVBQXZDLEdBQUEsR0FBYjtRQUhXO0NBN0ZmLElBNkZlOztDQTdGZixFQWtHWSxNQUFDLENBQWI7Q0FDRSxFQUFZLENBQVgsRUFBRCxDQUFTO0NBQ1QsR0FBRyxFQUFILEdBQUE7Q0FDZSxFQUFXLENBQVYsRUFBc0MsQ0FBQSxFQUF2QyxHQUFBLEdBQWI7UUFIUTtDQWxHWixJQWtHWTs7Q0FsR1osQ0F1R2UsQ0FBQSxNQUFDLElBQWhCO0FBQ0UsQ0FBQSxDQUFnQixFQUFSLEVBQVIsQ0FBZ0I7Q0FDaEIsR0FBRyxFQUFILEdBQUE7Q0FDZSxFQUFXLENBQVYsRUFBc0MsQ0FBQSxFQUF2QyxHQUFBLEdBQWI7UUFIVztDQXZHZixJQXVHZTs7Q0F2R2YsQ0E0R2MsQ0FBUCxDQUFBLENBQVAsRUFBTyxDQUFBLENBQUM7Q0FFTixTQUFBLGtCQUFBO1NBQUEsR0FBQTtBQUFBLENBQUEsVUFBQSxnQ0FBQTt3QkFBQTtBQUNTLENBQVAsQ0FBdUIsQ0FBaEIsQ0FBSixHQUFJLENBQVA7Q0FDRSxFQUFBLENBQUMsSUFBRCxFQUFBO1VBRko7Q0FBQSxNQUFBO0NBQUEsQ0FJaUMsQ0FBdkIsQ0FBUyxDQUFBLENBQW5CLENBQUE7Q0FFQSxHQUFHLEVBQUgsQ0FBVTtDQUNSLEVBQU8sQ0FBUCxHQUEwQixDQUExQixHQUFPO1FBUFQ7Q0FVQyxDQUFlLENBQWUsQ0FBOUIsQ0FBRCxFQUFBLENBQUEsQ0FBZ0MsSUFBaEM7Q0FDRSxXQUFBLEtBQUE7QUFBQSxDQUFBLFlBQUEsbUNBQUE7Z0NBQUE7QUFDUyxDQUFQLENBQW1ELENBQXBDLENBQVosQ0FBdUMsQ0FBckIsQ0FBTixHQUFmO0NBRUUsR0FBRyxDQUFBLENBQW1DLENBQTVCLEtBQVY7Q0FDRSxDQUFnQixFQUFiLEVBQUEsUUFBSDtDQUNFLHdCQURGO2dCQURGO2NBQUE7Q0FBQSxFQUdBLEVBQUMsQ0FBa0IsS0FBbkIsQ0FBQTtZQU5KO0NBQUEsUUFBQTtDQVFBLEdBQUcsSUFBSCxPQUFBO0NBQWlCLE1BQUEsVUFBQTtVQVRZO0NBQS9CLENBVUUsR0FWRixFQUErQjtDQXhIakMsSUE0R087O0NBNUdQLEVBb0lnQixJQUFBLEVBQUMsS0FBakI7Q0FDVSxHQUFVLEVBQVYsQ0FBUixNQUFBO0NBcklGLElBb0lnQjs7Q0FwSWhCLEVBdUlnQixJQUFBLEVBQUMsS0FBakI7Q0FDVSxDQUFrQixFQUFULENBQVQsRUFBUixNQUFBO0NBeElGLElBdUlnQjs7Q0F2SWhCLENBMElxQixDQUFOLElBQUEsRUFBQyxJQUFoQjtDQUNFLENBQXdDLENBQXpCLENBQVosRUFBSCxDQUFZO0NBQ1YsRUFBa0IsQ0FBakIsSUFBRCxLQUFBO1FBREY7Q0FFQSxHQUFHLEVBQUgsU0FBQTtDQUFpQixNQUFBLFFBQUE7UUFISjtDQTFJZixJQTBJZTs7Q0ExSWYsQ0ErSWUsQ0FBQSxJQUFBLEVBQUMsSUFBaEI7Q0FDRSxDQUFBLEVBQUMsRUFBRCxPQUFBO0NBQ0EsR0FBRyxFQUFILFNBQUE7Q0FBaUIsTUFBQSxRQUFBO1FBRko7Q0EvSWYsSUErSWU7O0NBL0lmLENBb0pZLENBQU4sQ0FBTixHQUFNLEVBQUM7QUFDRSxDQUFQLENBQXFCLENBQWQsQ0FBSixDQUFJLENBQVAsQ0FBc0M7Q0FDcEMsRUFBQSxDQUFDLElBQUQ7UUFERjtDQUVBLEdBQUcsRUFBSCxTQUFBO0NBQWlCLE1BQUEsUUFBQTtRQUhiO0NBcEpOLElBb0pNOztDQXBKTjs7Q0F4Q0Y7O0NBQUEsQ0FrTUEsQ0FBWSxNQUFaO0NBQ3FDLENBQWlCLENBQUEsSUFBcEQsRUFBcUQsRUFBckQsdUJBQWtDO0NBQ2hDLEdBQUEsTUFBQTtDQUFBLENBQUksQ0FBQSxDQUFJLEVBQVI7Q0FBQSxFQUNPLEVBQUssQ0FBWjtDQUNBLENBQU8sTUFBQSxLQUFBO0NBSFQsSUFBb0Q7Q0FuTXRELEVBa01ZOztDQWxNWixDQXlNQSxDQUFzQixDQUFBLElBQUEsQ0FBQyxVQUF2QjtDQUNFLE9BQUEsd0JBQUE7QUFBQSxDQUFBLFFBQUEsTUFBQTs2QkFBQTtDQUNFLEdBQUcsQ0FBaUIsQ0FBcEIsQ0FBb0IsUUFBakI7Q0FDRCxFQUFBLEVBQVksRUFBQSxDQUFaLEdBQXFCO0NBQ3JCLEVBQU0sQ0FBSCxDQUFZLEVBQWYsQ0FBQTtDQUNFLGVBREY7VUFEQTtDQUFBLENBSXdDLENBQTdCLENBQVgsRUFBVyxFQUFYLEdBQW9DO0NBSnBDLENBTXNCLENBQWYsQ0FBUCxFQUFPLEVBQVAsQ0FBdUI7Q0FDckIsRUFBVyxDQUFTLENBQWlCLEVBQXJDLFVBQU87Q0FERixRQUFlO0NBTnRCLENBVXdCLENBQVosQ0FBQSxJQUFaLENBQUE7Q0FDRSxnQkFBTztDQUFBLENBQU8sQ0FBTCxTQUFBO0NBQUYsQ0FDTCxDQUFpQyxDQUE3QixFQUFnQixFQURILEVBQ2pCLENBQWtELENBRGpDO0NBREcsV0FDdEI7Q0FEVSxRQUFZO0NBVnhCLENBZ0JnQyxDQUFwQixDQUFvQixFQUFwQixFQUFaLENBQUE7Q0FBK0MsR0FBRCxJQUFKLFNBQUE7Q0FBOUIsUUFBb0I7Q0FoQmhDLENBbUJnQyxDQUFwQixHQUFBLEVBQVosQ0FBQSxDQUFZO0NBR1osR0FBRyxDQUFNLEVBQUEsQ0FBVCxNQUFrQjtDQUNoQixDQUFnQyxDQUFwQixDQUFvQixFQUFwQixHQUFaLENBQUE7Q0FBK0MsR0FBRCxDQUFtQixFQUFBLENBQXZCLE1BQWdDLEtBQWhDO0NBQTlCLFVBQW9CO1VBdkJsQztDQUFBLENBMEIrQixDQUFuQixFQUFBLEdBQVosQ0FBQTtDQTFCQSxDQTZCMEIsQ0FBbkIsQ0FBUCxDQUFPLEdBQVAsQ0FBTztRQS9CWDtDQUFBLElBQUE7Q0FnQ0EsR0FBQSxPQUFPO0NBMU9ULEVBeU1zQjs7Q0F6TXRCLENBNE9BLENBQStCLENBQUEsSUFBQSxDQUFDLG1CQUFoQztDQUNFLE9BQUEsT0FBQTtBQUFBLENBQUEsUUFBQSxNQUFBOzZCQUFBO0NBQ0UsR0FBRyxDQUFpQixDQUFwQixTQUFHLENBQWlCO0NBQ2xCLEVBQUEsRUFBWSxHQUFaLEdBQThCLEtBQWxCO0NBQ1osRUFBTSxDQUFILENBQVksR0FBZixDQUFBO0NBQ0UsZUFERjtVQURBO0NBQUEsQ0FLc0IsQ0FBZixDQUFQLEVBQU8sRUFBUCxDQUF1QjtBQUVkLENBQVAsRUFBVyxDQUFSLENBQWlDLEVBQXBDLEdBQUE7Q0FDRSxJQUFBLGNBQU87WUFEVDtDQUlBLENBQXdDLENBQU4sSUFBcEIsT0FBUCxHQUFBO0NBTkYsUUFBZTtRQVAxQjtDQUFBLElBQUE7Q0FlQSxHQUFBLE9BQU87Q0E1UFQsRUE0TytCOztDQTVPL0IsQ0E4UEEsQ0FBaUIsR0FBWCxDQUFOO0NBOVBBOzs7OztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlVQTtDQUFBLENBQUEsQ0FBaUIs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QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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QTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FD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Q0FDQyxDQUE0QixHQUE1QixJQUFELEtBQUEsR0FBQTtDQUhGLFFBQTRCO1FBRnBCO0NBNURaLElBNERZOztDQTVEWjs7Q0FEcUI7O0NBSHZCLENBdUVBLENBQWlCLEdBQVgsQ0FBTixDQXZFQTtDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiYXNzZXJ0ID0gY2hhaS5hc3NlcnRcbkxvY2F0aW9uVmlldyA9IHJlcXVpcmUgJy4uL2FwcC9qcy9Mb2NhdGlvblZpZXcnXG5VSURyaXZlciA9IHJlcXVpcmUgJy4vaGVscGVycy9VSURyaXZlcidcblxuY2xhc3MgTW9ja0xvY2F0aW9uRmluZGVyXG4gIGNvbnN0cnVjdG9yOiAgLT5cbiAgICBfLmV4dGVuZCBALCBCYWNrYm9uZS5FdmVudHNcblxuICBnZXRMb2NhdGlvbjogLT5cbiAgc3RhcnRXYXRjaDogLT5cbiAgc3RvcFdhdGNoOiAtPlxuXG5kZXNjcmliZSAnTG9jYXRpb25WaWV3JywgLT5cbiAgY29udGV4dCAnV2l0aCBubyBzZXQgbG9jYXRpb24nLCAtPlxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgIEBsb2NhdGlvbkZpbmRlciA9IG5ldyBNb2NrTG9jYXRpb25GaW5kZXIoKVxuICAgICAgQGxvY2F0aW9uVmlldyA9IG5ldyBMb2NhdGlvblZpZXcobG9jOm51bGwsIGxvY2F0aW9uRmluZGVyOiBAbG9jYXRpb25GaW5kZXIpXG4gICAgICBAdWkgPSBuZXcgVUlEcml2ZXIoQGxvY2F0aW9uVmlldy5lbClcblxuICAgIGl0ICdkaXNwbGF5cyBVbnNwZWNpZmllZCcsIC0+XG4gICAgICBhc3NlcnQuaW5jbHVkZShAdWkudGV4dCgpLCAnVW5zcGVjaWZpZWQnKVxuXG4gICAgaXQgJ2Rpc2FibGVzIG1hcCcsIC0+XG4gICAgICBhc3NlcnQuaXNUcnVlIEB1aS5nZXREaXNhYmxlZChcIk1hcFwiKSBcblxuICAgIGl0ICdhbGxvd3Mgc2V0dGluZyBsb2NhdGlvbicsIC0+XG4gICAgICBAdWkuY2xpY2soJ1NldCcpXG4gICAgICBzZXRQb3MgPSBudWxsXG4gICAgICBAbG9jYXRpb25WaWV3Lm9uICdsb2NhdGlvbnNldCcsIChwb3MpIC0+XG4gICAgICAgIHNldFBvcyA9IHBvc1xuXG4gICAgICBAbG9jYXRpb25GaW5kZXIudHJpZ2dlciAnZm91bmQnLCB7IGNvb3JkczogeyBsYXRpdHVkZTogMiwgbG9uZ2l0dWRlOiAzLCBhY2N1cmFjeTogMTB9fVxuICAgICAgYXNzZXJ0LmVxdWFsIHNldFBvcy5jb29yZGluYXRlc1sxXSwgMlxuXG4gICAgaXQgJ0Rpc3BsYXlzIGVycm9yJywgLT5cbiAgICAgIEB1aS5jbGljaygnU2V0JylcbiAgICAgIHNldFBvcyA9IG51bGxcbiAgICAgIEBsb2NhdGlvblZpZXcub24gJ2xvY2F0aW9uc2V0JywgKHBvcykgLT5cbiAgICAgICAgc2V0UG9zID0gcG9zXG5cbiAgICAgIEBsb2NhdGlvbkZpbmRlci50cmlnZ2VyICdlcnJvcidcbiAgICAgIGFzc2VydC5lcXVhbCBzZXRQb3MsIG51bGxcbiAgICAgIGFzc2VydC5pbmNsdWRlKEB1aS50ZXh0KCksICdDYW5ub3QnKVxuXG4gIGNvbnRleHQgJ1dpdGggc2V0IGxvY2F0aW9uJywgLT5cbiAgICBiZWZvcmVFYWNoIC0+XG4gICAgICBAbG9jYXRpb25GaW5kZXIgPSBuZXcgTW9ja0xvY2F0aW9uRmluZGVyKClcbiAgICAgIEBsb2NhdGlvblZpZXcgPSBuZXcgTG9jYXRpb25WaWV3KGxvYzogeyB0eXBlOiBcIlBvaW50XCIsIGNvb3JkaW5hdGVzOiBbMTAsIDIwXX0sIGxvY2F0aW9uRmluZGVyOiBAbG9jYXRpb25GaW5kZXIpXG4gICAgICBAdWkgPSBuZXcgVUlEcml2ZXIoQGxvY2F0aW9uVmlldy5lbClcblxuICAgIGl0ICdkaXNwbGF5cyBXYWl0aW5nJywgLT5cbiAgICAgIGFzc2VydC5pbmNsdWRlKEB1aS50ZXh0KCksICdXYWl0aW5nJylcblxuICAgIGl0ICdkaXNwbGF5cyByZWxhdGl2ZScsIC0+XG4gICAgICBAbG9jYXRpb25GaW5kZXIudHJpZ2dlciAnZm91bmQnLCB7IGNvb3JkczogeyBsYXRpdHVkZTogMjEsIGxvbmdpdHVkZTogMTAsIGFjY3VyYWN5OiAxMH19XG4gICAgICBhc3NlcnQuaW5jbHVkZShAdWkudGV4dCgpLCAnMTExLjJrbSBTJylcblxuIiwiYXNzZXJ0ID0gY2hhaS5hc3NlcnRcbkxvY2FsRGIgPSByZXF1aXJlIFwiLi4vYXBwL2pzL2RiL0xvY2FsRGJcIlxuZGJfcXVlcmllcyA9IHJlcXVpcmUgXCIuL2RiX3F1ZXJpZXNcIlxuXG5kZXNjcmliZSAnTG9jYWxEYicsIC0+XG4gIGJlZm9yZSAtPlxuICAgIEBkYiA9IG5ldyBMb2NhbERiKCd0ZXN0JylcblxuICBiZWZvcmVFYWNoIChkb25lKSAtPlxuICAgIEBkYi5yZW1vdmVDb2xsZWN0aW9uKCd0ZXN0JylcbiAgICBAZGIuYWRkQ29sbGVjdGlvbigndGVzdCcpXG4gICAgZG9uZSgpXG5cbiAgZGVzY3JpYmUgXCJwYXNzZXMgcXVlcmllc1wiLCAtPlxuICAgIGRiX3F1ZXJpZXMuY2FsbCh0aGlzKVxuXG4gIGl0ICdjYWNoZXMgcm93cycsIChkb25lKSAtPlxuICAgIEBkYi50ZXN0LmNhY2hlIFt7IF9pZDogMSwgYTogJ2FwcGxlJyB9XSwge30sIHt9LCA9PlxuICAgICAgQGRiLnRlc3QuZmluZCh7fSkuZmV0Y2ggKHJlc3VsdHMpIC0+XG4gICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzWzBdLmEsICdhcHBsZSdcbiAgICAgICAgZG9uZSgpXG5cbiAgaXQgJ2NhY2hlIG92ZXJ3cml0ZSBleGlzdGluZycsIChkb25lKSAtPlxuICAgIEBkYi50ZXN0LmNhY2hlIFt7IF9pZDogMSwgYTogJ2FwcGxlJyB9XSwge30sIHt9LCA9PlxuICAgICAgQGRiLnRlc3QuY2FjaGUgW3sgX2lkOiAxLCBhOiAnYmFuYW5hJyB9XSwge30sIHt9LCA9PlxuICAgICAgICBAZGIudGVzdC5maW5kKHt9KS5mZXRjaCAocmVzdWx0cykgLT5cbiAgICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0c1swXS5hLCAnYmFuYW5hJ1xuICAgICAgICAgIGRvbmUoKVxuXG4gIGl0IFwiY2FjaGUgZG9lc24ndCBvdmVyd3JpdGUgdXBzZXJ0XCIsIChkb25lKSAtPlxuICAgIEBkYi50ZXN0LnVwc2VydCB7IF9pZDogMSwgYTogJ2FwcGxlJyB9LCA9PlxuICAgICAgQGRiLnRlc3QuY2FjaGUgW3sgX2lkOiAxLCBhOiAnYmFuYW5hJyB9XSwge30sIHt9LCA9PlxuICAgICAgICBAZGIudGVzdC5maW5kKHt9KS5mZXRjaCAocmVzdWx0cykgLT5cbiAgICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0c1swXS5hLCAnYXBwbGUnXG4gICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJjYWNoZSBkb2Vzbid0IG92ZXJ3cml0ZSByZW1vdmVcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnRlc3QuY2FjaGUgW3sgX2lkOiAxLCBhOiAnZGVsZXRlJyB9XSwge30sIHt9LCA9PlxuICAgICAgQGRiLnRlc3QucmVtb3ZlIDEsID0+XG4gICAgICBAZGIudGVzdC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdiYW5hbmEnIH1dLCB7fSwge30sID0+XG4gICAgICAgIEBkYi50ZXN0LmZpbmQoe30pLmZldGNoIChyZXN1bHRzKSAtPlxuICAgICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzLmxlbmd0aCwgMFxuICAgICAgICAgIGRvbmUoKVxuXG4gIGl0IFwiY2FjaGUgcmVtb3ZlcyBtaXNzaW5nIHVuc29ydGVkXCIsIChkb25lKSAtPlxuICAgIEBkYi50ZXN0LmNhY2hlIFt7IF9pZDogMSwgYTogJ2EnIH0sIHsgX2lkOiAyLCBhOiAnYicgfSwgeyBfaWQ6IDMsIGE6ICdjJyB9XSwge30sIHt9LCA9PlxuICAgICAgQGRiLnRlc3QuY2FjaGUgW3sgX2lkOiAxLCBhOiAnYScgfSwgeyBfaWQ6IDMsIGE6ICdjJyB9XSwge30sIHt9LCA9PlxuICAgICAgICBAZGIudGVzdC5maW5kKHt9KS5mZXRjaCAocmVzdWx0cykgLT5cbiAgICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0cy5sZW5ndGgsIDJcbiAgICAgICAgICBkb25lKClcblxuICBpdCBcImNhY2hlIHJlbW92ZXMgbWlzc2luZyBmaWx0ZXJlZFwiLCAoZG9uZSkgLT5cbiAgICBAZGIudGVzdC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdhJyB9LCB7IF9pZDogMiwgYTogJ2InIH0sIHsgX2lkOiAzLCBhOiAnYycgfV0sIHt9LCB7fSwgPT5cbiAgICAgIEBkYi50ZXN0LmNhY2hlIFt7IF9pZDogMSwgYTogJ2EnIH1dLCB7X2lkOiB7JGx0OjN9fSwge30sID0+XG4gICAgICAgIEBkYi50ZXN0LmZpbmQoe30sIHtzb3J0OlsnX2lkJ119KS5mZXRjaCAocmVzdWx0cykgLT5cbiAgICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIF8ucGx1Y2socmVzdWx0cywgJ19pZCcpLCBbMSwzXVxuICAgICAgICAgIGRvbmUoKVxuXG4gIGl0IFwiY2FjaGUgcmVtb3ZlcyBtaXNzaW5nIHNvcnRlZCBsaW1pdGVkXCIsIChkb25lKSAtPlxuICAgIEBkYi50ZXN0LmNhY2hlIFt7IF9pZDogMSwgYTogJ2EnIH0sIHsgX2lkOiAyLCBhOiAnYicgfSwgeyBfaWQ6IDMsIGE6ICdjJyB9XSwge30sIHt9LCA9PlxuICAgICAgQGRiLnRlc3QuY2FjaGUgW3sgX2lkOiAxLCBhOiAnYScgfV0sIHt9LCB7c29ydDpbJ19pZCddLCBsaW1pdDoyfSwgPT5cbiAgICAgICAgQGRiLnRlc3QuZmluZCh7fSwge3NvcnQ6WydfaWQnXX0pLmZldGNoIChyZXN1bHRzKSAtPlxuICAgICAgICAgIGFzc2VydC5kZWVwRXF1YWwgXy5wbHVjayhyZXN1bHRzLCAnX2lkJyksIFsxLDNdXG4gICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJjYWNoZSBkb2VzIG5vdCByZW1vdmUgbWlzc2luZyBzb3J0ZWQgbGltaXRlZCBwYXN0IGVuZFwiLCAoZG9uZSkgLT5cbiAgICBAZGIudGVzdC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdhJyB9LCB7IF9pZDogMiwgYTogJ2InIH0sIHsgX2lkOiAzLCBhOiAnYycgfSwgeyBfaWQ6IDQsIGE6ICdkJyB9XSwge30sIHt9LCA9PlxuICAgICAgQGRiLnRlc3QucmVtb3ZlIDIsID0+XG4gICAgICAgIEBkYi50ZXN0LmNhY2hlIFt7IF9pZDogMSwgYTogJ2EnIH0sIHsgX2lkOiAyLCBhOiAnYicgfV0sIHt9LCB7c29ydDpbJ19pZCddLCBsaW1pdDoyfSwgPT5cbiAgICAgICAgICBAZGIudGVzdC5maW5kKHt9LCB7c29ydDpbJ19pZCddfSkuZmV0Y2ggKHJlc3VsdHMpIC0+XG4gICAgICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIF8ucGx1Y2socmVzdWx0cywgJ19pZCcpLCBbMSwzLDRdXG4gICAgICAgICAgICBkb25lKClcblxuICBpdCBcInJldHVybnMgcGVuZGluZyB1cHNlcnRzXCIsIChkb25lKSAtPlxuICAgIEBkYi50ZXN0LmNhY2hlIFt7IF9pZDogMSwgYTogJ2FwcGxlJyB9XSwge30sIHt9LCA9PlxuICAgICAgQGRiLnRlc3QudXBzZXJ0IHsgX2lkOiAyLCBhOiAnYmFuYW5hJyB9LCA9PlxuICAgICAgICBAZGIudGVzdC5wZW5kaW5nVXBzZXJ0cyAocmVzdWx0cykgPT5cbiAgICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0cy5sZW5ndGgsIDFcbiAgICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0c1swXS5hLCAnYmFuYW5hJ1xuICAgICAgICAgIGRvbmUoKVxuXG4gIGl0IFwicmVzb2x2ZXMgcGVuZGluZyB1cHNlcnRzXCIsIChkb25lKSAtPlxuICAgIEBkYi50ZXN0LnVwc2VydCB7IF9pZDogMiwgYTogJ2JhbmFuYScgfSwgPT5cbiAgICAgIEBkYi50ZXN0LnJlc29sdmVVcHNlcnQgeyBfaWQ6IDIsIGE6ICdiYW5hbmEnIH0sID0+XG4gICAgICAgIEBkYi50ZXN0LnBlbmRpbmdVcHNlcnRzIChyZXN1bHRzKSA9PlxuICAgICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzLmxlbmd0aCwgMFxuICAgICAgICAgIGRvbmUoKVxuXG4gIGl0IFwicmV0YWlucyBjaGFuZ2VkIHBlbmRpbmcgdXBzZXJ0c1wiLCAoZG9uZSkgLT5cbiAgICBAZGIudGVzdC51cHNlcnQgeyBfaWQ6IDIsIGE6ICdiYW5hbmEnIH0sID0+XG4gICAgICBAZGIudGVzdC51cHNlcnQgeyBfaWQ6IDIsIGE6ICdiYW5hbmEyJyB9LCA9PlxuICAgICAgICBAZGIudGVzdC5yZXNvbHZlVXBzZXJ0IHsgX2lkOiAyLCBhOiAnYmFuYW5hJyB9LCA9PlxuICAgICAgICAgIEBkYi50ZXN0LnBlbmRpbmdVcHNlcnRzIChyZXN1bHRzKSA9PlxuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHMubGVuZ3RoLCAxXG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0c1swXS5hLCAnYmFuYW5hMidcbiAgICAgICAgICAgIGRvbmUoKVxuXG4gIGl0IFwicmVtb3ZlcyBwZW5kaW5nIHVwc2VydHNcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnRlc3QudXBzZXJ0IHsgX2lkOiAyLCBhOiAnYmFuYW5hJyB9LCA9PlxuICAgICAgQGRiLnRlc3QucmVtb3ZlIDIsID0+XG4gICAgICAgIEBkYi50ZXN0LnBlbmRpbmdVcHNlcnRzIChyZXN1bHRzKSA9PlxuICAgICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzLmxlbmd0aCwgMFxuICAgICAgICAgIGRvbmUoKVxuXG4gIGl0IFwicmV0dXJucyBwZW5kaW5nIHJlbW92ZXNcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnRlc3QuY2FjaGUgW3sgX2lkOiAxLCBhOiAnYXBwbGUnIH1dLCB7fSwge30sID0+XG4gICAgICBAZGIudGVzdC5yZW1vdmUgMSwgPT5cbiAgICAgICAgQGRiLnRlc3QucGVuZGluZ1JlbW92ZXMgKHJlc3VsdHMpID0+XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHMubGVuZ3RoLCAxXG4gICAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHNbMF0sIDFcbiAgICAgICAgICBkb25lKClcblxuICBpdCBcInJlc29sdmVzIHBlbmRpbmcgcmVtb3Zlc1wiLCAoZG9uZSkgLT5cbiAgICBAZGIudGVzdC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdhcHBsZScgfV0sIHt9LCB7fSwgPT5cbiAgICAgIEBkYi50ZXN0LnJlbW92ZSAxLCA9PlxuICAgICAgICBAZGIudGVzdC5yZXNvbHZlUmVtb3ZlIDEsID0+XG4gICAgICAgICAgQGRiLnRlc3QucGVuZGluZ1JlbW92ZXMgKHJlc3VsdHMpID0+XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0cy5sZW5ndGgsIDBcbiAgICAgICAgICAgIGRvbmUoKVxuXG4gIGl0IFwic2VlZHNcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnRlc3Quc2VlZCB7IF9pZDogMSwgYTogJ2FwcGxlJyB9LCA9PlxuICAgICAgQGRiLnRlc3QuZmluZCh7fSkuZmV0Y2ggKHJlc3VsdHMpIC0+XG4gICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzWzBdLmEsICdhcHBsZSdcbiAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJkb2VzIG5vdCBvdmVyd3JpdGUgZXhpc3RpbmdcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnRlc3QuY2FjaGUgW3sgX2lkOiAxLCBhOiAnYmFuYW5hJyB9XSwge30sIHt9LCA9PlxuICAgICAgQGRiLnRlc3Quc2VlZCB7IF9pZDogMSwgYTogJ2FwcGxlJyB9LCA9PlxuICAgICAgICBAZGIudGVzdC5maW5kKHt9KS5mZXRjaCAocmVzdWx0cykgLT5cbiAgICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0c1swXS5hLCAnYmFuYW5hJ1xuICAgICAgICAgIGRvbmUoKVxuXG4gIGl0IFwiZG9lcyBub3QgYWRkIHJlbW92ZWRcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnRlc3QuY2FjaGUgW3sgX2lkOiAxLCBhOiAnYXBwbGUnIH1dLCB7fSwge30sID0+XG4gICAgICBAZGIudGVzdC5yZW1vdmUgMSwgPT5cbiAgICAgICAgQGRiLnRlc3Quc2VlZCB7IF9pZDogMSwgYTogJ2FwcGxlJyB9LCA9PlxuICAgICAgICAgIEBkYi50ZXN0LmZpbmQoe30pLmZldGNoIChyZXN1bHRzKSAtPlxuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHMubGVuZ3RoLCAwXG4gICAgICAgICAgICBkb25lKClcblxuZGVzY3JpYmUgJ0xvY2FsRGIgd2l0aCBsb2NhbCBzdG9yYWdlJywgLT5cbiAgYmVmb3JlIC0+XG4gICAgQGRiID0gbmV3IExvY2FsRGIoJ3Rlc3QnLCB7IG5hbWVzcGFjZTogXCJkYi50ZXN0XCIgfSlcblxuICBiZWZvcmVFYWNoIChkb25lKSAtPlxuICAgIEBkYi5yZW1vdmVDb2xsZWN0aW9uKCd0ZXN0JylcbiAgICBAZGIuYWRkQ29sbGVjdGlvbigndGVzdCcpXG4gICAgZG9uZSgpXG5cbiAgaXQgXCJyZXRhaW5zIGl0ZW1zXCIsIChkb25lKSAtPlxuICAgIEBkYi50ZXN0LnVwc2VydCB7IF9pZDoxLCBhOlwiQWxpY2VcIiB9LCA9PlxuICAgICAgZGIyID0gbmV3IExvY2FsRGIoJ3Rlc3QnLCB7IG5hbWVzcGFjZTogXCJkYi50ZXN0XCIgfSlcbiAgICAgIGRiMi5hZGRDb2xsZWN0aW9uICd0ZXN0J1xuICAgICAgZGIyLnRlc3QuZmluZCh7fSkuZmV0Y2ggKHJlc3VsdHMpIC0+XG4gICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzWzBdLmEsIFwiQWxpY2VcIlxuICAgICAgICBkb25lKClcblxuICBpdCBcInJldGFpbnMgdXBzZXJ0c1wiLCAoZG9uZSkgLT5cbiAgICBAZGIudGVzdC51cHNlcnQgeyBfaWQ6MSwgYTpcIkFsaWNlXCIgfSwgPT5cbiAgICAgIGRiMiA9IG5ldyBMb2NhbERiKCd0ZXN0JywgeyBuYW1lc3BhY2U6IFwiZGIudGVzdFwiIH0pXG4gICAgICBkYjIuYWRkQ29sbGVjdGlvbiAndGVzdCdcbiAgICAgIGRiMi50ZXN0LmZpbmQoe30pLmZldGNoIChyZXN1bHRzKSAtPlxuICAgICAgICBkYjIudGVzdC5wZW5kaW5nVXBzZXJ0cyAodXBzZXJ0cykgLT5cbiAgICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIHJlc3VsdHMsIHVwc2VydHNcbiAgICAgICAgICBkb25lKClcblxuICBpdCBcInJldGFpbnMgcmVtb3Zlc1wiLCAoZG9uZSkgLT5cbiAgICBAZGIudGVzdC5zZWVkIHsgX2lkOjEsIGE6XCJBbGljZVwiIH0sID0+XG4gICAgICBAZGIudGVzdC5yZW1vdmUgMSwgPT5cbiAgICAgICAgZGIyID0gbmV3IExvY2FsRGIoJ3Rlc3QnLCB7IG5hbWVzcGFjZTogXCJkYi50ZXN0XCIgfSlcbiAgICAgICAgZGIyLmFkZENvbGxlY3Rpb24gJ3Rlc3QnXG4gICAgICAgIGRiMi50ZXN0LnBlbmRpbmdSZW1vdmVzIChyZW1vdmVzKSAtPlxuICAgICAgICAgIGFzc2VydC5kZWVwRXF1YWwgcmVtb3ZlcywgWzFdXG4gICAgICAgICAgZG9uZSgpXG5cbmRlc2NyaWJlICdMb2NhbERiIHdpdGhvdXQgbG9jYWwgc3RvcmFnZScsIC0+XG4gIGJlZm9yZSAtPlxuICAgIEBkYiA9IG5ldyBMb2NhbERiKCd0ZXN0JylcblxuICBiZWZvcmVFYWNoIChkb25lKSAtPlxuICAgIEBkYi5yZW1vdmVDb2xsZWN0aW9uKCd0ZXN0JylcbiAgICBAZGIuYWRkQ29sbGVjdGlvbigndGVzdCcpXG4gICAgZG9uZSgpXG5cbiAgaXQgXCJkb2VzIG5vdCByZXRhaW4gaXRlbXNcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnRlc3QudXBzZXJ0IHsgX2lkOjEsIGE6XCJBbGljZVwiIH0sID0+XG4gICAgICBkYjIgPSBuZXcgTG9jYWxEYigndGVzdCcpXG4gICAgICBkYjIuYWRkQ29sbGVjdGlvbiAndGVzdCdcbiAgICAgIGRiMi50ZXN0LmZpbmQoe30pLmZldGNoIChyZXN1bHRzKSAtPlxuICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0cy5sZW5ndGgsIDBcbiAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJkb2VzIG5vdCByZXRhaW4gdXBzZXJ0c1wiLCAoZG9uZSkgLT5cbiAgICBAZGIudGVzdC51cHNlcnQgeyBfaWQ6MSwgYTpcIkFsaWNlXCIgfSwgPT5cbiAgICAgIGRiMiA9IG5ldyBMb2NhbERiKCd0ZXN0JylcbiAgICAgIGRiMi5hZGRDb2xsZWN0aW9uICd0ZXN0J1xuICAgICAgZGIyLnRlc3QuZmluZCh7fSkuZmV0Y2ggKHJlc3VsdHMpIC0+XG4gICAgICAgIGRiMi50ZXN0LnBlbmRpbmdVcHNlcnRzICh1cHNlcnRzKSAtPlxuICAgICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzLmxlbmd0aCwgMFxuICAgICAgICAgIGRvbmUoKVxuXG4gIGl0IFwiZG9lcyBub3QgcmV0YWluIHJlbW92ZXNcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnRlc3Quc2VlZCB7IF9pZDoxLCBhOlwiQWxpY2VcIiB9LCA9PlxuICAgICAgQGRiLnRlc3QucmVtb3ZlIDEsID0+XG4gICAgICAgIGRiMiA9IG5ldyBMb2NhbERiKCd0ZXN0JylcbiAgICAgICAgZGIyLmFkZENvbGxlY3Rpb24gJ3Rlc3QnXG4gICAgICAgIGRiMi50ZXN0LnBlbmRpbmdSZW1vdmVzIChyZW1vdmVzKSAtPlxuICAgICAgICAgIGFzc2VydC5lcXVhbCByZW1vdmVzLmxlbmd0aCwgMFxuICAgICAgICAgIGRvbmUoKVxuXG4iLCJhc3NlcnQgPSBjaGFpLmFzc2VydFxuSXRlbVRyYWNrZXIgPSByZXF1aXJlIFwiLi4vYXBwL2pzL0l0ZW1UcmFja2VyXCJcblxuZGVzY3JpYmUgJ0l0ZW1UcmFja2VyJywgLT5cbiAgYmVmb3JlRWFjaCAtPlxuICAgIEB0cmFja2VyID0gbmV3IEl0ZW1UcmFja2VyKClcblxuICBpdCBcInJlY29yZHMgYWRkc1wiLCAtPlxuICAgIGl0ZW1zID0gIFtcbiAgICAgIF9pZDogMSwgeDoxXG4gICAgICBfaWQ6IDIsIHg6MlxuICAgIF1cbiAgICBbYWRkcywgcmVtb3Zlc10gPSBAdHJhY2tlci51cGRhdGUoaXRlbXMpXG4gICAgYXNzZXJ0LmRlZXBFcXVhbCBhZGRzLCBpdGVtc1xuICAgIGFzc2VydC5kZWVwRXF1YWwgcmVtb3ZlcywgW11cblxuICBpdCBcInJlbWVtYmVycyBpdGVtc1wiLCAtPlxuICAgIGl0ZW1zID0gIFtcbiAgICAgIHtfaWQ6IDEsIHg6MX1cbiAgICAgIHtfaWQ6IDIsIHg6Mn1cbiAgICBdXG4gICAgW2FkZHMsIHJlbW92ZXNdID0gQHRyYWNrZXIudXBkYXRlKGl0ZW1zKVxuICAgIFthZGRzLCByZW1vdmVzXSA9IEB0cmFja2VyLnVwZGF0ZShpdGVtcylcbiAgICBhc3NlcnQuZGVlcEVxdWFsIGFkZHMsIFtdXG4gICAgYXNzZXJ0LmRlZXBFcXVhbCByZW1vdmVzLCBbXVxuXG4gIGl0IFwic2VlcyByZW1vdmVkIGl0ZW1zXCIsIC0+XG4gICAgaXRlbXMxID0gIFtcbiAgICAgIHtfaWQ6IDEsIHg6MX1cbiAgICAgIHtfaWQ6IDIsIHg6Mn1cbiAgICBdXG4gICAgaXRlbXMyID0gIFtcbiAgICAgIHtfaWQ6IDEsIHg6MX1cbiAgICBdXG4gICAgQHRyYWNrZXIudXBkYXRlKGl0ZW1zMSlcbiAgICBbYWRkcywgcmVtb3Zlc10gPSBAdHJhY2tlci51cGRhdGUoaXRlbXMyKVxuICAgIGFzc2VydC5kZWVwRXF1YWwgYWRkcywgW11cbiAgICBhc3NlcnQuZGVlcEVxdWFsIHJlbW92ZXMsIFt7X2lkOiAyLCB4OjJ9XVxuXG4gIGl0IFwic2VlcyByZW1vdmVkIGNoYW5nZXNcIiwgLT5cbiAgICBpdGVtczEgPSAgW1xuICAgICAge19pZDogMSwgeDoxfVxuICAgICAge19pZDogMiwgeDoyfVxuICAgIF1cbiAgICBpdGVtczIgPSAgW1xuICAgICAge19pZDogMSwgeDoxfVxuICAgICAge19pZDogMiwgeDo0fVxuICAgIF1cbiAgICBAdHJhY2tlci51cGRhdGUoaXRlbXMxKVxuICAgIFthZGRzLCByZW1vdmVzXSA9IEB0cmFja2VyLnVwZGF0ZShpdGVtczIpXG4gICAgYXNzZXJ0LmRlZXBFcXVhbCBhZGRzLCBbe19pZDogMiwgeDo0fV1cbiAgICBhc3NlcnQuZGVlcEVxdWFsIHJlbW92ZXMsIFt7X2lkOiAyLCB4OjJ9XVxuIiwiYXNzZXJ0ID0gY2hhaS5hc3NlcnRcbkdlb0pTT04gPSByZXF1aXJlIFwiLi4vYXBwL2pzL0dlb0pTT05cIlxuXG5kZXNjcmliZSAnR2VvSlNPTicsIC0+XG4gIGl0ICdyZXR1cm5zIGEgcHJvcGVyIHBvbHlnb24nLCAtPlxuICAgIHNvdXRoV2VzdCA9IG5ldyBMLkxhdExuZygxMCwgMjApXG4gICAgbm9ydGhFYXN0ID0gbmV3IEwuTGF0TG5nKDEzLCAyMylcbiAgICBib3VuZHMgPSBuZXcgTC5MYXRMbmdCb3VuZHMoc291dGhXZXN0LCBub3J0aEVhc3QpXG5cbiAgICBqc29uID0gR2VvSlNPTi5sYXRMbmdCb3VuZHNUb0dlb0pTT04oYm91bmRzKVxuICAgIGFzc2VydCBfLmlzRXF1YWwganNvbiwge1xuICAgICAgdHlwZTogXCJQb2x5Z29uXCIsXG4gICAgICBjb29yZGluYXRlczogW1xuICAgICAgICBbWzIwLDEwXSxbMjAsMTNdLFsyMywxM10sWzIzLDEwXV1cbiAgICAgIF1cbiAgICB9XG5cbiAgaXQgJ2dldHMgcmVsYXRpdmUgbG9jYXRpb24gTicsIC0+XG4gICAgZnJvbSA9IHsgdHlwZTogXCJQb2ludFwiLCBjb29yZGluYXRlczogWzEwLCAyMF19XG4gICAgdG8gPSB7IHR5cGU6IFwiUG9pbnRcIiwgY29vcmRpbmF0ZXM6IFsxMCwgMjFdfVxuICAgIHN0ciA9IEdlb0pTT04uZ2V0UmVsYXRpdmVMb2NhdGlvbihmcm9tLCB0bylcbiAgICBhc3NlcnQuZXF1YWwgc3RyLCAnMTExLjJrbSBOJ1xuXG4gIGl0ICdnZXRzIHJlbGF0aXZlIGxvY2F0aW9uIFMnLCAtPlxuICAgIGZyb20gPSB7IHR5cGU6IFwiUG9pbnRcIiwgY29vcmRpbmF0ZXM6IFsxMCwgMjBdfVxuICAgIHRvID0geyB0eXBlOiBcIlBvaW50XCIsIGNvb3JkaW5hdGVzOiBbMTAsIDE5XX1cbiAgICBzdHIgPSBHZW9KU09OLmdldFJlbGF0aXZlTG9jYXRpb24oZnJvbSwgdG8pXG4gICAgYXNzZXJ0LmVxdWFsIHN0ciwgJzExMS4ya20gUydcbiIsImFzc2VydCA9IGNoYWkuYXNzZXJ0XG5cbkdlb0pTT04gPSByZXF1aXJlICcuLi9hcHAvanMvR2VvSlNPTidcblxubW9kdWxlLmV4cG9ydHMgPSAtPlxuICBjb250ZXh0ICdXaXRoIHNhbXBsZSByb3dzJywgLT5cbiAgICBiZWZvcmVFYWNoIChkb25lKSAtPlxuICAgICAgQGRiLnRlc3QudXBzZXJ0IHsgX2lkOjEsIGE6XCJBbGljZVwiIH0sID0+XG4gICAgICAgIEBkYi50ZXN0LnVwc2VydCB7IF9pZDoyLCBhOlwiQ2hhcmxpZVwiIH0sID0+XG4gICAgICAgICAgQGRiLnRlc3QudXBzZXJ0IHsgX2lkOjMsIGE6XCJCb2JcIiB9LCA9PlxuICAgICAgICAgICAgZG9uZSgpXG5cbiAgICBpdCAnZmluZHMgYWxsIHJvd3MnLCAoZG9uZSkgLT5cbiAgICAgIEBkYi50ZXN0LmZpbmQoe30pLmZldGNoIChyZXN1bHRzKSA9PlxuICAgICAgICBhc3NlcnQuZXF1YWwgMywgcmVzdWx0cy5sZW5ndGhcbiAgICAgICAgZG9uZSgpXG5cbiAgICBpdCAnZmluZHMgYWxsIHJvd3Mgd2l0aCBvcHRpb25zJywgKGRvbmUpIC0+XG4gICAgICBAZGIudGVzdC5maW5kKHt9LCB7fSkuZmV0Y2ggKHJlc3VsdHMpID0+XG4gICAgICAgIGFzc2VydC5lcXVhbCAzLCByZXN1bHRzLmxlbmd0aFxuICAgICAgICBkb25lKClcblxuICAgIGl0ICdmaWx0ZXJzIHJvd3MgYnkgaWQnLCAoZG9uZSkgLT5cbiAgICAgIEBkYi50ZXN0LmZpbmQoeyBfaWQ6IDEgfSkuZmV0Y2ggKHJlc3VsdHMpID0+XG4gICAgICAgIGFzc2VydC5lcXVhbCAxLCByZXN1bHRzLmxlbmd0aFxuICAgICAgICBhc3NlcnQuZXF1YWwgJ0FsaWNlJywgcmVzdWx0c1swXS5hXG4gICAgICAgIGRvbmUoKVxuXG4gICAgaXQgJ2ZpbmRzIG9uZSByb3cnLCAoZG9uZSkgLT5cbiAgICAgIEBkYi50ZXN0LmZpbmRPbmUgeyBfaWQ6IDIgfSwgKHJlc3VsdCkgPT5cbiAgICAgICAgYXNzZXJ0LmVxdWFsICdDaGFybGllJywgcmVzdWx0LmFcbiAgICAgICAgZG9uZSgpXG5cbiAgICBpdCAncmVtb3ZlcyBpdGVtJywgKGRvbmUpIC0+XG4gICAgICBAZGIudGVzdC5yZW1vdmUgMiwgPT5cbiAgICAgICAgQGRiLnRlc3QuZmluZCh7fSkuZmV0Y2ggKHJlc3VsdHMpID0+XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsIDIsIHJlc3VsdHMubGVuZ3RoXG4gICAgICAgICAgYXNzZXJ0IDEgaW4gKHJlc3VsdC5faWQgZm9yIHJlc3VsdCBpbiByZXN1bHRzKVxuICAgICAgICAgIGFzc2VydCAyIG5vdCBpbiAocmVzdWx0Ll9pZCBmb3IgcmVzdWx0IGluIHJlc3VsdHMpXG4gICAgICAgICAgZG9uZSgpXG5cbiAgICBpdCAncmVtb3ZlcyBub24tZXhpc3RlbnQgaXRlbScsIChkb25lKSAtPlxuICAgICAgQGRiLnRlc3QucmVtb3ZlIDk5OSwgPT5cbiAgICAgICAgQGRiLnRlc3QuZmluZCh7fSkuZmV0Y2ggKHJlc3VsdHMpID0+XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsIDMsIHJlc3VsdHMubGVuZ3RoXG4gICAgICAgICAgZG9uZSgpXG5cbiAgICBpdCAnc29ydHMgYXNjZW5kaW5nJywgKGRvbmUpIC0+XG4gICAgICBAZGIudGVzdC5maW5kKHt9LCB7c29ydDogWydhJ119KS5mZXRjaCAocmVzdWx0cykgPT5cbiAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCBfLnBsdWNrKHJlc3VsdHMsICdfaWQnKSwgWzEsMywyXVxuICAgICAgICBkb25lKClcblxuICAgIGl0ICdzb3J0cyBkZXNjZW5kaW5nJywgKGRvbmUpIC0+XG4gICAgICBAZGIudGVzdC5maW5kKHt9LCB7c29ydDogW1snYScsJ2Rlc2MnXV19KS5mZXRjaCAocmVzdWx0cykgPT5cbiAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCBfLnBsdWNrKHJlc3VsdHMsICdfaWQnKSwgWzIsMywxXVxuICAgICAgICBkb25lKClcblxuICAgIGl0ICdsaW1pdHMnLCAoZG9uZSkgLT5cbiAgICAgIEBkYi50ZXN0LmZpbmQoe30sIHtzb3J0OiBbJ2EnXSwgbGltaXQ6Mn0pLmZldGNoIChyZXN1bHRzKSA9PlxuICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIF8ucGx1Y2socmVzdWx0cywgJ19pZCcpLCBbMSwzXVxuICAgICAgICBkb25lKClcblxuICAgIGl0ICdmZXRjaGVzIGluZGVwZW5kZW50IGNvcGllcycsIChkb25lKSAtPlxuICAgICAgQGRiLnRlc3QuZmluZE9uZSB7IF9pZDogMiB9LCAocmVzdWx0KSA9PlxuICAgICAgICByZXN1bHQuYSA9ICdEYXZpZCdcbiAgICAgICAgQGRiLnRlc3QuZmluZE9uZSB7IF9pZDogMiB9LCAocmVzdWx0KSA9PlxuICAgICAgICAgIGFzc2VydC5lcXVhbCAnQ2hhcmxpZScsIHJlc3VsdC5hXG4gICAgICAgICAgZG9uZSgpXG5cbiAgaXQgJ2FkZHMgX2lkIHRvIHJvd3MnLCAoZG9uZSkgLT5cbiAgICBAZGIudGVzdC51cHNlcnQgeyBhOiAxIH0sIChpdGVtKSA9PlxuICAgICAgYXNzZXJ0LnByb3BlcnR5IGl0ZW0sICdfaWQnXG4gICAgICBhc3NlcnQubGVuZ3RoT2YgaXRlbS5faWQsIDMyXG4gICAgICBkb25lKClcblxuICBpdCAndXBkYXRlcyBieSBpZCcsIChkb25lKSAtPlxuICAgIEBkYi50ZXN0LnVwc2VydCB7IF9pZDoxLCBhOjEgfSwgKGl0ZW0pID0+XG4gICAgICBAZGIudGVzdC51cHNlcnQgeyBfaWQ6MSwgYToyIH0sIChpdGVtKSA9PlxuICAgICAgICBhc3NlcnQuZXF1YWwgaXRlbS5hLCAyXG4gIFxuICAgICAgICBAZGIudGVzdC5maW5kKHt9KS5mZXRjaCAocmVzdWx0cykgPT5cbiAgICAgICAgICBhc3NlcnQuZXF1YWwgMSwgcmVzdWx0cy5sZW5ndGhcbiAgICAgICAgICBkb25lKClcblxuXG4gIGdlb3BvaW50ID0gKGxuZywgbGF0KSAtPlxuICAgIHJldHVybiB7XG4gICAgICAgIHR5cGU6ICdQb2ludCdcbiAgICAgICAgY29vcmRpbmF0ZXM6IFtsbmcsIGxhdF1cbiAgICB9XG5cbiAgY29udGV4dCAnV2l0aCBnZW9sb2NhdGVkIHJvd3MnLCAtPlxuICAgIGJlZm9yZUVhY2ggKGRvbmUpIC0+XG4gICAgICBAZGIudGVzdC51cHNlcnQgeyBfaWQ6MSwgbG9jOmdlb3BvaW50KDkwLCA0NSkgfSwgPT5cbiAgICAgICAgQGRiLnRlc3QudXBzZXJ0IHsgX2lkOjIsIGxvYzpnZW9wb2ludCg5MCwgNDYpIH0sID0+XG4gICAgICAgICAgQGRiLnRlc3QudXBzZXJ0IHsgX2lkOjMsIGxvYzpnZW9wb2ludCg5MSwgNDUpIH0sID0+XG4gICAgICAgICAgICBAZGIudGVzdC51cHNlcnQgeyBfaWQ6NCwgbG9jOmdlb3BvaW50KDkxLCA0NikgfSwgPT5cbiAgICAgICAgICAgICAgZG9uZSgpXG5cbiAgICBpdCAnZmluZHMgcG9pbnRzIG5lYXInLCAoZG9uZSkgLT5cbiAgICAgIHNlbGVjdG9yID0gbG9jOiBcbiAgICAgICAgJG5lYXI6IFxuICAgICAgICAgICRnZW9tZXRyeTogZ2VvcG9pbnQoOTAsIDQ1KVxuXG4gICAgICBAZGIudGVzdC5maW5kKHNlbGVjdG9yKS5mZXRjaCAocmVzdWx0cykgPT5cbiAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCBfLnBsdWNrKHJlc3VsdHMsICdfaWQnKSwgWzEsMywyLDRdXG4gICAgICAgIGRvbmUoKVxuXG4gICAgaXQgJ2ZpbmRzIHBvaW50cyBuZWFyIG1heERpc3RhbmNlJywgKGRvbmUpIC0+XG4gICAgICBzZWxlY3RvciA9IGxvYzogXG4gICAgICAgICRuZWFyOiBcbiAgICAgICAgICAkZ2VvbWV0cnk6IGdlb3BvaW50KDkwLCA0NSlcbiAgICAgICAgICAkbWF4RGlzdGFuY2U6IDExMTAwMFxuXG4gICAgICBAZGIudGVzdC5maW5kKHNlbGVjdG9yKS5mZXRjaCAocmVzdWx0cykgPT5cbiAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCBfLnBsdWNrKHJlc3VsdHMsICdfaWQnKSwgWzEsM11cbiAgICAgICAgZG9uZSgpICAgICAgXG5cbiAgICBpdCAnZmluZHMgcG9pbnRzIG5lYXIgbWF4RGlzdGFuY2UganVzdCBhYm92ZScsIChkb25lKSAtPlxuICAgICAgc2VsZWN0b3IgPSBsb2M6IFxuICAgICAgICAkbmVhcjogXG4gICAgICAgICAgJGdlb21ldHJ5OiBnZW9wb2ludCg5MCwgNDUpXG4gICAgICAgICAgJG1heERpc3RhbmNlOiAxMTIwMDBcblxuICAgICAgQGRiLnRlc3QuZmluZChzZWxlY3RvcikuZmV0Y2ggKHJlc3VsdHMpID0+XG4gICAgICAgIGFzc2VydC5kZWVwRXF1YWwgXy5wbHVjayhyZXN1bHRzLCAnX2lkJyksIFsxLDMsMl1cbiAgICAgICAgZG9uZSgpXG5cbiAgICBpdCAnZmluZHMgcG9pbnRzIHdpdGhpbiBzaW1wbGUgYm94JywgKGRvbmUpIC0+XG4gICAgICBzZWxlY3RvciA9IGxvYzogXG4gICAgICAgICRnZW9JbnRlcnNlY3RzOiBcbiAgICAgICAgICAkZ2VvbWV0cnk6IFxuICAgICAgICAgICAgdHlwZTogJ1BvbHlnb24nXG4gICAgICAgICAgICBjb29yZGluYXRlczogW1tcbiAgICAgICAgICAgICAgWzg5LjUsIDQ1LjVdLCBbODkuNSwgNDYuNV0sIFs5MC41LCA0Ni41XSwgWzkwLjUsIDQ1LjVdXG4gICAgICAgICAgICBdXVxuICAgICAgQGRiLnRlc3QuZmluZChzZWxlY3RvcikuZmV0Y2ggKHJlc3VsdHMpID0+XG4gICAgICAgIGFzc2VydC5kZWVwRXF1YWwgXy5wbHVjayhyZXN1bHRzLCAnX2lkJyksIFsyXVxuICAgICAgICBkb25lKClcblxuICAgIGl0ICdoYW5kbGVzIHVuZGVmaW5lZCcsIChkb25lKSAtPlxuICAgICAgc2VsZWN0b3IgPSBsb2M6IFxuICAgICAgICAkZ2VvSW50ZXJzZWN0czogXG4gICAgICAgICAgJGdlb21ldHJ5OiBcbiAgICAgICAgICAgIHR5cGU6ICdQb2x5Z29uJ1xuICAgICAgICAgICAgY29vcmRpbmF0ZXM6IFtbXG4gICAgICAgICAgICAgIFs4OS41LCA0NS41XSwgWzg5LjUsIDQ2LjVdLCBbOTAuNSwgNDYuNV0sIFs5MC41LCA0NS41XVxuICAgICAgICAgICAgXV1cbiAgICAgIEBkYi50ZXN0LnVwc2VydCB7IF9pZDo1IH0sID0+XG4gICAgICAgIEBkYi50ZXN0LmZpbmQoc2VsZWN0b3IpLmZldGNoIChyZXN1bHRzKSA9PlxuICAgICAgICAgIGFzc2VydC5kZWVwRXF1YWwgXy5wbHVjayhyZXN1bHRzLCAnX2lkJyksIFsyXVxuICAgICAgICAgIGRvbmUoKVxuXG5cbiIsImFzc2VydCA9IGNoYWkuYXNzZXJ0XG5Ecm9wZG93blF1ZXN0aW9uID0gcmVxdWlyZSgnZm9ybXMnKS5Ecm9wZG93blF1ZXN0aW9uXG5VSURyaXZlciA9IHJlcXVpcmUgJy4vaGVscGVycy9VSURyaXZlcidcblxuIyBjbGFzcyBNb2NrTG9jYXRpb25GaW5kZXJcbiMgICBjb25zdHJ1Y3RvcjogIC0+XG4jICAgICBfLmV4dGVuZCBALCBCYWNrYm9uZS5FdmVudHNcblxuIyAgIGdldExvY2F0aW9uOiAtPlxuIyAgIHN0YXJ0V2F0Y2g6IC0+XG4jICAgc3RvcFdhdGNoOiAtPlxuXG5kZXNjcmliZSAnRHJvcGRvd25RdWVzdGlvbicsIC0+XG4gIGNvbnRleHQgJ1dpdGggYSBmZXcgb3B0aW9ucycsIC0+XG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgQG1vZGVsID0gbmV3IEJhY2tib25lLk1vZGVsKClcbiAgICAgIEBxdWVzdGlvbiA9IG5ldyBEcm9wZG93blF1ZXN0aW9uXG4gICAgICAgIG9wdGlvbnM6IFtbJ2EnLCAnQXBwbGUnXSwgWydiJywgJ0JhbmFuYSddXVxuICAgICAgICBtb2RlbDogQG1vZGVsXG4gICAgICAgIGlkOiBcInExXCJcblxuICAgIGl0ICdhY2NlcHRzIGtub3duIHZhbHVlJywgLT5cbiAgICAgIEBtb2RlbC5zZXQocTE6ICdhJylcbiAgICAgIGFzc2VydC5lcXVhbCBAbW9kZWwuZ2V0KCdxMScpLCAnYSdcbiAgICAgIGFzc2VydC5pc0ZhbHNlIEBxdWVzdGlvbi4kKFwic2VsZWN0XCIpLmlzKFwiOmRpc2FibGVkXCIpXG5cbiAgICBpdCAnaXMgZGlzYWJsZWQgd2l0aCB1bmtub3duIHZhbHVlJywgLT5cbiAgICAgIEBtb2RlbC5zZXQocTE6ICd4JylcbiAgICAgIGFzc2VydC5lcXVhbCBAbW9kZWwuZ2V0KCdxMScpLCAneCdcbiAgICAgIGFzc2VydC5pc1RydWUgQHF1ZXN0aW9uLiQoXCJzZWxlY3RcIikuaXMoXCI6ZGlzYWJsZWRcIilcblxuICAgIGl0ICdpcyBub3QgZGlzYWJsZWQgd2l0aCBlbXB0eSB2YWx1ZScsIC0+XG4gICAgICBAbW9kZWwuc2V0KHExOiBudWxsKVxuICAgICAgYXNzZXJ0LmVxdWFsIEBtb2RlbC5nZXQoJ3ExJyksIG51bGxcbiAgICAgIGFzc2VydC5pc0ZhbHNlIEBxdWVzdGlvbi4kKFwic2VsZWN0XCIpLmlzKFwiOmRpc2FibGVkXCIpXG5cbiAgICBpdCAnaXMgcmVlbmFibGVkIHdpdGggc2V0dGluZyB2YWx1ZScsIC0+XG4gICAgICBAbW9kZWwuc2V0KHExOiAneCcpXG4gICAgICBhc3NlcnQuZXF1YWwgQG1vZGVsLmdldCgncTEnKSwgJ3gnXG4gICAgICBAcXVlc3Rpb24uc2V0T3B0aW9ucyhbWydhJywgJ0FwcGxlJ10sIFsnYicsICdCYW5hbmEnXSwgWyd4JywgJ0tpd2knXV0pXG4gICAgICBhc3NlcnQuaXNGYWxzZSBAcXVlc3Rpb24uJChcInNlbGVjdFwiKS5pcyhcIjpkaXNhYmxlZFwiKVxuXG4iLCJcbmV4cG9ydHMuRGF0ZVF1ZXN0aW9uID0gcmVxdWlyZSAnLi9EYXRlUXVlc3Rpb24nXG5leHBvcnRzLkRyb3Bkb3duUXVlc3Rpb24gPSByZXF1aXJlICcuL0Ryb3Bkb3duUXVlc3Rpb24nXG5leHBvcnRzLk51bWJlclF1ZXN0aW9uID0gcmVxdWlyZSAnLi9OdW1iZXJRdWVzdGlvbidcbmV4cG9ydHMuUXVlc3Rpb25Hcm91cCA9IHJlcXVpcmUgJy4vUXVlc3Rpb25Hcm91cCdcbmV4cG9ydHMuU2F2ZUNhbmNlbEZvcm0gPSByZXF1aXJlICcuL1NhdmVDYW5jZWxGb3JtJ1xuZXhwb3J0cy5Tb3VyY2VRdWVzdGlvbiA9IHJlcXVpcmUgJy4vU291cmNlUXVlc3Rpb24nXG5leHBvcnRzLlBob3RvUXVlc3Rpb24gPSByZXF1aXJlICcuL1Bob3RvUXVlc3Rpb24nXG5leHBvcnRzLlBob3Rvc1F1ZXN0aW9uID0gcmVxdWlyZSAnLi9QaG90b3NRdWVzdGlvbidcbmV4cG9ydHMuSW5zdHJ1Y3Rpb25zID0gcmVxdWlyZSAnLi9JbnN0cnVjdGlvbnMnXG5cbiMgTXVzdCBiZSBjcmVhdGVkIHdpdGggbW9kZWwgKGJhY2tib25lIG1vZGVsKSBhbmQgY29udGVudHMgKGFycmF5IG9mIHZpZXdzKVxuZXhwb3J0cy5Gb3JtVmlldyA9IGNsYXNzIEZvcm1WaWV3IGV4dGVuZHMgQmFja2JvbmUuVmlld1xuICBpbml0aWFsaXplOiAob3B0aW9ucykgLT5cbiAgICBAY29udGVudHMgPSBvcHRpb25zLmNvbnRlbnRzXG4gICAgXG4gICAgIyBBZGQgY29udGVudHMgYW5kIGxpc3RlbiB0byBldmVudHNcbiAgICBmb3IgY29udGVudCBpbiBvcHRpb25zLmNvbnRlbnRzXG4gICAgICBAJGVsLmFwcGVuZChjb250ZW50LmVsKTtcbiAgICAgIEBsaXN0ZW5UbyBjb250ZW50LCAnY2xvc2UnLCA9PiBAdHJpZ2dlcignY2xvc2UnKVxuICAgICAgQGxpc3RlblRvIGNvbnRlbnQsICdjb21wbGV0ZScsID0+IEB0cmlnZ2VyKCdjb21wbGV0ZScpXG5cbiAgICAjIEFkZCBsaXN0ZW5lciB0byBtb2RlbFxuICAgIEBsaXN0ZW5UbyBAbW9kZWwsICdjaGFuZ2UnLCA9PiBAdHJpZ2dlcignY2hhbmdlJylcblxuICBsb2FkOiAoZGF0YSkgLT5cbiAgICBAbW9kZWwuY2xlYXIoKSAgI1RPRE8gY2xlYXIgb3Igbm90IGNsZWFyPyBjbGVhcmluZyByZW1vdmVzIGRlZmF1bHRzLCBidXQgYWxsb3dzIHRydWUgcmV1c2UuXG5cbiAgICAjIEFwcGx5IGRlZmF1bHRzIFxuICAgIEBtb2RlbC5zZXQoXy5kZWZhdWx0cyhfLmNsb25lRGVlcChkYXRhKSwgQG9wdGlvbnMuZGVmYXVsdHMgfHwge30pKVxuXG4gIHNhdmU6IC0+XG4gICAgcmV0dXJuIEBtb2RlbC50b0pTT04oKVxuXG5cbiMgU2ltcGxlIGZvcm0gdGhhdCBkaXNwbGF5cyBhIHRlbXBsYXRlIGJhc2VkIG9uIGxvYWRlZCBkYXRhXG5leHBvcnRzLnRlbXBsYXRlVmlldyA9ICh0ZW1wbGF0ZSkgLT4gXG4gIHJldHVybiB7XG4gICAgZWw6ICQoJzxkaXY+PC9kaXY+JylcbiAgICBsb2FkOiAoZGF0YSkgLT5cbiAgICAgICQoQGVsKS5odG1sIHRlbXBsYXRlKGRhdGEpXG4gIH1cblxuICAjIGNsYXNzIFRlbXBsYXRlVmlldyBleHRlbmRzIEJhY2tib25lLlZpZXdcbiAgIyBjb25zdHJ1Y3RvcjogKHRlbXBsYXRlKSAtPlxuICAjICAgQHRlbXBsYXRlID0gdGVtcGxhdGVcblxuICAjIGxvYWQ6IChkYXRhKSAtPlxuICAjICAgQCRlbC5odG1sIEB0ZW1wbGF0ZShkYXRhKVxuXG5cbmV4cG9ydHMuU3VydmV5VmlldyA9IGNsYXNzIFN1cnZleVZpZXcgZXh0ZW5kcyBGb3JtVmlld1xuXG5leHBvcnRzLldhdGVyVGVzdEVkaXRWaWV3ID0gY2xhc3MgV2F0ZXJUZXN0RWRpdFZpZXcgZXh0ZW5kcyBGb3JtVmlld1xuICBpbml0aWFsaXplOiAob3B0aW9ucykgLT5cbiAgICBzdXBlcihvcHRpb25zKVxuXG4gICAgIyBBZGQgYnV0dG9ucyBhdCBib3R0b21cbiAgICAjIFRPRE8gbW92ZSB0byB0ZW1wbGF0ZSBhbmQgc2VwIGZpbGVcbiAgICBAJGVsLmFwcGVuZCAkKCcnJ1xuICAgICAgPGRpdj5cbiAgICAgICAgICA8YnV0dG9uIGlkPVwiY2xvc2VfYnV0dG9uXCIgdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwiYnRuIG1hcmdpbmVkXCI+U2F2ZSBmb3IgTGF0ZXI8L2J1dHRvbj5cbiAgICAgICAgICAmbmJzcDtcbiAgICAgICAgICA8YnV0dG9uIGlkPVwiY29tcGxldGVfYnV0dG9uXCIgdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwiYnRuIGJ0bi1wcmltYXJ5IG1hcmdpbmVkXCI+PGkgY2xhc3M9XCJpY29uLW9rIGljb24td2hpdGVcIj48L2k+IENvbXBsZXRlPC9idXR0b24+XG4gICAgICA8L2Rpdj5cbiAgICAnJycpXG5cbiAgZXZlbnRzOiBcbiAgICBcImNsaWNrICNjbG9zZV9idXR0b25cIiA6IFwiY2xvc2VcIlxuICAgIFwiY2xpY2sgI2NvbXBsZXRlX2J1dHRvblwiIDogXCJjb21wbGV0ZVwiXG5cbiAgIyBUT0RPIHJlZmFjdG9yIHdpdGggU2F2ZUNhbmNlbEZvcm1cbiAgdmFsaWRhdGU6IC0+XG4gICAgIyBHZXQgYWxsIHZpc2libGUgaXRlbXNcbiAgICBpdGVtcyA9IF8uZmlsdGVyKEBjb250ZW50cywgKGMpIC0+XG4gICAgICBjLnZpc2libGUgYW5kIGMudmFsaWRhdGVcbiAgICApXG4gICAgcmV0dXJuIG5vdCBfLmFueShfLm1hcChpdGVtcywgKGl0ZW0pIC0+XG4gICAgICBpdGVtLnZhbGlkYXRlKClcbiAgICApKVxuXG4gIGNsb3NlOiAtPlxuICAgIEB0cmlnZ2VyICdjbG9zZSdcblxuICBjb21wbGV0ZTogLT5cbiAgICBpZiBAdmFsaWRhdGUoKVxuICAgICAgQHRyaWdnZXIgJ2NvbXBsZXRlJ1xuICAgICAgXG4jIENyZWF0ZXMgYSBmb3JtIHZpZXcgZnJvbSBhIHN0cmluZ1xuZXhwb3J0cy5pbnN0YW50aWF0ZVZpZXcgPSAodmlld1N0ciwgb3B0aW9ucykgPT5cbiAgdmlld0Z1bmMgPSBuZXcgRnVuY3Rpb24oXCJvcHRpb25zXCIsIHZpZXdTdHIpXG4gIHZpZXdGdW5jKG9wdGlvbnMpXG5cbl8uZXh0ZW5kKGV4cG9ydHMsIHJlcXVpcmUoJy4vZm9ybS1jb250cm9scycpKVxuXG5cbiMgVE9ETyBmaWd1cmUgb3V0IGhvdyB0byBhbGxvdyB0d28gc3VydmV5cyBmb3IgZGlmZmVyaW5nIGNsaWVudCB2ZXJzaW9ucz8gT3IganVzdCB1c2UgbWluVmVyc2lvbj8iLCJcbiMgVHJhY2tzIGEgc2V0IG9mIGl0ZW1zIGJ5IGlkLCBpbmRpY2F0aW5nIHdoaWNoIGhhdmUgYmVlbiBhZGRlZCBvciByZW1vdmVkLlxuIyBDaGFuZ2VzIGFyZSBib3RoIGFkZCBhbmQgcmVtb3ZlXG5jbGFzcyBJdGVtVHJhY2tlclxuICBjb25zdHJ1Y3RvcjogLT5cbiAgICBAa2V5ID0gJ19pZCdcbiAgICBAaXRlbXMgPSB7fVxuXG4gIHVwZGF0ZTogKGl0ZW1zKSAtPiAgICAjIFJldHVybiBbW2FkZGVkXSxbcmVtb3ZlZF1dIGl0ZW1zXG4gICAgYWRkcyA9IFtdXG4gICAgcmVtb3ZlcyA9IFtdXG5cbiAgICAjIEFkZCBhbnkgbmV3IG9uZXNcbiAgICBmb3IgaXRlbSBpbiBpdGVtc1xuICAgICAgaWYgbm90IF8uaGFzKEBpdGVtcywgaXRlbVtAa2V5XSlcbiAgICAgICAgYWRkcy5wdXNoKGl0ZW0pXG5cbiAgICAjIENyZWF0ZSBtYXAgb2YgaXRlbXMgcGFyYW1ldGVyXG4gICAgbWFwID0gXy5vYmplY3QoXy5wbHVjayhpdGVtcywgQGtleSksIGl0ZW1zKVxuXG4gICAgIyBGaW5kIHJlbW92ZXNcbiAgICBmb3Iga2V5LCB2YWx1ZSBvZiBAaXRlbXNcbiAgICAgIGlmIG5vdCBfLmhhcyhtYXAsIGtleSlcbiAgICAgICAgcmVtb3Zlcy5wdXNoKHZhbHVlKVxuICAgICAgZWxzZSBpZiBub3QgXy5pc0VxdWFsKHZhbHVlLCBtYXBba2V5XSlcbiAgICAgICAgYWRkcy5wdXNoKG1hcFtrZXldKVxuICAgICAgICByZW1vdmVzLnB1c2godmFsdWUpXG5cbiAgICBmb3IgaXRlbSBpbiByZW1vdmVzXG4gICAgICBkZWxldGUgQGl0ZW1zW2l0ZW1bQGtleV1dXG5cbiAgICBmb3IgaXRlbSBpbiBhZGRzXG4gICAgICBAaXRlbXNbaXRlbVtAa2V5XV0gPSBpdGVtXG5cbiAgICByZXR1cm4gW2FkZHMsIHJlbW92ZXNdXG5cbm1vZHVsZS5leHBvcnRzID0gSXRlbVRyYWNrZXIiLCIjIEdlb0pTT04gaGVscGVyIHJvdXRpbmVzXG5cbiMgQ29udmVydHMgbmF2aWdhdG9yIHBvc2l0aW9uIHRvIHBvaW50XG5leHBvcnRzLnBvc1RvUG9pbnQgPSAocG9zKSAtPlxuICByZXR1cm4ge1xuICAgIHR5cGU6ICdQb2ludCdcbiAgICBjb29yZGluYXRlczogW3Bvcy5jb29yZHMubG9uZ2l0dWRlLCBwb3MuY29vcmRzLmxhdGl0dWRlXVxuICB9XG5cblxuZXhwb3J0cy5sYXRMbmdCb3VuZHNUb0dlb0pTT04gPSAoYm91bmRzKSAtPlxuICBzdyA9IGJvdW5kcy5nZXRTb3V0aFdlc3QoKVxuICBuZSA9IGJvdW5kcy5nZXROb3J0aEVhc3QoKVxuICByZXR1cm4ge1xuICAgIHR5cGU6ICdQb2x5Z29uJyxcbiAgICBjb29yZGluYXRlczogW1xuICAgICAgW1tzdy5sbmcsIHN3LmxhdF0sIFxuICAgICAgW3N3LmxuZywgbmUubGF0XSwgXG4gICAgICBbbmUubG5nLCBuZS5sYXRdLCBcbiAgICAgIFtuZS5sbmcsIHN3LmxhdF1dXG4gICAgXVxuICB9XG5cbiMgVE9ETzogb25seSB3b3JrcyB3aXRoIGJvdW5kc1xuZXhwb3J0cy5wb2ludEluUG9seWdvbiA9IChwb2ludCwgcG9seWdvbikgLT5cbiAgIyBHZXQgYm91bmRzXG4gIGJvdW5kcyA9IG5ldyBMLkxhdExuZ0JvdW5kcyhfLm1hcChwb2x5Z29uLmNvb3JkaW5hdGVzWzBdLCAoY29vcmQpIC0+IG5ldyBMLkxhdExuZyhjb29yZFsxXSwgY29vcmRbMF0pKSlcbiAgcmV0dXJuIGJvdW5kcy5jb250YWlucyhuZXcgTC5MYXRMbmcocG9pbnQuY29vcmRpbmF0ZXNbMV0sIHBvaW50LmNvb3JkaW5hdGVzWzBdKSlcblxuZXhwb3J0cy5nZXRSZWxhdGl2ZUxvY2F0aW9uID0gKGZyb20sIHRvKSAtPlxuICB4MSA9IGZyb20uY29vcmRpbmF0ZXNbMF1cbiAgeTEgPSBmcm9tLmNvb3JkaW5hdGVzWzFdXG4gIHgyID0gdG8uY29vcmRpbmF0ZXNbMF1cbiAgeTIgPSB0by5jb29yZGluYXRlc1sxXVxuICBcbiAgIyBDb252ZXJ0IHRvIHJlbGF0aXZlIHBvc2l0aW9uIChhcHByb3hpbWF0ZSlcbiAgZHkgPSAoeTIgLSB5MSkgLyA1Ny4zICogNjM3MTAwMFxuICBkeCA9IE1hdGguY29zKHkxIC8gNTcuMykgKiAoeDIgLSB4MSkgLyA1Ny4zICogNjM3MTAwMFxuICBcbiAgIyBEZXRlcm1pbmUgZGlyZWN0aW9uIGFuZCBhbmdsZVxuICBkaXN0ID0gTWF0aC5zcXJ0KGR4ICogZHggKyBkeSAqIGR5KVxuICBhbmdsZSA9IDkwIC0gKE1hdGguYXRhbjIoZHksIGR4KSAqIDU3LjMpXG4gIGFuZ2xlICs9IDM2MCBpZiBhbmdsZSA8IDBcbiAgYW5nbGUgLT0gMzYwIGlmIGFuZ2xlID4gMzYwXG4gIFxuICAjIEdldCBhcHByb3hpbWF0ZSBkaXJlY3Rpb25cbiAgY29tcGFzc0RpciA9IChNYXRoLmZsb29yKChhbmdsZSArIDIyLjUpIC8gNDUpKSAlIDhcbiAgY29tcGFzc1N0cnMgPSBbXCJOXCIsIFwiTkVcIiwgXCJFXCIsIFwiU0VcIiwgXCJTXCIsIFwiU1dcIiwgXCJXXCIsIFwiTldcIl1cbiAgaWYgZGlzdCA+IDEwMDBcbiAgICAoZGlzdCAvIDEwMDApLnRvRml4ZWQoMSkgKyBcImttIFwiICsgY29tcGFzc1N0cnNbY29tcGFzc0Rpcl1cbiAgZWxzZVxuICAgIChkaXN0KS50b0ZpeGVkKDApICsgXCJtIFwiICsgY29tcGFzc1N0cnNbY29tcGFzc0Rpcl0iLCJhc3NlcnQgPSBjaGFpLmFzc2VydFxuXG5jbGFzcyBVSURyaXZlclxuICBjb25zdHJ1Y3RvcjogKGVsKSAtPlxuICAgIEBlbCA9ICQoZWwpXG5cbiAgZ2V0RGlzYWJsZWQ6IChzdHIpIC0+XG4gICAgZm9yIGl0ZW0gaW4gQGVsLmZpbmQoXCJhLGJ1dHRvblwiKVxuICAgICAgaWYgJChpdGVtKS50ZXh0KCkuaW5kZXhPZihzdHIpICE9IC0xXG4gICAgICAgIHJldHVybiAkKGl0ZW0pLmlzKFwiOmRpc2FibGVkXCIpXG4gICAgYXNzZXJ0LmZhaWwobnVsbCwgc3RyLCBcIkNhbid0IGZpbmQ6IFwiICsgc3RyKVxuXG4gIGNsaWNrOiAoc3RyKSAtPlxuICAgIGZvciBpdGVtIGluIEBlbC5maW5kKFwiYSxidXR0b25cIilcbiAgICAgIGlmICQoaXRlbSkudGV4dCgpLmluZGV4T2Yoc3RyKSAhPSAtMVxuICAgICAgICBjb25zb2xlLmxvZyBcIkNsaWNraW5nOiBcIiArICQoaXRlbSkudGV4dCgpXG4gICAgICAgICQoaXRlbSkudHJpZ2dlcihcImNsaWNrXCIpXG4gICAgICAgIHJldHVyblxuICAgIGFzc2VydC5mYWlsKG51bGwsIHN0ciwgXCJDYW4ndCBmaW5kOiBcIiArIHN0cilcbiAgXG4gIGZpbGw6IChzdHIsIHZhbHVlKSAtPlxuICAgIGZvciBpdGVtIGluIEBlbC5maW5kKFwibGFiZWxcIilcbiAgICAgIGlmICQoaXRlbSkudGV4dCgpLmluZGV4T2Yoc3RyKSAhPSAtMVxuICAgICAgICBib3ggPSBAZWwuZmluZChcIiNcIiskKGl0ZW0pLmF0dHIoJ2ZvcicpKVxuICAgICAgICBib3gudmFsKHZhbHVlKVxuICBcbiAgdGV4dDogLT5cbiAgICByZXR1cm4gQGVsLnRleHQoKVxuICAgICAgXG4gIHdhaXQ6IChhZnRlcikgLT5cbiAgICBzZXRUaW1lb3V0IGFmdGVyLCAxMFxuXG5tb2R1bGUuZXhwb3J0cyA9IFVJRHJpdmVyIiwiTG9jYXRpb25GaW5kZXIgPSByZXF1aXJlICcuL0xvY2F0aW9uRmluZGVyJ1xuR2VvSlNPTiA9IHJlcXVpcmUgJy4vR2VvSlNPTidcblxuIyBTaG93cyB0aGUgcmVsYXRpdmUgbG9jYXRpb24gb2YgYSBwb2ludCBhbmQgYWxsb3dzIHNldHRpbmcgaXRcbiMgRmlyZXMgZXZlbnRzIGxvY2F0aW9uc2V0LCBtYXAsIGJvdGggd2l0aCBcbmNsYXNzIExvY2F0aW9uVmlldyBleHRlbmRzIEJhY2tib25lLlZpZXdcbiAgY29uc3RydWN0b3I6IChvcHRpb25zKSAtPlxuICAgIHN1cGVyKClcbiAgICBAbG9jID0gb3B0aW9ucy5sb2NcbiAgICBAc2V0dGluZ0xvY2F0aW9uID0gZmFsc2VcbiAgICBAbG9jYXRpb25GaW5kZXIgPSBvcHRpb25zLmxvY2F0aW9uRmluZGVyIHx8IG5ldyBMb2NhdGlvbkZpbmRlcigpXG5cbiAgICAjIExpc3RlbiB0byBsb2NhdGlvbiBldmVudHNcbiAgICBAbGlzdGVuVG8oQGxvY2F0aW9uRmluZGVyLCAnZm91bmQnLCBAbG9jYXRpb25Gb3VuZClcbiAgICBAbGlzdGVuVG8oQGxvY2F0aW9uRmluZGVyLCAnZXJyb3InLCBAbG9jYXRpb25FcnJvcilcblxuICAgICMgU3RhcnQgdHJhY2tpbmcgbG9jYXRpb24gaWYgc2V0XG4gICAgaWYgQGxvY1xuICAgICAgQGxvY2F0aW9uRmluZGVyLnN0YXJ0V2F0Y2goKVxuXG4gICAgQHJlbmRlcigpXG5cbiAgZXZlbnRzOlxuICAgICdjbGljayAjbG9jYXRpb25fbWFwJyA6ICdtYXBDbGlja2VkJ1xuICAgICdjbGljayAjbG9jYXRpb25fc2V0JyA6ICdzZXRMb2NhdGlvbidcblxuICByZW1vdmU6IC0+XG4gICAgQGxvY2F0aW9uRmluZGVyLnN0b3BXYXRjaCgpXG4gICAgc3VwZXIoKVxuXG4gIHJlbmRlcjogLT5cbiAgICBAJGVsLmh0bWwgdGVtcGxhdGVzWydMb2NhdGlvblZpZXcnXSgpXG5cbiAgICAjIFNldCBsb2NhdGlvbiBzdHJpbmdcbiAgICBpZiBAZXJyb3JGaW5kaW5nTG9jYXRpb25cbiAgICAgIEAkKFwiI2xvY2F0aW9uX3JlbGF0aXZlXCIpLnRleHQoXCJDYW5ub3QgZmluZCBsb2NhdGlvblwiKVxuICAgIGVsc2UgaWYgbm90IEBsb2MgYW5kIG5vdCBAc2V0dGluZ0xvY2F0aW9uIFxuICAgICAgQCQoXCIjbG9jYXRpb25fcmVsYXRpdmVcIikudGV4dChcIlVuc3BlY2lmaWVkIGxvY2F0aW9uXCIpXG4gICAgZWxzZSBpZiBAc2V0dGluZ0xvY2F0aW9uXG4gICAgICBAJChcIiNsb2NhdGlvbl9yZWxhdGl2ZVwiKS50ZXh0KFwiU2V0dGluZyBsb2NhdGlvbi4uLlwiKVxuICAgIGVsc2UgaWYgbm90IEBjdXJyZW50TG9jXG4gICAgICBAJChcIiNsb2NhdGlvbl9yZWxhdGl2ZVwiKS50ZXh0KFwiV2FpdGluZyBmb3IgR1BTLi4uXCIpXG4gICAgZWxzZVxuICAgICAgQCQoXCIjbG9jYXRpb25fcmVsYXRpdmVcIikudGV4dChHZW9KU09OLmdldFJlbGF0aXZlTG9jYXRpb24oQGN1cnJlbnRMb2MsIEBsb2MpKVxuXG4gICAgIyBEaXNhYmxlIG1hcCBpZiBsb2NhdGlvbiBub3Qgc2V0XG4gICAgQCQoXCIjbG9jYXRpb25fbWFwXCIpLmF0dHIoXCJkaXNhYmxlZFwiLCBub3QgQGxvYyk7XG5cbiAgICAjIERpc2FibGUgc2V0IGlmIHNldHRpbmdcbiAgICBAJChcIiNsb2NhdGlvbl9zZXRcIikuYXR0cihcImRpc2FibGVkXCIsIEBzZXR0aW5nTG9jYXRpb24gPT0gdHJ1ZSk7ICAgIFxuXG4gIHNldExvY2F0aW9uOiAtPlxuICAgIEBzZXR0aW5nTG9jYXRpb24gPSB0cnVlXG4gICAgQGVycm9yRmluZGluZ0xvY2F0aW9uID0gZmFsc2VcbiAgICBAbG9jYXRpb25GaW5kZXIuc3RhcnRXYXRjaCgpXG4gICAgQHJlbmRlcigpXG5cbiAgbG9jYXRpb25Gb3VuZDogKHBvcykgPT5cbiAgICBpZiBAc2V0dGluZ0xvY2F0aW9uXG4gICAgICBAc2V0dGluZ0xvY2F0aW9uID0gZmFsc2VcbiAgICAgIEBlcnJvckZpbmRpbmdMb2NhdGlvbiA9IGZhbHNlXG5cbiAgICAgICMgU2V0IGxvY2F0aW9uXG4gICAgICBAbG9jID0gR2VvSlNPTi5wb3NUb1BvaW50KHBvcylcbiAgICAgIEB0cmlnZ2VyKCdsb2NhdGlvbnNldCcsIEBsb2MpXG5cbiAgICBAY3VycmVudExvYyA9IEdlb0pTT04ucG9zVG9Qb2ludChwb3MpXG4gICAgQHJlbmRlcigpXG5cbiAgbG9jYXRpb25FcnJvcjogPT5cbiAgICBAc2V0dGluZ0xvY2F0aW9uID0gZmFsc2VcbiAgICBAZXJyb3JGaW5kaW5nTG9jYXRpb24gPSB0cnVlXG4gICAgQHJlbmRlcigpXG5cbiAgbWFwQ2xpY2tlZDogPT5cbiAgICBAdHJpZ2dlcignbWFwJywgQGxvYylcblxuXG5tb2R1bGUuZXhwb3J0cyA9IExvY2F0aW9uVmlldyIsImNvbXBpbGVEb2N1bWVudFNlbGVjdG9yID0gcmVxdWlyZSgnLi9zZWxlY3RvcicpLmNvbXBpbGVEb2N1bWVudFNlbGVjdG9yXG5jb21waWxlU29ydCA9IHJlcXVpcmUoJy4vc2VsZWN0b3InKS5jb21waWxlU29ydFxuR2VvSlNPTiA9IHJlcXVpcmUgJy4uL0dlb0pTT04nXG5cbmNsYXNzIExvY2FsRGJcbiAgY29uc3RydWN0b3I6IChuYW1lLCBvcHRpb25zKSAtPlxuICAgIEBuYW1lID0gbmFtZVxuICAgIEBjb2xsZWN0aW9ucyA9IHt9XG5cbiAgICBpZiBvcHRpb25zIGFuZCBvcHRpb25zLm5hbWVzcGFjZSBhbmQgd2luZG93LmxvY2FsU3RvcmFnZVxuICAgICAgQG5hbWVzcGFjZSA9IG9wdGlvbnMubmFtZXNwYWNlXG5cbiAgYWRkQ29sbGVjdGlvbjogKG5hbWUpIC0+XG4gICAgZGJOYW1lID0gQG5hbWVcblxuICAgICMgU2V0IG5hbWVzcGFjZSBmb3IgY29sbGVjdGlvblxuICAgIG5hbWVzcGFjZSA9IEBuYW1lc3BhY2UrXCIuXCIrbmFtZSBpZiBAbmFtZXNwYWNlXG5cbiAgICBjb2xsZWN0aW9uID0gbmV3IENvbGxlY3Rpb24obmFtZSwgbmFtZXNwYWNlKVxuICAgIEBbbmFtZV0gPSBjb2xsZWN0aW9uXG4gICAgQGNvbGxlY3Rpb25zW25hbWVdID0gY29sbGVjdGlvblxuXG4gIHJlbW92ZUNvbGxlY3Rpb246IChuYW1lKSAtPlxuICAgIGRiTmFtZSA9IEBuYW1lXG5cbiAgICBpZiBAbmFtZXNwYWNlIGFuZCB3aW5kb3cubG9jYWxTdG9yYWdlXG4gICAgICBrZXlzID0gW11cbiAgICAgIGZvciBpIGluIFswLi4ubG9jYWxTdG9yYWdlLmxlbmd0aF1cbiAgICAgICAga2V5cy5wdXNoKGxvY2FsU3RvcmFnZS5rZXkoaSkpXG5cbiAgICAgIGZvciBrZXkgaW4ga2V5c1xuICAgICAgICBpZiBrZXkuc3Vic3RyaW5nKDAsIEBuYW1lc3BhY2UubGVuZ3RoICsgMSkgPT0gQG5hbWVzcGFjZSArIFwiLlwiXG4gICAgICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oa2V5KVxuXG4gICAgZGVsZXRlIEBbbmFtZV1cbiAgICBkZWxldGUgQGNvbGxlY3Rpb25zW25hbWVdXG5cblxuIyBTdG9yZXMgZGF0YSBpbiBtZW1vcnksIG9wdGlvbmFsbHkgYmFja2VkIGJ5IGxvY2FsIHN0b3JhZ2VcbmNsYXNzIENvbGxlY3Rpb25cbiAgY29uc3RydWN0b3I6IChuYW1lLCBuYW1lc3BhY2UpIC0+XG4gICAgQG5hbWUgPSBuYW1lXG4gICAgQG5hbWVzcGFjZSA9IG5hbWVzcGFjZVxuXG4gICAgQGl0ZW1zID0ge31cbiAgICBAdXBzZXJ0cyA9IHt9ICAjIFBlbmRpbmcgdXBzZXJ0cyBieSBfaWQuIFN0aWxsIGluIGl0ZW1zXG4gICAgQHJlbW92ZXMgPSB7fSAgIyBQZW5kaW5nIHJlbW92ZXMgYnkgX2lkLiBObyBsb25nZXIgaW4gaXRlbXNcblxuICAgICMgUmVhZCBmcm9tIGxvY2FsIHN0b3JhZ2VcbiAgICBpZiB3aW5kb3cubG9jYWxTdG9yYWdlIGFuZCBuYW1lc3BhY2U/XG4gICAgICBAbG9hZFN0b3JhZ2UoKVxuXG4gIGxvYWRTdG9yYWdlOiAtPlxuICAgICMgUmVhZCBpdGVtcyBmcm9tIGxvY2FsU3RvcmFnZVxuICAgIEBpdGVtTmFtZXNwYWNlID0gQG5hbWVzcGFjZSArIFwiX1wiXG5cbiAgICBmb3IgaSBpbiBbMC4uLmxvY2FsU3RvcmFnZS5sZW5ndGhdXG4gICAgICBrZXkgPSBsb2NhbFN0b3JhZ2Uua2V5KGkpXG4gICAgICBpZiBrZXkuc3Vic3RyaW5nKDAsIEBpdGVtTmFtZXNwYWNlLmxlbmd0aCkgPT0gQGl0ZW1OYW1lc3BhY2VcbiAgICAgICAgaXRlbSA9IEpTT04ucGFyc2UobG9jYWxTdG9yYWdlW2tleV0pXG4gICAgICAgIEBpdGVtc1tpdGVtLl9pZF0gPSBpdGVtXG5cbiAgICAjIFJlYWQgdXBzZXJ0c1xuICAgIHVwc2VydEtleXMgPSBpZiBsb2NhbFN0b3JhZ2VbQG5hbWVzcGFjZStcInVwc2VydHNcIl0gdGhlbiBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZVtAbmFtZXNwYWNlK1widXBzZXJ0c1wiXSkgZWxzZSBbXVxuICAgIGZvciBrZXkgaW4gdXBzZXJ0S2V5c1xuICAgICAgQHVwc2VydHNba2V5XSA9IEBpdGVtc1trZXldXG5cbiAgICAjIFJlYWQgcmVtb3Zlc1xuICAgIHJlbW92ZUl0ZW1zID0gaWYgbG9jYWxTdG9yYWdlW0BuYW1lc3BhY2UrXCJyZW1vdmVzXCJdIHRoZW4gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2VbQG5hbWVzcGFjZStcInJlbW92ZXNcIl0pIGVsc2UgW11cbiAgICBAcmVtb3ZlcyA9IF8ub2JqZWN0KF8ucGx1Y2socmVtb3ZlSXRlbXMsIFwiX2lkXCIpLCByZW1vdmVJdGVtcylcblxuICBmaW5kOiAoc2VsZWN0b3IsIG9wdGlvbnMpIC0+XG4gICAgcmV0dXJuIGZldGNoOiAoc3VjY2VzcywgZXJyb3IpID0+XG4gICAgICBAX2ZpbmRGZXRjaChzZWxlY3Rvciwgb3B0aW9ucywgc3VjY2VzcywgZXJyb3IpXG5cbiAgZmluZE9uZTogKHNlbGVjdG9yLCBvcHRpb25zLCBzdWNjZXNzLCBlcnJvcikgLT5cbiAgICBpZiBfLmlzRnVuY3Rpb24ob3B0aW9ucykgXG4gICAgICBbb3B0aW9ucywgc3VjY2VzcywgZXJyb3JdID0gW3t9LCBvcHRpb25zLCBzdWNjZXNzXVxuXG4gICAgQGZpbmQoc2VsZWN0b3IsIG9wdGlvbnMpLmZldGNoIChyZXN1bHRzKSAtPlxuICAgICAgaWYgc3VjY2Vzcz8gdGhlbiBzdWNjZXNzKGlmIHJlc3VsdHMubGVuZ3RoPjAgdGhlbiByZXN1bHRzWzBdIGVsc2UgbnVsbClcbiAgICAsIGVycm9yXG5cbiAgX2ZpbmRGZXRjaDogKHNlbGVjdG9yLCBvcHRpb25zLCBzdWNjZXNzLCBlcnJvcikgLT5cbiAgICBmaWx0ZXJlZCA9IF8uZmlsdGVyKF8udmFsdWVzKEBpdGVtcyksIGNvbXBpbGVEb2N1bWVudFNlbGVjdG9yKHNlbGVjdG9yKSlcblxuICAgICMgSGFuZGxlIGdlb3NwYXRpYWwgb3BlcmF0b3JzXG4gICAgZmlsdGVyZWQgPSBwcm9jZXNzTmVhck9wZXJhdG9yKHNlbGVjdG9yLCBmaWx0ZXJlZClcbiAgICBmaWx0ZXJlZCA9IHByb2Nlc3NHZW9JbnRlcnNlY3RzT3BlcmF0b3Ioc2VsZWN0b3IsIGZpbHRlcmVkKVxuXG4gICAgaWYgb3B0aW9ucyBhbmQgb3B0aW9ucy5zb3J0IFxuICAgICAgZmlsdGVyZWQuc29ydChjb21waWxlU29ydChvcHRpb25zLnNvcnQpKVxuXG4gICAgaWYgb3B0aW9ucyBhbmQgb3B0aW9ucy5saW1pdFxuICAgICAgZmlsdGVyZWQgPSBfLmZpcnN0IGZpbHRlcmVkLCBvcHRpb25zLmxpbWl0XG5cbiAgICAjIENsb25lIHRvIHByZXZlbnQgYWNjaWRlbnRhbCB1cGRhdGVzXG4gICAgZmlsdGVyZWQgPSBfLm1hcCBmaWx0ZXJlZCwgKGRvYykgLT4gXy5jbG9uZURlZXAoZG9jKVxuICAgIGlmIHN1Y2Nlc3M/IHRoZW4gc3VjY2VzcyhmaWx0ZXJlZClcblxuICB1cHNlcnQ6IChkb2MsIHN1Y2Nlc3MsIGVycm9yKSAtPlxuICAgIGlmIG5vdCBkb2MuX2lkXG4gICAgICBkb2MuX2lkID0gY3JlYXRlVWlkKClcblxuICAgICMgUmVwbGFjZS9hZGQgXG4gICAgQF9wdXRJdGVtKGRvYylcbiAgICBAX3B1dFVwc2VydChkb2MpXG5cbiAgICBpZiBzdWNjZXNzPyB0aGVuIHN1Y2Nlc3MoZG9jKVxuXG4gIHJlbW92ZTogKGlkLCBzdWNjZXNzLCBlcnJvcikgLT5cbiAgICBpZiBfLmhhcyhAaXRlbXMsIGlkKVxuICAgICAgQF9wdXRSZW1vdmUoQGl0ZW1zW2lkXSlcbiAgICAgIEBfZGVsZXRlSXRlbShpZClcbiAgICAgIEBfZGVsZXRlVXBzZXJ0KGlkKVxuXG4gICAgaWYgc3VjY2Vzcz8gdGhlbiBzdWNjZXNzKClcblxuICBfcHV0SXRlbTogKGRvYykgLT5cbiAgICBAaXRlbXNbZG9jLl9pZF0gPSBkb2NcbiAgICBpZiBAbmFtZXNwYWNlXG4gICAgICBsb2NhbFN0b3JhZ2VbQGl0ZW1OYW1lc3BhY2UgKyBkb2MuX2lkXSA9IEpTT04uc3RyaW5naWZ5KGRvYylcblxuICBfZGVsZXRlSXRlbTogKGlkKSAtPlxuICAgIGRlbGV0ZSBAaXRlbXNbaWRdXG4gICAgaWYgQG5hbWVzcGFjZVxuICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oQGl0ZW1OYW1lc3BhY2UgKyBpZClcblxuICBfcHV0VXBzZXJ0OiAoZG9jKSAtPlxuICAgIEB1cHNlcnRzW2RvYy5faWRdID0gZG9jXG4gICAgaWYgQG5hbWVzcGFjZVxuICAgICAgbG9jYWxTdG9yYWdlW0BuYW1lc3BhY2UrXCJ1cHNlcnRzXCJdID0gSlNPTi5zdHJpbmdpZnkoXy5rZXlzKEB1cHNlcnRzKSlcblxuICBfZGVsZXRlVXBzZXJ0OiAoaWQpIC0+XG4gICAgZGVsZXRlIEB1cHNlcnRzW2lkXVxuICAgIGlmIEBuYW1lc3BhY2VcbiAgICAgIGxvY2FsU3RvcmFnZVtAbmFtZXNwYWNlK1widXBzZXJ0c1wiXSA9IEpTT04uc3RyaW5naWZ5KF8ua2V5cyhAdXBzZXJ0cykpXG5cbiAgX3B1dFJlbW92ZTogKGRvYykgLT5cbiAgICBAcmVtb3Zlc1tkb2MuX2lkXSA9IGRvY1xuICAgIGlmIEBuYW1lc3BhY2VcbiAgICAgIGxvY2FsU3RvcmFnZVtAbmFtZXNwYWNlK1wicmVtb3Zlc1wiXSA9IEpTT04uc3RyaW5naWZ5KF8udmFsdWVzKEByZW1vdmVzKSlcblxuICBfZGVsZXRlUmVtb3ZlOiAoaWQpIC0+XG4gICAgZGVsZXRlIEByZW1vdmVzW2lkXVxuICAgIGlmIEBuYW1lc3BhY2VcbiAgICAgIGxvY2FsU3RvcmFnZVtAbmFtZXNwYWNlK1wicmVtb3Zlc1wiXSA9IEpTT04uc3RyaW5naWZ5KF8udmFsdWVzKEByZW1vdmVzKSlcblxuICBjYWNoZTogKGRvY3MsIHNlbGVjdG9yLCBvcHRpb25zLCBzdWNjZXNzLCBlcnJvcikgLT5cbiAgICAjIEFkZCBhbGwgbm9uLWxvY2FsIHRoYXQgYXJlIG5vdCB1cHNlcnRlZCBvciByZW1vdmVkXG4gICAgZm9yIGRvYyBpbiBkb2NzXG4gICAgICBpZiBub3QgXy5oYXMoQHVwc2VydHMsIGRvYy5faWQpIGFuZCBub3QgXy5oYXMoQHJlbW92ZXMsIGRvYy5faWQpXG4gICAgICAgIEBfcHV0SXRlbShkb2MpXG5cbiAgICBkb2NzTWFwID0gXy5vYmplY3QoXy5wbHVjayhkb2NzLCBcIl9pZFwiKSwgZG9jcylcblxuICAgIGlmIG9wdGlvbnMuc29ydFxuICAgICAgc29ydCA9IGNvbXBpbGVTb3J0KG9wdGlvbnMuc29ydClcblxuICAgICMgUGVyZm9ybSBxdWVyeSwgcmVtb3Zpbmcgcm93cyBtaXNzaW5nIGluIGRvY3MgZnJvbSBsb2NhbCBkYiBcbiAgICBAZmluZChzZWxlY3Rvciwgb3B0aW9ucykuZmV0Y2ggKHJlc3VsdHMpID0+XG4gICAgICBmb3IgcmVzdWx0IGluIHJlc3VsdHNcbiAgICAgICAgaWYgbm90IGRvY3NNYXBbcmVzdWx0Ll9pZF0gYW5kIG5vdCBfLmhhcyhAdXBzZXJ0cywgcmVzdWx0Ll9pZClcbiAgICAgICAgICAjIElmIHBhc3QgZW5kIG9uIHNvcnRlZCBsaW1pdGVkLCBpZ25vcmVcbiAgICAgICAgICBpZiBvcHRpb25zLnNvcnQgYW5kIG9wdGlvbnMubGltaXQgYW5kIGRvY3MubGVuZ3RoID09IG9wdGlvbnMubGltaXRcbiAgICAgICAgICAgIGlmIHNvcnQocmVzdWx0LCBfLmxhc3QoZG9jcykpID49IDBcbiAgICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICBAX2RlbGV0ZUl0ZW0ocmVzdWx0Ll9pZClcblxuICAgICAgaWYgc3VjY2Vzcz8gdGhlbiBzdWNjZXNzKCkgIFxuICAgICwgZXJyb3JcbiAgICBcbiAgcGVuZGluZ1Vwc2VydHM6IChzdWNjZXNzKSAtPlxuICAgIHN1Y2Nlc3MgXy52YWx1ZXMoQHVwc2VydHMpXG5cbiAgcGVuZGluZ1JlbW92ZXM6IChzdWNjZXNzKSAtPlxuICAgIHN1Y2Nlc3MgXy5wbHVjayhAcmVtb3ZlcywgXCJfaWRcIilcblxuICByZXNvbHZlVXBzZXJ0OiAoZG9jLCBzdWNjZXNzKSAtPlxuICAgIGlmIEB1cHNlcnRzW2RvYy5faWRdIGFuZCBfLmlzRXF1YWwoZG9jLCBAdXBzZXJ0c1tkb2MuX2lkXSlcbiAgICAgIEBfZGVsZXRlVXBzZXJ0KGRvYy5faWQpXG4gICAgaWYgc3VjY2Vzcz8gdGhlbiBzdWNjZXNzKClcblxuICByZXNvbHZlUmVtb3ZlOiAoaWQsIHN1Y2Nlc3MpIC0+XG4gICAgQF9kZWxldGVSZW1vdmUoaWQpXG4gICAgaWYgc3VjY2Vzcz8gdGhlbiBzdWNjZXNzKClcblxuICAjIEFkZCBidXQgZG8gbm90IG92ZXJ3cml0ZSBvciByZWNvcmQgYXMgdXBzZXJ0XG4gIHNlZWQ6IChkb2MsIHN1Y2Nlc3MpIC0+XG4gICAgaWYgbm90IF8uaGFzKEBpdGVtcywgZG9jLl9pZCkgYW5kIG5vdCBfLmhhcyhAcmVtb3ZlcywgZG9jLl9pZClcbiAgICAgIEBfcHV0SXRlbShkb2MpXG4gICAgaWYgc3VjY2Vzcz8gdGhlbiBzdWNjZXNzKClcblxuXG5jcmVhdGVVaWQgPSAtPiBcbiAgJ3h4eHh4eHh4eHh4eDR4eHh5eHh4eHh4eHh4eHh4eHh4Jy5yZXBsYWNlKC9beHldL2csIChjKSAtPlxuICAgIHIgPSBNYXRoLnJhbmRvbSgpKjE2fDBcbiAgICB2ID0gaWYgYyA9PSAneCcgdGhlbiByIGVsc2UgKHImMHgzfDB4OClcbiAgICByZXR1cm4gdi50b1N0cmluZygxNilcbiAgIClcblxucHJvY2Vzc05lYXJPcGVyYXRvciA9IChzZWxlY3RvciwgbGlzdCkgLT5cbiAgZm9yIGtleSwgdmFsdWUgb2Ygc2VsZWN0b3JcbiAgICBpZiB2YWx1ZT8gYW5kIHZhbHVlWyckbmVhciddXG4gICAgICBnZW8gPSB2YWx1ZVsnJG5lYXInXVsnJGdlb21ldHJ5J11cbiAgICAgIGlmIGdlby50eXBlICE9ICdQb2ludCdcbiAgICAgICAgYnJlYWtcblxuICAgICAgbmVhciA9IG5ldyBMLkxhdExuZyhnZW8uY29vcmRpbmF0ZXNbMV0sIGdlby5jb29yZGluYXRlc1swXSlcblxuICAgICAgbGlzdCA9IF8uZmlsdGVyIGxpc3QsIChkb2MpIC0+XG4gICAgICAgIHJldHVybiBkb2Nba2V5XSBhbmQgZG9jW2tleV0udHlwZSA9PSAnUG9pbnQnXG5cbiAgICAgICMgR2V0IGRpc3RhbmNlc1xuICAgICAgZGlzdGFuY2VzID0gXy5tYXAgbGlzdCwgKGRvYykgLT5cbiAgICAgICAgcmV0dXJuIHsgZG9jOiBkb2MsIGRpc3RhbmNlOiBcbiAgICAgICAgICBuZWFyLmRpc3RhbmNlVG8obmV3IEwuTGF0TG5nKGRvY1trZXldLmNvb3JkaW5hdGVzWzFdLCBkb2Nba2V5XS5jb29yZGluYXRlc1swXSkpXG4gICAgICAgIH1cblxuICAgICAgIyBGaWx0ZXIgbm9uLXBvaW50c1xuICAgICAgZGlzdGFuY2VzID0gXy5maWx0ZXIgZGlzdGFuY2VzLCAoaXRlbSkgLT4gaXRlbS5kaXN0YW5jZSA+PSAwXG5cbiAgICAgICMgU29ydCBieSBkaXN0YW5jZVxuICAgICAgZGlzdGFuY2VzID0gXy5zb3J0QnkgZGlzdGFuY2VzLCAnZGlzdGFuY2UnXG5cbiAgICAgICMgRmlsdGVyIGJ5IG1heERpc3RhbmNlXG4gICAgICBpZiB2YWx1ZVsnJG5lYXInXVsnJG1heERpc3RhbmNlJ11cbiAgICAgICAgZGlzdGFuY2VzID0gXy5maWx0ZXIgZGlzdGFuY2VzLCAoaXRlbSkgLT4gaXRlbS5kaXN0YW5jZSA8PSB2YWx1ZVsnJG5lYXInXVsnJG1heERpc3RhbmNlJ11cblxuICAgICAgIyBMaW1pdCB0byAxMDBcbiAgICAgIGRpc3RhbmNlcyA9IF8uZmlyc3QgZGlzdGFuY2VzLCAxMDBcblxuICAgICAgIyBFeHRyYWN0IGRvY3NcbiAgICAgIGxpc3QgPSBfLnBsdWNrIGRpc3RhbmNlcywgJ2RvYydcbiAgcmV0dXJuIGxpc3RcblxucHJvY2Vzc0dlb0ludGVyc2VjdHNPcGVyYXRvciA9IChzZWxlY3RvciwgbGlzdCkgLT5cbiAgZm9yIGtleSwgdmFsdWUgb2Ygc2VsZWN0b3JcbiAgICBpZiB2YWx1ZT8gYW5kIHZhbHVlWyckZ2VvSW50ZXJzZWN0cyddXG4gICAgICBnZW8gPSB2YWx1ZVsnJGdlb0ludGVyc2VjdHMnXVsnJGdlb21ldHJ5J11cbiAgICAgIGlmIGdlby50eXBlICE9ICdQb2x5Z29uJ1xuICAgICAgICBicmVha1xuXG4gICAgICAjIENoZWNrIHdpdGhpbiBmb3IgZWFjaFxuICAgICAgbGlzdCA9IF8uZmlsdGVyIGxpc3QsIChkb2MpIC0+XG4gICAgICAgICMgUmVqZWN0IG5vbi1wb2ludHNcbiAgICAgICAgaWYgbm90IGRvY1trZXldIG9yIGRvY1trZXldLnR5cGUgIT0gJ1BvaW50J1xuICAgICAgICAgIHJldHVybiBmYWxzZVxuXG4gICAgICAgICMgQ2hlY2sgcG9seWdvblxuICAgICAgICByZXR1cm4gR2VvSlNPTi5wb2ludEluUG9seWdvbihkb2Nba2V5XSwgZ2VvKVxuXG4gIHJldHVybiBsaXN0XG5cbm1vZHVsZS5leHBvcnRzID0gTG9jYWxEYlxuIiwiZXhwb3J0cy5TZWN0aW9ucyA9IEJhY2tib25lLlZpZXcuZXh0ZW5kKHtcbiAgICBjbGFzc05hbWUgOiBcInN1cnZleVwiLFxuXG4gICAgaW5pdGlhbGl6ZSA6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnRpdGxlID0gdGhpcy5vcHRpb25zLnRpdGxlO1xuICAgICAgICB0aGlzLnNlY3Rpb25zID0gdGhpcy5vcHRpb25zLnNlY3Rpb25zO1xuICAgICAgICB0aGlzLnJlbmRlcigpO1xuXG4gICAgICAgIC8vIEFkanVzdCBuZXh0L3ByZXYgYmFzZWQgb24gbW9kZWxcbiAgICAgICAgdGhpcy5tb2RlbC5vbihcImNoYW5nZVwiLCB0aGlzLnJlbmRlck5leHRQcmV2LCB0aGlzKTtcblxuICAgICAgICAvLyBHbyB0byBhcHByb3ByaWF0ZSBzZWN0aW9uIFRPRE9cbiAgICAgICAgdGhpcy5zaG93U2VjdGlvbigwKTtcbiAgICB9LFxuXG4gICAgZXZlbnRzIDoge1xuICAgICAgICBcImNsaWNrIC5uZXh0XCIgOiBcIm5leHRTZWN0aW9uXCIsXG4gICAgICAgIFwiY2xpY2sgLnByZXZcIiA6IFwicHJldlNlY3Rpb25cIixcbiAgICAgICAgXCJjbGljayAuZmluaXNoXCIgOiBcImZpbmlzaFwiLFxuICAgICAgICBcImNsaWNrIGEuc2VjdGlvbi1jcnVtYlwiIDogXCJjcnVtYlNlY3Rpb25cIlxuICAgIH0sXG5cbiAgICBmaW5pc2ggOiBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gVmFsaWRhdGUgY3VycmVudCBzZWN0aW9uXG4gICAgICAgIHZhciBzZWN0aW9uID0gdGhpcy5zZWN0aW9uc1t0aGlzLnNlY3Rpb25dO1xuICAgICAgICBpZiAoc2VjdGlvbi52YWxpZGF0ZSgpKSB7XG4gICAgICAgICAgICB0aGlzLnRyaWdnZXIoJ2NvbXBsZXRlJyk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgY3J1bWJTZWN0aW9uIDogZnVuY3Rpb24oZSkge1xuICAgICAgICAvLyBHbyB0byBzZWN0aW9uXG4gICAgICAgIHZhciBpbmRleCA9IHBhcnNlSW50KGUudGFyZ2V0LmdldEF0dHJpYnV0ZShcImRhdGEtdmFsdWVcIikpO1xuICAgICAgICB0aGlzLnNob3dTZWN0aW9uKGluZGV4KTtcbiAgICB9LFxuXG4gICAgZ2V0TmV4dFNlY3Rpb25JbmRleCA6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgaSA9IHRoaXMuc2VjdGlvbiArIDE7XG4gICAgICAgIHdoaWxlIChpIDwgdGhpcy5zZWN0aW9ucy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnNlY3Rpb25zW2ldLnNob3VsZEJlVmlzaWJsZSgpKVxuICAgICAgICAgICAgICAgIHJldHVybiBpO1xuICAgICAgICAgICAgaSsrO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGdldFByZXZTZWN0aW9uSW5kZXggOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGkgPSB0aGlzLnNlY3Rpb24gLSAxO1xuICAgICAgICB3aGlsZSAoaSA+PSAwKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5zZWN0aW9uc1tpXS5zaG91bGRCZVZpc2libGUoKSlcbiAgICAgICAgICAgICAgICByZXR1cm4gaTtcbiAgICAgICAgICAgIGktLTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBuZXh0U2VjdGlvbiA6IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBWYWxpZGF0ZSBjdXJyZW50IHNlY3Rpb25cbiAgICAgICAgdmFyIHNlY3Rpb24gPSB0aGlzLnNlY3Rpb25zW3RoaXMuc2VjdGlvbl07XG4gICAgICAgIGlmIChzZWN0aW9uLnZhbGlkYXRlKCkpIHtcbiAgICAgICAgICAgIHRoaXMuc2hvd1NlY3Rpb24odGhpcy5nZXROZXh0U2VjdGlvbkluZGV4KCkpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIHByZXZTZWN0aW9uIDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuc2hvd1NlY3Rpb24odGhpcy5nZXRQcmV2U2VjdGlvbkluZGV4KCkpO1xuICAgIH0sXG5cbiAgICBzaG93U2VjdGlvbiA6IGZ1bmN0aW9uKGluZGV4KSB7XG4gICAgICAgIHRoaXMuc2VjdGlvbiA9IGluZGV4O1xuXG4gICAgICAgIF8uZWFjaCh0aGlzLnNlY3Rpb25zLCBmdW5jdGlvbihzKSB7XG4gICAgICAgICAgICBzLiRlbC5oaWRlKCk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLnNlY3Rpb25zW2luZGV4XS4kZWwuc2hvdygpO1xuXG4gICAgICAgIC8vIFNldHVwIGJyZWFkY3J1bWJzXG4gICAgICAgIHZhciB2aXNpYmxlU2VjdGlvbnMgPSBfLmZpbHRlcihfLmZpcnN0KHRoaXMuc2VjdGlvbnMsIGluZGV4ICsgMSksIGZ1bmN0aW9uKHMpIHtcbiAgICAgICAgICAgIHJldHVybiBzLnNob3VsZEJlVmlzaWJsZSgpXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLiQoXCIuYnJlYWRjcnVtYlwiKS5odG1sKHRlbXBsYXRlc1snZm9ybXMvU2VjdGlvbnNfYnJlYWRjcnVtYnMnXSh7XG4gICAgICAgICAgICBzZWN0aW9ucyA6IF8uaW5pdGlhbCh2aXNpYmxlU2VjdGlvbnMpLFxuICAgICAgICAgICAgbGFzdFNlY3Rpb246IF8ubGFzdCh2aXNpYmxlU2VjdGlvbnMpXG4gICAgICAgIH0pKTtcbiAgICAgICAgXG4gICAgICAgIHRoaXMucmVuZGVyTmV4dFByZXYoKTtcblxuICAgICAgICAvLyBTY3JvbGwgaW50byB2aWV3XG4gICAgICAgIHRoaXMuJGVsLnNjcm9sbGludG92aWV3KCk7XG4gICAgfSxcbiAgICBcbiAgICByZW5kZXJOZXh0UHJldiA6IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBTZXR1cCBuZXh0L3ByZXYgYnV0dG9uc1xuICAgICAgICB0aGlzLiQoXCIucHJldlwiKS50b2dnbGUodGhpcy5nZXRQcmV2U2VjdGlvbkluZGV4KCkgIT09IHVuZGVmaW5lZCk7XG4gICAgICAgIHRoaXMuJChcIi5uZXh0XCIpLnRvZ2dsZSh0aGlzLmdldE5leHRTZWN0aW9uSW5kZXgoKSAhPT0gdW5kZWZpbmVkKTtcbiAgICAgICAgdGhpcy4kKFwiLmZpbmlzaFwiKS50b2dnbGUodGhpcy5nZXROZXh0U2VjdGlvbkluZGV4KCkgPT09IHVuZGVmaW5lZCk7XG4gICAgfSxcblxuICAgIHJlbmRlciA6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLiRlbC5odG1sKHRlbXBsYXRlc1snZm9ybXMvU2VjdGlvbnMnXSgpKTtcblxuICAgICAgICAvLyBBZGQgc2VjdGlvbnNcbiAgICAgICAgdmFyIHNlY3Rpb25zRWwgPSB0aGlzLiQoXCIuc2VjdGlvbnNcIik7XG4gICAgICAgIF8uZWFjaCh0aGlzLnNlY3Rpb25zLCBmdW5jdGlvbihzKSB7XG4gICAgICAgICAgICBzZWN0aW9uc0VsLmFwcGVuZChzLiRlbCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxufSk7XG5cbmV4cG9ydHMuU2VjdGlvbiA9IEJhY2tib25lLlZpZXcuZXh0ZW5kKHtcbiAgICBjbGFzc05hbWUgOiBcInNlY3Rpb25cIixcbiAgICB0ZW1wbGF0ZSA6IF8udGVtcGxhdGUoJzxkaXYgY2xhc3M9XCJjb250ZW50c1wiPjwvZGl2PicpLFxuXG4gICAgaW5pdGlhbGl6ZSA6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnRpdGxlID0gdGhpcy5vcHRpb25zLnRpdGxlO1xuICAgICAgICB0aGlzLmNvbnRlbnRzID0gdGhpcy5vcHRpb25zLmNvbnRlbnRzO1xuXG4gICAgICAgIC8vIEFsd2F5cyBpbnZpc2libGUgaW5pdGlhbGx5XG4gICAgICAgIHRoaXMuJGVsLmhpZGUoKTtcbiAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICB9LFxuXG4gICAgc2hvdWxkQmVWaXNpYmxlIDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICghdGhpcy5vcHRpb25zLmNvbmRpdGlvbmFsKVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIHJldHVybiB0aGlzLm9wdGlvbnMuY29uZGl0aW9uYWwodGhpcy5tb2RlbCk7XG4gICAgfSxcblxuICAgIHZhbGlkYXRlIDogZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIEdldCBhbGwgdmlzaWJsZSBpdGVtc1xuICAgICAgICB2YXIgaXRlbXMgPSBfLmZpbHRlcih0aGlzLmNvbnRlbnRzLCBmdW5jdGlvbihjKSB7XG4gICAgICAgICAgICByZXR1cm4gYy52aXNpYmxlICYmIGMudmFsaWRhdGU7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gIV8uYW55KF8ubWFwKGl0ZW1zLCBmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgICAgICByZXR1cm4gaXRlbS52YWxpZGF0ZSgpO1xuICAgICAgICB9KSk7XG4gICAgfSxcblxuICAgIHJlbmRlciA6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLiRlbC5odG1sKHRoaXMudGVtcGxhdGUodGhpcykpO1xuXG4gICAgICAgIC8vIEFkZCBjb250ZW50cyAocXVlc3Rpb25zLCBtb3N0bHkpXG4gICAgICAgIHZhciBjb250ZW50c0VsID0gdGhpcy4kKFwiLmNvbnRlbnRzXCIpO1xuICAgICAgICBfLmVhY2godGhpcy5jb250ZW50cywgZnVuY3Rpb24oYykge1xuICAgICAgICAgICAgY29udGVudHNFbC5hcHBlbmQoYy4kZWwpO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbn0pO1xuXG5leHBvcnRzLlF1ZXN0aW9uID0gQmFja2JvbmUuVmlldy5leHRlbmQoe1xuICAgIGNsYXNzTmFtZSA6IFwicXVlc3Rpb25cIixcblxuICAgIHRlbXBsYXRlIDogXy50ZW1wbGF0ZSgnPGRpdiBjbGFzcz1cInByb21wdFwiPjwlPW9wdGlvbnMucHJvbXB0JT48JT1yZW5kZXJSZXF1aXJlZCgpJT48L2Rpdj48ZGl2IGNsYXNzPVwiYW5zd2VyXCI+PC9kaXY+PCU9cmVuZGVySGludCgpJT4nKSxcblxuICAgIHJlbmRlclJlcXVpcmVkIDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0aGlzLnJlcXVpcmVkKVxuICAgICAgICAgICAgcmV0dXJuICcmbmJzcDs8c3BhbiBjbGFzcz1cInJlcXVpcmVkXCI+Kjwvc3Bhbj4nO1xuICAgICAgICByZXR1cm4gJyc7XG4gICAgfSxcblxuICAgIHJlbmRlckhpbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmhpbnQpXG4gICAgICAgICAgICByZXR1cm4gXy50ZW1wbGF0ZSgnPGRpdiBjbGFzcz1cIm11dGVkXCI+PCU9aGludCU+PC9kaXY+Jykoe2hpbnQ6IHRoaXMub3B0aW9ucy5oaW50fSk7XG4gICAgfSxcblxuICAgIHZhbGlkYXRlIDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciB2YWw7XG5cbiAgICAgICAgLy8gQ2hlY2sgcmVxdWlyZWRcbiAgICAgICAgaWYgKHRoaXMucmVxdWlyZWQpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLm1vZGVsLmdldCh0aGlzLmlkKSA9PT0gdW5kZWZpbmVkIHx8IHRoaXMubW9kZWwuZ2V0KHRoaXMuaWQpID09PSBudWxsIHx8IHRoaXMubW9kZWwuZ2V0KHRoaXMuaWQpID09PSBcIlwiKVxuICAgICAgICAgICAgICAgIHZhbCA9IFwiUmVxdWlyZWRcIjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENoZWNrIGludGVybmFsIHZhbGlkYXRpb25cbiAgICAgICAgaWYgKCF2YWwgJiYgdGhpcy52YWxpZGF0ZUludGVybmFsKSB7XG4gICAgICAgICAgICB2YWwgPSB0aGlzLnZhbGlkYXRlSW50ZXJuYWwoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENoZWNrIGN1c3RvbSB2YWxpZGF0aW9uXG4gICAgICAgIGlmICghdmFsICYmIHRoaXMub3B0aW9ucy52YWxpZGF0ZSkge1xuICAgICAgICAgICAgdmFsID0gdGhpcy5vcHRpb25zLnZhbGlkYXRlKCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBTaG93IHZhbGlkYXRpb24gcmVzdWx0cyBUT0RPXG4gICAgICAgIGlmICh2YWwpIHtcbiAgICAgICAgICAgIHRoaXMuJGVsLmFkZENsYXNzKFwiaW52YWxpZFwiKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuJGVsLnJlbW92ZUNsYXNzKFwiaW52YWxpZFwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB2YWw7XG4gICAgfSxcblxuICAgIHVwZGF0ZVZpc2liaWxpdHkgOiBmdW5jdGlvbihlKSB7XG4gICAgICAgIC8vIHNsaWRlVXAvc2xpZGVEb3duXG4gICAgICAgIGlmICh0aGlzLnNob3VsZEJlVmlzaWJsZSgpICYmICF0aGlzLnZpc2libGUpXG4gICAgICAgICAgICB0aGlzLiRlbC5zbGlkZURvd24oKTtcbiAgICAgICAgaWYgKCF0aGlzLnNob3VsZEJlVmlzaWJsZSgpICYmIHRoaXMudmlzaWJsZSlcbiAgICAgICAgICAgIHRoaXMuJGVsLnNsaWRlVXAoKTtcbiAgICAgICAgdGhpcy52aXNpYmxlID0gdGhpcy5zaG91bGRCZVZpc2libGUoKTtcbiAgICB9LFxuXG4gICAgc2hvdWxkQmVWaXNpYmxlIDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICghdGhpcy5vcHRpb25zLmNvbmRpdGlvbmFsKVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIHJldHVybiB0aGlzLm9wdGlvbnMuY29uZGl0aW9uYWwodGhpcy5tb2RlbCk7XG4gICAgfSxcblxuICAgIGluaXRpYWxpemUgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gQWRqdXN0IHZpc2liaWxpdHkgYmFzZWQgb24gbW9kZWxcbiAgICAgICAgdGhpcy5tb2RlbC5vbihcImNoYW5nZVwiLCB0aGlzLnVwZGF0ZVZpc2liaWxpdHksIHRoaXMpO1xuXG4gICAgICAgIC8vIFJlLXJlbmRlciBiYXNlZCBvbiBtb2RlbCBjaGFuZ2VzXG4gICAgICAgIHRoaXMubW9kZWwub24oXCJjaGFuZ2U6XCIgKyB0aGlzLmlkLCB0aGlzLnJlbmRlciwgdGhpcyk7XG5cbiAgICAgICAgdGhpcy5yZXF1aXJlZCA9IHRoaXMub3B0aW9ucy5yZXF1aXJlZDtcblxuICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgIH0sXG5cbiAgICByZW5kZXIgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy4kZWwuaHRtbCh0aGlzLnRlbXBsYXRlKHRoaXMpKTtcblxuICAgICAgICAvLyBSZW5kZXIgYW5zd2VyXG4gICAgICAgIHRoaXMucmVuZGVyQW5zd2VyKHRoaXMuJChcIi5hbnN3ZXJcIikpO1xuXG4gICAgICAgIHRoaXMuJGVsLnRvZ2dsZSh0aGlzLnNob3VsZEJlVmlzaWJsZSgpKTtcbiAgICAgICAgdGhpcy52aXNpYmxlID0gdGhpcy5zaG91bGRCZVZpc2libGUoKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG59KTtcblxuZXhwb3J0cy5SYWRpb1F1ZXN0aW9uID0gZXhwb3J0cy5RdWVzdGlvbi5leHRlbmQoe1xuICAgIGV2ZW50cyA6IHtcbiAgICAgICAgXCJjaGVja2VkXCIgOiBcImNoZWNrZWRcIixcbiAgICB9LFxuXG4gICAgY2hlY2tlZCA6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgdmFyIGluZGV4ID0gcGFyc2VJbnQoZS50YXJnZXQuZ2V0QXR0cmlidXRlKFwiZGF0YS12YWx1ZVwiKSk7XG4gICAgICAgIHZhciB2YWx1ZSA9IHRoaXMub3B0aW9ucy5vcHRpb25zW2luZGV4XVswXTtcbiAgICAgICAgdGhpcy5tb2RlbC5zZXQodGhpcy5pZCwgdmFsdWUpO1xuICAgIH0sXG5cbiAgICByZW5kZXJBbnN3ZXIgOiBmdW5jdGlvbihhbnN3ZXJFbCkge1xuICAgICAgICBhbnN3ZXJFbC5odG1sKF8udGVtcGxhdGUoJzxkaXYgY2xhc3M9XCJyYWRpby1ncm91cFwiPjwlPXJlbmRlclJhZGlvT3B0aW9ucygpJT48L2Rpdj4nLCB0aGlzKSk7XG4gICAgfSxcblxuICAgIHJlbmRlclJhZGlvT3B0aW9ucyA6IGZ1bmN0aW9uKCkge1xuICAgICAgICBodG1sID0gXCJcIjtcbiAgICAgICAgdmFyIGk7XG4gICAgICAgIGZvciAoIGkgPSAwOyBpIDwgdGhpcy5vcHRpb25zLm9wdGlvbnMubGVuZ3RoOyBpKyspXG4gICAgICAgICAgICBodG1sICs9IF8udGVtcGxhdGUoJzxkaXYgY2xhc3M9XCJyYWRpby1idXR0b24gPCU9Y2hlY2tlZCU+XCIgZGF0YS12YWx1ZT1cIjwlPXBvc2l0aW9uJT5cIj48JT10ZXh0JT48L2Rpdj4nLCB7XG4gICAgICAgICAgICAgICAgcG9zaXRpb24gOiBpLFxuICAgICAgICAgICAgICAgIHRleHQgOiB0aGlzLm9wdGlvbnMub3B0aW9uc1tpXVsxXSxcbiAgICAgICAgICAgICAgICBjaGVja2VkIDogdGhpcy5tb2RlbC5nZXQodGhpcy5pZCkgPT09IHRoaXMub3B0aW9ucy5vcHRpb25zW2ldWzBdID8gXCJjaGVja2VkXCIgOiBcIlwiXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gaHRtbDtcbiAgICB9XG5cbn0pO1xuXG5leHBvcnRzLkNoZWNrUXVlc3Rpb24gPSBleHBvcnRzLlF1ZXN0aW9uLmV4dGVuZCh7XG4gICAgZXZlbnRzIDoge1xuICAgICAgICBcImNoZWNrZWRcIiA6IFwiY2hlY2tlZFwiLFxuICAgIH0sXG5cbiAgICBjaGVja2VkIDogZnVuY3Rpb24oZSkge1xuICAgICAgICAvLyBHZXQgY2hlY2tlZFxuICAgICAgICB0aGlzLm1vZGVsLnNldCh0aGlzLmlkLCB0aGlzLiQoXCIuY2hlY2tib3hcIikuaGFzQ2xhc3MoXCJjaGVja2VkXCIpKTtcbiAgICB9LFxuXG4gICAgcmVuZGVyQW5zd2VyIDogZnVuY3Rpb24oYW5zd2VyRWwpIHtcbiAgICAgICAgdmFyIGk7XG4gICAgICAgIGFuc3dlckVsLmFwcGVuZCgkKF8udGVtcGxhdGUoJzxkaXYgY2xhc3M9XCJjaGVja2JveCA8JT1jaGVja2VkJT5cIj48JT10ZXh0JT48L2Rpdj4nLCB7XG4gICAgICAgICAgICB0ZXh0IDogdGhpcy5vcHRpb25zLnRleHQsXG4gICAgICAgICAgICBjaGVja2VkIDogKHRoaXMubW9kZWwuZ2V0KHRoaXMuaWQpKSA/IFwiY2hlY2tlZFwiIDogXCJcIlxuICAgICAgICB9KSkpO1xuICAgIH1cblxufSk7XG5cblxuZXhwb3J0cy5NdWx0aWNoZWNrUXVlc3Rpb24gPSBleHBvcnRzLlF1ZXN0aW9uLmV4dGVuZCh7XG4gICAgZXZlbnRzIDoge1xuICAgICAgICBcImNoZWNrZWRcIiA6IFwiY2hlY2tlZFwiLFxuICAgIH0sXG5cbiAgICBjaGVja2VkIDogZnVuY3Rpb24oZSkge1xuICAgICAgICAvLyBHZXQgYWxsIGNoZWNrZWRcbiAgICAgICAgdmFyIHZhbHVlID0gW107XG4gICAgICAgIHZhciBvcHRzID0gdGhpcy5vcHRpb25zLm9wdGlvbnM7XG4gICAgICAgIHRoaXMuJChcIi5jaGVja2JveFwiKS5lYWNoKGZ1bmN0aW9uKGluZGV4KSB7XG4gICAgICAgICAgICBpZiAoJCh0aGlzKS5oYXNDbGFzcyhcImNoZWNrZWRcIikpXG4gICAgICAgICAgICAgICAgdmFsdWUucHVzaChvcHRzW2luZGV4XVswXSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLm1vZGVsLnNldCh0aGlzLmlkLCB2YWx1ZSk7XG4gICAgfSxcblxuICAgIHJlbmRlckFuc3dlciA6IGZ1bmN0aW9uKGFuc3dlckVsKSB7XG4gICAgICAgIHZhciBpO1xuICAgICAgICBmb3IgKCBpID0gMDsgaSA8IHRoaXMub3B0aW9ucy5vcHRpb25zLmxlbmd0aDsgaSsrKVxuICAgICAgICAgICAgYW5zd2VyRWwuYXBwZW5kKCQoXy50ZW1wbGF0ZSgnPGRpdiBjbGFzcz1cImNoZWNrYm94IDwlPWNoZWNrZWQlPlwiIGRhdGEtdmFsdWU9XCI8JT1wb3NpdGlvbiU+XCI+PCU9dGV4dCU+PC9kaXY+Jywge1xuICAgICAgICAgICAgICAgIHBvc2l0aW9uIDogaSxcbiAgICAgICAgICAgICAgICB0ZXh0IDogdGhpcy5vcHRpb25zLm9wdGlvbnNbaV1bMV0sXG4gICAgICAgICAgICAgICAgY2hlY2tlZCA6ICh0aGlzLm1vZGVsLmdldCh0aGlzLmlkKSAmJiBfLmNvbnRhaW5zKHRoaXMubW9kZWwuZ2V0KHRoaXMuaWQpLCB0aGlzLm9wdGlvbnMub3B0aW9uc1tpXVswXSkpID8gXCJjaGVja2VkXCIgOiBcIlwiXG4gICAgICAgICAgICB9KSkpO1xuICAgIH1cblxufSk7XG5cbmV4cG9ydHMuVGV4dFF1ZXN0aW9uID0gZXhwb3J0cy5RdWVzdGlvbi5leHRlbmQoe1xuICAgIHJlbmRlckFuc3dlciA6IGZ1bmN0aW9uKGFuc3dlckVsKSB7XG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMubXVsdGlsaW5lKSB7XG4gICAgICAgICAgICBhbnN3ZXJFbC5odG1sKF8udGVtcGxhdGUoJzx0ZXh0YXJlYSBzdHlsZT1cIndpZHRoOjkwJVwiLz4nLCB0aGlzKSk7IC8vIFRPRE8gbWFrZSB3aWR0aCBwcm9wZXJseVxuICAgICAgICAgICAgYW5zd2VyRWwuZmluZChcInRleHRhcmVhXCIpLnZhbCh0aGlzLm1vZGVsLmdldCh0aGlzLmlkKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhbnN3ZXJFbC5odG1sKF8udGVtcGxhdGUoJzxpbnB1dCB0eXBlPVwidGV4dFwiLz4nLCB0aGlzKSk7XG4gICAgICAgICAgICBhbnN3ZXJFbC5maW5kKFwiaW5wdXRcIikudmFsKHRoaXMubW9kZWwuZ2V0KHRoaXMuaWQpKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBldmVudHMgOiB7XG4gICAgICAgIFwiY2hhbmdlXCIgOiBcImNoYW5nZWRcIlxuICAgIH0sXG4gICAgY2hhbmdlZCA6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLm1vZGVsLnNldCh0aGlzLmlkLCB0aGlzLiQodGhpcy5vcHRpb25zLm11bHRpbGluZSA/IFwidGV4dGFyZWFcIiA6IFwiaW5wdXRcIikudmFsKCkpO1xuICAgIH1cblxufSk7XG4iLCIjIEdyb3VwIG9mIHF1ZXN0aW9ucyB3aGljaCB2YWxpZGF0ZSBhcyBhIHVuaXRcblxubW9kdWxlLmV4cG9ydHMgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZFxuICBpbml0aWFsaXplOiAtPlxuICAgIEBjb250ZW50cyA9IEBvcHRpb25zLmNvbnRlbnRzXG4gICAgQHJlbmRlcigpXG5cbiAgdmFsaWRhdGU6IC0+XG4gICAgIyBHZXQgYWxsIHZpc2libGUgaXRlbXNcbiAgICBpdGVtcyA9IF8uZmlsdGVyKEBjb250ZW50cywgKGMpIC0+XG4gICAgICBjLnZpc2libGUgYW5kIGMudmFsaWRhdGVcbiAgICApXG4gICAgcmV0dXJuIG5vdCBfLmFueShfLm1hcChpdGVtcywgKGl0ZW0pIC0+XG4gICAgICBpdGVtLnZhbGlkYXRlKClcbiAgICApKVxuXG4gIHJlbmRlcjogLT5cbiAgICBAJGVsLmh0bWwgXCJcIlxuICAgIFxuICAgICMgQWRkIGNvbnRlbnRzIChxdWVzdGlvbnMsIG1vc3RseSlcbiAgICBfLmVhY2ggQGNvbnRlbnRzLCAoYykgPT4gQCRlbC5hcHBlbmQgYy4kZWxcblxuICAgIHRoaXNcbiIsIiMgRm9ybSB0aGF0IGhhcyBzYXZlIGFuZCBjYW5jZWwgYnV0dG9ucyB0aGF0IGZpcmUgc2F2ZSBhbmQgY2FuY2VsIGV2ZW50cy5cbiMgU2F2ZSBldmVudCB3aWxsIG9ubHkgYmUgZmlyZWQgaWYgdmFsaWRhdGVzXG5cbm1vZHVsZS5leHBvcnRzID0gQmFja2JvbmUuVmlldy5leHRlbmRcbiAgaW5pdGlhbGl6ZTogLT5cbiAgICBAY29udGVudHMgPSBAb3B0aW9ucy5jb250ZW50c1xuICAgIEByZW5kZXIoKVxuXG4gIGV2ZW50czogXG4gICAgJ2NsaWNrICNzYXZlX2J1dHRvbic6ICdzYXZlJ1xuICAgICdjbGljayAjY2FuY2VsX2J1dHRvbic6ICdjYW5jZWwnXG5cbiAgdmFsaWRhdGU6IC0+XG4gICAgIyBHZXQgYWxsIHZpc2libGUgaXRlbXNcbiAgICBpdGVtcyA9IF8uZmlsdGVyKEBjb250ZW50cywgKGMpIC0+XG4gICAgICBjLnZpc2libGUgYW5kIGMudmFsaWRhdGVcbiAgICApXG4gICAgcmV0dXJuIG5vdCBfLmFueShfLm1hcChpdGVtcywgKGl0ZW0pIC0+XG4gICAgICBpdGVtLnZhbGlkYXRlKClcbiAgICApKVxuXG4gIHJlbmRlcjogLT5cbiAgICBAJGVsLmh0bWwgJycnPGRpdiBpZD1cImNvbnRlbnRzXCI+PC9kaXY+XG4gICAgPGRpdj5cbiAgICAgICAgPGJ1dHRvbiBpZD1cInNhdmVfYnV0dG9uXCIgdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwiYnRuIGJ0bi1wcmltYXJ5IG1hcmdpbmVkXCI+U2F2ZTwvYnV0dG9uPlxuICAgICAgICAmbmJzcDtcbiAgICAgICAgPGJ1dHRvbiBpZD1cImNhbmNlbF9idXR0b25cIiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJidG4gbWFyZ2luZWRcIj5DYW5jZWw8L2J1dHRvbj5cbiAgICA8L2Rpdj4nJydcbiAgICBcbiAgICAjIEFkZCBjb250ZW50cyAocXVlc3Rpb25zLCBtb3N0bHkpXG4gICAgXy5lYWNoIEBjb250ZW50cywgKGMpID0+IEAkKCcjY29udGVudHMnKS5hcHBlbmQgYy4kZWxcbiAgICB0aGlzXG5cbiAgc2F2ZTogLT5cbiAgICBpZiBAdmFsaWRhdGUoKVxuICAgICAgQHRyaWdnZXIgJ3NhdmUnXG5cbiAgY2FuY2VsOiAtPlxuICAgIEB0cmlnZ2VyICdjYW5jZWwnXG4iLCJtb2R1bGUuZXhwb3J0cyA9IEJhY2tib25lLlZpZXcuZXh0ZW5kXG4gIGluaXRpYWxpemU6IC0+XG4gICAgQCRlbC5odG1sIF8udGVtcGxhdGUoJycnXG4gICAgICA8ZGl2IGNsYXNzPVwid2VsbCB3ZWxsLXNtYWxsXCI+PCU9aHRtbCU+PCUtdGV4dCU+PC9kaXY+XG4gICAgICAnJycpKGh0bWw6IEBvcHRpb25zLmh0bWwsIHRleHQ6IEBvcHRpb25zLnRleHQpXG4iLCIjIFRPRE8gRml4IHRvIGhhdmUgZWRpdGFibGUgWVlZWS1NTS1ERCB3aXRoIGNsaWNrIHRvIHBvcHVwIHNjcm9sbGVyXG5cblF1ZXN0aW9uID0gcmVxdWlyZSgnLi9mb3JtLWNvbnRyb2xzJykuUXVlc3Rpb25cblxubW9kdWxlLmV4cG9ydHMgPSBRdWVzdGlvbi5leHRlbmQoXG4gIGV2ZW50czpcbiAgICBjaGFuZ2U6IFwiY2hhbmdlZFwiXG5cbiAgY2hhbmdlZDogLT5cbiAgICBAbW9kZWwuc2V0IEBpZCwgQCRlbC5maW5kKFwiaW5wdXRbbmFtZT1cXFwiZGF0ZVxcXCJdXCIpLnZhbCgpXG5cbiAgcmVuZGVyQW5zd2VyOiAoYW5zd2VyRWwpIC0+XG4gICAgYW5zd2VyRWwuaHRtbCBfLnRlbXBsYXRlKFwiPGlucHV0IGNsYXNzPVxcXCJuZWVkc2NsaWNrXFxcIiBuYW1lPVxcXCJkYXRlXFxcIiAvPlwiLCB0aGlzKVxuICAgIGFuc3dlckVsLmZpbmQoXCJpbnB1dFwiKS52YWwgQG1vZGVsLmdldChAaWQpXG4gICAgYW5zd2VyRWwuZmluZChcImlucHV0XCIpLnNjcm9sbGVyXG4gICAgICBwcmVzZXQ6IFwiZGF0ZVwiXG4gICAgICB0aGVtZTogXCJpb3NcIlxuICAgICAgZGlzcGxheTogXCJtb2RhbFwiXG4gICAgICBtb2RlOiBcInNjcm9sbGVyXCJcbiAgICAgIGRhdGVPcmRlcjogXCJ5eW1tRCBkZFwiXG4gICAgICBkYXRlRm9ybWF0OiBcInl5LW1tLWRkXCJcblxuKSIsIlF1ZXN0aW9uID0gcmVxdWlyZSgnLi9mb3JtLWNvbnRyb2xzJykuUXVlc3Rpb25cblxubW9kdWxlLmV4cG9ydHMgPSBRdWVzdGlvbi5leHRlbmRcbiAgcmVuZGVyQW5zd2VyOiAoYW5zd2VyRWwpIC0+XG4gICAgYW5zd2VyRWwuaHRtbCBfLnRlbXBsYXRlKFwiPGlucHV0IHR5cGU9XFxcIm51bWJlclxcXCIgPCUgaWYgKG9wdGlvbnMuZGVjaW1hbCkgeyU+c3RlcD1cXFwiYW55XFxcIjwlfSU+IC8+XCIsIHRoaXMpXG4gICAgYW5zd2VyRWwuZmluZChcImlucHV0XCIpLnZhbCBAbW9kZWwuZ2V0KEBpZClcblxuICBldmVudHM6XG4gICAgY2hhbmdlOiBcImNoYW5nZWRcIlxuXG4gIHZhbGlkYXRlSW50ZXJuYWw6IC0+XG4gICAgdmFsID0gQCQoXCJpbnB1dFwiKS52YWwoKVxuICAgIGlmIEBvcHRpb25zLmRlY2ltYWwgYW5kIHZhbC5sZW5ndGggPiAwXG4gICAgICBpZiBwYXJzZUZsb2F0KHZhbCkgPT0gTmFOXG4gICAgICAgIHJldHVybiBcIkludmFsaWQgZGVjaW1hbCBudW1iZXJcIlxuICAgIGVsc2UgaWYgdmFsLmxlbmd0aCA+IDBcbiAgICAgIGlmIG5vdCB2YWwubWF0Y2goL14tP1xcZCskLylcbiAgICAgICAgcmV0dXJuIFwiSW52YWxpZCBpbnRlZ2VyIG51bWJlclwiXG4gICAgcmV0dXJuIG51bGxcblxuICBjaGFuZ2VkOiAtPlxuICAgIHZhbCA9IHBhcnNlRmxvYXQoQCQoXCJpbnB1dFwiKS52YWwoKSlcbiAgICBpZiB2YWwgPT0gTmFOXG4gICAgICB2YWwgPSBudWxsXG4gICAgQG1vZGVsLnNldCBAaWQsIHZhbCBcbiIsIlF1ZXN0aW9uID0gcmVxdWlyZSgnLi9mb3JtLWNvbnRyb2xzJykuUXVlc3Rpb25cblxubW9kdWxlLmV4cG9ydHMgPSBRdWVzdGlvbi5leHRlbmRcbiAgZXZlbnRzOlxuICAgIFwiY2xpY2sgI2NhbWVyYVwiOiBcImNhbWVyYUNsaWNrXCJcblxuICByZW5kZXJBbnN3ZXI6IChhbnN3ZXJFbCkgLT5cbiAgICBhbnN3ZXJFbC5odG1sICcnJ1xuICAgICAgPGltZyBzcmM9XCJpbWcvY2FtZXJhLWljb24uanBnXCIgaWQ9XCJjYW1lcmFcIiBjbGFzcz1cImltZy1yb3VuZGVkXCIgc3R5bGU9XCJtYXgtaGVpZ2h0OiAxMDBweFwiLz5cbiAgICAnJydcblxuICBjYW1lcmFDbGljazogLT5cbiAgICBhbGVydChcIk9uIEFuZHJvaWQgQXBwLCB3b3VsZCBsYXVuY2ggQ2FtZXJhK1Bob3RvIFZpZXdlclwiKVxuIiwiUXVlc3Rpb24gPSByZXF1aXJlKCcuL2Zvcm0tY29udHJvbHMnKS5RdWVzdGlvblxuXG5tb2R1bGUuZXhwb3J0cyA9IFF1ZXN0aW9uLmV4dGVuZFxuICBldmVudHM6XG4gICAgXCJjbGljayAjY2FtZXJhXCI6IFwiY2FtZXJhQ2xpY2tcIlxuXG4gIHJlbmRlckFuc3dlcjogKGFuc3dlckVsKSAtPlxuICAgIGFuc3dlckVsLmh0bWwgJycnXG4gICAgICA8aW1nIHNyYz1cImltZy9jYW1lcmEtaWNvbi5qcGdcIiBpZD1cImNhbWVyYVwiIGNsYXNzPVwiaW1nLXJvdW5kZWRcIiBzdHlsZT1cIm1heC1oZWlnaHQ6IDEwMHB4XCIvPlxuICAgICcnJ1xuXG4gIGNhbWVyYUNsaWNrOiAtPlxuICAgIGFsZXJ0KFwiT24gQW5kcm9pZCBBcHAsIHdvdWxkIGxhdW5jaCBDYW1lcmErUGhvdG8gVmlld2VyXCIpXG4iLCJRdWVzdGlvbiA9IHJlcXVpcmUoJy4vZm9ybS1jb250cm9scycpLlF1ZXN0aW9uXG5cbm1vZHVsZS5leHBvcnRzID0gUXVlc3Rpb24uZXh0ZW5kKFxuICBldmVudHM6XG4gICAgY2hhbmdlOiBcImNoYW5nZWRcIlxuXG4gIHNldE9wdGlvbnM6IChvcHRpb25zKSAtPlxuICAgIEBvcHRpb25zLm9wdGlvbnMgPSBvcHRpb25zXG4gICAgQHJlbmRlcigpXG5cbiAgY2hhbmdlZDogKGUpIC0+XG4gICAgdmFsID0gJChlLnRhcmdldCkudmFsKClcbiAgICBpZiB2YWwgaXMgXCJcIlxuICAgICAgQG1vZGVsLnNldCBAaWQsIG51bGxcbiAgICBlbHNlXG4gICAgICBpbmRleCA9IHBhcnNlSW50KHZhbClcbiAgICAgIHZhbHVlID0gQG9wdGlvbnMub3B0aW9uc1tpbmRleF1bMF1cbiAgICAgIEBtb2RlbC5zZXQgQGlkLCB2YWx1ZVxuXG4gIHJlbmRlckFuc3dlcjogKGFuc3dlckVsKSAtPlxuICAgIGFuc3dlckVsLmh0bWwgXy50ZW1wbGF0ZShcIjxzZWxlY3QgaWQ9XFxcInNvdXJjZV90eXBlXFxcIj48JT1yZW5kZXJEcm9wZG93bk9wdGlvbnMoKSU+PC9zZWxlY3Q+XCIsIHRoaXMpXG4gICAgIyBDaGVjayBpZiBhbnN3ZXIgcHJlc2VudCBcbiAgICBpZiBub3QgXy5hbnkoQG9wdGlvbnMub3B0aW9ucywgKG9wdCkgPT4gb3B0WzBdID09IEBtb2RlbC5nZXQoQGlkKSkgYW5kIEBtb2RlbC5nZXQoQGlkKT9cbiAgICAgIEAkKFwic2VsZWN0XCIpLmF0dHIoJ2Rpc2FibGVkJywgJ2Rpc2FibGVkJylcblxuICByZW5kZXJEcm9wZG93bk9wdGlvbnM6IC0+XG4gICAgaHRtbCA9IFwiXCJcbiAgICBcbiAgICAjIEFkZCBlbXB0eSBvcHRpb25cbiAgICBodG1sICs9IFwiPG9wdGlvbiB2YWx1ZT1cXFwiXFxcIj48L29wdGlvbj5cIlxuICAgIGZvciBpIGluIFswLi4uQG9wdGlvbnMub3B0aW9ucy5sZW5ndGhdXG4gICAgICBodG1sICs9IF8udGVtcGxhdGUoXCI8b3B0aW9uIHZhbHVlPVxcXCI8JT1wb3NpdGlvbiU+XFxcIiA8JT1zZWxlY3RlZCU+PjwlLXRleHQlPjwvb3B0aW9uPlwiLFxuICAgICAgICBwb3NpdGlvbjogaVxuICAgICAgICB0ZXh0OiBAb3B0aW9ucy5vcHRpb25zW2ldWzFdXG4gICAgICAgIHNlbGVjdGVkOiAoaWYgQG1vZGVsLmdldChAaWQpIGlzIEBvcHRpb25zLm9wdGlvbnNbaV1bMF0gdGhlbiBcInNlbGVjdGVkPVxcXCJzZWxlY3RlZFxcXCJcIiBlbHNlIFwiXCIpXG4gICAgICApXG4gICAgcmV0dXJuIGh0bWxcbikiLCJRdWVzdGlvbiA9IHJlcXVpcmUoJy4vZm9ybS1jb250cm9scycpLlF1ZXN0aW9uXG5Tb3VyY2VMaXN0UGFnZSA9IHJlcXVpcmUgJy4uL3BhZ2VzL1NvdXJjZUxpc3RQYWdlJ1xuXG5tb2R1bGUuZXhwb3J0cyA9IFF1ZXN0aW9uLmV4dGVuZFxuICByZW5kZXJBbnN3ZXI6IChhbnN3ZXJFbCkgLT5cbiAgICBhbnN3ZXJFbC5odG1sICcnJ1xuICAgICAgPGRpdiBjbGFzcz1cImlucHV0LWFwcGVuZFwiPlxuICAgICAgICA8aW5wdXQgdHlwZT1cInRlbFwiPlxuICAgICAgICA8YnV0dG9uIGNsYXNzPVwiYnRuXCIgaWQ9XCJzZWxlY3RcIiB0eXBlPVwiYnV0dG9uXCI+U2VsZWN0PC9idXR0b24+XG4gICAgICA8L2Rpdj4nJydcbiAgICBhbnN3ZXJFbC5maW5kKFwiaW5wdXRcIikudmFsIEBtb2RlbC5nZXQoQGlkKVxuXG4gIGV2ZW50czpcbiAgICAnY2hhbmdlJyA6ICdjaGFuZ2VkJ1xuICAgICdjbGljayAjc2VsZWN0JyA6ICdzZWxlY3RTb3VyY2UnXG5cbiAgY2hhbmdlZDogLT5cbiAgICBAbW9kZWwuc2V0IEBpZCwgQCQoXCJpbnB1dFwiKS52YWwoKVxuXG4gIHNlbGVjdFNvdXJjZTogLT5cbiAgICBAb3B0aW9ucy5jdHgucGFnZXIub3BlblBhZ2UgU291cmNlTGlzdFBhZ2UsIFxuICAgICAgeyBvblNlbGVjdDogKHNvdXJjZSk9PlxuICAgICAgICBAbW9kZWwuc2V0IEBpZCwgc291cmNlLmNvZGVcbiAgICAgIH0iLCIjIEltcHJvdmVkIGxvY2F0aW9uIGZpbmRlclxuY2xhc3MgTG9jYXRpb25GaW5kZXJcbiAgY29uc3RydWN0b3I6IC0+XG4gICAgXy5leHRlbmQgQCwgQmFja2JvbmUuRXZlbnRzXG4gICAgXG4gIGdldExvY2F0aW9uOiAtPlxuICAgICMgQm90aCBmYWlsdXJlcyBhcmUgcmVxdWlyZWQgdG8gdHJpZ2dlciBlcnJvclxuICAgIGxvY2F0aW9uRXJyb3IgPSBfLmFmdGVyIDIsID0+XG4gICAgICBAdHJpZ2dlciAnZXJyb3InXG5cbiAgICBoaWdoQWNjdXJhY3lGaXJlZCA9IGZhbHNlXG5cbiAgICBsb3dBY2N1cmFjeSA9IChwb3MpID0+XG4gICAgICBpZiBub3QgaGlnaEFjY3VyYWN5RmlyZWRcbiAgICAgICAgQHRyaWdnZXIgJ2ZvdW5kJywgcG9zXG5cbiAgICBoaWdoQWNjdXJhY3kgPSAocG9zKSA9PlxuICAgICAgaGlnaEFjY3VyYWN5RmlyZWQgPSB0cnVlXG4gICAgICBAdHJpZ2dlciAnZm91bmQnLCBwb3NcblxuICAgICMgR2V0IGJvdGggaGlnaCBhbmQgbG93IGFjY3VyYWN5LCBhcyBsb3cgaXMgc3VmZmljaWVudCBmb3IgaW5pdGlhbCBkaXNwbGF5XG4gICAgbmF2aWdhdG9yLmdlb2xvY2F0aW9uLmdldEN1cnJlbnRQb3NpdGlvbihsb3dBY2N1cmFjeSwgbG9jYXRpb25FcnJvciwge1xuICAgICAgICBtYXhpbXVtQWdlIDogMzYwMCoyNCxcbiAgICAgICAgdGltZW91dCA6IDEwMDAwLFxuICAgICAgICBlbmFibGVIaWdoQWNjdXJhY3kgOiBmYWxzZVxuICAgIH0pXG5cbiAgICBuYXZpZ2F0b3IuZ2VvbG9jYXRpb24uZ2V0Q3VycmVudFBvc2l0aW9uKGhpZ2hBY2N1cmFjeSwgbG9jYXRpb25FcnJvciwge1xuICAgICAgICBtYXhpbXVtQWdlIDogMzYwMCxcbiAgICAgICAgdGltZW91dCA6IDMwMDAwLFxuICAgICAgICBlbmFibGVIaWdoQWNjdXJhY3kgOiB0cnVlXG4gICAgfSlcblxuICBzdGFydFdhdGNoOiAtPlxuICAgICMgQWxsb3cgb25lIHdhdGNoIGF0IG1vc3RcbiAgICBpZiBAbG9jYXRpb25XYXRjaElkP1xuICAgICAgQHN0b3BXYXRjaCgpXG5cbiAgICBoaWdoQWNjdXJhY3lGaXJlZCA9IGZhbHNlXG4gICAgbG93QWNjdXJhY3lGaXJlZCA9IGZhbHNlXG5cbiAgICBsb3dBY2N1cmFjeSA9IChwb3MpID0+XG4gICAgICBpZiBub3QgaGlnaEFjY3VyYWN5RmlyZWRcbiAgICAgICAgbG93QWNjdXJhY3lGaXJlZCA9IHRydWVcbiAgICAgICAgQHRyaWdnZXIgJ2ZvdW5kJywgcG9zXG5cbiAgICBoaWdoQWNjdXJhY3kgPSAocG9zKSA9PlxuICAgICAgaGlnaEFjY3VyYWN5RmlyZWQgPSB0cnVlXG4gICAgICBAdHJpZ2dlciAnZm91bmQnLCBwb3NcblxuICAgIGVycm9yID0gKGVycm9yKSA9PlxuICAgICAgY29uc29sZS5sb2cgXCIjIyMgZXJyb3IgXCJcbiAgICAgICMgTm8gZXJyb3IgaWYgZmlyZWQgb25jZVxuICAgICAgaWYgbm90IGxvd0FjY3VyYWN5RmlyZWQgYW5kIG5vdCBoaWdoQWNjdXJhY3lGaXJlZFxuICAgICAgICBAdHJpZ2dlciAnZXJyb3InLCBlcnJvclxuXG4gICAgIyBGaXJlIGluaXRpYWwgbG93LWFjY3VyYWN5IG9uZVxuICAgIG5hdmlnYXRvci5nZW9sb2NhdGlvbi5nZXRDdXJyZW50UG9zaXRpb24obG93QWNjdXJhY3ksIGVycm9yLCB7XG4gICAgICAgIG1heGltdW1BZ2UgOiAzNjAwKjI0LFxuICAgICAgICB0aW1lb3V0IDogMTAwMDAsXG4gICAgICAgIGVuYWJsZUhpZ2hBY2N1cmFjeSA6IGZhbHNlXG4gICAgfSlcblxuICAgIEBsb2NhdGlvbldhdGNoSWQgPSBuYXZpZ2F0b3IuZ2VvbG9jYXRpb24ud2F0Y2hQb3NpdGlvbihoaWdoQWNjdXJhY3ksIGVycm9yLCB7XG4gICAgICAgIG1heGltdW1BZ2UgOiAzMDAwLFxuICAgICAgICBlbmFibGVIaWdoQWNjdXJhY3kgOiB0cnVlXG4gICAgfSkgIFxuXG4gIHN0b3BXYXRjaDogLT5cbiAgICBpZiBAbG9jYXRpb25XYXRjaElkP1xuICAgICAgbmF2aWdhdG9yLmdlb2xvY2F0aW9uLmNsZWFyV2F0Y2goQGxvY2F0aW9uV2F0Y2hJZClcbiAgICAgIEBsb2NhdGlvbldhdGNoSWQgPSB1bmRlZmluZWRcblxuXG5tb2R1bGUuZXhwb3J0cyA9IExvY2F0aW9uRmluZGVyICAiLCIvLyBUT0RPIGFkZCBsaWNlbnNlXG5cbkxvY2FsQ29sbGVjdGlvbiA9IHt9O1xuRUpTT04gPSByZXF1aXJlKFwiLi9FSlNPTlwiKTtcblxuLy8gTGlrZSBfLmlzQXJyYXksIGJ1dCBkb2Vzbid0IHJlZ2FyZCBwb2x5ZmlsbGVkIFVpbnQ4QXJyYXlzIG9uIG9sZCBicm93c2VycyBhc1xuLy8gYXJyYXlzLlxudmFyIGlzQXJyYXkgPSBmdW5jdGlvbiAoeCkge1xuICByZXR1cm4gXy5pc0FycmF5KHgpICYmICFFSlNPTi5pc0JpbmFyeSh4KTtcbn07XG5cbnZhciBfYW55SWZBcnJheSA9IGZ1bmN0aW9uICh4LCBmKSB7XG4gIGlmIChpc0FycmF5KHgpKVxuICAgIHJldHVybiBfLmFueSh4LCBmKTtcbiAgcmV0dXJuIGYoeCk7XG59O1xuXG52YXIgX2FueUlmQXJyYXlQbHVzID0gZnVuY3Rpb24gKHgsIGYpIHtcbiAgaWYgKGYoeCkpXG4gICAgcmV0dXJuIHRydWU7XG4gIHJldHVybiBpc0FycmF5KHgpICYmIF8uYW55KHgsIGYpO1xufTtcblxudmFyIGhhc09wZXJhdG9ycyA9IGZ1bmN0aW9uKHZhbHVlU2VsZWN0b3IpIHtcbiAgdmFyIHRoZXNlQXJlT3BlcmF0b3JzID0gdW5kZWZpbmVkO1xuICBmb3IgKHZhciBzZWxLZXkgaW4gdmFsdWVTZWxlY3Rvcikge1xuICAgIHZhciB0aGlzSXNPcGVyYXRvciA9IHNlbEtleS5zdWJzdHIoMCwgMSkgPT09ICckJztcbiAgICBpZiAodGhlc2VBcmVPcGVyYXRvcnMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhlc2VBcmVPcGVyYXRvcnMgPSB0aGlzSXNPcGVyYXRvcjtcbiAgICB9IGVsc2UgaWYgKHRoZXNlQXJlT3BlcmF0b3JzICE9PSB0aGlzSXNPcGVyYXRvcikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSW5jb25zaXN0ZW50IHNlbGVjdG9yOiBcIiArIHZhbHVlU2VsZWN0b3IpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gISF0aGVzZUFyZU9wZXJhdG9yczsgIC8vIHt9IGhhcyBubyBvcGVyYXRvcnNcbn07XG5cbnZhciBjb21waWxlVmFsdWVTZWxlY3RvciA9IGZ1bmN0aW9uICh2YWx1ZVNlbGVjdG9yKSB7XG4gIGlmICh2YWx1ZVNlbGVjdG9yID09IG51bGwpIHsgIC8vIHVuZGVmaW5lZCBvciBudWxsXG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgcmV0dXJuIF9hbnlJZkFycmF5KHZhbHVlLCBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4geCA9PSBudWxsOyAgLy8gdW5kZWZpbmVkIG9yIG51bGxcbiAgICAgIH0pO1xuICAgIH07XG4gIH1cblxuICAvLyBTZWxlY3RvciBpcyBhIG5vbi1udWxsIHByaW1pdGl2ZSAoYW5kIG5vdCBhbiBhcnJheSBvciBSZWdFeHAgZWl0aGVyKS5cbiAgaWYgKCFfLmlzT2JqZWN0KHZhbHVlU2VsZWN0b3IpKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgcmV0dXJuIF9hbnlJZkFycmF5KHZhbHVlLCBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4geCA9PT0gdmFsdWVTZWxlY3RvcjtcbiAgICAgIH0pO1xuICAgIH07XG4gIH1cblxuICBpZiAodmFsdWVTZWxlY3RvciBpbnN0YW5jZW9mIFJlZ0V4cCkge1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICByZXR1cm4gX2FueUlmQXJyYXkodmFsdWUsIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiB2YWx1ZVNlbGVjdG9yLnRlc3QoeCk7XG4gICAgICB9KTtcbiAgICB9O1xuICB9XG5cbiAgLy8gQXJyYXlzIG1hdGNoIGVpdGhlciBpZGVudGljYWwgYXJyYXlzIG9yIGFycmF5cyB0aGF0IGNvbnRhaW4gaXQgYXMgYSB2YWx1ZS5cbiAgaWYgKGlzQXJyYXkodmFsdWVTZWxlY3RvcikpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICBpZiAoIWlzQXJyYXkodmFsdWUpKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICByZXR1cm4gX2FueUlmQXJyYXlQbHVzKHZhbHVlLCBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4gTG9jYWxDb2xsZWN0aW9uLl9mLl9lcXVhbCh2YWx1ZVNlbGVjdG9yLCB4KTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH1cblxuICAvLyBJdCdzIGFuIG9iamVjdCwgYnV0IG5vdCBhbiBhcnJheSBvciByZWdleHAuXG4gIGlmIChoYXNPcGVyYXRvcnModmFsdWVTZWxlY3RvcikpIHtcbiAgICB2YXIgb3BlcmF0b3JGdW5jdGlvbnMgPSBbXTtcbiAgICBfLmVhY2godmFsdWVTZWxlY3RvciwgZnVuY3Rpb24gKG9wZXJhbmQsIG9wZXJhdG9yKSB7XG4gICAgICBpZiAoIV8uaGFzKFZBTFVFX09QRVJBVE9SUywgb3BlcmF0b3IpKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJVbnJlY29nbml6ZWQgb3BlcmF0b3I6IFwiICsgb3BlcmF0b3IpO1xuICAgICAgb3BlcmF0b3JGdW5jdGlvbnMucHVzaChWQUxVRV9PUEVSQVRPUlNbb3BlcmF0b3JdKFxuICAgICAgICBvcGVyYW5kLCB2YWx1ZVNlbGVjdG9yLiRvcHRpb25zKSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgcmV0dXJuIF8uYWxsKG9wZXJhdG9yRnVuY3Rpb25zLCBmdW5jdGlvbiAoZikge1xuICAgICAgICByZXR1cm4gZih2YWx1ZSk7XG4gICAgICB9KTtcbiAgICB9O1xuICB9XG5cbiAgLy8gSXQncyBhIGxpdGVyYWw7IGNvbXBhcmUgdmFsdWUgKG9yIGVsZW1lbnQgb2YgdmFsdWUgYXJyYXkpIGRpcmVjdGx5IHRvIHRoZVxuICAvLyBzZWxlY3Rvci5cbiAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIHJldHVybiBfYW55SWZBcnJheSh2YWx1ZSwgZnVuY3Rpb24gKHgpIHtcbiAgICAgIHJldHVybiBMb2NhbENvbGxlY3Rpb24uX2YuX2VxdWFsKHZhbHVlU2VsZWN0b3IsIHgpO1xuICAgIH0pO1xuICB9O1xufTtcblxuLy8gWFhYIGNhbiBmYWN0b3Igb3V0IGNvbW1vbiBsb2dpYyBiZWxvd1xudmFyIExPR0lDQUxfT1BFUkFUT1JTID0ge1xuICBcIiRhbmRcIjogZnVuY3Rpb24oc3ViU2VsZWN0b3IpIHtcbiAgICBpZiAoIWlzQXJyYXkoc3ViU2VsZWN0b3IpIHx8IF8uaXNFbXB0eShzdWJTZWxlY3RvcikpXG4gICAgICB0aHJvdyBFcnJvcihcIiRhbmQvJG9yLyRub3IgbXVzdCBiZSBub25lbXB0eSBhcnJheVwiKTtcbiAgICB2YXIgc3ViU2VsZWN0b3JGdW5jdGlvbnMgPSBfLm1hcChcbiAgICAgIHN1YlNlbGVjdG9yLCBjb21waWxlRG9jdW1lbnRTZWxlY3Rvcik7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChkb2MpIHtcbiAgICAgIHJldHVybiBfLmFsbChzdWJTZWxlY3RvckZ1bmN0aW9ucywgZnVuY3Rpb24gKGYpIHtcbiAgICAgICAgcmV0dXJuIGYoZG9jKTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0sXG5cbiAgXCIkb3JcIjogZnVuY3Rpb24oc3ViU2VsZWN0b3IpIHtcbiAgICBpZiAoIWlzQXJyYXkoc3ViU2VsZWN0b3IpIHx8IF8uaXNFbXB0eShzdWJTZWxlY3RvcikpXG4gICAgICB0aHJvdyBFcnJvcihcIiRhbmQvJG9yLyRub3IgbXVzdCBiZSBub25lbXB0eSBhcnJheVwiKTtcbiAgICB2YXIgc3ViU2VsZWN0b3JGdW5jdGlvbnMgPSBfLm1hcChcbiAgICAgIHN1YlNlbGVjdG9yLCBjb21waWxlRG9jdW1lbnRTZWxlY3Rvcik7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChkb2MpIHtcbiAgICAgIHJldHVybiBfLmFueShzdWJTZWxlY3RvckZ1bmN0aW9ucywgZnVuY3Rpb24gKGYpIHtcbiAgICAgICAgcmV0dXJuIGYoZG9jKTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0sXG5cbiAgXCIkbm9yXCI6IGZ1bmN0aW9uKHN1YlNlbGVjdG9yKSB7XG4gICAgaWYgKCFpc0FycmF5KHN1YlNlbGVjdG9yKSB8fCBfLmlzRW1wdHkoc3ViU2VsZWN0b3IpKVxuICAgICAgdGhyb3cgRXJyb3IoXCIkYW5kLyRvci8kbm9yIG11c3QgYmUgbm9uZW1wdHkgYXJyYXlcIik7XG4gICAgdmFyIHN1YlNlbGVjdG9yRnVuY3Rpb25zID0gXy5tYXAoXG4gICAgICBzdWJTZWxlY3RvciwgY29tcGlsZURvY3VtZW50U2VsZWN0b3IpO1xuICAgIHJldHVybiBmdW5jdGlvbiAoZG9jKSB7XG4gICAgICByZXR1cm4gXy5hbGwoc3ViU2VsZWN0b3JGdW5jdGlvbnMsIGZ1bmN0aW9uIChmKSB7XG4gICAgICAgIHJldHVybiAhZihkb2MpO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSxcblxuICBcIiR3aGVyZVwiOiBmdW5jdGlvbihzZWxlY3RvclZhbHVlKSB7XG4gICAgaWYgKCEoc2VsZWN0b3JWYWx1ZSBpbnN0YW5jZW9mIEZ1bmN0aW9uKSkge1xuICAgICAgc2VsZWN0b3JWYWx1ZSA9IEZ1bmN0aW9uKFwicmV0dXJuIFwiICsgc2VsZWN0b3JWYWx1ZSk7XG4gICAgfVxuICAgIHJldHVybiBmdW5jdGlvbiAoZG9jKSB7XG4gICAgICByZXR1cm4gc2VsZWN0b3JWYWx1ZS5jYWxsKGRvYyk7XG4gICAgfTtcbiAgfVxufTtcblxudmFyIFZBTFVFX09QRVJBVE9SUyA9IHtcbiAgXCIkaW5cIjogZnVuY3Rpb24gKG9wZXJhbmQpIHtcbiAgICBpZiAoIWlzQXJyYXkob3BlcmFuZCkpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJBcmd1bWVudCB0byAkaW4gbXVzdCBiZSBhcnJheVwiKTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICByZXR1cm4gX2FueUlmQXJyYXlQbHVzKHZhbHVlLCBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4gXy5hbnkob3BlcmFuZCwgZnVuY3Rpb24gKG9wZXJhbmRFbHQpIHtcbiAgICAgICAgICByZXR1cm4gTG9jYWxDb2xsZWN0aW9uLl9mLl9lcXVhbChvcGVyYW5kRWx0LCB4KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9O1xuICB9LFxuXG4gIFwiJGFsbFwiOiBmdW5jdGlvbiAob3BlcmFuZCkge1xuICAgIGlmICghaXNBcnJheShvcGVyYW5kKSlcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkFyZ3VtZW50IHRvICRhbGwgbXVzdCBiZSBhcnJheVwiKTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICBpZiAoIWlzQXJyYXkodmFsdWUpKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICByZXR1cm4gXy5hbGwob3BlcmFuZCwgZnVuY3Rpb24gKG9wZXJhbmRFbHQpIHtcbiAgICAgICAgcmV0dXJuIF8uYW55KHZhbHVlLCBmdW5jdGlvbiAodmFsdWVFbHQpIHtcbiAgICAgICAgICByZXR1cm4gTG9jYWxDb2xsZWN0aW9uLl9mLl9lcXVhbChvcGVyYW5kRWx0LCB2YWx1ZUVsdCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSxcblxuICBcIiRsdFwiOiBmdW5jdGlvbiAob3BlcmFuZCkge1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJldHVybiBfYW55SWZBcnJheSh2YWx1ZSwgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIExvY2FsQ29sbGVjdGlvbi5fZi5fY21wKHgsIG9wZXJhbmQpIDwgMDtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0sXG5cbiAgXCIkbHRlXCI6IGZ1bmN0aW9uIChvcGVyYW5kKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgcmV0dXJuIF9hbnlJZkFycmF5KHZhbHVlLCBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4gTG9jYWxDb2xsZWN0aW9uLl9mLl9jbXAoeCwgb3BlcmFuZCkgPD0gMDtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0sXG5cbiAgXCIkZ3RcIjogZnVuY3Rpb24gKG9wZXJhbmQpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICByZXR1cm4gX2FueUlmQXJyYXkodmFsdWUsIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiBMb2NhbENvbGxlY3Rpb24uX2YuX2NtcCh4LCBvcGVyYW5kKSA+IDA7XG4gICAgICB9KTtcbiAgICB9O1xuICB9LFxuXG4gIFwiJGd0ZVwiOiBmdW5jdGlvbiAob3BlcmFuZCkge1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJldHVybiBfYW55SWZBcnJheSh2YWx1ZSwgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIExvY2FsQ29sbGVjdGlvbi5fZi5fY21wKHgsIG9wZXJhbmQpID49IDA7XG4gICAgICB9KTtcbiAgICB9O1xuICB9LFxuXG4gIFwiJG5lXCI6IGZ1bmN0aW9uIChvcGVyYW5kKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgcmV0dXJuICEgX2FueUlmQXJyYXlQbHVzKHZhbHVlLCBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4gTG9jYWxDb2xsZWN0aW9uLl9mLl9lcXVhbCh4LCBvcGVyYW5kKTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0sXG5cbiAgXCIkbmluXCI6IGZ1bmN0aW9uIChvcGVyYW5kKSB7XG4gICAgaWYgKCFpc0FycmF5KG9wZXJhbmQpKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQXJndW1lbnQgdG8gJG5pbiBtdXN0IGJlIGFycmF5XCIpO1xuICAgIHZhciBpbkZ1bmN0aW9uID0gVkFMVUVfT1BFUkFUT1JTLiRpbihvcGVyYW5kKTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAvLyBGaWVsZCBkb2Vzbid0IGV4aXN0LCBzbyBpdCdzIG5vdC1pbiBvcGVyYW5kXG4gICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZClcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICByZXR1cm4gIWluRnVuY3Rpb24odmFsdWUpO1xuICAgIH07XG4gIH0sXG5cbiAgXCIkZXhpc3RzXCI6IGZ1bmN0aW9uIChvcGVyYW5kKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgcmV0dXJuIG9wZXJhbmQgPT09ICh2YWx1ZSAhPT0gdW5kZWZpbmVkKTtcbiAgICB9O1xuICB9LFxuXG4gIFwiJG1vZFwiOiBmdW5jdGlvbiAob3BlcmFuZCkge1xuICAgIHZhciBkaXZpc29yID0gb3BlcmFuZFswXSxcbiAgICAgICAgcmVtYWluZGVyID0gb3BlcmFuZFsxXTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICByZXR1cm4gX2FueUlmQXJyYXkodmFsdWUsIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiB4ICUgZGl2aXNvciA9PT0gcmVtYWluZGVyO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSxcblxuICBcIiRzaXplXCI6IGZ1bmN0aW9uIChvcGVyYW5kKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgcmV0dXJuIGlzQXJyYXkodmFsdWUpICYmIG9wZXJhbmQgPT09IHZhbHVlLmxlbmd0aDtcbiAgICB9O1xuICB9LFxuXG4gIFwiJHR5cGVcIjogZnVuY3Rpb24gKG9wZXJhbmQpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAvLyBBIG5vbmV4aXN0ZW50IGZpZWxkIGlzIG9mIG5vIHR5cGUuXG4gICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZClcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgLy8gRGVmaW5pdGVseSBub3QgX2FueUlmQXJyYXlQbHVzOiAkdHlwZTogNCBvbmx5IG1hdGNoZXMgYXJyYXlzIHRoYXQgaGF2ZVxuICAgICAgLy8gYXJyYXlzIGFzIGVsZW1lbnRzIGFjY29yZGluZyB0byB0aGUgTW9uZ28gZG9jcy5cbiAgICAgIHJldHVybiBfYW55SWZBcnJheSh2YWx1ZSwgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIExvY2FsQ29sbGVjdGlvbi5fZi5fdHlwZSh4KSA9PT0gb3BlcmFuZDtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0sXG5cbiAgXCIkcmVnZXhcIjogZnVuY3Rpb24gKG9wZXJhbmQsIG9wdGlvbnMpIHtcbiAgICBpZiAob3B0aW9ucyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAvLyBPcHRpb25zIHBhc3NlZCBpbiAkb3B0aW9ucyAoZXZlbiB0aGUgZW1wdHkgc3RyaW5nKSBhbHdheXMgb3ZlcnJpZGVzXG4gICAgICAvLyBvcHRpb25zIGluIHRoZSBSZWdFeHAgb2JqZWN0IGl0c2VsZi5cblxuICAgICAgLy8gQmUgY2xlYXIgdGhhdCB3ZSBvbmx5IHN1cHBvcnQgdGhlIEpTLXN1cHBvcnRlZCBvcHRpb25zLCBub3QgZXh0ZW5kZWRcbiAgICAgIC8vIG9uZXMgKGVnLCBNb25nbyBzdXBwb3J0cyB4IGFuZCBzKS4gSWRlYWxseSB3ZSB3b3VsZCBpbXBsZW1lbnQgeCBhbmQgc1xuICAgICAgLy8gYnkgdHJhbnNmb3JtaW5nIHRoZSByZWdleHAsIGJ1dCBub3QgdG9kYXkuLi5cbiAgICAgIGlmICgvW15naW1dLy50ZXN0KG9wdGlvbnMpKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJPbmx5IHRoZSBpLCBtLCBhbmQgZyByZWdleHAgb3B0aW9ucyBhcmUgc3VwcG9ydGVkXCIpO1xuXG4gICAgICB2YXIgcmVnZXhTb3VyY2UgPSBvcGVyYW5kIGluc3RhbmNlb2YgUmVnRXhwID8gb3BlcmFuZC5zb3VyY2UgOiBvcGVyYW5kO1xuICAgICAgb3BlcmFuZCA9IG5ldyBSZWdFeHAocmVnZXhTb3VyY2UsIG9wdGlvbnMpO1xuICAgIH0gZWxzZSBpZiAoIShvcGVyYW5kIGluc3RhbmNlb2YgUmVnRXhwKSkge1xuICAgICAgb3BlcmFuZCA9IG5ldyBSZWdFeHAob3BlcmFuZCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIHJldHVybiBfYW55SWZBcnJheSh2YWx1ZSwgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIG9wZXJhbmQudGVzdCh4KTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0sXG5cbiAgXCIkb3B0aW9uc1wiOiBmdW5jdGlvbiAob3BlcmFuZCkge1xuICAgIC8vIGV2YWx1YXRpb24gaGFwcGVucyBhdCB0aGUgJHJlZ2V4IGZ1bmN0aW9uIGFib3ZlXG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkgeyByZXR1cm4gdHJ1ZTsgfTtcbiAgfSxcblxuICBcIiRlbGVtTWF0Y2hcIjogZnVuY3Rpb24gKG9wZXJhbmQpIHtcbiAgICB2YXIgbWF0Y2hlciA9IGNvbXBpbGVEb2N1bWVudFNlbGVjdG9yKG9wZXJhbmQpO1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIGlmICghaXNBcnJheSh2YWx1ZSkpXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIHJldHVybiBfLmFueSh2YWx1ZSwgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIG1hdGNoZXIoeCk7XG4gICAgICB9KTtcbiAgICB9O1xuICB9LFxuXG4gIFwiJG5vdFwiOiBmdW5jdGlvbiAob3BlcmFuZCkge1xuICAgIHZhciBtYXRjaGVyID0gY29tcGlsZVZhbHVlU2VsZWN0b3Iob3BlcmFuZCk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgcmV0dXJuICFtYXRjaGVyKHZhbHVlKTtcbiAgICB9O1xuICB9LFxuXG4gIFwiJG5lYXJcIjogZnVuY3Rpb24gKG9wZXJhbmQpIHtcbiAgICAvLyBBbHdheXMgcmV0dXJucyB0cnVlLiBNdXN0IGJlIGhhbmRsZWQgaW4gcG9zdC1maWx0ZXIvc29ydC9saW1pdFxuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfSxcblxuICBcIiRnZW9JbnRlcnNlY3RzXCI6IGZ1bmN0aW9uIChvcGVyYW5kKSB7XG4gICAgLy8gQWx3YXlzIHJldHVybnMgdHJ1ZS4gTXVzdCBiZSBoYW5kbGVkIGluIHBvc3QtZmlsdGVyL3NvcnQvbGltaXRcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cblxufTtcblxuLy8gaGVscGVycyB1c2VkIGJ5IGNvbXBpbGVkIHNlbGVjdG9yIGNvZGVcbkxvY2FsQ29sbGVjdGlvbi5fZiA9IHtcbiAgLy8gWFhYIGZvciBfYWxsIGFuZCBfaW4sIGNvbnNpZGVyIGJ1aWxkaW5nICdpbnF1ZXJ5JyBhdCBjb21waWxlIHRpbWUuLlxuXG4gIF90eXBlOiBmdW5jdGlvbiAodikge1xuICAgIGlmICh0eXBlb2YgdiA9PT0gXCJudW1iZXJcIilcbiAgICAgIHJldHVybiAxO1xuICAgIGlmICh0eXBlb2YgdiA9PT0gXCJzdHJpbmdcIilcbiAgICAgIHJldHVybiAyO1xuICAgIGlmICh0eXBlb2YgdiA9PT0gXCJib29sZWFuXCIpXG4gICAgICByZXR1cm4gODtcbiAgICBpZiAoaXNBcnJheSh2KSlcbiAgICAgIHJldHVybiA0O1xuICAgIGlmICh2ID09PSBudWxsKVxuICAgICAgcmV0dXJuIDEwO1xuICAgIGlmICh2IGluc3RhbmNlb2YgUmVnRXhwKVxuICAgICAgcmV0dXJuIDExO1xuICAgIGlmICh0eXBlb2YgdiA9PT0gXCJmdW5jdGlvblwiKVxuICAgICAgLy8gbm90ZSB0aGF0IHR5cGVvZigveC8pID09PSBcImZ1bmN0aW9uXCJcbiAgICAgIHJldHVybiAxMztcbiAgICBpZiAodiBpbnN0YW5jZW9mIERhdGUpXG4gICAgICByZXR1cm4gOTtcbiAgICBpZiAoRUpTT04uaXNCaW5hcnkodikpXG4gICAgICByZXR1cm4gNTtcbiAgICBpZiAodiBpbnN0YW5jZW9mIE1ldGVvci5Db2xsZWN0aW9uLk9iamVjdElEKVxuICAgICAgcmV0dXJuIDc7XG4gICAgcmV0dXJuIDM7IC8vIG9iamVjdFxuXG4gICAgLy8gWFhYIHN1cHBvcnQgc29tZS9hbGwgb2YgdGhlc2U6XG4gICAgLy8gMTQsIHN5bWJvbFxuICAgIC8vIDE1LCBqYXZhc2NyaXB0IGNvZGUgd2l0aCBzY29wZVxuICAgIC8vIDE2LCAxODogMzItYml0LzY0LWJpdCBpbnRlZ2VyXG4gICAgLy8gMTcsIHRpbWVzdGFtcFxuICAgIC8vIDI1NSwgbWlua2V5XG4gICAgLy8gMTI3LCBtYXhrZXlcbiAgfSxcblxuICAvLyBkZWVwIGVxdWFsaXR5IHRlc3Q6IHVzZSBmb3IgbGl0ZXJhbCBkb2N1bWVudCBhbmQgYXJyYXkgbWF0Y2hlc1xuICBfZXF1YWw6IGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgcmV0dXJuIEVKU09OLmVxdWFscyhhLCBiLCB7a2V5T3JkZXJTZW5zaXRpdmU6IHRydWV9KTtcbiAgfSxcblxuICAvLyBtYXBzIGEgdHlwZSBjb2RlIHRvIGEgdmFsdWUgdGhhdCBjYW4gYmUgdXNlZCB0byBzb3J0IHZhbHVlcyBvZlxuICAvLyBkaWZmZXJlbnQgdHlwZXNcbiAgX3R5cGVvcmRlcjogZnVuY3Rpb24gKHQpIHtcbiAgICAvLyBodHRwOi8vd3d3Lm1vbmdvZGIub3JnL2Rpc3BsYXkvRE9DUy9XaGF0K2lzK3RoZStDb21wYXJlK09yZGVyK2ZvcitCU09OK1R5cGVzXG4gICAgLy8gWFhYIHdoYXQgaXMgdGhlIGNvcnJlY3Qgc29ydCBwb3NpdGlvbiBmb3IgSmF2YXNjcmlwdCBjb2RlP1xuICAgIC8vICgnMTAwJyBpbiB0aGUgbWF0cml4IGJlbG93KVxuICAgIC8vIFhYWCBtaW5rZXkvbWF4a2V5XG4gICAgcmV0dXJuIFstMSwgIC8vIChub3QgYSB0eXBlKVxuICAgICAgICAgICAgMSwgICAvLyBudW1iZXJcbiAgICAgICAgICAgIDIsICAgLy8gc3RyaW5nXG4gICAgICAgICAgICAzLCAgIC8vIG9iamVjdFxuICAgICAgICAgICAgNCwgICAvLyBhcnJheVxuICAgICAgICAgICAgNSwgICAvLyBiaW5hcnlcbiAgICAgICAgICAgIC0xLCAgLy8gZGVwcmVjYXRlZFxuICAgICAgICAgICAgNiwgICAvLyBPYmplY3RJRFxuICAgICAgICAgICAgNywgICAvLyBib29sXG4gICAgICAgICAgICA4LCAgIC8vIERhdGVcbiAgICAgICAgICAgIDAsICAgLy8gbnVsbFxuICAgICAgICAgICAgOSwgICAvLyBSZWdFeHBcbiAgICAgICAgICAgIC0xLCAgLy8gZGVwcmVjYXRlZFxuICAgICAgICAgICAgMTAwLCAvLyBKUyBjb2RlXG4gICAgICAgICAgICAyLCAgIC8vIGRlcHJlY2F0ZWQgKHN5bWJvbClcbiAgICAgICAgICAgIDEwMCwgLy8gSlMgY29kZVxuICAgICAgICAgICAgMSwgICAvLyAzMi1iaXQgaW50XG4gICAgICAgICAgICA4LCAgIC8vIE1vbmdvIHRpbWVzdGFtcFxuICAgICAgICAgICAgMSAgICAvLyA2NC1iaXQgaW50XG4gICAgICAgICAgIF1bdF07XG4gIH0sXG5cbiAgLy8gY29tcGFyZSB0d28gdmFsdWVzIG9mIHVua25vd24gdHlwZSBhY2NvcmRpbmcgdG8gQlNPTiBvcmRlcmluZ1xuICAvLyBzZW1hbnRpY3MuIChhcyBhbiBleHRlbnNpb24sIGNvbnNpZGVyICd1bmRlZmluZWQnIHRvIGJlIGxlc3MgdGhhblxuICAvLyBhbnkgb3RoZXIgdmFsdWUuKSByZXR1cm4gbmVnYXRpdmUgaWYgYSBpcyBsZXNzLCBwb3NpdGl2ZSBpZiBiIGlzXG4gIC8vIGxlc3MsIG9yIDAgaWYgZXF1YWxcbiAgX2NtcDogZnVuY3Rpb24gKGEsIGIpIHtcbiAgICBpZiAoYSA9PT0gdW5kZWZpbmVkKVxuICAgICAgcmV0dXJuIGIgPT09IHVuZGVmaW5lZCA/IDAgOiAtMTtcbiAgICBpZiAoYiA9PT0gdW5kZWZpbmVkKVxuICAgICAgcmV0dXJuIDE7XG4gICAgdmFyIHRhID0gTG9jYWxDb2xsZWN0aW9uLl9mLl90eXBlKGEpO1xuICAgIHZhciB0YiA9IExvY2FsQ29sbGVjdGlvbi5fZi5fdHlwZShiKTtcbiAgICB2YXIgb2EgPSBMb2NhbENvbGxlY3Rpb24uX2YuX3R5cGVvcmRlcih0YSk7XG4gICAgdmFyIG9iID0gTG9jYWxDb2xsZWN0aW9uLl9mLl90eXBlb3JkZXIodGIpO1xuICAgIGlmIChvYSAhPT0gb2IpXG4gICAgICByZXR1cm4gb2EgPCBvYiA/IC0xIDogMTtcbiAgICBpZiAodGEgIT09IHRiKVxuICAgICAgLy8gWFhYIG5lZWQgdG8gaW1wbGVtZW50IHRoaXMgaWYgd2UgaW1wbGVtZW50IFN5bWJvbCBvciBpbnRlZ2Vycywgb3JcbiAgICAgIC8vIFRpbWVzdGFtcFxuICAgICAgdGhyb3cgRXJyb3IoXCJNaXNzaW5nIHR5cGUgY29lcmNpb24gbG9naWMgaW4gX2NtcFwiKTtcbiAgICBpZiAodGEgPT09IDcpIHsgLy8gT2JqZWN0SURcbiAgICAgIC8vIENvbnZlcnQgdG8gc3RyaW5nLlxuICAgICAgdGEgPSB0YiA9IDI7XG4gICAgICBhID0gYS50b0hleFN0cmluZygpO1xuICAgICAgYiA9IGIudG9IZXhTdHJpbmcoKTtcbiAgICB9XG4gICAgaWYgKHRhID09PSA5KSB7IC8vIERhdGVcbiAgICAgIC8vIENvbnZlcnQgdG8gbWlsbGlzLlxuICAgICAgdGEgPSB0YiA9IDE7XG4gICAgICBhID0gYS5nZXRUaW1lKCk7XG4gICAgICBiID0gYi5nZXRUaW1lKCk7XG4gICAgfVxuXG4gICAgaWYgKHRhID09PSAxKSAvLyBkb3VibGVcbiAgICAgIHJldHVybiBhIC0gYjtcbiAgICBpZiAodGIgPT09IDIpIC8vIHN0cmluZ1xuICAgICAgcmV0dXJuIGEgPCBiID8gLTEgOiAoYSA9PT0gYiA/IDAgOiAxKTtcbiAgICBpZiAodGEgPT09IDMpIHsgLy8gT2JqZWN0XG4gICAgICAvLyB0aGlzIGNvdWxkIGJlIG11Y2ggbW9yZSBlZmZpY2llbnQgaW4gdGhlIGV4cGVjdGVkIGNhc2UgLi4uXG4gICAgICB2YXIgdG9fYXJyYXkgPSBmdW5jdGlvbiAob2JqKSB7XG4gICAgICAgIHZhciByZXQgPSBbXTtcbiAgICAgICAgZm9yICh2YXIga2V5IGluIG9iaikge1xuICAgICAgICAgIHJldC5wdXNoKGtleSk7XG4gICAgICAgICAgcmV0LnB1c2gob2JqW2tleV0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgICB9O1xuICAgICAgcmV0dXJuIExvY2FsQ29sbGVjdGlvbi5fZi5fY21wKHRvX2FycmF5KGEpLCB0b19hcnJheShiKSk7XG4gICAgfVxuICAgIGlmICh0YSA9PT0gNCkgeyAvLyBBcnJheVxuICAgICAgZm9yICh2YXIgaSA9IDA7IDsgaSsrKSB7XG4gICAgICAgIGlmIChpID09PSBhLmxlbmd0aClcbiAgICAgICAgICByZXR1cm4gKGkgPT09IGIubGVuZ3RoKSA/IDAgOiAtMTtcbiAgICAgICAgaWYgKGkgPT09IGIubGVuZ3RoKVxuICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICB2YXIgcyA9IExvY2FsQ29sbGVjdGlvbi5fZi5fY21wKGFbaV0sIGJbaV0pO1xuICAgICAgICBpZiAocyAhPT0gMClcbiAgICAgICAgICByZXR1cm4gcztcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHRhID09PSA1KSB7IC8vIGJpbmFyeVxuICAgICAgLy8gU3VycHJpc2luZ2x5LCBhIHNtYWxsIGJpbmFyeSBibG9iIGlzIGFsd2F5cyBsZXNzIHRoYW4gYSBsYXJnZSBvbmUgaW5cbiAgICAgIC8vIE1vbmdvLlxuICAgICAgaWYgKGEubGVuZ3RoICE9PSBiLmxlbmd0aClcbiAgICAgICAgcmV0dXJuIGEubGVuZ3RoIC0gYi5sZW5ndGg7XG4gICAgICBmb3IgKGkgPSAwOyBpIDwgYS5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoYVtpXSA8IGJbaV0pXG4gICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICBpZiAoYVtpXSA+IGJbaV0pXG4gICAgICAgICAgcmV0dXJuIDE7XG4gICAgICB9XG4gICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgaWYgKHRhID09PSA4KSB7IC8vIGJvb2xlYW5cbiAgICAgIGlmIChhKSByZXR1cm4gYiA/IDAgOiAxO1xuICAgICAgcmV0dXJuIGIgPyAtMSA6IDA7XG4gICAgfVxuICAgIGlmICh0YSA9PT0gMTApIC8vIG51bGxcbiAgICAgIHJldHVybiAwO1xuICAgIGlmICh0YSA9PT0gMTEpIC8vIHJlZ2V4cFxuICAgICAgdGhyb3cgRXJyb3IoXCJTb3J0aW5nIG5vdCBzdXBwb3J0ZWQgb24gcmVndWxhciBleHByZXNzaW9uXCIpOyAvLyBYWFhcbiAgICAvLyAxMzogamF2YXNjcmlwdCBjb2RlXG4gICAgLy8gMTQ6IHN5bWJvbFxuICAgIC8vIDE1OiBqYXZhc2NyaXB0IGNvZGUgd2l0aCBzY29wZVxuICAgIC8vIDE2OiAzMi1iaXQgaW50ZWdlclxuICAgIC8vIDE3OiB0aW1lc3RhbXBcbiAgICAvLyAxODogNjQtYml0IGludGVnZXJcbiAgICAvLyAyNTU6IG1pbmtleVxuICAgIC8vIDEyNzogbWF4a2V5XG4gICAgaWYgKHRhID09PSAxMykgLy8gamF2YXNjcmlwdCBjb2RlXG4gICAgICB0aHJvdyBFcnJvcihcIlNvcnRpbmcgbm90IHN1cHBvcnRlZCBvbiBKYXZhc2NyaXB0IGNvZGVcIik7IC8vIFhYWFxuICAgIHRocm93IEVycm9yKFwiVW5rbm93biB0eXBlIHRvIHNvcnRcIik7XG4gIH1cbn07XG5cbi8vIEZvciB1bml0IHRlc3RzLiBUcnVlIGlmIHRoZSBnaXZlbiBkb2N1bWVudCBtYXRjaGVzIHRoZSBnaXZlblxuLy8gc2VsZWN0b3IuXG5Mb2NhbENvbGxlY3Rpb24uX21hdGNoZXMgPSBmdW5jdGlvbiAoc2VsZWN0b3IsIGRvYykge1xuICByZXR1cm4gKExvY2FsQ29sbGVjdGlvbi5fY29tcGlsZVNlbGVjdG9yKHNlbGVjdG9yKSkoZG9jKTtcbn07XG5cbi8vIF9tYWtlTG9va3VwRnVuY3Rpb24oa2V5KSByZXR1cm5zIGEgbG9va3VwIGZ1bmN0aW9uLlxuLy9cbi8vIEEgbG9va3VwIGZ1bmN0aW9uIHRha2VzIGluIGEgZG9jdW1lbnQgYW5kIHJldHVybnMgYW4gYXJyYXkgb2YgbWF0Y2hpbmdcbi8vIHZhbHVlcy4gIFRoaXMgYXJyYXkgaGFzIG1vcmUgdGhhbiBvbmUgZWxlbWVudCBpZiBhbnkgc2VnbWVudCBvZiB0aGUga2V5IG90aGVyXG4vLyB0aGFuIHRoZSBsYXN0IG9uZSBpcyBhbiBhcnJheS4gIGllLCBhbnkgYXJyYXlzIGZvdW5kIHdoZW4gZG9pbmcgbm9uLWZpbmFsXG4vLyBsb29rdXBzIHJlc3VsdCBpbiB0aGlzIGZ1bmN0aW9uIFwiYnJhbmNoaW5nXCI7IGVhY2ggZWxlbWVudCBpbiB0aGUgcmV0dXJuZWRcbi8vIGFycmF5IHJlcHJlc2VudHMgdGhlIHZhbHVlIGZvdW5kIGF0IHRoaXMgYnJhbmNoLiBJZiBhbnkgYnJhbmNoIGRvZXNuJ3QgaGF2ZSBhXG4vLyBmaW5hbCB2YWx1ZSBmb3IgdGhlIGZ1bGwga2V5LCBpdHMgZWxlbWVudCBpbiB0aGUgcmV0dXJuZWQgbGlzdCB3aWxsIGJlXG4vLyB1bmRlZmluZWQuIEl0IGFsd2F5cyByZXR1cm5zIGEgbm9uLWVtcHR5IGFycmF5LlxuLy9cbi8vIF9tYWtlTG9va3VwRnVuY3Rpb24oJ2EueCcpKHthOiB7eDogMX19KSByZXR1cm5zIFsxXVxuLy8gX21ha2VMb29rdXBGdW5jdGlvbignYS54Jykoe2E6IHt4OiBbMV19fSkgcmV0dXJucyBbWzFdXVxuLy8gX21ha2VMb29rdXBGdW5jdGlvbignYS54Jykoe2E6IDV9KSAgcmV0dXJucyBbdW5kZWZpbmVkXVxuLy8gX21ha2VMb29rdXBGdW5jdGlvbignYS54Jykoe2E6IFt7eDogMX0sXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHt4OiBbMl19LFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7eTogM31dfSlcbi8vICAgcmV0dXJucyBbMSwgWzJdLCB1bmRlZmluZWRdXG5Mb2NhbENvbGxlY3Rpb24uX21ha2VMb29rdXBGdW5jdGlvbiA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgdmFyIGRvdExvY2F0aW9uID0ga2V5LmluZGV4T2YoJy4nKTtcbiAgdmFyIGZpcnN0LCBsb29rdXBSZXN0LCBuZXh0SXNOdW1lcmljO1xuICBpZiAoZG90TG9jYXRpb24gPT09IC0xKSB7XG4gICAgZmlyc3QgPSBrZXk7XG4gIH0gZWxzZSB7XG4gICAgZmlyc3QgPSBrZXkuc3Vic3RyKDAsIGRvdExvY2F0aW9uKTtcbiAgICB2YXIgcmVzdCA9IGtleS5zdWJzdHIoZG90TG9jYXRpb24gKyAxKTtcbiAgICBsb29rdXBSZXN0ID0gTG9jYWxDb2xsZWN0aW9uLl9tYWtlTG9va3VwRnVuY3Rpb24ocmVzdCk7XG4gICAgLy8gSXMgdGhlIG5leHQgKHBlcmhhcHMgZmluYWwpIHBpZWNlIG51bWVyaWMgKGllLCBhbiBhcnJheSBsb29rdXA/KVxuICAgIG5leHRJc051bWVyaWMgPSAvXlxcZCsoXFwufCQpLy50ZXN0KHJlc3QpO1xuICB9XG5cbiAgcmV0dXJuIGZ1bmN0aW9uIChkb2MpIHtcbiAgICBpZiAoZG9jID09IG51bGwpICAvLyBudWxsIG9yIHVuZGVmaW5lZFxuICAgICAgcmV0dXJuIFt1bmRlZmluZWRdO1xuICAgIHZhciBmaXJzdExldmVsID0gZG9jW2ZpcnN0XTtcblxuICAgIC8vIFdlIGRvbid0IFwiYnJhbmNoXCIgYXQgdGhlIGZpbmFsIGxldmVsLlxuICAgIGlmICghbG9va3VwUmVzdClcbiAgICAgIHJldHVybiBbZmlyc3RMZXZlbF07XG5cbiAgICAvLyBJdCdzIGFuIGVtcHR5IGFycmF5LCBhbmQgd2UncmUgbm90IGRvbmU6IHdlIHdvbid0IGZpbmQgYW55dGhpbmcuXG4gICAgaWYgKGlzQXJyYXkoZmlyc3RMZXZlbCkgJiYgZmlyc3RMZXZlbC5sZW5ndGggPT09IDApXG4gICAgICByZXR1cm4gW3VuZGVmaW5lZF07XG5cbiAgICAvLyBGb3IgZWFjaCByZXN1bHQgYXQgdGhpcyBsZXZlbCwgZmluaXNoIHRoZSBsb29rdXAgb24gdGhlIHJlc3Qgb2YgdGhlIGtleSxcbiAgICAvLyBhbmQgcmV0dXJuIGV2ZXJ5dGhpbmcgd2UgZmluZC4gQWxzbywgaWYgdGhlIG5leHQgcmVzdWx0IGlzIGEgbnVtYmVyLFxuICAgIC8vIGRvbid0IGJyYW5jaCBoZXJlLlxuICAgIC8vXG4gICAgLy8gVGVjaG5pY2FsbHksIGluIE1vbmdvREIsIHdlIHNob3VsZCBiZSBhYmxlIHRvIGhhbmRsZSB0aGUgY2FzZSB3aGVyZVxuICAgIC8vIG9iamVjdHMgaGF2ZSBudW1lcmljIGtleXMsIGJ1dCBNb25nbyBkb2Vzbid0IGFjdHVhbGx5IGhhbmRsZSB0aGlzXG4gICAgLy8gY29uc2lzdGVudGx5IHlldCBpdHNlbGYsIHNlZSBlZ1xuICAgIC8vIGh0dHBzOi8vamlyYS5tb25nb2RiLm9yZy9icm93c2UvU0VSVkVSLTI4OThcbiAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vbW9uZ29kYi9tb25nby9ibG9iL21hc3Rlci9qc3Rlc3RzL2FycmF5X21hdGNoMi5qc1xuICAgIGlmICghaXNBcnJheShmaXJzdExldmVsKSB8fCBuZXh0SXNOdW1lcmljKVxuICAgICAgZmlyc3RMZXZlbCA9IFtmaXJzdExldmVsXTtcbiAgICByZXR1cm4gQXJyYXkucHJvdG90eXBlLmNvbmNhdC5hcHBseShbXSwgXy5tYXAoZmlyc3RMZXZlbCwgbG9va3VwUmVzdCkpO1xuICB9O1xufTtcblxuLy8gVGhlIG1haW4gY29tcGlsYXRpb24gZnVuY3Rpb24gZm9yIGEgZ2l2ZW4gc2VsZWN0b3IuXG52YXIgY29tcGlsZURvY3VtZW50U2VsZWN0b3IgPSBmdW5jdGlvbiAoZG9jU2VsZWN0b3IpIHtcbiAgdmFyIHBlcktleVNlbGVjdG9ycyA9IFtdO1xuICBfLmVhY2goZG9jU2VsZWN0b3IsIGZ1bmN0aW9uIChzdWJTZWxlY3Rvciwga2V5KSB7XG4gICAgaWYgKGtleS5zdWJzdHIoMCwgMSkgPT09ICckJykge1xuICAgICAgLy8gT3V0ZXIgb3BlcmF0b3JzIGFyZSBlaXRoZXIgbG9naWNhbCBvcGVyYXRvcnMgKHRoZXkgcmVjdXJzZSBiYWNrIGludG9cbiAgICAgIC8vIHRoaXMgZnVuY3Rpb24pLCBvciAkd2hlcmUuXG4gICAgICBpZiAoIV8uaGFzKExPR0lDQUxfT1BFUkFUT1JTLCBrZXkpKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJVbnJlY29nbml6ZWQgbG9naWNhbCBvcGVyYXRvcjogXCIgKyBrZXkpO1xuICAgICAgcGVyS2V5U2VsZWN0b3JzLnB1c2goTE9HSUNBTF9PUEVSQVRPUlNba2V5XShzdWJTZWxlY3RvcikpO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgbG9va1VwQnlJbmRleCA9IExvY2FsQ29sbGVjdGlvbi5fbWFrZUxvb2t1cEZ1bmN0aW9uKGtleSk7XG4gICAgICB2YXIgdmFsdWVTZWxlY3RvckZ1bmMgPSBjb21waWxlVmFsdWVTZWxlY3RvcihzdWJTZWxlY3Rvcik7XG4gICAgICBwZXJLZXlTZWxlY3RvcnMucHVzaChmdW5jdGlvbiAoZG9jKSB7XG4gICAgICAgIHZhciBicmFuY2hWYWx1ZXMgPSBsb29rVXBCeUluZGV4KGRvYyk7XG4gICAgICAgIC8vIFdlIGFwcGx5IHRoZSBzZWxlY3RvciB0byBlYWNoIFwiYnJhbmNoZWRcIiB2YWx1ZSBhbmQgcmV0dXJuIHRydWUgaWYgYW55XG4gICAgICAgIC8vIG1hdGNoLiBUaGlzIGlzbid0IDEwMCUgY29uc2lzdGVudCB3aXRoIE1vbmdvREI7IGVnLCBzZWU6XG4gICAgICAgIC8vIGh0dHBzOi8vamlyYS5tb25nb2RiLm9yZy9icm93c2UvU0VSVkVSLTg1ODVcbiAgICAgICAgcmV0dXJuIF8uYW55KGJyYW5jaFZhbHVlcywgdmFsdWVTZWxlY3RvckZ1bmMpO1xuICAgICAgfSk7XG4gICAgfVxuICB9KTtcblxuXG4gIHJldHVybiBmdW5jdGlvbiAoZG9jKSB7XG4gICAgcmV0dXJuIF8uYWxsKHBlcktleVNlbGVjdG9ycywgZnVuY3Rpb24gKGYpIHtcbiAgICAgIHJldHVybiBmKGRvYyk7XG4gICAgfSk7XG4gIH07XG59O1xuXG4vLyBHaXZlbiBhIHNlbGVjdG9yLCByZXR1cm4gYSBmdW5jdGlvbiB0aGF0IHRha2VzIG9uZSBhcmd1bWVudCwgYVxuLy8gZG9jdW1lbnQsIGFuZCByZXR1cm5zIHRydWUgaWYgdGhlIGRvY3VtZW50IG1hdGNoZXMgdGhlIHNlbGVjdG9yLFxuLy8gZWxzZSBmYWxzZS5cbkxvY2FsQ29sbGVjdGlvbi5fY29tcGlsZVNlbGVjdG9yID0gZnVuY3Rpb24gKHNlbGVjdG9yKSB7XG4gIC8vIHlvdSBjYW4gcGFzcyBhIGxpdGVyYWwgZnVuY3Rpb24gaW5zdGVhZCBvZiBhIHNlbGVjdG9yXG4gIGlmIChzZWxlY3RvciBpbnN0YW5jZW9mIEZ1bmN0aW9uKVxuICAgIHJldHVybiBmdW5jdGlvbiAoZG9jKSB7cmV0dXJuIHNlbGVjdG9yLmNhbGwoZG9jKTt9O1xuXG4gIC8vIHNob3J0aGFuZCAtLSBzY2FsYXJzIG1hdGNoIF9pZFxuICBpZiAoTG9jYWxDb2xsZWN0aW9uLl9zZWxlY3RvcklzSWQoc2VsZWN0b3IpKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChkb2MpIHtcbiAgICAgIHJldHVybiBFSlNPTi5lcXVhbHMoZG9jLl9pZCwgc2VsZWN0b3IpO1xuICAgIH07XG4gIH1cblxuICAvLyBwcm90ZWN0IGFnYWluc3QgZGFuZ2Vyb3VzIHNlbGVjdG9ycy4gIGZhbHNleSBhbmQge19pZDogZmFsc2V5fSBhcmUgYm90aFxuICAvLyBsaWtlbHkgcHJvZ3JhbW1lciBlcnJvciwgYW5kIG5vdCB3aGF0IHlvdSB3YW50LCBwYXJ0aWN1bGFybHkgZm9yXG4gIC8vIGRlc3RydWN0aXZlIG9wZXJhdGlvbnMuXG4gIGlmICghc2VsZWN0b3IgfHwgKCgnX2lkJyBpbiBzZWxlY3RvcikgJiYgIXNlbGVjdG9yLl9pZCkpXG4gICAgcmV0dXJuIGZ1bmN0aW9uIChkb2MpIHtyZXR1cm4gZmFsc2U7fTtcblxuICAvLyBUb3AgbGV2ZWwgY2FuJ3QgYmUgYW4gYXJyYXkgb3IgdHJ1ZSBvciBiaW5hcnkuXG4gIGlmICh0eXBlb2Yoc2VsZWN0b3IpID09PSAnYm9vbGVhbicgfHwgaXNBcnJheShzZWxlY3RvcikgfHxcbiAgICAgIEVKU09OLmlzQmluYXJ5KHNlbGVjdG9yKSlcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIHNlbGVjdG9yOiBcIiArIHNlbGVjdG9yKTtcblxuICByZXR1cm4gY29tcGlsZURvY3VtZW50U2VsZWN0b3Ioc2VsZWN0b3IpO1xufTtcblxuLy8gR2l2ZSBhIHNvcnQgc3BlYywgd2hpY2ggY2FuIGJlIGluIGFueSBvZiB0aGVzZSBmb3Jtczpcbi8vICAge1wia2V5MVwiOiAxLCBcImtleTJcIjogLTF9XG4vLyAgIFtbXCJrZXkxXCIsIFwiYXNjXCJdLCBbXCJrZXkyXCIsIFwiZGVzY1wiXV1cbi8vICAgW1wia2V5MVwiLCBbXCJrZXkyXCIsIFwiZGVzY1wiXV1cbi8vXG4vLyAoLi4gd2l0aCB0aGUgZmlyc3QgZm9ybSBiZWluZyBkZXBlbmRlbnQgb24gdGhlIGtleSBlbnVtZXJhdGlvblxuLy8gYmVoYXZpb3Igb2YgeW91ciBqYXZhc2NyaXB0IFZNLCB3aGljaCB1c3VhbGx5IGRvZXMgd2hhdCB5b3UgbWVhbiBpblxuLy8gdGhpcyBjYXNlIGlmIHRoZSBrZXkgbmFtZXMgZG9uJ3QgbG9vayBsaWtlIGludGVnZXJzIC4uKVxuLy9cbi8vIHJldHVybiBhIGZ1bmN0aW9uIHRoYXQgdGFrZXMgdHdvIG9iamVjdHMsIGFuZCByZXR1cm5zIC0xIGlmIHRoZVxuLy8gZmlyc3Qgb2JqZWN0IGNvbWVzIGZpcnN0IGluIG9yZGVyLCAxIGlmIHRoZSBzZWNvbmQgb2JqZWN0IGNvbWVzXG4vLyBmaXJzdCwgb3IgMCBpZiBuZWl0aGVyIG9iamVjdCBjb21lcyBiZWZvcmUgdGhlIG90aGVyLlxuXG5Mb2NhbENvbGxlY3Rpb24uX2NvbXBpbGVTb3J0ID0gZnVuY3Rpb24gKHNwZWMpIHtcbiAgdmFyIHNvcnRTcGVjUGFydHMgPSBbXTtcblxuICBpZiAoc3BlYyBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzcGVjLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAodHlwZW9mIHNwZWNbaV0gPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgc29ydFNwZWNQYXJ0cy5wdXNoKHtcbiAgICAgICAgICBsb29rdXA6IExvY2FsQ29sbGVjdGlvbi5fbWFrZUxvb2t1cEZ1bmN0aW9uKHNwZWNbaV0pLFxuICAgICAgICAgIGFzY2VuZGluZzogdHJ1ZVxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNvcnRTcGVjUGFydHMucHVzaCh7XG4gICAgICAgICAgbG9va3VwOiBMb2NhbENvbGxlY3Rpb24uX21ha2VMb29rdXBGdW5jdGlvbihzcGVjW2ldWzBdKSxcbiAgICAgICAgICBhc2NlbmRpbmc6IHNwZWNbaV1bMV0gIT09IFwiZGVzY1wiXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIGlmICh0eXBlb2Ygc3BlYyA9PT0gXCJvYmplY3RcIikge1xuICAgIGZvciAodmFyIGtleSBpbiBzcGVjKSB7XG4gICAgICBzb3J0U3BlY1BhcnRzLnB1c2goe1xuICAgICAgICBsb29rdXA6IExvY2FsQ29sbGVjdGlvbi5fbWFrZUxvb2t1cEZ1bmN0aW9uKGtleSksXG4gICAgICAgIGFzY2VuZGluZzogc3BlY1trZXldID49IDBcbiAgICAgIH0pO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBFcnJvcihcIkJhZCBzb3J0IHNwZWNpZmljYXRpb246IFwiLCBKU09OLnN0cmluZ2lmeShzcGVjKSk7XG4gIH1cblxuICBpZiAoc29ydFNwZWNQYXJ0cy5sZW5ndGggPT09IDApXG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtyZXR1cm4gMDt9O1xuXG4gIC8vIHJlZHVjZVZhbHVlIHRha2VzIGluIGFsbCB0aGUgcG9zc2libGUgdmFsdWVzIGZvciB0aGUgc29ydCBrZXkgYWxvbmcgdmFyaW91c1xuICAvLyBicmFuY2hlcywgYW5kIHJldHVybnMgdGhlIG1pbiBvciBtYXggdmFsdWUgKGFjY29yZGluZyB0byB0aGUgYm9vbFxuICAvLyBmaW5kTWluKS4gRWFjaCB2YWx1ZSBjYW4gaXRzZWxmIGJlIGFuIGFycmF5LCBhbmQgd2UgbG9vayBhdCBpdHMgdmFsdWVzXG4gIC8vIHRvby4gKGllLCB3ZSBkbyBhIHNpbmdsZSBsZXZlbCBvZiBmbGF0dGVuaW5nIG9uIGJyYW5jaFZhbHVlcywgdGhlbiBmaW5kIHRoZVxuICAvLyBtaW4vbWF4LilcbiAgdmFyIHJlZHVjZVZhbHVlID0gZnVuY3Rpb24gKGJyYW5jaFZhbHVlcywgZmluZE1pbikge1xuICAgIHZhciByZWR1Y2VkO1xuICAgIHZhciBmaXJzdCA9IHRydWU7XG4gICAgLy8gSXRlcmF0ZSBvdmVyIGFsbCB0aGUgdmFsdWVzIGZvdW5kIGluIGFsbCB0aGUgYnJhbmNoZXMsIGFuZCBpZiBhIHZhbHVlIGlzXG4gICAgLy8gYW4gYXJyYXkgaXRzZWxmLCBpdGVyYXRlIG92ZXIgdGhlIHZhbHVlcyBpbiB0aGUgYXJyYXkgc2VwYXJhdGVseS5cbiAgICBfLmVhY2goYnJhbmNoVmFsdWVzLCBmdW5jdGlvbiAoYnJhbmNoVmFsdWUpIHtcbiAgICAgIC8vIFZhbHVlIG5vdCBhbiBhcnJheT8gUHJldGVuZCBpdCBpcy5cbiAgICAgIGlmICghaXNBcnJheShicmFuY2hWYWx1ZSkpXG4gICAgICAgIGJyYW5jaFZhbHVlID0gW2JyYW5jaFZhbHVlXTtcbiAgICAgIC8vIFZhbHVlIGlzIGFuIGVtcHR5IGFycmF5PyBQcmV0ZW5kIGl0IHdhcyBtaXNzaW5nLCBzaW5jZSB0aGF0J3Mgd2hlcmUgaXRcbiAgICAgIC8vIHNob3VsZCBiZSBzb3J0ZWQuXG4gICAgICBpZiAoaXNBcnJheShicmFuY2hWYWx1ZSkgJiYgYnJhbmNoVmFsdWUubGVuZ3RoID09PSAwKVxuICAgICAgICBicmFuY2hWYWx1ZSA9IFt1bmRlZmluZWRdO1xuICAgICAgXy5lYWNoKGJyYW5jaFZhbHVlLCBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgLy8gV2Ugc2hvdWxkIGdldCBoZXJlIGF0IGxlYXN0IG9uY2U6IGxvb2t1cCBmdW5jdGlvbnMgcmV0dXJuIG5vbi1lbXB0eVxuICAgICAgICAvLyBhcnJheXMsIHNvIHRoZSBvdXRlciBsb29wIHJ1bnMgYXQgbGVhc3Qgb25jZSwgYW5kIHdlIHByZXZlbnRlZFxuICAgICAgICAvLyBicmFuY2hWYWx1ZSBmcm9tIGJlaW5nIGFuIGVtcHR5IGFycmF5LlxuICAgICAgICBpZiAoZmlyc3QpIHtcbiAgICAgICAgICByZWR1Y2VkID0gdmFsdWU7XG4gICAgICAgICAgZmlyc3QgPSBmYWxzZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBDb21wYXJlIHRoZSB2YWx1ZSB3ZSBmb3VuZCB0byB0aGUgdmFsdWUgd2UgZm91bmQgc28gZmFyLCBzYXZpbmcgaXRcbiAgICAgICAgICAvLyBpZiBpdCdzIGxlc3MgKGZvciBhbiBhc2NlbmRpbmcgc29ydCkgb3IgbW9yZSAoZm9yIGEgZGVzY2VuZGluZ1xuICAgICAgICAgIC8vIHNvcnQpLlxuICAgICAgICAgIHZhciBjbXAgPSBMb2NhbENvbGxlY3Rpb24uX2YuX2NtcChyZWR1Y2VkLCB2YWx1ZSk7XG4gICAgICAgICAgaWYgKChmaW5kTWluICYmIGNtcCA+IDApIHx8ICghZmluZE1pbiAmJiBjbXAgPCAwKSlcbiAgICAgICAgICAgIHJlZHVjZWQgPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlZHVjZWQ7XG4gIH07XG5cbiAgcmV0dXJuIGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzb3J0U3BlY1BhcnRzLmxlbmd0aDsgKytpKSB7XG4gICAgICB2YXIgc3BlY1BhcnQgPSBzb3J0U3BlY1BhcnRzW2ldO1xuICAgICAgdmFyIGFWYWx1ZSA9IHJlZHVjZVZhbHVlKHNwZWNQYXJ0Lmxvb2t1cChhKSwgc3BlY1BhcnQuYXNjZW5kaW5nKTtcbiAgICAgIHZhciBiVmFsdWUgPSByZWR1Y2VWYWx1ZShzcGVjUGFydC5sb29rdXAoYiksIHNwZWNQYXJ0LmFzY2VuZGluZyk7XG4gICAgICB2YXIgY29tcGFyZSA9IExvY2FsQ29sbGVjdGlvbi5fZi5fY21wKGFWYWx1ZSwgYlZhbHVlKTtcbiAgICAgIGlmIChjb21wYXJlICE9PSAwKVxuICAgICAgICByZXR1cm4gc3BlY1BhcnQuYXNjZW5kaW5nID8gY29tcGFyZSA6IC1jb21wYXJlO1xuICAgIH07XG4gICAgcmV0dXJuIDA7XG4gIH07XG59O1xuXG5leHBvcnRzLmNvbXBpbGVEb2N1bWVudFNlbGVjdG9yID0gY29tcGlsZURvY3VtZW50U2VsZWN0b3I7XG5leHBvcnRzLmNvbXBpbGVTb3J0ID0gTG9jYWxDb2xsZWN0aW9uLl9jb21waWxlU29ydDsiLCJQYWdlID0gcmVxdWlyZShcIi4uL1BhZ2VcIilcbkxvY2F0aW9uRmluZGVyID0gcmVxdWlyZSAnLi4vTG9jYXRpb25GaW5kZXInXG5HZW9KU09OID0gcmVxdWlyZSAnLi4vR2VvSlNPTidcblxuIyBUT0RPIHNvdXJjZSBzZWFyY2hcblxuIyBMaXN0cyBuZWFyYnkgYW5kIHVubG9jYXRlZCBzb3VyY2VzXG4jIE9wdGlvbnM6IG9uU2VsZWN0IC0gZnVuY3Rpb24gdG8gY2FsbCB3aXRoIHNvdXJjZSBkb2Mgd2hlbiBzZWxlY3RlZFxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBTb3VyY2VMaXN0UGFnZSBleHRlbmRzIFBhZ2VcbiAgZXZlbnRzOiBcbiAgICAnY2xpY2sgdHIudGFwcGFibGUnIDogJ3NvdXJjZUNsaWNrZWQnXG5cbiAgY3JlYXRlOiAtPlxuICAgIEBzZXRUaXRsZSAnTmVhcmJ5IFNvdXJjZXMnXG5cbiAgYWN0aXZhdGU6IC0+XG4gICAgQCRlbC5odG1sIHRlbXBsYXRlc1sncGFnZXMvU291cmNlTGlzdFBhZ2UnXSgpXG4gICAgQG5lYXJTb3VyY2VzID0gW11cbiAgICBAdW5sb2NhdGVkU291cmNlcyA9IFtdXG5cbiAgICAjIEZpbmQgbG9jYXRpb25cbiAgICBAbG9jYXRpb25GaW5kZXIgPSBuZXcgTG9jYXRpb25GaW5kZXIoKVxuICAgIEBsb2NhdGlvbkZpbmRlci5vbignZm91bmQnLCBAbG9jYXRpb25Gb3VuZCkub24oJ2Vycm9yJywgQGxvY2F0aW9uRXJyb3IpXG4gICAgQGxvY2F0aW9uRmluZGVyLmdldExvY2F0aW9uKClcbiAgICBAJChcIiNsb2NhdGlvbl9tc2dcIikuc2hvdygpXG5cbiAgICBAc2V0dXBCdXR0b25CYXIgW1xuICAgICAgeyBpY29uOiBcInBsdXMtMzIucG5nXCIsIGNsaWNrOiA9PiBAYWRkU291cmNlKCkgfVxuICAgIF1cblxuICAgICMgUXVlcnkgZGF0YWJhc2UgZm9yIHVubG9jYXRlZCBzb3VyY2VzICMgVE9ETyBvbmx5IGJ5IHVzZXJcbiAgICBAZGIuc291cmNlcy5maW5kKGdlbzogeyRleGlzdHM6ZmFsc2V9KS5mZXRjaCAoc291cmNlcykgPT5cbiAgICAgIEB1bmxvY2F0ZWRTb3VyY2VzID0gc291cmNlc1xuICAgICAgQHJlbmRlckxpc3QoKVxuXG4gIGFkZFNvdXJjZTogLT5cbiAgICBAcGFnZXIub3BlblBhZ2UocmVxdWlyZShcIi4vTmV3U291cmNlUGFnZVwiKSlcbiAgICBcbiAgbG9jYXRpb25Gb3VuZDogKHBvcykgPT5cbiAgICBAJChcIiNsb2NhdGlvbl9tc2dcIikuaGlkZSgpXG4gICAgc2VsZWN0b3IgPSBnZW86IFxuICAgICAgICAkbmVhcjogXG4gICAgICAgICAgJGdlb21ldHJ5OiBHZW9KU09OLnBvc1RvUG9pbnQocG9zKVxuXG4gICAgIyBRdWVyeSBkYXRhYmFzZSBmb3IgbmVhciBzb3VyY2VzXG4gICAgQGRiLnNvdXJjZXMuZmluZChzZWxlY3RvcikuZmV0Y2ggKHNvdXJjZXMpID0+XG4gICAgICBAbmVhclNvdXJjZXMgPSBzb3VyY2VzXG4gICAgICBAcmVuZGVyTGlzdCgpXG5cbiAgcmVuZGVyTGlzdDogLT5cbiAgICAjIEFwcGVuZCBsb2NhdGVkIGFuZCB1bmxvY2F0ZWQgc291cmNlc1xuICAgIHNvdXJjZXMgPSBAdW5sb2NhdGVkU291cmNlcy5jb25jYXQoQG5lYXJTb3VyY2VzKVxuICAgIEAkKFwiI3RhYmxlXCIpLmh0bWwgdGVtcGxhdGVzWydwYWdlcy9Tb3VyY2VMaXN0UGFnZV9pdGVtcyddKHNvdXJjZXM6c291cmNlcylcblxuICBsb2NhdGlvbkVycm9yOiAocG9zKSA9PlxuICAgIEAkKFwiI2xvY2F0aW9uX21zZ1wiKS5oaWRlKClcbiAgICBAcGFnZXIuZmxhc2ggXCJVbmFibGUgdG8gZGV0ZXJtaW5lIGxvY2F0aW9uXCIsIFwiZXJyb3JcIlxuXG4gIHNvdXJjZUNsaWNrZWQ6IChldikgLT5cbiAgICAjIFdyYXAgb25TZWxlY3RcbiAgICBvblNlbGVjdCA9IHVuZGVmaW5lZFxuICAgIGlmIEBvcHRpb25zLm9uU2VsZWN0XG4gICAgICBvblNlbGVjdCA9IChzb3VyY2UpID0+XG4gICAgICAgIEBwYWdlci5jbG9zZVBhZ2UoKVxuICAgICAgICBAb3B0aW9ucy5vblNlbGVjdChzb3VyY2UpXG4gICAgQHBhZ2VyLm9wZW5QYWdlKHJlcXVpcmUoXCIuL1NvdXJjZVBhZ2VcIiksIHsgX2lkOiBldi5jdXJyZW50VGFyZ2V0LmlkLCBvblNlbGVjdDogb25TZWxlY3R9KVxuXG4iLCJFSlNPTiA9IHt9OyAvLyBHbG9iYWwhXG52YXIgY3VzdG9tVHlwZXMgPSB7fTtcbi8vIEFkZCBhIGN1c3RvbSB0eXBlLCB1c2luZyBhIG1ldGhvZCBvZiB5b3VyIGNob2ljZSB0byBnZXQgdG8gYW5kXG4vLyBmcm9tIGEgYmFzaWMgSlNPTi1hYmxlIHJlcHJlc2VudGF0aW9uLiAgVGhlIGZhY3RvcnkgYXJndW1lbnRcbi8vIGlzIGEgZnVuY3Rpb24gb2YgSlNPTi1hYmxlIC0tPiB5b3VyIG9iamVjdFxuLy8gVGhlIHR5cGUgeW91IGFkZCBtdXN0IGhhdmU6XG4vLyAtIEEgY2xvbmUoKSBtZXRob2QsIHNvIHRoYXQgTWV0ZW9yIGNhbiBkZWVwLWNvcHkgaXQgd2hlbiBuZWNlc3NhcnkuXG4vLyAtIEEgZXF1YWxzKCkgbWV0aG9kLCBzbyB0aGF0IE1ldGVvciBjYW4gY29tcGFyZSBpdFxuLy8gLSBBIHRvSlNPTlZhbHVlKCkgbWV0aG9kLCBzbyB0aGF0IE1ldGVvciBjYW4gc2VyaWFsaXplIGl0XG4vLyAtIGEgdHlwZU5hbWUoKSBtZXRob2QsIHRvIHNob3cgaG93IHRvIGxvb2sgaXQgdXAgaW4gb3VyIHR5cGUgdGFibGUuXG4vLyBJdCBpcyBva2F5IGlmIHRoZXNlIG1ldGhvZHMgYXJlIG1vbmtleS1wYXRjaGVkIG9uLlxuRUpTT04uYWRkVHlwZSA9IGZ1bmN0aW9uIChuYW1lLCBmYWN0b3J5KSB7XG4gIGlmIChfLmhhcyhjdXN0b21UeXBlcywgbmFtZSkpXG4gICAgdGhyb3cgbmV3IEVycm9yKFwiVHlwZSBcIiArIG5hbWUgKyBcIiBhbHJlYWR5IHByZXNlbnRcIik7XG4gIGN1c3RvbVR5cGVzW25hbWVdID0gZmFjdG9yeTtcbn07XG5cbnZhciBidWlsdGluQ29udmVydGVycyA9IFtcbiAgeyAvLyBEYXRlXG4gICAgbWF0Y2hKU09OVmFsdWU6IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgIHJldHVybiBfLmhhcyhvYmosICckZGF0ZScpICYmIF8uc2l6ZShvYmopID09PSAxO1xuICAgIH0sXG4gICAgbWF0Y2hPYmplY3Q6IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgIHJldHVybiBvYmogaW5zdGFuY2VvZiBEYXRlO1xuICAgIH0sXG4gICAgdG9KU09OVmFsdWU6IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgIHJldHVybiB7JGRhdGU6IG9iai5nZXRUaW1lKCl9O1xuICAgIH0sXG4gICAgZnJvbUpTT05WYWx1ZTogZnVuY3Rpb24gKG9iaikge1xuICAgICAgcmV0dXJuIG5ldyBEYXRlKG9iai4kZGF0ZSk7XG4gICAgfVxuICB9LFxuICB7IC8vIEJpbmFyeVxuICAgIG1hdGNoSlNPTlZhbHVlOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICByZXR1cm4gXy5oYXMob2JqLCAnJGJpbmFyeScpICYmIF8uc2l6ZShvYmopID09PSAxO1xuICAgIH0sXG4gICAgbWF0Y2hPYmplY3Q6IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgIHJldHVybiB0eXBlb2YgVWludDhBcnJheSAhPT0gJ3VuZGVmaW5lZCcgJiYgb2JqIGluc3RhbmNlb2YgVWludDhBcnJheVxuICAgICAgICB8fCAob2JqICYmIF8uaGFzKG9iaiwgJyRVaW50OEFycmF5UG9seWZpbGwnKSk7XG4gICAgfSxcbiAgICB0b0pTT05WYWx1ZTogZnVuY3Rpb24gKG9iaikge1xuICAgICAgcmV0dXJuIHskYmluYXJ5OiBFSlNPTi5fYmFzZTY0RW5jb2RlKG9iail9O1xuICAgIH0sXG4gICAgZnJvbUpTT05WYWx1ZTogZnVuY3Rpb24gKG9iaikge1xuICAgICAgcmV0dXJuIEVKU09OLl9iYXNlNjREZWNvZGUob2JqLiRiaW5hcnkpO1xuICAgIH1cbiAgfSxcbiAgeyAvLyBFc2NhcGluZyBvbmUgbGV2ZWxcbiAgICBtYXRjaEpTT05WYWx1ZTogZnVuY3Rpb24gKG9iaikge1xuICAgICAgcmV0dXJuIF8uaGFzKG9iaiwgJyRlc2NhcGUnKSAmJiBfLnNpemUob2JqKSA9PT0gMTtcbiAgICB9LFxuICAgIG1hdGNoT2JqZWN0OiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICBpZiAoXy5pc0VtcHR5KG9iaikgfHwgXy5zaXplKG9iaikgPiAyKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBfLmFueShidWlsdGluQ29udmVydGVycywgZnVuY3Rpb24gKGNvbnZlcnRlcikge1xuICAgICAgICByZXR1cm4gY29udmVydGVyLm1hdGNoSlNPTlZhbHVlKG9iaik7XG4gICAgICB9KTtcbiAgICB9LFxuICAgIHRvSlNPTlZhbHVlOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICB2YXIgbmV3T2JqID0ge307XG4gICAgICBfLmVhY2gob2JqLCBmdW5jdGlvbiAodmFsdWUsIGtleSkge1xuICAgICAgICBuZXdPYmpba2V5XSA9IEVKU09OLnRvSlNPTlZhbHVlKHZhbHVlKTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHskZXNjYXBlOiBuZXdPYmp9O1xuICAgIH0sXG4gICAgZnJvbUpTT05WYWx1ZTogZnVuY3Rpb24gKG9iaikge1xuICAgICAgdmFyIG5ld09iaiA9IHt9O1xuICAgICAgXy5lYWNoKG9iai4kZXNjYXBlLCBmdW5jdGlvbiAodmFsdWUsIGtleSkge1xuICAgICAgICBuZXdPYmpba2V5XSA9IEVKU09OLmZyb21KU09OVmFsdWUodmFsdWUpO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gbmV3T2JqO1xuICAgIH1cbiAgfSxcbiAgeyAvLyBDdXN0b21cbiAgICBtYXRjaEpTT05WYWx1ZTogZnVuY3Rpb24gKG9iaikge1xuICAgICAgcmV0dXJuIF8uaGFzKG9iaiwgJyR0eXBlJykgJiYgXy5oYXMob2JqLCAnJHZhbHVlJykgJiYgXy5zaXplKG9iaikgPT09IDI7XG4gICAgfSxcbiAgICBtYXRjaE9iamVjdDogZnVuY3Rpb24gKG9iaikge1xuICAgICAgcmV0dXJuIEVKU09OLl9pc0N1c3RvbVR5cGUob2JqKTtcbiAgICB9LFxuICAgIHRvSlNPTlZhbHVlOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICByZXR1cm4geyR0eXBlOiBvYmoudHlwZU5hbWUoKSwgJHZhbHVlOiBvYmoudG9KU09OVmFsdWUoKX07XG4gICAgfSxcbiAgICBmcm9tSlNPTlZhbHVlOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICB2YXIgdHlwZU5hbWUgPSBvYmouJHR5cGU7XG4gICAgICB2YXIgY29udmVydGVyID0gY3VzdG9tVHlwZXNbdHlwZU5hbWVdO1xuICAgICAgcmV0dXJuIGNvbnZlcnRlcihvYmouJHZhbHVlKTtcbiAgICB9XG4gIH1cbl07XG5cbkVKU09OLl9pc0N1c3RvbVR5cGUgPSBmdW5jdGlvbiAob2JqKSB7XG4gIHJldHVybiBvYmogJiZcbiAgICB0eXBlb2Ygb2JqLnRvSlNPTlZhbHVlID09PSAnZnVuY3Rpb24nICYmXG4gICAgdHlwZW9mIG9iai50eXBlTmFtZSA9PT0gJ2Z1bmN0aW9uJyAmJlxuICAgIF8uaGFzKGN1c3RvbVR5cGVzLCBvYmoudHlwZU5hbWUoKSk7XG59O1xuXG5cbi8vZm9yIGJvdGggYXJyYXlzIGFuZCBvYmplY3RzLCBpbi1wbGFjZSBtb2RpZmljYXRpb24uXG52YXIgYWRqdXN0VHlwZXNUb0pTT05WYWx1ZSA9XG5FSlNPTi5fYWRqdXN0VHlwZXNUb0pTT05WYWx1ZSA9IGZ1bmN0aW9uIChvYmopIHtcbiAgaWYgKG9iaiA9PT0gbnVsbClcbiAgICByZXR1cm4gbnVsbDtcbiAgdmFyIG1heWJlQ2hhbmdlZCA9IHRvSlNPTlZhbHVlSGVscGVyKG9iaik7XG4gIGlmIChtYXliZUNoYW5nZWQgIT09IHVuZGVmaW5lZClcbiAgICByZXR1cm4gbWF5YmVDaGFuZ2VkO1xuICBfLmVhY2gob2JqLCBmdW5jdGlvbiAodmFsdWUsIGtleSkge1xuICAgIGlmICh0eXBlb2YgdmFsdWUgIT09ICdvYmplY3QnICYmIHZhbHVlICE9PSB1bmRlZmluZWQpXG4gICAgICByZXR1cm47IC8vIGNvbnRpbnVlXG4gICAgdmFyIGNoYW5nZWQgPSB0b0pTT05WYWx1ZUhlbHBlcih2YWx1ZSk7XG4gICAgaWYgKGNoYW5nZWQpIHtcbiAgICAgIG9ialtrZXldID0gY2hhbmdlZDtcbiAgICAgIHJldHVybjsgLy8gb24gdG8gdGhlIG5leHQga2V5XG4gICAgfVxuICAgIC8vIGlmIHdlIGdldCBoZXJlLCB2YWx1ZSBpcyBhbiBvYmplY3QgYnV0IG5vdCBhZGp1c3RhYmxlXG4gICAgLy8gYXQgdGhpcyBsZXZlbC4gIHJlY3Vyc2UuXG4gICAgYWRqdXN0VHlwZXNUb0pTT05WYWx1ZSh2YWx1ZSk7XG4gIH0pO1xuICByZXR1cm4gb2JqO1xufTtcblxuLy8gRWl0aGVyIHJldHVybiB0aGUgSlNPTi1jb21wYXRpYmxlIHZlcnNpb24gb2YgdGhlIGFyZ3VtZW50LCBvciB1bmRlZmluZWQgKGlmXG4vLyB0aGUgaXRlbSBpc24ndCBpdHNlbGYgcmVwbGFjZWFibGUsIGJ1dCBtYXliZSBzb21lIGZpZWxkcyBpbiBpdCBhcmUpXG52YXIgdG9KU09OVmFsdWVIZWxwZXIgPSBmdW5jdGlvbiAoaXRlbSkge1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGJ1aWx0aW5Db252ZXJ0ZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGNvbnZlcnRlciA9IGJ1aWx0aW5Db252ZXJ0ZXJzW2ldO1xuICAgIGlmIChjb252ZXJ0ZXIubWF0Y2hPYmplY3QoaXRlbSkpIHtcbiAgICAgIHJldHVybiBjb252ZXJ0ZXIudG9KU09OVmFsdWUoaXRlbSk7XG4gICAgfVxuICB9XG4gIHJldHVybiB1bmRlZmluZWQ7XG59O1xuXG5FSlNPTi50b0pTT05WYWx1ZSA9IGZ1bmN0aW9uIChpdGVtKSB7XG4gIHZhciBjaGFuZ2VkID0gdG9KU09OVmFsdWVIZWxwZXIoaXRlbSk7XG4gIGlmIChjaGFuZ2VkICE9PSB1bmRlZmluZWQpXG4gICAgcmV0dXJuIGNoYW5nZWQ7XG4gIGlmICh0eXBlb2YgaXRlbSA9PT0gJ29iamVjdCcpIHtcbiAgICBpdGVtID0gRUpTT04uY2xvbmUoaXRlbSk7XG4gICAgYWRqdXN0VHlwZXNUb0pTT05WYWx1ZShpdGVtKTtcbiAgfVxuICByZXR1cm4gaXRlbTtcbn07XG5cbi8vZm9yIGJvdGggYXJyYXlzIGFuZCBvYmplY3RzLiBUcmllcyBpdHMgYmVzdCB0byBqdXN0XG4vLyB1c2UgdGhlIG9iamVjdCB5b3UgaGFuZCBpdCwgYnV0IG1heSByZXR1cm4gc29tZXRoaW5nXG4vLyBkaWZmZXJlbnQgaWYgdGhlIG9iamVjdCB5b3UgaGFuZCBpdCBpdHNlbGYgbmVlZHMgY2hhbmdpbmcuXG52YXIgYWRqdXN0VHlwZXNGcm9tSlNPTlZhbHVlID1cbkVKU09OLl9hZGp1c3RUeXBlc0Zyb21KU09OVmFsdWUgPSBmdW5jdGlvbiAob2JqKSB7XG4gIGlmIChvYmogPT09IG51bGwpXG4gICAgcmV0dXJuIG51bGw7XG4gIHZhciBtYXliZUNoYW5nZWQgPSBmcm9tSlNPTlZhbHVlSGVscGVyKG9iaik7XG4gIGlmIChtYXliZUNoYW5nZWQgIT09IG9iailcbiAgICByZXR1cm4gbWF5YmVDaGFuZ2VkO1xuICBfLmVhY2gob2JqLCBmdW5jdGlvbiAodmFsdWUsIGtleSkge1xuICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnKSB7XG4gICAgICB2YXIgY2hhbmdlZCA9IGZyb21KU09OVmFsdWVIZWxwZXIodmFsdWUpO1xuICAgICAgaWYgKHZhbHVlICE9PSBjaGFuZ2VkKSB7XG4gICAgICAgIG9ialtrZXldID0gY2hhbmdlZDtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgLy8gaWYgd2UgZ2V0IGhlcmUsIHZhbHVlIGlzIGFuIG9iamVjdCBidXQgbm90IGFkanVzdGFibGVcbiAgICAgIC8vIGF0IHRoaXMgbGV2ZWwuICByZWN1cnNlLlxuICAgICAgYWRqdXN0VHlwZXNGcm9tSlNPTlZhbHVlKHZhbHVlKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gb2JqO1xufTtcblxuLy8gRWl0aGVyIHJldHVybiB0aGUgYXJndW1lbnQgY2hhbmdlZCB0byBoYXZlIHRoZSBub24tanNvblxuLy8gcmVwIG9mIGl0c2VsZiAodGhlIE9iamVjdCB2ZXJzaW9uKSBvciB0aGUgYXJndW1lbnQgaXRzZWxmLlxuXG4vLyBET0VTIE5PVCBSRUNVUlNFLiAgRm9yIGFjdHVhbGx5IGdldHRpbmcgdGhlIGZ1bGx5LWNoYW5nZWQgdmFsdWUsIHVzZVxuLy8gRUpTT04uZnJvbUpTT05WYWx1ZVxudmFyIGZyb21KU09OVmFsdWVIZWxwZXIgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUgIT09IG51bGwpIHtcbiAgICBpZiAoXy5zaXplKHZhbHVlKSA8PSAyXG4gICAgICAgICYmIF8uYWxsKHZhbHVlLCBmdW5jdGlvbiAodiwgaykge1xuICAgICAgICAgIHJldHVybiB0eXBlb2YgayA9PT0gJ3N0cmluZycgJiYgay5zdWJzdHIoMCwgMSkgPT09ICckJztcbiAgICAgICAgfSkpIHtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYnVpbHRpbkNvbnZlcnRlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGNvbnZlcnRlciA9IGJ1aWx0aW5Db252ZXJ0ZXJzW2ldO1xuICAgICAgICBpZiAoY29udmVydGVyLm1hdGNoSlNPTlZhbHVlKHZhbHVlKSkge1xuICAgICAgICAgIHJldHVybiBjb252ZXJ0ZXIuZnJvbUpTT05WYWx1ZSh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIHZhbHVlO1xufTtcblxuRUpTT04uZnJvbUpTT05WYWx1ZSA9IGZ1bmN0aW9uIChpdGVtKSB7XG4gIHZhciBjaGFuZ2VkID0gZnJvbUpTT05WYWx1ZUhlbHBlcihpdGVtKTtcbiAgaWYgKGNoYW5nZWQgPT09IGl0ZW0gJiYgdHlwZW9mIGl0ZW0gPT09ICdvYmplY3QnKSB7XG4gICAgaXRlbSA9IEVKU09OLmNsb25lKGl0ZW0pO1xuICAgIGFkanVzdFR5cGVzRnJvbUpTT05WYWx1ZShpdGVtKTtcbiAgICByZXR1cm4gaXRlbTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gY2hhbmdlZDtcbiAgfVxufTtcblxuRUpTT04uc3RyaW5naWZ5ID0gZnVuY3Rpb24gKGl0ZW0pIHtcbiAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KEVKU09OLnRvSlNPTlZhbHVlKGl0ZW0pKTtcbn07XG5cbkVKU09OLnBhcnNlID0gZnVuY3Rpb24gKGl0ZW0pIHtcbiAgcmV0dXJuIEVKU09OLmZyb21KU09OVmFsdWUoSlNPTi5wYXJzZShpdGVtKSk7XG59O1xuXG5FSlNPTi5pc0JpbmFyeSA9IGZ1bmN0aW9uIChvYmopIHtcbiAgcmV0dXJuICh0eXBlb2YgVWludDhBcnJheSAhPT0gJ3VuZGVmaW5lZCcgJiYgb2JqIGluc3RhbmNlb2YgVWludDhBcnJheSkgfHxcbiAgICAob2JqICYmIG9iai4kVWludDhBcnJheVBvbHlmaWxsKTtcbn07XG5cbkVKU09OLmVxdWFscyA9IGZ1bmN0aW9uIChhLCBiLCBvcHRpb25zKSB7XG4gIHZhciBpO1xuICB2YXIga2V5T3JkZXJTZW5zaXRpdmUgPSAhIShvcHRpb25zICYmIG9wdGlvbnMua2V5T3JkZXJTZW5zaXRpdmUpO1xuICBpZiAoYSA9PT0gYilcbiAgICByZXR1cm4gdHJ1ZTtcbiAgaWYgKCFhIHx8ICFiKSAvLyBpZiBlaXRoZXIgb25lIGlzIGZhbHN5LCB0aGV5J2QgaGF2ZSB0byBiZSA9PT0gdG8gYmUgZXF1YWxcbiAgICByZXR1cm4gZmFsc2U7XG4gIGlmICghKHR5cGVvZiBhID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgYiA9PT0gJ29iamVjdCcpKVxuICAgIHJldHVybiBmYWxzZTtcbiAgaWYgKGEgaW5zdGFuY2VvZiBEYXRlICYmIGIgaW5zdGFuY2VvZiBEYXRlKVxuICAgIHJldHVybiBhLnZhbHVlT2YoKSA9PT0gYi52YWx1ZU9mKCk7XG4gIGlmIChFSlNPTi5pc0JpbmFyeShhKSAmJiBFSlNPTi5pc0JpbmFyeShiKSkge1xuICAgIGlmIChhLmxlbmd0aCAhPT0gYi5sZW5ndGgpXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgZm9yIChpID0gMDsgaSA8IGEubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChhW2ldICE9PSBiW2ldKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIGlmICh0eXBlb2YgKGEuZXF1YWxzKSA9PT0gJ2Z1bmN0aW9uJylcbiAgICByZXR1cm4gYS5lcXVhbHMoYiwgb3B0aW9ucyk7XG4gIGlmIChhIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICBpZiAoIShiIGluc3RhbmNlb2YgQXJyYXkpKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIGlmIChhLmxlbmd0aCAhPT0gYi5sZW5ndGgpXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgZm9yIChpID0gMDsgaSA8IGEubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmICghRUpTT04uZXF1YWxzKGFbaV0sIGJbaV0sIG9wdGlvbnMpKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIC8vIGZhbGwgYmFjayB0byBzdHJ1Y3R1cmFsIGVxdWFsaXR5IG9mIG9iamVjdHNcbiAgdmFyIHJldDtcbiAgaWYgKGtleU9yZGVyU2Vuc2l0aXZlKSB7XG4gICAgdmFyIGJLZXlzID0gW107XG4gICAgXy5lYWNoKGIsIGZ1bmN0aW9uICh2YWwsIHgpIHtcbiAgICAgICAgYktleXMucHVzaCh4KTtcbiAgICB9KTtcbiAgICBpID0gMDtcbiAgICByZXQgPSBfLmFsbChhLCBmdW5jdGlvbiAodmFsLCB4KSB7XG4gICAgICBpZiAoaSA+PSBiS2V5cy5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgaWYgKHggIT09IGJLZXlzW2ldKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGlmICghRUpTT04uZXF1YWxzKHZhbCwgYltiS2V5c1tpXV0sIG9wdGlvbnMpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGkrKztcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0pO1xuICAgIHJldHVybiByZXQgJiYgaSA9PT0gYktleXMubGVuZ3RoO1xuICB9IGVsc2Uge1xuICAgIGkgPSAwO1xuICAgIHJldCA9IF8uYWxsKGEsIGZ1bmN0aW9uICh2YWwsIGtleSkge1xuICAgICAgaWYgKCFfLmhhcyhiLCBrZXkpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGlmICghRUpTT04uZXF1YWxzKHZhbCwgYltrZXldLCBvcHRpb25zKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBpKys7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9KTtcbiAgICByZXR1cm4gcmV0ICYmIF8uc2l6ZShiKSA9PT0gaTtcbiAgfVxufTtcblxuRUpTT04uY2xvbmUgPSBmdW5jdGlvbiAodikge1xuICB2YXIgcmV0O1xuICBpZiAodHlwZW9mIHYgIT09IFwib2JqZWN0XCIpXG4gICAgcmV0dXJuIHY7XG4gIGlmICh2ID09PSBudWxsKVxuICAgIHJldHVybiBudWxsOyAvLyBudWxsIGhhcyB0eXBlb2YgXCJvYmplY3RcIlxuICBpZiAodiBpbnN0YW5jZW9mIERhdGUpXG4gICAgcmV0dXJuIG5ldyBEYXRlKHYuZ2V0VGltZSgpKTtcbiAgaWYgKEVKU09OLmlzQmluYXJ5KHYpKSB7XG4gICAgcmV0ID0gRUpTT04ubmV3QmluYXJ5KHYubGVuZ3RoKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHYubGVuZ3RoOyBpKyspIHtcbiAgICAgIHJldFtpXSA9IHZbaV07XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG4gIH1cbiAgaWYgKF8uaXNBcnJheSh2KSB8fCBfLmlzQXJndW1lbnRzKHYpKSB7XG4gICAgLy8gRm9yIHNvbWUgcmVhc29uLCBfLm1hcCBkb2Vzbid0IHdvcmsgaW4gdGhpcyBjb250ZXh0IG9uIE9wZXJhICh3ZWlyZCB0ZXN0XG4gICAgLy8gZmFpbHVyZXMpLlxuICAgIHJldCA9IFtdO1xuICAgIGZvciAoaSA9IDA7IGkgPCB2Lmxlbmd0aDsgaSsrKVxuICAgICAgcmV0W2ldID0gRUpTT04uY2xvbmUodltpXSk7XG4gICAgcmV0dXJuIHJldDtcbiAgfVxuICAvLyBoYW5kbGUgZ2VuZXJhbCB1c2VyLWRlZmluZWQgdHlwZWQgT2JqZWN0cyBpZiB0aGV5IGhhdmUgYSBjbG9uZSBtZXRob2RcbiAgaWYgKHR5cGVvZiB2LmNsb25lID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIHYuY2xvbmUoKTtcbiAgfVxuICAvLyBoYW5kbGUgb3RoZXIgb2JqZWN0c1xuICByZXQgPSB7fTtcbiAgXy5lYWNoKHYsIGZ1bmN0aW9uICh2YWx1ZSwga2V5KSB7XG4gICAgcmV0W2tleV0gPSBFSlNPTi5jbG9uZSh2YWx1ZSk7XG4gIH0pO1xuICByZXR1cm4gcmV0O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBFSlNPTjsiLCJjbGFzcyBQYWdlIGV4dGVuZHMgQmFja2JvbmUuVmlld1xuICBjb25zdHJ1Y3RvcjogKGN0eCwgb3B0aW9ucz17fSkgLT5cbiAgICBzdXBlcihvcHRpb25zKVxuICAgIEBjdHggPSBjdHhcblxuICAgICMgTWl4IGluIGNvbnRleHQgZm9yIGNvbnZlbmllbmNlXG4gICAgXy5leHRlbmQoQCwgY3R4KSBcblxuICAgICMgU3RvcmUgc3Vidmlld3NcbiAgICBAX3N1YnZpZXdzID0gW11cblxuICAgICMgU2V0dXAgZGVmYXVsdCBidXR0b24gYmFyXG4gICAgQGJ1dHRvbkJhciA9IG5ldyBCdXR0b25CYXIoKVxuXG4gICAgIyBTZXR1cCBkZWZhdWx0IGNvbnRleHQgbWVudVxuICAgIEBjb250ZXh0TWVudSA9IG5ldyBDb250ZXh0TWVudSgpXG5cbiAgY2xhc3NOYW1lOiBcInBhZ2VcIlxuICBjcmVhdGU6IC0+XG4gIGFjdGl2YXRlOiAtPlxuICBkZWFjdGl2YXRlOiAtPlxuICBkZXN0cm95OiAtPlxuICByZW1vdmU6IC0+XG4gICAgQHJlbW92ZVN1YnZpZXdzKClcbiAgICBzdXBlcigpXG5cbiAgZ2V0VGl0bGU6IC0+IEB0aXRsZVxuXG4gIHNldFRpdGxlOiAodGl0bGUpIC0+XG4gICAgQHRpdGxlID0gdGl0bGVcbiAgICBAdHJpZ2dlciAnY2hhbmdlOnRpdGxlJ1xuXG4gIGFkZFN1YnZpZXc6ICh2aWV3KSAtPlxuICAgIEBfc3Vidmlld3MucHVzaCh2aWV3KVxuXG4gIHJlbW92ZVN1YnZpZXdzOiAtPlxuICAgIGZvciBzdWJ2aWV3IGluIEBfc3Vidmlld3NcbiAgICAgIHN1YnZpZXcucmVtb3ZlKClcblxuICBnZXRCdXR0b25CYXI6IC0+XG4gICAgcmV0dXJuIEBidXR0b25CYXJcblxuICBnZXRDb250ZXh0TWVudTogLT5cbiAgICByZXR1cm4gQGNvbnRleHRNZW51XG5cbiAgc2V0dXBCdXR0b25CYXI6IChpdGVtcykgLT5cbiAgICAjIFNldHVwIGJ1dHRvbiBiYXJcbiAgICBAYnV0dG9uQmFyLnNldHVwKGl0ZW1zKVxuXG4gIHNldHVwQ29udGV4dE1lbnU6IChpdGVtcykgLT5cbiAgICAjIFNldHVwIGNvbnRleHQgbWVudVxuICAgIEBjb250ZXh0TWVudS5zZXR1cChpdGVtcylcblxuIyBTdGFuZGFyZCBidXR0b24gYmFyLiBFYWNoIGl0ZW1cbiMgaGFzIG9wdGlvbmFsIFwidGV4dFwiLCBvcHRpb25hbCBcImljb25cIiBhbmQgXCJjbGlja1wiIChhY3Rpb24pLlxuIyBGb3Igc3VibWVudSwgYWRkIGFycmF5IHRvIFwibWVudVwiLiBPbmUgbGV2ZWwgbmVzdGluZyBvbmx5LlxuY2xhc3MgQnV0dG9uQmFyIGV4dGVuZHMgQmFja2JvbmUuVmlld1xuICBldmVudHM6IFxuICAgIFwiY2xpY2sgLm1lbnVpdGVtXCIgOiBcImNsaWNrTWVudUl0ZW1cIlxuXG4gIHNldHVwOiAoaXRlbXMpIC0+XG4gICAgQGl0ZW1zID0gaXRlbXNcbiAgICBAaXRlbU1hcCA9IHt9XG5cbiAgICAjIEFkZCBpZCB0byBhbGwgaXRlbXMgaWYgbm90IHByZXNlbnRcbiAgICBpZCA9IDFcbiAgICBmb3IgaXRlbSBpbiBpdGVtc1xuICAgICAgaWYgbm90IGl0ZW0uaWQ/XG4gICAgICAgIGl0ZW0uaWQgPSBpZFxuICAgICAgICBpZD1pZCsxXG4gICAgICBAaXRlbU1hcFtpdGVtLmlkXSA9IGl0ZW1cblxuICAgICAgIyBBZGQgdG8gc3VibWVudVxuICAgICAgaWYgaXRlbS5tZW51XG4gICAgICAgIGZvciBzdWJpdGVtIGluIGl0ZW0ubWVudVxuICAgICAgICAgIGlmIG5vdCBzdWJpdGVtLmlkP1xuICAgICAgICAgICAgc3ViaXRlbS5pZCA9IGlkLnRvU3RyaW5nKClcbiAgICAgICAgICAgIGlkPWlkKzFcbiAgICAgICAgICBAaXRlbU1hcFtzdWJpdGVtLmlkXSA9IHN1Yml0ZW1cblxuICAgIEByZW5kZXIoKVxuXG4gIHJlbmRlcjogLT5cbiAgICBAJGVsLmh0bWwgdGVtcGxhdGVzWydCdXR0b25CYXInXShpdGVtczogQGl0ZW1zKVxuXG4gIGNsaWNrTWVudUl0ZW06IChlKSAtPlxuICAgIGlkID0gZS5jdXJyZW50VGFyZ2V0LmlkXG4gICAgaXRlbSA9IEBpdGVtTWFwW2lkXVxuICAgIGlmIGl0ZW0uY2xpY2s/XG4gICAgICBpdGVtLmNsaWNrKClcblxuIyBDb250ZXh0IG1lbnUgdG8gZ28gaW4gc2xpZGUgbWVudVxuIyBTdGFuZGFyZCBidXR0b24gYmFyLiBFYWNoIGl0ZW0gXCJ0ZXh0XCIsIG9wdGlvbmFsIFwiZ2x5cGhcIiAoYm9vdHN0cmFwIGdseXBoIHdpdGhvdXQgaWNvbi0gcHJlZml4KSBhbmQgXCJjbGlja1wiIChhY3Rpb24pLlxuY2xhc3MgQ29udGV4dE1lbnUgZXh0ZW5kcyBCYWNrYm9uZS5WaWV3XG4gIGV2ZW50czogXG4gICAgXCJjbGljayAubWVudWl0ZW1cIiA6IFwiY2xpY2tNZW51SXRlbVwiXG5cbiAgc2V0dXA6IChpdGVtcykgLT5cbiAgICBAaXRlbXMgPSBpdGVtc1xuICAgIEBpdGVtTWFwID0ge31cblxuICAgICMgQWRkIGlkIHRvIGFsbCBpdGVtcyBpZiBub3QgcHJlc2VudFxuICAgIGlkID0gMVxuICAgIGZvciBpdGVtIGluIGl0ZW1zXG4gICAgICBpZiBub3QgaXRlbS5pZD9cbiAgICAgICAgaXRlbS5pZCA9IGlkXG4gICAgICAgIGlkPWlkKzFcbiAgICAgIEBpdGVtTWFwW2l0ZW0uaWRdID0gaXRlbVxuXG4gICAgQHJlbmRlcigpXG5cbiAgcmVuZGVyOiAtPlxuICAgIEAkZWwuaHRtbCB0ZW1wbGF0ZXNbJ0NvbnRleHRNZW51J10oaXRlbXM6IEBpdGVtcylcblxuICBjbGlja01lbnVJdGVtOiAoZSkgLT5cbiAgICBpZCA9IGUuY3VycmVudFRhcmdldC5pZFxuICAgIGl0ZW0gPSBAaXRlbU1hcFtpZF1cbiAgICBpZiBpdGVtLmNsaWNrP1xuICAgICAgaXRlbS5jbGljaygpXG5cbm1vZHVsZS5leHBvcnRzID0gUGFnZSIsIlBhZ2UgPSByZXF1aXJlKFwiLi4vUGFnZVwiKVxuTG9jYXRpb25WaWV3ID0gcmVxdWlyZSAoXCIuLi9Mb2NhdGlvblZpZXdcIilcbmZvcm1zID0gcmVxdWlyZSAnLi4vZm9ybXMnXG5cblxuIyBEaXNwbGF5cyBhIHNvdXJjZVxuIyBPcHRpb25zOiBzZXRMb2NhdGlvbiAtIHRydWUgdG8gYXV0b3NldCBsb2NhdGlvblxuIyBvblNlbGVjdCAtIGNhbGwgd2hlbiBzb3VyY2UgaXMgc2VsZWN0ZWQgdmlhIGJ1dHRvbiB0aGF0IGFwcGVhcnNcbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgU291cmNlUGFnZSBleHRlbmRzIFBhZ2VcbiAgZXZlbnRzOlxuICAgICdjbGljayAjZWRpdF9zb3VyY2VfYnV0dG9uJyA6ICdlZGl0U291cmNlJ1xuICAgICdjbGljayAjYWRkX3Rlc3RfYnV0dG9uJyA6ICdhZGRUZXN0J1xuICAgICdjbGljayAudGVzdCcgOiAnb3BlblRlc3QnXG4gICAgJ2NsaWNrICNzZWxlY3Rfc291cmNlJyA6ICdzZWxlY3RTb3VyY2UnXG5cbiAgY3JlYXRlOiAtPlxuICAgIEBzZXRMb2NhdGlvbiA9IEBvcHRpb25zLnNldExvY2F0aW9uXG5cbiAgYWN0aXZhdGU6IC0+XG4gICAgQGRiLnNvdXJjZXMuZmluZE9uZSB7X2lkOiBAb3B0aW9ucy5faWR9LCAoc291cmNlKSA9PlxuICAgICAgQHNvdXJjZSA9IHNvdXJjZVxuICAgICAgQHJlbmRlcigpXG5cbiAgcmVuZGVyOiAtPlxuICAgIEBzZXRUaXRsZSBcIlNvdXJjZSBcIiArIEBzb3VyY2UuY29kZVxuXG4gICAgQHNldHVwQ29udGV4dE1lbnUgW1xuICAgICAgeyBnbHlwaDogJ3JlbW92ZScsIHRleHQ6IFwiRGVsZXRlIFNvdXJjZVwiLCBjbGljazogPT4gQGRlbGV0ZVNvdXJjZSgpIH1cbiAgICBdXG5cbiAgICBAc2V0dXBCdXR0b25CYXIgW1xuICAgICAgeyBpY29uOiBcInBsdXMtMzIucG5nXCIsIG1lbnU6IFtcbiAgICAgICAgeyB0ZXh0OiBcIlN0YXJ0IFdhdGVyIFRlc3RcIiwgY2xpY2s6ID0+IEBhZGRUZXN0KCkgfVxuICAgICAgICB7IHRleHQ6IFwiQWRkIE5vdGVcIiwgY2xpY2s6ID0+IEBhZGROb3RlKCkgfVxuICAgICAgXX1cbiAgICBdXG5cbiAgICAjIFJlLXJlbmRlciB0ZW1wbGF0ZVxuICAgIEByZW1vdmVTdWJ2aWV3cygpXG4gICAgQCRlbC5odG1sIHRlbXBsYXRlc1sncGFnZXMvU291cmNlUGFnZSddKHNvdXJjZTogQHNvdXJjZSwgc2VsZWN0OiBAb3B0aW9ucy5vblNlbGVjdD8pXG5cbiAgICAjIFNldCBzb3VyY2UgdHlwZVxuICAgIGlmIEBzb3VyY2UudHlwZT9cbiAgICAgIEBkYi5zb3VyY2VfdHlwZXMuZmluZE9uZSB7Y29kZTogQHNvdXJjZS50eXBlfSwgKHNvdXJjZVR5cGUpID0+XG4gICAgICAgIGlmIHNvdXJjZVR5cGU/IHRoZW4gQCQoXCIjc291cmNlX3R5cGVcIikudGV4dChzb3VyY2VUeXBlLm5hbWUpXG5cbiAgICAjIEFkZCBsb2NhdGlvbiB2aWV3XG4gICAgbG9jYXRpb25WaWV3ID0gbmV3IExvY2F0aW9uVmlldyhsb2M6IEBzb3VyY2UuZ2VvKVxuICAgIGlmIEBzZXRMb2NhdGlvblxuICAgICAgbG9jYXRpb25WaWV3LnNldExvY2F0aW9uKClcbiAgICAgIEBzZXRMb2NhdGlvbiA9IGZhbHNlXG5cbiAgICBAbGlzdGVuVG8gbG9jYXRpb25WaWV3LCAnbG9jYXRpb25zZXQnLCAobG9jKSAtPlxuICAgICAgQHNvdXJjZS5nZW8gPSBsb2NcbiAgICAgIEBkYi5zb3VyY2VzLnVwc2VydCBAc291cmNlLCA9PiBAcmVuZGVyKClcblxuICAgIEBsaXN0ZW5UbyBsb2NhdGlvblZpZXcsICdtYXAnLCAobG9jKSAtPlxuICAgICAgQHBhZ2VyLm9wZW5QYWdlKHJlcXVpcmUoXCIuL1NvdXJjZU1hcFBhZ2VcIiksIHtpbml0aWFsR2VvOiBsb2N9KVxuICAgICAgXG4gICAgQGFkZFN1YnZpZXcobG9jYXRpb25WaWV3KVxuICAgIEAkKFwiI2xvY2F0aW9uXCIpLmFwcGVuZChsb2NhdGlvblZpZXcuZWwpXG5cbiAgICAjIEFkZCB0ZXN0c1xuICAgIEBkYi50ZXN0cy5maW5kKHtzb3VyY2U6IEBzb3VyY2UuY29kZX0pLmZldGNoICh0ZXN0cykgLT5cbiAgICAgIEAkKFwiI3Rlc3RzXCIpLmh0bWwgdGVtcGxhdGVzWydwYWdlcy9Tb3VyY2VQYWdlX3Rlc3RzJ10odGVzdHM6dGVzdHMpXG5cbiAgICAjIEFkZCBwaG90b3MgIyBUT0RPIHdpcmUgbW9kZWwgdG8gYWN0dWFsIGRiXG4gICAgcGhvdG9zVmlldyA9IG5ldyBmb3Jtcy5QaG90b3NRdWVzdGlvblxuICAgICAgaWQ6ICdwaG90b3MnXG4gICAgICBtb2RlbDogbmV3IEJhY2tib25lLk1vZGVsKEBzb3VyY2UpXG4gICAgICBwcm9tcHQ6ICdQaG90b3MnXG4gICAgcGhvdG9zVmlldy5tb2RlbC5vbiAnY2hhbmdlJywgPT5cbiAgICAgIEBkYi5zb3VyY2VzLnVwc2VydCBAc291cmNlLnRvSlNPTigpLCA9PiBAcmVuZGVyKClcblxuICBlZGl0U291cmNlOiAtPlxuICAgIEBwYWdlci5vcGVuUGFnZShyZXF1aXJlKFwiLi9Tb3VyY2VFZGl0UGFnZVwiKSwgeyBfaWQ6IEBfaWR9KVxuXG4gIGRlbGV0ZVNvdXJjZTogLT5cbiAgICBpZiBjb25maXJtKFwiUGVybWFuZW50bHkgZGVsZXRlIHNvdXJjZT9cIilcbiAgICAgIEBkYi5zb3VyY2VzLnJlbW92ZSBAc291cmNlLl9pZCwgPT5cbiAgICAgICAgQHBhZ2VyLmNsb3NlUGFnZSgpXG5cbiAgYWRkVGVzdDogLT5cbiAgICBAcGFnZXIub3BlblBhZ2UocmVxdWlyZShcIi4vTmV3VGVzdFBhZ2VcIiksIHsgc291cmNlOiBAc291cmNlLmNvZGV9KVxuXG4gIG9wZW5UZXN0OiAoZXYpIC0+XG4gICAgQHBhZ2VyLm9wZW5QYWdlKHJlcXVpcmUoXCIuL1Rlc3RQYWdlXCIpLCB7IF9pZDogZXYuY3VycmVudFRhcmdldC5pZH0pXG5cbiAgYWRkTm90ZTogLT5cbiAgICBhbGVydChcIlRPRE9cIilcblxuICBzZWxlY3RTb3VyY2U6IC0+XG4gICAgaWYgQG9wdGlvbnMub25TZWxlY3Q/XG4gICAgICBAcGFnZXIuY2xvc2VQYWdlKClcbiAgICAgIEBvcHRpb25zLm9uU2VsZWN0KEBzb3VyY2UpIiwiUGFnZSA9IHJlcXVpcmUgJy4uL1BhZ2UnXG5mb3JtcyA9IHJlcXVpcmUgJy4uL2Zvcm1zJ1xuU291cmNlUGFnZSA9IHJlcXVpcmUgXCIuL1NvdXJjZVBhZ2VcIlxuXG4jIEFsbG93cyBjcmVhdGluZyBvZiBhIHNvdXJjZVxuIyBUT0RPIGxvZ2luIHJlcXVpcmVkXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIE5ld1NvdXJjZVBhZ2UgZXh0ZW5kcyBQYWdlXG4gIGFjdGl2YXRlOiAtPlxuICAgIEBzZXRUaXRsZSBcIk5ldyBTb3VyY2VcIlxuXG4gICAgIyBDcmVhdGUgbW9kZWwgZnJvbSBzb3VyY2VcbiAgICBAbW9kZWwgPSBuZXcgQmFja2JvbmUuTW9kZWwoc2V0TG9jYXRpb246IHRydWUpXG4gIFxuICAgICMgQ3JlYXRlIHF1ZXN0aW9uc1xuICAgIHNvdXJjZVR5cGVzUXVlc3Rpb24gPSBuZXcgZm9ybXMuRHJvcGRvd25RdWVzdGlvblxuICAgICAgaWQ6ICd0eXBlJ1xuICAgICAgbW9kZWw6IEBtb2RlbFxuICAgICAgcHJvbXB0OiAnRW50ZXIgU291cmNlIFR5cGUnXG4gICAgICBvcHRpb25zOiBbXVxuICAgIEBkYi5zb3VyY2VfdHlwZXMuZmluZCh7fSkuZmV0Y2ggKHNvdXJjZVR5cGVzKSA9PlxuICAgICAgIyBGaWxsIHNvdXJjZSB0eXBlc1xuICAgICAgc291cmNlVHlwZXNRdWVzdGlvbi5zZXRPcHRpb25zIF8ubWFwKHNvdXJjZVR5cGVzLCAoc3QpID0+IFtzdC5jb2RlLCBzdC5uYW1lXSlcblxuICAgIHNhdmVDYW5jZWxGb3JtID0gbmV3IGZvcm1zLlNhdmVDYW5jZWxGb3JtXG4gICAgICBjb250ZW50czogW1xuICAgICAgICBzb3VyY2VUeXBlc1F1ZXN0aW9uXG4gICAgICAgIG5ldyBmb3Jtcy5UZXh0UXVlc3Rpb25cbiAgICAgICAgICBpZDogJ25hbWUnXG4gICAgICAgICAgbW9kZWw6IEBtb2RlbFxuICAgICAgICAgIHByb21wdDogJ0VudGVyIG9wdGlvbmFsIG5hbWUnXG4gICAgICAgIG5ldyBmb3Jtcy5UZXh0UXVlc3Rpb25cbiAgICAgICAgICBpZDogJ2Rlc2MnXG4gICAgICAgICAgbW9kZWw6IEBtb2RlbFxuICAgICAgICAgIHByb21wdDogJ0VudGVyIG9wdGlvbmFsIGRlc2NyaXB0aW9uJ1xuICAgICAgICBuZXcgZm9ybXMuUmFkaW9RdWVzdGlvblxuICAgICAgICAgIGlkOiAnc2V0TG9jYXRpb24nXG4gICAgICAgICAgbW9kZWw6IEBtb2RlbFxuICAgICAgICAgIHByb21wdDogJ1NldCB0byBjdXJyZW50IGxvY2F0aW9uPydcbiAgICAgICAgICBvcHRpb25zOiBbW3RydWUsICdZZXMnXSwgW2ZhbHNlLCAnTm8nXV1cbiAgICAgIF1cblxuICAgIEAkZWwuZW1wdHkoKS5hcHBlbmQoc2F2ZUNhbmNlbEZvcm0uZWwpXG5cbiAgICBAbGlzdGVuVG8gc2F2ZUNhbmNlbEZvcm0sICdzYXZlJywgPT5cbiAgICAgIHNvdXJjZSA9IF8ucGljayhAbW9kZWwudG9KU09OKCksICduYW1lJywgJ2Rlc2MnLCAndHlwZScpXG4gICAgICBzb3VyY2UuY29kZSA9IFwiXCIrTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpKjEwMDAwMDApICAjIFRPRE8gcmVhbCBjb2Rlc1xuICAgICAgQGRiLnNvdXJjZXMudXBzZXJ0IHNvdXJjZSwgKHNvdXJjZSkgPT4gXG4gICAgICAgIEBwYWdlci5jbG9zZVBhZ2UoU291cmNlUGFnZSwgeyBfaWQ6IHNvdXJjZS5faWQsIHNldExvY2F0aW9uOiBAbW9kZWwuZ2V0KCdzZXRMb2NhdGlvbicpfSlcblxuICAgIEBsaXN0ZW5UbyBzYXZlQ2FuY2VsRm9ybSwgJ2NhbmNlbCcsID0+XG4gICAgICBAcGFnZXIuY2xvc2VQYWdlKClcbiAiLCJQYWdlID0gcmVxdWlyZSBcIi4uL1BhZ2VcIlxuVGVzdFBhZ2UgPSByZXF1aXJlIFwiLi9UZXN0UGFnZVwiXG5cbiMgUGFyYW1ldGVyIGlzIG9wdGlvbmFsIHNvdXJjZSBjb2RlXG5jbGFzcyBOZXdUZXN0UGFnZSBleHRlbmRzIFBhZ2VcbiAgZXZlbnRzOiBcbiAgICBcImNsaWNrIC50ZXN0XCIgOiBcInN0YXJ0VGVzdFwiXG5cbiAgYWN0aXZhdGU6IC0+XG4gICAgQHNldFRpdGxlIFwiU2VsZWN0IFRlc3RcIlxuXG4gICAgQGRiLmZvcm1zLmZpbmQoe3R5cGU6XCJXYXRlclRlc3RcIn0pLmZldGNoIChmb3JtcykgPT5cbiAgICAgIEBmb3JtcyA9IGZvcm1zXG4gICAgICBAJGVsLmh0bWwgdGVtcGxhdGVzWydwYWdlcy9OZXdUZXN0UGFnZSddKGZvcm1zOmZvcm1zKVxuXG4gIHN0YXJ0VGVzdDogKGV2KSAtPlxuICAgIHRlc3RDb2RlID0gZXYuY3VycmVudFRhcmdldC5pZFxuXG4gICAgIyBDcmVhdGUgdGVzdFxuICAgIHRlc3QgPSB7XG4gICAgICBzb3VyY2U6IEBvcHRpb25zLnNvdXJjZVxuICAgICAgdHlwZTogdGVzdENvZGVcbiAgICAgIGNvbXBsZXRlZDogbnVsbFxuICAgICAgc3RhcnRlZDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpXG4gICAgICBuYW1lOiBfLmZpbmRXaGVyZShAZm9ybXMsIHsgY29kZTogdGVzdENvZGUgfSkubmFtZSAgIyBUT0RPIGRvbid0IHB1dCBuYW1lIGhlcmU/IEFsc28gZml4IGluIFRlc3RMaXN0UGFnZVxuICAgIH1cbiAgICBAZGIudGVzdHMudXBzZXJ0IHRlc3QsICh0ZXN0KSA9PlxuICAgICAgQHBhZ2VyLmNsb3NlUGFnZShUZXN0UGFnZSwgeyBfaWQ6IHRlc3QuX2lkIH0pXG5cbm1vZHVsZS5leHBvcnRzID0gTmV3VGVzdFBhZ2UiLCJQYWdlID0gcmVxdWlyZSBcIi4uL1BhZ2VcIlxuU291cmNlUGFnZSA9IHJlcXVpcmUgXCIuL1NvdXJjZVBhZ2VcIlxuSXRlbVRyYWNrZXIgPSByZXF1aXJlIFwiLi4vSXRlbVRyYWNrZXJcIlxuTG9jYXRpb25GaW5kZXIgPSByZXF1aXJlICcuLi9Mb2NhdGlvbkZpbmRlcidcbkdlb0pTT04gPSByZXF1aXJlICcuLi9HZW9KU09OJ1xuXG4jIE1hcCBvZiB3YXRlciBzb3VyY2VzLiBPcHRpb25zIGluY2x1ZGU6XG4jIGluaXRpYWxHZW86IEdlb21ldHJ5IHRvIHpvb20gdG8uIFBvaW50IG9ubHkgc3VwcG9ydGVkLlxuY2xhc3MgU291cmNlTWFwUGFnZSBleHRlbmRzIFBhZ2VcbiAgY3JlYXRlOiAtPlxuICAgIEBzZXRUaXRsZSBcIlNvdXJjZSBNYXBcIlxuXG4gICAgIyBDYWxjdWxhdGUgaGVpZ2h0XG4gICAgQCRlbC5odG1sIHRlbXBsYXRlc1sncGFnZXMvU291cmNlTWFwUGFnZSddKClcblxuICAgIEwuSWNvbi5EZWZhdWx0LmltYWdlUGF0aCA9IFwiaW1nL2xlYWZsZXRcIlxuICAgIEBtYXAgPSBMLm1hcCh0aGlzLiQoXCIjbWFwXCIpWzBdKVxuICAgIEwuY29udHJvbC5zY2FsZShpbXBlcmlhbDpmYWxzZSkuYWRkVG8oQG1hcClcbiAgICBAcmVzaXplTWFwKClcblxuICAgICMgUmVjYWxjdWxhdGUgb24gcmVzaXplXG4gICAgJCh3aW5kb3cpLm9uKCdyZXNpemUnLCBAcmVzaXplTWFwKVxuXG4gICAgIyBTZXR1cCBtYXAgdGlsZXNcbiAgICBzZXR1cE1hcFRpbGVzKCkuYWRkVG8oQG1hcClcblxuICAgICMgU2V0dXAgbWFya2VyIGRpc3BsYXlcbiAgICBAc291cmNlRGlzcGxheSA9IG5ldyBTb3VyY2VEaXNwbGF5KEBtYXAsIEBkYiwgQHBhZ2VyKVxuXG4gICAgIyBUT0RPIHpvb20gdG8gbGFzdCBrbm93biBib3VuZHNcbiAgICBcbiAgICAjIFNldHVwIGluaXRpYWwgem9vbVxuICAgIGlmIEBvcHRpb25zLmluaXRpYWxHZW8gYW5kIEBvcHRpb25zLmluaXRpYWxHZW8udHlwZT09XCJQb2ludFwiXG4gICAgICBAbWFwLnNldFZpZXcoTC5HZW9KU09OLmNvb3Jkc1RvTGF0TG5nKEBvcHRpb25zLmluaXRpYWxHZW8uY29vcmRpbmF0ZXMpLCAxNSlcblxuICAgICMgU2V0dXAgbG9jYWx0aW9uIGRpc3BsYXlcbiAgICBAbG9jYXRpb25EaXNwbGF5ID0gbmV3IExvY2F0aW9uRGlzcGxheShAbWFwLCBub3QgQG9wdGlvbnMuaW5pdGlhbEdlbz8pXG5cbiAgZGVzdHJveTogLT5cbiAgICAkKHdpbmRvdykub2ZmKCdyZXNpemUnLCBAcmVzaXplTWFwKVxuICAgIEBsb2NhdGlvbkRpc3BsYXkuc3RvcCgpXG5cbiAgcmVzaXplTWFwOiA9PlxuICAgICMgQ2FsY3VsYXRlIG1hcCBoZWlnaHRcbiAgICBtYXBIZWlnaHQgPSAkKFwiaHRtbFwiKS5oZWlnaHQoKSAtIDQwXG4gICAgJChcIiNtYXBcIikuY3NzKFwiaGVpZ2h0XCIsIG1hcEhlaWdodCArIFwicHhcIilcbiAgICBAbWFwLmludmFsaWRhdGVTaXplKClcblxuXG5zZXR1cE1hcFRpbGVzID0gLT5cbiAgbWFwcXVlc3RVcmwgPSAnaHR0cDovL3tzfS5tcWNkbi5jb20vdGlsZXMvMS4wLjAvb3NtL3t6fS97eH0ve3l9LnBuZydcbiAgc3ViRG9tYWlucyA9IFsnb3RpbGUxJywnb3RpbGUyJywnb3RpbGUzJywnb3RpbGU0J11cbiAgbWFwcXVlc3RBdHRyaWIgPSAnRGF0YSwgaW1hZ2VyeSBhbmQgbWFwIGluZm9ybWF0aW9uIHByb3ZpZGVkIGJ5IDxhIGhyZWY9XCJodHRwOi8vb3Blbi5tYXBxdWVzdC5jby51a1wiIHRhcmdldD1cIl9ibGFua1wiPk1hcFF1ZXN0PC9hPiwgPGEgaHJlZj1cImh0dHA6Ly93d3cub3BlbnN0cmVldG1hcC5vcmcvXCIgdGFyZ2V0PVwiX2JsYW5rXCI+T3BlblN0cmVldE1hcDwvYT4gYW5kIGNvbnRyaWJ1dG9ycy4nXG4gIHJldHVybiBuZXcgTC5UaWxlTGF5ZXIobWFwcXVlc3RVcmwsIHttYXhab29tOiAxOCwgYXR0cmlidXRpb246IG1hcHF1ZXN0QXR0cmliLCBzdWJkb21haW5zOiBzdWJEb21haW5zfSlcblxuY2xhc3MgU291cmNlRGlzcGxheVxuICBjb25zdHJ1Y3RvcjogKG1hcCwgZGIsIHBhZ2VyKSAtPlxuICAgIEBtYXAgPSBtYXBcbiAgICBAZGIgPSBkYlxuICAgIEBwYWdlciA9IHBhZ2VyXG4gICAgQGl0ZW1UcmFja2VyID0gbmV3IEl0ZW1UcmFja2VyKClcblxuICAgIEBzb3VyY2VNYXJrZXJzID0ge31cbiAgICBAbWFwLm9uKCdtb3ZlZW5kJywgQHVwZGF0ZU1hcmtlcnMpXG4gIFxuICB1cGRhdGVNYXJrZXJzOiA9PlxuICAgICMgR2V0IGJvdW5kcyBwYWRkZWRcbiAgICBib3VuZHMgPSBAbWFwLmdldEJvdW5kcygpLnBhZCgwLjMzKVxuXG4gICAgYm91bmRzR2VvSlNPTiA9IEdlb0pTT04ubGF0TG5nQm91bmRzVG9HZW9KU09OKGJvdW5kcylcbiAgICBzZWxlY3RvciA9IHsgZ2VvOiB7ICRnZW9JbnRlcnNlY3RzOiB7ICRnZW9tZXRyeTogYm91bmRzR2VvSlNPTiB9IH0gfVxuXG4gICAgIyBRdWVyeSBzb3VyY2VzIHdpdGggcHJvamVjdGlvbiBUT0RPXG4gICAgQGRiLnNvdXJjZXMuZmluZChzZWxlY3RvciwgeyBzb3J0OiBbXCJfaWRcIl0sIGxpbWl0OiAxMDAgfSkuZmV0Y2ggKHNvdXJjZXMpID0+XG4gICAgICAjIEZpbmQgb3V0IHdoaWNoIHRvIGFkZC9yZW1vdmVcbiAgICAgIFthZGRzLCByZW1vdmVzXSA9IEBpdGVtVHJhY2tlci51cGRhdGUoc291cmNlcylcblxuICAgICAgIyBSZW1vdmUgb2xkIG1hcmtlcnNcbiAgICAgIGZvciByZW1vdmUgaW4gcmVtb3Zlc1xuICAgICAgICBAcmVtb3ZlU291cmNlTWFya2VyKHJlbW92ZSlcbiAgICAgIGZvciBhZGQgaW4gYWRkc1xuICAgICAgICBAYWRkU291cmNlTWFya2VyKGFkZClcblxuICBhZGRTb3VyY2VNYXJrZXI6IChzb3VyY2UpIC0+XG4gICAgaWYgc291cmNlLmdlbz9cbiAgICAgIGxhdGxuZyA9IG5ldyBMLkxhdExuZyhzb3VyY2UuZ2VvLmNvb3JkaW5hdGVzWzFdLCBzb3VyY2UuZ2VvLmNvb3JkaW5hdGVzWzBdKVxuICAgICAgbWFya2VyID0gbmV3IEwuTWFya2VyKGxhdGxuZylcbiAgICAgIFxuICAgICAgbWFya2VyLm9uICdjbGljaycsID0+XG4gICAgICAgIEBwYWdlci5vcGVuUGFnZShTb3VyY2VQYWdlLCB7X2lkOiBzb3VyY2UuX2lkfSlcbiAgICAgIFxuICAgICAgQHNvdXJjZU1hcmtlcnNbc291cmNlLl9pZF0gPSBtYXJrZXJcbiAgICAgIG1hcmtlci5hZGRUbyhAbWFwKVxuXG4gIHJlbW92ZVNvdXJjZU1hcmtlcjogKHNvdXJjZSkgLT5cbiAgICBpZiBfLmhhcyhAc291cmNlTWFya2Vycywgc291cmNlLl9pZClcbiAgICAgIEBtYXAucmVtb3ZlTGF5ZXIoQHNvdXJjZU1hcmtlcnNbc291cmNlLl9pZF0pXG5cblxuY2xhc3MgTG9jYXRpb25EaXNwbGF5XG4gICMgU2V0dXAgZGlzcGxheSwgb3B0aW9uYWxseSB6b29taW5nIHRvIGN1cnJlbnQgbG9jYXRpb25cbiAgY29uc3RydWN0b3I6IChtYXAsIHpvb21UbykgLT5cbiAgICBAbWFwID0gbWFwXG4gICAgQHpvb21UbyA9IHpvb21Ub1xuXG4gICAgQGxvY2F0aW9uRmluZGVyID0gbmV3IExvY2F0aW9uRmluZGVyKClcbiAgICBAbG9jYXRpb25GaW5kZXIub24oJ2ZvdW5kJywgQGxvY2F0aW9uRm91bmQpLm9uKCdlcnJvcicsIEBsb2NhdGlvbkVycm9yKVxuICAgIEBsb2NhdGlvbkZpbmRlci5zdGFydFdhdGNoKClcblxuICBzdG9wOiAtPlxuICAgIEBsb2NhdGlvbkZpbmRlci5zdG9wV2F0Y2goKVxuXG4gIGxvY2F0aW9uRXJyb3I6IChlKSA9PlxuICAgIGlmIEB6b29tVG9cbiAgICAgIEBtYXAuZml0V29ybGQoKVxuICAgICAgQHpvb21UbyA9IGZhbHNlXG4gICAgICBhbGVydChcIlVuYWJsZSB0byBkZXRlcm1pbmUgbG9jYXRpb25cIilcblxuICBsb2NhdGlvbkZvdW5kOiAoZSkgPT5cbiAgICByYWRpdXMgPSBlLmNvb3Jkcy5hY2N1cmFjeVxuICAgIGxhdGxuZyA9IG5ldyBMLkxhdExuZyhlLmNvb3Jkcy5sYXRpdHVkZSwgZS5jb29yZHMubG9uZ2l0dWRlKVxuXG4gICAgIyBTZXQgcG9zaXRpb24gb25jZVxuICAgIGlmIEB6b29tVG9cbiAgICAgIHpvb20gPSAxNVxuICAgICAgQG1hcC5zZXRWaWV3KGxhdGxuZywgem9vbSlcbiAgICAgIEB6b29tVG8gPSBmYWxzZVxuXG4gICAgIyBTZXR1cCBtYXJrZXIgYW5kIGNpcmNsZVxuICAgIGlmIG5vdCBAbWVNYXJrZXJcbiAgICAgIGljb24gPSAgTC5pY29uKGljb25Vcmw6IFwiaW1nL215X2xvY2F0aW9uLnBuZ1wiLCBpY29uU2l6ZTogWzIyLCAyMl0pXG4gICAgICBAbWVNYXJrZXIgPSBMLm1hcmtlcihsYXRsbmcsIGljb246aWNvbikuYWRkVG8oQG1hcClcbiAgICAgIEBtZUNpcmNsZSA9IEwuY2lyY2xlKGxhdGxuZywgcmFkaXVzKVxuICAgICAgQG1lQ2lyY2xlLmFkZFRvKEBtYXApXG4gICAgZWxzZVxuICAgICAgQG1lTWFya2VyLnNldExhdExuZyhsYXRsbmcpXG4gICAgICBAbWVDaXJjbGUuc2V0TGF0TG5nKGxhdGxuZykuc2V0UmFkaXVzKHJhZGl1cylcblxubW9kdWxlLmV4cG9ydHMgPSBTb3VyY2VNYXBQYWdlIiwiUGFnZSA9IHJlcXVpcmUgJy4uL1BhZ2UnXG5mb3JtcyA9IHJlcXVpcmUgJy4uL2Zvcm1zJ1xuXG4jIEFsbG93cyBlZGl0aW5nIG9mIHNvdXJjZSBkZXRhaWxzXG4jIFRPRE8gbG9naW4gcmVxdWlyZWRcbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgU291cmNlRWRpdFBhZ2UgZXh0ZW5kcyBQYWdlXG4gIGFjdGl2YXRlOiAtPlxuICAgIEBkYi5zb3VyY2VzLmZpbmRPbmUge19pZDogQG9wdGlvbnMuX2lkfSwgKHNvdXJjZSkgPT5cbiAgICAgIEBzZXRUaXRsZSBcIkVkaXQgU291cmNlICN7c291cmNlLmNvZGV9XCJcblxuICAgICAgIyBDcmVhdGUgbW9kZWwgZnJvbSBzb3VyY2VcbiAgICAgIEBtb2RlbCA9IG5ldyBCYWNrYm9uZS5Nb2RlbChzb3VyY2UpXG4gIFxuICAgICAgIyBDcmVhdGUgcXVlc3Rpb25zXG4gICAgICBzb3VyY2VUeXBlc1F1ZXN0aW9uID0gbmV3IGZvcm1zLkRyb3Bkb3duUXVlc3Rpb25cbiAgICAgICAgaWQ6ICd0eXBlJ1xuICAgICAgICBtb2RlbDogQG1vZGVsXG4gICAgICAgIHByb21wdDogJ0VudGVyIFNvdXJjZSBUeXBlJ1xuICAgICAgICBvcHRpb25zOiBbXVxuICAgICAgQGRiLnNvdXJjZV90eXBlcy5maW5kKHt9KS5mZXRjaCAoc291cmNlVHlwZXMpID0+XG4gICAgICAgICMgRmlsbCBzb3VyY2UgdHlwZXNcbiAgICAgICAgc291cmNlVHlwZXNRdWVzdGlvbi5zZXRPcHRpb25zIF8ubWFwKHNvdXJjZVR5cGVzLCAoc3QpID0+IFtzdC5jb2RlLCBzdC5uYW1lXSlcblxuICAgICAgc2F2ZUNhbmNlbEZvcm0gPSBuZXcgZm9ybXMuU2F2ZUNhbmNlbEZvcm1cbiAgICAgICAgY29udGVudHM6IFtcbiAgICAgICAgICBzb3VyY2VUeXBlc1F1ZXN0aW9uXG4gICAgICAgICAgbmV3IGZvcm1zLlRleHRRdWVzdGlvblxuICAgICAgICAgICAgaWQ6ICduYW1lJ1xuICAgICAgICAgICAgbW9kZWw6IEBtb2RlbFxuICAgICAgICAgICAgcHJvbXB0OiAnRW50ZXIgb3B0aW9uYWwgbmFtZSdcbiAgICAgICAgICBuZXcgZm9ybXMuVGV4dFF1ZXN0aW9uXG4gICAgICAgICAgICBpZDogJ2Rlc2MnXG4gICAgICAgICAgICBtb2RlbDogQG1vZGVsXG4gICAgICAgICAgICBwcm9tcHQ6ICdFbnRlciBvcHRpb25hbCBkZXNjcmlwdGlvbidcbiAgICAgICAgXVxuXG4gICAgICBAJGVsLmVtcHR5KCkuYXBwZW5kKHNhdmVDYW5jZWxGb3JtLmVsKVxuXG4gICAgICBAbGlzdGVuVG8gc2F2ZUNhbmNlbEZvcm0sICdzYXZlJywgPT5cbiAgICAgICAgQGRiLnNvdXJjZXMudXBzZXJ0IEBtb2RlbC50b0pTT04oKSwgPT4gQHBhZ2VyLmNsb3NlUGFnZSgpXG5cbiAgICAgIEBsaXN0ZW5UbyBzYXZlQ2FuY2VsRm9ybSwgJ2NhbmNlbCcsID0+XG4gICAgICAgIEBwYWdlci5jbG9zZVBhZ2UoKVxuICIsIlBhZ2UgPSByZXF1aXJlIFwiLi4vUGFnZVwiXG5mb3JtcyA9IHJlcXVpcmUgJy4uL2Zvcm1zJ1xuXG5jbGFzcyBUZXN0UGFnZSBleHRlbmRzIFBhZ2VcbiAgY3JlYXRlOiAtPiBAcmVuZGVyKClcblxuICBhY3RpdmF0ZTogLT5cbiAgICBAc2V0dXBDb250ZXh0TWVudSBbXG4gICAgICB7IGdseXBoOiAncmVtb3ZlJywgdGV4dDogXCJEZWxldGUgVGVzdFwiLCBjbGljazogPT4gQGRlbGV0ZVRlc3QoKSB9XG4gICAgXVxuXG4gIHJlbmRlcjogLT5cbiAgICBAc2V0VGl0bGUgXCJUZXN0XCIgIyBUT0RPIG5pY2VyIHRpdGxlXG5cbiAgICAjIEdldCB0ZXN0XG4gICAgQGRiLnRlc3RzLmZpbmRPbmUge19pZDogQG9wdGlvbnMuX2lkfSwgKHRlc3QpID0+XG4gICAgICBAdGVzdCA9IHRlc3RcblxuICAgICAgIyBHZXQgZm9ybVxuICAgICAgQGRiLmZvcm1zLmZpbmRPbmUgeyB0eXBlOiBcIldhdGVyVGVzdFwiLCBjb2RlOiB0ZXN0LnR5cGUgfSwgKGZvcm0pID0+XG4gICAgICAgICMgQ2hlY2sgaWYgY29tcGxldGVkXG4gICAgICAgIGlmIG5vdCB0ZXN0LmNvbXBsZXRlZFxuICAgICAgICAgIEBmb3JtVmlldyA9IGZvcm1zLmluc3RhbnRpYXRlVmlldyhmb3JtLnZpZXdzLmVkaXQsIHsgY3R4OiBAY3R4IH0pXG5cbiAgICAgICAgICAjIExpc3RlbiB0byBldmVudHNcbiAgICAgICAgICBAbGlzdGVuVG8gQGZvcm1WaWV3LCAnY2hhbmdlJywgQHNhdmVcbiAgICAgICAgICBAbGlzdGVuVG8gQGZvcm1WaWV3LCAnY29tcGxldGUnLCBAY29tcGxldGVkXG4gICAgICAgICAgQGxpc3RlblRvIEBmb3JtVmlldywgJ2Nsb3NlJywgQGNsb3NlXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBAZm9ybVZpZXcgPSBmb3Jtcy5pbnN0YW50aWF0ZVZpZXcoZm9ybS52aWV3cy5kZXRhaWwsIHsgY3R4OiBAY3R4IH0pXG4gIFxuICAgICAgICAjIFRPRE8gZGlzYWJsZSBpZiBub24tZWRpdGFibGVcbiAgICAgICAgQCRlbC5odG1sIHRlbXBsYXRlc1sncGFnZXMvVGVzdFBhZ2UnXShjb21wbGV0ZWQ6IHRlc3QuY29tcGxldGVkLCB0aXRsZTogZm9ybS5uYW1lKVxuICAgICAgICBAJCgnI2NvbnRlbnRzJykuYXBwZW5kKEBmb3JtVmlldy5lbClcblxuICAgICAgICBAZm9ybVZpZXcubG9hZCBAdGVzdFxuXG4gIGV2ZW50czpcbiAgICBcImNsaWNrICNlZGl0X2J1dHRvblwiIDogXCJlZGl0XCJcblxuICBkZXN0cm95OiAtPlxuICAgICMgTGV0IGtub3cgdGhhdCBzYXZlZCBpZiBjbG9zZWQgaW5jb21wbGV0ZWRcbiAgICBpZiBAdGVzdCBhbmQgbm90IEB0ZXN0LmNvbXBsZXRlZFxuICAgICAgQHBhZ2VyLmZsYXNoIFwiVGVzdCBzYXZlZCBhcyBkcmFmdC5cIlxuXG4gIGVkaXQ6IC0+XG4gICAgIyBNYXJrIGFzIGluY29tcGxldGVcbiAgICBAdGVzdC5jb21wbGV0ZWQgPSBudWxsXG4gICAgQGRiLnRlc3RzLnVwc2VydCBAdGVzdCwgPT4gQHJlbmRlcigpXG5cbiAgc2F2ZTogPT5cbiAgICAjIFNhdmUgdG8gZGJcbiAgICBAdGVzdCA9IEBmb3JtVmlldy5zYXZlKClcbiAgICBAZGIudGVzdHMudXBzZXJ0KEB0ZXN0KVxuXG4gIGNsb3NlOiA9PlxuICAgIEBzYXZlKClcbiAgICBAcGFnZXIuY2xvc2VQYWdlKClcblxuICBjb21wbGV0ZWQ6ID0+XG4gICAgIyBNYXJrIGFzIGNvbXBsZXRlZFxuICAgIEB0ZXN0LmNvbXBsZXRlZCA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKVxuICAgIEBkYi50ZXN0cy51cHNlcnQgQHRlc3QsID0+IEByZW5kZXIoKVxuXG4gIGRlbGV0ZVRlc3Q6IC0+XG4gICAgaWYgY29uZmlybShcIlBlcm1hbmVudGx5IGRlbGV0ZSB0ZXN0P1wiKVxuICAgICAgQGRiLnRlc3RzLnJlbW92ZSBAdGVzdC5faWQsID0+XG4gICAgICAgIEB0ZXN0ID0gbnVsbFxuICAgICAgICBAcGFnZXIuY2xvc2VQYWdlKClcbiAgICAgICAgQHBhZ2VyLmZsYXNoIFwiVGVzdCBkZWxldGVkXCIsIFwic3VjY2Vzc1wiXG5cbm1vZHVsZS5leHBvcnRzID0gVGVzdFBhZ2UiXX0=
;