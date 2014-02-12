forms = require("forms")
model = new Backbone.Model()

sections = []
questions = []

# General Information 
questions.push new forms.TextQuestion(
  id: "q2"
  model: model
  prompt: "Enter a text value"
)
questions.push new forms.DateQuestion(
  id: "q5"
  model: model
  prompt: "Select a date"
)
questions.push new forms.NumberQuestion(
  id: "q6"
  model: model
  prompt: "Enter a number"
)

questions.push new forms.NumberQuestion(
  id: "q6a"
  model: model
  prompt: "Enter a dollar amount"
  prefix: "$"
  decimal: true
)

questions.push new forms.DropdownQuestion(
  id: "q1"
  model: model
  prompt: "Select from the dropdown"
  options: [["PipedWater", "Piped Water"], ["PipedWaterRes", "Piped Water with Service Reservoir"], ["GravityFedPiped", "Gravity-fed Piped Water"], ["BoreholeMech", "Deep Borehole with Mechanized Pumping"], ["BoreholeHand", "Deep Borehole with Handpump"], ["ProtectedSpring", "Protected Spring"], ["DugWellPump", "Dug Well with Handpump/windlass"], ["TreatmentPlant", "Water Treatment Plant"]]
)
questions.push new forms.RadioQuestion(
  id: "q8"
  model: model
  prompt: "Select from radio buttons"
  options: [[true, "Yes"], [false, "No"]]
)

questions.push new forms.CheckQuestion(
  id: "q9"
  model: model
  prompt: "Confirm a statement"
  text: "Checkbox statement"
)

questions.push new forms.MulticheckQuestion(
  id: "q10"
  model: model
  prompt: "Select multiple options"
  options: [[1, "Some option"], [2, "Another option"], [3, "Third option"]]
)

if forms.VariableTextsQuestion?
  questions.push new forms.VariableTextsQuestion
    id: "q13"
    model: model
    prompt: "Enter multiple text values"


if forms.UnitQuestion?
  questions.push new forms.UnitQuestion
    id: "q14"
    model: model
    prompt: "Enter length of object"
    units: [['ft', "Feet"], ['m', "Meters"], ['yd', "Yards"]]
    defaultUnit: 'm'


questions.push new forms.GPSQuestion
  id: 'q11'
  model: model
  prompt: "Enter your current location"
  ctx: options.ctx

questions.push new forms.ImageQuestion
  id: 'photo'
  model: model
  prompt: "Take one photo"
  ctx: options.ctx

questions.push new forms.ImagesQuestion
  id: 'photos'
  model: model
  prompt: "Take multiple photos"
  ctx: options.ctx
  
sections.push new forms.Section(
  model: model
  title: "Basic Controls"
  contents: questions
)
questions = []

questions.push new forms.RadioQuestion(
  id: "q30"
  model: model
  required: true
  prompt: "Mandatory Question 1"
  options: [[true, "Yes"], [false, "No"]]
)
questions.push new forms.RadioQuestion(
  id: "q31"
  model: model
  required: true
  prompt: "Mandatory Question 2"
  options: [[true, "Yes"], [false, "No"]]
)
sections.push new forms.Section(
  model: model
  title: "Required Questions"
  contents: questions
)
questions = []

questions.push new forms.RadioQuestion(
  id: "q20"
  model: model
  prompt: "Select to see conditional question"
  options: [[1, "Option A"], [2, "Option B"]]
)

questions.push new forms.TextQuestion(
  id: "q41"
  model: model
  prompt: "Enter a text value for option A"
  conditional: (m) ->
    m.get("q20") == 1
)

questions.push new forms.TextQuestion(
  id: "q42"
  model: model
  prompt: "Enter a different text value for option B"
  conditional: (m) ->
    m.get("q20") == 2
)

sections.push new forms.Section(
  model: model
  title: "Conditional Questions"
  contents: questions
)


# END HERE
view = new forms.Sections(
  sections: sections
  model: model
)

return new forms.SurveyView
  model: model
  contents: [view]
