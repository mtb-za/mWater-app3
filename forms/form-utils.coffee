fs = require 'fs'
path = require 'path'
coffee = require 'coffee-script'

compile = (dir) ->
  # Read form.json
  form = JSON.parse(fs.readFileSync(path.resolve(dir, 'form.json')))
  
  if fs.existsSync(path.resolve(dir, 'view.js'))
    form.view = fs.readFileSync(path.resolve(dir, 'view.js'), 'utf8')
  else if fs.existsSync(path.resolve(dir, 'view.coffee'))
    script = fs.readFileSync(path.resolve(dir, 'view.coffee'), 'utf8')
    form.view = coffee.compile(script, {bare: true})
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