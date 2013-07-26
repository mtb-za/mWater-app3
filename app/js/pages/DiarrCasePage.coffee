Page = require '../Page'
forms = require '../forms'

# Allows creating/editing of cases
# Options are 
# _id: id of case

module.exports = class DiarrCasePage extends Page
  create: ->
    @setTitle "Report Diarrhea Case"

    # Find case
    if @options._id
      @db.diarr_cases.findOne {_id: @options._id}, (diarrCase) =>
        @diarrCase = diarrCase
        @render()
    else
      # New case, just render
      # if not @auth.insert("source_notes")
      #   return @pager.closePage()
      @render()

  deactivate: ->
    @scrollPos = $("body").scrollTop()

  activate: ->
    if @scrollPos?
      $("body").scrollTop(@scrollPos)

  render: ->
    # Create model 
    @model = new Backbone.Model()

    # Create questions
    readonly = false #@sourceNote? and not @auth.update("source_notes", @sourceNote)

    questions = []
    
    questions.push new forms.DateQuestion
      id: 'date'
      model: @model
      prompt: 'Date of Diarrheal Case:'
      required: true
      readonly: readonly

    questions.push new forms.NumberQuestion
      id: 'num_cases'
      model: @model
      prompt: 'How many cases of diarrheal disease are you reporting?'
      required: true
      readonly: readonly

    questions.push new forms.RadioQuestion
      id: "age_patients"
      model: @model
      prompt: "Age of the patient(s)"
      options: [
        ["0-29day", "0-29 days"]
        ["1mo-5yr", "1 month to 5 years"]
        ["5-15yr", "5 - 15 years"]
        ["16-35yr", "16 - 35 years"]
        ["36-59yr", "36 - 59 years"]
        ["60+yr", "60+ years"]
      ]

    questions.push new forms.CheckQuestion
      id: "report_symptoms"
      model: @model
      prompt: "Would you like to report symptoms?"
      text: "Report Symptoms"

    questions.push new forms.MulticheckQuestion
      id: 'gastro_symptoms'
      model: @model
      prompt: 'Gastrointestinal symptoms (check all that apply):'
      options: [
        ['3+loose_day', '3 or more loose stools in 24 hours']
        ['watery', 'Watery stools']
        ['bloody', 'Bloody stools']
        ['persistent', 'Persistent diarrhea']
        ['nausea','Nausea']
        ['vomiting','Vomiting']
      ]
      readonly: readonly
      conditional: (m) =>
        m.get('report_symptoms')

    questions.push new forms.MulticheckQuestion
      id: 'other_symptoms'
      model: @model
      prompt: 'Other symptoms (check all that apply):'
      options: [
        ['fever', 'Fever'],
        ['chills', 'Chills'],
        ['abdominal_pain', 'Abdominal pain'],
        ['weakness', 'Weakness']
        ['dizziness','Dizziness / lightheadedness']
        ['dehydration','Dehydration']
      ]
      readonly: readonly
      conditional: (m) =>
        m.get('report_symptoms')

    questions.push new forms.RadioQuestion
      id: "when_symptoms"
      model: @model
      prompt: "When did these symptoms begin?"
      options: [
        ["today", "Today"]
        ["yesterday", "Yesterday"]
        ["1-3daysago", "1-3 days ago"]
        ["1weekago", "1 week ago"]
      ]
      conditional: (m) =>
        m.get('report_symptoms')

    questions.push new forms.MapQuestion
      id: "patient_home"
      model: @model
      ctx: @ctx
      prompt: "Where does the patient live?"

    questions.push new forms.MapQuestion
      id: "patient_water_source"
      model: @model
      ctx: @ctx
      prompt: "Where does the patient get their water?"

    questions.push new forms.TextQuestion
      id: 'notes'
      model: @model
      prompt: 'Notes'
      multiline: true
      readonly: readonly

    # Create form
    if readonly
      form = new forms.QuestionGroup
        contents: questions
    else
      form = new forms.SaveCancelForm
        contents: questions

      @listenTo form, 'save', =>
        @db.diarr_cases.upsert @model.toJSON(), => 
          @pager.closePage()
          code = @model.get("code")
          @pager.flash "Case #{code} recorded", "success"

      @listenTo form, 'cancel', =>
        @pager.closePage()

    # Load form from source note if exists
    if @diarrCase
      @model.set(@diarrCase)
    else
      @diarrCase = { 
        date: new Date().toISOString().substring(0,10)
        code: @login.user + "-" + createBase32TimeCode(new Date())
        num_cases: 1
        #patient_home: {"type":"Point","properties":{"accuracy":371.19847642008966},"coordinates":[-73.68152618408203,45.542426976793855]}
      }

      # Create default entry
      @model.set(@diarrCase)

    # Render diarrCase page
    @$el.html templates['pages/DiarrCasePage'](diarrCase: @diarrCase)
    @$("#form_view").append(form.el)


# Create a base32 time code to write on cases
createBase32TimeCode = (date) ->
  # Characters to use (skip 1, I, 0, O)
  chars = "23456789ABCDEFGHJLKMNPQRSTUVWXYZ"

  # Subtract date from July 1, 2013
  base = new Date(2013, 6, 1, 0, 0, 0, 0)

  # Get seconds since
  diff = Math.floor((date.getTime() - base.getTime()) / 1000)

  # Convert to array of base 32 characters
  code = ""

  while diff >= 1
    num = diff % 32
    diff = Math.floor(diff / 32)
    code = chars[num] + code

  return code

