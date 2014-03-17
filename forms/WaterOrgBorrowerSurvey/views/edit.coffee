forms = require("forms")
model = new Backbone.Model()

sections = []
questions = []


# Water.org Borrower Survey

# Created from 2013-11-27 Borrower Survey-HH Device Data Collection_27NOV13.xlsx
# PROPRIETARY - this survey is under development and should not be shared

# START SECTION: Introduction and informed consent

questions.push new forms.Instructions
  text: "My name is ______ and I am working with Water.org, a non-governmental organization from the United States, and we are conducting a study of loans issued by [name of partner organization] for water and sanitation."


questions.push new forms.RadioQuestion
  id: "loan_taken"
  model: model
  prompt: "Have you taken a loan with [name of partner organization]?"
  options: [[true, "Yes"], [false, "No"]]

questions.push new forms.RadioQuestion
  id: "head_of_HH"
  model: model
  prompt: "Are you the head of the household?"
  options: [[true, "Yes"], [false, "No"]]

questions.push new forms.Instructions
  text: "We would like to ask you to participate in our study. The information you give us will be kept confidential, and we will not share it with anyone outside of Water.org without your permission."

questions.push new forms.Instructions
  text: "The purpose of this study is to better understand the effects of our partnership with [name of partner organization] and to make improvements in future programs. We would like to talk with you about your experiences with your loan."

questions.push new forms.Instructions
  text: "We will ask you some questions and mark the answers down on a questionnaire form.  This will take about 15-20 minutes."

questions.push new forms.Instructions
  text: "We have spoken with [name of organization] and they are happy to speak to you about this study at any time."

questions.push new forms.TextQuestion
  id: "study_questions" 
  model: model
  prompt: "Do you have any questions about this study? (make note of and answer any questions)"

questions.push new forms.RadioQuestion
  id: "consent_given"
  model: model
  prompt: "Are you willing to participate in our study?"
  options: [[true, "Yes"], [false, "No"]]
  validate: ->
    if model.get("consent_given") != true
      return "Consent required"
    return null

sections.push new forms.Section
  model: model
  title: "Introduction and informed consent"
  contents: questions
questions = []

# END SECTION: Introduction and informed consent

# START SECTION: Basic information

questions.push new forms.TextQuestion
  id: "WO_partner_org" 
  model: model
  prompt: "Name of partner organization" 

questions.push new forms.TextQuestion
  id: "WO_program_no" 
  model: model
  prompt: "Program Number"

questions.push new forms.TextQuestion
  id: "community_name" 
  model: model
  prompt: "Community Name"


questions.push new forms.DropdownQuestion
  id: "community_type"
  model: model
  prompt: "Community Type"
  options: [
    ["rural", "Rural"]
    ["urban", "Urban"]
    ["periurban", "Peri-urban"]
  ]

questions.push new forms.TextQuestion
  id: "district_name" 
  model: model
  prompt: "District name"

questions.push new forms.TextQuestion
  id: "state_name" 
  model: model
  prompt: "State Name"

questions.push new forms.TextQuestion
  id: "borrower_name" 
  model: model
  prompt: "Borrower Name"

questions.push new forms.TextQuestion
  id: "respondent_name" 
  model: model
  prompt: "Survey Respondent Name"

questions.push new forms.CompositeQuestion
  id: "loan_category"
  model: model
  prompt: "Loan Category"
  createContents: (submodel) ->
    [
      new forms.DropdownQuestion
        id: "value"
        model: submodel
        style: "tabular"
        options: [["SHG", "SHG"],["JLG", "JLG"],["Individual", "Individual"],["CBO", "CBO"],["other", "Other"]]
      new forms.TextQuestion
        id: "other"
        model: submodel
        style: "tabular"
        prompt: "Please Specify: "
        conditional: ->
          submodel.get("value") == "other"
    ]

questions.push new forms.GPSQuestion
  id: "location"
  model: model
  prompt: "Set your current location"

questions.push new forms.TextQuestion
  id: "interviewer_name" 
  model: model
  prompt: "Interviewer Name"

questions.push new forms.DateQuestion
  id: "date"
  model: model
  prompt: "Date"

questions.push new forms.TextQuestion
  id: "comments_basic" 
  model: model
  prompt: "Comments"
  multiline: true

sections.push new forms.Section
  model: model
  title: "Basic Information"
  contents: questions
questions = []

# END SECTION: Basic Information


# START SECTION Borrower profile

questions.push new forms.RadioQuestion
  id: "gender"
  model: model
  prompt: "Gender"
  options: [["male", "Male"], ["female", "Female"]]

questions.push new forms.NumberQuestion
  id: "age"
  model: model
  prompt: "Age"

questions.push new forms.DropdownQuestion
  id: "marital_status"
  model: model
  prompt: "Marital Status"
  options: [
    ["Single", "Single"]
    ["Married", "Married"]
    ["Widowed", "Widowed"]
    ["Divorced", "Divorced"]
  ]

questions.push new forms.CompositeQuestion
  id: "household_ages"
  model: model
  prompt: "Including yourself, how many of the following live in your household?"
  createContents: (submodel) ->
    [
      new forms.NumberQuestion
        id: "adult_females"
        model: submodel
        prompt: "Adult Female (18 and older)"
        style: "tabular"
      new forms.NumberQuestion
        id: "girls"
        model: submodel
        prompt: "Girls (under 18)"
        style: "tabular"
      new forms.NumberQuestion
        id: "adult_males"
        model: submodel
        prompt: "Adult Male (18 and older)"
        style: "tabular"
      new forms.NumberQuestion
        id: "boys"
        model: submodel
        prompt: "Boys (under 18)"
        style: "tabular"
    ]


questions.push new forms.NumberQuestion
  id: "number_using_loan"
  model: model
  prompt: "Number of people using the loan product"

questions.push new forms.RadioQuestion
  id: "is_first_loan"
  model: model
  prompt: "Is this your first loan with partner organization"
  options: [["yes", "Yes"], ["no", "No"], ["dontknow", "I don't know"]]

questions.push new forms.NumberQuestion
  id: "number_previous_loans"
  model: model
  prompt: "How many previous loans have you taken?"
  conditional: ->
    model.get("is_first_loan") == "no"

questions.push new forms.NumberQuestion
  id: "year_first_loan"
  model: model
  prompt: "What was the year of the first loan you took out with the Partner organization?"
  conditional: ->
    model.get("is_first_loan") == "no"
  validate: ->
    val = model.get("year_first_loan")
    if val?
      if val < 1800 or val > 2050
        return "Valid year required"
    return null

