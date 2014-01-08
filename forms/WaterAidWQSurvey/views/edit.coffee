forms = require("forms")
model = new (Backbone.Model.extend(
  defaults:
    "nitrate_as": "NA"
    "microbial_test_type": "NA"
))()

sections = []
questions = []


# WaterAid Water Quality Survey

# Created from WaterQuality.xlsx provided by Mike Smith 12/20/2014
# PROPRIETARY - this survey is under development and should not be shared

# START SECTION: Water Point Information

questions.push new forms.SourceQuestion
  id: 'source'
  ctx: options.ctx
  model: model
  prompt: "mWater Source ID"


questions.push new forms.DateQuestion
  id: "date_install_or_rehab"
  model: model
  prompt: "Select a date"

questions.push new forms.RadioQuestion
  id: "new_or_rehab"
  model: model
  prompt: "This water point is:"
  options: [["New", "New"], ["Rehabilitated", "Rehabilitated"]]

questions.push new forms.RadioQuestion
  id: "originally_WaterAid"
  model: model
  prompt: "Was the water point originally implemented by WaterAid?"
  options: [[true, "Yes"], [false, "No"]]
  conditional: ->
    model.get("new_or_rehab") == "Rehabilitated"

questions.push new forms.TextQuestion
  id: "partner_name" 
  model: model
  prompt: "Partner name" 

questions.push new forms.TextQuestion
  id: "driller_or_rehab_contractor_name" 
  model: model
  prompt: "Name of driller or rehabilitating contractor" 

questions.push new forms.DropdownQuestion
  id: "management_arrangement"
  model: model
  prompt: "Management arrangement"
  options: [
    ["CommunityManaged", "Community Managed"]
    ["ExternalSupportLocalGovt", "External Support from Local Government"]
    ["PrivatelyManaged", "Privately Managed"]
  ]


sections.push new forms.Section
  model: model
  title: "Water Point Information"
  contents: questions
questions = []

# END SECTION: Water Point Information


# START SECTION: Water Testing Information

questions.push new forms.RadioQuestion
  id: "tested"
  model: model
  prompt: "Tested?"
  options: [[true, "Yes"], [false, "No"]]

questions.push new forms.TextQuestion
  id: "why_not_tested" 
  model: model
  prompt: "Please explain why the source was not tested" 
  conditional: ->
    model.get("tested") == false

questions.push new forms.DateQuestion
  id: "date_will_be_tested"
  model: model
  prompt: "Date that testing will be carried out"
  conditional: ->
    model.get("tested") == false

questions.push new forms.DateQuestion
  id: "date_tested"
  model: model
  prompt: "Date that testing was carried out"
  conditional: ->
    model.get("tested") == true

questions.push new forms.RadioQuestion
  id: "pump_lifting_device_installed_during_testing"
  model: model
  prompt: "Was pump/lifting device installed at time of water quality testing?"
  options: [["Yes", "Yes"], ["No", "No"], ["NA", "NA"]]
  conditional: ->
    model.get("tested") == true

questions.push new forms.TextQuestion
  id: "tested_by" 
  model: model
  prompt: "Tested by (if laboratory give name of laboratory" 
  conditional: ->
    model.get("tested") == true

questions.push new forms.RadioQuestion
  id: "results_held_in_CP_office"
  model: model
  prompt: "Copies of test results held on file in CP office?"
  options: [[true, "Yes"], [false, "No"]]
  conditional: ->
    model.get("tested") == true


sections.push new forms.Section
  model: model
  title: "Water Testing Information"
  contents: questions
questions = []

# END SECTION: Water Testing Information



# START SECTION: Water Test Data

questions.push new forms.Instructions
  text: "Note: these questions only appear if the water point was tested."
  conditional: ->
    model.get("tested") == false

questions.push new forms.Instructions
  text: "Basic Parameters"

questions.push new forms.NumberQuestion
  id: "pH"
  model: model
  decimal: true
  prompt: "pH"

questions.push new forms.NumberQuestion
  id: "elec_conductivity_uS_cm"
  model: model
  decimal: true
  prompt: "Electrical conductivity (uS/cm)"

questions.push new forms.NumberQuestion
  id: "turbidity_NTU"
  model: model
  decimal: true
  prompt: "Turbidity (NTU)"

questions.push new forms.Instructions
  text: "Microbiological Parameters"

questions.push new forms.RadioQuestion
  id: "microbial_test_type"
  model: model
  prompt: "Microbial test performed:"
  options: [["Ecoli", "E. coli"], ["TTC", "TTC"], ["NA","(Not tested)"]]

