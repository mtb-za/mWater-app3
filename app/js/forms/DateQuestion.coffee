# TODO Fix to have editable YYYY-MM-DD with click to popup scroller

Question = require './Question'

module.exports = Question.extend
  events:
    change: "changed"

  changed: ->
    @model.set @id, @$el.find("input[name=\"date\"]").val()

  renderAnswer: (answerEl) ->
    answerEl.html _.template("<input class=\"needsclick\" name=\"date\" />", this)
    date = @model.get(@id)

    # Remove time
    if date
      date = date.substr(0, 10)
    answerEl.find("input").val date

    # Support readonly
    if @options.readonly
      answerEl.find("input").attr('readonly', 'readonly')
    else
      answerEl.find("input").scroller
        preset: "date"
        theme: "ios"
        display: "modal"
        mode: "scroller"
        dateOrder: "yymmD dd"
        dateFormat: "yy-mm-dd"