questions.push new forms.TextQuestion
  id: "comments_borrower_profile" 
  model: model
  prompt: "Comments"
  multiline: true

sections.push new forms.Section
  model: model
  title: "Borrower Profile"
  contents: questions
questions = []

# END SECTION: Borrower profile


# START SECTION General questions


questions.push new forms.CompositeQuestion
  id: "loan_purpose"
  model: model
  prompt: "For what purpose did you take this loan?"
  createContents: (submodel) ->
    [
      new forms.DropdownQuestion
        id: "value"
        model: submodel
        style: "tabular"
        options: [
          ["WaterConnection", "Water Connection"]
          ["Toilet", "Toilet"]
          ["WaterAndSanitation", "Water and Sanitation"]
          ["other", "Other"]
        ]
      new forms.TextQuestion
        id: "other"
        model: submodel
        style: "tabular"
        prompt: "Please Specify: "
        conditional: ->
          submodel.get("value") == "other"
    ]


questions.push new forms.TextQuestion
  id: "why_this_product" 
  model: model
  prompt: "Why did you construct this product?" 

questions.push new forms.CompositeQuestion
  id: "who_made_loan_decision"
  model: model
  prompt: "Who in your family made the final decision to take out a loan for the construction of your water or sanitation product?"
  createContents: (submodel) ->
    [
      new forms.MulticheckQuestion
        id: "values"
        model: submodel
        style: "tabular"
        options: [
          ["myself", "Myself"]
          ["husband", "Husband"]
          ["wife", "Wife"]
          ["child", "Child"]
          ["parent", "Parent"]
          ["in-laws", "In-laws"]
          ["otherFamily", "Other family members"]
          ["friends", "Friends"]
          ["partnerOrg", "Partner organization"]
          ["other", "Other"]

        ]
      new forms.TextQuestion
        id: "other"
        model: submodel
        style: "tabular"
        prompt: "Please Specify: "
        conditional: ->
          "other" in (submodel.get("values") or [])
    ]

questions.push new forms.RadioQuestion
  id: "how_easy_get_loan"
  model: model
  prompt: "How easy was it for you to get a water or sanitation loan?"
  options: [["veryEasy", "Very Easy"], ["somewhatEasy", "Somewhat Easy"], ["notVeryEasy", "Not Very Easy"], ["difficult","Difficult"]] 


# !!! Could make the above question ordered -- i.e. 1 2 3 4 but they would not nec know which end is easy/hard. 
# !!! R has a way of dealing with this where the order is a separate attribute


questions.push new forms.CompositeQuestion
  id: "loan_orig_date"
  model: model
  prompt: "When did you take out the loan?"
  createContents: (submodel) ->
    [
      new forms.DateQuestion
        id: "value"
        model: submodel
        style: "tabular"
        conditional: ->
          not submodel.get("dontknow")
      new forms.CheckQuestion
        id: "dontknow"
        model: submodel
        text: "Don't know"
        style: "tabular"
    ]


questions.push new forms.CompositeQuestion
  id: "loan_value"
  model: model
  prompt: "What was the total value of your loan?"
  createContents: (submodel) ->
    [
      new forms.UnitQuestion
        id: "value"
        model: submodel
        units: [["USD", "USD"], ["INR", "INR"]]
        defaultUnit: "USD"
        prefix: true
        conditional: ->
          not submodel.get("dontknow")
      new forms.CheckQuestion
        id: "dontknow"
        model: submodel
        text: "Don't know"
        style: "tabular"
    ]


questions.push new forms.CompositeQuestion
  id: "interest_rate"
  model: model
  prompt: "What is the interest rate on your loan? (%)"
  createContents: (submodel) ->
    [
      new forms.NumberQuestion
        id: "value"
        model: submodel
        style: "tabular"
        decimal: true
        conditional: ->
          not submodel.get("dontknow")
      new forms.CheckQuestion
        id: "dontknow"
        model: submodel
        text: "Don't know"
        style: "tabular"
    ]


questions.push new forms.RadioQuestion
  id: "still_making_payments"
  model: model
  prompt: "Are you still making loan payments"
  options: [["yes", "Yes"], ["no", "No"], ["dontknow", "I don't know"]]

questions.push new forms.RadioQuestion
  id: "payment_frequency"
  model: model
  prompt: "How frequently do you make loan payments?"
  options: [["daily", "Daily"], ["weekly", "Weekly"], ["biweekly", "Bi-weekly"], ["monthly", "Monthly"], ["semiannual", "Semi-annual"], ["dontknow", "I don't know"]]
  conditional: ->
    model.get("still_making_payments") == "yes"


questions.push new forms.CompositeQuestion
  id: "total_loan_payment"
  model: model
  prompt: "How much is your total loan payment? (note to interviewer: includes P+I)"
  createContents: (submodel) ->
    [
      new forms.UnitQuestion
        id: "value"
        model: submodel
        style: "tabular"
        units: [["USD", "USD"], ["INR", "INR"]]
        defaultUnit: "USD"
        prefix: true
        conditional: ->
          not submodel.get("dontknow")
      new forms.CheckQuestion
        id: "dontknow"
        model: submodel
        text: "Don't know"
        style: "tabular"
    ]

# !!! Would be nice to have a Money-type question with a currency selector box in front of the numeric

questions.push new forms.CompositeQuestion
  id: "total_cost_product"
  model: model
  prompt: "What was the total cost of the product?"
  createContents: (submodel) ->
    [
      new forms.UnitQuestion
        id: "value"
        model: submodel
        units: [["USD", "USD"], ["INR", "INR"]]
        defaultUnit: "USD"
        prefix: true
        conditional: ->
          not submodel.get("dontknow")
      new forms.CheckQuestion
        id: "dontknow"
        model: submodel
        text: "Don't know"
        style: "tabular"
    ]

questions.push new forms.RadioQuestion
  id: "cover_construct_cost"
  model: model
  prompt: "Did the loan cover the entire cost of construction?"
  options: [["yes", "Yes"], ["no", "No"], ["dontknow", "I don't know"]]

questions.push new forms.NumberQuestion
  id: "paid_above_loan_amt"
  model: model
  prompt: "How much more did you pay above the loan amount?"
  decimal: true
  conditional: ->
    model.get("cover_construct_cost") == "no"


