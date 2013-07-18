forms = require("forms")
model = new Backbone.Model()

sections = []
questions = []

questions.push new forms.TextQuestion
  id: "interpreter"
  model: model
  prompt: "Enter name of interpreter"

questions.push new forms.Instructions
  html: '''
  Hello, my name is _______________. I work for an NGO called mWater that is working with the Mwanza City Council on a project to improve access to safe water. Our project is funded by the United States Agency for International Development. 
  <br/> <br/> We would like to ask you a few short questions about water in your community. You are not obligated to take part in this survey. If you agree to take part, we will not reveal your identity or your phone number to anyone outside of our organization. Would you like to take part in this survey?
  '''

questions.push new forms.RadioQuestion
  id: "consent"
  model: model
  prompt: "Does the person agree?"
  options: [[true, "Yes"], [false, "No"]]
  required: true

questions.push new forms.RadioQuestion
  id: "share_contact"
  model: model
  prompt: "Would you like to share your name and phone number so we can contact you later? You do not have to provide this information to take part in the survey. Does the person agree?"
  options: [[true, "Yes"], [false, "No"]]
  required: true

questions.push new forms.TextQuestion
  id: "name"
  model: model
  prompt: "Name"
  conditional: (m) ->
    m.get("share_contact") == true
  required: true

questions.push new forms.TextQuestion
  id: "mobile_number"
  model: model
  prompt: "Mobile number"
  conditional: (m) ->
    m.get("share_contact") == true
  required: true

sections.push new forms.Section
  model: model
  title: "Introduction and Consent"
  contents: questions

questions = []

questions.push new forms.NumberQuestion
  id: "num_water_sources"
  model: model
  prompt: "How many water sources do you have to choose from?"

questions.push new forms.RadioQuestion
  id: "enough_safe_sources"
  model: model
  prompt: "Do you think you have enough safe water sources in your community?"
  options: [[true, "Yes"], [false, "No"]]

questions.push new forms.RadioQuestion
  id: "made_sick"
  model: model
  prompt: "Do you think water has made anyone in your household sick in the past year?"
  options: [[true, "Yes"], [false, "No"]]

sections.push new forms.Section
  model: model
  title: "Water Source Information"
  contents: questions

questions = []

createRecallQuestions = (suffix, text) ->
  qs = []

  qs.push new forms.MulticheckQuestion
    id: "water_from" + suffix
    model: model
    prompt: "Where did you get your water #{text}"
    options: [
      ['Piped water']
      ['PipeDwelling', 'Piped into dwelling']
      ['PipeYardPlot', 'Piped into yard/plot']
      ['PipeKiosk', 'Public kiosk']
      ['PipePublic', 'Public tap']
      ['NeighborTap', 'Neighbor’s tap']
      ['Water from open well']
      ['1', 'Open well in dwelling']
      ['2', 'Open well in yard/plot']
      ['3', 'Open public well']
      ['4', 'Neighbor’s open well']
      ['Water from covered well']
      ['5', 'Protected well in dwelling']
      ['6', 'Protected well in yard/plot']
      ['7', 'Protected public well']
      ['8', 'Neighbor’s protected well']
      ['Borehole']
      ['9', 'Borehole in yard/plot']
      ['10', 'Public borehole']
      ['Surface water']
      ['11', 'Spring']
      ['12', 'River / stream']
      ['13', 'Pond']
      ['14', 'Lake Victoria']
      ['15', 'Dam']
      ['Other']
      ['Rainwater', 'Rainwater']
      ['TankerTruck', 'Tanker truck']
      ['16', 'Water vendor']
      ['17', 'Bottled water']
      ['Other', 'Other']
    ]
  
  qs.push new forms.TextQuestion
    id: "water_from_other" + suffix
    model: model
    prompt: "Other"
    required: true
    conditional: (m) ->
      m.get("water_from" + suffix) == "Other"

  qs.push new forms.MulticheckQuestion
    id: "water_provider" + suffix
    model: model
    prompt: "Who provides this water?"
    options: [
      ['MWAUWASA', 'MWAUWASA']
      ['NGO/CBO', 'NGO / CBO']
      ['PrivateOperator', 'Private operator']
      ['CWA', 'Community water association']
    ]

  qs.push new forms.NumberQuestion
    id: "time_get_water" + suffix
    model: model
    prompt: "How long did it take you to go there, get water, and come back including waiting time?"
    hint: "Time in minutes"

  qs.push new forms.RadioQuestion
    id: "pay_water" + suffix
    model: model
    prompt: "Did you pay for the water?"
    options: [[true, "Yes"], [false, "No"]]

  qs.push new forms.NumberQuestion
    id: "price_water" + suffix
    model: model
    prompt: "Price in Tsh?"
    decimal: true
    conditional: (m) ->
      m.get("pay_water" + suffix) == true

  qs.push new forms.RadioQuestion
    id: "source_safe" + suffix
    model: model
    prompt: "Do you think this source is safe?"
    options: [[true, "Yes"], [false, "No"]]

  return qs

