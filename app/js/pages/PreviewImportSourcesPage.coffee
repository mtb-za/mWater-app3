Page = require '../Page'

# Allows importing of data from CSV
module.exports = class PreviewImportSourcesPage extends Page
  @canOpen: (ctx) -> ctx.auth.insert("sources")

  events:
    "click #import" : "import"

  create: ->
    @setTitle "Preview Sources"
    @$el.html templates['pages/PreviewImportSourcesPage'](sources:@options.sources)

  import: ->
    if not confirm("Import sources? This cannot be undone.")
      return
      
    insertSources = =>
      for source in @options.sources
        @db.sources.upsert source

      alert("#{this.options.sources.length} sources inserted")
      @pager.closePage()
      @pager.closePage()

    # Request codes
    process = (remaining) =>
      success = (code) =>
        source = _.first(remaining)
        source.code = code
        source.user = @login.user
        source.org = @login.org

        if remaining.length > 1
          process(_.rest(remaining))
        else
          insertSources()
      error = =>
        alert("Unable to generate source id. Please ensure that you have a connection or use Settings to obtain more before going out of connection range.")
        @pager.closePage()

      @sourceCodesManager.requestCode(success, error)
          
    process(@options.sources)