questions.push new forms.CompositeQuestion
  id: "how_paid_above_loan_amt"
  model: model
  prompt: "How did you pay for the additional amount?"
  createContents: (submodel) ->
    [
      new forms.MulticheckQuestion
        id: "values"
        model: submodel
        style: "tabular"
        options: [
          ["currentIncome", "Current income"]
          ["savings", "Savings"]
          ["additionalWork", "Took on additional work"]
          ["borrowedRelativeFriend", "Borrowed from relative/friend"]
          ["moneyLender", "Money Lender"]
          ["addlFormalLoan", "Additional formal loan"]
          ["other", "Other"]
        ]
      new forms.TextQuestion
        id: "other"
        model: submodel
        style: "tabular"
        prompt: "Please Specify: "
        conditional: ->
          "other" in (submodel.get("values") or [])
    ]
  conditional: ->
    model.get("cover_construct_cost") == "no"


questions.push new forms.RadioQuestion
  id: "has_income"
  model: model
  prompt: "Do you have a source of income?"
  options: [["yes", "Yes"], ["no", "No"], ["dontknow", "I don't know"]]


questions.push new forms.TextQuestion
  id: "occupation" 
  model: model
  prompt: "What is your occupation?"
  conditional: ->
    model.get("has_income") == "yes"

# !!! Not sure this is quite what they are asking for here
# !!! note says, "Multiple Textboxes, Alt. approach would be to list standard industries in India and change question type to MC (multiple answers)"
# !!! We don't have a mult text boxes, but in any case, a checklist with typical occupations plus Other would be better


questions.push new forms.RadioQuestion
  id: "spouse_has_income"
  model: model
  prompt: "Does your spouse have a source of income?"
  options: [["yes", "Yes"], ["no", "No"], ["dontknow", "I don't know"]]

questions.push new forms.TextQuestion
  id: "spouse_occupation" 
  model: model
  prompt: "What is your spouse's occupation?"
  conditional: ->
    model.get("spouse_has_income") == "yes"

questions.push new forms.UnitQuestion
  id: "total_monthly_income"
  model: model
  decimal: true
  prompt: "Total amount of monthly income?"
  units: [["USD", "USD"], ["INR", "INR"]]
  defaultUnit: "USD"
  prefix: true


questions.push new forms.CompositeQuestion
  id: "who_earns_income_for_loan"
  model: model
  prompt: "Who earns the income in your family from which the loan is paid?"
  createContents: (submodel) ->
    [
      new forms.MulticheckQuestion
        id: "values"
        model: submodel
        style: "tabular"
        options: [
          ["myself", "Myself"]
          ["husband", "Husband"]
          ["wife", "Wife"]
          ["child", "Child"]
          ["parent", "Parent"]
          ["in-laws", "In-laws"]
          ["otherFamily", "Other family members"]
          ["friends", "Friends"]
          ["dontknow", "I don't know"]
          ["other", "Other"]

        ]
      new forms.TextQuestion
        id: "other"
        model: submodel
        style: "tabular"
        prompt: "Please Specify: "
        conditional: ->
          "other" in (submodel.get("values") or [])
    ]

questions.push new forms.CompositeQuestion
  id: "who_manages_income"
  model: model
  prompt: "Who is responsible for managing your household's income?"
  createContents: (submodel) ->
    [
      new forms.MulticheckQuestion
        id: "values"
        model: submodel
        style: "tabular"
        options: [
          ["myself", "Myself"]
          ["husband", "Husband"]
          ["wife", "Wife"]
          ["child", "Child"]
          ["parent", "Parent"]
          ["in-laws", "In-laws"]
          ["otherFamily", "Other family members"]
          ["friends", "Friends"]
          ["dontknow", "I don't know"]
          ["other", "Other"]

        ]
      new forms.TextQuestion
        id: "other"
        model: submodel
        style: "tabular"
        prompt: "Please Specify: "
        conditional: ->
          "other" in (submodel.get("values") or [])
    ]

questions.push new forms.CompositeQuestion
  id: "who_manages_WASH_loan"
  model: model
  prompt: "Who manages the WASH loan in your family?"
  createContents: (submodel) ->
    [
      new forms.MulticheckQuestion
        id: "values"
        model: submodel
        style: "tabular"
        options: [
          ["myself", "Myself"]
          ["husband", "Husband"]
          ["wife", "Wife"]
          ["child", "Child"]
          ["parent", "Parent"]
          ["in-laws", "In-laws"]
          ["otherFamily", "Other family members"]
          ["friends", "Friends"]
          ["dontknow", "I don't know"]
          ["other", "Other"]

        ]
      new forms.TextQuestion
        id: "other"
        model: submodel
        style: "tabular"
        prompt: "Please Specify: "
        conditional: ->
          "other" in (submodel.get("values") or [])
    ]

questions.push new forms.CompositeQuestion
  id: "who_owns_property"
  model: model
  prompt: "Who legally owns the property on which the improvement is or will be located?"
  createContents: (submodel) ->
    [
      new forms.MulticheckQuestion
        id: "values"
        model: submodel
        style: "tabular"
        options: [
          ["myself", "Myself"]
          ["husband", "Husband"]
          ["wife", "Wife"]
          ["child", "Child"]
          ["parent", "Parent"]
          ["in-laws", "In-laws"]
          ["otherFamily", "Other family members"]
          ["friends", "Friends"]
          ["dontknow", "I don't know"]
          ["other", "Other"]

        ]
      new forms.TextQuestion
        id: "other"
        model: submodel
        style: "tabular"
        prompt: "Please Specify: "
        conditional: ->
          "other" in (submodel.get("values") or [])
    ]


questions.push new forms.RadioQuestion
  id: "construction_completed"
  model: model
  prompt: "Has the construction of the product been completed?"
  options: [["yes", "Yes"], ["no", "No"], ["dontknow", "I don't know"]]


questions.push new forms.CompositeQuestion
  id: "who_constructed"
  model: model
  prompt: "Who constructed the product?"
  createContents: (submodel) ->
    [
      new forms.MulticheckQuestion
        id: "values"
        model: submodel
        style: "tabular"
        options: [
          ["constructionWorker", "Construction worker"]
          ["utility", "Utility"]
          ["myself", "Myself"]
          ["husband", "Husband"]
          ["wife", "Wife"]
          ["child", "Child"]
          ["parent", "Parent"]
          ["in-laws", "In-laws"]
          ["otherFamily", "Other family members"]
          ["friends", "Friends"]
          ["partnerOrg", "Partner organization"]
          ["other", "Other"]
        ]
      new forms.TextQuestion
        id: "other"
        model: submodel
        style: "tabular"
        prompt: "Please Specify: "
        conditional: ->
          "other" in (submodel.get("values") or [])
    ]


