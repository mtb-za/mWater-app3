Question = require './Question'
siteCodes = require('mwater-common').siteCodes

module.exports = Question.extend
  renderAnswer: (answerEl) ->
    answerEl.html '''
      <div class="input-group">
        <input type="tel" class="form-control">
        <span class="input-group-btn"><button class="btn btn-default" id="select" type="button">Select</button></span>
      </div>
      '''
    answerEl.find("input").val @model.get(@id)

  events:
    'change' : 'changed'
    'click #select' : 'selectSource'

  changed: ->
    @model.set @id, @$("input").val()

  selectSource: ->
    # Moved here for browserify circularity problem
    SiteListPage = require '../pages/SiteListPage'
    @ctx.pager.openPage SiteListPage, 
      { onSelect: (source)=>
        @model.set @id, source.code
      }

  validateInternal: ->
    if not @$("input").val()
      return false

    if siteCodes.isValid(@$("input").val())
      return false

    return "Invalid Source"

