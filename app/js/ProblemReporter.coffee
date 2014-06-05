# Reports problems (crashes) to a server. Catches window.onerror to catch unhandled
# exceptions. Set ProblemReporter.default to the problem reporter that should be globally
# available, if desired.
consoleCapture = require './consoleCapture'

ProblemReporter = (url, version, getLogin) ->
  @reportProblem = (desc, success, error) ->
    console.log "Reporting problem..."
    device = "Unknown"
    try 
      device = JSON.stringify(window.device)
    catch ex
      console.error "Exception getting device"

    # Create log string
    log = consoleCapture.getHistory().join("\r\n")

    report =
      version: version
      user_agent: navigator.userAgent
      log: log
      desc: desc
      device: device
      url: window.location.href
      date: new Date().toISOString()

    login = getLogin()
    _.defaults report, login

    postUrl = if (login and login.client) then url + "?client=" + login.client else url
    req = $.post url, report
    req.done =>
      if success?
        success()
    req.fail =>
      if error?
        error()

  # Capture console
  consoleCapture.setup()

  # Don't overload the server with errors
  @reportProblem = _.debounce(@reportProblem, 30000, true)
  
  # Capture window.onerror
  oldWindowOnError = window.onerror

  # Prevent recursion
  reportingError = false

  handleOnError = (errorMsg, url, lineNumber) =>
    reportingError = true

    # Put up alert instead of old action
    alert T("Internal Error") + "\n" + errorMsg + "\n" + url + ":" + lineNumber

    @reportProblem "window.onerror:" + errorMsg + ":" + url + ":" + lineNumber, ->
      reportingError = false
    , ->
      reportingError = false

  # Don't overload the user with errors
  debouncedHandleOnError = _.debounce(handleOnError, 5000, true)

  window.onerror = (errorMsg, url, lineNumber) ->
    if reportingError 
      console.error "Ignoring error: #{errorMsg}"
      return

    debouncedHandleOnError(errorMsg, url, lineNumber)

  @restore = ->
    window.onerror = oldWindowOnError
  return

ProblemReporter.register = (url, version, getLogin) ->
  ProblemReporter.instances = {}  unless ProblemReporter.instances

  return ProblemReporter.instances[url] if ProblemReporter.instances[url]

  ProblemReporter.instances[url] = new ProblemReporter(url, version, getLogin)

  return ProblemReporter.instances[url] 

module.exports = ProblemReporter  