questions.push new forms.CompositeQuestion
  id: "who_oversees_construction"
  model: model
  prompt: "Who in your household was responsible for overseeing the construction of the product?"
  createContents: (submodel) ->
    [
      new forms.MulticheckQuestion
        id: "values"
        model: submodel
        style: "tabular"
        options: [
          ["constructionWorker", "Construction worker"]
          ["utility", "Utility"]
          ["myself", "Myself"]
          ["husband", "Husband"]
          ["wife", "Wife"]
          ["child", "Child"]
          ["parent", "Parent"]
          ["in-laws", "In-laws"]
          ["otherFamily", "Other family members"]
          ["friends", "Friends"]
          ["partnerOrg", "Partner organization"]
          ["other", "Other"]
        ]
      new forms.TextQuestion
        id: "other"
        model: submodel
        style: "tabular"
        prompt: "Please Specify: "
        conditional: ->
          "other" in (submodel.get("values") or [])
    ]


questions.push new forms.RadioQuestion
  id: "received_technical_assistance"
  model: model
  prompt: "Did your family receive any technical assistance prior to or during the construction of the product?"
  options: [["yes", "Yes"], ["no", "No"], ["dontknow", "I don't know"]]


questions.push new forms.CompositeQuestion
  id: "source_technical_assistance"
  model: model
  prompt: "Who provided technical assistance?"
  createContents: (submodel) ->
    [
      new forms.MulticheckQuestion
        id: "values"
        model: submodel
        style: "tabular"
        options: [
          ["constructionWorker", "Construction Worker"]
          ["utility", "Utility"]
          ["FamilyMembers", "Family members"]
          ["friends", "Friends"]
          ["partnerOrg", "Partner organization"]
          ["other", "Other"]
        ]
      new forms.TextQuestion
        id: "other"
        model: submodel
        style: "tabular"
        prompt: "Please Specify: "
        conditional: ->
          "other" in (submodel.get("values") or [])
    ]
  conditional: ->
    model.get("received_technical_assistance") == "yes"


questions.push new forms.CompositeQuestion
  id: "date_began_using"
  model: model
  prompt: "When did the household begin using the product?"
  createContents: (submodel) ->
    [
      new forms.DateQuestion
        id: "value"
        model: submodel
        style: "tabular"
        conditional: ->
          not submodel.get("dontknow")
      new forms.CheckQuestion
        id: "dontknow"
        model: submodel
        text: "Don't know"
        style: "tabular"
    ]
  conditional: ->
    model.get("construction_completed") == "yes"


questions.push new forms.RadioQuestion
  id: "product_functioning"
  model: model
  prompt: "Is the product functioning?"
  options: [["yes", "Yes"], ["no", "No"], ["dontknow", "I don't know"]]
  conditional: ->
    model.get("construction_completed") == "yes"




questions.push new forms.CompositeQuestion
  id: "needed_to_function"
  model: model
  prompt: "What is needed for it to function?"
  createContents: (submodel) ->
    [
      new forms.MulticheckQuestion
        id: "values"
        model: submodel
        style: "tabular"
        options: [
          ["moreMoney", "More money"]
          ["technicalSupport", "Technical support"]
          ["constructionWorkers", "Construction workers"]
          ["other", "Other"]
        ]
      new forms.TextQuestion
        id: "other"
        model: submodel
        style: "tabular"
        prompt: "Please Specify: "
        conditional: ->
          "other" in (submodel.get("values") or [])
    ]
  conditional: ->
    model.get("product_functioning") == "no"


questions.push new forms.CompositeQuestion
  id: "date_to_return_to_functioning"
  model: model
  prompt: "When will this be completed?"
  createContents: (submodel) ->
    [
      new forms.DateQuestion
        id: "value"
        model: submodel
        style: "tabular"
        conditional: ->
          not submodel.get("dontknow")
      new forms.CheckQuestion
        id: "dontknow"
        model: submodel
        text: "Don't know"
        style: "tabular"
    ]
  conditional: ->
    model.get("product_functioning") == "no"

questions.push new forms.RadioQuestion
  id: "satisfied_with_product"
  model: model
  prompt: "Are you satisfied with the product?"
  options: [["yes", "Yes"], ["no", "No"], ["dontknow", "I don't know"]]
  conditional: ->
    model.get("construction_completed") == "yes"

questions.push new forms.TextQuestion
  id: "why_not_satisfied" 
  model: model
  prompt: "Why are you not satisfied with the product?" 
  conditional: ->
    model.get("satisfied_with_product") == "no"



questions.push new forms.RadioQuestion
  id: "recommend_product"
  model: model
  prompt: "Would you recommend the product to others?"
  options: [["yes", "Yes"], ["no", "No"], ["dontknow", "I don't know"]]
  conditional: ->
    model.get("construction_completed") == "yes"

questions.push new forms.TextQuestion
  id: "why_recommend_product" 
  model: model
  prompt: "Why?" 


questions.push new forms.CompositeQuestion
  id: "activities_prior_to_loan"
  model: model
  prompt: "What activities were you involved in through the partner before you decided to take out a loan?"
  createContents: (submodel) ->
    [
      new forms.MulticheckQuestion
        id: "values"
        model: submodel
        style: "tabular"
        options: [
          ["borrowerMeetings", "Borrower meetings"]
          ["communityMeetings", "Community meetings"]
          ["governmentMeetings", "Government meetings"]
          ["technicalTraining", "Technical training"]
          ["education", "Education"]
          ["other", "Other"]
        ]
      new forms.TextQuestion
        id: "other"
        model: submodel
        style: "tabular"
        prompt: "Please Specify: "
        conditional: ->
          "other" in (submodel.get("values") or [])
    ]

questions.push new forms.CompositeQuestion
  id: "activities_prior_to_loan_most_helpful"
  model: model
  prompt: "Which of these activities were most helpful?"
  createContents: (submodel) ->
    [
      new forms.MulticheckQuestion
        id: "values"
        model: submodel
        style: "tabular"
        options: [
          ["borrowerMeetings", "Borrower meetings"]
          ["communityMeetings", "Community meetings"]
          ["governmentMeetings", "Government meetings"]
          ["technicalTraining", "Technical training"]
          ["education", "Education"]
          ["other", "Other"]
        ]
      new forms.TextQuestion
        id: "other"
        model: submodel
        style: "tabular"
        prompt: "Please Specify: "
        conditional: ->
          "other" in (submodel.get("values") or [])
    ]


questions.push new forms.Instructions
  text: "The rest of this section is for staff only. Staff instructions: Ask to see the passbook, repayment receipts, signed loan agreement, or letter of offer and note the following:"

questions.push new forms.RadioQuestion
  id: "borrower_info_matches_partner"
  model: model
  prompt: "Does the information provided by the borrower match the partner MIS?"
  options: [["yes", "Yes"], ["no", "No"]]

