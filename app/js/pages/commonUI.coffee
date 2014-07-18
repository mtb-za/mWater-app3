forms = require 'mwater-forms'
siteTypes = require '../common/siteTypes'

# Creates type, name, desc, location questions for a site
# Model should will/should contain: 
# name: { value: <name> }
# desc: { value: <desc> }
# type: { value: <type> }
# location: { value: <location> }
exports.createBasicSiteQuestions = (model) ->
  # When type changes, clear subtype
  model.on "change:type", =>
    model.unset("subtype")

  # Create questions
  contents = []

  contents.push new forms.DropdownQuestion
    T: T
    id: 'type'
    model: model
    prompt: T('Enter site type')
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
        prompt: T('Enter optional site subtype')
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
    T: T
    id: 'location'
    model: model
    prompt: T('Enter site location')

  return contents