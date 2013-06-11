
# Tracks a set of items by id, indicating which have been added or removed.
# Changes are both add and remove
class ItemTracker
  constructor: ->

  update: (items) ->    # Return [[added],[removed]] items
    return [[], []]

module.exports = ItemTracker