;(function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
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


},{"../app/js/ItemTracker":2}],3:[function(require,module,exports){
(function() {
  var GeoJSON, assert;

  assert = chai.assert;

  GeoJSON = require("../app/js/GeoJSON");

  describe('GeoJSON', function() {
    return it('returns a proper polygon', function() {
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
  });

}).call(this);


},{"../app/js/GeoJSON":4}],5:[function(require,module,exports){
(function() {
  var LocationView, MockLocationFinder, UIDriver, assert;

  assert = chai.assert;

  LocationView = require('../app/js/LocationView');

  UIDriver = require('./helpers/UIDriver');

  MockLocationFinder = (function() {
    function MockLocationFinder(success, error) {
      this.success = success;
      this.error = error;
    }

    MockLocationFinder.prototype.getLocation = function() {};

    MockLocationFinder.prototype.startWatch = function() {};

    MockLocationFinder.prototype.stopWatch = function() {};

    return MockLocationFinder;

  })();

  describe('LocationView', function() {
    return context('With no set location', function() {
      beforeEach(function() {
        this.locationFinder = new MockLocationFinder();
        this.locationView = new LocationView({
          loc: null,
          locationFinderClass: this.locationFinder
        });
        return this.ui = new UIDriver(this.locationView.el);
      });
      it('displays Unspecified', function() {
        return assert.include(this.ui.text(), 'Unspecified');
      });
      it('disables map', function() {
        return assert.isTrue(this.ui.getDisabled("Map"));
      });
      return it('allows setting location');
    });
  });

}).call(this);


},{"../app/js/LocationView":6,"./helpers/UIDriver":7}],8:[function(require,module,exports){
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
    it("does not add removed", function(done) {
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
    it("retains items", function(done) {
      var _this = this;
      return this.db.test.upsert({
        _id: 1,
        a: "Alice"
      }, function() {
        var db2;
        db2 = new LocalDb('test');
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
        db2 = new LocalDb('test');
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
          db2 = new LocalDb('test');
          db2.addCollection('test');
          return db2.test.pendingRemoves(function(removes) {
            assert.deepEqual(removes, [1]);
            return done();
          });
        });
      });
    });
  });

}).call(this);


},{"../app/js/db/LocalDb":9,"./db_queries":10}],2:[function(require,module,exports){
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


},{}],4:[function(require,module,exports){
(function() {
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

}).call(this);


},{}],7:[function(require,module,exports){
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


},{}],10:[function(require,module,exports){
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


},{"../app/js/GeoJSON":4}],6:[function(require,module,exports){
(function() {
  var LocationFinder, LocationView,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  LocationFinder = require('./LocationFinder');

  LocationView = (function(_super) {
    __extends(LocationView, _super);

    function LocationView(options) {
      LocationView.__super__.constructor.call(this);
      this.loc = options.loc;
      this.setLocation = options.setLocation;
      this.locationFinder = new (options.locationFinderClass || LocationFinder)(this.locationSuccess, this.locationError);
      if (this.loc || this.setLocation) {
        this.locationFinder.startWatch();
      }
      this.render();
    }

    LocationView.prototype.render = function() {
      this.$el.html(templates['LocationView']());
      if (!this.loc && !this.setLocation) {
        return this.$("#location_relative").text("Unspecified location");
      } else if (this.setLocation) {
        return this.$("#location_relative").text("Setting location...");
      } else {

      }
    };

    return LocationView;

  })(Backbone.View);

  module.exports = LocationView;

}).call(this);


},{"./LocationFinder":11}],9:[function(require,module,exports){
(function() {
  var Collection, GeoJSON, LocalDb, compileDocumentSelector, compileSort, createUid, processGeoIntersectsOperator, processNearOperator;

  compileDocumentSelector = require('./selector').compileDocumentSelector;

  compileSort = require('./selector').compileSort;

  GeoJSON = require('../GeoJSON');

  LocalDb = (function() {
    function LocalDb(name) {
      this.name = name;
    }

    LocalDb.prototype.addCollection = function(name) {
      var dbName, namespace;
      dbName = this.name;
      namespace = "db." + dbName + "." + name + ".";
      return this[name] = new Collection(namespace);
    };

    LocalDb.prototype.removeCollection = function(name) {
      var dbName, i, key, keys, namespace, _i, _j, _len, _ref;
      dbName = this.name;
      namespace = "db." + dbName + "." + name + ".";
      if (window.localStorage) {
        keys = [];
        for (i = _i = 0, _ref = localStorage.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
          keys.push(localStorage.key(i));
        }
        for (_j = 0, _len = keys.length; _j < _len; _j++) {
          key = keys[_j];
          if (key.substring(0, namespace.length) === namespace) {
            localStorage.removeItem(key);
          }
        }
      }
      return delete this[name];
    };

    return LocalDb;

  })();

  Collection = (function() {
    function Collection(namespace) {
      this.namespace = namespace;
      this.items = {};
      this.upserts = {};
      this.removes = {};
      if (window.localStorage) {
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
      return localStorage[this.itemNamespace + doc._id] = JSON.stringify(doc);
    };

    Collection.prototype._deleteItem = function(id) {
      return delete this.items[id];
    };

    Collection.prototype._putUpsert = function(doc) {
      this.upserts[doc._id] = doc;
      return localStorage[this.namespace + "upserts"] = JSON.stringify(_.keys(this.upserts));
    };

    Collection.prototype._deleteUpsert = function(id) {
      delete this.upserts[id];
      return localStorage[this.namespace + "upserts"] = JSON.stringify(_.keys(this.upserts));
    };

    Collection.prototype._putRemove = function(doc) {
      this.removes[doc._id] = doc;
      return localStorage[this.namespace + "removes"] = JSON.stringify(_.values(this.removes));
    };

    Collection.prototype._deleteRemove = function(id) {
      delete this.removes[id];
      return localStorage[this.namespace + "removes"] = JSON.stringify(_.values(this.removes));
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
      if (value['$near']) {
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
      if (value['$geoIntersects']) {
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


},{"./selector":12,"../GeoJSON":4}],11:[function(require,module,exports){
(function() {
  var LocationFinder;

  LocationFinder = (function() {
    function LocationFinder(success, error) {
      this.success = success;
      this.error = error;
    }

    LocationFinder.prototype.getLocation = function() {
      var highAccuracy, highAccuracyFired, locationError, lowAccuracy,
        _this = this;
      locationError = _.after(2, function() {
        if (_this.error != null) {
          return _this.error();
        }
      });
      highAccuracyFired = false;
      lowAccuracy = function(pos) {
        if (!highAccuracyFired) {
          return _this.success(pos);
        }
      };
      highAccuracy = function(pos) {
        highAccuracyFired = true;
        return _this.success(pos);
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
      var error, highAccuracyFired, lowAccuracy, lowAccuracyFired, success,
        _this = this;
      if (this.locationWatchId != null) {
        return;
      }
      highAccuracyFired = false;
      lowAccuracyFired = false;
      lowAccuracy = function(pos) {
        if (!highAccuracyFired) {
          lowAccuracyFired = true;
          return _this.success(pos);
        }
      };
      navigator.geolocation.getCurrentPosition(lowAccuracy, null, {
        maximumAge: 3600 * 24,
        timeout: 10000,
        enableHighAccuracy: false
      });
      success = function(pos) {
        highAccuracyFired = true;
        return _this.success(pos);
      };
      error = function(error) {
        if (!lowAccuracyFired && !highAccuracyFired) {
          if (_this.error != null) {
            return _this.error(error);
          }
        }
      };
      return this.locationWatchId = navigator.geolocation.watchPosition(success, error, {
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


},{}],12:[function(require,module,exports){
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
},{"./EJSON":13}],13:[function(require,module,exports){
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
},{}]},{},[1,8,3,5])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL3Rlc3QvSXRlbVRyYWNrZXJUZXN0cy5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL3Rlc3QvR2VvSlNPTlRlc3RzLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvdGVzdC9Mb2NhdGlvblZpZXdUZXN0cy5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL3Rlc3QvTG9jYWxEYlRlc3RzLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL0l0ZW1UcmFja2VyLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL0dlb0pTT04uY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My90ZXN0L2hlbHBlcnMvVUlEcml2ZXIuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My90ZXN0L2RiX3F1ZXJpZXMuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvTG9jYXRpb25WaWV3LmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL2RiL0xvY2FsRGIuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvTG9jYXRpb25GaW5kZXIuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvZGIvc2VsZWN0b3IuanMiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9kYi9FSlNPTi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Q0FBQSxLQUFBLGFBQUE7O0NBQUEsQ0FBQSxDQUFTLENBQUksRUFBYjs7Q0FBQSxDQUNB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QUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeHNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzQ29udGVudCI6WyJhc3NlcnQgPSBjaGFpLmFzc2VydFxuSXRlbVRyYWNrZXIgPSByZXF1aXJlIFwiLi4vYXBwL2pzL0l0ZW1UcmFja2VyXCJcblxuZGVzY3JpYmUgJ0l0ZW1UcmFja2VyJywgLT5cbiAgYmVmb3JlRWFjaCAtPlxuICAgIEB0cmFja2VyID0gbmV3IEl0ZW1UcmFja2VyKClcblxuICBpdCBcInJlY29yZHMgYWRkc1wiLCAtPlxuICAgIGl0ZW1zID0gIFtcbiAgICAgIF9pZDogMSwgeDoxXG4gICAgICBfaWQ6IDIsIHg6MlxuICAgIF1cbiAgICBbYWRkcywgcmVtb3Zlc10gPSBAdHJhY2tlci51cGRhdGUoaXRlbXMpXG4gICAgYXNzZXJ0LmRlZXBFcXVhbCBhZGRzLCBpdGVtc1xuICAgIGFzc2VydC5kZWVwRXF1YWwgcmVtb3ZlcywgW11cblxuICBpdCBcInJlbWVtYmVycyBpdGVtc1wiLCAtPlxuICAgIGl0ZW1zID0gIFtcbiAgICAgIHtfaWQ6IDEsIHg6MX1cbiAgICAgIHtfaWQ6IDIsIHg6Mn1cbiAgICBdXG4gICAgW2FkZHMsIHJlbW92ZXNdID0gQHRyYWNrZXIudXBkYXRlKGl0ZW1zKVxuICAgIFthZGRzLCByZW1vdmVzXSA9IEB0cmFja2VyLnVwZGF0ZShpdGVtcylcbiAgICBhc3NlcnQuZGVlcEVxdWFsIGFkZHMsIFtdXG4gICAgYXNzZXJ0LmRlZXBFcXVhbCByZW1vdmVzLCBbXVxuXG4gIGl0IFwic2VlcyByZW1vdmVkIGl0ZW1zXCIsIC0+XG4gICAgaXRlbXMxID0gIFtcbiAgICAgIHtfaWQ6IDEsIHg6MX1cbiAgICAgIHtfaWQ6IDIsIHg6Mn1cbiAgICBdXG4gICAgaXRlbXMyID0gIFtcbiAgICAgIHtfaWQ6IDEsIHg6MX1cbiAgICBdXG4gICAgQHRyYWNrZXIudXBkYXRlKGl0ZW1zMSlcbiAgICBbYWRkcywgcmVtb3Zlc10gPSBAdHJhY2tlci51cGRhdGUoaXRlbXMyKVxuICAgIGFzc2VydC5kZWVwRXF1YWwgYWRkcywgW11cbiAgICBhc3NlcnQuZGVlcEVxdWFsIHJlbW92ZXMsIFt7X2lkOiAyLCB4OjJ9XVxuXG4gIGl0IFwic2VlcyByZW1vdmVkIGNoYW5nZXNcIiwgLT5cbiAgICBpdGVtczEgPSAgW1xuICAgICAge19pZDogMSwgeDoxfVxuICAgICAge19pZDogMiwgeDoyfVxuICAgIF1cbiAgICBpdGVtczIgPSAgW1xuICAgICAge19pZDogMSwgeDoxfVxuICAgICAge19pZDogMiwgeDo0fVxuICAgIF1cbiAgICBAdHJhY2tlci51cGRhdGUoaXRlbXMxKVxuICAgIFthZGRzLCByZW1vdmVzXSA9IEB0cmFja2VyLnVwZGF0ZShpdGVtczIpXG4gICAgYXNzZXJ0LmRlZXBFcXVhbCBhZGRzLCBbe19pZDogMiwgeDo0fV1cbiAgICBhc3NlcnQuZGVlcEVxdWFsIHJlbW92ZXMsIFt7X2lkOiAyLCB4OjJ9XVxuIiwiYXNzZXJ0ID0gY2hhaS5hc3NlcnRcbkdlb0pTT04gPSByZXF1aXJlIFwiLi4vYXBwL2pzL0dlb0pTT05cIlxuXG5kZXNjcmliZSAnR2VvSlNPTicsIC0+XG4gIGl0ICdyZXR1cm5zIGEgcHJvcGVyIHBvbHlnb24nLCAtPlxuICAgIHNvdXRoV2VzdCA9IG5ldyBMLkxhdExuZygxMCwgMjApXG4gICAgbm9ydGhFYXN0ID0gbmV3IEwuTGF0TG5nKDEzLCAyMylcbiAgICBib3VuZHMgPSBuZXcgTC5MYXRMbmdCb3VuZHMoc291dGhXZXN0LCBub3J0aEVhc3QpXG5cbiAgICBqc29uID0gR2VvSlNPTi5sYXRMbmdCb3VuZHNUb0dlb0pTT04oYm91bmRzKVxuICAgIGFzc2VydCBfLmlzRXF1YWwganNvbiwge1xuICAgICAgdHlwZTogXCJQb2x5Z29uXCIsXG4gICAgICBjb29yZGluYXRlczogW1xuICAgICAgICBbWzIwLDEwXSxbMjAsMTNdLFsyMywxM10sWzIzLDEwXV1cbiAgICAgIF1cbiAgICB9XG5cbiIsImFzc2VydCA9IGNoYWkuYXNzZXJ0XG5Mb2NhdGlvblZpZXcgPSByZXF1aXJlICcuLi9hcHAvanMvTG9jYXRpb25WaWV3J1xuVUlEcml2ZXIgPSByZXF1aXJlICcuL2hlbHBlcnMvVUlEcml2ZXInXG5cbmNsYXNzIE1vY2tMb2NhdGlvbkZpbmRlclxuICBjb25zdHJ1Y3RvcjogKHN1Y2Nlc3MsIGVycm9yKSAtPlxuICAgIEBzdWNjZXNzID0gc3VjY2Vzc1xuICAgIEBlcnJvciA9IGVycm9yXG5cbiAgZ2V0TG9jYXRpb246IC0+XG4gIHN0YXJ0V2F0Y2g6IC0+XG4gIHN0b3BXYXRjaDogLT5cblxuZGVzY3JpYmUgJ0xvY2F0aW9uVmlldycsIC0+XG4gIGNvbnRleHQgJ1dpdGggbm8gc2V0IGxvY2F0aW9uJywgLT5cbiAgICBiZWZvcmVFYWNoIC0+XG4gICAgICBAbG9jYXRpb25GaW5kZXIgPSBuZXcgTW9ja0xvY2F0aW9uRmluZGVyKClcbiAgICAgIEBsb2NhdGlvblZpZXcgPSBuZXcgTG9jYXRpb25WaWV3KGxvYzpudWxsLCBsb2NhdGlvbkZpbmRlckNsYXNzOiBAbG9jYXRpb25GaW5kZXIpXG4gICAgICBAdWkgPSBuZXcgVUlEcml2ZXIoQGxvY2F0aW9uVmlldy5lbClcblxuICAgIGl0ICdkaXNwbGF5cyBVbnNwZWNpZmllZCcsIC0+XG4gICAgICBhc3NlcnQuaW5jbHVkZShAdWkudGV4dCgpLCAnVW5zcGVjaWZpZWQnKVxuXG4gICAgaXQgJ2Rpc2FibGVzIG1hcCcsIC0+XG4gICAgICBhc3NlcnQuaXNUcnVlIEB1aS5nZXREaXNhYmxlZChcIk1hcFwiKSBcblxuICAgIGl0ICdhbGxvd3Mgc2V0dGluZyBsb2NhdGlvbidcblxuIiwiYXNzZXJ0ID0gY2hhaS5hc3NlcnRcbkxvY2FsRGIgPSByZXF1aXJlIFwiLi4vYXBwL2pzL2RiL0xvY2FsRGJcIlxuZGJfcXVlcmllcyA9IHJlcXVpcmUgXCIuL2RiX3F1ZXJpZXNcIlxuXG5kZXNjcmliZSAnTG9jYWxEYicsIC0+XG4gIGJlZm9yZSAtPlxuICAgIEBkYiA9IG5ldyBMb2NhbERiKCd0ZXN0JylcblxuICBiZWZvcmVFYWNoIChkb25lKSAtPlxuICAgIEBkYi5yZW1vdmVDb2xsZWN0aW9uKCd0ZXN0JylcbiAgICBAZGIuYWRkQ29sbGVjdGlvbigndGVzdCcpXG4gICAgZG9uZSgpXG5cbiAgZGVzY3JpYmUgXCJwYXNzZXMgcXVlcmllc1wiLCAtPlxuICAgIGRiX3F1ZXJpZXMuY2FsbCh0aGlzKVxuXG4gIGl0ICdjYWNoZXMgcm93cycsIChkb25lKSAtPlxuICAgIEBkYi50ZXN0LmNhY2hlIFt7IF9pZDogMSwgYTogJ2FwcGxlJyB9XSwge30sIHt9LCA9PlxuICAgICAgQGRiLnRlc3QuZmluZCh7fSkuZmV0Y2ggKHJlc3VsdHMpIC0+XG4gICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzWzBdLmEsICdhcHBsZSdcbiAgICAgICAgZG9uZSgpXG5cbiAgaXQgJ2NhY2hlIG92ZXJ3cml0ZSBleGlzdGluZycsIChkb25lKSAtPlxuICAgIEBkYi50ZXN0LmNhY2hlIFt7IF9pZDogMSwgYTogJ2FwcGxlJyB9XSwge30sIHt9LCA9PlxuICAgICAgQGRiLnRlc3QuY2FjaGUgW3sgX2lkOiAxLCBhOiAnYmFuYW5hJyB9XSwge30sIHt9LCA9PlxuICAgICAgICBAZGIudGVzdC5maW5kKHt9KS5mZXRjaCAocmVzdWx0cykgLT5cbiAgICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0c1swXS5hLCAnYmFuYW5hJ1xuICAgICAgICAgIGRvbmUoKVxuXG4gIGl0IFwiY2FjaGUgZG9lc24ndCBvdmVyd3JpdGUgdXBzZXJ0XCIsIChkb25lKSAtPlxuICAgIEBkYi50ZXN0LnVwc2VydCB7IF9pZDogMSwgYTogJ2FwcGxlJyB9LCA9PlxuICAgICAgQGRiLnRlc3QuY2FjaGUgW3sgX2lkOiAxLCBhOiAnYmFuYW5hJyB9XSwge30sIHt9LCA9PlxuICAgICAgICBAZGIudGVzdC5maW5kKHt9KS5mZXRjaCAocmVzdWx0cykgLT5cbiAgICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0c1swXS5hLCAnYXBwbGUnXG4gICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJjYWNoZSBkb2Vzbid0IG92ZXJ3cml0ZSByZW1vdmVcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnRlc3QuY2FjaGUgW3sgX2lkOiAxLCBhOiAnZGVsZXRlJyB9XSwge30sIHt9LCA9PlxuICAgICAgQGRiLnRlc3QucmVtb3ZlIDEsID0+XG4gICAgICBAZGIudGVzdC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdiYW5hbmEnIH1dLCB7fSwge30sID0+XG4gICAgICAgIEBkYi50ZXN0LmZpbmQoe30pLmZldGNoIChyZXN1bHRzKSAtPlxuICAgICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzLmxlbmd0aCwgMFxuICAgICAgICAgIGRvbmUoKVxuXG4gIGl0IFwiY2FjaGUgcmVtb3ZlcyBtaXNzaW5nIHVuc29ydGVkXCIsIChkb25lKSAtPlxuICAgIEBkYi50ZXN0LmNhY2hlIFt7IF9pZDogMSwgYTogJ2EnIH0sIHsgX2lkOiAyLCBhOiAnYicgfSwgeyBfaWQ6IDMsIGE6ICdjJyB9XSwge30sIHt9LCA9PlxuICAgICAgQGRiLnRlc3QuY2FjaGUgW3sgX2lkOiAxLCBhOiAnYScgfSwgeyBfaWQ6IDMsIGE6ICdjJyB9XSwge30sIHt9LCA9PlxuICAgICAgICBAZGIudGVzdC5maW5kKHt9KS5mZXRjaCAocmVzdWx0cykgLT5cbiAgICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0cy5sZW5ndGgsIDJcbiAgICAgICAgICBkb25lKClcblxuICBpdCBcImNhY2hlIHJlbW92ZXMgbWlzc2luZyBmaWx0ZXJlZFwiLCAoZG9uZSkgLT5cbiAgICBAZGIudGVzdC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdhJyB9LCB7IF9pZDogMiwgYTogJ2InIH0sIHsgX2lkOiAzLCBhOiAnYycgfV0sIHt9LCB7fSwgPT5cbiAgICAgIEBkYi50ZXN0LmNhY2hlIFt7IF9pZDogMSwgYTogJ2EnIH1dLCB7X2lkOiB7JGx0OjN9fSwge30sID0+XG4gICAgICAgIEBkYi50ZXN0LmZpbmQoe30sIHtzb3J0OlsnX2lkJ119KS5mZXRjaCAocmVzdWx0cykgLT5cbiAgICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIF8ucGx1Y2socmVzdWx0cywgJ19pZCcpLCBbMSwzXVxuICAgICAgICAgIGRvbmUoKVxuXG4gIGl0IFwiY2FjaGUgcmVtb3ZlcyBtaXNzaW5nIHNvcnRlZCBsaW1pdGVkXCIsIChkb25lKSAtPlxuICAgIEBkYi50ZXN0LmNhY2hlIFt7IF9pZDogMSwgYTogJ2EnIH0sIHsgX2lkOiAyLCBhOiAnYicgfSwgeyBfaWQ6IDMsIGE6ICdjJyB9XSwge30sIHt9LCA9PlxuICAgICAgQGRiLnRlc3QuY2FjaGUgW3sgX2lkOiAxLCBhOiAnYScgfV0sIHt9LCB7c29ydDpbJ19pZCddLCBsaW1pdDoyfSwgPT5cbiAgICAgICAgQGRiLnRlc3QuZmluZCh7fSwge3NvcnQ6WydfaWQnXX0pLmZldGNoIChyZXN1bHRzKSAtPlxuICAgICAgICAgIGFzc2VydC5kZWVwRXF1YWwgXy5wbHVjayhyZXN1bHRzLCAnX2lkJyksIFsxLDNdXG4gICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJjYWNoZSBkb2VzIG5vdCByZW1vdmUgbWlzc2luZyBzb3J0ZWQgbGltaXRlZCBwYXN0IGVuZFwiLCAoZG9uZSkgLT5cbiAgICBAZGIudGVzdC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdhJyB9LCB7IF9pZDogMiwgYTogJ2InIH0sIHsgX2lkOiAzLCBhOiAnYycgfSwgeyBfaWQ6IDQsIGE6ICdkJyB9XSwge30sIHt9LCA9PlxuICAgICAgQGRiLnRlc3QucmVtb3ZlIDIsID0+XG4gICAgICAgIEBkYi50ZXN0LmNhY2hlIFt7IF9pZDogMSwgYTogJ2EnIH0sIHsgX2lkOiAyLCBhOiAnYicgfV0sIHt9LCB7c29ydDpbJ19pZCddLCBsaW1pdDoyfSwgPT5cbiAgICAgICAgICBAZGIudGVzdC5maW5kKHt9LCB7c29ydDpbJ19pZCddfSkuZmV0Y2ggKHJlc3VsdHMpIC0+XG4gICAgICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIF8ucGx1Y2socmVzdWx0cywgJ19pZCcpLCBbMSwzLDRdXG4gICAgICAgICAgICBkb25lKClcblxuICBpdCBcInJldHVybnMgcGVuZGluZyB1cHNlcnRzXCIsIChkb25lKSAtPlxuICAgIEBkYi50ZXN0LmNhY2hlIFt7IF9pZDogMSwgYTogJ2FwcGxlJyB9XSwge30sIHt9LCA9PlxuICAgICAgQGRiLnRlc3QudXBzZXJ0IHsgX2lkOiAyLCBhOiAnYmFuYW5hJyB9LCA9PlxuICAgICAgICBAZGIudGVzdC5wZW5kaW5nVXBzZXJ0cyAocmVzdWx0cykgPT5cbiAgICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0cy5sZW5ndGgsIDFcbiAgICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0c1swXS5hLCAnYmFuYW5hJ1xuICAgICAgICAgIGRvbmUoKVxuXG4gIGl0IFwicmVzb2x2ZXMgcGVuZGluZyB1cHNlcnRzXCIsIChkb25lKSAtPlxuICAgIEBkYi50ZXN0LnVwc2VydCB7IF9pZDogMiwgYTogJ2JhbmFuYScgfSwgPT5cbiAgICAgIEBkYi50ZXN0LnJlc29sdmVVcHNlcnQgeyBfaWQ6IDIsIGE6ICdiYW5hbmEnIH0sID0+XG4gICAgICAgIEBkYi50ZXN0LnBlbmRpbmdVcHNlcnRzIChyZXN1bHRzKSA9PlxuICAgICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzLmxlbmd0aCwgMFxuICAgICAgICAgIGRvbmUoKVxuXG4gIGl0IFwicmV0YWlucyBjaGFuZ2VkIHBlbmRpbmcgdXBzZXJ0c1wiLCAoZG9uZSkgLT5cbiAgICBAZGIudGVzdC51cHNlcnQgeyBfaWQ6IDIsIGE6ICdiYW5hbmEnIH0sID0+XG4gICAgICBAZGIudGVzdC51cHNlcnQgeyBfaWQ6IDIsIGE6ICdiYW5hbmEyJyB9LCA9PlxuICAgICAgICBAZGIudGVzdC5yZXNvbHZlVXBzZXJ0IHsgX2lkOiAyLCBhOiAnYmFuYW5hJyB9LCA9PlxuICAgICAgICAgIEBkYi50ZXN0LnBlbmRpbmdVcHNlcnRzIChyZXN1bHRzKSA9PlxuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHMubGVuZ3RoLCAxXG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0c1swXS5hLCAnYmFuYW5hMidcbiAgICAgICAgICAgIGRvbmUoKVxuXG4gIGl0IFwicmVtb3ZlcyBwZW5kaW5nIHVwc2VydHNcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnRlc3QudXBzZXJ0IHsgX2lkOiAyLCBhOiAnYmFuYW5hJyB9LCA9PlxuICAgICAgQGRiLnRlc3QucmVtb3ZlIDIsID0+XG4gICAgICAgIEBkYi50ZXN0LnBlbmRpbmdVcHNlcnRzIChyZXN1bHRzKSA9PlxuICAgICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzLmxlbmd0aCwgMFxuICAgICAgICAgIGRvbmUoKVxuXG4gIGl0IFwicmV0dXJucyBwZW5kaW5nIHJlbW92ZXNcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnRlc3QuY2FjaGUgW3sgX2lkOiAxLCBhOiAnYXBwbGUnIH1dLCB7fSwge30sID0+XG4gICAgICBAZGIudGVzdC5yZW1vdmUgMSwgPT5cbiAgICAgICAgQGRiLnRlc3QucGVuZGluZ1JlbW92ZXMgKHJlc3VsdHMpID0+XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHMubGVuZ3RoLCAxXG4gICAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHNbMF0sIDFcbiAgICAgICAgICBkb25lKClcblxuICBpdCBcInJlc29sdmVzIHBlbmRpbmcgcmVtb3Zlc1wiLCAoZG9uZSkgLT5cbiAgICBAZGIudGVzdC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdhcHBsZScgfV0sIHt9LCB7fSwgPT5cbiAgICAgIEBkYi50ZXN0LnJlbW92ZSAxLCA9PlxuICAgICAgICBAZGIudGVzdC5yZXNvbHZlUmVtb3ZlIDEsID0+XG4gICAgICAgICAgQGRiLnRlc3QucGVuZGluZ1JlbW92ZXMgKHJlc3VsdHMpID0+XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0cy5sZW5ndGgsIDBcbiAgICAgICAgICAgIGRvbmUoKVxuXG4gIGl0IFwic2VlZHNcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnRlc3Quc2VlZCB7IF9pZDogMSwgYTogJ2FwcGxlJyB9LCA9PlxuICAgICAgQGRiLnRlc3QuZmluZCh7fSkuZmV0Y2ggKHJlc3VsdHMpIC0+XG4gICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzWzBdLmEsICdhcHBsZSdcbiAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJkb2VzIG5vdCBvdmVyd3JpdGUgZXhpc3RpbmdcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnRlc3QuY2FjaGUgW3sgX2lkOiAxLCBhOiAnYmFuYW5hJyB9XSwge30sIHt9LCA9PlxuICAgICAgQGRiLnRlc3Quc2VlZCB7IF9pZDogMSwgYTogJ2FwcGxlJyB9LCA9PlxuICAgICAgICBAZGIudGVzdC5maW5kKHt9KS5mZXRjaCAocmVzdWx0cykgLT5cbiAgICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0c1swXS5hLCAnYmFuYW5hJ1xuICAgICAgICAgIGRvbmUoKVxuXG4gIGl0IFwiZG9lcyBub3QgYWRkIHJlbW92ZWRcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnRlc3QuY2FjaGUgW3sgX2lkOiAxLCBhOiAnYXBwbGUnIH1dLCB7fSwge30sID0+XG4gICAgICBAZGIudGVzdC5yZW1vdmUgMSwgPT5cbiAgICAgICAgQGRiLnRlc3Quc2VlZCB7IF9pZDogMSwgYTogJ2FwcGxlJyB9LCA9PlxuICAgICAgICAgIEBkYi50ZXN0LmZpbmQoe30pLmZldGNoIChyZXN1bHRzKSAtPlxuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHMubGVuZ3RoLCAwXG4gICAgICAgICAgICBkb25lKClcblxuICBpdCBcInJldGFpbnMgaXRlbXNcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnRlc3QudXBzZXJ0IHsgX2lkOjEsIGE6XCJBbGljZVwiIH0sID0+XG4gICAgICBkYjIgPSBuZXcgTG9jYWxEYigndGVzdCcpXG4gICAgICBkYjIuYWRkQ29sbGVjdGlvbiAndGVzdCdcbiAgICAgIGRiMi50ZXN0LmZpbmQoe30pLmZldGNoIChyZXN1bHRzKSAtPlxuICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0c1swXS5hLCBcIkFsaWNlXCJcbiAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJyZXRhaW5zIHVwc2VydHNcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnRlc3QudXBzZXJ0IHsgX2lkOjEsIGE6XCJBbGljZVwiIH0sID0+XG4gICAgICBkYjIgPSBuZXcgTG9jYWxEYigndGVzdCcpXG4gICAgICBkYjIuYWRkQ29sbGVjdGlvbiAndGVzdCdcbiAgICAgIGRiMi50ZXN0LmZpbmQoe30pLmZldGNoIChyZXN1bHRzKSAtPlxuICAgICAgICBkYjIudGVzdC5wZW5kaW5nVXBzZXJ0cyAodXBzZXJ0cykgLT5cbiAgICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIHJlc3VsdHMsIHVwc2VydHNcbiAgICAgICAgICBkb25lKClcblxuICBpdCBcInJldGFpbnMgcmVtb3Zlc1wiLCAoZG9uZSkgLT5cbiAgICBAZGIudGVzdC5zZWVkIHsgX2lkOjEsIGE6XCJBbGljZVwiIH0sID0+XG4gICAgICBAZGIudGVzdC5yZW1vdmUgMSwgPT5cbiAgICAgICAgZGIyID0gbmV3IExvY2FsRGIoJ3Rlc3QnKVxuICAgICAgICBkYjIuYWRkQ29sbGVjdGlvbiAndGVzdCdcbiAgICAgICAgZGIyLnRlc3QucGVuZGluZ1JlbW92ZXMgKHJlbW92ZXMpIC0+XG4gICAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCByZW1vdmVzLCBbMV1cbiAgICAgICAgICBkb25lKClcbiIsIlxuIyBUcmFja3MgYSBzZXQgb2YgaXRlbXMgYnkgaWQsIGluZGljYXRpbmcgd2hpY2ggaGF2ZSBiZWVuIGFkZGVkIG9yIHJlbW92ZWQuXG4jIENoYW5nZXMgYXJlIGJvdGggYWRkIGFuZCByZW1vdmVcbmNsYXNzIEl0ZW1UcmFja2VyXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgIEBrZXkgPSAnX2lkJ1xuICAgIEBpdGVtcyA9IHt9XG5cbiAgdXBkYXRlOiAoaXRlbXMpIC0+ICAgICMgUmV0dXJuIFtbYWRkZWRdLFtyZW1vdmVkXV0gaXRlbXNcbiAgICBhZGRzID0gW11cbiAgICByZW1vdmVzID0gW11cblxuICAgICMgQWRkIGFueSBuZXcgb25lc1xuICAgIGZvciBpdGVtIGluIGl0ZW1zXG4gICAgICBpZiBub3QgXy5oYXMoQGl0ZW1zLCBpdGVtW0BrZXldKVxuICAgICAgICBhZGRzLnB1c2goaXRlbSlcblxuICAgICMgQ3JlYXRlIG1hcCBvZiBpdGVtcyBwYXJhbWV0ZXJcbiAgICBtYXAgPSBfLm9iamVjdChfLnBsdWNrKGl0ZW1zLCBAa2V5KSwgaXRlbXMpXG5cbiAgICAjIEZpbmQgcmVtb3Zlc1xuICAgIGZvciBrZXksIHZhbHVlIG9mIEBpdGVtc1xuICAgICAgaWYgbm90IF8uaGFzKG1hcCwga2V5KVxuICAgICAgICByZW1vdmVzLnB1c2godmFsdWUpXG4gICAgICBlbHNlIGlmIG5vdCBfLmlzRXF1YWwodmFsdWUsIG1hcFtrZXldKVxuICAgICAgICBhZGRzLnB1c2gobWFwW2tleV0pXG4gICAgICAgIHJlbW92ZXMucHVzaCh2YWx1ZSlcblxuICAgIGZvciBpdGVtIGluIHJlbW92ZXNcbiAgICAgIGRlbGV0ZSBAaXRlbXNbaXRlbVtAa2V5XV1cblxuICAgIGZvciBpdGVtIGluIGFkZHNcbiAgICAgIEBpdGVtc1tpdGVtW0BrZXldXSA9IGl0ZW1cblxuICAgIHJldHVybiBbYWRkcywgcmVtb3Zlc11cblxubW9kdWxlLmV4cG9ydHMgPSBJdGVtVHJhY2tlciIsIiMgR2VvSlNPTiBoZWxwZXIgcm91dGluZXNcblxuZXhwb3J0cy5sYXRMbmdCb3VuZHNUb0dlb0pTT04gPSAoYm91bmRzKSAtPlxuICBzdyA9IGJvdW5kcy5nZXRTb3V0aFdlc3QoKVxuICBuZSA9IGJvdW5kcy5nZXROb3J0aEVhc3QoKVxuICByZXR1cm4ge1xuICAgIHR5cGU6ICdQb2x5Z29uJyxcbiAgICBjb29yZGluYXRlczogW1xuICAgICAgW1tzdy5sbmcsIHN3LmxhdF0sIFxuICAgICAgW3N3LmxuZywgbmUubGF0XSwgXG4gICAgICBbbmUubG5nLCBuZS5sYXRdLCBcbiAgICAgIFtuZS5sbmcsIHN3LmxhdF1dXG4gICAgXVxuICB9XG5cbiMgVE9ETzogb25seSB3b3JrcyB3aXRoIGJvdW5kc1xuZXhwb3J0cy5wb2ludEluUG9seWdvbiA9IChwb2ludCwgcG9seWdvbikgLT5cbiAgIyBHZXQgYm91bmRzXG4gIGJvdW5kcyA9IG5ldyBMLkxhdExuZ0JvdW5kcyhfLm1hcChwb2x5Z29uLmNvb3JkaW5hdGVzWzBdLCAoY29vcmQpIC0+IG5ldyBMLkxhdExuZyhjb29yZFsxXSwgY29vcmRbMF0pKSlcbiAgcmV0dXJuIGJvdW5kcy5jb250YWlucyhuZXcgTC5MYXRMbmcocG9pbnQuY29vcmRpbmF0ZXNbMV0sIHBvaW50LmNvb3JkaW5hdGVzWzBdKSkiLCJhc3NlcnQgPSBjaGFpLmFzc2VydFxuXG5jbGFzcyBVSURyaXZlclxuICBjb25zdHJ1Y3RvcjogKGVsKSAtPlxuICAgIEBlbCA9ICQoZWwpXG5cbiAgZ2V0RGlzYWJsZWQ6IChzdHIpIC0+XG4gICAgZm9yIGl0ZW0gaW4gQGVsLmZpbmQoXCJhLGJ1dHRvblwiKVxuICAgICAgaWYgJChpdGVtKS50ZXh0KCkuaW5kZXhPZihzdHIpICE9IC0xXG4gICAgICAgIHJldHVybiAkKGl0ZW0pLmlzKFwiOmRpc2FibGVkXCIpXG4gICAgYXNzZXJ0LmZhaWwobnVsbCwgc3RyLCBcIkNhbid0IGZpbmQ6IFwiICsgc3RyKVxuXG4gIGNsaWNrOiAoc3RyKSAtPlxuICAgIGZvciBpdGVtIGluIEBlbC5maW5kKFwiYSxidXR0b25cIilcbiAgICAgIGlmICQoaXRlbSkudGV4dCgpLmluZGV4T2Yoc3RyKSAhPSAtMVxuICAgICAgICBjb25zb2xlLmxvZyBcIkNsaWNraW5nOiBcIiArICQoaXRlbSkudGV4dCgpXG4gICAgICAgICQoaXRlbSkudHJpZ2dlcihcImNsaWNrXCIpXG4gICAgICAgIHJldHVyblxuICAgIGFzc2VydC5mYWlsKG51bGwsIHN0ciwgXCJDYW4ndCBmaW5kOiBcIiArIHN0cilcbiAgXG4gIGZpbGw6IChzdHIsIHZhbHVlKSAtPlxuICAgIGZvciBpdGVtIGluIEBlbC5maW5kKFwibGFiZWxcIilcbiAgICAgIGlmICQoaXRlbSkudGV4dCgpLmluZGV4T2Yoc3RyKSAhPSAtMVxuICAgICAgICBib3ggPSBAZWwuZmluZChcIiNcIiskKGl0ZW0pLmF0dHIoJ2ZvcicpKVxuICAgICAgICBib3gudmFsKHZhbHVlKVxuICBcbiAgdGV4dDogLT5cbiAgICByZXR1cm4gQGVsLnRleHQoKVxuICAgICAgXG4gIHdhaXQ6IChhZnRlcikgLT5cbiAgICBzZXRUaW1lb3V0IGFmdGVyLCAxMFxuXG5tb2R1bGUuZXhwb3J0cyA9IFVJRHJpdmVyIiwiYXNzZXJ0ID0gY2hhaS5hc3NlcnRcblxuR2VvSlNPTiA9IHJlcXVpcmUgJy4uL2FwcC9qcy9HZW9KU09OJ1xuXG5tb2R1bGUuZXhwb3J0cyA9IC0+XG4gIGNvbnRleHQgJ1dpdGggc2FtcGxlIHJvd3MnLCAtPlxuICAgIGJlZm9yZUVhY2ggKGRvbmUpIC0+XG4gICAgICBAZGIudGVzdC51cHNlcnQgeyBfaWQ6MSwgYTpcIkFsaWNlXCIgfSwgPT5cbiAgICAgICAgQGRiLnRlc3QudXBzZXJ0IHsgX2lkOjIsIGE6XCJDaGFybGllXCIgfSwgPT5cbiAgICAgICAgICBAZGIudGVzdC51cHNlcnQgeyBfaWQ6MywgYTpcIkJvYlwiIH0sID0+XG4gICAgICAgICAgICBkb25lKClcblxuICAgIGl0ICdmaW5kcyBhbGwgcm93cycsIChkb25lKSAtPlxuICAgICAgQGRiLnRlc3QuZmluZCh7fSkuZmV0Y2ggKHJlc3VsdHMpID0+XG4gICAgICAgIGFzc2VydC5lcXVhbCAzLCByZXN1bHRzLmxlbmd0aFxuICAgICAgICBkb25lKClcblxuICAgIGl0ICdmaW5kcyBhbGwgcm93cyB3aXRoIG9wdGlvbnMnLCAoZG9uZSkgLT5cbiAgICAgIEBkYi50ZXN0LmZpbmQoe30sIHt9KS5mZXRjaCAocmVzdWx0cykgPT5cbiAgICAgICAgYXNzZXJ0LmVxdWFsIDMsIHJlc3VsdHMubGVuZ3RoXG4gICAgICAgIGRvbmUoKVxuXG4gICAgaXQgJ2ZpbHRlcnMgcm93cyBieSBpZCcsIChkb25lKSAtPlxuICAgICAgQGRiLnRlc3QuZmluZCh7IF9pZDogMSB9KS5mZXRjaCAocmVzdWx0cykgPT5cbiAgICAgICAgYXNzZXJ0LmVxdWFsIDEsIHJlc3VsdHMubGVuZ3RoXG4gICAgICAgIGFzc2VydC5lcXVhbCAnQWxpY2UnLCByZXN1bHRzWzBdLmFcbiAgICAgICAgZG9uZSgpXG5cbiAgICBpdCAnZmluZHMgb25lIHJvdycsIChkb25lKSAtPlxuICAgICAgQGRiLnRlc3QuZmluZE9uZSB7IF9pZDogMiB9LCAocmVzdWx0KSA9PlxuICAgICAgICBhc3NlcnQuZXF1YWwgJ0NoYXJsaWUnLCByZXN1bHQuYVxuICAgICAgICBkb25lKClcblxuICAgIGl0ICdyZW1vdmVzIGl0ZW0nLCAoZG9uZSkgLT5cbiAgICAgIEBkYi50ZXN0LnJlbW92ZSAyLCA9PlxuICAgICAgICBAZGIudGVzdC5maW5kKHt9KS5mZXRjaCAocmVzdWx0cykgPT5cbiAgICAgICAgICBhc3NlcnQuZXF1YWwgMiwgcmVzdWx0cy5sZW5ndGhcbiAgICAgICAgICBhc3NlcnQgMSBpbiAocmVzdWx0Ll9pZCBmb3IgcmVzdWx0IGluIHJlc3VsdHMpXG4gICAgICAgICAgYXNzZXJ0IDIgbm90IGluIChyZXN1bHQuX2lkIGZvciByZXN1bHQgaW4gcmVzdWx0cylcbiAgICAgICAgICBkb25lKClcblxuICAgIGl0ICdyZW1vdmVzIG5vbi1leGlzdGVudCBpdGVtJywgKGRvbmUpIC0+XG4gICAgICBAZGIudGVzdC5yZW1vdmUgOTk5LCA9PlxuICAgICAgICBAZGIudGVzdC5maW5kKHt9KS5mZXRjaCAocmVzdWx0cykgPT5cbiAgICAgICAgICBhc3NlcnQuZXF1YWwgMywgcmVzdWx0cy5sZW5ndGhcbiAgICAgICAgICBkb25lKClcblxuICAgIGl0ICdzb3J0cyBhc2NlbmRpbmcnLCAoZG9uZSkgLT5cbiAgICAgIEBkYi50ZXN0LmZpbmQoe30sIHtzb3J0OiBbJ2EnXX0pLmZldGNoIChyZXN1bHRzKSA9PlxuICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIF8ucGx1Y2socmVzdWx0cywgJ19pZCcpLCBbMSwzLDJdXG4gICAgICAgIGRvbmUoKVxuXG4gICAgaXQgJ3NvcnRzIGRlc2NlbmRpbmcnLCAoZG9uZSkgLT5cbiAgICAgIEBkYi50ZXN0LmZpbmQoe30sIHtzb3J0OiBbWydhJywnZGVzYyddXX0pLmZldGNoIChyZXN1bHRzKSA9PlxuICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIF8ucGx1Y2socmVzdWx0cywgJ19pZCcpLCBbMiwzLDFdXG4gICAgICAgIGRvbmUoKVxuXG4gICAgaXQgJ2xpbWl0cycsIChkb25lKSAtPlxuICAgICAgQGRiLnRlc3QuZmluZCh7fSwge3NvcnQ6IFsnYSddLCBsaW1pdDoyfSkuZmV0Y2ggKHJlc3VsdHMpID0+XG4gICAgICAgIGFzc2VydC5kZWVwRXF1YWwgXy5wbHVjayhyZXN1bHRzLCAnX2lkJyksIFsxLDNdXG4gICAgICAgIGRvbmUoKVxuXG4gICAgaXQgJ2ZldGNoZXMgaW5kZXBlbmRlbnQgY29waWVzJywgKGRvbmUpIC0+XG4gICAgICBAZGIudGVzdC5maW5kT25lIHsgX2lkOiAyIH0sIChyZXN1bHQpID0+XG4gICAgICAgIHJlc3VsdC5hID0gJ0RhdmlkJ1xuICAgICAgICBAZGIudGVzdC5maW5kT25lIHsgX2lkOiAyIH0sIChyZXN1bHQpID0+XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsICdDaGFybGllJywgcmVzdWx0LmFcbiAgICAgICAgICBkb25lKClcblxuICBpdCAnYWRkcyBfaWQgdG8gcm93cycsIChkb25lKSAtPlxuICAgIEBkYi50ZXN0LnVwc2VydCB7IGE6IDEgfSwgKGl0ZW0pID0+XG4gICAgICBhc3NlcnQucHJvcGVydHkgaXRlbSwgJ19pZCdcbiAgICAgIGFzc2VydC5sZW5ndGhPZiBpdGVtLl9pZCwgMzJcbiAgICAgIGRvbmUoKVxuXG4gIGl0ICd1cGRhdGVzIGJ5IGlkJywgKGRvbmUpIC0+XG4gICAgQGRiLnRlc3QudXBzZXJ0IHsgX2lkOjEsIGE6MSB9LCAoaXRlbSkgPT5cbiAgICAgIEBkYi50ZXN0LnVwc2VydCB7IF9pZDoxLCBhOjIgfSwgKGl0ZW0pID0+XG4gICAgICAgIGFzc2VydC5lcXVhbCBpdGVtLmEsIDJcbiAgXG4gICAgICAgIEBkYi50ZXN0LmZpbmQoe30pLmZldGNoIChyZXN1bHRzKSA9PlxuICAgICAgICAgIGFzc2VydC5lcXVhbCAxLCByZXN1bHRzLmxlbmd0aFxuICAgICAgICAgIGRvbmUoKVxuXG5cbiAgZ2VvcG9pbnQgPSAobG5nLCBsYXQpIC0+XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZTogJ1BvaW50J1xuICAgICAgICBjb29yZGluYXRlczogW2xuZywgbGF0XVxuICAgIH1cblxuICBjb250ZXh0ICdXaXRoIGdlb2xvY2F0ZWQgcm93cycsIC0+XG4gICAgYmVmb3JlRWFjaCAoZG9uZSkgLT5cbiAgICAgIEBkYi50ZXN0LnVwc2VydCB7IF9pZDoxLCBsb2M6Z2VvcG9pbnQoOTAsIDQ1KSB9LCA9PlxuICAgICAgICBAZGIudGVzdC51cHNlcnQgeyBfaWQ6MiwgbG9jOmdlb3BvaW50KDkwLCA0NikgfSwgPT5cbiAgICAgICAgICBAZGIudGVzdC51cHNlcnQgeyBfaWQ6MywgbG9jOmdlb3BvaW50KDkxLCA0NSkgfSwgPT5cbiAgICAgICAgICAgIEBkYi50ZXN0LnVwc2VydCB7IF9pZDo0LCBsb2M6Z2VvcG9pbnQoOTEsIDQ2KSB9LCA9PlxuICAgICAgICAgICAgICBkb25lKClcblxuICAgIGl0ICdmaW5kcyBwb2ludHMgbmVhcicsIChkb25lKSAtPlxuICAgICAgc2VsZWN0b3IgPSBsb2M6IFxuICAgICAgICAkbmVhcjogXG4gICAgICAgICAgJGdlb21ldHJ5OiBnZW9wb2ludCg5MCwgNDUpXG5cbiAgICAgIEBkYi50ZXN0LmZpbmQoc2VsZWN0b3IpLmZldGNoIChyZXN1bHRzKSA9PlxuICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIF8ucGx1Y2socmVzdWx0cywgJ19pZCcpLCBbMSwzLDIsNF1cbiAgICAgICAgZG9uZSgpXG5cbiAgICBpdCAnZmluZHMgcG9pbnRzIG5lYXIgbWF4RGlzdGFuY2UnLCAoZG9uZSkgLT5cbiAgICAgIHNlbGVjdG9yID0gbG9jOiBcbiAgICAgICAgJG5lYXI6IFxuICAgICAgICAgICRnZW9tZXRyeTogZ2VvcG9pbnQoOTAsIDQ1KVxuICAgICAgICAgICRtYXhEaXN0YW5jZTogMTExMDAwXG5cbiAgICAgIEBkYi50ZXN0LmZpbmQoc2VsZWN0b3IpLmZldGNoIChyZXN1bHRzKSA9PlxuICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIF8ucGx1Y2socmVzdWx0cywgJ19pZCcpLCBbMSwzXVxuICAgICAgICBkb25lKCkgICAgICBcblxuICAgIGl0ICdmaW5kcyBwb2ludHMgbmVhciBtYXhEaXN0YW5jZSBqdXN0IGFib3ZlJywgKGRvbmUpIC0+XG4gICAgICBzZWxlY3RvciA9IGxvYzogXG4gICAgICAgICRuZWFyOiBcbiAgICAgICAgICAkZ2VvbWV0cnk6IGdlb3BvaW50KDkwLCA0NSlcbiAgICAgICAgICAkbWF4RGlzdGFuY2U6IDExMjAwMFxuXG4gICAgICBAZGIudGVzdC5maW5kKHNlbGVjdG9yKS5mZXRjaCAocmVzdWx0cykgPT5cbiAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCBfLnBsdWNrKHJlc3VsdHMsICdfaWQnKSwgWzEsMywyXVxuICAgICAgICBkb25lKClcblxuICAgIGl0ICdmaW5kcyBwb2ludHMgd2l0aGluIHNpbXBsZSBib3gnLCAoZG9uZSkgLT5cbiAgICAgIHNlbGVjdG9yID0gbG9jOiBcbiAgICAgICAgJGdlb0ludGVyc2VjdHM6IFxuICAgICAgICAgICRnZW9tZXRyeTogXG4gICAgICAgICAgICB0eXBlOiAnUG9seWdvbidcbiAgICAgICAgICAgIGNvb3JkaW5hdGVzOiBbW1xuICAgICAgICAgICAgICBbODkuNSwgNDUuNV0sIFs4OS41LCA0Ni41XSwgWzkwLjUsIDQ2LjVdLCBbOTAuNSwgNDUuNV1cbiAgICAgICAgICAgIF1dXG4gICAgICBAZGIudGVzdC5maW5kKHNlbGVjdG9yKS5mZXRjaCAocmVzdWx0cykgPT5cbiAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCBfLnBsdWNrKHJlc3VsdHMsICdfaWQnKSwgWzJdXG4gICAgICAgIGRvbmUoKVxuXG4gICAgaXQgJ2hhbmRsZXMgdW5kZWZpbmVkJywgKGRvbmUpIC0+XG4gICAgICBzZWxlY3RvciA9IGxvYzogXG4gICAgICAgICRnZW9JbnRlcnNlY3RzOiBcbiAgICAgICAgICAkZ2VvbWV0cnk6IFxuICAgICAgICAgICAgdHlwZTogJ1BvbHlnb24nXG4gICAgICAgICAgICBjb29yZGluYXRlczogW1tcbiAgICAgICAgICAgICAgWzg5LjUsIDQ1LjVdLCBbODkuNSwgNDYuNV0sIFs5MC41LCA0Ni41XSwgWzkwLjUsIDQ1LjVdXG4gICAgICAgICAgICBdXVxuICAgICAgQGRiLnRlc3QudXBzZXJ0IHsgX2lkOjUgfSwgPT5cbiAgICAgICAgQGRiLnRlc3QuZmluZChzZWxlY3RvcikuZmV0Y2ggKHJlc3VsdHMpID0+XG4gICAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCBfLnBsdWNrKHJlc3VsdHMsICdfaWQnKSwgWzJdXG4gICAgICAgICAgZG9uZSgpXG5cblxuIiwiTG9jYXRpb25GaW5kZXIgPSByZXF1aXJlICcuL0xvY2F0aW9uRmluZGVyJ1xuXG4jIFNob3dzIHRoZSByZWxhdGl2ZSBsb2NhdGlvbiBvZiBhIHBvaW50IGFuZCBhbGxvd3Mgc2V0dGluZyBpdFxuY2xhc3MgTG9jYXRpb25WaWV3IGV4dGVuZHMgQmFja2JvbmUuVmlld1xuICBjb25zdHJ1Y3RvcjogKG9wdGlvbnMpIC0+XG4gICAgc3VwZXIoKVxuICAgIEBsb2MgPSBvcHRpb25zLmxvY1xuICAgIEBzZXRMb2NhdGlvbiA9IG9wdGlvbnMuc2V0TG9jYXRpb25cblxuICAgICMgQWxsb3cgb3ZlcnJpZGluZyBvZiBsb2NhdGlvbiBmaW5kZXIgY2xhc3NcbiAgICBAbG9jYXRpb25GaW5kZXIgPSBuZXcgKG9wdGlvbnMubG9jYXRpb25GaW5kZXJDbGFzcyB8fCBMb2NhdGlvbkZpbmRlcikoQGxvY2F0aW9uU3VjY2VzcywgQGxvY2F0aW9uRXJyb3IpXG5cbiAgICAjIFN0YXJ0IHRyYWNraW5nIGxvY2F0aW9uIGlmIHNldCBvciBzZXR0aW5nXG4gICAgaWYgQGxvYyBvciBAc2V0TG9jYXRpb25cbiAgICAgIEBsb2NhdGlvbkZpbmRlci5zdGFydFdhdGNoKClcblxuICAgIEByZW5kZXIoKVxuXG4gIHJlbmRlcjogLT5cbiAgICBAJGVsLmh0bWwgdGVtcGxhdGVzWydMb2NhdGlvblZpZXcnXSgpXG4gICAgaWYgbm90IEBsb2MgYW5kIG5vdCBAc2V0TG9jYXRpb25cbiAgICAgIEAkKFwiI2xvY2F0aW9uX3JlbGF0aXZlXCIpLnRleHQoXCJVbnNwZWNpZmllZCBsb2NhdGlvblwiKVxuICAgIGVsc2UgaWYgQHNldExvY2F0aW9uXG4gICAgICBAJChcIiNsb2NhdGlvbl9yZWxhdGl2ZVwiKS50ZXh0KFwiU2V0dGluZyBsb2NhdGlvbi4uLlwiKVxuICAgIGVsc2VcblxubW9kdWxlLmV4cG9ydHMgPSBMb2NhdGlvblZpZXciLCJjb21waWxlRG9jdW1lbnRTZWxlY3RvciA9IHJlcXVpcmUoJy4vc2VsZWN0b3InKS5jb21waWxlRG9jdW1lbnRTZWxlY3RvclxuY29tcGlsZVNvcnQgPSByZXF1aXJlKCcuL3NlbGVjdG9yJykuY29tcGlsZVNvcnRcbkdlb0pTT04gPSByZXF1aXJlICcuLi9HZW9KU09OJ1xuXG5jbGFzcyBMb2NhbERiXG4gIGNvbnN0cnVjdG9yOiAobmFtZSkgLT5cbiAgICBAbmFtZSA9IG5hbWVcblxuICBhZGRDb2xsZWN0aW9uOiAobmFtZSkgLT5cbiAgICBkYk5hbWUgPSBAbmFtZVxuICAgIG5hbWVzcGFjZSA9IFwiZGIuI3tkYk5hbWV9LiN7bmFtZX0uXCJcblxuICAgIEBbbmFtZV0gPSBuZXcgQ29sbGVjdGlvbihuYW1lc3BhY2UpXG5cbiAgcmVtb3ZlQ29sbGVjdGlvbjogKG5hbWUpIC0+XG4gICAgZGJOYW1lID0gQG5hbWVcbiAgICBuYW1lc3BhY2UgPSBcImRiLiN7ZGJOYW1lfS4je25hbWV9LlwiXG5cbiAgICBpZiB3aW5kb3cubG9jYWxTdG9yYWdlXG4gICAgICBrZXlzID0gW11cbiAgICAgIGZvciBpIGluIFswLi4ubG9jYWxTdG9yYWdlLmxlbmd0aF1cbiAgICAgICAga2V5cy5wdXNoKGxvY2FsU3RvcmFnZS5rZXkoaSkpXG5cbiAgICAgIGZvciBrZXkgaW4ga2V5c1xuICAgICAgICBpZiBrZXkuc3Vic3RyaW5nKDAsIG5hbWVzcGFjZS5sZW5ndGgpID09IG5hbWVzcGFjZVxuICAgICAgICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKGtleSlcblxuICAgIGRlbGV0ZSBAW25hbWVdXG5cbiMgU3RvcmVzIGRhdGEgaW4gbWVtb3J5LCBiYWNrZWQgYnkgbG9jYWwgc3RvcmFnZVxuY2xhc3MgQ29sbGVjdGlvblxuICBjb25zdHJ1Y3RvcjogKG5hbWVzcGFjZSkgLT5cbiAgICBAbmFtZXNwYWNlID0gbmFtZXNwYWNlXG5cbiAgICBAaXRlbXMgPSB7fVxuICAgIEB1cHNlcnRzID0ge30gICMgUGVuZGluZyB1cHNlcnRzIGJ5IF9pZC4gU3RpbGwgaW4gaXRlbXNcbiAgICBAcmVtb3ZlcyA9IHt9ICAjIFBlbmRpbmcgcmVtb3ZlcyBieSBfaWQuIE5vIGxvbmdlciBpbiBpdGVtc1xuXG4gICAgIyBSZWFkIGZyb20gbG9jYWwgc3RvcmFnZVxuICAgIGlmIHdpbmRvdy5sb2NhbFN0b3JhZ2VcbiAgICAgIEBsb2FkU3RvcmFnZSgpXG5cbiAgbG9hZFN0b3JhZ2U6IC0+XG4gICAgIyBSZWFkIGl0ZW1zIGZyb20gbG9jYWxTdG9yYWdlXG4gICAgQGl0ZW1OYW1lc3BhY2UgPSBAbmFtZXNwYWNlICsgXCJfXCJcblxuICAgIGZvciBpIGluIFswLi4ubG9jYWxTdG9yYWdlLmxlbmd0aF1cbiAgICAgIGtleSA9IGxvY2FsU3RvcmFnZS5rZXkoaSlcbiAgICAgIGlmIGtleS5zdWJzdHJpbmcoMCwgQGl0ZW1OYW1lc3BhY2UubGVuZ3RoKSA9PSBAaXRlbU5hbWVzcGFjZVxuICAgICAgICBpdGVtID0gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2Vba2V5XSlcbiAgICAgICAgQGl0ZW1zW2l0ZW0uX2lkXSA9IGl0ZW1cblxuICAgICMgUmVhZCB1cHNlcnRzXG4gICAgdXBzZXJ0S2V5cyA9IGlmIGxvY2FsU3RvcmFnZVtAbmFtZXNwYWNlK1widXBzZXJ0c1wiXSB0aGVuIEpTT04ucGFyc2UobG9jYWxTdG9yYWdlW0BuYW1lc3BhY2UrXCJ1cHNlcnRzXCJdKSBlbHNlIFtdXG4gICAgZm9yIGtleSBpbiB1cHNlcnRLZXlzXG4gICAgICBAdXBzZXJ0c1trZXldID0gQGl0ZW1zW2tleV1cblxuICAgICMgUmVhZCByZW1vdmVzXG4gICAgcmVtb3ZlSXRlbXMgPSBpZiBsb2NhbFN0b3JhZ2VbQG5hbWVzcGFjZStcInJlbW92ZXNcIl0gdGhlbiBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZVtAbmFtZXNwYWNlK1wicmVtb3Zlc1wiXSkgZWxzZSBbXVxuICAgIEByZW1vdmVzID0gXy5vYmplY3QoXy5wbHVjayhyZW1vdmVJdGVtcywgXCJfaWRcIiksIHJlbW92ZUl0ZW1zKVxuXG4gIGZpbmQ6IChzZWxlY3Rvciwgb3B0aW9ucykgLT5cbiAgICByZXR1cm4gZmV0Y2g6IChzdWNjZXNzLCBlcnJvcikgPT5cbiAgICAgIEBfZmluZEZldGNoKHNlbGVjdG9yLCBvcHRpb25zLCBzdWNjZXNzLCBlcnJvcilcblxuICBmaW5kT25lOiAoc2VsZWN0b3IsIG9wdGlvbnMsIHN1Y2Nlc3MsIGVycm9yKSAtPlxuICAgIGlmIF8uaXNGdW5jdGlvbihvcHRpb25zKSBcbiAgICAgIFtvcHRpb25zLCBzdWNjZXNzLCBlcnJvcl0gPSBbe30sIG9wdGlvbnMsIHN1Y2Nlc3NdXG5cbiAgICBAZmluZChzZWxlY3Rvciwgb3B0aW9ucykuZmV0Y2ggKHJlc3VsdHMpIC0+XG4gICAgICBpZiBzdWNjZXNzPyB0aGVuIHN1Y2Nlc3MoaWYgcmVzdWx0cy5sZW5ndGg+MCB0aGVuIHJlc3VsdHNbMF0gZWxzZSBudWxsKVxuICAgICwgZXJyb3JcblxuICBfZmluZEZldGNoOiAoc2VsZWN0b3IsIG9wdGlvbnMsIHN1Y2Nlc3MsIGVycm9yKSAtPlxuICAgIGZpbHRlcmVkID0gXy5maWx0ZXIoXy52YWx1ZXMoQGl0ZW1zKSwgY29tcGlsZURvY3VtZW50U2VsZWN0b3Ioc2VsZWN0b3IpKVxuXG4gICAgIyBIYW5kbGUgZ2Vvc3BhdGlhbCBvcGVyYXRvcnNcbiAgICBmaWx0ZXJlZCA9IHByb2Nlc3NOZWFyT3BlcmF0b3Ioc2VsZWN0b3IsIGZpbHRlcmVkKVxuICAgIGZpbHRlcmVkID0gcHJvY2Vzc0dlb0ludGVyc2VjdHNPcGVyYXRvcihzZWxlY3RvciwgZmlsdGVyZWQpXG5cbiAgICBpZiBvcHRpb25zIGFuZCBvcHRpb25zLnNvcnQgXG4gICAgICBmaWx0ZXJlZC5zb3J0KGNvbXBpbGVTb3J0KG9wdGlvbnMuc29ydCkpXG5cbiAgICBpZiBvcHRpb25zIGFuZCBvcHRpb25zLmxpbWl0XG4gICAgICBmaWx0ZXJlZCA9IF8uZmlyc3QgZmlsdGVyZWQsIG9wdGlvbnMubGltaXRcblxuICAgICMgQ2xvbmUgdG8gcHJldmVudCBhY2NpZGVudGFsIHVwZGF0ZXNcbiAgICBmaWx0ZXJlZCA9IF8ubWFwIGZpbHRlcmVkLCAoZG9jKSAtPiBfLmNsb25lRGVlcChkb2MpXG4gICAgaWYgc3VjY2Vzcz8gdGhlbiBzdWNjZXNzKGZpbHRlcmVkKVxuXG4gIHVwc2VydDogKGRvYywgc3VjY2VzcywgZXJyb3IpIC0+XG4gICAgaWYgbm90IGRvYy5faWRcbiAgICAgIGRvYy5faWQgPSBjcmVhdGVVaWQoKVxuXG4gICAgIyBSZXBsYWNlL2FkZCBcbiAgICBAX3B1dEl0ZW0oZG9jKVxuICAgIEBfcHV0VXBzZXJ0KGRvYylcblxuICAgIGlmIHN1Y2Nlc3M/IHRoZW4gc3VjY2Vzcyhkb2MpXG5cbiAgcmVtb3ZlOiAoaWQsIHN1Y2Nlc3MsIGVycm9yKSAtPlxuICAgIGlmIF8uaGFzKEBpdGVtcywgaWQpXG4gICAgICBAX3B1dFJlbW92ZShAaXRlbXNbaWRdKVxuICAgICAgQF9kZWxldGVJdGVtKGlkKVxuICAgICAgQF9kZWxldGVVcHNlcnQoaWQpXG5cbiAgICBpZiBzdWNjZXNzPyB0aGVuIHN1Y2Nlc3MoKVxuXG4gIF9wdXRJdGVtOiAoZG9jKSAtPlxuICAgIEBpdGVtc1tkb2MuX2lkXSA9IGRvY1xuICAgIGxvY2FsU3RvcmFnZVtAaXRlbU5hbWVzcGFjZSArIGRvYy5faWRdID0gSlNPTi5zdHJpbmdpZnkoZG9jKVxuXG4gIF9kZWxldGVJdGVtOiAoaWQpIC0+XG4gICAgZGVsZXRlIEBpdGVtc1tpZF1cblxuICBfcHV0VXBzZXJ0OiAoZG9jKSAtPlxuICAgIEB1cHNlcnRzW2RvYy5faWRdID0gZG9jXG4gICAgbG9jYWxTdG9yYWdlW0BuYW1lc3BhY2UrXCJ1cHNlcnRzXCJdID0gSlNPTi5zdHJpbmdpZnkoXy5rZXlzKEB1cHNlcnRzKSlcblxuICBfZGVsZXRlVXBzZXJ0OiAoaWQpIC0+XG4gICAgZGVsZXRlIEB1cHNlcnRzW2lkXVxuICAgIGxvY2FsU3RvcmFnZVtAbmFtZXNwYWNlK1widXBzZXJ0c1wiXSA9IEpTT04uc3RyaW5naWZ5KF8ua2V5cyhAdXBzZXJ0cykpXG5cbiAgX3B1dFJlbW92ZTogKGRvYykgLT5cbiAgICBAcmVtb3Zlc1tkb2MuX2lkXSA9IGRvY1xuICAgIGxvY2FsU3RvcmFnZVtAbmFtZXNwYWNlK1wicmVtb3Zlc1wiXSA9IEpTT04uc3RyaW5naWZ5KF8udmFsdWVzKEByZW1vdmVzKSlcblxuICBfZGVsZXRlUmVtb3ZlOiAoaWQpIC0+XG4gICAgZGVsZXRlIEByZW1vdmVzW2lkXVxuICAgIGxvY2FsU3RvcmFnZVtAbmFtZXNwYWNlK1wicmVtb3Zlc1wiXSA9IEpTT04uc3RyaW5naWZ5KF8udmFsdWVzKEByZW1vdmVzKSlcblxuICBjYWNoZTogKGRvY3MsIHNlbGVjdG9yLCBvcHRpb25zLCBzdWNjZXNzLCBlcnJvcikgLT5cbiAgICAjIEFkZCBhbGwgbm9uLWxvY2FsIHRoYXQgYXJlIG5vdCB1cHNlcnRlZCBvciByZW1vdmVkXG4gICAgZm9yIGRvYyBpbiBkb2NzXG4gICAgICBpZiBub3QgXy5oYXMoQHVwc2VydHMsIGRvYy5faWQpIGFuZCBub3QgXy5oYXMoQHJlbW92ZXMsIGRvYy5faWQpXG4gICAgICAgIEBfcHV0SXRlbShkb2MpXG5cbiAgICBkb2NzTWFwID0gXy5vYmplY3QoXy5wbHVjayhkb2NzLCBcIl9pZFwiKSwgZG9jcylcblxuICAgIGlmIG9wdGlvbnMuc29ydFxuICAgICAgc29ydCA9IGNvbXBpbGVTb3J0KG9wdGlvbnMuc29ydClcblxuICAgICMgUGVyZm9ybSBxdWVyeSwgcmVtb3Zpbmcgcm93cyBtaXNzaW5nIGluIGRvY3MgZnJvbSBsb2NhbCBkYiBcbiAgICBAZmluZChzZWxlY3Rvciwgb3B0aW9ucykuZmV0Y2ggKHJlc3VsdHMpID0+XG4gICAgICBmb3IgcmVzdWx0IGluIHJlc3VsdHNcbiAgICAgICAgaWYgbm90IGRvY3NNYXBbcmVzdWx0Ll9pZF0gYW5kIG5vdCBfLmhhcyhAdXBzZXJ0cywgcmVzdWx0Ll9pZClcbiAgICAgICAgICAjIElmIHBhc3QgZW5kIG9uIHNvcnRlZCBsaW1pdGVkLCBpZ25vcmVcbiAgICAgICAgICBpZiBvcHRpb25zLnNvcnQgYW5kIG9wdGlvbnMubGltaXQgYW5kIGRvY3MubGVuZ3RoID09IG9wdGlvbnMubGltaXRcbiAgICAgICAgICAgIGlmIHNvcnQocmVzdWx0LCBfLmxhc3QoZG9jcykpID49IDBcbiAgICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICBAX2RlbGV0ZUl0ZW0ocmVzdWx0Ll9pZClcblxuICAgICAgaWYgc3VjY2Vzcz8gdGhlbiBzdWNjZXNzKCkgIFxuICAgICwgZXJyb3JcbiAgICBcbiAgcGVuZGluZ1Vwc2VydHM6IChzdWNjZXNzKSAtPlxuICAgIHN1Y2Nlc3MgXy52YWx1ZXMoQHVwc2VydHMpXG5cbiAgcGVuZGluZ1JlbW92ZXM6IChzdWNjZXNzKSAtPlxuICAgIHN1Y2Nlc3MgXy5wbHVjayhAcmVtb3ZlcywgXCJfaWRcIilcblxuICByZXNvbHZlVXBzZXJ0OiAoZG9jLCBzdWNjZXNzKSAtPlxuICAgIGlmIEB1cHNlcnRzW2RvYy5faWRdIGFuZCBfLmlzRXF1YWwoZG9jLCBAdXBzZXJ0c1tkb2MuX2lkXSlcbiAgICAgIEBfZGVsZXRlVXBzZXJ0KGRvYy5faWQpXG4gICAgaWYgc3VjY2Vzcz8gdGhlbiBzdWNjZXNzKClcblxuICByZXNvbHZlUmVtb3ZlOiAoaWQsIHN1Y2Nlc3MpIC0+XG4gICAgQF9kZWxldGVSZW1vdmUoaWQpXG4gICAgaWYgc3VjY2Vzcz8gdGhlbiBzdWNjZXNzKClcblxuICAjIEFkZCBidXQgZG8gbm90IG92ZXJ3cml0ZSBvciByZWNvcmQgYXMgdXBzZXJ0XG4gIHNlZWQ6IChkb2MsIHN1Y2Nlc3MpIC0+XG4gICAgaWYgbm90IF8uaGFzKEBpdGVtcywgZG9jLl9pZCkgYW5kIG5vdCBfLmhhcyhAcmVtb3ZlcywgZG9jLl9pZClcbiAgICAgIEBfcHV0SXRlbShkb2MpXG4gICAgaWYgc3VjY2Vzcz8gdGhlbiBzdWNjZXNzKClcblxuXG5jcmVhdGVVaWQgPSAtPiBcbiAgJ3h4eHh4eHh4eHh4eDR4eHh5eHh4eHh4eHh4eHh4eHh4Jy5yZXBsYWNlKC9beHldL2csIChjKSAtPlxuICAgIHIgPSBNYXRoLnJhbmRvbSgpKjE2fDBcbiAgICB2ID0gaWYgYyA9PSAneCcgdGhlbiByIGVsc2UgKHImMHgzfDB4OClcbiAgICByZXR1cm4gdi50b1N0cmluZygxNilcbiAgIClcblxucHJvY2Vzc05lYXJPcGVyYXRvciA9IChzZWxlY3RvciwgbGlzdCkgLT5cbiAgZm9yIGtleSwgdmFsdWUgb2Ygc2VsZWN0b3JcbiAgICBpZiB2YWx1ZVsnJG5lYXInXVxuICAgICAgZ2VvID0gdmFsdWVbJyRuZWFyJ11bJyRnZW9tZXRyeSddXG4gICAgICBpZiBnZW8udHlwZSAhPSAnUG9pbnQnXG4gICAgICAgIGJyZWFrXG5cbiAgICAgIG5lYXIgPSBuZXcgTC5MYXRMbmcoZ2VvLmNvb3JkaW5hdGVzWzFdLCBnZW8uY29vcmRpbmF0ZXNbMF0pXG5cbiAgICAgIGxpc3QgPSBfLmZpbHRlciBsaXN0LCAoZG9jKSAtPlxuICAgICAgICByZXR1cm4gZG9jW2tleV0gYW5kIGRvY1trZXldLnR5cGUgPT0gJ1BvaW50J1xuXG4gICAgICAjIEdldCBkaXN0YW5jZXNcbiAgICAgIGRpc3RhbmNlcyA9IF8ubWFwIGxpc3QsIChkb2MpIC0+XG4gICAgICAgIHJldHVybiB7IGRvYzogZG9jLCBkaXN0YW5jZTogXG4gICAgICAgICAgbmVhci5kaXN0YW5jZVRvKG5ldyBMLkxhdExuZyhkb2Nba2V5XS5jb29yZGluYXRlc1sxXSwgZG9jW2tleV0uY29vcmRpbmF0ZXNbMF0pKVxuICAgICAgICB9XG5cbiAgICAgICMgRmlsdGVyIG5vbi1wb2ludHNcbiAgICAgIGRpc3RhbmNlcyA9IF8uZmlsdGVyIGRpc3RhbmNlcywgKGl0ZW0pIC0+IGl0ZW0uZGlzdGFuY2UgPj0gMFxuXG4gICAgICAjIFNvcnQgYnkgZGlzdGFuY2VcbiAgICAgIGRpc3RhbmNlcyA9IF8uc29ydEJ5IGRpc3RhbmNlcywgJ2Rpc3RhbmNlJ1xuXG4gICAgICAjIEZpbHRlciBieSBtYXhEaXN0YW5jZVxuICAgICAgaWYgdmFsdWVbJyRuZWFyJ11bJyRtYXhEaXN0YW5jZSddXG4gICAgICAgIGRpc3RhbmNlcyA9IF8uZmlsdGVyIGRpc3RhbmNlcywgKGl0ZW0pIC0+IGl0ZW0uZGlzdGFuY2UgPD0gdmFsdWVbJyRuZWFyJ11bJyRtYXhEaXN0YW5jZSddXG5cbiAgICAgICMgTGltaXQgdG8gMTAwXG4gICAgICBkaXN0YW5jZXMgPSBfLmZpcnN0IGRpc3RhbmNlcywgMTAwXG5cbiAgICAgICMgRXh0cmFjdCBkb2NzXG4gICAgICBsaXN0ID0gXy5wbHVjayBkaXN0YW5jZXMsICdkb2MnXG4gIHJldHVybiBsaXN0XG5cbnByb2Nlc3NHZW9JbnRlcnNlY3RzT3BlcmF0b3IgPSAoc2VsZWN0b3IsIGxpc3QpIC0+XG4gIGZvciBrZXksIHZhbHVlIG9mIHNlbGVjdG9yXG4gICAgaWYgdmFsdWVbJyRnZW9JbnRlcnNlY3RzJ11cbiAgICAgIGdlbyA9IHZhbHVlWyckZ2VvSW50ZXJzZWN0cyddWyckZ2VvbWV0cnknXVxuICAgICAgaWYgZ2VvLnR5cGUgIT0gJ1BvbHlnb24nXG4gICAgICAgIGJyZWFrXG5cbiAgICAgICMgQ2hlY2sgd2l0aGluIGZvciBlYWNoXG4gICAgICBsaXN0ID0gXy5maWx0ZXIgbGlzdCwgKGRvYykgLT5cbiAgICAgICAgIyBSZWplY3Qgbm9uLXBvaW50c1xuICAgICAgICBpZiBub3QgZG9jW2tleV0gb3IgZG9jW2tleV0udHlwZSAhPSAnUG9pbnQnXG4gICAgICAgICAgcmV0dXJuIGZhbHNlXG5cbiAgICAgICAgIyBDaGVjayBwb2x5Z29uXG4gICAgICAgIHJldHVybiBHZW9KU09OLnBvaW50SW5Qb2x5Z29uKGRvY1trZXldLCBnZW8pXG5cbiAgcmV0dXJuIGxpc3RcblxubW9kdWxlLmV4cG9ydHMgPSBMb2NhbERiXG4iLCIjIEltcHJvdmVkIGxvY2F0aW9uIGZpbmRlclxuY2xhc3MgTG9jYXRpb25GaW5kZXJcbiAgY29uc3RydWN0b3I6IChzdWNjZXNzLCBlcnJvcikgLT5cbiAgICBAc3VjY2VzcyA9IHN1Y2Nlc3NcbiAgICBAZXJyb3IgPSBlcnJvclxuXG4gIGdldExvY2F0aW9uOiAtPlxuICAgICMgQm90aCBmYWlsdXJlcyBhcmUgcmVxdWlyZWQgdG8gdHJpZ2dlciBlcnJvclxuICAgIGxvY2F0aW9uRXJyb3IgPSBfLmFmdGVyIDIsID0+XG4gICAgICBpZiBAZXJyb3I/IHRoZW4gQGVycm9yKClcblxuICAgIGhpZ2hBY2N1cmFjeUZpcmVkID0gZmFsc2VcblxuICAgIGxvd0FjY3VyYWN5ID0gKHBvcykgPT5cbiAgICAgIGlmIG5vdCBoaWdoQWNjdXJhY3lGaXJlZFxuICAgICAgICBAc3VjY2Vzcyhwb3MpXG5cbiAgICBoaWdoQWNjdXJhY3kgPSAocG9zKSA9PlxuICAgICAgaGlnaEFjY3VyYWN5RmlyZWQgPSB0cnVlXG4gICAgICBAc3VjY2Vzcyhwb3MpXG5cbiAgICAjIEdldCBib3RoIGhpZ2ggYW5kIGxvdyBhY2N1cmFjeSwgYXMgbG93IGlzIHN1ZmZpY2llbnQgZm9yIGluaXRpYWwgZGlzcGxheVxuICAgIG5hdmlnYXRvci5nZW9sb2NhdGlvbi5nZXRDdXJyZW50UG9zaXRpb24obG93QWNjdXJhY3ksIGxvY2F0aW9uRXJyb3IsIHtcbiAgICAgICAgbWF4aW11bUFnZSA6IDM2MDAqMjQsXG4gICAgICAgIHRpbWVvdXQgOiAxMDAwMCxcbiAgICAgICAgZW5hYmxlSGlnaEFjY3VyYWN5IDogZmFsc2VcbiAgICB9KVxuXG4gICAgbmF2aWdhdG9yLmdlb2xvY2F0aW9uLmdldEN1cnJlbnRQb3NpdGlvbihoaWdoQWNjdXJhY3ksIGxvY2F0aW9uRXJyb3IsIHtcbiAgICAgICAgbWF4aW11bUFnZSA6IDM2MDAsXG4gICAgICAgIHRpbWVvdXQgOiAzMDAwMCxcbiAgICAgICAgZW5hYmxlSGlnaEFjY3VyYWN5IDogdHJ1ZVxuICAgIH0pXG5cbiAgc3RhcnRXYXRjaDogLT5cbiAgICAjIEFsbG93IG9uZSB3YXRjaCBhdCBtb3N0XG4gICAgaWYgQGxvY2F0aW9uV2F0Y2hJZD9cbiAgICAgIHJldHVyblxuXG4gICAgaGlnaEFjY3VyYWN5RmlyZWQgPSBmYWxzZVxuICAgIGxvd0FjY3VyYWN5RmlyZWQgPSBmYWxzZVxuXG4gICAgbG93QWNjdXJhY3kgPSAocG9zKSA9PlxuICAgICAgaWYgbm90IGhpZ2hBY2N1cmFjeUZpcmVkXG4gICAgICAgIGxvd0FjY3VyYWN5RmlyZWQgPSB0cnVlXG4gICAgICAgIEBzdWNjZXNzKHBvcylcblxuICAgICMgRmlyZSBpbml0aWFsIGxvdy1hY2N1cmFjeSBvbmVcbiAgICBuYXZpZ2F0b3IuZ2VvbG9jYXRpb24uZ2V0Q3VycmVudFBvc2l0aW9uKGxvd0FjY3VyYWN5LCBudWxsLCB7XG4gICAgICAgIG1heGltdW1BZ2UgOiAzNjAwKjI0LFxuICAgICAgICB0aW1lb3V0IDogMTAwMDAsXG4gICAgICAgIGVuYWJsZUhpZ2hBY2N1cmFjeSA6IGZhbHNlXG4gICAgfSlcblxuICAgIHN1Y2Nlc3MgPSAocG9zKSA9PlxuICAgICAgaGlnaEFjY3VyYWN5RmlyZWQgPSB0cnVlXG4gICAgICBAc3VjY2Vzcyhwb3MpXG5cbiAgICBlcnJvciA9IChlcnJvcikgPT5cbiAgICAgICMgTm8gZXJyb3IgaWYgZmlyZWQgb25jZVxuICAgICAgaWYgbm90IGxvd0FjY3VyYWN5RmlyZWQgYW5kIG5vdCBoaWdoQWNjdXJhY3lGaXJlZFxuICAgICAgICBpZiBAZXJyb3I/IHRoZW4gQGVycm9yKGVycm9yKVxuXG4gICAgQGxvY2F0aW9uV2F0Y2hJZCA9IG5hdmlnYXRvci5nZW9sb2NhdGlvbi53YXRjaFBvc2l0aW9uKHN1Y2Nlc3MsIGVycm9yLCB7XG4gICAgICAgIG1heGltdW1BZ2UgOiAzMDAwLFxuICAgICAgICBlbmFibGVIaWdoQWNjdXJhY3kgOiB0cnVlXG4gICAgfSkgIFxuXG4gIHN0b3BXYXRjaDogLT5cbiAgICBpZiBAbG9jYXRpb25XYXRjaElkP1xuICAgICAgbmF2aWdhdG9yLmdlb2xvY2F0aW9uLmNsZWFyV2F0Y2goQGxvY2F0aW9uV2F0Y2hJZCk7XG4gICAgICBAbG9jYXRpb25XYXRjaElkID0gdW5kZWZpbmVkXG5cblxubW9kdWxlLmV4cG9ydHMgPSBMb2NhdGlvbkZpbmRlciAgIiwiLy8gVE9ETyBhZGQgbGljZW5zZVxuXG5Mb2NhbENvbGxlY3Rpb24gPSB7fTtcbkVKU09OID0gcmVxdWlyZShcIi4vRUpTT05cIik7XG5cbi8vIExpa2UgXy5pc0FycmF5LCBidXQgZG9lc24ndCByZWdhcmQgcG9seWZpbGxlZCBVaW50OEFycmF5cyBvbiBvbGQgYnJvd3NlcnMgYXNcbi8vIGFycmF5cy5cbnZhciBpc0FycmF5ID0gZnVuY3Rpb24gKHgpIHtcbiAgcmV0dXJuIF8uaXNBcnJheSh4KSAmJiAhRUpTT04uaXNCaW5hcnkoeCk7XG59O1xuXG52YXIgX2FueUlmQXJyYXkgPSBmdW5jdGlvbiAoeCwgZikge1xuICBpZiAoaXNBcnJheSh4KSlcbiAgICByZXR1cm4gXy5hbnkoeCwgZik7XG4gIHJldHVybiBmKHgpO1xufTtcblxudmFyIF9hbnlJZkFycmF5UGx1cyA9IGZ1bmN0aW9uICh4LCBmKSB7XG4gIGlmIChmKHgpKVxuICAgIHJldHVybiB0cnVlO1xuICByZXR1cm4gaXNBcnJheSh4KSAmJiBfLmFueSh4LCBmKTtcbn07XG5cbnZhciBoYXNPcGVyYXRvcnMgPSBmdW5jdGlvbih2YWx1ZVNlbGVjdG9yKSB7XG4gIHZhciB0aGVzZUFyZU9wZXJhdG9ycyA9IHVuZGVmaW5lZDtcbiAgZm9yICh2YXIgc2VsS2V5IGluIHZhbHVlU2VsZWN0b3IpIHtcbiAgICB2YXIgdGhpc0lzT3BlcmF0b3IgPSBzZWxLZXkuc3Vic3RyKDAsIDEpID09PSAnJCc7XG4gICAgaWYgKHRoZXNlQXJlT3BlcmF0b3JzID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoZXNlQXJlT3BlcmF0b3JzID0gdGhpc0lzT3BlcmF0b3I7XG4gICAgfSBlbHNlIGlmICh0aGVzZUFyZU9wZXJhdG9ycyAhPT0gdGhpc0lzT3BlcmF0b3IpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkluY29uc2lzdGVudCBzZWxlY3RvcjogXCIgKyB2YWx1ZVNlbGVjdG9yKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuICEhdGhlc2VBcmVPcGVyYXRvcnM7ICAvLyB7fSBoYXMgbm8gb3BlcmF0b3JzXG59O1xuXG52YXIgY29tcGlsZVZhbHVlU2VsZWN0b3IgPSBmdW5jdGlvbiAodmFsdWVTZWxlY3Rvcikge1xuICBpZiAodmFsdWVTZWxlY3RvciA9PSBudWxsKSB7ICAvLyB1bmRlZmluZWQgb3IgbnVsbFxuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJldHVybiBfYW55SWZBcnJheSh2YWx1ZSwgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIHggPT0gbnVsbDsgIC8vIHVuZGVmaW5lZCBvciBudWxsXG4gICAgICB9KTtcbiAgICB9O1xuICB9XG5cbiAgLy8gU2VsZWN0b3IgaXMgYSBub24tbnVsbCBwcmltaXRpdmUgKGFuZCBub3QgYW4gYXJyYXkgb3IgUmVnRXhwIGVpdGhlcikuXG4gIGlmICghXy5pc09iamVjdCh2YWx1ZVNlbGVjdG9yKSkge1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJldHVybiBfYW55SWZBcnJheSh2YWx1ZSwgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIHggPT09IHZhbHVlU2VsZWN0b3I7XG4gICAgICB9KTtcbiAgICB9O1xuICB9XG5cbiAgaWYgKHZhbHVlU2VsZWN0b3IgaW5zdGFuY2VvZiBSZWdFeHApIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZClcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgcmV0dXJuIF9hbnlJZkFycmF5KHZhbHVlLCBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4gdmFsdWVTZWxlY3Rvci50ZXN0KHgpO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfVxuXG4gIC8vIEFycmF5cyBtYXRjaCBlaXRoZXIgaWRlbnRpY2FsIGFycmF5cyBvciBhcnJheXMgdGhhdCBjb250YWluIGl0IGFzIGEgdmFsdWUuXG4gIGlmIChpc0FycmF5KHZhbHVlU2VsZWN0b3IpKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgaWYgKCFpc0FycmF5KHZhbHVlKSlcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgcmV0dXJuIF9hbnlJZkFycmF5UGx1cyh2YWx1ZSwgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIExvY2FsQ29sbGVjdGlvbi5fZi5fZXF1YWwodmFsdWVTZWxlY3RvciwgeCk7XG4gICAgICB9KTtcbiAgICB9O1xuICB9XG5cbiAgLy8gSXQncyBhbiBvYmplY3QsIGJ1dCBub3QgYW4gYXJyYXkgb3IgcmVnZXhwLlxuICBpZiAoaGFzT3BlcmF0b3JzKHZhbHVlU2VsZWN0b3IpKSB7XG4gICAgdmFyIG9wZXJhdG9yRnVuY3Rpb25zID0gW107XG4gICAgXy5lYWNoKHZhbHVlU2VsZWN0b3IsIGZ1bmN0aW9uIChvcGVyYW5kLCBvcGVyYXRvcikge1xuICAgICAgaWYgKCFfLmhhcyhWQUxVRV9PUEVSQVRPUlMsIG9wZXJhdG9yKSlcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5yZWNvZ25pemVkIG9wZXJhdG9yOiBcIiArIG9wZXJhdG9yKTtcbiAgICAgIG9wZXJhdG9yRnVuY3Rpb25zLnB1c2goVkFMVUVfT1BFUkFUT1JTW29wZXJhdG9yXShcbiAgICAgICAgb3BlcmFuZCwgdmFsdWVTZWxlY3Rvci4kb3B0aW9ucykpO1xuICAgIH0pO1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJldHVybiBfLmFsbChvcGVyYXRvckZ1bmN0aW9ucywgZnVuY3Rpb24gKGYpIHtcbiAgICAgICAgcmV0dXJuIGYodmFsdWUpO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfVxuXG4gIC8vIEl0J3MgYSBsaXRlcmFsOyBjb21wYXJlIHZhbHVlIChvciBlbGVtZW50IG9mIHZhbHVlIGFycmF5KSBkaXJlY3RseSB0byB0aGVcbiAgLy8gc2VsZWN0b3IuXG4gIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICByZXR1cm4gX2FueUlmQXJyYXkodmFsdWUsIGZ1bmN0aW9uICh4KSB7XG4gICAgICByZXR1cm4gTG9jYWxDb2xsZWN0aW9uLl9mLl9lcXVhbCh2YWx1ZVNlbGVjdG9yLCB4KTtcbiAgICB9KTtcbiAgfTtcbn07XG5cbi8vIFhYWCBjYW4gZmFjdG9yIG91dCBjb21tb24gbG9naWMgYmVsb3dcbnZhciBMT0dJQ0FMX09QRVJBVE9SUyA9IHtcbiAgXCIkYW5kXCI6IGZ1bmN0aW9uKHN1YlNlbGVjdG9yKSB7XG4gICAgaWYgKCFpc0FycmF5KHN1YlNlbGVjdG9yKSB8fCBfLmlzRW1wdHkoc3ViU2VsZWN0b3IpKVxuICAgICAgdGhyb3cgRXJyb3IoXCIkYW5kLyRvci8kbm9yIG11c3QgYmUgbm9uZW1wdHkgYXJyYXlcIik7XG4gICAgdmFyIHN1YlNlbGVjdG9yRnVuY3Rpb25zID0gXy5tYXAoXG4gICAgICBzdWJTZWxlY3RvciwgY29tcGlsZURvY3VtZW50U2VsZWN0b3IpO1xuICAgIHJldHVybiBmdW5jdGlvbiAoZG9jKSB7XG4gICAgICByZXR1cm4gXy5hbGwoc3ViU2VsZWN0b3JGdW5jdGlvbnMsIGZ1bmN0aW9uIChmKSB7XG4gICAgICAgIHJldHVybiBmKGRvYyk7XG4gICAgICB9KTtcbiAgICB9O1xuICB9LFxuXG4gIFwiJG9yXCI6IGZ1bmN0aW9uKHN1YlNlbGVjdG9yKSB7XG4gICAgaWYgKCFpc0FycmF5KHN1YlNlbGVjdG9yKSB8fCBfLmlzRW1wdHkoc3ViU2VsZWN0b3IpKVxuICAgICAgdGhyb3cgRXJyb3IoXCIkYW5kLyRvci8kbm9yIG11c3QgYmUgbm9uZW1wdHkgYXJyYXlcIik7XG4gICAgdmFyIHN1YlNlbGVjdG9yRnVuY3Rpb25zID0gXy5tYXAoXG4gICAgICBzdWJTZWxlY3RvciwgY29tcGlsZURvY3VtZW50U2VsZWN0b3IpO1xuICAgIHJldHVybiBmdW5jdGlvbiAoZG9jKSB7XG4gICAgICByZXR1cm4gXy5hbnkoc3ViU2VsZWN0b3JGdW5jdGlvbnMsIGZ1bmN0aW9uIChmKSB7XG4gICAgICAgIHJldHVybiBmKGRvYyk7XG4gICAgICB9KTtcbiAgICB9O1xuICB9LFxuXG4gIFwiJG5vclwiOiBmdW5jdGlvbihzdWJTZWxlY3Rvcikge1xuICAgIGlmICghaXNBcnJheShzdWJTZWxlY3RvcikgfHwgXy5pc0VtcHR5KHN1YlNlbGVjdG9yKSlcbiAgICAgIHRocm93IEVycm9yKFwiJGFuZC8kb3IvJG5vciBtdXN0IGJlIG5vbmVtcHR5IGFycmF5XCIpO1xuICAgIHZhciBzdWJTZWxlY3RvckZ1bmN0aW9ucyA9IF8ubWFwKFxuICAgICAgc3ViU2VsZWN0b3IsIGNvbXBpbGVEb2N1bWVudFNlbGVjdG9yKTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGRvYykge1xuICAgICAgcmV0dXJuIF8uYWxsKHN1YlNlbGVjdG9yRnVuY3Rpb25zLCBmdW5jdGlvbiAoZikge1xuICAgICAgICByZXR1cm4gIWYoZG9jKTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0sXG5cbiAgXCIkd2hlcmVcIjogZnVuY3Rpb24oc2VsZWN0b3JWYWx1ZSkge1xuICAgIGlmICghKHNlbGVjdG9yVmFsdWUgaW5zdGFuY2VvZiBGdW5jdGlvbikpIHtcbiAgICAgIHNlbGVjdG9yVmFsdWUgPSBGdW5jdGlvbihcInJldHVybiBcIiArIHNlbGVjdG9yVmFsdWUpO1xuICAgIH1cbiAgICByZXR1cm4gZnVuY3Rpb24gKGRvYykge1xuICAgICAgcmV0dXJuIHNlbGVjdG9yVmFsdWUuY2FsbChkb2MpO1xuICAgIH07XG4gIH1cbn07XG5cbnZhciBWQUxVRV9PUEVSQVRPUlMgPSB7XG4gIFwiJGluXCI6IGZ1bmN0aW9uIChvcGVyYW5kKSB7XG4gICAgaWYgKCFpc0FycmF5KG9wZXJhbmQpKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQXJndW1lbnQgdG8gJGluIG11c3QgYmUgYXJyYXlcIik7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgcmV0dXJuIF9hbnlJZkFycmF5UGx1cyh2YWx1ZSwgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIF8uYW55KG9wZXJhbmQsIGZ1bmN0aW9uIChvcGVyYW5kRWx0KSB7XG4gICAgICAgICAgcmV0dXJuIExvY2FsQ29sbGVjdGlvbi5fZi5fZXF1YWwob3BlcmFuZEVsdCwgeCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSxcblxuICBcIiRhbGxcIjogZnVuY3Rpb24gKG9wZXJhbmQpIHtcbiAgICBpZiAoIWlzQXJyYXkob3BlcmFuZCkpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJBcmd1bWVudCB0byAkYWxsIG11c3QgYmUgYXJyYXlcIik7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgaWYgKCFpc0FycmF5KHZhbHVlKSlcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgcmV0dXJuIF8uYWxsKG9wZXJhbmQsIGZ1bmN0aW9uIChvcGVyYW5kRWx0KSB7XG4gICAgICAgIHJldHVybiBfLmFueSh2YWx1ZSwgZnVuY3Rpb24gKHZhbHVlRWx0KSB7XG4gICAgICAgICAgcmV0dXJuIExvY2FsQ29sbGVjdGlvbi5fZi5fZXF1YWwob3BlcmFuZEVsdCwgdmFsdWVFbHQpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0sXG5cbiAgXCIkbHRcIjogZnVuY3Rpb24gKG9wZXJhbmQpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICByZXR1cm4gX2FueUlmQXJyYXkodmFsdWUsIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiBMb2NhbENvbGxlY3Rpb24uX2YuX2NtcCh4LCBvcGVyYW5kKSA8IDA7XG4gICAgICB9KTtcbiAgICB9O1xuICB9LFxuXG4gIFwiJGx0ZVwiOiBmdW5jdGlvbiAob3BlcmFuZCkge1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJldHVybiBfYW55SWZBcnJheSh2YWx1ZSwgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIExvY2FsQ29sbGVjdGlvbi5fZi5fY21wKHgsIG9wZXJhbmQpIDw9IDA7XG4gICAgICB9KTtcbiAgICB9O1xuICB9LFxuXG4gIFwiJGd0XCI6IGZ1bmN0aW9uIChvcGVyYW5kKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgcmV0dXJuIF9hbnlJZkFycmF5KHZhbHVlLCBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4gTG9jYWxDb2xsZWN0aW9uLl9mLl9jbXAoeCwgb3BlcmFuZCkgPiAwO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSxcblxuICBcIiRndGVcIjogZnVuY3Rpb24gKG9wZXJhbmQpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICByZXR1cm4gX2FueUlmQXJyYXkodmFsdWUsIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiBMb2NhbENvbGxlY3Rpb24uX2YuX2NtcCh4LCBvcGVyYW5kKSA+PSAwO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSxcblxuICBcIiRuZVwiOiBmdW5jdGlvbiAob3BlcmFuZCkge1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJldHVybiAhIF9hbnlJZkFycmF5UGx1cyh2YWx1ZSwgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIExvY2FsQ29sbGVjdGlvbi5fZi5fZXF1YWwoeCwgb3BlcmFuZCk7XG4gICAgICB9KTtcbiAgICB9O1xuICB9LFxuXG4gIFwiJG5pblwiOiBmdW5jdGlvbiAob3BlcmFuZCkge1xuICAgIGlmICghaXNBcnJheShvcGVyYW5kKSlcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkFyZ3VtZW50IHRvICRuaW4gbXVzdCBiZSBhcnJheVwiKTtcbiAgICB2YXIgaW5GdW5jdGlvbiA9IFZBTFVFX09QRVJBVE9SUy4kaW4ob3BlcmFuZCk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgLy8gRmllbGQgZG9lc24ndCBleGlzdCwgc28gaXQncyBub3QtaW4gb3BlcmFuZFxuICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgcmV0dXJuICFpbkZ1bmN0aW9uKHZhbHVlKTtcbiAgICB9O1xuICB9LFxuXG4gIFwiJGV4aXN0c1wiOiBmdW5jdGlvbiAob3BlcmFuZCkge1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJldHVybiBvcGVyYW5kID09PSAodmFsdWUgIT09IHVuZGVmaW5lZCk7XG4gICAgfTtcbiAgfSxcblxuICBcIiRtb2RcIjogZnVuY3Rpb24gKG9wZXJhbmQpIHtcbiAgICB2YXIgZGl2aXNvciA9IG9wZXJhbmRbMF0sXG4gICAgICAgIHJlbWFpbmRlciA9IG9wZXJhbmRbMV07XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgcmV0dXJuIF9hbnlJZkFycmF5KHZhbHVlLCBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4geCAlIGRpdmlzb3IgPT09IHJlbWFpbmRlcjtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0sXG5cbiAgXCIkc2l6ZVwiOiBmdW5jdGlvbiAob3BlcmFuZCkge1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJldHVybiBpc0FycmF5KHZhbHVlKSAmJiBvcGVyYW5kID09PSB2YWx1ZS5sZW5ndGg7XG4gICAgfTtcbiAgfSxcblxuICBcIiR0eXBlXCI6IGZ1bmN0aW9uIChvcGVyYW5kKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgLy8gQSBub25leGlzdGVudCBmaWVsZCBpcyBvZiBubyB0eXBlLlxuICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIC8vIERlZmluaXRlbHkgbm90IF9hbnlJZkFycmF5UGx1czogJHR5cGU6IDQgb25seSBtYXRjaGVzIGFycmF5cyB0aGF0IGhhdmVcbiAgICAgIC8vIGFycmF5cyBhcyBlbGVtZW50cyBhY2NvcmRpbmcgdG8gdGhlIE1vbmdvIGRvY3MuXG4gICAgICByZXR1cm4gX2FueUlmQXJyYXkodmFsdWUsIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiBMb2NhbENvbGxlY3Rpb24uX2YuX3R5cGUoeCkgPT09IG9wZXJhbmQ7XG4gICAgICB9KTtcbiAgICB9O1xuICB9LFxuXG4gIFwiJHJlZ2V4XCI6IGZ1bmN0aW9uIChvcGVyYW5kLCBvcHRpb25zKSB7XG4gICAgaWYgKG9wdGlvbnMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgLy8gT3B0aW9ucyBwYXNzZWQgaW4gJG9wdGlvbnMgKGV2ZW4gdGhlIGVtcHR5IHN0cmluZykgYWx3YXlzIG92ZXJyaWRlc1xuICAgICAgLy8gb3B0aW9ucyBpbiB0aGUgUmVnRXhwIG9iamVjdCBpdHNlbGYuXG5cbiAgICAgIC8vIEJlIGNsZWFyIHRoYXQgd2Ugb25seSBzdXBwb3J0IHRoZSBKUy1zdXBwb3J0ZWQgb3B0aW9ucywgbm90IGV4dGVuZGVkXG4gICAgICAvLyBvbmVzIChlZywgTW9uZ28gc3VwcG9ydHMgeCBhbmQgcykuIElkZWFsbHkgd2Ugd291bGQgaW1wbGVtZW50IHggYW5kIHNcbiAgICAgIC8vIGJ5IHRyYW5zZm9ybWluZyB0aGUgcmVnZXhwLCBidXQgbm90IHRvZGF5Li4uXG4gICAgICBpZiAoL1teZ2ltXS8udGVzdChvcHRpb25zKSlcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiT25seSB0aGUgaSwgbSwgYW5kIGcgcmVnZXhwIG9wdGlvbnMgYXJlIHN1cHBvcnRlZFwiKTtcblxuICAgICAgdmFyIHJlZ2V4U291cmNlID0gb3BlcmFuZCBpbnN0YW5jZW9mIFJlZ0V4cCA/IG9wZXJhbmQuc291cmNlIDogb3BlcmFuZDtcbiAgICAgIG9wZXJhbmQgPSBuZXcgUmVnRXhwKHJlZ2V4U291cmNlLCBvcHRpb25zKTtcbiAgICB9IGVsc2UgaWYgKCEob3BlcmFuZCBpbnN0YW5jZW9mIFJlZ0V4cCkpIHtcbiAgICAgIG9wZXJhbmQgPSBuZXcgUmVnRXhwKG9wZXJhbmQpO1xuICAgIH1cblxuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICByZXR1cm4gX2FueUlmQXJyYXkodmFsdWUsIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiBvcGVyYW5kLnRlc3QoeCk7XG4gICAgICB9KTtcbiAgICB9O1xuICB9LFxuXG4gIFwiJG9wdGlvbnNcIjogZnVuY3Rpb24gKG9wZXJhbmQpIHtcbiAgICAvLyBldmFsdWF0aW9uIGhhcHBlbnMgYXQgdGhlICRyZWdleCBmdW5jdGlvbiBhYm92ZVxuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHsgcmV0dXJuIHRydWU7IH07XG4gIH0sXG5cbiAgXCIkZWxlbU1hdGNoXCI6IGZ1bmN0aW9uIChvcGVyYW5kKSB7XG4gICAgdmFyIG1hdGNoZXIgPSBjb21waWxlRG9jdW1lbnRTZWxlY3RvcihvcGVyYW5kKTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICBpZiAoIWlzQXJyYXkodmFsdWUpKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICByZXR1cm4gXy5hbnkodmFsdWUsIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiBtYXRjaGVyKHgpO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSxcblxuICBcIiRub3RcIjogZnVuY3Rpb24gKG9wZXJhbmQpIHtcbiAgICB2YXIgbWF0Y2hlciA9IGNvbXBpbGVWYWx1ZVNlbGVjdG9yKG9wZXJhbmQpO1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJldHVybiAhbWF0Y2hlcih2YWx1ZSk7XG4gICAgfTtcbiAgfSxcblxuICBcIiRuZWFyXCI6IGZ1bmN0aW9uIChvcGVyYW5kKSB7XG4gICAgLy8gQWx3YXlzIHJldHVybnMgdHJ1ZS4gTXVzdCBiZSBoYW5kbGVkIGluIHBvc3QtZmlsdGVyL3NvcnQvbGltaXRcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH0sXG5cbiAgXCIkZ2VvSW50ZXJzZWN0c1wiOiBmdW5jdGlvbiAob3BlcmFuZCkge1xuICAgIC8vIEFsd2F5cyByZXR1cm5zIHRydWUuIE11c3QgYmUgaGFuZGxlZCBpbiBwb3N0LWZpbHRlci9zb3J0L2xpbWl0XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG5cbn07XG5cbi8vIGhlbHBlcnMgdXNlZCBieSBjb21waWxlZCBzZWxlY3RvciBjb2RlXG5Mb2NhbENvbGxlY3Rpb24uX2YgPSB7XG4gIC8vIFhYWCBmb3IgX2FsbCBhbmQgX2luLCBjb25zaWRlciBidWlsZGluZyAnaW5xdWVyeScgYXQgY29tcGlsZSB0aW1lLi5cblxuICBfdHlwZTogZnVuY3Rpb24gKHYpIHtcbiAgICBpZiAodHlwZW9mIHYgPT09IFwibnVtYmVyXCIpXG4gICAgICByZXR1cm4gMTtcbiAgICBpZiAodHlwZW9mIHYgPT09IFwic3RyaW5nXCIpXG4gICAgICByZXR1cm4gMjtcbiAgICBpZiAodHlwZW9mIHYgPT09IFwiYm9vbGVhblwiKVxuICAgICAgcmV0dXJuIDg7XG4gICAgaWYgKGlzQXJyYXkodikpXG4gICAgICByZXR1cm4gNDtcbiAgICBpZiAodiA9PT0gbnVsbClcbiAgICAgIHJldHVybiAxMDtcbiAgICBpZiAodiBpbnN0YW5jZW9mIFJlZ0V4cClcbiAgICAgIHJldHVybiAxMTtcbiAgICBpZiAodHlwZW9mIHYgPT09IFwiZnVuY3Rpb25cIilcbiAgICAgIC8vIG5vdGUgdGhhdCB0eXBlb2YoL3gvKSA9PT0gXCJmdW5jdGlvblwiXG4gICAgICByZXR1cm4gMTM7XG4gICAgaWYgKHYgaW5zdGFuY2VvZiBEYXRlKVxuICAgICAgcmV0dXJuIDk7XG4gICAgaWYgKEVKU09OLmlzQmluYXJ5KHYpKVxuICAgICAgcmV0dXJuIDU7XG4gICAgaWYgKHYgaW5zdGFuY2VvZiBNZXRlb3IuQ29sbGVjdGlvbi5PYmplY3RJRClcbiAgICAgIHJldHVybiA3O1xuICAgIHJldHVybiAzOyAvLyBvYmplY3RcblxuICAgIC8vIFhYWCBzdXBwb3J0IHNvbWUvYWxsIG9mIHRoZXNlOlxuICAgIC8vIDE0LCBzeW1ib2xcbiAgICAvLyAxNSwgamF2YXNjcmlwdCBjb2RlIHdpdGggc2NvcGVcbiAgICAvLyAxNiwgMTg6IDMyLWJpdC82NC1iaXQgaW50ZWdlclxuICAgIC8vIDE3LCB0aW1lc3RhbXBcbiAgICAvLyAyNTUsIG1pbmtleVxuICAgIC8vIDEyNywgbWF4a2V5XG4gIH0sXG5cbiAgLy8gZGVlcCBlcXVhbGl0eSB0ZXN0OiB1c2UgZm9yIGxpdGVyYWwgZG9jdW1lbnQgYW5kIGFycmF5IG1hdGNoZXNcbiAgX2VxdWFsOiBmdW5jdGlvbiAoYSwgYikge1xuICAgIHJldHVybiBFSlNPTi5lcXVhbHMoYSwgYiwge2tleU9yZGVyU2Vuc2l0aXZlOiB0cnVlfSk7XG4gIH0sXG5cbiAgLy8gbWFwcyBhIHR5cGUgY29kZSB0byBhIHZhbHVlIHRoYXQgY2FuIGJlIHVzZWQgdG8gc29ydCB2YWx1ZXMgb2ZcbiAgLy8gZGlmZmVyZW50IHR5cGVzXG4gIF90eXBlb3JkZXI6IGZ1bmN0aW9uICh0KSB7XG4gICAgLy8gaHR0cDovL3d3dy5tb25nb2RiLm9yZy9kaXNwbGF5L0RPQ1MvV2hhdCtpcyt0aGUrQ29tcGFyZStPcmRlcitmb3IrQlNPTitUeXBlc1xuICAgIC8vIFhYWCB3aGF0IGlzIHRoZSBjb3JyZWN0IHNvcnQgcG9zaXRpb24gZm9yIEphdmFzY3JpcHQgY29kZT9cbiAgICAvLyAoJzEwMCcgaW4gdGhlIG1hdHJpeCBiZWxvdylcbiAgICAvLyBYWFggbWlua2V5L21heGtleVxuICAgIHJldHVybiBbLTEsICAvLyAobm90IGEgdHlwZSlcbiAgICAgICAgICAgIDEsICAgLy8gbnVtYmVyXG4gICAgICAgICAgICAyLCAgIC8vIHN0cmluZ1xuICAgICAgICAgICAgMywgICAvLyBvYmplY3RcbiAgICAgICAgICAgIDQsICAgLy8gYXJyYXlcbiAgICAgICAgICAgIDUsICAgLy8gYmluYXJ5XG4gICAgICAgICAgICAtMSwgIC8vIGRlcHJlY2F0ZWRcbiAgICAgICAgICAgIDYsICAgLy8gT2JqZWN0SURcbiAgICAgICAgICAgIDcsICAgLy8gYm9vbFxuICAgICAgICAgICAgOCwgICAvLyBEYXRlXG4gICAgICAgICAgICAwLCAgIC8vIG51bGxcbiAgICAgICAgICAgIDksICAgLy8gUmVnRXhwXG4gICAgICAgICAgICAtMSwgIC8vIGRlcHJlY2F0ZWRcbiAgICAgICAgICAgIDEwMCwgLy8gSlMgY29kZVxuICAgICAgICAgICAgMiwgICAvLyBkZXByZWNhdGVkIChzeW1ib2wpXG4gICAgICAgICAgICAxMDAsIC8vIEpTIGNvZGVcbiAgICAgICAgICAgIDEsICAgLy8gMzItYml0IGludFxuICAgICAgICAgICAgOCwgICAvLyBNb25nbyB0aW1lc3RhbXBcbiAgICAgICAgICAgIDEgICAgLy8gNjQtYml0IGludFxuICAgICAgICAgICBdW3RdO1xuICB9LFxuXG4gIC8vIGNvbXBhcmUgdHdvIHZhbHVlcyBvZiB1bmtub3duIHR5cGUgYWNjb3JkaW5nIHRvIEJTT04gb3JkZXJpbmdcbiAgLy8gc2VtYW50aWNzLiAoYXMgYW4gZXh0ZW5zaW9uLCBjb25zaWRlciAndW5kZWZpbmVkJyB0byBiZSBsZXNzIHRoYW5cbiAgLy8gYW55IG90aGVyIHZhbHVlLikgcmV0dXJuIG5lZ2F0aXZlIGlmIGEgaXMgbGVzcywgcG9zaXRpdmUgaWYgYiBpc1xuICAvLyBsZXNzLCBvciAwIGlmIGVxdWFsXG4gIF9jbXA6IGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgaWYgKGEgPT09IHVuZGVmaW5lZClcbiAgICAgIHJldHVybiBiID09PSB1bmRlZmluZWQgPyAwIDogLTE7XG4gICAgaWYgKGIgPT09IHVuZGVmaW5lZClcbiAgICAgIHJldHVybiAxO1xuICAgIHZhciB0YSA9IExvY2FsQ29sbGVjdGlvbi5fZi5fdHlwZShhKTtcbiAgICB2YXIgdGIgPSBMb2NhbENvbGxlY3Rpb24uX2YuX3R5cGUoYik7XG4gICAgdmFyIG9hID0gTG9jYWxDb2xsZWN0aW9uLl9mLl90eXBlb3JkZXIodGEpO1xuICAgIHZhciBvYiA9IExvY2FsQ29sbGVjdGlvbi5fZi5fdHlwZW9yZGVyKHRiKTtcbiAgICBpZiAob2EgIT09IG9iKVxuICAgICAgcmV0dXJuIG9hIDwgb2IgPyAtMSA6IDE7XG4gICAgaWYgKHRhICE9PSB0YilcbiAgICAgIC8vIFhYWCBuZWVkIHRvIGltcGxlbWVudCB0aGlzIGlmIHdlIGltcGxlbWVudCBTeW1ib2wgb3IgaW50ZWdlcnMsIG9yXG4gICAgICAvLyBUaW1lc3RhbXBcbiAgICAgIHRocm93IEVycm9yKFwiTWlzc2luZyB0eXBlIGNvZXJjaW9uIGxvZ2ljIGluIF9jbXBcIik7XG4gICAgaWYgKHRhID09PSA3KSB7IC8vIE9iamVjdElEXG4gICAgICAvLyBDb252ZXJ0IHRvIHN0cmluZy5cbiAgICAgIHRhID0gdGIgPSAyO1xuICAgICAgYSA9IGEudG9IZXhTdHJpbmcoKTtcbiAgICAgIGIgPSBiLnRvSGV4U3RyaW5nKCk7XG4gICAgfVxuICAgIGlmICh0YSA9PT0gOSkgeyAvLyBEYXRlXG4gICAgICAvLyBDb252ZXJ0IHRvIG1pbGxpcy5cbiAgICAgIHRhID0gdGIgPSAxO1xuICAgICAgYSA9IGEuZ2V0VGltZSgpO1xuICAgICAgYiA9IGIuZ2V0VGltZSgpO1xuICAgIH1cblxuICAgIGlmICh0YSA9PT0gMSkgLy8gZG91YmxlXG4gICAgICByZXR1cm4gYSAtIGI7XG4gICAgaWYgKHRiID09PSAyKSAvLyBzdHJpbmdcbiAgICAgIHJldHVybiBhIDwgYiA/IC0xIDogKGEgPT09IGIgPyAwIDogMSk7XG4gICAgaWYgKHRhID09PSAzKSB7IC8vIE9iamVjdFxuICAgICAgLy8gdGhpcyBjb3VsZCBiZSBtdWNoIG1vcmUgZWZmaWNpZW50IGluIHRoZSBleHBlY3RlZCBjYXNlIC4uLlxuICAgICAgdmFyIHRvX2FycmF5ID0gZnVuY3Rpb24gKG9iaikge1xuICAgICAgICB2YXIgcmV0ID0gW107XG4gICAgICAgIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICAgICAgICByZXQucHVzaChrZXkpO1xuICAgICAgICAgIHJldC5wdXNoKG9ialtrZXldKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgfTtcbiAgICAgIHJldHVybiBMb2NhbENvbGxlY3Rpb24uX2YuX2NtcCh0b19hcnJheShhKSwgdG9fYXJyYXkoYikpO1xuICAgIH1cbiAgICBpZiAodGEgPT09IDQpIHsgLy8gQXJyYXlcbiAgICAgIGZvciAodmFyIGkgPSAwOyA7IGkrKykge1xuICAgICAgICBpZiAoaSA9PT0gYS5sZW5ndGgpXG4gICAgICAgICAgcmV0dXJuIChpID09PSBiLmxlbmd0aCkgPyAwIDogLTE7XG4gICAgICAgIGlmIChpID09PSBiLmxlbmd0aClcbiAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgdmFyIHMgPSBMb2NhbENvbGxlY3Rpb24uX2YuX2NtcChhW2ldLCBiW2ldKTtcbiAgICAgICAgaWYgKHMgIT09IDApXG4gICAgICAgICAgcmV0dXJuIHM7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICh0YSA9PT0gNSkgeyAvLyBiaW5hcnlcbiAgICAgIC8vIFN1cnByaXNpbmdseSwgYSBzbWFsbCBiaW5hcnkgYmxvYiBpcyBhbHdheXMgbGVzcyB0aGFuIGEgbGFyZ2Ugb25lIGluXG4gICAgICAvLyBNb25nby5cbiAgICAgIGlmIChhLmxlbmd0aCAhPT0gYi5sZW5ndGgpXG4gICAgICAgIHJldHVybiBhLmxlbmd0aCAtIGIubGVuZ3RoO1xuICAgICAgZm9yIChpID0gMDsgaSA8IGEubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGFbaV0gPCBiW2ldKVxuICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgaWYgKGFbaV0gPiBiW2ldKVxuICAgICAgICAgIHJldHVybiAxO1xuICAgICAgfVxuICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICAgIGlmICh0YSA9PT0gOCkgeyAvLyBib29sZWFuXG4gICAgICBpZiAoYSkgcmV0dXJuIGIgPyAwIDogMTtcbiAgICAgIHJldHVybiBiID8gLTEgOiAwO1xuICAgIH1cbiAgICBpZiAodGEgPT09IDEwKSAvLyBudWxsXG4gICAgICByZXR1cm4gMDtcbiAgICBpZiAodGEgPT09IDExKSAvLyByZWdleHBcbiAgICAgIHRocm93IEVycm9yKFwiU29ydGluZyBub3Qgc3VwcG9ydGVkIG9uIHJlZ3VsYXIgZXhwcmVzc2lvblwiKTsgLy8gWFhYXG4gICAgLy8gMTM6IGphdmFzY3JpcHQgY29kZVxuICAgIC8vIDE0OiBzeW1ib2xcbiAgICAvLyAxNTogamF2YXNjcmlwdCBjb2RlIHdpdGggc2NvcGVcbiAgICAvLyAxNjogMzItYml0IGludGVnZXJcbiAgICAvLyAxNzogdGltZXN0YW1wXG4gICAgLy8gMTg6IDY0LWJpdCBpbnRlZ2VyXG4gICAgLy8gMjU1OiBtaW5rZXlcbiAgICAvLyAxMjc6IG1heGtleVxuICAgIGlmICh0YSA9PT0gMTMpIC8vIGphdmFzY3JpcHQgY29kZVxuICAgICAgdGhyb3cgRXJyb3IoXCJTb3J0aW5nIG5vdCBzdXBwb3J0ZWQgb24gSmF2YXNjcmlwdCBjb2RlXCIpOyAvLyBYWFhcbiAgICB0aHJvdyBFcnJvcihcIlVua25vd24gdHlwZSB0byBzb3J0XCIpO1xuICB9XG59O1xuXG4vLyBGb3IgdW5pdCB0ZXN0cy4gVHJ1ZSBpZiB0aGUgZ2l2ZW4gZG9jdW1lbnQgbWF0Y2hlcyB0aGUgZ2l2ZW5cbi8vIHNlbGVjdG9yLlxuTG9jYWxDb2xsZWN0aW9uLl9tYXRjaGVzID0gZnVuY3Rpb24gKHNlbGVjdG9yLCBkb2MpIHtcbiAgcmV0dXJuIChMb2NhbENvbGxlY3Rpb24uX2NvbXBpbGVTZWxlY3RvcihzZWxlY3RvcikpKGRvYyk7XG59O1xuXG4vLyBfbWFrZUxvb2t1cEZ1bmN0aW9uKGtleSkgcmV0dXJucyBhIGxvb2t1cCBmdW5jdGlvbi5cbi8vXG4vLyBBIGxvb2t1cCBmdW5jdGlvbiB0YWtlcyBpbiBhIGRvY3VtZW50IGFuZCByZXR1cm5zIGFuIGFycmF5IG9mIG1hdGNoaW5nXG4vLyB2YWx1ZXMuICBUaGlzIGFycmF5IGhhcyBtb3JlIHRoYW4gb25lIGVsZW1lbnQgaWYgYW55IHNlZ21lbnQgb2YgdGhlIGtleSBvdGhlclxuLy8gdGhhbiB0aGUgbGFzdCBvbmUgaXMgYW4gYXJyYXkuICBpZSwgYW55IGFycmF5cyBmb3VuZCB3aGVuIGRvaW5nIG5vbi1maW5hbFxuLy8gbG9va3VwcyByZXN1bHQgaW4gdGhpcyBmdW5jdGlvbiBcImJyYW5jaGluZ1wiOyBlYWNoIGVsZW1lbnQgaW4gdGhlIHJldHVybmVkXG4vLyBhcnJheSByZXByZXNlbnRzIHRoZSB2YWx1ZSBmb3VuZCBhdCB0aGlzIGJyYW5jaC4gSWYgYW55IGJyYW5jaCBkb2Vzbid0IGhhdmUgYVxuLy8gZmluYWwgdmFsdWUgZm9yIHRoZSBmdWxsIGtleSwgaXRzIGVsZW1lbnQgaW4gdGhlIHJldHVybmVkIGxpc3Qgd2lsbCBiZVxuLy8gdW5kZWZpbmVkLiBJdCBhbHdheXMgcmV0dXJucyBhIG5vbi1lbXB0eSBhcnJheS5cbi8vXG4vLyBfbWFrZUxvb2t1cEZ1bmN0aW9uKCdhLngnKSh7YToge3g6IDF9fSkgcmV0dXJucyBbMV1cbi8vIF9tYWtlTG9va3VwRnVuY3Rpb24oJ2EueCcpKHthOiB7eDogWzFdfX0pIHJldHVybnMgW1sxXV1cbi8vIF9tYWtlTG9va3VwRnVuY3Rpb24oJ2EueCcpKHthOiA1fSkgIHJldHVybnMgW3VuZGVmaW5lZF1cbi8vIF9tYWtlTG9va3VwRnVuY3Rpb24oJ2EueCcpKHthOiBbe3g6IDF9LFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7eDogWzJdfSxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3k6IDN9XX0pXG4vLyAgIHJldHVybnMgWzEsIFsyXSwgdW5kZWZpbmVkXVxuTG9jYWxDb2xsZWN0aW9uLl9tYWtlTG9va3VwRnVuY3Rpb24gPSBmdW5jdGlvbiAoa2V5KSB7XG4gIHZhciBkb3RMb2NhdGlvbiA9IGtleS5pbmRleE9mKCcuJyk7XG4gIHZhciBmaXJzdCwgbG9va3VwUmVzdCwgbmV4dElzTnVtZXJpYztcbiAgaWYgKGRvdExvY2F0aW9uID09PSAtMSkge1xuICAgIGZpcnN0ID0ga2V5O1xuICB9IGVsc2Uge1xuICAgIGZpcnN0ID0ga2V5LnN1YnN0cigwLCBkb3RMb2NhdGlvbik7XG4gICAgdmFyIHJlc3QgPSBrZXkuc3Vic3RyKGRvdExvY2F0aW9uICsgMSk7XG4gICAgbG9va3VwUmVzdCA9IExvY2FsQ29sbGVjdGlvbi5fbWFrZUxvb2t1cEZ1bmN0aW9uKHJlc3QpO1xuICAgIC8vIElzIHRoZSBuZXh0IChwZXJoYXBzIGZpbmFsKSBwaWVjZSBudW1lcmljIChpZSwgYW4gYXJyYXkgbG9va3VwPylcbiAgICBuZXh0SXNOdW1lcmljID0gL15cXGQrKFxcLnwkKS8udGVzdChyZXN0KTtcbiAgfVxuXG4gIHJldHVybiBmdW5jdGlvbiAoZG9jKSB7XG4gICAgaWYgKGRvYyA9PSBudWxsKSAgLy8gbnVsbCBvciB1bmRlZmluZWRcbiAgICAgIHJldHVybiBbdW5kZWZpbmVkXTtcbiAgICB2YXIgZmlyc3RMZXZlbCA9IGRvY1tmaXJzdF07XG5cbiAgICAvLyBXZSBkb24ndCBcImJyYW5jaFwiIGF0IHRoZSBmaW5hbCBsZXZlbC5cbiAgICBpZiAoIWxvb2t1cFJlc3QpXG4gICAgICByZXR1cm4gW2ZpcnN0TGV2ZWxdO1xuXG4gICAgLy8gSXQncyBhbiBlbXB0eSBhcnJheSwgYW5kIHdlJ3JlIG5vdCBkb25lOiB3ZSB3b24ndCBmaW5kIGFueXRoaW5nLlxuICAgIGlmIChpc0FycmF5KGZpcnN0TGV2ZWwpICYmIGZpcnN0TGV2ZWwubGVuZ3RoID09PSAwKVxuICAgICAgcmV0dXJuIFt1bmRlZmluZWRdO1xuXG4gICAgLy8gRm9yIGVhY2ggcmVzdWx0IGF0IHRoaXMgbGV2ZWwsIGZpbmlzaCB0aGUgbG9va3VwIG9uIHRoZSByZXN0IG9mIHRoZSBrZXksXG4gICAgLy8gYW5kIHJldHVybiBldmVyeXRoaW5nIHdlIGZpbmQuIEFsc28sIGlmIHRoZSBuZXh0IHJlc3VsdCBpcyBhIG51bWJlcixcbiAgICAvLyBkb24ndCBicmFuY2ggaGVyZS5cbiAgICAvL1xuICAgIC8vIFRlY2huaWNhbGx5LCBpbiBNb25nb0RCLCB3ZSBzaG91bGQgYmUgYWJsZSB0byBoYW5kbGUgdGhlIGNhc2Ugd2hlcmVcbiAgICAvLyBvYmplY3RzIGhhdmUgbnVtZXJpYyBrZXlzLCBidXQgTW9uZ28gZG9lc24ndCBhY3R1YWxseSBoYW5kbGUgdGhpc1xuICAgIC8vIGNvbnNpc3RlbnRseSB5ZXQgaXRzZWxmLCBzZWUgZWdcbiAgICAvLyBodHRwczovL2ppcmEubW9uZ29kYi5vcmcvYnJvd3NlL1NFUlZFUi0yODk4XG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL21vbmdvZGIvbW9uZ28vYmxvYi9tYXN0ZXIvanN0ZXN0cy9hcnJheV9tYXRjaDIuanNcbiAgICBpZiAoIWlzQXJyYXkoZmlyc3RMZXZlbCkgfHwgbmV4dElzTnVtZXJpYylcbiAgICAgIGZpcnN0TGV2ZWwgPSBbZmlyc3RMZXZlbF07XG4gICAgcmV0dXJuIEFycmF5LnByb3RvdHlwZS5jb25jYXQuYXBwbHkoW10sIF8ubWFwKGZpcnN0TGV2ZWwsIGxvb2t1cFJlc3QpKTtcbiAgfTtcbn07XG5cbi8vIFRoZSBtYWluIGNvbXBpbGF0aW9uIGZ1bmN0aW9uIGZvciBhIGdpdmVuIHNlbGVjdG9yLlxudmFyIGNvbXBpbGVEb2N1bWVudFNlbGVjdG9yID0gZnVuY3Rpb24gKGRvY1NlbGVjdG9yKSB7XG4gIHZhciBwZXJLZXlTZWxlY3RvcnMgPSBbXTtcbiAgXy5lYWNoKGRvY1NlbGVjdG9yLCBmdW5jdGlvbiAoc3ViU2VsZWN0b3IsIGtleSkge1xuICAgIGlmIChrZXkuc3Vic3RyKDAsIDEpID09PSAnJCcpIHtcbiAgICAgIC8vIE91dGVyIG9wZXJhdG9ycyBhcmUgZWl0aGVyIGxvZ2ljYWwgb3BlcmF0b3JzICh0aGV5IHJlY3Vyc2UgYmFjayBpbnRvXG4gICAgICAvLyB0aGlzIGZ1bmN0aW9uKSwgb3IgJHdoZXJlLlxuICAgICAgaWYgKCFfLmhhcyhMT0dJQ0FMX09QRVJBVE9SUywga2V5KSlcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5yZWNvZ25pemVkIGxvZ2ljYWwgb3BlcmF0b3I6IFwiICsga2V5KTtcbiAgICAgIHBlcktleVNlbGVjdG9ycy5wdXNoKExPR0lDQUxfT1BFUkFUT1JTW2tleV0oc3ViU2VsZWN0b3IpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGxvb2tVcEJ5SW5kZXggPSBMb2NhbENvbGxlY3Rpb24uX21ha2VMb29rdXBGdW5jdGlvbihrZXkpO1xuICAgICAgdmFyIHZhbHVlU2VsZWN0b3JGdW5jID0gY29tcGlsZVZhbHVlU2VsZWN0b3Ioc3ViU2VsZWN0b3IpO1xuICAgICAgcGVyS2V5U2VsZWN0b3JzLnB1c2goZnVuY3Rpb24gKGRvYykge1xuICAgICAgICB2YXIgYnJhbmNoVmFsdWVzID0gbG9va1VwQnlJbmRleChkb2MpO1xuICAgICAgICAvLyBXZSBhcHBseSB0aGUgc2VsZWN0b3IgdG8gZWFjaCBcImJyYW5jaGVkXCIgdmFsdWUgYW5kIHJldHVybiB0cnVlIGlmIGFueVxuICAgICAgICAvLyBtYXRjaC4gVGhpcyBpc24ndCAxMDAlIGNvbnNpc3RlbnQgd2l0aCBNb25nb0RCOyBlZywgc2VlOlxuICAgICAgICAvLyBodHRwczovL2ppcmEubW9uZ29kYi5vcmcvYnJvd3NlL1NFUlZFUi04NTg1XG4gICAgICAgIHJldHVybiBfLmFueShicmFuY2hWYWx1ZXMsIHZhbHVlU2VsZWN0b3JGdW5jKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfSk7XG5cblxuICByZXR1cm4gZnVuY3Rpb24gKGRvYykge1xuICAgIHJldHVybiBfLmFsbChwZXJLZXlTZWxlY3RvcnMsIGZ1bmN0aW9uIChmKSB7XG4gICAgICByZXR1cm4gZihkb2MpO1xuICAgIH0pO1xuICB9O1xufTtcblxuLy8gR2l2ZW4gYSBzZWxlY3RvciwgcmV0dXJuIGEgZnVuY3Rpb24gdGhhdCB0YWtlcyBvbmUgYXJndW1lbnQsIGFcbi8vIGRvY3VtZW50LCBhbmQgcmV0dXJucyB0cnVlIGlmIHRoZSBkb2N1bWVudCBtYXRjaGVzIHRoZSBzZWxlY3Rvcixcbi8vIGVsc2UgZmFsc2UuXG5Mb2NhbENvbGxlY3Rpb24uX2NvbXBpbGVTZWxlY3RvciA9IGZ1bmN0aW9uIChzZWxlY3Rvcikge1xuICAvLyB5b3UgY2FuIHBhc3MgYSBsaXRlcmFsIGZ1bmN0aW9uIGluc3RlYWQgb2YgYSBzZWxlY3RvclxuICBpZiAoc2VsZWN0b3IgaW5zdGFuY2VvZiBGdW5jdGlvbilcbiAgICByZXR1cm4gZnVuY3Rpb24gKGRvYykge3JldHVybiBzZWxlY3Rvci5jYWxsKGRvYyk7fTtcblxuICAvLyBzaG9ydGhhbmQgLS0gc2NhbGFycyBtYXRjaCBfaWRcbiAgaWYgKExvY2FsQ29sbGVjdGlvbi5fc2VsZWN0b3JJc0lkKHNlbGVjdG9yKSkge1xuICAgIHJldHVybiBmdW5jdGlvbiAoZG9jKSB7XG4gICAgICByZXR1cm4gRUpTT04uZXF1YWxzKGRvYy5faWQsIHNlbGVjdG9yKTtcbiAgICB9O1xuICB9XG5cbiAgLy8gcHJvdGVjdCBhZ2FpbnN0IGRhbmdlcm91cyBzZWxlY3RvcnMuICBmYWxzZXkgYW5kIHtfaWQ6IGZhbHNleX0gYXJlIGJvdGhcbiAgLy8gbGlrZWx5IHByb2dyYW1tZXIgZXJyb3IsIGFuZCBub3Qgd2hhdCB5b3Ugd2FudCwgcGFydGljdWxhcmx5IGZvclxuICAvLyBkZXN0cnVjdGl2ZSBvcGVyYXRpb25zLlxuICBpZiAoIXNlbGVjdG9yIHx8ICgoJ19pZCcgaW4gc2VsZWN0b3IpICYmICFzZWxlY3Rvci5faWQpKVxuICAgIHJldHVybiBmdW5jdGlvbiAoZG9jKSB7cmV0dXJuIGZhbHNlO307XG5cbiAgLy8gVG9wIGxldmVsIGNhbid0IGJlIGFuIGFycmF5IG9yIHRydWUgb3IgYmluYXJ5LlxuICBpZiAodHlwZW9mKHNlbGVjdG9yKSA9PT0gJ2Jvb2xlYW4nIHx8IGlzQXJyYXkoc2VsZWN0b3IpIHx8XG4gICAgICBFSlNPTi5pc0JpbmFyeShzZWxlY3RvcikpXG4gICAgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBzZWxlY3RvcjogXCIgKyBzZWxlY3Rvcik7XG5cbiAgcmV0dXJuIGNvbXBpbGVEb2N1bWVudFNlbGVjdG9yKHNlbGVjdG9yKTtcbn07XG5cbi8vIEdpdmUgYSBzb3J0IHNwZWMsIHdoaWNoIGNhbiBiZSBpbiBhbnkgb2YgdGhlc2UgZm9ybXM6XG4vLyAgIHtcImtleTFcIjogMSwgXCJrZXkyXCI6IC0xfVxuLy8gICBbW1wia2V5MVwiLCBcImFzY1wiXSwgW1wia2V5MlwiLCBcImRlc2NcIl1dXG4vLyAgIFtcImtleTFcIiwgW1wia2V5MlwiLCBcImRlc2NcIl1dXG4vL1xuLy8gKC4uIHdpdGggdGhlIGZpcnN0IGZvcm0gYmVpbmcgZGVwZW5kZW50IG9uIHRoZSBrZXkgZW51bWVyYXRpb25cbi8vIGJlaGF2aW9yIG9mIHlvdXIgamF2YXNjcmlwdCBWTSwgd2hpY2ggdXN1YWxseSBkb2VzIHdoYXQgeW91IG1lYW4gaW5cbi8vIHRoaXMgY2FzZSBpZiB0aGUga2V5IG5hbWVzIGRvbid0IGxvb2sgbGlrZSBpbnRlZ2VycyAuLilcbi8vXG4vLyByZXR1cm4gYSBmdW5jdGlvbiB0aGF0IHRha2VzIHR3byBvYmplY3RzLCBhbmQgcmV0dXJucyAtMSBpZiB0aGVcbi8vIGZpcnN0IG9iamVjdCBjb21lcyBmaXJzdCBpbiBvcmRlciwgMSBpZiB0aGUgc2Vjb25kIG9iamVjdCBjb21lc1xuLy8gZmlyc3QsIG9yIDAgaWYgbmVpdGhlciBvYmplY3QgY29tZXMgYmVmb3JlIHRoZSBvdGhlci5cblxuTG9jYWxDb2xsZWN0aW9uLl9jb21waWxlU29ydCA9IGZ1bmN0aW9uIChzcGVjKSB7XG4gIHZhciBzb3J0U3BlY1BhcnRzID0gW107XG5cbiAgaWYgKHNwZWMgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3BlYy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHR5cGVvZiBzcGVjW2ldID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIHNvcnRTcGVjUGFydHMucHVzaCh7XG4gICAgICAgICAgbG9va3VwOiBMb2NhbENvbGxlY3Rpb24uX21ha2VMb29rdXBGdW5jdGlvbihzcGVjW2ldKSxcbiAgICAgICAgICBhc2NlbmRpbmc6IHRydWVcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzb3J0U3BlY1BhcnRzLnB1c2goe1xuICAgICAgICAgIGxvb2t1cDogTG9jYWxDb2xsZWN0aW9uLl9tYWtlTG9va3VwRnVuY3Rpb24oc3BlY1tpXVswXSksXG4gICAgICAgICAgYXNjZW5kaW5nOiBzcGVjW2ldWzFdICE9PSBcImRlc2NcIlxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSBpZiAodHlwZW9mIHNwZWMgPT09IFwib2JqZWN0XCIpIHtcbiAgICBmb3IgKHZhciBrZXkgaW4gc3BlYykge1xuICAgICAgc29ydFNwZWNQYXJ0cy5wdXNoKHtcbiAgICAgICAgbG9va3VwOiBMb2NhbENvbGxlY3Rpb24uX21ha2VMb29rdXBGdW5jdGlvbihrZXkpLFxuICAgICAgICBhc2NlbmRpbmc6IHNwZWNba2V5XSA+PSAwXG4gICAgICB9KTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgRXJyb3IoXCJCYWQgc29ydCBzcGVjaWZpY2F0aW9uOiBcIiwgSlNPTi5zdHJpbmdpZnkoc3BlYykpO1xuICB9XG5cbiAgaWYgKHNvcnRTcGVjUGFydHMubGVuZ3RoID09PSAwKVxuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7cmV0dXJuIDA7fTtcblxuICAvLyByZWR1Y2VWYWx1ZSB0YWtlcyBpbiBhbGwgdGhlIHBvc3NpYmxlIHZhbHVlcyBmb3IgdGhlIHNvcnQga2V5IGFsb25nIHZhcmlvdXNcbiAgLy8gYnJhbmNoZXMsIGFuZCByZXR1cm5zIHRoZSBtaW4gb3IgbWF4IHZhbHVlIChhY2NvcmRpbmcgdG8gdGhlIGJvb2xcbiAgLy8gZmluZE1pbikuIEVhY2ggdmFsdWUgY2FuIGl0c2VsZiBiZSBhbiBhcnJheSwgYW5kIHdlIGxvb2sgYXQgaXRzIHZhbHVlc1xuICAvLyB0b28uIChpZSwgd2UgZG8gYSBzaW5nbGUgbGV2ZWwgb2YgZmxhdHRlbmluZyBvbiBicmFuY2hWYWx1ZXMsIHRoZW4gZmluZCB0aGVcbiAgLy8gbWluL21heC4pXG4gIHZhciByZWR1Y2VWYWx1ZSA9IGZ1bmN0aW9uIChicmFuY2hWYWx1ZXMsIGZpbmRNaW4pIHtcbiAgICB2YXIgcmVkdWNlZDtcbiAgICB2YXIgZmlyc3QgPSB0cnVlO1xuICAgIC8vIEl0ZXJhdGUgb3ZlciBhbGwgdGhlIHZhbHVlcyBmb3VuZCBpbiBhbGwgdGhlIGJyYW5jaGVzLCBhbmQgaWYgYSB2YWx1ZSBpc1xuICAgIC8vIGFuIGFycmF5IGl0c2VsZiwgaXRlcmF0ZSBvdmVyIHRoZSB2YWx1ZXMgaW4gdGhlIGFycmF5IHNlcGFyYXRlbHkuXG4gICAgXy5lYWNoKGJyYW5jaFZhbHVlcywgZnVuY3Rpb24gKGJyYW5jaFZhbHVlKSB7XG4gICAgICAvLyBWYWx1ZSBub3QgYW4gYXJyYXk/IFByZXRlbmQgaXQgaXMuXG4gICAgICBpZiAoIWlzQXJyYXkoYnJhbmNoVmFsdWUpKVxuICAgICAgICBicmFuY2hWYWx1ZSA9IFticmFuY2hWYWx1ZV07XG4gICAgICAvLyBWYWx1ZSBpcyBhbiBlbXB0eSBhcnJheT8gUHJldGVuZCBpdCB3YXMgbWlzc2luZywgc2luY2UgdGhhdCdzIHdoZXJlIGl0XG4gICAgICAvLyBzaG91bGQgYmUgc29ydGVkLlxuICAgICAgaWYgKGlzQXJyYXkoYnJhbmNoVmFsdWUpICYmIGJyYW5jaFZhbHVlLmxlbmd0aCA9PT0gMClcbiAgICAgICAgYnJhbmNoVmFsdWUgPSBbdW5kZWZpbmVkXTtcbiAgICAgIF8uZWFjaChicmFuY2hWYWx1ZSwgZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIC8vIFdlIHNob3VsZCBnZXQgaGVyZSBhdCBsZWFzdCBvbmNlOiBsb29rdXAgZnVuY3Rpb25zIHJldHVybiBub24tZW1wdHlcbiAgICAgICAgLy8gYXJyYXlzLCBzbyB0aGUgb3V0ZXIgbG9vcCBydW5zIGF0IGxlYXN0IG9uY2UsIGFuZCB3ZSBwcmV2ZW50ZWRcbiAgICAgICAgLy8gYnJhbmNoVmFsdWUgZnJvbSBiZWluZyBhbiBlbXB0eSBhcnJheS5cbiAgICAgICAgaWYgKGZpcnN0KSB7XG4gICAgICAgICAgcmVkdWNlZCA9IHZhbHVlO1xuICAgICAgICAgIGZpcnN0ID0gZmFsc2U7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gQ29tcGFyZSB0aGUgdmFsdWUgd2UgZm91bmQgdG8gdGhlIHZhbHVlIHdlIGZvdW5kIHNvIGZhciwgc2F2aW5nIGl0XG4gICAgICAgICAgLy8gaWYgaXQncyBsZXNzIChmb3IgYW4gYXNjZW5kaW5nIHNvcnQpIG9yIG1vcmUgKGZvciBhIGRlc2NlbmRpbmdcbiAgICAgICAgICAvLyBzb3J0KS5cbiAgICAgICAgICB2YXIgY21wID0gTG9jYWxDb2xsZWN0aW9uLl9mLl9jbXAocmVkdWNlZCwgdmFsdWUpO1xuICAgICAgICAgIGlmICgoZmluZE1pbiAmJiBjbXAgPiAwKSB8fCAoIWZpbmRNaW4gJiYgY21wIDwgMCkpXG4gICAgICAgICAgICByZWR1Y2VkID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIHJldHVybiByZWR1Y2VkO1xuICB9O1xuXG4gIHJldHVybiBmdW5jdGlvbiAoYSwgYikge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc29ydFNwZWNQYXJ0cy5sZW5ndGg7ICsraSkge1xuICAgICAgdmFyIHNwZWNQYXJ0ID0gc29ydFNwZWNQYXJ0c1tpXTtcbiAgICAgIHZhciBhVmFsdWUgPSByZWR1Y2VWYWx1ZShzcGVjUGFydC5sb29rdXAoYSksIHNwZWNQYXJ0LmFzY2VuZGluZyk7XG4gICAgICB2YXIgYlZhbHVlID0gcmVkdWNlVmFsdWUoc3BlY1BhcnQubG9va3VwKGIpLCBzcGVjUGFydC5hc2NlbmRpbmcpO1xuICAgICAgdmFyIGNvbXBhcmUgPSBMb2NhbENvbGxlY3Rpb24uX2YuX2NtcChhVmFsdWUsIGJWYWx1ZSk7XG4gICAgICBpZiAoY29tcGFyZSAhPT0gMClcbiAgICAgICAgcmV0dXJuIHNwZWNQYXJ0LmFzY2VuZGluZyA/IGNvbXBhcmUgOiAtY29tcGFyZTtcbiAgICB9O1xuICAgIHJldHVybiAwO1xuICB9O1xufTtcblxuZXhwb3J0cy5jb21waWxlRG9jdW1lbnRTZWxlY3RvciA9IGNvbXBpbGVEb2N1bWVudFNlbGVjdG9yO1xuZXhwb3J0cy5jb21waWxlU29ydCA9IExvY2FsQ29sbGVjdGlvbi5fY29tcGlsZVNvcnQ7IiwiRUpTT04gPSB7fTsgLy8gR2xvYmFsIVxudmFyIGN1c3RvbVR5cGVzID0ge307XG4vLyBBZGQgYSBjdXN0b20gdHlwZSwgdXNpbmcgYSBtZXRob2Qgb2YgeW91ciBjaG9pY2UgdG8gZ2V0IHRvIGFuZFxuLy8gZnJvbSBhIGJhc2ljIEpTT04tYWJsZSByZXByZXNlbnRhdGlvbi4gIFRoZSBmYWN0b3J5IGFyZ3VtZW50XG4vLyBpcyBhIGZ1bmN0aW9uIG9mIEpTT04tYWJsZSAtLT4geW91ciBvYmplY3Rcbi8vIFRoZSB0eXBlIHlvdSBhZGQgbXVzdCBoYXZlOlxuLy8gLSBBIGNsb25lKCkgbWV0aG9kLCBzbyB0aGF0IE1ldGVvciBjYW4gZGVlcC1jb3B5IGl0IHdoZW4gbmVjZXNzYXJ5LlxuLy8gLSBBIGVxdWFscygpIG1ldGhvZCwgc28gdGhhdCBNZXRlb3IgY2FuIGNvbXBhcmUgaXRcbi8vIC0gQSB0b0pTT05WYWx1ZSgpIG1ldGhvZCwgc28gdGhhdCBNZXRlb3IgY2FuIHNlcmlhbGl6ZSBpdFxuLy8gLSBhIHR5cGVOYW1lKCkgbWV0aG9kLCB0byBzaG93IGhvdyB0byBsb29rIGl0IHVwIGluIG91ciB0eXBlIHRhYmxlLlxuLy8gSXQgaXMgb2theSBpZiB0aGVzZSBtZXRob2RzIGFyZSBtb25rZXktcGF0Y2hlZCBvbi5cbkVKU09OLmFkZFR5cGUgPSBmdW5jdGlvbiAobmFtZSwgZmFjdG9yeSkge1xuICBpZiAoXy5oYXMoY3VzdG9tVHlwZXMsIG5hbWUpKVxuICAgIHRocm93IG5ldyBFcnJvcihcIlR5cGUgXCIgKyBuYW1lICsgXCIgYWxyZWFkeSBwcmVzZW50XCIpO1xuICBjdXN0b21UeXBlc1tuYW1lXSA9IGZhY3Rvcnk7XG59O1xuXG52YXIgYnVpbHRpbkNvbnZlcnRlcnMgPSBbXG4gIHsgLy8gRGF0ZVxuICAgIG1hdGNoSlNPTlZhbHVlOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICByZXR1cm4gXy5oYXMob2JqLCAnJGRhdGUnKSAmJiBfLnNpemUob2JqKSA9PT0gMTtcbiAgICB9LFxuICAgIG1hdGNoT2JqZWN0OiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICByZXR1cm4gb2JqIGluc3RhbmNlb2YgRGF0ZTtcbiAgICB9LFxuICAgIHRvSlNPTlZhbHVlOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICByZXR1cm4geyRkYXRlOiBvYmouZ2V0VGltZSgpfTtcbiAgICB9LFxuICAgIGZyb21KU09OVmFsdWU6IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgIHJldHVybiBuZXcgRGF0ZShvYmouJGRhdGUpO1xuICAgIH1cbiAgfSxcbiAgeyAvLyBCaW5hcnlcbiAgICBtYXRjaEpTT05WYWx1ZTogZnVuY3Rpb24gKG9iaikge1xuICAgICAgcmV0dXJuIF8uaGFzKG9iaiwgJyRiaW5hcnknKSAmJiBfLnNpemUob2JqKSA9PT0gMTtcbiAgICB9LFxuICAgIG1hdGNoT2JqZWN0OiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICByZXR1cm4gdHlwZW9mIFVpbnQ4QXJyYXkgIT09ICd1bmRlZmluZWQnICYmIG9iaiBpbnN0YW5jZW9mIFVpbnQ4QXJyYXlcbiAgICAgICAgfHwgKG9iaiAmJiBfLmhhcyhvYmosICckVWludDhBcnJheVBvbHlmaWxsJykpO1xuICAgIH0sXG4gICAgdG9KU09OVmFsdWU6IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgIHJldHVybiB7JGJpbmFyeTogRUpTT04uX2Jhc2U2NEVuY29kZShvYmopfTtcbiAgICB9LFxuICAgIGZyb21KU09OVmFsdWU6IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgIHJldHVybiBFSlNPTi5fYmFzZTY0RGVjb2RlKG9iai4kYmluYXJ5KTtcbiAgICB9XG4gIH0sXG4gIHsgLy8gRXNjYXBpbmcgb25lIGxldmVsXG4gICAgbWF0Y2hKU09OVmFsdWU6IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgIHJldHVybiBfLmhhcyhvYmosICckZXNjYXBlJykgJiYgXy5zaXplKG9iaikgPT09IDE7XG4gICAgfSxcbiAgICBtYXRjaE9iamVjdDogZnVuY3Rpb24gKG9iaikge1xuICAgICAgaWYgKF8uaXNFbXB0eShvYmopIHx8IF8uc2l6ZShvYmopID4gMikge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICByZXR1cm4gXy5hbnkoYnVpbHRpbkNvbnZlcnRlcnMsIGZ1bmN0aW9uIChjb252ZXJ0ZXIpIHtcbiAgICAgICAgcmV0dXJuIGNvbnZlcnRlci5tYXRjaEpTT05WYWx1ZShvYmopO1xuICAgICAgfSk7XG4gICAgfSxcbiAgICB0b0pTT05WYWx1ZTogZnVuY3Rpb24gKG9iaikge1xuICAgICAgdmFyIG5ld09iaiA9IHt9O1xuICAgICAgXy5lYWNoKG9iaiwgZnVuY3Rpb24gKHZhbHVlLCBrZXkpIHtcbiAgICAgICAgbmV3T2JqW2tleV0gPSBFSlNPTi50b0pTT05WYWx1ZSh2YWx1ZSk7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiB7JGVzY2FwZTogbmV3T2JqfTtcbiAgICB9LFxuICAgIGZyb21KU09OVmFsdWU6IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgIHZhciBuZXdPYmogPSB7fTtcbiAgICAgIF8uZWFjaChvYmouJGVzY2FwZSwgZnVuY3Rpb24gKHZhbHVlLCBrZXkpIHtcbiAgICAgICAgbmV3T2JqW2tleV0gPSBFSlNPTi5mcm9tSlNPTlZhbHVlKHZhbHVlKTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIG5ld09iajtcbiAgICB9XG4gIH0sXG4gIHsgLy8gQ3VzdG9tXG4gICAgbWF0Y2hKU09OVmFsdWU6IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgIHJldHVybiBfLmhhcyhvYmosICckdHlwZScpICYmIF8uaGFzKG9iaiwgJyR2YWx1ZScpICYmIF8uc2l6ZShvYmopID09PSAyO1xuICAgIH0sXG4gICAgbWF0Y2hPYmplY3Q6IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgIHJldHVybiBFSlNPTi5faXNDdXN0b21UeXBlKG9iaik7XG4gICAgfSxcbiAgICB0b0pTT05WYWx1ZTogZnVuY3Rpb24gKG9iaikge1xuICAgICAgcmV0dXJuIHskdHlwZTogb2JqLnR5cGVOYW1lKCksICR2YWx1ZTogb2JqLnRvSlNPTlZhbHVlKCl9O1xuICAgIH0sXG4gICAgZnJvbUpTT05WYWx1ZTogZnVuY3Rpb24gKG9iaikge1xuICAgICAgdmFyIHR5cGVOYW1lID0gb2JqLiR0eXBlO1xuICAgICAgdmFyIGNvbnZlcnRlciA9IGN1c3RvbVR5cGVzW3R5cGVOYW1lXTtcbiAgICAgIHJldHVybiBjb252ZXJ0ZXIob2JqLiR2YWx1ZSk7XG4gICAgfVxuICB9XG5dO1xuXG5FSlNPTi5faXNDdXN0b21UeXBlID0gZnVuY3Rpb24gKG9iaikge1xuICByZXR1cm4gb2JqICYmXG4gICAgdHlwZW9mIG9iai50b0pTT05WYWx1ZSA9PT0gJ2Z1bmN0aW9uJyAmJlxuICAgIHR5cGVvZiBvYmoudHlwZU5hbWUgPT09ICdmdW5jdGlvbicgJiZcbiAgICBfLmhhcyhjdXN0b21UeXBlcywgb2JqLnR5cGVOYW1lKCkpO1xufTtcblxuXG4vL2ZvciBib3RoIGFycmF5cyBhbmQgb2JqZWN0cywgaW4tcGxhY2UgbW9kaWZpY2F0aW9uLlxudmFyIGFkanVzdFR5cGVzVG9KU09OVmFsdWUgPVxuRUpTT04uX2FkanVzdFR5cGVzVG9KU09OVmFsdWUgPSBmdW5jdGlvbiAob2JqKSB7XG4gIGlmIChvYmogPT09IG51bGwpXG4gICAgcmV0dXJuIG51bGw7XG4gIHZhciBtYXliZUNoYW5nZWQgPSB0b0pTT05WYWx1ZUhlbHBlcihvYmopO1xuICBpZiAobWF5YmVDaGFuZ2VkICE9PSB1bmRlZmluZWQpXG4gICAgcmV0dXJuIG1heWJlQ2hhbmdlZDtcbiAgXy5lYWNoKG9iaiwgZnVuY3Rpb24gKHZhbHVlLCBrZXkpIHtcbiAgICBpZiAodHlwZW9mIHZhbHVlICE9PSAnb2JqZWN0JyAmJiB2YWx1ZSAhPT0gdW5kZWZpbmVkKVxuICAgICAgcmV0dXJuOyAvLyBjb250aW51ZVxuICAgIHZhciBjaGFuZ2VkID0gdG9KU09OVmFsdWVIZWxwZXIodmFsdWUpO1xuICAgIGlmIChjaGFuZ2VkKSB7XG4gICAgICBvYmpba2V5XSA9IGNoYW5nZWQ7XG4gICAgICByZXR1cm47IC8vIG9uIHRvIHRoZSBuZXh0IGtleVxuICAgIH1cbiAgICAvLyBpZiB3ZSBnZXQgaGVyZSwgdmFsdWUgaXMgYW4gb2JqZWN0IGJ1dCBub3QgYWRqdXN0YWJsZVxuICAgIC8vIGF0IHRoaXMgbGV2ZWwuICByZWN1cnNlLlxuICAgIGFkanVzdFR5cGVzVG9KU09OVmFsdWUodmFsdWUpO1xuICB9KTtcbiAgcmV0dXJuIG9iajtcbn07XG5cbi8vIEVpdGhlciByZXR1cm4gdGhlIEpTT04tY29tcGF0aWJsZSB2ZXJzaW9uIG9mIHRoZSBhcmd1bWVudCwgb3IgdW5kZWZpbmVkIChpZlxuLy8gdGhlIGl0ZW0gaXNuJ3QgaXRzZWxmIHJlcGxhY2VhYmxlLCBidXQgbWF5YmUgc29tZSBmaWVsZHMgaW4gaXQgYXJlKVxudmFyIHRvSlNPTlZhbHVlSGVscGVyID0gZnVuY3Rpb24gKGl0ZW0pIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBidWlsdGluQ29udmVydGVycy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBjb252ZXJ0ZXIgPSBidWlsdGluQ29udmVydGVyc1tpXTtcbiAgICBpZiAoY29udmVydGVyLm1hdGNoT2JqZWN0KGl0ZW0pKSB7XG4gICAgICByZXR1cm4gY29udmVydGVyLnRvSlNPTlZhbHVlKGl0ZW0pO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdW5kZWZpbmVkO1xufTtcblxuRUpTT04udG9KU09OVmFsdWUgPSBmdW5jdGlvbiAoaXRlbSkge1xuICB2YXIgY2hhbmdlZCA9IHRvSlNPTlZhbHVlSGVscGVyKGl0ZW0pO1xuICBpZiAoY2hhbmdlZCAhPT0gdW5kZWZpbmVkKVxuICAgIHJldHVybiBjaGFuZ2VkO1xuICBpZiAodHlwZW9mIGl0ZW0gPT09ICdvYmplY3QnKSB7XG4gICAgaXRlbSA9IEVKU09OLmNsb25lKGl0ZW0pO1xuICAgIGFkanVzdFR5cGVzVG9KU09OVmFsdWUoaXRlbSk7XG4gIH1cbiAgcmV0dXJuIGl0ZW07XG59O1xuXG4vL2ZvciBib3RoIGFycmF5cyBhbmQgb2JqZWN0cy4gVHJpZXMgaXRzIGJlc3QgdG8ganVzdFxuLy8gdXNlIHRoZSBvYmplY3QgeW91IGhhbmQgaXQsIGJ1dCBtYXkgcmV0dXJuIHNvbWV0aGluZ1xuLy8gZGlmZmVyZW50IGlmIHRoZSBvYmplY3QgeW91IGhhbmQgaXQgaXRzZWxmIG5lZWRzIGNoYW5naW5nLlxudmFyIGFkanVzdFR5cGVzRnJvbUpTT05WYWx1ZSA9XG5FSlNPTi5fYWRqdXN0VHlwZXNGcm9tSlNPTlZhbHVlID0gZnVuY3Rpb24gKG9iaikge1xuICBpZiAob2JqID09PSBudWxsKVxuICAgIHJldHVybiBudWxsO1xuICB2YXIgbWF5YmVDaGFuZ2VkID0gZnJvbUpTT05WYWx1ZUhlbHBlcihvYmopO1xuICBpZiAobWF5YmVDaGFuZ2VkICE9PSBvYmopXG4gICAgcmV0dXJuIG1heWJlQ2hhbmdlZDtcbiAgXy5lYWNoKG9iaiwgZnVuY3Rpb24gKHZhbHVlLCBrZXkpIHtcbiAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnb2JqZWN0Jykge1xuICAgICAgdmFyIGNoYW5nZWQgPSBmcm9tSlNPTlZhbHVlSGVscGVyKHZhbHVlKTtcbiAgICAgIGlmICh2YWx1ZSAhPT0gY2hhbmdlZCkge1xuICAgICAgICBvYmpba2V5XSA9IGNoYW5nZWQ7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIC8vIGlmIHdlIGdldCBoZXJlLCB2YWx1ZSBpcyBhbiBvYmplY3QgYnV0IG5vdCBhZGp1c3RhYmxlXG4gICAgICAvLyBhdCB0aGlzIGxldmVsLiAgcmVjdXJzZS5cbiAgICAgIGFkanVzdFR5cGVzRnJvbUpTT05WYWx1ZSh2YWx1ZSk7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIG9iajtcbn07XG5cbi8vIEVpdGhlciByZXR1cm4gdGhlIGFyZ3VtZW50IGNoYW5nZWQgdG8gaGF2ZSB0aGUgbm9uLWpzb25cbi8vIHJlcCBvZiBpdHNlbGYgKHRoZSBPYmplY3QgdmVyc2lvbikgb3IgdGhlIGFyZ3VtZW50IGl0c2VsZi5cblxuLy8gRE9FUyBOT1QgUkVDVVJTRS4gIEZvciBhY3R1YWxseSBnZXR0aW5nIHRoZSBmdWxseS1jaGFuZ2VkIHZhbHVlLCB1c2Vcbi8vIEVKU09OLmZyb21KU09OVmFsdWVcbnZhciBmcm9tSlNPTlZhbHVlSGVscGVyID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gIGlmICh0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIHZhbHVlICE9PSBudWxsKSB7XG4gICAgaWYgKF8uc2l6ZSh2YWx1ZSkgPD0gMlxuICAgICAgICAmJiBfLmFsbCh2YWx1ZSwgZnVuY3Rpb24gKHYsIGspIHtcbiAgICAgICAgICByZXR1cm4gdHlwZW9mIGsgPT09ICdzdHJpbmcnICYmIGsuc3Vic3RyKDAsIDEpID09PSAnJCc7XG4gICAgICAgIH0pKSB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGJ1aWx0aW5Db252ZXJ0ZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBjb252ZXJ0ZXIgPSBidWlsdGluQ29udmVydGVyc1tpXTtcbiAgICAgICAgaWYgKGNvbnZlcnRlci5tYXRjaEpTT05WYWx1ZSh2YWx1ZSkpIHtcbiAgICAgICAgICByZXR1cm4gY29udmVydGVyLmZyb21KU09OVmFsdWUodmFsdWUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiB2YWx1ZTtcbn07XG5cbkVKU09OLmZyb21KU09OVmFsdWUgPSBmdW5jdGlvbiAoaXRlbSkge1xuICB2YXIgY2hhbmdlZCA9IGZyb21KU09OVmFsdWVIZWxwZXIoaXRlbSk7XG4gIGlmIChjaGFuZ2VkID09PSBpdGVtICYmIHR5cGVvZiBpdGVtID09PSAnb2JqZWN0Jykge1xuICAgIGl0ZW0gPSBFSlNPTi5jbG9uZShpdGVtKTtcbiAgICBhZGp1c3RUeXBlc0Zyb21KU09OVmFsdWUoaXRlbSk7XG4gICAgcmV0dXJuIGl0ZW07XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGNoYW5nZWQ7XG4gIH1cbn07XG5cbkVKU09OLnN0cmluZ2lmeSA9IGZ1bmN0aW9uIChpdGVtKSB7XG4gIHJldHVybiBKU09OLnN0cmluZ2lmeShFSlNPTi50b0pTT05WYWx1ZShpdGVtKSk7XG59O1xuXG5FSlNPTi5wYXJzZSA9IGZ1bmN0aW9uIChpdGVtKSB7XG4gIHJldHVybiBFSlNPTi5mcm9tSlNPTlZhbHVlKEpTT04ucGFyc2UoaXRlbSkpO1xufTtcblxuRUpTT04uaXNCaW5hcnkgPSBmdW5jdGlvbiAob2JqKSB7XG4gIHJldHVybiAodHlwZW9mIFVpbnQ4QXJyYXkgIT09ICd1bmRlZmluZWQnICYmIG9iaiBpbnN0YW5jZW9mIFVpbnQ4QXJyYXkpIHx8XG4gICAgKG9iaiAmJiBvYmouJFVpbnQ4QXJyYXlQb2x5ZmlsbCk7XG59O1xuXG5FSlNPTi5lcXVhbHMgPSBmdW5jdGlvbiAoYSwgYiwgb3B0aW9ucykge1xuICB2YXIgaTtcbiAgdmFyIGtleU9yZGVyU2Vuc2l0aXZlID0gISEob3B0aW9ucyAmJiBvcHRpb25zLmtleU9yZGVyU2Vuc2l0aXZlKTtcbiAgaWYgKGEgPT09IGIpXG4gICAgcmV0dXJuIHRydWU7XG4gIGlmICghYSB8fCAhYikgLy8gaWYgZWl0aGVyIG9uZSBpcyBmYWxzeSwgdGhleSdkIGhhdmUgdG8gYmUgPT09IHRvIGJlIGVxdWFsXG4gICAgcmV0dXJuIGZhbHNlO1xuICBpZiAoISh0eXBlb2YgYSA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIGIgPT09ICdvYmplY3QnKSlcbiAgICByZXR1cm4gZmFsc2U7XG4gIGlmIChhIGluc3RhbmNlb2YgRGF0ZSAmJiBiIGluc3RhbmNlb2YgRGF0ZSlcbiAgICByZXR1cm4gYS52YWx1ZU9mKCkgPT09IGIudmFsdWVPZigpO1xuICBpZiAoRUpTT04uaXNCaW5hcnkoYSkgJiYgRUpTT04uaXNCaW5hcnkoYikpIHtcbiAgICBpZiAoYS5sZW5ndGggIT09IGIubGVuZ3RoKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIGZvciAoaSA9IDA7IGkgPCBhLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoYVtpXSAhPT0gYltpXSlcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICBpZiAodHlwZW9mIChhLmVxdWFscykgPT09ICdmdW5jdGlvbicpXG4gICAgcmV0dXJuIGEuZXF1YWxzKGIsIG9wdGlvbnMpO1xuICBpZiAoYSBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgaWYgKCEoYiBpbnN0YW5jZW9mIEFycmF5KSlcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICBpZiAoYS5sZW5ndGggIT09IGIubGVuZ3RoKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIGZvciAoaSA9IDA7IGkgPCBhLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoIUVKU09OLmVxdWFscyhhW2ldLCBiW2ldLCBvcHRpb25zKSlcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICAvLyBmYWxsIGJhY2sgdG8gc3RydWN0dXJhbCBlcXVhbGl0eSBvZiBvYmplY3RzXG4gIHZhciByZXQ7XG4gIGlmIChrZXlPcmRlclNlbnNpdGl2ZSkge1xuICAgIHZhciBiS2V5cyA9IFtdO1xuICAgIF8uZWFjaChiLCBmdW5jdGlvbiAodmFsLCB4KSB7XG4gICAgICAgIGJLZXlzLnB1c2goeCk7XG4gICAgfSk7XG4gICAgaSA9IDA7XG4gICAgcmV0ID0gXy5hbGwoYSwgZnVuY3Rpb24gKHZhbCwgeCkge1xuICAgICAgaWYgKGkgPj0gYktleXMubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGlmICh4ICE9PSBiS2V5c1tpXSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBpZiAoIUVKU09OLmVxdWFscyh2YWwsIGJbYktleXNbaV1dLCBvcHRpb25zKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBpKys7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9KTtcbiAgICByZXR1cm4gcmV0ICYmIGkgPT09IGJLZXlzLmxlbmd0aDtcbiAgfSBlbHNlIHtcbiAgICBpID0gMDtcbiAgICByZXQgPSBfLmFsbChhLCBmdW5jdGlvbiAodmFsLCBrZXkpIHtcbiAgICAgIGlmICghXy5oYXMoYiwga2V5KSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBpZiAoIUVKU09OLmVxdWFscyh2YWwsIGJba2V5XSwgb3B0aW9ucykpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgaSsrO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSk7XG4gICAgcmV0dXJuIHJldCAmJiBfLnNpemUoYikgPT09IGk7XG4gIH1cbn07XG5cbkVKU09OLmNsb25lID0gZnVuY3Rpb24gKHYpIHtcbiAgdmFyIHJldDtcbiAgaWYgKHR5cGVvZiB2ICE9PSBcIm9iamVjdFwiKVxuICAgIHJldHVybiB2O1xuICBpZiAodiA9PT0gbnVsbClcbiAgICByZXR1cm4gbnVsbDsgLy8gbnVsbCBoYXMgdHlwZW9mIFwib2JqZWN0XCJcbiAgaWYgKHYgaW5zdGFuY2VvZiBEYXRlKVxuICAgIHJldHVybiBuZXcgRGF0ZSh2LmdldFRpbWUoKSk7XG4gIGlmIChFSlNPTi5pc0JpbmFyeSh2KSkge1xuICAgIHJldCA9IEVKU09OLm5ld0JpbmFyeSh2Lmxlbmd0aCk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB2Lmxlbmd0aDsgaSsrKSB7XG4gICAgICByZXRbaV0gPSB2W2ldO1xuICAgIH1cbiAgICByZXR1cm4gcmV0O1xuICB9XG4gIGlmIChfLmlzQXJyYXkodikgfHwgXy5pc0FyZ3VtZW50cyh2KSkge1xuICAgIC8vIEZvciBzb21lIHJlYXNvbiwgXy5tYXAgZG9lc24ndCB3b3JrIGluIHRoaXMgY29udGV4dCBvbiBPcGVyYSAod2VpcmQgdGVzdFxuICAgIC8vIGZhaWx1cmVzKS5cbiAgICByZXQgPSBbXTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgdi5sZW5ndGg7IGkrKylcbiAgICAgIHJldFtpXSA9IEVKU09OLmNsb25lKHZbaV0pO1xuICAgIHJldHVybiByZXQ7XG4gIH1cbiAgLy8gaGFuZGxlIGdlbmVyYWwgdXNlci1kZWZpbmVkIHR5cGVkIE9iamVjdHMgaWYgdGhleSBoYXZlIGEgY2xvbmUgbWV0aG9kXG4gIGlmICh0eXBlb2Ygdi5jbG9uZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiB2LmNsb25lKCk7XG4gIH1cbiAgLy8gaGFuZGxlIG90aGVyIG9iamVjdHNcbiAgcmV0ID0ge307XG4gIF8uZWFjaCh2LCBmdW5jdGlvbiAodmFsdWUsIGtleSkge1xuICAgIHJldFtrZXldID0gRUpTT04uY2xvbmUodmFsdWUpO1xuICB9KTtcbiAgcmV0dXJuIHJldDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRUpTT047Il19
;