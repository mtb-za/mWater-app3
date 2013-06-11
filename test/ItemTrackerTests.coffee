assert = chai.assert
ItemTracker = require "../app/js/ItemTracker"

describe 'ItemTracker', ->
  beforeEach ->
    @tracker = new ItemTracker()

  it "records adds", ->
    items =  [
      _id: 1, x:1
      _id: 2, x:2
    ]
    [adds, removes] = @tracker.update(items)
    assert.deepEqual adds, items
    assert.deepEqual removes, []

  it "remembers items", ->
    items =  [
      {_id: 1, x:1}
      {_id: 2, x:2}
    ]
    [adds, removes] = @tracker.update(items)
    [adds, removes] = @tracker.update(items)
    assert.deepEqual adds, []
    assert.deepEqual removes, []

  it "sees removed items", ->
    items1 =  [
      {_id: 1, x:1}
      {_id: 2, x:2}
    ]
    items2 =  [
      {_id: 1, x:1}
    ]
    @tracker.update(items1)
    [adds, removes] = @tracker.update(items2)
    assert.deepEqual adds, []
    assert.deepEqual removes, [{_id: 2, x:2}]

  it "sees removed changes", ->
    items1 =  [
      {_id: 1, x:1}
      {_id: 2, x:2}
    ]
    items2 =  [
      {_id: 1, x:1}
      {_id: 2, x:4}
    ]
    @tracker.update(items1)
    [adds, removes] = @tracker.update(items2)
    assert.deepEqual adds, [{_id: 2, x:4}]
    assert.deepEqual removes, [{_id: 2, x:2}]
