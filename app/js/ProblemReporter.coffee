# Reports problems (crashes) to a server. Catches window.onerror to catch unhandled
# exceptions. Set ProblemReporter.default to the problem reporter that should be globally
# available, if desired.

ProblemReporter = (url, version, getLogin) ->
  # IE9 hack
  capture = (func) ->
    old = console[func]
    _captured[func] = old
    console[func] = (arg) ->
      history.push arg
      history.splice 0, 20  if history.length > 200
      old.call console, arg

  # Get log
  getLog = ->
    log = ""
    _.each history, (item) ->
      log += String(item) + "\r\n"
    log


  history = []

  that = this

  if Function::bind and console and typeof console.log is "object"
    ["log", "info", "warn", "error", "assert", "dir", "clear", "profile", "profileEnd"].forEach ((method) ->
      console[method] = @bind(console[method], console)
    ), Function::call

  _captured = {}

  capture "log"
  capture "warn"
  capture "error"
  
  @reportProblem = (desc, success, error) ->
    # Create log string
    log = getLog()
    console.log "Reporting problem..."
    report =
      version: version
      user_agent: navigator.userAgent
      log: log
      desc: desc
      device: JSON.stringify(window.device)
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
  
  # # Capture error logs
  # debouncedReportProblem = _.debounce(@reportProblem, 5000, true)
  # oldConsoleError = console.error
  # console.error = (arg) ->
  #   oldConsoleError arg
  #   debouncedReportProblem arg
  
  # Capture window.onerror
  oldWindowOnError = window.onerror

  # Prevent recursion
  reportingError = false

  handleOnError = (errorMsg, url, lineNumber) ->
    reportingError = true

    # Put up alert instead of old action
    alert T("Internal Error") + "\n" + errorMsg + "\n" + url + ":" + lineNumber

    that.reportProblem "window.onerror:" + errorMsg + ":" + url + ":" + lineNumber, ->
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
    _.each _.keys(_captured), (key) ->
      console[key] = _captured[key]

    window.onerror = oldWindowOnError

  return

ProblemReporter.register = (url, version, getLogin) ->
  ProblemReporter.instances = {}  unless ProblemReporter.instances

  return ProblemReporter.instances[url] if ProblemReporter.instances[url]

  ProblemReporter.instances[url] = new ProblemReporter(url, version, getLogin)

  return ProblemReporter.instances[url] 

module.exports = ProblemReporter  