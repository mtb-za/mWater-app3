Question = require('./form-controls').Question

module.exports = Question.extend
  # Check that all questions validate
  validateInternal: ->
    # Add subquestions
    for q in @subquestions
      val = q.validate()
      if val
        return val
    return null

  update: ->
    # Only update if different 
    if not _.isEqual(@model.get(@id), @submodel.toJSON())
      @submodel.clear()
      @submodel.set(@model.get(@id) || {})

  renderAnswer: (answerEl) ->
    answerEl.html _.template("<div class=\"subquestions\"></div>")

    # Create submodel
    @submodel = new Backbone.Model(@model.get(@id))

    # Wire submodel changes to model
    @submodel.on "change", =>
      # Only set if different 
      if not _.isEqual(@model.get(@id), @submodel.toJSON())
        @model.set(@id, @submodel.toJSON())

    # Create subquestions
    @subquestions = @options.createSubquestions(@submodel)

    # Add subquestions
    for q in @subquestions
      answerEl.find(".subquestions").append(q.el)

