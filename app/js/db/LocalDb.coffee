compileDocumentSelector = require('./selector').compileDocumentSelector

class LocalDb
  addCollection: (name) ->
    @[name] = new Collection(name)

  removeCollection: (name) ->
    delete @[name]

class Collection
  constructor: ->
    @items = []

  find: (selector, options) ->
    return fetch: (success, error) =>
      @_findFetch(selector, options, success, error)

  _findFetch: (selector, options, success, error) ->
    filtered = _.filter(@items, compileDocumentSelector(selector))
    success(filtered)

  upsert: (data, success, error) ->
    if not data._id
      data._id = createUid()

    # Replace if present
    @items = _.filter(@items, (item) -> item._id != data._id)
    @items.push(data)
    success(data)

  remove: (id, success, error) ->
    @items = _.filter(@items, (item) -> item._id != id)
    success()

createUid = -> 
  'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, (c) ->
    r = Math.random()*16|0
    v = if c == 'x' then r else (r&0x3|0x8)
    return v.toString(16)
   )
  # 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) ->
  #   r = Math.random()*16|0
  #   v = if c == 'x' then r else (r&0x3|0x8)
  #   return v.toString(16)
  #  )

module.exports = LocalDb
