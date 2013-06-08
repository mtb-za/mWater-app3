compileDocumentSelector = require('./selector').compileDocumentSelector
compileSort = require('./selector').compileSort

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

    if options and options.sort 
      filtered.sort(compileSort(options.sort))

    if options and options.limit
      filtered = _.first filtered, options.limit

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

  cache: (docs, selector, options, success, error) ->
    # Add all non-local that are not upserted or deleted
    for doc in docs
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