questions.push new forms.NumberQuestion
  id: "documented_interest_rate"
  model: model
  decimal: true
  prompt: "What is the interest rate? (%)"

questions.push new forms.RadioQuestion
  id: "payment_info_up_to_date"
  model: model
  prompt: "Is the payment information up to date?"
  options: [["yes", "Yes"], ["no", "No"]]

questions.push new forms.TextQuestion
  id: "comments_general_questions" 
  model: model
  prompt: "Comments"
  multiline: true

sections.push new forms.Section
  model: model
  title: "General questions"
  contents: questions
questions = []

# END SECTION: General questions


# START SECTION: Questions for water loans


questions.push new forms.RadioQuestion
  id: "is_water_loan"
  model: model
  prompt: "Is the loan for a water project?"
  options: [["yes", "Yes"], ["no", "No"]]


questions.push new forms.CompositeQuestion
  id: "who_collects_water"
  model: model
  prompt: "Who manages the WASH loan in your family?"
  createContents: (submodel) ->
    [
      new forms.MulticheckQuestion
        id: "values"
        model: submodel
        style: "tabular"
        options: [
          ["myself", "Myself"]
          ["husband", "Husband"]
          ["wife", "Wife"]
          ["daughter", "Daughter"]
          ["son", "Son"]
          ["mother", "Mother"]
          ["father", "Father"]
          ["in-laws", "In-laws"]
          ["otherFamily", "Other family members"]
          ["friends", "Friends"]
          ["dontknow", "I don't know"]
          ["other", "Other"]

        ]
      new forms.TextQuestion
        id: "other"
        model: submodel
        style: "tabular"
        prompt: "Please Specify: "
        conditional: ->
          "other" in (submodel.get("values") or [])
    ]
  conditional: ->
    model.get("is_water_loan") == "yes"


questions.push new forms.RadioQuestion
  id: "water_collected_before_project"
  model: model
  prompt: "Approximately how much water were you able to collect per day for the household before the construction of your product?"
  options: [["0to5", "Less than 5 liters"], ["5to10", "5 - 10 liters"], ["11to20","11 - 20 liters"], ["21to50", "21 - 50 liters"],["moreThan50", "More than 50 liters"], ["dontknow", "I don't know"]]
  conditional: ->
    model.get("is_water_loan") == "yes"


questions.push new forms.RadioQuestion
  id: "water_collected_now"
  model: model
  prompt: "Approximately how much water are you able to collect per day for the household now?"
  options: [["0to5", "Less than 5 liters"], ["5to10", "5 - 10 liters"], ["11to20","11 - 20 liters"], ["21to50", "21 - 50 liters"],["moreThan50", "More than 50 liters"], ["dontknow", "I don't know"]]
  conditional: ->
    model.get("construction_completed") == "yes" and model.get("is_water_loan") == "yes"

# !!! We are asking questions about water now only if the new project is complete.. 
# !!! Might consider asking the previous question only if construction is complete



questions.push new forms.RadioQuestion
  id: "water_distance_before_project"
  model: model
  prompt: "Approximately how far away is the water source that was used before the new water improvement?"
  options: [["0to1", "Less than 1 kilometer"], ["1to3", "1 - 3 kilometers"], ["3orMore","More than 3 kilometers"], ["dontknow", "I don't know"]]
  conditional: ->
    model.get("is_water_loan") == "yes"


questions.push new forms.RadioQuestion
  id: "water_distance_now"
  model: model
  prompt: "Approximately how far away is your water source now?"
  options: [["0to1", "Less than 1 kilometer"], ["1to3", "1 - 3 kilometers"], ["3orMore","More than 3 kilometers"], ["dontknow", "I don't know"]]
  conditional: ->
    model.get("construction_completed") == "yes" and model.get("is_water_loan") == "yes"



questions.push new forms.RadioQuestion
  id: "water_collect_time_before_project"
  model: model
  prompt: "Approximately how much time did it take to collect water before?"
  options: [["0to30", "Less than 30 minutes"], ["30to60", "30 - 60 minutes"], ["60to120","1 - 2 hours"], ["120orMore", "More than 2 hours"], ["dontknow", "I don't know"]]
  conditional: ->
    model.get("is_water_loan") == "yes"


questions.push new forms.RadioQuestion
  id: "water_collect_time_now"
  model: model
  prompt: "How much time does it take now?"
  options: [["0to30", "Less than 30 minutes"], ["30to60", "30 - 60 minutes"], ["60to120","1 - 2 hours"], ["120orMore", "More than 2 hours"], ["dontknow", "I don't know"]]
  conditional: ->
    model.get("construction_completed") == "yes" and model.get("is_water_loan") == "yes"


questions.push new forms.RadioQuestion
  id: "water_price_before_project"
  model: model
  prompt: "Approximately how much did you have to pay for water before per day?"
  options: [["0", "0"], ["1orLessUSD", "Less than 1 USD"], ["1to3USD","1 - 3 USD"], ["4to5USD", "4 - 5 USD"], ["5orMoreUSD", "More than 5 USD"], ["dontknow", "I don't know"]]
  conditional: ->
    model.get("is_water_loan") == "yes"


questions.push new forms.RadioQuestion
  id: "water_price_now"
  model: model
  prompt: "How much do you pay now?"
  options: [["0", "0"], ["1orLessUSD", "Less than 1 USD"], ["1to3USD","1 - 3 USD"], ["4to5USD", "4 - 5 USD"], ["5orMoreUSD", "More than 5 USD"], ["dontknow", "I don't know"]]
  conditional: ->
    model.get("construction_completed") == "yes" and model.get("is_water_loan") == "yes"


questions.push new forms.RadioQuestion
  id: "time_to_construct"
  model: model
  prompt: "How long did it take for your water product to be constructed?"
  options: [["1weekOrLess", "Less than a week"], ["4weekOrLess", "Less than a month"], ["12weekOrLess","Less than 3 months"], ["12weekOrMore", "Greater than 3 months"], ["dontknow", "I don't know"]]
  conditional: ->
    model.get("construction_completed") == "yes" and model.get("is_water_loan") == "yes"


questions.push new forms.RadioQuestion
  id: "construction_problems"
  model: model
  prompt: "Were there any problems with the construction?"
  options: [["yes", "Yes"], ["no", "No"], ["dontknow", "I don't know"]]
  conditional: ->
    model.get("construction_completed") == "yes" and model.get("is_water_loan") == "yes"

