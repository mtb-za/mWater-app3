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

  window.onerror = (errorMsg, url, lineNumber) ->
    if reportingError 
      console.error "Ignoring error: #{errorMsg}"
      return
    reportingError = true
    that.reportProblem "window.onerror:" + errorMsg + ":" + url + ":" + lineNumber
    
    # Put up alert instead of old action
    alert "Internal Error\n" + errorMsg + "\n" + url + ":" + lineNumber
    reportingError = false

  @restore = ->
    _.each _.keys(_captured), (key) ->
      console[key] = _captured[key]

    window.onerror = oldWindowOnError

ProblemReporter.register = (url, version, getLogin) ->
  ProblemReporter.instances = {}  unless ProblemReporter.instances

  return  if ProblemReporter.instances[url]

  ProblemReporter.instances[url] = new ProblemReporter(url, version, getLogin)

module.exports = ProblemReporter  