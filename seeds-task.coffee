fs = require 'fs'
JsonClient = require('request-json').JsonClient

module.exports = ->
  done = @async()

  # Query database for rows
  seeds = {}

  jsonClient = new JsonClient "http://api.mwater.co/v3/"

  jsonClient.get "source_types", (err, res, body) ->
    if res.statusCode != 200
      throw new Error("Server error")

    seeds.source_types = body

    jsonClient.get "forms", (err, res, body) ->
        if res.statusCode != 200
          throw new Error("Server error")

        seeds.forms = body
        
        fs.writeFileSync('dist/js/seeds.js', 'seeds=' + JSON.stringify(seeds) + ';')
        done()
  