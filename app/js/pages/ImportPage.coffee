Page = require '../Page'
SourceCSV = require '../conversion/SourceCSV'
PreviewImportSourcesPage = require './PreviewImportSourcesPage'

# Allows importing of data from CSV
module.exports = class ImportPage extends Page
  @canOpen: (ctx) -> ctx.auth.insert("sources")

  events:
    "click #preview_sources_csv" : "previewSourcesCSV"

  create: ->
    @setTitle "Import"
    @$el.html templates['pages/ImportPage']()

  previewSourcesCSV: ->
    # Get types
    @db.source_types.find({}).fetch (sourceTypes) =>
      sourceCSV = new SourceCSV(_.pluck(sourceTypes, "code"))

      try
        sources = sourceCSV.import($("#sources_csv").val())
        @pager.openPage(PreviewImportSourcesPage, { sources: sources })
      catch error
        alert("Error in data\n" + error.message)
