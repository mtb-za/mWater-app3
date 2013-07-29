parseManifest = require "parse-appcache-manifest"

# origUrl: base url of files. Must end in "/"
# updateUrl: update url of files. Must end in "/"
# cachePath: folder of cache. Must not end in "/"
module.exports = class AppUpdater
  constructor: (fs, fileTransfer, origUrl, updateUrl, cachePath) ->
    @fs = fs
    @fileTransfer = fileTransfer
    @origUrl = origUrl
    @updateUrl = updateUrl
    @cachePath = cachePath

  # Get launch folder. Url in success will end with "/"
  launch: (success, error) ->
    # Get directory of cache path
    @fs.root.getDirectory @cachePath + "/update", {}, (dir) =>
      # Check that stored orig manifest matches current orig
      q = $.get(@origUrl + "manifest.appcache")
      q.fail error
      q.done (manifestOrig) =>
        @fs.root.getDirectory @cachePath, {}, (cacheDir) =>
          q = $.get(cacheDir.toURL() + "/manifest.appcache")
          q.fail error
          q.done (manifestAtUpdate) =>
            # If orig manifest has changed since update downloaded, use original
            if manifestOrig != manifestAtUpdate
              success(@origUrl)
            else
              # Return update folder
              success(dir.toURL() + "/")
        , error
    , =>
      # Dir not present, use original
      success(@origUrl)

  # Update app. success will called with:
  # "noconnection": update failed
  # "uptodate": no update available
  # "relaunch": update installed, relaunch needed
  update: (success, error) ->
    # Get manifest from update
    q = $.get(@updateUrl + "manifest.appcache")
    q.fail =>
      success("noconnection")
    q.done (manifest) =>
      # Check if manifest changed from current
      @launch (currentUrl) =>
        q = $.get(currentUrl + "manifest.appcache")
        q.fail =>
          error("Can't get current manifest")
        q.done (manifestCurrent) =>
          if manifest == manifestCurrent
            return success("uptodate")

          # Parse manifest
          list = parseManifest(manifest).cache

          # Add manifest.appcache to list
          list.push "manifest.appcache"

          # Download all items
          downloadFiles @fs, list, @updateUrl, @cachePath + "/download", @fileTransfer, =>
            removeSuccess = =>
              # Copy original manifest to update root folder
              @fileTransfer.download encodeURI(@origUrl + "manifest.appcache"), @cachePath + "/manifest.appcache", =>
                # Move directory download to update
                @fs.root.getDirectory @cachePath + "/download", {}, (downloadDir) =>
                  # Get parent dir
                  downloadDir.getParent (parentDir) =>
                    # Perform move
                    downloadDir.moveTo parentDir, "update", (updateDir) =>
                      # Call success with relaunch
                      success("relaunch")
                    , error
                  , error
                , error
              , error

            # Check that manifest is unchanged
            q = $.get(@updateUrl + "manifest.appcache")
            q.fail =>
              success("noconnection")
            q.done (manifest2) =>
              if manifest != manifest2
                return success("noconnection")

              # Remove update folder if present
              @fs.root.getDirectory @cachePath + "/update", {}, (dir) =>
                dir.removeRecursively removeSuccess, error
              , removeSuccess
          , =>
            success("noconnection")
      , error

createDirs = (baseDirEntry, path, success, error) ->
  segs = path.split("/")
  if segs.length is 1
    baseDirEntry.getDirectory segs[0],
      create: true
    , success, error
  else
    baseDirEntry.getDirectory segs[0],
      create: true
    , ((dir) =>
      createDirs dir, segs.slice(1).join("/"), success, error
    ), error

downloadFiles = (fs, list, source, target, fileTransfer, success, error) ->
  # Get target
  item = _.first(list)
  if not item
    return success()

  dest = target + "/" + item

  # Get parent dir
  parent = _.initial(dest.split("/")).join("/")
  createDirs fs.root, parent, (parentDirEntry) =>
    # Download file
    fileTransfer.download encodeURI(source + item), dest, =>
      # Download next
      downloadFiles(fs, _.rest(list), source, target, fileTransfer, success, error)
    , error 
  , error
