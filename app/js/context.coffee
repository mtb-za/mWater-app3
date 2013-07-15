### 

Creates the context used for the app

Contexts have fixed members that have to be present.

db: database (LocalDb, HybridDb or RemoteDb)
imageManager: Simple or Cached Image manager
camera: Camera that has a single function: takePicture(success, error). 
  success is called with url to be passed to imageManager.addImage(url, success, error)
  error: error function to be called with unexpected errors
  auth: see auth module
  login: { user: <username>, org: <org code>, client: <client id> }

###

LocalDb = require './db/LocalDb'
RemoteDb = require './db/RemoteDb'
HybridDb = require './db/HybridDb'
SimpleImageManager = require './images/SimpleImageManager'
authModule = require("./auth")
sourcecodes = require './sourcecodes'

collectionNames = ['sources', 'forms', 'responses', 'source_types', 'tests', 'source_notes']

apiUrl = 'http://api.mwater.co/v3/'

# Barebones startup context
exports.createStartupContext = ->
  # Fake camera # TODO use cordova where possible
  camera = {
    takePicture: (success, error) ->
      alert("On the Android app, this would take a picture")
  }

  error = (err) ->
    console.error err
    alert("Internal error: " + err)

  return { 
    error: error
    apiUrl: apiUrl
    camera: camera
  }

exports.setupDemoContext = (ctx) ->
  # No local storage
  localDb = new LocalDb() 

  # No client (download only)
  remoteDb = new RemoteDb(apiUrl)

  db = new HybridDb(localDb, remoteDb)

  for col in collectionNames
    localDb.addCollection(col)
    remoteDb.addCollection(col)
    db.addCollection(col)

  # Disable upload
  db.upload = (success, error) ->
    success()

  # TODO enhance to allow caching in demo mode
  imageManager = new SimpleImageManager(apiUrl)

  # Allow everything
  auth = new authModule.AllAuth()

  # No client or org
  login = { user: "demo" }

  sourceCodesManager = new sourcecodes.DemoSourceCodesManager()

  _.extend ctx, {
    db: db 
    imageManager: imageManager
    auth: auth
    login: login
    sourceCodesManager: sourceCodesManager
  }

# login must contain user, org, client, email members. "user" is username. "org" can be null
# login can be obtained by posting to api /clients
exports.setupLoginContext = (ctx, login) ->
  apiUrl = 'http://api.mwater.co/v3/'

  # TODO uploader? sync?

  # Namespace includes username to be safe
  localDb = new LocalDb({namespace: "db.v3.#{login.user}"}) 

  remoteDb = new RemoteDb(apiUrl, login.client)

  db = new HybridDb(localDb, remoteDb)

  for col in collectionNames
    localDb.addCollection(col)
    remoteDb.addCollection(col)
    db.addCollection(col)

  # TODO switch to cached
  imageManager = new SimpleImageManager(apiUrl)

  # Allow everything
  auth = new authModule.UserAuth(login.user, login.org)

  sourceCodesManager = new sourcecodes.SourceCodesManager(apiUrl + "source_codes?client=#{login.client}")

  _.extend ctx, {
    db: db 
    imageManager: imageManager
    auth: auth
    login: login
    sourceCodesManager: sourceCodesManager
  }
