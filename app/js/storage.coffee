# The objective of storage is to remove the dependency on window.localStorage (not always availabe)
# It uses LocalStorage when window.localStorage is available and TempStorage when it's not
# TempStorage keeps everything in memory, so the data is lost when the instance is destroyed


# Test window.localStorage
isLocalStorageSupported = ->
  if not window.localStorage
    return false
  try
    window.localStorage.setItem("test", "test")
    window.localStorage.removeItem("test")
    return true
  catch e
    return false

# Defines a simple object to access the localStorage
class LocalStorage
  get: (key) ->
    return window.localStorage.getItem(key)

  set: (key, value) ->
    window.localStorage.setItem(key, value)

  remove: (key) ->
    window.localStorage.removeItem(key)

  isPersistent: ->
    return true

  clear: ->
    window.localStorage.clear()

# Defines a simple store object to keep key/value pairs in memory
class TempStorage
  constructor: () ->
    @values = {}

  get: (key) ->
    return @values[key]

  set: (key, value) ->
    @values[key] = value

  remove: (key) ->
    delete @values[key]

  isPersistent: ->
    return false

  clear: ->
    @values = {}

# Global var to store the storage instance
storage = null

# Always return the same storage instance
exports.getStorage = getStorage = ->
  if not storage?
    if isLocalStorageSupported
      storage = new LocalStorage
    else
      storage = new TempStorage
  return storage
