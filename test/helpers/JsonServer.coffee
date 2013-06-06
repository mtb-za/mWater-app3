class JsonServer
  constructor: ->
    @map = {}
    @server = sinon.fakeServer.create()
    @server.autoRespond = true
    @server.respondWith(@handle)
    
  handle: (request) =>
    # Parse body
    request.params = JSON.parse(request.requestBody)
    
    # Get data
    item = @map[request.method+":"+request.url]
    console.log request.method+":"+request.url
    if item
      data = item(request)
      console.log data
      request.respond(200, { "Content-Type": "application/json" }, JSON.stringify(data))
      return
    console.log "404"
    request.respond(404)
    
  respond: (method, url, func) =>
    @map[method+":"+url] = func
    
  teardown: ->
    @server.restore()

window.JsonServer = JsonServer