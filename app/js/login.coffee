

# Get current login from localstorage
loginKey = "v3.login"
exports.getLogin = ->
  if localStorage[loginKey]
    return JSON.parse(localStorage[loginKey])
  return null

# Set current login from localstorage  TODO where to put this?
exports.setLogin = (login) ->
  if login?
    localStorage[loginKey] = JSON.stringify(login)
  else if localStorage[loginKey]
    localStorage.removeItem(loginKey)

