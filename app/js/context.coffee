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
auth = require("./auth")

collectionNames = ['sources', 'forms', 'responses', 'source_types', 'tests', 'source_notes']

exports.createDemoContext = ->
  apiUrl = 'http://api.mwater.co/v3/'
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

  # Fake camera
  camera = {
    takePicture: (success, error) ->
      alert("On the Android app, this would take a picture")
  }

  error = (err) ->
    console.error err
    alert("Internal error: " + err)

  # Allow everything
  auth = new auth.NoneAuth()

  # No client or org
  login = { user: "demo" }

  return { 
    db: db 
    imageManager: imageManager
    camera: camera
    error: error
    auth: auth
    login: login
    apiUrl: apiUrl
  }