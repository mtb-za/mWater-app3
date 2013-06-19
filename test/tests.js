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


},{"../app/js/GeoJSON":4}],5:[function(require,module,exports){
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


},{"./helpers/UIDriver":2,"../app/js/LocationView":6}],7:[function(require,module,exports){
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


},{"../app/js/db/LocalDb":8,"./db_queries":9}],10:[function(require,module,exports){
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


},{"../app/js/ItemTracker":11}],9:[function(require,module,exports){
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

  exports.QuestionGroup = require('./QuestionGroup');

  exports.SaveCancelForm = require('./SaveCancelForm');

  exports.SourceQuestion = require('./SourceQuestion');

  exports.PhotosQuestion = require('./PhotosQuestion');

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


},{"./form-controls":12,"./DateQuestion":13,"./QuestionGroup":14,"./SaveCancelForm":15,"./SourceQuestion":16,"./PhotosQuestion":17,"./DropdownQuestion":18}],2:[function(require,module,exports){
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


},{}],6:[function(require,module,exports){
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


},{"./LocationFinder":19,"./GeoJSON":4}],8:[function(require,module,exports){
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


},{"./selector":20,"../GeoJSON":4}],12:[function(require,module,exports){
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

    template : _.template('<div class="prompt"><%=options.prompt%><%=renderRequired()%></div><div class="answer"></div>'),

    renderRequired : function() {
        if (this.required)
            return '&nbsp;<span class="required">*</span>';
        return '';
    },

    validate : function() {
        var val;

        // Check required
        if (this.required) {
            if (this.model.get(this.id) === undefined || this.model.get(this.id) === null || this.model.get(this.id) === "")
                val = "Required";
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
            answerEl.html(_.template('<textarea/>', this));
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

exports.NumberQuestion = exports.Question.extend({
    renderAnswer : function(answerEl) {
        answerEl.html(_.template('<input type="number"/>', this));
        answerEl.find("input").val(this.model.get(this.id));
    },

    events : {
        "change" : "changed"
    },
    changed : function() {
        this.model.set(this.id, parseFloat(this.$("input").val()));
    }

});

exports.PhotoQuestion = exports.Question.extend({
    renderAnswer : function(answerEl) {
        answerEl.html(_.template('<img style="max-width: 100px;" src="images/camera-icon.jpg"/>', this));
    },

    events : {
        "click img" : "takePicture"
    },

    takePicture : function() {
        alert("In an app, this would launch the camera activity as in mWater native apps.");
    }

});

},{}],14:[function(require,module,exports){
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


},{}],15:[function(require,module,exports){
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


},{"./form-controls":12}],16:[function(require,module,exports){
(function() {
  var Question;

  Question = require('./form-controls').Question;

  module.exports = Question.extend({
    renderAnswer: function(answerEl) {
      answerEl.html('<div class="input-append">\n  <input type="tel">\n  <button class="btn" type="button">Select...</button>\n</div>');
      return answerEl.find("input").val(this.model.get(this.id));
    },
    events: {
      change: "changed"
    },
    changed: function() {
      return this.model.set(this.id, this.$("input").val());
    }
  });

}).call(this);


},{"./form-controls":12}],17:[function(require,module,exports){
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


},{"./form-controls":12}],18:[function(require,module,exports){
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


},{"./form-controls":12}],19:[function(require,module,exports){
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


},{}],20:[function(require,module,exports){
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
},{"./EJSON":21}],21:[function(require,module,exports){
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
},{}]},{},[1,3,10,7,5,9])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL3Rlc3QvRHJvcGRvd25RdWVzdGlvblRlc3RzLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvdGVzdC9HZW9KU09OVGVzdHMuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My90ZXN0L0xvY2F0aW9uVmlld1Rlc3RzLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvdGVzdC9Mb2NhbERiVGVzdHMuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My90ZXN0L0l0ZW1UcmFja2VyVGVzdHMuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My90ZXN0L2RiX3F1ZXJpZXMuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvZm9ybXMvaW5kZXguY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My90ZXN0L2hlbHBlcnMvVUlEcml2ZXIuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvR2VvSlNPTi5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9JdGVtVHJhY2tlci5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9Mb2NhdGlvblZpZXcuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvZGIvTG9jYWxEYi5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9mb3Jtcy9mb3JtLWNvbnRyb2xzLmpzIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvZm9ybXMvUXVlc3Rpb25Hcm91cC5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9mb3Jtcy9TYXZlQ2FuY2VsRm9ybS5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9mb3Jtcy9EYXRlUXVlc3Rpb24uY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvZm9ybXMvU291cmNlUXVlc3Rpb24uY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvZm9ybXMvUGhvdG9zUXVlc3Rpb24uY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvZm9ybXMvRHJvcGRvd25RdWVzdGlvbi5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9Mb2NhdGlvbkZpbmRlci5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9kYi9zZWxlY3Rvci5qcyIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL2RiL0VKU09OLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtDQUFBLEtBQUEsNEJBQUE7O0NBQUEsQ0FBQSxDQUFTLENBQUksRUFBYjs7Q0FBQSxDQUNBLENBQW1CLElBQUEsU0FBbkI7O0NBREEsQ0FFQSxDQUFXLElBQUEsQ0FBWCxZQUFXOztDQUZYLENBWUEsQ0FBNkIsS0FBN0IsQ0FBNkIsU0FBN0I7Q0FDVSxDQUFzQixDQUFBLElBQTlCLEVBQThCLEVBQTlCLFNBQUE7Q0FDRSxFQUFXLEdBQVgsR0FBVyxDQUFYO0NBQ0UsRUFBYSxDQUFaLENBQUQsR0FBQTtDQUNDLEVBQWUsQ0FBZixJQUFELE9BQUEsQ0FBZ0I7Q0FDZCxDQUFTLENBQUMsSUFBVixDQUEwQixFQUExQjtDQUFBLENBQ08sRUFBQyxDQUFSLEtBQUE7Q0FEQSxDQUVBLEVBRkEsTUFFQTtDQUxPLFNBRU87Q0FG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QTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFD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O0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsiYXNzZXJ0ID0gY2hhaS5hc3NlcnRcbkRyb3Bkb3duUXVlc3Rpb24gPSByZXF1aXJlKCdmb3JtcycpLkRyb3Bkb3duUXVlc3Rpb25cblVJRHJpdmVyID0gcmVxdWlyZSAnLi9oZWxwZXJzL1VJRHJpdmVyJ1xuXG4jIGNsYXNzIE1vY2tMb2NhdGlvbkZpbmRlclxuIyAgIGNvbnN0cnVjdG9yOiAgLT5cbiMgICAgIF8uZXh0ZW5kIEAsIEJhY2tib25lLkV2ZW50c1xuXG4jICAgZ2V0TG9jYXRpb246IC0+XG4jICAgc3RhcnRXYXRjaDogLT5cbiMgICBzdG9wV2F0Y2g6IC0+XG5cbmRlc2NyaWJlICdEcm9wZG93blF1ZXN0aW9uJywgLT5cbiAgY29udGV4dCAnV2l0aCBhIGZldyBvcHRpb25zJywgLT5cbiAgICBiZWZvcmVFYWNoIC0+XG4gICAgICBAbW9kZWwgPSBuZXcgQmFja2JvbmUuTW9kZWwoKVxuICAgICAgQHF1ZXN0aW9uID0gbmV3IERyb3Bkb3duUXVlc3Rpb25cbiAgICAgICAgb3B0aW9uczogW1snYScsICdBcHBsZSddLCBbJ2InLCAnQmFuYW5hJ11dXG4gICAgICAgIG1vZGVsOiBAbW9kZWxcbiAgICAgICAgaWQ6IFwicTFcIlxuXG4gICAgaXQgJ2FjY2VwdHMga25vd24gdmFsdWUnLCAtPlxuICAgICAgQG1vZGVsLnNldChxMTogJ2EnKVxuICAgICAgYXNzZXJ0LmVxdWFsIEBtb2RlbC5nZXQoJ3ExJyksICdhJ1xuICAgICAgYXNzZXJ0LmlzRmFsc2UgQHF1ZXN0aW9uLiQoXCJzZWxlY3RcIikuaXMoXCI6ZGlzYWJsZWRcIilcblxuICAgIGl0ICdpcyBkaXNhYmxlZCB3aXRoIHVua25vd24gdmFsdWUnLCAtPlxuICAgICAgQG1vZGVsLnNldChxMTogJ3gnKVxuICAgICAgYXNzZXJ0LmVxdWFsIEBtb2RlbC5nZXQoJ3ExJyksICd4J1xuICAgICAgYXNzZXJ0LmlzVHJ1ZSBAcXVlc3Rpb24uJChcInNlbGVjdFwiKS5pcyhcIjpkaXNhYmxlZFwiKVxuXG4gICAgaXQgJ2lzIG5vdCBkaXNhYmxlZCB3aXRoIGVtcHR5IHZhbHVlJywgLT5cbiAgICAgIEBtb2RlbC5zZXQocTE6IG51bGwpXG4gICAgICBhc3NlcnQuZXF1YWwgQG1vZGVsLmdldCgncTEnKSwgbnVsbFxuICAgICAgYXNzZXJ0LmlzRmFsc2UgQHF1ZXN0aW9uLiQoXCJzZWxlY3RcIikuaXMoXCI6ZGlzYWJsZWRcIilcblxuICAgIGl0ICdpcyByZWVuYWJsZWQgd2l0aCBzZXR0aW5nIHZhbHVlJywgLT5cbiAgICAgIEBtb2RlbC5zZXQocTE6ICd4JylcbiAgICAgIGFzc2VydC5lcXVhbCBAbW9kZWwuZ2V0KCdxMScpLCAneCdcbiAgICAgIEBxdWVzdGlvbi5zZXRPcHRpb25zKFtbJ2EnLCAnQXBwbGUnXSwgWydiJywgJ0JhbmFuYSddLCBbJ3gnLCAnS2l3aSddXSlcbiAgICAgIGFzc2VydC5pc0ZhbHNlIEBxdWVzdGlvbi4kKFwic2VsZWN0XCIpLmlzKFwiOmRpc2FibGVkXCIpXG5cbiIsImFzc2VydCA9IGNoYWkuYXNzZXJ0XG5HZW9KU09OID0gcmVxdWlyZSBcIi4uL2FwcC9qcy9HZW9KU09OXCJcblxuZGVzY3JpYmUgJ0dlb0pTT04nLCAtPlxuICBpdCAncmV0dXJucyBhIHByb3BlciBwb2x5Z29uJywgLT5cbiAgICBzb3V0aFdlc3QgPSBuZXcgTC5MYXRMbmcoMTAsIDIwKVxuICAgIG5vcnRoRWFzdCA9IG5ldyBMLkxhdExuZygxMywgMjMpXG4gICAgYm91bmRzID0gbmV3IEwuTGF0TG5nQm91bmRzKHNvdXRoV2VzdCwgbm9ydGhFYXN0KVxuXG4gICAganNvbiA9IEdlb0pTT04ubGF0TG5nQm91bmRzVG9HZW9KU09OKGJvdW5kcylcbiAgICBhc3NlcnQgXy5pc0VxdWFsIGpzb24sIHtcbiAgICAgIHR5cGU6IFwiUG9seWdvblwiLFxuICAgICAgY29vcmRpbmF0ZXM6IFtcbiAgICAgICAgW1syMCwxMF0sWzIwLDEzXSxbMjMsMTNdLFsyMywxMF1dXG4gICAgICBdXG4gICAgfVxuXG4gIGl0ICdnZXRzIHJlbGF0aXZlIGxvY2F0aW9uIE4nLCAtPlxuICAgIGZyb20gPSB7IHR5cGU6IFwiUG9pbnRcIiwgY29vcmRpbmF0ZXM6IFsxMCwgMjBdfVxuICAgIHRvID0geyB0eXBlOiBcIlBvaW50XCIsIGNvb3JkaW5hdGVzOiBbMTAsIDIxXX1cbiAgICBzdHIgPSBHZW9KU09OLmdldFJlbGF0aXZlTG9jYXRpb24oZnJvbSwgdG8pXG4gICAgYXNzZXJ0LmVxdWFsIHN0ciwgJzExMS4ya20gTidcblxuICBpdCAnZ2V0cyByZWxhdGl2ZSBsb2NhdGlvbiBTJywgLT5cbiAgICBmcm9tID0geyB0eXBlOiBcIlBvaW50XCIsIGNvb3JkaW5hdGVzOiBbMTAsIDIwXX1cbiAgICB0byA9IHsgdHlwZTogXCJQb2ludFwiLCBjb29yZGluYXRlczogWzEwLCAxOV19XG4gICAgc3RyID0gR2VvSlNPTi5nZXRSZWxhdGl2ZUxvY2F0aW9uKGZyb20sIHRvKVxuICAgIGFzc2VydC5lcXVhbCBzdHIsICcxMTEuMmttIFMnXG4iLCJhc3NlcnQgPSBjaGFpLmFzc2VydFxuTG9jYXRpb25WaWV3ID0gcmVxdWlyZSAnLi4vYXBwL2pzL0xvY2F0aW9uVmlldydcblVJRHJpdmVyID0gcmVxdWlyZSAnLi9oZWxwZXJzL1VJRHJpdmVyJ1xuXG5jbGFzcyBNb2NrTG9jYXRpb25GaW5kZXJcbiAgY29uc3RydWN0b3I6ICAtPlxuICAgIF8uZXh0ZW5kIEAsIEJhY2tib25lLkV2ZW50c1xuXG4gIGdldExvY2F0aW9uOiAtPlxuICBzdGFydFdhdGNoOiAtPlxuICBzdG9wV2F0Y2g6IC0+XG5cbmRlc2NyaWJlICdMb2NhdGlvblZpZXcnLCAtPlxuICBjb250ZXh0ICdXaXRoIG5vIHNldCBsb2NhdGlvbicsIC0+XG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgQGxvY2F0aW9uRmluZGVyID0gbmV3IE1vY2tMb2NhdGlvbkZpbmRlcigpXG4gICAgICBAbG9jYXRpb25WaWV3ID0gbmV3IExvY2F0aW9uVmlldyhsb2M6bnVsbCwgbG9jYXRpb25GaW5kZXI6IEBsb2NhdGlvbkZpbmRlcilcbiAgICAgIEB1aSA9IG5ldyBVSURyaXZlcihAbG9jYXRpb25WaWV3LmVsKVxuXG4gICAgaXQgJ2Rpc3BsYXlzIFVuc3BlY2lmaWVkJywgLT5cbiAgICAgIGFzc2VydC5pbmNsdWRlKEB1aS50ZXh0KCksICdVbnNwZWNpZmllZCcpXG5cbiAgICBpdCAnZGlzYWJsZXMgbWFwJywgLT5cbiAgICAgIGFzc2VydC5pc1RydWUgQHVpLmdldERpc2FibGVkKFwiTWFwXCIpIFxuXG4gICAgaXQgJ2FsbG93cyBzZXR0aW5nIGxvY2F0aW9uJywgLT5cbiAgICAgIEB1aS5jbGljaygnU2V0JylcbiAgICAgIHNldFBvcyA9IG51bGxcbiAgICAgIEBsb2NhdGlvblZpZXcub24gJ2xvY2F0aW9uc2V0JywgKHBvcykgLT5cbiAgICAgICAgc2V0UG9zID0gcG9zXG5cbiAgICAgIEBsb2NhdGlvbkZpbmRlci50cmlnZ2VyICdmb3VuZCcsIHsgY29vcmRzOiB7IGxhdGl0dWRlOiAyLCBsb25naXR1ZGU6IDMsIGFjY3VyYWN5OiAxMH19XG4gICAgICBhc3NlcnQuZXF1YWwgc2V0UG9zLmNvb3JkaW5hdGVzWzFdLCAyXG5cbiAgICBpdCAnRGlzcGxheXMgZXJyb3InLCAtPlxuICAgICAgQHVpLmNsaWNrKCdTZXQnKVxuICAgICAgc2V0UG9zID0gbnVsbFxuICAgICAgQGxvY2F0aW9uVmlldy5vbiAnbG9jYXRpb25zZXQnLCAocG9zKSAtPlxuICAgICAgICBzZXRQb3MgPSBwb3NcblxuICAgICAgQGxvY2F0aW9uRmluZGVyLnRyaWdnZXIgJ2Vycm9yJ1xuICAgICAgYXNzZXJ0LmVxdWFsIHNldFBvcywgbnVsbFxuICAgICAgYXNzZXJ0LmluY2x1ZGUoQHVpLnRleHQoKSwgJ0Nhbm5vdCcpXG5cbiAgY29udGV4dCAnV2l0aCBzZXQgbG9jYXRpb24nLCAtPlxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgIEBsb2NhdGlvbkZpbmRlciA9IG5ldyBNb2NrTG9jYXRpb25GaW5kZXIoKVxuICAgICAgQGxvY2F0aW9uVmlldyA9IG5ldyBMb2NhdGlvblZpZXcobG9jOiB7IHR5cGU6IFwiUG9pbnRcIiwgY29vcmRpbmF0ZXM6IFsxMCwgMjBdfSwgbG9jYXRpb25GaW5kZXI6IEBsb2NhdGlvbkZpbmRlcilcbiAgICAgIEB1aSA9IG5ldyBVSURyaXZlcihAbG9jYXRpb25WaWV3LmVsKVxuXG4gICAgaXQgJ2Rpc3BsYXlzIFdhaXRpbmcnLCAtPlxuICAgICAgYXNzZXJ0LmluY2x1ZGUoQHVpLnRleHQoKSwgJ1dhaXRpbmcnKVxuXG4gICAgaXQgJ2Rpc3BsYXlzIHJlbGF0aXZlJywgLT5cbiAgICAgIEBsb2NhdGlvbkZpbmRlci50cmlnZ2VyICdmb3VuZCcsIHsgY29vcmRzOiB7IGxhdGl0dWRlOiAyMSwgbG9uZ2l0dWRlOiAxMCwgYWNjdXJhY3k6IDEwfX1cbiAgICAgIGFzc2VydC5pbmNsdWRlKEB1aS50ZXh0KCksICcxMTEuMmttIFMnKVxuXG4iLCJhc3NlcnQgPSBjaGFpLmFzc2VydFxuTG9jYWxEYiA9IHJlcXVpcmUgXCIuLi9hcHAvanMvZGIvTG9jYWxEYlwiXG5kYl9xdWVyaWVzID0gcmVxdWlyZSBcIi4vZGJfcXVlcmllc1wiXG5cbmRlc2NyaWJlICdMb2NhbERiJywgLT5cbiAgYmVmb3JlIC0+XG4gICAgQGRiID0gbmV3IExvY2FsRGIoJ3Rlc3QnKVxuXG4gIGJlZm9yZUVhY2ggKGRvbmUpIC0+XG4gICAgQGRiLnJlbW92ZUNvbGxlY3Rpb24oJ3Rlc3QnKVxuICAgIEBkYi5hZGRDb2xsZWN0aW9uKCd0ZXN0JylcbiAgICBkb25lKClcblxuICBkZXNjcmliZSBcInBhc3NlcyBxdWVyaWVzXCIsIC0+XG4gICAgZGJfcXVlcmllcy5jYWxsKHRoaXMpXG5cbiAgaXQgJ2NhY2hlcyByb3dzJywgKGRvbmUpIC0+XG4gICAgQGRiLnRlc3QuY2FjaGUgW3sgX2lkOiAxLCBhOiAnYXBwbGUnIH1dLCB7fSwge30sID0+XG4gICAgICBAZGIudGVzdC5maW5kKHt9KS5mZXRjaCAocmVzdWx0cykgLT5cbiAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHNbMF0uYSwgJ2FwcGxlJ1xuICAgICAgICBkb25lKClcblxuICBpdCAnY2FjaGUgb3ZlcndyaXRlIGV4aXN0aW5nJywgKGRvbmUpIC0+XG4gICAgQGRiLnRlc3QuY2FjaGUgW3sgX2lkOiAxLCBhOiAnYXBwbGUnIH1dLCB7fSwge30sID0+XG4gICAgICBAZGIudGVzdC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdiYW5hbmEnIH1dLCB7fSwge30sID0+XG4gICAgICAgIEBkYi50ZXN0LmZpbmQoe30pLmZldGNoIChyZXN1bHRzKSAtPlxuICAgICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzWzBdLmEsICdiYW5hbmEnXG4gICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJjYWNoZSBkb2Vzbid0IG92ZXJ3cml0ZSB1cHNlcnRcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnRlc3QudXBzZXJ0IHsgX2lkOiAxLCBhOiAnYXBwbGUnIH0sID0+XG4gICAgICBAZGIudGVzdC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdiYW5hbmEnIH1dLCB7fSwge30sID0+XG4gICAgICAgIEBkYi50ZXN0LmZpbmQoe30pLmZldGNoIChyZXN1bHRzKSAtPlxuICAgICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzWzBdLmEsICdhcHBsZSdcbiAgICAgICAgICBkb25lKClcblxuICBpdCBcImNhY2hlIGRvZXNuJ3Qgb3ZlcndyaXRlIHJlbW92ZVwiLCAoZG9uZSkgLT5cbiAgICBAZGIudGVzdC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdkZWxldGUnIH1dLCB7fSwge30sID0+XG4gICAgICBAZGIudGVzdC5yZW1vdmUgMSwgPT5cbiAgICAgIEBkYi50ZXN0LmNhY2hlIFt7IF9pZDogMSwgYTogJ2JhbmFuYScgfV0sIHt9LCB7fSwgPT5cbiAgICAgICAgQGRiLnRlc3QuZmluZCh7fSkuZmV0Y2ggKHJlc3VsdHMpIC0+XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHMubGVuZ3RoLCAwXG4gICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJjYWNoZSByZW1vdmVzIG1pc3NpbmcgdW5zb3J0ZWRcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnRlc3QuY2FjaGUgW3sgX2lkOiAxLCBhOiAnYScgfSwgeyBfaWQ6IDIsIGE6ICdiJyB9LCB7IF9pZDogMywgYTogJ2MnIH1dLCB7fSwge30sID0+XG4gICAgICBAZGIudGVzdC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdhJyB9LCB7IF9pZDogMywgYTogJ2MnIH1dLCB7fSwge30sID0+XG4gICAgICAgIEBkYi50ZXN0LmZpbmQoe30pLmZldGNoIChyZXN1bHRzKSAtPlxuICAgICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzLmxlbmd0aCwgMlxuICAgICAgICAgIGRvbmUoKVxuXG4gIGl0IFwiY2FjaGUgcmVtb3ZlcyBtaXNzaW5nIGZpbHRlcmVkXCIsIChkb25lKSAtPlxuICAgIEBkYi50ZXN0LmNhY2hlIFt7IF9pZDogMSwgYTogJ2EnIH0sIHsgX2lkOiAyLCBhOiAnYicgfSwgeyBfaWQ6IDMsIGE6ICdjJyB9XSwge30sIHt9LCA9PlxuICAgICAgQGRiLnRlc3QuY2FjaGUgW3sgX2lkOiAxLCBhOiAnYScgfV0sIHtfaWQ6IHskbHQ6M319LCB7fSwgPT5cbiAgICAgICAgQGRiLnRlc3QuZmluZCh7fSwge3NvcnQ6WydfaWQnXX0pLmZldGNoIChyZXN1bHRzKSAtPlxuICAgICAgICAgIGFzc2VydC5kZWVwRXF1YWwgXy5wbHVjayhyZXN1bHRzLCAnX2lkJyksIFsxLDNdXG4gICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJjYWNoZSByZW1vdmVzIG1pc3Npbmcgc29ydGVkIGxpbWl0ZWRcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnRlc3QuY2FjaGUgW3sgX2lkOiAxLCBhOiAnYScgfSwgeyBfaWQ6IDIsIGE6ICdiJyB9LCB7IF9pZDogMywgYTogJ2MnIH1dLCB7fSwge30sID0+XG4gICAgICBAZGIudGVzdC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdhJyB9XSwge30sIHtzb3J0OlsnX2lkJ10sIGxpbWl0OjJ9LCA9PlxuICAgICAgICBAZGIudGVzdC5maW5kKHt9LCB7c29ydDpbJ19pZCddfSkuZmV0Y2ggKHJlc3VsdHMpIC0+XG4gICAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCBfLnBsdWNrKHJlc3VsdHMsICdfaWQnKSwgWzEsM11cbiAgICAgICAgICBkb25lKClcblxuICBpdCBcImNhY2hlIGRvZXMgbm90IHJlbW92ZSBtaXNzaW5nIHNvcnRlZCBsaW1pdGVkIHBhc3QgZW5kXCIsIChkb25lKSAtPlxuICAgIEBkYi50ZXN0LmNhY2hlIFt7IF9pZDogMSwgYTogJ2EnIH0sIHsgX2lkOiAyLCBhOiAnYicgfSwgeyBfaWQ6IDMsIGE6ICdjJyB9LCB7IF9pZDogNCwgYTogJ2QnIH1dLCB7fSwge30sID0+XG4gICAgICBAZGIudGVzdC5yZW1vdmUgMiwgPT5cbiAgICAgICAgQGRiLnRlc3QuY2FjaGUgW3sgX2lkOiAxLCBhOiAnYScgfSwgeyBfaWQ6IDIsIGE6ICdiJyB9XSwge30sIHtzb3J0OlsnX2lkJ10sIGxpbWl0OjJ9LCA9PlxuICAgICAgICAgIEBkYi50ZXN0LmZpbmQoe30sIHtzb3J0OlsnX2lkJ119KS5mZXRjaCAocmVzdWx0cykgLT5cbiAgICAgICAgICAgIGFzc2VydC5kZWVwRXF1YWwgXy5wbHVjayhyZXN1bHRzLCAnX2lkJyksIFsxLDMsNF1cbiAgICAgICAgICAgIGRvbmUoKVxuXG4gIGl0IFwicmV0dXJucyBwZW5kaW5nIHVwc2VydHNcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnRlc3QuY2FjaGUgW3sgX2lkOiAxLCBhOiAnYXBwbGUnIH1dLCB7fSwge30sID0+XG4gICAgICBAZGIudGVzdC51cHNlcnQgeyBfaWQ6IDIsIGE6ICdiYW5hbmEnIH0sID0+XG4gICAgICAgIEBkYi50ZXN0LnBlbmRpbmdVcHNlcnRzIChyZXN1bHRzKSA9PlxuICAgICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzLmxlbmd0aCwgMVxuICAgICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzWzBdLmEsICdiYW5hbmEnXG4gICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJyZXNvbHZlcyBwZW5kaW5nIHVwc2VydHNcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnRlc3QudXBzZXJ0IHsgX2lkOiAyLCBhOiAnYmFuYW5hJyB9LCA9PlxuICAgICAgQGRiLnRlc3QucmVzb2x2ZVVwc2VydCB7IF9pZDogMiwgYTogJ2JhbmFuYScgfSwgPT5cbiAgICAgICAgQGRiLnRlc3QucGVuZGluZ1Vwc2VydHMgKHJlc3VsdHMpID0+XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHMubGVuZ3RoLCAwXG4gICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJyZXRhaW5zIGNoYW5nZWQgcGVuZGluZyB1cHNlcnRzXCIsIChkb25lKSAtPlxuICAgIEBkYi50ZXN0LnVwc2VydCB7IF9pZDogMiwgYTogJ2JhbmFuYScgfSwgPT5cbiAgICAgIEBkYi50ZXN0LnVwc2VydCB7IF9pZDogMiwgYTogJ2JhbmFuYTInIH0sID0+XG4gICAgICAgIEBkYi50ZXN0LnJlc29sdmVVcHNlcnQgeyBfaWQ6IDIsIGE6ICdiYW5hbmEnIH0sID0+XG4gICAgICAgICAgQGRiLnRlc3QucGVuZGluZ1Vwc2VydHMgKHJlc3VsdHMpID0+XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0cy5sZW5ndGgsIDFcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzWzBdLmEsICdiYW5hbmEyJ1xuICAgICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJyZW1vdmVzIHBlbmRpbmcgdXBzZXJ0c1wiLCAoZG9uZSkgLT5cbiAgICBAZGIudGVzdC51cHNlcnQgeyBfaWQ6IDIsIGE6ICdiYW5hbmEnIH0sID0+XG4gICAgICBAZGIudGVzdC5yZW1vdmUgMiwgPT5cbiAgICAgICAgQGRiLnRlc3QucGVuZGluZ1Vwc2VydHMgKHJlc3VsdHMpID0+XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHMubGVuZ3RoLCAwXG4gICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJyZXR1cm5zIHBlbmRpbmcgcmVtb3Zlc1wiLCAoZG9uZSkgLT5cbiAgICBAZGIudGVzdC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdhcHBsZScgfV0sIHt9LCB7fSwgPT5cbiAgICAgIEBkYi50ZXN0LnJlbW92ZSAxLCA9PlxuICAgICAgICBAZGIudGVzdC5wZW5kaW5nUmVtb3ZlcyAocmVzdWx0cykgPT5cbiAgICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0cy5sZW5ndGgsIDFcbiAgICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0c1swXSwgMVxuICAgICAgICAgIGRvbmUoKVxuXG4gIGl0IFwicmVzb2x2ZXMgcGVuZGluZyByZW1vdmVzXCIsIChkb25lKSAtPlxuICAgIEBkYi50ZXN0LmNhY2hlIFt7IF9pZDogMSwgYTogJ2FwcGxlJyB9XSwge30sIHt9LCA9PlxuICAgICAgQGRiLnRlc3QucmVtb3ZlIDEsID0+XG4gICAgICAgIEBkYi50ZXN0LnJlc29sdmVSZW1vdmUgMSwgPT5cbiAgICAgICAgICBAZGIudGVzdC5wZW5kaW5nUmVtb3ZlcyAocmVzdWx0cykgPT5cbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzLmxlbmd0aCwgMFxuICAgICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJzZWVkc1wiLCAoZG9uZSkgLT5cbiAgICBAZGIudGVzdC5zZWVkIHsgX2lkOiAxLCBhOiAnYXBwbGUnIH0sID0+XG4gICAgICBAZGIudGVzdC5maW5kKHt9KS5mZXRjaCAocmVzdWx0cykgLT5cbiAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHNbMF0uYSwgJ2FwcGxlJ1xuICAgICAgICBkb25lKClcblxuICBpdCBcImRvZXMgbm90IG92ZXJ3cml0ZSBleGlzdGluZ1wiLCAoZG9uZSkgLT5cbiAgICBAZGIudGVzdC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdiYW5hbmEnIH1dLCB7fSwge30sID0+XG4gICAgICBAZGIudGVzdC5zZWVkIHsgX2lkOiAxLCBhOiAnYXBwbGUnIH0sID0+XG4gICAgICAgIEBkYi50ZXN0LmZpbmQoe30pLmZldGNoIChyZXN1bHRzKSAtPlxuICAgICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzWzBdLmEsICdiYW5hbmEnXG4gICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJkb2VzIG5vdCBhZGQgcmVtb3ZlZFwiLCAoZG9uZSkgLT5cbiAgICBAZGIudGVzdC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdhcHBsZScgfV0sIHt9LCB7fSwgPT5cbiAgICAgIEBkYi50ZXN0LnJlbW92ZSAxLCA9PlxuICAgICAgICBAZGIudGVzdC5zZWVkIHsgX2lkOiAxLCBhOiAnYXBwbGUnIH0sID0+XG4gICAgICAgICAgQGRiLnRlc3QuZmluZCh7fSkuZmV0Y2ggKHJlc3VsdHMpIC0+XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0cy5sZW5ndGgsIDBcbiAgICAgICAgICAgIGRvbmUoKVxuXG5kZXNjcmliZSAnTG9jYWxEYiB3aXRoIGxvY2FsIHN0b3JhZ2UnLCAtPlxuICBiZWZvcmUgLT5cbiAgICBAZGIgPSBuZXcgTG9jYWxEYigndGVzdCcsIHsgbmFtZXNwYWNlOiBcImRiLnRlc3RcIiB9KVxuXG4gIGJlZm9yZUVhY2ggKGRvbmUpIC0+XG4gICAgQGRiLnJlbW92ZUNvbGxlY3Rpb24oJ3Rlc3QnKVxuICAgIEBkYi5hZGRDb2xsZWN0aW9uKCd0ZXN0JylcbiAgICBkb25lKClcblxuICBpdCBcInJldGFpbnMgaXRlbXNcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnRlc3QudXBzZXJ0IHsgX2lkOjEsIGE6XCJBbGljZVwiIH0sID0+XG4gICAgICBkYjIgPSBuZXcgTG9jYWxEYigndGVzdCcsIHsgbmFtZXNwYWNlOiBcImRiLnRlc3RcIiB9KVxuICAgICAgZGIyLmFkZENvbGxlY3Rpb24gJ3Rlc3QnXG4gICAgICBkYjIudGVzdC5maW5kKHt9KS5mZXRjaCAocmVzdWx0cykgLT5cbiAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHNbMF0uYSwgXCJBbGljZVwiXG4gICAgICAgIGRvbmUoKVxuXG4gIGl0IFwicmV0YWlucyB1cHNlcnRzXCIsIChkb25lKSAtPlxuICAgIEBkYi50ZXN0LnVwc2VydCB7IF9pZDoxLCBhOlwiQWxpY2VcIiB9LCA9PlxuICAgICAgZGIyID0gbmV3IExvY2FsRGIoJ3Rlc3QnLCB7IG5hbWVzcGFjZTogXCJkYi50ZXN0XCIgfSlcbiAgICAgIGRiMi5hZGRDb2xsZWN0aW9uICd0ZXN0J1xuICAgICAgZGIyLnRlc3QuZmluZCh7fSkuZmV0Y2ggKHJlc3VsdHMpIC0+XG4gICAgICAgIGRiMi50ZXN0LnBlbmRpbmdVcHNlcnRzICh1cHNlcnRzKSAtPlxuICAgICAgICAgIGFzc2VydC5kZWVwRXF1YWwgcmVzdWx0cywgdXBzZXJ0c1xuICAgICAgICAgIGRvbmUoKVxuXG4gIGl0IFwicmV0YWlucyByZW1vdmVzXCIsIChkb25lKSAtPlxuICAgIEBkYi50ZXN0LnNlZWQgeyBfaWQ6MSwgYTpcIkFsaWNlXCIgfSwgPT5cbiAgICAgIEBkYi50ZXN0LnJlbW92ZSAxLCA9PlxuICAgICAgICBkYjIgPSBuZXcgTG9jYWxEYigndGVzdCcsIHsgbmFtZXNwYWNlOiBcImRiLnRlc3RcIiB9KVxuICAgICAgICBkYjIuYWRkQ29sbGVjdGlvbiAndGVzdCdcbiAgICAgICAgZGIyLnRlc3QucGVuZGluZ1JlbW92ZXMgKHJlbW92ZXMpIC0+XG4gICAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCByZW1vdmVzLCBbMV1cbiAgICAgICAgICBkb25lKClcblxuZGVzY3JpYmUgJ0xvY2FsRGIgd2l0aG91dCBsb2NhbCBzdG9yYWdlJywgLT5cbiAgYmVmb3JlIC0+XG4gICAgQGRiID0gbmV3IExvY2FsRGIoJ3Rlc3QnKVxuXG4gIGJlZm9yZUVhY2ggKGRvbmUpIC0+XG4gICAgQGRiLnJlbW92ZUNvbGxlY3Rpb24oJ3Rlc3QnKVxuICAgIEBkYi5hZGRDb2xsZWN0aW9uKCd0ZXN0JylcbiAgICBkb25lKClcblxuICBpdCBcImRvZXMgbm90IHJldGFpbiBpdGVtc1wiLCAoZG9uZSkgLT5cbiAgICBAZGIudGVzdC51cHNlcnQgeyBfaWQ6MSwgYTpcIkFsaWNlXCIgfSwgPT5cbiAgICAgIGRiMiA9IG5ldyBMb2NhbERiKCd0ZXN0JylcbiAgICAgIGRiMi5hZGRDb2xsZWN0aW9uICd0ZXN0J1xuICAgICAgZGIyLnRlc3QuZmluZCh7fSkuZmV0Y2ggKHJlc3VsdHMpIC0+XG4gICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzLmxlbmd0aCwgMFxuICAgICAgICBkb25lKClcblxuICBpdCBcImRvZXMgbm90IHJldGFpbiB1cHNlcnRzXCIsIChkb25lKSAtPlxuICAgIEBkYi50ZXN0LnVwc2VydCB7IF9pZDoxLCBhOlwiQWxpY2VcIiB9LCA9PlxuICAgICAgZGIyID0gbmV3IExvY2FsRGIoJ3Rlc3QnKVxuICAgICAgZGIyLmFkZENvbGxlY3Rpb24gJ3Rlc3QnXG4gICAgICBkYjIudGVzdC5maW5kKHt9KS5mZXRjaCAocmVzdWx0cykgLT5cbiAgICAgICAgZGIyLnRlc3QucGVuZGluZ1Vwc2VydHMgKHVwc2VydHMpIC0+XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHMubGVuZ3RoLCAwXG4gICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJkb2VzIG5vdCByZXRhaW4gcmVtb3Zlc1wiLCAoZG9uZSkgLT5cbiAgICBAZGIudGVzdC5zZWVkIHsgX2lkOjEsIGE6XCJBbGljZVwiIH0sID0+XG4gICAgICBAZGIudGVzdC5yZW1vdmUgMSwgPT5cbiAgICAgICAgZGIyID0gbmV3IExvY2FsRGIoJ3Rlc3QnKVxuICAgICAgICBkYjIuYWRkQ29sbGVjdGlvbiAndGVzdCdcbiAgICAgICAgZGIyLnRlc3QucGVuZGluZ1JlbW92ZXMgKHJlbW92ZXMpIC0+XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsIHJlbW92ZXMubGVuZ3RoLCAwXG4gICAgICAgICAgZG9uZSgpXG5cbiIsImFzc2VydCA9IGNoYWkuYXNzZXJ0XG5JdGVtVHJhY2tlciA9IHJlcXVpcmUgXCIuLi9hcHAvanMvSXRlbVRyYWNrZXJcIlxuXG5kZXNjcmliZSAnSXRlbVRyYWNrZXInLCAtPlxuICBiZWZvcmVFYWNoIC0+XG4gICAgQHRyYWNrZXIgPSBuZXcgSXRlbVRyYWNrZXIoKVxuXG4gIGl0IFwicmVjb3JkcyBhZGRzXCIsIC0+XG4gICAgaXRlbXMgPSAgW1xuICAgICAgX2lkOiAxLCB4OjFcbiAgICAgIF9pZDogMiwgeDoyXG4gICAgXVxuICAgIFthZGRzLCByZW1vdmVzXSA9IEB0cmFja2VyLnVwZGF0ZShpdGVtcylcbiAgICBhc3NlcnQuZGVlcEVxdWFsIGFkZHMsIGl0ZW1zXG4gICAgYXNzZXJ0LmRlZXBFcXVhbCByZW1vdmVzLCBbXVxuXG4gIGl0IFwicmVtZW1iZXJzIGl0ZW1zXCIsIC0+XG4gICAgaXRlbXMgPSAgW1xuICAgICAge19pZDogMSwgeDoxfVxuICAgICAge19pZDogMiwgeDoyfVxuICAgIF1cbiAgICBbYWRkcywgcmVtb3Zlc10gPSBAdHJhY2tlci51cGRhdGUoaXRlbXMpXG4gICAgW2FkZHMsIHJlbW92ZXNdID0gQHRyYWNrZXIudXBkYXRlKGl0ZW1zKVxuICAgIGFzc2VydC5kZWVwRXF1YWwgYWRkcywgW11cbiAgICBhc3NlcnQuZGVlcEVxdWFsIHJlbW92ZXMsIFtdXG5cbiAgaXQgXCJzZWVzIHJlbW92ZWQgaXRlbXNcIiwgLT5cbiAgICBpdGVtczEgPSAgW1xuICAgICAge19pZDogMSwgeDoxfVxuICAgICAge19pZDogMiwgeDoyfVxuICAgIF1cbiAgICBpdGVtczIgPSAgW1xuICAgICAge19pZDogMSwgeDoxfVxuICAgIF1cbiAgICBAdHJhY2tlci51cGRhdGUoaXRlbXMxKVxuICAgIFthZGRzLCByZW1vdmVzXSA9IEB0cmFja2VyLnVwZGF0ZShpdGVtczIpXG4gICAgYXNzZXJ0LmRlZXBFcXVhbCBhZGRzLCBbXVxuICAgIGFzc2VydC5kZWVwRXF1YWwgcmVtb3ZlcywgW3tfaWQ6IDIsIHg6Mn1dXG5cbiAgaXQgXCJzZWVzIHJlbW92ZWQgY2hhbmdlc1wiLCAtPlxuICAgIGl0ZW1zMSA9ICBbXG4gICAgICB7X2lkOiAxLCB4OjF9XG4gICAgICB7X2lkOiAyLCB4OjJ9XG4gICAgXVxuICAgIGl0ZW1zMiA9ICBbXG4gICAgICB7X2lkOiAxLCB4OjF9XG4gICAgICB7X2lkOiAyLCB4OjR9XG4gICAgXVxuICAgIEB0cmFja2VyLnVwZGF0ZShpdGVtczEpXG4gICAgW2FkZHMsIHJlbW92ZXNdID0gQHRyYWNrZXIudXBkYXRlKGl0ZW1zMilcbiAgICBhc3NlcnQuZGVlcEVxdWFsIGFkZHMsIFt7X2lkOiAyLCB4OjR9XVxuICAgIGFzc2VydC5kZWVwRXF1YWwgcmVtb3ZlcywgW3tfaWQ6IDIsIHg6Mn1dXG4iLCJhc3NlcnQgPSBjaGFpLmFzc2VydFxuXG5HZW9KU09OID0gcmVxdWlyZSAnLi4vYXBwL2pzL0dlb0pTT04nXG5cbm1vZHVsZS5leHBvcnRzID0gLT5cbiAgY29udGV4dCAnV2l0aCBzYW1wbGUgcm93cycsIC0+XG4gICAgYmVmb3JlRWFjaCAoZG9uZSkgLT5cbiAgICAgIEBkYi50ZXN0LnVwc2VydCB7IF9pZDoxLCBhOlwiQWxpY2VcIiB9LCA9PlxuICAgICAgICBAZGIudGVzdC51cHNlcnQgeyBfaWQ6MiwgYTpcIkNoYXJsaWVcIiB9LCA9PlxuICAgICAgICAgIEBkYi50ZXN0LnVwc2VydCB7IF9pZDozLCBhOlwiQm9iXCIgfSwgPT5cbiAgICAgICAgICAgIGRvbmUoKVxuXG4gICAgaXQgJ2ZpbmRzIGFsbCByb3dzJywgKGRvbmUpIC0+XG4gICAgICBAZGIudGVzdC5maW5kKHt9KS5mZXRjaCAocmVzdWx0cykgPT5cbiAgICAgICAgYXNzZXJ0LmVxdWFsIDMsIHJlc3VsdHMubGVuZ3RoXG4gICAgICAgIGRvbmUoKVxuXG4gICAgaXQgJ2ZpbmRzIGFsbCByb3dzIHdpdGggb3B0aW9ucycsIChkb25lKSAtPlxuICAgICAgQGRiLnRlc3QuZmluZCh7fSwge30pLmZldGNoIChyZXN1bHRzKSA9PlxuICAgICAgICBhc3NlcnQuZXF1YWwgMywgcmVzdWx0cy5sZW5ndGhcbiAgICAgICAgZG9uZSgpXG5cbiAgICBpdCAnZmlsdGVycyByb3dzIGJ5IGlkJywgKGRvbmUpIC0+XG4gICAgICBAZGIudGVzdC5maW5kKHsgX2lkOiAxIH0pLmZldGNoIChyZXN1bHRzKSA9PlxuICAgICAgICBhc3NlcnQuZXF1YWwgMSwgcmVzdWx0cy5sZW5ndGhcbiAgICAgICAgYXNzZXJ0LmVxdWFsICdBbGljZScsIHJlc3VsdHNbMF0uYVxuICAgICAgICBkb25lKClcblxuICAgIGl0ICdmaW5kcyBvbmUgcm93JywgKGRvbmUpIC0+XG4gICAgICBAZGIudGVzdC5maW5kT25lIHsgX2lkOiAyIH0sIChyZXN1bHQpID0+XG4gICAgICAgIGFzc2VydC5lcXVhbCAnQ2hhcmxpZScsIHJlc3VsdC5hXG4gICAgICAgIGRvbmUoKVxuXG4gICAgaXQgJ3JlbW92ZXMgaXRlbScsIChkb25lKSAtPlxuICAgICAgQGRiLnRlc3QucmVtb3ZlIDIsID0+XG4gICAgICAgIEBkYi50ZXN0LmZpbmQoe30pLmZldGNoIChyZXN1bHRzKSA9PlxuICAgICAgICAgIGFzc2VydC5lcXVhbCAyLCByZXN1bHRzLmxlbmd0aFxuICAgICAgICAgIGFzc2VydCAxIGluIChyZXN1bHQuX2lkIGZvciByZXN1bHQgaW4gcmVzdWx0cylcbiAgICAgICAgICBhc3NlcnQgMiBub3QgaW4gKHJlc3VsdC5faWQgZm9yIHJlc3VsdCBpbiByZXN1bHRzKVxuICAgICAgICAgIGRvbmUoKVxuXG4gICAgaXQgJ3JlbW92ZXMgbm9uLWV4aXN0ZW50IGl0ZW0nLCAoZG9uZSkgLT5cbiAgICAgIEBkYi50ZXN0LnJlbW92ZSA5OTksID0+XG4gICAgICAgIEBkYi50ZXN0LmZpbmQoe30pLmZldGNoIChyZXN1bHRzKSA9PlxuICAgICAgICAgIGFzc2VydC5lcXVhbCAzLCByZXN1bHRzLmxlbmd0aFxuICAgICAgICAgIGRvbmUoKVxuXG4gICAgaXQgJ3NvcnRzIGFzY2VuZGluZycsIChkb25lKSAtPlxuICAgICAgQGRiLnRlc3QuZmluZCh7fSwge3NvcnQ6IFsnYSddfSkuZmV0Y2ggKHJlc3VsdHMpID0+XG4gICAgICAgIGFzc2VydC5kZWVwRXF1YWwgXy5wbHVjayhyZXN1bHRzLCAnX2lkJyksIFsxLDMsMl1cbiAgICAgICAgZG9uZSgpXG5cbiAgICBpdCAnc29ydHMgZGVzY2VuZGluZycsIChkb25lKSAtPlxuICAgICAgQGRiLnRlc3QuZmluZCh7fSwge3NvcnQ6IFtbJ2EnLCdkZXNjJ11dfSkuZmV0Y2ggKHJlc3VsdHMpID0+XG4gICAgICAgIGFzc2VydC5kZWVwRXF1YWwgXy5wbHVjayhyZXN1bHRzLCAnX2lkJyksIFsyLDMsMV1cbiAgICAgICAgZG9uZSgpXG5cbiAgICBpdCAnbGltaXRzJywgKGRvbmUpIC0+XG4gICAgICBAZGIudGVzdC5maW5kKHt9LCB7c29ydDogWydhJ10sIGxpbWl0OjJ9KS5mZXRjaCAocmVzdWx0cykgPT5cbiAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCBfLnBsdWNrKHJlc3VsdHMsICdfaWQnKSwgWzEsM11cbiAgICAgICAgZG9uZSgpXG5cbiAgICBpdCAnZmV0Y2hlcyBpbmRlcGVuZGVudCBjb3BpZXMnLCAoZG9uZSkgLT5cbiAgICAgIEBkYi50ZXN0LmZpbmRPbmUgeyBfaWQ6IDIgfSwgKHJlc3VsdCkgPT5cbiAgICAgICAgcmVzdWx0LmEgPSAnRGF2aWQnXG4gICAgICAgIEBkYi50ZXN0LmZpbmRPbmUgeyBfaWQ6IDIgfSwgKHJlc3VsdCkgPT5cbiAgICAgICAgICBhc3NlcnQuZXF1YWwgJ0NoYXJsaWUnLCByZXN1bHQuYVxuICAgICAgICAgIGRvbmUoKVxuXG4gIGl0ICdhZGRzIF9pZCB0byByb3dzJywgKGRvbmUpIC0+XG4gICAgQGRiLnRlc3QudXBzZXJ0IHsgYTogMSB9LCAoaXRlbSkgPT5cbiAgICAgIGFzc2VydC5wcm9wZXJ0eSBpdGVtLCAnX2lkJ1xuICAgICAgYXNzZXJ0Lmxlbmd0aE9mIGl0ZW0uX2lkLCAzMlxuICAgICAgZG9uZSgpXG5cbiAgaXQgJ3VwZGF0ZXMgYnkgaWQnLCAoZG9uZSkgLT5cbiAgICBAZGIudGVzdC51cHNlcnQgeyBfaWQ6MSwgYToxIH0sIChpdGVtKSA9PlxuICAgICAgQGRiLnRlc3QudXBzZXJ0IHsgX2lkOjEsIGE6MiB9LCAoaXRlbSkgPT5cbiAgICAgICAgYXNzZXJ0LmVxdWFsIGl0ZW0uYSwgMlxuICBcbiAgICAgICAgQGRiLnRlc3QuZmluZCh7fSkuZmV0Y2ggKHJlc3VsdHMpID0+XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsIDEsIHJlc3VsdHMubGVuZ3RoXG4gICAgICAgICAgZG9uZSgpXG5cblxuICBnZW9wb2ludCA9IChsbmcsIGxhdCkgLT5cbiAgICByZXR1cm4ge1xuICAgICAgICB0eXBlOiAnUG9pbnQnXG4gICAgICAgIGNvb3JkaW5hdGVzOiBbbG5nLCBsYXRdXG4gICAgfVxuXG4gIGNvbnRleHQgJ1dpdGggZ2VvbG9jYXRlZCByb3dzJywgLT5cbiAgICBiZWZvcmVFYWNoIChkb25lKSAtPlxuICAgICAgQGRiLnRlc3QudXBzZXJ0IHsgX2lkOjEsIGxvYzpnZW9wb2ludCg5MCwgNDUpIH0sID0+XG4gICAgICAgIEBkYi50ZXN0LnVwc2VydCB7IF9pZDoyLCBsb2M6Z2VvcG9pbnQoOTAsIDQ2KSB9LCA9PlxuICAgICAgICAgIEBkYi50ZXN0LnVwc2VydCB7IF9pZDozLCBsb2M6Z2VvcG9pbnQoOTEsIDQ1KSB9LCA9PlxuICAgICAgICAgICAgQGRiLnRlc3QudXBzZXJ0IHsgX2lkOjQsIGxvYzpnZW9wb2ludCg5MSwgNDYpIH0sID0+XG4gICAgICAgICAgICAgIGRvbmUoKVxuXG4gICAgaXQgJ2ZpbmRzIHBvaW50cyBuZWFyJywgKGRvbmUpIC0+XG4gICAgICBzZWxlY3RvciA9IGxvYzogXG4gICAgICAgICRuZWFyOiBcbiAgICAgICAgICAkZ2VvbWV0cnk6IGdlb3BvaW50KDkwLCA0NSlcblxuICAgICAgQGRiLnRlc3QuZmluZChzZWxlY3RvcikuZmV0Y2ggKHJlc3VsdHMpID0+XG4gICAgICAgIGFzc2VydC5kZWVwRXF1YWwgXy5wbHVjayhyZXN1bHRzLCAnX2lkJyksIFsxLDMsMiw0XVxuICAgICAgICBkb25lKClcblxuICAgIGl0ICdmaW5kcyBwb2ludHMgbmVhciBtYXhEaXN0YW5jZScsIChkb25lKSAtPlxuICAgICAgc2VsZWN0b3IgPSBsb2M6IFxuICAgICAgICAkbmVhcjogXG4gICAgICAgICAgJGdlb21ldHJ5OiBnZW9wb2ludCg5MCwgNDUpXG4gICAgICAgICAgJG1heERpc3RhbmNlOiAxMTEwMDBcblxuICAgICAgQGRiLnRlc3QuZmluZChzZWxlY3RvcikuZmV0Y2ggKHJlc3VsdHMpID0+XG4gICAgICAgIGFzc2VydC5kZWVwRXF1YWwgXy5wbHVjayhyZXN1bHRzLCAnX2lkJyksIFsxLDNdXG4gICAgICAgIGRvbmUoKSAgICAgIFxuXG4gICAgaXQgJ2ZpbmRzIHBvaW50cyBuZWFyIG1heERpc3RhbmNlIGp1c3QgYWJvdmUnLCAoZG9uZSkgLT5cbiAgICAgIHNlbGVjdG9yID0gbG9jOiBcbiAgICAgICAgJG5lYXI6IFxuICAgICAgICAgICRnZW9tZXRyeTogZ2VvcG9pbnQoOTAsIDQ1KVxuICAgICAgICAgICRtYXhEaXN0YW5jZTogMTEyMDAwXG5cbiAgICAgIEBkYi50ZXN0LmZpbmQoc2VsZWN0b3IpLmZldGNoIChyZXN1bHRzKSA9PlxuICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIF8ucGx1Y2socmVzdWx0cywgJ19pZCcpLCBbMSwzLDJdXG4gICAgICAgIGRvbmUoKVxuXG4gICAgaXQgJ2ZpbmRzIHBvaW50cyB3aXRoaW4gc2ltcGxlIGJveCcsIChkb25lKSAtPlxuICAgICAgc2VsZWN0b3IgPSBsb2M6IFxuICAgICAgICAkZ2VvSW50ZXJzZWN0czogXG4gICAgICAgICAgJGdlb21ldHJ5OiBcbiAgICAgICAgICAgIHR5cGU6ICdQb2x5Z29uJ1xuICAgICAgICAgICAgY29vcmRpbmF0ZXM6IFtbXG4gICAgICAgICAgICAgIFs4OS41LCA0NS41XSwgWzg5LjUsIDQ2LjVdLCBbOTAuNSwgNDYuNV0sIFs5MC41LCA0NS41XVxuICAgICAgICAgICAgXV1cbiAgICAgIEBkYi50ZXN0LmZpbmQoc2VsZWN0b3IpLmZldGNoIChyZXN1bHRzKSA9PlxuICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIF8ucGx1Y2socmVzdWx0cywgJ19pZCcpLCBbMl1cbiAgICAgICAgZG9uZSgpXG5cbiAgICBpdCAnaGFuZGxlcyB1bmRlZmluZWQnLCAoZG9uZSkgLT5cbiAgICAgIHNlbGVjdG9yID0gbG9jOiBcbiAgICAgICAgJGdlb0ludGVyc2VjdHM6IFxuICAgICAgICAgICRnZW9tZXRyeTogXG4gICAgICAgICAgICB0eXBlOiAnUG9seWdvbidcbiAgICAgICAgICAgIGNvb3JkaW5hdGVzOiBbW1xuICAgICAgICAgICAgICBbODkuNSwgNDUuNV0sIFs4OS41LCA0Ni41XSwgWzkwLjUsIDQ2LjVdLCBbOTAuNSwgNDUuNV1cbiAgICAgICAgICAgIF1dXG4gICAgICBAZGIudGVzdC51cHNlcnQgeyBfaWQ6NSB9LCA9PlxuICAgICAgICBAZGIudGVzdC5maW5kKHNlbGVjdG9yKS5mZXRjaCAocmVzdWx0cykgPT5cbiAgICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIF8ucGx1Y2socmVzdWx0cywgJ19pZCcpLCBbMl1cbiAgICAgICAgICBkb25lKClcblxuXG4iLCJcbmV4cG9ydHMuRGF0ZVF1ZXN0aW9uID0gcmVxdWlyZSAnLi9EYXRlUXVlc3Rpb24nXG5leHBvcnRzLkRyb3Bkb3duUXVlc3Rpb24gPSByZXF1aXJlICcuL0Ryb3Bkb3duUXVlc3Rpb24nXG5leHBvcnRzLlF1ZXN0aW9uR3JvdXAgPSByZXF1aXJlICcuL1F1ZXN0aW9uR3JvdXAnXG5leHBvcnRzLlNhdmVDYW5jZWxGb3JtID0gcmVxdWlyZSAnLi9TYXZlQ2FuY2VsRm9ybSdcbmV4cG9ydHMuU291cmNlUXVlc3Rpb24gPSByZXF1aXJlICcuL1NvdXJjZVF1ZXN0aW9uJ1xuZXhwb3J0cy5QaG90b3NRdWVzdGlvbiA9IHJlcXVpcmUgJy4vUGhvdG9zUXVlc3Rpb24nXG5cbiMgTXVzdCBiZSBjcmVhdGVkIHdpdGggbW9kZWwgKGJhY2tib25lIG1vZGVsKSBhbmQgY29udGVudHMgKGFycmF5IG9mIHZpZXdzKVxuZXhwb3J0cy5Gb3JtVmlldyA9IGNsYXNzIEZvcm1WaWV3IGV4dGVuZHMgQmFja2JvbmUuVmlld1xuICBpbml0aWFsaXplOiAob3B0aW9ucykgLT5cbiAgICBAY29udGVudHMgPSBvcHRpb25zLmNvbnRlbnRzXG4gICAgXG4gICAgIyBBZGQgY29udGVudHMgYW5kIGxpc3RlbiB0byBldmVudHNcbiAgICBmb3IgY29udGVudCBpbiBvcHRpb25zLmNvbnRlbnRzXG4gICAgICBAJGVsLmFwcGVuZChjb250ZW50LmVsKTtcbiAgICAgIEBsaXN0ZW5UbyBjb250ZW50LCAnY2xvc2UnLCA9PiBAdHJpZ2dlcignY2xvc2UnKVxuICAgICAgQGxpc3RlblRvIGNvbnRlbnQsICdjb21wbGV0ZScsID0+IEB0cmlnZ2VyKCdjb21wbGV0ZScpXG5cbiAgICAjIEFkZCBsaXN0ZW5lciB0byBtb2RlbFxuICAgIEBsaXN0ZW5UbyBAbW9kZWwsICdjaGFuZ2UnLCA9PiBAdHJpZ2dlcignY2hhbmdlJylcblxuICBsb2FkOiAoZGF0YSkgLT5cbiAgICBAbW9kZWwuY2xlYXIoKSAgI1RPRE8gY2xlYXIgb3Igbm90IGNsZWFyPyBjbGVhcmluZyByZW1vdmVzIGRlZmF1bHRzLCBidXQgYWxsb3dzIHRydWUgcmV1c2UuXG5cbiAgICAjIEFwcGx5IGRlZmF1bHRzIFxuICAgIEBtb2RlbC5zZXQoXy5kZWZhdWx0cyhfLmNsb25lRGVlcChkYXRhKSwgQG9wdGlvbnMuZGVmYXVsdHMgfHwge30pKVxuXG4gIHNhdmU6IC0+XG4gICAgcmV0dXJuIEBtb2RlbC50b0pTT04oKVxuXG5cbiMgU2ltcGxlIGZvcm0gdGhhdCBkaXNwbGF5cyBhIHRlbXBsYXRlIGJhc2VkIG9uIGxvYWRlZCBkYXRhXG5leHBvcnRzLnRlbXBsYXRlVmlldyA9ICh0ZW1wbGF0ZSkgLT4gXG4gIHJldHVybiB7XG4gICAgZWw6ICQoJzxkaXY+PC9kaXY+JylcbiAgICBsb2FkOiAoZGF0YSkgLT5cbiAgICAgICQoQGVsKS5odG1sIHRlbXBsYXRlKGRhdGEpXG4gIH1cblxuICAjIGNsYXNzIFRlbXBsYXRlVmlldyBleHRlbmRzIEJhY2tib25lLlZpZXdcbiAgIyBjb25zdHJ1Y3RvcjogKHRlbXBsYXRlKSAtPlxuICAjICAgQHRlbXBsYXRlID0gdGVtcGxhdGVcblxuICAjIGxvYWQ6IChkYXRhKSAtPlxuICAjICAgQCRlbC5odG1sIEB0ZW1wbGF0ZShkYXRhKVxuXG5cbmV4cG9ydHMuU3VydmV5VmlldyA9IGNsYXNzIFN1cnZleVZpZXcgZXh0ZW5kcyBGb3JtVmlld1xuXG5leHBvcnRzLldhdGVyVGVzdEVkaXRWaWV3ID0gY2xhc3MgV2F0ZXJUZXN0RWRpdFZpZXcgZXh0ZW5kcyBGb3JtVmlld1xuICBpbml0aWFsaXplOiAob3B0aW9ucykgLT5cbiAgICBzdXBlcihvcHRpb25zKVxuXG4gICAgIyBBZGQgYnV0dG9ucyBhdCBib3R0b21cbiAgICAjIFRPRE8gbW92ZSB0byB0ZW1wbGF0ZSBhbmQgc2VwIGZpbGVcbiAgICBAJGVsLmFwcGVuZCAkKCcnJ1xuICAgICAgPGRpdj5cbiAgICAgICAgICA8YnV0dG9uIGlkPVwiY2xvc2VfYnV0dG9uXCIgdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwiYnRuIG1hcmdpbmVkXCI+U2F2ZSBmb3IgTGF0ZXI8L2J1dHRvbj5cbiAgICAgICAgICAmbmJzcDtcbiAgICAgICAgICA8YnV0dG9uIGlkPVwiY29tcGxldGVfYnV0dG9uXCIgdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwiYnRuIGJ0bi1wcmltYXJ5IG1hcmdpbmVkXCI+PGkgY2xhc3M9XCJpY29uLW9rIGljb24td2hpdGVcIj48L2k+IENvbXBsZXRlPC9idXR0b24+XG4gICAgICA8L2Rpdj5cbiAgICAnJycpXG5cbiAgZXZlbnRzOiBcbiAgICBcImNsaWNrICNjbG9zZV9idXR0b25cIiA6IFwiY2xvc2VcIlxuICAgIFwiY2xpY2sgI2NvbXBsZXRlX2J1dHRvblwiIDogXCJjb21wbGV0ZVwiXG5cbiAgIyBUT0RPIHJlZmFjdG9yIHdpdGggU2F2ZUNhbmNlbEZvcm1cbiAgdmFsaWRhdGU6IC0+XG4gICAgIyBHZXQgYWxsIHZpc2libGUgaXRlbXNcbiAgICBpdGVtcyA9IF8uZmlsdGVyKEBjb250ZW50cywgKGMpIC0+XG4gICAgICBjLnZpc2libGUgYW5kIGMudmFsaWRhdGVcbiAgICApXG4gICAgcmV0dXJuIG5vdCBfLmFueShfLm1hcChpdGVtcywgKGl0ZW0pIC0+XG4gICAgICBpdGVtLnZhbGlkYXRlKClcbiAgICApKVxuXG4gIGNsb3NlOiAtPlxuICAgIEB0cmlnZ2VyICdjbG9zZSdcblxuICBjb21wbGV0ZTogLT5cbiAgICBpZiBAdmFsaWRhdGUoKVxuICAgICAgQHRyaWdnZXIgJ2NvbXBsZXRlJ1xuICAgICAgXG4jIENyZWF0ZXMgYSBmb3JtIHZpZXcgZnJvbSBhIHN0cmluZ1xuZXhwb3J0cy5pbnN0YW50aWF0ZVZpZXcgPSAodmlld1N0ciwgb3B0aW9ucykgPT5cbiAgdmlld0Z1bmMgPSBuZXcgRnVuY3Rpb24oXCJvcHRpb25zXCIsIHZpZXdTdHIpXG4gIHZpZXdGdW5jKG9wdGlvbnMpXG5cbl8uZXh0ZW5kKGV4cG9ydHMsIHJlcXVpcmUoJy4vZm9ybS1jb250cm9scycpKVxuXG5cbiMgVE9ETyBmaWd1cmUgb3V0IGhvdyB0byBhbGxvdyB0d28gc3VydmV5cyBmb3IgZGlmZmVyaW5nIGNsaWVudCB2ZXJzaW9ucz8gT3IganVzdCB1c2UgbWluVmVyc2lvbj8iLCJhc3NlcnQgPSBjaGFpLmFzc2VydFxuXG5jbGFzcyBVSURyaXZlclxuICBjb25zdHJ1Y3RvcjogKGVsKSAtPlxuICAgIEBlbCA9ICQoZWwpXG5cbiAgZ2V0RGlzYWJsZWQ6IChzdHIpIC0+XG4gICAgZm9yIGl0ZW0gaW4gQGVsLmZpbmQoXCJhLGJ1dHRvblwiKVxuICAgICAgaWYgJChpdGVtKS50ZXh0KCkuaW5kZXhPZihzdHIpICE9IC0xXG4gICAgICAgIHJldHVybiAkKGl0ZW0pLmlzKFwiOmRpc2FibGVkXCIpXG4gICAgYXNzZXJ0LmZhaWwobnVsbCwgc3RyLCBcIkNhbid0IGZpbmQ6IFwiICsgc3RyKVxuXG4gIGNsaWNrOiAoc3RyKSAtPlxuICAgIGZvciBpdGVtIGluIEBlbC5maW5kKFwiYSxidXR0b25cIilcbiAgICAgIGlmICQoaXRlbSkudGV4dCgpLmluZGV4T2Yoc3RyKSAhPSAtMVxuICAgICAgICBjb25zb2xlLmxvZyBcIkNsaWNraW5nOiBcIiArICQoaXRlbSkudGV4dCgpXG4gICAgICAgICQoaXRlbSkudHJpZ2dlcihcImNsaWNrXCIpXG4gICAgICAgIHJldHVyblxuICAgIGFzc2VydC5mYWlsKG51bGwsIHN0ciwgXCJDYW4ndCBmaW5kOiBcIiArIHN0cilcbiAgXG4gIGZpbGw6IChzdHIsIHZhbHVlKSAtPlxuICAgIGZvciBpdGVtIGluIEBlbC5maW5kKFwibGFiZWxcIilcbiAgICAgIGlmICQoaXRlbSkudGV4dCgpLmluZGV4T2Yoc3RyKSAhPSAtMVxuICAgICAgICBib3ggPSBAZWwuZmluZChcIiNcIiskKGl0ZW0pLmF0dHIoJ2ZvcicpKVxuICAgICAgICBib3gudmFsKHZhbHVlKVxuICBcbiAgdGV4dDogLT5cbiAgICByZXR1cm4gQGVsLnRleHQoKVxuICAgICAgXG4gIHdhaXQ6IChhZnRlcikgLT5cbiAgICBzZXRUaW1lb3V0IGFmdGVyLCAxMFxuXG5tb2R1bGUuZXhwb3J0cyA9IFVJRHJpdmVyIiwiIyBHZW9KU09OIGhlbHBlciByb3V0aW5lc1xuXG4jIENvbnZlcnRzIG5hdmlnYXRvciBwb3NpdGlvbiB0byBwb2ludFxuZXhwb3J0cy5wb3NUb1BvaW50ID0gKHBvcykgLT5cbiAgcmV0dXJuIHtcbiAgICB0eXBlOiAnUG9pbnQnXG4gICAgY29vcmRpbmF0ZXM6IFtwb3MuY29vcmRzLmxvbmdpdHVkZSwgcG9zLmNvb3Jkcy5sYXRpdHVkZV1cbiAgfVxuXG5cbmV4cG9ydHMubGF0TG5nQm91bmRzVG9HZW9KU09OID0gKGJvdW5kcykgLT5cbiAgc3cgPSBib3VuZHMuZ2V0U291dGhXZXN0KClcbiAgbmUgPSBib3VuZHMuZ2V0Tm9ydGhFYXN0KClcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiAnUG9seWdvbicsXG4gICAgY29vcmRpbmF0ZXM6IFtcbiAgICAgIFtbc3cubG5nLCBzdy5sYXRdLCBcbiAgICAgIFtzdy5sbmcsIG5lLmxhdF0sIFxuICAgICAgW25lLmxuZywgbmUubGF0XSwgXG4gICAgICBbbmUubG5nLCBzdy5sYXRdXVxuICAgIF1cbiAgfVxuXG4jIFRPRE86IG9ubHkgd29ya3Mgd2l0aCBib3VuZHNcbmV4cG9ydHMucG9pbnRJblBvbHlnb24gPSAocG9pbnQsIHBvbHlnb24pIC0+XG4gICMgR2V0IGJvdW5kc1xuICBib3VuZHMgPSBuZXcgTC5MYXRMbmdCb3VuZHMoXy5tYXAocG9seWdvbi5jb29yZGluYXRlc1swXSwgKGNvb3JkKSAtPiBuZXcgTC5MYXRMbmcoY29vcmRbMV0sIGNvb3JkWzBdKSkpXG4gIHJldHVybiBib3VuZHMuY29udGFpbnMobmV3IEwuTGF0TG5nKHBvaW50LmNvb3JkaW5hdGVzWzFdLCBwb2ludC5jb29yZGluYXRlc1swXSkpXG5cbmV4cG9ydHMuZ2V0UmVsYXRpdmVMb2NhdGlvbiA9IChmcm9tLCB0bykgLT5cbiAgeDEgPSBmcm9tLmNvb3JkaW5hdGVzWzBdXG4gIHkxID0gZnJvbS5jb29yZGluYXRlc1sxXVxuICB4MiA9IHRvLmNvb3JkaW5hdGVzWzBdXG4gIHkyID0gdG8uY29vcmRpbmF0ZXNbMV1cbiAgXG4gICMgQ29udmVydCB0byByZWxhdGl2ZSBwb3NpdGlvbiAoYXBwcm94aW1hdGUpXG4gIGR5ID0gKHkyIC0geTEpIC8gNTcuMyAqIDYzNzEwMDBcbiAgZHggPSBNYXRoLmNvcyh5MSAvIDU3LjMpICogKHgyIC0geDEpIC8gNTcuMyAqIDYzNzEwMDBcbiAgXG4gICMgRGV0ZXJtaW5lIGRpcmVjdGlvbiBhbmQgYW5nbGVcbiAgZGlzdCA9IE1hdGguc3FydChkeCAqIGR4ICsgZHkgKiBkeSlcbiAgYW5nbGUgPSA5MCAtIChNYXRoLmF0YW4yKGR5LCBkeCkgKiA1Ny4zKVxuICBhbmdsZSArPSAzNjAgaWYgYW5nbGUgPCAwXG4gIGFuZ2xlIC09IDM2MCBpZiBhbmdsZSA+IDM2MFxuICBcbiAgIyBHZXQgYXBwcm94aW1hdGUgZGlyZWN0aW9uXG4gIGNvbXBhc3NEaXIgPSAoTWF0aC5mbG9vcigoYW5nbGUgKyAyMi41KSAvIDQ1KSkgJSA4XG4gIGNvbXBhc3NTdHJzID0gW1wiTlwiLCBcIk5FXCIsIFwiRVwiLCBcIlNFXCIsIFwiU1wiLCBcIlNXXCIsIFwiV1wiLCBcIk5XXCJdXG4gIGlmIGRpc3QgPiAxMDAwXG4gICAgKGRpc3QgLyAxMDAwKS50b0ZpeGVkKDEpICsgXCJrbSBcIiArIGNvbXBhc3NTdHJzW2NvbXBhc3NEaXJdXG4gIGVsc2VcbiAgICAoZGlzdCkudG9GaXhlZCgwKSArIFwibSBcIiArIGNvbXBhc3NTdHJzW2NvbXBhc3NEaXJdIiwiXG4jIFRyYWNrcyBhIHNldCBvZiBpdGVtcyBieSBpZCwgaW5kaWNhdGluZyB3aGljaCBoYXZlIGJlZW4gYWRkZWQgb3IgcmVtb3ZlZC5cbiMgQ2hhbmdlcyBhcmUgYm90aCBhZGQgYW5kIHJlbW92ZVxuY2xhc3MgSXRlbVRyYWNrZXJcbiAgY29uc3RydWN0b3I6IC0+XG4gICAgQGtleSA9ICdfaWQnXG4gICAgQGl0ZW1zID0ge31cblxuICB1cGRhdGU6IChpdGVtcykgLT4gICAgIyBSZXR1cm4gW1thZGRlZF0sW3JlbW92ZWRdXSBpdGVtc1xuICAgIGFkZHMgPSBbXVxuICAgIHJlbW92ZXMgPSBbXVxuXG4gICAgIyBBZGQgYW55IG5ldyBvbmVzXG4gICAgZm9yIGl0ZW0gaW4gaXRlbXNcbiAgICAgIGlmIG5vdCBfLmhhcyhAaXRlbXMsIGl0ZW1bQGtleV0pXG4gICAgICAgIGFkZHMucHVzaChpdGVtKVxuXG4gICAgIyBDcmVhdGUgbWFwIG9mIGl0ZW1zIHBhcmFtZXRlclxuICAgIG1hcCA9IF8ub2JqZWN0KF8ucGx1Y2soaXRlbXMsIEBrZXkpLCBpdGVtcylcblxuICAgICMgRmluZCByZW1vdmVzXG4gICAgZm9yIGtleSwgdmFsdWUgb2YgQGl0ZW1zXG4gICAgICBpZiBub3QgXy5oYXMobWFwLCBrZXkpXG4gICAgICAgIHJlbW92ZXMucHVzaCh2YWx1ZSlcbiAgICAgIGVsc2UgaWYgbm90IF8uaXNFcXVhbCh2YWx1ZSwgbWFwW2tleV0pXG4gICAgICAgIGFkZHMucHVzaChtYXBba2V5XSlcbiAgICAgICAgcmVtb3Zlcy5wdXNoKHZhbHVlKVxuXG4gICAgZm9yIGl0ZW0gaW4gcmVtb3Zlc1xuICAgICAgZGVsZXRlIEBpdGVtc1tpdGVtW0BrZXldXVxuXG4gICAgZm9yIGl0ZW0gaW4gYWRkc1xuICAgICAgQGl0ZW1zW2l0ZW1bQGtleV1dID0gaXRlbVxuXG4gICAgcmV0dXJuIFthZGRzLCByZW1vdmVzXVxuXG5tb2R1bGUuZXhwb3J0cyA9IEl0ZW1UcmFja2VyIiwiTG9jYXRpb25GaW5kZXIgPSByZXF1aXJlICcuL0xvY2F0aW9uRmluZGVyJ1xuR2VvSlNPTiA9IHJlcXVpcmUgJy4vR2VvSlNPTidcblxuIyBTaG93cyB0aGUgcmVsYXRpdmUgbG9jYXRpb24gb2YgYSBwb2ludCBhbmQgYWxsb3dzIHNldHRpbmcgaXRcbiMgRmlyZXMgZXZlbnRzIGxvY2F0aW9uc2V0LCBtYXAsIGJvdGggd2l0aCBcbmNsYXNzIExvY2F0aW9uVmlldyBleHRlbmRzIEJhY2tib25lLlZpZXdcbiAgY29uc3RydWN0b3I6IChvcHRpb25zKSAtPlxuICAgIHN1cGVyKClcbiAgICBAbG9jID0gb3B0aW9ucy5sb2NcbiAgICBAc2V0dGluZ0xvY2F0aW9uID0gZmFsc2VcbiAgICBAbG9jYXRpb25GaW5kZXIgPSBvcHRpb25zLmxvY2F0aW9uRmluZGVyIHx8IG5ldyBMb2NhdGlvbkZpbmRlcigpXG5cbiAgICAjIExpc3RlbiB0byBsb2NhdGlvbiBldmVudHNcbiAgICBAbGlzdGVuVG8oQGxvY2F0aW9uRmluZGVyLCAnZm91bmQnLCBAbG9jYXRpb25Gb3VuZClcbiAgICBAbGlzdGVuVG8oQGxvY2F0aW9uRmluZGVyLCAnZXJyb3InLCBAbG9jYXRpb25FcnJvcilcblxuICAgICMgU3RhcnQgdHJhY2tpbmcgbG9jYXRpb24gaWYgc2V0XG4gICAgaWYgQGxvY1xuICAgICAgQGxvY2F0aW9uRmluZGVyLnN0YXJ0V2F0Y2goKVxuXG4gICAgQHJlbmRlcigpXG5cbiAgZXZlbnRzOlxuICAgICdjbGljayAjbG9jYXRpb25fbWFwJyA6ICdtYXBDbGlja2VkJ1xuICAgICdjbGljayAjbG9jYXRpb25fc2V0JyA6ICdzZXRMb2NhdGlvbidcblxuICByZW1vdmU6IC0+XG4gICAgQGxvY2F0aW9uRmluZGVyLnN0b3BXYXRjaCgpXG4gICAgc3VwZXIoKVxuXG4gIHJlbmRlcjogLT5cbiAgICBAJGVsLmh0bWwgdGVtcGxhdGVzWydMb2NhdGlvblZpZXcnXSgpXG5cbiAgICAjIFNldCBsb2NhdGlvbiBzdHJpbmdcbiAgICBpZiBAZXJyb3JGaW5kaW5nTG9jYXRpb25cbiAgICAgIEAkKFwiI2xvY2F0aW9uX3JlbGF0aXZlXCIpLnRleHQoXCJDYW5ub3QgZmluZCBsb2NhdGlvblwiKVxuICAgIGVsc2UgaWYgbm90IEBsb2MgYW5kIG5vdCBAc2V0dGluZ0xvY2F0aW9uIFxuICAgICAgQCQoXCIjbG9jYXRpb25fcmVsYXRpdmVcIikudGV4dChcIlVuc3BlY2lmaWVkIGxvY2F0aW9uXCIpXG4gICAgZWxzZSBpZiBAc2V0dGluZ0xvY2F0aW9uXG4gICAgICBAJChcIiNsb2NhdGlvbl9yZWxhdGl2ZVwiKS50ZXh0KFwiU2V0dGluZyBsb2NhdGlvbi4uLlwiKVxuICAgIGVsc2UgaWYgbm90IEBjdXJyZW50TG9jXG4gICAgICBAJChcIiNsb2NhdGlvbl9yZWxhdGl2ZVwiKS50ZXh0KFwiV2FpdGluZyBmb3IgR1BTLi4uXCIpXG4gICAgZWxzZVxuICAgICAgQCQoXCIjbG9jYXRpb25fcmVsYXRpdmVcIikudGV4dChHZW9KU09OLmdldFJlbGF0aXZlTG9jYXRpb24oQGN1cnJlbnRMb2MsIEBsb2MpKVxuXG4gICAgIyBEaXNhYmxlIG1hcCBpZiBsb2NhdGlvbiBub3Qgc2V0XG4gICAgQCQoXCIjbG9jYXRpb25fbWFwXCIpLmF0dHIoXCJkaXNhYmxlZFwiLCBub3QgQGxvYyk7XG5cbiAgICAjIERpc2FibGUgc2V0IGlmIHNldHRpbmdcbiAgICBAJChcIiNsb2NhdGlvbl9zZXRcIikuYXR0cihcImRpc2FibGVkXCIsIEBzZXR0aW5nTG9jYXRpb24gPT0gdHJ1ZSk7ICAgIFxuXG4gIHNldExvY2F0aW9uOiAtPlxuICAgIEBzZXR0aW5nTG9jYXRpb24gPSB0cnVlXG4gICAgQGVycm9yRmluZGluZ0xvY2F0aW9uID0gZmFsc2VcbiAgICBAbG9jYXRpb25GaW5kZXIuc3RhcnRXYXRjaCgpXG4gICAgQHJlbmRlcigpXG5cbiAgbG9jYXRpb25Gb3VuZDogKHBvcykgPT5cbiAgICBpZiBAc2V0dGluZ0xvY2F0aW9uXG4gICAgICBAc2V0dGluZ0xvY2F0aW9uID0gZmFsc2VcbiAgICAgIEBlcnJvckZpbmRpbmdMb2NhdGlvbiA9IGZhbHNlXG5cbiAgICAgICMgU2V0IGxvY2F0aW9uXG4gICAgICBAbG9jID0gR2VvSlNPTi5wb3NUb1BvaW50KHBvcylcbiAgICAgIEB0cmlnZ2VyKCdsb2NhdGlvbnNldCcsIEBsb2MpXG5cbiAgICBAY3VycmVudExvYyA9IEdlb0pTT04ucG9zVG9Qb2ludChwb3MpXG4gICAgQHJlbmRlcigpXG5cbiAgbG9jYXRpb25FcnJvcjogPT5cbiAgICBAc2V0dGluZ0xvY2F0aW9uID0gZmFsc2VcbiAgICBAZXJyb3JGaW5kaW5nTG9jYXRpb24gPSB0cnVlXG4gICAgQHJlbmRlcigpXG5cbiAgbWFwQ2xpY2tlZDogPT5cbiAgICBAdHJpZ2dlcignbWFwJywgQGxvYylcblxuXG5tb2R1bGUuZXhwb3J0cyA9IExvY2F0aW9uVmlldyIsImNvbXBpbGVEb2N1bWVudFNlbGVjdG9yID0gcmVxdWlyZSgnLi9zZWxlY3RvcicpLmNvbXBpbGVEb2N1bWVudFNlbGVjdG9yXG5jb21waWxlU29ydCA9IHJlcXVpcmUoJy4vc2VsZWN0b3InKS5jb21waWxlU29ydFxuR2VvSlNPTiA9IHJlcXVpcmUgJy4uL0dlb0pTT04nXG5cbmNsYXNzIExvY2FsRGJcbiAgY29uc3RydWN0b3I6IChuYW1lLCBvcHRpb25zKSAtPlxuICAgIEBuYW1lID0gbmFtZVxuICAgIEBjb2xsZWN0aW9ucyA9IHt9XG5cbiAgICBpZiBvcHRpb25zIGFuZCBvcHRpb25zLm5hbWVzcGFjZSBhbmQgd2luZG93LmxvY2FsU3RvcmFnZVxuICAgICAgQG5hbWVzcGFjZSA9IG9wdGlvbnMubmFtZXNwYWNlXG5cbiAgYWRkQ29sbGVjdGlvbjogKG5hbWUpIC0+XG4gICAgZGJOYW1lID0gQG5hbWVcblxuICAgICMgU2V0IG5hbWVzcGFjZSBmb3IgY29sbGVjdGlvblxuICAgIG5hbWVzcGFjZSA9IEBuYW1lc3BhY2UrXCIuXCIrbmFtZSBpZiBAbmFtZXNwYWNlXG5cbiAgICBjb2xsZWN0aW9uID0gbmV3IENvbGxlY3Rpb24obmFtZSwgbmFtZXNwYWNlKVxuICAgIEBbbmFtZV0gPSBjb2xsZWN0aW9uXG4gICAgQGNvbGxlY3Rpb25zW25hbWVdID0gY29sbGVjdGlvblxuXG4gIHJlbW92ZUNvbGxlY3Rpb246IChuYW1lKSAtPlxuICAgIGRiTmFtZSA9IEBuYW1lXG5cbiAgICBpZiBAbmFtZXNwYWNlIGFuZCB3aW5kb3cubG9jYWxTdG9yYWdlXG4gICAgICBrZXlzID0gW11cbiAgICAgIGZvciBpIGluIFswLi4ubG9jYWxTdG9yYWdlLmxlbmd0aF1cbiAgICAgICAga2V5cy5wdXNoKGxvY2FsU3RvcmFnZS5rZXkoaSkpXG5cbiAgICAgIGZvciBrZXkgaW4ga2V5c1xuICAgICAgICBpZiBrZXkuc3Vic3RyaW5nKDAsIEBuYW1lc3BhY2UubGVuZ3RoICsgMSkgPT0gQG5hbWVzcGFjZSArIFwiLlwiXG4gICAgICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oa2V5KVxuXG4gICAgZGVsZXRlIEBbbmFtZV1cbiAgICBkZWxldGUgQGNvbGxlY3Rpb25zW25hbWVdXG5cblxuIyBTdG9yZXMgZGF0YSBpbiBtZW1vcnksIG9wdGlvbmFsbHkgYmFja2VkIGJ5IGxvY2FsIHN0b3JhZ2VcbmNsYXNzIENvbGxlY3Rpb25cbiAgY29uc3RydWN0b3I6IChuYW1lLCBuYW1lc3BhY2UpIC0+XG4gICAgQG5hbWUgPSBuYW1lXG4gICAgQG5hbWVzcGFjZSA9IG5hbWVzcGFjZVxuXG4gICAgQGl0ZW1zID0ge31cbiAgICBAdXBzZXJ0cyA9IHt9ICAjIFBlbmRpbmcgdXBzZXJ0cyBieSBfaWQuIFN0aWxsIGluIGl0ZW1zXG4gICAgQHJlbW92ZXMgPSB7fSAgIyBQZW5kaW5nIHJlbW92ZXMgYnkgX2lkLiBObyBsb25nZXIgaW4gaXRlbXNcblxuICAgICMgUmVhZCBmcm9tIGxvY2FsIHN0b3JhZ2VcbiAgICBpZiB3aW5kb3cubG9jYWxTdG9yYWdlIGFuZCBuYW1lc3BhY2U/XG4gICAgICBAbG9hZFN0b3JhZ2UoKVxuXG4gIGxvYWRTdG9yYWdlOiAtPlxuICAgICMgUmVhZCBpdGVtcyBmcm9tIGxvY2FsU3RvcmFnZVxuICAgIEBpdGVtTmFtZXNwYWNlID0gQG5hbWVzcGFjZSArIFwiX1wiXG5cbiAgICBmb3IgaSBpbiBbMC4uLmxvY2FsU3RvcmFnZS5sZW5ndGhdXG4gICAgICBrZXkgPSBsb2NhbFN0b3JhZ2Uua2V5KGkpXG4gICAgICBpZiBrZXkuc3Vic3RyaW5nKDAsIEBpdGVtTmFtZXNwYWNlLmxlbmd0aCkgPT0gQGl0ZW1OYW1lc3BhY2VcbiAgICAgICAgaXRlbSA9IEpTT04ucGFyc2UobG9jYWxTdG9yYWdlW2tleV0pXG4gICAgICAgIEBpdGVtc1tpdGVtLl9pZF0gPSBpdGVtXG5cbiAgICAjIFJlYWQgdXBzZXJ0c1xuICAgIHVwc2VydEtleXMgPSBpZiBsb2NhbFN0b3JhZ2VbQG5hbWVzcGFjZStcInVwc2VydHNcIl0gdGhlbiBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZVtAbmFtZXNwYWNlK1widXBzZXJ0c1wiXSkgZWxzZSBbXVxuICAgIGZvciBrZXkgaW4gdXBzZXJ0S2V5c1xuICAgICAgQHVwc2VydHNba2V5XSA9IEBpdGVtc1trZXldXG5cbiAgICAjIFJlYWQgcmVtb3Zlc1xuICAgIHJlbW92ZUl0ZW1zID0gaWYgbG9jYWxTdG9yYWdlW0BuYW1lc3BhY2UrXCJyZW1vdmVzXCJdIHRoZW4gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2VbQG5hbWVzcGFjZStcInJlbW92ZXNcIl0pIGVsc2UgW11cbiAgICBAcmVtb3ZlcyA9IF8ub2JqZWN0KF8ucGx1Y2socmVtb3ZlSXRlbXMsIFwiX2lkXCIpLCByZW1vdmVJdGVtcylcblxuICBmaW5kOiAoc2VsZWN0b3IsIG9wdGlvbnMpIC0+XG4gICAgcmV0dXJuIGZldGNoOiAoc3VjY2VzcywgZXJyb3IpID0+XG4gICAgICBAX2ZpbmRGZXRjaChzZWxlY3Rvciwgb3B0aW9ucywgc3VjY2VzcywgZXJyb3IpXG5cbiAgZmluZE9uZTogKHNlbGVjdG9yLCBvcHRpb25zLCBzdWNjZXNzLCBlcnJvcikgLT5cbiAgICBpZiBfLmlzRnVuY3Rpb24ob3B0aW9ucykgXG4gICAgICBbb3B0aW9ucywgc3VjY2VzcywgZXJyb3JdID0gW3t9LCBvcHRpb25zLCBzdWNjZXNzXVxuXG4gICAgQGZpbmQoc2VsZWN0b3IsIG9wdGlvbnMpLmZldGNoIChyZXN1bHRzKSAtPlxuICAgICAgaWYgc3VjY2Vzcz8gdGhlbiBzdWNjZXNzKGlmIHJlc3VsdHMubGVuZ3RoPjAgdGhlbiByZXN1bHRzWzBdIGVsc2UgbnVsbClcbiAgICAsIGVycm9yXG5cbiAgX2ZpbmRGZXRjaDogKHNlbGVjdG9yLCBvcHRpb25zLCBzdWNjZXNzLCBlcnJvcikgLT5cbiAgICBmaWx0ZXJlZCA9IF8uZmlsdGVyKF8udmFsdWVzKEBpdGVtcyksIGNvbXBpbGVEb2N1bWVudFNlbGVjdG9yKHNlbGVjdG9yKSlcblxuICAgICMgSGFuZGxlIGdlb3NwYXRpYWwgb3BlcmF0b3JzXG4gICAgZmlsdGVyZWQgPSBwcm9jZXNzTmVhck9wZXJhdG9yKHNlbGVjdG9yLCBmaWx0ZXJlZClcbiAgICBmaWx0ZXJlZCA9IHByb2Nlc3NHZW9JbnRlcnNlY3RzT3BlcmF0b3Ioc2VsZWN0b3IsIGZpbHRlcmVkKVxuXG4gICAgaWYgb3B0aW9ucyBhbmQgb3B0aW9ucy5zb3J0IFxuICAgICAgZmlsdGVyZWQuc29ydChjb21waWxlU29ydChvcHRpb25zLnNvcnQpKVxuXG4gICAgaWYgb3B0aW9ucyBhbmQgb3B0aW9ucy5saW1pdFxuICAgICAgZmlsdGVyZWQgPSBfLmZpcnN0IGZpbHRlcmVkLCBvcHRpb25zLmxpbWl0XG5cbiAgICAjIENsb25lIHRvIHByZXZlbnQgYWNjaWRlbnRhbCB1cGRhdGVzXG4gICAgZmlsdGVyZWQgPSBfLm1hcCBmaWx0ZXJlZCwgKGRvYykgLT4gXy5jbG9uZURlZXAoZG9jKVxuICAgIGlmIHN1Y2Nlc3M/IHRoZW4gc3VjY2VzcyhmaWx0ZXJlZClcblxuICB1cHNlcnQ6IChkb2MsIHN1Y2Nlc3MsIGVycm9yKSAtPlxuICAgIGlmIG5vdCBkb2MuX2lkXG4gICAgICBkb2MuX2lkID0gY3JlYXRlVWlkKClcblxuICAgICMgUmVwbGFjZS9hZGQgXG4gICAgQF9wdXRJdGVtKGRvYylcbiAgICBAX3B1dFVwc2VydChkb2MpXG5cbiAgICBpZiBzdWNjZXNzPyB0aGVuIHN1Y2Nlc3MoZG9jKVxuXG4gIHJlbW92ZTogKGlkLCBzdWNjZXNzLCBlcnJvcikgLT5cbiAgICBpZiBfLmhhcyhAaXRlbXMsIGlkKVxuICAgICAgQF9wdXRSZW1vdmUoQGl0ZW1zW2lkXSlcbiAgICAgIEBfZGVsZXRlSXRlbShpZClcbiAgICAgIEBfZGVsZXRlVXBzZXJ0KGlkKVxuXG4gICAgaWYgc3VjY2Vzcz8gdGhlbiBzdWNjZXNzKClcblxuICBfcHV0SXRlbTogKGRvYykgLT5cbiAgICBAaXRlbXNbZG9jLl9pZF0gPSBkb2NcbiAgICBpZiBAbmFtZXNwYWNlXG4gICAgICBsb2NhbFN0b3JhZ2VbQGl0ZW1OYW1lc3BhY2UgKyBkb2MuX2lkXSA9IEpTT04uc3RyaW5naWZ5KGRvYylcblxuICBfZGVsZXRlSXRlbTogKGlkKSAtPlxuICAgIGRlbGV0ZSBAaXRlbXNbaWRdXG4gICAgaWYgQG5hbWVzcGFjZVxuICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oQGl0ZW1OYW1lc3BhY2UgKyBpZClcblxuICBfcHV0VXBzZXJ0OiAoZG9jKSAtPlxuICAgIEB1cHNlcnRzW2RvYy5faWRdID0gZG9jXG4gICAgaWYgQG5hbWVzcGFjZVxuICAgICAgbG9jYWxTdG9yYWdlW0BuYW1lc3BhY2UrXCJ1cHNlcnRzXCJdID0gSlNPTi5zdHJpbmdpZnkoXy5rZXlzKEB1cHNlcnRzKSlcblxuICBfZGVsZXRlVXBzZXJ0OiAoaWQpIC0+XG4gICAgZGVsZXRlIEB1cHNlcnRzW2lkXVxuICAgIGlmIEBuYW1lc3BhY2VcbiAgICAgIGxvY2FsU3RvcmFnZVtAbmFtZXNwYWNlK1widXBzZXJ0c1wiXSA9IEpTT04uc3RyaW5naWZ5KF8ua2V5cyhAdXBzZXJ0cykpXG5cbiAgX3B1dFJlbW92ZTogKGRvYykgLT5cbiAgICBAcmVtb3Zlc1tkb2MuX2lkXSA9IGRvY1xuICAgIGlmIEBuYW1lc3BhY2VcbiAgICAgIGxvY2FsU3RvcmFnZVtAbmFtZXNwYWNlK1wicmVtb3Zlc1wiXSA9IEpTT04uc3RyaW5naWZ5KF8udmFsdWVzKEByZW1vdmVzKSlcblxuICBfZGVsZXRlUmVtb3ZlOiAoaWQpIC0+XG4gICAgZGVsZXRlIEByZW1vdmVzW2lkXVxuICAgIGlmIEBuYW1lc3BhY2VcbiAgICAgIGxvY2FsU3RvcmFnZVtAbmFtZXNwYWNlK1wicmVtb3Zlc1wiXSA9IEpTT04uc3RyaW5naWZ5KF8udmFsdWVzKEByZW1vdmVzKSlcblxuICBjYWNoZTogKGRvY3MsIHNlbGVjdG9yLCBvcHRpb25zLCBzdWNjZXNzLCBlcnJvcikgLT5cbiAgICAjIEFkZCBhbGwgbm9uLWxvY2FsIHRoYXQgYXJlIG5vdCB1cHNlcnRlZCBvciByZW1vdmVkXG4gICAgZm9yIGRvYyBpbiBkb2NzXG4gICAgICBpZiBub3QgXy5oYXMoQHVwc2VydHMsIGRvYy5faWQpIGFuZCBub3QgXy5oYXMoQHJlbW92ZXMsIGRvYy5faWQpXG4gICAgICAgIEBfcHV0SXRlbShkb2MpXG5cbiAgICBkb2NzTWFwID0gXy5vYmplY3QoXy5wbHVjayhkb2NzLCBcIl9pZFwiKSwgZG9jcylcblxuICAgIGlmIG9wdGlvbnMuc29ydFxuICAgICAgc29ydCA9IGNvbXBpbGVTb3J0KG9wdGlvbnMuc29ydClcblxuICAgICMgUGVyZm9ybSBxdWVyeSwgcmVtb3Zpbmcgcm93cyBtaXNzaW5nIGluIGRvY3MgZnJvbSBsb2NhbCBkYiBcbiAgICBAZmluZChzZWxlY3Rvciwgb3B0aW9ucykuZmV0Y2ggKHJlc3VsdHMpID0+XG4gICAgICBmb3IgcmVzdWx0IGluIHJlc3VsdHNcbiAgICAgICAgaWYgbm90IGRvY3NNYXBbcmVzdWx0Ll9pZF0gYW5kIG5vdCBfLmhhcyhAdXBzZXJ0cywgcmVzdWx0Ll9pZClcbiAgICAgICAgICAjIElmIHBhc3QgZW5kIG9uIHNvcnRlZCBsaW1pdGVkLCBpZ25vcmVcbiAgICAgICAgICBpZiBvcHRpb25zLnNvcnQgYW5kIG9wdGlvbnMubGltaXQgYW5kIGRvY3MubGVuZ3RoID09IG9wdGlvbnMubGltaXRcbiAgICAgICAgICAgIGlmIHNvcnQocmVzdWx0LCBfLmxhc3QoZG9jcykpID49IDBcbiAgICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICBAX2RlbGV0ZUl0ZW0ocmVzdWx0Ll9pZClcblxuICAgICAgaWYgc3VjY2Vzcz8gdGhlbiBzdWNjZXNzKCkgIFxuICAgICwgZXJyb3JcbiAgICBcbiAgcGVuZGluZ1Vwc2VydHM6IChzdWNjZXNzKSAtPlxuICAgIHN1Y2Nlc3MgXy52YWx1ZXMoQHVwc2VydHMpXG5cbiAgcGVuZGluZ1JlbW92ZXM6IChzdWNjZXNzKSAtPlxuICAgIHN1Y2Nlc3MgXy5wbHVjayhAcmVtb3ZlcywgXCJfaWRcIilcblxuICByZXNvbHZlVXBzZXJ0OiAoZG9jLCBzdWNjZXNzKSAtPlxuICAgIGlmIEB1cHNlcnRzW2RvYy5faWRdIGFuZCBfLmlzRXF1YWwoZG9jLCBAdXBzZXJ0c1tkb2MuX2lkXSlcbiAgICAgIEBfZGVsZXRlVXBzZXJ0KGRvYy5faWQpXG4gICAgaWYgc3VjY2Vzcz8gdGhlbiBzdWNjZXNzKClcblxuICByZXNvbHZlUmVtb3ZlOiAoaWQsIHN1Y2Nlc3MpIC0+XG4gICAgQF9kZWxldGVSZW1vdmUoaWQpXG4gICAgaWYgc3VjY2Vzcz8gdGhlbiBzdWNjZXNzKClcblxuICAjIEFkZCBidXQgZG8gbm90IG92ZXJ3cml0ZSBvciByZWNvcmQgYXMgdXBzZXJ0XG4gIHNlZWQ6IChkb2MsIHN1Y2Nlc3MpIC0+XG4gICAgaWYgbm90IF8uaGFzKEBpdGVtcywgZG9jLl9pZCkgYW5kIG5vdCBfLmhhcyhAcmVtb3ZlcywgZG9jLl9pZClcbiAgICAgIEBfcHV0SXRlbShkb2MpXG4gICAgaWYgc3VjY2Vzcz8gdGhlbiBzdWNjZXNzKClcblxuXG5jcmVhdGVVaWQgPSAtPiBcbiAgJ3h4eHh4eHh4eHh4eDR4eHh5eHh4eHh4eHh4eHh4eHh4Jy5yZXBsYWNlKC9beHldL2csIChjKSAtPlxuICAgIHIgPSBNYXRoLnJhbmRvbSgpKjE2fDBcbiAgICB2ID0gaWYgYyA9PSAneCcgdGhlbiByIGVsc2UgKHImMHgzfDB4OClcbiAgICByZXR1cm4gdi50b1N0cmluZygxNilcbiAgIClcblxucHJvY2Vzc05lYXJPcGVyYXRvciA9IChzZWxlY3RvciwgbGlzdCkgLT5cbiAgZm9yIGtleSwgdmFsdWUgb2Ygc2VsZWN0b3JcbiAgICBpZiB2YWx1ZT8gYW5kIHZhbHVlWyckbmVhciddXG4gICAgICBnZW8gPSB2YWx1ZVsnJG5lYXInXVsnJGdlb21ldHJ5J11cbiAgICAgIGlmIGdlby50eXBlICE9ICdQb2ludCdcbiAgICAgICAgYnJlYWtcblxuICAgICAgbmVhciA9IG5ldyBMLkxhdExuZyhnZW8uY29vcmRpbmF0ZXNbMV0sIGdlby5jb29yZGluYXRlc1swXSlcblxuICAgICAgbGlzdCA9IF8uZmlsdGVyIGxpc3QsIChkb2MpIC0+XG4gICAgICAgIHJldHVybiBkb2Nba2V5XSBhbmQgZG9jW2tleV0udHlwZSA9PSAnUG9pbnQnXG5cbiAgICAgICMgR2V0IGRpc3RhbmNlc1xuICAgICAgZGlzdGFuY2VzID0gXy5tYXAgbGlzdCwgKGRvYykgLT5cbiAgICAgICAgcmV0dXJuIHsgZG9jOiBkb2MsIGRpc3RhbmNlOiBcbiAgICAgICAgICBuZWFyLmRpc3RhbmNlVG8obmV3IEwuTGF0TG5nKGRvY1trZXldLmNvb3JkaW5hdGVzWzFdLCBkb2Nba2V5XS5jb29yZGluYXRlc1swXSkpXG4gICAgICAgIH1cblxuICAgICAgIyBGaWx0ZXIgbm9uLXBvaW50c1xuICAgICAgZGlzdGFuY2VzID0gXy5maWx0ZXIgZGlzdGFuY2VzLCAoaXRlbSkgLT4gaXRlbS5kaXN0YW5jZSA+PSAwXG5cbiAgICAgICMgU29ydCBieSBkaXN0YW5jZVxuICAgICAgZGlzdGFuY2VzID0gXy5zb3J0QnkgZGlzdGFuY2VzLCAnZGlzdGFuY2UnXG5cbiAgICAgICMgRmlsdGVyIGJ5IG1heERpc3RhbmNlXG4gICAgICBpZiB2YWx1ZVsnJG5lYXInXVsnJG1heERpc3RhbmNlJ11cbiAgICAgICAgZGlzdGFuY2VzID0gXy5maWx0ZXIgZGlzdGFuY2VzLCAoaXRlbSkgLT4gaXRlbS5kaXN0YW5jZSA8PSB2YWx1ZVsnJG5lYXInXVsnJG1heERpc3RhbmNlJ11cblxuICAgICAgIyBMaW1pdCB0byAxMDBcbiAgICAgIGRpc3RhbmNlcyA9IF8uZmlyc3QgZGlzdGFuY2VzLCAxMDBcblxuICAgICAgIyBFeHRyYWN0IGRvY3NcbiAgICAgIGxpc3QgPSBfLnBsdWNrIGRpc3RhbmNlcywgJ2RvYydcbiAgcmV0dXJuIGxpc3RcblxucHJvY2Vzc0dlb0ludGVyc2VjdHNPcGVyYXRvciA9IChzZWxlY3RvciwgbGlzdCkgLT5cbiAgZm9yIGtleSwgdmFsdWUgb2Ygc2VsZWN0b3JcbiAgICBpZiB2YWx1ZT8gYW5kIHZhbHVlWyckZ2VvSW50ZXJzZWN0cyddXG4gICAgICBnZW8gPSB2YWx1ZVsnJGdlb0ludGVyc2VjdHMnXVsnJGdlb21ldHJ5J11cbiAgICAgIGlmIGdlby50eXBlICE9ICdQb2x5Z29uJ1xuICAgICAgICBicmVha1xuXG4gICAgICAjIENoZWNrIHdpdGhpbiBmb3IgZWFjaFxuICAgICAgbGlzdCA9IF8uZmlsdGVyIGxpc3QsIChkb2MpIC0+XG4gICAgICAgICMgUmVqZWN0IG5vbi1wb2ludHNcbiAgICAgICAgaWYgbm90IGRvY1trZXldIG9yIGRvY1trZXldLnR5cGUgIT0gJ1BvaW50J1xuICAgICAgICAgIHJldHVybiBmYWxzZVxuXG4gICAgICAgICMgQ2hlY2sgcG9seWdvblxuICAgICAgICByZXR1cm4gR2VvSlNPTi5wb2ludEluUG9seWdvbihkb2Nba2V5XSwgZ2VvKVxuXG4gIHJldHVybiBsaXN0XG5cbm1vZHVsZS5leHBvcnRzID0gTG9jYWxEYlxuIiwiZXhwb3J0cy5TZWN0aW9ucyA9IEJhY2tib25lLlZpZXcuZXh0ZW5kKHtcbiAgICBjbGFzc05hbWUgOiBcInN1cnZleVwiLFxuXG4gICAgaW5pdGlhbGl6ZSA6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnRpdGxlID0gdGhpcy5vcHRpb25zLnRpdGxlO1xuICAgICAgICB0aGlzLnNlY3Rpb25zID0gdGhpcy5vcHRpb25zLnNlY3Rpb25zO1xuICAgICAgICB0aGlzLnJlbmRlcigpO1xuXG4gICAgICAgIC8vIEFkanVzdCBuZXh0L3ByZXYgYmFzZWQgb24gbW9kZWxcbiAgICAgICAgdGhpcy5tb2RlbC5vbihcImNoYW5nZVwiLCB0aGlzLnJlbmRlck5leHRQcmV2LCB0aGlzKTtcblxuICAgICAgICAvLyBHbyB0byBhcHByb3ByaWF0ZSBzZWN0aW9uIFRPRE9cbiAgICAgICAgdGhpcy5zaG93U2VjdGlvbigwKTtcbiAgICB9LFxuXG4gICAgZXZlbnRzIDoge1xuICAgICAgICBcImNsaWNrIC5uZXh0XCIgOiBcIm5leHRTZWN0aW9uXCIsXG4gICAgICAgIFwiY2xpY2sgLnByZXZcIiA6IFwicHJldlNlY3Rpb25cIixcbiAgICAgICAgXCJjbGljayAuZmluaXNoXCIgOiBcImZpbmlzaFwiLFxuICAgICAgICBcImNsaWNrIGEuc2VjdGlvbi1jcnVtYlwiIDogXCJjcnVtYlNlY3Rpb25cIlxuICAgIH0sXG5cbiAgICBmaW5pc2ggOiBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gVmFsaWRhdGUgY3VycmVudCBzZWN0aW9uXG4gICAgICAgIHZhciBzZWN0aW9uID0gdGhpcy5zZWN0aW9uc1t0aGlzLnNlY3Rpb25dO1xuICAgICAgICBpZiAoc2VjdGlvbi52YWxpZGF0ZSgpKSB7XG4gICAgICAgICAgICB0aGlzLnRyaWdnZXIoJ2NvbXBsZXRlJyk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgY3J1bWJTZWN0aW9uIDogZnVuY3Rpb24oZSkge1xuICAgICAgICAvLyBHbyB0byBzZWN0aW9uXG4gICAgICAgIHZhciBpbmRleCA9IHBhcnNlSW50KGUudGFyZ2V0LmdldEF0dHJpYnV0ZShcImRhdGEtdmFsdWVcIikpO1xuICAgICAgICB0aGlzLnNob3dTZWN0aW9uKGluZGV4KTtcbiAgICB9LFxuXG4gICAgZ2V0TmV4dFNlY3Rpb25JbmRleCA6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgaSA9IHRoaXMuc2VjdGlvbiArIDE7XG4gICAgICAgIHdoaWxlIChpIDwgdGhpcy5zZWN0aW9ucy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnNlY3Rpb25zW2ldLnNob3VsZEJlVmlzaWJsZSgpKVxuICAgICAgICAgICAgICAgIHJldHVybiBpO1xuICAgICAgICAgICAgaSsrO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGdldFByZXZTZWN0aW9uSW5kZXggOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGkgPSB0aGlzLnNlY3Rpb24gLSAxO1xuICAgICAgICB3aGlsZSAoaSA+PSAwKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5zZWN0aW9uc1tpXS5zaG91bGRCZVZpc2libGUoKSlcbiAgICAgICAgICAgICAgICByZXR1cm4gaTtcbiAgICAgICAgICAgIGktLTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBuZXh0U2VjdGlvbiA6IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBWYWxpZGF0ZSBjdXJyZW50IHNlY3Rpb25cbiAgICAgICAgdmFyIHNlY3Rpb24gPSB0aGlzLnNlY3Rpb25zW3RoaXMuc2VjdGlvbl07XG4gICAgICAgIGlmIChzZWN0aW9uLnZhbGlkYXRlKCkpIHtcbiAgICAgICAgICAgIHRoaXMuc2hvd1NlY3Rpb24odGhpcy5nZXROZXh0U2VjdGlvbkluZGV4KCkpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIHByZXZTZWN0aW9uIDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuc2hvd1NlY3Rpb24odGhpcy5nZXRQcmV2U2VjdGlvbkluZGV4KCkpO1xuICAgIH0sXG5cbiAgICBzaG93U2VjdGlvbiA6IGZ1bmN0aW9uKGluZGV4KSB7XG4gICAgICAgIHRoaXMuc2VjdGlvbiA9IGluZGV4O1xuXG4gICAgICAgIF8uZWFjaCh0aGlzLnNlY3Rpb25zLCBmdW5jdGlvbihzKSB7XG4gICAgICAgICAgICBzLiRlbC5oaWRlKCk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLnNlY3Rpb25zW2luZGV4XS4kZWwuc2hvdygpO1xuXG4gICAgICAgIC8vIFNldHVwIGJyZWFkY3J1bWJzXG4gICAgICAgIHZhciB2aXNpYmxlU2VjdGlvbnMgPSBfLmZpbHRlcihfLmZpcnN0KHRoaXMuc2VjdGlvbnMsIGluZGV4ICsgMSksIGZ1bmN0aW9uKHMpIHtcbiAgICAgICAgICAgIHJldHVybiBzLnNob3VsZEJlVmlzaWJsZSgpXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLiQoXCIuYnJlYWRjcnVtYlwiKS5odG1sKHRlbXBsYXRlc1snZm9ybXMvU2VjdGlvbnNfYnJlYWRjcnVtYnMnXSh7XG4gICAgICAgICAgICBzZWN0aW9ucyA6IF8uaW5pdGlhbCh2aXNpYmxlU2VjdGlvbnMpLFxuICAgICAgICAgICAgbGFzdFNlY3Rpb246IF8ubGFzdCh2aXNpYmxlU2VjdGlvbnMpXG4gICAgICAgIH0pKTtcbiAgICAgICAgXG4gICAgICAgIHRoaXMucmVuZGVyTmV4dFByZXYoKTtcblxuICAgICAgICAvLyBTY3JvbGwgaW50byB2aWV3XG4gICAgICAgIHRoaXMuJGVsLnNjcm9sbGludG92aWV3KCk7XG4gICAgfSxcbiAgICBcbiAgICByZW5kZXJOZXh0UHJldiA6IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBTZXR1cCBuZXh0L3ByZXYgYnV0dG9uc1xuICAgICAgICB0aGlzLiQoXCIucHJldlwiKS50b2dnbGUodGhpcy5nZXRQcmV2U2VjdGlvbkluZGV4KCkgIT09IHVuZGVmaW5lZCk7XG4gICAgICAgIHRoaXMuJChcIi5uZXh0XCIpLnRvZ2dsZSh0aGlzLmdldE5leHRTZWN0aW9uSW5kZXgoKSAhPT0gdW5kZWZpbmVkKTtcbiAgICAgICAgdGhpcy4kKFwiLmZpbmlzaFwiKS50b2dnbGUodGhpcy5nZXROZXh0U2VjdGlvbkluZGV4KCkgPT09IHVuZGVmaW5lZCk7XG4gICAgfSxcblxuICAgIHJlbmRlciA6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLiRlbC5odG1sKHRlbXBsYXRlc1snZm9ybXMvU2VjdGlvbnMnXSgpKTtcblxuICAgICAgICAvLyBBZGQgc2VjdGlvbnNcbiAgICAgICAgdmFyIHNlY3Rpb25zRWwgPSB0aGlzLiQoXCIuc2VjdGlvbnNcIik7XG4gICAgICAgIF8uZWFjaCh0aGlzLnNlY3Rpb25zLCBmdW5jdGlvbihzKSB7XG4gICAgICAgICAgICBzZWN0aW9uc0VsLmFwcGVuZChzLiRlbCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxufSk7XG5cbmV4cG9ydHMuU2VjdGlvbiA9IEJhY2tib25lLlZpZXcuZXh0ZW5kKHtcbiAgICBjbGFzc05hbWUgOiBcInNlY3Rpb25cIixcbiAgICB0ZW1wbGF0ZSA6IF8udGVtcGxhdGUoJzxkaXYgY2xhc3M9XCJjb250ZW50c1wiPjwvZGl2PicpLFxuXG4gICAgaW5pdGlhbGl6ZSA6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnRpdGxlID0gdGhpcy5vcHRpb25zLnRpdGxlO1xuICAgICAgICB0aGlzLmNvbnRlbnRzID0gdGhpcy5vcHRpb25zLmNvbnRlbnRzO1xuXG4gICAgICAgIC8vIEFsd2F5cyBpbnZpc2libGUgaW5pdGlhbGx5XG4gICAgICAgIHRoaXMuJGVsLmhpZGUoKTtcbiAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICB9LFxuXG4gICAgc2hvdWxkQmVWaXNpYmxlIDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICghdGhpcy5vcHRpb25zLmNvbmRpdGlvbmFsKVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIHJldHVybiB0aGlzLm9wdGlvbnMuY29uZGl0aW9uYWwodGhpcy5tb2RlbCk7XG4gICAgfSxcblxuICAgIHZhbGlkYXRlIDogZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIEdldCBhbGwgdmlzaWJsZSBpdGVtc1xuICAgICAgICB2YXIgaXRlbXMgPSBfLmZpbHRlcih0aGlzLmNvbnRlbnRzLCBmdW5jdGlvbihjKSB7XG4gICAgICAgICAgICByZXR1cm4gYy52aXNpYmxlICYmIGMudmFsaWRhdGU7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gIV8uYW55KF8ubWFwKGl0ZW1zLCBmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgICAgICByZXR1cm4gaXRlbS52YWxpZGF0ZSgpO1xuICAgICAgICB9KSk7XG4gICAgfSxcblxuICAgIHJlbmRlciA6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLiRlbC5odG1sKHRoaXMudGVtcGxhdGUodGhpcykpO1xuXG4gICAgICAgIC8vIEFkZCBjb250ZW50cyAocXVlc3Rpb25zLCBtb3N0bHkpXG4gICAgICAgIHZhciBjb250ZW50c0VsID0gdGhpcy4kKFwiLmNvbnRlbnRzXCIpO1xuICAgICAgICBfLmVhY2godGhpcy5jb250ZW50cywgZnVuY3Rpb24oYykge1xuICAgICAgICAgICAgY29udGVudHNFbC5hcHBlbmQoYy4kZWwpO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbn0pO1xuXG5leHBvcnRzLlF1ZXN0aW9uID0gQmFja2JvbmUuVmlldy5leHRlbmQoe1xuICAgIGNsYXNzTmFtZSA6IFwicXVlc3Rpb25cIixcblxuICAgIHRlbXBsYXRlIDogXy50ZW1wbGF0ZSgnPGRpdiBjbGFzcz1cInByb21wdFwiPjwlPW9wdGlvbnMucHJvbXB0JT48JT1yZW5kZXJSZXF1aXJlZCgpJT48L2Rpdj48ZGl2IGNsYXNzPVwiYW5zd2VyXCI+PC9kaXY+JyksXG5cbiAgICByZW5kZXJSZXF1aXJlZCA6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5yZXF1aXJlZClcbiAgICAgICAgICAgIHJldHVybiAnJm5ic3A7PHNwYW4gY2xhc3M9XCJyZXF1aXJlZFwiPio8L3NwYW4+JztcbiAgICAgICAgcmV0dXJuICcnO1xuICAgIH0sXG5cbiAgICB2YWxpZGF0ZSA6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgdmFsO1xuXG4gICAgICAgIC8vIENoZWNrIHJlcXVpcmVkXG4gICAgICAgIGlmICh0aGlzLnJlcXVpcmVkKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5tb2RlbC5nZXQodGhpcy5pZCkgPT09IHVuZGVmaW5lZCB8fCB0aGlzLm1vZGVsLmdldCh0aGlzLmlkKSA9PT0gbnVsbCB8fCB0aGlzLm1vZGVsLmdldCh0aGlzLmlkKSA9PT0gXCJcIilcbiAgICAgICAgICAgICAgICB2YWwgPSBcIlJlcXVpcmVkXCI7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDaGVjayBjdXN0b20gdmFsaWRhdGlvblxuICAgICAgICBpZiAoIXZhbCAmJiB0aGlzLm9wdGlvbnMudmFsaWRhdGUpIHtcbiAgICAgICAgICAgIHZhbCA9IHRoaXMub3B0aW9ucy52YWxpZGF0ZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gU2hvdyB2YWxpZGF0aW9uIHJlc3VsdHMgVE9ET1xuICAgICAgICBpZiAodmFsKSB7XG4gICAgICAgICAgICB0aGlzLiRlbC5hZGRDbGFzcyhcImludmFsaWRcIik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLiRlbC5yZW1vdmVDbGFzcyhcImludmFsaWRcIik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdmFsO1xuICAgIH0sXG5cbiAgICB1cGRhdGVWaXNpYmlsaXR5IDogZnVuY3Rpb24oZSkge1xuICAgICAgICAvLyBzbGlkZVVwL3NsaWRlRG93blxuICAgICAgICBpZiAodGhpcy5zaG91bGRCZVZpc2libGUoKSAmJiAhdGhpcy52aXNpYmxlKVxuICAgICAgICAgICAgdGhpcy4kZWwuc2xpZGVEb3duKCk7XG4gICAgICAgIGlmICghdGhpcy5zaG91bGRCZVZpc2libGUoKSAmJiB0aGlzLnZpc2libGUpXG4gICAgICAgICAgICB0aGlzLiRlbC5zbGlkZVVwKCk7XG4gICAgICAgIHRoaXMudmlzaWJsZSA9IHRoaXMuc2hvdWxkQmVWaXNpYmxlKCk7XG4gICAgfSxcblxuICAgIHNob3VsZEJlVmlzaWJsZSA6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoIXRoaXMub3B0aW9ucy5jb25kaXRpb25hbClcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25zLmNvbmRpdGlvbmFsKHRoaXMubW9kZWwpO1xuICAgIH0sXG5cbiAgICBpbml0aWFsaXplIDogZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIEFkanVzdCB2aXNpYmlsaXR5IGJhc2VkIG9uIG1vZGVsXG4gICAgICAgIHRoaXMubW9kZWwub24oXCJjaGFuZ2VcIiwgdGhpcy51cGRhdGVWaXNpYmlsaXR5LCB0aGlzKTtcblxuICAgICAgICAvLyBSZS1yZW5kZXIgYmFzZWQgb24gbW9kZWwgY2hhbmdlc1xuICAgICAgICB0aGlzLm1vZGVsLm9uKFwiY2hhbmdlOlwiICsgdGhpcy5pZCwgdGhpcy5yZW5kZXIsIHRoaXMpO1xuXG4gICAgICAgIHRoaXMucmVxdWlyZWQgPSB0aGlzLm9wdGlvbnMucmVxdWlyZWQ7XG5cbiAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICB9LFxuXG4gICAgcmVuZGVyIDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuJGVsLmh0bWwodGhpcy50ZW1wbGF0ZSh0aGlzKSk7XG5cbiAgICAgICAgLy8gUmVuZGVyIGFuc3dlclxuICAgICAgICB0aGlzLnJlbmRlckFuc3dlcih0aGlzLiQoXCIuYW5zd2VyXCIpKTtcblxuICAgICAgICB0aGlzLiRlbC50b2dnbGUodGhpcy5zaG91bGRCZVZpc2libGUoKSk7XG4gICAgICAgIHRoaXMudmlzaWJsZSA9IHRoaXMuc2hvdWxkQmVWaXNpYmxlKCk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxufSk7XG5cbmV4cG9ydHMuUmFkaW9RdWVzdGlvbiA9IGV4cG9ydHMuUXVlc3Rpb24uZXh0ZW5kKHtcbiAgICBldmVudHMgOiB7XG4gICAgICAgIFwiY2hlY2tlZFwiIDogXCJjaGVja2VkXCIsXG4gICAgfSxcblxuICAgIGNoZWNrZWQgOiBmdW5jdGlvbihlKSB7XG4gICAgICAgIHZhciBpbmRleCA9IHBhcnNlSW50KGUudGFyZ2V0LmdldEF0dHJpYnV0ZShcImRhdGEtdmFsdWVcIikpO1xuICAgICAgICB2YXIgdmFsdWUgPSB0aGlzLm9wdGlvbnMub3B0aW9uc1tpbmRleF1bMF07XG4gICAgICAgIHRoaXMubW9kZWwuc2V0KHRoaXMuaWQsIHZhbHVlKTtcbiAgICB9LFxuXG4gICAgcmVuZGVyQW5zd2VyIDogZnVuY3Rpb24oYW5zd2VyRWwpIHtcbiAgICAgICAgYW5zd2VyRWwuaHRtbChfLnRlbXBsYXRlKCc8ZGl2IGNsYXNzPVwicmFkaW8tZ3JvdXBcIj48JT1yZW5kZXJSYWRpb09wdGlvbnMoKSU+PC9kaXY+JywgdGhpcykpO1xuICAgIH0sXG5cbiAgICByZW5kZXJSYWRpb09wdGlvbnMgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaHRtbCA9IFwiXCI7XG4gICAgICAgIHZhciBpO1xuICAgICAgICBmb3IgKCBpID0gMDsgaSA8IHRoaXMub3B0aW9ucy5vcHRpb25zLmxlbmd0aDsgaSsrKVxuICAgICAgICAgICAgaHRtbCArPSBfLnRlbXBsYXRlKCc8ZGl2IGNsYXNzPVwicmFkaW8tYnV0dG9uIDwlPWNoZWNrZWQlPlwiIGRhdGEtdmFsdWU9XCI8JT1wb3NpdGlvbiU+XCI+PCU9dGV4dCU+PC9kaXY+Jywge1xuICAgICAgICAgICAgICAgIHBvc2l0aW9uIDogaSxcbiAgICAgICAgICAgICAgICB0ZXh0IDogdGhpcy5vcHRpb25zLm9wdGlvbnNbaV1bMV0sXG4gICAgICAgICAgICAgICAgY2hlY2tlZCA6IHRoaXMubW9kZWwuZ2V0KHRoaXMuaWQpID09PSB0aGlzLm9wdGlvbnMub3B0aW9uc1tpXVswXSA/IFwiY2hlY2tlZFwiIDogXCJcIlxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIGh0bWw7XG4gICAgfVxuXG59KTtcblxuZXhwb3J0cy5DaGVja1F1ZXN0aW9uID0gZXhwb3J0cy5RdWVzdGlvbi5leHRlbmQoe1xuICAgIGV2ZW50cyA6IHtcbiAgICAgICAgXCJjaGVja2VkXCIgOiBcImNoZWNrZWRcIixcbiAgICB9LFxuXG4gICAgY2hlY2tlZCA6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgLy8gR2V0IGNoZWNrZWRcbiAgICAgICAgdGhpcy5tb2RlbC5zZXQodGhpcy5pZCwgdGhpcy4kKFwiLmNoZWNrYm94XCIpLmhhc0NsYXNzKFwiY2hlY2tlZFwiKSk7XG4gICAgfSxcblxuICAgIHJlbmRlckFuc3dlciA6IGZ1bmN0aW9uKGFuc3dlckVsKSB7XG4gICAgICAgIHZhciBpO1xuICAgICAgICBhbnN3ZXJFbC5hcHBlbmQoJChfLnRlbXBsYXRlKCc8ZGl2IGNsYXNzPVwiY2hlY2tib3ggPCU9Y2hlY2tlZCU+XCI+PCU9dGV4dCU+PC9kaXY+Jywge1xuICAgICAgICAgICAgdGV4dCA6IHRoaXMub3B0aW9ucy50ZXh0LFxuICAgICAgICAgICAgY2hlY2tlZCA6ICh0aGlzLm1vZGVsLmdldCh0aGlzLmlkKSkgPyBcImNoZWNrZWRcIiA6IFwiXCJcbiAgICAgICAgfSkpKTtcbiAgICB9XG5cbn0pO1xuXG5cbmV4cG9ydHMuTXVsdGljaGVja1F1ZXN0aW9uID0gZXhwb3J0cy5RdWVzdGlvbi5leHRlbmQoe1xuICAgIGV2ZW50cyA6IHtcbiAgICAgICAgXCJjaGVja2VkXCIgOiBcImNoZWNrZWRcIixcbiAgICB9LFxuXG4gICAgY2hlY2tlZCA6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgLy8gR2V0IGFsbCBjaGVja2VkXG4gICAgICAgIHZhciB2YWx1ZSA9IFtdO1xuICAgICAgICB2YXIgb3B0cyA9IHRoaXMub3B0aW9ucy5vcHRpb25zO1xuICAgICAgICB0aGlzLiQoXCIuY2hlY2tib3hcIikuZWFjaChmdW5jdGlvbihpbmRleCkge1xuICAgICAgICAgICAgaWYgKCQodGhpcykuaGFzQ2xhc3MoXCJjaGVja2VkXCIpKVxuICAgICAgICAgICAgICAgIHZhbHVlLnB1c2gob3B0c1tpbmRleF1bMF0pO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5tb2RlbC5zZXQodGhpcy5pZCwgdmFsdWUpO1xuICAgIH0sXG5cbiAgICByZW5kZXJBbnN3ZXIgOiBmdW5jdGlvbihhbnN3ZXJFbCkge1xuICAgICAgICB2YXIgaTtcbiAgICAgICAgZm9yICggaSA9IDA7IGkgPCB0aGlzLm9wdGlvbnMub3B0aW9ucy5sZW5ndGg7IGkrKylcbiAgICAgICAgICAgIGFuc3dlckVsLmFwcGVuZCgkKF8udGVtcGxhdGUoJzxkaXYgY2xhc3M9XCJjaGVja2JveCA8JT1jaGVja2VkJT5cIiBkYXRhLXZhbHVlPVwiPCU9cG9zaXRpb24lPlwiPjwlPXRleHQlPjwvZGl2PicsIHtcbiAgICAgICAgICAgICAgICBwb3NpdGlvbiA6IGksXG4gICAgICAgICAgICAgICAgdGV4dCA6IHRoaXMub3B0aW9ucy5vcHRpb25zW2ldWzFdLFxuICAgICAgICAgICAgICAgIGNoZWNrZWQgOiAodGhpcy5tb2RlbC5nZXQodGhpcy5pZCkgJiYgXy5jb250YWlucyh0aGlzLm1vZGVsLmdldCh0aGlzLmlkKSwgdGhpcy5vcHRpb25zLm9wdGlvbnNbaV1bMF0pKSA/IFwiY2hlY2tlZFwiIDogXCJcIlxuICAgICAgICAgICAgfSkpKTtcbiAgICB9XG5cbn0pO1xuXG5leHBvcnRzLlRleHRRdWVzdGlvbiA9IGV4cG9ydHMuUXVlc3Rpb24uZXh0ZW5kKHtcbiAgICByZW5kZXJBbnN3ZXIgOiBmdW5jdGlvbihhbnN3ZXJFbCkge1xuICAgICAgICBpZiAodGhpcy5vcHRpb25zLm11bHRpbGluZSkge1xuICAgICAgICAgICAgYW5zd2VyRWwuaHRtbChfLnRlbXBsYXRlKCc8dGV4dGFyZWEvPicsIHRoaXMpKTtcbiAgICAgICAgICAgIGFuc3dlckVsLmZpbmQoXCJ0ZXh0YXJlYVwiKS52YWwodGhpcy5tb2RlbC5nZXQodGhpcy5pZCkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYW5zd2VyRWwuaHRtbChfLnRlbXBsYXRlKCc8aW5wdXQgdHlwZT1cInRleHRcIi8+JywgdGhpcykpO1xuICAgICAgICAgICAgYW5zd2VyRWwuZmluZChcImlucHV0XCIpLnZhbCh0aGlzLm1vZGVsLmdldCh0aGlzLmlkKSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgZXZlbnRzIDoge1xuICAgICAgICBcImNoYW5nZVwiIDogXCJjaGFuZ2VkXCJcbiAgICB9LFxuICAgIGNoYW5nZWQgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5tb2RlbC5zZXQodGhpcy5pZCwgdGhpcy4kKHRoaXMub3B0aW9ucy5tdWx0aWxpbmUgPyBcInRleHRhcmVhXCIgOiBcImlucHV0XCIpLnZhbCgpKTtcbiAgICB9XG5cbn0pO1xuXG5leHBvcnRzLk51bWJlclF1ZXN0aW9uID0gZXhwb3J0cy5RdWVzdGlvbi5leHRlbmQoe1xuICAgIHJlbmRlckFuc3dlciA6IGZ1bmN0aW9uKGFuc3dlckVsKSB7XG4gICAgICAgIGFuc3dlckVsLmh0bWwoXy50ZW1wbGF0ZSgnPGlucHV0IHR5cGU9XCJudW1iZXJcIi8+JywgdGhpcykpO1xuICAgICAgICBhbnN3ZXJFbC5maW5kKFwiaW5wdXRcIikudmFsKHRoaXMubW9kZWwuZ2V0KHRoaXMuaWQpKTtcbiAgICB9LFxuXG4gICAgZXZlbnRzIDoge1xuICAgICAgICBcImNoYW5nZVwiIDogXCJjaGFuZ2VkXCJcbiAgICB9LFxuICAgIGNoYW5nZWQgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5tb2RlbC5zZXQodGhpcy5pZCwgcGFyc2VGbG9hdCh0aGlzLiQoXCJpbnB1dFwiKS52YWwoKSkpO1xuICAgIH1cblxufSk7XG5cbmV4cG9ydHMuUGhvdG9RdWVzdGlvbiA9IGV4cG9ydHMuUXVlc3Rpb24uZXh0ZW5kKHtcbiAgICByZW5kZXJBbnN3ZXIgOiBmdW5jdGlvbihhbnN3ZXJFbCkge1xuICAgICAgICBhbnN3ZXJFbC5odG1sKF8udGVtcGxhdGUoJzxpbWcgc3R5bGU9XCJtYXgtd2lkdGg6IDEwMHB4O1wiIHNyYz1cImltYWdlcy9jYW1lcmEtaWNvbi5qcGdcIi8+JywgdGhpcykpO1xuICAgIH0sXG5cbiAgICBldmVudHMgOiB7XG4gICAgICAgIFwiY2xpY2sgaW1nXCIgOiBcInRha2VQaWN0dXJlXCJcbiAgICB9LFxuXG4gICAgdGFrZVBpY3R1cmUgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgYWxlcnQoXCJJbiBhbiBhcHAsIHRoaXMgd291bGQgbGF1bmNoIHRoZSBjYW1lcmEgYWN0aXZpdHkgYXMgaW4gbVdhdGVyIG5hdGl2ZSBhcHBzLlwiKTtcbiAgICB9XG5cbn0pO1xuIiwiIyBHcm91cCBvZiBxdWVzdGlvbnMgd2hpY2ggdmFsaWRhdGUgYXMgYSB1bml0XG5cbm1vZHVsZS5leHBvcnRzID0gQmFja2JvbmUuVmlldy5leHRlbmRcbiAgaW5pdGlhbGl6ZTogLT5cbiAgICBAY29udGVudHMgPSBAb3B0aW9ucy5jb250ZW50c1xuICAgIEByZW5kZXIoKVxuXG4gIHZhbGlkYXRlOiAtPlxuICAgICMgR2V0IGFsbCB2aXNpYmxlIGl0ZW1zXG4gICAgaXRlbXMgPSBfLmZpbHRlcihAY29udGVudHMsIChjKSAtPlxuICAgICAgYy52aXNpYmxlIGFuZCBjLnZhbGlkYXRlXG4gICAgKVxuICAgIHJldHVybiBub3QgXy5hbnkoXy5tYXAoaXRlbXMsIChpdGVtKSAtPlxuICAgICAgaXRlbS52YWxpZGF0ZSgpXG4gICAgKSlcblxuICByZW5kZXI6IC0+XG4gICAgQCRlbC5odG1sIFwiXCJcbiAgICBcbiAgICAjIEFkZCBjb250ZW50cyAocXVlc3Rpb25zLCBtb3N0bHkpXG4gICAgXy5lYWNoIEBjb250ZW50cywgKGMpID0+IEAkZWwuYXBwZW5kIGMuJGVsXG5cbiAgICB0aGlzXG4iLCIjIEZvcm0gdGhhdCBoYXMgc2F2ZSBhbmQgY2FuY2VsIGJ1dHRvbnMgdGhhdCBmaXJlIHNhdmUgYW5kIGNhbmNlbCBldmVudHMuXG4jIFNhdmUgZXZlbnQgd2lsbCBvbmx5IGJlIGZpcmVkIGlmIHZhbGlkYXRlc1xuXG5tb2R1bGUuZXhwb3J0cyA9IEJhY2tib25lLlZpZXcuZXh0ZW5kXG4gIGluaXRpYWxpemU6IC0+XG4gICAgQGNvbnRlbnRzID0gQG9wdGlvbnMuY29udGVudHNcbiAgICBAcmVuZGVyKClcblxuICBldmVudHM6IFxuICAgICdjbGljayAjc2F2ZV9idXR0b24nOiAnc2F2ZSdcbiAgICAnY2xpY2sgI2NhbmNlbF9idXR0b24nOiAnY2FuY2VsJ1xuXG4gIHZhbGlkYXRlOiAtPlxuICAgICMgR2V0IGFsbCB2aXNpYmxlIGl0ZW1zXG4gICAgaXRlbXMgPSBfLmZpbHRlcihAY29udGVudHMsIChjKSAtPlxuICAgICAgYy52aXNpYmxlIGFuZCBjLnZhbGlkYXRlXG4gICAgKVxuICAgIHJldHVybiBub3QgXy5hbnkoXy5tYXAoaXRlbXMsIChpdGVtKSAtPlxuICAgICAgaXRlbS52YWxpZGF0ZSgpXG4gICAgKSlcblxuICByZW5kZXI6IC0+XG4gICAgQCRlbC5odG1sICcnJzxkaXYgaWQ9XCJjb250ZW50c1wiPjwvZGl2PlxuICAgIDxkaXY+XG4gICAgICAgIDxidXR0b24gaWQ9XCJzYXZlX2J1dHRvblwiIHR5cGU9XCJidXR0b25cIiBjbGFzcz1cImJ0biBidG4tcHJpbWFyeSBtYXJnaW5lZFwiPlNhdmU8L2J1dHRvbj5cbiAgICAgICAgJm5ic3A7XG4gICAgICAgIDxidXR0b24gaWQ9XCJjYW5jZWxfYnV0dG9uXCIgdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwiYnRuIG1hcmdpbmVkXCI+Q2FuY2VsPC9idXR0b24+XG4gICAgPC9kaXY+JycnXG4gICAgXG4gICAgIyBBZGQgY29udGVudHMgKHF1ZXN0aW9ucywgbW9zdGx5KVxuICAgIF8uZWFjaCBAY29udGVudHMsIChjKSA9PiBAJCgnI2NvbnRlbnRzJykuYXBwZW5kIGMuJGVsXG4gICAgdGhpc1xuXG4gIHNhdmU6IC0+XG4gICAgaWYgQHZhbGlkYXRlKClcbiAgICAgIEB0cmlnZ2VyICdzYXZlJ1xuXG4gIGNhbmNlbDogLT5cbiAgICBAdHJpZ2dlciAnY2FuY2VsJ1xuIiwiIyBUT0RPIEZpeCB0byBoYXZlIGVkaXRhYmxlIFlZWVktTU0tREQgd2l0aCBjbGljayB0byBwb3B1cCBzY3JvbGxlclxuXG5RdWVzdGlvbiA9IHJlcXVpcmUoJy4vZm9ybS1jb250cm9scycpLlF1ZXN0aW9uXG5cbm1vZHVsZS5leHBvcnRzID0gUXVlc3Rpb24uZXh0ZW5kKFxuICBldmVudHM6XG4gICAgY2hhbmdlOiBcImNoYW5nZWRcIlxuXG4gIGNoYW5nZWQ6IC0+XG4gICAgQG1vZGVsLnNldCBAaWQsIEAkZWwuZmluZChcImlucHV0W25hbWU9XFxcImRhdGVcXFwiXVwiKS52YWwoKVxuXG4gIHJlbmRlckFuc3dlcjogKGFuc3dlckVsKSAtPlxuICAgIGFuc3dlckVsLmh0bWwgXy50ZW1wbGF0ZShcIjxpbnB1dCBjbGFzcz1cXFwibmVlZHNjbGlja1xcXCIgbmFtZT1cXFwiZGF0ZVxcXCIgLz5cIiwgdGhpcylcbiAgICBhbnN3ZXJFbC5maW5kKFwiaW5wdXRcIikudmFsIEBtb2RlbC5nZXQoQGlkKVxuICAgIGFuc3dlckVsLmZpbmQoXCJpbnB1dFwiKS5zY3JvbGxlclxuICAgICAgcHJlc2V0OiBcImRhdGVcIlxuICAgICAgdGhlbWU6IFwiaW9zXCJcbiAgICAgIGRpc3BsYXk6IFwibW9kYWxcIlxuICAgICAgbW9kZTogXCJzY3JvbGxlclwiXG4gICAgICBkYXRlT3JkZXI6IFwieXltbUQgZGRcIlxuICAgICAgZGF0ZUZvcm1hdDogXCJ5eS1tbS1kZFwiXG5cbikiLCJcblF1ZXN0aW9uID0gcmVxdWlyZSgnLi9mb3JtLWNvbnRyb2xzJykuUXVlc3Rpb25cblxubW9kdWxlLmV4cG9ydHMgPSBRdWVzdGlvbi5leHRlbmRcbiAgcmVuZGVyQW5zd2VyOiAoYW5zd2VyRWwpIC0+XG4gICAgYW5zd2VyRWwuaHRtbCAnJydcbiAgICAgIDxkaXYgY2xhc3M9XCJpbnB1dC1hcHBlbmRcIj5cbiAgICAgICAgPGlucHV0IHR5cGU9XCJ0ZWxcIj5cbiAgICAgICAgPGJ1dHRvbiBjbGFzcz1cImJ0blwiIHR5cGU9XCJidXR0b25cIj5TZWxlY3QuLi48L2J1dHRvbj5cbiAgICAgIDwvZGl2PicnJ1xuICAgIGFuc3dlckVsLmZpbmQoXCJpbnB1dFwiKS52YWwgQG1vZGVsLmdldChAaWQpXG5cbiAgZXZlbnRzOlxuICAgIGNoYW5nZTogXCJjaGFuZ2VkXCJcblxuICBjaGFuZ2VkOiAtPlxuICAgIEBtb2RlbC5zZXQgQGlkLCBAJChcImlucHV0XCIpLnZhbCgpXG4iLCJRdWVzdGlvbiA9IHJlcXVpcmUoJy4vZm9ybS1jb250cm9scycpLlF1ZXN0aW9uXG5cbm1vZHVsZS5leHBvcnRzID0gUXVlc3Rpb24uZXh0ZW5kXG4gIGV2ZW50czpcbiAgICBcImNsaWNrICNjYW1lcmFcIjogXCJjYW1lcmFDbGlja1wiXG5cbiAgcmVuZGVyQW5zd2VyOiAoYW5zd2VyRWwpIC0+XG4gICAgYW5zd2VyRWwuaHRtbCAnJydcbiAgICAgIDxpbWcgc3JjPVwiaW1nL2NhbWVyYS1pY29uLmpwZ1wiIGlkPVwiY2FtZXJhXCIgY2xhc3M9XCJpbWctcm91bmRlZFwiIHN0eWxlPVwibWF4LWhlaWdodDogMTAwcHhcIi8+XG4gICAgJycnXG5cbiAgY2FtZXJhQ2xpY2s6IC0+XG4gICAgYWxlcnQoXCJPbiBBbmRyb2lkIEFwcCwgd291bGQgbGF1bmNoIENhbWVyYStQaG90byBWaWV3ZXJcIilcbiIsIlF1ZXN0aW9uID0gcmVxdWlyZSgnLi9mb3JtLWNvbnRyb2xzJykuUXVlc3Rpb25cblxubW9kdWxlLmV4cG9ydHMgPSBRdWVzdGlvbi5leHRlbmQoXG4gIGV2ZW50czpcbiAgICBjaGFuZ2U6IFwiY2hhbmdlZFwiXG5cbiAgc2V0T3B0aW9uczogKG9wdGlvbnMpIC0+XG4gICAgQG9wdGlvbnMub3B0aW9ucyA9IG9wdGlvbnNcbiAgICBAcmVuZGVyKClcblxuICBjaGFuZ2VkOiAoZSkgLT5cbiAgICB2YWwgPSAkKGUudGFyZ2V0KS52YWwoKVxuICAgIGlmIHZhbCBpcyBcIlwiXG4gICAgICBAbW9kZWwuc2V0IEBpZCwgbnVsbFxuICAgIGVsc2VcbiAgICAgIGluZGV4ID0gcGFyc2VJbnQodmFsKVxuICAgICAgdmFsdWUgPSBAb3B0aW9ucy5vcHRpb25zW2luZGV4XVswXVxuICAgICAgQG1vZGVsLnNldCBAaWQsIHZhbHVlXG5cbiAgcmVuZGVyQW5zd2VyOiAoYW5zd2VyRWwpIC0+XG4gICAgYW5zd2VyRWwuaHRtbCBfLnRlbXBsYXRlKFwiPHNlbGVjdCBpZD1cXFwic291cmNlX3R5cGVcXFwiPjwlPXJlbmRlckRyb3Bkb3duT3B0aW9ucygpJT48L3NlbGVjdD5cIiwgdGhpcylcbiAgICAjIENoZWNrIGlmIGFuc3dlciBwcmVzZW50IFxuICAgIGlmIG5vdCBfLmFueShAb3B0aW9ucy5vcHRpb25zLCAob3B0KSA9PiBvcHRbMF0gPT0gQG1vZGVsLmdldChAaWQpKSBhbmQgQG1vZGVsLmdldChAaWQpP1xuICAgICAgQCQoXCJzZWxlY3RcIikuYXR0cignZGlzYWJsZWQnLCAnZGlzYWJsZWQnKVxuXG4gIHJlbmRlckRyb3Bkb3duT3B0aW9uczogLT5cbiAgICBodG1sID0gXCJcIlxuICAgIFxuICAgICMgQWRkIGVtcHR5IG9wdGlvblxuICAgIGh0bWwgKz0gXCI8b3B0aW9uIHZhbHVlPVxcXCJcXFwiPjwvb3B0aW9uPlwiXG4gICAgZm9yIGkgaW4gWzAuLi5Ab3B0aW9ucy5vcHRpb25zLmxlbmd0aF1cbiAgICAgIGh0bWwgKz0gXy50ZW1wbGF0ZShcIjxvcHRpb24gdmFsdWU9XFxcIjwlPXBvc2l0aW9uJT5cXFwiIDwlPXNlbGVjdGVkJT4+PCUtdGV4dCU+PC9vcHRpb24+XCIsXG4gICAgICAgIHBvc2l0aW9uOiBpXG4gICAgICAgIHRleHQ6IEBvcHRpb25zLm9wdGlvbnNbaV1bMV1cbiAgICAgICAgc2VsZWN0ZWQ6IChpZiBAbW9kZWwuZ2V0KEBpZCkgaXMgQG9wdGlvbnMub3B0aW9uc1tpXVswXSB0aGVuIFwic2VsZWN0ZWQ9XFxcInNlbGVjdGVkXFxcIlwiIGVsc2UgXCJcIilcbiAgICAgIClcbiAgICByZXR1cm4gaHRtbFxuKSIsIiMgSW1wcm92ZWQgbG9jYXRpb24gZmluZGVyXG5jbGFzcyBMb2NhdGlvbkZpbmRlclxuICBjb25zdHJ1Y3RvcjogLT5cbiAgICBfLmV4dGVuZCBALCBCYWNrYm9uZS5FdmVudHNcbiAgICBcbiAgZ2V0TG9jYXRpb246IC0+XG4gICAgIyBCb3RoIGZhaWx1cmVzIGFyZSByZXF1aXJlZCB0byB0cmlnZ2VyIGVycm9yXG4gICAgbG9jYXRpb25FcnJvciA9IF8uYWZ0ZXIgMiwgPT5cbiAgICAgIEB0cmlnZ2VyICdlcnJvcidcblxuICAgIGhpZ2hBY2N1cmFjeUZpcmVkID0gZmFsc2VcblxuICAgIGxvd0FjY3VyYWN5ID0gKHBvcykgPT5cbiAgICAgIGlmIG5vdCBoaWdoQWNjdXJhY3lGaXJlZFxuICAgICAgICBAdHJpZ2dlciAnZm91bmQnLCBwb3NcblxuICAgIGhpZ2hBY2N1cmFjeSA9IChwb3MpID0+XG4gICAgICBoaWdoQWNjdXJhY3lGaXJlZCA9IHRydWVcbiAgICAgIEB0cmlnZ2VyICdmb3VuZCcsIHBvc1xuXG4gICAgIyBHZXQgYm90aCBoaWdoIGFuZCBsb3cgYWNjdXJhY3ksIGFzIGxvdyBpcyBzdWZmaWNpZW50IGZvciBpbml0aWFsIGRpc3BsYXlcbiAgICBuYXZpZ2F0b3IuZ2VvbG9jYXRpb24uZ2V0Q3VycmVudFBvc2l0aW9uKGxvd0FjY3VyYWN5LCBsb2NhdGlvbkVycm9yLCB7XG4gICAgICAgIG1heGltdW1BZ2UgOiAzNjAwKjI0LFxuICAgICAgICB0aW1lb3V0IDogMTAwMDAsXG4gICAgICAgIGVuYWJsZUhpZ2hBY2N1cmFjeSA6IGZhbHNlXG4gICAgfSlcblxuICAgIG5hdmlnYXRvci5nZW9sb2NhdGlvbi5nZXRDdXJyZW50UG9zaXRpb24oaGlnaEFjY3VyYWN5LCBsb2NhdGlvbkVycm9yLCB7XG4gICAgICAgIG1heGltdW1BZ2UgOiAzNjAwLFxuICAgICAgICB0aW1lb3V0IDogMzAwMDAsXG4gICAgICAgIGVuYWJsZUhpZ2hBY2N1cmFjeSA6IHRydWVcbiAgICB9KVxuXG4gIHN0YXJ0V2F0Y2g6IC0+XG4gICAgIyBBbGxvdyBvbmUgd2F0Y2ggYXQgbW9zdFxuICAgIGlmIEBsb2NhdGlvbldhdGNoSWQ/XG4gICAgICBAc3RvcFdhdGNoKClcblxuICAgIGhpZ2hBY2N1cmFjeUZpcmVkID0gZmFsc2VcbiAgICBsb3dBY2N1cmFjeUZpcmVkID0gZmFsc2VcblxuICAgIGxvd0FjY3VyYWN5ID0gKHBvcykgPT5cbiAgICAgIGlmIG5vdCBoaWdoQWNjdXJhY3lGaXJlZFxuICAgICAgICBsb3dBY2N1cmFjeUZpcmVkID0gdHJ1ZVxuICAgICAgICBAdHJpZ2dlciAnZm91bmQnLCBwb3NcblxuICAgIGhpZ2hBY2N1cmFjeSA9IChwb3MpID0+XG4gICAgICBoaWdoQWNjdXJhY3lGaXJlZCA9IHRydWVcbiAgICAgIEB0cmlnZ2VyICdmb3VuZCcsIHBvc1xuXG4gICAgZXJyb3IgPSAoZXJyb3IpID0+XG4gICAgICBjb25zb2xlLmxvZyBcIiMjIyBlcnJvciBcIlxuICAgICAgIyBObyBlcnJvciBpZiBmaXJlZCBvbmNlXG4gICAgICBpZiBub3QgbG93QWNjdXJhY3lGaXJlZCBhbmQgbm90IGhpZ2hBY2N1cmFjeUZpcmVkXG4gICAgICAgIEB0cmlnZ2VyICdlcnJvcicsIGVycm9yXG5cbiAgICAjIEZpcmUgaW5pdGlhbCBsb3ctYWNjdXJhY3kgb25lXG4gICAgbmF2aWdhdG9yLmdlb2xvY2F0aW9uLmdldEN1cnJlbnRQb3NpdGlvbihsb3dBY2N1cmFjeSwgZXJyb3IsIHtcbiAgICAgICAgbWF4aW11bUFnZSA6IDM2MDAqMjQsXG4gICAgICAgIHRpbWVvdXQgOiAxMDAwMCxcbiAgICAgICAgZW5hYmxlSGlnaEFjY3VyYWN5IDogZmFsc2VcbiAgICB9KVxuXG4gICAgQGxvY2F0aW9uV2F0Y2hJZCA9IG5hdmlnYXRvci5nZW9sb2NhdGlvbi53YXRjaFBvc2l0aW9uKGhpZ2hBY2N1cmFjeSwgZXJyb3IsIHtcbiAgICAgICAgbWF4aW11bUFnZSA6IDMwMDAsXG4gICAgICAgIGVuYWJsZUhpZ2hBY2N1cmFjeSA6IHRydWVcbiAgICB9KSAgXG5cbiAgc3RvcFdhdGNoOiAtPlxuICAgIGlmIEBsb2NhdGlvbldhdGNoSWQ/XG4gICAgICBuYXZpZ2F0b3IuZ2VvbG9jYXRpb24uY2xlYXJXYXRjaChAbG9jYXRpb25XYXRjaElkKVxuICAgICAgQGxvY2F0aW9uV2F0Y2hJZCA9IHVuZGVmaW5lZFxuXG5cbm1vZHVsZS5leHBvcnRzID0gTG9jYXRpb25GaW5kZXIgICIsIi8vIFRPRE8gYWRkIGxpY2Vuc2VcblxuTG9jYWxDb2xsZWN0aW9uID0ge307XG5FSlNPTiA9IHJlcXVpcmUoXCIuL0VKU09OXCIpO1xuXG4vLyBMaWtlIF8uaXNBcnJheSwgYnV0IGRvZXNuJ3QgcmVnYXJkIHBvbHlmaWxsZWQgVWludDhBcnJheXMgb24gb2xkIGJyb3dzZXJzIGFzXG4vLyBhcnJheXMuXG52YXIgaXNBcnJheSA9IGZ1bmN0aW9uICh4KSB7XG4gIHJldHVybiBfLmlzQXJyYXkoeCkgJiYgIUVKU09OLmlzQmluYXJ5KHgpO1xufTtcblxudmFyIF9hbnlJZkFycmF5ID0gZnVuY3Rpb24gKHgsIGYpIHtcbiAgaWYgKGlzQXJyYXkoeCkpXG4gICAgcmV0dXJuIF8uYW55KHgsIGYpO1xuICByZXR1cm4gZih4KTtcbn07XG5cbnZhciBfYW55SWZBcnJheVBsdXMgPSBmdW5jdGlvbiAoeCwgZikge1xuICBpZiAoZih4KSlcbiAgICByZXR1cm4gdHJ1ZTtcbiAgcmV0dXJuIGlzQXJyYXkoeCkgJiYgXy5hbnkoeCwgZik7XG59O1xuXG52YXIgaGFzT3BlcmF0b3JzID0gZnVuY3Rpb24odmFsdWVTZWxlY3Rvcikge1xuICB2YXIgdGhlc2VBcmVPcGVyYXRvcnMgPSB1bmRlZmluZWQ7XG4gIGZvciAodmFyIHNlbEtleSBpbiB2YWx1ZVNlbGVjdG9yKSB7XG4gICAgdmFyIHRoaXNJc09wZXJhdG9yID0gc2VsS2V5LnN1YnN0cigwLCAxKSA9PT0gJyQnO1xuICAgIGlmICh0aGVzZUFyZU9wZXJhdG9ycyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGVzZUFyZU9wZXJhdG9ycyA9IHRoaXNJc09wZXJhdG9yO1xuICAgIH0gZWxzZSBpZiAodGhlc2VBcmVPcGVyYXRvcnMgIT09IHRoaXNJc09wZXJhdG9yKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbmNvbnNpc3RlbnQgc2VsZWN0b3I6IFwiICsgdmFsdWVTZWxlY3Rvcik7XG4gICAgfVxuICB9XG4gIHJldHVybiAhIXRoZXNlQXJlT3BlcmF0b3JzOyAgLy8ge30gaGFzIG5vIG9wZXJhdG9yc1xufTtcblxudmFyIGNvbXBpbGVWYWx1ZVNlbGVjdG9yID0gZnVuY3Rpb24gKHZhbHVlU2VsZWN0b3IpIHtcbiAgaWYgKHZhbHVlU2VsZWN0b3IgPT0gbnVsbCkgeyAgLy8gdW5kZWZpbmVkIG9yIG51bGxcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICByZXR1cm4gX2FueUlmQXJyYXkodmFsdWUsIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiB4ID09IG51bGw7ICAvLyB1bmRlZmluZWQgb3IgbnVsbFxuICAgICAgfSk7XG4gICAgfTtcbiAgfVxuXG4gIC8vIFNlbGVjdG9yIGlzIGEgbm9uLW51bGwgcHJpbWl0aXZlIChhbmQgbm90IGFuIGFycmF5IG9yIFJlZ0V4cCBlaXRoZXIpLlxuICBpZiAoIV8uaXNPYmplY3QodmFsdWVTZWxlY3RvcikpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICByZXR1cm4gX2FueUlmQXJyYXkodmFsdWUsIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiB4ID09PSB2YWx1ZVNlbGVjdG9yO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfVxuXG4gIGlmICh2YWx1ZVNlbGVjdG9yIGluc3RhbmNlb2YgUmVnRXhwKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIHJldHVybiBfYW55SWZBcnJheSh2YWx1ZSwgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlU2VsZWN0b3IudGVzdCh4KTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH1cblxuICAvLyBBcnJheXMgbWF0Y2ggZWl0aGVyIGlkZW50aWNhbCBhcnJheXMgb3IgYXJyYXlzIHRoYXQgY29udGFpbiBpdCBhcyBhIHZhbHVlLlxuICBpZiAoaXNBcnJheSh2YWx1ZVNlbGVjdG9yKSkge1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIGlmICghaXNBcnJheSh2YWx1ZSkpXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIHJldHVybiBfYW55SWZBcnJheVBsdXModmFsdWUsIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiBMb2NhbENvbGxlY3Rpb24uX2YuX2VxdWFsKHZhbHVlU2VsZWN0b3IsIHgpO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfVxuXG4gIC8vIEl0J3MgYW4gb2JqZWN0LCBidXQgbm90IGFuIGFycmF5IG9yIHJlZ2V4cC5cbiAgaWYgKGhhc09wZXJhdG9ycyh2YWx1ZVNlbGVjdG9yKSkge1xuICAgIHZhciBvcGVyYXRvckZ1bmN0aW9ucyA9IFtdO1xuICAgIF8uZWFjaCh2YWx1ZVNlbGVjdG9yLCBmdW5jdGlvbiAob3BlcmFuZCwgb3BlcmF0b3IpIHtcbiAgICAgIGlmICghXy5oYXMoVkFMVUVfT1BFUkFUT1JTLCBvcGVyYXRvcikpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlVucmVjb2duaXplZCBvcGVyYXRvcjogXCIgKyBvcGVyYXRvcik7XG4gICAgICBvcGVyYXRvckZ1bmN0aW9ucy5wdXNoKFZBTFVFX09QRVJBVE9SU1tvcGVyYXRvcl0oXG4gICAgICAgIG9wZXJhbmQsIHZhbHVlU2VsZWN0b3IuJG9wdGlvbnMpKTtcbiAgICB9KTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICByZXR1cm4gXy5hbGwob3BlcmF0b3JGdW5jdGlvbnMsIGZ1bmN0aW9uIChmKSB7XG4gICAgICAgIHJldHVybiBmKHZhbHVlKTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH1cblxuICAvLyBJdCdzIGEgbGl0ZXJhbDsgY29tcGFyZSB2YWx1ZSAob3IgZWxlbWVudCBvZiB2YWx1ZSBhcnJheSkgZGlyZWN0bHkgdG8gdGhlXG4gIC8vIHNlbGVjdG9yLlxuICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgcmV0dXJuIF9hbnlJZkFycmF5KHZhbHVlLCBmdW5jdGlvbiAoeCkge1xuICAgICAgcmV0dXJuIExvY2FsQ29sbGVjdGlvbi5fZi5fZXF1YWwodmFsdWVTZWxlY3RvciwgeCk7XG4gICAgfSk7XG4gIH07XG59O1xuXG4vLyBYWFggY2FuIGZhY3RvciBvdXQgY29tbW9uIGxvZ2ljIGJlbG93XG52YXIgTE9HSUNBTF9PUEVSQVRPUlMgPSB7XG4gIFwiJGFuZFwiOiBmdW5jdGlvbihzdWJTZWxlY3Rvcikge1xuICAgIGlmICghaXNBcnJheShzdWJTZWxlY3RvcikgfHwgXy5pc0VtcHR5KHN1YlNlbGVjdG9yKSlcbiAgICAgIHRocm93IEVycm9yKFwiJGFuZC8kb3IvJG5vciBtdXN0IGJlIG5vbmVtcHR5IGFycmF5XCIpO1xuICAgIHZhciBzdWJTZWxlY3RvckZ1bmN0aW9ucyA9IF8ubWFwKFxuICAgICAgc3ViU2VsZWN0b3IsIGNvbXBpbGVEb2N1bWVudFNlbGVjdG9yKTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGRvYykge1xuICAgICAgcmV0dXJuIF8uYWxsKHN1YlNlbGVjdG9yRnVuY3Rpb25zLCBmdW5jdGlvbiAoZikge1xuICAgICAgICByZXR1cm4gZihkb2MpO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSxcblxuICBcIiRvclwiOiBmdW5jdGlvbihzdWJTZWxlY3Rvcikge1xuICAgIGlmICghaXNBcnJheShzdWJTZWxlY3RvcikgfHwgXy5pc0VtcHR5KHN1YlNlbGVjdG9yKSlcbiAgICAgIHRocm93IEVycm9yKFwiJGFuZC8kb3IvJG5vciBtdXN0IGJlIG5vbmVtcHR5IGFycmF5XCIpO1xuICAgIHZhciBzdWJTZWxlY3RvckZ1bmN0aW9ucyA9IF8ubWFwKFxuICAgICAgc3ViU2VsZWN0b3IsIGNvbXBpbGVEb2N1bWVudFNlbGVjdG9yKTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGRvYykge1xuICAgICAgcmV0dXJuIF8uYW55KHN1YlNlbGVjdG9yRnVuY3Rpb25zLCBmdW5jdGlvbiAoZikge1xuICAgICAgICByZXR1cm4gZihkb2MpO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSxcblxuICBcIiRub3JcIjogZnVuY3Rpb24oc3ViU2VsZWN0b3IpIHtcbiAgICBpZiAoIWlzQXJyYXkoc3ViU2VsZWN0b3IpIHx8IF8uaXNFbXB0eShzdWJTZWxlY3RvcikpXG4gICAgICB0aHJvdyBFcnJvcihcIiRhbmQvJG9yLyRub3IgbXVzdCBiZSBub25lbXB0eSBhcnJheVwiKTtcbiAgICB2YXIgc3ViU2VsZWN0b3JGdW5jdGlvbnMgPSBfLm1hcChcbiAgICAgIHN1YlNlbGVjdG9yLCBjb21waWxlRG9jdW1lbnRTZWxlY3Rvcik7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChkb2MpIHtcbiAgICAgIHJldHVybiBfLmFsbChzdWJTZWxlY3RvckZ1bmN0aW9ucywgZnVuY3Rpb24gKGYpIHtcbiAgICAgICAgcmV0dXJuICFmKGRvYyk7XG4gICAgICB9KTtcbiAgICB9O1xuICB9LFxuXG4gIFwiJHdoZXJlXCI6IGZ1bmN0aW9uKHNlbGVjdG9yVmFsdWUpIHtcbiAgICBpZiAoIShzZWxlY3RvclZhbHVlIGluc3RhbmNlb2YgRnVuY3Rpb24pKSB7XG4gICAgICBzZWxlY3RvclZhbHVlID0gRnVuY3Rpb24oXCJyZXR1cm4gXCIgKyBzZWxlY3RvclZhbHVlKTtcbiAgICB9XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChkb2MpIHtcbiAgICAgIHJldHVybiBzZWxlY3RvclZhbHVlLmNhbGwoZG9jKTtcbiAgICB9O1xuICB9XG59O1xuXG52YXIgVkFMVUVfT1BFUkFUT1JTID0ge1xuICBcIiRpblwiOiBmdW5jdGlvbiAob3BlcmFuZCkge1xuICAgIGlmICghaXNBcnJheShvcGVyYW5kKSlcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkFyZ3VtZW50IHRvICRpbiBtdXN0IGJlIGFycmF5XCIpO1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJldHVybiBfYW55SWZBcnJheVBsdXModmFsdWUsIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiBfLmFueShvcGVyYW5kLCBmdW5jdGlvbiAob3BlcmFuZEVsdCkge1xuICAgICAgICAgIHJldHVybiBMb2NhbENvbGxlY3Rpb24uX2YuX2VxdWFsKG9wZXJhbmRFbHQsIHgpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0sXG5cbiAgXCIkYWxsXCI6IGZ1bmN0aW9uIChvcGVyYW5kKSB7XG4gICAgaWYgKCFpc0FycmF5KG9wZXJhbmQpKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQXJndW1lbnQgdG8gJGFsbCBtdXN0IGJlIGFycmF5XCIpO1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIGlmICghaXNBcnJheSh2YWx1ZSkpXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIHJldHVybiBfLmFsbChvcGVyYW5kLCBmdW5jdGlvbiAob3BlcmFuZEVsdCkge1xuICAgICAgICByZXR1cm4gXy5hbnkodmFsdWUsIGZ1bmN0aW9uICh2YWx1ZUVsdCkge1xuICAgICAgICAgIHJldHVybiBMb2NhbENvbGxlY3Rpb24uX2YuX2VxdWFsKG9wZXJhbmRFbHQsIHZhbHVlRWx0KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9O1xuICB9LFxuXG4gIFwiJGx0XCI6IGZ1bmN0aW9uIChvcGVyYW5kKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgcmV0dXJuIF9hbnlJZkFycmF5KHZhbHVlLCBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4gTG9jYWxDb2xsZWN0aW9uLl9mLl9jbXAoeCwgb3BlcmFuZCkgPCAwO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSxcblxuICBcIiRsdGVcIjogZnVuY3Rpb24gKG9wZXJhbmQpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICByZXR1cm4gX2FueUlmQXJyYXkodmFsdWUsIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiBMb2NhbENvbGxlY3Rpb24uX2YuX2NtcCh4LCBvcGVyYW5kKSA8PSAwO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSxcblxuICBcIiRndFwiOiBmdW5jdGlvbiAob3BlcmFuZCkge1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJldHVybiBfYW55SWZBcnJheSh2YWx1ZSwgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIExvY2FsQ29sbGVjdGlvbi5fZi5fY21wKHgsIG9wZXJhbmQpID4gMDtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0sXG5cbiAgXCIkZ3RlXCI6IGZ1bmN0aW9uIChvcGVyYW5kKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgcmV0dXJuIF9hbnlJZkFycmF5KHZhbHVlLCBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4gTG9jYWxDb2xsZWN0aW9uLl9mLl9jbXAoeCwgb3BlcmFuZCkgPj0gMDtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0sXG5cbiAgXCIkbmVcIjogZnVuY3Rpb24gKG9wZXJhbmQpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICByZXR1cm4gISBfYW55SWZBcnJheVBsdXModmFsdWUsIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiBMb2NhbENvbGxlY3Rpb24uX2YuX2VxdWFsKHgsIG9wZXJhbmQpO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSxcblxuICBcIiRuaW5cIjogZnVuY3Rpb24gKG9wZXJhbmQpIHtcbiAgICBpZiAoIWlzQXJyYXkob3BlcmFuZCkpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJBcmd1bWVudCB0byAkbmluIG11c3QgYmUgYXJyYXlcIik7XG4gICAgdmFyIGluRnVuY3Rpb24gPSBWQUxVRV9PUEVSQVRPUlMuJGluKG9wZXJhbmQpO1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIC8vIEZpZWxkIGRvZXNuJ3QgZXhpc3QsIHNvIGl0J3Mgbm90LWluIG9wZXJhbmRcbiAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIHJldHVybiAhaW5GdW5jdGlvbih2YWx1ZSk7XG4gICAgfTtcbiAgfSxcblxuICBcIiRleGlzdHNcIjogZnVuY3Rpb24gKG9wZXJhbmQpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICByZXR1cm4gb3BlcmFuZCA9PT0gKHZhbHVlICE9PSB1bmRlZmluZWQpO1xuICAgIH07XG4gIH0sXG5cbiAgXCIkbW9kXCI6IGZ1bmN0aW9uIChvcGVyYW5kKSB7XG4gICAgdmFyIGRpdmlzb3IgPSBvcGVyYW5kWzBdLFxuICAgICAgICByZW1haW5kZXIgPSBvcGVyYW5kWzFdO1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJldHVybiBfYW55SWZBcnJheSh2YWx1ZSwgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIHggJSBkaXZpc29yID09PSByZW1haW5kZXI7XG4gICAgICB9KTtcbiAgICB9O1xuICB9LFxuXG4gIFwiJHNpemVcIjogZnVuY3Rpb24gKG9wZXJhbmQpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICByZXR1cm4gaXNBcnJheSh2YWx1ZSkgJiYgb3BlcmFuZCA9PT0gdmFsdWUubGVuZ3RoO1xuICAgIH07XG4gIH0sXG5cbiAgXCIkdHlwZVwiOiBmdW5jdGlvbiAob3BlcmFuZCkge1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIC8vIEEgbm9uZXhpc3RlbnQgZmllbGQgaXMgb2Ygbm8gdHlwZS5cbiAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAvLyBEZWZpbml0ZWx5IG5vdCBfYW55SWZBcnJheVBsdXM6ICR0eXBlOiA0IG9ubHkgbWF0Y2hlcyBhcnJheXMgdGhhdCBoYXZlXG4gICAgICAvLyBhcnJheXMgYXMgZWxlbWVudHMgYWNjb3JkaW5nIHRvIHRoZSBNb25nbyBkb2NzLlxuICAgICAgcmV0dXJuIF9hbnlJZkFycmF5KHZhbHVlLCBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4gTG9jYWxDb2xsZWN0aW9uLl9mLl90eXBlKHgpID09PSBvcGVyYW5kO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSxcblxuICBcIiRyZWdleFwiOiBmdW5jdGlvbiAob3BlcmFuZCwgb3B0aW9ucykge1xuICAgIGlmIChvcHRpb25zICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIC8vIE9wdGlvbnMgcGFzc2VkIGluICRvcHRpb25zIChldmVuIHRoZSBlbXB0eSBzdHJpbmcpIGFsd2F5cyBvdmVycmlkZXNcbiAgICAgIC8vIG9wdGlvbnMgaW4gdGhlIFJlZ0V4cCBvYmplY3QgaXRzZWxmLlxuXG4gICAgICAvLyBCZSBjbGVhciB0aGF0IHdlIG9ubHkgc3VwcG9ydCB0aGUgSlMtc3VwcG9ydGVkIG9wdGlvbnMsIG5vdCBleHRlbmRlZFxuICAgICAgLy8gb25lcyAoZWcsIE1vbmdvIHN1cHBvcnRzIHggYW5kIHMpLiBJZGVhbGx5IHdlIHdvdWxkIGltcGxlbWVudCB4IGFuZCBzXG4gICAgICAvLyBieSB0cmFuc2Zvcm1pbmcgdGhlIHJlZ2V4cCwgYnV0IG5vdCB0b2RheS4uLlxuICAgICAgaWYgKC9bXmdpbV0vLnRlc3Qob3B0aW9ucykpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIk9ubHkgdGhlIGksIG0sIGFuZCBnIHJlZ2V4cCBvcHRpb25zIGFyZSBzdXBwb3J0ZWRcIik7XG5cbiAgICAgIHZhciByZWdleFNvdXJjZSA9IG9wZXJhbmQgaW5zdGFuY2VvZiBSZWdFeHAgPyBvcGVyYW5kLnNvdXJjZSA6IG9wZXJhbmQ7XG4gICAgICBvcGVyYW5kID0gbmV3IFJlZ0V4cChyZWdleFNvdXJjZSwgb3B0aW9ucyk7XG4gICAgfSBlbHNlIGlmICghKG9wZXJhbmQgaW5zdGFuY2VvZiBSZWdFeHApKSB7XG4gICAgICBvcGVyYW5kID0gbmV3IFJlZ0V4cChvcGVyYW5kKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZClcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgcmV0dXJuIF9hbnlJZkFycmF5KHZhbHVlLCBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4gb3BlcmFuZC50ZXN0KHgpO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSxcblxuICBcIiRvcHRpb25zXCI6IGZ1bmN0aW9uIChvcGVyYW5kKSB7XG4gICAgLy8gZXZhbHVhdGlvbiBoYXBwZW5zIGF0IHRoZSAkcmVnZXggZnVuY3Rpb24gYWJvdmVcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7IHJldHVybiB0cnVlOyB9O1xuICB9LFxuXG4gIFwiJGVsZW1NYXRjaFwiOiBmdW5jdGlvbiAob3BlcmFuZCkge1xuICAgIHZhciBtYXRjaGVyID0gY29tcGlsZURvY3VtZW50U2VsZWN0b3Iob3BlcmFuZCk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgaWYgKCFpc0FycmF5KHZhbHVlKSlcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgcmV0dXJuIF8uYW55KHZhbHVlLCBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4gbWF0Y2hlcih4KTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0sXG5cbiAgXCIkbm90XCI6IGZ1bmN0aW9uIChvcGVyYW5kKSB7XG4gICAgdmFyIG1hdGNoZXIgPSBjb21waWxlVmFsdWVTZWxlY3RvcihvcGVyYW5kKTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICByZXR1cm4gIW1hdGNoZXIodmFsdWUpO1xuICAgIH07XG4gIH0sXG5cbiAgXCIkbmVhclwiOiBmdW5jdGlvbiAob3BlcmFuZCkge1xuICAgIC8vIEFsd2F5cyByZXR1cm5zIHRydWUuIE11c3QgYmUgaGFuZGxlZCBpbiBwb3N0LWZpbHRlci9zb3J0L2xpbWl0XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9LFxuXG4gIFwiJGdlb0ludGVyc2VjdHNcIjogZnVuY3Rpb24gKG9wZXJhbmQpIHtcbiAgICAvLyBBbHdheXMgcmV0dXJucyB0cnVlLiBNdXN0IGJlIGhhbmRsZWQgaW4gcG9zdC1maWx0ZXIvc29ydC9saW1pdFxuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuXG59O1xuXG4vLyBoZWxwZXJzIHVzZWQgYnkgY29tcGlsZWQgc2VsZWN0b3IgY29kZVxuTG9jYWxDb2xsZWN0aW9uLl9mID0ge1xuICAvLyBYWFggZm9yIF9hbGwgYW5kIF9pbiwgY29uc2lkZXIgYnVpbGRpbmcgJ2lucXVlcnknIGF0IGNvbXBpbGUgdGltZS4uXG5cbiAgX3R5cGU6IGZ1bmN0aW9uICh2KSB7XG4gICAgaWYgKHR5cGVvZiB2ID09PSBcIm51bWJlclwiKVxuICAgICAgcmV0dXJuIDE7XG4gICAgaWYgKHR5cGVvZiB2ID09PSBcInN0cmluZ1wiKVxuICAgICAgcmV0dXJuIDI7XG4gICAgaWYgKHR5cGVvZiB2ID09PSBcImJvb2xlYW5cIilcbiAgICAgIHJldHVybiA4O1xuICAgIGlmIChpc0FycmF5KHYpKVxuICAgICAgcmV0dXJuIDQ7XG4gICAgaWYgKHYgPT09IG51bGwpXG4gICAgICByZXR1cm4gMTA7XG4gICAgaWYgKHYgaW5zdGFuY2VvZiBSZWdFeHApXG4gICAgICByZXR1cm4gMTE7XG4gICAgaWYgKHR5cGVvZiB2ID09PSBcImZ1bmN0aW9uXCIpXG4gICAgICAvLyBub3RlIHRoYXQgdHlwZW9mKC94LykgPT09IFwiZnVuY3Rpb25cIlxuICAgICAgcmV0dXJuIDEzO1xuICAgIGlmICh2IGluc3RhbmNlb2YgRGF0ZSlcbiAgICAgIHJldHVybiA5O1xuICAgIGlmIChFSlNPTi5pc0JpbmFyeSh2KSlcbiAgICAgIHJldHVybiA1O1xuICAgIGlmICh2IGluc3RhbmNlb2YgTWV0ZW9yLkNvbGxlY3Rpb24uT2JqZWN0SUQpXG4gICAgICByZXR1cm4gNztcbiAgICByZXR1cm4gMzsgLy8gb2JqZWN0XG5cbiAgICAvLyBYWFggc3VwcG9ydCBzb21lL2FsbCBvZiB0aGVzZTpcbiAgICAvLyAxNCwgc3ltYm9sXG4gICAgLy8gMTUsIGphdmFzY3JpcHQgY29kZSB3aXRoIHNjb3BlXG4gICAgLy8gMTYsIDE4OiAzMi1iaXQvNjQtYml0IGludGVnZXJcbiAgICAvLyAxNywgdGltZXN0YW1wXG4gICAgLy8gMjU1LCBtaW5rZXlcbiAgICAvLyAxMjcsIG1heGtleVxuICB9LFxuXG4gIC8vIGRlZXAgZXF1YWxpdHkgdGVzdDogdXNlIGZvciBsaXRlcmFsIGRvY3VtZW50IGFuZCBhcnJheSBtYXRjaGVzXG4gIF9lcXVhbDogZnVuY3Rpb24gKGEsIGIpIHtcbiAgICByZXR1cm4gRUpTT04uZXF1YWxzKGEsIGIsIHtrZXlPcmRlclNlbnNpdGl2ZTogdHJ1ZX0pO1xuICB9LFxuXG4gIC8vIG1hcHMgYSB0eXBlIGNvZGUgdG8gYSB2YWx1ZSB0aGF0IGNhbiBiZSB1c2VkIHRvIHNvcnQgdmFsdWVzIG9mXG4gIC8vIGRpZmZlcmVudCB0eXBlc1xuICBfdHlwZW9yZGVyOiBmdW5jdGlvbiAodCkge1xuICAgIC8vIGh0dHA6Ly93d3cubW9uZ29kYi5vcmcvZGlzcGxheS9ET0NTL1doYXQraXMrdGhlK0NvbXBhcmUrT3JkZXIrZm9yK0JTT04rVHlwZXNcbiAgICAvLyBYWFggd2hhdCBpcyB0aGUgY29ycmVjdCBzb3J0IHBvc2l0aW9uIGZvciBKYXZhc2NyaXB0IGNvZGU/XG4gICAgLy8gKCcxMDAnIGluIHRoZSBtYXRyaXggYmVsb3cpXG4gICAgLy8gWFhYIG1pbmtleS9tYXhrZXlcbiAgICByZXR1cm4gWy0xLCAgLy8gKG5vdCBhIHR5cGUpXG4gICAgICAgICAgICAxLCAgIC8vIG51bWJlclxuICAgICAgICAgICAgMiwgICAvLyBzdHJpbmdcbiAgICAgICAgICAgIDMsICAgLy8gb2JqZWN0XG4gICAgICAgICAgICA0LCAgIC8vIGFycmF5XG4gICAgICAgICAgICA1LCAgIC8vIGJpbmFyeVxuICAgICAgICAgICAgLTEsICAvLyBkZXByZWNhdGVkXG4gICAgICAgICAgICA2LCAgIC8vIE9iamVjdElEXG4gICAgICAgICAgICA3LCAgIC8vIGJvb2xcbiAgICAgICAgICAgIDgsICAgLy8gRGF0ZVxuICAgICAgICAgICAgMCwgICAvLyBudWxsXG4gICAgICAgICAgICA5LCAgIC8vIFJlZ0V4cFxuICAgICAgICAgICAgLTEsICAvLyBkZXByZWNhdGVkXG4gICAgICAgICAgICAxMDAsIC8vIEpTIGNvZGVcbiAgICAgICAgICAgIDIsICAgLy8gZGVwcmVjYXRlZCAoc3ltYm9sKVxuICAgICAgICAgICAgMTAwLCAvLyBKUyBjb2RlXG4gICAgICAgICAgICAxLCAgIC8vIDMyLWJpdCBpbnRcbiAgICAgICAgICAgIDgsICAgLy8gTW9uZ28gdGltZXN0YW1wXG4gICAgICAgICAgICAxICAgIC8vIDY0LWJpdCBpbnRcbiAgICAgICAgICAgXVt0XTtcbiAgfSxcblxuICAvLyBjb21wYXJlIHR3byB2YWx1ZXMgb2YgdW5rbm93biB0eXBlIGFjY29yZGluZyB0byBCU09OIG9yZGVyaW5nXG4gIC8vIHNlbWFudGljcy4gKGFzIGFuIGV4dGVuc2lvbiwgY29uc2lkZXIgJ3VuZGVmaW5lZCcgdG8gYmUgbGVzcyB0aGFuXG4gIC8vIGFueSBvdGhlciB2YWx1ZS4pIHJldHVybiBuZWdhdGl2ZSBpZiBhIGlzIGxlc3MsIHBvc2l0aXZlIGlmIGIgaXNcbiAgLy8gbGVzcywgb3IgMCBpZiBlcXVhbFxuICBfY21wOiBmdW5jdGlvbiAoYSwgYikge1xuICAgIGlmIChhID09PSB1bmRlZmluZWQpXG4gICAgICByZXR1cm4gYiA9PT0gdW5kZWZpbmVkID8gMCA6IC0xO1xuICAgIGlmIChiID09PSB1bmRlZmluZWQpXG4gICAgICByZXR1cm4gMTtcbiAgICB2YXIgdGEgPSBMb2NhbENvbGxlY3Rpb24uX2YuX3R5cGUoYSk7XG4gICAgdmFyIHRiID0gTG9jYWxDb2xsZWN0aW9uLl9mLl90eXBlKGIpO1xuICAgIHZhciBvYSA9IExvY2FsQ29sbGVjdGlvbi5fZi5fdHlwZW9yZGVyKHRhKTtcbiAgICB2YXIgb2IgPSBMb2NhbENvbGxlY3Rpb24uX2YuX3R5cGVvcmRlcih0Yik7XG4gICAgaWYgKG9hICE9PSBvYilcbiAgICAgIHJldHVybiBvYSA8IG9iID8gLTEgOiAxO1xuICAgIGlmICh0YSAhPT0gdGIpXG4gICAgICAvLyBYWFggbmVlZCB0byBpbXBsZW1lbnQgdGhpcyBpZiB3ZSBpbXBsZW1lbnQgU3ltYm9sIG9yIGludGVnZXJzLCBvclxuICAgICAgLy8gVGltZXN0YW1wXG4gICAgICB0aHJvdyBFcnJvcihcIk1pc3NpbmcgdHlwZSBjb2VyY2lvbiBsb2dpYyBpbiBfY21wXCIpO1xuICAgIGlmICh0YSA9PT0gNykgeyAvLyBPYmplY3RJRFxuICAgICAgLy8gQ29udmVydCB0byBzdHJpbmcuXG4gICAgICB0YSA9IHRiID0gMjtcbiAgICAgIGEgPSBhLnRvSGV4U3RyaW5nKCk7XG4gICAgICBiID0gYi50b0hleFN0cmluZygpO1xuICAgIH1cbiAgICBpZiAodGEgPT09IDkpIHsgLy8gRGF0ZVxuICAgICAgLy8gQ29udmVydCB0byBtaWxsaXMuXG4gICAgICB0YSA9IHRiID0gMTtcbiAgICAgIGEgPSBhLmdldFRpbWUoKTtcbiAgICAgIGIgPSBiLmdldFRpbWUoKTtcbiAgICB9XG5cbiAgICBpZiAodGEgPT09IDEpIC8vIGRvdWJsZVxuICAgICAgcmV0dXJuIGEgLSBiO1xuICAgIGlmICh0YiA9PT0gMikgLy8gc3RyaW5nXG4gICAgICByZXR1cm4gYSA8IGIgPyAtMSA6IChhID09PSBiID8gMCA6IDEpO1xuICAgIGlmICh0YSA9PT0gMykgeyAvLyBPYmplY3RcbiAgICAgIC8vIHRoaXMgY291bGQgYmUgbXVjaCBtb3JlIGVmZmljaWVudCBpbiB0aGUgZXhwZWN0ZWQgY2FzZSAuLi5cbiAgICAgIHZhciB0b19hcnJheSA9IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgICAgdmFyIHJldCA9IFtdO1xuICAgICAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgICAgICAgcmV0LnB1c2goa2V5KTtcbiAgICAgICAgICByZXQucHVzaChvYmpba2V5XSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgIH07XG4gICAgICByZXR1cm4gTG9jYWxDb2xsZWN0aW9uLl9mLl9jbXAodG9fYXJyYXkoYSksIHRvX2FycmF5KGIpKTtcbiAgICB9XG4gICAgaWYgKHRhID09PSA0KSB7IC8vIEFycmF5XG4gICAgICBmb3IgKHZhciBpID0gMDsgOyBpKyspIHtcbiAgICAgICAgaWYgKGkgPT09IGEubGVuZ3RoKVxuICAgICAgICAgIHJldHVybiAoaSA9PT0gYi5sZW5ndGgpID8gMCA6IC0xO1xuICAgICAgICBpZiAoaSA9PT0gYi5sZW5ndGgpXG4gICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgIHZhciBzID0gTG9jYWxDb2xsZWN0aW9uLl9mLl9jbXAoYVtpXSwgYltpXSk7XG4gICAgICAgIGlmIChzICE9PSAwKVxuICAgICAgICAgIHJldHVybiBzO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAodGEgPT09IDUpIHsgLy8gYmluYXJ5XG4gICAgICAvLyBTdXJwcmlzaW5nbHksIGEgc21hbGwgYmluYXJ5IGJsb2IgaXMgYWx3YXlzIGxlc3MgdGhhbiBhIGxhcmdlIG9uZSBpblxuICAgICAgLy8gTW9uZ28uXG4gICAgICBpZiAoYS5sZW5ndGggIT09IGIubGVuZ3RoKVxuICAgICAgICByZXR1cm4gYS5sZW5ndGggLSBiLmxlbmd0aDtcbiAgICAgIGZvciAoaSA9IDA7IGkgPCBhLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChhW2ldIDwgYltpXSlcbiAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgIGlmIChhW2ldID4gYltpXSlcbiAgICAgICAgICByZXR1cm4gMTtcbiAgICAgIH1cbiAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICBpZiAodGEgPT09IDgpIHsgLy8gYm9vbGVhblxuICAgICAgaWYgKGEpIHJldHVybiBiID8gMCA6IDE7XG4gICAgICByZXR1cm4gYiA/IC0xIDogMDtcbiAgICB9XG4gICAgaWYgKHRhID09PSAxMCkgLy8gbnVsbFxuICAgICAgcmV0dXJuIDA7XG4gICAgaWYgKHRhID09PSAxMSkgLy8gcmVnZXhwXG4gICAgICB0aHJvdyBFcnJvcihcIlNvcnRpbmcgbm90IHN1cHBvcnRlZCBvbiByZWd1bGFyIGV4cHJlc3Npb25cIik7IC8vIFhYWFxuICAgIC8vIDEzOiBqYXZhc2NyaXB0IGNvZGVcbiAgICAvLyAxNDogc3ltYm9sXG4gICAgLy8gMTU6IGphdmFzY3JpcHQgY29kZSB3aXRoIHNjb3BlXG4gICAgLy8gMTY6IDMyLWJpdCBpbnRlZ2VyXG4gICAgLy8gMTc6IHRpbWVzdGFtcFxuICAgIC8vIDE4OiA2NC1iaXQgaW50ZWdlclxuICAgIC8vIDI1NTogbWlua2V5XG4gICAgLy8gMTI3OiBtYXhrZXlcbiAgICBpZiAodGEgPT09IDEzKSAvLyBqYXZhc2NyaXB0IGNvZGVcbiAgICAgIHRocm93IEVycm9yKFwiU29ydGluZyBub3Qgc3VwcG9ydGVkIG9uIEphdmFzY3JpcHQgY29kZVwiKTsgLy8gWFhYXG4gICAgdGhyb3cgRXJyb3IoXCJVbmtub3duIHR5cGUgdG8gc29ydFwiKTtcbiAgfVxufTtcblxuLy8gRm9yIHVuaXQgdGVzdHMuIFRydWUgaWYgdGhlIGdpdmVuIGRvY3VtZW50IG1hdGNoZXMgdGhlIGdpdmVuXG4vLyBzZWxlY3Rvci5cbkxvY2FsQ29sbGVjdGlvbi5fbWF0Y2hlcyA9IGZ1bmN0aW9uIChzZWxlY3RvciwgZG9jKSB7XG4gIHJldHVybiAoTG9jYWxDb2xsZWN0aW9uLl9jb21waWxlU2VsZWN0b3Ioc2VsZWN0b3IpKShkb2MpO1xufTtcblxuLy8gX21ha2VMb29rdXBGdW5jdGlvbihrZXkpIHJldHVybnMgYSBsb29rdXAgZnVuY3Rpb24uXG4vL1xuLy8gQSBsb29rdXAgZnVuY3Rpb24gdGFrZXMgaW4gYSBkb2N1bWVudCBhbmQgcmV0dXJucyBhbiBhcnJheSBvZiBtYXRjaGluZ1xuLy8gdmFsdWVzLiAgVGhpcyBhcnJheSBoYXMgbW9yZSB0aGFuIG9uZSBlbGVtZW50IGlmIGFueSBzZWdtZW50IG9mIHRoZSBrZXkgb3RoZXJcbi8vIHRoYW4gdGhlIGxhc3Qgb25lIGlzIGFuIGFycmF5LiAgaWUsIGFueSBhcnJheXMgZm91bmQgd2hlbiBkb2luZyBub24tZmluYWxcbi8vIGxvb2t1cHMgcmVzdWx0IGluIHRoaXMgZnVuY3Rpb24gXCJicmFuY2hpbmdcIjsgZWFjaCBlbGVtZW50IGluIHRoZSByZXR1cm5lZFxuLy8gYXJyYXkgcmVwcmVzZW50cyB0aGUgdmFsdWUgZm91bmQgYXQgdGhpcyBicmFuY2guIElmIGFueSBicmFuY2ggZG9lc24ndCBoYXZlIGFcbi8vIGZpbmFsIHZhbHVlIGZvciB0aGUgZnVsbCBrZXksIGl0cyBlbGVtZW50IGluIHRoZSByZXR1cm5lZCBsaXN0IHdpbGwgYmVcbi8vIHVuZGVmaW5lZC4gSXQgYWx3YXlzIHJldHVybnMgYSBub24tZW1wdHkgYXJyYXkuXG4vL1xuLy8gX21ha2VMb29rdXBGdW5jdGlvbignYS54Jykoe2E6IHt4OiAxfX0pIHJldHVybnMgWzFdXG4vLyBfbWFrZUxvb2t1cEZ1bmN0aW9uKCdhLngnKSh7YToge3g6IFsxXX19KSByZXR1cm5zIFtbMV1dXG4vLyBfbWFrZUxvb2t1cEZ1bmN0aW9uKCdhLngnKSh7YTogNX0pICByZXR1cm5zIFt1bmRlZmluZWRdXG4vLyBfbWFrZUxvb2t1cEZ1bmN0aW9uKCdhLngnKSh7YTogW3t4OiAxfSxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3g6IFsyXX0sXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHt5OiAzfV19KVxuLy8gICByZXR1cm5zIFsxLCBbMl0sIHVuZGVmaW5lZF1cbkxvY2FsQ29sbGVjdGlvbi5fbWFrZUxvb2t1cEZ1bmN0aW9uID0gZnVuY3Rpb24gKGtleSkge1xuICB2YXIgZG90TG9jYXRpb24gPSBrZXkuaW5kZXhPZignLicpO1xuICB2YXIgZmlyc3QsIGxvb2t1cFJlc3QsIG5leHRJc051bWVyaWM7XG4gIGlmIChkb3RMb2NhdGlvbiA9PT0gLTEpIHtcbiAgICBmaXJzdCA9IGtleTtcbiAgfSBlbHNlIHtcbiAgICBmaXJzdCA9IGtleS5zdWJzdHIoMCwgZG90TG9jYXRpb24pO1xuICAgIHZhciByZXN0ID0ga2V5LnN1YnN0cihkb3RMb2NhdGlvbiArIDEpO1xuICAgIGxvb2t1cFJlc3QgPSBMb2NhbENvbGxlY3Rpb24uX21ha2VMb29rdXBGdW5jdGlvbihyZXN0KTtcbiAgICAvLyBJcyB0aGUgbmV4dCAocGVyaGFwcyBmaW5hbCkgcGllY2UgbnVtZXJpYyAoaWUsIGFuIGFycmF5IGxvb2t1cD8pXG4gICAgbmV4dElzTnVtZXJpYyA9IC9eXFxkKyhcXC58JCkvLnRlc3QocmVzdCk7XG4gIH1cblxuICByZXR1cm4gZnVuY3Rpb24gKGRvYykge1xuICAgIGlmIChkb2MgPT0gbnVsbCkgIC8vIG51bGwgb3IgdW5kZWZpbmVkXG4gICAgICByZXR1cm4gW3VuZGVmaW5lZF07XG4gICAgdmFyIGZpcnN0TGV2ZWwgPSBkb2NbZmlyc3RdO1xuXG4gICAgLy8gV2UgZG9uJ3QgXCJicmFuY2hcIiBhdCB0aGUgZmluYWwgbGV2ZWwuXG4gICAgaWYgKCFsb29rdXBSZXN0KVxuICAgICAgcmV0dXJuIFtmaXJzdExldmVsXTtcblxuICAgIC8vIEl0J3MgYW4gZW1wdHkgYXJyYXksIGFuZCB3ZSdyZSBub3QgZG9uZTogd2Ugd29uJ3QgZmluZCBhbnl0aGluZy5cbiAgICBpZiAoaXNBcnJheShmaXJzdExldmVsKSAmJiBmaXJzdExldmVsLmxlbmd0aCA9PT0gMClcbiAgICAgIHJldHVybiBbdW5kZWZpbmVkXTtcblxuICAgIC8vIEZvciBlYWNoIHJlc3VsdCBhdCB0aGlzIGxldmVsLCBmaW5pc2ggdGhlIGxvb2t1cCBvbiB0aGUgcmVzdCBvZiB0aGUga2V5LFxuICAgIC8vIGFuZCByZXR1cm4gZXZlcnl0aGluZyB3ZSBmaW5kLiBBbHNvLCBpZiB0aGUgbmV4dCByZXN1bHQgaXMgYSBudW1iZXIsXG4gICAgLy8gZG9uJ3QgYnJhbmNoIGhlcmUuXG4gICAgLy9cbiAgICAvLyBUZWNobmljYWxseSwgaW4gTW9uZ29EQiwgd2Ugc2hvdWxkIGJlIGFibGUgdG8gaGFuZGxlIHRoZSBjYXNlIHdoZXJlXG4gICAgLy8gb2JqZWN0cyBoYXZlIG51bWVyaWMga2V5cywgYnV0IE1vbmdvIGRvZXNuJ3QgYWN0dWFsbHkgaGFuZGxlIHRoaXNcbiAgICAvLyBjb25zaXN0ZW50bHkgeWV0IGl0c2VsZiwgc2VlIGVnXG4gICAgLy8gaHR0cHM6Ly9qaXJhLm1vbmdvZGIub3JnL2Jyb3dzZS9TRVJWRVItMjg5OFxuICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9tb25nb2RiL21vbmdvL2Jsb2IvbWFzdGVyL2pzdGVzdHMvYXJyYXlfbWF0Y2gyLmpzXG4gICAgaWYgKCFpc0FycmF5KGZpcnN0TGV2ZWwpIHx8IG5leHRJc051bWVyaWMpXG4gICAgICBmaXJzdExldmVsID0gW2ZpcnN0TGV2ZWxdO1xuICAgIHJldHVybiBBcnJheS5wcm90b3R5cGUuY29uY2F0LmFwcGx5KFtdLCBfLm1hcChmaXJzdExldmVsLCBsb29rdXBSZXN0KSk7XG4gIH07XG59O1xuXG4vLyBUaGUgbWFpbiBjb21waWxhdGlvbiBmdW5jdGlvbiBmb3IgYSBnaXZlbiBzZWxlY3Rvci5cbnZhciBjb21waWxlRG9jdW1lbnRTZWxlY3RvciA9IGZ1bmN0aW9uIChkb2NTZWxlY3Rvcikge1xuICB2YXIgcGVyS2V5U2VsZWN0b3JzID0gW107XG4gIF8uZWFjaChkb2NTZWxlY3RvciwgZnVuY3Rpb24gKHN1YlNlbGVjdG9yLCBrZXkpIHtcbiAgICBpZiAoa2V5LnN1YnN0cigwLCAxKSA9PT0gJyQnKSB7XG4gICAgICAvLyBPdXRlciBvcGVyYXRvcnMgYXJlIGVpdGhlciBsb2dpY2FsIG9wZXJhdG9ycyAodGhleSByZWN1cnNlIGJhY2sgaW50b1xuICAgICAgLy8gdGhpcyBmdW5jdGlvbiksIG9yICR3aGVyZS5cbiAgICAgIGlmICghXy5oYXMoTE9HSUNBTF9PUEVSQVRPUlMsIGtleSkpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlVucmVjb2duaXplZCBsb2dpY2FsIG9wZXJhdG9yOiBcIiArIGtleSk7XG4gICAgICBwZXJLZXlTZWxlY3RvcnMucHVzaChMT0dJQ0FMX09QRVJBVE9SU1trZXldKHN1YlNlbGVjdG9yKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBsb29rVXBCeUluZGV4ID0gTG9jYWxDb2xsZWN0aW9uLl9tYWtlTG9va3VwRnVuY3Rpb24oa2V5KTtcbiAgICAgIHZhciB2YWx1ZVNlbGVjdG9yRnVuYyA9IGNvbXBpbGVWYWx1ZVNlbGVjdG9yKHN1YlNlbGVjdG9yKTtcbiAgICAgIHBlcktleVNlbGVjdG9ycy5wdXNoKGZ1bmN0aW9uIChkb2MpIHtcbiAgICAgICAgdmFyIGJyYW5jaFZhbHVlcyA9IGxvb2tVcEJ5SW5kZXgoZG9jKTtcbiAgICAgICAgLy8gV2UgYXBwbHkgdGhlIHNlbGVjdG9yIHRvIGVhY2ggXCJicmFuY2hlZFwiIHZhbHVlIGFuZCByZXR1cm4gdHJ1ZSBpZiBhbnlcbiAgICAgICAgLy8gbWF0Y2guIFRoaXMgaXNuJ3QgMTAwJSBjb25zaXN0ZW50IHdpdGggTW9uZ29EQjsgZWcsIHNlZTpcbiAgICAgICAgLy8gaHR0cHM6Ly9qaXJhLm1vbmdvZGIub3JnL2Jyb3dzZS9TRVJWRVItODU4NVxuICAgICAgICByZXR1cm4gXy5hbnkoYnJhbmNoVmFsdWVzLCB2YWx1ZVNlbGVjdG9yRnVuYyk7XG4gICAgICB9KTtcbiAgICB9XG4gIH0pO1xuXG5cbiAgcmV0dXJuIGZ1bmN0aW9uIChkb2MpIHtcbiAgICByZXR1cm4gXy5hbGwocGVyS2V5U2VsZWN0b3JzLCBmdW5jdGlvbiAoZikge1xuICAgICAgcmV0dXJuIGYoZG9jKTtcbiAgICB9KTtcbiAgfTtcbn07XG5cbi8vIEdpdmVuIGEgc2VsZWN0b3IsIHJldHVybiBhIGZ1bmN0aW9uIHRoYXQgdGFrZXMgb25lIGFyZ3VtZW50LCBhXG4vLyBkb2N1bWVudCwgYW5kIHJldHVybnMgdHJ1ZSBpZiB0aGUgZG9jdW1lbnQgbWF0Y2hlcyB0aGUgc2VsZWN0b3IsXG4vLyBlbHNlIGZhbHNlLlxuTG9jYWxDb2xsZWN0aW9uLl9jb21waWxlU2VsZWN0b3IgPSBmdW5jdGlvbiAoc2VsZWN0b3IpIHtcbiAgLy8geW91IGNhbiBwYXNzIGEgbGl0ZXJhbCBmdW5jdGlvbiBpbnN0ZWFkIG9mIGEgc2VsZWN0b3JcbiAgaWYgKHNlbGVjdG9yIGluc3RhbmNlb2YgRnVuY3Rpb24pXG4gICAgcmV0dXJuIGZ1bmN0aW9uIChkb2MpIHtyZXR1cm4gc2VsZWN0b3IuY2FsbChkb2MpO307XG5cbiAgLy8gc2hvcnRoYW5kIC0tIHNjYWxhcnMgbWF0Y2ggX2lkXG4gIGlmIChMb2NhbENvbGxlY3Rpb24uX3NlbGVjdG9ySXNJZChzZWxlY3RvcikpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGRvYykge1xuICAgICAgcmV0dXJuIEVKU09OLmVxdWFscyhkb2MuX2lkLCBzZWxlY3Rvcik7XG4gICAgfTtcbiAgfVxuXG4gIC8vIHByb3RlY3QgYWdhaW5zdCBkYW5nZXJvdXMgc2VsZWN0b3JzLiAgZmFsc2V5IGFuZCB7X2lkOiBmYWxzZXl9IGFyZSBib3RoXG4gIC8vIGxpa2VseSBwcm9ncmFtbWVyIGVycm9yLCBhbmQgbm90IHdoYXQgeW91IHdhbnQsIHBhcnRpY3VsYXJseSBmb3JcbiAgLy8gZGVzdHJ1Y3RpdmUgb3BlcmF0aW9ucy5cbiAgaWYgKCFzZWxlY3RvciB8fCAoKCdfaWQnIGluIHNlbGVjdG9yKSAmJiAhc2VsZWN0b3IuX2lkKSlcbiAgICByZXR1cm4gZnVuY3Rpb24gKGRvYykge3JldHVybiBmYWxzZTt9O1xuXG4gIC8vIFRvcCBsZXZlbCBjYW4ndCBiZSBhbiBhcnJheSBvciB0cnVlIG9yIGJpbmFyeS5cbiAgaWYgKHR5cGVvZihzZWxlY3RvcikgPT09ICdib29sZWFuJyB8fCBpc0FycmF5KHNlbGVjdG9yKSB8fFxuICAgICAgRUpTT04uaXNCaW5hcnkoc2VsZWN0b3IpKVxuICAgIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgc2VsZWN0b3I6IFwiICsgc2VsZWN0b3IpO1xuXG4gIHJldHVybiBjb21waWxlRG9jdW1lbnRTZWxlY3RvcihzZWxlY3Rvcik7XG59O1xuXG4vLyBHaXZlIGEgc29ydCBzcGVjLCB3aGljaCBjYW4gYmUgaW4gYW55IG9mIHRoZXNlIGZvcm1zOlxuLy8gICB7XCJrZXkxXCI6IDEsIFwia2V5MlwiOiAtMX1cbi8vICAgW1tcImtleTFcIiwgXCJhc2NcIl0sIFtcImtleTJcIiwgXCJkZXNjXCJdXVxuLy8gICBbXCJrZXkxXCIsIFtcImtleTJcIiwgXCJkZXNjXCJdXVxuLy9cbi8vICguLiB3aXRoIHRoZSBmaXJzdCBmb3JtIGJlaW5nIGRlcGVuZGVudCBvbiB0aGUga2V5IGVudW1lcmF0aW9uXG4vLyBiZWhhdmlvciBvZiB5b3VyIGphdmFzY3JpcHQgVk0sIHdoaWNoIHVzdWFsbHkgZG9lcyB3aGF0IHlvdSBtZWFuIGluXG4vLyB0aGlzIGNhc2UgaWYgdGhlIGtleSBuYW1lcyBkb24ndCBsb29rIGxpa2UgaW50ZWdlcnMgLi4pXG4vL1xuLy8gcmV0dXJuIGEgZnVuY3Rpb24gdGhhdCB0YWtlcyB0d28gb2JqZWN0cywgYW5kIHJldHVybnMgLTEgaWYgdGhlXG4vLyBmaXJzdCBvYmplY3QgY29tZXMgZmlyc3QgaW4gb3JkZXIsIDEgaWYgdGhlIHNlY29uZCBvYmplY3QgY29tZXNcbi8vIGZpcnN0LCBvciAwIGlmIG5laXRoZXIgb2JqZWN0IGNvbWVzIGJlZm9yZSB0aGUgb3RoZXIuXG5cbkxvY2FsQ29sbGVjdGlvbi5fY29tcGlsZVNvcnQgPSBmdW5jdGlvbiAoc3BlYykge1xuICB2YXIgc29ydFNwZWNQYXJ0cyA9IFtdO1xuXG4gIGlmIChzcGVjIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNwZWMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmICh0eXBlb2Ygc3BlY1tpXSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICBzb3J0U3BlY1BhcnRzLnB1c2goe1xuICAgICAgICAgIGxvb2t1cDogTG9jYWxDb2xsZWN0aW9uLl9tYWtlTG9va3VwRnVuY3Rpb24oc3BlY1tpXSksXG4gICAgICAgICAgYXNjZW5kaW5nOiB0cnVlXG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc29ydFNwZWNQYXJ0cy5wdXNoKHtcbiAgICAgICAgICBsb29rdXA6IExvY2FsQ29sbGVjdGlvbi5fbWFrZUxvb2t1cEZ1bmN0aW9uKHNwZWNbaV1bMF0pLFxuICAgICAgICAgIGFzY2VuZGluZzogc3BlY1tpXVsxXSAhPT0gXCJkZXNjXCJcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2UgaWYgKHR5cGVvZiBzcGVjID09PSBcIm9iamVjdFwiKSB7XG4gICAgZm9yICh2YXIga2V5IGluIHNwZWMpIHtcbiAgICAgIHNvcnRTcGVjUGFydHMucHVzaCh7XG4gICAgICAgIGxvb2t1cDogTG9jYWxDb2xsZWN0aW9uLl9tYWtlTG9va3VwRnVuY3Rpb24oa2V5KSxcbiAgICAgICAgYXNjZW5kaW5nOiBzcGVjW2tleV0gPj0gMFxuICAgICAgfSk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHRocm93IEVycm9yKFwiQmFkIHNvcnQgc3BlY2lmaWNhdGlvbjogXCIsIEpTT04uc3RyaW5naWZ5KHNwZWMpKTtcbiAgfVxuXG4gIGlmIChzb3J0U3BlY1BhcnRzLmxlbmd0aCA9PT0gMClcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge3JldHVybiAwO307XG5cbiAgLy8gcmVkdWNlVmFsdWUgdGFrZXMgaW4gYWxsIHRoZSBwb3NzaWJsZSB2YWx1ZXMgZm9yIHRoZSBzb3J0IGtleSBhbG9uZyB2YXJpb3VzXG4gIC8vIGJyYW5jaGVzLCBhbmQgcmV0dXJucyB0aGUgbWluIG9yIG1heCB2YWx1ZSAoYWNjb3JkaW5nIHRvIHRoZSBib29sXG4gIC8vIGZpbmRNaW4pLiBFYWNoIHZhbHVlIGNhbiBpdHNlbGYgYmUgYW4gYXJyYXksIGFuZCB3ZSBsb29rIGF0IGl0cyB2YWx1ZXNcbiAgLy8gdG9vLiAoaWUsIHdlIGRvIGEgc2luZ2xlIGxldmVsIG9mIGZsYXR0ZW5pbmcgb24gYnJhbmNoVmFsdWVzLCB0aGVuIGZpbmQgdGhlXG4gIC8vIG1pbi9tYXguKVxuICB2YXIgcmVkdWNlVmFsdWUgPSBmdW5jdGlvbiAoYnJhbmNoVmFsdWVzLCBmaW5kTWluKSB7XG4gICAgdmFyIHJlZHVjZWQ7XG4gICAgdmFyIGZpcnN0ID0gdHJ1ZTtcbiAgICAvLyBJdGVyYXRlIG92ZXIgYWxsIHRoZSB2YWx1ZXMgZm91bmQgaW4gYWxsIHRoZSBicmFuY2hlcywgYW5kIGlmIGEgdmFsdWUgaXNcbiAgICAvLyBhbiBhcnJheSBpdHNlbGYsIGl0ZXJhdGUgb3ZlciB0aGUgdmFsdWVzIGluIHRoZSBhcnJheSBzZXBhcmF0ZWx5LlxuICAgIF8uZWFjaChicmFuY2hWYWx1ZXMsIGZ1bmN0aW9uIChicmFuY2hWYWx1ZSkge1xuICAgICAgLy8gVmFsdWUgbm90IGFuIGFycmF5PyBQcmV0ZW5kIGl0IGlzLlxuICAgICAgaWYgKCFpc0FycmF5KGJyYW5jaFZhbHVlKSlcbiAgICAgICAgYnJhbmNoVmFsdWUgPSBbYnJhbmNoVmFsdWVdO1xuICAgICAgLy8gVmFsdWUgaXMgYW4gZW1wdHkgYXJyYXk/IFByZXRlbmQgaXQgd2FzIG1pc3NpbmcsIHNpbmNlIHRoYXQncyB3aGVyZSBpdFxuICAgICAgLy8gc2hvdWxkIGJlIHNvcnRlZC5cbiAgICAgIGlmIChpc0FycmF5KGJyYW5jaFZhbHVlKSAmJiBicmFuY2hWYWx1ZS5sZW5ndGggPT09IDApXG4gICAgICAgIGJyYW5jaFZhbHVlID0gW3VuZGVmaW5lZF07XG4gICAgICBfLmVhY2goYnJhbmNoVmFsdWUsIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAvLyBXZSBzaG91bGQgZ2V0IGhlcmUgYXQgbGVhc3Qgb25jZTogbG9va3VwIGZ1bmN0aW9ucyByZXR1cm4gbm9uLWVtcHR5XG4gICAgICAgIC8vIGFycmF5cywgc28gdGhlIG91dGVyIGxvb3AgcnVucyBhdCBsZWFzdCBvbmNlLCBhbmQgd2UgcHJldmVudGVkXG4gICAgICAgIC8vIGJyYW5jaFZhbHVlIGZyb20gYmVpbmcgYW4gZW1wdHkgYXJyYXkuXG4gICAgICAgIGlmIChmaXJzdCkge1xuICAgICAgICAgIHJlZHVjZWQgPSB2YWx1ZTtcbiAgICAgICAgICBmaXJzdCA9IGZhbHNlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIENvbXBhcmUgdGhlIHZhbHVlIHdlIGZvdW5kIHRvIHRoZSB2YWx1ZSB3ZSBmb3VuZCBzbyBmYXIsIHNhdmluZyBpdFxuICAgICAgICAgIC8vIGlmIGl0J3MgbGVzcyAoZm9yIGFuIGFzY2VuZGluZyBzb3J0KSBvciBtb3JlIChmb3IgYSBkZXNjZW5kaW5nXG4gICAgICAgICAgLy8gc29ydCkuXG4gICAgICAgICAgdmFyIGNtcCA9IExvY2FsQ29sbGVjdGlvbi5fZi5fY21wKHJlZHVjZWQsIHZhbHVlKTtcbiAgICAgICAgICBpZiAoKGZpbmRNaW4gJiYgY21wID4gMCkgfHwgKCFmaW5kTWluICYmIGNtcCA8IDApKVxuICAgICAgICAgICAgcmVkdWNlZCA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICByZXR1cm4gcmVkdWNlZDtcbiAgfTtcblxuICByZXR1cm4gZnVuY3Rpb24gKGEsIGIpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNvcnRTcGVjUGFydHMubGVuZ3RoOyArK2kpIHtcbiAgICAgIHZhciBzcGVjUGFydCA9IHNvcnRTcGVjUGFydHNbaV07XG4gICAgICB2YXIgYVZhbHVlID0gcmVkdWNlVmFsdWUoc3BlY1BhcnQubG9va3VwKGEpLCBzcGVjUGFydC5hc2NlbmRpbmcpO1xuICAgICAgdmFyIGJWYWx1ZSA9IHJlZHVjZVZhbHVlKHNwZWNQYXJ0Lmxvb2t1cChiKSwgc3BlY1BhcnQuYXNjZW5kaW5nKTtcbiAgICAgIHZhciBjb21wYXJlID0gTG9jYWxDb2xsZWN0aW9uLl9mLl9jbXAoYVZhbHVlLCBiVmFsdWUpO1xuICAgICAgaWYgKGNvbXBhcmUgIT09IDApXG4gICAgICAgIHJldHVybiBzcGVjUGFydC5hc2NlbmRpbmcgPyBjb21wYXJlIDogLWNvbXBhcmU7XG4gICAgfTtcbiAgICByZXR1cm4gMDtcbiAgfTtcbn07XG5cbmV4cG9ydHMuY29tcGlsZURvY3VtZW50U2VsZWN0b3IgPSBjb21waWxlRG9jdW1lbnRTZWxlY3RvcjtcbmV4cG9ydHMuY29tcGlsZVNvcnQgPSBMb2NhbENvbGxlY3Rpb24uX2NvbXBpbGVTb3J0OyIsIkVKU09OID0ge307IC8vIEdsb2JhbCFcbnZhciBjdXN0b21UeXBlcyA9IHt9O1xuLy8gQWRkIGEgY3VzdG9tIHR5cGUsIHVzaW5nIGEgbWV0aG9kIG9mIHlvdXIgY2hvaWNlIHRvIGdldCB0byBhbmRcbi8vIGZyb20gYSBiYXNpYyBKU09OLWFibGUgcmVwcmVzZW50YXRpb24uICBUaGUgZmFjdG9yeSBhcmd1bWVudFxuLy8gaXMgYSBmdW5jdGlvbiBvZiBKU09OLWFibGUgLS0+IHlvdXIgb2JqZWN0XG4vLyBUaGUgdHlwZSB5b3UgYWRkIG11c3QgaGF2ZTpcbi8vIC0gQSBjbG9uZSgpIG1ldGhvZCwgc28gdGhhdCBNZXRlb3IgY2FuIGRlZXAtY29weSBpdCB3aGVuIG5lY2Vzc2FyeS5cbi8vIC0gQSBlcXVhbHMoKSBtZXRob2QsIHNvIHRoYXQgTWV0ZW9yIGNhbiBjb21wYXJlIGl0XG4vLyAtIEEgdG9KU09OVmFsdWUoKSBtZXRob2QsIHNvIHRoYXQgTWV0ZW9yIGNhbiBzZXJpYWxpemUgaXRcbi8vIC0gYSB0eXBlTmFtZSgpIG1ldGhvZCwgdG8gc2hvdyBob3cgdG8gbG9vayBpdCB1cCBpbiBvdXIgdHlwZSB0YWJsZS5cbi8vIEl0IGlzIG9rYXkgaWYgdGhlc2UgbWV0aG9kcyBhcmUgbW9ua2V5LXBhdGNoZWQgb24uXG5FSlNPTi5hZGRUeXBlID0gZnVuY3Rpb24gKG5hbWUsIGZhY3RvcnkpIHtcbiAgaWYgKF8uaGFzKGN1c3RvbVR5cGVzLCBuYW1lKSlcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJUeXBlIFwiICsgbmFtZSArIFwiIGFscmVhZHkgcHJlc2VudFwiKTtcbiAgY3VzdG9tVHlwZXNbbmFtZV0gPSBmYWN0b3J5O1xufTtcblxudmFyIGJ1aWx0aW5Db252ZXJ0ZXJzID0gW1xuICB7IC8vIERhdGVcbiAgICBtYXRjaEpTT05WYWx1ZTogZnVuY3Rpb24gKG9iaikge1xuICAgICAgcmV0dXJuIF8uaGFzKG9iaiwgJyRkYXRlJykgJiYgXy5zaXplKG9iaikgPT09IDE7XG4gICAgfSxcbiAgICBtYXRjaE9iamVjdDogZnVuY3Rpb24gKG9iaikge1xuICAgICAgcmV0dXJuIG9iaiBpbnN0YW5jZW9mIERhdGU7XG4gICAgfSxcbiAgICB0b0pTT05WYWx1ZTogZnVuY3Rpb24gKG9iaikge1xuICAgICAgcmV0dXJuIHskZGF0ZTogb2JqLmdldFRpbWUoKX07XG4gICAgfSxcbiAgICBmcm9tSlNPTlZhbHVlOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICByZXR1cm4gbmV3IERhdGUob2JqLiRkYXRlKTtcbiAgICB9XG4gIH0sXG4gIHsgLy8gQmluYXJ5XG4gICAgbWF0Y2hKU09OVmFsdWU6IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgIHJldHVybiBfLmhhcyhvYmosICckYmluYXJ5JykgJiYgXy5zaXplKG9iaikgPT09IDE7XG4gICAgfSxcbiAgICBtYXRjaE9iamVjdDogZnVuY3Rpb24gKG9iaikge1xuICAgICAgcmV0dXJuIHR5cGVvZiBVaW50OEFycmF5ICE9PSAndW5kZWZpbmVkJyAmJiBvYmogaW5zdGFuY2VvZiBVaW50OEFycmF5XG4gICAgICAgIHx8IChvYmogJiYgXy5oYXMob2JqLCAnJFVpbnQ4QXJyYXlQb2x5ZmlsbCcpKTtcbiAgICB9LFxuICAgIHRvSlNPTlZhbHVlOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICByZXR1cm4geyRiaW5hcnk6IEVKU09OLl9iYXNlNjRFbmNvZGUob2JqKX07XG4gICAgfSxcbiAgICBmcm9tSlNPTlZhbHVlOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICByZXR1cm4gRUpTT04uX2Jhc2U2NERlY29kZShvYmouJGJpbmFyeSk7XG4gICAgfVxuICB9LFxuICB7IC8vIEVzY2FwaW5nIG9uZSBsZXZlbFxuICAgIG1hdGNoSlNPTlZhbHVlOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICByZXR1cm4gXy5oYXMob2JqLCAnJGVzY2FwZScpICYmIF8uc2l6ZShvYmopID09PSAxO1xuICAgIH0sXG4gICAgbWF0Y2hPYmplY3Q6IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgIGlmIChfLmlzRW1wdHkob2JqKSB8fCBfLnNpemUob2JqKSA+IDIpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIF8uYW55KGJ1aWx0aW5Db252ZXJ0ZXJzLCBmdW5jdGlvbiAoY29udmVydGVyKSB7XG4gICAgICAgIHJldHVybiBjb252ZXJ0ZXIubWF0Y2hKU09OVmFsdWUob2JqKTtcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgdG9KU09OVmFsdWU6IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgIHZhciBuZXdPYmogPSB7fTtcbiAgICAgIF8uZWFjaChvYmosIGZ1bmN0aW9uICh2YWx1ZSwga2V5KSB7XG4gICAgICAgIG5ld09ialtrZXldID0gRUpTT04udG9KU09OVmFsdWUodmFsdWUpO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4geyRlc2NhcGU6IG5ld09ian07XG4gICAgfSxcbiAgICBmcm9tSlNPTlZhbHVlOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICB2YXIgbmV3T2JqID0ge307XG4gICAgICBfLmVhY2gob2JqLiRlc2NhcGUsIGZ1bmN0aW9uICh2YWx1ZSwga2V5KSB7XG4gICAgICAgIG5ld09ialtrZXldID0gRUpTT04uZnJvbUpTT05WYWx1ZSh2YWx1ZSk7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBuZXdPYmo7XG4gICAgfVxuICB9LFxuICB7IC8vIEN1c3RvbVxuICAgIG1hdGNoSlNPTlZhbHVlOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICByZXR1cm4gXy5oYXMob2JqLCAnJHR5cGUnKSAmJiBfLmhhcyhvYmosICckdmFsdWUnKSAmJiBfLnNpemUob2JqKSA9PT0gMjtcbiAgICB9LFxuICAgIG1hdGNoT2JqZWN0OiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICByZXR1cm4gRUpTT04uX2lzQ3VzdG9tVHlwZShvYmopO1xuICAgIH0sXG4gICAgdG9KU09OVmFsdWU6IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgIHJldHVybiB7JHR5cGU6IG9iai50eXBlTmFtZSgpLCAkdmFsdWU6IG9iai50b0pTT05WYWx1ZSgpfTtcbiAgICB9LFxuICAgIGZyb21KU09OVmFsdWU6IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgIHZhciB0eXBlTmFtZSA9IG9iai4kdHlwZTtcbiAgICAgIHZhciBjb252ZXJ0ZXIgPSBjdXN0b21UeXBlc1t0eXBlTmFtZV07XG4gICAgICByZXR1cm4gY29udmVydGVyKG9iai4kdmFsdWUpO1xuICAgIH1cbiAgfVxuXTtcblxuRUpTT04uX2lzQ3VzdG9tVHlwZSA9IGZ1bmN0aW9uIChvYmopIHtcbiAgcmV0dXJuIG9iaiAmJlxuICAgIHR5cGVvZiBvYmoudG9KU09OVmFsdWUgPT09ICdmdW5jdGlvbicgJiZcbiAgICB0eXBlb2Ygb2JqLnR5cGVOYW1lID09PSAnZnVuY3Rpb24nICYmXG4gICAgXy5oYXMoY3VzdG9tVHlwZXMsIG9iai50eXBlTmFtZSgpKTtcbn07XG5cblxuLy9mb3IgYm90aCBhcnJheXMgYW5kIG9iamVjdHMsIGluLXBsYWNlIG1vZGlmaWNhdGlvbi5cbnZhciBhZGp1c3RUeXBlc1RvSlNPTlZhbHVlID1cbkVKU09OLl9hZGp1c3RUeXBlc1RvSlNPTlZhbHVlID0gZnVuY3Rpb24gKG9iaikge1xuICBpZiAob2JqID09PSBudWxsKVxuICAgIHJldHVybiBudWxsO1xuICB2YXIgbWF5YmVDaGFuZ2VkID0gdG9KU09OVmFsdWVIZWxwZXIob2JqKTtcbiAgaWYgKG1heWJlQ2hhbmdlZCAhPT0gdW5kZWZpbmVkKVxuICAgIHJldHVybiBtYXliZUNoYW5nZWQ7XG4gIF8uZWFjaChvYmosIGZ1bmN0aW9uICh2YWx1ZSwga2V5KSB7XG4gICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ29iamVjdCcgJiYgdmFsdWUgIT09IHVuZGVmaW5lZClcbiAgICAgIHJldHVybjsgLy8gY29udGludWVcbiAgICB2YXIgY2hhbmdlZCA9IHRvSlNPTlZhbHVlSGVscGVyKHZhbHVlKTtcbiAgICBpZiAoY2hhbmdlZCkge1xuICAgICAgb2JqW2tleV0gPSBjaGFuZ2VkO1xuICAgICAgcmV0dXJuOyAvLyBvbiB0byB0aGUgbmV4dCBrZXlcbiAgICB9XG4gICAgLy8gaWYgd2UgZ2V0IGhlcmUsIHZhbHVlIGlzIGFuIG9iamVjdCBidXQgbm90IGFkanVzdGFibGVcbiAgICAvLyBhdCB0aGlzIGxldmVsLiAgcmVjdXJzZS5cbiAgICBhZGp1c3RUeXBlc1RvSlNPTlZhbHVlKHZhbHVlKTtcbiAgfSk7XG4gIHJldHVybiBvYmo7XG59O1xuXG4vLyBFaXRoZXIgcmV0dXJuIHRoZSBKU09OLWNvbXBhdGlibGUgdmVyc2lvbiBvZiB0aGUgYXJndW1lbnQsIG9yIHVuZGVmaW5lZCAoaWZcbi8vIHRoZSBpdGVtIGlzbid0IGl0c2VsZiByZXBsYWNlYWJsZSwgYnV0IG1heWJlIHNvbWUgZmllbGRzIGluIGl0IGFyZSlcbnZhciB0b0pTT05WYWx1ZUhlbHBlciA9IGZ1bmN0aW9uIChpdGVtKSB7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYnVpbHRpbkNvbnZlcnRlcnMubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgY29udmVydGVyID0gYnVpbHRpbkNvbnZlcnRlcnNbaV07XG4gICAgaWYgKGNvbnZlcnRlci5tYXRjaE9iamVjdChpdGVtKSkge1xuICAgICAgcmV0dXJuIGNvbnZlcnRlci50b0pTT05WYWx1ZShpdGVtKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHVuZGVmaW5lZDtcbn07XG5cbkVKU09OLnRvSlNPTlZhbHVlID0gZnVuY3Rpb24gKGl0ZW0pIHtcbiAgdmFyIGNoYW5nZWQgPSB0b0pTT05WYWx1ZUhlbHBlcihpdGVtKTtcbiAgaWYgKGNoYW5nZWQgIT09IHVuZGVmaW5lZClcbiAgICByZXR1cm4gY2hhbmdlZDtcbiAgaWYgKHR5cGVvZiBpdGVtID09PSAnb2JqZWN0Jykge1xuICAgIGl0ZW0gPSBFSlNPTi5jbG9uZShpdGVtKTtcbiAgICBhZGp1c3RUeXBlc1RvSlNPTlZhbHVlKGl0ZW0pO1xuICB9XG4gIHJldHVybiBpdGVtO1xufTtcblxuLy9mb3IgYm90aCBhcnJheXMgYW5kIG9iamVjdHMuIFRyaWVzIGl0cyBiZXN0IHRvIGp1c3Rcbi8vIHVzZSB0aGUgb2JqZWN0IHlvdSBoYW5kIGl0LCBidXQgbWF5IHJldHVybiBzb21ldGhpbmdcbi8vIGRpZmZlcmVudCBpZiB0aGUgb2JqZWN0IHlvdSBoYW5kIGl0IGl0c2VsZiBuZWVkcyBjaGFuZ2luZy5cbnZhciBhZGp1c3RUeXBlc0Zyb21KU09OVmFsdWUgPVxuRUpTT04uX2FkanVzdFR5cGVzRnJvbUpTT05WYWx1ZSA9IGZ1bmN0aW9uIChvYmopIHtcbiAgaWYgKG9iaiA9PT0gbnVsbClcbiAgICByZXR1cm4gbnVsbDtcbiAgdmFyIG1heWJlQ2hhbmdlZCA9IGZyb21KU09OVmFsdWVIZWxwZXIob2JqKTtcbiAgaWYgKG1heWJlQ2hhbmdlZCAhPT0gb2JqKVxuICAgIHJldHVybiBtYXliZUNoYW5nZWQ7XG4gIF8uZWFjaChvYmosIGZ1bmN0aW9uICh2YWx1ZSwga2V5KSB7XG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgIHZhciBjaGFuZ2VkID0gZnJvbUpTT05WYWx1ZUhlbHBlcih2YWx1ZSk7XG4gICAgICBpZiAodmFsdWUgIT09IGNoYW5nZWQpIHtcbiAgICAgICAgb2JqW2tleV0gPSBjaGFuZ2VkO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICAvLyBpZiB3ZSBnZXQgaGVyZSwgdmFsdWUgaXMgYW4gb2JqZWN0IGJ1dCBub3QgYWRqdXN0YWJsZVxuICAgICAgLy8gYXQgdGhpcyBsZXZlbC4gIHJlY3Vyc2UuXG4gICAgICBhZGp1c3RUeXBlc0Zyb21KU09OVmFsdWUodmFsdWUpO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiBvYmo7XG59O1xuXG4vLyBFaXRoZXIgcmV0dXJuIHRoZSBhcmd1bWVudCBjaGFuZ2VkIHRvIGhhdmUgdGhlIG5vbi1qc29uXG4vLyByZXAgb2YgaXRzZWxmICh0aGUgT2JqZWN0IHZlcnNpb24pIG9yIHRoZSBhcmd1bWVudCBpdHNlbGYuXG5cbi8vIERPRVMgTk9UIFJFQ1VSU0UuICBGb3IgYWN0dWFsbHkgZ2V0dGluZyB0aGUgZnVsbHktY2hhbmdlZCB2YWx1ZSwgdXNlXG4vLyBFSlNPTi5mcm9tSlNPTlZhbHVlXG52YXIgZnJvbUpTT05WYWx1ZUhlbHBlciA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICBpZiAodHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiB2YWx1ZSAhPT0gbnVsbCkge1xuICAgIGlmIChfLnNpemUodmFsdWUpIDw9IDJcbiAgICAgICAgJiYgXy5hbGwodmFsdWUsIGZ1bmN0aW9uICh2LCBrKSB7XG4gICAgICAgICAgcmV0dXJuIHR5cGVvZiBrID09PSAnc3RyaW5nJyAmJiBrLnN1YnN0cigwLCAxKSA9PT0gJyQnO1xuICAgICAgICB9KSkge1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBidWlsdGluQ29udmVydGVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgY29udmVydGVyID0gYnVpbHRpbkNvbnZlcnRlcnNbaV07XG4gICAgICAgIGlmIChjb252ZXJ0ZXIubWF0Y2hKU09OVmFsdWUodmFsdWUpKSB7XG4gICAgICAgICAgcmV0dXJuIGNvbnZlcnRlci5mcm9tSlNPTlZhbHVlKHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gdmFsdWU7XG59O1xuXG5FSlNPTi5mcm9tSlNPTlZhbHVlID0gZnVuY3Rpb24gKGl0ZW0pIHtcbiAgdmFyIGNoYW5nZWQgPSBmcm9tSlNPTlZhbHVlSGVscGVyKGl0ZW0pO1xuICBpZiAoY2hhbmdlZCA9PT0gaXRlbSAmJiB0eXBlb2YgaXRlbSA9PT0gJ29iamVjdCcpIHtcbiAgICBpdGVtID0gRUpTT04uY2xvbmUoaXRlbSk7XG4gICAgYWRqdXN0VHlwZXNGcm9tSlNPTlZhbHVlKGl0ZW0pO1xuICAgIHJldHVybiBpdGVtO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBjaGFuZ2VkO1xuICB9XG59O1xuXG5FSlNPTi5zdHJpbmdpZnkgPSBmdW5jdGlvbiAoaXRlbSkge1xuICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoRUpTT04udG9KU09OVmFsdWUoaXRlbSkpO1xufTtcblxuRUpTT04ucGFyc2UgPSBmdW5jdGlvbiAoaXRlbSkge1xuICByZXR1cm4gRUpTT04uZnJvbUpTT05WYWx1ZShKU09OLnBhcnNlKGl0ZW0pKTtcbn07XG5cbkVKU09OLmlzQmluYXJ5ID0gZnVuY3Rpb24gKG9iaikge1xuICByZXR1cm4gKHR5cGVvZiBVaW50OEFycmF5ICE9PSAndW5kZWZpbmVkJyAmJiBvYmogaW5zdGFuY2VvZiBVaW50OEFycmF5KSB8fFxuICAgIChvYmogJiYgb2JqLiRVaW50OEFycmF5UG9seWZpbGwpO1xufTtcblxuRUpTT04uZXF1YWxzID0gZnVuY3Rpb24gKGEsIGIsIG9wdGlvbnMpIHtcbiAgdmFyIGk7XG4gIHZhciBrZXlPcmRlclNlbnNpdGl2ZSA9ICEhKG9wdGlvbnMgJiYgb3B0aW9ucy5rZXlPcmRlclNlbnNpdGl2ZSk7XG4gIGlmIChhID09PSBiKVxuICAgIHJldHVybiB0cnVlO1xuICBpZiAoIWEgfHwgIWIpIC8vIGlmIGVpdGhlciBvbmUgaXMgZmFsc3ksIHRoZXknZCBoYXZlIHRvIGJlID09PSB0byBiZSBlcXVhbFxuICAgIHJldHVybiBmYWxzZTtcbiAgaWYgKCEodHlwZW9mIGEgPT09ICdvYmplY3QnICYmIHR5cGVvZiBiID09PSAnb2JqZWN0JykpXG4gICAgcmV0dXJuIGZhbHNlO1xuICBpZiAoYSBpbnN0YW5jZW9mIERhdGUgJiYgYiBpbnN0YW5jZW9mIERhdGUpXG4gICAgcmV0dXJuIGEudmFsdWVPZigpID09PSBiLnZhbHVlT2YoKTtcbiAgaWYgKEVKU09OLmlzQmluYXJ5KGEpICYmIEVKU09OLmlzQmluYXJ5KGIpKSB7XG4gICAgaWYgKGEubGVuZ3RoICE9PSBiLmxlbmd0aClcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgYS5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKGFbaV0gIT09IGJbaV0pXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgaWYgKHR5cGVvZiAoYS5lcXVhbHMpID09PSAnZnVuY3Rpb24nKVxuICAgIHJldHVybiBhLmVxdWFscyhiLCBvcHRpb25zKTtcbiAgaWYgKGEgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgIGlmICghKGIgaW5zdGFuY2VvZiBBcnJheSkpXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgaWYgKGEubGVuZ3RoICE9PSBiLmxlbmd0aClcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgYS5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKCFFSlNPTi5lcXVhbHMoYVtpXSwgYltpXSwgb3B0aW9ucykpXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgLy8gZmFsbCBiYWNrIHRvIHN0cnVjdHVyYWwgZXF1YWxpdHkgb2Ygb2JqZWN0c1xuICB2YXIgcmV0O1xuICBpZiAoa2V5T3JkZXJTZW5zaXRpdmUpIHtcbiAgICB2YXIgYktleXMgPSBbXTtcbiAgICBfLmVhY2goYiwgZnVuY3Rpb24gKHZhbCwgeCkge1xuICAgICAgICBiS2V5cy5wdXNoKHgpO1xuICAgIH0pO1xuICAgIGkgPSAwO1xuICAgIHJldCA9IF8uYWxsKGEsIGZ1bmN0aW9uICh2YWwsIHgpIHtcbiAgICAgIGlmIChpID49IGJLZXlzLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBpZiAoeCAhPT0gYktleXNbaV0pIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgaWYgKCFFSlNPTi5lcXVhbHModmFsLCBiW2JLZXlzW2ldXSwgb3B0aW9ucykpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgaSsrO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSk7XG4gICAgcmV0dXJuIHJldCAmJiBpID09PSBiS2V5cy5sZW5ndGg7XG4gIH0gZWxzZSB7XG4gICAgaSA9IDA7XG4gICAgcmV0ID0gXy5hbGwoYSwgZnVuY3Rpb24gKHZhbCwga2V5KSB7XG4gICAgICBpZiAoIV8uaGFzKGIsIGtleSkpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgaWYgKCFFSlNPTi5lcXVhbHModmFsLCBiW2tleV0sIG9wdGlvbnMpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGkrKztcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0pO1xuICAgIHJldHVybiByZXQgJiYgXy5zaXplKGIpID09PSBpO1xuICB9XG59O1xuXG5FSlNPTi5jbG9uZSA9IGZ1bmN0aW9uICh2KSB7XG4gIHZhciByZXQ7XG4gIGlmICh0eXBlb2YgdiAhPT0gXCJvYmplY3RcIilcbiAgICByZXR1cm4gdjtcbiAgaWYgKHYgPT09IG51bGwpXG4gICAgcmV0dXJuIG51bGw7IC8vIG51bGwgaGFzIHR5cGVvZiBcIm9iamVjdFwiXG4gIGlmICh2IGluc3RhbmNlb2YgRGF0ZSlcbiAgICByZXR1cm4gbmV3IERhdGUodi5nZXRUaW1lKCkpO1xuICBpZiAoRUpTT04uaXNCaW5hcnkodikpIHtcbiAgICByZXQgPSBFSlNPTi5uZXdCaW5hcnkodi5sZW5ndGgpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdi5sZW5ndGg7IGkrKykge1xuICAgICAgcmV0W2ldID0gdltpXTtcbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbiAgfVxuICBpZiAoXy5pc0FycmF5KHYpIHx8IF8uaXNBcmd1bWVudHModikpIHtcbiAgICAvLyBGb3Igc29tZSByZWFzb24sIF8ubWFwIGRvZXNuJ3Qgd29yayBpbiB0aGlzIGNvbnRleHQgb24gT3BlcmEgKHdlaXJkIHRlc3RcbiAgICAvLyBmYWlsdXJlcykuXG4gICAgcmV0ID0gW107XG4gICAgZm9yIChpID0gMDsgaSA8IHYubGVuZ3RoOyBpKyspXG4gICAgICByZXRbaV0gPSBFSlNPTi5jbG9uZSh2W2ldKTtcbiAgICByZXR1cm4gcmV0O1xuICB9XG4gIC8vIGhhbmRsZSBnZW5lcmFsIHVzZXItZGVmaW5lZCB0eXBlZCBPYmplY3RzIGlmIHRoZXkgaGF2ZSBhIGNsb25lIG1ldGhvZFxuICBpZiAodHlwZW9mIHYuY2xvbmUgPT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gdi5jbG9uZSgpO1xuICB9XG4gIC8vIGhhbmRsZSBvdGhlciBvYmplY3RzXG4gIHJldCA9IHt9O1xuICBfLmVhY2godiwgZnVuY3Rpb24gKHZhbHVlLCBrZXkpIHtcbiAgICByZXRba2V5XSA9IEVKU09OLmNsb25lKHZhbHVlKTtcbiAgfSk7XG4gIHJldHVybiByZXQ7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEVKU09OOyJdfQ==
;