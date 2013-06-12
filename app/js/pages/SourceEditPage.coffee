Page = require("../Page")

# Allows editing of source details
# TODO login required
module.exports = class SourceEditPage extends Page
  constructor: (ctx, _id) ->
    super(ctx)
    @_id = _id

  events: 
    'click #save_button': 'save'
    'click #cancel_button': 'cancel'

  activate: -> @render()

  render: ->
    @db.sources.findOne {_id: @_id}, (source) =>
      @source = source

      @setTitle "Edit Source #{source.code}"
      @$el.html templates['pages/SourceEditPage'](source:source)

  save: ->
    @source.name = @$("#name").val()
    @source.desc = @$("#desc").val()
    # TODO @source.source_type = parseInt(@$("#source_type").val()) || null

    @db.sources.upsert @source, => @pager.closePage()

  cancel: -> @pager.closePage()
