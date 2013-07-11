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


},{"forms":"EAVIrc","../app/js/pages/ImagePage":4,"./helpers/UIDriver":5}],6:[function(require,module,exports){
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


},{"forms":"EAVIrc","./helpers/UIDriver":5,"../app/js/pages/ImagePage":4}],7:[function(require,module,exports){
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


},{"../app/js/ItemTracker":11}],12:[function(require,module,exports){
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


},{"../app/js/GeoJSON":13}],14:[function(require,module,exports){
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


},{"../app/js/db/LocalDb":8,"../app/js/db/HybridDb":15,"./db_queries":9}],16:[function(require,module,exports){
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


},{"../app/js/auth":17}],9:[function(require,module,exports){
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


},{"../app/js/GeoJSON":13}],18:[function(require,module,exports){
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


},{"../app/js/LocationView":19,"./helpers/UIDriver":5}],20:[function(require,module,exports){
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


},{"./db_queries":9,"../app/js/db/RemoteDb":21}],22:[function(require,module,exports){
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


},{"forms":"EAVIrc","./helpers/UIDriver":5}],"forms":[function(require,module,exports){
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


},{"./form-controls":23,"./DateQuestion":24,"./DropdownQuestion":25,"./NumberQuestion":26,"./QuestionGroup":27,"./SaveCancelForm":28,"./SourceQuestion":29,"./ImageQuestion":30,"./ImagesQuestion":31,"./Instructions":32}],2:[function(require,module,exports){
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
},{}],5:[function(require,module,exports){
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


},{}],13:[function(require,module,exports){
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


},{}],17:[function(require,module,exports){
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
      if (doc.org && this.org) {
        return doc.user === this.user || doc.org === this.org;
      } else {
        return doc.user === this.user;
      }
    };

    return UserAuth;

  })();

}).call(this);


},{}],21:[function(require,module,exports){
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


},{}],19:[function(require,module,exports){
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


},{"./GeoJSON":13,"./LocationFinder":33}],8:[function(require,module,exports){
(function() {
  var Collection, LocalDb, compileSort, createUid, processFind;

  createUid = require('./utils').createUid;

  processFind = require('./utils').processFind;

  compileSort = require('./selector').compileSort;

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


},{"./selector":34,"./utils":35}],15:[function(require,module,exports){
(function() {
  var HybridCollection, HybridDb, processFind;

  processFind = require('./utils').processFind;

  module.exports = HybridDb = (function() {
    function HybridDb(localDb, remoteDb) {
      this.localDb = localDb;
      this.remoteDb = remoteDb;
      this.collections = {};
    }

    HybridDb.prototype.addCollection = function(name) {
      var collection;
      collection = new HybridCollection(name, this.localDb[name], this.remoteDb[name]);
      this[name] = collection;
      return this.collections[name] = collection;
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
      return this.localCol.upsert(doc, success, error);
    };

    HybridCollection.prototype.remove = function(id, success, error) {
      return this.localCol.remove(id, success, error);
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


},{"./utils":35}],4:[function(require,module,exports){
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


},{"../Page":36}],23:[function(require,module,exports){
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

},{}],28:[function(require,module,exports){
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


},{}],32:[function(require,module,exports){
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


},{}],24:[function(require,module,exports){
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


},{"./form-controls":23}],26:[function(require,module,exports){
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


},{"./form-controls":23}],25:[function(require,module,exports){
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


},{"./form-controls":23}],30:[function(require,module,exports){
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


},{"./form-controls":23,"../pages/ImagePage":4}],31:[function(require,module,exports){
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


},{"./form-controls":23,"../pages/ImagePage":4}],29:[function(require,module,exports){
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


},{"./form-controls":23,"../sourcecodes":37,"../pages/SourceListPage":38}],33:[function(require,module,exports){
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


},{}],36:[function(require,module,exports){
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


},{}],37:[function(require,module,exports){
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


},{}],34:[function(require,module,exports){
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
},{"./EJSON":39}],35:[function(require,module,exports){
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


},{"./selector":34,"../GeoJSON":13}],38:[function(require,module,exports){
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


},{"../Page":36,"../LocationFinder":33,"./NewSourcePage":40,"../GeoJSON":13,"./SourcePage":41}],39:[function(require,module,exports){
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
},{}],40:[function(require,module,exports){
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


},{"../Page":36,"./SourcePage":41,"../forms":"EAVIrc"}],41:[function(require,module,exports){
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


},{"../Page":36,"../LocationView":19,"./SourceMapPage":42,"./SourceEditPage":43,"./NewTestPage":44,"./TestPage":45,"./SourceNotePage":46,"../forms":"EAVIrc"}],44:[function(require,module,exports){
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


},{"../Page":36,"./TestPage":45}],42:[function(require,module,exports){
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


},{"./SourcePage":41,"../Page":36,"../ItemTracker":11,"../LocationFinder":33,"../GeoJSON":13}],43:[function(require,module,exports){
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


},{"../Page":36,"../forms":"EAVIrc"}],45:[function(require,module,exports){
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


},{"../Page":36,"../forms":"EAVIrc"}],46:[function(require,module,exports){
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


},{"../Page":36,"../forms":"EAVIrc"}]},{},[12,3,6,14,10,7,18,1,20,16,9,22])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL3Rlc3QvUHJvYmxlbVJlcG9ydGVyVGVzdHMuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My90ZXN0L0ltYWdlUXVlc3Rpb25UZXN0cy5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL3Rlc3QvSW1hZ2VzUXVlc3Rpb25zVGVzdHMuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My90ZXN0L0xvY2FsRGJUZXN0cy5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL3Rlc3QvSXRlbVRyYWNrZXJUZXN0cy5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL3Rlc3QvR2VvSlNPTlRlc3RzLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvdGVzdC9IeWJyaWREYlRlc3RzLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvdGVzdC9hdXRoVGVzdHMuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My90ZXN0L2RiX3F1ZXJpZXMuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My90ZXN0L0xvY2F0aW9uVmlld1Rlc3RzLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvdGVzdC9SZW1vdGVEYlRlc3RzLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvdGVzdC9Ecm9wZG93blF1ZXN0aW9uVGVzdHMuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvZm9ybXMvaW5kZXguY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvUHJvYmxlbVJlcG9ydGVyLmpzIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My90ZXN0L2hlbHBlcnMvVUlEcml2ZXIuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvSXRlbVRyYWNrZXIuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvR2VvSlNPTi5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9hdXRoLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL2RiL1JlbW90ZURiLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL0xvY2F0aW9uVmlldy5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9kYi9Mb2NhbERiLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL2RiL0h5YnJpZERiLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL3BhZ2VzL0ltYWdlUGFnZS5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9mb3Jtcy9mb3JtLWNvbnRyb2xzLmpzIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvZm9ybXMvU2F2ZUNhbmNlbEZvcm0uY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvZm9ybXMvSW5zdHJ1Y3Rpb25zLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL2Zvcm1zL1F1ZXN0aW9uR3JvdXAuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvZm9ybXMvRGF0ZVF1ZXN0aW9uLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL2Zvcm1zL051bWJlclF1ZXN0aW9uLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL2Zvcm1zL0Ryb3Bkb3duUXVlc3Rpb24uY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvZm9ybXMvSW1hZ2VRdWVzdGlvbi5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9mb3Jtcy9JbWFnZXNRdWVzdGlvbi5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9mb3Jtcy9Tb3VyY2VRdWVzdGlvbi5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9Mb2NhdGlvbkZpbmRlci5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9QYWdlLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL3NvdXJjZWNvZGVzLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL2RiL3NlbGVjdG9yLmpzIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvZGIvdXRpbHMuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvcGFnZXMvU291cmNlTGlzdFBhZ2UuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvZGIvRUpTT04uanMiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9wYWdlcy9OZXdTb3VyY2VQYWdlLmNvZmZlZSIsIi9ob21lL2NsYXl0b24vZGV2L21XYXRlci9hcHAtdjMvYXBwL2pzL3BhZ2VzL1NvdXJjZVBhZ2UuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvcGFnZXMvTmV3VGVzdFBhZ2UuY29mZmVlIiwiL2hvbWUvY2xheXRvbi9kZXYvbVdhdGVyL2FwcC12My9hcHAvanMvcGFnZXMvU291cmNlTWFwUGFnZS5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9wYWdlcy9Tb3VyY2VFZGl0UGFnZS5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9wYWdlcy9UZXN0UGFnZS5jb2ZmZWUiLCIvaG9tZS9jbGF5dG9uL2Rldi9tV2F0ZXIvYXBwLXYzL2FwcC9qcy9wYWdlcy9Tb3VyY2VOb3RlUGFnZS5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0NBQUEsS0FBQSxpQkFBQTs7Q0FBQSxDQUFBLENBQVMsQ0FBSSxFQUFiOztDQUFBLENBQ0EsQ0FBa0IsSUFBQSxRQUFsQixZQUFrQjs7Q0FEbEIsQ0FHQSxDQUE0QixLQUE1QixDQUE0QixRQUE1QjtDQUNFLEVBQU8sQ0FBUCxFQUFBLEdBQU87Q0FDTCxRQUFBLENBQUE7Q0FBQSxFQUFZLEdBQVosR0FBQTtDQUNFLEtBQUEsU0FBTztDQURULE1BQVk7Q0FBWixFQUVtQixDQUFsQixDQUZELENBRUEsQ0FBMEIsUUFBMUI7Q0FDQyxDQUFELENBQVUsQ0FBVCxDQUFTLElBQUEsSUFBVixFQUFVLHdCQUFBO0NBSlosSUFBTztDQUFQLEVBS00sQ0FBTixDQUFBLElBQU07Q0FDSixDQUFHLEVBQUYsRUFBRCxDQUFBO0NBQ08sQ0FBcUIsRUFBQyxDQUE3QixDQUFNLENBQWMsTUFBcEIsRUFBQTtDQUZGLElBQU07Q0FJSCxDQUFILENBQW1DLE1BQUEsRUFBbkMsbUJBQUE7Q0FDRSxHQUFBLE1BQUE7Q0FBQSxDQUFxQixDQUFkLENBQVAsQ0FBWSxDQUFaO0NBQUEsSUFDQSxDQUFBLENBQU8sYUFBUDtDQURBLEdBR2tCLEVBQWxCLElBQUE7Q0FIQSxDQUlzQyxFQUFyQixDQUFqQixDQUFBLENBQUE7Q0FKQSxDQUtx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Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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NkMsSUFBQSxJQUFELFVBQUE7Q0FBNUMsVUFBeUM7Q0FEM0MsUUFBa0M7Q0FHakMsQ0FBeUIsQ0FBVSxFQUFuQyxHQUFELENBQW9DLEtBQXBDLENBQUE7Q0FDRyxJQUFBLElBQUQsUUFBQTtDQURGLFFBQW9DO0NBeEN0QyxNQUE2QztDQUYvQyxJQUFVOztDQUFWOztDQUQ0QztDQVQ5QyIsInNvdXJjZXNDb250ZW50IjpbImFzc2VydCA9IGNoYWkuYXNzZXJ0XG5Qcm9ibGVtUmVwb3J0ZXIgPSByZXF1aXJlICcuLi9hcHAvanMvUHJvYmxlbVJlcG9ydGVyJ1xuXG5kZXNjcmliZSBcIlByb2JsZW1SZXBvcnRlclwiLCAtPlxuICBiZWZvcmUgLT5cbiAgICBnZXRDbGllbnQgPSAtPlxuICAgICAgcmV0dXJuIFwiMTIzNFwiXG4gICAgQG9sZENvbnNvbGVFcnJvciA9IGNvbnNvbGUuZXJyb3JcbiAgICBAcHIgPSBuZXcgUHJvYmxlbVJlcG9ydGVyKFwiaHR0cDovL2xvY2FsaG9zdDo4MDgwL3Byb2JsZW1fcmVwb3J0c1wiLCBcIjEuMlwiLCBnZXRDbGllbnQpXG4gIGFmdGVyIC0+XG4gICAgQHByLnJlc3RvcmUoKVxuICAgIGFzc2VydC5lcXVhbCBjb25zb2xlLmVycm9yLCBAb2xkQ29uc29sZUVycm9yXG5cbiAgaXQgXCJwb3N0cyBlcnJvciBvbiBjb25zb2xlLmVycm9yXCIsIC0+XG4gICAgcG9zdCA9IHNpbm9uLnN0dWIoJCwgXCJwb3N0XCIpXG4gICAgY29uc29sZS5lcnJvciBcIlNvbWUgZXJyb3IgbWVzc2FnZVwiXG5cbiAgICBhc3NlcnQuaXNUcnVlIHBvc3QuY2FsbGVkT25jZVxuICAgIGFzc2VydC5lcXVhbCBwb3N0LmFyZ3NbMF1bMV0udmVyc2lvbiwgXCIxLjJcIlxuICAgIGFzc2VydC5lcXVhbCBwb3N0LmFyZ3NbMF1bMV0uY2xpZW50LCBcIjEyMzRcIlxuXG4gICAgcG9zdC5yZXN0b3JlKClcbiIsImFzc2VydCA9IGNoYWkuYXNzZXJ0XG5mb3JtcyA9IHJlcXVpcmUoJ2Zvcm1zJylcblVJRHJpdmVyID0gcmVxdWlyZSAnLi9oZWxwZXJzL1VJRHJpdmVyJ1xuSW1hZ2VQYWdlID0gcmVxdWlyZSAnLi4vYXBwL2pzL3BhZ2VzL0ltYWdlUGFnZSdcblxuY2xhc3MgTW9ja0ltYWdlTWFuYWdlciBcbiAgZ2V0SW1hZ2VUaHVtYm5haWxVcmw6IChpbWFnZVVpZCwgc3VjY2VzcywgZXJyb3IpIC0+XG4gICAgc3VjY2VzcyBcImltYWdlcy9cIiArIGltYWdlVWlkICsgXCIuanBnXCJcblxuICBnZXRJbWFnZVVybDogKGltYWdlVWlkLCBzdWNjZXNzLCBlcnJvcikgLT5cbiAgICBzdWNjZXNzIFwiaW1hZ2VzL1wiICsgaW1hZ2VVaWQgKyBcIi5qcGdcIlxuXG5jbGFzcyBNb2NrQ2FtZXJhXG4gIHRha2VQaWN0dXJlOiAoc3VjY2VzcywgZXJyb3IpIC0+XG4gICAgc3VjY2VzcyhcImh0dHA6Ly8xMjM0LmpwZ1wiKVxuXG5kZXNjcmliZSAnSW1hZ2VRdWVzdGlvbicsIC0+XG4gIGJlZm9yZUVhY2ggLT5cbiAgICAjIENyZWF0ZSBtb2RlbFxuICAgIEBtb2RlbCA9IG5ldyBCYWNrYm9uZS5Nb2RlbCBcblxuICBjb250ZXh0ICdXaXRoIGEgbm8gY2FtZXJhJywgLT5cbiAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAjIENyZWF0ZSBjb250ZXh0XG4gICAgICBAY3R4ID0ge1xuICAgICAgICBpbWFnZU1hbmFnZXI6IG5ldyBNb2NrSW1hZ2VNYW5hZ2VyKClcbiAgICAgIH1cblxuICAgICAgQHF1ZXN0aW9uID0gbmV3IGZvcm1zLkltYWdlUXVlc3Rpb25cbiAgICAgICAgbW9kZWw6IEBtb2RlbFxuICAgICAgICBpZDogXCJxMVwiXG4gICAgICAgIGN0eDogQGN0eFxuXG4gICAgaXQgJ2Rpc3BsYXlzIG5vIGltYWdlJywgLT5cbiAgICAgIGFzc2VydC5pc1RydWUgdHJ1ZVxuXG4gICAgaXQgJ2Rpc3BsYXlzIG9uZSBpbWFnZScsIC0+XG4gICAgICBAbW9kZWwuc2V0KHExOiB7aWQ6IFwiMTIzNFwifSlcbiAgICAgIGFzc2VydC5lcXVhbCBAcXVlc3Rpb24uJChcImltZy50aHVtYm5haWwtaW1nXCIpLmF0dHIoXCJzcmNcIiksIFwiaW1hZ2VzLzEyMzQuanBnXCJcblxuICAgIGl0ICdvcGVucyBwYWdlJywgLT5cbiAgICAgIEBtb2RlbC5zZXQocTE6IHtpZDogXCIxMjM0XCJ9KVxuICAgICAgc3B5ID0gc2lub24uc3B5KClcbiAgICAgIEBjdHgucGFnZXIgPSB7IG9wZW5QYWdlOiBzcHkgfVxuICAgICAgQHF1ZXN0aW9uLiQoXCJpbWcudGh1bWJuYWlsLWltZ1wiKS5jbGljaygpXG5cbiAgICAgIGFzc2VydC5pc1RydWUgc3B5LmNhbGxlZE9uY2VcbiAgICAgIGFzc2VydC5lcXVhbCBzcHkuYXJnc1swXVsxXS5pZCwgXCIxMjM0XCJcblxuICAgIGl0ICdhbGxvd3MgcmVtb3ZpbmcgaW1hZ2UnLCAtPlxuICAgICAgQG1vZGVsLnNldChxMToge2lkOiBcIjEyMzRcIn0pXG4gICAgICBAY3R4LnBhZ2VyID0geyBcbiAgICAgICAgb3BlblBhZ2U6IChwYWdlLCBvcHRpb25zKSA9PlxuICAgICAgICAgIG9wdGlvbnMub25SZW1vdmUoKVxuICAgICAgfVxuICAgICAgQHF1ZXN0aW9uLiQoXCJpbWcudGh1bWJuYWlsLWltZ1wiKS5jbGljaygpXG4gICAgICBhc3NlcnQuZXF1YWwgQG1vZGVsLmdldChcInExXCIpLCBudWxsXG5cbiAgICBpdCAnZGlzcGxheXMgbm8gYWRkJywgLT5cbiAgICAgIGFzc2VydC5lcXVhbCBAcXVlc3Rpb24uJChcImltZyNhZGRcIikubGVuZ3RoLCAwXG5cbiAgY29udGV4dCAnV2l0aCBhIGNhbWVyYScsIC0+XG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgIyBDcmVhdGUgY29udGV4dFxuICAgICAgQGN0eCA9IHtcbiAgICAgICAgaW1hZ2VNYW5hZ2VyOiBuZXcgTW9ja0ltYWdlTWFuYWdlcigpXG4gICAgICAgIGNhbWVyYTogbmV3IE1vY2tDYW1lcmEoKVxuICAgICAgfVxuXG4gICAgICBAcXVlc3Rpb24gPSBuZXcgZm9ybXMuSW1hZ2VRdWVzdGlvblxuICAgICAgICBtb2RlbDogQG1vZGVsXG4gICAgICAgIGlkOiBcInExXCJcbiAgICAgICAgY3R4OiBAY3R4XG5cbiAgICBpdCAnZGlzcGxheXMgbm8gYWRkIGlmIGltYWdlIG1hbmFnZXIgaGFzIG5vIGFkZEltYWdlJywgLT5cbiAgICAgIGFzc2VydC5lcXVhbCBAcXVlc3Rpb24uJChcImltZyNhZGRcIikubGVuZ3RoLCAwXG5cbiAgY29udGV4dCAnV2l0aCBhIGNhbWVyYSBhbmQgaW1hZ2VNYW5hZ2VyIHdpdGggYWRkSW1hZ2UnLCAtPlxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgIGltYWdlTWFuYWdlciA9IG5ldyBNb2NrSW1hZ2VNYW5hZ2VyKClcbiAgICAgIGltYWdlTWFuYWdlci5hZGRJbWFnZSA9ICh1cmwsIHN1Y2Nlc3MsIGVycm9yKSAtPlxuICAgICAgICBhc3NlcnQuZXF1YWwgdXJsLCBcImh0dHA6Ly8xMjM0LmpwZ1wiXG4gICAgICAgIHN1Y2Nlc3MgXCIxMjM0XCJcblxuICAgICAgIyBDcmVhdGUgY29udGV4dFxuICAgICAgQGN0eCA9IHtcbiAgICAgICAgaW1hZ2VNYW5hZ2VyOiBpbWFnZU1hbmFnZXJcbiAgICAgICAgY2FtZXJhOiBuZXcgTW9ja0NhbWVyYSgpXG4gICAgICB9XG5cbiAgICAgIEBxdWVzdGlvbiA9IG5ldyBmb3Jtcy5JbWFnZVF1ZXN0aW9uXG4gICAgICAgIG1vZGVsOiBAbW9kZWxcbiAgICAgICAgaWQ6IFwicTFcIlxuICAgICAgICBjdHg6IEBjdHhcblxuICAgIGl0ICd0YWtlcyBhIHBob3RvJywgLT5cbiAgICAgIEBjdHguY2FtZXJhID0gbmV3IE1vY2tDYW1lcmEoKVxuICAgICAgQHF1ZXN0aW9uLiQoXCJpbWcjYWRkXCIpLmNsaWNrKClcbiAgICAgIGFzc2VydC5pc1RydWUgXy5pc0VxdWFsKEBtb2RlbC5nZXQoXCJxMVwiKSwge2lkOlwiMTIzNFwifSksIEBtb2RlbC5nZXQoXCJxMVwiKVxuXG4gICAgaXQgJ25vIGxvbmdlciBoYXMgYWRkIGFmdGVyIHRha2luZyBwaG90bycsIC0+XG4gICAgICBAY3R4LmNhbWVyYSA9IG5ldyBNb2NrQ2FtZXJhKClcbiAgICAgIEBxdWVzdGlvbi4kKFwiaW1nI2FkZFwiKS5jbGljaygpXG4gICAgICBhc3NlcnQuZXF1YWwgQHF1ZXN0aW9uLiQoXCJpbWcjYWRkXCIpLmxlbmd0aCwgMFxuXG4gICAgIiwiYXNzZXJ0ID0gY2hhaS5hc3NlcnRcbmZvcm1zID0gcmVxdWlyZSgnZm9ybXMnKVxuVUlEcml2ZXIgPSByZXF1aXJlICcuL2hlbHBlcnMvVUlEcml2ZXInXG5JbWFnZVBhZ2UgPSByZXF1aXJlICcuLi9hcHAvanMvcGFnZXMvSW1hZ2VQYWdlJ1xuXG5jbGFzcyBNb2NrSW1hZ2VNYW5hZ2VyIFxuICBnZXRJbWFnZVRodW1ibmFpbFVybDogKGltYWdlVWlkLCBzdWNjZXNzLCBlcnJvcikgLT5cbiAgICBzdWNjZXNzIFwiaW1hZ2VzL1wiICsgaW1hZ2VVaWQgKyBcIi5qcGdcIlxuXG4gIGdldEltYWdlVXJsOiAoaW1hZ2VVaWQsIHN1Y2Nlc3MsIGVycm9yKSAtPlxuICAgIHN1Y2Nlc3MgXCJpbWFnZXMvXCIgKyBpbWFnZVVpZCArIFwiLmpwZ1wiXG5cbmNsYXNzIE1vY2tDYW1lcmFcbiAgdGFrZVBpY3R1cmU6IChzdWNjZXNzLCBlcnJvcikgLT5cbiAgICBzdWNjZXNzKFwiaHR0cDovLzEyMzQuanBnXCIpXG5cbmRlc2NyaWJlICdJbWFnZXNRdWVzdGlvbicsIC0+XG4gIGJlZm9yZUVhY2ggLT5cbiAgICAjIENyZWF0ZSBtb2RlbFxuICAgIEBtb2RlbCA9IG5ldyBCYWNrYm9uZS5Nb2RlbCBcblxuICBjb250ZXh0ICdXaXRoIGEgbm8gY2FtZXJhJywgLT5cbiAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAjIENyZWF0ZSBjb250ZXh0XG4gICAgICBAY3R4ID0ge1xuICAgICAgICBpbWFnZU1hbmFnZXI6IG5ldyBNb2NrSW1hZ2VNYW5hZ2VyKClcbiAgICAgIH1cblxuICAgICAgQHF1ZXN0aW9uID0gbmV3IGZvcm1zLkltYWdlc1F1ZXN0aW9uXG4gICAgICAgIG1vZGVsOiBAbW9kZWxcbiAgICAgICAgaWQ6IFwicTFcIlxuICAgICAgICBjdHg6IEBjdHhcblxuICAgIGl0ICdkaXNwbGF5cyBubyBpbWFnZScsIC0+XG4gICAgICBAbW9kZWwuc2V0KHExOiBbXSlcbiAgICAgIGFzc2VydC5pc1RydWUgdHJ1ZVxuXG4gICAgaXQgJ2Rpc3BsYXlzIG9uZSBpbWFnZScsIC0+XG4gICAgICBAbW9kZWwuc2V0KHExOiBbe2lkOiBcIjEyMzRcIn1dKVxuICAgICAgYXNzZXJ0LmVxdWFsIEBxdWVzdGlvbi4kKFwiaW1nLnRodW1ibmFpbC1pbWdcIikuYXR0cihcInNyY1wiKSwgXCJpbWFnZXMvMTIzNC5qcGdcIlxuXG4gICAgaXQgJ29wZW5zIHBhZ2UnLCAtPlxuICAgICAgQG1vZGVsLnNldChxMTogW3tpZDogXCIxMjM0XCJ9XSlcbiAgICAgIHNweSA9IHNpbm9uLnNweSgpXG4gICAgICBAY3R4LnBhZ2VyID0geyBvcGVuUGFnZTogc3B5IH1cbiAgICAgIEBxdWVzdGlvbi4kKFwiaW1nLnRodW1ibmFpbC1pbWdcIikuY2xpY2soKVxuXG4gICAgICBhc3NlcnQuaXNUcnVlIHNweS5jYWxsZWRPbmNlXG4gICAgICBhc3NlcnQuZXF1YWwgc3B5LmFyZ3NbMF1bMV0uaWQsIFwiMTIzNFwiXG5cbiAgICBpdCAnYWxsb3dzIHJlbW92aW5nIGltYWdlJywgLT5cbiAgICAgIEBtb2RlbC5zZXQocTE6IFt7aWQ6IFwiMTIzNFwifV0pXG4gICAgICBAY3R4LnBhZ2VyID0geyBcbiAgICAgICAgb3BlblBhZ2U6IChwYWdlLCBvcHRpb25zKSA9PlxuICAgICAgICAgIG9wdGlvbnMub25SZW1vdmUoKVxuICAgICAgfVxuICAgICAgQHF1ZXN0aW9uLiQoXCJpbWcudGh1bWJuYWlsLWltZ1wiKS5jbGljaygpXG4gICAgICBhc3NlcnQuZXF1YWwgQHF1ZXN0aW9uLiQoXCJpbWcjYWRkXCIpLmxlbmd0aCwgMFxuXG4gICAgaXQgJ2Rpc3BsYXlzIG5vIGFkZCcsIC0+XG4gICAgICBhc3NlcnQuZXF1YWwgQHF1ZXN0aW9uLiQoXCJpbWcjYWRkXCIpLmxlbmd0aCwgMFxuXG4gIGNvbnRleHQgJ1dpdGggYSBjYW1lcmEnLCAtPlxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICMgQ3JlYXRlIGNvbnRleHRcbiAgICAgIEBjdHggPSB7XG4gICAgICAgIGltYWdlTWFuYWdlcjogbmV3IE1vY2tJbWFnZU1hbmFnZXIoKVxuICAgICAgICBjYW1lcmE6IG5ldyBNb2NrQ2FtZXJhKClcbiAgICAgIH1cblxuICAgICAgQHF1ZXN0aW9uID0gbmV3IGZvcm1zLkltYWdlc1F1ZXN0aW9uXG4gICAgICAgIG1vZGVsOiBAbW9kZWxcbiAgICAgICAgaWQ6IFwicTFcIlxuICAgICAgICBjdHg6IEBjdHhcblxuICAgIGl0ICdkaXNwbGF5cyBubyBhZGQgaWYgaW1hZ2UgbWFuYWdlciBoYXMgbm8gYWRkSW1hZ2UnLCAtPlxuICAgICAgYXNzZXJ0LmVxdWFsIEBxdWVzdGlvbi4kKFwiaW1nI2FkZFwiKS5sZW5ndGgsIDBcblxuICBjb250ZXh0ICdXaXRoIGEgY2FtZXJhIGFuZCBpbWFnZU1hbmFnZXIgd2l0aCBhZGRJbWFnZScsIC0+XG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgaW1hZ2VNYW5hZ2VyID0gbmV3IE1vY2tJbWFnZU1hbmFnZXIoKVxuICAgICAgaW1hZ2VNYW5hZ2VyLmFkZEltYWdlID0gKHVybCwgc3VjY2VzcywgZXJyb3IpIC0+XG4gICAgICAgIGFzc2VydC5lcXVhbCB1cmwsIFwiaHR0cDovLzEyMzQuanBnXCJcbiAgICAgICAgc3VjY2VzcyBcIjEyMzRcIlxuXG4gICAgICAjIENyZWF0ZSBjb250ZXh0XG4gICAgICBAY3R4ID0ge1xuICAgICAgICBpbWFnZU1hbmFnZXI6IGltYWdlTWFuYWdlclxuICAgICAgICBjYW1lcmE6IG5ldyBNb2NrQ2FtZXJhKClcbiAgICAgIH1cblxuICAgICAgQHF1ZXN0aW9uID0gbmV3IGZvcm1zLkltYWdlc1F1ZXN0aW9uXG4gICAgICAgIG1vZGVsOiBAbW9kZWxcbiAgICAgICAgaWQ6IFwicTFcIlxuICAgICAgICBjdHg6IEBjdHhcblxuICAgIGl0ICd0YWtlcyBhIHBob3RvJywgLT5cbiAgICAgIEBjdHguY2FtZXJhID0gbmV3IE1vY2tDYW1lcmEoKVxuICAgICAgQHF1ZXN0aW9uLiQoXCJpbWcjYWRkXCIpLmNsaWNrKClcbiAgICAgIGFzc2VydC5pc1RydWUgXy5pc0VxdWFsKEBtb2RlbC5nZXQoXCJxMVwiKSwgW3tpZDpcIjEyMzRcIn1dKSwgQG1vZGVsLmdldChcInExXCIpXG5cbiAgICAiLCJhc3NlcnQgPSBjaGFpLmFzc2VydFxuTG9jYWxEYiA9IHJlcXVpcmUgXCIuLi9hcHAvanMvZGIvTG9jYWxEYlwiXG5kYl9xdWVyaWVzID0gcmVxdWlyZSBcIi4vZGJfcXVlcmllc1wiXG5cbmRlc2NyaWJlICdMb2NhbERiJywgLT5cbiAgYmVmb3JlIC0+XG4gICAgQGRiID0gbmV3IExvY2FsRGIoJ3NjcmF0Y2gnKVxuXG4gIGJlZm9yZUVhY2ggKGRvbmUpIC0+XG4gICAgQGRiLnJlbW92ZUNvbGxlY3Rpb24oJ3NjcmF0Y2gnKVxuICAgIEBkYi5hZGRDb2xsZWN0aW9uKCdzY3JhdGNoJylcbiAgICBkb25lKClcblxuICBkZXNjcmliZSBcInBhc3NlcyBxdWVyaWVzXCIsIC0+XG4gICAgZGJfcXVlcmllcy5jYWxsKHRoaXMpXG5cbiAgaXQgJ2NhY2hlcyByb3dzJywgKGRvbmUpIC0+XG4gICAgQGRiLnNjcmF0Y2guY2FjaGUgW3sgX2lkOiAxLCBhOiAnYXBwbGUnIH1dLCB7fSwge30sID0+XG4gICAgICBAZGIuc2NyYXRjaC5maW5kKHt9KS5mZXRjaCAocmVzdWx0cykgLT5cbiAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHNbMF0uYSwgJ2FwcGxlJ1xuICAgICAgICBkb25lKClcblxuICBpdCAnY2FjaGUgb3ZlcndyaXRlIGV4aXN0aW5nJywgKGRvbmUpIC0+XG4gICAgQGRiLnNjcmF0Y2guY2FjaGUgW3sgX2lkOiAxLCBhOiAnYXBwbGUnIH1dLCB7fSwge30sID0+XG4gICAgICBAZGIuc2NyYXRjaC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdiYW5hbmEnIH1dLCB7fSwge30sID0+XG4gICAgICAgIEBkYi5zY3JhdGNoLmZpbmQoe30pLmZldGNoIChyZXN1bHRzKSAtPlxuICAgICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzWzBdLmEsICdiYW5hbmEnXG4gICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJjYWNoZSBkb2Vzbid0IG92ZXJ3cml0ZSB1cHNlcnRcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnNjcmF0Y2gudXBzZXJ0IHsgX2lkOiAxLCBhOiAnYXBwbGUnIH0sID0+XG4gICAgICBAZGIuc2NyYXRjaC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdiYW5hbmEnIH1dLCB7fSwge30sID0+XG4gICAgICAgIEBkYi5zY3JhdGNoLmZpbmQoe30pLmZldGNoIChyZXN1bHRzKSAtPlxuICAgICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzWzBdLmEsICdhcHBsZSdcbiAgICAgICAgICBkb25lKClcblxuICBpdCBcImNhY2hlIGRvZXNuJ3Qgb3ZlcndyaXRlIHJlbW92ZVwiLCAoZG9uZSkgLT5cbiAgICBAZGIuc2NyYXRjaC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdkZWxldGUnIH1dLCB7fSwge30sID0+XG4gICAgICBAZGIuc2NyYXRjaC5yZW1vdmUgMSwgPT5cbiAgICAgIEBkYi5zY3JhdGNoLmNhY2hlIFt7IF9pZDogMSwgYTogJ2JhbmFuYScgfV0sIHt9LCB7fSwgPT5cbiAgICAgICAgQGRiLnNjcmF0Y2guZmluZCh7fSkuZmV0Y2ggKHJlc3VsdHMpIC0+XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHMubGVuZ3RoLCAwXG4gICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJjYWNoZSByZW1vdmVzIG1pc3NpbmcgdW5zb3J0ZWRcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnNjcmF0Y2guY2FjaGUgW3sgX2lkOiAxLCBhOiAnYScgfSwgeyBfaWQ6IDIsIGE6ICdiJyB9LCB7IF9pZDogMywgYTogJ2MnIH1dLCB7fSwge30sID0+XG4gICAgICBAZGIuc2NyYXRjaC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdhJyB9LCB7IF9pZDogMywgYTogJ2MnIH1dLCB7fSwge30sID0+XG4gICAgICAgIEBkYi5zY3JhdGNoLmZpbmQoe30pLmZldGNoIChyZXN1bHRzKSAtPlxuICAgICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzLmxlbmd0aCwgMlxuICAgICAgICAgIGRvbmUoKVxuXG4gIGl0IFwiY2FjaGUgcmVtb3ZlcyBtaXNzaW5nIGZpbHRlcmVkXCIsIChkb25lKSAtPlxuICAgIEBkYi5zY3JhdGNoLmNhY2hlIFt7IF9pZDogMSwgYTogJ2EnIH0sIHsgX2lkOiAyLCBhOiAnYicgfSwgeyBfaWQ6IDMsIGE6ICdjJyB9XSwge30sIHt9LCA9PlxuICAgICAgQGRiLnNjcmF0Y2guY2FjaGUgW3sgX2lkOiAxLCBhOiAnYScgfV0sIHtfaWQ6IHskbHQ6M319LCB7fSwgPT5cbiAgICAgICAgQGRiLnNjcmF0Y2guZmluZCh7fSwge3NvcnQ6WydfaWQnXX0pLmZldGNoIChyZXN1bHRzKSAtPlxuICAgICAgICAgIGFzc2VydC5kZWVwRXF1YWwgXy5wbHVjayhyZXN1bHRzLCAnX2lkJyksIFsxLDNdXG4gICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJjYWNoZSByZW1vdmVzIG1pc3Npbmcgc29ydGVkIGxpbWl0ZWRcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnNjcmF0Y2guY2FjaGUgW3sgX2lkOiAxLCBhOiAnYScgfSwgeyBfaWQ6IDIsIGE6ICdiJyB9LCB7IF9pZDogMywgYTogJ2MnIH1dLCB7fSwge30sID0+XG4gICAgICBAZGIuc2NyYXRjaC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdhJyB9XSwge30sIHtzb3J0OlsnX2lkJ10sIGxpbWl0OjJ9LCA9PlxuICAgICAgICBAZGIuc2NyYXRjaC5maW5kKHt9LCB7c29ydDpbJ19pZCddfSkuZmV0Y2ggKHJlc3VsdHMpIC0+XG4gICAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCBfLnBsdWNrKHJlc3VsdHMsICdfaWQnKSwgWzEsM11cbiAgICAgICAgICBkb25lKClcblxuICBpdCBcImNhY2hlIGRvZXMgbm90IHJlbW92ZSBtaXNzaW5nIHNvcnRlZCBsaW1pdGVkIHBhc3QgZW5kXCIsIChkb25lKSAtPlxuICAgIEBkYi5zY3JhdGNoLmNhY2hlIFt7IF9pZDogMSwgYTogJ2EnIH0sIHsgX2lkOiAyLCBhOiAnYicgfSwgeyBfaWQ6IDMsIGE6ICdjJyB9LCB7IF9pZDogNCwgYTogJ2QnIH1dLCB7fSwge30sID0+XG4gICAgICBAZGIuc2NyYXRjaC5yZW1vdmUgMiwgPT5cbiAgICAgICAgQGRiLnNjcmF0Y2guY2FjaGUgW3sgX2lkOiAxLCBhOiAnYScgfSwgeyBfaWQ6IDIsIGE6ICdiJyB9XSwge30sIHtzb3J0OlsnX2lkJ10sIGxpbWl0OjJ9LCA9PlxuICAgICAgICAgIEBkYi5zY3JhdGNoLmZpbmQoe30sIHtzb3J0OlsnX2lkJ119KS5mZXRjaCAocmVzdWx0cykgLT5cbiAgICAgICAgICAgIGFzc2VydC5kZWVwRXF1YWwgXy5wbHVjayhyZXN1bHRzLCAnX2lkJyksIFsxLDMsNF1cbiAgICAgICAgICAgIGRvbmUoKVxuXG4gIGl0IFwicmV0dXJucyBwZW5kaW5nIHVwc2VydHNcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnNjcmF0Y2guY2FjaGUgW3sgX2lkOiAxLCBhOiAnYXBwbGUnIH1dLCB7fSwge30sID0+XG4gICAgICBAZGIuc2NyYXRjaC51cHNlcnQgeyBfaWQ6IDIsIGE6ICdiYW5hbmEnIH0sID0+XG4gICAgICAgIEBkYi5zY3JhdGNoLnBlbmRpbmdVcHNlcnRzIChyZXN1bHRzKSA9PlxuICAgICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzLmxlbmd0aCwgMVxuICAgICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzWzBdLmEsICdiYW5hbmEnXG4gICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJyZXNvbHZlcyBwZW5kaW5nIHVwc2VydHNcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnNjcmF0Y2gudXBzZXJ0IHsgX2lkOiAyLCBhOiAnYmFuYW5hJyB9LCA9PlxuICAgICAgQGRiLnNjcmF0Y2gucmVzb2x2ZVVwc2VydCB7IF9pZDogMiwgYTogJ2JhbmFuYScgfSwgPT5cbiAgICAgICAgQGRiLnNjcmF0Y2gucGVuZGluZ1Vwc2VydHMgKHJlc3VsdHMpID0+XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHMubGVuZ3RoLCAwXG4gICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJyZXRhaW5zIGNoYW5nZWQgcGVuZGluZyB1cHNlcnRzXCIsIChkb25lKSAtPlxuICAgIEBkYi5zY3JhdGNoLnVwc2VydCB7IF9pZDogMiwgYTogJ2JhbmFuYScgfSwgPT5cbiAgICAgIEBkYi5zY3JhdGNoLnVwc2VydCB7IF9pZDogMiwgYTogJ2JhbmFuYTInIH0sID0+XG4gICAgICAgIEBkYi5zY3JhdGNoLnJlc29sdmVVcHNlcnQgeyBfaWQ6IDIsIGE6ICdiYW5hbmEnIH0sID0+XG4gICAgICAgICAgQGRiLnNjcmF0Y2gucGVuZGluZ1Vwc2VydHMgKHJlc3VsdHMpID0+XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0cy5sZW5ndGgsIDFcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzWzBdLmEsICdiYW5hbmEyJ1xuICAgICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJyZW1vdmVzIHBlbmRpbmcgdXBzZXJ0c1wiLCAoZG9uZSkgLT5cbiAgICBAZGIuc2NyYXRjaC51cHNlcnQgeyBfaWQ6IDIsIGE6ICdiYW5hbmEnIH0sID0+XG4gICAgICBAZGIuc2NyYXRjaC5yZW1vdmUgMiwgPT5cbiAgICAgICAgQGRiLnNjcmF0Y2gucGVuZGluZ1Vwc2VydHMgKHJlc3VsdHMpID0+XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHMubGVuZ3RoLCAwXG4gICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJyZXR1cm5zIHBlbmRpbmcgcmVtb3Zlc1wiLCAoZG9uZSkgLT5cbiAgICBAZGIuc2NyYXRjaC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdhcHBsZScgfV0sIHt9LCB7fSwgPT5cbiAgICAgIEBkYi5zY3JhdGNoLnJlbW92ZSAxLCA9PlxuICAgICAgICBAZGIuc2NyYXRjaC5wZW5kaW5nUmVtb3ZlcyAocmVzdWx0cykgPT5cbiAgICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0cy5sZW5ndGgsIDFcbiAgICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0c1swXSwgMVxuICAgICAgICAgIGRvbmUoKVxuXG4gIGl0IFwicmVzb2x2ZXMgcGVuZGluZyByZW1vdmVzXCIsIChkb25lKSAtPlxuICAgIEBkYi5zY3JhdGNoLmNhY2hlIFt7IF9pZDogMSwgYTogJ2FwcGxlJyB9XSwge30sIHt9LCA9PlxuICAgICAgQGRiLnNjcmF0Y2gucmVtb3ZlIDEsID0+XG4gICAgICAgIEBkYi5zY3JhdGNoLnJlc29sdmVSZW1vdmUgMSwgPT5cbiAgICAgICAgICBAZGIuc2NyYXRjaC5wZW5kaW5nUmVtb3ZlcyAocmVzdWx0cykgPT5cbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzLmxlbmd0aCwgMFxuICAgICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJzZWVkc1wiLCAoZG9uZSkgLT5cbiAgICBAZGIuc2NyYXRjaC5zZWVkIHsgX2lkOiAxLCBhOiAnYXBwbGUnIH0sID0+XG4gICAgICBAZGIuc2NyYXRjaC5maW5kKHt9KS5mZXRjaCAocmVzdWx0cykgLT5cbiAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHNbMF0uYSwgJ2FwcGxlJ1xuICAgICAgICBkb25lKClcblxuICBpdCBcImRvZXMgbm90IG92ZXJ3cml0ZSBleGlzdGluZ1wiLCAoZG9uZSkgLT5cbiAgICBAZGIuc2NyYXRjaC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdiYW5hbmEnIH1dLCB7fSwge30sID0+XG4gICAgICBAZGIuc2NyYXRjaC5zZWVkIHsgX2lkOiAxLCBhOiAnYXBwbGUnIH0sID0+XG4gICAgICAgIEBkYi5zY3JhdGNoLmZpbmQoe30pLmZldGNoIChyZXN1bHRzKSAtPlxuICAgICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzWzBdLmEsICdiYW5hbmEnXG4gICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJkb2VzIG5vdCBhZGQgcmVtb3ZlZFwiLCAoZG9uZSkgLT5cbiAgICBAZGIuc2NyYXRjaC5jYWNoZSBbeyBfaWQ6IDEsIGE6ICdhcHBsZScgfV0sIHt9LCB7fSwgPT5cbiAgICAgIEBkYi5zY3JhdGNoLnJlbW92ZSAxLCA9PlxuICAgICAgICBAZGIuc2NyYXRjaC5zZWVkIHsgX2lkOiAxLCBhOiAnYXBwbGUnIH0sID0+XG4gICAgICAgICAgQGRiLnNjcmF0Y2guZmluZCh7fSkuZmV0Y2ggKHJlc3VsdHMpIC0+XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwgcmVzdWx0cy5sZW5ndGgsIDBcbiAgICAgICAgICAgIGRvbmUoKVxuXG5kZXNjcmliZSAnTG9jYWxEYiB3aXRoIGxvY2FsIHN0b3JhZ2UnLCAtPlxuICBiZWZvcmUgLT5cbiAgICBAZGIgPSBuZXcgTG9jYWxEYignc2NyYXRjaCcsIHsgbmFtZXNwYWNlOiBcImRiLnNjcmF0Y2hcIiB9KVxuXG4gIGJlZm9yZUVhY2ggKGRvbmUpIC0+XG4gICAgQGRiLnJlbW92ZUNvbGxlY3Rpb24oJ3NjcmF0Y2gnKVxuICAgIEBkYi5hZGRDb2xsZWN0aW9uKCdzY3JhdGNoJylcbiAgICBkb25lKClcblxuICBpdCBcInJldGFpbnMgaXRlbXNcIiwgKGRvbmUpIC0+XG4gICAgQGRiLnNjcmF0Y2gudXBzZXJ0IHsgX2lkOjEsIGE6XCJBbGljZVwiIH0sID0+XG4gICAgICBkYjIgPSBuZXcgTG9jYWxEYignc2NyYXRjaCcsIHsgbmFtZXNwYWNlOiBcImRiLnNjcmF0Y2hcIiB9KVxuICAgICAgZGIyLmFkZENvbGxlY3Rpb24gJ3NjcmF0Y2gnXG4gICAgICBkYjIuc2NyYXRjaC5maW5kKHt9KS5mZXRjaCAocmVzdWx0cykgLT5cbiAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHNbMF0uYSwgXCJBbGljZVwiXG4gICAgICAgIGRvbmUoKVxuXG4gIGl0IFwicmV0YWlucyB1cHNlcnRzXCIsIChkb25lKSAtPlxuICAgIEBkYi5zY3JhdGNoLnVwc2VydCB7IF9pZDoxLCBhOlwiQWxpY2VcIiB9LCA9PlxuICAgICAgZGIyID0gbmV3IExvY2FsRGIoJ3NjcmF0Y2gnLCB7IG5hbWVzcGFjZTogXCJkYi5zY3JhdGNoXCIgfSlcbiAgICAgIGRiMi5hZGRDb2xsZWN0aW9uICdzY3JhdGNoJ1xuICAgICAgZGIyLnNjcmF0Y2guZmluZCh7fSkuZmV0Y2ggKHJlc3VsdHMpIC0+XG4gICAgICAgIGRiMi5zY3JhdGNoLnBlbmRpbmdVcHNlcnRzICh1cHNlcnRzKSAtPlxuICAgICAgICAgIGFzc2VydC5kZWVwRXF1YWwgcmVzdWx0cywgdXBzZXJ0c1xuICAgICAgICAgIGRvbmUoKVxuXG4gIGl0IFwicmV0YWlucyByZW1vdmVzXCIsIChkb25lKSAtPlxuICAgIEBkYi5zY3JhdGNoLnNlZWQgeyBfaWQ6MSwgYTpcIkFsaWNlXCIgfSwgPT5cbiAgICAgIEBkYi5zY3JhdGNoLnJlbW92ZSAxLCA9PlxuICAgICAgICBkYjIgPSBuZXcgTG9jYWxEYignc2NyYXRjaCcsIHsgbmFtZXNwYWNlOiBcImRiLnNjcmF0Y2hcIiB9KVxuICAgICAgICBkYjIuYWRkQ29sbGVjdGlvbiAnc2NyYXRjaCdcbiAgICAgICAgZGIyLnNjcmF0Y2gucGVuZGluZ1JlbW92ZXMgKHJlbW92ZXMpIC0+XG4gICAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCByZW1vdmVzLCBbMV1cbiAgICAgICAgICBkb25lKClcblxuZGVzY3JpYmUgJ0xvY2FsRGIgd2l0aG91dCBsb2NhbCBzdG9yYWdlJywgLT5cbiAgYmVmb3JlIC0+XG4gICAgQGRiID0gbmV3IExvY2FsRGIoJ3NjcmF0Y2gnKVxuXG4gIGJlZm9yZUVhY2ggKGRvbmUpIC0+XG4gICAgQGRiLnJlbW92ZUNvbGxlY3Rpb24oJ3NjcmF0Y2gnKVxuICAgIEBkYi5hZGRDb2xsZWN0aW9uKCdzY3JhdGNoJylcbiAgICBkb25lKClcblxuICBpdCBcImRvZXMgbm90IHJldGFpbiBpdGVtc1wiLCAoZG9uZSkgLT5cbiAgICBAZGIuc2NyYXRjaC51cHNlcnQgeyBfaWQ6MSwgYTpcIkFsaWNlXCIgfSwgPT5cbiAgICAgIGRiMiA9IG5ldyBMb2NhbERiKCdzY3JhdGNoJylcbiAgICAgIGRiMi5hZGRDb2xsZWN0aW9uICdzY3JhdGNoJ1xuICAgICAgZGIyLnNjcmF0Y2guZmluZCh7fSkuZmV0Y2ggKHJlc3VsdHMpIC0+XG4gICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzLmxlbmd0aCwgMFxuICAgICAgICBkb25lKClcblxuICBpdCBcImRvZXMgbm90IHJldGFpbiB1cHNlcnRzXCIsIChkb25lKSAtPlxuICAgIEBkYi5zY3JhdGNoLnVwc2VydCB7IF9pZDoxLCBhOlwiQWxpY2VcIiB9LCA9PlxuICAgICAgZGIyID0gbmV3IExvY2FsRGIoJ3NjcmF0Y2gnKVxuICAgICAgZGIyLmFkZENvbGxlY3Rpb24gJ3NjcmF0Y2gnXG4gICAgICBkYjIuc2NyYXRjaC5maW5kKHt9KS5mZXRjaCAocmVzdWx0cykgLT5cbiAgICAgICAgZGIyLnNjcmF0Y2gucGVuZGluZ1Vwc2VydHMgKHVwc2VydHMpIC0+XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsIHJlc3VsdHMubGVuZ3RoLCAwXG4gICAgICAgICAgZG9uZSgpXG5cbiAgaXQgXCJkb2VzIG5vdCByZXRhaW4gcmVtb3Zlc1wiLCAoZG9uZSkgLT5cbiAgICBAZGIuc2NyYXRjaC5zZWVkIHsgX2lkOjEsIGE6XCJBbGljZVwiIH0sID0+XG4gICAgICBAZGIuc2NyYXRjaC5yZW1vdmUgMSwgPT5cbiAgICAgICAgZGIyID0gbmV3IExvY2FsRGIoJ3NjcmF0Y2gnKVxuICAgICAgICBkYjIuYWRkQ29sbGVjdGlvbiAnc2NyYXRjaCdcbiAgICAgICAgZGIyLnNjcmF0Y2gucGVuZGluZ1JlbW92ZXMgKHJlbW92ZXMpIC0+XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsIHJlbW92ZXMubGVuZ3RoLCAwXG4gICAgICAgICAgZG9uZSgpXG5cbiIsImFzc2VydCA9IGNoYWkuYXNzZXJ0XG5JdGVtVHJhY2tlciA9IHJlcXVpcmUgXCIuLi9hcHAvanMvSXRlbVRyYWNrZXJcIlxuXG5kZXNjcmliZSAnSXRlbVRyYWNrZXInLCAtPlxuICBiZWZvcmVFYWNoIC0+XG4gICAgQHRyYWNrZXIgPSBuZXcgSXRlbVRyYWNrZXIoKVxuXG4gIGl0IFwicmVjb3JkcyBhZGRzXCIsIC0+XG4gICAgaXRlbXMgPSAgW1xuICAgICAgX2lkOiAxLCB4OjFcbiAgICAgIF9pZDogMiwgeDoyXG4gICAgXVxuICAgIFthZGRzLCByZW1vdmVzXSA9IEB0cmFja2VyLnVwZGF0ZShpdGVtcylcbiAgICBhc3NlcnQuZGVlcEVxdWFsIGFkZHMsIGl0ZW1zXG4gICAgYXNzZXJ0LmRlZXBFcXVhbCByZW1vdmVzLCBbXVxuXG4gIGl0IFwicmVtZW1iZXJzIGl0ZW1zXCIsIC0+XG4gICAgaXRlbXMgPSAgW1xuICAgICAge19pZDogMSwgeDoxfVxuICAgICAge19pZDogMiwgeDoyfVxuICAgIF1cbiAgICBbYWRkcywgcmVtb3Zlc10gPSBAdHJhY2tlci51cGRhdGUoaXRlbXMpXG4gICAgW2FkZHMsIHJlbW92ZXNdID0gQHRyYWNrZXIudXBkYXRlKGl0ZW1zKVxuICAgIGFzc2VydC5kZWVwRXF1YWwgYWRkcywgW11cbiAgICBhc3NlcnQuZGVlcEVxdWFsIHJlbW92ZXMsIFtdXG5cbiAgaXQgXCJzZWVzIHJlbW92ZWQgaXRlbXNcIiwgLT5cbiAgICBpdGVtczEgPSAgW1xuICAgICAge19pZDogMSwgeDoxfVxuICAgICAge19pZDogMiwgeDoyfVxuICAgIF1cbiAgICBpdGVtczIgPSAgW1xuICAgICAge19pZDogMSwgeDoxfVxuICAgIF1cbiAgICBAdHJhY2tlci51cGRhdGUoaXRlbXMxKVxuICAgIFthZGRzLCByZW1vdmVzXSA9IEB0cmFja2VyLnVwZGF0ZShpdGVtczIpXG4gICAgYXNzZXJ0LmRlZXBFcXVhbCBhZGRzLCBbXVxuICAgIGFzc2VydC5kZWVwRXF1YWwgcmVtb3ZlcywgW3tfaWQ6IDIsIHg6Mn1dXG5cbiAgaXQgXCJzZWVzIHJlbW92ZWQgY2hhbmdlc1wiLCAtPlxuICAgIGl0ZW1zMSA9ICBbXG4gICAgICB7X2lkOiAxLCB4OjF9XG4gICAgICB7X2lkOiAyLCB4OjJ9XG4gICAgXVxuICAgIGl0ZW1zMiA9ICBbXG4gICAgICB7X2lkOiAxLCB4OjF9XG4gICAgICB7X2lkOiAyLCB4OjR9XG4gICAgXVxuICAgIEB0cmFja2VyLnVwZGF0ZShpdGVtczEpXG4gICAgW2FkZHMsIHJlbW92ZXNdID0gQHRyYWNrZXIudXBkYXRlKGl0ZW1zMilcbiAgICBhc3NlcnQuZGVlcEVxdWFsIGFkZHMsIFt7X2lkOiAyLCB4OjR9XVxuICAgIGFzc2VydC5kZWVwRXF1YWwgcmVtb3ZlcywgW3tfaWQ6IDIsIHg6Mn1dXG4iLCJhc3NlcnQgPSBjaGFpLmFzc2VydFxuR2VvSlNPTiA9IHJlcXVpcmUgXCIuLi9hcHAvanMvR2VvSlNPTlwiXG5cbmRlc2NyaWJlICdHZW9KU09OJywgLT5cbiAgaXQgJ3JldHVybnMgYSBwcm9wZXIgcG9seWdvbicsIC0+XG4gICAgc291dGhXZXN0ID0gbmV3IEwuTGF0TG5nKDEwLCAyMClcbiAgICBub3J0aEVhc3QgPSBuZXcgTC5MYXRMbmcoMTMsIDIzKVxuICAgIGJvdW5kcyA9IG5ldyBMLkxhdExuZ0JvdW5kcyhzb3V0aFdlc3QsIG5vcnRoRWFzdClcblxuICAgIGpzb24gPSBHZW9KU09OLmxhdExuZ0JvdW5kc1RvR2VvSlNPTihib3VuZHMpXG4gICAgYXNzZXJ0IF8uaXNFcXVhbCBqc29uLCB7XG4gICAgICB0eXBlOiBcIlBvbHlnb25cIixcbiAgICAgIGNvb3JkaW5hdGVzOiBbXG4gICAgICAgIFtbMjAsMTBdLFsyMCwxM10sWzIzLDEzXSxbMjMsMTBdLFsyMCwxMF1dXG4gICAgICBdXG4gICAgfVxuXG4gIGl0ICdnZXRzIHJlbGF0aXZlIGxvY2F0aW9uIE4nLCAtPlxuICAgIGZyb20gPSB7IHR5cGU6IFwiUG9pbnRcIiwgY29vcmRpbmF0ZXM6IFsxMCwgMjBdfVxuICAgIHRvID0geyB0eXBlOiBcIlBvaW50XCIsIGNvb3JkaW5hdGVzOiBbMTAsIDIxXX1cbiAgICBzdHIgPSBHZW9KU09OLmdldFJlbGF0aXZlTG9jYXRpb24oZnJvbSwgdG8pXG4gICAgYXNzZXJ0LmVxdWFsIHN0ciwgJzExMS4ya20gTidcblxuICBpdCAnZ2V0cyByZWxhdGl2ZSBsb2NhdGlvbiBTJywgLT5cbiAgICBmcm9tID0geyB0eXBlOiBcIlBvaW50XCIsIGNvb3JkaW5hdGVzOiBbMTAsIDIwXX1cbiAgICB0byA9IHsgdHlwZTogXCJQb2ludFwiLCBjb29yZGluYXRlczogWzEwLCAxOV19XG4gICAgc3RyID0gR2VvSlNPTi5nZXRSZWxhdGl2ZUxvY2F0aW9uKGZyb20sIHRvKVxuICAgIGFzc2VydC5lcXVhbCBzdHIsICcxMTEuMmttIFMnXG4iLCJhc3NlcnQgPSBjaGFpLmFzc2VydFxuTG9jYWxEYiA9IHJlcXVpcmUgXCIuLi9hcHAvanMvZGIvTG9jYWxEYlwiXG5IeWJyaWREYiA9IHJlcXVpcmUgXCIuLi9hcHAvanMvZGIvSHlicmlkRGJcIlxuZGJfcXVlcmllcyA9IHJlcXVpcmUgXCIuL2RiX3F1ZXJpZXNcIlxuXG4jIE5vdGU6IEFzc3VtZXMgbG9jYWwgZGIgaXMgc3luY2hyb25vdXMhXG5mYWlsID0gLT5cbiAgdGhyb3cgbmV3IEVycm9yKFwiZmFpbGVkXCIpXG5cbmRlc2NyaWJlICdIeWJyaWREYicsIC0+XG4gIGJlZm9yZUVhY2ggLT5cbiAgICBAbG9jYWwgPSBuZXcgTG9jYWxEYigpXG4gICAgQHJlbW90ZSA9IG5ldyBMb2NhbERiKClcbiAgICBAaHlicmlkID0gbmV3IEh5YnJpZERiKEBsb2NhbCwgQHJlbW90ZSlcblxuICAgIEBsYyA9IEBsb2NhbC5hZGRDb2xsZWN0aW9uKFwic2NyYXRjaFwiKVxuICAgIEByYyA9IEByZW1vdGUuYWRkQ29sbGVjdGlvbihcInNjcmF0Y2hcIilcbiAgICBAaGMgPSBAaHlicmlkLmFkZENvbGxlY3Rpb24oXCJzY3JhdGNoXCIpXG5cbiAgY29udGV4dCBcImh5YnJpZCBtb2RlXCIsIC0+XG4gICAgaXQgXCJmaW5kIGdpdmVzIG9ubHkgb25lIHJlc3VsdCBpZiBkYXRhIHVuY2hhbmdlZFwiLCAoZG9uZSkgLT5cbiAgICAgIEBsYy5zZWVkKF9pZDpcIjFcIiwgYToxKVxuICAgICAgQGxjLnNlZWQoX2lkOlwiMlwiLCBhOjIpXG5cbiAgICAgIEByYy5zZWVkKF9pZDpcIjFcIiwgYToxKVxuICAgICAgQHJjLnNlZWQoX2lkOlwiMlwiLCBhOjIpXG5cbiAgICAgIGNhbGxzID0gMFxuICAgICAgQGhjLmZpbmQoe30pLmZldGNoIChkYXRhKSAtPlxuICAgICAgICBjYWxscyArPSAxXG4gICAgICAgIGFzc2VydC5lcXVhbCBkYXRhLmxlbmd0aCwgMlxuICAgICAgICBhc3NlcnQuZXF1YWwgY2FsbHMsIDFcbiAgICAgICAgZG9uZSgpXG4gICAgICAsIGZhaWxcblxuICAgIGl0IFwibG9jYWwgdXBzZXJ0cyBhcmUgcmVzcGVjdGVkXCIsIChkb25lKSAtPlxuICAgICAgQGxjLnNlZWQoX2lkOlwiMVwiLCBhOjEpXG4gICAgICBAbGMudXBzZXJ0KF9pZDpcIjJcIiwgYToyKVxuXG4gICAgICBAcmMuc2VlZChfaWQ6XCIxXCIsIGE6MSlcbiAgICAgIEByYy5zZWVkKF9pZDpcIjJcIiwgYTo0KVxuXG4gICAgICBAaGMuZmluZE9uZSB7IF9pZDogXCIyXCJ9LCAoZG9jKSAtPlxuICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIGRvYywgeyBfaWQ6IFwiMlwiLCBhOiAyIH1cbiAgICAgICAgZG9uZSgpXG4gICAgICAsIGZhaWxcblxuICAgIGl0IFwiZmluZCBwZXJmb3JtcyBmdWxsIGZpZWxkIHJlbW90ZSBxdWVyaWVzIGluIGh5YnJpZCBtb2RlXCIsIChkb25lKSAtPlxuICAgICAgQHJjLnNlZWQoX2lkOlwiMVwiLCBhOjEsIGI6MTEpXG4gICAgICBAcmMuc2VlZChfaWQ6XCIyXCIsIGE6MiwgYjoxMilcblxuICAgICAgQGhjLmZpbmQoe30sIHsgZmllbGRzOiB7IGI6MCB9IH0pLmZldGNoIChkYXRhKSA9PlxuICAgICAgICBpZiBkYXRhLmxlbmd0aCA9PSAwXG4gICAgICAgICAgcmV0dXJuXG4gICAgICAgIGFzc2VydC5pc1VuZGVmaW5lZCBkYXRhWzBdLmJcbiAgICAgICAgQGxjLmZpbmRPbmUgeyBfaWQ6IFwiMVwiIH0sIChkb2MpIC0+XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsIGRvYy5iLCAxMVxuICAgICAgICAgIGRvbmUoKVxuXG4gICAgaXQgXCJmaW5kT25lIHBlcmZvcm1zIGZ1bGwgZmllbGQgcmVtb3RlIHF1ZXJpZXMgaW4gaHlicmlkIG1vZGVcIiwgKGRvbmUpIC0+XG4gICAgICBAcmMuc2VlZChfaWQ6XCIxXCIsIGE6MSwgYjoxMSlcbiAgICAgIEByYy5zZWVkKF9pZDpcIjJcIiwgYToyLCBiOjEyKVxuXG4gICAgICBAaGMuZmluZE9uZSB7IF9pZDogXCIxXCIgfSwgeyBmaWVsZHM6IHsgYjowIH0gfSwgKGRvYykgPT5cbiAgICAgICAgYXNzZXJ0LmlzVW5kZWZpbmVkIGRvYy5iXG4gICAgICAgIEBsYy5maW5kT25lIHsgX2lkOiBcIjFcIiB9LCAoZG9jKSAtPlxuICAgICAgICAgIGFzc2VydC5lcXVhbCBkb2MuYiwgMTFcbiAgICAgICAgICBkb25lKClcblxuICAgIGl0IFwiZmluZCBnaXZlcyByZXN1bHRzIHR3aWNlIGlmIHJlbW90ZSBnaXZlcyBkaWZmZXJlbnQgYW5zd2VyXCIsIChkb25lKSAtPlxuICAgICAgQGxjLnNlZWQoX2lkOlwiMVwiLCBhOjEpXG4gICAgICBAbGMuc2VlZChfaWQ6XCIyXCIsIGE6MilcblxuICAgICAgQHJjLnNlZWQoX2lkOlwiMVwiLCBhOjMpXG4gICAgICBAcmMuc2VlZChfaWQ6XCIyXCIsIGE6NClcblxuICAgICAgY2FsbHMgPSAwXG4gICAgICBAaGMuZmluZCh7fSkuZmV0Y2ggKGRhdGEpIC0+XG4gICAgICAgIGFzc2VydC5lcXVhbCBkYXRhLmxlbmd0aCwgMlxuICAgICAgICBjYWxscyA9IGNhbGxzICsgMVxuICAgICAgICBpZiBjYWxscyA+PTJcbiAgICAgICAgICBkb25lKClcbiAgICAgICwgZmFpbFxuXG4gICAgaXQgXCJmaW5kIGdpdmVzIHJlc3VsdHMgb25jZSBpZiByZW1vdGUgZ2l2ZXMgc2FtZSBhbnN3ZXIgd2l0aCBzb3J0IGRpZmZlcmVuY2VzXCIsIChkb25lKSAtPlxuICAgICAgQGxjLnNlZWQoX2lkOlwiMVwiLCBhOjEpXG4gICAgICBAbGMuc2VlZChfaWQ6XCIyXCIsIGE6MilcblxuICAgICAgQHJjLmZpbmQgPSAoKSA9PlxuICAgICAgICByZXR1cm4gZmV0Y2g6IChzdWNjZXNzKSA9PlxuICAgICAgICAgIHN1Y2Nlc3MoW3tfaWQ6XCIyXCIsIGE6Mn0sIHtfaWQ6XCIxXCIsIGE6MX1dKVxuXG4gICAgICBAaGMuZmluZCh7fSkuZmV0Y2ggKGRhdGEpIC0+XG4gICAgICAgIGFzc2VydC5lcXVhbCBkYXRhLmxlbmd0aCwgMlxuICAgICAgICBkb25lKClcbiAgICAgICwgZmFpbFxuXG4gICAgaXQgXCJmaW5kT25lIGdpdmVzIHJlc3VsdHMgdHdpY2UgaWYgcmVtb3RlIGdpdmVzIGRpZmZlcmVudCBhbnN3ZXJcIiwgKGRvbmUpIC0+XG4gICAgICBAbGMuc2VlZChfaWQ6XCIxXCIsIGE6MSlcbiAgICAgIEBsYy5zZWVkKF9pZDpcIjJcIiwgYToyKVxuXG4gICAgICBAcmMuc2VlZChfaWQ6XCIxXCIsIGE6MylcbiAgICAgIEByYy5zZWVkKF9pZDpcIjJcIiwgYTo0KVxuXG4gICAgICBjYWxscyA9IDBcbiAgICAgIEBoYy5maW5kT25lIHsgX2lkOiBcIjFcIn0sIChkYXRhKSAtPlxuICAgICAgICBjYWxscyA9IGNhbGxzICsgMVxuICAgICAgICBpZiBjYWxscyA9PSAxXG4gICAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCBkYXRhLCB7IF9pZCA6IFwiMVwiLCBhOjEgfVxuICAgICAgICBpZiBjYWxscyA+PSAyXG4gICAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCBkYXRhLCB7IF9pZCA6IFwiMVwiLCBhOjMgfVxuICAgICAgICAgIGRvbmUoKVxuICAgICAgLCBmYWlsXG5cbiAgICBpdCBcImZpbmRPbmUgZ2l2ZXMgcmVzdWx0cyBudWxsIG9uY2UgaWYgcmVtb3RlIGZhaWxzXCIsIChkb25lKSAtPlxuICAgICAgY2FsbGVkID0gMFxuICAgICAgQHJjLmZpbmRPbmUgPSAoc2VsZWN0b3IsIG9wdGlvbnMgPSB7fSwgc3VjY2VzcywgZXJyb3IpIC0+XG4gICAgICAgIGNhbGxlZCA9IGNhbGxlZCArIDFcbiAgICAgICAgZXJyb3IobmV3IEVycm9yKFwiZmFpbFwiKSlcbiAgICAgIEBoYy5maW5kT25lIHsgX2lkOiBcInh5elwifSwgKGRhdGEpIC0+XG4gICAgICAgIGFzc2VydC5lcXVhbCBkYXRhLCBudWxsXG4gICAgICAgIGFzc2VydC5lcXVhbCBjYWxsZWQsIDFcbiAgICAgICAgZG9uZSgpXG4gICAgICAsIGZhaWxcblxuICAgIGl0IFwiY2FjaGVzIHJlbW90ZSBkYXRhXCIsIChkb25lKSAtPlxuICAgICAgQGxjLnNlZWQoX2lkOlwiMVwiLCBhOjEpXG4gICAgICBAbGMuc2VlZChfaWQ6XCIyXCIsIGE6MilcblxuICAgICAgQHJjLnNlZWQoX2lkOlwiMVwiLCBhOjMpXG4gICAgICBAcmMuc2VlZChfaWQ6XCIyXCIsIGE6MilcblxuICAgICAgY2FsbHMgPSAwXG4gICAgICBAaGMuZmluZCh7fSkuZmV0Y2ggKGRhdGEpID0+XG4gICAgICAgIGFzc2VydC5lcXVhbCBkYXRhLmxlbmd0aCwgMlxuICAgICAgICBjYWxscyA9IGNhbGxzICsgMVxuXG4gICAgICAgICMgQWZ0ZXIgc2Vjb25kIGNhbGwsIGNoZWNrIHRoYXQgbG9jYWwgY29sbGVjdGlvbiBoYXMgbGF0ZXN0XG4gICAgICAgIGlmIGNhbGxzID09IDJcbiAgICAgICAgICBAbGMuZmluZCh7fSkuZmV0Y2ggKGRhdGEpID0+XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwgZGF0YS5sZW5ndGgsIDJcbiAgICAgICAgICAgIGFzc2VydC5kZWVwRXF1YWwgXy5wbHVjayhkYXRhLCAnYScpLCBbMywyXVxuICAgICAgICAgICAgZG9uZSgpXG5cbiAgY29udGV4dCBcImxvY2FsIG1vZGVcIiwgLT5cbiAgICBpdCBcImZpbmQgb25seSBjYWxscyBsb2NhbFwiLCAoZG9uZSkgLT5cbiAgICAgIEBsYy5zZWVkKF9pZDpcIjFcIiwgYToxKVxuICAgICAgQGxjLnNlZWQoX2lkOlwiMlwiLCBhOjIpXG5cbiAgICAgIEByYy5zZWVkKF9pZDpcIjFcIiwgYTozKVxuICAgICAgQHJjLnNlZWQoX2lkOlwiMlwiLCBhOjQpXG5cbiAgICAgIEBoYy5maW5kKHt9LCB7bW9kZTpcImxvY2FsXCJ9KS5mZXRjaCAoZGF0YSkgPT5cbiAgICAgICAgYXNzZXJ0LmVxdWFsIGRhdGEubGVuZ3RoLCAyXG4gICAgICAgIGFzc2VydC5kZWVwRXF1YWwgXy5wbHVjayhkYXRhLCAnYScpLCBbMSwyXVxuICAgICAgICBkb25lKClcblxuICAgIGl0IFwiZmluZE9uZSBvbmx5IGNhbGxzIGxvY2FsIGlmIGZvdW5kXCIsIChkb25lKSAtPlxuICAgICAgQGxjLnNlZWQoX2lkOlwiMVwiLCBhOjEpXG4gICAgICBAbGMuc2VlZChfaWQ6XCIyXCIsIGE6MilcblxuICAgICAgQHJjLnNlZWQoX2lkOlwiMVwiLCBhOjMpXG4gICAgICBAcmMuc2VlZChfaWQ6XCIyXCIsIGE6NClcblxuICAgICAgY2FsbHMgPSAwXG4gICAgICBAaGMuZmluZE9uZSB7IF9pZDogXCIxXCIgfSwgeyBtb2RlOiBcImxvY2FsXCIgfSwgKGRhdGEpID0+XG4gICAgICAgIGFzc2VydC5kZWVwRXF1YWwgZGF0YSwgeyBfaWQgOiBcIjFcIiwgYToxIH1cbiAgICAgICAgZG9uZSgpXG4gICAgICAsIGZhaWxcblxuICAgIGl0IFwiZmluZE9uZSBjYWxscyByZW1vdGUgaWYgbm90IGZvdW5kXCIsIChkb25lKSAtPlxuICAgICAgQGxjLnNlZWQoX2lkOlwiMlwiLCBhOjIpXG5cbiAgICAgIEByYy5zZWVkKF9pZDpcIjFcIiwgYTozKVxuICAgICAgQHJjLnNlZWQoX2lkOlwiMlwiLCBhOjQpXG5cbiAgICAgIGNhbGxzID0gMFxuICAgICAgQGhjLmZpbmRPbmUgeyBfaWQ6IFwiMVwifSwgeyBtb2RlOlwibG9jYWxcIiB9LCAoZGF0YSkgPT5cbiAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCBkYXRhLCB7IF9pZCA6IFwiMVwiLCBhOjMgfVxuICAgICAgICBkb25lKClcbiAgICAgICwgZmFpbFxuXG4gIGNvbnRleHQgXCJyZW1vdGUgbW9kZVwiLCAtPlxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgIEBsYy5zZWVkKF9pZDpcIjFcIiwgYToxKVxuICAgICAgQGxjLnNlZWQoX2lkOlwiMlwiLCBhOjIpXG5cbiAgICAgIEByYy5zZWVkKF9pZDpcIjFcIiwgYTozKVxuICAgICAgQHJjLnNlZWQoX2lkOlwiMlwiLCBhOjQpXG5cbiAgICBpdCBcImZpbmQgb25seSBjYWxscyByZW1vdGVcIiwgKGRvbmUpIC0+XG4gICAgICBAaGMuZmluZCh7fSwgeyBtb2RlOiBcInJlbW90ZVwiIH0pLmZldGNoIChkYXRhKSA9PlxuICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIF8ucGx1Y2soZGF0YSwgJ2EnKSwgWzMsNF1cbiAgICAgICAgZG9uZSgpXG5cbiAgICBpdCBcImZpbmQgZG9lcyBub3QgY2FjaGUgcmVzdWx0c1wiLCAoZG9uZSkgLT5cbiAgICAgIEBoYy5maW5kKHt9LCB7IG1vZGU6IFwicmVtb3RlXCIgfSkuZmV0Y2ggKGRhdGEpID0+XG4gICAgICAgIEBsYy5maW5kKHt9KS5mZXRjaCAoZGF0YSkgPT5cbiAgICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIF8ucGx1Y2soZGF0YSwgJ2EnKSwgWzEsMl1cbiAgICAgICAgICBkb25lKClcblxuICAgIGl0IFwiZmluZCBmYWxscyBiYWNrIHRvIGxvY2FsIGlmIHJlbW90ZSBmYWlsc1wiLCAoZG9uZSkgLT5cbiAgICAgIEByYy5maW5kID0gKHNlbGVjdG9yLCBvcHRpb25zKSA9PlxuICAgICAgICByZXR1cm4geyBmZXRjaDogKHN1Y2Nlc3MsIGVycm9yKSAtPlxuICAgICAgICAgIGVycm9yKClcbiAgICAgICAgfVxuICAgICAgQGhjLmZpbmQoe30sIHsgbW9kZTogXCJyZW1vdGVcIiB9KS5mZXRjaCAoZGF0YSkgPT5cbiAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCBfLnBsdWNrKGRhdGEsICdhJyksIFsxLDJdXG4gICAgICAgIGRvbmUoKVxuXG4gICAgaXQgXCJmaW5kIHJlc3BlY3RzIGxvY2FsIHVwc2VydHNcIiwgKGRvbmUpIC0+XG4gICAgICBAbGMudXBzZXJ0KHsgX2lkOlwiMVwiLCBhOjkgfSlcblxuICAgICAgQGhjLmZpbmQoe30sIHsgbW9kZTogXCJyZW1vdGVcIiwgc29ydDogWydfaWQnXSB9KS5mZXRjaCAoZGF0YSkgPT5cbiAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCBfLnBsdWNrKGRhdGEsICdhJyksIFs5LDRdXG4gICAgICAgIGRvbmUoKVxuXG4gICAgaXQgXCJmaW5kIHJlc3BlY3RzIGxvY2FsIHJlbW92ZXNcIiwgKGRvbmUpIC0+XG4gICAgICBAbGMucmVtb3ZlKFwiMVwiKVxuXG4gICAgICBAaGMuZmluZCh7fSwgeyBtb2RlOiBcInJlbW90ZVwiIH0pLmZldGNoIChkYXRhKSA9PlxuICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIF8ucGx1Y2soZGF0YSwgJ2EnKSwgWzRdXG4gICAgICAgIGRvbmUoKVxuICAgIFxuICBpdCBcInVwbG9hZCBhcHBsaWVzIHBlbmRpbmcgdXBzZXJ0cyBhbmQgZGVsZXRlc1wiLCAoZG9uZSkgLT5cbiAgICBAbGMudXBzZXJ0KF9pZDpcIjFcIiwgYToxKVxuICAgIEBsYy51cHNlcnQoX2lkOlwiMlwiLCBhOjIpXG5cbiAgICBAaHlicmlkLnVwbG9hZCgoKSA9PlxuICAgICAgQGxjLnBlbmRpbmdVcHNlcnRzIChkYXRhKSA9PlxuICAgICAgICBhc3NlcnQuZXF1YWwgZGF0YS5sZW5ndGgsIDBcblxuICAgICAgICBAcmMucGVuZGluZ1Vwc2VydHMgKGRhdGEpID0+XG4gICAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCBfLnBsdWNrKGRhdGEsICdhJyksIFsxLDJdXG4gICAgICAgICAgZG9uZSgpXG4gICAgLCBmYWlsKVxuXG4gIGl0IFwia2VlcHMgdXBzZXJ0cyBhbmQgZGVsZXRlcyBpZiBmYWlsZWQgdG8gYXBwbHlcIiwgKGRvbmUpIC0+XG4gICAgQGxjLnVwc2VydChfaWQ6XCIxXCIsIGE6MSlcbiAgICBAbGMudXBzZXJ0KF9pZDpcIjJcIiwgYToyKVxuXG4gICAgQHJjLnVwc2VydCA9IChkb2MsIHN1Y2Nlc3MsIGVycm9yKSA9PlxuICAgICAgZXJyb3IobmV3IEVycm9yKFwiZmFpbFwiKSlcblxuICAgIEBoeWJyaWQudXBsb2FkKCgpID0+XG4gICAgICBhc3NlcnQuZmFpbCgpXG4gICAgLCAoKT0+XG4gICAgICBAbGMucGVuZGluZ1Vwc2VydHMgKGRhdGEpID0+XG4gICAgICAgIGFzc2VydC5lcXVhbCBkYXRhLmxlbmd0aCwgMlxuICAgICAgICBkb25lKClcbiAgICApXG5cbiAgaXQgXCJ1cHNlcnRzIHRvIGxvY2FsIGRiXCIsIChkb25lKSAtPlxuICAgIEBoYy51cHNlcnQoX2lkOlwiMVwiLCBhOjEpXG4gICAgQGxjLnBlbmRpbmdVcHNlcnRzIChkYXRhKSA9PlxuICAgICAgYXNzZXJ0LmVxdWFsIGRhdGEubGVuZ3RoLCAxXG4gICAgICBkb25lKClcblxuICBpdCBcInJlbW92ZXMgdG8gbG9jYWwgZGJcIiwgKGRvbmUpIC0+XG4gICAgQGxjLnNlZWQoX2lkOlwiMVwiLCBhOjEpXG4gICAgQGhjLnJlbW92ZShcIjFcIilcbiAgICBAbGMucGVuZGluZ1JlbW92ZXMgKGRhdGEpID0+XG4gICAgICBhc3NlcnQuZXF1YWwgZGF0YS5sZW5ndGgsIDFcbiAgICAgIGRvbmUoKVxuIiwiYXNzZXJ0ID0gY2hhaS5hc3NlcnRcbmF1dGggPSByZXF1aXJlIFwiLi4vYXBwL2pzL2F1dGhcIlxuXG5cbmRlc2NyaWJlIFwiVXNlckF1dGhcIiwgLT5cbiAgY29udGV4dCBcInVzZXIgb25seVwiLCAtPlxuICAgIGJlZm9yZSAtPlxuICAgICAgQGF1dGggPSBuZXcgYXV0aC5Vc2VyQXV0aChcInNvbWV1c2VyXCIpXG5cbiAgICBpdCBcImRvZXMgbm90IGFsbG93IHNvdXJjZV90eXBlcyBpbnNlcnRcIiwgLT5cbiAgICAgIGFzc2VydC5pc0ZhbHNlIEBhdXRoLmluc2VydChcInNvdXJjZV90eXBlc1wiKVxuXG4gICAgaXQgXCJkb2VzIGFsbG93IHNvdXJjZXMgaW5zZXJ0XCIsIC0+XG4gICAgICBhc3NlcnQuaXNUcnVlIEBhdXRoLmluc2VydChcInNvdXJjZXNcIilcblxuICAgIGl0IFwiZG9lcyBhbGxvdyBzb3VyY2VzIHVwZGF0ZSBmb3IgdXNlclwiLCAtPlxuICAgICAgYXNzZXJ0LmlzVHJ1ZSBAYXV0aC51cGRhdGUoXCJzb3VyY2VzXCIsIHsgdXNlcjogXCJzb21ldXNlclwifSlcblxuICAgIGl0IFwiZG9lcyBub3QgYWxsb3cgc291cmNlcyB1cGRhdGUgZm9yIG90aGVyIHVzZXJcIiwgLT5cbiAgICAgIGFzc2VydC5pc0ZhbHNlIEBhdXRoLnVwZGF0ZShcInNvdXJjZXNcIiwgeyB1c2VyOiBcInh5enp5XCJ9KVxuXG4gIGNvbnRleHQgXCJ1c2VyIGFuZCBvcmdcIiwgLT5cbiAgICBiZWZvcmUgLT5cbiAgICAgIEBhdXRoID0gbmV3IGF1dGguVXNlckF1dGgoXCJzb21ldXNlclwiLCBcInNvbWVvcmdcIilcblxuICAgIGl0IFwiZG9lcyBub3QgYWxsb3cgc291cmNlX3R5cGVzIGluc2VydFwiLCAtPlxuICAgICAgYXNzZXJ0LmlzRmFsc2UgQGF1dGguaW5zZXJ0KFwic291cmNlX3R5cGVzXCIpXG5cbiAgICBpdCBcImRvZXMgYWxsb3cgc291cmNlcyBpbnNlcnRcIiwgLT5cbiAgICAgIGFzc2VydC5pc1RydWUgQGF1dGguaW5zZXJ0KFwic291cmNlc1wiKVxuXG4gICAgaXQgXCJkb2VzIGFsbG93IHNvdXJjZXMgdXBkYXRlIGZvciB1c2VyXCIsIC0+XG4gICAgICBhc3NlcnQuaXNUcnVlIEBhdXRoLnVwZGF0ZShcInNvdXJjZXNcIiwgeyB1c2VyOiBcInNvbWV1c2VyXCJ9KVxuXG4gICAgaXQgXCJkb2VzIG5vdCBhbGxvdyBzb3VyY2VzIHVwZGF0ZSBmb3Igb3RoZXIgdXNlciB3aXRoIG5vIG9yZ1wiLCAtPlxuICAgICAgYXNzZXJ0LmlzRmFsc2UgQGF1dGgudXBkYXRlKFwic291cmNlc1wiLCB7IHVzZXI6IFwieHl6enlcIn0pXG5cbiAgICBpdCBcImRvZXMgYWxsb3cgc291cmNlcyB1cGRhdGUgZm9yIG90aGVyIHVzZXIgd2l0aCBzYW1lIG9yZ1wiLCAtPlxuICAgICAgYXNzZXJ0LmlzVHJ1ZSBAYXV0aC51cGRhdGUoXCJzb3VyY2VzXCIsIHsgdXNlcjogXCJ4eXp6eVwiLCBvcmc6IFwic29tZW9yZ1wifSlcbiIsImFzc2VydCA9IGNoYWkuYXNzZXJ0XG5cbkdlb0pTT04gPSByZXF1aXJlICcuLi9hcHAvanMvR2VvSlNPTidcblxubW9kdWxlLmV4cG9ydHMgPSAtPlxuICBjb250ZXh0ICdXaXRoIHNhbXBsZSByb3dzJywgLT5cbiAgICBiZWZvcmVFYWNoIChkb25lKSAtPlxuICAgICAgQGRiLnNjcmF0Y2gudXBzZXJ0IHsgX2lkOlwiMVwiLCBhOlwiQWxpY2VcIiwgYjoxIH0sID0+XG4gICAgICAgIEBkYi5zY3JhdGNoLnVwc2VydCB7IF9pZDpcIjJcIiwgYTpcIkNoYXJsaWVcIiwgYjoyIH0sID0+XG4gICAgICAgICAgQGRiLnNjcmF0Y2gudXBzZXJ0IHsgX2lkOlwiM1wiLCBhOlwiQm9iXCIsIGI6MyB9LCA9PlxuICAgICAgICAgICAgZG9uZSgpXG5cbiAgICBpdCAnZmluZHMgYWxsIHJvd3MnLCAoZG9uZSkgLT5cbiAgICAgIEBkYi5zY3JhdGNoLmZpbmQoe30pLmZldGNoIChyZXN1bHRzKSA9PlxuICAgICAgICBhc3NlcnQuZXF1YWwgMywgcmVzdWx0cy5sZW5ndGhcbiAgICAgICAgZG9uZSgpXG5cbiAgICBpdCAnZmluZHMgYWxsIHJvd3Mgd2l0aCBvcHRpb25zJywgKGRvbmUpIC0+XG4gICAgICBAZGIuc2NyYXRjaC5maW5kKHt9LCB7fSkuZmV0Y2ggKHJlc3VsdHMpID0+XG4gICAgICAgIGFzc2VydC5lcXVhbCAzLCByZXN1bHRzLmxlbmd0aFxuICAgICAgICBkb25lKClcblxuICAgIGl0ICdmaWx0ZXJzIHJvd3MgYnkgaWQnLCAoZG9uZSkgLT5cbiAgICAgIEBkYi5zY3JhdGNoLmZpbmQoeyBfaWQ6IFwiMVwiIH0pLmZldGNoIChyZXN1bHRzKSA9PlxuICAgICAgICBhc3NlcnQuZXF1YWwgMSwgcmVzdWx0cy5sZW5ndGhcbiAgICAgICAgYXNzZXJ0LmVxdWFsICdBbGljZScsIHJlc3VsdHNbMF0uYVxuICAgICAgICBkb25lKClcblxuICAgIGl0ICdpbmNsdWRlcyBmaWVsZHMnLCAoZG9uZSkgLT5cbiAgICAgIEBkYi5zY3JhdGNoLmZpbmQoeyBfaWQ6IFwiMVwiIH0sIHsgZmllbGRzOiB7IGE6MSB9fSkuZmV0Y2ggKHJlc3VsdHMpID0+XG4gICAgICAgIGFzc2VydC5kZWVwRXF1YWwgcmVzdWx0c1swXSwgeyBfaWQ6IFwiMVwiLCAgYTogXCJBbGljZVwiIH1cbiAgICAgICAgZG9uZSgpXG5cbiAgICBpdCAnZXhjbHVkZXMgZmllbGRzJywgKGRvbmUpIC0+XG4gICAgICBAZGIuc2NyYXRjaC5maW5kKHsgX2lkOiBcIjFcIiB9LCB7IGZpZWxkczogeyBhOjAgfX0pLmZldGNoIChyZXN1bHRzKSA9PlxuICAgICAgICBhc3NlcnQuaXNVbmRlZmluZWQgcmVzdWx0c1swXS5hXG4gICAgICAgIGFzc2VydC5lcXVhbCByZXN1bHRzWzBdLmIsIDFcbiAgICAgICAgZG9uZSgpXG5cbiAgICBpdCAnZmluZHMgb25lIHJvdycsIChkb25lKSAtPlxuICAgICAgQGRiLnNjcmF0Y2guZmluZE9uZSB7IF9pZDogXCIyXCIgfSwgKHJlc3VsdCkgPT5cbiAgICAgICAgYXNzZXJ0LmVxdWFsICdDaGFybGllJywgcmVzdWx0LmFcbiAgICAgICAgZG9uZSgpXG5cbiAgICBpdCAncmVtb3ZlcyBpdGVtJywgKGRvbmUpIC0+XG4gICAgICBAZGIuc2NyYXRjaC5yZW1vdmUgXCIyXCIsID0+XG4gICAgICAgIEBkYi5zY3JhdGNoLmZpbmQoe30pLmZldGNoIChyZXN1bHRzKSA9PlxuICAgICAgICAgIGFzc2VydC5lcXVhbCAyLCByZXN1bHRzLmxlbmd0aFxuICAgICAgICAgIGFzc2VydCBcIjFcIiBpbiAocmVzdWx0Ll9pZCBmb3IgcmVzdWx0IGluIHJlc3VsdHMpXG4gICAgICAgICAgYXNzZXJ0IFwiMlwiIG5vdCBpbiAocmVzdWx0Ll9pZCBmb3IgcmVzdWx0IGluIHJlc3VsdHMpXG4gICAgICAgICAgZG9uZSgpXG5cbiAgICBpdCAncmVtb3ZlcyBub24tZXhpc3RlbnQgaXRlbScsIChkb25lKSAtPlxuICAgICAgQGRiLnNjcmF0Y2gucmVtb3ZlIFwiOTk5XCIsID0+XG4gICAgICAgIEBkYi5zY3JhdGNoLmZpbmQoe30pLmZldGNoIChyZXN1bHRzKSA9PlxuICAgICAgICAgIGFzc2VydC5lcXVhbCAzLCByZXN1bHRzLmxlbmd0aFxuICAgICAgICAgIGRvbmUoKVxuXG4gICAgaXQgJ3NvcnRzIGFzY2VuZGluZycsIChkb25lKSAtPlxuICAgICAgQGRiLnNjcmF0Y2guZmluZCh7fSwge3NvcnQ6IFsnYSddfSkuZmV0Y2ggKHJlc3VsdHMpID0+XG4gICAgICAgIGFzc2VydC5kZWVwRXF1YWwgXy5wbHVjayhyZXN1bHRzLCAnX2lkJyksIFtcIjFcIixcIjNcIixcIjJcIl1cbiAgICAgICAgZG9uZSgpXG5cbiAgICBpdCAnc29ydHMgZGVzY2VuZGluZycsIChkb25lKSAtPlxuICAgICAgQGRiLnNjcmF0Y2guZmluZCh7fSwge3NvcnQ6IFtbJ2EnLCdkZXNjJ11dfSkuZmV0Y2ggKHJlc3VsdHMpID0+XG4gICAgICAgIGFzc2VydC5kZWVwRXF1YWwgXy5wbHVjayhyZXN1bHRzLCAnX2lkJyksIFtcIjJcIixcIjNcIixcIjFcIl1cbiAgICAgICAgZG9uZSgpXG5cbiAgICBpdCAnbGltaXRzJywgKGRvbmUpIC0+XG4gICAgICBAZGIuc2NyYXRjaC5maW5kKHt9LCB7c29ydDogWydhJ10sIGxpbWl0OjJ9KS5mZXRjaCAocmVzdWx0cykgPT5cbiAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCBfLnBsdWNrKHJlc3VsdHMsICdfaWQnKSwgW1wiMVwiLFwiM1wiXVxuICAgICAgICBkb25lKClcblxuICAgIGl0ICdmZXRjaGVzIGluZGVwZW5kZW50IGNvcGllcycsIChkb25lKSAtPlxuICAgICAgQGRiLnNjcmF0Y2guZmluZE9uZSB7IF9pZDogXCIyXCIgfSwgKHJlc3VsdCkgPT5cbiAgICAgICAgcmVzdWx0LmEgPSAnRGF2aWQnXG4gICAgICAgIEBkYi5zY3JhdGNoLmZpbmRPbmUgeyBfaWQ6IFwiMlwiIH0sIChyZXN1bHQpID0+XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsICdDaGFybGllJywgcmVzdWx0LmFcbiAgICAgICAgICBkb25lKClcblxuICBpdCAnYWRkcyBfaWQgdG8gcm93cycsIChkb25lKSAtPlxuICAgIEBkYi5zY3JhdGNoLnVwc2VydCB7IGE6IDEgfSwgKGl0ZW0pID0+XG4gICAgICBhc3NlcnQucHJvcGVydHkgaXRlbSwgJ19pZCdcbiAgICAgIGFzc2VydC5sZW5ndGhPZiBpdGVtLl9pZCwgMzJcbiAgICAgIGRvbmUoKVxuXG4gIGl0ICd1cGRhdGVzIGJ5IGlkJywgKGRvbmUpIC0+XG4gICAgQGRiLnNjcmF0Y2gudXBzZXJ0IHsgX2lkOlwiMVwiLCBhOjEgfSwgKGl0ZW0pID0+XG4gICAgICBAZGIuc2NyYXRjaC51cHNlcnQgeyBfaWQ6XCIxXCIsIGE6MiwgX3JldjogMSB9LCAoaXRlbSkgPT5cbiAgICAgICAgYXNzZXJ0LmVxdWFsIGl0ZW0uYSwgMlxuICBcbiAgICAgICAgQGRiLnNjcmF0Y2guZmluZCh7fSkuZmV0Y2ggKHJlc3VsdHMpID0+XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsIDEsIHJlc3VsdHMubGVuZ3RoXG4gICAgICAgICAgZG9uZSgpXG5cblxuICBnZW9wb2ludCA9IChsbmcsIGxhdCkgLT5cbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogJ1BvaW50J1xuICAgICAgY29vcmRpbmF0ZXM6IFtsbmcsIGxhdF1cbiAgICB9XG5cbiAgY29udGV4dCAnV2l0aCBnZW9sb2NhdGVkIHJvd3MnLCAtPlxuICAgIGJlZm9yZUVhY2ggKGRvbmUpIC0+XG4gICAgICBAZGIuc2NyYXRjaC51cHNlcnQgeyBfaWQ6XCIxXCIsIGxvYzpnZW9wb2ludCg5MCwgNDUpIH0sID0+XG4gICAgICAgIEBkYi5zY3JhdGNoLnVwc2VydCB7IF9pZDpcIjJcIiwgbG9jOmdlb3BvaW50KDkwLCA0NikgfSwgPT5cbiAgICAgICAgICBAZGIuc2NyYXRjaC51cHNlcnQgeyBfaWQ6XCIzXCIsIGxvYzpnZW9wb2ludCg5MSwgNDUpIH0sID0+XG4gICAgICAgICAgICBAZGIuc2NyYXRjaC51cHNlcnQgeyBfaWQ6XCI0XCIsIGxvYzpnZW9wb2ludCg5MSwgNDYpIH0sID0+XG4gICAgICAgICAgICAgIGRvbmUoKVxuXG4gICAgaXQgJ2ZpbmRzIHBvaW50cyBuZWFyJywgKGRvbmUpIC0+XG4gICAgICBzZWxlY3RvciA9IGxvYzogXG4gICAgICAgICRuZWFyOiBcbiAgICAgICAgICAkZ2VvbWV0cnk6IGdlb3BvaW50KDkwLCA0NSlcblxuICAgICAgQGRiLnNjcmF0Y2guZmluZChzZWxlY3RvcikuZmV0Y2ggKHJlc3VsdHMpID0+XG4gICAgICAgIGFzc2VydC5kZWVwRXF1YWwgXy5wbHVjayhyZXN1bHRzLCAnX2lkJyksIFtcIjFcIixcIjNcIixcIjJcIixcIjRcIl1cbiAgICAgICAgZG9uZSgpXG5cbiAgICBpdCAnZmluZHMgcG9pbnRzIG5lYXIgbWF4RGlzdGFuY2UnLCAoZG9uZSkgLT5cbiAgICAgIHNlbGVjdG9yID0gbG9jOiBcbiAgICAgICAgJG5lYXI6IFxuICAgICAgICAgICRnZW9tZXRyeTogZ2VvcG9pbnQoOTAsIDQ1KVxuICAgICAgICAgICRtYXhEaXN0YW5jZTogMTExMDAwXG5cbiAgICAgIEBkYi5zY3JhdGNoLmZpbmQoc2VsZWN0b3IpLmZldGNoIChyZXN1bHRzKSA9PlxuICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIF8ucGx1Y2socmVzdWx0cywgJ19pZCcpLCBbXCIxXCIsXCIzXCJdXG4gICAgICAgIGRvbmUoKSAgICAgIFxuXG4gICAgaXQgJ2ZpbmRzIHBvaW50cyBuZWFyIG1heERpc3RhbmNlIGp1c3QgYWJvdmUnLCAoZG9uZSkgLT5cbiAgICAgIHNlbGVjdG9yID0gbG9jOiBcbiAgICAgICAgJG5lYXI6IFxuICAgICAgICAgICRnZW9tZXRyeTogZ2VvcG9pbnQoOTAsIDQ1KVxuICAgICAgICAgICRtYXhEaXN0YW5jZTogMTEyMDAwXG5cbiAgICAgIEBkYi5zY3JhdGNoLmZpbmQoc2VsZWN0b3IpLmZldGNoIChyZXN1bHRzKSA9PlxuICAgICAgICBhc3NlcnQuZGVlcEVxdWFsIF8ucGx1Y2socmVzdWx0cywgJ19pZCcpLCBbXCIxXCIsXCIzXCIsXCIyXCJdXG4gICAgICAgIGRvbmUoKVxuXG4gICAgaXQgJ2ZpbmRzIHBvaW50cyB3aXRoaW4gc2ltcGxlIGJveCcsIChkb25lKSAtPlxuICAgICAgc2VsZWN0b3IgPSBsb2M6IFxuICAgICAgICAkZ2VvSW50ZXJzZWN0czogXG4gICAgICAgICAgJGdlb21ldHJ5OiBcbiAgICAgICAgICAgIHR5cGU6ICdQb2x5Z29uJ1xuICAgICAgICAgICAgY29vcmRpbmF0ZXM6IFtbXG4gICAgICAgICAgICAgIFs4OS41LCA0NS41XSwgWzg5LjUsIDQ2LjVdLCBbOTAuNSwgNDYuNV0sIFs5MC41LCA0NS41XSwgWzg5LjUsIDQ1LjVdXG4gICAgICAgICAgICBdXVxuICAgICAgQGRiLnNjcmF0Y2guZmluZChzZWxlY3RvcikuZmV0Y2ggKHJlc3VsdHMpID0+XG4gICAgICAgIGFzc2VydC5kZWVwRXF1YWwgXy5wbHVjayhyZXN1bHRzLCAnX2lkJyksIFtcIjJcIl1cbiAgICAgICAgZG9uZSgpXG5cbiAgICBpdCAnaGFuZGxlcyB1bmRlZmluZWQnLCAoZG9uZSkgLT5cbiAgICAgIHNlbGVjdG9yID0gbG9jOiBcbiAgICAgICAgJGdlb0ludGVyc2VjdHM6IFxuICAgICAgICAgICRnZW9tZXRyeTogXG4gICAgICAgICAgICB0eXBlOiAnUG9seWdvbidcbiAgICAgICAgICAgIGNvb3JkaW5hdGVzOiBbW1xuICAgICAgICAgICAgICBbODkuNSwgNDUuNV0sIFs4OS41LCA0Ni41XSwgWzkwLjUsIDQ2LjVdLCBbOTAuNSwgNDUuNV0sIFs4OS41LCA0NS41XVxuICAgICAgICAgICAgXV1cbiAgICAgIEBkYi5zY3JhdGNoLnVwc2VydCB7IF9pZDo1IH0sID0+XG4gICAgICAgIEBkYi5zY3JhdGNoLmZpbmQoc2VsZWN0b3IpLmZldGNoIChyZXN1bHRzKSA9PlxuICAgICAgICAgIGFzc2VydC5kZWVwRXF1YWwgXy5wbHVjayhyZXN1bHRzLCAnX2lkJyksIFtcIjJcIl1cbiAgICAgICAgICBkb25lKClcblxuXG4iLCJhc3NlcnQgPSBjaGFpLmFzc2VydFxuTG9jYXRpb25WaWV3ID0gcmVxdWlyZSAnLi4vYXBwL2pzL0xvY2F0aW9uVmlldydcblVJRHJpdmVyID0gcmVxdWlyZSAnLi9oZWxwZXJzL1VJRHJpdmVyJ1xuXG5jbGFzcyBNb2NrTG9jYXRpb25GaW5kZXJcbiAgY29uc3RydWN0b3I6ICAtPlxuICAgIF8uZXh0ZW5kIEAsIEJhY2tib25lLkV2ZW50c1xuXG4gIGdldExvY2F0aW9uOiAtPlxuICBzdGFydFdhdGNoOiAtPlxuICBzdG9wV2F0Y2g6IC0+XG5cbmRlc2NyaWJlICdMb2NhdGlvblZpZXcnLCAtPlxuICBjb250ZXh0ICdXaXRoIG5vIHNldCBsb2NhdGlvbicsIC0+XG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgQGxvY2F0aW9uRmluZGVyID0gbmV3IE1vY2tMb2NhdGlvbkZpbmRlcigpXG4gICAgICBAbG9jYXRpb25WaWV3ID0gbmV3IExvY2F0aW9uVmlldyhsb2M6bnVsbCwgbG9jYXRpb25GaW5kZXI6IEBsb2NhdGlvbkZpbmRlcilcbiAgICAgIEB1aSA9IG5ldyBVSURyaXZlcihAbG9jYXRpb25WaWV3LmVsKVxuXG4gICAgaXQgJ2Rpc3BsYXlzIFVuc3BlY2lmaWVkJywgLT5cbiAgICAgIGFzc2VydC5pbmNsdWRlKEB1aS50ZXh0KCksICdVbnNwZWNpZmllZCcpXG5cbiAgICBpdCAnZGlzYWJsZXMgbWFwJywgLT5cbiAgICAgIGFzc2VydC5pc1RydWUgQHVpLmdldERpc2FibGVkKFwiTWFwXCIpIFxuXG4gICAgaXQgJ2FsbG93cyBzZXR0aW5nIGxvY2F0aW9uJywgLT5cbiAgICAgIEB1aS5jbGljaygnU2V0JylcbiAgICAgIHNldFBvcyA9IG51bGxcbiAgICAgIEBsb2NhdGlvblZpZXcub24gJ2xvY2F0aW9uc2V0JywgKHBvcykgLT5cbiAgICAgICAgc2V0UG9zID0gcG9zXG5cbiAgICAgIEBsb2NhdGlvbkZpbmRlci50cmlnZ2VyICdmb3VuZCcsIHsgY29vcmRzOiB7IGxhdGl0dWRlOiAyLCBsb25naXR1ZGU6IDMsIGFjY3VyYWN5OiAxMH19XG4gICAgICBhc3NlcnQuZXF1YWwgc2V0UG9zLmNvb3JkaW5hdGVzWzFdLCAyXG5cbiAgICBpdCAnRGlzcGxheXMgZXJyb3InLCAtPlxuICAgICAgQHVpLmNsaWNrKCdTZXQnKVxuICAgICAgc2V0UG9zID0gbnVsbFxuICAgICAgQGxvY2F0aW9uVmlldy5vbiAnbG9jYXRpb25zZXQnLCAocG9zKSAtPlxuICAgICAgICBzZXRQb3MgPSBwb3NcblxuICAgICAgQGxvY2F0aW9uRmluZGVyLnRyaWdnZXIgJ2Vycm9yJ1xuICAgICAgYXNzZXJ0LmVxdWFsIHNldFBvcywgbnVsbFxuICAgICAgYXNzZXJ0LmluY2x1ZGUoQHVpLnRleHQoKSwgJ0Nhbm5vdCcpXG5cbiAgY29udGV4dCAnV2l0aCBzZXQgbG9jYXRpb24nLCAtPlxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgIEBsb2NhdGlvbkZpbmRlciA9IG5ldyBNb2NrTG9jYXRpb25GaW5kZXIoKVxuICAgICAgQGxvY2F0aW9uVmlldyA9IG5ldyBMb2NhdGlvblZpZXcobG9jOiB7IHR5cGU6IFwiUG9pbnRcIiwgY29vcmRpbmF0ZXM6IFsxMCwgMjBdfSwgbG9jYXRpb25GaW5kZXI6IEBsb2NhdGlvbkZpbmRlcilcbiAgICAgIEB1aSA9IG5ldyBVSURyaXZlcihAbG9jYXRpb25WaWV3LmVsKVxuXG4gICAgaXQgJ2Rpc3BsYXlzIFdhaXRpbmcnLCAtPlxuICAgICAgYXNzZXJ0LmluY2x1ZGUoQHVpLnRleHQoKSwgJ1dhaXRpbmcnKVxuXG4gICAgaXQgJ2Rpc3BsYXlzIHJlbGF0aXZlJywgLT5cbiAgICAgIEBsb2NhdGlvbkZpbmRlci50cmlnZ2VyICdmb3VuZCcsIHsgY29vcmRzOiB7IGxhdGl0dWRlOiAyMSwgbG9uZ2l0dWRlOiAxMCwgYWNjdXJhY3k6IDEwfX1cbiAgICAgIGFzc2VydC5pbmNsdWRlKEB1aS50ZXh0KCksICcxMTEuMmttIFMnKVxuXG4iLCJhc3NlcnQgPSBjaGFpLmFzc2VydFxuUmVtb3RlRGIgPSByZXF1aXJlIFwiLi4vYXBwL2pzL2RiL1JlbW90ZURiXCJcbmRiX3F1ZXJpZXMgPSByZXF1aXJlIFwiLi9kYl9xdWVyaWVzXCJcblxuIyBUbyB3b3JrLCB0aGlzIG11c3QgaGF2ZSB0aGUgZm9sbG93aW5nIHNlcnZlciBydW5uaW5nOlxuIyBOT0RFX0VOVj10ZXN0IG5vZGUgc2VydmVyLmpzXG5pZiBmYWxzZVxuICBkZXNjcmliZSAnUmVtb3RlRGInLCAtPlxuICAgIGJlZm9yZUVhY2ggKGRvbmUpIC0+XG4gICAgICB1cmwgPSAnaHR0cDovL2xvY2FsaG9zdDo4MDgwL3YzLydcbiAgICAgIHJlcSA9ICQucG9zdCh1cmwgKyBcIl9yZXNldFwiLCB7fSlcbiAgICAgIHJlcS5mYWlsIChqcVhIUiwgdGV4dFN0YXR1cywgZXJyb3JUaHJvd24pID0+XG4gICAgICAgIHRocm93IHRleHRTdGF0dXNcbiAgICAgIHJlcS5kb25lID0+XG4gICAgICAgIHJlcSA9ICQuYWpheCh1cmwgKyBcInVzZXJzL3Rlc3RcIiwge1xuICAgICAgICAgIGRhdGEgOiBKU09OLnN0cmluZ2lmeSh7IGVtYWlsOiBcInRlc3RAdGVzdC5jb21cIiwgcGFzc3dvcmQ6XCJ4eXp6eVwiIH0pLFxuICAgICAgICAgIGNvbnRlbnRUeXBlIDogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICAgIHR5cGUgOiAnUFVUJ30pXG4gICAgICAgIHJlcS5kb25lIChkYXRhKSA9PlxuICAgICAgICAgIHJlcSA9ICQuYWpheCh1cmwgKyBcInVzZXJzL3Rlc3RcIiwge1xuICAgICAgICAgIGRhdGEgOiBKU09OLnN0cmluZ2lmeSh7IHBhc3N3b3JkOlwieHl6enlcIiB9KSxcbiAgICAgICAgICBjb250ZW50VHlwZSA6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICB0eXBlIDogJ1BPU1QnfSlcbiAgICAgICAgICByZXEuZG9uZSAoZGF0YSkgPT5cbiAgICAgICAgICAgIEBjbGllbnQgPSBkYXRhLmNsaWVudFxuXG4gICAgICAgICAgICBAZGIgPSBuZXcgUmVtb3RlRGIodXJsLCBAY2xpZW50KVxuICAgICAgICAgICAgQGRiLmFkZENvbGxlY3Rpb24oJ3NjcmF0Y2gnKVxuXG4gICAgICAgICAgICBkb25lKClcblxuICAgIGRlc2NyaWJlIFwicGFzc2VzIHF1ZXJpZXNcIiwgLT5cbiAgICAgIGRiX3F1ZXJpZXMuY2FsbCh0aGlzKVxuIiwiYXNzZXJ0ID0gY2hhaS5hc3NlcnRcbkRyb3Bkb3duUXVlc3Rpb24gPSByZXF1aXJlKCdmb3JtcycpLkRyb3Bkb3duUXVlc3Rpb25cblVJRHJpdmVyID0gcmVxdWlyZSAnLi9oZWxwZXJzL1VJRHJpdmVyJ1xuXG4jIGNsYXNzIE1vY2tMb2NhdGlvbkZpbmRlclxuIyAgIGNvbnN0cnVjdG9yOiAgLT5cbiMgICAgIF8uZXh0ZW5kIEAsIEJhY2tib25lLkV2ZW50c1xuXG4jICAgZ2V0TG9jYXRpb246IC0+XG4jICAgc3RhcnRXYXRjaDogLT5cbiMgICBzdG9wV2F0Y2g6IC0+XG5cbmRlc2NyaWJlICdEcm9wZG93blF1ZXN0aW9uJywgLT5cbiAgY29udGV4dCAnV2l0aCBhIGZldyBvcHRpb25zJywgLT5cbiAgICBiZWZvcmVFYWNoIC0+XG4gICAgICBAbW9kZWwgPSBuZXcgQmFja2JvbmUuTW9kZWwoKVxuICAgICAgQHF1ZXN0aW9uID0gbmV3IERyb3Bkb3duUXVlc3Rpb25cbiAgICAgICAgb3B0aW9uczogW1snYScsICdBcHBsZSddLCBbJ2InLCAnQmFuYW5hJ11dXG4gICAgICAgIG1vZGVsOiBAbW9kZWxcbiAgICAgICAgaWQ6IFwicTFcIlxuXG4gICAgaXQgJ2FjY2VwdHMga25vd24gdmFsdWUnLCAtPlxuICAgICAgQG1vZGVsLnNldChxMTogJ2EnKVxuICAgICAgYXNzZXJ0LmVxdWFsIEBtb2RlbC5nZXQoJ3ExJyksICdhJ1xuICAgICAgYXNzZXJ0LmlzRmFsc2UgQHF1ZXN0aW9uLiQoXCJzZWxlY3RcIikuaXMoXCI6ZGlzYWJsZWRcIilcblxuICAgIGl0ICdpcyBkaXNhYmxlZCB3aXRoIHVua25vd24gdmFsdWUnLCAtPlxuICAgICAgQG1vZGVsLnNldChxMTogJ3gnKVxuICAgICAgYXNzZXJ0LmVxdWFsIEBtb2RlbC5nZXQoJ3ExJyksICd4J1xuICAgICAgYXNzZXJ0LmlzVHJ1ZSBAcXVlc3Rpb24uJChcInNlbGVjdFwiKS5pcyhcIjpkaXNhYmxlZFwiKVxuXG4gICAgaXQgJ2lzIG5vdCBkaXNhYmxlZCB3aXRoIGVtcHR5IHZhbHVlJywgLT5cbiAgICAgIEBtb2RlbC5zZXQocTE6IG51bGwpXG4gICAgICBhc3NlcnQuZXF1YWwgQG1vZGVsLmdldCgncTEnKSwgbnVsbFxuICAgICAgYXNzZXJ0LmlzRmFsc2UgQHF1ZXN0aW9uLiQoXCJzZWxlY3RcIikuaXMoXCI6ZGlzYWJsZWRcIilcblxuICAgIGl0ICdpcyByZWVuYWJsZWQgd2l0aCBzZXR0aW5nIHZhbHVlJywgLT5cbiAgICAgIEBtb2RlbC5zZXQocTE6ICd4JylcbiAgICAgIGFzc2VydC5lcXVhbCBAbW9kZWwuZ2V0KCdxMScpLCAneCdcbiAgICAgIEBxdWVzdGlvbi5zZXRPcHRpb25zKFtbJ2EnLCAnQXBwbGUnXSwgWydiJywgJ0JhbmFuYSddLCBbJ3gnLCAnS2l3aSddXSlcbiAgICAgIGFzc2VydC5pc0ZhbHNlIEBxdWVzdGlvbi4kKFwic2VsZWN0XCIpLmlzKFwiOmRpc2FibGVkXCIpXG5cbiIsIlxuZXhwb3J0cy5EYXRlUXVlc3Rpb24gPSByZXF1aXJlICcuL0RhdGVRdWVzdGlvbidcbmV4cG9ydHMuRHJvcGRvd25RdWVzdGlvbiA9IHJlcXVpcmUgJy4vRHJvcGRvd25RdWVzdGlvbidcbmV4cG9ydHMuTnVtYmVyUXVlc3Rpb24gPSByZXF1aXJlICcuL051bWJlclF1ZXN0aW9uJ1xuZXhwb3J0cy5RdWVzdGlvbkdyb3VwID0gcmVxdWlyZSAnLi9RdWVzdGlvbkdyb3VwJ1xuZXhwb3J0cy5TYXZlQ2FuY2VsRm9ybSA9IHJlcXVpcmUgJy4vU2F2ZUNhbmNlbEZvcm0nXG5leHBvcnRzLlNvdXJjZVF1ZXN0aW9uID0gcmVxdWlyZSAnLi9Tb3VyY2VRdWVzdGlvbidcbmV4cG9ydHMuSW1hZ2VRdWVzdGlvbiA9IHJlcXVpcmUgJy4vSW1hZ2VRdWVzdGlvbidcbmV4cG9ydHMuSW1hZ2VzUXVlc3Rpb24gPSByZXF1aXJlICcuL0ltYWdlc1F1ZXN0aW9uJ1xuZXhwb3J0cy5JbnN0cnVjdGlvbnMgPSByZXF1aXJlICcuL0luc3RydWN0aW9ucydcblxuIyBNdXN0IGJlIGNyZWF0ZWQgd2l0aCBtb2RlbCAoYmFja2JvbmUgbW9kZWwpIGFuZCBjb250ZW50cyAoYXJyYXkgb2Ygdmlld3MpXG5leHBvcnRzLkZvcm1WaWV3ID0gY2xhc3MgRm9ybVZpZXcgZXh0ZW5kcyBCYWNrYm9uZS5WaWV3XG4gIGluaXRpYWxpemU6IChvcHRpb25zKSAtPlxuICAgIEBjb250ZW50cyA9IG9wdGlvbnMuY29udGVudHNcbiAgICBcbiAgICAjIEFkZCBjb250ZW50cyBhbmQgbGlzdGVuIHRvIGV2ZW50c1xuICAgIGZvciBjb250ZW50IGluIG9wdGlvbnMuY29udGVudHNcbiAgICAgIEAkZWwuYXBwZW5kKGNvbnRlbnQuZWwpO1xuICAgICAgQGxpc3RlblRvIGNvbnRlbnQsICdjbG9zZScsID0+IEB0cmlnZ2VyKCdjbG9zZScpXG4gICAgICBAbGlzdGVuVG8gY29udGVudCwgJ2NvbXBsZXRlJywgPT4gQHRyaWdnZXIoJ2NvbXBsZXRlJylcblxuICAgICMgQWRkIGxpc3RlbmVyIHRvIG1vZGVsXG4gICAgQGxpc3RlblRvIEBtb2RlbCwgJ2NoYW5nZScsID0+IEB0cmlnZ2VyKCdjaGFuZ2UnKVxuXG4gICAgIyBPdmVycmlkZSBzYXZlIGlmIHBhc3NlZCBhcyBvcHRpb25cbiAgICBpZiBvcHRpb25zLnNhdmVcbiAgICAgIEBzYXZlID0gb3B0aW9ucy5zYXZlXG5cbiAgbG9hZDogKGRhdGEpIC0+XG4gICAgQG1vZGVsLmNsZWFyKCkgICNUT0RPIGNsZWFyIG9yIG5vdCBjbGVhcj8gY2xlYXJpbmcgcmVtb3ZlcyBkZWZhdWx0cywgYnV0IGFsbG93cyB0cnVlIHJldXNlLlxuXG4gICAgIyBBcHBseSBkZWZhdWx0cyBcbiAgICBAbW9kZWwuc2V0KF8uZGVmYXVsdHMoXy5jbG9uZURlZXAoZGF0YSksIEBvcHRpb25zLmRlZmF1bHRzIHx8IHt9KSlcblxuICBzYXZlOiAtPlxuICAgIHJldHVybiBAbW9kZWwudG9KU09OKClcblxuXG4jIFNpbXBsZSBmb3JtIHRoYXQgZGlzcGxheXMgYSB0ZW1wbGF0ZSBiYXNlZCBvbiBsb2FkZWQgZGF0YVxuZXhwb3J0cy50ZW1wbGF0ZVZpZXcgPSAodGVtcGxhdGUpIC0+IFxuICByZXR1cm4ge1xuICAgIGVsOiAkKCc8ZGl2PjwvZGl2PicpXG4gICAgbG9hZDogKGRhdGEpIC0+XG4gICAgICAkKEBlbCkuaHRtbCB0ZW1wbGF0ZShkYXRhKVxuICB9XG5cbiAgIyBjbGFzcyBUZW1wbGF0ZVZpZXcgZXh0ZW5kcyBCYWNrYm9uZS5WaWV3XG4gICMgY29uc3RydWN0b3I6ICh0ZW1wbGF0ZSkgLT5cbiAgIyAgIEB0ZW1wbGF0ZSA9IHRlbXBsYXRlXG5cbiAgIyBsb2FkOiAoZGF0YSkgLT5cbiAgIyAgIEAkZWwuaHRtbCBAdGVtcGxhdGUoZGF0YSlcblxuXG5leHBvcnRzLlN1cnZleVZpZXcgPSBjbGFzcyBTdXJ2ZXlWaWV3IGV4dGVuZHMgRm9ybVZpZXdcblxuZXhwb3J0cy5XYXRlclRlc3RFZGl0VmlldyA9IGNsYXNzIFdhdGVyVGVzdEVkaXRWaWV3IGV4dGVuZHMgRm9ybVZpZXdcbiAgaW5pdGlhbGl6ZTogKG9wdGlvbnMpIC0+XG4gICAgc3VwZXIob3B0aW9ucylcblxuICAgICMgQWRkIGJ1dHRvbnMgYXQgYm90dG9tXG4gICAgIyBUT0RPIG1vdmUgdG8gdGVtcGxhdGUgYW5kIHNlcCBmaWxlXG4gICAgQCRlbC5hcHBlbmQgJCgnJydcbiAgICAgIDxkaXY+XG4gICAgICAgICAgPGJ1dHRvbiBpZD1cImNsb3NlX2J1dHRvblwiIHR5cGU9XCJidXR0b25cIiBjbGFzcz1cImJ0biBtYXJnaW5lZFwiPlNhdmUgZm9yIExhdGVyPC9idXR0b24+XG4gICAgICAgICAgJm5ic3A7XG4gICAgICAgICAgPGJ1dHRvbiBpZD1cImNvbXBsZXRlX2J1dHRvblwiIHR5cGU9XCJidXR0b25cIiBjbGFzcz1cImJ0biBidG4tcHJpbWFyeSBtYXJnaW5lZFwiPjxpIGNsYXNzPVwiaWNvbi1vayBpY29uLXdoaXRlXCI+PC9pPiBDb21wbGV0ZTwvYnV0dG9uPlxuICAgICAgPC9kaXY+XG4gICAgJycnKVxuXG4gIGV2ZW50czogXG4gICAgXCJjbGljayAjY2xvc2VfYnV0dG9uXCIgOiBcImNsb3NlXCJcbiAgICBcImNsaWNrICNjb21wbGV0ZV9idXR0b25cIiA6IFwiY29tcGxldGVcIlxuXG4gICMgVE9ETyByZWZhY3RvciB3aXRoIFNhdmVDYW5jZWxGb3JtXG4gIHZhbGlkYXRlOiAtPlxuICAgICMgR2V0IGFsbCB2aXNpYmxlIGl0ZW1zXG4gICAgaXRlbXMgPSBfLmZpbHRlcihAY29udGVudHMsIChjKSAtPlxuICAgICAgYy52aXNpYmxlIGFuZCBjLnZhbGlkYXRlXG4gICAgKVxuICAgIHJldHVybiBub3QgXy5hbnkoXy5tYXAoaXRlbXMsIChpdGVtKSAtPlxuICAgICAgaXRlbS52YWxpZGF0ZSgpXG4gICAgKSlcblxuICBjbG9zZTogLT5cbiAgICBAdHJpZ2dlciAnY2xvc2UnXG5cbiAgY29tcGxldGU6IC0+XG4gICAgaWYgQHZhbGlkYXRlKClcbiAgICAgIEB0cmlnZ2VyICdjb21wbGV0ZSdcbiAgICAgIFxuIyBDcmVhdGVzIGEgZm9ybSB2aWV3IGZyb20gYSBzdHJpbmdcbmV4cG9ydHMuaW5zdGFudGlhdGVWaWV3ID0gKHZpZXdTdHIsIG9wdGlvbnMpID0+XG4gIHZpZXdGdW5jID0gbmV3IEZ1bmN0aW9uKFwib3B0aW9uc1wiLCB2aWV3U3RyKVxuICB2aWV3RnVuYyhvcHRpb25zKVxuXG5fLmV4dGVuZChleHBvcnRzLCByZXF1aXJlKCcuL2Zvcm0tY29udHJvbHMnKSlcblxuXG4jIFRPRE8gZmlndXJlIG91dCBob3cgdG8gYWxsb3cgdHdvIHN1cnZleXMgZm9yIGRpZmZlcmluZyBjbGllbnQgdmVyc2lvbnM/IE9yIGp1c3QgdXNlIG1pblZlcnNpb24/IiwiZnVuY3Rpb24gUHJvYmxlbVJlcG9ydGVyKHVybCwgdmVyc2lvbiwgZ2V0Q2xpZW50KSB7XG4gICAgdmFyIGhpc3RvcnkgPSBbXTtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG5cbiAgICAvLyBJRTkgaGFja1xuICAgIGlmIChGdW5jdGlvbi5wcm90b3R5cGUuYmluZCAmJiBjb25zb2xlICYmIHR5cGVvZiBjb25zb2xlLmxvZyA9PSBcIm9iamVjdFwiKSB7XG4gICAgICAgIFtcbiAgICAgICAgICBcImxvZ1wiLFwiaW5mb1wiLFwid2FyblwiLFwiZXJyb3JcIixcImFzc2VydFwiLFwiZGlyXCIsXCJjbGVhclwiLFwicHJvZmlsZVwiLFwicHJvZmlsZUVuZFwiXG4gICAgICAgIF0uZm9yRWFjaChmdW5jdGlvbiAobWV0aG9kKSB7XG4gICAgICAgICAgICBjb25zb2xlW21ldGhvZF0gPSB0aGlzLmJpbmQoY29uc29sZVttZXRob2RdLCBjb25zb2xlKTtcbiAgICAgICAgfSwgRnVuY3Rpb24ucHJvdG90eXBlLmNhbGwpO1xuICAgIH1cblxuICAgIHZhciBfY2FwdHVyZWQgPSB7fVxuXG4gICAgZnVuY3Rpb24gY2FwdHVyZShmdW5jKSB7XG4gICAgICAgIHZhciBvbGQgPSBjb25zb2xlW2Z1bmNdO1xuICAgICAgICBfY2FwdHVyZWRbZnVuY10gPSBvbGQ7XG4gICAgICAgIGNvbnNvbGVbZnVuY10gPSBmdW5jdGlvbihhcmcpIHtcbiAgICAgICAgICAgIGhpc3RvcnkucHVzaChhcmcpO1xuICAgICAgICAgICAgaWYgKGhpc3RvcnkubGVuZ3RoID4gMjAwKVxuICAgICAgICAgICAgICAgIGhpc3Rvcnkuc3BsaWNlKDAsIDIwKTtcbiAgICAgICAgICAgIG9sZC5jYWxsKGNvbnNvbGUsIGFyZyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjYXB0dXJlKFwibG9nXCIpO1xuICAgIGNhcHR1cmUoXCJ3YXJuXCIpO1xuICAgIGNhcHR1cmUoXCJlcnJvclwiKTtcblxuICAgIGZ1bmN0aW9uIGdldExvZygpIHtcbiAgICAgICAgdmFyIGxvZyA9IFwiXCI7XG4gICAgICAgIF8uZWFjaChoaXN0b3J5LCBmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgICAgICBsb2cgKz0gU3RyaW5nKGl0ZW0pICsgXCJcXHJcXG5cIjtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBsb2c7XG4gICAgfVxuXG5cbiAgICB0aGlzLnJlcG9ydFByb2JsZW0gPSBmdW5jdGlvbihkZXNjKSB7XG4gICAgICAgIC8vIENyZWF0ZSBsb2cgc3RyaW5nXG4gICAgICAgIHZhciBsb2cgPSBnZXRMb2coKTtcblxuICAgICAgICBjb25zb2xlLmxvZyhcIlJlcG9ydGluZyBwcm9ibGVtLi4uXCIpO1xuXG4gICAgICAgICQucG9zdCh1cmwsIHtcbiAgICAgICAgICAgIGNsaWVudCA6IGdldENsaWVudCgpLFxuICAgICAgICAgICAgdmVyc2lvbiA6IHZlcnNpb24sXG4gICAgICAgICAgICB1c2VyX2FnZW50IDogbmF2aWdhdG9yLnVzZXJBZ2VudCxcbiAgICAgICAgICAgIGxvZyA6IGxvZyxcbiAgICAgICAgICAgIGRlc2MgOiBkZXNjXG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICAvLyBDYXB0dXJlIGVycm9yIGxvZ3NcbiAgICB2YXIgZGVib3VuY2VkUmVwb3J0UHJvYmxlbSA9IF8uZGVib3VuY2UodGhpcy5yZXBvcnRQcm9ibGVtLCA1MDAwLCB0cnVlKTtcblxuICAgIHZhciBvbGRDb25zb2xlRXJyb3IgPSBjb25zb2xlLmVycm9yO1xuICAgIGNvbnNvbGUuZXJyb3IgPSBmdW5jdGlvbihhcmcpIHtcbiAgICAgICAgb2xkQ29uc29sZUVycm9yKGFyZyk7XG5cbiAgICAgICAgZGVib3VuY2VkUmVwb3J0UHJvYmxlbShhcmcpO1xuICAgIH07XG5cbiAgICAvLyBDYXB0dXJlIHdpbmRvdy5vbmVycm9yXG4gICAgdmFyIG9sZFdpbmRvd09uRXJyb3IgPSB3aW5kb3cub25lcnJvcjtcbiAgICB3aW5kb3cub25lcnJvciA9IGZ1bmN0aW9uKGVycm9yTXNnLCB1cmwsIGxpbmVOdW1iZXIpIHtcbiAgICAgICAgdGhhdC5yZXBvcnRQcm9ibGVtKFwid2luZG93Lm9uZXJyb3I6XCIgKyBlcnJvck1zZyArIFwiOlwiICsgdXJsICsgXCI6XCIgKyBsaW5lTnVtYmVyKTtcbiAgICAgICAgXG4gICAgICAgIC8vIFB1dCB1cCBhbGVydCBpbnN0ZWFkIG9mIG9sZCBhY3Rpb25cbiAgICAgICAgYWxlcnQoXCJJbnRlcm5hbCBFcnJvclxcblwiICsgZXJyb3JNc2cgKyBcIlxcblwiICsgdXJsICsgXCI6XCIgKyBsaW5lTnVtYmVyKTtcbiAgICAgICAgLy9pZiAob2xkV2luZG93T25FcnJvcilcbiAgICAgICAgLy8gICAgb2xkV2luZG93T25FcnJvcihlcnJvck1zZywgdXJsLCBsaW5lTnVtYmVyKTtcbiAgICB9O1xuXG4gICAgdGhpcy5yZXN0b3JlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIF8uZWFjaChfLmtleXMoX2NhcHR1cmVkKSwgZnVuY3Rpb24oa2V5KSB7XG4gICAgICAgICAgICBjb25zb2xlW2tleV0gPSBfY2FwdHVyZWRba2V5XTtcbiAgICAgICAgfSk7XG4gICAgICAgIHdpbmRvdy5vbmVycm9yID0gb2xkV2luZG93T25FcnJvcjtcbiAgICB9O1xufVxuXG5Qcm9ibGVtUmVwb3J0ZXIucmVnaXN0ZXIgPSBmdW5jdGlvbihiYXNlVXJsLCB2ZXJzaW9uLCBnZXRDbGllbnQpIHtcbiAgICBpZiAoIVByb2JsZW1SZXBvcnRlci5pbnN0YW5jZXMpXG4gICAgICAgIFByb2JsZW1SZXBvcnRlci5pbnN0YW5jZXMgPSB7fVxuXG4gICAgaWYgKFByb2JsZW1SZXBvcnRlci5pbnN0YW5jZXNbYmFzZVVybF0pXG4gICAgICAgIHJldHVybjtcblxuICAgIG5ldyBQcm9ibGVtUmVwb3J0ZXIoYmFzZVVybCwgdmVyc2lvbiwgZ2V0Q2xpZW50KTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUHJvYmxlbVJlcG9ydGVyOyIsImFzc2VydCA9IGNoYWkuYXNzZXJ0XG5cbmNsYXNzIFVJRHJpdmVyXG4gIGNvbnN0cnVjdG9yOiAoZWwpIC0+XG4gICAgQGVsID0gJChlbClcblxuICBnZXREaXNhYmxlZDogKHN0cikgLT5cbiAgICBmb3IgaXRlbSBpbiBAZWwuZmluZChcImEsYnV0dG9uXCIpXG4gICAgICBpZiAkKGl0ZW0pLnRleHQoKS5pbmRleE9mKHN0cikgIT0gLTFcbiAgICAgICAgcmV0dXJuICQoaXRlbSkuaXMoXCI6ZGlzYWJsZWRcIilcbiAgICBhc3NlcnQuZmFpbChudWxsLCBzdHIsIFwiQ2FuJ3QgZmluZDogXCIgKyBzdHIpXG5cbiAgY2xpY2s6IChzdHIpIC0+XG4gICAgZm9yIGl0ZW0gaW4gQGVsLmZpbmQoXCJhLGJ1dHRvblwiKVxuICAgICAgaWYgJChpdGVtKS50ZXh0KCkuaW5kZXhPZihzdHIpICE9IC0xXG4gICAgICAgIGNvbnNvbGUubG9nIFwiQ2xpY2tpbmc6IFwiICsgJChpdGVtKS50ZXh0KClcbiAgICAgICAgJChpdGVtKS50cmlnZ2VyKFwiY2xpY2tcIilcbiAgICAgICAgcmV0dXJuXG4gICAgYXNzZXJ0LmZhaWwobnVsbCwgc3RyLCBcIkNhbid0IGZpbmQ6IFwiICsgc3RyKVxuICBcbiAgZmlsbDogKHN0ciwgdmFsdWUpIC0+XG4gICAgZm9yIGl0ZW0gaW4gQGVsLmZpbmQoXCJsYWJlbFwiKVxuICAgICAgaWYgJChpdGVtKS50ZXh0KCkuaW5kZXhPZihzdHIpICE9IC0xXG4gICAgICAgIGJveCA9IEBlbC5maW5kKFwiI1wiKyQoaXRlbSkuYXR0cignZm9yJykpXG4gICAgICAgIGJveC52YWwodmFsdWUpXG4gIFxuICB0ZXh0OiAtPlxuICAgIHJldHVybiBAZWwudGV4dCgpXG4gICAgICBcbiAgd2FpdDogKGFmdGVyKSAtPlxuICAgIHNldFRpbWVvdXQgYWZ0ZXIsIDEwXG5cbm1vZHVsZS5leHBvcnRzID0gVUlEcml2ZXIiLCJcbiMgVHJhY2tzIGEgc2V0IG9mIGl0ZW1zIGJ5IGlkLCBpbmRpY2F0aW5nIHdoaWNoIGhhdmUgYmVlbiBhZGRlZCBvciByZW1vdmVkLlxuIyBDaGFuZ2VzIGFyZSBib3RoIGFkZCBhbmQgcmVtb3ZlXG5jbGFzcyBJdGVtVHJhY2tlclxuICBjb25zdHJ1Y3RvcjogLT5cbiAgICBAa2V5ID0gJ19pZCdcbiAgICBAaXRlbXMgPSB7fVxuXG4gIHVwZGF0ZTogKGl0ZW1zKSAtPiAgICAjIFJldHVybiBbW2FkZGVkXSxbcmVtb3ZlZF1dIGl0ZW1zXG4gICAgYWRkcyA9IFtdXG4gICAgcmVtb3ZlcyA9IFtdXG5cbiAgICAjIEFkZCBhbnkgbmV3IG9uZXNcbiAgICBmb3IgaXRlbSBpbiBpdGVtc1xuICAgICAgaWYgbm90IF8uaGFzKEBpdGVtcywgaXRlbVtAa2V5XSlcbiAgICAgICAgYWRkcy5wdXNoKGl0ZW0pXG5cbiAgICAjIENyZWF0ZSBtYXAgb2YgaXRlbXMgcGFyYW1ldGVyXG4gICAgbWFwID0gXy5vYmplY3QoXy5wbHVjayhpdGVtcywgQGtleSksIGl0ZW1zKVxuXG4gICAgIyBGaW5kIHJlbW92ZXNcbiAgICBmb3Iga2V5LCB2YWx1ZSBvZiBAaXRlbXNcbiAgICAgIGlmIG5vdCBfLmhhcyhtYXAsIGtleSlcbiAgICAgICAgcmVtb3Zlcy5wdXNoKHZhbHVlKVxuICAgICAgZWxzZSBpZiBub3QgXy5pc0VxdWFsKHZhbHVlLCBtYXBba2V5XSlcbiAgICAgICAgYWRkcy5wdXNoKG1hcFtrZXldKVxuICAgICAgICByZW1vdmVzLnB1c2godmFsdWUpXG5cbiAgICBmb3IgaXRlbSBpbiByZW1vdmVzXG4gICAgICBkZWxldGUgQGl0ZW1zW2l0ZW1bQGtleV1dXG5cbiAgICBmb3IgaXRlbSBpbiBhZGRzXG4gICAgICBAaXRlbXNbaXRlbVtAa2V5XV0gPSBpdGVtXG5cbiAgICByZXR1cm4gW2FkZHMsIHJlbW92ZXNdXG5cbm1vZHVsZS5leHBvcnRzID0gSXRlbVRyYWNrZXIiLCIjIEdlb0pTT04gaGVscGVyIHJvdXRpbmVzXG5cbiMgQ29udmVydHMgbmF2aWdhdG9yIHBvc2l0aW9uIHRvIHBvaW50XG5leHBvcnRzLnBvc1RvUG9pbnQgPSAocG9zKSAtPlxuICByZXR1cm4ge1xuICAgIHR5cGU6ICdQb2ludCdcbiAgICBjb29yZGluYXRlczogW3Bvcy5jb29yZHMubG9uZ2l0dWRlLCBwb3MuY29vcmRzLmxhdGl0dWRlXVxuICB9XG5cblxuZXhwb3J0cy5sYXRMbmdCb3VuZHNUb0dlb0pTT04gPSAoYm91bmRzKSAtPlxuICBzdyA9IGJvdW5kcy5nZXRTb3V0aFdlc3QoKVxuICBuZSA9IGJvdW5kcy5nZXROb3J0aEVhc3QoKVxuICByZXR1cm4ge1xuICAgIHR5cGU6ICdQb2x5Z29uJyxcbiAgICBjb29yZGluYXRlczogW1xuICAgICAgW1tzdy5sbmcsIHN3LmxhdF0sIFxuICAgICAgW3N3LmxuZywgbmUubGF0XSwgXG4gICAgICBbbmUubG5nLCBuZS5sYXRdLCBcbiAgICAgIFtuZS5sbmcsIHN3LmxhdF0sXG4gICAgICBbc3cubG5nLCBzdy5sYXRdXVxuICAgIF1cbiAgfVxuXG4jIFRPRE86IG9ubHkgd29ya3Mgd2l0aCBib3VuZHNcbmV4cG9ydHMucG9pbnRJblBvbHlnb24gPSAocG9pbnQsIHBvbHlnb24pIC0+XG4gICMgQ2hlY2sgdGhhdCBmaXJzdCA9PSBsYXN0XG4gIGlmIG5vdCBfLmlzRXF1YWwoXy5maXJzdChwb2x5Z29uLmNvb3JkaW5hdGVzWzBdKSwgXy5sYXN0KHBvbHlnb24uY29vcmRpbmF0ZXNbMF0pKVxuICAgIHRocm93IG5ldyBFcnJvcihcIkZpcnN0IG11c3QgZXF1YWwgbGFzdFwiKVxuXG4gICMgR2V0IGJvdW5kc1xuICBib3VuZHMgPSBuZXcgTC5MYXRMbmdCb3VuZHMoXy5tYXAocG9seWdvbi5jb29yZGluYXRlc1swXSwgKGNvb3JkKSAtPiBuZXcgTC5MYXRMbmcoY29vcmRbMV0sIGNvb3JkWzBdKSkpXG4gIHJldHVybiBib3VuZHMuY29udGFpbnMobmV3IEwuTGF0TG5nKHBvaW50LmNvb3JkaW5hdGVzWzFdLCBwb2ludC5jb29yZGluYXRlc1swXSkpXG5cbmV4cG9ydHMuZ2V0UmVsYXRpdmVMb2NhdGlvbiA9IChmcm9tLCB0bykgLT5cbiAgeDEgPSBmcm9tLmNvb3JkaW5hdGVzWzBdXG4gIHkxID0gZnJvbS5jb29yZGluYXRlc1sxXVxuICB4MiA9IHRvLmNvb3JkaW5hdGVzWzBdXG4gIHkyID0gdG8uY29vcmRpbmF0ZXNbMV1cbiAgXG4gICMgQ29udmVydCB0byByZWxhdGl2ZSBwb3NpdGlvbiAoYXBwcm94aW1hdGUpXG4gIGR5ID0gKHkyIC0geTEpIC8gNTcuMyAqIDYzNzEwMDBcbiAgZHggPSBNYXRoLmNvcyh5MSAvIDU3LjMpICogKHgyIC0geDEpIC8gNTcuMyAqIDYzNzEwMDBcbiAgXG4gICMgRGV0ZXJtaW5lIGRpcmVjdGlvbiBhbmQgYW5nbGVcbiAgZGlzdCA9IE1hdGguc3FydChkeCAqIGR4ICsgZHkgKiBkeSlcbiAgYW5nbGUgPSA5MCAtIChNYXRoLmF0YW4yKGR5LCBkeCkgKiA1Ny4zKVxuICBhbmdsZSArPSAzNjAgaWYgYW5nbGUgPCAwXG4gIGFuZ2xlIC09IDM2MCBpZiBhbmdsZSA+IDM2MFxuICBcbiAgIyBHZXQgYXBwcm94aW1hdGUgZGlyZWN0aW9uXG4gIGNvbXBhc3NEaXIgPSAoTWF0aC5mbG9vcigoYW5nbGUgKyAyMi41KSAvIDQ1KSkgJSA4XG4gIGNvbXBhc3NTdHJzID0gW1wiTlwiLCBcIk5FXCIsIFwiRVwiLCBcIlNFXCIsIFwiU1wiLCBcIlNXXCIsIFwiV1wiLCBcIk5XXCJdXG4gIGlmIGRpc3QgPiAxMDAwXG4gICAgKGRpc3QgLyAxMDAwKS50b0ZpeGVkKDEpICsgXCJrbSBcIiArIGNvbXBhc3NTdHJzW2NvbXBhc3NEaXJdXG4gIGVsc2VcbiAgICAoZGlzdCkudG9GaXhlZCgwKSArIFwibSBcIiArIGNvbXBhc3NTdHJzW2NvbXBhc3NEaXJdIiwiXG5cbmV4cG9ydHMuQWxsQXV0aCA9IGNsYXNzIEFsbEF1dGhcbiAgaW5zZXJ0OiAoY29sKSAtPlxuICAgIHJldHVybiB0cnVlXG5cbiAgdXBkYXRlOiAoY29sLCBkb2MpIC0+XG4gICAgcmV0dXJuIHRydWVcblxuICByZW1vdmU6IChjb2wsIGRvYykgLT5cbiAgICByZXR1cm4gdHJ1ZVxuICAgIFxuZXhwb3J0cy5Ob25lQXV0aCA9IGNsYXNzIE5vbmVBdXRoXG4gIGluc2VydDogKGNvbCkgLT5cbiAgICByZXR1cm4gZmFsc2VcblxuICB1cGRhdGU6IChjb2wsIGRvYykgLT5cbiAgICByZXR1cm4gZmFsc2VcblxuICByZW1vdmU6IChjb2wsIGRvYykgLT5cbiAgICByZXR1cm4gZmFsc2VcblxuZXhwb3J0cy5Vc2VyQXV0aCA9IGNsYXNzIFVzZXJBdXRoXG4gICMgdXNlciBpcyB1c2VybmFtZSwgb3JnIGlzIG9yZyBjb2RlXG4gIGNvbnN0cnVjdG9yOiAodXNlciwgb3JnKSAtPlxuICAgIEB1c2VyID0gdXNlclxuICAgIEBvcmcgPSBvcmdcblxuICAgIEBlZGl0YWJsZUNvbHMgPSBbJ3NvdXJjZXMnLCAnc291cmNlX25vdGVzJywgJ3Rlc3RzJywgJ3Jlc3BvbnNlcyddXG5cbiAgaW5zZXJ0OiAoY29sKSAtPlxuICAgIGlmIG5vdCAoY29sIGluIEBlZGl0YWJsZUNvbHMpXG4gICAgICByZXR1cm4gZmFsc2VcbiAgICByZXR1cm4gdHJ1ZVxuXG4gIHVwZGF0ZTogKGNvbCwgZG9jKSAtPlxuICAgIGlmIG5vdCAoY29sIGluIEBlZGl0YWJsZUNvbHMpXG4gICAgICByZXR1cm4gZmFsc2VcblxuICAgIGlmIGRvYy5vcmcgYW5kIEBvcmdcbiAgICAgIHJldHVybiBkb2MudXNlciA9PSBAdXNlciB8fCBkb2Mub3JnID09IEBvcmdcbiAgICBlbHNlXG4gICAgICByZXR1cm4gZG9jLnVzZXIgPT0gQHVzZXJcblxuICByZW1vdmU6IChjb2wsIGRvYykgLT5cbiAgICBpZiBub3QgKGNvbCBpbiBAZWRpdGFibGVDb2xzKVxuICAgICAgcmV0dXJuIGZhbHNlXG5cbiAgICBpZiBkb2Mub3JnIGFuZCBAb3JnXG4gICAgICByZXR1cm4gZG9jLnVzZXIgPT0gQHVzZXIgfHwgZG9jLm9yZyA9PSBAb3JnXG4gICAgZWxzZVxuICAgICAgcmV0dXJuIGRvYy51c2VyID09IEB1c2VyXG5cblxuICAgICIsIm1vZHVsZS5leHBvcnRzID0gY2xhc3MgUmVtb3RlRGJcbiAgIyBVcmwgbXVzdCBoYXZlIHRyYWlsaW5nIC9cbiAgY29uc3RydWN0b3I6ICh1cmwsIGNsaWVudCkgLT5cbiAgICBAdXJsID0gdXJsXG4gICAgQGNsaWVudCA9IGNsaWVudFxuICAgIEBjb2xsZWN0aW9ucyA9IHt9XG5cbiAgYWRkQ29sbGVjdGlvbjogKG5hbWUpIC0+XG4gICAgY29sbGVjdGlvbiA9IG5ldyBDb2xsZWN0aW9uKG5hbWUsIEB1cmwgKyBuYW1lLCBAY2xpZW50KVxuICAgIEBbbmFtZV0gPSBjb2xsZWN0aW9uXG4gICAgQGNvbGxlY3Rpb25zW25hbWVdID0gY29sbGVjdGlvblxuXG4gIHJlbW92ZUNvbGxlY3Rpb246IChuYW1lKSAtPlxuICAgIGRlbGV0ZSBAW25hbWVdXG4gICAgZGVsZXRlIEBjb2xsZWN0aW9uc1tuYW1lXVxuXG4jIFJlbW90ZSBjb2xsZWN0aW9uIG9uIHNlcnZlclxuY2xhc3MgQ29sbGVjdGlvblxuICBjb25zdHJ1Y3RvcjogKG5hbWUsIHVybCwgY2xpZW50KSAtPlxuICAgIEBuYW1lID0gbmFtZVxuICAgIEB1cmwgPSB1cmxcbiAgICBAY2xpZW50ID0gY2xpZW50XG5cbiAgZmluZDogKHNlbGVjdG9yLCBvcHRpb25zID0ge30pIC0+XG4gICAgcmV0dXJuIGZldGNoOiAoc3VjY2VzcywgZXJyb3IpID0+XG4gICAgICAjIENyZWF0ZSB1cmxcbiAgICAgIHBhcmFtcyA9IHt9XG4gICAgICBpZiBvcHRpb25zLnNvcnRcbiAgICAgICAgcGFyYW1zLnNvcnQgPSBKU09OLnN0cmluZ2lmeShvcHRpb25zLnNvcnQpXG4gICAgICBpZiBvcHRpb25zLmxpbWl0XG4gICAgICAgIHBhcmFtcy5saW1pdCA9IG9wdGlvbnMubGltaXRcbiAgICAgIGlmIG9wdGlvbnMuZmllbGRzXG4gICAgICAgIHBhcmFtcy5maWVsZHMgPSBKU09OLnN0cmluZ2lmeShvcHRpb25zLmZpZWxkcylcbiAgICAgIHBhcmFtcy5jbGllbnQgPSBAY2xpZW50XG4gICAgICBwYXJhbXMuc2VsZWN0b3IgPSBKU09OLnN0cmluZ2lmeShzZWxlY3RvciB8fCB7fSlcblxuICAgICAgcmVxID0gJC5nZXRKU09OKEB1cmwsIHBhcmFtcylcbiAgICAgIHJlcS5kb25lIChkYXRhLCB0ZXh0U3RhdHVzLCBqcVhIUikgPT5cbiAgICAgICAgc3VjY2VzcyhkYXRhKVxuICAgICAgcmVxLmZhaWwgKGpxWEhSLCB0ZXh0U3RhdHVzLCBlcnJvclRocm93bikgPT5cbiAgICAgICAgaWYgZXJyb3JcbiAgICAgICAgICBlcnJvcihlcnJvclRocm93bilcblxuICBmaW5kT25lOiAoc2VsZWN0b3IsIG9wdGlvbnMgPSB7fSwgc3VjY2VzcywgZXJyb3IpIC0+XG4gICAgaWYgXy5pc0Z1bmN0aW9uKG9wdGlvbnMpIFxuICAgICAgW29wdGlvbnMsIHN1Y2Nlc3MsIGVycm9yXSA9IFt7fSwgb3B0aW9ucywgc3VjY2Vzc11cblxuICAgICMgQ3JlYXRlIHVybFxuICAgIHBhcmFtcyA9IHt9XG4gICAgaWYgb3B0aW9ucy5zb3J0XG4gICAgICBwYXJhbXMuc29ydCA9IEpTT04uc3RyaW5naWZ5KG9wdGlvbnMuc29ydClcbiAgICBwYXJhbXMubGltaXQgPSAxXG4gICAgcGFyYW1zLmNsaWVudCA9IEBjbGllbnRcbiAgICBwYXJhbXMuc2VsZWN0b3IgPSBKU09OLnN0cmluZ2lmeShzZWxlY3RvciB8fCB7fSlcblxuICAgIHJlcSA9ICQuZ2V0SlNPTihAdXJsLCBwYXJhbXMpXG4gICAgcmVxLmRvbmUgKGRhdGEsIHRleHRTdGF0dXMsIGpxWEhSKSA9PlxuICAgICAgc3VjY2VzcyhkYXRhWzBdIHx8IG51bGwpXG4gICAgcmVxLmZhaWwgKGpxWEhSLCB0ZXh0U3RhdHVzLCBlcnJvclRocm93bikgPT5cbiAgICAgIGlmIGVycm9yXG4gICAgICAgIGVycm9yKGVycm9yVGhyb3duKVxuXG4gIHVwc2VydDogKGRvYywgc3VjY2VzcywgZXJyb3IpIC0+XG4gICAgaWYgbm90IGRvYy5faWRcbiAgICAgIGRvYy5faWQgPSBjcmVhdGVVaWQoKVxuXG4gICAgcmVxID0gJC5hamF4KEB1cmwgKyBcIj9jbGllbnQ9XCIgKyBAY2xpZW50LCB7XG4gICAgICBkYXRhIDogSlNPTi5zdHJpbmdpZnkoZG9jKSxcbiAgICAgIGNvbnRlbnRUeXBlIDogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgdHlwZSA6ICdQT1NUJ30pXG4gICAgcmVxLmRvbmUgKGRhdGEsIHRleHRTdGF0dXMsIGpxWEhSKSA9PlxuICAgICAgc3VjY2VzcyhkYXRhIHx8IG51bGwpXG4gICAgcmVxLmZhaWwgKGpxWEhSLCB0ZXh0U3RhdHVzLCBlcnJvclRocm93bikgPT5cbiAgICAgIGlmIGVycm9yXG4gICAgICAgIGVycm9yKGVycm9yVGhyb3duKVxuXG4gIHJlbW92ZTogKGlkLCBzdWNjZXNzLCBlcnJvcikgLT5cbiAgICByZXEgPSAkLmFqYXgoQHVybCArIFwiL1wiICsgaWQgKyBcIj9jbGllbnQ9XCIgKyBAY2xpZW50LCB7IHR5cGUgOiAnREVMRVRFJ30pXG4gICAgcmVxLmRvbmUgKGRhdGEsIHRleHRTdGF0dXMsIGpxWEhSKSA9PlxuICAgICAgc3VjY2VzcygpXG4gICAgcmVxLmZhaWwgKGpxWEhSLCB0ZXh0U3RhdHVzLCBlcnJvclRocm93bikgPT5cbiAgICAgIGlmIGpxWEhSLnN0YXR1cyA9PSA0MDRcbiAgICAgICAgc3VjY2VzcygpXG4gICAgICBlbHNlIGlmIGVycm9yXG4gICAgICAgIGVycm9yKGVycm9yVGhyb3duKVxuXG5cbmNyZWF0ZVVpZCA9IC0+IFxuICAneHh4eHh4eHh4eHh4NHh4eHl4eHh4eHh4eHh4eHh4eHgnLnJlcGxhY2UoL1t4eV0vZywgKGMpIC0+XG4gICAgciA9IE1hdGgucmFuZG9tKCkqMTZ8MFxuICAgIHYgPSBpZiBjID09ICd4JyB0aGVuIHIgZWxzZSAociYweDN8MHg4KVxuICAgIHJldHVybiB2LnRvU3RyaW5nKDE2KVxuICAgKSIsIkxvY2F0aW9uRmluZGVyID0gcmVxdWlyZSAnLi9Mb2NhdGlvbkZpbmRlcidcbkdlb0pTT04gPSByZXF1aXJlICcuL0dlb0pTT04nXG5cbiMgU2hvd3MgdGhlIHJlbGF0aXZlIGxvY2F0aW9uIG9mIGEgcG9pbnQgYW5kIGFsbG93cyBzZXR0aW5nIGl0XG4jIEZpcmVzIGV2ZW50cyBsb2NhdGlvbnNldCwgbWFwLCBib3RoIHdpdGggXG5jbGFzcyBMb2NhdGlvblZpZXcgZXh0ZW5kcyBCYWNrYm9uZS5WaWV3XG4gIGNvbnN0cnVjdG9yOiAob3B0aW9ucykgLT5cbiAgICBzdXBlcigpXG4gICAgQGxvYyA9IG9wdGlvbnMubG9jXG4gICAgQHNldHRpbmdMb2NhdGlvbiA9IGZhbHNlXG4gICAgQGxvY2F0aW9uRmluZGVyID0gb3B0aW9ucy5sb2NhdGlvbkZpbmRlciB8fCBuZXcgTG9jYXRpb25GaW5kZXIoKVxuXG4gICAgIyBMaXN0ZW4gdG8gbG9jYXRpb24gZXZlbnRzXG4gICAgQGxpc3RlblRvKEBsb2NhdGlvbkZpbmRlciwgJ2ZvdW5kJywgQGxvY2F0aW9uRm91bmQpXG4gICAgQGxpc3RlblRvKEBsb2NhdGlvbkZpbmRlciwgJ2Vycm9yJywgQGxvY2F0aW9uRXJyb3IpXG5cbiAgICAjIFN0YXJ0IHRyYWNraW5nIGxvY2F0aW9uIGlmIHNldFxuICAgIGlmIEBsb2NcbiAgICAgIEBsb2NhdGlvbkZpbmRlci5zdGFydFdhdGNoKClcblxuICAgIEByZW5kZXIoKVxuXG4gIGV2ZW50czpcbiAgICAnY2xpY2sgI2xvY2F0aW9uX21hcCcgOiAnbWFwQ2xpY2tlZCdcbiAgICAnY2xpY2sgI2xvY2F0aW9uX3NldCcgOiAnc2V0TG9jYXRpb24nXG5cbiAgcmVtb3ZlOiAtPlxuICAgIEBsb2NhdGlvbkZpbmRlci5zdG9wV2F0Y2goKVxuICAgIHN1cGVyKClcblxuICByZW5kZXI6IC0+XG4gICAgQCRlbC5odG1sIHRlbXBsYXRlc1snTG9jYXRpb25WaWV3J10oKVxuXG4gICAgIyBTZXQgbG9jYXRpb24gc3RyaW5nXG4gICAgaWYgQGVycm9yRmluZGluZ0xvY2F0aW9uXG4gICAgICBAJChcIiNsb2NhdGlvbl9yZWxhdGl2ZVwiKS50ZXh0KFwiQ2Fubm90IGZpbmQgbG9jYXRpb25cIilcbiAgICBlbHNlIGlmIG5vdCBAbG9jIGFuZCBub3QgQHNldHRpbmdMb2NhdGlvbiBcbiAgICAgIEAkKFwiI2xvY2F0aW9uX3JlbGF0aXZlXCIpLnRleHQoXCJVbnNwZWNpZmllZCBsb2NhdGlvblwiKVxuICAgIGVsc2UgaWYgQHNldHRpbmdMb2NhdGlvblxuICAgICAgQCQoXCIjbG9jYXRpb25fcmVsYXRpdmVcIikudGV4dChcIlNldHRpbmcgbG9jYXRpb24uLi5cIilcbiAgICBlbHNlIGlmIG5vdCBAY3VycmVudExvY1xuICAgICAgQCQoXCIjbG9jYXRpb25fcmVsYXRpdmVcIikudGV4dChcIldhaXRpbmcgZm9yIEdQUy4uLlwiKVxuICAgIGVsc2VcbiAgICAgIEAkKFwiI2xvY2F0aW9uX3JlbGF0aXZlXCIpLnRleHQoR2VvSlNPTi5nZXRSZWxhdGl2ZUxvY2F0aW9uKEBjdXJyZW50TG9jLCBAbG9jKSlcblxuICAgICMgRGlzYWJsZSBtYXAgaWYgbG9jYXRpb24gbm90IHNldFxuICAgIEAkKFwiI2xvY2F0aW9uX21hcFwiKS5hdHRyKFwiZGlzYWJsZWRcIiwgbm90IEBsb2MpO1xuXG4gICAgIyBEaXNhYmxlIHNldCBpZiBzZXR0aW5nXG4gICAgQCQoXCIjbG9jYXRpb25fc2V0XCIpLmF0dHIoXCJkaXNhYmxlZFwiLCBAc2V0dGluZ0xvY2F0aW9uID09IHRydWUpOyAgICBcblxuICBzZXRMb2NhdGlvbjogLT5cbiAgICBAc2V0dGluZ0xvY2F0aW9uID0gdHJ1ZVxuICAgIEBlcnJvckZpbmRpbmdMb2NhdGlvbiA9IGZhbHNlXG4gICAgQGxvY2F0aW9uRmluZGVyLnN0YXJ0V2F0Y2goKVxuICAgIEByZW5kZXIoKVxuXG4gIGxvY2F0aW9uRm91bmQ6IChwb3MpID0+XG4gICAgaWYgQHNldHRpbmdMb2NhdGlvblxuICAgICAgQHNldHRpbmdMb2NhdGlvbiA9IGZhbHNlXG4gICAgICBAZXJyb3JGaW5kaW5nTG9jYXRpb24gPSBmYWxzZVxuXG4gICAgICAjIFNldCBsb2NhdGlvblxuICAgICAgQGxvYyA9IEdlb0pTT04ucG9zVG9Qb2ludChwb3MpXG4gICAgICBAdHJpZ2dlcignbG9jYXRpb25zZXQnLCBAbG9jKVxuXG4gICAgQGN1cnJlbnRMb2MgPSBHZW9KU09OLnBvc1RvUG9pbnQocG9zKVxuICAgIEByZW5kZXIoKVxuXG4gIGxvY2F0aW9uRXJyb3I6ID0+XG4gICAgQHNldHRpbmdMb2NhdGlvbiA9IGZhbHNlXG4gICAgQGVycm9yRmluZGluZ0xvY2F0aW9uID0gdHJ1ZVxuICAgIEByZW5kZXIoKVxuXG4gIG1hcENsaWNrZWQ6ID0+XG4gICAgQHRyaWdnZXIoJ21hcCcsIEBsb2MpXG5cblxubW9kdWxlLmV4cG9ydHMgPSBMb2NhdGlvblZpZXciLCJjcmVhdGVVaWQgPSByZXF1aXJlKCcuL3V0aWxzJykuY3JlYXRlVWlkXG5wcm9jZXNzRmluZCA9IHJlcXVpcmUoJy4vdXRpbHMnKS5wcm9jZXNzRmluZFxuY29tcGlsZVNvcnQgPSByZXF1aXJlKCcuL3NlbGVjdG9yJykuY29tcGlsZVNvcnRcblxuY2xhc3MgTG9jYWxEYlxuICBjb25zdHJ1Y3RvcjogKG5hbWUsIG9wdGlvbnMpIC0+XG4gICAgQG5hbWUgPSBuYW1lXG4gICAgQGNvbGxlY3Rpb25zID0ge31cblxuICAgIGlmIG9wdGlvbnMgYW5kIG9wdGlvbnMubmFtZXNwYWNlIGFuZCB3aW5kb3cubG9jYWxTdG9yYWdlXG4gICAgICBAbmFtZXNwYWNlID0gb3B0aW9ucy5uYW1lc3BhY2VcblxuICBhZGRDb2xsZWN0aW9uOiAobmFtZSkgLT5cbiAgICAjIFNldCBuYW1lc3BhY2UgZm9yIGNvbGxlY3Rpb25cbiAgICBuYW1lc3BhY2UgPSBAbmFtZXNwYWNlK1wiLlwiK25hbWUgaWYgQG5hbWVzcGFjZVxuXG4gICAgY29sbGVjdGlvbiA9IG5ldyBDb2xsZWN0aW9uKG5hbWUsIG5hbWVzcGFjZSlcbiAgICBAW25hbWVdID0gY29sbGVjdGlvblxuICAgIEBjb2xsZWN0aW9uc1tuYW1lXSA9IGNvbGxlY3Rpb25cblxuICByZW1vdmVDb2xsZWN0aW9uOiAobmFtZSkgLT5cbiAgICBpZiBAbmFtZXNwYWNlIGFuZCB3aW5kb3cubG9jYWxTdG9yYWdlXG4gICAgICBrZXlzID0gW11cbiAgICAgIGZvciBpIGluIFswLi4ubG9jYWxTdG9yYWdlLmxlbmd0aF1cbiAgICAgICAga2V5cy5wdXNoKGxvY2FsU3RvcmFnZS5rZXkoaSkpXG5cbiAgICAgIGZvciBrZXkgaW4ga2V5c1xuICAgICAgICBpZiBrZXkuc3Vic3RyaW5nKDAsIEBuYW1lc3BhY2UubGVuZ3RoICsgMSkgPT0gQG5hbWVzcGFjZSArIFwiLlwiXG4gICAgICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oa2V5KVxuXG4gICAgZGVsZXRlIEBbbmFtZV1cbiAgICBkZWxldGUgQGNvbGxlY3Rpb25zW25hbWVdXG5cblxuIyBTdG9yZXMgZGF0YSBpbiBtZW1vcnksIG9wdGlvbmFsbHkgYmFja2VkIGJ5IGxvY2FsIHN0b3JhZ2VcbmNsYXNzIENvbGxlY3Rpb25cbiAgY29uc3RydWN0b3I6IChuYW1lLCBuYW1lc3BhY2UpIC0+XG4gICAgQG5hbWUgPSBuYW1lXG4gICAgQG5hbWVzcGFjZSA9IG5hbWVzcGFjZVxuXG4gICAgQGl0ZW1zID0ge31cbiAgICBAdXBzZXJ0cyA9IHt9ICAjIFBlbmRpbmcgdXBzZXJ0cyBieSBfaWQuIFN0aWxsIGluIGl0ZW1zXG4gICAgQHJlbW92ZXMgPSB7fSAgIyBQZW5kaW5nIHJlbW92ZXMgYnkgX2lkLiBObyBsb25nZXIgaW4gaXRlbXNcblxuICAgICMgUmVhZCBmcm9tIGxvY2FsIHN0b3JhZ2VcbiAgICBpZiB3aW5kb3cubG9jYWxTdG9yYWdlIGFuZCBuYW1lc3BhY2U/XG4gICAgICBAbG9hZFN0b3JhZ2UoKVxuXG4gIGxvYWRTdG9yYWdlOiAtPlxuICAgICMgUmVhZCBpdGVtcyBmcm9tIGxvY2FsU3RvcmFnZVxuICAgIEBpdGVtTmFtZXNwYWNlID0gQG5hbWVzcGFjZSArIFwiX1wiXG5cbiAgICBmb3IgaSBpbiBbMC4uLmxvY2FsU3RvcmFnZS5sZW5ndGhdXG4gICAgICBrZXkgPSBsb2NhbFN0b3JhZ2Uua2V5KGkpXG4gICAgICBpZiBrZXkuc3Vic3RyaW5nKDAsIEBpdGVtTmFtZXNwYWNlLmxlbmd0aCkgPT0gQGl0ZW1OYW1lc3BhY2VcbiAgICAgICAgaXRlbSA9IEpTT04ucGFyc2UobG9jYWxTdG9yYWdlW2tleV0pXG4gICAgICAgIEBpdGVtc1tpdGVtLl9pZF0gPSBpdGVtXG5cbiAgICAjIFJlYWQgdXBzZXJ0c1xuICAgIHVwc2VydEtleXMgPSBpZiBsb2NhbFN0b3JhZ2VbQG5hbWVzcGFjZStcInVwc2VydHNcIl0gdGhlbiBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZVtAbmFtZXNwYWNlK1widXBzZXJ0c1wiXSkgZWxzZSBbXVxuICAgIGZvciBrZXkgaW4gdXBzZXJ0S2V5c1xuICAgICAgQHVwc2VydHNba2V5XSA9IEBpdGVtc1trZXldXG5cbiAgICAjIFJlYWQgcmVtb3Zlc1xuICAgIHJlbW92ZUl0ZW1zID0gaWYgbG9jYWxTdG9yYWdlW0BuYW1lc3BhY2UrXCJyZW1vdmVzXCJdIHRoZW4gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2VbQG5hbWVzcGFjZStcInJlbW92ZXNcIl0pIGVsc2UgW11cbiAgICBAcmVtb3ZlcyA9IF8ub2JqZWN0KF8ucGx1Y2socmVtb3ZlSXRlbXMsIFwiX2lkXCIpLCByZW1vdmVJdGVtcylcblxuICBmaW5kOiAoc2VsZWN0b3IsIG9wdGlvbnMpIC0+XG4gICAgcmV0dXJuIGZldGNoOiAoc3VjY2VzcywgZXJyb3IpID0+XG4gICAgICBAX2ZpbmRGZXRjaChzZWxlY3Rvciwgb3B0aW9ucywgc3VjY2VzcywgZXJyb3IpXG5cbiAgZmluZE9uZTogKHNlbGVjdG9yLCBvcHRpb25zLCBzdWNjZXNzLCBlcnJvcikgLT5cbiAgICBpZiBfLmlzRnVuY3Rpb24ob3B0aW9ucykgXG4gICAgICBbb3B0aW9ucywgc3VjY2VzcywgZXJyb3JdID0gW3t9LCBvcHRpb25zLCBzdWNjZXNzXVxuXG4gICAgQGZpbmQoc2VsZWN0b3IsIG9wdGlvbnMpLmZldGNoIChyZXN1bHRzKSAtPlxuICAgICAgaWYgc3VjY2Vzcz8gdGhlbiBzdWNjZXNzKGlmIHJlc3VsdHMubGVuZ3RoPjAgdGhlbiByZXN1bHRzWzBdIGVsc2UgbnVsbClcbiAgICAsIGVycm9yXG5cbiAgX2ZpbmRGZXRjaDogKHNlbGVjdG9yLCBvcHRpb25zLCBzdWNjZXNzLCBlcnJvcikgLT5cbiAgICBpZiBzdWNjZXNzPyB0aGVuIHN1Y2Nlc3MocHJvY2Vzc0ZpbmQoQGl0ZW1zLCBzZWxlY3Rvciwgb3B0aW9ucykpXG5cbiAgdXBzZXJ0OiAoZG9jLCBzdWNjZXNzLCBlcnJvcikgLT5cbiAgICBpZiBub3QgZG9jLl9pZFxuICAgICAgZG9jLl9pZCA9IGNyZWF0ZVVpZCgpXG5cbiAgICAjIFJlcGxhY2UvYWRkIFxuICAgIEBfcHV0SXRlbShkb2MpXG4gICAgQF9wdXRVcHNlcnQoZG9jKVxuXG4gICAgaWYgc3VjY2Vzcz8gdGhlbiBzdWNjZXNzKGRvYylcblxuICByZW1vdmU6IChpZCwgc3VjY2VzcywgZXJyb3IpIC0+XG4gICAgaWYgXy5oYXMoQGl0ZW1zLCBpZClcbiAgICAgIEBfcHV0UmVtb3ZlKEBpdGVtc1tpZF0pXG4gICAgICBAX2RlbGV0ZUl0ZW0oaWQpXG4gICAgICBAX2RlbGV0ZVVwc2VydChpZClcblxuICAgIGlmIHN1Y2Nlc3M/IHRoZW4gc3VjY2VzcygpXG5cbiAgX3B1dEl0ZW06IChkb2MpIC0+XG4gICAgQGl0ZW1zW2RvYy5faWRdID0gZG9jXG4gICAgaWYgQG5hbWVzcGFjZVxuICAgICAgbG9jYWxTdG9yYWdlW0BpdGVtTmFtZXNwYWNlICsgZG9jLl9pZF0gPSBKU09OLnN0cmluZ2lmeShkb2MpXG5cbiAgX2RlbGV0ZUl0ZW06IChpZCkgLT5cbiAgICBkZWxldGUgQGl0ZW1zW2lkXVxuICAgIGlmIEBuYW1lc3BhY2VcbiAgICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKEBpdGVtTmFtZXNwYWNlICsgaWQpXG5cbiAgX3B1dFVwc2VydDogKGRvYykgLT5cbiAgICBAdXBzZXJ0c1tkb2MuX2lkXSA9IGRvY1xuICAgIGlmIEBuYW1lc3BhY2VcbiAgICAgIGxvY2FsU3RvcmFnZVtAbmFtZXNwYWNlK1widXBzZXJ0c1wiXSA9IEpTT04uc3RyaW5naWZ5KF8ua2V5cyhAdXBzZXJ0cykpXG5cbiAgX2RlbGV0ZVVwc2VydDogKGlkKSAtPlxuICAgIGRlbGV0ZSBAdXBzZXJ0c1tpZF1cbiAgICBpZiBAbmFtZXNwYWNlXG4gICAgICBsb2NhbFN0b3JhZ2VbQG5hbWVzcGFjZStcInVwc2VydHNcIl0gPSBKU09OLnN0cmluZ2lmeShfLmtleXMoQHVwc2VydHMpKVxuXG4gIF9wdXRSZW1vdmU6IChkb2MpIC0+XG4gICAgQHJlbW92ZXNbZG9jLl9pZF0gPSBkb2NcbiAgICBpZiBAbmFtZXNwYWNlXG4gICAgICBsb2NhbFN0b3JhZ2VbQG5hbWVzcGFjZStcInJlbW92ZXNcIl0gPSBKU09OLnN0cmluZ2lmeShfLnZhbHVlcyhAcmVtb3ZlcykpXG5cbiAgX2RlbGV0ZVJlbW92ZTogKGlkKSAtPlxuICAgIGRlbGV0ZSBAcmVtb3Zlc1tpZF1cbiAgICBpZiBAbmFtZXNwYWNlXG4gICAgICBsb2NhbFN0b3JhZ2VbQG5hbWVzcGFjZStcInJlbW92ZXNcIl0gPSBKU09OLnN0cmluZ2lmeShfLnZhbHVlcyhAcmVtb3ZlcykpXG5cbiAgY2FjaGU6IChkb2NzLCBzZWxlY3Rvciwgb3B0aW9ucywgc3VjY2VzcywgZXJyb3IpIC0+XG4gICAgIyBBZGQgYWxsIG5vbi1sb2NhbCB0aGF0IGFyZSBub3QgdXBzZXJ0ZWQgb3IgcmVtb3ZlZFxuICAgIGZvciBkb2MgaW4gZG9jc1xuICAgICAgaWYgbm90IF8uaGFzKEB1cHNlcnRzLCBkb2MuX2lkKSBhbmQgbm90IF8uaGFzKEByZW1vdmVzLCBkb2MuX2lkKVxuICAgICAgICBAX3B1dEl0ZW0oZG9jKVxuXG4gICAgZG9jc01hcCA9IF8ub2JqZWN0KF8ucGx1Y2soZG9jcywgXCJfaWRcIiksIGRvY3MpXG5cbiAgICBpZiBvcHRpb25zLnNvcnRcbiAgICAgIHNvcnQgPSBjb21waWxlU29ydChvcHRpb25zLnNvcnQpXG5cbiAgICAjIFBlcmZvcm0gcXVlcnksIHJlbW92aW5nIHJvd3MgbWlzc2luZyBpbiBkb2NzIGZyb20gbG9jYWwgZGIgXG4gICAgQGZpbmQoc2VsZWN0b3IsIG9wdGlvbnMpLmZldGNoIChyZXN1bHRzKSA9PlxuICAgICAgZm9yIHJlc3VsdCBpbiByZXN1bHRzXG4gICAgICAgIGlmIG5vdCBkb2NzTWFwW3Jlc3VsdC5faWRdIGFuZCBub3QgXy5oYXMoQHVwc2VydHMsIHJlc3VsdC5faWQpXG4gICAgICAgICAgIyBJZiBwYXN0IGVuZCBvbiBzb3J0ZWQgbGltaXRlZCwgaWdub3JlXG4gICAgICAgICAgaWYgb3B0aW9ucy5zb3J0IGFuZCBvcHRpb25zLmxpbWl0IGFuZCBkb2NzLmxlbmd0aCA9PSBvcHRpb25zLmxpbWl0XG4gICAgICAgICAgICBpZiBzb3J0KHJlc3VsdCwgXy5sYXN0KGRvY3MpKSA+PSAwXG4gICAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgQF9kZWxldGVJdGVtKHJlc3VsdC5faWQpXG5cbiAgICAgIGlmIHN1Y2Nlc3M/IHRoZW4gc3VjY2VzcygpICBcbiAgICAsIGVycm9yXG4gICAgXG4gIHBlbmRpbmdVcHNlcnRzOiAoc3VjY2VzcykgLT5cbiAgICBzdWNjZXNzIF8udmFsdWVzKEB1cHNlcnRzKVxuXG4gIHBlbmRpbmdSZW1vdmVzOiAoc3VjY2VzcykgLT5cbiAgICBzdWNjZXNzIF8ucGx1Y2soQHJlbW92ZXMsIFwiX2lkXCIpXG5cbiAgcmVzb2x2ZVVwc2VydDogKGRvYywgc3VjY2VzcykgLT5cbiAgICBpZiBAdXBzZXJ0c1tkb2MuX2lkXSBhbmQgXy5pc0VxdWFsKGRvYywgQHVwc2VydHNbZG9jLl9pZF0pXG4gICAgICBAX2RlbGV0ZVVwc2VydChkb2MuX2lkKVxuICAgIGlmIHN1Y2Nlc3M/IHRoZW4gc3VjY2VzcygpXG5cbiAgcmVzb2x2ZVJlbW92ZTogKGlkLCBzdWNjZXNzKSAtPlxuICAgIEBfZGVsZXRlUmVtb3ZlKGlkKVxuICAgIGlmIHN1Y2Nlc3M/IHRoZW4gc3VjY2VzcygpXG5cbiAgIyBBZGQgYnV0IGRvIG5vdCBvdmVyd3JpdGUgb3IgcmVjb3JkIGFzIHVwc2VydFxuICBzZWVkOiAoZG9jLCBzdWNjZXNzKSAtPlxuICAgIGlmIG5vdCBfLmhhcyhAaXRlbXMsIGRvYy5faWQpIGFuZCBub3QgXy5oYXMoQHJlbW92ZXMsIGRvYy5faWQpXG4gICAgICBAX3B1dEl0ZW0oZG9jKVxuICAgIGlmIHN1Y2Nlc3M/IHRoZW4gc3VjY2VzcygpXG5cbm1vZHVsZS5leHBvcnRzID0gTG9jYWxEYlxuIiwicHJvY2Vzc0ZpbmQgPSByZXF1aXJlKCcuL3V0aWxzJykucHJvY2Vzc0ZpbmRcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBIeWJyaWREYlxuICBjb25zdHJ1Y3RvcjogKGxvY2FsRGIsIHJlbW90ZURiKSAtPlxuICAgIEBsb2NhbERiID0gbG9jYWxEYlxuICAgIEByZW1vdGVEYiA9IHJlbW90ZURiXG4gICAgQGNvbGxlY3Rpb25zID0ge31cblxuICBhZGRDb2xsZWN0aW9uOiAobmFtZSkgLT5cbiAgICBjb2xsZWN0aW9uID0gbmV3IEh5YnJpZENvbGxlY3Rpb24obmFtZSwgQGxvY2FsRGJbbmFtZV0sIEByZW1vdGVEYltuYW1lXSlcbiAgICBAW25hbWVdID0gY29sbGVjdGlvblxuICAgIEBjb2xsZWN0aW9uc1tuYW1lXSA9IGNvbGxlY3Rpb25cblxuICByZW1vdmVDb2xsZWN0aW9uOiAobmFtZSkgLT5cbiAgICBkZWxldGUgQFtuYW1lXVxuICAgIGRlbGV0ZSBAY29sbGVjdGlvbnNbbmFtZV1cbiAgXG4gIHVwbG9hZDogKHN1Y2Nlc3MsIGVycm9yKSAtPlxuICAgIGNvbHMgPSBfLnZhbHVlcyhAY29sbGVjdGlvbnMpXG5cbiAgICB1cGxvYWRDb2xzID0gKGNvbHMsIHN1Y2Nlc3MsIGVycm9yKSA9PlxuICAgICAgY29sID0gXy5maXJzdChjb2xzKVxuICAgICAgaWYgY29sXG4gICAgICAgIGNvbC51cGxvYWQoKCkgPT5cbiAgICAgICAgICB1cGxvYWRDb2xzKF8ucmVzdChjb2xzKSwgc3VjY2VzcywgZXJyb3IpXG4gICAgICAgICwgKGVycikgPT5cbiAgICAgICAgICBlcnJvcihlcnIpKVxuICAgICAgZWxzZVxuICAgICAgICBzdWNjZXNzKClcbiAgICB1cGxvYWRDb2xzKGNvbHMsIHN1Y2Nlc3MsIGVycm9yKVxuXG5jbGFzcyBIeWJyaWRDb2xsZWN0aW9uXG4gIGNvbnN0cnVjdG9yOiAobmFtZSwgbG9jYWxDb2wsIHJlbW90ZUNvbCkgLT5cbiAgICBAbmFtZSA9IG5hbWVcbiAgICBAbG9jYWxDb2wgPSBsb2NhbENvbFxuICAgIEByZW1vdGVDb2wgPSByZW1vdGVDb2xcblxuICAjIG9wdGlvbnMubW9kZSBkZWZhdWx0cyB0byBcImh5YnJpZFwiLlxuICAjIEluIFwiaHlicmlkXCIsIGl0IHdpbGwgcmV0dXJuIGxvY2FsIHJlc3VsdHMsIHRoZW4gaGl0IHJlbW90ZSBhbmQgcmV0dXJuIGFnYWluIGlmIGRpZmZlcmVudFxuICAjIElmIHJlbW90ZSBnaXZlcyBlcnJvciwgaXQgd2lsbCBiZSBpZ25vcmVkXG4gICMgSW4gXCJyZW1vdGVcIiwgaXQgd2lsbCBjYWxsIHJlbW90ZSBhbmQgbm90IGNhY2hlLCBidXQgaW50ZWdyYXRlcyBsb2NhbCB1cHNlcnRzL2RlbGV0ZXNcbiAgIyBJZiByZW1vdGUgZ2l2ZXMgZXJyb3IsIHRoZW4gaXQgd2lsbCByZXR1cm4gbG9jYWwgcmVzdWx0c1xuICAjIEluIFwibG9jYWxcIiwganVzdCByZXR1cm5zIGxvY2FsIHJlc3VsdHNcbiAgZmluZDogKHNlbGVjdG9yLCBvcHRpb25zID0ge30pIC0+XG4gICAgcmV0dXJuIGZldGNoOiAoc3VjY2VzcywgZXJyb3IpID0+XG4gICAgICBAX2ZpbmRGZXRjaChzZWxlY3Rvciwgb3B0aW9ucywgc3VjY2VzcywgZXJyb3IpXG5cbiAgIyBvcHRpb25zLm1vZGUgZGVmYXVsdHMgdG8gXCJoeWJyaWRcIi5cbiAgIyBJbiBcImh5YnJpZFwiLCBpdCB3aWxsIHJldHVybiBsb2NhbCBpZiBwcmVzZW50LCBvdGhlcndpc2UgZmFsbCB0byByZW1vdGUgd2l0aG91dCByZXR1cm5pbmcgbnVsbFxuICAjIElmIHJlbW90ZSBnaXZlcyBlcnJvciwgdGhlbiBpdCB3aWxsIHJldHVybiBudWxsIGlmIG5vbmUgbG9jYWxseS4gSWYgcmVtb3RlIGFuZCBsb2NhbCBkaWZmZXIsIGl0XG4gICMgd2lsbCByZXR1cm4gdHdpY2VcbiAgIyBJbiBcImxvY2FsXCIsIGl0IHdpbGwgcmV0dXJuIGxvY2FsIGlmIHByZXNlbnQuIElmIG5vdCBwcmVzZW50LCBvbmx5IHRoZW4gd2lsbCBpdCBoaXQgcmVtb3RlLlxuICAjIElmIHJlbW90ZSBnaXZlcyBlcnJvciwgdGhlbiBpdCB3aWxsIHJldHVybiBudWxsXG4gICMgSW4gXCJyZW1vdGVcIi4uLiAobm90IGltcGxlbWVudGVkKVxuICBmaW5kT25lOiAoc2VsZWN0b3IsIG9wdGlvbnMgPSB7fSwgc3VjY2VzcywgZXJyb3IpIC0+XG4gICAgaWYgXy5pc0Z1bmN0aW9uKG9wdGlvbnMpIFxuICAgICAgW29wdGlvbnMsIHN1Y2Nlc3MsIGVycm9yXSA9IFt7fSwgb3B0aW9ucywgc3VjY2Vzc11cblxuICAgIG1vZGUgPSBvcHRpb25zLm1vZGUgfHwgXCJoeWJyaWRcIlxuXG4gICAgaWYgbW9kZSA9PSBcImh5YnJpZFwiIG9yIG1vZGUgPT0gXCJsb2NhbFwiXG4gICAgICBvcHRpb25zLmxpbWl0ID0gMVxuICAgICAgQGxvY2FsQ29sLmZpbmRPbmUgc2VsZWN0b3IsIG9wdGlvbnMsIChsb2NhbERvYykgPT5cbiAgICAgICAgIyBJZiBmb3VuZCwgcmV0dXJuXG4gICAgICAgIGlmIGxvY2FsRG9jXG4gICAgICAgICAgc3VjY2Vzcyhsb2NhbERvYylcbiAgICAgICAgICAjIE5vIG5lZWQgdG8gaGl0IHJlbW90ZSBpZiBsb2NhbFxuICAgICAgICAgIGlmIG1vZGUgPT0gXCJsb2NhbFwiXG4gICAgICAgICAgICByZXR1cm4gXG5cbiAgICAgICAgcmVtb3RlU3VjY2VzcyA9IChyZW1vdGVEb2MpID0+XG4gICAgICAgICAgIyBDYWNoZVxuICAgICAgICAgIGNhY2hlU3VjY2VzcyA9ID0+XG4gICAgICAgICAgICAjIFRyeSBxdWVyeSBhZ2FpblxuICAgICAgICAgICAgQGxvY2FsQ29sLmZpbmRPbmUgc2VsZWN0b3IsIG9wdGlvbnMsIChsb2NhbERvYzIpID0+XG4gICAgICAgICAgICAgIGlmIG5vdCBfLmlzRXF1YWwobG9jYWxEb2MsIGxvY2FsRG9jMilcbiAgICAgICAgICAgICAgICBzdWNjZXNzKGxvY2FsRG9jMilcbiAgICAgICAgICAgICAgZWxzZSBpZiBub3QgbG9jYWxEb2NcbiAgICAgICAgICAgICAgICBzdWNjZXNzKG51bGwpXG5cbiAgICAgICAgICBkb2NzID0gaWYgcmVtb3RlRG9jIHRoZW4gW3JlbW90ZURvY10gZWxzZSBbXVxuICAgICAgICAgIEBsb2NhbENvbC5jYWNoZShkb2NzLCBzZWxlY3Rvciwgb3B0aW9ucywgY2FjaGVTdWNjZXNzLCBlcnJvcilcblxuICAgICAgICByZW1vdGVFcnJvciA9ID0+XG4gICAgICAgICAgIyBSZW1vdGUgZXJyb3JlZCBvdXQuIFJldHVybiBudWxsIGlmIGxvY2FsIGRpZCBub3QgcmV0dXJuXG4gICAgICAgICAgaWYgbm90IGxvY2FsRG9jXG4gICAgICAgICAgICBzdWNjZXNzKG51bGwpXG5cbiAgICAgICAgIyBDYWxsIHJlbW90ZVxuICAgICAgICBAcmVtb3RlQ29sLmZpbmRPbmUgc2VsZWN0b3IsIF8ub21pdChvcHRpb25zLCAnZmllbGRzJyksIHJlbW90ZVN1Y2Nlc3MsIHJlbW90ZUVycm9yXG4gICAgICAsIGVycm9yXG4gICAgZWxzZSBcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlVua25vd24gbW9kZVwiKVxuXG4gIF9maW5kRmV0Y2g6IChzZWxlY3Rvciwgb3B0aW9ucywgc3VjY2VzcywgZXJyb3IpIC0+XG4gICAgbW9kZSA9IG9wdGlvbnMubW9kZSB8fCBcImh5YnJpZFwiXG5cbiAgICBpZiBtb2RlID09IFwiaHlicmlkXCJcbiAgICAgICMgR2V0IGxvY2FsIHJlc3VsdHNcbiAgICAgIGxvY2FsU3VjY2VzcyA9IChsb2NhbERhdGEpID0+XG4gICAgICAgICMgUmV0dXJuIGRhdGEgaW1tZWRpYXRlbHlcbiAgICAgICAgc3VjY2Vzcyhsb2NhbERhdGEpXG5cbiAgICAgICAgIyBHZXQgcmVtb3RlIGRhdGFcbiAgICAgICAgcmVtb3RlU3VjY2VzcyA9IChyZW1vdGVEYXRhKSA9PlxuICAgICAgICAgICMgQ2FjaGUgbG9jYWxseVxuICAgICAgICAgIGNhY2hlU3VjY2VzcyA9ICgpID0+XG4gICAgICAgICAgICAjIEdldCBsb2NhbCBkYXRhIGFnYWluXG4gICAgICAgICAgICBsb2NhbFN1Y2Nlc3MyID0gKGxvY2FsRGF0YTIpID0+XG4gICAgICAgICAgICAgICMgQ2hlY2sgaWYgZGlmZmVyZW50XG4gICAgICAgICAgICAgIGlmIG5vdCBfLmlzRXF1YWwobG9jYWxEYXRhLCBsb2NhbERhdGEyKVxuICAgICAgICAgICAgICAgICMgU2VuZCBhZ2FpblxuICAgICAgICAgICAgICAgIHN1Y2Nlc3MobG9jYWxEYXRhMilcbiAgICAgICAgICAgIEBsb2NhbENvbC5maW5kKHNlbGVjdG9yLCBvcHRpb25zKS5mZXRjaChsb2NhbFN1Y2Nlc3MyKVxuICAgICAgICAgIEBsb2NhbENvbC5jYWNoZShyZW1vdGVEYXRhLCBzZWxlY3Rvciwgb3B0aW9ucywgY2FjaGVTdWNjZXNzLCBlcnJvcilcbiAgICAgICAgQHJlbW90ZUNvbC5maW5kKHNlbGVjdG9yLCBfLm9taXQob3B0aW9ucywgXCJmaWVsZHNcIikpLmZldGNoKHJlbW90ZVN1Y2Nlc3MpXG5cbiAgICAgIEBsb2NhbENvbC5maW5kKHNlbGVjdG9yLCBvcHRpb25zKS5mZXRjaChsb2NhbFN1Y2Nlc3MsIGVycm9yKVxuICAgIGVsc2UgaWYgbW9kZSA9PSBcImxvY2FsXCJcbiAgICAgIEBsb2NhbENvbC5maW5kKHNlbGVjdG9yLCBvcHRpb25zKS5mZXRjaChzdWNjZXNzLCBlcnJvcilcbiAgICBlbHNlIGlmIG1vZGUgPT0gXCJyZW1vdGVcIlxuICAgICAgIyBHZXQgcmVtb3RlIHJlc3VsdHNcbiAgICAgIHJlbW90ZVN1Y2Nlc3MgPSAocmVtb3RlRGF0YSkgPT5cbiAgICAgICAgIyBSZW1vdmUgbG9jYWwgcmVtb3Rlc1xuICAgICAgICBkYXRhID0gcmVtb3RlRGF0YVxuXG4gICAgICAgIEBsb2NhbENvbC5wZW5kaW5nUmVtb3ZlcyAocmVtb3ZlcykgPT5cbiAgICAgICAgICBpZiByZW1vdmVzLmxlbmd0aCA+IDBcbiAgICAgICAgICAgIHJlbW92ZXNNYXAgPSBfLm9iamVjdChfLm1hcChyZW1vdmVzLCAoaWQpIC0+IFtpZCwgaWRdKSlcbiAgICAgICAgICAgIGRhdGEgPSBfLmZpbHRlciByZW1vdGVEYXRhLCAoZG9jKSAtPlxuICAgICAgICAgICAgICByZXR1cm4gbm90IF8uaGFzKHJlbW92ZXNNYXAsIGRvYy5faWQpXG5cbiAgICAgICAgICAjIEFkZCB1cHNlcnRzXG4gICAgICAgICAgQGxvY2FsQ29sLnBlbmRpbmdVcHNlcnRzICh1cHNlcnRzKSA9PlxuICAgICAgICAgICAgaWYgdXBzZXJ0cy5sZW5ndGggPiAwXG4gICAgICAgICAgICAgICMgUmVtb3ZlIHVwc2VydHMgZnJvbSBkYXRhXG4gICAgICAgICAgICAgIHVwc2VydHNNYXAgPSBfLm9iamVjdChfLnBsdWNrKHVwc2VydHMsICdfaWQnKSwgXy5wbHVjayh1cHNlcnRzLCAnX2lkJykpXG4gICAgICAgICAgICAgIGRhdGEgPSBfLmZpbHRlciBkYXRhLCAoZG9jKSAtPlxuICAgICAgICAgICAgICAgIHJldHVybiBub3QgXy5oYXModXBzZXJ0c01hcCwgZG9jLl9pZClcblxuICAgICAgICAgICAgICAjIEFkZCB1cHNlcnRzXG4gICAgICAgICAgICAgIGRhdGEgPSBkYXRhLmNvbmNhdCh1cHNlcnRzKVxuXG4gICAgICAgICAgICAgICMgUmVmaWx0ZXIvc29ydC9saW1pdFxuICAgICAgICAgICAgICBkYXRhID0gcHJvY2Vzc0ZpbmQoZGF0YSwgc2VsZWN0b3IsIG9wdGlvbnMpXG5cbiAgICAgICAgICAgIHN1Y2Nlc3MoZGF0YSlcblxuICAgICAgcmVtb3RlRXJyb3IgPSA9PlxuICAgICAgICAjIENhbGwgbG9jYWxcbiAgICAgICAgQGxvY2FsQ29sLmZpbmQoc2VsZWN0b3IsIG9wdGlvbnMpLmZldGNoKHN1Y2Nlc3MsIGVycm9yKVxuXG4gICAgICBAcmVtb3RlQ29sLmZpbmQoc2VsZWN0b3IsIG9wdGlvbnMpLmZldGNoKHJlbW90ZVN1Y2Nlc3MsIHJlbW90ZUVycm9yKVxuICAgIGVsc2VcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlVua25vd24gbW9kZVwiKVxuXG4gIHVwc2VydDogKGRvYywgc3VjY2VzcywgZXJyb3IpIC0+XG4gICAgQGxvY2FsQ29sLnVwc2VydChkb2MsIHN1Y2Nlc3MsIGVycm9yKVxuXG4gIHJlbW92ZTogKGlkLCBzdWNjZXNzLCBlcnJvcikgLT5cbiAgICBAbG9jYWxDb2wucmVtb3ZlKGlkLCBzdWNjZXNzLCBlcnJvcilcblxuICB1cGxvYWQ6IChzdWNjZXNzLCBlcnJvcikgLT5cbiAgICB1cGxvYWRVcHNlcnRzID0gKHVwc2VydHMsIHN1Y2Nlc3MsIGVycm9yKSA9PlxuICAgICAgdXBzZXJ0ID0gXy5maXJzdCh1cHNlcnRzKVxuICAgICAgaWYgdXBzZXJ0XG4gICAgICAgIEByZW1vdGVDb2wudXBzZXJ0KHVwc2VydCwgKCkgPT5cbiAgICAgICAgICBAbG9jYWxDb2wucmVzb2x2ZVVwc2VydCB1cHNlcnQsID0+XG4gICAgICAgICAgICB1cGxvYWRVcHNlcnRzKF8ucmVzdCh1cHNlcnRzKSwgc3VjY2VzcywgZXJyb3IpXG4gICAgICAgICwgKGVycikgPT5cbiAgICAgICAgICBlcnJvcihlcnIpKVxuICAgICAgZWxzZSBcbiAgICAgICAgc3VjY2VzcygpXG4gICAgQGxvY2FsQ29sLnBlbmRpbmdVcHNlcnRzICh1cHNlcnRzKSA9PlxuICAgICAgdXBsb2FkVXBzZXJ0cyh1cHNlcnRzLCBzdWNjZXNzLCBlcnJvcilcbiIsIlBhZ2UgPSByZXF1aXJlIFwiLi4vUGFnZVwiXG5cbiMgRGlzcGxheXMgYW4gaW1hZ2UuIE9wdGlvbnM6IHVpZDogdWlkIG9mIGltYWdlXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEltYWdlUGFnZSBleHRlbmRzIFBhZ2VcbiAgY3JlYXRlOiAtPlxuICAgIEAkZWwuaHRtbCB0ZW1wbGF0ZXNbJ3BhZ2VzL0ltYWdlUGFnZSddKClcblxuICAgICMgR2V0IGltYWdlIHVybFxuICAgIEBpbWFnZU1hbmFnZXIuZ2V0SW1hZ2VVcmwoQG9wdGlvbnMuaWQsICh1cmwpID0+XG4gICAgICBAJChcIiNtZXNzYWdlX2JhclwiKS5oaWRlKClcbiAgICAgIEAkKFwiI2ltYWdlXCIpLmF0dHIoXCJzcmNcIiwgdXJsKS5zaG93KClcbiAgICAsIEBlcnJvcilcblxuICBhY3RpdmF0ZTogLT5cbiAgICBAc2V0VGl0bGUgXCJJbWFnZVwiXG5cbiAgICAjIElmIHJlbW92ZSBhbGxvd2VkLCBzZXQgaW4gYnV0dG9uIGJhclxuICAgIGlmIEBvcHRpb25zLm9uUmVtb3ZlXG4gICAgICBAc2V0dXBCdXR0b25CYXIgW1xuICAgICAgICB7IGljb246IFwiZGVsZXRlLnBuZ1wiLCBjbGljazogPT4gQHJlbW92ZVBob3RvKCkgfVxuICAgICAgXVxuICAgIGVsc2VcbiAgICAgIEBzZXR1cEJ1dHRvbkJhciBbXVxuXG4gIHJlbW92ZVBob3RvOiAtPlxuICAgIGlmIGNvbmZpcm0oXCJSZW1vdmUgaW1hZ2U/XCIpXG4gICAgICBAb3B0aW9ucy5vblJlbW92ZSgpXG4gICAgICBAcGFnZXIuY2xvc2VQYWdlKClcbiIsImV4cG9ydHMuU2VjdGlvbnMgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCh7XG4gICAgY2xhc3NOYW1lIDogXCJzdXJ2ZXlcIixcblxuICAgIGluaXRpYWxpemUgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy50aXRsZSA9IHRoaXMub3B0aW9ucy50aXRsZTtcbiAgICAgICAgdGhpcy5zZWN0aW9ucyA9IHRoaXMub3B0aW9ucy5zZWN0aW9ucztcbiAgICAgICAgdGhpcy5yZW5kZXIoKTtcblxuICAgICAgICAvLyBBZGp1c3QgbmV4dC9wcmV2IGJhc2VkIG9uIG1vZGVsXG4gICAgICAgIHRoaXMubW9kZWwub24oXCJjaGFuZ2VcIiwgdGhpcy5yZW5kZXJOZXh0UHJldiwgdGhpcyk7XG5cbiAgICAgICAgLy8gR28gdG8gYXBwcm9wcmlhdGUgc2VjdGlvbiBUT0RPXG4gICAgICAgIHRoaXMuc2hvd1NlY3Rpb24oMCk7XG4gICAgfSxcblxuICAgIGV2ZW50cyA6IHtcbiAgICAgICAgXCJjbGljayAubmV4dFwiIDogXCJuZXh0U2VjdGlvblwiLFxuICAgICAgICBcImNsaWNrIC5wcmV2XCIgOiBcInByZXZTZWN0aW9uXCIsXG4gICAgICAgIFwiY2xpY2sgLmZpbmlzaFwiIDogXCJmaW5pc2hcIixcbiAgICAgICAgXCJjbGljayBhLnNlY3Rpb24tY3J1bWJcIiA6IFwiY3J1bWJTZWN0aW9uXCJcbiAgICB9LFxuXG4gICAgZmluaXNoIDogZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIFZhbGlkYXRlIGN1cnJlbnQgc2VjdGlvblxuICAgICAgICB2YXIgc2VjdGlvbiA9IHRoaXMuc2VjdGlvbnNbdGhpcy5zZWN0aW9uXTtcbiAgICAgICAgaWYgKHNlY3Rpb24udmFsaWRhdGUoKSkge1xuICAgICAgICAgICAgdGhpcy50cmlnZ2VyKCdjb21wbGV0ZScpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGNydW1iU2VjdGlvbiA6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgLy8gR28gdG8gc2VjdGlvblxuICAgICAgICB2YXIgaW5kZXggPSBwYXJzZUludChlLnRhcmdldC5nZXRBdHRyaWJ1dGUoXCJkYXRhLXZhbHVlXCIpKTtcbiAgICAgICAgdGhpcy5zaG93U2VjdGlvbihpbmRleCk7XG4gICAgfSxcblxuICAgIGdldE5leHRTZWN0aW9uSW5kZXggOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGkgPSB0aGlzLnNlY3Rpb24gKyAxO1xuICAgICAgICB3aGlsZSAoaSA8IHRoaXMuc2VjdGlvbnMubGVuZ3RoKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5zZWN0aW9uc1tpXS5zaG91bGRCZVZpc2libGUoKSlcbiAgICAgICAgICAgICAgICByZXR1cm4gaTtcbiAgICAgICAgICAgIGkrKztcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBnZXRQcmV2U2VjdGlvbkluZGV4IDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBpID0gdGhpcy5zZWN0aW9uIC0gMTtcbiAgICAgICAgd2hpbGUgKGkgPj0gMCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuc2VjdGlvbnNbaV0uc2hvdWxkQmVWaXNpYmxlKCkpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGk7XG4gICAgICAgICAgICBpLS07XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgbmV4dFNlY3Rpb24gOiBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gVmFsaWRhdGUgY3VycmVudCBzZWN0aW9uXG4gICAgICAgIHZhciBzZWN0aW9uID0gdGhpcy5zZWN0aW9uc1t0aGlzLnNlY3Rpb25dO1xuICAgICAgICBpZiAoc2VjdGlvbi52YWxpZGF0ZSgpKSB7XG4gICAgICAgICAgICB0aGlzLnNob3dTZWN0aW9uKHRoaXMuZ2V0TmV4dFNlY3Rpb25JbmRleCgpKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBwcmV2U2VjdGlvbiA6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnNob3dTZWN0aW9uKHRoaXMuZ2V0UHJldlNlY3Rpb25JbmRleCgpKTtcbiAgICB9LFxuXG4gICAgc2hvd1NlY3Rpb24gOiBmdW5jdGlvbihpbmRleCkge1xuICAgICAgICB0aGlzLnNlY3Rpb24gPSBpbmRleDtcblxuICAgICAgICBfLmVhY2godGhpcy5zZWN0aW9ucywgZnVuY3Rpb24ocykge1xuICAgICAgICAgICAgcy4kZWwuaGlkZSgpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5zZWN0aW9uc1tpbmRleF0uJGVsLnNob3coKTtcblxuICAgICAgICAvLyBTZXR1cCBicmVhZGNydW1ic1xuICAgICAgICB2YXIgdmlzaWJsZVNlY3Rpb25zID0gXy5maWx0ZXIoXy5maXJzdCh0aGlzLnNlY3Rpb25zLCBpbmRleCArIDEpLCBmdW5jdGlvbihzKSB7XG4gICAgICAgICAgICByZXR1cm4gcy5zaG91bGRCZVZpc2libGUoKVxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy4kKFwiLmJyZWFkY3J1bWJcIikuaHRtbCh0ZW1wbGF0ZXNbJ2Zvcm1zL1NlY3Rpb25zX2JyZWFkY3J1bWJzJ10oe1xuICAgICAgICAgICAgc2VjdGlvbnMgOiBfLmluaXRpYWwodmlzaWJsZVNlY3Rpb25zKSxcbiAgICAgICAgICAgIGxhc3RTZWN0aW9uOiBfLmxhc3QodmlzaWJsZVNlY3Rpb25zKVxuICAgICAgICB9KSk7XG4gICAgICAgIFxuICAgICAgICB0aGlzLnJlbmRlck5leHRQcmV2KCk7XG5cbiAgICAgICAgLy8gU2Nyb2xsIGludG8gdmlld1xuICAgICAgICB0aGlzLiRlbC5zY3JvbGxpbnRvdmlldygpO1xuICAgIH0sXG4gICAgXG4gICAgcmVuZGVyTmV4dFByZXYgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gU2V0dXAgbmV4dC9wcmV2IGJ1dHRvbnNcbiAgICAgICAgdGhpcy4kKFwiLnByZXZcIikudG9nZ2xlKHRoaXMuZ2V0UHJldlNlY3Rpb25JbmRleCgpICE9PSB1bmRlZmluZWQpO1xuICAgICAgICB0aGlzLiQoXCIubmV4dFwiKS50b2dnbGUodGhpcy5nZXROZXh0U2VjdGlvbkluZGV4KCkgIT09IHVuZGVmaW5lZCk7XG4gICAgICAgIHRoaXMuJChcIi5maW5pc2hcIikudG9nZ2xlKHRoaXMuZ2V0TmV4dFNlY3Rpb25JbmRleCgpID09PSB1bmRlZmluZWQpO1xuICAgIH0sXG5cbiAgICByZW5kZXIgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy4kZWwuaHRtbCh0ZW1wbGF0ZXNbJ2Zvcm1zL1NlY3Rpb25zJ10oKSk7XG5cbiAgICAgICAgLy8gQWRkIHNlY3Rpb25zXG4gICAgICAgIHZhciBzZWN0aW9uc0VsID0gdGhpcy4kKFwiLnNlY3Rpb25zXCIpO1xuICAgICAgICBfLmVhY2godGhpcy5zZWN0aW9ucywgZnVuY3Rpb24ocykge1xuICAgICAgICAgICAgc2VjdGlvbnNFbC5hcHBlbmQocy4kZWwpO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbn0pO1xuXG5leHBvcnRzLlNlY3Rpb24gPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCh7XG4gICAgY2xhc3NOYW1lIDogXCJzZWN0aW9uXCIsXG4gICAgdGVtcGxhdGUgOiBfLnRlbXBsYXRlKCc8ZGl2IGNsYXNzPVwiY29udGVudHNcIj48L2Rpdj4nKSxcblxuICAgIGluaXRpYWxpemUgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy50aXRsZSA9IHRoaXMub3B0aW9ucy50aXRsZTtcbiAgICAgICAgdGhpcy5jb250ZW50cyA9IHRoaXMub3B0aW9ucy5jb250ZW50cztcblxuICAgICAgICAvLyBBbHdheXMgaW52aXNpYmxlIGluaXRpYWxseVxuICAgICAgICB0aGlzLiRlbC5oaWRlKCk7XG4gICAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgfSxcblxuICAgIHNob3VsZEJlVmlzaWJsZSA6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoIXRoaXMub3B0aW9ucy5jb25kaXRpb25hbClcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25zLmNvbmRpdGlvbmFsKHRoaXMubW9kZWwpO1xuICAgIH0sXG5cbiAgICB2YWxpZGF0ZSA6IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBHZXQgYWxsIHZpc2libGUgaXRlbXNcbiAgICAgICAgdmFyIGl0ZW1zID0gXy5maWx0ZXIodGhpcy5jb250ZW50cywgZnVuY3Rpb24oYykge1xuICAgICAgICAgICAgcmV0dXJuIGMudmlzaWJsZSAmJiBjLnZhbGlkYXRlO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuICFfLmFueShfLm1hcChpdGVtcywgZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICAgICAgcmV0dXJuIGl0ZW0udmFsaWRhdGUoKTtcbiAgICAgICAgfSkpO1xuICAgIH0sXG5cbiAgICByZW5kZXIgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy4kZWwuaHRtbCh0aGlzLnRlbXBsYXRlKHRoaXMpKTtcblxuICAgICAgICAvLyBBZGQgY29udGVudHMgKHF1ZXN0aW9ucywgbW9zdGx5KVxuICAgICAgICB2YXIgY29udGVudHNFbCA9IHRoaXMuJChcIi5jb250ZW50c1wiKTtcbiAgICAgICAgXy5lYWNoKHRoaXMuY29udGVudHMsIGZ1bmN0aW9uKGMpIHtcbiAgICAgICAgICAgIGNvbnRlbnRzRWwuYXBwZW5kKGMuJGVsKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG59KTtcblxuZXhwb3J0cy5RdWVzdGlvbiA9IEJhY2tib25lLlZpZXcuZXh0ZW5kKHtcbiAgICBjbGFzc05hbWUgOiBcInF1ZXN0aW9uXCIsXG5cbiAgICB0ZW1wbGF0ZSA6IF8udGVtcGxhdGUoJzwlIGlmIChvcHRpb25zLnByb21wdCkgeyAlPjxkaXYgY2xhc3M9XCJwcm9tcHRcIj48JT1vcHRpb25zLnByb21wdCU+PCU9cmVuZGVyUmVxdWlyZWQoKSU+PC9kaXY+PCUgfSAlPjxkaXYgY2xhc3M9XCJhbnN3ZXJcIj48L2Rpdj48JT1yZW5kZXJIaW50KCklPicpLFxuXG4gICAgcmVuZGVyUmVxdWlyZWQgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMucmVxdWlyZWQpXG4gICAgICAgICAgICByZXR1cm4gJyZuYnNwOzxzcGFuIGNsYXNzPVwicmVxdWlyZWRcIj4qPC9zcGFuPic7XG4gICAgICAgIHJldHVybiAnJztcbiAgICB9LFxuXG4gICAgcmVuZGVySGludDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuaGludClcbiAgICAgICAgICAgIHJldHVybiBfLnRlbXBsYXRlKCc8ZGl2IGNsYXNzPVwibXV0ZWRcIj48JT1oaW50JT48L2Rpdj4nKSh7aGludDogdGhpcy5vcHRpb25zLmhpbnR9KTtcbiAgICB9LFxuXG4gICAgdmFsaWRhdGUgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHZhbDtcblxuICAgICAgICAvLyBDaGVjayByZXF1aXJlZFxuICAgICAgICBpZiAodGhpcy5yZXF1aXJlZCkge1xuICAgICAgICAgICAgaWYgKHRoaXMubW9kZWwuZ2V0KHRoaXMuaWQpID09PSB1bmRlZmluZWQgfHwgdGhpcy5tb2RlbC5nZXQodGhpcy5pZCkgPT09IG51bGwgfHwgdGhpcy5tb2RlbC5nZXQodGhpcy5pZCkgPT09IFwiXCIpXG4gICAgICAgICAgICAgICAgdmFsID0gXCJSZXF1aXJlZFwiO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2hlY2sgaW50ZXJuYWwgdmFsaWRhdGlvblxuICAgICAgICBpZiAoIXZhbCAmJiB0aGlzLnZhbGlkYXRlSW50ZXJuYWwpIHtcbiAgICAgICAgICAgIHZhbCA9IHRoaXMudmFsaWRhdGVJbnRlcm5hbCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2hlY2sgY3VzdG9tIHZhbGlkYXRpb25cbiAgICAgICAgaWYgKCF2YWwgJiYgdGhpcy5vcHRpb25zLnZhbGlkYXRlKSB7XG4gICAgICAgICAgICB2YWwgPSB0aGlzLm9wdGlvbnMudmFsaWRhdGUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFNob3cgdmFsaWRhdGlvbiByZXN1bHRzIFRPRE9cbiAgICAgICAgaWYgKHZhbCkge1xuICAgICAgICAgICAgdGhpcy4kZWwuYWRkQ2xhc3MoXCJpbnZhbGlkXCIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy4kZWwucmVtb3ZlQ2xhc3MoXCJpbnZhbGlkXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHZhbDtcbiAgICB9LFxuXG4gICAgdXBkYXRlVmlzaWJpbGl0eSA6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgLy8gc2xpZGVVcC9zbGlkZURvd25cbiAgICAgICAgaWYgKHRoaXMuc2hvdWxkQmVWaXNpYmxlKCkgJiYgIXRoaXMudmlzaWJsZSlcbiAgICAgICAgICAgIHRoaXMuJGVsLnNsaWRlRG93bigpO1xuICAgICAgICBpZiAoIXRoaXMuc2hvdWxkQmVWaXNpYmxlKCkgJiYgdGhpcy52aXNpYmxlKVxuICAgICAgICAgICAgdGhpcy4kZWwuc2xpZGVVcCgpO1xuICAgICAgICB0aGlzLnZpc2libGUgPSB0aGlzLnNob3VsZEJlVmlzaWJsZSgpO1xuICAgIH0sXG5cbiAgICBzaG91bGRCZVZpc2libGUgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKCF0aGlzLm9wdGlvbnMuY29uZGl0aW9uYWwpXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy5jb25kaXRpb25hbCh0aGlzLm1vZGVsKTtcbiAgICB9LFxuXG4gICAgaW5pdGlhbGl6ZSA6IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBBZGp1c3QgdmlzaWJpbGl0eSBiYXNlZCBvbiBtb2RlbFxuICAgICAgICB0aGlzLm1vZGVsLm9uKFwiY2hhbmdlXCIsIHRoaXMudXBkYXRlVmlzaWJpbGl0eSwgdGhpcyk7XG5cbiAgICAgICAgLy8gUmUtcmVuZGVyIGJhc2VkIG9uIG1vZGVsIGNoYW5nZXNcbiAgICAgICAgdGhpcy5tb2RlbC5vbihcImNoYW5nZTpcIiArIHRoaXMuaWQsIHRoaXMucmVuZGVyLCB0aGlzKTtcblxuICAgICAgICB0aGlzLnJlcXVpcmVkID0gdGhpcy5vcHRpb25zLnJlcXVpcmVkO1xuXG4gICAgICAgIC8vIFNhdmUgY29udGV4dFxuICAgICAgICB0aGlzLmN0eCA9IHRoaXMub3B0aW9ucy5jdHggfHwge307XG5cbiAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICB9LFxuXG4gICAgcmVuZGVyIDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuJGVsLmh0bWwodGhpcy50ZW1wbGF0ZSh0aGlzKSk7XG5cbiAgICAgICAgLy8gUmVuZGVyIGFuc3dlclxuICAgICAgICB0aGlzLnJlbmRlckFuc3dlcih0aGlzLiQoXCIuYW5zd2VyXCIpKTtcblxuICAgICAgICB0aGlzLiRlbC50b2dnbGUodGhpcy5zaG91bGRCZVZpc2libGUoKSk7XG4gICAgICAgIHRoaXMudmlzaWJsZSA9IHRoaXMuc2hvdWxkQmVWaXNpYmxlKCk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxufSk7XG5cbmV4cG9ydHMuUmFkaW9RdWVzdGlvbiA9IGV4cG9ydHMuUXVlc3Rpb24uZXh0ZW5kKHtcbiAgICBldmVudHMgOiB7XG4gICAgICAgIFwiY2hlY2tlZFwiIDogXCJjaGVja2VkXCIsXG4gICAgfSxcblxuICAgIGNoZWNrZWQgOiBmdW5jdGlvbihlKSB7XG4gICAgICAgIHZhciBpbmRleCA9IHBhcnNlSW50KGUudGFyZ2V0LmdldEF0dHJpYnV0ZShcImRhdGEtdmFsdWVcIikpO1xuICAgICAgICB2YXIgdmFsdWUgPSB0aGlzLm9wdGlvbnMub3B0aW9uc1tpbmRleF1bMF07XG4gICAgICAgIHRoaXMubW9kZWwuc2V0KHRoaXMuaWQsIHZhbHVlKTtcbiAgICB9LFxuXG4gICAgcmVuZGVyQW5zd2VyIDogZnVuY3Rpb24oYW5zd2VyRWwpIHtcbiAgICAgICAgYW5zd2VyRWwuaHRtbChfLnRlbXBsYXRlKCc8ZGl2IGNsYXNzPVwicmFkaW8tZ3JvdXBcIj48JT1yZW5kZXJSYWRpb09wdGlvbnMoKSU+PC9kaXY+JywgdGhpcykpO1xuICAgIH0sXG5cbiAgICByZW5kZXJSYWRpb09wdGlvbnMgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaHRtbCA9IFwiXCI7XG4gICAgICAgIHZhciBpO1xuICAgICAgICBmb3IgKCBpID0gMDsgaSA8IHRoaXMub3B0aW9ucy5vcHRpb25zLmxlbmd0aDsgaSsrKVxuICAgICAgICAgICAgaHRtbCArPSBfLnRlbXBsYXRlKCc8ZGl2IGNsYXNzPVwicmFkaW8tYnV0dG9uIDwlPWNoZWNrZWQlPlwiIGRhdGEtdmFsdWU9XCI8JT1wb3NpdGlvbiU+XCI+PCU9dGV4dCU+PC9kaXY+Jywge1xuICAgICAgICAgICAgICAgIHBvc2l0aW9uIDogaSxcbiAgICAgICAgICAgICAgICB0ZXh0IDogdGhpcy5vcHRpb25zLm9wdGlvbnNbaV1bMV0sXG4gICAgICAgICAgICAgICAgY2hlY2tlZCA6IHRoaXMubW9kZWwuZ2V0KHRoaXMuaWQpID09PSB0aGlzLm9wdGlvbnMub3B0aW9uc1tpXVswXSA/IFwiY2hlY2tlZFwiIDogXCJcIlxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIGh0bWw7XG4gICAgfVxuXG59KTtcblxuZXhwb3J0cy5DaGVja1F1ZXN0aW9uID0gZXhwb3J0cy5RdWVzdGlvbi5leHRlbmQoe1xuICAgIGV2ZW50cyA6IHtcbiAgICAgICAgXCJjaGVja2VkXCIgOiBcImNoZWNrZWRcIixcbiAgICB9LFxuXG4gICAgY2hlY2tlZCA6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgLy8gR2V0IGNoZWNrZWRcbiAgICAgICAgdGhpcy5tb2RlbC5zZXQodGhpcy5pZCwgdGhpcy4kKFwiLmNoZWNrYm94XCIpLmhhc0NsYXNzKFwiY2hlY2tlZFwiKSk7XG4gICAgfSxcblxuICAgIHJlbmRlckFuc3dlciA6IGZ1bmN0aW9uKGFuc3dlckVsKSB7XG4gICAgICAgIHZhciBpO1xuICAgICAgICBhbnN3ZXJFbC5hcHBlbmQoJChfLnRlbXBsYXRlKCc8ZGl2IGNsYXNzPVwiY2hlY2tib3ggPCU9Y2hlY2tlZCU+XCI+PCU9dGV4dCU+PC9kaXY+Jywge1xuICAgICAgICAgICAgdGV4dCA6IHRoaXMub3B0aW9ucy50ZXh0LFxuICAgICAgICAgICAgY2hlY2tlZCA6ICh0aGlzLm1vZGVsLmdldCh0aGlzLmlkKSkgPyBcImNoZWNrZWRcIiA6IFwiXCJcbiAgICAgICAgfSkpKTtcbiAgICB9XG5cbn0pO1xuXG5cbmV4cG9ydHMuTXVsdGljaGVja1F1ZXN0aW9uID0gZXhwb3J0cy5RdWVzdGlvbi5leHRlbmQoe1xuICAgIGV2ZW50cyA6IHtcbiAgICAgICAgXCJjaGVja2VkXCIgOiBcImNoZWNrZWRcIixcbiAgICB9LFxuXG4gICAgY2hlY2tlZCA6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgLy8gR2V0IGFsbCBjaGVja2VkXG4gICAgICAgIHZhciB2YWx1ZSA9IFtdO1xuICAgICAgICB2YXIgb3B0cyA9IHRoaXMub3B0aW9ucy5vcHRpb25zO1xuICAgICAgICB0aGlzLiQoXCIuY2hlY2tib3hcIikuZWFjaChmdW5jdGlvbihpbmRleCkge1xuICAgICAgICAgICAgaWYgKCQodGhpcykuaGFzQ2xhc3MoXCJjaGVja2VkXCIpKVxuICAgICAgICAgICAgICAgIHZhbHVlLnB1c2gob3B0c1tpbmRleF1bMF0pO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5tb2RlbC5zZXQodGhpcy5pZCwgdmFsdWUpO1xuICAgIH0sXG5cbiAgICByZW5kZXJBbnN3ZXIgOiBmdW5jdGlvbihhbnN3ZXJFbCkge1xuICAgICAgICB2YXIgaTtcbiAgICAgICAgZm9yICggaSA9IDA7IGkgPCB0aGlzLm9wdGlvbnMub3B0aW9ucy5sZW5ndGg7IGkrKylcbiAgICAgICAgICAgIGFuc3dlckVsLmFwcGVuZCgkKF8udGVtcGxhdGUoJzxkaXYgY2xhc3M9XCJjaGVja2JveCA8JT1jaGVja2VkJT5cIiBkYXRhLXZhbHVlPVwiPCU9cG9zaXRpb24lPlwiPjwlPXRleHQlPjwvZGl2PicsIHtcbiAgICAgICAgICAgICAgICBwb3NpdGlvbiA6IGksXG4gICAgICAgICAgICAgICAgdGV4dCA6IHRoaXMub3B0aW9ucy5vcHRpb25zW2ldWzFdLFxuICAgICAgICAgICAgICAgIGNoZWNrZWQgOiAodGhpcy5tb2RlbC5nZXQodGhpcy5pZCkgJiYgXy5jb250YWlucyh0aGlzLm1vZGVsLmdldCh0aGlzLmlkKSwgdGhpcy5vcHRpb25zLm9wdGlvbnNbaV1bMF0pKSA/IFwiY2hlY2tlZFwiIDogXCJcIlxuICAgICAgICAgICAgfSkpKTtcbiAgICB9XG5cbn0pO1xuXG5leHBvcnRzLlRleHRRdWVzdGlvbiA9IGV4cG9ydHMuUXVlc3Rpb24uZXh0ZW5kKHtcbiAgICByZW5kZXJBbnN3ZXIgOiBmdW5jdGlvbihhbnN3ZXJFbCkge1xuICAgICAgICBpZiAodGhpcy5vcHRpb25zLm11bHRpbGluZSkge1xuICAgICAgICAgICAgYW5zd2VyRWwuaHRtbChfLnRlbXBsYXRlKCc8dGV4dGFyZWEgc3R5bGU9XCJ3aWR0aDo5MCVcIi8+JywgdGhpcykpOyAvLyBUT0RPIG1ha2Ugd2lkdGggcHJvcGVybHlcbiAgICAgICAgICAgIGFuc3dlckVsLmZpbmQoXCJ0ZXh0YXJlYVwiKS52YWwodGhpcy5tb2RlbC5nZXQodGhpcy5pZCkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYW5zd2VyRWwuaHRtbChfLnRlbXBsYXRlKCc8aW5wdXQgdHlwZT1cInRleHRcIi8+JywgdGhpcykpO1xuICAgICAgICAgICAgYW5zd2VyRWwuZmluZChcImlucHV0XCIpLnZhbCh0aGlzLm1vZGVsLmdldCh0aGlzLmlkKSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgZXZlbnRzIDoge1xuICAgICAgICBcImNoYW5nZVwiIDogXCJjaGFuZ2VkXCJcbiAgICB9LFxuICAgIGNoYW5nZWQgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5tb2RlbC5zZXQodGhpcy5pZCwgdGhpcy4kKHRoaXMub3B0aW9ucy5tdWx0aWxpbmUgPyBcInRleHRhcmVhXCIgOiBcImlucHV0XCIpLnZhbCgpKTtcbiAgICB9XG5cbn0pO1xuIiwiIyBGb3JtIHRoYXQgaGFzIHNhdmUgYW5kIGNhbmNlbCBidXR0b25zIHRoYXQgZmlyZSBzYXZlIGFuZCBjYW5jZWwgZXZlbnRzLlxuIyBTYXZlIGV2ZW50IHdpbGwgb25seSBiZSBmaXJlZCBpZiB2YWxpZGF0ZXNcblxubW9kdWxlLmV4cG9ydHMgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZFxuICBpbml0aWFsaXplOiAtPlxuICAgIEBjb250ZW50cyA9IEBvcHRpb25zLmNvbnRlbnRzXG4gICAgQHJlbmRlcigpXG5cbiAgZXZlbnRzOiBcbiAgICAnY2xpY2sgI3NhdmVfYnV0dG9uJzogJ3NhdmUnXG4gICAgJ2NsaWNrICNjYW5jZWxfYnV0dG9uJzogJ2NhbmNlbCdcblxuICB2YWxpZGF0ZTogLT5cbiAgICAjIEdldCBhbGwgdmlzaWJsZSBpdGVtc1xuICAgIGl0ZW1zID0gXy5maWx0ZXIoQGNvbnRlbnRzLCAoYykgLT5cbiAgICAgIGMudmlzaWJsZSBhbmQgYy52YWxpZGF0ZVxuICAgIClcbiAgICByZXR1cm4gbm90IF8uYW55KF8ubWFwKGl0ZW1zLCAoaXRlbSkgLT5cbiAgICAgIGl0ZW0udmFsaWRhdGUoKVxuICAgICkpXG5cbiAgcmVuZGVyOiAtPlxuICAgIEAkZWwuaHRtbCAnJyc8ZGl2IGlkPVwiY29udGVudHNcIj48L2Rpdj5cbiAgICA8ZGl2PlxuICAgICAgICA8YnV0dG9uIGlkPVwic2F2ZV9idXR0b25cIiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJidG4gYnRuLXByaW1hcnkgbWFyZ2luZWRcIj5TYXZlPC9idXR0b24+XG4gICAgICAgICZuYnNwO1xuICAgICAgICA8YnV0dG9uIGlkPVwiY2FuY2VsX2J1dHRvblwiIHR5cGU9XCJidXR0b25cIiBjbGFzcz1cImJ0biBtYXJnaW5lZFwiPkNhbmNlbDwvYnV0dG9uPlxuICAgIDwvZGl2PicnJ1xuICAgIFxuICAgICMgQWRkIGNvbnRlbnRzIChxdWVzdGlvbnMsIG1vc3RseSlcbiAgICBfLmVhY2ggQGNvbnRlbnRzLCAoYykgPT4gQCQoJyNjb250ZW50cycpLmFwcGVuZCBjLiRlbFxuICAgIHRoaXNcblxuICBzYXZlOiAtPlxuICAgIGlmIEB2YWxpZGF0ZSgpXG4gICAgICBAdHJpZ2dlciAnc2F2ZSdcblxuICBjYW5jZWw6IC0+XG4gICAgQHRyaWdnZXIgJ2NhbmNlbCdcbiIsIm1vZHVsZS5leHBvcnRzID0gQmFja2JvbmUuVmlldy5leHRlbmRcbiAgaW5pdGlhbGl6ZTogLT5cbiAgICBAJGVsLmh0bWwgXy50ZW1wbGF0ZSgnJydcbiAgICAgIDxkaXYgY2xhc3M9XCJ3ZWxsIHdlbGwtc21hbGxcIj48JT1odG1sJT48JS10ZXh0JT48L2Rpdj5cbiAgICAgICcnJykoaHRtbDogQG9wdGlvbnMuaHRtbCwgdGV4dDogQG9wdGlvbnMudGV4dClcbiIsIiMgR3JvdXAgb2YgcXVlc3Rpb25zIHdoaWNoIHZhbGlkYXRlIGFzIGEgdW5pdFxuXG5tb2R1bGUuZXhwb3J0cyA9IEJhY2tib25lLlZpZXcuZXh0ZW5kXG4gIGluaXRpYWxpemU6IC0+XG4gICAgQGNvbnRlbnRzID0gQG9wdGlvbnMuY29udGVudHNcbiAgICBAcmVuZGVyKClcblxuICB2YWxpZGF0ZTogLT5cbiAgICAjIEdldCBhbGwgdmlzaWJsZSBpdGVtc1xuICAgIGl0ZW1zID0gXy5maWx0ZXIoQGNvbnRlbnRzLCAoYykgLT5cbiAgICAgIGMudmlzaWJsZSBhbmQgYy52YWxpZGF0ZVxuICAgIClcbiAgICByZXR1cm4gbm90IF8uYW55KF8ubWFwKGl0ZW1zLCAoaXRlbSkgLT5cbiAgICAgIGl0ZW0udmFsaWRhdGUoKVxuICAgICkpXG5cbiAgcmVuZGVyOiAtPlxuICAgIEAkZWwuaHRtbCBcIlwiXG4gICAgXG4gICAgIyBBZGQgY29udGVudHMgKHF1ZXN0aW9ucywgbW9zdGx5KVxuICAgIF8uZWFjaCBAY29udGVudHMsIChjKSA9PiBAJGVsLmFwcGVuZCBjLiRlbFxuXG4gICAgdGhpc1xuIiwiIyBUT0RPIEZpeCB0byBoYXZlIGVkaXRhYmxlIFlZWVktTU0tREQgd2l0aCBjbGljayB0byBwb3B1cCBzY3JvbGxlclxuXG5RdWVzdGlvbiA9IHJlcXVpcmUoJy4vZm9ybS1jb250cm9scycpLlF1ZXN0aW9uXG5cbm1vZHVsZS5leHBvcnRzID0gUXVlc3Rpb24uZXh0ZW5kKFxuICBldmVudHM6XG4gICAgY2hhbmdlOiBcImNoYW5nZWRcIlxuXG4gIGNoYW5nZWQ6IC0+XG4gICAgQG1vZGVsLnNldCBAaWQsIEAkZWwuZmluZChcImlucHV0W25hbWU9XFxcImRhdGVcXFwiXVwiKS52YWwoKVxuXG4gIHJlbmRlckFuc3dlcjogKGFuc3dlckVsKSAtPlxuICAgIGFuc3dlckVsLmh0bWwgXy50ZW1wbGF0ZShcIjxpbnB1dCBjbGFzcz1cXFwibmVlZHNjbGlja1xcXCIgbmFtZT1cXFwiZGF0ZVxcXCIgLz5cIiwgdGhpcylcbiAgICBhbnN3ZXJFbC5maW5kKFwiaW5wdXRcIikudmFsIEBtb2RlbC5nZXQoQGlkKVxuICAgIGFuc3dlckVsLmZpbmQoXCJpbnB1dFwiKS5zY3JvbGxlclxuICAgICAgcHJlc2V0OiBcImRhdGVcIlxuICAgICAgdGhlbWU6IFwiaW9zXCJcbiAgICAgIGRpc3BsYXk6IFwibW9kYWxcIlxuICAgICAgbW9kZTogXCJzY3JvbGxlclwiXG4gICAgICBkYXRlT3JkZXI6IFwieXltbUQgZGRcIlxuICAgICAgZGF0ZUZvcm1hdDogXCJ5eS1tbS1kZFwiXG5cbikiLCJRdWVzdGlvbiA9IHJlcXVpcmUoJy4vZm9ybS1jb250cm9scycpLlF1ZXN0aW9uXG5cbm1vZHVsZS5leHBvcnRzID0gUXVlc3Rpb24uZXh0ZW5kXG4gIHJlbmRlckFuc3dlcjogKGFuc3dlckVsKSAtPlxuICAgIGFuc3dlckVsLmh0bWwgXy50ZW1wbGF0ZShcIjxpbnB1dCB0eXBlPVxcXCJudW1iZXJcXFwiIDwlIGlmIChvcHRpb25zLmRlY2ltYWwpIHslPnN0ZXA9XFxcImFueVxcXCI8JX0lPiAvPlwiLCB0aGlzKVxuICAgIGFuc3dlckVsLmZpbmQoXCJpbnB1dFwiKS52YWwgQG1vZGVsLmdldChAaWQpXG5cbiAgZXZlbnRzOlxuICAgIGNoYW5nZTogXCJjaGFuZ2VkXCJcblxuICB2YWxpZGF0ZUludGVybmFsOiAtPlxuICAgIHZhbCA9IEAkKFwiaW5wdXRcIikudmFsKClcbiAgICBpZiBAb3B0aW9ucy5kZWNpbWFsIGFuZCB2YWwubGVuZ3RoID4gMFxuICAgICAgaWYgcGFyc2VGbG9hdCh2YWwpID09IE5hTlxuICAgICAgICByZXR1cm4gXCJJbnZhbGlkIGRlY2ltYWwgbnVtYmVyXCJcbiAgICBlbHNlIGlmIHZhbC5sZW5ndGggPiAwXG4gICAgICBpZiBub3QgdmFsLm1hdGNoKC9eLT9cXGQrJC8pXG4gICAgICAgIHJldHVybiBcIkludmFsaWQgaW50ZWdlciBudW1iZXJcIlxuICAgIHJldHVybiBudWxsXG5cbiAgY2hhbmdlZDogLT5cbiAgICB2YWwgPSBwYXJzZUZsb2F0KEAkKFwiaW5wdXRcIikudmFsKCkpXG4gICAgaWYgdmFsID09IE5hTlxuICAgICAgdmFsID0gbnVsbFxuICAgIEBtb2RlbC5zZXQgQGlkLCB2YWwgXG4iLCJRdWVzdGlvbiA9IHJlcXVpcmUoJy4vZm9ybS1jb250cm9scycpLlF1ZXN0aW9uXG5cbm1vZHVsZS5leHBvcnRzID0gUXVlc3Rpb24uZXh0ZW5kKFxuICBldmVudHM6XG4gICAgY2hhbmdlOiBcImNoYW5nZWRcIlxuXG4gIHNldE9wdGlvbnM6IChvcHRpb25zKSAtPlxuICAgIEBvcHRpb25zLm9wdGlvbnMgPSBvcHRpb25zXG4gICAgQHJlbmRlcigpXG5cbiAgY2hhbmdlZDogKGUpIC0+XG4gICAgdmFsID0gJChlLnRhcmdldCkudmFsKClcbiAgICBpZiB2YWwgaXMgXCJcIlxuICAgICAgQG1vZGVsLnNldCBAaWQsIG51bGxcbiAgICBlbHNlXG4gICAgICBpbmRleCA9IHBhcnNlSW50KHZhbClcbiAgICAgIHZhbHVlID0gQG9wdGlvbnMub3B0aW9uc1tpbmRleF1bMF1cbiAgICAgIEBtb2RlbC5zZXQgQGlkLCB2YWx1ZVxuXG4gIHJlbmRlckFuc3dlcjogKGFuc3dlckVsKSAtPlxuICAgIGFuc3dlckVsLmh0bWwgXy50ZW1wbGF0ZShcIjxzZWxlY3QgaWQ9XFxcInNvdXJjZV90eXBlXFxcIj48JT1yZW5kZXJEcm9wZG93bk9wdGlvbnMoKSU+PC9zZWxlY3Q+XCIsIHRoaXMpXG4gICAgIyBDaGVjayBpZiBhbnN3ZXIgcHJlc2VudCBcbiAgICBpZiBub3QgXy5hbnkoQG9wdGlvbnMub3B0aW9ucywgKG9wdCkgPT4gb3B0WzBdID09IEBtb2RlbC5nZXQoQGlkKSkgYW5kIEBtb2RlbC5nZXQoQGlkKT9cbiAgICAgIEAkKFwic2VsZWN0XCIpLmF0dHIoJ2Rpc2FibGVkJywgJ2Rpc2FibGVkJylcblxuICByZW5kZXJEcm9wZG93bk9wdGlvbnM6IC0+XG4gICAgaHRtbCA9IFwiXCJcbiAgICBcbiAgICAjIEFkZCBlbXB0eSBvcHRpb25cbiAgICBodG1sICs9IFwiPG9wdGlvbiB2YWx1ZT1cXFwiXFxcIj48L29wdGlvbj5cIlxuICAgIGZvciBpIGluIFswLi4uQG9wdGlvbnMub3B0aW9ucy5sZW5ndGhdXG4gICAgICBodG1sICs9IF8udGVtcGxhdGUoXCI8b3B0aW9uIHZhbHVlPVxcXCI8JT1wb3NpdGlvbiU+XFxcIiA8JT1zZWxlY3RlZCU+PjwlLXRleHQlPjwvb3B0aW9uPlwiLFxuICAgICAgICBwb3NpdGlvbjogaVxuICAgICAgICB0ZXh0OiBAb3B0aW9ucy5vcHRpb25zW2ldWzFdXG4gICAgICAgIHNlbGVjdGVkOiAoaWYgQG1vZGVsLmdldChAaWQpIGlzIEBvcHRpb25zLm9wdGlvbnNbaV1bMF0gdGhlbiBcInNlbGVjdGVkPVxcXCJzZWxlY3RlZFxcXCJcIiBlbHNlIFwiXCIpXG4gICAgICApXG4gICAgcmV0dXJuIGh0bWxcbikiLCJRdWVzdGlvbiA9IHJlcXVpcmUoJy4vZm9ybS1jb250cm9scycpLlF1ZXN0aW9uXG5JbWFnZVBhZ2UgPSByZXF1aXJlICcuLi9wYWdlcy9JbWFnZVBhZ2UnXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgSW1hZ2VRdWVzdGlvbiBleHRlbmRzIFF1ZXN0aW9uXG4gIGV2ZW50czpcbiAgICBcImNsaWNrICNhZGRcIjogXCJhZGRDbGlja1wiXG4gICAgXCJjbGljayAudGh1bWJuYWlsLWltZ1wiOiBcInRodW1ibmFpbENsaWNrXCJcblxuICByZW5kZXJBbnN3ZXI6IChhbnN3ZXJFbCkgLT5cbiAgICAjIFJlbmRlciBpbWFnZSB1c2luZyBpbWFnZSBtYW5hZ2VyXG4gICAgaWYgbm90IEBjdHguaW1hZ2VNYW5hZ2VyXG4gICAgICBhbnN3ZXJFbC5odG1sICcnJzxkaXYgY2xhc3M9XCJ0ZXh0LWVycm9yXCI+SW1hZ2VzIG5vdCBhdmFpbGFibGU8L2Rpdj4nJydcbiAgICBlbHNlXG4gICAgICBpbWFnZSA9IEBtb2RlbC5nZXQoQGlkKVxuXG4gICAgICAjIERldGVybWluZSBpZiBjYW4gYWRkIGltYWdlc1xuICAgICAgbm90U3VwcG9ydGVkID0gZmFsc2VcbiAgICAgIGlmIEBvcHRpb25zLnJlYWRvbmx5XG4gICAgICAgIGNhbkFkZCA9IGZhbHNlXG4gICAgICBlbHNlIGlmIEBjdHguY2FtZXJhIGFuZCBAY3R4LmltYWdlTWFuYWdlci5hZGRJbWFnZVxuICAgICAgICBjYW5BZGQgPSBub3QgaW1hZ2U/ICMgRG9uJ3QgYWxsb3cgYWRkaW5nIG1vcmUgdGhhbiBvbmVcbiAgICAgIGVsc2VcbiAgICAgICAgY2FuQWRkID0gZmFsc2VcbiAgICAgICAgbm90U3VwcG9ydGVkID0gbm90IGltYWdlXG5cbiAgICAgICMgRGV0ZXJtaW5lIGlmIHdlIG5lZWQgdG8gdGVsbCB1c2VyIHRoYXQgbm8gaW1hZ2UgaXMgYXZhaWxhYmxlXG4gICAgICBub0ltYWdlID0gbm90IGNhbkFkZCBhbmQgbm90IGltYWdlIGFuZCBub3Qgbm90U3VwcG9ydGVkXG5cbiAgICAgICMgUmVuZGVyIGltYWdlc1xuICAgICAgYW5zd2VyRWwuaHRtbCB0ZW1wbGF0ZXNbJ2Zvcm1zL0ltYWdlUXVlc3Rpb24nXShpbWFnZTogaW1hZ2UsIGNhbkFkZDogY2FuQWRkLCBub0ltYWdlOiBub0ltYWdlLCBub3RTdXBwb3J0ZWQ6IG5vdFN1cHBvcnRlZClcblxuICAgICAgIyBTZXQgc291cmNlXG4gICAgICBpZiBpbWFnZVxuICAgICAgICBAc2V0VGh1bWJuYWlsVXJsKGltYWdlLmlkKVxuICAgIFxuICBzZXRUaHVtYm5haWxVcmw6IChpZCkgLT5cbiAgICBzdWNjZXNzID0gKHVybCkgPT5cbiAgICAgIEAkKFwiI1wiICsgaWQpLmF0dHIoXCJzcmNcIiwgdXJsKVxuICAgIEBjdHguaW1hZ2VNYW5hZ2VyLmdldEltYWdlVGh1bWJuYWlsVXJsIGlkLCBzdWNjZXNzLCBAZXJyb3JcblxuICBhZGRDbGljazogLT5cbiAgICAjIENhbGwgY2FtZXJhIHRvIGdldCBpbWFnZVxuICAgIHN1Y2Nlc3MgPSAodXJsKSA9PlxuICAgICAgIyBBZGQgaW1hZ2VcbiAgICAgIEBjdHguaW1hZ2VNYW5hZ2VyLmFkZEltYWdlKHVybCwgKGlkKSA9PlxuICAgICAgICAjIEFkZCB0byBtb2RlbFxuICAgICAgICBAbW9kZWwuc2V0KEBpZCwgeyBpZDogaWQgfSlcbiAgICAgICwgQGN0eC5lcnJvcilcbiAgICBAY3R4LmNhbWVyYS50YWtlUGljdHVyZSBzdWNjZXNzLCAoZXJyKSAtPlxuICAgICAgYWxlcnQoXCJGYWlsZWQgdG8gdGFrZSBwaWN0dXJlXCIpXG5cbiAgdGh1bWJuYWlsQ2xpY2s6IChldikgLT5cbiAgICBpZCA9IGV2LmN1cnJlbnRUYXJnZXQuaWRcblxuICAgICMgQ3JlYXRlIG9uUmVtb3ZlIGNhbGxiYWNrXG4gICAgb25SZW1vdmUgPSAoKSA9PiBcbiAgICAgIEBtb2RlbC5zZXQoQGlkLCBudWxsKVxuXG4gICAgQGN0eC5wYWdlci5vcGVuUGFnZShJbWFnZVBhZ2UsIHsgaWQ6IGlkLCBvblJlbW92ZTogb25SZW1vdmUgfSkiLCJRdWVzdGlvbiA9IHJlcXVpcmUoJy4vZm9ybS1jb250cm9scycpLlF1ZXN0aW9uXG5JbWFnZVBhZ2UgPSByZXF1aXJlICcuLi9wYWdlcy9JbWFnZVBhZ2UnXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgSW1hZ2VzUXVlc3Rpb24gZXh0ZW5kcyBRdWVzdGlvblxuICBldmVudHM6XG4gICAgXCJjbGljayAjYWRkXCI6IFwiYWRkQ2xpY2tcIlxuICAgIFwiY2xpY2sgLnRodW1ibmFpbC1pbWdcIjogXCJ0aHVtYm5haWxDbGlja1wiXG5cbiAgcmVuZGVyQW5zd2VyOiAoYW5zd2VyRWwpIC0+XG4gICAgIyBSZW5kZXIgaW1hZ2UgdXNpbmcgaW1hZ2UgbWFuYWdlclxuICAgIGlmIG5vdCBAY3R4LmltYWdlTWFuYWdlclxuICAgICAgYW5zd2VyRWwuaHRtbCAnJyc8ZGl2IGNsYXNzPVwidGV4dC1lcnJvclwiPkltYWdlcyBub3QgYXZhaWxhYmxlPC9kaXY+JycnXG4gICAgZWxzZVxuICAgICAgaW1hZ2VzID0gQG1vZGVsLmdldChAaWQpXG5cbiAgICAgICMgRGV0ZXJtaW5lIGlmIGNhbiBhZGQgaW1hZ2VzXG4gICAgICBub3RTdXBwb3J0ZWQgPSBmYWxzZVxuICAgICAgaWYgQG9wdGlvbnMucmVhZG9ubHlcbiAgICAgICAgY2FuQWRkID0gZmFsc2VcbiAgICAgIGVsc2UgaWYgQGN0eC5jYW1lcmEgYW5kIEBjdHguaW1hZ2VNYW5hZ2VyLmFkZEltYWdlXG4gICAgICAgIGNhbkFkZCA9IHRydWVcbiAgICAgIGVsc2VcbiAgICAgICAgY2FuQWRkID0gZmFsc2VcbiAgICAgICAgbm90U3VwcG9ydGVkID0gbm90IGltYWdlcyBvciBpbWFnZXMubGVuZ3RoID09IDBcblxuICAgICAgIyBEZXRlcm1pbmUgaWYgd2UgbmVlZCB0byB0ZWxsIHVzZXIgdGhhdCBubyBpbWFnZSBhcmUgYXZhaWxhYmxlXG4gICAgICBub0ltYWdlID0gbm90IGNhbkFkZCBhbmQgKG5vdCBpbWFnZXMgb3IgaW1hZ2VzLmxlbmd0aCA9PSAwKSBhbmQgbm90IG5vdFN1cHBvcnRlZFxuXG4gICAgICAjIFJlbmRlciBpbWFnZXNcbiAgICAgIGFuc3dlckVsLmh0bWwgdGVtcGxhdGVzWydmb3Jtcy9JbWFnZXNRdWVzdGlvbiddKGltYWdlczogaW1hZ2VzLCBjYW5BZGQ6IGNhbkFkZCwgbm9JbWFnZTogbm9JbWFnZSwgbm90U3VwcG9ydGVkOiBub3RTdXBwb3J0ZWQpXG5cbiAgICAgICMgU2V0IHNvdXJjZXNcbiAgICAgIGlmIGltYWdlc1xuICAgICAgICBmb3IgaW1hZ2UgaW4gaW1hZ2VzXG4gICAgICAgICAgQHNldFRodW1ibmFpbFVybChpbWFnZS5pZClcbiAgICBcbiAgc2V0VGh1bWJuYWlsVXJsOiAoaWQpIC0+XG4gICAgc3VjY2VzcyA9ICh1cmwpID0+XG4gICAgICBAJChcIiNcIiArIGlkKS5hdHRyKFwic3JjXCIsIHVybClcbiAgICBAY3R4LmltYWdlTWFuYWdlci5nZXRJbWFnZVRodW1ibmFpbFVybCBpZCwgc3VjY2VzcywgQGVycm9yXG5cbiAgYWRkQ2xpY2s6IC0+XG4gICAgIyBDYWxsIGNhbWVyYSB0byBnZXQgaW1hZ2VcbiAgICBzdWNjZXNzID0gKHVybCkgPT5cbiAgICAgICMgQWRkIGltYWdlXG4gICAgICBAY3R4LmltYWdlTWFuYWdlci5hZGRJbWFnZSh1cmwsIChpZCkgPT5cbiAgICAgICAgIyBBZGQgdG8gbW9kZWxcbiAgICAgICAgaW1hZ2VzID0gQG1vZGVsLmdldChAaWQpIHx8IFtdXG4gICAgICAgIGltYWdlcy5wdXNoIHsgaWQ6IGlkIH1cbiAgICAgICAgQG1vZGVsLnNldChAaWQsIGltYWdlcylcblxuICAgICAgLCBAY3R4LmVycm9yKVxuICAgIEBjdHguY2FtZXJhLnRha2VQaWN0dXJlIHN1Y2Nlc3MsIChlcnIpIC0+XG4gICAgICBhbGVydChcIkZhaWxlZCB0byB0YWtlIHBpY3R1cmVcIilcblxuICB0aHVtYm5haWxDbGljazogKGV2KSAtPlxuICAgIGlkID0gZXYuY3VycmVudFRhcmdldC5pZFxuXG4gICAgIyBDcmVhdGUgb25SZW1vdmUgY2FsbGJhY2tcbiAgICBvblJlbW92ZSA9ICgpID0+IFxuICAgICAgaW1hZ2VzID0gQG1vZGVsLmdldChAaWQpIHx8IFtdXG4gICAgICBpbWFnZXMgPSBfLnJlamVjdCBpbWFnZXMsIChpbWcpID0+XG4gICAgICAgIGltZy5pZCA9PSBpZFxuICAgICAgQG1vZGVsLnNldChAaWQsIGltYWdlcykgICAgICBcblxuICAgIEBjdHgucGFnZXIub3BlblBhZ2UoSW1hZ2VQYWdlLCB7IGlkOiBpZCwgb25SZW1vdmU6IG9uUmVtb3ZlIH0pIiwiUXVlc3Rpb24gPSByZXF1aXJlKCcuL2Zvcm0tY29udHJvbHMnKS5RdWVzdGlvblxuU291cmNlTGlzdFBhZ2UgPSByZXF1aXJlICcuLi9wYWdlcy9Tb3VyY2VMaXN0UGFnZSdcbnNvdXJjZWNvZGVzID0gcmVxdWlyZSAnLi4vc291cmNlY29kZXMnXG5cbm1vZHVsZS5leHBvcnRzID0gUXVlc3Rpb24uZXh0ZW5kXG4gIHJlbmRlckFuc3dlcjogKGFuc3dlckVsKSAtPlxuICAgIGFuc3dlckVsLmh0bWwgJycnXG4gICAgICA8ZGl2IGNsYXNzPVwiaW5wdXQtYXBwZW5kXCI+XG4gICAgICAgIDxpbnB1dCB0eXBlPVwidGVsXCI+XG4gICAgICAgIDxidXR0b24gY2xhc3M9XCJidG5cIiBpZD1cInNlbGVjdFwiIHR5cGU9XCJidXR0b25cIj5TZWxlY3Q8L2J1dHRvbj5cbiAgICAgIDwvZGl2PicnJ1xuICAgIGFuc3dlckVsLmZpbmQoXCJpbnB1dFwiKS52YWwgQG1vZGVsLmdldChAaWQpXG5cbiAgZXZlbnRzOlxuICAgICdjaGFuZ2UnIDogJ2NoYW5nZWQnXG4gICAgJ2NsaWNrICNzZWxlY3QnIDogJ3NlbGVjdFNvdXJjZSdcblxuICBjaGFuZ2VkOiAtPlxuICAgIEBtb2RlbC5zZXQgQGlkLCBAJChcImlucHV0XCIpLnZhbCgpXG5cbiAgc2VsZWN0U291cmNlOiAtPlxuICAgIEBjdHgucGFnZXIub3BlblBhZ2UgU291cmNlTGlzdFBhZ2UsIFxuICAgICAgeyBvblNlbGVjdDogKHNvdXJjZSk9PlxuICAgICAgICBAbW9kZWwuc2V0IEBpZCwgc291cmNlLmNvZGVcbiAgICAgIH1cblxuICB2YWxpZGF0ZUludGVybmFsOiAtPlxuICAgIGlmIG5vdCBAJChcImlucHV0XCIpLnZhbCgpXG4gICAgICByZXR1cm4gZmFsc2VcblxuICAgIGlmIHNvdXJjZWNvZGVzLmlzVmFsaWQoQCQoXCJpbnB1dFwiKS52YWwoKSlcbiAgICAgIHJldHVybiBmYWxzZVxuXG4gICAgcmV0dXJuIFwiSW52YWxpZCBTb3VyY2VcIlxuXG4iLCIjIEltcHJvdmVkIGxvY2F0aW9uIGZpbmRlclxuY2xhc3MgTG9jYXRpb25GaW5kZXJcbiAgY29uc3RydWN0b3I6IC0+XG4gICAgXy5leHRlbmQgQCwgQmFja2JvbmUuRXZlbnRzXG4gICAgXG4gIGdldExvY2F0aW9uOiAtPlxuICAgICMgQm90aCBmYWlsdXJlcyBhcmUgcmVxdWlyZWQgdG8gdHJpZ2dlciBlcnJvclxuICAgIGxvY2F0aW9uRXJyb3IgPSBfLmFmdGVyIDIsID0+XG4gICAgICBAdHJpZ2dlciAnZXJyb3InXG5cbiAgICBoaWdoQWNjdXJhY3lGaXJlZCA9IGZhbHNlXG5cbiAgICBsb3dBY2N1cmFjeSA9IChwb3MpID0+XG4gICAgICBpZiBub3QgaGlnaEFjY3VyYWN5RmlyZWRcbiAgICAgICAgQHRyaWdnZXIgJ2ZvdW5kJywgcG9zXG5cbiAgICBoaWdoQWNjdXJhY3kgPSAocG9zKSA9PlxuICAgICAgaGlnaEFjY3VyYWN5RmlyZWQgPSB0cnVlXG4gICAgICBAdHJpZ2dlciAnZm91bmQnLCBwb3NcblxuICAgICMgR2V0IGJvdGggaGlnaCBhbmQgbG93IGFjY3VyYWN5LCBhcyBsb3cgaXMgc3VmZmljaWVudCBmb3IgaW5pdGlhbCBkaXNwbGF5XG4gICAgbmF2aWdhdG9yLmdlb2xvY2F0aW9uLmdldEN1cnJlbnRQb3NpdGlvbihsb3dBY2N1cmFjeSwgbG9jYXRpb25FcnJvciwge1xuICAgICAgICBtYXhpbXVtQWdlIDogMzYwMCoyNCxcbiAgICAgICAgdGltZW91dCA6IDEwMDAwLFxuICAgICAgICBlbmFibGVIaWdoQWNjdXJhY3kgOiBmYWxzZVxuICAgIH0pXG5cbiAgICBuYXZpZ2F0b3IuZ2VvbG9jYXRpb24uZ2V0Q3VycmVudFBvc2l0aW9uKGhpZ2hBY2N1cmFjeSwgbG9jYXRpb25FcnJvciwge1xuICAgICAgICBtYXhpbXVtQWdlIDogMzYwMCxcbiAgICAgICAgdGltZW91dCA6IDMwMDAwLFxuICAgICAgICBlbmFibGVIaWdoQWNjdXJhY3kgOiB0cnVlXG4gICAgfSlcblxuICBzdGFydFdhdGNoOiAtPlxuICAgICMgQWxsb3cgb25lIHdhdGNoIGF0IG1vc3RcbiAgICBpZiBAbG9jYXRpb25XYXRjaElkP1xuICAgICAgQHN0b3BXYXRjaCgpXG5cbiAgICBoaWdoQWNjdXJhY3lGaXJlZCA9IGZhbHNlXG4gICAgbG93QWNjdXJhY3lGaXJlZCA9IGZhbHNlXG5cbiAgICBsb3dBY2N1cmFjeSA9IChwb3MpID0+XG4gICAgICBpZiBub3QgaGlnaEFjY3VyYWN5RmlyZWRcbiAgICAgICAgbG93QWNjdXJhY3lGaXJlZCA9IHRydWVcbiAgICAgICAgQHRyaWdnZXIgJ2ZvdW5kJywgcG9zXG5cbiAgICBoaWdoQWNjdXJhY3kgPSAocG9zKSA9PlxuICAgICAgaGlnaEFjY3VyYWN5RmlyZWQgPSB0cnVlXG4gICAgICBAdHJpZ2dlciAnZm91bmQnLCBwb3NcblxuICAgIGVycm9yID0gKGVycm9yKSA9PlxuICAgICAgY29uc29sZS5sb2cgXCIjIyMgZXJyb3IgXCJcbiAgICAgICMgTm8gZXJyb3IgaWYgZmlyZWQgb25jZVxuICAgICAgaWYgbm90IGxvd0FjY3VyYWN5RmlyZWQgYW5kIG5vdCBoaWdoQWNjdXJhY3lGaXJlZFxuICAgICAgICBAdHJpZ2dlciAnZXJyb3InLCBlcnJvclxuXG4gICAgIyBGaXJlIGluaXRpYWwgbG93LWFjY3VyYWN5IG9uZVxuICAgIG5hdmlnYXRvci5nZW9sb2NhdGlvbi5nZXRDdXJyZW50UG9zaXRpb24obG93QWNjdXJhY3ksIGVycm9yLCB7XG4gICAgICAgIG1heGltdW1BZ2UgOiAzNjAwKjI0LFxuICAgICAgICB0aW1lb3V0IDogMTAwMDAsXG4gICAgICAgIGVuYWJsZUhpZ2hBY2N1cmFjeSA6IGZhbHNlXG4gICAgfSlcblxuICAgIEBsb2NhdGlvbldhdGNoSWQgPSBuYXZpZ2F0b3IuZ2VvbG9jYXRpb24ud2F0Y2hQb3NpdGlvbihoaWdoQWNjdXJhY3ksIGVycm9yLCB7XG4gICAgICAgIG1heGltdW1BZ2UgOiAzMDAwLFxuICAgICAgICBlbmFibGVIaWdoQWNjdXJhY3kgOiB0cnVlXG4gICAgfSkgIFxuXG4gIHN0b3BXYXRjaDogLT5cbiAgICBpZiBAbG9jYXRpb25XYXRjaElkP1xuICAgICAgbmF2aWdhdG9yLmdlb2xvY2F0aW9uLmNsZWFyV2F0Y2goQGxvY2F0aW9uV2F0Y2hJZClcbiAgICAgIEBsb2NhdGlvbldhdGNoSWQgPSB1bmRlZmluZWRcblxuXG5tb2R1bGUuZXhwb3J0cyA9IExvY2F0aW9uRmluZGVyICAiLCJjbGFzcyBQYWdlIGV4dGVuZHMgQmFja2JvbmUuVmlld1xuICBjb25zdHJ1Y3RvcjogKGN0eCwgb3B0aW9ucz17fSkgLT5cbiAgICBzdXBlcihvcHRpb25zKVxuICAgIEBjdHggPSBjdHhcblxuICAgICMgTWl4IGluIGNvbnRleHQgZm9yIGNvbnZlbmllbmNlXG4gICAgXy5leHRlbmQoQCwgY3R4KSBcblxuICAgICMgU3RvcmUgc3Vidmlld3NcbiAgICBAX3N1YnZpZXdzID0gW11cblxuICAgICMgU2V0dXAgZGVmYXVsdCBidXR0b24gYmFyXG4gICAgQGJ1dHRvbkJhciA9IG5ldyBCdXR0b25CYXIoKVxuXG4gICAgIyBTZXR1cCBkZWZhdWx0IGNvbnRleHQgbWVudVxuICAgIEBjb250ZXh0TWVudSA9IG5ldyBDb250ZXh0TWVudSgpXG5cbiAgY2xhc3NOYW1lOiBcInBhZ2VcIlxuICBjcmVhdGU6IC0+XG4gIGFjdGl2YXRlOiAtPlxuICBkZWFjdGl2YXRlOiAtPlxuICBkZXN0cm95OiAtPlxuICByZW1vdmU6IC0+XG4gICAgQHJlbW92ZVN1YnZpZXdzKClcbiAgICBzdXBlcigpXG5cbiAgZ2V0VGl0bGU6IC0+IEB0aXRsZVxuXG4gIHNldFRpdGxlOiAodGl0bGUpIC0+XG4gICAgQHRpdGxlID0gdGl0bGVcbiAgICBAdHJpZ2dlciAnY2hhbmdlOnRpdGxlJ1xuXG4gIGFkZFN1YnZpZXc6ICh2aWV3KSAtPlxuICAgIEBfc3Vidmlld3MucHVzaCh2aWV3KVxuXG4gIHJlbW92ZVN1YnZpZXdzOiAtPlxuICAgIGZvciBzdWJ2aWV3IGluIEBfc3Vidmlld3NcbiAgICAgIHN1YnZpZXcucmVtb3ZlKClcblxuICBnZXRCdXR0b25CYXI6IC0+XG4gICAgcmV0dXJuIEBidXR0b25CYXJcblxuICBnZXRDb250ZXh0TWVudTogLT5cbiAgICByZXR1cm4gQGNvbnRleHRNZW51XG5cbiAgc2V0dXBCdXR0b25CYXI6IChpdGVtcykgLT5cbiAgICAjIFNldHVwIGJ1dHRvbiBiYXJcbiAgICBAYnV0dG9uQmFyLnNldHVwKGl0ZW1zKVxuXG4gIHNldHVwQ29udGV4dE1lbnU6IChpdGVtcykgLT5cbiAgICAjIFNldHVwIGNvbnRleHQgbWVudVxuICAgIEBjb250ZXh0TWVudS5zZXR1cChpdGVtcylcblxuIyBTdGFuZGFyZCBidXR0b24gYmFyLiBFYWNoIGl0ZW1cbiMgaGFzIG9wdGlvbmFsIFwidGV4dFwiLCBvcHRpb25hbCBcImljb25cIiBhbmQgXCJjbGlja1wiIChhY3Rpb24pLlxuIyBGb3Igc3VibWVudSwgYWRkIGFycmF5IHRvIFwibWVudVwiLiBPbmUgbGV2ZWwgbmVzdGluZyBvbmx5LlxuY2xhc3MgQnV0dG9uQmFyIGV4dGVuZHMgQmFja2JvbmUuVmlld1xuICBldmVudHM6IFxuICAgIFwiY2xpY2sgLm1lbnVpdGVtXCIgOiBcImNsaWNrTWVudUl0ZW1cIlxuXG4gIHNldHVwOiAoaXRlbXMpIC0+XG4gICAgQGl0ZW1zID0gaXRlbXNcbiAgICBAaXRlbU1hcCA9IHt9XG5cbiAgICAjIEFkZCBpZCB0byBhbGwgaXRlbXMgaWYgbm90IHByZXNlbnRcbiAgICBpZCA9IDFcbiAgICBmb3IgaXRlbSBpbiBpdGVtc1xuICAgICAgaWYgbm90IGl0ZW0uaWQ/XG4gICAgICAgIGl0ZW0uaWQgPSBpZFxuICAgICAgICBpZD1pZCsxXG4gICAgICBAaXRlbU1hcFtpdGVtLmlkXSA9IGl0ZW1cblxuICAgICAgIyBBZGQgdG8gc3VibWVudVxuICAgICAgaWYgaXRlbS5tZW51XG4gICAgICAgIGZvciBzdWJpdGVtIGluIGl0ZW0ubWVudVxuICAgICAgICAgIGlmIG5vdCBzdWJpdGVtLmlkP1xuICAgICAgICAgICAgc3ViaXRlbS5pZCA9IGlkLnRvU3RyaW5nKClcbiAgICAgICAgICAgIGlkPWlkKzFcbiAgICAgICAgICBAaXRlbU1hcFtzdWJpdGVtLmlkXSA9IHN1Yml0ZW1cblxuICAgIEByZW5kZXIoKVxuXG4gIHJlbmRlcjogLT5cbiAgICBAJGVsLmh0bWwgdGVtcGxhdGVzWydCdXR0b25CYXInXShpdGVtczogQGl0ZW1zKVxuXG4gIGNsaWNrTWVudUl0ZW06IChlKSAtPlxuICAgIGlkID0gZS5jdXJyZW50VGFyZ2V0LmlkXG4gICAgaXRlbSA9IEBpdGVtTWFwW2lkXVxuICAgIGlmIGl0ZW0uY2xpY2s/XG4gICAgICBpdGVtLmNsaWNrKClcblxuIyBDb250ZXh0IG1lbnUgdG8gZ28gaW4gc2xpZGUgbWVudVxuIyBTdGFuZGFyZCBidXR0b24gYmFyLiBFYWNoIGl0ZW0gXCJ0ZXh0XCIsIG9wdGlvbmFsIFwiZ2x5cGhcIiAoYm9vdHN0cmFwIGdseXBoIHdpdGhvdXQgaWNvbi0gcHJlZml4KSBhbmQgXCJjbGlja1wiIChhY3Rpb24pLlxuY2xhc3MgQ29udGV4dE1lbnUgZXh0ZW5kcyBCYWNrYm9uZS5WaWV3XG4gIGV2ZW50czogXG4gICAgXCJjbGljayAubWVudWl0ZW1cIiA6IFwiY2xpY2tNZW51SXRlbVwiXG5cbiAgc2V0dXA6IChpdGVtcykgLT5cbiAgICBAaXRlbXMgPSBpdGVtc1xuICAgIEBpdGVtTWFwID0ge31cblxuICAgICMgQWRkIGlkIHRvIGFsbCBpdGVtcyBpZiBub3QgcHJlc2VudFxuICAgIGlkID0gMVxuICAgIGZvciBpdGVtIGluIGl0ZW1zXG4gICAgICBpZiBub3QgaXRlbS5pZD9cbiAgICAgICAgaXRlbS5pZCA9IGlkXG4gICAgICAgIGlkPWlkKzFcbiAgICAgIEBpdGVtTWFwW2l0ZW0uaWRdID0gaXRlbVxuXG4gICAgQHJlbmRlcigpXG5cbiAgcmVuZGVyOiAtPlxuICAgIEAkZWwuaHRtbCB0ZW1wbGF0ZXNbJ0NvbnRleHRNZW51J10oaXRlbXM6IEBpdGVtcylcblxuICBjbGlja01lbnVJdGVtOiAoZSkgLT5cbiAgICBpZCA9IGUuY3VycmVudFRhcmdldC5pZFxuICAgIGl0ZW0gPSBAaXRlbU1hcFtpZF1cbiAgICBpZiBpdGVtLmNsaWNrP1xuICAgICAgaXRlbS5jbGljaygpXG5cbm1vZHVsZS5leHBvcnRzID0gUGFnZSIsImV4cG9ydHMuc2VxVG9Db2RlID0gKHNlcSkgLT5cbiAgIyBHZXQgc3RyaW5nIG9mIHNlcSBudW1iZXJcbiAgc3RyID0gXCJcIiArIHNlcVxuXG4gIHN1bSA9IDBcbiAgZm9yIGkgaW4gWzAuLi5zdHIubGVuZ3RoXVxuICAgIGRpZ2l0ID0gcGFyc2VJbnQoc3RyW3N0ci5sZW5ndGgtMS1pXSlcbiAgICBpZiBpJTMgPT0gMFxuICAgICAgc3VtICs9IDcgKiBkaWdpdFxuICAgIGlmIGklMyA9PSAxXG4gICAgICBzdW0gKz0gMyAqIGRpZ2l0XG4gICAgaWYgaSUzID09IDJcbiAgICAgIHN1bSArPSAgZGlnaXRcbiAgcmV0dXJuIHN0ciArIChzdW0gJSAxMClcblxuZXhwb3J0cy5pc1ZhbGlkID0gKGNvZGUpIC0+XG4gIHNlcSA9IHBhcnNlSW50KGNvZGUuc3Vic3RyaW5nKDAsIGNvZGUubGVuZ3RoIC0gMSkpXG5cbiAgcmV0dXJuIGV4cG9ydHMuc2VxVG9Db2RlKHNlcSkgPT0gY29kZSIsIi8vIFRPRE8gYWRkIGxpY2Vuc2VcblxuTG9jYWxDb2xsZWN0aW9uID0ge307XG5FSlNPTiA9IHJlcXVpcmUoXCIuL0VKU09OXCIpO1xuXG4vLyBMaWtlIF8uaXNBcnJheSwgYnV0IGRvZXNuJ3QgcmVnYXJkIHBvbHlmaWxsZWQgVWludDhBcnJheXMgb24gb2xkIGJyb3dzZXJzIGFzXG4vLyBhcnJheXMuXG52YXIgaXNBcnJheSA9IGZ1bmN0aW9uICh4KSB7XG4gIHJldHVybiBfLmlzQXJyYXkoeCkgJiYgIUVKU09OLmlzQmluYXJ5KHgpO1xufTtcblxudmFyIF9hbnlJZkFycmF5ID0gZnVuY3Rpb24gKHgsIGYpIHtcbiAgaWYgKGlzQXJyYXkoeCkpXG4gICAgcmV0dXJuIF8uYW55KHgsIGYpO1xuICByZXR1cm4gZih4KTtcbn07XG5cbnZhciBfYW55SWZBcnJheVBsdXMgPSBmdW5jdGlvbiAoeCwgZikge1xuICBpZiAoZih4KSlcbiAgICByZXR1cm4gdHJ1ZTtcbiAgcmV0dXJuIGlzQXJyYXkoeCkgJiYgXy5hbnkoeCwgZik7XG59O1xuXG52YXIgaGFzT3BlcmF0b3JzID0gZnVuY3Rpb24odmFsdWVTZWxlY3Rvcikge1xuICB2YXIgdGhlc2VBcmVPcGVyYXRvcnMgPSB1bmRlZmluZWQ7XG4gIGZvciAodmFyIHNlbEtleSBpbiB2YWx1ZVNlbGVjdG9yKSB7XG4gICAgdmFyIHRoaXNJc09wZXJhdG9yID0gc2VsS2V5LnN1YnN0cigwLCAxKSA9PT0gJyQnO1xuICAgIGlmICh0aGVzZUFyZU9wZXJhdG9ycyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGVzZUFyZU9wZXJhdG9ycyA9IHRoaXNJc09wZXJhdG9yO1xuICAgIH0gZWxzZSBpZiAodGhlc2VBcmVPcGVyYXRvcnMgIT09IHRoaXNJc09wZXJhdG9yKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbmNvbnNpc3RlbnQgc2VsZWN0b3I6IFwiICsgdmFsdWVTZWxlY3Rvcik7XG4gICAgfVxuICB9XG4gIHJldHVybiAhIXRoZXNlQXJlT3BlcmF0b3JzOyAgLy8ge30gaGFzIG5vIG9wZXJhdG9yc1xufTtcblxudmFyIGNvbXBpbGVWYWx1ZVNlbGVjdG9yID0gZnVuY3Rpb24gKHZhbHVlU2VsZWN0b3IpIHtcbiAgaWYgKHZhbHVlU2VsZWN0b3IgPT0gbnVsbCkgeyAgLy8gdW5kZWZpbmVkIG9yIG51bGxcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICByZXR1cm4gX2FueUlmQXJyYXkodmFsdWUsIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiB4ID09IG51bGw7ICAvLyB1bmRlZmluZWQgb3IgbnVsbFxuICAgICAgfSk7XG4gICAgfTtcbiAgfVxuXG4gIC8vIFNlbGVjdG9yIGlzIGEgbm9uLW51bGwgcHJpbWl0aXZlIChhbmQgbm90IGFuIGFycmF5IG9yIFJlZ0V4cCBlaXRoZXIpLlxuICBpZiAoIV8uaXNPYmplY3QodmFsdWVTZWxlY3RvcikpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICByZXR1cm4gX2FueUlmQXJyYXkodmFsdWUsIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiB4ID09PSB2YWx1ZVNlbGVjdG9yO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfVxuXG4gIGlmICh2YWx1ZVNlbGVjdG9yIGluc3RhbmNlb2YgUmVnRXhwKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIHJldHVybiBfYW55SWZBcnJheSh2YWx1ZSwgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlU2VsZWN0b3IudGVzdCh4KTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH1cblxuICAvLyBBcnJheXMgbWF0Y2ggZWl0aGVyIGlkZW50aWNhbCBhcnJheXMgb3IgYXJyYXlzIHRoYXQgY29udGFpbiBpdCBhcyBhIHZhbHVlLlxuICBpZiAoaXNBcnJheSh2YWx1ZVNlbGVjdG9yKSkge1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIGlmICghaXNBcnJheSh2YWx1ZSkpXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIHJldHVybiBfYW55SWZBcnJheVBsdXModmFsdWUsIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiBMb2NhbENvbGxlY3Rpb24uX2YuX2VxdWFsKHZhbHVlU2VsZWN0b3IsIHgpO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfVxuXG4gIC8vIEl0J3MgYW4gb2JqZWN0LCBidXQgbm90IGFuIGFycmF5IG9yIHJlZ2V4cC5cbiAgaWYgKGhhc09wZXJhdG9ycyh2YWx1ZVNlbGVjdG9yKSkge1xuICAgIHZhciBvcGVyYXRvckZ1bmN0aW9ucyA9IFtdO1xuICAgIF8uZWFjaCh2YWx1ZVNlbGVjdG9yLCBmdW5jdGlvbiAob3BlcmFuZCwgb3BlcmF0b3IpIHtcbiAgICAgIGlmICghXy5oYXMoVkFMVUVfT1BFUkFUT1JTLCBvcGVyYXRvcikpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlVucmVjb2duaXplZCBvcGVyYXRvcjogXCIgKyBvcGVyYXRvcik7XG4gICAgICBvcGVyYXRvckZ1bmN0aW9ucy5wdXNoKFZBTFVFX09QRVJBVE9SU1tvcGVyYXRvcl0oXG4gICAgICAgIG9wZXJhbmQsIHZhbHVlU2VsZWN0b3IuJG9wdGlvbnMpKTtcbiAgICB9KTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICByZXR1cm4gXy5hbGwob3BlcmF0b3JGdW5jdGlvbnMsIGZ1bmN0aW9uIChmKSB7XG4gICAgICAgIHJldHVybiBmKHZhbHVlKTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH1cblxuICAvLyBJdCdzIGEgbGl0ZXJhbDsgY29tcGFyZSB2YWx1ZSAob3IgZWxlbWVudCBvZiB2YWx1ZSBhcnJheSkgZGlyZWN0bHkgdG8gdGhlXG4gIC8vIHNlbGVjdG9yLlxuICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgcmV0dXJuIF9hbnlJZkFycmF5KHZhbHVlLCBmdW5jdGlvbiAoeCkge1xuICAgICAgcmV0dXJuIExvY2FsQ29sbGVjdGlvbi5fZi5fZXF1YWwodmFsdWVTZWxlY3RvciwgeCk7XG4gICAgfSk7XG4gIH07XG59O1xuXG4vLyBYWFggY2FuIGZhY3RvciBvdXQgY29tbW9uIGxvZ2ljIGJlbG93XG52YXIgTE9HSUNBTF9PUEVSQVRPUlMgPSB7XG4gIFwiJGFuZFwiOiBmdW5jdGlvbihzdWJTZWxlY3Rvcikge1xuICAgIGlmICghaXNBcnJheShzdWJTZWxlY3RvcikgfHwgXy5pc0VtcHR5KHN1YlNlbGVjdG9yKSlcbiAgICAgIHRocm93IEVycm9yKFwiJGFuZC8kb3IvJG5vciBtdXN0IGJlIG5vbmVtcHR5IGFycmF5XCIpO1xuICAgIHZhciBzdWJTZWxlY3RvckZ1bmN0aW9ucyA9IF8ubWFwKFxuICAgICAgc3ViU2VsZWN0b3IsIGNvbXBpbGVEb2N1bWVudFNlbGVjdG9yKTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGRvYykge1xuICAgICAgcmV0dXJuIF8uYWxsKHN1YlNlbGVjdG9yRnVuY3Rpb25zLCBmdW5jdGlvbiAoZikge1xuICAgICAgICByZXR1cm4gZihkb2MpO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSxcblxuICBcIiRvclwiOiBmdW5jdGlvbihzdWJTZWxlY3Rvcikge1xuICAgIGlmICghaXNBcnJheShzdWJTZWxlY3RvcikgfHwgXy5pc0VtcHR5KHN1YlNlbGVjdG9yKSlcbiAgICAgIHRocm93IEVycm9yKFwiJGFuZC8kb3IvJG5vciBtdXN0IGJlIG5vbmVtcHR5IGFycmF5XCIpO1xuICAgIHZhciBzdWJTZWxlY3RvckZ1bmN0aW9ucyA9IF8ubWFwKFxuICAgICAgc3ViU2VsZWN0b3IsIGNvbXBpbGVEb2N1bWVudFNlbGVjdG9yKTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGRvYykge1xuICAgICAgcmV0dXJuIF8uYW55KHN1YlNlbGVjdG9yRnVuY3Rpb25zLCBmdW5jdGlvbiAoZikge1xuICAgICAgICByZXR1cm4gZihkb2MpO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSxcblxuICBcIiRub3JcIjogZnVuY3Rpb24oc3ViU2VsZWN0b3IpIHtcbiAgICBpZiAoIWlzQXJyYXkoc3ViU2VsZWN0b3IpIHx8IF8uaXNFbXB0eShzdWJTZWxlY3RvcikpXG4gICAgICB0aHJvdyBFcnJvcihcIiRhbmQvJG9yLyRub3IgbXVzdCBiZSBub25lbXB0eSBhcnJheVwiKTtcbiAgICB2YXIgc3ViU2VsZWN0b3JGdW5jdGlvbnMgPSBfLm1hcChcbiAgICAgIHN1YlNlbGVjdG9yLCBjb21waWxlRG9jdW1lbnRTZWxlY3Rvcik7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChkb2MpIHtcbiAgICAgIHJldHVybiBfLmFsbChzdWJTZWxlY3RvckZ1bmN0aW9ucywgZnVuY3Rpb24gKGYpIHtcbiAgICAgICAgcmV0dXJuICFmKGRvYyk7XG4gICAgICB9KTtcbiAgICB9O1xuICB9LFxuXG4gIFwiJHdoZXJlXCI6IGZ1bmN0aW9uKHNlbGVjdG9yVmFsdWUpIHtcbiAgICBpZiAoIShzZWxlY3RvclZhbHVlIGluc3RhbmNlb2YgRnVuY3Rpb24pKSB7XG4gICAgICBzZWxlY3RvclZhbHVlID0gRnVuY3Rpb24oXCJyZXR1cm4gXCIgKyBzZWxlY3RvclZhbHVlKTtcbiAgICB9XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChkb2MpIHtcbiAgICAgIHJldHVybiBzZWxlY3RvclZhbHVlLmNhbGwoZG9jKTtcbiAgICB9O1xuICB9XG59O1xuXG52YXIgVkFMVUVfT1BFUkFUT1JTID0ge1xuICBcIiRpblwiOiBmdW5jdGlvbiAob3BlcmFuZCkge1xuICAgIGlmICghaXNBcnJheShvcGVyYW5kKSlcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkFyZ3VtZW50IHRvICRpbiBtdXN0IGJlIGFycmF5XCIpO1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJldHVybiBfYW55SWZBcnJheVBsdXModmFsdWUsIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiBfLmFueShvcGVyYW5kLCBmdW5jdGlvbiAob3BlcmFuZEVsdCkge1xuICAgICAgICAgIHJldHVybiBMb2NhbENvbGxlY3Rpb24uX2YuX2VxdWFsKG9wZXJhbmRFbHQsIHgpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0sXG5cbiAgXCIkYWxsXCI6IGZ1bmN0aW9uIChvcGVyYW5kKSB7XG4gICAgaWYgKCFpc0FycmF5KG9wZXJhbmQpKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQXJndW1lbnQgdG8gJGFsbCBtdXN0IGJlIGFycmF5XCIpO1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIGlmICghaXNBcnJheSh2YWx1ZSkpXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIHJldHVybiBfLmFsbChvcGVyYW5kLCBmdW5jdGlvbiAob3BlcmFuZEVsdCkge1xuICAgICAgICByZXR1cm4gXy5hbnkodmFsdWUsIGZ1bmN0aW9uICh2YWx1ZUVsdCkge1xuICAgICAgICAgIHJldHVybiBMb2NhbENvbGxlY3Rpb24uX2YuX2VxdWFsKG9wZXJhbmRFbHQsIHZhbHVlRWx0KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9O1xuICB9LFxuXG4gIFwiJGx0XCI6IGZ1bmN0aW9uIChvcGVyYW5kKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgcmV0dXJuIF9hbnlJZkFycmF5KHZhbHVlLCBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4gTG9jYWxDb2xsZWN0aW9uLl9mLl9jbXAoeCwgb3BlcmFuZCkgPCAwO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSxcblxuICBcIiRsdGVcIjogZnVuY3Rpb24gKG9wZXJhbmQpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICByZXR1cm4gX2FueUlmQXJyYXkodmFsdWUsIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiBMb2NhbENvbGxlY3Rpb24uX2YuX2NtcCh4LCBvcGVyYW5kKSA8PSAwO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSxcblxuICBcIiRndFwiOiBmdW5jdGlvbiAob3BlcmFuZCkge1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJldHVybiBfYW55SWZBcnJheSh2YWx1ZSwgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIExvY2FsQ29sbGVjdGlvbi5fZi5fY21wKHgsIG9wZXJhbmQpID4gMDtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0sXG5cbiAgXCIkZ3RlXCI6IGZ1bmN0aW9uIChvcGVyYW5kKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgcmV0dXJuIF9hbnlJZkFycmF5KHZhbHVlLCBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4gTG9jYWxDb2xsZWN0aW9uLl9mLl9jbXAoeCwgb3BlcmFuZCkgPj0gMDtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0sXG5cbiAgXCIkbmVcIjogZnVuY3Rpb24gKG9wZXJhbmQpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICByZXR1cm4gISBfYW55SWZBcnJheVBsdXModmFsdWUsIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiBMb2NhbENvbGxlY3Rpb24uX2YuX2VxdWFsKHgsIG9wZXJhbmQpO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSxcblxuICBcIiRuaW5cIjogZnVuY3Rpb24gKG9wZXJhbmQpIHtcbiAgICBpZiAoIWlzQXJyYXkob3BlcmFuZCkpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJBcmd1bWVudCB0byAkbmluIG11c3QgYmUgYXJyYXlcIik7XG4gICAgdmFyIGluRnVuY3Rpb24gPSBWQUxVRV9PUEVSQVRPUlMuJGluKG9wZXJhbmQpO1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIC8vIEZpZWxkIGRvZXNuJ3QgZXhpc3QsIHNvIGl0J3Mgbm90LWluIG9wZXJhbmRcbiAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIHJldHVybiAhaW5GdW5jdGlvbih2YWx1ZSk7XG4gICAgfTtcbiAgfSxcblxuICBcIiRleGlzdHNcIjogZnVuY3Rpb24gKG9wZXJhbmQpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICByZXR1cm4gb3BlcmFuZCA9PT0gKHZhbHVlICE9PSB1bmRlZmluZWQpO1xuICAgIH07XG4gIH0sXG5cbiAgXCIkbW9kXCI6IGZ1bmN0aW9uIChvcGVyYW5kKSB7XG4gICAgdmFyIGRpdmlzb3IgPSBvcGVyYW5kWzBdLFxuICAgICAgICByZW1haW5kZXIgPSBvcGVyYW5kWzFdO1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJldHVybiBfYW55SWZBcnJheSh2YWx1ZSwgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIHggJSBkaXZpc29yID09PSByZW1haW5kZXI7XG4gICAgICB9KTtcbiAgICB9O1xuICB9LFxuXG4gIFwiJHNpemVcIjogZnVuY3Rpb24gKG9wZXJhbmQpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICByZXR1cm4gaXNBcnJheSh2YWx1ZSkgJiYgb3BlcmFuZCA9PT0gdmFsdWUubGVuZ3RoO1xuICAgIH07XG4gIH0sXG5cbiAgXCIkdHlwZVwiOiBmdW5jdGlvbiAob3BlcmFuZCkge1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIC8vIEEgbm9uZXhpc3RlbnQgZmllbGQgaXMgb2Ygbm8gdHlwZS5cbiAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAvLyBEZWZpbml0ZWx5IG5vdCBfYW55SWZBcnJheVBsdXM6ICR0eXBlOiA0IG9ubHkgbWF0Y2hlcyBhcnJheXMgdGhhdCBoYXZlXG4gICAgICAvLyBhcnJheXMgYXMgZWxlbWVudHMgYWNjb3JkaW5nIHRvIHRoZSBNb25nbyBkb2NzLlxuICAgICAgcmV0dXJuIF9hbnlJZkFycmF5KHZhbHVlLCBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4gTG9jYWxDb2xsZWN0aW9uLl9mLl90eXBlKHgpID09PSBvcGVyYW5kO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSxcblxuICBcIiRyZWdleFwiOiBmdW5jdGlvbiAob3BlcmFuZCwgb3B0aW9ucykge1xuICAgIGlmIChvcHRpb25zICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIC8vIE9wdGlvbnMgcGFzc2VkIGluICRvcHRpb25zIChldmVuIHRoZSBlbXB0eSBzdHJpbmcpIGFsd2F5cyBvdmVycmlkZXNcbiAgICAgIC8vIG9wdGlvbnMgaW4gdGhlIFJlZ0V4cCBvYmplY3QgaXRzZWxmLlxuXG4gICAgICAvLyBCZSBjbGVhciB0aGF0IHdlIG9ubHkgc3VwcG9ydCB0aGUgSlMtc3VwcG9ydGVkIG9wdGlvbnMsIG5vdCBleHRlbmRlZFxuICAgICAgLy8gb25lcyAoZWcsIE1vbmdvIHN1cHBvcnRzIHggYW5kIHMpLiBJZGVhbGx5IHdlIHdvdWxkIGltcGxlbWVudCB4IGFuZCBzXG4gICAgICAvLyBieSB0cmFuc2Zvcm1pbmcgdGhlIHJlZ2V4cCwgYnV0IG5vdCB0b2RheS4uLlxuICAgICAgaWYgKC9bXmdpbV0vLnRlc3Qob3B0aW9ucykpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIk9ubHkgdGhlIGksIG0sIGFuZCBnIHJlZ2V4cCBvcHRpb25zIGFyZSBzdXBwb3J0ZWRcIik7XG5cbiAgICAgIHZhciByZWdleFNvdXJjZSA9IG9wZXJhbmQgaW5zdGFuY2VvZiBSZWdFeHAgPyBvcGVyYW5kLnNvdXJjZSA6IG9wZXJhbmQ7XG4gICAgICBvcGVyYW5kID0gbmV3IFJlZ0V4cChyZWdleFNvdXJjZSwgb3B0aW9ucyk7XG4gICAgfSBlbHNlIGlmICghKG9wZXJhbmQgaW5zdGFuY2VvZiBSZWdFeHApKSB7XG4gICAgICBvcGVyYW5kID0gbmV3IFJlZ0V4cChvcGVyYW5kKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZClcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgcmV0dXJuIF9hbnlJZkFycmF5KHZhbHVlLCBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4gb3BlcmFuZC50ZXN0KHgpO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSxcblxuICBcIiRvcHRpb25zXCI6IGZ1bmN0aW9uIChvcGVyYW5kKSB7XG4gICAgLy8gZXZhbHVhdGlvbiBoYXBwZW5zIGF0IHRoZSAkcmVnZXggZnVuY3Rpb24gYWJvdmVcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7IHJldHVybiB0cnVlOyB9O1xuICB9LFxuXG4gIFwiJGVsZW1NYXRjaFwiOiBmdW5jdGlvbiAob3BlcmFuZCkge1xuICAgIHZhciBtYXRjaGVyID0gY29tcGlsZURvY3VtZW50U2VsZWN0b3Iob3BlcmFuZCk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgaWYgKCFpc0FycmF5KHZhbHVlKSlcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgcmV0dXJuIF8uYW55KHZhbHVlLCBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4gbWF0Y2hlcih4KTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0sXG5cbiAgXCIkbm90XCI6IGZ1bmN0aW9uIChvcGVyYW5kKSB7XG4gICAgdmFyIG1hdGNoZXIgPSBjb21waWxlVmFsdWVTZWxlY3RvcihvcGVyYW5kKTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICByZXR1cm4gIW1hdGNoZXIodmFsdWUpO1xuICAgIH07XG4gIH0sXG5cbiAgXCIkbmVhclwiOiBmdW5jdGlvbiAob3BlcmFuZCkge1xuICAgIC8vIEFsd2F5cyByZXR1cm5zIHRydWUuIE11c3QgYmUgaGFuZGxlZCBpbiBwb3N0LWZpbHRlci9zb3J0L2xpbWl0XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9LFxuXG4gIFwiJGdlb0ludGVyc2VjdHNcIjogZnVuY3Rpb24gKG9wZXJhbmQpIHtcbiAgICAvLyBBbHdheXMgcmV0dXJucyB0cnVlLiBNdXN0IGJlIGhhbmRsZWQgaW4gcG9zdC1maWx0ZXIvc29ydC9saW1pdFxuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuXG59O1xuXG4vLyBoZWxwZXJzIHVzZWQgYnkgY29tcGlsZWQgc2VsZWN0b3IgY29kZVxuTG9jYWxDb2xsZWN0aW9uLl9mID0ge1xuICAvLyBYWFggZm9yIF9hbGwgYW5kIF9pbiwgY29uc2lkZXIgYnVpbGRpbmcgJ2lucXVlcnknIGF0IGNvbXBpbGUgdGltZS4uXG5cbiAgX3R5cGU6IGZ1bmN0aW9uICh2KSB7XG4gICAgaWYgKHR5cGVvZiB2ID09PSBcIm51bWJlclwiKVxuICAgICAgcmV0dXJuIDE7XG4gICAgaWYgKHR5cGVvZiB2ID09PSBcInN0cmluZ1wiKVxuICAgICAgcmV0dXJuIDI7XG4gICAgaWYgKHR5cGVvZiB2ID09PSBcImJvb2xlYW5cIilcbiAgICAgIHJldHVybiA4O1xuICAgIGlmIChpc0FycmF5KHYpKVxuICAgICAgcmV0dXJuIDQ7XG4gICAgaWYgKHYgPT09IG51bGwpXG4gICAgICByZXR1cm4gMTA7XG4gICAgaWYgKHYgaW5zdGFuY2VvZiBSZWdFeHApXG4gICAgICByZXR1cm4gMTE7XG4gICAgaWYgKHR5cGVvZiB2ID09PSBcImZ1bmN0aW9uXCIpXG4gICAgICAvLyBub3RlIHRoYXQgdHlwZW9mKC94LykgPT09IFwiZnVuY3Rpb25cIlxuICAgICAgcmV0dXJuIDEzO1xuICAgIGlmICh2IGluc3RhbmNlb2YgRGF0ZSlcbiAgICAgIHJldHVybiA5O1xuICAgIGlmIChFSlNPTi5pc0JpbmFyeSh2KSlcbiAgICAgIHJldHVybiA1O1xuICAgIGlmICh2IGluc3RhbmNlb2YgTWV0ZW9yLkNvbGxlY3Rpb24uT2JqZWN0SUQpXG4gICAgICByZXR1cm4gNztcbiAgICByZXR1cm4gMzsgLy8gb2JqZWN0XG5cbiAgICAvLyBYWFggc3VwcG9ydCBzb21lL2FsbCBvZiB0aGVzZTpcbiAgICAvLyAxNCwgc3ltYm9sXG4gICAgLy8gMTUsIGphdmFzY3JpcHQgY29kZSB3aXRoIHNjb3BlXG4gICAgLy8gMTYsIDE4OiAzMi1iaXQvNjQtYml0IGludGVnZXJcbiAgICAvLyAxNywgdGltZXN0YW1wXG4gICAgLy8gMjU1LCBtaW5rZXlcbiAgICAvLyAxMjcsIG1heGtleVxuICB9LFxuXG4gIC8vIGRlZXAgZXF1YWxpdHkgdGVzdDogdXNlIGZvciBsaXRlcmFsIGRvY3VtZW50IGFuZCBhcnJheSBtYXRjaGVzXG4gIF9lcXVhbDogZnVuY3Rpb24gKGEsIGIpIHtcbiAgICByZXR1cm4gRUpTT04uZXF1YWxzKGEsIGIsIHtrZXlPcmRlclNlbnNpdGl2ZTogdHJ1ZX0pO1xuICB9LFxuXG4gIC8vIG1hcHMgYSB0eXBlIGNvZGUgdG8gYSB2YWx1ZSB0aGF0IGNhbiBiZSB1c2VkIHRvIHNvcnQgdmFsdWVzIG9mXG4gIC8vIGRpZmZlcmVudCB0eXBlc1xuICBfdHlwZW9yZGVyOiBmdW5jdGlvbiAodCkge1xuICAgIC8vIGh0dHA6Ly93d3cubW9uZ29kYi5vcmcvZGlzcGxheS9ET0NTL1doYXQraXMrdGhlK0NvbXBhcmUrT3JkZXIrZm9yK0JTT04rVHlwZXNcbiAgICAvLyBYWFggd2hhdCBpcyB0aGUgY29ycmVjdCBzb3J0IHBvc2l0aW9uIGZvciBKYXZhc2NyaXB0IGNvZGU/XG4gICAgLy8gKCcxMDAnIGluIHRoZSBtYXRyaXggYmVsb3cpXG4gICAgLy8gWFhYIG1pbmtleS9tYXhrZXlcbiAgICByZXR1cm4gWy0xLCAgLy8gKG5vdCBhIHR5cGUpXG4gICAgICAgICAgICAxLCAgIC8vIG51bWJlclxuICAgICAgICAgICAgMiwgICAvLyBzdHJpbmdcbiAgICAgICAgICAgIDMsICAgLy8gb2JqZWN0XG4gICAgICAgICAgICA0LCAgIC8vIGFycmF5XG4gICAgICAgICAgICA1LCAgIC8vIGJpbmFyeVxuICAgICAgICAgICAgLTEsICAvLyBkZXByZWNhdGVkXG4gICAgICAgICAgICA2LCAgIC8vIE9iamVjdElEXG4gICAgICAgICAgICA3LCAgIC8vIGJvb2xcbiAgICAgICAgICAgIDgsICAgLy8gRGF0ZVxuICAgICAgICAgICAgMCwgICAvLyBudWxsXG4gICAgICAgICAgICA5LCAgIC8vIFJlZ0V4cFxuICAgICAgICAgICAgLTEsICAvLyBkZXByZWNhdGVkXG4gICAgICAgICAgICAxMDAsIC8vIEpTIGNvZGVcbiAgICAgICAgICAgIDIsICAgLy8gZGVwcmVjYXRlZCAoc3ltYm9sKVxuICAgICAgICAgICAgMTAwLCAvLyBKUyBjb2RlXG4gICAgICAgICAgICAxLCAgIC8vIDMyLWJpdCBpbnRcbiAgICAgICAgICAgIDgsICAgLy8gTW9uZ28gdGltZXN0YW1wXG4gICAgICAgICAgICAxICAgIC8vIDY0LWJpdCBpbnRcbiAgICAgICAgICAgXVt0XTtcbiAgfSxcblxuICAvLyBjb21wYXJlIHR3byB2YWx1ZXMgb2YgdW5rbm93biB0eXBlIGFjY29yZGluZyB0byBCU09OIG9yZGVyaW5nXG4gIC8vIHNlbWFudGljcy4gKGFzIGFuIGV4dGVuc2lvbiwgY29uc2lkZXIgJ3VuZGVmaW5lZCcgdG8gYmUgbGVzcyB0aGFuXG4gIC8vIGFueSBvdGhlciB2YWx1ZS4pIHJldHVybiBuZWdhdGl2ZSBpZiBhIGlzIGxlc3MsIHBvc2l0aXZlIGlmIGIgaXNcbiAgLy8gbGVzcywgb3IgMCBpZiBlcXVhbFxuICBfY21wOiBmdW5jdGlvbiAoYSwgYikge1xuICAgIGlmIChhID09PSB1bmRlZmluZWQpXG4gICAgICByZXR1cm4gYiA9PT0gdW5kZWZpbmVkID8gMCA6IC0xO1xuICAgIGlmIChiID09PSB1bmRlZmluZWQpXG4gICAgICByZXR1cm4gMTtcbiAgICB2YXIgdGEgPSBMb2NhbENvbGxlY3Rpb24uX2YuX3R5cGUoYSk7XG4gICAgdmFyIHRiID0gTG9jYWxDb2xsZWN0aW9uLl9mLl90eXBlKGIpO1xuICAgIHZhciBvYSA9IExvY2FsQ29sbGVjdGlvbi5fZi5fdHlwZW9yZGVyKHRhKTtcbiAgICB2YXIgb2IgPSBMb2NhbENvbGxlY3Rpb24uX2YuX3R5cGVvcmRlcih0Yik7XG4gICAgaWYgKG9hICE9PSBvYilcbiAgICAgIHJldHVybiBvYSA8IG9iID8gLTEgOiAxO1xuICAgIGlmICh0YSAhPT0gdGIpXG4gICAgICAvLyBYWFggbmVlZCB0byBpbXBsZW1lbnQgdGhpcyBpZiB3ZSBpbXBsZW1lbnQgU3ltYm9sIG9yIGludGVnZXJzLCBvclxuICAgICAgLy8gVGltZXN0YW1wXG4gICAgICB0aHJvdyBFcnJvcihcIk1pc3NpbmcgdHlwZSBjb2VyY2lvbiBsb2dpYyBpbiBfY21wXCIpO1xuICAgIGlmICh0YSA9PT0gNykgeyAvLyBPYmplY3RJRFxuICAgICAgLy8gQ29udmVydCB0byBzdHJpbmcuXG4gICAgICB0YSA9IHRiID0gMjtcbiAgICAgIGEgPSBhLnRvSGV4U3RyaW5nKCk7XG4gICAgICBiID0gYi50b0hleFN0cmluZygpO1xuICAgIH1cbiAgICBpZiAodGEgPT09IDkpIHsgLy8gRGF0ZVxuICAgICAgLy8gQ29udmVydCB0byBtaWxsaXMuXG4gICAgICB0YSA9IHRiID0gMTtcbiAgICAgIGEgPSBhLmdldFRpbWUoKTtcbiAgICAgIGIgPSBiLmdldFRpbWUoKTtcbiAgICB9XG5cbiAgICBpZiAodGEgPT09IDEpIC8vIGRvdWJsZVxuICAgICAgcmV0dXJuIGEgLSBiO1xuICAgIGlmICh0YiA9PT0gMikgLy8gc3RyaW5nXG4gICAgICByZXR1cm4gYSA8IGIgPyAtMSA6IChhID09PSBiID8gMCA6IDEpO1xuICAgIGlmICh0YSA9PT0gMykgeyAvLyBPYmplY3RcbiAgICAgIC8vIHRoaXMgY291bGQgYmUgbXVjaCBtb3JlIGVmZmljaWVudCBpbiB0aGUgZXhwZWN0ZWQgY2FzZSAuLi5cbiAgICAgIHZhciB0b19hcnJheSA9IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgICAgdmFyIHJldCA9IFtdO1xuICAgICAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgICAgICAgcmV0LnB1c2goa2V5KTtcbiAgICAgICAgICByZXQucHVzaChvYmpba2V5XSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgIH07XG4gICAgICByZXR1cm4gTG9jYWxDb2xsZWN0aW9uLl9mLl9jbXAodG9fYXJyYXkoYSksIHRvX2FycmF5KGIpKTtcbiAgICB9XG4gICAgaWYgKHRhID09PSA0KSB7IC8vIEFycmF5XG4gICAgICBmb3IgKHZhciBpID0gMDsgOyBpKyspIHtcbiAgICAgICAgaWYgKGkgPT09IGEubGVuZ3RoKVxuICAgICAgICAgIHJldHVybiAoaSA9PT0gYi5sZW5ndGgpID8gMCA6IC0xO1xuICAgICAgICBpZiAoaSA9PT0gYi5sZW5ndGgpXG4gICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgIHZhciBzID0gTG9jYWxDb2xsZWN0aW9uLl9mLl9jbXAoYVtpXSwgYltpXSk7XG4gICAgICAgIGlmIChzICE9PSAwKVxuICAgICAgICAgIHJldHVybiBzO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAodGEgPT09IDUpIHsgLy8gYmluYXJ5XG4gICAgICAvLyBTdXJwcmlzaW5nbHksIGEgc21hbGwgYmluYXJ5IGJsb2IgaXMgYWx3YXlzIGxlc3MgdGhhbiBhIGxhcmdlIG9uZSBpblxuICAgICAgLy8gTW9uZ28uXG4gICAgICBpZiAoYS5sZW5ndGggIT09IGIubGVuZ3RoKVxuICAgICAgICByZXR1cm4gYS5sZW5ndGggLSBiLmxlbmd0aDtcbiAgICAgIGZvciAoaSA9IDA7IGkgPCBhLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChhW2ldIDwgYltpXSlcbiAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgIGlmIChhW2ldID4gYltpXSlcbiAgICAgICAgICByZXR1cm4gMTtcbiAgICAgIH1cbiAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICBpZiAodGEgPT09IDgpIHsgLy8gYm9vbGVhblxuICAgICAgaWYgKGEpIHJldHVybiBiID8gMCA6IDE7XG4gICAgICByZXR1cm4gYiA/IC0xIDogMDtcbiAgICB9XG4gICAgaWYgKHRhID09PSAxMCkgLy8gbnVsbFxuICAgICAgcmV0dXJuIDA7XG4gICAgaWYgKHRhID09PSAxMSkgLy8gcmVnZXhwXG4gICAgICB0aHJvdyBFcnJvcihcIlNvcnRpbmcgbm90IHN1cHBvcnRlZCBvbiByZWd1bGFyIGV4cHJlc3Npb25cIik7IC8vIFhYWFxuICAgIC8vIDEzOiBqYXZhc2NyaXB0IGNvZGVcbiAgICAvLyAxNDogc3ltYm9sXG4gICAgLy8gMTU6IGphdmFzY3JpcHQgY29kZSB3aXRoIHNjb3BlXG4gICAgLy8gMTY6IDMyLWJpdCBpbnRlZ2VyXG4gICAgLy8gMTc6IHRpbWVzdGFtcFxuICAgIC8vIDE4OiA2NC1iaXQgaW50ZWdlclxuICAgIC8vIDI1NTogbWlua2V5XG4gICAgLy8gMTI3OiBtYXhrZXlcbiAgICBpZiAodGEgPT09IDEzKSAvLyBqYXZhc2NyaXB0IGNvZGVcbiAgICAgIHRocm93IEVycm9yKFwiU29ydGluZyBub3Qgc3VwcG9ydGVkIG9uIEphdmFzY3JpcHQgY29kZVwiKTsgLy8gWFhYXG4gICAgdGhyb3cgRXJyb3IoXCJVbmtub3duIHR5cGUgdG8gc29ydFwiKTtcbiAgfVxufTtcblxuLy8gRm9yIHVuaXQgdGVzdHMuIFRydWUgaWYgdGhlIGdpdmVuIGRvY3VtZW50IG1hdGNoZXMgdGhlIGdpdmVuXG4vLyBzZWxlY3Rvci5cbkxvY2FsQ29sbGVjdGlvbi5fbWF0Y2hlcyA9IGZ1bmN0aW9uIChzZWxlY3RvciwgZG9jKSB7XG4gIHJldHVybiAoTG9jYWxDb2xsZWN0aW9uLl9jb21waWxlU2VsZWN0b3Ioc2VsZWN0b3IpKShkb2MpO1xufTtcblxuLy8gX21ha2VMb29rdXBGdW5jdGlvbihrZXkpIHJldHVybnMgYSBsb29rdXAgZnVuY3Rpb24uXG4vL1xuLy8gQSBsb29rdXAgZnVuY3Rpb24gdGFrZXMgaW4gYSBkb2N1bWVudCBhbmQgcmV0dXJucyBhbiBhcnJheSBvZiBtYXRjaGluZ1xuLy8gdmFsdWVzLiAgVGhpcyBhcnJheSBoYXMgbW9yZSB0aGFuIG9uZSBlbGVtZW50IGlmIGFueSBzZWdtZW50IG9mIHRoZSBrZXkgb3RoZXJcbi8vIHRoYW4gdGhlIGxhc3Qgb25lIGlzIGFuIGFycmF5LiAgaWUsIGFueSBhcnJheXMgZm91bmQgd2hlbiBkb2luZyBub24tZmluYWxcbi8vIGxvb2t1cHMgcmVzdWx0IGluIHRoaXMgZnVuY3Rpb24gXCJicmFuY2hpbmdcIjsgZWFjaCBlbGVtZW50IGluIHRoZSByZXR1cm5lZFxuLy8gYXJyYXkgcmVwcmVzZW50cyB0aGUgdmFsdWUgZm91bmQgYXQgdGhpcyBicmFuY2guIElmIGFueSBicmFuY2ggZG9lc24ndCBoYXZlIGFcbi8vIGZpbmFsIHZhbHVlIGZvciB0aGUgZnVsbCBrZXksIGl0cyBlbGVtZW50IGluIHRoZSByZXR1cm5lZCBsaXN0IHdpbGwgYmVcbi8vIHVuZGVmaW5lZC4gSXQgYWx3YXlzIHJldHVybnMgYSBub24tZW1wdHkgYXJyYXkuXG4vL1xuLy8gX21ha2VMb29rdXBGdW5jdGlvbignYS54Jykoe2E6IHt4OiAxfX0pIHJldHVybnMgWzFdXG4vLyBfbWFrZUxvb2t1cEZ1bmN0aW9uKCdhLngnKSh7YToge3g6IFsxXX19KSByZXR1cm5zIFtbMV1dXG4vLyBfbWFrZUxvb2t1cEZ1bmN0aW9uKCdhLngnKSh7YTogNX0pICByZXR1cm5zIFt1bmRlZmluZWRdXG4vLyBfbWFrZUxvb2t1cEZ1bmN0aW9uKCdhLngnKSh7YTogW3t4OiAxfSxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3g6IFsyXX0sXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHt5OiAzfV19KVxuLy8gICByZXR1cm5zIFsxLCBbMl0sIHVuZGVmaW5lZF1cbkxvY2FsQ29sbGVjdGlvbi5fbWFrZUxvb2t1cEZ1bmN0aW9uID0gZnVuY3Rpb24gKGtleSkge1xuICB2YXIgZG90TG9jYXRpb24gPSBrZXkuaW5kZXhPZignLicpO1xuICB2YXIgZmlyc3QsIGxvb2t1cFJlc3QsIG5leHRJc051bWVyaWM7XG4gIGlmIChkb3RMb2NhdGlvbiA9PT0gLTEpIHtcbiAgICBmaXJzdCA9IGtleTtcbiAgfSBlbHNlIHtcbiAgICBmaXJzdCA9IGtleS5zdWJzdHIoMCwgZG90TG9jYXRpb24pO1xuICAgIHZhciByZXN0ID0ga2V5LnN1YnN0cihkb3RMb2NhdGlvbiArIDEpO1xuICAgIGxvb2t1cFJlc3QgPSBMb2NhbENvbGxlY3Rpb24uX21ha2VMb29rdXBGdW5jdGlvbihyZXN0KTtcbiAgICAvLyBJcyB0aGUgbmV4dCAocGVyaGFwcyBmaW5hbCkgcGllY2UgbnVtZXJpYyAoaWUsIGFuIGFycmF5IGxvb2t1cD8pXG4gICAgbmV4dElzTnVtZXJpYyA9IC9eXFxkKyhcXC58JCkvLnRlc3QocmVzdCk7XG4gIH1cblxuICByZXR1cm4gZnVuY3Rpb24gKGRvYykge1xuICAgIGlmIChkb2MgPT0gbnVsbCkgIC8vIG51bGwgb3IgdW5kZWZpbmVkXG4gICAgICByZXR1cm4gW3VuZGVmaW5lZF07XG4gICAgdmFyIGZpcnN0TGV2ZWwgPSBkb2NbZmlyc3RdO1xuXG4gICAgLy8gV2UgZG9uJ3QgXCJicmFuY2hcIiBhdCB0aGUgZmluYWwgbGV2ZWwuXG4gICAgaWYgKCFsb29rdXBSZXN0KVxuICAgICAgcmV0dXJuIFtmaXJzdExldmVsXTtcblxuICAgIC8vIEl0J3MgYW4gZW1wdHkgYXJyYXksIGFuZCB3ZSdyZSBub3QgZG9uZTogd2Ugd29uJ3QgZmluZCBhbnl0aGluZy5cbiAgICBpZiAoaXNBcnJheShmaXJzdExldmVsKSAmJiBmaXJzdExldmVsLmxlbmd0aCA9PT0gMClcbiAgICAgIHJldHVybiBbdW5kZWZpbmVkXTtcblxuICAgIC8vIEZvciBlYWNoIHJlc3VsdCBhdCB0aGlzIGxldmVsLCBmaW5pc2ggdGhlIGxvb2t1cCBvbiB0aGUgcmVzdCBvZiB0aGUga2V5LFxuICAgIC8vIGFuZCByZXR1cm4gZXZlcnl0aGluZyB3ZSBmaW5kLiBBbHNvLCBpZiB0aGUgbmV4dCByZXN1bHQgaXMgYSBudW1iZXIsXG4gICAgLy8gZG9uJ3QgYnJhbmNoIGhlcmUuXG4gICAgLy9cbiAgICAvLyBUZWNobmljYWxseSwgaW4gTW9uZ29EQiwgd2Ugc2hvdWxkIGJlIGFibGUgdG8gaGFuZGxlIHRoZSBjYXNlIHdoZXJlXG4gICAgLy8gb2JqZWN0cyBoYXZlIG51bWVyaWMga2V5cywgYnV0IE1vbmdvIGRvZXNuJ3QgYWN0dWFsbHkgaGFuZGxlIHRoaXNcbiAgICAvLyBjb25zaXN0ZW50bHkgeWV0IGl0c2VsZiwgc2VlIGVnXG4gICAgLy8gaHR0cHM6Ly9qaXJhLm1vbmdvZGIub3JnL2Jyb3dzZS9TRVJWRVItMjg5OFxuICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9tb25nb2RiL21vbmdvL2Jsb2IvbWFzdGVyL2pzdGVzdHMvYXJyYXlfbWF0Y2gyLmpzXG4gICAgaWYgKCFpc0FycmF5KGZpcnN0TGV2ZWwpIHx8IG5leHRJc051bWVyaWMpXG4gICAgICBmaXJzdExldmVsID0gW2ZpcnN0TGV2ZWxdO1xuICAgIHJldHVybiBBcnJheS5wcm90b3R5cGUuY29uY2F0LmFwcGx5KFtdLCBfLm1hcChmaXJzdExldmVsLCBsb29rdXBSZXN0KSk7XG4gIH07XG59O1xuXG4vLyBUaGUgbWFpbiBjb21waWxhdGlvbiBmdW5jdGlvbiBmb3IgYSBnaXZlbiBzZWxlY3Rvci5cbnZhciBjb21waWxlRG9jdW1lbnRTZWxlY3RvciA9IGZ1bmN0aW9uIChkb2NTZWxlY3Rvcikge1xuICB2YXIgcGVyS2V5U2VsZWN0b3JzID0gW107XG4gIF8uZWFjaChkb2NTZWxlY3RvciwgZnVuY3Rpb24gKHN1YlNlbGVjdG9yLCBrZXkpIHtcbiAgICBpZiAoa2V5LnN1YnN0cigwLCAxKSA9PT0gJyQnKSB7XG4gICAgICAvLyBPdXRlciBvcGVyYXRvcnMgYXJlIGVpdGhlciBsb2dpY2FsIG9wZXJhdG9ycyAodGhleSByZWN1cnNlIGJhY2sgaW50b1xuICAgICAgLy8gdGhpcyBmdW5jdGlvbiksIG9yICR3aGVyZS5cbiAgICAgIGlmICghXy5oYXMoTE9HSUNBTF9PUEVSQVRPUlMsIGtleSkpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlVucmVjb2duaXplZCBsb2dpY2FsIG9wZXJhdG9yOiBcIiArIGtleSk7XG4gICAgICBwZXJLZXlTZWxlY3RvcnMucHVzaChMT0dJQ0FMX09QRVJBVE9SU1trZXldKHN1YlNlbGVjdG9yKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBsb29rVXBCeUluZGV4ID0gTG9jYWxDb2xsZWN0aW9uLl9tYWtlTG9va3VwRnVuY3Rpb24oa2V5KTtcbiAgICAgIHZhciB2YWx1ZVNlbGVjdG9yRnVuYyA9IGNvbXBpbGVWYWx1ZVNlbGVjdG9yKHN1YlNlbGVjdG9yKTtcbiAgICAgIHBlcktleVNlbGVjdG9ycy5wdXNoKGZ1bmN0aW9uIChkb2MpIHtcbiAgICAgICAgdmFyIGJyYW5jaFZhbHVlcyA9IGxvb2tVcEJ5SW5kZXgoZG9jKTtcbiAgICAgICAgLy8gV2UgYXBwbHkgdGhlIHNlbGVjdG9yIHRvIGVhY2ggXCJicmFuY2hlZFwiIHZhbHVlIGFuZCByZXR1cm4gdHJ1ZSBpZiBhbnlcbiAgICAgICAgLy8gbWF0Y2guIFRoaXMgaXNuJ3QgMTAwJSBjb25zaXN0ZW50IHdpdGggTW9uZ29EQjsgZWcsIHNlZTpcbiAgICAgICAgLy8gaHR0cHM6Ly9qaXJhLm1vbmdvZGIub3JnL2Jyb3dzZS9TRVJWRVItODU4NVxuICAgICAgICByZXR1cm4gXy5hbnkoYnJhbmNoVmFsdWVzLCB2YWx1ZVNlbGVjdG9yRnVuYyk7XG4gICAgICB9KTtcbiAgICB9XG4gIH0pO1xuXG5cbiAgcmV0dXJuIGZ1bmN0aW9uIChkb2MpIHtcbiAgICByZXR1cm4gXy5hbGwocGVyS2V5U2VsZWN0b3JzLCBmdW5jdGlvbiAoZikge1xuICAgICAgcmV0dXJuIGYoZG9jKTtcbiAgICB9KTtcbiAgfTtcbn07XG5cbi8vIEdpdmVuIGEgc2VsZWN0b3IsIHJldHVybiBhIGZ1bmN0aW9uIHRoYXQgdGFrZXMgb25lIGFyZ3VtZW50LCBhXG4vLyBkb2N1bWVudCwgYW5kIHJldHVybnMgdHJ1ZSBpZiB0aGUgZG9jdW1lbnQgbWF0Y2hlcyB0aGUgc2VsZWN0b3IsXG4vLyBlbHNlIGZhbHNlLlxuTG9jYWxDb2xsZWN0aW9uLl9jb21waWxlU2VsZWN0b3IgPSBmdW5jdGlvbiAoc2VsZWN0b3IpIHtcbiAgLy8geW91IGNhbiBwYXNzIGEgbGl0ZXJhbCBmdW5jdGlvbiBpbnN0ZWFkIG9mIGEgc2VsZWN0b3JcbiAgaWYgKHNlbGVjdG9yIGluc3RhbmNlb2YgRnVuY3Rpb24pXG4gICAgcmV0dXJuIGZ1bmN0aW9uIChkb2MpIHtyZXR1cm4gc2VsZWN0b3IuY2FsbChkb2MpO307XG5cbiAgLy8gc2hvcnRoYW5kIC0tIHNjYWxhcnMgbWF0Y2ggX2lkXG4gIGlmIChMb2NhbENvbGxlY3Rpb24uX3NlbGVjdG9ySXNJZChzZWxlY3RvcikpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGRvYykge1xuICAgICAgcmV0dXJuIEVKU09OLmVxdWFscyhkb2MuX2lkLCBzZWxlY3Rvcik7XG4gICAgfTtcbiAgfVxuXG4gIC8vIHByb3RlY3QgYWdhaW5zdCBkYW5nZXJvdXMgc2VsZWN0b3JzLiAgZmFsc2V5IGFuZCB7X2lkOiBmYWxzZXl9IGFyZSBib3RoXG4gIC8vIGxpa2VseSBwcm9ncmFtbWVyIGVycm9yLCBhbmQgbm90IHdoYXQgeW91IHdhbnQsIHBhcnRpY3VsYXJseSBmb3JcbiAgLy8gZGVzdHJ1Y3RpdmUgb3BlcmF0aW9ucy5cbiAgaWYgKCFzZWxlY3RvciB8fCAoKCdfaWQnIGluIHNlbGVjdG9yKSAmJiAhc2VsZWN0b3IuX2lkKSlcbiAgICByZXR1cm4gZnVuY3Rpb24gKGRvYykge3JldHVybiBmYWxzZTt9O1xuXG4gIC8vIFRvcCBsZXZlbCBjYW4ndCBiZSBhbiBhcnJheSBvciB0cnVlIG9yIGJpbmFyeS5cbiAgaWYgKHR5cGVvZihzZWxlY3RvcikgPT09ICdib29sZWFuJyB8fCBpc0FycmF5KHNlbGVjdG9yKSB8fFxuICAgICAgRUpTT04uaXNCaW5hcnkoc2VsZWN0b3IpKVxuICAgIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgc2VsZWN0b3I6IFwiICsgc2VsZWN0b3IpO1xuXG4gIHJldHVybiBjb21waWxlRG9jdW1lbnRTZWxlY3RvcihzZWxlY3Rvcik7XG59O1xuXG4vLyBHaXZlIGEgc29ydCBzcGVjLCB3aGljaCBjYW4gYmUgaW4gYW55IG9mIHRoZXNlIGZvcm1zOlxuLy8gICB7XCJrZXkxXCI6IDEsIFwia2V5MlwiOiAtMX1cbi8vICAgW1tcImtleTFcIiwgXCJhc2NcIl0sIFtcImtleTJcIiwgXCJkZXNjXCJdXVxuLy8gICBbXCJrZXkxXCIsIFtcImtleTJcIiwgXCJkZXNjXCJdXVxuLy9cbi8vICguLiB3aXRoIHRoZSBmaXJzdCBmb3JtIGJlaW5nIGRlcGVuZGVudCBvbiB0aGUga2V5IGVudW1lcmF0aW9uXG4vLyBiZWhhdmlvciBvZiB5b3VyIGphdmFzY3JpcHQgVk0sIHdoaWNoIHVzdWFsbHkgZG9lcyB3aGF0IHlvdSBtZWFuIGluXG4vLyB0aGlzIGNhc2UgaWYgdGhlIGtleSBuYW1lcyBkb24ndCBsb29rIGxpa2UgaW50ZWdlcnMgLi4pXG4vL1xuLy8gcmV0dXJuIGEgZnVuY3Rpb24gdGhhdCB0YWtlcyB0d28gb2JqZWN0cywgYW5kIHJldHVybnMgLTEgaWYgdGhlXG4vLyBmaXJzdCBvYmplY3QgY29tZXMgZmlyc3QgaW4gb3JkZXIsIDEgaWYgdGhlIHNlY29uZCBvYmplY3QgY29tZXNcbi8vIGZpcnN0LCBvciAwIGlmIG5laXRoZXIgb2JqZWN0IGNvbWVzIGJlZm9yZSB0aGUgb3RoZXIuXG5cbkxvY2FsQ29sbGVjdGlvbi5fY29tcGlsZVNvcnQgPSBmdW5jdGlvbiAoc3BlYykge1xuICB2YXIgc29ydFNwZWNQYXJ0cyA9IFtdO1xuXG4gIGlmIChzcGVjIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNwZWMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmICh0eXBlb2Ygc3BlY1tpXSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICBzb3J0U3BlY1BhcnRzLnB1c2goe1xuICAgICAgICAgIGxvb2t1cDogTG9jYWxDb2xsZWN0aW9uLl9tYWtlTG9va3VwRnVuY3Rpb24oc3BlY1tpXSksXG4gICAgICAgICAgYXNjZW5kaW5nOiB0cnVlXG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc29ydFNwZWNQYXJ0cy5wdXNoKHtcbiAgICAgICAgICBsb29rdXA6IExvY2FsQ29sbGVjdGlvbi5fbWFrZUxvb2t1cEZ1bmN0aW9uKHNwZWNbaV1bMF0pLFxuICAgICAgICAgIGFzY2VuZGluZzogc3BlY1tpXVsxXSAhPT0gXCJkZXNjXCJcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2UgaWYgKHR5cGVvZiBzcGVjID09PSBcIm9iamVjdFwiKSB7XG4gICAgZm9yICh2YXIga2V5IGluIHNwZWMpIHtcbiAgICAgIHNvcnRTcGVjUGFydHMucHVzaCh7XG4gICAgICAgIGxvb2t1cDogTG9jYWxDb2xsZWN0aW9uLl9tYWtlTG9va3VwRnVuY3Rpb24oa2V5KSxcbiAgICAgICAgYXNjZW5kaW5nOiBzcGVjW2tleV0gPj0gMFxuICAgICAgfSk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHRocm93IEVycm9yKFwiQmFkIHNvcnQgc3BlY2lmaWNhdGlvbjogXCIsIEpTT04uc3RyaW5naWZ5KHNwZWMpKTtcbiAgfVxuXG4gIGlmIChzb3J0U3BlY1BhcnRzLmxlbmd0aCA9PT0gMClcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge3JldHVybiAwO307XG5cbiAgLy8gcmVkdWNlVmFsdWUgdGFrZXMgaW4gYWxsIHRoZSBwb3NzaWJsZSB2YWx1ZXMgZm9yIHRoZSBzb3J0IGtleSBhbG9uZyB2YXJpb3VzXG4gIC8vIGJyYW5jaGVzLCBhbmQgcmV0dXJucyB0aGUgbWluIG9yIG1heCB2YWx1ZSAoYWNjb3JkaW5nIHRvIHRoZSBib29sXG4gIC8vIGZpbmRNaW4pLiBFYWNoIHZhbHVlIGNhbiBpdHNlbGYgYmUgYW4gYXJyYXksIGFuZCB3ZSBsb29rIGF0IGl0cyB2YWx1ZXNcbiAgLy8gdG9vLiAoaWUsIHdlIGRvIGEgc2luZ2xlIGxldmVsIG9mIGZsYXR0ZW5pbmcgb24gYnJhbmNoVmFsdWVzLCB0aGVuIGZpbmQgdGhlXG4gIC8vIG1pbi9tYXguKVxuICB2YXIgcmVkdWNlVmFsdWUgPSBmdW5jdGlvbiAoYnJhbmNoVmFsdWVzLCBmaW5kTWluKSB7XG4gICAgdmFyIHJlZHVjZWQ7XG4gICAgdmFyIGZpcnN0ID0gdHJ1ZTtcbiAgICAvLyBJdGVyYXRlIG92ZXIgYWxsIHRoZSB2YWx1ZXMgZm91bmQgaW4gYWxsIHRoZSBicmFuY2hlcywgYW5kIGlmIGEgdmFsdWUgaXNcbiAgICAvLyBhbiBhcnJheSBpdHNlbGYsIGl0ZXJhdGUgb3ZlciB0aGUgdmFsdWVzIGluIHRoZSBhcnJheSBzZXBhcmF0ZWx5LlxuICAgIF8uZWFjaChicmFuY2hWYWx1ZXMsIGZ1bmN0aW9uIChicmFuY2hWYWx1ZSkge1xuICAgICAgLy8gVmFsdWUgbm90IGFuIGFycmF5PyBQcmV0ZW5kIGl0IGlzLlxuICAgICAgaWYgKCFpc0FycmF5KGJyYW5jaFZhbHVlKSlcbiAgICAgICAgYnJhbmNoVmFsdWUgPSBbYnJhbmNoVmFsdWVdO1xuICAgICAgLy8gVmFsdWUgaXMgYW4gZW1wdHkgYXJyYXk/IFByZXRlbmQgaXQgd2FzIG1pc3NpbmcsIHNpbmNlIHRoYXQncyB3aGVyZSBpdFxuICAgICAgLy8gc2hvdWxkIGJlIHNvcnRlZC5cbiAgICAgIGlmIChpc0FycmF5KGJyYW5jaFZhbHVlKSAmJiBicmFuY2hWYWx1ZS5sZW5ndGggPT09IDApXG4gICAgICAgIGJyYW5jaFZhbHVlID0gW3VuZGVmaW5lZF07XG4gICAgICBfLmVhY2goYnJhbmNoVmFsdWUsIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAvLyBXZSBzaG91bGQgZ2V0IGhlcmUgYXQgbGVhc3Qgb25jZTogbG9va3VwIGZ1bmN0aW9ucyByZXR1cm4gbm9uLWVtcHR5XG4gICAgICAgIC8vIGFycmF5cywgc28gdGhlIG91dGVyIGxvb3AgcnVucyBhdCBsZWFzdCBvbmNlLCBhbmQgd2UgcHJldmVudGVkXG4gICAgICAgIC8vIGJyYW5jaFZhbHVlIGZyb20gYmVpbmcgYW4gZW1wdHkgYXJyYXkuXG4gICAgICAgIGlmIChmaXJzdCkge1xuICAgICAgICAgIHJlZHVjZWQgPSB2YWx1ZTtcbiAgICAgICAgICBmaXJzdCA9IGZhbHNlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIENvbXBhcmUgdGhlIHZhbHVlIHdlIGZvdW5kIHRvIHRoZSB2YWx1ZSB3ZSBmb3VuZCBzbyBmYXIsIHNhdmluZyBpdFxuICAgICAgICAgIC8vIGlmIGl0J3MgbGVzcyAoZm9yIGFuIGFzY2VuZGluZyBzb3J0KSBvciBtb3JlIChmb3IgYSBkZXNjZW5kaW5nXG4gICAgICAgICAgLy8gc29ydCkuXG4gICAgICAgICAgdmFyIGNtcCA9IExvY2FsQ29sbGVjdGlvbi5fZi5fY21wKHJlZHVjZWQsIHZhbHVlKTtcbiAgICAgICAgICBpZiAoKGZpbmRNaW4gJiYgY21wID4gMCkgfHwgKCFmaW5kTWluICYmIGNtcCA8IDApKVxuICAgICAgICAgICAgcmVkdWNlZCA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICByZXR1cm4gcmVkdWNlZDtcbiAgfTtcblxuICByZXR1cm4gZnVuY3Rpb24gKGEsIGIpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNvcnRTcGVjUGFydHMubGVuZ3RoOyArK2kpIHtcbiAgICAgIHZhciBzcGVjUGFydCA9IHNvcnRTcGVjUGFydHNbaV07XG4gICAgICB2YXIgYVZhbHVlID0gcmVkdWNlVmFsdWUoc3BlY1BhcnQubG9va3VwKGEpLCBzcGVjUGFydC5hc2NlbmRpbmcpO1xuICAgICAgdmFyIGJWYWx1ZSA9IHJlZHVjZVZhbHVlKHNwZWNQYXJ0Lmxvb2t1cChiKSwgc3BlY1BhcnQuYXNjZW5kaW5nKTtcbiAgICAgIHZhciBjb21wYXJlID0gTG9jYWxDb2xsZWN0aW9uLl9mLl9jbXAoYVZhbHVlLCBiVmFsdWUpO1xuICAgICAgaWYgKGNvbXBhcmUgIT09IDApXG4gICAgICAgIHJldHVybiBzcGVjUGFydC5hc2NlbmRpbmcgPyBjb21wYXJlIDogLWNvbXBhcmU7XG4gICAgfTtcbiAgICByZXR1cm4gMDtcbiAgfTtcbn07XG5cbmV4cG9ydHMuY29tcGlsZURvY3VtZW50U2VsZWN0b3IgPSBjb21waWxlRG9jdW1lbnRTZWxlY3RvcjtcbmV4cG9ydHMuY29tcGlsZVNvcnQgPSBMb2NhbENvbGxlY3Rpb24uX2NvbXBpbGVTb3J0OyIsIiMgVXRpbGl0aWVzIGZvciBkYiBoYW5kbGluZ1xuXG5jb21waWxlRG9jdW1lbnRTZWxlY3RvciA9IHJlcXVpcmUoJy4vc2VsZWN0b3InKS5jb21waWxlRG9jdW1lbnRTZWxlY3RvclxuY29tcGlsZVNvcnQgPSByZXF1aXJlKCcuL3NlbGVjdG9yJykuY29tcGlsZVNvcnRcbkdlb0pTT04gPSByZXF1aXJlICcuLi9HZW9KU09OJ1xuXG5cbmV4cG9ydHMucHJvY2Vzc0ZpbmQgPSAoaXRlbXMsIHNlbGVjdG9yLCBvcHRpb25zKSAtPlxuICBmaWx0ZXJlZCA9IF8uZmlsdGVyKF8udmFsdWVzKGl0ZW1zKSwgY29tcGlsZURvY3VtZW50U2VsZWN0b3Ioc2VsZWN0b3IpKVxuXG4gICMgSGFuZGxlIGdlb3NwYXRpYWwgb3BlcmF0b3JzXG4gIGZpbHRlcmVkID0gcHJvY2Vzc05lYXJPcGVyYXRvcihzZWxlY3RvciwgZmlsdGVyZWQpXG4gIGZpbHRlcmVkID0gcHJvY2Vzc0dlb0ludGVyc2VjdHNPcGVyYXRvcihzZWxlY3RvciwgZmlsdGVyZWQpXG5cbiAgaWYgb3B0aW9ucyBhbmQgb3B0aW9ucy5zb3J0IFxuICAgIGZpbHRlcmVkLnNvcnQoY29tcGlsZVNvcnQob3B0aW9ucy5zb3J0KSlcblxuICBpZiBvcHRpb25zIGFuZCBvcHRpb25zLmxpbWl0XG4gICAgZmlsdGVyZWQgPSBfLmZpcnN0IGZpbHRlcmVkLCBvcHRpb25zLmxpbWl0XG5cbiAgIyBDbG9uZSB0byBwcmV2ZW50IGFjY2lkZW50YWwgdXBkYXRlcywgb3IgYXBwbHkgZmllbGRzIGlmIHByZXNlbnRcbiAgaWYgb3B0aW9ucyBhbmQgb3B0aW9ucy5maWVsZHNcbiAgICBpZiBfLmZpcnN0KF8udmFsdWVzKG9wdGlvbnMuZmllbGRzKSkgPT0gMVxuICAgICAgIyBJbmNsdWRlIGZpZWxkc1xuICAgICAgZmlsdGVyZWQgPSBfLm1hcCBmaWx0ZXJlZCwgKGRvYykgLT4gXy5waWNrKGRvYywgXy5rZXlzKG9wdGlvbnMuZmllbGRzKS5jb25jYXQoW1wiX2lkXCJdKSlcbiAgICBlbHNlXG4gICAgICAjIEV4Y2x1ZGUgZmllbGRzXG4gICAgICBmaWx0ZXJlZCA9IF8ubWFwIGZpbHRlcmVkLCAoZG9jKSAtPiBfLm9taXQoZG9jLCBfLmtleXMob3B0aW9ucy5maWVsZHMpKVxuICBlbHNlXG4gICAgZmlsdGVyZWQgPSBfLm1hcCBmaWx0ZXJlZCwgKGRvYykgLT4gXy5jbG9uZURlZXAoZG9jKVxuXG4gIHJldHVybiBmaWx0ZXJlZFxuXG5leHBvcnRzLmNyZWF0ZVVpZCA9IC0+IFxuICAneHh4eHh4eHh4eHh4NHh4eHl4eHh4eHh4eHh4eHh4eHgnLnJlcGxhY2UoL1t4eV0vZywgKGMpIC0+XG4gICAgciA9IE1hdGgucmFuZG9tKCkqMTZ8MFxuICAgIHYgPSBpZiBjID09ICd4JyB0aGVuIHIgZWxzZSAociYweDN8MHg4KVxuICAgIHJldHVybiB2LnRvU3RyaW5nKDE2KVxuICAgKVxuXG5wcm9jZXNzTmVhck9wZXJhdG9yID0gKHNlbGVjdG9yLCBsaXN0KSAtPlxuICBmb3Iga2V5LCB2YWx1ZSBvZiBzZWxlY3RvclxuICAgIGlmIHZhbHVlPyBhbmQgdmFsdWVbJyRuZWFyJ11cbiAgICAgIGdlbyA9IHZhbHVlWyckbmVhciddWyckZ2VvbWV0cnknXVxuICAgICAgaWYgZ2VvLnR5cGUgIT0gJ1BvaW50J1xuICAgICAgICBicmVha1xuXG4gICAgICBuZWFyID0gbmV3IEwuTGF0TG5nKGdlby5jb29yZGluYXRlc1sxXSwgZ2VvLmNvb3JkaW5hdGVzWzBdKVxuXG4gICAgICBsaXN0ID0gXy5maWx0ZXIgbGlzdCwgKGRvYykgLT5cbiAgICAgICAgcmV0dXJuIGRvY1trZXldIGFuZCBkb2Nba2V5XS50eXBlID09ICdQb2ludCdcblxuICAgICAgIyBHZXQgZGlzdGFuY2VzXG4gICAgICBkaXN0YW5jZXMgPSBfLm1hcCBsaXN0LCAoZG9jKSAtPlxuICAgICAgICByZXR1cm4geyBkb2M6IGRvYywgZGlzdGFuY2U6IFxuICAgICAgICAgIG5lYXIuZGlzdGFuY2VUbyhuZXcgTC5MYXRMbmcoZG9jW2tleV0uY29vcmRpbmF0ZXNbMV0sIGRvY1trZXldLmNvb3JkaW5hdGVzWzBdKSlcbiAgICAgICAgfVxuXG4gICAgICAjIEZpbHRlciBub24tcG9pbnRzXG4gICAgICBkaXN0YW5jZXMgPSBfLmZpbHRlciBkaXN0YW5jZXMsIChpdGVtKSAtPiBpdGVtLmRpc3RhbmNlID49IDBcblxuICAgICAgIyBTb3J0IGJ5IGRpc3RhbmNlXG4gICAgICBkaXN0YW5jZXMgPSBfLnNvcnRCeSBkaXN0YW5jZXMsICdkaXN0YW5jZSdcblxuICAgICAgIyBGaWx0ZXIgYnkgbWF4RGlzdGFuY2VcbiAgICAgIGlmIHZhbHVlWyckbmVhciddWyckbWF4RGlzdGFuY2UnXVxuICAgICAgICBkaXN0YW5jZXMgPSBfLmZpbHRlciBkaXN0YW5jZXMsIChpdGVtKSAtPiBpdGVtLmRpc3RhbmNlIDw9IHZhbHVlWyckbmVhciddWyckbWF4RGlzdGFuY2UnXVxuXG4gICAgICAjIExpbWl0IHRvIDEwMFxuICAgICAgZGlzdGFuY2VzID0gXy5maXJzdCBkaXN0YW5jZXMsIDEwMFxuXG4gICAgICAjIEV4dHJhY3QgZG9jc1xuICAgICAgbGlzdCA9IF8ucGx1Y2sgZGlzdGFuY2VzLCAnZG9jJ1xuICByZXR1cm4gbGlzdFxuXG5wcm9jZXNzR2VvSW50ZXJzZWN0c09wZXJhdG9yID0gKHNlbGVjdG9yLCBsaXN0KSAtPlxuICBmb3Iga2V5LCB2YWx1ZSBvZiBzZWxlY3RvclxuICAgIGlmIHZhbHVlPyBhbmQgdmFsdWVbJyRnZW9JbnRlcnNlY3RzJ11cbiAgICAgIGdlbyA9IHZhbHVlWyckZ2VvSW50ZXJzZWN0cyddWyckZ2VvbWV0cnknXVxuICAgICAgaWYgZ2VvLnR5cGUgIT0gJ1BvbHlnb24nXG4gICAgICAgIGJyZWFrXG5cbiAgICAgICMgQ2hlY2sgd2l0aGluIGZvciBlYWNoXG4gICAgICBsaXN0ID0gXy5maWx0ZXIgbGlzdCwgKGRvYykgLT5cbiAgICAgICAgIyBSZWplY3Qgbm9uLXBvaW50c1xuICAgICAgICBpZiBub3QgZG9jW2tleV0gb3IgZG9jW2tleV0udHlwZSAhPSAnUG9pbnQnXG4gICAgICAgICAgcmV0dXJuIGZhbHNlXG5cbiAgICAgICAgIyBDaGVjayBwb2x5Z29uXG4gICAgICAgIHJldHVybiBHZW9KU09OLnBvaW50SW5Qb2x5Z29uKGRvY1trZXldLCBnZW8pXG5cbiAgcmV0dXJuIGxpc3RcbiIsIlBhZ2UgPSByZXF1aXJlKFwiLi4vUGFnZVwiKVxuTG9jYXRpb25GaW5kZXIgPSByZXF1aXJlICcuLi9Mb2NhdGlvbkZpbmRlcidcbkdlb0pTT04gPSByZXF1aXJlICcuLi9HZW9KU09OJ1xuXG4jIFRPRE8gc291cmNlIHNlYXJjaFxuXG4jIExpc3RzIG5lYXJieSBhbmQgdW5sb2NhdGVkIHNvdXJjZXNcbiMgT3B0aW9uczogb25TZWxlY3QgLSBmdW5jdGlvbiB0byBjYWxsIHdpdGggc291cmNlIGRvYyB3aGVuIHNlbGVjdGVkXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFNvdXJjZUxpc3RQYWdlIGV4dGVuZHMgUGFnZVxuICBldmVudHM6IFxuICAgICdjbGljayB0ci50YXBwYWJsZScgOiAnc291cmNlQ2xpY2tlZCdcbiAgICAnY2xpY2sgI3NlYXJjaF9jYW5jZWwnIDogJ2NhbmNlbFNlYXJjaCdcblxuICBjcmVhdGU6IC0+XG4gICAgQHNldFRpdGxlICdOZWFyYnkgU291cmNlcydcblxuICBhY3RpdmF0ZTogLT5cbiAgICBAJGVsLmh0bWwgdGVtcGxhdGVzWydwYWdlcy9Tb3VyY2VMaXN0UGFnZSddKClcbiAgICBAbmVhclNvdXJjZXMgPSBbXVxuICAgIEB1bmxvY2F0ZWRTb3VyY2VzID0gW11cblxuICAgICMgRmluZCBsb2NhdGlvblxuICAgIEBsb2NhdGlvbkZpbmRlciA9IG5ldyBMb2NhdGlvbkZpbmRlcigpXG4gICAgQGxvY2F0aW9uRmluZGVyLm9uKCdmb3VuZCcsIEBsb2NhdGlvbkZvdW5kKS5vbignZXJyb3InLCBAbG9jYXRpb25FcnJvcilcbiAgICBAbG9jYXRpb25GaW5kZXIuZ2V0TG9jYXRpb24oKVxuICAgIEAkKFwiI2xvY2F0aW9uX21zZ1wiKS5zaG93KClcblxuICAgIEBzZXR1cEJ1dHRvbkJhciBbXG4gICAgICB7IGljb246IFwic2VhcmNoLnBuZ1wiLCBjbGljazogPT4gQHNlYXJjaCgpIH1cbiAgICAgIHsgaWNvbjogXCJwbHVzLnBuZ1wiLCBjbGljazogPT4gQGFkZFNvdXJjZSgpIH1cbiAgICBdXG5cbiAgICAjIFF1ZXJ5IGRhdGFiYXNlIGZvciB1bmxvY2F0ZWQgc291cmNlcyAjIFRPRE8gb25seSBieSB1c2VyXG4gICAgQGRiLnNvdXJjZXMuZmluZChnZW86IHskZXhpc3RzOmZhbHNlfSkuZmV0Y2ggKHNvdXJjZXMpID0+XG4gICAgICBAdW5sb2NhdGVkU291cmNlcyA9IHNvdXJjZXNcbiAgICAgIEByZW5kZXJMaXN0KClcblxuICAgIEBwZXJmb3JtU2VhcmNoKClcblxuICBhZGRTb3VyY2U6IC0+XG4gICAgQHBhZ2VyLm9wZW5QYWdlKHJlcXVpcmUoXCIuL05ld1NvdXJjZVBhZ2VcIikpXG4gICAgXG4gIGxvY2F0aW9uRm91bmQ6IChwb3MpID0+XG4gICAgQCQoXCIjbG9jYXRpb25fbXNnXCIpLmhpZGUoKVxuICAgIHNlbGVjdG9yID0gZ2VvOiBcbiAgICAgICRuZWFyOiBcbiAgICAgICAgJGdlb21ldHJ5OiBHZW9KU09OLnBvc1RvUG9pbnQocG9zKVxuXG4gICAgIyBRdWVyeSBkYXRhYmFzZSBmb3IgbmVhciBzb3VyY2VzXG4gICAgQGRiLnNvdXJjZXMuZmluZChzZWxlY3RvcikuZmV0Y2ggKHNvdXJjZXMpID0+XG4gICAgICBAbmVhclNvdXJjZXMgPSBzb3VyY2VzXG4gICAgICBAcmVuZGVyTGlzdCgpXG5cbiAgcmVuZGVyTGlzdDogLT5cbiAgICAjIEFwcGVuZCBsb2NhdGVkIGFuZCB1bmxvY2F0ZWQgc291cmNlc1xuICAgIGlmIG5vdCBAc2VhcmNoVGV4dFxuICAgICAgc291cmNlcyA9IEB1bmxvY2F0ZWRTb3VyY2VzLmNvbmNhdChAbmVhclNvdXJjZXMpXG4gICAgZWxzZVxuICAgICAgc291cmNlcyA9IEBzZWFyY2hTb3VyY2VzXG5cbiAgICBAJChcIiN0YWJsZVwiKS5odG1sIHRlbXBsYXRlc1sncGFnZXMvU291cmNlTGlzdFBhZ2VfaXRlbXMnXShzb3VyY2VzOnNvdXJjZXMpXG5cbiAgbG9jYXRpb25FcnJvcjogKHBvcykgPT5cbiAgICBAJChcIiNsb2NhdGlvbl9tc2dcIikuaGlkZSgpXG4gICAgQHBhZ2VyLmZsYXNoIFwiVW5hYmxlIHRvIGRldGVybWluZSBsb2NhdGlvblwiLCBcImVycm9yXCJcblxuICBzb3VyY2VDbGlja2VkOiAoZXYpIC0+XG4gICAgIyBXcmFwIG9uU2VsZWN0XG4gICAgb25TZWxlY3QgPSB1bmRlZmluZWRcbiAgICBpZiBAb3B0aW9ucy5vblNlbGVjdFxuICAgICAgb25TZWxlY3QgPSAoc291cmNlKSA9PlxuICAgICAgICBAcGFnZXIuY2xvc2VQYWdlKClcbiAgICAgICAgQG9wdGlvbnMub25TZWxlY3Qoc291cmNlKVxuICAgIEBwYWdlci5vcGVuUGFnZShyZXF1aXJlKFwiLi9Tb3VyY2VQYWdlXCIpLCB7IF9pZDogZXYuY3VycmVudFRhcmdldC5pZCwgb25TZWxlY3Q6IG9uU2VsZWN0fSlcblxuICBzZWFyY2g6IC0+XG4gICAgIyBQcm9tcHQgZm9yIHNlYXJjaFxuICAgIEBzZWFyY2hUZXh0ID0gcHJvbXB0KFwiRW50ZXIgc2VhcmNoIHRleHQgb3IgSUQgb2Ygd2F0ZXIgc291cmNlXCIpXG4gICAgQHBlcmZvcm1TZWFyY2goKVxuXG4gIHBlcmZvcm1TZWFyY2g6IC0+XG4gICAgQCQoXCIjc2VhcmNoX2JhclwiKS50b2dnbGUoQHNlYXJjaFRleHQgYW5kIEBzZWFyY2hUZXh0Lmxlbmd0aD4wKVxuICAgIEAkKFwiI3NlYXJjaF90ZXh0XCIpLnRleHQoQHNlYXJjaFRleHQpXG4gICAgaWYgQHNlYXJjaFRleHRcbiAgICAgICMgSWYgZGlnaXRzLCBzZWFyY2ggZm9yIGNvZGVcbiAgICAgIGlmIEBzZWFyY2hUZXh0Lm1hdGNoKC9eXFxkKyQvKVxuICAgICAgICBzZWxlY3RvciA9IHsgY29kZTogQHNlYXJjaFRleHQgfVxuICAgICAgZWxzZVxuICAgICAgICBzZWxlY3RvciA9IHsgbmFtZTogbmV3IFJlZ0V4cChAc2VhcmNoVGV4dCxcImlcIil9XG4gICAgICAgIFxuICAgICAgQGRiLnNvdXJjZXMuZmluZChzZWxlY3Rvciwge2xpbWl0OiA1MH0pLmZldGNoIChzb3VyY2VzKSA9PlxuICAgICAgICBAc2VhcmNoU291cmNlcyA9IHNvdXJjZXNcbiAgICAgICAgQHJlbmRlckxpc3QoKVxuICAgIGVsc2VcbiAgICAgIEByZW5kZXJMaXN0KClcblxuICBjYW5jZWxTZWFyY2g6IC0+XG4gICAgQHNlYXJjaFRleHQgPSBcIlwiXG4gICAgQHBlcmZvcm1TZWFyY2goKVxuXG4iLCJFSlNPTiA9IHt9OyAvLyBHbG9iYWwhXG52YXIgY3VzdG9tVHlwZXMgPSB7fTtcbi8vIEFkZCBhIGN1c3RvbSB0eXBlLCB1c2luZyBhIG1ldGhvZCBvZiB5b3VyIGNob2ljZSB0byBnZXQgdG8gYW5kXG4vLyBmcm9tIGEgYmFzaWMgSlNPTi1hYmxlIHJlcHJlc2VudGF0aW9uLiAgVGhlIGZhY3RvcnkgYXJndW1lbnRcbi8vIGlzIGEgZnVuY3Rpb24gb2YgSlNPTi1hYmxlIC0tPiB5b3VyIG9iamVjdFxuLy8gVGhlIHR5cGUgeW91IGFkZCBtdXN0IGhhdmU6XG4vLyAtIEEgY2xvbmUoKSBtZXRob2QsIHNvIHRoYXQgTWV0ZW9yIGNhbiBkZWVwLWNvcHkgaXQgd2hlbiBuZWNlc3NhcnkuXG4vLyAtIEEgZXF1YWxzKCkgbWV0aG9kLCBzbyB0aGF0IE1ldGVvciBjYW4gY29tcGFyZSBpdFxuLy8gLSBBIHRvSlNPTlZhbHVlKCkgbWV0aG9kLCBzbyB0aGF0IE1ldGVvciBjYW4gc2VyaWFsaXplIGl0XG4vLyAtIGEgdHlwZU5hbWUoKSBtZXRob2QsIHRvIHNob3cgaG93IHRvIGxvb2sgaXQgdXAgaW4gb3VyIHR5cGUgdGFibGUuXG4vLyBJdCBpcyBva2F5IGlmIHRoZXNlIG1ldGhvZHMgYXJlIG1vbmtleS1wYXRjaGVkIG9uLlxuRUpTT04uYWRkVHlwZSA9IGZ1bmN0aW9uIChuYW1lLCBmYWN0b3J5KSB7XG4gIGlmIChfLmhhcyhjdXN0b21UeXBlcywgbmFtZSkpXG4gICAgdGhyb3cgbmV3IEVycm9yKFwiVHlwZSBcIiArIG5hbWUgKyBcIiBhbHJlYWR5IHByZXNlbnRcIik7XG4gIGN1c3RvbVR5cGVzW25hbWVdID0gZmFjdG9yeTtcbn07XG5cbnZhciBidWlsdGluQ29udmVydGVycyA9IFtcbiAgeyAvLyBEYXRlXG4gICAgbWF0Y2hKU09OVmFsdWU6IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgIHJldHVybiBfLmhhcyhvYmosICckZGF0ZScpICYmIF8uc2l6ZShvYmopID09PSAxO1xuICAgIH0sXG4gICAgbWF0Y2hPYmplY3Q6IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgIHJldHVybiBvYmogaW5zdGFuY2VvZiBEYXRlO1xuICAgIH0sXG4gICAgdG9KU09OVmFsdWU6IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgIHJldHVybiB7JGRhdGU6IG9iai5nZXRUaW1lKCl9O1xuICAgIH0sXG4gICAgZnJvbUpTT05WYWx1ZTogZnVuY3Rpb24gKG9iaikge1xuICAgICAgcmV0dXJuIG5ldyBEYXRlKG9iai4kZGF0ZSk7XG4gICAgfVxuICB9LFxuICB7IC8vIEJpbmFyeVxuICAgIG1hdGNoSlNPTlZhbHVlOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICByZXR1cm4gXy5oYXMob2JqLCAnJGJpbmFyeScpICYmIF8uc2l6ZShvYmopID09PSAxO1xuICAgIH0sXG4gICAgbWF0Y2hPYmplY3Q6IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgIHJldHVybiB0eXBlb2YgVWludDhBcnJheSAhPT0gJ3VuZGVmaW5lZCcgJiYgb2JqIGluc3RhbmNlb2YgVWludDhBcnJheVxuICAgICAgICB8fCAob2JqICYmIF8uaGFzKG9iaiwgJyRVaW50OEFycmF5UG9seWZpbGwnKSk7XG4gICAgfSxcbiAgICB0b0pTT05WYWx1ZTogZnVuY3Rpb24gKG9iaikge1xuICAgICAgcmV0dXJuIHskYmluYXJ5OiBFSlNPTi5fYmFzZTY0RW5jb2RlKG9iail9O1xuICAgIH0sXG4gICAgZnJvbUpTT05WYWx1ZTogZnVuY3Rpb24gKG9iaikge1xuICAgICAgcmV0dXJuIEVKU09OLl9iYXNlNjREZWNvZGUob2JqLiRiaW5hcnkpO1xuICAgIH1cbiAgfSxcbiAgeyAvLyBFc2NhcGluZyBvbmUgbGV2ZWxcbiAgICBtYXRjaEpTT05WYWx1ZTogZnVuY3Rpb24gKG9iaikge1xuICAgICAgcmV0dXJuIF8uaGFzKG9iaiwgJyRlc2NhcGUnKSAmJiBfLnNpemUob2JqKSA9PT0gMTtcbiAgICB9LFxuICAgIG1hdGNoT2JqZWN0OiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICBpZiAoXy5pc0VtcHR5KG9iaikgfHwgXy5zaXplKG9iaikgPiAyKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBfLmFueShidWlsdGluQ29udmVydGVycywgZnVuY3Rpb24gKGNvbnZlcnRlcikge1xuICAgICAgICByZXR1cm4gY29udmVydGVyLm1hdGNoSlNPTlZhbHVlKG9iaik7XG4gICAgICB9KTtcbiAgICB9LFxuICAgIHRvSlNPTlZhbHVlOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICB2YXIgbmV3T2JqID0ge307XG4gICAgICBfLmVhY2gob2JqLCBmdW5jdGlvbiAodmFsdWUsIGtleSkge1xuICAgICAgICBuZXdPYmpba2V5XSA9IEVKU09OLnRvSlNPTlZhbHVlKHZhbHVlKTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHskZXNjYXBlOiBuZXdPYmp9O1xuICAgIH0sXG4gICAgZnJvbUpTT05WYWx1ZTogZnVuY3Rpb24gKG9iaikge1xuICAgICAgdmFyIG5ld09iaiA9IHt9O1xuICAgICAgXy5lYWNoKG9iai4kZXNjYXBlLCBmdW5jdGlvbiAodmFsdWUsIGtleSkge1xuICAgICAgICBuZXdPYmpba2V5XSA9IEVKU09OLmZyb21KU09OVmFsdWUodmFsdWUpO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gbmV3T2JqO1xuICAgIH1cbiAgfSxcbiAgeyAvLyBDdXN0b21cbiAgICBtYXRjaEpTT05WYWx1ZTogZnVuY3Rpb24gKG9iaikge1xuICAgICAgcmV0dXJuIF8uaGFzKG9iaiwgJyR0eXBlJykgJiYgXy5oYXMob2JqLCAnJHZhbHVlJykgJiYgXy5zaXplKG9iaikgPT09IDI7XG4gICAgfSxcbiAgICBtYXRjaE9iamVjdDogZnVuY3Rpb24gKG9iaikge1xuICAgICAgcmV0dXJuIEVKU09OLl9pc0N1c3RvbVR5cGUob2JqKTtcbiAgICB9LFxuICAgIHRvSlNPTlZhbHVlOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICByZXR1cm4geyR0eXBlOiBvYmoudHlwZU5hbWUoKSwgJHZhbHVlOiBvYmoudG9KU09OVmFsdWUoKX07XG4gICAgfSxcbiAgICBmcm9tSlNPTlZhbHVlOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICB2YXIgdHlwZU5hbWUgPSBvYmouJHR5cGU7XG4gICAgICB2YXIgY29udmVydGVyID0gY3VzdG9tVHlwZXNbdHlwZU5hbWVdO1xuICAgICAgcmV0dXJuIGNvbnZlcnRlcihvYmouJHZhbHVlKTtcbiAgICB9XG4gIH1cbl07XG5cbkVKU09OLl9pc0N1c3RvbVR5cGUgPSBmdW5jdGlvbiAob2JqKSB7XG4gIHJldHVybiBvYmogJiZcbiAgICB0eXBlb2Ygb2JqLnRvSlNPTlZhbHVlID09PSAnZnVuY3Rpb24nICYmXG4gICAgdHlwZW9mIG9iai50eXBlTmFtZSA9PT0gJ2Z1bmN0aW9uJyAmJlxuICAgIF8uaGFzKGN1c3RvbVR5cGVzLCBvYmoudHlwZU5hbWUoKSk7XG59O1xuXG5cbi8vZm9yIGJvdGggYXJyYXlzIGFuZCBvYmplY3RzLCBpbi1wbGFjZSBtb2RpZmljYXRpb24uXG52YXIgYWRqdXN0VHlwZXNUb0pTT05WYWx1ZSA9XG5FSlNPTi5fYWRqdXN0VHlwZXNUb0pTT05WYWx1ZSA9IGZ1bmN0aW9uIChvYmopIHtcbiAgaWYgKG9iaiA9PT0gbnVsbClcbiAgICByZXR1cm4gbnVsbDtcbiAgdmFyIG1heWJlQ2hhbmdlZCA9IHRvSlNPTlZhbHVlSGVscGVyKG9iaik7XG4gIGlmIChtYXliZUNoYW5nZWQgIT09IHVuZGVmaW5lZClcbiAgICByZXR1cm4gbWF5YmVDaGFuZ2VkO1xuICBfLmVhY2gob2JqLCBmdW5jdGlvbiAodmFsdWUsIGtleSkge1xuICAgIGlmICh0eXBlb2YgdmFsdWUgIT09ICdvYmplY3QnICYmIHZhbHVlICE9PSB1bmRlZmluZWQpXG4gICAgICByZXR1cm47IC8vIGNvbnRpbnVlXG4gICAgdmFyIGNoYW5nZWQgPSB0b0pTT05WYWx1ZUhlbHBlcih2YWx1ZSk7XG4gICAgaWYgKGNoYW5nZWQpIHtcbiAgICAgIG9ialtrZXldID0gY2hhbmdlZDtcbiAgICAgIHJldHVybjsgLy8gb24gdG8gdGhlIG5leHQga2V5XG4gICAgfVxuICAgIC8vIGlmIHdlIGdldCBoZXJlLCB2YWx1ZSBpcyBhbiBvYmplY3QgYnV0IG5vdCBhZGp1c3RhYmxlXG4gICAgLy8gYXQgdGhpcyBsZXZlbC4gIHJlY3Vyc2UuXG4gICAgYWRqdXN0VHlwZXNUb0pTT05WYWx1ZSh2YWx1ZSk7XG4gIH0pO1xuICByZXR1cm4gb2JqO1xufTtcblxuLy8gRWl0aGVyIHJldHVybiB0aGUgSlNPTi1jb21wYXRpYmxlIHZlcnNpb24gb2YgdGhlIGFyZ3VtZW50LCBvciB1bmRlZmluZWQgKGlmXG4vLyB0aGUgaXRlbSBpc24ndCBpdHNlbGYgcmVwbGFjZWFibGUsIGJ1dCBtYXliZSBzb21lIGZpZWxkcyBpbiBpdCBhcmUpXG52YXIgdG9KU09OVmFsdWVIZWxwZXIgPSBmdW5jdGlvbiAoaXRlbSkge1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGJ1aWx0aW5Db252ZXJ0ZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGNvbnZlcnRlciA9IGJ1aWx0aW5Db252ZXJ0ZXJzW2ldO1xuICAgIGlmIChjb252ZXJ0ZXIubWF0Y2hPYmplY3QoaXRlbSkpIHtcbiAgICAgIHJldHVybiBjb252ZXJ0ZXIudG9KU09OVmFsdWUoaXRlbSk7XG4gICAgfVxuICB9XG4gIHJldHVybiB1bmRlZmluZWQ7XG59O1xuXG5FSlNPTi50b0pTT05WYWx1ZSA9IGZ1bmN0aW9uIChpdGVtKSB7XG4gIHZhciBjaGFuZ2VkID0gdG9KU09OVmFsdWVIZWxwZXIoaXRlbSk7XG4gIGlmIChjaGFuZ2VkICE9PSB1bmRlZmluZWQpXG4gICAgcmV0dXJuIGNoYW5nZWQ7XG4gIGlmICh0eXBlb2YgaXRlbSA9PT0gJ29iamVjdCcpIHtcbiAgICBpdGVtID0gRUpTT04uY2xvbmUoaXRlbSk7XG4gICAgYWRqdXN0VHlwZXNUb0pTT05WYWx1ZShpdGVtKTtcbiAgfVxuICByZXR1cm4gaXRlbTtcbn07XG5cbi8vZm9yIGJvdGggYXJyYXlzIGFuZCBvYmplY3RzLiBUcmllcyBpdHMgYmVzdCB0byBqdXN0XG4vLyB1c2UgdGhlIG9iamVjdCB5b3UgaGFuZCBpdCwgYnV0IG1heSByZXR1cm4gc29tZXRoaW5nXG4vLyBkaWZmZXJlbnQgaWYgdGhlIG9iamVjdCB5b3UgaGFuZCBpdCBpdHNlbGYgbmVlZHMgY2hhbmdpbmcuXG52YXIgYWRqdXN0VHlwZXNGcm9tSlNPTlZhbHVlID1cbkVKU09OLl9hZGp1c3RUeXBlc0Zyb21KU09OVmFsdWUgPSBmdW5jdGlvbiAob2JqKSB7XG4gIGlmIChvYmogPT09IG51bGwpXG4gICAgcmV0dXJuIG51bGw7XG4gIHZhciBtYXliZUNoYW5nZWQgPSBmcm9tSlNPTlZhbHVlSGVscGVyKG9iaik7XG4gIGlmIChtYXliZUNoYW5nZWQgIT09IG9iailcbiAgICByZXR1cm4gbWF5YmVDaGFuZ2VkO1xuICBfLmVhY2gob2JqLCBmdW5jdGlvbiAodmFsdWUsIGtleSkge1xuICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnKSB7XG4gICAgICB2YXIgY2hhbmdlZCA9IGZyb21KU09OVmFsdWVIZWxwZXIodmFsdWUpO1xuICAgICAgaWYgKHZhbHVlICE9PSBjaGFuZ2VkKSB7XG4gICAgICAgIG9ialtrZXldID0gY2hhbmdlZDtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgLy8gaWYgd2UgZ2V0IGhlcmUsIHZhbHVlIGlzIGFuIG9iamVjdCBidXQgbm90IGFkanVzdGFibGVcbiAgICAgIC8vIGF0IHRoaXMgbGV2ZWwuICByZWN1cnNlLlxuICAgICAgYWRqdXN0VHlwZXNGcm9tSlNPTlZhbHVlKHZhbHVlKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gb2JqO1xufTtcblxuLy8gRWl0aGVyIHJldHVybiB0aGUgYXJndW1lbnQgY2hhbmdlZCB0byBoYXZlIHRoZSBub24tanNvblxuLy8gcmVwIG9mIGl0c2VsZiAodGhlIE9iamVjdCB2ZXJzaW9uKSBvciB0aGUgYXJndW1lbnQgaXRzZWxmLlxuXG4vLyBET0VTIE5PVCBSRUNVUlNFLiAgRm9yIGFjdHVhbGx5IGdldHRpbmcgdGhlIGZ1bGx5LWNoYW5nZWQgdmFsdWUsIHVzZVxuLy8gRUpTT04uZnJvbUpTT05WYWx1ZVxudmFyIGZyb21KU09OVmFsdWVIZWxwZXIgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUgIT09IG51bGwpIHtcbiAgICBpZiAoXy5zaXplKHZhbHVlKSA8PSAyXG4gICAgICAgICYmIF8uYWxsKHZhbHVlLCBmdW5jdGlvbiAodiwgaykge1xuICAgICAgICAgIHJldHVybiB0eXBlb2YgayA9PT0gJ3N0cmluZycgJiYgay5zdWJzdHIoMCwgMSkgPT09ICckJztcbiAgICAgICAgfSkpIHtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYnVpbHRpbkNvbnZlcnRlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGNvbnZlcnRlciA9IGJ1aWx0aW5Db252ZXJ0ZXJzW2ldO1xuICAgICAgICBpZiAoY29udmVydGVyLm1hdGNoSlNPTlZhbHVlKHZhbHVlKSkge1xuICAgICAgICAgIHJldHVybiBjb252ZXJ0ZXIuZnJvbUpTT05WYWx1ZSh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIHZhbHVlO1xufTtcblxuRUpTT04uZnJvbUpTT05WYWx1ZSA9IGZ1bmN0aW9uIChpdGVtKSB7XG4gIHZhciBjaGFuZ2VkID0gZnJvbUpTT05WYWx1ZUhlbHBlcihpdGVtKTtcbiAgaWYgKGNoYW5nZWQgPT09IGl0ZW0gJiYgdHlwZW9mIGl0ZW0gPT09ICdvYmplY3QnKSB7XG4gICAgaXRlbSA9IEVKU09OLmNsb25lKGl0ZW0pO1xuICAgIGFkanVzdFR5cGVzRnJvbUpTT05WYWx1ZShpdGVtKTtcbiAgICByZXR1cm4gaXRlbTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gY2hhbmdlZDtcbiAgfVxufTtcblxuRUpTT04uc3RyaW5naWZ5ID0gZnVuY3Rpb24gKGl0ZW0pIHtcbiAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KEVKU09OLnRvSlNPTlZhbHVlKGl0ZW0pKTtcbn07XG5cbkVKU09OLnBhcnNlID0gZnVuY3Rpb24gKGl0ZW0pIHtcbiAgcmV0dXJuIEVKU09OLmZyb21KU09OVmFsdWUoSlNPTi5wYXJzZShpdGVtKSk7XG59O1xuXG5FSlNPTi5pc0JpbmFyeSA9IGZ1bmN0aW9uIChvYmopIHtcbiAgcmV0dXJuICh0eXBlb2YgVWludDhBcnJheSAhPT0gJ3VuZGVmaW5lZCcgJiYgb2JqIGluc3RhbmNlb2YgVWludDhBcnJheSkgfHxcbiAgICAob2JqICYmIG9iai4kVWludDhBcnJheVBvbHlmaWxsKTtcbn07XG5cbkVKU09OLmVxdWFscyA9IGZ1bmN0aW9uIChhLCBiLCBvcHRpb25zKSB7XG4gIHZhciBpO1xuICB2YXIga2V5T3JkZXJTZW5zaXRpdmUgPSAhIShvcHRpb25zICYmIG9wdGlvbnMua2V5T3JkZXJTZW5zaXRpdmUpO1xuICBpZiAoYSA9PT0gYilcbiAgICByZXR1cm4gdHJ1ZTtcbiAgaWYgKCFhIHx8ICFiKSAvLyBpZiBlaXRoZXIgb25lIGlzIGZhbHN5LCB0aGV5J2QgaGF2ZSB0byBiZSA9PT0gdG8gYmUgZXF1YWxcbiAgICByZXR1cm4gZmFsc2U7XG4gIGlmICghKHR5cGVvZiBhID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgYiA9PT0gJ29iamVjdCcpKVxuICAgIHJldHVybiBmYWxzZTtcbiAgaWYgKGEgaW5zdGFuY2VvZiBEYXRlICYmIGIgaW5zdGFuY2VvZiBEYXRlKVxuICAgIHJldHVybiBhLnZhbHVlT2YoKSA9PT0gYi52YWx1ZU9mKCk7XG4gIGlmIChFSlNPTi5pc0JpbmFyeShhKSAmJiBFSlNPTi5pc0JpbmFyeShiKSkge1xuICAgIGlmIChhLmxlbmd0aCAhPT0gYi5sZW5ndGgpXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgZm9yIChpID0gMDsgaSA8IGEubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChhW2ldICE9PSBiW2ldKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIGlmICh0eXBlb2YgKGEuZXF1YWxzKSA9PT0gJ2Z1bmN0aW9uJylcbiAgICByZXR1cm4gYS5lcXVhbHMoYiwgb3B0aW9ucyk7XG4gIGlmIChhIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICBpZiAoIShiIGluc3RhbmNlb2YgQXJyYXkpKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIGlmIChhLmxlbmd0aCAhPT0gYi5sZW5ndGgpXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgZm9yIChpID0gMDsgaSA8IGEubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmICghRUpTT04uZXF1YWxzKGFbaV0sIGJbaV0sIG9wdGlvbnMpKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIC8vIGZhbGwgYmFjayB0byBzdHJ1Y3R1cmFsIGVxdWFsaXR5IG9mIG9iamVjdHNcbiAgdmFyIHJldDtcbiAgaWYgKGtleU9yZGVyU2Vuc2l0aXZlKSB7XG4gICAgdmFyIGJLZXlzID0gW107XG4gICAgXy5lYWNoKGIsIGZ1bmN0aW9uICh2YWwsIHgpIHtcbiAgICAgICAgYktleXMucHVzaCh4KTtcbiAgICB9KTtcbiAgICBpID0gMDtcbiAgICByZXQgPSBfLmFsbChhLCBmdW5jdGlvbiAodmFsLCB4KSB7XG4gICAgICBpZiAoaSA+PSBiS2V5cy5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgaWYgKHggIT09IGJLZXlzW2ldKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGlmICghRUpTT04uZXF1YWxzKHZhbCwgYltiS2V5c1tpXV0sIG9wdGlvbnMpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGkrKztcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0pO1xuICAgIHJldHVybiByZXQgJiYgaSA9PT0gYktleXMubGVuZ3RoO1xuICB9IGVsc2Uge1xuICAgIGkgPSAwO1xuICAgIHJldCA9IF8uYWxsKGEsIGZ1bmN0aW9uICh2YWwsIGtleSkge1xuICAgICAgaWYgKCFfLmhhcyhiLCBrZXkpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGlmICghRUpTT04uZXF1YWxzKHZhbCwgYltrZXldLCBvcHRpb25zKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBpKys7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9KTtcbiAgICByZXR1cm4gcmV0ICYmIF8uc2l6ZShiKSA9PT0gaTtcbiAgfVxufTtcblxuRUpTT04uY2xvbmUgPSBmdW5jdGlvbiAodikge1xuICB2YXIgcmV0O1xuICBpZiAodHlwZW9mIHYgIT09IFwib2JqZWN0XCIpXG4gICAgcmV0dXJuIHY7XG4gIGlmICh2ID09PSBudWxsKVxuICAgIHJldHVybiBudWxsOyAvLyBudWxsIGhhcyB0eXBlb2YgXCJvYmplY3RcIlxuICBpZiAodiBpbnN0YW5jZW9mIERhdGUpXG4gICAgcmV0dXJuIG5ldyBEYXRlKHYuZ2V0VGltZSgpKTtcbiAgaWYgKEVKU09OLmlzQmluYXJ5KHYpKSB7XG4gICAgcmV0ID0gRUpTT04ubmV3QmluYXJ5KHYubGVuZ3RoKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHYubGVuZ3RoOyBpKyspIHtcbiAgICAgIHJldFtpXSA9IHZbaV07XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG4gIH1cbiAgaWYgKF8uaXNBcnJheSh2KSB8fCBfLmlzQXJndW1lbnRzKHYpKSB7XG4gICAgLy8gRm9yIHNvbWUgcmVhc29uLCBfLm1hcCBkb2Vzbid0IHdvcmsgaW4gdGhpcyBjb250ZXh0IG9uIE9wZXJhICh3ZWlyZCB0ZXN0XG4gICAgLy8gZmFpbHVyZXMpLlxuICAgIHJldCA9IFtdO1xuICAgIGZvciAoaSA9IDA7IGkgPCB2Lmxlbmd0aDsgaSsrKVxuICAgICAgcmV0W2ldID0gRUpTT04uY2xvbmUodltpXSk7XG4gICAgcmV0dXJuIHJldDtcbiAgfVxuICAvLyBoYW5kbGUgZ2VuZXJhbCB1c2VyLWRlZmluZWQgdHlwZWQgT2JqZWN0cyBpZiB0aGV5IGhhdmUgYSBjbG9uZSBtZXRob2RcbiAgaWYgKHR5cGVvZiB2LmNsb25lID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIHYuY2xvbmUoKTtcbiAgfVxuICAvLyBoYW5kbGUgb3RoZXIgb2JqZWN0c1xuICByZXQgPSB7fTtcbiAgXy5lYWNoKHYsIGZ1bmN0aW9uICh2YWx1ZSwga2V5KSB7XG4gICAgcmV0W2tleV0gPSBFSlNPTi5jbG9uZSh2YWx1ZSk7XG4gIH0pO1xuICByZXR1cm4gcmV0O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBFSlNPTjsiLCJQYWdlID0gcmVxdWlyZSAnLi4vUGFnZSdcbmZvcm1zID0gcmVxdWlyZSAnLi4vZm9ybXMnXG5Tb3VyY2VQYWdlID0gcmVxdWlyZSBcIi4vU291cmNlUGFnZVwiXG5cbiMgQWxsb3dzIGNyZWF0aW5nIG9mIGEgc291cmNlXG4jIFRPRE8gbG9naW4gcmVxdWlyZWRcbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgTmV3U291cmNlUGFnZSBleHRlbmRzIFBhZ2VcbiAgYWN0aXZhdGU6IC0+XG4gICAgQHNldFRpdGxlIFwiTmV3IFNvdXJjZVwiXG5cbiAgICAjIENyZWF0ZSBtb2RlbCBmcm9tIHNvdXJjZVxuICAgIEBtb2RlbCA9IG5ldyBCYWNrYm9uZS5Nb2RlbChzZXRMb2NhdGlvbjogdHJ1ZSlcbiAgXG4gICAgIyBDcmVhdGUgcXVlc3Rpb25zXG4gICAgc291cmNlVHlwZXNRdWVzdGlvbiA9IG5ldyBmb3Jtcy5Ecm9wZG93blF1ZXN0aW9uXG4gICAgICBpZDogJ3R5cGUnXG4gICAgICBtb2RlbDogQG1vZGVsXG4gICAgICBwcm9tcHQ6ICdFbnRlciBTb3VyY2UgVHlwZSdcbiAgICAgIG9wdGlvbnM6IFtdXG4gICAgQGRiLnNvdXJjZV90eXBlcy5maW5kKHt9KS5mZXRjaCAoc291cmNlVHlwZXMpID0+XG4gICAgICAjIEZpbGwgc291cmNlIHR5cGVzXG4gICAgICBzb3VyY2VUeXBlc1F1ZXN0aW9uLnNldE9wdGlvbnMgXy5tYXAoc291cmNlVHlwZXMsIChzdCkgPT4gW3N0LmNvZGUsIHN0Lm5hbWVdKVxuXG4gICAgc2F2ZUNhbmNlbEZvcm0gPSBuZXcgZm9ybXMuU2F2ZUNhbmNlbEZvcm1cbiAgICAgIGNvbnRlbnRzOiBbXG4gICAgICAgIHNvdXJjZVR5cGVzUXVlc3Rpb25cbiAgICAgICAgbmV3IGZvcm1zLlRleHRRdWVzdGlvblxuICAgICAgICAgIGlkOiAnbmFtZSdcbiAgICAgICAgICBtb2RlbDogQG1vZGVsXG4gICAgICAgICAgcHJvbXB0OiAnRW50ZXIgb3B0aW9uYWwgbmFtZSdcbiAgICAgICAgbmV3IGZvcm1zLlRleHRRdWVzdGlvblxuICAgICAgICAgIGlkOiAnZGVzYydcbiAgICAgICAgICBtb2RlbDogQG1vZGVsXG4gICAgICAgICAgcHJvbXB0OiAnRW50ZXIgb3B0aW9uYWwgZGVzY3JpcHRpb24nXG4gICAgICAgIG5ldyBmb3Jtcy5DaGVja1F1ZXN0aW9uXG4gICAgICAgICAgaWQ6ICdwcml2YXRlJ1xuICAgICAgICAgIG1vZGVsOiBAbW9kZWxcbiAgICAgICAgICBwcm9tcHQ6IFwiUHJpdmFjeVwiXG4gICAgICAgICAgdGV4dDogJ1dhdGVyIHNvdXJjZSBpcyBwcml2YXRlJ1xuICAgICAgICAgIGhpbnQ6ICdUaGlzIHNob3VsZCBvbmx5IGJlIHVzZWQgZm9yIHNvdXJjZXMgdGhhdCBhcmUgbm90IHB1YmxpY2FsbHkgYWNjZXNzaWJsZSdcbiAgICAgICAgbmV3IGZvcm1zLlJhZGlvUXVlc3Rpb25cbiAgICAgICAgICBpZDogJ3NldExvY2F0aW9uJ1xuICAgICAgICAgIG1vZGVsOiBAbW9kZWxcbiAgICAgICAgICBwcm9tcHQ6ICdTZXQgdG8gY3VycmVudCBsb2NhdGlvbj8nXG4gICAgICAgICAgb3B0aW9uczogW1t0cnVlLCAnWWVzJ10sIFtmYWxzZSwgJ05vJ11dXG4gICAgICBdXG5cbiAgICBAJGVsLmVtcHR5KCkuYXBwZW5kKHNhdmVDYW5jZWxGb3JtLmVsKVxuXG4gICAgQGxpc3RlblRvIHNhdmVDYW5jZWxGb3JtLCAnc2F2ZScsID0+XG4gICAgICBzb3VyY2UgPSBfLnBpY2soQG1vZGVsLnRvSlNPTigpLCAnbmFtZScsICdkZXNjJywgJ3R5cGUnLCAncHJpdmF0ZScpXG4gICAgICBzb3VyY2UuY29kZSA9IFwiXCIrTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpKjEwMDAwMDApICAjIFRPRE8gcmVhbCBjb2Rlc1xuICAgICAgQGRiLnNvdXJjZXMudXBzZXJ0IHNvdXJjZSwgKHNvdXJjZSkgPT4gXG4gICAgICAgIEBwYWdlci5jbG9zZVBhZ2UoU291cmNlUGFnZSwgeyBfaWQ6IHNvdXJjZS5faWQsIHNldExvY2F0aW9uOiBAbW9kZWwuZ2V0KCdzZXRMb2NhdGlvbicpfSlcblxuICAgIEBsaXN0ZW5UbyBzYXZlQ2FuY2VsRm9ybSwgJ2NhbmNlbCcsID0+XG4gICAgICBAcGFnZXIuY2xvc2VQYWdlKClcbiAiLCJQYWdlID0gcmVxdWlyZShcIi4uL1BhZ2VcIilcbkxvY2F0aW9uVmlldyA9IHJlcXVpcmUgKFwiLi4vTG9jYXRpb25WaWV3XCIpXG5mb3JtcyA9IHJlcXVpcmUgJy4uL2Zvcm1zJ1xuXG5cbiMgRGlzcGxheXMgYSBzb3VyY2VcbiMgT3B0aW9uczogc2V0TG9jYXRpb24gLSB0cnVlIHRvIGF1dG9zZXQgbG9jYXRpb25cbiMgb25TZWxlY3QgLSBjYWxsIHdoZW4gc291cmNlIGlzIHNlbGVjdGVkIHZpYSBidXR0b24gdGhhdCBhcHBlYXJzXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFNvdXJjZVBhZ2UgZXh0ZW5kcyBQYWdlXG4gIGV2ZW50czpcbiAgICAnY2xpY2sgI2VkaXRfc291cmNlX2J1dHRvbicgOiAnZWRpdFNvdXJjZSdcbiAgICAnY2xpY2sgI2FkZF90ZXN0X2J1dHRvbicgOiAnYWRkVGVzdCdcbiAgICAnY2xpY2sgI2FkZF9ub3RlX2J1dHRvbicgOiAnYWRkTm90ZSdcbiAgICAnY2xpY2sgLnRlc3QnIDogJ29wZW5UZXN0J1xuICAgICdjbGljayAubm90ZScgOiAnb3Blbk5vdGUnXG4gICAgJ2NsaWNrICNzZWxlY3Rfc291cmNlJyA6ICdzZWxlY3RTb3VyY2UnXG5cbiAgY3JlYXRlOiAtPlxuICAgIEBzZXRMb2NhdGlvbiA9IEBvcHRpb25zLnNldExvY2F0aW9uXG5cbiAgYWN0aXZhdGU6IC0+XG4gICAgQGRiLnNvdXJjZXMuZmluZE9uZSB7X2lkOiBAb3B0aW9ucy5faWR9LCAoc291cmNlKSA9PlxuICAgICAgQHNvdXJjZSA9IHNvdXJjZVxuICAgICAgQHJlbmRlcigpXG5cbiAgcmVuZGVyOiAtPlxuICAgIEBzZXRUaXRsZSBcIlNvdXJjZSBcIiArIEBzb3VyY2UuY29kZVxuXG4gICAgQHNldHVwQ29udGV4dE1lbnUgW1xuICAgICAgeyBnbHlwaDogJ3JlbW92ZScsIHRleHQ6IFwiRGVsZXRlIFNvdXJjZVwiLCBjbGljazogPT4gQGRlbGV0ZVNvdXJjZSgpIH1cbiAgICBdXG5cbiAgICBAc2V0dXBCdXR0b25CYXIgW1xuICAgICAgeyBpY29uOiBcInBsdXMucG5nXCIsIG1lbnU6IFtcbiAgICAgICAgeyB0ZXh0OiBcIlN0YXJ0IFdhdGVyIFRlc3RcIiwgY2xpY2s6ID0+IEBhZGRUZXN0KCkgfVxuICAgICAgICB7IHRleHQ6IFwiQWRkIE5vdGVcIiwgY2xpY2s6ID0+IEBhZGROb3RlKCkgfVxuICAgICAgXX1cbiAgICBdXG5cbiAgICAjIFJlLXJlbmRlciB0ZW1wbGF0ZVxuICAgIEByZW1vdmVTdWJ2aWV3cygpXG4gICAgQCRlbC5odG1sIHRlbXBsYXRlc1sncGFnZXMvU291cmNlUGFnZSddKHNvdXJjZTogQHNvdXJjZSwgc2VsZWN0OiBAb3B0aW9ucy5vblNlbGVjdD8pXG5cbiAgICAjIFNldCBzb3VyY2UgdHlwZVxuICAgIGlmIEBzb3VyY2UudHlwZT9cbiAgICAgIEBkYi5zb3VyY2VfdHlwZXMuZmluZE9uZSB7Y29kZTogQHNvdXJjZS50eXBlfSwgKHNvdXJjZVR5cGUpID0+XG4gICAgICAgIGlmIHNvdXJjZVR5cGU/IHRoZW4gQCQoXCIjc291cmNlX3R5cGVcIikudGV4dChzb3VyY2VUeXBlLm5hbWUpXG5cbiAgICAjIEFkZCBsb2NhdGlvbiB2aWV3XG4gICAgbG9jYXRpb25WaWV3ID0gbmV3IExvY2F0aW9uVmlldyhsb2M6IEBzb3VyY2UuZ2VvKVxuICAgIGlmIEBzZXRMb2NhdGlvblxuICAgICAgbG9jYXRpb25WaWV3LnNldExvY2F0aW9uKClcbiAgICAgIEBzZXRMb2NhdGlvbiA9IGZhbHNlXG5cbiAgICBAbGlzdGVuVG8gbG9jYXRpb25WaWV3LCAnbG9jYXRpb25zZXQnLCAobG9jKSAtPlxuICAgICAgQHNvdXJjZS5nZW8gPSBsb2NcbiAgICAgIEBkYi5zb3VyY2VzLnVwc2VydCBAc291cmNlLCA9PiBAcmVuZGVyKClcblxuICAgIEBsaXN0ZW5UbyBsb2NhdGlvblZpZXcsICdtYXAnLCAobG9jKSAtPlxuICAgICAgQHBhZ2VyLm9wZW5QYWdlKHJlcXVpcmUoXCIuL1NvdXJjZU1hcFBhZ2VcIiksIHtpbml0aWFsR2VvOiBsb2N9KVxuICAgICAgXG4gICAgQGFkZFN1YnZpZXcobG9jYXRpb25WaWV3KVxuICAgIEAkKFwiI2xvY2F0aW9uXCIpLmFwcGVuZChsb2NhdGlvblZpZXcuZWwpXG5cbiAgICAjIEFkZCB0ZXN0c1xuICAgIEBkYi50ZXN0cy5maW5kKHtzb3VyY2U6IEBzb3VyY2UuY29kZX0pLmZldGNoICh0ZXN0cykgLT4gIyBUT0RPIHNvdXJjZS5jb2RlPyBcbiAgICAgIEAkKFwiI3Rlc3RzXCIpLmh0bWwgdGVtcGxhdGVzWydwYWdlcy9Tb3VyY2VQYWdlX3Rlc3RzJ10odGVzdHM6dGVzdHMpXG5cbiAgICAjIEFkZCBub3Rlc1xuICAgIEBkYi5zb3VyY2Vfbm90ZXMuZmluZCh7c291cmNlOiBAc291cmNlLmNvZGV9KS5mZXRjaCAobm90ZXMpIC0+ICAjIFRPRE8gc291cmNlLmNvZGU/XG4gICAgICBAJChcIiNub3Rlc1wiKS5odG1sIHRlbXBsYXRlc1sncGFnZXMvU291cmNlUGFnZV9ub3RlcyddKG5vdGVzOm5vdGVzKVxuXG4gICAgIyBBZGQgcGhvdG9zICMgVE9ETyB3aXJlIG1vZGVsIHRvIGFjdHVhbCBkYlxuICAgIHBob3Rvc1ZpZXcgPSBuZXcgZm9ybXMuSW1hZ2VzUXVlc3Rpb25cbiAgICAgIGlkOiAncGhvdG9zJ1xuICAgICAgbW9kZWw6IG5ldyBCYWNrYm9uZS5Nb2RlbChAc291cmNlKVxuICAgICAgY3R4OiBAY3R4XG4gICAgICBcbiAgICBwaG90b3NWaWV3Lm1vZGVsLm9uICdjaGFuZ2UnLCA9PlxuICAgICAgQGRiLnNvdXJjZXMudXBzZXJ0IEBzb3VyY2UudG9KU09OKCksID0+IEByZW5kZXIoKVxuICAgIEAkKCcjcGhvdG9zJykuYXBwZW5kKHBob3Rvc1ZpZXcuZWwpXG5cbiAgZWRpdFNvdXJjZTogLT5cbiAgICBAcGFnZXIub3BlblBhZ2UocmVxdWlyZShcIi4vU291cmNlRWRpdFBhZ2VcIiksIHsgX2lkOiBAc291cmNlLl9pZH0pXG5cbiAgZGVsZXRlU291cmNlOiAtPlxuICAgIGlmIGNvbmZpcm0oXCJQZXJtYW5lbnRseSBkZWxldGUgc291cmNlP1wiKVxuICAgICAgQGRiLnNvdXJjZXMucmVtb3ZlIEBzb3VyY2UuX2lkLCA9PlxuICAgICAgICBAcGFnZXIuY2xvc2VQYWdlKClcbiAgICAgICAgQHBhZ2VyLmZsYXNoIFwiU291cmNlIGRlbGV0ZWRcIiwgXCJzdWNjZXNzXCJcblxuICBhZGRUZXN0OiAtPlxuICAgIEBwYWdlci5vcGVuUGFnZShyZXF1aXJlKFwiLi9OZXdUZXN0UGFnZVwiKSwgeyBzb3VyY2U6IEBzb3VyY2UuY29kZX0pXG5cbiAgb3BlblRlc3Q6IChldikgLT5cbiAgICBAcGFnZXIub3BlblBhZ2UocmVxdWlyZShcIi4vVGVzdFBhZ2VcIiksIHsgX2lkOiBldi5jdXJyZW50VGFyZ2V0LmlkfSlcblxuICBhZGROb3RlOiAtPlxuICAgIEBwYWdlci5vcGVuUGFnZShyZXF1aXJlKFwiLi9Tb3VyY2VOb3RlUGFnZVwiKSwgeyBzb3VyY2U6IEBzb3VyY2UuY29kZX0pICAgIyBUT0RPIGlkIG9yIGNvZGU/XG5cbiAgb3Blbk5vdGU6IChldikgLT5cbiAgICBAcGFnZXIub3BlblBhZ2UocmVxdWlyZShcIi4vU291cmNlTm90ZVBhZ2VcIiksIHsgc291cmNlOiBAc291cmNlLmNvZGUsIF9pZDogZXYuY3VycmVudFRhcmdldC5pZH0pXG5cbiAgc2VsZWN0U291cmNlOiAtPlxuICAgIGlmIEBvcHRpb25zLm9uU2VsZWN0P1xuICAgICAgQHBhZ2VyLmNsb3NlUGFnZSgpXG4gICAgICBAb3B0aW9ucy5vblNlbGVjdChAc291cmNlKSIsIlBhZ2UgPSByZXF1aXJlIFwiLi4vUGFnZVwiXG5UZXN0UGFnZSA9IHJlcXVpcmUgXCIuL1Rlc3RQYWdlXCJcblxuIyBQYXJhbWV0ZXIgaXMgb3B0aW9uYWwgc291cmNlIGNvZGVcbmNsYXNzIE5ld1Rlc3RQYWdlIGV4dGVuZHMgUGFnZVxuICBldmVudHM6IFxuICAgIFwiY2xpY2sgLnRlc3RcIiA6IFwic3RhcnRUZXN0XCJcblxuICBhY3RpdmF0ZTogLT5cbiAgICBAc2V0VGl0bGUgXCJTZWxlY3QgVGVzdFwiXG5cbiAgICBAZGIuZm9ybXMuZmluZCh7dHlwZTpcIldhdGVyVGVzdFwifSkuZmV0Y2ggKGZvcm1zKSA9PlxuICAgICAgQGZvcm1zID0gZm9ybXNcbiAgICAgIEAkZWwuaHRtbCB0ZW1wbGF0ZXNbJ3BhZ2VzL05ld1Rlc3RQYWdlJ10oZm9ybXM6Zm9ybXMpXG5cbiAgc3RhcnRUZXN0OiAoZXYpIC0+XG4gICAgdGVzdENvZGUgPSBldi5jdXJyZW50VGFyZ2V0LmlkXG5cbiAgICAjIFRPRE8gYWRkIHVzZXIvb3JnXG5cbiAgICAjIENyZWF0ZSB0ZXN0XG4gICAgdGVzdCA9IHtcbiAgICAgIHNvdXJjZTogQG9wdGlvbnMuc291cmNlXG4gICAgICB0eXBlOiB0ZXN0Q29kZVxuICAgICAgY29tcGxldGVkOiBudWxsXG4gICAgICBzdGFydGVkOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKClcbiAgICB9XG4gICAgQGRiLnRlc3RzLnVwc2VydCB0ZXN0LCAodGVzdCkgPT5cbiAgICAgIEBwYWdlci5jbG9zZVBhZ2UoVGVzdFBhZ2UsIHsgX2lkOiB0ZXN0Ll9pZCB9KVxuXG5tb2R1bGUuZXhwb3J0cyA9IE5ld1Rlc3RQYWdlIiwiUGFnZSA9IHJlcXVpcmUgXCIuLi9QYWdlXCJcblNvdXJjZVBhZ2UgPSByZXF1aXJlIFwiLi9Tb3VyY2VQYWdlXCJcbkl0ZW1UcmFja2VyID0gcmVxdWlyZSBcIi4uL0l0ZW1UcmFja2VyXCJcbkxvY2F0aW9uRmluZGVyID0gcmVxdWlyZSAnLi4vTG9jYXRpb25GaW5kZXInXG5HZW9KU09OID0gcmVxdWlyZSAnLi4vR2VvSlNPTidcblxuIyBNYXAgb2Ygd2F0ZXIgc291cmNlcy4gT3B0aW9ucyBpbmNsdWRlOlxuIyBpbml0aWFsR2VvOiBHZW9tZXRyeSB0byB6b29tIHRvLiBQb2ludCBvbmx5IHN1cHBvcnRlZC5cbmNsYXNzIFNvdXJjZU1hcFBhZ2UgZXh0ZW5kcyBQYWdlXG4gIGNyZWF0ZTogLT5cbiAgICBAc2V0VGl0bGUgXCJTb3VyY2UgTWFwXCJcblxuICAgICMgQ2FsY3VsYXRlIGhlaWdodFxuICAgIEAkZWwuaHRtbCB0ZW1wbGF0ZXNbJ3BhZ2VzL1NvdXJjZU1hcFBhZ2UnXSgpXG5cbiAgICBMLkljb24uRGVmYXVsdC5pbWFnZVBhdGggPSBcImltZy9sZWFmbGV0XCJcbiAgICBAbWFwID0gTC5tYXAodGhpcy4kKFwiI21hcFwiKVswXSlcbiAgICBMLmNvbnRyb2wuc2NhbGUoaW1wZXJpYWw6ZmFsc2UpLmFkZFRvKEBtYXApXG4gICAgQHJlc2l6ZU1hcCgpXG5cbiAgICAjIFJlY2FsY3VsYXRlIG9uIHJlc2l6ZVxuICAgICQod2luZG93KS5vbigncmVzaXplJywgQHJlc2l6ZU1hcClcblxuICAgICMgU2V0dXAgbWFwIHRpbGVzXG4gICAgc2V0dXBNYXBUaWxlcygpLmFkZFRvKEBtYXApXG5cbiAgICAjIFNldHVwIG1hcmtlciBkaXNwbGF5XG4gICAgQHNvdXJjZURpc3BsYXkgPSBuZXcgU291cmNlRGlzcGxheShAbWFwLCBAZGIsIEBwYWdlcilcblxuICAgICMgVE9ETyB6b29tIHRvIGxhc3Qga25vd24gYm91bmRzXG4gICAgXG4gICAgIyBTZXR1cCBpbml0aWFsIHpvb21cbiAgICBpZiBAb3B0aW9ucy5pbml0aWFsR2VvIGFuZCBAb3B0aW9ucy5pbml0aWFsR2VvLnR5cGU9PVwiUG9pbnRcIlxuICAgICAgQG1hcC5zZXRWaWV3KEwuR2VvSlNPTi5jb29yZHNUb0xhdExuZyhAb3B0aW9ucy5pbml0aWFsR2VvLmNvb3JkaW5hdGVzKSwgMTUpXG5cbiAgICAjIFNldHVwIGxvY2FsdGlvbiBkaXNwbGF5XG4gICAgQGxvY2F0aW9uRGlzcGxheSA9IG5ldyBMb2NhdGlvbkRpc3BsYXkoQG1hcCwgbm90IEBvcHRpb25zLmluaXRpYWxHZW8/KVxuXG4gIGRlc3Ryb3k6IC0+XG4gICAgJCh3aW5kb3cpLm9mZigncmVzaXplJywgQHJlc2l6ZU1hcClcbiAgICBAbG9jYXRpb25EaXNwbGF5LnN0b3AoKVxuXG4gIHJlc2l6ZU1hcDogPT5cbiAgICAjIENhbGN1bGF0ZSBtYXAgaGVpZ2h0XG4gICAgbWFwSGVpZ2h0ID0gJChcImh0bWxcIikuaGVpZ2h0KCkgLSA0MFxuICAgICQoXCIjbWFwXCIpLmNzcyhcImhlaWdodFwiLCBtYXBIZWlnaHQgKyBcInB4XCIpXG4gICAgQG1hcC5pbnZhbGlkYXRlU2l6ZSgpXG5cblxuc2V0dXBNYXBUaWxlcyA9IC0+XG4gIG1hcHF1ZXN0VXJsID0gJ2h0dHA6Ly97c30ubXFjZG4uY29tL3RpbGVzLzEuMC4wL29zbS97en0ve3h9L3t5fS5wbmcnXG4gIHN1YkRvbWFpbnMgPSBbJ290aWxlMScsJ290aWxlMicsJ290aWxlMycsJ290aWxlNCddXG4gIG1hcHF1ZXN0QXR0cmliID0gJ0RhdGEsIGltYWdlcnkgYW5kIG1hcCBpbmZvcm1hdGlvbiBwcm92aWRlZCBieSA8YSBocmVmPVwiaHR0cDovL29wZW4ubWFwcXVlc3QuY28udWtcIiB0YXJnZXQ9XCJfYmxhbmtcIj5NYXBRdWVzdDwvYT4sIDxhIGhyZWY9XCJodHRwOi8vd3d3Lm9wZW5zdHJlZXRtYXAub3JnL1wiIHRhcmdldD1cIl9ibGFua1wiPk9wZW5TdHJlZXRNYXA8L2E+IGFuZCBjb250cmlidXRvcnMuJ1xuICByZXR1cm4gbmV3IEwuVGlsZUxheWVyKG1hcHF1ZXN0VXJsLCB7bWF4Wm9vbTogMTgsIGF0dHJpYnV0aW9uOiBtYXBxdWVzdEF0dHJpYiwgc3ViZG9tYWluczogc3ViRG9tYWluc30pXG5cbmNsYXNzIFNvdXJjZURpc3BsYXlcbiAgY29uc3RydWN0b3I6IChtYXAsIGRiLCBwYWdlcikgLT5cbiAgICBAbWFwID0gbWFwXG4gICAgQGRiID0gZGJcbiAgICBAcGFnZXIgPSBwYWdlclxuICAgIEBpdGVtVHJhY2tlciA9IG5ldyBJdGVtVHJhY2tlcigpXG5cbiAgICBAc291cmNlTWFya2VycyA9IHt9XG4gICAgQG1hcC5vbignbW92ZWVuZCcsIEB1cGRhdGVNYXJrZXJzKVxuXG4gICAgQGljb24gPSBuZXcgTC5pY29uXG4gICAgICBpY29uVXJsOiAnaW1nL0Ryb3BNYXJrZXIucG5nJ1xuICAgICAgaWNvblJldGluYVVybDogJ2ltZy9Ecm9wTWFya2VyQDJ4LnBuZydcbiAgICAgIGljb25TaXplOiBbMjcsIDQxXSxcbiAgICAgIGljb25BbmNob3I6IFsxMywgNDFdXG4gICAgICBwb3B1cEFuY2hvcjogWy0zLCAtNDFdXG4gIFxuICB1cGRhdGVNYXJrZXJzOiA9PlxuICAgICMgR2V0IGJvdW5kcyBwYWRkZWRcbiAgICBib3VuZHMgPSBAbWFwLmdldEJvdW5kcygpLnBhZCgwLjMzKVxuXG4gICAgYm91bmRzR2VvSlNPTiA9IEdlb0pTT04ubGF0TG5nQm91bmRzVG9HZW9KU09OKGJvdW5kcylcbiAgICBzZWxlY3RvciA9IHsgZ2VvOiB7ICRnZW9JbnRlcnNlY3RzOiB7ICRnZW9tZXRyeTogYm91bmRzR2VvSlNPTiB9IH0gfVxuXG4gICAgIyBRdWVyeSBzb3VyY2VzIHdpdGggcHJvamVjdGlvbiBUT0RPXG4gICAgQGRiLnNvdXJjZXMuZmluZChzZWxlY3RvciwgeyBzb3J0OiBbXCJfaWRcIl0sIGxpbWl0OiAxMDAgfSkuZmV0Y2ggKHNvdXJjZXMpID0+XG4gICAgICAjIEZpbmQgb3V0IHdoaWNoIHRvIGFkZC9yZW1vdmVcbiAgICAgIFthZGRzLCByZW1vdmVzXSA9IEBpdGVtVHJhY2tlci51cGRhdGUoc291cmNlcylcblxuICAgICAgIyBSZW1vdmUgb2xkIG1hcmtlcnNcbiAgICAgIGZvciByZW1vdmUgaW4gcmVtb3Zlc1xuICAgICAgICBAcmVtb3ZlU291cmNlTWFya2VyKHJlbW92ZSlcbiAgICAgIGZvciBhZGQgaW4gYWRkc1xuICAgICAgICBAYWRkU291cmNlTWFya2VyKGFkZClcblxuICBhZGRTb3VyY2VNYXJrZXI6IChzb3VyY2UpIC0+XG4gICAgaWYgc291cmNlLmdlbz9cbiAgICAgIGxhdGxuZyA9IG5ldyBMLkxhdExuZyhzb3VyY2UuZ2VvLmNvb3JkaW5hdGVzWzFdLCBzb3VyY2UuZ2VvLmNvb3JkaW5hdGVzWzBdKVxuICAgICAgbWFya2VyID0gbmV3IEwuTWFya2VyKGxhdGxuZywge2ljb246QGljb259KVxuICAgICAgXG4gICAgICBtYXJrZXIub24gJ2NsaWNrJywgPT5cbiAgICAgICAgQHBhZ2VyLm9wZW5QYWdlKFNvdXJjZVBhZ2UsIHtfaWQ6IHNvdXJjZS5faWR9KVxuICAgICAgXG4gICAgICBAc291cmNlTWFya2Vyc1tzb3VyY2UuX2lkXSA9IG1hcmtlclxuICAgICAgbWFya2VyLmFkZFRvKEBtYXApXG5cbiAgcmVtb3ZlU291cmNlTWFya2VyOiAoc291cmNlKSAtPlxuICAgIGlmIF8uaGFzKEBzb3VyY2VNYXJrZXJzLCBzb3VyY2UuX2lkKVxuICAgICAgQG1hcC5yZW1vdmVMYXllcihAc291cmNlTWFya2Vyc1tzb3VyY2UuX2lkXSlcblxuXG5jbGFzcyBMb2NhdGlvbkRpc3BsYXlcbiAgIyBTZXR1cCBkaXNwbGF5LCBvcHRpb25hbGx5IHpvb21pbmcgdG8gY3VycmVudCBsb2NhdGlvblxuICBjb25zdHJ1Y3RvcjogKG1hcCwgem9vbVRvKSAtPlxuICAgIEBtYXAgPSBtYXBcbiAgICBAem9vbVRvID0gem9vbVRvXG5cbiAgICBAbG9jYXRpb25GaW5kZXIgPSBuZXcgTG9jYXRpb25GaW5kZXIoKVxuICAgIEBsb2NhdGlvbkZpbmRlci5vbignZm91bmQnLCBAbG9jYXRpb25Gb3VuZCkub24oJ2Vycm9yJywgQGxvY2F0aW9uRXJyb3IpXG4gICAgQGxvY2F0aW9uRmluZGVyLnN0YXJ0V2F0Y2goKVxuXG4gIHN0b3A6IC0+XG4gICAgQGxvY2F0aW9uRmluZGVyLnN0b3BXYXRjaCgpXG5cbiAgbG9jYXRpb25FcnJvcjogKGUpID0+XG4gICAgaWYgQHpvb21Ub1xuICAgICAgQG1hcC5maXRXb3JsZCgpXG4gICAgICBAem9vbVRvID0gZmFsc2VcbiAgICAgIGFsZXJ0KFwiVW5hYmxlIHRvIGRldGVybWluZSBsb2NhdGlvblwiKVxuXG4gIGxvY2F0aW9uRm91bmQ6IChlKSA9PlxuICAgIHJhZGl1cyA9IGUuY29vcmRzLmFjY3VyYWN5XG4gICAgbGF0bG5nID0gbmV3IEwuTGF0TG5nKGUuY29vcmRzLmxhdGl0dWRlLCBlLmNvb3Jkcy5sb25naXR1ZGUpXG5cbiAgICAjIFNldCBwb3NpdGlvbiBvbmNlXG4gICAgaWYgQHpvb21Ub1xuICAgICAgem9vbSA9IDE1XG4gICAgICBAbWFwLnNldFZpZXcobGF0bG5nLCB6b29tKVxuICAgICAgQHpvb21UbyA9IGZhbHNlXG5cbiAgICAjIFNldHVwIG1hcmtlciBhbmQgY2lyY2xlXG4gICAgaWYgbm90IEBtZU1hcmtlclxuICAgICAgaWNvbiA9ICBMLmljb24oaWNvblVybDogXCJpbWcvbXlfbG9jYXRpb24ucG5nXCIsIGljb25TaXplOiBbMjIsIDIyXSlcbiAgICAgIEBtZU1hcmtlciA9IEwubWFya2VyKGxhdGxuZywgaWNvbjppY29uKS5hZGRUbyhAbWFwKVxuICAgICAgQG1lQ2lyY2xlID0gTC5jaXJjbGUobGF0bG5nLCByYWRpdXMpXG4gICAgICBAbWVDaXJjbGUuYWRkVG8oQG1hcClcbiAgICBlbHNlXG4gICAgICBAbWVNYXJrZXIuc2V0TGF0TG5nKGxhdGxuZylcbiAgICAgIEBtZUNpcmNsZS5zZXRMYXRMbmcobGF0bG5nKS5zZXRSYWRpdXMocmFkaXVzKVxuXG5tb2R1bGUuZXhwb3J0cyA9IFNvdXJjZU1hcFBhZ2UiLCJQYWdlID0gcmVxdWlyZSAnLi4vUGFnZSdcbmZvcm1zID0gcmVxdWlyZSAnLi4vZm9ybXMnXG5cbiMgQWxsb3dzIGVkaXRpbmcgb2Ygc291cmNlIGRldGFpbHNcbiMgVE9ETyBsb2dpbiByZXF1aXJlZFxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBTb3VyY2VFZGl0UGFnZSBleHRlbmRzIFBhZ2VcbiAgYWN0aXZhdGU6IC0+XG4gICAgQGRiLnNvdXJjZXMuZmluZE9uZSB7X2lkOiBAb3B0aW9ucy5faWR9LCAoc291cmNlKSA9PlxuICAgICAgQHNldFRpdGxlIFwiRWRpdCBTb3VyY2UgI3tzb3VyY2UuY29kZX1cIlxuXG4gICAgICAjIENyZWF0ZSBtb2RlbCBmcm9tIHNvdXJjZVxuICAgICAgQG1vZGVsID0gbmV3IEJhY2tib25lLk1vZGVsKHNvdXJjZSlcbiAgXG4gICAgICAjIENyZWF0ZSBxdWVzdGlvbnNcbiAgICAgIHNvdXJjZVR5cGVzUXVlc3Rpb24gPSBuZXcgZm9ybXMuRHJvcGRvd25RdWVzdGlvblxuICAgICAgICBpZDogJ3R5cGUnXG4gICAgICAgIG1vZGVsOiBAbW9kZWxcbiAgICAgICAgcHJvbXB0OiAnRW50ZXIgU291cmNlIFR5cGUnXG4gICAgICAgIG9wdGlvbnM6IFtdXG4gICAgICBAZGIuc291cmNlX3R5cGVzLmZpbmQoe30pLmZldGNoIChzb3VyY2VUeXBlcykgPT5cbiAgICAgICAgIyBGaWxsIHNvdXJjZSB0eXBlc1xuICAgICAgICBzb3VyY2VUeXBlc1F1ZXN0aW9uLnNldE9wdGlvbnMgXy5tYXAoc291cmNlVHlwZXMsIChzdCkgPT4gW3N0LmNvZGUsIHN0Lm5hbWVdKVxuXG4gICAgICBzYXZlQ2FuY2VsRm9ybSA9IG5ldyBmb3Jtcy5TYXZlQ2FuY2VsRm9ybVxuICAgICAgICBjb250ZW50czogW1xuICAgICAgICAgIHNvdXJjZVR5cGVzUXVlc3Rpb25cbiAgICAgICAgICBuZXcgZm9ybXMuVGV4dFF1ZXN0aW9uXG4gICAgICAgICAgICBpZDogJ25hbWUnXG4gICAgICAgICAgICBtb2RlbDogQG1vZGVsXG4gICAgICAgICAgICBwcm9tcHQ6ICdFbnRlciBvcHRpb25hbCBuYW1lJ1xuICAgICAgICAgIG5ldyBmb3Jtcy5UZXh0UXVlc3Rpb25cbiAgICAgICAgICAgIGlkOiAnZGVzYydcbiAgICAgICAgICAgIG1vZGVsOiBAbW9kZWxcbiAgICAgICAgICAgIHByb21wdDogJ0VudGVyIG9wdGlvbmFsIGRlc2NyaXB0aW9uJ1xuICAgICAgICAgIG5ldyBmb3Jtcy5DaGVja1F1ZXN0aW9uXG4gICAgICAgICAgICBpZDogJ3ByaXZhdGUnXG4gICAgICAgICAgICBtb2RlbDogQG1vZGVsXG4gICAgICAgICAgICBwcm9tcHQ6IFwiUHJpdmFjeVwiXG4gICAgICAgICAgICB0ZXh0OiAnV2F0ZXIgc291cmNlIGlzIHByaXZhdGUnXG4gICAgICAgICAgICBoaW50OiAnVGhpcyBzaG91bGQgb25seSBiZSB1c2VkIGZvciBzb3VyY2VzIHRoYXQgYXJlIG5vdCBwdWJsaWNhbGx5IGFjY2Vzc2libGUnXG4gICAgICAgIF1cblxuICAgICAgQCRlbC5lbXB0eSgpLmFwcGVuZChzYXZlQ2FuY2VsRm9ybS5lbClcblxuICAgICAgQGxpc3RlblRvIHNhdmVDYW5jZWxGb3JtLCAnc2F2ZScsID0+XG4gICAgICAgIEBkYi5zb3VyY2VzLnVwc2VydCBAbW9kZWwudG9KU09OKCksID0+IEBwYWdlci5jbG9zZVBhZ2UoKVxuXG4gICAgICBAbGlzdGVuVG8gc2F2ZUNhbmNlbEZvcm0sICdjYW5jZWwnLCA9PlxuICAgICAgICBAcGFnZXIuY2xvc2VQYWdlKClcbiAiLCJQYWdlID0gcmVxdWlyZSBcIi4uL1BhZ2VcIlxuZm9ybXMgPSByZXF1aXJlICcuLi9mb3JtcydcblxuY2xhc3MgVGVzdFBhZ2UgZXh0ZW5kcyBQYWdlXG4gIGNyZWF0ZTogLT4gQHJlbmRlcigpXG5cbiAgYWN0aXZhdGU6IC0+XG4gICAgQHNldHVwQ29udGV4dE1lbnUgW1xuICAgICAgeyBnbHlwaDogJ3JlbW92ZScsIHRleHQ6IFwiRGVsZXRlIFRlc3RcIiwgY2xpY2s6ID0+IEBkZWxldGVUZXN0KCkgfVxuICAgIF1cblxuICByZW5kZXI6IC0+XG4gICAgQHNldFRpdGxlIFwiVGVzdFwiICMgVE9ETyBuaWNlciB0aXRsZVxuXG4gICAgIyBHZXQgdGVzdFxuICAgIEBkYi50ZXN0cy5maW5kT25lIHtfaWQ6IEBvcHRpb25zLl9pZH0sICh0ZXN0KSA9PlxuICAgICAgQHRlc3QgPSB0ZXN0XG5cbiAgICAgICMgR2V0IGZvcm1cbiAgICAgIEBkYi5mb3Jtcy5maW5kT25lIHsgdHlwZTogXCJXYXRlclRlc3RcIiwgY29kZTogdGVzdC50eXBlIH0sIChmb3JtKSA9PlxuICAgICAgICAjIENoZWNrIGlmIGNvbXBsZXRlZFxuICAgICAgICBpZiBub3QgdGVzdC5jb21wbGV0ZWRcbiAgICAgICAgICBAZm9ybVZpZXcgPSBmb3Jtcy5pbnN0YW50aWF0ZVZpZXcoZm9ybS52aWV3cy5lZGl0LCB7IGN0eDogQGN0eCB9KVxuXG4gICAgICAgICAgIyBMaXN0ZW4gdG8gZXZlbnRzXG4gICAgICAgICAgQGxpc3RlblRvIEBmb3JtVmlldywgJ2NoYW5nZScsIEBzYXZlXG4gICAgICAgICAgQGxpc3RlblRvIEBmb3JtVmlldywgJ2NvbXBsZXRlJywgQGNvbXBsZXRlZFxuICAgICAgICAgIEBsaXN0ZW5UbyBAZm9ybVZpZXcsICdjbG9zZScsIEBjbG9zZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgQGZvcm1WaWV3ID0gZm9ybXMuaW5zdGFudGlhdGVWaWV3KGZvcm0udmlld3MuZGV0YWlsLCB7IGN0eDogQGN0eCB9KVxuICBcbiAgICAgICAgIyBUT0RPIGRpc2FibGUgaWYgbm9uLWVkaXRhYmxlXG4gICAgICAgIEAkZWwuaHRtbCB0ZW1wbGF0ZXNbJ3BhZ2VzL1Rlc3RQYWdlJ10oY29tcGxldGVkOiB0ZXN0LmNvbXBsZXRlZCwgdGl0bGU6IGZvcm0ubmFtZSlcbiAgICAgICAgQCQoJyNjb250ZW50cycpLmFwcGVuZChAZm9ybVZpZXcuZWwpXG5cbiAgICAgICAgQGZvcm1WaWV3LmxvYWQgQHRlc3RcblxuICBldmVudHM6XG4gICAgXCJjbGljayAjZWRpdF9idXR0b25cIiA6IFwiZWRpdFwiXG5cbiAgZGVzdHJveTogLT5cbiAgICAjIExldCBrbm93IHRoYXQgc2F2ZWQgaWYgY2xvc2VkIGluY29tcGxldGVkXG4gICAgaWYgQHRlc3QgYW5kIG5vdCBAdGVzdC5jb21wbGV0ZWRcbiAgICAgIEBwYWdlci5mbGFzaCBcIlRlc3Qgc2F2ZWQgYXMgZHJhZnQuXCJcblxuICBlZGl0OiAtPlxuICAgICMgTWFyayBhcyBpbmNvbXBsZXRlXG4gICAgQHRlc3QuY29tcGxldGVkID0gbnVsbFxuICAgIEBkYi50ZXN0cy51cHNlcnQgQHRlc3QsID0+IEByZW5kZXIoKVxuXG4gIHNhdmU6ID0+XG4gICAgIyBTYXZlIHRvIGRiXG4gICAgQHRlc3QgPSBAZm9ybVZpZXcuc2F2ZSgpXG4gICAgQGRiLnRlc3RzLnVwc2VydChAdGVzdClcblxuICBjbG9zZTogPT5cbiAgICBAc2F2ZSgpXG4gICAgQHBhZ2VyLmNsb3NlUGFnZSgpXG5cbiAgY29tcGxldGVkOiA9PlxuICAgICMgTWFyayBhcyBjb21wbGV0ZWRcbiAgICBAdGVzdC5jb21wbGV0ZWQgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKClcbiAgICBAZGIudGVzdHMudXBzZXJ0IEB0ZXN0LCA9PiBAcmVuZGVyKClcblxuICBkZWxldGVUZXN0OiAtPlxuICAgIGlmIGNvbmZpcm0oXCJQZXJtYW5lbnRseSBkZWxldGUgdGVzdD9cIilcbiAgICAgIEBkYi50ZXN0cy5yZW1vdmUgQHRlc3QuX2lkLCA9PlxuICAgICAgICBAdGVzdCA9IG51bGxcbiAgICAgICAgQHBhZ2VyLmNsb3NlUGFnZSgpXG4gICAgICAgIEBwYWdlci5mbGFzaCBcIlRlc3QgZGVsZXRlZFwiLCBcInN1Y2Nlc3NcIlxuXG5tb2R1bGUuZXhwb3J0cyA9IFRlc3RQYWdlIiwiUGFnZSA9IHJlcXVpcmUgJy4uL1BhZ2UnXG5mb3JtcyA9IHJlcXVpcmUgJy4uL2Zvcm1zJ1xuXG4jIEFsbG93cyBjcmVhdGluZy9lZGl0aW5nIG9mIHNvdXJjZSBub3Rlc1xuIyBPcHRpb25zIGFyZSBcbiMgX2lkOiBpZCBvZiBzb3VyY2Ugbm90ZVxuIyBzb3VyY2U6IGNvZGUgb2Ygc291cmNlXG5cbiMgVE9ETyBsb2dpbiByZXF1aXJlZFxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBTb3VyY2VOb3RlUGFnZSBleHRlbmRzIFBhZ2VcbiAgYWN0aXZhdGU6IC0+XG4gICAgIyBGaW5kIHdhdGVyIHNvdXJjZVxuICAgIEBkYi5zb3VyY2VzLmZpbmRPbmUge2NvZGU6IEBvcHRpb25zLnNvdXJjZX0sIChzb3VyY2UpID0+XG4gICAgICBAc2V0VGl0bGUgXCJOb3RlIGZvciBTb3VyY2UgI3tzb3VyY2UuY29kZX1cIlxuXG4gICAgICAjIENyZWF0ZSBtb2RlbCBcbiAgICAgIEBtb2RlbCA9IG5ldyBCYWNrYm9uZS5Nb2RlbCgpXG4gIFxuICAgICAgIyBDcmVhdGUgcXVlc3Rpb25zXG4gICAgICBzYXZlQ2FuY2VsRm9ybSA9IG5ldyBmb3Jtcy5TYXZlQ2FuY2VsRm9ybVxuICAgICAgICBjb250ZW50czogW1xuICAgICAgICAgIG5ldyBmb3Jtcy5EYXRlUXVlc3Rpb25cbiAgICAgICAgICAgIGlkOiAnZGF0ZSdcbiAgICAgICAgICAgIG1vZGVsOiBAbW9kZWxcbiAgICAgICAgICAgIHByb21wdDogJ0RhdGUgb2YgVmlzaXQnXG4gICAgICAgICAgICByZXF1aXJlZDogdHJ1ZVxuICAgICAgICAgIG5ldyBmb3Jtcy5SYWRpb1F1ZXN0aW9uXG4gICAgICAgICAgICBpZDogJ3N0YXR1cydcbiAgICAgICAgICAgIG1vZGVsOiBAbW9kZWxcbiAgICAgICAgICAgIHByb21wdDogJ1N0YXR1cyBvZiBXYXRlciBTb3VyY2UnXG4gICAgICAgICAgICBvcHRpb25zOiBbWydvaycsICdGdW5jdGlvbmFsJ10sIFsnbWFpbnQnLCAnTmVlZHMgbWFpbnRlbmFuY2UnXSwgWydicm9rZW4nLCAnTm9uLWZ1bmN0aW9uYWwnXSwgWydtaXNzaW5nJywgJ05vIGxvbmdlciBleGlzdHMnXV1cbiAgICAgICAgICAgIHJlcXVpcmVkOiB0cnVlXG4gICAgICAgICAgbmV3IGZvcm1zLlRleHRRdWVzdGlvblxuICAgICAgICAgICAgaWQ6ICdub3RlcydcbiAgICAgICAgICAgIG1vZGVsOiBAbW9kZWxcbiAgICAgICAgICAgIHByb21wdDogJ05vdGVzJ1xuICAgICAgICAgICAgbXVsdGlsaW5lOiB0cnVlXG4gICAgICAgIF1cblxuICAgICAgIyBMb2FkIGZvcm0gZnJvbSBzb3VyY2Ugbm90ZSBpZiBleGlzdHNcbiAgICAgIGlmIEBvcHRpb25zLl9pZFxuICAgICAgICBAZGIuc291cmNlX25vdGVzLmZpbmRPbmUge19pZDogQG9wdGlvbnMuX2lkfSwgKHNvdXJjZU5vdGUpID0+XG4gICAgICAgICAgQG1vZGVsLnNldChzb3VyY2VOb3RlKVxuICAgICAgZWxzZVxuICAgICAgICAjIENyZWF0ZSBkZWZhdWx0IGVudHJ5XG4gICAgICAgIEBtb2RlbC5zZXQoc291cmNlOiBAb3B0aW9ucy5zb3VyY2UsIGRhdGU6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5zdWJzdHJpbmcoMCwxMCkpXG5cbiAgICAgIEAkZWwuZW1wdHkoKS5hcHBlbmQoc2F2ZUNhbmNlbEZvcm0uZWwpXG5cbiAgICAgIEBsaXN0ZW5UbyBzYXZlQ2FuY2VsRm9ybSwgJ3NhdmUnLCA9PlxuICAgICAgICBAZGIuc291cmNlX25vdGVzLnVwc2VydCBAbW9kZWwudG9KU09OKCksID0+IEBwYWdlci5jbG9zZVBhZ2UoKVxuXG4gICAgICBAbGlzdGVuVG8gc2F2ZUNhbmNlbEZvcm0sICdjYW5jZWwnLCA9PlxuICAgICAgICBAcGFnZXIuY2xvc2VQYWdlKClcbiAiXX0=
;