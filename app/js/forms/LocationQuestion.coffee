Question = require('./form-controls').Question
LocationView = require ("../LocationView")

module.exports = Question.extend
  renderAnswer: (answerEl) ->
    # Remove old location view
    if @locationView?
      @locationView.remove()

    # Create location view
    @locationView = new LocationView(loc: @model.get(@id), readonly: @options.readonly, hideMap: true)

    answerEl.append(@locationView.el)