sections.push new forms.Section
  model: model
  title: "Water Sources Today"
  contents: createRecallQuestions('_today', "today")

sections.push new forms.Section
  model: model
  title: "Water Sources Yesterday"
  contents: createRecallQuestions('_1dayago', "yesterday")

sections.push new forms.Section
  model: model
  title: "Water Sources Day Before Yesterday"
  contents: createRecallQuestions('_2dayago', "day before yesterday")

questions = []

questions.push new forms.RadioQuestion
  id: "not_enough_water"
  model: model
  prompt: "Was there any time in the last two weeks when you did not have enough water for your household needs?"
  options: [[true, "Yes"], [false, "No"]]

questions.push new forms.MulticheckQuestion
  id: "not_enough_water_reasons"
  model: model
  prompt: "Was it because (check all that apply)"
  options: [
    ['Closed', 'Water source closed']
    ['NoWater', 'No water at source']
    ['NotAfford', 'Could not afford water']
    ['Other', 'Other']
  ]
  conditional: (m) ->
    m.get("not_enough_water") == true

questions.push new forms.TextQuestion
  id: "not_enough_water_reasons_other"
  model: model
  prompt: "Other"
  required: true
  conditional: (m) ->
    m.get("not_enough_water") == true and m.get("not_enough_water_reasons") == "Other"

sections.push new forms.Section
  model: model
  title: "Water Sufficiency"
  contents: questions

questions = []

questions.push new forms.MulticheckQuestion
  id: "home_storage"
  model: model
  prompt: "How do you store water in your house?"
  options: [
    ['Open', 'Open container']
    ['Closed', 'Closed container']
    ['ClosedSpigot', 'Closed container with spigot']
    ['Tank', 'Storage tank (more than 20 L)']
  ]

questions.push new forms.MulticheckQuestion
  id: "home_treatment"
  model: model
  prompt: "Do you do anything to the water to make it safer to drink? If yes, check all that apply:"
  options: [
    ['Boil', 'Boil']
    ['Closed', 'Add bleach / chlorine']
    ['ClosedSpigot', 'Add AquaGuard or PUR packet']
    ['Strain', 'Strain through a cloth']
    ['Filter', 'Use water filter (ceramic / sand / membrane / etc.)']
    ['Solar', 'Solar disinfection']
    ['Settle', 'Let it stand and settle']
    ['Other', 'Other - please specify']
  ]

questions.push new forms.TextQuestion
  id: "home_treatment_other"
  model: model
  prompt: "Other"
  required: true
  conditional: (m) ->
    m.get("home_treatment") == "Other"

sections.push new forms.Section
  model: model
  title: "Household storage and treatment"
  contents: questions

# /* 4 */
# {
#     "code" : "Household",
#     "name" : "Household storage container"
# }

# /* 5 */
# {
#     "code" : "Tubewell",
#     "name" : "Tubewell"
# }

# /* 6 */
# {
#     "code" : "Dug",
#     "name" : "Unprotected dug well"
# }

# /* 7 */
# {
#     "code" : "BoreholeHand",
#     "name" : "Borehole with hand pump"
# }

# /* 8 */
# {
#     "code" : "DugProt",
#     "name" : "Protected dug well without pump"
# }

# /* 9 */
# {
#     "code" : "DugProtHand",
#     "name" : "Protected dug well with hand pump"


# /* 11 */
# {
#     "code" : "Spring",
#     "name" : "Unprotected spring"
# }

# /* 12 */
# {
#     "code" : "JerryCan",
#     "name" : "Jerry Can"
# }

# /* 13 */
# {
#     "code" : "DugProtMech",
#     "name" : "Protected dug well with mech pump"
# }


# /* 15 */
# {
#     "code" : "BoreholeMech",
#     "name" : "Borehole with mechanical pump"
# }

# /* 16 */
# {
#     "code" : "SpringProt",
#     "name" : "Protected spring"
# }

# /* 17 */
# {
#     "code" : "Surface",
#     "name" : "Surface Water"
# }

# /* 18 */
# {
#     "code" : "Bottled",
#     "name" : "Bottled Water"
# }

# /* 19 */
# {
#     "code" : "SupplyTank",
#     "name" : "Supply network tank"
# }

# /* 20 */
# {
#     "code" : "SupplySample",
#     "name" : "Supply network sampling point"
# }

# /* 21 */
# {
#     "code" : "SwimmingPool",
#     "name" : "Swimming pool"
# }

# /* 22 */
# {
#     "code" : "Beach",
#     "name" : "Beach"
# }


view = new forms.Sections(
  sections: sections
  model: model
)

return new forms.SurveyView
  model: model
  contents: [view]
