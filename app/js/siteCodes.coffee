siteCodes = require("mwater-common").siteCodes

exports.SiteCodesManager = class SiteCodesManager 
  # URL to obtain more codes from
  constructor: (options) ->
    @url = url
    @storage = storage

  # Default cutoff is three months in future
  defaultCutoff = ->
    cutoff = new Date()
    cutoff.setDate(cutoff.getDate() + 30*3)
    return cutoff.toISOString()

  # Gets list of cached site codes in form { code:<code>, expiry:<expiry in ISO datetime> }
  getLocalCodes: ->
    if @storage?
      return []  unless @storage.get("v3.sitecodes")
      JSON.parse @storage.get("v3.sitecodes")
    else
      return []
  
  # Sets list of cached site codes in form { code:<code>, expiry:<expiry in ISO datetime> }
  setLocalCodes: (codes) ->
    if @storage?
      @storage.set("v3.sitecodes", JSON.stringify(codes))
  
  # Purge expired code
  purgeCodes: (cutoff) ->
    @setLocalCodes _.reject(@getLocalCodes(), (item) ->
      item.expiry < cutoff
    )
  
  # Replenish codes from server to have a minimum of x available
  replenishCodes: (minNumber, success, error, cutoff) ->
    cutoff = cutoff or defaultCutoff()
    
    # Purge old codes
    @purgeCodes cutoff
    
    # Determine how many are needed
    numNeeded = minNumber - @getLocalCodes().length
    
    # If have enough
    if numNeeded <= 0
      success()
      return
    
    # Request new codes
    req = $.ajax(@url, {
      data : JSON.stringify({ number: numNeeded }),
      contentType : 'application/json',
      type : 'POST'})
    req.done (data, textStatus, jqXHR) =>
      # Add to local storage
      @setLocalCodes @getLocalCodes().concat(data)
      success()
    req.fail (jqXHR, textStatus, errorThrown) =>
      if error
        error(errorThrown)

  getNumberAvailableCodes: (cutoff) ->
    cutoff = cutoff or defaultCutoff()
    @purgeCodes cutoff
    @getLocalCodes().length

  requestCode: (success, error, cutoff) ->
    # Replenish codes to have at least one
    @replenishCodes 1, (=>
      codes = @getLocalCodes()
      
      # Remove first code
      @setLocalCodes _.rest(codes)
      success _.first(codes).code
    ), error, cutoff

  
  # Reset all codes cached
  reset: ->
    @setLocalCodes []

# Fake site codes manager that returns valid, but non-unique codes
exports.DemoSiteCodesManager = class DemoSiteCodesManager
  constructor: ->
    @numAvail = 10

  getNumberAvailableCodes: (cutoff) ->
    return @numAvail

  requestCode: (success, error, cutoff) ->
    success(siteCodes.seqToCode(Math.round(Math.random()*1000000)))

  replenishCodes: (minNumber, success, error, cutoff) ->
    @numAvail = minNumber
    success()
