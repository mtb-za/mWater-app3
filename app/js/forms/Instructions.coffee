module.exports = Backbone.View.extend
  initialize: ->
    @$el.html _.template('''
      <div class="well well-small"><%=html%><%-text%></div>
      ''')(html: @options.html, text: @options.text)

    # Adjust visibility based on model
    @model.on("change", @updateVisibility, @)

    #Starts visible
    @visible = true

  updateVisibility: (e) ->
      # slideUp/slideDown
      if @shouldBeVisible() and not @visible
          @$el.slideDown()
      if @shouldBeVisible() and @visible
          @$el.slideUp()
      @visible = @shouldBeVisible()

  shouldBeVisible: ->
      if not this.options.conditional
          return true
      # Test equality to handle undefined more gracefully
      return @options.conditional(this.model) == true
  