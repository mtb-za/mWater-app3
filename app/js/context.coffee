### 

Creates the context used for the app

Note: There should only every be one context object. It should be modified, rather than creating a whole new object
as components like the PageMenu may be depending on it. 

Contexts have fixed members that have to be present.

db: database (LocalDb, HybridDb or RemoteDb)
imageManager: Simple or Cached Image manager
camera: Camera that has a single function: takePicture(success, error). 
  success is called with url to be passed to imageManager.addImage(url, success, error)
  error: error function to be called with unexpected errors
auth: see auth module
login: { user: <username>, org: <org code>, client: <client id> }
dataSync: synchronizer for data including db and source codes. Success message is to be displayed.
imageSync: synchronizer for images. Success message is to be displayed.
imageAcquirer: source of images (either camera or file selection). Has single function: acquire(success, error)
  that calls success with id of image. If not present, not available.
apiUrl: URL of API e.g. https://api.mwater.co/v3/

stop(): must be called when context is no longer needed, or before setup of a new user

TODO fill in
TODO should any items be null of context?

###

LocalDb = require('minimongo').LocalDb
RemoteDb = require('minimongo').RemoteDb
HybridDb = require('minimongo').HybridDb
SimpleImageManager = require './images/SimpleImageManager'
CachedImageManager = require './images/CachedImageManager'
authModule = require './auth'
sourcecodes = require './sourcecodes'
syncModule = require './sync'
Camera = require './Camera'
cordova = require './cordova'
ImageUploader = require './images/ImageUploader'
ProblemReporter = require './ProblemReporter'

collectionNames = ['sources', 'forms', 'responses', 'source_types', 'tests', 'source_notes']

apiUrl = 'https://api.mwater.co/v3/'

# TODO this is not a pretty way to set these. But it is somewhat decoupled.
temporaryFs = null
persistentFs = null

exports.setupFileSystems = (tempFs, persFs) ->
  temporaryFs = tempFs
  persistentFs = persFs

# Base context
createBaseContext = ->
  camera = if Camera.hasCamera() then Camera else null

  error = (err) ->
    console.error err
    str = if err? and err.message then err.message else err
    alert("Internal error: " + err)
    
    # Call default problem reporter if present
    if ProblemReporter.default?
      ProblemReporter.default.reportProblem(err)

  return { 
    error: error
    apiUrl: apiUrl
    camera: camera
    version: '//VERSION//'
    baseVersion: cordova.baseVersion()
    stop: ->
    # db: null
    # imageManager: null
    # auth: null 
    # login: null
    # sourceCodesManager: null
    # dataSync: null
    # imageSync: null
  }

# Setup database
createDb = (login) ->
  if login
    # Namespace includes username to be safe
    localDb = new LocalDb({namespace: "v3.db.#{login.user}"}) 
  else
    # No local storage
    localDb = new LocalDb() 

  remoteDb = new RemoteDb(apiUrl, if login then login.client else undefined)

  db = new HybridDb(localDb, remoteDb)

  # Add collections
  for col in collectionNames
    localDb.addCollection(col)
    remoteDb.addCollection(col)
    db.addCollection(col)

  # Seed local db
  if window.seeds
    for col, docs of window.seeds
      for doc in docs
        localDb[col].seed(doc)

  return db

# Anonymous context for not logged in
exports.createAnonymousContext = ->
  db = createDb()

  # Allow nothing
  auth = new authModule.NoneAuth()

  imageManager = new SimpleImageManager(apiUrl)

  return _.extend createBaseContext(), {
    db: db
    imageManager: imageManager
    auth: auth 
    login: null
    sourceCodesManager: null
    dataSync: null
    imageSync: null
  }

exports.createDemoContext = ->
  db = createDb()

  # Allow caching in demo mode in non-persistent storage
  if temporaryFs
    # Silently disable upload 
    fileTransfer = new FileTransfer()
    fileTransfer.upload = (filePath, server, successCallback, errorCallback, options) =>
      successCallback()

    imageManager = new CachedImageManager(temporaryFs, apiUrl, "images", "", fileTransfer) 
  else
    imageManager = new SimpleImageManager(apiUrl)

  # Allow everything
  auth = new authModule.AllAuth()

  # No client or org
  login = { user: "demo" }

  sourceCodesManager = new sourcecodes.DemoSourceCodesManager()

  return _.extend createBaseContext(), {
    db: db 
    imageManager: imageManager
    auth: auth
    login: login
    sourceCodesManager: sourceCodesManager
    dataSync: null
    imageSync: null
  }

# login must contain user, org, client, email members. "user" is username. "org" can be null
# login can be obtained by posting to api /clients
exports.createLoginContext = (login) ->
  db = createDb(login)

  if persistentFs
    fileTransfer = new FileTransfer()
    imageManager = new CachedImageManager(persistentFs, apiUrl, "Android/data/co.mwater.clientapp/images", login.client, fileTransfer)  
  else
    imageManager = new SimpleImageManager(apiUrl)
  
  auth = new authModule.UserAuth(login.user, login.org)
  sourceCodesManager = new sourcecodes.SourceCodesManager(apiUrl + "source_codes?client=#{login.client}")
  dataSync = new syncModule.DataSync(db, sourceCodesManager)
  imageSync = new syncModule.ImageSync(imageManager)

  # Start synchronizing
  dataSync.start(30*1000)  # Every 30 seconds
  imageSync.start(30*1000)  # Every 30 seconds

  # Perform sync immediately
  dataSync.perform()
  imageSync.perform()

  stop = ->
    dataSync.stop()
    imageSync.stop()

  baseContext = createBaseContext()

  # Create image acquirer with camera and imageManager if persistentFs and camera
  if baseContext.camera? and persistentFs
    imageAcquirer = {
      acquire: (success, error) ->
        baseContext.camera.takePicture (url) ->
          # Add image
          imageManager.addImage url, (id) =>
            success(id)
        , (err) ->
          alert("Failed to take picture")
    }
  else 
    # Use ImageUploader
    imageAcquirer = {
      acquire: (success, error) ->
        ImageUploader.acquire(apiUrl, login.client, success, error) 
    }

  return _.extend baseContext, {
    db: db 
    imageManager: imageManager
    auth: auth
    login: login
    sourceCodesManager: sourceCodesManager
    dataSync: dataSync
    imageSync: imageSync
    stop: stop
    imageAcquirer: imageAcquirer
  }