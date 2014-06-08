parseManifest = require "parse-appcache-manifest"

# origUrl: base url of files. Must end in "/" or be ""
# updateUrl: update url of files. Must end in "/"
# cachePath: folder of cache. Must not end in "/"
module.exports = class AppUpdater
  constructor: (fs, fileTransfer, origUrl, updateUrl, cachePath) ->
    @fs = fs
    @fileTransfer = fileTransfer
    @origUrl = origUrl
    @updateUrl = updateUrl
    @cachePath = cachePath

    # Add events
    _.extend(this, Backbone.Events)


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

  # Update app. success will called with (status, message)
  # Status:
  # "noconnection": update failed
  # "uptodate": no update available
  # "relaunch": update installed, relaunch needed
  update: (success, error) ->
    # Get manifest from update
    q = $.get(@updateUrl + "manifest.appcache")
    q.fail =>
      success("noconnection", "Failed to get: " + @updateUrl + "manifest.appcache")
    q.done (manifest) =>
      # Check if manifest changed from current
      @launch (currentUrl) =>
        q = $.get(currentUrl + "manifest.appcache")
        q.fail =>
          error("Can't get current manifest: " + currentUrl + "manifest.appcache")
        q.done (manifestCurrent) =>
          if manifest == manifestCurrent
            return success("uptodate", "manifest unchanged")

          # Parse manifest
          list = parseManifest(manifest).cache

          # Add manifest.appcache to list
          list.push "manifest.appcache"

          # Download all items
          downloadFiles @fs, list, list.length, @updateUrl, @cachePath + "/download", @fileTransfer, =>
            console.log "Success called on download" # REMOVE
            removeSuccess = =>
              # Copy original manifest to update root folder
              source = encodeURI(@origUrl + "manifest.appcache")
              target = @fs.root.toURL() + "/" + @cachePath + "/manifest.appcache"
              console.log "Copying original manifest from #{source} to #{target}..." # REMOVE
              @fileTransfer.download source, target, =>

                # Move directory download to update
                console.log "Getting directory of download..." # REMOVE
                @fs.root.getDirectory @cachePath + "/download", {}, (downloadDir) =>
  
                  # Get parent dir
                  console.log "Getting parent directory of download..." # REMOVE
                  downloadDir.getParent (parentDir) =>

                    # Perform move
                    console.log "Performing move..." # REMOVE
                    downloadDir.moveTo parentDir, "update", (updateDir) =>
                      # Call success with relaunch
                      success("relaunch")
                    , error
                  , error
                , error
              , error

            # Check that manifest is unchanged
            console.log "Checking manifest unchanged..." # REMOVE
            q = $.get(@updateUrl + "manifest.appcache")
            q.fail =>
              success("noconnection", "Failed to get (2nd time): " + @updateUrl + "manifest.appcache")
            q.done (manifest2) =>
              if manifest != manifest2
                return success("noconnection", "Manifest changed during update")

              # Remove update folder if present
              console.log "Removing update folder..." # REMOVE
              @fs.root.getDirectory @cachePath + "/update", {}, (dir) =>
                dir.removeRecursively removeSuccess, error
              , removeSuccess
          , (err) =>
            success("noconnection", "Download failed: " + JSON.stringify(err))
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

downloadFiles = (fs, list, total, source, target, fileTransfer, success, error) ->
  # Get target
  item = _.first(list)
  if not item
    console.log "Downloads complete" # REMOVE
    return success()

  dest = target + "/" + item

  console.log "Downloading #{item} from #{source} to #{dest}..." # REMOVE

  # Get parent dir
  parent = _.initial(dest.split("/")).join("/")
  createDirs fs.root, parent, (parentDirEntry) =>
    # Download file
    fileTransfer.download encodeURI(source + item), fs.root.toURL() + "/" + dest, =>
      # Trigger progress event with percentage
      @trigger "progress", (total - list.length + 1) * 100 / total

      # Download next
      downloadFiles(fs, _.rest(list), total, source, target, fileTransfer, success, error)
    , error 
  , error
