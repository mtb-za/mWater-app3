Question = require './Question'

# Question that must be answered with units

module.exports = Question.extend
  events:
    "change": "changed"

  renderAnswer: (answerEl) ->
    answerEl.html templates['forms/UnitQuestion'](
      units: @options.units, prefix: @options.prefix)

    # Set values
    @update()

  update: ->
    answer = @model.get @id
    
    @$("#value").val(if answer? and answer.value? then answer.value else "")
    @$("#unit").val(if answer? and answer.unit? then answer.unit else "")

  setUnits: (units) ->
    @options.units = units
    @render()

  changed: (e) ->
    value = @$("#value").val()
    unit = @$("#unit").val()

    value = parseFloat(value)
    if isNaN(value)
      value = null

    # Set answer
    answer = 
      value: value
      unit: if unit then unit else null

    @model.set @id, answer

  validateInternal: ->
    value = @$("#value").val()
    if value.length > 0
      if isNaN(parseFloat(value))
        return "Invalid decimal number"

    if value and not @$("#unit").val()
      return "Specify units"

    return null
