compileDocumentSelector = require('./selector').compileDocumentSelector

class LocalDb
  addCollection: (name) ->
    @[name] = new Collection(name)

  removeCollection: (name) ->
    delete @[name]

# Stores data in memory
class Collection
  constructor: ->
    @items = {}
    @upserts = {}  # Pending upserts by _id. Still in items
    @removes = {}  # Pending deletes by _id. No longer in items

  find: (selector, options) ->
    return fetch: (success, error) =>
      @_findFetch(selector, options, success, error)

  findOne: (selector, options, success, error) ->
    if _.isFunction(options) 
      [options, success, error] = [{}, options, success]

    @find(selector, options).fetch (results) ->
      if success? then success(if results.length>0 then results[0] else null)
    , error

  _findFetch: (selector, options, success, error) ->
    filtered = _.filter(_.values(@items), compileDocumentSelector(selector))
    if success? then success(filtered)

  upsert: (doc, success, error) ->
    if not doc._id
      doc._id = createUid()

    # Replace/add 
    @items[doc._id] = doc
    @upserts[doc._id] = doc
    if success? then success(doc)

  remove: (id, success, error) ->
    if _.has(@items, id)
      @removes[id] = @items[id]
      delete @items[id]
    
    if success? then success()

  cache: (doc, success, error) ->
    if not _.has(@upserts, doc._id) and not _.has(@removes, doc._id)
      @items[doc._id] = doc
    if success? then success()

createUid = -> 
  'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, (c) ->
    r = Math.random()*16|0
    v = if c == 'x' then r else (r&0x3|0x8)
    return v.toString(16)
   )

module.exports = LocalDb
