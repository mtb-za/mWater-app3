Question = require('./form-controls').Question
SourceListPage = require '../pages/SourceListPage'
sourcecodes = require '../sourcecodes'

module.exports = Question.extend
  renderAnswer: (answerEl) ->
    answerEl.html '''
      <div class="input-append">
        <input type="tel">
        <button class="btn" id="select" type="button">Select</button>
      </div>'''
    answerEl.find("input").val @model.get(@id)

  events:
    'change' : 'changed'
    'click #select' : 'selectSource'

  changed: ->
    @model.set @id, @$("input").val()

  selectSource: ->
    @ctx.pager.openPage SourceListPage, 
      { onSelect: (source)=>
        @model.set @id, source.code
      }

  validateInternal: ->
    if not @$("input").val()
      return false

    if sourcecodes.isValid(@$("input").val())
      return false

    return "Invalid Source"

