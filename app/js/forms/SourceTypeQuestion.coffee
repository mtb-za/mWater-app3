Question = require './Question'

module.exports = exports.Question.extend(
  events:
    change: "changed"

  changed: (e) ->
    val = $(e.target).val()
    if val is ""
      @model.set @id, null
    else
      index = parseInt(val)
      value = @options.options[index][0]
      @model.set @id, value

  renderAnswer: (answerEl) ->
    answerEl.html _.template("<select id=\"source_type\" class=\"form-control\"><%=renderDropdownOptions()%></select>", this)

  renderDropdownOptions: ->
    html = ""
    
    # Add empty option
    html += "<option value=\"\"></option>"
    for i in [0...@options.options.length]
      html += _.template("<option value=\"<%=position%>\" <%=selected%>><%-text%></option>",
        position: i
        text: @options.options[i][1]
        selected: (if @model.get(@id) is @options.options[i][0] then "selected=\"selected\"" else "")
      )
    return html
)