compileDocumentSelector = require('./selector').compileDocumentSelector
compileSort = require('./selector').compileSort

class LocalDb
  constructor: (name) ->
    @name = name

  addCollection: (name) ->
    dbName = @name
    namespace = "db.#{dbName}.#{name}."

    @[name] = new Collection(namespace)

  removeCollection: (name) ->
    dbName = @name
    namespace = "db.#{dbName}.#{name}."

    keys = []
    for i in [0...localStorage.length]
      keys.push(localStorage.key(i))

    for key in keys
      if key.substring(0, namespace.length) == namespace
        localStorage.removeItem(key)

    delete @[name]

# Stores data in memory
class Collection
  constructor: (namespace) ->
    @namespace = namespace

    @items = {}
    @upserts = {}  # Pending upserts by _id. Still in items
    @removes = {}  # Pending removes by _id. No longer in items

    # Read from local storage
    @loadStorage()

  loadStorage: ->
    # Read items from localStorage
    @itemNamespace = @namespace + "_"

    for i in [0...localStorage.length]
      key = localStorage.key(i)
      if key.substring(0, @itemNamespace.length) == @itemNamespace
        item = JSON.parse(localStorage[key])
        @items[item._id] = item

    # Read upserts
    upsertKeys = if localStorage[@namespace+"upserts"] then JSON.parse(localStorage[@namespace+"upserts"]) else []
    for key in upsertKeys
      @upserts[key] = @items[key]

    # Read removes
    removeItems = if localStorage[@namespace+"removes"] then JSON.parse(localStorage[@namespace+"removes"]) else []
    @removes = _.object(_.pluck(removeItems, "_id"), removeItems)

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
    @_putItem(doc)
    @_putUpsert(doc)

    if success? then success(doc)

  remove: (id, success, error) ->
    if _.has(@items, id)
      @_putRemove(@items[id])
      @_deleteItem(id)
      @_deleteUpsert(id)

    if success? then success()

  _putItem: (doc) ->
    @items[doc._id] = doc
    localStorage[@itemNamespace + doc._id] = JSON.stringify(doc)

  _deleteItem: (id) ->
    delete @items[id]

  _putUpsert: (doc) ->
    @upserts[doc._id] = doc
    localStorage[@namespace+"upserts"] = JSON.stringify(_.keys(@upserts))

  _deleteUpsert: (id) ->
    delete @upserts[id]
    localStorage[@namespace+"upserts"] = JSON.stringify(_.keys(@upserts))

  _putRemove: (doc) ->
    @removes[doc._id] = doc
    localStorage[@namespace+"removes"] = JSON.stringify(_.values(@removes))

  _deleteRemove: (id) ->
    delete @removes[id]
    localStorage[@namespace+"removes"] = JSON.stringify(_.values(@removes))

  cache: (docs, selector, options, success, error) ->
    # Add all non-local that are not upserted or removed
    for doc in docs
      if not _.has(@upserts, doc._id) and not _.has(@removes, doc._id)
        @_putItem(doc)

    docsMap = _.object(_.pluck(docs, "_id"), docs)

    if options.sort
      sort = compileSort(options.sort)

    # Perform query, removing rows missing in docs from local db 
    @find(selector, options).fetch (results) =>
      for result in results
        if not docsMap[result._id] and not _.has(@upserts, result._id)
          # If past end on sorted limited, ignore
          if options.sort and options.limit and docs.length == options.limit
            if sort(result, _.last(docs)) >= 0
              continue
          @_deleteItem(result._id)

      if success? then success()  
    , error
    
  pendingUpserts: (success) ->
    success _.values(@upserts)

  pendingRemoves: (success) ->
    success _.pluck(@removes, "_id")

  resolveUpsert: (doc, success) ->
    if @upserts[doc._id] and _.isEqual(doc, @upserts[doc._id])
      @_deleteUpsert(doc._id)
    if success? then success()

  resolveRemove: (id, success) ->
    @_deleteRemove(id)
    if success? then success()

  seed: (doc, success) ->
    if not _.has(@items, doc._id) and not _.has(@removes, doc._id)
      @_putItem(doc)
    if success? then success()


createUid = -> 
  'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, (c) ->
    r = Math.random()*16|0
    v = if c == 'x' then r else (r&0x3|0x8)
    return v.toString(16)
   )

module.exports = LocalDb
