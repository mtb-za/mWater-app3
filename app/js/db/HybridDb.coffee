
class HybridDb
  constructor: (localDb, remoteDb) ->
    @localDb = localDb
    @remoteDb = remoteDb

  addCollection: (name) ->
    @[name] = new HybridCollection(@localDb, @remoteDb)

class HybridCollection
  constructor: (localDb, remoteDb) ->
    @localDb = localDb
    @remoteDb = remoteDb

  find: (selector, options) ->

  findOne: (selector, options, success, error) ->

  upsert: (doc, success, error) ->

  remove: (id, success, error) ->
