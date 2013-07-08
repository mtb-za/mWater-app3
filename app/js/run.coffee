AppView = require("./AppView")
SlideMenu = require("./SlideMenu")
Pager = require("./Pager")
PageMenu = require("./PageMenu")
Database = require "./Database"
SimpleImageManager = require './images/SimpleImageManager'

# Create database
db = Database.createDb()

# Create image manager
imageManager = new SimpleImageManager('http://data.mwater.co/apiv2/') # TODO move to new api

# Fake adding images
imageManager.addImage = (url, success, error) ->
  error("Not implemented")

# Fake camera
camera = {
  takePicture: (success, error) ->
    alert("On the Android app, this would take a picture")
}

# TODO create problem reporter

# Create error handler ### TODO
error = (err) ->
  console.error err
  alert("Internal error: " + err)

ctx = { 
  db: db 
  imageManager: imageManager
  camera: camera
  error: error
}

# Create pager
pager = new Pager(ctx)

# Create slide menu
slideMenu = new SlideMenu()
slideMenu.addSubmenu(pager.getContextMenu())
slideMenu.addSubmenu(new PageMenu(ctx: ctx))

# Create app view
app = new AppView(slideMenu: slideMenu, pager: pager)
$("body").append(app.$el)

$ -> 
  pager.openPage(require("./pages/MainPage"))


#pager.openPage(require("./pages/SourceMapPage"))
# survey = require("./survey/DemoSurvey")(ctx);
# pager.openPage(require("./pages/SurveyPage"), survey)
