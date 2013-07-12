fs = require 'fs'
path = require 'path'
coffee = require 'coffee-script'
uuid = require 'uuid'
handlebars = require 'handlebars'
read = require 'read'
JsonClient = require('request-json').JsonClient
sync = require 'synchronize'

compile = (dir) ->
  # Read form.json
  form = JSON.parse(fs.readFileSync(path.resolve(dir, 'form.json')))

  # Add _id
  if not form._id
    form._id = uuid.v4().replace(/-/g, '')
    fs.writeFileSync(path.resolve(dir, 'form.json'), JSON.stringify(form, null, 4))
  form.views = {}
  
  # Get list of views (files in view folder)
  viewFiles = {}
  for file in fs.readdirSync(path.resolve(dir, 'views'))
    name = file.match(/^(\w+)\.(\w+)$/)[1]
    ext = file.match(/^(\w+)\.(\w+)$/)[2]
    viewFiles[name] = viewFiles[name] || {}
    viewFiles[name][ext] = fs.readFileSync(path.resolve(dir, 'views', file), 'utf8')

  # Read each view
  for name, files of viewFiles
    js = ""

    # Add template if present
    if files.hbs
      templ = handlebars.precompile(files.hbs)
      templ = "var template = Handlebars.template("+templ+");"
      js += templ

    # Add coffee-script
    if files.coffee
      js += coffee.compile(files.coffee, {bare: true})
    else if files.hbs
      # Add simple template view
      js += '''var view = Backbone.View.extend({
          load: function(data) {
            this.$el.html(template(data));
          }
        });
        return new view();'''

    form.views[name] = js
      
  return form

exports.compile = compile

exports.compileAll = ->
  forms = []

  # Get subdirectories
  for dir in fs.readdirSync(__dirname)
    dirpath = path.resolve(__dirname, dir)
    if fs.statSync(dirpath).isDirectory()
      console.log "Compiling #{dir}"
      forms.push(compile(dirpath))

  return forms

exports.upsertAll = (callback) ->
  jsonClient = new JsonClient "http://api.mwater.co/v3/"

  post = (path, data) ->
    df = sync.defer()
    jsonClient.post path, data, (err, res, body) ->
      df(err, {res: res, body: body, status: res.statusCode})
    return sync.await()

  sync.fiber ->
    # Get password for admin
    password = sync.await(read({ prompt: 'Admin password: ', silent: true}, sync.defer()))
      
    # Login as admin
    res = post "clients", { username: "admin", password: password }
    if res.status != 200
      console.error "Got #{res.status} code on login"
      throw new Error(res.body)
    client = res.body.client

    forms = exports.compileAll()

    # Upsert
    for form in forms
      res = post "forms?client=#{client}", form
      if res.status != 200
        console.error "Got #{res.status} code on upsert"
        throw new Error(res.body)
  , callback