questions.push new forms.TextQuestion
  id: "construction_problems_description" 
  model: model
  prompt: "Please describe the problems" 
  conditional: ->
    model.get("construction_problems") == "yes" and model.get("is_water_loan") == "yes"


questions.push new forms.RadioQuestion
  id: "use_alt_sources"
  model: model
  prompt: "Do you ever use alternative sources for water?"
  options: [["yes", "Yes"], ["no", "No"], ["dontknow", "I don't know"]]
  conditional: ->
    model.get("construction_completed") == "yes" and model.get("is_water_loan") == "yes"


questions.push new forms.RadioQuestion
  id: "water_pressure_satisfactory"
  model: model
  prompt: "Are you satisfied with the water pressure?"
  options: [["yes", "Yes"], ["no", "No"], ["dontknow", "I don't know"]]
  conditional: ->
    model.get("construction_completed") == "yes" and model.get("is_water_loan") == "yes"

questions.push new forms.RadioQuestion
  id: "water_availability_satisfactory"
  model: model
  prompt: "Are you satisfied with the hours that water is available?"
  options: [["yes", "Yes"], ["no", "No"], ["dontknow", "I don't know"]]
  conditional: ->
    model.get("construction_completed") == "yes" and model.get("is_water_loan") == "yes"


questions.push new forms.RadioQuestion
  id: "water_quantity_satisfactory"
  model: model
  prompt: "Are you satisfied with the quantity of water you are receiving now?"
  options: [["yes", "Yes"], ["no", "No"], ["dontknow", "I don't know"]]
  conditional: ->
    model.get("construction_completed") == "yes" and model.get("is_water_loan") == "yes"

questions.push new forms.RadioQuestion
  id: "why_seek_other_water_sources"
  model: model
  prompt: "What typically causes you to seek out other water sources?"
  options: [["notEnough", "Don't get enough water from connection"], ["limitedTimes", "Water available for very limited times"], ["differentAgriculturalSource","Use a different source for agricultural purposes"]]
  conditional: ->
    model.get("use_alt_sources") == "yes"

# !!! Do we really not want other in the above question?


questions.push new forms.RadioQuestion
  id: "water_tested_treated"
  model: model
  prompt: "Do you know if your drinking water is tested and treated on a regular basis?"
  options: [["yes", "Yes"], ["no", "No"], ["dontknow", "I don't know"]]
  conditional: ->
    model.get("is_water_loan") == "yes" and model.get("is_water_loan") == "yes"

# !!! Recommend separating these into two different questions
# !!! Could use the standard DHS/MICS question for household treatment, which connects to JMP indicator
# !!! Also, question says "do you know" but also has "don't know" as a response


questions.push new forms.CompositeQuestion
  id: "water_quality_changes_since_project"
  model: model
  prompt: "Please state any changes you have noticed in the water since the completion of your new water product?"
  createContents: (submodel) ->
    [
      new forms.MulticheckQuestion
        id: "values"
        model: submodel
        style: "tabular"
        options: [
          ["betterQuality", "Better quality"]
          ["worseQuality", "Worse quality"]
          ["betterOdor", "Better odor"]
          ["worseOdor", "Worse odor"]
          ["betterTaste", "Better taste"]
          ["worseTaste", "Worse taste"]
          ["safer", "Safer"]
          ["notAsSafe", "Not as safe"]
          ["otherFamily", "Other family members"]
          ["other", "Other"]

        ]
      new forms.TextQuestion
        id: "other"
        model: submodel
        style: "tabular"
        prompt: "Please Specify: "
        conditional: ->
          "other" in (submodel.get("values") or [])
    ]
  conditional: ->
    model.get("construction_completed") == "yes" and model.get("is_water_loan") == "yes"

# !!! Might make this "noticed changes" y/n, then ask radio questions for each type of change?
# !!! Also, good to ask "why" for not as safe/safer



questions.push new forms.CompositeQuestion
  id: "health_before_water_project"
  model: model
  prompt: "What was the overall health of your family members before the new water product was completed?"
  createContents: (submodel) ->
    [
      new forms.RadioQuestion
        id: "value"
        model: submodel
        style: "tabular"
        options: [["rarelySick", "Rarely sick"], ["oftenSick", "Often sick"], ["sickAlltheTime", "Sick all the time"], ["other","Other"]]
      new forms.TextQuestion
        id: "other"
        model: submodel
        style: "tabular"
        prompt: "Please Specify: "
        conditional: ->
          submodel.get("value") == "other"
    ]
  conditional: ->
    model.get("is_water_loan") == "yes"


questions.push new forms.CompositeQuestion
  id: "health_after_water_project"
  model: model
  prompt: "What was is it like now?"
  createContents: (submodel) ->
    [
      new forms.RadioQuestion
        id: "value"
        model: submodel
        style: "tabular"
        options: [["rarelySick", "Rarely sick"], ["oftenSick", "Often sick"], ["sickAlltheTime", "Sick all the time"], ["other","Other"]]
      new forms.TextQuestion
        id: "other"
        model: submodel
        style: "tabular"
        prompt: "Please Specify: "
        conditional: ->
          submodel.get("value") == "other"
    ]
  conditional: ->
    model.get("construction_completed") == "yes" and model.get("is_water_loan") == "yes"


questions.push new forms.RadioQuestion
  id: "generating_income_from_water_source"
  model: model
  prompt: "Are you generating any income from your new water source?"
  options: [["yes", "Yes"], ["no", "No"], ["dontknow", "I don't know"]]
  conditional: ->
    model.get("construction_completed") == "yes" and model.get("is_water_loan") == "yes"



questions.push new forms.Instructions
  text: "Further Observations: Ask to see the water connection and note the following:"
  model: model
  conditional: ->
    model.get("construction_completed") == "yes" and model.get("is_water_loan") == "yes"

questions.push new forms.CompositeQuestion
  id: "type_water_project"
  model: model
  prompt: "What type of water improvement is it?"
  createContents: (submodel) ->
    [
      new forms.MulticheckQuestion
        id: "values"
        model: submodel
        style: "tabular"
        options: [
          ["householdConnection", "Household water connection"]
          ["rainwaterHarvesting", "Rain roof harvesting"]
          ["dugWellHandPump", "Hand dug well with hand pump"]
          ["boreholeHandPump", "Borehole with hand pump"]
          ["boreholeTank", "Borehole with overhead tank"]
          ["boreholeRechargeStructure", "Borehole recharge structure"]
          ["springCatchment", "Spring catchment"]
          ["kioskPrivate", "Kiosk - private vendor"]
          ["standpostPublic", "Public stand post"]
          ["waterFilter", "Water filter"]
          ["other", "Other"]

        ]
      new forms.TextQuestion
        id: "other"
        model: submodel
        style: "tabular"
        prompt: "Please Specify: "
        conditional: ->
          "other" in (submodel.get("values") or [])
    ]
  conditional: ->
    model.get("construction_completed") == "yes" and model.get("is_water_loan") == "yes"


