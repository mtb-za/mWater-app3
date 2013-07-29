

module.exports = class AppUpdater
  constructor: (origUrl, updateUrl, fs, cachePath) ->
    @origUrl = origUrl
    @updateUrl = updateUrl
    @fs = fs
    @cachePath = cachePath

  launch: (success, error) ->
    success(@origUrl)

  update: (success, error) ->
    success("uptodate")