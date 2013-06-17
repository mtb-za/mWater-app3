require=(function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
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


},{"./helpers/UIDriver":6,"../app/js/LocationView":7}],8:[function(require,module,exports){
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


},{"../app/js/db/LocalDb":9,"./db_queries":10}],"forms":[function(require,module,exports){
module.exports=require('EAVIrc');
},{}],"EAVIrc":[function(require,module,exports){
(function() {
  var SurveyView, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  exports.DateQuestion = require('./DateQuestion');

  exports.SurveyView = SurveyView = (function(_super) {
    __extends(SurveyView, _super);

    function SurveyView() {
      _ref = SurveyView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    SurveyView.prototype.initialize = function(options) {
      var view, _i, _len, _ref1,
        _this = this;
      _ref1 = options.views;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        view = _ref1[_i];
        this.$el.append(view.el);
        this.listenTo(view, 'close', function() {
          return _this.trigger('close');
        });
        this.listenTo(view, 'complete', function() {
          return _this.trigger('complete');
        });
      }
      return this.listenTo(this.model, 'change', function() {
        return _this.trigger('change');
      });
    };

    SurveyView.prototype.load = function(data) {
      this.model.clear({
        silent: true
      });
      return this.model.set(data);
    };

    SurveyView.prototype.save = function() {
      return this.model.toJSON();
    };

    return SurveyView;

  })(Backbone.View);

  _.extend(exports, require('./form-controls'));

}).call(this);


},{"./form-controls":11,"./DateQuestion":12}],2:[function(require,module,exports){
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


},{}],6:[function(require,module,exports){
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


},{"../app/js/GeoJSON":4}],7:[function(require,module,exports){
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

    return LocationView;

  })(Backbone.View);

  module.exports = LocationView;

}).call(this);


},{"./LocationFinder":13,"./GeoJSON":4}],9:[function(require,module,exports){
(function() {
  var Collection, GeoJSON, LocalDb, compileDocumentSelector, compileSort, createUid, processGeoIntersectsOperator, processNearOperator;

  compileDocumentSelector = require('./selector').compileDocumentSelector;

  compileSort = require('./selector').compileSort;

  GeoJSON = require('../GeoJSON');

  LocalDb = (function() {
    function LocalDb(name) {
      this.name = name;
      this.collections = {};
    }

    LocalDb.prototype.addCollection = function(name) {
      var collection, dbName, namespace;
      dbName = this.name;
      namespace = "db." + dbName + "." + name + ".";
      collection = new Collection(name, namespace);
      this[name] = collection;
      return this.collections[name] = collection;
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


},{"./selector":14,"../GeoJSON":4}],11:[function(require,module,exports){
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

exports.DropdownQuestion = exports.Question.extend({
    events : {
        "change" : "changed",
    },

    changed : function(e) {
        var val = $(e.target).val();
        if (val == "") {
            this.model.set(this.id, null);
        } else {
            var index = parseInt(val);
            var value = this.options.options[index][0];
            this.model.set(this.id, value);
        }
    },

    renderAnswer : function(answerEl) {
        answerEl.html(_.template('<select id="source_type"><%=renderDropdownOptions()%></select>', this));
    },

    renderDropdownOptions : function() {
        html = "";

        // Add empty option
        html += '<option value=""></option>';

        var i;
        for ( i = 0; i < this.options.options.length; i++) {
            html += _.template('<option value="<%=position%>" <%=selected%>><%-text%></option>', {
                position : i,
                text : this.options.options[i][1],
                selected : this.model.get(this.id) === this.options.options[i][0] ? 'selected="selected"' : ""
            });
        }

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

},{}],12:[function(require,module,exports){
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


},{"./form-controls":11}],13:[function(require,module,exports){
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


},{}],14:[function(require,module,exports){
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
},{"./EJSON":15}],15:[function(require,module,exports){
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
},{}]},{},[1,3,5,8])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL3Rlc3QvSXRlbVRyYWNrZXJUZXN0cy5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL3Rlc3QvR2VvSlNPTlRlc3RzLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvdGVzdC9Mb2NhdGlvblZpZXdUZXN0cy5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL3Rlc3QvTG9jYWxEYlRlc3RzLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL2Zvcm1zL2luZGV4LmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL0l0ZW1UcmFja2VyLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL0dlb0pTT04uY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My90ZXN0L2hlbHBlcnMvVUlEcml2ZXIuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My90ZXN0L2RiX3F1ZXJpZXMuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvTG9jYXRpb25WaWV3LmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL2RiL0xvY2FsRGIuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvZm9ybXMvZm9ybS1jb250cm9scy5qcyIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL2Zvcm1zL0RhdGVRdWVzdGlvbi5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9Mb2NhdGlvbkZpbmRlci5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9kYi9zZWxlY3Rvci5qcyIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL2RiL0VKU09OLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtDQUFBLEtBQUEsYUFBQTs7Q0FBQSxDQUFBLENBQVMsQ0FBSSxFQUFiOztDQUFBLENBQ0EsQ0FBYyxJQUFBLElBQWQsWUFBYzs7Q0FEZCxDQUdBLENBQXdCLEtBQXhCLENBQXdCLElBQXhCO0NBQ0UsRUFBVyxDQUFYLEtBQVcsQ0FBWDtDQUNHLEVBQWMsQ0FBZCxHQUFELElBQWUsRUFBZjtDQURGLElBQVc7Q0FBWCxDQUdBLENBQW1CLENBQW5CLEtBQW1CLEtBQW5CO0NBQ0UsU0FBQSxnQkFBQTtDQUFBLEVBQVMsRUFBVCxDQUFBO1NBQ0U7Q0FBQSxDQUFLLENBQUwsT0FBQTtDQUFBLENBQVUsUUFBRjtDQUFSLENBQ0ssQ0FBTCxPQUFBO0NBREEsQ0FDVSxRQUFGO1VBRkQ7Q0FBVCxPQUFBO0NBQUEsQ0FJQyxFQUFrQixDQUFELENBQWxCLENBQWtCO0NBSmxCLENBS3VCLEVBQXZCLENBQUEsQ0FBQSxHQUFBO0NBQ08sQ0FBbUIsSUFBcEIsQ0FBTixFQUFBLElBQUE7Q0FQRixJQUFtQjtDQUhuQixDQVlBLENBQXNCLENBQXRCLEtBQXNCLFFBQXRCO0NBQ0UsU0FBQSx1QkFBQTtDQUFBLEVBQVMsRUFBVCxDQUFBO1NBQ0U7Q0FBQSxDQUFNLENBQUwsT0FBQTtDQUFELENBQVcsUUFBRjtFQUNULFFBRk87Q0FFUCxDQUFNLENBQUwsT0FBQTtDQUFELENBQVcsUUFBRjtVQUZGO0NBQVQsT0FBQTtDQUFBLENBSUMsRUFBa0IsQ0FBRCxDQUFsQixDQUFrQjtDQUpsQixDQUtDLEVBQWtCLENBQUQsQ0FBbEIsQ0FBMEIsQ0FBUjtDQUxsQixDQU11QixFQUF2QixFQUFBLEdBQUE7Q0FDTyxDQUFtQixJQUFwQixDQUFOLEVBQUEsSUFBQTtDQVJGLElBQXNCO0NBWnRC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O0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNB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QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsiYXNzZXJ0ID0gY2hhaS5hc3NlcnRcbkl0ZW1UcmFja2VyID0gcmVxdWlyZSBcIi4uL2FwcC9qcy9JdGVtVHJhY2tlclwiXG5cbmRlc2NyaWJlICdJdGVtVHJhY2tlcicsIC0+XG4gIGJlZm9yZUVhY2ggLT5cbiAgICBAdHJhY2tlciA9IG5ldyBJdGVtVHJhY2tlcigpXG5cbiAgaXQgXCJyZWNvcmRzIGFkZHNcIiwgLT5cbiAgICBpdGVtcyA9ICBbXG4gICAgICBfaWQ6IDEsIHg6MVxuICAgICAgX2lkOiAyLCB4OjJcbiAgICBdXG4gICAgW2FkZHMsIHJlbW92ZXNdID0gQHRyYWNrZXIudXBkYXRlKGl0ZW1zKVxuICAgIGFzc2VydC5kZWVwRXF1YWwgYWRkcywgaXRlbXNcbiAgICBhc3NlcnQuZGVlcEVxdWFsIHJlbW92ZXMsIFtdXG5cbiAgaXQgXCJyZW1lbWJlcnMgaXRlbXNcIiwgLT5cbiAgICBpdGVtcyA9ICBbXG4gICAgICB7X2lkOiAxLCB4OjF9XG4gICAgICB7X2lkOiAyLCB4OjJ9XG4gICAgXVxuICAgIFthZGRzLCByZW1vdmVzXSA9IEB0cmFja2VyLnVwZGF0ZShpdGVtcylcbiAgICBbYWRkcywgcmVtb3Zlc10gPSBAdHJhY2tlci51cGRhdGUoaXRlbXMpXG4gICAgYXNzZXJ0LmRlZXBFcXVhbCBhZGRzLCBbXVxuICAgIGFzc2VydC5kZWVwRXF1YWwgcmVtb3ZlcywgW11cblxuICBpdCBcInNlZXMgcmVtb3ZlZCBpdGVtc1wiLCAtPlxuICAgIGl0ZW1zMSA9ICBbXG4gICAgICB7X2lkOiAxLCB4OjF9XG4gICAgICB7X2lkOiAyLCB4OjJ9XG4gICAgXVxuICAgIGl0ZW1zMiA9ICBbXG4gICAgICB7X2lkOiAxLCB4OjF9XG4gICAgXVxuICAgIEB0cmFja2VyLnVwZGF0ZShpdGVtczEpXG4gICAgW2FkZHMsIHJlbW92ZXNdID0gQHRyYWNrZXIudXBkYXRlKGl0ZW1zMilcbiAgICBhc3NlcnQuZGVlcEVxdWFsIGFkZHMsIFtdXG4gICAgYXNzZXJ0LmRlZXBFcXVhbCByZW1vdmVzLCBbe19pZDogMiwgeDoyfV1cblxuICBpdCBcInNlZXMgcmVtb3ZlZCBjaGFuZ2VzXCIsIC0+XG4gICAgaXRlbXMxID0gIFtcbiAgICAgIHtfaWQ6IDEsIHg6MX1cbiAgICAgIHtfaWQ6IDIsIHg6Mn1cbiAgICBdXG4gICAgaXRlbXMyID0gIFtcbiAgICAgIHtfaWQ6IDEsIHg6MX1cbiAgICAgIHtfaWQ6IDIsIHg6NH1cbiAgICBdXG4gICAgQHRyYWNrZXIudXBkYXRlKGl0ZW1zMSlcbiAgICBbYWRkcywgcmVtb3Zlc10gPSBAdHJhY2tlci51cGRhdGUoaXRlbXMyKVxuICAgIGFzc2VydC5kZWVwRXF1YWwgYWRkcywgW3tfaWQ6IDIsIHg6NH1dXG4gICAgYXNzZXJ0LmRlZXBFcXVhbCByZW1vdmVzLCBbe19pZDogMiwgeDoyfV1cbiIsImFzc2VydCA9IGNoYWkuYXNzZXJ0XG5HZW9KU09OID0gcmVxdWlyZSBcIi4uL2FwcC9qcy9HZW9KU09OXCJcblxuZGVzY3JpYmUgJ0dlb0pTT04nLCAtPlxuICBpdCAncmV0dXJucyBhIHByb3BlciBwb2x5Z29uJywgLT5cbiAgICBzb3V0aFdlc3QgPSBuZXcgTC5MYXRMbmcoMTAsIDIwKVxuICAgIG5vcnRoRWFzdCA9IG5ldyBMLkxhdExuZygxMywgMjMpXG4gICAgYm91bmRzID0gbmV3IEwuTGF0TG5nQm91bmRzKHNvdXRoV2VzdCwgbm9ydGhFYXN0KVxuXG4gICAganNvbiA9IEdlb0pTT04ubGF0TG5nQm91bmRzVG9HZW9KU09OKGJvdW5kcylcbiAgICBhc3NlcnQgXy5pc0VxdWFsIGpzb24sIHtcbiAgICAgIHR5cGU6IFwiUG9seWdvblwiLFxuICAgICAgY29vcmRpbmF0ZXM6IFtcbiAgICAgICAgW1syMCwxMF0sWzIwLDEzXSxbMjMsMTNdLFsyMywxMF1dXG4gICAgICBdXG4gICAgfVxuXG4gIGl0ICdnZXRzIHJlbGF0aXZlIGxvY2F0aW9uIE4nLCAtPlxuICAgIGZyb20gPSB7IHR5cGU6IFwiUG9pbnRcIiwgY29vcmRpbmF0ZXM6IFsxMCwgMjBdfVxuICAgIHRvID0geyB0eXBlOiBcIlBvaW50XCIsIGNvb3JkaW5hdGVzOiBbMTAsIDIxXX1cbiAgICBzdHIgPSBHZW9KU09OLmdldFJlbGF0aXZlTG9jYXRpb24oZnJvbSwgdG8pXG4gICAgYXNzZXJ0LmVxdWFsIHN0ciwgJzExMS4ya20gTidcblxuICBpdCAnZ2V0cyByZWxhdGl2ZSBsb2NhdGlvbiBTJywgLT5cbiAgICBmcm9tID0geyB0eXBlOiBcIlBvaW50XCIsIGNvb3JkaW5hdGVzOiBbMTAsIDIwXX1cbiAgICB0byA9IHsgdHlwZTogXCJQb2ludFwiLCBjb29yZGluYXRlczogWzEwLCAxOV19XG4gICAgc3RyID0gR2VvSlNPTi5nZXRSZWxhdGl2ZUxvY2F0aW9uKGZyb20sIHRvKVxuICAgIGFzc2VydC5lcXVhbCBzdHIsICcxMTEuMmttIFMnXG4iLCJhc3NlcnQgPSBjaGFpLmFzc2VydFxuTG9jYXRpb25WaWV3ID0gcmVxdWlyZSAnLi4vYXBwL2pzL0xvY2F0aW9uVmlldydcblVJRHJpdmVyID0gcmVxdWlyZSAnLi9oZWxwZXJzL1VJRHJpdmVyJ1xuXG5jbGFzcyBNb2NrTG9jYXRpb25GaW5kZXJcbiAgY29uc3RydWN0b3I6ICAtPlxuICAgIF8uZXh0ZW5kIEAsIEJhY2tib25lLkV2ZW50c1xuXG4gIGdldExvY2F0aW9uOiAtPlxuICBzdGFydFdhdGNoOiAtPlxuICBzdG9wV2F0Y2g6IC0+XG5cbmRlc2NyaWJlICdMb2NhdGlvblZpZXcnLCAtPlxuICBjb250ZXh0ICdXaXRoIG5vIHNldCBsb2NhdGlvbicsIC0+XG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgQGxvY2F0aW9uRmluZGVyID0gbmV3IE1vY2tMb2NhdGlvbkZpbmRlcigpXG4gICAgICBAbG9jYXRpb25WaWV3ID0gbmV3IExvY2F0aW9uVmlldyhsb2M6bnVsbCwgbG9jYXRpb25GaW5kZXI6IEBsb2NhdGlvbkZpbmRlcilcbiAgICAgIEB1aSA9IG5ldyBVSURyaXZlcihAbG9jYXRpb25WaWV3LmVsKVxuXG4gICAgaXQgJ2Rpc3BsYXlzIFVuc3BlY2lmaWVkJywgLT5cbiAgICAgIGFzc2VydC5pbmNsdWRlKEB1aS50ZXh0KCksICdVbnNwZWNpZmllZCcpXG5cbiAgICBpdCAnZGlzYWJsZXMgbWFwJywgLT5cbiAgICAgIGFzc2VydC5pc1RydWUgQHVpLmdldERpc2FibGVkKFwiTWFwXCIpIFxuXG4gICAgaXQgJ2FsbG93cyBzZXR0aW5nIGxvY2F0aW9uJywgLT5cbiAgICAgIEB1aS5jbGljaygnU2V0JylcbiAgICAgIHNldFBvcyA9IG51bGxcbiAgICAgIEBsb2NhdGlvblZpZXcub24gJ2xvY2F0aW9uc2V0JywgKHBvcykgLT5cbiAgICAgICAgc2V0UG9zID0gcG9zXG5cbiAgICAgIEBsb2NhdGlvbkZpbmRlci50cmlnZ2VyICdmb3VuZCcsIHsgY29vcmRzOiB7IGxhdGl0dWRlOiAyLCBsb25naXR1ZGU6IDMsIGFjY3VyYWN5OiAxMH19XG4gICAgICBhc3NlcnQuZXF1YWwgc2V0UG9zLmNvb3JkaW5hdGVzWzFdLCAyXG5cbiAgICBpdCAnRGlzcGxheXMgZXJyb3InLCAtPlxuICAgICAgQHVpLmNsaWNrKCdTZXQnKVxuICAgICAgc2V0UG9zID0gbnVsbFxuICAgICAgQGxvY2F0aW9uVmlldy5vbiAnbG9jYXRpb25zZXQnLCAocG9zKSAtPlxuICAgICAgICBzZXRQb3MgPSBwb3NcblxuICAgICAgQGxvY2F0aW9uRmluZGVyLnRyaWdnZXIgJ2Vycm9yJ1xuICAgICAgYXNzZXJ0LmVxdWFsIHNldFBvcywgbnVsbFxuICAgICAgYXNzZXJ0LmluY2x1ZGUoQHVpLnRleHQoKSwgJ0Nhbm5vdCcpXG5cbiAgY29udGV4dCAnV2l0aCBzZXQgbG9jYXRpb24nLCAtPlxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgIEBsb2NhdGlvbkZpbmRlciA9IG5ldyBNb2NrTG9jYXRpb25GaW5kZXIoKVxuICAgICAgQGxvY2F0aW9uVmlldyA9IG5ldyBMb2NhdGlvblZpZXcobG9jOiB7IHR5cGU6IFwiUG9pbnRcIiwgY29vcmRpbmF0ZXM6IFsxMCwgMjBdfSwgbG9jYXRpb25GaW5kZXI6IEBsb2NhdGlvbkZpbmRlcilcbiAgICAgIEB1aSA9IG5ldyBVSURyaXZlcihAbG9jYXRpb25WaWV3LmVsKVxuXG4gICAgaXQgJ2Rpc3BsYXlzIFdhaXRpbmcnLCAtPlxuICAgICAgYXNzZXJ0LmluY2x1ZGUoQHVpLnRleHQoKSwgJ1dhaXRpbmcnKVxuXG4gICAgaXQgJ2Rpc3BsYXlzIHJlbGF0aXZlJywgLT5cbiAgICAgIEBsb2NhdGlvbkZpbmRlci50cmlnZ2VyICdmb3VuZCcsIHsgY29vcmRzOiB7IGxhdGl0dWRlOiAyMSwgbG9uZ2l0dWRlOiAxMCwgYWNjdXJhY3k6IDEwfX1cbiAgICAgIGFzc2VydC5pbmNsdWRlKEB1aS50ZXh0KCksICcxMTEuMmttIFMnKVxuXG4iLCJhc3NlcnQgPSBjaGFpLmFzc2VydFxuTG9jYWxEYiA9IHJlcXVpcmUgXCIuLi9hcHAvanMvZGIvTG9jYWxEYlwiXG5kYl9xdWVyaWVzID0gcmVxdWlyZSBcIi4vZGJfcXVlcmllc1wiXG5cbmRlc2NyaWJlICdMb2NhbERiJywgLT5cbiAgYmVmb3JlIC0+XG4gICAgQGRiID0gbmV3IExvY2FsRGIoJ3Rlc3QnKVxuXG4gIGJlZm9yZUVhY2ggKGRvbmUpIC0+XG4gICAgQGRiLnJlbW92ZUNvbGxlY3Rpb24oJ3Rlc3QnKVxuICAgIEBkYi5hZGRDb2xsZWN0aW9uKCd0ZXN0JylcbiAgICBkb25lKClcblxuICBkZXNjcmliZSBcInBhc3NlcyBxdWVyaWVzXCIsIC0+XG4gICAgZGJfcXVlcmllcy5jYWxsKHRoaXMpXG5cbiAgaXQgJ2NhY2hlcyByb3dzJywgKGRvbmUpIC0+XG4gICAgQGRiLnRlc3QuY2FjaGUgW3sgX2lkOiAxLCBhOiAnYXBwbGUnIH1dLCB7fSwge30sID0+XG4gICAgICBAZGIudGVzdC5maW5kKHt9KS5mZXRjaCAocmVzdWx0cykgLT5cbiAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHNbMF0uYSwgJ2FwcGxlJ1xuICAgICAgICBkb25lKClcblxuICBpdCAnY2FjaGUgb3ZlcndyaXRlIGV4aXN0aW5nJywgKGRvbmUpIC0+XG4gICAgQGRiLnRlc3QuY2FjaGUgW3sgX2lkOiAxLCBhOiAnYXBwbGUnIH1dLCB7fSwge30sID0+XG4gICAgICBAZGIudGVzdC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdiYW5hbmEnIH1dLCB7fSwge30sID0+XG4gICAgICAgIEBkYi50ZXN0LmZpbmQoe30pLmZldGNoIChyZXN1bHRzKSAtPlxuICAgICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzWzBdLmEsICdiYW5hbmEnXG4gICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJjYWNoZSBkb2Vzbid0IG92ZXJ3cml0ZSB1cHNlcnRcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnRlc3QudXBzZXJ0IHsgX2lkOiAxLCBhOiAnYXBwbGUnIH0sID0+XG4gICAgICBAZGIudGVzdC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdiYW5hbmEnIH1dLCB7fSwge30sID0+XG4gICAgICAgIEBkYi50ZXN0LmZpbmQoe30pLmZldGNoIChyZXN1bHRzKSAtPlxuICAgICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzWzBdLmEsICdhcHBsZSdcbiAgICAgICAgICBkb25lKClcblxuICBpdCBcImNhY2hlIGRvZXNuJ3Qgb3ZlcndyaXRlIHJlbW92ZVwiLCAoZG9uZSkgLT5cbiAgICBAZGIudGVzdC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdkZWxldGUnIH1dLCB7fSwge30sID0+XG4gICAgICBAZGIudGVzdC5yZW1vdmUgMSwgPT5cbiAgICAgIEBkYi50ZXN0LmNhY2hlIFt7IF9pZDogMSwgYTogJ2JhbmFuYScgfV0sIHt9LCB7fSwgPT5cbiAgICAgICAgQGRiLnRlc3QuZmluZCh7fSkuZmV0Y2ggKHJlc3VsdHMpIC0+XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHMubGVuZ3RoLCAwXG4gICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJjYWNoZSByZW1vdmVzIG1pc3NpbmcgdW5zb3J0ZWRcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnRlc3QuY2FjaGUgW3sgX2lkOiAxLCBhOiAnYScgfSwgeyBfaWQ6IDIsIGE6ICdiJyB9LCB7IF9pZDogMywgYTogJ2MnIH1dLCB7fSwge30sID0+XG4gICAgICBAZGIudGVzdC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdhJyB9LCB7IF9pZDogMywgYTogJ2MnIH1dLCB7fSwge30sID0+XG4gICAgICAgIEBkYi50ZXN0LmZpbmQoe30pLmZldGNoIChyZXN1bHRzKSAtPlxuICAgICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzLmxlbmd0aCwgMlxuICAgICAgICAgIGRvbmUoKVxuXG4gIGl0IFwiY2FjaGUgcmVtb3ZlcyBtaXNzaW5nIGZpbHRlcmVkXCIsIChkb25lKSAtPlxuICAgIEBkYi50ZXN0LmNhY2hlIFt7IF9pZDogMSwgYTogJ2EnIH0sIHsgX2lkOiAyLCBhOiAnYicgfSwgeyBfaWQ6IDMsIGE6ICdjJyB9XSwge30sIHt9LCA9PlxuICAgICAgQGRiLnRlc3QuY2FjaGUgW3sgX2lkOiAxLCBhOiAnYScgfV0sIHtfaWQ6IHskbHQ6M319LCB7fSwgPT5cbiAgICAgICAgQGRiLnRlc3QuZmluZCh7fSwge3NvcnQ6WydfaWQnXX0pLmZldGNoIChyZXN1bHRzKSAtPlxuICAgICAgICAgIGFzc2VydC5kZWVwRXF1YWwgXy5wbHVjayhyZXN1bHRzLCAnX2lkJyksIFsxLDNdXG4gICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJjYWNoZSByZW1vdmVzIG1pc3Npbmcgc29ydGVkIGxpbWl0ZWRcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnRlc3QuY2FjaGUgW3sgX2lkOiAxLCBhOiAnYScgfSwgeyBfaWQ6IDIsIGE6ICdiJyB9LCB7IF9pZDogMywgYTogJ2MnIH1dLCB7fSwge30sID0+XG4gICAgICBAZGIudGVzdC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdhJyB9XSwge30sIHtzb3J0OlsnX2lkJ10sIGxpbWl0OjJ9LCA9PlxuICAgICAgICBAZGIudGVzdC5maW5kKHt9LCB7c29ydDpbJ19pZCddfSkuZmV0Y2ggKHJlc3VsdHMpIC0+XG4gICAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCBfLnBsdWNrKHJlc3VsdHMsICdfaWQnKSwgWzEsM11cbiAgICAgICAgICBkb25lKClcblxuICBpdCBcImNhY2hlIGRvZXMgbm90IHJlbW92ZSBtaXNzaW5nIHNvcnRlZCBsaW1pdGVkIHBhc3QgZW5kXCIsIChkb25lKSAtPlxuICAgIEBkYi50ZXN0LmNhY2hlIFt7IF9pZDogMSwgYTogJ2EnIH0sIHsgX2lkOiAyLCBhOiAnYicgfSwgeyBfaWQ6IDMsIGE6ICdjJyB9LCB7IF9pZDogNCwgYTogJ2QnIH1dLCB7fSwge30sID0+XG4gICAgICBAZGIudGVzdC5yZW1vdmUgMiwgPT5cbiAgICAgICAgQGRiLnRlc3QuY2FjaGUgW3sgX2lkOiAxLCBhOiAnYScgfSwgeyBfaWQ6IDIsIGE6ICdiJyB9XSwge30sIHtzb3J0OlsnX2lkJ10sIGxpbWl0OjJ9LCA9PlxuICAgICAgICAgIEBkYi50ZXN0LmZpbmQoe30sIHtzb3J0OlsnX2lkJ119KS5mZXRjaCAocmVzdWx0cykgLT5cbiAgICAgICAgICAgIGFzc2VydC5kZWVwRXF1YWwgXy5wbHVjayhyZXN1bHRzLCAnX2lkJyksIFsxLDMsNF1cbiAgICAgICAgICAgIGRvbmUoKVxuXG4gIGl0IFwicmV0dXJucyBwZW5kaW5nIHVwc2VydHNcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnRlc3QuY2FjaGUgW3sgX2lkOiAxLCBhOiAnYXBwbGUnIH1dLCB7fSwge30sID0+XG4gICAgICBAZGIudGVzdC51cHNlcnQgeyBfaWQ6IDIsIGE6ICdiYW5hbmEnIH0sID0+XG4gICAgICAgIEBkYi50ZXN0LnBlbmRpbmdVcHNlcnRzIChyZXN1bHRzKSA9PlxuICAgICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzLmxlbmd0aCwgMVxuICAgICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzWzBdLmEsICdiYW5hbmEnXG4gICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJyZXNvbHZlcyBwZW5kaW5nIHVwc2VydHNcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnRlc3QudXBzZXJ0IHsgX2lkOiAyLCBhOiAnYmFuYW5hJyB9LCA9PlxuICAgICAgQGRiLnRlc3QucmVzb2x2ZVVwc2VydCB7IF9pZDogMiwgYTogJ2JhbmFuYScgfSwgPT5cbiAgICAgICAgQGRiLnRlc3QucGVuZGluZ1Vwc2VydHMgKHJlc3VsdHMpID0+XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHMubGVuZ3RoLCAwXG4gICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJyZXRhaW5zIGNoYW5nZWQgcGVuZGluZyB1cHNlcnRzXCIsIChkb25lKSAtPlxuICAgIEBkYi50ZXN0LnVwc2VydCB7IF9pZDogMiwgYTogJ2JhbmFuYScgfSwgPT5cbiAgICAgIEBkYi50ZXN0LnVwc2VydCB7IF9pZDogMiwgYTogJ2JhbmFuYTInIH0sID0+XG4gICAgICAgIEBkYi50ZXN0LnJlc29sdmVVcHNlcnQgeyBfaWQ6IDIsIGE6ICdiYW5hbmEnIH0sID0+XG4gICAgICAgICAgQGRiLnRlc3QucGVuZGluZ1Vwc2VydHMgKHJlc3VsdHMpID0+XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0cy5sZW5ndGgsIDFcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzWzBdLmEsICdiYW5hbmEyJ1xuICAgICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJyZW1vdmVzIHBlbmRpbmcgdXBzZXJ0c1wiLCAoZG9uZSkgLT5cbiAgICBAZGIudGVzdC51cHNlcnQgeyBfaWQ6IDIsIGE6ICdiYW5hbmEnIH0sID0+XG4gICAgICBAZGIudGVzdC5yZW1vdmUgMiwgPT5cbiAgICAgICAgQGRiLnRlc3QucGVuZGluZ1Vwc2VydHMgKHJlc3VsdHMpID0+XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHMubGVuZ3RoLCAwXG4gICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJyZXR1cm5zIHBlbmRpbmcgcmVtb3Zlc1wiLCAoZG9uZSkgLT5cbiAgICBAZGIudGVzdC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdhcHBsZScgfV0sIHt9LCB7fSwgPT5cbiAgICAgIEBkYi50ZXN0LnJlbW92ZSAxLCA9PlxuICAgICAgICBAZGIudGVzdC5wZW5kaW5nUmVtb3ZlcyAocmVzdWx0cykgPT5cbiAgICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0cy5sZW5ndGgsIDFcbiAgICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0c1swXSwgMVxuICAgICAgICAgIGRvbmUoKVxuXG4gIGl0IFwicmVzb2x2ZXMgcGVuZGluZyByZW1vdmVzXCIsIChkb25lKSAtPlxuICAgIEBkYi50ZXN0LmNhY2hlIFt7IF9pZDogMSwgYTogJ2FwcGxlJyB9XSwge30sIHt9LCA9PlxuICAgICAgQGRiLnRlc3QucmVtb3ZlIDEsID0+XG4gICAgICAgIEBkYi50ZXN0LnJlc29sdmVSZW1vdmUgMSwgPT5cbiAgICAgICAgICBAZGIudGVzdC5wZW5kaW5nUmVtb3ZlcyAocmVzdWx0cykgPT5cbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzLmxlbmd0aCwgMFxuICAgICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJzZWVkc1wiLCAoZG9uZSkgLT5cbiAgICBAZGIudGVzdC5zZWVkIHsgX2lkOiAxLCBhOiAnYXBwbGUnIH0sID0+XG4gICAgICBAZGIudGVzdC5maW5kKHt9KS5mZXRjaCAocmVzdWx0cykgLT5cbiAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHNbMF0uYSwgJ2FwcGxlJ1xuICAgICAgICBkb25lKClcblxuICBpdCBcImRvZXMgbm90IG92ZXJ3cml0ZSBleGlzdGluZ1wiLCAoZG9uZSkgLT5cbiAgICBAZGIudGVzdC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdiYW5hbmEnIH1dLCB7fSwge30sID0+XG4gICAgICBAZGIudGVzdC5zZWVkIHsgX2lkOiAxLCBhOiAnYXBwbGUnIH0sID0+XG4gICAgICAgIEBkYi50ZXN0LmZpbmQoe30pLmZldGNoIChyZXN1bHRzKSAtPlxuICAgICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzWzBdLmEsICdiYW5hbmEnXG4gICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJkb2VzIG5vdCBhZGQgcmVtb3ZlZFwiLCAoZG9uZSkgLT5cbiAgICBAZGIudGVzdC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdhcHBsZScgfV0sIHt9LCB7fSwgPT5cbiAgICAgIEBkYi50ZXN0LnJlbW92ZSAxLCA9PlxuICAgICAgICBAZGIudGVzdC5zZWVkIHsgX2lkOiAxLCBhOiAnYXBwbGUnIH0sID0+XG4gICAgICAgICAgQGRiLnRlc3QuZmluZCh7fSkuZmV0Y2ggKHJlc3VsdHMpIC0+XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0cy5sZW5ndGgsIDBcbiAgICAgICAgICAgIGRvbmUoKVxuXG4gIGl0IFwicmV0YWlucyBpdGVtc1wiLCAoZG9uZSkgLT5cbiAgICBAZGIudGVzdC51cHNlcnQgeyBfaWQ6MSwgYTpcIkFsaWNlXCIgfSwgPT5cbiAgICAgIGRiMiA9IG5ldyBMb2NhbERiKCd0ZXN0JylcbiAgICAgIGRiMi5hZGRDb2xsZWN0aW9uICd0ZXN0J1xuICAgICAgZGIyLnRlc3QuZmluZCh7fSkuZmV0Y2ggKHJlc3VsdHMpIC0+XG4gICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzWzBdLmEsIFwiQWxpY2VcIlxuICAgICAgICBkb25lKClcblxuICBpdCBcInJldGFpbnMgdXBzZXJ0c1wiLCAoZG9uZSkgLT5cbiAgICBAZGIudGVzdC51cHNlcnQgeyBfaWQ6MSwgYTpcIkFsaWNlXCIgfSwgPT5cbiAgICAgIGRiMiA9IG5ldyBMb2NhbERiKCd0ZXN0JylcbiAgICAgIGRiMi5hZGRDb2xsZWN0aW9uICd0ZXN0J1xuICAgICAgZGIyLnRlc3QuZmluZCh7fSkuZmV0Y2ggKHJlc3VsdHMpIC0+XG4gICAgICAgIGRiMi50ZXN0LnBlbmRpbmdVcHNlcnRzICh1cHNlcnRzKSAtPlxuICAgICAgICAgIGFzc2VydC5kZWVwRXF1YWwgcmVzdWx0cywgdXBzZXJ0c1xuICAgICAgICAgIGRvbmUoKVxuXG4gIGl0IFwicmV0YWlucyByZW1vdmVzXCIsIChkb25lKSAtPlxuICAgIEBkYi50ZXN0LnNlZWQgeyBfaWQ6MSwgYTpcIkFsaWNlXCIgfSwgPT5cbiAgICAgIEBkYi50ZXN0LnJlbW92ZSAxLCA9PlxuICAgICAgICBkYjIgPSBuZXcgTG9jYWxEYigndGVzdCcpXG4gICAgICAgIGRiMi5hZGRDb2xsZWN0aW9uICd0ZXN0J1xuICAgICAgICBkYjIudGVzdC5wZW5kaW5nUmVtb3ZlcyAocmVtb3ZlcykgLT5cbiAgICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIHJlbW92ZXMsIFsxXVxuICAgICAgICAgIGRvbmUoKVxuIiwiXG5leHBvcnRzLkRhdGVRdWVzdGlvbiA9IHJlcXVpcmUgJy4vRGF0ZVF1ZXN0aW9uJ1xuXG5leHBvcnRzLlN1cnZleVZpZXcgPSBjbGFzcyBTdXJ2ZXlWaWV3IGV4dGVuZHMgQmFja2JvbmUuVmlld1xuICBpbml0aWFsaXplOiAob3B0aW9ucykgLT5cbiAgICAjIEFkZCB2aWV3cyBhbmQgbGlzdGVuIHRvIGV2ZW50c1xuICAgIGZvciB2aWV3IGluIG9wdGlvbnMudmlld3NcbiAgICAgIEAkZWwuYXBwZW5kKHZpZXcuZWwpO1xuICAgICAgQGxpc3RlblRvIHZpZXcsICdjbG9zZScsID0+XG4gICAgICAgIEB0cmlnZ2VyKCdjbG9zZScpXG4gICAgICBAbGlzdGVuVG8gdmlldywgJ2NvbXBsZXRlJywgPT5cbiAgICAgICAgQHRyaWdnZXIoJ2NvbXBsZXRlJylcblxuICAgICMgQWRkIGxpc3RlbmVyIHRvIG1vZGVsXG4gICAgQGxpc3RlblRvIEBtb2RlbCwgJ2NoYW5nZScsID0+XG4gICAgICBAdHJpZ2dlcignY2hhbmdlJylcblxuICBsb2FkOiAoZGF0YSkgLT5cbiAgICBAbW9kZWwuY2xlYXIoc2lsZW50OnRydWUpXG4gICAgQG1vZGVsLnNldChkYXRhKVxuXG4gIHNhdmU6IC0+XG4gICAgcmV0dXJuIEBtb2RlbC50b0pTT04oKVxuXG5fLmV4dGVuZChleHBvcnRzLCByZXF1aXJlKCcuL2Zvcm0tY29udHJvbHMnKSlcbiIsIlxuIyBUcmFja3MgYSBzZXQgb2YgaXRlbXMgYnkgaWQsIGluZGljYXRpbmcgd2hpY2ggaGF2ZSBiZWVuIGFkZGVkIG9yIHJlbW92ZWQuXG4jIENoYW5nZXMgYXJlIGJvdGggYWRkIGFuZCByZW1vdmVcbmNsYXNzIEl0ZW1UcmFja2VyXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgIEBrZXkgPSAnX2lkJ1xuICAgIEBpdGVtcyA9IHt9XG5cbiAgdXBkYXRlOiAoaXRlbXMpIC0+ICAgICMgUmV0dXJuIFtbYWRkZWRdLFtyZW1vdmVkXV0gaXRlbXNcbiAgICBhZGRzID0gW11cbiAgICByZW1vdmVzID0gW11cblxuICAgICMgQWRkIGFueSBuZXcgb25lc1xuICAgIGZvciBpdGVtIGluIGl0ZW1zXG4gICAgICBpZiBub3QgXy5oYXMoQGl0ZW1zLCBpdGVtW0BrZXldKVxuICAgICAgICBhZGRzLnB1c2goaXRlbSlcblxuICAgICMgQ3JlYXRlIG1hcCBvZiBpdGVtcyBwYXJhbWV0ZXJcbiAgICBtYXAgPSBfLm9iamVjdChfLnBsdWNrKGl0ZW1zLCBAa2V5KSwgaXRlbXMpXG5cbiAgICAjIEZpbmQgcmVtb3Zlc1xuICAgIGZvciBrZXksIHZhbHVlIG9mIEBpdGVtc1xuICAgICAgaWYgbm90IF8uaGFzKG1hcCwga2V5KVxuICAgICAgICByZW1vdmVzLnB1c2godmFsdWUpXG4gICAgICBlbHNlIGlmIG5vdCBfLmlzRXF1YWwodmFsdWUsIG1hcFtrZXldKVxuICAgICAgICBhZGRzLnB1c2gobWFwW2tleV0pXG4gICAgICAgIHJlbW92ZXMucHVzaCh2YWx1ZSlcblxuICAgIGZvciBpdGVtIGluIHJlbW92ZXNcbiAgICAgIGRlbGV0ZSBAaXRlbXNbaXRlbVtAa2V5XV1cblxuICAgIGZvciBpdGVtIGluIGFkZHNcbiAgICAgIEBpdGVtc1tpdGVtW0BrZXldXSA9IGl0ZW1cblxuICAgIHJldHVybiBbYWRkcywgcmVtb3Zlc11cblxubW9kdWxlLmV4cG9ydHMgPSBJdGVtVHJhY2tlciIsIiMgR2VvSlNPTiBoZWxwZXIgcm91dGluZXNcblxuIyBDb252ZXJ0cyBuYXZpZ2F0b3IgcG9zaXRpb24gdG8gcG9pbnRcbmV4cG9ydHMucG9zVG9Qb2ludCA9IChwb3MpIC0+XG4gIHJldHVybiB7XG4gICAgdHlwZTogJ1BvaW50J1xuICAgIGNvb3JkaW5hdGVzOiBbcG9zLmNvb3Jkcy5sb25naXR1ZGUsIHBvcy5jb29yZHMubGF0aXR1ZGVdXG4gIH1cblxuXG5leHBvcnRzLmxhdExuZ0JvdW5kc1RvR2VvSlNPTiA9IChib3VuZHMpIC0+XG4gIHN3ID0gYm91bmRzLmdldFNvdXRoV2VzdCgpXG4gIG5lID0gYm91bmRzLmdldE5vcnRoRWFzdCgpXG4gIHJldHVybiB7XG4gICAgdHlwZTogJ1BvbHlnb24nLFxuICAgIGNvb3JkaW5hdGVzOiBbXG4gICAgICBbW3N3LmxuZywgc3cubGF0XSwgXG4gICAgICBbc3cubG5nLCBuZS5sYXRdLCBcbiAgICAgIFtuZS5sbmcsIG5lLmxhdF0sIFxuICAgICAgW25lLmxuZywgc3cubGF0XV1cbiAgICBdXG4gIH1cblxuIyBUT0RPOiBvbmx5IHdvcmtzIHdpdGggYm91bmRzXG5leHBvcnRzLnBvaW50SW5Qb2x5Z29uID0gKHBvaW50LCBwb2x5Z29uKSAtPlxuICAjIEdldCBib3VuZHNcbiAgYm91bmRzID0gbmV3IEwuTGF0TG5nQm91bmRzKF8ubWFwKHBvbHlnb24uY29vcmRpbmF0ZXNbMF0sIChjb29yZCkgLT4gbmV3IEwuTGF0TG5nKGNvb3JkWzFdLCBjb29yZFswXSkpKVxuICByZXR1cm4gYm91bmRzLmNvbnRhaW5zKG5ldyBMLkxhdExuZyhwb2ludC5jb29yZGluYXRlc1sxXSwgcG9pbnQuY29vcmRpbmF0ZXNbMF0pKVxuXG5leHBvcnRzLmdldFJlbGF0aXZlTG9jYXRpb24gPSAoZnJvbSwgdG8pIC0+XG4gIHgxID0gZnJvbS5jb29yZGluYXRlc1swXVxuICB5MSA9IGZyb20uY29vcmRpbmF0ZXNbMV1cbiAgeDIgPSB0by5jb29yZGluYXRlc1swXVxuICB5MiA9IHRvLmNvb3JkaW5hdGVzWzFdXG4gIFxuICAjIENvbnZlcnQgdG8gcmVsYXRpdmUgcG9zaXRpb24gKGFwcHJveGltYXRlKVxuICBkeSA9ICh5MiAtIHkxKSAvIDU3LjMgKiA2MzcxMDAwXG4gIGR4ID0gTWF0aC5jb3MoeTEgLyA1Ny4zKSAqICh4MiAtIHgxKSAvIDU3LjMgKiA2MzcxMDAwXG4gIFxuICAjIERldGVybWluZSBkaXJlY3Rpb24gYW5kIGFuZ2xlXG4gIGRpc3QgPSBNYXRoLnNxcnQoZHggKiBkeCArIGR5ICogZHkpXG4gIGFuZ2xlID0gOTAgLSAoTWF0aC5hdGFuMihkeSwgZHgpICogNTcuMylcbiAgYW5nbGUgKz0gMzYwIGlmIGFuZ2xlIDwgMFxuICBhbmdsZSAtPSAzNjAgaWYgYW5nbGUgPiAzNjBcbiAgXG4gICMgR2V0IGFwcHJveGltYXRlIGRpcmVjdGlvblxuICBjb21wYXNzRGlyID0gKE1hdGguZmxvb3IoKGFuZ2xlICsgMjIuNSkgLyA0NSkpICUgOFxuICBjb21wYXNzU3RycyA9IFtcIk5cIiwgXCJORVwiLCBcIkVcIiwgXCJTRVwiLCBcIlNcIiwgXCJTV1wiLCBcIldcIiwgXCJOV1wiXVxuICBpZiBkaXN0ID4gMTAwMFxuICAgIChkaXN0IC8gMTAwMCkudG9GaXhlZCgxKSArIFwia20gXCIgKyBjb21wYXNzU3Ryc1tjb21wYXNzRGlyXVxuICBlbHNlXG4gICAgKGRpc3QpLnRvRml4ZWQoMCkgKyBcIm0gXCIgKyBjb21wYXNzU3Ryc1tjb21wYXNzRGlyXSIsImFzc2VydCA9IGNoYWkuYXNzZXJ0XG5cbmNsYXNzIFVJRHJpdmVyXG4gIGNvbnN0cnVjdG9yOiAoZWwpIC0+XG4gICAgQGVsID0gJChlbClcblxuICBnZXREaXNhYmxlZDogKHN0cikgLT5cbiAgICBmb3IgaXRlbSBpbiBAZWwuZmluZChcImEsYnV0dG9uXCIpXG4gICAgICBpZiAkKGl0ZW0pLnRleHQoKS5pbmRleE9mKHN0cikgIT0gLTFcbiAgICAgICAgcmV0dXJuICQoaXRlbSkuaXMoXCI6ZGlzYWJsZWRcIilcbiAgICBhc3NlcnQuZmFpbChudWxsLCBzdHIsIFwiQ2FuJ3QgZmluZDogXCIgKyBzdHIpXG5cbiAgY2xpY2s6IChzdHIpIC0+XG4gICAgZm9yIGl0ZW0gaW4gQGVsLmZpbmQoXCJhLGJ1dHRvblwiKVxuICAgICAgaWYgJChpdGVtKS50ZXh0KCkuaW5kZXhPZihzdHIpICE9IC0xXG4gICAgICAgIGNvbnNvbGUubG9nIFwiQ2xpY2tpbmc6IFwiICsgJChpdGVtKS50ZXh0KClcbiAgICAgICAgJChpdGVtKS50cmlnZ2VyKFwiY2xpY2tcIilcbiAgICAgICAgcmV0dXJuXG4gICAgYXNzZXJ0LmZhaWwobnVsbCwgc3RyLCBcIkNhbid0IGZpbmQ6IFwiICsgc3RyKVxuICBcbiAgZmlsbDogKHN0ciwgdmFsdWUpIC0+XG4gICAgZm9yIGl0ZW0gaW4gQGVsLmZpbmQoXCJsYWJlbFwiKVxuICAgICAgaWYgJChpdGVtKS50ZXh0KCkuaW5kZXhPZihzdHIpICE9IC0xXG4gICAgICAgIGJveCA9IEBlbC5maW5kKFwiI1wiKyQoaXRlbSkuYXR0cignZm9yJykpXG4gICAgICAgIGJveC52YWwodmFsdWUpXG4gIFxuICB0ZXh0OiAtPlxuICAgIHJldHVybiBAZWwudGV4dCgpXG4gICAgICBcbiAgd2FpdDogKGFmdGVyKSAtPlxuICAgIHNldFRpbWVvdXQgYWZ0ZXIsIDEwXG5cbm1vZHVsZS5leHBvcnRzID0gVUlEcml2ZXIiLCJhc3NlcnQgPSBjaGFpLmFzc2VydFxuXG5HZW9KU09OID0gcmVxdWlyZSAnLi4vYXBwL2pzL0dlb0pTT04nXG5cbm1vZHVsZS5leHBvcnRzID0gLT5cbiAgY29udGV4dCAnV2l0aCBzYW1wbGUgcm93cycsIC0+XG4gICAgYmVmb3JlRWFjaCAoZG9uZSkgLT5cbiAgICAgIEBkYi50ZXN0LnVwc2VydCB7IF9pZDoxLCBhOlwiQWxpY2VcIiB9LCA9PlxuICAgICAgICBAZGIudGVzdC51cHNlcnQgeyBfaWQ6MiwgYTpcIkNoYXJsaWVcIiB9LCA9PlxuICAgICAgICAgIEBkYi50ZXN0LnVwc2VydCB7IF9pZDozLCBhOlwiQm9iXCIgfSwgPT5cbiAgICAgICAgICAgIGRvbmUoKVxuXG4gICAgaXQgJ2ZpbmRzIGFsbCByb3dzJywgKGRvbmUpIC0+XG4gICAgICBAZGIudGVzdC5maW5kKHt9KS5mZXRjaCAocmVzdWx0cykgPT5cbiAgICAgICAgYXNzZXJ0LmVxdWFsIDMsIHJlc3VsdHMubGVuZ3RoXG4gICAgICAgIGRvbmUoKVxuXG4gICAgaXQgJ2ZpbmRzIGFsbCByb3dzIHdpdGggb3B0aW9ucycsIChkb25lKSAtPlxuICAgICAgQGRiLnRlc3QuZmluZCh7fSwge30pLmZldGNoIChyZXN1bHRzKSA9PlxuICAgICAgICBhc3NlcnQuZXF1YWwgMywgcmVzdWx0cy5sZW5ndGhcbiAgICAgICAgZG9uZSgpXG5cbiAgICBpdCAnZmlsdGVycyByb3dzIGJ5IGlkJywgKGRvbmUpIC0+XG4gICAgICBAZGIudGVzdC5maW5kKHsgX2lkOiAxIH0pLmZldGNoIChyZXN1bHRzKSA9PlxuICAgICAgICBhc3NlcnQuZXF1YWwgMSwgcmVzdWx0cy5sZW5ndGhcbiAgICAgICAgYXNzZXJ0LmVxdWFsICdBbGljZScsIHJlc3VsdHNbMF0uYVxuICAgICAgICBkb25lKClcblxuICAgIGl0ICdmaW5kcyBvbmUgcm93JywgKGRvbmUpIC0+XG4gICAgICBAZGIudGVzdC5maW5kT25lIHsgX2lkOiAyIH0sIChyZXN1bHQpID0+XG4gICAgICAgIGFzc2VydC5lcXVhbCAnQ2hhcmxpZScsIHJlc3VsdC5hXG4gICAgICAgIGRvbmUoKVxuXG4gICAgaXQgJ3JlbW92ZXMgaXRlbScsIChkb25lKSAtPlxuICAgICAgQGRiLnRlc3QucmVtb3ZlIDIsID0+XG4gICAgICAgIEBkYi50ZXN0LmZpbmQoe30pLmZldGNoIChyZXN1bHRzKSA9PlxuICAgICAgICAgIGFzc2VydC5lcXVhbCAyLCByZXN1bHRzLmxlbmd0aFxuICAgICAgICAgIGFzc2VydCAxIGluIChyZXN1bHQuX2lkIGZvciByZXN1bHQgaW4gcmVzdWx0cylcbiAgICAgICAgICBhc3NlcnQgMiBub3QgaW4gKHJlc3VsdC5faWQgZm9yIHJlc3VsdCBpbiByZXN1bHRzKVxuICAgICAgICAgIGRvbmUoKVxuXG4gICAgaXQgJ3JlbW92ZXMgbm9uLWV4aXN0ZW50IGl0ZW0nLCAoZG9uZSkgLT5cbiAgICAgIEBkYi50ZXN0LnJlbW92ZSA5OTksID0+XG4gICAgICAgIEBkYi50ZXN0LmZpbmQoe30pLmZldGNoIChyZXN1bHRzKSA9PlxuICAgICAgICAgIGFzc2VydC5lcXVhbCAzLCByZXN1bHRzLmxlbmd0aFxuICAgICAgICAgIGRvbmUoKVxuXG4gICAgaXQgJ3NvcnRzIGFzY2VuZGluZycsIChkb25lKSAtPlxuICAgICAgQGRiLnRlc3QuZmluZCh7fSwge3NvcnQ6IFsnYSddfSkuZmV0Y2ggKHJlc3VsdHMpID0+XG4gICAgICAgIGFzc2VydC5kZWVwRXF1YWwgXy5wbHVjayhyZXN1bHRzLCAnX2lkJyksIFsxLDMsMl1cbiAgICAgICAgZG9uZSgpXG5cbiAgICBpdCAnc29ydHMgZGVzY2VuZGluZycsIChkb25lKSAtPlxuICAgICAgQGRiLnRlc3QuZmluZCh7fSwge3NvcnQ6IFtbJ2EnLCdkZXNjJ11dfSkuZmV0Y2ggKHJlc3VsdHMpID0+XG4gICAgICAgIGFzc2VydC5kZWVwRXF1YWwgXy5wbHVjayhyZXN1bHRzLCAnX2lkJyksIFsyLDMsMV1cbiAgICAgICAgZG9uZSgpXG5cbiAgICBpdCAnbGltaXRzJywgKGRvbmUpIC0+XG4gICAgICBAZGIudGVzdC5maW5kKHt9LCB7c29ydDogWydhJ10sIGxpbWl0OjJ9KS5mZXRjaCAocmVzdWx0cykgPT5cbiAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCBfLnBsdWNrKHJlc3VsdHMsICdfaWQnKSwgWzEsM11cbiAgICAgICAgZG9uZSgpXG5cbiAgICBpdCAnZmV0Y2hlcyBpbmRlcGVuZGVudCBjb3BpZXMnLCAoZG9uZSkgLT5cbiAgICAgIEBkYi50ZXN0LmZpbmRPbmUgeyBfaWQ6IDIgfSwgKHJlc3VsdCkgPT5cbiAgICAgICAgcmVzdWx0LmEgPSAnRGF2aWQnXG4gICAgICAgIEBkYi50ZXN0LmZpbmRPbmUgeyBfaWQ6IDIgfSwgKHJlc3VsdCkgPT5cbiAgICAgICAgICBhc3NlcnQuZXF1YWwgJ0NoYXJsaWUnLCByZXN1bHQuYVxuICAgICAgICAgIGRvbmUoKVxuXG4gIGl0ICdhZGRzIF9pZCB0byByb3dzJywgKGRvbmUpIC0+XG4gICAgQGRiLnRlc3QudXBzZXJ0IHsgYTogMSB9LCAoaXRlbSkgPT5cbiAgICAgIGFzc2VydC5wcm9wZXJ0eSBpdGVtLCAnX2lkJ1xuICAgICAgYXNzZXJ0Lmxlbmd0aE9mIGl0ZW0uX2lkLCAzMlxuICAgICAgZG9uZSgpXG5cbiAgaXQgJ3VwZGF0ZXMgYnkgaWQnLCAoZG9uZSkgLT5cbiAgICBAZGIudGVzdC51cHNlcnQgeyBfaWQ6MSwgYToxIH0sIChpdGVtKSA9PlxuICAgICAgQGRiLnRlc3QudXBzZXJ0IHsgX2lkOjEsIGE6MiB9LCAoaXRlbSkgPT5cbiAgICAgICAgYXNzZXJ0LmVxdWFsIGl0ZW0uYSwgMlxuICBcbiAgICAgICAgQGRiLnRlc3QuZmluZCh7fSkuZmV0Y2ggKHJlc3VsdHMpID0+XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsIDEsIHJlc3VsdHMubGVuZ3RoXG4gICAgICAgICAgZG9uZSgpXG5cblxuICBnZW9wb2ludCA9IChsbmcsIGxhdCkgLT5cbiAgICByZXR1cm4ge1xuICAgICAgICB0eXBlOiAnUG9pbnQnXG4gICAgICAgIGNvb3JkaW5hdGVzOiBbbG5nLCBsYXRdXG4gICAgfVxuXG4gIGNvbnRleHQgJ1dpdGggZ2VvbG9jYXRlZCByb3dzJywgLT5cbiAgICBiZWZvcmVFYWNoIChkb25lKSAtPlxuICAgICAgQGRiLnRlc3QudXBzZXJ0IHsgX2lkOjEsIGxvYzpnZW9wb2ludCg5MCwgNDUpIH0sID0+XG4gICAgICAgIEBkYi50ZXN0LnVwc2VydCB7IF9pZDoyLCBsb2M6Z2VvcG9pbnQoOTAsIDQ2KSB9LCA9PlxuICAgICAgICAgIEBkYi50ZXN0LnVwc2VydCB7IF9pZDozLCBsb2M6Z2VvcG9pbnQoOTEsIDQ1KSB9LCA9PlxuICAgICAgICAgICAgQGRiLnRlc3QudXBzZXJ0IHsgX2lkOjQsIGxvYzpnZW9wb2ludCg5MSwgNDYpIH0sID0+XG4gICAgICAgICAgICAgIGRvbmUoKVxuXG4gICAgaXQgJ2ZpbmRzIHBvaW50cyBuZWFyJywgKGRvbmUpIC0+XG4gICAgICBzZWxlY3RvciA9IGxvYzogXG4gICAgICAgICRuZWFyOiBcbiAgICAgICAgICAkZ2VvbWV0cnk6IGdlb3BvaW50KDkwLCA0NSlcblxuICAgICAgQGRiLnRlc3QuZmluZChzZWxlY3RvcikuZmV0Y2ggKHJlc3VsdHMpID0+XG4gICAgICAgIGFzc2VydC5kZWVwRXF1YWwgXy5wbHVjayhyZXN1bHRzLCAnX2lkJyksIFsxLDMsMiw0XVxuICAgICAgICBkb25lKClcblxuICAgIGl0ICdmaW5kcyBwb2ludHMgbmVhciBtYXhEaXN0YW5jZScsIChkb25lKSAtPlxuICAgICAgc2VsZWN0b3IgPSBsb2M6IFxuICAgICAgICAkbmVhcjogXG4gICAgICAgICAgJGdlb21ldHJ5OiBnZW9wb2ludCg5MCwgNDUpXG4gICAgICAgICAgJG1heERpc3RhbmNlOiAxMTEwMDBcblxuICAgICAgQGRiLnRlc3QuZmluZChzZWxlY3RvcikuZmV0Y2ggKHJlc3VsdHMpID0+XG4gICAgICAgIGFzc2VydC5kZWVwRXF1YWwgXy5wbHVjayhyZXN1bHRzLCAnX2lkJyksIFsxLDNdXG4gICAgICAgIGRvbmUoKSAgICAgIFxuXG4gICAgaXQgJ2ZpbmRzIHBvaW50cyBuZWFyIG1heERpc3RhbmNlIGp1c3QgYWJvdmUnLCAoZG9uZSkgLT5cbiAgICAgIHNlbGVjdG9yID0gbG9jOiBcbiAgICAgICAgJG5lYXI6IFxuICAgICAgICAgICRnZW9tZXRyeTogZ2VvcG9pbnQoOTAsIDQ1KVxuICAgICAgICAgICRtYXhEaXN0YW5jZTogMTEyMDAwXG5cbiAgICAgIEBkYi50ZXN0LmZpbmQoc2VsZWN0b3IpLmZldGNoIChyZXN1bHRzKSA9PlxuICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIF8ucGx1Y2socmVzdWx0cywgJ19pZCcpLCBbMSwzLDJdXG4gICAgICAgIGRvbmUoKVxuXG4gICAgaXQgJ2ZpbmRzIHBvaW50cyB3aXRoaW4gc2ltcGxlIGJveCcsIChkb25lKSAtPlxuICAgICAgc2VsZWN0b3IgPSBsb2M6IFxuICAgICAgICAkZ2VvSW50ZXJzZWN0czogXG4gICAgICAgICAgJGdlb21ldHJ5OiBcbiAgICAgICAgICAgIHR5cGU6ICdQb2x5Z29uJ1xuICAgICAgICAgICAgY29vcmRpbmF0ZXM6IFtbXG4gICAgICAgICAgICAgIFs4OS41LCA0NS41XSwgWzg5LjUsIDQ2LjVdLCBbOTAuNSwgNDYuNV0sIFs5MC41LCA0NS41XVxuICAgICAgICAgICAgXV1cbiAgICAgIEBkYi50ZXN0LmZpbmQoc2VsZWN0b3IpLmZldGNoIChyZXN1bHRzKSA9PlxuICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIF8ucGx1Y2socmVzdWx0cywgJ19pZCcpLCBbMl1cbiAgICAgICAgZG9uZSgpXG5cbiAgICBpdCAnaGFuZGxlcyB1bmRlZmluZWQnLCAoZG9uZSkgLT5cbiAgICAgIHNlbGVjdG9yID0gbG9jOiBcbiAgICAgICAgJGdlb0ludGVyc2VjdHM6IFxuICAgICAgICAgICRnZW9tZXRyeTogXG4gICAgICAgICAgICB0eXBlOiAnUG9seWdvbidcbiAgICAgICAgICAgIGNvb3JkaW5hdGVzOiBbW1xuICAgICAgICAgICAgICBbODkuNSwgNDUuNV0sIFs4OS41LCA0Ni41XSwgWzkwLjUsIDQ2LjVdLCBbOTAuNSwgNDUuNV1cbiAgICAgICAgICAgIF1dXG4gICAgICBAZGIudGVzdC51cHNlcnQgeyBfaWQ6NSB9LCA9PlxuICAgICAgICBAZGIudGVzdC5maW5kKHNlbGVjdG9yKS5mZXRjaCAocmVzdWx0cykgPT5cbiAgICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIF8ucGx1Y2socmVzdWx0cywgJ19pZCcpLCBbMl1cbiAgICAgICAgICBkb25lKClcblxuXG4iLCJMb2NhdGlvbkZpbmRlciA9IHJlcXVpcmUgJy4vTG9jYXRpb25GaW5kZXInXG5HZW9KU09OID0gcmVxdWlyZSAnLi9HZW9KU09OJ1xuXG4jIFNob3dzIHRoZSByZWxhdGl2ZSBsb2NhdGlvbiBvZiBhIHBvaW50IGFuZCBhbGxvd3Mgc2V0dGluZyBpdFxuY2xhc3MgTG9jYXRpb25WaWV3IGV4dGVuZHMgQmFja2JvbmUuVmlld1xuICBjb25zdHJ1Y3RvcjogKG9wdGlvbnMpIC0+XG4gICAgc3VwZXIoKVxuICAgIEBsb2MgPSBvcHRpb25zLmxvY1xuICAgIEBzZXR0aW5nTG9jYXRpb24gPSBmYWxzZVxuICAgIEBsb2NhdGlvbkZpbmRlciA9IG9wdGlvbnMubG9jYXRpb25GaW5kZXIgfHwgbmV3IExvY2F0aW9uRmluZGVyKClcblxuICAgICMgTGlzdGVuIHRvIGxvY2F0aW9uIGV2ZW50c1xuICAgIEBsaXN0ZW5UbyhAbG9jYXRpb25GaW5kZXIsICdmb3VuZCcsIEBsb2NhdGlvbkZvdW5kKVxuICAgIEBsaXN0ZW5UbyhAbG9jYXRpb25GaW5kZXIsICdlcnJvcicsIEBsb2NhdGlvbkVycm9yKVxuXG4gICAgIyBTdGFydCB0cmFja2luZyBsb2NhdGlvbiBpZiBzZXRcbiAgICBpZiBAbG9jXG4gICAgICBAbG9jYXRpb25GaW5kZXIuc3RhcnRXYXRjaCgpXG5cbiAgICBAcmVuZGVyKClcblxuICBldmVudHM6XG4gICAgJ2NsaWNrICNsb2NhdGlvbl9tYXAnIDogJ21hcENsaWNrZWQnXG4gICAgJ2NsaWNrICNsb2NhdGlvbl9zZXQnIDogJ3NldExvY2F0aW9uJ1xuXG4gIHJlbW92ZTogLT5cbiAgICBAbG9jYXRpb25GaW5kZXIuc3RvcFdhdGNoKClcbiAgICBzdXBlcigpXG5cbiAgcmVuZGVyOiAtPlxuICAgIEAkZWwuaHRtbCB0ZW1wbGF0ZXNbJ0xvY2F0aW9uVmlldyddKClcblxuICAgICMgU2V0IGxvY2F0aW9uIHN0cmluZ1xuICAgIGlmIEBlcnJvckZpbmRpbmdMb2NhdGlvblxuICAgICAgQCQoXCIjbG9jYXRpb25fcmVsYXRpdmVcIikudGV4dChcIkNhbm5vdCBmaW5kIGxvY2F0aW9uXCIpXG4gICAgZWxzZSBpZiBub3QgQGxvYyBhbmQgbm90IEBzZXR0aW5nTG9jYXRpb24gXG4gICAgICBAJChcIiNsb2NhdGlvbl9yZWxhdGl2ZVwiKS50ZXh0KFwiVW5zcGVjaWZpZWQgbG9jYXRpb25cIilcbiAgICBlbHNlIGlmIEBzZXR0aW5nTG9jYXRpb25cbiAgICAgIEAkKFwiI2xvY2F0aW9uX3JlbGF0aXZlXCIpLnRleHQoXCJTZXR0aW5nIGxvY2F0aW9uLi4uXCIpXG4gICAgZWxzZSBpZiBub3QgQGN1cnJlbnRMb2NcbiAgICAgIEAkKFwiI2xvY2F0aW9uX3JlbGF0aXZlXCIpLnRleHQoXCJXYWl0aW5nIGZvciBHUFMuLi5cIilcbiAgICBlbHNlXG4gICAgICBAJChcIiNsb2NhdGlvbl9yZWxhdGl2ZVwiKS50ZXh0KEdlb0pTT04uZ2V0UmVsYXRpdmVMb2NhdGlvbihAY3VycmVudExvYywgQGxvYykpXG5cbiAgICAjIERpc2FibGUgbWFwIGlmIGxvY2F0aW9uIG5vdCBzZXRcbiAgICBAJChcIiNsb2NhdGlvbl9tYXBcIikuYXR0cihcImRpc2FibGVkXCIsIG5vdCBAbG9jKTtcblxuICAgICMgRGlzYWJsZSBzZXQgaWYgc2V0dGluZ1xuICAgIEAkKFwiI2xvY2F0aW9uX3NldFwiKS5hdHRyKFwiZGlzYWJsZWRcIiwgQHNldHRpbmdMb2NhdGlvbiA9PSB0cnVlKTsgICAgXG5cbiAgc2V0TG9jYXRpb246IC0+XG4gICAgQHNldHRpbmdMb2NhdGlvbiA9IHRydWVcbiAgICBAZXJyb3JGaW5kaW5nTG9jYXRpb24gPSBmYWxzZVxuICAgIEBsb2NhdGlvbkZpbmRlci5zdGFydFdhdGNoKClcbiAgICBAcmVuZGVyKClcblxuICBsb2NhdGlvbkZvdW5kOiAocG9zKSA9PlxuICAgIGlmIEBzZXR0aW5nTG9jYXRpb25cbiAgICAgIEBzZXR0aW5nTG9jYXRpb24gPSBmYWxzZVxuICAgICAgQGVycm9yRmluZGluZ0xvY2F0aW9uID0gZmFsc2VcblxuICAgICAgIyBTZXQgbG9jYXRpb25cbiAgICAgIEBsb2MgPSBHZW9KU09OLnBvc1RvUG9pbnQocG9zKVxuICAgICAgQHRyaWdnZXIoJ2xvY2F0aW9uc2V0JywgQGxvYylcblxuICAgIEBjdXJyZW50TG9jID0gR2VvSlNPTi5wb3NUb1BvaW50KHBvcylcbiAgICBAcmVuZGVyKClcblxuICBsb2NhdGlvbkVycm9yOiA9PlxuICAgIEBzZXR0aW5nTG9jYXRpb24gPSBmYWxzZVxuICAgIEBlcnJvckZpbmRpbmdMb2NhdGlvbiA9IHRydWVcbiAgICBAcmVuZGVyKClcblxuXG5tb2R1bGUuZXhwb3J0cyA9IExvY2F0aW9uVmlldyIsImNvbXBpbGVEb2N1bWVudFNlbGVjdG9yID0gcmVxdWlyZSgnLi9zZWxlY3RvcicpLmNvbXBpbGVEb2N1bWVudFNlbGVjdG9yXG5jb21waWxlU29ydCA9IHJlcXVpcmUoJy4vc2VsZWN0b3InKS5jb21waWxlU29ydFxuR2VvSlNPTiA9IHJlcXVpcmUgJy4uL0dlb0pTT04nXG5cbmNsYXNzIExvY2FsRGJcbiAgY29uc3RydWN0b3I6IChuYW1lKSAtPlxuICAgIEBuYW1lID0gbmFtZVxuICAgIEBjb2xsZWN0aW9ucyA9IHt9XG5cbiAgYWRkQ29sbGVjdGlvbjogKG5hbWUpIC0+XG4gICAgZGJOYW1lID0gQG5hbWVcbiAgICBuYW1lc3BhY2UgPSBcImRiLiN7ZGJOYW1lfS4je25hbWV9LlwiXG5cbiAgICBjb2xsZWN0aW9uID0gbmV3IENvbGxlY3Rpb24obmFtZSwgbmFtZXNwYWNlKVxuICAgIEBbbmFtZV0gPSBjb2xsZWN0aW9uXG4gICAgQGNvbGxlY3Rpb25zW25hbWVdID0gY29sbGVjdGlvblxuXG4gIHJlbW92ZUNvbGxlY3Rpb246IChuYW1lKSAtPlxuICAgIGRiTmFtZSA9IEBuYW1lXG4gICAgbmFtZXNwYWNlID0gXCJkYi4je2RiTmFtZX0uI3tuYW1lfS5cIlxuXG4gICAgaWYgd2luZG93LmxvY2FsU3RvcmFnZVxuICAgICAga2V5cyA9IFtdXG4gICAgICBmb3IgaSBpbiBbMC4uLmxvY2FsU3RvcmFnZS5sZW5ndGhdXG4gICAgICAgIGtleXMucHVzaChsb2NhbFN0b3JhZ2Uua2V5KGkpKVxuXG4gICAgICBmb3Iga2V5IGluIGtleXNcbiAgICAgICAgaWYga2V5LnN1YnN0cmluZygwLCBuYW1lc3BhY2UubGVuZ3RoKSA9PSBuYW1lc3BhY2VcbiAgICAgICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbShrZXkpXG5cbiAgICBkZWxldGUgQFtuYW1lXVxuICAgIGRlbGV0ZSBAY29sbGVjdGlvbnNbbmFtZV1cblxuXG4jIFN0b3JlcyBkYXRhIGluIG1lbW9yeSwgYmFja2VkIGJ5IGxvY2FsIHN0b3JhZ2VcbmNsYXNzIENvbGxlY3Rpb25cbiAgY29uc3RydWN0b3I6IChuYW1lLCBuYW1lc3BhY2UpIC0+XG4gICAgQG5hbWUgPSBuYW1lXG4gICAgQG5hbWVzcGFjZSA9IG5hbWVzcGFjZVxuXG4gICAgQGl0ZW1zID0ge31cbiAgICBAdXBzZXJ0cyA9IHt9ICAjIFBlbmRpbmcgdXBzZXJ0cyBieSBfaWQuIFN0aWxsIGluIGl0ZW1zXG4gICAgQHJlbW92ZXMgPSB7fSAgIyBQZW5kaW5nIHJlbW92ZXMgYnkgX2lkLiBObyBsb25nZXIgaW4gaXRlbXNcblxuICAgICMgUmVhZCBmcm9tIGxvY2FsIHN0b3JhZ2VcbiAgICBpZiB3aW5kb3cubG9jYWxTdG9yYWdlXG4gICAgICBAbG9hZFN0b3JhZ2UoKVxuXG4gIGxvYWRTdG9yYWdlOiAtPlxuICAgICMgUmVhZCBpdGVtcyBmcm9tIGxvY2FsU3RvcmFnZVxuICAgIEBpdGVtTmFtZXNwYWNlID0gQG5hbWVzcGFjZSArIFwiX1wiXG5cbiAgICBmb3IgaSBpbiBbMC4uLmxvY2FsU3RvcmFnZS5sZW5ndGhdXG4gICAgICBrZXkgPSBsb2NhbFN0b3JhZ2Uua2V5KGkpXG4gICAgICBpZiBrZXkuc3Vic3RyaW5nKDAsIEBpdGVtTmFtZXNwYWNlLmxlbmd0aCkgPT0gQGl0ZW1OYW1lc3BhY2VcbiAgICAgICAgaXRlbSA9IEpTT04ucGFyc2UobG9jYWxTdG9yYWdlW2tleV0pXG4gICAgICAgIEBpdGVtc1tpdGVtLl9pZF0gPSBpdGVtXG5cbiAgICAjIFJlYWQgdXBzZXJ0c1xuICAgIHVwc2VydEtleXMgPSBpZiBsb2NhbFN0b3JhZ2VbQG5hbWVzcGFjZStcInVwc2VydHNcIl0gdGhlbiBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZVtAbmFtZXNwYWNlK1widXBzZXJ0c1wiXSkgZWxzZSBbXVxuICAgIGZvciBrZXkgaW4gdXBzZXJ0S2V5c1xuICAgICAgQHVwc2VydHNba2V5XSA9IEBpdGVtc1trZXldXG5cbiAgICAjIFJlYWQgcmVtb3Zlc1xuICAgIHJlbW92ZUl0ZW1zID0gaWYgbG9jYWxTdG9yYWdlW0BuYW1lc3BhY2UrXCJyZW1vdmVzXCJdIHRoZW4gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2VbQG5hbWVzcGFjZStcInJlbW92ZXNcIl0pIGVsc2UgW11cbiAgICBAcmVtb3ZlcyA9IF8ub2JqZWN0KF8ucGx1Y2socmVtb3ZlSXRlbXMsIFwiX2lkXCIpLCByZW1vdmVJdGVtcylcblxuICBmaW5kOiAoc2VsZWN0b3IsIG9wdGlvbnMpIC0+XG4gICAgcmV0dXJuIGZldGNoOiAoc3VjY2VzcywgZXJyb3IpID0+XG4gICAgICBAX2ZpbmRGZXRjaChzZWxlY3Rvciwgb3B0aW9ucywgc3VjY2VzcywgZXJyb3IpXG5cbiAgZmluZE9uZTogKHNlbGVjdG9yLCBvcHRpb25zLCBzdWNjZXNzLCBlcnJvcikgLT5cbiAgICBpZiBfLmlzRnVuY3Rpb24ob3B0aW9ucykgXG4gICAgICBbb3B0aW9ucywgc3VjY2VzcywgZXJyb3JdID0gW3t9LCBvcHRpb25zLCBzdWNjZXNzXVxuXG4gICAgQGZpbmQoc2VsZWN0b3IsIG9wdGlvbnMpLmZldGNoIChyZXN1bHRzKSAtPlxuICAgICAgaWYgc3VjY2Vzcz8gdGhlbiBzdWNjZXNzKGlmIHJlc3VsdHMubGVuZ3RoPjAgdGhlbiByZXN1bHRzWzBdIGVsc2UgbnVsbClcbiAgICAsIGVycm9yXG5cbiAgX2ZpbmRGZXRjaDogKHNlbGVjdG9yLCBvcHRpb25zLCBzdWNjZXNzLCBlcnJvcikgLT5cbiAgICBmaWx0ZXJlZCA9IF8uZmlsdGVyKF8udmFsdWVzKEBpdGVtcyksIGNvbXBpbGVEb2N1bWVudFNlbGVjdG9yKHNlbGVjdG9yKSlcblxuICAgICMgSGFuZGxlIGdlb3NwYXRpYWwgb3BlcmF0b3JzXG4gICAgZmlsdGVyZWQgPSBwcm9jZXNzTmVhck9wZXJhdG9yKHNlbGVjdG9yLCBmaWx0ZXJlZClcbiAgICBmaWx0ZXJlZCA9IHByb2Nlc3NHZW9JbnRlcnNlY3RzT3BlcmF0b3Ioc2VsZWN0b3IsIGZpbHRlcmVkKVxuXG4gICAgaWYgb3B0aW9ucyBhbmQgb3B0aW9ucy5zb3J0IFxuICAgICAgZmlsdGVyZWQuc29ydChjb21waWxlU29ydChvcHRpb25zLnNvcnQpKVxuXG4gICAgaWYgb3B0aW9ucyBhbmQgb3B0aW9ucy5saW1pdFxuICAgICAgZmlsdGVyZWQgPSBfLmZpcnN0IGZpbHRlcmVkLCBvcHRpb25zLmxpbWl0XG5cbiAgICAjIENsb25lIHRvIHByZXZlbnQgYWNjaWRlbnRhbCB1cGRhdGVzXG4gICAgZmlsdGVyZWQgPSBfLm1hcCBmaWx0ZXJlZCwgKGRvYykgLT4gXy5jbG9uZURlZXAoZG9jKVxuICAgIGlmIHN1Y2Nlc3M/IHRoZW4gc3VjY2VzcyhmaWx0ZXJlZClcblxuICB1cHNlcnQ6IChkb2MsIHN1Y2Nlc3MsIGVycm9yKSAtPlxuICAgIGlmIG5vdCBkb2MuX2lkXG4gICAgICBkb2MuX2lkID0gY3JlYXRlVWlkKClcblxuICAgICMgUmVwbGFjZS9hZGQgXG4gICAgQF9wdXRJdGVtKGRvYylcbiAgICBAX3B1dFVwc2VydChkb2MpXG5cbiAgICBpZiBzdWNjZXNzPyB0aGVuIHN1Y2Nlc3MoZG9jKVxuXG4gIHJlbW92ZTogKGlkLCBzdWNjZXNzLCBlcnJvcikgLT5cbiAgICBpZiBfLmhhcyhAaXRlbXMsIGlkKVxuICAgICAgQF9wdXRSZW1vdmUoQGl0ZW1zW2lkXSlcbiAgICAgIEBfZGVsZXRlSXRlbShpZClcbiAgICAgIEBfZGVsZXRlVXBzZXJ0KGlkKVxuXG4gICAgaWYgc3VjY2Vzcz8gdGhlbiBzdWNjZXNzKClcblxuICBfcHV0SXRlbTogKGRvYykgLT5cbiAgICBAaXRlbXNbZG9jLl9pZF0gPSBkb2NcbiAgICBsb2NhbFN0b3JhZ2VbQGl0ZW1OYW1lc3BhY2UgKyBkb2MuX2lkXSA9IEpTT04uc3RyaW5naWZ5KGRvYylcblxuICBfZGVsZXRlSXRlbTogKGlkKSAtPlxuICAgIGRlbGV0ZSBAaXRlbXNbaWRdXG5cbiAgX3B1dFVwc2VydDogKGRvYykgLT5cbiAgICBAdXBzZXJ0c1tkb2MuX2lkXSA9IGRvY1xuICAgIGxvY2FsU3RvcmFnZVtAbmFtZXNwYWNlK1widXBzZXJ0c1wiXSA9IEpTT04uc3RyaW5naWZ5KF8ua2V5cyhAdXBzZXJ0cykpXG5cbiAgX2RlbGV0ZVVwc2VydDogKGlkKSAtPlxuICAgIGRlbGV0ZSBAdXBzZXJ0c1tpZF1cbiAgICBsb2NhbFN0b3JhZ2VbQG5hbWVzcGFjZStcInVwc2VydHNcIl0gPSBKU09OLnN0cmluZ2lmeShfLmtleXMoQHVwc2VydHMpKVxuXG4gIF9wdXRSZW1vdmU6IChkb2MpIC0+XG4gICAgQHJlbW92ZXNbZG9jLl9pZF0gPSBkb2NcbiAgICBsb2NhbFN0b3JhZ2VbQG5hbWVzcGFjZStcInJlbW92ZXNcIl0gPSBKU09OLnN0cmluZ2lmeShfLnZhbHVlcyhAcmVtb3ZlcykpXG5cbiAgX2RlbGV0ZVJlbW92ZTogKGlkKSAtPlxuICAgIGRlbGV0ZSBAcmVtb3Zlc1tpZF1cbiAgICBsb2NhbFN0b3JhZ2VbQG5hbWVzcGFjZStcInJlbW92ZXNcIl0gPSBKU09OLnN0cmluZ2lmeShfLnZhbHVlcyhAcmVtb3ZlcykpXG5cbiAgY2FjaGU6IChkb2NzLCBzZWxlY3Rvciwgb3B0aW9ucywgc3VjY2VzcywgZXJyb3IpIC0+XG4gICAgIyBBZGQgYWxsIG5vbi1sb2NhbCB0aGF0IGFyZSBub3QgdXBzZXJ0ZWQgb3IgcmVtb3ZlZFxuICAgIGZvciBkb2MgaW4gZG9jc1xuICAgICAgaWYgbm90IF8uaGFzKEB1cHNlcnRzLCBkb2MuX2lkKSBhbmQgbm90IF8uaGFzKEByZW1vdmVzLCBkb2MuX2lkKVxuICAgICAgICBAX3B1dEl0ZW0oZG9jKVxuXG4gICAgZG9jc01hcCA9IF8ub2JqZWN0KF8ucGx1Y2soZG9jcywgXCJfaWRcIiksIGRvY3MpXG5cbiAgICBpZiBvcHRpb25zLnNvcnRcbiAgICAgIHNvcnQgPSBjb21waWxlU29ydChvcHRpb25zLnNvcnQpXG5cbiAgICAjIFBlcmZvcm0gcXVlcnksIHJlbW92aW5nIHJvd3MgbWlzc2luZyBpbiBkb2NzIGZyb20gbG9jYWwgZGIgXG4gICAgQGZpbmQoc2VsZWN0b3IsIG9wdGlvbnMpLmZldGNoIChyZXN1bHRzKSA9PlxuICAgICAgZm9yIHJlc3VsdCBpbiByZXN1bHRzXG4gICAgICAgIGlmIG5vdCBkb2NzTWFwW3Jlc3VsdC5faWRdIGFuZCBub3QgXy5oYXMoQHVwc2VydHMsIHJlc3VsdC5faWQpXG4gICAgICAgICAgIyBJZiBwYXN0IGVuZCBvbiBzb3J0ZWQgbGltaXRlZCwgaWdub3JlXG4gICAgICAgICAgaWYgb3B0aW9ucy5zb3J0IGFuZCBvcHRpb25zLmxpbWl0IGFuZCBkb2NzLmxlbmd0aCA9PSBvcHRpb25zLmxpbWl0XG4gICAgICAgICAgICBpZiBzb3J0KHJlc3VsdCwgXy5sYXN0KGRvY3MpKSA+PSAwXG4gICAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgQF9kZWxldGVJdGVtKHJlc3VsdC5faWQpXG5cbiAgICAgIGlmIHN1Y2Nlc3M/IHRoZW4gc3VjY2VzcygpICBcbiAgICAsIGVycm9yXG4gICAgXG4gIHBlbmRpbmdVcHNlcnRzOiAoc3VjY2VzcykgLT5cbiAgICBzdWNjZXNzIF8udmFsdWVzKEB1cHNlcnRzKVxuXG4gIHBlbmRpbmdSZW1vdmVzOiAoc3VjY2VzcykgLT5cbiAgICBzdWNjZXNzIF8ucGx1Y2soQHJlbW92ZXMsIFwiX2lkXCIpXG5cbiAgcmVzb2x2ZVVwc2VydDogKGRvYywgc3VjY2VzcykgLT5cbiAgICBpZiBAdXBzZXJ0c1tkb2MuX2lkXSBhbmQgXy5pc0VxdWFsKGRvYywgQHVwc2VydHNbZG9jLl9pZF0pXG4gICAgICBAX2RlbGV0ZVVwc2VydChkb2MuX2lkKVxuICAgIGlmIHN1Y2Nlc3M/IHRoZW4gc3VjY2VzcygpXG5cbiAgcmVzb2x2ZVJlbW92ZTogKGlkLCBzdWNjZXNzKSAtPlxuICAgIEBfZGVsZXRlUmVtb3ZlKGlkKVxuICAgIGlmIHN1Y2Nlc3M/IHRoZW4gc3VjY2VzcygpXG5cbiAgIyBBZGQgYnV0IGRvIG5vdCBvdmVyd3JpdGUgb3IgcmVjb3JkIGFzIHVwc2VydFxuICBzZWVkOiAoZG9jLCBzdWNjZXNzKSAtPlxuICAgIGlmIG5vdCBfLmhhcyhAaXRlbXMsIGRvYy5faWQpIGFuZCBub3QgXy5oYXMoQHJlbW92ZXMsIGRvYy5faWQpXG4gICAgICBAX3B1dEl0ZW0oZG9jKVxuICAgIGlmIHN1Y2Nlc3M/IHRoZW4gc3VjY2VzcygpXG5cblxuY3JlYXRlVWlkID0gLT4gXG4gICd4eHh4eHh4eHh4eHg0eHh4eXh4eHh4eHh4eHh4eHh4eCcucmVwbGFjZSgvW3h5XS9nLCAoYykgLT5cbiAgICByID0gTWF0aC5yYW5kb20oKSoxNnwwXG4gICAgdiA9IGlmIGMgPT0gJ3gnIHRoZW4gciBlbHNlIChyJjB4M3wweDgpXG4gICAgcmV0dXJuIHYudG9TdHJpbmcoMTYpXG4gICApXG5cbnByb2Nlc3NOZWFyT3BlcmF0b3IgPSAoc2VsZWN0b3IsIGxpc3QpIC0+XG4gIGZvciBrZXksIHZhbHVlIG9mIHNlbGVjdG9yXG4gICAgaWYgdmFsdWVbJyRuZWFyJ11cbiAgICAgIGdlbyA9IHZhbHVlWyckbmVhciddWyckZ2VvbWV0cnknXVxuICAgICAgaWYgZ2VvLnR5cGUgIT0gJ1BvaW50J1xuICAgICAgICBicmVha1xuXG4gICAgICBuZWFyID0gbmV3IEwuTGF0TG5nKGdlby5jb29yZGluYXRlc1sxXSwgZ2VvLmNvb3JkaW5hdGVzWzBdKVxuXG4gICAgICBsaXN0ID0gXy5maWx0ZXIgbGlzdCwgKGRvYykgLT5cbiAgICAgICAgcmV0dXJuIGRvY1trZXldIGFuZCBkb2Nba2V5XS50eXBlID09ICdQb2ludCdcblxuICAgICAgIyBHZXQgZGlzdGFuY2VzXG4gICAgICBkaXN0YW5jZXMgPSBfLm1hcCBsaXN0LCAoZG9jKSAtPlxuICAgICAgICByZXR1cm4geyBkb2M6IGRvYywgZGlzdGFuY2U6IFxuICAgICAgICAgIG5lYXIuZGlzdGFuY2VUbyhuZXcgTC5MYXRMbmcoZG9jW2tleV0uY29vcmRpbmF0ZXNbMV0sIGRvY1trZXldLmNvb3JkaW5hdGVzWzBdKSlcbiAgICAgICAgfVxuXG4gICAgICAjIEZpbHRlciBub24tcG9pbnRzXG4gICAgICBkaXN0YW5jZXMgPSBfLmZpbHRlciBkaXN0YW5jZXMsIChpdGVtKSAtPiBpdGVtLmRpc3RhbmNlID49IDBcblxuICAgICAgIyBTb3J0IGJ5IGRpc3RhbmNlXG4gICAgICBkaXN0YW5jZXMgPSBfLnNvcnRCeSBkaXN0YW5jZXMsICdkaXN0YW5jZSdcblxuICAgICAgIyBGaWx0ZXIgYnkgbWF4RGlzdGFuY2VcbiAgICAgIGlmIHZhbHVlWyckbmVhciddWyckbWF4RGlzdGFuY2UnXVxuICAgICAgICBkaXN0YW5jZXMgPSBfLmZpbHRlciBkaXN0YW5jZXMsIChpdGVtKSAtPiBpdGVtLmRpc3RhbmNlIDw9IHZhbHVlWyckbmVhciddWyckbWF4RGlzdGFuY2UnXVxuXG4gICAgICAjIExpbWl0IHRvIDEwMFxuICAgICAgZGlzdGFuY2VzID0gXy5maXJzdCBkaXN0YW5jZXMsIDEwMFxuXG4gICAgICAjIEV4dHJhY3QgZG9jc1xuICAgICAgbGlzdCA9IF8ucGx1Y2sgZGlzdGFuY2VzLCAnZG9jJ1xuICByZXR1cm4gbGlzdFxuXG5wcm9jZXNzR2VvSW50ZXJzZWN0c09wZXJhdG9yID0gKHNlbGVjdG9yLCBsaXN0KSAtPlxuICBmb3Iga2V5LCB2YWx1ZSBvZiBzZWxlY3RvclxuICAgIGlmIHZhbHVlWyckZ2VvSW50ZXJzZWN0cyddXG4gICAgICBnZW8gPSB2YWx1ZVsnJGdlb0ludGVyc2VjdHMnXVsnJGdlb21ldHJ5J11cbiAgICAgIGlmIGdlby50eXBlICE9ICdQb2x5Z29uJ1xuICAgICAgICBicmVha1xuXG4gICAgICAjIENoZWNrIHdpdGhpbiBmb3IgZWFjaFxuICAgICAgbGlzdCA9IF8uZmlsdGVyIGxpc3QsIChkb2MpIC0+XG4gICAgICAgICMgUmVqZWN0IG5vbi1wb2ludHNcbiAgICAgICAgaWYgbm90IGRvY1trZXldIG9yIGRvY1trZXldLnR5cGUgIT0gJ1BvaW50J1xuICAgICAgICAgIHJldHVybiBmYWxzZVxuXG4gICAgICAgICMgQ2hlY2sgcG9seWdvblxuICAgICAgICByZXR1cm4gR2VvSlNPTi5wb2ludEluUG9seWdvbihkb2Nba2V5XSwgZ2VvKVxuXG4gIHJldHVybiBsaXN0XG5cbm1vZHVsZS5leHBvcnRzID0gTG9jYWxEYlxuIiwiZXhwb3J0cy5TZWN0aW9ucyA9IEJhY2tib25lLlZpZXcuZXh0ZW5kKHtcbiAgICBjbGFzc05hbWUgOiBcInN1cnZleVwiLFxuXG4gICAgaW5pdGlhbGl6ZSA6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnRpdGxlID0gdGhpcy5vcHRpb25zLnRpdGxlO1xuICAgICAgICB0aGlzLnNlY3Rpb25zID0gdGhpcy5vcHRpb25zLnNlY3Rpb25zO1xuICAgICAgICB0aGlzLnJlbmRlcigpO1xuXG4gICAgICAgIC8vIEFkanVzdCBuZXh0L3ByZXYgYmFzZWQgb24gbW9kZWxcbiAgICAgICAgdGhpcy5tb2RlbC5vbihcImNoYW5nZVwiLCB0aGlzLnJlbmRlck5leHRQcmV2LCB0aGlzKTtcblxuICAgICAgICAvLyBHbyB0byBhcHByb3ByaWF0ZSBzZWN0aW9uIFRPRE9cbiAgICAgICAgdGhpcy5zaG93U2VjdGlvbigwKTtcbiAgICB9LFxuXG4gICAgZXZlbnRzIDoge1xuICAgICAgICBcImNsaWNrIC5uZXh0XCIgOiBcIm5leHRTZWN0aW9uXCIsXG4gICAgICAgIFwiY2xpY2sgLnByZXZcIiA6IFwicHJldlNlY3Rpb25cIixcbiAgICAgICAgXCJjbGljayAuZmluaXNoXCIgOiBcImZpbmlzaFwiLFxuICAgICAgICBcImNsaWNrIGEuc2VjdGlvbi1jcnVtYlwiIDogXCJjcnVtYlNlY3Rpb25cIlxuICAgIH0sXG5cbiAgICBmaW5pc2ggOiBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gVmFsaWRhdGUgY3VycmVudCBzZWN0aW9uXG4gICAgICAgIHZhciBzZWN0aW9uID0gdGhpcy5zZWN0aW9uc1t0aGlzLnNlY3Rpb25dO1xuICAgICAgICBpZiAoc2VjdGlvbi52YWxpZGF0ZSgpKSB7XG4gICAgICAgICAgICB0aGlzLnRyaWdnZXIoJ2NvbXBsZXRlJyk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgY3J1bWJTZWN0aW9uIDogZnVuY3Rpb24oZSkge1xuICAgICAgICAvLyBHbyB0byBzZWN0aW9uXG4gICAgICAgIHZhciBpbmRleCA9IHBhcnNlSW50KGUudGFyZ2V0LmdldEF0dHJpYnV0ZShcImRhdGEtdmFsdWVcIikpO1xuICAgICAgICB0aGlzLnNob3dTZWN0aW9uKGluZGV4KTtcbiAgICB9LFxuXG4gICAgZ2V0TmV4dFNlY3Rpb25JbmRleCA6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgaSA9IHRoaXMuc2VjdGlvbiArIDE7XG4gICAgICAgIHdoaWxlIChpIDwgdGhpcy5zZWN0aW9ucy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnNlY3Rpb25zW2ldLnNob3VsZEJlVmlzaWJsZSgpKVxuICAgICAgICAgICAgICAgIHJldHVybiBpO1xuICAgICAgICAgICAgaSsrO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGdldFByZXZTZWN0aW9uSW5kZXggOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGkgPSB0aGlzLnNlY3Rpb24gLSAxO1xuICAgICAgICB3aGlsZSAoaSA+PSAwKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5zZWN0aW9uc1tpXS5zaG91bGRCZVZpc2libGUoKSlcbiAgICAgICAgICAgICAgICByZXR1cm4gaTtcbiAgICAgICAgICAgIGktLTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBuZXh0U2VjdGlvbiA6IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBWYWxpZGF0ZSBjdXJyZW50IHNlY3Rpb25cbiAgICAgICAgdmFyIHNlY3Rpb24gPSB0aGlzLnNlY3Rpb25zW3RoaXMuc2VjdGlvbl07XG4gICAgICAgIGlmIChzZWN0aW9uLnZhbGlkYXRlKCkpIHtcbiAgICAgICAgICAgIHRoaXMuc2hvd1NlY3Rpb24odGhpcy5nZXROZXh0U2VjdGlvbkluZGV4KCkpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIHByZXZTZWN0aW9uIDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuc2hvd1NlY3Rpb24odGhpcy5nZXRQcmV2U2VjdGlvbkluZGV4KCkpO1xuICAgIH0sXG5cbiAgICBzaG93U2VjdGlvbiA6IGZ1bmN0aW9uKGluZGV4KSB7XG4gICAgICAgIHRoaXMuc2VjdGlvbiA9IGluZGV4O1xuXG4gICAgICAgIF8uZWFjaCh0aGlzLnNlY3Rpb25zLCBmdW5jdGlvbihzKSB7XG4gICAgICAgICAgICBzLiRlbC5oaWRlKCk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLnNlY3Rpb25zW2luZGV4XS4kZWwuc2hvdygpO1xuXG4gICAgICAgIC8vIFNldHVwIGJyZWFkY3J1bWJzXG4gICAgICAgIHZhciB2aXNpYmxlU2VjdGlvbnMgPSBfLmZpbHRlcihfLmZpcnN0KHRoaXMuc2VjdGlvbnMsIGluZGV4ICsgMSksIGZ1bmN0aW9uKHMpIHtcbiAgICAgICAgICAgIHJldHVybiBzLnNob3VsZEJlVmlzaWJsZSgpXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLiQoXCIuYnJlYWRjcnVtYlwiKS5odG1sKHRlbXBsYXRlc1snZm9ybXMvU2VjdGlvbnNfYnJlYWRjcnVtYnMnXSh7XG4gICAgICAgICAgICBzZWN0aW9ucyA6IF8uaW5pdGlhbCh2aXNpYmxlU2VjdGlvbnMpLFxuICAgICAgICAgICAgbGFzdFNlY3Rpb246IF8ubGFzdCh2aXNpYmxlU2VjdGlvbnMpXG4gICAgICAgIH0pKTtcbiAgICAgICAgXG4gICAgICAgIHRoaXMucmVuZGVyTmV4dFByZXYoKTtcblxuICAgICAgICAvLyBTY3JvbGwgaW50byB2aWV3XG4gICAgICAgIHRoaXMuJGVsLnNjcm9sbGludG92aWV3KCk7XG4gICAgfSxcbiAgICBcbiAgICByZW5kZXJOZXh0UHJldiA6IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBTZXR1cCBuZXh0L3ByZXYgYnV0dG9uc1xuICAgICAgICB0aGlzLiQoXCIucHJldlwiKS50b2dnbGUodGhpcy5nZXRQcmV2U2VjdGlvbkluZGV4KCkgIT09IHVuZGVmaW5lZCk7XG4gICAgICAgIHRoaXMuJChcIi5uZXh0XCIpLnRvZ2dsZSh0aGlzLmdldE5leHRTZWN0aW9uSW5kZXgoKSAhPT0gdW5kZWZpbmVkKTtcbiAgICAgICAgdGhpcy4kKFwiLmZpbmlzaFwiKS50b2dnbGUodGhpcy5nZXROZXh0U2VjdGlvbkluZGV4KCkgPT09IHVuZGVmaW5lZCk7XG4gICAgfSxcblxuICAgIHJlbmRlciA6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLiRlbC5odG1sKHRlbXBsYXRlc1snZm9ybXMvU2VjdGlvbnMnXSgpKTtcblxuICAgICAgICAvLyBBZGQgc2VjdGlvbnNcbiAgICAgICAgdmFyIHNlY3Rpb25zRWwgPSB0aGlzLiQoXCIuc2VjdGlvbnNcIik7XG4gICAgICAgIF8uZWFjaCh0aGlzLnNlY3Rpb25zLCBmdW5jdGlvbihzKSB7XG4gICAgICAgICAgICBzZWN0aW9uc0VsLmFwcGVuZChzLiRlbCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxufSk7XG5cbmV4cG9ydHMuU2VjdGlvbiA9IEJhY2tib25lLlZpZXcuZXh0ZW5kKHtcbiAgICBjbGFzc05hbWUgOiBcInNlY3Rpb25cIixcbiAgICB0ZW1wbGF0ZSA6IF8udGVtcGxhdGUoJzxkaXYgY2xhc3M9XCJjb250ZW50c1wiPjwvZGl2PicpLFxuXG4gICAgaW5pdGlhbGl6ZSA6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnRpdGxlID0gdGhpcy5vcHRpb25zLnRpdGxlO1xuICAgICAgICB0aGlzLmNvbnRlbnRzID0gdGhpcy5vcHRpb25zLmNvbnRlbnRzO1xuXG4gICAgICAgIC8vIEFsd2F5cyBpbnZpc2libGUgaW5pdGlhbGx5XG4gICAgICAgIHRoaXMuJGVsLmhpZGUoKTtcbiAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICB9LFxuXG4gICAgc2hvdWxkQmVWaXNpYmxlIDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICghdGhpcy5vcHRpb25zLmNvbmRpdGlvbmFsKVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIHJldHVybiB0aGlzLm9wdGlvbnMuY29uZGl0aW9uYWwodGhpcy5tb2RlbCk7XG4gICAgfSxcblxuICAgIHZhbGlkYXRlIDogZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIEdldCBhbGwgdmlzaWJsZSBpdGVtc1xuICAgICAgICB2YXIgaXRlbXMgPSBfLmZpbHRlcih0aGlzLmNvbnRlbnRzLCBmdW5jdGlvbihjKSB7XG4gICAgICAgICAgICByZXR1cm4gYy52aXNpYmxlICYmIGMudmFsaWRhdGU7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gIV8uYW55KF8ubWFwKGl0ZW1zLCBmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgICAgICByZXR1cm4gaXRlbS52YWxpZGF0ZSgpO1xuICAgICAgICB9KSk7XG4gICAgfSxcblxuICAgIHJlbmRlciA6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLiRlbC5odG1sKHRoaXMudGVtcGxhdGUodGhpcykpO1xuXG4gICAgICAgIC8vIEFkZCBjb250ZW50cyAocXVlc3Rpb25zLCBtb3N0bHkpXG4gICAgICAgIHZhciBjb250ZW50c0VsID0gdGhpcy4kKFwiLmNvbnRlbnRzXCIpO1xuICAgICAgICBfLmVhY2godGhpcy5jb250ZW50cywgZnVuY3Rpb24oYykge1xuICAgICAgICAgICAgY29udGVudHNFbC5hcHBlbmQoYy4kZWwpO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbn0pO1xuXG5leHBvcnRzLlF1ZXN0aW9uID0gQmFja2JvbmUuVmlldy5leHRlbmQoe1xuICAgIGNsYXNzTmFtZSA6IFwicXVlc3Rpb25cIixcblxuICAgIHRlbXBsYXRlIDogXy50ZW1wbGF0ZSgnPGRpdiBjbGFzcz1cInByb21wdFwiPjwlPW9wdGlvbnMucHJvbXB0JT48JT1yZW5kZXJSZXF1aXJlZCgpJT48L2Rpdj48ZGl2IGNsYXNzPVwiYW5zd2VyXCI+PC9kaXY+JyksXG5cbiAgICByZW5kZXJSZXF1aXJlZCA6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5yZXF1aXJlZClcbiAgICAgICAgICAgIHJldHVybiAnJm5ic3A7PHNwYW4gY2xhc3M9XCJyZXF1aXJlZFwiPio8L3NwYW4+JztcbiAgICAgICAgcmV0dXJuICcnO1xuICAgIH0sXG5cbiAgICB2YWxpZGF0ZSA6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgdmFsO1xuXG4gICAgICAgIC8vIENoZWNrIHJlcXVpcmVkXG4gICAgICAgIGlmICh0aGlzLnJlcXVpcmVkKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5tb2RlbC5nZXQodGhpcy5pZCkgPT09IHVuZGVmaW5lZCB8fCB0aGlzLm1vZGVsLmdldCh0aGlzLmlkKSA9PT0gbnVsbCB8fCB0aGlzLm1vZGVsLmdldCh0aGlzLmlkKSA9PT0gXCJcIilcbiAgICAgICAgICAgICAgICB2YWwgPSBcIlJlcXVpcmVkXCI7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDaGVjayBjdXN0b20gdmFsaWRhdGlvblxuICAgICAgICBpZiAoIXZhbCAmJiB0aGlzLm9wdGlvbnMudmFsaWRhdGUpIHtcbiAgICAgICAgICAgIHZhbCA9IHRoaXMub3B0aW9ucy52YWxpZGF0ZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gU2hvdyB2YWxpZGF0aW9uIHJlc3VsdHMgVE9ET1xuICAgICAgICBpZiAodmFsKSB7XG4gICAgICAgICAgICB0aGlzLiRlbC5hZGRDbGFzcyhcImludmFsaWRcIik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLiRlbC5yZW1vdmVDbGFzcyhcImludmFsaWRcIik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdmFsO1xuICAgIH0sXG5cbiAgICB1cGRhdGVWaXNpYmlsaXR5IDogZnVuY3Rpb24oZSkge1xuICAgICAgICAvLyBzbGlkZVVwL3NsaWRlRG93blxuICAgICAgICBpZiAodGhpcy5zaG91bGRCZVZpc2libGUoKSAmJiAhdGhpcy52aXNpYmxlKVxuICAgICAgICAgICAgdGhpcy4kZWwuc2xpZGVEb3duKCk7XG4gICAgICAgIGlmICghdGhpcy5zaG91bGRCZVZpc2libGUoKSAmJiB0aGlzLnZpc2libGUpXG4gICAgICAgICAgICB0aGlzLiRlbC5zbGlkZVVwKCk7XG4gICAgICAgIHRoaXMudmlzaWJsZSA9IHRoaXMuc2hvdWxkQmVWaXNpYmxlKCk7XG4gICAgfSxcblxuICAgIHNob3VsZEJlVmlzaWJsZSA6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoIXRoaXMub3B0aW9ucy5jb25kaXRpb25hbClcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25zLmNvbmRpdGlvbmFsKHRoaXMubW9kZWwpO1xuICAgIH0sXG5cbiAgICBpbml0aWFsaXplIDogZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIEFkanVzdCB2aXNpYmlsaXR5IGJhc2VkIG9uIG1vZGVsXG4gICAgICAgIHRoaXMubW9kZWwub24oXCJjaGFuZ2VcIiwgdGhpcy51cGRhdGVWaXNpYmlsaXR5LCB0aGlzKTtcblxuICAgICAgICAvLyBSZS1yZW5kZXIgYmFzZWQgb24gbW9kZWwgY2hhbmdlc1xuICAgICAgICB0aGlzLm1vZGVsLm9uKFwiY2hhbmdlOlwiICsgdGhpcy5pZCwgdGhpcy5yZW5kZXIsIHRoaXMpO1xuXG4gICAgICAgIHRoaXMucmVxdWlyZWQgPSB0aGlzLm9wdGlvbnMucmVxdWlyZWQ7XG5cbiAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICB9LFxuXG4gICAgcmVuZGVyIDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuJGVsLmh0bWwodGhpcy50ZW1wbGF0ZSh0aGlzKSk7XG5cbiAgICAgICAgLy8gUmVuZGVyIGFuc3dlclxuICAgICAgICB0aGlzLnJlbmRlckFuc3dlcih0aGlzLiQoXCIuYW5zd2VyXCIpKTtcblxuICAgICAgICB0aGlzLiRlbC50b2dnbGUodGhpcy5zaG91bGRCZVZpc2libGUoKSk7XG4gICAgICAgIHRoaXMudmlzaWJsZSA9IHRoaXMuc2hvdWxkQmVWaXNpYmxlKCk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxufSk7XG5cbmV4cG9ydHMuUmFkaW9RdWVzdGlvbiA9IGV4cG9ydHMuUXVlc3Rpb24uZXh0ZW5kKHtcbiAgICBldmVudHMgOiB7XG4gICAgICAgIFwiY2hlY2tlZFwiIDogXCJjaGVja2VkXCIsXG4gICAgfSxcblxuICAgIGNoZWNrZWQgOiBmdW5jdGlvbihlKSB7XG4gICAgICAgIHZhciBpbmRleCA9IHBhcnNlSW50KGUudGFyZ2V0LmdldEF0dHJpYnV0ZShcImRhdGEtdmFsdWVcIikpO1xuICAgICAgICB2YXIgdmFsdWUgPSB0aGlzLm9wdGlvbnMub3B0aW9uc1tpbmRleF1bMF07XG4gICAgICAgIHRoaXMubW9kZWwuc2V0KHRoaXMuaWQsIHZhbHVlKTtcbiAgICB9LFxuXG4gICAgcmVuZGVyQW5zd2VyIDogZnVuY3Rpb24oYW5zd2VyRWwpIHtcbiAgICAgICAgYW5zd2VyRWwuaHRtbChfLnRlbXBsYXRlKCc8ZGl2IGNsYXNzPVwicmFkaW8tZ3JvdXBcIj48JT1yZW5kZXJSYWRpb09wdGlvbnMoKSU+PC9kaXY+JywgdGhpcykpO1xuICAgIH0sXG5cbiAgICByZW5kZXJSYWRpb09wdGlvbnMgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaHRtbCA9IFwiXCI7XG4gICAgICAgIHZhciBpO1xuICAgICAgICBmb3IgKCBpID0gMDsgaSA8IHRoaXMub3B0aW9ucy5vcHRpb25zLmxlbmd0aDsgaSsrKVxuICAgICAgICAgICAgaHRtbCArPSBfLnRlbXBsYXRlKCc8ZGl2IGNsYXNzPVwicmFkaW8tYnV0dG9uIDwlPWNoZWNrZWQlPlwiIGRhdGEtdmFsdWU9XCI8JT1wb3NpdGlvbiU+XCI+PCU9dGV4dCU+PC9kaXY+Jywge1xuICAgICAgICAgICAgICAgIHBvc2l0aW9uIDogaSxcbiAgICAgICAgICAgICAgICB0ZXh0IDogdGhpcy5vcHRpb25zLm9wdGlvbnNbaV1bMV0sXG4gICAgICAgICAgICAgICAgY2hlY2tlZCA6IHRoaXMubW9kZWwuZ2V0KHRoaXMuaWQpID09PSB0aGlzLm9wdGlvbnMub3B0aW9uc1tpXVswXSA/IFwiY2hlY2tlZFwiIDogXCJcIlxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIGh0bWw7XG4gICAgfVxuXG59KTtcblxuZXhwb3J0cy5Ecm9wZG93blF1ZXN0aW9uID0gZXhwb3J0cy5RdWVzdGlvbi5leHRlbmQoe1xuICAgIGV2ZW50cyA6IHtcbiAgICAgICAgXCJjaGFuZ2VcIiA6IFwiY2hhbmdlZFwiLFxuICAgIH0sXG5cbiAgICBjaGFuZ2VkIDogZnVuY3Rpb24oZSkge1xuICAgICAgICB2YXIgdmFsID0gJChlLnRhcmdldCkudmFsKCk7XG4gICAgICAgIGlmICh2YWwgPT0gXCJcIikge1xuICAgICAgICAgICAgdGhpcy5tb2RlbC5zZXQodGhpcy5pZCwgbnVsbCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YXIgaW5kZXggPSBwYXJzZUludCh2YWwpO1xuICAgICAgICAgICAgdmFyIHZhbHVlID0gdGhpcy5vcHRpb25zLm9wdGlvbnNbaW5kZXhdWzBdO1xuICAgICAgICAgICAgdGhpcy5tb2RlbC5zZXQodGhpcy5pZCwgdmFsdWUpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIHJlbmRlckFuc3dlciA6IGZ1bmN0aW9uKGFuc3dlckVsKSB7XG4gICAgICAgIGFuc3dlckVsLmh0bWwoXy50ZW1wbGF0ZSgnPHNlbGVjdCBpZD1cInNvdXJjZV90eXBlXCI+PCU9cmVuZGVyRHJvcGRvd25PcHRpb25zKCklPjwvc2VsZWN0PicsIHRoaXMpKTtcbiAgICB9LFxuXG4gICAgcmVuZGVyRHJvcGRvd25PcHRpb25zIDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGh0bWwgPSBcIlwiO1xuXG4gICAgICAgIC8vIEFkZCBlbXB0eSBvcHRpb25cbiAgICAgICAgaHRtbCArPSAnPG9wdGlvbiB2YWx1ZT1cIlwiPjwvb3B0aW9uPic7XG5cbiAgICAgICAgdmFyIGk7XG4gICAgICAgIGZvciAoIGkgPSAwOyBpIDwgdGhpcy5vcHRpb25zLm9wdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGh0bWwgKz0gXy50ZW1wbGF0ZSgnPG9wdGlvbiB2YWx1ZT1cIjwlPXBvc2l0aW9uJT5cIiA8JT1zZWxlY3RlZCU+PjwlLXRleHQlPjwvb3B0aW9uPicsIHtcbiAgICAgICAgICAgICAgICBwb3NpdGlvbiA6IGksXG4gICAgICAgICAgICAgICAgdGV4dCA6IHRoaXMub3B0aW9ucy5vcHRpb25zW2ldWzFdLFxuICAgICAgICAgICAgICAgIHNlbGVjdGVkIDogdGhpcy5tb2RlbC5nZXQodGhpcy5pZCkgPT09IHRoaXMub3B0aW9ucy5vcHRpb25zW2ldWzBdID8gJ3NlbGVjdGVkPVwic2VsZWN0ZWRcIicgOiBcIlwiXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBodG1sO1xuICAgIH1cblxufSk7XG5cbmV4cG9ydHMuQ2hlY2tRdWVzdGlvbiA9IGV4cG9ydHMuUXVlc3Rpb24uZXh0ZW5kKHtcbiAgICBldmVudHMgOiB7XG4gICAgICAgIFwiY2hlY2tlZFwiIDogXCJjaGVja2VkXCIsXG4gICAgfSxcblxuICAgIGNoZWNrZWQgOiBmdW5jdGlvbihlKSB7XG4gICAgICAgIC8vIEdldCBjaGVja2VkXG4gICAgICAgIHRoaXMubW9kZWwuc2V0KHRoaXMuaWQsIHRoaXMuJChcIi5jaGVja2JveFwiKS5oYXNDbGFzcyhcImNoZWNrZWRcIikpO1xuICAgIH0sXG5cbiAgICByZW5kZXJBbnN3ZXIgOiBmdW5jdGlvbihhbnN3ZXJFbCkge1xuICAgICAgICB2YXIgaTtcbiAgICAgICAgYW5zd2VyRWwuYXBwZW5kKCQoXy50ZW1wbGF0ZSgnPGRpdiBjbGFzcz1cImNoZWNrYm94IDwlPWNoZWNrZWQlPlwiPjwlPXRleHQlPjwvZGl2PicsIHtcbiAgICAgICAgICAgIHRleHQgOiB0aGlzLm9wdGlvbnMudGV4dCxcbiAgICAgICAgICAgIGNoZWNrZWQgOiAodGhpcy5tb2RlbC5nZXQodGhpcy5pZCkpID8gXCJjaGVja2VkXCIgOiBcIlwiXG4gICAgICAgIH0pKSk7XG4gICAgfVxuXG59KTtcblxuXG5leHBvcnRzLk11bHRpY2hlY2tRdWVzdGlvbiA9IGV4cG9ydHMuUXVlc3Rpb24uZXh0ZW5kKHtcbiAgICBldmVudHMgOiB7XG4gICAgICAgIFwiY2hlY2tlZFwiIDogXCJjaGVja2VkXCIsXG4gICAgfSxcblxuICAgIGNoZWNrZWQgOiBmdW5jdGlvbihlKSB7XG4gICAgICAgIC8vIEdldCBhbGwgY2hlY2tlZFxuICAgICAgICB2YXIgdmFsdWUgPSBbXTtcbiAgICAgICAgdmFyIG9wdHMgPSB0aGlzLm9wdGlvbnMub3B0aW9ucztcbiAgICAgICAgdGhpcy4kKFwiLmNoZWNrYm94XCIpLmVhY2goZnVuY3Rpb24oaW5kZXgpIHtcbiAgICAgICAgICAgIGlmICgkKHRoaXMpLmhhc0NsYXNzKFwiY2hlY2tlZFwiKSlcbiAgICAgICAgICAgICAgICB2YWx1ZS5wdXNoKG9wdHNbaW5kZXhdWzBdKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMubW9kZWwuc2V0KHRoaXMuaWQsIHZhbHVlKTtcbiAgICB9LFxuXG4gICAgcmVuZGVyQW5zd2VyIDogZnVuY3Rpb24oYW5zd2VyRWwpIHtcbiAgICAgICAgdmFyIGk7XG4gICAgICAgIGZvciAoIGkgPSAwOyBpIDwgdGhpcy5vcHRpb25zLm9wdGlvbnMubGVuZ3RoOyBpKyspXG4gICAgICAgICAgICBhbnN3ZXJFbC5hcHBlbmQoJChfLnRlbXBsYXRlKCc8ZGl2IGNsYXNzPVwiY2hlY2tib3ggPCU9Y2hlY2tlZCU+XCIgZGF0YS12YWx1ZT1cIjwlPXBvc2l0aW9uJT5cIj48JT10ZXh0JT48L2Rpdj4nLCB7XG4gICAgICAgICAgICAgICAgcG9zaXRpb24gOiBpLFxuICAgICAgICAgICAgICAgIHRleHQgOiB0aGlzLm9wdGlvbnMub3B0aW9uc1tpXVsxXSxcbiAgICAgICAgICAgICAgICBjaGVja2VkIDogKHRoaXMubW9kZWwuZ2V0KHRoaXMuaWQpICYmIF8uY29udGFpbnModGhpcy5tb2RlbC5nZXQodGhpcy5pZCksIHRoaXMub3B0aW9ucy5vcHRpb25zW2ldWzBdKSkgPyBcImNoZWNrZWRcIiA6IFwiXCJcbiAgICAgICAgICAgIH0pKSk7XG4gICAgfVxuXG59KTtcblxuZXhwb3J0cy5UZXh0UXVlc3Rpb24gPSBleHBvcnRzLlF1ZXN0aW9uLmV4dGVuZCh7XG4gICAgcmVuZGVyQW5zd2VyIDogZnVuY3Rpb24oYW5zd2VyRWwpIHtcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5tdWx0aWxpbmUpIHtcbiAgICAgICAgICAgIGFuc3dlckVsLmh0bWwoXy50ZW1wbGF0ZSgnPHRleHRhcmVhLz4nLCB0aGlzKSk7XG4gICAgICAgICAgICBhbnN3ZXJFbC5maW5kKFwidGV4dGFyZWFcIikudmFsKHRoaXMubW9kZWwuZ2V0KHRoaXMuaWQpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGFuc3dlckVsLmh0bWwoXy50ZW1wbGF0ZSgnPGlucHV0IHR5cGU9XCJ0ZXh0XCIvPicsIHRoaXMpKTtcbiAgICAgICAgICAgIGFuc3dlckVsLmZpbmQoXCJpbnB1dFwiKS52YWwodGhpcy5tb2RlbC5nZXQodGhpcy5pZCkpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGV2ZW50cyA6IHtcbiAgICAgICAgXCJjaGFuZ2VcIiA6IFwiY2hhbmdlZFwiXG4gICAgfSxcbiAgICBjaGFuZ2VkIDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMubW9kZWwuc2V0KHRoaXMuaWQsIHRoaXMuJCh0aGlzLm9wdGlvbnMubXVsdGlsaW5lID8gXCJ0ZXh0YXJlYVwiIDogXCJpbnB1dFwiKS52YWwoKSk7XG4gICAgfVxuXG59KTtcblxuZXhwb3J0cy5OdW1iZXJRdWVzdGlvbiA9IGV4cG9ydHMuUXVlc3Rpb24uZXh0ZW5kKHtcbiAgICByZW5kZXJBbnN3ZXIgOiBmdW5jdGlvbihhbnN3ZXJFbCkge1xuICAgICAgICBhbnN3ZXJFbC5odG1sKF8udGVtcGxhdGUoJzxpbnB1dCB0eXBlPVwibnVtYmVyXCIvPicsIHRoaXMpKTtcbiAgICAgICAgYW5zd2VyRWwuZmluZChcImlucHV0XCIpLnZhbCh0aGlzLm1vZGVsLmdldCh0aGlzLmlkKSk7XG4gICAgfSxcblxuICAgIGV2ZW50cyA6IHtcbiAgICAgICAgXCJjaGFuZ2VcIiA6IFwiY2hhbmdlZFwiXG4gICAgfSxcbiAgICBjaGFuZ2VkIDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMubW9kZWwuc2V0KHRoaXMuaWQsIHBhcnNlRmxvYXQodGhpcy4kKFwiaW5wdXRcIikudmFsKCkpKTtcbiAgICB9XG5cbn0pO1xuXG5leHBvcnRzLlBob3RvUXVlc3Rpb24gPSBleHBvcnRzLlF1ZXN0aW9uLmV4dGVuZCh7XG4gICAgcmVuZGVyQW5zd2VyIDogZnVuY3Rpb24oYW5zd2VyRWwpIHtcbiAgICAgICAgYW5zd2VyRWwuaHRtbChfLnRlbXBsYXRlKCc8aW1nIHN0eWxlPVwibWF4LXdpZHRoOiAxMDBweDtcIiBzcmM9XCJpbWFnZXMvY2FtZXJhLWljb24uanBnXCIvPicsIHRoaXMpKTtcbiAgICB9LFxuXG4gICAgZXZlbnRzIDoge1xuICAgICAgICBcImNsaWNrIGltZ1wiIDogXCJ0YWtlUGljdHVyZVwiXG4gICAgfSxcblxuICAgIHRha2VQaWN0dXJlIDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGFsZXJ0KFwiSW4gYW4gYXBwLCB0aGlzIHdvdWxkIGxhdW5jaCB0aGUgY2FtZXJhIGFjdGl2aXR5IGFzIGluIG1XYXRlciBuYXRpdmUgYXBwcy5cIik7XG4gICAgfVxuXG59KTtcbiIsIiMgVE9ETyBGaXggdG8gaGF2ZSBlZGl0YWJsZSBZWVlZLU1NLUREIHdpdGggY2xpY2sgdG8gcG9wdXAgc2Nyb2xsZXJcblxuUXVlc3Rpb24gPSByZXF1aXJlKCcuL2Zvcm0tY29udHJvbHMnKS5RdWVzdGlvblxuXG5tb2R1bGUuZXhwb3J0cyA9IFF1ZXN0aW9uLmV4dGVuZChcbiAgZXZlbnRzOlxuICAgIGNoYW5nZTogXCJjaGFuZ2VkXCJcblxuICBjaGFuZ2VkOiAtPlxuICAgIEBtb2RlbC5zZXQgQGlkLCBAJGVsLmZpbmQoXCJpbnB1dFtuYW1lPVxcXCJkYXRlXFxcIl1cIikudmFsKClcblxuICByZW5kZXJBbnN3ZXI6IChhbnN3ZXJFbCkgLT5cbiAgICBhbnN3ZXJFbC5odG1sIF8udGVtcGxhdGUoXCI8aW5wdXQgY2xhc3M9XFxcIm5lZWRzY2xpY2tcXFwiIG5hbWU9XFxcImRhdGVcXFwiIC8+XCIsIHRoaXMpXG4gICAgYW5zd2VyRWwuZmluZChcImlucHV0XCIpLnZhbCBAbW9kZWwuZ2V0KEBpZClcbiAgICBhbnN3ZXJFbC5maW5kKFwiaW5wdXRcIikuc2Nyb2xsZXJcbiAgICAgIHByZXNldDogXCJkYXRlXCJcbiAgICAgIHRoZW1lOiBcImlvc1wiXG4gICAgICBkaXNwbGF5OiBcIm1vZGFsXCJcbiAgICAgIG1vZGU6IFwic2Nyb2xsZXJcIlxuICAgICAgZGF0ZU9yZGVyOiBcInl5bW1EIGRkXCJcbiAgICAgIGRhdGVGb3JtYXQ6IFwieXktbW0tZGRcIlxuXG4pIiwiIyBJbXByb3ZlZCBsb2NhdGlvbiBmaW5kZXJcbmNsYXNzIExvY2F0aW9uRmluZGVyXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgIF8uZXh0ZW5kIEAsIEJhY2tib25lLkV2ZW50c1xuICAgIFxuICBnZXRMb2NhdGlvbjogLT5cbiAgICAjIEJvdGggZmFpbHVyZXMgYXJlIHJlcXVpcmVkIHRvIHRyaWdnZXIgZXJyb3JcbiAgICBsb2NhdGlvbkVycm9yID0gXy5hZnRlciAyLCA9PlxuICAgICAgQHRyaWdnZXIgJ2Vycm9yJ1xuXG4gICAgaGlnaEFjY3VyYWN5RmlyZWQgPSBmYWxzZVxuXG4gICAgbG93QWNjdXJhY3kgPSAocG9zKSA9PlxuICAgICAgaWYgbm90IGhpZ2hBY2N1cmFjeUZpcmVkXG4gICAgICAgIEB0cmlnZ2VyICdmb3VuZCcsIHBvc1xuXG4gICAgaGlnaEFjY3VyYWN5ID0gKHBvcykgPT5cbiAgICAgIGhpZ2hBY2N1cmFjeUZpcmVkID0gdHJ1ZVxuICAgICAgQHRyaWdnZXIgJ2ZvdW5kJywgcG9zXG5cbiAgICAjIEdldCBib3RoIGhpZ2ggYW5kIGxvdyBhY2N1cmFjeSwgYXMgbG93IGlzIHN1ZmZpY2llbnQgZm9yIGluaXRpYWwgZGlzcGxheVxuICAgIG5hdmlnYXRvci5nZW9sb2NhdGlvbi5nZXRDdXJyZW50UG9zaXRpb24obG93QWNjdXJhY3ksIGxvY2F0aW9uRXJyb3IsIHtcbiAgICAgICAgbWF4aW11bUFnZSA6IDM2MDAqMjQsXG4gICAgICAgIHRpbWVvdXQgOiAxMDAwMCxcbiAgICAgICAgZW5hYmxlSGlnaEFjY3VyYWN5IDogZmFsc2VcbiAgICB9KVxuXG4gICAgbmF2aWdhdG9yLmdlb2xvY2F0aW9uLmdldEN1cnJlbnRQb3NpdGlvbihoaWdoQWNjdXJhY3ksIGxvY2F0aW9uRXJyb3IsIHtcbiAgICAgICAgbWF4aW11bUFnZSA6IDM2MDAsXG4gICAgICAgIHRpbWVvdXQgOiAzMDAwMCxcbiAgICAgICAgZW5hYmxlSGlnaEFjY3VyYWN5IDogdHJ1ZVxuICAgIH0pXG5cbiAgc3RhcnRXYXRjaDogLT5cbiAgICAjIEFsbG93IG9uZSB3YXRjaCBhdCBtb3N0XG4gICAgaWYgQGxvY2F0aW9uV2F0Y2hJZD9cbiAgICAgIEBzdG9wV2F0Y2goKVxuXG4gICAgaGlnaEFjY3VyYWN5RmlyZWQgPSBmYWxzZVxuICAgIGxvd0FjY3VyYWN5RmlyZWQgPSBmYWxzZVxuXG4gICAgbG93QWNjdXJhY3kgPSAocG9zKSA9PlxuICAgICAgaWYgbm90IGhpZ2hBY2N1cmFjeUZpcmVkXG4gICAgICAgIGxvd0FjY3VyYWN5RmlyZWQgPSB0cnVlXG4gICAgICAgIEB0cmlnZ2VyICdmb3VuZCcsIHBvc1xuXG4gICAgaGlnaEFjY3VyYWN5ID0gKHBvcykgPT5cbiAgICAgIGhpZ2hBY2N1cmFjeUZpcmVkID0gdHJ1ZVxuICAgICAgQHRyaWdnZXIgJ2ZvdW5kJywgcG9zXG5cbiAgICBlcnJvciA9IChlcnJvcikgPT5cbiAgICAgIGNvbnNvbGUubG9nIFwiIyMjIGVycm9yIFwiXG4gICAgICAjIE5vIGVycm9yIGlmIGZpcmVkIG9uY2VcbiAgICAgIGlmIG5vdCBsb3dBY2N1cmFjeUZpcmVkIGFuZCBub3QgaGlnaEFjY3VyYWN5RmlyZWRcbiAgICAgICAgQHRyaWdnZXIgJ2Vycm9yJywgZXJyb3JcblxuICAgICMgRmlyZSBpbml0aWFsIGxvdy1hY2N1cmFjeSBvbmVcbiAgICBuYXZpZ2F0b3IuZ2VvbG9jYXRpb24uZ2V0Q3VycmVudFBvc2l0aW9uKGxvd0FjY3VyYWN5LCBlcnJvciwge1xuICAgICAgICBtYXhpbXVtQWdlIDogMzYwMCoyNCxcbiAgICAgICAgdGltZW91dCA6IDEwMDAwLFxuICAgICAgICBlbmFibGVIaWdoQWNjdXJhY3kgOiBmYWxzZVxuICAgIH0pXG5cbiAgICBAbG9jYXRpb25XYXRjaElkID0gbmF2aWdhdG9yLmdlb2xvY2F0aW9uLndhdGNoUG9zaXRpb24oaGlnaEFjY3VyYWN5LCBlcnJvciwge1xuICAgICAgICBtYXhpbXVtQWdlIDogMzAwMCxcbiAgICAgICAgZW5hYmxlSGlnaEFjY3VyYWN5IDogdHJ1ZVxuICAgIH0pICBcblxuICBzdG9wV2F0Y2g6IC0+XG4gICAgaWYgQGxvY2F0aW9uV2F0Y2hJZD9cbiAgICAgIG5hdmlnYXRvci5nZW9sb2NhdGlvbi5jbGVhcldhdGNoKEBsb2NhdGlvbldhdGNoSWQpXG4gICAgICBAbG9jYXRpb25XYXRjaElkID0gdW5kZWZpbmVkXG5cblxubW9kdWxlLmV4cG9ydHMgPSBMb2NhdGlvbkZpbmRlciAgIiwiLy8gVE9ETyBhZGQgbGljZW5zZVxuXG5Mb2NhbENvbGxlY3Rpb24gPSB7fTtcbkVKU09OID0gcmVxdWlyZShcIi4vRUpTT05cIik7XG5cbi8vIExpa2UgXy5pc0FycmF5LCBidXQgZG9lc24ndCByZWdhcmQgcG9seWZpbGxlZCBVaW50OEFycmF5cyBvbiBvbGQgYnJvd3NlcnMgYXNcbi8vIGFycmF5cy5cbnZhciBpc0FycmF5ID0gZnVuY3Rpb24gKHgpIHtcbiAgcmV0dXJuIF8uaXNBcnJheSh4KSAmJiAhRUpTT04uaXNCaW5hcnkoeCk7XG59O1xuXG52YXIgX2FueUlmQXJyYXkgPSBmdW5jdGlvbiAoeCwgZikge1xuICBpZiAoaXNBcnJheSh4KSlcbiAgICByZXR1cm4gXy5hbnkoeCwgZik7XG4gIHJldHVybiBmKHgpO1xufTtcblxudmFyIF9hbnlJZkFycmF5UGx1cyA9IGZ1bmN0aW9uICh4LCBmKSB7XG4gIGlmIChmKHgpKVxuICAgIHJldHVybiB0cnVlO1xuICByZXR1cm4gaXNBcnJheSh4KSAmJiBfLmFueSh4LCBmKTtcbn07XG5cbnZhciBoYXNPcGVyYXRvcnMgPSBmdW5jdGlvbih2YWx1ZVNlbGVjdG9yKSB7XG4gIHZhciB0aGVzZUFyZU9wZXJhdG9ycyA9IHVuZGVmaW5lZDtcbiAgZm9yICh2YXIgc2VsS2V5IGluIHZhbHVlU2VsZWN0b3IpIHtcbiAgICB2YXIgdGhpc0lzT3BlcmF0b3IgPSBzZWxLZXkuc3Vic3RyKDAsIDEpID09PSAnJCc7XG4gICAgaWYgKHRoZXNlQXJlT3BlcmF0b3JzID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoZXNlQXJlT3BlcmF0b3JzID0gdGhpc0lzT3BlcmF0b3I7XG4gICAgfSBlbHNlIGlmICh0aGVzZUFyZU9wZXJhdG9ycyAhPT0gdGhpc0lzT3BlcmF0b3IpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkluY29uc2lzdGVudCBzZWxlY3RvcjogXCIgKyB2YWx1ZVNlbGVjdG9yKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuICEhdGhlc2VBcmVPcGVyYXRvcnM7ICAvLyB7fSBoYXMgbm8gb3BlcmF0b3JzXG59O1xuXG52YXIgY29tcGlsZVZhbHVlU2VsZWN0b3IgPSBmdW5jdGlvbiAodmFsdWVTZWxlY3Rvcikge1xuICBpZiAodmFsdWVTZWxlY3RvciA9PSBudWxsKSB7ICAvLyB1bmRlZmluZWQgb3IgbnVsbFxuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJldHVybiBfYW55SWZBcnJheSh2YWx1ZSwgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIHggPT0gbnVsbDsgIC8vIHVuZGVmaW5lZCBvciBudWxsXG4gICAgICB9KTtcbiAgICB9O1xuICB9XG5cbiAgLy8gU2VsZWN0b3IgaXMgYSBub24tbnVsbCBwcmltaXRpdmUgKGFuZCBub3QgYW4gYXJyYXkgb3IgUmVnRXhwIGVpdGhlcikuXG4gIGlmICghXy5pc09iamVjdCh2YWx1ZVNlbGVjdG9yKSkge1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJldHVybiBfYW55SWZBcnJheSh2YWx1ZSwgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIHggPT09IHZhbHVlU2VsZWN0b3I7XG4gICAgICB9KTtcbiAgICB9O1xuICB9XG5cbiAgaWYgKHZhbHVlU2VsZWN0b3IgaW5zdGFuY2VvZiBSZWdFeHApIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZClcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgcmV0dXJuIF9hbnlJZkFycmF5KHZhbHVlLCBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4gdmFsdWVTZWxlY3Rvci50ZXN0KHgpO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfVxuXG4gIC8vIEFycmF5cyBtYXRjaCBlaXRoZXIgaWRlbnRpY2FsIGFycmF5cyBvciBhcnJheXMgdGhhdCBjb250YWluIGl0IGFzIGEgdmFsdWUuXG4gIGlmIChpc0FycmF5KHZhbHVlU2VsZWN0b3IpKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgaWYgKCFpc0FycmF5KHZhbHVlKSlcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgcmV0dXJuIF9hbnlJZkFycmF5UGx1cyh2YWx1ZSwgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIExvY2FsQ29sbGVjdGlvbi5fZi5fZXF1YWwodmFsdWVTZWxlY3RvciwgeCk7XG4gICAgICB9KTtcbiAgICB9O1xuICB9XG5cbiAgLy8gSXQncyBhbiBvYmplY3QsIGJ1dCBub3QgYW4gYXJyYXkgb3IgcmVnZXhwLlxuICBpZiAoaGFzT3BlcmF0b3JzKHZhbHVlU2VsZWN0b3IpKSB7XG4gICAgdmFyIG9wZXJhdG9yRnVuY3Rpb25zID0gW107XG4gICAgXy5lYWNoKHZhbHVlU2VsZWN0b3IsIGZ1bmN0aW9uIChvcGVyYW5kLCBvcGVyYXRvcikge1xuICAgICAgaWYgKCFfLmhhcyhWQUxVRV9PUEVSQVRPUlMsIG9wZXJhdG9yKSlcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5yZWNvZ25pemVkIG9wZXJhdG9yOiBcIiArIG9wZXJhdG9yKTtcbiAgICAgIG9wZXJhdG9yRnVuY3Rpb25zLnB1c2goVkFMVUVfT1BFUkFUT1JTW29wZXJhdG9yXShcbiAgICAgICAgb3BlcmFuZCwgdmFsdWVTZWxlY3Rvci4kb3B0aW9ucykpO1xuICAgIH0pO1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJldHVybiBfLmFsbChvcGVyYXRvckZ1bmN0aW9ucywgZnVuY3Rpb24gKGYpIHtcbiAgICAgICAgcmV0dXJuIGYodmFsdWUpO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfVxuXG4gIC8vIEl0J3MgYSBsaXRlcmFsOyBjb21wYXJlIHZhbHVlIChvciBlbGVtZW50IG9mIHZhbHVlIGFycmF5KSBkaXJlY3RseSB0byB0aGVcbiAgLy8gc2VsZWN0b3IuXG4gIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICByZXR1cm4gX2FueUlmQXJyYXkodmFsdWUsIGZ1bmN0aW9uICh4KSB7XG4gICAgICByZXR1cm4gTG9jYWxDb2xsZWN0aW9uLl9mLl9lcXVhbCh2YWx1ZVNlbGVjdG9yLCB4KTtcbiAgICB9KTtcbiAgfTtcbn07XG5cbi8vIFhYWCBjYW4gZmFjdG9yIG91dCBjb21tb24gbG9naWMgYmVsb3dcbnZhciBMT0dJQ0FMX09QRVJBVE9SUyA9IHtcbiAgXCIkYW5kXCI6IGZ1bmN0aW9uKHN1YlNlbGVjdG9yKSB7XG4gICAgaWYgKCFpc0FycmF5KHN1YlNlbGVjdG9yKSB8fCBfLmlzRW1wdHkoc3ViU2VsZWN0b3IpKVxuICAgICAgdGhyb3cgRXJyb3IoXCIkYW5kLyRvci8kbm9yIG11c3QgYmUgbm9uZW1wdHkgYXJyYXlcIik7XG4gICAgdmFyIHN1YlNlbGVjdG9yRnVuY3Rpb25zID0gXy5tYXAoXG4gICAgICBzdWJTZWxlY3RvciwgY29tcGlsZURvY3VtZW50U2VsZWN0b3IpO1xuICAgIHJldHVybiBmdW5jdGlvbiAoZG9jKSB7XG4gICAgICByZXR1cm4gXy5hbGwoc3ViU2VsZWN0b3JGdW5jdGlvbnMsIGZ1bmN0aW9uIChmKSB7XG4gICAgICAgIHJldHVybiBmKGRvYyk7XG4gICAgICB9KTtcbiAgICB9O1xuICB9LFxuXG4gIFwiJG9yXCI6IGZ1bmN0aW9uKHN1YlNlbGVjdG9yKSB7XG4gICAgaWYgKCFpc0FycmF5KHN1YlNlbGVjdG9yKSB8fCBfLmlzRW1wdHkoc3ViU2VsZWN0b3IpKVxuICAgICAgdGhyb3cgRXJyb3IoXCIkYW5kLyRvci8kbm9yIG11c3QgYmUgbm9uZW1wdHkgYXJyYXlcIik7XG4gICAgdmFyIHN1YlNlbGVjdG9yRnVuY3Rpb25zID0gXy5tYXAoXG4gICAgICBzdWJTZWxlY3RvciwgY29tcGlsZURvY3VtZW50U2VsZWN0b3IpO1xuICAgIHJldHVybiBmdW5jdGlvbiAoZG9jKSB7XG4gICAgICByZXR1cm4gXy5hbnkoc3ViU2VsZWN0b3JGdW5jdGlvbnMsIGZ1bmN0aW9uIChmKSB7XG4gICAgICAgIHJldHVybiBmKGRvYyk7XG4gICAgICB9KTtcbiAgICB9O1xuICB9LFxuXG4gIFwiJG5vclwiOiBmdW5jdGlvbihzdWJTZWxlY3Rvcikge1xuICAgIGlmICghaXNBcnJheShzdWJTZWxlY3RvcikgfHwgXy5pc0VtcHR5KHN1YlNlbGVjdG9yKSlcbiAgICAgIHRocm93IEVycm9yKFwiJGFuZC8kb3IvJG5vciBtdXN0IGJlIG5vbmVtcHR5IGFycmF5XCIpO1xuICAgIHZhciBzdWJTZWxlY3RvckZ1bmN0aW9ucyA9IF8ubWFwKFxuICAgICAgc3ViU2VsZWN0b3IsIGNvbXBpbGVEb2N1bWVudFNlbGVjdG9yKTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGRvYykge1xuICAgICAgcmV0dXJuIF8uYWxsKHN1YlNlbGVjdG9yRnVuY3Rpb25zLCBmdW5jdGlvbiAoZikge1xuICAgICAgICByZXR1cm4gIWYoZG9jKTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0sXG5cbiAgXCIkd2hlcmVcIjogZnVuY3Rpb24oc2VsZWN0b3JWYWx1ZSkge1xuICAgIGlmICghKHNlbGVjdG9yVmFsdWUgaW5zdGFuY2VvZiBGdW5jdGlvbikpIHtcbiAgICAgIHNlbGVjdG9yVmFsdWUgPSBGdW5jdGlvbihcInJldHVybiBcIiArIHNlbGVjdG9yVmFsdWUpO1xuICAgIH1cbiAgICByZXR1cm4gZnVuY3Rpb24gKGRvYykge1xuICAgICAgcmV0dXJuIHNlbGVjdG9yVmFsdWUuY2FsbChkb2MpO1xuICAgIH07XG4gIH1cbn07XG5cbnZhciBWQUxVRV9PUEVSQVRPUlMgPSB7XG4gIFwiJGluXCI6IGZ1bmN0aW9uIChvcGVyYW5kKSB7XG4gICAgaWYgKCFpc0FycmF5KG9wZXJhbmQpKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQXJndW1lbnQgdG8gJGluIG11c3QgYmUgYXJyYXlcIik7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgcmV0dXJuIF9hbnlJZkFycmF5UGx1cyh2YWx1ZSwgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIF8uYW55KG9wZXJhbmQsIGZ1bmN0aW9uIChvcGVyYW5kRWx0KSB7XG4gICAgICAgICAgcmV0dXJuIExvY2FsQ29sbGVjdGlvbi5fZi5fZXF1YWwob3BlcmFuZEVsdCwgeCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSxcblxuICBcIiRhbGxcIjogZnVuY3Rpb24gKG9wZXJhbmQpIHtcbiAgICBpZiAoIWlzQXJyYXkob3BlcmFuZCkpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJBcmd1bWVudCB0byAkYWxsIG11c3QgYmUgYXJyYXlcIik7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgaWYgKCFpc0FycmF5KHZhbHVlKSlcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgcmV0dXJuIF8uYWxsKG9wZXJhbmQsIGZ1bmN0aW9uIChvcGVyYW5kRWx0KSB7XG4gICAgICAgIHJldHVybiBfLmFueSh2YWx1ZSwgZnVuY3Rpb24gKHZhbHVlRWx0KSB7XG4gICAgICAgICAgcmV0dXJuIExvY2FsQ29sbGVjdGlvbi5fZi5fZXF1YWwob3BlcmFuZEVsdCwgdmFsdWVFbHQpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0sXG5cbiAgXCIkbHRcIjogZnVuY3Rpb24gKG9wZXJhbmQpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICByZXR1cm4gX2FueUlmQXJyYXkodmFsdWUsIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiBMb2NhbENvbGxlY3Rpb24uX2YuX2NtcCh4LCBvcGVyYW5kKSA8IDA7XG4gICAgICB9KTtcbiAgICB9O1xuICB9LFxuXG4gIFwiJGx0ZVwiOiBmdW5jdGlvbiAob3BlcmFuZCkge1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJldHVybiBfYW55SWZBcnJheSh2YWx1ZSwgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIExvY2FsQ29sbGVjdGlvbi5fZi5fY21wKHgsIG9wZXJhbmQpIDw9IDA7XG4gICAgICB9KTtcbiAgICB9O1xuICB9LFxuXG4gIFwiJGd0XCI6IGZ1bmN0aW9uIChvcGVyYW5kKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgcmV0dXJuIF9hbnlJZkFycmF5KHZhbHVlLCBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4gTG9jYWxDb2xsZWN0aW9uLl9mLl9jbXAoeCwgb3BlcmFuZCkgPiAwO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSxcblxuICBcIiRndGVcIjogZnVuY3Rpb24gKG9wZXJhbmQpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICByZXR1cm4gX2FueUlmQXJyYXkodmFsdWUsIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiBMb2NhbENvbGxlY3Rpb24uX2YuX2NtcCh4LCBvcGVyYW5kKSA+PSAwO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSxcblxuICBcIiRuZVwiOiBmdW5jdGlvbiAob3BlcmFuZCkge1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJldHVybiAhIF9hbnlJZkFycmF5UGx1cyh2YWx1ZSwgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIExvY2FsQ29sbGVjdGlvbi5fZi5fZXF1YWwoeCwgb3BlcmFuZCk7XG4gICAgICB9KTtcbiAgICB9O1xuICB9LFxuXG4gIFwiJG5pblwiOiBmdW5jdGlvbiAob3BlcmFuZCkge1xuICAgIGlmICghaXNBcnJheShvcGVyYW5kKSlcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkFyZ3VtZW50IHRvICRuaW4gbXVzdCBiZSBhcnJheVwiKTtcbiAgICB2YXIgaW5GdW5jdGlvbiA9IFZBTFVFX09QRVJBVE9SUy4kaW4ob3BlcmFuZCk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgLy8gRmllbGQgZG9lc24ndCBleGlzdCwgc28gaXQncyBub3QtaW4gb3BlcmFuZFxuICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgcmV0dXJuICFpbkZ1bmN0aW9uKHZhbHVlKTtcbiAgICB9O1xuICB9LFxuXG4gIFwiJGV4aXN0c1wiOiBmdW5jdGlvbiAob3BlcmFuZCkge1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJldHVybiBvcGVyYW5kID09PSAodmFsdWUgIT09IHVuZGVmaW5lZCk7XG4gICAgfTtcbiAgfSxcblxuICBcIiRtb2RcIjogZnVuY3Rpb24gKG9wZXJhbmQpIHtcbiAgICB2YXIgZGl2aXNvciA9IG9wZXJhbmRbMF0sXG4gICAgICAgIHJlbWFpbmRlciA9IG9wZXJhbmRbMV07XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgcmV0dXJuIF9hbnlJZkFycmF5KHZhbHVlLCBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4geCAlIGRpdmlzb3IgPT09IHJlbWFpbmRlcjtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0sXG5cbiAgXCIkc2l6ZVwiOiBmdW5jdGlvbiAob3BlcmFuZCkge1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJldHVybiBpc0FycmF5KHZhbHVlKSAmJiBvcGVyYW5kID09PSB2YWx1ZS5sZW5ndGg7XG4gICAgfTtcbiAgfSxcblxuICBcIiR0eXBlXCI6IGZ1bmN0aW9uIChvcGVyYW5kKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgLy8gQSBub25leGlzdGVudCBmaWVsZCBpcyBvZiBubyB0eXBlLlxuICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIC8vIERlZmluaXRlbHkgbm90IF9hbnlJZkFycmF5UGx1czogJHR5cGU6IDQgb25seSBtYXRjaGVzIGFycmF5cyB0aGF0IGhhdmVcbiAgICAgIC8vIGFycmF5cyBhcyBlbGVtZW50cyBhY2NvcmRpbmcgdG8gdGhlIE1vbmdvIGRvY3MuXG4gICAgICByZXR1cm4gX2FueUlmQXJyYXkodmFsdWUsIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiBMb2NhbENvbGxlY3Rpb24uX2YuX3R5cGUoeCkgPT09IG9wZXJhbmQ7XG4gICAgICB9KTtcbiAgICB9O1xuICB9LFxuXG4gIFwiJHJlZ2V4XCI6IGZ1bmN0aW9uIChvcGVyYW5kLCBvcHRpb25zKSB7XG4gICAgaWYgKG9wdGlvbnMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgLy8gT3B0aW9ucyBwYXNzZWQgaW4gJG9wdGlvbnMgKGV2ZW4gdGhlIGVtcHR5IHN0cmluZykgYWx3YXlzIG92ZXJyaWRlc1xuICAgICAgLy8gb3B0aW9ucyBpbiB0aGUgUmVnRXhwIG9iamVjdCBpdHNlbGYuXG5cbiAgICAgIC8vIEJlIGNsZWFyIHRoYXQgd2Ugb25seSBzdXBwb3J0IHRoZSBKUy1zdXBwb3J0ZWQgb3B0aW9ucywgbm90IGV4dGVuZGVkXG4gICAgICAvLyBvbmVzIChlZywgTW9uZ28gc3VwcG9ydHMgeCBhbmQgcykuIElkZWFsbHkgd2Ugd291bGQgaW1wbGVtZW50IHggYW5kIHNcbiAgICAgIC8vIGJ5IHRyYW5zZm9ybWluZyB0aGUgcmVnZXhwLCBidXQgbm90IHRvZGF5Li4uXG4gICAgICBpZiAoL1teZ2ltXS8udGVzdChvcHRpb25zKSlcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiT25seSB0aGUgaSwgbSwgYW5kIGcgcmVnZXhwIG9wdGlvbnMgYXJlIHN1cHBvcnRlZFwiKTtcblxuICAgICAgdmFyIHJlZ2V4U291cmNlID0gb3BlcmFuZCBpbnN0YW5jZW9mIFJlZ0V4cCA/IG9wZXJhbmQuc291cmNlIDogb3BlcmFuZDtcbiAgICAgIG9wZXJhbmQgPSBuZXcgUmVnRXhwKHJlZ2V4U291cmNlLCBvcHRpb25zKTtcbiAgICB9IGVsc2UgaWYgKCEob3BlcmFuZCBpbnN0YW5jZW9mIFJlZ0V4cCkpIHtcbiAgICAgIG9wZXJhbmQgPSBuZXcgUmVnRXhwKG9wZXJhbmQpO1xuICAgIH1cblxuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICByZXR1cm4gX2FueUlmQXJyYXkodmFsdWUsIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiBvcGVyYW5kLnRlc3QoeCk7XG4gICAgICB9KTtcbiAgICB9O1xuICB9LFxuXG4gIFwiJG9wdGlvbnNcIjogZnVuY3Rpb24gKG9wZXJhbmQpIHtcbiAgICAvLyBldmFsdWF0aW9uIGhhcHBlbnMgYXQgdGhlICRyZWdleCBmdW5jdGlvbiBhYm92ZVxuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHsgcmV0dXJuIHRydWU7IH07XG4gIH0sXG5cbiAgXCIkZWxlbU1hdGNoXCI6IGZ1bmN0aW9uIChvcGVyYW5kKSB7XG4gICAgdmFyIG1hdGNoZXIgPSBjb21waWxlRG9jdW1lbnRTZWxlY3RvcihvcGVyYW5kKTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICBpZiAoIWlzQXJyYXkodmFsdWUpKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICByZXR1cm4gXy5hbnkodmFsdWUsIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiBtYXRjaGVyKHgpO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSxcblxuICBcIiRub3RcIjogZnVuY3Rpb24gKG9wZXJhbmQpIHtcbiAgICB2YXIgbWF0Y2hlciA9IGNvbXBpbGVWYWx1ZVNlbGVjdG9yKG9wZXJhbmQpO1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJldHVybiAhbWF0Y2hlcih2YWx1ZSk7XG4gICAgfTtcbiAgfSxcblxuICBcIiRuZWFyXCI6IGZ1bmN0aW9uIChvcGVyYW5kKSB7XG4gICAgLy8gQWx3YXlzIHJldHVybnMgdHJ1ZS4gTXVzdCBiZSBoYW5kbGVkIGluIHBvc3QtZmlsdGVyL3NvcnQvbGltaXRcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH0sXG5cbiAgXCIkZ2VvSW50ZXJzZWN0c1wiOiBmdW5jdGlvbiAob3BlcmFuZCkge1xuICAgIC8vIEFsd2F5cyByZXR1cm5zIHRydWUuIE11c3QgYmUgaGFuZGxlZCBpbiBwb3N0LWZpbHRlci9zb3J0L2xpbWl0XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG5cbn07XG5cbi8vIGhlbHBlcnMgdXNlZCBieSBjb21waWxlZCBzZWxlY3RvciBjb2RlXG5Mb2NhbENvbGxlY3Rpb24uX2YgPSB7XG4gIC8vIFhYWCBmb3IgX2FsbCBhbmQgX2luLCBjb25zaWRlciBidWlsZGluZyAnaW5xdWVyeScgYXQgY29tcGlsZSB0aW1lLi5cblxuICBfdHlwZTogZnVuY3Rpb24gKHYpIHtcbiAgICBpZiAodHlwZW9mIHYgPT09IFwibnVtYmVyXCIpXG4gICAgICByZXR1cm4gMTtcbiAgICBpZiAodHlwZW9mIHYgPT09IFwic3RyaW5nXCIpXG4gICAgICByZXR1cm4gMjtcbiAgICBpZiAodHlwZW9mIHYgPT09IFwiYm9vbGVhblwiKVxuICAgICAgcmV0dXJuIDg7XG4gICAgaWYgKGlzQXJyYXkodikpXG4gICAgICByZXR1cm4gNDtcbiAgICBpZiAodiA9PT0gbnVsbClcbiAgICAgIHJldHVybiAxMDtcbiAgICBpZiAodiBpbnN0YW5jZW9mIFJlZ0V4cClcbiAgICAgIHJldHVybiAxMTtcbiAgICBpZiAodHlwZW9mIHYgPT09IFwiZnVuY3Rpb25cIilcbiAgICAgIC8vIG5vdGUgdGhhdCB0eXBlb2YoL3gvKSA9PT0gXCJmdW5jdGlvblwiXG4gICAgICByZXR1cm4gMTM7XG4gICAgaWYgKHYgaW5zdGFuY2VvZiBEYXRlKVxuICAgICAgcmV0dXJuIDk7XG4gICAgaWYgKEVKU09OLmlzQmluYXJ5KHYpKVxuICAgICAgcmV0dXJuIDU7XG4gICAgaWYgKHYgaW5zdGFuY2VvZiBNZXRlb3IuQ29sbGVjdGlvbi5PYmplY3RJRClcbiAgICAgIHJldHVybiA3O1xuICAgIHJldHVybiAzOyAvLyBvYmplY3RcblxuICAgIC8vIFhYWCBzdXBwb3J0IHNvbWUvYWxsIG9mIHRoZXNlOlxuICAgIC8vIDE0LCBzeW1ib2xcbiAgICAvLyAxNSwgamF2YXNjcmlwdCBjb2RlIHdpdGggc2NvcGVcbiAgICAvLyAxNiwgMTg6IDMyLWJpdC82NC1iaXQgaW50ZWdlclxuICAgIC8vIDE3LCB0aW1lc3RhbXBcbiAgICAvLyAyNTUsIG1pbmtleVxuICAgIC8vIDEyNywgbWF4a2V5XG4gIH0sXG5cbiAgLy8gZGVlcCBlcXVhbGl0eSB0ZXN0OiB1c2UgZm9yIGxpdGVyYWwgZG9jdW1lbnQgYW5kIGFycmF5IG1hdGNoZXNcbiAgX2VxdWFsOiBmdW5jdGlvbiAoYSwgYikge1xuICAgIHJldHVybiBFSlNPTi5lcXVhbHMoYSwgYiwge2tleU9yZGVyU2Vuc2l0aXZlOiB0cnVlfSk7XG4gIH0sXG5cbiAgLy8gbWFwcyBhIHR5cGUgY29kZSB0byBhIHZhbHVlIHRoYXQgY2FuIGJlIHVzZWQgdG8gc29ydCB2YWx1ZXMgb2ZcbiAgLy8gZGlmZmVyZW50IHR5cGVzXG4gIF90eXBlb3JkZXI6IGZ1bmN0aW9uICh0KSB7XG4gICAgLy8gaHR0cDovL3d3dy5tb25nb2RiLm9yZy9kaXNwbGF5L0RPQ1MvV2hhdCtpcyt0aGUrQ29tcGFyZStPcmRlcitmb3IrQlNPTitUeXBlc1xuICAgIC8vIFhYWCB3aGF0IGlzIHRoZSBjb3JyZWN0IHNvcnQgcG9zaXRpb24gZm9yIEphdmFzY3JpcHQgY29kZT9cbiAgICAvLyAoJzEwMCcgaW4gdGhlIG1hdHJpeCBiZWxvdylcbiAgICAvLyBYWFggbWlua2V5L21heGtleVxuICAgIHJldHVybiBbLTEsICAvLyAobm90IGEgdHlwZSlcbiAgICAgICAgICAgIDEsICAgLy8gbnVtYmVyXG4gICAgICAgICAgICAyLCAgIC8vIHN0cmluZ1xuICAgICAgICAgICAgMywgICAvLyBvYmplY3RcbiAgICAgICAgICAgIDQsICAgLy8gYXJyYXlcbiAgICAgICAgICAgIDUsICAgLy8gYmluYXJ5XG4gICAgICAgICAgICAtMSwgIC8vIGRlcHJlY2F0ZWRcbiAgICAgICAgICAgIDYsICAgLy8gT2JqZWN0SURcbiAgICAgICAgICAgIDcsICAgLy8gYm9vbFxuICAgICAgICAgICAgOCwgICAvLyBEYXRlXG4gICAgICAgICAgICAwLCAgIC8vIG51bGxcbiAgICAgICAgICAgIDksICAgLy8gUmVnRXhwXG4gICAgICAgICAgICAtMSwgIC8vIGRlcHJlY2F0ZWRcbiAgICAgICAgICAgIDEwMCwgLy8gSlMgY29kZVxuICAgICAgICAgICAgMiwgICAvLyBkZXByZWNhdGVkIChzeW1ib2wpXG4gICAgICAgICAgICAxMDAsIC8vIEpTIGNvZGVcbiAgICAgICAgICAgIDEsICAgLy8gMzItYml0IGludFxuICAgICAgICAgICAgOCwgICAvLyBNb25nbyB0aW1lc3RhbXBcbiAgICAgICAgICAgIDEgICAgLy8gNjQtYml0IGludFxuICAgICAgICAgICBdW3RdO1xuICB9LFxuXG4gIC8vIGNvbXBhcmUgdHdvIHZhbHVlcyBvZiB1bmtub3duIHR5cGUgYWNjb3JkaW5nIHRvIEJTT04gb3JkZXJpbmdcbiAgLy8gc2VtYW50aWNzLiAoYXMgYW4gZXh0ZW5zaW9uLCBjb25zaWRlciAndW5kZWZpbmVkJyB0byBiZSBsZXNzIHRoYW5cbiAgLy8gYW55IG90aGVyIHZhbHVlLikgcmV0dXJuIG5lZ2F0aXZlIGlmIGEgaXMgbGVzcywgcG9zaXRpdmUgaWYgYiBpc1xuICAvLyBsZXNzLCBvciAwIGlmIGVxdWFsXG4gIF9jbXA6IGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgaWYgKGEgPT09IHVuZGVmaW5lZClcbiAgICAgIHJldHVybiBiID09PSB1bmRlZmluZWQgPyAwIDogLTE7XG4gICAgaWYgKGIgPT09IHVuZGVmaW5lZClcbiAgICAgIHJldHVybiAxO1xuICAgIHZhciB0YSA9IExvY2FsQ29sbGVjdGlvbi5fZi5fdHlwZShhKTtcbiAgICB2YXIgdGIgPSBMb2NhbENvbGxlY3Rpb24uX2YuX3R5cGUoYik7XG4gICAgdmFyIG9hID0gTG9jYWxDb2xsZWN0aW9uLl9mLl90eXBlb3JkZXIodGEpO1xuICAgIHZhciBvYiA9IExvY2FsQ29sbGVjdGlvbi5fZi5fdHlwZW9yZGVyKHRiKTtcbiAgICBpZiAob2EgIT09IG9iKVxuICAgICAgcmV0dXJuIG9hIDwgb2IgPyAtMSA6IDE7XG4gICAgaWYgKHRhICE9PSB0YilcbiAgICAgIC8vIFhYWCBuZWVkIHRvIGltcGxlbWVudCB0aGlzIGlmIHdlIGltcGxlbWVudCBTeW1ib2wgb3IgaW50ZWdlcnMsIG9yXG4gICAgICAvLyBUaW1lc3RhbXBcbiAgICAgIHRocm93IEVycm9yKFwiTWlzc2luZyB0eXBlIGNvZXJjaW9uIGxvZ2ljIGluIF9jbXBcIik7XG4gICAgaWYgKHRhID09PSA3KSB7IC8vIE9iamVjdElEXG4gICAgICAvLyBDb252ZXJ0IHRvIHN0cmluZy5cbiAgICAgIHRhID0gdGIgPSAyO1xuICAgICAgYSA9IGEudG9IZXhTdHJpbmcoKTtcbiAgICAgIGIgPSBiLnRvSGV4U3RyaW5nKCk7XG4gICAgfVxuICAgIGlmICh0YSA9PT0gOSkgeyAvLyBEYXRlXG4gICAgICAvLyBDb252ZXJ0IHRvIG1pbGxpcy5cbiAgICAgIHRhID0gdGIgPSAxO1xuICAgICAgYSA9IGEuZ2V0VGltZSgpO1xuICAgICAgYiA9IGIuZ2V0VGltZSgpO1xuICAgIH1cblxuICAgIGlmICh0YSA9PT0gMSkgLy8gZG91YmxlXG4gICAgICByZXR1cm4gYSAtIGI7XG4gICAgaWYgKHRiID09PSAyKSAvLyBzdHJpbmdcbiAgICAgIHJldHVybiBhIDwgYiA/IC0xIDogKGEgPT09IGIgPyAwIDogMSk7XG4gICAgaWYgKHRhID09PSAzKSB7IC8vIE9iamVjdFxuICAgICAgLy8gdGhpcyBjb3VsZCBiZSBtdWNoIG1vcmUgZWZmaWNpZW50IGluIHRoZSBleHBlY3RlZCBjYXNlIC4uLlxuICAgICAgdmFyIHRvX2FycmF5ID0gZnVuY3Rpb24gKG9iaikge1xuICAgICAgICB2YXIgcmV0ID0gW107XG4gICAgICAgIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICAgICAgICByZXQucHVzaChrZXkpO1xuICAgICAgICAgIHJldC5wdXNoKG9ialtrZXldKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgfTtcbiAgICAgIHJldHVybiBMb2NhbENvbGxlY3Rpb24uX2YuX2NtcCh0b19hcnJheShhKSwgdG9fYXJyYXkoYikpO1xuICAgIH1cbiAgICBpZiAodGEgPT09IDQpIHsgLy8gQXJyYXlcbiAgICAgIGZvciAodmFyIGkgPSAwOyA7IGkrKykge1xuICAgICAgICBpZiAoaSA9PT0gYS5sZW5ndGgpXG4gICAgICAgICAgcmV0dXJuIChpID09PSBiLmxlbmd0aCkgPyAwIDogLTE7XG4gICAgICAgIGlmIChpID09PSBiLmxlbmd0aClcbiAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgdmFyIHMgPSBMb2NhbENvbGxlY3Rpb24uX2YuX2NtcChhW2ldLCBiW2ldKTtcbiAgICAgICAgaWYgKHMgIT09IDApXG4gICAgICAgICAgcmV0dXJuIHM7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICh0YSA9PT0gNSkgeyAvLyBiaW5hcnlcbiAgICAgIC8vIFN1cnByaXNpbmdseSwgYSBzbWFsbCBiaW5hcnkgYmxvYiBpcyBhbHdheXMgbGVzcyB0aGFuIGEgbGFyZ2Ugb25lIGluXG4gICAgICAvLyBNb25nby5cbiAgICAgIGlmIChhLmxlbmd0aCAhPT0gYi5sZW5ndGgpXG4gICAgICAgIHJldHVybiBhLmxlbmd0aCAtIGIubGVuZ3RoO1xuICAgICAgZm9yIChpID0gMDsgaSA8IGEubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGFbaV0gPCBiW2ldKVxuICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgaWYgKGFbaV0gPiBiW2ldKVxuICAgICAgICAgIHJldHVybiAxO1xuICAgICAgfVxuICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICAgIGlmICh0YSA9PT0gOCkgeyAvLyBib29sZWFuXG4gICAgICBpZiAoYSkgcmV0dXJuIGIgPyAwIDogMTtcbiAgICAgIHJldHVybiBiID8gLTEgOiAwO1xuICAgIH1cbiAgICBpZiAodGEgPT09IDEwKSAvLyBudWxsXG4gICAgICByZXR1cm4gMDtcbiAgICBpZiAodGEgPT09IDExKSAvLyByZWdleHBcbiAgICAgIHRocm93IEVycm9yKFwiU29ydGluZyBub3Qgc3VwcG9ydGVkIG9uIHJlZ3VsYXIgZXhwcmVzc2lvblwiKTsgLy8gWFhYXG4gICAgLy8gMTM6IGphdmFzY3JpcHQgY29kZVxuICAgIC8vIDE0OiBzeW1ib2xcbiAgICAvLyAxNTogamF2YXNjcmlwdCBjb2RlIHdpdGggc2NvcGVcbiAgICAvLyAxNjogMzItYml0IGludGVnZXJcbiAgICAvLyAxNzogdGltZXN0YW1wXG4gICAgLy8gMTg6IDY0LWJpdCBpbnRlZ2VyXG4gICAgLy8gMjU1OiBtaW5rZXlcbiAgICAvLyAxMjc6IG1heGtleVxuICAgIGlmICh0YSA9PT0gMTMpIC8vIGphdmFzY3JpcHQgY29kZVxuICAgICAgdGhyb3cgRXJyb3IoXCJTb3J0aW5nIG5vdCBzdXBwb3J0ZWQgb24gSmF2YXNjcmlwdCBjb2RlXCIpOyAvLyBYWFhcbiAgICB0aHJvdyBFcnJvcihcIlVua25vd24gdHlwZSB0byBzb3J0XCIpO1xuICB9XG59O1xuXG4vLyBGb3IgdW5pdCB0ZXN0cy4gVHJ1ZSBpZiB0aGUgZ2l2ZW4gZG9jdW1lbnQgbWF0Y2hlcyB0aGUgZ2l2ZW5cbi8vIHNlbGVjdG9yLlxuTG9jYWxDb2xsZWN0aW9uLl9tYXRjaGVzID0gZnVuY3Rpb24gKHNlbGVjdG9yLCBkb2MpIHtcbiAgcmV0dXJuIChMb2NhbENvbGxlY3Rpb24uX2NvbXBpbGVTZWxlY3RvcihzZWxlY3RvcikpKGRvYyk7XG59O1xuXG4vLyBfbWFrZUxvb2t1cEZ1bmN0aW9uKGtleSkgcmV0dXJucyBhIGxvb2t1cCBmdW5jdGlvbi5cbi8vXG4vLyBBIGxvb2t1cCBmdW5jdGlvbiB0YWtlcyBpbiBhIGRvY3VtZW50IGFuZCByZXR1cm5zIGFuIGFycmF5IG9mIG1hdGNoaW5nXG4vLyB2YWx1ZXMuICBUaGlzIGFycmF5IGhhcyBtb3JlIHRoYW4gb25lIGVsZW1lbnQgaWYgYW55IHNlZ21lbnQgb2YgdGhlIGtleSBvdGhlclxuLy8gdGhhbiB0aGUgbGFzdCBvbmUgaXMgYW4gYXJyYXkuICBpZSwgYW55IGFycmF5cyBmb3VuZCB3aGVuIGRvaW5nIG5vbi1maW5hbFxuLy8gbG9va3VwcyByZXN1bHQgaW4gdGhpcyBmdW5jdGlvbiBcImJyYW5jaGluZ1wiOyBlYWNoIGVsZW1lbnQgaW4gdGhlIHJldHVybmVkXG4vLyBhcnJheSByZXByZXNlbnRzIHRoZSB2YWx1ZSBmb3VuZCBhdCB0aGlzIGJyYW5jaC4gSWYgYW55IGJyYW5jaCBkb2Vzbid0IGhhdmUgYVxuLy8gZmluYWwgdmFsdWUgZm9yIHRoZSBmdWxsIGtleSwgaXRzIGVsZW1lbnQgaW4gdGhlIHJldHVybmVkIGxpc3Qgd2lsbCBiZVxuLy8gdW5kZWZpbmVkLiBJdCBhbHdheXMgcmV0dXJucyBhIG5vbi1lbXB0eSBhcnJheS5cbi8vXG4vLyBfbWFrZUxvb2t1cEZ1bmN0aW9uKCdhLngnKSh7YToge3g6IDF9fSkgcmV0dXJucyBbMV1cbi8vIF9tYWtlTG9va3VwRnVuY3Rpb24oJ2EueCcpKHthOiB7eDogWzFdfX0pIHJldHVybnMgW1sxXV1cbi8vIF9tYWtlTG9va3VwRnVuY3Rpb24oJ2EueCcpKHthOiA1fSkgIHJldHVybnMgW3VuZGVmaW5lZF1cbi8vIF9tYWtlTG9va3VwRnVuY3Rpb24oJ2EueCcpKHthOiBbe3g6IDF9LFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7eDogWzJdfSxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3k6IDN9XX0pXG4vLyAgIHJldHVybnMgWzEsIFsyXSwgdW5kZWZpbmVkXVxuTG9jYWxDb2xsZWN0aW9uLl9tYWtlTG9va3VwRnVuY3Rpb24gPSBmdW5jdGlvbiAoa2V5KSB7XG4gIHZhciBkb3RMb2NhdGlvbiA9IGtleS5pbmRleE9mKCcuJyk7XG4gIHZhciBmaXJzdCwgbG9va3VwUmVzdCwgbmV4dElzTnVtZXJpYztcbiAgaWYgKGRvdExvY2F0aW9uID09PSAtMSkge1xuICAgIGZpcnN0ID0ga2V5O1xuICB9IGVsc2Uge1xuICAgIGZpcnN0ID0ga2V5LnN1YnN0cigwLCBkb3RMb2NhdGlvbik7XG4gICAgdmFyIHJlc3QgPSBrZXkuc3Vic3RyKGRvdExvY2F0aW9uICsgMSk7XG4gICAgbG9va3VwUmVzdCA9IExvY2FsQ29sbGVjdGlvbi5fbWFrZUxvb2t1cEZ1bmN0aW9uKHJlc3QpO1xuICAgIC8vIElzIHRoZSBuZXh0IChwZXJoYXBzIGZpbmFsKSBwaWVjZSBudW1lcmljIChpZSwgYW4gYXJyYXkgbG9va3VwPylcbiAgICBuZXh0SXNOdW1lcmljID0gL15cXGQrKFxcLnwkKS8udGVzdChyZXN0KTtcbiAgfVxuXG4gIHJldHVybiBmdW5jdGlvbiAoZG9jKSB7XG4gICAgaWYgKGRvYyA9PSBudWxsKSAgLy8gbnVsbCBvciB1bmRlZmluZWRcbiAgICAgIHJldHVybiBbdW5kZWZpbmVkXTtcbiAgICB2YXIgZmlyc3RMZXZlbCA9IGRvY1tmaXJzdF07XG5cbiAgICAvLyBXZSBkb24ndCBcImJyYW5jaFwiIGF0IHRoZSBmaW5hbCBsZXZlbC5cbiAgICBpZiAoIWxvb2t1cFJlc3QpXG4gICAgICByZXR1cm4gW2ZpcnN0TGV2ZWxdO1xuXG4gICAgLy8gSXQncyBhbiBlbXB0eSBhcnJheSwgYW5kIHdlJ3JlIG5vdCBkb25lOiB3ZSB3b24ndCBmaW5kIGFueXRoaW5nLlxuICAgIGlmIChpc0FycmF5KGZpcnN0TGV2ZWwpICYmIGZpcnN0TGV2ZWwubGVuZ3RoID09PSAwKVxuICAgICAgcmV0dXJuIFt1bmRlZmluZWRdO1xuXG4gICAgLy8gRm9yIGVhY2ggcmVzdWx0IGF0IHRoaXMgbGV2ZWwsIGZpbmlzaCB0aGUgbG9va3VwIG9uIHRoZSByZXN0IG9mIHRoZSBrZXksXG4gICAgLy8gYW5kIHJldHVybiBldmVyeXRoaW5nIHdlIGZpbmQuIEFsc28sIGlmIHRoZSBuZXh0IHJlc3VsdCBpcyBhIG51bWJlcixcbiAgICAvLyBkb24ndCBicmFuY2ggaGVyZS5cbiAgICAvL1xuICAgIC8vIFRlY2huaWNhbGx5LCBpbiBNb25nb0RCLCB3ZSBzaG91bGQgYmUgYWJsZSB0byBoYW5kbGUgdGhlIGNhc2Ugd2hlcmVcbiAgICAvLyBvYmplY3RzIGhhdmUgbnVtZXJpYyBrZXlzLCBidXQgTW9uZ28gZG9lc24ndCBhY3R1YWxseSBoYW5kbGUgdGhpc1xuICAgIC8vIGNvbnNpc3RlbnRseSB5ZXQgaXRzZWxmLCBzZWUgZWdcbiAgICAvLyBodHRwczovL2ppcmEubW9uZ29kYi5vcmcvYnJvd3NlL1NFUlZFUi0yODk4XG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL21vbmdvZGIvbW9uZ28vYmxvYi9tYXN0ZXIvanN0ZXN0cy9hcnJheV9tYXRjaDIuanNcbiAgICBpZiAoIWlzQXJyYXkoZmlyc3RMZXZlbCkgfHwgbmV4dElzTnVtZXJpYylcbiAgICAgIGZpcnN0TGV2ZWwgPSBbZmlyc3RMZXZlbF07XG4gICAgcmV0dXJuIEFycmF5LnByb3RvdHlwZS5jb25jYXQuYXBwbHkoW10sIF8ubWFwKGZpcnN0TGV2ZWwsIGxvb2t1cFJlc3QpKTtcbiAgfTtcbn07XG5cbi8vIFRoZSBtYWluIGNvbXBpbGF0aW9uIGZ1bmN0aW9uIGZvciBhIGdpdmVuIHNlbGVjdG9yLlxudmFyIGNvbXBpbGVEb2N1bWVudFNlbGVjdG9yID0gZnVuY3Rpb24gKGRvY1NlbGVjdG9yKSB7XG4gIHZhciBwZXJLZXlTZWxlY3RvcnMgPSBbXTtcbiAgXy5lYWNoKGRvY1NlbGVjdG9yLCBmdW5jdGlvbiAoc3ViU2VsZWN0b3IsIGtleSkge1xuICAgIGlmIChrZXkuc3Vic3RyKDAsIDEpID09PSAnJCcpIHtcbiAgICAgIC8vIE91dGVyIG9wZXJhdG9ycyBhcmUgZWl0aGVyIGxvZ2ljYWwgb3BlcmF0b3JzICh0aGV5IHJlY3Vyc2UgYmFjayBpbnRvXG4gICAgICAvLyB0aGlzIGZ1bmN0aW9uKSwgb3IgJHdoZXJlLlxuICAgICAgaWYgKCFfLmhhcyhMT0dJQ0FMX09QRVJBVE9SUywga2V5KSlcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5yZWNvZ25pemVkIGxvZ2ljYWwgb3BlcmF0b3I6IFwiICsga2V5KTtcbiAgICAgIHBlcktleVNlbGVjdG9ycy5wdXNoKExPR0lDQUxfT1BFUkFUT1JTW2tleV0oc3ViU2VsZWN0b3IpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGxvb2tVcEJ5SW5kZXggPSBMb2NhbENvbGxlY3Rpb24uX21ha2VMb29rdXBGdW5jdGlvbihrZXkpO1xuICAgICAgdmFyIHZhbHVlU2VsZWN0b3JGdW5jID0gY29tcGlsZVZhbHVlU2VsZWN0b3Ioc3ViU2VsZWN0b3IpO1xuICAgICAgcGVyS2V5U2VsZWN0b3JzLnB1c2goZnVuY3Rpb24gKGRvYykge1xuICAgICAgICB2YXIgYnJhbmNoVmFsdWVzID0gbG9va1VwQnlJbmRleChkb2MpO1xuICAgICAgICAvLyBXZSBhcHBseSB0aGUgc2VsZWN0b3IgdG8gZWFjaCBcImJyYW5jaGVkXCIgdmFsdWUgYW5kIHJldHVybiB0cnVlIGlmIGFueVxuICAgICAgICAvLyBtYXRjaC4gVGhpcyBpc24ndCAxMDAlIGNvbnNpc3RlbnQgd2l0aCBNb25nb0RCOyBlZywgc2VlOlxuICAgICAgICAvLyBodHRwczovL2ppcmEubW9uZ29kYi5vcmcvYnJvd3NlL1NFUlZFUi04NTg1XG4gICAgICAgIHJldHVybiBfLmFueShicmFuY2hWYWx1ZXMsIHZhbHVlU2VsZWN0b3JGdW5jKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfSk7XG5cblxuICByZXR1cm4gZnVuY3Rpb24gKGRvYykge1xuICAgIHJldHVybiBfLmFsbChwZXJLZXlTZWxlY3RvcnMsIGZ1bmN0aW9uIChmKSB7XG4gICAgICByZXR1cm4gZihkb2MpO1xuICAgIH0pO1xuICB9O1xufTtcblxuLy8gR2l2ZW4gYSBzZWxlY3RvciwgcmV0dXJuIGEgZnVuY3Rpb24gdGhhdCB0YWtlcyBvbmUgYXJndW1lbnQsIGFcbi8vIGRvY3VtZW50LCBhbmQgcmV0dXJucyB0cnVlIGlmIHRoZSBkb2N1bWVudCBtYXRjaGVzIHRoZSBzZWxlY3Rvcixcbi8vIGVsc2UgZmFsc2UuXG5Mb2NhbENvbGxlY3Rpb24uX2NvbXBpbGVTZWxlY3RvciA9IGZ1bmN0aW9uIChzZWxlY3Rvcikge1xuICAvLyB5b3UgY2FuIHBhc3MgYSBsaXRlcmFsIGZ1bmN0aW9uIGluc3RlYWQgb2YgYSBzZWxlY3RvclxuICBpZiAoc2VsZWN0b3IgaW5zdGFuY2VvZiBGdW5jdGlvbilcbiAgICByZXR1cm4gZnVuY3Rpb24gKGRvYykge3JldHVybiBzZWxlY3Rvci5jYWxsKGRvYyk7fTtcblxuICAvLyBzaG9ydGhhbmQgLS0gc2NhbGFycyBtYXRjaCBfaWRcbiAgaWYgKExvY2FsQ29sbGVjdGlvbi5fc2VsZWN0b3JJc0lkKHNlbGVjdG9yKSkge1xuICAgIHJldHVybiBmdW5jdGlvbiAoZG9jKSB7XG4gICAgICByZXR1cm4gRUpTT04uZXF1YWxzKGRvYy5faWQsIHNlbGVjdG9yKTtcbiAgICB9O1xuICB9XG5cbiAgLy8gcHJvdGVjdCBhZ2FpbnN0IGRhbmdlcm91cyBzZWxlY3RvcnMuICBmYWxzZXkgYW5kIHtfaWQ6IGZhbHNleX0gYXJlIGJvdGhcbiAgLy8gbGlrZWx5IHByb2dyYW1tZXIgZXJyb3IsIGFuZCBub3Qgd2hhdCB5b3Ugd2FudCwgcGFydGljdWxhcmx5IGZvclxuICAvLyBkZXN0cnVjdGl2ZSBvcGVyYXRpb25zLlxuICBpZiAoIXNlbGVjdG9yIHx8ICgoJ19pZCcgaW4gc2VsZWN0b3IpICYmICFzZWxlY3Rvci5faWQpKVxuICAgIHJldHVybiBmdW5jdGlvbiAoZG9jKSB7cmV0dXJuIGZhbHNlO307XG5cbiAgLy8gVG9wIGxldmVsIGNhbid0IGJlIGFuIGFycmF5IG9yIHRydWUgb3IgYmluYXJ5LlxuICBpZiAodHlwZW9mKHNlbGVjdG9yKSA9PT0gJ2Jvb2xlYW4nIHx8IGlzQXJyYXkoc2VsZWN0b3IpIHx8XG4gICAgICBFSlNPTi5pc0JpbmFyeShzZWxlY3RvcikpXG4gICAgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBzZWxlY3RvcjogXCIgKyBzZWxlY3Rvcik7XG5cbiAgcmV0dXJuIGNvbXBpbGVEb2N1bWVudFNlbGVjdG9yKHNlbGVjdG9yKTtcbn07XG5cbi8vIEdpdmUgYSBzb3J0IHNwZWMsIHdoaWNoIGNhbiBiZSBpbiBhbnkgb2YgdGhlc2UgZm9ybXM6XG4vLyAgIHtcImtleTFcIjogMSwgXCJrZXkyXCI6IC0xfVxuLy8gICBbW1wia2V5MVwiLCBcImFzY1wiXSwgW1wia2V5MlwiLCBcImRlc2NcIl1dXG4vLyAgIFtcImtleTFcIiwgW1wia2V5MlwiLCBcImRlc2NcIl1dXG4vL1xuLy8gKC4uIHdpdGggdGhlIGZpcnN0IGZvcm0gYmVpbmcgZGVwZW5kZW50IG9uIHRoZSBrZXkgZW51bWVyYXRpb25cbi8vIGJlaGF2aW9yIG9mIHlvdXIgamF2YXNjcmlwdCBWTSwgd2hpY2ggdXN1YWxseSBkb2VzIHdoYXQgeW91IG1lYW4gaW5cbi8vIHRoaXMgY2FzZSBpZiB0aGUga2V5IG5hbWVzIGRvbid0IGxvb2sgbGlrZSBpbnRlZ2VycyAuLilcbi8vXG4vLyByZXR1cm4gYSBmdW5jdGlvbiB0aGF0IHRha2VzIHR3byBvYmplY3RzLCBhbmQgcmV0dXJucyAtMSBpZiB0aGVcbi8vIGZpcnN0IG9iamVjdCBjb21lcyBmaXJzdCBpbiBvcmRlciwgMSBpZiB0aGUgc2Vjb25kIG9iamVjdCBjb21lc1xuLy8gZmlyc3QsIG9yIDAgaWYgbmVpdGhlciBvYmplY3QgY29tZXMgYmVmb3JlIHRoZSBvdGhlci5cblxuTG9jYWxDb2xsZWN0aW9uLl9jb21waWxlU29ydCA9IGZ1bmN0aW9uIChzcGVjKSB7XG4gIHZhciBzb3J0U3BlY1BhcnRzID0gW107XG5cbiAgaWYgKHNwZWMgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3BlYy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHR5cGVvZiBzcGVjW2ldID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIHNvcnRTcGVjUGFydHMucHVzaCh7XG4gICAgICAgICAgbG9va3VwOiBMb2NhbENvbGxlY3Rpb24uX21ha2VMb29rdXBGdW5jdGlvbihzcGVjW2ldKSxcbiAgICAgICAgICBhc2NlbmRpbmc6IHRydWVcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzb3J0U3BlY1BhcnRzLnB1c2goe1xuICAgICAgICAgIGxvb2t1cDogTG9jYWxDb2xsZWN0aW9uLl9tYWtlTG9va3VwRnVuY3Rpb24oc3BlY1tpXVswXSksXG4gICAgICAgICAgYXNjZW5kaW5nOiBzcGVjW2ldWzFdICE9PSBcImRlc2NcIlxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSBpZiAodHlwZW9mIHNwZWMgPT09IFwib2JqZWN0XCIpIHtcbiAgICBmb3IgKHZhciBrZXkgaW4gc3BlYykge1xuICAgICAgc29ydFNwZWNQYXJ0cy5wdXNoKHtcbiAgICAgICAgbG9va3VwOiBMb2NhbENvbGxlY3Rpb24uX21ha2VMb29rdXBGdW5jdGlvbihrZXkpLFxuICAgICAgICBhc2NlbmRpbmc6IHNwZWNba2V5XSA+PSAwXG4gICAgICB9KTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgRXJyb3IoXCJCYWQgc29ydCBzcGVjaWZpY2F0aW9uOiBcIiwgSlNPTi5zdHJpbmdpZnkoc3BlYykpO1xuICB9XG5cbiAgaWYgKHNvcnRTcGVjUGFydHMubGVuZ3RoID09PSAwKVxuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7cmV0dXJuIDA7fTtcblxuICAvLyByZWR1Y2VWYWx1ZSB0YWtlcyBpbiBhbGwgdGhlIHBvc3NpYmxlIHZhbHVlcyBmb3IgdGhlIHNvcnQga2V5IGFsb25nIHZhcmlvdXNcbiAgLy8gYnJhbmNoZXMsIGFuZCByZXR1cm5zIHRoZSBtaW4gb3IgbWF4IHZhbHVlIChhY2NvcmRpbmcgdG8gdGhlIGJvb2xcbiAgLy8gZmluZE1pbikuIEVhY2ggdmFsdWUgY2FuIGl0c2VsZiBiZSBhbiBhcnJheSwgYW5kIHdlIGxvb2sgYXQgaXRzIHZhbHVlc1xuICAvLyB0b28uIChpZSwgd2UgZG8gYSBzaW5nbGUgbGV2ZWwgb2YgZmxhdHRlbmluZyBvbiBicmFuY2hWYWx1ZXMsIHRoZW4gZmluZCB0aGVcbiAgLy8gbWluL21heC4pXG4gIHZhciByZWR1Y2VWYWx1ZSA9IGZ1bmN0aW9uIChicmFuY2hWYWx1ZXMsIGZpbmRNaW4pIHtcbiAgICB2YXIgcmVkdWNlZDtcbiAgICB2YXIgZmlyc3QgPSB0cnVlO1xuICAgIC8vIEl0ZXJhdGUgb3ZlciBhbGwgdGhlIHZhbHVlcyBmb3VuZCBpbiBhbGwgdGhlIGJyYW5jaGVzLCBhbmQgaWYgYSB2YWx1ZSBpc1xuICAgIC8vIGFuIGFycmF5IGl0c2VsZiwgaXRlcmF0ZSBvdmVyIHRoZSB2YWx1ZXMgaW4gdGhlIGFycmF5IHNlcGFyYXRlbHkuXG4gICAgXy5lYWNoKGJyYW5jaFZhbHVlcywgZnVuY3Rpb24gKGJyYW5jaFZhbHVlKSB7XG4gICAgICAvLyBWYWx1ZSBub3QgYW4gYXJyYXk/IFByZXRlbmQgaXQgaXMuXG4gICAgICBpZiAoIWlzQXJyYXkoYnJhbmNoVmFsdWUpKVxuICAgICAgICBicmFuY2hWYWx1ZSA9IFticmFuY2hWYWx1ZV07XG4gICAgICAvLyBWYWx1ZSBpcyBhbiBlbXB0eSBhcnJheT8gUHJldGVuZCBpdCB3YXMgbWlzc2luZywgc2luY2UgdGhhdCdzIHdoZXJlIGl0XG4gICAgICAvLyBzaG91bGQgYmUgc29ydGVkLlxuICAgICAgaWYgKGlzQXJyYXkoYnJhbmNoVmFsdWUpICYmIGJyYW5jaFZhbHVlLmxlbmd0aCA9PT0gMClcbiAgICAgICAgYnJhbmNoVmFsdWUgPSBbdW5kZWZpbmVkXTtcbiAgICAgIF8uZWFjaChicmFuY2hWYWx1ZSwgZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIC8vIFdlIHNob3VsZCBnZXQgaGVyZSBhdCBsZWFzdCBvbmNlOiBsb29rdXAgZnVuY3Rpb25zIHJldHVybiBub24tZW1wdHlcbiAgICAgICAgLy8gYXJyYXlzLCBzbyB0aGUgb3V0ZXIgbG9vcCBydW5zIGF0IGxlYXN0IG9uY2UsIGFuZCB3ZSBwcmV2ZW50ZWRcbiAgICAgICAgLy8gYnJhbmNoVmFsdWUgZnJvbSBiZWluZyBhbiBlbXB0eSBhcnJheS5cbiAgICAgICAgaWYgKGZpcnN0KSB7XG4gICAgICAgICAgcmVkdWNlZCA9IHZhbHVlO1xuICAgICAgICAgIGZpcnN0ID0gZmFsc2U7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gQ29tcGFyZSB0aGUgdmFsdWUgd2UgZm91bmQgdG8gdGhlIHZhbHVlIHdlIGZvdW5kIHNvIGZhciwgc2F2aW5nIGl0XG4gICAgICAgICAgLy8gaWYgaXQncyBsZXNzIChmb3IgYW4gYXNjZW5kaW5nIHNvcnQpIG9yIG1vcmUgKGZvciBhIGRlc2NlbmRpbmdcbiAgICAgICAgICAvLyBzb3J0KS5cbiAgICAgICAgICB2YXIgY21wID0gTG9jYWxDb2xsZWN0aW9uLl9mLl9jbXAocmVkdWNlZCwgdmFsdWUpO1xuICAgICAgICAgIGlmICgoZmluZE1pbiAmJiBjbXAgPiAwKSB8fCAoIWZpbmRNaW4gJiYgY21wIDwgMCkpXG4gICAgICAgICAgICByZWR1Y2VkID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIHJldHVybiByZWR1Y2VkO1xuICB9O1xuXG4gIHJldHVybiBmdW5jdGlvbiAoYSwgYikge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc29ydFNwZWNQYXJ0cy5sZW5ndGg7ICsraSkge1xuICAgICAgdmFyIHNwZWNQYXJ0ID0gc29ydFNwZWNQYXJ0c1tpXTtcbiAgICAgIHZhciBhVmFsdWUgPSByZWR1Y2VWYWx1ZShzcGVjUGFydC5sb29rdXAoYSksIHNwZWNQYXJ0LmFzY2VuZGluZyk7XG4gICAgICB2YXIgYlZhbHVlID0gcmVkdWNlVmFsdWUoc3BlY1BhcnQubG9va3VwKGIpLCBzcGVjUGFydC5hc2NlbmRpbmcpO1xuICAgICAgdmFyIGNvbXBhcmUgPSBMb2NhbENvbGxlY3Rpb24uX2YuX2NtcChhVmFsdWUsIGJWYWx1ZSk7XG4gICAgICBpZiAoY29tcGFyZSAhPT0gMClcbiAgICAgICAgcmV0dXJuIHNwZWNQYXJ0LmFzY2VuZGluZyA/IGNvbXBhcmUgOiAtY29tcGFyZTtcbiAgICB9O1xuICAgIHJldHVybiAwO1xuICB9O1xufTtcblxuZXhwb3J0cy5jb21waWxlRG9jdW1lbnRTZWxlY3RvciA9IGNvbXBpbGVEb2N1bWVudFNlbGVjdG9yO1xuZXhwb3J0cy5jb21waWxlU29ydCA9IExvY2FsQ29sbGVjdGlvbi5fY29tcGlsZVNvcnQ7IiwiRUpTT04gPSB7fTsgLy8gR2xvYmFsIVxudmFyIGN1c3RvbVR5cGVzID0ge307XG4vLyBBZGQgYSBjdXN0b20gdHlwZSwgdXNpbmcgYSBtZXRob2Qgb2YgeW91ciBjaG9pY2UgdG8gZ2V0IHRvIGFuZFxuLy8gZnJvbSBhIGJhc2ljIEpTT04tYWJsZSByZXByZXNlbnRhdGlvbi4gIFRoZSBmYWN0b3J5IGFyZ3VtZW50XG4vLyBpcyBhIGZ1bmN0aW9uIG9mIEpTT04tYWJsZSAtLT4geW91ciBvYmplY3Rcbi8vIFRoZSB0eXBlIHlvdSBhZGQgbXVzdCBoYXZlOlxuLy8gLSBBIGNsb25lKCkgbWV0aG9kLCBzbyB0aGF0IE1ldGVvciBjYW4gZGVlcC1jb3B5IGl0IHdoZW4gbmVjZXNzYXJ5LlxuLy8gLSBBIGVxdWFscygpIG1ldGhvZCwgc28gdGhhdCBNZXRlb3IgY2FuIGNvbXBhcmUgaXRcbi8vIC0gQSB0b0pTT05WYWx1ZSgpIG1ldGhvZCwgc28gdGhhdCBNZXRlb3IgY2FuIHNlcmlhbGl6ZSBpdFxuLy8gLSBhIHR5cGVOYW1lKCkgbWV0aG9kLCB0byBzaG93IGhvdyB0byBsb29rIGl0IHVwIGluIG91ciB0eXBlIHRhYmxlLlxuLy8gSXQgaXMgb2theSBpZiB0aGVzZSBtZXRob2RzIGFyZSBtb25rZXktcGF0Y2hlZCBvbi5cbkVKU09OLmFkZFR5cGUgPSBmdW5jdGlvbiAobmFtZSwgZmFjdG9yeSkge1xuICBpZiAoXy5oYXMoY3VzdG9tVHlwZXMsIG5hbWUpKVxuICAgIHRocm93IG5ldyBFcnJvcihcIlR5cGUgXCIgKyBuYW1lICsgXCIgYWxyZWFkeSBwcmVzZW50XCIpO1xuICBjdXN0b21UeXBlc1tuYW1lXSA9IGZhY3Rvcnk7XG59O1xuXG52YXIgYnVpbHRpbkNvbnZlcnRlcnMgPSBbXG4gIHsgLy8gRGF0ZVxuICAgIG1hdGNoSlNPTlZhbHVlOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICByZXR1cm4gXy5oYXMob2JqLCAnJGRhdGUnKSAmJiBfLnNpemUob2JqKSA9PT0gMTtcbiAgICB9LFxuICAgIG1hdGNoT2JqZWN0OiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICByZXR1cm4gb2JqIGluc3RhbmNlb2YgRGF0ZTtcbiAgICB9LFxuICAgIHRvSlNPTlZhbHVlOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICByZXR1cm4geyRkYXRlOiBvYmouZ2V0VGltZSgpfTtcbiAgICB9LFxuICAgIGZyb21KU09OVmFsdWU6IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgIHJldHVybiBuZXcgRGF0ZShvYmouJGRhdGUpO1xuICAgIH1cbiAgfSxcbiAgeyAvLyBCaW5hcnlcbiAgICBtYXRjaEpTT05WYWx1ZTogZnVuY3Rpb24gKG9iaikge1xuICAgICAgcmV0dXJuIF8uaGFzKG9iaiwgJyRiaW5hcnknKSAmJiBfLnNpemUob2JqKSA9PT0gMTtcbiAgICB9LFxuICAgIG1hdGNoT2JqZWN0OiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICByZXR1cm4gdHlwZW9mIFVpbnQ4QXJyYXkgIT09ICd1bmRlZmluZWQnICYmIG9iaiBpbnN0YW5jZW9mIFVpbnQ4QXJyYXlcbiAgICAgICAgfHwgKG9iaiAmJiBfLmhhcyhvYmosICckVWludDhBcnJheVBvbHlmaWxsJykpO1xuICAgIH0sXG4gICAgdG9KU09OVmFsdWU6IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgIHJldHVybiB7JGJpbmFyeTogRUpTT04uX2Jhc2U2NEVuY29kZShvYmopfTtcbiAgICB9LFxuICAgIGZyb21KU09OVmFsdWU6IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgIHJldHVybiBFSlNPTi5fYmFzZTY0RGVjb2RlKG9iai4kYmluYXJ5KTtcbiAgICB9XG4gIH0sXG4gIHsgLy8gRXNjYXBpbmcgb25lIGxldmVsXG4gICAgbWF0Y2hKU09OVmFsdWU6IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgIHJldHVybiBfLmhhcyhvYmosICckZXNjYXBlJykgJiYgXy5zaXplKG9iaikgPT09IDE7XG4gICAgfSxcbiAgICBtYXRjaE9iamVjdDogZnVuY3Rpb24gKG9iaikge1xuICAgICAgaWYgKF8uaXNFbXB0eShvYmopIHx8IF8uc2l6ZShvYmopID4gMikge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICByZXR1cm4gXy5hbnkoYnVpbHRpbkNvbnZlcnRlcnMsIGZ1bmN0aW9uIChjb252ZXJ0ZXIpIHtcbiAgICAgICAgcmV0dXJuIGNvbnZlcnRlci5tYXRjaEpTT05WYWx1ZShvYmopO1xuICAgICAgfSk7XG4gICAgfSxcbiAgICB0b0pTT05WYWx1ZTogZnVuY3Rpb24gKG9iaikge1xuICAgICAgdmFyIG5ld09iaiA9IHt9O1xuICAgICAgXy5lYWNoKG9iaiwgZnVuY3Rpb24gKHZhbHVlLCBrZXkpIHtcbiAgICAgICAgbmV3T2JqW2tleV0gPSBFSlNPTi50b0pTT05WYWx1ZSh2YWx1ZSk7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiB7JGVzY2FwZTogbmV3T2JqfTtcbiAgICB9LFxuICAgIGZyb21KU09OVmFsdWU6IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgIHZhciBuZXdPYmogPSB7fTtcbiAgICAgIF8uZWFjaChvYmouJGVzY2FwZSwgZnVuY3Rpb24gKHZhbHVlLCBrZXkpIHtcbiAgICAgICAgbmV3T2JqW2tleV0gPSBFSlNPTi5mcm9tSlNPTlZhbHVlKHZhbHVlKTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIG5ld09iajtcbiAgICB9XG4gIH0sXG4gIHsgLy8gQ3VzdG9tXG4gICAgbWF0Y2hKU09OVmFsdWU6IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgIHJldHVybiBfLmhhcyhvYmosICckdHlwZScpICYmIF8uaGFzKG9iaiwgJyR2YWx1ZScpICYmIF8uc2l6ZShvYmopID09PSAyO1xuICAgIH0sXG4gICAgbWF0Y2hPYmplY3Q6IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgIHJldHVybiBFSlNPTi5faXNDdXN0b21UeXBlKG9iaik7XG4gICAgfSxcbiAgICB0b0pTT05WYWx1ZTogZnVuY3Rpb24gKG9iaikge1xuICAgICAgcmV0dXJuIHskdHlwZTogb2JqLnR5cGVOYW1lKCksICR2YWx1ZTogb2JqLnRvSlNPTlZhbHVlKCl9O1xuICAgIH0sXG4gICAgZnJvbUpTT05WYWx1ZTogZnVuY3Rpb24gKG9iaikge1xuICAgICAgdmFyIHR5cGVOYW1lID0gb2JqLiR0eXBlO1xuICAgICAgdmFyIGNvbnZlcnRlciA9IGN1c3RvbVR5cGVzW3R5cGVOYW1lXTtcbiAgICAgIHJldHVybiBjb252ZXJ0ZXIob2JqLiR2YWx1ZSk7XG4gICAgfVxuICB9XG5dO1xuXG5FSlNPTi5faXNDdXN0b21UeXBlID0gZnVuY3Rpb24gKG9iaikge1xuICByZXR1cm4gb2JqICYmXG4gICAgdHlwZW9mIG9iai50b0pTT05WYWx1ZSA9PT0gJ2Z1bmN0aW9uJyAmJlxuICAgIHR5cGVvZiBvYmoudHlwZU5hbWUgPT09ICdmdW5jdGlvbicgJiZcbiAgICBfLmhhcyhjdXN0b21UeXBlcywgb2JqLnR5cGVOYW1lKCkpO1xufTtcblxuXG4vL2ZvciBib3RoIGFycmF5cyBhbmQgb2JqZWN0cywgaW4tcGxhY2UgbW9kaWZpY2F0aW9uLlxudmFyIGFkanVzdFR5cGVzVG9KU09OVmFsdWUgPVxuRUpTT04uX2FkanVzdFR5cGVzVG9KU09OVmFsdWUgPSBmdW5jdGlvbiAob2JqKSB7XG4gIGlmIChvYmogPT09IG51bGwpXG4gICAgcmV0dXJuIG51bGw7XG4gIHZhciBtYXliZUNoYW5nZWQgPSB0b0pTT05WYWx1ZUhlbHBlcihvYmopO1xuICBpZiAobWF5YmVDaGFuZ2VkICE9PSB1bmRlZmluZWQpXG4gICAgcmV0dXJuIG1heWJlQ2hhbmdlZDtcbiAgXy5lYWNoKG9iaiwgZnVuY3Rpb24gKHZhbHVlLCBrZXkpIHtcbiAgICBpZiAodHlwZW9mIHZhbHVlICE9PSAnb2JqZWN0JyAmJiB2YWx1ZSAhPT0gdW5kZWZpbmVkKVxuICAgICAgcmV0dXJuOyAvLyBjb250aW51ZVxuICAgIHZhciBjaGFuZ2VkID0gdG9KU09OVmFsdWVIZWxwZXIodmFsdWUpO1xuICAgIGlmIChjaGFuZ2VkKSB7XG4gICAgICBvYmpba2V5XSA9IGNoYW5nZWQ7XG4gICAgICByZXR1cm47IC8vIG9uIHRvIHRoZSBuZXh0IGtleVxuICAgIH1cbiAgICAvLyBpZiB3ZSBnZXQgaGVyZSwgdmFsdWUgaXMgYW4gb2JqZWN0IGJ1dCBub3QgYWRqdXN0YWJsZVxuICAgIC8vIGF0IHRoaXMgbGV2ZWwuICByZWN1cnNlLlxuICAgIGFkanVzdFR5cGVzVG9KU09OVmFsdWUodmFsdWUpO1xuICB9KTtcbiAgcmV0dXJuIG9iajtcbn07XG5cbi8vIEVpdGhlciByZXR1cm4gdGhlIEpTT04tY29tcGF0aWJsZSB2ZXJzaW9uIG9mIHRoZSBhcmd1bWVudCwgb3IgdW5kZWZpbmVkIChpZlxuLy8gdGhlIGl0ZW0gaXNuJ3QgaXRzZWxmIHJlcGxhY2VhYmxlLCBidXQgbWF5YmUgc29tZSBmaWVsZHMgaW4gaXQgYXJlKVxudmFyIHRvSlNPTlZhbHVlSGVscGVyID0gZnVuY3Rpb24gKGl0ZW0pIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBidWlsdGluQ29udmVydGVycy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBjb252ZXJ0ZXIgPSBidWlsdGluQ29udmVydGVyc1tpXTtcbiAgICBpZiAoY29udmVydGVyLm1hdGNoT2JqZWN0KGl0ZW0pKSB7XG4gICAgICByZXR1cm4gY29udmVydGVyLnRvSlNPTlZhbHVlKGl0ZW0pO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdW5kZWZpbmVkO1xufTtcblxuRUpTT04udG9KU09OVmFsdWUgPSBmdW5jdGlvbiAoaXRlbSkge1xuICB2YXIgY2hhbmdlZCA9IHRvSlNPTlZhbHVlSGVscGVyKGl0ZW0pO1xuICBpZiAoY2hhbmdlZCAhPT0gdW5kZWZpbmVkKVxuICAgIHJldHVybiBjaGFuZ2VkO1xuICBpZiAodHlwZW9mIGl0ZW0gPT09ICdvYmplY3QnKSB7XG4gICAgaXRlbSA9IEVKU09OLmNsb25lKGl0ZW0pO1xuICAgIGFkanVzdFR5cGVzVG9KU09OVmFsdWUoaXRlbSk7XG4gIH1cbiAgcmV0dXJuIGl0ZW07XG59O1xuXG4vL2ZvciBib3RoIGFycmF5cyBhbmQgb2JqZWN0cy4gVHJpZXMgaXRzIGJlc3QgdG8ganVzdFxuLy8gdXNlIHRoZSBvYmplY3QgeW91IGhhbmQgaXQsIGJ1dCBtYXkgcmV0dXJuIHNvbWV0aGluZ1xuLy8gZGlmZmVyZW50IGlmIHRoZSBvYmplY3QgeW91IGhhbmQgaXQgaXRzZWxmIG5lZWRzIGNoYW5naW5nLlxudmFyIGFkanVzdFR5cGVzRnJvbUpTT05WYWx1ZSA9XG5FSlNPTi5fYWRqdXN0VHlwZXNGcm9tSlNPTlZhbHVlID0gZnVuY3Rpb24gKG9iaikge1xuICBpZiAob2JqID09PSBudWxsKVxuICAgIHJldHVybiBudWxsO1xuICB2YXIgbWF5YmVDaGFuZ2VkID0gZnJvbUpTT05WYWx1ZUhlbHBlcihvYmopO1xuICBpZiAobWF5YmVDaGFuZ2VkICE9PSBvYmopXG4gICAgcmV0dXJuIG1heWJlQ2hhbmdlZDtcbiAgXy5lYWNoKG9iaiwgZnVuY3Rpb24gKHZhbHVlLCBrZXkpIHtcbiAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnb2JqZWN0Jykge1xuICAgICAgdmFyIGNoYW5nZWQgPSBmcm9tSlNPTlZhbHVlSGVscGVyKHZhbHVlKTtcbiAgICAgIGlmICh2YWx1ZSAhPT0gY2hhbmdlZCkge1xuICAgICAgICBvYmpba2V5XSA9IGNoYW5nZWQ7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIC8vIGlmIHdlIGdldCBoZXJlLCB2YWx1ZSBpcyBhbiBvYmplY3QgYnV0IG5vdCBhZGp1c3RhYmxlXG4gICAgICAvLyBhdCB0aGlzIGxldmVsLiAgcmVjdXJzZS5cbiAgICAgIGFkanVzdFR5cGVzRnJvbUpTT05WYWx1ZSh2YWx1ZSk7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIG9iajtcbn07XG5cbi8vIEVpdGhlciByZXR1cm4gdGhlIGFyZ3VtZW50IGNoYW5nZWQgdG8gaGF2ZSB0aGUgbm9uLWpzb25cbi8vIHJlcCBvZiBpdHNlbGYgKHRoZSBPYmplY3QgdmVyc2lvbikgb3IgdGhlIGFyZ3VtZW50IGl0c2VsZi5cblxuLy8gRE9FUyBOT1QgUkVDVVJTRS4gIEZvciBhY3R1YWxseSBnZXR0aW5nIHRoZSBmdWxseS1jaGFuZ2VkIHZhbHVlLCB1c2Vcbi8vIEVKU09OLmZyb21KU09OVmFsdWVcbnZhciBmcm9tSlNPTlZhbHVlSGVscGVyID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gIGlmICh0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIHZhbHVlICE9PSBudWxsKSB7XG4gICAgaWYgKF8uc2l6ZSh2YWx1ZSkgPD0gMlxuICAgICAgICAmJiBfLmFsbCh2YWx1ZSwgZnVuY3Rpb24gKHYsIGspIHtcbiAgICAgICAgICByZXR1cm4gdHlwZW9mIGsgPT09ICdzdHJpbmcnICYmIGsuc3Vic3RyKDAsIDEpID09PSAnJCc7XG4gICAgICAgIH0pKSB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGJ1aWx0aW5Db252ZXJ0ZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBjb252ZXJ0ZXIgPSBidWlsdGluQ29udmVydGVyc1tpXTtcbiAgICAgICAgaWYgKGNvbnZlcnRlci5tYXRjaEpTT05WYWx1ZSh2YWx1ZSkpIHtcbiAgICAgICAgICByZXR1cm4gY29udmVydGVyLmZyb21KU09OVmFsdWUodmFsdWUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiB2YWx1ZTtcbn07XG5cbkVKU09OLmZyb21KU09OVmFsdWUgPSBmdW5jdGlvbiAoaXRlbSkge1xuICB2YXIgY2hhbmdlZCA9IGZyb21KU09OVmFsdWVIZWxwZXIoaXRlbSk7XG4gIGlmIChjaGFuZ2VkID09PSBpdGVtICYmIHR5cGVvZiBpdGVtID09PSAnb2JqZWN0Jykge1xuICAgIGl0ZW0gPSBFSlNPTi5jbG9uZShpdGVtKTtcbiAgICBhZGp1c3RUeXBlc0Zyb21KU09OVmFsdWUoaXRlbSk7XG4gICAgcmV0dXJuIGl0ZW07XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGNoYW5nZWQ7XG4gIH1cbn07XG5cbkVKU09OLnN0cmluZ2lmeSA9IGZ1bmN0aW9uIChpdGVtKSB7XG4gIHJldHVybiBKU09OLnN0cmluZ2lmeShFSlNPTi50b0pTT05WYWx1ZShpdGVtKSk7XG59O1xuXG5FSlNPTi5wYXJzZSA9IGZ1bmN0aW9uIChpdGVtKSB7XG4gIHJldHVybiBFSlNPTi5mcm9tSlNPTlZhbHVlKEpTT04ucGFyc2UoaXRlbSkpO1xufTtcblxuRUpTT04uaXNCaW5hcnkgPSBmdW5jdGlvbiAob2JqKSB7XG4gIHJldHVybiAodHlwZW9mIFVpbnQ4QXJyYXkgIT09ICd1bmRlZmluZWQnICYmIG9iaiBpbnN0YW5jZW9mIFVpbnQ4QXJyYXkpIHx8XG4gICAgKG9iaiAmJiBvYmouJFVpbnQ4QXJyYXlQb2x5ZmlsbCk7XG59O1xuXG5FSlNPTi5lcXVhbHMgPSBmdW5jdGlvbiAoYSwgYiwgb3B0aW9ucykge1xuICB2YXIgaTtcbiAgdmFyIGtleU9yZGVyU2Vuc2l0aXZlID0gISEob3B0aW9ucyAmJiBvcHRpb25zLmtleU9yZGVyU2Vuc2l0aXZlKTtcbiAgaWYgKGEgPT09IGIpXG4gICAgcmV0dXJuIHRydWU7XG4gIGlmICghYSB8fCAhYikgLy8gaWYgZWl0aGVyIG9uZSBpcyBmYWxzeSwgdGhleSdkIGhhdmUgdG8gYmUgPT09IHRvIGJlIGVxdWFsXG4gICAgcmV0dXJuIGZhbHNlO1xuICBpZiAoISh0eXBlb2YgYSA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIGIgPT09ICdvYmplY3QnKSlcbiAgICByZXR1cm4gZmFsc2U7XG4gIGlmIChhIGluc3RhbmNlb2YgRGF0ZSAmJiBiIGluc3RhbmNlb2YgRGF0ZSlcbiAgICByZXR1cm4gYS52YWx1ZU9mKCkgPT09IGIudmFsdWVPZigpO1xuICBpZiAoRUpTT04uaXNCaW5hcnkoYSkgJiYgRUpTT04uaXNCaW5hcnkoYikpIHtcbiAgICBpZiAoYS5sZW5ndGggIT09IGIubGVuZ3RoKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIGZvciAoaSA9IDA7IGkgPCBhLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoYVtpXSAhPT0gYltpXSlcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICBpZiAodHlwZW9mIChhLmVxdWFscykgPT09ICdmdW5jdGlvbicpXG4gICAgcmV0dXJuIGEuZXF1YWxzKGIsIG9wdGlvbnMpO1xuICBpZiAoYSBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgaWYgKCEoYiBpbnN0YW5jZW9mIEFycmF5KSlcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICBpZiAoYS5sZW5ndGggIT09IGIubGVuZ3RoKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIGZvciAoaSA9IDA7IGkgPCBhLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoIUVKU09OLmVxdWFscyhhW2ldLCBiW2ldLCBvcHRpb25zKSlcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICAvLyBmYWxsIGJhY2sgdG8gc3RydWN0dXJhbCBlcXVhbGl0eSBvZiBvYmplY3RzXG4gIHZhciByZXQ7XG4gIGlmIChrZXlPcmRlclNlbnNpdGl2ZSkge1xuICAgIHZhciBiS2V5cyA9IFtdO1xuICAgIF8uZWFjaChiLCBmdW5jdGlvbiAodmFsLCB4KSB7XG4gICAgICAgIGJLZXlzLnB1c2goeCk7XG4gICAgfSk7XG4gICAgaSA9IDA7XG4gICAgcmV0ID0gXy5hbGwoYSwgZnVuY3Rpb24gKHZhbCwgeCkge1xuICAgICAgaWYgKGkgPj0gYktleXMubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGlmICh4ICE9PSBiS2V5c1tpXSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBpZiAoIUVKU09OLmVxdWFscyh2YWwsIGJbYktleXNbaV1dLCBvcHRpb25zKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBpKys7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9KTtcbiAgICByZXR1cm4gcmV0ICYmIGkgPT09IGJLZXlzLmxlbmd0aDtcbiAgfSBlbHNlIHtcbiAgICBpID0gMDtcbiAgICByZXQgPSBfLmFsbChhLCBmdW5jdGlvbiAodmFsLCBrZXkpIHtcbiAgICAgIGlmICghXy5oYXMoYiwga2V5KSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBpZiAoIUVKU09OLmVxdWFscyh2YWwsIGJba2V5XSwgb3B0aW9ucykpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgaSsrO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSk7XG4gICAgcmV0dXJuIHJldCAmJiBfLnNpemUoYikgPT09IGk7XG4gIH1cbn07XG5cbkVKU09OLmNsb25lID0gZnVuY3Rpb24gKHYpIHtcbiAgdmFyIHJldDtcbiAgaWYgKHR5cGVvZiB2ICE9PSBcIm9iamVjdFwiKVxuICAgIHJldHVybiB2O1xuICBpZiAodiA9PT0gbnVsbClcbiAgICByZXR1cm4gbnVsbDsgLy8gbnVsbCBoYXMgdHlwZW9mIFwib2JqZWN0XCJcbiAgaWYgKHYgaW5zdGFuY2VvZiBEYXRlKVxuICAgIHJldHVybiBuZXcgRGF0ZSh2LmdldFRpbWUoKSk7XG4gIGlmIChFSlNPTi5pc0JpbmFyeSh2KSkge1xuICAgIHJldCA9IEVKU09OLm5ld0JpbmFyeSh2Lmxlbmd0aCk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB2Lmxlbmd0aDsgaSsrKSB7XG4gICAgICByZXRbaV0gPSB2W2ldO1xuICAgIH1cbiAgICByZXR1cm4gcmV0O1xuICB9XG4gIGlmIChfLmlzQXJyYXkodikgfHwgXy5pc0FyZ3VtZW50cyh2KSkge1xuICAgIC8vIEZvciBzb21lIHJlYXNvbiwgXy5tYXAgZG9lc24ndCB3b3JrIGluIHRoaXMgY29udGV4dCBvbiBPcGVyYSAod2VpcmQgdGVzdFxuICAgIC8vIGZhaWx1cmVzKS5cbiAgICByZXQgPSBbXTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgdi5sZW5ndGg7IGkrKylcbiAgICAgIHJldFtpXSA9IEVKU09OLmNsb25lKHZbaV0pO1xuICAgIHJldHVybiByZXQ7XG4gIH1cbiAgLy8gaGFuZGxlIGdlbmVyYWwgdXNlci1kZWZpbmVkIHR5cGVkIE9iamVjdHMgaWYgdGhleSBoYXZlIGEgY2xvbmUgbWV0aG9kXG4gIGlmICh0eXBlb2Ygdi5jbG9uZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiB2LmNsb25lKCk7XG4gIH1cbiAgLy8gaGFuZGxlIG90aGVyIG9iamVjdHNcbiAgcmV0ID0ge307XG4gIF8uZWFjaCh2LCBmdW5jdGlvbiAodmFsdWUsIGtleSkge1xuICAgIHJldFtrZXldID0gRUpTT04uY2xvbmUodmFsdWUpO1xuICB9KTtcbiAgcmV0dXJuIHJldDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRUpTT047Il19
;