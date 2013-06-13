formutils = require './forms/form-utils'
fs = require 'fs'

module.exports = ->
  done = @async()

  # Compile forms
  forms = formutils.compileAll()

  fs.writeFileSync('dist/js/forms.js', 'forms=' + JSON.stringify(forms) + ';')
  done()
  