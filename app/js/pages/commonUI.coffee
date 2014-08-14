forms = require 'mwater-forms'
siteTypes = require('mwater-common').siteTypes

# Creates type, name, desc, location questions for a site
# Model should will/should contain: 
# name: { value: <name> }
# desc: { value: <desc> }
# type: { value: <type> }
# location: { value: <location> }
exports.createBasicSiteQuestions = (model, ctx) ->
  # When type changes, clear subtype
  model.on "change:type", =>
    model.unset("subtype")

  # Create context for forms
  formCtx = {
    displayMap: (location, setLocation) =>
      options = {}
      options.setLocation = setLocation
      if location?
        options.initialGeo = { type: 'Point', coordinates: [location.longitude, location.latitude] }
      ctx.pager.openPage require("./SiteMapPage"), options
  }

  # Create questions
  contents = []

  contents.push new forms.DropdownQuestion
    T: T
    id: 'type'
    model: model
    prompt: T('Select site type')
    choices: _.map(siteTypes, (st) => { id: st.name, label: T(st.name)})
    required: true

  # Create subtype questions
  for siteType in siteTypes
    if siteType.subtypes.length == 0
      continue

    do (siteType) =>
      contents.push new forms.DropdownQuestion
        T: T
        id: 'subtype'
        model: model
        prompt: T('Select optional site subtype')
        choices: _.map(siteType.subtypes, (st) => { id: st, label: T(st) })
        conditional: () =>
          return model.get("type").value == siteType.name

  contents.push new forms.TextQuestion
    T: T
    id: 'name'
    model: model
    prompt: T('Enter optional name')

  contents.push new forms.TextQuestion
    T: T
    id: 'desc'
    model: model
    prompt: T('Enter optional description')

  contents.push new forms.LocationQuestion
    ctx: formCtx
    T: T
    id: 'location'
    model: model
    prompt: T('Enter site location')

  return contents