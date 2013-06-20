module.exports = Backbone.View.extend
  initialize: ->
    @$el.html _.template('''
      <div class="well well-small"><%=html%><%-text%></div>
      ''')(html: @options.html, text: @options.text)
