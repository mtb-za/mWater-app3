# Captures console log, warn and error. Keeps last N messages
# See http://tobyho.com/2012/07/27/taking-over-console-log/

history = []
capturing = false

# Get the console history
exports.getHistory = ->
  return history.slice(0)

# Setup capture (safe to call repeatedly)
exports.setup = ->
  if capturing
    return

  capturing = true

  # Get console
  console = window.console

  recordConsoleCall = (method, args) ->
    # Consolidate arguments into string
    message = Array::slice.apply(args).join(" ")

    # Record
    history.push("#{method}: #{message}")

    # Trim length
    if history.length > 200
      history.splice 0, 20  

  intercept = (method) ->
    original = console[method]
    console[method] = ->
      # Record call 
      recordConsoleCall(method, arguments)

      if original.apply
        # Do this for normal browsers
        original.apply(console, arguments)
      else
        # Do this for IE
        message = Array::slice.apply(arguments).join(" ")
        original(message)
      return

  methods = [
    "log"
    "warn"
    "error"
  ]

  # Catch all methods
  for method in methods
    intercept method
