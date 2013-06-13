module.exports = exports.Question.extend(
  events:
    change: "changed"

  changed: ->
    @model.set @id, @$el.find("input[name=\"date\"]").val()

  renderAnswer: (answerEl) ->
    answerEl.html _.template("<input class=\"needsclick\" name=\"date\" />", this)
    answerEl.find("input").val @model.get(@id)
    answerEl.find("input").scroller
      preset: "date"
      theme: "ios"
      display: "modal"
      mode: "scroller"
      dateOrder: "mmD ddyy"

)