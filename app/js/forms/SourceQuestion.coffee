
Question = require('./form-controls').Question

module.exports = Question.extend
  renderAnswer: (answerEl) ->
    answerEl.html '''
      <div class="input-append">
        <input type="tel">
        <button class="btn" type="button">Select...</button>
      </div>'''
    answerEl.find("input").val @model.get(@id)

  events:
    change: "changed"

  changed: ->
    @model.set @id, @$("input").val()
