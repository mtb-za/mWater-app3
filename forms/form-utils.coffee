fs = require 'fs'
path = require 'path'
coffee = require 'coffee-script'

compile = (dir) ->
  # Read form.json
  form = JSON.parse(fs.readFileSync(path.resolve(dir, 'form.json')))
  form.views = {}
  
  # Read each view
  for file in fs.readdirSync(path.resolve(dir, 'views'))
    if file.match(/\.coffee$/)
      viewName = file.substring(0, file.length - ".coffee".length)
      script = fs.readFileSync(path.resolve(dir, 'views', file), 'utf8')
      form.views[viewName] = coffee.compile(script, {bare: true})
      
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