questions.push new forms.RadioQuestion
  id: "observed_construction_completed"
  model: model
  prompt: "Is the water construction completed?"
  options: [["yes", "Yes"], ["no", "No"], ["dontknow", "I don't know"]]
  conditional: ->
    model.get("construction_completed") == "yes" and model.get("is_water_loan") == "yes"


questions.push new forms.RadioQuestion
  id: "observed_water_functional"
  model: model
  prompt: "Is it working?"
  options: [["yes", "Yes"], ["no", "No"], ["dontknow", "I don't know"]]
  conditional: ->
    model.get("construction_completed") == "yes" and model.get("is_water_loan") == "yes"


questions.push new forms.RadioQuestion
  id: "observed_good_repair"
  model: model
  prompt: "Is it in good repair?"
  options: [["yes", "Yes"], ["no", "No"], ["dontknow", "I don't know"]]
  conditional: ->
    model.get("construction_completed") == "yes" and model.get("is_water_loan") == "yes"


questions.push new forms.RadioQuestion
  id: "observed_clean_maintained"
  model: model
  prompt: "Is it clean and well maintained?"
  options: [["yes", "Yes"], ["no", "No"], ["dontknow", "I don't know"]]
  conditional: ->
    model.get("construction_completed") == "yes" and model.get("is_water_loan") == "yes"


questions.push new forms.TextQuestion
  id: "comments_water_loans" 
  model: model
  prompt: "Comments"
  multiline: true


sections.push new forms.Section
  model: model
  title: "Questions for water loans"
  contents: questions
  conditional: ->
    model.get("loan_purpose") and model.get("loan_purpose").value in ['WaterConnection', 'WaterAndSanitation']
questions = []

# END SECTION: Questions for water loans



# START SECTION: Questions for sanitation loans


questions.push new forms.RadioQuestion
  id: "is_sanitation_loan"
  model: model
  prompt: "Is the loan for a sanitation project?"
  options: [["yes", "Yes"], ["no", "No"]]



questions.push new forms.MulticheckQuestion
  id: "sanitation_facility_before_project"
  model: model
  prompt: "Where did you and your family members go for sanitation facilities before your toilet was constructed?"
  options: [
    ["roadside", "Roadside"]
    ["railwayTrack", "Railway track"]
    ["openDrain", "Open drain"]
    ["bushes", "Bushes"]
    ["agriculturalFields","Agricultural fields"]
    ["lakeRiver", "Lake / river"]
    ["seashore", "Seashore"]
    ["publicToilet", "Public toilet"]
    ["individualToilet", "Individual toilet"]
    ["sharedToilet", "Shared toilet"]
  ]
  conditional: ->
    model.get("is_sanitation_loan") == "yes"



questions.push new forms.RadioQuestion
  id: "sanitation_distance_before_project"
  model: model
  prompt: "Approximately how far did you have to go for sanitation purposes before? "
  options: [["halfKmOrLess", "Less than 0.5 kilometer"], ["halfToOne", "0.5 - 1 kilometer"], ["moreThan1", "More than 1 kilometer"], ["dontknow", "I don't know"]]
  conditional: ->
    model.get("is_sanitation_loan") == "yes"


questions.push new forms.RadioQuestion
  id: "sanitation_distance_after_project"
  model: model
  prompt: "How far do you have to go now?"
  options: [["halfKmOrLess", "Less than 0.5 kilometer"], ["halfToOne", "0.5 - 1 kilometer"], ["moreThan1", "More than 1 kilometer"], ["dontknow", "I don't know"]]
  conditional: ->
    model.get("is_sanitation_loan") == "yes" and model.get("construction_completed") == "yes"


questions.push new forms.RadioQuestion
  id: "paid_for_sanitation_before_project"
  model: model
  prompt: "Did you have to pay for sanitation facilities before?"
  options: [["yes", "Yes"], ["no", "No"], ["dontknow", "I don't know"]]
  conditional: ->
    model.get("is_sanitation_loan") == "yes"


questions.push new forms.RadioQuestion
  id: "sanitation_cost_before_project"
  model: model
  prompt: "Approximately how much per family member per day?"
  options: [["zero", "Nothing"], ["1orLessUSD", "Less than 1 USD"], ["1to3USD", "1 - 3 USD"], ["4to5USD", "4 - 5 USD"], ["5orMoreUSD", "More than 5 USD"], ["dontknow", "I don't know"]]
  conditional: ->
    model.get("paid_for_sanitation_before_project") == "yes"



questions.push new forms.RadioQuestion
  id: "paying_for_sanitation_now"
  model: model
  prompt: "Do you have to pay for sanitation facilities now?"
  options: [["yes", "Yes"], ["no", "No"], ["dontknow", "I don't know"]]
  conditional: ->
    model.get("is_sanitation_loan") == "yes" and model.get("construction_completed") == "yes"


questions.push new forms.RadioQuestion
  id: "sanitation_cost_now"
  model: model
  prompt: "How much do you pay now?"
  options: [["zero", "Nothing"], ["1orLessUSD", "Less than 1 USD"], ["1to3USD", "1 - 3 USD"], ["4to5USD", "4 - 5 USD"], ["5orMoreUSD", "More than 5 USD"], ["dontknow", "I don't know"]]
  conditional: ->
    model.get("paying_for_sanitation_now") == "yes"


questions.push new forms.RadioQuestion
  id: "satisfied_sanitation_after_project"
  model: model
  prompt: "Are you satisfied with your new toilet?"
  options: [["yes", "Yes"], ["no", "No"], ["dontknow", "I don't know"]]
  conditional: ->
    model.get("is_sanitation_loan") == "yes" and model.get("construction_completed") == "yes"


questions.push new forms.TextQuestion
  id: "why_satisfied_sanitation_after_project" 
  model: model
  prompt: "Why?"
  conditional: ->
    model.get("satisfied_sanitation_after_project") == "yes"


questions.push new forms.TextQuestion
  id: "why_not_satisfied_sanitation_after_project" 
  model: model
  prompt: "Why not?"
  conditional: ->
    model.get("satisfied_sanitation_after_project") == "no"


