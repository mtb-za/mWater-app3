

# Get current login from localstorage
loginKey = "v3.login"
exports.getLogin = (storage) ->
  if storage.get(loginKey)
    return JSON.parse(storage.get(loginKey))
  return null

# Set current login from localstorage 
exports.setLogin = (storage, login) ->
  if login?
    storage.set(loginKey, JSON.stringify(login))
  else if storage.get(loginKey)
    storage.remove(loginKey)

