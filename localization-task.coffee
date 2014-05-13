fs = require 'fs'
extractor = require 'ez-localize/extractor'
coffeeify = require 'coffeeify'
hbsfy = require 'hbsfy'

module.exports = ->
  done = @async()

  options = { 
    extensions: ['.js', '.coffee']
    transform: [coffeeify, hbsfy] 
  }

  extractor.updateLocalizationFile "app/js/run.coffee", "app/js/localizations.json", options, -> 
    done()