questions.push new forms.RadioQuestion
  id: "sanitation_time_to_construct"
  model: model
  prompt: "How long did it take for your sanitation product to be constructed?"
  options: [["1weekOrLess", "Less than a week"], ["4weekOrLess", "Less than a month"], ["12weekOrLess","Less than 3 months"], ["12weekOrMore", "Greater than 3 months"], ["dontknow", "I don't know"]]
  conditional: ->
    model.get("is_sanitation_loan") == "yes" and model.get("construction_completed") == "yes"


questions.push new forms.RadioQuestion
  id: "problems_with_construction"
  model: model
  prompt: "Were there any problems with the construction?"
  options: [["yes", "Yes"], ["no", "No"], ["dontknow", "I don't know"]]
  conditional: ->
    model.get("is_sanitation_loan") == "yes" and model.get("construction_completed") == "yes"


questions.push new forms.TextQuestion
  id: "explain_problems_with_construction" 
  model: model
  prompt: "Please explain?"
  conditional: ->
    model.get("problems_with_construction") == "yes"




questions.push new forms.RadioQuestion
  id: "use_alternative_sanitation"
  model: model
  prompt: "Do you or anyone in your household ever use alternative sanitation sources now?"
  options: [["yes", "Yes"], ["no", "No"], ["dontknow", "I don't know"]]
  conditional: ->
    model.get("is_sanitation_loan") == "yes" and model.get("construction_completed") == "yes"


questions.push new forms.TextQuestion
  id: "who_uses_alternative_sanitation" 
  model: model
  prompt: "Who uses alternative sanitation?"
  conditional: ->
    model.get("use_alternative_sanitation") == "yes"


questions.push new forms.TextQuestion
  id: "why_use_alternative_sanitation" 
  model: model
  prompt: "Why?"
  conditional: ->
    model.get("use_alternative_sanitation") == "yes"


questions.push new forms.CompositeQuestion
  id: "health_before_sanitation_project"
  model: model
  prompt: "What was the overall health of your family members before the new sanitation product was completed?"
  createContents: (submodel) ->
    [
      new forms.RadioQuestion
        id: "value"
        model: submodel
        style: "tabular"
        options: [["rarelySick", "Rarely sick"], ["oftenSick", "Often sick"], ["sickAlltheTime", "Sick all the time"], ["other","Other"]]
      new forms.TextQuestion
        id: "other"
        model: submodel
        style: "tabular"
        prompt: "Please Specify: "
        conditional: ->
          submodel.get("value") == "other"
    ]
  conditional: ->
    model.get("is_sanitation_loan") == "yes"


questions.push new forms.CompositeQuestion
  id: "health_after_sanitation_project"
  model: model
  prompt: "What is it like now?"
  createContents: (submodel) ->
    [
      new forms.RadioQuestion
        id: "value"
        model: submodel
        style: "tabular"
        options: [["rarelySick", "Rarely sick"], ["oftenSick", "Often sick"], ["sickAlltheTime", "Sick all the time"], ["other","Other"]]
      new forms.TextQuestion
        id: "other"
        model: submodel
        style: "tabular"
        prompt: "Please Specify: "
        conditional: ->
          submodel.get("value") == "other"
    ]
  conditional: ->
    model.get("is_sanitation_loan") == "yes" and model.get("construction_completed") == "yes"



questions.push new forms.Instructions
  text: "Further observations: Ask to see the sanitation facility and note the following:"
  model: model
  conditional: ->
    model.get("is_sanitation_loan") == "yes" and model.get("construction_completed") == "yes"

questions.push new forms.CompositeQuestion
  id: "pets"
  model: model
  prompt: "What type of sanitation improvement is it?"
  createContents: (submodel) ->
    [
      new forms.MulticheckQuestion

        id: "sanitation_type"
        model: model
        options: [
          ["householdToilet", "Household toilet connection"]
          ["toiletWithSeptic", "Toilet with septic tank"]
          ["pitLatrine", "Pit latrine"]
          ["VIPlatrine", "VIP latrine"]
          ["SanPlat", "SanPlat"]
          ["LeachPit", "Leach pit"]
          ["ecosanToilet", "Ecosan toilet"]
          ["biogasToilet", "Biogas toilet"]
          ["filterBedToilet", "Filter bed toilet"]
          ["other","Other"]
        ]
      new forms.TextQuestion
        id: "other"
        model: submodel
        style: "tabular"
        prompt: "Please Specify: "
        conditional: ->
          "other" in (submodel.get("values") or [])
    ]
  conditional: ->
    model.get("is_sanitation_loan") == "yes" and model.get("construction_completed") == "yes"



questions.push new forms.RadioQuestion
  id: "observed_sanitation_construction_complete"
  model: model
  prompt: "Is the construction complete?"
  options: [["yes", "Yes"], ["no", "No"], ["dontknow", "I don't know"]]
  conditional: ->
    model.get("is_sanitation_loan") == "yes" and model.get("construction_completed") == "yes"


questions.push new forms.RadioQuestion
  id: "observed_sanitation_functional"
  model: model
  prompt: "Does it work?"
  options: [["yes", "Yes"], ["no", "No"], ["dontknow", "I don't know"]]
  conditional: ->
    model.get("is_sanitation_loan") == "yes" and model.get("construction_completed") == "yes"


questions.push new forms.RadioQuestion
  id: "observed_sanitation_good_repair"
  model: model
  prompt: "Is it in good repair?"
  options: [["yes", "Yes"], ["no", "No"], ["dontknow", "I don't know"]]
  conditional: ->
    model.get("is_sanitation_loan") == "yes" and model.get("construction_completed") == "yes"


questions.push new forms.RadioQuestion
  id: "observed_sanitation_clean_maintained"
  model: model
  prompt: "Is it clean and well maintained?"
  options: [["yes", "Yes"], ["no", "No"], ["dontknow", "I don't know"]]
  conditional: ->
    model.get("is_sanitation_loan") == "yes" and model.get("construction_completed") == "yes"


questions.push new forms.TextQuestion
  id: "comments_sanitation_loans" 
  model: model
  prompt: "Comments"
  multiline: true

sections.push new forms.Section
  model: model
  title: "Questions for sanitation loans"
  contents: questions
  conditional: ->
    model.get("loan_purpose") and model.get("loan_purpose").value in ['Toilet', 'WaterAndSanitation']
questions = []

# END SECTION: Questions for sanitation loans

questions.push new forms.TextQuestion
  id: "comments_final" 
  model: model
  prompt: "Do you have any additional comments about the borrower or the loan?"
  multiline: true

sections.push new forms.Section
  model: model
  title: "Final Comments"
  contents: questions
questions = []


# END HERE ENTIRE SURVEY
view = new forms.Sections
  sections: sections
  model: model

return new forms.SurveyView
  model: model
  contents: [view]
