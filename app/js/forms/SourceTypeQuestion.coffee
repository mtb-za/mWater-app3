Question = require('./form-controls').Question

module.exports = exports.Question.extend({
    events : {
        "change" : "changed",
    },

    changed : function(e) {
        var val = $(e.target).val();
        if (val == "") {
            this.model.set(this.id, null);
        } else {
            var index = parseInt(val);
            var value = this.options.options[index][0];
            this.model.set(this.id, value);
        }
    },

    renderAnswer : function(answerEl) {
        answerEl.html(_.template('<select id="source_type"><%=renderDropdownOptions()%></select>', this));
    },

    renderDropdownOptions : function() {
        html = "";

        // Add empty option
        html += '<option value=""></option>';

        var i;
        for ( i = 0; i < this.options.options.length; i++) {
            html += _.template('<option value="<%=position%>" <%=selected%>><%-text%></option>', {
                position : i,
                text : this.options.options[i][1],
                selected : this.model.get(this.id) === this.options.options[i][0] ? 'selected="selected"' : ""
            });
        }

        return html;
    }

});


  exports.Question.extend(
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