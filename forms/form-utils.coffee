
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
    console.log script
    form.view = coffee.compile(script)
  return form

compileAll = ->
  forms = []

  # Get subdirectories
  for dir in fs.readdirSync(__dirname)
    if fs.statSync(dir).isDirectory()
      console.log "got #{dir}"
      forms.push(compile(path.resolve(__dirname, dir)))

  return forms

# Save to js file
forms = compileAll()
fs.writeFileSync(path.resolve(__dirname, 'forms.js'), 'forms=' + JSON.stringify(forms) + ';')