questions.push new forms.NumberQuestion
  id: "Ecoli_CFU_100ml"
  model: model
  decimal: true
  prompt: "E. coli (CFU / 100mL)"
  conditional: ->
    model.get("microbial_test_type") == "Ecoli"

questions.push new forms.NumberQuestion
  id: "TTC_CFU_100ml"
  model: model
  decimal: true
  prompt: "TTC (CFU / 100mL)"
  conditional: ->
    model.get("microbial_test_type") == "TTC"

questions.push new forms.RadioQuestion
  id: "microbial_test_site"
  model: model
  prompt: "Microbial test performed in:"
  options: [["field", "Field"], ["lab", "Laboratory"]]
  conditional: ->
    model.get("microbial_test_type") != "NA"

questions.push new forms.Instructions
  text: "Chemical Parameters"

questions.push new forms.RadioQuestion
  id: "nitrate_as"
  model: model
  prompt: "Nitrate test results reported as:"
  options: [["NO3", "Nitrate as NO3"], ["N", "Nitrate as N"], ["NA","(Not tested)"]]

questions.push new forms.NumberQuestion
  id: "Nitrate_as_NO3_mg_L"
  model: model
  decimal: true
  prompt: "Nitrate (mg-NO3 / L)"
  conditional: ->
    model.get("nitrate_as") == "NO3"

questions.push new forms.NumberQuestion
  id: "Nitrate_as_N_mg_L"
  model: model
  decimal: true
  prompt: "Nitrate (mg-N / L)"
  conditional: ->
    model.get("nitrate_as") == "N"

questions.push new forms.NumberQuestion
  id: "arsenic"
  model: model
  decimal: true
  prompt: "Arsenic (As) (mg/L)"

questions.push new forms.NumberQuestion
  id: "fluoride"
  model: model
  decimal: true
  prompt: "Fluoride (Fl) (mg/L)"

questions.push new forms.NumberQuestion
  id: "iron"
  model: model
  decimal: true
  prompt: "Iron (Fe) (mg/L)"

questions.push new forms.NumberQuestion
  id: "manganese"
  model: model
  decimal: true
  prompt: "Manganese (Mn) (mg/L)"

questions.push new forms.NumberQuestion
  id: "sodium"
  model: model
  decimal: true
  prompt: "Sodium (Na) (mg/L)"

questions.push new forms.NumberQuestion
  id: "chloride"
  model: model
  decimal: true
  prompt: "Chloride (Cl-) (mg/L)"

questions.push new forms.NumberQuestion
  id: "sulphate"
  model: model
  decimal: true
  prompt: "Sulphate (SO2-4) (mg/L)"

questions.push new forms.TextQuestion
  id: "name_other_contaminants_tested" 
  model: model
  prompt: "Please list any other high risk contaminants tested" 

questions.push new forms.TextQuestion
  id: "result_other_contaminants_tested" 
  model: model
  prompt: "Results from other high risk contaminants tested" 

questions.push new forms.RadioQuestion
  id: "inorganics_test_site"
  model: model
  prompt: "Inorganic contaminant testing performed in:"
  options: [["field", "Field"], ["lab", "Laboratory"], ["NA", "(Not tested)"]]

sections.push new forms.Section
  model: model
  title: "Water Test Data"
  contents: questions
  conditional: ->
    model.get("tested") == true
questions = []

# END SECTION: Water Test Data

# START SECTION: Water Test Follow-up

questions.push new forms.RadioQuestion
  id: "all_within_national_limits"
  model: model
  prompt: "Are all contaminants within the national limit?"
  options: [[true, "Yes (potable)"], [false, "No"]]

questions.push new forms.TextQuestion
  id: "follow_up_action_WQ" 
  model: model
  prompt: "What follow up action was taken to address the water quality problem identified?" 
  multiline: true
  conditional: ->
    model.get("all_within_national_limits") == false

questions.push new forms.TextQuestion
  id: "follow_up_action_assigned_to_WQ" 
  model: model
  prompt: "Please name the individual responsible for taking action to address the water quality problem" 
  conditional: ->
    model.get("all_within_national_limits") == false

questions.push new forms.TextQuestion
  id: "how_users_informed_WQ" 
  model: model
  prompt: "Please provide details of how users were informed that the water is not potable" 
  multiline: true
  conditional: ->
    model.get("all_within_national_limits") == false


sections.push new forms.Section
  model: model
  title: "Water Test Follow-up"
  contents: questions
  conditional: ->
    model.get("tested") == true
questions = []

# END SECTION: Water Test Follow-up


# END HERE ENTIRE SURVEY
view = new forms.Sections
  sections: sections
  model: model

return new forms.SurveyView
  model: model
  contents: [view]
