# Localizer is a function that sets up global variable "T" which is 
# used to translate strings. Also sets up Handlebars helper with same name
# Function "T" maps to Localizer "localizeString" function
# Helper "T" maps to Localizer "localizeString" function

module.exports = class Localizer
  constructor: (data, locale = "en") ->
    @data = data
    @locale = locale

    # Index strings by English if data present
    @englishMap = {}
    if data?
      for str in @data.strings
        @englishMap[str.en] = str

  setLocale: (code) ->
    @locale = code

  getLocales: ->
    return @data.locales

  localizeString: (str, args...) =>
    # Find string, falling back to English
    item = @englishMap[str]
    if item and item[@locale]
      locstr = item[@locale]
    else 
      locstr = str

    # Fill in arguments
    for i in [0...args.length]
      locstr = locstr.replace("{" + i + "}", args[i])
    return locstr

  # Makes this localizer global
  makeGlobal: (str, args...) ->
    global.T = @localizeString
    global.T.localizer = this
    Handlebars.registerHelper 'T', @localizeString

  # Saves current locale to localstorage
  saveCurrentLocale: ->
    window.localStorage['locale'] = @locale

  # Restores current locale to localstorage
  restoreCurrentLocale: ->
    @locale = window.localStorage['locale'] or "en"
