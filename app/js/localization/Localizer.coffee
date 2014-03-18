# Localizer is a function that sets up global variable "T" which is 
# used to translate strings. Also sets up Handlebars helper with same name
# Function "T" maps to Localizer "localizeString" function
# Helper "T" maps to Localizer "??" function

module.exports = class Localizer
  constructor: (data, locale) ->
    @data = data
    @locale = locale

  # Makes this localizer global
  makeGlobal: ->
    global.T = (str) ->
      return "**" + str + "**"

    Handlebars.registerHelper 'T', (str) ->
      return "**" + str + "**"
