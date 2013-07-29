# TODO id, not uid

createUid = -> 
  'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, (c) ->
    r = Math.random()*16|0
    v = if c == 'x' then r else (r&0x3|0x8)
    return v.toString(16)
   )

resolveLocalFileSystemURI = window.resolveLocalFileSystemURI || window.resolveLocalFileSystemURL || window.webkitResolveLocalFileSystemURL

# cachePath: e.g. "Android/data/co.mwater.clientapp/images" 
# apiUrl: e.g. http://api.mwater.co/v3/
module.exports = class CachedImageManager
  constructor: (fs, apiUrl, cachePath, client, fileTransfer) ->
    @fs = fs
    @apiUrl = apiUrl
    @cachePath = cachePath
    @client = client
    @fileTransfer = fileTransfer

  addImage: (url, success, error) ->
    # Create an id
    id = createUid()

    # Get file
    resolveLocalFileSystemURI url, (fileEntry) =>
      # Move file
      @getDirectory @cachePath + "/pending/original", (dirEntry) ->
        console.log "Moving file to: " + dirEntry.fullPath + "/" + id + ".jpg"
        fileEntry.moveTo dirEntry, id + ".jpg", =>
          success(id)
        , error
      , error
    , error
      
  # Gets a directory, creating if necessary. Call success with dirEntry
  getDirectory: (dir, success, error) ->
    @createDirs @fs.root, dir, success, error

  createDirs: (baseDirEntry, path, success, error) ->
    segs = path.split("/")
    if segs.length is 1
      baseDirEntry.getDirectory segs[0],
        create: true
      , success, error
    else
      baseDirEntry.getDirectory segs[0],
        create: true
      , ((dir) =>
        @createDirs dir, segs.slice(1).join("/"), success, error
      ), error

  # Gets an image, calling success with url 
  getImageUrl: (imageUid, success, error) ->
    console.log "getImageUrl:" + imageUid
    @loadOrDownloadImage [@cachePath + "/cached/1280h", @cachePath + "/cached/original", @cachePath + "/pending/original"],
      @apiUrl + "images" + "/" + imageUid + "?h=1280", 
      @cachePath + "/cached/1280h", 
      imageUid, success, error

  # Gets a thumbnail image, calling success with url 
  getImageThumbnailUrl: (imageUid, success, error) ->
    console.log "getImageThumbnailUrl:" + imageUid
    @loadOrDownloadImage [@cachePath + "/cached/160h", @cachePath + "/cached/1280h", @cachePath + "/cached/original", @cachePath + "/pending/original"],
      @apiUrl + "images" + "/" + imageUid + "?h=160", 
      @cachePath + "/cached/160h", 
      imageUid, success, error

  loadOrDownloadImage: (dirs, remoteUrl, downloadDir, imageUid, success, error) ->
    # If no directories left to try, call download
    if dirs.length is 0
      @getDirectory downloadDir, ((dirEntry) =>
        @downloadImage imageUid, remoteUrl, dirEntry, success, error
      ), error
      return
    
    # Try each directory in dirs, using recursion
    @findImageFile _.first(dirs), imageUid, ((url) -> # Found
      success url
    ), ((url) => # Not found
      @loadOrDownloadImage _.rest(dirs), remoteUrl, downloadDir, imageUid, success, error
    ), error

  downloadImage: (imageUid, url, dirEntry, success, error) ->
    @fileTransfer.download encodeURI(url), dirEntry.fullPath + "/" + imageUid + ".jpg", ((entry) ->
      success entry.toURL()
    ), (err) ->
      # Delete file on disk if present
      dirEntry.getFile imageUid + ".jpg", {}, ((imageFile) ->
        imageFile.remove (->
        ), ->
      ), ->
      # Call error function
      error(err)

  findImageFile: (dir, imageUid, found, notfound, error) ->
    console.log "checking in: " + dir
    
    # Get directory
    @getDirectory dir, ((dirEntry) ->
      
      # Get file if present
      dirEntry.getFile imageUid + ".jpg", {}, ((imageFile) ->
        
        # File present, display file
        found imageFile.toURL()
      ), (err) ->
        if err.code is FileError.NOT_FOUND_ERR
          notfound()
        else
          error err
    ), error


  # Upload one image to server. Success is called with number of images remaining.
  upload: (success, error) ->
    # Copy file to pending folder
    @getDirectory @cachePath + "/pending/original", (dirEntry) =>
      
      # Get a list of all the entries in the directory
      dirEntry.createReader().readEntries (files) =>
        if files.length is 0
          success 0
          return
       
        uploadSuccess = =>
          # Success uploading, move to cache
          @getDirectory @cachePath + "/cached/original", (dirEntry) ->
            files[0].moveTo dirEntry, files[0].name, ->
              # File moves, call success
              success files.length - 1
            , error
          , error

        uploadError = (fileTransferError) ->
          if fileTransferError.http_status is 409
            # Image already exists, delete file
            # Success uploading, delete file
            files[0].remove ->
              # File removed, call success
              success files.length - 1
            , error
          else
            error fileTransferError

        # Upload file
        @fileTransfer.upload files[0].fullPath, 
          encodeURI(@apiUrl + files[0].name.split(".")[0] + "?client=" + @client), 
          uploadSuccess, uploadError, { fileKey: "image" }
      , error
    , error
