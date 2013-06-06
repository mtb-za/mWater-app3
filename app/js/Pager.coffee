

class Pager extends Backbone.View
  constructor: (ctx) ->
    super()

    # Context contains pager
    ctx.pager = this

    # Save context
    @ctx = ctx

    @stack=[]

  # Adds a page from a constructor
  openPage: (pageClass, args...) ->
    # Create page
    page = new pageClass(@ctx, args...)
    
    # Deactivate current page
    if @stack.length > 0
      _.last(@stack).deactivate()
      _.last(@stack).$el.detach()

    # Activate new page
    @stack.push(page)
    page.start()
    page.activate()
    @$el.append(page.el)

    # Indicate page change
    @trigger 'change'

  closePage: (replaceWith, args) ->
    # Prevent closing last page
    if not replaceWith and @stack.length <= 1
      return

    # Destroy current page
    _.last(@stack).deactivate()
    _.last(@stack).stop()
    _.last(@stack).remove()
    @stack.pop()

    # Open replaceWith
    if replaceWith
      @openPage replaceWith, args
    else
      page = _.last(@stack)
      page.activate()
      @$el.append(page.el)

    # Indicate page change
    @trigger 'change'

  # Get title of active page
  title: ->
    _.last(@stack).title()

  # Determine if has multiple pages
  multiplePages: ->
    @stack.length > 1

module.exports = Pager