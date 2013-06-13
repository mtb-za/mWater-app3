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


},{"../app/js/LocationView":9,"./helpers/UIDriver":10}],"forms":[function(require,module,exports){
module.exports=require('EAVIrc');
},{}],"EAVIrc":[function(require,module,exports){
(function() {
  var Form, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  exports.Form = Form = (function(_super) {
    __extends(Form, _super);

    function Form() {
      _ref = Form.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    Form.prototype.initialize = function(options) {
      var view, _i, _len, _ref1,
        _this = this;
      _ref1 = options.view;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        view = _ref1[_i];
        this.el.append(view.el);
        this.listenTo(view, 'close', function() {
          return _this.trigger('close');
        });
      }
      return this.model.listenTo('change', function() {
        return _this.trigger('change');
      });
    };

    Form.prototype.load = function(data) {
      this.model.clear({
        silent: true
      });
      return this.model.set(data);
    };

    Form.prototype.save = function() {
      return this.model.toJSON();
    };

    return Form;

  })(Backbone.View);

  _.extend(exports, require('./form-controls'));

}).call(this);


},{"./form-controls":11}],2:[function(require,module,exports){
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


},{}],5:[function(require,module,exports){
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


},{"../app/js/GeoJSON":7}],9:[function(require,module,exports){
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


},{"./LocationFinder":12,"./GeoJSON":7}],4:[function(require,module,exports){
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


},{"./selector":13,"../GeoJSON":7}],11:[function(require,module,exports){
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
            if (this.options.onFinish)
                this.options.onFinish();
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

exports.DateQuestion = exports.Question.extend({
    events : {
        "change" : "changed"
    },

    changed : function() {
        this.model.set(this.id, this.$el.find('input[name="date"]').val());
    },
    renderAnswer : function(answerEl) {
        answerEl.html(_.template('<input class="needsclick" name="date" />', this));

        answerEl.find('input').val(this.model.get(this.id));

        answerEl.find('input').scroller({
            preset : 'date',
            theme : 'ios',
            display : 'modal',
            mode : 'scroller',
            dateOrder : 'mmD ddyy',
        });
    },

});

},{}],12:[function(require,module,exports){
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


},{}],13:[function(require,module,exports){
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
},{"./EJSON":14}],14:[function(require,module,exports){
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
},{}]},{},[1,3,6,8])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL3Rlc3QvSXRlbVRyYWNrZXJUZXN0cy5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL3Rlc3QvTG9jYWxEYlRlc3RzLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvdGVzdC9HZW9KU09OVGVzdHMuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My90ZXN0L0xvY2F0aW9uVmlld1Rlc3RzLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL2Zvcm1zL2luZGV4LmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL0l0ZW1UcmFja2VyLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL0dlb0pTT04uY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My90ZXN0L2hlbHBlcnMvVUlEcml2ZXIuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My90ZXN0L2RiX3F1ZXJpZXMuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvTG9jYXRpb25WaWV3LmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL2RiL0xvY2FsRGIuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvZm9ybXMvZm9ybS1jb250cm9scy5qcyIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL0xvY2F0aW9uRmluZGVyLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL2RiL3NlbGVjdG9yLmpzIiwiL2hvbWUvY2xh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QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL1lBO0NBQUEsS0FBQSxRQUFBOztDQUFBLENBQU07Q0FDUyxFQUFBLENBQUEsb0JBQUE7Q0FDWCxDQUFZLEVBQVosRUFBQSxF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Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeHNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzQ29udGVudCI6WyJhc3NlcnQgPSBjaGFpLmFzc2VydFxuSXRlbVRyYWNrZXIgPSByZXF1aXJlIFwiLi4vYXBwL2pzL0l0ZW1UcmFja2VyXCJcblxuZGVzY3JpYmUgJ0l0ZW1UcmFja2VyJywgLT5cbiAgYmVmb3JlRWFjaCAtPlxuICAgIEB0cmFja2VyID0gbmV3IEl0ZW1UcmFja2VyKClcblxuICBpdCBcInJlY29yZHMgYWRkc1wiLCAtPlxuICAgIGl0ZW1zID0gIFtcbiAgICAgIF9pZDogMSwgeDoxXG4gICAgICBfaWQ6IDIsIHg6MlxuICAgIF1cbiAgICBbYWRkcywgcmVtb3Zlc10gPSBAdHJhY2tlci51cGRhdGUoaXRlbXMpXG4gICAgYXNzZXJ0LmRlZXBFcXVhbCBhZGRzLCBpdGVtc1xuICAgIGFzc2VydC5kZWVwRXF1YWwgcmVtb3ZlcywgW11cblxuICBpdCBcInJlbWVtYmVycyBpdGVtc1wiLCAtPlxuICAgIGl0ZW1zID0gIFtcbiAgICAgIHtfaWQ6IDEsIHg6MX1cbiAgICAgIHtfaWQ6IDIsIHg6Mn1cbiAgICBdXG4gICAgW2FkZHMsIHJlbW92ZXNdID0gQHRyYWNrZXIudXBkYXRlKGl0ZW1zKVxuICAgIFthZGRzLCByZW1vdmVzXSA9IEB0cmFja2VyLnVwZGF0ZShpdGVtcylcbiAgICBhc3NlcnQuZGVlcEVxdWFsIGFkZHMsIFtdXG4gICAgYXNzZXJ0LmRlZXBFcXVhbCByZW1vdmVzLCBbXVxuXG4gIGl0IFwic2VlcyByZW1vdmVkIGl0ZW1zXCIsIC0+XG4gICAgaXRlbXMxID0gIFtcbiAgICAgIHtfaWQ6IDEsIHg6MX1cbiAgICAgIHtfaWQ6IDIsIHg6Mn1cbiAgICBdXG4gICAgaXRlbXMyID0gIFtcbiAgICAgIHtfaWQ6IDEsIHg6MX1cbiAgICBdXG4gICAgQHRyYWNrZXIudXBkYXRlKGl0ZW1zMSlcbiAgICBbYWRkcywgcmVtb3Zlc10gPSBAdHJhY2tlci51cGRhdGUoaXRlbXMyKVxuICAgIGFzc2VydC5kZWVwRXF1YWwgYWRkcywgW11cbiAgICBhc3NlcnQuZGVlcEVxdWFsIHJlbW92ZXMsIFt7X2lkOiAyLCB4OjJ9XVxuXG4gIGl0IFwic2VlcyByZW1vdmVkIGNoYW5nZXNcIiwgLT5cbiAgICBpdGVtczEgPSAgW1xuICAgICAge19pZDogMSwgeDoxfVxuICAgICAge19pZDogMiwgeDoyfVxuICAgIF1cbiAgICBpdGVtczIgPSAgW1xuICAgICAge19pZDogMSwgeDoxfVxuICAgICAge19pZDogMiwgeDo0fVxuICAgIF1cbiAgICBAdHJhY2tlci51cGRhdGUoaXRlbXMxKVxuICAgIFthZGRzLCByZW1vdmVzXSA9IEB0cmFja2VyLnVwZGF0ZShpdGVtczIpXG4gICAgYXNzZXJ0LmRlZXBFcXVhbCBhZGRzLCBbe19pZDogMiwgeDo0fV1cbiAgICBhc3NlcnQuZGVlcEVxdWFsIHJlbW92ZXMsIFt7X2lkOiAyLCB4OjJ9XVxuIiwiYXNzZXJ0ID0gY2hhaS5hc3NlcnRcbkxvY2FsRGIgPSByZXF1aXJlIFwiLi4vYXBwL2pzL2RiL0xvY2FsRGJcIlxuZGJfcXVlcmllcyA9IHJlcXVpcmUgXCIuL2RiX3F1ZXJpZXNcIlxuXG5kZXNjcmliZSAnTG9jYWxEYicsIC0+XG4gIGJlZm9yZSAtPlxuICAgIEBkYiA9IG5ldyBMb2NhbERiKCd0ZXN0JylcblxuICBiZWZvcmVFYWNoIChkb25lKSAtPlxuICAgIEBkYi5yZW1vdmVDb2xsZWN0aW9uKCd0ZXN0JylcbiAgICBAZGIuYWRkQ29sbGVjdGlvbigndGVzdCcpXG4gICAgZG9uZSgpXG5cbiAgZGVzY3JpYmUgXCJwYXNzZXMgcXVlcmllc1wiLCAtPlxuICAgIGRiX3F1ZXJpZXMuY2FsbCh0aGlzKVxuXG4gIGl0ICdjYWNoZXMgcm93cycsIChkb25lKSAtPlxuICAgIEBkYi50ZXN0LmNhY2hlIFt7IF9pZDogMSwgYTogJ2FwcGxlJyB9XSwge30sIHt9LCA9PlxuICAgICAgQGRiLnRlc3QuZmluZCh7fSkuZmV0Y2ggKHJlc3VsdHMpIC0+XG4gICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzWzBdLmEsICdhcHBsZSdcbiAgICAgICAgZG9uZSgpXG5cbiAgaXQgJ2NhY2hlIG92ZXJ3cml0ZSBleGlzdGluZycsIChkb25lKSAtPlxuICAgIEBkYi50ZXN0LmNhY2hlIFt7IF9pZDogMSwgYTogJ2FwcGxlJyB9XSwge30sIHt9LCA9PlxuICAgICAgQGRiLnRlc3QuY2FjaGUgW3sgX2lkOiAxLCBhOiAnYmFuYW5hJyB9XSwge30sIHt9LCA9PlxuICAgICAgICBAZGIudGVzdC5maW5kKHt9KS5mZXRjaCAocmVzdWx0cykgLT5cbiAgICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0c1swXS5hLCAnYmFuYW5hJ1xuICAgICAgICAgIGRvbmUoKVxuXG4gIGl0IFwiY2FjaGUgZG9lc24ndCBvdmVyd3JpdGUgdXBzZXJ0XCIsIChkb25lKSAtPlxuICAgIEBkYi50ZXN0LnVwc2VydCB7IF9pZDogMSwgYTogJ2FwcGxlJyB9LCA9PlxuICAgICAgQGRiLnRlc3QuY2FjaGUgW3sgX2lkOiAxLCBhOiAnYmFuYW5hJyB9XSwge30sIHt9LCA9PlxuICAgICAgICBAZGIudGVzdC5maW5kKHt9KS5mZXRjaCAocmVzdWx0cykgLT5cbiAgICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0c1swXS5hLCAnYXBwbGUnXG4gICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJjYWNoZSBkb2Vzbid0IG92ZXJ3cml0ZSByZW1vdmVcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnRlc3QuY2FjaGUgW3sgX2lkOiAxLCBhOiAnZGVsZXRlJyB9XSwge30sIHt9LCA9PlxuICAgICAgQGRiLnRlc3QucmVtb3ZlIDEsID0+XG4gICAgICBAZGIudGVzdC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdiYW5hbmEnIH1dLCB7fSwge30sID0+XG4gICAgICAgIEBkYi50ZXN0LmZpbmQoe30pLmZldGNoIChyZXN1bHRzKSAtPlxuICAgICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzLmxlbmd0aCwgMFxuICAgICAgICAgIGRvbmUoKVxuXG4gIGl0IFwiY2FjaGUgcmVtb3ZlcyBtaXNzaW5nIHVuc29ydGVkXCIsIChkb25lKSAtPlxuICAgIEBkYi50ZXN0LmNhY2hlIFt7IF9pZDogMSwgYTogJ2EnIH0sIHsgX2lkOiAyLCBhOiAnYicgfSwgeyBfaWQ6IDMsIGE6ICdjJyB9XSwge30sIHt9LCA9PlxuICAgICAgQGRiLnRlc3QuY2FjaGUgW3sgX2lkOiAxLCBhOiAnYScgfSwgeyBfaWQ6IDMsIGE6ICdjJyB9XSwge30sIHt9LCA9PlxuICAgICAgICBAZGIudGVzdC5maW5kKHt9KS5mZXRjaCAocmVzdWx0cykgLT5cbiAgICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0cy5sZW5ndGgsIDJcbiAgICAgICAgICBkb25lKClcblxuICBpdCBcImNhY2hlIHJlbW92ZXMgbWlzc2luZyBmaWx0ZXJlZFwiLCAoZG9uZSkgLT5cbiAgICBAZGIudGVzdC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdhJyB9LCB7IF9pZDogMiwgYTogJ2InIH0sIHsgX2lkOiAzLCBhOiAnYycgfV0sIHt9LCB7fSwgPT5cbiAgICAgIEBkYi50ZXN0LmNhY2hlIFt7IF9pZDogMSwgYTogJ2EnIH1dLCB7X2lkOiB7JGx0OjN9fSwge30sID0+XG4gICAgICAgIEBkYi50ZXN0LmZpbmQoe30sIHtzb3J0OlsnX2lkJ119KS5mZXRjaCAocmVzdWx0cykgLT5cbiAgICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIF8ucGx1Y2socmVzdWx0cywgJ19pZCcpLCBbMSwzXVxuICAgICAgICAgIGRvbmUoKVxuXG4gIGl0IFwiY2FjaGUgcmVtb3ZlcyBtaXNzaW5nIHNvcnRlZCBsaW1pdGVkXCIsIChkb25lKSAtPlxuICAgIEBkYi50ZXN0LmNhY2hlIFt7IF9pZDogMSwgYTogJ2EnIH0sIHsgX2lkOiAyLCBhOiAnYicgfSwgeyBfaWQ6IDMsIGE6ICdjJyB9XSwge30sIHt9LCA9PlxuICAgICAgQGRiLnRlc3QuY2FjaGUgW3sgX2lkOiAxLCBhOiAnYScgfV0sIHt9LCB7c29ydDpbJ19pZCddLCBsaW1pdDoyfSwgPT5cbiAgICAgICAgQGRiLnRlc3QuZmluZCh7fSwge3NvcnQ6WydfaWQnXX0pLmZldGNoIChyZXN1bHRzKSAtPlxuICAgICAgICAgIGFzc2VydC5kZWVwRXF1YWwgXy5wbHVjayhyZXN1bHRzLCAnX2lkJyksIFsxLDNdXG4gICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJjYWNoZSBkb2VzIG5vdCByZW1vdmUgbWlzc2luZyBzb3J0ZWQgbGltaXRlZCBwYXN0IGVuZFwiLCAoZG9uZSkgLT5cbiAgICBAZGIudGVzdC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdhJyB9LCB7IF9pZDogMiwgYTogJ2InIH0sIHsgX2lkOiAzLCBhOiAnYycgfSwgeyBfaWQ6IDQsIGE6ICdkJyB9XSwge30sIHt9LCA9PlxuICAgICAgQGRiLnRlc3QucmVtb3ZlIDIsID0+XG4gICAgICAgIEBkYi50ZXN0LmNhY2hlIFt7IF9pZDogMSwgYTogJ2EnIH0sIHsgX2lkOiAyLCBhOiAnYicgfV0sIHt9LCB7c29ydDpbJ19pZCddLCBsaW1pdDoyfSwgPT5cbiAgICAgICAgICBAZGIudGVzdC5maW5kKHt9LCB7c29ydDpbJ19pZCddfSkuZmV0Y2ggKHJlc3VsdHMpIC0+XG4gICAgICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIF8ucGx1Y2socmVzdWx0cywgJ19pZCcpLCBbMSwzLDRdXG4gICAgICAgICAgICBkb25lKClcblxuICBpdCBcInJldHVybnMgcGVuZGluZyB1cHNlcnRzXCIsIChkb25lKSAtPlxuICAgIEBkYi50ZXN0LmNhY2hlIFt7IF9pZDogMSwgYTogJ2FwcGxlJyB9XSwge30sIHt9LCA9PlxuICAgICAgQGRiLnRlc3QudXBzZXJ0IHsgX2lkOiAyLCBhOiAnYmFuYW5hJyB9LCA9PlxuICAgICAgICBAZGIudGVzdC5wZW5kaW5nVXBzZXJ0cyAocmVzdWx0cykgPT5cbiAgICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0cy5sZW5ndGgsIDFcbiAgICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0c1swXS5hLCAnYmFuYW5hJ1xuICAgICAgICAgIGRvbmUoKVxuXG4gIGl0IFwicmVzb2x2ZXMgcGVuZGluZyB1cHNlcnRzXCIsIChkb25lKSAtPlxuICAgIEBkYi50ZXN0LnVwc2VydCB7IF9pZDogMiwgYTogJ2JhbmFuYScgfSwgPT5cbiAgICAgIEBkYi50ZXN0LnJlc29sdmVVcHNlcnQgeyBfaWQ6IDIsIGE6ICdiYW5hbmEnIH0sID0+XG4gICAgICAgIEBkYi50ZXN0LnBlbmRpbmdVcHNlcnRzIChyZXN1bHRzKSA9PlxuICAgICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzLmxlbmd0aCwgMFxuICAgICAgICAgIGRvbmUoKVxuXG4gIGl0IFwicmV0YWlucyBjaGFuZ2VkIHBlbmRpbmcgdXBzZXJ0c1wiLCAoZG9uZSkgLT5cbiAgICBAZGIudGVzdC51cHNlcnQgeyBfaWQ6IDIsIGE6ICdiYW5hbmEnIH0sID0+XG4gICAgICBAZGIudGVzdC51cHNlcnQgeyBfaWQ6IDIsIGE6ICdiYW5hbmEyJyB9LCA9PlxuICAgICAgICBAZGIudGVzdC5yZXNvbHZlVXBzZXJ0IHsgX2lkOiAyLCBhOiAnYmFuYW5hJyB9LCA9PlxuICAgICAgICAgIEBkYi50ZXN0LnBlbmRpbmdVcHNlcnRzIChyZXN1bHRzKSA9PlxuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHMubGVuZ3RoLCAxXG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0c1swXS5hLCAnYmFuYW5hMidcbiAgICAgICAgICAgIGRvbmUoKVxuXG4gIGl0IFwicmVtb3ZlcyBwZW5kaW5nIHVwc2VydHNcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnRlc3QudXBzZXJ0IHsgX2lkOiAyLCBhOiAnYmFuYW5hJyB9LCA9PlxuICAgICAgQGRiLnRlc3QucmVtb3ZlIDIsID0+XG4gICAgICAgIEBkYi50ZXN0LnBlbmRpbmdVcHNlcnRzIChyZXN1bHRzKSA9PlxuICAgICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzLmxlbmd0aCwgMFxuICAgICAgICAgIGRvbmUoKVxuXG4gIGl0IFwicmV0dXJucyBwZW5kaW5nIHJlbW92ZXNcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnRlc3QuY2FjaGUgW3sgX2lkOiAxLCBhOiAnYXBwbGUnIH1dLCB7fSwge30sID0+XG4gICAgICBAZGIudGVzdC5yZW1vdmUgMSwgPT5cbiAgICAgICAgQGRiLnRlc3QucGVuZGluZ1JlbW92ZXMgKHJlc3VsdHMpID0+XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHMubGVuZ3RoLCAxXG4gICAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHNbMF0sIDFcbiAgICAgICAgICBkb25lKClcblxuICBpdCBcInJlc29sdmVzIHBlbmRpbmcgcmVtb3Zlc1wiLCAoZG9uZSkgLT5cbiAgICBAZGIudGVzdC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdhcHBsZScgfV0sIHt9LCB7fSwgPT5cbiAgICAgIEBkYi50ZXN0LnJlbW92ZSAxLCA9PlxuICAgICAgICBAZGIudGVzdC5yZXNvbHZlUmVtb3ZlIDEsID0+XG4gICAgICAgICAgQGRiLnRlc3QucGVuZGluZ1JlbW92ZXMgKHJlc3VsdHMpID0+XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0cy5sZW5ndGgsIDBcbiAgICAgICAgICAgIGRvbmUoKVxuXG4gIGl0IFwic2VlZHNcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnRlc3Quc2VlZCB7IF9pZDogMSwgYTogJ2FwcGxlJyB9LCA9PlxuICAgICAgQGRiLnRlc3QuZmluZCh7fSkuZmV0Y2ggKHJlc3VsdHMpIC0+XG4gICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzWzBdLmEsICdhcHBsZSdcbiAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJkb2VzIG5vdCBvdmVyd3JpdGUgZXhpc3RpbmdcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnRlc3QuY2FjaGUgW3sgX2lkOiAxLCBhOiAnYmFuYW5hJyB9XSwge30sIHt9LCA9PlxuICAgICAgQGRiLnRlc3Quc2VlZCB7IF9pZDogMSwgYTogJ2FwcGxlJyB9LCA9PlxuICAgICAgICBAZGIudGVzdC5maW5kKHt9KS5mZXRjaCAocmVzdWx0cykgLT5cbiAgICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0c1swXS5hLCAnYmFuYW5hJ1xuICAgICAgICAgIGRvbmUoKVxuXG4gIGl0IFwiZG9lcyBub3QgYWRkIHJlbW92ZWRcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnRlc3QuY2FjaGUgW3sgX2lkOiAxLCBhOiAnYXBwbGUnIH1dLCB7fSwge30sID0+XG4gICAgICBAZGIudGVzdC5yZW1vdmUgMSwgPT5cbiAgICAgICAgQGRiLnRlc3Quc2VlZCB7IF9pZDogMSwgYTogJ2FwcGxlJyB9LCA9PlxuICAgICAgICAgIEBkYi50ZXN0LmZpbmQoe30pLmZldGNoIChyZXN1bHRzKSAtPlxuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHMubGVuZ3RoLCAwXG4gICAgICAgICAgICBkb25lKClcblxuICBpdCBcInJldGFpbnMgaXRlbXNcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnRlc3QudXBzZXJ0IHsgX2lkOjEsIGE6XCJBbGljZVwiIH0sID0+XG4gICAgICBkYjIgPSBuZXcgTG9jYWxEYigndGVzdCcpXG4gICAgICBkYjIuYWRkQ29sbGVjdGlvbiAndGVzdCdcbiAgICAgIGRiMi50ZXN0LmZpbmQoe30pLmZldGNoIChyZXN1bHRzKSAtPlxuICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0c1swXS5hLCBcIkFsaWNlXCJcbiAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJyZXRhaW5zIHVwc2VydHNcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnRlc3QudXBzZXJ0IHsgX2lkOjEsIGE6XCJBbGljZVwiIH0sID0+XG4gICAgICBkYjIgPSBuZXcgTG9jYWxEYigndGVzdCcpXG4gICAgICBkYjIuYWRkQ29sbGVjdGlvbiAndGVzdCdcbiAgICAgIGRiMi50ZXN0LmZpbmQoe30pLmZldGNoIChyZXN1bHRzKSAtPlxuICAgICAgICBkYjIudGVzdC5wZW5kaW5nVXBzZXJ0cyAodXBzZXJ0cykgLT5cbiAgICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIHJlc3VsdHMsIHVwc2VydHNcbiAgICAgICAgICBkb25lKClcblxuICBpdCBcInJldGFpbnMgcmVtb3Zlc1wiLCAoZG9uZSkgLT5cbiAgICBAZGIudGVzdC5zZWVkIHsgX2lkOjEsIGE6XCJBbGljZVwiIH0sID0+XG4gICAgICBAZGIudGVzdC5yZW1vdmUgMSwgPT5cbiAgICAgICAgZGIyID0gbmV3IExvY2FsRGIoJ3Rlc3QnKVxuICAgICAgICBkYjIuYWRkQ29sbGVjdGlvbiAndGVzdCdcbiAgICAgICAgZGIyLnRlc3QucGVuZGluZ1JlbW92ZXMgKHJlbW92ZXMpIC0+XG4gICAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCByZW1vdmVzLCBbMV1cbiAgICAgICAgICBkb25lKClcbiIsImFzc2VydCA9IGNoYWkuYXNzZXJ0XG5HZW9KU09OID0gcmVxdWlyZSBcIi4uL2FwcC9qcy9HZW9KU09OXCJcblxuZGVzY3JpYmUgJ0dlb0pTT04nLCAtPlxuICBpdCAncmV0dXJucyBhIHByb3BlciBwb2x5Z29uJywgLT5cbiAgICBzb3V0aFdlc3QgPSBuZXcgTC5MYXRMbmcoMTAsIDIwKVxuICAgIG5vcnRoRWFzdCA9IG5ldyBMLkxhdExuZygxMywgMjMpXG4gICAgYm91bmRzID0gbmV3IEwuTGF0TG5nQm91bmRzKHNvdXRoV2VzdCwgbm9ydGhFYXN0KVxuXG4gICAganNvbiA9IEdlb0pTT04ubGF0TG5nQm91bmRzVG9HZW9KU09OKGJvdW5kcylcbiAgICBhc3NlcnQgXy5pc0VxdWFsIGpzb24sIHtcbiAgICAgIHR5cGU6IFwiUG9seWdvblwiLFxuICAgICAgY29vcmRpbmF0ZXM6IFtcbiAgICAgICAgW1syMCwxMF0sWzIwLDEzXSxbMjMsMTNdLFsyMywxMF1dXG4gICAgICBdXG4gICAgfVxuXG4gIGl0ICdnZXRzIHJlbGF0aXZlIGxvY2F0aW9uIE4nLCAtPlxuICAgIGZyb20gPSB7IHR5cGU6IFwiUG9pbnRcIiwgY29vcmRpbmF0ZXM6IFsxMCwgMjBdfVxuICAgIHRvID0geyB0eXBlOiBcIlBvaW50XCIsIGNvb3JkaW5hdGVzOiBbMTAsIDIxXX1cbiAgICBzdHIgPSBHZW9KU09OLmdldFJlbGF0aXZlTG9jYXRpb24oZnJvbSwgdG8pXG4gICAgYXNzZXJ0LmVxdWFsIHN0ciwgJzExMS4ya20gTidcblxuICBpdCAnZ2V0cyByZWxhdGl2ZSBsb2NhdGlvbiBTJywgLT5cbiAgICBmcm9tID0geyB0eXBlOiBcIlBvaW50XCIsIGNvb3JkaW5hdGVzOiBbMTAsIDIwXX1cbiAgICB0byA9IHsgdHlwZTogXCJQb2ludFwiLCBjb29yZGluYXRlczogWzEwLCAxOV19XG4gICAgc3RyID0gR2VvSlNPTi5nZXRSZWxhdGl2ZUxvY2F0aW9uKGZyb20sIHRvKVxuICAgIGFzc2VydC5lcXVhbCBzdHIsICcxMTEuMmttIFMnXG4iLCJhc3NlcnQgPSBjaGFpLmFzc2VydFxuTG9jYXRpb25WaWV3ID0gcmVxdWlyZSAnLi4vYXBwL2pzL0xvY2F0aW9uVmlldydcblVJRHJpdmVyID0gcmVxdWlyZSAnLi9oZWxwZXJzL1VJRHJpdmVyJ1xuXG5jbGFzcyBNb2NrTG9jYXRpb25GaW5kZXJcbiAgY29uc3RydWN0b3I6ICAtPlxuICAgIF8uZXh0ZW5kIEAsIEJhY2tib25lLkV2ZW50c1xuXG4gIGdldExvY2F0aW9uOiAtPlxuICBzdGFydFdhdGNoOiAtPlxuICBzdG9wV2F0Y2g6IC0+XG5cbmRlc2NyaWJlICdMb2NhdGlvblZpZXcnLCAtPlxuICBjb250ZXh0ICdXaXRoIG5vIHNldCBsb2NhdGlvbicsIC0+XG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgQGxvY2F0aW9uRmluZGVyID0gbmV3IE1vY2tMb2NhdGlvbkZpbmRlcigpXG4gICAgICBAbG9jYXRpb25WaWV3ID0gbmV3IExvY2F0aW9uVmlldyhsb2M6bnVsbCwgbG9jYXRpb25GaW5kZXI6IEBsb2NhdGlvbkZpbmRlcilcbiAgICAgIEB1aSA9IG5ldyBVSURyaXZlcihAbG9jYXRpb25WaWV3LmVsKVxuXG4gICAgaXQgJ2Rpc3BsYXlzIFVuc3BlY2lmaWVkJywgLT5cbiAgICAgIGFzc2VydC5pbmNsdWRlKEB1aS50ZXh0KCksICdVbnNwZWNpZmllZCcpXG5cbiAgICBpdCAnZGlzYWJsZXMgbWFwJywgLT5cbiAgICAgIGFzc2VydC5pc1RydWUgQHVpLmdldERpc2FibGVkKFwiTWFwXCIpIFxuXG4gICAgaXQgJ2FsbG93cyBzZXR0aW5nIGxvY2F0aW9uJywgLT5cbiAgICAgIEB1aS5jbGljaygnU2V0JylcbiAgICAgIHNldFBvcyA9IG51bGxcbiAgICAgIEBsb2NhdGlvblZpZXcub24gJ2xvY2F0aW9uc2V0JywgKHBvcykgLT5cbiAgICAgICAgc2V0UG9zID0gcG9zXG5cbiAgICAgIEBsb2NhdGlvbkZpbmRlci50cmlnZ2VyICdmb3VuZCcsIHsgY29vcmRzOiB7IGxhdGl0dWRlOiAyLCBsb25naXR1ZGU6IDMsIGFjY3VyYWN5OiAxMH19XG4gICAgICBhc3NlcnQuZXF1YWwgc2V0UG9zLmNvb3JkaW5hdGVzWzFdLCAyXG5cbiAgICBpdCAnRGlzcGxheXMgZXJyb3InLCAtPlxuICAgICAgQHVpLmNsaWNrKCdTZXQnKVxuICAgICAgc2V0UG9zID0gbnVsbFxuICAgICAgQGxvY2F0aW9uVmlldy5vbiAnbG9jYXRpb25zZXQnLCAocG9zKSAtPlxuICAgICAgICBzZXRQb3MgPSBwb3NcblxuICAgICAgQGxvY2F0aW9uRmluZGVyLnRyaWdnZXIgJ2Vycm9yJ1xuICAgICAgYXNzZXJ0LmVxdWFsIHNldFBvcywgbnVsbFxuICAgICAgYXNzZXJ0LmluY2x1ZGUoQHVpLnRleHQoKSwgJ0Nhbm5vdCcpXG5cbiAgY29udGV4dCAnV2l0aCBzZXQgbG9jYXRpb24nLCAtPlxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgIEBsb2NhdGlvbkZpbmRlciA9IG5ldyBNb2NrTG9jYXRpb25GaW5kZXIoKVxuICAgICAgQGxvY2F0aW9uVmlldyA9IG5ldyBMb2NhdGlvblZpZXcobG9jOiB7IHR5cGU6IFwiUG9pbnRcIiwgY29vcmRpbmF0ZXM6IFsxMCwgMjBdfSwgbG9jYXRpb25GaW5kZXI6IEBsb2NhdGlvbkZpbmRlcilcbiAgICAgIEB1aSA9IG5ldyBVSURyaXZlcihAbG9jYXRpb25WaWV3LmVsKVxuXG4gICAgaXQgJ2Rpc3BsYXlzIFdhaXRpbmcnLCAtPlxuICAgICAgYXNzZXJ0LmluY2x1ZGUoQHVpLnRleHQoKSwgJ1dhaXRpbmcnKVxuXG4gICAgaXQgJ2Rpc3BsYXlzIHJlbGF0aXZlJywgLT5cbiAgICAgIEBsb2NhdGlvbkZpbmRlci50cmlnZ2VyICdmb3VuZCcsIHsgY29vcmRzOiB7IGxhdGl0dWRlOiAyMSwgbG9uZ2l0dWRlOiAxMCwgYWNjdXJhY3k6IDEwfX1cbiAgICAgIGFzc2VydC5pbmNsdWRlKEB1aS50ZXh0KCksICcxMTEuMmttIFMnKVxuXG4iLCJcblxuZXhwb3J0cy5Gb3JtID0gY2xhc3MgRm9ybSBleHRlbmRzIEJhY2tib25lLlZpZXdcbiAgaW5pdGlhbGl6ZTogKG9wdGlvbnMpIC0+XG4gICAgIyBBZGQgdmlld3MgYW5kIGxpc3RlbiB0byBldmVudHNcbiAgICBmb3IgdmlldyBpbiBvcHRpb25zLnZpZXdcbiAgICAgIEBlbC5hcHBlbmQodmlldy5lbCk7XG4gICAgICBAbGlzdGVuVG8gdmlldywgJ2Nsb3NlJywgPT5cbiAgICAgICAgQHRyaWdnZXIoJ2Nsb3NlJylcblxuICAgICMgQWRkIGxpc3RlbmVyIHRvIG1vZGVsXG4gICAgQG1vZGVsLmxpc3RlblRvICdjaGFuZ2UnLCA9PlxuICAgICAgQHRyaWdnZXIoJ2NoYW5nZScpXG5cbiAgbG9hZDogKGRhdGEpIC0+XG4gICAgQG1vZGVsLmNsZWFyKHNpbGVudDp0cnVlKVxuICAgIEBtb2RlbC5zZXQoZGF0YSlcblxuICBzYXZlOiAtPlxuICAgIHJldHVybiBAbW9kZWwudG9KU09OKClcblxuXy5leHRlbmQoZXhwb3J0cywgcmVxdWlyZSgnLi9mb3JtLWNvbnRyb2xzJykpXG4iLCJcbiMgVHJhY2tzIGEgc2V0IG9mIGl0ZW1zIGJ5IGlkLCBpbmRpY2F0aW5nIHdoaWNoIGhhdmUgYmVlbiBhZGRlZCBvciByZW1vdmVkLlxuIyBDaGFuZ2VzIGFyZSBib3RoIGFkZCBhbmQgcmVtb3ZlXG5jbGFzcyBJdGVtVHJhY2tlclxuICBjb25zdHJ1Y3RvcjogLT5cbiAgICBAa2V5ID0gJ19pZCdcbiAgICBAaXRlbXMgPSB7fVxuXG4gIHVwZGF0ZTogKGl0ZW1zKSAtPiAgICAjIFJldHVybiBbW2FkZGVkXSxbcmVtb3ZlZF1dIGl0ZW1zXG4gICAgYWRkcyA9IFtdXG4gICAgcmVtb3ZlcyA9IFtdXG5cbiAgICAjIEFkZCBhbnkgbmV3IG9uZXNcbiAgICBmb3IgaXRlbSBpbiBpdGVtc1xuICAgICAgaWYgbm90IF8uaGFzKEBpdGVtcywgaXRlbVtAa2V5XSlcbiAgICAgICAgYWRkcy5wdXNoKGl0ZW0pXG5cbiAgICAjIENyZWF0ZSBtYXAgb2YgaXRlbXMgcGFyYW1ldGVyXG4gICAgbWFwID0gXy5vYmplY3QoXy5wbHVjayhpdGVtcywgQGtleSksIGl0ZW1zKVxuXG4gICAgIyBGaW5kIHJlbW92ZXNcbiAgICBmb3Iga2V5LCB2YWx1ZSBvZiBAaXRlbXNcbiAgICAgIGlmIG5vdCBfLmhhcyhtYXAsIGtleSlcbiAgICAgICAgcmVtb3Zlcy5wdXNoKHZhbHVlKVxuICAgICAgZWxzZSBpZiBub3QgXy5pc0VxdWFsKHZhbHVlLCBtYXBba2V5XSlcbiAgICAgICAgYWRkcy5wdXNoKG1hcFtrZXldKVxuICAgICAgICByZW1vdmVzLnB1c2godmFsdWUpXG5cbiAgICBmb3IgaXRlbSBpbiByZW1vdmVzXG4gICAgICBkZWxldGUgQGl0ZW1zW2l0ZW1bQGtleV1dXG5cbiAgICBmb3IgaXRlbSBpbiBhZGRzXG4gICAgICBAaXRlbXNbaXRlbVtAa2V5XV0gPSBpdGVtXG5cbiAgICByZXR1cm4gW2FkZHMsIHJlbW92ZXNdXG5cbm1vZHVsZS5leHBvcnRzID0gSXRlbVRyYWNrZXIiLCIjIEdlb0pTT04gaGVscGVyIHJvdXRpbmVzXG5cbiMgQ29udmVydHMgbmF2aWdhdG9yIHBvc2l0aW9uIHRvIHBvaW50XG5leHBvcnRzLnBvc1RvUG9pbnQgPSAocG9zKSAtPlxuICByZXR1cm4ge1xuICAgIHR5cGU6ICdQb2ludCdcbiAgICBjb29yZGluYXRlczogW3Bvcy5jb29yZHMubG9uZ2l0dWRlLCBwb3MuY29vcmRzLmxhdGl0dWRlXVxuICB9XG5cblxuZXhwb3J0cy5sYXRMbmdCb3VuZHNUb0dlb0pTT04gPSAoYm91bmRzKSAtPlxuICBzdyA9IGJvdW5kcy5nZXRTb3V0aFdlc3QoKVxuICBuZSA9IGJvdW5kcy5nZXROb3J0aEVhc3QoKVxuICByZXR1cm4ge1xuICAgIHR5cGU6ICdQb2x5Z29uJyxcbiAgICBjb29yZGluYXRlczogW1xuICAgICAgW1tzdy5sbmcsIHN3LmxhdF0sIFxuICAgICAgW3N3LmxuZywgbmUubGF0XSwgXG4gICAgICBbbmUubG5nLCBuZS5sYXRdLCBcbiAgICAgIFtuZS5sbmcsIHN3LmxhdF1dXG4gICAgXVxuICB9XG5cbiMgVE9ETzogb25seSB3b3JrcyB3aXRoIGJvdW5kc1xuZXhwb3J0cy5wb2ludEluUG9seWdvbiA9IChwb2ludCwgcG9seWdvbikgLT5cbiAgIyBHZXQgYm91bmRzXG4gIGJvdW5kcyA9IG5ldyBMLkxhdExuZ0JvdW5kcyhfLm1hcChwb2x5Z29uLmNvb3JkaW5hdGVzWzBdLCAoY29vcmQpIC0+IG5ldyBMLkxhdExuZyhjb29yZFsxXSwgY29vcmRbMF0pKSlcbiAgcmV0dXJuIGJvdW5kcy5jb250YWlucyhuZXcgTC5MYXRMbmcocG9pbnQuY29vcmRpbmF0ZXNbMV0sIHBvaW50LmNvb3JkaW5hdGVzWzBdKSlcblxuZXhwb3J0cy5nZXRSZWxhdGl2ZUxvY2F0aW9uID0gKGZyb20sIHRvKSAtPlxuICB4MSA9IGZyb20uY29vcmRpbmF0ZXNbMF1cbiAgeTEgPSBmcm9tLmNvb3JkaW5hdGVzWzFdXG4gIHgyID0gdG8uY29vcmRpbmF0ZXNbMF1cbiAgeTIgPSB0by5jb29yZGluYXRlc1sxXVxuICBcbiAgIyBDb252ZXJ0IHRvIHJlbGF0aXZlIHBvc2l0aW9uIChhcHByb3hpbWF0ZSlcbiAgZHkgPSAoeTIgLSB5MSkgLyA1Ny4zICogNjM3MTAwMFxuICBkeCA9IE1hdGguY29zKHkxIC8gNTcuMykgKiAoeDIgLSB4MSkgLyA1Ny4zICogNjM3MTAwMFxuICBcbiAgIyBEZXRlcm1pbmUgZGlyZWN0aW9uIGFuZCBhbmdsZVxuICBkaXN0ID0gTWF0aC5zcXJ0KGR4ICogZHggKyBkeSAqIGR5KVxuICBhbmdsZSA9IDkwIC0gKE1hdGguYXRhbjIoZHksIGR4KSAqIDU3LjMpXG4gIGFuZ2xlICs9IDM2MCBpZiBhbmdsZSA8IDBcbiAgYW5nbGUgLT0gMzYwIGlmIGFuZ2xlID4gMzYwXG4gIFxuICAjIEdldCBhcHByb3hpbWF0ZSBkaXJlY3Rpb25cbiAgY29tcGFzc0RpciA9IChNYXRoLmZsb29yKChhbmdsZSArIDIyLjUpIC8gNDUpKSAlIDhcbiAgY29tcGFzc1N0cnMgPSBbXCJOXCIsIFwiTkVcIiwgXCJFXCIsIFwiU0VcIiwgXCJTXCIsIFwiU1dcIiwgXCJXXCIsIFwiTldcIl1cbiAgaWYgZGlzdCA+IDEwMDBcbiAgICAoZGlzdCAvIDEwMDApLnRvRml4ZWQoMSkgKyBcImttIFwiICsgY29tcGFzc1N0cnNbY29tcGFzc0Rpcl1cbiAgZWxzZVxuICAgIChkaXN0KS50b0ZpeGVkKDApICsgXCJtIFwiICsgY29tcGFzc1N0cnNbY29tcGFzc0Rpcl0iLCJhc3NlcnQgPSBjaGFpLmFzc2VydFxuXG5jbGFzcyBVSURyaXZlclxuICBjb25zdHJ1Y3RvcjogKGVsKSAtPlxuICAgIEBlbCA9ICQoZWwpXG5cbiAgZ2V0RGlzYWJsZWQ6IChzdHIpIC0+XG4gICAgZm9yIGl0ZW0gaW4gQGVsLmZpbmQoXCJhLGJ1dHRvblwiKVxuICAgICAgaWYgJChpdGVtKS50ZXh0KCkuaW5kZXhPZihzdHIpICE9IC0xXG4gICAgICAgIHJldHVybiAkKGl0ZW0pLmlzKFwiOmRpc2FibGVkXCIpXG4gICAgYXNzZXJ0LmZhaWwobnVsbCwgc3RyLCBcIkNhbid0IGZpbmQ6IFwiICsgc3RyKVxuXG4gIGNsaWNrOiAoc3RyKSAtPlxuICAgIGZvciBpdGVtIGluIEBlbC5maW5kKFwiYSxidXR0b25cIilcbiAgICAgIGlmICQoaXRlbSkudGV4dCgpLmluZGV4T2Yoc3RyKSAhPSAtMVxuICAgICAgICBjb25zb2xlLmxvZyBcIkNsaWNraW5nOiBcIiArICQoaXRlbSkudGV4dCgpXG4gICAgICAgICQoaXRlbSkudHJpZ2dlcihcImNsaWNrXCIpXG4gICAgICAgIHJldHVyblxuICAgIGFzc2VydC5mYWlsKG51bGwsIHN0ciwgXCJDYW4ndCBmaW5kOiBcIiArIHN0cilcbiAgXG4gIGZpbGw6IChzdHIsIHZhbHVlKSAtPlxuICAgIGZvciBpdGVtIGluIEBlbC5maW5kKFwibGFiZWxcIilcbiAgICAgIGlmICQoaXRlbSkudGV4dCgpLmluZGV4T2Yoc3RyKSAhPSAtMVxuICAgICAgICBib3ggPSBAZWwuZmluZChcIiNcIiskKGl0ZW0pLmF0dHIoJ2ZvcicpKVxuICAgICAgICBib3gudmFsKHZhbHVlKVxuICBcbiAgdGV4dDogLT5cbiAgICByZXR1cm4gQGVsLnRleHQoKVxuICAgICAgXG4gIHdhaXQ6IChhZnRlcikgLT5cbiAgICBzZXRUaW1lb3V0IGFmdGVyLCAxMFxuXG5tb2R1bGUuZXhwb3J0cyA9IFVJRHJpdmVyIiwiYXNzZXJ0ID0gY2hhaS5hc3NlcnRcblxuR2VvSlNPTiA9IHJlcXVpcmUgJy4uL2FwcC9qcy9HZW9KU09OJ1xuXG5tb2R1bGUuZXhwb3J0cyA9IC0+XG4gIGNvbnRleHQgJ1dpdGggc2FtcGxlIHJvd3MnLCAtPlxuICAgIGJlZm9yZUVhY2ggKGRvbmUpIC0+XG4gICAgICBAZGIudGVzdC51cHNlcnQgeyBfaWQ6MSwgYTpcIkFsaWNlXCIgfSwgPT5cbiAgICAgICAgQGRiLnRlc3QudXBzZXJ0IHsgX2lkOjIsIGE6XCJDaGFybGllXCIgfSwgPT5cbiAgICAgICAgICBAZGIudGVzdC51cHNlcnQgeyBfaWQ6MywgYTpcIkJvYlwiIH0sID0+XG4gICAgICAgICAgICBkb25lKClcblxuICAgIGl0ICdmaW5kcyBhbGwgcm93cycsIChkb25lKSAtPlxuICAgICAgQGRiLnRlc3QuZmluZCh7fSkuZmV0Y2ggKHJlc3VsdHMpID0+XG4gICAgICAgIGFzc2VydC5lcXVhbCAzLCByZXN1bHRzLmxlbmd0aFxuICAgICAgICBkb25lKClcblxuICAgIGl0ICdmaW5kcyBhbGwgcm93cyB3aXRoIG9wdGlvbnMnLCAoZG9uZSkgLT5cbiAgICAgIEBkYi50ZXN0LmZpbmQoe30sIHt9KS5mZXRjaCAocmVzdWx0cykgPT5cbiAgICAgICAgYXNzZXJ0LmVxdWFsIDMsIHJlc3VsdHMubGVuZ3RoXG4gICAgICAgIGRvbmUoKVxuXG4gICAgaXQgJ2ZpbHRlcnMgcm93cyBieSBpZCcsIChkb25lKSAtPlxuICAgICAgQGRiLnRlc3QuZmluZCh7IF9pZDogMSB9KS5mZXRjaCAocmVzdWx0cykgPT5cbiAgICAgICAgYXNzZXJ0LmVxdWFsIDEsIHJlc3VsdHMubGVuZ3RoXG4gICAgICAgIGFzc2VydC5lcXVhbCAnQWxpY2UnLCByZXN1bHRzWzBdLmFcbiAgICAgICAgZG9uZSgpXG5cbiAgICBpdCAnZmluZHMgb25lIHJvdycsIChkb25lKSAtPlxuICAgICAgQGRiLnRlc3QuZmluZE9uZSB7IF9pZDogMiB9LCAocmVzdWx0KSA9PlxuICAgICAgICBhc3NlcnQuZXF1YWwgJ0NoYXJsaWUnLCByZXN1bHQuYVxuICAgICAgICBkb25lKClcblxuICAgIGl0ICdyZW1vdmVzIGl0ZW0nLCAoZG9uZSkgLT5cbiAgICAgIEBkYi50ZXN0LnJlbW92ZSAyLCA9PlxuICAgICAgICBAZGIudGVzdC5maW5kKHt9KS5mZXRjaCAocmVzdWx0cykgPT5cbiAgICAgICAgICBhc3NlcnQuZXF1YWwgMiwgcmVzdWx0cy5sZW5ndGhcbiAgICAgICAgICBhc3NlcnQgMSBpbiAocmVzdWx0Ll9pZCBmb3IgcmVzdWx0IGluIHJlc3VsdHMpXG4gICAgICAgICAgYXNzZXJ0IDIgbm90IGluIChyZXN1bHQuX2lkIGZvciByZXN1bHQgaW4gcmVzdWx0cylcbiAgICAgICAgICBkb25lKClcblxuICAgIGl0ICdyZW1vdmVzIG5vbi1leGlzdGVudCBpdGVtJywgKGRvbmUpIC0+XG4gICAgICBAZGIudGVzdC5yZW1vdmUgOTk5LCA9PlxuICAgICAgICBAZGIudGVzdC5maW5kKHt9KS5mZXRjaCAocmVzdWx0cykgPT5cbiAgICAgICAgICBhc3NlcnQuZXF1YWwgMywgcmVzdWx0cy5sZW5ndGhcbiAgICAgICAgICBkb25lKClcblxuICAgIGl0ICdzb3J0cyBhc2NlbmRpbmcnLCAoZG9uZSkgLT5cbiAgICAgIEBkYi50ZXN0LmZpbmQoe30sIHtzb3J0OiBbJ2EnXX0pLmZldGNoIChyZXN1bHRzKSA9PlxuICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIF8ucGx1Y2socmVzdWx0cywgJ19pZCcpLCBbMSwzLDJdXG4gICAgICAgIGRvbmUoKVxuXG4gICAgaXQgJ3NvcnRzIGRlc2NlbmRpbmcnLCAoZG9uZSkgLT5cbiAgICAgIEBkYi50ZXN0LmZpbmQoe30sIHtzb3J0OiBbWydhJywnZGVzYyddXX0pLmZldGNoIChyZXN1bHRzKSA9PlxuICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIF8ucGx1Y2socmVzdWx0cywgJ19pZCcpLCBbMiwzLDFdXG4gICAgICAgIGRvbmUoKVxuXG4gICAgaXQgJ2xpbWl0cycsIChkb25lKSAtPlxuICAgICAgQGRiLnRlc3QuZmluZCh7fSwge3NvcnQ6IFsnYSddLCBsaW1pdDoyfSkuZmV0Y2ggKHJlc3VsdHMpID0+XG4gICAgICAgIGFzc2VydC5kZWVwRXF1YWwgXy5wbHVjayhyZXN1bHRzLCAnX2lkJyksIFsxLDNdXG4gICAgICAgIGRvbmUoKVxuXG4gICAgaXQgJ2ZldGNoZXMgaW5kZXBlbmRlbnQgY29waWVzJywgKGRvbmUpIC0+XG4gICAgICBAZGIudGVzdC5maW5kT25lIHsgX2lkOiAyIH0sIChyZXN1bHQpID0+XG4gICAgICAgIHJlc3VsdC5hID0gJ0RhdmlkJ1xuICAgICAgICBAZGIudGVzdC5maW5kT25lIHsgX2lkOiAyIH0sIChyZXN1bHQpID0+XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsICdDaGFybGllJywgcmVzdWx0LmFcbiAgICAgICAgICBkb25lKClcblxuICBpdCAnYWRkcyBfaWQgdG8gcm93cycsIChkb25lKSAtPlxuICAgIEBkYi50ZXN0LnVwc2VydCB7IGE6IDEgfSwgKGl0ZW0pID0+XG4gICAgICBhc3NlcnQucHJvcGVydHkgaXRlbSwgJ19pZCdcbiAgICAgIGFzc2VydC5sZW5ndGhPZiBpdGVtLl9pZCwgMzJcbiAgICAgIGRvbmUoKVxuXG4gIGl0ICd1cGRhdGVzIGJ5IGlkJywgKGRvbmUpIC0+XG4gICAgQGRiLnRlc3QudXBzZXJ0IHsgX2lkOjEsIGE6MSB9LCAoaXRlbSkgPT5cbiAgICAgIEBkYi50ZXN0LnVwc2VydCB7IF9pZDoxLCBhOjIgfSwgKGl0ZW0pID0+XG4gICAgICAgIGFzc2VydC5lcXVhbCBpdGVtLmEsIDJcbiAgXG4gICAgICAgIEBkYi50ZXN0LmZpbmQoe30pLmZldGNoIChyZXN1bHRzKSA9PlxuICAgICAgICAgIGFzc2VydC5lcXVhbCAxLCByZXN1bHRzLmxlbmd0aFxuICAgICAgICAgIGRvbmUoKVxuXG5cbiAgZ2VvcG9pbnQgPSAobG5nLCBsYXQpIC0+XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZTogJ1BvaW50J1xuICAgICAgICBjb29yZGluYXRlczogW2xuZywgbGF0XVxuICAgIH1cblxuICBjb250ZXh0ICdXaXRoIGdlb2xvY2F0ZWQgcm93cycsIC0+XG4gICAgYmVmb3JlRWFjaCAoZG9uZSkgLT5cbiAgICAgIEBkYi50ZXN0LnVwc2VydCB7IF9pZDoxLCBsb2M6Z2VvcG9pbnQoOTAsIDQ1KSB9LCA9PlxuICAgICAgICBAZGIudGVzdC51cHNlcnQgeyBfaWQ6MiwgbG9jOmdlb3BvaW50KDkwLCA0NikgfSwgPT5cbiAgICAgICAgICBAZGIudGVzdC51cHNlcnQgeyBfaWQ6MywgbG9jOmdlb3BvaW50KDkxLCA0NSkgfSwgPT5cbiAgICAgICAgICAgIEBkYi50ZXN0LnVwc2VydCB7IF9pZDo0LCBsb2M6Z2VvcG9pbnQoOTEsIDQ2KSB9LCA9PlxuICAgICAgICAgICAgICBkb25lKClcblxuICAgIGl0ICdmaW5kcyBwb2ludHMgbmVhcicsIChkb25lKSAtPlxuICAgICAgc2VsZWN0b3IgPSBsb2M6IFxuICAgICAgICAkbmVhcjogXG4gICAgICAgICAgJGdlb21ldHJ5OiBnZW9wb2ludCg5MCwgNDUpXG5cbiAgICAgIEBkYi50ZXN0LmZpbmQoc2VsZWN0b3IpLmZldGNoIChyZXN1bHRzKSA9PlxuICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIF8ucGx1Y2socmVzdWx0cywgJ19pZCcpLCBbMSwzLDIsNF1cbiAgICAgICAgZG9uZSgpXG5cbiAgICBpdCAnZmluZHMgcG9pbnRzIG5lYXIgbWF4RGlzdGFuY2UnLCAoZG9uZSkgLT5cbiAgICAgIHNlbGVjdG9yID0gbG9jOiBcbiAgICAgICAgJG5lYXI6IFxuICAgICAgICAgICRnZW9tZXRyeTogZ2VvcG9pbnQoOTAsIDQ1KVxuICAgICAgICAgICRtYXhEaXN0YW5jZTogMTExMDAwXG5cbiAgICAgIEBkYi50ZXN0LmZpbmQoc2VsZWN0b3IpLmZldGNoIChyZXN1bHRzKSA9PlxuICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIF8ucGx1Y2socmVzdWx0cywgJ19pZCcpLCBbMSwzXVxuICAgICAgICBkb25lKCkgICAgICBcblxuICAgIGl0ICdmaW5kcyBwb2ludHMgbmVhciBtYXhEaXN0YW5jZSBqdXN0IGFib3ZlJywgKGRvbmUpIC0+XG4gICAgICBzZWxlY3RvciA9IGxvYzogXG4gICAgICAgICRuZWFyOiBcbiAgICAgICAgICAkZ2VvbWV0cnk6IGdlb3BvaW50KDkwLCA0NSlcbiAgICAgICAgICAkbWF4RGlzdGFuY2U6IDExMjAwMFxuXG4gICAgICBAZGIudGVzdC5maW5kKHNlbGVjdG9yKS5mZXRjaCAocmVzdWx0cykgPT5cbiAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCBfLnBsdWNrKHJlc3VsdHMsICdfaWQnKSwgWzEsMywyXVxuICAgICAgICBkb25lKClcblxuICAgIGl0ICdmaW5kcyBwb2ludHMgd2l0aGluIHNpbXBsZSBib3gnLCAoZG9uZSkgLT5cbiAgICAgIHNlbGVjdG9yID0gbG9jOiBcbiAgICAgICAgJGdlb0ludGVyc2VjdHM6IFxuICAgICAgICAgICRnZW9tZXRyeTogXG4gICAgICAgICAgICB0eXBlOiAnUG9seWdvbidcbiAgICAgICAgICAgIGNvb3JkaW5hdGVzOiBbW1xuICAgICAgICAgICAgICBbODkuNSwgNDUuNV0sIFs4OS41LCA0Ni41XSwgWzkwLjUsIDQ2LjVdLCBbOTAuNSwgNDUuNV1cbiAgICAgICAgICAgIF1dXG4gICAgICBAZGIudGVzdC5maW5kKHNlbGVjdG9yKS5mZXRjaCAocmVzdWx0cykgPT5cbiAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCBfLnBsdWNrKHJlc3VsdHMsICdfaWQnKSwgWzJdXG4gICAgICAgIGRvbmUoKVxuXG4gICAgaXQgJ2hhbmRsZXMgdW5kZWZpbmVkJywgKGRvbmUpIC0+XG4gICAgICBzZWxlY3RvciA9IGxvYzogXG4gICAgICAgICRnZW9JbnRlcnNlY3RzOiBcbiAgICAgICAgICAkZ2VvbWV0cnk6IFxuICAgICAgICAgICAgdHlwZTogJ1BvbHlnb24nXG4gICAgICAgICAgICBjb29yZGluYXRlczogW1tcbiAgICAgICAgICAgICAgWzg5LjUsIDQ1LjVdLCBbODkuNSwgNDYuNV0sIFs5MC41LCA0Ni41XSwgWzkwLjUsIDQ1LjVdXG4gICAgICAgICAgICBdXVxuICAgICAgQGRiLnRlc3QudXBzZXJ0IHsgX2lkOjUgfSwgPT5cbiAgICAgICAgQGRiLnRlc3QuZmluZChzZWxlY3RvcikuZmV0Y2ggKHJlc3VsdHMpID0+XG4gICAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCBfLnBsdWNrKHJlc3VsdHMsICdfaWQnKSwgWzJdXG4gICAgICAgICAgZG9uZSgpXG5cblxuIiwiTG9jYXRpb25GaW5kZXIgPSByZXF1aXJlICcuL0xvY2F0aW9uRmluZGVyJ1xuR2VvSlNPTiA9IHJlcXVpcmUgJy4vR2VvSlNPTidcblxuIyBTaG93cyB0aGUgcmVsYXRpdmUgbG9jYXRpb24gb2YgYSBwb2ludCBhbmQgYWxsb3dzIHNldHRpbmcgaXRcbmNsYXNzIExvY2F0aW9uVmlldyBleHRlbmRzIEJhY2tib25lLlZpZXdcbiAgY29uc3RydWN0b3I6IChvcHRpb25zKSAtPlxuICAgIHN1cGVyKClcbiAgICBAbG9jID0gb3B0aW9ucy5sb2NcbiAgICBAc2V0dGluZ0xvY2F0aW9uID0gZmFsc2VcbiAgICBAbG9jYXRpb25GaW5kZXIgPSBvcHRpb25zLmxvY2F0aW9uRmluZGVyIHx8IG5ldyBMb2NhdGlvbkZpbmRlcigpXG5cbiAgICAjIExpc3RlbiB0byBsb2NhdGlvbiBldmVudHNcbiAgICBAbGlzdGVuVG8oQGxvY2F0aW9uRmluZGVyLCAnZm91bmQnLCBAbG9jYXRpb25Gb3VuZClcbiAgICBAbGlzdGVuVG8oQGxvY2F0aW9uRmluZGVyLCAnZXJyb3InLCBAbG9jYXRpb25FcnJvcilcblxuICAgICMgU3RhcnQgdHJhY2tpbmcgbG9jYXRpb24gaWYgc2V0XG4gICAgaWYgQGxvY1xuICAgICAgQGxvY2F0aW9uRmluZGVyLnN0YXJ0V2F0Y2goKVxuXG4gICAgQHJlbmRlcigpXG5cbiAgZXZlbnRzOlxuICAgICdjbGljayAjbG9jYXRpb25fbWFwJyA6ICdtYXBDbGlja2VkJ1xuICAgICdjbGljayAjbG9jYXRpb25fc2V0JyA6ICdzZXRMb2NhdGlvbidcblxuICByZW1vdmU6IC0+XG4gICAgQGxvY2F0aW9uRmluZGVyLnN0b3BXYXRjaCgpXG4gICAgc3VwZXIoKVxuXG4gIHJlbmRlcjogLT5cbiAgICBAJGVsLmh0bWwgdGVtcGxhdGVzWydMb2NhdGlvblZpZXcnXSgpXG5cbiAgICAjIFNldCBsb2NhdGlvbiBzdHJpbmdcbiAgICBpZiBAZXJyb3JGaW5kaW5nTG9jYXRpb25cbiAgICAgIEAkKFwiI2xvY2F0aW9uX3JlbGF0aXZlXCIpLnRleHQoXCJDYW5ub3QgZmluZCBsb2NhdGlvblwiKVxuICAgIGVsc2UgaWYgbm90IEBsb2MgYW5kIG5vdCBAc2V0dGluZ0xvY2F0aW9uIFxuICAgICAgQCQoXCIjbG9jYXRpb25fcmVsYXRpdmVcIikudGV4dChcIlVuc3BlY2lmaWVkIGxvY2F0aW9uXCIpXG4gICAgZWxzZSBpZiBAc2V0dGluZ0xvY2F0aW9uXG4gICAgICBAJChcIiNsb2NhdGlvbl9yZWxhdGl2ZVwiKS50ZXh0KFwiU2V0dGluZyBsb2NhdGlvbi4uLlwiKVxuICAgIGVsc2UgaWYgbm90IEBjdXJyZW50TG9jXG4gICAgICBAJChcIiNsb2NhdGlvbl9yZWxhdGl2ZVwiKS50ZXh0KFwiV2FpdGluZyBmb3IgR1BTLi4uXCIpXG4gICAgZWxzZVxuICAgICAgQCQoXCIjbG9jYXRpb25fcmVsYXRpdmVcIikudGV4dChHZW9KU09OLmdldFJlbGF0aXZlTG9jYXRpb24oQGN1cnJlbnRMb2MsIEBsb2MpKVxuXG4gICAgIyBEaXNhYmxlIG1hcCBpZiBsb2NhdGlvbiBub3Qgc2V0XG4gICAgQCQoXCIjbG9jYXRpb25fbWFwXCIpLmF0dHIoXCJkaXNhYmxlZFwiLCBub3QgQGxvYyk7XG5cbiAgICAjIERpc2FibGUgc2V0IGlmIHNldHRpbmdcbiAgICBAJChcIiNsb2NhdGlvbl9zZXRcIikuYXR0cihcImRpc2FibGVkXCIsIEBzZXR0aW5nTG9jYXRpb24gPT0gdHJ1ZSk7ICAgIFxuXG4gIHNldExvY2F0aW9uOiAtPlxuICAgIEBzZXR0aW5nTG9jYXRpb24gPSB0cnVlXG4gICAgQGVycm9yRmluZGluZ0xvY2F0aW9uID0gZmFsc2VcbiAgICBAbG9jYXRpb25GaW5kZXIuc3RhcnRXYXRjaCgpXG4gICAgQHJlbmRlcigpXG5cbiAgbG9jYXRpb25Gb3VuZDogKHBvcykgPT5cbiAgICBpZiBAc2V0dGluZ0xvY2F0aW9uXG4gICAgICBAc2V0dGluZ0xvY2F0aW9uID0gZmFsc2VcbiAgICAgIEBlcnJvckZpbmRpbmdMb2NhdGlvbiA9IGZhbHNlXG5cbiAgICAgICMgU2V0IGxvY2F0aW9uXG4gICAgICBAbG9jID0gR2VvSlNPTi5wb3NUb1BvaW50KHBvcylcbiAgICAgIEB0cmlnZ2VyKCdsb2NhdGlvbnNldCcsIEBsb2MpXG5cbiAgICBAY3VycmVudExvYyA9IEdlb0pTT04ucG9zVG9Qb2ludChwb3MpXG4gICAgQHJlbmRlcigpXG5cbiAgbG9jYXRpb25FcnJvcjogPT5cbiAgICBAc2V0dGluZ0xvY2F0aW9uID0gZmFsc2VcbiAgICBAZXJyb3JGaW5kaW5nTG9jYXRpb24gPSB0cnVlXG4gICAgQHJlbmRlcigpXG5cblxubW9kdWxlLmV4cG9ydHMgPSBMb2NhdGlvblZpZXciLCJjb21waWxlRG9jdW1lbnRTZWxlY3RvciA9IHJlcXVpcmUoJy4vc2VsZWN0b3InKS5jb21waWxlRG9jdW1lbnRTZWxlY3RvclxuY29tcGlsZVNvcnQgPSByZXF1aXJlKCcuL3NlbGVjdG9yJykuY29tcGlsZVNvcnRcbkdlb0pTT04gPSByZXF1aXJlICcuLi9HZW9KU09OJ1xuXG5jbGFzcyBMb2NhbERiXG4gIGNvbnN0cnVjdG9yOiAobmFtZSkgLT5cbiAgICBAbmFtZSA9IG5hbWVcbiAgICBAY29sbGVjdGlvbnMgPSB7fVxuXG4gIGFkZENvbGxlY3Rpb246IChuYW1lKSAtPlxuICAgIGRiTmFtZSA9IEBuYW1lXG4gICAgbmFtZXNwYWNlID0gXCJkYi4je2RiTmFtZX0uI3tuYW1lfS5cIlxuXG4gICAgY29sbGVjdGlvbiA9IG5ldyBDb2xsZWN0aW9uKG5hbWUsIG5hbWVzcGFjZSlcbiAgICBAW25hbWVdID0gY29sbGVjdGlvblxuICAgIEBjb2xsZWN0aW9uc1tuYW1lXSA9IGNvbGxlY3Rpb25cblxuICByZW1vdmVDb2xsZWN0aW9uOiAobmFtZSkgLT5cbiAgICBkYk5hbWUgPSBAbmFtZVxuICAgIG5hbWVzcGFjZSA9IFwiZGIuI3tkYk5hbWV9LiN7bmFtZX0uXCJcblxuICAgIGlmIHdpbmRvdy5sb2NhbFN0b3JhZ2VcbiAgICAgIGtleXMgPSBbXVxuICAgICAgZm9yIGkgaW4gWzAuLi5sb2NhbFN0b3JhZ2UubGVuZ3RoXVxuICAgICAgICBrZXlzLnB1c2gobG9jYWxTdG9yYWdlLmtleShpKSlcblxuICAgICAgZm9yIGtleSBpbiBrZXlzXG4gICAgICAgIGlmIGtleS5zdWJzdHJpbmcoMCwgbmFtZXNwYWNlLmxlbmd0aCkgPT0gbmFtZXNwYWNlXG4gICAgICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oa2V5KVxuXG4gICAgZGVsZXRlIEBbbmFtZV1cbiAgICBkZWxldGUgQGNvbGxlY3Rpb25zW25hbWVdXG5cblxuIyBTdG9yZXMgZGF0YSBpbiBtZW1vcnksIGJhY2tlZCBieSBsb2NhbCBzdG9yYWdlXG5jbGFzcyBDb2xsZWN0aW9uXG4gIGNvbnN0cnVjdG9yOiAobmFtZSwgbmFtZXNwYWNlKSAtPlxuICAgIEBuYW1lID0gbmFtZVxuICAgIEBuYW1lc3BhY2UgPSBuYW1lc3BhY2VcblxuICAgIEBpdGVtcyA9IHt9XG4gICAgQHVwc2VydHMgPSB7fSAgIyBQZW5kaW5nIHVwc2VydHMgYnkgX2lkLiBTdGlsbCBpbiBpdGVtc1xuICAgIEByZW1vdmVzID0ge30gICMgUGVuZGluZyByZW1vdmVzIGJ5IF9pZC4gTm8gbG9uZ2VyIGluIGl0ZW1zXG5cbiAgICAjIFJlYWQgZnJvbSBsb2NhbCBzdG9yYWdlXG4gICAgaWYgd2luZG93LmxvY2FsU3RvcmFnZVxuICAgICAgQGxvYWRTdG9yYWdlKClcblxuICBsb2FkU3RvcmFnZTogLT5cbiAgICAjIFJlYWQgaXRlbXMgZnJvbSBsb2NhbFN0b3JhZ2VcbiAgICBAaXRlbU5hbWVzcGFjZSA9IEBuYW1lc3BhY2UgKyBcIl9cIlxuXG4gICAgZm9yIGkgaW4gWzAuLi5sb2NhbFN0b3JhZ2UubGVuZ3RoXVxuICAgICAga2V5ID0gbG9jYWxTdG9yYWdlLmtleShpKVxuICAgICAgaWYga2V5LnN1YnN0cmluZygwLCBAaXRlbU5hbWVzcGFjZS5sZW5ndGgpID09IEBpdGVtTmFtZXNwYWNlXG4gICAgICAgIGl0ZW0gPSBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZVtrZXldKVxuICAgICAgICBAaXRlbXNbaXRlbS5faWRdID0gaXRlbVxuXG4gICAgIyBSZWFkIHVwc2VydHNcbiAgICB1cHNlcnRLZXlzID0gaWYgbG9jYWxTdG9yYWdlW0BuYW1lc3BhY2UrXCJ1cHNlcnRzXCJdIHRoZW4gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2VbQG5hbWVzcGFjZStcInVwc2VydHNcIl0pIGVsc2UgW11cbiAgICBmb3Iga2V5IGluIHVwc2VydEtleXNcbiAgICAgIEB1cHNlcnRzW2tleV0gPSBAaXRlbXNba2V5XVxuXG4gICAgIyBSZWFkIHJlbW92ZXNcbiAgICByZW1vdmVJdGVtcyA9IGlmIGxvY2FsU3RvcmFnZVtAbmFtZXNwYWNlK1wicmVtb3Zlc1wiXSB0aGVuIEpTT04ucGFyc2UobG9jYWxTdG9yYWdlW0BuYW1lc3BhY2UrXCJyZW1vdmVzXCJdKSBlbHNlIFtdXG4gICAgQHJlbW92ZXMgPSBfLm9iamVjdChfLnBsdWNrKHJlbW92ZUl0ZW1zLCBcIl9pZFwiKSwgcmVtb3ZlSXRlbXMpXG5cbiAgZmluZDogKHNlbGVjdG9yLCBvcHRpb25zKSAtPlxuICAgIHJldHVybiBmZXRjaDogKHN1Y2Nlc3MsIGVycm9yKSA9PlxuICAgICAgQF9maW5kRmV0Y2goc2VsZWN0b3IsIG9wdGlvbnMsIHN1Y2Nlc3MsIGVycm9yKVxuXG4gIGZpbmRPbmU6IChzZWxlY3Rvciwgb3B0aW9ucywgc3VjY2VzcywgZXJyb3IpIC0+XG4gICAgaWYgXy5pc0Z1bmN0aW9uKG9wdGlvbnMpIFxuICAgICAgW29wdGlvbnMsIHN1Y2Nlc3MsIGVycm9yXSA9IFt7fSwgb3B0aW9ucywgc3VjY2Vzc11cblxuICAgIEBmaW5kKHNlbGVjdG9yLCBvcHRpb25zKS5mZXRjaCAocmVzdWx0cykgLT5cbiAgICAgIGlmIHN1Y2Nlc3M/IHRoZW4gc3VjY2VzcyhpZiByZXN1bHRzLmxlbmd0aD4wIHRoZW4gcmVzdWx0c1swXSBlbHNlIG51bGwpXG4gICAgLCBlcnJvclxuXG4gIF9maW5kRmV0Y2g6IChzZWxlY3Rvciwgb3B0aW9ucywgc3VjY2VzcywgZXJyb3IpIC0+XG4gICAgZmlsdGVyZWQgPSBfLmZpbHRlcihfLnZhbHVlcyhAaXRlbXMpLCBjb21waWxlRG9jdW1lbnRTZWxlY3RvcihzZWxlY3RvcikpXG5cbiAgICAjIEhhbmRsZSBnZW9zcGF0aWFsIG9wZXJhdG9yc1xuICAgIGZpbHRlcmVkID0gcHJvY2Vzc05lYXJPcGVyYXRvcihzZWxlY3RvciwgZmlsdGVyZWQpXG4gICAgZmlsdGVyZWQgPSBwcm9jZXNzR2VvSW50ZXJzZWN0c09wZXJhdG9yKHNlbGVjdG9yLCBmaWx0ZXJlZClcblxuICAgIGlmIG9wdGlvbnMgYW5kIG9wdGlvbnMuc29ydCBcbiAgICAgIGZpbHRlcmVkLnNvcnQoY29tcGlsZVNvcnQob3B0aW9ucy5zb3J0KSlcblxuICAgIGlmIG9wdGlvbnMgYW5kIG9wdGlvbnMubGltaXRcbiAgICAgIGZpbHRlcmVkID0gXy5maXJzdCBmaWx0ZXJlZCwgb3B0aW9ucy5saW1pdFxuXG4gICAgIyBDbG9uZSB0byBwcmV2ZW50IGFjY2lkZW50YWwgdXBkYXRlc1xuICAgIGZpbHRlcmVkID0gXy5tYXAgZmlsdGVyZWQsIChkb2MpIC0+IF8uY2xvbmVEZWVwKGRvYylcbiAgICBpZiBzdWNjZXNzPyB0aGVuIHN1Y2Nlc3MoZmlsdGVyZWQpXG5cbiAgdXBzZXJ0OiAoZG9jLCBzdWNjZXNzLCBlcnJvcikgLT5cbiAgICBpZiBub3QgZG9jLl9pZFxuICAgICAgZG9jLl9pZCA9IGNyZWF0ZVVpZCgpXG5cbiAgICAjIFJlcGxhY2UvYWRkIFxuICAgIEBfcHV0SXRlbShkb2MpXG4gICAgQF9wdXRVcHNlcnQoZG9jKVxuXG4gICAgaWYgc3VjY2Vzcz8gdGhlbiBzdWNjZXNzKGRvYylcblxuICByZW1vdmU6IChpZCwgc3VjY2VzcywgZXJyb3IpIC0+XG4gICAgaWYgXy5oYXMoQGl0ZW1zLCBpZClcbiAgICAgIEBfcHV0UmVtb3ZlKEBpdGVtc1tpZF0pXG4gICAgICBAX2RlbGV0ZUl0ZW0oaWQpXG4gICAgICBAX2RlbGV0ZVVwc2VydChpZClcblxuICAgIGlmIHN1Y2Nlc3M/IHRoZW4gc3VjY2VzcygpXG5cbiAgX3B1dEl0ZW06IChkb2MpIC0+XG4gICAgQGl0ZW1zW2RvYy5faWRdID0gZG9jXG4gICAgbG9jYWxTdG9yYWdlW0BpdGVtTmFtZXNwYWNlICsgZG9jLl9pZF0gPSBKU09OLnN0cmluZ2lmeShkb2MpXG5cbiAgX2RlbGV0ZUl0ZW06IChpZCkgLT5cbiAgICBkZWxldGUgQGl0ZW1zW2lkXVxuXG4gIF9wdXRVcHNlcnQ6IChkb2MpIC0+XG4gICAgQHVwc2VydHNbZG9jLl9pZF0gPSBkb2NcbiAgICBsb2NhbFN0b3JhZ2VbQG5hbWVzcGFjZStcInVwc2VydHNcIl0gPSBKU09OLnN0cmluZ2lmeShfLmtleXMoQHVwc2VydHMpKVxuXG4gIF9kZWxldGVVcHNlcnQ6IChpZCkgLT5cbiAgICBkZWxldGUgQHVwc2VydHNbaWRdXG4gICAgbG9jYWxTdG9yYWdlW0BuYW1lc3BhY2UrXCJ1cHNlcnRzXCJdID0gSlNPTi5zdHJpbmdpZnkoXy5rZXlzKEB1cHNlcnRzKSlcblxuICBfcHV0UmVtb3ZlOiAoZG9jKSAtPlxuICAgIEByZW1vdmVzW2RvYy5faWRdID0gZG9jXG4gICAgbG9jYWxTdG9yYWdlW0BuYW1lc3BhY2UrXCJyZW1vdmVzXCJdID0gSlNPTi5zdHJpbmdpZnkoXy52YWx1ZXMoQHJlbW92ZXMpKVxuXG4gIF9kZWxldGVSZW1vdmU6IChpZCkgLT5cbiAgICBkZWxldGUgQHJlbW92ZXNbaWRdXG4gICAgbG9jYWxTdG9yYWdlW0BuYW1lc3BhY2UrXCJyZW1vdmVzXCJdID0gSlNPTi5zdHJpbmdpZnkoXy52YWx1ZXMoQHJlbW92ZXMpKVxuXG4gIGNhY2hlOiAoZG9jcywgc2VsZWN0b3IsIG9wdGlvbnMsIHN1Y2Nlc3MsIGVycm9yKSAtPlxuICAgICMgQWRkIGFsbCBub24tbG9jYWwgdGhhdCBhcmUgbm90IHVwc2VydGVkIG9yIHJlbW92ZWRcbiAgICBmb3IgZG9jIGluIGRvY3NcbiAgICAgIGlmIG5vdCBfLmhhcyhAdXBzZXJ0cywgZG9jLl9pZCkgYW5kIG5vdCBfLmhhcyhAcmVtb3ZlcywgZG9jLl9pZClcbiAgICAgICAgQF9wdXRJdGVtKGRvYylcblxuICAgIGRvY3NNYXAgPSBfLm9iamVjdChfLnBsdWNrKGRvY3MsIFwiX2lkXCIpLCBkb2NzKVxuXG4gICAgaWYgb3B0aW9ucy5zb3J0XG4gICAgICBzb3J0ID0gY29tcGlsZVNvcnQob3B0aW9ucy5zb3J0KVxuXG4gICAgIyBQZXJmb3JtIHF1ZXJ5LCByZW1vdmluZyByb3dzIG1pc3NpbmcgaW4gZG9jcyBmcm9tIGxvY2FsIGRiIFxuICAgIEBmaW5kKHNlbGVjdG9yLCBvcHRpb25zKS5mZXRjaCAocmVzdWx0cykgPT5cbiAgICAgIGZvciByZXN1bHQgaW4gcmVzdWx0c1xuICAgICAgICBpZiBub3QgZG9jc01hcFtyZXN1bHQuX2lkXSBhbmQgbm90IF8uaGFzKEB1cHNlcnRzLCByZXN1bHQuX2lkKVxuICAgICAgICAgICMgSWYgcGFzdCBlbmQgb24gc29ydGVkIGxpbWl0ZWQsIGlnbm9yZVxuICAgICAgICAgIGlmIG9wdGlvbnMuc29ydCBhbmQgb3B0aW9ucy5saW1pdCBhbmQgZG9jcy5sZW5ndGggPT0gb3B0aW9ucy5saW1pdFxuICAgICAgICAgICAgaWYgc29ydChyZXN1bHQsIF8ubGFzdChkb2NzKSkgPj0gMFxuICAgICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgIEBfZGVsZXRlSXRlbShyZXN1bHQuX2lkKVxuXG4gICAgICBpZiBzdWNjZXNzPyB0aGVuIHN1Y2Nlc3MoKSAgXG4gICAgLCBlcnJvclxuICAgIFxuICBwZW5kaW5nVXBzZXJ0czogKHN1Y2Nlc3MpIC0+XG4gICAgc3VjY2VzcyBfLnZhbHVlcyhAdXBzZXJ0cylcblxuICBwZW5kaW5nUmVtb3ZlczogKHN1Y2Nlc3MpIC0+XG4gICAgc3VjY2VzcyBfLnBsdWNrKEByZW1vdmVzLCBcIl9pZFwiKVxuXG4gIHJlc29sdmVVcHNlcnQ6IChkb2MsIHN1Y2Nlc3MpIC0+XG4gICAgaWYgQHVwc2VydHNbZG9jLl9pZF0gYW5kIF8uaXNFcXVhbChkb2MsIEB1cHNlcnRzW2RvYy5faWRdKVxuICAgICAgQF9kZWxldGVVcHNlcnQoZG9jLl9pZClcbiAgICBpZiBzdWNjZXNzPyB0aGVuIHN1Y2Nlc3MoKVxuXG4gIHJlc29sdmVSZW1vdmU6IChpZCwgc3VjY2VzcykgLT5cbiAgICBAX2RlbGV0ZVJlbW92ZShpZClcbiAgICBpZiBzdWNjZXNzPyB0aGVuIHN1Y2Nlc3MoKVxuXG4gICMgQWRkIGJ1dCBkbyBub3Qgb3ZlcndyaXRlIG9yIHJlY29yZCBhcyB1cHNlcnRcbiAgc2VlZDogKGRvYywgc3VjY2VzcykgLT5cbiAgICBpZiBub3QgXy5oYXMoQGl0ZW1zLCBkb2MuX2lkKSBhbmQgbm90IF8uaGFzKEByZW1vdmVzLCBkb2MuX2lkKVxuICAgICAgQF9wdXRJdGVtKGRvYylcbiAgICBpZiBzdWNjZXNzPyB0aGVuIHN1Y2Nlc3MoKVxuXG5cbmNyZWF0ZVVpZCA9IC0+IFxuICAneHh4eHh4eHh4eHh4NHh4eHl4eHh4eHh4eHh4eHh4eHgnLnJlcGxhY2UoL1t4eV0vZywgKGMpIC0+XG4gICAgciA9IE1hdGgucmFuZG9tKCkqMTZ8MFxuICAgIHYgPSBpZiBjID09ICd4JyB0aGVuIHIgZWxzZSAociYweDN8MHg4KVxuICAgIHJldHVybiB2LnRvU3RyaW5nKDE2KVxuICAgKVxuXG5wcm9jZXNzTmVhck9wZXJhdG9yID0gKHNlbGVjdG9yLCBsaXN0KSAtPlxuICBmb3Iga2V5LCB2YWx1ZSBvZiBzZWxlY3RvclxuICAgIGlmIHZhbHVlWyckbmVhciddXG4gICAgICBnZW8gPSB2YWx1ZVsnJG5lYXInXVsnJGdlb21ldHJ5J11cbiAgICAgIGlmIGdlby50eXBlICE9ICdQb2ludCdcbiAgICAgICAgYnJlYWtcblxuICAgICAgbmVhciA9IG5ldyBMLkxhdExuZyhnZW8uY29vcmRpbmF0ZXNbMV0sIGdlby5jb29yZGluYXRlc1swXSlcblxuICAgICAgbGlzdCA9IF8uZmlsdGVyIGxpc3QsIChkb2MpIC0+XG4gICAgICAgIHJldHVybiBkb2Nba2V5XSBhbmQgZG9jW2tleV0udHlwZSA9PSAnUG9pbnQnXG5cbiAgICAgICMgR2V0IGRpc3RhbmNlc1xuICAgICAgZGlzdGFuY2VzID0gXy5tYXAgbGlzdCwgKGRvYykgLT5cbiAgICAgICAgcmV0dXJuIHsgZG9jOiBkb2MsIGRpc3RhbmNlOiBcbiAgICAgICAgICBuZWFyLmRpc3RhbmNlVG8obmV3IEwuTGF0TG5nKGRvY1trZXldLmNvb3JkaW5hdGVzWzFdLCBkb2Nba2V5XS5jb29yZGluYXRlc1swXSkpXG4gICAgICAgIH1cblxuICAgICAgIyBGaWx0ZXIgbm9uLXBvaW50c1xuICAgICAgZGlzdGFuY2VzID0gXy5maWx0ZXIgZGlzdGFuY2VzLCAoaXRlbSkgLT4gaXRlbS5kaXN0YW5jZSA+PSAwXG5cbiAgICAgICMgU29ydCBieSBkaXN0YW5jZVxuICAgICAgZGlzdGFuY2VzID0gXy5zb3J0QnkgZGlzdGFuY2VzLCAnZGlzdGFuY2UnXG5cbiAgICAgICMgRmlsdGVyIGJ5IG1heERpc3RhbmNlXG4gICAgICBpZiB2YWx1ZVsnJG5lYXInXVsnJG1heERpc3RhbmNlJ11cbiAgICAgICAgZGlzdGFuY2VzID0gXy5maWx0ZXIgZGlzdGFuY2VzLCAoaXRlbSkgLT4gaXRlbS5kaXN0YW5jZSA8PSB2YWx1ZVsnJG5lYXInXVsnJG1heERpc3RhbmNlJ11cblxuICAgICAgIyBMaW1pdCB0byAxMDBcbiAgICAgIGRpc3RhbmNlcyA9IF8uZmlyc3QgZGlzdGFuY2VzLCAxMDBcblxuICAgICAgIyBFeHRyYWN0IGRvY3NcbiAgICAgIGxpc3QgPSBfLnBsdWNrIGRpc3RhbmNlcywgJ2RvYydcbiAgcmV0dXJuIGxpc3RcblxucHJvY2Vzc0dlb0ludGVyc2VjdHNPcGVyYXRvciA9IChzZWxlY3RvciwgbGlzdCkgLT5cbiAgZm9yIGtleSwgdmFsdWUgb2Ygc2VsZWN0b3JcbiAgICBpZiB2YWx1ZVsnJGdlb0ludGVyc2VjdHMnXVxuICAgICAgZ2VvID0gdmFsdWVbJyRnZW9JbnRlcnNlY3RzJ11bJyRnZW9tZXRyeSddXG4gICAgICBpZiBnZW8udHlwZSAhPSAnUG9seWdvbidcbiAgICAgICAgYnJlYWtcblxuICAgICAgIyBDaGVjayB3aXRoaW4gZm9yIGVhY2hcbiAgICAgIGxpc3QgPSBfLmZpbHRlciBsaXN0LCAoZG9jKSAtPlxuICAgICAgICAjIFJlamVjdCBub24tcG9pbnRzXG4gICAgICAgIGlmIG5vdCBkb2Nba2V5XSBvciBkb2Nba2V5XS50eXBlICE9ICdQb2ludCdcbiAgICAgICAgICByZXR1cm4gZmFsc2VcblxuICAgICAgICAjIENoZWNrIHBvbHlnb25cbiAgICAgICAgcmV0dXJuIEdlb0pTT04ucG9pbnRJblBvbHlnb24oZG9jW2tleV0sIGdlbylcblxuICByZXR1cm4gbGlzdFxuXG5tb2R1bGUuZXhwb3J0cyA9IExvY2FsRGJcbiIsImV4cG9ydHMuU2VjdGlvbnMgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCh7XG4gICAgY2xhc3NOYW1lIDogXCJzdXJ2ZXlcIixcblxuICAgIGluaXRpYWxpemUgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy50aXRsZSA9IHRoaXMub3B0aW9ucy50aXRsZTtcbiAgICAgICAgdGhpcy5zZWN0aW9ucyA9IHRoaXMub3B0aW9ucy5zZWN0aW9ucztcbiAgICAgICAgdGhpcy5yZW5kZXIoKTtcblxuICAgICAgICAvLyBBZGp1c3QgbmV4dC9wcmV2IGJhc2VkIG9uIG1vZGVsXG4gICAgICAgIHRoaXMubW9kZWwub24oXCJjaGFuZ2VcIiwgdGhpcy5yZW5kZXJOZXh0UHJldiwgdGhpcyk7XG5cbiAgICAgICAgLy8gR28gdG8gYXBwcm9wcmlhdGUgc2VjdGlvbiBUT0RPXG4gICAgICAgIHRoaXMuc2hvd1NlY3Rpb24oMCk7XG4gICAgfSxcblxuICAgIGV2ZW50cyA6IHtcbiAgICAgICAgXCJjbGljayAubmV4dFwiIDogXCJuZXh0U2VjdGlvblwiLFxuICAgICAgICBcImNsaWNrIC5wcmV2XCIgOiBcInByZXZTZWN0aW9uXCIsXG4gICAgICAgIFwiY2xpY2sgLmZpbmlzaFwiIDogXCJmaW5pc2hcIixcbiAgICAgICAgXCJjbGljayBhLnNlY3Rpb24tY3J1bWJcIiA6IFwiY3J1bWJTZWN0aW9uXCJcbiAgICB9LFxuXG4gICAgZmluaXNoIDogZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIFZhbGlkYXRlIGN1cnJlbnQgc2VjdGlvblxuICAgICAgICB2YXIgc2VjdGlvbiA9IHRoaXMuc2VjdGlvbnNbdGhpcy5zZWN0aW9uXTtcbiAgICAgICAgaWYgKHNlY3Rpb24udmFsaWRhdGUoKSkge1xuICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5vbkZpbmlzaClcbiAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMub25GaW5pc2goKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBjcnVtYlNlY3Rpb24gOiBmdW5jdGlvbihlKSB7XG4gICAgICAgIC8vIEdvIHRvIHNlY3Rpb25cbiAgICAgICAgdmFyIGluZGV4ID0gcGFyc2VJbnQoZS50YXJnZXQuZ2V0QXR0cmlidXRlKFwiZGF0YS12YWx1ZVwiKSk7XG4gICAgICAgIHRoaXMuc2hvd1NlY3Rpb24oaW5kZXgpO1xuICAgIH0sXG5cbiAgICBnZXROZXh0U2VjdGlvbkluZGV4IDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBpID0gdGhpcy5zZWN0aW9uICsgMTtcbiAgICAgICAgd2hpbGUgKGkgPCB0aGlzLnNlY3Rpb25zLmxlbmd0aCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuc2VjdGlvbnNbaV0uc2hvdWxkQmVWaXNpYmxlKCkpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGk7XG4gICAgICAgICAgICBpKys7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgZ2V0UHJldlNlY3Rpb25JbmRleCA6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgaSA9IHRoaXMuc2VjdGlvbiAtIDE7XG4gICAgICAgIHdoaWxlIChpID49IDApIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnNlY3Rpb25zW2ldLnNob3VsZEJlVmlzaWJsZSgpKVxuICAgICAgICAgICAgICAgIHJldHVybiBpO1xuICAgICAgICAgICAgaS0tO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIG5leHRTZWN0aW9uIDogZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIFZhbGlkYXRlIGN1cnJlbnQgc2VjdGlvblxuICAgICAgICB2YXIgc2VjdGlvbiA9IHRoaXMuc2VjdGlvbnNbdGhpcy5zZWN0aW9uXTtcbiAgICAgICAgaWYgKHNlY3Rpb24udmFsaWRhdGUoKSkge1xuICAgICAgICAgICAgdGhpcy5zaG93U2VjdGlvbih0aGlzLmdldE5leHRTZWN0aW9uSW5kZXgoKSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgcHJldlNlY3Rpb24gOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5zaG93U2VjdGlvbih0aGlzLmdldFByZXZTZWN0aW9uSW5kZXgoKSk7XG4gICAgfSxcblxuICAgIHNob3dTZWN0aW9uIDogZnVuY3Rpb24oaW5kZXgpIHtcbiAgICAgICAgdGhpcy5zZWN0aW9uID0gaW5kZXg7XG5cbiAgICAgICAgXy5lYWNoKHRoaXMuc2VjdGlvbnMsIGZ1bmN0aW9uKHMpIHtcbiAgICAgICAgICAgIHMuJGVsLmhpZGUoKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuc2VjdGlvbnNbaW5kZXhdLiRlbC5zaG93KCk7XG5cbiAgICAgICAgLy8gU2V0dXAgYnJlYWRjcnVtYnNcbiAgICAgICAgdmFyIHZpc2libGVTZWN0aW9ucyA9IF8uZmlsdGVyKF8uZmlyc3QodGhpcy5zZWN0aW9ucywgaW5kZXggKyAxKSwgZnVuY3Rpb24ocykge1xuICAgICAgICAgICAgcmV0dXJuIHMuc2hvdWxkQmVWaXNpYmxlKClcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuJChcIi5icmVhZGNydW1iXCIpLmh0bWwodGVtcGxhdGVzWydmb3Jtcy9TZWN0aW9uc19icmVhZGNydW1icyddKHtcbiAgICAgICAgICAgIHNlY3Rpb25zIDogXy5pbml0aWFsKHZpc2libGVTZWN0aW9ucyksXG4gICAgICAgICAgICBsYXN0U2VjdGlvbjogXy5sYXN0KHZpc2libGVTZWN0aW9ucylcbiAgICAgICAgfSkpO1xuICAgICAgICBcbiAgICAgICAgdGhpcy5yZW5kZXJOZXh0UHJldigpO1xuXG4gICAgICAgIC8vIFNjcm9sbCBpbnRvIHZpZXdcbiAgICAgICAgdGhpcy4kZWwuc2Nyb2xsaW50b3ZpZXcoKTtcbiAgICB9LFxuICAgIFxuICAgIHJlbmRlck5leHRQcmV2IDogZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIFNldHVwIG5leHQvcHJldiBidXR0b25zXG4gICAgICAgIHRoaXMuJChcIi5wcmV2XCIpLnRvZ2dsZSh0aGlzLmdldFByZXZTZWN0aW9uSW5kZXgoKSAhPT0gdW5kZWZpbmVkKTtcbiAgICAgICAgdGhpcy4kKFwiLm5leHRcIikudG9nZ2xlKHRoaXMuZ2V0TmV4dFNlY3Rpb25JbmRleCgpICE9PSB1bmRlZmluZWQpO1xuICAgICAgICB0aGlzLiQoXCIuZmluaXNoXCIpLnRvZ2dsZSh0aGlzLmdldE5leHRTZWN0aW9uSW5kZXgoKSA9PT0gdW5kZWZpbmVkKTtcbiAgICB9LFxuXG4gICAgcmVuZGVyIDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuJGVsLmh0bWwodGVtcGxhdGVzWydmb3Jtcy9TZWN0aW9ucyddKCkpO1xuXG4gICAgICAgIC8vIEFkZCBzZWN0aW9uc1xuICAgICAgICB2YXIgc2VjdGlvbnNFbCA9IHRoaXMuJChcIi5zZWN0aW9uc1wiKTtcbiAgICAgICAgXy5lYWNoKHRoaXMuc2VjdGlvbnMsIGZ1bmN0aW9uKHMpIHtcbiAgICAgICAgICAgIHNlY3Rpb25zRWwuYXBwZW5kKHMuJGVsKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG59KTtcblxuZXhwb3J0cy5TZWN0aW9uID0gQmFja2JvbmUuVmlldy5leHRlbmQoe1xuICAgIGNsYXNzTmFtZSA6IFwic2VjdGlvblwiLFxuICAgIHRlbXBsYXRlIDogXy50ZW1wbGF0ZSgnPGRpdiBjbGFzcz1cImNvbnRlbnRzXCI+PC9kaXY+JyksXG5cbiAgICBpbml0aWFsaXplIDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMudGl0bGUgPSB0aGlzLm9wdGlvbnMudGl0bGU7XG4gICAgICAgIHRoaXMuY29udGVudHMgPSB0aGlzLm9wdGlvbnMuY29udGVudHM7XG5cbiAgICAgICAgLy8gQWx3YXlzIGludmlzaWJsZSBpbml0aWFsbHlcbiAgICAgICAgdGhpcy4kZWwuaGlkZSgpO1xuICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgIH0sXG5cbiAgICBzaG91bGRCZVZpc2libGUgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKCF0aGlzLm9wdGlvbnMuY29uZGl0aW9uYWwpXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy5jb25kaXRpb25hbCh0aGlzLm1vZGVsKTtcbiAgICB9LFxuXG4gICAgdmFsaWRhdGUgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gR2V0IGFsbCB2aXNpYmxlIGl0ZW1zXG4gICAgICAgIHZhciBpdGVtcyA9IF8uZmlsdGVyKHRoaXMuY29udGVudHMsIGZ1bmN0aW9uKGMpIHtcbiAgICAgICAgICAgIHJldHVybiBjLnZpc2libGUgJiYgYy52YWxpZGF0ZTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiAhXy5hbnkoXy5tYXAoaXRlbXMsIGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgICAgIHJldHVybiBpdGVtLnZhbGlkYXRlKCk7XG4gICAgICAgIH0pKTtcbiAgICB9LFxuXG4gICAgcmVuZGVyIDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuJGVsLmh0bWwodGhpcy50ZW1wbGF0ZSh0aGlzKSk7XG5cbiAgICAgICAgLy8gQWRkIGNvbnRlbnRzIChxdWVzdGlvbnMsIG1vc3RseSlcbiAgICAgICAgdmFyIGNvbnRlbnRzRWwgPSB0aGlzLiQoXCIuY29udGVudHNcIik7XG4gICAgICAgIF8uZWFjaCh0aGlzLmNvbnRlbnRzLCBmdW5jdGlvbihjKSB7XG4gICAgICAgICAgICBjb250ZW50c0VsLmFwcGVuZChjLiRlbCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxufSk7XG5cbmV4cG9ydHMuUXVlc3Rpb24gPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCh7XG4gICAgY2xhc3NOYW1lIDogXCJxdWVzdGlvblwiLFxuXG4gICAgdGVtcGxhdGUgOiBfLnRlbXBsYXRlKCc8ZGl2IGNsYXNzPVwicHJvbXB0XCI+PCU9b3B0aW9ucy5wcm9tcHQlPjwlPXJlbmRlclJlcXVpcmVkKCklPjwvZGl2PjxkaXYgY2xhc3M9XCJhbnN3ZXJcIj48L2Rpdj4nKSxcblxuICAgIHJlbmRlclJlcXVpcmVkIDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0aGlzLnJlcXVpcmVkKVxuICAgICAgICAgICAgcmV0dXJuICcmbmJzcDs8c3BhbiBjbGFzcz1cInJlcXVpcmVkXCI+Kjwvc3Bhbj4nO1xuICAgICAgICByZXR1cm4gJyc7XG4gICAgfSxcblxuICAgIHZhbGlkYXRlIDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciB2YWw7XG5cbiAgICAgICAgLy8gQ2hlY2sgcmVxdWlyZWRcbiAgICAgICAgaWYgKHRoaXMucmVxdWlyZWQpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLm1vZGVsLmdldCh0aGlzLmlkKSA9PT0gdW5kZWZpbmVkIHx8IHRoaXMubW9kZWwuZ2V0KHRoaXMuaWQpID09PSBudWxsIHx8IHRoaXMubW9kZWwuZ2V0KHRoaXMuaWQpID09PSBcIlwiKVxuICAgICAgICAgICAgICAgIHZhbCA9IFwiUmVxdWlyZWRcIjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENoZWNrIGN1c3RvbSB2YWxpZGF0aW9uXG4gICAgICAgIGlmICghdmFsICYmIHRoaXMub3B0aW9ucy52YWxpZGF0ZSkge1xuICAgICAgICAgICAgdmFsID0gdGhpcy5vcHRpb25zLnZhbGlkYXRlKCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBTaG93IHZhbGlkYXRpb24gcmVzdWx0cyBUT0RPXG4gICAgICAgIGlmICh2YWwpIHtcbiAgICAgICAgICAgIHRoaXMuJGVsLmFkZENsYXNzKFwiaW52YWxpZFwiKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuJGVsLnJlbW92ZUNsYXNzKFwiaW52YWxpZFwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB2YWw7XG4gICAgfSxcblxuICAgIHVwZGF0ZVZpc2liaWxpdHkgOiBmdW5jdGlvbihlKSB7XG4gICAgICAgIC8vIHNsaWRlVXAvc2xpZGVEb3duXG4gICAgICAgIGlmICh0aGlzLnNob3VsZEJlVmlzaWJsZSgpICYmICF0aGlzLnZpc2libGUpXG4gICAgICAgICAgICB0aGlzLiRlbC5zbGlkZURvd24oKTtcbiAgICAgICAgaWYgKCF0aGlzLnNob3VsZEJlVmlzaWJsZSgpICYmIHRoaXMudmlzaWJsZSlcbiAgICAgICAgICAgIHRoaXMuJGVsLnNsaWRlVXAoKTtcbiAgICAgICAgdGhpcy52aXNpYmxlID0gdGhpcy5zaG91bGRCZVZpc2libGUoKTtcbiAgICB9LFxuXG4gICAgc2hvdWxkQmVWaXNpYmxlIDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICghdGhpcy5vcHRpb25zLmNvbmRpdGlvbmFsKVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIHJldHVybiB0aGlzLm9wdGlvbnMuY29uZGl0aW9uYWwodGhpcy5tb2RlbCk7XG4gICAgfSxcblxuICAgIGluaXRpYWxpemUgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gQWRqdXN0IHZpc2liaWxpdHkgYmFzZWQgb24gbW9kZWxcbiAgICAgICAgdGhpcy5tb2RlbC5vbihcImNoYW5nZVwiLCB0aGlzLnVwZGF0ZVZpc2liaWxpdHksIHRoaXMpO1xuXG4gICAgICAgIC8vIFJlLXJlbmRlciBiYXNlZCBvbiBtb2RlbCBjaGFuZ2VzXG4gICAgICAgIHRoaXMubW9kZWwub24oXCJjaGFuZ2U6XCIgKyB0aGlzLmlkLCB0aGlzLnJlbmRlciwgdGhpcyk7XG5cbiAgICAgICAgdGhpcy5yZXF1aXJlZCA9IHRoaXMub3B0aW9ucy5yZXF1aXJlZDtcblxuICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgIH0sXG5cbiAgICByZW5kZXIgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy4kZWwuaHRtbCh0aGlzLnRlbXBsYXRlKHRoaXMpKTtcblxuICAgICAgICAvLyBSZW5kZXIgYW5zd2VyXG4gICAgICAgIHRoaXMucmVuZGVyQW5zd2VyKHRoaXMuJChcIi5hbnN3ZXJcIikpO1xuXG4gICAgICAgIHRoaXMuJGVsLnRvZ2dsZSh0aGlzLnNob3VsZEJlVmlzaWJsZSgpKTtcbiAgICAgICAgdGhpcy52aXNpYmxlID0gdGhpcy5zaG91bGRCZVZpc2libGUoKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG59KTtcblxuZXhwb3J0cy5SYWRpb1F1ZXN0aW9uID0gZXhwb3J0cy5RdWVzdGlvbi5leHRlbmQoe1xuICAgIGV2ZW50cyA6IHtcbiAgICAgICAgXCJjaGVja2VkXCIgOiBcImNoZWNrZWRcIixcbiAgICB9LFxuXG4gICAgY2hlY2tlZCA6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgdmFyIGluZGV4ID0gcGFyc2VJbnQoZS50YXJnZXQuZ2V0QXR0cmlidXRlKFwiZGF0YS12YWx1ZVwiKSk7XG4gICAgICAgIHZhciB2YWx1ZSA9IHRoaXMub3B0aW9ucy5vcHRpb25zW2luZGV4XVswXTtcbiAgICAgICAgdGhpcy5tb2RlbC5zZXQodGhpcy5pZCwgdmFsdWUpO1xuICAgIH0sXG5cbiAgICByZW5kZXJBbnN3ZXIgOiBmdW5jdGlvbihhbnN3ZXJFbCkge1xuICAgICAgICBhbnN3ZXJFbC5odG1sKF8udGVtcGxhdGUoJzxkaXYgY2xhc3M9XCJyYWRpby1ncm91cFwiPjwlPXJlbmRlclJhZGlvT3B0aW9ucygpJT48L2Rpdj4nLCB0aGlzKSk7XG4gICAgfSxcblxuICAgIHJlbmRlclJhZGlvT3B0aW9ucyA6IGZ1bmN0aW9uKCkge1xuICAgICAgICBodG1sID0gXCJcIjtcbiAgICAgICAgdmFyIGk7XG4gICAgICAgIGZvciAoIGkgPSAwOyBpIDwgdGhpcy5vcHRpb25zLm9wdGlvbnMubGVuZ3RoOyBpKyspXG4gICAgICAgICAgICBodG1sICs9IF8udGVtcGxhdGUoJzxkaXYgY2xhc3M9XCJyYWRpby1idXR0b24gPCU9Y2hlY2tlZCU+XCIgZGF0YS12YWx1ZT1cIjwlPXBvc2l0aW9uJT5cIj48JT10ZXh0JT48L2Rpdj4nLCB7XG4gICAgICAgICAgICAgICAgcG9zaXRpb24gOiBpLFxuICAgICAgICAgICAgICAgIHRleHQgOiB0aGlzLm9wdGlvbnMub3B0aW9uc1tpXVsxXSxcbiAgICAgICAgICAgICAgICBjaGVja2VkIDogdGhpcy5tb2RlbC5nZXQodGhpcy5pZCkgPT09IHRoaXMub3B0aW9ucy5vcHRpb25zW2ldWzBdID8gXCJjaGVja2VkXCIgOiBcIlwiXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gaHRtbDtcbiAgICB9XG5cbn0pO1xuXG5leHBvcnRzLkRyb3Bkb3duUXVlc3Rpb24gPSBleHBvcnRzLlF1ZXN0aW9uLmV4dGVuZCh7XG4gICAgZXZlbnRzIDoge1xuICAgICAgICBcImNoYW5nZVwiIDogXCJjaGFuZ2VkXCIsXG4gICAgfSxcblxuICAgIGNoYW5nZWQgOiBmdW5jdGlvbihlKSB7XG4gICAgICAgIHZhciB2YWwgPSAkKGUudGFyZ2V0KS52YWwoKTtcbiAgICAgICAgaWYgKHZhbCA9PSBcIlwiKSB7XG4gICAgICAgICAgICB0aGlzLm1vZGVsLnNldCh0aGlzLmlkLCBudWxsKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciBpbmRleCA9IHBhcnNlSW50KHZhbCk7XG4gICAgICAgICAgICB2YXIgdmFsdWUgPSB0aGlzLm9wdGlvbnMub3B0aW9uc1tpbmRleF1bMF07XG4gICAgICAgICAgICB0aGlzLm1vZGVsLnNldCh0aGlzLmlkLCB2YWx1ZSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgcmVuZGVyQW5zd2VyIDogZnVuY3Rpb24oYW5zd2VyRWwpIHtcbiAgICAgICAgYW5zd2VyRWwuaHRtbChfLnRlbXBsYXRlKCc8c2VsZWN0IGlkPVwic291cmNlX3R5cGVcIj48JT1yZW5kZXJEcm9wZG93bk9wdGlvbnMoKSU+PC9zZWxlY3Q+JywgdGhpcykpO1xuICAgIH0sXG5cbiAgICByZW5kZXJEcm9wZG93bk9wdGlvbnMgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaHRtbCA9IFwiXCI7XG5cbiAgICAgICAgLy8gQWRkIGVtcHR5IG9wdGlvblxuICAgICAgICBodG1sICs9ICc8b3B0aW9uIHZhbHVlPVwiXCI+PC9vcHRpb24+JztcblxuICAgICAgICB2YXIgaTtcbiAgICAgICAgZm9yICggaSA9IDA7IGkgPCB0aGlzLm9wdGlvbnMub3B0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaHRtbCArPSBfLnRlbXBsYXRlKCc8b3B0aW9uIHZhbHVlPVwiPCU9cG9zaXRpb24lPlwiIDwlPXNlbGVjdGVkJT4+PCUtdGV4dCU+PC9vcHRpb24+Jywge1xuICAgICAgICAgICAgICAgIHBvc2l0aW9uIDogaSxcbiAgICAgICAgICAgICAgICB0ZXh0IDogdGhpcy5vcHRpb25zLm9wdGlvbnNbaV1bMV0sXG4gICAgICAgICAgICAgICAgc2VsZWN0ZWQgOiB0aGlzLm1vZGVsLmdldCh0aGlzLmlkKSA9PT0gdGhpcy5vcHRpb25zLm9wdGlvbnNbaV1bMF0gPyAnc2VsZWN0ZWQ9XCJzZWxlY3RlZFwiJyA6IFwiXCJcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGh0bWw7XG4gICAgfVxuXG59KTtcblxuZXhwb3J0cy5NdWx0aWNoZWNrUXVlc3Rpb24gPSBleHBvcnRzLlF1ZXN0aW9uLmV4dGVuZCh7XG4gICAgZXZlbnRzIDoge1xuICAgICAgICBcImNoZWNrZWRcIiA6IFwiY2hlY2tlZFwiLFxuICAgIH0sXG5cbiAgICBjaGVja2VkIDogZnVuY3Rpb24oZSkge1xuICAgICAgICAvLyBHZXQgYWxsIGNoZWNrZWRcbiAgICAgICAgdmFyIHZhbHVlID0gW107XG4gICAgICAgIHZhciBvcHRzID0gdGhpcy5vcHRpb25zLm9wdGlvbnM7XG4gICAgICAgIHRoaXMuJChcIi5jaGVja2JveFwiKS5lYWNoKGZ1bmN0aW9uKGluZGV4KSB7XG4gICAgICAgICAgICBpZiAoJCh0aGlzKS5oYXNDbGFzcyhcImNoZWNrZWRcIikpXG4gICAgICAgICAgICAgICAgdmFsdWUucHVzaChvcHRzW2luZGV4XVswXSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLm1vZGVsLnNldCh0aGlzLmlkLCB2YWx1ZSk7XG4gICAgfSxcblxuICAgIHJlbmRlckFuc3dlciA6IGZ1bmN0aW9uKGFuc3dlckVsKSB7XG4gICAgICAgIHZhciBpO1xuICAgICAgICBmb3IgKCBpID0gMDsgaSA8IHRoaXMub3B0aW9ucy5vcHRpb25zLmxlbmd0aDsgaSsrKVxuICAgICAgICAgICAgYW5zd2VyRWwuYXBwZW5kKCQoXy50ZW1wbGF0ZSgnPGRpdiBjbGFzcz1cImNoZWNrYm94IDwlPWNoZWNrZWQlPlwiIGRhdGEtdmFsdWU9XCI8JT1wb3NpdGlvbiU+XCI+PCU9dGV4dCU+PC9kaXY+Jywge1xuICAgICAgICAgICAgICAgIHBvc2l0aW9uIDogaSxcbiAgICAgICAgICAgICAgICB0ZXh0IDogdGhpcy5vcHRpb25zLm9wdGlvbnNbaV1bMV0sXG4gICAgICAgICAgICAgICAgY2hlY2tlZCA6ICh0aGlzLm1vZGVsLmdldCh0aGlzLmlkKSAmJiBfLmNvbnRhaW5zKHRoaXMubW9kZWwuZ2V0KHRoaXMuaWQpLCB0aGlzLm9wdGlvbnMub3B0aW9uc1tpXVswXSkpID8gXCJjaGVja2VkXCIgOiBcIlwiXG4gICAgICAgICAgICB9KSkpO1xuICAgIH1cblxufSk7XG5cbmV4cG9ydHMuVGV4dFF1ZXN0aW9uID0gZXhwb3J0cy5RdWVzdGlvbi5leHRlbmQoe1xuICAgIHJlbmRlckFuc3dlciA6IGZ1bmN0aW9uKGFuc3dlckVsKSB7XG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMubXVsdGlsaW5lKSB7XG4gICAgICAgICAgICBhbnN3ZXJFbC5odG1sKF8udGVtcGxhdGUoJzx0ZXh0YXJlYS8+JywgdGhpcykpO1xuICAgICAgICAgICAgYW5zd2VyRWwuZmluZChcInRleHRhcmVhXCIpLnZhbCh0aGlzLm1vZGVsLmdldCh0aGlzLmlkKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhbnN3ZXJFbC5odG1sKF8udGVtcGxhdGUoJzxpbnB1dCB0eXBlPVwidGV4dFwiLz4nLCB0aGlzKSk7XG4gICAgICAgICAgICBhbnN3ZXJFbC5maW5kKFwiaW5wdXRcIikudmFsKHRoaXMubW9kZWwuZ2V0KHRoaXMuaWQpKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBldmVudHMgOiB7XG4gICAgICAgIFwiY2hhbmdlXCIgOiBcImNoYW5nZWRcIlxuICAgIH0sXG4gICAgY2hhbmdlZCA6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLm1vZGVsLnNldCh0aGlzLmlkLCB0aGlzLiQodGhpcy5vcHRpb25zLm11bHRpbGluZSA/IFwidGV4dGFyZWFcIiA6IFwiaW5wdXRcIikudmFsKCkpO1xuICAgIH1cblxufSk7XG5cbmV4cG9ydHMuTnVtYmVyUXVlc3Rpb24gPSBleHBvcnRzLlF1ZXN0aW9uLmV4dGVuZCh7XG4gICAgcmVuZGVyQW5zd2VyIDogZnVuY3Rpb24oYW5zd2VyRWwpIHtcbiAgICAgICAgYW5zd2VyRWwuaHRtbChfLnRlbXBsYXRlKCc8aW5wdXQgdHlwZT1cIm51bWJlclwiLz4nLCB0aGlzKSk7XG4gICAgICAgIGFuc3dlckVsLmZpbmQoXCJpbnB1dFwiKS52YWwodGhpcy5tb2RlbC5nZXQodGhpcy5pZCkpO1xuICAgIH0sXG5cbiAgICBldmVudHMgOiB7XG4gICAgICAgIFwiY2hhbmdlXCIgOiBcImNoYW5nZWRcIlxuICAgIH0sXG4gICAgY2hhbmdlZCA6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLm1vZGVsLnNldCh0aGlzLmlkLCBwYXJzZUZsb2F0KHRoaXMuJChcImlucHV0XCIpLnZhbCgpKSk7XG4gICAgfVxuXG59KTtcblxuZXhwb3J0cy5QaG90b1F1ZXN0aW9uID0gZXhwb3J0cy5RdWVzdGlvbi5leHRlbmQoe1xuICAgIHJlbmRlckFuc3dlciA6IGZ1bmN0aW9uKGFuc3dlckVsKSB7XG4gICAgICAgIGFuc3dlckVsLmh0bWwoXy50ZW1wbGF0ZSgnPGltZyBzdHlsZT1cIm1heC13aWR0aDogMTAwcHg7XCIgc3JjPVwiaW1hZ2VzL2NhbWVyYS1pY29uLmpwZ1wiLz4nLCB0aGlzKSk7XG4gICAgfSxcblxuICAgIGV2ZW50cyA6IHtcbiAgICAgICAgXCJjbGljayBpbWdcIiA6IFwidGFrZVBpY3R1cmVcIlxuICAgIH0sXG5cbiAgICB0YWtlUGljdHVyZSA6IGZ1bmN0aW9uKCkge1xuICAgICAgICBhbGVydChcIkluIGFuIGFwcCwgdGhpcyB3b3VsZCBsYXVuY2ggdGhlIGNhbWVyYSBhY3Rpdml0eSBhcyBpbiBtV2F0ZXIgbmF0aXZlIGFwcHMuXCIpO1xuICAgIH1cblxufSk7XG5cbmV4cG9ydHMuRGF0ZVF1ZXN0aW9uID0gZXhwb3J0cy5RdWVzdGlvbi5leHRlbmQoe1xuICAgIGV2ZW50cyA6IHtcbiAgICAgICAgXCJjaGFuZ2VcIiA6IFwiY2hhbmdlZFwiXG4gICAgfSxcblxuICAgIGNoYW5nZWQgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5tb2RlbC5zZXQodGhpcy5pZCwgdGhpcy4kZWwuZmluZCgnaW5wdXRbbmFtZT1cImRhdGVcIl0nKS52YWwoKSk7XG4gICAgfSxcbiAgICByZW5kZXJBbnN3ZXIgOiBmdW5jdGlvbihhbnN3ZXJFbCkge1xuICAgICAgICBhbnN3ZXJFbC5odG1sKF8udGVtcGxhdGUoJzxpbnB1dCBjbGFzcz1cIm5lZWRzY2xpY2tcIiBuYW1lPVwiZGF0ZVwiIC8+JywgdGhpcykpO1xuXG4gICAgICAgIGFuc3dlckVsLmZpbmQoJ2lucHV0JykudmFsKHRoaXMubW9kZWwuZ2V0KHRoaXMuaWQpKTtcblxuICAgICAgICBhbnN3ZXJFbC5maW5kKCdpbnB1dCcpLnNjcm9sbGVyKHtcbiAgICAgICAgICAgIHByZXNldCA6ICdkYXRlJyxcbiAgICAgICAgICAgIHRoZW1lIDogJ2lvcycsXG4gICAgICAgICAgICBkaXNwbGF5IDogJ21vZGFsJyxcbiAgICAgICAgICAgIG1vZGUgOiAnc2Nyb2xsZXInLFxuICAgICAgICAgICAgZGF0ZU9yZGVyIDogJ21tRCBkZHl5JyxcbiAgICAgICAgfSk7XG4gICAgfSxcblxufSk7XG4iLCIjIEltcHJvdmVkIGxvY2F0aW9uIGZpbmRlclxuY2xhc3MgTG9jYXRpb25GaW5kZXJcbiAgY29uc3RydWN0b3I6IC0+XG4gICAgXy5leHRlbmQgQCwgQmFja2JvbmUuRXZlbnRzXG4gICAgXG4gIGdldExvY2F0aW9uOiAtPlxuICAgICMgQm90aCBmYWlsdXJlcyBhcmUgcmVxdWlyZWQgdG8gdHJpZ2dlciBlcnJvclxuICAgIGxvY2F0aW9uRXJyb3IgPSBfLmFmdGVyIDIsID0+XG4gICAgICBAdHJpZ2dlciAnZXJyb3InXG5cbiAgICBoaWdoQWNjdXJhY3lGaXJlZCA9IGZhbHNlXG5cbiAgICBsb3dBY2N1cmFjeSA9IChwb3MpID0+XG4gICAgICBpZiBub3QgaGlnaEFjY3VyYWN5RmlyZWRcbiAgICAgICAgQHRyaWdnZXIgJ2ZvdW5kJywgcG9zXG5cbiAgICBoaWdoQWNjdXJhY3kgPSAocG9zKSA9PlxuICAgICAgaGlnaEFjY3VyYWN5RmlyZWQgPSB0cnVlXG4gICAgICBAdHJpZ2dlciAnZm91bmQnLCBwb3NcblxuICAgICMgR2V0IGJvdGggaGlnaCBhbmQgbG93IGFjY3VyYWN5LCBhcyBsb3cgaXMgc3VmZmljaWVudCBmb3IgaW5pdGlhbCBkaXNwbGF5XG4gICAgbmF2aWdhdG9yLmdlb2xvY2F0aW9uLmdldEN1cnJlbnRQb3NpdGlvbihsb3dBY2N1cmFjeSwgbG9jYXRpb25FcnJvciwge1xuICAgICAgICBtYXhpbXVtQWdlIDogMzYwMCoyNCxcbiAgICAgICAgdGltZW91dCA6IDEwMDAwLFxuICAgICAgICBlbmFibGVIaWdoQWNjdXJhY3kgOiBmYWxzZVxuICAgIH0pXG5cbiAgICBuYXZpZ2F0b3IuZ2VvbG9jYXRpb24uZ2V0Q3VycmVudFBvc2l0aW9uKGhpZ2hBY2N1cmFjeSwgbG9jYXRpb25FcnJvciwge1xuICAgICAgICBtYXhpbXVtQWdlIDogMzYwMCxcbiAgICAgICAgdGltZW91dCA6IDMwMDAwLFxuICAgICAgICBlbmFibGVIaWdoQWNjdXJhY3kgOiB0cnVlXG4gICAgfSlcblxuICBzdGFydFdhdGNoOiAtPlxuICAgICMgQWxsb3cgb25lIHdhdGNoIGF0IG1vc3RcbiAgICBpZiBAbG9jYXRpb25XYXRjaElkP1xuICAgICAgQHN0b3BXYXRjaCgpXG5cbiAgICBoaWdoQWNjdXJhY3lGaXJlZCA9IGZhbHNlXG4gICAgbG93QWNjdXJhY3lGaXJlZCA9IGZhbHNlXG5cbiAgICBsb3dBY2N1cmFjeSA9IChwb3MpID0+XG4gICAgICBpZiBub3QgaGlnaEFjY3VyYWN5RmlyZWRcbiAgICAgICAgbG93QWNjdXJhY3lGaXJlZCA9IHRydWVcbiAgICAgICAgQHRyaWdnZXIgJ2ZvdW5kJywgcG9zXG5cbiAgICBoaWdoQWNjdXJhY3kgPSAocG9zKSA9PlxuICAgICAgaGlnaEFjY3VyYWN5RmlyZWQgPSB0cnVlXG4gICAgICBAdHJpZ2dlciAnZm91bmQnLCBwb3NcblxuICAgIGVycm9yID0gKGVycm9yKSA9PlxuICAgICAgY29uc29sZS5sb2cgXCIjIyMgZXJyb3IgXCJcbiAgICAgICMgTm8gZXJyb3IgaWYgZmlyZWQgb25jZVxuICAgICAgaWYgbm90IGxvd0FjY3VyYWN5RmlyZWQgYW5kIG5vdCBoaWdoQWNjdXJhY3lGaXJlZFxuICAgICAgICBAdHJpZ2dlciAnZXJyb3InLCBlcnJvclxuXG4gICAgIyBGaXJlIGluaXRpYWwgbG93LWFjY3VyYWN5IG9uZVxuICAgIG5hdmlnYXRvci5nZW9sb2NhdGlvbi5nZXRDdXJyZW50UG9zaXRpb24obG93QWNjdXJhY3ksIGVycm9yLCB7XG4gICAgICAgIG1heGltdW1BZ2UgOiAzNjAwKjI0LFxuICAgICAgICB0aW1lb3V0IDogMTAwMDAsXG4gICAgICAgIGVuYWJsZUhpZ2hBY2N1cmFjeSA6IGZhbHNlXG4gICAgfSlcblxuICAgIEBsb2NhdGlvbldhdGNoSWQgPSBuYXZpZ2F0b3IuZ2VvbG9jYXRpb24ud2F0Y2hQb3NpdGlvbihoaWdoQWNjdXJhY3ksIGVycm9yLCB7XG4gICAgICAgIG1heGltdW1BZ2UgOiAzMDAwLFxuICAgICAgICBlbmFibGVIaWdoQWNjdXJhY3kgOiB0cnVlXG4gICAgfSkgIFxuXG4gIHN0b3BXYXRjaDogLT5cbiAgICBpZiBAbG9jYXRpb25XYXRjaElkP1xuICAgICAgbmF2aWdhdG9yLmdlb2xvY2F0aW9uLmNsZWFyV2F0Y2goQGxvY2F0aW9uV2F0Y2hJZClcbiAgICAgIEBsb2NhdGlvbldhdGNoSWQgPSB1bmRlZmluZWRcblxuXG5tb2R1bGUuZXhwb3J0cyA9IExvY2F0aW9uRmluZGVyICAiLCIvLyBUT0RPIGFkZCBsaWNlbnNlXG5cbkxvY2FsQ29sbGVjdGlvbiA9IHt9O1xuRUpTT04gPSByZXF1aXJlKFwiLi9FSlNPTlwiKTtcblxuLy8gTGlrZSBfLmlzQXJyYXksIGJ1dCBkb2Vzbid0IHJlZ2FyZCBwb2x5ZmlsbGVkIFVpbnQ4QXJyYXlzIG9uIG9sZCBicm93c2VycyBhc1xuLy8gYXJyYXlzLlxudmFyIGlzQXJyYXkgPSBmdW5jdGlvbiAoeCkge1xuICByZXR1cm4gXy5pc0FycmF5KHgpICYmICFFSlNPTi5pc0JpbmFyeSh4KTtcbn07XG5cbnZhciBfYW55SWZBcnJheSA9IGZ1bmN0aW9uICh4LCBmKSB7XG4gIGlmIChpc0FycmF5KHgpKVxuICAgIHJldHVybiBfLmFueSh4LCBmKTtcbiAgcmV0dXJuIGYoeCk7XG59O1xuXG52YXIgX2FueUlmQXJyYXlQbHVzID0gZnVuY3Rpb24gKHgsIGYpIHtcbiAgaWYgKGYoeCkpXG4gICAgcmV0dXJuIHRydWU7XG4gIHJldHVybiBpc0FycmF5KHgpICYmIF8uYW55KHgsIGYpO1xufTtcblxudmFyIGhhc09wZXJhdG9ycyA9IGZ1bmN0aW9uKHZhbHVlU2VsZWN0b3IpIHtcbiAgdmFyIHRoZXNlQXJlT3BlcmF0b3JzID0gdW5kZWZpbmVkO1xuICBmb3IgKHZhciBzZWxLZXkgaW4gdmFsdWVTZWxlY3Rvcikge1xuICAgIHZhciB0aGlzSXNPcGVyYXRvciA9IHNlbEtleS5zdWJzdHIoMCwgMSkgPT09ICckJztcbiAgICBpZiAodGhlc2VBcmVPcGVyYXRvcnMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhlc2VBcmVPcGVyYXRvcnMgPSB0aGlzSXNPcGVyYXRvcjtcbiAgICB9IGVsc2UgaWYgKHRoZXNlQXJlT3BlcmF0b3JzICE9PSB0aGlzSXNPcGVyYXRvcikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSW5jb25zaXN0ZW50IHNlbGVjdG9yOiBcIiArIHZhbHVlU2VsZWN0b3IpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gISF0aGVzZUFyZU9wZXJhdG9yczsgIC8vIHt9IGhhcyBubyBvcGVyYXRvcnNcbn07XG5cbnZhciBjb21waWxlVmFsdWVTZWxlY3RvciA9IGZ1bmN0aW9uICh2YWx1ZVNlbGVjdG9yKSB7XG4gIGlmICh2YWx1ZVNlbGVjdG9yID09IG51bGwpIHsgIC8vIHVuZGVmaW5lZCBvciBudWxsXG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgcmV0dXJuIF9hbnlJZkFycmF5KHZhbHVlLCBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4geCA9PSBudWxsOyAgLy8gdW5kZWZpbmVkIG9yIG51bGxcbiAgICAgIH0pO1xuICAgIH07XG4gIH1cblxuICAvLyBTZWxlY3RvciBpcyBhIG5vbi1udWxsIHByaW1pdGl2ZSAoYW5kIG5vdCBhbiBhcnJheSBvciBSZWdFeHAgZWl0aGVyKS5cbiAgaWYgKCFfLmlzT2JqZWN0KHZhbHVlU2VsZWN0b3IpKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgcmV0dXJuIF9hbnlJZkFycmF5KHZhbHVlLCBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4geCA9PT0gdmFsdWVTZWxlY3RvcjtcbiAgICAgIH0pO1xuICAgIH07XG4gIH1cblxuICBpZiAodmFsdWVTZWxlY3RvciBpbnN0YW5jZW9mIFJlZ0V4cCkge1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICByZXR1cm4gX2FueUlmQXJyYXkodmFsdWUsIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiB2YWx1ZVNlbGVjdG9yLnRlc3QoeCk7XG4gICAgICB9KTtcbiAgICB9O1xuICB9XG5cbiAgLy8gQXJyYXlzIG1hdGNoIGVpdGhlciBpZGVudGljYWwgYXJyYXlzIG9yIGFycmF5cyB0aGF0IGNvbnRhaW4gaXQgYXMgYSB2YWx1ZS5cbiAgaWYgKGlzQXJyYXkodmFsdWVTZWxlY3RvcikpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICBpZiAoIWlzQXJyYXkodmFsdWUpKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICByZXR1cm4gX2FueUlmQXJyYXlQbHVzKHZhbHVlLCBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4gTG9jYWxDb2xsZWN0aW9uLl9mLl9lcXVhbCh2YWx1ZVNlbGVjdG9yLCB4KTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH1cblxuICAvLyBJdCdzIGFuIG9iamVjdCwgYnV0IG5vdCBhbiBhcnJheSBvciByZWdleHAuXG4gIGlmIChoYXNPcGVyYXRvcnModmFsdWVTZWxlY3RvcikpIHtcbiAgICB2YXIgb3BlcmF0b3JGdW5jdGlvbnMgPSBbXTtcbiAgICBfLmVhY2godmFsdWVTZWxlY3RvciwgZnVuY3Rpb24gKG9wZXJhbmQsIG9wZXJhdG9yKSB7XG4gICAgICBpZiAoIV8uaGFzKFZBTFVFX09QRVJBVE9SUywgb3BlcmF0b3IpKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJVbnJlY29nbml6ZWQgb3BlcmF0b3I6IFwiICsgb3BlcmF0b3IpO1xuICAgICAgb3BlcmF0b3JGdW5jdGlvbnMucHVzaChWQUxVRV9PUEVSQVRPUlNbb3BlcmF0b3JdKFxuICAgICAgICBvcGVyYW5kLCB2YWx1ZVNlbGVjdG9yLiRvcHRpb25zKSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgcmV0dXJuIF8uYWxsKG9wZXJhdG9yRnVuY3Rpb25zLCBmdW5jdGlvbiAoZikge1xuICAgICAgICByZXR1cm4gZih2YWx1ZSk7XG4gICAgICB9KTtcbiAgICB9O1xuICB9XG5cbiAgLy8gSXQncyBhIGxpdGVyYWw7IGNvbXBhcmUgdmFsdWUgKG9yIGVsZW1lbnQgb2YgdmFsdWUgYXJyYXkpIGRpcmVjdGx5IHRvIHRoZVxuICAvLyBzZWxlY3Rvci5cbiAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIHJldHVybiBfYW55SWZBcnJheSh2YWx1ZSwgZnVuY3Rpb24gKHgpIHtcbiAgICAgIHJldHVybiBMb2NhbENvbGxlY3Rpb24uX2YuX2VxdWFsKHZhbHVlU2VsZWN0b3IsIHgpO1xuICAgIH0pO1xuICB9O1xufTtcblxuLy8gWFhYIGNhbiBmYWN0b3Igb3V0IGNvbW1vbiBsb2dpYyBiZWxvd1xudmFyIExPR0lDQUxfT1BFUkFUT1JTID0ge1xuICBcIiRhbmRcIjogZnVuY3Rpb24oc3ViU2VsZWN0b3IpIHtcbiAgICBpZiAoIWlzQXJyYXkoc3ViU2VsZWN0b3IpIHx8IF8uaXNFbXB0eShzdWJTZWxlY3RvcikpXG4gICAgICB0aHJvdyBFcnJvcihcIiRhbmQvJG9yLyRub3IgbXVzdCBiZSBub25lbXB0eSBhcnJheVwiKTtcbiAgICB2YXIgc3ViU2VsZWN0b3JGdW5jdGlvbnMgPSBfLm1hcChcbiAgICAgIHN1YlNlbGVjdG9yLCBjb21waWxlRG9jdW1lbnRTZWxlY3Rvcik7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChkb2MpIHtcbiAgICAgIHJldHVybiBfLmFsbChzdWJTZWxlY3RvckZ1bmN0aW9ucywgZnVuY3Rpb24gKGYpIHtcbiAgICAgICAgcmV0dXJuIGYoZG9jKTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0sXG5cbiAgXCIkb3JcIjogZnVuY3Rpb24oc3ViU2VsZWN0b3IpIHtcbiAgICBpZiAoIWlzQXJyYXkoc3ViU2VsZWN0b3IpIHx8IF8uaXNFbXB0eShzdWJTZWxlY3RvcikpXG4gICAgICB0aHJvdyBFcnJvcihcIiRhbmQvJG9yLyRub3IgbXVzdCBiZSBub25lbXB0eSBhcnJheVwiKTtcbiAgICB2YXIgc3ViU2VsZWN0b3JGdW5jdGlvbnMgPSBfLm1hcChcbiAgICAgIHN1YlNlbGVjdG9yLCBjb21waWxlRG9jdW1lbnRTZWxlY3Rvcik7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChkb2MpIHtcbiAgICAgIHJldHVybiBfLmFueShzdWJTZWxlY3RvckZ1bmN0aW9ucywgZnVuY3Rpb24gKGYpIHtcbiAgICAgICAgcmV0dXJuIGYoZG9jKTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0sXG5cbiAgXCIkbm9yXCI6IGZ1bmN0aW9uKHN1YlNlbGVjdG9yKSB7XG4gICAgaWYgKCFpc0FycmF5KHN1YlNlbGVjdG9yKSB8fCBfLmlzRW1wdHkoc3ViU2VsZWN0b3IpKVxuICAgICAgdGhyb3cgRXJyb3IoXCIkYW5kLyRvci8kbm9yIG11c3QgYmUgbm9uZW1wdHkgYXJyYXlcIik7XG4gICAgdmFyIHN1YlNlbGVjdG9yRnVuY3Rpb25zID0gXy5tYXAoXG4gICAgICBzdWJTZWxlY3RvciwgY29tcGlsZURvY3VtZW50U2VsZWN0b3IpO1xuICAgIHJldHVybiBmdW5jdGlvbiAoZG9jKSB7XG4gICAgICByZXR1cm4gXy5hbGwoc3ViU2VsZWN0b3JGdW5jdGlvbnMsIGZ1bmN0aW9uIChmKSB7XG4gICAgICAgIHJldHVybiAhZihkb2MpO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSxcblxuICBcIiR3aGVyZVwiOiBmdW5jdGlvbihzZWxlY3RvclZhbHVlKSB7XG4gICAgaWYgKCEoc2VsZWN0b3JWYWx1ZSBpbnN0YW5jZW9mIEZ1bmN0aW9uKSkge1xuICAgICAgc2VsZWN0b3JWYWx1ZSA9IEZ1bmN0aW9uKFwicmV0dXJuIFwiICsgc2VsZWN0b3JWYWx1ZSk7XG4gICAgfVxuICAgIHJldHVybiBmdW5jdGlvbiAoZG9jKSB7XG4gICAgICByZXR1cm4gc2VsZWN0b3JWYWx1ZS5jYWxsKGRvYyk7XG4gICAgfTtcbiAgfVxufTtcblxudmFyIFZBTFVFX09QRVJBVE9SUyA9IHtcbiAgXCIkaW5cIjogZnVuY3Rpb24gKG9wZXJhbmQpIHtcbiAgICBpZiAoIWlzQXJyYXkob3BlcmFuZCkpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJBcmd1bWVudCB0byAkaW4gbXVzdCBiZSBhcnJheVwiKTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICByZXR1cm4gX2FueUlmQXJyYXlQbHVzKHZhbHVlLCBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4gXy5hbnkob3BlcmFuZCwgZnVuY3Rpb24gKG9wZXJhbmRFbHQpIHtcbiAgICAgICAgICByZXR1cm4gTG9jYWxDb2xsZWN0aW9uLl9mLl9lcXVhbChvcGVyYW5kRWx0LCB4KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9O1xuICB9LFxuXG4gIFwiJGFsbFwiOiBmdW5jdGlvbiAob3BlcmFuZCkge1xuICAgIGlmICghaXNBcnJheShvcGVyYW5kKSlcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkFyZ3VtZW50IHRvICRhbGwgbXVzdCBiZSBhcnJheVwiKTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICBpZiAoIWlzQXJyYXkodmFsdWUpKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICByZXR1cm4gXy5hbGwob3BlcmFuZCwgZnVuY3Rpb24gKG9wZXJhbmRFbHQpIHtcbiAgICAgICAgcmV0dXJuIF8uYW55KHZhbHVlLCBmdW5jdGlvbiAodmFsdWVFbHQpIHtcbiAgICAgICAgICByZXR1cm4gTG9jYWxDb2xsZWN0aW9uLl9mLl9lcXVhbChvcGVyYW5kRWx0LCB2YWx1ZUVsdCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSxcblxuICBcIiRsdFwiOiBmdW5jdGlvbiAob3BlcmFuZCkge1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJldHVybiBfYW55SWZBcnJheSh2YWx1ZSwgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIExvY2FsQ29sbGVjdGlvbi5fZi5fY21wKHgsIG9wZXJhbmQpIDwgMDtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0sXG5cbiAgXCIkbHRlXCI6IGZ1bmN0aW9uIChvcGVyYW5kKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgcmV0dXJuIF9hbnlJZkFycmF5KHZhbHVlLCBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4gTG9jYWxDb2xsZWN0aW9uLl9mLl9jbXAoeCwgb3BlcmFuZCkgPD0gMDtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0sXG5cbiAgXCIkZ3RcIjogZnVuY3Rpb24gKG9wZXJhbmQpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICByZXR1cm4gX2FueUlmQXJyYXkodmFsdWUsIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiBMb2NhbENvbGxlY3Rpb24uX2YuX2NtcCh4LCBvcGVyYW5kKSA+IDA7XG4gICAgICB9KTtcbiAgICB9O1xuICB9LFxuXG4gIFwiJGd0ZVwiOiBmdW5jdGlvbiAob3BlcmFuZCkge1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJldHVybiBfYW55SWZBcnJheSh2YWx1ZSwgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIExvY2FsQ29sbGVjdGlvbi5fZi5fY21wKHgsIG9wZXJhbmQpID49IDA7XG4gICAgICB9KTtcbiAgICB9O1xuICB9LFxuXG4gIFwiJG5lXCI6IGZ1bmN0aW9uIChvcGVyYW5kKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgcmV0dXJuICEgX2FueUlmQXJyYXlQbHVzKHZhbHVlLCBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4gTG9jYWxDb2xsZWN0aW9uLl9mLl9lcXVhbCh4LCBvcGVyYW5kKTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0sXG5cbiAgXCIkbmluXCI6IGZ1bmN0aW9uIChvcGVyYW5kKSB7XG4gICAgaWYgKCFpc0FycmF5KG9wZXJhbmQpKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQXJndW1lbnQgdG8gJG5pbiBtdXN0IGJlIGFycmF5XCIpO1xuICAgIHZhciBpbkZ1bmN0aW9uID0gVkFMVUVfT1BFUkFUT1JTLiRpbihvcGVyYW5kKTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAvLyBGaWVsZCBkb2Vzbid0IGV4aXN0LCBzbyBpdCdzIG5vdC1pbiBvcGVyYW5kXG4gICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZClcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICByZXR1cm4gIWluRnVuY3Rpb24odmFsdWUpO1xuICAgIH07XG4gIH0sXG5cbiAgXCIkZXhpc3RzXCI6IGZ1bmN0aW9uIChvcGVyYW5kKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgcmV0dXJuIG9wZXJhbmQgPT09ICh2YWx1ZSAhPT0gdW5kZWZpbmVkKTtcbiAgICB9O1xuICB9LFxuXG4gIFwiJG1vZFwiOiBmdW5jdGlvbiAob3BlcmFuZCkge1xuICAgIHZhciBkaXZpc29yID0gb3BlcmFuZFswXSxcbiAgICAgICAgcmVtYWluZGVyID0gb3BlcmFuZFsxXTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICByZXR1cm4gX2FueUlmQXJyYXkodmFsdWUsIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiB4ICUgZGl2aXNvciA9PT0gcmVtYWluZGVyO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSxcblxuICBcIiRzaXplXCI6IGZ1bmN0aW9uIChvcGVyYW5kKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgcmV0dXJuIGlzQXJyYXkodmFsdWUpICYmIG9wZXJhbmQgPT09IHZhbHVlLmxlbmd0aDtcbiAgICB9O1xuICB9LFxuXG4gIFwiJHR5cGVcIjogZnVuY3Rpb24gKG9wZXJhbmQpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAvLyBBIG5vbmV4aXN0ZW50IGZpZWxkIGlzIG9mIG5vIHR5cGUuXG4gICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZClcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgLy8gRGVmaW5pdGVseSBub3QgX2FueUlmQXJyYXlQbHVzOiAkdHlwZTogNCBvbmx5IG1hdGNoZXMgYXJyYXlzIHRoYXQgaGF2ZVxuICAgICAgLy8gYXJyYXlzIGFzIGVsZW1lbnRzIGFjY29yZGluZyB0byB0aGUgTW9uZ28gZG9jcy5cbiAgICAgIHJldHVybiBfYW55SWZBcnJheSh2YWx1ZSwgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIExvY2FsQ29sbGVjdGlvbi5fZi5fdHlwZSh4KSA9PT0gb3BlcmFuZDtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0sXG5cbiAgXCIkcmVnZXhcIjogZnVuY3Rpb24gKG9wZXJhbmQsIG9wdGlvbnMpIHtcbiAgICBpZiAob3B0aW9ucyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAvLyBPcHRpb25zIHBhc3NlZCBpbiAkb3B0aW9ucyAoZXZlbiB0aGUgZW1wdHkgc3RyaW5nKSBhbHdheXMgb3ZlcnJpZGVzXG4gICAgICAvLyBvcHRpb25zIGluIHRoZSBSZWdFeHAgb2JqZWN0IGl0c2VsZi5cblxuICAgICAgLy8gQmUgY2xlYXIgdGhhdCB3ZSBvbmx5IHN1cHBvcnQgdGhlIEpTLXN1cHBvcnRlZCBvcHRpb25zLCBub3QgZXh0ZW5kZWRcbiAgICAgIC8vIG9uZXMgKGVnLCBNb25nbyBzdXBwb3J0cyB4IGFuZCBzKS4gSWRlYWxseSB3ZSB3b3VsZCBpbXBsZW1lbnQgeCBhbmQgc1xuICAgICAgLy8gYnkgdHJhbnNmb3JtaW5nIHRoZSByZWdleHAsIGJ1dCBub3QgdG9kYXkuLi5cbiAgICAgIGlmICgvW15naW1dLy50ZXN0KG9wdGlvbnMpKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJPbmx5IHRoZSBpLCBtLCBhbmQgZyByZWdleHAgb3B0aW9ucyBhcmUgc3VwcG9ydGVkXCIpO1xuXG4gICAgICB2YXIgcmVnZXhTb3VyY2UgPSBvcGVyYW5kIGluc3RhbmNlb2YgUmVnRXhwID8gb3BlcmFuZC5zb3VyY2UgOiBvcGVyYW5kO1xuICAgICAgb3BlcmFuZCA9IG5ldyBSZWdFeHAocmVnZXhTb3VyY2UsIG9wdGlvbnMpO1xuICAgIH0gZWxzZSBpZiAoIShvcGVyYW5kIGluc3RhbmNlb2YgUmVnRXhwKSkge1xuICAgICAgb3BlcmFuZCA9IG5ldyBSZWdFeHAob3BlcmFuZCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIHJldHVybiBfYW55SWZBcnJheSh2YWx1ZSwgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIG9wZXJhbmQudGVzdCh4KTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0sXG5cbiAgXCIkb3B0aW9uc1wiOiBmdW5jdGlvbiAob3BlcmFuZCkge1xuICAgIC8vIGV2YWx1YXRpb24gaGFwcGVucyBhdCB0aGUgJHJlZ2V4IGZ1bmN0aW9uIGFib3ZlXG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkgeyByZXR1cm4gdHJ1ZTsgfTtcbiAgfSxcblxuICBcIiRlbGVtTWF0Y2hcIjogZnVuY3Rpb24gKG9wZXJhbmQpIHtcbiAgICB2YXIgbWF0Y2hlciA9IGNvbXBpbGVEb2N1bWVudFNlbGVjdG9yKG9wZXJhbmQpO1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIGlmICghaXNBcnJheSh2YWx1ZSkpXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIHJldHVybiBfLmFueSh2YWx1ZSwgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIG1hdGNoZXIoeCk7XG4gICAgICB9KTtcbiAgICB9O1xuICB9LFxuXG4gIFwiJG5vdFwiOiBmdW5jdGlvbiAob3BlcmFuZCkge1xuICAgIHZhciBtYXRjaGVyID0gY29tcGlsZVZhbHVlU2VsZWN0b3Iob3BlcmFuZCk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgcmV0dXJuICFtYXRjaGVyKHZhbHVlKTtcbiAgICB9O1xuICB9LFxuXG4gIFwiJG5lYXJcIjogZnVuY3Rpb24gKG9wZXJhbmQpIHtcbiAgICAvLyBBbHdheXMgcmV0dXJucyB0cnVlLiBNdXN0IGJlIGhhbmRsZWQgaW4gcG9zdC1maWx0ZXIvc29ydC9saW1pdFxuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfSxcblxuICBcIiRnZW9JbnRlcnNlY3RzXCI6IGZ1bmN0aW9uIChvcGVyYW5kKSB7XG4gICAgLy8gQWx3YXlzIHJldHVybnMgdHJ1ZS4gTXVzdCBiZSBoYW5kbGVkIGluIHBvc3QtZmlsdGVyL3NvcnQvbGltaXRcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cblxufTtcblxuLy8gaGVscGVycyB1c2VkIGJ5IGNvbXBpbGVkIHNlbGVjdG9yIGNvZGVcbkxvY2FsQ29sbGVjdGlvbi5fZiA9IHtcbiAgLy8gWFhYIGZvciBfYWxsIGFuZCBfaW4sIGNvbnNpZGVyIGJ1aWxkaW5nICdpbnF1ZXJ5JyBhdCBjb21waWxlIHRpbWUuLlxuXG4gIF90eXBlOiBmdW5jdGlvbiAodikge1xuICAgIGlmICh0eXBlb2YgdiA9PT0gXCJudW1iZXJcIilcbiAgICAgIHJldHVybiAxO1xuICAgIGlmICh0eXBlb2YgdiA9PT0gXCJzdHJpbmdcIilcbiAgICAgIHJldHVybiAyO1xuICAgIGlmICh0eXBlb2YgdiA9PT0gXCJib29sZWFuXCIpXG4gICAgICByZXR1cm4gODtcbiAgICBpZiAoaXNBcnJheSh2KSlcbiAgICAgIHJldHVybiA0O1xuICAgIGlmICh2ID09PSBudWxsKVxuICAgICAgcmV0dXJuIDEwO1xuICAgIGlmICh2IGluc3RhbmNlb2YgUmVnRXhwKVxuICAgICAgcmV0dXJuIDExO1xuICAgIGlmICh0eXBlb2YgdiA9PT0gXCJmdW5jdGlvblwiKVxuICAgICAgLy8gbm90ZSB0aGF0IHR5cGVvZigveC8pID09PSBcImZ1bmN0aW9uXCJcbiAgICAgIHJldHVybiAxMztcbiAgICBpZiAodiBpbnN0YW5jZW9mIERhdGUpXG4gICAgICByZXR1cm4gOTtcbiAgICBpZiAoRUpTT04uaXNCaW5hcnkodikpXG4gICAgICByZXR1cm4gNTtcbiAgICBpZiAodiBpbnN0YW5jZW9mIE1ldGVvci5Db2xsZWN0aW9uLk9iamVjdElEKVxuICAgICAgcmV0dXJuIDc7XG4gICAgcmV0dXJuIDM7IC8vIG9iamVjdFxuXG4gICAgLy8gWFhYIHN1cHBvcnQgc29tZS9hbGwgb2YgdGhlc2U6XG4gICAgLy8gMTQsIHN5bWJvbFxuICAgIC8vIDE1LCBqYXZhc2NyaXB0IGNvZGUgd2l0aCBzY29wZVxuICAgIC8vIDE2LCAxODogMzItYml0LzY0LWJpdCBpbnRlZ2VyXG4gICAgLy8gMTcsIHRpbWVzdGFtcFxuICAgIC8vIDI1NSwgbWlua2V5XG4gICAgLy8gMTI3LCBtYXhrZXlcbiAgfSxcblxuICAvLyBkZWVwIGVxdWFsaXR5IHRlc3Q6IHVzZSBmb3IgbGl0ZXJhbCBkb2N1bWVudCBhbmQgYXJyYXkgbWF0Y2hlc1xuICBfZXF1YWw6IGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgcmV0dXJuIEVKU09OLmVxdWFscyhhLCBiLCB7a2V5T3JkZXJTZW5zaXRpdmU6IHRydWV9KTtcbiAgfSxcblxuICAvLyBtYXBzIGEgdHlwZSBjb2RlIHRvIGEgdmFsdWUgdGhhdCBjYW4gYmUgdXNlZCB0byBzb3J0IHZhbHVlcyBvZlxuICAvLyBkaWZmZXJlbnQgdHlwZXNcbiAgX3R5cGVvcmRlcjogZnVuY3Rpb24gKHQpIHtcbiAgICAvLyBodHRwOi8vd3d3Lm1vbmdvZGIub3JnL2Rpc3BsYXkvRE9DUy9XaGF0K2lzK3RoZStDb21wYXJlK09yZGVyK2ZvcitCU09OK1R5cGVzXG4gICAgLy8gWFhYIHdoYXQgaXMgdGhlIGNvcnJlY3Qgc29ydCBwb3NpdGlvbiBmb3IgSmF2YXNjcmlwdCBjb2RlP1xuICAgIC8vICgnMTAwJyBpbiB0aGUgbWF0cml4IGJlbG93KVxuICAgIC8vIFhYWCBtaW5rZXkvbWF4a2V5XG4gICAgcmV0dXJuIFstMSwgIC8vIChub3QgYSB0eXBlKVxuICAgICAgICAgICAgMSwgICAvLyBudW1iZXJcbiAgICAgICAgICAgIDIsICAgLy8gc3RyaW5nXG4gICAgICAgICAgICAzLCAgIC8vIG9iamVjdFxuICAgICAgICAgICAgNCwgICAvLyBhcnJheVxuICAgICAgICAgICAgNSwgICAvLyBiaW5hcnlcbiAgICAgICAgICAgIC0xLCAgLy8gZGVwcmVjYXRlZFxuICAgICAgICAgICAgNiwgICAvLyBPYmplY3RJRFxuICAgICAgICAgICAgNywgICAvLyBib29sXG4gICAgICAgICAgICA4LCAgIC8vIERhdGVcbiAgICAgICAgICAgIDAsICAgLy8gbnVsbFxuICAgICAgICAgICAgOSwgICAvLyBSZWdFeHBcbiAgICAgICAgICAgIC0xLCAgLy8gZGVwcmVjYXRlZFxuICAgICAgICAgICAgMTAwLCAvLyBKUyBjb2RlXG4gICAgICAgICAgICAyLCAgIC8vIGRlcHJlY2F0ZWQgKHN5bWJvbClcbiAgICAgICAgICAgIDEwMCwgLy8gSlMgY29kZVxuICAgICAgICAgICAgMSwgICAvLyAzMi1iaXQgaW50XG4gICAgICAgICAgICA4LCAgIC8vIE1vbmdvIHRpbWVzdGFtcFxuICAgICAgICAgICAgMSAgICAvLyA2NC1iaXQgaW50XG4gICAgICAgICAgIF1bdF07XG4gIH0sXG5cbiAgLy8gY29tcGFyZSB0d28gdmFsdWVzIG9mIHVua25vd24gdHlwZSBhY2NvcmRpbmcgdG8gQlNPTiBvcmRlcmluZ1xuICAvLyBzZW1hbnRpY3MuIChhcyBhbiBleHRlbnNpb24sIGNvbnNpZGVyICd1bmRlZmluZWQnIHRvIGJlIGxlc3MgdGhhblxuICAvLyBhbnkgb3RoZXIgdmFsdWUuKSByZXR1cm4gbmVnYXRpdmUgaWYgYSBpcyBsZXNzLCBwb3NpdGl2ZSBpZiBiIGlzXG4gIC8vIGxlc3MsIG9yIDAgaWYgZXF1YWxcbiAgX2NtcDogZnVuY3Rpb24gKGEsIGIpIHtcbiAgICBpZiAoYSA9PT0gdW5kZWZpbmVkKVxuICAgICAgcmV0dXJuIGIgPT09IHVuZGVmaW5lZCA/IDAgOiAtMTtcbiAgICBpZiAoYiA9PT0gdW5kZWZpbmVkKVxuICAgICAgcmV0dXJuIDE7XG4gICAgdmFyIHRhID0gTG9jYWxDb2xsZWN0aW9uLl9mLl90eXBlKGEpO1xuICAgIHZhciB0YiA9IExvY2FsQ29sbGVjdGlvbi5fZi5fdHlwZShiKTtcbiAgICB2YXIgb2EgPSBMb2NhbENvbGxlY3Rpb24uX2YuX3R5cGVvcmRlcih0YSk7XG4gICAgdmFyIG9iID0gTG9jYWxDb2xsZWN0aW9uLl9mLl90eXBlb3JkZXIodGIpO1xuICAgIGlmIChvYSAhPT0gb2IpXG4gICAgICByZXR1cm4gb2EgPCBvYiA/IC0xIDogMTtcbiAgICBpZiAodGEgIT09IHRiKVxuICAgICAgLy8gWFhYIG5lZWQgdG8gaW1wbGVtZW50IHRoaXMgaWYgd2UgaW1wbGVtZW50IFN5bWJvbCBvciBpbnRlZ2Vycywgb3JcbiAgICAgIC8vIFRpbWVzdGFtcFxuICAgICAgdGhyb3cgRXJyb3IoXCJNaXNzaW5nIHR5cGUgY29lcmNpb24gbG9naWMgaW4gX2NtcFwiKTtcbiAgICBpZiAodGEgPT09IDcpIHsgLy8gT2JqZWN0SURcbiAgICAgIC8vIENvbnZlcnQgdG8gc3RyaW5nLlxuICAgICAgdGEgPSB0YiA9IDI7XG4gICAgICBhID0gYS50b0hleFN0cmluZygpO1xuICAgICAgYiA9IGIudG9IZXhTdHJpbmcoKTtcbiAgICB9XG4gICAgaWYgKHRhID09PSA5KSB7IC8vIERhdGVcbiAgICAgIC8vIENvbnZlcnQgdG8gbWlsbGlzLlxuICAgICAgdGEgPSB0YiA9IDE7XG4gICAgICBhID0gYS5nZXRUaW1lKCk7XG4gICAgICBiID0gYi5nZXRUaW1lKCk7XG4gICAgfVxuXG4gICAgaWYgKHRhID09PSAxKSAvLyBkb3VibGVcbiAgICAgIHJldHVybiBhIC0gYjtcbiAgICBpZiAodGIgPT09IDIpIC8vIHN0cmluZ1xuICAgICAgcmV0dXJuIGEgPCBiID8gLTEgOiAoYSA9PT0gYiA/IDAgOiAxKTtcbiAgICBpZiAodGEgPT09IDMpIHsgLy8gT2JqZWN0XG4gICAgICAvLyB0aGlzIGNvdWxkIGJlIG11Y2ggbW9yZSBlZmZpY2llbnQgaW4gdGhlIGV4cGVjdGVkIGNhc2UgLi4uXG4gICAgICB2YXIgdG9fYXJyYXkgPSBmdW5jdGlvbiAob2JqKSB7XG4gICAgICAgIHZhciByZXQgPSBbXTtcbiAgICAgICAgZm9yICh2YXIga2V5IGluIG9iaikge1xuICAgICAgICAgIHJldC5wdXNoKGtleSk7XG4gICAgICAgICAgcmV0LnB1c2gob2JqW2tleV0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgICB9O1xuICAgICAgcmV0dXJuIExvY2FsQ29sbGVjdGlvbi5fZi5fY21wKHRvX2FycmF5KGEpLCB0b19hcnJheShiKSk7XG4gICAgfVxuICAgIGlmICh0YSA9PT0gNCkgeyAvLyBBcnJheVxuICAgICAgZm9yICh2YXIgaSA9IDA7IDsgaSsrKSB7XG4gICAgICAgIGlmIChpID09PSBhLmxlbmd0aClcbiAgICAgICAgICByZXR1cm4gKGkgPT09IGIubGVuZ3RoKSA/IDAgOiAtMTtcbiAgICAgICAgaWYgKGkgPT09IGIubGVuZ3RoKVxuICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICB2YXIgcyA9IExvY2FsQ29sbGVjdGlvbi5fZi5fY21wKGFbaV0sIGJbaV0pO1xuICAgICAgICBpZiAocyAhPT0gMClcbiAgICAgICAgICByZXR1cm4gcztcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHRhID09PSA1KSB7IC8vIGJpbmFyeVxuICAgICAgLy8gU3VycHJpc2luZ2x5LCBhIHNtYWxsIGJpbmFyeSBibG9iIGlzIGFsd2F5cyBsZXNzIHRoYW4gYSBsYXJnZSBvbmUgaW5cbiAgICAgIC8vIE1vbmdvLlxuICAgICAgaWYgKGEubGVuZ3RoICE9PSBiLmxlbmd0aClcbiAgICAgICAgcmV0dXJuIGEubGVuZ3RoIC0gYi5sZW5ndGg7XG4gICAgICBmb3IgKGkgPSAwOyBpIDwgYS5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoYVtpXSA8IGJbaV0pXG4gICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICBpZiAoYVtpXSA+IGJbaV0pXG4gICAgICAgICAgcmV0dXJuIDE7XG4gICAgICB9XG4gICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgaWYgKHRhID09PSA4KSB7IC8vIGJvb2xlYW5cbiAgICAgIGlmIChhKSByZXR1cm4gYiA/IDAgOiAxO1xuICAgICAgcmV0dXJuIGIgPyAtMSA6IDA7XG4gICAgfVxuICAgIGlmICh0YSA9PT0gMTApIC8vIG51bGxcbiAgICAgIHJldHVybiAwO1xuICAgIGlmICh0YSA9PT0gMTEpIC8vIHJlZ2V4cFxuICAgICAgdGhyb3cgRXJyb3IoXCJTb3J0aW5nIG5vdCBzdXBwb3J0ZWQgb24gcmVndWxhciBleHByZXNzaW9uXCIpOyAvLyBYWFhcbiAgICAvLyAxMzogamF2YXNjcmlwdCBjb2RlXG4gICAgLy8gMTQ6IHN5bWJvbFxuICAgIC8vIDE1OiBqYXZhc2NyaXB0IGNvZGUgd2l0aCBzY29wZVxuICAgIC8vIDE2OiAzMi1iaXQgaW50ZWdlclxuICAgIC8vIDE3OiB0aW1lc3RhbXBcbiAgICAvLyAxODogNjQtYml0IGludGVnZXJcbiAgICAvLyAyNTU6IG1pbmtleVxuICAgIC8vIDEyNzogbWF4a2V5XG4gICAgaWYgKHRhID09PSAxMykgLy8gamF2YXNjcmlwdCBjb2RlXG4gICAgICB0aHJvdyBFcnJvcihcIlNvcnRpbmcgbm90IHN1cHBvcnRlZCBvbiBKYXZhc2NyaXB0IGNvZGVcIik7IC8vIFhYWFxuICAgIHRocm93IEVycm9yKFwiVW5rbm93biB0eXBlIHRvIHNvcnRcIik7XG4gIH1cbn07XG5cbi8vIEZvciB1bml0IHRlc3RzLiBUcnVlIGlmIHRoZSBnaXZlbiBkb2N1bWVudCBtYXRjaGVzIHRoZSBnaXZlblxuLy8gc2VsZWN0b3IuXG5Mb2NhbENvbGxlY3Rpb24uX21hdGNoZXMgPSBmdW5jdGlvbiAoc2VsZWN0b3IsIGRvYykge1xuICByZXR1cm4gKExvY2FsQ29sbGVjdGlvbi5fY29tcGlsZVNlbGVjdG9yKHNlbGVjdG9yKSkoZG9jKTtcbn07XG5cbi8vIF9tYWtlTG9va3VwRnVuY3Rpb24oa2V5KSByZXR1cm5zIGEgbG9va3VwIGZ1bmN0aW9uLlxuLy9cbi8vIEEgbG9va3VwIGZ1bmN0aW9uIHRha2VzIGluIGEgZG9jdW1lbnQgYW5kIHJldHVybnMgYW4gYXJyYXkgb2YgbWF0Y2hpbmdcbi8vIHZhbHVlcy4gIFRoaXMgYXJyYXkgaGFzIG1vcmUgdGhhbiBvbmUgZWxlbWVudCBpZiBhbnkgc2VnbWVudCBvZiB0aGUga2V5IG90aGVyXG4vLyB0aGFuIHRoZSBsYXN0IG9uZSBpcyBhbiBhcnJheS4gIGllLCBhbnkgYXJyYXlzIGZvdW5kIHdoZW4gZG9pbmcgbm9uLWZpbmFsXG4vLyBsb29rdXBzIHJlc3VsdCBpbiB0aGlzIGZ1bmN0aW9uIFwiYnJhbmNoaW5nXCI7IGVhY2ggZWxlbWVudCBpbiB0aGUgcmV0dXJuZWRcbi8vIGFycmF5IHJlcHJlc2VudHMgdGhlIHZhbHVlIGZvdW5kIGF0IHRoaXMgYnJhbmNoLiBJZiBhbnkgYnJhbmNoIGRvZXNuJ3QgaGF2ZSBhXG4vLyBmaW5hbCB2YWx1ZSBmb3IgdGhlIGZ1bGwga2V5LCBpdHMgZWxlbWVudCBpbiB0aGUgcmV0dXJuZWQgbGlzdCB3aWxsIGJlXG4vLyB1bmRlZmluZWQuIEl0IGFsd2F5cyByZXR1cm5zIGEgbm9uLWVtcHR5IGFycmF5LlxuLy9cbi8vIF9tYWtlTG9va3VwRnVuY3Rpb24oJ2EueCcpKHthOiB7eDogMX19KSByZXR1cm5zIFsxXVxuLy8gX21ha2VMb29rdXBGdW5jdGlvbignYS54Jykoe2E6IHt4OiBbMV19fSkgcmV0dXJucyBbWzFdXVxuLy8gX21ha2VMb29rdXBGdW5jdGlvbignYS54Jykoe2E6IDV9KSAgcmV0dXJucyBbdW5kZWZpbmVkXVxuLy8gX21ha2VMb29rdXBGdW5jdGlvbignYS54Jykoe2E6IFt7eDogMX0sXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHt4OiBbMl19LFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7eTogM31dfSlcbi8vICAgcmV0dXJucyBbMSwgWzJdLCB1bmRlZmluZWRdXG5Mb2NhbENvbGxlY3Rpb24uX21ha2VMb29rdXBGdW5jdGlvbiA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgdmFyIGRvdExvY2F0aW9uID0ga2V5LmluZGV4T2YoJy4nKTtcbiAgdmFyIGZpcnN0LCBsb29rdXBSZXN0LCBuZXh0SXNOdW1lcmljO1xuICBpZiAoZG90TG9jYXRpb24gPT09IC0xKSB7XG4gICAgZmlyc3QgPSBrZXk7XG4gIH0gZWxzZSB7XG4gICAgZmlyc3QgPSBrZXkuc3Vic3RyKDAsIGRvdExvY2F0aW9uKTtcbiAgICB2YXIgcmVzdCA9IGtleS5zdWJzdHIoZG90TG9jYXRpb24gKyAxKTtcbiAgICBsb29rdXBSZXN0ID0gTG9jYWxDb2xsZWN0aW9uLl9tYWtlTG9va3VwRnVuY3Rpb24ocmVzdCk7XG4gICAgLy8gSXMgdGhlIG5leHQgKHBlcmhhcHMgZmluYWwpIHBpZWNlIG51bWVyaWMgKGllLCBhbiBhcnJheSBsb29rdXA/KVxuICAgIG5leHRJc051bWVyaWMgPSAvXlxcZCsoXFwufCQpLy50ZXN0KHJlc3QpO1xuICB9XG5cbiAgcmV0dXJuIGZ1bmN0aW9uIChkb2MpIHtcbiAgICBpZiAoZG9jID09IG51bGwpICAvLyBudWxsIG9yIHVuZGVmaW5lZFxuICAgICAgcmV0dXJuIFt1bmRlZmluZWRdO1xuICAgIHZhciBmaXJzdExldmVsID0gZG9jW2ZpcnN0XTtcblxuICAgIC8vIFdlIGRvbid0IFwiYnJhbmNoXCIgYXQgdGhlIGZpbmFsIGxldmVsLlxuICAgIGlmICghbG9va3VwUmVzdClcbiAgICAgIHJldHVybiBbZmlyc3RMZXZlbF07XG5cbiAgICAvLyBJdCdzIGFuIGVtcHR5IGFycmF5LCBhbmQgd2UncmUgbm90IGRvbmU6IHdlIHdvbid0IGZpbmQgYW55dGhpbmcuXG4gICAgaWYgKGlzQXJyYXkoZmlyc3RMZXZlbCkgJiYgZmlyc3RMZXZlbC5sZW5ndGggPT09IDApXG4gICAgICByZXR1cm4gW3VuZGVmaW5lZF07XG5cbiAgICAvLyBGb3IgZWFjaCByZXN1bHQgYXQgdGhpcyBsZXZlbCwgZmluaXNoIHRoZSBsb29rdXAgb24gdGhlIHJlc3Qgb2YgdGhlIGtleSxcbiAgICAvLyBhbmQgcmV0dXJuIGV2ZXJ5dGhpbmcgd2UgZmluZC4gQWxzbywgaWYgdGhlIG5leHQgcmVzdWx0IGlzIGEgbnVtYmVyLFxuICAgIC8vIGRvbid0IGJyYW5jaCBoZXJlLlxuICAgIC8vXG4gICAgLy8gVGVjaG5pY2FsbHksIGluIE1vbmdvREIsIHdlIHNob3VsZCBiZSBhYmxlIHRvIGhhbmRsZSB0aGUgY2FzZSB3aGVyZVxuICAgIC8vIG9iamVjdHMgaGF2ZSBudW1lcmljIGtleXMsIGJ1dCBNb25nbyBkb2Vzbid0IGFjdHVhbGx5IGhhbmRsZSB0aGlzXG4gICAgLy8gY29uc2lzdGVudGx5IHlldCBpdHNlbGYsIHNlZSBlZ1xuICAgIC8vIGh0dHBzOi8vamlyYS5tb25nb2RiLm9yZy9icm93c2UvU0VSVkVSLTI4OThcbiAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vbW9uZ29kYi9tb25nby9ibG9iL21hc3Rlci9qc3Rlc3RzL2FycmF5X21hdGNoMi5qc1xuICAgIGlmICghaXNBcnJheShmaXJzdExldmVsKSB8fCBuZXh0SXNOdW1lcmljKVxuICAgICAgZmlyc3RMZXZlbCA9IFtmaXJzdExldmVsXTtcbiAgICByZXR1cm4gQXJyYXkucHJvdG90eXBlLmNvbmNhdC5hcHBseShbXSwgXy5tYXAoZmlyc3RMZXZlbCwgbG9va3VwUmVzdCkpO1xuICB9O1xufTtcblxuLy8gVGhlIG1haW4gY29tcGlsYXRpb24gZnVuY3Rpb24gZm9yIGEgZ2l2ZW4gc2VsZWN0b3IuXG52YXIgY29tcGlsZURvY3VtZW50U2VsZWN0b3IgPSBmdW5jdGlvbiAoZG9jU2VsZWN0b3IpIHtcbiAgdmFyIHBlcktleVNlbGVjdG9ycyA9IFtdO1xuICBfLmVhY2goZG9jU2VsZWN0b3IsIGZ1bmN0aW9uIChzdWJTZWxlY3Rvciwga2V5KSB7XG4gICAgaWYgKGtleS5zdWJzdHIoMCwgMSkgPT09ICckJykge1xuICAgICAgLy8gT3V0ZXIgb3BlcmF0b3JzIGFyZSBlaXRoZXIgbG9naWNhbCBvcGVyYXRvcnMgKHRoZXkgcmVjdXJzZSBiYWNrIGludG9cbiAgICAgIC8vIHRoaXMgZnVuY3Rpb24pLCBvciAkd2hlcmUuXG4gICAgICBpZiAoIV8uaGFzKExPR0lDQUxfT1BFUkFUT1JTLCBrZXkpKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJVbnJlY29nbml6ZWQgbG9naWNhbCBvcGVyYXRvcjogXCIgKyBrZXkpO1xuICAgICAgcGVyS2V5U2VsZWN0b3JzLnB1c2goTE9HSUNBTF9PUEVSQVRPUlNba2V5XShzdWJTZWxlY3RvcikpO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgbG9va1VwQnlJbmRleCA9IExvY2FsQ29sbGVjdGlvbi5fbWFrZUxvb2t1cEZ1bmN0aW9uKGtleSk7XG4gICAgICB2YXIgdmFsdWVTZWxlY3RvckZ1bmMgPSBjb21waWxlVmFsdWVTZWxlY3RvcihzdWJTZWxlY3Rvcik7XG4gICAgICBwZXJLZXlTZWxlY3RvcnMucHVzaChmdW5jdGlvbiAoZG9jKSB7XG4gICAgICAgIHZhciBicmFuY2hWYWx1ZXMgPSBsb29rVXBCeUluZGV4KGRvYyk7XG4gICAgICAgIC8vIFdlIGFwcGx5IHRoZSBzZWxlY3RvciB0byBlYWNoIFwiYnJhbmNoZWRcIiB2YWx1ZSBhbmQgcmV0dXJuIHRydWUgaWYgYW55XG4gICAgICAgIC8vIG1hdGNoLiBUaGlzIGlzbid0IDEwMCUgY29uc2lzdGVudCB3aXRoIE1vbmdvREI7IGVnLCBzZWU6XG4gICAgICAgIC8vIGh0dHBzOi8vamlyYS5tb25nb2RiLm9yZy9icm93c2UvU0VSVkVSLTg1ODVcbiAgICAgICAgcmV0dXJuIF8uYW55KGJyYW5jaFZhbHVlcywgdmFsdWVTZWxlY3RvckZ1bmMpO1xuICAgICAgfSk7XG4gICAgfVxuICB9KTtcblxuXG4gIHJldHVybiBmdW5jdGlvbiAoZG9jKSB7XG4gICAgcmV0dXJuIF8uYWxsKHBlcktleVNlbGVjdG9ycywgZnVuY3Rpb24gKGYpIHtcbiAgICAgIHJldHVybiBmKGRvYyk7XG4gICAgfSk7XG4gIH07XG59O1xuXG4vLyBHaXZlbiBhIHNlbGVjdG9yLCByZXR1cm4gYSBmdW5jdGlvbiB0aGF0IHRha2VzIG9uZSBhcmd1bWVudCwgYVxuLy8gZG9jdW1lbnQsIGFuZCByZXR1cm5zIHRydWUgaWYgdGhlIGRvY3VtZW50IG1hdGNoZXMgdGhlIHNlbGVjdG9yLFxuLy8gZWxzZSBmYWxzZS5cbkxvY2FsQ29sbGVjdGlvbi5fY29tcGlsZVNlbGVjdG9yID0gZnVuY3Rpb24gKHNlbGVjdG9yKSB7XG4gIC8vIHlvdSBjYW4gcGFzcyBhIGxpdGVyYWwgZnVuY3Rpb24gaW5zdGVhZCBvZiBhIHNlbGVjdG9yXG4gIGlmIChzZWxlY3RvciBpbnN0YW5jZW9mIEZ1bmN0aW9uKVxuICAgIHJldHVybiBmdW5jdGlvbiAoZG9jKSB7cmV0dXJuIHNlbGVjdG9yLmNhbGwoZG9jKTt9O1xuXG4gIC8vIHNob3J0aGFuZCAtLSBzY2FsYXJzIG1hdGNoIF9pZFxuICBpZiAoTG9jYWxDb2xsZWN0aW9uLl9zZWxlY3RvcklzSWQoc2VsZWN0b3IpKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChkb2MpIHtcbiAgICAgIHJldHVybiBFSlNPTi5lcXVhbHMoZG9jLl9pZCwgc2VsZWN0b3IpO1xuICAgIH07XG4gIH1cblxuICAvLyBwcm90ZWN0IGFnYWluc3QgZGFuZ2Vyb3VzIHNlbGVjdG9ycy4gIGZhbHNleSBhbmQge19pZDogZmFsc2V5fSBhcmUgYm90aFxuICAvLyBsaWtlbHkgcHJvZ3JhbW1lciBlcnJvciwgYW5kIG5vdCB3aGF0IHlvdSB3YW50LCBwYXJ0aWN1bGFybHkgZm9yXG4gIC8vIGRlc3RydWN0aXZlIG9wZXJhdGlvbnMuXG4gIGlmICghc2VsZWN0b3IgfHwgKCgnX2lkJyBpbiBzZWxlY3RvcikgJiYgIXNlbGVjdG9yLl9pZCkpXG4gICAgcmV0dXJuIGZ1bmN0aW9uIChkb2MpIHtyZXR1cm4gZmFsc2U7fTtcblxuICAvLyBUb3AgbGV2ZWwgY2FuJ3QgYmUgYW4gYXJyYXkgb3IgdHJ1ZSBvciBiaW5hcnkuXG4gIGlmICh0eXBlb2Yoc2VsZWN0b3IpID09PSAnYm9vbGVhbicgfHwgaXNBcnJheShzZWxlY3RvcikgfHxcbiAgICAgIEVKU09OLmlzQmluYXJ5KHNlbGVjdG9yKSlcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIHNlbGVjdG9yOiBcIiArIHNlbGVjdG9yKTtcblxuICByZXR1cm4gY29tcGlsZURvY3VtZW50U2VsZWN0b3Ioc2VsZWN0b3IpO1xufTtcblxuLy8gR2l2ZSBhIHNvcnQgc3BlYywgd2hpY2ggY2FuIGJlIGluIGFueSBvZiB0aGVzZSBmb3Jtczpcbi8vICAge1wia2V5MVwiOiAxLCBcImtleTJcIjogLTF9XG4vLyAgIFtbXCJrZXkxXCIsIFwiYXNjXCJdLCBbXCJrZXkyXCIsIFwiZGVzY1wiXV1cbi8vICAgW1wia2V5MVwiLCBbXCJrZXkyXCIsIFwiZGVzY1wiXV1cbi8vXG4vLyAoLi4gd2l0aCB0aGUgZmlyc3QgZm9ybSBiZWluZyBkZXBlbmRlbnQgb24gdGhlIGtleSBlbnVtZXJhdGlvblxuLy8gYmVoYXZpb3Igb2YgeW91ciBqYXZhc2NyaXB0IFZNLCB3aGljaCB1c3VhbGx5IGRvZXMgd2hhdCB5b3UgbWVhbiBpblxuLy8gdGhpcyBjYXNlIGlmIHRoZSBrZXkgbmFtZXMgZG9uJ3QgbG9vayBsaWtlIGludGVnZXJzIC4uKVxuLy9cbi8vIHJldHVybiBhIGZ1bmN0aW9uIHRoYXQgdGFrZXMgdHdvIG9iamVjdHMsIGFuZCByZXR1cm5zIC0xIGlmIHRoZVxuLy8gZmlyc3Qgb2JqZWN0IGNvbWVzIGZpcnN0IGluIG9yZGVyLCAxIGlmIHRoZSBzZWNvbmQgb2JqZWN0IGNvbWVzXG4vLyBmaXJzdCwgb3IgMCBpZiBuZWl0aGVyIG9iamVjdCBjb21lcyBiZWZvcmUgdGhlIG90aGVyLlxuXG5Mb2NhbENvbGxlY3Rpb24uX2NvbXBpbGVTb3J0ID0gZnVuY3Rpb24gKHNwZWMpIHtcbiAgdmFyIHNvcnRTcGVjUGFydHMgPSBbXTtcblxuICBpZiAoc3BlYyBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzcGVjLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAodHlwZW9mIHNwZWNbaV0gPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgc29ydFNwZWNQYXJ0cy5wdXNoKHtcbiAgICAgICAgICBsb29rdXA6IExvY2FsQ29sbGVjdGlvbi5fbWFrZUxvb2t1cEZ1bmN0aW9uKHNwZWNbaV0pLFxuICAgICAgICAgIGFzY2VuZGluZzogdHJ1ZVxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNvcnRTcGVjUGFydHMucHVzaCh7XG4gICAgICAgICAgbG9va3VwOiBMb2NhbENvbGxlY3Rpb24uX21ha2VMb29rdXBGdW5jdGlvbihzcGVjW2ldWzBdKSxcbiAgICAgICAgICBhc2NlbmRpbmc6IHNwZWNbaV1bMV0gIT09IFwiZGVzY1wiXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIGlmICh0eXBlb2Ygc3BlYyA9PT0gXCJvYmplY3RcIikge1xuICAgIGZvciAodmFyIGtleSBpbiBzcGVjKSB7XG4gICAgICBzb3J0U3BlY1BhcnRzLnB1c2goe1xuICAgICAgICBsb29rdXA6IExvY2FsQ29sbGVjdGlvbi5fbWFrZUxvb2t1cEZ1bmN0aW9uKGtleSksXG4gICAgICAgIGFzY2VuZGluZzogc3BlY1trZXldID49IDBcbiAgICAgIH0pO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBFcnJvcihcIkJhZCBzb3J0IHNwZWNpZmljYXRpb246IFwiLCBKU09OLnN0cmluZ2lmeShzcGVjKSk7XG4gIH1cblxuICBpZiAoc29ydFNwZWNQYXJ0cy5sZW5ndGggPT09IDApXG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtyZXR1cm4gMDt9O1xuXG4gIC8vIHJlZHVjZVZhbHVlIHRha2VzIGluIGFsbCB0aGUgcG9zc2libGUgdmFsdWVzIGZvciB0aGUgc29ydCBrZXkgYWxvbmcgdmFyaW91c1xuICAvLyBicmFuY2hlcywgYW5kIHJldHVybnMgdGhlIG1pbiBvciBtYXggdmFsdWUgKGFjY29yZGluZyB0byB0aGUgYm9vbFxuICAvLyBmaW5kTWluKS4gRWFjaCB2YWx1ZSBjYW4gaXRzZWxmIGJlIGFuIGFycmF5LCBhbmQgd2UgbG9vayBhdCBpdHMgdmFsdWVzXG4gIC8vIHRvby4gKGllLCB3ZSBkbyBhIHNpbmdsZSBsZXZlbCBvZiBmbGF0dGVuaW5nIG9uIGJyYW5jaFZhbHVlcywgdGhlbiBmaW5kIHRoZVxuICAvLyBtaW4vbWF4LilcbiAgdmFyIHJlZHVjZVZhbHVlID0gZnVuY3Rpb24gKGJyYW5jaFZhbHVlcywgZmluZE1pbikge1xuICAgIHZhciByZWR1Y2VkO1xuICAgIHZhciBmaXJzdCA9IHRydWU7XG4gICAgLy8gSXRlcmF0ZSBvdmVyIGFsbCB0aGUgdmFsdWVzIGZvdW5kIGluIGFsbCB0aGUgYnJhbmNoZXMsIGFuZCBpZiBhIHZhbHVlIGlzXG4gICAgLy8gYW4gYXJyYXkgaXRzZWxmLCBpdGVyYXRlIG92ZXIgdGhlIHZhbHVlcyBpbiB0aGUgYXJyYXkgc2VwYXJhdGVseS5cbiAgICBfLmVhY2goYnJhbmNoVmFsdWVzLCBmdW5jdGlvbiAoYnJhbmNoVmFsdWUpIHtcbiAgICAgIC8vIFZhbHVlIG5vdCBhbiBhcnJheT8gUHJldGVuZCBpdCBpcy5cbiAgICAgIGlmICghaXNBcnJheShicmFuY2hWYWx1ZSkpXG4gICAgICAgIGJyYW5jaFZhbHVlID0gW2JyYW5jaFZhbHVlXTtcbiAgICAgIC8vIFZhbHVlIGlzIGFuIGVtcHR5IGFycmF5PyBQcmV0ZW5kIGl0IHdhcyBtaXNzaW5nLCBzaW5jZSB0aGF0J3Mgd2hlcmUgaXRcbiAgICAgIC8vIHNob3VsZCBiZSBzb3J0ZWQuXG4gICAgICBpZiAoaXNBcnJheShicmFuY2hWYWx1ZSkgJiYgYnJhbmNoVmFsdWUubGVuZ3RoID09PSAwKVxuICAgICAgICBicmFuY2hWYWx1ZSA9IFt1bmRlZmluZWRdO1xuICAgICAgXy5lYWNoKGJyYW5jaFZhbHVlLCBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgLy8gV2Ugc2hvdWxkIGdldCBoZXJlIGF0IGxlYXN0IG9uY2U6IGxvb2t1cCBmdW5jdGlvbnMgcmV0dXJuIG5vbi1lbXB0eVxuICAgICAgICAvLyBhcnJheXMsIHNvIHRoZSBvdXRlciBsb29wIHJ1bnMgYXQgbGVhc3Qgb25jZSwgYW5kIHdlIHByZXZlbnRlZFxuICAgICAgICAvLyBicmFuY2hWYWx1ZSBmcm9tIGJlaW5nIGFuIGVtcHR5IGFycmF5LlxuICAgICAgICBpZiAoZmlyc3QpIHtcbiAgICAgICAgICByZWR1Y2VkID0gdmFsdWU7XG4gICAgICAgICAgZmlyc3QgPSBmYWxzZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBDb21wYXJlIHRoZSB2YWx1ZSB3ZSBmb3VuZCB0byB0aGUgdmFsdWUgd2UgZm91bmQgc28gZmFyLCBzYXZpbmcgaXRcbiAgICAgICAgICAvLyBpZiBpdCdzIGxlc3MgKGZvciBhbiBhc2NlbmRpbmcgc29ydCkgb3IgbW9yZSAoZm9yIGEgZGVzY2VuZGluZ1xuICAgICAgICAgIC8vIHNvcnQpLlxuICAgICAgICAgIHZhciBjbXAgPSBMb2NhbENvbGxlY3Rpb24uX2YuX2NtcChyZWR1Y2VkLCB2YWx1ZSk7XG4gICAgICAgICAgaWYgKChmaW5kTWluICYmIGNtcCA+IDApIHx8ICghZmluZE1pbiAmJiBjbXAgPCAwKSlcbiAgICAgICAgICAgIHJlZHVjZWQgPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlZHVjZWQ7XG4gIH07XG5cbiAgcmV0dXJuIGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzb3J0U3BlY1BhcnRzLmxlbmd0aDsgKytpKSB7XG4gICAgICB2YXIgc3BlY1BhcnQgPSBzb3J0U3BlY1BhcnRzW2ldO1xuICAgICAgdmFyIGFWYWx1ZSA9IHJlZHVjZVZhbHVlKHNwZWNQYXJ0Lmxvb2t1cChhKSwgc3BlY1BhcnQuYXNjZW5kaW5nKTtcbiAgICAgIHZhciBiVmFsdWUgPSByZWR1Y2VWYWx1ZShzcGVjUGFydC5sb29rdXAoYiksIHNwZWNQYXJ0LmFzY2VuZGluZyk7XG4gICAgICB2YXIgY29tcGFyZSA9IExvY2FsQ29sbGVjdGlvbi5fZi5fY21wKGFWYWx1ZSwgYlZhbHVlKTtcbiAgICAgIGlmIChjb21wYXJlICE9PSAwKVxuICAgICAgICByZXR1cm4gc3BlY1BhcnQuYXNjZW5kaW5nID8gY29tcGFyZSA6IC1jb21wYXJlO1xuICAgIH07XG4gICAgcmV0dXJuIDA7XG4gIH07XG59O1xuXG5leHBvcnRzLmNvbXBpbGVEb2N1bWVudFNlbGVjdG9yID0gY29tcGlsZURvY3VtZW50U2VsZWN0b3I7XG5leHBvcnRzLmNvbXBpbGVTb3J0ID0gTG9jYWxDb2xsZWN0aW9uLl9jb21waWxlU29ydDsiLCJFSlNPTiA9IHt9OyAvLyBHbG9iYWwhXG52YXIgY3VzdG9tVHlwZXMgPSB7fTtcbi8vIEFkZCBhIGN1c3RvbSB0eXBlLCB1c2luZyBhIG1ldGhvZCBvZiB5b3VyIGNob2ljZSB0byBnZXQgdG8gYW5kXG4vLyBmcm9tIGEgYmFzaWMgSlNPTi1hYmxlIHJlcHJlc2VudGF0aW9uLiAgVGhlIGZhY3RvcnkgYXJndW1lbnRcbi8vIGlzIGEgZnVuY3Rpb24gb2YgSlNPTi1hYmxlIC0tPiB5b3VyIG9iamVjdFxuLy8gVGhlIHR5cGUgeW91IGFkZCBtdXN0IGhhdmU6XG4vLyAtIEEgY2xvbmUoKSBtZXRob2QsIHNvIHRoYXQgTWV0ZW9yIGNhbiBkZWVwLWNvcHkgaXQgd2hlbiBuZWNlc3NhcnkuXG4vLyAtIEEgZXF1YWxzKCkgbWV0aG9kLCBzbyB0aGF0IE1ldGVvciBjYW4gY29tcGFyZSBpdFxuLy8gLSBBIHRvSlNPTlZhbHVlKCkgbWV0aG9kLCBzbyB0aGF0IE1ldGVvciBjYW4gc2VyaWFsaXplIGl0XG4vLyAtIGEgdHlwZU5hbWUoKSBtZXRob2QsIHRvIHNob3cgaG93IHRvIGxvb2sgaXQgdXAgaW4gb3VyIHR5cGUgdGFibGUuXG4vLyBJdCBpcyBva2F5IGlmIHRoZXNlIG1ldGhvZHMgYXJlIG1vbmtleS1wYXRjaGVkIG9uLlxuRUpTT04uYWRkVHlwZSA9IGZ1bmN0aW9uIChuYW1lLCBmYWN0b3J5KSB7XG4gIGlmIChfLmhhcyhjdXN0b21UeXBlcywgbmFtZSkpXG4gICAgdGhyb3cgbmV3IEVycm9yKFwiVHlwZSBcIiArIG5hbWUgKyBcIiBhbHJlYWR5IHByZXNlbnRcIik7XG4gIGN1c3RvbVR5cGVzW25hbWVdID0gZmFjdG9yeTtcbn07XG5cbnZhciBidWlsdGluQ29udmVydGVycyA9IFtcbiAgeyAvLyBEYXRlXG4gICAgbWF0Y2hKU09OVmFsdWU6IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgIHJldHVybiBfLmhhcyhvYmosICckZGF0ZScpICYmIF8uc2l6ZShvYmopID09PSAxO1xuICAgIH0sXG4gICAgbWF0Y2hPYmplY3Q6IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgIHJldHVybiBvYmogaW5zdGFuY2VvZiBEYXRlO1xuICAgIH0sXG4gICAgdG9KU09OVmFsdWU6IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgIHJldHVybiB7JGRhdGU6IG9iai5nZXRUaW1lKCl9O1xuICAgIH0sXG4gICAgZnJvbUpTT05WYWx1ZTogZnVuY3Rpb24gKG9iaikge1xuICAgICAgcmV0dXJuIG5ldyBEYXRlKG9iai4kZGF0ZSk7XG4gICAgfVxuICB9LFxuICB7IC8vIEJpbmFyeVxuICAgIG1hdGNoSlNPTlZhbHVlOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICByZXR1cm4gXy5oYXMob2JqLCAnJGJpbmFyeScpICYmIF8uc2l6ZShvYmopID09PSAxO1xuICAgIH0sXG4gICAgbWF0Y2hPYmplY3Q6IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgIHJldHVybiB0eXBlb2YgVWludDhBcnJheSAhPT0gJ3VuZGVmaW5lZCcgJiYgb2JqIGluc3RhbmNlb2YgVWludDhBcnJheVxuICAgICAgICB8fCAob2JqICYmIF8uaGFzKG9iaiwgJyRVaW50OEFycmF5UG9seWZpbGwnKSk7XG4gICAgfSxcbiAgICB0b0pTT05WYWx1ZTogZnVuY3Rpb24gKG9iaikge1xuICAgICAgcmV0dXJuIHskYmluYXJ5OiBFSlNPTi5fYmFzZTY0RW5jb2RlKG9iail9O1xuICAgIH0sXG4gICAgZnJvbUpTT05WYWx1ZTogZnVuY3Rpb24gKG9iaikge1xuICAgICAgcmV0dXJuIEVKU09OLl9iYXNlNjREZWNvZGUob2JqLiRiaW5hcnkpO1xuICAgIH1cbiAgfSxcbiAgeyAvLyBFc2NhcGluZyBvbmUgbGV2ZWxcbiAgICBtYXRjaEpTT05WYWx1ZTogZnVuY3Rpb24gKG9iaikge1xuICAgICAgcmV0dXJuIF8uaGFzKG9iaiwgJyRlc2NhcGUnKSAmJiBfLnNpemUob2JqKSA9PT0gMTtcbiAgICB9LFxuICAgIG1hdGNoT2JqZWN0OiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICBpZiAoXy5pc0VtcHR5KG9iaikgfHwgXy5zaXplKG9iaikgPiAyKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBfLmFueShidWlsdGluQ29udmVydGVycywgZnVuY3Rpb24gKGNvbnZlcnRlcikge1xuICAgICAgICByZXR1cm4gY29udmVydGVyLm1hdGNoSlNPTlZhbHVlKG9iaik7XG4gICAgICB9KTtcbiAgICB9LFxuICAgIHRvSlNPTlZhbHVlOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICB2YXIgbmV3T2JqID0ge307XG4gICAgICBfLmVhY2gob2JqLCBmdW5jdGlvbiAodmFsdWUsIGtleSkge1xuICAgICAgICBuZXdPYmpba2V5XSA9IEVKU09OLnRvSlNPTlZhbHVlKHZhbHVlKTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHskZXNjYXBlOiBuZXdPYmp9O1xuICAgIH0sXG4gICAgZnJvbUpTT05WYWx1ZTogZnVuY3Rpb24gKG9iaikge1xuICAgICAgdmFyIG5ld09iaiA9IHt9O1xuICAgICAgXy5lYWNoKG9iai4kZXNjYXBlLCBmdW5jdGlvbiAodmFsdWUsIGtleSkge1xuICAgICAgICBuZXdPYmpba2V5XSA9IEVKU09OLmZyb21KU09OVmFsdWUodmFsdWUpO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gbmV3T2JqO1xuICAgIH1cbiAgfSxcbiAgeyAvLyBDdXN0b21cbiAgICBtYXRjaEpTT05WYWx1ZTogZnVuY3Rpb24gKG9iaikge1xuICAgICAgcmV0dXJuIF8uaGFzKG9iaiwgJyR0eXBlJykgJiYgXy5oYXMob2JqLCAnJHZhbHVlJykgJiYgXy5zaXplKG9iaikgPT09IDI7XG4gICAgfSxcbiAgICBtYXRjaE9iamVjdDogZnVuY3Rpb24gKG9iaikge1xuICAgICAgcmV0dXJuIEVKU09OLl9pc0N1c3RvbVR5cGUob2JqKTtcbiAgICB9LFxuICAgIHRvSlNPTlZhbHVlOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICByZXR1cm4geyR0eXBlOiBvYmoudHlwZU5hbWUoKSwgJHZhbHVlOiBvYmoudG9KU09OVmFsdWUoKX07XG4gICAgfSxcbiAgICBmcm9tSlNPTlZhbHVlOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICB2YXIgdHlwZU5hbWUgPSBvYmouJHR5cGU7XG4gICAgICB2YXIgY29udmVydGVyID0gY3VzdG9tVHlwZXNbdHlwZU5hbWVdO1xuICAgICAgcmV0dXJuIGNvbnZlcnRlcihvYmouJHZhbHVlKTtcbiAgICB9XG4gIH1cbl07XG5cbkVKU09OLl9pc0N1c3RvbVR5cGUgPSBmdW5jdGlvbiAob2JqKSB7XG4gIHJldHVybiBvYmogJiZcbiAgICB0eXBlb2Ygb2JqLnRvSlNPTlZhbHVlID09PSAnZnVuY3Rpb24nICYmXG4gICAgdHlwZW9mIG9iai50eXBlTmFtZSA9PT0gJ2Z1bmN0aW9uJyAmJlxuICAgIF8uaGFzKGN1c3RvbVR5cGVzLCBvYmoudHlwZU5hbWUoKSk7XG59O1xuXG5cbi8vZm9yIGJvdGggYXJyYXlzIGFuZCBvYmplY3RzLCBpbi1wbGFjZSBtb2RpZmljYXRpb24uXG52YXIgYWRqdXN0VHlwZXNUb0pTT05WYWx1ZSA9XG5FSlNPTi5fYWRqdXN0VHlwZXNUb0pTT05WYWx1ZSA9IGZ1bmN0aW9uIChvYmopIHtcbiAgaWYgKG9iaiA9PT0gbnVsbClcbiAgICByZXR1cm4gbnVsbDtcbiAgdmFyIG1heWJlQ2hhbmdlZCA9IHRvSlNPTlZhbHVlSGVscGVyKG9iaik7XG4gIGlmIChtYXliZUNoYW5nZWQgIT09IHVuZGVmaW5lZClcbiAgICByZXR1cm4gbWF5YmVDaGFuZ2VkO1xuICBfLmVhY2gob2JqLCBmdW5jdGlvbiAodmFsdWUsIGtleSkge1xuICAgIGlmICh0eXBlb2YgdmFsdWUgIT09ICdvYmplY3QnICYmIHZhbHVlICE9PSB1bmRlZmluZWQpXG4gICAgICByZXR1cm47IC8vIGNvbnRpbnVlXG4gICAgdmFyIGNoYW5nZWQgPSB0b0pTT05WYWx1ZUhlbHBlcih2YWx1ZSk7XG4gICAgaWYgKGNoYW5nZWQpIHtcbiAgICAgIG9ialtrZXldID0gY2hhbmdlZDtcbiAgICAgIHJldHVybjsgLy8gb24gdG8gdGhlIG5leHQga2V5XG4gICAgfVxuICAgIC8vIGlmIHdlIGdldCBoZXJlLCB2YWx1ZSBpcyBhbiBvYmplY3QgYnV0IG5vdCBhZGp1c3RhYmxlXG4gICAgLy8gYXQgdGhpcyBsZXZlbC4gIHJlY3Vyc2UuXG4gICAgYWRqdXN0VHlwZXNUb0pTT05WYWx1ZSh2YWx1ZSk7XG4gIH0pO1xuICByZXR1cm4gb2JqO1xufTtcblxuLy8gRWl0aGVyIHJldHVybiB0aGUgSlNPTi1jb21wYXRpYmxlIHZlcnNpb24gb2YgdGhlIGFyZ3VtZW50LCBvciB1bmRlZmluZWQgKGlmXG4vLyB0aGUgaXRlbSBpc24ndCBpdHNlbGYgcmVwbGFjZWFibGUsIGJ1dCBtYXliZSBzb21lIGZpZWxkcyBpbiBpdCBhcmUpXG52YXIgdG9KU09OVmFsdWVIZWxwZXIgPSBmdW5jdGlvbiAoaXRlbSkge1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGJ1aWx0aW5Db252ZXJ0ZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGNvbnZlcnRlciA9IGJ1aWx0aW5Db252ZXJ0ZXJzW2ldO1xuICAgIGlmIChjb252ZXJ0ZXIubWF0Y2hPYmplY3QoaXRlbSkpIHtcbiAgICAgIHJldHVybiBjb252ZXJ0ZXIudG9KU09OVmFsdWUoaXRlbSk7XG4gICAgfVxuICB9XG4gIHJldHVybiB1bmRlZmluZWQ7XG59O1xuXG5FSlNPTi50b0pTT05WYWx1ZSA9IGZ1bmN0aW9uIChpdGVtKSB7XG4gIHZhciBjaGFuZ2VkID0gdG9KU09OVmFsdWVIZWxwZXIoaXRlbSk7XG4gIGlmIChjaGFuZ2VkICE9PSB1bmRlZmluZWQpXG4gICAgcmV0dXJuIGNoYW5nZWQ7XG4gIGlmICh0eXBlb2YgaXRlbSA9PT0gJ29iamVjdCcpIHtcbiAgICBpdGVtID0gRUpTT04uY2xvbmUoaXRlbSk7XG4gICAgYWRqdXN0VHlwZXNUb0pTT05WYWx1ZShpdGVtKTtcbiAgfVxuICByZXR1cm4gaXRlbTtcbn07XG5cbi8vZm9yIGJvdGggYXJyYXlzIGFuZCBvYmplY3RzLiBUcmllcyBpdHMgYmVzdCB0byBqdXN0XG4vLyB1c2UgdGhlIG9iamVjdCB5b3UgaGFuZCBpdCwgYnV0IG1heSByZXR1cm4gc29tZXRoaW5nXG4vLyBkaWZmZXJlbnQgaWYgdGhlIG9iamVjdCB5b3UgaGFuZCBpdCBpdHNlbGYgbmVlZHMgY2hhbmdpbmcuXG52YXIgYWRqdXN0VHlwZXNGcm9tSlNPTlZhbHVlID1cbkVKU09OLl9hZGp1c3RUeXBlc0Zyb21KU09OVmFsdWUgPSBmdW5jdGlvbiAob2JqKSB7XG4gIGlmIChvYmogPT09IG51bGwpXG4gICAgcmV0dXJuIG51bGw7XG4gIHZhciBtYXliZUNoYW5nZWQgPSBmcm9tSlNPTlZhbHVlSGVscGVyKG9iaik7XG4gIGlmIChtYXliZUNoYW5nZWQgIT09IG9iailcbiAgICByZXR1cm4gbWF5YmVDaGFuZ2VkO1xuICBfLmVhY2gob2JqLCBmdW5jdGlvbiAodmFsdWUsIGtleSkge1xuICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnKSB7XG4gICAgICB2YXIgY2hhbmdlZCA9IGZyb21KU09OVmFsdWVIZWxwZXIodmFsdWUpO1xuICAgICAgaWYgKHZhbHVlICE9PSBjaGFuZ2VkKSB7XG4gICAgICAgIG9ialtrZXldID0gY2hhbmdlZDtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgLy8gaWYgd2UgZ2V0IGhlcmUsIHZhbHVlIGlzIGFuIG9iamVjdCBidXQgbm90IGFkanVzdGFibGVcbiAgICAgIC8vIGF0IHRoaXMgbGV2ZWwuICByZWN1cnNlLlxuICAgICAgYWRqdXN0VHlwZXNGcm9tSlNPTlZhbHVlKHZhbHVlKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gb2JqO1xufTtcblxuLy8gRWl0aGVyIHJldHVybiB0aGUgYXJndW1lbnQgY2hhbmdlZCB0byBoYXZlIHRoZSBub24tanNvblxuLy8gcmVwIG9mIGl0c2VsZiAodGhlIE9iamVjdCB2ZXJzaW9uKSBvciB0aGUgYXJndW1lbnQgaXRzZWxmLlxuXG4vLyBET0VTIE5PVCBSRUNVUlNFLiAgRm9yIGFjdHVhbGx5IGdldHRpbmcgdGhlIGZ1bGx5LWNoYW5nZWQgdmFsdWUsIHVzZVxuLy8gRUpTT04uZnJvbUpTT05WYWx1ZVxudmFyIGZyb21KU09OVmFsdWVIZWxwZXIgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUgIT09IG51bGwpIHtcbiAgICBpZiAoXy5zaXplKHZhbHVlKSA8PSAyXG4gICAgICAgICYmIF8uYWxsKHZhbHVlLCBmdW5jdGlvbiAodiwgaykge1xuICAgICAgICAgIHJldHVybiB0eXBlb2YgayA9PT0gJ3N0cmluZycgJiYgay5zdWJzdHIoMCwgMSkgPT09ICckJztcbiAgICAgICAgfSkpIHtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYnVpbHRpbkNvbnZlcnRlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGNvbnZlcnRlciA9IGJ1aWx0aW5Db252ZXJ0ZXJzW2ldO1xuICAgICAgICBpZiAoY29udmVydGVyLm1hdGNoSlNPTlZhbHVlKHZhbHVlKSkge1xuICAgICAgICAgIHJldHVybiBjb252ZXJ0ZXIuZnJvbUpTT05WYWx1ZSh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIHZhbHVlO1xufTtcblxuRUpTT04uZnJvbUpTT05WYWx1ZSA9IGZ1bmN0aW9uIChpdGVtKSB7XG4gIHZhciBjaGFuZ2VkID0gZnJvbUpTT05WYWx1ZUhlbHBlcihpdGVtKTtcbiAgaWYgKGNoYW5nZWQgPT09IGl0ZW0gJiYgdHlwZW9mIGl0ZW0gPT09ICdvYmplY3QnKSB7XG4gICAgaXRlbSA9IEVKU09OLmNsb25lKGl0ZW0pO1xuICAgIGFkanVzdFR5cGVzRnJvbUpTT05WYWx1ZShpdGVtKTtcbiAgICByZXR1cm4gaXRlbTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gY2hhbmdlZDtcbiAgfVxufTtcblxuRUpTT04uc3RyaW5naWZ5ID0gZnVuY3Rpb24gKGl0ZW0pIHtcbiAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KEVKU09OLnRvSlNPTlZhbHVlKGl0ZW0pKTtcbn07XG5cbkVKU09OLnBhcnNlID0gZnVuY3Rpb24gKGl0ZW0pIHtcbiAgcmV0dXJuIEVKU09OLmZyb21KU09OVmFsdWUoSlNPTi5wYXJzZShpdGVtKSk7XG59O1xuXG5FSlNPTi5pc0JpbmFyeSA9IGZ1bmN0aW9uIChvYmopIHtcbiAgcmV0dXJuICh0eXBlb2YgVWludDhBcnJheSAhPT0gJ3VuZGVmaW5lZCcgJiYgb2JqIGluc3RhbmNlb2YgVWludDhBcnJheSkgfHxcbiAgICAob2JqICYmIG9iai4kVWludDhBcnJheVBvbHlmaWxsKTtcbn07XG5cbkVKU09OLmVxdWFscyA9IGZ1bmN0aW9uIChhLCBiLCBvcHRpb25zKSB7XG4gIHZhciBpO1xuICB2YXIga2V5T3JkZXJTZW5zaXRpdmUgPSAhIShvcHRpb25zICYmIG9wdGlvbnMua2V5T3JkZXJTZW5zaXRpdmUpO1xuICBpZiAoYSA9PT0gYilcbiAgICByZXR1cm4gdHJ1ZTtcbiAgaWYgKCFhIHx8ICFiKSAvLyBpZiBlaXRoZXIgb25lIGlzIGZhbHN5LCB0aGV5J2QgaGF2ZSB0byBiZSA9PT0gdG8gYmUgZXF1YWxcbiAgICByZXR1cm4gZmFsc2U7XG4gIGlmICghKHR5cGVvZiBhID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgYiA9PT0gJ29iamVjdCcpKVxuICAgIHJldHVybiBmYWxzZTtcbiAgaWYgKGEgaW5zdGFuY2VvZiBEYXRlICYmIGIgaW5zdGFuY2VvZiBEYXRlKVxuICAgIHJldHVybiBhLnZhbHVlT2YoKSA9PT0gYi52YWx1ZU9mKCk7XG4gIGlmIChFSlNPTi5pc0JpbmFyeShhKSAmJiBFSlNPTi5pc0JpbmFyeShiKSkge1xuICAgIGlmIChhLmxlbmd0aCAhPT0gYi5sZW5ndGgpXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgZm9yIChpID0gMDsgaSA8IGEubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChhW2ldICE9PSBiW2ldKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIGlmICh0eXBlb2YgKGEuZXF1YWxzKSA9PT0gJ2Z1bmN0aW9uJylcbiAgICByZXR1cm4gYS5lcXVhbHMoYiwgb3B0aW9ucyk7XG4gIGlmIChhIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICBpZiAoIShiIGluc3RhbmNlb2YgQXJyYXkpKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIGlmIChhLmxlbmd0aCAhPT0gYi5sZW5ndGgpXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgZm9yIChpID0gMDsgaSA8IGEubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmICghRUpTT04uZXF1YWxzKGFbaV0sIGJbaV0sIG9wdGlvbnMpKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIC8vIGZhbGwgYmFjayB0byBzdHJ1Y3R1cmFsIGVxdWFsaXR5IG9mIG9iamVjdHNcbiAgdmFyIHJldDtcbiAgaWYgKGtleU9yZGVyU2Vuc2l0aXZlKSB7XG4gICAgdmFyIGJLZXlzID0gW107XG4gICAgXy5lYWNoKGIsIGZ1bmN0aW9uICh2YWwsIHgpIHtcbiAgICAgICAgYktleXMucHVzaCh4KTtcbiAgICB9KTtcbiAgICBpID0gMDtcbiAgICByZXQgPSBfLmFsbChhLCBmdW5jdGlvbiAodmFsLCB4KSB7XG4gICAgICBpZiAoaSA+PSBiS2V5cy5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgaWYgKHggIT09IGJLZXlzW2ldKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGlmICghRUpTT04uZXF1YWxzKHZhbCwgYltiS2V5c1tpXV0sIG9wdGlvbnMpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGkrKztcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0pO1xuICAgIHJldHVybiByZXQgJiYgaSA9PT0gYktleXMubGVuZ3RoO1xuICB9IGVsc2Uge1xuICAgIGkgPSAwO1xuICAgIHJldCA9IF8uYWxsKGEsIGZ1bmN0aW9uICh2YWwsIGtleSkge1xuICAgICAgaWYgKCFfLmhhcyhiLCBrZXkpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGlmICghRUpTT04uZXF1YWxzKHZhbCwgYltrZXldLCBvcHRpb25zKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBpKys7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9KTtcbiAgICByZXR1cm4gcmV0ICYmIF8uc2l6ZShiKSA9PT0gaTtcbiAgfVxufTtcblxuRUpTT04uY2xvbmUgPSBmdW5jdGlvbiAodikge1xuICB2YXIgcmV0O1xuICBpZiAodHlwZW9mIHYgIT09IFwib2JqZWN0XCIpXG4gICAgcmV0dXJuIHY7XG4gIGlmICh2ID09PSBudWxsKVxuICAgIHJldHVybiBudWxsOyAvLyBudWxsIGhhcyB0eXBlb2YgXCJvYmplY3RcIlxuICBpZiAodiBpbnN0YW5jZW9mIERhdGUpXG4gICAgcmV0dXJuIG5ldyBEYXRlKHYuZ2V0VGltZSgpKTtcbiAgaWYgKEVKU09OLmlzQmluYXJ5KHYpKSB7XG4gICAgcmV0ID0gRUpTT04ubmV3QmluYXJ5KHYubGVuZ3RoKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHYubGVuZ3RoOyBpKyspIHtcbiAgICAgIHJldFtpXSA9IHZbaV07XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG4gIH1cbiAgaWYgKF8uaXNBcnJheSh2KSB8fCBfLmlzQXJndW1lbnRzKHYpKSB7XG4gICAgLy8gRm9yIHNvbWUgcmVhc29uLCBfLm1hcCBkb2Vzbid0IHdvcmsgaW4gdGhpcyBjb250ZXh0IG9uIE9wZXJhICh3ZWlyZCB0ZXN0XG4gICAgLy8gZmFpbHVyZXMpLlxuICAgIHJldCA9IFtdO1xuICAgIGZvciAoaSA9IDA7IGkgPCB2Lmxlbmd0aDsgaSsrKVxuICAgICAgcmV0W2ldID0gRUpTT04uY2xvbmUodltpXSk7XG4gICAgcmV0dXJuIHJldDtcbiAgfVxuICAvLyBoYW5kbGUgZ2VuZXJhbCB1c2VyLWRlZmluZWQgdHlwZWQgT2JqZWN0cyBpZiB0aGV5IGhhdmUgYSBjbG9uZSBtZXRob2RcbiAgaWYgKHR5cGVvZiB2LmNsb25lID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIHYuY2xvbmUoKTtcbiAgfVxuICAvLyBoYW5kbGUgb3RoZXIgb2JqZWN0c1xuICByZXQgPSB7fTtcbiAgXy5lYWNoKHYsIGZ1bmN0aW9uICh2YWx1ZSwga2V5KSB7XG4gICAgcmV0W2tleV0gPSBFSlNPTi5jbG9uZSh2YWx1ZSk7XG4gIH0pO1xuICByZXR1cm4gcmV0O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBFSlNPTjsiXX0=
;