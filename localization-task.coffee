fs = require 'fs'
extractor = require 'ez-localize/extractor'
coffeeify = require 'coffeeify'
hbsfy = require 'hbsfy'

module.exports = ->
  done = @async()

  options = { 
    extensions: ['.js', '.coffee']
    externalModules: ["mwater-forms"]
    transformKey: [ 'browserify', 'transform' ]
  }

  extractor.updateLocalizationFile "app/js/run.coffee", "app/js/localizations.json", options, -> 
    done()

