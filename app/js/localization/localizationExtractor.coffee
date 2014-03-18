uglify = require 'uglify-js'
coffee = require 'coffee-script'
handlebars = require 'handlebars'

exports.findInJs = (js) ->
  items = []
  tree = uglify.parse(js)

  walker = new uglify.TreeWalker (node) ->
    if node instanceof uglify.AST_Call and node.expression.name == "T"
      items.push node.args[0].value
  tree.walk(walker)
  return items

exports.findInCoffee = (cs) ->
  # Compile coffeescript
  js = coffee.compile(cs)
  return exports.findInJs(js)

exports.findInHbs = (hbs) ->
  items = []

  tree = handlebars.parse(hbs)

  for stat in tree.statements
    if stat.type == "mustache" and stat.id.string == "T"
      items.push stat.params[0].string
  return items

exports.findInFile = (filename, contents) ->
  return []

exports.findInDir = (dir) ->
  return []