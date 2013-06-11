assert = chai.assert
ItemTracker = require "ItemTracker"

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
