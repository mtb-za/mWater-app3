fs = require 'fs'
path = require 'path'
coffee = require 'coffee-script'
uuid = require 'uuid'
handlebars = require 'handlebars'

compile = (dir) ->
  # Read form.json
  form = JSON.parse(fs.readFileSync(path.resolve(dir, 'form.json')))

  # Add _id
  if not form._id
    form._id = uuid.v4().replace(/-/g, '')
    fs.writeFileSync(path.resolve(dir, 'form.json'), JSON.stringify(form, null, 4))
  form.views = {}
  
  # Read each view
  for file in fs.readdirSync(path.resolve(dir, 'views'))
    if file.match(/\.coffee$/)
      viewName = file.substring(0, file.length - ".coffee".length)
      script = fs.readFileSync(path.resolve(dir, 'views', file), 'utf8')
      js = coffee.compile(script, {bare: true})

      # Add template if present
      handlebarsFilename = path.resolve(dir, 'views', viewName + ".hbs")
      if fs.existsSync(handlebarsFilename)
        templ = handlebars.precompile(fs.readFileSync(handlebarsFilename, 'utf8'))
        templ = "var template = Handlebars.template("+templ+");"
        js = templ + js;

      form.views[viewName] = js
      
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