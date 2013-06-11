
# Tracks a set of items by id, indicating which have been added or removed.
# Changes are both add and remove
class ItemTracker
  constructor: ->
    @key = '_id'
    @items = {}

  update: (items) ->    # Return [[added],[removed]] items
    adds = []
    removes = []

    # Add any new ones
    for item in items
      if not _.has(@items, item[@key])
        adds.push(item)

    # Create map of items parameter
    map = _.object(_.pluck(items, @key), items)

    # Find removes
    for key, value of @items
      if not _.has(map, key)
        removes.push(value)
      else if not _.isEqual(value, map[key])
        adds.push(map[key])
        removes.push(value)

    for item in removes
      delete @items[item[@key]]

    for item in adds
      @items[item[@key]] = item

    return [adds, removes]

module.exports = ItemTracker