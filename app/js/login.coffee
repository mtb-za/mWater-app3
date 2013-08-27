

# Get current login from localstorage
loginKey = "v3.login"
exports.getLogin = ->
  if window.localStorage[loginKey]
    return JSON.parse(window.localStorage[loginKey])
  return null

# Set current login from localstorage 
exports.setLogin = (login) ->
  if login?
    window.localStorage[loginKey] = JSON.stringify(login)
  else if window.localStorage[loginKey]
    window.localStorage.removeItem(loginKey)

