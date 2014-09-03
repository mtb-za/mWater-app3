# Run before libs are loaded. Contains hacks

# See issue https://github.com/mWater/app-v3/issues/103
if navigator.userAgent.toLowerCase().indexOf('android 4.1.1') != -1
  window.L_DISABLE_3D = true

if navigator.userAgent.toLowerCase().indexOf('android 4.0.4') != -1
  window.L_DISABLE_3D = false

# Check local storage
getLocalStorageSupported = ->
  if not window.localStorage
    return false
  try
    window.localStorage.setItem("test", "test")
    window.localStorage.removeItem("test")
    return true
  catch e
    return false

if not getLocalStorageSupported()
  alert("Your browser does not support local storage. Please turn off private browsing and reload the page.")