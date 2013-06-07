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

  findOne: (selector, options, success, error) ->
    if _.isFunction(options) 
      [options, success, error] = [{}, options, success]

    @find(selector, options).fetch (results) ->
      if success? then success(if results.length>0 then results[0] else null)
    , error)

  _findFetch: (selector, options, success, error) ->
    filtered = _.filter(@items, compileDocumentSelector(selector))
    if success? then success(filtered)

  upsert: (data, success, error) ->
    if not data._id
      data._id = createUid()

    # Replace if present
    @items = _.filter(@items, (item) -> item._id != data._id)
    @items.push(data)
    if success? then success(data)

  remove: (id, success, error) ->
    @items = _.filter(@items, (item) -> item._id != id)
    if success? then success()

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
