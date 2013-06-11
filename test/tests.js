;(function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
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
      json = GeoJSON.LatLngBoundsToGeoJSON(bounds);
      return assert(_.isEqual(json, {
        type: "Polygon",
        coordinates: [[[20, 10], [20, 13], [23, 13], [23, 10]]]
      }));
    });
  });

}).call(this);


},{"../app/js/GeoJSON":2}],3:[function(require,module,exports){
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


},{"./db_queries":4,"../app/js/db/LocalDb":5}],6:[function(require,module,exports){
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


},{"../app/js/ItemTracker":7}],4:[function(require,module,exports){
(function() {
  var assert,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  assert = chai.assert;

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
      return it('limits', function(done) {
        var _this = this;
        return this.db.test.find({}, {
          sort: ['a'],
          limit: 2
        }).fetch(function(results) {
          assert.deepEqual(_.pluck(results, '_id'), [1, 3]);
          return done();
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
      return it('finds points near', function(done) {
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
    });
  };

}).call(this);


},{}],7:[function(require,module,exports){
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


},{}],2:[function(require,module,exports){
(function() {
  exports.LatLngBoundsToGeoJSON = function(bounds) {
    var ne, sw;
    sw = bounds.getSouthWest();
    ne = bounds.getNorthEast();
    return {
      type: 'Polygon',
      coordinates: [[[sw.lng, sw.lat], [sw.lng, ne.lat], [ne.lng, ne.lat], [ne.lng, sw.lat]]]
    };
  };

}).call(this);


},{}],5:[function(require,module,exports){
(function() {
  var Collection, LocalDb, compileDocumentSelector, compileSort, createUid;

  compileDocumentSelector = require('./selector').compileDocumentSelector;

  compileSort = require('./selector').compileSort;

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
      var distances, filtered, geo, key, near, value;
      filtered = _.filter(_.values(this.items), compileDocumentSelector(selector));
      for (key in selector) {
        value = selector[key];
        if (value['$near']) {
          geo = value['$near']['$geometry'];
          if (geo.type !== 'Point') {
            error('Invalid near operator');
          }
          near = new L.LatLng(geo.coordinates[1], geo.coordinates[0]);
          distances = _.map(filtered, function(doc) {
            if (doc[key].type !== 'Point') {
              return {
                doc: doc,
                distance: -1
              };
            }
            return {
              doc: doc,
              distance: near.distanceTo(new L.LatLng(doc[key].coordinates[1], doc[key].coordinates[0]))
            };
          });
          distances = _.filter(distances, function(item) {
            return item.distance >= 0;
          });
          distances = _.sortBy(distances, 'distance');
          distances = _.first(distances, 100);
          filtered = _.pluck(distances, 'doc');
        }
      }
      if (options && options.sort) {
        filtered.sort(compileSort(options.sort));
      }
      if (options && options.limit) {
        filtered = _.first(filtered, options.limit);
      }
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

  module.exports = LocalDb;

}).call(this);


},{"./selector":8}],8:[function(require,module,exports){
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
    // Always returns true. Near must be handled in post-filter/sort/limit
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
},{"./EJSON":9}],9:[function(require,module,exports){
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
},{}]},{},[6,3,1])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL3Rlc3QvR2VvSlNPTlRlc3RzLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvdGVzdC9Mb2NhbERiVGVzdHMuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My90ZXN0L0l0ZW1UcmFja2VyVGVzdHMuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My90ZXN0L2RiX3F1ZXJpZXMuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvSXRlbVRyYWNrZXIuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvR2VvSlNPTi5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9kYi9Mb2NhbERiLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL2RiL3NlbGVjdG9yLmpzIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvZGIvRUpTT04uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0NBQUEsS0FBQSxTQUFBOztDQUFBLENBQUEsQ0FBUyxDQUFJLEVBQWI7O0NBQUEsQ0FDQSxDQUFVLElBQVYsWUFBVTs7Q0FEVixDQUdBLENBQW9CLEtBQXBCLENBQUE7Q0FDSyxDQUFILENBQStCLE1BQUEsRUFBL0IsZUFBQTtDQUNFLFNBQUEsd0JBQUE7Q0FBQSxDQUFnQixDQUFBLENBQUEsRUFBaEIsR0FBQTtDQUFBLENBQ2dCLENBQUEsQ0FBQSxFQUFoQixHQUFBO0NBREEsQ0FFdUMsQ0FBMUIsQ0FBQSxFQUFiLEdBQWEsR0FBQTtDQUZiLEVBSU8sQ0FBUCxFQUFBLENBQWMsY0FBUDtDQUNBLENBQWdCLEVBQWhCLEVBQVAsQ0FBTyxN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QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbHNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzQ29udGVudCI6WyJhc3NlcnQgPSBjaGFpLmFzc2VydFxuR2VvSlNPTiA9IHJlcXVpcmUgXCIuLi9hcHAvanMvR2VvSlNPTlwiXG5cbmRlc2NyaWJlICdHZW9KU09OJywgLT5cbiAgaXQgJ3JldHVybnMgYSBwcm9wZXIgcG9seWdvbicsIC0+XG4gICAgc291dGhXZXN0ID0gbmV3IEwuTGF0TG5nKDEwLCAyMClcbiAgICBub3J0aEVhc3QgPSBuZXcgTC5MYXRMbmcoMTMsIDIzKVxuICAgIGJvdW5kcyA9IG5ldyBMLkxhdExuZ0JvdW5kcyhzb3V0aFdlc3QsIG5vcnRoRWFzdClcblxuICAgIGpzb24gPSBHZW9KU09OLkxhdExuZ0JvdW5kc1RvR2VvSlNPTihib3VuZHMpXG4gICAgYXNzZXJ0IF8uaXNFcXVhbCBqc29uLCB7XG4gICAgICB0eXBlOiBcIlBvbHlnb25cIixcbiAgICAgIGNvb3JkaW5hdGVzOiBbXG4gICAgICAgIFtbMjAsMTBdLFsyMCwxM10sWzIzLDEzXSxbMjMsMTBdXVxuICAgICAgXVxuICAgIH1cbiIsImFzc2VydCA9IGNoYWkuYXNzZXJ0XG5Mb2NhbERiID0gcmVxdWlyZSBcIi4uL2FwcC9qcy9kYi9Mb2NhbERiXCJcbmRiX3F1ZXJpZXMgPSByZXF1aXJlIFwiLi9kYl9xdWVyaWVzXCJcblxuZGVzY3JpYmUgJ0xvY2FsRGInLCAtPlxuICBiZWZvcmUgLT5cbiAgICBAZGIgPSBuZXcgTG9jYWxEYigndGVzdCcpXG5cbiAgYmVmb3JlRWFjaCAoZG9uZSkgLT5cbiAgICBAZGIucmVtb3ZlQ29sbGVjdGlvbigndGVzdCcpXG4gICAgQGRiLmFkZENvbGxlY3Rpb24oJ3Rlc3QnKVxuICAgIGRvbmUoKVxuXG4gIGRlc2NyaWJlIFwicGFzc2VzIHF1ZXJpZXNcIiwgLT5cbiAgICBkYl9xdWVyaWVzLmNhbGwodGhpcylcblxuICBpdCAnY2FjaGVzIHJvd3MnLCAoZG9uZSkgLT5cbiAgICBAZGIudGVzdC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdhcHBsZScgfV0sIHt9LCB7fSwgPT5cbiAgICAgIEBkYi50ZXN0LmZpbmQoe30pLmZldGNoIChyZXN1bHRzKSAtPlxuICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0c1swXS5hLCAnYXBwbGUnXG4gICAgICAgIGRvbmUoKVxuXG4gIGl0ICdjYWNoZSBvdmVyd3JpdGUgZXhpc3RpbmcnLCAoZG9uZSkgLT5cbiAgICBAZGIudGVzdC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdhcHBsZScgfV0sIHt9LCB7fSwgPT5cbiAgICAgIEBkYi50ZXN0LmNhY2hlIFt7IF9pZDogMSwgYTogJ2JhbmFuYScgfV0sIHt9LCB7fSwgPT5cbiAgICAgICAgQGRiLnRlc3QuZmluZCh7fSkuZmV0Y2ggKHJlc3VsdHMpIC0+XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHNbMF0uYSwgJ2JhbmFuYSdcbiAgICAgICAgICBkb25lKClcblxuICBpdCBcImNhY2hlIGRvZXNuJ3Qgb3ZlcndyaXRlIHVwc2VydFwiLCAoZG9uZSkgLT5cbiAgICBAZGIudGVzdC51cHNlcnQgeyBfaWQ6IDEsIGE6ICdhcHBsZScgfSwgPT5cbiAgICAgIEBkYi50ZXN0LmNhY2hlIFt7IF9pZDogMSwgYTogJ2JhbmFuYScgfV0sIHt9LCB7fSwgPT5cbiAgICAgICAgQGRiLnRlc3QuZmluZCh7fSkuZmV0Y2ggKHJlc3VsdHMpIC0+XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHNbMF0uYSwgJ2FwcGxlJ1xuICAgICAgICAgIGRvbmUoKVxuXG4gIGl0IFwiY2FjaGUgZG9lc24ndCBvdmVyd3JpdGUgcmVtb3ZlXCIsIChkb25lKSAtPlxuICAgIEBkYi50ZXN0LmNhY2hlIFt7IF9pZDogMSwgYTogJ2RlbGV0ZScgfV0sIHt9LCB7fSwgPT5cbiAgICAgIEBkYi50ZXN0LnJlbW92ZSAxLCA9PlxuICAgICAgQGRiLnRlc3QuY2FjaGUgW3sgX2lkOiAxLCBhOiAnYmFuYW5hJyB9XSwge30sIHt9LCA9PlxuICAgICAgICBAZGIudGVzdC5maW5kKHt9KS5mZXRjaCAocmVzdWx0cykgLT5cbiAgICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0cy5sZW5ndGgsIDBcbiAgICAgICAgICBkb25lKClcblxuICBpdCBcImNhY2hlIHJlbW92ZXMgbWlzc2luZyB1bnNvcnRlZFwiLCAoZG9uZSkgLT5cbiAgICBAZGIudGVzdC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdhJyB9LCB7IF9pZDogMiwgYTogJ2InIH0sIHsgX2lkOiAzLCBhOiAnYycgfV0sIHt9LCB7fSwgPT5cbiAgICAgIEBkYi50ZXN0LmNhY2hlIFt7IF9pZDogMSwgYTogJ2EnIH0sIHsgX2lkOiAzLCBhOiAnYycgfV0sIHt9LCB7fSwgPT5cbiAgICAgICAgQGRiLnRlc3QuZmluZCh7fSkuZmV0Y2ggKHJlc3VsdHMpIC0+XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHMubGVuZ3RoLCAyXG4gICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJjYWNoZSByZW1vdmVzIG1pc3NpbmcgZmlsdGVyZWRcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnRlc3QuY2FjaGUgW3sgX2lkOiAxLCBhOiAnYScgfSwgeyBfaWQ6IDIsIGE6ICdiJyB9LCB7IF9pZDogMywgYTogJ2MnIH1dLCB7fSwge30sID0+XG4gICAgICBAZGIudGVzdC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdhJyB9XSwge19pZDogeyRsdDozfX0sIHt9LCA9PlxuICAgICAgICBAZGIudGVzdC5maW5kKHt9LCB7c29ydDpbJ19pZCddfSkuZmV0Y2ggKHJlc3VsdHMpIC0+XG4gICAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCBfLnBsdWNrKHJlc3VsdHMsICdfaWQnKSwgWzEsM11cbiAgICAgICAgICBkb25lKClcblxuICBpdCBcImNhY2hlIHJlbW92ZXMgbWlzc2luZyBzb3J0ZWQgbGltaXRlZFwiLCAoZG9uZSkgLT5cbiAgICBAZGIudGVzdC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdhJyB9LCB7IF9pZDogMiwgYTogJ2InIH0sIHsgX2lkOiAzLCBhOiAnYycgfV0sIHt9LCB7fSwgPT5cbiAgICAgIEBkYi50ZXN0LmNhY2hlIFt7IF9pZDogMSwgYTogJ2EnIH1dLCB7fSwge3NvcnQ6WydfaWQnXSwgbGltaXQ6Mn0sID0+XG4gICAgICAgIEBkYi50ZXN0LmZpbmQoe30sIHtzb3J0OlsnX2lkJ119KS5mZXRjaCAocmVzdWx0cykgLT5cbiAgICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIF8ucGx1Y2socmVzdWx0cywgJ19pZCcpLCBbMSwzXVxuICAgICAgICAgIGRvbmUoKVxuXG4gIGl0IFwiY2FjaGUgZG9lcyBub3QgcmVtb3ZlIG1pc3Npbmcgc29ydGVkIGxpbWl0ZWQgcGFzdCBlbmRcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnRlc3QuY2FjaGUgW3sgX2lkOiAxLCBhOiAnYScgfSwgeyBfaWQ6IDIsIGE6ICdiJyB9LCB7IF9pZDogMywgYTogJ2MnIH0sIHsgX2lkOiA0LCBhOiAnZCcgfV0sIHt9LCB7fSwgPT5cbiAgICAgIEBkYi50ZXN0LnJlbW92ZSAyLCA9PlxuICAgICAgICBAZGIudGVzdC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdhJyB9LCB7IF9pZDogMiwgYTogJ2InIH1dLCB7fSwge3NvcnQ6WydfaWQnXSwgbGltaXQ6Mn0sID0+XG4gICAgICAgICAgQGRiLnRlc3QuZmluZCh7fSwge3NvcnQ6WydfaWQnXX0pLmZldGNoIChyZXN1bHRzKSAtPlxuICAgICAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCBfLnBsdWNrKHJlc3VsdHMsICdfaWQnKSwgWzEsMyw0XVxuICAgICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJyZXR1cm5zIHBlbmRpbmcgdXBzZXJ0c1wiLCAoZG9uZSkgLT5cbiAgICBAZGIudGVzdC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdhcHBsZScgfV0sIHt9LCB7fSwgPT5cbiAgICAgIEBkYi50ZXN0LnVwc2VydCB7IF9pZDogMiwgYTogJ2JhbmFuYScgfSwgPT5cbiAgICAgICAgQGRiLnRlc3QucGVuZGluZ1Vwc2VydHMgKHJlc3VsdHMpID0+XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHMubGVuZ3RoLCAxXG4gICAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHNbMF0uYSwgJ2JhbmFuYSdcbiAgICAgICAgICBkb25lKClcblxuICBpdCBcInJlc29sdmVzIHBlbmRpbmcgdXBzZXJ0c1wiLCAoZG9uZSkgLT5cbiAgICBAZGIudGVzdC51cHNlcnQgeyBfaWQ6IDIsIGE6ICdiYW5hbmEnIH0sID0+XG4gICAgICBAZGIudGVzdC5yZXNvbHZlVXBzZXJ0IHsgX2lkOiAyLCBhOiAnYmFuYW5hJyB9LCA9PlxuICAgICAgICBAZGIudGVzdC5wZW5kaW5nVXBzZXJ0cyAocmVzdWx0cykgPT5cbiAgICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0cy5sZW5ndGgsIDBcbiAgICAgICAgICBkb25lKClcblxuICBpdCBcInJldGFpbnMgY2hhbmdlZCBwZW5kaW5nIHVwc2VydHNcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnRlc3QudXBzZXJ0IHsgX2lkOiAyLCBhOiAnYmFuYW5hJyB9LCA9PlxuICAgICAgQGRiLnRlc3QudXBzZXJ0IHsgX2lkOiAyLCBhOiAnYmFuYW5hMicgfSwgPT5cbiAgICAgICAgQGRiLnRlc3QucmVzb2x2ZVVwc2VydCB7IF9pZDogMiwgYTogJ2JhbmFuYScgfSwgPT5cbiAgICAgICAgICBAZGIudGVzdC5wZW5kaW5nVXBzZXJ0cyAocmVzdWx0cykgPT5cbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzLmxlbmd0aCwgMVxuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHNbMF0uYSwgJ2JhbmFuYTInXG4gICAgICAgICAgICBkb25lKClcblxuICBpdCBcInJlbW92ZXMgcGVuZGluZyB1cHNlcnRzXCIsIChkb25lKSAtPlxuICAgIEBkYi50ZXN0LnVwc2VydCB7IF9pZDogMiwgYTogJ2JhbmFuYScgfSwgPT5cbiAgICAgIEBkYi50ZXN0LnJlbW92ZSAyLCA9PlxuICAgICAgICBAZGIudGVzdC5wZW5kaW5nVXBzZXJ0cyAocmVzdWx0cykgPT5cbiAgICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0cy5sZW5ndGgsIDBcbiAgICAgICAgICBkb25lKClcblxuICBpdCBcInJldHVybnMgcGVuZGluZyByZW1vdmVzXCIsIChkb25lKSAtPlxuICAgIEBkYi50ZXN0LmNhY2hlIFt7IF9pZDogMSwgYTogJ2FwcGxlJyB9XSwge30sIHt9LCA9PlxuICAgICAgQGRiLnRlc3QucmVtb3ZlIDEsID0+XG4gICAgICAgIEBkYi50ZXN0LnBlbmRpbmdSZW1vdmVzIChyZXN1bHRzKSA9PlxuICAgICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzLmxlbmd0aCwgMVxuICAgICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzWzBdLCAxXG4gICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJyZXNvbHZlcyBwZW5kaW5nIHJlbW92ZXNcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnRlc3QuY2FjaGUgW3sgX2lkOiAxLCBhOiAnYXBwbGUnIH1dLCB7fSwge30sID0+XG4gICAgICBAZGIudGVzdC5yZW1vdmUgMSwgPT5cbiAgICAgICAgQGRiLnRlc3QucmVzb2x2ZVJlbW92ZSAxLCA9PlxuICAgICAgICAgIEBkYi50ZXN0LnBlbmRpbmdSZW1vdmVzIChyZXN1bHRzKSA9PlxuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHMubGVuZ3RoLCAwXG4gICAgICAgICAgICBkb25lKClcblxuICBpdCBcInNlZWRzXCIsIChkb25lKSAtPlxuICAgIEBkYi50ZXN0LnNlZWQgeyBfaWQ6IDEsIGE6ICdhcHBsZScgfSwgPT5cbiAgICAgIEBkYi50ZXN0LmZpbmQoe30pLmZldGNoIChyZXN1bHRzKSAtPlxuICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0c1swXS5hLCAnYXBwbGUnXG4gICAgICAgIGRvbmUoKVxuXG4gIGl0IFwiZG9lcyBub3Qgb3ZlcndyaXRlIGV4aXN0aW5nXCIsIChkb25lKSAtPlxuICAgIEBkYi50ZXN0LmNhY2hlIFt7IF9pZDogMSwgYTogJ2JhbmFuYScgfV0sIHt9LCB7fSwgPT5cbiAgICAgIEBkYi50ZXN0LnNlZWQgeyBfaWQ6IDEsIGE6ICdhcHBsZScgfSwgPT5cbiAgICAgICAgQGRiLnRlc3QuZmluZCh7fSkuZmV0Y2ggKHJlc3VsdHMpIC0+XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHNbMF0uYSwgJ2JhbmFuYSdcbiAgICAgICAgICBkb25lKClcblxuICBpdCBcImRvZXMgbm90IGFkZCByZW1vdmVkXCIsIChkb25lKSAtPlxuICAgIEBkYi50ZXN0LmNhY2hlIFt7IF9pZDogMSwgYTogJ2FwcGxlJyB9XSwge30sIHt9LCA9PlxuICAgICAgQGRiLnRlc3QucmVtb3ZlIDEsID0+XG4gICAgICAgIEBkYi50ZXN0LnNlZWQgeyBfaWQ6IDEsIGE6ICdhcHBsZScgfSwgPT5cbiAgICAgICAgICBAZGIudGVzdC5maW5kKHt9KS5mZXRjaCAocmVzdWx0cykgLT5cbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzLmxlbmd0aCwgMFxuICAgICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJyZXRhaW5zIGl0ZW1zXCIsIChkb25lKSAtPlxuICAgIEBkYi50ZXN0LnVwc2VydCB7IF9pZDoxLCBhOlwiQWxpY2VcIiB9LCA9PlxuICAgICAgZGIyID0gbmV3IExvY2FsRGIoJ3Rlc3QnKVxuICAgICAgZGIyLmFkZENvbGxlY3Rpb24gJ3Rlc3QnXG4gICAgICBkYjIudGVzdC5maW5kKHt9KS5mZXRjaCAocmVzdWx0cykgLT5cbiAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHNbMF0uYSwgXCJBbGljZVwiXG4gICAgICAgIGRvbmUoKVxuXG4gIGl0IFwicmV0YWlucyB1cHNlcnRzXCIsIChkb25lKSAtPlxuICAgIEBkYi50ZXN0LnVwc2VydCB7IF9pZDoxLCBhOlwiQWxpY2VcIiB9LCA9PlxuICAgICAgZGIyID0gbmV3IExvY2FsRGIoJ3Rlc3QnKVxuICAgICAgZGIyLmFkZENvbGxlY3Rpb24gJ3Rlc3QnXG4gICAgICBkYjIudGVzdC5maW5kKHt9KS5mZXRjaCAocmVzdWx0cykgLT5cbiAgICAgICAgZGIyLnRlc3QucGVuZGluZ1Vwc2VydHMgKHVwc2VydHMpIC0+XG4gICAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCByZXN1bHRzLCB1cHNlcnRzXG4gICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJyZXRhaW5zIHJlbW92ZXNcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnRlc3Quc2VlZCB7IF9pZDoxLCBhOlwiQWxpY2VcIiB9LCA9PlxuICAgICAgQGRiLnRlc3QucmVtb3ZlIDEsID0+XG4gICAgICAgIGRiMiA9IG5ldyBMb2NhbERiKCd0ZXN0JylcbiAgICAgICAgZGIyLmFkZENvbGxlY3Rpb24gJ3Rlc3QnXG4gICAgICAgIGRiMi50ZXN0LnBlbmRpbmdSZW1vdmVzIChyZW1vdmVzKSAtPlxuICAgICAgICAgIGFzc2VydC5kZWVwRXF1YWwgcmVtb3ZlcywgWzFdXG4gICAgICAgICAgZG9uZSgpXG4iLCJhc3NlcnQgPSBjaGFpLmFzc2VydFxuSXRlbVRyYWNrZXIgPSByZXF1aXJlIFwiLi4vYXBwL2pzL0l0ZW1UcmFja2VyXCJcblxuZGVzY3JpYmUgJ0l0ZW1UcmFja2VyJywgLT5cbiAgYmVmb3JlRWFjaCAtPlxuICAgIEB0cmFja2VyID0gbmV3IEl0ZW1UcmFja2VyKClcblxuICBpdCBcInJlY29yZHMgYWRkc1wiLCAtPlxuICAgIGl0ZW1zID0gIFtcbiAgICAgIF9pZDogMSwgeDoxXG4gICAgICBfaWQ6IDIsIHg6MlxuICAgIF1cbiAgICBbYWRkcywgcmVtb3Zlc10gPSBAdHJhY2tlci51cGRhdGUoaXRlbXMpXG4gICAgYXNzZXJ0LmRlZXBFcXVhbCBhZGRzLCBpdGVtc1xuICAgIGFzc2VydC5kZWVwRXF1YWwgcmVtb3ZlcywgW11cblxuICBpdCBcInJlbWVtYmVycyBpdGVtc1wiLCAtPlxuICAgIGl0ZW1zID0gIFtcbiAgICAgIHtfaWQ6IDEsIHg6MX1cbiAgICAgIHtfaWQ6IDIsIHg6Mn1cbiAgICBdXG4gICAgW2FkZHMsIHJlbW92ZXNdID0gQHRyYWNrZXIudXBkYXRlKGl0ZW1zKVxuICAgIFthZGRzLCByZW1vdmVzXSA9IEB0cmFja2VyLnVwZGF0ZShpdGVtcylcbiAgICBhc3NlcnQuZGVlcEVxdWFsIGFkZHMsIFtdXG4gICAgYXNzZXJ0LmRlZXBFcXVhbCByZW1vdmVzLCBbXVxuXG4gIGl0IFwic2VlcyByZW1vdmVkIGl0ZW1zXCIsIC0+XG4gICAgaXRlbXMxID0gIFtcbiAgICAgIHtfaWQ6IDEsIHg6MX1cbiAgICAgIHtfaWQ6IDIsIHg6Mn1cbiAgICBdXG4gICAgaXRlbXMyID0gIFtcbiAgICAgIHtfaWQ6IDEsIHg6MX1cbiAgICBdXG4gICAgQHRyYWNrZXIudXBkYXRlKGl0ZW1zMSlcbiAgICBbYWRkcywgcmVtb3Zlc10gPSBAdHJhY2tlci51cGRhdGUoaXRlbXMyKVxuICAgIGFzc2VydC5kZWVwRXF1YWwgYWRkcywgW11cbiAgICBhc3NlcnQuZGVlcEVxdWFsIHJlbW92ZXMsIFt7X2lkOiAyLCB4OjJ9XVxuXG4gIGl0IFwic2VlcyByZW1vdmVkIGNoYW5nZXNcIiwgLT5cbiAgICBpdGVtczEgPSAgW1xuICAgICAge19pZDogMSwgeDoxfVxuICAgICAge19pZDogMiwgeDoyfVxuICAgIF1cbiAgICBpdGVtczIgPSAgW1xuICAgICAge19pZDogMSwgeDoxfVxuICAgICAge19pZDogMiwgeDo0fVxuICAgIF1cbiAgICBAdHJhY2tlci51cGRhdGUoaXRlbXMxKVxuICAgIFthZGRzLCByZW1vdmVzXSA9IEB0cmFja2VyLnVwZGF0ZShpdGVtczIpXG4gICAgYXNzZXJ0LmRlZXBFcXVhbCBhZGRzLCBbe19pZDogMiwgeDo0fV1cbiAgICBhc3NlcnQuZGVlcEVxdWFsIHJlbW92ZXMsIFt7X2lkOiAyLCB4OjJ9XVxuIiwiYXNzZXJ0ID0gY2hhaS5hc3NlcnRcblxubW9kdWxlLmV4cG9ydHMgPSAtPlxuICBjb250ZXh0ICdXaXRoIHNhbXBsZSByb3dzJywgLT5cbiAgICBiZWZvcmVFYWNoIChkb25lKSAtPlxuICAgICAgQGRiLnRlc3QudXBzZXJ0IHsgX2lkOjEsIGE6XCJBbGljZVwiIH0sID0+XG4gICAgICAgIEBkYi50ZXN0LnVwc2VydCB7IF9pZDoyLCBhOlwiQ2hhcmxpZVwiIH0sID0+XG4gICAgICAgICAgQGRiLnRlc3QudXBzZXJ0IHsgX2lkOjMsIGE6XCJCb2JcIiB9LCA9PlxuICAgICAgICAgICAgZG9uZSgpXG5cbiAgICBpdCAnZmluZHMgYWxsIHJvd3MnLCAoZG9uZSkgLT5cbiAgICAgIEBkYi50ZXN0LmZpbmQoe30pLmZldGNoIChyZXN1bHRzKSA9PlxuICAgICAgICBhc3NlcnQuZXF1YWwgMywgcmVzdWx0cy5sZW5ndGhcbiAgICAgICAgZG9uZSgpXG5cbiAgICBpdCAnZmluZHMgYWxsIHJvd3Mgd2l0aCBvcHRpb25zJywgKGRvbmUpIC0+XG4gICAgICBAZGIudGVzdC5maW5kKHt9LCB7fSkuZmV0Y2ggKHJlc3VsdHMpID0+XG4gICAgICAgIGFzc2VydC5lcXVhbCAzLCByZXN1bHRzLmxlbmd0aFxuICAgICAgICBkb25lKClcblxuICAgIGl0ICdmaWx0ZXJzIHJvd3MgYnkgaWQnLCAoZG9uZSkgLT5cbiAgICAgIEBkYi50ZXN0LmZpbmQoeyBfaWQ6IDEgfSkuZmV0Y2ggKHJlc3VsdHMpID0+XG4gICAgICAgIGFzc2VydC5lcXVhbCAxLCByZXN1bHRzLmxlbmd0aFxuICAgICAgICBhc3NlcnQuZXF1YWwgJ0FsaWNlJywgcmVzdWx0c1swXS5hXG4gICAgICAgIGRvbmUoKVxuXG4gICAgaXQgJ2ZpbmRzIG9uZSByb3cnLCAoZG9uZSkgLT5cbiAgICAgIEBkYi50ZXN0LmZpbmRPbmUgeyBfaWQ6IDIgfSwgKHJlc3VsdCkgPT5cbiAgICAgICAgYXNzZXJ0LmVxdWFsICdDaGFybGllJywgcmVzdWx0LmFcbiAgICAgICAgZG9uZSgpXG5cbiAgICBpdCAncmVtb3ZlcyBpdGVtJywgKGRvbmUpIC0+XG4gICAgICBAZGIudGVzdC5yZW1vdmUgMiwgPT5cbiAgICAgICAgQGRiLnRlc3QuZmluZCh7fSkuZmV0Y2ggKHJlc3VsdHMpID0+XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsIDIsIHJlc3VsdHMubGVuZ3RoXG4gICAgICAgICAgYXNzZXJ0IDEgaW4gKHJlc3VsdC5faWQgZm9yIHJlc3VsdCBpbiByZXN1bHRzKVxuICAgICAgICAgIGFzc2VydCAyIG5vdCBpbiAocmVzdWx0Ll9pZCBmb3IgcmVzdWx0IGluIHJlc3VsdHMpXG4gICAgICAgICAgZG9uZSgpXG5cbiAgICBpdCAncmVtb3ZlcyBub24tZXhpc3RlbnQgaXRlbScsIChkb25lKSAtPlxuICAgICAgQGRiLnRlc3QucmVtb3ZlIDk5OSwgPT5cbiAgICAgICAgQGRiLnRlc3QuZmluZCh7fSkuZmV0Y2ggKHJlc3VsdHMpID0+XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsIDMsIHJlc3VsdHMubGVuZ3RoXG4gICAgICAgICAgZG9uZSgpXG5cbiAgICBpdCAnc29ydHMgYXNjZW5kaW5nJywgKGRvbmUpIC0+XG4gICAgICBAZGIudGVzdC5maW5kKHt9LCB7c29ydDogWydhJ119KS5mZXRjaCAocmVzdWx0cykgPT5cbiAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCBfLnBsdWNrKHJlc3VsdHMsICdfaWQnKSwgWzEsMywyXVxuICAgICAgICBkb25lKClcblxuICAgIGl0ICdzb3J0cyBkZXNjZW5kaW5nJywgKGRvbmUpIC0+XG4gICAgICBAZGIudGVzdC5maW5kKHt9LCB7c29ydDogW1snYScsJ2Rlc2MnXV19KS5mZXRjaCAocmVzdWx0cykgPT5cbiAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCBfLnBsdWNrKHJlc3VsdHMsICdfaWQnKSwgWzIsMywxXVxuICAgICAgICBkb25lKClcblxuICAgIGl0ICdsaW1pdHMnLCAoZG9uZSkgLT5cbiAgICAgIEBkYi50ZXN0LmZpbmQoe30sIHtzb3J0OiBbJ2EnXSwgbGltaXQ6Mn0pLmZldGNoIChyZXN1bHRzKSA9PlxuICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIF8ucGx1Y2socmVzdWx0cywgJ19pZCcpLCBbMSwzXVxuICAgICAgICBkb25lKClcblxuICBpdCAnYWRkcyBfaWQgdG8gcm93cycsIChkb25lKSAtPlxuICAgIEBkYi50ZXN0LnVwc2VydCB7IGE6IDEgfSwgKGl0ZW0pID0+XG4gICAgICBhc3NlcnQucHJvcGVydHkgaXRlbSwgJ19pZCdcbiAgICAgIGFzc2VydC5sZW5ndGhPZiBpdGVtLl9pZCwgMzJcbiAgICAgIGRvbmUoKVxuXG4gIGl0ICd1cGRhdGVzIGJ5IGlkJywgKGRvbmUpIC0+XG4gICAgQGRiLnRlc3QudXBzZXJ0IHsgX2lkOjEsIGE6MSB9LCAoaXRlbSkgPT5cbiAgICAgIEBkYi50ZXN0LnVwc2VydCB7IF9pZDoxLCBhOjIgfSwgKGl0ZW0pID0+XG4gICAgICAgIGFzc2VydC5lcXVhbCBpdGVtLmEsIDJcbiAgXG4gICAgICAgIEBkYi50ZXN0LmZpbmQoe30pLmZldGNoIChyZXN1bHRzKSA9PlxuICAgICAgICAgIGFzc2VydC5lcXVhbCAxLCByZXN1bHRzLmxlbmd0aFxuICAgICAgICAgIGRvbmUoKVxuXG5cbiAgZ2VvcG9pbnQgPSAobG5nLCBsYXQpIC0+XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZTogJ1BvaW50J1xuICAgICAgICBjb29yZGluYXRlczogW2xuZywgbGF0XVxuICAgIH1cblxuICBjb250ZXh0ICdXaXRoIGdlb2xvY2F0ZWQgcm93cycsIC0+XG4gICAgYmVmb3JlRWFjaCAoZG9uZSkgLT5cbiAgICAgIEBkYi50ZXN0LnVwc2VydCB7IF9pZDoxLCBsb2M6Z2VvcG9pbnQoOTAsIDQ1KSB9LCA9PlxuICAgICAgICBAZGIudGVzdC51cHNlcnQgeyBfaWQ6MiwgbG9jOmdlb3BvaW50KDkwLCA0NikgfSwgPT5cbiAgICAgICAgICBAZGIudGVzdC51cHNlcnQgeyBfaWQ6MywgbG9jOmdlb3BvaW50KDkxLCA0NSkgfSwgPT5cbiAgICAgICAgICAgIEBkYi50ZXN0LnVwc2VydCB7IF9pZDo0LCBsb2M6Z2VvcG9pbnQoOTEsIDQ2KSB9LCA9PlxuICAgICAgICAgICAgICBkb25lKClcblxuICAgIGl0ICdmaW5kcyBwb2ludHMgbmVhcicsIChkb25lKSAtPlxuICAgICAgc2VsZWN0b3IgPSBsb2M6IFxuICAgICAgICAkbmVhcjogXG4gICAgICAgICAgJGdlb21ldHJ5OiBnZW9wb2ludCg5MCwgNDUpXG5cbiAgICAgIEBkYi50ZXN0LmZpbmQoc2VsZWN0b3IpLmZldGNoIChyZXN1bHRzKSA9PlxuICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIF8ucGx1Y2socmVzdWx0cywgJ19pZCcpLCBbMSwzLDIsNF1cbiAgICAgICAgZG9uZSgpICAgICAgXG4iLCJcbiMgVHJhY2tzIGEgc2V0IG9mIGl0ZW1zIGJ5IGlkLCBpbmRpY2F0aW5nIHdoaWNoIGhhdmUgYmVlbiBhZGRlZCBvciByZW1vdmVkLlxuIyBDaGFuZ2VzIGFyZSBib3RoIGFkZCBhbmQgcmVtb3ZlXG5jbGFzcyBJdGVtVHJhY2tlclxuICBjb25zdHJ1Y3RvcjogLT5cbiAgICBAa2V5ID0gJ19pZCdcbiAgICBAaXRlbXMgPSB7fVxuXG4gIHVwZGF0ZTogKGl0ZW1zKSAtPiAgICAjIFJldHVybiBbW2FkZGVkXSxbcmVtb3ZlZF1dIGl0ZW1zXG4gICAgYWRkcyA9IFtdXG4gICAgcmVtb3ZlcyA9IFtdXG5cbiAgICAjIEFkZCBhbnkgbmV3IG9uZXNcbiAgICBmb3IgaXRlbSBpbiBpdGVtc1xuICAgICAgaWYgbm90IF8uaGFzKEBpdGVtcywgaXRlbVtAa2V5XSlcbiAgICAgICAgYWRkcy5wdXNoKGl0ZW0pXG5cbiAgICAjIENyZWF0ZSBtYXAgb2YgaXRlbXMgcGFyYW1ldGVyXG4gICAgbWFwID0gXy5vYmplY3QoXy5wbHVjayhpdGVtcywgQGtleSksIGl0ZW1zKVxuXG4gICAgIyBGaW5kIHJlbW92ZXNcbiAgICBmb3Iga2V5LCB2YWx1ZSBvZiBAaXRlbXNcbiAgICAgIGlmIG5vdCBfLmhhcyhtYXAsIGtleSlcbiAgICAgICAgcmVtb3Zlcy5wdXNoKHZhbHVlKVxuICAgICAgZWxzZSBpZiBub3QgXy5pc0VxdWFsKHZhbHVlLCBtYXBba2V5XSlcbiAgICAgICAgYWRkcy5wdXNoKG1hcFtrZXldKVxuICAgICAgICByZW1vdmVzLnB1c2godmFsdWUpXG5cbiAgICBmb3IgaXRlbSBpbiByZW1vdmVzXG4gICAgICBkZWxldGUgQGl0ZW1zW2l0ZW1bQGtleV1dXG5cbiAgICBmb3IgaXRlbSBpbiBhZGRzXG4gICAgICBAaXRlbXNbaXRlbVtAa2V5XV0gPSBpdGVtXG5cbiAgICByZXR1cm4gW2FkZHMsIHJlbW92ZXNdXG5cbm1vZHVsZS5leHBvcnRzID0gSXRlbVRyYWNrZXIiLCIjIEdlb0pTT04gaGVscGVyIHJvdXRpbmVzXG5cbmV4cG9ydHMuTGF0TG5nQm91bmRzVG9HZW9KU09OID0gKGJvdW5kcykgLT5cbiAgc3cgPSBib3VuZHMuZ2V0U291dGhXZXN0KClcbiAgbmUgPSBib3VuZHMuZ2V0Tm9ydGhFYXN0KClcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiAnUG9seWdvbicsXG4gICAgY29vcmRpbmF0ZXM6IFtcbiAgICAgIFtbc3cubG5nLCBzdy5sYXRdLCBcbiAgICAgIFtzdy5sbmcsIG5lLmxhdF0sIFxuICAgICAgW25lLmxuZywgbmUubGF0XSwgXG4gICAgICBbbmUubG5nLCBzdy5sYXRdXVxuICAgIF1cbiAgfSIsImNvbXBpbGVEb2N1bWVudFNlbGVjdG9yID0gcmVxdWlyZSgnLi9zZWxlY3RvcicpLmNvbXBpbGVEb2N1bWVudFNlbGVjdG9yXG5jb21waWxlU29ydCA9IHJlcXVpcmUoJy4vc2VsZWN0b3InKS5jb21waWxlU29ydFxuXG5jbGFzcyBMb2NhbERiXG4gIGNvbnN0cnVjdG9yOiAobmFtZSkgLT5cbiAgICBAbmFtZSA9IG5hbWVcblxuICBhZGRDb2xsZWN0aW9uOiAobmFtZSkgLT5cbiAgICBkYk5hbWUgPSBAbmFtZVxuICAgIG5hbWVzcGFjZSA9IFwiZGIuI3tkYk5hbWV9LiN7bmFtZX0uXCJcblxuICAgIEBbbmFtZV0gPSBuZXcgQ29sbGVjdGlvbihuYW1lc3BhY2UpXG5cbiAgcmVtb3ZlQ29sbGVjdGlvbjogKG5hbWUpIC0+XG4gICAgZGJOYW1lID0gQG5hbWVcbiAgICBuYW1lc3BhY2UgPSBcImRiLiN7ZGJOYW1lfS4je25hbWV9LlwiXG5cbiAgICBpZiB3aW5kb3cubG9jYWxTdG9yYWdlXG4gICAgICBrZXlzID0gW11cbiAgICAgIGZvciBpIGluIFswLi4ubG9jYWxTdG9yYWdlLmxlbmd0aF1cbiAgICAgICAga2V5cy5wdXNoKGxvY2FsU3RvcmFnZS5rZXkoaSkpXG5cbiAgICAgIGZvciBrZXkgaW4ga2V5c1xuICAgICAgICBpZiBrZXkuc3Vic3RyaW5nKDAsIG5hbWVzcGFjZS5sZW5ndGgpID09IG5hbWVzcGFjZVxuICAgICAgICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKGtleSlcblxuICAgIGRlbGV0ZSBAW25hbWVdXG5cbiMgU3RvcmVzIGRhdGEgaW4gbWVtb3J5LCBiYWNrZWQgYnkgbG9jYWwgc3RvcmFnZVxuY2xhc3MgQ29sbGVjdGlvblxuICBjb25zdHJ1Y3RvcjogKG5hbWVzcGFjZSkgLT5cbiAgICBAbmFtZXNwYWNlID0gbmFtZXNwYWNlXG5cbiAgICBAaXRlbXMgPSB7fVxuICAgIEB1cHNlcnRzID0ge30gICMgUGVuZGluZyB1cHNlcnRzIGJ5IF9pZC4gU3RpbGwgaW4gaXRlbXNcbiAgICBAcmVtb3ZlcyA9IHt9ICAjIFBlbmRpbmcgcmVtb3ZlcyBieSBfaWQuIE5vIGxvbmdlciBpbiBpdGVtc1xuXG4gICAgIyBSZWFkIGZyb20gbG9jYWwgc3RvcmFnZVxuICAgIGlmIHdpbmRvdy5sb2NhbFN0b3JhZ2VcbiAgICAgIEBsb2FkU3RvcmFnZSgpXG5cbiAgbG9hZFN0b3JhZ2U6IC0+XG4gICAgIyBSZWFkIGl0ZW1zIGZyb20gbG9jYWxTdG9yYWdlXG4gICAgQGl0ZW1OYW1lc3BhY2UgPSBAbmFtZXNwYWNlICsgXCJfXCJcblxuICAgIGZvciBpIGluIFswLi4ubG9jYWxTdG9yYWdlLmxlbmd0aF1cbiAgICAgIGtleSA9IGxvY2FsU3RvcmFnZS5rZXkoaSlcbiAgICAgIGlmIGtleS5zdWJzdHJpbmcoMCwgQGl0ZW1OYW1lc3BhY2UubGVuZ3RoKSA9PSBAaXRlbU5hbWVzcGFjZVxuICAgICAgICBpdGVtID0gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2Vba2V5XSlcbiAgICAgICAgQGl0ZW1zW2l0ZW0uX2lkXSA9IGl0ZW1cblxuICAgICMgUmVhZCB1cHNlcnRzXG4gICAgdXBzZXJ0S2V5cyA9IGlmIGxvY2FsU3RvcmFnZVtAbmFtZXNwYWNlK1widXBzZXJ0c1wiXSB0aGVuIEpTT04ucGFyc2UobG9jYWxTdG9yYWdlW0BuYW1lc3BhY2UrXCJ1cHNlcnRzXCJdKSBlbHNlIFtdXG4gICAgZm9yIGtleSBpbiB1cHNlcnRLZXlzXG4gICAgICBAdXBzZXJ0c1trZXldID0gQGl0ZW1zW2tleV1cblxuICAgICMgUmVhZCByZW1vdmVzXG4gICAgcmVtb3ZlSXRlbXMgPSBpZiBsb2NhbFN0b3JhZ2VbQG5hbWVzcGFjZStcInJlbW92ZXNcIl0gdGhlbiBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZVtAbmFtZXNwYWNlK1wicmVtb3Zlc1wiXSkgZWxzZSBbXVxuICAgIEByZW1vdmVzID0gXy5vYmplY3QoXy5wbHVjayhyZW1vdmVJdGVtcywgXCJfaWRcIiksIHJlbW92ZUl0ZW1zKVxuXG4gIGZpbmQ6IChzZWxlY3Rvciwgb3B0aW9ucykgLT5cbiAgICByZXR1cm4gZmV0Y2g6IChzdWNjZXNzLCBlcnJvcikgPT5cbiAgICAgIEBfZmluZEZldGNoKHNlbGVjdG9yLCBvcHRpb25zLCBzdWNjZXNzLCBlcnJvcilcblxuICBmaW5kT25lOiAoc2VsZWN0b3IsIG9wdGlvbnMsIHN1Y2Nlc3MsIGVycm9yKSAtPlxuICAgIGlmIF8uaXNGdW5jdGlvbihvcHRpb25zKSBcbiAgICAgIFtvcHRpb25zLCBzdWNjZXNzLCBlcnJvcl0gPSBbe30sIG9wdGlvbnMsIHN1Y2Nlc3NdXG5cbiAgICBAZmluZChzZWxlY3Rvciwgb3B0aW9ucykuZmV0Y2ggKHJlc3VsdHMpIC0+XG4gICAgICBpZiBzdWNjZXNzPyB0aGVuIHN1Y2Nlc3MoaWYgcmVzdWx0cy5sZW5ndGg+MCB0aGVuIHJlc3VsdHNbMF0gZWxzZSBudWxsKVxuICAgICwgZXJyb3JcblxuICBfZmluZEZldGNoOiAoc2VsZWN0b3IsIG9wdGlvbnMsIHN1Y2Nlc3MsIGVycm9yKSAtPlxuICAgIGZpbHRlcmVkID0gXy5maWx0ZXIoXy52YWx1ZXMoQGl0ZW1zKSwgY29tcGlsZURvY3VtZW50U2VsZWN0b3Ioc2VsZWN0b3IpKVxuXG4gICAgIyBIYW5kbGUgJG5lYXIgb3BlcmF0b3JcbiAgICBmb3Iga2V5LCB2YWx1ZSBvZiBzZWxlY3RvclxuICAgICAgaWYgdmFsdWVbJyRuZWFyJ11cbiAgICAgICAgIyBFeHRyYWN0IGRpc3RhbmNlc1xuICAgICAgICBnZW8gPSB2YWx1ZVsnJG5lYXInXVsnJGdlb21ldHJ5J11cbiAgICAgICAgaWYgZ2VvLnR5cGUgIT0gJ1BvaW50J1xuICAgICAgICAgIGVycm9yICdJbnZhbGlkIG5lYXIgb3BlcmF0b3InXG5cbiAgICAgICAgbmVhciA9IG5ldyBMLkxhdExuZyhnZW8uY29vcmRpbmF0ZXNbMV0sIGdlby5jb29yZGluYXRlc1swXSlcblxuICAgICAgICAjIEdldCBkaXN0YW5jZXNcbiAgICAgICAgZGlzdGFuY2VzID0gXy5tYXAgZmlsdGVyZWQsIChkb2MpIC0+XG4gICAgICAgICAgaWYgZG9jW2tleV0udHlwZSAhPSAnUG9pbnQnXG4gICAgICAgICAgICByZXR1cm4geyBkb2M6IGRvYywgZGlzdGFuY2U6IC0xIH1cbiAgICAgICAgICByZXR1cm4geyBkb2M6IGRvYywgZGlzdGFuY2U6IFxuICAgICAgICAgICAgbmVhci5kaXN0YW5jZVRvKG5ldyBMLkxhdExuZyhkb2Nba2V5XS5jb29yZGluYXRlc1sxXSwgZG9jW2tleV0uY29vcmRpbmF0ZXNbMF0pKVxuICAgICAgICAgIH1cblxuICAgICAgICAjIEZpbHRlciBub24tcG9pbnRzXG4gICAgICAgIGRpc3RhbmNlcyA9IF8uZmlsdGVyIGRpc3RhbmNlcywgKGl0ZW0pIC0+IGl0ZW0uZGlzdGFuY2UgPj0gMFxuXG4gICAgICAgICMgU29ydCBieSBkaXN0YW5jZVxuICAgICAgICBkaXN0YW5jZXMgPSBfLnNvcnRCeSBkaXN0YW5jZXMsICdkaXN0YW5jZSdcblxuICAgICAgICAjIExpbWl0IHRvIDEwMFxuICAgICAgICBkaXN0YW5jZXMgPSBfLmZpcnN0IGRpc3RhbmNlcywgMTAwXG5cbiAgICAgICAgIyBFeHRyYWN0IGRvY3NcbiAgICAgICAgZmlsdGVyZWQgPSBfLnBsdWNrIGRpc3RhbmNlcywgJ2RvYydcblxuICAgIGlmIG9wdGlvbnMgYW5kIG9wdGlvbnMuc29ydCBcbiAgICAgIGZpbHRlcmVkLnNvcnQoY29tcGlsZVNvcnQob3B0aW9ucy5zb3J0KSlcblxuICAgIGlmIG9wdGlvbnMgYW5kIG9wdGlvbnMubGltaXRcbiAgICAgIGZpbHRlcmVkID0gXy5maXJzdCBmaWx0ZXJlZCwgb3B0aW9ucy5saW1pdFxuXG4gICAgaWYgc3VjY2Vzcz8gdGhlbiBzdWNjZXNzKGZpbHRlcmVkKVxuXG4gIHVwc2VydDogKGRvYywgc3VjY2VzcywgZXJyb3IpIC0+XG4gICAgaWYgbm90IGRvYy5faWRcbiAgICAgIGRvYy5faWQgPSBjcmVhdGVVaWQoKVxuXG4gICAgIyBSZXBsYWNlL2FkZCBcbiAgICBAX3B1dEl0ZW0oZG9jKVxuICAgIEBfcHV0VXBzZXJ0KGRvYylcblxuICAgIGlmIHN1Y2Nlc3M/IHRoZW4gc3VjY2Vzcyhkb2MpXG5cbiAgcmVtb3ZlOiAoaWQsIHN1Y2Nlc3MsIGVycm9yKSAtPlxuICAgIGlmIF8uaGFzKEBpdGVtcywgaWQpXG4gICAgICBAX3B1dFJlbW92ZShAaXRlbXNbaWRdKVxuICAgICAgQF9kZWxldGVJdGVtKGlkKVxuICAgICAgQF9kZWxldGVVcHNlcnQoaWQpXG5cbiAgICBpZiBzdWNjZXNzPyB0aGVuIHN1Y2Nlc3MoKVxuXG4gIF9wdXRJdGVtOiAoZG9jKSAtPlxuICAgIEBpdGVtc1tkb2MuX2lkXSA9IGRvY1xuICAgIGxvY2FsU3RvcmFnZVtAaXRlbU5hbWVzcGFjZSArIGRvYy5faWRdID0gSlNPTi5zdHJpbmdpZnkoZG9jKVxuXG4gIF9kZWxldGVJdGVtOiAoaWQpIC0+XG4gICAgZGVsZXRlIEBpdGVtc1tpZF1cblxuICBfcHV0VXBzZXJ0OiAoZG9jKSAtPlxuICAgIEB1cHNlcnRzW2RvYy5faWRdID0gZG9jXG4gICAgbG9jYWxTdG9yYWdlW0BuYW1lc3BhY2UrXCJ1cHNlcnRzXCJdID0gSlNPTi5zdHJpbmdpZnkoXy5rZXlzKEB1cHNlcnRzKSlcblxuICBfZGVsZXRlVXBzZXJ0OiAoaWQpIC0+XG4gICAgZGVsZXRlIEB1cHNlcnRzW2lkXVxuICAgIGxvY2FsU3RvcmFnZVtAbmFtZXNwYWNlK1widXBzZXJ0c1wiXSA9IEpTT04uc3RyaW5naWZ5KF8ua2V5cyhAdXBzZXJ0cykpXG5cbiAgX3B1dFJlbW92ZTogKGRvYykgLT5cbiAgICBAcmVtb3Zlc1tkb2MuX2lkXSA9IGRvY1xuICAgIGxvY2FsU3RvcmFnZVtAbmFtZXNwYWNlK1wicmVtb3Zlc1wiXSA9IEpTT04uc3RyaW5naWZ5KF8udmFsdWVzKEByZW1vdmVzKSlcblxuICBfZGVsZXRlUmVtb3ZlOiAoaWQpIC0+XG4gICAgZGVsZXRlIEByZW1vdmVzW2lkXVxuICAgIGxvY2FsU3RvcmFnZVtAbmFtZXNwYWNlK1wicmVtb3Zlc1wiXSA9IEpTT04uc3RyaW5naWZ5KF8udmFsdWVzKEByZW1vdmVzKSlcblxuICBjYWNoZTogKGRvY3MsIHNlbGVjdG9yLCBvcHRpb25zLCBzdWNjZXNzLCBlcnJvcikgLT5cbiAgICAjIEFkZCBhbGwgbm9uLWxvY2FsIHRoYXQgYXJlIG5vdCB1cHNlcnRlZCBvciByZW1vdmVkXG4gICAgZm9yIGRvYyBpbiBkb2NzXG4gICAgICBpZiBub3QgXy5oYXMoQHVwc2VydHMsIGRvYy5faWQpIGFuZCBub3QgXy5oYXMoQHJlbW92ZXMsIGRvYy5faWQpXG4gICAgICAgIEBfcHV0SXRlbShkb2MpXG5cbiAgICBkb2NzTWFwID0gXy5vYmplY3QoXy5wbHVjayhkb2NzLCBcIl9pZFwiKSwgZG9jcylcblxuICAgIGlmIG9wdGlvbnMuc29ydFxuICAgICAgc29ydCA9IGNvbXBpbGVTb3J0KG9wdGlvbnMuc29ydClcblxuICAgICMgUGVyZm9ybSBxdWVyeSwgcmVtb3Zpbmcgcm93cyBtaXNzaW5nIGluIGRvY3MgZnJvbSBsb2NhbCBkYiBcbiAgICBAZmluZChzZWxlY3Rvciwgb3B0aW9ucykuZmV0Y2ggKHJlc3VsdHMpID0+XG4gICAgICBmb3IgcmVzdWx0IGluIHJlc3VsdHNcbiAgICAgICAgaWYgbm90IGRvY3NNYXBbcmVzdWx0Ll9pZF0gYW5kIG5vdCBfLmhhcyhAdXBzZXJ0cywgcmVzdWx0Ll9pZClcbiAgICAgICAgICAjIElmIHBhc3QgZW5kIG9uIHNvcnRlZCBsaW1pdGVkLCBpZ25vcmVcbiAgICAgICAgICBpZiBvcHRpb25zLnNvcnQgYW5kIG9wdGlvbnMubGltaXQgYW5kIGRvY3MubGVuZ3RoID09IG9wdGlvbnMubGltaXRcbiAgICAgICAgICAgIGlmIHNvcnQocmVzdWx0LCBfLmxhc3QoZG9jcykpID49IDBcbiAgICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICBAX2RlbGV0ZUl0ZW0ocmVzdWx0Ll9pZClcblxuICAgICAgaWYgc3VjY2Vzcz8gdGhlbiBzdWNjZXNzKCkgIFxuICAgICwgZXJyb3JcbiAgICBcbiAgcGVuZGluZ1Vwc2VydHM6IChzdWNjZXNzKSAtPlxuICAgIHN1Y2Nlc3MgXy52YWx1ZXMoQHVwc2VydHMpXG5cbiAgcGVuZGluZ1JlbW92ZXM6IChzdWNjZXNzKSAtPlxuICAgIHN1Y2Nlc3MgXy5wbHVjayhAcmVtb3ZlcywgXCJfaWRcIilcblxuICByZXNvbHZlVXBzZXJ0OiAoZG9jLCBzdWNjZXNzKSAtPlxuICAgIGlmIEB1cHNlcnRzW2RvYy5faWRdIGFuZCBfLmlzRXF1YWwoZG9jLCBAdXBzZXJ0c1tkb2MuX2lkXSlcbiAgICAgIEBfZGVsZXRlVXBzZXJ0KGRvYy5faWQpXG4gICAgaWYgc3VjY2Vzcz8gdGhlbiBzdWNjZXNzKClcblxuICByZXNvbHZlUmVtb3ZlOiAoaWQsIHN1Y2Nlc3MpIC0+XG4gICAgQF9kZWxldGVSZW1vdmUoaWQpXG4gICAgaWYgc3VjY2Vzcz8gdGhlbiBzdWNjZXNzKClcblxuICAjIEFkZCBidXQgZG8gbm90IG92ZXJ3cml0ZSBvciByZWNvcmQgYXMgdXBzZXJ0XG4gIHNlZWQ6IChkb2MsIHN1Y2Nlc3MpIC0+XG4gICAgaWYgbm90IF8uaGFzKEBpdGVtcywgZG9jLl9pZCkgYW5kIG5vdCBfLmhhcyhAcmVtb3ZlcywgZG9jLl9pZClcbiAgICAgIEBfcHV0SXRlbShkb2MpXG4gICAgaWYgc3VjY2Vzcz8gdGhlbiBzdWNjZXNzKClcblxuXG5jcmVhdGVVaWQgPSAtPiBcbiAgJ3h4eHh4eHh4eHh4eDR4eHh5eHh4eHh4eHh4eHh4eHh4Jy5yZXBsYWNlKC9beHldL2csIChjKSAtPlxuICAgIHIgPSBNYXRoLnJhbmRvbSgpKjE2fDBcbiAgICB2ID0gaWYgYyA9PSAneCcgdGhlbiByIGVsc2UgKHImMHgzfDB4OClcbiAgICByZXR1cm4gdi50b1N0cmluZygxNilcbiAgIClcblxubW9kdWxlLmV4cG9ydHMgPSBMb2NhbERiXG4iLCIvLyBUT0RPIGFkZCBsaWNlbnNlXG5cbkxvY2FsQ29sbGVjdGlvbiA9IHt9O1xuRUpTT04gPSByZXF1aXJlKFwiLi9FSlNPTlwiKTtcblxuLy8gTGlrZSBfLmlzQXJyYXksIGJ1dCBkb2Vzbid0IHJlZ2FyZCBwb2x5ZmlsbGVkIFVpbnQ4QXJyYXlzIG9uIG9sZCBicm93c2VycyBhc1xuLy8gYXJyYXlzLlxudmFyIGlzQXJyYXkgPSBmdW5jdGlvbiAoeCkge1xuICByZXR1cm4gXy5pc0FycmF5KHgpICYmICFFSlNPTi5pc0JpbmFyeSh4KTtcbn07XG5cbnZhciBfYW55SWZBcnJheSA9IGZ1bmN0aW9uICh4LCBmKSB7XG4gIGlmIChpc0FycmF5KHgpKVxuICAgIHJldHVybiBfLmFueSh4LCBmKTtcbiAgcmV0dXJuIGYoeCk7XG59O1xuXG52YXIgX2FueUlmQXJyYXlQbHVzID0gZnVuY3Rpb24gKHgsIGYpIHtcbiAgaWYgKGYoeCkpXG4gICAgcmV0dXJuIHRydWU7XG4gIHJldHVybiBpc0FycmF5KHgpICYmIF8uYW55KHgsIGYpO1xufTtcblxudmFyIGhhc09wZXJhdG9ycyA9IGZ1bmN0aW9uKHZhbHVlU2VsZWN0b3IpIHtcbiAgdmFyIHRoZXNlQXJlT3BlcmF0b3JzID0gdW5kZWZpbmVkO1xuICBmb3IgKHZhciBzZWxLZXkgaW4gdmFsdWVTZWxlY3Rvcikge1xuICAgIHZhciB0aGlzSXNPcGVyYXRvciA9IHNlbEtleS5zdWJzdHIoMCwgMSkgPT09ICckJztcbiAgICBpZiAodGhlc2VBcmVPcGVyYXRvcnMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhlc2VBcmVPcGVyYXRvcnMgPSB0aGlzSXNPcGVyYXRvcjtcbiAgICB9IGVsc2UgaWYgKHRoZXNlQXJlT3BlcmF0b3JzICE9PSB0aGlzSXNPcGVyYXRvcikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSW5jb25zaXN0ZW50IHNlbGVjdG9yOiBcIiArIHZhbHVlU2VsZWN0b3IpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gISF0aGVzZUFyZU9wZXJhdG9yczsgIC8vIHt9IGhhcyBubyBvcGVyYXRvcnNcbn07XG5cbnZhciBjb21waWxlVmFsdWVTZWxlY3RvciA9IGZ1bmN0aW9uICh2YWx1ZVNlbGVjdG9yKSB7XG4gIGlmICh2YWx1ZVNlbGVjdG9yID09IG51bGwpIHsgIC8vIHVuZGVmaW5lZCBvciBudWxsXG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgcmV0dXJuIF9hbnlJZkFycmF5KHZhbHVlLCBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4geCA9PSBudWxsOyAgLy8gdW5kZWZpbmVkIG9yIG51bGxcbiAgICAgIH0pO1xuICAgIH07XG4gIH1cblxuICAvLyBTZWxlY3RvciBpcyBhIG5vbi1udWxsIHByaW1pdGl2ZSAoYW5kIG5vdCBhbiBhcnJheSBvciBSZWdFeHAgZWl0aGVyKS5cbiAgaWYgKCFfLmlzT2JqZWN0KHZhbHVlU2VsZWN0b3IpKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgcmV0dXJuIF9hbnlJZkFycmF5KHZhbHVlLCBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4geCA9PT0gdmFsdWVTZWxlY3RvcjtcbiAgICAgIH0pO1xuICAgIH07XG4gIH1cblxuICBpZiAodmFsdWVTZWxlY3RvciBpbnN0YW5jZW9mIFJlZ0V4cCkge1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICByZXR1cm4gX2FueUlmQXJyYXkodmFsdWUsIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiB2YWx1ZVNlbGVjdG9yLnRlc3QoeCk7XG4gICAgICB9KTtcbiAgICB9O1xuICB9XG5cbiAgLy8gQXJyYXlzIG1hdGNoIGVpdGhlciBpZGVudGljYWwgYXJyYXlzIG9yIGFycmF5cyB0aGF0IGNvbnRhaW4gaXQgYXMgYSB2YWx1ZS5cbiAgaWYgKGlzQXJyYXkodmFsdWVTZWxlY3RvcikpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICBpZiAoIWlzQXJyYXkodmFsdWUpKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICByZXR1cm4gX2FueUlmQXJyYXlQbHVzKHZhbHVlLCBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4gTG9jYWxDb2xsZWN0aW9uLl9mLl9lcXVhbCh2YWx1ZVNlbGVjdG9yLCB4KTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH1cblxuICAvLyBJdCdzIGFuIG9iamVjdCwgYnV0IG5vdCBhbiBhcnJheSBvciByZWdleHAuXG4gIGlmIChoYXNPcGVyYXRvcnModmFsdWVTZWxlY3RvcikpIHtcbiAgICB2YXIgb3BlcmF0b3JGdW5jdGlvbnMgPSBbXTtcbiAgICBfLmVhY2godmFsdWVTZWxlY3RvciwgZnVuY3Rpb24gKG9wZXJhbmQsIG9wZXJhdG9yKSB7XG4gICAgICBpZiAoIV8uaGFzKFZBTFVFX09QRVJBVE9SUywgb3BlcmF0b3IpKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJVbnJlY29nbml6ZWQgb3BlcmF0b3I6IFwiICsgb3BlcmF0b3IpO1xuICAgICAgb3BlcmF0b3JGdW5jdGlvbnMucHVzaChWQUxVRV9PUEVSQVRPUlNbb3BlcmF0b3JdKFxuICAgICAgICBvcGVyYW5kLCB2YWx1ZVNlbGVjdG9yLiRvcHRpb25zKSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgcmV0dXJuIF8uYWxsKG9wZXJhdG9yRnVuY3Rpb25zLCBmdW5jdGlvbiAoZikge1xuICAgICAgICByZXR1cm4gZih2YWx1ZSk7XG4gICAgICB9KTtcbiAgICB9O1xuICB9XG5cbiAgLy8gSXQncyBhIGxpdGVyYWw7IGNvbXBhcmUgdmFsdWUgKG9yIGVsZW1lbnQgb2YgdmFsdWUgYXJyYXkpIGRpcmVjdGx5IHRvIHRoZVxuICAvLyBzZWxlY3Rvci5cbiAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIHJldHVybiBfYW55SWZBcnJheSh2YWx1ZSwgZnVuY3Rpb24gKHgpIHtcbiAgICAgIHJldHVybiBMb2NhbENvbGxlY3Rpb24uX2YuX2VxdWFsKHZhbHVlU2VsZWN0b3IsIHgpO1xuICAgIH0pO1xuICB9O1xufTtcblxuLy8gWFhYIGNhbiBmYWN0b3Igb3V0IGNvbW1vbiBsb2dpYyBiZWxvd1xudmFyIExPR0lDQUxfT1BFUkFUT1JTID0ge1xuICBcIiRhbmRcIjogZnVuY3Rpb24oc3ViU2VsZWN0b3IpIHtcbiAgICBpZiAoIWlzQXJyYXkoc3ViU2VsZWN0b3IpIHx8IF8uaXNFbXB0eShzdWJTZWxlY3RvcikpXG4gICAgICB0aHJvdyBFcnJvcihcIiRhbmQvJG9yLyRub3IgbXVzdCBiZSBub25lbXB0eSBhcnJheVwiKTtcbiAgICB2YXIgc3ViU2VsZWN0b3JGdW5jdGlvbnMgPSBfLm1hcChcbiAgICAgIHN1YlNlbGVjdG9yLCBjb21waWxlRG9jdW1lbnRTZWxlY3Rvcik7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChkb2MpIHtcbiAgICAgIHJldHVybiBfLmFsbChzdWJTZWxlY3RvckZ1bmN0aW9ucywgZnVuY3Rpb24gKGYpIHtcbiAgICAgICAgcmV0dXJuIGYoZG9jKTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0sXG5cbiAgXCIkb3JcIjogZnVuY3Rpb24oc3ViU2VsZWN0b3IpIHtcbiAgICBpZiAoIWlzQXJyYXkoc3ViU2VsZWN0b3IpIHx8IF8uaXNFbXB0eShzdWJTZWxlY3RvcikpXG4gICAgICB0aHJvdyBFcnJvcihcIiRhbmQvJG9yLyRub3IgbXVzdCBiZSBub25lbXB0eSBhcnJheVwiKTtcbiAgICB2YXIgc3ViU2VsZWN0b3JGdW5jdGlvbnMgPSBfLm1hcChcbiAgICAgIHN1YlNlbGVjdG9yLCBjb21waWxlRG9jdW1lbnRTZWxlY3Rvcik7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChkb2MpIHtcbiAgICAgIHJldHVybiBfLmFueShzdWJTZWxlY3RvckZ1bmN0aW9ucywgZnVuY3Rpb24gKGYpIHtcbiAgICAgICAgcmV0dXJuIGYoZG9jKTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0sXG5cbiAgXCIkbm9yXCI6IGZ1bmN0aW9uKHN1YlNlbGVjdG9yKSB7XG4gICAgaWYgKCFpc0FycmF5KHN1YlNlbGVjdG9yKSB8fCBfLmlzRW1wdHkoc3ViU2VsZWN0b3IpKVxuICAgICAgdGhyb3cgRXJyb3IoXCIkYW5kLyRvci8kbm9yIG11c3QgYmUgbm9uZW1wdHkgYXJyYXlcIik7XG4gICAgdmFyIHN1YlNlbGVjdG9yRnVuY3Rpb25zID0gXy5tYXAoXG4gICAgICBzdWJTZWxlY3RvciwgY29tcGlsZURvY3VtZW50U2VsZWN0b3IpO1xuICAgIHJldHVybiBmdW5jdGlvbiAoZG9jKSB7XG4gICAgICByZXR1cm4gXy5hbGwoc3ViU2VsZWN0b3JGdW5jdGlvbnMsIGZ1bmN0aW9uIChmKSB7XG4gICAgICAgIHJldHVybiAhZihkb2MpO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSxcblxuICBcIiR3aGVyZVwiOiBmdW5jdGlvbihzZWxlY3RvclZhbHVlKSB7XG4gICAgaWYgKCEoc2VsZWN0b3JWYWx1ZSBpbnN0YW5jZW9mIEZ1bmN0aW9uKSkge1xuICAgICAgc2VsZWN0b3JWYWx1ZSA9IEZ1bmN0aW9uKFwicmV0dXJuIFwiICsgc2VsZWN0b3JWYWx1ZSk7XG4gICAgfVxuICAgIHJldHVybiBmdW5jdGlvbiAoZG9jKSB7XG4gICAgICByZXR1cm4gc2VsZWN0b3JWYWx1ZS5jYWxsKGRvYyk7XG4gICAgfTtcbiAgfVxufTtcblxudmFyIFZBTFVFX09QRVJBVE9SUyA9IHtcbiAgXCIkaW5cIjogZnVuY3Rpb24gKG9wZXJhbmQpIHtcbiAgICBpZiAoIWlzQXJyYXkob3BlcmFuZCkpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJBcmd1bWVudCB0byAkaW4gbXVzdCBiZSBhcnJheVwiKTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICByZXR1cm4gX2FueUlmQXJyYXlQbHVzKHZhbHVlLCBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4gXy5hbnkob3BlcmFuZCwgZnVuY3Rpb24gKG9wZXJhbmRFbHQpIHtcbiAgICAgICAgICByZXR1cm4gTG9jYWxDb2xsZWN0aW9uLl9mLl9lcXVhbChvcGVyYW5kRWx0LCB4KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9O1xuICB9LFxuXG4gIFwiJGFsbFwiOiBmdW5jdGlvbiAob3BlcmFuZCkge1xuICAgIGlmICghaXNBcnJheShvcGVyYW5kKSlcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkFyZ3VtZW50IHRvICRhbGwgbXVzdCBiZSBhcnJheVwiKTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICBpZiAoIWlzQXJyYXkodmFsdWUpKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICByZXR1cm4gXy5hbGwob3BlcmFuZCwgZnVuY3Rpb24gKG9wZXJhbmRFbHQpIHtcbiAgICAgICAgcmV0dXJuIF8uYW55KHZhbHVlLCBmdW5jdGlvbiAodmFsdWVFbHQpIHtcbiAgICAgICAgICByZXR1cm4gTG9jYWxDb2xsZWN0aW9uLl9mLl9lcXVhbChvcGVyYW5kRWx0LCB2YWx1ZUVsdCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSxcblxuICBcIiRsdFwiOiBmdW5jdGlvbiAob3BlcmFuZCkge1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJldHVybiBfYW55SWZBcnJheSh2YWx1ZSwgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIExvY2FsQ29sbGVjdGlvbi5fZi5fY21wKHgsIG9wZXJhbmQpIDwgMDtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0sXG5cbiAgXCIkbHRlXCI6IGZ1bmN0aW9uIChvcGVyYW5kKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgcmV0dXJuIF9hbnlJZkFycmF5KHZhbHVlLCBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4gTG9jYWxDb2xsZWN0aW9uLl9mLl9jbXAoeCwgb3BlcmFuZCkgPD0gMDtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0sXG5cbiAgXCIkZ3RcIjogZnVuY3Rpb24gKG9wZXJhbmQpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICByZXR1cm4gX2FueUlmQXJyYXkodmFsdWUsIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiBMb2NhbENvbGxlY3Rpb24uX2YuX2NtcCh4LCBvcGVyYW5kKSA+IDA7XG4gICAgICB9KTtcbiAgICB9O1xuICB9LFxuXG4gIFwiJGd0ZVwiOiBmdW5jdGlvbiAob3BlcmFuZCkge1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJldHVybiBfYW55SWZBcnJheSh2YWx1ZSwgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIExvY2FsQ29sbGVjdGlvbi5fZi5fY21wKHgsIG9wZXJhbmQpID49IDA7XG4gICAgICB9KTtcbiAgICB9O1xuICB9LFxuXG4gIFwiJG5lXCI6IGZ1bmN0aW9uIChvcGVyYW5kKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgcmV0dXJuICEgX2FueUlmQXJyYXlQbHVzKHZhbHVlLCBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4gTG9jYWxDb2xsZWN0aW9uLl9mLl9lcXVhbCh4LCBvcGVyYW5kKTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0sXG5cbiAgXCIkbmluXCI6IGZ1bmN0aW9uIChvcGVyYW5kKSB7XG4gICAgaWYgKCFpc0FycmF5KG9wZXJhbmQpKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQXJndW1lbnQgdG8gJG5pbiBtdXN0IGJlIGFycmF5XCIpO1xuICAgIHZhciBpbkZ1bmN0aW9uID0gVkFMVUVfT1BFUkFUT1JTLiRpbihvcGVyYW5kKTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAvLyBGaWVsZCBkb2Vzbid0IGV4aXN0LCBzbyBpdCdzIG5vdC1pbiBvcGVyYW5kXG4gICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZClcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICByZXR1cm4gIWluRnVuY3Rpb24odmFsdWUpO1xuICAgIH07XG4gIH0sXG5cbiAgXCIkZXhpc3RzXCI6IGZ1bmN0aW9uIChvcGVyYW5kKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgcmV0dXJuIG9wZXJhbmQgPT09ICh2YWx1ZSAhPT0gdW5kZWZpbmVkKTtcbiAgICB9O1xuICB9LFxuXG4gIFwiJG1vZFwiOiBmdW5jdGlvbiAob3BlcmFuZCkge1xuICAgIHZhciBkaXZpc29yID0gb3BlcmFuZFswXSxcbiAgICAgICAgcmVtYWluZGVyID0gb3BlcmFuZFsxXTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICByZXR1cm4gX2FueUlmQXJyYXkodmFsdWUsIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiB4ICUgZGl2aXNvciA9PT0gcmVtYWluZGVyO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSxcblxuICBcIiRzaXplXCI6IGZ1bmN0aW9uIChvcGVyYW5kKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgcmV0dXJuIGlzQXJyYXkodmFsdWUpICYmIG9wZXJhbmQgPT09IHZhbHVlLmxlbmd0aDtcbiAgICB9O1xuICB9LFxuXG4gIFwiJHR5cGVcIjogZnVuY3Rpb24gKG9wZXJhbmQpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAvLyBBIG5vbmV4aXN0ZW50IGZpZWxkIGlzIG9mIG5vIHR5cGUuXG4gICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZClcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgLy8gRGVmaW5pdGVseSBub3QgX2FueUlmQXJyYXlQbHVzOiAkdHlwZTogNCBvbmx5IG1hdGNoZXMgYXJyYXlzIHRoYXQgaGF2ZVxuICAgICAgLy8gYXJyYXlzIGFzIGVsZW1lbnRzIGFjY29yZGluZyB0byB0aGUgTW9uZ28gZG9jcy5cbiAgICAgIHJldHVybiBfYW55SWZBcnJheSh2YWx1ZSwgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIExvY2FsQ29sbGVjdGlvbi5fZi5fdHlwZSh4KSA9PT0gb3BlcmFuZDtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0sXG5cbiAgXCIkcmVnZXhcIjogZnVuY3Rpb24gKG9wZXJhbmQsIG9wdGlvbnMpIHtcbiAgICBpZiAob3B0aW9ucyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAvLyBPcHRpb25zIHBhc3NlZCBpbiAkb3B0aW9ucyAoZXZlbiB0aGUgZW1wdHkgc3RyaW5nKSBhbHdheXMgb3ZlcnJpZGVzXG4gICAgICAvLyBvcHRpb25zIGluIHRoZSBSZWdFeHAgb2JqZWN0IGl0c2VsZi5cblxuICAgICAgLy8gQmUgY2xlYXIgdGhhdCB3ZSBvbmx5IHN1cHBvcnQgdGhlIEpTLXN1cHBvcnRlZCBvcHRpb25zLCBub3QgZXh0ZW5kZWRcbiAgICAgIC8vIG9uZXMgKGVnLCBNb25nbyBzdXBwb3J0cyB4IGFuZCBzKS4gSWRlYWxseSB3ZSB3b3VsZCBpbXBsZW1lbnQgeCBhbmQgc1xuICAgICAgLy8gYnkgdHJhbnNmb3JtaW5nIHRoZSByZWdleHAsIGJ1dCBub3QgdG9kYXkuLi5cbiAgICAgIGlmICgvW15naW1dLy50ZXN0KG9wdGlvbnMpKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJPbmx5IHRoZSBpLCBtLCBhbmQgZyByZWdleHAgb3B0aW9ucyBhcmUgc3VwcG9ydGVkXCIpO1xuXG4gICAgICB2YXIgcmVnZXhTb3VyY2UgPSBvcGVyYW5kIGluc3RhbmNlb2YgUmVnRXhwID8gb3BlcmFuZC5zb3VyY2UgOiBvcGVyYW5kO1xuICAgICAgb3BlcmFuZCA9IG5ldyBSZWdFeHAocmVnZXhTb3VyY2UsIG9wdGlvbnMpO1xuICAgIH0gZWxzZSBpZiAoIShvcGVyYW5kIGluc3RhbmNlb2YgUmVnRXhwKSkge1xuICAgICAgb3BlcmFuZCA9IG5ldyBSZWdFeHAob3BlcmFuZCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIHJldHVybiBfYW55SWZBcnJheSh2YWx1ZSwgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIG9wZXJhbmQudGVzdCh4KTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0sXG5cbiAgXCIkb3B0aW9uc1wiOiBmdW5jdGlvbiAob3BlcmFuZCkge1xuICAgIC8vIGV2YWx1YXRpb24gaGFwcGVucyBhdCB0aGUgJHJlZ2V4IGZ1bmN0aW9uIGFib3ZlXG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkgeyByZXR1cm4gdHJ1ZTsgfTtcbiAgfSxcblxuICBcIiRlbGVtTWF0Y2hcIjogZnVuY3Rpb24gKG9wZXJhbmQpIHtcbiAgICB2YXIgbWF0Y2hlciA9IGNvbXBpbGVEb2N1bWVudFNlbGVjdG9yKG9wZXJhbmQpO1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIGlmICghaXNBcnJheSh2YWx1ZSkpXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIHJldHVybiBfLmFueSh2YWx1ZSwgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIG1hdGNoZXIoeCk7XG4gICAgICB9KTtcbiAgICB9O1xuICB9LFxuXG4gIFwiJG5vdFwiOiBmdW5jdGlvbiAob3BlcmFuZCkge1xuICAgIHZhciBtYXRjaGVyID0gY29tcGlsZVZhbHVlU2VsZWN0b3Iob3BlcmFuZCk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgcmV0dXJuICFtYXRjaGVyKHZhbHVlKTtcbiAgICB9O1xuICB9LFxuICBcbiAgXCIkbmVhclwiOiBmdW5jdGlvbiAob3BlcmFuZCkge1xuICAgIC8vIEFsd2F5cyByZXR1cm5zIHRydWUuIE5lYXIgbXVzdCBiZSBoYW5kbGVkIGluIHBvc3QtZmlsdGVyL3NvcnQvbGltaXRcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cblxuXG59O1xuXG4vLyBoZWxwZXJzIHVzZWQgYnkgY29tcGlsZWQgc2VsZWN0b3IgY29kZVxuTG9jYWxDb2xsZWN0aW9uLl9mID0ge1xuICAvLyBYWFggZm9yIF9hbGwgYW5kIF9pbiwgY29uc2lkZXIgYnVpbGRpbmcgJ2lucXVlcnknIGF0IGNvbXBpbGUgdGltZS4uXG5cbiAgX3R5cGU6IGZ1bmN0aW9uICh2KSB7XG4gICAgaWYgKHR5cGVvZiB2ID09PSBcIm51bWJlclwiKVxuICAgICAgcmV0dXJuIDE7XG4gICAgaWYgKHR5cGVvZiB2ID09PSBcInN0cmluZ1wiKVxuICAgICAgcmV0dXJuIDI7XG4gICAgaWYgKHR5cGVvZiB2ID09PSBcImJvb2xlYW5cIilcbiAgICAgIHJldHVybiA4O1xuICAgIGlmIChpc0FycmF5KHYpKVxuICAgICAgcmV0dXJuIDQ7XG4gICAgaWYgKHYgPT09IG51bGwpXG4gICAgICByZXR1cm4gMTA7XG4gICAgaWYgKHYgaW5zdGFuY2VvZiBSZWdFeHApXG4gICAgICByZXR1cm4gMTE7XG4gICAgaWYgKHR5cGVvZiB2ID09PSBcImZ1bmN0aW9uXCIpXG4gICAgICAvLyBub3RlIHRoYXQgdHlwZW9mKC94LykgPT09IFwiZnVuY3Rpb25cIlxuICAgICAgcmV0dXJuIDEzO1xuICAgIGlmICh2IGluc3RhbmNlb2YgRGF0ZSlcbiAgICAgIHJldHVybiA5O1xuICAgIGlmIChFSlNPTi5pc0JpbmFyeSh2KSlcbiAgICAgIHJldHVybiA1O1xuICAgIGlmICh2IGluc3RhbmNlb2YgTWV0ZW9yLkNvbGxlY3Rpb24uT2JqZWN0SUQpXG4gICAgICByZXR1cm4gNztcbiAgICByZXR1cm4gMzsgLy8gb2JqZWN0XG5cbiAgICAvLyBYWFggc3VwcG9ydCBzb21lL2FsbCBvZiB0aGVzZTpcbiAgICAvLyAxNCwgc3ltYm9sXG4gICAgLy8gMTUsIGphdmFzY3JpcHQgY29kZSB3aXRoIHNjb3BlXG4gICAgLy8gMTYsIDE4OiAzMi1iaXQvNjQtYml0IGludGVnZXJcbiAgICAvLyAxNywgdGltZXN0YW1wXG4gICAgLy8gMjU1LCBtaW5rZXlcbiAgICAvLyAxMjcsIG1heGtleVxuICB9LFxuXG4gIC8vIGRlZXAgZXF1YWxpdHkgdGVzdDogdXNlIGZvciBsaXRlcmFsIGRvY3VtZW50IGFuZCBhcnJheSBtYXRjaGVzXG4gIF9lcXVhbDogZnVuY3Rpb24gKGEsIGIpIHtcbiAgICByZXR1cm4gRUpTT04uZXF1YWxzKGEsIGIsIHtrZXlPcmRlclNlbnNpdGl2ZTogdHJ1ZX0pO1xuICB9LFxuXG4gIC8vIG1hcHMgYSB0eXBlIGNvZGUgdG8gYSB2YWx1ZSB0aGF0IGNhbiBiZSB1c2VkIHRvIHNvcnQgdmFsdWVzIG9mXG4gIC8vIGRpZmZlcmVudCB0eXBlc1xuICBfdHlwZW9yZGVyOiBmdW5jdGlvbiAodCkge1xuICAgIC8vIGh0dHA6Ly93d3cubW9uZ29kYi5vcmcvZGlzcGxheS9ET0NTL1doYXQraXMrdGhlK0NvbXBhcmUrT3JkZXIrZm9yK0JTT04rVHlwZXNcbiAgICAvLyBYWFggd2hhdCBpcyB0aGUgY29ycmVjdCBzb3J0IHBvc2l0aW9uIGZvciBKYXZhc2NyaXB0IGNvZGU/XG4gICAgLy8gKCcxMDAnIGluIHRoZSBtYXRyaXggYmVsb3cpXG4gICAgLy8gWFhYIG1pbmtleS9tYXhrZXlcbiAgICByZXR1cm4gWy0xLCAgLy8gKG5vdCBhIHR5cGUpXG4gICAgICAgICAgICAxLCAgIC8vIG51bWJlclxuICAgICAgICAgICAgMiwgICAvLyBzdHJpbmdcbiAgICAgICAgICAgIDMsICAgLy8gb2JqZWN0XG4gICAgICAgICAgICA0LCAgIC8vIGFycmF5XG4gICAgICAgICAgICA1LCAgIC8vIGJpbmFyeVxuICAgICAgICAgICAgLTEsICAvLyBkZXByZWNhdGVkXG4gICAgICAgICAgICA2LCAgIC8vIE9iamVjdElEXG4gICAgICAgICAgICA3LCAgIC8vIGJvb2xcbiAgICAgICAgICAgIDgsICAgLy8gRGF0ZVxuICAgICAgICAgICAgMCwgICAvLyBudWxsXG4gICAgICAgICAgICA5LCAgIC8vIFJlZ0V4cFxuICAgICAgICAgICAgLTEsICAvLyBkZXByZWNhdGVkXG4gICAgICAgICAgICAxMDAsIC8vIEpTIGNvZGVcbiAgICAgICAgICAgIDIsICAgLy8gZGVwcmVjYXRlZCAoc3ltYm9sKVxuICAgICAgICAgICAgMTAwLCAvLyBKUyBjb2RlXG4gICAgICAgICAgICAxLCAgIC8vIDMyLWJpdCBpbnRcbiAgICAgICAgICAgIDgsICAgLy8gTW9uZ28gdGltZXN0YW1wXG4gICAgICAgICAgICAxICAgIC8vIDY0LWJpdCBpbnRcbiAgICAgICAgICAgXVt0XTtcbiAgfSxcblxuICAvLyBjb21wYXJlIHR3byB2YWx1ZXMgb2YgdW5rbm93biB0eXBlIGFjY29yZGluZyB0byBCU09OIG9yZGVyaW5nXG4gIC8vIHNlbWFudGljcy4gKGFzIGFuIGV4dGVuc2lvbiwgY29uc2lkZXIgJ3VuZGVmaW5lZCcgdG8gYmUgbGVzcyB0aGFuXG4gIC8vIGFueSBvdGhlciB2YWx1ZS4pIHJldHVybiBuZWdhdGl2ZSBpZiBhIGlzIGxlc3MsIHBvc2l0aXZlIGlmIGIgaXNcbiAgLy8gbGVzcywgb3IgMCBpZiBlcXVhbFxuICBfY21wOiBmdW5jdGlvbiAoYSwgYikge1xuICAgIGlmIChhID09PSB1bmRlZmluZWQpXG4gICAgICByZXR1cm4gYiA9PT0gdW5kZWZpbmVkID8gMCA6IC0xO1xuICAgIGlmIChiID09PSB1bmRlZmluZWQpXG4gICAgICByZXR1cm4gMTtcbiAgICB2YXIgdGEgPSBMb2NhbENvbGxlY3Rpb24uX2YuX3R5cGUoYSk7XG4gICAgdmFyIHRiID0gTG9jYWxDb2xsZWN0aW9uLl9mLl90eXBlKGIpO1xuICAgIHZhciBvYSA9IExvY2FsQ29sbGVjdGlvbi5fZi5fdHlwZW9yZGVyKHRhKTtcbiAgICB2YXIgb2IgPSBMb2NhbENvbGxlY3Rpb24uX2YuX3R5cGVvcmRlcih0Yik7XG4gICAgaWYgKG9hICE9PSBvYilcbiAgICAgIHJldHVybiBvYSA8IG9iID8gLTEgOiAxO1xuICAgIGlmICh0YSAhPT0gdGIpXG4gICAgICAvLyBYWFggbmVlZCB0byBpbXBsZW1lbnQgdGhpcyBpZiB3ZSBpbXBsZW1lbnQgU3ltYm9sIG9yIGludGVnZXJzLCBvclxuICAgICAgLy8gVGltZXN0YW1wXG4gICAgICB0aHJvdyBFcnJvcihcIk1pc3NpbmcgdHlwZSBjb2VyY2lvbiBsb2dpYyBpbiBfY21wXCIpO1xuICAgIGlmICh0YSA9PT0gNykgeyAvLyBPYmplY3RJRFxuICAgICAgLy8gQ29udmVydCB0byBzdHJpbmcuXG4gICAgICB0YSA9IHRiID0gMjtcbiAgICAgIGEgPSBhLnRvSGV4U3RyaW5nKCk7XG4gICAgICBiID0gYi50b0hleFN0cmluZygpO1xuICAgIH1cbiAgICBpZiAodGEgPT09IDkpIHsgLy8gRGF0ZVxuICAgICAgLy8gQ29udmVydCB0byBtaWxsaXMuXG4gICAgICB0YSA9IHRiID0gMTtcbiAgICAgIGEgPSBhLmdldFRpbWUoKTtcbiAgICAgIGIgPSBiLmdldFRpbWUoKTtcbiAgICB9XG5cbiAgICBpZiAodGEgPT09IDEpIC8vIGRvdWJsZVxuICAgICAgcmV0dXJuIGEgLSBiO1xuICAgIGlmICh0YiA9PT0gMikgLy8gc3RyaW5nXG4gICAgICByZXR1cm4gYSA8IGIgPyAtMSA6IChhID09PSBiID8gMCA6IDEpO1xuICAgIGlmICh0YSA9PT0gMykgeyAvLyBPYmplY3RcbiAgICAgIC8vIHRoaXMgY291bGQgYmUgbXVjaCBtb3JlIGVmZmljaWVudCBpbiB0aGUgZXhwZWN0ZWQgY2FzZSAuLi5cbiAgICAgIHZhciB0b19hcnJheSA9IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgICAgdmFyIHJldCA9IFtdO1xuICAgICAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgICAgICAgcmV0LnB1c2goa2V5KTtcbiAgICAgICAgICByZXQucHVzaChvYmpba2V5XSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgIH07XG4gICAgICByZXR1cm4gTG9jYWxDb2xsZWN0aW9uLl9mLl9jbXAodG9fYXJyYXkoYSksIHRvX2FycmF5KGIpKTtcbiAgICB9XG4gICAgaWYgKHRhID09PSA0KSB7IC8vIEFycmF5XG4gICAgICBmb3IgKHZhciBpID0gMDsgOyBpKyspIHtcbiAgICAgICAgaWYgKGkgPT09IGEubGVuZ3RoKVxuICAgICAgICAgIHJldHVybiAoaSA9PT0gYi5sZW5ndGgpID8gMCA6IC0xO1xuICAgICAgICBpZiAoaSA9PT0gYi5sZW5ndGgpXG4gICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgIHZhciBzID0gTG9jYWxDb2xsZWN0aW9uLl9mLl9jbXAoYVtpXSwgYltpXSk7XG4gICAgICAgIGlmIChzICE9PSAwKVxuICAgICAgICAgIHJldHVybiBzO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAodGEgPT09IDUpIHsgLy8gYmluYXJ5XG4gICAgICAvLyBTdXJwcmlzaW5nbHksIGEgc21hbGwgYmluYXJ5IGJsb2IgaXMgYWx3YXlzIGxlc3MgdGhhbiBhIGxhcmdlIG9uZSBpblxuICAgICAgLy8gTW9uZ28uXG4gICAgICBpZiAoYS5sZW5ndGggIT09IGIubGVuZ3RoKVxuICAgICAgICByZXR1cm4gYS5sZW5ndGggLSBiLmxlbmd0aDtcbiAgICAgIGZvciAoaSA9IDA7IGkgPCBhLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChhW2ldIDwgYltpXSlcbiAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgIGlmIChhW2ldID4gYltpXSlcbiAgICAgICAgICByZXR1cm4gMTtcbiAgICAgIH1cbiAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICBpZiAodGEgPT09IDgpIHsgLy8gYm9vbGVhblxuICAgICAgaWYgKGEpIHJldHVybiBiID8gMCA6IDE7XG4gICAgICByZXR1cm4gYiA/IC0xIDogMDtcbiAgICB9XG4gICAgaWYgKHRhID09PSAxMCkgLy8gbnVsbFxuICAgICAgcmV0dXJuIDA7XG4gICAgaWYgKHRhID09PSAxMSkgLy8gcmVnZXhwXG4gICAgICB0aHJvdyBFcnJvcihcIlNvcnRpbmcgbm90IHN1cHBvcnRlZCBvbiByZWd1bGFyIGV4cHJlc3Npb25cIik7IC8vIFhYWFxuICAgIC8vIDEzOiBqYXZhc2NyaXB0IGNvZGVcbiAgICAvLyAxNDogc3ltYm9sXG4gICAgLy8gMTU6IGphdmFzY3JpcHQgY29kZSB3aXRoIHNjb3BlXG4gICAgLy8gMTY6IDMyLWJpdCBpbnRlZ2VyXG4gICAgLy8gMTc6IHRpbWVzdGFtcFxuICAgIC8vIDE4OiA2NC1iaXQgaW50ZWdlclxuICAgIC8vIDI1NTogbWlua2V5XG4gICAgLy8gMTI3OiBtYXhrZXlcbiAgICBpZiAodGEgPT09IDEzKSAvLyBqYXZhc2NyaXB0IGNvZGVcbiAgICAgIHRocm93IEVycm9yKFwiU29ydGluZyBub3Qgc3VwcG9ydGVkIG9uIEphdmFzY3JpcHQgY29kZVwiKTsgLy8gWFhYXG4gICAgdGhyb3cgRXJyb3IoXCJVbmtub3duIHR5cGUgdG8gc29ydFwiKTtcbiAgfVxufTtcblxuLy8gRm9yIHVuaXQgdGVzdHMuIFRydWUgaWYgdGhlIGdpdmVuIGRvY3VtZW50IG1hdGNoZXMgdGhlIGdpdmVuXG4vLyBzZWxlY3Rvci5cbkxvY2FsQ29sbGVjdGlvbi5fbWF0Y2hlcyA9IGZ1bmN0aW9uIChzZWxlY3RvciwgZG9jKSB7XG4gIHJldHVybiAoTG9jYWxDb2xsZWN0aW9uLl9jb21waWxlU2VsZWN0b3Ioc2VsZWN0b3IpKShkb2MpO1xufTtcblxuLy8gX21ha2VMb29rdXBGdW5jdGlvbihrZXkpIHJldHVybnMgYSBsb29rdXAgZnVuY3Rpb24uXG4vL1xuLy8gQSBsb29rdXAgZnVuY3Rpb24gdGFrZXMgaW4gYSBkb2N1bWVudCBhbmQgcmV0dXJucyBhbiBhcnJheSBvZiBtYXRjaGluZ1xuLy8gdmFsdWVzLiAgVGhpcyBhcnJheSBoYXMgbW9yZSB0aGFuIG9uZSBlbGVtZW50IGlmIGFueSBzZWdtZW50IG9mIHRoZSBrZXkgb3RoZXJcbi8vIHRoYW4gdGhlIGxhc3Qgb25lIGlzIGFuIGFycmF5LiAgaWUsIGFueSBhcnJheXMgZm91bmQgd2hlbiBkb2luZyBub24tZmluYWxcbi8vIGxvb2t1cHMgcmVzdWx0IGluIHRoaXMgZnVuY3Rpb24gXCJicmFuY2hpbmdcIjsgZWFjaCBlbGVtZW50IGluIHRoZSByZXR1cm5lZFxuLy8gYXJyYXkgcmVwcmVzZW50cyB0aGUgdmFsdWUgZm91bmQgYXQgdGhpcyBicmFuY2guIElmIGFueSBicmFuY2ggZG9lc24ndCBoYXZlIGFcbi8vIGZpbmFsIHZhbHVlIGZvciB0aGUgZnVsbCBrZXksIGl0cyBlbGVtZW50IGluIHRoZSByZXR1cm5lZCBsaXN0IHdpbGwgYmVcbi8vIHVuZGVmaW5lZC4gSXQgYWx3YXlzIHJldHVybnMgYSBub24tZW1wdHkgYXJyYXkuXG4vL1xuLy8gX21ha2VMb29rdXBGdW5jdGlvbignYS54Jykoe2E6IHt4OiAxfX0pIHJldHVybnMgWzFdXG4vLyBfbWFrZUxvb2t1cEZ1bmN0aW9uKCdhLngnKSh7YToge3g6IFsxXX19KSByZXR1cm5zIFtbMV1dXG4vLyBfbWFrZUxvb2t1cEZ1bmN0aW9uKCdhLngnKSh7YTogNX0pICByZXR1cm5zIFt1bmRlZmluZWRdXG4vLyBfbWFrZUxvb2t1cEZ1bmN0aW9uKCdhLngnKSh7YTogW3t4OiAxfSxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3g6IFsyXX0sXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHt5OiAzfV19KVxuLy8gICByZXR1cm5zIFsxLCBbMl0sIHVuZGVmaW5lZF1cbkxvY2FsQ29sbGVjdGlvbi5fbWFrZUxvb2t1cEZ1bmN0aW9uID0gZnVuY3Rpb24gKGtleSkge1xuICB2YXIgZG90TG9jYXRpb24gPSBrZXkuaW5kZXhPZignLicpO1xuICB2YXIgZmlyc3QsIGxvb2t1cFJlc3QsIG5leHRJc051bWVyaWM7XG4gIGlmIChkb3RMb2NhdGlvbiA9PT0gLTEpIHtcbiAgICBmaXJzdCA9IGtleTtcbiAgfSBlbHNlIHtcbiAgICBmaXJzdCA9IGtleS5zdWJzdHIoMCwgZG90TG9jYXRpb24pO1xuICAgIHZhciByZXN0ID0ga2V5LnN1YnN0cihkb3RMb2NhdGlvbiArIDEpO1xuICAgIGxvb2t1cFJlc3QgPSBMb2NhbENvbGxlY3Rpb24uX21ha2VMb29rdXBGdW5jdGlvbihyZXN0KTtcbiAgICAvLyBJcyB0aGUgbmV4dCAocGVyaGFwcyBmaW5hbCkgcGllY2UgbnVtZXJpYyAoaWUsIGFuIGFycmF5IGxvb2t1cD8pXG4gICAgbmV4dElzTnVtZXJpYyA9IC9eXFxkKyhcXC58JCkvLnRlc3QocmVzdCk7XG4gIH1cblxuICByZXR1cm4gZnVuY3Rpb24gKGRvYykge1xuICAgIGlmIChkb2MgPT0gbnVsbCkgIC8vIG51bGwgb3IgdW5kZWZpbmVkXG4gICAgICByZXR1cm4gW3VuZGVmaW5lZF07XG4gICAgdmFyIGZpcnN0TGV2ZWwgPSBkb2NbZmlyc3RdO1xuXG4gICAgLy8gV2UgZG9uJ3QgXCJicmFuY2hcIiBhdCB0aGUgZmluYWwgbGV2ZWwuXG4gICAgaWYgKCFsb29rdXBSZXN0KVxuICAgICAgcmV0dXJuIFtmaXJzdExldmVsXTtcblxuICAgIC8vIEl0J3MgYW4gZW1wdHkgYXJyYXksIGFuZCB3ZSdyZSBub3QgZG9uZTogd2Ugd29uJ3QgZmluZCBhbnl0aGluZy5cbiAgICBpZiAoaXNBcnJheShmaXJzdExldmVsKSAmJiBmaXJzdExldmVsLmxlbmd0aCA9PT0gMClcbiAgICAgIHJldHVybiBbdW5kZWZpbmVkXTtcblxuICAgIC8vIEZvciBlYWNoIHJlc3VsdCBhdCB0aGlzIGxldmVsLCBmaW5pc2ggdGhlIGxvb2t1cCBvbiB0aGUgcmVzdCBvZiB0aGUga2V5LFxuICAgIC8vIGFuZCByZXR1cm4gZXZlcnl0aGluZyB3ZSBmaW5kLiBBbHNvLCBpZiB0aGUgbmV4dCByZXN1bHQgaXMgYSBudW1iZXIsXG4gICAgLy8gZG9uJ3QgYnJhbmNoIGhlcmUuXG4gICAgLy9cbiAgICAvLyBUZWNobmljYWxseSwgaW4gTW9uZ29EQiwgd2Ugc2hvdWxkIGJlIGFibGUgdG8gaGFuZGxlIHRoZSBjYXNlIHdoZXJlXG4gICAgLy8gb2JqZWN0cyBoYXZlIG51bWVyaWMga2V5cywgYnV0IE1vbmdvIGRvZXNuJ3QgYWN0dWFsbHkgaGFuZGxlIHRoaXNcbiAgICAvLyBjb25zaXN0ZW50bHkgeWV0IGl0c2VsZiwgc2VlIGVnXG4gICAgLy8gaHR0cHM6Ly9qaXJhLm1vbmdvZGIub3JnL2Jyb3dzZS9TRVJWRVItMjg5OFxuICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9tb25nb2RiL21vbmdvL2Jsb2IvbWFzdGVyL2pzdGVzdHMvYXJyYXlfbWF0Y2gyLmpzXG4gICAgaWYgKCFpc0FycmF5KGZpcnN0TGV2ZWwpIHx8IG5leHRJc051bWVyaWMpXG4gICAgICBmaXJzdExldmVsID0gW2ZpcnN0TGV2ZWxdO1xuICAgIHJldHVybiBBcnJheS5wcm90b3R5cGUuY29uY2F0LmFwcGx5KFtdLCBfLm1hcChmaXJzdExldmVsLCBsb29rdXBSZXN0KSk7XG4gIH07XG59O1xuXG4vLyBUaGUgbWFpbiBjb21waWxhdGlvbiBmdW5jdGlvbiBmb3IgYSBnaXZlbiBzZWxlY3Rvci5cbnZhciBjb21waWxlRG9jdW1lbnRTZWxlY3RvciA9IGZ1bmN0aW9uIChkb2NTZWxlY3Rvcikge1xuICB2YXIgcGVyS2V5U2VsZWN0b3JzID0gW107XG4gIF8uZWFjaChkb2NTZWxlY3RvciwgZnVuY3Rpb24gKHN1YlNlbGVjdG9yLCBrZXkpIHtcbiAgICBpZiAoa2V5LnN1YnN0cigwLCAxKSA9PT0gJyQnKSB7XG4gICAgICAvLyBPdXRlciBvcGVyYXRvcnMgYXJlIGVpdGhlciBsb2dpY2FsIG9wZXJhdG9ycyAodGhleSByZWN1cnNlIGJhY2sgaW50b1xuICAgICAgLy8gdGhpcyBmdW5jdGlvbiksIG9yICR3aGVyZS5cbiAgICAgIGlmICghXy5oYXMoTE9HSUNBTF9PUEVSQVRPUlMsIGtleSkpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlVucmVjb2duaXplZCBsb2dpY2FsIG9wZXJhdG9yOiBcIiArIGtleSk7XG4gICAgICBwZXJLZXlTZWxlY3RvcnMucHVzaChMT0dJQ0FMX09QRVJBVE9SU1trZXldKHN1YlNlbGVjdG9yKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBsb29rVXBCeUluZGV4ID0gTG9jYWxDb2xsZWN0aW9uLl9tYWtlTG9va3VwRnVuY3Rpb24oa2V5KTtcbiAgICAgIHZhciB2YWx1ZVNlbGVjdG9yRnVuYyA9IGNvbXBpbGVWYWx1ZVNlbGVjdG9yKHN1YlNlbGVjdG9yKTtcbiAgICAgIHBlcktleVNlbGVjdG9ycy5wdXNoKGZ1bmN0aW9uIChkb2MpIHtcbiAgICAgICAgdmFyIGJyYW5jaFZhbHVlcyA9IGxvb2tVcEJ5SW5kZXgoZG9jKTtcbiAgICAgICAgLy8gV2UgYXBwbHkgdGhlIHNlbGVjdG9yIHRvIGVhY2ggXCJicmFuY2hlZFwiIHZhbHVlIGFuZCByZXR1cm4gdHJ1ZSBpZiBhbnlcbiAgICAgICAgLy8gbWF0Y2guIFRoaXMgaXNuJ3QgMTAwJSBjb25zaXN0ZW50IHdpdGggTW9uZ29EQjsgZWcsIHNlZTpcbiAgICAgICAgLy8gaHR0cHM6Ly9qaXJhLm1vbmdvZGIub3JnL2Jyb3dzZS9TRVJWRVItODU4NVxuICAgICAgICByZXR1cm4gXy5hbnkoYnJhbmNoVmFsdWVzLCB2YWx1ZVNlbGVjdG9yRnVuYyk7XG4gICAgICB9KTtcbiAgICB9XG4gIH0pO1xuXG5cbiAgcmV0dXJuIGZ1bmN0aW9uIChkb2MpIHtcbiAgICByZXR1cm4gXy5hbGwocGVyS2V5U2VsZWN0b3JzLCBmdW5jdGlvbiAoZikge1xuICAgICAgcmV0dXJuIGYoZG9jKTtcbiAgICB9KTtcbiAgfTtcbn07XG5cbi8vIEdpdmVuIGEgc2VsZWN0b3IsIHJldHVybiBhIGZ1bmN0aW9uIHRoYXQgdGFrZXMgb25lIGFyZ3VtZW50LCBhXG4vLyBkb2N1bWVudCwgYW5kIHJldHVybnMgdHJ1ZSBpZiB0aGUgZG9jdW1lbnQgbWF0Y2hlcyB0aGUgc2VsZWN0b3IsXG4vLyBlbHNlIGZhbHNlLlxuTG9jYWxDb2xsZWN0aW9uLl9jb21waWxlU2VsZWN0b3IgPSBmdW5jdGlvbiAoc2VsZWN0b3IpIHtcbiAgLy8geW91IGNhbiBwYXNzIGEgbGl0ZXJhbCBmdW5jdGlvbiBpbnN0ZWFkIG9mIGEgc2VsZWN0b3JcbiAgaWYgKHNlbGVjdG9yIGluc3RhbmNlb2YgRnVuY3Rpb24pXG4gICAgcmV0dXJuIGZ1bmN0aW9uIChkb2MpIHtyZXR1cm4gc2VsZWN0b3IuY2FsbChkb2MpO307XG5cbiAgLy8gc2hvcnRoYW5kIC0tIHNjYWxhcnMgbWF0Y2ggX2lkXG4gIGlmIChMb2NhbENvbGxlY3Rpb24uX3NlbGVjdG9ySXNJZChzZWxlY3RvcikpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGRvYykge1xuICAgICAgcmV0dXJuIEVKU09OLmVxdWFscyhkb2MuX2lkLCBzZWxlY3Rvcik7XG4gICAgfTtcbiAgfVxuXG4gIC8vIHByb3RlY3QgYWdhaW5zdCBkYW5nZXJvdXMgc2VsZWN0b3JzLiAgZmFsc2V5IGFuZCB7X2lkOiBmYWxzZXl9IGFyZSBib3RoXG4gIC8vIGxpa2VseSBwcm9ncmFtbWVyIGVycm9yLCBhbmQgbm90IHdoYXQgeW91IHdhbnQsIHBhcnRpY3VsYXJseSBmb3JcbiAgLy8gZGVzdHJ1Y3RpdmUgb3BlcmF0aW9ucy5cbiAgaWYgKCFzZWxlY3RvciB8fCAoKCdfaWQnIGluIHNlbGVjdG9yKSAmJiAhc2VsZWN0b3IuX2lkKSlcbiAgICByZXR1cm4gZnVuY3Rpb24gKGRvYykge3JldHVybiBmYWxzZTt9O1xuXG4gIC8vIFRvcCBsZXZlbCBjYW4ndCBiZSBhbiBhcnJheSBvciB0cnVlIG9yIGJpbmFyeS5cbiAgaWYgKHR5cGVvZihzZWxlY3RvcikgPT09ICdib29sZWFuJyB8fCBpc0FycmF5KHNlbGVjdG9yKSB8fFxuICAgICAgRUpTT04uaXNCaW5hcnkoc2VsZWN0b3IpKVxuICAgIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgc2VsZWN0b3I6IFwiICsgc2VsZWN0b3IpO1xuXG4gIHJldHVybiBjb21waWxlRG9jdW1lbnRTZWxlY3RvcihzZWxlY3Rvcik7XG59O1xuXG4vLyBHaXZlIGEgc29ydCBzcGVjLCB3aGljaCBjYW4gYmUgaW4gYW55IG9mIHRoZXNlIGZvcm1zOlxuLy8gICB7XCJrZXkxXCI6IDEsIFwia2V5MlwiOiAtMX1cbi8vICAgW1tcImtleTFcIiwgXCJhc2NcIl0sIFtcImtleTJcIiwgXCJkZXNjXCJdXVxuLy8gICBbXCJrZXkxXCIsIFtcImtleTJcIiwgXCJkZXNjXCJdXVxuLy9cbi8vICguLiB3aXRoIHRoZSBmaXJzdCBmb3JtIGJlaW5nIGRlcGVuZGVudCBvbiB0aGUga2V5IGVudW1lcmF0aW9uXG4vLyBiZWhhdmlvciBvZiB5b3VyIGphdmFzY3JpcHQgVk0sIHdoaWNoIHVzdWFsbHkgZG9lcyB3aGF0IHlvdSBtZWFuIGluXG4vLyB0aGlzIGNhc2UgaWYgdGhlIGtleSBuYW1lcyBkb24ndCBsb29rIGxpa2UgaW50ZWdlcnMgLi4pXG4vL1xuLy8gcmV0dXJuIGEgZnVuY3Rpb24gdGhhdCB0YWtlcyB0d28gb2JqZWN0cywgYW5kIHJldHVybnMgLTEgaWYgdGhlXG4vLyBmaXJzdCBvYmplY3QgY29tZXMgZmlyc3QgaW4gb3JkZXIsIDEgaWYgdGhlIHNlY29uZCBvYmplY3QgY29tZXNcbi8vIGZpcnN0LCBvciAwIGlmIG5laXRoZXIgb2JqZWN0IGNvbWVzIGJlZm9yZSB0aGUgb3RoZXIuXG5cbkxvY2FsQ29sbGVjdGlvbi5fY29tcGlsZVNvcnQgPSBmdW5jdGlvbiAoc3BlYykge1xuICB2YXIgc29ydFNwZWNQYXJ0cyA9IFtdO1xuXG4gIGlmIChzcGVjIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNwZWMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmICh0eXBlb2Ygc3BlY1tpXSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICBzb3J0U3BlY1BhcnRzLnB1c2goe1xuICAgICAgICAgIGxvb2t1cDogTG9jYWxDb2xsZWN0aW9uLl9tYWtlTG9va3VwRnVuY3Rpb24oc3BlY1tpXSksXG4gICAgICAgICAgYXNjZW5kaW5nOiB0cnVlXG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc29ydFNwZWNQYXJ0cy5wdXNoKHtcbiAgICAgICAgICBsb29rdXA6IExvY2FsQ29sbGVjdGlvbi5fbWFrZUxvb2t1cEZ1bmN0aW9uKHNwZWNbaV1bMF0pLFxuICAgICAgICAgIGFzY2VuZGluZzogc3BlY1tpXVsxXSAhPT0gXCJkZXNjXCJcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2UgaWYgKHR5cGVvZiBzcGVjID09PSBcIm9iamVjdFwiKSB7XG4gICAgZm9yICh2YXIga2V5IGluIHNwZWMpIHtcbiAgICAgIHNvcnRTcGVjUGFydHMucHVzaCh7XG4gICAgICAgIGxvb2t1cDogTG9jYWxDb2xsZWN0aW9uLl9tYWtlTG9va3VwRnVuY3Rpb24oa2V5KSxcbiAgICAgICAgYXNjZW5kaW5nOiBzcGVjW2tleV0gPj0gMFxuICAgICAgfSk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHRocm93IEVycm9yKFwiQmFkIHNvcnQgc3BlY2lmaWNhdGlvbjogXCIsIEpTT04uc3RyaW5naWZ5KHNwZWMpKTtcbiAgfVxuXG4gIGlmIChzb3J0U3BlY1BhcnRzLmxlbmd0aCA9PT0gMClcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge3JldHVybiAwO307XG5cbiAgLy8gcmVkdWNlVmFsdWUgdGFrZXMgaW4gYWxsIHRoZSBwb3NzaWJsZSB2YWx1ZXMgZm9yIHRoZSBzb3J0IGtleSBhbG9uZyB2YXJpb3VzXG4gIC8vIGJyYW5jaGVzLCBhbmQgcmV0dXJucyB0aGUgbWluIG9yIG1heCB2YWx1ZSAoYWNjb3JkaW5nIHRvIHRoZSBib29sXG4gIC8vIGZpbmRNaW4pLiBFYWNoIHZhbHVlIGNhbiBpdHNlbGYgYmUgYW4gYXJyYXksIGFuZCB3ZSBsb29rIGF0IGl0cyB2YWx1ZXNcbiAgLy8gdG9vLiAoaWUsIHdlIGRvIGEgc2luZ2xlIGxldmVsIG9mIGZsYXR0ZW5pbmcgb24gYnJhbmNoVmFsdWVzLCB0aGVuIGZpbmQgdGhlXG4gIC8vIG1pbi9tYXguKVxuICB2YXIgcmVkdWNlVmFsdWUgPSBmdW5jdGlvbiAoYnJhbmNoVmFsdWVzLCBmaW5kTWluKSB7XG4gICAgdmFyIHJlZHVjZWQ7XG4gICAgdmFyIGZpcnN0ID0gdHJ1ZTtcbiAgICAvLyBJdGVyYXRlIG92ZXIgYWxsIHRoZSB2YWx1ZXMgZm91bmQgaW4gYWxsIHRoZSBicmFuY2hlcywgYW5kIGlmIGEgdmFsdWUgaXNcbiAgICAvLyBhbiBhcnJheSBpdHNlbGYsIGl0ZXJhdGUgb3ZlciB0aGUgdmFsdWVzIGluIHRoZSBhcnJheSBzZXBhcmF0ZWx5LlxuICAgIF8uZWFjaChicmFuY2hWYWx1ZXMsIGZ1bmN0aW9uIChicmFuY2hWYWx1ZSkge1xuICAgICAgLy8gVmFsdWUgbm90IGFuIGFycmF5PyBQcmV0ZW5kIGl0IGlzLlxuICAgICAgaWYgKCFpc0FycmF5KGJyYW5jaFZhbHVlKSlcbiAgICAgICAgYnJhbmNoVmFsdWUgPSBbYnJhbmNoVmFsdWVdO1xuICAgICAgLy8gVmFsdWUgaXMgYW4gZW1wdHkgYXJyYXk/IFByZXRlbmQgaXQgd2FzIG1pc3NpbmcsIHNpbmNlIHRoYXQncyB3aGVyZSBpdFxuICAgICAgLy8gc2hvdWxkIGJlIHNvcnRlZC5cbiAgICAgIGlmIChpc0FycmF5KGJyYW5jaFZhbHVlKSAmJiBicmFuY2hWYWx1ZS5sZW5ndGggPT09IDApXG4gICAgICAgIGJyYW5jaFZhbHVlID0gW3VuZGVmaW5lZF07XG4gICAgICBfLmVhY2goYnJhbmNoVmFsdWUsIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAvLyBXZSBzaG91bGQgZ2V0IGhlcmUgYXQgbGVhc3Qgb25jZTogbG9va3VwIGZ1bmN0aW9ucyByZXR1cm4gbm9uLWVtcHR5XG4gICAgICAgIC8vIGFycmF5cywgc28gdGhlIG91dGVyIGxvb3AgcnVucyBhdCBsZWFzdCBvbmNlLCBhbmQgd2UgcHJldmVudGVkXG4gICAgICAgIC8vIGJyYW5jaFZhbHVlIGZyb20gYmVpbmcgYW4gZW1wdHkgYXJyYXkuXG4gICAgICAgIGlmIChmaXJzdCkge1xuICAgICAgICAgIHJlZHVjZWQgPSB2YWx1ZTtcbiAgICAgICAgICBmaXJzdCA9IGZhbHNlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIENvbXBhcmUgdGhlIHZhbHVlIHdlIGZvdW5kIHRvIHRoZSB2YWx1ZSB3ZSBmb3VuZCBzbyBmYXIsIHNhdmluZyBpdFxuICAgICAgICAgIC8vIGlmIGl0J3MgbGVzcyAoZm9yIGFuIGFzY2VuZGluZyBzb3J0KSBvciBtb3JlIChmb3IgYSBkZXNjZW5kaW5nXG4gICAgICAgICAgLy8gc29ydCkuXG4gICAgICAgICAgdmFyIGNtcCA9IExvY2FsQ29sbGVjdGlvbi5fZi5fY21wKHJlZHVjZWQsIHZhbHVlKTtcbiAgICAgICAgICBpZiAoKGZpbmRNaW4gJiYgY21wID4gMCkgfHwgKCFmaW5kTWluICYmIGNtcCA8IDApKVxuICAgICAgICAgICAgcmVkdWNlZCA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICByZXR1cm4gcmVkdWNlZDtcbiAgfTtcblxuICByZXR1cm4gZnVuY3Rpb24gKGEsIGIpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNvcnRTcGVjUGFydHMubGVuZ3RoOyArK2kpIHtcbiAgICAgIHZhciBzcGVjUGFydCA9IHNvcnRTcGVjUGFydHNbaV07XG4gICAgICB2YXIgYVZhbHVlID0gcmVkdWNlVmFsdWUoc3BlY1BhcnQubG9va3VwKGEpLCBzcGVjUGFydC5hc2NlbmRpbmcpO1xuICAgICAgdmFyIGJWYWx1ZSA9IHJlZHVjZVZhbHVlKHNwZWNQYXJ0Lmxvb2t1cChiKSwgc3BlY1BhcnQuYXNjZW5kaW5nKTtcbiAgICAgIHZhciBjb21wYXJlID0gTG9jYWxDb2xsZWN0aW9uLl9mLl9jbXAoYVZhbHVlLCBiVmFsdWUpO1xuICAgICAgaWYgKGNvbXBhcmUgIT09IDApXG4gICAgICAgIHJldHVybiBzcGVjUGFydC5hc2NlbmRpbmcgPyBjb21wYXJlIDogLWNvbXBhcmU7XG4gICAgfTtcbiAgICByZXR1cm4gMDtcbiAgfTtcbn07XG5cbmV4cG9ydHMuY29tcGlsZURvY3VtZW50U2VsZWN0b3IgPSBjb21waWxlRG9jdW1lbnRTZWxlY3RvcjtcbmV4cG9ydHMuY29tcGlsZVNvcnQgPSBMb2NhbENvbGxlY3Rpb24uX2NvbXBpbGVTb3J0OyIsIkVKU09OID0ge307IC8vIEdsb2JhbCFcbnZhciBjdXN0b21UeXBlcyA9IHt9O1xuLy8gQWRkIGEgY3VzdG9tIHR5cGUsIHVzaW5nIGEgbWV0aG9kIG9mIHlvdXIgY2hvaWNlIHRvIGdldCB0byBhbmRcbi8vIGZyb20gYSBiYXNpYyBKU09OLWFibGUgcmVwcmVzZW50YXRpb24uICBUaGUgZmFjdG9yeSBhcmd1bWVudFxuLy8gaXMgYSBmdW5jdGlvbiBvZiBKU09OLWFibGUgLS0+IHlvdXIgb2JqZWN0XG4vLyBUaGUgdHlwZSB5b3UgYWRkIG11c3QgaGF2ZTpcbi8vIC0gQSBjbG9uZSgpIG1ldGhvZCwgc28gdGhhdCBNZXRlb3IgY2FuIGRlZXAtY29weSBpdCB3aGVuIG5lY2Vzc2FyeS5cbi8vIC0gQSBlcXVhbHMoKSBtZXRob2QsIHNvIHRoYXQgTWV0ZW9yIGNhbiBjb21wYXJlIGl0XG4vLyAtIEEgdG9KU09OVmFsdWUoKSBtZXRob2QsIHNvIHRoYXQgTWV0ZW9yIGNhbiBzZXJpYWxpemUgaXRcbi8vIC0gYSB0eXBlTmFtZSgpIG1ldGhvZCwgdG8gc2hvdyBob3cgdG8gbG9vayBpdCB1cCBpbiBvdXIgdHlwZSB0YWJsZS5cbi8vIEl0IGlzIG9rYXkgaWYgdGhlc2UgbWV0aG9kcyBhcmUgbW9ua2V5LXBhdGNoZWQgb24uXG5FSlNPTi5hZGRUeXBlID0gZnVuY3Rpb24gKG5hbWUsIGZhY3RvcnkpIHtcbiAgaWYgKF8uaGFzKGN1c3RvbVR5cGVzLCBuYW1lKSlcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJUeXBlIFwiICsgbmFtZSArIFwiIGFscmVhZHkgcHJlc2VudFwiKTtcbiAgY3VzdG9tVHlwZXNbbmFtZV0gPSBmYWN0b3J5O1xufTtcblxudmFyIGJ1aWx0aW5Db252ZXJ0ZXJzID0gW1xuICB7IC8vIERhdGVcbiAgICBtYXRjaEpTT05WYWx1ZTogZnVuY3Rpb24gKG9iaikge1xuICAgICAgcmV0dXJuIF8uaGFzKG9iaiwgJyRkYXRlJykgJiYgXy5zaXplKG9iaikgPT09IDE7XG4gICAgfSxcbiAgICBtYXRjaE9iamVjdDogZnVuY3Rpb24gKG9iaikge1xuICAgICAgcmV0dXJuIG9iaiBpbnN0YW5jZW9mIERhdGU7XG4gICAgfSxcbiAgICB0b0pTT05WYWx1ZTogZnVuY3Rpb24gKG9iaikge1xuICAgICAgcmV0dXJuIHskZGF0ZTogb2JqLmdldFRpbWUoKX07XG4gICAgfSxcbiAgICBmcm9tSlNPTlZhbHVlOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICByZXR1cm4gbmV3IERhdGUob2JqLiRkYXRlKTtcbiAgICB9XG4gIH0sXG4gIHsgLy8gQmluYXJ5XG4gICAgbWF0Y2hKU09OVmFsdWU6IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgIHJldHVybiBfLmhhcyhvYmosICckYmluYXJ5JykgJiYgXy5zaXplKG9iaikgPT09IDE7XG4gICAgfSxcbiAgICBtYXRjaE9iamVjdDogZnVuY3Rpb24gKG9iaikge1xuICAgICAgcmV0dXJuIHR5cGVvZiBVaW50OEFycmF5ICE9PSAndW5kZWZpbmVkJyAmJiBvYmogaW5zdGFuY2VvZiBVaW50OEFycmF5XG4gICAgICAgIHx8IChvYmogJiYgXy5oYXMob2JqLCAnJFVpbnQ4QXJyYXlQb2x5ZmlsbCcpKTtcbiAgICB9LFxuICAgIHRvSlNPTlZhbHVlOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICByZXR1cm4geyRiaW5hcnk6IEVKU09OLl9iYXNlNjRFbmNvZGUob2JqKX07XG4gICAgfSxcbiAgICBmcm9tSlNPTlZhbHVlOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICByZXR1cm4gRUpTT04uX2Jhc2U2NERlY29kZShvYmouJGJpbmFyeSk7XG4gICAgfVxuICB9LFxuICB7IC8vIEVzY2FwaW5nIG9uZSBsZXZlbFxuICAgIG1hdGNoSlNPTlZhbHVlOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICByZXR1cm4gXy5oYXMob2JqLCAnJGVzY2FwZScpICYmIF8uc2l6ZShvYmopID09PSAxO1xuICAgIH0sXG4gICAgbWF0Y2hPYmplY3Q6IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgIGlmIChfLmlzRW1wdHkob2JqKSB8fCBfLnNpemUob2JqKSA+IDIpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIF8uYW55KGJ1aWx0aW5Db252ZXJ0ZXJzLCBmdW5jdGlvbiAoY29udmVydGVyKSB7XG4gICAgICAgIHJldHVybiBjb252ZXJ0ZXIubWF0Y2hKU09OVmFsdWUob2JqKTtcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgdG9KU09OVmFsdWU6IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgIHZhciBuZXdPYmogPSB7fTtcbiAgICAgIF8uZWFjaChvYmosIGZ1bmN0aW9uICh2YWx1ZSwga2V5KSB7XG4gICAgICAgIG5ld09ialtrZXldID0gRUpTT04udG9KU09OVmFsdWUodmFsdWUpO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4geyRlc2NhcGU6IG5ld09ian07XG4gICAgfSxcbiAgICBmcm9tSlNPTlZhbHVlOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICB2YXIgbmV3T2JqID0ge307XG4gICAgICBfLmVhY2gob2JqLiRlc2NhcGUsIGZ1bmN0aW9uICh2YWx1ZSwga2V5KSB7XG4gICAgICAgIG5ld09ialtrZXldID0gRUpTT04uZnJvbUpTT05WYWx1ZSh2YWx1ZSk7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBuZXdPYmo7XG4gICAgfVxuICB9LFxuICB7IC8vIEN1c3RvbVxuICAgIG1hdGNoSlNPTlZhbHVlOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICByZXR1cm4gXy5oYXMob2JqLCAnJHR5cGUnKSAmJiBfLmhhcyhvYmosICckdmFsdWUnKSAmJiBfLnNpemUob2JqKSA9PT0gMjtcbiAgICB9LFxuICAgIG1hdGNoT2JqZWN0OiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICByZXR1cm4gRUpTT04uX2lzQ3VzdG9tVHlwZShvYmopO1xuICAgIH0sXG4gICAgdG9KU09OVmFsdWU6IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgIHJldHVybiB7JHR5cGU6IG9iai50eXBlTmFtZSgpLCAkdmFsdWU6IG9iai50b0pTT05WYWx1ZSgpfTtcbiAgICB9LFxuICAgIGZyb21KU09OVmFsdWU6IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgIHZhciB0eXBlTmFtZSA9IG9iai4kdHlwZTtcbiAgICAgIHZhciBjb252ZXJ0ZXIgPSBjdXN0b21UeXBlc1t0eXBlTmFtZV07XG4gICAgICByZXR1cm4gY29udmVydGVyKG9iai4kdmFsdWUpO1xuICAgIH1cbiAgfVxuXTtcblxuRUpTT04uX2lzQ3VzdG9tVHlwZSA9IGZ1bmN0aW9uIChvYmopIHtcbiAgcmV0dXJuIG9iaiAmJlxuICAgIHR5cGVvZiBvYmoudG9KU09OVmFsdWUgPT09ICdmdW5jdGlvbicgJiZcbiAgICB0eXBlb2Ygb2JqLnR5cGVOYW1lID09PSAnZnVuY3Rpb24nICYmXG4gICAgXy5oYXMoY3VzdG9tVHlwZXMsIG9iai50eXBlTmFtZSgpKTtcbn07XG5cblxuLy9mb3IgYm90aCBhcnJheXMgYW5kIG9iamVjdHMsIGluLXBsYWNlIG1vZGlmaWNhdGlvbi5cbnZhciBhZGp1c3RUeXBlc1RvSlNPTlZhbHVlID1cbkVKU09OLl9hZGp1c3RUeXBlc1RvSlNPTlZhbHVlID0gZnVuY3Rpb24gKG9iaikge1xuICBpZiAob2JqID09PSBudWxsKVxuICAgIHJldHVybiBudWxsO1xuICB2YXIgbWF5YmVDaGFuZ2VkID0gdG9KU09OVmFsdWVIZWxwZXIob2JqKTtcbiAgaWYgKG1heWJlQ2hhbmdlZCAhPT0gdW5kZWZpbmVkKVxuICAgIHJldHVybiBtYXliZUNoYW5nZWQ7XG4gIF8uZWFjaChvYmosIGZ1bmN0aW9uICh2YWx1ZSwga2V5KSB7XG4gICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ29iamVjdCcgJiYgdmFsdWUgIT09IHVuZGVmaW5lZClcbiAgICAgIHJldHVybjsgLy8gY29udGludWVcbiAgICB2YXIgY2hhbmdlZCA9IHRvSlNPTlZhbHVlSGVscGVyKHZhbHVlKTtcbiAgICBpZiAoY2hhbmdlZCkge1xuICAgICAgb2JqW2tleV0gPSBjaGFuZ2VkO1xuICAgICAgcmV0dXJuOyAvLyBvbiB0byB0aGUgbmV4dCBrZXlcbiAgICB9XG4gICAgLy8gaWYgd2UgZ2V0IGhlcmUsIHZhbHVlIGlzIGFuIG9iamVjdCBidXQgbm90IGFkanVzdGFibGVcbiAgICAvLyBhdCB0aGlzIGxldmVsLiAgcmVjdXJzZS5cbiAgICBhZGp1c3RUeXBlc1RvSlNPTlZhbHVlKHZhbHVlKTtcbiAgfSk7XG4gIHJldHVybiBvYmo7XG59O1xuXG4vLyBFaXRoZXIgcmV0dXJuIHRoZSBKU09OLWNvbXBhdGlibGUgdmVyc2lvbiBvZiB0aGUgYXJndW1lbnQsIG9yIHVuZGVmaW5lZCAoaWZcbi8vIHRoZSBpdGVtIGlzbid0IGl0c2VsZiByZXBsYWNlYWJsZSwgYnV0IG1heWJlIHNvbWUgZmllbGRzIGluIGl0IGFyZSlcbnZhciB0b0pTT05WYWx1ZUhlbHBlciA9IGZ1bmN0aW9uIChpdGVtKSB7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYnVpbHRpbkNvbnZlcnRlcnMubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgY29udmVydGVyID0gYnVpbHRpbkNvbnZlcnRlcnNbaV07XG4gICAgaWYgKGNvbnZlcnRlci5tYXRjaE9iamVjdChpdGVtKSkge1xuICAgICAgcmV0dXJuIGNvbnZlcnRlci50b0pTT05WYWx1ZShpdGVtKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHVuZGVmaW5lZDtcbn07XG5cbkVKU09OLnRvSlNPTlZhbHVlID0gZnVuY3Rpb24gKGl0ZW0pIHtcbiAgdmFyIGNoYW5nZWQgPSB0b0pTT05WYWx1ZUhlbHBlcihpdGVtKTtcbiAgaWYgKGNoYW5nZWQgIT09IHVuZGVmaW5lZClcbiAgICByZXR1cm4gY2hhbmdlZDtcbiAgaWYgKHR5cGVvZiBpdGVtID09PSAnb2JqZWN0Jykge1xuICAgIGl0ZW0gPSBFSlNPTi5jbG9uZShpdGVtKTtcbiAgICBhZGp1c3RUeXBlc1RvSlNPTlZhbHVlKGl0ZW0pO1xuICB9XG4gIHJldHVybiBpdGVtO1xufTtcblxuLy9mb3IgYm90aCBhcnJheXMgYW5kIG9iamVjdHMuIFRyaWVzIGl0cyBiZXN0IHRvIGp1c3Rcbi8vIHVzZSB0aGUgb2JqZWN0IHlvdSBoYW5kIGl0LCBidXQgbWF5IHJldHVybiBzb21ldGhpbmdcbi8vIGRpZmZlcmVudCBpZiB0aGUgb2JqZWN0IHlvdSBoYW5kIGl0IGl0c2VsZiBuZWVkcyBjaGFuZ2luZy5cbnZhciBhZGp1c3RUeXBlc0Zyb21KU09OVmFsdWUgPVxuRUpTT04uX2FkanVzdFR5cGVzRnJvbUpTT05WYWx1ZSA9IGZ1bmN0aW9uIChvYmopIHtcbiAgaWYgKG9iaiA9PT0gbnVsbClcbiAgICByZXR1cm4gbnVsbDtcbiAgdmFyIG1heWJlQ2hhbmdlZCA9IGZyb21KU09OVmFsdWVIZWxwZXIob2JqKTtcbiAgaWYgKG1heWJlQ2hhbmdlZCAhPT0gb2JqKVxuICAgIHJldHVybiBtYXliZUNoYW5nZWQ7XG4gIF8uZWFjaChvYmosIGZ1bmN0aW9uICh2YWx1ZSwga2V5KSB7XG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgIHZhciBjaGFuZ2VkID0gZnJvbUpTT05WYWx1ZUhlbHBlcih2YWx1ZSk7XG4gICAgICBpZiAodmFsdWUgIT09IGNoYW5nZWQpIHtcbiAgICAgICAgb2JqW2tleV0gPSBjaGFuZ2VkO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICAvLyBpZiB3ZSBnZXQgaGVyZSwgdmFsdWUgaXMgYW4gb2JqZWN0IGJ1dCBub3QgYWRqdXN0YWJsZVxuICAgICAgLy8gYXQgdGhpcyBsZXZlbC4gIHJlY3Vyc2UuXG4gICAgICBhZGp1c3RUeXBlc0Zyb21KU09OVmFsdWUodmFsdWUpO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiBvYmo7XG59O1xuXG4vLyBFaXRoZXIgcmV0dXJuIHRoZSBhcmd1bWVudCBjaGFuZ2VkIHRvIGhhdmUgdGhlIG5vbi1qc29uXG4vLyByZXAgb2YgaXRzZWxmICh0aGUgT2JqZWN0IHZlcnNpb24pIG9yIHRoZSBhcmd1bWVudCBpdHNlbGYuXG5cbi8vIERPRVMgTk9UIFJFQ1VSU0UuICBGb3IgYWN0dWFsbHkgZ2V0dGluZyB0aGUgZnVsbHktY2hhbmdlZCB2YWx1ZSwgdXNlXG4vLyBFSlNPTi5mcm9tSlNPTlZhbHVlXG52YXIgZnJvbUpTT05WYWx1ZUhlbHBlciA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICBpZiAodHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiB2YWx1ZSAhPT0gbnVsbCkge1xuICAgIGlmIChfLnNpemUodmFsdWUpIDw9IDJcbiAgICAgICAgJiYgXy5hbGwodmFsdWUsIGZ1bmN0aW9uICh2LCBrKSB7XG4gICAgICAgICAgcmV0dXJuIHR5cGVvZiBrID09PSAnc3RyaW5nJyAmJiBrLnN1YnN0cigwLCAxKSA9PT0gJyQnO1xuICAgICAgICB9KSkge1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBidWlsdGluQ29udmVydGVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgY29udmVydGVyID0gYnVpbHRpbkNvbnZlcnRlcnNbaV07XG4gICAgICAgIGlmIChjb252ZXJ0ZXIubWF0Y2hKU09OVmFsdWUodmFsdWUpKSB7XG4gICAgICAgICAgcmV0dXJuIGNvbnZlcnRlci5mcm9tSlNPTlZhbHVlKHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gdmFsdWU7XG59O1xuXG5FSlNPTi5mcm9tSlNPTlZhbHVlID0gZnVuY3Rpb24gKGl0ZW0pIHtcbiAgdmFyIGNoYW5nZWQgPSBmcm9tSlNPTlZhbHVlSGVscGVyKGl0ZW0pO1xuICBpZiAoY2hhbmdlZCA9PT0gaXRlbSAmJiB0eXBlb2YgaXRlbSA9PT0gJ29iamVjdCcpIHtcbiAgICBpdGVtID0gRUpTT04uY2xvbmUoaXRlbSk7XG4gICAgYWRqdXN0VHlwZXNGcm9tSlNPTlZhbHVlKGl0ZW0pO1xuICAgIHJldHVybiBpdGVtO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBjaGFuZ2VkO1xuICB9XG59O1xuXG5FSlNPTi5zdHJpbmdpZnkgPSBmdW5jdGlvbiAoaXRlbSkge1xuICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoRUpTT04udG9KU09OVmFsdWUoaXRlbSkpO1xufTtcblxuRUpTT04ucGFyc2UgPSBmdW5jdGlvbiAoaXRlbSkge1xuICByZXR1cm4gRUpTT04uZnJvbUpTT05WYWx1ZShKU09OLnBhcnNlKGl0ZW0pKTtcbn07XG5cbkVKU09OLmlzQmluYXJ5ID0gZnVuY3Rpb24gKG9iaikge1xuICByZXR1cm4gKHR5cGVvZiBVaW50OEFycmF5ICE9PSAndW5kZWZpbmVkJyAmJiBvYmogaW5zdGFuY2VvZiBVaW50OEFycmF5KSB8fFxuICAgIChvYmogJiYgb2JqLiRVaW50OEFycmF5UG9seWZpbGwpO1xufTtcblxuRUpTT04uZXF1YWxzID0gZnVuY3Rpb24gKGEsIGIsIG9wdGlvbnMpIHtcbiAgdmFyIGk7XG4gIHZhciBrZXlPcmRlclNlbnNpdGl2ZSA9ICEhKG9wdGlvbnMgJiYgb3B0aW9ucy5rZXlPcmRlclNlbnNpdGl2ZSk7XG4gIGlmIChhID09PSBiKVxuICAgIHJldHVybiB0cnVlO1xuICBpZiAoIWEgfHwgIWIpIC8vIGlmIGVpdGhlciBvbmUgaXMgZmFsc3ksIHRoZXknZCBoYXZlIHRvIGJlID09PSB0byBiZSBlcXVhbFxuICAgIHJldHVybiBmYWxzZTtcbiAgaWYgKCEodHlwZW9mIGEgPT09ICdvYmplY3QnICYmIHR5cGVvZiBiID09PSAnb2JqZWN0JykpXG4gICAgcmV0dXJuIGZhbHNlO1xuICBpZiAoYSBpbnN0YW5jZW9mIERhdGUgJiYgYiBpbnN0YW5jZW9mIERhdGUpXG4gICAgcmV0dXJuIGEudmFsdWVPZigpID09PSBiLnZhbHVlT2YoKTtcbiAgaWYgKEVKU09OLmlzQmluYXJ5KGEpICYmIEVKU09OLmlzQmluYXJ5KGIpKSB7XG4gICAgaWYgKGEubGVuZ3RoICE9PSBiLmxlbmd0aClcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgYS5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKGFbaV0gIT09IGJbaV0pXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgaWYgKHR5cGVvZiAoYS5lcXVhbHMpID09PSAnZnVuY3Rpb24nKVxuICAgIHJldHVybiBhLmVxdWFscyhiLCBvcHRpb25zKTtcbiAgaWYgKGEgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgIGlmICghKGIgaW5zdGFuY2VvZiBBcnJheSkpXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgaWYgKGEubGVuZ3RoICE9PSBiLmxlbmd0aClcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgYS5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKCFFSlNPTi5lcXVhbHMoYVtpXSwgYltpXSwgb3B0aW9ucykpXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgLy8gZmFsbCBiYWNrIHRvIHN0cnVjdHVyYWwgZXF1YWxpdHkgb2Ygb2JqZWN0c1xuICB2YXIgcmV0O1xuICBpZiAoa2V5T3JkZXJTZW5zaXRpdmUpIHtcbiAgICB2YXIgYktleXMgPSBbXTtcbiAgICBfLmVhY2goYiwgZnVuY3Rpb24gKHZhbCwgeCkge1xuICAgICAgICBiS2V5cy5wdXNoKHgpO1xuICAgIH0pO1xuICAgIGkgPSAwO1xuICAgIHJldCA9IF8uYWxsKGEsIGZ1bmN0aW9uICh2YWwsIHgpIHtcbiAgICAgIGlmIChpID49IGJLZXlzLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBpZiAoeCAhPT0gYktleXNbaV0pIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgaWYgKCFFSlNPTi5lcXVhbHModmFsLCBiW2JLZXlzW2ldXSwgb3B0aW9ucykpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgaSsrO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSk7XG4gICAgcmV0dXJuIHJldCAmJiBpID09PSBiS2V5cy5sZW5ndGg7XG4gIH0gZWxzZSB7XG4gICAgaSA9IDA7XG4gICAgcmV0ID0gXy5hbGwoYSwgZnVuY3Rpb24gKHZhbCwga2V5KSB7XG4gICAgICBpZiAoIV8uaGFzKGIsIGtleSkpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgaWYgKCFFSlNPTi5lcXVhbHModmFsLCBiW2tleV0sIG9wdGlvbnMpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGkrKztcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0pO1xuICAgIHJldHVybiByZXQgJiYgXy5zaXplKGIpID09PSBpO1xuICB9XG59O1xuXG5FSlNPTi5jbG9uZSA9IGZ1bmN0aW9uICh2KSB7XG4gIHZhciByZXQ7XG4gIGlmICh0eXBlb2YgdiAhPT0gXCJvYmplY3RcIilcbiAgICByZXR1cm4gdjtcbiAgaWYgKHYgPT09IG51bGwpXG4gICAgcmV0dXJuIG51bGw7IC8vIG51bGwgaGFzIHR5cGVvZiBcIm9iamVjdFwiXG4gIGlmICh2IGluc3RhbmNlb2YgRGF0ZSlcbiAgICByZXR1cm4gbmV3IERhdGUodi5nZXRUaW1lKCkpO1xuICBpZiAoRUpTT04uaXNCaW5hcnkodikpIHtcbiAgICByZXQgPSBFSlNPTi5uZXdCaW5hcnkodi5sZW5ndGgpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdi5sZW5ndGg7IGkrKykge1xuICAgICAgcmV0W2ldID0gdltpXTtcbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbiAgfVxuICBpZiAoXy5pc0FycmF5KHYpIHx8IF8uaXNBcmd1bWVudHModikpIHtcbiAgICAvLyBGb3Igc29tZSByZWFzb24sIF8ubWFwIGRvZXNuJ3Qgd29yayBpbiB0aGlzIGNvbnRleHQgb24gT3BlcmEgKHdlaXJkIHRlc3RcbiAgICAvLyBmYWlsdXJlcykuXG4gICAgcmV0ID0gW107XG4gICAgZm9yIChpID0gMDsgaSA8IHYubGVuZ3RoOyBpKyspXG4gICAgICByZXRbaV0gPSBFSlNPTi5jbG9uZSh2W2ldKTtcbiAgICByZXR1cm4gcmV0O1xuICB9XG4gIC8vIGhhbmRsZSBnZW5lcmFsIHVzZXItZGVmaW5lZCB0eXBlZCBPYmplY3RzIGlmIHRoZXkgaGF2ZSBhIGNsb25lIG1ldGhvZFxuICBpZiAodHlwZW9mIHYuY2xvbmUgPT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gdi5jbG9uZSgpO1xuICB9XG4gIC8vIGhhbmRsZSBvdGhlciBvYmplY3RzXG4gIHJldCA9IHt9O1xuICBfLmVhY2godiwgZnVuY3Rpb24gKHZhbHVlLCBrZXkpIHtcbiAgICByZXRba2V5XSA9IEVKU09OLmNsb25lKHZhbHVlKTtcbiAgfSk7XG4gIHJldHVybiByZXQ7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEVKU09OOyJdfQ==
;