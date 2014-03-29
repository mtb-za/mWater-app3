Page = require '../Page'

# Allows importing of data from CSV
module.exports = class PreviewImportSourcesPage extends Page
  @canOpen: (ctx) -> ctx.auth.insert("sources")

  events:
    "click #import" : "import"

  create: ->
    @setTitle T("Preview Sources")
    @$el.html templates['pages/PreviewImportSourcesPage'](sources:@options.sources)

  import: ->
    if not confirm(T("Import sources? This cannot be undone."))
      return
      
    insertSources = =>
      # TODO Assumes upsert is synchronous
      for source in @options.sources
        @db.sources.upsert source

      alert(T("{0} sources inserted", @options.sources.length))
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
          _.defer =>
            process(_.rest(remaining))
        else
          insertSources()
      error = =>
        alert(T("Unable to generate source id. Please ensure that you have a connection or use Settings to obtain more before going out of connection range."))
        @pager.closePage()

      # Ensure enough source codes for remaining
      @sourceCodesManager.replenishCodes remaining.length, =>
        @sourceCodesManager.requestCode(success, error)
      , error
          
    process(@options.sources)
  
    
