formutils = require './forms/form-utils'
fs = require 'fs'

module.exports = ->
  done = @async()

  # Compile forms
  formutils.upsertAll(done)
  