
module.exports = class HybridDb
  constructor: (localDb, remoteDb) ->
    @localDb = localDb
    @remoteDb = remoteDb

  addCollection: (name) ->
    @[name] = new HybridCollection(name, @localDb[name], @remoteDb[name])

class HybridCollection
  constructor: (name, localCol, remoteCol) ->
    @name = name
    @localCol = localCol
    @remoteCol = remoteCol

  find: (selector, options = {}) ->
    return fetch: (success, error) =>
      @_findFetch(selector, options, success, error)

  findOne: (selector, options = {}, success, error) ->
    if _.isFunction(options) 
      [options, success, error] = [{}, options, success]

    #@find(selector, options).fetch (results) ->
    #  if success? then success(if results.length>0 then results[0] else null)
    #, error

  _findFetch: (selector, options, success, error) ->
    mode = options.mode || "hybrid"

    if mode == "hybrid"
      # Get local results
      localSuccess = (localData) =>
        # Return data immediately
        success(localData)

        # Get remote data
        remoteSuccess = (remoteData) =>
          # Cache locally
          cacheSuccess = () =>
            # Get local data again
            localSuccess2 = (localData2) =>
              # Check if different
              if not _.isEqual(localData, localData2)
                # Send again
                success(localData2)
            @localCol.find(selector, options).fetch(localSuccess2)
          @localCol.cache(remoteData, selector, options, cacheSuccess, error)
        @remoteCol.find(selector, options).fetch(remoteSuccess)

      @localCol.find(selector, options).fetch(localSuccess, error)

  upsert: (doc, success, error) ->

  remove: (id, success, error) ->

